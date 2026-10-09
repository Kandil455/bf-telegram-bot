// Flashcard reminders: a per-user deck, SM-2 style scheduling, due-card lookup and a
// reminder tick that messages users once a day at the hour they chose.

const DAY = 24 * 3600 * 1000;
const MIN = 60 * 1000;
export const GRADES = Object.freeze({ again: 0, hard: 1, good: 2, easy: 3 });

/** Scheduling. Returns the card with its new ease, repetition count, interval and due time. */
export function review(card, grade, now = Date.now()) {
  let { ef = 2.5, rep = 0, interval = 0 } = card;
  if (grade === GRADES.again) {
    rep = 0;
    interval = 0;
    ef = Math.max(1.3, ef - 0.2);
    return { ...card, ef, rep, interval, due: now + 10 * MIN };
  }
  const q = grade === GRADES.hard ? 3 : grade === GRADES.easy ? 5 : 4;
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  rep += 1;
  interval = rep === 1 ? 1 : rep === 2 ? 6 : Math.round(interval * ef);
  if (grade === GRADES.hard) interval = Math.max(1, Math.round(interval * 0.8));
  if (grade === GRADES.easy) interval = Math.round(interval * 1.3);
  return { ...card, ef: Number(ef.toFixed(3)), rep, interval, due: now + interval * DAY };
}

export function createDecks({ store, now = () => Date.now(), maxCards = 500 }) {
  const key = (userId) => `deck:${userId}`;
  const reminderKey = (userId) => `remind:${userId}`;
  let seq = 0;
  const newId = () => `${now().toString(36)}${(seq++).toString(36)}`.slice(-8);

  return {
    list(userId) {
      return store.get(key(userId)) || [];
    },
    add(userId, pairs) {
      const deck = this.list(userId);
      for (const p of pairs) {
        if (deck.some((c) => c.q === p.q)) continue;
        deck.push({ id: newId(), q: p.q, a: p.a, ef: 2.5, rep: 0, interval: 0, due: now() });
      }
      const trimmed = deck.slice(-maxCards);
      store.set(key(userId), trimmed);
      return trimmed.length;
    },
    due(userId, limit = 50) {
      const t = now();
      return this.list(userId).filter((c) => c.due <= t).sort((a, b) => a.due - b.due).slice(0, limit);
    },
    get(userId, id) {
      return this.list(userId).find((c) => c.id === id) || null;
    },
    grade(userId, id, grade) {
      const deck = this.list(userId);
      const i = deck.findIndex((c) => c.id === id);
      if (i < 0) return null;
      deck[i] = review(deck[i], grade, now());
      store.set(key(userId), deck);
      return deck[i];
    },
    setReminderHour(userId, hour) {
      if (hour === null) store.del(reminderKey(userId));
      else store.patch(reminderKey(userId), { hour, sentOn: null });
    },
    reminder(userId) {
      return store.get(reminderKey(userId)) || null;
    },
    /** Users whose reminder hour is now, who have due cards, and who were not reminded today. */
    dueReminders({ utcHour, tzOffset = 0, day, users }) {
      const localHour = (utcHour + tzOffset + 24) % 24;
      const out = [];
      for (const userId of users) {
        const r = this.reminder(userId);
        if (!r || r.hour !== localHour || r.sentOn === day) continue;
        const count = this.due(userId).length;
        if (count > 0) out.push({ userId, count });
      }
      return out;
    },
    markReminded(userId, day) {
      store.patch(reminderKey(userId), { sentOn: day });
    },
  };
}

/** Starts a timer that calls `tick()` every `everyMs`. Returns a stop function. */
export function startReminderLoop(tick, everyMs = 10 * MIN) {
  const timer = setInterval(() => tick().catch(() => {}), everyMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
