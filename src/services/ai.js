// AI provider chain: Gemini (vision + JSON) -> Groq (fast text) -> OpenRouter (last resort).
// Supports multi-key rotation and multi-model fallback per provider.

// Circuit breaker: after BREAKER_THRESHOLD consecutive provider failures, that provider is
// skipped for BREAKER_COOLDOWN_MS so requests stop waiting out its timeout. One success resets it.
export const BREAKER_THRESHOLD = 3;
export const BREAKER_COOLDOWN_MS = 2 * 60 * 1000;

// Chat endpoints for the OpenAI-style providers. TokenHarbor speaks the same protocol.
const ENDPOINTS = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  tokenharbor: "https://tokenharbor.ai/v1/chat/completions",
};

export function createAi(config, { fetchImpl = globalThis.fetch, logger = console, onAllFailed = null, onAttempt = null, now = () => Date.now() } = {}) {
  const recent = [];
  const note = (where, err) => {
    recent.unshift({ at: now(), where, message: String(err?.message || err).slice(0, 200) });
    recent.length = Math.min(recent.length, 10);
  };
  const breakers = {};
  const breakerOf = (name) => (breakers[name] ||= { failures: 0, openUntil: 0 });
  const isOpen = (name) => breakerOf(name).openUntil > now();
  const recordOk = (name) => {
    breakerOf(name).failures = 0;
    breakerOf(name).openUntil = 0;
  };
  const recordFail = (name) => {
    const b = breakerOf(name);
    b.failures++;
    if (b.failures >= BREAKER_THRESHOLD) {
      b.openUntil = now() + BREAKER_COOLDOWN_MS;
      b.failures = 0;
      logger.warn(`[ai] ${name} paused for ${BREAKER_COOLDOWN_MS / 1000}s after ${BREAKER_THRESHOLD} failures in a row`);
    }
  };
  // One line per request: provider, model, outcome and duration, so every failure has a cause on record.
  const logAttempt = (name, model, outcome, startedAt, detail = "") => {
    const ms = now() - startedAt;
    logger.info(`[ai-req] provider=${name} model=${model} outcome=${outcome} ms=${ms}${detail ? ` detail=${detail}` : ""}`);
    // Optional metrics hook for the daily report. It must never break a request.
    try { onAttempt?.({ provider: name, model, outcome, ms }); } catch {}
  };
  // Every provider needs a starting key index, or the rotation becomes NaN and sends no key.
  const keyIndices = {
    gemini: 0,
    groq: 0,
    openrouter: 0,
    tokenharbor: 0,
  };

  function getKeys(name) {
    const cfg = config?.[name];
    if (!cfg) return [];
    if (Array.isArray(cfg.keys) && cfg.keys.length > 0) return cfg.keys;
    if (cfg.key) {
      return String(cfg.key)
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function getModels(name, tier = "quality") {
    const cfg = config?.[name];
    if (!cfg) return [];
    const tiered = tier === "fast" ? cfg.fast : tier === "quality" ? cfg.quality : null;
    if (Array.isArray(tiered) && tiered.length) return tiered;
    if (Array.isArray(cfg.models) && cfg.models.length > 0) return cfg.models;
    if (cfg.model) {
      return String(cfg.model)
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function rotateKey(name) {
    const keys = getKeys(name);
    if (keys.length > 1) {
      keyIndices[name] = (keyIndices[name] + 1) % keys.length;
      logger.info(`[ai] rotated key for ${name} to key index ${keyIndices[name]}`);
    }
  }

  const providers = [];
  if (getKeys("tokenharbor").length) providers.push({ name: "tokenharbor", vision: true, run: runOpenAiStyle("tokenharbor") });
  if (getKeys("gemini").length) providers.push({ name: "gemini", vision: true, run: runGemini });
  if (getKeys("groq").length) providers.push({ name: "groq", vision: false, run: runOpenAiStyle("groq") });
  if (getKeys("openrouter").length) providers.push({ name: "openrouter", vision: true, run: runOpenAiStyle("openrouter") });

  async function runGemini({ system, user, images = [], json = false, maxTokens = 900, temperature, signal, tier = "quality" }) {
    const keys = getKeys("gemini");
    const models = getModels("gemini", tier);
    if (!keys.length || !models.length) throw new Error("gemini not configured");

    const parts = [{ text: user }];
    for (const img of images) parts.push({ inline_data: { mime_type: img.mime, data: img.b64 } });
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature, maxOutputTokens: Math.max(maxTokens, 2500), ...(json ? { responseMimeType: "application/json" } : {}) },
    };

    // Calculate attempt timeout proportional to output size
    const attemptMs = Math.max(16000, Math.min(32000, maxTokens * 12));

    let lastError = null;
    let modelTries = 0;
    let rateLimited = false;
    const maxModelAttempts = models.length;

    for (const model of models) {
      if (modelTries >= maxModelAttempts || rateLimited) break;
      modelTries++;

      const startKeyIdx = keyIndices.gemini;
      for (let k = 0; k < keys.length; k++) {
        const keyIdx = (startKeyIdx + k) % keys.length;
        const key = keys[keyIdx];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

        const attemptSignals = [AbortSignal.timeout(attemptMs)];
        if (signal) attemptSignals.push(signal);
        const attemptSignal = AbortSignal.any(attemptSignals);
        const startedAt = now();

        try {
          const res = await fetchImpl(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify(body),
            signal: attemptSignal,
          });

          if (res.ok) {
            const data = await res.json();
            const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
            if (text) {
              logAttempt("gemini", model, "ok", startedAt);
              recordOk("gemini");
              return text;
            }
          }

          const errText = await res.text().catch(() => "");
          lastError = new Error(`gemini ${res.status} (${model}): ${errText.slice(0, 100)}`);
          logAttempt("gemini", model, `http-${res.status}`, startedAt);
          logger.warn(`[ai] gemini ${model} with key[${keyIdx}] failed: status ${res.status}`);

          if (res.status === 401 || res.status === 403) {
            rotateKey("gemini");
            if (keys.length <= 1) {
              throw new Error(`gemini key authentication failed (${res.status})`);
            }
            continue;
          }

          if (res.status === 429) {
            rotateKey("gemini");
            // With one key, every model shares its limit: trying the rest only adds load.
            // Stop here, so the next provider (Groq, OpenRouter) answers at once.
            if (keys.length <= 1) {
              rateLimited = true;
              break;
            }
            if (k === keys.length - 1) {
              break;
            }
            continue;
          }

          break; // Try next model on 503, 404, 500, etc.
        } catch (err) {
          if (signal?.aborted) throw err;
          lastError = err;
          logAttempt("gemini", model, "error", startedAt, String(err.message).slice(0, 80));
          logger.warn(`[ai] gemini ${model} attempt error/timeout: ${err.message}`);
          break;
        }
      }
    }

    throw lastError || new Error("gemini all attempts failed");
  }

  function runOpenAiStyle(name) {
    const endpoint = ENDPOINTS[name];

    return async ({ system, user, images = [], json = false, maxTokens = 900, temperature, signal }) => {
      const keys = getKeys(name);
      const models = getModels(name);
      if (!keys.length || !models.length) throw new Error(`${name} not configured`);

      let lastError = null;

      let userContent = user;
      if (images.length > 0) {
        userContent = [
          { type: "text", text: user },
          ...images.map((img) => ({
            type: "image_url",
            image_url: { url: `data:${img.mime};base64,${img.b64}` },
          })),
        ];
      }

      const attemptMs = Math.max(16000, Math.min(32000, maxTokens * 12));
      let modelTries = 0;
      const maxModelAttempts = models.length;

      for (const model of models) {
        if (modelTries >= maxModelAttempts) break;
        modelTries++;

        const startKeyIdx = keyIndices[name];
        for (let k = 0; k < keys.length; k++) {
          const keyIdx = (startKeyIdx + k) % keys.length;
          const key = keys[keyIdx];

          const body = {
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: userContent },
            ],
            temperature,
            max_tokens: maxTokens,
            ...(json && name === "groq" ? { response_format: { type: "json_object" } } : {}),
          };

          const attemptSignals = [AbortSignal.timeout(attemptMs)];
          if (signal) attemptSignals.push(signal);
          const attemptSignal = AbortSignal.any(attemptSignals);

          const startedAt = now();
          try {
            const res = await fetchImpl(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
              body: JSON.stringify(body),
              signal: attemptSignal,
            });

            if (res.ok) {
              const data = await res.json();
              const text = String(data?.choices?.[0]?.message?.content || "").trim();
              if (text) {
                logAttempt(name, model, "ok", startedAt);
                return text;
              }
            }

            const errText = await res.text().catch(() => "");
            lastError = new Error(`${name} ${res.status} (${model}): ${errText.slice(0, 100)}`);
            logAttempt(name, model, `http-${res.status}`, startedAt);
            logger.warn(`[ai] ${name} ${model} with key[${keyIdx}] failed: status ${res.status}`);

            if (res.status === 401 || res.status === 403) {
              rotateKey(name);
              if (keys.length <= 1) {
                throw new Error(`${name} key authentication failed (${res.status})`);
              }
              continue;
            }

            if (res.status === 429) {
              rotateKey(name);
              if (k === keys.length - 1) {
                break;
              }
              continue;
            }

            break;
          } catch (err) {
            if (signal?.aborted) throw err;
            lastError = err;
            logger.warn(`[ai] ${name} ${model} attempt error/timeout: ${err.message}`);
            break;
          }
        }
      }

      throw lastError || new Error(`${name} all attempts failed`);
    };
  }

  /**
   * Returns { text, provider } or null when every provider failed.
   * `images` ([{ mime, b64 }]) restricts the chain to vision-capable providers.
   */
  async function complete({ system, user, images = [], json = false, maxTokens = 900, temperature = 0.4, timeoutMs = 120000, tier = "quality" }) {
    for (const p of providers) {
      if (images.length && !p.vision) continue;
      if (isOpen(p.name)) {
        logger.info(`[ai-req] provider=${p.name} outcome=skipped-breaker-open`);
        continue;
      }
      try {
        const text = await p.run({
          system,
          user,
          images,
          json,
          maxTokens,
          temperature,
          tier,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (text) {
          recordOk(p.name);
          return { text, provider: p.name };
        }
        recordFail(p.name);
      } catch (err) {
        recordFail(p.name);
        note(p.name, err);
        logger.warn(`[ai] ${p.name} failed: ${err?.name || ""} ${err?.message || err}`);
      }
    }
    if (typeof onAllFailed === "function") onAllFailed(recent.slice(0, 3));
    return null;
  }

  const breakerState = () =>
    Object.fromEntries(Object.keys(breakers).map((n) => [n, { paused: isOpen(n), failures: breakers[n].failures }]));

  return { complete, providers: providers.map((p) => p.name), diagnose: () => recent.slice(0, 5), breakerState };
}
