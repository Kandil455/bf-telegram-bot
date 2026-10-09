import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { createEntitlements } from "../src/services/entitlements.js";
import { createGallery, setStatus, approveAllPending, restoreAutoExcluded, counts, approvedIndexes, nextPendingAfter, STATUS } from "../src/features/gallery.js";
import { createMediaFlow } from "../src/flows/media.js";
import { pngSize, tooSmall } from "../src/media/extract.js";
import { parseImageReview, imageQuizPrompt, imageReviewPrompt } from "../src/media/review.js";
import { act } from "../src/core/actions.js";

/** A PNG-looking buffer of a given size and dimensions (header only, enough for the filters). */
function fakePng(w, h, bytes = 8000) {
  const b = Buffer.alloc(bytes);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  Buffer.from("IHDR").copy(b, 12);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

function fakeUi() {
  const calls = [];
  return {
    calls,
    async send(chatId, html, rows = null) {
      calls.push({ type: "send", chatId, html, rows });
      return 1;
    },
    async edit(chatId, id, html, rows = null) {
      calls.push({ type: "edit", chatId, html, rows });
    },
    async sendPhoto(chatId, buffer, name, caption, rows = null) {
      calls.push({ type: "photo", chatId, name, caption, rows });
      return 2;
    },
    async sendMediaGroup(chatId, photos) {
      calls.push({ type: "album", chatId, count: photos.length });
    },
    async clearKeyboard() {},
  };
}

// Question JSON the fake AI returns for one image, keyed by what the prompt asks.
function fakeAi({ reviewKeep = [true, false, true], quizPerImage = 2 } = {}) {
  const calls = [];
  let reviewIdx = 0;
  return {
    calls,
    async complete(opts) {
      calls.push(opts);
      if (opts.system.includes("You review one image")) {
        const keep = reviewKeep[reviewIdx++ % reviewKeep.length];
        return { text: JSON.stringify({ keep, type: keep ? "diagram" : "logo", caption: keep ? "Supply curve" : "University logo", reason: "x" }), provider: "fake" };
      }
      if (opts.system.includes("from ONE image")) {
        const qs = Array.from({ length: quizPerImage }, (_, i) => ({ q: `Q${i + 1} about this image`, options: ["a", "b", "c", "d"], answer: 1, explanation: "from the image" }));
        return { text: JSON.stringify({ questions: qs }), provider: "fake" };
      }
      return null;
    },
  };
}

const cfg = { imageReview: true, pdfimagesBin: "pdfimages", maxImagesPerFile: 40, chromePath: null, maxQuestionsPerFile: 30, proFilesPerDay: 10, freeFilesPerDay: 2 };

function setup({ ai = fakeAi(), images = [fakePng(400, 300), fakePng(400, 300), fakePng(300, 300)] } = {}) {
  const store = createStore({ dataDir: null });
  const ui = fakeUi();
  const ent = createEntitlements({ store, cfg, admins: new Set() });
  const extract = async () => ({ images: images.map((buffer, i) => ({ name: `img-${i + 1}.png`, mime: "image/png", buffer })) });
  const media = createMediaFlow({ ui, store, ai, cfg, ent, premium: {}, extract });
  return { store, ui, ai, media, ent };
}

test("gallery: AI exclusions are marked, approve-all touches only pending images", () => {
  const images = [{ name: "a", mime: "image/png", buffer: fakePng(400, 300) }, { name: "b", mime: "image/png", buffer: fakePng(400, 300) }, { name: "c", mime: "image/png", buffer: fakePng(400, 300) }];
  const g = createGallery(images, [{ keep: true, type: "diagram" }, { keep: false, type: "logo" }, { keep: true, type: "chart" }]);
  assert.equal(counts(g).excluded, 1);
  assert.equal(counts(g).autoExcluded, 1);
  assert.equal(approveAllPending(g), 2);
  assert.deepEqual(approvedIndexes(g), [0, 2]);
  assert.equal(restoreAutoExcluded(g), 1, "the student can overrule an AI exclusion");
  assert.equal(g.items[1].status, STATUS.PENDING);
});

test("gallery: skipping moves on and wraps around", () => {
  const g = createGallery([{ buffer: fakePng(400, 300), name: "1" }, { buffer: fakePng(400, 300), name: "2" }, { buffer: fakePng(400, 300), name: "3" }], []);
  assert.equal(nextPendingAfter(g, 0).idx, 1);
  assert.equal(nextPendingAfter(g, 2).idx, 0, "wraps to the first pending image");
  setStatus(g, 1, STATUS.EXCLUDED);
  assert.equal(nextPendingAfter(g, 0).idx, 2);
});

test("images: PNG size and the tiny-image filter", () => {
  assert.deepEqual(pngSize(fakePng(640, 480)), { width: 640, height: 480 });
  assert.equal(tooSmall(fakePng(40, 40, 9000)), true, "icons are dropped by dimensions");
  assert.equal(tooSmall(Buffer.alloc(900)), true, "very small files are dropped");
  assert.equal(tooSmall(fakePng(640, 480)), false);
});

test("AI review: unusable replies keep the image for the student to decide", () => {
  assert.equal(parseImageReview("not json").keep, true);
  assert.equal(parseImageReview('{"keep": false, "type": "logo", "caption": "<b>x</b>"}').keep, false);
  assert.equal(parseImageReview('{"keep": false}').caption, "");
  assert.match(imageReviewPrompt("ar").system, /Arabic/);
  assert.match(imageQuizPrompt({ count: 2 }).system, /ONLY what is visible/);
});

test("media flow: onFile reviews, builds the gallery and the card offers approve-all", async () => {
  const { media, ui } = setup();
  const got = await media.onFile({ chatId: 1, lang: "en", kind: "pdf", buffer: Buffer.from("x"), name: "lecture.pdf" });
  assert.equal(got.count, 3);
  assert.equal(got.gallery.excluded, 1);
  await media.showGallery(1, "en");
  const card = ui.calls.at(-1);
  assert.match(card.html, /Images from your file/);
  const data = card.rows.flat().map((b) => b.callback_data);
  assert.ok(data.includes(act("img", "all")));
  assert.ok(data.includes(act("qc", "pick", "images")));
});

test("media flow: one-by-one review sends each image with approve, exclude and skip", async () => {
  const { media, ui } = setup();
  await media.onFile({ chatId: 1, lang: "en", kind: "docx", buffer: Buffer.from("x"), name: "a.docx" });
  await media.reviewNext(1, "en");
  const photo = ui.calls.at(-1);
  assert.equal(photo.type, "photo");
  assert.match(photo.caption, /Supply curve/);
  const data = photo.rows.flat().map((b) => b.callback_data);
  assert.ok(data.includes(act("img", "ok", "0")));
  assert.ok(data.includes(act("img", "no", "0")));
  assert.ok(data.includes(act("img", "skip", "0")));
  media.decide(1, 0, STATUS.APPROVED);
  assert.equal(media.hasApproved(1), true);
});

test("media flow: the image quiz asks each approved image only, and respects the count", async () => {
  const { media, ai } = setup({ ai: fakeAi({ reviewKeep: [true, true, true], quizPerImage: 2 }) });
  await media.onFile({ chatId: 1, lang: "en", kind: "pptx", buffer: Buffer.from("x"), name: "s.pptx" });
  media.approveAll(1);
  const made = await media.imageQuiz(1, "en", 5);
  assert.equal(made.items.length, 5);
  assert.ok(made.items.every((q) => typeof q.image === "number"), "every question is tied to one image");
  const quizCalls = ai.calls.filter((c) => c.system.includes("from ONE image"));
  assert.ok(quizCalls.length >= 2, "one call per image, never one call for all images");
  assert.ok(quizCalls.every((c) => c.images.length === 1), "each call sees exactly one image");
});

test("media flow: no approved image means no image quiz", async () => {
  const { media } = setup();
  await media.onFile({ chatId: 1, lang: "en", kind: "pdf", buffer: Buffer.from("x"), name: "a.pdf" });
  assert.equal(media.hasApproved(1), false);
  assert.equal(await media.imageQuiz(1, "en", 5), null);
});

test("output: PDF and PowerPoint fall back to HTML with a reason when their tools are missing", async () => {
  const { media } = setup();
  const pdf = await media.buildOutput({ format: "pdf", html: "<html></html>", doc: {}, kind: "doc", lang: "en", chatId: 1, name: "notes-cram-en.html" });
  if (pdf.note) {
    assert.equal(pdf.name, "notes-cram-en.html");
    assert.match(pdf.note, /Chrome was not found/);
  } else {
    assert.match(pdf.name, /\.pdf$/);
  }
  const pptx = await media.buildOutput({ format: "pptx", html: "<html></html>", doc: { title: "x", sections: [] }, kind: "doc", lang: "en", chatId: 1, name: "notes-cram-en.html" });
  if (pptx.note) {
    assert.equal(pptx.name, "notes-cram-en.html");
    assert.match(pptx.note, /npm install|PowerPoint/);
  } else {
    assert.match(pptx.name, /\.pptx$/);
  }
  const html = await media.buildOutput({ format: "html", html: "<p>", doc: {}, kind: "doc", lang: "en", chatId: 1, name: "a.html" });
  assert.equal(html.content, "<p>");
});
