import test from "node:test";
import assert from "node:assert/strict";
import { GLYPH } from "../src/core/icons.js";
import { mapStickersToIcons, loadPremiumSet } from "../src/features/emoji-sync.js";

test("sticker set: each icon gets the id of the sticker that carries its glyph", () => {
  const stickers = [
    { emoji: GLYPH.summary, custom_emoji_id: "5100000000000001" },
    { emoji: GLYPH.quiz, custom_emoji_id: "5100000000000002" },
    { emoji: "🙂", custom_emoji_id: "5100000000000003" },
    { emoji: GLYPH.cards }, // no custom id: ignored
  ];
  const map = mapStickersToIcons(stickers);
  assert.equal(map.summary, "5100000000000001");
  assert.equal(map.quiz, "5100000000000002");
  assert.equal(map.cards, undefined);
});

test("loading a set: a missing or failing set returns no icons and never throws", async () => {
  const ok = { getStickerSet: async () => ({ stickers: [{ emoji: GLYPH.done, custom_emoji_id: "5100000000000009" }] }) };
  assert.equal((await loadPremiumSet({ api: ok, setName: "x_by_bot" })).done, "5100000000000009");
  const bad = { getStickerSet: async () => { throw Object.assign(new Error("not found"), { description: "Bad Request: STICKERSET_INVALID" }); } };
  assert.deepEqual(await loadPremiumSet({ api: bad, setName: "nope", logger: { warn() {} } }), {});
  assert.deepEqual(await loadPremiumSet({ api: ok, setName: "" }), {});
});
