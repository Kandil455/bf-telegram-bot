// Daily report for admins: how the day went. Pure: it reads counters and returns text.
// The AI hook (recordAttempt) keeps a per-day count of outcomes and the average time.

const DAY_MS = 24 * 3600 * 1000;

/** Feed this from ai.js onAttempt. Counts per provider and outcome, plus total time. */
export function createAiMetrics(store, { now = () => Date.now() } = {}) {
  const day = () => new Date(now()).toISOString().slice(0, 10);
  return {
    record({ provider, outcome, ms }) {
      const d = day();
      const ok = outcome === "ok";
      const key = `metric:ai:${d}`;
      const cur = store.get(key) || { ok: 0, failed: 0, totalMs: 0, byProvider: {} };
      if (ok) cur.ok++;
      else if (outcome !== "skipped-breaker-open") cur.failed++;
      cur.totalMs += Number(ms) || 0;
      const p = cur.byProvider[provider] || { ok: 0, failed: 0 };
      if (ok) p.ok++;
      else if (outcome !== "skipped-breaker-open") p.failed++;
      cur.byProvider[provider] = p;
      store.set(key, cur, 3 * DAY_MS);
    },
    today(d = day()) {
      return store.get(`metric:ai:${d}`) || { ok: 0, failed: 0, totalMs: 0, byProvider: {} };
    },
  };
}

/** Builds the report text (HTML) for the admins. Works in Arabic or English. */
export function buildDailyReport({ dayLabel = null, tasks = 0, files = 0, quizzes = 0, cacheHits = 0, activeUsers = 0, ai = { ok: 0, failed: 0, totalMs: 0, byProvider: {} }, lang = "en" }) {
  const total = ai.ok + ai.failed;
  const avg = total ? Math.round(ai.totalMs / total) : 0;
  const failRate = total ? Math.round((ai.failed / total) * 100) : 0;
  const bad = Object.entries(ai.byProvider).filter(([, p]) => p.failed > 0).map(([name, p]) => `${name}: ${p.failed}`);
  const ar = lang === "ar";
  const title = dayLabel ? (ar ? `تقرير يوم ${dayLabel}` : `Report (${dayLabel})`) : (ar ? "تقرير النهارده" : "Today's report");
  const lines = [
    `📊 <b>${title}</b>`,
    `━━━━━━━━━━━━━━━`,
    `👥 ${ar ? "نشطين" : "Active users"}: <b>${activeUsers}</b>`,
    `⚙️ ${ar ? "مهام" : "Tasks"}: <b>${tasks}</b> · 📄 ${ar ? "ملفات" : "Files"}: <b>${files}</b> · 🎯 ${ar ? "كويزات" : "Quizzes"}: <b>${quizzes}</b>`,
    `♻️ ${ar ? "من الكاش (بدون AI)" : "From cache (no AI)"}: <b>${cacheHits}</b>`,
    `🧠 AI: <b>${ai.ok}</b> ${ar ? "نجح" : "ok"} · <b>${ai.failed}</b> ${ar ? "فشل" : "failed"} (${failRate}%)`,
    `⏱ ${ar ? "متوسط الوقت" : "Average time"}: <b>${(avg / 1000).toFixed(1)}s</b>`,
  ];
  if (bad.length) lines.push(`⚠️ ${ar ? "فشل حسب المزود" : "Failures by provider"}: ${bad.join(" · ")}`);
  else if (total) lines.push(`✅ ${ar ? "مفيش فشل النهارده" : "No failures today"}`);
  return lines.join("\n");
}
