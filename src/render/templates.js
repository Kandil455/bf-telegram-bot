// Template registry: what each summary style is called, how it looks in the picker,
// what it costs, and which builder produces it. Adding a template means adding one entry here.

export const TEMPLATES = Object.freeze({
  cram: {
    id: "cram",
    icon: "spark",
    cost: 1,
    label: { en: "Cram sheet", ar: "ورقة الامتحان" },
    blurb: { en: "One dense page of definitions, formulas and traps.", ar: "صفحة واحدة مكثفة: تعريفات ومعادلات وأفخاخ الامتحان." },
  },
  cornell: {
    id: "cornell",
    icon: "summary",
    cost: 1,
    label: { en: "Cornell notes", ar: "ملاحظات كورنيل" },
    blurb: { en: "Cue questions on the left, answers on the right.", ar: "أسئلة مفتاحية على اليسار والإجابات على اليمين." },
  },
  table: {
    id: "table",
    icon: "concepts",
    cost: 1,
    label: { en: "Comparison tables", ar: "جداول المقارنة" },
    blurb: { en: "Compare, classify and tabulate every property.", ar: "قارن وصنّف وجدوِل كل الخصائص." },
  },
  flow: {
    id: "flow",
    icon: "next",
    cost: 1,
    label: { en: "Process & timeline", ar: "خطوات وتسلسل" },
    blurb: { en: "Numbered procedures, phases and the steps people skip.", ar: "إجراءات مرقمة ومراحل والخطوات اللي الناس بتنساها." },
  },
  qa: {
    id: "qa",
    icon: "cards",
    cost: 1,
    label: { en: "Study cards", ar: "كروت مذاكرة" },
    blurb: { en: "12 to 20 exam-style questions with short answers.", ar: "من 12 لـ 20 سؤال بأسلوب الامتحان وإجابات مختصرة." },
  },
  osce: {
    id: "osce",
    icon: "quiz",
    cost: 2,
    label: { en: "OSCE stations", ar: "محطات OSCE" },
    blurb: { en: "Scenarios with tasks and a marked checklist.", ar: "سيناريوهات بمهام وقائمة تقييم بالدرجات." },
  },
});

export const TEMPLATE_ORDER = ["cram", "cornell", "table", "flow", "qa", "osce"];

export function templateFor(id) {
  return TEMPLATES[id] || null;
}
