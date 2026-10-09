// First-pass intent detection. Fast and free. The AI is only asked when this says "chat".

const RULES = [
  ["summary", /\b(summar\w*|tl;?dr|key takeaways?)\b|تلخيص|لخّص|لخص|ملخص/i],
  ["quiz", /\b(quiz|mcq|test me|exam me|question me)\b|كويز|امتحن|اختبرني|اسألني|اسالني/i],
  ["cards", /\b(flash ?cards?|cards?|revision)\b|فلاش|بطاقات|كروت/i],
  ["explain", /^(explain|what is|what are|define|simplify)\b|اشرح|شرح|ايه هو|إيه هو|ايه هي|إيه هي/i],
  ["stats", /\b(progress|stats?|streak|level)\b|تقدمي|احصائيات|إحصائيات|مستواي/i],
  ["credits", /\b(credits?|balance|quota|left today)\b|رصيد|كريدت|باقي/i],
  ["thanks", /^(thanks?|thank you|thx|ty)\b|^شكرا|^شكراً|^متشكر/i],
  ["greeting", /^(hi|hello|hey|yo)\b|^(السلام|سلام|اهلا|أهلا|هاي|مرحبا|ازيك|إزيك)/i],
  ["help", /\b(help|menu|commands?|what can you do)\b|مساعدة|القائمة|تقدر تعمل/i],
];

export function detectIntent(text = "") {
  const s = String(text || "").trim();
  if (!s) return "empty";
  for (const [intent, re] of RULES) if (re.test(s)) return intent;
  return "chat";
}
