// Daily task quota and exact AI token accounting per Telegram user.
// `limit` and `tokenLimit` can be numbers or functions of userId, so each plan carries
// its own task and token allowance. Admins are unlimited unless enforceLimitsForAdmins is on.

export function createQuota({
  store,
  limit,
  tokenLimit = 50_000,
  admins = new Set(),
  exempt = admins,
  now = () => Date.now(),
}) {
  const limitOf = typeof limit === "function" ? limit : () => limit;
  const tokenLimitOf = typeof tokenLimit === "function" ? tokenLimit : () => tokenLimit;
  const unlimited = (userId) => exempt.has(Number(userId));
  const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
  const msToMidnight = (t) => {
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - t;
  };
  const keyFor = (userId, t = now()) => `q:${userId}:${dayKey(t)}`;
  const tokKeyFor = (userId, t = now()) => `tok:${userId}:${dayKey(t)}`;
  const walletKeyFor = (userId) => `tok_wallet:${userId}`;
  const totalTokKeyFor = (userId) => `tok_total:${userId}`;
  const isAdmin = (userId) => admins.has(Number(userId));

  return {
    isAdmin,
    isExempt: unlimited,
    limitFor: (userId) => limitOf(userId),
    tokenLimitFor: (userId) => tokenLimitOf(userId),

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
      const tok = this.tokenStatus(userId);
      if (unlimited(userId)) {
        return { left: Infinity, limit: Infinity, unlimited: true, resetMs: 0, tokens: tok };
      }
      const lim = limitOf(userId);
      const used = store.get(keyFor(userId)) || 0;
      return { left: Math.max(0, lim - used), limit: lim, resetMs: msToMidnight(now()), tokens: tok };
    },

    /** Exact token accounting: deducts actual prompt + completion tokens used by AI calls. */
    consumeTokens(userId, tokens = 0) {
      const count = Math.max(0, Math.round(Number(tokens) || 0));
      const t = now();
      const day = dayKey(t);
      const ttl = msToMidnight(t) + 60_000;
      const tokKey = tokKeyFor(userId, t);
      const usedToday = Number(store.get(tokKey) || 0);
      const totalUsed = Number(store.get(totalTokKeyFor(userId)) || 0);

      if (count > 0) {
        store.set(tokKey, usedToday + count, ttl);
        store.set(totalTokKeyFor(userId), totalUsed + count);
        store.incr(`stat:tokens:${day}`, count, 3 * 24 * 3600 * 1000);
      }

      if (unlimited(userId)) {
        return {
          ok: true,
          deducted: count,
          used: usedToday + count,
          left: Infinity,
          limit: Infinity,
          wallet: Number(store.get(walletKeyFor(userId)) || 0),
          totalUsed: totalUsed + count,
          unlimited: true,
        };
      }

      const lim = tokenLimitOf(userId);
      const wallet = Number(store.get(walletKeyFor(userId)) || 0);
      const dailyBefore = Math.max(0, lim - usedToday);
      const fromDaily = Math.min(dailyBefore, count);
      const overflow = Math.max(0, count - fromDaily);
      const newWallet = Math.max(0, wallet - overflow);
      if (overflow > 0 && wallet > 0) {
        store.set(walletKeyFor(userId), newWallet);
      }
      const dailyAfter = Math.max(0, lim - (usedToday + count));
      return {
        ok: dailyBefore + wallet >= count,
        deducted: count,
        used: usedToday + count,
        left: dailyAfter + newWallet,
        limit: lim,
        wallet: newWallet,
        totalUsed: totalUsed + count,
        unlimited: false,
      };
    },

    /** Adds purchased or bonus tokens to the user's persistent wallet. */
    addTokens(userId, amount = 0) {
      const add = Math.max(0, Math.round(Number(amount) || 0));
      const current = Number(store.get(walletKeyFor(userId)) || 0);
      const next = current + add;
      store.set(walletKeyFor(userId), next);
      return next;
    },

    /** Current token balance, daily usage, wallet balance, and lifetime usage. */
    tokenStatus(userId) {
      const t = now();
      const used = Number(store.get(tokKeyFor(userId, t)) || 0);
      const wallet = Number(store.get(walletKeyFor(userId)) || 0);
      const totalUsed = Number(store.get(totalTokKeyFor(userId)) || 0);
      if (unlimited(userId)) {
        return { used, left: Infinity, limit: Infinity, wallet, totalUsed, unlimited: true, resetMs: 0 };
      }
      const lim = tokenLimitOf(userId);
      const dailyLeft = Math.max(0, lim - used);
      return {
        used,
        left: dailyLeft + wallet,
        dailyLeft,
        limit: lim,
        wallet,
        totalUsed,
        unlimited: false,
        resetMs: msToMidnight(t),
      };
    },
  };
}

/** "3 hours" / "42 minutes" for a reset countdown. */
export function humanize(ms, copy) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes >= 60) return copy.hour(Math.round(minutes / 60));
  return copy.minutes(minutes);
}
