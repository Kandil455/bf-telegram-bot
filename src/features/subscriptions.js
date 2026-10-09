// Subscription lifecycle messages: a heads-up before a plan ends, and a notice when it has
// ended. Each notice is sent once per subscription period. Pure decision logic here; the
// router sends the messages.

const DAY = 24 * 3600 * 1000;

/**
 * Users who need a notice now. `raw(userId)` returns the stored grant { plan, until } or null.
 * Returns [{ userId, kind: 'soon' | 'expired', until }].
 */
export function renewalNotices({ users, raw, store, now = Date.now(), soonMs = 3 * DAY }) {
  const out = [];
  for (const userId of users) {
    const grant = raw(userId);
    if (!grant || grant.plan === "free" || !grant.until) continue;
    const key = (kind) => `notice:${kind}:${userId}`;
    if (grant.until > now && grant.until - now <= soonMs) {
      if (store.get(key("soon")) !== grant.until) out.push({ userId, kind: "soon", until: grant.until });
    } else if (grant.until <= now) {
      if (store.get(key("expired")) !== grant.until) out.push({ userId, kind: "expired", until: grant.until });
    }
  }
  return out;
}

/** Records that a notice was sent, so the same period is never announced twice. */
export function markNotice(store, { userId, kind, until }) {
  store.set(`notice:${kind}:${userId}`, until, 90 * DAY);
}
