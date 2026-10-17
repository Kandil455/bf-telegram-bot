// Plans and entitlements. Paid with Telegram Stars (XTR) or Fawry / Vodafone Cash / InstaPay.
// A plan grants a daily task allowance, daily AI token budget, figure limits and
// extras. Grants live in the store and expire on their own.

const DAY = 24 * 3600 * 1000;

export const PLANS = Object.freeze({
  free: {
    id: "free",
    name: { en: "Free", ar: "الباقة المجانية" },
    dailyTasks: null,
    dailyTokens: 35_000,
    bonusTokens: 0,
    figures: 2,
    stars: 0,
    egp: 0,
    days: 0,
    features: {
      en: ["2 files & 6 tasks / day (35,000 tokens)", "Up to 30 quiz questions per file", "2 figures per material", "Flashcard reminders & group quizzes"],
      ar: ["ملفان و6 مهام يومياً (35,000 توكن)", "حتى 30 سؤال كويز لكل ملف", "صورتان لكل محاضرة", "تذكيرات المراجعة وكويزات الجروبات"],
    },
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ar: "باقة Pro" },
    dailyTasks: null,
    dailyTokens: 250_000,
    bonusTokens: 150_000,
    figures: 6,
    stars: 100,
    egp: 75,
    days: 30,
    features: {
      en: ["8 files & 40 tasks / day (250,000 tokens)", "+150,000 bonus wallet tokens", "Up to 100 quiz questions per file", "6 figures, OSCE stations & PDF/PPTX export", "Priority AI speed (Gemini & DeepSeek)"],
      ar: ["8 ملفات و40 مهمة يومياً (250,000 توكن)", "+150,000 توكن إضافي هدية بالمحفظة", "حتى 100 سؤال كويز لكل ملف", "6 صور ومحطات OSCE وتصدير PDF/PPTX", "أولوية سرعة قصوى على Gemini و DeepSeek"],
    },
  },
});

/** Task allowance per plan, overridable from the environment. */
export function planLimits(cfg) {
  return { free: cfg.freeDailyTasks || 6, pro: cfg.proDailyTasks || 40 };
}

export function planTokenLimits(cfg) {
  return { free: cfg.freeDailyTokens || 35_000, pro: cfg.proDailyTokens || 250_000 };
}

export function createPlans({ store, cfg = {}, now = () => Date.now() }) {
  const limits = planLimits(cfg);
  const tokenLimits = planTokenLimits(cfg);
  if (cfg.proStars) PLANS.pro.stars = cfg.proStars;
  if (cfg.proEgp) PLANS.pro.egp = cfg.proEgp;
  const freeFiles = cfg.freeFilesPerDay || 2;
  const proFiles = cfg.proFilesPerDay || 8;
  const maxQ = cfg.maxQuestionsPerFile || 100;

  PLANS.free.features.en = [
    `${freeFiles} files & ${limits.free} tasks / day (${tokenLimits.free.toLocaleString("en-US")} tokens)`,
    "2 figures per material",
    "Flashcard reminders & group quizzes",
  ];
  PLANS.free.features.ar = [
    `${freeFiles} ملفات و${limits.free} مهام يومياً (${tokenLimits.free.toLocaleString("en-US")} توكن)`,
    "صورتان لكل محاضرة",
    "تذكيرات المراجعة وكويزات الجروبات",
  ];
  PLANS.pro.features.en = [
    `${proFiles} files & ${limits.pro} tasks / day (${tokenLimits.pro.toLocaleString("en-US")} tokens)`,
    `+${(PLANS.pro.bonusTokens || 150_000).toLocaleString("en-US")} bonus wallet tokens`,
    `Up to ${maxQ} quiz questions per file`,
    "6 figures, OSCE stations & PDF/PPTX export",
    "Priority AI speed (Gemini & DeepSeek)",
  ];
  PLANS.pro.features.ar = [
    `${proFiles} ملفات و${limits.pro} مهمة يومياً (${tokenLimits.pro.toLocaleString("en-US")} توكن)`,
    `+${(PLANS.pro.bonusTokens || 150_000).toLocaleString("en-US")} توكن إضافي هدية بالمحفظة`,
    `حتى ${maxQ} سؤال كويز لكل ملف`,
    "6 صور ومحطات OSCE وتصدير PDF/PPTX",
    "أولوية سرعة قصوى على Gemini و DeepSeek",
  ];

  const grantKey = (userId) => `plan:${userId}`;

  return {
    /** Active plan id for a user. Admins are treated as unlimited, handled by quota. */
    active(userId) {
      const g = store.get(grantKey(userId));
      return g && g.until > now() ? g.plan : "free";
    },
    limitFor(userId) {
      return limits[this.active(userId)] ?? limits.free;
    },
    tokenLimitFor(userId) {
      return tokenLimits[this.active(userId)] ?? tokenLimits.free;
    },
    grant(userId, planId, days = PLANS[planId]?.days || 30) {
      if (!PLANS[planId]) throw new Error(`unknown plan: ${planId}`);
      const base = Math.max(now(), store.get(grantKey(userId))?.until || 0);
      const until = base + days * DAY;
      store.set(grantKey(userId), { plan: planId, until }, until - now() + 30 * DAY);
      const bonus = PLANS[planId]?.bonusTokens || 0;
      if (bonus > 0) {
        const walletKey = `tok_wallet:${userId}`;
        const cur = Number(store.get(walletKey) || 0);
        store.set(walletKey, cur + bonus);
      }
      return { plan: planId, until };
    },
    figuresFor(userId) {
      return PLANS[this.active(userId)]?.figures ?? PLANS.free.figures;
    },
    revoke(userId) {
      store.del(grantKey(userId));
    },
    raw(userId) {
      return store.get(grantKey(userId)) || null;
    },
    details(userId) {
      const g = store.get(grantKey(userId));
      return g && g.until > now() ? g : null;
    },
  };
}
