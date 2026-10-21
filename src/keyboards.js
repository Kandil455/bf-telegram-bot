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
  const podLabel = lang === "ar" ? "بودكاست المحاضرة" : "Lecture Podcast";
  const osceLabel = lang === "ar" ? "محطات OSCE عملية" : "OSCE Stations";
  return [
    [b(c.summary, "summary", act("sum", "basic"), "primary"), b(c.quiz, "quiz", act("qc", "pick", "text"), "success")],
    [b(c.explain, "explain", act("explain"), "primary"), b(osceLabel, "summary", act("tpl", "osce"), "success")],
    [b(podLabel, "spark", act("pod")), b(c.cards, "cards", act("cards"))],
    [b(c.key, "concepts", act("key")), b(c.ask, "ask", act("ask"))],
    [b(c.newInput, "upload", act("new")), b(c.menu, "home", act("menu"))],
  ];
}

export function menuRows(lang, premium, { isAdmin = false } = {}) {
  const c = copy(lang).btn;
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  const podLabel = ar ? "بودكاست المحاضرة" : "Lecture Podcast";
  // Main menu, grouped: core study tools first, then Q&A, account, admin, and language.
  const rows = [
    [b(c.summary, "summary", act("sum", "basic"), "primary"), b(c.quiz, "quiz", act("qc", "pick", "text"), "success")],
    [b(ar ? "🚨 كويزات الطوارئ (182 س)" : "🚨 Emergency Quizzes (182 Qs)", "quiz", act("em", "menu"), "danger"), b(ar ? "🦴 كويزات العظام (501 س)" : "🦴 Ortho Quizzes (501 Qs)", "quiz", act("ortho", "menu"), "primary")],
    [b(podLabel, "spark", act("pod")), b(c.explain, "explain", act("explain"))],
    [b(c.topic, "topic", act("topic")), b(c.ask, "ask", act("ask"))],
    [b(c.plans, "credits", act("plans"), "success"), b(c.deck, "cards", act("deck"))],
    [b(c.invite || "دعوة أصدقاء", "spark", act("inv")), b(c.help, "spark", act("help"))],
  ];
  if (isAdmin) rows.push([b(c.adminPanel, "stats", act("admin"), "primary")]);
  rows.push([b(c.langAr, "lang", act("lang", "ar")), b(c.langEn, "lang", act("lang", "en"))]);
  return rows;
}

/** Complete In-Bot Admin Control Panel — manage everything directly inside Telegram. */
export function adminRows(lang, premium) {
  const c = copy(lang).btn;
  const ar = lang === "ar";
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  return [
    [b(ar ? "إذاعة لكل المشتركين (Broadcast)" : "Broadcast to All Users", "spark", act("admin", "bcast"), "primary")],
    [b(ar ? "تفعيل Pro / شحن توكنز" : "Grant Pro / Add Tokens", "credits", act("admin", "grant"), "success"), b(ar ? "حظر / فك حظر" : "Ban / Unban User", "back", act("admin", "ban"), "danger")],
    [b(ar ? "تصفير استهلاك مستخدم" : "Reset User Quota", "clock", act("admin", "reset")), b(c.adminUsers, "topic", act("admin", "users"))],
    [b(c.stats, "stats", act("stats"), "primary"), b(c.adminPayments, "credits", act("admin", "pay"))],
    [b(ar ? "🚨 كويزات الطوارئ (182 س)" : "🚨 Emergency Quizzes (182 Qs)", "quiz", act("em", "menu"), "danger"), b(ar ? "🦴 كويزات العظام (501 س)" : "🦴 Ortho Quizzes (501 Qs)", "quiz", act("ortho", "menu"), "primary")],
    [b(ar ? "كويز الحروق (30 س)" : "Burns Quiz (30 Qs)", "quiz", act("admin", "burn")), b(c.adminAi, "spark", act("admin", "ai"))],
    [b(c.menu, "home", act("menu"))],
  ];
}

export function orthoMenuRows(lang, premium) {
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  return [
    [
      b(ar ? "🦴 كويز 1 (1 - 50)" : "🦴 Quiz 1 (1 - 50)", "quiz", act("ortho", "p", "1"), "primary"),
      b(ar ? "🦴 كويز 2 (51 - 100)" : "🦴 Quiz 2 (51 - 100)", "quiz", act("ortho", "p", "2"), "primary"),
    ],
    [
      b(ar ? "🦴 كويز 3 (101 - 150)" : "🦴 Quiz 3 (101 - 150)", "quiz", act("ortho", "p", "3")),
      b(ar ? "🦴 كويز 4 (151 - 200)" : "🦴 Quiz 4 (151 - 200)", "quiz", act("ortho", "p", "4")),
    ],
    [
      b(ar ? "🦴 كويز 5 (201 - 250)" : "🦴 Quiz 5 (201 - 250)", "quiz", act("ortho", "p", "5")),
      b(ar ? "🦴 كويز 6 (251 - 300)" : "🦴 Quiz 6 (251 - 300)", "quiz", act("ortho", "p", "6")),
    ],
    [
      b(ar ? "🦴 كويز 7 (301 - 350)" : "🦴 Quiz 7 (301 - 350)", "quiz", act("ortho", "p", "7")),
      b(ar ? "🦴 كويز 8 (351 - 400)" : "🦴 Quiz 8 (351 - 400)", "quiz", act("ortho", "p", "8")),
    ],
    [
      b(ar ? "🦴 كويز 9 (401 - 450)" : "🦴 Quiz 9 (401 - 450)", "quiz", act("ortho", "p", "9")),
      b(ar ? "🦴 كويز 10 (451 - 501)" : "🦴 Quiz 10 (451 - 501)", "quiz", act("ortho", "p", "10")),
    ],
    [
      b(ar ? "📥 تحميل بنك الأسئلة كامل HTML (501 سؤال)" : "📥 Download Full Bank HTML (501 Qs)", "file", act("ortho", "dl_all"), "success"),
    ],
    [b(ar ? "⬅️ القائمة الرئيسية" : "⬅️ Main Menu", "home", act("menu"))],
  ];
}

export function orthoQuizLaunchRows(partId, lang, premium) {
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  const pid = String(partId || 1);
  return [
    [
      b(ar ? "⏱️ استفتاءات تيليجرام بمؤقت (30 ثانية)" : "⏱️ Telegram Polls (30s Timer)", "clock", act("ortho", "start_p", pid, "30"), "primary"),
    ],
    [
      b(ar ? "⏱️ مؤقت 45 ثانية" : "⏱️ 45s Timer", "clock", act("ortho", "start_p", pid, "45")),
      b(ar ? "⏱️ مؤقت 60 ثانية" : "⏱️ 60s Timer", "clock", act("ortho", "start_p", pid, "60")),
    ],
    [
      b(ar ? "🎯 كويز تفاعلي بأزرار البوت (بدون مؤقت)" : "🎯 In-Bot Interactive Quiz (Untimed)", "quiz", act("ortho", "start_i", pid), "success"),
    ],
    [
      b(ar ? "📤 إرسال الـ 50 سؤال كاملة للشات" : "📤 Send All 50 Polls to Chat", "upload", act("ortho", "send_all", pid)),
      b(ar ? "📥 تحميل ملف الكويز HTML" : "📥 Download Quiz HTML", "file", act("ortho", "dl", pid)),
    ],
    [b(ar ? "⬅️ رجوع لكويزات العظام" : "⬅️ Back to Ortho Quizzes", "back", act("ortho", "menu"))],
  ];
}

export function emergencyMenuRows(lang, premium) {
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  return [
    [
      b(ar ? "🚨 كويز 1: امتحان الطوارئ الشامل (50 س)" : "🚨 Quiz 1: Core ER Exam (50 Qs)", "quiz", act("em", "p", "1"), "primary"),
    ],
    [
      b(ar ? "🫀 كويز 2: آلام الصدر واضطراب النبض (45 س)" : "🫀 Quiz 2: Chest Pain & Dysrhythmias (45 Qs)", "quiz", act("em", "p", "2"), "primary"),
    ],
    [
      b(ar ? "💥 كويز 3: الحوادث وإصابات التروما (43 س)" : "💥 Quiz 3: Trauma & Resuscitation (43 Qs)", "quiz", act("em", "p", "3")),
      b(ar ? "⚡ كويز 4: الصدمات والعناية الحرجة (27 س)" : "⚡ Quiz 4: Shock & Critical Care (27 Qs)", "quiz", act("em", "p", "4")),
    ],
    [
      b(ar ? "🩸 كويز 5: نزيف الجهاز الهضمي (17 س)" : "🩸 Quiz 5: GI Bleeding (17 Qs)", "quiz", act("em", "p", "5")),
      b(ar ? "🫁 كويز 6: الإنعاش المتقدم والقلب ALS (22 س)" : "🫁 Quiz 6: ALS & Resuscitation (22 Qs)", "quiz", act("em", "p", "6")),
    ],
    [
      b(ar ? "🩻 كويز 7: أشعة وحالات الطوارئ (10 س)" : "🩻 Quiz 7: ER Radiology Cases (10 Qs)", "quiz", act("em", "p", "7")),
    ],
    [
      b(ar ? "🫀 كويز 8: أساسيات وحالات الإنعاش BLS 1 (46 س)" : "🫀 Quiz 8: BLS Core & Scenarios (46 Qs)", "quiz", act("em", "p", "8")),
    ],
    [
      b(ar ? "⚡ كويز 9: تدريبات الإنعاش والصدمات BLS 2 (40 س)" : "⚡ Quiz 9: BLS MCQs & AED (40 Qs)", "quiz", act("em", "p", "9")),
    ],
    [
      b(ar ? "📥 تحميل بنك أسئلة الطوارئ كامل HTML (300 سؤال)" : "📥 Download Full ER Bank HTML (300 Qs)", "file", act("em", "dl_all"), "success"),
    ],
    [b(ar ? "⬅️ القائمة الرئيسية" : "⬅️ Main Menu", "home", act("menu"))],
  ];
}

export function emergencyCategoryRows(catId, lang, premium) {
  // If invoked, returns back to the single-level 5-quiz menu
  return emergencyMenuRows(lang, premium);
}

export function emergencyQuizLaunchRows(partId, lang, premium, count = 50) {
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  const pid = String(partId || 1);
  return [
    [
      b(ar ? "⏱️ استفتاءات تيليجرام بمؤقت (30 ثانية)" : "⏱️ Telegram Polls (30s Timer)", "clock", act("em", "start_p", pid, "30"), "primary"),
    ],
    [
      b(ar ? "⏱️ مؤقت 45 ثانية" : "⏱️ 45s Timer", "clock", act("em", "start_p", pid, "45")),
      b(ar ? "⏱️ مؤقت 60 ثانية" : "⏱️ 60s Timer", "clock", act("em", "start_p", pid, "60")),
    ],
    [
      b(ar ? "🎯 كويز تفاعلي بأزرار البوت (بدون مؤقت)" : "🎯 In-Bot Interactive Quiz (Untimed)", "quiz", act("em", "start_i", pid), "success"),
    ],
    [
      b(ar ? `📤 إرسال الـ ${count} سؤال كاملة للشات` : `📤 Send All ${count} Polls to Chat`, "upload", act("em", "send_all", pid)),
      b(ar ? "📥 تحميل ملف الكويز HTML" : "📥 Download Quiz HTML", "file", act("em", "dl", pid)),
    ],
    [b(ar ? "⬅️ رجوع لكويزات الطوارئ" : "⬅️ Back to ER Quizzes", "back", act("em", "menu"))],
  ];
}

export function burnsQuizRows(lang, premium) {
  const b = (label, icon, action, style) => button({ label, icon, action, style, premium });
  const ar = lang === "ar";
  return [
    [b(ar ? "بدء باستفتاءات تيليجرام (مؤقت 45 ثانية)" : "Telegram Polls (45s Timer)", "clock", act("admin", "burn_p", "45"), "primary")],
    [b(ar ? "مؤقت 60 ثانية" : "60s Timer", "clock", act("admin", "burn_p", "60")), b(ar ? "مؤقت 30 ثانية" : "30s Timer", "clock", act("admin", "burn_p", "30"))],
    [b(ar ? "كويز تفاعلي بأزرار البوت" : "In-Bot Interactive Quiz", "quiz", act("admin", "burn_i"), "success")],
    [b(ar ? "إرسال الـ 30 سؤال كاملة للشات" : "Send All 30 Polls to Chat", "upload", act("admin", "burn_all", "45"))],
    [b(ar ? "رجوع للوحة الأدمن" : "Back to Admin", "back", act("admin"))],
  ];
}

export function channelJoinRows(channelUrl, lang, premium) {
  const c = copy(lang).btn;
  return [
    [{ text: c.joinChannel, url: channelUrl }],
    [button({ label: c.checkSub, icon: "done", action: act("sub"), style: "success", premium })],
  ];
}

export function inviteRows(botUsername, userId, lang, premium) {
  const shareText = encodeURIComponent(lang === "ar" ? "بوت Black Fighters لتلخيص المحاضرات والكويزات الطبية بالذكاء الاصطناعي 🚀📚" : "Black Fighters Telegram AI Study Bot 🚀📚");
  const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=ref_${userId}&text=${shareText}`;
  return [
    [{ text: lang === "ar" ? "📤 مشاركة الرابط مع أصدقائك" : "📤 Share with friends", url: shareUrl }],
    [button({ label: copy(lang).btn.menu, icon: "home", action: act("menu"), premium })],
  ];
}

export function quizRows(qIndex, options, premium) {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const count = Math.min(letters.length, options.length);
  const btns = [];
  for (let i = 0; i < count; i++) {
    btns.push(
      button({
        label: letters[i],
        action: act("qa", String(qIndex), String(i)),
        premium,
      })
    );
  }
  const rows = [];
  for (let i = 0; i < btns.length; i += 2) {
    rows.push(btns.slice(i, i + 2));
  }
  return rows;
}

export function nextRows(lang, premium, qIndex, isLast) {
  const c = copy(lang).btn;
  return [[button({ label: isLast ? c.results : c.next, icon: "next", action: act("qn", String(qIndex)), style: "primary", premium })]];
}

export function finishRows(lang, premium, wrongCount = 0, remainingQuestions = 0, shareId = null) {
  const c = copy(lang).btn;
  const rows = [];
  if (remainingQuestions > 0) {
    const nextBatch = Math.min(50, remainingQuestions);
    rows.push([
      button({
        label: lang === "ar" ? `➕ الدفعة التالية (${nextBatch} سؤال متبقي من ${remainingQuestions})` : `➕ Next Batch (${nextBatch} Qs of ${remainingQuestions} left)`,
        icon: "quiz",
        action: act("qbatch"),
        style: "success",
        premium,
      }),
    ]);
  }
  if (wrongCount > 0) {
    rows.push([
      button({
        label: lang === "ar" ? `🔄 إعادة حل الأخطاء فقط (${wrongCount})` : `🔄 Retry Mistakes Only (${wrongCount})`,
        icon: "quiz",
        action: act("qretry"),
        style: "primary",
        premium,
      }),
    ]);
  }
  rows.push([
    button({
      label: lang === "ar" ? "🔗 مشاركة هذا الكويز مع أصدقائك" : "🔗 Share This Quiz with Friends",
      icon: "forward",
      action: act("qshare", shareId ? String(shareId) : ""),
      style: "primary",
      premium,
    }),
  ]);
  rows.push([button({ label: c.again, icon: "quiz", action: act("quiz", "5"), style: wrongCount > 0 || remainingQuestions > 0 ? null : "primary", premium })]);
  rows.push([button({ label: c.menu, icon: "home", action: act("menu"), premium })]);
  return rows;
}

export function stylePickerRows(lang, premium, docLang = "en", outputFormat = "html", detail = "standard", targetPages = null, suggested = null) {
  const c = copy(lang).btn;
  const ar = lang === "ar";
  const tiles = TEMPLATE_ORDER.map((id) =>
    button({ label: TEMPLATES[id].label[lang] || TEMPLATES[id].label.en, icon: TEMPLATES[id].icon, action: act("tpl", id), premium })
  );
  const rows = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  const langName = { en: "English", ar: "عربي", bilingual: ar ? "الاتنين (Bilingual Parts)" : "Both (Bilingual Parts)" };
  rows.push(
    ["en", "ar", "bilingual"].map((code) =>
      button({ label: langName[code], icon: "lang", action: act("docl", code), style: docLang === code ? "primary" : null, premium })
    )
  );
  const fmt = ["html", "pdf", "pptx"].map((f) =>
    button({ label: f.toUpperCase(), icon: "file", action: act("fmt", f), style: outputFormat === f ? "primary" : null, premium })
  );
  rows.push(fmt);
  // Length: shorter or more detailed. The choice is kept in the session and used by the next summary.
  const len = ["concise", "standard", "detailed"];
  const lenLabel = ar ? { concise: "أقصر", standard: "عادي", detailed: "أكتر تفصيل" } : { concise: "Shorter", standard: "Standard", detailed: "More detail" };
  rows.push(len.map((d) => button({ label: lenLabel[d], icon: "summary", action: act("len", d), style: detail === d && !targetPages ? "primary" : null, premium })));
  // Page count selector: suggested auto pages, presets, or custom typed page count
  const sugLabel = ar ? `مقترح (${suggested || 4} ص)` : `Suggested (${suggested || 4}p)`;
  rows.push([
    button({ label: sugLabel, icon: "file", action: act("pg", String(suggested || 4)), style: Number(targetPages) === Number(suggested) ? "primary" : null, premium }),
    button({ label: ar ? "4 صفحات" : "4 Pages", icon: "file", action: act("pg", "4"), style: Number(targetPages) === 4 ? "primary" : null, premium }),
    button({ label: ar ? "8 صفحات" : "8 Pages", icon: "file", action: act("pg", "8"), style: Number(targetPages) === 8 ? "primary" : null, premium }),
  ]);
  rows.push([
    button({ label: ar ? "اكتب عدد الصفحات بنفسك" : "Type Custom Page Count", icon: "summary", action: act("pg", "custom"), style: targetPages && ![4, 8, Number(suggested)].includes(Number(targetPages)) ? "primary" : null, premium }),
  ]);
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
