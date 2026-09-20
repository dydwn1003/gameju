(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // Setup / DOM
  // ---------------------------------------------------------------------
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const hud = document.getElementById('hud');
  const hpFill = document.getElementById('hp-fill');
  const xpFill = document.getElementById('xp-fill');
  const hudLevel = document.getElementById('hud-level');
  const hudStage = document.getElementById('hud-stage');
  const hudTimer = document.getElementById('hud-timer');
  const hudKills = document.getElementById('hud-kills');
  const weaponIconsEl = document.getElementById('weapon-icons');
  const stageBannerEl = document.getElementById('stage-banner');

  const joystick = document.getElementById('joystick');
  const joystickStick = document.getElementById('joystick-stick');

  const startScreen = document.getElementById('start-screen');
  const btnStart = document.getElementById('btn-start');
  const leaderboardStart = document.getElementById('leaderboard-start');

  const levelupScreen = document.getElementById('levelup-screen');
  const upgradeCardsEl = document.getElementById('upgrade-cards');

  const gameoverScreen = document.getElementById('gameover-screen');
  const finalScoreEl = document.getElementById('final-score');
  const finalLevelEl = document.getElementById('final-level');
  const finalTimeEl = document.getElementById('final-time');
  const finalKillsEl = document.getElementById('final-kills');
  const nameInput = document.getElementById('name-input');
  const btnSaveScore = document.getElementById('btn-save-score');
  const leaderboardGameover = document.getElementById('leaderboard-gameover');
  const btnRetry = document.getElementById('btn-retry');

  const LB_KEY = 'pixelSurvivorLeaderboard';
  const NAME_KEY = 'pixelSurvivorName';

  // ---------------------------------------------------------------------
  // Canvas sizing
  // ---------------------------------------------------------------------
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------------
  // Pixel sprites (drawn once to an offscreen canvas, then blitted)
  // ---------------------------------------------------------------------
  const HUMANOID_SPRITE = [
    '....OOOO....',
    '...OCCCCO...',
    '..OCCCCCCO..',
    '..OHHHHHHO..',
    '..OHHHHHHO..',
    '...OHHHHO...',
    '..OOBBBBOO..',
    'AOOBBBBBBOO.',
    'AOOBBBBBBOO.',
    '..OBBBBBBO..',
    '..OOLLLLOO..',
    '..OLL..LLO..',
    '..OLL..LLO..',
    '..OO....OO..',
  ];

  const SLIME_SPRITE = [
    '...OOOO...',
    '..OCCCCO..',
    '.OCCEECCO.',
    'OCCCCCCCCO',
    'OCCCCCCCCO',
    '.OCCCCCCO.',
    '..OCCCCO..',
    '...OOOO...',
  ];

  const BAT_SPRITE = [
    '..O....O..',
    '.OW....WO.',
    'OWWO..OWWO',
    '.OOBBBBOO.',
    '..OEBBEO..',
    '..OBBBBO..',
    '...OOOO...',
  ];

  const GRIDS = { humanoid: HUMANOID_SPRITE, slime: SLIME_SPRITE, bat: BAT_SPRITE };

  const PAL_PLAYER = { O: '#0c0c14', C: '#2c4fa0', H: '#f1c27d', B: '#3a6cc9', A: '#232336', L: '#20223a' };
  const PAL_ZOMBIE = { O: '#0a1a0a', C: '#355c2a', H: '#8fd66b', B: '#3f7d3a', A: '#22331f', L: '#1c2b19' };
  const PAL_RUNNER = { O: '#1a0a12', C: '#7a3068', H: '#e8a3d0', B: '#a13f8a', A: '#331f2c', L: '#2b1924' };
  const PAL_SKELETON = { O: '#141414', C: '#cfcfcf', H: '#e8e8e0', B: '#9a9a90', A: '#4a3a20', L: '#5a5a52' };
  const PAL_BRUTE = { O: '#1a0505', C: '#7a2222', H: '#e0a3a3', B: '#b23b3b', A: '#331414', L: '#2b1414' };
  const PAL_GHOST = { O: '#160432', C: '#8a5fd6', H: '#d9c3f5', B: '#8a5fd6', A: '#4a2f80', L: '#8a5fd6' };
  const PAL_BOSS = { O: '#160418', C: '#6a1fb2', H: '#d9a3f5', B: '#6a1fb2', A: '#2a1140', L: '#22103a' };
  const PAL_SLIME_GREEN = { O: '#0a2410', C: '#4caf50', E: '#123018' };
  const PAL_SLIME_BLUE = { O: '#08182a', C: '#3f8ce0', E: '#0a1830' };
  const PAL_BAT_GRAY = { O: '#101018', W: '#3a3a4a', B: '#5a5a6e', E: '#ff4d5e' };
  const PAL_BAT_RED = { O: '#1a0505', W: '#5a1414', B: '#8f2020', E: '#ffd23f' };

  const spriteCache = new Map();
  function getSpriteCanvas(name, grid, palette, scale) {
    const key = `${name}|${scale}`;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const rows = grid.length, cols = grid[0].length;
    const w = Math.ceil(cols * scale), h = Math.ceil(rows * scale);
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d');
    for (let r = 0; r < rows; r++) {
      const row = grid[r];
      for (let c = 0; c < cols; c++) {
        const ch = row[c];
        if (!ch || ch === '.') continue;
        const color = palette[ch];
        if (!color) continue;
        octx.fillStyle = color;
        octx.fillRect(Math.round(c * scale), Math.round(r * scale), Math.ceil(scale), Math.ceil(scale));
      }
    }
    spriteCache.set(key, off);
    return off;
  }

  function drawSpriteCanvas(spriteCanvas, cx, cy, facing, hitFlash, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    if (facing < 0) ctx.scale(-1, 1);
    if (alpha != null && alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(spriteCanvas, -spriteCanvas.width / 2, -spriteCanvas.height / 2);
    if (hitFlash) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(-spriteCanvas.width / 2, -spriteCanvas.height / 2, spriteCanvas.width, spriteCanvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  // Game constants
  // ---------------------------------------------------------------------
  const WORLD_SIZE = 2600;
  const PLAYER_RADIUS = 14;
  const IFRAME_TIME = 0.65;
  const MAX_WEAPON_SLOTS = 4;

  const ENEMY_TYPES = {
    slime: { shape: 'slime', palette: PAL_SLIME_GREEN, hp: 14, speed: 48, damage: 6, radius: 13, scale: 3, score: 8, xp: 1, weight: 10, minStage: 1 },
    blue_slime: { shape: 'slime', palette: PAL_SLIME_BLUE, hp: 30, speed: 42, damage: 9, radius: 15, scale: 3.4, score: 18, xp: 2, weight: 5, minStage: 4 },
    bat: { shape: 'bat', palette: PAL_BAT_GRAY, hp: 8, speed: 130, damage: 5, radius: 10, scale: 2.8, score: 10, xp: 1, weight: 8, minStage: 1, erratic: true },
    red_bat: { shape: 'bat', palette: PAL_BAT_RED, hp: 16, speed: 150, damage: 9, radius: 11, scale: 3.2, score: 20, xp: 2, weight: 4, minStage: 5, erratic: true },
    zombie: { shape: 'humanoid', palette: PAL_ZOMBIE, hp: 22, speed: 58, damage: 7, radius: 14, scale: 3.2, score: 12, xp: 1, weight: 9, minStage: 2 },
    runner: { shape: 'humanoid', palette: PAL_RUNNER, hp: 10, speed: 108, damage: 5, radius: 11, scale: 2.8, score: 14, xp: 1, weight: 7, minStage: 1 },
    skeleton: { shape: 'humanoid', palette: PAL_SKELETON, hp: 16, speed: 46, damage: 6, radius: 13, scale: 3.2, score: 16, xp: 2, weight: 5, minStage: 3, ranged: true, projDamage: 9, projSpeed: 230, fireCooldown: 2.1, fireRange: 420 },
    brute: { shape: 'humanoid', palette: PAL_BRUTE, hp: 110, speed: 46, damage: 18, radius: 22, scale: 5, score: 70, xp: 5, weight: 2, minStage: 4 },
    ghost: { shape: 'humanoid', palette: PAL_GHOST, hp: 70, speed: 95, damage: 14, radius: 17, scale: 3.4, score: 55, xp: 4, weight: 2, minStage: 5, alpha: 0.72 },
    boss: { shape: 'humanoid', palette: PAL_BOSS, hp: 450, speed: 40, damage: 26, radius: 34, scale: 7.5, score: 320, xp: 22, weight: 0, minStage: 2 },
  };

  const STAGES = [
    { threshold: 0, label: '스테이지 1 시작!' },
    { threshold: 30, label: '스테이지 2 시작!' },
    { threshold: 65, label: '스테이지 3 시작! - 스켈레톤 등장' },
    { threshold: 105, label: '스테이지 4 시작! - 브루트 등장' },
    { threshold: 150, label: '스테이지 5 시작! - 고스트 등장' },
    { threshold: 200, label: '스테이지 6 - 지옥 모드' },
  ];

  function currentStageIndex() {
    let idx = 1;
    for (let i = 0; i < STAGES.length; i++) {
      if (elapsed >= STAGES[i].threshold) idx = i + 1;
    }
    return idx;
  }

  function pickEnemyType(stageIdx) {
    const pool = Object.entries(ENEMY_TYPES).filter(([, d]) => d.weight > 0 && d.minStage <= stageIdx);
    const total = pool.reduce((s, [, d]) => s + d.weight, 0);
    let r = Math.random() * total;
    for (const [k, d] of pool) {
      r -= d.weight;
      if (r <= 0) return k;
    }
    return pool[0][0];
  }

  // ---------------------------------------------------------------------
  // Weapons
  // ---------------------------------------------------------------------
  function getScaledStats(def, level, ply) {
    const s = def.stats(level);
    const out = Object.assign({}, s);
    if (out.damage != null) out.damage *= ply.globalDamageMult;
    if (out.cooldown != null) out.cooldown *= ply.globalCooldownMult;
    if (out.range != null) out.range *= ply.globalRangeMult;
    return out;
  }

  function makeBullet(ply, angle, stats) {
    return {
      x: ply.x, y: ply.y,
      vx: Math.cos(angle) * stats.bulletSpeed, vy: Math.sin(angle) * stats.bulletSpeed,
      damage: stats.damage, pierceLeft: stats.pierce || 0,
      life: (stats.range / stats.bulletSpeed) + 0.2,
    };
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx, cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  const WEAPON_DEFS = {
    pistol: {
      name: '피스톨', icon: '🔫', maxLevel: 5,
      stats(level) {
        return {
          damage: 6 + level * 3, cooldown: Math.max(0.18, 0.6 - level * 0.07),
          count: level >= 4 ? 2 : 1, pierce: level >= 5 ? 1 : 0,
          range: 260, bulletSpeed: 440,
        };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `피해 ${Math.round(s.damage)} · 발사간격 ${s.cooldown.toFixed(2)}s${s.count > 1 ? ` · 동시 ${s.count}발` : ''}`;
      },
      fire(stats, ply, target) {
        const baseAngle = Math.atan2(target.y - ply.y, target.x - ply.x);
        const spread = stats.count > 1 ? 0.22 : 0;
        for (let i = 0; i < stats.count; i++) {
          const t = stats.count === 1 ? 0 : (i / (stats.count - 1)) - 0.5;
          bullets.push(makeBullet(ply, baseAngle + t * spread, stats));
        }
      },
    },
    shotgun: {
      name: '샷건', icon: '💥', maxLevel: 5,
      stats(level) {
        return {
          damage: 4 + level * 1.7, cooldown: Math.max(0.55, 1.15 - level * 0.09),
          count: 3 + Math.floor(level / 2), spread: 0.75,
          range: 170, bulletSpeed: 380, pierce: 0,
        };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `펠릿 ${s.count}발 · 피해 ${Math.round(s.damage)} · 근거리 강력`;
      },
      fire(stats, ply, target) {
        const baseAngle = Math.atan2(target.y - ply.y, target.x - ply.x);
        for (let i = 0; i < stats.count; i++) {
          const t = (i / (stats.count - 1)) - 0.5;
          bullets.push(makeBullet(ply, baseAngle + t * stats.spread + (Math.random() - 0.5) * 0.08, stats));
        }
      },
    },
    boomerang: {
      name: '부메랑', icon: '🪃', maxLevel: 5,
      stats(level) {
        return { damage: 5 + level * 2.6, cooldown: Math.max(0.7, 1.4 - level * 0.12), range: 300 + level * 22, bulletSpeed: 320 };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `왕복 관통 · 피해 ${Math.round(s.damage)} · 사거리 ${Math.round(s.range)}`;
      },
      fire(stats, ply, target) {
        const angle = Math.atan2(target.y - ply.y, target.x - ply.x);
        bullets.push({
          kind: 'boomerang', x: ply.x, y: ply.y, startX: ply.x, startY: ply.y, angle,
          dist: 0, maxDist: stats.range, speed: stats.bulletSpeed, damage: stats.damage,
          returning: false, hitSet: new Set(), life: 5.5,
        });
      },
    },
    bomb: {
      name: '폭탄 발사기', icon: '💣', maxLevel: 5,
      stats(level) {
        return { damage: 14 + level * 6.5, cooldown: Math.max(1.1, 2.0 - level * 0.16), range: 280, bulletSpeed: 260, radius: 55 + level * 9, fuse: 0.85 };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `폭발범위 ${Math.round(s.radius)} · 피해 ${Math.round(s.damage)}`;
      },
      fire(stats, ply, target) {
        const angle = Math.atan2(target.y - ply.y, target.x - ply.x);
        bullets.push({
          kind: 'bomb', x: ply.x, y: ply.y, vx: Math.cos(angle) * stats.bulletSpeed, vy: Math.sin(angle) * stats.bulletSpeed,
          damage: stats.damage, radius: stats.radius, fuse: stats.fuse, life: 2.6,
        });
      },
    },
    laser: {
      name: '레이저', icon: '🔴', maxLevel: 5,
      stats(level) {
        return { damage: 9 + level * 4.5, cooldown: Math.max(0.9, 1.7 - level * 0.13), range: 380 + level * 16, width: 6 };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `관통 광선 · 피해 ${Math.round(s.damage)} · 사거리 ${Math.round(s.range)}`;
      },
      fire(stats, ply, target) {
        const angle = Math.atan2(target.y - ply.y, target.x - ply.x);
        const x2 = ply.x + Math.cos(angle) * stats.range;
        const y2 = ply.y + Math.sin(angle) * stats.range;
        effects.push({ kind: 'laser', x1: ply.x, y1: ply.y, x2, y2, width: stats.width, life: 0.18, maxLife: 0.18 });
        for (const en of enemies) {
          if (en.dead) continue;
          if (pointToSegmentDist(en.x, en.y, ply.x, ply.y, x2, y2) < en.radius + stats.width / 2) {
            en.hp -= stats.damage; en.hitFlash = 0.1;
            spawnParticles(en.x, en.y, '#ff5e7a', 3);
            if (en.hp <= 0) en.dead = true;
          }
        }
      },
    },
    orbit: {
      name: '회전 칼날', icon: '⚔️', maxLevel: 5,
      stats(level) {
        return { damage: 5 + level * 2.2, count: Math.min(1 + level, 5), radius: 75, spinSpeed: 2.6, hitCooldown: 0.4 };
      },
      desc(level, ply) {
        const s = getScaledStats(this, level, ply);
        return `칼날 ${s.count}개 · 접촉 피해 ${Math.round(s.damage)}`;
      },
    },
  };

  const STAT_UPGRADES = [
    { id: 'dmg', icon: '⚔️', name: '공격력 강화', desc: () => '모든 무기 피해량 +12%', apply: (p) => { p.globalDamageMult *= 1.12; } },
    { id: 'firerate', icon: '⚡', name: '공격속도 증가', desc: () => '모든 무기 재장전 속도 +10%', apply: (p) => { p.globalCooldownMult *= 0.9; } },
    { id: 'speed', icon: '🥾', name: '이동속도 증가', desc: () => '이동속도 +10%', apply: (p) => { p.speed *= 1.1; } },
    { id: 'maxhp', icon: '❤️', name: '최대 체력 증가', desc: () => '최대 체력 +22, 전체 회복', apply: (p) => { p.maxHp += 22; p.hp = p.maxHp; } },
    { id: 'regen', icon: '💚', name: '체력 재생', desc: () => '초당 체력 재생 +0.6', apply: (p) => { p.regen += 0.6; } },
    { id: 'magnet', icon: '🧲', name: '아이템 획득범위', desc: () => '경험치 자석 범위 +25%', apply: (p) => { p.magnetRadius *= 1.25; } },
    { id: 'range', icon: '📡', name: '사거리 증가', desc: () => '모든 무기 사거리 +12%', apply: (p) => { p.globalRangeMult *= 1.12; } },
  ];

  function buildCardPool() {
    const cards = [];
    if (player.weapons.length < MAX_WEAPON_SLOTS) {
      for (const id of Object.keys(WEAPON_DEFS)) {
        if (player.weapons.some((w) => w.id === id)) continue;
        const def = WEAPON_DEFS[id];
        cards.push({
          icon: def.icon, name: `${def.name} 획득`, desc: def.desc(1, player),
          apply() { player.weapons.push({ id, level: 1 }); player.weaponTimers[id] = 0; },
        });
      }
    }
    for (const w of player.weapons) {
      const def = WEAPON_DEFS[w.id];
      if (w.level < def.maxLevel) {
        cards.push({
          icon: def.icon, name: `${def.name} 강화 (Lv.${w.level + 1})`, desc: def.desc(w.level + 1, player),
          apply() { const found = player.weapons.find((x) => x.id === w.id); found.level += 1; },
        });
      }
    }
    for (const su of STAT_UPGRADES) {
      cards.push({ icon: su.icon, name: su.name, desc: su.desc(), apply() { su.apply(player); } });
    }
    return cards;
  }

  // ---------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------
  let state = 'start'; // start | playing | levelup | gameover
  let player, enemies, bullets, enemyBullets, gems, particles, effects;
  let camera = { x: 0, y: 0 };
  let elapsed = 0;
  let kills = 0;
  let spawnTimer = 0;
  let lastStageIndex = 1;
  let lastPeriodicBossFloor = -1;
  let stageBanner = null;
  let lastWeaponsSig = '';
  let lastTime = 0;
  let keys = new Set();
  let joyVector = { x: 0, y: 0 };
  let joyActive = false;
  let joyTouchId = null;
  let joyOrigin = { x: 0, y: 0 };

  function freshPlayer() {
    return {
      x: WORLD_SIZE / 2, y: WORLD_SIZE / 2,
      hp: 115, maxHp: 115,
      speed: 170,
      regen: 0,
      magnetRadius: 70,
      xp: 0, level: 1, xpToNext: 6,
      facing: 1, iframe: 0,
      weapons: [{ id: 'pistol', level: 1 }],
      weaponTimers: { pistol: 0 },
      globalDamageMult: 1, globalCooldownMult: 1, globalRangeMult: 1,
      orbitAngle: 0, orbitBlades: [],
    };
  }

  function resetGame() {
    player = freshPlayer();
    enemies = [];
    bullets = [];
    enemyBullets = [];
    gems = [];
    particles = [];
    effects = [];
    camera = { x: player.x, y: player.y };
    elapsed = 0;
    kills = 0;
    spawnTimer = 0.6;
    lastStageIndex = 1;
    lastPeriodicBossFloor = -1;
    stageBanner = null;
    lastWeaponsSig = '';
    stageBannerEl.classList.add('hidden');
  }

  // ---------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------
  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(list) {
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 10)));
    } catch (e) { /* ignore storage errors */ }
  }

  function addScore(name, score, level, time) {
    const list = loadLeaderboard();
    list.push({ name: name || 'Player', score, level, time });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 10);
    saveLeaderboard(trimmed);
    return trimmed;
  }

  function formatTime(t) {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderLeaderboard(el, list) {
    el.innerHTML = '';
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'lb-empty';
      li.textContent = '아직 기록이 없습니다';
      el.appendChild(li);
      return;
    }
    list.forEach((entry, i) => {
      const li = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'lb-rank';
      rank.textContent = `${i + 1}.`;
      const name = document.createElement('span');
      name.textContent = entry.name;
      name.style.flex = '1';
      name.style.margin = '0 8px';
      const score = document.createElement('span');
      score.textContent = `${entry.score} (Lv.${entry.level})`;
      li.appendChild(rank);
      li.appendChild(name);
      li.appendChild(score);
      el.appendChild(li);
    });
  }

  function currentScore() {
    return kills * 10 + Math.floor(elapsed) * 2 + player.level * 50;
  }

  // ---------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------
  window.addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  function getKeyboardVector() {
    let x = 0, y = 0;
    if (keys.has('arrowleft') || keys.has('a')) x -= 1;
    if (keys.has('arrowright') || keys.has('d')) x += 1;
    if (keys.has('arrowup') || keys.has('w')) y -= 1;
    if (keys.has('arrowdown') || keys.has('s')) y += 1;
    return { x, y };
  }

  const JOY_RADIUS = 55;

  function handleTouchStart(e) {
    if (state !== 'playing') return;
    for (const t of e.changedTouches) {
      if (joyTouchId === null) {
        joyTouchId = t.identifier;
        joyOrigin = { x: t.clientX, y: t.clientY };
        joyActive = true;
        joystick.classList.remove('hidden');
        joystick.style.left = `${joyOrigin.x - 55}px`;
        joystick.style.top = `${joyOrigin.y - 55}px`;
        joystickStick.style.left = '32px';
        joystickStick.style.top = '32px';
      }
    }
    e.preventDefault();
  }

  function handleTouchMove(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        let dx = t.clientX - joyOrigin.x;
        let dy = t.clientY - joyOrigin.y;
        const dist = Math.hypot(dx, dy);
        if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
        joyVector = { x: dx / JOY_RADIUS, y: dy / JOY_RADIUS };
        joystickStick.style.left = `${32 + dx}px`;
        joystickStick.style.top = `${32 + dy}px`;
      }
    }
    e.preventDefault();
  }

  function handleTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        joyTouchId = null;
        joyActive = false;
        joyVector = { x: 0, y: 0 };
        joystick.classList.add('hidden');
      }
    }
  }

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  // ---------------------------------------------------------------------
  // Spawning
  // ---------------------------------------------------------------------
  function spawnPosition() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(W, H) * 0.7 + 60;
    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;
    x = Math.max(20, Math.min(WORLD_SIZE - 20, x));
    y = Math.max(20, Math.min(WORLD_SIZE - 20, y));
    return { x, y };
  }

  function spawnEnemy(typeKey) {
    const def = ENEMY_TYPES[typeKey];
    const pos = spawnPosition();
    const stageIdx = currentStageIndex();
    const hpMult = (1 + (stageIdx - 1) * 0.32) * (1 + elapsed * 0.012);
    const dmgMult = (1 + (stageIdx - 1) * 0.18) * (1 + elapsed * 0.006);
    enemies.push({
      x: pos.x, y: pos.y,
      hp: def.hp * hpMult, maxHp: def.hp * hpMult,
      speed: def.speed, damage: def.damage * dmgMult,
      radius: def.radius, scale: def.scale, shape: def.shape, palette: def.palette,
      score: def.score, xpValue: def.xp, alpha: def.alpha || 1,
      erratic: !!def.erratic, ranged: !!def.ranged,
      projDamage: def.projDamage, projSpeed: def.projSpeed, fireCooldown: def.fireCooldown, fireRange: def.fireRange,
      type: typeKey, hitFlash: 0, facing: 1, wobble: Math.random() * Math.PI * 2,
      fireTimer: def.fireCooldown ? Math.random() * def.fireCooldown : 0,
      orbitHitTimer: 0,
    });
  }

  function updateSpawning(dt) {
    spawnTimer -= dt;
    const stageIdx = currentStageIndex();
    const interval = Math.max(0.26, (1.3 - elapsed * 0.01) * Math.max(0.5, 1 - (stageIdx - 1) * 0.07));
    const maxEnemies = Math.min(170, 16 + Math.floor(elapsed * 0.85) + (stageIdx - 1) * 8);
    if (spawnTimer <= 0 && enemies.length < maxEnemies) {
      spawnTimer = interval;
      spawnEnemy(pickEnemyType(stageIdx));
    }
  }

  function updateStageProgress() {
    const idx = currentStageIndex();
    if (idx !== lastStageIndex) {
      lastStageIndex = idx;
      stageBanner = { text: STAGES[idx - 1].label, timer: 2.6 };
      if (idx >= 3) spawnEnemy('boss');
    }
    if (idx >= 3) {
      const floor = Math.floor((elapsed - STAGES[2].threshold) / 55);
      if (floor > lastPeriodicBossFloor) {
        lastPeriodicBossFloor = floor;
        if (floor > 0) spawnEnemy('boss');
      }
    }
  }

  // ---------------------------------------------------------------------
  // Update helpers
  // ---------------------------------------------------------------------
  function findNearestEnemy(range) {
    let best = null, bestDist = range;
    for (const en of enemies) {
      const d = Math.hypot(en.x - player.x, en.y - player.y);
      if (d < bestDist) { bestDist = d; best = en; }
    }
    return best;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.35 + Math.random() * 0.25, maxLife: 0.6, color });
    }
  }

  function updateOrbitWeapon(dt, level) {
    const def = WEAPON_DEFS.orbit;
    const stats = getScaledStats(def, level, player);
    player.orbitAngle += stats.spinSpeed * dt;
    const blades = [];
    for (let i = 0; i < stats.count; i++) {
      const angle = player.orbitAngle + (i / stats.count) * Math.PI * 2;
      blades.push({ x: player.x + Math.cos(angle) * stats.radius, y: player.y + Math.sin(angle) * stats.radius });
    }
    player.orbitBlades = blades;
    for (const en of enemies) {
      if (en.dead || en.orbitHitTimer > 0) continue;
      for (const b of blades) {
        if (Math.hypot(en.x - b.x, en.y - b.y) < en.radius + 10) {
          en.hp -= stats.damage; en.hitFlash = 0.08; en.orbitHitTimer = stats.hitCooldown;
          spawnParticles(b.x, b.y, '#cfe8ff', 2);
          if (en.hp <= 0) en.dead = true;
          break;
        }
      }
    }
  }

  const pendingUpgradeChoices = [];

  function queueLevelUp() {
    const pool = buildCardPool();
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    pendingUpgradeChoices.push(shuffled);
  }

  function showLevelUpCard() {
    if (!pendingUpgradeChoices.length) {
      state = 'playing';
      levelupScreen.classList.add('hidden');
      return;
    }
    state = 'levelup';
    levelupScreen.classList.remove('hidden');
    const choices = pendingUpgradeChoices.shift();
    upgradeCardsEl.innerHTML = '';
    choices.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'upgrade-card';
      cardEl.innerHTML = `
        <div class="uc-icon">${card.icon}</div>
        <div class="uc-name">${card.name}</div>
        <div class="uc-desc">${card.desc}</div>
      `;
      cardEl.addEventListener('click', () => {
        card.apply();
        if (pendingUpgradeChoices.length) {
          showLevelUpCard();
        } else {
          state = 'playing';
          levelupScreen.classList.add('hidden');
        }
      });
      upgradeCardsEl.appendChild(cardEl);
    });
  }

  function gainXp(amount) {
    player.xp += amount;
    let leveled = false;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.xpToNext = Math.round(6 + player.level * 4.2);
      queueLevelUp();
      leveled = true;
    }
    if (leveled) showLevelUpCard();
  }

  function updateEnemies(dt) {
    for (const en of enemies) {
      if (en.hitFlash > 0) en.hitFlash -= dt;
      if (en.orbitHitTimer > 0) en.orbitHitTimer -= dt;

      if (en.ranged) {
        const dx = player.x - en.x, dy = player.y - en.y, d = Math.hypot(dx, dy) || 1;
        const keep = en.fireRange * 0.55;
        if (d > keep) { en.x += (dx / d) * en.speed * dt; en.y += (dy / d) * en.speed * dt; }
        else if (d < keep * 0.75) { en.x -= (dx / d) * en.speed * 0.6 * dt; en.y -= (dy / d) * en.speed * 0.6 * dt; }
        en.facing = dx < 0 ? -1 : 1;
        en.fireTimer -= dt;
        if (d < en.fireRange && en.fireTimer <= 0) {
          en.fireTimer = en.fireCooldown;
          const angle = Math.atan2(dy, dx);
          enemyBullets.push({ x: en.x, y: en.y, vx: Math.cos(angle) * en.projSpeed, vy: Math.sin(angle) * en.projSpeed, damage: en.projDamage, life: 3 });
        }
      } else if (en.erratic) {
        const dx = player.x - en.x, dy = player.y - en.y, d = Math.hypot(dx, dy) || 1;
        const nx = dx / d, ny = dy / d, px = -ny, py = nx;
        en.wobble += dt * 6;
        const wob = Math.sin(en.wobble) * 45;
        en.x += (nx * en.speed + px * wob) * dt;
        en.y += (ny * en.speed + py * wob) * dt;
        en.facing = dx < 0 ? -1 : 1;
      } else {
        const dx = player.x - en.x, dy = player.y - en.y, d = Math.hypot(dx, dy) || 1;
        en.x += (dx / d) * en.speed * dt;
        en.y += (dy / d) * en.speed * dt;
        en.facing = dx < 0 ? -1 : 1;
      }

      const hitDist = en.radius + PLAYER_RADIUS;
      if (Math.hypot(player.x - en.x, player.y - en.y) < hitDist && player.iframe <= 0) {
        player.hp -= en.damage;
        player.iframe = IFRAME_TIME;
        spawnParticles(player.x, player.y, '#ff4d5e', 6);
      }
    }
  }

  function updateBullets(dt) {
    for (const b of bullets) {
      if (b.kind === 'boomerang') {
        if (!b.returning) {
          b.dist += b.speed * dt;
          b.x = b.startX + Math.cos(b.angle) * b.dist;
          b.y = b.startY + Math.sin(b.angle) * b.dist;
          if (b.dist >= b.maxDist) { b.returning = true; b.hitSet = new Set(); }
        } else {
          const dx = player.x - b.x, dy = player.y - b.y, d = Math.hypot(dx, dy) || 1;
          const step = Math.min(d, b.speed * dt);
          b.x += (dx / d) * step; b.y += (dy / d) * step;
          if (d < 18) b.dead = true;
        }
        b.life -= dt;
      } else if (b.kind === 'bomb') {
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.fuse -= dt; b.life -= dt;
        let exploded = b.fuse <= 0;
        if (!exploded) {
          for (const en of enemies) {
            if (!en.dead && Math.hypot(en.x - b.x, en.y - b.y) < en.radius + 8) { exploded = true; break; }
          }
        }
        if (exploded) {
          for (const en of enemies) {
            if (en.dead) continue;
            if (Math.hypot(en.x - b.x, en.y - b.y) < b.radius + en.radius) {
              en.hp -= b.damage; en.hitFlash = 0.12;
              if (en.hp <= 0) en.dead = true;
            }
          }
          spawnParticles(b.x, b.y, '#ffb84d', 20);
          b.dead = true;
        }
      } else {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      }
    }

    for (const b of bullets) {
      if (b.dead || b.kind === 'bomb') continue;
      for (const en of enemies) {
        if (en.dead) continue;
        if (b.kind === 'boomerang' && b.hitSet.has(en)) continue;
        const d = Math.hypot(b.x - en.x, b.y - en.y);
        if (d < en.radius + 6) {
          en.hp -= b.damage; en.hitFlash = 0.08;
          spawnParticles(b.x, b.y, '#ffd23f', 3);
          if (en.hp <= 0) en.dead = true;
          if (b.kind === 'boomerang') {
            b.hitSet.add(en);
          } else if (b.pierceLeft > 0) {
            b.pierceLeft -= 1;
          } else {
            b.dead = true;
            break;
          }
        }
      }
    }

    const halfW = W / 2, halfH = H / 2;
    bullets = bullets.filter((b) => !b.dead && b.life > 0 &&
      b.x > camera.x - halfW - 500 && b.x < camera.x + halfW + 500 &&
      b.y > camera.y - halfH - 500 && b.y < camera.y + halfH + 500);
  }

  function updateEnemyBullets(dt) {
    for (const eb of enemyBullets) {
      eb.x += eb.vx * dt; eb.y += eb.vy * dt; eb.life -= dt;
      if (Math.hypot(eb.x - player.x, eb.y - player.y) < PLAYER_RADIUS + 5 && player.iframe <= 0) {
        player.hp -= eb.damage; player.iframe = IFRAME_TIME; eb.dead = true;
        spawnParticles(player.x, player.y, '#ff9d4d', 6);
      }
    }
    enemyBullets = enemyBullets.filter((eb) => !eb.dead && eb.life > 0);
  }

  function updateWeaponHud() {
    const sig = player.weapons.map((w) => `${w.id}${w.level}`).join(',');
    if (sig === lastWeaponsSig) return;
    lastWeaponsSig = sig;
    weaponIconsEl.innerHTML = player.weapons.map((w) => {
      const def = WEAPON_DEFS[w.id];
      return `<div class="weapon-icon" title="${def.name} Lv.${w.level}"><span>${def.icon}</span><b>${w.level}</b></div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Main update
  // ---------------------------------------------------------------------
  function update(dt) {
    elapsed += dt;
    updateStageProgress();
    updateSpawning(dt);

    const kv = getKeyboardVector();
    let mx = kv.x, my = kv.y;
    if (joyActive) { mx = joyVector.x; my = joyVector.y; }
    const mlen = Math.hypot(mx, my);
    if (mlen > 1) { mx /= mlen; my /= mlen; }
    player.x += mx * player.speed * dt;
    player.y += my * player.speed * dt;
    player.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_SIZE - PLAYER_RADIUS, player.x));
    player.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_SIZE - PLAYER_RADIUS, player.y));
    if (mx !== 0) player.facing = mx > 0 ? 1 : -1;

    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
    if (player.iframe > 0) player.iframe -= dt;

    const halfW = W / 2, halfH = H / 2;
    camera.x = Math.max(halfW, Math.min(WORLD_SIZE - halfW, player.x));
    camera.y = Math.max(halfH, Math.min(WORLD_SIZE - halfH, player.y));

    for (const w of player.weapons) {
      if (w.id === 'orbit') continue;
      const def = WEAPON_DEFS[w.id];
      const stats = getScaledStats(def, w.level, player);
      player.weaponTimers[w.id] = (player.weaponTimers[w.id] || 0) - dt;
      if (player.weaponTimers[w.id] <= 0) {
        const target = findNearestEnemy(stats.range || 300);
        if (target) {
          def.fire(stats, player, target);
          player.weaponTimers[w.id] = stats.cooldown;
        } else {
          player.weaponTimers[w.id] = 0.1;
        }
      }
    }
    const orbitW = player.weapons.find((w) => w.id === 'orbit');
    if (orbitW) updateOrbitWeapon(dt, orbitW.level); else player.orbitBlades = [];

    updateEnemies(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    for (const e of effects) e.life -= dt;
    effects = effects.filter((e) => e.life > 0);

    for (const en of enemies) {
      if (en.dead) {
        kills += 1;
        gems.push({ x: en.x, y: en.y, value: en.xpValue });
        spawnParticles(en.x, en.y, en.type === 'boss' ? '#d9a3f5' : '#8fd66b', en.type === 'boss' ? 26 : 10);
      }
    }
    enemies = enemies.filter((en) => !en.dead);

    for (const g of gems) {
      const d = Math.hypot(player.x - g.x, player.y - g.y);
      if (d < player.magnetRadius) {
        const pull = 260 * dt;
        const dx = player.x - g.x, dy = player.y - g.y;
        const dd = Math.hypot(dx, dy) || 1;
        g.x += (dx / dd) * Math.min(pull, dd);
        g.y += (dy / dd) * Math.min(pull, dd);
      }
      if (d < 16) g.collected = true;
    }
    const collected = gems.filter((g) => g.collected);
    if (collected.length) gainXp(collected.reduce((s, g) => s + g.value, 0));
    gems = gems.filter((g) => !g.collected);

    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      p.vx *= 0.92; p.vy *= 0.92;
    }
    particles = particles.filter((p) => p.life > 0);

    if (player.hp <= 0) triggerGameOver();

    hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    xpFill.style.width = `${Math.min(100, (player.xp / player.xpToNext) * 100)}%`;
    hudLevel.textContent = `Lv.${player.level}`;
    hudStage.textContent = `STAGE ${currentStageIndex()}`;
    hudTimer.textContent = formatTime(elapsed);
    hudKills.textContent = `☠ ${kills}`;
    updateWeaponHud();

    if (stageBanner) {
      stageBanner.timer -= dt;
      stageBannerEl.textContent = stageBanner.text;
      stageBannerEl.classList.remove('hidden');
      const t = stageBanner.timer;
      if (t > 2.0) stageBannerEl.style.opacity = (2.6 - t) / 0.6;
      else if (t > 0.6) stageBannerEl.style.opacity = 1;
      else stageBannerEl.style.opacity = Math.max(0, t / 0.6);
      if (t <= 0) { stageBanner = null; stageBannerEl.classList.add('hidden'); }
    }
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  function drawBackground() {
    ctx.fillStyle = '#141824';
    ctx.fillRect(0, 0, W, H);
    const tile = 64;
    const halfW = W / 2, halfH = H / 2;
    const startX = Math.floor((camera.x - halfW) / tile) * tile;
    const startY = Math.floor((camera.y - halfH) / tile) * tile;
    for (let wx = startX; wx < camera.x + halfW; wx += tile) {
      for (let wy = startY; wy < camera.y + halfH; wy += tile) {
        const ix = Math.round(wx / tile), iy = Math.round(wy / tile);
        if ((ix + iy) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(wx - camera.x + halfW, wy - camera.y + halfH, tile, tile);
        }
      }
    }
    ctx.strokeStyle = 'rgba(255,80,80,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0 - camera.x + halfW, 0 - camera.y + halfH, WORLD_SIZE, WORLD_SIZE);
  }

  function worldToScreen(x, y) {
    return { x: x - camera.x + W / 2, y: y - camera.y + H / 2 };
  }

  function drawHealthBar(sx, sy, radius, hp, maxHp, color) {
    const w = radius * 2.2, h = 4;
    const x = sx - w / 2, y = sy - radius - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, hp / maxHp), h);
  }

  function render() {
    drawBackground();

    for (const g of gems) {
      const s = worldToScreen(g.x, g.y);
      if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#4fd1c5';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    for (const en of enemies) {
      const s = worldToScreen(en.x, en.y);
      if (s.x < -80 || s.x > W + 80 || s.y < -80 || s.y > H + 80) continue;
      const grid = GRIDS[en.shape];
      const spriteCanvas = getSpriteCanvas(en.type, grid, en.palette, en.scale);
      drawSpriteCanvas(spriteCanvas, s.x, s.y, en.facing, en.hitFlash > 0, en.alpha);
      if (en.hp < en.maxHp) drawHealthBar(s.x, s.y, en.radius, en.hp, en.maxHp, '#ff4d5e');
    }

    for (const b of bullets) {
      const s = worldToScreen(b.x, b.y);
      if (b.kind === 'boomerang') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((b.dist || 0) * 0.05);
        ctx.fillStyle = '#c9a15a';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillRect(-2, -6, 4, 12);
        ctx.restore();
      } else if (b.kind === 'bomb') {
        ctx.fillStyle = Math.floor(b.fuse * 10) % 2 === 0 ? '#ff6b4d' : '#2b2b2b';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffe98a';
        ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
      }
    }

    ctx.fillStyle = '#ff9d4d';
    for (const eb of enemyBullets) {
      const s = worldToScreen(eb.x, eb.y);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of effects) {
      if (e.kind !== 'laser') continue;
      const s1 = worldToScreen(e.x1, e.y1), s2 = worldToScreen(e.x2, e.y2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.life / e.maxLife);
      ctx.strokeStyle = '#ff5e7a';
      ctx.lineWidth = e.width;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of particles) {
      const s = worldToScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    if (player.orbitBlades && player.orbitBlades.length) {
      for (const b of player.orbitBlades) {
        const s = worldToScreen(b.x, b.y);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(player.orbitAngle * 3);
        ctx.fillStyle = '#cfe8ff';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      }
    }

    {
      const s = worldToScreen(player.x, player.y);
      const flashing = player.iframe > 0 && Math.floor(player.iframe * 20) % 2 === 0;
      const playerCanvas = getSpriteCanvas('player', HUMANOID_SPRITE, PAL_PLAYER, 4);
      drawSpriteCanvas(playerCanvas, s.x, s.y, player.facing, flashing, 1);

      const target = findNearestEnemy(320);
      if (target) {
        const ts = worldToScreen(target.x, target.y);
        const angle = Math.atan2(ts.y - s.y, ts.x - s.x);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#333';
        ctx.fillRect(6, -2, 16, 4);
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------
  // Game flow
  // ---------------------------------------------------------------------
  function triggerGameOver() {
    if (state === 'gameover') return;
    state = 'gameover';
    gameoverScreen.classList.remove('hidden');
    hud.classList.add('hidden');
    joystick.classList.add('hidden');
    stageBannerEl.classList.add('hidden');
    finalScoreEl.textContent = currentScore();
    finalLevelEl.textContent = player.level;
    finalTimeEl.textContent = formatTime(elapsed);
    finalKillsEl.textContent = kills;
    nameInput.value = localStorage.getItem(NAME_KEY) || '';
    renderLeaderboard(leaderboardGameover, loadLeaderboard());
  }

  function startGame() {
    resetGame();
    state = 'playing';
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    levelupScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  btnStart.addEventListener('click', () => {
    renderLeaderboard(leaderboardStart, loadLeaderboard());
    startGame();
  });

  btnRetry.addEventListener('click', () => startGame());

  btnSaveScore.addEventListener('click', () => {
    const name = nameInput.value.trim().slice(0, 10) || 'Player';
    localStorage.setItem(NAME_KEY, name);
    const list = addScore(name, currentScore(), player.level, elapsed);
    renderLeaderboard(leaderboardGameover, list);
    btnSaveScore.disabled = true;
    btnSaveScore.textContent = '저장됨';
  });

  nameInput.addEventListener('input', () => {
    btnSaveScore.disabled = false;
    btnSaveScore.textContent = '기록 저장';
  });

  // ---------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (state === 'playing') update(dt);
    if (state === 'playing' || state === 'levelup') render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  renderLeaderboard(leaderboardStart, loadLeaderboard());
})();
