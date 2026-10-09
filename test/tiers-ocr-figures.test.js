import test from "node:test";
import assert from "node:assert/strict";
import { createAi } from "../src/services/ai.js";
import { ocrPages, renderPdfPages } from "../src/media/ocr.js";
import { ensureFigures } from "../src/render/figures.js";
import { normaliseDocument } from "../src/render/schema.js";

function okResponse(text) {
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }), text: async () => text };
}

test("tiers: the fast tier uses the fast model list, the quality tier uses its own", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    return okResponse("ok");
  };
  const config = { gemini: { keys: ["k"], models: ["general-model"], fast: ["fast-model"], quality: ["quality-model"] }, groq: { keys: [] }, openrouter: { keys: [] } };
  const ai = createAi(config, { fetchImpl, logger: { warn() {}, info() {} } });
  await ai.complete({ system: "s", user: "u", tier: "fast" });
  await ai.complete({ system: "s", user: "u", tier: "quality" });
  assert.match(urls[0], /fast-model/);
  assert.match(urls[1], /quality-model/);
});

test("tiers: a model that answers 404 is skipped and the next one in the list is tried", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    if (/bad-model/.test(url)) return { ok: false, status: 404, json: async () => ({}), text: async () => "not found" };
    return okResponse("fine");
  };
  const config = { gemini: { keys: ["k"], models: ["bad-model", "good-model"], fast: [], quality: [] }, groq: { keys: [] }, openrouter: { keys: [] } };
  const ai = createAi(config, { fetchImpl, logger: { warn() {}, info() {} } });
  const reply = await ai.complete({ system: "s", user: "u" });
  assert.equal(reply.text, "fine");
  assert.match(urls.at(-1), /good-model/);
});

test("OCR: each page is transcribed, the text stays in page order, and failures are counted", async () => {
  const pages = [{ mime: "image/png", buffer: Buffer.from("a") }, { mime: "image/png", buffer: Buffer.from("b") }, { mime: "image/png", buffer: Buffer.from("c") }];
  const ai = {
    complete: async (opts) => {
      assert.equal(opts.tier, "fast", "OCR uses the fast tier");
      assert.equal(opts.images.length, 1, "one page per call");
      if (opts.user.includes("Page 2 ")) return null;
      return { text: `text of ${opts.user.match(/Page (\d)/)[1]}`, provider: "fake" };
    },
  };
  const out = await ocrPages({ pages, ai });
  assert.equal(out.read, 2);
  assert.equal(out.failed, 1);
  assert.equal(out.text, "text of 1\n\ntext of 3");
});

test("OCR: a machine without pdftoppm gets a clear reason, not a crash", async () => {
  const out = await renderPdfPages({ buffer: Buffer.from("%PDF-1.4"), bin: "bf-no-such-tool-xyz" });
  assert.deepEqual(out.pages, []);
  assert.match(out.note, /pdftoppm is not installed/);
});

test("figures: approved images the model left out are added under a Figures heading; used ones are not repeated", () => {
  const doc = normaliseDocument({ sections: [{ type: "heading", text: "Supply" }, { type: "figure", ref: "image_1", caption: "Supply curve" }] });
  const images = [{ mime: "image/png", b64: "AA", caption: "Supply curve" }, { mime: "image/png", b64: "BB", caption: "Demand curve" }];
  const out = ensureFigures(doc, images);
  const refs = out.sections.filter((s) => s.type === "figure").map((s) => s.ref);
  assert.deepEqual(refs, ["image_1", "image_2"]);
  assert.ok(out.sections.some((s) => s.type === "heading"), "the added figures sit under a heading");
  assert.equal(ensureFigures(doc, []), doc);
});
