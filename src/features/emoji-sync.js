// Loads the premium (custom emoji) IDs from a sticker set at startup. Set PREMIUM_EMOJI_SET
// to the set name and the IDs are looked up by each icon's glyph, so nothing has to be
// copied by hand. PREMIUM_EMOJI_JSON still works, and wins for any icon it names.

import { GLYPH } from "../core/icons.js";

/** Pure: maps icon names to custom emoji ids from the stickers of a set. */
export function mapStickersToIcons(stickers = []) {
  const map = {};
  for (const [name, glyph] of Object.entries(GLYPH)) {
    const hit = stickers.find((s) => s?.custom_emoji_id && s.emoji === glyph);
    if (hit) map[name] = hit.custom_emoji_id;
  }
  return map;
}

/** Fetches the set through the bot API. Never throws: a missing set just means no premium icons. */
export async function loadPremiumSet({ api, setName, logger = console }) {
  if (!setName) return {};
  try {
    const set = await api.getStickerSet(setName);
    const map = mapStickersToIcons(set?.stickers || []);
    logger.info?.(`[emoji] set "${setName}": ${Object.keys(map).length} of ${Object.keys(GLYPH).length} premium icons matched`);
    return map;
  } catch (err) {
    logger.warn?.(`[emoji] could not load set "${setName}": ${err?.description || err?.message || err}`);
    return {};
  }
}
