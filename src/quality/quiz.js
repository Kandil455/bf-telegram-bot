// Quality control for generated quiz questions.
//   1. Dedupe: the same question or the same option set twice is removed.
//   2. Shuffle: the correct option is moved to a random position, so models that favour
//      "A" or the longest option do not give the answer away.
//   3. Verify: a second AI pass checks every question against the source. A question
//      with no support, two correct options, or a wrong key is dropped, or replaced by
//      the corrected version the verifier returns.

import { parseJsonLoose } from "../core/text.js";
import { normaliseQuiz } from "../core/quiz.js";
import { quizPrompt } from "../prompts/index.js";

/** Small seeded random generator (mulberry32). Deterministic for tests, random in production. */
export function rng(seed = Math.floor(Math.random() * 2 ** 31)) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Moves the correct option to a random position. Returns a new item. */
export function shuffleOptions(item, rand = Math.random) {
  const order = item.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...item,
    options: order.map((i) => item.options[i]),
    answer: order.indexOf(item.answer),
  };
}

const stem = (q) => String(q).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Removes repeated questions and questions whose option set repeats another one. */
export function dedupe(items) {
  const seenQ = new Set();
  const seenOpts = new Set();
  const out = [];
  for (const it of items) {
    const q = stem(it.q);
    const opts = it.options.map(stem).sort().join("|");
    if (seenQ.has(q) || seenOpts.has(opts)) continue;
    seenQ.add(q);
    seenOpts.add(opts);
    out.push(it);
  }
  return out;
}

export function verifyPrompt({ items, source, lang = "en" }) {
  const language = lang === "ar" ? "Write any corrected text in Modern Standard Arabic." : "Write any corrected text in English.";
  const list = items.map((it, i) => ({ i, q: it.q, options: it.options, answer: it.answer, explanation: it.explanation }));
  return {
    system: [
      "You are a strict exam reviewer. You check multiple-choice questions against the source material.",
      "For each question decide: is the marked answer correct according to the SOURCE; is there exactly one correct option; are the distractors clearly wrong; is the question unambiguous.",
      "If a question is fine, return ok=true. If it is wrong but fixable from the SOURCE, return ok=false with a corrected question in fix. If it cannot be fixed from the SOURCE, return ok=false without fix.",
      "Never add outside knowledge. A correct answer must be supported by the SOURCE.",
      language,
      'Return JSON only: {"results":[{"i":0,"ok":true} or {"i":1,"ok":false,"reason":"...","fix":{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}}]}',
    ].join("\n"),
    user: `SOURCE:\n"""\n${String(source).slice(0, 14000)}\n"""\n\nQUESTIONS:\n${JSON.stringify(list)}`,
    json: true,
    maxTokens: 2400,
  };
}

/**
 * Applies a verification reply. Returns the questions that passed, plus the fixed ones.
 * An unparseable reply keeps everything (the verifier is advisory, not a gate).
 */
export function applyVerification(items, raw) {
  const j = parseJsonLoose(raw);
  if (!j || !Array.isArray(j.results)) return { items, dropped: 0, fixed: 0 };
  const byIdx = new Map(j.results.filter((r) => Number.isInteger(r?.i)).map((r) => [r.i, r]));
  const out = [];
  let dropped = 0;
  let fixed = 0;
  items.forEach((it, i) => {
    const r = byIdx.get(i);
    if (!r || r.ok === true) return out.push(it);
    if (r.fix) {
      const [clean] = normaliseQuiz({ questions: [r.fix] }, 1);
      if (clean) {
        fixed += 1;
        return out.push({ ...clean, image: it.image, imageCaption: it.imageCaption });
      }
    }
    dropped += 1;
  });
  return { items: out, dropped, fixed };
}

/**
 * The whole pipeline for generated questions: dedupe, verify (if enabled and an AI
 * is available), then shuffle. Returns { items, report }.
 */
export async function qualityPass({ items, source, lang = "en", ai, verify = true, rand = Math.random }) {
  const report = { input: items.length, duplicates: 0, dropped: 0, fixed: 0, verified: false };
  let out = dedupe(items);
  report.duplicates = items.length - out.length;
  if (verify && ai && out.length) {
    const reply = await ai.complete(verifyPrompt({ items: out, source, lang })).catch(() => null);
    if (reply) {
      const applied = applyVerification(out, reply.text);
      out = applied.items;
      report.dropped = applied.dropped;
      report.fixed = applied.fixed;
      report.verified = true;
    }
  }
  out = out.map((it) => shuffleOptions(it, rand));
  return { items: out, report };
}

/**
 * Weak models often return fewer questions than asked. This asks once more for the missing
 * number, and tells the model which questions already exist so it does not repeat them.
 */
export async function topUpQuiz({ ai, items, count, source, lang = "en", topic = null }) {
  const have = dedupe(items);
  if (have.length >= count || !ai) return have.slice(0, count);
  const missing = count - have.length;
  const reply = await ai.complete(quizPrompt({ lang, source, count: missing, topic, avoid: have.map((i) => i.q) })).catch(() => null);
  const extra = normaliseQuiz(parseJsonLoose(reply?.text), missing);
  return dedupe([...have, ...extra]).slice(0, count);
}
