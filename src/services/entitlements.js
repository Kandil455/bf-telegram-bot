// Usage rules for uploads and quizzes.
//   * Files: each user may upload a fixed number of files per day (free 2, Pro more).
//     Admins are unlimited. Summaries and everything else on a file are not limited.
//   * Questions: each file can produce at most MAX_QUESTIONS_PER_FILE quiz questions in
//     total, across all of its quizzes (hard-capped at 50 per user/file in production, 30 in legacy tests).
//   * Quiz sizes offered to the user: 5..30 (or up to 50 when maxQuestionsPerFile > 30).

export const QUIZ_SIZES = Object.freeze([5, 10, 15, 20, 30]);
export const EXTENDED_QUIZ_SIZES = Object.freeze([5, 10, 15, 20, 30, 50]);

const DAY_MS = 24 * 3600 * 1000;

export function createEntitlements({ store, cfg, plans, admins = new Set(), now = () => Date.now() }) {
  const dayKey = (t = now()) => new Date(t).toISOString().slice(0, 10);
  const isAdmin = (userId) => admins.has(Number(userId));
  const fileKey = (userId) => `files:${userId}:${dayKey()}`;
  const maxQ = Math.min(50, Number(cfg?.maxQuestionsPerFile) || 30);
  const sizePool = maxQ > 30 ? EXTENDED_QUIZ_SIZES : QUIZ_SIZES;

  function filesLimit(userId) {
    const active = plans ? plans.active(userId) : "free";
    const base = active === "pro" ? cfg.proFilesPerDay : cfg.freeFilesPerDay;
    const bonusToday = Number(store.get(`ref_bonus:${userId}:${dayKey()}`) || 0);
    return base + bonusToday;
  }

  return {
    filesLimit,
    referralBonusToday: (userId) => Number(store.get(`ref_bonus:${userId}:${dayKey()}`) || 0),

    fileStatus(userId) {
      if (isAdmin(userId)) return { used: 0, limit: Infinity, left: Infinity, unlimited: true };
      const limit = filesLimit(userId);
      const used = store.get(fileKey(userId)) || 0;
      return { used, limit, left: Math.max(0, limit - used), unlimited: false };
    },

    /** Takes one file slot for today. Returns { ok, left, limit }. */
    takeFileSlot(userId) {
      const status = this.fileStatus(userId);
      if (status.unlimited) return { ok: true, left: Infinity, limit: Infinity };
      if (status.left <= 0) return { ok: false, left: 0, limit: status.limit };
      store.set(fileKey(userId), status.used + 1, DAY_MS + 60_000);
      return { ok: true, left: status.left - 1, limit: status.limit };
    },

    /** How many questions a file may still produce (hard-capped at 50 max). */
    questionsLeft(session) {
      const used = Number(session?.questionsUsed || 0);
      return Math.max(0, maxQ - used);
    },

    /** The largest allowed quiz size that is not above the request (max 50). 0 when none fits. */
    clampQuizSize(session, count) {
      const left = this.questionsLeft(session);
      const req = Math.min(50, Math.max(0, Math.floor(Number(count) || 0)));
      if (maxQ > 30 && req > 0) {
        return Math.min(req, left, maxQ, 50);
      }
      const fits = sizePool.filter((n) => n <= Math.min(req, left));
      return fits.length ? fits[fits.length - 1] : 0;
    },

    /** The quiz sizes the user may pick from, given what is left for the file (max 50). */
    allowedQuizSizes(session, userId) {
      if (isAdmin(userId)) return [...sizePool];
      const left = this.questionsLeft(session);
      return sizePool.filter((n) => n <= left);
    },
  };
}
