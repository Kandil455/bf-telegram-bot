import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteStore } from "../src/store/remote.js";

const NOW = 1_700_000_000_000;
const BASE = "https://api.example.test/store";

/** fetch mock: an in-memory "Firestore" behind the API contract. */
function makeFetch(initialDocs = []) {
  const docs = new Map(); // encKey -> {v, exp}
  for (const [k, v] of initialDocs) docs.set(k, v);
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    const auth = init.headers?.["x-bf-bot-secret"];
    if (auth !== "sekrit-1234567890") return { ok: false, status: 401, json: async () => ({}) };
    if (String(url).includes("load=1")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, entries: [...docs.entries()].map(([k, doc]) => ({ k, ...doc })) }),
      };
    }
    const { ops } = JSON.parse(init.body || "{}");
    let written = 0;
    for (const op of ops || []) {
      if (op.del) { docs.delete(op.k); written += 1; continue; }
      docs.set(op.k, { v: op.v, exp: op.exp || 0 });
      written += 1;
    }
    return { ok: true, status: 200, json: async () => ({ ok: true, written }) };
  };
  return { fetch, docs, calls };
}

test("remote store loads entries, skips expired, keeps ttl", async () => {
  const { fetch, docs } = makeFetch([
    ["quota:7", { v: { used: 2 }, exp: 0 }],
    ["old", { v: 1, exp: NOW - 1000 }],
    ["temp", { v: 9, exp: NOW + 5000 }],
  ]);
  const store = await createRemoteStore({ baseUrl: BASE, secret: "sekrit-1234567890", fetchImpl: fetch, now: () => NOW, logger: { warn() {}, info() {}, error() {} } });
  assert.deepEqual(store.get("quota:7"), { used: 2 });
  assert.equal(store.get("old"), undefined);
  assert.equal(store.get("temp"), 9);
  assert.deepEqual(docs.get("quota:7").v, { used: 2 });
});

test("remote store write-behind: set/patch/incr/del flush as ops with exp", async () => {
  const { fetch, docs, calls } = makeFetch();
  const store = await createRemoteStore({ baseUrl: BASE, secret: "sekrit-1234567890", fetchImpl: fetch, now: () => NOW, flushMs: 5, logger: { warn() {}, info() {}, error() {} } });
  store.set("a", { x: 1 });
  store.patch("a", { y: 2 }, 4000);
  store.incr("count", 3);
  store.del("a");
  await store.flush();
  const post = calls.find((c) => !String(c.url).includes("load=1"));
  const ops = JSON.parse(post.init.body).ops;
  assert.deepEqual(ops.map((o) => o.k), ["a", "count"]);
  assert.ok(ops.find((o) => o.k === "a")?.del, "deleted key ships as del op");
  const count = ops.find((o) => o.k === "count");
  assert.equal(count.v, 3);
  assert.equal(count.exp, 0);
  assert.equal(docs.get("count").v, 3);
  assert.equal(docs.get("a"), undefined);
});

test("remote store fails fast when boot load keeps failing", async () => {
  const fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(
    () => createRemoteStore({ baseUrl: BASE, secret: "sekrit-1234567890", fetchImpl: fetch, loadTries: 2, loadRetryMs: 1, logger: { warn() {}, info() {}, error() {} } }),
    /remote store load failed/,
  );
});

test("remote store rejects unauthenticated responses as errors", async () => {
  const { fetch } = makeFetch();
  await assert.rejects(
    () => createRemoteStore({ baseUrl: BASE, secret: "wrong-secret", fetchImpl: fetch, loadTries: 1, logger: { warn() {}, info() {}, error() {} } }),
    /load failed/,
  );
});

test("remote store re-queues ops after a flush failure", async () => {
  let failOnce = true;
  const base = makeFetch();
  const fetch = async (url, init = {}) => {
    if (failOnce && init.method === "POST") { failOnce = false; return { ok: false, status: 503, json: async () => ({}) }; }
    return base.fetch(url, init);
  };
  const errors = [];
  const store = await createRemoteStore({ baseUrl: BASE, secret: "sekrit-1234567890", fetchImpl: fetch, now: () => NOW, flushMs: 3, logger: { warn() {}, info() {}, error: (...a) => errors.push(a) } });
  store.set("streak", { days: 5 });
  const first = await store.flush();
  assert.equal(first, 0, "failed flush reports 0 written");
  const second = await store.flush();
  assert.ok(second > 0, "requeued flush succeeds");
  assert.deepEqual(base.docs.get("streak").v, { days: 5 });
});
