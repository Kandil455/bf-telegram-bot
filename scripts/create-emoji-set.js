#!/usr/bin/env node
// Creates the bot's custom-emoji sticker set from assets/emoji/*.png (100x100 PNG).
//
//   TELEGRAM_BOT_TOKEN=... node scripts/create-emoji-set.js <your_user_id> <short_name> "<Set title>"
//
// Telegram needs your numeric user id as the set owner (ask @userinfobot). The set name
// is <short_name>_by_<bot_username>. When it is done, run:
//   npm run emoji -- <short_name>_by_<bot_username>
// and paste the printed PREMIUM_EMOJI_JSON line into your environment.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GLYPH } from "../src/core/icons.js";

const here = dirname(fileURLToPath(import.meta.url));
const [ownerRaw, shortName, title = "Black Fighters"] = process.argv.slice(2);
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || !ownerRaw || !shortName) {
  console.error('Usage: TELEGRAM_BOT_TOKEN=... node scripts/create-emoji-set.js <owner_user_id> <short_name> "<title>"');
  process.exit(1);
}
const ownerId = Number(ownerRaw);
if (!Number.isInteger(ownerId) || ownerId <= 0) {
  console.error("owner_user_id must be your numeric Telegram user id.");
  process.exit(1);
}
if (!/^[a-z0-9_]{1,40}$/.test(shortName)) {
  console.error("short_name: lowercase letters, digits and underscores only.");
  process.exit(1);
}

const api = (method, body, form = false) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, form ? { method: "POST", body } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

const me = await api("getMe", {});
if (!me.ok) {
  console.error(`getMe failed: ${me.description}`);
  process.exit(1);
}
const setName = `${shortName}_by_${me.result.username}`;

const form = new FormData();
form.append("user_id", String(ownerId));
form.append("name", setName);
form.append("title", title.slice(0, 64));
form.append("sticker_type", "custom_emoji");

const stickers = [];
let i = 0;
for (const [name, glyph] of Object.entries(GLYPH)) {
  const file = join(here, "..", "assets", "emoji", `${name}.png`);
  if (!existsSync(file)) continue;
  const key = `sticker${i}`;
  form.append(key, new Blob([readFileSync(file)], { type: "image/png" }), `${name}.png`);
  stickers.push({ sticker: `attach://${key}`, format: "static", emoji_list: [glyph] });
  i += 1;
}
if (!stickers.length) {
  console.error("No PNG files found in assets/emoji. Run: python3 scripts/make-emoji-art.py");
  process.exit(1);
}
form.append("stickers", JSON.stringify(stickers));

const res = await api("createNewStickerSet", form, true);
if (!res.ok) {
  console.error(`createNewStickerSet failed: ${res.description}`);
  process.exit(1);
}
console.log(`Created ${setName} with ${stickers.length} custom emoji.`);
console.log(`Next: npm run emoji -- ${setName}`);
