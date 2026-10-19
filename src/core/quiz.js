// Validation for model output + smart file question-bank detection & local extraction.

const OPTION_LABEL_RE =
  /^\s*(?:\(([A-Da-d1-4أ-د])\)|([A-Da-d1-4أ-د])[.)\-:\]]|option\s+([A-Da-d1-4]))\s+/i;

const QUESTION_LINE_RE =
  /^(?:(?:Q|Question|س|سؤال)\s*\d*[\s.):\-]+|\d{1,3}[\s.):\-]+)(.{8,})/i;
const OPTION_LINE_RE =
  /^\s*(?:[A-Da-dأ-د][.)\-:\]]|\([A-Da-dأ-د]\))\s+(.+)/;
const ANSWER_LINE_RE =
  /^\s*(?:Answer|Correct(?:\s+Answer)?|Ans|الإجابة(?:\s+الصحيحة)?|الجواب|الحل)\s*[:\-=]?\s*([A-Da-d1-4أ-د])\b/i;

function letterToIdx(ch) {
  const s = String(ch || "").trim().toUpperCase();
  if (s === "A" || s === "1" || s === "أ" || s === "ا") return 0;
  if (s === "B" || s === "2" || s === "ب") return 1;
  if (s === "C" || s === "3" || s === "ج") return 2;
  if (s === "D" || s === "4" || s === "د") return 3;
  return -1;
}

export function cleanOptionText(value) {
  return String(value ?? "")
    .replace(OPTION_LABEL_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeSourceMaterial(text) {
  const raw = String(text || "");
  if (!raw.trim()) {
    return {
      kind: "lecture",
      estimatedQuestions: 0,
      hasOptions: false,
      hasAnswerKey: false,
      localQuestions: [],
    };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let questionMarkers = 0;
  let optionMarkers = 0;
  let answerMarkers = 0;
  let questionMarkLines = 0;

  for (const line of lines) {
    if (OPTION_LINE_RE.test(line)) {
      optionMarkers += 1;
      continue;
    }
    if (ANSWER_LINE_RE.test(line)) {
      answerMarkers += 1;
      continue;
    }
    if (QUESTION_LINE_RE.test(line)) {
      questionMarkers += 1;
    }
    if (/[?؟]\s*$/.test(line) && line.length >= 12) {
      questionMarkLines += 1;
    }
  }

  const inlineOptions = (
    raw.match(/(?:^|\s)(?:\(?[A-Da-d]\)|[A-Da-d][.)\-:])\s+\S+/gm) || []
  ).length;
  const effectiveOptionCount = Math.max(optionMarkers, inlineOptions);
  const localQuestions = extractQuestionsLocally(raw, 50);
  const estimatedByOptions = Math.floor(effectiveOptionCount / 3);
  const estimatedQuestions = Math.max(
    localQuestions.length,
    estimatedByOptions,
    Math.min(questionMarkers, Math.max(questionMarkLines, estimatedByOptions)),
  );

  let kind = "lecture";
  if (
    localQuestions.length >= 5 ||
    (estimatedQuestions >= 6 && effectiveOptionCount >= 16)
  ) {
    const ratio =
      (estimatedQuestions * 35) / Math.max(1, raw.split(/\s+/).length);
    kind = ratio >= 0.3 ? "question_bank" : "mixed";
  } else if (
    localQuestions.length >= 2 ||
    (estimatedQuestions >= 3 && effectiveOptionCount >= 8) ||
    (questionMarkLines >= 5 && questionMarkers >= 3)
  ) {
    kind = "mixed";
  }

  return {
    kind,
    estimatedQuestions,
    hasOptions: effectiveOptionCount >= 6,
    hasAnswerKey: answerMarkers >= 2,
    localQuestions,
  };
}

export function extractQuestionsLocally(text, maxCount = 50) {
  const raw = String(text || "");
  if (!raw.trim()) return [];

  const lines = raw.split(/\r?\n/);
  const extracted = [];
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    const opts = current.options.map((o) => cleanOptionText(o).slice(0, 120)).filter(Boolean);
    if (current.q && opts.length >= 2 && opts.length <= 4) {
      extracted.push({
        q: current.q.replace(/\s+/g, " ").trim().slice(0, 300),
        options: opts.slice(0, 4),
        answer:
          current.answer >= 0 && current.answer < opts.length
            ? current.answer
            : -1,
        explanation: String(current.explanation || "").slice(0, 300),
      });
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const ansMatch = line.match(ANSWER_LINE_RE);
    if (ansMatch && current) {
      const idx = letterToIdx(ansMatch[1]);
      if (idx >= 0) current.answer = idx;
      continue;
    }

    const optMatch = line.match(OPTION_LINE_RE);
    if (optMatch && current) {
      const cleaned = cleanOptionText(optMatch[1]);
      if (cleaned) {
        const hasStar = /[*✓✔]/.test(line);
        if (hasStar && current.answer === -1) {
          current.answer = current.options.length;
        }
        current.options.push(cleaned.replace(/[*✓✔]+/g, "").trim());
      }
      continue;
    }

    const qMatch = line.match(QUESTION_LINE_RE);
    if (qMatch) {
      flushCurrent();
      current = {
        q: qMatch[1].trim(),
        options: [],
        answer: -1,
        explanation: "",
      };
      if (extracted.length >= maxCount) break;
      continue;
    }

    if (current && current.options.length === 0 && current.q.length < 220) {
      current.q += ` ${line}`;
    }
  }
  flushCurrent();

  return extracted.slice(0, maxCount);
}

export function normaliseQuiz(raw, max = 5) {
  const list = Array.isArray(raw?.questions) ? raw.questions : Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of list) {
    const options = Array.isArray(item?.options) ? item.options.map((o) => cleanOptionText(o).slice(0, 120)) : [];
    const rawAns = item?.answer ?? item?.correct;
    const answer = typeof rawAns === "string" && letterToIdx(rawAns) >= 0 ? letterToIdx(rawAns) : Number(rawAns);
    if (!item?.q || options.length < 2 || options.length > 4) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
    out.push({
      q: String(item.q).slice(0, 300),
      options,
      answer,
      explanation: String(item.explanation || "").slice(0, 300),
    });
    if (out.length >= max) break;
  }
  return out;
}

export function normaliseCards(raw, max = 8) {
  const list = Array.isArray(raw?.cards) ? raw.cards : Array.isArray(raw) ? raw : [];
  const out = [];
  for (const c of list) {
    if (!c?.q || !c?.a) continue;
    out.push({ q: String(c.q).slice(0, 240), a: String(c.a).slice(0, 360) });
    if (out.length >= max) break;
  }
  return out;
}
