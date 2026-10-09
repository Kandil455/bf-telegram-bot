import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/services/store.js";
import { createQuota, humanize } from "../src/services/quota.js";
import { kindOf } from "../src/services/files.js";
import { copy } from "../src/core/copy.js";

test("store: set, get, patch, incr, TTL expiry", async () => {
  const s = createStore({ dataDir: null });
  s.set("a", { x: 1 });
  s.patch("a", { y: 2 });
  assert.deepEqual(s.get("a"), { x: 1, y: 2 });
  assert.equal(s.incr("n"), 1);
  assert.equal(s.incr("n", 4), 5);
  s.set("t", "soon", 20);
  assert.equal(s.get("t"), "soon");
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(s.get("t"), undefined);
});

test("store: file-backed round trip survives a restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bf-store-"));
  try {
    const a = createStore({ dataDir: dir, flushMs: 5 });
    a.set("k", { v: 42 });
    a.flush();
    const b = createStore({ dataDir: dir });
    assert.deepEqual(b.get("k"), { v: 42 });
    const raw = JSON.parse(readFileSync(join(dir, "store.json"), "utf8"));
    assert.equal(raw.k.v.v, 42);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("quota: consume, limit, refund and admin bypass", () => {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 2, admins: new Set([7]) });
  assert.equal(quota.consume(1, 1).ok, true);
  assert.equal(quota.consume(1, 1).ok, true);
  const blocked = quota.consume(1, 1);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.left, 0);
  quota.refund(1, 1);
  assert.equal(quota.status(1).left, 1);
  assert.equal(quota.consume(7, 999).ok, true);
  assert.equal(quota.status(7).unlimited, true);
});

test("quota: a two-cost task counts double and cannot overspend", () => {
  const store = createStore({ dataDir: null });
  const quota = createQuota({ store, limit: 3 });
  assert.equal(quota.consume(2, 2).ok, true);
  assert.equal(quota.consume(2, 2).ok, false);
  assert.equal(quota.status(2).left, 1);
});

test("humanize: hours and minutes in both languages", () => {
  assert.equal(humanize(3 * 3600 * 1000, copy("en")), "3 hours");
  assert.equal(humanize(90 * 1000, copy("en")), "2 minutes");
  assert.equal(humanize(3600 * 1000, copy("ar")), "1 ساعة");
});

test("file kinds: extension and MIME detection", () => {
  assert.equal(kindOf("lecture.pdf", ""), "pdf");
  assert.equal(kindOf("notes.docx", ""), "docx");
  assert.equal(kindOf("slides.pptx", ""), "pptx");
  assert.equal(kindOf("readme.md", ""), "text");
  assert.equal(kindOf("photo.jpg", ""), "image");
  assert.equal(kindOf("archive.zip", "application/zip"), null);
});
