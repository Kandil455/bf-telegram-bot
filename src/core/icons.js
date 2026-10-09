// Icon glyphs (the fallback) and the premium custom-emoji map.

export const GLYPH = Object.freeze({
  file: "📄",
  image: "🖼️",
  summary: "📋",
  quiz: "🧠",
  cards: "🗂️",
  concepts: "💡",
  explain: "🔎",
  ask: "💬",
  upload: "⬆️",
  home: "🏠",
  credits: "🪙",
  stats: "📈",
  next: "➡️",
  done: "✅",
  wrong: "❌",
  warn: "⚠️",
  back: "⬅️",
  lang: "🌐",
  reset: "🆕",
  topic: "🎯",
  spark: "✨",
  clock: "⏳",
  trophy: "🏆",
});

/** Parses PREMIUM_EMOJI_JSON. Unknown names and malformed ids are dropped. */
export function parsePremiumMap(raw = "") {
  if (!raw || !String(raw).trim()) return {};
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out = {};
  for (const [name, id] of Object.entries(obj)) {
    if (GLYPH[name] && typeof id === "string" && /^\d{6,25}$/.test(id)) out[name] = id;
  }
  return out;
}

/** Icon for inside a message body: a custom emoji when configured, the glyph otherwise. */
export function icon(name, premium = {}) {
  const glyph = GLYPH[name] || "";
  return premium[name] ? `<tg-emoji emoji-id="${premium[name]}">${glyph}</tg-emoji>` : glyph;
}

/**
 * Replaces the plain glyphs in a message body with custom emoji wherever a
 * premium id is configured. Glyphs that already sit inside a <tg-emoji> tag are
 * left alone, so applying it twice is safe.
 */
export function applyPremiumGlyphs(html = "", premium = {}) {
  let out = String(html);
  for (const [name, id] of Object.entries(premium)) {
    const glyph = GLYPH[name];
    if (!glyph || !id) continue;
    const parts = out.split(glyph);
    if (parts.length < 2) continue;
    out = parts.reduce((acc, part, i) => {
      if (i === 0) return part;
      const insideTag = /<tg-emoji[^>]*>[^<]*$/.test(acc);
      const sep = insideTag ? glyph : `<tg-emoji emoji-id="${id}">${glyph}</tg-emoji>`;
      return acc + sep + part;
    }, "");
  }
  return out;
}
