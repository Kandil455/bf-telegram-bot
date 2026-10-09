// Every keyboard in one place, so the bot's button design can be changed in one file.
// Layout principles: one primary action per screen, grouped rows of two, and
// a "menu" escape hatch on every screen. Premium icons are used when configured.

import { act } from "./core/actions.js";
import { button } from "./core/buttons.js";
import { copy } from "./core/copy.js";
import { TEMPLATE_ORDER, TEMPLATES } from "./render/templates.js";

export function inputRows(lang, premium) {
  const c = copy(lang).btn;
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  return [
    [b(c.summary, "summary", act("sum", "basic"), "primary"), b(c.quiz, "quiz", act("qc", "pick", "text"), "success")],
    [b(c.cards, "cards", act("cards")), b(c.key, "concepts", act("key"))],
    [b(c.explain, "explain", act("explain")), b(c.ask, "ask", act("ask"))],
    [b(c.newInput, "upload", act("new")), b(c.menu, "home", act("menu"))],
  ];
}

export function menuRows(lang, premium, { isAdmin = false } = {}) {
  const c = copy(lang).btn;
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const rows = [
    [b(c.ask, "ask", act("ask"), "primary")],
    [b(c.topic, "topic", act("topic"))],
    [b(c.help, "spark", act("help"))],
  ];
  if (isAdmin) rows.push([b(c.stats, "stats", act("stats"))]);
  rows.push([b(c.langAr, "lang", act("lang", "ar")), b(c.langEn, "lang", act("lang", "en"))]);
  return rows;
}

export function quizRows(qIndex, options, premium) {
  return options.map((opt, i) =>
    button({
      label: `${String.fromCharCode(65 + i)}.  ${opt}`,
      action: act("qa", String(qIndex), String(i)),
      premium,
    })
  ).map((b) => [b]);
}

export function nextRows(lang, premium, qIndex, isLast) {
  const c = copy(lang).btn;
  return [[button({ label: isLast ? c.results : c.next, icon: "next", action: act("qn", String(qIndex)), style: "primary", premium })]];
}

export function finishRows(lang, premium) {
  const c = copy(lang).btn;
  return [
    [button({ label: c.again, icon: "quiz", action: act("quiz", "5"), style: "primary", premium })],
    [button({ label: c.menu, icon: "home", action: act("menu"), premium })],
  ];
}

export function stylePickerRows(lang, premium, docLang = "en", outputFormat = "html") {
  const c = copy(lang).btn;
  const tiles = TEMPLATE_ORDER.map((id) =>
    button({ label: TEMPLATES[id].label[lang] || TEMPLATES[id].label.en, icon: TEMPLATES[id].icon, action: act("tpl", id), premium })
  );
  const rows = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  const langName = { en: "English", ar: "عربي", bilingual: lang === "ar" ? "الاتنين" : "Both" };
  rows.push(
    ["en", "ar", "bilingual"].map((code) =>
      button({ label: langName[code], icon: "lang", action: act("docl", code), style: docLang === code ? "primary" : null, premium })
    )
  );
  const fmt = ["html", "pdf", "pptx"].map((f) =>
    button({ label: f.toUpperCase(), icon: "file", action: act("fmt", f), style: outputFormat === f ? "primary" : null, premium })
  );
  rows.push(fmt);
  rows.push([button({ label: c.back, icon: "back", action: act("menu"), premium })]);
  return rows;
}

export function afterDocumentRows(lang, premium) {
  const c = copy(lang).btn;
  return [
    [button({ label: c.summary, icon: "summary", action: act("sum", "basic"), style: "primary", premium })],
    [button({ label: c.menu, icon: "home", action: act("menu"), premium })],
  ];
}
