import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/services/store.js";
import { createPlans } from "../src/services/plans.js";
import { createCash, parseCashSms, normaliseDigits } from "../src/features/cash.js";

// Redacted fixtures modelled on real Vodafone Cash messages. The wallet is 01000000000,
// the sender is 01200000000, and transaction numbers are made up. Structure is kept exactly:
// the RECEIVED message names our wallet, the SENT message is an outgoing transfer.
const WALLET = "01000000000";
const RECEIVED_AR = "تم استلام مبلغ 103 جنيه من رقم 010XXXXXXX المسجل بإسم Test User على رقم محفظتك 01000000000. رصيدك الحالي: 115.78 جنيه. تاريخ العملية: 08:45 26-10-07. رقم العملية: 024400000001";
const SENT_AR = "تم تحويل 114 جنيه لرقم 01200000000 مصاريف الخدمة 1 جنيه رصيد حسابك فى فودافون كاش الحالي 0.78. تاريخ العملية 08:48 26-10-07 : رقم العملية 024400000002 :";
const PROMO = "حول فلوس لأي محفظة وزود فرصك تكسب جنيه دهب! http://vf.eg/vfcash?id=money_transfer";
const SECRET = "s".repeat(20);

function setup({ t0 = 1_000_000, senders = [] } = {}) {
  let t = t0;
  const store = createStore({ dataDir: null });
  const plans = createPlans({ store, cfg: { freeDailyTasks: 10, proDailyTasks: 120, proStars: 150, proEgp: 100 }, now: () => t });
  const cfg = { cashNumber: WALLET, cashSecret: SECRET, cashTx: null, cashAmount: null, cashSenders: senders };
  const cash = createCash({ store, plans, cfg, now: () => t });
  return { store, plans, cash, advance: (ms) => (t += ms) };
}

test("parsing: a received message gives the transaction number and amount", () => {
  assert.deepEqual(parseCashSms(RECEIVED_AR, { receiver: WALLET }), { txId: "024400000001", amount: 103 });
});

test("parsing: an outgoing transfer never counts, even with a big amount and a transaction number", () => {
  assert.equal(parseCashSms(SENT_AR, { receiver: WALLET }), null);
  assert.equal(parseCashSms(SENT_AR), null);
});

test("parsing: a message for another wallet is ignored", () => {
  const other = RECEIVED_AR.replace("01000000000", "01111111111");
  assert.equal(parseCashSms(other, { receiver: WALLET }), null);
});

test("parsing: promotional text and Arabic-Indic digits", () => {
  assert.equal(parseCashSms(PROMO, { receiver: WALLET }), null);
  const arabicDigits = RECEIVED_AR.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
  assert.deepEqual(parseCashSms(arabicDigits, { receiver: WALLET }), { txId: "024400000001", amount: 103 });
  assert.equal(normaliseDigits("١٠٣"), "103");
});

test("parsing: English received message", () => {
  const en = "You have received 250 EGP in your wallet 01000000000. Transaction ID: 987654321.";
  assert.deepEqual(parseCashSms(en, { receiver: WALLET }), { txId: "987654321", amount: 250 });
});

test("ingest: wrong secret is refused; the sent message is never stored", () => {
  const { cash } = setup();
  assert.equal(cash.ingest({ secret: "wrong", body: { text: RECEIVED_AR } }), "unauthorized");
  assert.equal(cash.ingest({ secret: SECRET, body: { text: SENT_AR } }), "unparsed");
  assert.equal(cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR } }), "stored");
  assert.equal(cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR } }), "duplicate");
});

test("ingest: a sender allow-list is enforced when configured", () => {
  const { cash } = setup({ senders: ["VodafoneCash"] });
  assert.equal(cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR, sender: "Someone" } }), "wrong_sender");
  assert.equal(cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR, sender: "vodafonecash" } }), "stored");
});

test("claim: a buyer cannot win by claiming the outgoing transfer's number", () => {
  const { cash, plans } = setup();
  cash.start(9, "pro");
  cash.ingest({ secret: SECRET, body: { text: SENT_AR } });
  assert.equal(cash.claim(9, "024400000002").status, "pending");
  assert.equal(plans.active(9), "free");
});

test("claim: pending until the received SMS arrives, then granted, then burned", () => {
  const { cash, plans } = setup();
  cash.start(7, "pro");
  assert.equal(cash.claim(7, "024400000001").status, "pending");
  cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR } });
  assert.equal(cash.claim(7, "024400000001").status, "ok");
  assert.equal(plans.active(7), "pro");
  assert.equal(cash.claim(7, "024400000001").status, "no_intent");
});

test("claim: a number works once, for whoever claims it first", () => {
  const { cash, plans } = setup();
  cash.start(1, "pro");
  cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR } });
  assert.equal(cash.claim(1, "024400000001").status, "ok");
  cash.start(2, "pro");
  assert.equal(cash.claim(2, "024400000001").status, "used");
  assert.equal(plans.active(2), "free");
});

test("claim: an amount below the plan price is refused and reports both figures", () => {
  const { cash, plans } = setup();
  cash.start(3, "pro");
  cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR.replace("103", "40") } });
  const r = cash.claim(3, "024400000001");
  assert.equal(r.status, "amount");
  assert.equal(r.got, 40);
  assert.equal(r.need, 100);
  assert.equal(plans.active(3), "free");
});

test("claim: a payment window expires after 30 minutes", () => {
  const { cash, advance } = setup();
  cash.start(4, "pro");
  cash.ingest({ secret: SECRET, body: { text: RECEIVED_AR } });
  advance(31 * 60 * 1000);
  assert.equal(cash.claim(4, "024400000001").status, "expired");
});

test("claim: short or non-numeric ids are refused before any lookup", () => {
  const { cash } = setup();
  cash.start(5, "pro");
  assert.equal(cash.claim(5, "12").status, "bad_id");
  assert.equal(cash.claim(5, "abc").status, "bad_id");
});

test("start: free plans have no window; disabled config is reported", () => {
  const { cash } = setup();
  assert.equal(cash.start(6, "free"), null);
  assert.equal(cash.enabled, true);
  const off = createCash({ store: createStore({ dataDir: null }), plans: null, cfg: { cashNumber: "", cashSecret: "" } });
  assert.equal(off.enabled, false);
});
