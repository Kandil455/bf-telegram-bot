// Telegram Stars payments. Invoices use currency XTR (no provider token). A pre-checkout
// query is approved only for known paid plans. A successful payment grants the plan.

import { PLANS } from "../services/plans.js";

export function invoiceFor(planId, lang = "en") {
  const plan = PLANS[planId];
  if (!plan || !plan.stars) return null;
  const title = lang === "ar" ? `اشتراك ${plan.name.ar}` : `${plan.name.en} plan`;
  const description =
    lang === "ar"
      ? `${plan.features.ar.join(" · ")}. مدة الاشتراك ${plan.days} يوم.`
      : `${plan.features.en.join(" · ")}. Valid for ${plan.days} days.`;
  return { title, description, payload: `plan:${plan.id}`, currency: "XTR", prices: [{ label: title, amount: plan.stars }] };
}

/** Sends the invoice through the UI adapter. Returns false for unknown or free plans. */
export async function sendPlanInvoice(ui, chatId, planId, lang) {
  const inv = invoiceFor(planId, lang);
  if (!inv) return false;
  await ui.sendInvoice(chatId, inv);
  return true;
}

/** Approves or rejects a pre-checkout query. */
export function checkoutDecision(query) {
  const id = String(query?.invoice_payload || "");
  const planId = id.startsWith("plan:") ? id.slice(5) : null;
  return Boolean(planId && PLANS[planId] && PLANS[planId].stars > 0);
}

/** Applies a successful payment. Returns the grant, or null when it is not a valid plan payment. */
export function applyPayment(payment, plans, userId, store = null, now = Date.now()) {
  if (!payment || payment.currency !== "XTR") return null;
  const planId = String(payment.invoice_payload || "").replace(/^plan:/, "");
  const plan = PLANS[planId];
  if (!plan || payment.total_amount !== plan.stars) return null;
  const charge = payment.telegram_payment_charge_id;
  if (store && charge) {
    if (store.get(`stars:${charge}`)) return { duplicate: true };
    store.set(`stars:${charge}`, { userId, plan: planId, amount: payment.total_amount, at: now, refunded: false }, 400 * 24 * 3600 * 1000);
  }
  return plans.grant(userId, planId, plan.days);
}

/** The stored record of a Stars charge, for receipts, lists and refunds. */
export function paymentRecord(store, chargeId) {
  return store.get(`stars:${chargeId}`) || null;
}
