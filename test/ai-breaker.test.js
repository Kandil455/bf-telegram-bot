import { test } from "node:test";
import assert from "node:assert/strict";
import { createAi, BREAKER_THRESHOLD, BREAKER_COOLDOWN_MS } from "../src/services/ai.js";

const ok = (text) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }), text: async () => text });
const fail = (status) => ({ ok: false, status, json: async () => ({}), text: async () => "boom" });
const quiet = { warn() {}, info() {} };

function cfgGemini(models = ["m1"]) {
  return { gemini: { keys: ["k"], models, fast: [], quality: [] }, groq: {}, openrouter: {} };
}

test("breaker: after repeated failures a provider is skipped for the cooldown", async () => {
  let clock = 1000;
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return fail(503);
  };
  const ai = createAi(cfgGemini(), { fetchImpl, logger: quiet, now: () => clock });
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await ai.complete({ system: "s", user: "u" });
  const before = calls;
  assert.equal(await ai.complete({ system: "s", user: "u" }), null);
  assert.equal(calls, before, "no request is sent while the breaker is open");
  assert.equal(ai.breakerState().gemini.paused, true);

  clock += BREAKER_COOLDOWN_MS + 1;
  assert.equal(ai.breakerState().gemini.paused, false, "the provider is retried after the cooldown");
});

test("breaker: a success resets the failure count", async () => {
  let n = 0;
  const fetchImpl = async () => (++n % 2 === 1 ? fail(503) : ok("fine"));
  const ai = createAi(cfgGemini(), { fetchImpl, logger: quiet, now: () => 0 });
  for (let i = 0; i < 6; i++) await ai.complete({ system: "s", user: "u" });
  assert.equal(ai.breakerState().gemini.paused, false);
});

test("logging: each provider attempt leaves one ai-req line with provider, model and outcome", async () => {
  const lines = [];
  const logger = { warn() {}, info: (m) => lines.push(m) };
  const fetchImpl = async () => fail(404);
  const ai = createAi(cfgGemini(["bad"]), { fetchImpl, logger, now: () => 0 });
  await ai.complete({ system: "s", user: "u" });
  const req = lines.find((l) => l.startsWith("[ai-req]"));
  assert.match(req, /provider=gemini model=bad outcome=http-404/);
});
