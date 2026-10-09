// OCR for scanned PDFs and image-only pages. Each page is one vision call to the FAST tier,
// with a strict transcription prompt. Pages run three at a time. The text is kept in page order.

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const OCR_SYSTEM = [
  "You transcribe a study page exactly.",
  "Output only the text of this page, in reading order.",
  "Keep headings, lists, numbers, formulas, units and labels exactly as printed.",
  "Write tables as rows separated by | characters.",
  "For a diagram or chart, write one line that says what it shows and lists its labels.",
  "Never add information that is not on the page. Output nothing else.",
].join(" ");

/** Renders the first `max` pages of a PDF to PNG with pdftoppm (poppler). Missing tool -> note. */
export async function renderPdfPages({ buffer, bin = "pdftoppm", max = 60, dpi = 150 }) {
  const dir = await mkdtemp(join(tmpdir(), "bf-ocr-"));
  try {
    const input = join(dir, "input.pdf");
    await writeFile(input, buffer);
    try {
      await run(bin, ["-png", "-r", String(dpi), "-l", String(max), input, join(dir, "page")], { timeout: 180_000, maxBuffer: 8 * 1024 * 1024 });
    } catch (err) {
      if (err.code === "ENOENT") return { pages: [], note: "pdftoppm is not installed (poppler-utils), so scanned pages cannot be read" };
      throw err;
    }
    const files = (await readdir(dir)).filter((f) => f.startsWith("page") && f.endsWith(".png")).sort();
    const pages = [];
    for (const f of files) pages.push({ name: f, mime: "image/png", buffer: await readFile(join(dir, f)) });
    return { pages };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Transcribes page images. Returns the joined text and counts of read and failed pages. */
export async function ocrPages({ pages, ai, concurrency = 3, maxChars = 250000 }) {
  const out = new Array(pages.length);
  let next = 0;
  let read = 0;
  let failed = 0;
  async function worker() {
    while (next < pages.length) {
      const i = next++;
      const reply = await ai
        .complete({
          system: OCR_SYSTEM,
          user: `Page ${i + 1} of ${pages.length}. Transcribe it.`,
          images: [{ mime: pages[i].mime, b64: pages[i].buffer.toString("base64") }],
          maxTokens: 3000,
          tier: "fast",
          timeoutMs: 90_000,
        })
        .catch(() => null);
      if (reply?.text) {
        out[i] = reply.text.trim();
        read += 1;
      } else {
        failed += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pages.length) }, worker));
  return { text: out.filter(Boolean).join("\n\n").slice(0, maxChars), read, failed, total: pages.length };
}
