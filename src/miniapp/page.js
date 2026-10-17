// The Mini App page: one quiz at a time, animated cards, a progress bar, streak counter,
// mistakes retry round, and a confetti finish. Reads Telegram's initData and sends it with every request.

export const APP_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Black Fighters · Quiz</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{--bg:#0f1115;--card:#171a21;--ink:#f2f2f0;--mute:#9aa0aa;--sig:#ff6a3d;--ok:#3fbf7f;--bad:#ff6b5b;--ease:cubic-bezier(.19,1,.22,1)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 "Inter","IBM Plex Sans Arabic",system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh;display:flex;flex-direction:column}
header{padding:16px 18px 8px}.bar{height:6px;background:#262a33;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--sig);transition:width .6s var(--ease)}
.meta{display:flex;justify-content:space-between;align-items:center;color:var(--mute);font-size:13px;margin-top:8px;font-weight:600}
.streak{color:#ffd166;font-weight:700}
main{flex:1;padding:14px 18px 28px;display:grid;align-content:start;gap:12px;position:relative;overflow:hidden;max-width:680px;width:100%;margin:0 auto}
.q{background:var(--card);border:1px solid #262a33;border-radius:18px;padding:20px;animation:in .55s var(--ease) both;font-size:18px;font-weight:700;line-height:1.55}
@keyframes in{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
.opt{background:var(--card);border:1px solid #262a33;color:var(--ink);text-align:start;padding:15px 16px;border-radius:14px;font:inherit;cursor:pointer;transition:transform .35s var(--ease),border-color .3s,background .3s;animation:in .5s var(--ease) both;line-height:1.45}
.opt:active{transform:scale(.97)}.opt:hover{border-color:var(--sig)}
.opt.ok{border-color:var(--ok);background:rgba(63,191,127,.14);font-weight:600}.opt.bad{border-color:var(--bad);background:rgba(255,107,91,.14)}
.opt:disabled{cursor:default}
.note{color:var(--ink);background:rgba(255,255,255,.04);border-radius:12px;padding:10px 14px;font-size:14px;min-height:22px;animation:in .5s var(--ease) both;display:none}
.note.visible{display:block}
.next,.act-btn{background:var(--sig);color:#111;border:0;border-radius:14px;padding:14px;font:700 16px system-ui;cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s var(--ease);pointer-events:none;width:100%;margin-top:4px}
.next.show,.act-btn.show{opacity:1;transform:none;pointer-events:auto}
.act-btn.sec{background:#262a33;color:var(--ink);margin-top:8px}
.done{text-align:center;padding-top:26px;animation:in .7s var(--ease) both;display:grid;gap:12px}.done .big{font-size:54px;font-weight:800;color:var(--sig)}
canvas{position:fixed;inset:0;pointer-events:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style></head>
<body>
<header><div class="bar"><i id="prog"></i></div><div class="meta"><span id="count"></span><span id="streak" class="streak"></span><span id="score"></span></div></header>
<main id="main"><div class="note visible">Loading…</div></main>
<canvas id="fx"></canvas>
<script>
(function(){
  var tg = window.Telegram && window.Telegram.WebApp; if (tg) { tg.ready(); tg.expand(); }
  var qid = new URLSearchParams(location.search).get('qid') || '';
  var initData = tg ? tg.initData : '';
  var state = { allItems: [], items: [], i: 0, score: 0, streak: 0, missed: [] };
  var main = document.getElementById('main');
  function haptic(kind){ try { tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred(kind); } catch(e){} }
  function api(path, body){
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Authorization': 'tma ' + initData, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error || r.status); return j; }); });
  }
  function render(){
    var it = state.items[state.i];
    document.getElementById('count').textContent = (state.i + 1) + ' / ' + state.items.length;
    document.getElementById('score').textContent = '★ ' + state.score;
    document.getElementById('streak').textContent = state.streak >= 2 ? ('🔥 ' + state.streak) : '';
    document.getElementById('prog').style.width = (state.i / state.items.length * 100) + '%';
    main.innerHTML = '<div class="q" dir="auto">' + esc(it.q) + '</div>' +
      it.options.map(function(o,k){ return '<button class="opt" dir="auto" style="animation-delay:' + (k*70) + 'ms" data-k="' + k + '"><b>' + String.fromCharCode(65+k) + '.</b> ' + esc(o) + '</button>'; }).join('') +
      '<div class="note" id="note" dir="auto"></div><button class="next" id="next">Next · التالي</button>';
    Array.prototype.forEach.call(main.querySelectorAll('.opt'), function(b){ b.onclick = function(){ choose(+b.dataset.k); }; });
    document.getElementById('next').onclick = next;
  }
  function choose(k){
    var it = state.items[state.i];
    var origIdx = it._origIdx != null ? it._origIdx : state.i;
    var btns = main.querySelectorAll('.opt'); Array.prototype.forEach.call(btns, function(b){ b.disabled = true; });
    api('/api/app/answer', { qid: qid, index: origIdx, choice: k }).then(function(r){
      btns[k].classList.add(r.correct ? 'ok' : 'bad');
      if (!r.correct && btns[r.answer]) btns[r.answer].classList.add('ok');
      if (r.correct) { state.score++; state.streak++; }
      else { state.streak = 0; state.missed.push(it); }
      haptic(r.correct ? 'success' : 'error');
      var noteEl = document.getElementById('note');
      noteEl.textContent = (r.correct ? '✅ Correct. ' : '❌ Not quite. ') + (r.explanation ? ('💡 ' + r.explanation) : '');
      noteEl.classList.add('visible');
      document.getElementById('score').textContent = '★ ' + state.score;
      document.getElementById('streak').textContent = state.streak >= 2 ? ('🔥 ' + state.streak) : '';
      document.getElementById('next').classList.add('show');
    }).catch(function(e){
      var noteEl = document.getElementById('note');
      noteEl.textContent = 'Could not check: ' + e.message;
      noteEl.classList.add('visible');
    });
  }
  function next(){ state.i++; if (state.i >= state.items.length) return finish(); render(); }
  function finish(){
    document.getElementById('prog').style.width = '100%';
    var pct = Math.round(state.score / state.items.length * 100);
    var retryBtn = state.missed.length ? '<button class="act-btn show" id="retry">🔄 Retry Mistakes (' + state.missed.length + ') · إعادة حل الأخطاء</button>' : '';
    var restartBtn = '<button class="act-btn sec show" id="restart">🔁 Restart Full Quiz · إعادة الكويز</button>';
    main.innerHTML = '<div class="done"><div class="big">' + state.score + ' / ' + state.items.length + ' (' + pct + '%)</div><div class="note visible">' + (pct === 100 ? '🏆 Flawless · ممتاز بالكامل!' : pct >= 70 ? '💪 Strong work · شغل عالي!' : '📚 Review the misses and try again · راجع الأخطاء وجرب تاني') + '</div>' + retryBtn + restartBtn + '</div>';
    if (document.getElementById('retry')) {
      document.getElementById('retry').onclick = function(){
        state.items = state.missed.slice(); state.missed = []; state.i = 0; state.score = 0; state.streak = 0; render();
      };
    }
    if (document.getElementById('restart')) {
      document.getElementById('restart').onclick = function(){
        state.items = state.allItems.slice(); state.missed = []; state.i = 0; state.score = 0; state.streak = 0; render();
      };
    }
    haptic('success'); if (pct >= 70) confetti();
  }
  function confetti(){
    var c = document.getElementById('fx'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    var ps = []; for (var i=0;i<120;i++) ps.push({ x: innerWidth/2, y: innerHeight/3, vx: (Math.random()-0.5)*10, vy: Math.random()*-12-4, r: Math.random()*5+3, col: ['#ff6a3d','#3fbf7f','#ffd166','#6aa9ff'][i%4] });
    (function tick(){
      x.clearRect(0,0,c.width,c.height); var alive = false;
      ps.forEach(function(p){ p.vy += 0.35; p.x += p.vx; p.y += p.vy; if (p.y < c.height + 20) alive = true; x.fillStyle = p.col; x.fillRect(p.x, p.y, p.r, p.r); });
      if (alive) requestAnimationFrame(tick); else x.clearRect(0,0,c.width,c.height);
    })();
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
  if (!qid) { main.innerHTML = '<div class="note visible">Open this quiz from the bot.</div>'; return; }
  api('/api/app/quiz?qid=' + encodeURIComponent(qid)).then(function(d){
    state.allItems = (d.items || []).map(function(it, idx){ return { q: it.q, options: it.options, _origIdx: idx }; });
    state.items = state.allItems.slice();
    render();
  }).catch(function(e){ main.innerHTML = '<div class="note visible">Could not load the quiz (' + esc(e.message) + ').</div>'; });
})();
</script></body></html>`;
