// ===== 화면 UI: HUD · 메뉴 탭 · 모달 · 광고/결제(테스트) =====
const UI = (() => {
  // 받침 있으면 '을', 없으면 '를'
  const eul = w => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '을' : '를'; };
  const $ = s => document.querySelector(s);
  const urls = {};
  const IC = (name, sc = 3) => urls[name + sc] || (urls[name + sc] = toURL(name === 'petic' ? SP.pet(PETS.find(p => p.id === 'heukmyo'), 0) : name === 'flower' ? SP.plant(3, FLOWERS[1].pal, 'lotus') : ['soul', 'jade', 'scroll'].includes(name) ? SP.icon(name) : SP.ui(name), sc));
  const FIC = (fid, stage = 3, sc = 2) => { const k = 'f' + fid + stage + sc; return urls[k] || (urls[k] = toURL(SP.plant(stage, FLOWERS.find(f => f.id === fid).pal, fid), sc)); };
  const SPIC = (i, known, sc = 4) => { const k = 'sp' + i + known + sc; if (urls[k]) return urls[k]; let c = SP.special(i); if (!known) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const g = d.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a2444'; g.fillRect(0, 0, d.width, d.height); c = d; } return (urls[k] = toURL(c, sc)); };
  let sub = 'garden', lifeSig = '', lifeT = 0, buffSig = '', parade = null, buffChips = '', buffLive = new Set();
  const BUFF_EFF = { value: '×1.5', spawn: '×1.4', fight: '×3' };
  const S = () => Game.S;
  let tab = 'grow', mult = 1, nextWraith = 45, test = null, autoAcc = 0, hitSnd = 0, sndT = 0, stuckT = 0, previews = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- 로그인 (Supabase) ----------
  const PROV = { google: ['G', '구글로 시작', 'pv-google'], kakao: ['💬', '카카오로 시작', 'pv-kakao'], naver: ['N', '네이버로 시작', 'pv-naver'], apple: ['', 'Apple로 시작', 'pv-apple'] };
  // iOS 앱은 다른 소셜 로그인이 있으면 Apple 로그인도 꼭 있어야 함 (App Store 심사 4.8)
  const loginProviders = () => { const ios = Native.platform() === 'ios', l = CLOUD.providers.filter(x => x !== 'apple'); if (ios) l.push('apple'); return l; }; // Apple 로그인은 iOS 에서만 (아이폰 기본 로그인 창)
  function loginScreen(fromSettings) {
    const box = modal(`${fromSettings ? '' : '<button class="lg-back" id="lg-back" translate="no">‹ 🌏 Language</button>'}${fromSettings ? '<h2>계정 연동</h2><p class="mute">지금까지의 기록을 계정에 저장해 다른 기기에서도 이어 해요</p>' : '<div class="title-logo">저승사자 키우기</div><div class="title-sub">로그인하면 기록이 서버에 저장돼 기기를 바꿔도 이어 할 수 있어요</div>'}
      <div class="lg-list">${loginProviders().map(p => `<button class="lg-btn ${PROV[p][2]}" data-lg="${p}"><i>${PROV[p][0]}</i><span>${PROV[p][1]}</span></button>`).join('')}</div>
      ${fromSettings ? '<div class="acts"><button class="btn dark" data-act="close">닫기</button></div>' : '<button class="lg-guest" id="lg-guest">게스트로 시작 <small>(이 기기에만 저장돼요)</small></button>'}`, !fromSettings);
    box.querySelectorAll('[data-lg]').forEach(b => b.onclick = async () => { S().pendingLink = !!S().kind; Game.save(); if (!Cloud.ready() && !(await Cloud.init())) return toast('서버에 연결하지 못했어요. 인터넷 연결을 확인하거나 게스트로 시작해 주세요', 3000); toast('로그인 화면으로 이동해요…', 2000); Promise.resolve(Cloud.signIn(b.dataset.lg)).catch(() => toast('로그인을 시작하지 못했어요. 인터넷 연결을 확인해 주세요', 2600)); });
    const bk = box.querySelector('#lg-back'); if (bk) bk.onclick = () => langPicker(true); // 처음 화면: 언어를 잘못 골랐으면 다시 고르기
    const g = box.querySelector('#lg-guest'); if (g) g.onclick = () => { S().guest = true; Game.save(); closeModal(); charSelect(true); };
  }
  function afterLoad() {
    checkOffline();
    if (!Story.cur().end && !Story.cur().intro) setTimeout(storyIntro, 600);
    // 튜토리얼 도중에 앱을 껐다 켰으면 그 단계부터 이어서
    else if (typeof S().tut === 'number') setTimeout(() => { if (!tutEl && typeof S().tut === 'number') { TL = TUT; TK = 'tut'; tutShow(); } }, 1500);
    else setTimeout(askPush, 4000);
  }
  // 앱 알림 허락 받기: 튜토리얼이 끝난 뒤, 게임 안 안내창으로 먼저 물어보고 OK 하면 휴대폰 권한 창
  async function askPush() {
    const s = S(); if (!Native.isApp() || s.pushAsked || s.tut !== 'done' || $('#modal').classList.contains('on') || $('#promo').classList.contains('on')) return;
    if ((await Native.notifyPerm()) === 'granted') { s.pushAsked = true; Game.save(); return; }
    s.pushAsked = true; Game.save();
    confirmBox('<h2>🔔 알림을 받을까요?</h2><p>저승 장부가 가득 차거나, 파견이 끝나거나, 꽃이 피면 알려 드려요.<br><small class="mute">밤 11시 ~ 아침 8시에는 울리지 않아요 · 설정에서 언제든 끌 수 있어요</small></p>', async () => {
      const ok = await Native.notifyAsk(); s.push = ok; Game.save(); toast(ok ? '🔔 알림을 켰어요' : '알림이 꺼져 있어요. 설정에서 다시 켤 수 있어요', 2400);
    }, '알림 받기');
  }
  // 로그인 직후: 서버 기록과 이 기기 기록 맞추기
  const saveSummary = d => d && d.kind ? `${esc(d.name || '')} · ${RANKS[Math.min(8, d.rank || 0)].name}${d.reborn ? ` · 윤회 ${d.reborn}` : ''}` : '기록 없음';
  async function cloudSync() {
    let cloud = null; try { cloud = await Cloud.pullSave(); } catch (e) {}
    const local = S(), hasLocal = !!local.kind, hasCloud = !!(cloud && cloud.data && cloud.data.kind);
    const useCloud = () => { Game.replace(cloud.data); closeModal(); render(); hud(); Board.init(); toast('☁️ 서버에 저장된 기록을 불러왔어요', 2600); afterLoad(); };
    const useLocal = () => { Cloud.pushSave(S(), true); closeModal(); Board.init(); toast('☁️ 이 기기 기록을 계정에 저장했어요', 2600); afterLoad(); };
    if (hasCloud && !hasLocal) return useCloud();
    if (!hasCloud && hasLocal) return useLocal();
    if (!hasCloud && !hasLocal) { closeModal(); charSelect(true); return; }
    if (Math.abs((cloud.data.last || 0) - (local.last || 0)) < 60e3 && cloud.data.rank === local.rank) return useLocal();
    const box = modal(`<h2>☁️ 어떤 기록으로 할까요?</h2><p>계정과 이 기기에 서로 다른 기록이 있어요.</p>
      <div class="sv-pick"><button id="sv-cloud"><b>계정(서버) 기록</b><span>${saveSummary(cloud.data)}</span><small>${fmtDate(cloud.at)} 저장</small></button><button id="sv-local"><b>이 기기 기록</b><span>${saveSummary(local)}</span><small>${fmtDate(local.last || Date.now())} 저장</small></button></div>
      <p class="mute" style="font-size:10px">고르지 않은 쪽 기록은 사라져요</p>`, true);
    box.querySelector('#sv-cloud').onclick = useCloud; box.querySelector('#sv-local').onclick = useLocal;
  }
  // ---------- 로딩 화면 ----------
  const TIPS = ['혼령은 직접 터치하면 더 많이 거둬요', '승진할 때마다 발밑 마법진이 화려해져요', '집무실 결재 서류는 2시간마다 한 건씩 쌓여요', '백귀야행 때 금빛 귀신을 잡으면 5배!', '이웃 집무실에 하루 3곳 놀러 가면 옥을 받아요', '지도의 반짝이는 나무와 소품을 눌러 보세요', '망자 심판을 모두 맞히면 보너스 옥!', '같은 등급 영물 3마리로 합성할 수 있어요', '책상 뒤 파란 칸에 의자를 놓으면 앉아서 근무해요'];
  async function init() {
    const L = $('#loading'), fill = $('#ld-fill'), msg = $('#ld-msg'), t0 = performance.now();
    if (!L) { initGame(); return; }
    $('#ld-tip').textContent = '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)];
    // 걷는 꼬마 저승사자
    const wc = $('#ld-walker'), wg = wc.getContext('2d'); wg.imageSmoothingEnabled = false; let wf = 0;
    const walk = setInterval(() => { wg.clearRect(0, 0, 16, 20); try { wg.drawImage(SP.tinyReaper('m', 0, 'side', 'walk', wf++), 0, 0); } catch (e) {} }, 110);
    const step = async (p, text, fn) => { msg.textContent = text; fill.style.width = p + '%'; wc.style.left = `calc(${p}% - 8px)`; await new Promise(r => setTimeout(r, 30)); try { await fn(); } catch (e) {} };
    await step(10, '글꼴을 불러오는 중…', () => Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1500))]));
    await step(30, '저승사자 옷을 입히는 중…', () => { for (const k of ['m', 'f']) for (let r = 0; r <= 8; r++) { SP.reaper(k, r, 'idle', 0); for (const d of ['down', 'up', 'side']) SP.tinyReaper(k, r, d, 'walk', 0); } });
    await step(55, '혼령을 불러 모으는 중…', () => { for (let t = 0; t < 4; t++) for (let i = 0; i < 3; i++) SP.soult(t, i); });
    await step(75, '집무실 소품을 닦는 중…', async () => { for (let i = 0; i < DECOR.length; i += 20) { DECOR.slice(i, i + 20).forEach(d => Decor.img(d.id)); await new Promise(r => setTimeout(r, 0)); } });
    await step(80, '저승 문을 여는 중…', async () => { await Native.init(); Native.hideSplash(); });
    await step(82, '저승 서버에 접속하는 중…', () => Cloud.init());
    await step(90, '명부를 펼치는 중…', () => initGame());
    if (Cloud.signedIn()) await step(96, '내 기록을 불러오는 중…', () => cloudSync());
    const wait = Math.max(0, 1200 - (performance.now() - t0)); await new Promise(r => setTimeout(r, wait));
    fill.style.width = '100%'; wc.style.left = 'calc(100% - 8px)'; msg.textContent = '근무 시작!';
    await new Promise(r => setTimeout(r, 250)); clearInterval(walk);
    L.classList.add('out'); setTimeout(() => L.remove(), 600);
    setTimeout(updateCheck, 1500);
  }
  // ---------- 새 버전 안내: 서버의 config/version 과 내 앱 빌드 번호를 비교 ----------
  // data: { android: { latest, min }, ios: { latest, min }, msg } — latest 보다 낮으면 안내(닫기 가능), min 보다 낮으면 닫기 없이
  async function updateCheck() {
    if (!Native.isApp() || !Cloud.ready()) return;
    try {
      const plat = Native.platform(), mine = await Native.appBuild(); if (!mine) return;
      const doc = await Cloud.db.doc('config/version').get(); if (!doc.exists) return;
      const d = doc.data() || {}, v = d[plat] || {}, latest = +v.latest || 0, min = +v.min || 0;
      if (mine >= latest && mine >= min) return;
      const force = mine < min;
      const box = modal(`<div class="got"><div class="got-ic">🆕</div><h2>새 버전이 나왔어요</h2><p class="got-t">${d.msg ? esc(d.msg) : '더 나아진 저승사자 키우기를 만나 보세요!'}</p><p class="mute">${force ? '이 버전은 더 이상 이용할 수 없어요. 업데이트해 주세요.' : '스토어에서 최신 버전으로 업데이트해 주세요.'}</p></div>
        <div class="acts"><button class="btn red" id="up-go">스토어 가기</button>${force ? '' : '<button class="btn dark" data-act="close">닫기</button>'}</div>`, force);
      box.querySelector('#up-go').onclick = () => Native.openStore();
    } catch (e) { /* 서버에 못 닿으면 조용히 넘어감 */ }
  }
  // ---------- 시작 ----------
  function initGame() {
    Game.load();
    Scene.init($('#cv'), { collect, wraithTap, wraithGone, tick, poi, npcHot, docsCount: () => Life.docsCount(), ghostTap, decorPlaced: () => (visiting ? visiting.placed : Decor.ensure().placed).filter(p => Decor.D(p.id)), decorTap, decorPick, decorDrop, pendTap, pendMoved, propReady: k => Life.propReady(k), clue: () => Story.clueActive(), moved: () => tutEv('move'), gardenReady: () => Life.alerts().garden });
    setTimeout(() => { const h = $('#drag-hint'); if (h) h.classList.add('gone'); }, 6000);
    $('#labels').innerHTML = Object.entries(POI_LABEL).map(([k, v]) => `<span class="plabel" id="lb-${k}">${v}</span>`).join('');
    Game.apply(); if (S().kind) { Decor.grantRank(S().rank); Decor.grantStory(Math.max(-1, (S().story || {}).ch - 1)); }
    Sound.set(S().sound, S().bgm); Sound.init();
    document.querySelectorAll('img[data-ic]').forEach(i => (i.src = IC(i.dataset.ic, 3)));
    document.querySelectorAll('img[data-ui]').forEach(i => (i.src = IC(i.dataset.ui, 3)));
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { if (sheetDrag.moved) return; if (tab === b.dataset.tab && sheetOpen()) { closeSheet(); Sound.play('open'); return; } goTab(b.dataset.tab); Sound.play('open'); tutEv('tab:' + tab); }));
    $('#sheet-h').addEventListener('click', () => { if (sheetDrag.moved) return; closeSheet(); Sound.play('open'); });
    sheetSwipe(); document.addEventListener('dragstart', e => e.preventDefault()); // 아이콘 이미지가 끌려가며 터치가 취소되지 않게
    $('#btn-boost').addEventListener('click', boostAsk);
    $('#btn-attend').addEventListener('click', attendModal);
    $('#btn-quest').addEventListener('click', questModal);
    $('#btn-parade').addEventListener('click', paradeAsk);
    $('#btn-office').addEventListener('click', enterOffice);
    $('#btn-rankb').addEventListener('click', rankModal);
    $('#me-card').addEventListener('click', statsModal);
    $('#btn-notice').addEventListener('click', () => noticeModal(false));
    $('#btn-mail').addEventListener('click', mailHub);
    setTimeout(noticeStartup, 1500); setInterval(refreshMail, 60e3); setTimeout(refreshMail, 4000); document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(refreshMail, 800); }); // 새 우편 · 공지 N 표시: 1분마다 + 게임으로 돌아올 때
    Board.listen(applyPlace); Board.init();
    $('#story-bar').addEventListener('click', storyTap);
    $('#buffs').addEventListener('click', e => { const c = e.target.closest('[data-bf]'); if (c) toast(`${c.dataset.nm} · ${c.dataset.bf} · ⏱ ${c.querySelector('b').textContent}`, 2400); });
    $('#btn-set').addEventListener('click', settings);
    $('#cur-jade').addEventListener('click', () => { goTab('shop'); });
    $('#panel').addEventListener('click', onPanel);
    setInterval(hud, 200);
    setInterval(() => { if (!document.hidden) { Game.save(); Board.push(); if (S().kind) Cloud.pushSave(S()); } }, 5000);
    setInterval(drawPreviews, 160);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { Game.save(); if (S().kind) Cloud.pushSave(S(), true); } else checkOffline(); });
    window.addEventListener('pagehide', () => { Game.save(); if (S().kind) Cloud.pushSave(S(), true); });
    // 앱: 뒤로가기 = 열린 창 닫기, 백그라운드로 갈 때 저장, 결제 완료 → 지급
    Native.setBack(() => { if ($('#modal').classList.contains('on')) { const c = $('#modal [data-act="close"]'); if (c) c.click(); else if ($('#modal #lg-back')) langPicker(true); else if (!$('#modal .lg-list')) closeModal(); return true; } if ($('#promo').classList.contains('on')) { const c = $('#promo [data-act="close"], #promo #gs-skip:not(:disabled), #promo #ga-close'); if (c) c.click(); else closeOverlay(); return true; } return false; });
    Native.setPause(() => { Sound.pause(); Game.save(); if (S().kind) Cloud.pushSave(S(), true); Push.leave(); });
    Native.setResume(() => { Sound.resume(); Push.back(); setTimeout(refreshMail, 800); });
    Push.back(); // 앱을 켜면 예약해 둔 알림은 지움
    Native.setPay((gid, key) => grantPaid(gid, key), gid => { if (gid === 'noads') S().noAds = true; S().bought[gid] = S().bought[gid] || 1; Game.save(); }, () => { if (tab === 'shop') render(); }, key => !!(S().txDone || []).includes(key));
    render(); hud();
    // 로그인 성공 → 다시 켜지 않고 그 자리에서 서버 기록을 맞춤
    Cloud.setOnLogin(() => { closeModal(); toast('☁️ 로그인했어요', 1600); Board.init(); cloudSync(); });
    if (!S().kind && !I18N.chosen()) { langPicker(true); } // 처음 켜면 언어부터 고르기
    else if (!S().kind) startFlow();
    else if (!Cloud.signedIn()) afterLoad(); // 로그인했으면 서버 기록을 맞춘 뒤에
  }

  // ---------- 수확 / 원귀 ----------
  function collect(s, who, x, y) {
    const v = Game.collect(s.tier, who);
    if (who === 'tap') tutEv('tap');
    Life.qEvent('soul'); if (who === 'tap') Life.qEvent('tap');
    if (s.sp >= 0) { const first = Life.catchSpecial(s.sp); toast(first ? `📖 도감 등록! ${SPECIALS[s.sp].name}을 거뒀다 (혼 수확 +2%)` : `✨ ${SPECIALS[s.sp].name}을 거뒀다`, 3000); }
    let shown = v;
    if (parade) { parade.gained += v; if (who === 'tap') { parade.combo++; parade.comboT = 1.6; parade.max = Math.max(parade.max, parade.combo); const bonus = v * Math.min(4, parade.combo * 0.1); Game.gain(bonus); parade.gained += bonus; shown += bonus; } }
    if (who !== 'minion' || Math.random() < 0.7) float(x, y, '+' + fmt(shown), 't' + s.tier + (who === 'tap' ? ' tap' : ''));
    const now = performance.now();
    if (who !== 'minion' || now - sndT > 400) { Sound.play('collect', s.tier); sndT = now; }
    // (황금 · 불꽃 혼 알림은 없앰 — 화면에 떠오르는 숫자로만)
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
    S().stats.wraith++; Life.qEvent('wraith');
    const amt = Math.max(Game.incomePerSec() * 8, Game.value() * 10); // 원귀 퇴치 보상
    Game.gain(amt);
    let jade = 0;
    if (Math.random() < 0.25) { jade = 2 + Math.floor(Math.random() * 6); S().jade += jade; }
    float(p.x, p.y - 40, '+' + fmt(amt), 'big');
    got(`👻 원귀 퇴치! +${fmt(amt)} 혼${jade ? ` · 옥 +${jade}` : ''}`, { soft: true, emo: '👻', actions: Game.adLeft('wraith') > 0 ? [{ label: `광고 보고 3배 (${Game.adLeft('wraith')})`, cls: 'jade', fn: () => { if (Game.adLeft('wraith') <= 0) return; ad(() => { Game.useAd('wraith'); Game.gain(amt * 2); got(`보상 3배! +${fmt(amt * 2)}`, { ic: 'soul' }); }); } }] : [] });
    Game.save();
  }
  function wraithGone() {}
  function tick(dt) {
    placeLabels(); tutPlace();
    paradeTick(dt);
    if (!S().kind) return;
    if (!document.hidden && dt < 1) S().playSec = (S().playSec || 0) + dt; // 실제로 켜 둔 시간
    if (Scene.wraithAlive()) {
      autoAcc += dt;
      if (autoAcc >= 0.5) { autoAcc = 0; hitW(Game.wraithDps() * 0.5); }
    } else if (!test) {
      nextWraith -= dt;
      if (nextWraith <= 0) { nextWraith = rnd(70, 110); Scene.spawnWraith(Math.max(Game.value() * 50, Game.incomePerSec() * 8), 22); }
    }
  }
  // 승진은 시험 없이: 레벨을 채우면 승진 탭의 '승진하기'로 바로 승진

  // ---------- HUD ----------
  // 우편함 N: 운영자 우편(새 우편) 또는 까치 우편(편지가 있으면)
  let generalNew = false;
  function mailWatch() { const d = $('#btn-mail .dot'); if (d) d.classList.toggle('on', generalNew || (!!S() && !!S().kind && Life.mailCount() > 0)); }
  // 📮 우편함: 일반 우편 / 까치 우편 고르기
  function mailHub() {
    const n = Life.mailCount(), nx = Life.mailNext();
    const box = modal(`<h2>📮 우편함</h2><div class="mh">
      <button class="mh-b pbox" id="mh-gen"><span class="mh-ic">📜</span><b>일반 우편${generalNew ? ' <span class="new-tag">N</span>' : ''}</b><small>운영자가 보낸 선물 · 이벤트 보상</small></button>
      <button class="mh-b pbox" id="mh-kk"><span class="mh-ic">🐦</span><b>까치 우편${n ? ' <span class="new-tag">N</span>' : ''}</b><small>${n ? `편지 ${n}통이 와 있어요` : `다음 편지까지 ${fmtTime(nx)}`} · 4시간마다 1통</small></button></div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#mh-gen').onclick = () => { closeModal(); mailModal(); };
    box.querySelector('#mh-kk').onclick = () => { closeModal(); mailOpen(); };
  }
  function hud() {
    if (!S()) return;
    mailWatch();
    $('#v-soul').textContent = fmt(S().souls);
    $('#v-jade').textContent = fmt(S().jade);
    // (초당 혼 표시는 없앰 — 실제 수확량은 혼령을 거둘 때마다 들어와 예상치와 차이가 나서)
    const R = RANKS[S().rank], badge = $('#rank-badge');
    badge.textContent = R.name; badge.classList.toggle('reborn', S().reborn > 0); badge.dataset.r = S().reborn ? `윤회${S().reborn}` : '';
    $('#region').textContent = REGIONS[R.region].name;
    const b = Game.boosting();
    const bo = $('#boost-on'); if (bo) bo.classList.toggle('on', b);
    $('#btn-boost').classList.toggle('active', b);
    $('#boost-t').textContent = b ? fmtClock((S().boostUntil - Date.now()) / 1000) : '';
    $('#btn-attend .dot').classList.toggle('on', Game.attendState().can);
    // 탭 알림 점
    const can = ids => ids.some(id => { const U = UPGRADES.find(u => u.id === id); return Game.lv(id) < Game.umax(id) && Game.cost(id) <= S().souls; });
    dot('grow', can(['pen', 'step', 'call', 'hand', 'luck', 'ledger']));
    dot('minion', can(['minion', 'drill']));
    dot('rank', Game.canTest() || Game.canReborn());
    $('#v-lv').textContent = 'Lv.' + Game.level();
    $('#me-nick').textContent = S().name || '';
    if (!previews.some(p => p.c === $('#me-por'))) previews.push({ c: $('#me-por'), kind: S().kind || 'm', pose: 'idle', keep: 1, me: 1 });
    previews.forEach(p => { if (p.me) p.kind = S().kind || 'm'; });
    if (Game.canTest() && S().notified !== S().rank) { S().notified = S().rank; toast(`📜 레벨 ${Game.nextRank().lv} 달성! 승진할 수 있어요 (승진 탭)`, 3500); }
    dot('shop', Game.adLeft('jfree') > 0 || Game.adLeft('jade') > 0);
    dot('pet', Pets.adLeft() > 0 || S().jade >= PULL_COST[1] || S().tickets > 0);
    storyBar();
    const pr = S().parade || (S().parade = { next: Date.now() + 3 * 60e3, ad: { day: '', n: 0 } }), pl = (pr.next - Date.now()) / 1000;
    const pdn = paradeDay().n >= PARADE_FREE;
    $('#parade-t').textContent = parade ? '진행 중' : pdn ? (PARADE_BUY - paradeDay().buy > 0 ? `+${PARADE_BUY - paradeDay().buy}` : '내일') : pl > 0 ? fmtClock(pl) : '';
    $('#btn-parade .dot').classList.toggle('on', !parade && pl <= 0);
    $('#btn-parade').classList.toggle('active', !!parade);
    const al = Life.alerts(); dot('life', al.garden || al.expe);
    $('#btn-quest .dot').classList.toggle('on', Life.qReady());
    $('#btn-office .dot').classList.toggle('on', Life.docsCount() > 0 || Life.judgeLeft() > 0);
    if (Life.merchantTick() === 'arrive' && S().kind) toast('👺 도깨비 상인이 노점에 왔어요! (5분)', 5000, [{ label: '보러 가기', cls: '', fn: () => { Scene.focus('stall'); merchantModal(); } }]);
    Scene.config({ merchant: Life.merchantHere() });
    // 버프 표시 + 만료 시 설정 다시 적용
    const bs = ['value', 'spawn', 'fight'].filter(k => Life.buffLeft(k) > 0);
    // 효과 중인 것 모두 남은 시간과 함께 (2배 부적 · 탕약 · 운세 · 염라의 인장) — 누르면 설명
    const chips = [];
    if (Game.boosting()) chips.push(['boost', '🧧', '2배 부적 ×2', fmtClock((S().boostUntil - Date.now()) / 1000), '수확량 · 화력 2배']);
    bs.forEach(k => chips.push(['b-' + k, { value: '🍵', spawn: '🪷', fight: '🍶' }[k], `${BUFF_NAME[k]} ${BUFF_EFF[k]}`, fmtClock(Life.buffLeft(k)), { value: '혼 가치 1.5배', spawn: '혼령이 1.4배 빨리 나타나요', fight: '원귀 퇴치 화력 3배' }[k]]));
    if (Life.fortuneMul() > 1) chips.push(['fortune', '🔮', `운세 ${S().fortune.last} ×${Life.fortuneMul()}`, fmtClock((S().fortune.until - Date.now()) / 1000), '오늘의 운세 효과']);
    if (Game.sealLeft() > 0) chips.push(['seal', '📜', '염라의 인장 ×2', fmtDays(Game.sealLeft()), '모든 혼 수확 2배']);
    const bsig = chips.map(c => c[0] + c[2]).join('|');
    if (bsig !== buffChips) { buffChips = bsig; $('#buffs').innerHTML = chips.map(c => `<span class="bf bf-${c[0]}" data-bf="${c[4]}" data-nm="${c[2]}"><i>${c[1]}</i>${c[2]} <b>${c[3]}</b></span>`).join(''); }
    else chips.forEach((c, i) => { const el = $('#buffs').children[i]; if (el) { const t = el.querySelector('b'); if (t.textContent !== c[3]) t.textContent = c[3]; } });
    // 효과가 끝나면 알려 주기
    const live = new Set(chips.map(c => c[0])); buffLive.forEach(k => { if (false) toast(''); }); buffLive = live;
    const sig = bs.join() + Game.boosting() + (Game.sealLeft() > 0); if (sig !== buffSig) { buffSig = sig; Game.apply(); }
    refresh(); officeBar(); officeTutCheck();
    if (++stuckT % 25 === 0) checkStuck();
  }
  const dot = (t, on) => $(`#tabs [data-tab="${t}"] .dot`).classList.toggle('on', on);
  const fmtDays = t => t >= 86400 ? `${Math.floor(t / 86400)}일 ${Math.floor(t % 86400 / 3600)}시간` : fmtTime(t);
  const fmtClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function float(x, y, text, cls) {
    if (cls === 'dmg' && Scene.inOffice()) return;
    const box = $('#floats'); if (box.children.length > 28) box.firstChild.remove();
    const e = document.createElement('span'); e.className = 'fl ' + (cls || ''); e.textContent = text;
    e.style.left = x + 'px'; e.style.top = y + 'px'; box.appendChild(e);
    setTimeout(() => e.remove(), 950);
  }

  // ---------- 메뉴 ----------
  function upRow(U) {
    return `<div class="row pbox" id="row-${U.id}">
      <div class="ic"><img class="px" src="${IC(U.icon, 3)}"></div>
      <div class="info"><div class="nm">${U.name}<small id="lv-${U.id}"></small><small class="xpt" id="xt-${U.id}"></small></div><div class="ds"><span id="de-${U.id}">${U.desc}</span> · <b id="ef-${U.id}"></b></div><div class="xpb"><i id="xp-${U.id}"></i></div></div>
      <button class="btn" data-buy="${U.id}"><span class="c"><img class="px" src="${IC('soul', 2)}"><span id="co-${U.id}"></span></span><span class="l" id="bl-${U.id}"></span></button>
    </div>`;
  }
  // 아래 메뉴: 탭을 누르면 시트가 올라오고, 같은 탭이나 ▼를 누르면 내려간다
  const sheetOpen = () => $('#menu').classList.contains('open');
  function goTab(t) { if (t !== tab || !sheetOpen()) $('#panel').scrollTop = 0; tab = t; $('#menu').classList.add('open'); render(); }
  // 손가락으로 끌어 올리기 / 내리기: 손잡이·시트(맨 위까지 스크롤된 상태)에서 아래로, 탭 줄에서 위로
  const sheetDrag = { on: false, moved: false };
  function sheetSwipe() {
    const sh = $('#sheet'), P = $('#panel');
    const start = (e, from) => { sheetDrag.on = true; sheetDrag.moved = false; sheetDrag.from = from; sheetDrag.y0 = e.clientY; sheetDrag.x0 = e.clientX; sheetDrag.dy = 0; sheetDrag.open = sheetOpen(); };
    $('#sheet-h').addEventListener('pointerdown', e => start(e, 'handle'));
    sh.addEventListener('pointerdown', e => { if (e.target.closest('#sheet-h')) return; if (P.scrollTop <= 0) start(e, 'sheet'); });
    $('#tabs').addEventListener('pointerdown', e => start(e, 'tabs'));
    addEventListener('pointermove', e => {
      if (!sheetDrag.on) return;
      const dy = e.clientY - sheetDrag.y0;
      if (!sheetDrag.moved && Math.abs(dy) < 8) return;
      if (!sheetDrag.moved && Math.abs(e.clientX - sheetDrag.x0) > Math.abs(dy)) { sheetDrag.on = false; return; }
      if (sheetDrag.from === 'sheet' && dy < 0) { sheetDrag.on = false; return; } // 위로 끌면 그냥 스크롤
      sheetDrag.moved = true; sheetDrag.dy = dy;
      const h = sh.offsetHeight;
      if (sheetDrag.open) { sh.style.transition = 'none'; sh.style.transform = `translateY(${Math.max(0, dy)}px)`; }
      else if (dy < 0) { $('#menu').classList.add('open', 'dragging'); sh.style.transition = 'none'; sh.style.transform = `translateY(${Math.max(0, h + dy)}px)`; }
    });
    const endDrag = e => {
      if (!sheetDrag.on) return;
      if (e.type === 'pointercancel') { if (!e.target.closest || !e.target.closest('#menu')) return; sheetDrag.moved = false; } // 지도 쪽 취소는 무시, 브라우저가 스크롤로 가져가면 원위치
      sheetDrag.on = false;
      const sh2 = $('#sheet'); sh2.style.transition = ''; sh2.style.transform = ''; $('#menu').classList.remove('dragging');
      if (!sheetDrag.moved) return;
      if (sheetDrag.open && sheetDrag.dy > 50) { closeSheet(); Sound.play('open'); }
      else if (!sheetDrag.open) { if (sheetDrag.dy < -40) { goTab(tab); Sound.play('open'); } else closeSheet(); }
      setTimeout(() => (sheetDrag.moved = false), 50);
    };
    addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  }
  function closeSheet() { $('#menu').classList.remove('open'); document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('on')); }
  function render() {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', sheetOpen() && b.dataset.tab === tab));
    const P = $('#panel'); previews = previews.filter(p => p.keep && document.body.contains(p.c));
    const seg = `<div class="seg">${[1, 10, 'max'].map(m => `<button data-mult="${m}" class="${mult === m ? 'on' : ''}">${m === 'max' ? 'MAX' : '×' + m}</button>`).join('')}</div>`;
    if (tab === 'grow') {
      P.innerHTML = `<div class="ph"><h3>저승사자 수련 <span class="sub" id="main-boost">위세 ×${Game.mainBoost().toFixed(2)}</span></h3>${seg}</div>` + ['pen', 'call', 'hand', 'step', 'luck', 'ledger'].map(id => upRow(UPGRADES.find(u => u.id === id))).join('') + '<p class="note">수련 업그레이드 레벨이 1 오를 때마다 저승사자 본인의 수확이 18%씩 늘어요 (위세). 졸개에게는 붙지 않아요.</p>';
    } else if (tab === 'minion') {
      const n = Game.minions();
      P.innerHTML = `<div class="ph"><h3>졸개 차사 <span class="sub">${n}/${Game.minionCap()}명</span></h3>${seg}</div>
        <div class="minions-view pbox" id="mview">${n ? '' : '<span class="empty">아직 졸개가 없어요. 고용하면 혼을 대신 거두고, 자리를 비워도 일해요.</span>'}</div>
        ${upRow(UPGRADES.find(u => u.id === 'minion'))}${(() => { const mc = Game.minionCapCost(), cap = Game.minionCap(); return `<div class="row pbox ${mc ? '' : 'maxed'}"><div class="ic"><img class="px" src="${IC('jade', 3)}"></div><div class="info"><div class="nm">졸개 정원 늘리기<small>${cap}/40명</small></div><div class="ds">옥으로 정원을 5명 늘려요 · 21번째부터는 <b>정예 졸개</b> (1명이 졸개 1.75명 몫)</div></div>${mc ? `<button class="btn jade" data-mcap="1" ${S().jade >= mc ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${mc}</button>` : '<button class="btn" disabled>MAX</button>'}</div>`; })()}${upRow(UPGRADES.find(u => u.id === 'drill'))}
        <p class="note">화면에는 졸개가 최대 4명까지 보이고, 나머지는 보이지 않는 곳에서 함께 일합니다.<br>졸개는 처음 20명까지 고용할 수 있고, 옥으로 정원을 늘리면 최대 40명까지 늘어나요. 21번째부터는 정예 졸개라 1명이 졸개 1.75명 몫을 거둬요.</p>`;
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
        <div class="looks"><div><div class="lk-w"><canvas class="mg" id="mg-now" width="48" height="20"></canvas><canvas id="lk-now" width="44" height="51"></canvas></div><span>${RANKS[s.rank].name}</span></div><b>▶</b><div><div class="lk-w"><canvas class="mg" id="mg-next" width="48" height="20"></canvas><canvas id="lk-next" width="44" height="51"></canvas></div><span class="nx">${N.name}</span></div></div><div class="mg-note">승진하면 발밑 <b>마법진</b>이 ${s.rank ? '더 화려해져요' : '생겨요'} ✨</div>
        <div class="prog"><i style="width:${pct}%"></i></div>
        <div class="d">레벨 <b style="color:var(--soul)">${L}</b> / ${N.lv} <span style="color:var(--mute)">(업그레이드를 강화하면 경험치가 쌓여 업그레이드 레벨이 오르고, 그만큼 차사 레벨 +1 · 최대 99)</span><br>
        승진하면 옷차림이 바뀌고 수확량 <b style="color:var(--gold)">×${(N.mult / RANKS[s.rank].mult).toFixed(1)}</b>${RANKS[s.rank].region !== N.region ? ` · 새 지역 <b style="color:var(--gold)">${REGIONS[N.region].name}</b>` : ''}</div>
        <button class="btn red" data-act="test" ${ok ? '' : 'disabled'}>${ok ? '승진하기' : `레벨 ${N.lv}에 승진할 수 있어요`}</button></div>`;
    } else {
      html += `<div class="promo pbox"><div class="looks"><div><div class="lk-w"><canvas class="mg" id="mg-now" width="48" height="20"></canvas><canvas id="lk-now" width="44" height="51"></canvas></div><span>염라대왕</span></div></div><div class="t">염라대왕에 올랐다!</div>
        <div class="d">윤회하면 직급과 수련이 처음으로 돌아가지만<br>모든 수확량이 영구히 <b style="color:var(--gold)">×${(1 + (s.reborn + 1) * 1.5).toFixed(1)}</b> (지금 ×${Game.rebornMult().toFixed(1)})가 된다.<br>옥과 구매한 상품은 유지된다.</div>
        <button class="btn red" data-act="reborn">윤회하기</button></div>`;
    }
    html += `<div class="sec">내 집무실</div><div class="offices pbox"><div><canvas id="of-now" width="150" height="104"></canvas><span>${Scene.officeName(s.rank)}</span></div>${N ? `<b>▶</b><div class="nx"><canvas id="of-next" width="150" height="104"></canvas><span>${Scene.officeName(s.rank + 1)}</span></div>` : ''}</div>
      <p class="note" style="margin-top:-4px">승진하면 집무실이 넓어지고 부하가 늘어나요. 결재 서류도 더 두둑해져요.</p>
      <div style="text-align:center;margin-bottom:14px"><button class="btn" data-act="office">집무실 들어가기${Life.docsCount() ? ` · 결재 ${Life.docsCount()}건` : ''}</button></div>`;
    html += `<div class="sec">저승 직급표</div><div class="ladder pbox">` + RANKS.map((R, i) => `<div class="lad ${i < s.rank ? 'done' : i === s.rank ? 'now' : i === s.rank + 1 ? 'next' : ''}">
      <canvas width="44" height="51" data-rank="${i}"></canvas><span class="nm">${R.name} <small style="color:var(--mute)">· ${REGIONS[R.region].name}</small></span><span class="lvreq">${i ? 'Lv.' + R.lv : ''}</span><span class="m">×${fmt(R.mult)}</span></div>`).join('') + '</div>';
    P.innerHTML = html;
    const add = (c, r, pose) => c && previews.push({ c, kind: s.kind || 'm', rank: r, pose });
    add($('#lk-now'), s.rank, 'idle'); if (N) add($('#lk-next'), s.rank + 1, 'idle');
    if ($('#mg-now')) previews.push({ c: $('#mg-now'), magic: s.rank, anchor: $('#lk-now') }); if ($('#mg-next')) previews.push({ c: $('#mg-next'), magic: s.rank + 1, anchor: $('#lk-next') });
    P.querySelectorAll('canvas[data-rank]').forEach(c => add(c, +c.dataset.rank, 'idle'));
    [['#of-now', s.rank], ['#of-next', s.rank + 1]].forEach(([q, t]) => { const c = $(q); if (!c) return; const g2 = c.getContext('2d'); g2.imageSmoothingEnabled = false; g2.drawImage(Scene.officeThumb(t, 150, 104), 0, 0); });
  }
  function renderShop(P) {
    const s = S();
    let h = `<div class="sec">무료 보상</div><div class="grid2">
      <div class="card pbox"><img class="px" src="${IC('luck', 3)}"><div class="nm">2배 부적 10분</div><div class="ds">혼 수확·화력 2배</div>
        <button class="btn" data-act="boostAd" ${Game.adLeft('boost') > 0 ? '' : 'disabled'}>광고 보기<em>${Game.adLeft('boost')}/${AD_LIMIT.boost}</em></button></div>
      <div class="card pbox"><img class="px" src="${IC('jade', 4)}"><div class="nm">옥 ${FREE_JADE}개</div><div class="ds">매일 무료 ${AD_LIMIT.jfree}번 · 광고 ${AD_LIMIT.jade}번</div>
        ${Game.adLeft('jfree') > 0 ? `<button class="btn jade" data-act="jadeFree">무료 받기<em>${Game.adLeft('jfree')}/${AD_LIMIT.jfree}</em></button>` : `<button class="btn jade" data-act="jadeAd" ${Game.adLeft('jade') > 0 ? '' : 'disabled'}>광고 보기<em>${Game.adLeft('jade')}/${AD_LIMIT.jade}</em></button>`}</div>
    </div><div class="sec">옥 상점</div><div class="grid2">`;
    h += JADE_SHOP.map(J => `<div class="card pbox"><img class="px" src="${IC(J.hours ? 'scroll' : J.boost ? 'luck' : 'minion', J.hours ? 4 : 3)}"><div class="nm">${J.name}</div><div class="ds">${J.desc}${J.hours ? `<br><b style="color:var(--soul)">+${fmt(Game.incomePerSec(true) * 3600 * J.hours)}</b>` : ''}</div>
      ${J.day ? `<div class="ds" style="color:var(--gold)">오늘 ${Game.jadeLeft(J.id)}/${J.day}회 남음</div>` : ''}${J.minion ? `<div class="ds">졸개 ${Game.minions()}/${Game.minionCap()}명</div>` : ''}${Game.jadeMaxed(J.id) ? (Game.minionCapCost() ? `<div class="ds" style="color:var(--gold)">정원이 가득 찼어요</div><button class="btn jade" data-mcap="1"><img class="px" src="${IC('jade', 2)}">정원 +5 · ${Game.minionCapCost()}</button>` : '<div class="ds" style="color:var(--gold)">졸개가 최대예요 (40명)</div>') : ''}${J.minion && Game.jadeMaxed(J.id) && Game.minionCapCost() ? '' : `<button class="btn jade" data-jade="${J.id}" ${Game.jadeCost(J.id) == null || Game.jadeMaxed(J.id) ? 'disabled' : s.jade >= Game.jadeCost(J.id) ? '' : 'data-short="jade"'}>${Game.jadeMaxed(J.id) ? '최대' : Game.jadeCost(J.id) == null ? '내일 다시' : `<img class="px" src="${IC('jade', 2)}">${Game.jadeCost(J.id)}`}</button>`}</div>`).join('');
    h += `</div><div class="sec">패키지</div><div class="grid2">`;
    h += SHOP_IAP.map(P => { const left = Game.iapLeft(P.id), own = left <= 0, sl = P.seal ? Game.sealLeft() : 0; return `<div class="card pbox ${own ? 'owned' : ''}">${P.tag ? `<span class="tag">${P.tag}</span>` : ''}<img class="px" src="${IC(P.icon, P.icon === 'jade' ? 4 : 3)}"><div class="nm">${P.name}</div><div class="ds">${P.desc || '보석함에 바로 지급'}</div>
      ${P.daily ? `<div class="ds" style="color:var(--gold)">하루 ${P.daily}번 · 오늘 ${Math.max(0, left)}번 남음</div>` : ''}${sl > 0 ? `<div class="ds" style="color:var(--jade)">효과 남은 기간 ${fmtDays(sl)}</div>` : ''}
      <button class="btn red" data-iap="${P.id}" ${own ? 'disabled' : ''}>${own ? (P.daily ? '내일 다시' : '구매 완료') : priceOf(P.id)}</button></div>`; }).join('');
    h += `</div>${testPay() ? '<p class="note">테스트 버전: 실제 결제·광고 없이 바로 지급됩니다.</p>' : ''}`;
    P.innerHTML = h;
  }
  // 버튼 상태만 갱신 (DOM을 다시 만들지 않아 터치가 끊기지 않음)
  function refresh(force) {
    const s = S(); if (!s) return;
    const mb = document.getElementById('main-boost'); if (mb) { const t = `위세 ×${Game.mainBoost().toFixed(2)}`; if (mb.dataset.k !== t) { mb.dataset.k = t; mb.textContent = t; } }
    UPGRADES.forEach(U => {
      const btn = document.querySelector(`[data-buy="${U.id}"]`); if (!btn) return;
      const L = Game.lv(U.id), um = Game.umax(U.id), maxed = L >= um;
      let n = mult === 'max' ? Math.max(1, Game.maxBuy(U.id).n) : Math.min(mult, um - L);
      const c = maxed ? 0 : Game.cost(U.id, n);
      const X = Game.uxp(U.id); $(`#lv-${U.id}`).textContent = `Lv.${X.lv}`;
      const xt = $(`#xt-${U.id}`); if (xt) xt.textContent = X.need ? `경험치 ${Math.floor(X.cur / X.need * 100)}%` : '최대 레벨';
      const xb = $(`#xp-${U.id}`); if (xb) xb.style.width = (X.need ? Math.round(X.cur / X.need * 100) : 100) + '%';
      const de = $(`#de-${U.id}`), dt = U.cap && L >= U.cap && ['step', 'call', 'hand', 'luck'].includes(U.id) ? '숙련: 강화마다 혼 가치 +1%' : U.desc; if (de && de.textContent !== dt && de.dataset.k !== dt) { de.dataset.k = dt; de.textContent = dt; }
      $(`#ef-${U.id}`).textContent = maxed ? Game.eff(U.id, L) + ' (최대)' : `${Game.eff(U.id, L)} → ${Game.eff(U.id, L + n)}`;
      $(`#co-${U.id}`).textContent = maxed ? '최대' : fmt(c);
      $(`#bl-${U.id}`).textContent = maxed ? '' : `+${n}`;
      btn.disabled = maxed; if (!maxed && c > s.souls) btn.dataset.short = 'souls'; else btn.removeAttribute('data-short');
      $(`#row-${U.id}`).classList.toggle('maxed', maxed);
    });
    if (tab === 'rank' && !force) {
      const bar = document.querySelector('.prog i'), N = Game.nextRank();
      if (bar && N) { const b = document.querySelector('[data-act="test"]'); const ok = Game.canTest(); if (b && b.disabled === ok) renderRank($('#panel')); }
    }
    if (tab === 'life' && !force) lifeTick();
    if (tab === 'shop' && !force) document.querySelectorAll('[data-jade]').forEach(b => { const c = Game.jadeMaxed(b.dataset.jade) ? null : Game.jadeCost(b.dataset.jade); b.disabled = c == null; b.toggleAttribute('data-short', c != null && s.jade < c); if (c != null && s.jade < c) b.dataset.short = 'jade'; });
  }
  function onPanel(e) {
    const t = e.target.closest('button, [data-dexi]'); if (!t) return;
    if (t.dataset.mult) { mult = t.dataset.mult === 'max' ? 'max' : +t.dataset.mult; render(); return; }
    if (t.dataset.mcap) { const c = Game.minionCapCost(); askBuy('졸개 정원 늘리기', '고용할 수 있는 졸개를 5명 늘릴까요?', c, 0, () => { if (Game.buyMinionCap()) { Sound.play('buy'); got(`졸개 정원이 ${Game.minionCap()}명으로 늘었어요!`, { ic: 'minion' }); } else { Sound.play('no'); toast('옥이 부족해요'); } render(); }); return; }
    if (t.dataset.buy) {
      const id = t.dataset.buy;
      const L0 = Game.lv(id), u0 = Game.ulv(id), g0 = Game.level();
      if (Game.buy(id, mult)) {
        tutEv('buy');
        Life.qEvent('buy', Game.lv(id) - L0);
        Sound.play('buy');
        const r = t.getBoundingClientRect(), st = $('#stage').getBoundingClientRect();
        const u1 = Game.ulv(id), g1 = Game.level(), UU = UPGRADES.find(x => x.id === id);
        if (g1 > g0) { float(st.width / 2, st.height * 0.42, `Lv.${g1}`, 'lvup'); toast(`🎉 ${UU.name} Lv.${u1}! 차사 레벨 ${g1}`); }
        else float(st.width / 2, st.height * 0.42, `강화 +${Game.lv(id) - L0}`, 'lvup');
        if (id === 'minion') { render(); }
        refresh(true);
      } else Sound.play('no');
      return;
    }
    if (t.dataset.jade) {
      const J = JADE_SHOP.find(j => j.id === t.dataset.jade);
      if (Game.jadeMaxed(J.id)) { toast(Game.minionCapCost() ? '정원이 가득 찼어요. 정원을 늘리면 더 고용할 수 있어요' : '졸개가 이미 최대예요 (40명)'); return; }
      if (Game.jadeCost(J.id) == null) { toast('오늘은 다 샀어요. 내일 다시 살 수 있어요'); return; }
      confirmBox(`<h2>${J.name}</h2><p>${J.desc}</p><p>옥 ${Game.jadeCost(J.id)}개를 사용할까요?${J.day ? `<br><small style="color:var(--mute)">하루 ${J.day}회 · 오늘 ${Game.jadeLeft(J.id)}회 남음</small>` : ''}</p>`, () => {
        const r = Game.jadeBuy(J.id);
        if (r) { Sound.play('buy'); got(typeof r === 'number' ? `+${fmt(r)} 혼` : `${J.name} 사용!`, { ic: typeof r === 'number' ? 'soul' : 'luck' }); render(); } else { Sound.play('no'); render(); }
      });
      return;
    }
    if (t.dataset.iap) { iapBox(t.dataset.iap); return; }
    if (t.dataset.pull) { doPull(t.dataset.pull); return; }
    if (t.dataset.pet) { petInfo(t.dataset.pet); return; }
    if (t.dataset.fuse) { const [g, n] = t.dataset.fuse.split(':'); const r = Pets.fuse(g, +n); if (r) { gachaShow(r, { fuse: g }); render(); } return; }
    if (t.dataset.fuseall) { fuseAllGo(t.dataset.fuseall === 'ALL' ? Object.keys(Pets.FUSE_UP) : [t.dataset.fuseall]); return; }
    if (t.dataset.eq) { if (Pets.equip(t.dataset.eq)) { Sound.play('buy'); toast(`${Pets.P(t.dataset.eq).name}을(를) 소환했어요`); render(); } else toast('아직 만나지 못한 영물이에요'); return; }
    if (lifeClick(t)) return;
    act(t.dataset.act);
  }
  function act(a) {
    if (a === 'office') { enterOffice(); return; }
    if (a === 'test') { if (!Game.canTest()) return; const old = S().rank, R0 = RANKS[old].region; if (Game.promote()) { Scene.pillar(); promoted(RANKS[S().rank].region !== R0, old); Board.push(true); } render(); }
    else if (a === 'reborn') confirmBox(`<h2>윤회</h2><p>직급·수련·보유한 혼이 처음으로 돌아갑니다.<br>모든 수확량이 영구히 ×${(1 + (S().reborn + 1) * 1.5).toFixed(1)}가 됩니다.</p>`, () => { Game.reborn(); Sound.play('promote'); toast('윤회했다! 새로운 생이 시작된다'); render(); });
    else if (a === 'boostAd') { closeModal(); boostAd(); }
    else if (a === 'jadeFree') { if (Game.adLeft('jfree') <= 0) return; Game.useAd('jfree'); S().jade += FREE_JADE; Game.save(); Sound.play('buy'); got(`옥 +${FREE_JADE}`, { ic: 'jade' }); render(); }
    else if (a === 'jadeAd') { if (Game.adLeft('jade') <= 0) return; ad(() => { Game.useAd('jade'); S().jade += FREE_JADE; Game.save(); got(`옥 +${FREE_JADE}`, { ic: 'jade' }); render(); }); }
    else if (a === 'close') closeModal();
  }



  // ---------- 맵 건물 ----------
  function placeLabels() {
    const al = Life.alerts ? Life.alerts() : {};
    if (Scene.inArena && Scene.inArena()) { document.querySelectorAll('.plabel').forEach(e => e.classList.add('hide')); return; }
    Scene.labels().forEach(l => {
      const e = document.getElementById('lb-' + l.id); if (!e) return;
      e.classList.toggle('hide', !l.vis);
      if (!l.vis) return;
      e.style.left = l.x + 'px'; e.style.top = l.y + 'px';
      const hot = l.id.startsWith('n_') ? npcHot(l.id.slice(2)) : (l.id === 'garden' && al.garden) || (l.id === 'stall' && Life.merchantHere()) || (l.id === 'office' && Life.docsCount() > 0);
      e.classList.toggle('hot', !!hot);
      if (l.id === 'stall') e.textContent = Life.merchantHere() ? '도깨비 상인!' : '노점';
    });
  }
  function npcHot(id) {
    const s = S(); if (!s || !s.kind) return false;
    if (id === 'mudang') return Life.fortuneLeft() >= 2;
    if (id === 'sansin') { const o = Life.offerState(); return (o.small > 0 && s.souls >= o.smallCost) || (o.big > 0 && s.souls >= o.bigCost); }
    if (id === 'kkachi') return Life.mailCount() > 0;
    if (id === 'elder') return Life.qReady();
    if (id === 'judge') return Game.canTest();
    if (id === 'jumo') return Life.alerts().brew;
    if (id === 'boat') return Life.alerts().expe;
    if (id === 'gob') return true;
    return false;
  }
  function fortuneModal() {
    const left = Life.fortuneLeft(), f = S().fortune, on = Life.fortuneMul() > 1;
    const box = modal(`<h2>무당 · 오늘의 운세</h2><p>"어디 보자… 오늘 자네 운수를 봐 주지."</p>
      ${on ? `<p>지금 운세 <b style="color:var(--gold)">${f.last}</b> · 혼 수확 ×${f.mul} (${fmtTime((f.until - Date.now()) / 1000)} 남음)</p>` : ''}
      <p class="mute" style="font-size:10px">대길 6% · 길 24% · 소길 40% · 평 25% · 흉 5%(옥 30)</p>
      <div class="acts"><button class="btn red" id="ft-go" ${left > 0 ? '' : 'disabled'}>${left >= 2 ? '운세 보기 (무료)' : left === 1 ? '한 번 더 보기' : '내일 또 오게'}${left === 1 ? '<em>AD</em>' : ''}</button><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#ft-go').onclick = () => {
      const go = () => { const F = Life.drawFortune(); if (!F) return; Sound.play(F.mul >= 1.5 ? 'promote' : 'buy');
        modal(`<h2>오늘의 운세</h2><div class="big" style="color:${F.name === '흉' ? '#ff8a9a' : 'var(--gold)'};font-size:34px">${F.name}</div><p>${F.text}</p><div class="acts"><button class="btn red" data-act="close">고맙습니다</button></div>`); };
      if (left === 1) { closeModal(); ad(go); } else go();
    };
  }
  function offerModal() {
    const o = Life.offerState(), s = S();
    const box = modal(`<h2>산신령 · 공양</h2><p>"혼을 바치면 옥으로 보답하마."</p>
      <div class="offer pbox"><div class="info"><b>작은 공양</b><div class="mute" style="font-size:10px">10분치 혼 → 옥 10 · 오늘 ${o.small}/3번</div></div><button class="btn" id="of-s" ${o.small <= 0 ? 'disabled' : s.souls >= o.smallCost ? '' : 'data-short="souls"'}><img class="px" src="${IC('soul', 2)}">${fmt(o.smallCost)}</button></div>
      <div class="offer pbox"><div class="info"><b>큰 공양</b><div class="mute" style="font-size:10px">1시간치 혼 → 옥 50 + 소환권 1 · 오늘 ${o.big}/1번</div></div><button class="btn red" id="of-b" ${o.big <= 0 ? 'disabled' : s.souls >= o.bigCost ? '' : 'data-short="souls"'}><img class="px" src="${IC('soul', 2)}">${fmt(o.bigCost)}</button></div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#of-s').onclick = () => { closeModal(); askBuy('작은 공양', '혼을 바치고 옥 10을 받을까요?', 0, Life.offerState().smallCost, () => { if (Life.offer('small')) { Sound.play('buy'); got('공양을 올렸다. 옥 +10', { ic: 'jade' }); } else { Sound.play('no'); toast('혼이 부족해요'); } offerModal(); }, offerModal); };
    box.querySelector('#of-b').onclick = () => { closeModal(); askBuy('큰 공양', '혼을 바치고 옥 50 + 소환권 1을 받을까요?', 0, Life.offerState().bigCost, () => { if (Life.offer('big')) { Sound.play('promote'); got('큰 공양! 옥 +50 · 소환권 +1', { ic: 'jade' }); } else { Sound.play('no'); toast('혼이 부족해요'); } offerModal(); }, offerModal); };
  }
  // ---------- 시간 단축 창 (모든 타이머 공통) ----------
  const SKIP_NAME = { plot: '꽃이 자라는', expe: '파견에서 돌아오는', docs: '다음 결재 서류가 올라오는', mail: '다음 까치 편지가 오는', parade: '다음 백귀야행까지 남은' };
  function speedUp(kind, i, after) {
    const l = Life.timerLeft(kind, i); if (l <= 0) { after && after(); return; }
    const c = Life.skipCost(l), al = Game.adLeft('skip');
    const box = modal(`<h2>⏩ 시간 단축</h2><p>${SKIP_NAME[kind]} 시간<br><b class="big" style="color:var(--gold)" id="sk-left">${fmtTime(l)}</b></p>
      <div class="sk-opts"><button class="btn" id="sk-ad" ${al > 0 ? '' : 'disabled'}><span>📺 광고 보고 30분 단축</span><em>오늘 ${al}/${AD_LIMIT.skip}</em></button>
      ${kind === 'mail' ? '' : `<button class="btn jade" id="sk-jade" ${S().jade >= c ? '' : 'data-short="jade"'}><span><img class="px" src="${IC('jade', 2)}"> 옥 ${c}개로 바로 완료</span><em>10분당 옥 20개</em></button>`}</div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    const done = msg => { closeModal(); Sound.play('promote'); toast(msg); if (tab === 'life') renderLife($('#panel')); officeBar(); after && after(); };
    if (box.querySelector('#sk-jade')) box.querySelector('#sk-jade').onclick = () => { const r = Life.skipJade(kind, i); if (r) done(`옥 ${r}개로 시간을 건너뛰었어요!`); else { Sound.play('no'); toast('옥이 부족해요'); } };
    box.querySelector('#sk-ad').onclick = () => { if (Game.adLeft('skip') <= 0) return; closeModal(); ad(() => { Game.useAd('skip'); Life.skipAd(kind, i); const left = Life.timerLeft(kind, i); Sound.play('buy'); toast(left > 0 ? `30분 단축! 남은 시간 ${fmtTime(left)}` : '완료됐어요!'); if (tab === 'life') renderLife($('#panel')); officeBar(); if (left > 0) speedUp(kind, i, after); else after && after(); }); };
  }
  function mailOpen() {
    const n = Life.mailCount();
    if (!n) { // 까치 우편은 단축 없이 4시간마다
      modal(`<div class="got"><div class="got-ic">🐦</div><h2>까치 우편</h2><p class="got-t">다음 편지까지 <b>${fmtTime(Life.mailNext())}</b></p><p class="mute">까치는 4시간마다 편지를 1통씩 물어 와요 (최대 3통)</p></div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
      return;
    }
    const g = Life.openMail(); Sound.play('promote');
    modal(`<h2>까치 우편 ${g.length}통</h2><p>까치가 저승 곳곳에서 선물을 물어 왔어요.</p>${g.map(x => `<div class="offer pbox"><div class="info"><b>🎁 ${x}</b></div></div>`).join('')}<p class="mute" style="font-size:10px">4시간마다 1통, 최대 3통까지 쌓여요</p><div class="acts"><button class="btn red" data-act="close">받기</button></div>`);
  }
  // ---------- 집무실 ----------
  function enterOffice() {
    { const g = Decor.grantRank(S().rank); if (g.length) setTimeout(() => toast(g.length === 1 ? `🎁 「${g[0].name}」을(를) 선물로 받았어요! 꾸미기에서 놓아 보세요` : `🎁 직급 선물 ${g.length}개를 받았어요! (의자 ${g.filter(d => d.chair).length}개 포함) 꾸미기에서 놓아 보세요`, 3600), 600); }
    if (!Scene.inOffice()) { Scene.enterOffice(S().rank); Sound.play('open'); }
    let bar = $('#office-bar'); if (!bar) { bar = document.createElement('div'); bar.id = 'office-bar'; $('#stage').appendChild(bar); }
    const N = Game.nextRank();
    bar.innerHTML = `<div class="of-top"><button class="btn dark" id="of-out">◀ 나가기</button><div><b>${Scene.officeName(S().rank)}</b><small>${N ? `다음: ${Scene.officeName(S().rank + 1)} (Lv.${N.lv})` : '저승 최고의 집무실'}</small></div>${Board.online() ? `<button class="btn dark of-gb" id="of-gb">👍 ${S().officeLikes || 0} · 📜</button>` : ''}</div>`;
    let acts = $('#office-acts'); if (!acts) { acts = document.createElement('div'); acts.id = 'office-acts'; $('#stage').appendChild(acts); }
    acts.innerHTML = `<div class="of-acts"><button id="of-docs"><span>📜</span>결재<i></i></button><button id="of-judge"><span>⚖️</span>망자 심판<i></i></button><button id="of-expe"><span>🚣</span>부하 파견<i></i></button><button id="of-deco"><span>🏮</span>꾸미기<i></i></button><button id="of-nb"><span>🏘️</span>놀러 가기<i></i></button></div>`;
    bar.classList.add('on'); acts.classList.add('on'); $('#side').style.display = 'none'; $('#stage').classList.add('in-office'); document.body.classList.add('in-office-t');
    bar.querySelector('#of-out').onclick = exitOffice;
    const gb = bar.querySelector('#of-gb'); if (gb) gb.onclick = () => guestbookModal(Board.myId(), true);
    $('#of-docs').onclick = () => { claimDocs(); tutEv('docs'); };
    $('#of-judge').onclick = () => { judgeModal(); tutEv('judge'); };
    $('#of-expe').onclick = () => { openLife('expe'); tutEv('expe'); };
    $('#of-deco').onclick = () => decoStart();
    $('#of-nb').onclick = () => neighborsModal();
    Board.pushOffice();
    officeBar(); tutEv('office');
  }
  // 집무실 버튼의 숫자 갱신
  function officeBar() {
    const bar = $('#office-bar'); if (!bar || !bar.classList.contains('on') || visiting) return;
    const d = Life.docsCount(), j = Life.judgeLeft(), e = S().expe || [], ed = e.filter(x => Life.expeLeft(x) <= 0).length;
    const set = (q, txt, hot) => { const b = $(q); if (!b) return; b.querySelector('i').textContent = txt; b.classList.toggle('hot', hot); };
    const dn = Life.docsNext(); set('#of-docs', d ? d + '건' : `${Math.floor(dn / 3600)}:${String(Math.floor(dn % 3600 / 60)).padStart(2, '0')}`, d > 0);
    set('#of-judge', `${j}/${Life.JUDGE_MAX}`, j > 0);
    set('#of-expe', ed ? '완료!' : `${e.length}/${Life.slots()}`, ed > 0 || e.length < Life.slots());
    set('#of-deco', `품격 ${Decor.score()}`, DECOR.some(d => Decor.spare(d.id) > 0) && Decor.ensure().placed.length < Decor.maxPlace());
  }
  function exitOffice() { decoEnd(true); if (visiting) { visiting = null; } Scene.exitOffice(); const bar = $('#office-bar'); if (bar) bar.classList.remove('on'); $('#office-acts') && $('#office-acts').classList.remove('on'); $('#side').style.display = ''; $('#stage').classList.remove('in-office'); document.body.classList.remove('in-office-t'); Sound.play('open'); }
  // ---------- 내 정보 (왼쪽 위 초상화를 누르면) ----------
  function statsModal() {
    const s = S(), R = RANKS[s.rank], N = Game.nextRank(), pct = x => `${x >= 1 ? '+' : ''}${Math.round((x - 1) * 100)}%`, f1 = x => (Math.round(x * 100) / 100).toString();
    const pet = s.petEq && s.pets && s.pets[s.petEq] ? Pets.P(s.petEq) : null, pst = pet ? Pets.stats(pet.id) : [0, 0, 0];
    const buffs = [Game.boosting() ? `2배 부적 ×2` : '', Game.sealLeft() > 0 ? `염라의 인장 ×2 (${fmtDays(Game.sealLeft())})` : '', Life.fortuneMul() > 1 ? `운세 ${s.fortune.last} ×${Life.fortuneMul()}` : '', ...['value', 'spawn', 'fight'].filter(k => Life.buffLeft(k) > 0).map(k => `${BUFF_NAME[k]} ${fmtClock(Life.buffLeft(k))}`)].filter(Boolean);
    const row = (k, v, sub) => `<div class="st-row"><span>${k}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const box = modal(`<div class="st-head"><canvas id="st-por" class="pf-mini" width="120" height="84"></canvas><div><b>${esc(s.name || '')}</b><span class="badge">${R.name}</span><small>Lv.${Game.level()} · ${REGIONS[R.region].name}${s.reborn ? ` · 윤회 ${s.reborn}회` : ''}</small>${N ? `<div class="prog"><i style="width:${Math.min(100, Game.level() / N.lv * 100)}%"></i></div><small>다음 계급 <b style="color:var(--gold)">${N.name}</b>까지 Lv.${N.lv}</small>` : '<small style="color:var(--gold)">최고 계급!</small>'}</div></div>
      <div class="st-sec">⚡ 수확</div>
      ${row('혼 1개 가치', fmt(Game.value() * Game.avgTier()), `평균 등급 ×${f1(Game.avgTier())}`)}
      ${row('수확 시간', f1(Game.reap()) + '초', '거두는 데 걸리는 시간')}
      ${row('혼령 나타나는 간격', f1(Game.spawn()) + '초')}
      ${row('함께 거두기', `Lv.${Game.lv('hand')}`, '주변 혼령을 한 번에')}
      <div class="st-sec">🏃 이동 · 졸개</div>
      ${row('이동 속도', Game.walk().toFixed(1))}
      ${row('졸개 수', Game.minions() + '명', `졸개 이동 ${f1(Game.mWalk())} · 수확 ${f1(Game.mReap())}초`)}
      ${row('자리 비움 보상 한도', Game.offHours() + '시간', '효율 60%')}
      <div class="st-sec">⚔️ 원귀 퇴치</div>
      ${row('터치 화력', fmt(Game.tapDmg()))}
      ${row('자동 화력', fmt(Game.wraithDps()) + ' /초')}
      <div class="st-sec">✨ 배수 내역</div>
      ${row('계급 배수', '×' + fmt(R.mult))}
      ${s.reborn ? row('윤회 배수', '×' + f1(Game.rebornMult())) : ''}
      ${row('소환 중인 영물', pet ? `${pet.name} ★${s.pets[pet.id]}` : '없음', pet ? `수확량 +${Math.round(pst[0] * 100)}% · 이동 +${Math.round(pst[1] * 100)}% · 수확속도 +${Math.round(pst[2] * 100)}%` : '')}
      ${row('영물 도감', `${Object.keys(s.pets || {}).length}종`, `수확량 +${+(Object.keys(s.pets || {}).length * 0.5).toFixed(1)}%`)}
      ${row('혼령 도감', pct(1 + Life.dexBonus()))}
      ${row('집무실 품격', `${Decor.score()} (${Decor.title(Decor.score())})`, `수확량 ${pct(Decor.mul())}`)}
      ${row('지금 받는 버프', buffs.length ? buffs.join('<br>') : '없음')}
      <div class="st-sec">📊 기록</div>
      ${row('플레이 시간', fmtPlay(s.playSec || 0), '게임을 실제로 켜 둔 시간')}
      ${row('퇴치한 원귀', fmt(s.stats ? s.stats.wraith : 0))}
      ${row('터치로 거둔 혼령', fmt(s.stats ? s.stats.tap : 0))}
      ${row('명판결', fmt(s.judge ? s.judge.total || 0 : 0) + '건')}
      ${Board.place() ? row('순위', Board.place() + '위') : ''}
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    previews.push({ c: box.querySelector('#st-por'), prof: { kind: s.kind || 'm', rank: s.rank, pet, star: pet ? s.pets[pet.id] : 1 } });
  }

  // ---------- 구매 복원: 설명 → 확인 → 결과 ----------
  function restoreModal() {
    const s = S(), seal = Game.sealLeft(), boost = Game.boosting() ? Math.max(0, (s.boostUntil - Date.now()) / 1000) : 0, b = s.bought || {};
    const row = (k, v) => `<div class="st-row"><span>${k}</span><b>${v}</b></div>`;
    const box = modal(`<h2>🔄 구매 복원</h2><p>휴대폰을 바꾸거나 앱을 다시 설치했을 때, 지금 스토어 계정으로 산 한 번만 사는 상품을 다시 받아요.</p>
      <div class="st-sec">복원되는 상품</div>
      ${row('🚫 광고 제거', s.noAds ? '✔ 적용 중' : '복원 대상')}
      ${row('🎁 신입 차사 패키지', b.starter ? '✔ 구매 기록 있음' : '복원 대상')}
      <p class="mute" style="font-size:11px">신입 차사 패키지는 다시 지급되지 않고, 이미 산 상품으로 표시돼요.</p>
      <div class="st-sec">복원되지 않는 상품</div>
      <p class="mute" style="font-size:11px">옥 · 승진 응원 패키지 · 염라의 인장 · 특제 의자는 사는 순간 바로 지급되는 상품이라 복원 대상이 아니에요. 로그인해 두면 게임 기록과 함께 보관돼요.</p>
      <div class="st-sec">지금 남은 기간</div>
      ${row('👑 염라의 인장 (혼 수확 2배)', seal ? fmtDays(seal) : '없음')}
      ${row('🧧 2배 부적', boost ? fmtClock(boost) : '없음')}
      <p>구매 복원을 할까요?</p>
      <div class="acts"><button class="btn red" id="rs-go">복원하기</button><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelector('#rs-go').onclick = async () => {
      const before = { ads: !!s.noAds, st: !!b.starter }; closeModal(); toast('구매 내역을 확인하는 중…', 2000);
      const ok = await Native.restore(); await new Promise(r => setTimeout(r, 1500));
      if (!ok) { got('스토어에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.', { emo: '⚠️', title: '복원하지 못했어요' }); return; }
      const t = S(), items = [!before.ads && t.noAds ? '🚫 광고 제거' : '', !before.st && (t.bought || {}).starter ? '🎁 신입 차사 패키지 (구매 기록)' : ''].filter(Boolean);
      got(items.length ? `복원된 상품<br><b>${items.join('<br>')}</b>` : '새로 복원할 상품이 없어요.<br><span class="mute">이 스토어 계정으로 산 한 번만 사는 상품이 없거나, 이미 적용돼 있어요.</span>', { emo: '🔄', title: items.length ? '복원 완료!' : '복원 확인 완료' });
      render();
    };
  }
  // ---------- 공지사항 · 전체 우편 ----------
  // 오늘 하루 그만보기: 한국 시간(UTC+9) 다음 날 00시까지 숨김
  const nextKstMidnight = () => { const D = 864e5, K = 9 * 3600e3; return Math.floor((Date.now() + K) / D) * D + D - K; };
  const DEFAULT_NOTICES = [{ id: 'n_welcome', title: '저승사자 키우기에 오신 걸 환영해요!', body: '떠도는 혼을 거두고 승진해서 염라대왕이 되어 보세요.\n집무실을 꾸미고 이웃 집무실에 놀러 가 방명록도 남겨 보세요.\n매일 출석·의뢰·결재를 챙기면 더 빨리 성장해요!', at: Date.now(), pin: 1 }];
  let noticeCache = null, mailCache = null;
  const fmtDate = t => { const d = new Date(t + 9 * 3600e3); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`; };
  async function loadNotices() { try { const n = Board.online() ? await Board.notices() : null; noticeCache = n && n.length ? n.sort((a, b) => (b.pin || 0) - (a.pin || 0) || b.at - a.at) : (Board.online() ? [] : DEFAULT_NOTICES); } catch (e) { noticeCache = noticeCache || DEFAULT_NOTICES; } return noticeCache; }
  async function noticeStartup() {
    if (!S().kind) { setTimeout(noticeStartup, 3000); return; }
    if ((S().noticeHide || 0) > Date.now()) return;
    const list = await loadNotices(); if (!list.length) return;
    // 창 · 안내 · 집무실 · 꾸미기 · 아래 메뉴가 열려 있으면 기다렸다가 마을 화면으로 돌아왔을 때 띄움 (최대 3분)
    const busy = () => (!Story.cur().end && !Story.cur().intro) || $('#modal').classList.contains('on') || $('#promo').classList.contains('on') || document.getElementById('tut') || Scene.inOffice() || sheetOpen() || parade;
    let tries = 0; const go = () => { if (busy() && tries++ < 180) { setTimeout(go, 1000); return; } if (!busy()) noticeModal(true); }; go();
  }
  async function noticeModal(startup) {
    const list = noticeCache || await loadNotices(), admin = Board.online() && await Board.checkOwner();
    const seen = S().noticeSeen || 0; // 이 값보다 나중에 올라온 공지 = 새 공지
    const box = modal(`<h2>📢 공지사항</h2><div class="nt-list">${list.length ? list.map((n, i) => `<div class="nt-item ${i === 0 ? 'open' : ''}" data-nt="${esc(n.id)}"><div class="nt-head">${n.pin ? '<em>📌</em>' : ''}${(n.at || 0) > seen ? '<span class="new-tag">N</span>' : ''}<b>${esc(n.title)}</b><small>${fmtDate(n.at)}</small>${admin ? `<button class="nt-del" data-ntdel="${esc(n.id)}">삭제</button>` : ''}</div><div class="nt-body">${esc(n.body || '').replace(/\n/g, '<br>')}</div></div>`).join('') : '<div class="rkload">아직 공지사항이 없어요</div>'}</div>
      ${admin ? '<button class="btn" id="nt-write">✍️ 공지 쓰기 (운영자)</button>' : ''}
      <label class="nt-hide"><input type="checkbox" id="nt-today" ${(S().noticeHide || 0) > Date.now() ? 'checked' : ''}> 오늘 하루 그만보기 <small>(한국 시간 00시에 다시 떠요)</small></label>
      <div class="acts"><button class="btn dark" id="nt-close">닫기</button></div>`);
    S().noticeSeen = Math.max(S().noticeSeen || 0, ...list.map(n => n.at || 0)); Game.save(); $('#btn-notice .dot').classList.remove('on');
    box.querySelectorAll('.nt-head').forEach(h => h.onclick = e => { if (e.target.closest('[data-ntdel]')) return; h.parentElement.classList.toggle('open'); });
    box.querySelector('#nt-close').onclick = () => { S().noticeHide = box.querySelector('#nt-today').checked ? nextKstMidnight() : 0; Game.save(); closeModal(); };
    const w = box.querySelector('#nt-write'); if (w) w.onclick = () => { closeModal(); adminNotice(); };
    box.querySelectorAll('[data-ntdel]').forEach(b => b.onclick = () => { const id = b.dataset.ntdel; closeModal(); confirmBox('<h2>공지 삭제</h2><p>이 공지를 삭제할까요?</p>', async () => { try { await Board.delNotice(id); toast('공지를 삭제했어요'); } catch (e) { toast('삭제하지 못했어요'); } noticeCache = null; noticeModal(false); }, '삭제'); });
  }
  function adminNotice() {
    const box = modal(`<h2>✍️ 공지 쓰기</h2><p class="mute">모든 플레이어에게 보여요</p>
      <div class="ad-form"><input id="an-title" maxlength="40" placeholder="제목"><textarea id="an-body" maxlength="600" rows="6" placeholder="내용"></textarea><label><input type="checkbox" id="an-pin"> 📌 맨 위에 고정</label></div>
      <div class="acts"><button class="btn red" id="an-ok">올리기</button><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelector('#an-ok').onclick = async () => { const title = box.querySelector('#an-title').value.trim(), body = box.querySelector('#an-body').value.trim(); if (!title) { toast('제목을 입력해 주세요'); return; }
      try { await Board.postNotice({ title, body, pin: box.querySelector('#an-pin').checked ? 1 : 0 }); noticeCache = null; Sound.play('promote'); toast('📢 공지를 올렸어요!', 3000); closeModal(); noticeModal(false); } catch (e) { toast(`올리지 못했어요: ${esc(e && (e.message || e.code) || '알 수 없는 오류')}`, 4000); } };
  }
  // 우편: 운영자가 보낸 우편을 한 번씩 받는다 (받은 기록은 내 저장에)
  // 받는 사람(to): all 모두 · new 보낸 뒤 새로 시작한 사람 · old 보낸 시점에 이미 하던 사람 · online 보낸 순간 게임을 켜 두고 있던 사람 · user 고른 플레이어
  const MAIL_TO = { all: '모두 (지금 + 새로 올 사람)', old: '지금 하고 있는 사람만', new: '새로 시작하는 사람만', online: '지금 접속 중인 사람만', user: '특정 플레이어' };
  let sessFrom = Date.now(), hiddenAt = 0; // 이번 접속 시작 (2분 넘게 나갔다 오면 새 접속)
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 120e3) sessFrom = Date.now(); });
  function mailFor(m) {
    const to = m.to || 'all', made = S().created || 0;
    if (to === 'new') return made > m.at;
    if (to === 'old') return made <= m.at;
    if (to === 'online') return sessFrom <= m.at;
    if (to === 'user') return (m.uids || []).includes(Board.myId());
    return true;
  }
  const myMails = list => (list || []).filter(mailFor);
  async function refreshMail() { if (!Board.canMail()) return; try { mailCache = await Board.mails(); const gotM = S().mailGot || {}; generalNew = myMails(mailCache).some(m => !gotM[m.id]); mailWatch(); const nl = await loadNotices(); $('#btn-notice .dot').classList.toggle('on', nl.some(n => (n.at || 0) > (S().noticeSeen || 0))); } catch (e) {} }
  const rewardChips = m => [m.jade ? `💎 옥 ${m.jade}` : '', m.souls ? `🔥 혼 ${fmt(m.souls)}` : '', m.tickets ? `🎫 소환권 ${m.tickets}` : '', m.hours ? `🔥 ${m.hours}시간치 혼` : '', m.decor && Decor.D(m.decor) ? `🏮 ${Decor.D(m.decor).name}` : ''].filter(Boolean);
  function claimMail(m) {
    const s = S(); s.mailGot = s.mailGot || {}; if (s.mailGot[m.id] || !mailFor(m)) return false; s.mailGot[m.id] = Date.now();
    if (m.jade) s.jade += +m.jade; if (m.souls) Game.gain(+m.souls); if (m.tickets) s.tickets = (s.tickets || 0) + (+m.tickets); if (m.hours) Game.gain(Game.incomePerSec(true) * 3600 * m.hours);
    if (m.decor && Decor.D(m.decor)) { const dc = Decor.ensure(); dc.own[m.decor] = (dc.own[m.decor] || 0) + 1; }
    Game.save(); return true;
  }
  async function mailModal() {
    const admin = Board.online() && await Board.checkOwner();
    if (!Board.canMail()) { modal(`<h2>📮 우편함</h2><p>운영자 우편은 로그인하면 받을 수 있어요.<br><span class="mute">까치 우편은 마을의 까치를 눌러 받아요.</span></p><div class="acts">${loginBtn()}<button class="btn dark" data-act="close">닫기</button></div>`); bindLogin(); return; }
    let raw = []; try { raw = mailCache = await Board.mails(); } catch (e) { raw = mailCache || []; }
    // 운영자는 모든 우편을 보고(받는 사람 표시) 지울 수 있음. 받기는 대상일 때만
    const list = admin ? raw : myMails(raw), gotM = S().mailGot || {}, left = list.filter(m => !gotM[m.id] && mailFor(m));
    const box = modal(`<h2>📮 우편함</h2><div class="ml-list">${list.length ? list.map(m => `<div class="ml-row ${gotM[m.id] ? 'got' : ''}"><div class="ml-i"><b>${!gotM[m.id] && mailFor(m) ? '<span class="new-tag">N</span>' : ''}${esc(m.title)}</b><small>${fmtDate(m.at)}${m.until ? ` · ${fmtDate(m.until)}까지` : ''}${admin && m.to && m.to !== 'all' ? ` · 👥 ${MAIL_TO[m.to] || m.to}${m.to === 'user' && m.nicks ? ` (${esc(m.nicks.join(', '))})` : ''}` : ''}</small>${m.body ? `<p>${esc(m.body)}</p>` : ''}<div class="ml-r">${rewardChips(m).map(c => `<span>${c}</span>`).join('')}</div></div>${gotM[m.id] ? '<button class="btn dark" disabled>받음</button>' : mailFor(m) ? `<button class="btn red" data-mg="${esc(m.id)}">받기</button>` : '<button class="btn dark" disabled>대상 아님</button>'}${admin ? `<button class="nt-del" data-mdel="${esc(m.id)}">삭제</button>` : ''}</div>`).join('') : '<div class="rkload">받은 우편이 없어요</div>'}</div>
      ${admin ? '<button class="btn" id="ml-send">📤 우편 보내기 (운영자)</button>' : ''}
      <div class="acts">${left.length > 1 ? '<button class="btn red" id="ml-all">모두 받기</button>' : ''}<button class="btn dark" data-act="close">닫기</button></div>`);
    const done = n => { Sound.play('promote'); closeModal(); render(); refreshMail(); got(`우편 ${n}통을 받았어요!`, { emo: '📮', then: mailModal }); };
    box.querySelectorAll('[data-mg]').forEach(b => b.onclick = () => { const m = list.find(x => x.id === b.dataset.mg); if (m && claimMail(m)) done(1); });
    const all = box.querySelector('#ml-all'); if (all) all.onclick = () => { let n = 0; left.forEach(m => { if (claimMail(m)) n++; }); done(n); };
    const sd = box.querySelector('#ml-send'); if (sd) sd.onclick = () => { closeModal(); adminMail(); };
    box.querySelectorAll('[data-mdel]').forEach(b => b.onclick = () => { const id = b.dataset.mdel; closeModal(); confirmBox('<h2>우편 삭제</h2><p>이 우편을 삭제할까요?<br><span class="mute">이미 받은 사람의 보상은 그대로예요</span></p>', async () => { try { await Board.delMail(id); toast('우편을 삭제했어요'); } catch (e) { toast('삭제하지 못했어요'); } mailModal(); }, '삭제'); });
  }
  function adminMail() {
    const opts = DECOR.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    const box = modal(`<h2>📤 우편 보내기</h2><p class="mute">받는 사람마다 한 번씩 받을 수 있어요</p>
      <div class="ad-form"><label class="ad-full">👥 받는 사람<select id="am-to">${Object.entries(MAIL_TO).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <input id="am-nicks" maxlength="200" placeholder="닉네임 (여러 명은 쉼표로: 갓주, 차사왕)" style="display:none">
        <p class="mute" id="am-hint" style="font-size:11px;margin:0"></p>
        <input id="am-title" maxlength="40" placeholder="제목 (예: 점검 보상)"><textarea id="am-body" maxlength="300" rows="3" placeholder="내용 (선택)"></textarea>
        <div class="ad-grid"><label>💎 옥<input type="number" id="am-jade" min="0" value="0"></label><label>🎫 소환권<input type="number" id="am-tk" min="0" value="0"></label><label>🔥 혼(시간치)<input type="number" id="am-hr" min="0" value="0"></label><label>⏳ 받을 기간(일)<input type="number" id="am-days" min="1" value="7"></label></div>
        <label class="ad-full">🏮 꾸미기 소품<select id="am-decor"><option value="">(없음)</option>${opts}</select></label></div>
      <div class="acts"><button class="btn red" id="am-ok">보내기</button><button class="btn dark" data-act="close">취소</button></div>`);
    const HINT = { all: '지금 하는 사람 + 받을 기간 안에 새로 시작하는 사람 모두', old: '보내는 지금 이미 게임을 하고 있던 사람 (오픈 기념 · 점검 보상)', new: '보낸 뒤 받을 기간 안에 새로 시작하는 사람 (신규 환영 선물)', online: '보내는 순간 게임을 켜 두고 있던 사람 (깜짝 선물)', user: '닉네임으로 찾아서 그 사람에게만 (문의 보상 · 이벤트 당첨)' };
    const toSel = box.querySelector('#am-to'), syncTo = () => { box.querySelector('#am-nicks').style.display = toSel.value === 'user' ? '' : 'none'; box.querySelector('#am-hint').textContent = HINT[toSel.value]; };
    toSel.onchange = syncTo; syncTo();
    box.querySelector('#am-ok').onclick = async () => {
      const v = q => box.querySelector(q).value, m = { title: v('#am-title').trim(), body: v('#am-body').trim(), jade: Math.max(0, +v('#am-jade') | 0), tickets: Math.max(0, +v('#am-tk') | 0), hours: Math.max(0, +v('#am-hr') || 0), decor: v('#am-decor') || '', until: Date.now() + Math.max(1, +v('#am-days') | 0) * 864e5 };
      if (!m.title) { toast('제목을 입력해 주세요'); return; } if (!m.jade && !m.tickets && !m.hours && !m.decor) { toast('보낼 보상을 하나 이상 넣어 주세요'); return; }
      m.to = toSel.value;
      if (m.to === 'user') {
        const nicks = [...new Set(v('#am-nicks').split(',').map(x => x.trim()).filter(Boolean))]; if (!nicks.length) { toast('받을 사람 닉네임을 입력해 주세요'); return; }
        const r = await Board.uidsByNick(nicks); if (r.missing.length) { toast(`닉네임을 찾지 못했어요: ${esc(r.missing.join(', '))}`, 4000); return; }
        m.uids = r.ids; m.nicks = nicks;
      }
      // (브라우저 confirm 창은 claude.ai 화면 안에서 막혀 있어서 게임 안 확인 창을 씀)
      closeModal();
      confirmBox(`<h2>📤 전체 우편 보내기</h2><p><b>${esc(m.title)}</b><br><b>${esc(m.to === 'user' ? m.nicks.join(', ') : MAIL_TO[m.to])}</b>에게 보낼까요?</p><div class="ml-r" style="justify-content:center">${rewardChips(m).map(c => `<span>${c}</span>`).join('')}</div>`, async () => {
        try { await Board.sendMail(m); Sound.play('promote'); toast('📮 우편을 보냈어요!', 3000); refreshMail(); mailModal(); }
        catch (e) { toast(`보내지 못했어요: ${esc(e && (e.message || e.code) || '알 수 없는 오류')}`, 4000); }
      }, '보내기'); };
  }

  // ---------- 순위 ----------
  const TIER = { 1: { name: '저승 제일 차사', icon: '👑', col: '#ffd34a' }, 2: { name: '명예의 차사', icon: '🥈', col: '#dfe8ff' }, 3: { name: '이름난 차사', icon: '🥉', col: '#ffb070' } };
  const RANK_MIN_PLAYERS = 5;
  const rankFxOk = () => S().nickSet && Board.total() >= RANK_MIN_PLAYERS && S().rank >= 1; // 혼자거나 막 시작했으면 순위 이펙트 없음
  function applyPlace(p) {
    if (!rankFxOk()) { Scene.setRankFx(0); const c = $('#rk-chip'); c.className = 'rkchip'; c.innerHTML = ''; return; }
    const t = Board.tierOf(p), chip = $('#rk-chip');
    Scene.setRankFx(t);
    chip.className = 'rkchip' + (t ? ' t' + t : ''); chip.innerHTML = p ? `${t ? TIER[t].icon : '🏆'} ${p}위` : '';
    const best = S().rkBest || 0; // 지금까지 본 가장 높은 구간 (작을수록 높음)
    if (t && (!best || t < best)) { S().rkBest = t; Game.save(); setTimeout(() => rankUp(p, t), 800); }
    else if (!t && best) { S().rkBest = 0; Game.save(); }
  }
  function rankUp(p, t) {
    if ($('#promo').classList.contains('on')) { setTimeout(() => rankUp(p, t), 2000); return; }
    const T = TIER[t], cols = t === 1 ? ['#ffd34a', '#ffffff', '#ff8a5a', '#7ad0ff', '#ff6ad0'] : t === 2 ? ['#dfe8ff', '#ffffff', '#9ab0ff'] : ['#ffb070', '#ffe0b0', '#e0904a'];
    Sound.play('promote');
    const o = overlay(`<div class="pr-bg rk-bg t${t}"></div>${t === 1 ? '<div class="pr-rays"></div>' : ''}<div class="pr-sparks">${sparks(t === 1 ? 60 : t === 2 ? 36 : 20, cols)}</div>
      <div class="pr-box rk-up t${t}"><div class="rk-medal">${T.icon}</div><div class="pr-title" style="color:${T.col}">${t === 1 ? '저승 1위!' : p + '위 달성!'}</div>
        <div class="pr-char"><canvas id="rk-me" width="44" height="51"></canvas></div>
        <div class="pr-rank" style="color:${T.col}">${T.name}</div>
        <div class="pr-info">${t === 1 ? '저승의 모든 차사 위에 섰어요!<br>머리 위에 <b>황금 왕관</b>과 무지개 기운이 생겨요' : t === 2 ? '명예의 전당 상위 5위!<br>머리 위에 <b>은관</b>과 은빛 기운이 생겨요' : '명예의 전당 상위 10위!<br>머리 위에 <b>동별</b>과 동빛 기운이 생겨요'}<br><span>순위가 내려가면 이펙트도 사라져요</span></div>
        <button class="btn red" id="rk-go">계속 근무</button></div>`);
    previews.push({ c: o.querySelector('#rk-me'), kind: S().kind, rank: S().rank, pose: 'reap', keep: 1 });
    o.querySelector('#rk-go').onclick = () => { closeOverlay(); Sound.play('open'); };
  }
  const rankIcon = (kind, rank) => { const k = 'rk' + kind + rank; return urls[k] || (urls[k] = toURL(SP.tinyReaper(kind || 'm', rank || 0, 'down', 'idle', 0), 2)); };
  function rankRow(r, place, by) {
    const t = Board.tierOf(place); return `<div class="rkrow ${r.me ? 'me' : ''} ${t ? 'tier' + t : ''}" data-prof="${place || 0}"><span class="rkn">${place === 1 ? '👑' : place || '-'}</span><img class="px" src="${rankIcon(r.kind, r.rank)}"><div class="rki"><b>${esc(r.name)}${r.me && r.name !== '나' ? ' <em>나</em>' : ''}</b><small>${RANKS[Math.min(8, r.rank || 0)].name}${r.rb ? ` · 윤회 ${r.rb}` : ''}${r.pt != null && by !== 'pt' ? ` · ⏱ ${fmtPlay(r.pt)}` : ''}</small></div><span class="rklv">${by === 'pt' ? '⏱ ' + (r.pt != null ? fmtPlay(r.pt) : '-') : 'Lv.' + r.lv}</span>${r.id && !r.me ? `<button class="btn rk-visit" data-visit="${esc(r.id)}">🏘️</button>` : ''}</div>`;
  }
  // 실제 접속 시간 표기
  const fmtPlay = sec => { sec = sec || 0; const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? (m ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`; };
  // 차사 프로필: 저승사자 + 발밑 마법진 + 함께하는 영물(기운)
  function profileModal(r, place) {
    const R = RANKS[Math.min(8, r.rank || 0)], pet = r.pet ? PETS.find(p => p.id === r.pet) : null;
    const row = (k, v) => `<div class="st-row"><span>${k}</span><b>${v}</b></div>`;
    const box = modal(`<div class="pf"><canvas id="pf-cv" width="120" height="84"></canvas><h2>${esc(r.me ? (S().name || r.name) : r.name)}${r.me && (S().name || r.name) !== '나' ? ' <em>나</em>' : ''}</h2><span class="badge">${R.name}</span>
      <div class="pf-rows">${row('순위', place ? place + '위' : '-')}${row('레벨', 'Lv.' + (r.lv || 1))}${r.rb ? row('윤회', r.rb + '회') : ''}${row('플레이 시간', r.pt != null ? fmtPlay(r.pt) : '-')}${row('함께하는 영물', pet ? `${pet.name} ★${r.ps || 1} <small>(${pet.g})</small>` : '없음')}</div></div>
      <div class="acts">${r.id && !r.me ? `<button class="btn red" id="pf-visit">🏘️ 집무실 놀러 가기</button>` : ''}<button class="btn dark" data-act="close">닫기</button></div>`);
    previews.push({ c: box.querySelector('#pf-cv'), prof: { kind: r.kind || 'm', rank: r.rank || 0, pet, star: r.ps || 1 } });
    const v = box.querySelector('#pf-visit'); if (v) v.onclick = () => { closeModal(); visitOffice(r.id); };
  }
  // 닉네임 정하기 (순위·이웃 집무실에 보이는 이름)
  function nickModal(after) {
    const box = modal(`<h2>✍️ 닉네임 정하기</h2><p>순위표와 이웃 집무실에 보이는 이름이에요.<br><span class="mute">2~8자 · 다른 차사와 겹치지 않게</span></p>
      <div class="gb-write"><input id="nk-in" maxlength="8" placeholder="닉네임" value="${esc(S().nickSet ? S().name : '')}"><button class="btn red" id="nk-ok">정하기</button></div><p class="mute" id="nk-msg" style="font-size:11px;min-height:16px"></p>
      <div class="acts"><button class="btn dark" data-act="close">나중에</button></div>`);
    const msg = t => (box.querySelector('#nk-msg').textContent = t);
    box.querySelector('#nk-ok').onclick = async () => {
      const n = box.querySelector('#nk-in').value.trim().replace(/\s+/g, ' ');
      if (n.length < 2) return msg('2자 이상으로 지어 주세요');
      if (cleanText(n) !== n) return msg('쓸 수 없는 말이 들어 있어요');
      msg('확인하는 중…'); if (await Board.nickTaken(n)) return msg('이미 다른 차사가 쓰는 닉네임이에요');
      S().name = n; S().nickSet = true; Game.save(); Board.push(true); Board.pushOffice(); Sound.play('promote'); closeModal(); toast(`「${esc(n)}」(으)로 정했어요!`); after && after();
    };
  }
  const mineProf = () => { const s = S(); return { name: s.nickSet ? s.name : '나', kind: s.kind, rank: s.rank, rb: s.reborn || 0, lv: Game.level(), me: true, pet: s.petEq && s.pets && s.pets[s.petEq] ? s.petEq : '', ps: s.petEq && s.pets ? s.pets[s.petEq] || 1 : 1, pt: s.playSec || 0 }; };
  async function rankModal(by) {
    by = by === 'pt' ? 'pt' : 'lv';
    if (Board.online() && !S().nickSet) { nickModal(() => rankModal(by)); return; }
    const s = S(), mine = mineProf();
    const box = modal(`<h2>🏆 저승 명예의 전당</h2><div class="subtabs rk-tabs"><button data-rkby="lv" class="${by === 'lv' ? 'on' : ''}">레벨 순위</button><button data-rkby="pt" class="${by === 'pt' ? 'on' : ''}">플레이 시간</button></div><p class="mute">${by === 'pt' ? '게임을 실제로 켜 둔 시간 순위예요' : '레벨 순위 · 윤회한 차사가 먼저예요'}</p><div class="rklist" id="rk-list"><div class="rkload">순위를 불러오는 중…</div></div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-rkby]').forEach(b => b.onclick = () => { if (b.dataset.rkby === by) return; Sound.play('open'); closeModal(); rankModal(b.dataset.rkby); });
    const L = box.querySelector('#rk-list');
    if (!Board.online()) { setTimeout(() => { bindLogin(); L.querySelectorAll('[data-prof]').forEach(el => el.addEventListener('click', () => { Sound.play('open'); profileModal(mineProf(), 0); })); }, 0); L.innerHTML = rankRow(mine, 0, by) + `<p class="note">로그인하면 다른 차사들과 순위를 겨룰 수 있어요. 지금은 내 기록만 보여요.</p>${Cloud.ready() ? `<div class="acts">${loginBtn()}</div>` : ''}`; return; }
    try {
      const r = await Board.top(by); if (!document.body.contains(L)) return;
      if (!r || !r.rows.length) { L.innerHTML = '<div class="rkload">아직 순위에 오른 차사가 없어요</div>'; return; }
      L.innerHTML = r.rows.map((x, i) => rankRow(x, i + 1, by)).join('') + (r.rows.some(x => x.me) ? '' : `<div class="rkgap">⋯</div>${rankRow(mine, r.my, by)}`);
      L.querySelectorAll('[data-prof]').forEach(el => el.addEventListener('click', e => { if (e.target.closest('[data-visit]')) return; const k = +el.dataset.prof, x = k >= 1 && k <= r.rows.length ? r.rows[k - 1] : mine; Sound.play('open'); profileModal(x.me ? Object.assign({}, mineProf(), { id: x.id }) : x, k); }));
      box.querySelector('.rk-tabs').insertAdjacentHTML('afterend', `<div class="rkmy">내 순위 <b>${r.my ? r.my + '위' : '50위 밖'}</b></div>`);
      L.querySelectorAll('[data-visit]').forEach(b => b.onclick = () => { closeModal(); visitOffice(b.dataset.visit); });
    } catch (e) { if (document.body.contains(L)) L.innerHTML = rankRow(mine, 0, by) + '<p class="note">순위를 불러오지 못했어요. 잠시 뒤 다시 열어 보세요.</p>'; }
  }
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ---------- 집무실 놀러 가기 ----------
  let visiting = null;
  const GB_PHRASES = ['멋진 집무실이네요! ✨', '품격이 남다르시네요 🏮', '의자가 너무 탐나요 🪑', '자주 놀러 올게요!', '결재 서류 대신 들고 왔어요 📜', '부하들이 참 부지런하네요', '염라대왕 되실 상이에요 👑', '꽃이 참 예뻐요 🌸', '차 한잔 마시고 갑니다 🍵', '다음 백귀야행 같이 해요 👻', '저승 최고의 집무실!', '구경 잘하고 갑니다 🙇'];
  // 방명록 비속어 가리기 (간단 목록)
  const BAD = ['시발', '씨발', '씨빨', '시바', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', 'ㅈㄴ', '지랄', 'ㅈㄹ', '미친놈', '미친년', '꺼져', '닥쳐', '엿먹', 'fuck', 'shit', 'bitch'];
  const cleanText = t => BAD.reduce((a, w) => a.split(w).join('♡'.repeat(Math.min(3, w.length))), String(t).replace(/[<>]/g, '')).slice(0, 40);
  const ago = t => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.floor(m / 60) + '시간 전' : Math.floor(m / 1440) + '일 전'; };
  let nbTab = 'recent';
  async function neighborsModal(tabArg) {
    if (tabArg) nbTab = tabArg;
    if (Board.online() && !S().nickSet) { nickModal(() => neighborsModal()); return; }
    if (!Board.online()) { modal(`<h2>🏘️ 이웃 집무실</h2><p>다른 차사의 집무실은 <b>로그인</b>하면 놀러 갈 수 있어요.<br><span class="mute">지금은 이 기기에만 저장 중이라 이웃이 없어요.</span></p><div class="acts">${loginBtn()}<button class="btn dark" data-act="close">닫기</button></div>`); bindLogin(); return; }
    const box = modal(`<h2>🏘️ 이웃 집무실</h2><button class="btn red nb-rand" id="nb-rand">🎲 랜덤으로 놀러 가기</button>
      <div class="ds-cats"><button data-nbt="recent" class="${nbTab === 'recent' ? 'on' : ''}">최근 꾸민 곳</button><button data-nbt="pop" class="${nbTab === 'pop' ? 'on' : ''}">🏆 인기 순위</button><button data-nbt="friends" class="${nbTab === 'friends' ? 'on' : ''}">👥 내 이웃</button></div>
      <p class="mute" style="font-size:10px">하루 3곳까지 처음 놀러 가면 옥 +5 (오늘 ${visitR().ids.length}/3)</p><div class="rklist" id="nb-list"><div class="rkload">불러오는 중…</div></div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-nbt]').forEach(b => b.onclick = () => { closeModal(); neighborsModal(b.dataset.nbt); });
    box.querySelector('#nb-rand').onclick = () => { closeModal(); randomVisit(); };
    const L = box.querySelector('#nb-list');
    try {
      const fr = await Board.friends();
      const rows = nbTab === 'friends' ? await Board.officesByIds(fr) : await Board.offices(nbTab === 'pop'); if (!document.body.contains(L)) return;
      if (!rows || !rows.length) { L.innerHTML = `<div class="rkload">${nbTab === 'friends' ? '아직 이웃이 없어요. 놀러 간 집무실에서 ➕ 이웃 추가를 눌러 보세요' : '아직 공개된 집무실이 없어요'}</div>`; return; }
      const list = nbTab === 'pop' ? rows : rows;
      L.innerHTML = list.map((r, i) => { const t = nbTab === 'pop' ? Board.tierOf(i + 1) : 0, fd = fr.includes(r.id); return `<div class="rkrow ${r.me ? 'me' : ''} ${t ? 'tier' + t : ''}">${nbTab === 'pop' ? `<span class="rkn">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>` : ''}<img class="px" src="${rankIcon(r.kind, r.rank)}"><div class="rki"><b>${esc(r.name)}${r.me && r.name !== '나' ? ' <em>나</em>' : ''}${fd ? ' 👥' : ''}</b><small>${Scene.officeName(r.rank)} · 품격 ${r.score || 0}</small></div><span class="nb-like">👍 ${r.likes || 0}</span>${r.me ? '' : `<button class="btn" data-visit="${esc(r.id)}">놀러 가기</button>`}</div>`; }).join('');
      L.querySelectorAll('[data-visit]').forEach(b => b.onclick = () => { closeModal(); visitOffice(b.dataset.visit); });
    } catch (e) { if (document.body.contains(L)) L.innerHTML = '<div class="rkload">불러오지 못했어요. 잠시 뒤 다시 열어 보세요.</div>'; }
  }
  async function randomVisit() {
    let rows = []; try { rows = (await Board.offices(false)) || []; } catch (e) {}
    const cand = rows.filter(r => !r.me && (!visiting || r.id !== visiting.id));
    if (!cand.length) { toast('놀러 갈 집무실이 아직 없어요'); return; }
    visitOffice(cand[Math.floor(Math.random() * cand.length)].id);
  }
  function visitR() { const d = new Date().toISOString().slice(0, 10); if (!S().visitR || S().visitR.day !== d) S().visitR = { day: d, ids: [] }; return S().visitR; }
  async function visitOffice(id) {
    toast('🏘️ 집무실로 가는 중…', 1200);
    let o = null; try { o = await Board.office(id); } catch (e) {}
    if (!o) { toast('집무실을 찾지 못했어요'); return; }
    if (o.me) { if (!Scene.inOffice()) enterOffice(); return; }
    if (Scene.inOffice()) { decoEnd(true); Scene.exitOffice(); }
    visiting = o; Scene.enterOffice(o.rank, { kind: o.kind, rank: o.rank }); Sound.play('open');
    if (sheetOpen()) closeSheet();
    let bar = $('#office-bar'); if (!bar) { bar = document.createElement('div'); bar.id = 'office-bar'; $('#stage').appendChild(bar); }
    let acts = $('#office-acts'); if (!acts) { acts = document.createElement('div'); acts.id = 'office-acts'; $('#stage').appendChild(acts); }
    const isFr = (await Board.friends()).includes(o.id);
    bar.innerHTML = `<div class="of-top"><button class="btn dark" id="of-out">◀ 돌아가기</button><div><b>${esc(o.name)}의 ${Scene.officeName(o.rank)}</b><small>${RANKS[Math.min(8, o.rank)].name} · 품격 ${o.score || 0} · ${Decor.title(o.score || 0)}</small></div><button class="btn ${isFr ? 'dark' : ''} vs-fr" id="vs-fr">${isFr ? '👥 이웃' : '➕ 이웃 추가'}</button></div>`;
    acts.innerHTML = `<div class="of-acts v4"><button id="vs-like" class="${o.likedToday ? '' : 'hot'}"><span>👍</span>좋아요<i>${o.likes || 0}</i></button><button id="vs-gb"><span>📜</span>방명록<i>${o.notes.length}</i></button><button id="vs-rand"><span>🎲</span>랜덤 방문<i></i></button><button id="vs-nb"><span>🏘️</span>이웃 목록<i></i></button></div>`;
    bar.classList.add('on'); acts.classList.add('on'); $('#side').style.display = 'none'; $('#stage').classList.add('in-office'); document.body.classList.add('in-office-t');
    bar.querySelector('#of-out').onclick = exitOffice;
    $('#vs-like').onclick = async () => { if (!visiting) return; if (!S().nickSet) { nickModal(); return; } if (visiting.likedToday) { toast('오늘은 이미 좋아요를 눌렀어요. 내일 또 눌러 주세요'); return; } if (await Board.like(visiting.id)) { visiting.likedToday = true; if (!visiting.liked) { visiting.likes = (visiting.likes || 0) + 1; visiting.liked = true; } Sound.play('promote'); Scene.burstAt(innerWidth / 2, 200, '#ff8ab0', 24); toast(`👍 ${visiting.name}님의 집무실에 좋아요!`); const b = $('#vs-like'); b.classList.remove('hot'); b.querySelector('i').textContent = visiting.likes; } };
    $('#vs-gb').onclick = () => guestbookModal(visiting.id, false);
    $('#vs-nb').onclick = () => neighborsModal();
    $('#vs-rand').onclick = () => randomVisit();
    $('#vs-fr').onclick = async () => { const added = await Board.toggleFriend(o.id); const b = $('#vs-fr'); b.textContent = added ? '👥 이웃' : '➕ 이웃 추가'; b.classList.toggle('dark', added); Sound.play(added ? 'buy' : 'open'); toast(added ? `${esc(o.name)}님을 이웃으로 추가했어요! 이웃 목록에서 바로 놀러 갈 수 있어요` : '이웃에서 뺐어요'); };
    // 방문 보상: 하루 3곳까지 처음 놀러 간 집무실마다 옥 +5
    const R = visitR(); if (!R.ids.includes(o.id) && R.ids.length < 3) { R.ids.push(o.id); S().jade += 5; Game.save(); setTimeout(() => got(`🎁 방문 보상 옥 +5 (오늘 ${R.ids.length}/3)`, { ic: 'jade', soft: true }), 900); }
    else setTimeout(() => toast(`${esc(o.name)}님의 집무실에 놀러 왔어요! 빈 의자에 앉아 볼 수 있어요`, 2600), 900);
  }
  // 방명록: 내 글은 고치기 · 지우기, 남의 글은 신고 · 차단 (구글 플레이 · 앱스토어 사용자 콘텐츠 정책)
  async function gbReload(id) { const notes = await Board.guestbook(id); if (visiting && visiting.id === id) { visiting.notes = notes; const g = $('#vs-gb i'); if (g) g.textContent = notes.length; } return notes; }
  async function guestbookModal(id, mine, editing) {
    const notes = visiting && visiting.id === id ? visiting.notes : await Board.guestbook(id);
    const myNote = notes.find(n => n.me), canAct = Board.online();
    const rowActs = (n, i) => !canAct ? '' : n.me ? `<i class="gb-act"><button data-gb-edit title="고치기">✏️</button><button data-gb-del title="지우기">🗑</button></i>` : `<i class="gb-act">${mine ? `<button data-gb-odel="${i}" title="지우기">🗑</button>` : ''}<button data-gb-rep="${i}" title="신고">🚩</button><button data-gb-blk="${i}" title="차단">🚫</button></i>`;
    const box = modal(`<h2>📜 방명록</h2>${mine ? `<p class="mute">내 집무실이 받은 좋아요 <b style="color:var(--gold)">👍 ${S().officeLikes || 0}</b></p>` : ''}
      <div class="gb-list">${notes.length ? notes.map((n, i) => `<div class="gb-row ${n.me ? 'me' : ''}"><b>${esc(n.name)}</b><span>${esc(n.t != null ? n.t : (GB_PHRASES[n.m] || ''))}</span><small>${ago(n.at)}${n.ed ? ' · 수정됨' : ''}</small>${rowActs(n, i)}</div>`).join('') : '<div class="rkload">아직 방명록이 비어 있어요</div>'}</div>
      ${mine ? '' : `<div class="sec" style="margin-top:8px">${editing ? '내 방명록 고치기' : myNote ? '한마디 남기기 (남기면 내 글이 바뀌어요)' : '한마디 남기기'}</div><div class="gb-write"><input id="gb-in" maxlength="40" placeholder="방명록을 남겨 주세요 (40자)"><button class="btn red" id="gb-send">${editing ? '고치기' : '남기기'}</button></div><div class="gb-pick">${GB_PHRASES.map((t, i) => `<button data-gb="${i}">${t}</button>`).join('')}</div>`}
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    const inp = box.querySelector('#gb-in');
    if (inp && editing && myNote) { inp.value = myNote.t != null ? myNote.t : (GB_PHRASES[myNote.m] || ''); setTimeout(() => inp.focus(), 50); }
    box.querySelectorAll('[data-gb]').forEach(b => b.onclick = () => { inp.value = GB_PHRASES[+b.dataset.gb]; inp.focus(); });
    const send = box.querySelector('#gb-send'); if (send) send.onclick = async () => {
      if (!S().nickSet) { closeModal(); nickModal(() => guestbookModal(id, mine)); return; }
      const raw = inp.value.trim(); if (!raw) { toast('내용을 입력해 주세요'); return; }
      const r = await Board.note(id, cleanText(raw));
      if (r === 'blocked') { toast('이 집무실에는 방명록을 남길 수 없어요'); return; }
      Sound.play('buy'); toast(editing || myNote ? '방명록을 고쳤어요 ✍️' : '방명록을 남겼어요 ✍️'); await gbReload(id); closeModal(); guestbookModal(id, false);
    };
    const ed = box.querySelector('[data-gb-edit]'); if (ed) ed.onclick = () => { closeModal(); guestbookModal(id, mine, true); };
    const del = box.querySelector('[data-gb-del]'); if (del) del.onclick = () => { closeModal(); confirmBox('<h2>🗑 방명록 지우기</h2><p>내가 남긴 방명록을 지울까요?</p>', async () => { await Board.delNote(id); toast('방명록을 지웠어요'); await gbReload(id); guestbookModal(id, mine); }, '지우기'); };
    box.querySelectorAll('[data-gb-blk]').forEach(b => b.onclick = () => { const n = notes[+b.dataset.gbBlk]; closeModal();
      confirmBox(`<h2>🚫 차단</h2><p><b>${esc(n.name)}</b> 님을 차단할까요?<br><small class="mute">이 사람의 방명록이 보이지 않고, 내 집무실에 방명록을 남길 수 없어요. 설정에서 풀 수 있어요.</small></p>`, async () => { await Board.block(n.by); toast('차단했어요'); await gbReload(id); guestbookModal(id, mine); }, '차단'); });
    box.querySelectorAll('[data-gb-odel]').forEach(b => b.onclick = () => { const n = notes[+b.dataset.gbOdel]; closeModal();
      confirmBox(`<h2>🗑 방명록 지우기</h2><p><b>${esc(n.name)}</b> 님의 방명록을 내 집무실에서 지울까요?</p>`, async () => { await Board.ownerDel(n.by, n.at); toast('방명록을 지웠어요'); await gbReload(id); guestbookModal(id, mine); }, '지우기'); });
    box.querySelectorAll('[data-gb-rep]').forEach(b => b.onclick = () => { const n = notes[+b.dataset.gbRep]; closeModal(); reportModal(n, id, mine); });
  }
  const REPORT_WHY = ['욕설 · 비방', '음란 · 불쾌한 내용', '광고 · 도배', '개인정보 노출', '기타'];
  function reportModal(n, id, mine) {
    const box = modal(`<h2>🚩 신고</h2><p><b>${esc(n.name)}</b>: ${esc(n.t != null ? n.t : (GB_PHRASES[n.m] || ''))}</p><p class="mute">신고 이유를 골라 주세요. 운영자가 확인한 뒤 조치해요.</p>
      <div class="rep-list">${REPORT_WHY.map((w, i) => `<button class="btn dark" data-why="${i}">${w}</button>`).join('')}</div><div class="acts"><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelectorAll('[data-why]').forEach(b => b.onclick = async () => { closeModal(); await Board.report(n, id, REPORT_WHY[+b.dataset.why]); toast('신고했어요. 운영자가 확인할게요 🙏', 2600); await gbReload(id); guestbookModal(id, mine); });
  }

  // ---------- 집무실 꾸미기 ----------
  let decoSel = null, decoMove = null;
  const decoThumb = (id, sc = 2) => { const k = 'dc' + id + sc; return urls[k] || (urls[k] = toURL(Decor.img(id), sc)); };
  function decoStart() {
    if (visiting) return;
    if (!Scene.inOffice()) enterOffice();
    if (sheetOpen()) closeSheet();
    Scene.officeEdit(true); decoSel = null; decoMove = null;
    let db = $('#deco-bar'); if (!db) { db = document.createElement('div'); db.id = 'deco-bar'; $('#stage').appendChild(db); }
    let inv = $('#deco-inv'); if (!inv) { inv = document.createElement('div'); inv.id = 'deco-inv'; $('#stage').appendChild(inv); } inv.classList.add('on'); inv.classList.remove('min');
    db.classList.add('on'); $('#office-bar').classList.add('editing'); $('#stage').classList.add('deco-edit'); document.body.classList.add('deco-t'); decoBar();
  }
  function decoEnd(silent) { const db = $('#deco-bar'); if (!db || !db.classList.contains('on')) return; db.classList.remove('on'); $('#deco-inv') && $('#deco-inv').classList.remove('on'); closePendPop(); $('#office-bar') && $('#office-bar').classList.remove('editing'); $('#stage').classList.remove('deco-edit'); document.body.classList.remove('deco-t'); Scene.officeEdit(false); decoSel = null; decoMove = null; Board.pushOffice(); if (!silent) { Sound.play('buy'); toast(`꾸미기 완료! 품격 ${Decor.score()} · ${Decor.title(Decor.score())} (수확량 +${Math.round((Decor.mul() - 1) * 100)}%)`, 3000); } officeBar(); }
  let invCat = 'all', invPos = null;
  try { invPos = JSON.parse(localStorage.getItem('jeoseung_invpos') || 'null'); } catch (e) {}
  function invPlace(inv) { const st = $('#stage').getBoundingClientRect(), bar = $('#deco-bar'), barH = bar && bar.classList.contains('on') ? bar.offsetHeight : 0, pos = invPos || { x: 8, y: 8 }, w = inv.offsetWidth; const top = Math.max(0, Math.min(st.height - barH - 70, pos.y)); inv.style.left = Math.max(0, Math.min(st.width - w, pos.x)) + 'px'; inv.style.top = top + 'px'; inv.style.maxHeight = Math.max(70, Math.min(st.height * 0.32, st.height - barH - top - 8)) + 'px'; }
  // 보관함 창: 제목 줄을 잡고 끌면 어디로든 옮겨진다
  function invDragInit(inv) {
    invPlace(inv);
    const hd = inv.querySelector('.iv-head'); if (!hd) return;
    hd.onpointerdown = e => { if (e.target.closest('button')) return; const st = $('#stage').getBoundingClientRect(), r = inv.getBoundingClientRect(), d = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      hd.setPointerCapture && hd.setPointerCapture(e.pointerId); inv.classList.add('moving');
      hd.onpointermove = ev => { invPos = { x: ev.clientX - st.left - d.dx, y: ev.clientY - st.top - d.dy }; invPlace(inv); };
      hd.onpointerup = hd.onpointercancel = () => { hd.onpointermove = null; hd.onpointerup = null; inv.classList.remove('moving'); try { localStorage.setItem('jeoseung_invpos', JSON.stringify(invPos)); } catch (e2) {} }; };
  }
  let invCatInit = 0;
  const INV_CATS = [['all', '전체'], ['floor', '바닥'], ['wall', '벽'], ['chair', '의자'], ['plant', '화초'], ['ex', '한정']];
  const invMatch = (d, c) => c === 'all' || (c === 'floor' && !d.wall && !d.seat) || (c === 'wall' && d.wall) || (c === 'chair' && d.seat) || (c === 'plant' && /화분|분재|난초|연꽃|매화|대나무|피안화/.test(d.name)) || (c === 'ex' && (Decor.isEx(d) || d.cash));
  function decoBar() {
    const db = $('#deco-bar'), inv = $('#deco-inv'); if (!db) return;
    const own = DECOR.filter(d => Decor.owned(d.id) > 0), dc = Decor.ensure(), sc = Decor.score();
    db.innerHTML = `<div class="dk-top"><div><b>🏮 ${Decor.title(sc)}</b><small>품격 ${sc} · 수확량 +${Math.round((Decor.mul() - 1) * 100)}% · 배치 ${dc.placed.length}개</small></div><button class="btn jade" id="dk-shop">상점</button><button class="btn red" id="dk-done">완료</button></div>
      <div class="dk-tip">${decoSel ? `<b>${Decor.D(decoSel).name}</b>을(를) 놓을 자리를 누르세요 ${decoMove ? '' : '· <a id="dk-cancel">취소</a>'}` : '<b>보관함</b>에서 소품을 끌어내거나 눌러서 꺼내고, 끌어서 자리를 고른 뒤 <b>한 번 더 눌러</b> 확인해요 · 책상 뒤 <b style="color:#9fd6ff">파란 칸</b>은 의자 자리'}</div>`;
    db.querySelector('#dk-done').onclick = () => decoEnd();
    db.querySelector('#dk-shop').onclick = decoShop;
    const cn = db.querySelector('#dk-cancel'); if (cn) cn.onclick = () => { decoSel = null; Scene.officeGhost(null); decoBar(); };
    if (!inv) return;
    const keep = inv.querySelector('.iv-grid') ? inv.querySelector('.iv-grid').scrollTop : 0, list = own.filter(d => invMatch(d, invCat));
    inv.innerHTML = `<div class="iv-head"><span class="iv-grip">⠿</span><b>📦 보관함</b><small>${own.length}종</small><button id="iv-min">${inv.classList.contains('min') ? '▼' : '▲'}</button></div>
      <div class="iv-cats">${INV_CATS.map(([k, n]) => `<button data-ivc="${k}" class="${invCat === k ? 'on' : ''}">${n}<i>${own.filter(d => invMatch(d, k)).length}</i></button>`).join('')}</div>
      <div class="iv-grid">${list.length ? list.map(d => { const sp = Decor.spare(d.id); return `<button class="dk-it ${decoSel === d.id ? 'on' : ''} ${sp ? '' : 'used'}" data-dk="${d.id}" title="${d.name}"><img class="px" src="${decoThumb(d.id)}"><span>${d.name}</span><small>${sp ? '×' + sp : '배치됨'}</small></button>`; }).join('') : '<p class="mute">이 분류의 소품이 없어요</p>'}</div>`;
    const gr = inv.querySelector('.iv-grid'); if (gr) gr.scrollTop = keep;
    inv.querySelector('#iv-min').onclick = () => { inv.classList.toggle('min'); decoBar(); };
    invDragInit(inv);
    inv.querySelectorAll('[data-ivc]').forEach(b => b.onclick = () => { invCat = b.dataset.ivc; inv.querySelector('.iv-grid') && (inv.querySelector('.iv-grid').scrollTop = 0); decoBar(); const g2 = inv.querySelector('.iv-grid'); if (g2) g2.scrollTop = 0; });
    listDragInit(inv);
    inv.querySelectorAll('[data-dk]').forEach(b => b.onclick = () => {
      if (performance.now() - listDragDone < 300) return;
      const id = b.dataset.dk; if (Decor.spare(id) <= 0) { toast('모두 놓았어요. 놓인 소품을 눌러 옮기거나 보관할 수 있어요'); return; }
      if (Scene.officePendInfo()) { toast('먼저 놓을지 정해 주세요 (소품을 한 번 눌러 확인)'); return; }
      const sp = Scene.officeFreeSpot(id); Scene.officePend(id, sp.gx, sp.gy, null); Sound.play('open'); pendHint();
    });
  }
  function decorTap(gx, gy, ok) {
    if (!decoSel) return;
    if (!ok) { Sound.play('no'); toast('여기엔 놓을 수 없어요 (빨간 칸·다른 소품과 겹침)'); return; }
    if (Decor.place(decoSel, gx, gy)) { Sound.play('buy'); Scene.burstAt(gx * DECOR_G * Scene.scale + DECOR_G, gy * DECOR_G * Scene.scale, '#ffe08a', 12); if (Decor.spare(decoSel) <= 0 || decoMove) { decoSel = null; decoMove = null; Scene.officeGhost(null); } decoBar(); officeBar(); }
  }
  // ---- 놓기 확인: 끌어서 자리 고르기 → 한 번 더 누르면 [놓기][취소] ----
  const invDim = on => { const i = $('#deco-inv'); if (i) i.classList.toggle('dim', on); };
  function pendHint() { closePendPop(); invDim(true); const t = $('#deco-bar .dk-tip'); if (t) t.innerHTML = '끌어서 자리를 고른 뒤 <b>소품을 한 번 더 누르면</b> 놓기·취소 버튼이 나와요'; }
  function closePendPop() { const p = $('#pend-pop'); if (p) p.remove(); }
  function pendMoved(done) { closePendPop(); invDim(true); }
  function pendTap() {
    const P = Scene.officePendInfo(); if (!P) return; closePendPop();
    const pop = document.createElement('div'); pop.id = 'pend-pop';
    pop.innerHTML = `<button class="btn" id="pp-ok" ${P.ok ? '' : 'disabled'}>✔ ${P.from == null ? '놓기' : '옮기기'}</button><button class="btn dark" id="pp-no">✕ 취소</button>${P.ok ? '' : '<small>여기엔 놓을 수 없어요</small>'}`;
    document.body.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight, above = P.top - h - 8 > 60;
    pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, P.x - w / 2)) + 'px'; pop.style.top = (above ? P.top - h - 8 : P.bottom + 8) + 'px';
    pop.querySelector('#pp-ok').onclick = () => { const Q = Scene.officePendInfo(); if (!Q || !Q.ok) return; if (Q.from == null) { if (!Decor.place(Q.id, Q.gx, Q.gy)) { toast('놓을 수 없어요'); return; } } else { const p = Decor.ensure().placed[Q.from]; p.gx = Q.gx; p.gy = Q.gy; Game.apply(); Game.save(); } Scene.officePendClear(); closePendPop(); invDim(false); Sound.play('buy'); decoBar(); officeBar(); };
    pop.querySelector('#pp-no').onclick = () => { Scene.officePendClear(); closePendPop(); invDim(false); Sound.play('open'); decoBar(); };
  }
  function decorDrop(i, gx, gy, ok) {
    if (!ok) { Sound.play('no'); toast('여기엔 놓을 수 없어요'); return; }
    const p = Decor.ensure().placed[i]; if (!p) return; p.gx = gx; p.gy = gy; Game.save(); Sound.play('buy'); decoBar();
  }
  // 목록에서 끌어다 놓기
  let listDrag = null;
  function listDragInit(db) {
    db.querySelectorAll('[data-dk]').forEach(b => b.addEventListener('pointerdown', e => { listDrag = { id: b.dataset.dk, x0: e.clientX, y0: e.clientY, on: false }; }));
  }
  addEventListener('pointermove', e => {
    if (!listDrag) return;
    if (!listDrag.on) { const ir = $('#deco-inv') ? $('#deco-inv').getBoundingClientRect() : null, out = ir && (e.clientX > ir.right + 4 || e.clientY > ir.bottom + 4 || e.clientX < ir.left - 4); const dy = listDrag.y0 - e.clientY, dx = Math.abs(e.clientX - listDrag.x0); if (out || Math.hypot(dx, dy) > 12) { if (Decor.spare(listDrag.id) <= 0) { toast('모두 놓았어요'); listDrag = null; return; } if (Decor.ensure().placed.length >= Decor.maxPlace()) { toast(`지금 집무실엔 ${Decor.maxPlace()}개까지 놓을 수 있어요. 승진하면 더 놓을 수 있어요!`, 2800); listDrag = null; return; } listDrag.on = true; $('#deco-inv') && $('#deco-inv').classList.add('dragging'); const im = document.createElement('img'); im.id = 'dk-drag'; im.className = 'px'; im.src = decoThumb(listDrag.id, 4); document.body.appendChild(im); decoSel = null; } }
    if (listDrag && listDrag.on) { const im = $('#dk-drag'); if (im) { im.style.left = e.clientX + 'px'; im.style.top = e.clientY + 'px'; } const r = Scene.officeDragAt(e.clientX, e.clientY, listDrag.id); if (im) im.classList.toggle('over', !!r); }
  });
  addEventListener('pointerup', e => {
    if (!listDrag) return; const d = listDrag; listDrag = null; if (!d.on) { $('#deco-inv') && $('#deco-inv').classList.remove('dragging'); return; }
    const im = $('#dk-drag'); if (im) im.remove();
    const r = Scene.officeDragAt(e.clientX, e.clientY, d.id); $('#deco-inv') && $('#deco-inv').classList.remove('dragging'); Scene.officeDragEnd(); d.dropped = true; listDragDone = performance.now();
    if (!r) return; Scene.officePend(d.id, r.gx, r.gy, null); Sound.play('open'); pendHint();
  });
  let listDragDone = 0;
  addEventListener('pointercancel', () => { if (listDrag) { $('#deco-inv') && $('#deco-inv').classList.remove('dragging'); const im = $('#dk-drag'); if (im) im.remove(); Scene.officeDragEnd(); listDrag = null; } });
  function decorPick(i) {
    const p = Decor.ensure().placed[i]; if (!p) return; const d = Decor.D(p.id);
    const box = modal(`<div class="pinfo"><img class="px" src="${decoThumb(p.id, 4)}" style="height:72px"><h2>${d.name}</h2><p class="mute">품격 +${d.pt}${d.seat ? ' · 앉을 수 있어요' : ''}</p></div>
      <div class="acts"><button class="btn" id="dp-move">옮기기</button><button class="btn dark" id="dp-store">보관하기</button><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelector('#dp-move').onclick = () => { closeModal(); Scene.officePend(p.id, p.gx, p.gy, i); pendHint(); };
    box.querySelector('#dp-store').onclick = () => { closeModal(); Decor.remove(i); Sound.play('open'); decoBar(); officeBar(); };
  }
  let shopCat = 'all';
  function decoShop() {
    const s = S(), cats = [['all', '전체'], ['set', '세트'], ['floor', '바닥'], ['wall', '벽'], ['seat', '앉기'], ['chair', '의자'], ['premium', '귀한 것'], ['ex', '한정']];
    const how = d => d.rank != null ? (d.rank ? `${RANKS[d.rank].name} 승진` : '첫 출근 선물') : d.story != null ? `이야기 ${d.story + 1}장` : '의뢰 보상';
    const card = d => { const n = Decor.owned(d.id), ex = Decor.isEx(d); return `<div class="ds-card ${d.premium ? 'cash' : ''} ${ex ? 'ex' : ''}"><img class="px" src="${decoThumb(d.id, 3)}"><b>${d.name}</b><small>품격 +${d.pt}${d.seat ? ' · 앉기' : ''}${d.wall ? ' · 벽' : ''}</small><p>${d.desc}</p>${n ? `<em>보유 ${n}</em>` : ''}
      ${ex ? `<button class="btn dark" disabled>${n ? '획득 완료' : '🔒 ' + how(d)}</button>` : d.cash ? (s.rank >= d.rankReq ? `<button class="btn red" data-dcash="${d.id}">${priceOf('decor:' + d.id)}</button>` : `<button class="btn dark" disabled>🔒 ${RANKS[d.rankReq].name} 이상</button>`) : d.free ? '<button class="btn dark" disabled>무료 지급</button>' : `<button class="btn jade" data-dbuy="${d.id}" ${s.jade >= d.price ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${d.price}</button>`}</div>`; };
    const pack = P => { const got = Decor.packBought(P.id); return `<div class="ds-pack ${got ? 'got' : ''}"><div class="ds-pi">${P.items.map(id => `<img class="px" src="${decoThumb(id, 2)}">`).join('')}</div><div class="ds-pt"><b>${P.name}</b><small>${P.items.map(id => Decor.D(id).name).join(' · ')}</small><small><s>옥 ${P.full}</s> → <b class="sale">30% 할인</b></small></div>${got ? '<button class="btn dark" disabled>구매 완료</button>' : `<button class="btn jade" data-dpack="${P.id}" ${s.jade >= P.price ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${P.price}</button>`}</div>`; };
    const list = shopCat === 'set' ? '' : DECOR.filter(d => shopCat === 'all' || (shopCat === 'floor' && !d.wall) || (shopCat === 'wall' && d.wall) || (shopCat === 'seat' && d.seat) || (shopCat === 'premium' && d.premium) || (shopCat === 'ex' && Decor.isEx(d)) || (shopCat === 'chair' && d.chair)).sort((a, b) => (a.free ? 0 : a.price || (a.cash ? 50000 + a.rankReq * 10 : 99999 + (a.rank || 0) * 10 + (a.story != null ? 100 + a.story : 0))) - (b.free ? 0 : b.price || (b.cash ? 50000 + b.rankReq * 10 : 99999 + (b.rank || 0) * 10 + (b.story != null ? 100 + b.story : 0))));
    const box = modal(`<h2>🏮 소품 상점 <small style="font-size:11px;color:var(--mute)">${DECOR.filter(d => Decor.owned(d.id)).length}/${DECOR.length}종 보유</small></h2><p class="mute">옥으로 사요. 놓은 소품의 품격만큼 수확량이 올라요 (최대 +25%) · 보유 옥 <b style="color:var(--jade)">${fmt(s.jade)}</b></p>
      <div class="ds-cats">${cats.map(([k, n]) => `<button data-dcat="${k}" class="${shopCat === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="ds-scroll">${shopCat === 'all' || shopCat === 'set' ? `<div class="ds-packs">${DECOR_PACKS.map(pack).join('')}</div>` : ''}${list ? `<div class="ds-grid">${list.map(card).join('')}</div>` : ''}</div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-dcat]').forEach(b => b.onclick = () => { shopCat = b.dataset.dcat; closeModal(); decoShop(); });
    const askOwned = (d, go) => { const n = Decor.owned(d.id); if (!n) { go(); return; } const sc0 = box.querySelector('.ds-scroll').scrollTop; closeModal(); confirmBox(`<h2>${d.name}</h2><p>이미 <b style="color:var(--gold)">${n}개</b> 갖고 있어요.<br>하나 더 살까요?</p>`, () => { go(); }, '더 사기'); const cancel = $('#modal [data-act="close"]'); if (cancel) cancel.onclick = () => { closeModal(); decoShop(); const ns = $('#modal .ds-scroll'); if (ns) ns.scrollTop = sc0; }; };
    box.querySelectorAll('[data-dcash]').forEach(b => b.onclick = () => { const d = Decor.D(b.dataset.dcash); askOwned(d, () => { closeModal(); confirmBox(`<h2>${d.name}</h2><p>${d.desc}</p><div class="big" style="color:var(--gold)">${priceOf('decor:' + d.id)}</div>${payNote()}`, () => pay('decor:' + d.id), '구매'); }); });
    box.querySelectorAll('[data-dbuy]').forEach(b => b.onclick = () => { const d = Decor.D(b.dataset.dbuy), n = Decor.owned(d.id), sc0 = box.querySelector('.ds-scroll').scrollTop; closeModal();
      askBuy('소품 구매', `${d.name}${eul(d.name)} 살까요?${n ? `<br><span class="mute">이미 ${n}개 갖고 있어요</span>` : ''}`, d.price, 0, () => buyIt(d), () => { decoShop(); const ns = $('#modal .ds-scroll'); if (ns) ns.scrollTop = sc0; }); });
    const buyIt = d => { const scEl = $('#modal .ds-scroll'); if (Decor.buy(d.id)) { Sound.play('buy'); setTimeout(() => got(`${d.name} 구입! 아래 목록에서 끌어다 놓아 보세요`, { emo: '🏮', then: decoShop }), 50); const sc = scEl ? scEl.scrollTop : 0; closeModal(); decoBar(); decoShop(); const ns = $('#modal .ds-scroll'); if (ns) ns.scrollTop = sc; } else { Sound.play('no'); toast('옥이 부족해요'); } };
    box.querySelectorAll('[data-dpack]').forEach(b => b.onclick = () => { const P = DECOR_PACKS.find(x => x.id === b.dataset.dpack); closeModal(); confirmBox(`<h2>${P.name}</h2><p>${P.items.map(id => Decor.D(id).name).join(', ')}</p><p><s style="color:var(--mute)">옥 ${P.full}</s> → <b style="color:var(--jade)">옥 ${P.price}</b> (30% 할인 · 한 번만)</p>`, () => { if (Decor.buyPack(P.id)) { Sound.play('promote'); got(`${P.name} 구입 완료!`, { emo: '🏮' }); decoBar(); } else { Sound.play('no'); toast('옥이 부족해요'); } decoShop(); }, '구매'); });
  }
  function judgeModal() {
    const c = Life.judgeCase();
    if (!c) { toast(`오늘 심판은 모두 끝났어요. 내일 새 망자가 와요 (누적 명판결 ${S().judge.total}건)`); return; }
    const who = c.age >= 60 ? 'elder' : /주모|할머니|소녀|보살/.test(c.name) ? 'jumo' : 'boat';
    const box = modal(`<div class="judge"><div class="jg-top"><span>망자 심판</span><small>오늘 ${Life.JUDGE_MAX - Life.judgeLeft() + 1}/${Life.JUDGE_MAX}번째</small></div>
      <div class="jg-man"><canvas id="jg-pic" width="16" height="23"></canvas><div><b>${c.name}</b><small>향년 ${c.age}세</small></div></div>
      <div class="jg-scroll"><em>명부 기록</em><p>${c.text}</p></div>
      <p class="mute">이 망자를 어디로 보낼까요?</p>
      <div class="jg-acts"><button class="btn jg-heaven" data-j="1">극락으로<small>연꽃 길</small></button><button class="btn red jg-hell" data-j="0">지옥으로<small>불길</small></button></div></div>`, true);
    const g = box.querySelector('#jg-pic').getContext('2d'); g.imageSmoothingEnabled = false; const im = SP.npct(who, 0); g.drawImage(im, 0, 0);
    box.querySelectorAll('[data-j]').forEach(b => b.onclick = () => {
      const r = Life.judge(+b.dataset.j); if (!r) return;
      Sound.play(r.ok ? 'promote' : 'no');
      box.innerHTML = `<div class="judge res ${r.ok ? 'ok' : 'bad'}"><div class="jg-stamp">${r.ok ? '명판결!' : '오판…'}</div>
        <p>${r.ok ? '염라대왕께서 고개를 끄덕이십니다.' : `사실 이 망자는 <b>${r.ans ? '극락' : '지옥'}</b>에 가야 했어요.`}</p>
        <div class="big"><img class="px" src="${IC('soul', 3)}">+${fmt(r.souls)}${r.jade ? ` · 옥 +${r.jade}` : ''}</div>
        ${r.bonus ? `<p style="color:var(--gold)">오늘 5건 모두 명판결! 보너스 옥 +${r.bonus}</p>` : ''}
        <div class="acts">${r.left ? '<button class="btn red" id="jg-next">다음 망자</button>' : ''}<button class="btn dark" data-act="close">닫기</button></div></div>`;
      const nx = box.querySelector('#jg-next'); if (nx) nx.onclick = () => { closeModal(); judgeModal(); };
      officeBar(); Life.qEvent('judge');
    });
  }
  function claimDocs() {
    const r = Life.claimDocs();
    if (!r) { speedUp('docs', 0, () => Life.docsCount() && claimDocs()); return; }
    Sound.play('promote'); Scene.burstAt && Scene.burstAt(innerWidth / 2, 160, '#ffe08a', 20);
    got(`📜 결재 ${r.n}건 완료! 혼 +${fmt(r.souls)} · 옥 +${r.jade}`, { emo: '📜' }); Life.qEvent('docs', r.n); officeBar();
  }
  // 지도 소품 살펴보기
  function useProp(o) {
    if (!Life.propReady(o.key)) { toast(`${Life.PROP[o.kind].name}: ${fmtTime(Life.propLeft(o.key))} 뒤에 다시 살펴볼 수 있어요`); return; }
    const r = Life.useProp(o.kind, o.key, o.lampsLit, o.lampsAll); if (!r) return;
    Sound.play(r.ticket || r.buff ? 'promote' : 'collect', 2);
    Scene.burstAt(o.x, o.y, r.jade || r.ticket ? '#7fffb0' : '#ffe08a', 14);
    if (r.souls) float(o.x, o.y - 10, '+' + fmt(r.souls), 'big');
    if (r.wraith) { Scene.spawnWraith(Math.max(Game.value() * 50, Game.incomePerSec() * 10), 22); }
    const pmsg = r.msg + [r.jade ? ` · 옥 +${r.jade}` : '', r.seed ? ` · ${r.seed}` : '', r.ticket ? ' · 소환권 +1' : ''].join('');
    if (r.jade || r.seed || r.ticket || r.souls || r.buff) got(pmsg, { emo: '✨', soft: true }); else toast(pmsg, 2600);
    if (r.buff) Game.apply();
  }
  function openLife(k) { sub = k; goTab('life'); }
  function poi(id, i) {
    Sound.play('open');
    if (id === 'office') enterOffice();
    else if (id === 'docs') { claimDocs(); tutEv('docs'); }
    else if (id === 'clue') { if (Story.takeClue()) { Sound.play('promote'); toast('✦ 단서를 찾았다! 위쪽 퀘스트를 눌러 확인하세요', 3200); } }
    else if (id === 'prop') useProp(i);
    else if (id === 'shrine') offerModal();
    else if (id === 'tavern' || id === 'jumo') openLife('tavern');
    else if (id === 'elder') questModal();
    else if (id === 'boat') openLife('expe');
    else if (id === 'judge') { goTab('rank'); toast(Game.canTest() ? '판관: 승진할 수 있네! 승진 탭에서 승진하게' : `판관: 레벨 ${Game.nextRank() ? Game.nextRank().lv : '-'}이 되면 다시 오게`); }
    else if (id === 'mudang') fortuneModal();
    else if (id === 'sansin') offerModal();
    else if (id === 'kkachi') mailOpen();
    else if (id === 'garden') openLife('garden');
    else if (id === 'gate') openLife('expe');
    else if (id === 'stele') openLife('dex');
    else if (id === 'board') questModal();
    else if (id === 'merchant') merchantModal();
    else if (id === 'stall') { goTab('shop'); toast('노점: 옥 상점과 패키지를 볼 수 있어요. 가끔 도깨비 상인도 들러요'); }
    else if (id === 'plot') {
      openLife('garden');
      if (i >= S().plots) { toast('잠긴 밭이에요. 옥으로 열 수 있어요'); return; }
      const st = Life.plotState(i);
      if (st.ready) { const n = Life.harvest(i); Life.qEvent('harvest'); Sound.play('collect', 2); got(`${st.f.name} ${n}송이 수확!`, { emo: '🌸' }); renderLife($('#panel')); }
      else if (st.empty) lifeClick({ dataset: { plantpick: String(i) } });
      else speedUp('plot', i);
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
    box.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const j = Life.qClaim(+b.dataset.q); if (j) { Sound.play('buy'); got(`의뢰 완료! 옥 +${j}`, { ic: 'jade', then: questModal }); } else questModal(); });
    const bb = box.querySelector('[data-qb]'); if (bb) bb.onclick = () => { const j = Life.qBonus(); if (j) { Sound.play('promote'); const qd = Decor.grantQuest(); got(`오늘 의뢰를 모두 끝냈다! 옥 +${j}${qd ? ` · 🏮 의뢰 보상 소품 「${qd.name}」` : ''}`, { ic: 'jade', then: questModal }); } else questModal(); };
  }
  function merchantModal() {
    if (!Life.merchantHere()) { toast('도깨비 상인은 지금 없어요. 가끔 노점에 들러요'); return; }
    const m = S().merchant, left = (m.until - Date.now()) / 1000;
    const box = modal(`<h2>👺 도깨비 상인</h2><p>"헤헤, 좋은 물건 있어! 금방 떠날 거야." <span class="mute">(${fmtTime(left)} 남음)</span></p>
      ${m.offers.map(id => { const o = MERCHANT_POOL.find(x => x.id === id), pr = Life.offerPrice(o), sold = m.bought.includes(id), ok = pr.jade ? S().jade >= pr.jade : S().souls >= pr.soul;
        return `<div class="offer pbox"><div class="info"><b>${o.name}</b></div><button class="btn ${pr.jade ? 'jade' : ''}" data-buyo="${id}" ${sold ? 'disabled' : !ok ? `data-short="${pr.jade ? 'jade' : 'souls'}"` : ''}>${sold ? '구매함' : `<img class="px" src="${IC(pr.jade ? 'jade' : 'soul', 2)}">${fmt(pr.jade || pr.soul)}`}</button></div>`; }).join('')}
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-buyo]').forEach(b => b.onclick = () => { const o = MERCHANT_POOL.find(x => x.id === b.dataset.buyo), pr = Life.offerPrice(o); closeModal();
      askBuy('도깨비 상인', `${o.name}${eul(o.name)} 살까요?`, pr.jade || 0, pr.soul || 0, () => { if (Life.merchantBuy(o.id)) { Sound.play('buy'); got('거래 완료!', { emo: '👺' }); } else { Sound.play('no'); toast(pr.jade ? '옥이 부족해요' : '혼이 부족해요'); } merchantModal(); }, merchantModal); });
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
        if (i >= s.plots) return `<div class="plot pbox locked"><div class="lock">🔒</div><small>밭 ${i + 1}</small>${i === s.plots ? `<button class="btn jade" data-unlock="1" ${s.jade >= PLOT_COST[i] ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${PLOT_COST[i]}</button>` : '<small class="mute">앞 밭 먼저</small>'}</div>`;
        const st = Life.plotState(i);
        if (st.empty) return `<div class="plot pbox"><img class="px" src="${toURL(SP.plant(-1, {}, 'soil'), 4)}"><small>빈 밭</small><button class="btn" data-plantpick="${i}">심기</button></div>`;
        return `<div class="plot pbox ${st.ready ? 'ready' : ''}"><img class="px" src="${FIC(st.f.id, st.stage, 4)}"><small>${st.f.name}</small>${st.ready ? `<button class="btn red" data-harvest="${i}">수확</button>` : `<button class="btn sk" data-skip="plot:${i}"><span data-left-plot="${i}">${fmtTime(st.left)}</span> ⏩</button>`}</div>`;
      }).join('') + `</div>`;
      h += `<div class="sec">씨앗 가게</div>` + FLOWERS.map(f => {
        const c = f.soul ? Life.seedSoulCost(f) : f.jade, ok = f.soul ? s.souls >= c : s.jade >= c;
        return `<div class="row pbox"><div class="ic"><img class="px" src="${FIC(f.id, 3, 3)}"></div><div class="info"><div class="nm">${f.name} 씨앗</div><div class="ds">${f.desc} · 자라는 데 <b>${fmtTime(f.grow)}</b> · 꽃 ${f.yield[0]}~${f.yield[1]}송이</div></div>
          <button class="btn ${f.soul ? '' : 'jade'}" data-seed="${f.id}" ${ok ? '' : `data-short="${f.soul ? 'souls' : 'jade'}"`}><span class="c"><img class="px" src="${IC(f.soul ? 'soul' : 'jade', 2)}">${fmt(c)}</span><span class="l">1개</span></button></div>`;
      }).join('') + `<p class="note">꽃은 게임을 꺼 둬도 자라요. 혼불꽃·생사화 씨앗은 파견에서도 얻을 수 있어요.</p>`;
    } else if (sub === 'tavern') {
      const bs = ['value', 'spawn', 'fight'].filter(k => Life.buffLeft(k) > 0);
      h += `<div class="buffbox pbox">${bs.length ? bs.map(k => `<div><b>${BUFF_NAME[k]}</b> 효과 중 <span data-left-buff="${k}">${fmtClock(Life.buffLeft(k))}</span></div>`).join('') : '<span class="mute">지금 마신 탕약이 없어요. 꽃을 모아 달여 보세요.</span>'}</div>`;
      h += RECIPES.map(r => { const ok = Life.canBrew(r); return `<div class="row pbox"><div class="ic"><img class="px" src="${IC(r.instant ? 'jade' : 'luck', 3)}"></div><div class="info"><div class="nm">${r.name}</div><div class="ds">${r.desc}</div>
        <div class="need">${Object.entries(r.need).map(([k, v]) => `<span class="${(s.flowers[k] || 0) >= v ? 'ok' : ''}"><img class="px" src="${FIC(k)}">${fname(k)} ${s.flowers[k] || 0}/${v}</span>`).join('')}</div></div>
        <button class="btn red" data-brew="${r.id}" ${ok ? '' : 'disabled'}>달이기</button></div>`; }).join('');
      h += `<p class="note">같은 탕약을 또 마시면 시간이 늘어나요 (최대 4시간). 혼불주는 원귀 퇴치 화력이 3배!</p>`;
    } else if (sub === 'expe') {
      h += `<div class="ph"><h3>졸개 파견</h3><span class="sub">파견 칸 ${s.expe.length}/${Life.slots()} · 보유 졸개 ${Game.minions()}명</span></div>`;
      { const sc = Life.slotCost(), ex = s.expeSlots || 0; h += `<div class="row pbox ${sc ? '' : 'maxed'}"><div class="ic"><img class="px" src="${IC('jade', 3)}"></div><div class="info"><div class="nm">파견 칸 늘리기<small>${Math.min(ex, Life.SLOT_JADE.length)}/${Life.SLOT_JADE.length}</small></div><div class="ds">옥으로 파견 칸을 영구히 1칸 늘려요</div></div>${sc ? `<button class="btn jade" data-slot="1" ${s.jade >= sc ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${sc}</button>` : '<button class="btn" disabled>MAX</button>'}</div>`; }
      h += s.expe.map((x, i) => { const E = EXPEDITIONS.find(e => e.id === x.id), l = Life.expeLeft(x); return `<div class="row pbox"><div class="ic"><img class="px" src="${IC('minion', 3)}"></div><div class="info"><div class="nm">${E.name}</div><div class="ds" data-left-expe="${i}">${l > 0 ? fmtTime(l) + ' 남음' : '돌아왔어요!'}</div></div>
        ${l > 0 ? `<button class="btn sk" data-skip="expe:${i}">⏩ 단축</button>` : `<button class="btn red" data-claim="${i}">보상 받기</button>`}</div>`; }).join('');
      h += `<div class="sec">순찰지</div>` + EXPEDITIONS.map(E => {
        const lockR = s.rank < E.rank, lockM = Game.minions() < E.minion, full = s.expe.length >= Life.slots(), tl = Life.expeTodayLeft(E.id), done = tl <= 0;
        const rw = [...Object.entries(E.seed).map(([k, v]) => `${fname(k)} 씨앗 ${v}`), E.jade ? `옥 ${E.jade}` : '', `${hrsLabel(E.hours)}치 혼`, E.dex ? '희귀 혼령 기록' : ''].filter(Boolean).join(' · ');
        return `<div class="row pbox ${lockR ? 'maxed' : ''}"><div class="ic"><img class="px" src="${IC('gate', 3)}"></div><div class="info"><div class="nm">${E.name}<small>${fmtTime(E.hrs * 3600)}</small></div><div class="ds">졸개 ${E.minion}명 필요 · <b>${rw}</b></div>${lockR ? '' : `<div class="ds" style="color:var(--gold)">오늘 ${tl}/${Life.EXPE_DAY}회 남음</div>`}</div>
          <button class="btn" data-send="${E.id}" ${lockR || lockM || full || done ? 'disabled' : ''}>${lockR ? RANKS[E.rank].name + '부터' : done ? '내일 다시' : lockM ? '졸개 부족' : full ? '칸 없음' : '보내기'}</button></div>`;
      }).join('') + `<p class="note">파견을 보내도 졸개는 계속 혼을 거둬요. 순찰지마다 하루 3번까지 보낼 수 있어요. 승진할수록 파견 칸이 늘어나요. 옥으로 2칸 더 늘릴 수 있어요.</p>`;
    } else {
      const n = Object.keys(s.dex).length;
      h += `<div class="ph"><h3>혼령 도감</h3><span class="sub">${n}/${SPECIALS.length}종 · 혼 수확 +${Math.round(Life.dexBonus() * 100)}%</span></div>
        <div class="dex">${SPECIALS.map(p => { const c = s.dex[p.i] || 0; return `<div class="pbox ${c ? '' : 'unk'}" data-dexi="${p.i}"><img class="px" src="${SPIC(p.i, !!c)}"><b>${c ? p.name : '???'}</b><small>${c ? `${c}마리${c >= 10 ? ' ★' : ''}` : REGIONS[p.region].name}</small></div>`; }).join('')}</div>
        <p class="note">특별한 혼령은 아주 가끔 나타나요 (귀한 인연을 올리면 더 자주).<br>처음 거두면 혼 수확 +2%, 10마리 모으면 +1% 더. 근무지마다 나오는 혼령이 달라요.</p>`;
    }
    P.innerHTML = h;
    lifeTick();
  }
  function brewGo(id) { const d = { brew: id }; const r = Life.brew(d.brew); if (r) { Sound.play('promote'); Life.qEvent('brew'); const R = RECIPES.find(x => x.id === d.brew); toast(typeof r === 'number' ? `${R.name}! +${fmt(r)} 혼 · 옥 +${R.instant.jade}` : `${R.name}${eul(R.name)} 마셨다! ${R.desc}`); } renderLife($('#panel')); }
  function dexInfo(i) {
    const p = SPECIALS[i], c = S().dex[i] || 0, reg = REGIONS[p.region].name;
    modal(`<div class="pinfo dexinfo"><img class="px" src="${SPIC(i, !!c, 6)}" style="height:96px"><h2>${c ? p.name : '???'}</h2>
      ${c ? `<p class="mute">${p.desc}</p><p class="lore">${p.lore}</p>` : `<p class="lore">아직 만나지 못한 혼령이에요.</p>`}
      <div class="dexmeta"><span>📍 ${reg}</span>${c ? `<span>거둔 수 ${c}마리${c >= 10 ? ' ★' : ''}</span>` : ''}</div>
      <p class="mute" style="font-size:11px">${c ? (c >= 10 ? '도감 보너스 혼 수확 +3% (완성)' : `도감 보너스 혼 수확 +2% · 10마리 모으면 +1% 더 (${c}/10)`) : `${reg}에서 아주 가끔 나타나요. 처음 거두면 혼 수확 +2%`}</p></div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
  }
  function lifeClick(t) {
    const d = t.dataset;
    if (d.sub) { sub = d.sub; Sound.play('open'); renderLife($('#panel')); return true; }
    if (d.unlock) { askBuy('밭 늘리기', '새 밭을 일굴까요?', PLOT_COST[S().plots], 0, () => { if (Life.unlockPlot()) { Sound.play('buy'); got('새 밭을 일궜어요!', { emo: '🌱' }); } else { Sound.play('no'); toast('옥이 부족해요'); } renderLife($('#panel')); }); return true; }
    if (d.harvest) { const n = Life.harvest(+d.harvest); if (n) { Sound.play('collect', 2); Life.qEvent('harvest'); got(`꽃 ${n}송이 수확!`, { emo: '🌸' }); } renderLife($('#panel')); return true; }
    if (d.dexi != null) { dexInfo(+d.dexi); return true; }
    if (d.seed) { const f = FLOWERS.find(x => x.id === d.seed), j = f.soul ? 0 : f.jade, so = f.soul ? Life.seedSoulCost(f) : 0;
      askBuy('씨앗 구매', `${f.name} 씨앗 1개를 살까요?`, j, so, () => { if (Life.buySeed(d.seed, 1)) { Sound.play('buy'); got(`${f.name} 씨앗 +1`, { emo: '🌱' }); } else { Sound.play('no'); toast(j ? '옥이 부족해요' : '혼이 부족해요'); } renderLife($('#panel')); }); return true; }
    if (d.brew) { const R0 = RECIPES.find(x => x.id === d.brew); confirmBox(`<h2>🍶 ${R0.name}</h2><p>${R0.desc}</p><p class="mute">재료: ${Object.entries(R0.need).map(([k, v]) => `${fname(k)} ${v}송이`).join(' · ')}</p><p>달일까요?</p>`, () => brewGo(d.brew), '달이기'); return true; }
    if (d.slot) { askBuy('파견 칸 늘리기', '파견 칸을 1칸 늘릴까요?', Life.slotCost(), 0, () => { if (Life.buySlot()) { Sound.play('buy'); got(`파견 칸이 늘었어요! (${Life.slots()}칸)`, { ic: 'gate' }); } else { Sound.play('no'); toast('옥이 부족해요'); } renderLife($('#panel')); }); return true; }
    if (d.send) { if (Life.send(d.send)) { Sound.play('buy'); Life.qEvent('send'); toast('졸개를 순찰 보냈어요'); setTimeout(askPush, 1200); } renderLife($('#panel')); return true; }
    if (d.skip) { const [k, i] = d.skip.split(':'); speedUp(k, +i); return true; }
    if (d.claim) { const r = Life.claim(+d.claim); if (r) { Sound.play('promote'); got(`파견 보상: +${fmt(r.souls)} 혼${r.jade ? ` · 옥 +${r.jade}` : ''} · ${Object.entries(r.seeds).map(([k, v]) => fname(k) + ' 씨앗 ' + v).join(', ')}${r.dex ? ` · 📖 ${r.dex.name}` : ''}`, { ic: 'minion' }); } renderLife($('#panel')); return true; }
    if (d.plantpick) {
      const i = +d.plantpick, s = S(), have = FLOWERS.filter(f => s.seeds[f.id] > 0);
      const box = modal(`<h2>무엇을 심을까요?</h2>${have.length ? `<div class="seedpick">${have.map(f => `<button class="pbox" data-pf="${f.id}"><img class="px" src="${FIC(f.id, 3, 3)}"><b>${f.name}</b><small>${fmtTime(f.grow)} · 씨앗 ${s.seeds[f.id]}</small></button>`).join('')}</div>` : '<p>씨앗이 없어요. 씨앗 가게에서 사거나 파견으로 얻어 보세요.</p>'}
        <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
      box.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => { if (Life.plant(i, b.dataset.pf)) { Sound.play('buy'); toast(`${fname(b.dataset.pf)}${eul(fname(b.dataset.pf))} 심었어요`); } closeModal(); renderLife($('#panel')); });
      return true;
    }
    return false;
  }

  // ---------- 광고 (테스트: 3초 대기) ----------
  function ad(onReward) {
    if (S().noAds) { onReward(); return; }
    if (Native.isApp()) { Native.rewardAd(onReward, m => m && toast(m, 2400)); return; }
    if (window.adBreak && window.H5_ADS) {
      window.adBreak({ type: 'reward', name: 'reward', beforeReward: show => show(), adViewed: onReward, adDismissed: () => toast('끝까지 보면 보상을 받아요') });
      return;
    }
    let n = 3;
    modal(`<div class="adbox"><p style="color:var(--mute)">광고 시청 중 (테스트)</p><div class="cnt" id="adcnt">${n}</div><p>실제 출시 때는 구글 보상형 광고가 나옵니다.</p></div>`, true);
    const iv = setInterval(() => { n--; const e = $('#adcnt'); if (e) e.textContent = n; if (n <= 0) { clearInterval(iv); closeModal(); onReward(); } }, 1000);
  }
  // 화면의 2배 부적 버튼: 먼저 물어보고 광고 보기
  function boostAsk() {
    const n = Game.adLeft('boost'), left = Game.boosting() ? Math.max(0, (S().boostUntil - Date.now()) / 1000) : 0;
    const box = modal(`<h2>🧧 2배 부적 10분</h2><p>광고를 보면 10분 동안 혼 수확·화력이 2배가 돼요.<br><span class="mute">하루 ${AD_LIMIT.boost}번까지 · 남은 시간에 이어서 늘어나요</span></p>${left ? `<p>지금 남은 시간 <b style="color:var(--gold)">${fmtClock(left)}</b></p>` : ''}
      <div class="acts"><button class="btn red" id="bs-ad" ${n > 0 ? '' : 'disabled'}>광고 보기<em>${n}/${AD_LIMIT.boost}</em></button><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#bs-ad').onclick = () => { closeModal(); boostAd(); };
  }
  function boostAd() {
    if (Game.adLeft('boost') <= 0) { toast('오늘 광고 부적을 모두 썼어요. 상점에서 옥으로 살 수 있어요'); return; }
    const min = 10; // 광고 1번 = 2배 부적 10분 (하루 8번)
    ad(() => { Game.useAd('boost'); Game.addBoost(min); Life.qEvent('ad'); Sound.play('promote'); got(`2배 부적 ${min}분! 수확·화력 2배`, { ic: 'luck' }); render(); });
  }

  // ---------- 결제 ----------
  // 앱: 구글 플레이 결제 / App Store 결제 → 완료되면 grantPaid. 웹: 서버가 없는 시험판(claude.ai 등)에서만 테스트 결제.
  // gid: SHOP_IAP 의 id, 또는 현금 의자는 'decor:<소품 id>'
  const testPay = () => !Native.isApp() && (!!window.claude || !Cloud.enabled());
  const priceOf = gid => Native.price(gid) || LocalPrice.of(gid.startsWith('decor:') ? Decor.D(gid.slice(6)).cash : SHOP_IAP.find(p => p.id === gid).price);
  const payNote = () => testPay() ? '<p style="color:var(--mute);font-size:10px">테스트 결제: 실제로 청구되지 않습니다.</p>' : Native.isApp() ? `<p style="color:var(--mute);font-size:10px">${Native.platform() === 'ios' ? 'App Store' : 'Google Play'} 계정으로 결제돼요.</p>` : '';
  // 결제 지급 (key: 스토어 거래 번호 → 게임 저장에도 기록해 두 번 지급하지 않음)
  function grantPaid(gid, key) {
    const s = S(); if (key) { s.txDone = s.txDone || []; if (s.txDone.includes(key)) return; s.txDone.push(key); if (s.txDone.length > 300) s.txDone = s.txDone.slice(-300); }
    if (gid.startsWith('decor:')) { const d = Decor.D(gid.slice(6)); if (d && Decor.buyCash(d.id, true)) { Sound.play('promote'); got(`${d.name} 구입! 책상 뒤에 놓아 보세요`, { emo: '🏮' }); decoBar(); } }
    else { const P = SHOP_IAP.find(p => p.id === gid); if (P && Game.iap(gid, true)) { Sound.play('promote'); got(`${P.name} 지급 완료!`, { emo: '🎁' }); } }
    Game.save(); if (S().kind) Cloud.pushSave(S(), true); render();
  }
  async function pay(gid) {
    if (testPay()) { grantPaid(gid); return; }
    if (!Native.isApp()) { toast('결제는 앱(구글 플레이 · 앱스토어)에서 할 수 있어요', 2600); return; }
    const err = await Native.buy(gid); if (err) toast(err, 2400);
  }
  function iapBox(id) {
    const P = SHOP_IAP.find(p => p.id === id);
    confirmBox(`<h2>${P.name}</h2><p>${P.desc || ''}</p><div class="big" style="color:var(--gold)">${priceOf(id)}</div>${payNote()}`, () => pay(id), '구매');
  }

  // ---------- 재화가 모자랄 때: 빨간 가격 + 누르면 구매 페이지 ----------
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-short]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); Sound.play('no'); buyPage(b.dataset.short); }, true);
  function buyPage(kind) {
    closeOverlay && $('#promo').classList.contains('on') && closeOverlay();
    const s = S(), jadeKind = kind !== 'souls';
    const packs = SHOP_IAP.filter(P => Game.iapLeft(P.id) > 0 && (jadeKind ? P.jade && !P.seal && !P.noAds : (P.hours || P.boost || P.seal)));
    const row = P => `<div class="bp-row"><img class="px" src="${IC(P.icon || 'jade', 3)}"><div><b>${P.name}</b><small>${P.desc || ''}</small></div>${P.tag ? `<em>${P.tag}</em>` : ''}<button class="btn red" data-bp="${P.id}">${priceOf(P.id)}</button></div>`;
    const jadeOpts = !jadeKind ? JADE_SHOP.filter(J => J.hours || J.boost).map(J => { const c = Game.jadeCost(J.id); return c == null ? '' : `<div class="bp-row"><img class="px" src="${IC(J.hours ? 'scroll' : 'luck', 3)}"><div><b>${J.name}</b><small>${J.desc}${J.hours ? ' · +' + fmt(Game.incomePerSec(true) * 3600 * J.hours) : ''}</small></div><button class="btn jade" data-bj="${J.id}" ${s.jade >= c ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${c}</button></div>`; }).join('') : '';
    const box = modal(`<div class="bp-head"><b>${jadeKind ? '💎 옥이 부족해요' : '🔥 혼이 부족해요'}</b><small>보유 ${jadeKind ? `옥 <i class="red">${fmt(s.jade)}</i>` : `혼 <i class="red">${fmt(s.souls)}</i>`}</small></div>
      ${jadeKind ? (Game.adLeft('jfree') > 0 ? `<div class="bp-ad"><span>🎁 매일 무료 옥 ${FREE_JADE}개</span><button class="btn" id="bp-free">받기<em>${Game.adLeft('jfree')}/${AD_LIMIT.jfree}</em></button></div>` : `<div class="bp-ad"><span>📺 광고 보고 옥 ${FREE_JADE}개</span><button class="btn" id="bp-ad" ${Game.adLeft('jade') > 0 ? '' : 'disabled'}>무료<em>${Game.adLeft('jade')}/${AD_LIMIT.jade}</em></button></div>`) : `<div class="bp-ad"><span>📺 광고 보고 2배 부적</span><button class="btn" id="bp-ad" ${Game.adLeft('boost') > 0 ? '' : 'disabled'}>무료<em>${Game.adLeft('boost')}/${AD_LIMIT.boost}</em></button></div>${jadeOpts}`}
      <div class="sec">${jadeKind ? '옥 충전' : '빠르게 성장하기'}</div><div class="bp-list">${packs.map(row).join('')}</div>
      ${payNote()}<div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-bp]').forEach(b => b.onclick = () => { closeModal(); pay(b.dataset.bp); });
    box.querySelectorAll('[data-bj]').forEach(b => b.onclick = () => { const J = JADE_SHOP.find(x => x.id === b.dataset.bj), c = Game.jadeCost(J.id); closeModal();
      askBuy(J.name, J.desc, c, 0, () => { const r = Game.jadeBuy(J.id); if (r) { Sound.play('buy'); got(typeof r === 'number' ? `+${fmt(r)} 혼` : `${J.name} 사용!`, { ic: typeof r === 'number' ? 'soul' : 'luck' }); render(); } else { Sound.play('no'); toast('옥이 부족해요'); } }); });
    const ad0 = box.querySelector('#bp-ad'); if (ad0) ad0.onclick = () => { closeModal(); if (jadeKind) act('jadeAd'); else boostAd(); };
    const fr0 = box.querySelector('#bp-free'); if (fr0) fr0.onclick = () => { closeModal(); act('jadeFree'); };
  }
  // ---------- 모달 ----------
  function modal(html, noClose) {
    // 안내(튜토리얼)가 떠 있으면 창이 닫힐 때까지 잠깐 숨김 (안내 상자가 창의 버튼을 가리지 않게)
    if (tutEl) tutEl.classList.add('under');
    const m = $('#modal'), opened = performance.now(); m.innerHTML = `<div class="mbox pbox">${noClose ? '' : '<button class="m-x" aria-label="닫기">✕</button>'}${html}</div>`; m.classList.add('on');
    m.onclick = e => {
      // 오른쪽 위 ✕: 창의 원래 닫기(취소) 버튼이 있으면 그걸 눌러 주고, 없으면 그냥 닫기
      if (e.target.closest('.m-x')) { const c = [...m.querySelectorAll('[data-act="close"], #nt-close')].pop(); if (c) c.click(); else closeModal(); return; }
      if (e.target === m && !noClose && performance.now() - opened > 400) closeModal();
      const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act);
    };
    return m.firstChild;
  }
  function closeModal() { if (tutEl) { tutEl.classList.remove('under'); setTimeout(() => tutEl && tutPlace(), 50); } $('#modal').classList.remove('on'); $('#modal').innerHTML = ''; previews = previews.filter(p => document.body.contains(p.c)); }
  // 구매 확인 (업그레이드 버튼은 자주 눌러서 제외)
  const priceTag = (jade, soul) => `<div class="big" style="color:var(--gold)"><img class="px" src="${IC(jade ? 'jade' : 'soul', 3)}" style="vertical-align:middle"> ${fmt(jade || soul)}</div>`;
  function askBuy(title, what, jade, soul, ok, cancel) {
    confirmBox(`<h2>🛒 ${title}</h2><p>${what}</p>${priceTag(jade, soul)}<p class="mute">${jade ? `보유 옥 ${fmt(S().jade)}` : `보유 혼 ${fmt(S().souls)}`}</p>`, ok, '구매');
    if (cancel) { const c = $('#modal [data-act="close"]'); if (c) c.onclick = () => { closeModal(); cancel(); }; }
  }
  function confirmBox(html, ok, label) {
    const box = modal(html + `<div class="acts"><button class="btn red" id="m-ok">${label || '확인'}</button><button class="btn dark" data-act="close">취소</button></div>`);
    box.querySelector('#m-ok').onclick = () => { closeModal(); ok(); };
  }
  // 얻은 것 · 산 것 알림 창 (확인을 누르면 닫힘). soft: 다른 창·대화가 떠 있으면 짧은 알림으로 대신
  function got(html, opt = {}) {
    if (opt.soft && ($('#modal').classList.contains('on') || document.querySelector('.tk-bg') || document.getElementById('tut') || parade)) return toast(html, 3000, opt.actions);
    const box = modal(`<div class="got"><div class="got-ic">${opt.ic ? `<img class="px" src="${IC(opt.ic, 5)}">` : (opt.emo || '🎁')}</div><h2>${opt.title || '획득!'}</h2><p class="got-t">${html}</p></div><div class="acts">${(opt.actions || []).map((a, i) => `<button class="btn ${a.cls || 'jade'}" data-ga="${i}">${a.label}</button>`).join('')}<button class="btn red" id="got-ok">확인</button></div>`);
    (opt.actions || []).forEach((a, i) => { box.querySelector(`[data-ga="${i}"]`).onclick = () => { closeModal(); a.fn(); }; });
    box.querySelector('#got-ok').onclick = () => { closeModal(); if (opt.then) opt.then(); };
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
  // 큰 캐릭터 그림에서 발의 위치 (0~1 비율): 맨 아래 3줄의 불투명 픽셀 가운데
  const feetCache = {};
  function feetOf(kind, rank) {
    const key = kind + rank; if (feetCache[key]) return feetCache[key];
    const im = SP.reaper(kind, rank, 'idle', 0), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x2 = c.getContext('2d'); x2.drawImage(im, 0, 0); const d = x2.getImageData(0, 0, c.width, c.height).data;
    let bottom = -1; for (let y = c.height - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { bottom = y; break; }
    let sx = 0, n = 0; for (let y = Math.max(0, bottom - 2); y <= bottom; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { sx += x + 0.5; n++; }
    return (feetCache[key] = { x: n ? sx / n / c.width : 0.5, y: (bottom + 0.5) / c.height });
  }
  function drawPreviews() {
    const t = performance.now() / 1000;
    previews.forEach(p => {
      if (!document.body.contains(p.c)) return;
      const g = p.c.getContext('2d'); g.clearRect(0, 0, p.c.width, p.c.height); g.imageSmoothingEnabled = false;
      if (p.magic != null) {
        // 캐릭터 캔버스(anchor)가 있으면 실제 발 위치에 마법진 중심을 맞춘다
        let cx = p.c.width / 2, cy = p.c.height / 2;
        if (p.anchor && document.body.contains(p.anchor)) {
          const ft = feetOf(S().kind || 'm', p.anchorRank != null ? p.anchorRank : p.magic), a = p.anchor.getBoundingClientRect(), b = p.c.getBoundingClientRect();
          if (a.width && b.width) { const k = p.c.width / b.width; cx = (a.left + ft.x * a.width - b.left) * k; cy = (a.top + ft.y * a.height - b.top) * k; }
        }
        drawMagic(g, cx, cy, p.magic, t, p.msc || 1); return;
      }
      if (p.prof) { // 프로필: 마법진 → 영물 기운 → 저승사자 · 영물
        const P = p.prof, W = p.c.width, H = p.c.height, f2 = Math.floor(t * 3), im = SP.reaper(P.kind, P.rank, 'idle', f2 % 4), ft = feetOf(P.kind, P.rank);
        const rx = Math.round(W * 0.36 - im.width / 2), ry = H - 8 - im.height, fx = rx + ft.x * im.width, fy = ry + ft.y * im.height;
        drawMagic(g, fx, fy, P.rank, t, 1.6);
        g.drawImage(im, rx, ry);
        if (P.pet) { const pm = SP.pet(P.pet, f2), k2 = 2, pw = pm.width * k2, ph = pm.height * k2, px2 = Math.round(W * 0.75 - pw / 2), py2 = H - 8 - ph - (P.pet.fly ? 4 + Math.sin(t * 4) * 2 : 0); drawPetAura(g, px2 + pw / 2, py2 + ph, pw, ph, P.pet.g, P.star, t, 1); g.drawImage(pm, px2, py2, pw, ph); }
        return;
      }
      if (p.pet && p.aura) { // 영물 + 기운 (S 등급부터)
        const pm = SP.pet(p.pet, Math.floor(t * 3)), W = p.c.width, H = p.c.height, bob = p.pet.fly ? Math.round(Math.sin(t * 4) * 1.5) : 0;
        const x = Math.round(W / 2 - pm.width / 2), y = H - 3 - pm.height + bob;
        drawPetAura(g, W / 2, y + pm.height, pm.width, pm.height, p.pet.g, p.aura, t, 1); g.drawImage(pm, x, y); return;
      }
      const f = Math.floor(t * 3 + (p.ph || 0));
      const img = p.pet ? SP.pet(p.pet, f) : p.mini ? SP.mini('idle', f) : SP.reaper(p.kind, p.rank != null ? p.rank : S().rank, p.pose || 'idle', p.pose === 'reap' ? f % 2 : f % 4);
      g.drawImage(img, 0, 0, p.c.width, p.c.height);
    });
  }
  function charSelect(first) {
    let kind = S().kind || 'm';
    const box = modal(`${first ? '<div class="title-logo">저승사자 키우기</div><div class="title-sub">명부를 들고 떠도는 혼을 거두어 염라대왕이 되어라</div>' : '<h2>모습 바꾸기</h2>'}
      <div class="pick"><button data-k="m"><canvas width="44" height="51"></canvas>남자 차사</button><button data-k="f"><canvas width="44" height="51"></canvas>여자 차사</button></div>
      <input id="nm" maxlength="8" placeholder="닉네임 (2~8자)" value="${esc(S().name || '')}"><p class="mute" id="nm-msg" style="font-size:11px;min-height:15px;margin:4px 0 0">순위표·이웃 집무실에도 이 닉네임이 보여요</p>
      <div class="acts"><button class="btn red" id="go">${first ? '저승길 나서기' : '바꾸기'}</button>${first ? '' : '<button class="btn dark" data-act="close">취소</button>'}</div>`, first);
    const sel = () => box.querySelectorAll('.pick button').forEach(b => b.classList.toggle('on', b.dataset.k === kind));
    box.querySelectorAll('.pick button').forEach(b => {
      previews.push({ c: b.querySelector('canvas'), kind: b.dataset.k, pose: 'idle' });
      b.onclick = () => { kind = b.dataset.k; sel(); Sound.play('open'); };
    });
    sel();
    box.querySelector('#go').onclick = async () => {
      const n = (box.querySelector('#nm').value || '').trim().replace(/\s+/g, ' '), msg = t => { const m = box.querySelector('#nm-msg'); m.textContent = t; m.style.color = '#ff6a7a'; };
      if (n.length < 2) return msg('닉네임을 2자 이상 정해 주세요');
      if (cleanText(n) !== n) return msg('쓸 수 없는 말이 들어 있어요');
      if (n !== S().name && Board.online()) { msg('확인하는 중…'); if (await Board.nickTaken(n)) return msg('이미 다른 차사가 쓰는 닉네임이에요'); }
      const changed = n !== S().name;
      S().kind = kind; S().name = n; S().nickSet = true; // 처음 정한 이름이 곧 닉네임 (순위·이웃 집무실 공통)
      Game.apply(); Game.save(); closeModal(); if (changed) { Board.push(true); Board.pushOffice(); }
      if (first) { S().created = Date.now(); S().tut = 0; setTimeout(storyIntro, 400); }
      hud();
    };
  }
  const hrsLabel = h => { const m = Math.round(h * 60), H = Math.floor(m / 60), M = m % 60; return H ? `${H}시간${M ? ' ' + M + '분' : ''}` : `${M}분`; };
  // 로그인 안 했을 때 안내창에 넣는 로그인 버튼 (서버가 연결돼 있을 때만)
  const loginBtn = () => Cloud.ready() && !Cloud.signedIn() ? '<button class="btn" data-login="1">로그인</button>' : '';
  const bindLogin = () => { const b = $('#modal [data-login]'); if (b) b.onclick = () => { closeModal(); loginScreen(true); }; };
  // ---------- 언어 고르기 (각 언어 이름은 그 나라 글자로, 번역하지 않음) ----------
  // 시작 순서: 로딩 → 언어 → 로그인 → 캐릭터 · 닉네임
  function startFlow() {
    if (S().kind) return;
    if (Cloud.enabled() && Cloud.signedIn()) return; // cloudSync 가 정함
    if (Cloud.enabled() && !S().guest) loginScreen(); else charSelect(true);
  }
  function langPicker(first) {
    const box = modal(`<div translate="no"><div class="title-logo lp-title">🌏 언어 · 言語 · 语言 · Language</div>
      <div class="lp-list">${I18N.LANGS.map(([k, n]) => `<button class="lp-btn ${k === I18N.lang ? 'on' : ''}" data-lang="${k}"><b>${n}</b><small>${{ ko: '저승사자 키우기', ja: '冥土の使者を育てよう', zh: '冥府使者养成记', en: 'Grim Reaper Idle' }[k]}</small></button>`).join('')}</div>
      ${first ? '' : '<div class="acts"><button class="btn dark" data-act="close">✕</button></div>'}</div>`, first);
    // 다시 켜지 않고 바로 바꿈 → 처음이면 이어서 로그인(또는 캐릭터 만들기)
    box.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { I18N.choose(b.dataset.lang); Game.save(); closeModal(); render(); hud(); if (first) startFlow(); });
  }
  function settings() {
    const s = S(), cloud = Cloud.ready(), inn = cloud && Cloud.signedIn();
    const PN = { google: '구글', kakao: '카카오', naver: '네이버', apple: 'Apple', email: '네이버' };
    const box = modal(`<h2>설정</h2>
      <div class="set-sec">계정</div>${inn ? `<div class="set-row"><span>☁️ ${PN[Cloud.provider()] || ''} 계정으로 저장 중</span><button class="btn dark" id="s-out">로그아웃</button></div>`
        : cloud ? '<div class="set-row"><span>👤 게스트 (이 기기에만 저장)</span><button class="btn" id="s-link">계정 연동</button></div>'
        : '<div class="set-row"><span>👤 이 기기에 저장 중<small class="set-sub">로그인 서버를 연결하면 계정 연동 · 로그아웃을 쓸 수 있어요</small></span><button class="btn dark" id="s-out0" disabled>로그아웃</button></div>'}
      <div class="set-sec">게임</div>
      <div class="set-row"><span>🌏 Language</span><button class="btn dark" id="s-lang" translate="no">${I18N.LANGS.find(l => l[0] === I18N.lang)[1]}</button></div>
      <div class="set-row"><span>${esc(s.name)} · ${s.kind === 'f' ? '여자' : '남자'} 차사</span><button class="btn dark" id="s-look">모습 바꾸기</button></div>${Board.online() ? `<div class="set-row"><span>닉네임 ${s.nickSet ? '「' + esc(s.name) + '」' : '(아직 없음)'}</span><button class="btn dark" id="s-nick">${s.nickSet ? '바꾸기' : '정하기'}</button></div>` : ''}
      ${Board.online() ? '<div class="set-row" id="s-blkrow" style="display:none"><span>🚫 차단한 사람 <b id="s-blkn">0</b>명</span><button class="btn dark" id="s-unblk">모두 풀기</button></div>' : ''}
      <div class="set-row"><span>효과음</span><button class="btn ${s.sound ? '' : 'dark'}" id="s-snd">${s.sound ? '켜짐' : '꺼짐'}</button></div>
      <div class="set-row"><span>배경음</span><button class="btn ${s.bgm ? '' : 'dark'}" id="s-bgm">${s.bgm ? '켜짐' : '꺼짐'}</button></div>
      ${Native.isApp() ? `<div class="set-row"><span>알림 <small class="set-sub">장부 가득 · 파견 완료 · 꽃 · 출석 (밤 11시~아침 8시 제외)</small></span><button class="btn ${s.push !== false && s.pushAsked ? '' : 'dark'}" id="s-push">${s.push !== false && s.pushAsked ? '켜짐' : '꺼짐'}</button></div>` : ''}
      <div class="set-row"><span>퇴치한 원귀 / 터치 수확</span><span>${s.stats.wraith} / ${s.stats.tap}</span></div>
      <div class="set-sec">고객 지원</div>
      <div class="set-links"><button class="btn dark" id="s-ask">💬 1:1 문의</button><button class="btn dark" id="s-priv">개인정보처리방침</button>${Native.isApp() ? '<button class="btn dark" id="s-restore">구매 복원</button>' : ''}<span id="s-adm"></span></div>
      <div class="set-sec">데이터</div>
      <div class="set-links">${inn ? '<button class="btn dark" id="s-del">계정 삭제</button>' : ''}<button class="btn dark" id="s-reset">${inn ? '이 기기 기록 지우기' : '처음부터'}</button></div>
      <p class="set-ver">저승사자 키우기 v${APP.version}${inn ? ` · ID ${String(Cloud.uid()).slice(0, 8)}` : ''}</p>
      <div class="acts"><button class="btn red" data-act="close">닫기</button></div>`);
    const on = (id, f) => { const b = box.querySelector(id); if (b) b.onclick = f; };
    on('#s-nick', () => { closeModal(); nickModal(); });
    on('#s-link', () => { closeModal(); loginScreen(true); });
    on('#s-out', () => confirmBox('<h2>로그아웃</h2><p>기록은 계정에 저장돼요.<br>다시 로그인하면 이어서 할 수 있어요.</p>', async () => {
      toast('저장하는 중…', 1500);
      const ok = await Cloud.pushSave(S(), true);
      if (!ok) { toast('서버에 저장하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요', 3000); return; }
      await Cloud.signOut(); Game.reset(); location.reload();
    }, '로그아웃'));
    on('#s-del', () => confirmBox('<h2>계정 삭제</h2><p>계정과 <b style="color:var(--red)">모든 게임 기록 · 순위 · 집무실 · 방명록 · 문의 내역</b>이 영구히 지워져요.<br>구매한 상품도 되돌릴 수 없어요.</p>', () => setTimeout(() =>
      confirmBox('<h2>정말 삭제할까요?</h2><p>삭제하면 복구할 수 없어요.</p>', async () => {
        toast('계정을 삭제하는 중…', 2000);
        try { await Cloud.deleteAccount(); } catch (e) { toast('삭제하지 못했어요. 잠시 후 다시 시도하거나 1:1 문의로 알려 주세요', 3200); return; }
        Game.reset(); toast('계정을 삭제했어요', 2000); setTimeout(() => location.reload(), 1200);
      }, '영구 삭제'), 50), '계속'));
    on('#s-ask', () => { closeModal(); askModal(); });
    on('#s-priv', () => { closeModal(); privacyModal(); });
    on('#s-restore', () => { closeModal(); restoreModal(); });
    on('#s-look', () => charSelect(false));
    on('#s-lang', () => { closeModal(); langPicker(false); });
    if (Board.online()) Board.blockedCount().then(n => { const r = box.querySelector('#s-blkrow'); if (r && n) { r.style.display = ''; box.querySelector('#s-blkn').textContent = n; } }).catch(() => {});
    on('#s-unblk', () => confirmBox('<h2>차단 풀기</h2><p>차단한 사람을 모두 풀까요?</p>', async () => { await Board.unblockAll(); toast('차단을 모두 풀었어요'); }, '모두 풀기'));
    on('#s-push', async () => {
      if (s.push !== false && s.pushAsked) { s.push = false; Game.save(); settings(); return; }
      s.pushAsked = true; const ok = (await Native.notifyPerm()) === 'granted' || (await Native.notifyAsk());
      s.push = ok; Game.save(); if (!ok) toast('휴대폰 설정 → 앱 → 저승사자 키우기 → 알림을 켜 주세요', 3000); settings();
    });
    on('#s-snd', () => { s.sound = !s.sound; Sound.set(s.sound, s.bgm); Game.save(); settings(); });
    on('#s-bgm', () => { s.bgm = !s.bgm; Sound.set(s.sound, s.bgm); Game.save(); settings(); });
    on('#s-reset', () => confirmBox(`<h2>${inn ? '이 기기 기록 지우기' : '처음부터'}</h2><p>${inn ? '이 기기의 기록만 지워요. 계정에 저장된 기록은 남아 있어요.' : '모든 진행이 지워집니다. 정말 할까요?'}</p>`, () => { if (inn) { Game.reset(); location.reload(); return; } Game.reset(); render(); charSelect(true); }));
    if (Board.online()) Board.checkOwner().then(o => {
      const h = box.querySelector('h2'); if (!o || !h || !document.body.contains(h)) return;
      h.insertAdjacentHTML('afterend', '<p class="adm-badge">🛡️ 운영자 모드 · 📢 공지 쓰기 / 📮 전체 우편 보내기를 쓸 수 있어요</p>');
      const a = box.querySelector('#s-adm'); if (a && inn) { a.outerHTML = '<button class="btn" id="s-inq">📨 문의 답변</button>'; on('#s-inq', () => { closeModal(); inquiryAdmin(); }); }
    });
  }
  // ---------- 개인정보처리방침 ----------
  function privacyModal() {
    modal(`<h2>개인정보처리방침</h2><iframe class="priv-frame" src="${APP.privacyUrl}?lang=${I18N.lang}" title="개인정보처리방침"></iframe><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
  }
  // ---------- 1:1 문의 ----------
  const ASK_CAT = ['결제', '오류 · 버그', '계정 · 로그인', '제안', '기타'];
  const agoT = t => ago(new Date(t).getTime());
  async function askModal() {
    if (!(Cloud.ready() && Cloud.signedIn())) {
      const mail = APP.supportEmail;
      const box = modal(`<h2>💬 1:1 문의</h2><p>로그인하면 게임 안에서 문의하고 답변을 받을 수 있어요.</p>${mail ? `<p class="mute">또는 이메일로 보내 주세요<br><b style="color:var(--gold)">${esc(mail)}</b></p>` : ''}
        <div class="acts">${mail ? '<button class="btn dark" id="ak-mail">이메일 보내기</button>' : ''}${Cloud.ready() ? '<button class="btn" id="ak-login">로그인</button>' : ''}<button class="btn dark" data-act="close">닫기</button></div>`);
      const m = box.querySelector('#ak-mail'); if (m) m.onclick = () => { location.href = `mailto:${mail}?subject=${encodeURIComponent('[저승사자 키우기] 문의')}&body=${encodeURIComponent(`\n\n---\n닉네임: ${S().name}\n버전: ${APP.version} (${Native.platform()})`)}`; };
      const l = box.querySelector('#ak-login'); if (l) l.onclick = () => { closeModal(); loginScreen(true); };
      return;
    }
    let cat = ASK_CAT[0];
    const box = modal(`<h2>💬 1:1 문의</h2><p class="mute">운영자가 확인하고 이곳에 답변을 남겨요.</p>
      <div class="ask-cats">${ASK_CAT.map(c => `<button data-cat="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div>
      <textarea id="ak-body" maxlength="1000" rows="5" placeholder="어떤 일이 있었는지 자세히 적어 주세요.&#10;결제 문의는 주문 번호(영수증)를 함께 적어 주시면 빨라요."></textarea>
      <div class="acts"><button class="btn red" id="ak-send">보내기</button></div>
      <div class="set-sec">내 문의</div><div class="ask-list" id="ak-list"><p class="mute">불러오는 중…</p></div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; box.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); });
    const load = async () => {
      const el = box.querySelector('#ak-list'); if (!el) return;
      try { const rows = await Cloud.inquiry.mine(); el.innerHTML = rows.length ? rows.map(r => `<div class="ask-item"><div class="ask-h"><em>${esc(r.category)}</em><small>${agoT(r.created_at)}</small><b class="${r.reply ? 'done' : ''}">${r.reply ? '답변 완료' : '확인 중'}</b></div><p>${esc(r.body)}</p>${r.reply ? `<div class="ask-reply"><b>운영자</b><p>${esc(r.reply)}</p></div>` : ''}</div>`).join('') : '<p class="mute">아직 보낸 문의가 없어요</p>'; }
      catch (e) { el.innerHTML = '<p class="mute">불러오지 못했어요</p>'; }
    };
    box.querySelector('#ak-send').onclick = async e => {
      const t = box.querySelector('#ak-body').value.trim(); if (t.length < 5) { toast('내용을 5자 이상 적어 주세요'); return; }
      e.target.disabled = true;
      try { await Cloud.inquiry.send(cat, t, S().name, `${Native.platform()} · v${APP.version} · 계급 ${S().rank} · ${navigator.userAgent.slice(0, 150)}`); box.querySelector('#ak-body').value = ''; toast('문의를 보냈어요. 답변이 오면 여기에서 볼 수 있어요', 2600); load(); }
      catch (err) { toast('보내지 못했어요. 잠시 후 다시 시도해 주세요', 2400); }
      e.target.disabled = false;
    };
    load();
  }
  async function inquiryAdmin(all) {
    const box = modal(`<h2>📨 문의 답변</h2><div class="ask-cats"><button id="ia-open" class="${all ? '' : 'on'}">답변 대기</button><button id="ia-all" class="${all ? 'on' : ''}">전체</button></div><div class="ask-list" id="ia-list"><p class="mute">불러오는 중…</p></div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#ia-open').onclick = () => { closeModal(); inquiryAdmin(false); };
    box.querySelector('#ia-all').onclick = () => { closeModal(); inquiryAdmin(true); };
    const el = box.querySelector('#ia-list');
    let rows = []; try { rows = await Cloud.inquiry.all(!all); } catch (e) { el.innerHTML = '<p class="mute">불러오지 못했어요</p>'; return; }
    el.innerHTML = rows.length ? rows.map(r => `<div class="ask-item"><div class="ask-h"><em>${esc(r.category)}</em><small>${esc(r.nick || '')} · ${agoT(r.created_at)}</small><b class="${r.reply ? 'done' : ''}">${r.reply ? '답변 완료' : '대기'}</b></div><p>${esc(r.body)}</p><small class="mute ask-info">${esc(r.info || '')} · ${esc(String(r.user_id).slice(0, 8))}</small>
      ${/^report\|/.test(r.info || '') ? `<div class="acts rep-mod"><button class="btn" data-mod="${esc(r.info)}">이 글 숨기기</button><button class="btn red" data-mod="${esc(r.info)}" data-ban="1">작성자 방명록 금지</button></div>` : ''}
      <textarea data-rid="${r.id}" rows="3" maxlength="1000" placeholder="답변 쓰기">${esc(r.reply || '')}</textarea><div class="acts"><button class="btn" data-reply="${r.id}">답변 ${r.reply ? '고치기' : '보내기'}</button></div></div>`).join('') : '<p class="mute">답변할 문의가 없어요 👍</p>';
    el.querySelectorAll('[data-mod]').forEach(b => b.onclick = async () => { const [, by, office] = b.dataset.mod.split('|'); try { await Board.modHide(by, office, !!b.dataset.ban); toast(b.dataset.ban ? '이 사람은 이제 방명록을 쓸 수 없어요' : '이 글을 숨겼어요'); } catch (e) { toast('처리하지 못했어요 (schema.sql 을 다시 실행했는지 확인)'); } });
    el.querySelectorAll('[data-reply]').forEach(b => b.onclick = async () => {
      const t = el.querySelector(`[data-rid="${b.dataset.reply}"]`).value.trim(); if (!t) return;
      try { await Cloud.inquiry.reply(+b.dataset.reply, t); toast('답변을 보냈어요'); closeModal(); inquiryAdmin(all); } catch (e) { toast('보내지 못했어요'); }
    });
  }
  function attendModal() {
    const st = Game.attendState(), cur = st.can ? st.streak : S().attend.streak;
    const box = modal(`<h2>출석부</h2><p>매일 들러 옥을 받아가세요. 7일째엔 큰 보상!</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0">${ATTEND.map((r, i) => `<div class="pbox" style="padding:6px 2px;font-size:10px;${i < cur ? 'opacity:.45' : ''}${st.can && i === st.streak ? ';box-shadow:0 0 0 2px var(--gold)' : ''}">${i + 1}일<br><img class="px" src="${IC('jade', 3)}" style="width:20px;margin:3px 0"><br>${r}${i < cur ? '<br>✔' : ''}</div>`).join('')}</div>
      <div class="acts"><button class="btn red" id="a-go" ${st.can ? '' : 'disabled'}>${st.can ? '출석하기' : '내일 또 만나요'}</button></div>`);
    box.querySelector('#a-go').onclick = () => { const r = Game.attend(); if (r) { Sound.play('buy'); closeModal(); got(`출석 보상 옥 +${r}`, { ic: 'jade' }); } };
  }

  // ---------- 스토리 ----------
  const nameFill = t => t.replace(/\{name\}/g, S().name || '차사');
  function portrait(sp) {
    const k = 'por' + sp + (sp === 'me' ? S().kind + S().rank : '');
    if (urls[k]) return urls[k];
    const dark = c0 => { const d = document.createElement('canvas'); d.width = c0.width; d.height = c0.height; const x2 = d.getContext('2d'); x2.filter = 'grayscale(1) brightness(0.55) sepia(1) hue-rotate(230deg) saturate(2.2)'; x2.drawImage(c0, 0, 0); return d; };
    const c = sp === 'me' ? SP.reaper(S().kind || 'm', S().rank, 'idle', 0) : sp === 'gangrim' ? SP.reaper('m', 4, 'idle', 0) : sp === 'yeomra' ? SP.reaper('m', 8, 'idle', 0) : sp === 'wraith' ? SP.wraith(0)
      : sp === 'judge' ? SP.reaper('m', 5, 'idle', 0) : sp === 'muk' ? dark(SP.reaper('m', 6, 'idle', 0)) : sp === 'minion' ? SP.mini('idle', 0) : sp === 'sib' ? SP.npc('elder') : sp === 'kkachi' ? SP.pet(PETS.find(p => p.id === 'kkachi'), 0) : SP.npc(sp);
    return (urls[k] = toURL(c, 5));
  }
  function talk(lines, done) {
    let i = 0;
    const o = overlay(`<div class="tk-bg"></div><div class="tk-box"><img class="px tk-por" id="tk-por"><div class="tk-txt"><b id="tk-name"></b><p id="tk-line"></p><small>터치해서 계속 ▶</small></div></div>`);
    const show = () => {
      const [sp, txt] = lines[i];
      const narr = sp === 'narr'; o.classList.toggle('narr', narr);
      if (!narr) { $('#tk-por').src = portrait(sp); $('#tk-por').classList.toggle('flip', sp !== 'me'); }
      $('#tk-name').textContent = narr ? '' : nameFill(SPEAKERS[sp]); $('#tk-line').textContent = nameFill(txt);
      Sound.play('open');
    };
    show();
    o.onclick = () => { i++; if (i >= lines.length) { o.onclick = null; closeOverlay(); done && done(); } else show(); };
  }
  function storyIntro() {
    const c = Story.cur(); if (c.end || c.intro) return;
    const o = overlay(`<div class="tk-bg"></div><div class="ch-card"><small>제 ${c.ch + 1}장</small><b>${c.C.title}</b></div>`); Sound.play('promote');
    setTimeout(() => talk(c.C.intro, () => { Story.seenIntro(); if (S().tut === 0) tutStart(); else newQuestToast(); }), 1600);
  }
  function newQuestToast() { const c = Story.cur(); if (c.end || c.done) return; toast(`📜 새 퀘스트: ${c.Q.t}`, 4500, questHelp(c.Q) ? [{ label: '🧭 바로 가기', cls: '', fn: () => questGo(Story.cur().Q) }] : undefined); }
  function storyBar() {
    const c = Story.cur(), e = $('#story-bar');
    if (c.end) { e.innerHTML = '📜 이야기 완결 · 윤회로 새 생을'; e.classList.remove('done'); return; }
    e.innerHTML = `<span>📜 ${c.ch + 1}장</span> ${c.Q.t} <b>${fmt(c.have)}/${fmt(c.need)}</b>${c.done ? '<i class="sb-claim"> · 보상 받기!</i>' : ''}`;
    e.classList.toggle('done', c.done);
  }
  function storyTap() {
    const c = Story.cur(); if (c.end) return;
    if (!c.intro) { storyIntro(); return; }
    if (c.done) {
      const R = c.Q.r, res = Story.claim(); if (!res) return;
      Sound.play('promote');
      toast(`퀘스트 완료! ${Story.rewardText(R)}${res.got.souls ? ` (+${fmt(res.got.souls)})` : ''}`, 3000);
      if (res.chapterDone) { const gd = Decor.grantStory(res.doneCh); if (gd.length) setTimeout(() => toast(`🏮 이야기 기념 소품 「${gd.map(d => d.name).join(', ')}」을(를) 받았어요! 집무실을 꾸며 보세요`, 4200), 400); }
      if (res.chapterDone) talk(res.outro, () => res.mem ? memoryCard(res.mem, Story.memories().length, () => setTimeout(storyIntro, 300)) : setTimeout(storyIntro, 300));
      if (!res.chapterDone) setTimeout(newQuestToast, 900);
      storyBar(); return;
    }
    if (c.Q.k === 'clue') { if (S().tut !== 'done' && S().tut != null) return; Scene.focusClue(c.ch); toast('✦ 지도에서 빛나는 단서를 찾아 눌러 보세요', 2600); if (sheetOpen()) closeSheet(); return; }
    storyModal();
  }
  // 기억 조각 카드 (장을 끝낼 때)
  function memoryCard(m, n, done) {
    Sound.play('promote');
    const o = overlay(`<div class="tk-bg"></div><div class="mem-card"><small>기억 조각 ${n} / ${Story.memTotal}</small><div class="mem-ic">❖</div><b>「${nameFill(m.t)}」</b><p>${nameFill(m.d)}</p><button class="btn red" id="mem-ok">간직하기</button></div>`);
    o.querySelector('#mem-ok').onclick = () => { closeOverlay(); done && done(); };
  }
  function memoriesModal() {
    const ms = Story.memories();
    const box = modal(`<h2>❖ 기억 조각 ${ms.length}/${Story.memTotal}</h2><p class="mute">장을 끝낼 때마다 잃어버린 기억이 하나씩 돌아와요</p>
      <div class="mem-list">${STORY.map((C, i) => C.mem ? (i < S().story.ch ? `<div class="mem-row"><b>「${nameFill(C.mem.t)}」</b><p>${nameFill(C.mem.d)}</p></div>` : '<div class="mem-row lock"><b>「? ? ?」</b><p>아직 떠오르지 않은 기억</p></div>') : '').join('')}</div>
      <div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
  }
  function replayModal() {
    const n = Math.min(S().story.ch + 1, STORY.length);
    const box = modal(`<h2>📜 이야기 다시 보기</h2><div class="rp-list">${STORY.slice(0, n).map((C, i) => `<div class="rp-row"><span>제 ${i + 1}장 · ${C.title}</span><button class="btn" data-rp="${i}:intro">시작</button>${i < S().story.ch ? `<button class="btn dark" data-rp="${i}:outro">끝</button>` : ''}</div>`).join('')}</div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelectorAll('[data-rp]').forEach(b => b.onclick = () => { const [i, k] = b.dataset.rp.split(':'); closeModal(); talk(STORY[+i][k]); });
  }
  // ---------- 메인 퀘스트 길잡이: 하는 방법 + 바로 가기 ----------
  const QUEST_HELP = {
    'cnt.soul': ['떠다니는 혼령은 저승사자와 졸개가 알아서 거둬요. 직접 톡 누르면 더 빨리 모여요.', 'soul'],
    'cnt.tap': ['화면에 떠다니는 혼령을 손가락으로 톡 누르세요.', 'soul'],
    pen: ['아래 [성장] 탭에서 명부 필력의 강화 버튼을 눌러 경험치를 100%까지 채우세요.', 'grow'],
    lv: ['[성장] · [졸개] 탭에서 강화하면 업그레이드 레벨이 오르고, 그 합이 차사 레벨이에요. 싼 강화부터 눌러 보세요.', 'grow'],
    minion: ['아래 [졸개] 탭에서 졸개 차사 고용을 누르세요.', 'minion'],
    'cnt.wraith': ['원귀는 1~2분마다 나타나요. 나타나면 빠르게 연타해서 퇴치하세요!', 'wraith'],
    clue: ['지도 위에서 빛나는 ✦ 단서를 찾아 누르세요.', 'clue'],
    rank: ['[승진] 탭에서 차사 레벨 조건을 채우면 승진하기 버튼으로 바로 승진해요.', 'rank'],
    rankNow: ['[승진] 탭에서 차사 레벨 조건을 채우면 승진하기 버튼으로 바로 승진해요.', 'rank'],
    pets: ['아래 [영물] 탭에서 소환권이나 옥으로 영물을 불러오세요.', 'pet'],
    'cnt.prop': ['지도의 나무 · 항아리 · 장승 위에 반짝임이 뜨면 눌러서 살펴보세요.', 'prop'],
    dex: ['가끔 나타나는 특별한 혼령을 거두거나 파견 보상으로 얻으면 도감에 등록돼요.', 'dex'],
    'cnt.harvest': ['[생활] → 꽃밭에서 씨앗을 심고, 다 자라면 눌러서 수확하세요.', 'garden'],
    'cnt.brew': ['[생활] → 주막에서 꽃으로 탕약을 달이세요. 꽃이 없으면 꽃밭에서 먼저 수확해요.', 'tavern'],
    'cnt.send': ['[생활] → 파견에서 순찰지를 골라 졸개를 보내세요.', 'expe'],
    'cnt.parade': ['백귀야행은 30분마다 찾아와요 (하루 5번). 오른쪽 👹 버튼에 표시가 뜨면 눌러서 들어가세요.', 'parade'],
    'cnt.judge': ['집무실에 들어가 망자 심판을 하세요. (하루 5명)', 'office'],
    reborn: ['[승진] 탭 아래쪽의 윤회하기를 누르세요.', 'rank'],
  };
  const questHelp = Q => QUEST_HELP[Q.k] || null;
  let guideEl = null, guideT = 0;
  function guideOff() { if (guideEl) { guideEl.remove(); guideEl = null; } clearTimeout(guideT); }
  // 손가락으로 가리키기: 선택자(요소) 또는 화면 좌표 {x, y}
  function guidePoint(t, ms = 5000) {
    guideOff();
    let r;
    if (typeof t === 'string') { const e = document.querySelector(t); if (!e) return; e.scrollIntoView && e.scrollIntoView({ block: 'nearest' }); r = e.getBoundingClientRect(); }
    else { const c = $('#stage').getBoundingClientRect(); r = { left: c.left + t.x - 20, top: c.top + t.y - 20, width: 40, height: 40 }; }
    guideEl = document.createElement('div'); guideEl.id = 'guide';
    guideEl.innerHTML = `<div class="gd-ring" style="left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"></div><div class="tut-hand" style="left:${r.left + r.width / 2 - 10}px;top:${r.top + r.height - 4}px">👆</div>`;
    document.body.appendChild(guideEl);
    guideT = setTimeout(guideOff, ms);
    setTimeout(() => addEventListener('pointerdown', guideOff, { once: true }), 300);
  }
  function questGo(Q) {
    const h = questHelp(Q); if (!h) return;
    closeModal();
    const g = h[1], inMenu = { grow: ['grow', '[data-buy="pen"]'], minion: ['minion', '[data-buy="minion"]'], rank: ['rank', '#tabs [data-tab="rank"]'], pet: ['pet', '[data-pull]'] }[g];
    if (Q.k === 'lv') { goTab('grow'); setTimeout(() => { const best = UPGRADES.filter(U => { const e = document.querySelector(`[data-buy="${U.id}"]`); return e && !e.disabled; }).sort((a, b) => Game.cost(a.id) - Game.cost(b.id))[0]; guidePoint(best ? `[data-buy="${best.id}"]` : '#tabs [data-tab="grow"]'); }, 350); }
    else if (inMenu) { goTab(inMenu[0]); setTimeout(() => guidePoint(document.querySelector(inMenu[1]) ? inMenu[1] : `#tabs [data-tab="${inMenu[0]}"]`), 350); }
    else if (g === 'garden' || g === 'tavern' || g === 'expe' || g === 'dex') { openLife(g); if (g === 'garden') Scene.focus('garden'); setTimeout(() => guidePoint(`[data-sub="${g}"]`, 3000), 350); }
    else if (g === 'clue') { if (sheetOpen()) closeSheet(); Scene.focusClue(Story.cur().ch); setTimeout(() => guidePoint(Scene.clueScreen(Story.cur().ch)), 200); toast('✦ 지도에서 빛나는 단서를 찾아 눌러 보세요', 2600); }
    else if (g === 'prop') { if (sheetOpen()) closeSheet(); const p = Scene.focusProp(); if (p) setTimeout(() => guidePoint(Scene.focusProp() || p), 200); else toast('지금은 살펴볼 소품이 없어요. 조금 뒤에 다시 반짝여요', 2600); }
    else if (g === 'soul') { if (sheetOpen()) closeSheet(); Scene.soulNear(); setTimeout(() => { const p = Scene.nearestSoul(); if (p) guidePoint(p, 3500); }, 150); }
    else if (g === 'wraith') { if (sheetOpen()) closeSheet(); toast(`👻 다음 원귀까지 약 ${Math.max(1, Math.ceil(nextWraith))}초. 나타나면 연타!`, 3000); }
    else if (g === 'parade') { if (sheetOpen()) closeSheet(); guidePoint('#btn-parade'); const pl = (S().parade.next - Date.now()) / 1000; toast(parade ? '백귀야행 진행 중!' : pl > 0 ? `👹 백귀야행까지 ${fmtClock(pl)}` : '👹 지금 백귀야행에 들어갈 수 있어요!', 3000); }
    else if (g === 'office') { if (sheetOpen()) closeSheet(); if (S().rank < 1) { toast('집무실은 말단 차사로 승진하면 열려요', 2600); return; } if (!Scene.inOffice()) guidePoint('#btn-office'); else guidePoint('#of-judge'); }
  }
  function storyModal() {
    const c = Story.cur();
    const box = modal(`<h2>제 ${c.ch + 1}장 · ${c.C.title}</h2>
      ${c.C.quests.map((q, i) => `<div class="qrow pbox ${i < c.q ? 'mute' : ''}"><div class="info"><b>${i < c.q ? '✔ ' : i === c.q ? '▶ ' : ''}${q.t}</b>${i === c.q ? ` <span class="mute">${fmt(c.have)}/${fmt(c.need)}</span><div class="bar"><i style="width:${Math.min(100, (c.have / c.need) * 100)}%"></i></div>` : ''}${i === c.q && !c.done && questHelp(q) ? `<div class="q-help">💡 <span>${questHelp(q)[0]}</span></div>` : ''}<div class="mute" style="font-size:10px;margin-top:3px">보상: ${Story.rewardText(q.r)}</div></div>${i === c.q && !c.done && questHelp(q) ? '<button class="btn red q-go" id="st-go">🧭 바로 가기</button>' : ''}</div>`).join('')}
      <div class="acts"><button class="btn dark" id="st-replay">이야기 다시 보기</button><button class="btn dark" id="st-mem">❖ 기억 ${Story.memories().length}/${Story.memTotal}</button><button class="btn red" data-act="close">닫기</button></div>`);
    box.querySelector('#st-replay').onclick = () => { closeModal(); replayModal(); };
    const go = box.querySelector('#st-go'); if (go) go.onclick = () => questGo(c.Q);
    box.querySelector('#st-mem').onclick = () => { closeModal(); memoriesModal(); };
  }

  // ---------- 튜토리얼 (처음 시작할 때 손가락으로 안내) ----------
  const TUT = [
    { text: '떠도는 <b>혼령</b>을 톡 눌러 거둬 보세요!', target: 'soul', ev: 'tap' },
    { text: '<b>땅</b>을 누르면 저승사자가 그곳으로 걸어가요. 한 번 눌러 보세요!', target: 'ground', ev: 'move' },
    { text: '모은 혼으로 <b>명부 필력</b>을 올리면 혼을 더 많이 거둬요. 눌러 보세요!', target: '[data-buy="pen"]', ev: 'buy', grant: 'souls', tab: 'grow' },
    { text: '아래 <b>영물</b> 탭을 눌러 보세요. 저승사자를 돕는 영물이 있어요!', target: '#tabs [data-tab="pet"]', ev: 'tab:pet' },
    { text: '첫 영물은 <b>무료</b>! 소환권으로 불러 보세요.', target: '[data-pull="ticket"]', ev: 'pull', grant: 'ticket' },
    { text: '화면 위 <b>퀘스트</b>를 따라가면 옥과 소환권을 받아요. 이제 마음껏 근무하세요!', target: '#story-bar', ev: 'ok', last: true },
  ];
  // 집무실 안내 (첫 승진 뒤)
  const OTUT = [
    { text: '승진 축하해요! 이제 <b>나만의 집무실</b>이 생겼어요. 오른쪽 <b>집무실</b> 버튼을 눌러 들어가 보세요.', target: '#btn-office', ev: 'office' },
    { text: '책상에 <b>결재 서류</b>가 쌓였어요. 2시간마다 1건씩 (최대 3건) 올라와요. 결재하면 <b>혼과 옥</b>을 받아요!', target: '#of-docs', ev: 'docs', grant: 'docs' },
    { text: '<b>부하 파견</b>: 부하를 보내면 꺼져 있는 동안에도 보상을 가져와요. 승진할수록 부하가 늘어 <b>파견 칸도 늘어나요</b>.', target: '#of-expe', ev: 'expe' },
    { text: '<b>망자 심판</b>: 생전 기록을 보고 극락·지옥을 가려요. 하루 5명! 맞히면 보상이 커요. 첫 망자를 심판해 보세요.', target: '#of-judge', ev: 'judge' },
  ];
  let tutEl = null, TL = TUT, TK = 'tut';
  function tutStart() { TL = TUT; TK = 'tut'; S().tut = 0; Game.save(); tutShow(); }
  function officeTutCheck() {
    const s = S(); if (!s.kind || tutEl || s.tut !== 'done' || s.otut === 'done' || s.rank < 1) return;
    if ($('#modal').classList.contains('on') || $('#promo').classList.contains('on') || parade) return;
    // 처음이면 0단계부터, 앱을 껐다 켜서 중간에 끊겼으면 이어서 (집무실 밖이면 '들어가기'부터 다시)
    const was = typeof s.otut === 'number' ? s.otut : 0;
    TL = OTUT; TK = 'otut'; s.otut = Scene.inOffice() ? Math.max(1, was) : 0; if (Scene.inOffice()) enterOffice(); Game.save(); tutShow();
  }
  function tutShow() {
    const st = TL[S()[TK]]; if (!st) return tutEnd();
    // 안내가 뜰 때는 열려 있는 창·아래 메뉴를 닫고 시작 (메뉴 안을 가리키는 단계는 유지)
    if ($('#modal').classList.contains('on')) closeModal();
    const inSheet = st.target.startsWith('[data-'); // [data-…] 대상은 아래 메뉴 안의 버튼
    if (!st.tab && !inSheet && sheetOpen()) closeSheet();
    if (st.tab && (tab !== st.tab || !sheetOpen())) goTab(st.tab);
    if (st.grant === 'souls') { const c = Game.cost('pen'); if (S().souls < c) Game.gain(c - S().souls); }
    if (st.grant === 'ticket' && !S().tickets) { S().tickets = 1; render(); }
    if (st.grant === 'docs' && !Life.docsCount()) { S().docs.last = Date.now() - 2 * 3600e3 - 1000; officeBar(); }
    if (st.target === 'soul') Scene.soulNear();
    if (!tutEl) { tutEl = document.createElement('div'); tutEl.id = 'tut'; document.body.appendChild(tutEl); }
    tutEl.innerHTML = `<div class="tut-spot"></div><div class="tut-hand">👆</div><div class="tut-box"><span class="tut-n">${TK === 'otut' ? '집무실 안내 ' : ''}${S()[TK] + 1}/${TL.length}</span><p>${I18N.on ? I18N.t(st.text.replace(/<[^>]+>/g, '')) : st.text}</p><div class="tut-acts">${st.last ? '<button class="btn red" id="tut-ok">시작하기</button>' : ''}<button class="tut-skip" id="tut-skip">안내 건너뛰기</button></div></div>`;
    tutEl.querySelector('#tut-skip').onclick = () => tutEnd();
    const ok = tutEl.querySelector('#tut-ok'); if (ok) ok.onclick = () => tutEv('ok');
    tutPlace();
  }
  function tutPlace() {
    if (!tutEl) return;
    const st = TL[S()[TK]]; if (!st) return;
    let r;
    if (st.target === 'soul' || st.target === 'ground') { const c = $('#stage').getBoundingClientRect(); const p = st.target === 'soul' ? Scene.nearestSoul() : Scene.groundSpot(); r = p ? { left: c.left + p.x - 22, top: c.top + p.y - 26, width: 44, height: 44 } : { left: c.left + c.width * 0.25, top: c.top + c.height * 0.55, width: c.width * 0.5, height: c.height * 0.3 }; }
    else { const e = document.querySelector(st.target); if (!e) return; r = e.getBoundingClientRect(); }
    const sp = tutEl.querySelector('.tut-spot'), hd = tutEl.querySelector('.tut-hand'), bx = tutEl.querySelector('.tut-box');
    sp.style.cssText = `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px`;
    hd.style.cssText = `left:${r.left + r.width / 2 - 10}px;top:${r.top + r.height - 4}px`;
    const below = r.top < innerHeight * 0.5;
    bx.style.cssText = below ? `top:${Math.min(innerHeight - 140, r.top + r.height + 40)}px` : `top:${Math.max(10, r.top - 130)}px`;
  }
  function tutEv(ev) {
    if (!tutEl) return;
    const st = TL[S()[TK]]; if (!st || st.ev !== ev) return;
    S()[TK]++; Game.save(); Sound.play('buy');
    if (S()[TK] >= TL.length) return tutEnd(true);
    setTimeout(tutShow, ev === 'pull' ? 3600 : 350);
  }
  function tutEnd(done) {
    S()[TK] = 'done'; if (tutEl) { tutEl.remove(); tutEl = null; }
    if (done && TK === 'tut') { S().jade += 50; toast('튜토리얼 완료! 옥 +50', 3000); }
    if (done && TK === 'otut') { S().jade += 30; S().tickets = (S().tickets || 0) + 1; setTimeout(() => toast('집무실 안내 완료! 옥 +30 · 소환권 +1<br>승진할수록 집무실이 넓어지고 부하가 늘어나요', 4000), 600); }
    TL = TUT; TK = 'tut'; Game.save();
  }
  // ---------- 승진 연출 ----------
  function overlay(html) { const o = $('#promo'); o.innerHTML = html; o.className = 'on'; return o; }
  function closeOverlay() { const o = $('#promo'); o.className = ''; o.innerHTML = ''; previews = previews.filter(p => document.body.contains(p.c)); }
  const sparks = (n, col) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 90 + Math.random() * 120; return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--d:${(Math.random() * 0.3).toFixed(2)}s;background:${Array.isArray(col) ? col[i % col.length] : col}"></i>`; }).join('');
  function promoted(newRegion, oldRank) {
    const R = RANKS[S().rank], O = RANKS[oldRank != null ? oldRank : S().rank - 1], gifts = Decor.grantRank(S().rank);
    Sound.play('promote');
    const o = overlay(`<div class="pr-bg"></div><div class="pr-rays"></div><div class="pr-sparks">${sparks(40, ['#ffd34a', '#ffffff', '#ff8a5a'])}</div>
      <div class="pr-box"><div class="pr-title">승 진</div>
        <div class="pr-char"><canvas class="pr-magic" id="pr-mg" width="48" height="24"></canvas><canvas id="pr-old" width="44" height="51"></canvas><canvas id="pr-new" width="44" height="51"></canvas><div class="pr-flash"></div></div>
        <div class="pr-rank">${R.name}</div><div class="pr-sub">${O.name} → ${R.name}</div>
        <div class="pr-info">수확량 <b>×${fmt(R.mult)}</b>${newRegion ? `<br>새 근무지 <b>${REGIONS[R.region].name}</b>(으)로 발령!` : ''}<br><span>옷차림이 바뀌었어요</span></div>
        ${gifts.length ? `<div class="pr-gift"><img class="px" src="${decoThumb(gifts[0].id, 3)}"><div><small>승진 기념 소품</small><b>${gifts[0].name}</b><span>집무실 꾸미기에서 놓을 수 있어요</span></div></div>` : ''}
        <div class="pr-mgcmp"><div><canvas id="pr-mg0" width="48" height="20"></canvas><small>${O.name}</small></div><b>▶</b><div><canvas id="pr-mg1" width="48" height="20"></canvas><small>새 마법진</small></div></div>
        <button class="btn red" id="pr-go">근무 시작</button></div>`);
    previews.push({ c: o.querySelector('#pr-old'), kind: S().kind, rank: O === R ? S().rank : oldRank, pose: 'idle', keep: 1 });
    previews.push({ c: o.querySelector('#pr-new'), kind: S().kind, rank: S().rank, pose: 'reap', keep: 1 });
    previews.push({ c: o.querySelector('#pr-mg'), magic: S().rank, anchor: o.querySelector('#pr-new'), keep: 1 }, { c: o.querySelector('#pr-mg0'), magic: O === R ? S().rank : oldRank, keep: 1 }, { c: o.querySelector('#pr-mg1'), magic: S().rank, keep: 1 });
    setTimeout(() => Sound.play('kill'), 1100);
    o.querySelector('#pr-go').onclick = () => { closeOverlay(); Sound.play('open'); };
  }

  // ---------- 펫 ----------
  function renderPet(P) {
    Pets.ensure();
    const s = S(), eq = s.petEq && s.pets[s.petEq] ? Pets.P(s.petEq) : null, own = Object.keys(s.pets).length;
    const stTxt = id => { const st = Pets.stats(id); return `수확량 +${Math.round(st[0] * 100)}% · 이동 +${Math.round(st[1] * 100)}% · 수확속도 +${Math.round(st[2] * 100)}%`; };
    let h = `<div class="petmain pbox">${eq ? `<canvas id="pet-big" ${PET_AURA[eq.g] ? 'class="pa" width="40" height="40"' : 'width="12" height="11"'}></canvas><div class="info"><div class="nm"><span class="gb" style="background:${PET_GRADES[eq.g].col}">${eq.g}</span> ${eq.name} <span class="stars">${'★'.repeat(s.pets[eq.id])}</span></div><div class="ds">${eq.desc}</div><div class="ds st">${stTxt(eq.id)}</div></div>` : '<div class="info"><div class="nm">소환한 영물이 없어요</div><div class="ds">아래에서 영물을 소환해 보세요. 소환하면 수확을 도와줘요.</div></div>'}</div>
      <div class="gacha pbox"><div class="gt">영물 소환</div><div class="gd">${PET_ORDER.slice(0, 5).map(g => `${g} ${+(PET_GRADES[g].rate * 100).toFixed(1)}%`).join(' · ')} · <b style="color:${PET_GRADES.SSS.col}">SSS ${+(PET_GRADES.SSS.rate * 100).toFixed(1)}%</b><br>SS 이상 확정까지 <b>${PITY - s.pity}</b>회 · 같은 영물은 <b>여분</b>으로 쌓여요</div>
        ${s.tickets ? `<button class="btn red ticket" data-pull="ticket">소환권으로 1회 <em>${s.tickets}장</em></button>` : ''}
        <div class="gb3"><button class="btn" data-pull="ad" ${Pets.adLeft() > 0 ? '' : 'disabled'}>무료 1회<em>AD ${Pets.adLeft()}/2</em></button>
        <button class="btn jade" data-pull="1" ${s.jade >= PULL_COST[1] ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${PULL_COST[1]} · 1회</button>
        <button class="btn red" data-pull="10" ${s.jade >= PULL_COST[10] ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">${PULL_COST[10]} · 10회</button></div><div class="gd">10회 소환은 A등급 이상 1마리 확정</div></div>
      <div class="ph"><h3>영물 도감</h3><span class="sub">${own}/${PETS.length}종 · 수확량 +${+(own * 0.5).toFixed(1)}%</span></div><div class="petgrid">`;
    h += PETS.slice().sort((a, b) => PET_ORDER.indexOf(a.g) - PET_ORDER.indexOf(b.g)).map(p => { const st = s.pets[p.id], inv = s.petInv[p.id] || 0, canUp = st && st < 5 && inv >= Pets.starCost(p.id); return `<button class="pcell pbox ${st ? '' : 'unk'} ${s.petEq === p.id ? 'eq' : ''}" data-pet="${p.id}" style="--gc:${PET_GRADES[p.g].col}"><span class="gb" style="background:${PET_GRADES[p.g].col}">${p.g}</span>${inv ? `<span class="pinv ${canUp ? 'up' : ''}">×${inv}</span>` : ''}${st && PET_AURA[p.g] ? `<canvas class="px pa" data-pa="${p.id}" width="40" height="40"></canvas>` : `<img class="px" src="${petIcon(p, !!st)}">`}<b>${st ? p.name : '???'}</b><small>${st ? '★'.repeat(st) : ''}${s.petEq === p.id ? ' 소환 중' : ''}</small></button>`; }).join('');
    h += '</div><div class="ph"><h3>영물 합성</h3><span class="sub">같은 등급 여분 3마리 → 1마리</span></div><div class="fuse pbox">';
    h += Object.keys(Pets.FUSE_UP).map(g => { const n = Pets.spares(g), k = Math.floor(n / Pets.FUSE_N), nx = PET_ORDER[PET_ORDER.indexOf(g) + 1]; return `<div class="frow"><span class="gb" style="background:${PET_GRADES[g].col}">${g}</span><div class="fi"><b>여분 ${n}마리</b><small>${Math.round(Pets.FUSE_UP[g] * 100)}% 확률로 <i style="color:${PET_GRADES[nx].col}">${nx}</i> 등급!</small></div><button class="btn jade" data-fuse="${g}:1" ${k ? '' : 'disabled'}>1회</button><button class="btn red" data-fuseall="${g}" ${k ? '' : 'disabled'}>모두 합성</button></div>`; }).join('');
    const anyFuse = Object.keys(Pets.FUSE_UP).some(g => Pets.spares(g) >= Pets.FUSE_N);
    h += `<button class="btn red fuse-all" data-fuseall="ALL" ${anyFuse ? '' : 'disabled'}>✨ 전체 등급 모두 합성 (C → SS)</button>`;
    P.innerHTML = h + '</div><p class="note">칸을 누르면 소환하기 · 별 올리기를 할 수 있어요. 여분은 별 올리기(★2←1마리 … ★5←4마리)나 합성에 써요. 합성은 ★5 영물의 여분부터 먼저 써요.</p>';
    if (eq) previews.push({ c: $('#pet-big'), pet: eq, aura: PET_AURA[eq.g] ? s.pets[eq.id] : 0 });
    P.querySelectorAll('canvas[data-pa]').forEach(c => previews.push({ c, pet: Pets.P(c.dataset.pa), aura: s.pets[c.dataset.pa] || 1 }));
  }
  function petIcon(p, known) { const k = 'pi' + p.id + known; if (urls[k]) return urls[k]; let c = SP.pet(p, 0); if (!known) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; const g = d.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#2a2444'; g.fillRect(0, 0, d.width, d.height); c = d; } return (urls[k] = toURL(c, 4)); }
  function doPull(kind, opt) {
    if (kind === 'ad') { ad(() => { const r = Pets.adPull(); if (r) gachaShow(r); render(); }); return; }
    if (kind === 'ticket') { if (S().tickets <= 0) return; S().tickets--; const r = Pets.pull(1, true); gachaShow(r); render(); tutEv('pull'); return; }
    if (!opt || !opt.ok) { askBuy('영물 소환', `영물을 ${kind}회 소환할까요?`, PULL_COST[kind], 0, () => doPull(kind, { ok: true })); return; }
    const r = Pets.pull(+kind); if (!r) { Sound.play('no'); toast('옥이 부족해요'); return; }
    gachaShow(r); render(); tutEv('pull');
  }
  function petInfo(id) {
    const p = Pets.P(id), s = S(), st = s.pets[id];
    if (!st) { modal(`<div class="pinfo"><h2><span class="gb" style="background:${PET_GRADES[p.g].col}">${p.g}</span> ???</h2><p class="mute">${p.g}등급 영물</p><p class="lore">아직 만나지 못한 영물이에요. 영물 소환으로 만날 수 있어요.</p></div><div class="acts"><button class="btn dark" data-act="close">닫기</button></div>`); return; }
    const inv = s.petInv[id] || 0, c = Pets.starCost(id), sv = Pets.stats(id);
    const box = modal(`<div class="pinfo"><canvas id="pi-big" ${PET_AURA[p.g] ? 'class="pa" width="40" height="40"' : 'width="12" height="11"'}></canvas><h2><span class="gb" style="background:${PET_GRADES[p.g].col}">${p.g}</span> ${p.name}</h2><div class="stars">${'★'.repeat(st)}${'☆'.repeat(5 - st)}</div><p class="mute">${p.desc}</p>${PET_LORE[id] ? `<p class="lore">${PET_LORE[id]}</p>` : ''}
      <p class="mute">수확량 +${Math.round(sv[0] * 100)}% · 이동 +${Math.round(sv[1] * 100)}% · 수확속도 +${Math.round(sv[2] * 100)}%<br>여분 <b style="color:var(--gold)">${inv}</b>마리${st < 5 ? `<br>별 올리기에 ${c}마리 필요 (능력치 +15%)` : ' · 최대 별!'}</p></div>
      <div class="acts"><button class="btn" id="pi-eq" ${s.petEq === id ? 'disabled' : ''}>${s.petEq === id ? '소환 중' : '소환하기'}</button><button class="btn red" id="pi-up" ${st < 5 && inv >= c ? '' : 'disabled'}>★ 올리기</button><button class="btn dark" data-act="close">닫기</button></div>`);
    previews.push({ c: box.querySelector('#pi-big'), pet: p, aura: PET_AURA[p.g] ? st : 0 });
    box.querySelector('#pi-eq').onclick = () => { Pets.equip(id); Sound.play('buy'); toast(`${p.name}을(를) 소환했어요`); closeModal(); render(); };
    box.querySelector('#pi-up').onclick = () => { if (Pets.starUp(id)) { Sound.play('promote'); toast(`${p.name} ★${S().pets[id]}!`); closeModal(); render(); petInfo(id); } };
  }
  // 모두 합성: 결과가 많으면 눈에 띄는 것(등급 상승 · 새 영물 · 높은 등급)만 카드로, 나머지는 요약
  function fuseAllGo(grades) {
    const r = Pets.fuseAll(grades); if (!r) { toast('합성할 여분이 부족해요 (같은 등급 3마리 필요)'); return; }
    const ups = r.filter(x => x.up).length, news = r.filter(x => x.isNew).length;
    const pick = r.map((x, i) => ({ x, i, k: (x.up ? 100 : 0) + (x.isNew ? 50 : 0) + PET_ORDER.indexOf(Pets.P(x.id).g) })).sort((a, b) => b.k - a.k || a.i - b.i).slice(0, 10).map(o => o.x);
    gachaShow(pick, { fuse: grades[grades.length - 1], fuseAll: grades, total: r.length, ups, news }); render();
  }
  function gachaShow(res, opt) {
    opt = opt || {};
    const best = res.reduce((m, r) => Math.max(m, PET_ORDER.indexOf(Pets.P(r.id).g)), 0), bg = PET_ORDER[best], col = PET_GRADES[bg].col;
    const motes = Array.from({ length: 26 }, () => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2.5 + Math.random() * 2).toFixed(2)}s"></i>`).join('');
    const ring = `<svg viewBox="0 0 200 200" class="gs-ring"><circle cx="100" cy="100" r="92" /><circle cx="100" cy="100" r="78" class="thin"/>${Array.from({ length: 8 }, (_, k) => { const a = k * Math.PI / 4, x = 100 + Math.cos(a) * 85, y = 100 + Math.sin(a) * 85; return `<g transform="translate(${x} ${y}) rotate(${k * 45 + 90})"><rect x="-5" y="-1.5" width="10" height="3"/><rect x="-5" y="2.5" width="4" height="3"/><rect x="1" y="2.5" width="4" height="3"/></g>`; }).join('')}<circle cx="100" cy="100" r="40" class="thin"/></svg>`;
    Sound.play('open');
    const o = overlay(`<div class="gs-bg" style="--c:${col}"></div><div class="gs-motes">${motes}</div>
      <div class="gs-stage" style="--c:${col}">${ring}<div class="gs-talisman"><b>召</b><span></span></div><div class="gs-pillar ${best >= 4 ? 'rainbow' : ''}"></div><div class="gs-flash"></div></div>
      <div class="gs-cards n${res.length} ${res.length > 10 ? 'many' : ''}" style="${res.length > 1 && res.length !== 10 ? `grid-template-columns:repeat(${Math.min(5, res.length)},1fr)` : ''}">${res.map((r, i) => { const p = Pets.P(r.id), c = PET_GRADES[p.g].col; return `<div class="gs-card gr-${p.g}" style="--c:${c};--i:${i}"><div class="gs-in"><div class="gs-back"><b>靈</b></div><div class="gs-front"><span class="gb" style="background:${c}">${p.g}</span><canvas width="12" height="11" data-gp="${r.id}"></canvas><b>${p.name}</b><small>${r.up ? (r.isNew ? '등급UP·NEW' : '등급 UP!') : r.isNew ? 'NEW!' : '여분 +1'}</small></div></div></div>`; }).join('')}</div>
      <button class="gs-skip2" id="gs-skip">건너뛰기 ▶▶</button>${opt.fuse ? `<div class="gs-fuse">${opt.total ? `합성 ${opt.total}회 · 등급 상승 ${opt.ups}${opt.news ? ` · 새 영물 ${opt.news}` : ''}` : res.some(r => r.up) ? '✨ 등급 상승 성공!' : '영물 합성 완료'}</div>` : ''}
      <div class="gs-acts ${opt.fuse ? 'fz' : ''}"><button class="btn jade" id="gs-one">1회 더<em>${S().tickets ? '소환권' : '옥 ' + PULL_COST[1]}</em></button><button class="btn red" id="gs-ten">10회 더<em>옥 ${PULL_COST[10]}</em></button><button class="btn dark" id="ga-close">확인</button></div>`);
    o.querySelectorAll('[data-gp]').forEach(c => previews.push({ c, pet: Pets.P(c.dataset.gp), keep: 1 }));
    setTimeout(() => Sound.play('wraith'), 500);
    setTimeout(() => Sound.play(best >= 4 ? 'promote' : best >= 2 ? 'kill' : 'buy'), 1500);
    o.querySelector('#ga-close').onclick = () => { closeOverlay(); render(); };
    // 연출이 끝나야 아래 버튼이 눌림 (연타로 다음 뽑기가 바로 시작되지 않게). 건너뛰기는 같은 자리에 있다가 버튼으로 바뀜
    let shown = false; const tok = o.dataset.gs = String(Math.random());
    const showActs = delay => setTimeout(() => { if (shown || o.dataset.gs !== tok || !o.querySelector('.gs-acts')) return; shown = true; const sk = o.querySelector('#gs-skip'); if (sk) sk.remove(); o.classList.add('acts-on'); }, delay);
    showActs(2900);
    o.querySelector('#gs-skip').onclick = () => { if (o.classList.contains('skip')) return; o.classList.add('skip'); o.querySelector('#gs-skip').disabled = true; showActs(700); };
    if (opt.fuse) {
      const fg = opt.fuseAll || [opt.fuse], left = fg.reduce((a, g) => a + Pets.spares(g), 0), again = fg.some(g => Pets.spares(g) >= Pets.FUSE_N);
      o.querySelector('#gs-one').innerHTML = `1회 더<em>여분 ${Pets.spares(opt.fuse)}</em>`; o.querySelector('#gs-one').disabled = Pets.spares(opt.fuse) < Pets.FUSE_N;
      o.querySelector('#gs-one').onclick = () => { closeOverlay(); const r = Pets.fuse(opt.fuse, 1); if (r) gachaShow(r, { fuse: opt.fuse }); render(); };
      const te = o.querySelector('#gs-ten'); te.innerHTML = `모두 합성<em>여분 ${left}</em>`; te.disabled = !again; te.removeAttribute('data-short');
      te.onclick = () => { closeOverlay(); fuseAllGo(fg); };
      return;
    }
    o.querySelector('#gs-one').onclick = () => { closeOverlay(); doPull(S().tickets ? 'ticket' : '1'); };
    o.querySelector('#gs-ten').onclick = () => { closeOverlay(); doPull('10'); };
    if (!S().tickets && S().jade < PULL_COST[1]) o.querySelector('#gs-one').dataset.short = 'jade';
    if (S().jade < PULL_COST[10]) o.querySelector('#gs-ten').dataset.short = 'jade';
  }
  // ---------- 백귀야행 ----------
  // 백귀야행: 하루 5번 + 옥 120개로 하루 3번 더
  const PARADE_FREE = 5, PARADE_BUY = 3, PARADE_JADE = 120; // 하루 5번 + 옥으로 3번 더
  function paradeDay() { const pr = S().parade, d = new Date().toISOString().slice(0, 10); if (!pr.day || pr.day.d !== d) pr.day = { d, n: 0, buy: 0 }; return pr.day; }
  const paradeMidnight = () => Date.parse(paradeDay().d) + 864e5;
  function paradeAsk() {
    if (parade) return;
    const pr = S().parade, pd = paradeDay(), left = (pr.next - Date.now()) / 1000;
    if (pd.n >= PARADE_FREE) {
      const bl = PARADE_BUY - pd.buy;
      const box = modal(`<h2>백귀야행</h2><p>오늘 백귀야행 ${PARADE_FREE}번을 모두 마쳤어요.<br>옥으로 행렬을 한 번 더 부를 수 있어요. (하루 ${PARADE_BUY}번)</p>
        <p class="mute">오늘 추가 ${pd.buy}/${PARADE_BUY} · 보유 옥 ${fmt(S().jade)}</p>
        <div class="acts">${bl > 0 ? `<button class="btn jade" id="pa-buy" ${S().jade >= PARADE_JADE ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">옥 ${PARADE_JADE}개로 1번 더</button>` : '<button class="btn" disabled>오늘은 끝 · 내일 다시</button>'}<button class="btn dark" data-act="close">닫기</button></div>`);
      const b = box.querySelector('#pa-buy'); if (b) b.onclick = () => { if (S().jade < PARADE_JADE) { Sound.play('no'); toast('옥이 부족해요'); return; } S().jade -= PARADE_JADE; closeModal(); startParade(true); };
      return;
    }
    if (left <= 0) {
      const box = modal(`<h2>👹 백귀야행</h2><p>귀신 행렬이 지나가며 혼령이 쏟아지는 밤!<br>25초 동안 지나가는 귀신과 혼령을 마구 터치해 콤보를 쌓으세요.</p><p>백귀야행을 부를까요?</p>
        <div class="acts col"><button class="btn red" id="pa-go">부르기<em>${PARADE_FREE - pd.n}/${PARADE_FREE}</em></button><button class="btn dark" data-act="close">닫기</button></div>`);
      box.querySelector('#pa-go').onclick = () => { closeModal(); startParade(); };
      return;
    }
    const today = new Date().toISOString().slice(0, 10); if (pr.ad.day !== today) pr.ad = { day: today, n: 0 };
    const box = modal(`<h2>백귀야행</h2><p>귀신 행렬이 지나가며 혼령이 쏟아지는 밤!<br>25초 동안 지나가는 귀신과 혼령을 마구 터치해 콤보를 쌓으세요.<br>금빛 귀신은 5배! 콤보가 높을수록 수확이 커져요 (최대 +400%).</p>
      <p>다음 행렬까지 <b style="color:var(--gold)">${fmtTime(left)}</b></p><p class="mute">오늘 ${pd.n}/${PARADE_FREE}번</p>
      <div class="acts col"><button class="btn red" id="pa-ad" ${pr.ad.n < 3 ? '' : 'disabled'}>광고 보고 바로 부르기<em>${3 - pr.ad.n}/3</em></button><button class="btn jade" id="pa-jade" ${S().jade >= Life.skipCost(left) ? '' : 'data-short="jade"'}><img class="px" src="${IC('jade', 2)}">옥 ${Life.skipCost(left)}개로 바로 부르기</button><button class="btn dark" data-act="close">닫기</button></div>`);
    box.querySelector('#pa-jade').onclick = () => { if (Life.skipJade('parade', 0)) { closeModal(); startParade(); } else { Sound.play('no'); toast('옥이 부족해요'); } };
    box.querySelector('#pa-ad').onclick = () => { closeModal(); ad(() => { pr.ad.n++; startParade(); }); };
  }
  function startParade(paid) {
    if (parade || test) return;
    parade = { t: 25, combo: 0, comboT: 0, max: 0, gained: 0, ghosts: 0 };
    const pd = paradeDay(); if (paid) pd.buy++; else pd.n++;
    S().parade.next = pd.n >= PARADE_FREE ? paradeMidnight() : Date.now() + 30 * 60e3; Game.save(); // 오늘 5번을 다 하면 다음 행렬은 내일
    Scene.config({ parade: true }); Sound.play('wraith'); setTimeout(() => Sound.play('promote'), 300);
    $('#parade-bar').classList.add('on');
    if (sheetOpen()) closeSheet(); const bn = document.createElement('div'); bn.className = 'pa-banner'; bn.innerHTML = '<b>백 귀 야 행</b><small>지나가는 귀신과 혼령을 마구 터치!</small>'; $('#stage').appendChild(bn); setTimeout(() => bn.remove(), 2200);
  }
  // 백귀야행 귀신 잡기: 잡을수록 콤보가 오르고, 금빛 귀신은 5배
  function ghostTap(x, y, gold) {
    if (!parade) return;
    parade.combo++; parade.comboT = 2; parade.max = Math.max(parade.max, parade.combo); parade.ghosts++;
    const amt = Game.incomePerSec(true) * (gold ? 7 : 1.4) * (1 + Math.min(4, parade.combo * 0.1)); // 백귀야행 귀신 1마리
    Game.gain(amt); parade.gained += amt; Life.qEvent('soul', 3);
    float(x, y, (gold ? '✨+' : '+') + fmt(amt), gold ? 'big' : 't2 tap'); Sound.play(gold ? 'promote' : 'kill');
    const cb = $('#parade-bar .cb'); if (cb) { cb.classList.remove('pop'); void cb.offsetWidth; cb.classList.add('pop'); }
  }
  function paradeTick(dt) {
    if (!parade) return;
    parade.t -= dt; parade.comboT -= dt; if (parade.comboT <= 0) parade.combo = 0;
    const bar = $('#parade-bar'); if (!bar.querySelector('.cb')) bar.innerHTML = '🏮 <b class="pt"></b> · 콤보 <b class="cb"></b> <small class="pg"></small>'; bar.querySelector('.pt').textContent = Math.max(0, parade.t).toFixed(1) + '초'; bar.querySelector('.cb').textContent = parade.combo; bar.querySelector('.pg').textContent = `귀신 ${parade.ghosts} · +${Math.round(Math.min(4, parade.combo * 0.1) * 100)}%`;
    if (parade.t <= 0) endParade();
  }
  function endParade() {
    const p = parade; parade = null; Scene.config({ parade: false }); Life.qEvent('parade'); $('#parade-bar').classList.remove('on'); $('#parade-bar').innerHTML = '';
    const bonus = p.gained * Math.min(1, p.max / 40) * 0.5, jade = p.max >= 60 ? 15 : p.max >= 30 ? 8 : p.max >= 15 ? 3 : 0;
    Game.gain(bonus); S().jade += jade; Game.save(); Sound.play('kill');
    const box = modal(`<h2>백귀야행 끝!</h2><p>행렬이 지나갔어요.</p>
      <div class="big"><img class="px" src="${IC('soul', 3)}">+${fmt(p.gained + bonus)}</div>
      <p>잡은 귀신 <b style="color:var(--gold)">${p.ghosts}</b> · 최고 콤보 <b style="color:var(--gold)">${p.max}</b> · 콤보 보너스 +${fmt(bonus)}${jade ? ` · 옥 +${jade}` : ''}</p>
      <div class="acts"><button class="btn dark" data-act="close">확인</button><button class="btn red" id="pa-x2">광고 보고 보너스 2배<em>AD</em></button></div>`, true);
    box.querySelector('#pa-x2').onclick = () => { closeModal(); ad(() => { Game.gain(p.gained + bonus); got(`백귀야행 보상 2배! +${fmt(p.gained + bonus)}`, { ic: 'soul' }); }); };
  }
  function checkOffline() {
    const o = Game.offline(); if (!o || o.amt <= 0) { Game.save(); return; }
    Game.S.last = Date.now();
    const box = modal(`<h2>다녀오셨어요?</h2><p>자리를 비운 <b>${fmtTime(o.away)}</b> 동안<br>졸개들이 혼을 거뒀습니다.${o.capped ? `<br><span style="color:var(--mute);font-size:10px">(저승 장부 한도 ${Game.offHours()}시간까지만 쌓여요)</span>` : ''}</p>
      <div class="big"><img class="px" src="${IC('soul', 3)}">+${fmt(o.amt)}</div>
      <div class="acts"><button class="btn dark" id="o-get">받기</button><button class="btn red" id="o-ad">광고 보고 2배<em>AD</em></button></div>`, true);
    box.querySelector('#o-get').onclick = () => { Game.gain(o.amt); Game.save(); closeModal(); Sound.play('collect', 2); };
    box.querySelector('#o-ad').onclick = () => { closeModal(); ad(() => { Game.gain(o.amt * 2); Game.save(); got(`보상 2배! +${fmt(o.amt * 2)}`, { ic: 'soul' }); Sound.play('promote'); }); };
  }
  // 성장이 막혔을 때 한 번씩 도움 제안 (20분에 1회)
  function checkStuck() {
    const s = S(); if (!s.kind || $('#modal').classList.contains('on') || test) return;
    if (Date.now() - s.lastBuy < 180000 || Date.now() - s.stuckShown < 20 * 60000) return;
    const inc = Game.incomePerSec();
    const cheapest = Math.min(...UPGRADES.filter(U => Game.lv(U.id) < Game.umax(U.id)).map(U => Game.cost(U.id)));
    const N = Game.nextRank();
    if (cheapest <= s.souls + inc * 120 || Game.canTest()) return;
    s.stuckShown = Date.now(); Game.save();
    modal(`<h2>성장이 더디신가요?</h2><p>다음 수련까지 시간이 꽤 걸려요.<br>부적이나 패키지로 빠르게 넘어가 보세요!</p>
      <div class="acts" style="flex-direction:column"><button class="btn red" data-act="boostAd">2배 부적 (광고 무료)</button><button class="btn" id="st-pkg">승진 응원 패키지 ${priceOf('promo')}</button><button class="btn dark" data-act="close">괜찮아요</button></div>`)
      .querySelector('#st-pkg').onclick = () => { closeModal(); iapBox('promo'); };
  }

  return { init, toast };
})();
