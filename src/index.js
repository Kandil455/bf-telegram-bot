// Entry point. Chooses polling (local development) or webhook (production), picks the
// store (Redis when REDIS_URL is set, otherwise file or memory), runs the reminder loop,
// and shuts down cleanly.

import fs from "node:fs";

// Automatically load .env if present on disk
if (typeof process.loadEnvFile === "function" && fs.existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {}
}

import { createApp } from "./bot.js";
import { ConfigError, loadConfig } from "./config.js";
import { createRedisStore } from "./store/redis.js";
import { createStore } from "./services/store.js";
import { startReminderLoop } from "./features/reviews.js";
import { createHttpServer } from "./server.js";
import { loadPremiumSet } from "./features/emoji-sync.js";

const log = {
  info: (...a) => console.log(new Date().toISOString(), "[info]", ...a),
  warn: (...a) => console.warn(new Date().toISOString(), "[warn]", ...a),
  error: (...a) => console.error(new Date().toISOString(), "[error]", ...a),
};

const UPDATES = ["message", "callback_query", "pre_checkout_query", "poll_answer"];

async function main() {
  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      log.error(`Configuration: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const store = cfg.redisUrl
    ? await createRedisStore({ url: cfg.redisUrl, logger: log })
    : createStore({ dataDir: cfg.dataDir || null });
  log.info(cfg.redisUrl ? "store: redis (write-behind)" : cfg.dataDir ? `store: file (${cfg.dataDir})` : "store: memory");

  const app = createApp(cfg, { store, logger: log });
  const { bot, router } = app;
  await bot.init();
  cfg.botUsername = bot.botInfo.username;
  // Premium icons: filled in place, so every keyboard and message that holds this object sees them.
  Object.assign(cfg.premiumEmoji, await loadPremiumSet({ api: bot.api, setName: cfg.premiumEmojiSet, logger: log }));

  const stopReminders = startReminderLoop(
    () => router.sendReminders().then(() => router.sendRenewalNotices()),
    10 * 60 * 1000
  );
  const server = createHttpServer({ bot, cfg, admin: app.admin, cash: app.cash, app: app.appApi, logger: log });

  const shutdown = async (signal) => {
    log.info(`received ${signal}, shutting down`);
    stopReminders();
    server.close();
    if (cfg.mode === "polling") await bot.stop();
    if (cfg.redisUrl) await store.close();
    else store.flush();
    process.exit(0);
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  if (cfg.mode === "polling") {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    server.listen(cfg.port, () => log.info(`http on :${cfg.port} (admin: ${cfg.adminToken ? "on" : "off"})`));
    log.info(`@${cfg.botUsername} polling`);
    await bot.start({ allowed_updates: UPDATES, onStart: (me) => log.info(`@${me.username} is live (polling)`) });
    return;
  }

  await bot.api.setWebhook(cfg.publicUrl, { secret_token: cfg.webhookSecret, allowed_updates: UPDATES });
  server.listen(cfg.port, () => log.info(`@${cfg.botUsername} is live (webhook) on :${cfg.port}`));
}

main().catch((err) => {
  log.error("fatal:", err?.stack || err);
  process.exit(1);
});
