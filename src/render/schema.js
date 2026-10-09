// Turns model output into a safe, typed document. Anything unexpected is dropped,
// never rendered. Strings are trimmed and capped, and HTML tags are stripped.

const TYPES = new Set(["heading", "points", "definition", "formula", "table", "steps", "qa", "trap", "figure", "callout", "diagram"]);
const TONES = new Set(["info", "tip", "warn", "danger"]);
const MAX_TEXT = 600;
const SVG_TAGS = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "marker", "title", "desc", "lineargradient", "radialgradient", "stop"]);
const SVG_ATTRS = new Set(["xmlns", "viewbox", "width", "height", "d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "transform", "font-size", "font-weight", "font-family", "text-anchor", "dominant-baseline", "class", "id", "marker-end", "marker-start", "markerwidth", "markerheight", "refx", "refy", "orient", "preserveaspectratio", "offset", "stop-color", "stop-opacity", "dx", "dy", "gradientunits"]);

/**
 * Keeps only plain drawing markup. Scripts, event handlers, foreign objects, external
 * references and styles that load things are removed. Returns null when nothing usable is left.
 */
export function sanitizeSvg(input) {
  let s = String(input || "").trim();
  if (!/^<svg[\s>]/i.test(s) || s.length > 20000) return null;
  s = s.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|foreignObject|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|foreignObject|iframe|object|embed)\b[^>]*\/?>/gi, "");
  s = s.replace(/<\/?([a-zA-Z][\w:-]*)([^>]*)>/g, (m, name, attrs) => {
    const tag = name.toLowerCase();
    if (!SVG_TAGS.has(tag)) return "";
    if (m.startsWith("</")) return `</${name}>`;
    const kept = [];
    const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = re.exec(attrs))) {
      const key = a[1].toLowerCase();
      const value = a[3] ?? a[4] ?? "";
      if (key.startsWith("on") || !SVG_ATTRS.has(key)) continue;
      if (/javascript:|data:|expression\(|url\((?!\s*#)/i.test(value)) continue;
      kept.push(`${a[1]}="${value.replace(/"/g, "&quot;")}"`);
    }
    const selfClose = /\/\s*$/.test(attrs) ? " /" : "";
    return `<${name}${kept.length ? " " + kept.join(" ") : ""}${selfClose}>`;
  });
  if (!/<svg[\s>]/i.test(s) || !/<\/svg>\s*$/i.test(s)) return null;
  return s;
}
const MAX_ITEMS = 30;

function clean(s, max = MAX_TEXT) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

/**
 * A text value is either a string or {en, ar}. In bilingual mode both sides are kept
 * (a missing side copies the other); otherwise the single string is used.
 */
export function text(value, lang = "en", max = MAX_TEXT) {
  if (value && typeof value === "object") {
    const en = clean(value.en, max);
    const ar = clean(value.ar, max);
    if (lang === "bilingual") return { en: en || ar, ar: ar || en };
    return lang === "ar" ? ar || en : en || ar;
  }
  const s = clean(value, max);
  return lang === "bilingual" ? { en: s, ar: s } : s;
}

const isEmpty = (t) => (typeof t === "string" ? !t : !t.en && !t.ar);

function list(arr, fn) {
  return (Array.isArray(arr) ? arr : []).slice(0, MAX_ITEMS).map(fn).filter((x) => x && !(typeof x === "string" && !x));
}

export function normaliseDocument(raw, { lang = "en", images = [] } = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const refs = new Set(images.map((_, i) => `image_${i + 1}`));
  const sections = list(src.sections, (s) => {
    if (!s || !TYPES.has(s.type)) return null;
    switch (s.type) {
      case "heading":
        return { type: "heading", text: text(s.text, lang, 160) };
      case "points": {
        const items = list(s.items, (x) => text(x, lang, 260)).filter((x) => !isEmpty(x));
        return items.length ? { type: "points", items } : null;
      }
      case "definition": {
        const term = text(s.term, lang, 120);
        const meaning = text(s.meaning, lang, 400);
        if (isEmpty(term) || isEmpty(meaning)) return null;
        return { type: "definition", term, meaning, example: text(s.example, lang, 300) };
      }
      case "formula": {
        const expression = text(s.expression, lang, 300);
        if (isEmpty(expression)) return null;
        return { type: "formula", label: text(s.label, lang, 120), expression, when: text(s.when, lang, 200) };
      }
      case "table": {
        const headers = list(s.headers, (h) => text(h, lang, 80));
        const rows = (Array.isArray(s.rows) ? s.rows : []).slice(0, 40).map((r) => (Array.isArray(r) ? r.slice(0, headers.length || 8).map((c) => text(c, lang, 200)) : null)).filter(Boolean);
        if (!headers.length || !rows.length) return null;
        return { type: "table", caption: text(s.caption, lang, 160), headers, rows };
      }
      case "steps": {
        const items = list(s.items, (x) => text(x, lang, 260)).filter((x) => !isEmpty(x));
        return items.length ? { type: "steps", items } : null;
      }
      case "qa": {
        const question = text(s.question, lang, 260);
        const answer = text(s.answer, lang, 500);
        if (isEmpty(question) || isEmpty(answer)) return null;
        return { type: "qa", question, answer };
      }
      case "callout": {
        const t = text(s.text, lang, 400);
        if (isEmpty(t)) return null;
        return { type: "callout", tone: TONES.has(s.tone) ? s.tone : "info", text: t };
      }
      case "diagram": {
        const svg = sanitizeSvg(s.svg);
        if (!svg) return null;
        return { type: "diagram", caption: text(s.caption, lang, 160), svg };
      }
      case "trap": {
        const t = text(s.text, lang, 300);
        return isEmpty(t) ? null : { type: "trap", text: t };
      }
      case "figure": {
        if (!refs.has(s.ref)) return null;
        const idx = Number(String(s.ref).split("_")[1]) - 1;
        return { type: "figure", ref: s.ref, index: idx, caption: text(s.caption || images[idx]?.caption || "", lang, 200) };
      }
      default:
        return null;
    }
  });

  return {
    title: text(src.title, lang, 120) || "Study notes",
    subtitle: text(src.subtitle, lang, 200),
    sections,
    keywords: list(src.keywords, (k) => clean(k, 60)).filter(Boolean).slice(0, 15),
  };
}

export function normaliseOsce(raw, { lang = "en" } = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const stations = (Array.isArray(src.stations) ? src.stations : []).slice(0, 6).map((s) => {
    const checklist = list(s?.checklist, (c) => {
      const item = text(c?.item, lang, 200);
      const marks = Math.min(2, Math.max(1, Number(c?.marks) || 1));
      return isEmpty(item) ? null : { item, marks };
    });
    const scenario = text(s?.scenario, lang, 800);
    if (isEmpty(scenario) || !checklist.length) return null;
    return {
      title: text(s?.title, lang, 120),
      setting: text(s?.setting, lang, 160),
      scenario,
      tasks: list(s?.tasks, (x) => text(x, lang, 220)).filter((x) => !isEmpty(x)),
      checklist,
      key_phrases: list(s?.key_phrases, (x) => text(x, lang, 120)).filter((x) => !isEmpty(x)),
      common_errors: list(s?.common_errors, (x) => text(x, lang, 220)).filter((x) => !isEmpty(x)),
    };
  }).filter(Boolean);
  return { title: text(src.title, lang, 120) || "OSCE stations", stations };
}
