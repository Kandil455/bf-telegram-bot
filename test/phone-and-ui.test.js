import test from "node:test";
import assert from "node:assert/strict";
import { createUi } from "../src/ui/telegram.js";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createEntitlements } from "../src/services/entitlements.js";

function fakeApi() {
  const calls = [];
  let id = 10;
  return {
    calls,
    async sendMessage(chatId, text, opts) {
      calls.push({ m: "sendMessage", chatId, text, opts });
      return { message_id: id++ };
    },
    async deleteMessage(chatId, messageId) {
      calls.push({ m: "deleteMessage", chatId, messageId });
      return true;
    },
    async editMessageText(chatId, messageId, text, opts) {
      calls.push({ m: "editMessageText", chatId, messageId, opts });
      return true;
    },
  };
}

const btn = (label) => ({ text: label, callback_data: "a:menu" });

test("live buttons: a newer message with buttons removes the previous one; plain text stays", async () => {
  const api = fakeApi();
  const ui = createUi(api, { logger: { warn() {} } });
  const first = await ui.send(1, "menu one", [[btn("x")]]);
  await ui.send(1, "just text");
  await ui.send(1, "menu two", [[btn("y")]]);
  const deletes = api.calls.filter((c) => c.m === "deleteMessage");
  assert.deepEqual(deletes.map((d) => d.messageId), [first], "only the earlier button message is removed");
});

test("effects: a rejected message effect falls back to a plain send", async () => {
  const api = fakeApi();
  let tries = 0;
  const original = api.sendMessage;
  api.sendMessage = async (chatId, text, opts) => {
    if (opts?.message_effect_id && tries++ === 0) throw Object.assign(new Error("effect"), { description: "Bad Request: message effect not found" });
    return original(chatId, text, opts);
  };
  const ui = createUi(api, { logger: { warn() {} } });
  await ui.sendWithEffect(1, "done", null, "123");
  const sent = api.calls.filter((c) => c.m === "sendMessage");
  assert.equal(sent.length, 1, "the message still goes out, without the effect");
  assert.equal(sent[0].opts.message_effect_id, undefined);
});

function gatedRouter() {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 10, admins: new Set([99]) });
  const sent = [];
  const ui = {
    send: async (chatId, html, rows) => { sent.push({ chatId, html, rows }); return 1; },
    sendRaw: async (chatId, html, markup) => { sent.push({ chatId, html, markup, raw: true }); return 2; },
    edit: async () => {}, clearKeyboard: async () => {}, ack: async (id, text) => sent.push({ ack: text }), typing: async () => {},
  };
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, requirePhone: true, adminIds: new Set([99]) };
  const router = createRouter({ cfg, ui, store, ai: { complete: async () => null }, quota, files: {}, getFilePath: async () => "", logger: { error() {}, warn() {} } });
  return { router, sent, store };
}

test("phone: an unverified user is asked to share their contact, and nothing else works until then", async () => {
  const { router, sent } = gatedRouter();
  await router.onMessage({ chatId: 5, userId: 5, firstName: "A", messageId: 1, text: "/quiz supply" });
  const ask = sent.at(-1);
  assert.equal(ask.raw, true);
  assert.equal(ask.markup.keyboard[0][0].request_contact, true);
});

test("phone: a shared contact that is the sender's own number verifies the user", async () => {
  const { router, sent, store } = gatedRouter();
  await router.onMessage({ chatId: 5, userId: 5, firstName: "A", messageId: 1, contact: { phone: "201001234567", userId: 5 } });
  assert.equal(store.get("verified:5"), "+201001234567");
  assert.equal(store.get("user:5").phone, "+201001234567");
  assert.ok(sent.some((s) => s.raw && s.markup.remove_keyboard), "the share button is removed");
});

test("phone: someone else's contact is refused, and the user is not verified", async () => {
  const { router, sent, store } = gatedRouter();
  await router.onMessage({ chatId: 6, userId: 6, firstName: "B", messageId: 1, contact: { phone: "201000000000", userId: 7 } });
  assert.equal(store.get("verified:6"), undefined);
  assert.ok(sent.some((s) => s.raw && /your own/.test(s.html)));
});

test("limits: with ENFORCE_LIMITS_FOR_ADMINS off, admins are exempt; with it on they are limited", () => {
  const store = createStore({ dataDir: null });
  const exemptOff = createQuota({ store, limit: 1, admins: new Set([9]), exempt: new Set([9]) });
  assert.equal(exemptOff.status(9).unlimited, true);
  const exemptOn = createQuota({ store, limit: 1, admins: new Set([9]), exempt: new Set() });
  assert.equal(exemptOn.consume(9).ok, true);
  assert.equal(exemptOn.consume(9).ok, false, "the admin is limited like everyone else");
  assert.equal(exemptOn.isAdmin(9), true, "and keeps the admin role");
  const ent = createEntitlements({ store, cfg: { freeFilesPerDay: 2, proFilesPerDay: 10, maxQuestionsPerFile: 30 }, admins: new Set() });
  ent.takeFileSlot(3); ent.takeFileSlot(3);
  assert.equal(ent.takeFileSlot(3).ok, false, "two files a day for an ordinary user");
});
