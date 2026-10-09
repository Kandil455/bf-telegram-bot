// The brain of the bot. Platform-independent: it receives normalised updates and
// talks to Telegram only through `ui`, and to the world only through the injected
// services. Tested with fakes in test/router.test.js.

import { act, parseAct } from "./core/actions.js";
import { button } from "./core/buttons.js";
import { copy } from "./core/copy.js";
import { detectIntent } from "./core/intent.js";
import { detectLang, pickLang } from "./core/lang.js";
import { normaliseCards, normaliseQuiz } from "./core/quiz.js";
import { HR, chunk, esc, parseJsonLoose, progress, sanitizeHtml, wordCount } from "./core/text.js";
import { channelJoinRows, finishRows, inputRows, inviteRows, menuRows, nextRows, quizRows } from "./keyboards.js";
import { kindOf } from "./services/files.js";
import { renderDocument, renderOsce, previewLines } from "./render/html.js";
import { generateDocument } from "./render/pipeline.js";
import { templateFor } from "./render/templates.js";
import { ensureFigures } from "./render/figures.js";
import { afterDocumentRows, stylePickerRows } from "./keyboards.js";
import { PLANS } from "./services/plans.js";
import { applyPayment, checkoutDecision, sendPlanInvoice } from "./features/payments.js";
import { conceptsPrompt, cardsPrompt, quizPrompt, groundedAnswerPrompt, chatPrompt, groupQuizPrompt } from "./prompts/index.js";
import { stripMention } from "./features/groups.js";
import { qualityPass, topUpQuiz } from "./quality/quiz.js";
import { randomBytes } from "node:crypto";
import { markNotice, renewalNotices } from "./features/subscriptions.js";

const HEAVY_ACTIONS = new Set(["sum", "quiz", "cards", "key", "tpl", "qc", "img", "ask", "explain", "cash", "buy"]);
import { humanize } from "./services/quota.js";

const DOC_TTL = 7 * 24 * 3600 * 1000;
const DAY = () => new Date().toISOString().slice(0, 10);

export function createRouter({ cfg, ui, store, ai, quota, files, getFilePath, plans = null, decks = null, groups = null, cash = null, media = null, ent = null, logger = console, now = () => Date.now() }) {
  const entitle = ent || { takeFileSlot: () => ({ ok: true }), allowedQuizSizes: () => [5, 10, 15, 20, 30], clampQuizSize: (s, n) => n, questionsLeft: () => 30 };
  const FRAMES = ["▰▱▱▱▱", "▰▰▱▱▱", "▰▰▰▱▱", "▰▰▰▰▱", "▰▰▰▰▰"];
  const appRows = (qid, lang) => (qid && cfg.appUrl ? [[button({ label: lang === "ar" ? "افتح الكويز في التطبيق" : "Open quiz in the app", icon: "app", webApp: `${cfg.appUrl}/app?qid=${qid}`, style: "primary", premium })]] : []);
  const EFFECT = { confetti: "5046509860389126442", fire: "5104841245755180586" };
  const MEDIA_KINDS = ["pdf", "docx", "pptx"];
  const busy = new Set();
  const premium = cfg.premiumEmoji;
  const maxBytes = cfg.maxFileMb * 1024 * 1024;

  // ───────────── state ─────────────

  const session = (chatId) => store.get(`s:${chatId}`) || {};
  const saveSession = (chatId, patch) => store.patch(`s:${chatId}`, patch);

  function countUser(userId) {
    const seen = `seen:${DAY()}:${userId}`;
    if (store.get(seen)) return;
    store.set(seen, 1, 2 * 24 * 3600 * 1000);
    store.incr(`stat:users:${DAY()}`, 1, 3 * 24 * 3600 * 1000);
  }
  const stat = (name) => store.incr(`stat:${name}:${DAY()}`, 1, 3 * 24 * 3600 * 1000);

  // ───────────── delivery helpers ─────────────

  function quotaFooter(userId, lang) {
    const c = copy(lang);
    const s = quota.status(userId);
    return s.unlimited ? `\n${HR}\n${c.unlimited}` : `\n${HR}\n${c.quota(s.left, s.limit)}`;
  }

  /** Shows `html` in the progress message, spilling extra chunks into new messages. */
  async function deliver(chatId, msgId, html, rows) {
    const parts = chunk(sanitizeHtml(html), 3800);
    if (parts.length === 0) return;
    if (msgId) await ui.edit(chatId, msgId, parts[0], parts.length === 1 ? rows : null);
    else await ui.send(chatId, parts[0], parts.length === 1 ? rows : null);
    for (let i = 1; i < parts.length; i++) {
      await ui.send(chatId, parts[i], i === parts.length - 1 ? rows : null);
    }
  }

  /**
   * Runs one metered task. `work` returns { html, rows?, after? } or null on failure.
   * Quota is reserved up front and refunded when generation fails.
   */
  async function runTask({ chatId, userId, lang, cost, label, work, failRows = menuRows(lang, premium, { isAdmin: quota.isAdmin(userId) }) }) {
    const c = copy(lang);
    const reserve = quota.consume(userId, cost);
    if (!reserve.ok) {
      return ui.send(chatId, c.quotaReached(reserve.limit, humanize(reserve.resetMs, c)), failRows);
    }
    if (busy.has(chatId)) {
      quota.refund(userId, cost);
      return ui.send(chatId, c.busy);
    }
    busy.add(chatId);
    let msgId;
    try {
      msgId = await ui.send(chatId, label);
      await ui.typing(chatId);
      const out = await withSpinner(chatId, msgId, label, work);
      if (!out) {
        quota.refund(userId, cost);
        await ui.edit(chatId, msgId, c.failed, failRows);
        return;
      }
      if (out.after) await out.after();
      stat("tasks");
      await deliver(chatId, msgId, out.html + quotaFooter(userId, lang), out.rows);
      if (out.file) await ui.sendDocument(chatId, out.file.html, out.file.name, out.file.caption);
    } catch (err) {
      quota.refund(userId, cost);
      logger.error("[bot] task failed:", err?.message || err);
      if (msgId) await ui.edit(chatId, msgId, c.failed, failRows).catch(() => {});
      else await ui.send(chatId, c.failed, failRows).catch(() => {});
    } finally {
      busy.delete(chatId);
    }
  }

  // ───────────── prompts ─────────────

  const SYSTEM = (lang, role) =>
    `${lang === "ar" ? "Reply in Modern Standard Arabic with a light, friendly tone." : "Reply in clear, natural English."} ${role} Use Telegram HTML only: <b>, <i>, <code>. No markdown, no asterisks, no # headings. Stay faithful to the material; never invent facts.`;

  // ───────────── intake: files, photos, pasted text ─────────────

  async function intake(m, lang) {
    const c = copy(lang);
    const file = m.document || m.photo;
    const name = m.document?.file_name || (m.photo ? "photo.jpg" : "file");
    const mime = m.document?.mime_type || (m.photo ? "image/jpeg" : "");
    const size = file.file_size || 0;

    if (size > maxBytes) return ui.send(m.chatId, c.tooBig(cfg.maxFileMb));
    if (!kindOf(name, mime)) return ui.send(m.chatId, c.unsupported);
    if (busy.has(m.chatId)) return ui.send(m.chatId, c.busy);

    const slot = entitle.takeFileSlot(m.userId);
    if (!slot.ok) return ui.send(m.chatId, c.fileLimit(slot.limit));
    busy.add(m.chatId);
    let msgId;
    try {
      msgId = await ui.send(m.chatId, c.reading);
      const cacheKey = `doc:${file.file_unique_id}`;
      let result = store.get(cacheKey);
      let mediaSummary = null;

      if (!result) {
        await ui.typing(m.chatId);
        const filePath = await getFilePath(file.file_id);
        const got = await files.download({ token: cfg.botToken, filePath, maxBytes });
        if (got.tooBig) return ui.edit(m.chatId, msgId, c.tooBig(cfg.maxFileMb));
        await ui.edit(m.chatId, msgId, c.extracting);
        result = await files.extract({ buffer: got.buffer, name, mime }, ai);
        if (media && MEDIA_KINDS.includes(result.kind)) {
          mediaSummary = await media.onFile({ chatId: m.chatId, lang, kind: result.kind, buffer: got.buffer, name, reviewProgress: () => {} });
        }
        if (wordCount(result.text) < 5) return ui.edit(m.chatId, msgId, c.unreadable);
        const cut = result.text.length > cfg.maxTextChars;
        result = { ...result, text: result.text.slice(0, cfg.maxTextChars), note: [result.note, cut ? `kept the first ${cfg.maxTextChars.toLocaleString("en-US")} characters` : null].filter(Boolean).join("; ") || null };
        store.set(cacheKey, result, DOC_TTL);
      }

      const words = wordCount(result.text);
      saveSession(m.chatId, {
        lang,
        lastInput: { kind: result.kind, title: result.title, text: result.text, words, at: now() },
        quiz: null,
        awaiting: null,
      });
      stat("files");
      if (mediaSummary?.count) await media.showGallery(m.chatId, lang);
      await ui.edit(m.chatId, msgId, c.fileReady({ title: result.title, words }), inputRows(lang, premium));
      if (result.note) await ui.send(m.chatId, c.partialRead(result.note));
    } catch (err) {
      logger.error("[bot] intake failed:", err?.message || err);
      if (msgId) await ui.edit(m.chatId, msgId, c.failed).catch(() => {});
      else await ui.send(m.chatId, c.failed).catch(() => {});
    } finally {
      busy.delete(m.chatId);
    }
  }

  // ───────────── tasks (metered) ─────────────

  function requireInput(chatId, lang) {
    const input = session(chatId).lastInput;
    if (input?.text) return input;
    ui.send(chatId, copy(lang).noInput, menuRows(lang, premium));
    return null;
  }

  async function keyPoints(m, lang) {
    const input = requireInput(m.chatId, lang);
    if (!input) return;
    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: 1,
      label: copy(lang).thinking,
      work: async () => {
        const r = await ai.complete(conceptsPrompt({ lang, source: input.text }));
        if (!r) return null;
        return { html: `💡 <b>Key points · ${esc(input.title)}</b>\n${HR}\n${sanitizeHtml(r.text)}`, rows: inputRows(lang, premium) };
      },
    });
  }

  async function flashcards(m, lang) {
    const input = requireInput(m.chatId, lang);
    if (!input) return;
    const c = copy(lang);
    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: 1,
      label: c.writing,
      work: async () => {
        const r = await ai.complete(cardsPrompt({ lang, source: input.text }));
        const cards = normaliseCards(parseJsonLoose(r?.text), 8);
        if (!cards.length) return null;
        if (decks) decks.add(m.userId, cards);
        const body = cards.map((card, i) => `<b>${i + 1}. ${esc(card.q)}</b>\n<tg-spoiler>${esc(card.a)}</tg-spoiler>`).join("\n\n");
        const deckLine = decks ? `\n<i>${c.deckAdded(cards.length)}</i>` : "";
        return { html: `🗂️ <b>Flashcards · ${esc(input.title)}</b>\n<i>${c.cardsHint}</i>\n${HR}\n${body}${deckLine}`, rows: inputRows(lang, premium) };
      },
    });
  }

  async function startQuiz(m, lang, count, topic = null) {
    const c = copy(lang);
    const input = topic ? null : requireInput(m.chatId, lang);
    if (!topic && !input) return;
    const s = session(m.chatId);
    const size = topic ? count : entitle.clampQuizSize(s, count);
    if (!size) return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));
    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: 1,
      label: c.thinking,
      work: async () => {
        const r = await ai.complete(quizPrompt({ lang, source: input?.text || "", count: size, topic }));
        let raw = normaliseQuiz(parseJsonLoose(r?.text), size);
        if (!raw.length) return null;
        raw = await topUpQuiz({ ai, items: raw, count: size, source: input?.text || topic, lang, topic });
        const { items } = await qualityPass({ items: raw, source: input?.text || topic, lang, ai, verify: cfg.quizVerify !== false });
        if (!items.length) return null;
        const quiz = { items, index: 0, score: 0, answered: -1, title: topic || input.title };
        const qid = cfg.appUrl ? randomBytes(8).toString("hex") : null;
        return {
          html: `${c.quizIntro(items.length)}\n\n${c.quizQuestion({ index: 1, total: items.length, q: items[0].q })}`,
          rows: [...quizRows(0, items[0].options, premium), ...appRows(qid, lang)],
          after: () => {
            if (qid) store.set(`appquiz:${qid}`, { userId: m.userId, items, at: now() }, 2 * 3600 * 1000);
            saveSession(m.chatId, { quiz, awaiting: null, questionsUsed: Number(session(m.chatId).questionsUsed || 0) + items.length });
          },
        };
      },
    });
  }

  // ───────────── quiz state machine ─────────────

  async function answerQuiz(m, qIndex, choice) {
    const lang = pickLang(session(m.chatId), "");
    const c = copy(lang);
    const s = session(m.chatId);
    const quiz = s.quiz;
    if (!quiz || quiz.index !== qIndex || quiz.answered === qIndex) return { stale: true };

    const item = quiz.items[qIndex];
    const correct = choice === item.answer;
    quiz.score += correct ? 1 : 0;
    quiz.streak = correct ? (quiz.streak || 0) + 1 : 0;
    quiz.answered = qIndex;
    saveSession(m.chatId, { quiz });

    const question = c.quizQuestion({ index: qIndex + 1, total: quiz.items.length, q: item.q });
    const verdict = correct ? c.right(item.explanation) : c.wrong(item.options[item.answer], item.explanation);
    const isLast = qIndex === quiz.items.length - 1;
    await ui.edit(m.chatId, m.messageId, `${question}\n${HR}\n${verdict}`, nextRows(lang, premium, qIndex, isLast));
    if (correct && quiz.streak >= 3 && quiz.streak % 3 === 0) await ui.sendWithEffect(m.chatId, c.streak(quiz.streak), null, EFFECT.fire);
    return { ok: true };
  }

  async function nextQuestion(m, qIndex) {
    const s = session(m.chatId);
    const quiz = s.quiz;
    const lang = pickLang(s, "");
    const c = copy(lang);
    if (!quiz || quiz.index !== qIndex || quiz.answered !== qIndex) return { stale: true };

    await ui.clearKeyboard(m.chatId, m.messageId);
    if (qIndex + 1 < quiz.items.length) {
      quiz.index = qIndex + 1;
      saveSession(m.chatId, { quiz });
      const item = quiz.items[quiz.index];
      const html = c.quizQuestion({ index: quiz.index + 1, total: quiz.items.length, q: item.q });
      await ui.send(m.chatId, `${html}\n${HR}\n${progress(quiz.index, quiz.items.length)}`, quizRows(quiz.index, item.options, premium));
      return { ok: true };
    }

    saveSession(m.chatId, { quiz: null });
    stat("quizzes");
    await ui.sendWithEffect(m.chatId, c.quizDone(quiz.score, quiz.items.length), finishRows(lang, premium), quiz.score === quiz.items.length ? EFFECT.confetti : EFFECT.fire);
    return { ok: true };
  }

  // ───────────── grounded Q&A and general chat (free) ─────────────

  async function ask(m, lang, question) {
    const c = copy(lang);
    const input = session(m.chatId).lastInput;
    if (busy.has(m.chatId)) return ui.send(m.chatId, c.busy);
    busy.add(m.chatId);
    let msgId;
    try {
      msgId = await ui.send(m.chatId, c.thinking);
      await ui.typing(m.chatId);
      const prompt = input?.text
        ? groundedAnswerPrompt({ lang, material: `(${input.kind}: ${input.title})\n${input.text}`, question })
        : chatPrompt({ lang, question });
      const r = await ai.complete(prompt);
      if (!r) return ui.edit(m.chatId, msgId, c.failed, menuRows(lang, premium));
      await deliver(m.chatId, msgId, r.text, input?.text ? inputRows(lang, premium) : menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
    } catch (err) {
      logger.error("[bot] ask failed:", err?.message || err);
      if (msgId) await ui.edit(m.chatId, msgId, c.failed).catch(() => {});
    } finally {
      busy.delete(m.chatId);
    }
  }

  // ───────────── styles, figures and documents ─────────────

  const today = (lang) => new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  const slug = (s) => String(s || "notes").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 48) || "notes";

  function showStyles(m, lang) {
    const s0 = session(m.chatId);
    const input = session(m.chatId).lastInput;
    if (!input?.text) return ui.send(m.chatId, copy(lang).noInput, menuRows(lang, premium));
    const docLang = session(m.chatId).docLang || "en";
    return ui.send(m.chatId, copy(lang).styles, stylePickerRows(lang, premium, docLang, s0.outputFormat || "html"));
  }

  async function runStyle(m, lang, id) {
    const tpl = templateFor(id);
    const c = copy(lang);
    if (!tpl) return ui.send(m.chatId, c.failed);
    const s = session(m.chatId);
    const input = s.lastInput;
    if (!input?.text) return ui.send(m.chatId, c.noInput, menuRows(lang, premium));
    const docLang = s.docLang || "en";
    const approved = media ? media.approvedForSummary(m.chatId) : [];
    const images = [...approved, ...(s.images || [])];

    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: tpl.cost,
      label: c.writing,
      work: async () => {
        const gen = await generateDocument({ ai, template: id, lang: docLang, title: input.title, text: input.text, images });
        if (!gen) return null;
        const doc = gen.kind === "doc" ? ensureFigures(gen.doc, images) : null;
        const title = gen.kind === "osce" ? gen.osce.title : doc.title;
        const name = `${slug(typeof title === "string" ? title : title.en || title.ar)}-${id}-${docLang}.html`;
        const html = gen.kind === "osce"
          ? renderOsce({ osce: gen.osce, lang: docLang, dateLabel: today(lang) })
          : renderDocument({ doc: doc, lang: docLang, template: id, images, dateLabel: today(lang) });
        const lines = gen.kind === "osce"
          ? [`${gen.osce.stations.length} stations`]
          : previewLines(doc, docLang, 3);
        const head = typeof title === "string" ? title : title.en || title.ar;
        const built = await outputFor({ chatId: m.chatId, lang: docLang, format: s.outputFormat || "html", html, doc: doc, kind: gen.kind, name, c });
        return {
          html: `📋 <b>${esc(head)}</b> · ${esc(tpl.label[lang] || tpl.label.en)}\n${HR}\n${lines.map((l) => `• ${esc(l)}`).join("\n")}\n\n${c.docReady}${built.note ? `\n\n${built.note}` : ""}`,
          rows: afterDocumentRows(lang, premium),
          file: { html: built.html, name: built.name, caption: built.caption },
        };
      },
    });
  }

  async function attachFigure(m, lang) {
    const c = copy(lang);
    const s = session(m.chatId);
    const images = [...(s.images || [])];
    const figMax = plans ? plans.figuresFor(m.userId) : 6;
    if (images.length >= figMax) return ui.send(m.chatId, c.figureFull);
    const photo = m.photo;
    if (photo.file_size && photo.file_size > 900 * 1024) return ui.send(m.chatId, c.figureTooBig);
    try {
      const filePath = await getFilePath(photo.file_id);
      const got = await files.download({ token: cfg.botToken, filePath, maxBytes: 900 * 1024 });
      if (got.tooBig) return ui.send(m.chatId, c.figureTooBig);
      images.push({ mime: "image/jpeg", b64: got.buffer.toString("base64"), caption: m.caption.slice(0, 160) });
      saveSession(m.chatId, { images });
      return ui.send(m.chatId, c.figureAdded(m.caption, images.length));
    } catch (err) {
      logger.error("[bot] figure failed:", err?.message || err);
      return ui.send(m.chatId, c.failed);
    }
  }

  // ───────────── plans, payments, reviews, reminders, groups ─────────────

  function recordUser(m) {
    if (!m?.userId) return;
    store.patch(`user:${m.userId}`, { firstName: m.firstName || "", lastSeen: now() });
  }

  function showPlans(m, lang) {
    const c = copy(lang);
    const current = plans ? plans.active(m.userId) : "free";
    const lines = Object.values(PLANS)
      .map((p) => `${p.id === current ? "✅" : "•"} <b>${esc(p.name[lang] || p.name.en)}</b>${p.stars ? ` · ${p.stars} ⭐ / ${p.days}d` : ""}\n<i>${esc((p.features[lang] || p.features.en).join(" · "))}</i>`)
      .join("\n\n");
    const rows = Object.values(PLANS)
      .filter((p) => p.stars)
      .map((p) => [button({ label: `${c.btn.buy} ${p.name[lang] || p.name.en} · ${p.stars} ⭐`, icon: "credits", action: act("buy", p.id), style: "primary", premium })]);
    if (cash?.enabled) {
      for (const p of Object.values(PLANS).filter((x) => x.egp)) {
        rows.push([button({ label: `${c.btn.cash} · ${p.egp} EGP`, icon: "credits", action: act("cash", p.id), premium })]);
      }
    }
    rows.push([button({ label: c.btn.menu, icon: "home", action: act("menu"), premium })]);
    return ui.send(m.chatId, `${c.plansTitle}\n${HR}\n${lines}`, rows);
  }

  async function buyPlan(m, lang, planId) {
    if (!plans || !PLANS[planId]?.stars) return showPlans(m, lang);
    const ok = await sendPlanInvoice(ui, m.chatId, planId, lang);
    return ok ? null : showPlans(m, lang);
  }

  async function onPaid(m) {
    const lang = pickLang(session(m.chatId), "");
    const c = copy(lang);
    const grant = plans ? applyPayment(m.successfulPayment, plans, m.userId, store) : null;
    if (grant?.duplicate) return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
    if (!grant) return ui.send(m.chatId, c.paidFailed);
    notifyAdmins(c.adminPaid(m.firstName || "user", m.userId, PLANS[grant.plan].name.en, m.successfulPayment.total_amount, m.successfulPayment.currency));
    await ui.send(m.chatId, c.receipt(PLANS[grant.plan].name[lang] || PLANS[grant.plan].name.en, new Date(grant.until).toISOString().slice(0, 10), m.successfulPayment.total_amount, m.successfulPayment.telegram_payment_charge_id), menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
    const name = PLANS[grant.plan].name[lang] || PLANS[grant.plan].name.en;
    return ui.send(m.chatId, c.paid(name, new Date(grant.until).toISOString().slice(0, 10)), menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
  }

  function showDeck(m, lang) {
    const c = copy(lang);
    if (!decks) return ui.send(m.chatId, c.menu, menuRows(lang, premium));
    const total = decks.list(m.userId).length;
    const due = decks.due(m.userId).length;
    return ui.send(m.chatId, c.deckStatus(total, due), [[button({ label: c.btn.review, icon: "cards", action: act("rvs"), style: "primary", premium })]]);
  }

  async function reviewNext(m, lang) {
    const c = copy(lang);
    if (!decks) return ui.send(m.chatId, c.menu, menuRows(lang, premium));
    const next = decks.due(m.userId, 1)[0];
    if (!next) return ui.send(m.chatId, c.reviewNone(decks.list(m.userId).length), [[button({ label: c.btn.menu, icon: "home", action: act("menu"), premium })]]);
    const left = decks.due(m.userId).length;
    return ui.send(m.chatId, c.reviewQuestion(next.q, left), [[button({ label: c.btn.showAnswer, icon: "cards", action: act("rv", next.id, "show"), style: "primary", premium })]]);
  }

  function startCashPayment(m, lang, planId) {
    const c = copy(lang);
    if (!cash?.enabled) return ui.send(m.chatId, c.cashOff, menuRows(lang, premium));
    const intent = cash.start(m.userId, planId);
    if (!intent) return showPlans(m, lang);
    const name = PLANS[planId].name[lang] || PLANS[planId].name.en;
    return ui.send(m.chatId, c.cashStart(name, intent.amount, intent.number, 30), menuRows(lang, premium));
  }

  function onTxId(m, lang, raw) {
    const c = copy(lang);
    if (!cash?.enabled) return ui.send(m.chatId, c.cashOff, menuRows(lang, premium));
    const r = cash.claim(m.userId, raw);
    switch (r.status) {
      case "ok":
        return ui.send(m.chatId, c.cashOk(PLANS[r.grant.plan].name[lang] || PLANS[r.grant.plan].name.en, new Date(r.grant.until).toISOString().slice(0, 10)), menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
      case "pending":
        return ui.send(m.chatId, c.cashPending);
      case "used":
        return ui.send(m.chatId, c.cashUsed);
      case "amount":
        return ui.send(m.chatId, c.cashAmount(r.got, r.need));
      case "expired":
        return ui.send(m.chatId, c.cashExpired);
      case "no_intent":
        return ui.send(m.chatId, c.cashNoIntent, menuRows(lang, premium));
      default:
        return ui.send(m.chatId, c.cashBadId);
    }
  }

  function reviewShow(m, lang, id) {
    const c = copy(lang);
    const card = decks?.get(m.userId, id);
    if (!card) return reviewNext(m, lang);
    const row = [0, 1, 2, 3].map((g) => button({ label: c.grades[g], action: act("rv", id, String(g)), style: g === 0 ? "danger" : g === 3 ? "success" : null, premium }));
    return ui.edit(m.chatId, m.messageId, c.reviewAnswer(card.q, card.a), [row]);
  }

  async function reviewGrade(m, lang, id, g) {
    const c = copy(lang);
    const updated = decks?.grade(m.userId, id, Number(g));
    if (!updated) return reviewNext(m, lang);
    await ui.clearKeyboard(m.chatId, m.messageId);
    await ui.send(m.chatId, c.reviewNext(Math.round(updated.interval)));
    return reviewNext(m, lang);
  }

  function setReminder(m, lang, arg) {
    const c = copy(lang);
    if (!decks) return null;
    if ((arg || "").toLowerCase() === "off") {
      decks.setReminderHour(m.userId, null);
      return ui.send(m.chatId, c.reminderOff, menuRows(lang, premium));
    }
    const h = Number(arg);
    if (!arg || !Number.isInteger(h) || h < 0 || h > 23) return ui.send(m.chatId, c.remindUsage, menuRows(lang, premium));
    decks.setReminderHour(m.userId, h);
    return ui.send(m.chatId, c.reminderSet(h), menuRows(lang, premium));
  }

  /** Sends one reminder per user whose hour is now and who has cards due. Call it on a timer. */
  async function sendReminders({ at = now(), tzOffset = cfg.tzOffset || 0 } = {}) {
    if (!decks) return 0;
    const day = new Date(at).toISOString().slice(0, 10);
    const users = store.keys("user:").map((k) => Number(k.slice(5)));
    const due = decks.dueReminders({ utcHour: new Date(at).getUTCHours(), tzOffset, day, users });
    for (const { userId, count } of due) {
      const lang = pickLang(session(userId), "");
      const c = copy(lang);
      await ui.send(userId, c.reminderDue(count), [[button({ label: c.btn.review, icon: "cards", action: act("rvs"), style: "primary", premium })]]);
      decks.markReminded(userId, day);
    }
    return due.length;
  }

  async function onGroupMessage(m) {
    const text = String(m.text || "").trim();
    if (!text) return null;
    const lang = pickLang(session(m.chatId), text);
    const c = copy(lang);
    if (/^\/stop\b/i.test(text)) {
      if (!groups) return null;
      return (await groups.stop(m.chatId)) ? null : ui.send(m.chatId, c.groupNone);
    }
    if (/^\/leaderboard\b/i.test(text)) {
      const board = groups?.leaderboard(m.chatId);
      return ui.send(m.chatId, board ? c.groupLeaderboard(board) : c.groupNone);
    }
    if (groups && (/^\/quiz\b/i.test(text) || /\bquiz\b/i.test(text))) {
      if (groups.get(m.chatId)) return ui.send(m.chatId, c.groupBusy);
      const topic = stripMention(text.replace(/^\/quiz\b/i, ""), cfg.botUsername);
      const source = m.replyText || "";
      if (!source && !topic) return ui.send(m.chatId, c.groupNeedsSource);
      const r = await ai.complete(groupQuizPrompt({ lang, source, topic: source ? null : topic, count: 5 }));
      const items = normaliseQuiz(parseJsonLoose(r?.text), 5);
      if (!items.length) return ui.send(m.chatId, c.failed);
      await groups.start(m.chatId, items);
      return ui.send(m.chatId, c.groupStarted(items.length));
    }
    const question = stripMention(text, cfg.botUsername);
    if (!question) return null;
    const r = await ai.complete(m.replyText ? groundedAnswerPrompt({ lang, material: m.replyText, question }) : chatPrompt({ lang, question }));
    return ui.send(m.chatId, r ? sanitizeHtml(r.text) : c.failed);
  }

  // ───────────── images, quiz sizes and output formats ─────────────

  /** A spinner in the progress message while `work` runs. Stops cleanly when it finishes. */
  async function withSpinner(chatId, msgId, label, work) {
    if (!msgId) return work();
    let i = 0;
    let stopped = false;
    const timer = setInterval(() => {
      if (stopped) return;
      i = (i + 1) % FRAMES.length;
      ui.edit(chatId, msgId, `${label}\n${FRAMES[i]}`).catch(() => {});
    }, 1500);
    const typingTimer = setInterval(() => {
      if (!stopped) ui.typing(chatId).catch(() => {});
    }, 4000);
    try {
      return await work();
    } finally {
      stopped = true;
      clearInterval(timer);
      clearInterval(typingTimer);
    }
  }

  async function outputFor({ chatId, lang, format, html, doc, kind, name, c }) {
    if (!media || format === "html") return { html, name, caption: c.docCaption(name), note: null };
    const o = await media.buildOutput({ format, html, doc, kind, lang, chatId, name });
    return { html: o.content, name: o.name, caption: c.docCaption(o.name), note: o.note ? c.formatNote(format, o.note) : null };
  }

  function sizeRows(lang, userId, source, session) {
    const sizes = entitle.allowedQuizSizes(session, userId);
    const row = sizes.map((n) => button({ label: String(n), icon: "quiz", action: act("qc", String(n), source), style: "primary", premium }));
    if (!row.length) return null;
    const rows = [];
    for (let i = 0; i < row.length; i += 3) rows.push(row.slice(i, i + 3));
    rows.push([button({ label: copy(lang).btn.back, icon: "back", action: act("menu"), premium })]);
    return rows;
  }

  async function quizCount(m, lang, a0, a1) {
    const c = copy(lang);
    const s = session(m.chatId);
    const source = a1 === "images" ? "images" : "text";
    if (source === "images" && !media) return ui.send(m.chatId, c.noImages);
    if (a0 === "pick") {
      if (source === "images" && !(media && media.hasApproved(m.chatId))) return ui.send(m.chatId, c.noApproved, menuRows(lang, premium));
      const rows = sizeRows(lang, m.userId, source, s);
      if (!rows) return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));
      return ui.send(m.chatId, c.quizPick(source, entitle.questionsLeft(s)), rows);
    }
    const n = Number(a0);
    if (!entitle.allowedQuizSizes(s, m.userId).includes(n) && n !== 0) return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));
    if (source === "images") return runImageQuiz(m, lang, n);
    return startQuiz(m, lang, n);
  }

  async function runImageQuiz(m, lang, count) {
    const c = copy(lang);
    const s = session(m.chatId);
    const size = entitle.clampQuizSize(s, count);
    if (!size) return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));
    if (busy.has(m.chatId)) return ui.send(m.chatId, c.busy);
    busy.add(m.chatId);
    let msgId;
    try {
      msgId = await ui.send(m.chatId, c.thinking);
      const made = await withSpinner(m.chatId, msgId, c.thinking, () => media.imageQuiz(m.chatId, lang, size));
      if (!made) return ui.edit(m.chatId, msgId, c.noQuizFromImages, menuRows(lang, premium));
      await media.sendUsedImages(m.chatId, made.used, lang);
      const quiz = { items: made.items, index: 0, score: 0, answered: -1, title: "images" };
      saveSession(m.chatId, { quiz, awaiting: null, questionsUsed: Number(s.questionsUsed || 0) + made.items.length });
      await ui.edit(m.chatId, msgId, `${c.quizIntro(made.items.length)}\n\n${c.quizQuestion({ index: 1, total: made.items.length, q: made.items[0].q })}`, quizRows(0, made.items[0].options, premium));
    } catch (err) {
      logger.error("[bot] image quiz failed:", err?.message || err);
      if (msgId) await ui.edit(m.chatId, msgId, c.failed).catch(() => {});
    } finally {
      busy.delete(m.chatId);
    }
  }

  async function imageAction(m, lang, op, arg) {
    const c = copy(lang);
    if (!media) return ui.send(m.chatId, c.noImages);
    switch (op) {
      case "card":
        return media.showGallery(m.chatId, lang);
      case "next":
        return media.reviewNext(m.chatId, lang);
      case "ok":
        media.decide(m.chatId, Number(arg), "approved");
        return media.reviewNext(m.chatId, lang);
      case "no":
        media.decide(m.chatId, Number(arg), "excluded");
        return media.reviewNext(m.chatId, lang);
      case "skip":
        return media.reviewNext(m.chatId, lang, Number(arg));
      case "all":
        await ui.send(m.chatId, c.approvedN(media.approveAll(m.chatId)));
        return media.showGallery(m.chatId, lang);
      case "ai": {
        const dropped = await media.rerunReview(m.chatId, lang);
        const k = media.getGallery(m.chatId);
        await ui.send(m.chatId, c.reviewedAi(dropped, k ? k.items.filter((i) => i.status === "pending" || i.status === "excluded").length : dropped));
        return media.showGallery(m.chatId, lang);
      }
      case "restore":
        await ui.send(m.chatId, c.restoredN(media.restoreAi(m.chatId)));
        return media.showGallery(m.chatId, lang);
      case "export":
        await ui.send(m.chatId, c.exportDone(await media.exportImages(m.chatId, lang)));
        return null;
      default:
        return media.showGallery(m.chatId, lang);
    }
  }

  // ───────────── quality of service: throttle, admin alerts, subscription notices ─────────────

  function throttled(userId) {
    const ms = Number(cfg.throttleMs || 0);
    if (!ms || quota.isAdmin(userId)) return false;
    const key = `thr:${userId}`;
    const last = store.get(key) || 0;
    const t = now();
    if (t - last < ms) return true;
    store.set(key, t, 60_000);
    return false;
  }

  function notifyAdmins(html) {
    for (const id of cfg.adminIds || []) ui.send(id, html).catch(() => {});
  }

  /** Heads-up before a plan ends and a notice once it has ended. Each period is announced once. */
  async function sendRenewalNotices(at = now()) {
    if (!plans) return 0;
    const users = store.keys("user:").map((k) => Number(k.slice(5)));
    const notices = renewalNotices({ users, raw: (u) => plans.raw(u), store, now: at });
    for (const n of notices) {
      const lang = pickLang(session(n.userId), "");
      const c = copy(lang);
      const text = n.kind === "soon" ? c.renewSoon(new Date(n.until).toISOString().slice(0, 10)) : c.renewExpired;
      const rows = [[button({ label: `${c.btn.buy} · ${PLANS.pro.stars} ⭐`, icon: "credits", action: act("buy", "pro"), style: "primary", premium })]];
      if (cash?.enabled) rows.push([button({ label: `${c.btn.cash} · ${PLANS.pro.egp} EGP`, icon: "credits", action: act("cash", "pro"), premium })]);
      await ui.send(n.userId, text, rows).catch(() => {});
      markNotice(store, n);
    }
    return notices.length;
  }

  // ───────────── phone verification ─────────────

  const isVerified = (userId) => Boolean(store.get(`verified:${userId}`));

  function askContact(m, lang) {
    const c = copy(lang);
    return ui.sendRaw(m.chatId, c.contactRequest, { keyboard: [[{ text: c.btn.shareContact, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
  }

  /** Accepts a shared contact only when it is the sender's own number, as Telegram reports it. */
  async function onContact(m) {
    const lang = pickLang(session(m.chatId), "");
    const c = copy(lang);
    if (!m.contact || Number(m.contact.userId) !== Number(m.userId)) {
      return ui.sendRaw(m.chatId, c.contactWrong, { keyboard: [[{ text: c.btn.shareContact, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
    }
    const phone = "+" + String(m.contact.phone || "").replace(/\D/g, "");
    store.set(`verified:${m.userId}`, phone);
    store.patch(`user:${m.userId}`, { phone, verifiedAt: now(), firstName: m.firstName || "" });
    await ui.sendRaw(m.chatId, c.contactThanks, { remove_keyboard: true });
    return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
  }

  // ───────────── channel subscription & referrals ─────────────

  function channelLink() {
    if (cfg.channelInviteLink) return cfg.channelInviteLink;
    if (cfg.requiredChannel) {
      const clean = cfg.requiredChannel.replace(/^@/, "");
      return `https://t.me/${clean}`;
    }
    return "";
  }

  async function checkChannelSubscription(userId) {
    if (!cfg.requiredChannel) return true;
    if (quota.isAdmin(userId)) return true;
    if (store.get(`channel_sub:${userId}`)) return true;
    if (typeof ui?.getChatMember !== "function") return true;

    try {
      const member = await ui.getChatMember(cfg.requiredChannel, userId);
      if (!member) return false;
      const status = member.status;
      if (["creator", "administrator", "member", "restricted"].includes(status)) {
        store.set(`channel_sub:${userId}`, 1, 10 * 60 * 1000);
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  function askChannelJoin(m, lang) {
    const c = copy(lang);
    const link = channelLink();
    return ui.send(m.chatId, c.channelRequired, channelJoinRows(link, lang, premium));
  }

  function showInvite(m, lang) {
    const c = copy(lang);
    const day = new Date().toISOString().slice(0, 10);
    const botUser = cfg.botUsername || "Black_Fighters_FREE_bot";
    const todayBonus = Number(store.get(`ref_bonus:${m.userId}:${day}`) || 0);
    const todayCount = Number(store.get(`ref_today:${m.userId}:${day}`) || 0);
    const totalCount = Number(store.get(`ref_total:${m.userId}`) || 0);
    const text = c.inviteInfo({
      botUsername: botUser,
      userId: m.userId,
      todayBonus,
      todayCount,
      totalCount,
    });
    return ui.send(m.chatId, text, inviteRows(botUser, m.userId, lang, premium));
  }

  // ───────────── routing ─────────────

  async function onText(m) {
    if (cash?.enabled) {
      const digits = String(m.text || "").replace(/\s/g, "");
      if (/^\d{6,20}$/.test(digits) && cash.intent(m.userId)) {
        return onTxId(m, pickLang(session(m.chatId), m.text), digits);
      }
    }
    const s = session(m.chatId);
    const lang = pickLang(s, m.text);
    const c = copy(lang);
    const text = m.text.trim();

    if (!s.lang) saveSession(m.chatId, { detectedLang: detectLang(text) || s.detectedLang || "en" });

    if (s.awaiting === "topic") {
      saveSession(m.chatId, { awaiting: null });
      return startQuiz(m, lang, 5, text.slice(0, 120));
    }
    if (s.awaiting === "question") {
      saveSession(m.chatId, { awaiting: null });
      return ask(m, lang, text);
    }

    if (text.length > 400 && (!s.lastInput || detectIntent(text) === "chat")) {
      const words = wordCount(text);
      saveSession(m.chatId, {
        lang,
        lastInput: { kind: "text", title: "Pasted text", text: text.slice(0, cfg.maxTextChars), words, at: now() },
        quiz: null,
      });
      return ui.send(m.chatId, c.textReady({ words }), inputRows(lang, premium));
    }

    const intent = detectIntent(text);
    const hasInput = Boolean(s.lastInput?.text);
    switch (intent) {
      case "greeting":
        return ui.send(m.chatId, c.welcome(m.firstName), menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
      case "thanks":
        return ui.send(m.chatId, lang === "ar" ? "🙏 العفو. ابعت اللي بعده متى ما تحب." : "🙏 Anytime. Send the next thing whenever you're ready.", menuRows(lang, premium));
      case "help":
        return ui.send(m.chatId, c.help, menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
      case "summary":
        return showStyles(m, lang);
      case "quiz":
        return hasInput ? startQuiz(m, lang, 5) : ui.send(m.chatId, c.topicPrompt, menuRows(lang, premium));
      case "cards":
        return flashcards(m, lang);
      case "explain":
        return ask(m, lang, `${text}`);
      case "stats":
        return showMyStats(m, lang);
      case "credits":
        return showQuota(m, lang);
      case "empty":
        return null;
      default:
        return ask(m, lang, text);
    }
  }

  function showQuota(m, lang) {
    const c = copy(lang);
    const s = quota.status(m.userId);
    const body = s.unlimited ? c.unlimited : c.quota(s.left, s.limit);
    return ui.send(m.chatId, `🪙 <b>${lang === "ar" ? "مهامك النهارده" : "Today's tasks"}</b>\n${HR}\n${body}`, menuRows(lang, premium));
  }

  function showMyStats(m, lang) {
    const c = copy(lang);
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const s = {
      activeToday: store.get(`stat:users:${DAY()}`) || 0,
      tasksToday: store.get(`stat:tasks:${DAY()}`) || 0,
      filesToday: store.get(`stat:files:${DAY()}`) || 0,
      quizzesToday: store.get(`stat:quizzes:${DAY()}`) || 0,
    };
    return ui.send(m.chatId, c.stats(s), menuRows(lang, premium, { isAdmin: true }));
  }

  async function command(m) {
    const [raw, arg] = m.text.trim().split(/\s+/, 2);
    const cmd = raw.toLowerCase().replace(/@\w+$/, "");
    const s = session(m.chatId);
    const lang = pickLang(s, m.text);
    const c = copy(lang);
    const admin = quota.isAdmin(m.userId);
    switch (cmd) {
      case "/start": {
        const refMatch = String(m.text || "").match(/^\/start\s+(?:ref_|r_)?(\d+)/i);
        if (refMatch) {
          const referrerId = Number(refMatch[1]);
          if (referrerId && referrerId !== m.userId) {
            const alreadyReferred = store.get(`referred_by:${m.userId}`);
            if (!alreadyReferred) {
              store.set(`referred_by:${m.userId}`, referrerId);
              const day = new Date().toISOString().slice(0, 10);
              const bonusKey = `ref_bonus:${referrerId}:${day}`;
              const bonus = Number(store.get(bonusKey) || 0) + (cfg.referralBonusFiles || 1);
              store.set(bonusKey, bonus, 24 * 3600 * 1000);
              store.set(`ref_today:${referrerId}:${day}`, Number(store.get(`ref_today:${referrerId}:${day}`) || 0) + 1, 24 * 3600 * 1000);
              store.set(`ref_total:${referrerId}`, Number(store.get(`ref_total:${referrerId}`) || 0) + 1);

              const refLang = pickLang(session(referrerId), "");
              const notifyMsg = refLang === "ar"
                ? `🎉 <b>صديق جديد انضم عبر رابطك!</b>\n${HR}\nسجل صديقك <b>${esc(m.firstName || "طالب")}</b> في البوت من خلال رابط الدعوة الخاص بك.\n🎁 <b>حصلت على +${cfg.referralBonusFiles || 1} ملف إضافي لليوم!</b>`
                : `🎉 <b>A friend joined via your invite link!</b>\n${HR}\n<b>${esc(m.firstName || "A student")}</b> joined through your link.\n🎁 <b>You got +${cfg.referralBonusFiles || 1} bonus file for today!</b>`;
              ui.send(referrerId, notifyMsg, menuRows(refLang, premium, { isAdmin: quota.isAdmin(referrerId) })).catch(() => {});
            }
          }
        }
        return ui.send(m.chatId, c.welcome(m.firstName), menuRows(lang, premium, { isAdmin: admin }));
      }
      case "/invite":
      case "/share":
        return showInvite(m, lang);
      case "/menu":
        return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: admin }));
      case "/help":
        return ui.send(m.chatId, c.help, menuRows(lang, premium, { isAdmin: admin }));
      case "/new":
        saveSession(m.chatId, { lastInput: null, quiz: null, awaiting: null, images: [] });
        return ui.send(m.chatId, c.cleared, menuRows(lang, premium, { isAdmin: admin }));
      case "/lang": {
        const next = arg?.toLowerCase() === "ar" ? "ar" : "en";
        saveSession(m.chatId, { lang: next });
        return ui.send(m.chatId, copy(next).langSet, menuRows(next, premium, { isAdmin: admin }));
      }
      case "/quiz": {
        const topic = m.text.trim().slice(raw.length).trim().slice(0, 120);
        if (topic) return startQuiz(m, lang, 5, topic);
        if (!s.lastInput?.text) {
          saveSession(m.chatId, { awaiting: "topic" });
          return ui.send(m.chatId, c.topicPrompt, menuRows(lang, premium));
        }
        return quizCount(m, lang, "pick", "text");
      }
      case "/summary":
        return showStyles(m, lang);
      case "/cards":
        return flashcards(m, lang);
      case "/ask":
        saveSession(m.chatId, { awaiting: "question" });
        return ui.send(m.chatId, c.askPrompt, menuRows(lang, premium));
      case "/plans":
      case "/upgrade":
      case "/pay":
        return showPlans(m, lang);
      case "/txid":
        return onTxId(m, lang, arg || "");
      case "/review":
        return reviewNext(m, lang);
      case "/remind":
        return setReminder(m, lang, arg);
      case "/deck":
        return showDeck(m, lang);
      case "/quota":
      case "/credits":
        return showQuota(m, lang);
      case "/stats":
        return showMyStats(m, lang);
      default:
        return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: admin }));
    }
  }

  async function onCallback(m) {
    const parsed = parseAct(m.data);
    if (!parsed) return ui.ack(m.callbackId);
    if (store.get(`banned:${m.userId}`)) return ui.ack(m.callbackId, copy(pickLang(session(m.chatId), "")).banned.replace(/<[^>]*>/g, "").slice(0, 180));
    if (cfg.requirePhone && !isVerified(m.userId)) return ui.ack(m.callbackId, copy(pickLang(session(m.chatId), "")).contactRequest.slice(0, 180));
    if (HEAVY_ACTIONS.has(parsed.name) && throttled(m.userId)) return ui.ack(m.callbackId, copy(pickLang(session(m.chatId), "")).slowDown);
    const s = session(m.chatId);
    const lang = pickLang(s, "");
    const c = copy(lang);
    const admin = quota.isAdmin(m.userId);
    const [a0, a1] = parsed.args;

    switch (parsed.name) {
      case "menu":
        await ui.ack(m.callbackId);
        return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: admin }));
      case "sum":
        await ui.ack(m.callbackId);
        return showStyles(m, lang);
      case "tpl":
        await ui.ack(m.callbackId);
        return runStyle(m, lang, a0);
      case "docl": {
        const code = ["en", "ar", "bilingual"].includes(a0) ? a0 : "en";
        saveSession(m.chatId, { docLang: code });
        await ui.ack(m.callbackId);
        return showStyles(m, lang);
      }
      case "quiz":
        await ui.ack(m.callbackId);
        return startQuiz(m, lang, Math.min(10, Math.max(3, parseInt(a0, 10) || 5)));
      case "cards":
        await ui.ack(m.callbackId);
        return flashcards(m, lang);
      case "key":
        await ui.ack(m.callbackId);
        return keyPoints(m, lang);
      case "explain":
        await ui.ack(m.callbackId);
        return requireInput(m.chatId, lang) && ask(m, lang, lang === "ar" ? "اشرح الفكرة الأساسية دي ببساطة مع مثال واحد." : "Explain the main idea simply, with one concrete example.");
      case "ask":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { awaiting: "question" });
        return ui.send(m.chatId, c.askPrompt, [[button({ label: c.btn.back, icon: "back", action: act("menu"), premium })]]);
      case "topic":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { awaiting: "topic" });
        return ui.send(m.chatId, c.topicPrompt, [[button({ label: c.btn.back, icon: "back", action: act("menu"), premium })]]);
      case "qa": {
        const r = await answerQuiz(m, Number(a0), Number(a1));
        return ui.ack(m.callbackId, r.stale ? (lang === "ar" ? "الكويز اتغير" : "That question has moved on") : "");
      }
      case "qn": {
        const r = await nextQuestion(m, Number(a0));
        return ui.ack(m.callbackId, r.stale ? (lang === "ar" ? "الكويز اتغير" : "That question has moved on") : "");
      }
      case "lang": {
        const next = a0 === "ar" ? "ar" : "en";
        saveSession(m.chatId, { lang: next });
        await ui.ack(m.callbackId);
        return ui.send(m.chatId, copy(next).langSet, menuRows(next, premium, { isAdmin: admin }));
      }
      case "new":
        saveSession(m.chatId, { lastInput: null, quiz: null, awaiting: null, images: [] });
        await ui.ack(m.callbackId);
        return ui.send(m.chatId, c.cleared, menuRows(lang, premium, { isAdmin: admin }));
      case "pl":
        await ui.ack(m.callbackId);
        return showPlans(m, lang);
      case "cash":
        await ui.ack(m.callbackId);
        return startCashPayment(m, lang, a0);
      case "buy":
        await ui.ack(m.callbackId);
        return buyPlan(m, lang, a0);
      case "rvs":
        await ui.ack(m.callbackId);
        return reviewNext(m, lang);
      case "rv":
        await ui.ack(m.callbackId);
        return a1 === "show" ? reviewShow(m, lang, a0) : reviewGrade(m, lang, a0, a1);
      case "img":
        await ui.ack(m.callbackId);
        return imageAction(m, lang, a0, a1);
      case "qc":
        await ui.ack(m.callbackId);
        return quizCount(m, lang, a0, a1);
      case "fmt":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { outputFormat: ["pdf", "pptx"].includes(a0) ? a0 : "html" });
        return showStyles(m, lang);
      case "help":
        await ui.ack(m.callbackId);
        return ui.send(m.chatId, c.help, menuRows(lang, premium, { isAdmin: admin }));
      case "stats":
        await ui.ack(m.callbackId);
        return showMyStats(m, lang);
      case "credits":
        await ui.ack(m.callbackId);
        return showQuota(m, lang);
      case "inv":
        await ui.ack(m.callbackId);
        return showInvite(m, lang);
      case "sub": {
        const isSub = await checkChannelSubscription(m.userId);
        if (isSub) {
          await ui.ack(m.callbackId, lang === "ar" ? "✅ تم التحقق من اشتراكك بنجاح!" : "✅ Subscription verified!");
          return ui.send(m.chatId, c.welcome(m.firstName), menuRows(lang, premium, { isAdmin: admin }));
        }
        return ui.ack(m.callbackId, lang === "ar" ? "❌ لم تشترك في القناة بعد! اشترك ثم حاول مجدداً." : "❌ You have not joined the channel yet!", true);
      }
      default:
        return ui.ack(m.callbackId);
    }
  }

  // ───────────── public entry points ─────────────

  return {
    /** m: { chatId, userId, firstName, messageId, text, caption, document, photo } */
    async onMessage(m) {
      countUser(m.userId);
      recordUser(m);
      if (store.get(`banned:${m.userId}`)) return ui.send(m.chatId, copy(pickLang(session(m.chatId), "")).banned);
      if (cfg.requirePhone) {
        if (m.contact) return onContact(m);
        if (!isVerified(m.userId)) return askContact(m, pickLang(session(m.chatId), m.text || ""));
      }
      if (cfg.requiredChannel && !quota.isAdmin(m.userId)) {
        const isSub = await checkChannelSubscription(m.userId);
        if (!isSub) {
          const lang = pickLang(session(m.chatId), m.text || m.caption || "");
          return askChannelJoin(m, lang);
        }
      }
      if (m.successfulPayment) return onPaid(m);
      if ((m.document || m.photo || m.text) && throttled(m.userId)) return ui.send(m.chatId, copy(pickLang(session(m.chatId), m.text || "")).slowDown);
      if (m.photo && m.caption && session(m.chatId).lastInput) {
        return attachFigure(m, pickLang(session(m.chatId), m.caption));
      }
      if (m.document || m.photo) {
        const s = session(m.chatId);
        const lang = pickLang(s, m.caption || "");
        return intake(m, lang);
      }
      const text = (m.text || "").trim();
      if (!text) return ui.send(m.chatId, copy(pickLang(session(m.chatId), "")).unsupportedMsg);
      if (text.startsWith("/")) return command({ ...m, text });
      return onText({ ...m, text });
    },

    /** m: { chatId, userId, firstName, messageId, callbackId, data } */
    async onCallback(m) {
      countUser(m.userId);
      recordUser(m);
      if (cfg.requiredChannel && !quota.isAdmin(m.userId)) {
        const parsed = parseAct(m.data);
        if (parsed?.name !== "sub") {
          const isSub = await checkChannelSubscription(m.userId);
          if (!isSub) {
            await ui.ack(m.callbackId);
            const lang = pickLang(session(m.chatId), "");
            return askChannelJoin(m, lang);
          }
        }
      }
      return onCallback(m);
    },

    /** Group messages, only when the bot was addressed (mention, reply, or /command). */
    async onGroupMessage(m) {
      recordUser(m);
      return onGroupMessage(m);
    },
    /** Poll answers from group quizzes: { pollId, userId, name, optionIds }. */
    async onPollAnswer(a) {
      return groups ? groups.onAnswer(a) : { ignored: true };
    },
    /** Stars pre-checkout: true only for a known paid plan. */
    onPreCheckout(query) {
      return checkoutDecision(query);
    },
    /** Applies a successful Stars payment (passed as m.successfulPayment). */
    onPaid(m) {
      return onPaid(m);
    },
    /** Sends due-card reminders. Call it every ten minutes. */
    sendReminders,
    /** Subscription heads-ups and expiry notices. Call it with the reminders. */
    sendRenewalNotices,
    /** Test hooks. */
    _state: { busy },
  };
}
