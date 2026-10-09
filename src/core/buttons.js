// Smart buttons. Each button carries a premium icon id and a style when they
// are configured. `render(rows, { modern })` downgrades them to plain buttons
// so a rejected field can never break the message.

import { GLYPH } from "./icons.js";

export function button({ label, action = null, data = null, icon = null, style = null, premium = {}, webApp = null, url = null }) {
  const plain = String(label).slice(0, 60);
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
