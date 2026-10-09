// Compact callback codec. Every callback is "a:<name>[:arg...]" and must stay
// within Telegram's 64-byte limit.

export const ACTIONS = Object.freeze([
  "menu", "sum", "quiz", "cards", "key", "explain", "ask", "topic",
  "lang", "new", "qa", "qn", "credits", "stats", "help", "noop", "pl", "buy", "rv", "rvs", "tpl", "docl", "cash", "img", "qc", "fmt",
]);

const LIMIT = 64;

export function act(name, ...args) {
  if (!ACTIONS.includes(name)) throw new Error(`unknown action: ${name}`);
  const data = ["a", name, ...args.map(String)].join(":");
  if (Buffer.byteLength(data, "utf8") > LIMIT) throw new Error(`callback too long: ${data}`);
  return data;
}

export function parseAct(data = "") {
  const parts = String(data).split(":");
  if (parts[0] !== "a" || !ACTIONS.includes(parts[1])) return null;
  return { name: parts[1], args: parts.slice(2) };
}
