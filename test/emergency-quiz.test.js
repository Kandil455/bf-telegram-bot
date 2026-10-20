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

test("emergency quiz data: exactly 182 questions across 14 parts and 5 categories", () => {
  assert.equal(EMERGENCY_QUIZ_CATEGORIES.length, 5);
  assert.equal(EMERGENCY_QUIZ_PARTS.length, 14);
  assert.equal(EMERGENCY_QUIZ_ITEMS.length, 182);

  // Check categories sum up to 182
  const core = getEmergencyQuizCategory("core");
  assert.equal(core.length, 50);

  const chest = getEmergencyQuizCategory("chest");
  assert.equal(chest.length, 45);

  const trauma = getEmergencyQuizCategory("trauma");
  assert.equal(trauma.length, 43);

  const shock = getEmergencyQuizCategory("shock");
  assert.equal(shock.length, 27);

  const gi = getEmergencyQuizCategory("gi");
  assert.equal(gi.length, 17);

  for (let p = 1; p <= 14; p++) {
    const part = getEmergencyQuizPart(p);
    assert.ok(part.length >= 10, `Part ${p} should have at least 10 questions`);
  }
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

test("emergency quiz limits: telegram poll constraints strictly met across all 182 questions", () => {
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

test("emergency command: /emergency and /er display the 5-module menu", async () => {
  const { router, calls } = setup();
  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, text: "/emergency" });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /Emergency Medicine 182 MCQs/i);
  assert.match(msg.html, /امتحان الطوارئ والإنعاش الشامل/);
  assert.match(msg.html, /آلام الصدر واضطراب النبض/);
  assert.match(msg.html, /الحوادث وإصابات التروما/);
  assert.ok(msg.rows.length >= 5);

  await router.onMessage({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, text: "/er" });
  const msg2 = calls[calls.length - 1];
  assert.match(msg2.html, /Emergency Medicine 182 MCQs/i);
});

test("emergency category view: opens category parts", async () => {
  const { router, calls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "cat", "chest") });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /آلام الصدر واضطراب النبض/);
  assert.match(msg.html, /45 سؤال/);
  const flat = msg.rows.flat();
  assert.ok(flat.some((b) => b.callback_data === act("em", "p", "6")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "dl_cat", "chest")));
});

test("emergency quiz launch: selecting a part presents launch modes", async () => {
  const { router, calls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "p", "1") });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /كويز الطوارئ رقم 1/);
  assert.match(msg.html, /10 سؤال/);
  const flat = msg.rows.flat();
  assert.ok(flat.some((b) => b.callback_data === act("em", "start_p", "1", "30")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "start_i", "1")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "dl", "1")));
  assert.ok(flat.some((b) => b.callback_data === act("em", "send_all", "1")));
});

test("emergency poll mode: launches telegram poll quiz with openPeriod timer", async () => {
  const { router, polls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_p", "1", "30") });

  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 30);
  assert.match(polls[0].question, /The recommended maternal position/i);
});

test("emergency interactive mode: initiates interactive session", async () => {
  const { router, calls, store } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "start_i", "1") });

  const sess = store.get("s:123");
  assert.ok(sess.quiz, "Interactive quiz session must be initialized");
  assert.equal(sess.quiz.items.length, 10);
  assert.equal(sess.quiz.index, 0);

  const last = calls[calls.length - 1];
  assert.match(last.html, /The recommended maternal position/i);
  const qaButtons = last.rows.flat().filter((b) => b.callback_data && b.callback_data.startsWith("a:qa:"));
  assert.equal(qaButtons.length, 4); // 4 option buttons A, B, C, D
});

test("emergency download: sends HTML file for single part, category, and full 182-question bank", async () => {
  const { router, docs } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 1, callbackId: "cb1", data: act("em", "dl", "1") });
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "emergency-quiz-1-10q.html");
  assert.match(docs[0].html, /Emergency Medicine Quiz 1/);

  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 2, callbackId: "cb2", data: act("em", "dl_cat", "chest") });
  assert.equal(docs.length, 2);
  assert.equal(docs[1].name, "emergency-chest-45q.html");
  assert.match(docs[1].html, /Chest Pain.*Dysrhythmias/);

  await router.onCallback({ chatId: 123, userId: 123, firstName: "Doctor", messageId: 3, callbackId: "cb3", data: act("em", "dl_all") });
  assert.equal(docs.length, 3);
  assert.equal(docs[2].name, "emergency-medicine-182-mcqs-complete.html");
  assert.match(docs[2].html, /Emergency Medicine 182 MCQs Complete Bank/);
});
