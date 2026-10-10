import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { createAiMetrics, buildDailyReport } from "../src/features/daily-report.js";

test("metrics: counts ok and failed per provider and the total time", () => {
  const store = createStore({ dataDir: null });
  const m = createAiMetrics(store);
  m.record({ provider: "gemini", outcome: "ok", ms: 2000 });
  m.record({ provider: "gemini", outcome: "http-429", ms: 1000 });
  m.record({ provider: "groq", outcome: "ok", ms: 500 });
  const t = m.today();
  assert.equal(t.ok, 2);
  assert.equal(t.failed, 1);
  assert.equal(t.totalMs, 3500);
  assert.deepEqual(t.byProvider.gemini, { ok: 1, failed: 1 });
});

test("metrics: a paused provider (breaker open) is not counted as a failure", () => {
  const store = createStore({ dataDir: null });
  const m = createAiMetrics(store);
  m.record({ provider: "gemini", outcome: "skipped-breaker-open", ms: 0 });
  assert.equal(m.today().failed, 0);
});

test("report: shows the counts, the failure rate and the average time", () => {
  const text = buildDailyReport({ tasks: 12, files: 4, quizzes: 2, cacheHits: 3, activeUsers: 5,
    ai: { ok: 9, failed: 1, totalMs: 10000, byProvider: { gemini: { ok: 8, failed: 1 } } }, lang: "en" });
  assert.match(text, /Tasks<\/b>|Tasks: <b>12/);
  assert.match(text, /10%/);
  assert.match(text, /1\.0s/);
  assert.match(text, /gemini: 1/);
});

test("report: with no AI calls it says so, and has no failure line", () => {
  const text = buildDailyReport({ lang: "ar" });
  assert.doesNotMatch(text, /فشل حسب المزود/);
});
