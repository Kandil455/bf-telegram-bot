import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { shrinkImage, SHRINK_MAX_SIDE } from "../src/media/shrink.js";

test("shrink: a large image comes back smaller, at most 1024 px on its longest side", async () => {
  const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 200, g: 40, b: 40 } } }).png().toBuffer();
  const out = await shrinkImage({ buffer: big, mime: "image/png" });
  const meta = await sharp(out.buffer).metadata();
  assert.ok(Math.max(meta.width, meta.height) <= SHRINK_MAX_SIDE, `longest side ${Math.max(meta.width, meta.height)}`);
  assert.ok(out.buffer.length < big.length, "smaller in bytes");
  assert.equal(out.mime, "image/jpeg");
});

test("shrink: a small image is not enlarged", async () => {
  const small = await sharp({ create: { width: 200, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer();
  const out = await shrinkImage({ buffer: small, mime: "image/png" });
  const meta = await sharp(out.buffer).metadata();
  assert.ok(meta.width <= 200);
});

test("shrink: data that is not an image is returned unchanged, with no crash", async () => {
  const junk = Buffer.from("not an image at all");
  const out = await shrinkImage({ buffer: junk, mime: "image/png" });
  assert.equal(out.buffer, junk);
  assert.equal(out.mime, "image/png");
});
