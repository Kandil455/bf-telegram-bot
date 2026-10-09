// AI review of extracted images. Each image is looked at on its own, so the verdict and
// the questions are based on what is visible in that image and nothing else.

import { parseJsonLoose } from "../core/text.js";
import { normaliseQuiz } from "../core/quiz.js";

const KEEP_TYPES = ["diagram", "chart", "table", "labelled_figure", "clinical_image", "flowchart", "graph", "anatomy", "equation", "other_educational"];
const DROP_TYPES = ["logo", "cover", "decoration", "blank", "dark", "watermark", "advert", "ui_screenshot", "unrelated"];

export function imageReviewPrompt(lang = "en") {
  const language = lang === "ar" ? "Write the caption in Modern Standard Arabic." : "Write the caption in English.";
  return {
    system: [
      "You review one image taken from a study file, and decide if a student should study from it.",
      `Keep the image (keep=true) if it teaches course content: diagrams, charts, graphs, tables, labelled figures, anatomy, flowcharts, equations, clinical images with findings.`,
      `Drop it (keep=false) if it is a university or company logo, a cover or decoration, blank or almost completely black, a watermark, an advert, a screenshot of an unrelated interface, or otherwise unrelated to study.`,
      language,
      'Return JSON only: {"keep": true|false, "type": "one of: ' + [...KEEP_TYPES, ...DROP_TYPES].join("|") + '", "caption": "at most 12 words", "reason": "at most 15 words"}',
    ].join("\n"),
    user: "Review this image.",
    json: true,
    maxTokens: 300,
  };
}

/** Parses one review. When the reply is unusable the image is kept for the student to decide. */
export function parseImageReview(raw) {
  const j = parseJsonLoose(raw);
  if (!j || typeof j !== "object") return { keep: true, type: "unknown", caption: "", reason: "not reviewed by AI" };
  return {
    keep: j.keep !== false,
    type: String(j.type || "unknown").slice(0, 40),
    caption: String(j.caption || "").replace(/<[^>]*>/g, "").slice(0, 160),
    reason: String(j.reason || "").replace(/<[^>]*>/g, "").slice(0, 160),
  };
}

/** Reviews images one by one. `ai.complete` gets the image as a vision input. */
export async function reviewImages({ ai, images, lang = "en", onProgress = () => {} }) {
  const decisions = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const reply = await ai.complete({ ...imageReviewPrompt(lang), images: [{ mime: img.mime, b64: img.buffer.toString("base64") }] });
    decisions.push(reply ? parseImageReview(reply.text) : { keep: true, type: "unknown", caption: "", reason: "AI unavailable" });
    onProgress(i + 1, images.length);
  }
  return decisions;
}

/**
 * Quiz questions from ONE image. Only what is visible counts. A non-educational image
 * yields no questions instead of invented ones.
 */
export function imageQuizPrompt({ lang = "en", count = 3, caption = "" }) {
  const language = lang === "ar" ? "Write the questions and options in Modern Standard Arabic." : "Write the questions and options in clear English.";
  return {
    system: [
      "You write OSCE-style multiple-choice questions from ONE image.",
      "Use ONLY what is visible in this image: labels, numbers, text, structures, trends and relations drawn in it. Do not use outside knowledge about the topic, and do not guess what the image does not show.",
      "Each question tests interpretation or identification: what is labelled, what a value or trend means, what a structure is, what the next step or the cause is, as shown in the image.",
      "Exactly 4 options; exactly one correct; distractors are plausible misreadings of this image; the explanation points to the part of the image that proves the answer.",
      "If the image is not educational or shows no readable content, return {\"questions\": []}.",
      language,
      'Return JSON only: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}',
    ].join("\n"),
    user: `Write ${count} question${count === 1 ? "" : "s"} from this image.${caption ? ` Reviewer's caption: "${caption}".` : ""}`,
    json: true,
    maxTokens: 1400,
  };
}

/** Parses an image quiz reply, keeping only well-formed items. */
export function parseImageQuiz(raw, count) {
  return normaliseQuiz(parseJsonLoose(raw), count);
}
