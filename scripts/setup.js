#!/usr/bin/env node
// One-time and maintenance tasks, run from your machine with the token in the environment.
//
//   node scripts/setup.js --commands            publish the command menu (private chats and groups, EN and AR)
//   node scripts/setup.js --webhook             point Telegram at PUBLIC_URL with the secret
//   node scripts/setup.js --info                show the current webhook status
//   node scripts/setup.js --emoji <set_name>    build PREMIUM_EMOJI_JSON from a custom-emoji set

import fs from "node:fs";

// Automatically load .env if present on disk
if (typeof process.loadEnvFile === "function" && fs.existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {}
}

import { GLYPH } from "../src/core/icons.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
const args = process.argv.slice(2);
const api = (method, body = {}) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

function need(v, label) {
  if (!v) {
    console.error(`${label} is required.`);
    process.exit(1);
  }
  return v;
}

import { commandsFor } from "../src/core/commands.js";

/**
 * Publishes the command menu for every scope and language: private chats and groups, in
 * English, Arabic, and a default. Telegram shows the one that matches the user's language.
 */
async function publishCommands() {
  need(token, "TELEGRAM_BOT_TOKEN");
  const scopes = [
    { scope: "private", body: { type: "all_private_chats" } },
    { scope: "group", body: { type: "all_group_chats" } },
  ];
  const report = {};
  for (const { scope, body } of scopes) {
    for (const lang of ["", "en", "ar"]) {
      const cmdLang = lang || "en";
      const res = await api("setMyCommands", { commands: commandsFor(scope, cmdLang), scope: body, ...(lang ? { language_code: lang } : {}) });
      report[`${scope}${lang ? ":" + lang : ":default"}`] = res.ok ? "ok" : res.description;
    }
  }
  console.log(report);
}

async function setWebhook() {
  need(token, "TELEGRAM_BOT_TOKEN");
  const url = need(process.env.PUBLIC_URL, "PUBLIC_URL");
  const secret = need(process.env.TELEGRAM_WEBHOOK_SECRET, "TELEGRAM_WEBHOOK_SECRET");
  const res = await api("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "pre_checkout_query", "poll_answer"],
  });
  console.log(res.ok ? `Webhook set: ${url}` : `Failed: ${res.description}`);
}

async function info() {
  need(token, "TELEGRAM_BOT_TOKEN");
  const res = await api("getWebhookInfo");
  console.log(JSON.stringify(res.result || res, null, 2));
}

async function emoji(setName) {
  need(token, "TELEGRAM_BOT_TOKEN");
  need(setName, "sticker set name");
  const res = await api("getStickerSet", { name: setName });
  if (!res.ok) {
    console.error(`getStickerSet failed: ${res.description}`);
    process.exit(1);
  }
  const custom = (res.result.stickers || []).filter((s) => s.custom_emoji_id);
  if (!custom.length) {
    console.error("That set has no custom emoji.");
    process.exit(1);
  }
  const map = {};
  for (const [name, glyph] of Object.entries(GLYPH)) {
    const hit = custom.find((s) => s.emoji === glyph);
    if (hit) map[name] = hit.custom_emoji_id;
  }
  console.log(`Matched ${Object.keys(map).length} of ${Object.keys(GLYPH).length} icons from "${res.result.title}".\n`);
  console.log("Add this to your environment (one line):\n");
  console.log(`PREMIUM_EMOJI_JSON='${JSON.stringify(map)}'`);
}

const [flag, value] = args;
if (flag === "--commands") await publishCommands();
else if (flag === "--webhook") await setWebhook();
else if (flag === "--info") await info();
else if (flag === "--emoji") await emoji(value);
else {
  console.log("Usage: node scripts/setup.js --commands | --webhook | --info | --emoji <set_name>");
}
