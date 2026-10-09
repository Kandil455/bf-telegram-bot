// Measurements of one run, so quality can be judged on real files instead of by feel.
// Pure functions: the evaluation script feeds them the generated document and the report.

import { docText, ungroundedNumbers, wordsIn } from "./doc.js";

/** Measures a generated document against its source. */
export function documentMetrics(doc, sourceText) {
  const sourceWords = wordsIn(sourceText);
  const docWords = wordsIn(docText(doc));
  const figures = (doc.sections || []).filter((s) => s.type === "figure").length;
  return {
    sourceWords,
    docWords,
    ratio: sourceWords ? Number((docWords / sourceWords).toFixed(3)) : 0,
    sections: (doc.sections || []).length,
    figures,
    ungroundedNumbers: ungroundedNumbers(doc, sourceText),
  };
}

/** Measures a quiz run: how many were asked, kept, fixed and dropped, and how the answers are spread. */
export function quizMetrics(items, requested, report = {}) {
  const positions = [0, 0, 0, 0];
  for (const it of items) positions[it.answer] = (positions[it.answer] || 0) + 1;
  return {
    requested,
    produced: items.length,
    duplicates: report.duplicates || 0,
    verifiedDropped: report.dropped || 0,
    verifiedFixed: report.fixed || 0,
    verified: Boolean(report.verified),
    answerPositions: positions,
  };
}

/** A pass/fail verdict for one file, with the reasons. */
export function verdict(doc, quiz, { minRatio = 0.15, minQuizShare = 0.8 } = {}) {
  const reasons = [];
  if (doc.ratio < minRatio) reasons.push(`summary is too short (${doc.ratio} of the source)`);
  if (doc.ungroundedNumbers.length) reasons.push(`numbers not in the source: ${doc.ungroundedNumbers.slice(0, 5).join(", ")}`);
  if (quiz && quiz.produced < quiz.requested * minQuizShare) reasons.push(`quiz gave ${quiz.produced} of ${quiz.requested} questions`);
  return { pass: reasons.length === 0, reasons };
}
