// ===== UI: 탭 / 모달 / 화면 =====
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  let tab = 'home';
  let monFilter = 'all';

  const ICON = { gold: '💰', food: '🍖', gems: '💎', stones: '🔮' };

  // ---------- 공통 ----------
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 1800);
    setTimeout(() => t.remove(), 2200);
  }

  function modal(html, cls = '') {
    close();
    const m = document.createElement('div');
    m.className = 'modal-bg';
    m.innerHTML = `<div class="modal ${cls}"><button class="x" data-close>✕</button>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) close(); });
    document.body.appendChild(m);
    return m.querySelector('.modal');
  }
  function close() { document.querySelectorAll('.modal-bg').forEach(n => n.remove()); }

  function confirm(html, okText = '확인') {
    return new Promise(res => {
      const m = modal(`<div class="confirm">${html}</div><div class="row"><button class="btn gray" data-no>취소</button><button class="btn" data-ok>${okText}</button></div>`);
      m.querySelector('[data-ok]').onclick = () => { close(); res(true); };
      m.querySelector('[data-no]').onclick = () => { close(); res(false); };
      m.parentNode.addEventListener('click', e => { if (e.target === m.parentNode || e.target.hasAttribute('data-close')) res(false); });
    });
  }

  function rewardText(r) {
    return Object.entries(r).filter(([k, v]) => v > 0 && ICON[k]).map(([k, v]) => `${ICON[k]} ${fmt(v)}`).join('  ');
  }

  function adBtn(label, left, cls = '') {
    return `<button class="btn ad ${cls}" ${left <= 0 ? 'disabled' : ''}><span class="adtag">AD</span>${label}<small>${left}회</small></button>`;
  }

  async function watchAd(kind, placement) {
    Game.checkDaily();
    const d = G.state.daily;
    if (d[kind] >= AD_LIMITS[kind]) { toast('오늘 광고 횟수를 모두 사용했어요'); return false; }
    const ok = await Monetize.showRewarded(placement);
    if (!ok) { toast('광고를 끝까지 시청해야 보상을 받아요'); return false; }
    d[kind]++;
    return true;
  }
  const adLeft = kind => AD_LIMITS[kind] - G.state.daily[kind];

  // ---------- 상단바 ----------
  function refreshTop() {
    const s = G.state;
    for (const k of ['gold', 'food', 'gems', 'stones']) $(`#c-${k}`).textContent = fmt(s[k]);
  }

  function refreshStage() {
    const B = G.battle;
    if (!B) return;
    const info = B.info;
    $('#stage-label').innerHTML = `${ELEMENTS[info.el].icon} 스테이지 ${info.label}${info.boss ? ' <span class="bosstag">BOSS</span>' : ''}`;
    $('#wave-label').textContent = `웨이브 ${B.wave + 1}/${B.waves}`;
    $('#mode-label').textContent = G.state.autoChallenge ? '도전 중' : '반복 사냥';
    $('#mode-label').className = 'mode ' + (G.state.autoChallenge ? 'on' : 'off');
  }

  function refresh() { refreshTop(); refreshStage(); renderTab(); }

  // 0.5초마다 호출
  function tickUI() {
    refreshTop();
    const bt = $('#boost-label');
    if (Game.boosted()) {
      const left = Math.ceil((G.state.boostUntil - Date.now()) / 1000);
      bt.textContent = `⚡x2 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      bt.style.display = '';
    } else bt.style.display = 'none';
    if (tab === 'home') {
      const ig = $('#idle-gold'), ifd = $('#idle-food');
      if (ig) { ig.textContent = fmt(G.state.idle.gold); ifd.textContent = fmt(G.state.idle.food); }
      const bb = $('#boost-btn-sub');
      if (bb) bb.textContent = Game.boosted() ? '부스트 중 (+30분 연장)' : '전투 속도 & 방치 보상 2배';
    }
    if (tab === 'exped') updateExpedTimers();
  }

  // ---------- 탭 ----------
  function setTab(t) {
    tab = t;
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    renderTab();
    $('#panel').scrollTop = 0;
  }

  function renderTab() {
    const p = $('#panel');
    ({ home: renderHome, mons: renderMons, summon: renderSummon, exped: renderExped, shop: renderShop })[tab](p);
  }

  // ---------- 홈 ----------
  function renderHome(p) {
    const s = G.state, r = Game.idleRate();
    const next = Game.stageInfo(s.best + 1);
    p.innerHTML = `
      <div class="card stagecard">
        <div>
          <div class="muted">최고 기록</div>
          <div class="big">${s.best ? Game.stageInfo(s.best).label : '-'}</div>
        </div>
        <div>
          <div class="muted">팀 전투력</div>
          <div class="big">⚔️ ${fmt(Game.teamPower())}</div>
        </div>
        <button class="btn ${next.boss ? 'red' : ''}" id="challenge" ${s.autoChallenge ? 'disabled' : ''}>
          ${s.autoChallenge ? '자동 도전 중' : (next.boss ? '👑 보스 도전' : '▶ 다음 스테이지 도전')}
        </button>
      </div>

      <div class="card idle">
        <div class="idle-head"><span>🎁 방치 보상</span><small class="muted">분당 💰${fmt(r.gold)} 🍖${fmt(r.food)} · 최대 12시간</small></div>
        <div class="idle-amt">💰 <b id="idle-gold">${fmt(s.idle.gold)}</b> &nbsp; 🍖 <b id="idle-food">${fmt(s.idle.food)}</b></div>
        <div class="row">
          <button class="btn" id="claim">받기</button>
          ${adBtn('2배로 받기', adLeft('idle'))}
        </div>
      </div>

      <div class="card boost">
        <div class="boost-info"><b>⚡ 2배 부스트 (${BOOST_MIN}분)</b><small id="boost-btn-sub" class="muted"></small></div>
        ${adBtn('광고 보고 부스트', adLeft('boost'), 'boost-ad')}
      </div>

      <div class="card">
        <div class="card-head"><b>내 팀 (${s.team.length}/5)</b><button class="link" data-goto="mons">편성 변경 ›</button></div>
        <div class="teamrow">${s.team.map(id => monCard(id, true)).join('')}${'<div class="mcard empty">+</div>'.repeat(5 - s.team.length)}</div>
      </div>

      <div class="card tips">
        <b>💡 팁</b>
        <ul>
          <li>속성 상성: 🔥 › 🌿 › 💧 › 🔥 · ✨ ⇄ 🌙 (유리하면 1.5배)</li>
          <li>최대 레벨에 도달하면 🔮진화석으로 진화할 수 있어요</li>
          <li>중복 몬스터는 조각이 되어 ⭐성급을 올려줘요</li>
        </ul>
        <button class="link danger" id="reset">데이터 초기화</button>
      </div>`;
    $('#challenge', p).onclick = () => { Game.challenge(); renderTab(); };
    $('#claim', p).onclick = () => {
      const r = Game.claimIdle(1);
      if (!r.gold && !r.food) return toast('아직 쌓인 보상이 없어요');
      toast(`획득! ${rewardText(r)}`); refresh();
    };
    p.querySelector('.idle .ad').onclick = async () => {
      if (G.state.idle.gold < 1) return toast('아직 쌓인 보상이 없어요');
      if (await watchAd('idle', 'idle_double')) { const r = Game.claimIdle(2); toast(`2배 획득! ${rewardText(r)}`); refresh(); }
    };
    p.querySelector('.boost-ad').onclick = async () => {
      if (await watchAd('boost', 'boost_2x')) {
        G.state.boostUntil = Math.max(Date.now(), G.state.boostUntil) + BOOST_MIN * 60000;
        Game.save(); toast('⚡ 2배 부스트 발동!'); refresh();
      }
    };
    p.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => setTab(b.dataset.goto));
    p.querySelectorAll('.teamrow .mcard[data-id]').forEach(c => c.onclick = () => detail(c.dataset.id));
    $('#reset', p).onclick = async () => { if (await confirm('모든 진행 데이터를 삭제할까요?', '초기화')) Game.reset(); };
    tickUI();
  }

  // ---------- 몬스터 카드 ----------
  function stars(n) { return n ? '★'.repeat(n) : ''; }

  function monCard(id, small) {
    const L = LINE_MAP[id], o = G.state.owned[id];
    if (!o) {
      return `<div class="mcard locked" data-lock="${id}" style="--rc:${RARITY[L.r].color}">
        <div class="art">${Art.creature(id, 0, { silhouette: true })}</div>
        <div class="nm">???</div><div class="rt">${L.r}</div></div>`;
    }
    const inTeam = G.state.team.includes(id);
    const evo = Game.canEvolve(id), starOk = o.star < MAX_STAR && (G.state.shards[id] || 0) >= Game.starCost(o.star);
    return `<div class="mcard${inTeam && !small ? ' inteam' : ''}" data-id="${id}" style="--rc:${RARITY[L.r].color}">
      <div class="rt">${L.r}</div><div class="elx">${ELEMENTS[L.el].icon}</div>
      ${(evo || starOk) && !small ? '<div class="dot">!</div>' : ''}
      <div class="art">${Art.creature(id, o.form)}</div>
      <div class="st">${stars(o.star)}</div>
      <div class="nm">${L.names[o.form]}</div>
      <div class="lv">Lv.${o.lvl}</div>
    </div>`;
  }

  // ---------- 몬스터 탭 ----------
  function renderMons(p) {
    const s = G.state;
    const ownedN = Object.keys(s.owned).length;
    let list = LINES.slice();
    if (monFilter !== 'all') list = list.filter(l => l.el === monFilter);
    list.sort((a, b) => {
      const oa = s.owned[a.id], ob = s.owned[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      if (oa && ob) return Game.power(Game.monStats(b.id)) - Game.power(Game.monStats(a.id));
      return RARITY_ORDER.indexOf(b.r) - RARITY_ORDER.indexOf(a.r);
    });
    p.innerHTML = `
      <div class="card-head pad"><b>도감 ${ownedN}/${LINES.length}</b><small class="muted">카드를 눌러 육성 · 팀 편성</small></div>
      <div class="filters">
        <button data-f="all" class="${monFilter === 'all' ? 'on' : ''}">전체</button>
        ${Object.entries(ELEMENTS).map(([k, e]) => `<button data-f="${k}" class="${monFilter === k ? 'on' : ''}">${e.icon}</button>`).join('')}
      </div>
      <div class="grid">${list.map(l => monCard(l.id)).join('')}</div>`;
    p.querySelectorAll('.filters button').forEach(b => b.onclick = () => { monFilter = b.dataset.f; renderTab(); });
    p.querySelectorAll('.mcard[data-id]').forEach(c => c.onclick = () => detail(c.dataset.id));
    p.querySelectorAll('.mcard[data-lock]').forEach(c => c.onclick = () => toast('소환에서 획득할 수 있어요'));
  }

  // ---------- 상세 / 육성 ----------
  function detail(id) {
    const L = LINE_MAP[id], o = G.state.owned[id], s = G.state;
    const st = Game.monStats(id), cap = FORM_CAP[o.form];
    const cost = Game.levelCost(o.lvl);
    const maxed = o.lvl >= cap;
    const inTeam = s.team.includes(id);
    const shards = s.shards[id] || 0, need = Game.starCost(o.star);
    const evoC = EVO_COST[o.form];
    const nextSt = !maxed ? Game.stats(id, o.lvl + 1, o.form, o.star) : null;
    const m = modal(`
      <div class="detail" style="--rc:${RARITY[L.r].color}">
        <div class="d-top">
          <div class="d-art" data-el="${L.el}">${Art.creature(id, o.form)}</div>
          <div class="d-info">
            <div><span class="rbadge">${L.r}</span> <span class="ebadge">${ELEMENTS[L.el].icon} ${ELEMENTS[L.el].name}</span></div>
            <div class="d-name">${L.names[o.form]}</div>
            <div class="muted">${FORM_LABEL[o.form]} · Lv.${o.lvl}/${cap}</div>
            <div class="d-star">${'★'.repeat(o.star)}<span class="muted">${'☆'.repeat(MAX_STAR - o.star)}</span></div>
            <div class="d-pow">⚔️ ${fmt(Game.power(st))}</div>
          </div>
        </div>
        <div class="d-stats">
          <div>공격 <b>${fmt(st.atk)}</b>${nextSt ? `<small>+${nextSt.atk - st.atk}</small>` : ''}</div>
          <div>체력 <b>${fmt(st.hp)}</b>${nextSt ? `<small>+${nextSt.hp - st.hp}</small>` : ''}</div>
          <div>방어 <b>${fmt(st.def)}</b>${nextSt ? `<small>+${nextSt.def - st.def}</small>` : ''}</div>
        </div>
        <div class="d-skill"><b>${SKILLS[L.skill].name}</b> <span class="muted">${SKILLS[L.skill].desc}</span></div>
        <div class="evo-line">${L.names.map((n, i) => `<div class="${i <= o.form ? '' : 'future'}">${Art.creature(id, i, { silhouette: i > o.form })}<small>${i <= o.form ? n : '???'}</small></div>`).join('<span>›</span>')}</div>

        <div class="d-actions">
          ${!maxed ? `
            <button class="btn" data-lv="1">레벨업<small>💰${fmt(cost.gold)} 🍖${fmt(cost.food)}</small></button>
            <button class="btn" data-lv="10">+10 레벨<small>가능한 만큼</small></button>`
          : o.form < 2 ? `
            <button class="btn purple wide" data-evo ${Game.canEvolve(id) ? '' : 'disabled'}>✨ 진화 → ${L.names[o.form + 1]}<small>🔮${s.stones}/${evoC.stones} 💰${fmt(evoC.gold)}</small></button>`
          : `<div class="muted wide center">최대 레벨 · 최종 진화 완료!</div>`}
          <button class="btn gold" data-star ${o.star < MAX_STAR && shards >= need ? '' : 'disabled'}>⭐ 성급 강화<small>${o.star >= MAX_STAR ? 'MAX' : `조각 ${shards}/${need}`}</small></button>
          <button class="btn ${inTeam ? 'gray' : 'green'}" data-team>${inTeam ? '팀에서 빼기' : '팀에 넣기'}</button>
        </div>
      </div>`, 'wide-modal');
    m.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
      const n = Game.levelUp(id, +b.dataset.lv);
      if (!n) return toast('💰골드 또는 🍖먹이가 부족해요');
      toast(`레벨 +${n}!`); Game.save(); after(id);
    });
    const ev = m.querySelector('[data-evo]');
    if (ev) ev.onclick = () => {
      if (Game.evolve(id)) { Game.save(); Game.restartStage(); evoFx(id); }
    };
    m.querySelector('[data-star]').onclick = () => { if (Game.starUp(id)) { toast('⭐ 성급 상승!'); Game.save(); after(id); } };
    m.querySelector('[data-team]').onclick = () => {
      const r = Game.toggleTeam(id);
      if (r === 'full') return toast('팀은 최대 5마리예요');
      if (r === 'last') return toast('최소 1마리는 팀에 있어야 해요');
      Game.save(); after(id);
    };
  }
  function after(id) { refresh(); detail(id); }

  function evoFx(id) {
    const L = LINE_MAP[id], o = G.state.owned[id];
    const m = modal(`<div class="evofx"><div class="evo-glow">${Art.creature(id, o.form)}</div>
      <div class="d-name">진화 성공!</div><div>${L.names[o.form - 1]} → <b>${L.names[o.form]}</b></div>
      <button class="btn" data-close>확인</button></div>`);
    refresh();
  }

  // ---------- 소환 ----------
  function renderSummon(p) {
    const s = G.state;
    const rates = RARITY_ORDER.slice().reverse().map(r => `<span style="color:${RARITY[r].color}">${r} ${RARITY[r].rate}%</span>`).join(' · ');
    p.innerHTML = `
      <div class="banner-card">
        <div class="bc-arts">${['dragon', 'ember', 'angel', 'bat', 'koi'].map(id => `<div>${Art.creature(id, 2)}</div>`).join('')}</div>
        <div class="bc-title">✨ 몬스터 소환 ✨</div>
        <div class="bc-sub">SSR 확정까지 <b>${80 - s.pity}</b>회</div>
      </div>
      <div class="card">
        <div class="row">
          <button class="btn" data-pull="1">1회 소환<small>💎 100</small></button>
          <button class="btn gold" data-pull="10">10회 소환<small>💎 900 · SR 이상 1개 확정</small></button>
        </div>
        <div class="row">${adBtn('무료 소환', adLeft('pull'), 'pull-ad')}</div>
      </div>
      <div class="card small muted">
        <b>확률</b><br>${rates}<br>
        80회 소환 안에 SSR 이상 확정 · 중복 시 조각 ${DUP_SHARDS}개 · 총 소환 ${s.totalPulls}회
      </div>`;
    p.querySelectorAll('[data-pull]').forEach(b => b.onclick = () => {
      const n = +b.dataset.pull, cost = n === 10 ? 900 : 100;
      if (s.gems < cost) { toast('💎 젬이 부족해요 — 상점에서 충전할 수 있어요'); return setTab('shop'); }
      s.gems -= cost;
      showPull(Game.pull(n));
    });
    p.querySelector('.pull-ad').onclick = async () => { if (await watchAd('pull', 'free_pull')) showPull(Game.pull(1)); };
  }

  function showPull(res) {
    const html = res.map((r, i) => {
      const L = LINE_MAP[r.id];
      const hi = RARITY_ORDER.indexOf(L.r) >= 3;
      return `<div class="pcard${hi ? ' hi' : ''}" style="--rc:${RARITY[L.r].color};animation-delay:${i * 0.12}s">
        <div class="rt">${L.r}</div>
        <div class="art">${Art.creature(r.id, 0)}</div>
        <div class="nm">${L.names[0]}</div>
        <div class="tag">${r.isNew ? 'NEW!' : `조각 +${r.shards}`}</div></div>`;
    }).join('');
    modal(`<div class="pull-res ${res.length > 1 ? 'ten' : ''}">${html}</div><button class="btn wide" data-close>확인</button>`, 'pull-modal');
    refresh();
  }

  // ---------- 탐험 ----------
  function renderExped(p) {
    const s = G.state;
    p.innerHTML = `<div class="card-head pad"><b>🧭 탐험</b><small class="muted">몬스터를 보내 시간이 지나면 보상 획득</small></div>
      ${s.exped.map((x, i) => {
        if (!x) return `<div class="card exp">
          <div class="exp-title">탐험대 ${i + 1} <span class="muted">· 대기 중</span></div>
          <div class="exp-opts">${EXPEDITIONS.map((e, k) => `<button class="btn small-btn" data-start="${i}" data-type="${k}">${e.label}<small>💎${e.gems}${e.stones ? ` 🔮${e.stones}` : ''}</small></button>`).join('')}</div>
        </div>`;
        return `<div class="card exp" data-slot="${i}">
          <div class="exp-title">탐험대 ${i + 1} <span class="muted">· ${EXPEDITIONS[x.type].label}</span></div>
          <div class="exp-rw">${rewardText(x.reward)}</div>
          <div class="pbar"><i></i></div>
          <div class="exp-time"></div>
          <div class="row exp-btns"></div>
        </div>`;
      }).join('')}
      <div class="card small muted">광고 1회 시청 시 탐험 시간 30분 단축 (하루 ${AD_LIMITS.exped}회) · 젬으로 즉시 완료 가능</div>`;
    p.querySelectorAll('[data-start]').forEach(b => b.onclick = () => { Game.startExped(+b.dataset.start, +b.dataset.type); renderTab(); });
    updateExpedTimers(true);
  }

  function updateExpedTimers(force) {
    const p = $('#panel');
    G.state.exped.forEach((x, i) => {
      const c = p.querySelector(`.exp[data-slot="${i}"]`);
      if (!x || !c) return;
      const total = x.end - x.start, left = Math.max(0, x.end - Date.now());
      c.querySelector('.pbar i').style.width = (100 - (left / total) * 100) + '%';
      const done = left <= 0;
      const secs = Math.ceil(left / 1000);
      c.querySelector('.exp-time').textContent = done ? '탐험 완료!' : `남은 시간 ${Math.floor(secs / 3600)}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      const btns = c.querySelector('.exp-btns');
      const state = done ? 'done' : 'run';
      if (btns.dataset.state === state && !force) {
        const sk = btns.querySelector('[data-skip] small');
        if (sk) sk.textContent = `💎 ${Game.skipCost(i)}`;
        return;
      }
      btns.dataset.state = state;
      if (done) {
        btns.innerHTML = `<button class="btn green wide" data-claim>보상 받기</button>`;
        btns.querySelector('[data-claim]').onclick = () => { const r = Game.claimExped(i); if (r) { toast(`탐험 보상! ${rewardText(r)}`); refresh(); } };
      } else {
        btns.innerHTML = `${adBtn('30분 단축', adLeft('exped'), 'exp-ad')}<button class="btn gold" data-skip>즉시 완료<small>💎 ${Game.skipCost(i)}</small></button>`;
        btns.querySelector('.exp-ad').onclick = async () => {
          if (await watchAd('exped', 'exped_skip')) { x.end -= 30 * 60000; Game.save(); toast('⏩ 30분 단축!'); renderTab(); }
        };
        btns.querySelector('[data-skip]').onclick = () => {
          const c2 = Game.skipCost(i);
          if (G.state.gems < c2) return toast('💎 젬이 부족해요');
          G.state.gems -= c2; x.end = Date.now(); Game.save(); renderTab();
        };
      }
    });
  }

  // ---------- 상점 ----------
  function renderShop(p) {
    const s = G.state, r = Game.idleRate();
    const goldAmt = Math.round(r.gold * 120);
    p.innerHTML = `
      <div class="card-head pad"><b>🛒 상점</b></div>
      <div class="card shop-free">
        <div><b>무료 젬</b><br><small class="muted">광고 시청 시 💎${AD_GEM_REWARD}</small></div>
        ${adBtn('받기', adLeft('gem'), 'gem-ad')}
      </div>

      <div class="sec-title">💎 젬 충전</div>
      <div class="shop-grid">
        ${IAP.map(it => `<button class="shop-item" data-iap="${it.id}"><div class="si-ic">💎</div><div class="si-nm">${it.name}</div><div class="si-pr">${it.price}</div></button>`).join('')}
      </div>

      <div class="sec-title">🎁 패키지</div>
      <div class="card pkg ${s.bought.starter ? 'sold' : ''}">
        <div><b>스타터 패키지</b> <span class="badge">1회 한정</span><br><small class="muted">💎1,000 · 🔮10 · 💰20,000</small></div>
        <button class="btn gold" data-pkg="starter" ${s.bought.starter ? 'disabled' : ''}>${s.bought.starter ? '구매 완료' : '₩3,300'}</button>
      </div>
      <div class="card pkg ${s.adFree ? 'sold' : ''}">
        <div><b>광고 제거 패스</b> <span class="badge">영구</span><br><small class="muted">광고 없이 모든 광고 보상 즉시 획득</small></div>
        <button class="btn gold" data-pkg="adfree" ${s.adFree ? 'disabled' : ''}>${s.adFree ? '보유 중' : '₩5,500'}</button>
      </div>

      <div class="sec-title">💠 젬 교환</div>
      <div class="card pkg">
        <div><b>골드 주머니</b><br><small class="muted">💰${fmt(goldAmt)} (방치 2시간분)</small></div>
        <button class="btn" data-ex="gold">💎 100</button>
      </div>
      <div class="card pkg">
        <div><b>진화석 x5</b><br><small class="muted">🔮5</small></div>
        <button class="btn" data-ex="stones">💎 150</button>
      </div>
      <div class="card pkg">
        <div><b>먹이 상자</b><br><small class="muted">🍖${fmt(r.food * 120)}</small></div>
        <button class="btn" data-ex="food">💎 100</button>
      </div>
      <p class="small muted center">테스트 빌드: 결제는 실제로 청구되지 않습니다.</p>`;

    p.querySelector('.gem-ad').onclick = async () => {
      if (await watchAd('gem', 'free_gems')) { s.gems += AD_GEM_REWARD; Game.save(); toast(`💎 +${AD_GEM_REWARD}`); refresh(); }
    };
    p.querySelectorAll('[data-iap]').forEach(b => b.onclick = async () => {
      const it = IAP.find(x => x.id === b.dataset.iap);
      if (await Monetize.purchase(it)) { s.gems += it.gems; Game.save(); toast(`💎 ${fmt(it.gems)} 충전 완료!`); refresh(); }
    });
    p.querySelectorAll('[data-pkg]').forEach(b => b.onclick = async () => {
      const k = b.dataset.pkg;
      if (k === 'starter' && await Monetize.purchase({ name: '스타터 패키지', price: '₩3,300' })) {
        s.gems += 1000; s.stones += 10; s.gold += 20000; s.bought.starter = true; toast('스타터 패키지 지급 완료!');
      }
      if (k === 'adfree' && await Monetize.purchase({ name: '광고 제거 패스', price: '₩5,500' })) {
        s.adFree = true; toast('광고 제거 패스 적용!');
      }
      Game.save(); refresh();
    });
    p.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => {
      const k = b.dataset.ex, cost = k === 'stones' ? 150 : 100;
      if (s.gems < cost) return toast('💎 젬이 부족해요');
      s.gems -= cost;
      if (k === 'gold') s.gold += goldAmt;
      if (k === 'food') s.food += r.food * 120;
      if (k === 'stones') s.stones += 5;
      Game.save(); toast('교환 완료!'); refresh();
    });
  }

  // ---------- 시작 / 오프라인 ----------
  function offline(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
    setTimeout(() => {
      const md = modal(`<div class="center"><div class="big">🌙 다녀오셨어요!</div>
        <p>${h ? h + '시간 ' : ''}${m}분 동안 몬스터들이 사냥했어요</p>
        <div class="idle-amt">💰 <b>${fmt(G.state.idle.gold)}</b> &nbsp; 🍖 <b>${fmt(G.state.idle.food)}</b></div>
        <div class="row"><button class="btn" data-a="1">받기</button>${adBtn('2배 받기', adLeft('idle'))}</div></div>`);
      md.querySelector('[data-a]').onclick = () => { const r = Game.claimIdle(1); close(); toast(`획득! ${rewardText(r)}`); refresh(); };
      md.querySelector('.ad').onclick = async () => {
        if (await watchAd('idle', 'offline_double')) { const r = Game.claimIdle(2); close(); toast(`2배 획득! ${rewardText(r)}`); refresh(); }
      };
    }, 300);
  }

  function intro() {
    const m = modal(`<div class="center intro">
      <div class="intro-arts">${['coal', 'clam', 'acorn'].map(id => Art.creature(id, 0)).join('')}</div>
      <div class="big">몬스터 키우기에 오신 걸 환영해요!</div>
      <p>몬스터들이 <b>자동으로 전투</b>하며 스테이지를 올라가요.<br>
      보상으로 <b>레벨업 · 진화 · 성급 강화</b>하고<br><b>소환</b>으로 새로운 몬스터를 모아보세요!</p>
      <p class="muted small">시작 선물: 💎300 (소환 3회)</p>
      <button class="btn wide" data-close>시작하기</button></div>`);
    G.state.seenIntro = true; Game.save();
  }

  function init() {
    document.querySelectorAll('#nav button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
    $('#speed-btn').onclick = () => {
      G.speed = G.speed === 1 ? 1.5 : 1;
      $('#speed-btn').textContent = `x${G.speed}`;
    };
    setTab('home');
  }

  return { init, toast, modal, close, confirm, refresh, refreshStage, tickUI, offline, intro, setTab };
})();
