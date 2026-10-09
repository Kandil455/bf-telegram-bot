import test from "node:test";
import assert from "node:assert/strict";
import { documentMetrics, quizMetrics, verdict } from "../src/quality/metrics.js";
import { normaliseDocument } from "../src/render/schema.js";
import { signInitData, verifyInitData } from "../src/miniapp/auth.js";
import { createAppApi } from "../src/miniapp/api.js";
import { createStore } from "../src/services/store.js";
import { Readable } from "node:stream";

test("metrics: a document is measured against its source", () => {
  const source = "Demand fell by 20% when price rose. Elasticity is responsiveness. The rest is detail. ".repeat(20);
  const doc = normaliseDocument({ sections: [{ type: "points", items: ["Demand fell 20% and elasticity is responsiveness."] }, { type: "points", items: ["It fell 35%."] }] });
  const m = documentMetrics(doc, source);
  assert.ok(m.sourceWords > 50);
  assert.deepEqual(m.ungroundedNumbers, ["35"]);
  const v = verdict(m, null);
  assert.equal(v.pass, false, "an invented number fails the file");
});

test("metrics: a quiz run shows how many questions were asked, fixed, dropped and where answers sit", () => {
  const items = [{ answer: 0 }, { answer: 2 }, { answer: 2 }];
  const q = quizMetrics(items, 5, { duplicates: 1, dropped: 1, fixed: 0, verified: true });
  assert.equal(q.produced, 3);
  assert.deepEqual(q.answerPositions, [1, 0, 2, 0]);
  assert.equal(verdict({ ratio: 0.3, ungroundedNumbers: [] }, q).pass, false, "3 of 5 falls below the share");
});

const BOT = "123456:TEST-TOKEN-abcdefghijklmnopqrstuvwx";

test("Mini App auth: a correctly signed initData is accepted; a tampered or old one is refused", () => {
  const now = Date.UTC(2026, 9, 8, 12);
  const authDate = String(Math.floor(now / 1000));
  const signed = signInitData({ auth_date: authDate, user: JSON.stringify({ id: 42, first_name: "Lina" }), query_id: "AAH" }, BOT);
  assert.equal(verifyInitData(signed, BOT, { now }).user.id, 42);
  assert.equal(verifyInitData(signed.replace("Lina", "Mallory"), BOT, { now }), null, "a changed field breaks the signature");
  assert.equal(verifyInitData(signed, "other:token", { now }), null, "another bot's token does not verify");
  assert.equal(verifyInitData(signed, BOT, { now: now + 2 * 86400 * 1000 }), null, "an old initData is refused");
});

test("Mini App API: the quiz comes without answers, belongs to its user, and answers are checked on the server", async () => {
  const now = Date.UTC(2026, 9, 8, 12);
  const store = createStore({ dataDir: null });
  store.set("appquiz:abc", { userId: 42, items: [{ q: "Q?", options: ["a", "b", "c"], answer: 2, explanation: "because c" }] });
  const api = createAppApi({ store, botToken: BOT, now: () => now });
  const auth = (uid) => `tma ${signInitData({ auth_date: String(Math.floor(now / 1000)), user: JSON.stringify({ id: uid, first_name: "X" }) }, BOT)}`;
  const call = async (method, url, headers = {}, body = "") => {
    const r = Readable.from(body ? [Buffer.from(body)] : []);
    r.method = method; r.url = url; r.headers = headers;
    const res = { status: 0, body: "", writeHead(s) { this.status = s; }, end(b = "") { this.body += b; } };
    await api(r, res);
    return { status: res.status, json: res.body ? JSON.parse(res.body) : null };
  };
  assert.equal((await call("GET", "/api/app/quiz?qid=abc")).status, 401, "no initData, no quiz");
  const mine = await call("GET", "/api/app/quiz?qid=abc", { authorization: auth(42) });
  assert.equal(mine.status, 200);
  assert.equal(mine.json.items[0].answer, undefined, "the answer is not sent to the app");
  assert.equal((await call("GET", "/api/app/quiz?qid=abc", { authorization: auth(7) })).status, 403, "another user cannot open it");
  const right = await call("POST", "/api/app/answer", { authorization: auth(42), "content-type": "application/json" }, JSON.stringify({ qid: "abc", index: 0, choice: 2 }));
  assert.equal(right.json.correct, true);
  const wrong = await call("POST", "/api/app/answer", { authorization: auth(42), "content-type": "application/json" }, JSON.stringify({ qid: "abc", index: 0, choice: 0 }));
  assert.equal(wrong.json.correct, false);
  assert.equal(wrong.json.answer, 2, "the right answer is shown after a wrong choice");
});
