// Web admin: one dashboard page and a token-protected JSON API.
//   GET  /admin                      dashboard (HTML)
//   GET  /admin/api/stats            today's totals, tokens and plan counts
//   GET  /admin/api/users?q=         users, optionally filtered by id, name or phone
//   POST /admin/api/grant            { userId, plan, days }
//   POST /admin/api/revoke           { userId }
//   POST /admin/api/ban              { userId, banned, reason }
//   POST /admin/api/reset-limits     { userId }   clears today's file and task counters
//   POST /admin/api/message          { userId, text }
//   POST /admin/api/broadcast        { text }     sends message to all known users
//   GET  /admin/api/payments         Stars charges and pending Cash payments, newest first
//   POST /admin/api/cash-decide      { userId, txId, approve }
//   POST /admin/api/refund           { chargeId }
// The bearer token (ADMIN_TOKEN, at least 24 characters) is compared in constant time.

import { timingSafeEqual } from "node:crypto";
import { PLANS } from "../services/plans.js";
import { esc } from "../core/text.js";

const MAX_BODY = 10_000;
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export function createAdminHandler({ token, store, quota, plans, ent = null, refund = null, sendMessage = null, now = () => Date.now() }) {
  const enabled = typeof token === "string" && token.length >= 24;

  function users(query = "") {
    const q = String(query).trim().toLowerCase();
    const today = dayOf(now());
    return store
      .keys("user:")
      .map((k) => {
        const id = Number(k.slice(5));
        const rec = store.get(k) || {};
        const grant = plans.details(id);
        const q2 = quota ? quota.status(id) : null;
        const files = ent ? ent.fileStatus(id) : null;
        const phone = rec.phone || store.get(`verified:${id}`) || "";
        return {
          id,
          firstName: rec.firstName || "",
          phone,
          verified: Boolean(store.get(`verified:${id}`)),
          banned: Boolean(store.get(`banned:${id}`)),
          lastSeen: rec.lastSeen || null,
          plan: plans.active(id),
          until: grant?.until || null,
          tasksToday: q2 ? (q2.unlimited ? "∞" : `${q2.limit - q2.left}/${q2.limit}`) : "-",
          filesToday: files ? (files.unlimited ? "∞" : `${files.used}/${files.limit}`) : "-",
          day: today,
        };
      })
      .filter((u) => !q || String(u.id).includes(q) || u.firstName.toLowerCase().includes(q) || u.phone.includes(q))
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  }

  function stats() {
    const d = dayOf(now());
    const all = users();
    const planCounts = { free: 0, pro: 0 };
    for (const u of all) planCounts[u.plan] = (planCounts[u.plan] || 0) + 1;
    return {
      date: d,
      users: all.length,
      banned: all.filter((u) => u.banned).length,
      verified: all.filter((u) => u.verified).length,
      activeToday: store.get(`stat:users:${d}`) || 0,
      tasksToday: store.get(`stat:tasks:${d}`) || 0,
      filesToday: store.get(`stat:files:${d}`) || 0,
      quizzesToday: store.get(`stat:quizzes:${d}`) || 0,
      tokensToday: store.get(`stat:tokens:${d}`) || 0,
      planCounts,
    };
  }

  function payments() {
    return store
      .keys("stars:")
      .map((k) => ({ chargeId: k.slice(6), ...(store.get(k) || {}) }))
      .filter((p) => p.userId)
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .slice(0, 200);
  }

  function pendingCash() {
    return store
      .keys("cash:pending:")
      .map((k) => store.get(k))
      .filter((p) => p && p.userId && p.txId)
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }

  return async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/admin")) return false;
    if (!enabled) {
      send(res, 404, { error: "not_found" });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/admin") {
      send(res, 200, PAGE, "text/html; charset=utf-8");
      return true;
    }

    const auth = String(req.headers.authorization || "");
    if (!auth.startsWith("Bearer ") || !safeEqual(auth.slice(7), token)) {
      send(res, 401, { error: "unauthorized" });
      return true;
    }

    try {
      if (req.method === "GET" && url.pathname === "/admin/api/stats") return send(res, 200, stats()), true;
      if (req.method === "GET" && url.pathname === "/admin/api/users") return send(res, 200, { users: users(url.searchParams.get("q") || "").slice(0, 300) }), true;
      if (req.method === "GET" && url.pathname === "/admin/api/payments") return send(res, 200, { payments: payments(), pendingCash: pendingCash() }), true;

      if (req.method !== "POST") return send(res, 404, { error: "not_found" }), true;
      const body = await readJson(req);
      const id = Number(body.userId);

      if (url.pathname === "/admin/api/grant") {
        if (!Number.isInteger(id) || !PLANS[body.plan]) return send(res, 400, { error: "bad_request" }), true;
        const days = Math.min(365, Math.max(1, Number(body.days) || PLANS[body.plan].days || 30));
        return send(res, 200, { ok: true, grant: plans.grant(id, body.plan, days) }), true;
      }
      if (url.pathname === "/admin/api/revoke") {
        if (!Number.isInteger(id)) return send(res, 400, { error: "bad_request" }), true;
        plans.revoke(id);
        return send(res, 200, { ok: true }), true;
      }
      if (url.pathname === "/admin/api/ban") {
        if (!Number.isInteger(id)) return send(res, 400, { error: "bad_request" }), true;
        if (body.banned) store.set(`banned:${id}`, { at: now(), reason: String(body.reason || "").slice(0, 200) });
        else store.del(`banned:${id}`);
        return send(res, 200, { ok: true, banned: Boolean(body.banned) }), true;
      }
      if (url.pathname === "/admin/api/reset-limits") {
        if (!Number.isInteger(id)) return send(res, 400, { error: "bad_request" }), true;
        const d = dayOf(now());
        store.del(`q:${id}:${d}`);
        store.del(`files:${id}:${d}`);
        store.del(`tok:${id}:${d}`);
        return send(res, 200, { ok: true }), true;
      }
      if (url.pathname === "/admin/api/message") {
        const text = String(body.text || "").trim().slice(0, 1000);
        if (!Number.isInteger(id) || !text || !sendMessage) return send(res, 400, { error: "bad_request" }), true;
        await sendMessage(id, esc(text));
        return send(res, 200, { ok: true }), true;
      }
      if (url.pathname === "/admin/api/broadcast") {
        const text = String(body.text || "").trim().slice(0, 2000);
        if (!text || !sendMessage) return send(res, 400, { error: "bad_request" }), true;
        const allIds = store.keys("user:").map((k) => Number(k.slice(5))).filter((u) => Number.isInteger(u) && u > 0);
        let sentCount = 0;
        for (const uid of allIds) {
          try {
            await sendMessage(uid, `📢 <b>إشعار من إدارة البوت</b>\n\n${esc(text)}`);
            sentCount++;
          } catch {}
        }
        return send(res, 200, { ok: true, sent: sentCount }), true;
      }
      if (url.pathname === "/admin/api/cash-decide") {
        const txId = String(body.txId || "").trim();
        if (!Number.isInteger(id) || !txId) return send(res, 400, { error: "bad_request" }), true;
        store.del(`cash:pending:${txId}`);
        store.del(`cash:intent:${id}`);
        if (body.approve) {
          store.set(`cash:used:${txId}`, id, 90 * 24 * 3600 * 1000);
          const grant = plans.grant(id, "pro", PLANS.pro.days);
          if (sendMessage) {
            const untilDate = new Date(grant.until).toISOString().slice(0, 10);
            await sendMessage(id, `🎉 <b>تم تفعيل باقة Pro بنجاح!</b>\nساري حتى <b>${untilDate}</b>.`).catch(() => {});
          }
          return send(res, 200, { ok: true, approved: true, grant }), true;
        }
        if (sendMessage) {
          await sendMessage(id, `❌ <b>تم رفض عملية الدفع برقم:</b> <code>${esc(txId)}</code>`).catch(() => {});
        }
        return send(res, 200, { ok: true, approved: false }), true;
      }
      if (url.pathname === "/admin/api/refund") {
        const chargeId = String(body.chargeId || "").trim();
        const rec = store.get(`stars:${chargeId}`);
        if (!chargeId || !rec) return send(res, 404, { error: "unknown_charge" }), true;
        if (rec.refunded) return send(res, 409, { error: "already_refunded" }), true;
        if (!refund) return send(res, 503, { error: "refunds_unavailable" }), true;
        await refund(rec.userId, chargeId);
        store.set(`stars:${chargeId}`, { ...rec, refunded: true, refundedAt: now() }, 400 * 24 * 3600 * 1000);
        if (plans.active(rec.userId) === rec.plan) plans.revoke(rec.userId);
        return send(res, 200, { ok: true }), true;
      }
      return send(res, 404, { error: "not_found" }), true;
    } catch (err) {
      return send(res, 400, { error: err.message || "bad_request" }), true;
    }
  };
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Black Fighters · Admin</title>
<style>
body{font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f6f5;color:#111;margin:0}
header{background:#111;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
main{max-width:1200px;margin:20px auto;padding:0 14px;display:grid;gap:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.card{background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:14px;overflow-x:auto}
.big{font-size:26px;font-weight:700}.mute{color:#666;font-size:12px}
table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:8px 9px;border-bottom:1px solid #eee;text-align:start;white-space:nowrap}
input,select,button{font:inherit;padding:7px 9px;border:1px solid #d4d4d8;border-radius:8px}
button{background:#111;color:#fff;border:0;cursor:pointer;font-weight:600}
button.red{background:#c0392b}button.blue{background:#2563eb}button.green{background:#15803d}
.row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tag{font-size:11px;padding:2px 7px;border-radius:99px;background:#eee}
</style></head><body>
<header><b>Black Fighters · Admin</b><span class="row"><input id="tok" type="password" placeholder="Admin token" style="min-width:240px"><button onclick="save()">Connect</button><button class="blue" onclick="load()">Refresh</button></span></header>
<main>
<section class="grid" id="stats"></section>
<section class="card"><div class="row" style="justify-content:space-between"><b>Users</b><span class="row"><input id="q" placeholder="search id, name or phone" oninput="load()"></span></div><table><thead><tr><th>Id</th><th>Name</th><th>Phone</th><th>Plan</th><th>Until</th><th>Files today</th><th>Tasks today</th><th>Last seen</th><th>Actions</th></tr></thead><tbody id="users"></tbody></table></section>
<section class="card"><b>Grant a plan</b><div class="row" style="margin-top:8px"><input id="guid" placeholder="user id" inputmode="numeric"><select id="gplan"><option>pro</option><option>free</option></select><input id="gdays" placeholder="days" inputmode="numeric" style="width:90px"><button onclick="grant()">Grant</button></div></section>
<section class="card"><b>Message a user / Broadcast</b><div class="row" style="margin-top:8px"><input id="muid" placeholder="user id (leave empty for Broadcast)" inputmode="numeric"><input id="mtext" placeholder="text (plain)" style="min-width:320px"><button onclick="message()">Send to User</button><button class="blue" onclick="broadcast()">Broadcast to All</button></div></section>
<section class="card"><b>Pending Vodafone Cash / InstaPay / Fawry</b><table><thead><tr><th>TxID</th><th>User</th><th>Name</th><th>When</th><th>Actions</th></tr></thead><tbody id="cashPending"></tbody></table></section>
<section class="card"><b>Payments (Telegram Stars)</b><table><thead><tr><th>Charge id</th><th>User</th><th>Plan</th><th>Stars</th><th>When</th><th>Status</th><th></th></tr></thead><tbody id="payments"></tbody></table></section>
<div class="mute" id="msg"></div>
</main>
<script>
const $=id=>document.getElementById(id);
const tok=()=>sessionStorage.getItem('bf_admin')||'';
function save(){sessionStorage.setItem('bf_admin',$('tok').value.trim());load();}
async function api(path,opt={}){const r=await fetch(path,{...opt,headers:{'authorization':'Bearer '+tok(),'content-type':'application/json'}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||r.status);return j;}
function fmt(t){return t?new Date(t).toLocaleString():'—'}
function say(s){$('msg').textContent=s;}
async function act(path,body,ok){try{await api(path,{method:'POST',body:JSON.stringify(body)});say(ok);load();}catch(e){say('Failed: '+e.message);}}
async function load(){try{
  const s=await api('/admin/api/stats');
  $('stats').innerHTML=[['Users',s.users],['Verified',s.verified],['Banned',s.banned],['Active today',s.activeToday],['Tasks today',s.tasksToday],['Files today',s.filesToday],['Quizzes today',s.quizzesToday],['Tokens today',(s.tokensToday||0).toLocaleString()],['Pro users',s.planCounts.pro||0]].map(([k,v])=>'<div class="card"><div class="mute">'+k+'</div><div class="big">'+v+'</div></div>').join('');
  const u=await api('/admin/api/users?q='+encodeURIComponent($('q').value||''));
  $('users').innerHTML=u.users.map(x=>'<tr><td>'+x.id+'</td><td>'+(x.firstName||'')+'</td><td>'+(x.phone||'<i>not verified</i>')+'</td><td>'+x.plan+'</td><td>'+fmt(x.until)+'</td><td>'+x.filesToday+'</td><td>'+x.tasksToday+'</td><td>'+fmt(x.lastSeen)+'</td><td class="row">'+
    (x.banned?'<button class="green" onclick="ban('+x.id+',false)">Unban</button>':'<button class="red" onclick="ban('+x.id+',true)">Ban</button>')+
    '<button class="blue" onclick="reset('+x.id+')">Reset limits</button></td></tr>').join('');
  const p=await api('/admin/api/payments');
  $('cashPending').innerHTML=(p.pendingCash||[]).map(x=>'<tr><td><code>'+x.txId+'</code></td><td>'+x.userId+'</td><td>'+(x.firstName||'')+'</td><td>'+fmt(x.at)+'</td><td class="row"><button class="green" onclick="cashDecide('+x.userId+',\\''+x.txId+'\\',true)">Approve</button><button class="red" onclick="cashDecide('+x.userId+',\\''+x.txId+'\\',false)">Reject</button></td></tr>').join('')||'<tr><td colspan="5" class="mute">No pending transfers</td></tr>';
  $('payments').innerHTML=p.payments.map(x=>'<tr><td>'+x.chargeId+'</td><td>'+x.userId+'</td><td>'+x.plan+'</td><td>'+x.amount+'</td><td>'+fmt(x.at)+'</td><td>'+(x.refunded?'<span class="tag">refunded</span>':'paid')+'</td><td>'+(x.refunded?'':'<button class="red" onclick="refund(\\''+x.chargeId+'\\')">Refund</button>')+'</td></tr>').join('');
}catch(e){say('Not connected ('+e.message+')');}}
function ban(id,b){const reason=b?(prompt('Reason (optional)')||''):'';act('/admin/api/ban',{userId:id,banned:b,reason},b?'Banned':'Unbanned');}
function reset(id){act('/admin/api/reset-limits',{userId:id},'Limits reset for today');}
function grant(){act('/admin/api/grant',{userId:$('guid').value,plan:$('gplan').value,days:$('gdays').value||undefined},'Granted');}
function message(){act('/admin/api/message',{userId:$('muid').value,text:$('mtext').value},'Sent');}
function broadcast(){if(confirm('Send this message to ALL users?'))act('/admin/api/broadcast',{text:$('mtext').value},'Broadcast sent');}
function cashDecide(uid,tx,ok){act('/admin/api/cash-decide',{userId:uid,txId:tx,approve:ok},ok?'Approved':'Rejected');}
function refund(c){if(confirm('Refund this Stars charge and remove the plan?'))act('/admin/api/refund',{chargeId:c},'Refunded');}
if(tok())load();
</script></body></html>`;
