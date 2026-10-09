// Downloads Telegram files and turns them into plain text.
// Heavy parsers are imported lazily so the rest of the bot starts fast.

import { parseJsonLoose } from "../core/text.js";

export async function downloadTelegramFile({ fetchImpl = globalThis.fetch, token, filePath, maxBytes }) {
  const res = await fetchImpl(`https://api.telegram.org/file/bot${token}/${filePath}`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > maxBytes) return { tooBig: true };
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > maxBytes) return { tooBig: true };
  return { buffer };
}

const TEXT_EXT = /\.(txt|md|markdown|csv|json|html?)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export function kindOf(name = "", mime = "") {
  if (/\.pdf$/i.test(name) || mime === "application/pdf") return "pdf";
  if (/\.docx$/i.test(name) || mime.includes("wordprocessingml")) return "docx";
  if (/\.pptx$/i.test(name) || mime.includes("presentationml")) return "pptx";
  if (TEXT_EXT.test(name) || mime.startsWith("text/")) return "text";
  if (IMAGE_EXT.test(name) || mime.startsWith("image/")) return "image";
  return null;
}

const PDF_PAGE_CAP = 400;

const wordsOf = (s) => String(s || "").split(/\s+/).filter(Boolean).length;

/** Reads up to PDF_PAGE_CAP pages. Returns the text and how many pages were read of how many. */
async function pdfText(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true }).promise;
  const pages = Math.min(doc.numPages, PDF_PAGE_CAP);
  const out = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out.push(content.items.map((it) => it.str).join(" "));
  }
  return { text: out.join("\n\n"), read: pages, total: doc.numPages };
}

async function docxText(buffer) {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

const decodeXml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

async function pptxText(buffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const parts = [];
  for (const name of slides) {
    const xml = await zip.files[name].async("string");
    const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXml(m[1]));
    if (texts.length) parts.push(`--- Slide ${parts.length + 1} ---\n${texts.join(" ")}`);
  }
  return parts.join("\n\n");
}

/**
 * Returns { kind, title, text }. `text` is empty when nothing readable was found.
 * `ai` is used only for images (vision).
 */
export async function extractText({ buffer, name, mime }, ai) {
  const kind = kindOf(name, mime);
  const baseTitle = String(name || "Untitled").replace(/\.[^.]+$/, "").slice(0, 80) || "Untitled";
  if (!kind) return { kind: null, title: baseTitle, text: "" };

  if (kind === "image") {
    const reply = await ai.complete({
      system: "You turn study images into clean text. Keep formulas, labels and reading order. Describe diagrams and tables in full. Never add facts that are not in the image.",
      user: 'Read this image. Return JSON only: {"title": "a short title", "text": "everything readable, in order; for diagrams, a full description"}',
      images: [{ mime: "image/jpeg", b64: buffer.toString("base64") }],
      json: true,
      maxTokens: 2000,
    });
    const j = parseJsonLoose(reply?.text);
    return { kind, title: String(j?.title || baseTitle).slice(0, 80), text: String(j?.text || "") };
  }

  let text = "";
  let note = null;
  if (kind === "pdf") {
    const got = await pdfText(buffer);
    text = got.text;
    if (got.read < got.total) note = `read the first ${got.read} of ${got.total} pages`;
    if (wordsOf(text) < 20) {
      // No text layer: a scanned document. Render the pages and transcribe them.
      const { renderPdfPages } = await import("../media/ocr.js");
      const { ocrPages } = await import("../media/ocr.js");
      const rendered = await renderPdfPages({ buffer, bin: process.env.PDFTOPPM_BIN || "pdftoppm", max: 60 });
      if (!rendered.pages.length) {
        note = rendered.note || "this PDF has no text layer and could not be read";
      } else if (!ai) {
        note = "this PDF is scanned, and no AI is available to read it";
      } else {
        const ocr = await ocrPages({ pages: rendered.pages, ai });
        text = ocr.text;
        note = `read ${ocr.read} of ${ocr.total} scanned pages with OCR${ocr.failed ? ` (${ocr.failed} failed)` : ""}`;
      }
    }
  }
  else if (kind === "docx") text = await docxText(buffer);
  else if (kind === "pptx") text = await pptxText(buffer);
  else text = buffer.toString("utf8").replace(/<[^>]*>/g, " ");

  return { kind, title: baseTitle, text: text.replace(/\u0000/g, "").trim(), note };
}
