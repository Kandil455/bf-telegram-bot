import test from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE_EXAMPLES, buildDocumentPrompt, templateExample } from "../src/prompts/summary.js";
import { normaliseDocument } from "../src/render/schema.js";
import { quizPrompt } from "../src/prompts/index.js";
import { normaliseQuiz } from "../src/core/quiz.js";
import { parseJsonLoose } from "../src/core/text.js";

const types = (doc) => doc.sections.map((s) => s.type);

test("template examples are valid under the schema and show the blocks their style is made of", () => {
  const expect = {
    cram: ["definition", "formula", "trap"],
    cornell: ["qa", "points"],
    table: ["table"],
    flow: ["steps"],
    qa: ["qa"],
  };
  for (const [template, must] of Object.entries(expect)) {
    const doc = normaliseDocument(TEMPLATE_EXAMPLES[template], { lang: "en" });
    assert.ok(doc.sections.length >= 2, `${template} example keeps its sections`);
    for (const t of must) assert.ok(types(doc).includes(t), `${template} example shows a ${t} block`);
  }
});

test("prompts: the document prompt names the goal, the shape and the self-check for the chosen template", () => {
  const p = buildDocumentPrompt({ template: "table", lang: "en", title: "X", text: "source text" });
  assert.match(p.user, /Goal: a student can compare/);
  assert.match(p.user, /Shape to copy/);
  assert.match(p.user, /"type": "table"/);
  assert.match(p.user, /Before you answer, check/);
  assert.equal(templateExample("unknown"), "");
});

test("prompts: the quiz example is a valid item, so the model sees one correct shape", () => {
  const p = quizPrompt({ lang: "en", source: "x", count: 3 });
  const example = parseJsonLoose(p.system.match(/\{"questions":\[[\s\S]*?\]\}/)[0]);
  assert.equal(normaliseQuiz(example, 3).length, 1);
  assert.match(p.system, /Goal: each question tests one idea/);
});
