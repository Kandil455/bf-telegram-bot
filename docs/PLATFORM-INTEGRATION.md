# Black Fighters — Platform ↔ Telegram Bot Integration

> **TL;DR — the PLATFORM owns the webhook.** Any other process that starts
> `node index.js` (polling mode) or otherwise owns the bot token WILL break
> production by deleting the registered webhook.

## Architecture of record

```
Telegram ──setWebhook──► https://blackfighters.site/api/telegram-webhook
                             │
                             ▼  (Vercel serverless — always-on, healthy 24/7)
                     netlify/functions/telegram-webhook.mjs
                             │  validates X-Telegram-Bot-Api-Secret-Token
                             ▼
                     _shared/telegram-engine.mjs (full bot logic now)
```

The standalone service in this repo (Render, `bf-telegram-bot.onrender.com`) is
**legacy**. It must stay suspended, or at minimum **never** run with
`BOT_MODE=polling` in production. Its guarded entry (`src/index.js`) refuses
to delete an existing webhook — but older builds did not, and every restart
wiped the platform's webhook.

## Facts of the incident (2026-10-27)

- A rogue/hostage process holding the OLD token deleted every `setWebhook`
  within seconds (proven: even a dummy `httpbin` URL was wiped instantly).
- The ghost was NOT on Render (service suspended), NOT on GitHub Actions,
  NOT on this Mac. Likely an old secondary host holding the leaked token.
- Definitive kill = BotFather `/revoke` → new token → rekey everywhere.

## Recovery runbook

1. On your phone/desktop: `@BotFather` → `/revoke` → choose `@Black_Fighters_FREE_bot`.
2. Give the new token to the platform maintainer; they run:
   ```bash
   NEW_TOKEN="paste-here" bash /tmp/bf-token-rekey.sh
   ```
   which validates the token, rotates `TELEGRAM_BOT_TOKEN` on Vercel
   (Production, sensitive), syncs local `.env` files, redeploys, and
   re-registers the webhook with the rotated `TELEGRAM_WEBHOOK_SECRET`.
3. Verify: send `/start` to `@Black_Fighters_FREE_bot` — the platform engine
   must answer within ~2s. Check `getWebhookInfo` shows
   `url=https://blackfighters.site/api/telegram-webhook`, `pending_update_count`
   small, `last_error_message` null.

## Never do

- ❌ Run this repo with `BOT_MODE=polling` on any always-on host in production.
- ❌ Set `BOT_ALLOW_TAKEOVER=1` outside of an emergency runbook.
- ❌ Share or re-post `TELEGRAM_BOT_TOKEN` — channels, docs, screenshots.
- ❌ Call `deleteWebhook` from scripts/tools.

## Local development

`npm run dev` (polling) is fine **locally only** while NO webhook is registered.
The guarded entry exits politely instead of deleting a live webhook.
