// The single list of bot commands. setup.js publishes it to Telegram, and the router must
// handle every name here (test/commands.test.js checks that). Aliases are handled by the
// router but are not published, so the menu stays short.

export const PRIVATE_COMMANDS = Object.freeze([
  { name: "start", en: "Open the main menu", ar: "افتح القائمة الرئيسية" },
  { name: "quiz", en: "Quiz on a topic: /quiz supply and demand", ar: "كويز على موضوع: /quiz العرض والطلب" },
  { name: "summary", en: "Summarise your last file or text", ar: "لخّص آخر ملف أو نص بعته" },
  { name: "cards", en: "Make flashcards from your material", ar: "اعمل فلاش كاردز من المادة" },
  { name: "ask", en: "Ask a question about your material", ar: "اسأل سؤال عن المادة" },
  { name: "review", en: "Review the flashcards that are due", ar: "راجع الكروت المستحقة" },
  { name: "deck", en: "See your flashcard deck", ar: "شوف مجموعة الفلاش كاردز" },
  { name: "remind", en: "Daily reminder hour: /remind 20", ar: "ساعة التذكير: /remind 20" },
  { name: "quota", en: "Today's remaining tasks", ar: "المهام المتبقية النهارده" },
  { name: "plans", en: "Plans and how to pay", ar: "الباقات وطرق الدفع" },
  { name: "new", en: "Clear the current file", ar: "امسح الملف الحالي" },
  { name: "lang", en: "Language: /lang en or /lang ar", ar: "اللغة: /lang ar أو /lang en" },
  { name: "help", en: "How to use the bot", ar: "إزاي تستخدم البوت" },
]);

export const GROUP_COMMANDS = Object.freeze([
  { name: "quiz", en: "Start a group quiz on a topic", ar: "ابدأ كويز جروب على موضوع" },
  { name: "leaderboard", en: "Show the group's scores", ar: "اعرض نقط الجروب" },
  { name: "stop", en: "Stop the running group quiz", ar: "أوقف كويز الجروب" },
]);

/** Aliases the router also accepts (not published). */
export const ALIASES = Object.freeze({ menu: "start", upgrade: "plans", pay: "plans", credits: "quota", stats: "stats", txid: "txid" });

export function commandsFor(scope, lang) {
  const list = scope === "group" ? GROUP_COMMANDS : PRIVATE_COMMANDS;
  return list.map((c) => ({ command: c.name, description: c[lang === "ar" ? "ar" : "en"].slice(0, 256) }));
}
