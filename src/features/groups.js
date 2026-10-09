// Group mode: a shared quiz run with native polls. Answers arrive as poll_answer
// updates (the poll is non-anonymous), each correct answer scores a point, and the
// next question appears as soon as the first answer lands for the current one.

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

  async function askNext(chatId, state) {
    const item = state.items[state.index];
    const pollId = await ui.sendPoll(chatId, {
      question: `Q${state.index + 1}/${state.items.length} · ${item.q}`,
      options: item.options,
      correct: item.answer,
      explanation: item.explanation || "",
    });
    if (pollId) store.set(pollKey(pollId), { chatId, index: state.index }, 3 * 3600 * 1000);
    state.currentPollId = pollId || null;
    store.set(stateKey(chatId), state, 3 * 3600 * 1000);
  }

  function board(state) {
    const rows = Object.values(state.scores).sort((a, b) => b.pts - a.pts).slice(0, 10);
    if (!rows.length) return "No one scored yet.";
    return rows.map((r, i) => `${["🥇", "🥈", "🥉"][i] || `${i + 1}.`} <b>${r.name}</b> · ${r.pts}`).join("\n");
  }

  return {
    get(chatId) {
      return store.get(stateKey(chatId)) || null;
    },
    /** items: normalised quiz questions. Starts the run and sends the first poll. */
    async start(chatId, items) {
      const state = { items, index: 0, scores: {}, answeredIndex: -1, currentPollId: null, startedAt: now() };
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
      const item = state.items[state.index];
      const chosen = optionIds?.[0];
      const correct = chosen === item.answer;
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
        await ui.send(link.chatId, `🏁 <b>Group quiz finished</b>\n━━━━━━━━━━━━━━━━━━━━\n${board(state)}`);
        store.del(stateKey(link.chatId));
      }
      return { ok: true, correct };
    },
    leaderboard(chatId) {
      const state = this.get(chatId);
      return state ? board(state) : null;
    },
    async stop(chatId) {
      const state = this.get(chatId);
      if (!state) return false;
      store.del(stateKey(chatId));
      await ui.send(chatId, `⏹ <b>Stopped.</b>\n━━━━━━━━━━━━━━━━━━━━\n${board(state)}`);
      return true;
    },
  };
}
