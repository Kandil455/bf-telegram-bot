// Telegram UI adapter. The only place that talks to the Bot API.
// It wraps a grammY `bot.api` (or any object with the same method names) and adds:
//   * automatic fallback when Telegram rejects premium button fields,
//   * automatic fallback when HTML is not accepted,
//   * one retry after a 429 flood-wait,
//   * tolerant editing ("message is not modified" is not an error).

import { render, isButtonError } from "../core/buttons.js";
import { stripTags } from "../core/text.js";
import { applyPremiumGlyphs } from "../core/icons.js";

const shouldFallback = (err) => isButtonError(err?.description) || /parse|entities/i.test(err?.description || "");

async function withRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const wait = err?.parameters?.retry_after ?? (err?.error_code === 429 ? 2 : 0);
    if (!wait) throw err;
    await new Promise((r) => setTimeout(r, Math.min(wait, 20) * 1000));
    return fn();
  }
}

export function createUi(api, { logger = console, premium = {}, inputFile = null } = {}) {
  const decorate = (html) => applyPremiumGlyphs(html, premium);
  /** Runs `attempt(variant)` through the fallback ladder and returns its result. */
  async function ladder(html, rows, attempt) {
    const rich = decorate(html);
    const variants = [{ text: rich, rows, modern: true, plain: false }];
    if (rows) variants.push({ text: rich, rows, modern: false, plain: false });
    variants.push({ text: stripTags(html), rows, modern: false, plain: true });
    let last;
    for (const v of variants) {
      try {
        return await withRetry(() => attempt(v));
      } catch (err) {
        last = err;
        if (!shouldFallback(err)) throw err;
        logger.warn(`[ui] fallback (${v.modern ? "modern" : "plain"}${v.plain ? ",text" : ""}): ${err.description}`);
      }
    }
    throw last;
  }

  const optsOf = (v) => ({
    parse_mode: v.plain ? undefined : "HTML",
    disable_web_page_preview: true,
    ...(v.rows ? { reply_markup: render(v.rows, { modern: v.modern }) } : {}),
  });

  // One live button message per chat. When a newer message carries buttons, the older one is
  // removed, so the chat does not fill with stale menus. Plain text messages are never removed.
  const liveButtons = new Map();
  async function retire(chatId, keepId) {
    if (!keepId) return;
    const prev = liveButtons.get(chatId);
    liveButtons.set(chatId, keepId);
    if (prev && prev !== keepId) await api.deleteMessage(chatId, prev).catch(() => {});
  }

  return {
    /** Sends a message and returns its id. */
    async send(chatId, html, rows = null) {
      const msg = await ladder(html, rows, (v) => api.sendMessage(chatId, v.text, optsOf(v)));
      if (rows && msg?.message_id) await retire(chatId, msg.message_id);
      return msg?.message_id;
    },

    /** Sends a message with a custom reply keyboard (for example, a button that shares the phone number). */
    async sendRaw(chatId, html, replyMarkup) {
      const msg = await withRetry(() => api.sendMessage(chatId, html.slice(0, 4000), { parse_mode: "HTML", reply_markup: replyMarkup }));
      return msg?.message_id;
    },

    /** Edits a message. Silently ignores "not modified". */
    async edit(chatId, messageId, html, rows = null) {
      try {
        await ladder(html, rows, (v) => api.editMessageText(chatId, messageId, v.text, optsOf(v)));
      } catch (err) {
        if (!/not modified/i.test(err?.description || "")) throw err;
      }
      if (rows) await retire(chatId, messageId);
      return messageId;
    },

    async clearKeyboard(chatId, messageId) {
      await api.editMessageReplyMarkup(chatId, messageId, { reply_markup: { inline_keyboard: [] } }).catch(() => {});
    },

    async ack(callbackId, text = "", alert = false) {
      await api.answerCallbackQuery(callbackId, text ? { text, show_alert: alert } : {}).catch(() => {});
    },

    async getChatMember(chatId, userId) {
      if (typeof api?.getChatMember === "function") {
        return api.getChatMember(chatId, userId).catch(() => null);
      }
      return null;
    },

    /** Sends an HTML file as a document. `inputFile(buffer, name)` is injected by the app. */
    async sendDocument(chatId, content, filename, caption = "") {
      if (!inputFile) return null;
      const buffer = typeof content === "string" ? Buffer.from(content, "utf8") : content;
      const doc = inputFile(buffer, filename);
      return withRetry(() => api.sendDocument(chatId, doc, caption ? { caption } : {}));
    },

    /** Sends a quiz poll (non-anonymous, so answers reach the bot). Returns the poll id. */
    async sendPoll(chatId, { question, options, correct, explanation = "" }) {
      const msg = await withRetry(() =>
        api.sendPoll(chatId, question.slice(0, 300), options.map((o) => o.slice(0, 100)), {
          type: "quiz",
          is_anonymous: false,
          correct_option_id: correct,
          explanation: explanation.slice(0, 180),
          open_period: 600,
        })
      );
      return msg?.poll?.id;
    },

    /** Sends a Telegram Stars invoice (currency XTR). */
    async sendInvoice(chatId, inv) {
      return withRetry(() =>
        // Bot API order: title, description, payload, provider_token (empty for Stars), currency, prices.
        api.sendInvoice(chatId, inv.title, inv.description, inv.payload, "", inv.currency, inv.prices)
      );
    },

    /** Refunds a Telegram Stars charge (the admin's tool for a mistaken payment). */
    async refundStars(userId, chargeId) {
      return api.refundStarPayment(userId, chargeId);
    },

    async answerPreCheckout(id, ok, errorMessage = "") {
      return api.answerPreCheckoutQuery(id, ok, ok ? undefined : { error_message: errorMessage || "This plan is not available." }).catch(() => {});
    },

    /** Sends one photo with a caption and buttons. */
    async sendPhoto(chatId, buffer, name, caption = "", rows = null) {
      if (!inputFile) return null;
      const opts = (modern) => ({ caption: caption.slice(0, 1000), parse_mode: "HTML", ...(rows ? { reply_markup: render(rows, { modern }) } : {}) });
      try {
        const msg = await withRetry(() => api.sendPhoto(chatId, inputFile(buffer, name), opts(true)));
        if (rows && msg?.message_id) await retire(chatId, msg.message_id);
        return msg?.message_id;
      } catch (err) {
        if (!shouldFallback(err)) throw err;
        const msg = await withRetry(() => api.sendPhoto(chatId, inputFile(buffer, name), { ...opts(false), caption: stripTags(caption).slice(0, 1000), parse_mode: undefined }));
        return msg?.message_id;
      }
    },

    /** Sends photos as an album (2 to 10 per call). */
    async sendMediaGroup(chatId, photos, caption = "") {
      if (!inputFile || !photos.length) return null;
      const media = photos.slice(0, 10).map((p, i) => ({
        type: "photo",
        media: inputFile(p.buffer, p.name),
        ...(i === 0 && caption ? { caption: caption.slice(0, 1000), parse_mode: "HTML" } : {}),
      }));
      return withRetry(() => api.sendMediaGroup(chatId, media));
    },

    /**
     * Sends a message with an optional Telegram message effect (confetti, fire, ...).
     * If Telegram rejects the effect, the message is sent again without it.
     */
    async sendWithEffect(chatId, html, rows = null, effectId = null) {
      if (!effectId) return this.send(chatId, html, rows);
      try {
        const msg = await ladder(html, rows, (v) => api.sendMessage(chatId, v.text, { ...optsOf(v), message_effect_id: effectId }));
        if (rows && msg?.message_id) await retire(chatId, msg.message_id);
        return msg?.message_id;
      } catch (err) {
        if (!/effect/i.test(err?.description || "")) throw err;
        return this.send(chatId, html, rows);
      }
    },

    async typing(chatId) {
      await api.sendChatAction(chatId, "typing").catch(() => {});
    },
  };
}
