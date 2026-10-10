// Cache for finished summaries. The same file, template and language should cost nothing the
// second time. The key is a hash of the source text, so a changed file never gets an old summary.

import { createHash } from "node:crypto";

export const SUMMARY_CACHE_TTL_MS = 7 * 24 * 3600 * 1000;

/**
 * Stable key: the source text, the approved images, the template and the document language.
 * Images are part of the key, so approving or removing a picture gives a fresh summary.
 */
export function summaryKey({ text, template, lang, images = [], detail = "standard" }) {
  const sha = (s) => createHash("sha256").update(String(s)).digest("hex");
  const textHash = sha(text || "").slice(0, 32);
  const imagesHash = sha(images.map((i) => `${i.caption || ""}|${i.mime}|${i.b64?.length || 0}|${(i.b64 || "").slice(0, 64)}`).join(";")).slice(0, 16);
  return `sumcache:${textHash}:${imagesHash}:${template}:${lang}:${detail}`;
}

/**
 * Wraps a summary function. A hit returns the stored result without calling the AI.
 * A miss runs the work and stores it, but never stores a null result (a failure).
 */
export function cachedSummary(store, { ttlMs = SUMMARY_CACHE_TTL_MS, onHit = () => {} } = {}) {
  return async function run(keyParts, work) {
    const key = summaryKey(keyParts);
    const hit = store.get(key);
    if (hit) {
      onHit(key);
      return { ...hit, cached: true };
    }
    const fresh = await work();
    if (fresh) store.set(key, fresh, ttlMs);
    return fresh ? { ...fresh, cached: false } : null;
  };
}
