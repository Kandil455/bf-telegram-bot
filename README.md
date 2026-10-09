# Black Fighters Bot

A fast, sharp Telegram study bot. Send it a lecture, a Word or PowerPoint file, a PDF, a text, or a photo of your notes. It reads the material, then summarizes it, quizzes you, builds flashcards, or answers your questions from it.

It is a standalone service. It has no connection to any web platform, database or account system. Its only dependencies are grammY (the Telegram framework), a PDF reader, a Word reader, a PowerPoint reader and a zip reader.

## What it does

| You send | The bot offers |
|---|---|
| A PDF, DOCX, PPTX, TXT, MD, CSV or JSON file | Summarize · Quiz me · Flashcards · Key points · Explain · Ask |
| A photo of notes, a slide or a diagram | The same actions. It reads the image with vision and describes diagrams in full |
| Pasted text (over 400 characters) | The same actions, as if it were a file |
| A question with no file | A direct answer. Free and unlimited |
| "quiz me" with no file | Asks for a topic, then builds a quiz on it |

Quizzes are interactive. Each question has four tap-to-answer buttons. Right or wrong, you get a one-line explanation, a progress bar and a final score. Flashcards hide their answers behind spoilers.

Language follows you: a message in Arabic gets an Arabic reply and Arabic buttons. `/lang en` or `/lang ar` sets it explicitly.

## Architecture

```
Telegram ──► webhook (src/server.js) ──► grammY (src/bot.js)
                                              │ normalised update
                                              ▼
                                        router (src/router.js)  ◄── pure logic, fully tested
                                  ┌───────────┼────────────┐
                                  ▼           ▼            ▼
                               ui (Bot API)  ai (chain)   files (PDF/DOCX/PPTX/vision)
                                                │
                                          store + quota (DATA_DIR)
```

| Path | Responsibility |
|---|---|
| `src/core/copy.js` | Every sentence the bot says, in English and Arabic |
| `src/keyboards.js` | Every button layout. Change the design here |
| `src/core/buttons.js` | Button builder: premium icon, style, and automatic downgrade |
| `src/core/icons.js` | Icon glyphs and the premium custom-emoji map |
| `src/services/ai.js` | Provider chain: Gemini (vision + JSON), then Groq, then OpenRouter |
| `src/services/files.js` | Download and text extraction for each file type |
| `src/services/quota.js` | Daily task limit per user, with refunds on failure |
| `src/services/store.js` | Small key-value store with TTL, file-backed when `DATA_DIR` is set |
| `src/ui/telegram.js` | The only layer that calls the Bot API. Retries flood waits and falls back gracefully |
| `src/router.js` | The brain: intake, intents, tasks, quiz state machine, commands, callbacks |

## Speed

- Webhooks, not polling, in production. Telegram pushes each update the moment it happens.
- Every file's extracted text is cached for seven days by Telegram's `file_unique_id`. A second action on the same file does not download or parse it again.
- Long work shows a progress message right away ("Reading…", "Extracting…", "Thinking…"), then edits that same message into the result. Nothing feels frozen.
- AI calls have a 25-second cap per provider. If one provider fails, the next is tried immediately.
- Only one heavy task runs per chat at a time. A second tap gets a polite "still working" instead of a queue.
- Parsers (PDF, Word, PowerPoint) load on first use, so the process starts fast.

## Quotas

Summary, quiz, flashcards and key points each cost tasks from a daily allowance (`FREE_DAILY_TASKS`, default 10). A detailed summary costs two. Questions and chat are free. If a generation fails, the reserved task is refunded. Admins (`ADMIN_TELEGRAM_IDS`) are unlimited and see `/stats`.

The quota is bot-only accounting. If you later want paid tiers or payments, that is a new module. This project does not depend on any platform.

## Setup

### 1. Create the bot
1. Talk to @BotFather, send `/newbot`, and copy the token.
2. Set the description and about text if you want. Optional: `/setuserpic` for an avatar.

### 2. Configure
```bash
cp .env.example .env
# fill in TELEGRAM_BOT_TOKEN, at least one AI key, and in production:
# PUBLIC_URL, TELEGRAM_WEBHOOK_SECRET
npm install
```

### 3. Run locally (polling, no public URL needed)
```bash
npm run dev
```

### 4. Deploy (production, webhook)
Any host that runs a container or Node 18+ will do: Render, Railway, Fly.io, a VPS.

```bash
docker build -t bf-bot .
docker run -d --env-file .env -p 8080:8080 -v bf-data:/data bf-bot
```

Then, with the same environment:
```bash
npm run setup -- --webhook      # points Telegram at PUBLIC_URL with the secret
npm run setup -- --commands     # publishes the menu in English and Arabic
npm run setup -- --info         # checks the webhook status
```

`PUBLIC_URL` must be `https://`. The path in it is the path the bot listens on, for example `https://bot.example.com/telegram`.

### 5. Premium icons (optional)
Create or pick a custom-emoji sticker set in Telegram, then:
```bash
npm run emoji -- your_set_name
```
Paste the printed `PREMIUM_EMOJI_JSON=...` line into your environment and redeploy. Icons without a match keep the standard glyph. Telegram needs a Bot API version that supports custom emoji in buttons. If it does not, the bot falls back to standard buttons on its own, so it never breaks.

## Tests

```bash
npm test
```

35 tests cover the core logic (language, icons, buttons, codec, intents, sanitising, validation), the stores and quotas, and the full router with fake UI, AI and files: intake, summaries with charging and refunds, quiz flow, stale answers, daily limits, admin bypass, busy guard, and Arabic copy.

## Security notes

- The bot token and every AI key live in the environment, never in code. Rotate the token in @BotFather if it has ever been pasted anywhere public.
- Webhook requests must carry the secret token header. Requests without it are rejected by grammY before any handler runs.
- Only private chats are served. Group messages are ignored, so the bot cannot be used to flood a group.
- Extracted text is kept for seven days in `DATA_DIR` for speed. Delete `store.json` to clear it. Nothing is sent to any service except the AI provider you configured, and only the text you chose to process.
- Uploads are capped at `MAX_FILE_MB` (20 MB, the Telegram bot download limit).

## Customize

- Change any sentence: `src/core/copy.js`.
- Change any button, its order, colour or icon: `src/keyboards.js`.
- Change the daily allowance: `FREE_DAILY_TASKS`.
- Change how many questions a quiz has: the default is in the callback `quiz:5` in `src/keyboards.js`.
- Add a new file type: add it to `kindOf` and `extractText` in `src/services/files.js`.
- Add a new action: add its name to `ACTIONS` in `src/core/actions.js`, then handle it in `onCallback` in `src/router.js`.

## Roadmap ideas

- Voice notes: transcribe and treat as text.
- Group mode with mentions and a shared quiz.
- Spaced-repetition reminders for flashcards.
- Redis-backed store for multi-instance deployments (the store interface is already small enough to swap).

## Study documents (v2.1)

Every summary request now opens a style picker. Pick one of six styles and an output language, and the bot sends a self-contained HTML file: white paper, print-ready, with tables, formulas, exam traps and embedded figures.

| Style | What it produces | Cost |
|---|---|---|
| Cram sheet | One dense page of definitions, formulas and traps | 1 |
| Cornell notes | Cue questions beside answers, two-column rows | 1 |
| Comparison tables | Every comparison and classification as a table | 1 |
| Process and timeline | Numbered steps, phases, and the steps people skip | 1 |
| Study cards | 12 to 20 exam-style questions with short answers | 1 |
| OSCE stations | Scenario, tasks, a marked checklist, key phrases | 2 |

Output language is English, Arabic, or both. Bilingual files show each value twice, one line per language, and the labels in both.

**Figures.** Send a photo with a caption (for example "Supply curve") after a file or text is loaded. It is attached to the material. The next document places it after the section whose topic matches the caption. Up to six figures per material, each under 900 KB.

**Long lectures.** Sources over 14,000 characters are split into parts, each part is summarised into sections, and a merge step removes duplicates and keeps the order.

**Prompts.** The exact prompts live in `src/prompts/summary.js`. `npm run prompts` prints them to `docs/PROMPTS.md`. `npm run samples` renders the sample documents in `samples/` without calling any AI.


## Version 3: groups, reminders, plans, Redis, admin

**Group mode.** In a group the bot answers only when addressed: a mention (`@yourbot`), a reply to one of its messages, or a command. `/quiz <topic>`, or `/quiz` as a reply to a message with the material, starts a quiz run with native polls. Each poll is non-anonymous, so answers reach the bot and score points. The next question opens as soon as the first answer lands. `/leaderboard` shows the board and `/stop` ends the run. Group quizzes are free.

**Flashcard reminders.** Every flashcard set you generate is added to your personal deck. `/review` practises the cards that are due, with Again, Hard, Good and Easy. Scheduling follows SM-2: a card you miss returns in ten minutes, and each good answer stretches the interval. `/remind 20` sends you one reminder a day at 20:00 local time, only when cards are due. Set `TZ_OFFSET_HOURS` for your users' offset. `/remind off` turns it off. `/deck` shows the count.

**Plans with Telegram Stars.** `/plans` lists the plans. Pro costs `PRO_STARS` Stars for 30 days and raises the allowance to `PRO_DAILY_TASKS` tasks a day, with six figures per material. Payment runs entirely inside Telegram: an invoice in XTR, a pre-checkout check that approves only known plans, then a grant on success. The webhook must allow `pre_checkout_query` and `poll_answer`, and `npm run setup -- --webhook` already does.

**Redis.** Set `REDIS_URL` and the store loads everything at startup, then writes changes back in batches. Restarts and redeploys keep sessions, decks, reminders, plans and quotas. Run one instance per bot token. Redis here is durable storage, not a way to run several live copies at once.

**Web admin.** Set `ADMIN_TOKEN` and open `/admin` on your deployment. The page shows today's activity, the user list with plans and last-seen times, and forms to grant or revoke a plan. Every request needs the bearer token, compared in constant time. Without a token of 24 characters or more, the page is off.

**Prompts.** Quizzes, flashcards, key points, grounded answers, group quizzes and chat each have a prompt in `src/prompts/index.js`. Every prompt carries a hard rule set, a self-check and a strict output shape. Document prompts stay in `src/prompts/summary.js`.

**Tests.** `npm test` runs 70 tests. 69 run without any network or package beyond Node. The end-to-end test drives a real grammY bot against a fake Telegram API on localhost. It runs after `npm install`, and is skipped otherwise. Run `npm test` after installing to exercise it.

## Version 3.1: Vodafone Cash, custom emoji, Stars check

**Vodafone Cash, verified automatically.** Vodafone Cash has no public API for merchants, so the bot verifies payments from the confirmation SMS. The flow:

1. The buyer taps "Pay with Vodafone Cash" under `/plans`. The bot shows the amount (`PRO_EGP`) and the receiving number (`CASH_NUMBER`), and opens a 30-minute window.
2. The buyer pays, then sends the transaction number to the bot, either as `/txid 123456789` or as the digits alone.
3. An Android phone that receives the confirmation SMS forwards it to `POST https://your-host/webhooks/sms`. The request carries the header `X-SMS-Secret: <CASH_SMS_SECRET>` and the JSON body `{"text": "<the SMS>", "received_at": <ms>}`. Any SMS-forwarding app that can send a custom header and JSON body will do.
4. The bot finds the stored SMS by transaction number, checks the amount and the window, grants the plan, and burns that number. Each number works once, for one user.

Until a real SMS is available, the default patterns only look for common wording such as "transaction", "ref", "رقم العملية", "EGP" and "جنيه". Send me one redacted confirmation SMS and I will set `CASH_TX_REGEX` and `CASH_AMOUNT_REGEX` to match it exactly. Until then, expect the first real payment to need a manual check.

Things to know before taking real money: the phone must stay on with SMS permission and the forwarder running; the shared secret must stay private and the endpoint must be HTTPS; and receiving payments for a service may require a merchant arrangement with the wallet provider or an accountant, so check that first.

**Custom emoji.** The artwork is in `assets/emoji/`: 23 PNG icons at 100×100, one per bot icon, drawn in the brand style. To publish them as a Telegram custom-emoji set:

```bash
python3 scripts/make-emoji-art.py            # only if you want to redraw them
TELEGRAM_BOT_TOKEN=... node scripts/create-emoji-set.js <your_user_id> blackfighters_icons "Black Fighters"
npm run emoji -- blackfighters_icons_by_<your_bot_username>
```

Your user id comes from @userinfobot. The last command prints `PREMIUM_EMOJI_JSON=...`. Paste that line into your environment and redeploy. Each premium icon then shows in the buttons and messages, and any icon without a match keeps its standard glyph.

**Telegram Stars: what was checked.** Reading the code against the Bot API turned up one real bug, now fixed. The invoice call omitted the empty `provider_token` argument, so the currency was sent in the wrong position. The order is now title, description, payload, provider token (empty for Stars), currency, prices, and a test checks it. Stars payments have still not been run against a live account. To test one safely, set `PRO_STARS=1`, buy Pro, check that the plan activates, then set the price back.

## Version 3.3: images, image quizzes, limits, formats

**Images from a file.** Upload a PDF, Word or PowerPoint file and the bot pulls out its pictures. Small icons are dropped by size. On PDFs it uses `pdfimages` from poppler, so that tool must be installed (the Dockerfile does this).

**AI review of images.** Each picture is looked at on its own. The AI keeps course content (diagrams, charts, tables, labelled figures) and drops logos, covers, blanks, dark frames, adverts and unrelated screens, giving each kept image a short caption. You can undo any AI exclusion, or re-run the review on what is still pending.

**The gallery.** The card under a file offers: approve all, review one by one (each image comes with approve, exclude and skip), re-run the AI review, restore AI exclusions, send the images out as albums, or build an image quiz.

**Image OSCE quiz.** Questions are built from the approved images, one image at a time. Each call sees a single picture and writes questions only from what is visible in it, so a question is always tied to one image and the image is sent with the quiz.

**Limits.** Free users upload 2 files a day (Pro: 10). Each file can produce up to 30 quiz questions in total, across all its quizzes. Quiz sizes are 5, 10, 15, 20 and 30, and only the sizes that still fit the file's budget are offered. Summaries are not limited by the file budget.

**Formats.** Summaries come as HTML (default), PDF or PowerPoint. PDF needs `CHROME_PATH` and the `puppeteer-core` package. PowerPoint needs `pptxgenjs`. If one is missing, the student receives HTML with a note saying why.

**Richer documents.** Text can carry `**bold**`, `==highlight==` and `++key term++`. Callouts come in four tones (note, tip, warning, danger). A diagram can be drawn as SVG by the AI; the SVG is sanitised, so scripts, event handlers and external links are removed.

**Animation.** A progress bar runs while the AI works. A quiz that is answered perfectly ends with a confetti effect, and any other finish with a fire effect. Telegram rejects an unknown effect, so the message is then sent without it.

**Buttons.** Primary (blue) for the main actions, success (green) for approve and quiz, danger (red) for exclude. Premium icons come from `PREMIUM_EMOJI_JSON`, as before.

**Before you run it.** Run `npm install` once so `package-lock.json` matches the new packages. The image quiz and the AI review need a vision-capable provider, which means Gemini. Without one, images are kept for manual review and the image quiz says so.

## Premium icons without copying IDs

Create the set once (see `scripts/create-emoji-set.js`), then set `PREMIUM_EMOJI_SET=<set name>` in the environment. The bot reads each sticker's ID at startup and matches it to its icon by glyph. You never copy an ID by hand. `PREMIUM_EMOJI_JSON` still works, and wins for any icon it names.

## Secrets

Keep API keys and the bot token in the hosting provider's environment variables, or in a local `.env` that is never zipped or shared. If a key has ever been uploaded or pasted anywhere, rotate it in the provider's console before you use the bot.

## Version 3.5: quality, service and subscriptions

**Quiz quality.** Generated questions go through three steps before they reach the student. Duplicates are removed, both by question wording and by option set. A second AI pass checks each question against the source: an unsupported question is dropped, a wrong key is corrected when the source supports the fix, and anything else is kept (set `QUIZ_VERIFY=off` to skip the pass). Finally the correct option is moved to a random position, so no letter or length pattern gives the answer away. Image-quiz options are shuffled too.

**Summary quality.** Every number in a generated document must appear in the source. A number the source does not contain is reported, and the document gets one revision pass that removes or corrects it. A long source that produces too few sections is also sent back once for fuller coverage. The revised version is used only if it keeps most of its sections.

**Streaks.** Three correct answers in a row end with a fire effect.

**Payments.** A Stars charge is applied once, even when Telegram delivers it twice. Every new payment is announced to the admins (`ADMIN_TELEGRAM_IDS`).

**Subscriptions.** Three days before a Pro plan ends, the user gets a heads-up with renewal buttons for Stars and Vodafone Cash. When it ends, they get a notice. Each period is announced once.

**Service.** A user's second heavy request within `THROTTLE_MS` is slowed down rather than queued, and admins are exempt. A sticker, a voice note or a contact gets a short reply explaining what the bot reads.

**Not yet verified on Telegram.** Everything above is tested with fakes. The real checks to run: a quiz on a real lecture (are the questions fair and the answers right?), a summary of a real file (are the numbers right?), a Stars payment with `PRO_STARS=1`, and a Vodafone Cash payment with `PRO_EGP=1`.

## Version 3.6: commands, prompts, templates

**Commands.** One list (`src/core/commands.js`) defines the menu. `npm run setup -- --commands` publishes it for private chats and for groups, in English, Arabic and a default. Every published command has a handler, which a test checks. Commands added in this version: `/quiz <topic>`, `/summary`, `/cards`, `/ask`. Re-run `--commands` after deploying so the menu updates.

**Prompts for weaker models.** Every template prompt states its goal ("a student can compare the options side by side"), shows a valid example of the template's shape, and ends with a self-check. The quiz prompt has a worked example and an "avoid these" list. If a model returns too few questions, the bot asks once more for the missing ones, and tells it which questions already exist.

**Templates.** Each template has a valid example in `src/prompts/summary.js` (`TEMPLATE_EXAMPLES`). A test checks that each example still passes the schema and shows the blocks its style is made of.

## Version 3.7: why it said "busy", big files, PDF and PowerPoint, limits, phone

**"The AI is busy".** The whole provider chain used to share one 45-second budget. A slow but valid answer for a long document could run out of time, and the bot then reported the AI as busy. Document generation now gets up to four minutes per call, and other calls up to two minutes. Run `node --env-file=.env scripts/check-ai.js` once: it lists which of your configured Gemini models the key can actually use. A model that is not on that list fails on every call, and the bot falls through to the next provider.

**Summaries that match the file.** Each document gets a size target from its word count. A short result for a long source is sent back once for expansion. A revision is never allowed to make the document shorter. Long lectures keep every part's sections instead of being squeezed into a smaller merge.

**Big files.** Up to 400 pages of a PDF are read (it was 80), and up to 250,000 characters of text (it was 60,000). When a file is still cut short, the student is told how much was read.

**PDF and PowerPoint.** PDF needs Google Chrome, Chromium or Edge. The bot now finds them on this machine automatically, or uses `CHROME_PATH` when set. PowerPoint needs `pptxgenjs`, which is a normal dependency, so run `npm install` once. When a format truly cannot be made, the chat message says why, not only the file caption.

**One button message at a time.** A newer message with buttons removes the older one, so menus and pickers do not pile up. Plain text messages stay.

**Limits.** The daily limit of two files applies to ordinary users. Admins (`ADMIN_TELEGRAM_IDS`) are unlimited unless `ENFORCE_LIMITS_FOR_ADMINS=on`, which is useful for testing the limits with your own account.

**Phone numbers.** Every user shares their own number with a Telegram button before the bot works for them. A contact that is not the sender's own is refused. The admin dashboard (`/admin`, with `ADMIN_TOKEN`) lists the phone number, plan, files and tasks used today for each user.

## Version 3.9: the remaining plan items

**Admin dashboard.** Search users by id, name or phone. Ban and unban (a banned account gets a short notice and nothing else). Reset today's file and task counters for one user. Send a plain-text message to a user. A list of Stars payments, each with a Refund button that also removes the plan. The API and the page are both behind `ADMIN_TOKEN`.

**Receipts and refunds.** Each successful Stars payment sends a receipt with its charge reference, and that reference is what the refund button uses. A refund removes the plan the payment granted.

**Mini App.** A quiz can be opened in an animated web page inside Telegram (`APP_URL` must be an https address on this server). The page sends Telegram's signed `initData` with every request, and the server checks the signature and the age. A quiz is served without its answers, belongs to the user who started it, and every answer is checked on the server.

**Quality measurements.** `node --env-file=.env scripts/evaluate.js ./eval-files` runs a real summary and a real quiz on each text file in a folder, and writes `eval-report.md` with the figures per file: the summary's size against the source, numbers not in the source, questions produced, and what the verifier dropped or fixed. Read the report on real material before you judge quality.

**Still needs your testing on Telegram and real files.** Everything above is covered by tests that use fakes. Run the evaluation on your own material, open a quiz in the Mini App on a phone, make one refund, and check the admin page from a browser.
