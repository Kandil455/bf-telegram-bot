import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createPlans } from "../src/services/plans.js";
import { applyPayment } from "../src/features/payments.js";
import { renewalNotices, markNotice } from "../src/features/subscriptions.js";

const DAY = 24 * 3600 * 1000;

function fakeUi() {
  const calls = [];
  let next = 1;
  return {
    calls,
    async send(chatId, html, rows = null) {
      calls.push({ type: "send", chatId, html, rows });
      return next++;
    },
    async sendWithEffect(chatId, html, rows = null, effect = null) {
      calls.push({ type: "send", chatId, html, rows, effect });
      return next++;
    },
    async edit(chatId, id, html, rows = null) {
      calls.push({ type: "edit", chatId, html, rows });
    },
    async clearKeyboard() {},
    async ack(id, text = "") {
      calls.push({ type: "ack", text });
    },
    async typing() {},
  };
}

function build({ throttleMs = 0, admins = new Set([99]) } = {}) {
  const store = createStore({ dataDir: null });
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, throttleMs, adminIds: admins, freeDailyTasks: 10, proDailyTasks: 120, proStars: 150, proEgp: 100 };
  const quota = createQuota({ store, limit: 10, admins });
  const plans = createPlans({ store, cfg });
  const ui = fakeUi();
  const router = createRouter({ cfg, ui, store, ai: { complete: async () => null }, quota, files: {}, getFilePath: async () => "", plans, logger: { error() {}, warn() {} } });
  return { router, ui, store, plans };
}

test("payments: the same Stars charge is applied once, however often Telegram repeats it", () => {
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg: { freeDailyTasks: 10, proDailyTasks: 120, proStars: 150, proEgp: 100 } });
  const payment = { currency: "XTR", total_amount: 150, invoice_payload: "plan:pro", telegram_payment_charge_id: "chg_1" };
  assert.equal(applyPayment(payment, plans, 7, store).plan, "pro");
  assert.equal(applyPayment(payment, plans, 7, store).duplicate, true);
  assert.equal(plans.active(7), "pro");
});

test("subscriptions: a heads-up before the end, an expiry notice, each announced once per period", () => {
  const now = Date.UTC(2026, 9, 8);
  const store = createStore({ dataDir: null });
  const grants = { 1: { plan: "pro", until: now + 2 * DAY }, 2: { plan: "pro", until: now - DAY }, 3: { plan: "pro", until: now + 20 * DAY }, 4: { plan: "free", until: 0 } };
  const raw = (u) => grants[u] || null;
  const first = renewalNotices({ users: [1, 2, 3, 4], raw, store, now });
  assert.deepEqual(first.map((n) => `${n.userId}:${n.kind}`), ["1:soon", "2:expired"]);
  first.forEach((n) => markNotice(store, n));
  assert.equal(renewalNotices({ users: [1, 2, 3, 4], raw, store, now }).length, 0, "nothing repeats");
  grants[1] = { plan: "pro", until: now + 40 * DAY };
  assert.equal(renewalNotices({ users: [1], raw, store, now }).length, 0, "a renewed plan is not warned about again yet");
});

test("throttle: a second heavy request within the window is slowed down, admins are never throttled", async () => {
  const { router, ui, store } = build({ throttleMs: 60000 });
  await router.onMessage({ chatId: 1, userId: 5, messageId: 1, text: "hello there friend" });
  await router.onMessage({ chatId: 1, userId: 5, messageId: 2, text: "and another one" });
  assert.match(ui.calls.filter((c) => c.type === "send").at(-1).html, /One moment|لحظة/);
  const before = ui.calls.length;
  await router.onMessage({ chatId: 2, userId: 99, messageId: 3, text: "first" });
  await router.onMessage({ chatId: 2, userId: 99, messageId: 4, text: "second" });
  const fresh = ui.calls.slice(before).map((c) => c.html || "").join("\n");
  assert.doesNotMatch(fresh, /One moment/, "admins are never slowed down");
  assert.ok(store.get("thr:5"));
});

test("unsupported messages (stickers, voice) get a helpful reply", async () => {
  const { router, ui } = build();
  await router.onMessage({ chatId: 3, userId: 6, messageId: 1 });
  assert.match(ui.calls.at(-1).html, /PDF|PDF/);
});

test("payments: admins hear about every new Stars payment", async () => {
  const { router, ui } = build({ admins: new Set([99]) });
  await router.onMessage({
    chatId: 8,
    userId: 8,
    firstName: "Lina",
    messageId: 1,
    successfulPayment: { currency: "XTR", total_amount: 150, invoice_payload: "plan:pro", telegram_payment_charge_id: "chg_9" },
  });
  const toAdmin = ui.calls.find((c) => c.type === "send" && c.chatId === 99);
  assert.ok(toAdmin, "the admin was notified");
  assert.match(toAdmin.html, /New payment/);
  assert.match(toAdmin.html, /Lina/);
});
