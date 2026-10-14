// From source text to a validated document. One call for normal lectures, a map and
// reduce pass for long ones, one repair attempt for malformed JSON, and strict
// normalisation at the end. Returns null when the model cannot produce a usable result.

import { parseJsonLoose } from "../core/text.js";
import { buildChunkPrompt, buildDocumentPrompt, buildMergePrompt, buildOscePrompt, buildRepairPrompt, LIMITS } from "../prompts/summary.js";
import { normaliseDocument, normaliseOsce } from "./schema.js";
import { docText, qualityIssues, reviseDocPrompt, wordsIn } from "../quality/doc.js";
import { normaliseUsage } from "../services/ai.js";

const RETRY_DELAYS_MS = process.env.NODE_TEST_CONTEXT ? [1, 2] : [4000, 12000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function addUsage(acc, u) {
  if (!u) return acc;
  acc.promptTokens += Number(u.promptTokens) || 0;
  acc.completionTokens += Number(u.completionTokens) || 0;
  acc.totalTokens += Number(u.totalTokens) || 0;
  return acc;
}

/**
 * One JSON reply from the model. When every provider returned nothing (usually a rate limit
 * or a timeout), it waits and tries again, so a long file does not die on one busy moment.
 * A reply that came back but is malformed gets one repair attempt, as before.
 */
async function askJson(ai, prompt, usageAcc = null) {
  let first = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    first = await ai.complete({ ...prompt, json: true, timeoutMs: 240000 });
    if (first) break;
    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }
  if (!first) return null;
  if (usageAcc) {
    addUsage(usageAcc, first.usage || normaliseUsage(null, `${prompt.system || ""}\n${prompt.user || ""}`, first.text));
  }
  const parsed = parseJsonLoose(first.text);
  if (parsed) return parsed;
  const repairPrompt = buildRepairPrompt(first.text);
  const again = await ai.complete({ ...repairPrompt, json: true, timeoutMs: 240000 });
  if (again && usageAcc) {
    addUsage(usageAcc, again.usage || normaliseUsage(null, `${repairPrompt.system}\n${repairPrompt.user}`, again.text));
  }
  return parseJsonLoose(again?.text);
}

/**
 * One revision pass when the document has grounding or coverage problems. The revised
 * document is used only if it still keeps most of its sections; otherwise the original stays.
 */
async function reviseIfNeeded({ ai, doc, text, lang, opts, detail = "standard", usageAcc = null }) {
  const issues = qualityIssues(doc, text, detail);
  if (!issues.length) return doc;
  const raw = await askJson(
    ai,
    reviseDocPrompt({ docJson: JSON.stringify(doc).slice(0, 30000), issues, sourceText: text, lang }),
    usageAcc
  );
  if (!raw) return doc;
  const revised = normaliseDocument(raw, opts);
  const keepsStructure = revised.sections.length >= Math.max(1, Math.floor(doc.sections.length * 0.7));
  const notShorter = wordsIn(docText(revised)) >= wordsIn(docText(doc));
  return keepsStructure && notShorter ? revised : doc;
}

function chunks(text, size) {
  const out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

// One part at a time by default. Parallel parts hit the provider rate limit (429) on free keys,
// and one rate-limited part used to fail the whole file. Raise it only with paid keys.
const CHUNK_CONCURRENCY = Number(process.env.SUMMARY_PARALLEL_PARTS) || 1;

/** Runs fn over items with at most `limit` in flight. Results keep the input order. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const WORD = /[\p{L}\p{N}]{4,}/gu;

/**
 * The images a part should see: those whose caption shares a word with the part's text.
 * When no caption matches, the part gets every image, so an approved picture is never dropped.
 */
export function imagesForPart(images, partText) {
  if (!images.length) return [];
  const words = new Set((String(partText).toLowerCase().match(WORD) || []));
  const matched = images.filter((img) => {
    const cap = String(img.caption || "").toLowerCase().match(WORD) || [];
    return cap.some((w) => words.has(w));
  });
  return matched.length ? matched : images;
}

/**
 * Produces a normalised document. `images` are [{ mime, b64, caption }] in the order
 * the user sent them; captions drive where figures are placed.
 */
export async function generateDocument({ ai, template, lang, title, text, images = [], detail = "standard", pages = null }) {
  const normaliseOpts = { lang: lang === "ar" ? "ar" : lang === "bilingual" ? "bilingual" : "en", images };
  const usageAcc = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  if (template === "osce") {
    const prompt = buildOscePrompt({ lang: normaliseOpts.lang, title, text });
    const raw = await askJson(ai, prompt, usageAcc);
    const osce = normaliseOsce(raw, { lang: normaliseOpts.lang });
    return osce.stations.length ? { kind: "osce", osce, usage: usageAcc } : null;
  }

  if (text.length <= LIMITS.maxSourceChars) {
    const raw = await askJson(
      ai,
      buildDocumentPrompt({ template, lang: normaliseOpts.lang, title, text, images, detail, pages }),
      usageAcc
    );
    const first = normaliseDocument(raw, normaliseOpts);
    if (!first.sections.length) return null;
    const doc = await reviseIfNeeded({ ai, doc: first, text, lang: normaliseOpts.lang, opts: normaliseOpts, detail, usageAcc });
    return { kind: "doc", doc, usage: usageAcc };
  }

  // Long lecture: summarise each part, then merge the section lists.
  const parts = chunks(text, LIMITS.chunkChars);
  const results = await mapLimit(parts, CHUNK_CONCURRENCY, (part, i) =>
    askJson(
      ai,
      buildChunkPrompt({ template, lang: normaliseOpts.lang, part: i + 1, total: parts.length, text: part, images: imagesForPart(images, part) }),
      usageAcc
    )
  );
  const sectionLists = [];
  for (const raw of results) {
    if (Array.isArray(raw?.sections)) sectionLists.push(...raw.sections);
  }
  if (!sectionLists.length) return null;
  let merged = null;
  if (sectionLists.length > 150) {
    merged = await askJson(
      ai,
      buildMergePrompt({ template, lang: normaliseOpts.lang, title, sectionsJson: JSON.stringify(sectionLists).slice(0, 40000) }),
      usageAcc
    );
  }
  const first = normaliseDocument(merged ?? { title, sections: sectionLists }, normaliseOpts);
  if (!first.sections.length) return null;
  const doc = await reviseIfNeeded({ ai, doc: first, text, lang: normaliseOpts.lang, opts: normaliseOpts, detail, usageAcc });
  return { kind: "doc", doc, usage: usageAcc };
}
