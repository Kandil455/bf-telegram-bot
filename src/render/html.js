// Renders a normalised document to one self-contained HTML file: white paper,
// print-ready, RTL/LTR aware, with optional bilingual lines and embedded lecture images.
// No external resources, so the file works offline and prints cleanly to PDF.

import { esc } from "../core/text.js";

const TEMPLATE_LABEL = {
  cornell: { en: "Cornell notes", ar: "ملاحظات كورنيل" },
  cram: { en: "Exam cram sheet", ar: "ورقة مراجعة ليلة الامتحان" },
  table: { en: "Comparison tables", ar: "جداول المقارنة" },
  flow: { en: "Process and timeline", ar: "خطوات وتسلسل" },
  qa: { en: "Study cards", ar: "كروت مذاكرة" },
  osce: { en: "OSCE stations", ar: "محطات OSCE" },
};

const CSS = `
:root{--ink:#111;--mute:#5b5b5b;--line:#e4e4e7;--head:#f6f6f5;--sig:#e8462a;--paper:#fff}
*{box-sizing:border-box}
html,body{background:#f3f3f2;margin:0;padding:0}
body{font:15px/1.7 "Inter","IBM Plex Sans Arabic",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink)}
.page{background:var(--paper);max-width:860px;margin:24px auto;padding:44px 52px 56px;border:1px solid var(--line);border-radius:6px}
.doc-head{border-bottom:2px solid var(--ink);padding-bottom:14px;margin-bottom:24px}
.kicker{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--sig);font-weight:700}
h1{font-size:28px;line-height:1.25;margin:6px 0 4px;letter-spacing:-.01em}
.sub{color:var(--mute);margin:0}
.meta{color:var(--mute);font-size:12px;margin-top:6px}
h2{font-size:18px;margin:26px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
.en{display:block}.ar{display:block;color:var(--mute);font-size:.95em;margin-top:2px}
ul.pts{margin:0 0 6px;padding-inline-start:20px}ul.pts li{margin:3px 0}
.def{border-inline-start:3px solid var(--sig);padding:6px 12px;margin:10px 0;background:#fafafa;border-radius:4px}
.def dt{font-weight:700}.def dd{margin:2px 0 0}.def em{color:var(--mute);display:block;margin-top:2px}
.formula{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;border:1px solid var(--line);border-radius:6px;padding:10px 14px;margin:10px 0}
.formula .flabel{font-weight:600;min-width:120px}
.formula code{font:600 15px/1.4 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;background:var(--head);padding:4px 8px;border-radius:4px}
.formula small{color:var(--mute);width:100%}
figure.tbl{margin:14px 0}figure.tbl figcaption{font-weight:600;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{border:1px solid var(--line);padding:7px 9px;vertical-align:top;text-align:start}
thead th{background:var(--head);font-weight:700}
ol.steps{counter-reset:s;list-style:none;padding:0;margin:8px 0}
ol.steps li{counter-increment:s;position:relative;padding:6px 0 6px 40px;margin:4px 0}
ol.steps li::before{content:counter(s);position:absolute;inset-inline-start:0;top:4px;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:700;font-size:13px}
.hl{background:linear-gradient(transparent 55%,#fde68a 55%);padding:0 2px;border-radius:2px}
.key{color:#1d4ed8;font-weight:600}
.callout{border-radius:8px;padding:10px 14px;margin:12px 0;font-size:14px;border:1px solid}
.callout b{display:inline-block;margin-inline-end:6px}
.tone-info{background:#eff6ff;border-color:#bfdbfe;color:#1e3a8a}
.tone-tip{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
.tone-warn{background:#fffbeb;border-color:#fde68a;color:#92400e}
.tone-danger{background:#fef2f2;border-color:#fecaca;color:#991b1b}
figure.diagram{margin:16px 0;text-align:center;break-inside:avoid}
figure.diagram svg{max-width:100%;height:auto;background:#fff}
figure.diagram figcaption{color:var(--mute);font-size:13px;margin-top:6px}
.trap{background:#fff7ed;border:1px solid #fed7aa;border-inline-start:4px solid #ea580c;padding:8px 12px;border-radius:6px;margin:10px 0;font-size:14px}
.trap b{color:#9a3412}
.qa{border:1px solid var(--line);border-radius:6px;padding:10px 12px;margin:8px 0;break-inside:avoid}
.qa .q{font-weight:700}.qa .a{margin-top:4px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cornell .qa{display:grid;grid-template-columns:38% 1fr;gap:0;padding:0;overflow:hidden}
.cornell .qa .q{background:var(--head);padding:10px;border-inline-end:1px solid var(--line)}
.cornell .qa .a{padding:10px;margin:0}
.cram{columns:2;column-gap:28px}.cram h2{column-span:all}
.cram .def,.cram .formula,.cram .trap{break-inside:avoid}
.flow h2{counter-increment:phase;position:relative;padding-inline-start:0}
.flow h2::before{content:"Phase " counter(phase)" · ";color:var(--sig);font-size:13px}
.flow{counter-reset:phase}
figure.fig{margin:16px 0;break-inside:avoid;text-align:center}
figure.fig img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:6px}
figure.fig figcaption{color:var(--mute);font-size:13px;margin-top:6px}
footer.kw{margin-top:30px;border-top:1px solid var(--line);padding-top:12px}
footer.kw span{display:inline-block;margin:3px 6px 3px 0;padding:3px 10px;border:1px solid var(--line);border-radius:99px;font-size:12px;color:var(--mute)}
.station{border:1px solid var(--line);border-radius:8px;padding:16px 18px;margin:18px 0;break-inside:avoid}
.station header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:10px}
.station .no{background:var(--ink);color:#fff;font-size:12px;font-weight:700;padding:3px 9px;border-radius:99px}
.station h3{font-size:17px;margin:0}.station .setting{color:var(--mute);margin:0;font-size:13px}
.scenario{background:var(--head);border-radius:6px;padding:10px 12px;margin:8px 0}
table.check td:nth-child(3),table.check th:nth-child(3){text-align:center;width:70px}
table.check tfoot td{font-weight:700;background:var(--head)}
.chips span{display:inline-block;margin:3px 6px 3px 0;padding:2px 9px;border-radius:99px;background:#eef2ff;color:#3730a3;font-size:12px}
.errors{font-size:14px;color:#7f1d1d}
.brand{margin-top:28px;color:var(--mute);font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-align:center}
@page{size:A4;margin:14mm}
@media print{html,body{background:#fff}.page{margin:0;border:0;max-width:none;padding:0 4mm;box-shadow:none}h2{break-after:avoid}}
`;

const LABELS = {
  trap: ["Exam trap", "فخ امتحاني"],
  example: ["Example", "مثال"],
  station: ["Station", "المحطة"],
  scenario: ["Scenario", "السيناريو"],
  checklist: ["Checklist", "قائمة التقييم"],
  marks: ["Marks", "الدرجات"],
  total: ["Total", "المجموع"],
  keyPhrases: ["Key phrases", "عبارات مفتاحية"],
  commonErrors: ["Common errors", "أخطاء شائعة"],
};

/** A UI label in the document's language. Bilingual documents show both, joined. */
function L(key, lang) {
  const [en, ar] = LABELS[key];
  if (lang === "ar") return ar;
  if (lang === "bilingual") return `${en} · ${ar}`;
  return en;
}

/** T(): a plain string, or a bilingual pair rendered as two lines. */
/** Inline markup on already-escaped text: **bold**, ==highlight==, ++key term++. */
function markup(escaped) {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.+?)==/g, '<mark class="hl">$1</mark>')
    .replace(/\+\+(.+?)\+\+/g, '<span class="key">$1</span>');
}

const TONE_LABEL = { info: ["Note", "ملاحظة"], tip: ["Tip", "نصيحة"], warn: ["Watch out", "انتبه"], danger: ["Danger", "خطر"] };

function T(value, tag = "span") {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return `<${tag} dir="auto">${markup(esc(value))}</${tag}>`;
  if (value.en === value.ar) return `<${tag} dir="auto">${markup(esc(value.en))}</${tag}>`;
  return `<${tag} class="en" dir="ltr">${markup(esc(value.en))}</${tag}><${tag} class="ar" dir="rtl">${markup(esc(value.ar))}</${tag}>`;
}

function sectionHtml(s, ctx) {
  const { template, images } = ctx;
  switch (s.type) {
    case "heading":
      return `<h2>${T(s.text)}</h2>`;
    case "points":
      return `<ul class="pts">${s.items.map((i) => `<li>${T(i)}</li>`).join("")}</ul>`;
    case "definition":
      return `<dl class="def"><dt>${T(s.term)}</dt><dd>${T(s.meaning)}${s.example ? `<em>${esc(L("example", ctx.lang))}: ${T(s.example)}</em>` : ""}</dd></dl>`;
    case "formula":
      return `<div class="formula">${s.label ? `<span class="flabel">${T(s.label)}</span>` : ""}<code dir="ltr">${esc(typeof s.expression === "string" ? s.expression : s.expression.en)}</code>${s.when ? `<small>${T(s.when)}</small>` : ""}</div>`;
    case "table":
      return `<figure class="tbl">${s.caption ? `<figcaption>${T(s.caption)}</figcaption>` : ""}<table><thead><tr>${s.headers.map((h) => `<th>${T(h)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r) => `<tr>${r.map((c) => `<td>${T(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></figure>`;
    case "steps":
      return `<ol class="steps">${s.items.map((i) => `<li>${T(i)}</li>`).join("")}</ol>`;
    case "qa":
      if (template === "cornell") return `<div class="qa"><div class="q">${T(s.question)}</div><div class="a">${T(s.answer)}</div></div>`;
      return `<div class="qa"><div class="q">${T(s.question)}</div><div class="a">${T(s.answer)}</div></div>`;
    case "trap":
      return `<aside class="trap"><b>⚠ ${esc(L("trap", ctx.lang))}</b> ${T(s.text)}</aside>`;
    case "callout": {
      const [en, ar] = TONE_LABEL[s.tone] || TONE_LABEL.info;
      const label = ctx.lang === "ar" ? ar : ctx.lang === "bilingual" ? `${en} · ${ar}` : en;
      return `<aside class="callout tone-${esc(s.tone)}"><b>${esc(label)}</b> ${T(s.text)}</aside>`;
    }
    case "diagram":
      return `<figure class="diagram">${s.svg}${s.caption ? `<figcaption>${T(s.caption)}</figcaption>` : ""}</figure>`;
    case "figure": {
      const img = images[s.index];
      if (!img) return "";
      return `<figure class="fig"><img src="data:${esc(img.mime)};base64,${img.b64}" alt="${esc(s.caption ? (typeof s.caption === "string" ? s.caption : s.caption.en) : "figure")}">${s.caption ? `<figcaption>${T(s.caption)}</figcaption>` : ""}</figure>`;
    }
    default:
      return "";
  }
}

/** Groups runs of study cards into a grid, so the "qa" template reads like a card deck. */
function bodyHtml(sections, ctx) {
  const out = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    if (ctx.template === "qa") out.push(`<div class="grid">${run.map((s) => sectionHtml(s, ctx)).join("")}</div>`);
    else out.push(run.map((s) => sectionHtml(s, ctx)).join(""));
    run = [];
  };
  for (const s of sections) {
    if (s.type === "qa") run.push(s);
    else {
      flush();
      out.push(sectionHtml(s, ctx));
    }
  }
  flush();
  return out.join("\n");
}

function shell({ lang, title, subtitle, template, body, keywords, dateLabel }) {
  const label = TEMPLATE_LABEL[template] || TEMPLATE_LABEL.cram;
  const kicker = lang === "ar" ? label.ar : lang === "bilingual" ? `${label.en} · ${label.ar}` : label.en;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const htmlLang = lang === "ar" ? "ar" : "en";
  const kw = keywords?.length ? `<footer class="kw">${keywords.map((k) => `<span dir="auto">${esc(typeof k === "string" ? k : k.en || k.ar)}</span>`).join("")}</footer>` : "";
  return `<!doctype html>
<html lang="${htmlLang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(typeof title === "string" ? title : title.en || title.ar)}</title>
<style>${CSS}</style>
</head>
<body>
<main class="page tpl-${esc(template)} ${template}">
<header class="doc-head">
<div class="kicker">${esc(kicker)}</div>
<h1>${T(title, "span")}</h1>
${subtitle ? `<p class="sub">${T(subtitle, "span")}</p>` : ""}
<div class="meta">${esc(dateLabel)}</div>
</header>
${body}
${kw}
<p class="brand">Black Fighters</p>
</main>
</body>
</html>`;
}

/** Renders a document (any template except OSCE). */
export function renderDocument({ doc, lang = "en", template = "cram", images = [], dateLabel = "" }) {
  const body = bodyHtml(doc.sections, { template, images, lang });
  return shell({ lang, title: doc.title, subtitle: doc.subtitle, template, body, keywords: doc.keywords, dateLabel });
}

/** Renders OSCE stations: scenario, tasks, a marked checklist, key phrases and common errors. */
export function renderOsce({ osce, lang = "en", dateLabel = "" }) {
  const stations = osce.stations.map((s, i) => {
    const total = s.checklist.reduce((n, c) => n + c.marks, 0);
    return `<section class="station">
<header><span class="no">${esc(L("station", lang))} ${i + 1}</span><h3>${T(s.title)}</h3>${s.setting ? `<p class="setting">${T(s.setting)}</p>` : ""}</header>
<div class="scenario"><b>${esc(L("scenario", lang))}.</b> ${T(s.scenario)}</div>
${s.tasks.length ? `<ol class="steps">${s.tasks.map((t) => `<li>${T(t)}</li>`).join("")}</ol>` : ""}
<table class="check"><thead><tr><th>#</th><th>${esc(L("checklist", lang))}</th><th>${esc(L("marks", lang))}</th></tr></thead>
<tbody>${s.checklist.map((c, j) => `<tr><td>${j + 1}</td><td>${T(c.item)}</td><td>${c.marks}</td></tr>`).join("")}</tbody>
<tfoot><tr><td></td><td>${esc(L("total", lang))}</td><td>${total}</td></tr></tfoot></table>
${s.key_phrases.length ? `<p class="chips"><b>${esc(L("keyPhrases", lang))}:</b> ${s.key_phrases.map((p) => `<span>${T(p)}</span>`).join("")}</p>` : ""}
${s.common_errors.length ? `<div class="errors"><b>${esc(L("commonErrors", lang))}:</b><ul class="pts">${s.common_errors.map((e) => `<li>${T(e)}</li>`).join("")}</ul></div>` : ""}
</section>`;
  }).join("\n");
  return shell({ lang, title: osce.title, subtitle: null, template: "osce", body: stations, keywords: [], dateLabel });
}

/** Short plain-text preview for the chat message: title plus the first few lines. */
export function previewLines(doc, lang = "en", max = 4) {
  const pick = (v) => (typeof v === "string" ? v : lang === "ar" ? v.ar || v.en : v.en || v.ar);
  const out = [];
  for (const s of doc.sections) {
    if (out.length >= max) break;
    if (s.type === "points") out.push(pick(s.items[0]));
    else if (s.type === "definition") out.push(`${pick(s.term)}: ${pick(s.meaning)}`);
    else if (s.type === "qa") out.push(pick(s.question));
    else if (s.type === "steps") out.push(pick(s.items[0]));
    else if (s.type === "heading") out.push(pick(s.text));
  }
  return out.filter(Boolean).map((l) => l.slice(0, 140));
}
