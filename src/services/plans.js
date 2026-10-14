// Plans and entitlements. Paid with Telegram Stars (XTR) or Fawry / Vodafone Cash.
// A plan grants a daily task allowance, daily AI token budget, figure limits and
// extras. Grants live in the store and expire on their own.

const DAY = 24 * 3600 * 1000;

export const PLANS = Object.freeze({
  free: {
    id: "free",
    name: { en: "Free", ar: "المجاني" },
    dailyTasks: null,
    dailyTokens: 50_000,
    bonusTokens: 0,
    figures: 2,
    stars: 0,
    egp: 0,
    days: 0,
    features: {
      en: ["10 tasks / 50,000 tokens a day", "2 figures per material", "Reminders and groups"],
      ar: ["10 مهام / 50,000 توكن يومياً", "صورتين لكل مادة", "تذكيرات وجروبات"],
    },
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ar: "برو" },
    dailyTasks: null,
    dailyTokens: 1_000_000,
    bonusTokens: 500_000,
    figures: 6,
    stars: 150,
    egp: 100,
    days: 30,
    features: {
      en: ["120 tasks / 1,000,000 tokens a day", "+500,000 wallet tokens", "6 figures per material", "OSCE and bilingual documents", "Priority DeepSeek & Gemini queue"],
      ar: ["120 مهمة / 1,000,000 توكن يومياً", "+500,000 توكن إضافي بالمحفظة", "6 صور لكل مادة", "محطات OSCE والملفات الثنائية", "أولوية قصوى على DeepSeek و Gemini"],
    },
  },
});

/** Task allowance per plan, overridable from the environment. */
export function planLimits(cfg) {
  return { free: cfg.freeDailyTasks || 10, pro: cfg.proDailyTasks || 120 };
}

export function planTokenLimits(cfg) {
  return { free: cfg.freeDailyTokens || 50_000, pro: cfg.proDailyTokens || 1_000_000 };
}

export function createPlans({ store, cfg = {}, now = () => Date.now() }) {
  const limits = planLimits(cfg);
  const tokenLimits = planTokenLimits(cfg);
  if (cfg.proStars) PLANS.pro.stars = cfg.proStars;
  if (cfg.proEgp) PLANS.pro.egp = cfg.proEgp;

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
