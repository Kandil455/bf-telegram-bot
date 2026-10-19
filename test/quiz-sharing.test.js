import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createEntitlements } from "../src/services/entitlements.js";
import { act } from "../src/core/actions.js";

function fakeUi() {
  let next = 100;
  const calls = [];
  return {
    calls,
    async send(chatId, html, rows = null) {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id });
      return id;
    },
    async edit(chatId, messageId, html, rows = null) {
      calls.push({ type: "edit", chatId, messageId, html, rows });
      return messageId;
    },
    async sendWithEffect(chatId, html, rows = null, effect = null) {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id, effect });
      return id;
    },
    async clearKeyboard(chatId, messageId) {
      calls.push({ type: "clear", chatId, messageId });
    },
    async ack(callbackId, text = "") {
      calls.push({ type: "ack", callbackId, text });
    },
    async typing() {},
  };
}

const msg = (chatId, userId, text) => ({
  chatId,
  userId,
  firstName: `User${userId}`,
  text,
});

const cb = (chatId, userId, data, { messageId = 999 } = {}) => ({
  chatId,
  userId,
  firstName: `User${userId}`,
  messageId,
  callbackId: "cb-1",
  data,
});

test("quiz sharing: user can share quiz link, and recipient consumes 1 file slot from their daily quota", async () => {
  const store = createStore();
  const ui = fakeUi();
  const cfg = {
    botToken: "dummy",
    botUsername: "Black_Fighters_FREE_bot",
    freeDailyTasks: 10,
    freeFilesPerDay: 2,
    proFilesPerDay: 8,
    maxQuestionsPerFile: 50,
    requirePhone: false,
    quizVerify: false,
  };
  const quota = createQuota({ store, limit: 10, admins: new Set() });
  const entitle = createEntitlements({ store, cfg, plans: null, admins: new Set() });

  const quizJson = JSON.stringify({
    questions: [
      { q: "What is 2+2?", options: ["3", "4", "5", "6"], answer: 1, explanation: "Math" },
      { q: "Capital of Egypt?", options: ["Cairo", "Alex", "Giza", "Aswan"], answer: 0, explanation: "Geography" },
    ],
  });

  const ai = {
    complete: async () => ({ text: quizJson }),
  };

  const router = createRouter({
    cfg,
    ui,
    store,
    ai,
    quota,
    ent: entitle,
    files: {},
    getFilePath: async () => "",
  });

  // 1. User 1 starts and finishes a quiz
  await router.onMessage(msg(1, 1, "/quiz Math"));
  const user1Session = store.get("s:1");
  assert.ok(user1Session.quiz, "quiz started for user 1");
  const shareId = user1Session.lastShareId;
  assert.ok(shareId, "shareId was generated for user 1");

  // User 1 requests share link via qshare
  await router.onCallback(cb(1, 1, act("qshare", shareId)));
  const shareMsg = ui.calls[ui.calls.length - 1];
  assert.match(shareMsg.html, /start=quiz_/);
  assert.match(shareMsg.html, /Black_Fighters_FREE_bot/);

  // 2. User 2 opens the shared quiz link
  assert.equal(entitle.fileStatus(2).used, 0);
  assert.equal(entitle.fileStatus(2).left, 2);

  await router.onMessage(msg(2, 2, `/start quiz_${shareId}`));
  const user2StartMsg = ui.calls[ui.calls.length - 1];
  assert.match(user2StartMsg.html, /Shared Quiz Opened|تم فتح كويز مشترك بنجاح/);
  assert.match(user2StartMsg.html, /1.*(?:of|من أصل).*2/);

  // Verify User 2 had 1 file slot deducted
  assert.equal(entitle.fileStatus(2).used, 1);
  assert.equal(entitle.fileStatus(2).left, 1);

  // 3. User 2 opens a shared quiz a second time (slot 2)
  await router.onMessage(msg(2, 2, `/start quiz_${shareId}`));
  assert.equal(entitle.fileStatus(2).used, 2);
  assert.equal(entitle.fileStatus(2).left, 0);

  // 4. User 2 tries to open a third time -> blocked by daily limit!
  await router.onMessage(msg(2, 2, `/start quiz_${shareId}`));
  const user2BlockedMsg = ui.calls[ui.calls.length - 1];
  assert.match(user2BlockedMsg.html, /Daily file\/quiz limit reached|وصلت للحد اليومي للملفات والكويزات/);
  // Still 2 used
  assert.equal(entitle.fileStatus(2).used, 2);
});
