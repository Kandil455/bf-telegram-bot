// Everything that happens to the images inside a file:
//   extract -> AI review (keep or drop, with a caption) -> gallery (approve, exclude,
//   approve all, review one by one, restore AI exclusions, send out, quiz from images).
// The images themselves stay in memory for a couple of hours. Only their status is stored.

import { button } from "../core/buttons.js";
import { act } from "../core/actions.js";
import { copy } from "../core/copy.js";
import { esc, HR } from "../core/text.js";
import { QUIZ_SIZES } from "../services/entitlements.js";
import { approveAllPending, approvedIndexes, counts, createGallery, restoreAutoExcluded, setStatus, STATUS } from "../features/gallery.js";
import { imageQuizPrompt, parseImageQuiz, reviewImages } from "../media/review.js";
import { shuffleOptions } from "../quality/quiz.js";

const CACHE_MS = 2 * 3600 * 1000;
const MEDIA_KINDS = new Set(["pdf", "docx", "pptx"]);

export function createMediaFlow({ ui, store, ai, cfg, ent, premium = {}, extract, logger = console, now = () => Date.now() }) {
  const cache = new Map(); // chatId -> { images, at }

  const sessionKey = (chatId) => `s:${chatId}`;
  const session = (chatId) => store.get(sessionKey(chatId)) || {};
  const patch = (chatId, p) => store.patch(sessionKey(chatId), p);

  function putImages(chatId, images) {
    cache.set(chatId, { images, at: now() });
  }
  function getImages(chatId) {
    const entry = cache.get(chatId);
    if (!entry || now() - entry.at > CACHE_MS) {
      cache.delete(chatId);
      return [];
    }
    return entry.images;
  }
  function saveGallery(chatId, gallery) {
    patch(chatId, { gallery: { items: gallery.items } });
  }
  function getGallery(chatId) {
    const g = session(chatId).gallery;
    return g?.items ? { items: g.items } : null;
  }

  const b = (label, icon, action, style = null) => button({ label, icon, action, style, premium });

  /** Called after a PDF, Word or PowerPoint file is read. Returns a summary or null. */
  async function onFile({ chatId, lang, kind, buffer, name, reviewProgress = () => {} }) {
    if (!MEDIA_KINDS.has(kind)) return null;
    const got = await (extract || (await import("../media/extract.js")).extractImages)({ kind, buffer, bin: cfg.pdfimagesBin, max: cfg.maxImagesPerFile });
    const images = got.images || [];
    if (!images.length) return { count: 0, note: got.note || null };
    putImages(chatId, images);
    let decisions = [];
    if (cfg.imageReview && ai) {
      try {
        decisions = await reviewImages({ ai, images, lang, onProgress: reviewProgress });
      } catch (err) {
        logger.warn?.("[media] review failed:", err?.message || err);
      }
    }
    const gallery = createGallery(images, decisions);
    saveGallery(chatId, gallery);
    return { count: images.length, gallery: counts(gallery), note: got.note || null, file: name };
  }

  function galleryCard(chatId, lang) {
    const c = copy(lang);
    const gallery = getGallery(chatId);
    if (!gallery) return null;
    const k = counts(gallery);
    const text = lang === "ar"
      ? `📸 <b>صور الملف</b>\n${HR}\nإجمالي <b>${k.total}</b> · مقبولة للمراجعة <b>${k.pending + k.approved}</b> · مستبعدة <b>${k.excluded}</b> (منها ${k.autoExcluded} بالـ AI)\nمعتمدة: <b>${k.approved}</b>`
      : `📸 <b>Images from your file</b>\n${HR}\n<b>${k.total}</b> found · <b>${k.pending + k.approved}</b> kept · <b>${k.excluded}</b> excluded (${k.autoExcluded} by AI)\nApproved: <b>${k.approved}</b>`;
    const rows = [
      [b(lang === "ar" ? "اعتمد الكل" : "Approve all", "done", act("img", "all"), "success")],
      [b(lang === "ar" ? "راجع واحدة واحدة" : "Review one by one", "explain", act("img", "next"), "primary")],
      [b(lang === "ar" ? "راجع بالـ AI تاني" : "Re-run AI review", "spark", act("img", "ai"), "primary"), b(lang === "ar" ? "رجّع المستبعد بالـ AI" : "Restore AI exclusions", "reset", act("img", "restore"), "primary")],
      [b(lang === "ar" ? "ابعت الصور بره الملف" : "Send images out", "upload", act("img", "export"), "primary"), b(lang === "ar" ? "كويز من الصور" : "Image OSCE quiz", "quiz", act("qc", "pick", "images"), "success")],
      [b(c.btn.menu, "home", act("menu"))],
    ];
    return { text, rows };
  }

  async function showGallery(chatId, lang) {
    const card = galleryCard(chatId, lang);
    if (!card) return ui.send(chatId, copy(lang).noImages);
    return ui.send(chatId, card.text, card.rows);
  }

  /** Sends the next pending image as a photo with approve, exclude and skip buttons. */
  async function reviewNext(chatId, lang, after = null) {
    const gallery = getGallery(chatId);
    const images = getImages(chatId);
    if (!gallery) return ui.send(chatId, copy(lang).noImages);
    const pendingItems = gallery.items.filter((i) => i.status === STATUS.PENDING);
    const item = (after === null ? pendingItems[0] : pendingItems.find((i) => i.idx > after) || pendingItems[0]) || null;
    if (!item) return ui.send(chatId, lang === "ar" ? "🎉 مفيش صور مستنية مراجعة." : "🎉 No pending images left.", [[b(lang === "ar" ? "رجوع للجاليري" : "Back to gallery", "back", act("img", "card"))]]);
    const img = images[item.idx];
    if (!img) return ui.send(chatId, copy(lang).noImages);
    const caption = `#${item.idx + 1} · ${esc(item.type)}${item.caption ? `\n<b>${esc(item.caption)}</b>` : ""}${item.reason ? `\n<i>${esc(item.reason)}</i>` : ""}`;
    const rows = [
      [b(lang === "ar" ? "اعتمد" : "Approve", "done", act("img", "ok", String(item.idx)), "success"), b(lang === "ar" ? "استبعد" : "Exclude", "wrong", act("img", "no", String(item.idx)), "danger")],
      [b(lang === "ar" ? "تخطّى" : "Skip", "next", act("img", "skip", String(item.idx))), b(lang === "ar" ? "الجاليري" : "Gallery", "back", act("img", "card"))],
    ];
    return ui.sendPhoto(chatId, img.buffer, img.name, caption, rows);
  }

  function decide(chatId, idx, status) {
    const gallery = getGallery(chatId);
    if (!gallery) return false;
    const ok = setStatus(gallery, idx, status);
    if (ok) saveGallery(chatId, gallery);
    return ok;
  }

  function approveAll(chatId) {
    const gallery = getGallery(chatId);
    if (!gallery) return 0;
    const n = approveAllPending(gallery);
    saveGallery(chatId, gallery);
    return n;
  }

  function restoreAi(chatId) {
    const gallery = getGallery(chatId);
    if (!gallery) return 0;
    const n = restoreAutoExcluded(gallery);
    saveGallery(chatId, gallery);
    return n;
  }

  /** Re-runs the AI review on images that are still pending. Returns how many were dropped. */
  async function rerunReview(chatId, lang) {
    const gallery = getGallery(chatId);
    const images = getImages(chatId);
    if (!gallery || !images.length || !ai) return 0;
    const pending = gallery.items.filter((i) => i.status === STATUS.PENDING);
    const decisions = await reviewImages({ ai, images: pending.map((i) => images[i.idx]), lang });
    let dropped = 0;
    decisions.forEach((d, k) => {
      const item = gallery.items[pending[k].idx];
      if (d.keep === false) {
        item.status = STATUS.EXCLUDED;
        item.autoExcluded = true;
        dropped += 1;
      }
      item.type = d.type || item.type;
      item.caption = d.caption || item.caption;
      item.reason = d.reason || item.reason;
    });
    saveGallery(chatId, gallery);
    return dropped;
  }

  /** Sends the chosen images (approved, or every kept image if none is approved) as albums. */
  async function exportImages(chatId, lang) {
    const gallery = getGallery(chatId);
    const images = getImages(chatId);
    if (!gallery || !images.length) return 0;
    let idxs = approvedIndexes(gallery);
    if (!idxs.length) idxs = gallery.items.filter((i) => i.status !== STATUS.EXCLUDED).map((i) => i.idx);
    const photos = idxs.map((i) => images[i]).filter(Boolean);
    for (let k = 0; k < photos.length; k += 10) {
      await ui.sendMediaGroup(chatId, photos.slice(k, k + 10).map((p) => ({ buffer: p.buffer, name: p.name })));
    }
    return photos.length;
  }

  /** Picker for the image-quiz size, limited by what the file has left. */
  function sizePicker(chatId, lang, userId, source) {
    const sizes = ent.allowedQuizSizes(session(chatId), userId);
    if (!sizes.length) return null;
    const row = sizes.map((n) => b(String(n), "quiz", act("qc", String(n), source), "primary"));
    const rows = [];
    for (let i = 0; i < row.length; i += 3) rows.push(row.slice(i, i + 3));
    rows.push([b(copy(lang).btn.back, "back", act("menu"))]);
    return rows;
  }

  /**
   * Builds a quiz from the approved images, one image at a time, so every question is
   * grounded in exactly one picture. Returns { items, used } or null.
   */
  async function imageQuiz(chatId, lang, count) {
    const gallery = getGallery(chatId);
    const images = getImages(chatId);
    if (!gallery || !ai) return null;
    const approved = approvedIndexes(gallery);
    if (!approved.length) return null;
    const perImage = Math.max(1, Math.ceil(count / approved.length));
    const items = [];
    const used = [];
    for (const idx of approved) {
      if (items.length >= count) break;
      const img = images[idx];
      if (!img) continue;
      const need = Math.min(perImage, count - items.length);
      const prompt = imageQuizPrompt({ lang, count: need, caption: gallery.items[idx].caption });
      const reply = await ai.complete({ ...prompt, images: [{ mime: img.mime, b64: img.buffer.toString("base64") }] });
      const made = parseImageQuiz(reply?.text, need).map((q) => ({ ...q, image: idx, imageCaption: gallery.items[idx].caption || "" }));
      if (made.length) {
        items.push(...made.map((q) => shuffleOptions(q)));
        used.push(idx);
      }
    }
    if (!items.length) return null;
    return { items: items.slice(0, count), used };
  }

  async function sendUsedImages(chatId, used, lang) {
    const images = getImages(chatId);
    const photos = used.map((i) => images[i]).filter(Boolean).slice(0, 10).map((p) => ({ buffer: p.buffer, name: p.name }));
    if (photos.length) await ui.sendMediaGroup(chatId, photos, lang === "ar" ? "صور الكويز" : "Images for this quiz");
  }

  /** Output file for summaries in PDF or PPTX. Falls back to HTML with a note when a tool is missing. */
  async function buildOutput({ format, html, doc, kind, lang, chatId, name }) {
    const base = name.replace(/\.html$/, "");
    if (format === "html" || kind !== "doc") return { content: html, name: `${base}.html`, note: null };
    const images = approvedIndexes(getGallery(chatId) || { items: [] }).map((i) => getImages(chatId)[i]).filter(Boolean);
    if (format === "pdf") {
      try {
        const { renderPdf, findChrome, explainFailure } = await import("../render/export.js");
        const chrome = findChrome(cfg.chromePath);
        if (!chrome) throw Object.assign(new Error("chrome"), { code: "NO_CHROME" });
        return { content: await renderPdf(html, { chromePath: chrome }), name: `${base}.pdf`, note: null };
      } catch (err) {
        logger.warn?.("[media] pdf failed:", err?.code || err?.message);
        const { explainFailure } = await import("../render/export.js");
        return { content: html, name: `${base}.html`, note: explainFailure(err.code) };
      }
    }
    if (format === "pptx") {
      try {
        const { buildPptx } = await import("../render/export.js");
            return { content: await buildPptx(doc, { lang, images }), name: `${base}.pptx`, note: null };
      } catch (err) {
        logger.warn?.("[media] pptx failed:", err?.code || err?.message);
        const { explainFailure } = await import("../render/export.js");
        return { content: html, name: `${base}.html`, note: explainFailure(err.code) };
      }
    }
    return { content: html, name: `${base}.html`, note: null };
  }

  return {
    onFile,
    showGallery,
    reviewNext,
    decide,
    approveAll,
    restoreAi,
    rerunReview,
    exportImages,
    sizePicker,
    imageQuiz,
    sendUsedImages,
    buildOutput,
    getGallery,
    getImages,
    /** Approved images from the file, ready to put in a summary: [{ mime, b64, caption }]. */
    approvedForSummary(chatId) {
      const gallery = getGallery(chatId);
      const images = getImages(chatId);
      if (!gallery) return [];
      return approvedIndexes(gallery)
        .filter((i) => images[i])
        .map((i) => ({ mime: images[i].mime, b64: images[i].buffer.toString("base64"), caption: gallery.items[i].caption || gallery.items[i].type || "" }));
    },
    hasApproved: (chatId) => approvedIndexes(getGallery(chatId) || { items: [] }).length > 0,
    _cache: cache,
  };
}

export { QUIZ_SIZES };
