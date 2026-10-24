import test from "node:test";
import assert from "node:assert/strict";
import { BURNS_QUIZ_ITEMS, BURNS_QUIZ_PARTS, BURNS_QUIZ_TITLE } from "../src/data/burns-quiz.js";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createGroups } from "../src/features/groups.js";
import { act } from "../src/core/actions.js";

const ADMIN = 999;
const USER = 42;

function setup() {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 10, admins: new Set([ADMIN]) });
  const calls = [];
  const polls = [];
  const acks = [];
  const ui = {
    async send(chatId, html, rows = null) {
      calls.push({ chatId, html, rows });
      return calls.length;
    },
    async edit(chatId, messageId, html, rows = null) {
      calls.push({ type: "edit", chatId, messageId, html, rows });
      return true;
    },
    async ack(callbackId, text = "", alert = false) {
      acks.push({ callbackId, text, alert });
      return true;
    },
    async sendPoll(chatId, { question, options, correct, explanation, openPeriod }) {
      polls.push({ chatId, question, options, correct, explanation, openPeriod });
      return `poll-${polls.length}`;
    },
    async clearKeyboard() {},
    async sendWithEffect(chatId, html, rows = null) {
      calls.push({ chatId, html, rows });
      return calls.length;
    },
    async typing() {},
  };
  const ai = { complete: async () => null, breakerState: () => ({}), diagnose: () => [] };
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, requirePhone: false, adminIds: new Set([ADMIN]) };
  const groups = createGroups({ store, ui });
  const router = createRouter({ cfg, ui, store, ai, quota, files: {}, getFilePath: async () => "", groups, logger: { error() {}, warn() {} } });
  return { router, calls, polls, acks, store, groups };
}

test("burns quiz dataset: exactly 30 questions, all within Telegram API limits", () => {
  assert.equal(BURNS_QUIZ_ITEMS.length, 30);
  assert.equal(BURNS_QUIZ_PARTS.length, 6);

  for (let i = 0; i < BURNS_QUIZ_ITEMS.length; i++) {
    const item = BURNS_QUIZ_ITEMS[i];
    assert.ok(item.q.length >= 10 && item.q.length <= 300, `Q${i + 1} length ${item.q.length} exceeds 300`);
    assert.ok(item.options.length >= 2 && item.options.length <= 10, `Q${i + 1} option count`);
    for (let j = 0; j < item.options.length; j++) {
      assert.ok(item.options[j].length >= 1 && item.options[j].length <= 100, `Q${i + 1} option ${j + 1} exceeds 100`);
    }
    assert.ok(item.answer >= 0 && item.answer < item.options.length, `Q${i + 1} valid answer index`);
    assert.ok(item.explanation.length <= 200, `Q${i + 1} explanation exceeds 200`);
  }
});

test("burns quiz: non-admins cannot access /burns or callback", async () => {
  const { router, calls, acks } = setup();

  // Non-admin command
  await router.onMessage({ chatId: USER, userId: USER, firstName: "Regular", text: "/burns" });
  assert.ok(!calls.some((c) => c.html && (c.html.includes("كويز الحروق") || c.html.includes("Burns & Fluid"))));

  // Non-admin callback
  await router.onCallback({ chatId: USER, userId: USER, firstName: "Regular", messageId: 1, callbackId: "cb1", data: act("admin", "burn") });
  assert.ok(acks.some((a) => a.text === "للأدمن فقط!" && a.alert === true));
});

test("burns quiz: admin can open menu, launch polls with timer, and run interactive quiz", async () => {
  const { router, calls, polls, store } = setup();

  // Admin command /burns (with Arabic session)
  store.set(`s:${ADMIN}`, { lang: "ar" });
  await router.onMessage({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", text: "/burns" });
  assert.ok(calls.some((c) => c.html && c.html.includes("كويز الحروق والمحاليل")));

  // Admin starts Telegram polls with 45s timer
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 1, callbackId: "cb2", data: act("admin", "burn_p", "45") });
  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 45);
  assert.ok(polls[0].question.startsWith("Q1/30"));

  // Admin starts in-bot interactive mode
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 2, callbackId: "cb3", data: act("admin", "burn_i") });
  const sess = store.get(`s:${ADMIN}`);
  assert.ok(sess?.quiz);
  assert.equal(sess.quiz.items.length, 30);
  assert.equal(sess.quiz.title, BURNS_QUIZ_TITLE);
});

test("burns quiz: admin in group can trigger /burns with custom timer", async () => {
  const { router, polls } = setup();

  // Non-admin in group: ignored
  await router.onGroupMessage({ chatId: -100123, userId: USER, firstName: "Regular", text: "/burns 30" });
  assert.equal(polls.length, 0);

  // Admin in group: triggers polls
  await router.onGroupMessage({ chatId: -100123, userId: ADMIN, firstName: "Admin", text: "/burns 30" });
  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 30);
});

test("interactive quiz: every question goes out as a native poll with all options, and mistakes are retryable", async () => {
  const { router, calls, polls, store } = setup();
  store.set(`s:${ADMIN}`, { lang: "ar" });

  // Start burns interactive
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 1, callbackId: "cb1", data: act("admin", "burn_i") });

  const q0 = BURNS_QUIZ_ITEMS[0];
  assert.equal(polls.length, 1, "the first question is a native poll, not inline buttons");
  assert.match(polls[0].question, /سؤال 1 من 30/);
  assert.equal(polls[0].options.length, q0.options.length, "every option is included in the poll");
  assert.equal(polls[0].correct, q0.answer, "the poll knows the correct option");

  // Answer wrong through poll_answer — the poll id maps back to the question
  const wrongChoice = (q0.answer + 1) % q0.options.length;
  await router.onPollAnswer({ pollId: "poll-1", userId: ADMIN, name: "Admin", optionIds: [wrongChoice] });

  const sessAfter = store.get(`s:${ADMIN}`);
  assert.equal(sessAfter.quiz.wrongItems.length, 1);
  assert.equal(sessAfter.quiz.wrongItems[0].q, q0.q);
  assert.equal(sessAfter.quiz.index, 1, "answering the poll advances the quiz");
  assert.equal(polls.length, 2, "the next question is posed immediately");
  assert.match(polls[1].question, /سؤال 2 من 30/);

  // Fast-forward to the last question to simulate quiz completion
  sessAfter.quiz.index = 29;
  sessAfter.quiz.answered = 29;
  store.set(`s:${ADMIN}`, sessAfter);

  // Click Next on last question
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 3, callbackId: "cb3", data: act("qn", "29") });

  // Check that retryQuizItems is saved and finish screen offers retry button
  const endSess = store.get(`s:${ADMIN}`);
  assert.ok(endSess.retryQuizItems);
  assert.equal(endSess.retryQuizItems.length, 1);
  const finishMsg = calls[calls.length - 1];
  const flatRows = (finishMsg.rows || []).flat();
  assert.ok(flatRows.some((b) => b.callback_data === "a:qretry"));

  // Click retry mistakes button
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 4, callbackId: "cb4", data: act("qretry") });
  const retrySess = store.get(`s:${ADMIN}`);
  assert.ok(retrySess.quiz);
  assert.equal(retrySess.quiz.items.length, 1);
  assert.equal(retrySess.quiz.items[0].q, q0.q);
});

test("interactive quiz: a timer bounds each poll and timer choices update the session", async () => {
  const { router, polls, store } = setup();
  store.set(`s:${ADMIN}`, { lang: "ar" });

  // Timer on, then start: the poll carries open_period so Telegram counts down.
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 1, callbackId: "cb1", data: act("qtimer", "45", "text") });
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 2, callbackId: "cb2", data: act("admin", "burn_i") });
  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 45, "a timed quiz uses the Telegram poll timer");

  // Check timer setting via qtimer
  await router.onCallback({ chatId: ADMIN, userId: ADMIN, firstName: "Admin", messageId: 3, callbackId: "cb3", data: act("qtimer", "0", "text") });
  const afterOffSess = store.get(`s:${ADMIN}`);
  assert.equal(afterOffSess.quizTimer, 0);
});

