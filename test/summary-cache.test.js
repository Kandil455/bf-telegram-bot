import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { cachedSummary, summaryKey } from "../src/services/summary-cache.js";

test("cache: the same file, template and language is served without calling the AI", async () => {
  const store = createStore({ dataDir: null });
  const run = cachedSummary(store);
  let calls = 0;
  const keys = { text: "Supply and demand lecture", template: "cram", lang: "en" };
  const first = await run(keys, async () => { calls++; return { html: "<p>one</p>" }; });
  const second = await run(keys, async () => { calls++; return { html: "<p>two</p>" }; });
  assert.equal(calls, 1, "the AI is called once");
  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
  assert.equal(second.html, "<p>one</p>");
});

test("cache: a different template or language is a different summary", () => {
  const a = summaryKey({ text: "x", template: "cram", lang: "en" });
  assert.notEqual(a, summaryKey({ text: "x", template: "cornell", lang: "en" }));
  assert.notEqual(a, summaryKey({ text: "x", template: "cram", lang: "ar" }));
});

test("cache: a changed file never gets the old summary", () => {
  assert.notEqual(summaryKey({ text: "lecture one", template: "cram", lang: "en" }), summaryKey({ text: "lecture two", template: "cram", lang: "en" }));
});

test("cache: a failed generation (null) is not stored, so the next try really runs", async () => {
  const store = createStore({ dataDir: null });
  const run = cachedSummary(store);
  const keys = { text: "t", template: "cram", lang: "en" };
  assert.equal(await run(keys, async () => null), null);
  let calls = 0;
  await run(keys, async () => { calls++; return { html: "ok" }; });
  assert.equal(calls, 1, "the failure was not cached");
});

test("cache: entries expire after the TTL", async () => {
  const store = createStore({ dataDir: null });
  const run = cachedSummary(store, { ttlMs: 1 });
  const keys = { text: "t", template: "cram", lang: "en" };
  await run(keys, async () => ({ html: "a" }));
  await new Promise((r) => setTimeout(r, 10));
  let calls = 0;
  await run(keys, async () => { calls++; return { html: "b" }; });
  assert.equal(calls, 1);
});
