// Redis-backed persistence. Reads and writes stay in memory for speed; changes are
// written behind to Redis in batches, and everything is loaded back at startup. This
// makes state survive restarts and redeploys. It does not coordinate several live
// instances; run one instance per bot token (see README).

import { createStore } from "../services/store.js";

const enc = (v, exp) => JSON.stringify({ v, exp });

export async function createRedisStore({ url = "", client = null, prefix = "bf:", flushMs = 800, logger = console, now = () => Date.now() } = {}) {
  const redis = client || (await connect(url));
  const mem = createStore({ dataDir: null });
  const dirty = new Map(); // key -> true (write) | false (delete)
  let timer = null;

  // Load everything once at startup.
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 500);
    cursor = next;
    if (keys.length) {
      const values = await redis.mget(...keys);
      keys.forEach((k, i) => {
        if (!values[i]) return;
        try {
          const { v, exp } = JSON.parse(values[i]);
          if (exp && exp < now()) return;
          mem.set(k.slice(prefix.length), v, exp ? exp - now() : 0);
        } catch {
          logger.warn?.(`[redis] skipped unreadable key ${k}`);
        }
      });
    }
  } while (cursor !== "0");

  async function flush() {
    if (!dirty.size) return;
    const batch = [...dirty.entries()];
    dirty.clear();
    const pipe = redis.pipeline();
    for (const [key, write] of batch) {
      const full = prefix + key;
      if (!write) {
        pipe.del(full);
        continue;
      }
      const value = mem.get(key);
      if (value === undefined) {
        pipe.del(full);
        continue;
      }
      const ttl = mem.ttlOf ? mem.ttlOf(key) : 0;
      const payload = enc(value, ttl ? now() + ttl : 0);
      if (ttl) pipe.set(full, payload, "PX", ttl);
      else pipe.set(full, payload);
    }
    await pipe.exec();
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush().catch((err) => logger.error?.("[redis] flush failed:", err?.message || err));
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
      await flush();
      await redis.quit?.();
    },
  };
}

async function connect(url) {
  if (!url) throw new Error("REDIS_URL is empty");
  const { default: IORedis } = await import("ioredis");
  return new IORedis(url, { maxRetriesPerRequest: 2, enableOfflineQueue: true });
}
