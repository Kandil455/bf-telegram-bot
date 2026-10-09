// Pulls the embedded images out of a PDF, Word or PowerPoint file.
//   PDF  -> the poppler `pdfimages` tool (must be installed; see the Dockerfile)
//   DOCX -> word/media/* inside the package
//   PPTX -> ppt/media/* inside the package
// Tiny pictures (icons, bullets, line art) are dropped by size and dimensions.

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const MIN_BYTES = 5 * 1024;
const MIN_SIDE = 120;
const MIME_BY_EXT = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

/** Width and height of a PNG from its IHDR chunk, or null for other formats. */
export function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Cheap pre-filter: tiny files and tiny PNGs are almost always icons or decoration. */
export function tooSmall(buf) {
  if (buf.length < MIN_BYTES) return true;
  const size = pngSize(buf);
  return Boolean(size && (size.width < MIN_SIDE || size.height < MIN_SIDE));
}

function extOf(name = "") {
  return (name.split(".").pop() || "").toLowerCase();
}

async function fromZip(buffer, pattern, max) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((n) => pattern.test(n) && MIME_BY_EXT[extOf(n)]).sort();
  const out = [];
  for (const n of names) {
    if (out.length >= max) break;
    const data = Buffer.from(await zip.files[n].async("nodebuffer"));
    if (tooSmall(data)) continue;
    out.push({ name: n.split("/").pop(), mime: MIME_BY_EXT[extOf(n)], buffer: data });
  }
  return out;
}

async function fromPdf(buffer, bin, max) {
  const dir = await mkdtemp(join(tmpdir(), "bf-pdfimg-"));
  try {
    const input = join(dir, "input.pdf");
    await writeFile(input, buffer);
    try {
      await run(bin, ["-png", "-p", input, join(dir, "img")], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
    } catch (err) {
      if (err.code === "ENOENT") return { images: [], note: "pdfimages is not installed (poppler-utils)." };
      throw err;
    }
    const files = (await readdir(dir)).filter((f) => f.startsWith("img-") && f.endsWith(".png")).sort();
    const images = [];
    for (const f of files) {
      if (images.length >= max) break;
      const data = await readFile(join(dir, f));
      if (tooSmall(data)) continue;
      images.push({ name: f, mime: "image/png", buffer: data });
    }
    return { images };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Returns { images: [{ name, mime, buffer }], note? } for a file of the given kind. */
export async function extractImages({ kind, buffer, bin = "pdfimages", max = 40 }) {
  if (kind === "pdf") return fromPdf(buffer, bin, max).then((r) => ({ images: r.images, note: r.note }));
  if (kind === "docx") return { images: await fromZip(buffer, /^word\/media\//, max) };
  if (kind === "pptx") return { images: await fromZip(buffer, /^ppt\/media\//, max) };
  return { images: [] };
}
