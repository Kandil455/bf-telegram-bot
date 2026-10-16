import test from "node:test";
import assert from "node:assert/strict";
import { act } from "../src/core/actions.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createRouter } from "../src/router.js";
import { createGroups } from "../src/features/groups.js";
import { ORTHO_QUIZ_PARTS, ORTHO_QUIZ_ITEMS, getOrthoQuizPart } from "../src/data/ortho-quiz.js";

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

test("ortho quiz data: 501 questions across 10 parts of 50 questions each", () => {
  assert.equal(ORTHO_QUIZ_PARTS.length, 10);
  assert.equal(ORTHO_QUIZ_ITEMS.length, 501);

  for (let p = 1; p <= 9; p++) {
    const part = getOrthoQuizPart(p);
    assert.equal(part.length, 50, `Part ${p} should have 50 questions`);
  }
  const part10 = getOrthoQuizPart(10);
  assert.equal(part10.length, 51, "Part 10 should have 51 questions");
});

test("ortho command: /ortho displays the 10-part quiz menu", async () => {
  const { router, calls } = setup();
  await router.onMessage({ chatId: 123, userId: 123, firstName: "Student", messageId: 1, text: "/ortho" });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /Orthopaedics 501 MCQs/);
  assert.match(msg.html, /كويز 1/);
  assert.match(msg.html, /كويز 10/);
  assert.ok(msg.rows.length >= 6);
});

test("ortho quiz launch: selecting a part presents launch modes", async () => {
  const { router, calls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Student", messageId: 1, callbackId: "cb1", data: act("ortho", "p", "1") });

  const msg = calls[calls.length - 1];
  assert.match(msg.html, /كويز العظام رقم 1/);
  assert.match(msg.html, /50 سؤال/);
  const flat = msg.rows.flat();
  assert.ok(flat.some((b) => b.callback_data === act("ortho", "start_p", "1", "30")));
  assert.ok(flat.some((b) => b.callback_data === act("ortho", "start_i", "1")));
});

test("ortho poll mode: launches telegram poll quiz with openPeriod timer", async () => {
  const { router, polls, calls } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Student", messageId: 1, callbackId: "cb1", data: act("ortho", "start_p", "1", "30") });

  assert.equal(polls.length, 1);
  assert.equal(polls[0].openPeriod, 30);
  assert.match(polls[0].question, /The most common symptom in orthopaedics/i);
  assert.equal(polls[0].correct, 2); // Pain is (c) -> index 2
  const confirmMsg = calls[calls.length - 1];
  assert.match(confirmMsg.html, /تم إطلاق كويز العظام 1/);
});

test("ortho interactive mode: starts in-bot quiz with clean letter buttons", async () => {
  const { router, calls, store } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Student", messageId: 1, callbackId: "cb1", data: act("ortho", "start_i", "2") });

  const startMsg = calls[calls.length - 1];
  assert.match(startMsg.html, /سؤال 1 من 50/);
  const sess = store.get("s:123");
  assert.ok(sess.quiz);
  assert.equal(sess.quiz.items.length, 50);

  // Buttons are letters [A], [B], [C], [D], [E]
  const labels = startMsg.rows.flat().map((b) => b.text);
  assert.ok(labels.includes("A"));
  assert.ok(labels.includes("B"));
  assert.ok(labels.includes("C"));
});

test("ortho download: single part and all parts HTML export", async () => {
  const { router, docs } = setup();
  await router.onCallback({ chatId: 123, userId: 123, firstName: "Student", messageId: 1, callbackId: "cb1", data: act("ortho", "dl", "1") });
  assert.equal(docs.length, 1);
  assert.equal(docs[0].name, "ortho-quiz-1-50q.html");

  await router.onCallback({ chatId: 123, userId: 123, firstName: "Student", messageId: 2, callbackId: "cb2", data: act("ortho", "dl_all") });
  assert.equal(docs.length, 2);
  assert.equal(docs[1].name, "orthopaedics-501-mcqs-complete.html");
  assert.match(docs[1].html, /501 Questions/i);
});
