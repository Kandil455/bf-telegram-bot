// Key-value store with TTL. File-backed when DATA_DIR is set, in-memory otherwise.
// The interface is small on purpose: swap in Redis or a database by implementing
// get / set / patch / del / incr.

import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function createStore({ dataDir = null, flushMs = 1000 } = {}) {
  let data = new Map();
  let dirty = false;
  let timer = null;
  let file = dataDir ? join(dataDir, "store.json") : null;

  if (file) {
    try {
      mkdirSync(dataDir, { recursive: true });
      if (existsSync(file)) {
        try {
          const raw = JSON.parse(readFileSync(file, "utf8"));
          data = new Map(Object.entries(raw));
        } catch {
          data = new Map();
        }
      }
    } catch {
      // Fallback to in-memory store if dataDir is not writable (e.g. read-only container root)
      file = null;
    }
  }

  function sweep() {
    const now = Date.now();
    let pruned = 0;
    for (const [k, entry] of data.entries()) {
      if (entry?.exp && entry.exp < now) {
        data.delete(k);
        pruned++;
      }
    }
    if (pruned > 0) dirty = true;
    return pruned;
  }

  function flush() {
    if (!file || !dirty) return;
    sweep();
    dirty = false;
    try {
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, JSON.stringify(Object.fromEntries(data)));
      renameSync(tmp, file);
    } catch {
      // Ignore write failures on restricted filesystems
    }
  }

  function schedule() {
    if (!file) return;
    dirty = true;
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, flushMs);
      timer.unref?.();
    }
  }

  function live(key) {
    const entry = data.get(key);
    if (!entry) return undefined;
    if (entry.exp && entry.exp < Date.now()) {
      data.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    get(key) {
      return live(key)?.v;
    },
    set(key, value, ttlMs = 0) {
      data.set(key, { v: value, exp: ttlMs ? Date.now() + ttlMs : 0 });
      schedule();
      return value;
    },
    patch(key, partial, ttlMs = 0) {
      const current = live(key)?.v || {};
      const next = { ...current, ...partial };
      return this.set(key, next, ttlMs);
    },
    incr(key, by = 1, ttlMs = 0) {
      const entry = live(key);
      const next = (entry?.v || 0) + by;
      data.set(key, { v: next, exp: entry?.exp || (ttlMs ? Date.now() + ttlMs : 0) });
      schedule();
      return next;
    },
    del(key) {
      data.delete(key);
      schedule();
    },
    keys(prefix = "") {
      return [...data.keys()].filter((k) => k.startsWith(prefix) && live(k));
    },
    flush,
    sweep,
    size: () => data.size,
  };
}
