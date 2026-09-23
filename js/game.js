// 메인 루프, 입력, 저장/불러오기, 맵 전환, 상호작용
'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const TS = R.TILE;
  const SAVE_KEY = 'relic_save_v1';
  const cv = $('cv');
  cv.width = R.VIEW_W * R.SCALE;
  cv.height = R.VIEW_H * R.SCALE;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ─── 저장 ────────────────────────────────────────────
  function newSave(cls) {
    const c = R.CLASSES[cls];
    const s = {
      v: 1, cls, adv: null, level: 1, exp: 0, stats: Object.assign({}, c.base), points: 0, gold: 100,
      equip: {}, inv: [], bag: { hpPotion: 5, mpPotion: 3, reviveStone: 1, iron: 2 },
      quests: [], mainIdx: 0, mqv: 2, subDone: {}, unlocked: 1, cleared: {}, codex: {}, flags: {}, favor: {}, honor: 0,
      hp: null, mp: null, playTime: 0,
      gems: 300, coins: 0, sp: 0, skillLv: {}, runes: {}, pity: 0, itemDex: {}, summons: 0,
      pets: [], pet: null, buffs: {}, titles: [], title: null, tower: { best: 0 }, diff: 0, dclear: {}, clearedD: { 1: {}, 2: {} },
    };
    R.SLOTS.forEach((k) => (s.equip[k] = null));
    s.equip.weapon = R.makeItem('weapon', 1, 0, cls);
    s.equip.armor = R.makeItem('armor', 1, 0, cls);
    s.spInit = true;
    s.itemDex[`${c.weapon}:0`] = 1; s.itemDex['armor:0'] = 1;
    return s;
  }
  R.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  R.saveGame = function () {
    const s = G.save;
    if (!s || G.state !== 'play') return;
    if (G.player) { s.hp = Math.max(1, Math.round(G.player.hp)); s.mp = Math.round(G.player.mp); }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* 저장 불가 환경 */ }
  };
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || !R.CLASSES[s.cls]) return null;
      if (!s.mqv) { s.cleared = s.cleared || {}; s.quests = s.quests || []; R.Quest.migrate(s); }   // 옛 저장 데이터 → 새 메인 퀘스트
      const d = newSave(s.cls);
      for (const k in d) if (s[k] === undefined) s[k] = d[k];
      if (!s.spInit) { s.sp = (s.sp || 0) + (s.level - 1); s.spInit = true; } // 이전 버전 저장 데이터: 레벨만큼 SP 지급
      return s;
    } catch (e) { return null; }
  }
  R.deleteSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } };

  // ─── 입력 ────────────────────────────────────────────
  const inp = (G.input = { move: { x: 0, y: 0 }, moving: false, atkHeld: false, atkPressed: false, skillPressed: [false, false, false, false, false], dodgePressed: false, potionPressed: false, mpPotionPressed: false });
  const buf = { atk: 0, s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, dodge: 0, pot: 0, mp: 0, act: 0 };
  const keys = new Set();
  const stick = { x: 0, y: 0, id: null };

  const KEYMAP = {
    KeyJ: 'atk', KeyZ: 'atk', KeyK: 's0', KeyX: 's0', KeyL: 's1', KeyC: 's1', KeyU: 's2', KeyV: 's2', KeyO: 's3', KeyB: 's3', KeyP: 's4', KeyN: 's4', Space: 'dodge', ShiftLeft: 'dodge', KeyQ: 'pot', KeyR: 'mp', KeyE: 'act', Enter: 'act',
  };
  window.addEventListener('keydown', (e) => {
    R.Audio.unlock();
    if (G.state !== 'play') return;
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) e.preventDefault();
    if (R.UI.dialogKey(e.key)) return;
    if (!$('dialog').classList.contains('hidden')) {
      if (code === 'Space' || code === 'Enter' || code === 'KeyE' || code === 'KeyJ' || code === 'KeyZ') R.UI.advanceDialog();
      return;
    }
    if (code === 'Escape' || code === 'KeyM' || code === 'Tab' || code === 'KeyI') {
      if (!$('popup').classList.contains('hidden') && !G.player.dead) R.UI.closePopup();
      else if (!$('panel').classList.contains('hidden')) R.UI.closePanel();
      else if (!G.player.dead) R.UI.openMenu(code === 'KeyI' ? '장비' : undefined);
      return;
    }
    if (R.UI.isOpen()) return;
    keys.add(code);
    const a = KEYMAP[code];
    if (a && !e.repeat) buf[a] = 0.25;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); });

  // 가상 조이스틱 (왼쪽 영역 어디든 터치하면 그 자리에 생성)
  const zone = $('stick-zone'), base = $('stick-base'), knob = $('stick-knob');
  let origin = null;
  zone.addEventListener('pointerdown', (e) => {
    R.Audio.unlock();
    if (stick.id !== null) return;
    stick.id = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    origin = { x: e.clientX, y: e.clientY };
    base.style.left = `${e.clientX - r.left - base.offsetWidth / 2}px`;
    base.style.top = `${e.clientY - r.top - base.offsetHeight / 2}px`;
    base.style.bottom = 'auto';
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stick.id) return;
    const max = base.offsetWidth * 0.42;
    let dx = e.clientX - origin.x, dy = e.clientY - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const n = Math.min(1, d / max);
    stick.x = d > 4 ? (dx / Math.max(d, 1)) * (n < 0.35 ? n / 0.35 : 1) : 0;
    stick.y = d > 4 ? (dy / Math.max(d, 1)) * (n < 0.35 ? n / 0.35 : 1) : 0;
  });
  const endStick = (e) => {
    if (e.pointerId !== stick.id) return;
    stick.id = null; stick.x = 0; stick.y = 0;
    knob.style.transform = '';
    base.style.left = ''; base.style.top = ''; base.style.bottom = '';
  };
  zone.addEventListener('pointerup', endStick);
  zone.addEventListener('pointercancel', endStick);

  function bindBtn(id, down, up) {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); R.Audio.unlock(); el.setPointerCapture(e.pointerId); el.classList.add('on'); down(); });
    const u = () => { el.classList.remove('on'); up && up(); };
    el.addEventListener('pointerup', u);
    el.addEventListener('pointercancel', u);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  let atkBtnDown = false;
  bindBtn('btn-atk', () => { buf.atk = 0.25; atkBtnDown = true; }, () => { atkBtnDown = false; });
  bindBtn('btn-s1', () => { buf.s0 = 0.25; });
  bindBtn('btn-s2', () => { buf.s1 = 0.25; });
  bindBtn('btn-s3', () => { buf.s2 = 0.25; });
  bindBtn('btn-s4', () => { buf.s3 = 0.25; });
  bindBtn('btn-s5', () => { buf.s4 = 0.25; });
  bindBtn('btn-dodge', () => { buf.dodge = 0.25; });
  bindBtn('btn-pot', () => { buf.pot = 0.25; });
  bindBtn('btn-mp', () => { buf.mp = 0.25; });
  // 화면 터치: 그 칸으로 이동 / 몬스터 지정(자동 기본 공격) / NPC·상자 등은 걸어가서 상호작용
  $('cv').addEventListener('pointerdown', (e) => {
    if (G.state !== 'play' || !G.player || R.UI.isOpen()) return;
    R.Audio.unlock();
    const r = $('cv').getBoundingClientRect();
    R.tapWorld((e.clientX - r.left) / r.width * R.VIEW_W + G.cam.x, (e.clientY - r.top) / r.height * R.VIEW_H + G.cam.y);
  });
  bindBtn('btn-act', () => { buf.act = 0.25; });
  $('btn-menu').onclick = () => { R.sfx('ui'); if (!G.player.dead) R.UI.openMenu(); };
  $('btn-quest').onclick = () => { R.sfx('ui'); if (!G.player.dead) R.UI.openMenu('퀘스트'); };
  // 화면 오른쪽 바로가기 아이콘: 스탯 · 장비 · 가방 · 스킬
  document.querySelectorAll('#quick button').forEach((b) => { b.onclick = () => { R.sfx('ui'); if (!G.player.dead && !R.UI.isOpen()) R.UI.openMenu(b.dataset.tab); }; });
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  const DIR_KEYS = { KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0], KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1] };
  const dirOrder = [];
  addEventListener('keydown', (e) => { if (DIR_KEYS[e.code] && !e.repeat) { const i = dirOrder.indexOf(e.code); if (i >= 0) dirOrder.splice(i, 1); dirOrder.push(e.code); } });
  function readInput(dt) {
    // 4방향: 가장 최근에 누른 방향키가 우선
    let x = 0, y = 0;
    for (let i = dirOrder.length - 1; i >= 0; i--) {
      if (!keys.has(dirOrder[i])) continue;
      [x, y] = DIR_KEYS[dirOrder[i]];
      break;
    }
    if (!x && !y) {
      x = stick.x; y = stick.y;
      if (Math.abs(x) >= Math.abs(y)) y = 0; else x = 0;
    }
    inp.move.x = x; inp.move.y = y;
    inp.moving = Math.hypot(x, y) > 0.15;
    inp.atkHeld = atkBtnDown || keys.has('KeyJ') || keys.has('KeyZ');
    for (const k in buf) buf[k] = Math.max(0, buf[k] - dt);
    inp.atkPressed = buf.atk > 0;
    for (let i = 0; i < 5; i++) inp.skillPressed[i] = buf['s' + i] > 0;
    inp.dodgePressed = buf.dodge > 0;
    inp.potionPressed = buf.pot > 0;
    inp.mpPotionPressed = buf.mp > 0;
  }
  function consumeInput() {
    const p = G.player;
    if (p.state === 'attack' && p.stateT === 0) buf.atk = 0;
    if (p.state === 'skill' && p.stateT === 0) { for (let i = 0; i < 5; i++) buf['s' + i] = 0; }
    if (p.state === 'dodge' && p.stateT === 0) buf.dodge = 0;
    if (p.potionCd > 0.9) { buf.pot = 0; buf.mp = 0; }
    for (let i = 0; i < 5; i++) if (p.skillCd[i] > 0) buf['s' + i] = 0;
  }

  // ─── 맵 전환 ─────────────────────────────────────────
  function clearWorld() {
    if (R.UI.fade) R.UI.fade();
    G.pet = null; G.jobs = []; G.tap = null; G.lastHit = null; G.tapInteract = false;
    G.mobs = []; G.shots = []; G.drops = []; G.nums = []; G.teles = [];
    G.fx.length = 0;
    if (R.clearAmbient) R.clearAmbient();
    G.combo.count = 0; G.combo.t = 0;
    if (G.streak) { G.streak.n = 0; G.streak.fever = 0; }
    R.UI.bossBar(null);
  }
  function placePlayer(x, y) {
    if (!G.player) G.player = R.createPlayer(G.save, x, y);
    const p = G.player;
    p.state = 'idle'; p.act = null; p.vx = 0; p.vy = 0; p.queued = null;
    R.Grid.place(p, R.Grid.tx(x), R.Grid.ty(y));
    if (R.Grid.blocked(p.gx, p.gy, p)) { R.Grid.snap(p); R.Grid.update(p, 1); }
    G.cam.x = p.x - R.VIEW_W / 2; G.cam.y = p.y - R.VIEW_H / 2;
  }

  R.enterTown = function (fromGate = true) {
    clearWorld();
    G.map = R.buildTown();
    G.dungeon = null;
    G.declined = null;
    const m = G.map;
    if (fromGate && G.player) placePlayer(13 * TS, (m.h - 4) * TS);
    else placePlayer(m.start.x, m.start.y);
    G.exitArmed = false;
    R.UI.setArea('루멘 마을');
    R.Season.clearFx();
    R.Audio.playBgm(0);
    spawnPet();
    R.saveGame();
  };

  // 지역 번호로 들어가면 그 지역의 보스 던전 (숨겨진 던전은 6)
  R.enterRegion = function (id, diffIdx) { R.enterDungeon(id === 6 ? 6 : R.finalDungeon(id).did, diffIdx); };
  R.enterDungeon = function (did, diffIdx) {
    const s = G.save, region = did === 6 ? R.HIDDEN_REGION : R.dungeonById(did);
    const id = region.id;
    const di = diffIdx == null ? s.diff || 0 : diffIdx;
    clearWorld();
    G.map = R.buildDungeon(region);
    const m = G.map;
    G.dungeon = { region, hasKey: false, gateOpen: false, switchOn: false, spawns: [], rockT: 6, diff: R.DIFFICULTY[di], diffIdx: di, mod: null };
    if (!di && (region.final || region.hidden ? s.cleared[id] : (s.dclear || {})[did])) R.openGate();
    const rnd = Math.random;
    const chain = m.rooms.filter((r) => !r.boss);
    for (const sp of m.spawns) {
      const k = sp.room.key ? m.nChain : Math.max(1, chain.indexOf(sp.room));
      G.dungeon.spawns.push({ sp, k, mob: spawnAt(region, sp, k, rnd), t: 0 });
    }
    R.spawnMob(region.boss, region.bossLv, m.bossSpawn.x, m.bossSpawn.y, { boss: true });
    placePlayer(m.start.x, m.start.y);
    rollEvents(region);
    const dn = di ? ` · ${R.DIFFICULTY[di].name}` : '';
    R.UI.setArea(region.hidden ? `숨겨진 던전 · ${region.name}${dn}` : `${region.regionName} · ${region.name}${dn}`);
    R.UI.banner(region.name + dn, di ? R.DIFFICULTY[di].color : '#ffe9a8', region.gimmickText);
    R.Audio.playBgm(1 + region.bgm);
    spawnPet();
    if (!s.flags.firstDungeon) {
      s.flags.firstDungeon = true;
      setTimeout(() => R.toast('푸른 포털 위에서 [귀환]하면 마을로 돌아갑니다', '#9ad8ff'), 2400);
    }
    R.saveGame();
  };

  // ─── 심연의 탑 ───────────────────────────────────────
  const TOWER_THEMES = ['forest', 'ruins', 'mine', 'ice', 'hell'];
  R.towerRegion = function (f) {
    const band = Math.min(4, Math.floor((f - 1) / 10));
    const src = R.REGIONS[band];
    const lv = 6 + f;
    return { id: 0, name: '심연의 탑', theme: TOWER_THEMES[band], lv: [lv, lv], gimmick: 'none', monsters: src.monsters, boss: src.boss, bossLv: lv + 2, bgm: src.bgm, tower: true };
  };
  R.enterTower = function (floor) {
    const s = G.save, f = Math.max(1, Math.min(R.TOWER_FLOORS, floor));
    const region = R.towerRegion(f);
    clearWorld();
    G.map = R.buildArena(f, region.theme);
    const m = G.map;
    const mod = R.towerMod(f);
    G.dungeon = { region, tower: true, floor: f, mod, diff: R.DIFFICULTY[0], diffIdx: 0, spawns: [], rockT: 99, gateOpen: true, cleared: false, waveT: 1.2 };
    placePlayer(m.start.x, m.start.y);
    R.UI.setArea(`심연의 탑 ${f}층`);
    R.UI.banner(`심연의 탑 ${f}층`, '#c9a2ff', f % 10 === 0 ? '수호자가 기다리고 있다' : mod ? `제한: ${mod.name} — ${mod.desc}` : '모든 적을 쓰러뜨려라');
    R.Audio.playBgm(1 + region.bgm);
    spawnPet();
    R.saveGame();
  };
  function towerWave() {
    const d = G.dungeon, m = G.map, f = d.floor, rg = d.region;
    if (f % 10 === 0) {
      R.spawnMob(rg.boss, rg.bossLv, m.bossSpawn.x, m.bossSpawn.y, { boss: true });
      return;
    }
    const n = 5 + Math.floor(f / 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, rr = 50 + Math.random() * 30;
      const x = m.center.x + Math.cos(a) * rr, y = m.center.y - 10 + Math.sin(a) * rr * 0.8;
      const id = rg.monsters[(Math.random() * rg.monsters.length) | 0];
      const elite = (d.mod && d.mod.id === 'elite') || (i === 0 && f % 5 === 0);
      const bad = G.map.solidAt(x, y);
      R.spawnMob(id, rg.lv[0], bad ? m.center.x : x, bad ? m.center.y - 30 : y, { elite });
    }
  }
  function updateTower(dt) {
    const d = G.dungeon;
    if (d.waveT > 0) { d.waveT -= dt; if (d.waveT <= 0) { towerWave(); d.spawned = true; } return; }
    if (d.cleared || !d.spawned) return;
    if (G.mobs.some((m) => !m.dead && !m.summoned)) return;
    d.cleared = true;
    const s = G.save, f = d.floor;
    const first = f > (s.tower.best || 0);
    if (first) s.tower.best = f;
    R.Quest.onEvent('tower', f);
    const gems = first ? 10 + f + (f % 10 === 0 ? 100 : 0) : 0;
    const coins = 2 + Math.floor(f / 5);
    if (gems) R.Prog.addGems(gems);
    R.Prog.addCoins(coins, true);
    s.gold += 40 * f;
    R.UI.banner(`${f}층 돌파!`, '#c9a2ff', `${gems ? `💎 ${gems} · ` : ''}🪙 ${coins} · 골드 ${40 * f}${f >= R.TOWER_FLOORS ? ' · 탑 정복!' : ''}`);
    R.sfx('levelup');
    R.saveGame();
  }

  // ─── 펫 ──────────────────────────────────────────────
  function spawnPet() {
    const id = G.save.pet, p = G.player;
    if (!id || !p) { G.pet = null; return; }
    const fr = R.SHEET && R.SHEET.frames[id];
    G.pet = { id, sk: id, ss: 0.5, def: R.MONSTERS[id] || {}, x: p.x - 14, y: p.y + 4, vx: 0, vy: 0, dir: 1, face: 1, state: 'idle', hh: fr ? (fr.h / 3) * 0.5 : 8, pet: true, t: 0, anim: 0, r: 4, z: 0, status: {}, stunT: 0, flash: 0, downT: 0, act: null, dead: false, elite: false };
  }
  R.spawnPet = spawnPet;
  // 펫: 플레이어가 지나온 칸을 따라 상하좌우로 걷는다
  function updatePet(dt) {
    const pt = G.pet, p = G.player;
    if (!pt || !p) return;
    pt.t += dt; pt.anim += dt;
    if (p.step) pt.tgt = [R.Grid.cx(p.px), R.Grid.cy(p.py)];
    if (!pt.tgt) pt.tgt = [p.x - 16, p.y];
    let [tx, ty] = pt.tgt;
    if (Math.hypot(tx - pt.x, ty - pt.y) > 90) { pt.x = tx; pt.y = ty; }
    const sp = (p.st ? p.st.moveSpd : 60) * 1.15 * dt;
    const ox = pt.x, oy = pt.y;
    if (Math.abs(tx - pt.x) > 0.5) pt.x += Math.sign(tx - pt.x) * Math.min(sp, Math.abs(tx - pt.x));
    else if (Math.abs(ty - pt.y) > 0.5) pt.y += Math.sign(ty - pt.y) * Math.min(sp, Math.abs(ty - pt.y));
    pt.vx = (pt.x - ox) / Math.max(dt, 1e-3); pt.vy = (pt.y - oy) / Math.max(dt, 1e-3);
    if (Math.abs(pt.vx) > 4) pt.dir = pt.face = pt.vx > 0 ? 1 : -1;
    pt.state = Math.abs(pt.vx) + Math.abs(pt.vy) > 8 ? 'walk' : 'idle';
  }


  function spawnAt(region, sp, k, rnd) {
    const [lo, hi] = region.lv, n = Math.max(2, (G.map.nChain || 4) - 1);
    let lv = Math.round(lo + ((hi - lo) * (k - 1)) / n) - (rnd() < 0.5 ? 1 : 0);
    lv = Math.max(lo, Math.min(hi, lv));
    const pool = region.monsters;
    const id = pool[Math.floor(rnd() * Math.min(pool.length, 1 + k))];
    return R.spawnMob(id, sp.elite ? hi : lv, sp.x, sp.y, { elite: !!sp.elite, spawn: sp });
  }

  R.revive = function (inPlace) {
    const p = G.player;
    p.dead = false; p.state = 'idle'; p.status = {};
    if (inPlace) {
      p.hp = p.st.maxHp * 0.5; p.mp = p.st.maxMp * 0.5; p.iframes = 2;
      R.fx.push({ type: 'ring', x: p.x, y: p.y - 8, r0: 4, r1: 36, life: 0.5, max: 0.5, color: '#ffffff', w: 3 });
      R.toast('부활석의 힘으로 다시 일어섰다!', '#7fffa0');
    } else {
      p.hp = p.st.maxHp; p.mp = p.st.maxMp; p.iframes = 1;
      R.enterTown(false);
      R.toast('루멘 마을에서 눈을 떴다…', '#e8e0d0');
    }
  };

  // ─── 던전 진행: 리스폰, 낙석 ─────────────────────────
  function updateDungeon(dt) {
    const d = G.dungeon;
    if (!d) return;
    if (d.tower) { G.mobs = G.mobs.filter((m) => !m.dead || m.deathT < 0.5); updateTower(dt); return; }
    const p = G.player;
    for (const e of d.spawns) {
      if (!e.mob.dead) continue;
      e.t += dt;
      if (e.t > (e.sp.elite ? 60 : 28) && Math.hypot(p.x - e.sp.x, p.y - e.sp.y) > 170) {
        e.t = 0;
        e.mob = spawnAt(d.region, e.sp, e.k, Math.random);
      }
    }
    G.mobs = G.mobs.filter((m) => !m.dead || m.deathT < 0.5);
    if (G.map.cart) updateCart(dt);
    if (d.region.gimmick === 'rocks' && !p.dead) {
      const inStart = G.map.tileAt(p.x, p.y) !== undefined && G.map.rooms[0] && pointInRoom(p, G.map.rooms[0]);
      d.rockT -= dt;
      if (d.rockT <= 0) {
        d.rockT = 2.5 + Math.random() * 3;
        if (!inStart) {
          const lv = d.region.lv[0] + 4;
          R.tele({ x: p.x + (Math.random() - 0.5) * 24 + p.vx * 0.5, y: p.y + (Math.random() - 0.5) * 16 + p.vy * 0.5, r: 14, t: 1.1, dmg: 14 + lv * 6, elem: 'NONE', fx: 'rock' });
        }
      }
    }
  }
  // ─── 광차: 레버를 당기면 선로 끝까지 질주 (잔해 파괴, 경로상 적·플레이어 타격) ───
  function updateCart(dt) {
    const m = G.map, c = m.cart, rl = m.rail, p = G.player;
    if (!c.moving) return;
    c.v = Math.min(200, c.v + 260 * dt);
    c.x += c.dir * c.v * dt;
    const front = Math.floor((c.x + c.dir * 9) / TS);
    if (m.get(front, rl.y) === R.T.BLOCK) {
      for (let j = -1; j <= 1; j++) m.set(front, rl.y + j, j === 0 ? R.T.RAIL : R.T.FLOOR);
      c.v *= 0.55;
      G.shake = 7; R.sfx('boom');
      for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90; R.fx.push({ type: 'dust', x: front * TS + 8, y: rl.y * TS + 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.6, max: 0.6, color: i % 2 ? '#7a6a5e' : '#c8b8a0', size: 2 }); }
      if (m.get(rl.rubble, rl.y) !== R.T.BLOCK && m.get(rl.rubble - rl.sx, rl.y) !== R.T.BLOCK) R.toast('쾅! 무너진 갱도가 뚫렸다', '#ffe070');
    }
    for (const mob of G.mobs) {
      if (mob.dead || mob.hidden || mob.boss || c.hit.has(mob)) continue;
      if (Math.abs(mob.x - c.x) < mob.r + 9 && Math.abs(mob.y - c.y) < 12) {
        c.hit.add(mob);
        mob.hp = Math.max(1, mob.hp - mob.maxHp * 0.35); // 광차는 몬스터 최대 HP의 35% + 강타
        R.hitMob(mob, { rate: 5, elem: 'NONE', down: true, stun: 1.5 }, c.x - c.dir * 12, c.y);
      }
    }
    if (!p.dead && !c.hitP && Math.abs(p.x - c.x) < 10 && Math.abs(p.y - c.y) < 9) {
      c.hitP = true;
      const lv = G.dungeon.region.lv[0];
      R.hurtPlayer(40 + lv * 10, 'NONE', { knock: p.y < c.y ? -Math.PI / 2 : Math.PI / 2 });
    }
    const end = c.dir === rl.sx ? rl.x1 : rl.x0;
    if ((c.x - (end * TS + 8)) * c.dir >= 0) {
      c.x = end * TS + 8; c.moving = false; c.v = 0; c.dir = -c.dir;
      G.shake = Math.max(G.shake, 2); R.sfx('gate');
    }
  }
  const pointInRoom = (p, r) => p.x / TS >= r.x && p.x / TS < r.x + r.w && p.y / TS >= r.y && p.y / TS < r.y + r.h;

  // ─── 상호작용 ────────────────────────────────────────
  function updateInteract() {
    const p = G.player, m = G.map;
    G.interact = null;
    if (p.dead) return;
    let best = 24;
    for (const n of m.npcs) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < 34) n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 'right' : 'left') : p.y > n.y ? 'down' : 'up';
      else n.dir = 'down';
      if (d < best) { best = d; G.interact = { kind: 'npc', npc: n, x: n.x, y: n.y, label: '💬 대화', h: 30 }; }
    }
    for (const c of m.chests) {
      if (c.open) continue;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < best) { best = d; G.interact = { kind: 'chest', chest: c, x: c.x, y: c.y, label: '📦 열기', h: 16 }; }
    }
    for (const sh of m.shrines || []) {
      if (sh.used) continue;
      const d = Math.hypot(sh.x - p.x, sh.y - p.y);
      if (d < 22 && d < best) { best = d; G.interact = { kind: 'shrine', shrine: sh, x: sh.x, y: sh.y, label: `${sh.type.icon} ${sh.type.name}`, h: 24 }; }
    }
    if (m.lever && !m.cart.moving) {
      const d = Math.hypot(m.lever.x - p.x, m.lever.y - p.y);
      if (d < 20 && d < best) { best = d; G.interact = { kind: 'lever', x: m.lever.x, y: m.lever.y, label: '⚙ 레버 당기기', h: 16 }; }
    }
    for (const n of m.nodes || []) {
      if (n.done) continue;
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < 20 && d < best) { best = d; G.interact = { kind: 'gather', node: n, x: n.x, y: n.y, label: `${R.GATHER[n.type].icon} 채집`, h: 12 }; }
    }
    const dg = G.dungeon;
    if (dg && dg.tower && dg.cleared && m.center) {
      const d = Math.hypot(m.center.x - p.x, m.center.y - p.y);
      if (d < 26 && d < best) { best = d; G.interact = { kind: 'nextfloor', x: m.center.x, y: m.center.y, label: dg.floor >= R.TOWER_FLOORS ? '🏆 정상' : `⬆ ${dg.floor + 1}층`, h: 14 }; }
    }
    if (m.portal) {
      const px = m.portal.x * TS + 8, py = m.portal.y * TS + 8;
      const d = Math.hypot(px - p.x, py - p.y);
      if (d < 16 && d < best) { best = d; G.interact = { kind: 'portal', x: px, y: py, label: '🌀 마을 귀환', h: 14 }; }
    }
    if (m.gate && !G.dungeon.gateOpen) {
      const gx = (m.gate.x + 1.5) * TS, gy = (m.gate.y + 1) * TS;
      const d = Math.hypot(gx - p.x, gy - p.y);
      if (d < 30 && d < best + 10) G.interact = { kind: 'gate', x: gx, y: gy - 4, label: G.dungeon.hasKey ? '🔑 열쇠 사용' : '🔒 잠김', h: 26 };
    }
    // 마을 남문
    if (m.kind === 'town') {
      const onExit = m.tileAt(p.x, p.y) === R.T.EXIT;
      if (onExit && G.exitArmed && !R.UI.isOpen()) { G.exitArmed = false; R.UI.regionSelect(); }
      if (!onExit) G.exitArmed = true;
      if (p.y > (m.h - 4) * TS && Math.abs(p.x - 13 * TS) < 24 && !G.interact) G.interact = { kind: 'exit', x: 13 * TS, y: (m.h - 2) * TS, label: '🗺 출발', h: 6 };
    }
  }

  function doInteract() {
    const it = G.interact;
    if (!it) return;
    R.sfx('ui');
    if (it.kind === 'npc') R.NPC_TALK[it.npc.id](it.npc);
    else if (it.kind === 'chest') openChest(it.chest);
    else if (it.kind === 'shrine') useShrine(it.shrine);
    else if (it.kind === 'portal') R.enterTown();
    else if (it.kind === 'gather') gather(it.node);
    else if (it.kind === 'lever') {
      const m = G.map, c = m.cart;
      if (Math.abs(c.x - m.lever.x) > 20) {
        // 광차가 반대편 끝에 있으면 선로를 전환해 되돌려 보낸다
        R.toast('선로 전환! 광차가 되돌아온다', '#ffd35a');
      } else R.toast('덜컹! 광차가 달리기 시작했다 — 선로에서 비켜서라', '#ffd35a');
      m.lever.on = !m.lever.on; c.moving = true; c.v = 40; c.hit = new Set(); c.hitP = false;
      R.sfx('gate');
    }
    else if (it.kind === 'nextfloor') {
      if (G.dungeon.floor >= R.TOWER_FLOORS) R.toast('심연의 탑 정상. 더 오를 곳이 없다', '#c9a2ff');
      else R.enterTower(G.dungeon.floor + 1);
    }
    else if (it.kind === 'exit') R.UI.regionSelect();
    else if (it.kind === 'gate') {
      if (G.dungeon.hasKey) { R.openGate(); R.sfx('gate'); R.toast('육중한 문이 열렸다. 강한 기운이 느껴진다…', '#ffb0a0'); }
      else R.toast(G.dungeon.region.gimmick === 'switch' ? '잠겨 있다. 어딘가의 압력 스위치를 찾아보자' : '굳게 잠긴 문이다. 열쇠가 필요하다', '#ff8a8a');
    }
  }

  function gather(n) {
    n.done = true;
    const k = 1 + ((Math.random() * 3) | 0), s = G.save, g = R.GATHER[n.type];
    s.bag[n.type] = (s.bag[n.type] || 0) + k;
    R.Quest.onEvent('gather', n.type, k);
    R.Ach.add('gathers');
    R.sfx('pickup');
    R.addNum(n.x, n.y - 14, `${g.name} +${k}`, '#b8f0a0', 0.9);
    for (let i = 0; i < 8; i++) R.fx.push({ type: 'dust', x: n.x, y: n.y - 4, vx: (Math.random() - 0.5) * 50, vy: -30 - Math.random() * 40, life: 0.5, max: 0.5, color: n.type === 'ore' ? '#c8c0b0' : n.type === 'herb' ? '#7ad86a' : '#e89a7a', size: 2 });
  }

  // ─── 던전 이벤트: 보너스 상자(미믹), 축복의 제단, 황금 고블린 ───
  function freeTile(room) {
    const m = G.map;
    for (let i = 0; i < 40; i++) {
      const tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2)), ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (m.get(tx, ty) !== R.T.FLOOR || R.Grid.blocked(tx, ty, null)) continue;
      if ((m.shrines || []).some((o) => o.tx === tx && o.ty === ty)) continue;
      if (m.portal && Math.abs(m.portal.x - tx) + Math.abs(m.portal.y - ty) < 3) continue;
      return [tx, ty];
    }
    return null;
  }
  function rollEvents(region) {
    const m = G.map, E = R.DUNGEON_EVENTS, TS = R.TILE;
    const rooms = m.rooms.filter((r) => !r.boss).slice(1);   // 시작방 제외
    if (!rooms.length) return;
    const pick = () => rooms[Math.floor(Math.random() * rooms.length)];
    m.shrines = [];
    const n = E.bonusChests[0] + (Math.random() < 0.5 ? E.bonusChests[1] - E.bonusChests[0] : 0);
    for (let i = 0; i < n; i++) {
      const t = freeTile(pick());
      if (t) m.chests.push({ x: t[0] * TS + 8, y: t[1] * TS + 12, r: 7, open: false, bonus: true, mimic: Math.random() < E.mimicChance, ph: Math.random() * 9 });
    }
    if (Math.random() < E.shrineChance) {
      const t = freeTile(pick());
      if (t) m.shrines.push({ tx: t[0], ty: t[1], x: t[0] * TS + 8, y: t[1] * TS + 12, type: R.SHRINES[Math.floor(Math.random() * R.SHRINES.length)], used: false });
    }
    if (Math.random() < E.goblinChance) {
      const t = freeTile(rooms[rooms.length - 1 - Math.floor(Math.random() * Math.min(2, rooms.length))]);
      if (t) {
        R.spawnMob('gold_goblin', region.lv[1], t[0] * TS + 8, t[1] * TS + 12, {});
        setTimeout(() => G.map === m && R.toast('💰 어디선가 짤랑거리는 소리가 들린다…', '#ffd35a'), 1800);
      }
    }
  }
  R.rollEvents = rollEvents;

  function useShrine(sh) {
    sh.used = true;
    const b = sh.type;
    R.addBuff(G.player, b.name, R.SHRINE_DUR, b.mods, b.color);
    R.Quest.onEvent('shrine');
    R.Ach.add('shrines');
    R.sfx('rare');
    R.UI.banner(`${b.icon} ${b.name}`, b.color, `${R.SHRINE_DUR}초간 ${b.desc}`);
    for (let i = 0; i < 16; i++) R.fx.push({ type: 'dust', x: sh.x, y: sh.y - 14, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 50, life: 0.8, max: 0.8, color: b.color, size: 2, nograv: true });
  }

  function openChest(c) {
    if (c.mimic) {
      // 미믹! 상자가 이빨을 드러낸다
      G.map.chests.splice(G.map.chests.indexOf(c), 1);
      const rg = G.dungeon.region;
      const mm = R.spawnMob('mimic', rg.lv[1], c.x, c.y, { elite: true });
      mm.ai = 'CHASE'; mm.aggro = true; mm.atkCd = 0.6;
      R.sfx('roar'); G.shake = Math.max(G.shake, 5);
      R.UI.banner('📦 미믹이다!', '#ff6a5a', '상자가 이빨을 드러냈다 — 쓰러뜨리면 진짜 보물이!');
      return;
    }
    c.open = true;
    if (c.bonus) {
      R.sfx('rare');
      const rg = G.dungeon.region;
      R.dropAt(c.x, c.y, { kind: 'gold', v: 12 * rg.id * rg.id + 20 });
      R.dropAt(c.x, c.y, { kind: 'item', item: R.randomDrop(rg.lv[1], R.rollGrade(0.3, 0)) });
      R.dropAt(c.x, c.y, { kind: 'potion', id: Math.random() < 0.5 ? 'hpPotion' : 'mpPotion', n: 1 });
      if (Math.random() < 0.4) R.dropAt(c.x, c.y, { kind: 'mat', id: rg.lv[1] >= 20 ? 'stone' : 'iron', n: 1 + (Math.random() * 2 | 0) });
      return;
    }
    R.sfx('rare');
    const s = G.save, rg = G.dungeon.region;
    if (c.key) { G.dungeon.hasKey = true; R.toast('🔑 보스방 열쇠를 얻었다!', '#ffe070'); }
    R.dropAt(c.x, c.y, { kind: 'gold', v: 30 * rg.id * rg.id });
    R.dropAt(c.x, c.y, { kind: 'item', item: R.randomDrop(rg.lv[1], R.rollGrade(0.5, 1)) });
    R.dropAt(c.x, c.y, { kind: 'potion', id: 'hpPotion', n: 2 });
    for (let i = 0; i < 12; i++) R.fx.push({ type: 'dust', x: c.x, y: c.y - 6, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60, life: 0.7, max: 0.7, color: i % 2 ? '#ffe070' : '#ffffff', size: 2 });
    void s;
  }

  // ─── 메인 루프 ───────────────────────────────────────
  function tick(dt, live) {
    if (G.hitstop > 0) G.hitstop -= dt;
    else {
      R.updatePlayer(dt);
      if (live) consumeInput();
      R.updateMobs(dt);
      R.updateShots(dt);
      R.updateTeles(dt);
      R.updateDrops(dt);
      R.updateStreak(dt);
      updatePet(dt);
      updateDungeon(dt);
      updateInteract();
    }
    R.updateFx(dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.map.explore(G.player.x, G.player.y, 6);
  }

  let last = performance.now(), mmT = 0, saveT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    G.rdt = dt;
    if (G.state === 'play' && G.map) {
      R.UI.updateDialog(dt);
      const paused = R.UI.isOpen();
      readInput(dt);
      if (!paused) {
        G.time += dt;
        G.save.playTime += dt;
        if (buf.act > 0 || (inp.atkPressed && G.interact && G.interact.kind !== 'gate')) { buf.act = 0; buf.atk = 0; doInteract(); }
        if (G.tapInteract) { G.tapInteract = false; if (G.interact) doInteract(); }
        tick(dt, true);
        saveT += dt;
        if (saveT > 20) { saveT = 0; R.saveGame(); }
      } else inp.atkHeld = false;
      R.render(ctx);
      R.UI.updateHUD();
      mmT -= dt;
      if (mmT <= 0) { mmT = 0.2; R.UI.drawMinimap(); if ((G.achT = (G.achT || 0) + 1) % 5 === 0) R.Ach.check(); }
    }
    requestAnimationFrame(frame);
  }

  // ─── 화면 흐름 ───────────────────────────────────────
  function startPlay() {
    $('title').classList.add('hidden');
    $('select').classList.add('hidden');
    $('story').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('controls').classList.remove('hidden');
    G.state = 'play';
    G.player = null;
    R.UI.resetHudCache();
    R.UI.setSkillButtons();
  }
  R.toTitle = function () {
    R.saveGame();
    G.state = 'title';
    G.map = null;
    $('hud').classList.add('hidden');
    $('controls').classList.add('hidden');
    $('dialog').classList.add('hidden');
    R.Audio.stopBgm();
    R.UI.showTitle();
  };

  $('btn-new').onclick = () => {
    R.Audio.unlock(); R.sfx('ui');
    R.UI.showSelect();
  };
  $('btn-back').onclick = () => { R.sfx('ui'); R.UI.showTitle(); };
  $('btn-continue').onclick = () => {
    R.Audio.unlock(); R.sfx('ui');
    const s = loadSave();
    if (!s) { R.toast('저장 데이터를 불러올 수 없습니다', '#ff8a8a'); return; }
    G.save = s;
    startPlay();
    R.enterTown(false);
    R.toast(`다시 오셨군요, ${R.CLASSES[s.cls].name}님`, '#ffe9a8');
  };
  $('btn-start').onclick = () => {
    R.Audio.unlock(); R.sfx('ui');
    const cls = R.UI.selectedClass();
    $('select').classList.add('hidden');
    G.save = newSave(cls);
    R.UI.story(R.PROLOGUE, () => {
      startPlay();
      R.enterTown(false);
      R.UI.banner('루멘 마을', '#ffe9a8', '촌장 엘든에게 말을 걸어 보자');
      setTimeout(() => R.toast('왼쪽 드래그·방향키로 이동 · 화면을 누르면 그곳으로 이동, 몬스터를 누르면 자동 공격', '#9ad8ff'), 2500);
    });
  };

  R.UI.showTitle();
  requestAnimationFrame(frame);
  // 디버그/테스트용 훅
  window.RELIC = { G, R, newSave, tick: (dt) => tick(dt, false), startPlay, doInteract, openChest, gather };
})();
