// ===== 화면 UI: HUD · 메뉴 탭 · 모달 · 광고/결제(테스트) =====
const UI = (() => {
  const $ = s => document.querySelector(s);
  const urls = {};
  const IC = (name, sc = 3) => urls[name + sc] || (urls[name + sc] = toURL(['soul', 'jade', 'scroll'].includes(name) ? SP.icon(name) : SP.ui(name), sc));
  const S = () => Game.S;
  let tab = 'grow', mult = 1, nextWraith = 45, test = null, autoAcc = 0, hitSnd = 0, sndT = 0, stuckT = 0, previews = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- 시작 ----------
  function init() {
    Game.load();
    Scene.init($('#cv'), { collect, wraithTap, wraithGone, tick });
    Game.apply();
    Sound.set(S().sound, S().bgm); Sound.init();
    document.querySelectorAll('img[data-ic]').forEach(i => (i.src = IC(i.dataset.ic, 3)));
    document.querySelectorAll('img[data-ui]').forEach(i => (i.src = IC(i.dataset.ui, 3)));
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; Sound.play('open'); render(); }));
    $('#btn-boost').addEventListener('click', boostAd);
    $('#btn-attend').addEventListener('click', attendModal);
    $('#btn-set').addEventListener('click', settings);
    $('#cur-jade').addEventListener('click', () => { tab = 'shop'; render(); });
    $('#panel').addEventListener('click', onPanel);
    setInterval(hud, 200);
    setInterval(() => { if (!document.hidden) Game.save(); }, 5000);
    setInterval(drawPreviews, 160);
    document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); else checkOffline(); });
    window.addEventListener('pagehide', () => Game.save());
    render(); hud();
    if (!S().kind) charSelect(true);
    else checkOffline();
  }

  // ---------- 수확 / 원귀 ----------
  function collect(s, who, x, y) {
    const v = Game.collect(s.tier, who);
    if (who !== 'minion' || Math.random() < 0.7) float(x, y, '+' + fmt(v), 't' + s.tier + (who === 'tap' ? ' tap' : ''));
    const now = performance.now();
    if (who !== 'minion' || now - sndT > 400) { Sound.play('collect', s.tier); sndT = now; }
    if (s.tier >= 2) toast(`${s.tier === 3 ? '🔥' : '✨'} ${TIER_NAME[s.tier]}을 거뒀다! <b>+${fmt(v)}</b>`, 1800);
  }
  function hitW(dmg, x, y, tap) {
    if (!Scene.wraithAlive()) return;
    const killed = Scene.hitWraith(dmg);
    const p = Scene.wraithPos();
    float(x != null ? x : p.x + rnd(-20, 20), y != null ? y : p.y - 30 + rnd(-10, 10), '-' + fmt(dmg), 'dmg');
    const now = performance.now();
    if (tap || now - hitSnd > 300) { Sound.play('hit'); hitSnd = now; }
    if (killed) onKill(p);
  }
  function wraithTap(x, y) { hitW(Game.tapDmg(), x, y, true); }
  function onKill(p) {
    Sound.play('kill');
    if (test) {
      test = null; $('#test-bar').classList.remove('on');
      const R0 = RANKS[S().rank].region;
      if (Game.promote()) { Sound.play('promote'); promoted(RANKS[S().rank].region !== R0); }
      render(); return;
    }
    S().stats.wraith++;
    const amt = Math.max(Game.incomePerSec() * 25, Game.value() * 30);
    Game.gain(amt);
    let jade = 0;
    if (Math.random() < 0.25) { jade = 2 + Math.floor(Math.random() * 6); S().jade += jade; }
    float(p.x, p.y - 40, '+' + fmt(amt), 'big');
    const t = toast(`👻 원귀 퇴치! <b>+${fmt(amt)}</b> 혼${jade ? ` · 옥 +${jade}` : ''}`, 6000, [{ label: '광고 보고 3배', cls: '', fn: () => ad(() => { Game.gain(amt * 2); toast(`보상 3배! +${fmt(amt * 2)}`); }) }]);
    Game.save();
  }
  function wraithGone() {
    if (test) failTest();
  }
  function tick(dt) {
    if (!S().kind) return;
    if (Scene.wraithAlive()) {
      autoAcc += dt;
      if (autoAcc >= 0.5) { autoAcc = 0; hitW(Game.wraithDps() * 0.5); }
    } else if (!test) {
      nextWraith -= dt;
      if (nextWraith <= 0) { nextWraith = rnd(70, 110); Scene.spawnWraith(Game.value() * 50, 22); toast('👻 원귀가 나타났다! 터치해서 퇴치하자', 2200); }
    }
    if (test) {
      test.t -= dt;
      $('#test-bar').innerHTML = `승진 시험 · 원귀 퇴치 <span style="color:#fff">${Math.max(0, test.t).toFixed(1)}초</span>`;
      if (test.t <= 0 && Scene.wraithAlive()) failTest();
    }
  }
  function startTest() {
    const N = Game.nextRank(); if (!N || S().souls < N.cost || test) return;
    test = { t: 30 };
    Scene.spawnWraith(Game.testHp(), 31);
    $('#test-bar').classList.add('on');
    toast('⚔️ 승진 시험 시작! 30초 안에 원귀를 퇴치하라 (연타!)', 2500);
  }
  function failTest() {
    test = null; $('#test-bar').classList.remove('on');
    Sound.play('no');
    modal(`<h2>승진 시험 실패…</h2><p>원귀가 사라졌다.<br>명부 필력과 졸개를 키워 화력을 높이자.</p>
      <p style="color:var(--gold)">2배 부적을 쓰면 화력도 2배가 된다!</p>
      <div class="acts"><button class="btn red" data-act="boostAd">2배 부적 (광고)</button><button class="btn dark" data-act="close">닫기</button></div>`, true);
  }

  // ---------- HUD ----------
  function hud() {
    if (!S()) return;
    $('#v-soul').textContent = fmt(S().souls);
    $('#v-jade').textContent = fmt(S().jade);
    $('#v-rate').textContent = fmt(Game.incomePerSec()) + (Game.incomePerSec() < 10 ? '.' + Math.floor((Game.incomePerSec() * 10) % 10) : '');
    const R = RANKS[S().rank], badge = $('#rank-badge');
    badge.textContent = R.name; badge.classList.toggle('reborn', S().reborn > 0); badge.dataset.r = S().reborn ? `윤회${S().reborn}` : '';
    $('#region').textContent = REGIONS[R.region].name;
    const b = Game.boosting();
    $('#boost-on').classList.toggle('on', b);
    $('#btn-boost').classList.toggle('active', b);
    $('#boost-t').textContent = b ? fmtClock((S().boostUntil - Date.now()) / 1000) : '';
    $('#btn-attend .dot').classList.toggle('on', Game.attendState().can);
    // 탭 알림 점
    const can = ids => ids.some(id => { const U = UPGRADES.find(u => u.id === id); return Game.lv(id) < U.max && Game.cost(id) <= S().souls; });
    dot('grow', can(['pen', 'step', 'call', 'hand', 'luck', 'ledger']));
    dot('minion', can(['minion', 'drill']));
    dot('rank', !!Game.nextRank() && S().souls >= Game.nextRank().cost || Game.canReborn());
    dot('shop', Game.adLeft('jade') > 0);
    refresh();
    if (++stuckT % 25 === 0) checkStuck();
  }
  const dot = (t, on) => $(`#tabs [data-tab="${t}"] .dot`).classList.toggle('on', on);
  const fmtClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function float(x, y, text, cls) {
    const box = $('#floats'); if (box.children.length > 28) box.firstChild.remove();
    const e = document.createElement('span'); e.className = 'fl ' + (cls || ''); e.textContent = text;
    e.style.left = x + 'px'; e.style.top = y + 'px'; box.appendChild(e);
    setTimeout(() => e.remove(), 950);
  }

  // ---------- 메뉴 ----------
  function upRow(U) {
    return `<div class="row pbox" id="row-${U.id}">
      <div class="ic"><img class="px" src="${IC(U.icon, 3)}"></div>
      <div class="info"><div class="nm">${U.name}<small id="lv-${U.id}"></small></div><div class="ds">${U.desc} · <b id="ef-${U.id}"></b></div></div>
      <button class="btn" data-buy="${U.id}"><span class="c"><img class="px" src="${IC('soul', 2)}"><span id="co-${U.id}"></span></span><span class="l" id="bl-${U.id}"></span></button>
    </div>`;
  }
  function render() {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const P = $('#panel'); previews = [];
    const seg = `<div class="seg">${[1, 10, 'max'].map(m => `<button data-mult="${m}" class="${mult === m ? 'on' : ''}">${m === 'max' ? 'MAX' : '×' + m}</button>`).join('')}</div>`;
    if (tab === 'grow') {
      P.innerHTML = `<div class="ph"><h3>저승사자 수련</h3>${seg}</div>` + ['pen', 'call', 'hand', 'step', 'luck', 'ledger'].map(id => upRow(UPGRADES.find(u => u.id === id))).join('');
    } else if (tab === 'minion') {
      const n = Game.minions();
      P.innerHTML = `<div class="ph"><h3>졸개 차사 <span class="sub">${n}/20명</span></h3>${seg}</div>
        <div class="minions-view pbox" id="mview">${n ? '' : '<span class="empty">아직 졸개가 없어요. 고용하면 혼을 대신 거두고, 자리를 비워도 일해요.</span>'}</div>
        ${upRow(UPGRADES.find(u => u.id === 'minion'))}${upRow(UPGRADES.find(u => u.id === 'drill'))}
        <p class="note">화면에는 졸개가 최대 4명까지 보이고, 나머지는 보이지 않는 곳에서 함께 일합니다.<br>자리를 비운 동안에는 수확 효율 60%로 최대 ${Game.offHours()}시간까지 쌓여요.</p>`;
      const mv = $('#mview');
      for (let i = 0; i < n; i++) { const c = document.createElement('canvas'); c.width = 14; c.height = 19; mv.appendChild(c); previews.push({ c, mini: true, ph: i }); }
    } else if (tab === 'rank') {
      renderRank(P);
    } else if (tab === 'shop') {
      renderShop(P);
    }
    refresh(true);
  }
  function renderRank(P) {
    const N = Game.nextRank(), s = S();
    let html = '';
    if (N) {
      const pct = Math.min(100, (s.souls / N.cost) * 100), ok = s.souls >= N.cost;
      const dps = Game.wraithDps(), tap = Game.tapDmg();
      html += `<div class="promo pbox"><div class="t">다음 직급: ${N.name}</div>
        <div class="prog"><i style="width:${pct}%"></i></div>
        <div class="d">필요한 혼 <b style="color:var(--soul)">${fmt(N.cost)}</b> (보유 ${fmt(s.souls)})<br>
        시험: 30초 안에 원귀(체력 <b style="color:#ff8a9a">${fmt(Game.testHp())}</b>) 퇴치<br>
        내 화력: 자동 초당 ${fmt(dps)} · 터치당 ${fmt(tap)} <br>
        승진하면 수확량 <b style="color:var(--gold)">×${(N.mult / RANKS[s.rank].mult).toFixed(1)}</b>${RANKS[s.rank].region !== N.region ? ` · 새 지역 <b style="color:var(--gold)">${REGIONS[N.region].name}</b>` : ''}</div>
        <button class="btn red" data-act="test" ${ok && !test ? '' : 'disabled'}>${test ? '시험 중…' : ok ? '승진 시험 보기' : '혼이 부족해요'}</button></div>`;
    } else {
      html += `<div class="promo pbox"><div class="t">염라대왕에 올랐다!</div>
        <div class="d">윤회하면 직급과 수련이 처음으로 돌아가지만<br>모든 수확량이 영구히 <b style="color:var(--gold)">×${(1 + (s.reborn + 1) * 1.5).toFixed(1)}</b> (지금 ×${Game.rebornMult().toFixed(1)})가 된다.<br>옥·졸개 고용 패키지 효과·구매한 상품은 유지된다.</div>
        <button class="btn red" data-act="reborn">윤회하기</button></div>`;
    }
    html += `<div class="sec">저승 직급표</div><div class="ladder pbox">` + RANKS.map((R, i) => `<div class="lad ${i < s.rank ? 'done' : i === s.rank ? 'now' : i === s.rank + 1 ? 'next' : ''}">
      <span class="n">${i + 1}</span><span class="nm">${R.name} <small style="color:var(--mute)">· ${REGIONS[R.region].name}</small></span><span class="m">×${fmt(R.mult)}</span></div>`).join('') + '</div>';
    P.innerHTML = html;
  }
  function renderShop(P) {
    const s = S(), newbie = Date.now() - s.created < 864e5;
    let h = `<div class="sec">무료 보상</div><div class="grid2">
      <div class="card pbox"><img class="px" src="${IC('luck', 3)}"><div class="nm">2배 부적 ${newbie ? 20 : 10}분</div><div class="ds">혼 수확·화력 2배${newbie ? '<br><span style="color:var(--gold)">신입 특전: 시간 2배!</span>' : ''}</div>
        <button class="btn" data-act="boostAd" ${Game.adLeft('boost') > 0 ? '' : 'disabled'}>광고 보기<em>${Game.adLeft('boost')}/${AD_LIMIT.boost}</em></button></div>
      <div class="card pbox"><img class="px" src="${IC('jade', 4)}"><div class="nm">옥 10개</div><div class="ds">하루 ${AD_LIMIT.jade}번까지</div>
        <button class="btn jade" data-act="jadeAd" ${Game.adLeft('jade') > 0 ? '' : 'disabled'}>광고 보기<em>${Game.adLeft('jade')}/${AD_LIMIT.jade}</em></button></div>
    </div><div class="sec">옥 상점</div><div class="grid2">`;
    h += JADE_SHOP.map(J => `<div class="card pbox"><img class="px" src="${IC(J.hours ? 'scroll' : J.boost ? 'luck' : 'minion', J.hours ? 4 : 3)}"><div class="nm">${J.name}</div><div class="ds">${J.desc}${J.hours ? `<br><b style="color:var(--soul)">+${fmt(Game.incomePerSec(true) * 3600 * J.hours)}</b>` : ''}</div>
      <button class="btn jade" data-jade="${J.id}" ${s.jade >= J.cost ? '' : 'disabled'}><img class="px" src="${IC('jade', 2)}">${J.cost}</button></div>`).join('');
    h += `</div><div class="sec">패키지</div><div class="grid2">`;
    h += SHOP_IAP.map(P => { const own = P.once && s.bought[P.id]; return `<div class="card pbox ${own ? 'owned' : ''}">${P.tag ? `<span class="tag">${P.tag}</span>` : ''}<img class="px" src="${IC(P.icon, P.icon === 'jade' ? 4 : 3)}"><div class="nm">${P.name}</div><div class="ds">${P.desc || '보석함에 바로 지급'}</div>
      <button class="btn red" data-iap="${P.id}" ${own ? 'disabled' : ''}>${own ? '구매 완료' : P.price}</button></div>`; }).join('');
    h += `</div><p class="note">테스트 버전: 실제 결제·광고 없이 바로 지급됩니다.</p>`;
    P.innerHTML = h;
  }
  // 버튼 상태만 갱신 (DOM을 다시 만들지 않아 터치가 끊기지 않음)
  function refresh(force) {
    const s = S(); if (!s) return;
    UPGRADES.forEach(U => {
      const btn = document.querySelector(`[data-buy="${U.id}"]`); if (!btn) return;
      const L = Game.lv(U.id), maxed = L >= U.max;
      let n = mult === 'max' ? Math.max(1, Game.maxBuy(U.id).n) : Math.min(mult, U.max - L);
      const c = maxed ? 0 : Game.cost(U.id, n);
      $(`#lv-${U.id}`).textContent = `Lv.${L}`;
      $(`#ef-${U.id}`).textContent = maxed ? Game.eff(U.id, L) + ' (최대)' : `${Game.eff(U.id, L)} → ${Game.eff(U.id, L + n)}`;
      $(`#co-${U.id}`).textContent = maxed ? '최대' : fmt(c);
      $(`#bl-${U.id}`).textContent = maxed ? '' : `+${n}`;
      btn.disabled = maxed || c > s.souls;
      $(`#row-${U.id}`).classList.toggle('maxed', maxed);
    });
    if (tab === 'rank' && !force) {
      const bar = document.querySelector('.prog i'), N = Game.nextRank();
      if (bar && N) { bar.style.width = Math.min(100, (s.souls / N.cost) * 100) + '%'; const b = document.querySelector('[data-act="test"]'); const ok = s.souls >= N.cost && !test; if (b && b.disabled === ok) renderRank($('#panel')); }
    }
    if (tab === 'shop' && !force) document.querySelectorAll('[data-jade]').forEach(b => { const J = JADE_SHOP.find(j => j.id === b.dataset.jade); b.disabled = s.jade < J.cost; });
  }
  function onPanel(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.mult) { mult = t.dataset.mult === 'max' ? 'max' : +t.dataset.mult; render(); return; }
    if (t.dataset.buy) {
      const id = t.dataset.buy;
      if (Game.buy(id, mult)) {
        Sound.play('buy');
        const r = t.getBoundingClientRect(), st = $('#stage').getBoundingClientRect();
        if (id === 'minion') { toast('졸개 차사가 합류했다!'); render(); }
        refresh(true);
      } else Sound.play('no');
      return;
    }
    if (t.dataset.jade) {
      const J = JADE_SHOP.find(j => j.id === t.dataset.jade);
      confirmBox(`<h2>${J.name}</h2><p>${J.desc}</p><p>옥 ${J.cost}개를 사용할까요?</p>`, () => {
        const r = Game.jadeBuy(J.id);
        if (r) { Sound.play('buy'); toast(typeof r === 'number' ? `+${fmt(r)} 혼` : `${J.name} 사용!`); render(); } else Sound.play('no');
      });
      return;
    }
    if (t.dataset.iap) { iapBox(t.dataset.iap); return; }
    act(t.dataset.act);
  }
  function act(a) {
    if (a === 'test') { startTest(); render(); }
    else if (a === 'reborn') confirmBox(`<h2>윤회</h2><p>직급·수련·보유한 혼이 처음으로 돌아갑니다.<br>모든 수확량이 영구히 ×${(1 + (S().reborn + 1) * 1.5).toFixed(1)}가 됩니다.</p>`, () => { Game.reborn(); Sound.play('promote'); toast('윤회했다! 새로운 생이 시작된다'); render(); });
    else if (a === 'boostAd') { closeModal(); boostAd(); }
    else if (a === 'jadeAd') { if (Game.adLeft('jade') <= 0) return; ad(() => { Game.useAd('jade'); S().jade += 10; Game.save(); toast('옥 +10'); render(); }); }
    else if (a === 'close') closeModal();
  }

  // ---------- 광고 (테스트: 3초 대기) ----------
  function ad(onReward) {
    if (S().noAds) { onReward(); return; }
    if (window.adBreak && window.H5_ADS) {
      window.adBreak({ type: 'reward', name: 'reward', beforeReward: show => show(), adViewed: onReward, adDismissed: () => toast('끝까지 보면 보상을 받아요') });
      return;
    }
    let n = 3;
    modal(`<div class="adbox"><p style="color:var(--mute)">광고 시청 중 (테스트)</p><div class="cnt" id="adcnt">${n}</div><p>실제 출시 때는 구글 보상형 광고가 나옵니다.</p></div>`, true);
    const iv = setInterval(() => { n--; const e = $('#adcnt'); if (e) e.textContent = n; if (n <= 0) { clearInterval(iv); closeModal(); onReward(); } }, 1000);
  }
  function boostAd() {
    if (Game.adLeft('boost') <= 0) { toast('오늘 광고 부적을 모두 썼어요. 상점에서 옥으로 살 수 있어요'); return; }
    const min = Date.now() - S().created < 864e5 ? 20 : 10;
    ad(() => { Game.useAd('boost'); Game.addBoost(min); Sound.play('promote'); toast(`2배 부적 ${min}분! 수확·화력 2배`); render(); });
  }

  // ---------- 결제 (테스트) ----------
  function iapBox(id) {
    const P = SHOP_IAP.find(p => p.id === id);
    confirmBox(`<h2>${P.name}</h2><p>${P.desc || ''}</p><div class="big" style="color:var(--gold)">${P.price}</div><p style="color:var(--mute);font-size:10px">테스트 결제: 실제로 청구되지 않습니다.</p>`, () => {
      if (Game.iap(id)) { Sound.play('promote'); toast(`${P.name} 지급 완료!`); render(); }
    }, '구매');
  }

  // ---------- 모달 ----------
  function modal(html, noClose) {
    const m = $('#modal'), opened = performance.now(); m.innerHTML = `<div class="mbox pbox">${html}</div>`; m.classList.add('on');
    m.onclick = e => {
      if (e.target === m && !noClose && performance.now() - opened > 400) closeModal();
      const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act);
    };
    return m.firstChild;
  }
  function closeModal() { $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; previews = previews.filter(p => document.body.contains(p.c)); }
  function confirmBox(html, ok, label) {
    const box = modal(html + `<div class="acts"><button class="btn red" id="m-ok">${label || '확인'}</button><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelector('#m-ok').onclick = () => { closeModal(); ok(); };
  }
  function toast(html, ms = 2200, actions) {
    const box = $('#toasts'); while (box.children.length > 3) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${html}</span>`;
    (actions || []).forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + a.cls; b.textContent = a.label; b.onclick = () => { t.remove(); a.fn(); }; t.appendChild(b); });
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
    return t;
  }

  // 캐릭터 미리보기 애니메이션
  function drawPreviews() {
    const t = performance.now() / 1000;
    previews.forEach(p => {
      if (!document.body.contains(p.c)) return;
      const g = p.c.getContext('2d'); g.clearRect(0, 0, p.c.width, p.c.height); g.imageSmoothingEnabled = false;
      const f = Math.floor(t * 3 + (p.ph || 0));
      const img = p.mini ? SP.mini('idle', f) : SP.reaper(p.kind, p.pose || 'idle', p.pose === 'reap' ? f % 2 : f % 4);
      g.drawImage(img, 0, 0, p.c.width, p.c.height);
    });
  }
  function charSelect(first) {
    let kind = S().kind || 'm';
    const box = modal(`${first ? '<div class="title-logo">저승사자 키우기</div><div class="title-sub">명부를 들고 떠도는 혼을 거두어 염라대왕이 되어라</div>' : '<h2>모습 바꾸기</h2>'}
      <div class="pick"><button data-k="m"><canvas width="36" height="37"></canvas>남자 차사</button><button data-k="f"><canvas width="36" height="39"></canvas>여자 차사</button></div>
      <input id="nm" maxlength="6" placeholder="이름 (최대 6자)" value="${S().name || ''}">
      <div class="acts"><button class="btn red" id="go">${first ? '저승길 나서기' : '바꾸기'}</button>${first ? '' : '<button class="btn dark" data-act="close">취소</button>'}</div>`, first);
    const sel = () => box.querySelectorAll('.pick button').forEach(b => b.classList.toggle('on', b.dataset.k === kind));
    box.querySelectorAll('.pick button').forEach(b => {
      previews.push({ c: b.querySelector('canvas'), kind: b.dataset.k, pose: 'idle' });
      b.onclick = () => { kind = b.dataset.k; sel(); Sound.play('open'); };
    });
    sel();
    box.querySelector('#go').onclick = () => {
      S().kind = kind; S().name = (box.querySelector('#nm').value || '').trim().slice(0, 6) || (kind === 'f' ? '월하' : '흑립');
      Game.apply(); Game.save(); closeModal();
      if (first) { S().created = Date.now(); toast(`${S().name} 차사, 첫 근무를 시작한다!`, 2500); setTimeout(() => toast('떠도는 혼령을 터치하면 바로 거둘 수 있어요', 3000), 2600); }
      hud();
    };
  }
  function settings() {
    const s = S();
    const box = modal(`<h2>설정</h2>
      <div class="set-row"><span>${s.name} · ${s.kind === 'f' ? '여자' : '남자'} 차사</span><button class="btn dark" id="s-look">모습 바꾸기</button></div>
      <div class="set-row"><span>효과음</span><button class="btn ${s.sound ? '' : 'dark'}" id="s-snd">${s.sound ? '켜짐' : '꺼짐'}</button></div>
      <div class="set-row"><span>배경음</span><button class="btn ${s.bgm ? '' : 'dark'}" id="s-bgm">${s.bgm ? '켜짐' : '꺼짐'}</button></div>
      <div class="set-row"><span>퇴치한 원귀 / 터치 수확</span><span>${s.stats.wraith} / ${s.stats.tap}</span></div>
      <div class="acts"><button class="btn dark" id="s-reset">처음부터</button><button class="btn red" data-act="close">닫기</button></div>`);
    box.querySelector('#s-look').onclick = () => charSelect(false);
    box.querySelector('#s-snd').onclick = () => { s.sound = !s.sound; Sound.set(s.sound, s.bgm); Game.save(); settings(); };
    box.querySelector('#s-bgm').onclick = () => { s.bgm = !s.bgm; Sound.set(s.sound, s.bgm); Game.save(); settings(); };
    box.querySelector('#s-reset').onclick = () => confirmBox('<h2>처음부터</h2><p>모든 진행이 지워집니다. 정말 할까요?</p>', () => { Game.reset(); render(); charSelect(true); });
  }
  function attendModal() {
    const st = Game.attendState(), cur = st.can ? st.streak : S().attend.streak;
    const box = modal(`<h2>출석부</h2><p>매일 들러 옥을 받아가세요. 7일째엔 큰 보상!</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0">${ATTEND.map((r, i) => `<div class="pbox" style="padding:6px 2px;font-size:10px;${i < cur ? 'opacity:.45' : ''}${st.can && i === st.streak ? ';box-shadow:0 0 0 2px var(--gold)' : ''}">${i + 1}일<br><img class="px" src="${IC('jade', 3)}" style="width:20px;margin:3px 0"><br>${r}${i < cur ? '<br>✔' : ''}</div>`).join('')}</div>
      <div class="acts"><button class="btn red" id="a-go" ${st.can ? '' : 'disabled'}>${st.can ? '출석하기' : '내일 또 만나요'}</button></div>`);
    box.querySelector('#a-go').onclick = () => { const r = Game.attend(); if (r) { Sound.play('buy'); toast(`출석 보상 옥 +${r}`); closeModal(); } };
  }
  function promoted(newRegion) {
    const R = RANKS[S().rank];
    const box = modal(`<h2>승진!</h2><canvas width="36" height="${S().kind === 'f' ? 39 : 37}" style="width:108px"></canvas>
      <div class="big" style="color:var(--gold)">${R.name}</div>
      <p>수확량이 <b style="color:var(--gold)">×${fmt(R.mult)}</b>가 되었다.${newRegion ? `<br>새 근무지 <b style="color:var(--gold)">${REGIONS[R.region].name}</b>(으)로 발령!` : ''}</p>
      <div class="acts"><button class="btn red" data-act="close">근무 시작</button></div>`, true);
    previews.push({ c: box.querySelector('canvas'), kind: S().kind, pose: 'reap' });
  }
  function checkOffline() {
    const o = Game.offline(); if (!o || o.amt <= 0) { Game.save(); return; }
    Game.S.last = Date.now();
    const box = modal(`<h2>다녀오셨어요?</h2><p>자리를 비운 <b>${fmtTime(o.away)}</b> 동안<br>졸개들이 혼을 거뒀습니다.${o.capped ? `<br><span style="color:var(--mute);font-size:10px">(저승 장부 한도 ${Game.offHours()}시간까지만 쌓여요)</span>` : ''}</p>
      <div class="big"><img class="px" src="${IC('soul', 3)}">+${fmt(o.amt)}</div>
      <div class="acts"><button class="btn dark" id="o-get">받기</button><button class="btn red" id="o-ad">광고 보고 2배<em>AD</em></button></div>`, true);
    box.querySelector('#o-get').onclick = () => { Game.gain(o.amt); Game.save(); closeModal(); Sound.play('collect', 2); };
    box.querySelector('#o-ad').onclick = () => { closeModal(); ad(() => { Game.gain(o.amt * 2); Game.save(); toast(`보상 2배! +${fmt(o.amt * 2)}`); Sound.play('promote'); }); };
  }
  // 성장이 막혔을 때 한 번씩 도움 제안 (20분에 1회)
  function checkStuck() {
    const s = S(); if (!s.kind || $('#modal').classList.contains('on') || test) return;
    if (Date.now() - s.lastBuy < 180000 || Date.now() - s.stuckShown < 20 * 60000) return;
    const inc = Game.incomePerSec();
    const cheapest = Math.min(...UPGRADES.filter(U => Game.lv(U.id) < U.max).map(U => Game.cost(U.id)));
    const N = Game.nextRank();
    if (cheapest <= s.souls + inc * 120 || (N && N.cost <= s.souls + inc * 300)) return;
    s.stuckShown = Date.now(); Game.save();
    modal(`<h2>성장이 더디신가요?</h2><p>다음 수련까지 시간이 꽤 걸려요.<br>부적이나 패키지로 빠르게 넘어가 보세요!</p>
      <div class="acts" style="flex-direction:column"><button class="btn red" data-act="boostAd">2배 부적 (광고 무료)</button><button class="btn" id="st-pkg">승진 응원 패키지 ₩3,300</button><button class="btn dark" data-act="close">괜찮아요</button></div>`)
      .querySelector('#st-pkg').onclick = () => { closeModal(); iapBox('promo'); };
  }

  return { init, toast };
})();
