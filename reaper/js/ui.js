// ===== 화면 UI: HUD · 메뉴 탭 · 모달 · 광고/결제(테스트) =====
const UI = (() => {
  const $ = s => document.querySelector(s);
  const urls = {};
  const IC = (name, sc = 3) => urls[name + sc] || (urls[name + sc] = toURL(name === 'petic' ? SP.pet(PETS.find(p => p.id === 'heukmyo'), 0) : name === 'flower' ? SP.plant(3, FLOWERS[1].pal, 'lotus') : ['soul', 'jade', 'scroll'].includes(name) ? SP.icon(name) : SP.ui(name), sc));
  const FIC = (fid, stage = 3, sc = 2) => { const k = 'f' + fid + stage + sc; return urls[k] || (urls[k] = toURL(SP.plant(stage, FLOWERS.find(f => f.id === fid).pal, fid), sc)); };
  const SPIC = (i, known, sc = 4) => { const k = 'sp' + i + known + sc; if (urls[k]) return urls[k]; let c = SP.special(i); if (!known) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const g = d.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a2444'; g.fillRect(0, 0, d.width, d.height); c = d; } return (urls[k] = toURL(c, sc)); };
  let sub = 'garden', lifeSig = '', lifeT = 0, buffSig = '', parade = null;
  const S = () => Game.S;
  let tab = 'grow', mult = 1, nextWraith = 45, test = null, autoAcc = 0, hitSnd = 0, sndT = 0, stuckT = 0, previews = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- 시작 ----------
  function init() {
    Game.load();
    Scene.init($('#cv'), { collect, wraithTap, wraithGone, tick, poi, gardenReady: () => Life.alerts().garden }, $('#minimap'));
    $('#labels').innerHTML = Object.entries(POI_LABEL).map(([k, v]) => `<span class="plabel" id="lb-${k}">${v}</span>`).join('');
    Game.apply();
    Sound.set(S().sound, S().bgm); Sound.init();
    document.querySelectorAll('img[data-ic]').forEach(i => (i.src = IC(i.dataset.ic, 3)));
    document.querySelectorAll('img[data-ui]').forEach(i => (i.src = IC(i.dataset.ui, 3)));
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; Sound.play('open'); render(); }));
    $('#btn-boost').addEventListener('click', boostAd);
    $('#btn-attend').addEventListener('click', attendModal);
    $('#btn-quest').addEventListener('click', questModal);
    $('#btn-parade').addEventListener('click', paradeAsk);
    $('#story-bar').addEventListener('click', storyTap);
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
    else { checkOffline(); if (!Story.cur().end && !Story.cur().intro) setTimeout(storyIntro, 600); }
  }

  // ---------- 수확 / 원귀 ----------
  function collect(s, who, x, y) {
    const v = Game.collect(s.tier, who);
    Life.qEvent('soul'); if (who === 'tap') Life.qEvent('tap');
    if (s.sp >= 0) { const first = Life.catchSpecial(s.sp); toast(`${first ? '📖 도감 등록! ' : '✨ '}${SPECIALS[s.sp].name}을 거뒀다${first ? ' (혼 수확 +3%)' : ''}`, 3000); }
    let shown = v;
    if (parade) { parade.gained += v; if (who === 'tap') { parade.combo++; parade.comboT = 1.6; parade.max = Math.max(parade.max, parade.combo); const bonus = v * Math.min(4, parade.combo * 0.1); Game.gain(bonus); parade.gained += bonus; shown += bonus; } }
    if (who !== 'minion' || Math.random() < 0.7) float(x, y, '+' + fmt(shown), 't' + s.tier + (who === 'tap' ? ' tap' : ''));
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
      const oldRank = S().rank; if (Game.promote()) { Scene.pillar(); promoted(RANKS[S().rank].region !== R0, oldRank); }
      render(); return;
    }
    S().stats.wraith++; Life.qEvent('wraith');
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
    placeLabels();
    paradeTick(dt);
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
    const N = Game.nextRank(); if (!N || !Game.canTest() || test) return;
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
    dot('rank', Game.canTest() || Game.canReborn());
    $('#v-lv').textContent = 'Lv.' + Game.level();
    if (Game.canTest() && S().notified !== S().rank) { S().notified = S().rank; toast(`📜 레벨 ${Game.nextRank().lv} 달성! 승진 시험을 볼 수 있어요 (승진 탭)`, 3500); }
    dot('shop', Game.adLeft('jade') > 0);
    dot('pet', Pets.adLeft() > 0 || S().jade >= PULL_COST[1] || S().tickets > 0);
    storyBar();
    const pr = S().parade || (S().parade = { next: Date.now() + 3 * 60e3, ad: { day: '', n: 0 } }), pl = (pr.next - Date.now()) / 1000;
    $('#parade-t').textContent = parade ? '진행 중' : pl > 0 ? fmtClock(pl) : '';
    $('#btn-parade .dot').classList.toggle('on', !parade && pl <= 0);
    $('#btn-parade').classList.toggle('active', !!parade);
    const al = Life.alerts(); dot('life', al.garden || al.expe);
    $('#btn-quest .dot').classList.toggle('on', Life.qReady());
    if (Life.merchantTick() === 'arrive' && S().kind) toast('👺 도깨비 상인이 노점에 왔어요! (5분)', 5000, [{ label: '보러 가기', cls: '', fn: () => { Scene.focus('stall'); merchantModal(); } }]);
    Scene.config({ merchant: Life.merchantHere() });
    // 버프 표시 + 만료 시 설정 다시 적용
    const bs = ['value', 'spawn', 'fight'].filter(k => Life.buffLeft(k) > 0);
    $('#buffs').innerHTML = bs.map(k => `<span>${BUFF_NAME[k]} ${fmtClock(Life.buffLeft(k))}</span>`).join('');
    const sig = bs.join() + Game.boosting(); if (sig !== buffSig) { buffSig = sig; Game.apply(); }
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
    const P = $('#panel'); previews = previews.filter(p => p.keep && document.body.contains(p.c));
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
    } else if (tab === 'pet') {
      renderPet(P);
    } else if (tab === 'life') {
      renderLife(P);
    }
    refresh(true);
  }
  function renderRank(P) {
    const N = Game.nextRank(), s = S(), L = Game.level();
    previews = previews.filter(p => p.keep);
    let html = '';
    if (N) {
      const prev = s.rank ? RANKS[s.rank].lv : 1, pct = Math.max(0, Math.min(100, ((L - prev) / (N.lv - prev)) * 100)), ok = Game.canTest();
      html += `<div class="promo pbox">
        <div class="looks"><div><canvas id="lk-now" width="22" height="22"></canvas><span>${RANKS[s.rank].name}</span></div><b>▶</b><div><canvas id="lk-next" width="22" height="22"></canvas><span class="nx">${N.name}</span></div></div>
        <div class="prog"><i style="width:${pct}%"></i></div>
        <div class="d">레벨 <b style="color:var(--soul)">${L}</b> / ${N.lv} <span style="color:var(--mute)">(수련을 1번 올릴 때마다 레벨 +1)</span><br>
        시험: 30초 안에 원귀(체력 <b style="color:#ff8a9a">${fmt(Game.testHp())}</b>) 퇴치<br>
        내 화력: 자동 초당 ${fmt(Game.wraithDps())} · 터치당 ${fmt(Game.tapDmg())}<br>
        승진하면 옷차림이 바뀌고 수확량 <b style="color:var(--gold)">×${(N.mult / RANKS[s.rank].mult).toFixed(1)}</b>${RANKS[s.rank].region !== N.region ? ` · 새 지역 <b style="color:var(--gold)">${REGIONS[N.region].name}</b>` : ''}</div>
        <button class="btn red" data-act="test" ${ok && !test ? '' : 'disabled'}>${test ? '시험 중…' : ok ? '승진 시험 보기' : `레벨 ${N.lv}에 열려요`}</button></div>`;
    } else {
      html += `<div class="promo pbox"><div class="looks"><div><canvas id="lk-now" width="22" height="22"></canvas><span>염라대왕</span></div></div><div class="t">염라대왕에 올랐다!</div>
        <div class="d">윤회하면 직급과 수련이 처음으로 돌아가지만<br>모든 수확량이 영구히 <b style="color:var(--gold)">×${(1 + (s.reborn + 1) * 1.5).toFixed(1)}</b> (지금 ×${Game.rebornMult().toFixed(1)})가 된다.<br>옥과 구매한 상품은 유지된다.</div>
        <button class="btn red" data-act="reborn">윤회하기</button></div>`;
    }
    html += `<div class="sec">저승 직급표</div><div class="ladder pbox">` + RANKS.map((R, i) => `<div class="lad ${i < s.rank ? 'done' : i === s.rank ? 'now' : i === s.rank + 1 ? 'next' : ''}">
      <canvas width="22" height="22" data-rank="${i}"></canvas><span class="nm">${R.name} <small style="color:var(--mute)">· ${REGIONS[R.region].name}</small></span><span class="lvreq">${i ? 'Lv.' + R.lv : ''}</span><span class="m">×${fmt(R.mult)}</span></div>`).join('') + '</div>';
    P.innerHTML = html;
    const add = (c, r, pose) => c && previews.push({ c, kind: s.kind || 'm', rank: r, pose });
    add($('#lk-now'), s.rank, 'idle'); if (N) add($('#lk-next'), s.rank + 1, 'idle');
    P.querySelectorAll('canvas[data-rank]').forEach(c => add(c, +c.dataset.rank, 'idle'));
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
      if (bar && N) { const b = document.querySelector('[data-act="test"]'); const ok = Game.canTest() && !test; if (b && b.disabled === ok) renderRank($('#panel')); }
    }
    if (tab === 'life' && !force) lifeTick();
    if (tab === 'shop' && !force) document.querySelectorAll('[data-jade]').forEach(b => { const J = JADE_SHOP.find(j => j.id === b.dataset.jade); b.disabled = s.jade < J.cost; });
  }
  function onPanel(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.mult) { mult = t.dataset.mult === 'max' ? 'max' : +t.dataset.mult; render(); return; }
    if (t.dataset.buy) {
      const id = t.dataset.buy;
      const L0 = Game.lv(id);
      if (Game.buy(id, mult)) {
        Life.qEvent('buy', Game.lv(id) - L0);
        Sound.play('buy');
        const r = t.getBoundingClientRect(), st = $('#stage').getBoundingClientRect();
        float(st.width / 2, st.height * 0.42, `Lv.${Game.level()}`, 'lvup');
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
    if (t.dataset.pull) { doPull(t.dataset.pull); return; }
    if (t.dataset.eq) { if (Pets.equip(t.dataset.eq)) { Sound.play('buy'); toast(`${Pets.P(t.dataset.eq).name}을(를) 데리고 다녀요`); render(); } else toast('아직 만나지 못한 영물이에요'); return; }
    if (lifeClick(t)) return;
    act(t.dataset.act);
  }
  function act(a) {
    if (a === 'test') { startTest(); render(); }
    else if (a === 'reborn') confirmBox(`<h2>윤회</h2><p>직급·수련·보유한 혼이 처음으로 돌아갑니다.<br>모든 수확량이 영구히 ×${(1 + (S().reborn + 1) * 1.5).toFixed(1)}가 됩니다.</p>`, () => { Game.reborn(); Sound.play('promote'); toast('윤회했다! 새로운 생이 시작된다'); render(); });
    else if (a === 'boostAd') { closeModal(); boostAd(); }
    else if (a === 'jadeAd') { if (Game.adLeft('jade') <= 0) return; ad(() => { Game.useAd('jade'); S().jade += 10; Game.save(); toast('옥 +10'); render(); }); }
    else if (a === 'close') closeModal();
  }



  // ---------- 맵 건물 ----------
  function placeLabels() {
    const al = Life.alerts ? Life.alerts() : {};
    Scene.labels().forEach(l => {
      const e = document.getElementById('lb-' + l.id); if (!e) return;
      e.classList.toggle('hide', !l.vis);
      if (!l.vis) return;
      e.style.left = l.x + 'px'; e.style.top = l.y + 'px';
      const hot = (l.id === 'garden' && al.garden) || (l.id === 'gate' && al.expe) || (l.id === 'board' && Life.qReady()) || (l.id === 'stall' && Life.merchantHere());
      e.classList.toggle('hot', !!hot);
      if (l.id === 'stall') e.textContent = Life.merchantHere() ? '도깨비 상인!' : '노점';
    });
  }
  function openLife(k) { tab = 'life'; sub = k; render(); }
  function poi(id, i) {
    Sound.play('open');
    if (id === 'tavern') openLife('tavern');
    else if (id === 'garden') openLife('garden');
    else if (id === 'gate') openLife('expe');
    else if (id === 'stele') openLife('dex');
    else if (id === 'board') questModal();
    else if (id === 'merchant') merchantModal();
    else if (id === 'stall') { tab = 'shop'; render(); toast('노점: 옥 상점과 패키지를 볼 수 있어요. 가끔 도깨비 상인도 들러요'); }
    else if (id === 'plot') {
      openLife('garden');
      if (i >= S().plots) { toast('잠긴 밭이에요. 옥으로 열 수 있어요'); return; }
      const st = Life.plotState(i);
      if (st.ready) { const n = Life.harvest(i); Life.qEvent('harvest'); Sound.play('collect', 2); toast(`${st.f.name} ${n}송이 수확!`); renderLife($('#panel')); }
      else if (st.empty) lifeClick({ dataset: { plantpick: String(i) } });
      else toast(`${st.f.name}: ${fmtTime(st.left)} 뒤에 다 자라요`);
    }
  }
  function questModal() {
    Life.ensure();
    const q = S().quest, all = q.list.every(x => x.claimed);
    const box = modal(`<h2>오늘의 의뢰</h2><p>게시판에 붙은 저승 의뢰예요. 매일 새로 바뀌어요.</p>
      ${q.list.map((x, i) => { const P = QUEST_POOL.find(p => p.id === x.id), ok = x.have >= x.need; return `<div class="qrow pbox"><div class="info"><b>${P.name}</b> <span class="mute">${x.have}/${x.need}</span><div class="bar"><i style="width:${Math.min(100, (x.have / x.need) * 100)}%"></i></div></div>
        <button class="btn jade" data-q="${i}" ${ok && !x.claimed ? '' : 'disabled'}>${x.claimed ? '완료' : `<img class="px" src="${IC('jade', 2)}">${P.jade}`}</button></div>`; }).join('')}
      <div class="qrow pbox"><div class="info"><b>모든 의뢰 완료 보너스</b></div><button class="btn red" data-qb="1" ${all && !q.bonus ? '' : 'disabled'}>${q.bonus ? '받음' : `옥 ${QUEST_BONUS}`}</button></div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const j = Life.qClaim(+b.dataset.q); if (j) { Sound.play('buy'); toast(`의뢰 완료! 옥 +${j}`); } questModal(); });
    const bb = box.querySelector('[data-qb]'); if (bb) bb.onclick = () => { const j = Life.qBonus(); if (j) { Sound.play('promote'); toast(`오늘 의뢰를 모두 끝냈다! 옥 +${j}`); } questModal(); };
  }
  function merchantModal() {
    if (!Life.merchantHere()) { toast('도깨비 상인은 지금 없어요. 가끔 노점에 들러요'); return; }
    const m = S().merchant, left = (m.until - Date.now()) / 1000;
    const box = modal(`<h2>👺 도깨비 상인</h2><p>"헤헤, 좋은 물건 있어! 금방 떠날 거야." <span class="mute">(${fmtTime(left)} 남음)</span></p>
      ${m.offers.map(id => { const o = MERCHANT_POOL.find(x => x.id === id), pr = Life.offerPrice(o), sold = m.bought.includes(id), ok = pr.jade ? S().jade >= pr.jade : S().souls >= pr.soul;
        return `<div class="offer pbox"><div class="info"><b>${o.name}</b></div><button class="btn ${pr.jade ? 'jade' : ''}" data-buyo="${id}" ${sold || !ok ? 'disabled' : ''}>${sold ? '구매함' : `<img class="px" src="${IC(pr.jade ? 'jade' : 'soul', 2)}">${fmt(pr.jade || pr.soul)}`}</button></div>`; }).join('')}
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-buyo]').forEach(b => b.onclick = () => { if (Life.merchantBuy(b.dataset.buyo)) { Sound.play('buy'); toast('거래 완료!'); } merchantModal(); });
  }
  // ---------- 생활: 꽃밭 · 주막 · 파견 · 도감 ----------
  const fname = id => FLOWERS.find(f => f.id === id).name;
  function lifeSignature() {
    const s = S(), a = Life.alerts();
    return JSON.stringify([sub, s.plots, s.garden.map((p, i) => { const st = Life.plotState(i); return st.empty ? 0 : st.ready ? 9 : st.stage + 1; }), s.expe.map(x => Life.expeLeft(x) <= 0), s.seeds, s.flowers, s.jade, Game.minions(), s.rank, Object.keys(s.dex).length,
      FLOWERS.map(f => f.soul ? s.souls >= Life.seedSoulCost(f) : s.jade >= f.jade), a.brew]);
  }
  function lifeTick() {
    document.querySelectorAll('[data-left-plot]').forEach(e => { const st = Life.plotState(+e.dataset.leftPlot); if (!st.empty) e.textContent = st.ready ? '다 자랐어요!' : fmtTime(st.left); });
    document.querySelectorAll('[data-left-expe]').forEach(e => { const x = S().expe[+e.dataset.leftExpe]; if (x) { const l = Life.expeLeft(x); e.textContent = l > 0 ? fmtTime(l) + ' 남음' : '돌아왔어요!'; } });
    document.querySelectorAll('[data-left-buff]').forEach(e => { e.textContent = fmtClock(Life.buffLeft(e.dataset.leftBuff)); });
    const al = Life.alerts();
    ['garden', 'expe'].forEach(k => { const d = $('#sd-' + k); if (d) d.classList.toggle('on', al[k]); });
    const d = $('#sd-tavern'); if (d) d.classList.toggle('on', al.brew);
    if (performance.now() - lifeT > 900) { lifeT = performance.now(); const sg = lifeSignature(); if (sg !== lifeSig) renderLife($('#panel')); }
  }
  function renderLife(P) {
    Life.ensure(); lifeSig = lifeSignature();
    const s = S(), segs = [['garden', '꽃밭'], ['tavern', '주막'], ['expe', '파견'], ['dex', '도감']];
    let h = `<div class="subtabs">${segs.map(([k, n]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${n}<i class="dot" id="sd-${k}"></i></button>`).join('')}</div>`;
    if (sub === 'garden') {
      h += `<div class="inv pbox">${FLOWERS.map(f => `<div><img class="px" src="${FIC(f.id)}"><span>${f.name}</span><small>씨앗 ${s.seeds[f.id] || 0} · 꽃 ${s.flowers[f.id] || 0}</small></div>`).join('')}</div>`;
      h += `<div class="plots">` + [0, 1, 2, 3, 4, 5].map(i => {
        if (i >= s.plots) return `<div class="plot pbox locked"><div class="lock">🔒</div><small>밭 ${i + 1}</small>${i === s.plots ? `<button class="btn jade" data-unlock="1" ${s.jade >= PLOT_COST[i] ? '' : 'disabled'}><img class="px" src="${IC('jade', 2)}">${PLOT_COST[i]}</button>` : '<small class="mute">앞 밭 먼저</small>'}</div>`;
        const st = Life.plotState(i);
        if (st.empty) return `<div class="plot pbox"><img class="px" src="${toURL(SP.plant(-1, {}, 'soil'), 4)}"><small>빈 밭</small><button class="btn" data-plantpick="${i}">심기</button></div>`;
        return `<div class="plot pbox ${st.ready ? 'ready' : ''}"><img class="px" src="${FIC(st.f.id, st.stage, 4)}"><small>${st.f.name}</small>${st.ready ? `<button class="btn red" data-harvest="${i}">수확</button>` : `<small class="mute" data-left-plot="${i}">${fmtTime(st.left)}</small>`}</div>`;
      }).join('') + `</div>`;
      h += `<div class="sec">씨앗 가게</div>` + FLOWERS.map(f => {
        const c = f.soul ? Life.seedSoulCost(f) : f.jade, ok = f.soul ? s.souls >= c : s.jade >= c;
        return `<div class="row pbox"><div class="ic"><img class="px" src="${FIC(f.id, 3, 3)}"></div><div class="info"><div class="nm">${f.name} 씨앗</div><div class="ds">${f.desc} · 자라는 데 <b>${fmtTime(f.grow)}</b> · 꽃 ${f.yield[0]}~${f.yield[1]}송이</div></div>
          <button class="btn ${f.soul ? '' : 'jade'}" data-seed="${f.id}" ${ok ? '' : 'disabled'}><span class="c"><img class="px" src="${IC(f.soul ? 'soul' : 'jade', 2)}">${fmt(c)}</span><span class="l">1개</span></button></div>`;
      }).join('') + `<p class="note">꽃은 게임을 꺼 둬도 자라요. 혼불꽃·생사화 씨앗은 파견에서도 얻을 수 있어요.</p>`;
    } else if (sub === 'tavern') {
      const bs = ['value', 'spawn', 'fight'].filter(k => Life.buffLeft(k) > 0);
      h += `<div class="buffbox pbox">${bs.length ? bs.map(k => `<div><b>${BUFF_NAME[k]}</b> 효과 중 <span data-left-buff="${k}">${fmtClock(Life.buffLeft(k))}</span></div>`).join('') : '<span class="mute">지금 마신 탕약이 없어요. 꽃을 모아 달여 보세요.</span>'}</div>`;
      h += RECIPES.map(r => { const ok = Life.canBrew(r); return `<div class="row pbox"><div class="ic"><img class="px" src="${IC(r.instant ? 'jade' : 'luck', 3)}"></div><div class="info"><div class="nm">${r.name}</div><div class="ds">${r.desc}</div>
        <div class="need">${Object.entries(r.need).map(([k, v]) => `<span class="${(s.flowers[k] || 0) >= v ? 'ok' : ''}"><img class="px" src="${FIC(k)}">${fname(k)} ${s.flowers[k] || 0}/${v}</span>`).join('')}</div></div>
        <button class="btn red" data-brew="${r.id}" ${ok ? '' : 'disabled'}>달이기</button></div>`; }).join('');
      h += `<p class="note">같은 탕약을 또 마시면 시간이 늘어나요 (최대 4시간). 혼불주는 승진 시험 화력도 3배!</p>`;
    } else if (sub === 'expe') {
      h += `<div class="ph"><h3>졸개 파견</h3><span class="sub">파견 칸 ${s.expe.length}/${Life.slots()} · 보유 졸개 ${Game.minions()}명</span></div>`;
      h += s.expe.map((x, i) => { const E = EXPEDITIONS.find(e => e.id === x.id), l = Life.expeLeft(x); return `<div class="row pbox"><div class="ic"><img class="px" src="${IC('minion', 3)}"></div><div class="info"><div class="nm">${E.name}</div><div class="ds" data-left-expe="${i}">${l > 0 ? fmtTime(l) + ' 남음' : '돌아왔어요!'}</div></div>
        <button class="btn red" data-claim="${i}" ${l > 0 ? 'disabled' : ''}>보상 받기</button></div>`; }).join('');
      h += `<div class="sec">순찰지</div>` + EXPEDITIONS.map(E => {
        const lockR = s.rank < E.rank, lockM = Game.minions() < E.minion, full = s.expe.length >= Life.slots();
        const rw = [...Object.entries(E.seed).map(([k, v]) => `${fname(k)} 씨앗 ${v}`), E.jade ? `옥 ${E.jade}` : '', `${E.hours >= 1 ? E.hours + '시간' : E.hours * 60 + '분'}치 혼`, E.dex ? '희귀 혼령 기록' : ''].filter(Boolean).join(' · ');
        return `<div class="row pbox ${lockR ? 'maxed' : ''}"><div class="ic"><img class="px" src="${IC('gate', 3)}"></div><div class="info"><div class="nm">${E.name}<small>${fmtTime(E.hrs * 3600)}</small></div><div class="ds">졸개 ${E.minion}명 필요 · <b>${rw}</b></div></div>
          <button class="btn" data-send="${E.id}" ${lockR || lockM || full ? 'disabled' : ''}>${lockR ? RANKS[E.rank].name + '부터' : lockM ? '졸개 부족' : full ? '칸 없음' : '보내기'}</button></div>`;
      }).join('') + `<p class="note">파견을 보내도 졸개는 계속 혼을 거둬요. 선임 차사·명부 판관이 되면 파견 칸이 늘어나요.</p>`;
    } else {
      const n = Object.keys(s.dex).length;
      h += `<div class="ph"><h3>혼령 도감</h3><span class="sub">${n}/${SPECIALS.length}종 · 혼 수확 +${Math.round(Life.dexBonus() * 100)}%</span></div>
        <div class="dex">${SPECIALS.map(p => { const c = s.dex[p.i] || 0; return `<div class="pbox ${c ? '' : 'unk'}"><img class="px" src="${SPIC(p.i, !!c)}"><b>${c ? p.name : '???'}</b><small>${c ? `${c}마리${c >= 10 ? ' ★' : ''}` : REGIONS[p.region].name}</small></div>`; }).join('')}</div>
        <p class="note">특별한 혼령은 아주 가끔 나타나요 (귀한 인연을 올리면 더 자주).<br>처음 거두면 혼 수확 +3%, 10마리 모으면 +2% 더. 근무지마다 나오는 혼령이 달라요.</p>`;
    }
    P.innerHTML = h;
    lifeTick();
  }
  function lifeClick(t) {
    const d = t.dataset;
    if (d.sub) { sub = d.sub; Sound.play('open'); renderLife($('#panel')); return true; }
    if (d.unlock) { if (Life.unlockPlot()) { Sound.play('buy'); toast('새 밭을 일궜어요!'); } renderLife($('#panel')); return true; }
    if (d.harvest) { const n = Life.harvest(+d.harvest); if (n) { Sound.play('collect', 2); Life.qEvent('harvest'); toast(`꽃 ${n}송이 수확!`); } renderLife($('#panel')); return true; }
    if (d.seed) { if (Life.buySeed(d.seed, 1)) Sound.play('buy'); else Sound.play('no'); renderLife($('#panel')); return true; }
    if (d.brew) { const r = Life.brew(d.brew); if (r) { Sound.play('promote'); Life.qEvent('brew'); const R = RECIPES.find(x => x.id === d.brew); toast(typeof r === 'number' ? `${R.name}! +${fmt(r)} 혼 · 옥 +${R.instant.jade}` : `${R.name}을 마셨다! ${R.desc}`); } renderLife($('#panel')); return true; }
    if (d.send) { if (Life.send(d.send)) { Sound.play('buy'); Life.qEvent('send'); toast('졸개를 순찰 보냈어요'); } renderLife($('#panel')); return true; }
    if (d.claim) { const r = Life.claim(+d.claim); if (r) { Sound.play('promote'); toast(`파견 보상: +${fmt(r.souls)} 혼${r.jade ? ` · 옥 +${r.jade}` : ''} · ${Object.entries(r.seeds).map(([k, v]) => fname(k) + ' 씨앗 ' + v).join(', ')}${r.dex ? ` · 📖 ${r.dex.name}` : ''}`, 4000); } renderLife($('#panel')); return true; }
    if (d.plantpick) {
      const i = +d.plantpick, s = S(), have = FLOWERS.filter(f => s.seeds[f.id] > 0);
      const box = modal(`<h2>무엇을 심을까요?</h2>${have.length ? `<div class="seedpick">${have.map(f => `<button class="pbox" data-pf="${f.id}"><img class="px" src="${FIC(f.id, 3, 3)}"><b>${f.name}</b><small>${fmtTime(f.grow)} · 씨앗 ${s.seeds[f.id]}</small></button>`).join('')}</div>` : '<p>씨앗이 없어요. 씨앗 가게에서 사거나 파견으로 얻어 보세요.</p>'}
        <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
      box.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => { if (Life.plant(i, b.dataset.pf)) { Sound.play('buy'); toast(`${fname(b.dataset.pf)}을 심었어요`); } closeModal(); renderLife($('#panel')); });
      return true;
    }
    return false;
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
    ad(() => { Game.useAd('boost'); Game.addBoost(min); Life.qEvent('ad'); Sound.play('promote'); toast(`2배 부적 ${min}분! 수확·화력 2배`); render(); });
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
      const img = p.pet ? SP.pet(p.pet, f) : p.mini ? SP.mini('idle', f) : SP.reaper(p.kind, p.rank != null ? p.rank : S().rank, p.pose || 'idle', p.pose === 'reap' ? f % 2 : f % 4);
      g.drawImage(img, 0, 0, p.c.width, p.c.height);
    });
  }
  function charSelect(first) {
    let kind = S().kind || 'm';
    const box = modal(`${first ? '<div class="title-logo">저승사자 키우기</div><div class="title-sub">명부를 들고 떠도는 혼을 거두어 염라대왕이 되어라</div>' : '<h2>모습 바꾸기</h2>'}
      <div class="pick"><button data-k="m"><canvas width="22" height="22"></canvas>남자 차사</button><button data-k="f"><canvas width="22" height="22"></canvas>여자 차사</button></div>
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
      if (first) { S().created = Date.now(); setTimeout(storyIntro, 400); }
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

  // ---------- 스토리 ----------
  const nameFill = t => t.replace(/\{name\}/g, S().name || '차사');
  function portrait(sp) {
    const k = 'por' + sp + (sp === 'me' ? S().kind + S().rank : '');
    if (urls[k]) return urls[k];
    const c = sp === 'me' ? SP.reaper(S().kind || 'm', S().rank, 'idle', 0) : sp === 'gangrim' ? SP.reaper('m', 4, 'idle', 0) : sp === 'yeomra' ? SP.reaper('m', 8, 'idle', 0) : sp === 'wraith' ? SP.wraith(0) : SP.npc(sp);
    return (urls[k] = toURL(c, 5));
  }
  function talk(lines, done) {
    let i = 0;
    const o = overlay(`<div class="tk-bg"></div><div class="tk-box"><img class="px tk-por" id="tk-por"><div class="tk-txt"><b id="tk-name"></b><p id="tk-line"></p><small>터치해서 계속 ▶</small></div></div>`);
    const show = () => {
      const [sp, txt] = lines[i];
      $('#tk-por').src = portrait(sp); $('#tk-por').classList.toggle('flip', sp !== 'me');
      $('#tk-name').textContent = nameFill(SPEAKERS[sp]); $('#tk-line').textContent = nameFill(txt);
      Sound.play('open');
    };
    show();
    o.onclick = () => { i++; if (i >= lines.length) { o.onclick = null; closeOverlay(); done && done(); } else show(); };
  }
  function storyIntro() {
    const c = Story.cur(); if (c.end || c.intro) return;
    const o = overlay(`<div class="tk-bg"></div><div class="ch-card"><small>제 ${c.ch + 1}장</small><b>${c.C.title}</b></div>`); Sound.play('promote');
    setTimeout(() => talk(c.C.intro, () => { Story.seenIntro(); toast(`📜 새 퀘스트: ${Story.cur().Q.t}`, 3000); }), 1600);
  }
  function storyBar() {
    const c = Story.cur(), e = $('#story-bar');
    if (c.end) { e.innerHTML = '📜 이야기 완결 · 윤회로 새 생을'; e.classList.remove('done'); return; }
    e.innerHTML = `<span>📜 ${c.ch + 1}장</span> ${c.Q.t} <b>${fmt(c.have)}/${fmt(c.need)}</b>`;
    e.classList.toggle('done', c.done);
  }
  function storyTap() {
    const c = Story.cur(); if (c.end) return;
    if (!c.intro) { storyIntro(); return; }
    if (c.done) {
      const R = c.Q.r, res = Story.claim(); if (!res) return;
      Sound.play('promote');
      toast(`퀘스트 완료! ${Story.rewardText(R)}${res.got.souls ? ` (+${fmt(res.got.souls)})` : ''}`, 3000);
      if (res.chapterDone) talk(res.outro, () => setTimeout(storyIntro, 300));
      storyBar(); return;
    }
    storyModal();
  }
  function storyModal() {
    const c = Story.cur();
    const box = modal(`<h2>제 ${c.ch + 1}장 · ${c.C.title}</h2>
      ${c.C.quests.map((q, i) => `<div class="qrow pbox ${i < c.q ? 'mute' : ''}"><div class="info"><b>${i < c.q ? '✔ ' : i === c.q ? '▶ ' : ''}${q.t}</b>${i === c.q ? ` <span class="mute">${fmt(c.have)}/${fmt(c.need)}</span><div class="bar"><i style="width:${Math.min(100, (c.have / c.need) * 100)}%"></i></div>` : ''}<div class="mute" style="font-size:10px;margin-top:3px">보상: ${Story.rewardText(q.r)}</div></div></div>`).join('')}
      <div class="acts"><button class="btn dark" id="st-replay">이야기 다시 보기</button><button class="btn red" data-act="close">닫기</button></div>`);
    box.querySelector('#st-replay').onclick = () => { closeModal(); talk(c.C.intro); };
  }
  // ---------- 승진 연출 ----------
  function overlay(html) { const o = $('#promo'); o.innerHTML = html; o.className = 'on'; return o; }
  function closeOverlay() { const o = $('#promo'); o.className = ''; o.innerHTML = ''; previews = previews.filter(p => document.body.contains(p.c)); }
  const sparks = (n, col) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 90 + Math.random() * 120; return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--d:${(Math.random() * 0.3).toFixed(2)}s;background:${Array.isArray(col) ? col[i % col.length] : col}"></i>`; }).join('');
  function promoted(newRegion, oldRank) {
    const R = RANKS[S().rank], O = RANKS[oldRank != null ? oldRank : S().rank - 1];
    Sound.play('promote');
    const o = overlay(`<div class="pr-bg"></div><div class="pr-rays"></div><div class="pr-sparks">${sparks(40, ['#ffd34a', '#ffffff', '#ff8a5a'])}</div>
      <div class="pr-box"><div class="pr-title">승 진</div>
        <div class="pr-char"><canvas id="pr-old" width="22" height="22"></canvas><canvas id="pr-new" width="22" height="22"></canvas><div class="pr-flash"></div></div>
        <div class="pr-rank">${R.name}</div><div class="pr-sub">${O.name} → ${R.name}</div>
        <div class="pr-info">수확량 <b>×${fmt(R.mult)}</b>${newRegion ? `<br>새 근무지 <b>${REGIONS[R.region].name}</b>(으)로 발령!` : ''}<br><span>옷차림이 바뀌었어요</span></div>
        <button class="btn red" id="pr-go">근무 시작</button></div>`);
    previews.push({ c: o.querySelector('#pr-old'), kind: S().kind, rank: O === R ? S().rank : oldRank, pose: 'idle', keep: 1 });
    previews.push({ c: o.querySelector('#pr-new'), kind: S().kind, rank: S().rank, pose: 'reap', keep: 1 });
    setTimeout(() => Sound.play('kill'), 1100);
    o.querySelector('#pr-go').onclick = () => { closeOverlay(); Sound.play('open'); };
  }

  // ---------- 펫 ----------
  function renderPet(P) {
    Pets.ensure();
    const s = S(), eq = s.petEq && s.pets[s.petEq] ? Pets.P(s.petEq) : null, own = Object.keys(s.pets).length;
    const stTxt = id => { const st = Pets.stats(id); return `수확량 +${Math.round(st[0] * 100)}% · 이동 +${Math.round(st[1] * 100)}% · 수확속도 +${Math.round(st[2] * 100)}%`; };
    let h = `<div class="petmain pbox">${eq ? `<canvas id="pet-big" width="12" height="11"></canvas><div class="info"><div class="nm"><span class="gb" style="background:${PET_GRADES[eq.g].col}">${eq.g}</span> ${eq.name} <span class="stars">${'★'.repeat(s.pets[eq.id])}</span></div><div class="ds">${eq.desc}</div><div class="ds st">${stTxt(eq.id)}</div></div>` : '<div class="info"><div class="nm">함께할 영물이 없어요</div><div class="ds">아래에서 영물을 소환해 보세요. 데리고 다니면 수확을 도와줘요.</div></div>'}</div>
      <div class="gacha pbox"><div class="gt">영물 소환</div><div class="gd">C 50% · B 30% · A 13% · S 5% · SS 1.7% · <b style="color:${PET_GRADES.SSS.col}">SSS 0.3%</b><br>SS 이상 확정까지 <b>${PITY - s.pity}</b>회 · 같은 영물은 별 +1 (최대 ★5)</div>
        ${s.tickets ? `<button class="btn red ticket" data-pull="ticket">소환권으로 1회 <em>${s.tickets}장</em></button>` : ''}
        <div class="gb3"><button class="btn" data-pull="ad" ${Pets.adLeft() > 0 ? '' : 'disabled'}>무료 1회<em>AD ${Pets.adLeft()}/2</em></button>
        <button class="btn jade" data-pull="1" ${s.jade >= PULL_COST[1] ? '' : 'disabled'}><img class="px" src="${IC('jade', 2)}">${PULL_COST[1]} · 1회</button>
        <button class="btn red" data-pull="10" ${s.jade >= PULL_COST[10] ? '' : 'disabled'}><img class="px" src="${IC('jade', 2)}">${PULL_COST[10]} · 10회</button></div><div class="gd">10회 소환은 A등급 이상 1마리 확정</div></div>
      <div class="ph"><h3>영물 도감</h3><span class="sub">${own}/${PETS.length}종 · 수확량 +${own}%</span></div><div class="petgrid">`;
    h += PETS.map(p => { const st = s.pets[p.id]; return `<button class="pcell pbox ${st ? '' : 'unk'} ${s.petEq === p.id ? 'eq' : ''}" data-eq="${p.id}" style="--gc:${PET_GRADES[p.g].col}"><span class="gb" style="background:${PET_GRADES[p.g].col}">${p.g}</span><img class="px" src="${petIcon(p, !!st)}"><b>${st ? p.name : '???'}</b><small>${st ? '★'.repeat(st) : ''}${s.petEq === p.id ? ' 데리는 중' : ''}</small></button>`; }).join('');
    P.innerHTML = h + '</div><p class="note">영물 하나를 데리고 다닐 수 있어요. 칸을 누르면 바꿔요. 별 5개인 영물이 또 나오면 옥으로 돌려받아요.</p>';
    if (eq) previews.push({ c: $('#pet-big'), pet: eq });
  }
  function petIcon(p, known) { const k = 'pi' + p.id + known; if (urls[k]) return urls[k]; let c = SP.pet(p, 0); if (!known) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const g = d.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a2444'; g.fillRect(0, 0, d.width, d.height); c = d; } return (urls[k] = toURL(c, 4)); }
  function doPull(kind) {
    if (kind === 'ad') { ad(() => { const r = Pets.adPull(); if (r) gachaShow(r); render(); }); return; }
    if (kind === 'ticket') { if (S().tickets <= 0) return; S().tickets--; const r = Pets.pull(1, true); gachaShow(r); render(); return; }
    const r = Pets.pull(+kind); if (!r) { Sound.play('no'); toast('옥이 부족해요'); return; }
    gachaShow(r); render();
  }
  function gachaShow(res) {
    const best = res.reduce((m, r) => Math.max(m, PET_ORDER.indexOf(Pets.P(r.id).g)), 0), bg = PET_ORDER[best], col = PET_GRADES[bg].col;
    Sound.play('open');
    const o = overlay(`<div class="pr-bg"></div>${best >= 4 ? '<div class="pr-rays rainbow"></div>' : best >= 3 ? '<div class="pr-rays"></div>' : ''}
      <div class="ga-orb" style="--c:${col}"><span></span></div><div class="pr-sparks late">${sparks(best >= 4 ? 50 : 24, [col, '#ffffff'])}</div>
      <div class="ga-cards n${res.length}">${res.map((r, i) => { const p = Pets.P(r.id); return `<div class="ga-card g${p.g}" style="--c:${PET_GRADES[p.g].col};--i:${i}"><span class="gb" style="background:${PET_GRADES[p.g].col}">${p.g}</span><canvas width="12" height="11" data-gp="${r.id}"></canvas><b>${p.name}</b><small>${r.isNew ? 'NEW!' : r.refund ? `옥 +${r.refund}` : '★' + r.star}</small></div>`; }).join('')}</div>
      <div class="ga-acts"><button class="btn dark" id="ga-close">확인</button></div>`);
    o.querySelectorAll('[data-gp]').forEach(c => previews.push({ c, pet: Pets.P(c.dataset.gp), keep: 1 }));
    setTimeout(() => { Sound.play(best >= 4 ? 'promote' : best >= 2 ? 'kill' : 'buy'); }, 900);
    o.querySelector('#ga-close').onclick = () => { closeOverlay(); render(); };
  }

  // ---------- 백귀야행 ----------
  function paradeAsk() {
    if (parade) return;
    const pr = S().parade, left = (pr.next - Date.now()) / 1000;
    if (left <= 0) { startParade(); return; }
    const today = new Date().toISOString().slice(0, 10); if (pr.ad.day !== today) pr.ad = { day: today, n: 0 };
    const box = modal(`<h2>백귀야행</h2><p>귀신 행렬이 지나가며 혼령이 쏟아지는 밤!<br>25초 동안 혼령을 마구 터치해 콤보를 쌓으세요.<br>콤보가 높을수록 수확이 커져요 (최대 +400%).</p>
      <p>다음 행렬까지 <b style="color:var(--gold)">${fmtTime(left)}</b></p>
      <div class="acts"><button class="btn red" id="pa-ad" ${pr.ad.n < 3 ? '' : 'disabled'}>광고 보고 바로 부르기<em>${3 - pr.ad.n}/3</em></button><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#pa-ad').onclick = () => { closeModal(); ad(() => { pr.ad.n++; startParade(); }); };
  }
  function startParade() {
    if (parade || test) return;
    parade = { t: 25, combo: 0, comboT: 0, max: 0, gained: 0 };
    S().parade.next = Date.now() + 30 * 60e3; Game.save();
    Scene.config({ parade: true }); Sound.play('wraith'); setTimeout(() => Sound.play('promote'), 300);
    $('#parade-bar').classList.add('on');
    toast('🏮 백귀야행이 시작됐다! 혼령을 마구 터치하세요!', 2500);
  }
  function paradeTick(dt) {
    if (!parade) return;
    parade.t -= dt; parade.comboT -= dt; if (parade.comboT <= 0) parade.combo = 0;
    $('#parade-bar').innerHTML = `🏮 백귀야행 <b>${Math.max(0, parade.t).toFixed(1)}초</b> · 콤보 <b class="cb">${parade.combo}</b> <small>(+${Math.round(Math.min(4, parade.combo * 0.1) * 100)}%)</small>`;
    if (parade.t <= 0) endParade();
  }
  function endParade() {
    const p = parade; parade = null; Scene.config({ parade: false }); Life.qEvent('parade'); $('#parade-bar').classList.remove('on');
    const bonus = p.gained * Math.min(1, p.max / 40) * 0.5, jade = p.max >= 60 ? 15 : p.max >= 30 ? 8 : p.max >= 15 ? 3 : 0;
    Game.gain(bonus); S().jade += jade; Game.save(); Sound.play('kill');
    const box = modal(`<h2>백귀야행 끝!</h2><p>행렬이 지나갔어요.</p>
      <div class="big"><img class="px" src="${IC('soul', 3)}">+${fmt(p.gained + bonus)}</div>
      <p>최고 콤보 <b style="color:var(--gold)">${p.max}</b> · 콤보 보너스 +${fmt(bonus)}${jade ? ` · 옥 +${jade}` : ''}</p>
      <div class="acts"><button class="btn dark" data-act="close">확인</button><button class="btn red" id="pa-x2">광고 보고 보너스 2배<em>AD</em></button></div>`, true);
    box.querySelector('#pa-x2').onclick = () => { closeModal(); ad(() => { Game.gain(p.gained + bonus); toast(`백귀야행 보상 2배! +${fmt(p.gained + bonus)}`); }); };
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
    if (cheapest <= s.souls + inc * 120 || Game.canTest()) return;
    s.stuckShown = Date.now(); Game.save();
    modal(`<h2>성장이 더디신가요?</h2><p>다음 수련까지 시간이 꽤 걸려요.<br>부적이나 패키지로 빠르게 넘어가 보세요!</p>
      <div class="acts" style="flex-direction:column"><button class="btn red" data-act="boostAd">2배 부적 (광고 무료)</button><button class="btn" id="st-pkg">승진 응원 패키지 ₩3,300</button><button class="btn dark" data-act="close">괜찮아요</button></div>`)
      .querySelector('#st-pkg').onclick = () => { closeModal(); iapBox('promo'); };
  }

  return { init, toast };
})();
