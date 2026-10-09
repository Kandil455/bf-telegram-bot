// Daily task quota per Telegram user. `limit` is a number or a function of userId,
// so each plan can carry its own allowance. Admins are unlimited.

export function createQuota({ store, limit, admins = new Set(), exempt = admins, now = () => Date.now() }) {
  const limitOf = typeof limit === "function" ? limit : () => limit;
  const unlimited = (userId) => exempt.has(Number(userId));
  const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
  const msToMidnight = (t) => {
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - t;
  };
  const keyFor = (userId, t = now()) => `q:${userId}:${dayKey(t)}`;
  const isAdmin = (userId) => admins.has(Number(userId));

  return {
    isAdmin,
    isExempt: unlimited,
    limitFor: (userId) => limitOf(userId),

    /** Reserves `cost` tasks. Returns { ok, left, limit, resetMs }. */
    consume(userId, cost = 1) {
      const t = now();
      const lim = limitOf(userId);
      if (unlimited(userId)) return { ok: true, left: Infinity, limit: Infinity, resetMs: 0, unlimited: true };
      const key = keyFor(userId, t);
      const used = store.get(key) || 0;
      if (used + cost > lim) return { ok: false, left: Math.max(0, lim - used), limit: lim, resetMs: msToMidnight(t) };
      store.set(key, used + cost, msToMidnight(t) + 60_000);
      return { ok: true, left: lim - used - cost, limit: lim, resetMs: msToMidnight(t) };
    },

    refund(userId, cost = 1) {
      if (unlimited(userId)) return;
      const key = keyFor(userId);
      const used = store.get(key) || 0;
      store.set(key, Math.max(0, used - cost), msToMidnight(now()) + 60_000);
    },

    status(userId) {
      if (unlimited(userId)) return { left: Infinity, limit: Infinity, unlimited: true, resetMs: 0 };
      const lim = limitOf(userId);
      const used = store.get(keyFor(userId)) || 0;
      return { left: Math.max(0, lim - used), limit: lim, resetMs: msToMidnight(now()) };
    },
  };
}

/** "3 hours" / "42 minutes" for a reset countdown. */
export function humanize(ms, copy) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes >= 60) return copy.hour(Math.round(minutes / 60));
  return copy.minutes(minutes);
}
