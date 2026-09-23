// UI: HUD, 미니맵, 대화창, 메뉴 시트(캐릭터·장비·스킬·소환·퀘스트·도감·설정), 대장간·상점, 타이틀
'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const UI = (R.UI = {});
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
  const pct = (v) => `${Math.round(v * 1000) / 10}%`;

  UI.isOpen = () => !$('dialog').classList.contains('hidden') || !$('panel').classList.contains('hidden') || !$('popup').classList.contains('hidden');

  // ─── 스프라이트 → 캔버스 ─────────────────────────────
  function fitSprite(g, key, fallback, W, H, pad = 1) {
    const img = R.SPR.frame(key) ? R.SPR.frameCanvas(key) : fallback;
    if (!img) return;
    const k = Math.min((W - pad * 2) / img.width, (H - pad * 2) / img.height);
    g.imageSmoothingEnabled = !!R.SPR.frame(key);
    g.drawImage(img, (W - img.width * k) / 2, H - pad - img.height * k, img.width * k, img.height * k);
  }
  UI.fitSprite = fitSprite;
  function spriteCanvas(key, W, H, cls, fallback) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    if (cls) c.className = cls;
    fitSprite(c.getContext('2d'), key, fallback, W, H, 2);
    return c;
  }
  const playerKey = () => (G.save.adv && R.SPR.frame(G.save.adv) ? G.save.adv : G.save.cls);
  R.SPR.onSheetReady = () => {
    if (!$('title').classList.contains('hidden')) UI.showTitle();
    if (!$('select').classList.contains('hidden')) UI.showSelect();
    UI.drawFace();
  };

  // ─── 토스트 / 배너 ───────────────────────────────────
  R.toast = function (text, color = '#fff') {
    const box = $('toasts');
    const d = document.createElement('div');
    d.className = 'toast';
    d.style.setProperty('--c', color);
    d.textContent = text;
    box.appendChild(d);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => d.classList.add('out'), 2300);
    setTimeout(() => d.remove(), 2700);
  };
  UI.banner = function (text, color = '#fff', sub = '') {
    const b = $('banner');
    b.classList.add('hidden');
    void b.offsetWidth;
    b.innerHTML = `<span style="--c:${color}">${esc(text)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    b.classList.remove('hidden');
    clearTimeout(UI._bt);
    UI._bt = setTimeout(() => b.classList.add('hidden'), 2300);
  };

  // ─── 대화창 (NPC 초상화 포함) ────────────────────────
  let dlg = null;
  function drawDialogFace(name) {
    const cv = $('dlg-face'), g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const npc = G.map && G.map.npcs.find((n) => n.name === name);
    if (!npc) { cv.parentElement.classList.add('hidden'); return; }
    cv.parentElement.classList.remove('hidden');
    const img = R.SPR.human('npc' + npc.id, npc.look, 'down', 0, false, 4);
    g.imageSmoothingEnabled = false;
    // 얼굴 위주로 크게
    g.drawImage(img, 0, 0, img.width, img.height * 0.62, (cv.width - img.width * 1.5) / 2, 6, img.width * 1.5, img.height * 0.93);
  }
  UI.say = function (name, lines, choices, onEnd) {
    dlg = { name, lines: lines.slice(), choices, onEnd, i: 0, shown: 0, full: false };
    $('dialog').classList.remove('hidden');
    $('dlg-name').textContent = name;
    drawDialogFace(name);
    showLine();
  };
  function showLine() {
    dlg.shown = 0; dlg.full = false;
    $('dlg-text').textContent = '';
    $('dlg-choices').innerHTML = '';
    $('dlg-next').style.visibility = 'hidden';
  }
  UI.updateDialog = function (dt) {
    if (!dlg || dlg.full) return;
    const text = dlg.lines[dlg.i];
    const before = Math.floor(dlg.shown);
    dlg.shown += dt * 45;
    const n = Math.floor(dlg.shown);
    if (n !== before && n % 3 === 0) R.sfx('talk');
    if (n >= text.length) finishLine();
    else $('dlg-text').textContent = text.slice(0, n);
  };
  function finishLine() {
    dlg.full = true;
    $('dlg-text').textContent = dlg.lines[dlg.i];
    const last = dlg.i === dlg.lines.length - 1;
    if (last && dlg.choices && dlg.choices.length) {
      const box = $('dlg-choices');
      dlg.choices.forEach((c, k) => {
        const b = document.createElement('button');
        b.textContent = c.label;
        b.style.animationDelay = `${k * 0.05}s`;
        b.onclick = (e) => { e.stopPropagation(); pickChoice(k); };
        box.appendChild(b);
      });
      $('dlg-next').style.visibility = 'hidden';
    } else $('dlg-next').style.visibility = 'visible';
  }
  function pickChoice(k) {
    const c = dlg.choices[k];
    R.sfx('ui');
    closeDialog();
    if (c && c.fn) c.fn();
  }
  function closeDialog() {
    const d = dlg;
    dlg = null;
    $('dialog').classList.add('hidden');
    return d;
  }
  UI.advanceDialog = function () {
    if (!dlg) return;
    if (!dlg.full) { finishLine(); return; }
    if (dlg.i < dlg.lines.length - 1) { dlg.i++; showLine(); return; }
    if (dlg.choices && dlg.choices.length) return;
    const d = closeDialog();
    if (d.onEnd) d.onEnd();
  };
  UI.dialogKey = function (k) {
    if (!dlg) return false;
    if (dlg.full && dlg.choices && dlg.i === dlg.lines.length - 1) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= dlg.choices.length) { pickChoice(n - 1); return true; }
    }
    return false;
  };
  $('dialog').addEventListener('pointerdown', (e) => { if (e.target.tagName !== 'BUTTON') UI.advanceDialog(); });

  // ─── HUD ─────────────────────────────────────────────
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function setW(id, p) { const v = Math.max(0, Math.min(100, p)).toFixed(1) + '%'; if (hudCache[id] !== v) { hudCache[id] = v; $(id).style.width = v; } }
  UI.drawFace = function () {
    if (!G.save) return;
    const cv = $('hud-face'), g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const key = playerKey();
    if (R.SPR.frame(key)) {
      const img = R.SPR.frameCanvas(key);
      // 머리~가슴 부분만 크게
      const sw = img.width * 0.8, sh = img.height * 0.55;
      const k = Math.min(cv.width / sw, cv.height / sh) * 1.05;
      g.imageSmoothingEnabled = true;
      g.drawImage(img, (img.width - sw) / 2, 0, sw, sh, (cv.width - sw * k) / 2, 6, sw * k, sh * k);
    }
    hudCache.faceKey = key;
  };
  UI.updateHUD = function () {
    const p = G.player, s = G.save;
    if (!p) return;
    const cls = R.CLASSES[s.cls];
    if (hudCache.faceKey !== playerKey()) UI.drawFace();
    setText('hud-lv', String(s.level));
    setText('hud-cls', s.adv ? R.ADVANCES[s.adv].name : cls.name);
    setText('hp-text', `${Math.ceil(p.hp)} / ${p.st.maxHp}`);
    setText('mp-text', `${Math.floor(p.mp)} / ${p.st.maxMp}`);
    setW('hp-fill', (p.hp / p.st.maxHp) * 100);
    setW('mp-fill', (p.mp / p.st.maxMp) * 100);
    setW('exp-fill', s.level >= R.MAX_LEVEL ? 100 : (s.exp / R.expToNext(s.level)) * 100);
    setText('hud-gold', fmt(s.gold));
    setText('hud-gems', fmt(s.gems || 0));
    setText('pot-cnt', String(s.bag.hpPotion || 0));
    $('hud').classList.toggle('low-hp', p.hp < p.st.maxHp * 0.3 && !p.dead);
    const st = [];
    if (p.status.poison > 0) st.push('<i style="--c:#9ad84a">중독</i>');
    if (p.status.burn > 0) st.push('<i style="--c:#ff9a3a">화상</i>');
    if (p.status.slow > 0) st.push('<i style="--c:#9fd8ff">빙결</i>');
    if (p.status.stun > 0) st.push('<i style="--c:#ffe070">기절</i>');
    const sh = st.join('');
    if (hudCache.st !== sh) { hudCache.st = sh; $('hud-status').innerHTML = sh; }
    // 메뉴 알림 점 (스탯/스킬 포인트)
    const dot = (s.points > 0 || (s.sp || 0) > 0);
    if (hudCache.dot !== dot) { hudCache.dot = dot; $('menu-dot').classList.toggle('hidden', !dot); }
    // 스킬 쿨타임
    R.skillIds(s).forEach((id, i) => {
      const sk = R.SKILLS[id];
      const cdMax = sk.cd * R.Prog.skillMod(id).cdMul;
      const v = (p.skillCd[i] > 0 ? (p.skillCd[i] / cdMax) * 100 : 0).toFixed(0) + '%';
      const k = 'cd' + i;
      if (hudCache[k] !== v) { hudCache[k] = v; $(`s${i + 1}-cd`).style.setProperty('--p', v); }
      const nomp = p.mp < sk.mp;
      if (hudCache['nm' + i] !== nomp) { hudCache['nm' + i] = nomp; $(`btn-s${i + 1}`).classList.toggle('nomp', nomp); }
    });
    const dcdMax = R.DODGE_CD * (1 - (p.st.adv.dodgeCdr || 0));
    const dcd = p.dodgeCd > 0 ? ((p.dodgeCd / dcdMax) * 100).toFixed(0) + '%' : '0%';
    if (hudCache.dcd !== dcd) { hudCache.dcd = dcd; $('dodge-cd').style.setProperty('--p', dcd); }
    // 콤보
    const c = G.combo.count;
    if (c >= 2) {
      const txt = `${c}`;
      if (hudCache.combo !== txt) {
        hudCache.combo = txt;
        const el = $('combo');
        el.classList.remove('hidden');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        $('combo-n').innerHTML = `<small>COMBO</small>${c}`;
        $('combo-b').textContent = `피해 +${Math.round(R.comboBonus(c) * 100)}%`;
      }
      $('combo').style.setProperty('--t', Math.max(0, G.combo.t / R.COMBO_TIMEOUT));
    } else if (hudCache.combo) { hudCache.combo = ''; $('combo').classList.add('hidden'); }
    // 상호작용 버튼
    const it = G.interact;
    const lbl = it ? it.label : '';
    if (hudCache.act !== lbl) { hudCache.act = lbl; $('btn-act').textContent = lbl; $('btn-act').classList.toggle('show', !!it); }
    // 퀘스트 추적
    const qs = s.quests.slice(0, 3).map((q) => `<div class="qt ${q.ready ? 'ready' : ''}"><b>${q.ready ? '✔' : q.id[0] === 'm' ? '★' : '◆'}</b><span>${esc(q.title)}</span><em>${q.ready ? '보고' : `${q.p}/${q.count}`}</em><i style="width:${Math.round((q.p / q.count) * 100)}%"></i></div>`).join('');
    if (hudCache.q !== qs) { hudCache.q = qs; $('btn-quest').innerHTML = qs; }
    if (UI.boss) {
      if (UI.boss.dead) UI.bossBar(null);
      else { setW('boss-fill', (UI.boss.hp / UI.boss.maxHp) * 100); $('boss-bar').classList.toggle('enrage', !!UI.boss.enrage); }
    }
  };
  UI.resetHudCache = () => { for (const k in hudCache) delete hudCache[k]; };
  UI.setSkillButtons = function () {
    R.skillIds(G.save).forEach((id, i) => {
      $(`s${i + 1}-ico`).textContent = R.SKILLS[id].icon;
      $(`s${i + 1}-lbl`).textContent = R.SKILLS[id].name;
    });
    $('btn-s3').classList.toggle('hidden', !G.save.adv);
    UI.drawFace();
  };
  UI.setArea = (t) => { $('hud-area').textContent = t; };
  UI.bossIntro = function (b) { UI.banner(b.def.name, '#ff6a5a', b.def.desc); UI.bossBar(b); R.Audio.playBgm(6); };
  UI.bossBar = function (b) {
    UI.boss = b;
    $('boss-bar').classList.toggle('hidden', !b);
    if (b) $('boss-name').innerHTML = `<b>${esc(b.def.name)}</b><small>Lv.${b.lv}</small>`;
  };

  // ─── 미니맵 ──────────────────────────────────────────
  const mm = $('minimap'), mg = mm.getContext('2d');
  UI.drawMinimap = function () {
    const m = G.map, p = G.player;
    if (!m) return;
    const W = mm.width, H = mm.height;
    mg.clearRect(0, 0, W, H);
    const sc = Math.min(W / m.w, H / m.h);
    const ox = (W - m.w * sc) / 2, oy = (H - m.h * sc) / 2;
    const T = R.T;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const i = y * m.w + x;
      if (!m.exploreAll && !m.explored[i]) continue;
      const t = m.tiles[i];
      let c = null;
      if (t === T.WALL || t === T.BLOCK) c = m.exploreAll && t === T.WALL ? '#24452a' : t === T.BLOCK ? '#8a6a4a' : null;
      else if (t === T.GATE) c = '#ffd35a';
      else if (t === T.VINE) c = '#3aaa3a';
      else if (t === T.PORTAL) c = '#6ad8ff';
      else if (t === T.HAZARD) c = '#e05a2a';
      else if (t === T.SWITCH || t === T.EXIT) c = '#ffe070';
      else if (t === T.PATH) c = '#9a8a6a';
      else c = m.kind === 'town' ? '#3a6a34' : '#6a6484';
      if (!c) continue;
      mg.fillStyle = c;
      mg.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc), Math.ceil(sc));
    }
    const dot = (x, y, c, r = 1.5) => { mg.fillStyle = c; mg.fillRect(ox + (x / R.TILE) * sc - r, oy + (y / R.TILE) * sc - r, r * 2, r * 2); };
    for (const n of m.npcs) dot(n.x, n.y, '#7fffa0');
    for (const c of m.chests) if (!c.open && m.explored[Math.floor(c.y / 16) * m.w + Math.floor(c.x / 16)]) dot(c.x, c.y, '#ffd35a');
    if (m.bossRoom) {
      const br = m.bossRoom;
      if (m.explored[(br.y + br.h - 1) * m.w + br.x + Math.floor(br.w / 2)] || (G.dungeon && G.save.cleared[G.dungeon.region.id])) {
        mg.strokeStyle = '#ff4a4a'; mg.lineWidth = 1; mg.strokeRect(ox + br.x * sc, oy + br.y * sc, br.w * sc, br.h * sc);
      }
    }
    for (const mob of G.mobs) if (!mob.dead && Math.hypot(mob.x - p.x, mob.y - p.y) < 130) dot(mob.x, mob.y, mob.boss ? '#ff2a2a' : '#ff7a7a', mob.boss ? 2.5 : 1);
    if (Math.floor(G.time * 3) % 2 === 0) dot(p.x, p.y, '#ffffff', 2);
  };

  // ─── 메뉴 시트 ───────────────────────────────────────
  const TAB_ICON = { 캐릭터: '👤', 장비: '🎒', 스킬: '✨', 소환: '💎', 퀘스트: '📜', 도감: '📖', 설정: '⚙️' };
  let panelState = null;
  function wallet() {
    const s = G.save;
    if (!s) return '';
    return `<span class="chip">💰 ${fmt(s.gold)}</span><span class="chip gem">💎 ${fmt(s.gems || 0)}</span><span class="chip coin">🪙 ${fmt(s.coins || 0)}</span>`;
  }
  UI.openPanel = function (title, tabs, render, tab) {
    panelState = { title, tabs, render, tab: tab || (tabs && tabs[0]) };
    const el = $('panel');
    el.classList.remove('hidden');
    el.classList.toggle('no-tabs', !tabs);
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    drawPanel();
  };
  function drawPanel() {
    const ps = panelState;
    $('panel-title').textContent = ps.tabs ? ps.tab : ps.title;
    $('wallet').innerHTML = wallet();
    const tabsEl = $('panel-tabs');
    tabsEl.innerHTML = '';
    if (ps.tabs) ps.tabs.forEach((t) => {
      const b = document.createElement('button');
      b.innerHTML = `<span class="ti">${TAB_ICON[t] || '•'}</span><span class="tl">${t}</span>`;
      if (t === ps.tab) b.className = 'on';
      const s = G.save;
      if ((t === '캐릭터' && s.points > 0) || (t === '스킬' && (s.sp || 0) > 0)) b.insertAdjacentHTML('beforeend', '<i class="dot"></i>');
      b.onclick = () => { if (ps.tab === t) return; ps.tab = t; R.sfx('ui'); $('panel-body').scrollTop = 0; drawPanel(); };
      tabsEl.appendChild(b);
    });
    const body = $('panel-body');
    const scroll = body.scrollTop;
    body.innerHTML = '';
    body.classList.remove('fade'); void body.offsetWidth; if (!ps.keepScroll) body.classList.add('fade');
    ps.render(body, ps.tab);
    if (ps.keepScroll) body.scrollTop = scroll;
    ps.keepScroll = false;
  }
  UI.refreshPanel = function (keep = true) { if (panelState && !$('panel').classList.contains('hidden')) { panelState.keepScroll = keep; drawPanel(); } };
  UI.closePanel = function () { $('panel').classList.add('hidden'); panelState = null; closePopup(); R.saveGame(); };
  $('panel-close').onclick = () => { R.sfx('ui'); UI.closePanel(); };

  let popModal = false;
  function popup(html, bind, modal = false, cls = '') {
    popModal = modal;
    const el = $('popup');
    el.classList.remove('hidden');
    $('pop').className = 'pop ' + cls;
    $('pop').innerHTML = html;
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    bind && bind($('pop'));
  }
  function closePopup() { $('popup').classList.add('hidden'); }
  UI.closePopup = closePopup;
  $('popup').addEventListener('pointerdown', (e) => { if (e.target.id === 'popup' && !popModal) closePopup(); });
  function bindActs(root, acts) {
    root.querySelectorAll('[data-a]').forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); if (el.disabled) return; R.sfx('ui'); const f = acts[el.dataset.a]; if (f) f(el.dataset.v, el); };
    });
  }

  // ─── 아이템 표시 ─────────────────────────────────────
  const itemIcon = (it) => (it.slot === 'weapon' ? R.WEAPON_ICON[it.wtype] : R.SLOT_ICON[it.slot]);
  const gcol = (g) => R.GRADES[g].color;
  const mainVal = (it) => (it ? Math.round((it.atk || it.def || 0) * (1 + it.enh * 0.08)) : 0);
  function cellHtml(it, extra = '') {
    return `<span class="ic">${itemIcon(it)}</span>${it.enh ? `<span class="enh">+${it.enh}</span>` : ''}${it.set != null ? `<span class="set" style="--c:${R.SETS[it.set].color}">S</span>` : ''}${extra}`;
  }
  function cell(it, attrs = '', extra = '') {
    return `<button class="cell g${it.grade}" style="--g:${gcol(it.grade)}" ${attrs}>${cellHtml(it, extra)}</button>`;
  }
  function itemCard(it, cmp) {
    const g = R.GRADES[it.grade];
    let diff = '';
    if (cmp && cmp !== it) {
      const a = mainVal(it), b = mainVal(cmp);
      if (a || b) diff = a >= b ? `<span class="up">▲ ${a - b}</span>` : `<span class="dn">▼ ${b - a}</span>`;
    }
    let setHtml = '';
    if (it.set != null) {
      const set = R.SETS[it.set];
      const have = R.Prog.setCounts(G.save.equip)[it.set] || 0;
      setHtml = `<div class="ic-set" style="--c:${set.color}"><b>${set.name} 세트</b> <em>${have}/6 장착</em>${[2, 4, 6].map((n) => `<div class="${have >= n ? 'on' : ''}">(${n}) ${Object.entries(set.bonus[n]).map(([k, v]) => R.MOD_TEXT[k](v)).join(', ')}</div>`).join('')}</div>`;
    }
    return `<div class="icard g${it.grade}" style="--g:${g.color}">
      <div class="ic-head"><div class="ic-icon">${itemIcon(it)}</div><div><div class="ic-name">${it.enh ? `+${it.enh} ` : ''}${esc(it.name)}</div>
      <div class="ic-meta"><span class="gtag">${g.name}</span> ${R.SLOT_NAME[it.slot]} · Lv.${it.ilvl}${it.elem ? ` · ${R.ELEM[it.elem].icon} ${R.ELEM[it.elem].name}` : ''}</div></div></div>
      <div class="ic-main">${R.itemMainText(it)} ${diff}</div>
      ${it.opts.length ? `<div class="ic-opts">${it.opts.map((o) => `<div>◆ ${R.optText(o, it)}</div>`).join('')}</div>` : ''}
      ${setHtml}
      ${cmp && cmp !== it ? `<div class="ic-cmp">장착 중 · ${esc(cmp.name)}${cmp.enh ? ' +' + cmp.enh : ''}</div>` : ''}
    </div>`;
  }
  UI.itemCard = itemCard;

  function equip(it) {
    const s = G.save;
    const i = s.inv.indexOf(it);
    if (i < 0) return;
    const prev = s.equip[it.slot];
    s.inv.splice(i, 1);
    if (prev) s.inv.splice(i, 0, prev);
    s.equip[it.slot] = it;
    R.refreshStats();
    R.sfx('pickup');
  }
  function unequip(slot) {
    const s = G.save;
    if (s.inv.length >= 40) { R.toast('가방이 가득 찼습니다', '#ff8a8a'); return; }
    if (slot === 'weapon') { R.toast('무기는 해제할 수 없습니다', '#ff8a8a'); return; }
    s.inv.push(s.equip[slot]);
    s.equip[slot] = null;
    R.refreshStats();
  }
  function power() {
    const st = G.player.st;
    return Math.round(st.atk * (1 + st.crit * (st.critDmg - 1)) * 3 + st.def * 2 + st.maxHp * 0.3);
  }

  // ─── 메인 메뉴 ───────────────────────────────────────
  const MENU_TABS = ['캐릭터', '장비', '스킬', '소환', '퀘스트', '도감', '설정'];
  UI.openMenu = function (tab) { UI.openPanel('메뉴', MENU_TABS, renderMenu, tab); };
  let invFilter = 'all', dexMode = 'mon';

  function renderMenu(body, tab) {
    const s = G.save, p = G.player, st = p.st, cls = R.CLASSES[s.cls];
    if (tab === '캐릭터') {
      const need = R.expToNext(s.level);
      const stats = ['str', 'dex', 'int', 'vit', 'luk'];
      const statName = { str: '힘', dex: '민첩', int: '지능', vit: '체력', luk: '행운' };
      const setC = R.Prog.setCounts(s.equip);
      body.innerHTML = `
        <section class="hero">
          <div class="hero-art" id="hero-art"></div>
          <div class="hero-info">
            ${s.title ? `<div class="hero-title" style="--c:${R.Season.byId(s.title).color}">${R.Season.byId(s.title).icon} ${R.Season.byId(s.title).title.name}</div>` : ''}
            <div class="hero-cls">${esc(cls.name)}${s.adv ? ` <b>→ ${R.ADVANCES[s.adv].name}</b>` : ''}</div>
            <div class="hero-lv">Lv.<b>${s.level}</b></div>
            <div class="xp"><i style="width:${s.level >= R.MAX_LEVEL ? 100 : (s.exp / need) * 100}%"></i></div>
            <div class="xp-t">${s.level >= R.MAX_LEVEL ? 'MAX' : `${fmt(s.exp)} / ${fmt(need)} EXP`}</div>
            <div class="power"><small>전투 지표</small>${fmt(power())}</div>
          </div>
        </section>
        <section class="kpis">
          <div><small>${cls.atkStat === 'int' ? '마법공격' : '공격력'}</small><b>${fmt(st.atk)}</b></div>
          <div><small>방어력</small><b>${fmt(st.def)}</b></div>
          <div><small>최대 HP</small><b>${fmt(st.maxHp)}</b></div>
          <div><small>치명타</small><b>${pct(st.crit)}</b></div>
        </section>
        <section class="card">
          <div class="card-h">능력치 <span class="pill ${s.points ? 'hot' : ''}">포인트 ${s.points}</span></div>
          ${stats.map((k) => `<div class="stat"><span class="sn">${k.toUpperCase()}<small>${statName[k]}</small></span><div class="sbar"><i style="width:${Math.min(100, st[k] / (8 + s.level * 2.2) * 100)}%"></i></div><b>${st[k]}</b><button class="plus" data-a="stat" data-v="${k}" ${s.points > 0 ? '' : 'disabled'}>+</button></div>`).join('')}
        </section>
        <section class="card">
          <div class="card-h">상세 능력</div>
          <div class="grid2">
            <div class="kv"><span>치명타 피해</span><b>${Math.round(st.critDmg * 100)}%</b></div>
            <div class="kv"><span>피해 감소</span><b>${Math.round((1 - 100 / (100 + st.def)) * 100)}%</b></div>
            <div class="kv"><span>최대 MP</span><b>${st.maxMp}</b></div>
            <div class="kv"><span>공격 속도</span><b>${st.atkSpd.toFixed(2)}</b></div>
            <div class="kv"><span>이동 속도</span><b>${Math.round(st.moveSpd)}</b></div>
            <div class="kv"><span>무기 속성</span><b>${R.ELEM[st.elem].icon} ${R.ELEM[st.elem].name}</b></div>
          </div>
        </section>
        <section class="card">
          <div class="card-h">활성 효과</div>
          ${Object.keys(setC).length ? Object.entries(setC).map(([si, n]) => `<div class="kv"><span style="color:${R.SETS[si].color}">${R.SETS[si].name} 세트 (${n}/6)</span><b>${[2, 4, 6].filter((x) => n >= x).map((x) => Object.entries(R.SETS[si].bonus[x]).map(([k, v]) => R.MOD_TEXT[k](v)).join(', ')).join(' · ') || '-'}</b></div>`).join('') : '<div class="muted">장착한 세트 장비가 없습니다</div>'}
          <div class="kv"><span>📖 장비 도감 보너스</span><b>공격력·HP +${Math.round(R.Prog.dexBonus() * 100)}%</b></div>
          ${s.adv ? `<div class="kv"><span>전직 · ${R.ADVANCES[s.adv].name}</span><b>${R.ADVANCES[s.adv].desc}</b></div>` : ''}
          ${Object.keys(R.FOODS).filter((k) => R.Prog.buffLeft(k) > 0).map((k) => `<div class="kv"><span>${R.FOODS[k].icon} ${R.FOODS[k].name}</span><b>${R.FOODS[k].desc.replace(/^\S+ /, '')} · ${Math.ceil(R.Prog.buffLeft(k) / 60)}분 남음</b></div>`).join('')}
        </section>
        ${(s.titles || []).length ? `<section class="card"><div class="card-h">칭호</div><div class="titles">${s.titles.map((id) => { const se = R.Season.byId(id); return `<button class="ttl ${s.title === id ? 'on' : ''}" style="--c:${se.color}" data-a="title" data-v="${id}"><b>${se.icon} ${se.title.name}</b><small>${se.title.desc}</small></button>`; }).join('')}</div></section>` : ''}
        <section class="card">
          <div class="card-h">동행 펫 <span class="pill">${(s.pets || []).length}/${R.PETS.length}</span></div>
          ${(s.pets || []).length ? `<div class="pets">${R.PETS.filter((d) => s.pets.includes(d.id)).map((d) => `<button class="pet ${s.pet === d.id ? 'on' : ''}" data-a="pet" data-v="${d.id}"><span class="pet-art" data-k="${d.id}"></span><b>${d.name}</b><small>${d.desc}</small>${s.pet === d.id ? '<i>동행 중</i>' : ''}</button>`).join('')}</div>` : '<div class="muted">마을 광장의 수상한 상인 모르에게서 펫을 데려올 수 있습니다.</div>'}
        </section>
        <section class="card">
          <div class="card-h">가방 · 재료</div>
          <div class="mats">
            ${Object.keys(R.MATERIALS).map((k) => `<div class="mat"><span>${R.MATERIALS[k].icon}</span><b>${s.bag[k] || 0}</b><small>${R.MATERIALS[k].name}</small></div>`).join('')}
            ${Object.keys(R.CONSUMABLES).map((k) => `<div class="mat"><span>${R.CONSUMABLES[k].icon}</span><b>${s.bag[k] || 0}</b><small>${R.CONSUMABLES[k].name}</small></div>`).join('')}
            ${Object.keys(R.GATHER).map((k) => `<div class="mat"><span>${R.GATHER[k].icon}</span><b>${s.bag[k] || 0}</b><small>${R.GATHER[k].name}</small></div>`).join('')}
            ${Object.keys(R.FOODS).map((k) => `<div class="mat"><span>${R.FOODS[k].icon}</span><b>${s.bag[k] || 0}</b><small>${R.FOODS[k].name}</small></div>`).join('')}
            <div class="mat"><span>🏅</span><b>${s.honor || 0}</b><small>명예 메달</small></div>
          </div>
          <div class="row-btns">
          ${s.bag.mpPotion ? '<button class="btn ghost" data-a="mp">💧 파란 물약 사용</button>' : ''}
          ${Object.keys(R.FOODS).filter((k) => s.bag[k]).map((k) => `<button class="btn gold" data-a="eat" data-v="${k}">${R.FOODS[k].icon} ${R.FOODS[k].name} 먹기</button>`).join('')}
          </div>
        </section>`;
      $('hero-art').appendChild(spriteCanvas(playerKey(), 240, 270, 'hero-cv'));
      body.querySelectorAll('.pet-art').forEach((el) => el.appendChild(spriteCanvas(el.dataset.k, 84, 66, 'pet-cv')));
      bindActs(body, {
        stat: (k) => { if (s.points <= 0) return; s.points--; s.stats[k]++; R.refreshStats(); UI.refreshPanel(); },
        mp: () => { R.usePotion('mpPotion'); UI.refreshPanel(); },
        eat: (k) => { R.Prog.eat(k); UI.refreshPanel(); },
        title: (id) => { R.Season.setTitle(id); UI.refreshPanel(); },
        pet: (id) => { R.Prog.setPet(id); R.spawnPet(); UI.refreshPanel(); },
      });
    } else if (tab === '장비') {
      const slotCell = (sl) => { const it = s.equip[sl]; return it ? `<div class="doll-slot">${cell(it, `data-a="eq" data-v="${sl}"`)}<small>${R.SLOT_NAME[sl]}</small></div>` : `<div class="doll-slot"><div class="cell empty">${R.SLOT_ICON[sl]}</div><small>${R.SLOT_NAME[sl]}</small></div>`; };
      const L = ['weapon', 'helmet', 'armor', 'gloves'], Rr = ['boots', 'ring', 'necklace', 'earring'];
      const filters = { all: '전체', weapon: '무기', armor: '방어구', acc: '장신구' };
      const pass = (it) => invFilter === 'all' || (invFilter === 'weapon' && it.slot === 'weapon') || (invFilter === 'armor' && ['helmet', 'armor', 'gloves', 'boots'].includes(it.slot)) || (invFilter === 'acc' && ['ring', 'necklace', 'earring'].includes(it.slot));
      const list = s.inv.map((it, i) => ({ it, i })).filter((o) => pass(o.it));
      body.innerHTML = `
        <section class="doll">
          <div class="doll-col">${L.map(slotCell).join('')}</div>
          <div class="doll-mid"><div id="doll-art"></div><div class="power sm"><small>전투 지표</small>${fmt(power())}</div></div>
          <div class="doll-col">${Rr.map(slotCell).join('')}</div>
        </section>
        <section class="card">
          <div class="card-h">가방 <span class="pill">${s.inv.length}/40</span><button class="btn xs ghost" data-a="sort">정렬</button></div>
          <div class="chips">${Object.entries(filters).map(([k, v]) => `<button class="fchip ${invFilter === k ? 'on' : ''}" data-a="filter" data-v="${k}">${v}</button>`).join('')}</div>
          <div class="inv">${list.map(({ it, i }) => { const cur = s.equip[it.slot]; const better = mainVal(it) > mainVal(cur); return cell(it, `data-a="inv" data-v="${i}"`, better ? '<span class="up-mark">▲</span>' : ''); }).join('')}${Array(Math.max(0, 24 - list.length)).fill('<div class="cell empty"></div>').join('')}</div>
        </section>`;
      $('doll-art').appendChild(spriteCanvas(playerKey(), 200, 240, 'doll-cv'));
      bindActs(body, {
        eq: (sl) => { const it = s.equip[sl]; popup(itemCard(it) + `<div class="row-btns"><button class="btn ghost" data-a="un">해제</button><button class="btn" data-a="x">닫기</button></div>`, (r) => bindActs(r, { un: () => { unequip(sl); closePopup(); UI.refreshPanel(); }, x: closePopup }), false, 'sheet-pop'); },
        inv: (i) => {
          const it = s.inv[i];
          const cur = s.equip[it.slot];
          popup(itemCard(it, cur) + `<div class="row-btns"><button class="btn gold" data-a="eq">장착</button><button class="btn danger" data-a="drop">버리기</button><button class="btn ghost" data-a="x">닫기</button></div>`,
            (r) => bindActs(r, { eq: () => { equip(it); closePopup(); UI.refreshPanel(); }, drop: () => { s.inv.splice(s.inv.indexOf(it), 1); closePopup(); UI.refreshPanel(); }, x: closePopup }), false, 'sheet-pop');
        },
        sort: () => { s.inv.sort((a, b) => b.grade - a.grade || R.SLOTS.indexOf(a.slot) - R.SLOTS.indexOf(b.slot) || b.ilvl - a.ilvl); UI.refreshPanel(); },
        filter: (k) => { invFilter = k; UI.refreshPanel(); },
      });
    } else if (tab === '스킬') {
      const combo = R.COMBO_STEPS.map((c, i) => `<span class="cstep"><b>${i + 1}타</b>${c.name}<em>${Math.round(c.rate * 100)}%</em></span>`).join('<span class="arr">›</span>');
      body.innerHTML = `
        <section class="card sp-card"><div class="card-h">스킬 포인트 <span class="pill ${s.sp ? 'hot' : ''}">SP ${s.sp || 0}</span></div>
          <div class="muted">레벨업마다 SP 1 · 스킬 레벨당 피해 +12% · Lv.4 범위 +10% · Lv.5 쿨타임 -20%</div></section>
        ${R.skillIds(s).map((id, i) => {
          const k = R.SKILLS[id], lv = R.Prog.skillLv(id), md = R.Prog.skillMod(id), rs = R.Prog.runeState(id);
          const cost = R.Prog.skillUpCost(id);
          return `<section class="card skill">
            <div class="sk-top"><div class="sk-ico ${k.ult ? 'ult' : ''}">${k.icon}<small>${k.ult ? '궁극기' : `스킬${i + 1}`}</small></div>
              <div class="sk-info"><div class="sk-name">${k.name} <span class="elem">${R.ELEM[k.elem].icon}</span></div>
                <div class="pips">${Array.from({ length: R.SKILL_MAX }, (_, j) => `<i class="${j < lv ? 'on' : ''}"></i>`).join('')}<em>Lv.${lv}</em></div>
                <div class="muted">${k.desc}</div></div>
              <button class="btn xs gold" data-a="up" data-v="${id}" ${lv < R.SKILL_MAX && (s.sp || 0) >= cost ? '' : 'disabled'}>${lv >= R.SKILL_MAX ? 'MAX' : `강화<br><small>SP ${cost}</small>`}</button></div>
            <div class="sk-stats"><span>피해 <b>${Math.round(k.rate * md.dmg * 100)}%</b></span><span>MP <b>${k.mp}</b></span><span>쿨타임 <b>${(k.cd * md.cdMul).toFixed(1)}s</b></span>${md.aoe > 1 ? `<span>범위 <b>+${Math.round((md.aoe - 1) * 100)}%</b></span>` : ''}</div>
            ${k.ult ? '<div class="muted">2차 전직 전용 궁극기 · [U] 키 / 보라색 버튼</div>' : ''}<div class="runes">${(R.RUNES[id] || []).map((r, j) => `<button class="rune ${rs.eq === j ? 'eq' : ''} ${rs.owned[j] ? 'own' : 'lock'}" data-a="rune" data-v="${id}:${j}">
              <b>${'ABC'[j]}</b><span>${r.name}</span><small>${r.desc}</small><em>${rs.eq === j ? '장착 중' : rs.owned[j] ? '장착' : `🪙 ${R.RUNE_COST}`}</em></button>`).join('')}</div>
          </section>`;
        }).join('')}
        <section class="card"><div class="card-h">기본 공격 · 3단 콤보</div><div class="combo-row">${combo}</div>
          <div class="muted">2초 안에 연속 적중 시 COMBO ×2 +5% · ×3 +10% · ×4 +20% · ×5 +30%</div></section>
        <section class="card"><div class="card-h">회피</div><div class="muted">쿨타임 ${(R.DODGE_CD * (1 - (st.adv.dodgeCdr || 0))).toFixed(1)}초 · 발동 즉시 0.25초 무적</div>
          <div class="card-h" style="margin-top:2cqw">속성 상성 +25%</div><div class="muted">🔥 화염 › 🌿 자연 › ⚡ 번개 › ❄ 냉기 › 🔥 화염 · 🌑 암흑 ↔ 🌑 암흑</div></section>
        <section class="card"><div class="card-h">2차 전직 · Lv.30</div>
          <div class="advs">${cls.adv.map((a) => `<div class="adv ${s.adv === a ? 'on' : s.adv ? 'off' : ''}">${R.SPR.frame(a) ? '<span data-adv="' + a + '"></span>' : ''}<b>${R.ADVANCES[a].name}</b><small>${R.ADVANCES[a].desc}</small><small class="adv-ult">${R.SKILLS[R.ADV_SKILL[a]].icon} ${R.SKILLS[R.ADV_SKILL[a]].name}</small></div>`).join('')}</div>
          ${!s.adv ? '<div class="muted">Lv.30 달성 후 촌장 엘든에게 말을 걸면 전직할 수 있습니다. 전직하면 전용 궁극기가 열립니다.</div>' : ''}</section>`;
      body.querySelectorAll('[data-adv]').forEach((el) => el.replaceWith(spriteCanvas(el.dataset.adv, 120, 120, 'adv-cv')));
      bindActs(body, {
        up: (id) => { if (R.Prog.levelUpSkill(id)) { R.toast(`${R.SKILLS[id].name} Lv.${R.Prog.skillLv(id)}`, '#ffe070'); UI.refreshPanel(); } },
        rune: (v) => {
          const [id, j] = v.split(':'); const rs = R.Prog.runeState(id);
          if (rs.owned[+j]) { R.Prog.equipRune(id, +j); UI.refreshPanel(); return; }
          if ((s.coins || 0) < R.RUNE_COST) { R.toast(`던전 코인이 부족합니다 (${R.RUNE_COST} 필요) · 정예·보스·길드 의뢰에서 획득`, '#ff8a8a'); return; }
          if (R.Prog.buyRune(id, +j)) { R.toast(`룬 해금: ${R.RUNES[id][+j].name}`, '#ffe070'); UI.refreshPanel(); }
        },
      });
    } else if (tab === '소환') {
      const pity = s.pity || 0;
      const rates = R.SUMMON.rates.map((r, g) => `<span class="rate" style="--g:${gcol(g)}"><b>${R.GRADES[g].name}</b>${Math.round(r * 1000) / 10}%</span>`).join('');
      body.innerHTML = `
        <section class="banner-card">
          <div class="bn-glow"></div>
          <div class="bn-tag">장비 소환</div>
          <div class="bn-title">잊혀진 유물</div>
          <div class="bn-sub">현재 레벨에 맞는 장비 · 희귀 이상 35% 확률로 세트 장비</div>
          <div class="bn-art" id="bn-art"></div>
          <div class="pity"><div class="pity-h"><span>전설 확정까지</span><b>${R.SUMMON.pity - pity}회</b></div><div class="pity-bar"><i style="width:${(pity / R.SUMMON.pity) * 100}%"></i></div></div>
          <div class="bn-btns">
            <button class="btn summon" data-a="pull" data-v="1"><small>1회 소환</small><b>💎 ${R.SUMMON.cost1}</b></button>
            <button class="btn summon gold" data-a="pull" data-v="10"><small>10회 소환 · 희귀 1개 보장</small><b>💎 ${R.SUMMON.cost10}</b></button>
          </div>
        </section>
        <section class="card"><div class="card-h">확률</div><div class="rates">${rates}</div>
          <div class="muted">보석은 플레이로만 획득합니다 — 보스 첫 토벌, 메인 퀘스트, 5레벨마다, 몬스터 도감 등록, 길드 의뢰. 소환 없이도 필드 파밍만으로 엔딩까지 진행할 수 있습니다.</div></section>`;
      const art = $('bn-art');
      ['GUARDIAN', 'ARCHMAGE', 'NINJA'].forEach((k) => art.appendChild(spriteCanvas(k, 120, 140, 'bn-cv')));
      bindActs(body, { pull: (n) => doSummon(+n) });
    } else if (tab === '퀘스트') {
      body.innerHTML = seasonCard(false) + `<section class="card"><div class="card-h">진행 중</div>
        ${s.quests.length ? s.quests.map((q) => `<div class="quest ${q.ready ? 'ready' : ''}"><div class="q-ico">${q.ready ? '✔' : q.id[0] === 'm' ? '★' : q.id === 'guild' ? '⚔' : '🎵'}</div>
          <div class="q-body"><div class="q-title">${esc(q.title)}</div><div class="muted">${esc(q.desc)}</div>
          <div class="qbar"><i style="width:${(q.p / q.count) * 100}%"></i><span>${q.ready ? `완료 · ${esc(q.giverName || '')}에게 보고` : `${q.p} / ${q.count}`}</span></div></div></div>`).join('') : '<div class="muted">진행 중인 퀘스트가 없습니다. 촌장 엘든이나 길드장 레오를 찾아가 보세요.</div>'}</section>
        <section class="card"><div class="card-h">세계 지도</div>
        ${R.REGIONS.map((rg) => { const open = rg.id <= s.unlocked; return `<div class="region ${s.cleared[rg.id] ? 'clear' : open ? '' : 'locked'} t-${rg.theme}"><div class="rg-no">${rg.id}</div><div class="rg-body"><b>${rg.name}</b><small>Lv.${rg.lv[0]}~${rg.lv[1]} · ${open ? R.BOSSES[rg.boss].name : '???'}</small><div class="muted">${open ? rg.gimmickText : '이전 지역의 보스를 쓰러뜨리면 해금'}</div></div><div class="rg-st">${s.cleared[rg.id] ? '🏆' : open ? '▶' : '🔒'}</div></div>`; }).join('')}
        ${s.flags.blackMine ? `<div class="region t-mine hidden-rg ${s.cleared[6] ? 'clear' : ''}"><div class="rg-no">?</div><div class="rg-body"><b>${R.HIDDEN_REGION.name}</b><small>Lv.${R.HIDDEN_REGION.lv[0]}~${R.HIDDEN_REGION.lv[1]} · ${R.BOSSES.obsidian_golem.name}</small><div class="muted">숨겨진 던전</div></div><div class="rg-st">${s.cleared[6] ? '🏆' : '▶'}</div></div>` : ''}
        ${s.cleared[2] ? `<div class="region t-tower"><div class="rg-no">塔</div><div class="rg-body"><b>심연의 탑</b><small>최고 기록 ${s.tower.best || 0} / ${R.TOWER_FLOORS}층</small></div><div class="rg-st">▶</div></div>` : ''}</section>
        <section class="card"><div class="card-h">마을 사람들 · 호감도</div>
        ${Object.keys(R.FAVOR_PERKS).map((id) => { const f = Math.max(0, R.Prog.favor(id)); return `<div class="favor"><span>${{ elder: '촌장 엘든', smith: '대장장이 브론', alchemist: '연금술사 미라', bard: '음유시인 노아' }[id]}</span><b class="hearts">${'♥'.repeat(Math.min(5, f))}${'♡'.repeat(Math.max(0, 5 - f))}</b><small class="${f >= 3 ? 'on' : ''}">${R.FAVOR_PERKS[id]}</small></div>`; }).join('')}
        <div class="muted">약초 3개를 선물하면 호감도가 오릅니다. 약초는 던전의 채집 지점에서 모을 수 있어요.</div></section>`;
    } else if (tab === '도감') {
      body.innerHTML = `<div class="seg"><button class="${dexMode === 'mon' ? 'on' : ''}" data-a="mode" data-v="mon">몬스터</button><button class="${dexMode === 'item' ? 'on' : ''}" data-a="mode" data-v="item">장비</button></div>`;
      bindActs(body, { mode: (m) => { dexMode = m; UI.refreshPanel(false); } });
      if (dexMode === 'mon') renderMonDex(body); else renderItemDex(body);
    } else if (tab === '설정') {
      const A = R.Audio;
      body.innerHTML = `
        <section class="card"><div class="card-h">사운드</div>
          <div class="kv"><span>효과음</span><button class="toggle ${A.sfxOn ? 'on' : ''}" data-a="sfx"><i></i></button></div>
          <div class="kv"><span>배경음</span><button class="toggle ${A.bgmOn ? 'on' : ''}" data-a="bgm"><i></i></button></div></section>
        <section class="card"><div class="card-h">게임</div>
          <div class="row-btns">
            <button class="btn" data-a="save">💾 저장하기</button>
            ${G.map.kind !== 'town' ? '<button class="btn gold" data-a="home">🌀 마을로 귀환</button>' : ''}
            <button class="btn ghost" data-a="title">타이틀로</button>
            <button class="btn danger" data-a="reset">데이터 초기화</button>
          </div></section>
        <section class="card"><div class="card-h">조작법</div>
          <div class="muted">키보드: 이동 WASD/방향키 · 공격 J (누르고 있으면 연속) · 스킬 K/L · 회피 Space · 물약 Q · 대화 E · 메뉴 Esc/M · 가방 I<br>터치: 화면 왼쪽을 드래그해 이동, 오른쪽 버튼으로 공격·스킬·회피</div></section>
        <section class="card"><div class="card-h">게임 원칙</div>
          <div class="muted">자동 사냥 없음 · 전투력 경쟁 없음 · VIP/강제 광고 없음 · 필드 파밍만으로 엔딩 가능 · 플레이 시간 ${Math.floor((s.playTime || 0) / 60)}분</div></section>`;
      bindActs(body, {
        sfx: () => { A.sfxOn = !A.sfxOn; A.persist(); UI.refreshPanel(); },
        bgm: () => { A.bgmOn = !A.bgmOn; A.persist(); UI.refreshPanel(); },
        save: () => { R.saveGame(); R.toast('저장되었습니다', '#7fffa0'); },
        home: () => { UI.closePanel(); R.enterTown(); },
        title: () => { UI.closePanel(); R.toTitle(); },
        reset: () => popup(`<div class="confirm"><b>모든 진행 데이터를 삭제할까요?</b><p class="muted">되돌릴 수 없습니다.</p><div class="row-btns"><button class="btn danger" data-a="y">삭제</button><button class="btn ghost" data-a="n">취소</button></div></div>`,
          (r) => bindActs(r, { y: () => { R.deleteSave(); closePopup(); UI.closePanel(); R.toTitle(); }, n: closePopup })),
      });
    }
  }

  function renderMonDex(body) {
    const s = G.save;
    const total = Object.keys(R.MONSTERS).length + Object.keys(R.BOSSES).length - (s.flags.blackMine ? 0 : 1);
    const found = Object.keys(s.codex).filter((k) => s.codex[k] > 0).length;
    body.insertAdjacentHTML('beforeend', `<div class="dex-prog"><span>수집률</span><div class="pbar"><i style="width:${(found / total) * 100}%"></i></div><b>${found}/${total}</b></div>`);
    const rgs = s.flags.blackMine ? [...R.REGIONS, R.HIDDEN_REGION] : R.REGIONS;
    rgs.forEach((rg) => {
      const sec = document.createElement('section');
      sec.className = 'card';
      sec.innerHTML = `<div class="card-h">${rg.hidden ? '숨겨진 던전' : rg.id + '지역'} · ${rg.name}</div>`;
      const grid = document.createElement('div');
      grid.className = 'codex';
      [...rg.monsters, rg.boss].forEach((id) => {
        const boss = id === rg.boss;
        const def = boss ? R.BOSSES[id] : R.MONSTERS[id];
        const known = (s.codex[id] || 0) > 0;
        const cellEl = document.createElement('button');
        cellEl.className = 'codex-cell' + (known ? '' : ' unknown') + (boss ? ' boss' : '');
        const cv = document.createElement('canvas');
        cv.width = 96; cv.height = 80;
        const g = cv.getContext('2d');
        if (!known) g.filter = 'brightness(0) invert(0.2)';
        const fb = def.arch === 'human' ? R.SPR.human(id, def.look, 'down', 0, false) : R.SPR.monster(id, def, 0, false);
        fitSprite(g, id, fb, 96, 80, 3);
        cellEl.appendChild(cv);
        cellEl.insertAdjacentHTML('beforeend', `<span>${known ? def.name : '???'}</span>${boss ? '<i>BOSS</i>' : ''}`);
        if (known) {
          const w = R.weaknessOf(def.elem);
          const d = boss ? 5 : def.danger || 1;
          cellEl.onclick = () => { R.sfx('ui'); popup(`<div class="dex-pop"><div id="dex-art"></div><div class="ic-name">${def.name}${boss ? ' · 보스' : ''}</div>
            <div class="muted">${rg.name} · 처치 ${s.codex[id]}회</div>
            <div class="kv"><span>위험도</span><b class="stars">${'★'.repeat(d)}${'☆'.repeat(5 - d)}</b></div>
            <div class="kv"><span>속성</span><b>${R.ELEM[def.elem].icon} ${R.ELEM[def.elem].name}</b></div>
            <div class="kv"><span>약점</span><b>${w ? R.ELEM[w].icon + ' ' + R.ELEM[w].name : '없음'}</b></div>
            <p class="muted">${def.desc}</p></div><div class="row-btns"><button class="btn ghost" data-a="x">닫기</button></div>`, (r) => { $('dex-art').appendChild(spriteCanvas(id, 200, 160, 'dex-cv', fb)); bindActs(r, { x: closePopup }); }, false, 'sheet-pop'); };
        }
        grid.appendChild(cellEl);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    });
  }
  function renderItemDex(body) {
    const s = G.save, ent = R.Prog.dexEntries(), cnt = R.Prog.dexCount();
    const TIER = ['숲', '폐허', '광산', '빙결', '마계'];
    body.insertAdjacentHTML('beforeend', `<div class="dex-prog"><span>수집률</span><div class="pbar"><i style="width:${(cnt / ent.length) * 100}%"></i></div><b>${cnt}/${ent.length}</b></div>
      <section class="card"><div class="card-h">수집 보너스 <span class="pill hot">공격력·HP +${Math.round(R.Prog.dexBonus() * 100)}%</span></div><div class="muted">장비 ${R.DEX_STEP}종을 모을 때마다 공격력과 최대 HP가 1%씩 오릅니다. (다음 보너스까지 ${R.DEX_STEP - (cnt % R.DEX_STEP)}종)</div></section>
      <section class="card"><div class="card-h">장비 목록</div><div class="dex-grid"><div></div>${TIER.map((t) => `<small>${t}</small>`).join('')}
      ${[...new Set(ent.map((e) => e.base))].map((b) => {
        const row = ent.filter((e) => e.base === b);
        return `<small class="rowh">${R.SLOT_NAME[row[0].slot]}</small>` + row.map((e) => { const g = (s.itemDex || {})[e.key]; return g ? `<div class="dexi" style="--g:${gcol(g - 1)}" title="${e.name}">${e.slot === 'weapon' ? R.WEAPON_ICON[b] : R.SLOT_ICON[b]}<span>${e.name}</span></div>` : '<div class="dexi none">?</div>'; }).join('');
      }).join('')}</div></section>`);
  }

  // 소환 연출: 카드가 차례로 뒤집힌다
  function doSummon(n) {
    const res = R.Prog.summon(n);
    if (res.error) { R.toast(res.error, '#ff8a8a'); return; }
    const best = Math.max(...res.items.map((it) => it.grade));
    R.sfx(best >= 3 ? 'levelup' : 'rare');
    popup(`<div class="gacha g${best}" style="--g:${gcol(best)}"><div class="gacha-burst"></div><div class="gacha-h">소환 결과</div>
      <div class="gacha-grid n${n}">${res.items.map((it, i) => `<div class="gcard g${it.grade}" style="--g:${gcol(it.grade)};animation-delay:${0.15 + i * 0.12}s"><div class="gc-in"><div class="gc-back">?</div><div class="gc-front">${cellHtml(it)}<small>${R.GRADES[it.grade].name}</small></div></div></div>`).join('')}</div>
      <div class="gacha-list">${res.items.filter((it) => it.grade >= 2).map((it) => `<div style="color:${gcol(it.grade)}">${R.GRADES[it.grade].name} · ${esc(it.name)}${it.set != null ? ` <em>[${R.SETS[it.set].name} 세트]</em>` : ''}</div>`).join('')}</div>
      <div class="row-btns"><button class="btn gold" data-a="again">다시 ${n}회 (💎 ${n >= 10 ? R.SUMMON.cost10 : R.SUMMON.cost1})</button><button class="btn ghost" data-a="x">확인</button></div></div>`,
    (r) => bindActs(r, { again: () => { closePopup(); doSummon(n); }, x: () => { closePopup(); UI.refreshPanel(); } }), true, 'gacha-pop');
    UI.refreshPanel();
  }

  // ─── 대장간 (안전 강화) ──────────────────────────────
  UI.forge = function () {
    let sel = null;
    const fGold = (it) => Math.round(R.enhanceGold(it) * R.Prog.discount('smith'));
    UI.openPanel('대장간 · 안전 강화', null, (body) => {
      const s = G.save;
      const list = [...R.SLOTS.map((k) => s.equip[k]).filter(Boolean), ...s.inv];
      if (sel && !list.includes(sel)) sel = null;
      if (!sel) sel = list[0];
      let html = '';
      if (sel) {
        html += itemCard(sel);
        if (sel.enh >= 10) html += '<section class="card"><div class="muted">최대 강화 단계(+10)입니다.</div></section>';
        else {
          const mat = R.enhanceMat(sel.enh), cnt = R.enhanceMatCount(sel.enh), gold = fGold(sel);
          const rate = R.ENHANCE_RATE[sel.enh];
          const have = s.bag[mat] || 0;
          const ok = have >= cnt && s.gold >= gold;
          const nextVal = sel.atk || sel.def ? Math.round((sel.atk || sel.def) * (1 + (sel.enh + 1) * 0.08)) : 0;
          html += `<section class="card forge">
            <div class="fg-steps"><span class="fg-cur">+${sel.enh}</span><span class="fg-arrow">➜</span><span class="fg-next">+${sel.enh + 1}</span></div>
            ${nextVal ? `<div class="kv"><span>${sel.atk ? '공격력' : '방어력'}</span><b>${mainVal(sel)} ➜ <em class="up">${nextVal}</em></b></div>` : '<div class="kv"><span>옵션 수치</span><b>+6% 증가</b></div>'}
            <div class="rate-ring" style="--p:${rate * 100}%"><b>${Math.round(rate * 100)}%</b><small>성공 확률</small></div>
            <div class="kv"><span>${R.MATERIALS[mat].icon} ${R.MATERIALS[mat].name}</span><b class="${have >= cnt ? '' : 'bad'}">${have} / ${cnt}</b></div>
            <div class="kv"><span>💰 비용${R.Prog.discount('smith') < 1 ? ' <em class="up">호감도 -20%</em>' : ''}</span><b class="${s.gold >= gold ? '' : 'bad'}">${fmt(gold)}</b></div>
            <div class="safe">🛡 실패해도 단계 하락 · 파괴 없음</div>
            <button class="btn gold wide big" data-a="go" ${ok ? '' : 'disabled'}>⚒ 강화하기</button>
            <div id="forge-res"></div></section>`;
        }
      }
      html += '<section class="card"><div class="card-h">장비 선택</div><div class="inv">' + list.map((it, i) => cell(it, `data-a="pick" data-v="${i}" ${it === sel ? 'data-sel="1"' : ''}`, R.SLOTS.some((k) => s.equip[k] === it) ? '<span class="eq">E</span>' : '')).join('') + '</div></section>';
      body.innerHTML = html;
      body.querySelectorAll('[data-sel]').forEach((e) => e.classList.add('sel'));
      bindActs(body, {
        pick: (i) => { sel = list[i]; UI.refreshPanel(); },
        go: () => {
          const mat = R.enhanceMat(sel.enh), cnt = R.enhanceMatCount(sel.enh), gold = fGold(sel);
          if ((s.bag[mat] || 0) < cnt || s.gold < gold) return;
          s.bag[mat] -= cnt; s.gold -= gold;
          const okk = Math.random() < R.ENHANCE_RATE[sel.enh];
          if (okk) sel.enh++;
          R.refreshStats();
          R.sfx(okk ? 'enhance_ok' : 'enhance_fail');
          UI.refreshPanel();
          const res = $('forge-res');
          if (res) { res.className = okk ? 'ok' : 'fail'; res.textContent = okk ? `✨ 강화 성공! +${sel.enh}` : '강화 실패… 단계는 그대로입니다'; }
        },
      });
    });
  };

  // ─── 상점 ────────────────────────────────────────────
  UI.shop = function (kind) {
    const titles = { potions: '연금술 상점', mats: '대장간 재료', sell: '장비 판매', craft: '연금술 제작', pets: '수상한 상인 · 펫' };
    UI.openPanel(titles[kind], null, (body) => {
      const s = G.save;
      const info = (k) => R.Prog.itemInfo(k);
      if (kind === 'craft') {
        body.innerHTML = `<section class="card"><div class="card-h">보유 채집 재료</div><div class="mats">${Object.keys(R.GATHER).map((k) => `<div class="mat"><span>${R.GATHER[k].icon}</span><b>${s.bag[k] || 0}</b><small>${R.GATHER[k].name}</small></div>`).join('')}</div>
          <div class="muted">던전 곳곳의 약초·광석·버섯에서 [채집]할 수 있습니다. 입장할 때마다 다시 자라요.</div></section>
          <section class="card shop">${R.RECIPES.map((rc, i) => { const o = info(rc.out), ok = R.Prog.canCraft(rc); return `<div class="li"><div class="li-ico">${o.icon}</div><div class="li-b"><b>${o.name} x${rc.n}</b><small>${Object.entries(rc.need).map(([k, v]) => `<span class="${(s.bag[k] || 0) >= v ? '' : 'bad'}">${info(k).icon}${info(k).name} ${s.bag[k] || 0}/${v}</span>`).join(' · ')}</small></div><button class="btn xs gold" data-a="craft" data-v="${i}" ${ok ? '' : 'disabled'}>제작</button></div>`; }).join('')}</section>`;
        bindActs(body, { craft: (i) => { const rc = R.RECIPES[i]; if (R.Prog.craft(rc)) R.toast(`${info(rc.out).icon} ${info(rc.out).name} x${rc.n} 제작 완료`, '#7fffa0'); UI.refreshPanel(); } });
        return;
      }
      if (kind === 'pets') {
        s.pets = s.pets || [];
        body.innerHTML = `<section class="card"><div class="muted">펫은 싸우지 않지만 곁에서 모험을 돕습니다. 한 번에 한 마리만 동행할 수 있어요.</div></section>
          <section class="card shop">${R.PETS.map((d) => { const own = s.pets.includes(d.id); return `<div class="li pet-li ${s.pet === d.id ? 'on' : ''}"><div class="li-ico pet-art" data-k="${d.id}"></div><div class="li-b"><b>${d.name}</b><small>${d.desc}</small></div>
            ${own ? `<button class="btn xs ${s.pet === d.id ? '' : 'gold'}" data-a="use" data-v="${d.id}">${s.pet === d.id ? '동행 해제' : '동행'}</button>` : `<button class="btn xs gold" data-a="buy" data-v="${d.id}" ${R.Prog.canPay(d.price) ? '' : 'disabled'}>${R.Prog.priceText(d.price)}</button>`}</div>`; }).join('')}</section>`;
        body.querySelectorAll('.pet-art').forEach((el) => el.appendChild(spriteCanvas(el.dataset.k, 60, 48, 'pet-cv')));
        bindActs(body, {
          buy: (id) => { if (R.Prog.buyPet(id)) { R.spawnPet(); R.toast(`🐾 ${R.PETS.find((d) => d.id === id).name}이(가) 동료가 되었다!`, '#ffe070'); R.saveGame(); } UI.refreshPanel(); },
          use: (id) => { R.Prog.setPet(id); R.spawnPet(); UI.refreshPanel(); },
        });
        return;
      }
      if (kind === 'sell') {
        body.innerHTML = `<section class="card"><div class="card-h">판매할 장비 <button class="btn xs gold" data-a="bulk">일반·고급 일괄 판매</button></div>
          ${s.inv.length ? s.inv.map((it, i) => `<div class="li">${cell(it)}<div class="li-b"><b style="color:${gcol(it.grade)}">${it.enh ? '+' + it.enh + ' ' : ''}${esc(it.name)}</b><small>${R.GRADES[it.grade].name} · ${R.itemMainText(it)}</small></div><button class="btn xs gold" data-a="sell" data-v="${i}">💰 ${fmt(R.sellPrice(it))}</button></div>`).join('') : '<div class="muted">판매할 장비가 없습니다. (장착 중인 장비는 판매 불가)</div>'}</section>`;
        bindActs(body, {
          sell: (i) => { const it = s.inv[i]; s.gold += R.sellPrice(it); s.inv.splice(i, 1); R.sfx('coin'); UI.refreshPanel(); },
          bulk: () => {
            let g = 0, n = 0;
            s.inv = s.inv.filter((it) => { if (it.grade <= 1 && !it.enh) { g += R.sellPrice(it); n++; return false; } return true; });
            s.gold += g; if (n) { R.sfx('coin'); R.toast(`${n}개 판매 · 💰 +${fmt(g)}`, '#ffe070'); }
            UI.refreshPanel();
          },
        });
        return;
      }
      const table = kind === 'mats' ? R.MATERIALS : R.CONSUMABLES;
      const disc = kind === 'potions' ? R.Prog.discount('alchemist') : 1;
      const price = (k) => Math.round(table[k].price * disc);
      body.innerHTML = (disc < 1 ? '<section class="card"><div class="safe">💗 미라의 호감도 보너스 · 모든 물건 20% 할인</div></section>' : '') + `<section class="card shop">` + Object.keys(table).map((k) => {
        const t = Object.assign({}, table[k], { price: price(k) });
        return `<div class="li"><div class="li-ico">${t.icon}</div><div class="li-b"><b>${t.name}</b><small>${t.desc || '장비 강화 재료'} · 보유 ${s.bag[k] || 0}</small></div>
          <div class="buy"><button class="btn xs gold" data-a="buy" data-v="${k}:1" ${s.gold >= t.price ? '' : 'disabled'}>x1 · ${fmt(t.price)}</button><button class="btn xs" data-a="buy" data-v="${k}:5" ${s.gold >= t.price * 5 ? '' : 'disabled'}>x5 · ${fmt(t.price * 5)}</button></div></div>`;
      }).join('') + '</section>';
      bindActs(body, {
        buy: (v) => { const [k, n] = v.split(':'); const cost = price(k) * +n; if (s.gold < cost) return; s.gold -= cost; s.bag[k] = (s.bag[k] || 0) + +n; R.sfx('coin'); UI.refreshPanel(); },
      });
    });
  };

  // ─── 시즌 이벤트: 축제 교환소 ───────────────────────
  function seasonCard(withBtn) {
    const se = R.Season.current(), st = R.Season.state(), ms = st.mission, need = R.SEASON_MISSION.kills;
    return `<section class="card season" style="--c:${se.color}">
      <div class="ss-h"><span class="ss-ico">${se.icon}</span><div><b>${se.name}</b><small>이번 시즌 누적 ${se.token.icon} ${fmt(st.total)}</small></div><em>${se.token.icon} ${fmt(st.tokens)}</em></div>
      <div class="kv"><span>오늘의 미션 · 던전 몬스터 ${need}마리</span><b>${ms.claimed ? '완료 ✔' : `${Math.min(ms.kills, need)} / ${need}`}</b></div>
      <div class="pbar"><i style="width:${(Math.min(ms.kills, need) / need) * 100}%"></i></div>
      <div class="muted">보상: ${se.token.icon} ${R.SEASON_MISSION.reward.tokens} · 💎 ${R.SEASON_MISSION.reward.gems} — 마을 광장의 축제 안내원 루루에게서 받기</div>
      ${withBtn && ms.kills >= need && !ms.claimed ? '<button class="btn gold wide" data-a="claim">🎁 미션 보상 받기</button>' : ''}
    </section>`;
  }
  UI.eventShop = function () {
    const se = R.Season.current();
    UI.openPanel(`${se.icon} ${se.name} 교환소`, null, (body) => {
      const s = G.save, st = R.Season.state();
      body.innerHTML = seasonCard(true) + `<section class="card shop">${R.SEASON_SHOP.map((it) => {
        const n = R.Season.boughtN(it.id), sold = n >= it.limit || (it.id === 'title' && (s.titles || []).includes(se.id));
        const title = it.id === 'title' ? `「${se.title.name}」 칭호` : it.name;
        const desc = it.id === 'title' ? se.title.desc : `교환 ${n}/${it.limit}`;
        return `<div class="li"><div class="li-ico">${it.icon}</div><div class="li-b"><b>${title}</b><small>${desc}</small></div>
          <button class="btn xs ${sold ? '' : 'gold'}" data-a="buy" data-v="${it.id}" ${R.Season.canBuy(it) ? '' : 'disabled'}>${sold ? '교환 완료' : `${se.token.icon} ${it.cost}`}</button></div>`;
      }).join('')}</section><p class="muted">축제 재화와 교환 횟수는 시즌이 바뀌면 초기화됩니다. 획득한 칭호는 영구 보관돼요.</p>`;
      bindActs(body, {
        buy: (id) => { const it = R.SEASON_SHOP.find((x) => x.id === id); if (R.Season.buy(it) && it.id !== 'box') R.toast(`${it.icon} ${it.id === 'title' ? se.title.name + ' 칭호' : it.name} 교환 완료`, se.color); UI.refreshPanel(); },
        claim: () => { R.Season.claimMission(); UI.refreshPanel(); },
      });
      void st;
    });
  };

  // ─── 지역 선택 (마을 남문) ───────────────────────────
  let selDiff = 0;
  UI.regionSelect = function () {
    selDiff = G.save.diff || 0;
    UI.openPanel('어디로 떠날까?', null, (body) => {
      const s = G.save;
      const cd = s.clearedD || {};
      const hardOpen = !!s.cleared[5];
      const nmOpen = R.REGIONS.every((rg) => cd[1] && cd[1][rg.id]);
      const dOpen = [true, hardOpen, nmOpen];
      if (!dOpen[selDiff]) selDiff = 0;
      const D = R.DIFFICULTY[selDiff];
      const regOpen = (id) => (selDiff === 0 ? id <= s.unlocked : selDiff === 1 ? !!s.cleared[id] : !!(cd[1] && cd[1][id]));
      const regClear = (id) => (selDiff === 0 ? s.cleared[id] : cd[selDiff] && cd[selDiff][id]);
      const lvT = (rg) => `권장 Lv.${rg.lv[0] + D.lv} ~ ${rg.lv[1] + D.lv}`;
      const row = (rg, no, open, lockText) => `<button class="region big ${open ? '' : 'locked'} ${regClear(rg.id) ? 'clear' : ''} t-${rg.theme} ${rg.hidden ? 'hidden-rg' : ''}" data-a="go" data-v="${rg.id}" ${open ? '' : 'disabled'}>
          <div class="rg-no">${no}</div><div class="rg-body"><b>${rg.name}</b><small>${lvT(rg)}${open ? ' · ' + R.BOSSES[rg.boss].name : ''}</small><div class="muted">${open ? rg.gimmickText : lockText}</div></div><div class="rg-st">${regClear(rg.id) ? '🏆' : open ? '▶' : '🔒'}</div></button>`;
      const lockTxt = ['이전 지역 보스를 처치하면 열립니다', '일반 난이도에서 이 지역을 클리어하세요', '어려움 난이도에서 이 지역을 클리어하세요'][selDiff];
      let html = `<div class="seg diff">${R.DIFFICULTY.map((d, i) => `<button class="${selDiff === i ? 'on' : ''}" style="--c:${d.color}" data-a="diff" data-v="${i}" ${dOpen[i] ? '' : 'disabled'}>${dOpen[i] ? '' : '🔒 '}${d.name}</button>`).join('')}</div>`;
      if (selDiff) html += `<section class="card"><div class="safe" style="--c:${D.color}">${D.name} · 몬스터 Lv.+${D.lv} · HP ×${D.hp} · 공격 ×${D.atk} · 경험치 ×${D.exp} · 장비 드랍 ↑</div></section>`;
      else if (!hardOpen) html += '<div class="muted center">5지역 보스를 쓰러뜨리면 [어려움]이, 어려움 5지역을 모두 클리어하면 [악몽]이 열립니다.</div>';
      html += '<section class="card">' + R.REGIONS.map((rg) => row(rg, rg.id, regOpen(rg.id), lockTxt)).join('');
      if (s.flags.blackMine) html += row(R.HIDDEN_REGION, '?', selDiff === 0 || regOpen(6), lockTxt);
      html += '</section>';
      if (s.cleared[2]) {
        const best = (s.tower && s.tower.best) || 0, next = Math.min(R.TOWER_FLOORS, best + 1);
        const cps = [1]; for (let f = 11; f <= next; f += 10) cps.push(f);
        html += `<section class="card tower-card"><div class="card-h">🗼 심연의 탑 <span class="pill">최고 ${best} / ${R.TOWER_FLOORS}층</span></div>
          <div class="muted">한 층의 적을 모두 쓰러뜨리면 다음 층으로. 층마다 제한 조건이 붙고 10층마다 수호자가 나타납니다. 첫 돌파 시 보석 보상.</div>
          <div class="pbar"><i style="width:${(best / R.TOWER_FLOORS) * 100}%"></i></div>
          <div class="row-btns">${cps.filter((f) => f !== next).map((f) => `<button class="btn ghost" data-a="tower" data-v="${f}">${f}층</button>`).join('')}<button class="btn gold" data-a="tower" data-v="${next}">${next}층 도전</button></div></section>`;
      } else html += '<section class="card tower-card locked"><div class="card-h">🗼 심연의 탑 🔒</div><div class="muted">2지역 폐허 도시의 보스를 쓰러뜨리면 열립니다.</div></section>';
      html += '<p class="muted">던전 안의 푸른 포털을 밟으면 언제든 마을로 돌아올 수 있습니다.</p>';
      body.innerHTML = html;
      bindActs(body, {
        diff: (i) => { selDiff = +i; s.diff = selDiff; UI.refreshPanel(); },
        go: (id) => { UI.closePanel(); R.enterRegion(+id, selDiff); },
        tower: (f) => { UI.closePanel(); R.enterTower(+f); },
      });
    });
  };

  // ─── 사망 ────────────────────────────────────────────
  UI.death = function () {
    const s = G.save;
    const n = s.bag.reviveStone || 0;
    popup(`<div class="death"><div class="death-h">쓰러졌다…</div>
      <p class="muted">마을에서 부활하면 경험치 손실은 없지만 던전 진행도가 초기화됩니다.</p>
      <div class="row-btns"><button class="btn gold" data-a="town">마을에서 부활</button>
      <button class="btn" data-a="stone" ${n ? '' : 'disabled'}>🪨 부활석 (${n})</button></div></div>`, (r) => bindActs(r, {
      town: () => { closePopup(); R.revive(false); },
      stone: () => { if (!s.bag.reviveStone) return; s.bag.reviveStone--; closePopup(); R.revive(true); },
    }), true, 'death-pop');
  };

  // ─── 엔딩 / 스토리 ───────────────────────────────────
  UI.ending = function (key) {
    const e = R.ENDINGS[key];
    G.save.ending = key;
    R.saveGame();
    UI.story([e.title, e.text, '— THE END —\n\n《RELIC : 잊혀진 영웅》\n플레이해 주셔서 감사합니다.', '모험은 계속된다.\n모든 지역을 자유롭게 다시 탐험할 수 있습니다.'], () => { G.state = 'play'; R.enterTown(false); });
  };
  UI.story = function (lines, done) {
    const el = $('story');
    let i = 0;
    G.state = 'story';
    el.classList.remove('hidden');
    const show = () => {
      const t = $('story-text');
      t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
      t.textContent = lines[i];
    };
    show();
    el.onclick = () => {
      R.sfx('ui');
      i++;
      if (i >= lines.length) { el.classList.add('hidden'); el.onclick = null; done && done(); }
      else show();
    };
  };

  // ─── 타이틀 / 직업 선택 ──────────────────────────────
  UI.showTitle = function () {
    $('title').classList.remove('hidden');
    $('select').classList.add('hidden');
    $('btn-continue').disabled = !(R.hasSave && R.hasSave());
    const cv = $('title-art');
    const ids = Object.keys(R.CLASSES);
    if (R.SPR.sheet.ready) {
      cv.width = 648; cv.height = 240;
      const g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height);
      ids.forEach((id, i) => { g.save(); g.translate(8 + i * 132, 30); fitSprite(g, id, null, 124, 210, 2); g.restore(); });
      return;
    }
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    ids.forEach((id, i) => {
      const c = R.CLASSES[id];
      const img = R.SPR.human('pl' + id, Object.assign({ shield: id === 'GLADIATOR' }, c.look), 'down', 0, false, 2);
      g.drawImage(img, 18 + i * 46, 80 - img.height);
    });
  };

  let selCls = 'GLADIATOR';
  UI.showSelect = function () {
    $('title').classList.add('hidden');
    $('select').classList.remove('hidden');
    const list = $('sel-list');
    list.innerHTML = '';
    Object.keys(R.CLASSES).forEach((id) => {
      const c = R.CLASSES[id];
      const card = document.createElement('button');
      card.className = 'sel-card' + (id === selCls ? ' on' : '');
      const img = R.SPR.human('pl' + id, Object.assign({ shield: id === 'GLADIATOR' }, c.look), 'down', 0, false, 2);
      card.appendChild(spriteCanvas(id, 160, 200, '', img));
      card.insertAdjacentHTML('beforeend', `<div class="nm">${c.name}</div><div class="ds">${c.desc}</div>`);
      card.onclick = () => { selCls = id; R.sfx('ui'); UI.showSelect(); };
      list.appendChild(card);
    });
    const c = R.CLASSES[selCls];
    const bar = (v) => `<i style="width:${Math.min(100, v / 14 * 100)}%"></i>`;
    $('sel-detail').innerHTML = `<div class="sd-h"><b>${c.name}</b><span>${c.desc}</span></div>
      <div class="sd-stats">${['str', 'dex', 'int', 'vit', 'luk'].map((k) => `<div><small>${k.toUpperCase()}</small><div class="sbar">${bar(c.base[k])}</div><b>${c.base[k]}</b></div>`).join('')}</div>
      <div class="sd-sk">${c.skills.map((k) => `<div><span>${R.SKILLS[k].icon}</span><b>${R.SKILLS[k].name}</b><small>${R.SKILLS[k].desc}</small></div>`).join('')}</div>
      <div class="sd-adv">Lv.30 전직 · ${c.adv.map((a) => `<b>${R.ADVANCES[a].name}</b>`).join(' / ')}</div>`;
  };
  UI.selectedClass = () => selCls;
})();
