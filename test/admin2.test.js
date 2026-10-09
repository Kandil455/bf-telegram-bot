import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createAdminHandler } from "../src/admin/web.js";
import { createStore } from "../src/services/store.js";
import { createPlans } from "../src/services/plans.js";
import { applyPayment } from "../src/features/payments.js";

const TOKEN = "t".repeat(32);
const cfg = { freeDailyTasks: 10, proDailyTasks: 120, proStars: 150, proEgp: 100 };
const NOW = Date.UTC(2026, 9, 8, 12);

function setup() {
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg, now: () => NOW });
  store.set("user:42", { firstName: "Lina", lastSeen: NOW, phone: "+201000000000" });
  const refunds = [];
  const sent = [];
  const handle = createAdminHandler({
    token: TOKEN,
    store,
    quota: { status: () => ({ left: 7, limit: 10, unlimited: false }) },
    plans,
    ent: { fileStatus: () => ({ used: 1, limit: 2, unlimited: false }) },
    refund: async (userId, chargeId) => refunds.push({ userId, chargeId }),
    sendMessage: async (id, html) => sent.push({ id, html }),
    now: () => NOW,
  });
  return { store, plans, handle, refunds, sent };
}

async function call(handle, method, url, body = null) {
  const r = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  r.method = method;
  r.url = url;
  r.headers = { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" };
  const res = { status: 0, body: "", writeHead(s) { this.status = s; }, end(b = "") { this.body += b; } };
  await handle(r, res);
  return { status: res.status, json: res.body && res.body.startsWith("{") ? JSON.parse(res.body) : null, body: res.body };
}

test("admin: ban and unban change what the user sees, and the list shows the state", async () => {
  const { handle, store } = setup();
  assert.equal((await call(handle, "POST", "/admin/api/ban", { userId: 42, banned: true, reason: "spam" })).status, 200);
  assert.ok(store.get("banned:42"));
  const list = await call(handle, "GET", "/admin/api/users?q=lina");
  assert.equal(list.json.users[0].banned, true);
  assert.equal(list.json.users[0].phone, "+201000000000");
  await call(handle, "POST", "/admin/api/ban", { userId: 42, banned: false });
  assert.equal(store.get("banned:42"), undefined);
});

test("admin: reset limits clears today's counters only", async () => {
  const { handle, store } = setup();
  const today = new Date(NOW).toISOString().slice(0, 10);
  store.set(`q:42:${today}`, 9);
  store.set(`files:42:${today}`, 2);
  store.set("q:42:2026-10-07", 5);
  await call(handle, "POST", "/admin/api/reset-limits", { userId: 42 });
  assert.equal(store.get(`q:42:${today}`), undefined);
  assert.equal(store.get(`files:42:${today}`), undefined);
  assert.equal(store.get("q:42:2026-10-07"), 5, "yesterday is untouched");
});

test("admin: refunds need a known charge, run once, and remove the plan", async () => {
  const { handle, store, plans, refunds } = setup();
  applyPayment({ currency: "XTR", total_amount: 150, invoice_payload: "plan:pro", telegram_payment_charge_id: "chg_77" }, plans, 42, store, NOW);
  assert.equal(plans.active(42), "pro");
  assert.equal((await call(handle, "POST", "/admin/api/refund", { chargeId: "nope" })).status, 404);
  const first = await call(handle, "POST", "/admin/api/refund", { chargeId: "chg_77" });
  assert.equal(first.status, 200);
  assert.deepEqual(refunds, [{ userId: 42, chargeId: "chg_77" }]);
  assert.equal(plans.active(42), "free", "the plan the payment granted is removed");
  assert.equal((await call(handle, "POST", "/admin/api/refund", { chargeId: "chg_77" })).status, 409);
  const payments = await call(handle, "GET", "/admin/api/payments");
  assert.equal(payments.json.payments[0].refunded, true);
});

test("admin: messages are sent as plain text, with HTML escaped", async () => {
  const { handle, sent } = setup();
  await call(handle, "POST", "/admin/api/message", { userId: 42, text: "<b>hi</b> & bye" });
  assert.equal(sent[0].id, 42);
  assert.equal(sent[0].html, "&lt;b&gt;hi&lt;/b&gt; &amp; bye");
});

test("admin: a wrong token is refused on every action", async () => {
  const { handle } = setup();
  const r = Readable.from([]);
  r.method = "POST"; r.url = "/admin/api/ban"; r.headers = { authorization: "Bearer wrong" };
  const res = { status: 0, body: "", writeHead(s) { this.status = s; }, end(b = "") { this.body += b; } };
  await handle(r, res);
  assert.equal(res.status, 401);
});
