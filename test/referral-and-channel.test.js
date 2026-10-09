import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { createEntitlements } from "../src/services/entitlements.js";
import { createRouter } from "../src/router.js";

const DAY = 24 * 3600 * 1000;

test("referral: invited friend increases referrer daily file limit for today only", () => {
  let t = Date.now();
  const store = createStore({ dataDir: null });
  const cfg = { freeFilesPerDay: 2, proFilesPerDay: 10, maxQuestionsPerFile: 30 };
  const ent = createEntitlements({ store, cfg, plans: null, now: () => t });

  const referrerId = 111;
  const friendId = 222;

  // Before referral: 2 files
  assert.equal(ent.filesLimit(referrerId), 2);
  assert.equal(ent.fileStatus(referrerId).left, 2);

  // Friend joins via referral: +1 bonus file for today
  const day = new Date(t).toISOString().slice(0, 10);
  store.set(`ref_bonus:${referrerId}:${day}`, 1);

  // After referral: 3 files today
  assert.equal(ent.filesLimit(referrerId), 3);
  assert.equal(ent.fileStatus(referrerId).left, 3);
  assert.equal(ent.takeFileSlot(referrerId).ok, true);
  assert.equal(ent.fileStatus(referrerId).left, 2);

  // Next day: bonus expires back to 2
  t += DAY;
  const nextDay = new Date(t).toISOString().slice(0, 10);
  assert.equal(ent.filesLimit(referrerId), 2);
});

test("channel: router blocks users not subscribed to required channel and allows members", async () => {
  const store = createStore({ dataDir: null });
  const messages = [];
  const fakeApi = {
    getChatMember: async (channel, userId) => {
      if (userId === 100) return { status: "left" };
      if (userId === 200) return { status: "member" };
      return null;
    },
  };
  const ui = {
    send: async (chatId, html, rows) => {
      messages.push({ chatId, html, rows });
      return 1;
    },
    ack: async () => {},
    getChatMember: fakeApi.getChatMember,
  };
  const cfg = {
    requiredChannel: "@my_test_channel",
    requirePhone: false,
    freeFilesPerDay: 2,
    adminIds: new Set([999]),
  };
  const quota = { isAdmin: (u) => u === 999 };
  const router = createRouter({
    cfg,
    ui,
    store,
    quota,
    files: {},
    getFilePath: async () => "",
  });

  // User 100 is not subscribed (status: left)
  await router.onMessage({
    chatId: 100,
    userId: 100,
    firstName: "Alice",
    text: "hello bot",
  });
  assert.equal(messages.length, 1);
  assert.match(messages[0].html, /يجب الاشتراك في القناة|Channel Subscription Required/);

  // User 200 is subscribed (status: member)
  messages.length = 0;
  await router.onMessage({
    chatId: 200,
    userId: 200,
    firstName: "Bob",
    text: "hello bot",
  });
  assert.equal(messages.length, 1);
  assert.doesNotMatch(messages[0].html, /يجب الاشتراك في القناة|Channel Subscription Required/);

  // Admin 999 is exempt
  messages.length = 0;
  await router.onMessage({
    chatId: 999,
    userId: 999,
    firstName: "Admin",
    text: "hello bot",
  });
  assert.equal(messages.length, 1);
  assert.doesNotMatch(messages[0].html, /يجب الاشتراك في القناة/);
});
