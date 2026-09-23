// 칸(타일) 이동: 바람의나라·영웅서기 제로식 4방향 칸 단위 이동
//  - 모든 캐릭터는 타일 중심에 서고, 상하좌우 한 칸씩 이동한다
//  - 이동 중에는 출발 칸과 도착 칸을 모두 점유해 서로 겹치지 않는다
'use strict';
(function () {
  const TS = R.TILE;
  const Gd = (R.Grid = {});
  Gd.DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  Gd.ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  Gd.cx = (tx) => tx * TS + 8;
  Gd.cy = (ty) => ty * TS + 12;
  Gd.tx = (x) => Math.floor(x / TS);
  Gd.ty = (y) => Math.floor(y / TS);
  Gd.dirOf = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up');
  Gd.dirFromAng = (a) => Gd.dirOf(Math.cos(a), Math.sin(a));

  // 엔티티를 타일에 정렬 (gx, gy = 논리 칸)
  Gd.place = function (e, tx, ty) {
    e.gx = tx; e.gy = ty; e.px = tx; e.py = ty;
    e.x = Gd.cx(tx); e.y = Gd.cy(ty);
    e.step = null;
  };

  // 점유 판정: 벽, NPC, 닫힌 상자, 다른 캐릭터(출발·도착 칸)
  Gd.blocked = function (tx, ty, self, opt = {}) {
    const m = G.map;
    if (!m || R.isSolidTile(m.get(tx, ty))) return true;
    if (opt.noUnits) return false;
    for (const n of m.npcs) if (Gd.tx(n.x) === tx && Gd.ty(n.y) === ty) return true;
    for (const c of m.chests) if (!c.open && Gd.tx(c.x) === tx && Gd.ty(c.y) === ty) return true;
    if (m.shrines) for (const o of m.shrines) if (o.tx === tx && o.ty === ty) return true;
    const p = G.player;
    if (p && p !== self && !p.dead && ((p.gx === tx && p.gy === ty) || (p.step && p.px === tx && p.py === ty))) return true;
    for (const o of G.mobs) {
      if (o === self || o.dead) continue;
      if (o.boss) { if (Math.hypot(Gd.cx(tx) - o.x, Gd.cy(ty) - o.y) < o.r * 0.9) return true; continue; }
      if ((o.gx === tx && o.gy === ty) || (o.step && o.px === tx && o.py === ty)) return true;
    }
    return false;
  };

  // 한 칸 이동 시작 (막혀 있으면 false)
  Gd.tryStep = function (e, dir, dur, opt) {
    const [dx, dy] = Gd.DIRS[dir];
    const nx = e.gx + dx, ny = e.gy + dy;
    if (Gd.blocked(nx, ny, e, opt)) return false;
    e.px = e.gx; e.py = e.gy;
    e.gx = nx; e.gy = ny;
    e.step = { fx: e.x, fy: e.y, t: 0, dur: Math.max(0.05, dur), dir };
    return true;
  };

  // 이동 보간. 도착하면 true
  Gd.update = function (e, dt) {
    const s = e.step;
    if (!s) return false;
    s.t += dt;
    const k = Math.min(1, s.t / s.dur);
    const tx = Gd.cx(e.gx), ty = Gd.cy(e.gy);
    e.x = s.fx + (tx - s.fx) * k;
    e.y = s.fy + (ty - s.fy) * k;
    if (k >= 1) { e.step = null; e.px = e.gx; e.py = e.gy; return true; }
    return false;
  };

  // 자유 이동(돌진·넉백·순간이동) 후 가장 가까운 빈 칸으로 정렬
  Gd.snap = function (e, opt) {
    const bx = Gd.tx(e.x), by = Gd.ty(e.y - 4);
    let best = null, bd = 1e9;
    for (let r = 0; r <= 4 && !best; r++) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        const tx = bx + i, ty = by + j;
        if (Gd.blocked(tx, ty, e, opt)) continue;
        const d = Math.hypot(Gd.cx(tx) - e.x, Gd.cy(ty) - e.y);
        if (d < bd) { bd = d; best = [tx, ty]; }
      }
    }
    if (!best) best = [bx, by];
    e.gx = e.px = best[0]; e.gy = e.py = best[1];
    e.step = { fx: e.x, fy: e.y, t: 0, dur: Math.min(0.12, bd / 160 + 0.01), dir: e.step ? e.step.dir : null };
  };

  // 두 칸 사이 직선(행/열) 시야
  Gd.lineClear = function (ax, ay, bx, by) {
    if (ax !== bx && ay !== by) return false;
    const sx = Math.sign(bx - ax), sy = Math.sign(by - ay);
    let x = ax + sx, y = ay + sy;
    while (x !== bx || y !== by) {
      if (R.isSolidTile(G.map.get(x, y))) return false;
      x += sx; y += sy;
    }
    return true;
  };

  // 길찾기 (BFS): goal(tx, ty) 를 만족하는 가장 가까운 칸까지의 첫 걸음 방향. 없으면 null
  //  - 가까운(3칸 이내) 캐릭터는 피해 가고, 먼 캐릭터는 도착할 즈음 비켜 있을 테니 무시한다
  Gd.pathDir = function (e, goal, maxNodes = 1600) {
    if (goal(e.gx, e.gy)) return 'here';
    const seen = new Set([e.gx + ',' + e.gy]);
    const q = [[e.gx, e.gy, null]];
    const order = ['up', 'down', 'left', 'right'];
    for (let h = 0; h < q.length && seen.size < maxNodes; h++) {
      const [x, y, first] = q[h];
      for (const d of order) {
        const [dx, dy] = Gd.DIRS[d];
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (seen.has(k)) continue;
        seen.add(k);
        if (Gd.blocked(nx, ny, e, { noUnits: Math.abs(nx - e.gx) + Math.abs(ny - e.gy) > 3 })) continue;
        const f = first || d;
        if (goal(nx, ny)) return f;
        q.push([nx, ny, f]);
      }
    }
    return null;
  };
})();
