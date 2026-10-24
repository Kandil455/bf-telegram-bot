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
  const { bot, router, aiMetrics } = app;
  await bot.init();
  cfg.botUsername = bot.botInfo.username;
  // Premium icons: filled in place, so every keyboard and message that holds this object sees them.
  Object.assign(cfg.premiumEmoji, await loadPremiumSet({ api: bot.api, setName: cfg.premiumEmojiSet, logger: log }));

  // Admin report once a day, at 08:00 Cairo time (the router marks each day as sent).
  const dailyReport = () => {
    let cairoHour = 8;
    try {
      cairoHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "numeric", hour12: false }).format(new Date()));
    } catch {
      cairoHour = new Date(Date.now() + (cfg.tzOffset || 2) * 3600 * 1000).getUTCHours();
    }
    if (cairoHour < 8) return Promise.resolve(0);
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    return router.sendDailyReport({ day: yesterday, aiToday: aiMetrics?.today(yesterday) });
  };
  const stopReminders = startReminderLoop(
    () => router.sendReminders().then(() => router.sendRenewalNotices()).then(() => dailyReport()),
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
    server.listen(cfg.port, () => log.info(`http on :${cfg.port} (admin: ${cfg.adminToken ? "on" : "off"})`));

    // Polling REQUIRES deleting the webhook, so a local run silently steals updates
    // from the website, which handles /link and writes Firestore. Refuse to hijack a
    // registered production webhook unless the operator opts in explicitly.
    let existingWebhook = "";
    try {
      const info = await bot.api.getWebhookInfo();
      existingWebhook = String(info?.url || "");
    } catch (err) {
      log.warn(`could not read webhook info: ${err?.description || err?.message || err}`);
    }
    const takeover = String(process.env.BOT_ALLOW_TAKEOVER || "").toLowerCase() === "1";
    if (existingWebhook && !takeover) {
      // Stay up but idle instead of crashing: a crash loop on a host with a health
      // check would just keep restarting and re-deleting the webhook.
      log.error(`a webhook is registered (${existingWebhook}) — polling would delete it and steal updates from the site.`);
      log.error("not polling. Set BOT_ALLOW_TAKEOVER=1 only if this bot should own Telegram updates.");
      return;
    }
    if (existingWebhook && takeover) {
      log.warn(`taking over updates from ${existingWebhook} (BOT_ALLOW_TAKEOVER=1)`);
    }
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    log.info(`@${cfg.botUsername} polling`);
    for (let attempt = 1; ; attempt++) {
      try {
        await bot.start({ allowed_updates: UPDATES, onStart: (me) => log.info(`@${me.username} is live (polling)`) });
        break;
      } catch (err) {
        const msg = String(err?.description || err?.message || err);
        if (/409|Conflict/i.test(msg) && attempt <= 10) {
          log.warn(`polling 409 conflict (attempt ${attempt}/10), retrying in 3s...`);
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        throw err;
      }
    }
    return;
  }

  await bot.api.setWebhook(cfg.publicUrl, { secret_token: cfg.webhookSecret, allowed_updates: UPDATES });
  server.listen(cfg.port, () => log.info(`@${cfg.botUsername} is live (webhook) on :${cfg.port}`));
}

main().catch((err) => {
  log.error("fatal:", err?.stack || err);
  process.exit(1);
});
