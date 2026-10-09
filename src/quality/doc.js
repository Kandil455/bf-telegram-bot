// Quality checks for generated study documents.
//   * Grounding: every specific number in the document must appear in the source.
//     A number the source does not contain is a likely invention, and is reported.
//   * Coverage: a long source needs enough sections to cover it. A thin result is reported.
// Issues go back to the model once, as a revision request, and the revised document is
// used only if it still passes the normalisation.

const SMALL = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
const NUM = /(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?/gu;

export function normaliseNumber(n) {
  return String(n).replace(",", ".").replace(/\.0+$/, "");
}

/** Numbers that a reader would expect to be checked: decimals, percentages, and anything above ten. */
export function numbersIn(text = "") {
  const found = new Set();
  for (const m of String(text).matchAll(NUM)) {
    const n = normaliseNumber(m[0]);
    if (SMALL.has(n) && !/\./.test(n)) continue;
    found.add(n);
  }
  return found;
}

/** Every piece of text in a document, flattened, for checks. */
export function docText(doc) {
  const out = [];
  const walk = (v) => {
    if (v == null) return;
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(doc);
  return out.join("\n");
}

export function ungroundedNumbers(doc, sourceText) {
  const inSource = numbersIn(sourceText);
  return [...numbersIn(docText(doc))].filter((n) => !inSource.has(n));
}

const RATIO = { concise: 0.15, standard: 0.25, detailed: 0.4 };

export function wordsIn(text = "") {
  return String(text).split(/\s+/).filter(Boolean).length;
}

/** The document must be proportionate to the source. A thin result for a big file is reported. */
export function densityIssue(doc, sourceText, detail = "standard") {
  const srcWords = wordsIn(sourceText);
  if (srcWords < 300) return null;
  const outWords = wordsIn(docText(doc));
  const min = Math.min(6000, Math.max(400, Math.round(srcWords * (RATIO[detail] || RATIO.standard))));
  if (outWords >= min) return null;
  return `the document has ${outWords} words for a source of ${srcWords} words, and the target is at least ${min}. Expand each section with the specific details, worked examples and exam traps the source gives, without repeating yourself`;
}

export function coverageIssues(doc, sourceLength) {
  const issues = [];
  const sections = doc.sections?.length || 0;
  const need = sourceLength > 10000 ? 10 : sourceLength > 3000 ? 6 : 3;
  if (sections < need) issues.push(`only ${sections} sections for a ${sourceLength}-character source (expected at least ${need}); cover every topic`);
  return issues;
}

/** Everything the reviser must fix, as short plain sentences. */
export function qualityIssues(doc, sourceText, detail = "standard") {
  const issues = [];
  const dense = densityIssue(doc, sourceText, detail);
  if (dense) issues.push(dense);
  const bad = ungroundedNumbers(doc, sourceText);
  if (bad.length) issues.push(`these numbers do not appear in the source, so remove them or correct them from the source: ${bad.slice(0, 12).join(", ")}`);
  issues.push(...coverageIssues(doc, sourceText.length));
  return issues.filter(Boolean);
}

export function reviseDocPrompt({ docJson, issues, sourceText, lang = "en" }) {
  const language = lang === "ar" ? "Keep the Arabic text in Modern Standard Arabic." : "Keep the English text in clear English.";
  return {
    system: [
      "You revise a study document so that it is faithful to its source.",
      "Fix only what is listed. Keep the same JSON shape and section order. Remove any claim that the source does not support. Never add outside facts.",
      language,
      "Return the complete corrected JSON object only.",
    ].join("\n"),
    user: `ISSUES TO FIX:\n- ${issues.join("\n- ")}\n\nSOURCE:\n"""\n${String(sourceText).slice(0, 14000)}\n"""\n\nDOCUMENT (JSON):\n${docJson}`,
    json: true,
    maxTokens: 3200,
  };
}
