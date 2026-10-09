// HTTP front: health check, the admin dashboard, and (in webhook mode) the Telegram webhook.

import http from "node:http";
import { webhookCallback } from "grammy";

function readJson(req, max) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size <= max) chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(size <= max ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : null);
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

export function createHttpServer({ bot, cfg, admin = null, cash = null, app = null, logger = console }) {
  const webhookPath = cfg.mode === "webhook" ? new URL(cfg.publicUrl).pathname || "/" : null;
  const handle = webhookPath ? webhookCallback(bot, "http", { secretToken: cfg.webhookSecret }) : null;

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end('{"ok":true}');
      }
      if (cash && req.method === "POST" && req.url === "/webhooks/sms") {
        const body = await readJson(req, 8192);
        const status = cash.ingest({ secret: req.headers["x-sms-secret"], body });
        res.writeHead(status === "unauthorized" ? 401 : 200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: status === "stored" || status === "duplicate", status }));
      }
      if (app && (await app(req, res))) return;
      if (admin && (await admin(req, res))) return;
      if (handle && req.method === "POST" && req.url?.startsWith(webhookPath)) return await handle(req, res);
      res.writeHead(404);
      res.end();
    } catch (err) {
      logger.error("[server]", err?.message || err);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  });
}
