// Prompt library for everything the bot generates except documents (see prompts/summary.js).
// Every prompt has a hard contract, a self-check step, and a strict output shape.

import { LIMITS } from "./summary.js";

const LANG = {
  en: "Write in clear, precise English.",
  ar: "Write in Modern Standard Arabic. Keep established English technical terms in brackets on first use.",
};

const FORMAT = "Use Telegram HTML only: <b>, <i>, <code>. No markdown, no asterisks, no # headings.";

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
      "Rules: exactly 4 options; exactly one correct; distractors are plausible misconceptions from the material, never silly; no 'all of the above'; no option is longer than the correct one by a telltale margin; avoid negatives unless the material stresses them; test understanding, not trivia; the explanation is one or two sentences that teach the reason.",
      LANG[lang] || LANG.en,
      SELF_CHECK,
      'Return JSON only: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. "answer" is the zero-based index.',
    ].join("\n"),
    user: `${topic ? `Topic: "${topic}". Write questions about this topic.` : `Write questions based only on this material:\n"""\n${String(source).slice(0, LIMITS.maxSourceChars)}\n"""`}\nNumber of questions: ${count}.${avoid.length ? `\nDo not repeat or paraphrase these questions:\n- ${avoid.slice(0, 30).join("\n- ")}` : ""}`,
    json: true,
    maxTokens: 2400,
  };
}

/** Flashcards for active recall: one fact per card, the question an exam would ask. */
export function cardsPrompt({ lang = "en", source }) {
  return {
    system: [
      "You write flashcards for active recall.",
      "Rules: one fact per card; the question is specific enough to have one right answer; the answer is one or two sentences; never copy whole paragraphs; prefer definitions, causes, formulas and distinctions.",
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
      "You extract the core ideas of study material, ordered by how often an exam would test them.",
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
      "Answer from the student's material when it covers the question. If the material does not cover it, say so in one short sentence, then answer briefly from general knowledge and label it as general knowledge.",
      LANG[lang] || LANG.en,
      FORMAT,
      SELF_CHECK,
    ].join("\n"),
    user: `Material:\n"""\n${String(material).slice(0, 20000)}\n"""\n\nQuestion: ${question}`,
    maxTokens: 800,
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
