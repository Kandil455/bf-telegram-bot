// Group mode: a shared quiz run with native polls. Answers arrive as poll_answer
// updates (the poll is non-anonymous), each correct answer scores a point, and the
// next question appears as soon as the first answer lands for the current one.

import { finishRows } from "../keyboards.js";

export function isAddressed(text = "", botUsername = "", { repliedToBot = false } = {}) {
  const t = String(text || "");
  if (!botUsername) return repliedToBot;
  if (new RegExp(`@${botUsername}\\b`, "i").test(t)) return true;
  if (repliedToBot) return true;
  return /^\/(quiz|stop|leaderboard)\b/i.test(t.trim());
}

export function stripMention(text = "", botUsername = "") {
  return String(text || "").replace(new RegExp(`@${botUsername}\\b`, "gi"), "").trim();
}

export function createGroups({ store, ui, now = () => Date.now(), logger = console }) {
  const stateKey = (chatId) => `group:${chatId}`;
  const pollKey = (pollId) => `poll:${pollId}`;
  const activePollTimers = new Map();

  function clearPollTimer(chatId) {
    const t = activePollTimers.get(chatId);
    if (t) {
      clearTimeout(t);
      activePollTimers.delete(chatId);
    }
  }

  function armPollTimer(chatId, index, openPeriod) {
    clearPollTimer(chatId);
    if (!openPeriod || openPeriod < 5) return;
    const t = setTimeout(async () => {
      activePollTimers.delete(chatId);
      const state = store.get(stateKey(chatId));
      if (!state || state.index !== index || state.answeredIndex === index) return;
      const item = state.items[state.index];
      state.wrongItems = state.wrongItems || [];
      state.wrongItems.push(item);
      state.answeredIndex = state.index;
      state.index += 1;
      store.set(stateKey(chatId), state, 3 * 3600 * 1000);
      if (state.index < state.items.length) {
        await askNext(chatId, state);
      } else {
        await finishQuiz(chatId, state);
      }
    }, (openPeriod + 2) * 1000);
    if (typeof t.unref === "function") t.unref();
    activePollTimers.set(chatId, t);
  }

  async function askNext(chatId, state) {
    clearPollTimer(chatId);
    const item = state.items[state.index];
    if (item.imageBuffer && typeof ui.sendPhoto === "function") {
      await ui.sendPhoto(
        chatId,
        item.imageBuffer,
        item.imageName || `q${state.index + 1}.jpg`,
        `🖼️ <b>صورة السؤال ${state.index + 1} من ${state.items.length}</b>`
      ).catch(() => {});
    }
    const pollId = await ui.sendPoll(chatId, {
      question: `Q${state.index + 1}/${state.items.length} · ${item.q}`.slice(0, 300),
      options: item.options.map((o) => o.slice(0, 100)),
      correct: item.answer,
      explanation: (item.explanation || "").slice(0, 195),
      openPeriod: state.openPeriod || 60,
    });
    if (pollId) store.set(pollKey(pollId), { chatId, index: state.index }, 3 * 3600 * 1000);
    state.currentPollId = pollId || null;
    store.set(stateKey(chatId), state, 3 * 3600 * 1000);
    armPollTimer(chatId, state.index, state.openPeriod);
  }

  async function finishQuiz(chatId, state, userId = null) {
    clearPollTimer(chatId);
    const sess = store.get(`s:${chatId}`) || {};
    const ar = sess.lang === "ar";
    const total = state.items.length;
    const myScore = (userId && state.scores[userId]?.pts) || Object.values(state.scores)[0]?.pts || 0;
    const pct = total ? Math.round((myScore / total) * 100) : 0;
    const msg = `${ar ? "🏁 <b>انتهى كويز الاستفتاءات!</b>" : "🏁 <b>Quiz finished!</b>"}\n━━━━━━━━━━━━━━━━━━━━\n🏆 ${ar ? "النتيجة" : "Score"}: <b>${myScore} / ${total}</b> (${pct}%)\n\n${board(state)}`;

    const wrongItems = state.wrongItems || [];
    store.patch(`s:${chatId}`, {
      retryQuizItems: wrongItems.length ? wrongItems : null,
      lastQuizTitle: "Telegram Polls",
    });

    const finishKeyboard = finishRows(ar ? "ar" : "en", false, wrongItems.length, 0);
    await ui.send(chatId, msg, finishKeyboard);
    store.del(stateKey(chatId));
  }

  function board(state) {
    const rows = Object.values(state.scores).sort((a, b) => b.pts - a.pts).slice(0, 10);
    if (!rows.length) return "No one scored yet.";
    return rows.map((r, i) => `${["🥇", "🥈", "🥉"][i] || `${i + 1}.`} <b>${r.name}</b> · ${r.pts}/${state.items.length}`).join("\n");
  }

  return {
    get(chatId) {
      return store.get(stateKey(chatId)) || null;
    },
    /** items: normalised quiz questions. Starts the run and sends the first poll. */
    async start(chatId, items, openPeriod = 60) {
      const state = { items, index: 0, scores: {}, wrongItems: [], answeredIndex: -1, currentPollId: null, startedAt: now(), openPeriod };
      store.set(stateKey(chatId), state, 3 * 3600 * 1000);
      await askNext(chatId, state);
      return state;
    },
    /** poll_answer update: { poll_id, user: { id, first_name }, option_ids } */
    async onAnswer({ pollId, userId, name, optionIds }) {
      const link = store.get(pollKey(pollId));
      if (!link) return { ignored: true };
      const state = this.get(link.chatId);
      if (!state || link.index !== state.index || state.answeredIndex === state.index) return { ignored: true };
      clearPollTimer(link.chatId);
      const item = state.items[state.index];
      const chosen = optionIds?.[0];
      const correct = chosen === item.answer;
      if (!correct) {
        state.wrongItems = state.wrongItems || [];
        state.wrongItems.push(item);
      }
      const score = state.scores[userId] || { name: name || "Player", pts: 0 };
      score.name = name || score.name;
      if (correct) score.pts += 1;
      state.scores[userId] = score;
      state.answeredIndex = state.index;
      state.index += 1;
      store.set(stateKey(link.chatId), state, 3 * 3600 * 1000);

      if (state.index < state.items.length) {
        await askNext(link.chatId, state);
      } else {
        await finishQuiz(link.chatId, state, userId);
      }
      return { ok: true, correct };
    },
    leaderboard(chatId) {
      const state = this.get(chatId);
      return state ? board(state) : null;
    },
    async stop(chatId) {
      clearPollTimer(chatId);
      const state = this.get(chatId);
      if (!state) return false;
      store.del(stateKey(chatId));
      await ui.send(chatId, `⏹ <b>Stopped.</b>\n━━━━━━━━━━━━━━━━━━━━\n${board(state)}`);
      return true;
    },
  };
}
