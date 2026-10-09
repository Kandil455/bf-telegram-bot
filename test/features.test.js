import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createStore } from "../src/services/store.js";
import { createPlans, PLANS } from "../src/services/plans.js";
import { invoiceFor, checkoutDecision, applyPayment } from "../src/features/payments.js";
import { review, createDecks, GRADES } from "../src/features/reviews.js";
import { createGroups, isAddressed, stripMention } from "../src/features/groups.js";
import { createAdminHandler } from "../src/admin/web.js";
import { createRedisStore } from "../src/store/redis.js";
import { conceptsPrompt, cardsPrompt, quizPrompt, groupQuizPrompt, groundedAnswerPrompt, chatPrompt } from "../src/prompts/index.js";

const DAY = 24 * 3600 * 1000;
const cfg = { freeDailyTasks: 10, proDailyTasks: 120, proStars: 150 };

// ───────────── plans and payments ─────────────

test("plans: a grant lifts the limit and expires; revoke drops it at once", () => {
  let t = 1_000_000;
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg, now: () => t });
  assert.equal(plans.active(1), "free");
  assert.equal(plans.limitFor(1), 10);
  plans.grant(1, "pro", 30);
  assert.equal(plans.active(1), "pro");
  assert.equal(plans.limitFor(1), 120);
  assert.equal(plans.figuresFor(1), 6);
  t += 31 * DAY;
  assert.equal(plans.active(1), "free");
  plans.grant(2, "pro", 5);
  plans.revoke(2);
  assert.equal(plans.active(2), "free");
});

test("plans: grants stack from the current expiry, not from today", () => {
  const t = 5_000_000;
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg, now: () => t });
  const first = plans.grant(3, "pro", 10);
  const second = plans.grant(3, "pro", 10);
  assert.equal(second.until - first.until, 10 * DAY);
});

test("payments: invoices are Stars (XTR) with the right amount; checkout only for known paid plans", () => {
  const inv = invoiceFor("pro", "en");
  assert.equal(inv.currency, "XTR");
  assert.equal(inv.prices[0].amount, PLANS.pro.stars);
  assert.equal(invoiceFor("free"), null);
  assert.equal(checkoutDecision({ invoice_payload: "plan:pro" }), true);
  assert.equal(checkoutDecision({ invoice_payload: "plan:free" }), false);
  assert.equal(checkoutDecision({ invoice_payload: "plan:unknown" }), false);
});

test("payments: a valid payment grants the plan; a wrong amount or currency grants nothing", () => {
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg });
  assert.equal(applyPayment({ currency: "XTR", total_amount: 150, invoice_payload: "plan:pro" }, plans, 9)?.plan, "pro");
  assert.equal(applyPayment({ currency: "XTR", total_amount: 1, invoice_payload: "plan:pro" }, plans, 10), null);
  assert.equal(applyPayment({ currency: "USD", total_amount: 150, invoice_payload: "plan:pro" }, plans, 11), null);
  assert.equal(plans.active(10), "free");
});

// ───────────── flashcard reminders ─────────────

test("scheduling: again returns in minutes; good grows the interval; easy grows it more", () => {
  const now = 0;
  const fresh = { ef: 2.5, rep: 0, interval: 0 };
  const again = review(fresh, GRADES.again, now);
  assert.equal(again.interval, 0);
  assert.equal(again.due, 10 * 60 * 1000);

  const g1 = review(fresh, GRADES.good, now);
  assert.equal(g1.interval, 1);
  const g2 = review(g1, GRADES.good, now);
  assert.equal(g2.interval, 6);
  const g3 = review(g2, GRADES.good, now);
  assert.ok(g3.interval > 6);

  const e = review(g2, GRADES.easy, now);
  assert.ok(e.interval > review(g2, GRADES.good, now).interval);
  assert.ok(e.ef >= 1.3);
});

test("decks: add dedupes, due lists only what is ready, grading reschedules", () => {
  let t = 100 * DAY;
  const store = createStore({ dataDir: null });
  const decks = createDecks({ store, now: () => t });
  decks.add(1, [{ q: "What is X?", a: "A" }, { q: "What is X?", a: "dup" }, { q: "What is Y?", a: "B" }]);
  assert.equal(decks.list(1).length, 2);
  assert.equal(decks.due(1).length, 2);
  const id = decks.list(1)[0].id;
  decks.grade(1, id, GRADES.good);
  assert.equal(decks.due(1).length, 1, "graded card is not due right now");
  t += 2 * DAY;
  assert.equal(decks.due(1).length, 2, "and comes back after its interval");
});

test("reminders: fire at the chosen local hour, once a day, only with cards due", () => {
  const t = Date.UTC(2026, 9, 8, 18, 0); // 18:00 UTC
  const store = createStore({ dataDir: null });
  const decks = createDecks({ store, now: () => t });
  decks.add(1, [{ q: "Q", a: "A" }]);
  decks.add(2, [{ q: "Q2", a: "A2" }]);
  decks.setReminderHour(1, 20); // 20:00 local at UTC+2
  decks.setReminderHour(2, 18); // 18:00 local at UTC+0 (offset 0 below)
  const day = "2026-10-08";
  // 18:00 UTC + 2h is 20:00 local, so only user 1 is due with that offset.
  assert.deepEqual(decks.dueReminders({ utcHour: 18, tzOffset: 2, day, users: [1, 2] }).map((d) => d.userId), [1]);
  const due = decks.dueReminders({ utcHour: 18, tzOffset: 0, day, users: [1, 2] });
  assert.deepEqual(due.map((d) => d.userId), [2]);
  decks.markReminded(2, day);
  assert.deepEqual(decks.dueReminders({ utcHour: 18, tzOffset: 0, day, users: [2] }), []);
});

// ───────────── group mode ─────────────

function fakeUi() {
  const calls = [];
  let poll = 0;
  return {
    calls,
    async send(chatId, html) {
      calls.push({ type: "send", chatId, html });
      return 1;
    },
    async sendPoll(chatId, { question, options, correct, explanation }) {
      poll += 1;
      calls.push({ type: "poll", chatId, question, options, correct, explanation, id: `poll-${poll}` });
      return `poll-${poll}`;
    },
  };
}

test("group mode: addressed only by mention, reply, or command", () => {
  assert.equal(isAddressed("hello everyone", "bf_bot"), false);
  assert.equal(isAddressed("@bf_bot quiz me", "bf_bot"), true);
  assert.equal(isAddressed("ok", "bf_bot", { repliedToBot: true }), true);
  assert.equal(isAddressed("/quiz supply", "bf_bot"), true);
  assert.equal(stripMention("@bf_bot what is GDP", "bf_bot"), "what is GDP");
});

test("group quiz: polls go out in order, answers score, the board is posted at the end", async () => {
  const store = createStore({ dataDir: null });
  const ui = fakeUi();
  const groups = createGroups({ store, ui });
  const items = [
    { q: "Q1", options: ["a", "b"], answer: 0, explanation: "because a" },
    { q: "Q2", options: ["x", "y"], answer: 1, explanation: "because y" },
  ];
  await groups.start(-100, items);
  assert.equal(ui.calls.filter((c) => c.type === "poll").length, 1);

  await groups.onAnswer({ pollId: "poll-1", userId: 7, name: "Ana", optionIds: [0] });
  const polls = ui.calls.filter((c) => c.type === "poll");
  assert.equal(polls.length, 2);
  assert.match(polls[1].question, /Q2\/2/);

  await groups.onAnswer({ pollId: "poll-2", userId: 8, name: "Bo", optionIds: [0] });
  const board = ui.calls.filter((c) => c.type === "send").at(-1).html;
  assert.match(board, /Group quiz finished/);
  assert.match(board, /Ana/);
  assert.doesNotMatch(board, /Bo ·/, "a wrong answer scores nothing");
  assert.equal(groups.get(-100), null);
});

test("group quiz: a second answer to the same poll is ignored", async () => {
  const store = createStore({ dataDir: null });
  const ui = fakeUi();
  const groups = createGroups({ store, ui });
  await groups.start(-5, [{ q: "Q", options: ["a", "b"], answer: 0 }, { q: "R", options: ["a", "b"], answer: 0 }]);
  await groups.onAnswer({ pollId: "poll-1", userId: 1, name: "A", optionIds: [0] });
  const again = await groups.onAnswer({ pollId: "poll-1", userId: 2, name: "B", optionIds: [0] });
  assert.equal(again.ignored, true);
});

// ───────────── admin dashboard ─────────────

function fakeReq(method, url, headers = {}, body = null) {
  const r = Readable.from(body ? [Buffer.from(body)] : []);
  r.method = method;
  r.url = url;
  r.headers = headers;
  return r;
}
function fakeRes() {
  return {
    headersSent: false,
    status: 0,
    body: "",
    headers: {},
    writeHead(s, h = {}) {
      this.status = s;
      this.headers = h;
      this.headersSent = true;
    },
    end(b = "") {
      this.body += b;
    },
  };
}

test("admin: refuses without the bearer token, accepts the right one, and grants plans", async () => {
  const token = "a".repeat(32);
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg });
  store.set("user:42", { firstName: "Lina", lastSeen: 1 });
  const handle = createAdminHandler({ token, store, quota: null, plans });

  let res = fakeRes();
  assert.equal(await handle(fakeReq("GET", "/admin/api/stats"), res), true);
  assert.equal(res.status, 401);

  res = fakeRes();
  await handle(fakeReq("GET", "/admin/api/users", { authorization: `Bearer ${token}` }), res);
  assert.equal(res.status, 200);
  assert.match(res.body, /Lina/);

  res = fakeRes();
  await handle(fakeReq("POST", "/admin/api/grant", { authorization: `Bearer ${token}`, "content-type": "application/json" }, JSON.stringify({ userId: 42, plan: "pro", days: 7 })), res);
  assert.equal(res.status, 200);
  assert.equal(plans.active(42), "pro");

  res = fakeRes();
  await handle(fakeReq("POST", "/admin/api/grant", { authorization: `Bearer ${token}` }, JSON.stringify({ userId: "x", plan: "pro" })), res);
  assert.equal(res.status, 400);
});

test("admin: disabled when the token is missing or too short", async () => {
  const handle = createAdminHandler({ token: "short", store: createStore({ dataDir: null }), quota: null, plans: null });
  const res = fakeRes();
  await handle(fakeReq("GET", "/admin"), res);
  assert.equal(res.status, 404);
});

// ───────────── Redis persistence ─────────────

function fakeRedis(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    async scan() {
      return ["0", [...data.keys()]];
    },
    async mget(...keys) {
      return keys.map((k) => data.get(k) ?? null);
    },
    pipeline() {
      const ops = [];
      const pipe = {
        set(...args) {
          ops.push(["set", ...args]);
          return pipe;
        },
        del(...args) {
          ops.push(["del", ...args]);
          return pipe;
        },
        async exec() {
          for (const op of ops) {
            if (op[0] === "set") data.set(op[1], op[2]);
            else data.delete(op[1]);
          }
          return [];
        },
      };
      return pipe;
    },
    async quit() {},
  };
}

test("redis: loads existing keys at startup, writes changes behind, and deletes", async () => {
  const client = fakeRedis({ "bf:hello": JSON.stringify({ v: "world", exp: 0 }) });
  const store = await createRedisStore({ client, prefix: "bf:", flushMs: 10_000 });
  assert.equal(store.get("hello"), "world");
  store.set("n", { x: 1 });
  store.incr("count", 2);
  await store.flush();
  assert.equal(JSON.parse(client.data.get("bf:n")).v.x, 1);
  assert.equal(JSON.parse(client.data.get("bf:count")).v, 2);
  store.del("hello");
  await store.flush();
  assert.equal(client.data.has("bf:hello"), false);
});

test("redis: expired keys are not loaded", async () => {
  const client = fakeRedis({ "bf:old": JSON.stringify({ v: 1, exp: 1 }) });
  const store = await createRedisStore({ client, prefix: "bf:" });
  assert.equal(store.get("old"), undefined);
});

// ───────────── prompt library ─────────────

test("prompts: quiz, cards and group quiz carry their hard rules and output shape", () => {
  const q = quizPrompt({ lang: "en", source: "x", count: 4 });
  assert.match(q.system, /exactly 4 options/);
  assert.match(q.system, /Return JSON only/);
  assert.equal(q.json, true);
  assert.match(cardsPrompt({ lang: "ar", source: "x" }).system, /one fact per card/);
  assert.match(groupQuizPrompt({ lang: "en", source: "x" }).system, /under 180 characters/);
  assert.match(conceptsPrompt({ lang: "en", source: "x" }).user, /8 to 12 key concepts/);
  assert.match(groundedAnswerPrompt({ lang: "en", material: "m", question: "q" }).system, /label it as general knowledge/);
  assert.match(chatPrompt({ lang: "en", question: "q" }).system, /under 250 words/);
});

test("invoices: Stars invoices pass an empty provider token before the currency", async () => {
  const { createUi } = await import("../src/ui/telegram.js");
  const seen = [];
  const api = { sendInvoice: async (...args) => { seen.push(args); return {}; } };
  const ui = createUi(api, { logger: { warn() {} } });
  await ui.sendInvoice(5, invoiceFor("pro", "en"));
  const [chat, title, description, payload, providerToken, currency, prices] = seen[0];
  assert.equal(chat, 5);
  assert.equal(payload, "plan:pro");
  assert.equal(providerToken, "", "provider token must be empty for Stars");
  assert.equal(currency, "XTR");
  assert.equal(prices[0].amount, PLANS.pro.stars);
  assert.ok(title.length > 0 && description.length > 0);
});
