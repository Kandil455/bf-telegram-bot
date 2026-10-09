// Makes sure every approved image appears in a summary. The model places figures it was
// told about; any image it left out is added at the end under a "Figures" heading, so no
// approved picture is lost.

export function ensureFigures(doc, images = []) {
  if (!images.length) return doc;
  const used = new Set();
  for (const s of doc.sections || []) {
    if (s.type === "figure" && s.ref) used.add(s.ref);
  }
  const extra = [];
  images.forEach((img, i) => {
    const ref = `image_${i + 1}`;
    if (used.has(ref)) return;
    extra.push({ type: "figure", ref, index: i, caption: img.caption ? { en: img.caption, ar: img.caption } : "" });
  });
  if (!extra.length) return doc;
  const heading = { type: "heading", text: { en: "Figures", ar: "الصور" } };
  return { ...doc, sections: [...doc.sections, heading, ...extra] };
}
