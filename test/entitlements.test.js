import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { createEntitlements, QUIZ_SIZES } from "../src/services/entitlements.js";

const cfg = { freeFilesPerDay: 2, proFilesPerDay: 10, maxQuestionsPerFile: 30 };

test("files: free users get two uploads a day, the third is refused", () => {
  let t = Date.UTC(2026, 9, 8, 10);
  const ent = createEntitlements({ store: createStore({ dataDir: null }), cfg, now: () => t });
  assert.equal(ent.takeFileSlot(1).ok, true);
  assert.equal(ent.takeFileSlot(1).ok, true);
  const third = ent.takeFileSlot(1);
  assert.equal(third.ok, false);
  assert.equal(third.left, 0);
  assert.equal(ent.takeFileSlot(2).ok, true, "another user is not affected");
});

test("files: the allowance resets at the next day", () => {
  let t = Date.UTC(2026, 9, 8, 10);
  const ent = createEntitlements({ store: createStore({ dataDir: null }), cfg, now: () => t });
  ent.takeFileSlot(1);
  ent.takeFileSlot(1);
  t = Date.UTC(2026, 9, 9, 0, 5);
  assert.equal(ent.takeFileSlot(1).ok, true);
});

test("files: Pro users and admins get more or no limit", () => {
  const plans = { active: (id) => (id === 5 ? "pro" : "free") };
  const ent = createEntitlements({ store: createStore({ dataDir: null }), cfg, plans, admins: new Set([9]) });
  assert.equal(ent.filesLimit(5), 10);
  assert.equal(ent.filesLimit(6), 2);
  for (let i = 0; i < 50; i++) assert.equal(ent.takeFileSlot(9).ok, true);
});

test("questions: a file never exceeds 30 across all its quizzes", () => {
  const ent = createEntitlements({ store: createStore({ dataDir: null }), cfg });
  assert.deepEqual(ent.allowedQuizSizes({ questionsUsed: 0 }, 1), [5, 10, 15, 20, 30]);
  assert.deepEqual(ent.allowedQuizSizes({ questionsUsed: 20 }, 1), [5, 10]);
  assert.deepEqual(ent.allowedQuizSizes({ questionsUsed: 25 }, 1), [5]);
  assert.deepEqual(ent.allowedQuizSizes({ questionsUsed: 26 }, 1), []);
  assert.deepEqual(ent.allowedQuizSizes({ questionsUsed: 30 }, 1), []);
  assert.deepEqual(QUIZ_SIZES, [5, 10, 15, 20, 30]);
});
