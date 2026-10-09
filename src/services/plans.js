// Plans and entitlements. Paid with Telegram Stars (XTR), so no external payment
// provider is needed. A plan grants a daily task allowance, figure limits and
// extras. Grants live in the store and expire on their own.

const DAY = 24 * 3600 * 1000;

export const PLANS = Object.freeze({
  free: { id: "free", name: { en: "Free", ar: "المجاني" }, dailyTasks: null, figures: 2, stars: 0, egp: 0, days: 0, features: { en: ["10 tasks a day", "2 figures per material", "Reminders and groups"], ar: ["10 مهام في اليوم", "صورتين لكل مادة", "تذكيرات وجروبات"] } },
  pro: { id: "pro", name: { en: "Pro", ar: "برو" }, dailyTasks: null, figures: 6, stars: 150, egp: 100, days: 30, features: { en: ["120 tasks a day", "6 figures per material", "OSCE and bilingual documents", "Priority queue"], ar: ["120 مهمة في اليوم", "6 صور لكل مادة", "محطات OSCE والملفات الثنائية", "أولوية في الطابور"] } },
});

/** Task allowance per plan, overridable from the environment. */
export function planLimits(cfg) {
  return { free: cfg.freeDailyTasks, pro: cfg.proDailyTasks || 120 };
}

export function createPlans({ store, cfg, now = () => Date.now() }) {
  const limits = planLimits(cfg);
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
    grant(userId, planId, days = PLANS[planId]?.days || 30) {
      if (!PLANS[planId]) throw new Error(`unknown plan: ${planId}`);
      const base = Math.max(now(), store.get(grantKey(userId))?.until || 0);
      const until = base + days * DAY;
      store.set(grantKey(userId), { plan: planId, until }, until - now() + 30 * DAY);
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
