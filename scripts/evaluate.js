#!/usr/bin/env node
// Runs a real summary and a real 5-question quiz on every .txt or .md file in a folder, using
// the keys in your environment, and writes a report you can read. Put real study material in
// the folder first (copy the text out of your PDF or Word file, or use pdftotext).
//
//   node --env-file=.env scripts/evaluate.js ./eval-files
//
// The report lists, per file: how much of the source the summary covers, the numbers that are
// not in the source, how many quiz questions were produced, and whether the verifier had to
// drop or fix any. Read the report, then fix the prompts where the same problem repeats.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadConfig } from "../src/config.js";
import { createAi } from "../src/services/ai.js";
import { generateDocument } from "../src/render/pipeline.js";
import { qualityPass, rng } from "../src/quality/quiz.js";
import { quizPrompt } from "../src/prompts/index.js";
import { normaliseQuiz } from "../src/core/quiz.js";
import { parseJsonLoose } from "../src/core/text.js";
import { documentMetrics, quizMetrics, verdict } from "../src/quality/metrics.js";

const dir = process.argv[2] || "./eval-files";
const files = readdirSync(dir).filter((f) => /\.(txt|md)$/i.test(f)).sort();
if (!files.length) {
  console.error(`No .txt or .md files in ${dir}. Add some real study material first.`);
  process.exit(1);
}

const cfg = loadConfig();
const ai = createAi(cfg, { logger: console });
const rows = [];

for (const file of files) {
  const text = readFileSync(join(dir, file), "utf8");
  const started = Date.now();
  console.log(`\n▶ ${file} (${text.split(/\s+/).length} words)`);

  const gen = await generateDocument({ ai, template: "cram", lang: "en", title: basename(file), text, images: [] });
  const doc = gen?.doc ? documentMetrics(gen.doc, text) : null;

  const reply = await ai.complete(quizPrompt({ lang: "en", source: text, count: 5 }));
  const raw = normaliseQuiz(parseJsonLoose(reply?.text), 5);
  const checked = await qualityPass({ items: raw, source: text, lang: "en", ai, verify: true, rand: rng(7) });
  const quiz = quizMetrics(checked.items, 5, checked.report);

  const v = doc ? verdict(doc, quiz) : { pass: false, reasons: ["no summary was produced"] };
  rows.push({ file, seconds: Math.round((Date.now() - started) / 1000), doc, quiz, verdict: v });
  console.log(`  summary: ${doc ? `${doc.docWords} words, ${doc.sections} sections, ratio ${doc.ratio}` : "FAILED"}`);
  console.log(`  quiz: ${quiz.produced}/5 questions, verifier dropped ${quiz.verifiedDropped}, fixed ${quiz.verifiedFixed}`);
  console.log(`  verdict: ${v.pass ? "PASS" : "FAIL"} ${v.reasons.join("; ")}`);
}

const lines = [
  "# Evaluation report",
  "",
  `Generated ${new Date().toISOString()} for ${rows.length} file(s).`,
  "",
  "| File | Source words | Summary words | Ratio | Sections | Bad numbers | Quiz | Dropped | Fixed | Verdict |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map((r) =>
    `| ${r.file} | ${r.doc?.sourceWords ?? "-"} | ${r.doc?.docWords ?? "-"} | ${r.doc?.ratio ?? "-"} | ${r.doc?.sections ?? "-"} | ${r.doc?.ungroundedNumbers.length ?? "-"} | ${r.quiz.produced}/5 | ${r.quiz.verifiedDropped} | ${r.quiz.verifiedFixed} | ${r.verdict.pass ? "PASS" : "FAIL: " + r.verdict.reasons.join("; ")} |`
  ),
  "",
  "A FAIL is a place to look, not a verdict on the whole bot. Read the summary and the questions for those files.",
];
writeFileSync("eval-report.md", lines.join("\n"));
writeFileSync("eval-report.json", JSON.stringify(rows, null, 2));
console.log("\nReport written to eval-report.md and eval-report.json");
