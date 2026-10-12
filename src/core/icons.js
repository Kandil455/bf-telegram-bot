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

export const DEFAULT_PREMIUM_EMOJI_MAP = Object.freeze({
  file: "5447421246172069841",
  image: "5447588260270341594",
  summary: "5445260044398524944",
  quiz: "5237799019329105246",
  cards: "5447257461889202335",
  concepts: "5472146462362048818",
  explain: "5445255929819854310",
  ask: "5445140257760639304",
  upload: "5444988177263654261",
  home: "5465226866321268133",
  credits: "5447629406057034342",
  stats: "5445146408153806223",
  next: "5445350109862720603",
  done: "5444987348334965906",
  wrong: "5445092669522996408",
  warn: "5447381715293074599",
  back: "5447506720316225765",
  lang: "5447602197439218445",
  reset: "5445365692004071819",
  topic: "5350460637182993292",
  spark: "5445388803223091254",
  clock: "5445350406215465190",
  trophy: "5444931419270839381",
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
