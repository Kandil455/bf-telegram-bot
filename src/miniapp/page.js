// The Mini App page: one quiz at a time, animated cards, a progress bar, and a confetti finish.
// It reads Telegram's initData and sends it with every request, so the server can check who is asking.

export const APP_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Black Fighters · Quiz</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
:root{--bg:#0f1115;--card:#171a21;--ink:#f2f2f0;--mute:#9aa0aa;--sig:#ff6a3d;--ok:#3fbf7f;--bad:#ff6b5b;--ease:cubic-bezier(.19,1,.22,1)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh;display:flex;flex-direction:column}
header{padding:16px 18px 8px}.bar{height:6px;background:#262a33;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--sig);transition:width .6s var(--ease)}
.meta{display:flex;justify-content:space-between;color:var(--mute);font-size:13px;margin-top:8px}
main{flex:1;padding:14px 18px 28px;display:grid;align-content:start;gap:12px;position:relative;overflow:hidden}
.q{background:var(--card);border-radius:18px;padding:20px;animation:in .55s var(--ease) both;font-size:18px;font-weight:600;line-height:1.5}
@keyframes in{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}
.opt{background:var(--card);border:1px solid #262a33;color:var(--ink);text-align:start;padding:15px 16px;border-radius:14px;font:inherit;cursor:pointer;transition:transform .35s var(--ease),border-color .3s,background .3s;animation:in .5s var(--ease) both}
.opt:active{transform:scale(.97)}.opt:hover{border-color:var(--sig)}
.opt.ok{border-color:var(--ok);background:rgba(63,191,127,.12)}.opt.bad{border-color:var(--bad);background:rgba(255,107,91,.12)}
.opt:disabled{cursor:default}
.note{color:var(--mute);font-size:14px;min-height:22px;animation:in .5s var(--ease) both}
.next{background:var(--sig);color:#111;border:0;border-radius:14px;padding:14px;font:600 16px system-ui;cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s var(--ease);pointer-events:none}
.next.show{opacity:1;transform:none;pointer-events:auto}
.done{text-align:center;padding-top:30px;animation:in .7s var(--ease) both}.done .big{font-size:56px;font-weight:800}
canvas{position:fixed;inset:0;pointer-events:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style></head>
<body>
<header><div class="bar"><i id="prog"></i></div><div class="meta"><span id="count"></span><span id="score"></span></div></header>
<main id="main"><div class="note">Loading…</div></main>
<canvas id="fx"></canvas>
<script>
(function(){
  var tg = window.Telegram && window.Telegram.WebApp; if (tg) { tg.ready(); tg.expand(); }
  var qid = new URLSearchParams(location.search).get('qid') || '';
  var initData = tg ? tg.initData : '';
  var state = { items: [], i: 0, score: 0 };
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
    document.getElementById('prog').style.width = (state.i / state.items.length * 100) + '%';
    main.innerHTML = '<div class="q">' + esc(it.q) + '</div>' +
      it.options.map(function(o,k){ return '<button class="opt" style="animation-delay:' + (k*70) + 'ms" data-k="' + k + '">' + String.fromCharCode(65+k) + '. ' + esc(o) + '</button>'; }).join('') +
      '<div class="note" id="note"></div><button class="next" id="next">Next</button>';
    Array.prototype.forEach.call(main.querySelectorAll('.opt'), function(b){ b.onclick = function(){ choose(+b.dataset.k); }; });
    document.getElementById('next').onclick = next;
  }
  function choose(k){
    var btns = main.querySelectorAll('.opt'); Array.prototype.forEach.call(btns, function(b){ b.disabled = true; });
    api('/api/app/answer', { qid: qid, index: state.i, choice: k }).then(function(r){
      btns[k].classList.add(r.correct ? 'ok' : 'bad');
      if (!r.correct) btns[r.answer].classList.add('ok');
      if (r.correct) state.score++;
      haptic(r.correct ? 'success' : 'error');
      document.getElementById('note').textContent = (r.correct ? 'Correct. ' : 'Not quite. ') + (r.explanation || '');
      document.getElementById('score').textContent = '★ ' + state.score;
      document.getElementById('next').classList.add('show');
    }).catch(function(e){ document.getElementById('note').textContent = 'Could not check: ' + e.message; });
  }
  function next(){ state.i++; if (state.i >= state.items.length) return finish(); render(); }
  function finish(){
    document.getElementById('prog').style.width = '100%';
    var pct = Math.round(state.score / state.items.length * 100);
    main.innerHTML = '<div class="done"><div class="big">' + state.score + ' / ' + state.items.length + '</div><div class="note">' + (pct === 100 ? 'Flawless.' : pct >= 70 ? 'Strong work.' : 'Review the misses and try again.') + '</div></div>';
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
  if (!qid) { main.innerHTML = '<div class="note">Open this quiz from the bot.</div>'; return; }
  api('/api/app/quiz?qid=' + encodeURIComponent(qid)).then(function(d){ state.items = d.items; render(); })
    .catch(function(e){ main.innerHTML = '<div class="note">Could not load the quiz (' + esc(e.message) + ').</div>'; });
})();
</script></body></html>`;
