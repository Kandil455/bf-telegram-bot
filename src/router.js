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
import { adminRows, burnsQuizRows, channelJoinRows, finishRows, inputRows, inviteRows, menuRows, nextRows, quizRows, afterDocumentRows, stylePickerRows } from "./keyboards.js";
import { BURNS_QUIZ_ITEMS, BURNS_QUIZ_TITLE } from "./data/burns-quiz.js";
import { kindOf } from "./services/files.js";
import { renderDocument, renderOsce, previewLines } from "./render/html.js";
import { generateDocument } from "./render/pipeline.js";
import { templateFor } from "./render/templates.js";
import { ensureFigures } from "./render/figures.js";
import { cachedSummary } from "./services/summary-cache.js";
import { shrinkImage } from "./media/shrink.js";
import { buildDailyReport } from "./features/daily-report.js";
import { PLANS } from "./services/plans.js";
import { applyPayment, checkoutDecision, sendPlanInvoice } from "./features/payments.js";
import { conceptsPrompt, cardsPrompt, quizPrompt, explainPrompt, groundedAnswerPrompt, chatPrompt, groupQuizPrompt } from "./prompts/index.js";
import { suggestedPages } from "./prompts/summary.js";
import { stripMention } from "./features/groups.js";
import { qualityPass, topUpQuiz } from "./quality/quiz.js";
import { randomBytes } from "node:crypto";
import { markNotice, renewalNotices } from "./features/subscriptions.js";
import { normaliseDigits } from "./features/cash.js";
import { humanize } from "./services/quota.js";

const HEAVY_ACTIONS = new Set(["sum", "quiz", "cards", "key", "tpl", "qc", "img", "ask", "explain", "pod", "cash", "buy", "qbatch"]);

const DOC_TTL = 7 * 24 * 3600 * 1000;
// Summary results are reused for a week; see services/summary-cache.js for the key.
let summaryCache = null;
const DAY = () => new Date().toISOString().slice(0, 10);

export function createRouter({ cfg, ui, store, ai, quota, files, getFilePath, plans = null, decks = null, groups = null, cash = null, media = null, ent = null, logger = console, now = () => Date.now() }) {
  const maxQDefault = Number(cfg?.maxQuestionsPerFile) || 30;
  const entitle = ent || {
    takeFileSlot: () => ({ ok: true }),
    allowedQuizSizes: () => (maxQDefault > 30 ? [5, 10, 15, 20, 30, 50, 100, 200, 500] : [5, 10, 15, 20, 30]),
    clampQuizSize: (s, n) => Math.min(Number(n) || 5, maxQDefault),
    questionsLeft: () => maxQDefault,
  };
  summaryCache = cachedSummary(store, { onHit: () => {} });
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

  function trackTokens(userId, usage) {
    const total = Number(usage?.totalTokens) || 0;
    if (total > 0 && typeof quota?.consumeTokens === "function") {
      return quota.consumeTokens(userId, total);
    }
    return null;
  }

  // ───────────── delivery helpers ─────────────

  function quotaFooter(userId, lang) {
    const c = copy(lang);
    const s = quota.status(userId);
    const base = s.unlimited ? `\n${HR}\n${c.unlimited}` : `\n${HR}\n${c.quota(s.left, s.limit)}`;
    const tok = typeof quota.tokenStatus === "function" ? quota.tokenStatus(userId) : null;
    if (!tok || tok.used <= 0) return base;
    const tokLine = tok.unlimited
      ? (lang === "ar" ? `\n⚡ <i>التوكنز المستهلكة اليوم: ${tok.used.toLocaleString("en-US")} توكن (غير محدود)</i>` : `\n⚡ <i>Tokens used today: ${tok.used.toLocaleString("en-US")} (unlimited)</i>`)
      : (lang === "ar"
          ? `\n⚡ <i>التوكنز: استهلكت ${tok.used.toLocaleString("en-US")} · متبقي ${tok.left.toLocaleString("en-US")} توكن</i>`
          : `\n⚡ <i>Tokens: ${tok.used.toLocaleString("en-US")} used · ${tok.left.toLocaleString("en-US")} left</i>`);
    return `${base}${tokLine}`;
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
   * Runs one metered task. `work` returns { html, rows?, after?, file?, usage? } or null on failure.
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
      if (out.usage) trackTokens(userId, out.usage);
      stat("tasks");
      await deliver(chatId, msgId, out.html + quotaFooter(userId, lang), out.rows);
      if (out.after) await out.after(msgId);
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
      const sugPages = suggestedPages(words);
      saveSession(m.chatId, {
        lang,
        lastInput: { kind: result.kind, title: result.title, text: result.text, words, suggestedPages: sugPages, at: now() },
        quiz: null,
        awaiting: null,
        questionsUsed: 0,
        remainingQuizTotal: 0,
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
        return { html: `💡 <b>Key points · ${esc(input.title)}</b>\n${HR}\n${sanitizeHtml(r.text)}`, rows: inputRows(lang, premium), usage: r.usage };
      },
    });
  }

  async function explainLecture(m, lang) {
    const input = requireInput(m.chatId, lang);
    if (!input) return;
    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: 1,
      label: copy(lang).thinking,
      work: async () => {
        const r = await ai.complete(explainPrompt({ lang, source: input.text, title: input.title }));
        if (!r) return null;
        const head = lang === "ar" ? `📚 <b>شرح تفصيلي · ${esc(input.title)}</b>` : `📚 <b>Deep Explanation · ${esc(input.title)}</b>`;
        return { html: `${head}\n${HR}\n${sanitizeHtml(r.text)}`, rows: inputRows(lang, premium), usage: r.usage };
      },
    });
  }

  async function podcastLecture(m, lang) {
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
        const prompt = {
          system: [
            "You are the producer of Black Fighters Medical & Academic Podcast.",
            "Write an engaging, high-yield 2-host podcast episode script (🎙️ د. أحمد [Professor] & 🎓 سارة [Sharp Student]) explaining every concept, mechanism, comparison, and exam trap in the SOURCE.",
            "POSITIVES (DO): divide into numbered Parts; use <b>bold</b> for speaker names and medical/technical terms; explain mechanisms simply; end each part with a quick rapid-fire exam question between the hosts.",
            "NEGATIVES (DON'T): never invent facts outside the SOURCE; never use markdown (** or #); use clean Telegram HTML (<b>, <i>, <code>).",
          ].join("\n"),
          user: `Lecture Title: ${input.title}\nLanguage: ${lang === "ar" ? "Natural Egyptian/Modern Arabic with English medical terms in brackets" : "Engaging English"}\nSOURCE:\n"""\n${String(input.text).slice(0, 18000)}\n"""`,
          maxTokens: 3000,
        };
        const r = await ai.complete(prompt);
        if (!r) return null;
        const head = lang === "ar" ? `🎙️ <b>بودكاست المحاضرة · ${esc(input.title)}</b>` : `🎙️ <b>Lecture Podcast · ${esc(input.title)}</b>`;
        return { html: `${head}\n${HR}\n${sanitizeHtml(r.text)}`, rows: inputRows(lang, premium), usage: r.usage };
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
        return { html: `🗂️ <b>Flashcards · ${esc(input.title)}</b>\n<i>${c.cardsHint}</i>\n${HR}\n${body}${deckLine}`, rows: inputRows(lang, premium), usage: r?.usage };
      },
    });
  }

  /** Renders a standalone HTML Quiz Bank file when a user generates a large quiz (e.g. 30-500 questions). */
  function renderQuizBankHtml(title, items, lang) {
    const letters = ["A", "B", "C", "D"];
    const dir = lang === "ar" ? "rtl" : "ltr";
    const cards = items.map((it, idx) => {
      const opts = it.options.map((o, i) => `<li style="padding:4px 8px;margin:3px 0;border-radius:4px;${i === it.answer ? "background:#fde047;color:#000;font-weight:700;" : ""}"><b>${letters[i]})</b> ${esc(o)}${i === it.answer ? " ✓" : ""}</li>`).join("");
      return `<div style="border:1px solid #cbd5e1;border-radius:8px;padding:14px;margin:12px 0;background:#fff;break-inside:avoid">
        <div style="font-weight:800;color:#0f172a;margin-bottom:8px">Q${idx + 1}. ${esc(it.q)}</div>
        <ul style="list-style:none;padding:0;margin:0">${opts}</ul>
        ${it.explanation ? `<div style="margin-top:8px;font-size:13.5px;color:#334155;background:#f8fafc;padding:6px 10px;border-radius:4px">💡 <b>Explanation:</b> ${esc(it.explanation)}</div>` : ""}
      </div>`;
    }).join("\n");
    return `<!doctype html><html lang="${lang === "ar" ? "ar" : "en"}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(title)} - Quiz Bank (${items.length} Qs)</title></head><body style="font-family:Inter,system-ui,sans-serif;background:#f1f5f9;color:#0f172a;padding:24px"><main style="max-width:860px;margin:0 auto;background:#fff;padding:36px;border-radius:10px;border:1px solid #cbd5e1"><h1>🧠 ${esc(title)} · Quiz Bank (${items.length} Questions)</h1><hr>${cards}</main></body></html>`;
  }

  async function startQuiz(m, lang, count, topic = null) {
    const c = copy(lang);
    const input = topic ? null : requireInput(m.chatId, lang);
    if (!topic && !input) return;
    const s = session(m.chatId);
    const requestedTotal = topic ? Math.min(500, Math.max(1, Number(count) || 5)) : entitle.clampQuizSize(s, count);
    if (!requestedTotal) return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));

    // Batch in chunks of at most 50 questions per interactive round so 50..500 Qs run at lightning speed
    const batchSize = Math.min(50, requestedTotal);
    const remainingAfterThis = Math.max(0, requestedTotal - batchSize);

    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: 1,
      label: c.thinking,
      work: async () => {
        const subBatchMax = 25;
        let collected = [];
        let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        const srcText = input?.text || "";
        const rounds = Math.ceil(batchSize / subBatchMax);

        for (let rIdx = 0; rIdx < rounds; rIdx++) {
          const needNow = Math.min(subBatchMax, batchSize - collected.length);
          if (needNow <= 0) break;
          // Language contract: If the source lecture is in English, generate the quiz in English!
          const sourceLang = (srcText && detectLang(srcText)) || (topic && detectLang(topic)) || "en";
          const promptLang = sourceLang === "ar" ? "ar" : "en";

          // Slice different windows of long source text for multi-batch variety
          const sliceStart = rounds > 1 && srcText.length > 6000 ? Math.floor((rIdx / rounds) * Math.max(0, srcText.length - 6000)) : 0;
          const sliceText = srcText ? srcText.slice(sliceStart, sliceStart + 14000) : "";
          const avoidList = collected.map((x) => x.q);
          const r = await ai.complete(quizPrompt({ lang: promptLang, source: sliceText, count: needNow, topic, avoid: avoidList }));
          if (r?.usage) {
            totalUsage.promptTokens += r.usage.promptTokens || 0;
            totalUsage.completionTokens += r.usage.completionTokens || 0;
            totalUsage.totalTokens += r.usage.totalTokens || 0;
          }
          let partItems = normaliseQuiz(parseJsonLoose(r?.text), needNow);
          if (partItems.length) {
            partItems = await topUpQuiz({ ai, items: partItems, count: needNow, source: sliceText || topic, lang: promptLang, topic });
            collected.push(...partItems);
          }
        }

        if (!collected.length) return null;
        const sourceLang = (srcText && detectLang(srcText)) || (topic && detectLang(topic)) || "en";
        const promptLang = sourceLang === "ar" ? "ar" : "en";
        const { items } = await qualityPass({ items: collected.slice(0, batchSize), source: input?.text || topic, lang: promptLang, ai, verify: cfg.quizVerify !== false && batchSize <= 15 });
        if (!items.length) return null;

        const timerSec = Number(s.quizTimer || 0);
        if (timerSec > 0 && groups) {
          await groups.start(m.chatId, items, timerSec);
          const badge = lang === "ar"
            ? `⏱️ <b>بدأ كويز باستفتاءات تيليجرام بمؤقت (${timerSec} ثانية لكل سؤال)!</b>\n${HR}\nإجمالي: <b>${items.length} سؤال</b>.\nانطلق بالحل في استفتاء تيليجرام بالأسفل بمؤقت تيليجرام 👇`
            : `⏱️ <b>Telegram Quiz Polls started (${timerSec}s timer)!</b>\n${HR}\nTotal: <b>${items.length} questions</b>.\nAnswer the question in the Telegram poll below 👇`;
          return {
            html: badge,
            rows: null,
            file: bankFile,
            usage: totalUsage,
            after: () => {
              saveSession(m.chatId, {
                awaiting: null,
                questionsUsed: Number(session(m.chatId).questionsUsed || 0) + items.length,
                remainingQuizTotal: remainingAfterThis,
                lastQuizTopic: topic,
                lastQuizTitle: topic || input?.title || "Quiz",
              });
            },
          };
        }

        const quiz = { items, index: 0, score: 0, answered: -1, title: topic || input.title, wrongItems: [], timerSec: 0 };
        const qid = cfg.appUrl ? randomBytes(8).toString("hex") : null;
        const batchBadge = remainingAfterThis > 0
          ? (lang === "ar" ? `\n📦 <b>دفعة 1 (${items.length} سؤال)</b> من إجمالي <b>${requestedTotal}</b> سؤال (باقي ${remainingAfterThis} سؤال في الدفعات التالية)` : `\n📦 <b>Batch 1 (${items.length} Qs)</b> of <b>${requestedTotal}</b> total (${remainingAfterThis} left in next batches)`)
          : "";
        const bankFile = items.length >= 25
          ? {
              html: renderQuizBankHtml(quiz.title, items, lang),
              name: `${slug(quiz.title)}-quiz-${items.length}q.html`,
              caption: lang === "ar" ? `📎 بنك الأسئلة (${items.length} سؤال بالإجابات والتفسير) جاهز للتحميل والمراجعة` : `📎 Quiz Bank (${items.length} Qs with answers & explanations)`,
            }
          : null;

        return {
          html: `${c.quizIntro(items.length)}${batchBadge}\n\n${c.quizQuestion({ index: 1, total: items.length, q: items[0].q })}`,
          rows: [...quizRows(0, items[0].options, premium), ...appRows(qid, lang)],
          file: bankFile,
          usage: totalUsage,
          after: (taskMsgId) => {
            if (qid) store.set(`appquiz:${qid}`, { userId: m.userId, items, at: now() }, 2 * 3600 * 1000);
            saveSession(m.chatId, {
              quiz,
              quizMsgId: taskMsgId,
              awaiting: null,
              questionsUsed: Number(session(m.chatId).questionsUsed || 0) + items.length,
              lastQuizTitle: quiz.title,
              remainingQuizTotal: remainingAfterThis,
              lastQuizTopic: topic,
            });
          },
        };
      },
    });
  }

  // ───────────── quiz state machine ─────────────

  const activeQuizTimers = new Map();

  function clearActiveTimer(chatId) {
    const handle = activeQuizTimers.get(chatId);
    if (handle) {
      clearTimeout(handle);
      activeQuizTimers.delete(chatId);
    }
  }

  function armQuestionTimer(chatId, qIndex, sec) {
    clearActiveTimer(chatId);
    if (!sec || sec <= 0) return;
    const handle = setTimeout(async () => {
      activeQuizTimers.delete(chatId);
      await timeoutQuestion(chatId, qIndex);
    }, sec * 1000);
    activeQuizTimers.set(chatId, handle);
  }

  async function timeoutQuestion(chatId, qIndex) {
    const s = session(chatId);
    const quiz = s.quiz;
    if (!quiz || quiz.index !== qIndex || quiz.answered === qIndex) return;

    const lang = pickLang(s, "");
    const c = copy(lang);
    const item = quiz.items[qIndex];
    quiz.answered = qIndex;
    quiz.streak = 0;
    quiz.wrongItems = quiz.wrongItems || [];
    if (!quiz.wrongItems.some((w) => w.q === item.q)) {
      quiz.wrongItems.push(item);
    }
    saveSession(chatId, { quiz });

    const stem = `🧠 <b>${lang === "ar" ? `سؤال ${qIndex + 1} من ${quiz.items.length}` : `Question ${qIndex + 1} of ${quiz.items.length}`}</b>\n${HR}\n<b>${esc(item.q)}</b>`;
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const timeOutMsg = lang === "ar"
      ? `⏰ <b>انتهى الوقت المخصص للسؤال (${quiz.timerSec} ثانية)!</b>\n✅ <b>الإجابة الصحيحة:</b> <b>(${letters[item.answer] || ""})</b> <b>${esc(item.options[item.answer])}</b>${item.explanation ? `\n\n💡 <i>${esc(item.explanation)}</i>` : ""}`
      : `⏰ <b>Time's up (${quiz.timerSec}s)!</b>\n✅ <b>Correct answer:</b> <b>(${letters[item.answer] || ""})</b> <b>${esc(item.options[item.answer])}</b>${item.explanation ? `\n\n💡 <i>${esc(item.explanation)}</i>` : ""}`;
    const isLast = qIndex === quiz.items.length - 1;
    const msgId = s.quizMsgId;
    if (msgId) {
      await ui.edit(chatId, msgId, `${stem}\n${HR}\n${timeOutMsg}`, nextRows(lang, premium, qIndex, isLast)).catch(() => {});
    }
  }

  async function answerQuiz(m, qIndex, choice) {
    clearActiveTimer(m.chatId);
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
    if (!correct) {
      quiz.wrongItems = quiz.wrongItems || [];
      if (!quiz.wrongItems.some((w) => w.q === item.q)) {
        quiz.wrongItems.push(item);
      }
    }
    saveSession(m.chatId, { quiz });

    const stem = `🧠 <b>${lang === "ar" ? `سؤال ${qIndex + 1} من ${quiz.items.length}` : `Question ${qIndex + 1} of ${quiz.items.length}`}</b>\n${HR}\n<b>${esc(item.q)}</b>`;
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const verdict = correct
      ? c.right(item.explanation)
      : (lang === "ar"
          ? `❌ <b>إجابة غير صحيحة.</b>\n• إجابتك: <b>(${letters[choice] || ""})</b> ${esc(item.options[choice] || "")}\n• الصحيح: <b>(${letters[item.answer] || ""})</b> <b>${esc(item.options[item.answer])}</b>${item.explanation ? `\n\n💡 <i>${esc(item.explanation)}</i>` : ""}`
          : `❌ <b>Not quite.</b>\n• Your answer: <b>(${letters[choice] || ""})</b> ${esc(item.options[choice] || "")}\n• Correct: <b>(${letters[item.answer] || ""})</b> <b>${esc(item.options[item.answer])}</b>${item.explanation ? `\n\n💡 <i>${esc(item.explanation)}</i>` : ""}`);
    const isLast = qIndex === quiz.items.length - 1;
    await ui.edit(m.chatId, m.messageId, `${stem}\n${HR}\n${verdict}`, nextRows(lang, premium, qIndex, isLast));
    if (correct && quiz.streak >= 3 && quiz.streak % 3 === 0) await ui.sendWithEffect(m.chatId, c.streak(quiz.streak), null, EFFECT.fire);
    return { ok: true };
  }

  async function nextQuestion(m, qIndex) {
    clearActiveTimer(m.chatId);
    const s = session(m.chatId);
    const quiz = s.quiz;
    const lang = pickLang(s, "");
    const c = copy(lang);
    if (!quiz || quiz.index !== qIndex || quiz.answered !== qIndex) return { stale: true };

    ui.clearKeyboard(m.chatId, m.messageId).catch(() => {});
    if (qIndex + 1 < quiz.items.length) {
      quiz.index = qIndex + 1;
      const item = quiz.items[quiz.index];
      const html = c.quizQuestion({ index: quiz.index + 1, total: quiz.items.length, q: item.q, options: item.options });
      const sentMsgId = await ui.send(m.chatId, `${html}\n${HR}\n${progress(quiz.index, quiz.items.length)}`, quizRows(quiz.index, item.options, premium));
      saveSession(m.chatId, { quiz, quizMsgId: sentMsgId });
      return { ok: true };
    }

    const wrongItems = quiz.wrongItems || [];
    const remaining = Number(s.remainingQuizTotal || 0);
    saveSession(m.chatId, {
      quiz: null,
      quizMsgId: null,
      retryQuizItems: wrongItems.length ? wrongItems : null,
      lastQuizTitle: quiz.title,
    });
    stat("quizzes");
    await ui.sendWithEffect(
      m.chatId,
      c.quizDone(quiz.score, quiz.items.length),
      finishRows(lang, premium, wrongItems.length, remaining),
      quiz.score === quiz.items.length ? EFFECT.confetti : EFFECT.fire
    );
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
      if (r.usage) trackTokens(m.userId, r.usage);
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
    const input = s0.lastInput;
    if (!input?.text) return ui.send(m.chatId, copy(lang).noInput, menuRows(lang, premium));
    const docLang = s0.docLang || "en";
    const sug = input.suggestedPages || suggestedPages(input.words || wordCount(input.text));
    const chosenPages = s0.targetPages || null;
    const pageInfo = lang === "ar"
      ? `\n\n📄 <b>عدد الصفحات المقترح للمحاضرة:</b> <b>${sug} صفحات</b>${chosenPages ? ` · المختار حالياً: <b>${chosenPages} صفحات</b>` : ""}`
      : `\n\n📄 <b>Suggested length:</b> <b>${sug} page(s)</b>${chosenPages ? ` · Selected: <b>${chosenPages} page(s)</b>` : ""}`;
    return ui.send(
      m.chatId,
      `${copy(lang).styles}${pageInfo}`,
      stylePickerRows(lang, premium, docLang, s0.outputFormat || "html", s0.detail || "standard", chosenPages, sug)
    );
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
    const pages = s.targetPages || null;

    await runTask({
      chatId: m.chatId,
      userId: m.userId,
      lang,
      cost: tpl.cost,
      label: c.writing,
      work: async () => {
        const cached = await summaryCache(
          { text: input.text, template: id, lang: docLang, detail: pages ? `p${pages}` : (s.detail || "standard"), images },
          async () => {
            const sent = await Promise.all(images.map(async (i) => {
              if (!i.b64) return i;
              const small = await shrinkImage({ buffer: Buffer.from(i.b64, "base64"), mime: i.mime });
              return { ...i, mime: small.mime, b64: small.buffer.toString("base64") };
            }));
            return generateDocument({ ai, template: id, lang: docLang, title: input.title, text: input.text, images: sent, detail: s.detail || "standard", pages });
          }
        );
        const gen = cached;
        if (!gen) return null;
        if (cached?.cached) stat("cache_hits");
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
          usage: cached?.cached ? null : gen.usage,
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
    if (cash?.enabled) rows.push([button({ label: lang === "ar" ? "🧾 ابعت رقم العملية (فودافون كاش / فوري)" : "🧾 Send transaction ID", icon: "file", action: act("txid"), premium })]);
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
    saveSession(m.chatId, { awaiting: "txid" });
    const name = PLANS[planId].name[lang] || PLANS[planId].name.en;
    const rows = [
      [button({ label: lang === "ar" ? "🧾 ابعت رقم العملية (TxID)" : "🧾 Send transaction ID", icon: "file", action: act("txid"), premium })],
      [button({ label: c.btn.menu, icon: "home", action: act("menu"), premium })],
    ];
    return ui.send(m.chatId, c.cashStart(name, intent.amount, intent.number, 30), rows);
  }

  function onTxId(m, lang, raw) {
    const c = copy(lang);
    if (!cash?.enabled) return ui.send(m.chatId, c.cashOff, menuRows(lang, premium));
    if (!cash.intent(m.userId) && PLANS.pro) {
      cash.start(m.userId, "pro");
    }
    const cleanId = String(raw || "").replace(/\D/g, "");
    if (quota.isAdmin(m.userId) && cleanId.length >= 6) {
      store.set(`cash:used:${cleanId}`, m.userId, 90 * 24 * 3600 * 1000);
      const grant = plans.grant(m.userId, "pro", PLANS.pro.days);
      return ui.send(m.chatId, `🎉 <b>${PLANS.pro.name[lang] || PLANS.pro.name.en} اتفعّل (وضع الأدمن / تجريبي)</b>\n${HR}\nساري لحد <b>${new Date(grant.until).toISOString().slice(0, 10)}</b>.`, menuRows(lang, premium, { isAdmin: true }));
    }
    const r = cash.claim(m.userId, raw);
    switch (r.status) {
      case "ok":
        notifyAdmins(`💸 <b>تم استلام دفع فودافون كاش / فوري وتفعيله تلقائياً!</b>\n${HR}\n👤 ${esc(m.firstName || "طالب")} (${m.userId})\n🧾 رقم العملية: <code>${cleanId}</code>\n📦 باقة: ${PLANS[r.grant.plan].name.en}`);
        return ui.send(m.chatId, c.cashOk(PLANS[r.grant.plan].name[lang] || PLANS[r.grant.plan].name.en, new Date(r.grant.until).toISOString().slice(0, 10)), menuRows(lang, premium, { isAdmin: quota.isAdmin(m.userId) }));
      case "pending": {
        const pendingKey = `cash:pending:${cleanId}`;
        if (!store.get(pendingKey)) {
          store.set(pendingKey, { userId: m.userId, firstName: m.firstName, txId: cleanId, at: now() }, 7 * 24 * 3600 * 1000);
          const adminAlert = lang === "ar"
            ? `🔔 <b>طلب تفعيل فودافون كاش / فوري للمراجعة!</b>\n${HR}\n👤 <b>الطالب:</b> ${esc(m.firstName || "طالب")} (<code>${m.userId}</code>)\n🧾 <b>رقم العملية:</b> <code>${cleanId}</code>\n\n<i>لو التحويل وصلك، اضغط اعتماد لتفعيل الباقة فوراً:</i>`
            : `🔔 <b>New Vodafone Cash / Fawry payment to review!</b>\n${HR}\n👤 <b>Student:</b> ${esc(m.firstName || "Student")} (<code>${m.userId}</code>)\n🧾 <b>TxID:</b> <code>${cleanId}</code>\n\n<i>Click approve if received:</i>`;
          const rows = [
            [button({ label: "✅ اعتماد وتفعيل الباقة", icon: "credits", action: act("adm_cok", String(m.userId), cleanId), style: "primary", premium })],
            [button({ label: "❌ رفض", icon: "back", action: act("adm_cno", String(m.userId), cleanId), style: "danger", premium })],
          ];
          for (const id of cfg.adminIds || []) ui.send(id, adminAlert, rows).catch(() => {});
        }
        return ui.send(m.chatId, c.cashPending);
      }
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
    if (groups && (/^\/burns\b/i.test(text) || /^\/burnquiz\b/i.test(text))) {
      if (!quota.isAdmin(m.userId)) return null;
      if (groups.get(m.chatId)) return ui.send(m.chatId, c.groupBusy);
      const match = text.match(/\b(?:burns|burnquiz)\s*(\d+)?/i);
      const openPeriod = match && match[1] ? Number(match[1]) : 45;
      await groups.start(m.chatId, BURNS_QUIZ_ITEMS, openPeriod);
      return ui.send(m.chatId, lang === "ar" ? `🔥 <b>تم بدء كويز الحروق (${BURNS_QUIZ_ITEMS.length} سؤال)!</b>\n⏱️ المؤقت: <b>${openPeriod} ثانية</b> لكل سؤال.` : `🔥 <b>Started Burns Quiz (${BURNS_QUIZ_ITEMS.length} Qs)!</b>\n⏱️ Timer: <b>${openPeriod}s</b> per question.`);
    }
    const question = stripMention(text, cfg.botUsername);
    if (!question) return null;
    const r = await ai.complete(m.replyText ? groundedAnswerPrompt({ lang, material: m.replyText, question }) : chatPrompt({ lang, question }));
    return ui.send(m.chatId, r ? sanitizeHtml(r.text) : c.failed);
  }

  // ───────────── images, quiz sizes, timers and output formats ─────────────

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

  function sizeRows(lang, userId, source, sessionObj) {
    const sizes = entitle.allowedQuizSizes(sessionObj, userId);
    const row = sizes.map((n) => button({ label: String(n), icon: "quiz", action: act("qc", String(n), source), style: "primary", premium }));
    if (!row.length) return null;
    const rows = [];
    for (let i = 0; i < row.length; i += 3) rows.push(row.slice(i, i + 3));
    const ar = lang === "ar";
    const hasTimer = Number(sessionObj?.quizTimer || 0) > 0;
    // Note: Keep non-size button labels free of digits so test/flow.test.js regex matching on size buttons stays exact!
    rows.push([
      button({ label: ar ? "✏️ اكتب عدد الأسئلة" : "✏️ Custom question count", icon: "quiz", action: act("qcustom", source), style: "success", premium }),
      button({ label: ar ? (hasTimer ? "⏱️ مؤقت السؤال (مفعّل)" : "⏱️ تشغيل بمؤقت") : (hasTimer ? "⏱️ Question Timer (On)" : "⏱️ Set Timer"), icon: "clock", action: act("qtimer", "menu", source), style: hasTimer ? "primary" : null, premium }),
    ]);
    rows.push([button({ label: copy(lang).btn.back, icon: "back", action: act("menu"), premium })]);
    return rows;
  }

  function showTimerPicker(m, lang, source = "text") {
    const ar = lang === "ar";
    const cur = Number(session(m.chatId).quizTimer || 0);
    const row1 = [
      button({
        label: ar ? "🎯 بدون مؤقت" : "🎯 No timer",
        icon: "done",
        action: act("qtimer", "0", source),
        style: cur === 0 ? "success" : null,
        premium,
      }),
      button({
        label: ar ? "⏱️ 30 ثانية" : "⏱️ 30s Timer",
        icon: "clock",
        action: act("qtimer", "30", source),
        style: cur === 30 ? "primary" : null,
        premium,
      }),
    ];
    const row2 = [
      button({
        label: ar ? "⏱️ 45 ثانية" : "⏱️ 45s Timer",
        icon: "clock",
        action: act("qtimer", "45", source),
        style: cur === 45 ? "primary" : null,
        premium,
      }),
      button({
        label: ar ? "⏱️ 60 ثانية" : "⏱️ 60s Timer",
        icon: "clock",
        action: act("qtimer", "60", source),
        style: cur === 60 ? "primary" : null,
        premium,
      }),
    ];
    const row3 = [
      button({ label: ar ? "✏️ وقت مخصص بالثواني" : "✏️ Custom seconds", icon: "clock", action: act("qtimer", "custom", source), premium }),
      button({ label: copy(lang).btn.back, icon: "back", action: act("qc", "pick", source), premium }),
    ];
    const rows = [row1, row2, row3];
    const text = ar
      ? `⏱️ <b>اختر نظام المؤقت للاختبار</b>\n${HR}\nالمؤقت الحالي: <b>${cur ? `${cur} ثانية لكل سؤال` : "🎯 بدون مؤقت (حل براحتك)"}</b>.\nاختر الوضع المفضل لبدء الاختبار:`
      : `⏱️ <b>Quiz Question Timer</b>\n${HR}\nCurrent timer: <b>${cur ? `${cur}s per question` : "🎯 Untimed (No timer)"}</b>.\nChoose your preferred timer mode:`;
    return ui.send(m.chatId, text, rows);
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
      const timerSec = Number(s.quizTimer || 0);
      const timerNote = timerSec > 0
        ? (lang === "ar" ? `\n\n⏱️ <b>المؤقت المفعّل:</b> <b>${timerSec} ثانية</b> لكل سؤال.` : `\n\n⏱️ <b>Active timer:</b> <b>${timerSec}s</b> per question.`)
        : (lang === "ar" ? `\n\n🎯 <b>وضع الاختبار:</b> <b>بدون مؤقت</b> (حل براحتك). تقدر تضغط "⏱️ تشغيل بمؤقت" لتفعيله!` : `\n\n🎯 <b>Mode:</b> <b>No timer</b>. Tap "⏱️ Set Timer" to activate!`);
      return ui.send(m.chatId, `${c.quizPick(source, entitle.questionsLeft(s))}${timerNote}`, rows);
    }
    const n = Number(a0);
    if (!entitle.allowedQuizSizes(s, m.userId).includes(n) && n !== 0 && (Number(cfg?.maxQuestionsPerFile) || 30) <= 30) {
      return ui.send(m.chatId, c.budgetDone, menuRows(lang, premium));
    }
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
      const quiz = { items: made.items, index: 0, score: 0, answered: -1, title: "images", wrongItems: [] };
      saveSession(m.chatId, { quiz, awaiting: null, questionsUsed: Number(s.questionsUsed || 0) + made.items.length, lastQuizTitle: "images" });
      await ui.edit(m.chatId, msgId, `${c.quizIntro(made.items.length)}\n\n${c.quizQuestion({ index: 1, total: made.items.length, q: made.items[0].q, options: made.items[0].options })}`, quizRows(0, made.items[0].options, premium));
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

  /** One report per day to every admin, with the day's counters and AI health. */
  async function sendDailyReport({ aiToday = null, day = null } = {}) {
    const targetDay = day || new Date(now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    if (store.get(`report:sent:${targetDay}`)) return 0;
    const text = buildDailyReport({
      dayLabel: targetDay,
      activeUsers: store.get(`stat:users:${targetDay}`) || 0,
      tasks: store.get(`stat:tasks:${targetDay}`) || 0,
      files: store.get(`stat:files:${targetDay}`) || 0,
      quizzes: store.get(`stat:quizzes:${targetDay}`) || 0,
      cacheHits: store.get(`stat:cache_hits:${targetDay}`) || 0,
      ai: aiToday || store.get(`metric:ai:${targetDay}`) || { ok: 0, failed: 0, totalMs: 0, byProvider: {} },
      lang: "en",
    });
    for (const id of cfg.adminIds || []) await ui.send(id, text).catch(() => {});
    store.set(`report:sent:${targetDay}`, true, 3 * 24 * 3600 * 1000);
    return 1;
  }

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

    // Custom interactive awaits for user & in-bot admin controls
    if (s.awaiting === "pages") {
      const n = Math.min(25, Math.max(1, parseInt(normaliseDigits(text), 10) || 4));
      saveSession(m.chatId, { awaiting: null, targetPages: n });
      return showStyles(m, lang);
    }
    if (s.awaiting === "quiz_count") {
      const maxAllowed = Number(cfg?.maxQuestionsPerFile) || 500;
      const n = Math.min(maxAllowed, Math.max(1, parseInt(normaliseDigits(text), 10) || 10));
      const src = s.quizCountSource || "text";
      saveSession(m.chatId, { awaiting: null });
      if (src === "images") return runImageQuiz(m, lang, n);
      return startQuiz(m, lang, n);
    }
    if (s.awaiting === "quiz_timer") {
      const sec = Math.min(600, Math.max(0, parseInt(normaliseDigits(text), 10) || 0));
      const src = s.quizCountSource || "text";
      saveSession(m.chatId, { awaiting: null, quizTimer: sec });
      return quizCount(m, lang, "pick", src);
    }
    if (s.awaiting === "admin_broadcast" && quota.isAdmin(m.userId)) {
      saveSession(m.chatId, { awaiting: null });
      return runAdminBroadcast(m, lang, text);
    }
    if (s.awaiting === "admin_grant" && quota.isAdmin(m.userId)) {
      saveSession(m.chatId, { awaiting: null });
      return runAdminGrantText(m, lang, text);
    }
    if (s.awaiting === "admin_ban" && quota.isAdmin(m.userId)) {
      saveSession(m.chatId, { awaiting: null });
      return runAdminBanText(m, lang, text);
    }
    if (s.awaiting === "admin_reset" && quota.isAdmin(m.userId)) {
      saveSession(m.chatId, { awaiting: null });
      return runAdminResetText(m, lang, text);
    }

    if (s.awaiting === "topic") {
      saveSession(m.chatId, { awaiting: null });
      return startQuiz(m, lang, 5, text.slice(0, 120));
    }
    if (s.awaiting === "txid") {
      saveSession(m.chatId, { awaiting: null });
      return onTxId(m, lang, text.trim().split(/\s+/)[0] || "");
    }
    const pureDigits = normaliseDigits(text).trim();
    if (cash?.enabled && /^\d{6,25}$/.test(pureDigits)) {
      saveSession(m.chatId, { awaiting: null });
      return onTxId(m, lang, pureDigits);
    }
    if (s.awaiting === "question") {
      saveSession(m.chatId, { awaiting: null });
      return ask(m, lang, text);
    }

    if (text.length > 400 && (!s.lastInput || detectIntent(text) === "chat")) {
      const words = wordCount(text);
      const sugPages = suggestedPages(words);
      saveSession(m.chatId, {
        lang,
        lastInput: { kind: "text", title: "Pasted text", text: text.slice(0, cfg.maxTextChars), words, suggestedPages: sugPages, at: now() },
        quiz: null,
        questionsUsed: 0,
        remainingQuizTotal: 0,
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
        return hasInput ? explainLecture(m, lang) : ask(m, lang, `${text}`);
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
    const tok = typeof quota.tokenStatus === "function" ? quota.tokenStatus(m.userId) : null;
    const tokBlock = tok
      ? (lang === "ar"
          ? `\n\n⚡ <b>حساب التوكنز (AI Tokens):</b>\n• المستهلك اليوم: <b>${tok.used.toLocaleString("en-US")}</b> توكن\n• المتبقي اليوم: <b>${tok.unlimited ? "غير محدود 👑" : tok.left.toLocaleString("en-US")}</b> توكن\n• محفظة التوكنز الإضافية: <b>${(tok.wallet || 0).toLocaleString("en-US")}</b> توكن\n• إجمالي استهلاكك الكلي: <b>${(tok.totalUsed || 0).toLocaleString("en-US")}</b> توكن`
          : `\n\n⚡ <b>AI Token Balance:</b>\n• Used today: <b>${tok.used.toLocaleString("en-US")}</b> tokens\n• Remaining today: <b>${tok.unlimited ? "Unlimited 👑" : tok.left.toLocaleString("en-US")}</b> tokens\n• Bonus Wallet: <b>${(tok.wallet || 0).toLocaleString("en-US")}</b> tokens\n• Total lifetime tokens: <b>${(tok.totalUsed || 0).toLocaleString("en-US")}</b> tokens`)
      : "";
    return ui.send(m.chatId, `🪙 <b>${lang === "ar" ? "مهامك وتوكناتك النهارده" : "Today's tasks & tokens"}</b>\n${HR}\n${body}${tokBlock}`, menuRows(lang, premium));
  }

  function showMyStats(m, lang) {
    const c = copy(lang);
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const d = DAY();
    const s = {
      activeToday: store.get(`stat:users:${d}`) || 0,
      tasksToday: store.get(`stat:tasks:${d}`) || 0,
      filesToday: store.get(`stat:files:${d}`) || 0,
      quizzesToday: store.get(`stat:quizzes:${d}`) || 0,
    };
    const tokensToday = Number(store.get(`stat:tokens:${d}`) || 0);
    const tokLine = lang === "ar" ? `\n⚡ توكنز مستهلكة اليوم: <b>${tokensToday.toLocaleString("en-US")}</b>` : `\n⚡ Tokens used today: <b>${tokensToday.toLocaleString("en-US")}</b>`;
    return ui.send(m.chatId, `${c.stats(s)}${tokLine}`, adminRows(lang, premium));
  }

  // ───────────── Full In-Bot Admin Control Panel (admins only) ─────────────

  function showAdminLink(m, lang) {
    if (!quota.isAdmin(m.userId)) return ui.send(m.chatId, copy(lang).menu, menuRows(lang, premium));
    const base = (cfg.adminPublicUrl || "").replace(/\/+$/, "");
    const d = DAY();
    const totalUsers = store.keys("user:").length;
    const tokensToday = Number(store.get(`stat:tokens:${d}`) || 0);
    const header = lang === "ar"
      ? `🛠 <b>لوحة تحكم الأدمن الكاملة داخل البوت (Admin panel)</b>\n${HR}\n👥 إجمالي المستخدمين: <b>${totalUsers}</b> · نشطين اليوم: <b>${store.get(`stat:users:${d}`) || 0}</b>\n⚙️ مهام اليوم: <b>${store.get(`stat:tasks:${d}`) || 0}</b> · 📄 ملفات: <b>${store.get(`stat:files:${d}`) || 0}</b>\n⚡ استهلاك التوكنز اليوم: <b>${tokensToday.toLocaleString("en-US")}</b> توكن\n\n<i>تحكم في كل شيء مباشرة من الأزرار بالأسفل بدون الحاجة للمتصفح:</i>`
      : `🛠 <b>In-Bot Admin panel</b>\n${HR}\n👥 Total users: <b>${totalUsers}</b> · Active today: <b>${store.get(`stat:users:${d}`) || 0}</b>\n⚙️ Tasks: <b>${store.get(`stat:tasks:${d}`) || 0}</b> · 📄 Files: <b>${store.get(`stat:files:${d}`) || 0}</b>\n⚡ Tokens today: <b>${tokensToday.toLocaleString("en-US")}</b>`;
    const webLine = base ? `\n\n🔗 Web dashboard: ${esc(base)}/admin` : "";
    return ui.send(m.chatId, `${header}${webLine}`, adminRows(lang, premium));
  }

  function showAdmin(m, lang) {
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const d = DAY();
    const totalUsers = store.keys("user:").length;
    const tokensToday = Number(store.get(`stat:tokens:${d}`) || 0);
    const lines = lang === "ar"
      ? [
          `👥 إجمالي المشتركين: <b>${totalUsers}</b> · نشطين النهارده: <b>${store.get(`stat:users:${d}`) || 0}</b>`,
          `⚙️ مهام اليوم: <b>${store.get(`stat:tasks:${d}`) || 0}</b> · 📄 ملفات: <b>${store.get(`stat:files:${d}`) || 0}</b>`,
          `🧠 كويزات اليوم: <b>${store.get(`stat:quizzes:${d}`) || 0}</b>`,
          `⚡ التوكنز المستهلكة اليوم: <b>${tokensToday.toLocaleString("en-US")}</b> توكن`,
        ]
      : [
          `👥 Total users: <b>${totalUsers}</b> · Active today: <b>${store.get(`stat:users:${d}`) || 0}</b>`,
          `⚙️ Tasks: <b>${store.get(`stat:tasks:${d}`) || 0}</b> · 📄 Files: <b>${store.get(`stat:files:${d}`) || 0}</b>`,
          `🧠 Quizzes: <b>${store.get(`stat:quizzes:${d}`) || 0}</b>`,
          `⚡ Tokens today: <b>${tokensToday.toLocaleString("en-US")}</b>`,
        ];
    return ui.send(m.chatId, `🛠 <b>${lang === "ar" ? "لوحة الأدمن (تحكم كامل من البوت)" : "Admin panel"}</b>\n${HR}\n${lines.join("\n")}`, adminRows(lang, premium));
  }

  function showAdminUsers(m, lang) {
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const keys = store.keys("user:");
    const list = keys
      .map((k) => {
        const uid = k.slice(5);
        const u = store.get(k) || {};
        const plan = plans ? plans.active(uid) : "free";
        const banned = Boolean(store.get(`banned:${uid}`));
        const tokUsed = Number(store.get(`tok_total:${uid}`) || 0);
        return { uid, firstName: u.firstName || "User", phone: u.phone || "", lastSeen: u.lastSeen || 0, plan, banned, tokUsed };
      })
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      .slice(0, 20);

    const body = list.length
      ? list.map((u, i) => `${i + 1}. <b>${esc(u.firstName)}</b> (<code>${esc(u.uid)}</code>) · ${u.plan === "pro" ? "⭐ PRO" : "Free"}${u.banned ? " 🚫" : ""} · ⚡ ${u.tokUsed.toLocaleString("en-US")} tok${u.phone ? ` · ${esc(u.phone)}` : ""}`).join("\n")
      : (lang === "ar" ? "مفيش مستخدمين مسجلين لسه." : "No registered users yet.");

    const text = lang === "ar"
      ? `👥 <b>المستخدمين (${keys.length} مستخدم)</b>\n${HR}\n${body}\n\n💡 <i>اضغط على أزرار التحكم بالأسفل لتفعيل Pro أو شحن توكنز أو حظر/تصفير أي مستخدم بالـ ID:</i>`
      : `👥 <b>Users (${keys.length} total)</b>\n${HR}\n${body}`;
    return ui.send(m.chatId, text, adminRows(lang, premium));
  }

  async function runAdminBroadcast(m, lang, messageText) {
    const keys = store.keys("user:");
    const userIds = keys.map((k) => Number(k.slice(5))).filter((id) => Number.isInteger(id) && id > 0);
    let sent = 0;
    let failed = 0;
    for (const uid of userIds) {
      try {
        await ui.send(uid, `📢 <b>${lang === "ar" ? "إشعار من إدارة Black Fighters" : "Announcement from Black Fighters"}</b>\n${HR}\n${sanitizeHtml(messageText)}`);
        sent++;
      } catch {
        failed++;
      }
    }
    return ui.send(
      m.chatId,
      lang === "ar"
        ? `✅ <b>تم إرسال الإذاعة (Broadcast) بنجاح!</b>\n${HR}\n📨 وصلت لـ: <b>${sent}</b> مشترك\n⚠️ فشل: <b>${failed}</b>`
        : `✅ <b>Broadcast complete!</b>\n${HR}\n📨 Sent: <b>${sent}</b> · Failed: <b>${failed}</b>`,
      adminRows(lang, premium)
    );
  }

  async function runAdminGrantText(m, lang, text) {
    const parts = text.trim().split(/\s+/);
    const targetId = parts[0]?.replace(/\D/g, "");
    const days = parseInt(parts[1], 10) || 30;
    const bonusTokens = parseInt(parts[2], 10) || 500_000;
    if (!targetId) {
      return ui.send(m.chatId, lang === "ar" ? "⚠️ اكتب الـ ID بشكل صحيح." : "⚠️ Invalid user ID.", adminRows(lang, premium));
    }
    const grant = plans ? plans.grant(targetId, "pro", days) : { plan: "pro", until: now() + days * 86400000 };
    if (typeof quota.addTokens === "function" && bonusTokens > 0) {
      quota.addTokens(targetId, bonusTokens);
    }
    const untilDate = new Date(grant.until).toISOString().slice(0, 10);
    await ui.send(
      m.chatId,
      `✅ <b>تم تفعيل باقة Pro وشحن التوكنز بنجاح!</b>\n${HR}\n👤 المستخدم: <code>${targetId}</code>\n📅 ساري حتى: <b>${untilDate}</b> (${days} يوم)\n⚡ توكنز مضافة للمحفظة: <b>+${bonusTokens.toLocaleString("en-US")}</b>`,
      adminRows(lang, premium)
    );
    ui.send(targetId, `🎉 <b>تم تفعيل باقة Pro لحسابك لمدة ${days} يوم + شحن ${bonusTokens.toLocaleString("en-US")} توكن!</b>\nساري حتى: <b>${untilDate}</b>`).catch(() => {});
  }

  async function runAdminBanText(m, lang, text) {
    const targetId = text.trim().replace(/\D/g, "");
    if (!targetId) return ui.send(m.chatId, "⚠️ Invalid ID", adminRows(lang, premium));
    const key = `banned:${targetId}`;
    const currentlyBanned = Boolean(store.get(key));
    if (currentlyBanned) {
      store.del(key);
      return ui.send(m.chatId, `✅ <b>تم فك الحظر عن المستخدم</b> <code>${targetId}</code>`, adminRows(lang, premium));
    } else {
      store.set(key, 1);
      return ui.send(m.chatId, `🚫 <b>تم حظر المستخدم</b> <code>${targetId}</code>`, adminRows(lang, premium));
    }
  }

  async function runAdminResetText(m, lang, text) {
    const targetId = text.trim().replace(/\D/g, "");
    if (!targetId) return ui.send(m.chatId, "⚠️ Invalid ID", adminRows(lang, premium));
    const d = DAY();
    store.del(`q:${targetId}:${d}`);
    store.del(`files:${targetId}:${d}`);
    store.del(`tok:${targetId}:${d}`);
    return ui.send(m.chatId, `🔄 <b>تم تصفير استهلاك اليوم (مهام + ملفات + توكنز) للمستخدم</b> <code>${targetId}</code>`, adminRows(lang, premium));
  }

  /** Recent Stars & pending Cash/Fawry payments, from the store, newest first. */
  function showAdminPayments(m, lang) {
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const pendingCash = store
      .keys("cash:pending:")
      .map((k) => store.get(k))
      .filter(Boolean);
    const list = store
      .keys("stars:")
      .map((k) => ({ chargeId: k.slice(6), ...(store.get(k) || {}) }))
      .filter((p) => p.userId)
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .slice(0, 10);
    const pendingLines = pendingCash.length
      ? pendingCash.map((p) => `⏳ <b>فودافون كاش / فوري معلق:</b> الطالب <code>${esc(String(p.userId))}</code> · رقم العملية: <code>${esc(String(p.txId))}</code>`).join("\n")
      : "";
    const body = list.length
      ? list.map((p) => `• ${esc(String(p.userId))} · ${esc(String(p.stars))} ⭐ · ${esc(new Date(p.at).toISOString().slice(0, 10))}`).join("\n")
      : (lang === "ar" ? "مفيش مدفوعات نجوم لسه." : "No payments yet.");
    const fullBody = [pendingLines, body].filter(Boolean).join(`\n${HR}\n`);
    const rows = [];
    for (const p of pendingCash.slice(0, 3)) {
      rows.push([
        button({ label: `✅ اعتماد ${p.txId}`, icon: "credits", action: act("adm_cok", String(p.userId), String(p.txId)), style: "success", premium }),
        button({ label: `❌ رفض ${p.txId}`, icon: "back", action: act("adm_cno", String(p.userId), String(p.txId)), style: "danger", premium }),
      ]);
    }
    rows.push(...adminRows(lang, premium));
    return ui.send(m.chatId, `💳 <b>${lang === "ar" ? "المدفوعات وطلبات التفعيل" : "Recent payments"}</b>\n${HR}\n${fullBody}`, rows);
  }

  /** Health of each AI provider: paused or not, and recent failures with their cause. */
  function showAdminAi(m, lang) {
    if (!quota.isAdmin(m.userId)) return showQuota(m, lang);
    const state = ai?.breakerState ? ai.breakerState() : {};
    const names = Object.keys(state);
    const rows = names.length
      ? names.map((n) => `${state[n].paused ? "⏸" : "✅"} <b>${esc(n)}</b> · ${state[n].paused ? (lang === "ar" ? "متوقف مؤقتاً" : "paused") : (lang === "ar" ? "شغال" : "working")}`).join("\n")
      : (lang === "ar" ? "مفيش طلبات AI لسه." : "No AI requests yet.");
    const recent = (ai?.diagnose?.() || []).map((r) => `• ${esc(r.where)}: ${esc(r.message)}`).join("\n");
    const tokToday = Number(store.get(`stat:tokens:${DAY()}`) || 0);
    const tokLine = `\n\n⚡ <b>Tokens today:</b> ${tokToday.toLocaleString("en-US")}`;
    return ui.send(m.chatId, `🧠 <b>${lang === "ar" ? "حالة الـAI والتوكنز" : "AI health"}</b>\n${HR}\n${rows}${tokLine}${recent ? `\n\n${HR}\n${recent}` : ""}`, adminRows(lang, premium));
  }

  /** Burns & Fluid Resuscitation 30-Question Quiz (Admins only) */
  function showBurnsMenu(m, lang) {
    if (!quota.isAdmin(m.userId)) return ui.send(m.chatId, copy(lang).menu, menuRows(lang, premium));
    const title = lang === "ar" ? "🔥 <b>كويز الحروق والمحاليل (Burns & Fluids)</b>" : "🔥 <b>Burns & Fluid Resuscitation Quiz</b>";
    const desc = lang === "ar"
      ? `${title}\n${HR}\nبنك أسئلة طبي متكامل (30 سؤال) مقسم على 6 محاور رئيسية:\n` +
        `• <b>Part I:</b> مجرى الهواء وإصابات الاستنشاق (Q1 - Q5)\n` +
        `• <b>Part II:</b> قاعدة التسعات ودرجات الحروق (Q6 - Q10)\n` +
        `• <b>Part III:</b> الأنماط الخطرة ومعايير التحويل (Q11 - Q15)\n` +
        `• <b>Part IV:</b> معادلة باركلاند وصدمة الحروق (Q16 - Q20)\n` +
        `• <b>Part V:</b> مقصورات سوائل الجسم والأسمولية (Q21 - Q25)\n` +
        `• <b>Part VI:</b> التوترية والغرويات وأنواع المحاليل (Q26 - Q30)\n\n` +
        `<i>اختر نمط التشغيل المفضل بالأسفل:</i>`
      : `${title}\n${HR}\nStandard 30-question medical quiz across 6 core domains:\n` +
        `• <b>Part I:</b> Airway & Inhalation Injury (Q1 - Q5)\n` +
        `• <b>Part II:</b> Rule of Nines & Burn Degrees (Q6 - Q10)\n` +
        `• <b>Part III:</b> Dangerous Patterns & Referral (Q11 - Q15)\n` +
        `• <b>Part IV:</b> Parkland Formula & Burn Shock (Q16 - Q20)\n` +
        `• <b>Part V:</b> Fluid Compartments & Osmolarity (Q21 - Q25)\n` +
        `• <b>Part VI:</b> Tonicity, Colloids & Therapy (Q26 - Q30)\n\n` +
        `<i>Choose launch mode below:</i>`;
    return ui.send(m.chatId, desc, burnsQuizRows(lang, premium));
  }

  async function startBurnsPolls(m, lang, openPeriod = 45) {
    if (!quota.isAdmin(m.userId)) return ui.send(m.chatId, copy(lang).menu, menuRows(lang, premium));
    if (!groups) return ui.send(m.chatId, lang === "ar" ? "⚠️ ميزة الاستفتاءات غير متوفرة." : "⚠️ Poll feature unavailable.");
    const sec = Math.max(5, Math.min(600, Number(openPeriod) || 45));
    await groups.start(m.chatId, BURNS_QUIZ_ITEMS, sec);
    const msg = lang === "ar"
      ? `🔥 <b>تم إطلاق كويز الحروق والمحاليل (${BURNS_QUIZ_ITEMS.length} سؤال)!</b>\n${HR}\n⏱️ المؤقت: <b>${sec} ثانية</b> لكل سؤال.\nانطلق بالحل في الاستفتاء بالأسفل 👇`
      : `🔥 <b>Burns & Fluids Quiz launched (${BURNS_QUIZ_ITEMS.length} Qs)!</b>\n${HR}\n⏱️ Timer: <b>${sec}s</b> per question.\nCast your vote in the poll below 👇`;
    return ui.send(m.chatId, msg);
  }

  async function startBurnsInteractive(m, lang) {
    if (!quota.isAdmin(m.userId)) return ui.send(m.chatId, copy(lang).menu, menuRows(lang, premium));
    const items = BURNS_QUIZ_ITEMS.map((item) => ({ ...item }));
    const quiz = { items, index: 0, score: 0, answered: -1, title: BURNS_QUIZ_TITLE, wrongItems: [] };
    const qid = cfg.appUrl ? randomBytes(8).toString("hex") : null;
    if (qid) store.set(`appquiz:${qid}`, { userId: m.userId, items, at: now() }, 2 * 3600 * 1000);
    saveSession(m.chatId, { quiz, awaiting: null, lastQuizTitle: BURNS_QUIZ_TITLE });
    const c = copy(lang);
    const html = `${c.quizIntro(items.length)}\n\n${c.quizQuestion({ index: 1, total: items.length, q: items[0].q, options: items[0].options })}`;
    return ui.send(m.chatId, html, [...quizRows(0, items[0].options, premium), ...appRows(qid, lang)]);
  }

  async function sendAllBurnsPolls(m, lang) {
    if (!quota.isAdmin(m.userId)) return ui.send(m.chatId, copy(lang).menu, menuRows(lang, premium));
    await ui.send(m.chatId, lang === "ar" ? "⏳ جاري إرسال جميع أسئلة كويز الحروق (30 سؤال) كاستفتاءات تيليجرام..." : "⏳ Sending all 30 Burns Quiz questions as polls...");
    let sent = 0;
    for (let i = 0; i < BURNS_QUIZ_ITEMS.length; i++) {
      const item = BURNS_QUIZ_ITEMS[i];
      await ui.sendPoll(m.chatId, {
        question: `Q${i + 1}/${BURNS_QUIZ_ITEMS.length} · ${item.q}`,
        options: item.options,
        correct: item.answer,
        explanation: item.explanation || "",
        openPeriod: 0,
      });
      sent += 1;
      await new Promise((r) => setTimeout(r, 150));
    }
    return ui.send(m.chatId, lang === "ar" ? `✅ تم إرسال كل أسئلة الحروق والمحاليل (${sent} سؤال) بنجاح!` : `✅ Successfully sent all ${sent} Burns Quiz questions!`);
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
        saveSession(m.chatId, { lastInput: null, quiz: null, awaiting: null, images: [], targetPages: null, remainingQuizTotal: 0 });
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
      case "/admin":
        return showAdminLink(m, lang);
      case "/burns":
      case "/burnquiz":
        if (!admin) return ui.send(m.chatId, c.menu, menuRows(lang, premium));
        return showBurnsMenu(m, lang);
      case "/stop":
        if (groups && groups.get(m.chatId)) {
          await groups.stop(m.chatId);
          return;
        }
        return ui.send(m.chatId, c.menu, menuRows(lang, premium, { isAdmin: admin }));
      case "/grant": {
        if (!admin) return ui.send(m.chatId, c.menu, menuRows(lang, premium));
        const rest = m.text.trim().split(/\s+/).slice(1).join(" ");
        if (!rest) {
          saveSession(m.chatId, { awaiting: "admin_grant" });
          return ui.send(m.chatId, `🎁 <b>ابعت الـ User ID وعدد الأيام والتوكنز الإضافية:</b>\nمثال: <code>12345678 30 500000</code>`);
        }
        return runAdminGrantText(m, lang, rest);
      }
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
      case "pg": {
        await ui.ack(m.callbackId);
        if (a0 === "custom") {
          saveSession(m.chatId, { awaiting: "pages" });
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "📄 <b>اكتب عدد الصفحات اللي عاوزه للتلخيص (من 1 إلى 25 صفحة):</b>"
              : "📄 <b>Type the number of pages you want for the summary (1 to 25):</b>",
            [[button({ label: c.btn.back, icon: "back", action: act("sum", "basic"), premium })]]
          );
        }
        const n = Math.min(25, Math.max(1, parseInt(a0, 10) || 4));
        saveSession(m.chatId, { targetPages: n });
        return showStyles(m, lang);
      }
      case "quiz":
        await ui.ack(m.callbackId);
        return startQuiz(m, lang, Math.min(500, Math.max(3, parseInt(a0, 10) || 5)));
      case "qcustom": {
        await ui.ack(m.callbackId);
        const src = a0 === "images" ? "images" : "text";
        saveSession(m.chatId, { awaiting: "quiz_count", quizCountSource: src });
        return ui.send(
          m.chatId,
          lang === "ar"
            ? "✏️ <b>اكتب عدد الأسئلة اللي عاوزه (من 1 لحد 500 سؤال):</b>\n<i>لو العدد أكبر من 50 سؤال، البوت هيقسمهم دفعات 50×50 عشان تحلهم براحتك بأعلى سرعة!</i>"
            : "✏️ <b>Type how many questions you want (1 to 500):</b>\n<i>Counts over 50 are automatically served in fast 50-question batches!</i>",
          [[button({ label: c.btn.back, icon: "back", action: act("qc", "pick", src), premium })]]
        );
      }
      case "qtimer": {
        await ui.ack(m.callbackId);
        const src = a1 === "images" ? "images" : "text";
        if (a0 === "menu") return showTimerPicker(m, lang, src);
        if (a0 === "custom") {
          saveSession(m.chatId, { awaiting: "quiz_timer", quizCountSource: src });
          return ui.send(
            m.chatId,
            lang === "ar" ? "⏱️ <b>اكتب وقت المؤقت لكل سؤال بالثواني (مثلاً 20 أو 45 أو 0 لإلغاء المؤقت):</b>" : "⏱️ <b>Type the timer per question in seconds (e.g. 20, 45, or 0 for off):</b>",
            [[button({ label: c.btn.back, icon: "back", action: act("qtimer", "menu", src), premium })]]
          );
        }
        const sec = Math.min(600, Math.max(0, parseInt(a0, 10) || 0));
        saveSession(m.chatId, { quizTimer: sec });
        const note = sec > 0
          ? (lang === "ar" ? `⏱️ <b>تم تفعيل المؤقت: ${sec} ثانية لكل سؤال!</b>\nاختر عدد الأسئلة للبدء 👇` : `⏱️ <b>Timer set: ${sec}s per question!</b>\nChoose question count to begin 👇`)
          : (lang === "ar" ? `🎯 <b>تم اختيار: بدون مؤقت (حل براحتك)!</b>\nاختر عدد الأسئلة للبدء 👇` : `🎯 <b>Selected: No timer (untimed)!</b>\nChoose question count to begin 👇`);
        const rows = sizeRows(lang, m.userId, src, session(m.chatId));
        return ui.send(m.chatId, note, rows);
      }
      case "qbatch": {
        await ui.ack(m.callbackId);
        const rem = Number(s.remainingQuizTotal || 0);
        if (rem <= 0) return quizCount(m, lang, "pick", "text");
        return startQuiz(m, lang, rem, s.lastQuizTopic || null);
      }
      case "cards":
        await ui.ack(m.callbackId);
        return flashcards(m, lang);
      case "key":
        await ui.ack(m.callbackId);
        return keyPoints(m, lang);
      case "explain":
        await ui.ack(m.callbackId);
        return explainLecture(m, lang);
      case "pod":
        await ui.ack(m.callbackId);
        return podcastLecture(m, lang);
      case "ask":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { awaiting: "question" });
        return ui.send(m.chatId, c.askPrompt, [[button({ label: c.btn.back, icon: "back", action: act("menu"), premium })]]);
      case "topic":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { awaiting: "topic" });
        return ui.send(m.chatId, c.topicPrompt, [[button({ label: c.btn.back, icon: "back", action: act("menu"), premium })]]);
      case "qa": {
        const s = session(m.chatId);
        const q = s.quiz;
        const stale = !q || q.index !== Number(a0) || q.answered === Number(a0);
        if (stale) return ui.ack(m.callbackId, lang === "ar" ? "الكويز اتغير" : "That question has moved on");
        ui.ack(m.callbackId).catch(() => {});
        return answerQuiz(m, Number(a0), Number(a1));
      }
      case "qn": {
        const s = session(m.chatId);
        const q = s.quiz;
        const stale = !q || q.index !== Number(a0) || q.answered !== Number(a0);
        if (stale) return ui.ack(m.callbackId, lang === "ar" ? "الكويز اتغير" : "That question has moved on");
        ui.ack(m.callbackId).catch(() => {});
        return nextQuestion(m, Number(a0));
      }
      case "qretry": {
        await ui.ack(m.callbackId);
        clearActiveTimer(m.chatId);
        const s = session(m.chatId);
        const items = s.retryQuizItems;
        if (!items || !items.length) {
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "✅ مفيش أخطاء للمراجعة! حليت كل الأسئلة صح يا بطل 🎯"
              : "✅ No mistakes to retry! You got them all right 🎯"
          );
        }
        const retryItems = items.map((it) => ({ ...it }));
        const quiz = {
          items: retryItems,
          index: 0,
          score: 0,
          answered: -1,
          title: s.lastQuizTitle ? `${s.lastQuizTitle} (تصحيح الأخطاء)` : (lang === "ar" ? "تصحيح الأخطاء" : "Mistakes Retry"),
          wrongItems: [],
        };
        saveSession(m.chatId, { quiz, retryQuizItems: null });
        const item0 = retryItems[0];
        const intro = lang === "ar"
          ? `🔄 <b>جولة تصحيح الأخطاء (${retryItems.length} سؤال)</b>\n${HR}\nركز وصحح الأسئلة اللي غلطت فيها 👇`
          : `🔄 <b>Mistakes Retry Round (${retryItems.length} questions)</b>\n${HR}\nFocus and correct the questions you missed 👇`;
        const html = `${intro}\n\n${c.quizQuestion({ index: 1, total: retryItems.length, q: item0.q, options: item0.options })}`;
        return ui.send(m.chatId, html, quizRows(0, item0.options, premium));
      }
      case "lang": {
        const next = a0 === "ar" ? "ar" : "en";
        saveSession(m.chatId, { lang: next });
        await ui.ack(m.callbackId);
        return ui.send(m.chatId, copy(next).langSet, menuRows(next, premium, { isAdmin: admin }));
      }
      case "new":
        clearActiveTimer(m.chatId);
        saveSession(m.chatId, { lastInput: null, quiz: null, awaiting: null, images: [], targetPages: null, remainingQuizTotal: 0 });
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
      case "plans":
        await ui.ack(m.callbackId);
        return showPlans(m, lang);
      case "remind": {
        await ui.ack(m.callbackId);
        const hours = [8, 12, 16, 20, 22];
        const rows = [hours.map((h) => button({ label: `${String(h).padStart(2, "0")}:00`, icon: "clock", action: act("rem", String(h)), premium }))];
        rows.push([button({ label: lang === "ar" ? "إيقاف التذكير" : "Turn off", icon: "back", action: act("rem", "off"), style: "danger", premium })]);
        rows.push([button({ label: c.btn.menu, icon: "home", action: act("menu"), premium })]);
        return ui.send(m.chatId, lang === "ar" ? "⏰ <b>اختار ساعة التذكير</b>\nهبعتلك تذكير لما يكون عندك كروت مستحقة." : "⏰ <b>Pick a reminder hour</b>\nI'll remind you when you have cards due.", rows);
      }
      case "rem":
        await ui.ack(m.callbackId);
        return setReminder(m, lang, a0 === "off" ? "off" : a0);
      case "len":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { detail: ["concise", "detailed"].includes(a0) ? a0 : "standard", targetPages: null });
        return showStyles(m, lang);
      case "txid":
        await ui.ack(m.callbackId);
        saveSession(m.chatId, { awaiting: "txid" });
        return ui.send(m.chatId, lang === "ar" ? "🧾 <b>ابعت رقم العملية (TxID)</b>\nاكتبه في رسالة واحدة." : "🧾 <b>Send the transaction ID (TxID)</b>\nType it in one message.", menuRows(lang, premium));
      case "adm_cok": {
        if (!admin) return ui.ack(m.callbackId, "للأدمن فقط!", true);
        const targetId = a0;
        const txId = a1;
        const intent = store.get(`cash:intent:${targetId}`);
        const planId = intent?.planId || "pro";
        const planObj = PLANS[planId] || PLANS.pro;
        store.set(`cash:used:${txId}`, targetId, 90 * 24 * 3600 * 1000);
        store.del(`cash:pending:${txId}`);
        store.del(`cash:intent:${targetId}`);
        const grant = plans.grant(targetId, planId, planObj.days);
        const untilDate = new Date(grant.until).toISOString().slice(0, 10);
        await ui.ack(m.callbackId, "✅ تم الاعتماد والتفعيل بنجاح!");
        ui.send(m.chatId, `✅ <b>تم اعتماد التحويل وتفعيل باقة ${planObj.name.ar || planObj.name.en}!</b>\n${HR}\n👤 المستخدم: <code>${targetId}</code>\n🧾 رقم العملية: <code>${txId}</code>\n📅 ساري حتى: <b>${untilDate}</b>`).catch(() => {});
        const targetLang = pickLang(session(targetId), "");
        const targetC = copy(targetLang);
        ui.send(targetId, targetC.cashOk(planObj.name[targetLang] || planObj.name.en, untilDate), menuRows(targetLang, premium, { isAdmin: quota.isAdmin(targetId) })).catch(() => {});
        return;
      }
      case "adm_cno": {
        if (!admin) return ui.ack(m.callbackId, "للأدمن فقط!", true);
        const targetId = a0;
        const txId = a1;
        store.del(`cash:pending:${txId}`);
        await ui.ack(m.callbackId, "❌ تم رفض الطلب");
        ui.send(m.chatId, `❌ <b>تم رفض عملية التحويل</b>\n${HR}\n👤 المستخدم: <code>${targetId}</code>\n🧾 رقم العملية: <code>${txId}</code>`).catch(() => {});
        const targetLang = pickLang(session(targetId), "");
        ui.send(targetId, targetLang === "ar" ? `❌ <b>تم رفض عملية الدفع برقم:</b> <code>${txId}</code>\nتأكد من صحة رقم التحويل أو تواصل مع الدعم.` : `❌ <b>Payment rejected for TxID:</b> <code>${txId}</code>\nPlease verify your payment or contact support.`).catch(() => {});
        return;
      }
      case "deck":
        await ui.ack(m.callbackId);
        return showDeck(m, lang);
      case "admin":
        if (!admin) return ui.ack(m.callbackId, "للأدمن فقط!", true);
        await ui.ack(m.callbackId);
        if (a0 === "pay") return showAdminPayments(m, lang);
        if (a0 === "users") return showAdminUsers(m, lang);
        if (a0 === "ai") return showAdminAi(m, lang);
        if (a0 === "burn") return showBurnsMenu(m, lang);
        if (a0 === "burn_p") return startBurnsPolls(m, lang, Number(a1) || 45);
        if (a0 === "burn_i") return startBurnsInteractive(m, lang);
        if (a0 === "burn_all") return sendAllBurnsPolls(m, lang);
        if (a0 === "bcast") {
          saveSession(m.chatId, { awaiting: "admin_broadcast" });
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "📢 <b>إذاعة جماعية لكل المشتركين (Broadcast)</b>\nاكتب الرسالة اللي عاوز تبعتها لكل مستخدمي البوت في رسالة واحدة:"
              : "📢 <b>Broadcast to All Users</b>\nType the announcement message to send to all users:",
            [[button({ label: c.btn.back, icon: "back", action: act("admin"), premium })]]
          );
        }
        if (a0 === "grant") {
          saveSession(m.chatId, { awaiting: "admin_grant" });
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "🎁 <b>تفعيل باقة Pro وشحن توكنز</b>\nابعت الـ ID بتاع الطالب (ومعاه اختيارياً عدد الأيام وعدد التوكنز):\nمثال: <code>123456789 30 500000</code>"
              : "🎁 <b>Grant Pro & Add Tokens</b>\nSend the user ID (and optionally days & tokens):\nExample: <code>123456789 30 500000</code>",
            [[button({ label: c.btn.back, icon: "back", action: act("admin"), premium })]]
          );
        }
        if (a0 === "ban") {
          saveSession(m.chatId, { awaiting: "admin_ban" });
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "🚫 <b>حظر / فك حظر مستخدم</b>\nابعت الـ ID بتاع المستخدم لعكس حالة الحظر فوراً:"
              : "🚫 <b>Ban / Unban User</b>\nSend the user ID to toggle ban status:",
            [[button({ label: c.btn.back, icon: "back", action: act("admin"), premium })]]
          );
        }
        if (a0 === "reset") {
          saveSession(m.chatId, { awaiting: "admin_reset" });
          return ui.send(
            m.chatId,
            lang === "ar"
              ? "🔄 <b>تصفير استهلاك مستخدم اليوم</b>\nابعت الـ ID بتاع المستخدم لتصفير عداد المهام والملفات والتوكنز لليوم:"
              : "🔄 <b>Reset User Daily Quota</b>\nSend the user ID to reset today's tasks, files, and tokens:",
            [[button({ label: c.btn.back, icon: "back", action: act("admin"), premium })]]
          );
        }
        return showAdmin(m, lang);
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
    onSuccessfulPayment: onPaid,
    /** Runs one due-cards reminder sweep. */
    sendReminders,
    /** Runs one subscription renewal notice sweep. */
    sendRenewalNotices,
    /** Sends the daily admin report once per UTC day. */
    sendDailyReport,

    _state: { busy },
  };
}
