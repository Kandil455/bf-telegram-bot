import { existsSync } from "node:fs";

// Output formats besides HTML.
//   PDF   -> the same HTML printed by headless Chrome (puppeteer-core, CHROME_PATH)
//   PPTX  -> slides built with pptxgenjs from the same normalised document
// Both libraries load lazily, so the bot runs without them and says so when asked.

const TEXT = (v, lang) => (typeof v === "string" ? v : lang === "ar" ? v?.ar || v?.en || "" : v?.en || v?.ar || "");

const TONE_TITLE = { info: ["Note", "ملاحظة"], tip: ["Tip", "نصيحة"], warn: ["Watch out", "انتبه"], danger: ["Danger", "خطر"] };

function calloutTitle(s, lang) {
  if (s.type === "trap") return lang === "ar" ? "فخ امتحاني" : "Exam trap";
  const [en, ar] = TONE_TITLE[s.tone] || TONE_TITLE.info;
  return lang === "ar" ? ar : en;
}

/** Pure: turns a document into an ordered list of slide specs. */
export function slidesFromDoc(doc, lang = "en") {
  const slides = [{ kind: "title", title: TEXT(doc.title, lang), subtitle: TEXT(doc.subtitle, lang) }];
  let bullets = [];
  let heading = "";
  const flush = () => {
    const title = heading || TEXT(doc.title, lang);
    let part = 0;
    while (bullets.length) {
      const chunk = bullets.splice(0, 7);
      part += 1;
      slides.push({ kind: "bullets", title: part > 1 ? `${title} (cont.)` : title, bullets: chunk });
    }
  };
  for (const s of doc.sections) {
    switch (s.type) {
      case "heading":
        flush();
        heading = TEXT(s.text, lang);
        break;
      case "points":
        bullets.push(...s.items.map((i) => TEXT(i, lang)));
        break;
      case "definition":
        bullets.push(`${TEXT(s.term, lang)}: ${TEXT(s.meaning, lang)}`);
        break;
      case "formula":
        bullets.push(`${TEXT(s.label, lang) ? TEXT(s.label, lang) + ": " : ""}${s.expression && typeof s.expression === "string" ? s.expression : TEXT(s.expression, lang)}`);
        break;
      case "steps":
        bullets.push(...s.items.map((i, n) => `${n + 1}. ${TEXT(i, lang)}`));
        break;
      case "trap":
      case "callout":
        flush();
        slides.push({ kind: "callout", title: calloutTitle(s, lang), body: TEXT(s.text, lang) });
        break;
      case "table":
        flush();
        slides.push({ kind: "table", title: TEXT(s.caption, lang) || heading, headers: s.headers.map((h) => TEXT(h, lang)), rows: s.rows.map((r) => r.map((c) => TEXT(c, lang))) });
        break;
      case "qa":
        flush();
        slides.push({ kind: "qa", title: TEXT(s.question, lang), body: TEXT(s.answer, lang) });
        break;
      default:
        break;
    }
    if (bullets.length >= 7) flush();
  }
  flush();
  return slides;
}

/** Builds a .pptx buffer. Requires the pptxgenjs package. */
export async function buildPptx(doc, { lang = "en", images = [] } = {}) {
  let PptxGenJS;
  try {
    PptxGenJS = (await import("pptxgenjs")).default;
  } catch {
    throw Object.assign(new Error("pptxgenjs is not installed"), { code: "NO_PPTX" });
  }
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const rtl = lang === "ar";
  const font = rtl ? "Arial" : "Calibri";
  const ink = "111111", accent = "E8462A", mute = "666666";

  let number = 0;
  for (const s of slidesFromDoc(doc, lang)) {
    number += 1;
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    if (s.kind === "title") {
      slide.background = { color: "111111" };
      slide.addText(s.title, { x: 0.8, y: 2.3, w: 11.7, h: 1.4, fontFace: font, fontSize: 40, bold: true, color: "FFFFFF", rtlMode: rtl });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.8, y: 3.8, w: 11.7, h: 0.8, fontFace: font, fontSize: 20, color: "DDDDDD", rtlMode: rtl });
      slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.7, w: 1.6, h: 0.08, fill: { color: accent } });
      continue;
    }
    slide.addText(s.title || "", { x: 0.6, y: 0.4, w: 12.1, h: 0.9, fontFace: font, fontSize: 28, bold: true, color: ink, rtlMode: rtl });
    slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.3, w: 1.2, h: 0.06, fill: { color: accent } });
    if (s.kind === "bullets") {
      slide.addText(s.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), { x: 0.8, y: 1.6, w: 11.8, h: 5.4, fontFace: font, fontSize: 20, color: ink, valign: "top", rtlMode: rtl });
    } else if (s.kind === "table") {
      const rows = [s.headers.map((h) => ({ text: h, options: { bold: true, fill: { color: "F3F3F2" } } })), ...s.rows.map((r) => r.map((c) => ({ text: c })))];
      slide.addTable(rows, { x: 0.6, y: 1.6, w: 12.1, fontFace: font, fontSize: 16, color: ink, border: { type: "solid", color: "DDDDDD", pt: 1 }, rtlMode: rtl });
    } else if (s.kind === "callout" || s.kind === "qa") {
      slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.7, w: 12.1, h: 4.6, fill: { color: s.kind === "qa" ? "EFF6FF" : "FFF7ED" }, line: { color: accent, width: 1 } });
      slide.addText(s.body, { x: 1.0, y: 2.0, w: 11.3, h: 4.0, fontFace: font, fontSize: 22, color: ink, valign: "top", rtlMode: rtl });
    }
    slide.addText(String(number), { x: 12.3, y: 6.9, w: 0.6, h: 0.3, fontSize: 10, color: mute, align: "right" });
  }
  for (const img of images.slice(0, 6)) {
    const slide = pptx.addSlide();
    slide.addImage({ data: `data:${img.mime};base64,${img.buffer.toString("base64")}`, x: 1.2, y: 0.8, w: 10.9, h: 5.9, sizing: { type: "contain", w: 10.9, h: 5.9 } });
    if (img.caption) slide.addText(img.caption, { x: 0.6, y: 6.9, w: 12.1, h: 0.4, fontFace: font, fontSize: 14, color: mute, align: "center", rtlMode: rtl });
  }
  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }));
}

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

/** The explicit CHROME_PATH if it exists, otherwise the first Chrome, Chromium or Edge found. */
export function findChrome(explicit = null, exists = existsSync) {
  if (explicit && exists(explicit)) return explicit;
  return CHROME_CANDIDATES.find((p) => exists(p)) || null;
}

/** A sentence a student or admin can act on, for each reason a format can fail. */
export function explainFailure(code) {
  switch (code) {
    case "NO_CHROME": return "Google Chrome was not found. Install Chrome, or set CHROME_PATH to its program";
    case "NO_PUPPETEER": return "the PDF library is missing. Run npm install";
    case "NO_PPTX": return "the PowerPoint library is missing. Run npm install";
    default: return code || "unknown error";
  }
}

/** Prints an HTML document to PDF with headless Chrome. */
export async function renderPdf(html, { chromePath = null } = {}) {
  if (!chromePath) throw Object.assign(new Error("Chrome not found"), { code: "NO_CHROME" });
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch {
    throw Object.assign(new Error("puppeteer-core is not installed"), { code: "NO_PUPPETEER" });
  }
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
