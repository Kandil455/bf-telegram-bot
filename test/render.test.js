import test from "node:test";
import assert from "node:assert/strict";
import { normaliseDocument, normaliseOsce, text } from "../src/render/schema.js";
import { renderDocument, renderOsce, previewLines } from "../src/render/html.js";
import { buildDocumentPrompt, buildOscePrompt, LIMITS } from "../src/prompts/summary.js";

test("schema: text() picks the right side and fills a missing one in bilingual mode", () => {
  assert.equal(text({ en: "Hi", ar: "أهلاً" }, "en"), "Hi");
  assert.equal(text({ en: "Hi", ar: "أهلاً" }, "ar"), "أهلاً");
  assert.deepEqual(text({ en: "Hi", ar: "" }, "bilingual"), { en: "Hi", ar: "Hi" });
  assert.equal(text("plain", "bilingual").en, "plain");
});

test("schema: HTML is stripped, unknown types dropped, lists capped", () => {
  const doc = normaliseDocument({
    title: "<img src=x onerror=alert(1)>Notes",
    sections: [
      { type: "points", items: ["<b>bold</b> point", "", "ok"] },
      { type: "nonsense", text: "x" },
      { type: "formula", expression: "" },
      { type: "trap", text: "careful" },
    ],
  });
  assert.doesNotMatch(doc.title, /</);
  assert.equal(doc.sections.length, 2);
  assert.deepEqual(doc.sections[0].items, ["bold point", "ok"]);
});

test("schema: figures are kept only when they match a provided image", () => {
  const images = [{ mime: "image/jpeg", b64: "AAA", caption: "Supply curve" }];
  const doc = normaliseDocument({ sections: [{ type: "figure", ref: "image_1" }, { type: "figure", ref: "image_9" }] }, { images });
  assert.equal(doc.sections.length, 1);
  assert.equal(doc.sections[0].caption, "Supply curve");
});

test("schema: OSCE stations need a scenario and a checklist; marks are clamped to 1 or 2", () => {
  const osce = normaliseOsce({
    stations: [
      { title: "No checklist", scenario: "x", checklist: [] },
      { title: "Good", scenario: "A scenario.", checklist: [{ item: "Does X", marks: 9 }, { item: "Does Y", marks: 0 }] },
    ],
  });
  assert.equal(osce.stations.length, 1);
  assert.deepEqual(osce.stations[0].checklist.map((c) => c.marks), [2, 1]);
});

test("html: user text is escaped; no raw script survives", () => {
  const doc = normaliseDocument({ title: "<script>alert(1)</script>", sections: [{ type: "heading", text: "<b>x</b>" }] });
  const html = renderDocument({ doc, lang: "en", template: "cram" });
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<b>x<\/b>/);
});

test("html: each template produces its signature structure", () => {
  const doc = normaliseDocument({
    title: "T",
    sections: [
      { type: "table", headers: ["A", "B"], rows: [["1", "2"]], caption: "Cap" },
      { type: "formula", label: "F", expression: "E = %dQ / %dP" },
      { type: "steps", items: ["Do first", "Then second"] },
      { type: "qa", question: "Q1", answer: "A1" },
      { type: "qa", question: "Q2", answer: "A2" },
      { type: "trap", text: "Watch out" },
    ],
  });
  const cram = renderDocument({ doc, lang: "en", template: "cram" });
  assert.match(cram, /class="formula"/);
  assert.match(cram, /Exam trap/);
  const qa = renderDocument({ doc, lang: "en", template: "qa" });
  assert.match(qa, /class="grid"/);
  const flow = renderDocument({ doc, lang: "en", template: "flow" });
  assert.match(flow, /class="steps"/);
  const cornell = renderDocument({ doc, lang: "en", template: "cornell" });
  assert.match(cornell, /class="qa"/);
  const table = renderDocument({ doc, lang: "en", template: "table" });
  assert.match(table, /<table>/);
});

test("html: Arabic is right-to-left; bilingual shows two lines per value", () => {
  const ar = renderDocument({ doc: normaliseDocument({ title: "عنوان" }, { lang: "ar" }), lang: "ar", template: "cram" });
  assert.match(ar, /<html lang="ar" dir="rtl">/);
  const bi = normaliseDocument({ title: { en: "Title", ar: "عنوان" }, sections: [{ type: "points", items: [{ en: "one", ar: "واحد" }] }] }, { lang: "bilingual" });
  const html = renderDocument({ doc: bi, lang: "bilingual", template: "cram" });
  assert.match(html, /class="en" dir="ltr">Title/);
  assert.match(html, /class="ar" dir="rtl">عنوان/);
});

test("html: figures embed the image as a data URI", () => {
  const images = [{ mime: "image/png", b64: "QUJD", caption: "Chart" }];
  const doc = normaliseDocument({ sections: [{ type: "figure", ref: "image_1" }] }, { images });
  const html = renderDocument({ doc, lang: "en", template: "cram", images });
  assert.match(html, /<img src="data:image\/png;base64,QUJD"/);
});

test("html: OSCE shows the total marks and the checklist", () => {
  const osce = normaliseOsce({ stations: [{ title: "S", scenario: "x", checklist: [{ item: "a", marks: 2 }, { item: "b", marks: 1 }] }] });
  const html = renderOsce({ osce, lang: "en" });
  assert.match(html, /Station 1/);
  assert.match(html, /<td>Total<\/td><td>3<\/td>/);
});

test("preview: short, plain lines for the chat message", () => {
  const doc = normaliseDocument({ sections: [{ type: "heading", text: "H" }, { type: "points", items: ["p1", "p2"] }, { type: "definition", term: "t", meaning: "m" }] });
  const lines = previewLines(doc, "en", 3);
  assert.deepEqual(lines, ["H", "p1", "t: m"]);
});

test("prompts: the template brief, language rule and length cap are all present", () => {
  const p = buildDocumentPrompt({ template: "table", lang: "bilingual", title: "X", text: "y".repeat(20000) });
  assert.match(p.user, /comparison tables/);
  assert.match(p.system, /"en": "\.\.\.", "ar": "\.\.\."/);
  assert.ok(p.user.length < LIMITS.maxSourceChars + 2000);
  assert.match(p.system, /Return ONLY one JSON object/);
});

test("prompts: OSCE contract asks for observable, marked checklist items", () => {
  const p = buildOscePrompt({ lang: "en", title: "X", text: "y" });
  assert.match(p.system, /observable/);
  assert.match(p.system, /"checklist"/);
});
