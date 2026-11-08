// ===== UI: 탭 / 모달 / 화면 =====
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  let tab = 'home';
  let monFilter = 'all';
  const IC = { gold: '💰', gems: '💎', stones: '🔮', ench: '🔨' };
  let summonMode = 'mon';
  const ic = k => Assets.icon(k, IC[k]);
  const mon = (id, f, o) => Assets.monster(id, f, o);

  // ================= 공통 =================
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    const box = $('#toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 1800);
    setTimeout(() => t.remove(), 2200);
  }

  let onCloseCb = null;
  function modal(html, cls = '', onClose = null) {
    close(true);
    const m = document.createElement('div');
    m.className = 'modal-bg';
    m.innerHTML = `<div class="modal ${cls}"><button class="x" data-close>✕</button>${html}</div>`;
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) close();
    });
    document.body.appendChild(m);
    onCloseCb = onClose;
    return m.querySelector('.modal');
  }
  function close(silent) {
    document.querySelectorAll('.modal-bg').forEach(n => n.remove());
    const cb = onCloseCb; onCloseCb = null;
    if (cb && !silent) cb();
  }

  function confirm(html, okText = '확인') {
    return new Promise(res => {
      let done = false;
      const fin = v => { if (!done) { done = true; res(v); } };
      const m = modal(`<div class="confirm">${html}</div><div class="row"><button class="btn gray" data-no>취소</button><button class="btn" data-ok>${okText}</button></div>`, '', () => fin(false));
      m.querySelector('[data-ok]').onclick = () => { onCloseCb = null; close(); fin(true); };
      m.querySelector('[data-no]').onclick = () => { onCloseCb = null; close(); fin(false); };
    });
  }

  function rewardText(r) {
    return Object.entries(r).filter(([k, v]) => v > 0 && IC[k]).map(([k, v]) => `${ic(k)} ${fmt(v)}`).join('  ');
  }
  function rewardChips(r) {
    return Object.entries(r).filter(([k, v]) => v > 0 && IC[k]).map(([k, v]) => `<span class="chip">${ic(k)} ${fmt(v)}</span>`).join('')
      + (r.item ? `<span class="chip item" style="--rc:${RARITY[r.item.r].color}">${Gear.icon(r.item)} ${r.item.auto ? '자동 분해' : Gear.name(r.item)}</span>` : '');
  }

  function adBtn(label, left, cls = '', extra = '') {
    return `<button class="btn ad ${cls}" ${left <= 0 ? 'disabled' : ''} ${extra}><span class="adtag">AD</span>${label}<small>남은 ${Math.max(0, left)}회</small></button>`;
  }

  async function watchAd(kind, placement) {
    Game.checkDaily();
    const d = G.state.daily;
    if (d[kind] >= AD_LIMITS[kind]) { toast('오늘 광고 횟수를 모두 사용했어요'); return false; }
    const ok = await Monetize.showRewarded(placement);
    if (!ok) { toast('광고를 끝까지 시청해야 보상을 받아요'); return false; }
    d[kind]++;
    Game.quest('ad');
    return true;
  }
  const adLeft = kind => AD_LIMITS[kind] - G.state.daily[kind];

  function rewardPopup(title, r, sub = '') {
    Sound.play('reward');
    modal(`<div class="center rpop"><div class="rp-title">${title}</div>${sub ? `<div class="muted">${sub}</div>` : ''}
      <div class="chips big">${rewardChips(r)}</div><button class="btn wide" data-close>확인</button></div>`);
    refresh();
  }

  // ================= 상단 / HUD =================
  function refreshTop() {
    const s = G.state;
    for (const k of ['gold', 'gems', 'stones', 'ench']) $(`#c-${k}`).textContent = fmt(s[k]);
  }

  function refreshStage() {
    const B = G.battle;
    if (!B) return;
    if (B.mode === 'stage') {
      const info = B.info;
      $('#stage-label').innerHTML = `${ELEMENTS[info.el].icon} ${info.label}${info.boss ? ' <span class="bosstag">BOSS</span>' : ''}<span class="mode ${G.state.autoChallenge ? 'on' : 'off'}">${G.state.autoChallenge ? '도전' : '반복'}</span>`;
      $('#wave-dots').innerHTML = Array.from({ length: B.waves }, (_, i) =>
        `<i class="${i < B.wave ? 'done' : i === B.wave ? 'cur' : ''}${info.boss && i === B.waves - 1 ? ' boss' : ''}"></i>`).join('');
    }
    modeHud();
  }

  function modeHud() {
    const B = G.battle, h = $('#mode-hud');
    if (!B || B.mode === 'stage') { h.innerHTML = ''; return; }
    if (B.mode === 'raid') {
      const boss = B.enemies[0], E = ENEMY_MAP[boss.enemyId], L = { el: E.ch, names: [E.n, E.n, E.n] };
      h.innerHTML = `<div class="raid-hud">
        <div class="rh-name">${ELEMENTS[L.el].icon} ${L.names[2]} <small>Lv.${B.lvl}</small></div>
        <div class="rh-bar"><i id="raid-hp"></i><span id="raid-hp-txt"></span></div>
        <div class="rh-row"><span>⏱ <b id="mh-time"></b></span><span>누적 피해 <b id="raid-dmg">0</b></span><button class="hbtn" id="give-up">포기</button></div>
      </div>`;
      raidBar(boss);
    } else {
      h.innerHTML = `<div class="raid-hud arena">
        <div class="rh-name">🏆 아레나 · vs ${B.opp.name}</div>
        <div class="rh-row"><span>⏱ <b id="mh-time"></b></span><span>상대 전투력 ⚔️${fmt(B.opp.power)}</span><button class="hbtn" id="give-up">포기</button></div>
      </div>`;
    }
    $('#give-up').onclick = () => Game.giveUp();
    updateModeTimer();
  }
  function raidBar(u) {
    const f = $('#raid-hp');
    if (!f) return;
    f.style.width = Math.max(0, (u.hp / u.maxHp) * 100) + '%';
    $('#raid-hp-txt').textContent = `${fmt(u.hp)} / ${fmt(u.maxHp)}`;
    $('#raid-dmg').textContent = fmt(G.battle.dmg);
  }
  function updateModeTimer() {
    const B = G.battle, t = $('#mh-time');
    if (!t || !B || !B.limit) return;
    t.textContent = Math.max(0, Math.ceil(B.limit - B.time)) + 's';
  }

  function refresh() { refreshTop(); refreshStage(); renderTab(); tickUI(); }

  function setDot(sel, on) { const d = $(sel); if (d) d.classList.toggle('on', !!on); }

  // 0.25초마다
  function tickUI() {
    refreshTop();
    const s = G.state;
    const bt = $('#boost-label');
    if (Game.boosted()) {
      const left = Math.ceil((s.boostUntil - Date.now()) / 1000);
      bt.textContent = `⚡x2 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      bt.style.display = '';
    } else bt.style.display = 'none';
    const r = Game.idleRate(), mins = s.idle.gold / r.gold;
    $('#chest-amt').textContent = mins >= 1 ? `${Math.floor(mins / 60) ? Math.floor(mins / 60) + '시간' : Math.floor(mins) + '분'}` : '보상';
    $('#sb-chest').classList.toggle('full', mins >= 30);
    setDot('#sb-chest .dot', mins >= 30);
    setDot('#sb-attend .dot', Game.canAttend());
    setDot('#sb-quest .dot', Game.questAlert());
    setDot('#nav [data-tab=mons] .dot', Game.monAlert());
    setDot('#nav [data-tab=adv] .dot', Game.expedAlert() || Game.raidTickets() > 0);
    setDot('#nav [data-tab=summon] .dot', adLeft('pull') > 0);
    setDot('#nav [data-tab=home] .dot', G.state.team.some(id => Game.canLevel(id)) || Game.heroCanLevel());
    setDot('#nav [data-tab=hero] .dot', G.state.hero && HERO_SLOTS.some(sl => !Gear.inSlot('hero', sl) && G.state.gear.some(x => x.slot === sl && !x.eq)));
    updateModeTimer();
    if ($('.exped-modal')) updateExpedTimers();
    if (tab === 'home') {
      document.querySelectorAll('.team5 [data-q]').forEach(b => { b.disabled = !Game.canLevel(b.dataset.q); });
      const hq = $('.team5 [data-hq]'); if (hq) hq.disabled = !Game.heroCanLevel();
    }
  }

  // ================= 탭 =================
  function setTab(t) {
    tab = t;
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    renderTab();
    $('#panel').scrollTop = 0;
  }
  function renderTab() {
    const p = $('#panel');
    ({ home: renderHome, hero: renderHero, mons: renderMons, summon: renderSummon, adv: renderAdv, shop: renderShop })[tab](p);
  }

  // ================= 홈 =================
  function renderHome(p) {
    const s = G.state, next = Game.stageInfo(s.best + 1);
    const inStage = G.battle && G.battle.mode === 'stage';
    p.innerHTML = `
      <div class="home-top">
        <div class="stat"><small>최고 기록</small><b>${s.best ? Game.stageInfo(s.best).label : '-'}</b></div>
        <div class="stat"><small>팀 전투력</small><b>⚔️ ${fmt(Game.teamPower())}</b></div>
        <button class="btn ${next.boss ? 'red' : ''} challenge" id="challenge" ${s.autoChallenge || !inStage ? 'disabled' : ''}>
          ${s.autoChallenge ? '자동 도전 중' : (next.boss ? '👑 보스 도전' : '▶ 다음 도전')}
        </button>
      </div>
      <div class="team5">
        ${s.hero ? `<div class="tcard hero" data-hero style="--rc:#ffd23f">
            <div class="art">${HeroArt.of(s.hero)}</div>
            <div class="tlv">Lv.${s.hero.lvl}</div>
            <button class="qlv" data-hq ${Game.heroCanLevel() ? '' : 'disabled'}>▲</button>
          </div>` : ''}
        ${s.team.map(id => {
          const o = s.owned[id], L = LINE_MAP[id];
          return `<div class="tcard" data-id="${id}" style="--rc:${RARITY[L.r].color}">
            <div class="art">${mon(id, o.form)}</div>
            <div class="tlv">Lv.${o.lvl}</div>
            <button class="qlv" data-q="${id}" ${Game.canLevel(id) ? '' : 'disabled'}>▲</button>
          </div>`;
        }).join('')}
        ${'<div class="tcard empty" data-goto="mons">+</div>'.repeat(4 - s.team.length)}
      </div>`;
    $('#challenge', p).onclick = () => { Game.challenge(); renderTab(); };
    p.querySelectorAll('.tcard[data-id]').forEach(c => c.onclick = e => {
      if (e.target.closest('.qlv')) return;
      detail(c.dataset.id);
    });
    p.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      const id = b.dataset.q;
      if (Game.levelUp(id, 1)) {
        Sound.play('levelup'); Game.save();
        const c = b.closest('.tcard');
        c.querySelector('.tlv').textContent = 'Lv.' + G.state.owned[id].lvl;
        c.classList.remove('lvup'); void c.offsetWidth; c.classList.add('lvup');
        refreshTop();
        p.querySelector('.home-top .stat:nth-child(2) b').textContent = '⚔️ ' + fmt(Game.teamPower());
      }
    });
    p.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => setTab(b.dataset.goto));
    const hc = p.querySelector('[data-hero]');
    if (hc) hc.onclick = e => { if (!e.target.closest('.qlv')) setTab('hero'); };
    const hq = p.querySelector('[data-hq]');
    if (hq) hq.onclick = () => {
      if (Game.heroLevelUp(1)) {
        Sound.play('levelup'); Game.save();
        const c = hq.closest('.tcard');
        c.querySelector('.tlv').textContent = 'Lv.' + G.state.hero.lvl;
        c.classList.remove('lvup'); void c.offsetWidth; c.classList.add('lvup');
        refreshTop();
        p.querySelector('.home-top .stat:nth-child(2) b').textContent = '⚔️ ' + fmt(Game.teamPower());
      }
    };
  }

  // ================= 몬스터 =================
  const stars = n => (n ? '★'.repeat(n) : '');
  function monCard(id) {
    const L = LINE_MAP[id], o = G.state.owned[id];
    if (!o) {
      return `<div class="mcard locked" data-lock="${id}" style="--rc:${RARITY[L.r].color}">
        <div class="rt">${L.r}</div><div class="art">${mon(id, 0, { silhouette: true })}</div><div class="nm">???</div></div>`;
    }
    const inTeam = G.state.team.includes(id);
    const alert = Game.canEvolve(id) || Game.canStar(id);
    return `<div class="mcard${inTeam ? ' inteam' : ''}" data-id="${id}" style="--rc:${RARITY[L.r].color}">
      <div class="rt">${L.r}</div><div class="elx">${ELEMENTS[L.el].icon}</div>
      ${alert ? '<div class="dot on">!</div>' : ''}
      <div class="art">${mon(id, o.form)}</div>
      <div class="st">${stars(o.star)}</div>
      <div class="nm">${L.names[o.form]}</div>
      <div class="lv">Lv.${o.lvl}</div>
    </div>`;
  }

  function renderMons(p) {
    const s = G.state;
    let list = LINES.slice();
    if (monFilter !== 'all') list = list.filter(l => l.el === monFilter);
    list.sort((a, b) => {
      const oa = s.owned[a.id], ob = s.owned[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      if (oa && ob) return Game.power(Game.monStats(b.id)) - Game.power(Game.monStats(a.id));
      return RARITY_ORDER.indexOf(b.r) - RARITY_ORDER.indexOf(a.r);
    });
    p.innerHTML = `
      <div class="filters">
        <span class="cnt">도감 ${Object.keys(s.owned).length}/${LINES.length}</span>
        <button data-f="all" class="${monFilter === 'all' ? 'on' : ''}">전체</button>
        ${Object.entries(ELEMENTS).map(([k, e]) => `<button data-f="${k}" class="${monFilter === k ? 'on' : ''}">${e.icon}</button>`).join('')}
      </div>
      <div class="grid">${list.map(l => monCard(l.id)).join('')}</div>`;
    p.querySelectorAll('.filters button').forEach(b => b.onclick = () => { monFilter = b.dataset.f; renderTab(); });
    p.querySelectorAll('.mcard[data-id]').forEach(c => c.onclick = () => detail(c.dataset.id));
    p.querySelectorAll('.mcard[data-lock]').forEach(c => c.onclick = () => toast('소환에서 획득할 수 있어요'));
  }

  function detail(id) {
    const L = LINE_MAP[id], o = G.state.owned[id], s = G.state;
    const st = Game.monStats(id), cap = FORM_CAP[o.form], cost = Game.levelCost(o.lvl);
    const maxed = o.lvl >= cap, inTeam = s.team.includes(id);
    const shards = s.shards[id] || 0, need = Game.starCost(o.star), evoC = EVO_COST[o.form];
    let nextSt = null;
    if (!maxed) {
      const a = Game.stats(id, o.lvl, o.form, o.star), b2 = Game.stats(id, o.lvl + 1, o.form, o.star);
      nextSt = { atk: st.atk + b2.atk - a.atk, hp: st.hp + b2.hp - a.hp, def: st.def + b2.def - a.def };
    }
    const m = modal(`
      <div class="detail" style="--rc:${RARITY[L.r].color}">
        <div class="d-top">
          <div class="d-art" data-el="${L.el}">${mon(id, o.form)}</div>
          <div class="d-info">
            <div><span class="rbadge">${L.r}</span> <span class="ebadge">${ELEMENTS[L.el].icon} ${ELEMENTS[L.el].name}</span></div>
            <div class="d-name">${L.names[o.form]}</div>
            <div class="muted">${FORM_LABEL[o.form]} · Lv.${o.lvl}/${cap}</div>
            <div class="lvbar"><i style="width:${(o.lvl / cap) * 100}%"></i></div>
            <div class="d-star">${'★'.repeat(o.star)}<span class="muted">${'☆'.repeat(MAX_STAR - o.star)}</span></div>
            <div class="d-pow">⚔️ ${fmt(Game.power(st))}</div>
          </div>
        </div>
        <div class="d-stats">
          <div>공격<b>${fmt(st.atk)}</b>${nextSt ? `<small>+${nextSt.atk - st.atk}</small>` : ''}</div>
          <div>체력<b>${fmt(st.hp)}</b>${nextSt ? `<small>+${nextSt.hp - st.hp}</small>` : ''}</div>
          <div>방어<b>${fmt(st.def)}</b>${nextSt ? `<small>+${nextSt.def - st.def}</small>` : ''}</div>
        </div>
        <div class="d-skill"><b>✦ ${SKILLS[L.skill].name}</b> <span class="muted">${SKILLS[L.skill].desc}</span></div>
        <div class="mgear"><span class="muted small">장비</span>${MON_SLOTS.map(sl => gearCell(Gear.inSlot('m:' + id, sl), sl)).join('')}<span class="muted small">다른 몬스터와<br>돌려 쓸 수 있어요</span></div>
        <div class="evo-line">${L.names.map((n, i) => `<div class="${i === o.form ? 'now' : ''}">${mon(id, i, { silhouette: i > o.form })}<small>${i <= o.form ? n : '???'}</small></div>`).join('<span>›</span>')}</div>
        <div class="d-actions">
          ${!maxed ? `
            <button class="btn" data-lv="1">레벨업<small>${ic('gold')}${fmt(cost.gold)}</small></button>
            <button class="btn" data-lv="10">+10 레벨<small>가능한 만큼</small></button>`
          : o.form < 2 ? `
            <button class="btn purple wide" data-evo ${Game.canEvolve(id) ? '' : 'disabled'}>✨ 진화 → ${L.names[o.form + 1]}<small>${ic('stones')}${s.stones}/${evoC.stones} ${ic('gold')}${fmt(evoC.gold)}</small></button>`
          : `<div class="muted wide center">최대 레벨 · 최종 진화 완료!</div>`}
          <button class="btn gold" data-star ${Game.canStar(id) ? '' : 'disabled'}>⭐ 성급 강화<small>${o.star >= MAX_STAR ? 'MAX' : `조각 ${shards}/${need}`}</small></button>
          <button class="btn ${inTeam ? 'gray' : 'green'}" data-team>${inTeam ? '팀에서 빼기' : '팀에 넣기'}</button>
        </div>
      </div>`, 'wide-modal');
    m.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
      const n = Game.levelUp(id, +b.dataset.lv);
      if (!n) return toast('골드가 부족해요');
      Sound.play('levelup'); toast(`레벨 +${n}!`); Game.save(); after(id);
    });
    const ev = m.querySelector('[data-evo]');
    if (ev) ev.onclick = () => { if (Game.evolve(id)) { Game.save(); Game.restartStage(); evoFx(id); } };
    m.querySelector('[data-star]').onclick = () => { if (Game.starUp(id)) { Sound.play('levelup'); toast('⭐ 성급 상승!'); Game.save(); after(id); } };
    m.querySelector('[data-team]').onclick = () => {
      const r = Game.toggleTeam(id);
      if (r === 'full') return toast('파트너 몬스터는 최대 4마리예요');
      if (r === 'last') return toast('최소 1마리는 팀에 있어야 해요');
      Game.save(); after(id);
    };
    bindGearCells(m, 'm:' + id, () => detail(id));
  }
  function after(id) { refresh(); detail(id); }

  function evoFx(id) {
    const L = LINE_MAP[id], o = G.state.owned[id];
    Sound.play('evolve');
    modal(`<div class="evofx"><div class="evo-rays"></div><div class="evo-glow">${mon(id, o.form)}</div>
      <div class="rp-title">진화 성공!</div><div>${L.names[o.form - 1]} → <b>${L.names[o.form]}</b></div>
      <button class="btn wide" data-close>확인</button></div>`, 'evo-modal');
    refresh();
  }

  // ================= 소환 =================
  function renderSummon(p) {
    const s = G.state;
    if (summonMode === 'gear') return renderGearSummon(p);
    p.innerHTML = `
      ${summonTabs()}
      <div class="summon">
        <div class="sm-banner">
          ${Assets.has('ui_banner') ? `<div class="sm-img">${Assets.icon('banner', '')}</div>` :
          `<div class="sm-arts">${['jujak', 'hwangryong', 'cheonho'].map(id => `<div>${mon(id, 2)}</div>`).join('')}</div>`}
          <div class="sm-title">몬스터 소환</div>
          <div class="sm-sub">S 등급 확정까지 <b>${PITY_MAX - s.pity}</b>회</div>
        </div>
        <div class="sm-btns">
          <button class="btn" data-pull="1">1회 소환<small>${ic('gems')} 100</small></button>
          <button class="btn gold" data-pull="10">10회 소환<small>${ic('gems')} 900 · A↑ 확정</small></button>
          ${adBtn('무료 소환', adLeft('pull'), 'pull-ad')}
        </div>
      </div>
      <div class="rates">${RARITY_ORDER.slice().reverse().map(r => `<span style="color:${RARITY[r].color}">${r} ${RARITY[r].rate}%</span>`).join(' · ')} · 중복 시 조각 ${DUP_SHARDS}</div>`;
    p.querySelectorAll('[data-pull]').forEach(b => b.onclick = () => {
      const n = +b.dataset.pull, cost = n === 10 ? 900 : 100;
      if (s.gems < cost) { toast('다이아가 부족해요 — 상점에서 충전할 수 있어요'); return setTab('shop'); }
      s.gems -= cost;
      showPull(Game.pull(n));
    });
    p.querySelector('.pull-ad').onclick = async () => { if (await watchAd('pull', 'free_pull')) showPull(Game.pull(1)); };
    bindSummonTabs(p);
  }

  function showPull(res) {
    const best = Math.max(...res.map(r => RARITY_ORDER.indexOf(LINE_MAP[r.id].r)));
    Sound.play('gacha');
    const html = res.map((r, i) => {
      const L = LINE_MAP[r.id], hi = RARITY_ORDER.indexOf(L.r) >= 3;
      return `<div class="pcard${hi ? ' hi' : ''}" style="--rc:${RARITY[L.r].color};animation-delay:${0.5 + i * 0.12}s">
        <div class="rt">${L.r}</div><div class="art">${mon(r.id, 0)}</div>
        <div class="nm">${L.names[0]}</div><div class="tag">${r.isNew ? 'NEW!' : `조각 +${r.shards}`}</div></div>`;
    }).join('');
    modal(`<div class="pull-stage ${best >= 3 ? 'gold' : best >= 2 ? 'purple' : ''}"><div class="egg"></div></div>
      <div class="pull-res ${res.length > 1 ? 'ten' : ''}">${html}</div>
      <div class="row"><button class="btn wide" data-close>확인</button></div>`, 'pull-modal');
    setTimeout(() => Sound.play(best >= 3 ? 'rare' : 'reward'), 500);
    refresh();
  }

  // ================= 모험 =================
  function renderAdv(p) {
    const A = G.state.arena, tier = Game.arenaTier(), bossId = Game.raidBossId();
    const running = G.state.exped.filter(Boolean).length, done = G.state.exped.filter(x => x && Date.now() >= x.end).length;
    p.innerHTML = `<div class="adv">
      <button class="adv-card raid" id="adv-raid">
        <div class="ac-art">${Assets.enemy(bossId, 2)}</div>
        <div class="ac-name">보스 레이드</div>
        <small>Lv.${G.state.raid.lvl} · 🎫 ${Game.raidTickets()}</small>
        ${Game.raidTickets() > 0 ? '<i class="dot on"></i>' : ''}
      </button>
      <button class="adv-card arena" id="adv-arena">
        <div class="ac-ic">${Assets.icon('arena', '🏆')}</div>
        <div class="ac-name">아레나</div>
        <small style="color:${tier.color}">${tier.name} ${A.pts}</small>
        <small>🎫 ${Game.arenaTickets()}</small>
      </button>
      <button class="adv-card exped" id="adv-exped">
        <div class="ac-ic">${Assets.icon('exped', '🧭')}</div>
        <div class="ac-name">탐험</div>
        <small>${done ? `완료 ${done}` : `진행 ${running}/3`}</small>
        ${done ? '<i class="dot on"></i>' : ''}
      </button>
    </div>`;
    $('#adv-raid', p).onclick = raidModal;
    $('#adv-arena', p).onclick = arenaModal;
    $('#adv-exped', p).onclick = expedModal;
  }

  function inBattleMode() {
    if (G.battle && G.battle.mode !== 'stage' && !G.battle.over) { toast('이미 전투 중이에요'); return true; }
    return false;
  }

  function raidModal() {
    const id = Game.raidBossId(), E = ENEMY_MAP[id], L = { el: E.ch, names: [E.n, E.n, E.n] }, R = G.state.raid, st = Game.raidBossStats(R.lvl);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const m = modal(`<div class="raid-m">
      <div class="rm-art" data-el="${L.el}">${Assets.enemy(id, 2)}</div>
      <div class="rp-title">${ELEMENTS[L.el].icon} ${L.names[2]} <small>Lv.${R.lvl}</small></div>
      <div class="muted small">${days[new Date().getDay()]}요일 보스 · 유리한 속성: ${Object.entries(ADV).filter(([a, b]) => b === L.el).map(([a]) => ELEMENTS[a].icon).join('')}</div>
      <div class="rm-info">
        <div>체력 <b>${fmt(st.hp)}</b></div><div>제한시간 <b>${RAID.time}초</b></div><div>최고 <b>${Math.round(R.bestPct * 100)}%</b></div>
      </div>
      <div class="small muted">입힌 피해량에 비례해 골드·먹이 · 25%마다 진화석 · 처치 시 💎50 + 🔮3 + 다음 레벨</div>
      <div class="row">
        <button class="btn red" id="raid-go" ${Game.raidTickets() > 0 ? '' : 'disabled'}>⚔️ 도전<small>🎫 ${Game.raidTickets()}/${RAID.tickets}</small></button>
        ${adBtn('입장권 +1', adLeft('raidAd'), 'raid-ad')}
      </div></div>`);
    $('#raid-go', m).onclick = () => {
      if (inBattleMode()) return;
      close(true);
      if (Game.startRaid()) { refresh(); } else toast('입장권이 없어요');
    };
    m.querySelector('.raid-ad').onclick = async () => { if (await watchAd('raidAd', 'raid_ticket')) { Game.save(); toast('🎫 레이드 입장권 +1'); raidModal(); refresh(); } };
  }

  function arenaModal() {
    const A = G.state.arena, tier = Game.arenaTier();
    if (!A.opps) Game.refreshOpps();
    const m = modal(`<div class="arena-m">
      <div class="am-head">
        <div class="tier" style="--tc:${tier.color}">${tier.name}</div>
        <div><b>${A.pts}</b> 점<br><small class="muted">${A.wins}승 ${A.losses}패 · 내 전투력 ⚔️${fmt(Game.teamPower())}</small></div>
      </div>
      <div class="opps">${A.opps.map((o, i) => {
        const t = Game.arenaTier(o.pts);
        return `<div class="opp">
          <div class="op-info"><b>${o.name}</b><small style="color:${t.color}">${t.name} ${o.pts}</small><small>⚔️ ${fmt(o.power)}</small></div>
          <div class="op-team">${o.lines.map(id => `<div>${mon(id, o.form)}</div>`).join('')}</div>
          <button class="btn ${o.mult > 1 ? 'red' : o.mult < 1 ? 'green' : ''}" data-fight="${i}" ${Game.arenaTickets() > 0 ? '' : 'disabled'}>도전</button>
        </div>`;
      }).join('')}</div>
      <div class="row">
        <button class="btn gray" id="opp-refresh">새로고침<small>${ic('gems')} ${ARENA.refreshCost}</small></button>
        ${adBtn('입장권 +1', adLeft('arenaAd'), 'arena-ad')}
      </div>
      <div class="small muted center">🎫 ${Game.arenaTickets()}/${ARENA.tickets} · 승리 시 점수와 💎 획득</div></div>`, 'wide-modal');
    m.querySelectorAll('[data-fight]').forEach(b => b.onclick = () => {
      if (inBattleMode()) return;
      close(true);
      if (Game.startArena(+b.dataset.fight)) refresh(); else toast('입장권이 없어요');
    });
    $('#opp-refresh', m).onclick = () => {
      if (G.state.gems < ARENA.refreshCost) return toast('다이아가 부족해요');
      G.state.gems -= ARENA.refreshCost; Game.refreshOpps(); arenaModal(); refreshTop();
    };
    m.querySelector('.arena-ad').onclick = async () => { if (await watchAd('arenaAd', 'arena_ticket')) { Game.save(); toast('🎫 아레나 입장권 +1'); arenaModal(); } };
  }

  function raidResult(r, cb) {
    modal(`<div class="center rpop">
      <div class="rp-title">${r.killed ? '🎉 레이드 보스 격파!' : '레이드 종료'}</div>
      <div class="pct-ring" style="--p:${Math.round(r.pct * 100)}"><b>${Math.round(r.pct * 100)}%</b></div>
      <div class="muted">총 피해량 ${fmt(r.dmg)}</div>
      <div class="chips big">${rewardChips(Object.assign({ item: r.reward.item }, r.reward))}</div>
      ${r.killed ? `<div class="small">다음 레이드 레벨: Lv.${r.lvl + 1}</div>` : ''}
      <button class="btn wide" data-close>확인</button></div>`, '', () => { cb(); refresh(); });
    refresh();
  }

  function arenaResult(r, cb) {
    modal(`<div class="center rpop">
      <div class="rp-title ${r.won ? '' : 'bad'}">${r.won ? '🏆 승리!' : '패배...'}</div>
      <div class="big">${r.pts} 점 <small class="${r.won ? 'up' : 'down'}">${r.delta > 0 ? '+' : ''}${r.delta}</small></div>
      ${r.promoted ? `<div class="promo" style="--tc:${r.promoted.color}">승급! ${r.promoted.name}</div>` : ''}
      <div class="chips big">${rewardChips(r.reward)}</div>
      <button class="btn wide" data-close>확인</button></div>`, '', () => { cb(); refresh(); });
    refresh();
  }

  // ================= 탐험 =================
  function expedModal() {
    const s = G.state;
    const m = modal(`<div class="exped-modal"><div class="rp-title">🧭 탐험</div>
      ${s.exped.map((x, i) => {
        if (!x) return `<div class="card exp"><div class="exp-title">탐험대 ${i + 1} <span class="muted">· 대기 중</span></div>
          <div class="exp-opts">${EXPEDITIONS.map((e, k) => `<button class="btn small-btn" data-start="${i}" data-type="${k}">${e.label}<small>${ic('gems')}${e.gems}${e.stones ? ` ${ic('stones')}${e.stones}` : ''}</small></button>`).join('')}</div></div>`;
        return `<div class="card exp" data-slot="${i}"><div class="exp-title">탐험대 ${i + 1} <span class="muted">· ${EXPEDITIONS[x.type].label}</span></div>
          <div class="exp-rw">${rewardText(x.reward)}</div><div class="pbar"><i></i></div><div class="exp-time"></div><div class="row exp-btns"></div></div>`;
      }).join('')}
      <div class="small muted">광고 시청 시 30분 단축 (하루 ${AD_LIMITS.exped}회) · 다이아로 즉시 완료</div></div>`, 'wide-modal');
    m.querySelectorAll('[data-start]').forEach(b => b.onclick = () => { Game.startExped(+b.dataset.start, +b.dataset.type); expedModal(); refresh(); });
    updateExpedTimers(true);
  }

  function updateExpedTimers(force) {
    const p = $('.exped-modal');
    if (!p) return;
    G.state.exped.forEach((x, i) => {
      const c = p.querySelector(`.exp[data-slot="${i}"]`);
      if (!x || !c) return;
      const total = x.end - x.start, left = Math.max(0, x.end - Date.now()), done = left <= 0, secs = Math.ceil(left / 1000);
      c.querySelector('.pbar i').style.width = (100 - (left / total) * 100) + '%';
      c.querySelector('.exp-time').textContent = done ? '탐험 완료!' : `남은 시간 ${Math.floor(secs / 3600)}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      const btns = c.querySelector('.exp-btns'), state = done ? 'done' : 'run';
      if (btns.dataset.state === state && !force) {
        const sk = btns.querySelector('[data-skip] small');
        if (sk) sk.innerHTML = `${ic('gems')} ${Game.skipCost(i)}`;
        return;
      }
      btns.dataset.state = state;
      if (done) {
        btns.innerHTML = `<button class="btn green wide" data-claim>보상 받기</button>`;
        btns.querySelector('[data-claim]').onclick = () => { const r = Game.claimExped(i); if (r) rewardPopup('탐험 완료!', r); };
      } else {
        btns.innerHTML = `${adBtn('30분 단축', adLeft('exped'), 'exp-ad')}<button class="btn gold" data-skip>즉시 완료<small>${ic('gems')} ${Game.skipCost(i)}</small></button>`;
        btns.querySelector('.exp-ad').onclick = async () => {
          if (await watchAd('exped', 'exped_skip')) { x.end -= 30 * 60000; Game.save(); toast('⏩ 30분 단축!'); expedModal(); }
        };
        btns.querySelector('[data-skip]').onclick = () => {
          const c2 = Game.skipCost(i);
          if (G.state.gems < c2) return toast('다이아가 부족해요');
          G.state.gems -= c2; x.end = Date.now(); Game.save(); expedModal();
        };
      }
    });
  }

  // ================= 상점 =================
  function renderShop(p) {
    const s = G.state, r = Game.idleRate(), goldAmt = Math.round(r.gold * 120);
    p.innerHTML = `
      <div class="shop-row">
        <div class="si free"><div class="si-ic">${ic('gems')}</div><div class="si-nm">무료 다이아 ${AD_GEM_REWARD}</div>${adBtn('받기', adLeft('gem'), 'gem-ad')}</div>
        ${IAP.map(it => `<button class="si" data-iap="${it.id}"><div class="si-ic">${ic('gems')}</div><div class="si-nm">${it.name}</div><div class="si-pr">${it.price}</div></button>`).join('')}
      </div>
      <div class="pkg ${s.bought.starter ? 'sold' : ''}"><div><b>🎁 스타터 패키지</b> <span class="badge">1회</span><br><small class="muted">💎1,000 · 🔮10 · 🔨50 · 💰20,000 · S 장비</small></div>
        <button class="btn gold" data-pkg="starter" ${s.bought.starter ? 'disabled' : ''}>${s.bought.starter ? '완료' : '₩3,300'}</button></div>
      <div class="pkg ${s.adFree ? 'sold' : ''}"><div><b>🚫 광고 제거 패스</b> <span class="badge">영구</span><br><small class="muted">광고 없이 광고 보상 즉시 획득</small></div>
        <button class="btn gold" data-pkg="adfree" ${s.adFree ? 'disabled' : ''}>${s.adFree ? '보유 중' : '₩5,500'}</button></div>
      <div class="pkg"><div><b>골드 주머니</b><br><small class="muted">💰${fmt(goldAmt)}</small></div><button class="btn" data-ex="gold">💎 100</button></div>
      <div class="pkg"><div><b>강화석 x30</b><br><small class="muted">🔨30</small></div><button class="btn" data-ex="ench">💎 100</button></div>
      <div class="pkg"><div><b>진화석 x5</b><br><small class="muted">🔮5</small></div><button class="btn" data-ex="stones">💎 150</button></div>
      <p class="small muted center">테스트 빌드: 결제는 실제로 청구되지 않습니다.</p>`;
    p.querySelector('.gem-ad').onclick = async () => {
      if (await watchAd('gem', 'free_gems')) { s.gems += AD_GEM_REWARD; Game.save(); rewardPopup('무료 다이아', { gems: AD_GEM_REWARD }); }
    };
    p.querySelectorAll('[data-iap]').forEach(b => b.onclick = async () => {
      const it = IAP.find(x => x.id === b.dataset.iap);
      if (await Monetize.purchase(it)) { s.gems += it.gems; Game.save(); rewardPopup('충전 완료!', { gems: it.gems }); }
    });
    p.querySelectorAll('[data-pkg]').forEach(b => b.onclick = async () => {
      const k = b.dataset.pkg;
      if (k === 'starter' && await Monetize.purchase({ name: '스타터 패키지', price: '₩3,300' })) {
        s.bought.starter = true; Game.save();
        const got = Game.grant({ gems: 1000, stones: 10, ench: 50, gold: 20000 });
        got.item = Gear.drop(Math.max(5, s.best), 'S');
        return rewardPopup('스타터 패키지', got);
      }
      if (k === 'adfree' && await Monetize.purchase({ name: '광고 제거 패스', price: '₩5,500' })) {
        s.adFree = true; Game.save(); toast('광고 제거 패스 적용!'); refresh();
      }
    });
    p.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => {
      const k = b.dataset.ex, cost = k === 'stones' ? 150 : 100;
      if (s.gems < cost) return toast('다이아가 부족해요');
      s.gems -= cost;
      const r2 = k === 'gold' ? { gold: goldAmt } : k === 'ench' ? { ench: 30 } : { stones: 5 };
      Game.grant(r2); Game.save(); rewardPopup('교환 완료!', r2);
    });
  }

  // ================= 영웅 (메인 캐릭터) =================
  function gearCell(it, slot) {
    if (!it) return `<button class="gcell empty" data-slot="${slot}"><span class="gi">${GEAR_SLOTS[slot].icon}</span><small>${GEAR_SLOTS[slot].name}</small></button>`;
    return `<button class="gcell" data-gid="${it.id}" style="--rc:${RARITY[it.r].color}"><span class="gi">${Gear.icon(it)}</span>${it.enh ? `<b class="enh">+${it.enh}</b>` : ''}<small>${it.r}</small></button>`;
  }
  function bindGearCells(root, owner, back) {
    root.querySelectorAll('.gcell[data-gid]').forEach(c => c.onclick = () => gearDetail(+c.dataset.gid, owner, back));
    root.querySelectorAll('.gcell[data-slot]').forEach(c => c.onclick = () => gearPicker(owner, c.dataset.slot, back));
  }

  function renderHero(p) {
    const h = G.state.hero;
    if (!h) { p.innerHTML = '<div class="center muted">캐릭터를 먼저 만들어 주세요</div>'; return; }
    const st = Game.heroStats(), C = CLASSES[h.cls], cost = Game.levelCost(h.lvl);
    p.innerHTML = `
      <div class="hero-tab">
        <button class="ht-art" id="ht-art">${HeroArt.of(h)}</button>
        <div class="ht-info">
          <div class="ht-name">${h.name}</div>
          <div class="muted small">${GENDERS[h.gender]} · ${C.name} · Lv.${h.lvl}</div>
          <div class="ht-pow">⚔️ ${fmt(Game.power(st))}</div>
          <div class="ht-st"><span>공 ${fmt(st.atk)}</span><span>체 ${fmt(st.hp)}</span><span>방 ${fmt(st.def)}</span></div>
          <button class="btn" id="ht-lv" ${Game.heroCanLevel() ? '' : 'disabled'}>레벨업<small>${ic('gold')}${fmt(cost.gold)}</small></button>
        </div>
        <div class="ht-gear">${HERO_SLOTS.map(sl => gearCell(Gear.inSlot('hero', sl), sl)).join('')}</div>
      </div>
      <div class="row ht-btns">
        <button class="btn gray" id="ht-bag">🎒 가방 <small>${G.state.gear.length}/${GEAR_BAG_MAX}</small></button>
        <button class="btn green" id="ht-auto">자동 장착</button>
        <button class="btn gold" id="ht-pull">장비 소환</button>
      </div>`;
    $('#ht-art', p).onclick = heroInfo;
    $('#ht-lv', p).onclick = () => {
      const n = Game.heroLevelUp(1);
      if (n) { Sound.play('levelup'); Game.save(); Game.restartStage(); renderTab(); refreshTop(); }
    };
    $('#ht-bag', p).onclick = () => bag();
    $('#ht-auto', p).onclick = () => {
      let n = Gear.autoEquip('hero');
      G.state.team.forEach(id => { n += Gear.autoEquip('m:' + id); });
      Game.save(); Game.restartStage();
      toast(n ? `장비 ${n}개를 장착했어요` : '이미 가장 좋은 장비를 끼고 있어요'); renderTab();
    };
    $('#ht-pull', p).onclick = () => { summonMode = 'gear'; setTab('summon'); };
    bindGearCells(p, 'hero', () => renderTab());
  }

  function heroInfo() {
    const h = G.state.hero, C = CLASSES[h.cls], st = Game.heroStats();
    const m = modal(`<div class="hero-info">
      <div class="hi-art">${HeroArt.of(h)}</div>
      <div class="rp-title">${h.name} <small>Lv.${h.lvl}</small></div>
      <div class="muted center small">${GENDERS[h.gender]} ${C.name} · ${C.desc}</div>
      <div class="d-stats"><div>공격<b>${fmt(st.atk)}</b></div><div>체력<b>${fmt(st.hp)}</b></div><div>방어<b>${fmt(st.def)}</b></div></div>
      <div class="d-skill"><b>✦ ${C.skill.name}</b> <span class="muted">${C.skill.desc}</span>${C.crit ? '<br><span class="muted">패시브: 치명타 확률 +25%</span>' : ''}</div>
      <div class="row"><button class="btn gray" id="hi-change">외형·직업 변경<small>${ic('gems')} 200</small></button></div></div>`);
    $('#hi-change', m).onclick = () => {
      if (G.state.gems < 200) return toast('다이아가 부족해요');
      createHero(false, true);
    };
  }

  function createHero(first, change) {
    const cur = G.state.hero || {};
    let gender = cur.gender || 'm', cls = cur.cls || 'warrior';
    const draw = m => {
      const C = CLASSES[cls];
      $('#cr-prev', m).innerHTML = HeroArt.hero(gender, cls);
      m.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b.dataset.g === gender));
      m.querySelectorAll('[data-c]').forEach(b => {
        b.classList.toggle('on', b.dataset.c === cls);
        b.querySelector('.cc-art').innerHTML = HeroArt.hero(gender, b.dataset.c);
      });
      $('#cr-desc', m).innerHTML = `<b>${C.name}</b> · ${C.desc}<br><span class="muted">스킬: ${C.skill.name} — ${C.skill.desc}</span>`;
    };
    const m = modal(`<div class="create">
      <div class="rp-title">${change ? '외형·직업 변경' : '나의 캐릭터 만들기'}</div>
      <div class="cr-top"><div class="cr-prev" id="cr-prev"></div>
        <div class="cr-side">
          <div class="seg"><button data-g="m">남자</button><button data-g="f">여자</button></div>
          <input id="cr-name" maxlength="8" placeholder="이름 (최대 8자)" value="${cur.name || ''}" autocomplete="off">
        </div></div>
      <div class="cls-grid">${Object.entries(CLASSES).map(([k, C]) => `<button class="cc" data-c="${k}"><div class="cc-art"></div><b>${C.name}</b></button>`).join('')}</div>
      <div class="cr-desc small" id="cr-desc"></div>
      <div class="small muted center">직업마다 스타일만 다르고 성능 차이는 크지 않아요</div>
      <button class="btn wide gold" id="cr-go">${change ? '변경하기 (💎200)' : '모험 시작!'}</button></div>`, 'wide-modal',
      () => { if (!G.state.hero) setTimeout(() => createHero(first), 50); });
    m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { gender = b.dataset.g; draw(m); });
    m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cls = b.dataset.c; draw(m); });
    $('#cr-go', m).onclick = () => {
      const name = $('#cr-name', m).value.trim().slice(0, 8);
      if (change) {
        if (G.state.gems < 200) return toast('다이아가 부족해요');
        G.state.gems -= 200;
        Object.assign(G.state.hero, { gender, cls, name: name || G.state.hero.name });
        Game.save(); Game.restartStage(); close(true); refresh(); toast('변경 완료!');
        return;
      }
      Game.createHero(gender, cls, name);
      G.state.seenIntro = true; Game.save();
      close(true); Sound.play('reward'); refresh();
      toast(`${G.state.hero.name}의 모험이 시작됐어요!`);
      if (first) setTimeout(attendance, 500);
    };
    draw(m);
  }

  // ================= 장비 =================
  function statLine(st) {
    return ['atk', 'hp', 'def'].filter(k => st[k]).map(k => `${{ atk: '공격', hp: '체력', def: '방어' }[k]} +${fmt(st[k])}`).join(' · ');
  }

  function gearDetail(id, ctxOwner, back) {
    const it = Gear.find(id);
    if (!it) return back && back();
    const st = Gear.statsOf(it), nx = it.enh < GEAR_MAX_ENH ? Gear.statsOf(it, it.enh + 1) : null;
    const c = Gear.enhCost(it), rate = ENH_RATE[it.enh];
    const mine = it.eq && it.eq === ctxOwner;
    const canWear = ctxOwner && Gear.canWear(it, ctxOwner) && !mine;
    const m = modal(`<div class="gear-d" style="--rc:${RARITY[it.r].color}">
      <div class="gd-top">
        <div class="gd-ic">${Gear.icon(it)}${it.enh ? `<b class="enh">+${it.enh}</b>` : ''}</div>
        <div>
          <div><span class="rbadge">${it.r}</span> <span class="muted small">${GEAR_SLOTS[it.slot].name} · ${GEAR_SLOTS[it.slot].owner === 'hero' ? '캐릭터 전용' : '몬스터 공용'} · iLv.${it.ilvl}</span></div>
          <div class="d-name">${Gear.fullName(it)}</div>
          <div class="muted small">${it.eq ? `${Gear.ownerName(it.eq)} 착용 중` : '미착용'}</div>
        </div>
      </div>
      <div class="gd-stat">${statLine(st)}${nx ? `<br><small class="up">강화 시 → ${statLine(nx)}</small>` : ''}</div>
      <div class="enh-bar">${Array.from({ length: GEAR_MAX_ENH }, (_, i) => `<i class="${i < it.enh ? 'on' : ''}"></i>`).join('')}</div>
      <div class="d-actions">
        <button class="btn purple wide" id="gd-enh" ${nx ? '' : 'disabled'}>🔨 강화 ${nx ? `(성공률 ${rate}%)` : 'MAX'}<small>${ic('gold')}${fmt(c.gold)} ${ic('ench')}${c.ench} (보유 ${fmt(G.state.ench)})</small></button>
        ${canWear ? `<button class="btn green" id="gd-wear">장착${it.eq ? ' (옮기기)' : ''}</button>` : ''}
        ${it.eq ? `<button class="btn gray" id="gd-off">해제</button>` : ''}
        <button class="btn red" id="gd-dis">분해<small>${ic('ench')} +${Gear.disValue(it)}</small></button>
      </div></div>`, '', null);
    $('#gd-enh', m).onclick = () => {
      const r = Gear.enhance(id);
      if (r === 'nores') return toast('골드 또는 강화석이 부족해요');
      if (r === 'ok') { Sound.play('levelup'); toast(`✨ 강화 성공! +${it.enh}`); }
      if (r === 'fail') { Sound.play('lose'); toast('💥 강화 실패... (장비는 그대로예요)'); }
      Game.save(); Game.restartStage(); refreshTop(); gearDetail(id, ctxOwner, back);
      const g = $('.gd-ic'); if (g) g.classList.add(r === 'ok' ? 'enh-ok' : 'enh-fail');
    };
    const w = $('#gd-wear', m);
    if (w) w.onclick = () => { Gear.equip(id, ctxOwner); Game.save(); Game.restartStage(); Sound.play('shield'); close(true); back && back(); renderTab(); };
    const o = $('#gd-off', m);
    if (o) o.onclick = () => { Gear.unequip(id); Game.save(); Game.restartStage(); close(true); back && back(); renderTab(); };
    $('#gd-dis', m).onclick = async () => {
      if (RARITY_ORDER.indexOf(it.r) >= 2 || it.enh > 0) {
        if (!(await confirm(`<b>${Gear.fullName(it)}</b>을(를) 분해할까요?<br>${ic('ench')} ${Gear.disValue(it)} 획득`, '분해'))) return;
      }
      const n = Gear.disassemble([id]); Game.save(); Game.restartStage();
      toast(`분해 완료! ${ic('ench')} +${n}`); close(true); back && back(); renderTab(); refreshTop();
    };
  }

  function gearPicker(owner, slot, back) {
    const items = G.state.gear.filter(x => x.slot === slot).sort((a, b) => (a.eq === owner) - (b.eq === owner) || Gear.power(b) - Gear.power(a));
    const cur = Gear.inSlot(owner, slot);
    const m = modal(`<div class="picker"><div class="rp-title">${GEAR_SLOTS[slot].name} 선택</div>
      <div class="muted center small">${Gear.ownerName(owner)}에게 장착${GEAR_SLOTS[slot].owner === 'mon' ? ' · 다른 몬스터 장비도 옮겨 낄 수 있어요' : ''}</div>
      ${items.length ? `<div class="plist">${items.map(it => `<button class="prow ${it === cur ? 'sel' : ''}" data-pid="${it.id}" style="--rc:${RARITY[it.r].color}">
        <span class="gcell mini"><span class="gi">${Gear.icon(it)}</span>${it.enh ? `<b class="enh">+${it.enh}</b>` : ''}</span>
        <span class="pr-info"><b>${Gear.fullName(it)}</b><small>${statLine(Gear.statsOf(it))}</small>${it.eq ? `<small class="owner">${it === cur ? '착용 중' : Gear.ownerName(it.eq) + ' 착용 중'}</small>` : ''}</span>
        <span class="pr-pow">⚔️${fmt(Gear.power(it))}</span></button>`).join('')}</div>`
        : `<div class="center muted empty-msg">장비가 없어요<br>스테이지·레이드에서 얻거나 장비 소환을 해보세요</div>`}
      </div>`, 'wide-modal');
    m.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => {
      const it = Gear.find(+b.dataset.pid);
      if (it === cur) return gearDetail(it.id, owner, back);
      Gear.equip(it.id, owner); Game.save(); Game.restartStage(); Sound.play('shield');
      toast(`${Gear.name(it)} 장착!`); close(true); back && back(); renderTab();
    });
  }

  let bagTab = 'hero';
  function bag() {
    const list = G.state.gear.filter(x => GEAR_SLOTS[x.slot].owner === bagTab)
      .sort((a, b) => RARITY_ORDER.indexOf(b.r) - RARITY_ORDER.indexOf(a.r) || Gear.power(b) - Gear.power(a));
    const junk = G.state.gear.filter(x => !x.eq && x.enh === 0 && (x.r === 'C' || x.r === 'B'));
    const m = modal(`<div class="bag"><div class="rp-title">🎒 가방 <small>${G.state.gear.length}/${GEAR_BAG_MAX}</small></div>
      <div class="seg"><button data-bt="hero" class="${bagTab === 'hero' ? 'on' : ''}">캐릭터 장비</button><button data-bt="mon" class="${bagTab === 'mon' ? 'on' : ''}">몬스터 장비</button></div>
      <div class="bag-grid">${list.map(it => `<button class="gcell" data-bid="${it.id}" style="--rc:${RARITY[it.r].color}"><span class="gi">${Gear.icon(it)}</span>${it.enh ? `<b class="enh">+${it.enh}</b>` : ''}<small>${it.r}</small>${it.eq ? '<i class="eqb">E</i>' : ''}</button>`).join('') || '<div class="muted empty-msg">비어 있어요</div>'}</div>
      <div class="row"><button class="btn red" id="bag-dis" ${junk.length ? '' : 'disabled'}>C·B 일괄 분해 (${junk.length})</button></div></div>`, 'wide-modal');
    m.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { bagTab = b.dataset.bt; bag(); });
    m.querySelectorAll('[data-bid]').forEach(b => b.onclick = () => {
      const it = Gear.find(+b.dataset.bid);
      gearDetail(it.id, it.eq || (bagTab === 'hero' ? 'hero' : null), bag);
    });
    $('#bag-dis', m).onclick = async () => {
      if (!(await confirm(`착용하지 않은 C·B 장비 ${junk.length}개를 분해할까요?`, '분해'))) return bag();
      const n = Gear.disassemble(junk.map(x => x.id)); Game.save();
      toast(`분해 완료! ${ic('ench')} +${n}`); refreshTop(); bag();
    };
  }

  // ================= 장비 소환 =================
  function summonTabs() {
    return `<div class="seg sm-seg"><button data-sm="mon" class="${summonMode === 'mon' ? 'on' : ''}">🥚 몬스터 소환</button><button data-sm="gear" class="${summonMode === 'gear' ? 'on' : ''}">⚔️ 장비 소환</button></div>`;
  }
  function bindSummonTabs(p) { p.querySelectorAll('[data-sm]').forEach(b => b.onclick = () => { summonMode = b.dataset.sm; renderTab(); }); }

  function renderGearSummon(p) {
    const s = G.state;
    p.innerHTML = `${summonTabs()}
      <div class="summon">
        <div class="sm-banner gear">
          <div class="sm-gears">${['weapon', 'armor', 'ring', 'collar'].map((sl, i) => `<span>${Gear.icon({ slot: sl, r: RARITY_ORDER[5 - i] })}</span>`).join('')}</div>
          <div class="sm-title">장비 소환</div>
          <div class="sm-sub">캐릭터·몬스터 장비 · iLv.${Math.max(1, s.best)}</div>
        </div>
        <div class="sm-btns">
          <button class="btn" data-gp="1">1회 소환<small>${ic('gems')} 100</small></button>
          <button class="btn gold" data-gp="10">10회 소환<small>${ic('gems')} 900 · A↑ 확정</small></button>
          ${adBtn('무료 소환', adLeft('gearPull'), 'gp-ad')}
        </div>
      </div>
      <div class="rates">${RARITY_ORDER.slice().reverse().map(r => `<span style="color:${RARITY[r].color}">${r} ${GEAR_RARITY[r].rate}%</span>`).join(' · ')}</div>`;
    bindSummonTabs(p);
    p.querySelectorAll('[data-gp]').forEach(b => b.onclick = () => {
      const n = +b.dataset.gp, cost = n === 10 ? 900 : 100;
      if (s.gems < cost) { toast('다이아가 부족해요 — 상점에서 충전할 수 있어요'); return setTab('shop'); }
      if (s.gear.length + n > GEAR_BAG_MAX) return toast('가방이 가득 찼어요 — 분해 후 다시 시도하세요');
      s.gems -= cost;
      showGearPull(Gear.pull(n));
    });
    p.querySelector('.gp-ad').onclick = async () => {
      if (s.gear.length + 1 > GEAR_BAG_MAX) return toast('가방이 가득 찼어요');
      if (await watchAd('gearPull', 'free_gear_pull')) showGearPull(Gear.pull(1));
    };
  }

  function showGearPull(res) {
    const best = Math.max(...res.map(it => RARITY_ORDER.indexOf(it.r)));
    Sound.play('gacha');
    const html = res.map((it, i) => `<div class="pcard gearcard${RARITY_ORDER.indexOf(it.r) >= 3 ? ' hi' : ''}" style="--rc:${RARITY[it.r].color};animation-delay:${0.5 + i * 0.12}s">
      <div class="rt">${it.r}</div><div class="gi big">${Gear.icon(it)}</div><div class="nm">${Gear.name(it)}</div><div class="tag">${GEAR_SLOTS[it.slot].owner === 'hero' ? '캐릭터' : '몬스터'}</div></div>`).join('');
    modal(`<div class="pull-stage ${best >= 3 ? 'gold' : best >= 2 ? 'purple' : ''}"><div class="egg chest"></div></div>
      <div class="pull-res ${res.length > 1 ? 'ten' : ''}">${html}</div>
      <div class="row"><button class="btn gray" id="gp-auto">자동 장착</button><button class="btn" data-close>확인</button></div>`, 'pull-modal');
    $('#gp-auto').onclick = () => {
      let n = Gear.autoEquip('hero');
      G.state.team.forEach(id => { n += Gear.autoEquip('m:' + id); });
      Game.save(); Game.restartStage(); close(true); toast(n ? `장비 ${n}개 장착!` : '더 좋은 장비가 없어요'); refresh();
    };
    setTimeout(() => Sound.play(best >= 3 ? 'rare' : 'reward'), 500);
    refresh();
  }

  // ================= 출석 / 퀘스트 / 방치 / 부스트 / 설정 =================
  function attendance() {
    const a = G.state.attend, can = Game.canAttend();
    const todayIdx = can ? a.idx : (a.idx + ATTENDANCE.length - 1) % ATTENDANCE.length;
    const m = modal(`<div class="attend"><div class="rp-title">📅 출석 보상</div>
      <div class="att-grid">${ATTENDANCE.map((r, i) => {
        const got = i < todayIdx || (!can && i === todayIdx);
        const res = Game.resolveReward(r);
        return `<div class="att ${i === todayIdx ? 'today' : ''} ${got ? 'got' : ''} ${i === 6 ? 'd7' : ''}">
          <small>${i + 1}일차</small><div class="chips">${rewardChips(res)}</div>${got ? '<i class="chk">✔</i>' : ''}</div>`;
      }).join('')}</div>
      ${can ? `<div class="row"><button class="btn" id="att-1">받기</button>${adBtn('2배 받기', adLeft('attend'), 'att-ad')}</div>`
        : '<div class="center muted">오늘 출석 완료! 내일 또 만나요</div>'}</div>`);
    if (!can) return;
    $('#att-1', m).onclick = () => { const r = Game.attend(1); if (r) rewardPopup('출석 보상', r); };
    m.querySelector('.att-ad').onclick = async () => { if (await watchAd('attend', 'attend_double')) { const r = Game.attend(2); if (r) rewardPopup('출석 보상 2배!', r); } };
  }

  function quests() {
    Game.checkDaily();
    const q = G.state.quests;
    const done = QUESTS.filter(Q => q.claimed[Q.id]).length;
    const m = modal(`<div class="quests"><div class="rp-title">📜 일일 퀘스트</div>
      ${QUESTS.map(Q => {
        const pr = Math.min(Q.target, q.prog[Q.id] || 0), ok = pr >= Q.target, cl = q.claimed[Q.id];
        return `<div class="qrow ${cl ? 'claimed' : ''}">
          <div class="q-info"><b>${Q.name}</b><div class="pbar"><i style="width:${(pr / Q.target) * 100}%"></i></div><small>${pr}/${Q.target}</small></div>
          <div class="chips">${rewardChips(Game.resolveReward(Q.reward))}</div>
          <button class="btn ${ok && !cl ? 'green' : 'gray'}" data-qc="${Q.id}" ${ok && !cl ? '' : 'disabled'}>${cl ? '완료' : '받기'}</button>
        </div>`;
      }).join('')}
      <div class="qall ${q.all ? 'claimed' : ''}">
        <div><b>🏅 모든 퀘스트 완료</b> <small>${done}/${QUESTS.length}</small><div class="chips">${rewardChips(QUEST_ALL_REWARD)}</div></div>
        <button class="btn gold" id="q-all" ${Game.allQuestsClaimed() && !q.all ? '' : 'disabled'}>${q.all ? '완료' : '받기'}</button>
      </div></div>`, 'wide-modal');
    m.querySelectorAll('[data-qc]').forEach(b => b.onclick = () => { const r = Game.claimQuest(b.dataset.qc); if (r) { Sound.play('reward'); toast(`획득! ${rewardText(r)}`); quests(); refreshTop(); } });
    $('#q-all', m).onclick = () => { const r = Game.claimQuestAll(); if (r) rewardPopup('일일 퀘스트 올클리어!', r); };
  }

  function idleModal() {
    const s = G.state, r = Game.idleRate();
    const m = modal(`<div class="center rpop"><div class="rp-title">🎁 방치 보상</div>
      <div class="muted small">분당 ${ic('gold')}${fmt(r.gold)} · 최대 12시간 저장</div>
      <div class="chips big">${rewardChips({ gold: s.idle.gold })}</div>
      <div class="row"><button class="btn" id="idle-1">받기</button>${adBtn('2배 받기', adLeft('idle'), 'idle-ad')}</div></div>`);
    $('#idle-1', m).onclick = () => {
      const g = Game.claimIdle(1);
      if (!g.gold) return toast('아직 쌓인 보상이 없어요');
      close(true); Sound.play('coin'); toast(`획득! ${rewardText(g)}`); refresh();
    };
    m.querySelector('.idle-ad').onclick = async () => {
      if (G.state.idle.gold < 1) return toast('아직 쌓인 보상이 없어요');
      if (await watchAd('idle', 'idle_double')) rewardPopup('2배 획득!', Game.claimIdle(2));
    };
  }

  function boostModal() {
    const on = Game.boosted();
    const m = modal(`<div class="center rpop"><div class="rp-title">⚡ 2배 부스트</div>
      <p>${BOOST_MIN}분 동안 <b>전투 속도</b>와 <b>방치 보상</b>이 2배!<br><small class="muted">${on ? '부스트 중 — 시청하면 30분 연장' : '광고 1회 시청'}</small></p>
      ${adBtn('부스트 발동', adLeft('boost'), 'boost-ad')}</div>`);
    m.querySelector('.boost-ad').onclick = async () => {
      if (await watchAd('boost', 'boost_2x')) {
        G.state.boostUntil = Math.max(Date.now(), G.state.boostUntil) + BOOST_MIN * 60000;
        Game.save(); close(true); Sound.play('reward'); toast('⚡ 2배 부스트 발동!'); refresh();
      }
    };
  }

  function settings() {
    const st = G.state.settings, a = Assets.stats();
    const m = modal(`<div class="settings"><div class="rp-title">⚙️ 설정</div>
      <label class="tg"><span>배경음악</span><input type="checkbox" id="st-bgm" ${st.bgm ? 'checked' : ''}><i></i></label>
      <label class="tg"><span>효과음</span><input type="checkbox" id="st-sfx" ${st.sfx ? 'checked' : ''}><i></i></label>
      <div class="card small"><b>에셋 상태</b> <span class="muted">(assets 폴더)</span><br>
        캐릭터 ${a.hero}/${a.heroTotal} · 몬스터 ${a.monsters}/${a.monstersTotal} · 적 ${a.enemies}/${a.enemiesTotal} · 장비 ${a.gear}/${a.gearTotal}<br>배경 ${a.bg}/${a.bgTotal} · UI ${a.ui}/${a.uiTotal}<br>
        <span class="muted">없는 파일은 기본 그림으로 표시돼요</span></div>
      <button class="btn gray wide" id="st-reset">데이터 초기화</button>
      <div class="small muted center">몬스터 키우기 v0.3</div></div>`);
    $('#st-bgm', m).onchange = e => { st.bgm = e.target.checked; Sound.set('bgm', st.bgm); Game.save(); updSnd(); };
    $('#st-sfx', m).onchange = e => { st.sfx = e.target.checked; Sound.set('sfx', st.sfx); Game.save(); updSnd(); };
    $('#st-reset', m).onclick = async () => { if (await confirm('모든 진행 데이터를 삭제할까요?', '초기화')) Game.reset(); };
  }
  function updSnd() { const s = G.state.settings; $('#snd-btn').textContent = s.bgm || s.sfx ? '🔊' : '🔇'; }

  // ================= 시작 / 오프라인 =================
  function offline(sec) {
    const h = Math.floor(sec / 3600), mi = Math.floor(sec / 60) % 60;
    setTimeout(() => {
      const m = modal(`<div class="center rpop"><div class="rp-title">🌙 다녀오셨어요!</div>
        <p>${h ? h + '시간 ' : ''}${mi}분 동안 몬스터들이 사냥했어요</p>
        <div class="chips big">${rewardChips({ gold: G.state.idle.gold })}</div>
        <div class="row"><button class="btn" id="off-1">받기</button>${adBtn('2배 받기', adLeft('idle'), 'off-ad')}</div></div>`, '',
        () => { if (Game.canAttend()) setTimeout(attendance, 300); });
      $('#off-1', m).onclick = () => { const r = Game.claimIdle(1); close(); toast(`획득! ${rewardText(r)}`); refresh(); };
      m.querySelector('.off-ad').onclick = async () => { if (await watchAd('idle', 'offline_double')) { const r = Game.claimIdle(2); close(); toast(`2배 획득! ${rewardText(r)}`); refresh(); } };
    }, 300);
  }

  function intro() {
    modal(`<div class="center intro">
      <div class="intro-arts">${['jipsin', 'tteok', 'dukkeobi'].map(id => `<div>${mon(id, 0)}</div>`).join('')}</div>
      <div class="rp-title">몬스터 키우기</div>
      <p>몬스터들이 <b>자동으로 전투</b>하며 스테이지를 올라가요.<br>
      <b>레벨업 · 진화 · 성급 강화</b>로 키우고<br><b>소환</b>으로 새로운 몬스터를 모아보세요!</p>
      <p class="muted small">시작 선물: 💎300 (소환 3회)</p>
      <button class="btn wide" data-close>시작하기</button></div>`, '', () => setTimeout(attendance, 300));
    G.state.seenIntro = true; Game.save();
  }

  function applyIcons() {
    document.querySelectorAll('[data-ic]').forEach(n => {
      const k = n.dataset.ic, h = Assets.icon(k, null);
      if (h) n.innerHTML = h;
    });
  }

  function init() {
    document.querySelectorAll('#nav button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
    $('#speed-btn').onclick = () => { G.speed = G.speed === 1 ? 1.5 : 1; $('#speed-btn').textContent = `x${G.speed}`; };
    $('#snd-btn').onclick = () => {
      const s = G.state.settings, on = !(s.bgm || s.sfx);
      s.bgm = on; s.sfx = on; Sound.set('bgm', on); Sound.set('sfx', on); Game.save(); updSnd();
    };
    $('#set-btn').onclick = settings;
    $('#gem-btn').onclick = () => setTab('shop');
    $('#sb-attend').onclick = attendance;
    $('#sb-quest').onclick = quests;
    $('#sb-chest').onclick = idleModal;
    $('#sb-boost').onclick = boostModal;
    document.addEventListener('click', e => { if (e.target.closest('button')) Sound.play('click'); }, true);
    Assets.onChange(() => { applyIcons(); $('#field').dataset.el = ''; if (G.battle) BattleView.render(G.battle); renderTab(); });
    updSnd();
    setTab('home');
    refresh();
  }

  return { init, toast, modal, close, confirm, refresh, refreshStage, modeHud, raidBar, tickUI, offline, intro, setTab, createHero,
    attendance, raidResult, arenaResult };
})();
