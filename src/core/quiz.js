// Validation for model output. Bad items are dropped, never shown.

export function normaliseQuiz(raw, max = 5) {
  const list = Array.isArray(raw?.questions) ? raw.questions : Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of list) {
    const options = Array.isArray(item?.options) ? item.options.map((o) => String(o).slice(0, 120)) : [];
    const answer = Number(item?.answer);
    if (!item?.q || options.length < 2 || options.length > 4) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
    out.push({
      q: String(item.q).slice(0, 300),
      options,
      answer,
      explanation: String(item.explanation || "").slice(0, 300),
    });
    if (out.length >= max) break;
  }
  return out;
}

export function normaliseCards(raw, max = 8) {
  const list = Array.isArray(raw?.cards) ? raw.cards : Array.isArray(raw) ? raw : [];
  const out = [];
  for (const c of list) {
    if (!c?.q || !c?.a) continue;
    out.push({ q: String(c.q).slice(0, 240), a: String(c.a).slice(0, 360) });
    if (out.length >= max) break;
  }
  return out;
}
