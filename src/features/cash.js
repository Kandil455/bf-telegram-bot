// Vodafone Cash, verified automatically from SMS. There is no public Vodafone Cash API for
// merchants, so verification works from the confirmation SMS itself:
//   1. The buyer picks a plan; the bot shows the amount and the receiving wallet.
//   2. The buyer pays, then sends the transaction number to the bot.
//   3. A phone running an SMS forwarder posts each incoming SMS to POST /webhooks/sms,
//      with a shared secret. The buyer never submits SMS text, so copying a message
//      into the chat achieves nothing: only SMS that reach the phone can count.
//   4. The bot accepts only RECEIVED confirmations addressed to our wallet, optionally
//      from an allowed sender, matches the transaction number, checks the amount and
//      the window, grants the plan, and burns the number. Each number works once.

import { timingSafeEqual } from "node:crypto";
import { PLANS } from "../services/plans.js";

const WINDOW_MS = 30 * 60 * 1000;
const SMS_TTL_MS = 7 * 24 * 3600 * 1000;
const USED_TTL_MS = 90 * 24 * 3600 * 1000;

const RECEIVED = /تم استلام|you (?:have )?received/i;
const SENT = /تم تحويل|تم سحب|you (?:have )?sent|transferred/i;
const AMOUNT_PATTERNS = [/مبلغ\s*(\d+(?:\.\d{1,2})?)\s*جنيه/, /received\s+(\d+(?:\.\d{1,2})?)\s*(?:EGP|LE|L\.E)/i];
const TX_PATTERNS = [/رقم العملية\s*[:：]?\s*(\d{6,20})/, /transaction\s*(?:id|number|no\.?)?\s*[:#]?\s*(\d{6,20})/i];

/** Converts Arabic-Indic and Persian digits to ASCII, and removes tatweel and marks. */
export function normaliseDigits(s = "") {
  return String(s)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\u0640/g, "")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "");
}

function firstGroup(s, patterns) {
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Reads a confirmation SMS. Returns { txId, amount } only for a RECEIVED payment that
 * names our wallet. Outgoing transfers ("تم تحويل", "you sent") never count, even when
 * they contain a large amount and a transaction number.
 */
export function parseCashSms(text = "", { receiver = "", tx = null, amount = null } = {}) {
  const s = normaliseDigits(text);
  if (!RECEIVED.test(s) || SENT.test(s)) return null;
  if (receiver && !s.includes(normaliseDigits(receiver))) return null;

  const txRaw = tx ? (s.match(tx) || [])[1] : firstGroup(s, TX_PATTERNS);
  const amountRaw = amount ? (s.match(amount) || [])[1] : firstGroup(s, AMOUNT_PATTERNS);
  if (!txRaw || !amountRaw) return null;
  const value = Number(amountRaw.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return { txId: txRaw, amount: value };
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a || ""));
  const B = Buffer.from(String(b || ""));
  return A.length > 0 && A.length === B.length && timingSafeEqual(A, B);
}

export function createCash({ store, plans, cfg, now = () => Date.now() }) {
  const intentKey = (userId) => `cash:intent:${userId}`;
  const smsKey = (txId) => `cash:sms:${txId}`;
  const usedKey = (txId) => `cash:used:${txId}`;
  const senders = (cfg.cashSenders || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);

  return {
    enabled: Boolean(cfg.cashNumber && cfg.cashSecret),

    /** Opens a payment window for a plan. Returns the instructions, or null for free plans. */
    start(userId, planId) {
      const plan = PLANS[planId];
      if (!plan || !plan.egp) return null;
      const intent = { planId, amount: plan.egp, number: cfg.cashNumber, expiresAt: now() + WINDOW_MS };
      store.set(intentKey(userId), intent, WINDOW_MS);
      return intent;
    },

    intent(userId) {
      const i = store.get(intentKey(userId));
      return i && i.expiresAt > now() ? i : null;
    },

    /**
     * Receives one forwarded SMS. Body: { text, sender?, received_at? }.
     * Returns: unauthorized | wrong_sender | unparsed | duplicate | stored.
     */
    ingest({ secret, body }) {
      if (!cfg.cashSecret || !safeEqual(secret, cfg.cashSecret)) return "unauthorized";
      if (senders.length && !senders.includes(String(body?.sender || "").trim().toLowerCase())) return "wrong_sender";
      const parsed = parseCashSms(body?.text, {
        receiver: cfg.cashNumber,
        tx: cfg.cashTx,
        amount: cfg.cashAmount,
      });
      if (!parsed) return "unparsed";
      if (store.get(smsKey(parsed.txId))) return "duplicate";
      store.set(smsKey(parsed.txId), { amount: parsed.amount, at: now() }, SMS_TTL_MS);
      return "stored";
    },

    /**
     * Tries to settle the open payment window with a transaction number.
     * Returns { status: 'ok'|'pending'|'used'|'amount'|'expired'|'no_intent'|'bad_id', ... }.
     */
    claim(userId, rawTxId) {
      const txId = normaliseDigits(String(rawTxId || "")).replace(/\D/g, "");
      if (txId.length < 6) return { status: "bad_id" };
      const intentRaw = store.get(intentKey(userId));
      if (!intentRaw) return { status: "no_intent" };
      if (intentRaw.expiresAt <= now()) return { status: "expired" };
      if (store.get(usedKey(txId))) return { status: "used" };
      const sms = store.get(smsKey(txId));
      if (!sms) return { status: "pending" };
      if (sms.amount + 0.001 < intentRaw.amount) return { status: "amount", got: sms.amount, need: intentRaw.amount };

      store.set(usedKey(txId), userId, USED_TTL_MS);
      store.del(intentKey(userId));
      const grant = plans.grant(userId, intentRaw.planId, PLANS[intentRaw.planId].days);
      return { status: "ok", grant };
    },
  };
}
