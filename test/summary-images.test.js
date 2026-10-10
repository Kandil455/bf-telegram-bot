import { test } from "node:test";
import assert from "node:assert/strict";
import { createGallery, setStatus, STATUS } from "../src/features/gallery.js";
import { createMediaFlow } from "../src/flows/media.js";
import { buildChunkPrompt, buildDocumentPrompt } from "../src/prompts/summary.js";

const img = (n) => ({ name: `i${n}.png`, mime: "image/png", buffer: Buffer.from(`img${n}`) });

function flowWith(decisions) {
  const store = new Map();
  const fakeStore = {
    get: (k) => store.get(k),
    set: (k, v) => store.set(k, v),
    patch: (k, p) => store.set(k, { ...(store.get(k) || {}), ...p }),
  };
  const media = createMediaFlow({ ui: {}, store: fakeStore, ai: null, cfg: {}, ent: {}, extract: null, logger: { warn() {} } });
  return { media, store: fakeStore };
}

test("summary images: the AI-kept image goes into the summary without manual approval", async () => {
  const { media, store } = flowWith();
  const images = [img(1), img(2), img(3)];
  const gallery = createGallery(images, [{ keep: true, caption: "A" }, { keep: false }, { keep: true, caption: "C" }]);
  media._cache.set(7, { images, at: Date.now() });
  store.set("s:7", { gallery: { items: gallery.items } });
  const got = media.approvedForSummary(7);
  assert.deepEqual(got.map((g) => g.caption), ["A", "C"], "the excluded image is left out, the kept ones are in");
});

test("summary images: an image the student excluded never reaches the summary", () => {
  const { media, store } = flowWith();
  const images = [img(1), img(2)];
  const gallery = createGallery(images, []);
  setStatus(gallery, 0, STATUS.EXCLUDED);
  media._cache.set(8, { images, at: Date.now() });
  store.set("s:8", { gallery: { items: gallery.items } });
  assert.equal(media.approvedForSummary(8).length, 1);
});

test("summary images: long lectures pass the images to every part", () => {
  const images = [{ mime: "image/png", b64: "x", caption: "Supply curve" }];
  const p = buildChunkPrompt({ template: "cram", lang: "en", part: 1, total: 3, text: "t", images });
  assert.match(p.user, /Supply curve/);
  assert.match(p.user, /image_1/);
});

test("summary images: short sources still list the images in the prompt", () => {
  const images = [{ mime: "image/png", b64: "x", caption: "Cell" }];
  const p = buildDocumentPrompt({ template: "cram", lang: "en", title: "t", text: "some text here", images });
  assert.match(p.user, /Cell/);
});
