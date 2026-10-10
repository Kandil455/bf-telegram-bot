// Makes images smaller before they go to the AI. Smaller images cost less and answer faster,
// and a 1024 px image is still clear enough to read a diagram or a label.
// If sharp is not installed, or an image cannot be decoded, the original is returned unchanged.

export const SHRINK_MAX_SIDE = 1024;
export const SHRINK_QUALITY = 80;

let sharpPromise = null;
function loadSharp() {
  if (!sharpPromise) sharpPromise = import("sharp").then((m) => m.default).catch(() => null);
  return sharpPromise;
}

/** Returns { buffer, mime } no larger than SHRINK_MAX_SIDE on its longest side. */
export async function shrinkImage({ buffer, mime }) {
  const sharp = await loadSharp();
  if (!sharp || !buffer?.length) return { buffer, mime };
  try {
    const out = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width: SHRINK_MAX_SIDE, height: SHRINK_MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: SHRINK_QUALITY, mozjpeg: true })
      .toBuffer();
    // Only keep the smaller version, so a shrink never makes a file bigger.
    if (out.length >= buffer.length) return { buffer, mime };
    return { buffer: out, mime: "image/jpeg" };
  } catch {
    return { buffer, mime };
  }
}
