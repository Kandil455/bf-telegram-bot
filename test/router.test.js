import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { act } from "../src/core/actions.js";

/** Records every UI call. Message ids are sequential so edits can be asserted. */
function fakeUi() {
  let next = 100;
  const calls = [];
  return {
    calls,
    async send(chatId, html, rows = null) {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id });
      return id;
    },
    async edit(chatId, messageId, html, rows = null) {
      calls.push({ type: "edit", chatId, messageId, html, rows });
      return messageId;
    },
    async sendDocument(chatId, html, name, caption) {
      calls.push({ type: "document", chatId, html, name, caption });
    },
    async sendWithEffect(chatId, html, rows = null, effect = null) {
      const id = next++;
      calls.push({ type: "send", chatId, html, rows, id, effect });
      return id;
    },
    async sendPhoto(chatId, buffer, name, caption, rows = null) {
      calls.push({ type: "photo", chatId, name, caption, rows });
      return next++;
    },
    async sendMediaGroup(chatId, photos, caption = "") {
      calls.push({ type: "album", chatId, count: photos.length, caption });
    },
    async clearKeyboard(chatId, messageId) {
      calls.push({ type: "clear", chatId, messageId });
    },
    async ack(callbackId, text = "") {
      calls.push({ type: "ack", callbackId, text });
    },
    async typing() {},
  };
}

const LECTURE = "Supply and demand determine market prices. When demand rises and supply is fixed, prices go up. Elasticity measures how quantity responds to price changes across goods.";

/** A valid document the model would return for the lecture above. */
const DOC = JSON.stringify({
  title: "Market prices",
  subtitle: "Intro economics",
  sections: [
    { type: "heading", text: "Price formation" },
    { type: "points", items: ["Supply and demand set the market price."] },
    { type: "definition", term: "Elasticity", meaning: "Responsiveness of quantity to price.", example: "" },
    { type: "trap", text: "Do not confuse a shift with a movement along the curve." },
  ],
  keywords: ["price", "elasticity"],
});

function harness({ aiQueue = [], limit = 10, admins = new Set([999]) } = {}) {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit, admins });
  const ui = fakeUi();
  const aiCalls = [];
  const queue = [...aiQueue];
  const ai = {
    async complete(opts) {
      aiCalls.push(opts);
      if (!queue.length) return null;
      const next = queue.shift();
      return next === null ? null : { text: next, provider: "fake" };
    },
  };
  const files = {
    async download() {
      return { buffer: Buffer.from(LECTURE) };
    },
    async extract({ name }) {
      return { kind: "text", title: name.replace(/\.[^.]+$/, ""), text: LECTURE };
    },
  };
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {} };
  const router = createRouter({ cfg, ui, store, ai, quota, files, getFilePath: async () => "path.txt", logger: { error() {}, warn() {} } });
  return { router, ui, store, quota, aiCalls };
}

const msg = (over) => ({ chatId: 1, userId: 5, firstName: "Sara", messageId: 1, ...over });
const cb = (data, over = {}) => ({ chatId: 1, userId: 5, firstName: "Sara", messageId: 50, callbackId: "cb", data, ...over });
const lectureFile = (fuid = "u1") => ({ document: { file_id: "f", file_unique_id: fuid, file_name: "lecture.txt", mime_type: "text/plain", file_size: 500 } });
const pasted = "Pasted lecture ".repeat(40);
const lastOf = (ui, type) => ui.calls.filter((c) => c.type === type).at(-1);

test("/start sends the welcome with the menu keyboard", async () => {
  const { router, ui } = harness();
  await router.onMessage(msg({ text: "/start" }));
  const sent = lastOf(ui, "send");
  assert.match(sent.html, /Black Fighters/);
  const data = sent.rows.flat().map((b) => b.callback_data);
  assert.ok(data.includes(act("ask")));
  assert.ok(data.includes(act("lang", "ar")));
});

test("a lecture file is read and offers the action buttons", async () => {
  const { router, ui } = harness();
  await router.onMessage(msg(lectureFile()));
  const last = lastOf(ui, "edit");
  assert.match(last.html, /lecture/);
  assert.match(last.html, /words/);
  const data = last.rows.flat().map((b) => b.callback_data);
  assert.ok(data.includes(act("sum", "basic")));
  assert.ok(data.includes(act("qc", "pick", "text")), "quiz opens the size picker");
});

test("summary opens the style picker with six styles and language choices", async () => {
  const { router, ui } = harness();
  await router.onMessage(msg(lectureFile("p1")));
  await router.onCallback(cb(act("sum", "basic")));
  const picker = lastOf(ui, "send");
  assert.match(picker.html, /Choose a style/);
  const data = picker.rows.flat().map((b) => b.callback_data).filter(Boolean);
  for (const id of ["cram", "cornell", "table", "flow", "qa", "osce"]) assert.ok(data.includes(act("tpl", id)), id);
  assert.ok(data.includes(act("docl", "bilingual")));
});

test("a style runs, sends the HTML file, and charges one task", async () => {
  const { router, ui, quota } = harness({ aiQueue: [DOC] });
  await router.onMessage(msg(lectureFile("u3")));
  await router.onCallback(cb(act("tpl", "cram")));
  const delivered = lastOf(ui, "edit");
  assert.match(delivered.html, /Market prices/);
  assert.match(delivered.html, /9 of 10 tasks left today/);
  const file = lastOf(ui, "document");
  assert.match(file.html, /<!doctype html>/);
  assert.match(file.html, /Price formation/);
  assert.match(file.name, /market-prices-cram-en\.html$/);
  assert.equal(quota.status(5).left, 9);
});

test("OSCE costs two tasks and sends a station sheet", async () => {
  const osce = JSON.stringify({
    title: "Price OSCE",
    stations: [
      {
        title: "Explain a price rise",
        setting: "Tutorial room",
        scenario: "A student asks why bread prices rose after a harvest failure.",
        tasks: ["Ask about the cause", "Draw the supply shift"],
        checklist: [{ item: "Identifies the supply shift", marks: 2 }, { item: "States the new equilibrium", marks: 1 }],
        key_phrases: ["supply shift"],
        common_errors: ["Confuses shift with movement"],
      },
    ],
  });
  const { router, ui, quota } = harness({ aiQueue: [osce] });
  await router.onMessage(msg(lectureFile("u4")));
  await router.onCallback(cb(act("tpl", "osce")));
  const file = lastOf(ui, "document");
  assert.match(file.html, /Station 1/);
  assert.match(file.html, /Total/);
  assert.equal(quota.status(5).left, 8);
});

test("bilingual output renders both languages in one file", async () => {
  const bi = JSON.stringify({
    title: { en: "Price formation", ar: "تكوين السعر" },
    sections: [{ type: "points", items: [{ en: "Demand raises price.", ar: "الطلب بيرفع السعر." }] }],
    keywords: [],
  });
  const { router, ui } = harness({ aiQueue: [bi] });
  await router.onMessage(msg(lectureFile("u7")));
  await router.onCallback(cb(act("docl", "bilingual")));
  await router.onCallback(cb(act("tpl", "cram")));
  const file = lastOf(ui, "document");
  assert.match(file.html, /class="ar"/);
  assert.match(file.html, /الطلب بيرفع السعر/);
  assert.match(file.name, /-bilingual\.html$/);
});

test("a failed generation refunds the reserved task", async () => {
  const { router, quota, ui } = harness({ aiQueue: [null, null] });
  await router.onMessage(msg({ text: pasted }));
  await router.onCallback(cb(act("tpl", "cram")));
  assert.equal(quota.status(5).left, 10);
  assert.match(lastOf(ui, "edit").html, /busy right now/);
});

test("a malformed reply is repaired once before giving up", async () => {
  const { router, ui, aiCalls } = harness({ aiQueue: ["not json at all", DOC] });
  await router.onMessage(msg({ text: pasted }));
  await router.onCallback(cb(act("tpl", "cram")));
  assert.equal(aiCalls.length, 2);
  assert.match(lastOf(ui, "document").html, /Price formation/);
});

test("the daily limit blocks further tasks with a clear message", async () => {
  const { router, ui } = harness({ aiQueue: [DOC], limit: 1 });
  await router.onMessage(msg({ text: pasted }));
  await router.onCallback(cb(act("tpl", "cram")));
  await router.onCallback(cb(act("tpl", "cram")));
  assert.match(lastOf(ui, "send").html, /Daily limit reached/);
});

test("admins are never limited", async () => {
  const { router, quota } = harness({ aiQueue: [DOC, DOC], limit: 1 });
  await router.onMessage(msg({ userId: 999, text: pasted }));
  await router.onCallback(cb(act("tpl", "cram"), { userId: 999 }));
  await router.onCallback(cb(act("tpl", "cram"), { userId: 999 }));
  assert.equal(quota.status(999).unlimited, true);
});

test("figures: a captioned photo joins the material and appears in the document", async () => {
  const { router, ui } = harness({ aiQueue: [DOC] });
  await router.onMessage(msg(lectureFile("u8")));
  await router.onMessage(msg({ photo: { file_id: "p", file_unique_id: "pu", file_size: 1000 }, caption: "Supply curve" }));
  assert.match(lastOf(ui, "send").html, /Figure added/);
  const withFigure = JSON.stringify({
    title: "Figures",
    sections: [{ type: "heading", text: "Supply" }, { type: "figure", ref: "image_1", caption: "Supply curve" }],
    keywords: [],
  });
  const r2 = harness({ aiQueue: [withFigure] });
  await r2.router.onMessage(msg(lectureFile("u9")));
  await r2.router.onMessage(msg({ photo: { file_id: "p", file_unique_id: "pu2", file_size: 1000 }, caption: "Supply curve" }));
  await r2.router.onCallback(cb(act("tpl", "cram")));
  assert.match(lastOf(r2.ui, "document").html, /<img src="data:image\/jpeg;base64,/);
});

test("quiz: question, correct answer edits the card, next moves on", async () => {
  const quizJson = JSON.stringify({
    questions: [
      { q: "What raises price?", options: ["Supply up", "Demand up", "Nothing", "Tax"], answer: 1, explanation: "Demand pushes prices up." },
      { q: "What is elasticity?", options: ["A", "B", "C", "D"], answer: 2, explanation: "Responsiveness." },
    ],
  });
  const { router, ui, store } = harness({ aiQueue: [quizJson] });
  await router.onMessage(msg(lectureFile("u10")));
  await router.onCallback(cb(act("quiz", "2")));
  const question = lastOf(ui, "edit");
  assert.match(question.html, /Question 1 of 2/);
  assert.equal(question.rows.length, 4);
  // Options are shuffled, so the right choice is whatever position the stored answer sits in.
  const right = store.get("s:1").quiz.items[0].answer;
  await router.onCallback(cb(act("qa", "0", String(right)), { messageId: question.messageId }));
  assert.match(lastOf(ui, "edit").html, /Correct/);
  await router.onCallback(cb(act("qn", "0")));
  assert.match(lastOf(ui, "send").html, /Question 2 of 2/);
});

test("quiz: an answer for a question that already moved on is ignored", async () => {
  const quizJson = JSON.stringify({ questions: [{ q: "Q?", options: ["a", "b"], answer: 0 }] });
  const { router, ui } = harness({ aiQueue: [quizJson] });
  await router.onMessage(msg(lectureFile("u11")));
  await router.onCallback(cb(act("quiz", "3")));
  await router.onCallback(cb(act("qa", "7", "0")));
  assert.match(lastOf(ui, "ack").text, /moved on/);
});

test("finishing a quiz shows the score", async () => {
  const quizJson = JSON.stringify({ questions: [{ q: "Only?", options: ["a", "b"], answer: 0, explanation: "" }] });
  const { router, ui, store } = harness({ aiQueue: [quizJson] });
  await router.onMessage(msg(lectureFile("u12")));
  await router.onCallback(cb(act("quiz", "3")));
  const q = lastOf(ui, "edit");
  const right = store.get("s:1").quiz.items[0].answer;
  await router.onCallback(cb(act("qa", "0", String(right)), { messageId: q.messageId }));
  await router.onCallback(cb(act("qn", "0"), { messageId: q.messageId }));
  assert.match(lastOf(ui, "send").html, /Score: 1 \/ 1/);
});

test("Arabic: the picker and results follow an Arabic session", async () => {
  const { router, ui } = harness({ aiQueue: [DOC] });
  await router.onMessage(msg({ text: "لخّص " + "المحاضرة ".repeat(60) }));
  await router.onCallback(cb(act("sum", "basic")));
  assert.match(lastOf(ui, "send").html, /اختار الستايل/);
});

test("a second request while one is running gets the busy message", async () => {
  const { router, ui } = harness({ aiQueue: [DOC] });
  await router.onMessage(msg({ text: pasted }));
  router._state.busy.add(1);
  await router.onCallback(cb(act("tpl", "cram")));
  assert.match(lastOf(ui, "send").html, /Still working/);
  router._state.busy.delete(1);
});

test("unknown callbacks are acknowledged and ignored", async () => {
  const { router, ui } = harness();
  await router.onCallback(cb("zzz:not-ours"));
  assert.equal(lastOf(ui, "ack").type, "ack");
});

test("chat without material is answered free of charge", async () => {
  const { router, quota } = harness({ aiQueue: ["Sure, here is the answer."] });
  await router.onMessage(msg({ text: "tell me something about the moon landing" }));
  assert.equal(quota.status(5).left, 10);
});

test("commands: /lang switches language and the copy follows", async () => {
  const { router, ui } = harness();
  await router.onMessage(msg({ text: "/lang ar" }));
  assert.match(lastOf(ui, "send").html, /العربي/);
  await router.onMessage(msg({ text: "/menu" }));
  assert.match(lastOf(ui, "send").html, /القائمة الرئيسية/);
});

test("commands: /new clears material and figures; /quota reports the allowance", async () => {
  const { router, ui } = harness({ limit: 4 });
  await router.onMessage(msg({ text: pasted }));
  await router.onMessage(msg({ text: "/quota" }));
  assert.match(lastOf(ui, "send").html, /4 of 4/);
  await router.onMessage(msg({ text: "/new" }));
  assert.match(lastOf(ui, "send").html, /Cleared/);
});

test("commands: /stats is admin-only and counts today's tasks", async () => {
  const { router, ui } = harness({ aiQueue: [DOC] });
  await router.onMessage(msg({ text: pasted }));
  await router.onCallback(cb(act("tpl", "cram")));
  await router.onMessage(msg({ userId: 999, text: "/stats" }));
  assert.match(lastOf(ui, "send").html, /Tasks today: <b>1<\/b>/);
  await router.onMessage(msg({ text: "/stats" }));
  assert.doesNotMatch(lastOf(ui, "send").html, /Bot stats/);
});

test("long lectures go through map and reduce", async () => {
  const part = JSON.stringify({ sections: [{ type: "points", items: ["Point from part"] }] });
  const merged = DOC;
  const long = "Long lecture sentence about markets. ".repeat(900);
  const { router, ui, aiCalls } = harness({ aiQueue: [part, part, part, merged] });
  await router.onMessage(msg({ text: long }));
  await router.onCallback(cb(act("tpl", "cram")));
  assert.equal(aiCalls.length, 4, "three parts (kept whole, no merge) and one revision for thin coverage");
  assert.match(lastOf(ui, "document").html, /Price formation/);
});

test("Vodafone Cash end to end through the router: plan, instructions, number, claim", async () => {
  const { createCash } = await import("../src/features/cash.js");
  const { createPlans } = await import("../src/services/plans.js");
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 10, admins: new Set() });
  const plans = createPlans({ store, cfg: { freeDailyTasks: 10, proDailyTasks: 120, proStars: 150, proEgp: 100 } });
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, cashNumber: "01000000000", cashSecret: "k".repeat(20) };
  const cash = createCash({ store, plans, cfg });
  const ui = fakeUi();
  const router = createRouter({ cfg, ui, store, ai: { complete: async () => null }, quota, files: {}, getFilePath: async () => "", plans, cash, logger: { error() {}, warn() {} } });

  await router.onMessage(msg({ text: "/pay" }));
  const menu = lastOf(ui, "send");
  assert.ok(menu.rows.flat().some((b) => b.callback_data === act("cash", "pro")), "plan menu offers Vodafone Cash");

  await router.onCallback(cb(act("cash", "pro")));
  assert.match(lastOf(ui, "send").html, /100 EGP/);
  assert.match(lastOf(ui, "send").html, /01000000000/);

  await router.onMessage(msg({ text: "123456789" }));
  assert.match(lastOf(ui, "send").html, /Not received yet/);

  cash.ingest({ secret: "k".repeat(20), body: { text: "تم استلام مبلغ 100.00 جنيه على رقم محفظتك 01000000000. رقم العملية: 123456789" } });
  await router.onMessage(msg({ text: "/txid 123456789" }));
  assert.match(lastOf(ui, "send").html, /is active/);
  assert.equal(plans.active(5), "pro");
});
