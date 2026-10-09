import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { createEntitlements } from "../src/services/entitlements.js";
import { createMediaFlow } from "../src/flows/media.js";
import { act } from "../src/core/actions.js";

function fakeUi() {
  const calls = [];
  let next = 100;
  const rec = (type) => async (chatId, ...rest) => {
    calls.push({ type, chatId, args: rest, id: next });
    return next++;
  };
  return {
    calls,
    send: async (chatId, html, rows = null) => {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id });
      return id;
    },
    sendWithEffect: async (chatId, html, rows = null, effect = null) => {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id, effect });
      return id;
    },
    edit: async (chatId, id, html, rows = null) => calls.push({ type: "edit", chatId, id, html, rows }),
    sendPhoto: async (chatId, buffer, name, caption, rows = null) => {
      calls.push({ type: "photo", chatId, name, caption, rows });
      return next++;
    },
    sendMediaGroup: async (chatId, photos) => calls.push({ type: "album", chatId, count: photos.length }),
    sendDocument: rec("document"),
    clearKeyboard: async () => {},
    ack: async () => {},
    typing: async () => {},
  };
}

const PNG = Buffer.alloc(9000);
Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(PNG, 0);
PNG.writeUInt32BE(13, 8);
Buffer.from("IHDR").copy(PNG, 12);
PNG.writeUInt32BE(500, 16);
PNG.writeUInt32BE(400, 20);

const LECTURE = "Supply and demand determine market prices. When demand rises, prices go up. Elasticity measures responsiveness.";

function build({ limit = 2, aiFn = null } = {}) {
  const store = createStore({ dataDir: null });
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, freeFilesPerDay: limit, proFilesPerDay: 10, maxQuestionsPerFile: 30, imageReview: true, pdfimagesBin: "pdfimages", maxImagesPerFile: 40, chromePath: null, freeDailyTasks: 10 };
  const quota = createQuota({ store, limit: 10, admins: new Set() });
  const ent = createEntitlements({ store, cfg, admins: new Set() });
  const ui = fakeUi();
  const ai = {
    calls: [],
    async complete(opts) {
      this.calls.push(opts);
      if (aiFn) return aiFn(opts);
      if (opts.system.includes("You review one image")) return { text: '{"keep": true, "type": "diagram", "caption": "Supply curve", "reason": "chart"}', provider: "fake" };
      if (opts.system.includes("from ONE image")) return { text: '{"questions":[{"q":"What is labelled?","options":["a","b","c","d"],"answer":2,"explanation":"see label"},{"q":"What trend?","options":["up","down","flat","none"],"answer":0,"explanation":"arrow"}]}', provider: "fake" };
      return null;
    },
  };
  const files = {
    async download() {
      return { buffer: Buffer.from(LECTURE) };
    },
    async extract({ name }) {
      return { kind: name.endsWith(".docx") ? "docx" : "text", title: name.replace(/\.[^.]+$/, ""), text: LECTURE };
    },
  };
  const extractImages = async () => ({ images: [{ name: "fig-1.png", mime: "image/png", buffer: PNG }] });
  const media = createMediaFlow({ ui, store, ai, cfg, ent, premium: {}, extract: extractImages });
  const router = createRouter({ cfg, ui, store, ai, quota, files, getFilePath: async () => "p", media, ent, logger: { error() {}, warn() {} } });
  return { router, ui, store, ai, ent };
}

const msg = (over) => ({ chatId: 1, userId: 5, firstName: "Sara", messageId: 1, ...over });
const cb = (data, over = {}) => ({ chatId: 1, userId: 5, firstName: "Sara", messageId: 50, callbackId: "cb", data, ...over });
const docx = (id) => ({ document: { file_id: "f" + id, file_unique_id: "u" + id, file_name: `notes${id}.docx`, mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_size: 900 } });
const last = (ui, type) => ui.calls.filter((c) => c.type === type).at(-1);

test("files: the third upload of the day is refused with the daily limit", async () => {
  const { router, ui } = build({ limit: 2 });
  await router.onMessage(msg(docx(1)));
  await router.onMessage(msg(docx(2)));
  await router.onMessage(msg(docx(3)));
  assert.match(last(ui, "send").html, /Daily file limit reached/);
});

test("images: a Word file with a picture shows the gallery card with its buttons", async () => {
  const { router, ui } = build();
  await router.onMessage(msg(docx(4)));
  const card = ui.calls.filter((c) => c.type === "send").find((c) => /Images from your file/.test(c.html));
  assert.ok(card, "the gallery card was sent");
  const data = card.rows.flat().map((b) => b.callback_data);
  assert.ok(data.includes(act("img", "next")));
  assert.ok(data.includes(act("img", "all")));
});

test("quiz picker: sizes shrink as the file's question budget is used up", async () => {
  const { router, ui, store } = build();
  await router.onMessage(msg(docx(5)));
  store.patch("s:1", { questionsUsed: 25 });
  await router.onCallback(cb(act("qc", "pick", "text")));
  const picker = last(ui, "send");
  const sizes = picker.rows.flat().map((b) => b.text.match(/\d+/)?.[0]).filter(Boolean);
  assert.deepEqual(sizes, ["5"]);
  store.patch("s:1", { questionsUsed: 0 });
  await router.onCallback(cb(act("qc", "pick", "text")));
  const all = last(ui, "send").rows.flat().map((b) => b.text.match(/\d+/)?.[0]).filter(Boolean);
  assert.deepEqual(all, ["5", "10", "15", "20", "30"]);
});

test("image quiz: approve, then the quiz starts with questions tied to images and counts the budget", async () => {
  const { router, ui, store } = build();
  await router.onMessage(msg(docx(6)));
  await router.onCallback(cb(act("img", "all")));
  await router.onCallback(cb(act("qc", "10", "images")));
  const intro = ui.calls.filter((c) => c.type === "edit").at(-1);
  assert.match(intro.html, /Question 1 of/);
  assert.equal(store.get("s:1").questionsUsed >= 1, true, "the budget is charged");
  assert.ok(store.get("s:1").quiz.items.every((q) => typeof q.image === "number"));
});

test("images: sending images out goes through albums", async () => {
  const { router, ui } = build();
  await router.onMessage(msg(docx(7)));
  await router.onCallback(cb(act("img", "export")));
  assert.ok(ui.calls.some((c) => c.type === "album"));
});

test("formats: choosing PDF or PowerPoint is remembered and shown in the picker", async () => {
  const { router, store, ui } = build();
  await router.onMessage(msg(docx(8)));
  await router.onCallback(cb(act("fmt", "pdf")));
  assert.equal(store.get("s:1").outputFormat, "pdf");
  const picker = last(ui, "send");
  const labels = picker.rows.flat().map((b) => b.text).join(" ");
  assert.match(labels, /PDF/);
  assert.match(labels, /PPTX/);
  assert.match(labels, /HTML/);
});
