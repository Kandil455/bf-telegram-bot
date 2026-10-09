// From source text to a validated document. One call for normal lectures, a map and
// reduce pass for long ones, one repair attempt for malformed JSON, and strict
// normalisation at the end. Returns null when the model cannot produce a usable result.

import { parseJsonLoose } from "../core/text.js";
import { buildChunkPrompt, buildDocumentPrompt, buildMergePrompt, buildOscePrompt, buildRepairPrompt, LIMITS } from "../prompts/summary.js";
import { normaliseDocument, normaliseOsce } from "./schema.js";
import { docText, qualityIssues, reviseDocPrompt, wordsIn } from "../quality/doc.js";

async function askJson(ai, prompt) {
  const first = await ai.complete({ ...prompt, json: true, timeoutMs: 240000 });
  const parsed = parseJsonLoose(first?.text);
  if (parsed) return parsed;
  if (!first) return null;
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
  const parts = chunks(text, LIMITS.chunkChars);
  const sectionLists = [];
  for (let i = 0; i < parts.length; i++) {
    const raw = await askJson(ai, buildChunkPrompt({ template, lang: normaliseOpts.lang, part: i + 1, total: parts.length, text: parts[i] }));
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
