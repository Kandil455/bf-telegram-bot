// Mini App endpoints. The quiz is served without answers; each answer is checked on the server.
// Every request must carry Telegram's signed initData, and the quiz must belong to that user.

import { verifyInitData } from "./auth.js";
import { APP_PAGE } from "./page.js";

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req, max = 4096) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size <= max) chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(size <= max ? JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") : null);
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

export function createAppApi({ store, botToken, now = () => Date.now() }) {
  function authed(req) {
    const auth = String(req.headers.authorization || "");
    if (!auth.startsWith("tma ")) return null;
    return verifyInitData(auth.slice(4), botToken, { now: now() });
  }

  return async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/app") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
      return res.end(APP_PAGE), true;
    }
    if (!url.pathname.startsWith("/api/app/")) return false;

    const session = authed(req);
    if (!session) return json(res, 401, { error: "unauthorized" }), true;

    if (req.method === "GET" && url.pathname === "/api/app/quiz") {
      const qid = url.searchParams.get("qid") || "";
      const q = store.get(`appquiz:${qid}`);
      if (!q) return json(res, 404, { error: "not_found" }), true;
      if (Number(q.userId) !== session.user.id) return json(res, 403, { error: "forbidden" }), true;
      return json(res, 200, { total: q.items.length, items: q.items.map((it) => ({ q: it.q, options: it.options })), name: session.user.first_name || "" }), true;
    }

    if (req.method === "POST" && url.pathname === "/api/app/answer") {
      const body = await readBody(req);
      const q = body && store.get(`appquiz:${body.qid}`);
      if (!q) return json(res, 404, { error: "not_found" }), true;
      if (Number(q.userId) !== session.user.id) return json(res, 403, { error: "forbidden" }), true;
      const item = q.items[Number(body.index)];
      if (!item) return json(res, 400, { error: "bad_index" }), true;
      const choice = Number(body.choice);
      return json(res, 200, { correct: choice === item.answer, answer: item.answer, explanation: item.explanation || "" }), true;
    }
    return json(res, 404, { error: "not_found" }), true;
  };
}

