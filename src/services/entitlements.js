// Usage rules for uploads and quizzes.
//   * Files: each user may upload a fixed number of files per day (free 2, Pro more).
//     Admins are unlimited. Summaries and everything else on a file are not limited.
//   * Questions: each file can produce at most MAX_QUESTIONS_PER_FILE quiz questions in
//     total, across all of its quizzes (default 30).
//   * Quiz sizes offered to the user: 5, 10, 15, 20 and 30, never above what is left.

export const QUIZ_SIZES = Object.freeze([5, 10, 15, 20, 30]);

const DAY_MS = 24 * 3600 * 1000;

export function createEntitlements({ store, cfg, plans, admins = new Set(), now = () => Date.now() }) {
  const dayKey = (t = now()) => new Date(t).toISOString().slice(0, 10);
  const isAdmin = (userId) => admins.has(Number(userId));  // here: the users exempt from limits
  const fileKey = (userId) => `files:${userId}:${dayKey()}`;

  function filesLimit(userId) {
    const active = plans ? plans.active(userId) : "free";
    return active === "pro" ? cfg.proFilesPerDay : cfg.freeFilesPerDay;
  }

  return {
    filesLimit,

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

    /** How many questions a file may still produce. */
    questionsLeft(session) {
      const used = Number(session?.questionsUsed || 0);
      return Math.max(0, cfg.maxQuestionsPerFile - used);
    },

    /** The largest allowed quiz size that is not above the request. 0 when none fits. */
    clampQuizSize(session, count) {
      const left = this.questionsLeft(session);
      const fits = QUIZ_SIZES.filter((n) => n <= Math.min(count, left));
      return fits.length ? fits[fits.length - 1] : 0;
    },

    /** The quiz sizes the user may pick from, given what is left for the file. */
    allowedQuizSizes(session, userId) {
      if (isAdmin(userId)) return [...QUIZ_SIZES];
      const left = this.questionsLeft(session);
      return QUIZ_SIZES.filter((n) => n <= left);
    },
  };
}
