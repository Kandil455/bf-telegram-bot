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
  const photos = [];

  const ui = {
    calls,
    polls,
    docs,
    photos,
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
    async sendPhoto(chatId, buffer, name, caption = "", rows = null) {
      photos.push({ chatId, buffer, name, caption, rows });
      return photos.length;
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

  return { router, ui, store, calls, polls, docs, photos };
}

test("emergency quiz data: exactly 334 questions across 9 quizzes matching the uploaded files (exact file question counts)", () => {
  assert.equal(EMERGENCY_QUIZ_CATEGORIES.length, 9);
  assert.equal(EMERGENCY_QUIZ_PARTS.length, 9);
  assert.equal(EMERGENCY_QUIZ_ITEMS.length, 334);

  // Check 9 quizzes: each file is one complete quiz with its exact question count
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

  const part6 = getEmergencyQuizPart(6);
  assert.equal(part6.length, 22, "Quiz 6 (ALS) must be 22 questions");

  const part7 = getEmergencyQuizPart(7);
  assert.equal(part7.length, 10, "Quiz 7 (Radiology) must be 10 questions");

  const part8 = getEmergencyQuizPart(8);
  assert.equal(part8.length, 34, "Quiz 8 (BLS Pretest) must be 34 questions");

  const part9 = getEmergencyQuizPart(9);
  assert.equal(part9.length, 86, "Quiz 9 (BLS Bank) must be 86 questions");
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

test("emergency quiz limits: telegram poll constraints strictly met across all 334 questions (text-only)", () => {
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

test("emergency command: /emergency and /er display the 9-quiz menu", async () => {
  const { router, calls } = setup();
  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, text: "/emergency" });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /Emergency Medicine/i);
  assert.match(msg.html, /كويز 1.*50 سؤال/);
  assert.match(msg.html, /كويز 2.*45 سؤال/);
  assert.match(msg.html, /كويز 3.*43 سؤال/);
  assert.match(msg.html, /كويز 4.*27 سؤال/);
  assert.match(msg.html, /كويز 5.*17 سؤال/);
  assert.match(msg.html, /كويز 6.*22 سؤال/);
  assert.match(msg.html, /كويز 7.*10 أسئلة/);
  assert.match(msg.html, /كويز 8.*34 سؤال/);
  assert.match(msg.html, /كويز 9.*86 سؤال/);
  assert.ok(msg.rows.length >= 8);

  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, text: "/er" });
  const msg2 = calls[calls.length - 1];
  assert.match(msg2.html, /Emergency Medicine/i);
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
  const { router, polls, store } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_i", "1") });

  const sess = store.get("s:123");
  assert.ok(sess.quiz, "Interactive quiz session must be initialized");
  assert.equal(sess.quiz.items.length, 50, "Quiz 1 should load all 50 questions");
  assert.equal(sess.quiz.index, 0);

  // Questions are delivered as native polls: the question text and every option
  // travel inside the poll, so nothing can be hidden behind inline buttons.
  const sent = polls[polls.length - 1];
  assert.match(sent.question, /The recommended maternal position/i);
  assert.match(sent.question, /سؤال 1 من 50|Question 1 of 50/);
  assert.equal(sent.options.length, 4);
  assert.equal(typeof sent.correct, "number");
});

test("emergency download: sends HTML file for single quiz and full 334-question bank", async () => {
  const { router, docs } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "dl", "1") });
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "emergency-quiz-1-50q.html");
  assert.match(docs[0].html, /Emergency Medicine Quiz 1/);

  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, callbackId: "cb2", data: act("em", "dl_all") });
  assert.equal(docs.length, 2);
  assert.equal(docs[1].name, "emergency-medicine-334-mcqs-complete.html");
  assert.match(docs[1].html, /Emergency Medicine &amp; Resuscitation 334 MCQs Complete Bank/);
});

test("emergency radiology quiz: sends photos in interactive mode, poll mode and embeds in HTML", async () => {
  const { router, photos, polls, docs } = setup();

  // Test Quiz 7 interactive mode sends photo of CT scan for Q1
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_i", "7") });
  assert.ok(photos.length >= 1, "Should send a photo for Q205 (CT epidural hematoma)");
  assert.equal(photos[0].name, "q205_epidural.jpg");
  assert.ok(photos[0].buffer && photos[0].buffer.length > 0, "Photo buffer must not be empty");
  assert.match(photos[0].caption, /56 year old male presented by the following CT findings/i);

  // Test Quiz 7 poll mode sends photo before poll
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, callbackId: "cb2", data: act("em", "start_p", "7", "30") });
  assert.ok(photos.length >= 2, "Poll mode should send case photo before starting the poll");
  assert.equal(polls.length, 1);

  // Test HTML download includes base64 image
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 3, callbackId: "cb3", data: act("em", "dl", "7") });
  assert.equal(docs.length, 1);
  assert.match(docs[0].html, /data:image\/jpeg;base64,/i, "HTML should embed base64 image");
});
