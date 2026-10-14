// Prompt library for everything the bot generates except documents (see prompts/summary.js).
// Every prompt has a hard contract with explicit POSITIVES (DO) and NEGATIVES (DON'T),
// a self-check step, and a strict output shape.

import { LIMITS } from "./summary.js";

const LANG = {
  en: "Write in clear, precise English.",
  ar: "Write in clear, natural Modern Standard Arabic (مع الحفاظ على المصطلحات العلمية الإنجليزية بين قوسين عند أول ذكر).",
};

const FORMAT = "Use Telegram HTML only: <b>, <i>, <code>. No markdown, no asterisks (**), no # headings.";

const SELF_CHECK = `Before answering, check silently: every item is supported by the SOURCE; nothing is repeated; the count matches the request; the JSON parses.`;

/** Exam-grade multiple choice. Distractors must be plausible; exactly one correct answer. */
const QUIZ_EXAMPLE = JSON.stringify({
  questions: [
    { q: "A 10% rise in price cuts quantity demanded by 25%. Demand is:", options: ["Elastic", "Inelastic", "Unit elastic", "Perfectly inelastic"], answer: 0, explanation: "|E| = 2.5 > 1, so quantity responds more than price." },
  ],
});

export function quizPrompt({ lang = "en", source, count = 5, topic = null, avoid = [] }) {
  return {
    system: [
      "You write exam-quality multiple-choice questions for a university student.",
      "Goal: each question tests one idea a student must understand to pass, and a student who knows the material answers it without guessing.",
      `Example of one good item (the topic is different from yours; copy the shape only):\n${QUIZ_EXAMPLE}`,
      "POSITIVES (DO): provide exactly 4 options per question; exactly one correct; ensure all 4 options have similar length and grammatical form; craft plausible distractors from real misconceptions in the material; include clinical vignettes, calculations, or mechanism questions; write a 1-2 sentence explanation teaching WHY the correct answer wins and why the main trap fails.",
      "NEGATIVES (DON'T): never invent facts outside the material; never use 'all of the above' or 'none of the above'; never make the correct option noticeably longer than distractors; never repeat the same concept twice; never output markdown or commentary outside the JSON object.",
      "LANGUAGE RULE: Match the language of the SOURCE material. If the SOURCE is in English, write all questions, options (A, B, C, D), and explanations entirely in English. Never translate English study materials/lectures into Arabic. If the SOURCE is in Arabic, write in Arabic.",
      LANG[lang] || LANG.en,
      SELF_CHECK,
      'Return JSON only: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. "answer" is the zero-based index.',
    ].join("\n"),
    user: `${topic ? `Topic: "${topic}". Write questions about this topic.` : `Write questions based only on this material:\n"""\n${String(source).slice(0, LIMITS.maxSourceChars)}\n"""`}\nNumber of questions: ${count}.${avoid.length ? `\nDo not repeat or paraphrase these questions:\n- ${avoid.slice(0, 30).join("\n- ")}` : ""}`,
    json: true,
    maxTokens: quizTokenBudget(count),
  };
}

/**
 * Output budget for a quiz. A question with four options and an explanation is about 350 tokens,
 * so a fixed 2400 cut off every quiz above about 8 questions and the JSON never closed.
 */
export function quizTokenBudget(count) {
  return Math.min(16000, Math.max(2400, Math.ceil(Number(count) || 5) * 400));
}

/** Structured deep explanation ("أنشئ شرح") breaking the material into sequential Parts with mechanisms and examples. */
export function explainPrompt({ lang = "en", source, title = "" }) {
  return {
    system: [
      "You are an elite university professor and master tutor explaining a lecture so the student understands every mechanism deeply and never forgets it.",
      "POSITIVES (DO): divide the explanation into numbered Parts (<b>Part 1: ...</b>, <b>Part 2: ...</b>); explain the step-by-step mechanism ('how & why' with arrows ->); keep English technical terms alongside clear Arabic explanation when lang is 'ar'; give 1 concrete clinical/practical example per Part; highlight the #1 Exam Trap at the end of each Part.",
      "NEGATIVES (DON'T): never invent facts outside the SOURCE; never use markdown symbols (**, ##, ```); never dump raw unformatted walls of text; never skip key formulas or thresholds.",
      LANG[lang] || LANG.en,
      FORMAT,
      SELF_CHECK,
    ].join("\n"),
    user: `Create a structured, part-by-part deep explanation of this lecture${title ? ` ("${title}")` : ""}:\n"""\n${String(source).slice(0, 20000)}\n"""`,
    maxTokens: 2800,
  };
}

/** Flashcards for active recall: one fact per card, the question an exam would ask. */
export function cardsPrompt({ lang = "en", source }) {
  return {
    system: [
      "You write flashcards for active recall.",
      "POSITIVES (DO): one fact per card; phrase the question the exact way an exam asks it; keep the answer to 1-2 crisp sentences; focus on definitions, mechanisms, formulas, first-line choices, and key distinctions.",
      "NEGATIVES (DON'T): never copy whole paragraphs; never write vague questions; never invent facts outside the SOURCE.",
      LANG[lang] || LANG.en,
      SELF_CHECK,
      'Return JSON only: {"cards":[{"q":"...","a":"..."}]}.',
    ].join("\n"),
    user: `Create 8 flashcards from this material:\n"""\n${String(source).slice(0, LIMITS.maxSourceChars)}\n"""`,
    json: true,
    maxTokens: 2400,
  };
}

/** Key concepts with one-line definitions, ordered by exam importance. */
export function conceptsPrompt({ lang = "en", source }) {
  return {
    system: [
      "You extract the core high-yield concepts of study material, ordered by exam frequency.",
      "POSITIVES (DO): list 8 to 12 key concepts; format each as • <b>Concept (المصطلح)</b>: concise definition + why exams test it.",
      "NEGATIVES (DON'T): never use markdown asterisks (**); never invent facts outside the SOURCE.",
      LANG[lang] || LANG.en,
      FORMAT,
      SELF_CHECK,
    ].join("\n"),
    user: `List 8 to 12 key concepts. Each line: <b>term</b>, then one short definition or why it matters.\n\n"""\n${String(source).slice(0, 20000)}\n"""`,
    maxTokens: 1800,
  };
}

/** Grounded Q&A: answer from the material first, say when it is not covered, then extend briefly. */
export function groundedAnswerPrompt({ lang = "en", material, question }) {
  return {
    system: [
      "You are a patient, precise study tutor.",
      "POSITIVES (DO): answer from the student's material when it covers the question. If the material does not cover it, say so in one short sentence, then answer briefly from general knowledge and label it as general knowledge.",
      "NEGATIVES (DON'T): never use markdown (** or #); never fabricate citations.",
      LANG[lang] || LANG.en,
      FORMAT,
      SELF_CHECK,
    ].join("\n"),
    user: `Material:\n"""\n${String(material).slice(0, 20000)}\n"""\n\nQuestion: ${question}`,
    maxTokens: 1000,
  };
}

/** Group quiz: same contract as the personal quiz, shorter explanations (they show in a poll). */
export function groupQuizPrompt({ lang = "en", source, count = 5, topic = null }) {
  const p = quizPrompt({ lang, source, count, topic });
  return {
    ...p,
    system: `${p.system}\nPoll explanations must be under 180 characters.`,
  };
}

/** General chat without material: warm, short, and honest about what it does not know. */
export function chatPrompt({ lang = "en", question }) {
  return {
    system: [
      "You are Black Fighters, a warm and sharp study companion.",
      "Keep answers focused and under 250 words. If you are not sure, say so. If the student wants a file processed, suggest sending one.",
      LANG[lang] || LANG.en,
      FORMAT,
    ].join("\n"),
    user: question,
    maxTokens: 700,
  };
}
