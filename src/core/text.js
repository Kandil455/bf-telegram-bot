// Pure text helpers. No I/O.

export const HR = "━━━━━━━━━━━━━━━━━━━━";

/** Escapes the three characters Telegram HTML needs. */
export function esc(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ALLOWED = new Set(["b", "i", "u", "s", "code", "pre", "tg-spoiler", "tg-emoji"]);

/**
 * Keeps only the Telegram HTML tags this bot uses, drops everything else and
 * escapes stray ampersands and angle brackets, so model output can never break
 * sendMessage.
 */
export function sanitizeHtml(input = "") {
  let s = String(input);
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z-]*)(\s[^>]*)?>/g, (match, tag) => {
    const name = tag.toLowerCase();
    if (!ALLOWED.has(name)) return "";
    if (match.startsWith("</")) return `</${name}>`;
    return name === "tg-emoji" ? match : `<${name}>`;
  });
  return s.replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;").replace(/<(?![/a-zA-Z])/g, "&lt;");
}

export function stripTags(s = "") {
  return String(s).replace(/<[^>]*>/g, "");
}

/** Splits text into chunks no longer than `max`, preferring line breaks. */
export function chunk(text = "", max = 3800) {
  const out = [];
  let rest = String(text).trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max * 0.5) cut = rest.lastIndexOf(" ", max);
    if (cut < 1) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** Pulls the first JSON object or array out of a model reply. Returns null if none parses. */
export function parseJsonLoose(raw = "") {
  const s = String(raw || "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : s;
  const start = body.search(/[[{]/);
  if (start < 0) return null;
  const close = body[start] === "[" ? "]" : "}";
  const end = body.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function wordCount(text = "") {
  return String(text).split(/\s+/).filter(Boolean).length;
}

/** A compact progress bar: ▰▰▰▱▱ 3/5 */
export function progress(done, total, width = 5) {
  const filled = total ? Math.round((done / total) * width) : 0;
  return `${"▰".repeat(filled)}${"▱".repeat(width - filled)} ${done}/${total}`;
}
