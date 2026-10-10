import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../src/router.js";
import { createStore } from "../src/services/store.js";
import { createQuota } from "../src/services/quota.js";
import { act } from "../src/core/actions.js";

const LECTURE = "Supply and demand determine market prices. When demand rises and supply is fixed, prices go up. Elasticity measures how quantity responds to price changes across goods.";
const DOC = JSON.stringify({
  title: "Market prices",
  subtitle: "Intro economics",
  sections: [
    { type: "heading", text: "Price formation" },
    { type: "points", items: ["Supply and demand set the market price."] },
    { type: "trap", text: "Do not confuse a shift with a movement along the curve." },
  ],
  keywords: ["price"],
});

function build() {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 10, admins: new Set([999]) });
  const sent = [];
  let aiCalls = 0;
  const ui = {
    async send(chatId, html) { sent.push({ type: "send", html }); return 1; },
    async edit(chatId, id, html) { sent.push({ type: "edit", html }); return id; },
    async sendDocument(chatId, html, name) { sent.push({ type: "document", html, name }); },
    async typing() {}, async ack() {}, async sendWithEffect() { return 1; },
    async getChatMember() { return { status: "member" }; },
  };
  const ai = {
    async complete() { aiCalls++; return { text: DOC, provider: "fake" }; },
    breakerState: () => ({}), diagnose: () => [],
  };
  const files = { async download() { return { buffer: Buffer.from(LECTURE) }; }, async extract() { return { kind: "text", title: "lecture", text: LECTURE }; } };
  const cfg = { botToken: "x", maxFileMb: 20, maxTextChars: 60000, premiumEmoji: {}, requirePhone: false };
  const router = createRouter({ cfg, ui, store, ai, quota, files, getFilePath: async () => "p", logger: { error() {}, warn() {} } });
  return { router, sent, quota, getAiCalls: () => aiCalls };
}

const msg = (over) => ({ chatId: 1, userId: 5, firstName: "S", messageId: 1, ...over });
const cb = (data) => ({ chatId: 1, userId: 5, firstName: "S", messageId: 50, callbackId: "cb", data });
const file = { document: { file_id: "f", file_unique_id: "same", file_name: "lecture.txt", mime_type: "text/plain", file_size: 500 } };

test("router: the same file summarised twice calls the AI once, delivers both, and charges both", async () => {
  const { router, sent, quota, getAiCalls } = build();
  await router.onMessage(msg(file));
  await router.onCallback(cb(act("tpl", "cram")));
  await router.onCallback(cb(act("tpl", "cram")));
  assert.equal(getAiCalls(), 1, "the second summary came from the cache");
  assert.equal(sent.filter((s) => s.type === "document").length, 2, "both summaries are still delivered");
  assert.equal(quota.status(5).left, 8, "each summary still costs one task");
});
