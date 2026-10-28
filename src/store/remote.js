// Remote durable store backed by the Black Fighters platform API
// (Firestore namespace `telegram_bot_store`). Mirrors the Redis store's
// behavior: everything lives in memory for speed, changes flush behind in
// batches, and state is reloaded on boot — so quota/progress survive
// redeploys on ephemeral hosting plans, at zero extra cost.

import { createStore } from "../services/store.js";

export async function createRemoteStore({
  baseUrl = "",
  secret = "",
  flushMs = 900,
  loadTries = 3,
  loadRetryMs = 1500,
  logger = console,
  now = () => Date.now(),
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!baseUrl || !secret) throw new Error("BOT_STATE_URL/BOT_STATE_SECRET are required for the remote store");
  if (typeof fetchImpl !== "function") throw new Error("remote store needs fetch()");
  const mem = createStore({ dataDir: null });
  const dirty = new Map(); // key -> true (write) | false (delete)
  let timer = null;

  const headers = {
    "content-type": "application/json",
    "x-bf-bot-secret": secret,
  };

  // Load remote state at boot. Fail loudly after retries — starting on
  // memory silently would look like a data wipe to every student.
  let entries = null;
  let lastError = null;
  for (let attempt = 1; attempt <= loadTries; attempt += 1) {
    try {
      const res = await fetchImpl(`${baseUrl}?load=1`, { headers });
      if (!res.ok) throw new Error(`load HTTP ${res.status}`);
      const body = await res.json();
      if (!body?.ok || !Array.isArray(body.entries)) throw new Error("load bad payload");
      entries = body.entries;
      break;
    } catch (err) {
      lastError = err;
      logger.warn?.(`[remote-store] load attempt ${attempt}/${loadTries} failed: ${err?.message || err}`);
      if (attempt < loadTries) await new Promise((r) => setTimeout(r, loadRetryMs * attempt));
    }
  }
  if (!entries) throw new Error(`remote store load failed: ${lastError?.message || lastError}`);

  for (const entry of entries) {
    try {
      const { v, exp } = entry;
      if (!entry.k) continue;
      const expMs = Number(exp) || 0;
      if (expMs && expMs < now()) continue;
      mem.set(entry.k, v, expMs ? expMs - now() : 0);
    } catch (err) {
      logger.warn?.(`[remote-store] skipped unreadable entry: ${err?.message || err}`);
    }
  }
  logger.info?.(`[remote-store] loaded ${mem.keys().length} keys`);

  async function flush() {
    if (!dirty.size) return 0;
    const batch = [...dirty.entries()];
    dirty.clear();
    const ops = [];
    for (const [key, write] of batch) {
      if (!write) {
        ops.push({ k: key, del: true });
        continue;
      }
      const value = mem.get(key);
      if (value === undefined) {
        ops.push({ k: key, del: true });
        continue;
      }
      const ttl = mem.ttlOf ? mem.ttlOf(key) : 0;
      ops.push({ k: key, v: value, exp: ttl ? now() + ttl : 0 });
    }
    try {
      const res = await fetchImpl(baseUrl, { method: "POST", headers, body: JSON.stringify({ ops }) });
      if (!res.ok) throw new Error(`flush HTTP ${res.status}`);
      const body = await res.json().catch(() => ({}));
      return body?.written ?? ops.length;
    } catch (err) {
      // Requeue — losing a flush must never equal losing student progress.
      for (const [key, write] of batch) if (!dirty.has(key)) dirty.set(key, write);
      logger.error?.("[remote-store] flush failed (requeued):", err?.message || err);
      schedule();
      return 0;
    }
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush().catch((err) => logger.error?.("[remote-store] flush error:", err?.message || err));
    }, flushMs);
    timer.unref?.();
  }

  return {
    get: (k) => mem.get(k),
    set(k, v, ttl = 0) {
      mem.set(k, v, ttl);
      dirty.set(k, true);
      schedule();
      return v;
    },
    patch(k, partial, ttl = 0) {
      const next = { ...(mem.get(k) || {}), ...partial };
      return this.set(k, next, ttl);
    },
    incr(k, by = 1, ttl = 0) {
      const next = mem.incr(k, by, ttl);
      dirty.set(k, true);
      schedule();
      return next;
    },
    del(k) {
      mem.del(k);
      dirty.set(k, false);
      schedule();
    },
    keys: (prefixKey = "") => mem.keys(prefixKey),
    flush,
    async close() {
      clearTimeout(timer);
      timer = null;
      await flush();
    },
  };
}
