// 맵: 타일, 충돌, 마을(루멘) 및 지역 던전 생성
'use strict';
(function () {
  const T = (R.T = {
    FLOOR: 0, WALL: 1, GATE: 2, VINE: 3, PORTAL: 4, HAZARD: 5, ICE: 6, SWITCH: 7, BLOCK: 8, WATER: 9, PATH: 10, EXIT: 11,
  });
  const SOLID = new Uint8Array(16);
  [T.WALL, T.GATE, T.VINE, T.BLOCK, T.WATER].forEach((t) => (SOLID[t] = 1));
  R.isSolidTile = (t) => SOLID[t] === 1;
  const TS = R.TILE;

  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  R.seeded = seeded;

  class GameMap {
    constructor(w, h, theme, kind) {
      this.w = w; this.h = h; this.theme = theme; this.kind = kind;
      this.tiles = new Uint8Array(w * h).fill(T.WALL);
      this.variant = new Uint8Array(w * h);
      this.explored = new Uint8Array(w * h);
      this.vineHp = new Map();
      this.props = [];      // 집, 분수대 등 큰 장식
      this.spawns = [];     // 몬스터 스폰 지점
      this.rooms = [];
      this.chests = [];
      this.npcs = [];
      this.bossRoom = null;
      this.start = { x: 0, y: 0 };
    }
    idx(tx, ty) { return ty * this.w + tx; }
    get(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? T.WALL : this.tiles[ty * this.w + tx]; }
    set(tx, ty, t) { if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) this.tiles[ty * this.w + tx] = t; }
    tileAt(x, y) { return this.get(Math.floor(x / TS), Math.floor(y / TS)); }
    solidAt(x, y) { return SOLID[this.tileAt(x, y)] === 1; }
    carve(x, y, w, h, t = T.FLOOR) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); }
    // 발 위치 기준 박스(가로 r, 세로 r*0.6)가 벽과 겹치는지
    boxHits(x, y, r) {
      const ry = r * 0.6;
      return this.solidAt(x - r, y - ry) || this.solidAt(x + r - 0.01, y - ry) || this.solidAt(x - r, y + ry - 0.01) || this.solidAt(x + r - 0.01, y + ry - 0.01);
    }
    explore(x, y, rad) {
      const cx = Math.floor(x / TS), cy = Math.floor(y / TS);
      for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
        if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
        if ((i - cx) * (i - cx) + (j - cy) * (j - cy) <= rad * rad) this.explored[j * this.w + i] = 1;
      }
    }
    // 두 점 사이 직선에 벽이 있는지 (시야 판정)
    lineClear(x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
      for (let i = 1; i < n; i++) if (this.solidAt(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false;
      return true;
    }
  }
  R.GameMap = GameMap;

  // 축 분리 이동 + 벽 충돌. 이동이 막히면 false
  R.moveBody = function (map, e, dx, dy) {
    let ok = true;
    if (dx) { const nx = e.x + dx; if (!map.boxHits(nx, e.y, e.r)) e.x = nx; else ok = false; }
    if (dy) { const ny = e.y + dy; if (!map.boxHits(e.x, ny, e.r)) e.y = ny; else ok = false; }
    return ok;
  };

  function randomizeVariants(map, rnd) {
    for (let i = 0; i < map.variant.length; i++) {
      const r = rnd();
      map.variant[i] = r < 0.7 ? 0 : r < 0.88 ? 1 : 2;
    }
  }

  // ─── 마을 : 루멘 ─────────────────────────────────────
  R.buildTown = function () {
    const W = 26, H = 36;
    const m = new GameMap(W, H, 'town', 'town');
    const rnd = seeded(4242);
    randomizeVariants(m, rnd);
    m.carve(2, 2, W - 4, H - 4, T.FLOOR);
    // 길
    m.carve(12, 6, 2, H - 6, T.PATH);
    m.carve(3, 20, W - 6, 2, T.PATH);
    m.carve(9, 13, 8, 9, T.PATH);
    m.carve(12, H - 2, 2, 2, T.EXIT);
    // 분수대
    m.carve(12, 15, 2, 2, T.BLOCK);
    m.props.push({ kind: 'fountain', x: 13 * TS - 17, y: 17 * TS - 36, bottom: 17 * TS });
    // 집 (4x3 타일 블록, 스프라이트 64x60)
    const houses = [
      { tx: 11, ty: 2, v: 0, label: '촌장의 집', npc: 'elder' },
      { tx: 3, ty: 9, v: 4, label: '대장간', npc: 'smith' },
      { tx: 19, ty: 9, v: 3, label: '연금술 상점', npc: 'alchemist' },
      { tx: 3, ty: 24, v: 1, label: '여관', npc: 'inn' },
      { tx: 19, ty: 24, v: 2, label: '용병 길드', npc: 'guild' },
    ];
    for (const h of houses) {
      m.carve(h.tx, h.ty, 4, 3, T.BLOCK);
      m.props.push({ kind: 'house', v: h.v, x: h.tx * TS, y: (h.ty + 3) * TS - 60, bottom: (h.ty + 3) * TS, label: h.label });
      if (h.ty > 2) m.carve(h.tx + 1, h.ty + 3, 2, 1, T.PATH);
    }
    m.carve(12, 5, 2, 1, T.PATH);
    // 장식 나무
    [[6, 5], [19, 5], [8, 17], [17, 18], [6, 30], [19, 31], [9, 29], [16, 29], [3, 16], [22, 16]].forEach(([x, y]) => m.set(x, y, T.WALL));
    m.props.push({ kind: 'sign', x: 14 * TS + 2, y: (H - 3) * TS - 4, bottom: (H - 2) * TS - 2, label: '남문 — 모험의 길' });
    // NPC
    const NPC = (id, name, tx, ty, look, role) => m.npcs.push({ id, name, x: tx * TS, y: ty * TS, r: 5, look, role, dir: 'down', bob: rnd() * 6 });
    NPC('elder', '촌장 엘든', 13, 6.4, { skin: '#f1c29a', hair: '#e8e8e8', body: '#6a4a8a', bodyD: '#4a2e5e', legs: '#4a2e5e', boots: '#2a1a1a', hat: 'none' }, 'quest');
    NPC('smith', '대장장이 브론', 5, 12.6, { skin: '#d8a070', hair: '#5a2a10', body: '#5a4a3a', bodyD: '#3a2e24', legs: '#3a3a44', boots: '#1a1a1a', hat: 'bandana', hatC: '#8a3a1a' }, 'forge');
    NPC('alchemist', '연금술사 미라', 21, 12.6, { skin: '#f1c29a', hair: '#d04a8a', body: '#3a8a8a', bodyD: '#246060', legs: '#246060', boots: '#1a2a2a', hat: 'wizard', hatC: '#3a8a8a' }, 'shop');
    NPC('inn', '여관 주인 하나', 5, 27.6, { skin: '#f1c29a', hair: '#8a4a1a', body: '#c8a060', bodyD: '#a07a40', legs: '#6a4a2a', boots: '#3a2a1a', hat: 'none' }, 'inn');
    NPC('guild', '길드장 레오', 21, 27.6, { skin: '#d8a070', hair: '#2a2a2a', body: '#8a2a2a', bodyD: '#5e1a1a', legs: '#3a3a44', boots: '#1a1a1a', hat: 'none', cape: '#3a3a44' }, 'guild');
    NPC('merchant', '수상한 상인 모르', 8.5, 18.6, { skin: '#c8a080', hair: '#2a1a3a', body: '#4a2a6a', bodyD: '#2e1a44', legs: '#2e1a44', boots: '#1a1020', hat: 'hood', hatC: '#5a2a7a', cape: '#2a1a3a' }, 'pets');
    NPC('bard', '음유시인 노아', 16.5, 14.6, { skin: '#f1c29a', hair: '#e0b040', body: '#3a8a3a', bodyD: '#2a5e28', legs: '#5a4630', boots: '#3a2a20', hat: 'hood', hatC: '#c83a3a' }, 'bard');
    m.start = { x: 13 * TS, y: 23 * TS };
    m.exploreAll = true;
    return m;
  };

  // ─── 지역 던전 생성 (지역별 시드 고정 = 매번 같은 수작업 느낌의 맵) ─────
  R.buildDungeon = function (region) {
    const W = 46, H = 64;
    const m = new GameMap(W, H, region.theme, 'dungeon');
    const rnd = seeded(region.id * 7919 + 13);
    randomizeVariants(m, rnd);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

    // 보스방 (상단)
    const boss = { x: 12, y: 2, w: 22, h: 13, boss: true };
    m.carve(boss.x, boss.y, boss.w, boss.h);
    m.bossRoom = boss;

    // 시작방 (하단) + 지그재그 방 4개
    const start = { x: 18, y: H - 10, w: 10, h: 7, start: true };
    const chain = [start];
    for (let i = 0; i < 4; i++) {
      const h = ri(6, 7), w = ri(10, 14);
      const y = start.y - (i + 1) * 9;
      let x;
      if (i === 3) x = ri(15, W - 16 - w + 1);
      else if (i % 2 === 0) x = ri(3, 8);
      else x = W - 3 - w - ri(0, 5);
      chain.push({ x, y, w, h });
    }
    // 열쇠방: 맨 위 방의 오른쪽 빈 공간 (본 경로와 겹치지 않음)
    const r2 = chain[4];
    const kw = 9, kh = 6;
    const keyRoom = { x: W - 3 - kw, y: r2.y, w: kw, h: kh, key: true };
    const rooms = [...chain, keyRoom];
    rooms.forEach((r) => m.carve(r.x, r.y, r.w, r.h));
    m.rooms = rooms.concat([boss]);

    const cx = (r) => Math.floor(r.x + r.w / 2), cy = (r) => Math.floor(r.y + r.h / 2);
    function corridor(x0, y0, x1, y1) {
      // L자 통로, 폭 3
      const sx = Math.sign(x1 - x0) || 1;
      for (let x = x0; x !== x1 + sx; x += sx) m.carve(x - 1, y0 - 1, 3, 3);
      const sy = Math.sign(y1 - y0) || 1;
      for (let y = y0; y !== y1 + sy; y += sy) m.carve(x1 - 1, y - 1, 3, 3);
    }
    for (let i = 0; i < chain.length - 1; i++) corridor(cx(chain[i]), cy(chain[i]), cx(chain[i + 1]), cy(chain[i + 1]));
    // 마지막 방 → 보스방 (게이트)
    const bx = cx(boss), top = chain[chain.length - 1];
    corridor(cx(top), cy(top), bx, cy(top));
    for (let y = boss.y + boss.h; y <= cy(top); y++) m.carve(bx - 1, y, 3, 1);
    m.gate = { x: bx - 1, y: boss.y + boss.h + 1, w: 3 };
    for (let i = 0; i < 3; i++) m.set(bx - 1 + i, m.gate.y, T.GATE);

    // 열쇠방 통로 (가로)
    const ky = cy(keyRoom);
    const kx0 = cx(r2), kx1 = cx(keyRoom);
    const sx = Math.sign(kx1 - kx0);
    for (let x = kx0; x !== kx1 + sx; x += sx) m.carve(x, ky - 1, 1, 3);

    // 지역 기믹
    if (region.gimmick === 'vine') {
      // 열쇠방 입구를 덩굴 장벽으로 막는다 (2겹)
      const ex = sx > 0 ? keyRoom.x - 1 : keyRoom.x + keyRoom.w;
      for (let k = 0; k < 2; k++) for (let j = -1; j <= 1; j++) {
        const x = ex - sx * k;
        m.set(x, ky + j, T.VINE);
        m.vineHp.set(m.idx(x, ky + j), 2);
      }
    }
    if (region.gimmick === 'switch') {
      m.set(cx(keyRoom), cy(keyRoom), T.SWITCH);
      m.switchPos = { x: cx(keyRoom), y: cy(keyRoom) };
    }
    if (region.gimmick === 'ice') {
      for (const r of rooms.concat([boss])) {
        if (r.start) continue;
        for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) {
          const n = Math.sin(i * 0.7 + region.id) + Math.cos(j * 0.6) + rnd() * 0.8;
          if (n > 0.6 && m.get(i, j) === T.FLOOR) m.set(i, j, T.ICE);
        }
      }
      // 통로도 일부 빙판
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (m.get(i, j) === T.FLOOR && rnd() < 0.08) m.set(i, j, T.ICE);
    }
    if (region.theme === 'mine' || region.theme === 'hell') {
      for (const r of chain.slice(1)) {
        const px = r.x + ri(2, r.w - 4), py = r.y + ri(1, r.h - 3);
        m.carve(px, py, 2, 2, T.HAZARD);
        if (rnd() < 0.5) m.set(px + 2, py + 1, T.HAZARD);
      }
    }
    // 방 안 장애물 (나무/기둥)
    for (const r of chain.slice(1)) {
      const n = ri(1, 3);
      for (let k = 0; k < n; k++) {
        const x = r.x + ri(2, r.w - 3), y = r.y + ri(1, r.h - 2);
        if (Math.abs(x - cx(r)) <= 1 || Math.abs(y - cy(r)) <= 1) continue; // 통로 연결선은 비워둔다
        if (m.get(x, y) === T.FLOOR) m.set(x, y, T.WALL);
      }
    }
    // 보스방 기둥
    [[boss.x + 3, boss.y + 3], [boss.x + boss.w - 4, boss.y + 3], [boss.x + 3, boss.y + boss.h - 4], [boss.x + boss.w - 4, boss.y + boss.h - 4]].forEach(([x, y]) => m.set(x, y, T.WALL));

    // 포털 (시작방 중앙)
    m.set(cx(start), cy(start) - 1, T.PORTAL);
    m.portal = { x: cx(start), y: cy(start) - 1 };
    m.start = { x: cx(start) * TS + 8, y: (cy(start) + 1.5) * TS };

    // 상자 (열쇠)
    const chestPos = region.gimmick === 'switch'
      ? { x: keyRoom.x + 1, y: keyRoom.y + 1 }
      : { x: cx(keyRoom), y: cy(keyRoom) };
    m.chests.push({ x: chestPos.x * TS + 8, y: chestPos.y * TS + 12, r: 7, open: false, key: region.gimmick !== 'switch' });

    // 스폰 지점
    for (const r of chain.slice(1)) {
      const n = ri(3, 5);
      for (let k = 0; k < n; k++) {
        let tries = 0, x, y;
        do { x = r.x + 1 + rnd() * (r.w - 2); y = r.y + 1 + rnd() * (r.h - 2); tries++; } while (m.get(Math.floor(x), Math.floor(y)) !== T.FLOOR && tries < 20);
        m.spawns.push({ x: x * TS, y: y * TS, room: r });
      }
    }
    m.spawns.push({ x: (keyRoom.x + keyRoom.w / 2 + 1.5) * TS, y: (keyRoom.y + keyRoom.h / 2) * TS, elite: true, room: keyRoom });
    m.spawns.push({ x: (keyRoom.x + 2) * TS, y: (keyRoom.y + keyRoom.h - 1.5) * TS, room: keyRoom });
    m.bossSpawn = { x: bx * TS + 8, y: (boss.y + 4) * TS };
    // 채집 지점 (약초·광석·버섯) — 입장할 때마다 다시 자란다
    const kinds = R.GATHER_BY_THEME[region.theme] || ['herb'];
    m.nodes = [];
    for (const r of chain.slice(1).concat([keyRoom])) {
      const n = ri(1, 2);
      for (let k = 0; k < n; k++) {
        let x, y, t = 0;
        do { x = r.x + 1 + ri(0, r.w - 3); y = r.y + 1 + ri(0, r.h - 3); t++; } while ((m.get(x, y) !== T.FLOOR || Math.abs(x - cx(r)) <= 1 || Math.abs(y - cy(r)) <= 1) && t < 30);
        if (m.get(x, y) === T.FLOOR) m.nodes.push({ x: x * TS + 8, y: y * TS + 12, type: kinds[(rnd() * kinds.length) | 0], done: false });
      }
    }
    return m;
  };

  // ─── 심연의 탑: 한 층짜리 원형 투기장 ───────────────────
  R.buildArena = function (floor, theme) {
    const W = 22, H = 24;
    const m = new GameMap(W, H, theme, 'dungeon');
    const rnd = seeded(floor * 131 + 7);
    randomizeVariants(m, rnd);
    const cxm = W / 2, cym = H / 2 - 1;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const dx = (x + 0.5 - cxm) / 8.6, dy = (y + 0.5 - cym) / 9.4;
      if (dx * dx + dy * dy <= 1) m.set(x, y, T.FLOOR);
    }
    // 기둥 4개 (엄폐물)
    [[-4, -4], [3, -4], [-4, 3], [3, 3]].forEach(([ox, oy]) => m.set(Math.floor(cxm) + ox, Math.floor(cym) + oy, T.WALL));
    m.portal = { x: Math.floor(cxm), y: H - 5 };
    m.set(m.portal.x, m.portal.y, T.PORTAL);
    m.start = { x: m.portal.x * TS + 8, y: (m.portal.y - 1.5) * TS };
    m.center = { x: cxm * TS, y: cym * TS };
    m.bossSpawn = { x: cxm * TS, y: (cym - 5) * TS };
    m.bossRoom = { x: 3, y: 3, w: W - 6, h: H - 6 };
    m.nodes = [];
    m.exploreAll = true;
    return m;
  };
})();
