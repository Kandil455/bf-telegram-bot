import test from "node:test";
import assert from "node:assert/strict";
import { act } from "../src/core/actions.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createRouter } from "../src/router.js";
import { createGroups } from "../src/features/groups.js";
import { EMERGENCY_QUIZ_CATEGORIES, EMERGENCY_QUIZ_PARTS, EMERGENCY_QUIZ_ITEMS, getEmergencyQuizPart, getEmergencyQuizCategory } from "../src/data/emergency-quiz.js";

function setup(lang = "ar") {
  const store = createStore({ dataDir: null });
  if (lang) {
    store.set("s:123", { lang });
  }
  const calls = [];
  const polls = [];
  const docs = [];

  const ui = {
    calls,
    polls,
    docs,
    async send(chatId, html, rows) {
      calls.push({ type: "send", chatId, html, rows });
      return calls.length;
    },
    async edit(chatId, msgId, html, rows) {
      calls.push({ type: "edit", chatId, msgId, html, rows });
      return true;
    },
    async clearKeyboard() {},
    async typing() {},
    async ack() {},
    async sendPoll(chatId, poll) {
      polls.push({ chatId, ...poll });
      return `poll-${polls.length}`;
    },
    async sendDocument(chatId, html, name, caption) {
      docs.push({ chatId, html, name, caption });
      return true;
    },
  };

  const groups = createGroups({ store, ui });
  const quota = createQuota({ store, limit: () => 10, tokenLimit: () => 100000, admins: new Set([999]) });
  const router = createRouter({
    cfg: { adminIds: [999] },
    ui,
    store,
    ai: null,
    quota,
    files: null,
    getFilePath: async () => "",
    groups,
  });

  return { router, ui, store, calls, polls, docs };
}

test("emergency quiz data: exactly 182 questions across 5 quizzes matching the 5 files (<= 50 Qs each)", () => {
  assert.equal(EMERGENCY_QUIZ_CATEGORIES.length, 5);
  assert.equal(EMERGENCY_QUIZ_PARTS.length, 5);
  assert.equal(EMERGENCY_QUIZ_ITEMS.length, 182);

  // Check 5 quizzes: each file is one complete quiz <= 50 Qs
  const part1 = getEmergencyQuizPart(1);
  assert.equal(part1.length, 50, "Quiz 1 (Core Exam) must be 50 questions");

  const part2 = getEmergencyQuizPart(2);
  assert.equal(part2.length, 45, "Quiz 2 (Chest Pain) must be 45 questions");

  const part3 = getEmergencyQuizPart(3);
  assert.equal(part3.length, 43, "Quiz 3 (Trauma) must be 43 questions");

  const part4 = getEmergencyQuizPart(4);
  assert.equal(part4.length, 27, "Quiz 4 (Shock) must be 27 questions");

  const part5 = getEmergencyQuizPart(5);
  assert.equal(part5.length, 17, "Quiz 5 (GI Bleeding) must be 17 questions");
});

test("emergency quiz user answer corrections: Q7 is C and Q30 is B", () => {
  const q7 = EMERGENCY_QUIZ_ITEMS.find((it) => it.id === 7);
  assert.ok(q7, "Q7 must exist");
  assert.equal(q7.answer, 2, "Q7 answer must be C (index 2)");
  assert.match(q7.options[q7.answer], /0\.1 unit\s*\/kg\/hr/i);

  const q30 = EMERGENCY_QUIZ_ITEMS.find((it) => it.id === 30);
  assert.ok(q30, "Q30 must exist");
  assert.equal(q30.answer, 1, "Q30 answer must be B (index 1)");
  assert.match(q30.options[q30.answer], /High blood cholesterol/i);
});

test("emergency quiz limits: telegram poll constraints strictly met across all 182 questions (text-only)", () => {
  for (const item of EMERGENCY_QUIZ_ITEMS) {
    assert.ok(item.q.length <= 300, `Q${item.id} question text exceeds 300 chars: ${item.q.length}`);
    assert.ok(item.options.length >= 2 && item.options.length <= 10, `Q${item.id} must have 2-10 options`);
    for (const opt of item.options) {
      assert.ok(opt.length <= 100, `Q${item.id} option exceeds 100 chars: ${opt}`);
    }
    assert.ok(item.answer >= 0 && item.answer < item.options.length, `Q${item.id} answer index out of bounds: ${item.answer}`);
    if (item.explanation) {
      assert.ok(item.explanation.length <= 200, `Q${item.id} explanation exceeds 200 chars: ${item.explanation.length}`);
    }
  }
});

test("emergency command: /emergency and /er display the 5-quiz menu", async () => {
  const { router, calls } = setup();
  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, text: "/emergency" });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /Emergency Medicine 182 MCQs/i);
  assert.match(msg.html, /كويز 1.*50 سؤال/);
  assert.match(msg.html, /كويز 2.*45 سؤال/);
  assert.match(msg.html, /كويز 3.*43 سؤال/);
  assert.match(msg.html, /كويز 4.*27 سؤال/);
  assert.match(msg.html, /كويز 5.*17 سؤال/);
  assert.ok(msg.rows.length >= 5);

  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, text: "/er" });
  const msg2 = calls[calls.length - 1];
  assert.match(msg2.html, /Emergency Medicine 182 MCQs/i);
});

test("emergency quiz launch: selecting a quiz presents launch modes with exact file count", async () => {
  const { router, calls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "p", "2") });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /كويز الطوارئ رقم 2/);
  assert.match(msg.html, /45 سؤال/);
  const flat = msg.rows.flat();
  assert.ok(flat.some((b) => b.callback_data === act("em", "start_p", "2", "30")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "start_i", "2")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "dl", "2")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "send_all", "2")));
});

test("emergency poll mode: launches telegram poll quiz with openPeriod timer", async () => {
  const { router, polls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_p", "1", "30") });

  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 30);
  assert.match(polls[0].question, /The recommended maternal position/i);
});

test("emergency interactive mode: initiates interactive session with all questions from that file", async () => {
  const { router, calls, store } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_i", "1") });

  const sess = store.get("s:123");
  assert.ok(sess.quiz, "Interactive quiz session must be initialized");
  assert.equal(sess.quiz.items.length, 50, "Quiz 1 should load all 50 questions");
  assert.equal(sess.quiz.index, 0);

  const last = calls[calls.length - 1];
  assert.match(last.html, /The recommended maternal position/i);
  const qaButtons = last.rows.flat().filter((b) => b.callback_data && b.callback_data.startsWith("a:qa:"));
  assert.equal(qaButtons.length, 4); // 4 option buttons A, B, C, D
});

test("emergency download: sends HTML file for single quiz and full 182-question bank", async () => {
  const { router, docs } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "dl", "1") });
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "emergency-quiz-1-50q.html");
  assert.match(docs[0].html, /Emergency Medicine Quiz 1/);

  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, callbackId: "cb2", data: act("em", "dl_all") });
  assert.equal(docs.length, 2);
  assert.equal(docs[1].name, "emergency-medicine-182-mcqs-complete.html");
  assert.match(docs[1].html, /Emergency Medicine 182 MCQs Complete Bank/);
});
