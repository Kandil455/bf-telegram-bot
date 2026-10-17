// End-to-end: a real grammY bot, a fake Telegram Bot API on localhost (or in-process transformer
// when OS sandbox forbids loopback bind), and a /start update.
// Needs the grammy package (npm install). Without it, the test is skipped, not faked.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

let grammyAvailable = true;
try {
  await import("grammy");
} catch {
  grammyAvailable = false;
}

test("end to end: /start goes through grammY and comes back as a menu", { skip: grammyAvailable ? false : "grammy is not installed; run npm install" }, async () => {
  const calls = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const method = req.url.split("/").pop();
      calls.push({ method, body });
      const result =
        method === "getMe"
          ? { id: 1, is_bot: true, first_name: "BF", username: "bf_test_bot" }
          : method === "sendMessage"
            ? { message_id: 77, date: 0, chat: { id: 5, type: "private" }, text: "" }
            : true;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, result }));
    });
  });

  let port = null;
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    port = server.address().port;
  } catch (err) {
    if (err?.code !== "EPERM" && err?.code !== "EACCES") throw err;
  }

  try {
    const { createApp } = await import("../src/bot.js");
    const cfg = {
      botToken: "123456:TESTTOKEN",
      apiRoot: port ? `http://127.0.0.1:${port}` : null,
      premiumEmoji: {},
      freeDailyTasks: 10,
      proDailyTasks: 120,
      proStars: 150,
      adminIds: new Set(),
      maxFileMb: 20,
      maxTextChars: 60000,
      dataDir: null,
      gemini: { key: "", model: "" },
      groq: { key: "", model: "" },
      openrouter: { key: "", model: "" },
      adminToken: "",
      tzOffset: 0,
    };
    const app = createApp(cfg, { logger: { info() {}, warn() {}, error() {} } });
    if (!port) {
      app.bot.api.config.use(async (_prev, method, payload) => {
        calls.push({ method, body: JSON.stringify(payload || {}) });
        const result =
          method === "getMe"
            ? { id: 1, is_bot: true, first_name: "BF", username: "bf_test_bot" }
            : method === "sendMessage"
              ? { message_id: 77, date: 0, chat: { id: 5, type: "private" }, text: "" }
              : true;
        return { ok: true, result };
      });
    }
    await app.bot.init();
    await app.bot.handleUpdate({
      update_id: 1,
      message: { message_id: 1, date: 0, chat: { id: 5, type: "private" }, from: { id: 5, is_bot: false, first_name: "Tester" }, text: "/start" },
    });
    const sent = calls.find((c) => c.method === "sendMessage");
    assert.ok(sent, "sendMessage was called");
    const payload = JSON.parse(sent.body);
    assert.match(payload.text, /Black Fighters/);
    assert.ok(payload.reply_markup.inline_keyboard.length >= 3);
  } finally {
    if (port) server.close();
  }
});
