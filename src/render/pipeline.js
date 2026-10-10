// From source text to a validated document. One call for normal lectures, a map and
// reduce pass for long ones, one repair attempt for malformed JSON, and strict
// normalisation at the end. Returns null when the model cannot produce a usable result.

import { parseJsonLoose } from "../core/text.js";
import { buildChunkPrompt, buildDocumentPrompt, buildMergePrompt, buildOscePrompt, buildRepairPrompt, LIMITS } from "../prompts/summary.js";
import { normaliseDocument, normaliseOsce } from "./schema.js";
import { docText, qualityIssues, reviseDocPrompt, wordsIn } from "../quality/doc.js";

const RETRY_DELAYS_MS = [4000, 12000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One JSON reply from the model. When every provider returned nothing (usually a rate limit
 * or a timeout), it waits and tries again, so a long file does not die on one busy moment.
 * A reply that came back but is malformed gets one repair attempt, as before.
 */
async function askJson(ai, prompt) {
  let first = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    first = await ai.complete({ ...prompt, json: true, timeoutMs: 240000 });
    if (first) break;
    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }
  if (!first) return null;
  const parsed = parseJsonLoose(first.text);
  if (parsed) return parsed;
  const again = await ai.complete({ ...buildRepairPrompt(first.text), json: true, timeoutMs: 240000 });
  return parseJsonLoose(again?.text);
}

/**
 * One revision pass when the document has grounding or coverage problems. The revised
 * document is used only if it still keeps most of its sections; otherwise the original stays.
 */
async function reviseIfNeeded({ ai, doc, text, lang, opts, detail = "standard" }) {
  const issues = qualityIssues(doc, text, detail);
  if (!issues.length) return doc;
  const raw = await askJson(ai, reviseDocPrompt({ docJson: JSON.stringify(doc).slice(0, 30000), issues, sourceText: text, lang }));
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
export async function generateDocument({ ai, template, lang, title, text, images = [], detail = "standard" }) {
  const normaliseOpts = { lang: lang === "ar" ? "ar" : lang === "bilingual" ? "bilingual" : "en", images };

  if (template === "osce") {
    const prompt = buildOscePrompt({ lang: normaliseOpts.lang, title, text });
    const raw = await askJson(ai, prompt);
    const osce = normaliseOsce(raw, { lang: normaliseOpts.lang });
    return osce.stations.length ? { kind: "osce", osce } : null;
  }

  if (text.length <= LIMITS.maxSourceChars) {
    const raw = await askJson(ai, buildDocumentPrompt({ template, lang: normaliseOpts.lang, title, text, images, detail }));
    const first = normaliseDocument(raw, normaliseOpts);
    if (!first.sections.length) return null;
    const doc = await reviseIfNeeded({ ai, doc: first, text, lang: normaliseOpts.lang, opts: normaliseOpts, detail });
    return { kind: "doc", doc };
  }

  // Long lecture: summarise each part, then merge the section lists.
  // Parts are independent, so they run in parallel (a few at a time to respect provider limits).
  // Results are kept in part order, so the merged document still reads top to bottom.
  const parts = chunks(text, LIMITS.chunkChars);
  const results = await mapLimit(parts, CHUNK_CONCURRENCY, (part, i) =>
    askJson(ai, buildChunkPrompt({ template, lang: normaliseOpts.lang, part: i + 1, total: parts.length, text: part, images: imagesForPart(images, part) }))
  );
  const sectionLists = [];
  for (const raw of results) {
    if (Array.isArray(raw?.sections)) sectionLists.push(...raw.sections);
  }
  if (!sectionLists.length) return null;
  // Keep every part's sections. A merge that asks the model to shrink them is what made big
  // files come out small, so it only runs when there are too many sections to show at once.
  let merged = null;
  if (sectionLists.length > 150) {
    merged = await askJson(
      ai,
      buildMergePrompt({ template, lang: normaliseOpts.lang, title, sectionsJson: JSON.stringify(sectionLists).slice(0, 40000) })
    );
  }
  const first = normaliseDocument(merged ?? { title, sections: sectionLists }, normaliseOpts);
  if (!first.sections.length) return null;
  const doc = await reviseIfNeeded({ ai, doc: first, text, lang: normaliseOpts.lang, opts: normaliseOpts, detail });
  return { kind: "doc", doc };
}
