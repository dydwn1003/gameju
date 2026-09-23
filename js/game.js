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
      quests: [], mainIdx: 0, unlocked: 1, cleared: {}, codex: {}, flags: {}, favor: {}, honor: 0,
      hp: null, mp: null, playTime: 0,
      gems: 300, coins: 0, sp: 0, skillLv: {}, runes: {}, pity: 0, itemDex: {}, summons: 0,
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
      const d = newSave(s.cls);
      for (const k in d) if (s[k] === undefined) s[k] = d[k];
      if (!s.spInit) { s.sp = (s.sp || 0) + (s.level - 1); s.spInit = true; } // 이전 버전 저장 데이터: 레벨만큼 SP 지급
      return s;
    } catch (e) { return null; }
  }
  R.deleteSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } };

  // ─── 입력 ────────────────────────────────────────────
  const inp = (G.input = { move: { x: 0, y: 0 }, moving: false, atkHeld: false, atkPressed: false, skillPressed: [false, false], dodgePressed: false, potionPressed: false });
  const buf = { atk: 0, s0: 0, s1: 0, dodge: 0, pot: 0, act: 0 };
  const keys = new Set();
  const stick = { x: 0, y: 0, id: null };

  const KEYMAP = {
    KeyJ: 'atk', KeyZ: 'atk', KeyK: 's0', KeyX: 's0', KeyL: 's1', KeyC: 's1', Space: 'dodge', ShiftLeft: 'dodge', KeyQ: 'pot', KeyE: 'act', Enter: 'act',
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
  bindBtn('btn-dodge', () => { buf.dodge = 0.25; });
  bindBtn('btn-pot', () => { buf.pot = 0.25; });
  bindBtn('btn-act', () => { buf.act = 0.25; });
  $('btn-menu').onclick = () => { R.sfx('ui'); if (!G.player.dead) R.UI.openMenu(); };
  $('btn-quest').onclick = () => { R.sfx('ui'); if (!G.player.dead) R.UI.openMenu('퀘스트'); };
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  function readInput(dt) {
    let x = 0, y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x || y) { const d = Math.hypot(x, y); x /= d; y /= d; }
    else { x = stick.x; y = stick.y; }
    inp.move.x = x; inp.move.y = y;
    inp.moving = Math.hypot(x, y) > 0.15;
    inp.atkHeld = atkBtnDown || keys.has('KeyJ') || keys.has('KeyZ');
    for (const k in buf) buf[k] = Math.max(0, buf[k] - dt);
    inp.atkPressed = buf.atk > 0;
    inp.skillPressed[0] = buf.s0 > 0;
    inp.skillPressed[1] = buf.s1 > 0;
    inp.dodgePressed = buf.dodge > 0;
    inp.potionPressed = buf.pot > 0;
  }
  function consumeInput() {
    const p = G.player;
    if (p.state === 'attack' && p.stateT === 0) buf.atk = 0;
    if (p.state === 'skill' && p.stateT === 0) { buf.s0 = 0; buf.s1 = 0; }
    if (p.state === 'dodge' && p.stateT === 0) buf.dodge = 0;
    if (p.potionCd > 0.9) buf.pot = 0;
    if (p.skillCd[0] > 0) buf.s0 = 0;
    if (p.skillCd[1] > 0) buf.s1 = 0;
  }

  // ─── 맵 전환 ─────────────────────────────────────────
  function clearWorld() {
    G.mobs = []; G.shots = []; G.drops = []; G.nums = []; G.teles = [];
    G.fx.length = 0;
    G.combo.count = 0; G.combo.t = 0;
    R.UI.bossBar(null);
  }
  function placePlayer(x, y) {
    if (!G.player) G.player = R.createPlayer(G.save, x, y);
    const p = G.player;
    p.x = x; p.y = y; p.state = 'idle'; p.act = null; p.vx = 0; p.vy = 0;
    G.cam.x = x - R.VIEW_W / 2; G.cam.y = y - R.VIEW_H / 2;
  }

  R.enterTown = function (fromGate = true) {
    clearWorld();
    G.map = R.buildTown();
    G.dungeon = null;
    const m = G.map;
    if (fromGate && G.player) placePlayer(13 * TS, (m.h - 4) * TS);
    else placePlayer(m.start.x, m.start.y);
    G.exitArmed = false;
    R.UI.setArea('루멘 마을');
    R.Audio.playBgm(0);
    R.saveGame();
  };

  R.enterRegion = function (id) {
    const s = G.save, region = R.REGIONS[id - 1];
    clearWorld();
    G.map = R.buildDungeon(region);
    const m = G.map;
    G.dungeon = { region, hasKey: false, gateOpen: false, switchOn: false, spawns: [], rockT: 6 };
    if (s.cleared[id]) R.openGate();
    const rnd = Math.random;
    const chain = m.rooms.filter((r) => !r.boss);
    for (const sp of m.spawns) {
      const k = sp.room.key ? 4 : Math.max(1, chain.indexOf(sp.room));
      G.dungeon.spawns.push({ sp, k, mob: spawnAt(region, sp, k, rnd), t: 0 });
    }
    R.spawnMob(region.boss, region.bossLv, m.bossSpawn.x, m.bossSpawn.y, { boss: true });
    placePlayer(m.start.x, m.start.y);
    R.UI.setArea(`${region.id}지역 · ${region.name}`);
    R.UI.banner(region.name, '#ffe9a8', region.gimmickText);
    R.Audio.playBgm(1 + region.bgm);
    if (!s.flags.firstDungeon) {
      s.flags.firstDungeon = true;
      setTimeout(() => R.toast('푸른 포털 위에서 [귀환]하면 마을로 돌아갑니다', '#9ad8ff'), 2400);
    }
    R.saveGame();
  };

  function spawnAt(region, sp, k, rnd) {
    const [lo, hi] = region.lv;
    let lv = Math.round(lo + ((hi - lo) * (k - 1)) / 3) - (rnd() < 0.5 ? 1 : 0);
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
    else if (it.kind === 'portal') R.enterTown();
    else if (it.kind === 'exit') R.UI.regionSelect();
    else if (it.kind === 'gate') {
      if (G.dungeon.hasKey) { R.openGate(); R.sfx('gate'); R.toast('육중한 문이 열렸다. 강한 기운이 느껴진다…', '#ffb0a0'); }
      else R.toast(G.dungeon.region.gimmick === 'switch' ? '잠겨 있다. 어딘가의 압력 스위치를 찾아보자' : '굳게 잠긴 문이다. 열쇠가 필요하다', '#ff8a8a');
    }
  }

  function openChest(c) {
    c.open = true;
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
        tick(dt, true);
        saveT += dt;
        if (saveT > 20) { saveT = 0; R.saveGame(); }
      } else inp.atkHeld = false;
      R.render(ctx);
      R.UI.updateHUD();
      mmT -= dt;
      if (mmT <= 0) { mmT = 0.2; R.UI.drawMinimap(); }
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
      setTimeout(() => R.toast('왼쪽을 드래그해 이동 · NPC 근처에서 [대화]', '#9ad8ff'), 2500);
    });
  };

  R.UI.showTitle();
  requestAnimationFrame(frame);
  // 디버그/테스트용 훅
  window.RELIC = { G, R, newSave, tick: (dt) => tick(dt, false), startPlay, doInteract, openChest };
})();
