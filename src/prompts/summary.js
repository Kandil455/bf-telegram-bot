// Summary prompts. One master contract for every template, one layout brief per template,
// and a separate OSCE contract. Written with explicit POSITIVES (DO) and NEGATIVES (DON'T)
// to produce dense, exam-ready output with mandatory comparison tables and zero filler.

export const TEMPLATE_IDS = ["cornell", "cram", "table", "flow", "qa", "osce"];

/** Limits that keep output fast while handling arbitrarily long lectures via chunk map-reduce. */
export const LIMITS = Object.freeze({
  maxSourceChars: 14000,
  chunkChars: 12000,
  maxOutputTokens: { concise: 2200, standard: 3400, detailed: 4800 },
});

/** Suggests an ideal summary page count based on source word count (~350 words per study page). */
export function suggestedPages(words = 0) {
  const w = Math.max(0, Number(words) || 0);
  if (!w) return 2;
  return Math.max(1, Math.min(20, Math.ceil(w / 350)));
}

const LANGUAGE = {
  en: "Write every string in clear, precise English (Exam Focus). Use **bold** on key terms and ==highlight== on high-yield exam targets.",
  ar: "Write every string in clear, natural Arabic (الفهم والتفصيل). Keep established English technical terms in Latin script in brackets on first use, e.g. المرونة السعرية (Price elasticity). Use **bold** and ==highlight== on key Arabic terms too.",
  bilingual:
    'Every text value T must be an object {"en": "...", "ar": "..."} with the same meaning in both languages. "en" is the concise English (Exam Focus) and "ar" is the rich, natural Arabic explanation (العربي - الفهم والتفصيل), not a robotic word-by-word copy. Keep formulas and numbers identical in both, and apply **bold** and ==highlight== in BOTH "en" and "ar".',
};

const CONTRACT = `You write exam-grade study material from the SOURCE only.

Hard rules — POSITIVES (DO):
1. Ground 100% of facts in the SOURCE. Keep every formula, dose, unit, number, threshold, name and technical term verbatim.
2. Divide the lecture into sequential logical Parts using "heading" blocks (e.g. "Part 1: ...", "Part 2: ...") covering every topic in the SOURCE's order.
3. ALWAYS include structured "table" blocks (2 to 6 columns) whenever the SOURCE compares, classifies, grades, stages, or lists multiple items/drugs/fluids/criteria — even in non-table templates.
4. Apply rich inline emphasis inside BOTH English and Arabic text values:
   - **key term or concept** for every core term, title lead-in, and mechanism step.
   - ==high-yield exam target== for critical exam facts, cutoff numbers, hallmarks, or first-line choices.
   - ++formula, dose or symbol++ for equations, dosages, and normal ranges.
5. Add a "trap" block wherever students commonly confuse two ideas, and a "callout" block (tone: "tip" | "warn" | "danger" | "info") for clinical/safety red flags or memory aids.
6. Add a self-contained SVG "diagram" (viewBox "0 0 640 360", <= 25 elements, no scripts/external links) when a pathway or algorithm is clearer visually.
7. If the SOURCE has slide or page markers, cite them as "p.N" or "slide N".

Hard rules — NEGATIVES (DON'T):
1. NEVER invent facts, numbers, dates, examples, or citations not present in the SOURCE.
2. NEVER write fluff introductions, meta-commentary ("this section explains..."), or generic conclusions.
3. NEVER write long unbroken walls of prose; keep each bullet point crisp (at most 22 words per point).
4. NEVER skip comparison tables when the lecture contrasts two or more classifications, degrees, or treatments.
5. NEVER omit **bold** or ==highlight== markup in Arabic text when writing in Arabic or bilingual mode.
6. Return ONLY one JSON object. No markdown wrappers, no code fences, no commentary before or after it.`;

const SCHEMA = `JSON shape (sections in order):
{
  "title": T,
  "subtitle": T,
  "sections": [
    {"type": "heading", "text": T},
    {"type": "points", "items": [T, ...]},
    {"type": "definition", "term": T, "meaning": T, "example": T},
    {"type": "formula", "label": T, "expression": T, "when": T},
    {"type": "table", "caption": T, "headers": [T, ...], "rows": [[T, ...], ...]},
    {"type": "steps", "items": [T, ...]},
    {"type": "qa", "question": T, "answer": T},
    {"type": "trap", "text": T},
    {"type": "callout", "tone": "info|tip|warn|danger", "text": T},
    {"type": "diagram", "caption": T, "svg": "<svg viewBox=\"0 0 640 360\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>"},
    {"type": "figure", "ref": "image_N", "caption": T}
  ],
  "keywords": [string, ...]
}
T is a plain string in the target language, or {"en": "...", "ar": "..."} in bilingual mode. "example", "when" and "subtitle" may be empty strings. Use "figure" only for the images listed in the request.`;

const BRIEF = {
  cornell: `Layout: Cornell notes. Each Part starts with a "heading". Notes are short cue phrases in "points" (under 14 words each), plus a "table" whenever items are compared. Each topic ends with 2 to 4 "qa" blocks where the question is the cue and the answer is one to two sentences.`,
  cram: `Layout: high-yield exam cram sheet divided into numbered Parts ("Part 1: ...", "Part 2: ..."). Prioritise structured "points", "definition", "formula", comparison "table", "callout" (danger/warn) and "trap" blocks. Zero prose paragraphs.`,
  table: `Layout: comparison tables. Whenever the SOURCE compares, classifies or lists properties, use a "table" block with 2 to 6 columns and a caption. Use "points" only for what cannot be tabulated.`,
  flow: `Layout: process and timeline. Use "steps" for every procedure, in order, each step starts with a verb. Use "heading" to mark each phase. Add a "table" for parameter thresholds and a "trap" after any step students often skip or reverse.`,
  qa: `Layout: study cards. Produce 12 to 20 "qa" blocks covering the key ideas. Phrase each question the way an exam would ask it. Answers are one to three sentences with **bold** and ==highlight== on the core giveaway.`,
};

/**
 * One small, valid example per template. The model copies the shape, not the content, so a
 * weak model still learns exactly which blocks each style is made of. Every example is
 * checked against the schema in test/prompts.test.js.
 */
export const TEMPLATE_EXAMPLES = Object.freeze({
  cram: {
    title: "Price elasticity",
    subtitle: "Night-before sheet",
    sections: [
      { type: "definition", term: "**Price elasticity of demand**", meaning: "% change in quantity demanded divided by % change in price", example: "Price +10%, quantity -20%, so elasticity = -2" },
      { type: "formula", label: "Midpoint form", expression: "E = [(Q2-Q1)/((Q1+Q2)/2)] / [(P2-P1)/((P1+P2)/2)]", when: "Prices change a lot" },
      { type: "trap", text: "Elasticity is not the slope of the demand curve; slope depends on units." },
    ],
    keywords: ["elasticity", "midpoint"],
  },
  cornell: {
    title: "Price elasticity",
    subtitle: "Cornell notes",
    sections: [
      { type: "heading", text: "Definition" },
      { type: "points", items: ["==Elasticity== = responsiveness of quantity to price", "Measured as a percentage ratio"] },
      { type: "qa", question: "What does |E| > 1 mean?", answer: "Demand is elastic: quantity changes more than price." },
      { type: "qa", question: "What happens to revenue when demand is inelastic and price rises?", answer: "Revenue rises, because quantity falls by less than price rises." },
    ],
    keywords: ["elasticity", "revenue"],
  },
  table: {
    title: "Types of elasticity",
    subtitle: "Comparison",
    sections: [
      { type: "table", caption: "Reading |E|", headers: ["Value", "Name", "Revenue when price rises"], rows: [["|E| > 1", "Elastic", "Falls"], ["|E| < 1", "Inelastic", "Rises"]] },
      { type: "points", items: ["Necessities tend to be inelastic", "Close substitutes make demand elastic"] },
    ],
    keywords: ["elastic", "inelastic"],
  },
  flow: {
    title: "Calculating elasticity",
    subtitle: "Process",
    sections: [
      { type: "heading", text: "Phase 1: collect data" },
      { type: "steps", items: ["Write the two prices and the two quantities", "Check the units match"] },
      { type: "heading", text: "Phase 2: compute" },
      { type: "steps", items: ["Compute the midpoint % change in quantity", "Divide by the midpoint % change in price"] },
      { type: "trap", text: "Students often skip the midpoint and get a slightly different answer." },
    ],
    keywords: ["midpoint", "elasticity"],
  },
  qa: {
    title: "Price elasticity",
    subtitle: "Study cards",
    sections: [
      { type: "qa", question: "Define price elasticity of demand.", answer: "The percentage change in quantity demanded divided by the percentage change in price." },
      { type: "qa", question: "When is demand elastic?", answer: "When the absolute value of elasticity is greater than one." },
      { type: "qa", question: "Why use the midpoint formula?", answer: "It gives the same answer whether you move up or down the curve." },
    ],
    keywords: ["elasticity"],
  },
});

const STYLE_GOAL = {
  cornell: "a student who reads this once can answer every cue question from the left column",
  cram: "a student can recall every definition, formula and trap the night before the exam",
  table: "a student can compare the options side by side and see the difference at a glance",
  flow: "a student can carry out the procedure step by step without missing one",
  qa: "a student can answer each card in one breath and say why",
};

export function templateExample(template) {
  return TEMPLATE_EXAMPLES[template] ? JSON.stringify(TEMPLATE_EXAMPLES[template], null, 1) : "";
}

/**
 * Positive and negative style rules, shown to the model with every request.
 */
export const STYLE_RULES = `Style (Positives & Negatives):
DO: a numbered "heading" per Part ("Part 1: ..."); "definition" for terms; "formula" for equations; a "table" for any comparison; **bold** and ==highlight== in BOTH English & Arabic; short "points" (<18 words); "trap" and "callout" for mistakes.
DON'T: write paragraphs; repeat a point; skip tables; use markdown symbols (#, -, *) outside **bold**, ==highlight==, ++key++.`;

const DETAIL = {
  concise: "Aim for 6 to 10 sections in total.",
  standard: "Aim for 10 to 16 sections in total.",
  detailed: "Aim for 16 to 26 sections in total, with tables, examples and traps.",
};

function figureBrief(images) {
  if (!images?.length) return "No images are provided. Do not use any \"figure\" block.";
  const list = images.map((img, i) => `image_${i + 1}: "${img.caption || "no caption"}"`).join("\n");
  return `Images provided (use a "figure" block with the matching ref right after the section whose topic matches the caption; skip images whose caption matches nothing):\n${list}`;
}

/** Builds the system + user prompts for a full document in one call. */
export function buildDocumentPrompt({ template = "cram", lang = "en", title = "", text = "", images = [], detail = "standard", pages = null }) {
  const system = [CONTRACT, LANGUAGE[lang] || LANGUAGE.en, SCHEMA].join("\n\n");
  const words = String(text).split(/\s+/).filter(Boolean).length;
  const requestedPages = Number(pages) > 0 ? Math.min(25, Math.max(1, Number(pages))) : null;
  const targetSections = requestedPages
    ? Math.min(48, Math.max(4, requestedPages * 4))
    : Math.min(40, Math.max(6, Math.round(words / 110)));
  const targetWords = requestedPages
    ? Math.min(7000, Math.max(300, requestedPages * 320))
    : Math.min(6000, Math.max(400, Math.round(words * (detail === "detailed" ? 0.4 : detail === "concise" ? 0.15 : 0.25))));
  const pageRule = requestedPages
    ? `Target length: ${requestedPages} page(s) (~${targetSections} sections, ~${targetWords} words). Organize into numbered Parts ("Part 1: ...", "Part 2: ...").`
    : `Size: about ${targetSections} sections and at least ${targetWords} words in total, because the source has ${words} words. Cover every topic in it; a short answer for a long source is a failed answer.`;
  const user = [
    `Template: ${template}. Goal: ${STYLE_GOAL[template] || STYLE_GOAL.cram}.`,
    pageRule,
    BRIEF[template] || BRIEF.cram,
    STYLE_RULES,
    `Shape to copy (the content is only an illustration, never reuse it):\n${templateExample(template)}`,
    DETAIL[detail] || DETAIL.standard,
    figureBrief(images),
    `Source title: ${title || "untitled"}`,
    `SOURCE:\n"""\n${String(text).slice(0, LIMITS.maxSourceChars)}\n"""`,
    "Before you answer, check: every fact comes from the SOURCE; the blocks match the template; the JSON is valid. Then return only the JSON object.",
  ].join("\n\n");
  const tokenCap = requestedPages
    ? Math.min(8000, Math.max(2200, requestedPages * 900))
    : LIMITS.maxOutputTokens[detail] || LIMITS.maxOutputTokens.standard;
  return { system, user, maxTokens: tokenCap };
}

/** Map step for long sources: sections only, for one chunk. */
export function buildChunkPrompt({ template, lang, part, total, text, images = [] }) {
  const system = [CONTRACT, LANGUAGE[lang] || LANGUAGE.en, SCHEMA].join("\n\n");
  const user = [
    `Template: ${template}. This is part ${part} of ${total} of one lecture.`,
    BRIEF[template] || BRIEF.cram,
    STYLE_RULES,
    `Start this part's topics with numbered "heading" blocks (e.g. "Part ${part}: ...") and include a "table" block for any comparisons in this part.`,
    "Return a JSON object with only the \"sections\" key, covering this part only.",
    figureBrief(images),
    `SOURCE PART:\n"""\n${text}\n"""`,
  ].join("\n\n");
  return { system, user, maxTokens: 2600 };
}

/** Reduce step: merges chunk sections, removes duplicates, keeps the order. */
export function buildMergePrompt({ template, lang, title, sectionsJson }) {
  const system = [CONTRACT, LANGUAGE[lang] || LANGUAGE.en, SCHEMA].join("\n\n");
  const user = [
    `Template: ${template}. You are merging section lists produced from consecutive parts of one lecture.`,
    BRIEF[template] || BRIEF.cram,
    "Remove duplicate points and repeated definitions. Keep the original order and all comparison tables. Do not add new facts.",
    `Source title: ${title}`,
    `SECTIONS TO MERGE (JSON):\n${sectionsJson}`,
    "Return the full JSON object with title, subtitle, sections and keywords.",
  ].join("\n\n");
  return { system, user, maxTokens: LIMITS.maxOutputTokens.detailed };
}

/** OSCE contract: stations with scenario, tasks, a marked checklist and key phrases. */
export function buildOscePrompt({ lang = "en", title = "", text = "", stations = 3 }) {
  const system = [
    CONTRACT,
    LANGUAGE[lang] || LANGUAGE.en,
    `Build OSCE-style stations from the SOURCE. Each station is a realistic, short scenario that tests a skill or decision in the SOURCE. JSON shape:
{
  "title": T,
  "stations": [
    {
      "title": T,
      "setting": T,
      "scenario": T,
      "tasks": [T, ...],
      "checklist": [{"item": T, "marks": 1}, ...],
      "key_phrases": [T, ...],
      "common_errors": [T, ...]
    }
  ]
}
Every checklist item is observable, with marks 1 or 2. Use only what the SOURCE teaches.`,
  ].join("\n\n");
  const user = [
    `Create ${stations} stations. Each station has 4 to 8 checklist items.`,
    `Source title: ${title || "untitled"}`,
    `SOURCE:\n"""\n${String(text).slice(0, LIMITS.maxSourceChars)}\n"""`,
    "Return the JSON object now.",
  ].join("\n\n");
  return { system, user, maxTokens: 3200 };
}

/** Asked once when the first reply is not valid JSON. */
export function buildRepairPrompt(badReply) {
  return {
    system: "You repair JSON. Return only the corrected JSON object. No commentary.",
    user: `Fix this so it is one valid JSON object, keeping every value:\n${String(badReply).slice(0, 12000)}`,
    maxTokens: 3200,
  };
}
