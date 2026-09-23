// UI: HUD, 미니맵, 대화창, 메뉴/인벤토리/대장간/상점/도감, 타이틀·직업선택·스토리
'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const UI = (R.UI = {});
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('ko-KR');

  UI.isOpen = () => !$('dialog').classList.contains('hidden') || !$('panel').classList.contains('hidden') || !$('popup').classList.contains('hidden');

  // ─── 토스트 / 배너 ───────────────────────────────────
  R.toast = function (text, color = '#fff') {
    const box = $('toasts');
    const d = document.createElement('div');
    d.className = 'toast';
    d.style.color = color;
    d.textContent = text;
    box.appendChild(d);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => d.remove(), 2600);
  };
  UI.banner = function (text, color = '#fff', sub = '') {
    const b = $('banner');
    b.classList.add('hidden');
    void b.offsetWidth;
    b.innerHTML = `<span style="color:${color}">${esc(text)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    b.classList.remove('hidden');
    clearTimeout(UI._bt);
    UI._bt = setTimeout(() => b.classList.add('hidden'), 2300);
  };

  // ─── 대화창 ──────────────────────────────────────────
  let dlg = null;
  UI.say = function (name, lines, choices, onEnd) {
    dlg = { name, lines: lines.slice(), choices, onEnd, i: 0, shown: 0, full: false };
    $('dialog').classList.remove('hidden');
    $('dlg-name').textContent = name;
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
  function setW(id, pct) { const v = Math.max(0, Math.min(100, pct)).toFixed(1) + '%'; if (hudCache[id] !== v) { hudCache[id] = v; $(id).style.width = v; } }
  UI.updateHUD = function () {
    const p = G.player, s = G.save;
    if (!p) return;
    const cls = R.CLASSES[s.cls];
    setText('hud-lv', `Lv.${s.level}`);
    setText('hud-cls', s.adv ? R.ADVANCES[s.adv].name : cls.name);
    setText('hp-text', `${Math.ceil(p.hp)}/${p.st.maxHp}`);
    setText('mp-text', `${Math.floor(p.mp)}/${p.st.maxMp}`);
    setW('hp-fill', (p.hp / p.st.maxHp) * 100);
    setW('mp-fill', (p.mp / p.st.maxMp) * 100);
    setW('exp-fill', s.level >= R.MAX_LEVEL ? 100 : (s.exp / R.expToNext(s.level)) * 100);
    setText('hud-gold', fmt(s.gold));
    setText('pot-cnt', String(s.bag.hpPotion || 0));
    const st = [];
    if (p.status.poison > 0) st.push('<span style="color:#9ad84a">중독</span>');
    if (p.status.burn > 0) st.push('<span style="color:#ff9a3a">화상</span>');
    if (p.status.slow > 0) st.push('<span style="color:#9fd8ff">빙결</span>');
    if (p.status.stun > 0) st.push('<span style="color:#ffe070">기절</span>');
    const sh = st.join(' ');
    if (hudCache.st !== sh) { hudCache.st = sh; $('hud-status').innerHTML = sh; }
    // 스킬 쿨타임
    cls.skills.forEach((id, i) => {
      const sk = R.SKILLS[id];
      const pct = p.skillCd[i] > 0 ? (p.skillCd[i] / sk.cd) * 100 : 0;
      const v = pct.toFixed(0) + '%';
      const k = 'cd' + i;
      if (hudCache[k] !== v) { hudCache[k] = v; $(`s${i + 1}-cd`).style.setProperty('--p', v); }
      const nomp = p.mp < sk.mp;
      if (hudCache['nm' + i] !== nomp) { hudCache['nm' + i] = nomp; $(`btn-s${i + 1}`).classList.toggle('nomp', nomp); }
    });
    const dcd = p.dodgeCd > 0 ? ((p.dodgeCd / R.DODGE_CD) * 100).toFixed(0) + '%' : '0%';
    if (hudCache.dcd !== dcd) { hudCache.dcd = dcd; $('dodge-cd').style.setProperty('--p', dcd); }
    // 콤보
    const c = G.combo.count;
    if (c >= 2) {
      const txt = `COMBO ×${c}`;
      if (hudCache.combo !== txt) {
        hudCache.combo = txt;
        const el = $('combo');
        el.classList.remove('hidden');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        $('combo-n').textContent = txt;
        $('combo-b').textContent = `피해 +${Math.round(R.comboBonus(c) * 100)}%`;
      }
    } else if (hudCache.combo) { hudCache.combo = ''; $('combo').classList.add('hidden'); }
    // 상호작용 버튼
    const it = G.interact;
    const lbl = it ? it.label : '';
    if (hudCache.act !== lbl) { hudCache.act = lbl; $('btn-act').textContent = lbl; $('btn-act').classList.toggle('show', !!it); }
    // 퀘스트 추적
    const qs = s.quests.slice(0, 3).map((q) => `<div class="${q.ready ? 'q-ready' : ''}">${q.ready ? '✔' : '▸'} ${esc(q.title)} ${q.ready ? '(보고)' : `${q.p}/${q.count}`}</div>`).join('');
    if (hudCache.q !== qs) { hudCache.q = qs; $('btn-quest').innerHTML = qs; }
    // 보스 체력
    if (UI.boss) {
      if (UI.boss.dead) UI.bossBar(null);
      else setW('boss-fill', (UI.boss.hp / UI.boss.maxHp) * 100);
    }
  };
  UI.resetHudCache = () => { for (const k in hudCache) delete hudCache[k]; };
  UI.setSkillButtons = function () {
    const cls = R.CLASSES[G.save.cls];
    cls.skills.forEach((id, i) => {
      $(`s${i + 1}-ico`).textContent = R.SKILLS[id].icon;
      $(`s${i + 1}-lbl`).textContent = R.SKILLS[id].name;
    });
  };
  UI.setArea = (t) => { $('hud-area').textContent = t; };

  UI.bossIntro = function (b) {
    UI.banner(b.def.name, '#ff6a5a', b.def.desc);
    UI.bossBar(b);
    R.Audio.playBgm(6);
  };
  UI.bossBar = function (b) {
    UI.boss = b;
    $('boss-bar').classList.toggle('hidden', !b);
    if (b) $('boss-name').textContent = `${b.def.name}  Lv.${b.lv}`;
  };

  // ─── 미니맵 (탐험한 영역만 표시) ─────────────────────
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
      if (t === T.WALL || t === T.BLOCK) c = m.exploreAll && t === T.WALL ? '#1f3a1f' : t === T.BLOCK ? '#8a6a4a' : null;
      else if (t === T.GATE) c = '#ffd35a';
      else if (t === T.VINE) c = '#3aaa3a';
      else if (t === T.PORTAL) c = '#6ad8ff';
      else if (t === T.HAZARD) c = '#e05a2a';
      else if (t === T.SWITCH) c = '#ffe070';
      else if (t === T.EXIT) c = '#ffe070';
      else if (t === T.PATH) c = '#9a8a6a';
      else if (t === T.WATER) c = '#3a7ad8';
      else c = m.kind === 'town' ? '#3a6a34' : '#5a5470';
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

  // ─── 모달 패널 ───────────────────────────────────────
  let panelState = null;
  UI.openPanel = function (title, tabs, render, tab) {
    panelState = { title, tabs, render, tab: tab || (tabs && tabs[0]) };
    $('panel').classList.remove('hidden');
    $('panel-title').textContent = title;
    drawPanel();
  };
  function drawPanel() {
    const ps = panelState;
    const tabsEl = $('panel-tabs');
    tabsEl.innerHTML = '';
    if (ps.tabs) ps.tabs.forEach((t) => {
      const b = document.createElement('button');
      b.textContent = t; if (t === ps.tab) b.className = 'on';
      b.onclick = () => { ps.tab = t; R.sfx('ui'); drawPanel(); };
      tabsEl.appendChild(b);
    });
    const body = $('panel-body');
    const scroll = body.scrollTop;
    body.innerHTML = '';
    ps.render(body, ps.tab);
    if (ps.keepScroll) body.scrollTop = scroll;
    ps.keepScroll = false;
  }
  UI.refreshPanel = function (keep = true) { if (panelState && !$('panel').classList.contains('hidden')) { panelState.keepScroll = keep; drawPanel(); } };
  UI.closePanel = function () { $('panel').classList.add('hidden'); panelState = null; closePopup(); R.saveGame(); };
  $('panel-close').onclick = () => { R.sfx('ui'); UI.closePanel(); };

  let popModal = false;
  function popup(html, bind, modal = false) {
    popModal = modal;
    $('popup').classList.remove('hidden');
    $('pop').innerHTML = html;
    bind && bind($('pop'));
  }
  function closePopup() { $('popup').classList.add('hidden'); }
  UI.closePopup = closePopup;
  $('popup').addEventListener('pointerdown', (e) => { if (e.target.id === 'popup' && !popModal) closePopup(); });
  function bindActs(root, acts) {
    root.querySelectorAll('[data-a]').forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); R.sfx('ui'); const f = acts[el.dataset.a]; if (f) f(el.dataset.v, el); };
    });
  }

  // ─── 아이템 표시 ─────────────────────────────────────
  const itemIcon = (it) => (it.slot === 'weapon' ? R.WEAPON_ICON[it.wtype] : R.SLOT_ICON[it.slot]);
  function cellHtml(it, extra = '') {
    const c = R.GRADES[it.grade].color;
    return `<span style="filter:drop-shadow(0 0 2px ${c})">${itemIcon(it)}</span>${it.enh ? `<span class="enh">+${it.enh}</span>` : ''}${extra}`;
  }
  function itemCard(it, cmp) {
    const g = R.GRADES[it.grade];
    let diff = '';
    if (cmp && cmp !== it) {
      const a = it.atk ? Math.round(it.atk * (1 + it.enh * 0.08)) : it.def ? Math.round(it.def * (1 + it.enh * 0.08)) : 0;
      const b = cmp.atk ? Math.round(cmp.atk * (1 + cmp.enh * 0.08)) : cmp.def ? Math.round(cmp.def * (1 + cmp.enh * 0.08)) : 0;
      if (a || b) diff = a >= b ? `<span class="cmp-up"> ▲${a - b}</span>` : `<span class="cmp-dn"> ▼${b - a}</span>`;
    }
    return `<div class="item-card" style="border-color:${g.color}">
      <div class="nm" style="color:${g.color}">${it.enh ? `+${it.enh} ` : ''}${esc(it.name)}</div>
      <div class="meta">${g.name} ${R.SLOT_NAME[it.slot]} · 아이템 Lv.${it.ilvl}${it.elem ? ` · ${R.ELEM[it.elem].icon} ${R.ELEM[it.elem].name} 속성` : ''}</div>
      <div class="main">${R.itemMainText(it)}${diff}</div>
      ${it.opts.map((o) => `<div class="opt">${R.optText(o, it)}</div>`).join('')}
      ${cmp && cmp !== it ? `<div class="note" style="margin-top:1.4cqw">장착 중: ${esc(cmp.name)}${cmp.enh ? ' +' + cmp.enh : ''}</div>` : ''}
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

  // ─── 메인 메뉴 ───────────────────────────────────────
  UI.openMenu = function (tab) {
    UI.openPanel('메뉴', ['캐릭터', '장비', '스킬', '퀘스트', '도감', '설정'], renderMenu, tab);
  };
  function renderMenu(body, tab) {
    const s = G.save, p = G.player, st = p.st, cls = R.CLASSES[s.cls];
    if (tab === '캐릭터') {
      const need = R.expToNext(s.level);
      const stats = ['str', 'dex', 'int', 'vit', 'luk'];
      const statName = { str: 'STR 힘', dex: 'DEX 민첩', int: 'INT 지능', vit: 'VIT 체력', luk: 'LUK 행운' };
      body.innerHTML = `
        <h3>${esc(cls.name)}${s.adv ? ' → ' + R.ADVANCES[s.adv].name : ''}  Lv.${s.level}</h3>
        <div class="row"><span class="k">경험치</span><span>${s.level >= R.MAX_LEVEL ? 'MAX' : `${fmt(s.exp)} / ${fmt(need)}`}</span></div>
        <h3>능력치 <span class="note">(남은 포인트: <b style="color:#ffe070">${s.points}</b>)</span></h3>
        ${stats.map((k) => `<div class="row"><span class="k">${statName[k]}</span><span>${st[k]} <span class="note">(기본 ${s.stats[k]})</span> ${s.points > 0 ? `<button class="btn sm gold" data-a="stat" data-v="${k}">+1</button>` : ''}</span></div>`).join('')}
        <h3>전투 능력</h3>
        <div class="row"><span class="k">${cls.atkStat === 'int' ? '마법 공격력' : '공격력'}</span><span>${st.atk}</span></div>
        <div class="row"><span class="k">방어력</span><span>${st.def} <span class="note">(피해 ${Math.round((1 - 100 / (100 + st.def)) * 100)}% 감소)</span></span></div>
        <div class="row"><span class="k">치명타 확률 / 피해</span><span>${(st.crit * 100).toFixed(1)}% / ${Math.round(st.critDmg * 100)}%</span></div>
        <div class="row"><span class="k">최대 HP / MP</span><span>${st.maxHp} / ${st.maxMp}</span></div>
        <div class="row"><span class="k">공격 속도 / 이동 속도</span><span>${st.atkSpd.toFixed(2)} / ${Math.round(st.moveSpd)}</span></div>
        <div class="row"><span class="k">무기 속성</span><span>${R.ELEM[st.elem].icon} ${R.ELEM[st.elem].name}${st.elemDmg ? ` (+${Math.round(st.elemDmg * 100)}%)` : ''}</span></div>
        <h3>재화 · 재료</h3>
        <div class="row"><span class="k">💰 골드</span><span>${fmt(s.gold)}</span></div>
        <div class="row"><span class="k">🏅 명예 메달</span><span>${s.honor || 0}</span></div>
        ${Object.keys(R.MATERIALS).map((k) => `<div class="row"><span class="k">${R.MATERIALS[k].icon} ${R.MATERIALS[k].name}</span><span>${s.bag[k] || 0}</span></div>`).join('')}
        ${Object.keys(R.CONSUMABLES).map((k) => `<div class="row"><span class="k">${R.CONSUMABLES[k].icon} ${R.CONSUMABLES[k].name}</span><span>${s.bag[k] || 0} ${k === 'mpPotion' && s.bag[k] ? '<button class="btn sm" data-a="mp">사용</button>' : ''}</span></div>`).join('')}
        <h3>호감도</h3>
        ${[['elder', '촌장 엘든'], ['bard', '음유시인 노아']].map(([k, n]) => `<div class="row"><span class="k">${n}</span><span>${'♥'.repeat(Math.max(0, Math.min(5, s.favor[k] || 0))) || '-'}</span></div>`).join('')}
      `;
      bindActs(body, {
        stat: (k) => { if (s.points <= 0) return; s.points--; s.stats[k]++; R.refreshStats(); UI.refreshPanel(); },
        mp: () => { R.usePotion('mpPotion'); UI.refreshPanel(); },
      });
    } else if (tab === '장비') {
      body.innerHTML = `
        <h3>장착 장비</h3>
        <div class="slots">${R.SLOTS.map((sl) => { const it = s.equip[sl]; return it ? `<button class="cell" data-a="eq" data-v="${sl}" style="border-color:${R.GRADES[it.grade].color}">${cellHtml(it)}<span class="slot-n">${R.SLOT_NAME[sl]}</span></button>` : `<button class="cell empty">${R.SLOT_NAME[sl]}</button>`; }).join('')}</div>
        <h3>가방 (${s.inv.length}/40) <button class="btn sm" data-a="sort" style="float:right">정렬</button></h3>
        <div class="inv">${s.inv.map((it, i) => `<button class="cell" data-a="inv" data-v="${i}" style="border-color:${R.GRADES[it.grade].color}">${cellHtml(it)}</button>`).join('')}${Array(Math.max(0, 40 - s.inv.length)).fill('<div class="cell empty"></div>').join('')}</div>
        <p class="note">장비는 대장장이 브론에게 강화할 수 있습니다. (실패해도 하락·파괴 없음)</p>`;
      bindActs(body, {
        eq: (sl) => { const it = s.equip[sl]; popup(itemCard(it) + `<div class="btns-row"><button class="btn" data-a="un">해제</button><button class="btn" data-a="x">닫기</button></div>`, (r) => bindActs(r, { un: () => { unequip(sl); closePopup(); UI.refreshPanel(); }, x: closePopup })); },
        inv: (i) => {
          const it = s.inv[i];
          const cur = s.equip[it.slot];
          popup(itemCard(it, cur) + `<div class="btns-row"><button class="btn gold" data-a="eq">장착</button><button class="btn red" data-a="drop">버리기</button><button class="btn" data-a="x">닫기</button></div>`,
            (r) => bindActs(r, { eq: () => { equip(it); closePopup(); UI.refreshPanel(); }, drop: () => { s.inv.splice(s.inv.indexOf(it), 1); closePopup(); UI.refreshPanel(); }, x: closePopup }));
        },
        sort: () => { s.inv.sort((a, b) => b.grade - a.grade || R.SLOTS.indexOf(a.slot) - R.SLOTS.indexOf(b.slot) || b.ilvl - a.ilvl); UI.refreshPanel(); },
      });
    } else if (tab === '스킬') {
      const combo = R.COMBO_STEPS.map((c, i) => `${i + 1}타 ${c.name} ${Math.round(c.rate * 100)}%${c.down ? ' (다운)' : c.launch ? ' (띄움)' : ''}`).join(' → ');
      body.innerHTML = `
        <h3>기본 공격 · 3단 콤보</h3>
        <div class="list-item"><div class="li-ico">${R.WEAPON_ICON[cls.weapon]}</div><div class="li-body"><div class="li-title">연속 공격</div><div class="li-desc">${combo}</div></div></div>
        <div class="list-item"><div class="li-ico">💨</div><div class="li-body"><div class="li-title">회피 (쿨타임 ${(R.DODGE_CD * (1 - (st.adv.dodgeCdr || 0))).toFixed(1)}초)</div><div class="li-desc">발동 즉시 0.25초 무적 · 이동 방향으로 구르기</div></div></div>
        <h3>직업 스킬</h3>
        ${cls.skills.map((id, i) => { const k = R.SKILLS[id]; return `<div class="list-item"><div class="li-ico">${k.icon}</div><div class="li-body"><div class="li-title">[스킬${i + 1}] ${k.name} <span class="note">MP ${k.mp} · ${k.cd}초 · ${R.ELEM[k.elem].name}</span></div><div class="li-desc">${k.desc}</div></div></div>`; }).join('')}
        <h3>콤보 보정</h3>
        <div class="note">공격/스킬을 2초 안에 연속으로 적중시키면 COMBO가 쌓입니다.<br>×2 +5% → ×3 +10% → ×4 +20% → ×5 이상 +30%</div>
        <h3>속성 상성 (+25%)</h3>
        <div class="note">🔥 화염 → 🌿 자연 → ⚡ 번개 → ❄ 냉기 → 🔥 화염 · 🌑 암흑 ↔ 🌑 암흑</div>
        <h3>2차 전직 (Lv.30)</h3>
        ${cls.adv.map((a) => `<div class="list-item ${s.adv === a ? 'done' : s.adv ? 'locked' : ''}"><div class="li-ico">${s.adv === a ? '★' : '☆'}</div><div class="li-body"><div class="li-title">${R.ADVANCES[a].name}</div><div class="li-desc">${R.ADVANCES[a].desc}</div></div></div>`).join('')}
        ${!s.adv ? '<div class="note">Lv.30 달성 후 촌장 엘든에게 말을 걸면 전직할 수 있습니다.</div>' : ''}`;
    } else if (tab === '퀘스트') {
      body.innerHTML = `<h3>진행 중</h3>
        ${s.quests.length ? s.quests.map((q) => `<div class="list-item ${q.ready ? 'done' : ''}"><div class="li-ico">${q.ready ? '✔' : q.id[0] === 'm' ? '📜' : q.id === 'guild' ? '⚔' : '🎵'}</div><div class="li-body"><div class="li-title">${esc(q.title)}</div><div class="li-desc">${esc(q.desc)}<br>${q.ready ? `완료! ${esc(q.giverName || '')}에게 보고하세요` : `진행: ${q.p} / ${q.count}`}</div></div></div>`).join('') : '<div class="note">진행 중인 퀘스트가 없습니다. 촌장 엘든이나 길드장 레오를 찾아가 보세요.</div>'}
        <h3>세계 지도</h3>
        ${R.REGIONS.map((rg) => { const open = rg.id <= s.unlocked; return `<div class="list-item ${s.cleared[rg.id] ? 'done' : open ? '' : 'locked'}"><div class="li-ico">${s.cleared[rg.id] ? '🏆' : open ? '🗺' : '🔒'}</div><div class="li-body"><div class="li-title">${rg.id}지역 : ${rg.name} <span class="note">Lv.${rg.lv[0]}~${rg.lv[1]}</span></div><div class="li-desc">보스: ${open ? R.BOSSES[rg.boss].name : '???'} · ${open ? rg.gimmickText : '이전 지역의 보스를 쓰러뜨리면 해금'}</div></div></div>`; }).join('')}`;
    } else if (tab === '도감') {
      body.innerHTML = '';
      R.REGIONS.forEach((rg) => {
        const h = document.createElement('h3');
        h.textContent = `${rg.id}지역 : ${rg.name}`;
        body.appendChild(h);
        const grid = document.createElement('div');
        grid.className = 'codex';
        [...rg.monsters, rg.boss].forEach((id) => {
          const boss = id === rg.boss;
          const def = boss ? R.BOSSES[id] : R.MONSTERS[id];
          const known = (s.codex[id] || 0) > 0;
          const cell = document.createElement('button');
          cell.className = 'codex-cell' + (known ? '' : ' unknown');
          const cv = document.createElement('canvas');
          const img = def.arch === 'human' ? R.SPR.human(id, def.look, 'down', 0, false) : R.SPR.monster(id, def, 0, false);
          cv.width = 28; cv.height = 28;
          const g = cv.getContext('2d');
          g.imageSmoothingEnabled = false;
          const k = Math.min(26 / img.width, 26 / img.height);
          if (!known) g.filter = 'brightness(0) invert(0.22)';
          g.drawImage(img, (28 - img.width * k) / 2, (28 - img.height * k) / 2, img.width * k, img.height * k);
          cell.appendChild(cv);
          const nm = document.createElement('div');
          nm.textContent = known ? def.name + (boss ? ' 👑' : '') : '???';
          cell.appendChild(nm);
          if (known) {
            const w = R.weaknessOf(def.elem);
            cell.onclick = () => { R.sfx('ui'); popup(`<div class="item-card"><div class="nm">${def.name}${boss ? ' (보스)' : ''}</div>
              <div class="meta">출현 지역: ${rg.name} · 처치 ${s.codex[id]}회</div>
              <div class="row"><span class="k">위험도</span><span class="stars">${'★'.repeat(boss ? 5 : def.danger || 1)}${'☆'.repeat(5 - (boss ? 5 : def.danger || 1))}</span></div>
              <div class="row"><span class="k">속성</span><span>${R.ELEM[def.elem].icon} ${R.ELEM[def.elem].name}</span></div>
              <div class="row"><span class="k">약점</span><span>${w ? R.ELEM[w].icon + ' ' + R.ELEM[w].name : '없음'}</span></div>
              <p class="note">${def.desc}</p></div><div class="btns-row"><button class="btn" data-a="x">닫기</button></div>`, (r) => bindActs(r, { x: closePopup })); };
          }
          grid.appendChild(cell);
        });
        body.appendChild(grid);
      });
      const total = Object.keys(R.MONSTERS).length + Object.keys(R.BOSSES).length;
      const found = Object.keys(s.codex).filter((k) => s.codex[k] > 0).length;
      const n = document.createElement('p'); n.className = 'note'; n.textContent = `수집률 ${found} / ${total}`;
      body.appendChild(n);
    } else if (tab === '설정') {
      const A = R.Audio;
      body.innerHTML = `
        <h3>사운드</h3>
        <div class="row"><span class="k">효과음</span><button class="btn sm" data-a="sfx">${A.sfxOn ? 'ON' : 'OFF'}</button></div>
        <div class="row"><span class="k">배경음</span><button class="btn sm" data-a="bgm">${A.bgmOn ? 'ON' : 'OFF'}</button></div>
        <h3>게임</h3>
        <div class="btns-row">
          <button class="btn green" data-a="save">저장하기</button>
          ${G.map.kind !== 'town' ? '<button class="btn gold" data-a="home">마을로 귀환</button>' : ''}
          <button class="btn" data-a="title">타이틀로</button>
          <button class="btn red" data-a="reset">데이터 초기화</button>
        </div>
        <h3>조작법</h3>
        <div class="note">키보드: 이동 WASD/방향키 · 공격 J(누르고 있으면 연속) · 스킬 K/L · 회피 Space · 물약 Q · 대화/상호작용 E · 메뉴 Esc/M<br>터치: 화면 왼쪽을 드래그해 이동, 오른쪽 버튼으로 공격·스킬·회피</div>
        <h3>게임 원칙</h3>
        <div class="note">자동 사냥 없음 · 전투력 경쟁 없음 · VIP/강제 광고 없음 · 필드 파밍만으로 엔딩 가능</div>`;
      bindActs(body, {
        sfx: () => { A.sfxOn = !A.sfxOn; A.persist(); UI.refreshPanel(); },
        bgm: () => { A.bgmOn = !A.bgmOn; A.persist(); UI.refreshPanel(); },
        save: () => { R.saveGame(); R.toast('저장되었습니다', '#7fffa0'); },
        home: () => { UI.closePanel(); R.enterTown(); },
        title: () => { UI.closePanel(); R.toTitle(); },
        reset: () => popup(`<p>정말 모든 진행 데이터를 삭제할까요?<br><span class="note">되돌릴 수 없습니다.</span></p><div class="btns-row"><button class="btn red" data-a="y">삭제</button><button class="btn" data-a="n">취소</button></div>`,
          (r) => bindActs(r, { y: () => { R.deleteSave(); closePopup(); UI.closePanel(); R.toTitle(); }, n: closePopup })),
      });
    }
  }

  // ─── 대장간 (안전 강화) ──────────────────────────────
  UI.forge = function () {
    let sel = null;
    UI.openPanel('대장간 — 안전 강화', null, (body) => {
      const s = G.save;
      const list = [...R.SLOTS.map((k) => s.equip[k]).filter(Boolean), ...s.inv];
      if (sel && !list.includes(sel)) sel = null;
      if (!sel) sel = list[0];
      let html = '<h3>강화할 장비 선택</h3><div class="inv">' + list.map((it, i) => `<button class="cell ${it === sel ? 'sel' : ''}" data-a="pick" data-v="${i}" style="border-color:${R.GRADES[it.grade].color}">${cellHtml(it, R.SLOTS.some((k) => s.equip[k] === it) ? '<span class="eq">E</span>' : '')}</button>`).join('') + '</div>';
      if (sel) {
        html += '<h3>강화 정보</h3>' + itemCard(sel);
        if (sel.enh >= 10) html += '<p class="note">최대 강화 단계(+10)입니다.</p>';
        else {
          const mat = R.enhanceMat(sel.enh), cnt = R.enhanceMatCount(sel.enh), gold = R.enhanceGold(sel);
          const rate = R.ENHANCE_RATE[sel.enh];
          const have = s.bag[mat] || 0;
          const ok = have >= cnt && s.gold >= gold;
          html += `<div class="row"><span class="k">다음 단계</span><span>+${sel.enh} → <b style="color:#ffe070">+${sel.enh + 1}</b></span></div>
            <div class="row"><span class="k">성공 확률</span><span>${Math.round(rate * 100)}%</span></div>
            <div class="row"><span class="k">필요 재료</span><span style="color:${have >= cnt ? '#fff' : '#ff8a8a'}">${R.MATERIALS[mat].icon} ${R.MATERIALS[mat].name} ${have}/${cnt}</span></div>
            <div class="row"><span class="k">비용</span><span style="color:${s.gold >= gold ? '#fff' : '#ff8a8a'}">💰 ${fmt(gold)}</span></div>
            <div class="row"><span class="k">실패 시</span><span style="color:#7fffa0">단계 유지 · 파괴 없음</span></div>
            <div class="btns-row"><button class="btn gold" data-a="go" ${ok ? '' : 'disabled'}>⚒ 강화하기</button></div>
            <div id="forge-res" style="text-align:center;font-size:4.4cqw;margin-top:2cqw;min-height:6cqw"></div>`;
        }
      }
      body.innerHTML = html;
      bindActs(body, {
        pick: (i) => { sel = list[i]; UI.refreshPanel(); },
        go: () => {
          const mat = R.enhanceMat(sel.enh), cnt = R.enhanceMatCount(sel.enh), gold = R.enhanceGold(sel);
          if ((s.bag[mat] || 0) < cnt || s.gold < gold) return;
          s.bag[mat] -= cnt; s.gold -= gold;
          const okk = Math.random() < R.ENHANCE_RATE[sel.enh];
          if (okk) sel.enh++;
          R.refreshStats();
          R.sfx(okk ? 'enhance_ok' : 'enhance_fail');
          UI.refreshPanel();
          const res = $('forge-res');
          if (res) { res.innerHTML = okk ? `<span style="color:#ffe070">✨ 강화 성공! +${sel.enh}</span>` : '<span style="color:#ff8a8a">강화 실패… (단계 유지)</span>'; }
        },
      });
    });
  };

  // ─── 상점 ────────────────────────────────────────────
  UI.shop = function (kind) {
    const titles = { potions: '연금술 상점 — 구매', mats: '대장간 — 재료 구매', sell: '연금술 상점 — 판매' };
    UI.openPanel(titles[kind], null, (body) => {
      const s = G.save;
      if (kind === 'sell') {
        body.innerHTML = `<h3>보유 골드 💰 ${fmt(s.gold)}</h3>
          <div class="btns-row" style="margin-bottom:2cqw"><button class="btn gold" data-a="bulk">일반·고급 일괄 판매</button></div>
          ${s.inv.length ? s.inv.map((it, i) => `<div class="list-item"><div class="li-ico" style="filter:drop-shadow(0 0 2px ${R.GRADES[it.grade].color})">${itemIcon(it)}</div><div class="li-body"><div class="li-title" style="color:${R.GRADES[it.grade].color}">${it.enh ? '+' + it.enh + ' ' : ''}${esc(it.name)}</div><div class="li-desc">${R.GRADES[it.grade].name} · ${R.itemMainText(it)}</div></div><button class="btn sm gold" data-a="sell" data-v="${i}">💰${fmt(R.sellPrice(it))}</button></div>`).join('') : '<div class="note">판매할 장비가 없습니다. (장착 중인 장비는 판매 불가)</div>'}`;
        bindActs(body, {
          sell: (i) => { const it = s.inv[i]; s.gold += R.sellPrice(it); s.inv.splice(i, 1); R.sfx('coin'); UI.refreshPanel(); },
          bulk: () => {
            let g = 0, n = 0;
            s.inv = s.inv.filter((it) => { if (it.grade <= 1 && !it.enh) { g += R.sellPrice(it); n++; return false; } return true; });
            s.gold += g; if (n) { R.sfx('coin'); R.toast(`${n}개 판매: +${fmt(g)} 골드`, '#ffe070'); }
            UI.refreshPanel();
          },
        });
        return;
      }
      const table = kind === 'mats' ? R.MATERIALS : R.CONSUMABLES;
      body.innerHTML = `<h3>보유 골드 💰 ${fmt(s.gold)}</h3>` + Object.keys(table).map((k) => {
        const t = table[k];
        return `<div class="list-item"><div class="li-ico">${t.icon}</div><div class="li-body"><div class="li-title">${t.name} <span class="note">보유 ${s.bag[k] || 0}</span></div><div class="li-desc">${t.desc || '장비 강화 재료'} · 💰${fmt(t.price)}</div></div>
          <div style="display:flex;flex-direction:column;gap:1cqw"><button class="btn sm gold" data-a="buy" data-v="${k}:1" ${s.gold >= t.price ? '' : 'disabled'}>x1</button><button class="btn sm gold" data-a="buy" data-v="${k}:5" ${s.gold >= t.price * 5 ? '' : 'disabled'}>x5</button></div></div>`;
      }).join('');
      bindActs(body, {
        buy: (v) => { const [k, n] = v.split(':'); const cost = table[k].price * +n; if (s.gold < cost) return; s.gold -= cost; s.bag[k] = (s.bag[k] || 0) + +n; R.sfx('coin'); UI.refreshPanel(); },
      });
    });
  };

  // ─── 지역 선택 (마을 남문) ───────────────────────────
  UI.regionSelect = function () {
    UI.openPanel('남문 — 어디로 떠날까?', null, (body) => {
      const s = G.save;
      body.innerHTML = R.REGIONS.map((rg) => {
        const open = rg.id <= s.unlocked;
        return `<button class="list-item ${open ? '' : 'locked'} ${s.cleared[rg.id] ? 'done' : ''}" style="width:100%;text-align:left;color:inherit" data-a="go" data-v="${rg.id}" ${open ? '' : 'disabled'}>
          <div class="li-ico">${open ? ['🌲', '🏚', '⛏', '🏰', '🌋'][rg.id - 1] : '🔒'}</div>
          <div class="li-body"><div class="li-title">${rg.id}지역 : ${rg.name} ${s.cleared[rg.id] ? '🏆' : ''}</div>
          <div class="li-desc">권장 Lv.${rg.lv[0]} ~ ${rg.lv[1]} · ${open ? rg.gimmickText : '이전 지역 보스를 처치하면 열립니다'}</div></div></button>`;
      }).join('') + '<p class="note">던전 안의 푸른 포털을 밟으면 언제든 마을로 돌아올 수 있습니다.</p>';
      bindActs(body, { go: (id) => { UI.closePanel(); R.enterRegion(+id); } });
    });
  };

  // ─── 사망 ────────────────────────────────────────────
  UI.death = function () {
    const s = G.save;
    const n = s.bag.reviveStone || 0;
    popup(`<div style="text-align:center"><div style="font-size:6cqw;color:#ff6a6a;margin-bottom:2cqw">쓰러졌다…</div>
      <p class="note">마을에서 부활하면 경험치 손실은 없지만 던전 진행도가 초기화됩니다.</p>
      <div class="btns-row" style="justify-content:center"><button class="btn gold" data-a="town">마을에서 부활 (무료)</button>
      <button class="btn green" data-a="stone" ${n ? '' : 'disabled'}>🪨 부활석 사용 (${n})</button></div></div>`, (r) => bindActs(r, {
      town: () => { closePopup(); R.revive(false); },
      stone: () => { if (!s.bag.reviveStone) return; s.bag.reviveStone--; closePopup(); R.revive(true); },
    }), true);
  };

  // ─── 엔딩 ────────────────────────────────────────────
  UI.ending = function (key) {
    const e = R.ENDINGS[key];
    G.save.ending = key;
    R.saveGame();
    UI.story([e.title, e.text, '— THE END —\n\n《RELIC : 잊혀진 영웅》\n플레이해 주셔서 감사합니다.', '모험은 계속된다.\n모든 지역을 자유롭게 다시 탐험할 수 있습니다.'], () => { G.state = 'play'; R.enterTown(false); });
  };

  // ─── 스토리 화면 ─────────────────────────────────────
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
    $('btn-continue').disabled = !R.hasSave();
    const cv = $('title-art'), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    const ids = Object.keys(R.CLASSES);
    ids.forEach((id, i) => {
      const c = R.CLASSES[id];
      const img = R.SPR.human('pl' + id, Object.assign({ shield: id === 'GLADIATOR' }, c.look), 'down', 0, false, 2);
      g.drawImage(img, 18 + i * 46, 80 - img.height);
    });
    const sl = R.SPR.monster('slime', R.MONSTERS.slime, 0, false, 2);
    g.drawImage(sl, 196 - sl.width / 2, 80 - sl.height);
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
      const cv = document.createElement('canvas');
      cv.width = 40; cv.height = 50;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      const img = R.SPR.human('pl' + id, Object.assign({ shield: id === 'GLADIATOR' }, c.look), 'down', 0, false, 2);
      g.drawImage(img, (40 - img.width) / 2, 50 - img.height);
      card.appendChild(cv);
      card.insertAdjacentHTML('beforeend', `<div class="nm">${c.name}</div><div class="ds">${c.desc}</div>`);
      card.onclick = () => { selCls = id; R.sfx('ui'); UI.showSelect(); };
      list.appendChild(card);
    });
    const c = R.CLASSES[selCls];
    $('sel-detail').innerHTML = `<b>${c.name}</b> — ${c.desc}<br>
      STR ${c.base.str} · DEX ${c.base.dex} · INT ${c.base.int} · VIT ${c.base.vit} · LUK ${c.base.luk}<br>
      스킬: ${c.skills.map((k) => R.SKILLS[k].icon + ' ' + R.SKILLS[k].name).join(' · ')}<br>
      <span class="note">${c.skills.map((k) => R.SKILLS[k].desc).join(' / ')}</span><br>
      Lv.30 전직: ${c.adv.map((a) => R.ADVANCES[a].name).join(' 또는 ')}`;
  };
  UI.selectedClass = () => selCls;
})();
