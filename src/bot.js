// Wires grammY to the router. The only file that imports grammY (and only for the
// Bot class and InputFile), so the rest of the bot stays framework-agnostic.

import { Bot, InputFile } from "grammy";
import { createAdminHandler } from "./admin/web.js";
import { createCash } from "./features/cash.js";
import { createEntitlements } from "./services/entitlements.js";
import { createMediaFlow } from "./flows/media.js";
import { createGroups, isAddressed } from "./features/groups.js";
import { createDecks } from "./features/reviews.js";
import { createRouter } from "./router.js";
import { createAi } from "./services/ai.js";
import { copy } from "./core/copy.js";
import { downloadTelegramFile, extractText } from "./services/files.js";
import { createPlans } from "./services/plans.js";
import { createQuota } from "./services/quota.js";
import { createStore } from "./services/store.js";
import { createUi } from "./ui/telegram.js";
import { createAppApi } from "./miniapp/api.js";

export function createApp(cfg, { store = null, logger = console, fetchImpl } = {}) {
  const st = store || createStore({ dataDir: cfg.dataDir || null });
  // When every AI provider fails, the admins are told why (at most once every five minutes),
  // so "AI is busy" always has a cause on record.
  let lastAiAlert = 0;
  const ai = createAi(cfg, {
    fetchImpl,
    logger,
    onAllFailed: (recent) => {
      const now = Date.now();
      if (now - lastAiAlert < 5 * 60 * 1000) return;
      lastAiAlert = now;
      const lines = recent.map((r) => `• ${r.where}: ${r.message}`).join("\n");
      for (const id of cfg.adminIds || []) {
        ui?.send(id, copy('en').adminAiDown(lines)).catch(() => {});
      }
    },
  });
  const plans = createPlans({ store: st, cfg });
  const exempt = cfg.enforceLimitsForAdmins ? new Set() : cfg.adminIds;
  const quota = createQuota({ store: st, limit: (userId) => plans.limitFor(userId), admins: cfg.adminIds, exempt });
  const decks = createDecks({ store: st });
  const bot = new Bot(cfg.botToken, cfg.apiRoot ? { client: { apiRoot: cfg.apiRoot } } : undefined);
  const ui = createUi(bot.api, { logger, premium: cfg.premiumEmoji, inputFile: (buf, name) => new InputFile(buf, name) });
  const groups = createGroups({ store: st, ui, logger });
  const cash = createCash({ store: st, plans, cfg });
  const ent = createEntitlements({ store: st, cfg, plans, admins: exempt });

  const media = createMediaFlow({ ui, store: st, ai, cfg, ent, premium: cfg.premiumEmoji, logger });
  const router = createRouter({
    cfg,
    ui,
    store: st,
    ai,
    quota,
    files: { download: downloadTelegramFile, extract: extractText },
    getFilePath: async (fileId) => (await bot.api.getFile(fileId)).file_path,
    plans,
    decks,
    groups,
    cash,
    media,
    ent,
    logger,
  });

  const admin = createAdminHandler({
    token: cfg.adminToken,
    store: st,
    quota,
    plans,
    ent,
    refund: (userId, chargeId) => ui.refundStars(userId, chargeId),
    sendMessage: (userId, html) => ui.send(userId, html),
  });

  bot.on("message", (ctx) => {
    const m = ctx.message;
    const type = ctx.chat?.type;
    if (type === "private") {
      return router.onMessage({
        chatId: ctx.chat.id,
        userId: ctx.from?.id,
        firstName: ctx.from?.first_name || "",
        messageId: m.message_id,
        text: m.text,
        caption: m.caption,
        document: m.document ? pick(m.document) : null,
        photo: m.photo?.length ? pick(m.photo[m.photo.length - 1]) : null,
        successfulPayment: m.successful_payment || null,
        contact: m.contact ? { phone: m.contact.phone_number, userId: m.contact.user_id } : null,
      });
    }
    if (type === "group" || type === "supergroup") {
      const text = m.text || m.caption || "";
      const replied = m.reply_to_message;
      const repliedToBot = replied?.from?.id === bot.botInfo?.id;
      if (!isAddressed(text, bot.botInfo?.username, { repliedToBot })) return;
      return router.onGroupMessage({
        chatId: ctx.chat.id,
        userId: ctx.from?.id,
        firstName: ctx.from?.first_name || "",
        messageId: m.message_id,
        text,
        replyText: replied?.text || replied?.caption || "",
      });
    }
  });

  bot.on("callback_query:data", (ctx) => {
    if (ctx.chat?.type !== "private") return ctx.answerCallbackQuery();
    const q = ctx.callbackQuery;
    return router.onCallback({
      chatId: ctx.chat.id,
      userId: ctx.from?.id,
      firstName: ctx.from?.first_name || "",
      messageId: q.message?.message_id,
      callbackId: q.id,
      data: q.data,
    });
  });

  bot.on("poll_answer", (ctx) => {
    const a = ctx.pollAnswer;
    return router.onPollAnswer({ pollId: a.poll_id, userId: a.user?.id, name: a.user?.first_name, optionIds: a.option_ids });
  });

  bot.on("pre_checkout_query", async (ctx) => {
    const q = ctx.preCheckoutQuery;
    const ok = router.onPreCheckout(q);
    await ui.answerPreCheckout(q.id, ok, "This plan is not available.");
  });

  bot.catch((err) => logger.error("[bot] update failed:", err.error?.message || err.message || err));

  const appApi = createAppApi({ store: st, botToken: cfg.botToken });
  return { bot, ui, router, store: st, quota, plans, decks, groups, ai, admin, cash, media, ent, appApi };
}

function pick(f) {
  return { file_id: f.file_id, file_unique_id: f.file_unique_id, file_name: f.file_name, mime_type: f.mime_type, file_size: f.file_size };
}
