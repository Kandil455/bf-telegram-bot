import test from "node:test";
import assert from "node:assert/strict";
import { rng, shuffleOptions, dedupe, applyVerification, qualityPass } from "../src/quality/quiz.js";
import { numbersIn, ungroundedNumbers, coverageIssues, qualityIssues } from "../src/quality/doc.js";
import { normaliseDocument } from "../src/render/schema.js";

const item = (q, options, answer) => ({ q, options, answer, explanation: "because" });

test("shuffle: the marked answer still points at the same text after shuffling", () => {
  const base = item("Which?", ["alpha", "beta", "gamma", "delta"], 2);
  for (let seed = 1; seed < 40; seed++) {
    const s = shuffleOptions(base, rng(seed));
    assert.equal(s.options[s.answer], "gamma");
    assert.deepEqual([...s.options].sort(), ["alpha", "beta", "delta", "gamma"]);
  }
});

test("shuffle: the correct answer does not always end up in the same place", () => {
  const positions = new Set();
  for (let seed = 1; seed < 60; seed++) positions.add(shuffleOptions(item("Q", ["a", "b", "c", "d"], 0), rng(seed)).answer);
  assert.ok(positions.size >= 3, "several positions appear across runs");
});

test("dedupe: repeated questions and repeated option sets are removed", () => {
  const out = dedupe([
    item("What is GDP?", ["a", "b"], 0),
    item("what is GDP", ["x", "y"], 1),
    item("Another?", ["b", "a"], 0),
    item("Third?", ["p", "q"], 0),
  ]);
  assert.equal(out.length, 2, "the duplicate question and the reordered option set are dropped");
});

test("verification: wrong questions are dropped, fixable ones replaced, good ones kept", () => {
  const items = [item("Good?", ["a", "b", "c", "d"], 0), item("Bad?", ["a", "b", "c", "d"], 1), item("Fixable?", ["a", "b", "c", "d"], 0)];
  const reply = JSON.stringify({
    results: [
      { i: 0, ok: true },
      { i: 1, ok: false, reason: "not in source" },
      { i: 2, ok: false, fix: { q: "Fixed?", options: ["w", "x", "y", "z"], answer: 3, explanation: "from source" } },
    ],
  });
  const out = applyVerification(items, reply);
  assert.equal(out.dropped, 1);
  assert.equal(out.fixed, 1);
  assert.deepEqual(out.items.map((i) => i.q), ["Good?", "Fixed?"]);
  assert.equal(out.items[1].answer, 3);
});

test("verification: an unreadable reply keeps every question (the verifier is advisory)", () => {
  const items = [item("A?", ["a", "b"], 0)];
  assert.equal(applyVerification(items, "garbage").items.length, 1);
});

test("quality pass: runs dedupe, verification and shuffle, and reports what it did", async () => {
  const ai = { complete: async () => ({ text: JSON.stringify({ results: [{ i: 0, ok: true }, { i: 1, ok: false, reason: "x" }] }), provider: "fake" }) };
  const { items, report } = await qualityPass({
    items: [item("Keep?", ["a", "b", "c", "d"], 0), item("Drop?", ["e", "f", "g", "h"], 0), item("keep?", ["i", "j"], 1)],
    source: "src",
    ai,
    rand: rng(3),
  });
  assert.equal(report.duplicates, 1, "the repeated question is removed before verification");
  assert.equal(report.dropped, 1, "the verifier drops the unsupported question");
  assert.equal(report.verified, true);
  assert.equal(items.length, 1);
});

test("grounding: numbers the source does not contain are flagged; plain small counts are not", () => {
  const source = "Demand fell by 20% when price rose 0.5 units. There are 3 cases.";
  const doc = normaliseDocument({ sections: [{ type: "points", items: ["Demand fell 35% after a 20% rise.", "Step 2 of 3 applies."] }] });
  const bad = ungroundedNumbers(doc, source);
  assert.deepEqual(bad, ["35"]);
  assert.ok(numbersIn("price 0.5 and 2025").has("0.5"));
});

test("coverage: long sources need more sections; short ones are fine with a few", () => {
  const thin = normaliseDocument({ sections: [{ type: "points", items: ["x"] }] });
  assert.ok(coverageIssues(thin, 12000).length === 1);
  const three = normaliseDocument({ sections: [{ type: "points", items: ["x"] }, { type: "points", items: ["y"] }, { type: "points", items: ["z"] }] });
  assert.equal(coverageIssues(three, 500).length, 0);
  const issues = qualityIssues(thin, "x".repeat(5000));
  assert.ok(issues.some((i) => /sections/.test(i)));
});

test("top-up: a weak model that returns too few questions is asked again for the rest", async () => {
  const { topUpQuiz } = await import("../src/quality/quiz.js");
  let calls = 0;
  const ai = {
    complete: async (opts) => {
      calls += 1;
      assert.match(opts.user, /Do not repeat or paraphrase/, "the retry lists what already exists");
      return { text: JSON.stringify({ questions: [{ q: "Second?", options: ["c", "d"], answer: 1, explanation: "" }] }), provider: "fake" };
    },
  };
  const out = await topUpQuiz({ ai, items: [item("First?", ["a", "b"], 0)], count: 2, source: "src" });
  assert.equal(calls, 1);
  assert.deepEqual(out.map((q) => q.q), ["First?", "Second?"]);
});
