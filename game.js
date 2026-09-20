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
  const hudTimer = document.getElementById('hud-timer');
  const hudKills = document.getElementById('hud-kills');

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
  // Pixel sprite renderer
  // ---------------------------------------------------------------------
  const HUMANOID = [
    '..OOOO..',
    '.OHHHHO.',
    '.OHHHHO.',
    '..OBBO..',
    'AOBBBBO.',
    'AOBBBBO.',
    '.OBBBBO.',
    '..OLLO..',
    '..OLLO..',
    '..O..O..',
  ];

  function drawHumanoid(cx, cy, scale, palette, facing, hitFlash) {
    const rows = HUMANOID.length;
    const cols = HUMANOID[0].length;
    const w = cols * scale;
    const h = rows * scale;
    ctx.save();
    ctx.translate(cx, cy);
    if (facing < 0) ctx.scale(-1, 1);
    for (let r = 0; r < rows; r++) {
      const row = HUMANOID[r];
      for (let c = 0; c < cols; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const color = hitFlash ? '#ffffff' : palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        const px = -w / 2 + c * scale;
        const py = -h / 2 + r * scale;
        ctx.fillRect(px, py, scale + 0.5, scale + 0.5);
      }
    }
    ctx.restore();
  }

  const PALETTE_PLAYER = { O: '#101018', H: '#f1c27d', B: '#3a6cc9', A: '#2a2a33', L: '#22243a' };
  const PALETTE_GRUNT = { O: '#0a1a0a', H: '#8fd66b', B: '#3f7d3a', A: '#22331f', L: '#1c2b19' };
  const PALETTE_RUNNER = { O: '#1a0a12', H: '#e8a3d0', B: '#a13f8a', A: '#331f2c', L: '#2b1924' };
  const PALETTE_ELITE = { O: '#1a0505', H: '#e0a3a3', B: '#b23b3b', A: '#331414', L: '#2b1414' };
  const PALETTE_BOSS = { O: '#160418', H: '#d9a3f5', B: '#6a1fb2', A: '#2a1140', L: '#22103a' };

  // ---------------------------------------------------------------------
  // Game constants
  // ---------------------------------------------------------------------
  const WORLD_SIZE = 2600;
  const PLAYER_RADIUS = 14;
  const IFRAME_TIME = 0.5;

  const ENEMY_TYPES = {
    grunt: { hp: 18, speed: 62, damage: 8, radius: 14, scale: 3.6, score: 10, xp: 1, palette: PALETTE_GRUNT },
    runner: { hp: 10, speed: 108, damage: 6, radius: 11, scale: 3, score: 14, xp: 1, palette: PALETTE_RUNNER },
    elite: { hp: 90, speed: 50, damage: 16, radius: 20, scale: 5, score: 60, xp: 4, palette: PALETTE_ELITE },
    boss: { hp: 420, speed: 40, damage: 26, radius: 32, scale: 7.5, score: 300, xp: 20, palette: PALETTE_BOSS },
  };

  const UPGRADE_POOL = [
    {
      id: 'damage', icon: '⚔️', name: '공격력 강화',
      desc: (lv) => `공격력 +${(2 + lv).toFixed(0)}`,
      apply: (p) => { p.damage += 2 + p.upLevels.damage; p.upLevels.damage++; },
    },
    {
      id: 'firerate', icon: '⚡', name: '공격속도 증가',
      desc: () => '공격 쿨타임 12% 감소',
      apply: (p) => { p.fireCooldown *= 0.88; p.upLevels.firerate++; },
    },
    {
      id: 'speed', icon: '🥾', name: '이동속도 증가',
      desc: () => '이동속도 +12%',
      apply: (p) => { p.speed *= 1.12; p.upLevels.speed++; },
    },
    {
      id: 'maxhp', icon: '❤️', name: '최대 체력 증가',
      desc: () => '최대 체력 +20, 전체 회복',
      apply: (p) => { p.maxHp += 20; p.hp = p.maxHp; p.upLevels.maxhp++; },
    },
    {
      id: 'regen', icon: '💚', name: '체력 재생',
      desc: () => '초당 체력 재생 +0.6',
      apply: (p) => { p.regen += 0.6; p.upLevels.regen++; },
    },
    {
      id: 'multishot', icon: '🔱', name: '다중 사격',
      desc: () => '동시 발사 수 +1',
      apply: (p) => { p.projectileCount += 1; p.upLevels.multishot++; },
    },
    {
      id: 'pierce', icon: '🎯', name: '관통 강화',
      desc: () => '탄환 관통력 +1',
      apply: (p) => { p.pierce += 1; p.upLevels.pierce++; },
    },
    {
      id: 'range', icon: '📡', name: '사거리 증가',
      desc: () => '공격 사거리 +15%',
      apply: (p) => { p.range *= 1.15; p.upLevels.range++; },
    },
    {
      id: 'magnet', icon: '🧲', name: '아이템 획득범위',
      desc: () => '경험치 자석 범위 +25%',
      apply: (p) => { p.magnetRadius *= 1.25; p.upLevels.magnet++; },
    },
    {
      id: 'bulletspeed', icon: '💨', name: '탄속 증가',
      desc: () => '탄환 속도 +18%',
      apply: (p) => { p.bulletSpeed *= 1.18; p.upLevels.bulletspeed++; },
    },
  ];

  // ---------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------
  let state = 'start'; // start | playing | levelup | gameover
  let player, enemies, bullets, gems, particles;
  let camera = { x: 0, y: 0 };
  let elapsed = 0;
  let kills = 0;
  let spawnTimer = 0;
  let bossSpawned30 = false, bossSpawned60 = false;
  let lastTime = 0;
  let keys = new Set();
  let joyVector = { x: 0, y: 0 };
  let joyActive = false;
  let joyTouchId = null;
  let joyOrigin = { x: 0, y: 0 };

  function freshPlayer() {
    return {
      x: WORLD_SIZE / 2, y: WORLD_SIZE / 2,
      hp: 100, maxHp: 100,
      speed: 170,
      damage: 8,
      fireCooldown: 0.55,
      fireTimer: 0,
      range: 260,
      projectileCount: 1,
      pierce: 0,
      bulletSpeed: 420,
      regen: 0,
      magnetRadius: 70,
      xp: 0, level: 1, xpToNext: 6,
      facing: 1,
      iframe: 0,
      upLevels: { damage: 0, firerate: 0, speed: 0, maxhp: 0, regen: 0, multishot: 0, pierce: 0, range: 0, magnet: 0, bulletspeed: 0 },
    };
  }

  function resetGame() {
    player = freshPlayer();
    enemies = [];
    bullets = [];
    gems = [];
    particles = [];
    camera = { x: player.x, y: player.y };
    elapsed = 0;
    kills = 0;
    spawnTimer = 0.6;
    bossSpawned30 = false;
    bossSpawned60 = false;
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
  window.addEventListener('keydown', (e) => {
    keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
  });

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
        if (dist > JOY_RADIUS) {
          dx = (dx / dist) * JOY_RADIUS;
          dy = (dy / dist) * JOY_RADIUS;
        }
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
    const hpMult = 1 + elapsed * 0.018;
    const dmgMult = 1 + elapsed * 0.008;
    enemies.push({
      x: pos.x, y: pos.y,
      hp: def.hp * hpMult, maxHp: def.hp * hpMult,
      speed: def.speed, damage: def.damage * dmgMult,
      radius: def.radius, scale: def.scale,
      score: def.score, xpValue: def.xp,
      palette: def.palette, type: typeKey,
      hitFlash: 0, facing: 1,
    });
  }

  function updateSpawning(dt) {
    spawnTimer -= dt;
    const interval = Math.max(0.32, 1.35 - elapsed * 0.012);
    const maxEnemies = Math.min(140, 18 + Math.floor(elapsed * 0.9));
    if (spawnTimer <= 0 && enemies.length < maxEnemies) {
      spawnTimer = interval;
      const roll = Math.random();
      let typeKey = 'grunt';
      if (roll < 0.22) typeKey = 'runner';
      else if (roll < 0.30 && elapsed > 20) typeKey = 'elite';
      spawnEnemy(typeKey);
    }
    if (elapsed > 30 && !bossSpawned30) {
      bossSpawned30 = true;
      spawnEnemy('boss');
    }
    if (elapsed > 75 && !bossSpawned60) {
      bossSpawned60 = true;
      spawnEnemy('boss');
    }
  }

  // ---------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------
  function findNearestEnemy(range) {
    let best = null, bestDist = range;
    for (const en of enemies) {
      const d = Math.hypot(en.x - player.x, en.y - player.y);
      if (d < bestDist) { bestDist = d; best = en; }
    }
    return best;
  }

  function fireAt(target) {
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const count = player.projectileCount;
    const spread = Math.min(0.5, 0.14 * (count - 1));
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
      const angle = baseAngle + t * spread;
      bullets.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * player.bulletSpeed,
        vy: Math.sin(angle) * player.bulletSpeed,
        damage: player.damage,
        pierceLeft: player.pierce,
        life: player.range / player.bulletSpeed + 0.15,
      });
    }
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.25, maxLife: 0.6, color,
      });
    }
  }

  const pendingUpgradeChoices = [];

  function queueLevelUp() {
    const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
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
    choices.forEach((upg) => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="uc-icon">${upg.icon}</div>
        <div class="uc-name">${upg.name}</div>
        <div class="uc-desc">${upg.desc(player.upLevels[upg.id])}</div>
      `;
      card.addEventListener('click', () => {
        upg.apply(player);
        if (pendingUpgradeChoices.length) {
          showLevelUpCard();
        } else {
          state = 'playing';
          levelupScreen.classList.add('hidden');
        }
      });
      upgradeCardsEl.appendChild(card);
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

  function update(dt) {
    elapsed += dt;
    updateSpawning(dt);

    // --- movement ---
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

    // --- camera ---
    const halfW = W / 2, halfH = H / 2;
    camera.x = Math.max(halfW, Math.min(WORLD_SIZE - halfW, player.x));
    camera.y = Math.max(halfH, Math.min(WORLD_SIZE - halfH, player.y));

    // --- attack ---
    player.fireTimer -= dt;
    const target = findNearestEnemy(player.range);
    if (target && player.fireTimer <= 0) {
      fireAt(target);
      player.fireTimer = player.fireCooldown;
    }

    // --- enemies ---
    for (const en of enemies) {
      const dx = player.x - en.x, dy = player.y - en.y;
      const d = Math.hypot(dx, dy) || 1;
      en.x += (dx / d) * en.speed * dt;
      en.y += (dy / d) * en.speed * dt;
      en.facing = dx < 0 ? -1 : 1;
      if (en.hitFlash > 0) en.hitFlash -= dt;
      const hitDist = en.radius + PLAYER_RADIUS;
      if (d < hitDist && player.iframe <= 0) {
        player.hp -= en.damage;
        player.iframe = IFRAME_TIME;
        spawnParticles(player.x, player.y, '#ff4d5e', 6);
      }
    }

    // --- bullets ---
    for (const b of bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    for (const b of bullets) {
      if (b.dead) continue;
      for (const en of enemies) {
        if (en.dead) continue;
        const d = Math.hypot(b.x - en.x, b.y - en.y);
        if (d < en.radius + 4) {
          en.hp -= b.damage;
          en.hitFlash = 0.08;
          spawnParticles(b.x, b.y, '#ffd23f', 3);
          if (b.pierceLeft > 0) { b.pierceLeft -= 1; } else { b.dead = true; }
          if (en.hp <= 0) en.dead = true;
          if (b.dead) break;
        }
      }
    }
    bullets = bullets.filter((b) => !b.dead && b.life > 0 &&
      b.x > camera.x - halfW - 60 && b.x < camera.x + halfW + 60 &&
      b.y > camera.y - halfH - 60 && b.y < camera.y + halfH + 60);

    // --- dead enemies -> gems ---
    for (const en of enemies) {
      if (en.dead) {
        kills += 1;
        gems.push({ x: en.x, y: en.y, value: en.xpValue });
        spawnParticles(en.x, en.y, en.type === 'boss' ? '#d9a3f5' : '#8fd66b', en.type === 'boss' ? 26 : 10);
      }
    }
    enemies = enemies.filter((en) => !en.dead);

    // --- gems ---
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
    if (collected.length) {
      const xpSum = collected.reduce((s, g) => s + g.value, 0);
      gainXp(xpSum);
    }
    gems = gems.filter((g) => !g.collected);

    // --- particles ---
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
    particles = particles.filter((p) => p.life > 0);

    // --- death check ---
    if (player.hp <= 0) {
      triggerGameOver();
    }

    // --- HUD ---
    hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    xpFill.style.width = `${Math.min(100, (player.xp / player.xpToNext) * 100)}%`;
    hudLevel.textContent = `Lv.${player.level}`;
    hudTimer.textContent = formatTime(elapsed);
    hudKills.textContent = `☠ ${kills}`;
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
    // world border
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

    // gems
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

    // enemies
    for (const en of enemies) {
      const s = worldToScreen(en.x, en.y);
      if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) continue;
      drawHumanoid(s.x, s.y, en.scale, en.palette, en.facing, en.hitFlash > 0);
      drawHealthBar(s.x, s.y, en.radius, en.hp, en.maxHp, '#ff4d5e');
    }

    // bullets
    ctx.fillStyle = '#ffe98a';
    for (const b of bullets) {
      const s = worldToScreen(b.x, b.y);
      ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
    }

    // particles
    for (const p of particles) {
      const s = worldToScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // player
    {
      const s = worldToScreen(player.x, player.y);
      const flashing = player.iframe > 0 && Math.floor(player.iframe * 20) % 2 === 0;
      drawHumanoid(s.x, s.y, 4, PALETTE_PLAYER, player.facing, flashing);

      const target = findNearestEnemy(player.range);
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
    finalScoreEl.textContent = currentScore();
    finalLevelEl.textContent = player.level;
    finalTimeEl.textContent = formatTime(elapsed);
    finalKillsEl.textContent = kills;
    const savedName = localStorage.getItem(NAME_KEY) || '';
    nameInput.value = savedName;
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

  btnRetry.addEventListener('click', () => {
    startGame();
  });

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

    if (state === 'playing') {
      update(dt);
    }
    if (state === 'playing' || state === 'levelup') {
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // initial leaderboard render
  renderLeaderboard(leaderboardStart, loadLeaderboard());
})();
