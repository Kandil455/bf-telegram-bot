// Language detection: Arabic script wins only when it is the majority.

export function detectLang(text = "") {
  const s = String(text || "");
  const arabic = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  if (arabic === 0 && latin === 0) return null;
  return arabic > latin ? "ar" : "en";
}

/** Explicit choice wins, then the language of the user's last text, then English. */
export function pickLang(session = {}, text = "") {
  if (session.lang === "ar" || session.lang === "en") return session.lang;
  return detectLang(text) || (session.detectedLang === "ar" ? "ar" : "en");
}
