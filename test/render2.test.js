import test from "node:test";
import assert from "node:assert/strict";
import { normaliseDocument, sanitizeSvg } from "../src/render/schema.js";
import { renderDocument } from "../src/render/html.js";
import { slidesFromDoc } from "../src/render/export.js";

test("markup: **bold**, ==highlight== and ++key++ become styled spans, escaped first", () => {
  const doc = normaliseDocument({ sections: [{ type: "points", items: ["**Elasticity** is ==the key term== for ++E++ <script>x</script>"] }] });
  const html = renderDocument({ doc, lang: "en", template: "cram" });
  assert.match(html, /<strong>Elasticity<\/strong>/);
  assert.match(html, /<mark class="hl">the key term<\/mark>/);
  assert.match(html, /<span class="key">E<\/span>/);
  assert.doesNotMatch(html, /<script>x/);
});

test("callouts: each tone gets its own class and label", () => {
  const doc = normaliseDocument({ sections: [{ type: "callout", tone: "tip", text: "memory aid" }, { type: "callout", tone: "bogus", text: "fallback" }] });
  const html = renderDocument({ doc, lang: "en", template: "cram" });
  assert.match(html, /callout tone-tip/);
  assert.match(html, /callout tone-info/, "unknown tones fall back to info");
});

test("diagrams: a clean SVG is kept; scripts and handlers are removed", () => {
  const svg = '<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" onload="x()"><script>bad()</script><circle cx="10" cy="10" r="5" fill="#e8462a"/><text x="5" y="20">Demand</text></svg>';
  const doc = normaliseDocument({ sections: [{ type: "diagram", caption: "Demand curve", svg }] });
  const html = renderDocument({ doc, lang: "en", template: "cram" });
  assert.match(html, /<figure class="diagram"><svg/);
  assert.match(html, /<circle cx="10" cy="10" r="5"/);
  assert.match(html, /Demand curve/);
  assert.doesNotMatch(html, /onload|<script|bad\(\)/);
});

test("SVG sanitiser: refuses non-SVG, external links and oversized markup", () => {
  assert.equal(sanitizeSvg("<div>hi</div>"), null);
  assert.equal(sanitizeSvg("<svg>" + "x".repeat(25000) + "</svg>"), null);
  const clean = sanitizeSvg('<svg><a href="javascript:alert(1)"><text>ok</text></a><image href="https://evil.example/x.png"/></svg>');
  assert.ok(clean.includes("<text>ok</text>"));
  assert.doesNotMatch(clean, /javascript|evil|<image|<a /);
});

test("slides: title, bullets grouped under their heading, callouts and tables get their own slides", () => {
  const doc = normaliseDocument({
    title: "Demand",
    sections: [
      { type: "heading", text: "Elasticity" },
      { type: "points", items: ["one", "two"] },
      { type: "callout", tone: "warn", text: "careful" },
      { type: "table", caption: "Table", headers: ["a", "b"], rows: [["1", "2"]] },
      { type: "qa", question: "Why?", answer: "Because." },
    ],
  });
  const kinds = slidesFromDoc(doc, "en").map((s) => s.kind);
  assert.deepEqual(kinds, ["title", "bullets", "callout", "table", "qa"]);
  assert.equal(slidesFromDoc(doc, "en")[1].title, "Elasticity");
  assert.equal(slidesFromDoc(doc, "en")[2].title, "Watch out");
});

test("slides: bullets are split so no slide carries more than seven", () => {
  const items = Array.from({ length: 15 }, (_, i) => `point ${i}`);
  const doc = normaliseDocument({ title: "Long", sections: [{ type: "points", items }] });
  const bullets = slidesFromDoc(doc, "en").filter((s) => s.kind === "bullets");
  assert.ok(bullets.length >= 2);
  assert.ok(bullets.every((s) => s.bullets.length <= 7));
  assert.equal(bullets.flatMap((s) => s.bullets).length, 15);
});

test("Chrome detection: an explicit path wins, then the usual installs, and nothing means null", async () => {
  const { findChrome } = await import("../src/render/export.js");
  assert.equal(findChrome("/opt/chrome", (p) => p === "/opt/chrome"), "/opt/chrome");
  assert.equal(findChrome("/missing", (p) => p.includes("Google Chrome")), "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  assert.equal(findChrome(null, () => false), null);
});
