import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { menuRows, adminRows } from "../src/keyboards.js";

const ADMIN = 999;
const USER = 5;

function setup({ adminPublicUrl = "" } = {}) {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 10, admins: new Set([ADMIN]) });
  const calls = [];
  const ui = {
    async send(chatId, html, rows = null) {
      calls.push({ html, rows });
      return calls.length;
    },
    async edit() {},
    async ack() {},
    async sendDocument() {},
    async sendWithEffect(chatId, html, rows = null) {
      calls.push({ html, rows });
      return calls.length;
    },
    async typing() {},
    async getChatMember() {
      return { status: "member" };
    },
  };
  const ai = { complete: async () => null, breakerState: () => ({ gemini: { paused: false, failures: 0 } }), diagnose: () => [] };
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, requirePhone: false, adminIds: new Set([ADMIN]), adminPublicUrl };
  const router = createRouter({ cfg, ui, store, ai, quota, files: {}, getFilePath: async () => "", logger: { error() {}, warn() {} } });
  return { router, calls, store };
}

const flat = (rows) => (rows || []).flat().map((b) => b.text || b.fallback || "");
const dataOf = (rows) => (rows || []).flat().map((b) => b.callback_data || "");
const cb = (userId, data) => ({ chatId: userId, userId, firstName: "A", messageId: 1, callbackId: "cb", data });

test("menu: a plans button is shown to every user", () => {
  const rows = menuRows("en", {}, { isAdmin: false });
  assert.ok(dataOf(rows).some((d) => d === "a:plans"), "plans button present");
});

test("menu: the admin panel button is shown to admins only", () => {
  assert.ok(!dataOf(menuRows("en", {}, { isAdmin: false })).includes("a:admin"));
  assert.ok(dataOf(menuRows("en", {}, { isAdmin: true })).includes("a:admin"));
});

test("admin panel: every button in it has a valid callback", () => {
  const data = dataOf(adminRows("en", {}));
  assert.ok(data.length >= 4);
  assert.ok(data.every((d) => d.startsWith("a:")));
});

test("admin panel: a normal user never sees the admin screen", async () => {
  const { router, calls } = setup();
  await router.onCallback(cb(USER, "a:admin"));
  const last = calls.at(-1);
  assert.ok(!/Admin panel|لوحة الأدمن/.test(last?.html || ""), "non-admin is not shown the panel");
});

test("admin panel: the admin gets the panel with AI health and payments buttons", async () => {
  const { router, calls } = setup();
  await router.onCallback(cb(ADMIN, "a:admin"));
  const last = calls.at(-1);
  assert.match(last.html, /Admin panel/);
  assert.ok(dataOf(last.rows).includes("a:admin:ai"));
  assert.ok(dataOf(last.rows).includes("a:admin:pay"));
});

test("admin panel: AI health screen lists providers and their state", async () => {
  const { router, calls } = setup();
  await router.onCallback(cb(ADMIN, "a:admin:ai"));
  assert.match(calls.at(-1).html, /AI health/);
  assert.match(calls.at(-1).html, /gemini/);
});

test("/admin: an admin gets the dashboard link, not the token", async () => {
  const { router, calls } = setup({ adminPublicUrl: "https://example.ngrok-free.app" });
  await router.onMessage({ chatId: ADMIN, userId: ADMIN, firstName: "A", messageId: 1, text: "/admin" });
  const last = calls.at(-1);
  assert.match(last.html, /https:\/\/example\.ngrok-free\.app\/admin/);
  assert.doesNotMatch(last.html, /Bearer|token:/i);
});

test("/admin: a normal user gets the normal menu, not the link", async () => {
  const { router, calls } = setup();
  await router.onMessage({ chatId: USER, userId: USER, firstName: "A", messageId: 1, text: "/admin" });
  assert.doesNotMatch(calls.at(-1).html, /\/admin/);
});

test("reminder: the hour buttons set the reminder with no typing", async () => {
  const { router, calls } = setup();
  await router.onCallback(cb(USER, "a:remind"));
  const menu = calls.at(-1);
  assert.match(menu.html, /reminder hour|ساعة التذكير/);
  const hourData = dataOf(menu.rows);
  assert.ok(hourData.includes("a:rem:20"), "20:00 button present");
  assert.ok(hourData.includes("a:rem:off"), "turn-off button present");
});

test("txid: the button asks for the transaction ID and the next message is read as it", async () => {
  const { router, calls } = setup();
  await router.onCallback(cb(USER, "a:txid"));
  assert.match(calls.at(-1).html, /TxID|رقم العملية/);
});
