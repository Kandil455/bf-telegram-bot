// Renders a normalised document to one self-contained HTML file: white paper,
// print-ready, RTL/LTR aware, with Part-by-Part bilingual blocks (English Exam Focus +
// العربي الفهم والتفصيل), structured tables, and high-contrast yellow highlights (#fde047)
// with crisp black text (#000000). No external resources, so it works offline and prints to PDF.

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
:root{--ink:#0f172a;--mute:#475569;--line:#cbd5e1;--head:#f8fafc;--sig:#ea580c;--paper:#ffffff;--dark-pill:#1e293b}
*{box-sizing:border-box}
html,body{background:#f1f5f9;margin:0;padding:0;color:#0f172a}
body{font:15.5px/1.75 "Inter","IBM Plex Sans Arabic","Geeza Pro","Cairo",system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a}
.page{background:var(--paper);max-width:900px;margin:24px auto;padding:44px 52px 56px;border:1px solid var(--line);border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,.05)}
.doc-head{border-bottom:3px solid var(--dark-pill);padding-bottom:16px;margin-bottom:26px}
.kicker{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--sig);font-weight:800}
h1{font-size:28px;line-height:1.3;margin:6px 0 6px;letter-spacing:-.01em;color:#0f172a}
.sub{color:var(--mute);margin:0;font-size:15px}
.meta{color:var(--mute);font-size:12.5px;margin-top:8px;font-weight:600}
h2{font-size:19px;margin:32px 0 14px;padding:8px 16px;background:var(--dark-pill);color:#ffffff !important;border-radius:6px;letter-spacing:-.005em;font-weight:800;display:inline-block;min-width:60%}
h2 .en,h2 .ar,h2 span,h2 strong{color:#ffffff !important}
.part-block{margin:28px 0 34px;padding-bottom:18px;border-bottom:2px dashed #e2e8f0}
.part-block:last-of-type{border-bottom:0}
.part-title{font-size:19px;margin:0 0 16px;padding:8px 16px;background:#1e293b;color:#ffffff !important;border-radius:6px;font-weight:800;display:inline-block}
.part-title span,.part-title strong{color:#ffffff !important}
.lang-badge{display:inline-block;background:#1e293b;color:#ffffff !important;font-weight:800;font-size:13.5px;padding:4px 12px;border-radius:5px;margin:12px 0 10px}
.lang-wrap-ar{direction:rtl;text-align:right;margin-top:16px;padding-top:12px;border-top:1px solid #f1f5f9}
.lang-wrap-en{direction:ltr;text-align:left}
.en{display:block;color:#0f172a}.ar{display:block;color:#0f172a;font-size:1em;margin-top:3px}
strong,b{font-weight:800;color:inherit}
mark.hl,.hl{background-color:#fde047 !important;color:#000000 !important;font-weight:700;padding:1px 6px;border-radius:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.key{background-color:#bae6fd !important;color:#000000 !important;font-weight:700;padding:1px 6px;border-radius:4px}
ul.pts{margin:0 0 12px;padding:0;list-style:none}
ul.pts li{position:relative;padding:6px 0 6px 24px;margin:3px 0;border-bottom:1px dashed #e2e8f0;color:#0f172a}
[dir="rtl"] ul.pts li,.lang-wrap-ar ul.pts li{padding:6px 24px 6px 0}
ul.pts li::before{content:"";position:absolute;inset-inline-start:6px;top:15px;width:8px;height:8px;border-radius:50%;background:var(--sig)}
ul.pts li:last-child{border-bottom:0}
.def{border-inline-start:4px solid var(--sig);padding:10px 14px;margin:10px 0;background:#f8fafc;border-radius:6px;color:#0f172a}
.def dt{font-weight:800;color:#0f172a;font-size:15.5px}.def dd{margin:4px 0 0;color:#0f172a}.def em{color:#334155;display:block;margin-top:4px;font-style:italic}
.formula{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;border:1.5px solid #94a3b8;background:#f8fafc;border-radius:8px;padding:12px 16px;margin:12px 0;color:#0f172a}
.formula .flabel{font-weight:800;min-width:120px;color:#0f172a}
.formula code{font:700 15px/1.4 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;background:#fde047;color:#000000 !important;padding:4px 10px;border-radius:5px}
.formula small{color:#334155;width:100%;font-weight:500}
figure.tbl{margin:16px 0;overflow-x:auto}
figure.tbl figcaption{font-weight:800;margin-bottom:8px;color:#0f172a;font-size:15px}
table{width:100%;border-collapse:collapse;font-size:14.5px;background:#ffffff;color:#0f172a}
th,td{border:1px solid #cbd5e1;padding:9px 12px;vertical-align:top;text-align:start;color:#0f172a}
thead th{background:#1e293b;color:#ffffff !important;font-weight:800}
thead th .en,thead th .ar,thead th span,thead th strong{color:#ffffff !important}
thead th mark.hl{background-color:#fde047 !important;color:#000000 !important}
tbody tr:nth-child(even) td{background:#f8fafc}
ol.steps{counter-reset:s;list-style:none;padding:0;margin:10px 0}
ol.steps li{counter-increment:s;position:relative;padding:6px 0 6px 40px;margin:6px 0;color:#0f172a}
[dir="rtl"] ol.steps li,.lang-wrap-ar ol.steps li{padding:6px 40px 6px 0}
ol.steps li::before{content:counter(s);position:absolute;inset-inline-start:0;top:4px;width:28px;height:28px;border-radius:50%;background:var(--dark-pill);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.callout{border-radius:8px;padding:10px 14px;margin:12px 0;font-size:14.5px;border:1.5px solid}
.callout b{display:inline-block;margin-inline-end:6px;font-weight:800}
.tone-info{background:#eff6ff;border-color:#93c5fd;color:#1e3a8a}
.tone-tip{background:#ecfdf5;border-color:#6ee7b7;color:#065f46}
.tone-warn{background:#fefce8;border-color:#fde047;color:#713f12}
.tone-danger{background:#fef2f2;border-color:#fca5a5;color:#7f1d1d}
figure.diagram{margin:16px 0;text-align:center;break-inside:avoid}
figure.diagram svg{max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px}
figure.diagram figcaption{color:var(--mute);font-size:13px;margin-top:6px;font-weight:600}
.trap{background:#fef2f2;border:1.5px solid #fca5a5;border-inline-start:5px solid #dc2626;padding:10px 14px;border-radius:6px;margin:12px 0;font-size:14.5px;color:#7f1d1d}
.trap b{color:#991b1b;font-weight:800}
.qa{border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:10px 0;break-inside:avoid;background:#ffffff}
.qa .q{font-weight:800;color:#0f172a}.qa .a{margin-top:6px;color:#1e293b}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cornell .qa{display:grid;grid-template-columns:38% 1fr;gap:0;padding:0;overflow:hidden}
.cornell .qa .q{background:var(--head);padding:12px;border-inline-end:1px solid var(--line)}
.cornell .qa .a{padding:12px;margin:0}
.cram .def,.cram .formula,.cram .trap{break-inside:avoid}
.flow h2{counter-increment:phase;position:relative}
.flow h2::before{content:"Phase " counter(phase)" · ";color:#fde047;font-size:13px}
.flow{counter-reset:phase}
figure.fig{margin:16px 0;break-inside:avoid;text-align:center}
figure.fig img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
figure.fig figcaption{color:var(--mute);font-size:13px;margin-top:6px;font-weight:600}
footer.kw{margin-top:30px;border-top:1px solid var(--line);padding-top:12px}
footer.kw span{display:inline-block;margin:3px 6px 3px 0;padding:4px 11px;border:1px solid var(--line);border-radius:99px;font-size:12px;color:#334155;background:#f8fafc;font-weight:600}
.station{border:1px solid var(--line);border-radius:8px;padding:16px 18px;margin:18px 0;break-inside:avoid}
.station header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:10px}
.station .no{background:var(--dark-pill);color:#fff;font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px}
.station h3{font-size:17px;margin:0}.station .setting{color:var(--mute);margin:0;font-size:13px}
.scenario{background:var(--head);border-radius:6px;padding:10px 12px;margin:8px 0}
table.check td:nth-child(3),table.check th:nth-child(3){text-align:center;width:70px}
table.check tfoot td{font-weight:800;background:var(--head)}
.chips span{display:inline-block;margin:3px 6px 3px 0;padding:2px 9px;border-radius:99px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:600}
.errors{font-size:14px;color:#7f1d1d}
.brand{margin-top:28px;color:var(--mute);font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-align:center;font-weight:700}
@page{size:A4;margin:12mm}
@media print{html,body{background:#fff}.page{margin:0;border:0;max-width:none;padding:0 2mm;box-shadow:none}h2,.part-title{break-after:avoid}}
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

/** Inline markup on already-escaped text: **bold**, ==highlight==, ++key term++. */
function markup(escaped) {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.+?)==/g, '<mark class="hl">$1</mark>')
    .replace(/\+\+(.+?)\+\+/g, '<span class="key">$1</span>');
}

const TONE_LABEL = { info: ["Note", "ملاحظة"], tip: ["Tip", "نصيحة"], warn: ["Watch out", "انتبه"], danger: ["Danger", "خطر"] };

/** T(): a plain string, or a bilingual pair rendered cleanly. */
function T(value, tag = "span", side = null) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return `<${tag} dir="auto">${markup(esc(value))}</${tag}>`;
  if (side === "en") return `<${tag} class="en" dir="ltr">${markup(esc(value.en || value.ar || ""))}</${tag}>`;
  if (side === "ar") return `<${tag} class="ar" dir="rtl">${markup(esc(value.ar || value.en || ""))}</${tag}>`;
  if (value.en === value.ar) return `<${tag} dir="auto">${markup(esc(value.en))}</${tag}>`;
  return `<${tag} class="en" dir="ltr">${markup(esc(value.en))}</${tag}><${tag} class="ar" dir="rtl">${markup(esc(value.ar))}</${tag}>`;
}

function sectionHtml(s, ctx, side = null) {
  const { template, images } = ctx;
  const effLang = side || ctx.lang;
  switch (s.type) {
    case "heading":
      return `<h2>${T(s.text, "span", side)}</h2>`;
    case "points":
      return `<ul class="pts">${s.items.map((i) => `<li>${T(i, "span", side)}</li>`).join("")}</ul>`;
    case "definition":
      return `<dl class="def"><dt>${T(s.term, "span", side)}</dt><dd>${T(s.meaning, "span", side)}${s.example ? `<em>${esc(L("example", effLang))}: ${T(s.example, "span", side)}</em>` : ""}</dd></dl>`;
    case "formula":
      return `<div class="formula">${s.label ? `<span class="flabel">${T(s.label, "span", side)}</span>` : ""}<code dir="ltr">${esc(typeof s.expression === "string" ? s.expression : s.expression.en || s.expression.ar)}</code>${s.when ? `<small>${T(s.when, "span", side)}</small>` : ""}</div>`;
    case "table":
      return `<figure class="tbl">${s.caption ? `<figcaption>${T(s.caption, "span", side)}</figcaption>` : ""}<table><thead><tr>${s.headers.map((h) => `<th>${T(h, "span", side)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r) => `<tr>${r.map((c) => `<td>${T(c, "span", side)}</td>`).join("")}</tr>`).join("")}</tbody></table></figure>`;
    case "steps":
      return `<ol class="steps">${s.items.map((i) => `<li>${T(i, "span", side)}</li>`).join("")}</ol>`;
    case "qa":
      return `<div class="qa"><div class="q">${T(s.question, "span", side)}</div><div class="a">${T(s.answer, "span", side)}</div></div>`;
    case "trap":
      return `<aside class="trap"><b>⚠ ${esc(L("trap", effLang))}</b> ${T(s.text, "span", side)}</aside>`;
    case "callout": {
      const [en, ar] = TONE_LABEL[s.tone] || TONE_LABEL.info;
      const label = effLang === "ar" ? ar : effLang === "bilingual" ? `${en} · ${ar}` : en;
      return `<aside class="callout tone-${esc(s.tone)}"><b>${esc(label)}</b> ${T(s.text, "span", side)}</aside>`;
    }
    case "diagram":
      return `<figure class="diagram">${s.svg}${s.caption ? `<figcaption>${T(s.caption, "span", side)}</figcaption>` : ""}</figure>`;
    case "figure": {
      const img = images[s.index];
      if (!img) return "";
      return `<figure class="fig"><img src="data:${esc(img.mime)};base64,${img.b64}" alt="${esc(s.caption ? (typeof s.caption === "string" ? s.caption : s.caption.en) : "figure")}">${s.caption ? `<figcaption>${T(s.caption, "span", side)}</figcaption>` : ""}</figure>`;
    }
    default:
      return "";
  }
}

function renderRun(sections, ctx, side = null) {
  const out = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    if (ctx.template === "qa") out.push(`<div class="grid">${run.map((s) => sectionHtml(s, ctx, side)).join("")}</div>`);
    else out.push(run.map((s) => sectionHtml(s, ctx, side)).join(""));
    run = [];
  };
  for (const s of sections) {
    if (s.type === "qa") run.push(s);
    else {
      flush();
      out.push(sectionHtml(s, ctx, side));
    }
  }
  flush();
  return out.join("\n");
}

/**
 * In bilingual mode, groups the lecture into sequential Parts (each starting at a "heading")
 * and renders for every Part:
 *   1. Dark Part Banner (Part N: ...)
 *   2. English (Exam Focus): block (LTR)
 *   3. العربي (الفهم والتفصيل): block (RTL)
 * matching the exact layout of Burn and fluids.pdf.
 */
function bilingualPartsHtml(sections, ctx) {
  if (!sections?.length) return "";
  const parts = [];
  let current = { heading: null, items: [] };
  for (const s of sections) {
    if (s.type === "heading") {
      if (current.heading || current.items.length) parts.push(current);
      current = { heading: s, items: [] };
    } else {
      current.items.push(s);
    }
  }
  if (current.heading || current.items.length) parts.push(current);

  return parts.map((p, idx) => {
    const partNum = idx + 1;
    let headHtml = "";
    if (p.heading) {
      const rawEn = typeof p.heading.text === "string" ? p.heading.text : p.heading.text?.en || "";
      const hasPartPrefix = /^part\s*\d+/i.test(rawEn.trim());
      const prefix = hasPartPrefix ? "" : `Part ${partNum}: `;
      const hVal = typeof p.heading.text === "string"
        ? `${prefix}${p.heading.text}`
        : { en: `${prefix}${p.heading.text.en || ""}`, ar: p.heading.text.ar || "" };
      headHtml = `<h2 class="part-title">${T(hVal, "span")}</h2>`;
    } else if (parts.length > 1) {
      headHtml = `<h2 class="part-title"><span>Part ${partNum}</span></h2>`;
    }

    const mediaItems = p.items.filter((x) => x.type === "figure" || x.type === "diagram");
    const contentItems = p.items.filter((x) => x.type !== "figure" && x.type !== "diagram");

    const enBody = renderRun(contentItems, ctx, "en");
    const arBody = renderRun(contentItems, ctx, "ar");
    const mediaBody = mediaItems.length ? renderRun(mediaItems, ctx, null) : "";

    if (!contentItems.length) {
      return `<section class="part-block">${headHtml}${mediaBody}</section>`;
    }

    return `<section class="part-block">
${headHtml}
<div class="lang-wrap-en" dir="ltr">
<div class="lang-badge">English (Exam Focus):</div>
${enBody}
</div>
<div class="lang-wrap-ar" dir="rtl">
<div class="lang-badge">العربي (الفهم والتفصيل):</div>
${arBody}
</div>
${mediaBody}
</section>`;
  }).join("\n");
}

function bodyHtml(sections, ctx) {
  if (ctx.lang === "bilingual") {
    return bilingualPartsHtml(sections, ctx);
  }
  return renderRun(sections, ctx, null);
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
