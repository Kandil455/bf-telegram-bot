// Smart buttons. Each button carries a premium icon id and a style when they
// are configured. `render(rows, { modern })` downgrades them to plain buttons
// so a rejected field can never break the message.

import { GLYPH } from "./icons.js";

// One colour per meaning, so a student can read a keyboard at a glance:
//   success (green)  = confirm, approve, correct answer, start the good action
//   danger  (red)    = reject, exclude, wrong answer, destructive
//   primary (blue)   = the main actions (summary, quiz, cards, explain, ask)
//   no colour        = navigation (back, menu, next), so the main actions stand out
export const STYLE_BY_ICON = Object.freeze({
  done: "success",
  spark: "success",
  trophy: "success",
  wrong: "danger",
  warn: "danger",
  reset: "danger",
  summary: "primary",
  quiz: "primary",
  cards: "primary",
  concepts: "primary",
  explain: "primary",
  ask: "primary",
  topic: "primary",
  file: "primary",
  image: "primary",
  upload: "primary",
  credits: "primary",
  home: null,
  back: null,
  next: null,
  lang: null,
  stats: null,
  clock: null,
});

/** The colour a button gets: the one passed in, else the one for its icon, else none. */
export function styleFor(icon, style) {
  if (style) return style;
  if (icon && Object.prototype.hasOwnProperty.call(STYLE_BY_ICON, icon)) return STYLE_BY_ICON[icon];
  return null;
}

export function button({ label, action = null, data = null, icon = null, style = null, premium = {}, webApp = null, url = null }) {
  const plain = String(label).slice(0, 60);
  style = styleFor(icon, style);
  const fallback = icon && GLYPH[icon] ? `${GLYPH[icon]} ${plain}` : plain;
  const premiumId = icon && premium[icon] ? premium[icon] : null;
  // With a premium icon the label stands alone (Telegram draws the icon).
  // Without one, the glyph lives in the label so the button never looks bare.
  const btn = { text: premiumId ? plain : fallback, fallback };
  if (url) btn.url = url;
  else if (webApp) btn.web_app = { url: webApp };
  else btn.callback_data = data ?? action;
  if (premiumId) btn.icon_custom_emoji_id = premiumId;
  if (style) btn.style = style;
  return btn;
}

export function render(rows, { modern = true } = {}) {
  return {
    inline_keyboard: rows.map((row) =>
      row.map((b) => {
        const out = { text: modern ? b.text : b.fallback };
        if (b.url) out.url = b.url;
        if (b.web_app) out.web_app = b.web_app;
        if (b.callback_data) out.callback_data = b.callback_data;
        if (modern && b.icon_custom_emoji_id) out.icon_custom_emoji_id = b.icon_custom_emoji_id;
        if (modern && b.style) out.style = b.style;
        return out;
      })
    ),
  };
}

/** True when Telegram rejected the message because of a button field. */
export function isButtonError(description = "") {
  return /icon_custom_emoji_id|style|button|keyboard|markup/i.test(String(description));
}
