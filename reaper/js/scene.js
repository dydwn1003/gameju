// ===== 수확 화면: 화면 3배 너비의 넓은 맵, 저해상도 도트를 정수배로 키워 그린다 =====
// 맵 구성: [주막 · 의뢰 게시판 · 노점] — 들판(혼령) — [도감 비석 · 꽃밭 · 파견 나루]
const REGIONS = [
  { id: 'village', name: '이승 마을', sky: ['#07061a', '#110f33', '#1e1a4d', '#2e2563', '#463575'], halo: '#8a7ac0',
    mt: ['#191637', '#221d47'], rim: '#4a3f7e', ground: ['#1a2027', '#202a2c', '#263330'], tuft: '#3b4d40', path: ['#3a3631', '#4a443a'], fog: '#8f88c8' },
  { id: 'market', name: '저승 장터', sky: ['#0a0614', '#1a0f2a', '#2e1a40', '#4a2a52', '#6a3a5a'], halo: '#e0a0c0',
    mt: ['#1a1026', '#26163a'], rim: '#6a4070', ground: ['#1e1a22', '#262028', '#2e262e'], tuft: '#4a3a40', path: ['#4a3e38', '#5a4c42'], fog: '#e0b0d0' },
  { id: 'pass', name: '서낭당 고갯길', sky: ['#04100f', '#0a1f22', '#123236', '#1d4a49', '#2f625a'], halo: '#7ab0a0',
    mt: ['#0b1d1d', '#123029'], rim: '#3f7564', ground: ['#14211b', '#1a2b21', '#213527'], tuft: '#3d5b3a', path: ['#3b3a2c', '#4b4936'], fog: '#9fd0c0' },
  { id: 'bamboo', name: '대숲 오솔길', sky: ['#030c08', '#08180f', '#0f2a1a', '#1a4028', '#2a5a38'], halo: '#a0d0a0',
    mt: ['#071610', '#0c2216'], rim: '#3a6a44', ground: ['#121c14', '#17241a', '#1d2c20'], tuft: '#3a5a3a', path: ['#3a3a2a', '#4a4834'], fog: '#b0e0b0' },
  { id: 'river', name: '삼도천', sky: ['#05050f', '#0e0d24', '#1c1940', '#33295c', '#55407a'], halo: '#b098d8',
    mt: ['#120f27', '#1b1638'], rim: '#55467e', ground: ['#16141f', '#1c1a28', '#232031'], tuft: '#3a3550', path: ['#3a3446', '#4a4258'], fog: '#c0b0e8', river: ['#1a2a5a', '#24407a', '#5a7ac0'] },
  { id: 'field', name: '망각의 들판', sky: ['#080a14', '#121a2a', '#1e2a40', '#2e3e58', '#4a5a72'], halo: '#d0e0f0',
    mt: ['#121a26', '#1a2434'], rim: '#5a6a84', ground: ['#1a1e26', '#20262e', '#283038'], tuft: '#4a5a6a', path: ['#3e4048', '#4e5058'], fog: '#e0e8f8' },
  { id: 'gate', name: '저승문', sky: ['#0a0206', '#1e050e', '#360a17', '#561322', '#7a2230'], halo: '#e07060',
    mt: ['#1c050c', '#2a0a12'], rim: '#7a2a2a', ground: ['#1a1114', '#22151a', '#2a1a1f'], tuft: '#4a2a2a', path: ['#3e2e2e', '#4e3a38'], fog: '#e09090' },
  { id: 'hell', name: '화탕지옥', sky: ['#0c0202', '#240604', '#420c06', '#6a1a08', '#9a3010'], halo: '#ffa040',
    mt: ['#1e0604', '#2e0a06'], rim: '#a04018', ground: ['#1e1210', '#281814', '#321e18'], tuft: '#5a2a1a', path: ['#4a2e24', '#5a3a2c'], fog: '#ffb080' },
  { id: 'palace', name: '명부전', sky: ['#06030c', '#140a24', '#26143a', '#3e2248', '#5e3a4a'], halo: '#e8c070',
    mt: ['#140a1e', '#1e1029'], rim: '#6a4a5a', ground: ['#1c1622', '#241c2a', '#2c2232'], tuft: '#4a3a4a', path: ['#4a3c42', '#5c4a4e'], fog: '#e8c8a0' },
];
const POI_LABEL = { stall: '노점', stele: '도감 비석', garden: '꽃밭', n_jumo: '주모 · 주막', n_elder: '할아버지 · 의뢰', n_gob: '도깨비 상인', n_mudang: '무당 · 운세', n_kkachi: '까치 · 우편', n_sansin: '산신령 · 공양', n_judge: '판관 · 승진', n_boat: '뱃사공 · 파견' };

const Scene = (() => {
  let cv, g, mini, mg, W = 130, H = 150, S = 3, GY = 90, WW = 390, region = 0, kind = 'm', rank = 0;
  let skyC = null, mtC = null, groundC = null, camX = 0, follow = true, followAt = 0;
  let hooks = {}, cfg = { spawn: 2, maxSouls: 6, walk: 20, reap: 0.8, minions: 0, mWalk: 12, mReap: 1.4, roll: () => ({ tier: 0, sp: -1 }), speed: 1, merchant: false };
  const reaper = { x: 195, y: 120, st: 'idle', t: 0, f: 0, face: 1, target: null };
  let minions = [], souls = [], parts = [], flies = [], wraith = null, spawnT = 0, time = 0, stars = [], lanterns = [], shake = 0;
  let POIS = [], PLOTS = [], critters = [], pet = null, petData = null, ghosts = [];
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => (v + 0.5) / 16));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const R = () => REGIONS[region];
  const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const clampFeet = y => Math.max(GY + 14, Math.min(H - 3, y));
  const FIELD0 = () => 126, FIELD1 = () => WW - 122;
  let NPCS = [];

  // ---------- 배치 (맵 = 화면 2.4배) ----------
  // 왼쪽: 주막 · 게시판 · 노점 · 무당 점집 / 가운데: 들판 / 오른쪽: 산신 제단 · 판관 · 도감 비석 · 꽃밭 · 파견 나루
  function layout() {
    const by = GY + 13;
    POIS = [
      { id: 'tavern', x: 2, y: by - 28, w: 42, h: 30 },
      { id: 'board', x: 48, y: by - 18, w: 16, h: 20 },
      { id: 'stall', x: 68, y: by - 22, w: 28, h: 24 },
      { id: 'stele', x: WW - 104, y: by - 20, w: 10, h: 22 },
      { id: 'garden', x: WW - 82, y: GY + 8, w: 52, h: 40 },
      { id: 'gate', x: WW - 24, y: by - 26, w: 20, h: 28 },
    ];
    PLOTS = [0, 1, 2, 3, 4, 5].map(i => ({ x: WW - 72 + (i % 3) * 16, y: GY + 26 + Math.floor(i / 3) * 16 }));
    NPCS = [
      { id: 'jumo', x: 24, y: by + 7 }, { id: 'elder', x: 58, y: by + 7, face: -1 }, { id: 'gob', x: 84, y: by + 8, face: -1, cond: 'merchant' },
      { id: 'mudang', x: 112, y: by + 7 }, { id: 'kkachi', x: 56, y: by - 20, perch: 1 },
      { id: 'sansin', x: WW - 112, y: by + 7, face: -1 }, { id: 'judge', x: WW - 92, y: by + 8, face: -1 }, { id: 'boat', x: WW - 14, y: by + 7, face: -1 },
    ];
  }

  // ---------- 배경 굽기 ----------
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function pix(c) {
    const x2 = c.getContext('2d'), im = x2.createImageData(c.width, c.height), d = im.data, w = c.width, h = c.height;
    return {
      x2, d, set(x, y, col) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; },
      put() { x2.putImageData(im, 0, 0); },
    };
  }
  function bake() {
    const P = R(); layout();
    // 하늘 (고정)
    skyC = mkCanvas(W, GY + 1);
    let px = pix(skyC); const sky = P.sky.map(hex), n = sky.length;
    for (let y = 0; y <= GY; y++) { const f = (y / GY) * (n - 1); for (let x = 0; x < W; x++) px.set(x, y, sky[Math.max(0, Math.min(n - 1, Math.floor(f + BAYER[y & 3][x & 3] - 0.25)))]); }
    const mx = Math.round(W * 0.76), my = Math.round(GY * 0.24), mr = 9, halo = hex(P.halo), moonC = [hex('#fff4d6'), hex('#f0dcae'), hex('#d4bd8a')];
    for (let y = my - mr - 9; y <= my + mr + 9; y++) for (let x = mx - mr - 9; x <= mx + mr + 9; x++) {
      const dd = Math.hypot(x - mx, y - my);
      if (dd <= mr) { const sh = Math.hypot(x - mx + 3, y - my + 3) / mr; px.set(x, y, moonC[sh > 1.15 ? 2 : sh > 0.85 ? 1 : 0]); }
      else if (dd <= mr + 8 && BAYER[y & 3][x & 3] < (1 - (dd - mr) / 8) * 0.55 && x >= 0 && y >= 0 && x < W) { const i = (y * W + x) * 4; px.d[i] = (px.d[i] + halo[0]) >> 1; px.d[i + 1] = (px.d[i + 1] + halo[1]) >> 1; px.d[i + 2] = (px.d[i + 2] + halo[2]) >> 1; }
    }
    [[-3, -2, 2], [2, 2, 1.5], [3, -4, 1], [-1, 4, 1]].forEach(([cx, cy, r]) => { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) <= r) px.set(mx + cx + x, my + cy + y, moonC[1]); });
    const r1 = seeded(7 + region); stars = [];
    for (let i = 0; i < W * GY / 90; i++) { const x = Math.floor(r1() * W), y = Math.floor(r1() * GY * 0.75); if (Math.hypot(x - mx, y - my) < mr + 10) continue; const big = r1() < 0.12; stars.push({ x, y, big, ph: r1() * 6 }); px.set(x, y, hex(big ? '#fff6d0' : '#9a92c8')); }
    px.put();
    // 산 (느린 시차)
    const MW = W + Math.ceil((WW - W) * 0.35);
    mtC = mkCanvas(MW, GY + 1); px = pix(mtC);
    const ridge = (seed, base, amp, col, rim) => { const C = hex(col), RC = hex(rim); let prev = 0; for (let x = 0; x < MW; x++) { const t = x + seed * 50; const nn = Math.sin(t * 0.045 + seed) * 0.5 + Math.sin(t * 0.11 + seed * 2) * 0.3 + Math.abs(Math.sin(t * 0.23 + seed * 3)) * 0.35; const top = Math.round(base - amp * nn); for (let y = top; y <= GY; y++) px.set(x, y, C); if (x > 0 && top <= prev) px.set(x, top, RC); prev = top; } };
    ridge(region * 3 + 1, GY * 0.62, GY * 0.22, P.mt[0], P.rim);
    ridge(region * 3 + 2, GY * 0.86, GY * 0.16, P.mt[1], P.rim);
    px.put();
    // 땅 + 소품 (맵 전체)
    groundC = mkCanvas(WW, H); px = pix(groundC);
    const gr = P.ground.map(hex);
    for (let y = GY; y < H; y++) { const f = ((y - GY) / (H - GY)) * (gr.length - 1); for (let x = 0; x < WW; x++) px.set(x, y, gr[Math.max(0, Math.min(gr.length - 1, Math.floor(f + BAYER[y & 3][x & 3] - 0.25)))]); }
    for (let x = 0; x < WW; x++) if ((x + region) % 3) px.set(x, GY, hex(P.rim));
    const pa = P.path.map(hex), py0 = Math.round(GY + (H - GY) * 0.6), py1 = Math.round(GY + (H - GY) * 0.76);
    for (let y = py0 - 3; y <= py1 + 3; y++) for (let x = 0; x < WW; x++) {
      const wob = Math.round(Math.sin(x * 0.05 + region) * 2), yy = y - wob, edge = yy < py0 ? (py0 - yy) / 4 : yy > py1 ? (yy - py1) / 4 : 0;
      if (edge >= 1 || (edge && BAYER[y & 3][x & 3] < edge)) continue;
      px.set(x, y, pa[BAYER[y & 3][x & 3] > 0.85 ? 1 : 0]);
    }
    if (P.river) {
      const rv = P.river.map(hex), ry0 = GY + 2, ry1 = Math.round(GY + (H - GY) * 0.3);
      for (let y = ry0; y <= ry1; y++) for (let x = FIELD0() - 10; x < FIELD1() + 10; x++) px.set(x, y, rv[(y - ry0) < 2 ? 0 : (Math.sin(x * 0.3 + y * 1.7) > 0.85 ? 2 : (BAYER[y & 3][x & 3] > 0.6 ? 1 : 0))]);
    }
    if (P.id === 'hell') { // 용암 웅덩이
      const lava = [hex('#ff6a10'), hex('#ffb030'), hex('#c02a08')], r3 = seeded(77);
      for (let k = 0; k < 4; k++) { const cx = FIELD0() + 20 + r3() * (FIELD1() - FIELD0() - 40), cy = GY + 6 + r3() * 8, rw = 10 + r3() * 8; for (let y = -3; y <= 3; y++) for (let x = -rw; x <= rw; x++) if ((x * x) / (rw * rw) + (y * y) / 9 <= 1) px.set(cx + x, cy + y, lava[(x * x) / (rw * rw) + (y * y) / 9 > 0.7 ? 2 : BAYER[(y + 8) & 3][(x + 32) & 3] > 0.7 ? 1 : 0]); lanterns.push({ x: cx, y: cy, col: '#ff7a20', r: 9, a: 0.18 }); }
    }
    const r2 = seeded(31 + region), tuft = hex(P.tuft);
    for (let i = 0; i < WW / 4; i++) { const x = Math.floor(r2() * WW), y = Math.floor(GY + 3 + r2() * (H - GY - 4)); if (y >= py0 - 2 && y <= py1 + 3) continue; px.set(x, y, tuft); px.set(x - 1, y - 1, tuft); px.set(x + 1, y - 1, tuft); }
    if (P.id === 'field') { const fl = [hex('#e8f0ff'), hex('#a8c8ff'), hex('#ffffff')]; for (let i = 0; i < WW / 2; i++) { const x = Math.floor(r2() * WW), y = Math.floor(GY + 3 + r2() * (H - GY - 4)); if (y >= py0 - 2 && y <= py1 + 3) continue; px.set(x, y, fl[i % 3]); } }
    px.put();
    lanterns = lanterns.filter(l => l.col === '#ff7a20');
    const x2 = groundC.getContext('2d');
    decor(x2, P);
    base(x2, P);
  }
  const rectOn = x2 => (x, y, w, h, col) => { x2.fillStyle = col; x2.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // 지역 장식: 들판 구간에 반복 배치
  function decor(x2, P) {
    const rect = rectOn(x2), rr = seeded(101 + region), F0 = FIELD0(), F1 = FIELD1(), by = GY + 13;
    const lamp = (x, y, gold) => { rect(x + 3, y + 9, 1, by - y - 9 + 6, '#3a2414'); x2.drawImage(SP.lantern(gold ? 2 : 1), x, y); lanterns.push({ x: x + 3, y: y + 5, col: gold ? '#ffcf6a' : '#ff8a6a', r: 8, a: 0.22 }); };
    const along = (step, fn) => { for (let x = F0 + 6; x < F1 - 6; x += step + Math.floor(rr() * step * 0.6)) fn(x); };
    // 먼 실루엣 (맵 전체)
    const far = { village: 'house', market: 'tent', pass: 'pine', bamboo: 'bamboo', river: 'reed', field: 'deadtree', gate: 'pillar', hell: 'rock', palace: 'roof' }[P.id];
    for (let x = 0; x < WW; x += 14 + Math.floor(rr() * 18)) farShape(x2, far, x, GY + 1);
    if (P.id === 'village') {
      along(70, x => { if (rr() < 0.5) thatched(x2, x, by + 2, 30, false); else { persimmon(x2, x + 10, by + 4); } });
      along(55, x => { x2.drawImage(SP.jangseung(), x, GY - 6); });
      along(80, x => lamp(x, GY - 6));
      for (let x = F0; x < F1; x += 4) { rect(x, GY + 4, 4, 3, '#2a2a33'); rect(x + 1, GY + 4, 2, 1, '#3e3d4a'); }
    } else if (P.id === 'market') {
      along(46, x => tent(x2, x, by + 2, ['#c03040', '#3060b0', '#d0a030', '#409050'][Math.floor(rr() * 4)]));
      along(60, x => jars(x2, x, by + 6));
      for (let x = F0; x < F1; x += 30) { rect(x, GY - 20, 1, 34, '#3a2414'); for (let k = 1; k < 30; k += 5) { const yy = GY - 18 + Math.sin((k / 30) * Math.PI) * 6; rect(x + k, yy, 2, 2, k % 10 < 5 ? '#ff6a5a' : '#ffcf6a'); if (k % 10 === 1) lanterns.push({ x: x + k, y: yy, col: '#ff8a6a', r: 4, a: 0.3 }); } }
    } else if (P.id === 'pass') {
      along(90, x => tree(x2, x, by + 4));
      along(60, x => cairn(x2, x, by + 6));
      along(70, x => x2.drawImage(SP.jangseung(), x, GY - 4));
      along(100, x => lamp(x, GY - 6));
    } else if (P.id === 'bamboo') {
      for (let x = F0; x < F1; x += 3 + Math.floor(rr() * 4)) bamboo(x2, x, by + 4, 40 + rr() * 30, rr() < 0.3);
      along(110, x => lamp(x, GY - 4));
    } else if (P.id === 'river') {
      along(110, x => x2.drawImage(SP.boat(), x, GY + 3));
      for (let x = F0; x < F1; x += 3) if ((x * 7) % 11 < 4) { const h = 6 + (x * 13) % 7, ry = GY + (H - GY) * 0.32; rect(x, ry - h, 1, h, '#4a4060'); rect(x - 1, ry - h, 1, 2, '#6a5a80'); }
      for (let x = F0; x < F1; x += 18) lanterns.push({ x, y: GY - 4, col: '#ffcf6a', r: 3, a: 0.5, small: 1 });
    } else if (P.id === 'field') {
      along(50, x => statue(x2, x, by + 4));
      along(80, x => deadTree(x2, x, by + 2));
      along(120, x => lamp(x, GY - 6));
    } else if (P.id === 'gate') {
      hongsal(x2, Math.round((F0 + F1) / 2), by - 8);
      along(60, x => { stoneLamp(x2, x, by + 4); lanterns.push({ x: x + 4, y: by - 10, col: '#ffb040', r: 6, a: 0.25 }); });
      for (let x = F0; x < F1; x += 24) { rect(x, GY + 10, 9, 1, '#120a0c'); rect(x + 4, GY + 11, 6, 1, '#120a0c'); }
    } else if (P.id === 'hell') {
      along(70, x => { cauldron(x2, x, by + 6); lanterns.push({ x: x + 7, y: by - 4, col: '#ff7a20', r: 8, a: 0.25 }); });
      along(45, x => rock(x2, x, by + 4));
    } else if (P.id === 'palace') {
      palace(x2, Math.round((F0 + F1) / 2), by - 2);
      along(55, x => lamp(x, GY - 4, true));
    }
  }
  function farShape(x2, kind, x, y) {
    const rect = rectOn(x2), c = R().mt[1];
    if (kind === 'house') { rect(x, y - 6, 12, 6, c); for (let i = 0; i < 4; i++) rect(x - 1 + i, y - 8 - i + 3, 14 - i * 2, 1, c); }
    else if (kind === 'tent') { for (let i = 0; i < 6; i++) rect(x + 6 - i, y - 10 + i, i * 2 + 1, 1, c); rect(x + 1, y - 4, 11, 4, c); }
    else if (kind === 'pine') { for (let i = 0; i < 12; i++) rect(x + 5 - Math.floor(i / 2), y - 14 + i, Math.floor(i / 2) * 2 + 1, 1, c); rect(x + 5, y - 2, 1, 2, c); }
    else if (kind === 'bamboo') { for (let k = 0; k < 3; k++) rect(x + k * 4, y - 40, 2, 40, c); }
    else if (kind === 'reed') { rect(x, y - 5, 1, 5, c); rect(x + 3, y - 7, 1, 7, c); }
    else if (kind === 'deadtree') { rect(x + 4, y - 14, 1, 14, c); rect(x + 1, y - 10, 3, 1, c); rect(x + 5, y - 8, 4, 1, c); }
    else if (kind === 'pillar') { rect(x, y - 16, 3, 16, c); rect(x - 1, y - 17, 5, 1, c); }
    else if (kind === 'rock') { rect(x, y - 5, 10, 5, c); rect(x + 2, y - 9, 5, 4, c); }
    else if (kind === 'roof') { rect(x, y - 5, 16, 5, c); rect(x - 2, y - 7, 20, 2, c); }
  }
  function thatched(x2, x, y, w, far) {
    const rect = rectOn(x2), h = Math.round(w * 0.66), rh = Math.round(w * 0.3);
    rect(x + 2, y - h + rh - 1, w - 4, h - rh + 1, '#c9b894'); rect(x + 2, y - h + rh - 1, w - 4, 1, '#8a7a5a'); rect(x + 2, y - 1, w - 4, 1, '#6e604a');
    for (let i = 4; i < w - 4; i += 7) rect(x + i, y - h + rh, 1, h - rh, '#5a3a22');
    const wx = x + Math.round(w * 0.2), wy = y - h + rh + 2;
    rect(wx, wy, 7, 5, '#ffcf6a'); rect(wx + 3, wy, 1, 5, '#b07a2a'); rect(wx, wy + 2, 7, 1, '#b07a2a');
    rect(x + w - 11, y - 8, 6, 7, '#5a3a22'); rect(x + w - 10, y - 7, 4, 6, '#7a5232');
    for (let i = 0; i < rh; i++) { const ww = (w + 4) * Math.sqrt(1 - Math.pow(1 - i / rh, 2)); rect(x - 2 + (w + 4 - ww) / 2, y - h + i, ww, 1, i % 3 === 0 ? '#a07a3a' : i < 2 ? '#e0bf78' : '#c9a256'); }
    rect(x - 2, y - h + rh - 1, w + 4, 1, '#6e5226');
    for (let i = 1; i < 4; i++) rect(x + (w * i) / 4, y - h + 1, 1, rh - 2, '#8a6630');
    lanterns.push({ x: wx + 3, y: wy + 2, col: '#ffcf6a', r: 5, a: 0.18 });
  }
  function persimmon(x2, x, y) {
    const rect = rectOn(x2); rect(x - 1, y - 18, 3, 18, '#3a2a20'); rect(x - 5, y - 14, 4, 1, '#3a2a20'); rect(x + 2, y - 12, 4, 1, '#3a2a20');
    [[0, -22, 7], [-6, -17, 5], [6, -16, 5]].forEach(([dx, dy, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) rect(x + dx + xx, y + dy + yy, 1, 1, xx + yy < -r * 0.5 ? '#3a5a2a' : '#25401e'); });
    [[-3, -21], [2, -24], [4, -18], [-6, -16], [6, -14], [0, -18]].forEach(([dx, dy]) => rect(x + dx, y + dy, 2, 2, '#ff8a2a'));
  }
  function tent(x2, x, y, col) {
    const rect = rectOn(x2); rect(x, y - 16, 1, 16, '#3a2414'); rect(x + 22, y - 16, 1, 16, '#3a2414');
    for (let i = 0; i < 5; i++) rect(x - 2 + i, y - 20 + i, 27 - i * 2, 1, i % 2 ? col : '#efe6d8');
    for (let k = 0; k < 27; k += 4) rect(x - 2 + k, y - 15, 2, 2, col);
    rect(x + 1, y - 7, 21, 2, '#5a3a22'); rect(x + 3, y - 9, 3, 2, '#e0a040'); rect(x + 9, y - 10, 4, 3, '#60a0e0'); rect(x + 16, y - 9, 3, 2, '#e05050');
  }
  function jars(x2, x, y) { const rect = rectOn(x2); [[0, 8], [7, 6], [12, 7]].forEach(([dx, h]) => { rect(x + dx, y - h, 6, h, '#5a3020'); rect(x + dx + 1, y - h, 1, h, '#7a4a30'); rect(x + dx - 1, y - h, 8, 1, '#3a1a10'); }); }
  function tree(x2, x, y) {
    const rect = rectOn(x2); rect(x - 2, y - 26, 5, 26, '#3a2a20'); rect(x - 2, y - 26, 1, 26, '#5a4030');
    [[0, -34, 11], [-8, -28, 8], [8, -27, 8], [-4, -40, 7], [6, -38, 7]].forEach(([dx, dy, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) rect(x + dx + xx, y + dy + yy, 1, 1, xx + yy < -r * 0.6 ? '#2f5a3a' : '#1e3d29'); });
    const cols = ['#e04050', '#f0c040', '#40a0e0', '#f0f0f0', '#50c060']; for (let i = 0; i < 9; i++) rect(x - 9 + i * 2, y - 24 + (i % 3), 1, 4 + (i % 3), cols[i % 5]); rect(x - 10, y - 25, 19, 1, '#d8c8a0');
  }
  function cairn(x2, x, y) { const rect = rectOn(x2); [[0, 0, 9], [-5, 0, 6], [5, 1, 6], [-2, -4, 7], [2, -8, 5], [0, -11, 3]].forEach(([dx, dy, w]) => { rect(x + dx - w / 2, y + dy - 4, w, 4, '#4a4a52'); rect(x + dx - w / 2, y + dy - 4, w, 1, '#6a6a76'); }); }
  function bamboo(x2, x, y, h, front) { const rect = rectOn(x2), c = front ? '#4a9a50' : '#2a5a34', j = front ? '#2a6a30' : '#1a3a22'; rect(x, y - h, 2, h, c); for (let k = 6; k < h; k += 8) rect(x - (k % 16 ? 0 : 2), y - k, 4, 1, j); if (front) rect(x + 2, y - h + 4, 3, 1, '#6aba60'); }
  function statue(x2, x, y) { const rect = rectOn(x2); rect(x, y - 14, 6, 14, '#5a6070'); rect(x + 1, y - 14, 1, 14, '#7a8090'); rect(x - 1, y - 17, 8, 3, '#4a5060'); rect(x + 1, y - 12, 1, 1, '#2a2e38'); rect(x + 4, y - 12, 1, 1, '#2a2e38'); rect(x - 1, y, 8, 1, '#3a3e48'); }
  function deadTree(x2, x, y) { const rect = rectOn(x2), c = '#3a3a44'; rect(x, y - 22, 2, 22, c); rect(x - 6, y - 16, 6, 1, c); rect(x - 6, y - 19, 1, 3, c); rect(x + 2, y - 13, 6, 1, c); rect(x + 7, y - 17, 1, 4, c); rect(x - 2, y - 24, 1, 3, c); }
  function hongsal(x2, cx, y) {
    const rect = rectOn(x2), w = 46, top = y - 40;
    rect(cx - w / 2, top, 3, 40, '#b02a2a'); rect(cx + w / 2 - 3, top, 3, 40, '#b02a2a'); rect(cx - w / 2 - 3, top + 6, w + 6, 3, '#b02a2a'); rect(cx - w / 2 - 3, top + 6, w + 6, 1, '#e05050');
    for (let i = -w / 2 + 4; i < w / 2 - 3; i += 3) { rect(cx + i, top - 4, 1, 10, '#b02a2a'); rect(cx + i, top - 5, 1, 1, '#f0c040'); }
    rect(cx - 3, top + 1, 6, 6, '#1a1a40'); rect(cx - 3, top + 1, 6, 3, '#c03030');
  }
  function stoneLamp(x2, x, y) { const rect = rectOn(x2); rect(x, y - 2, 8, 2, '#4a4048'); rect(x + 2, y - 10, 4, 8, '#5a5058'); rect(x - 1, y - 12, 10, 2, '#6a6070'); rect(x + 1, y - 17, 6, 5, '#5a5058'); rect(x + 2, y - 16, 4, 3, '#ffb040'); rect(x - 1, y - 19, 10, 2, '#6a6070'); }
  function cauldron(x2, x, y) { const rect = rectOn(x2); rect(x + 1, y - 4, 12, 4, '#ff6a10'); rect(x + 3, y - 3, 8, 2, '#ffd040'); rect(x, y - 12, 14, 8, '#1a1418'); rect(x - 1, y - 13, 16, 2, '#3a3038'); rect(x + 2, y - 11, 2, 5, '#3a3038'); rect(x + 2, y - 15, 10, 2, '#ff8a3a'); }
  function rock(x2, x, y) { const rect = rectOn(x2); rect(x, y - 6, 12, 6, '#3a2420'); rect(x + 2, y - 10, 6, 4, '#4a2e28'); rect(x + 3, y - 10, 2, 1, '#6a4038'); rect(x + 8, y - 3, 3, 1, '#ff6a20'); }
  function palace(x2, cx, y) {
    const rect = rectOn(x2), w = 70;
    for (let i = 0; i < 4; i++) rect(cx - 14 + i * 2, y - 2 - i * 2, 28 - i * 4, 2, i % 2 ? '#5a4a52' : '#6a5a62');
    rect(cx - w / 2, y - 10, w, 2, '#4a3c44');
    for (let i = 0; i < 6; i++) { const px = cx - w / 2 + 5 + i * ((w - 10) / 5); rect(px - 1, y - 30, 3, 20, '#9a2a2a'); rect(px - 1, y - 30, 1, 20, '#c84040'); }
    rect(cx - 8, y - 26, 16, 16, '#3a1a1a'); rect(cx - 7, y - 25, 14, 15, '#ffcf6a');
    rect(cx - w / 2, y - 34, w, 4, '#2a6a5a'); for (let i = 0; i < w; i += 4) rect(cx - w / 2 + i, y - 33, 2, 2, '#e0a040');
    for (let i = 0; i < 12; i++) { const ww = w + 16 - i * 4 + (i < 3 ? (3 - i) * 2 : 0); rect(cx - ww / 2, y - 35 - i, ww, 1, i === 0 ? '#14101c' : i % 2 ? '#2a2236' : '#342a44'); }
    rect(cx - 7, y - 44, 14, 6, '#1a1020'); rect(cx - 6, y - 43, 12, 4, '#e0b040');
    lanterns.push({ x: cx, y: y - 18, col: '#ffcf6a', r: 12, a: 0.2 });
  }
  // 내 근거지: 주막 · 게시판 · 노점 · 비석 · 꽃밭 · 나루
  function base(x2) {
    const rect = rectOn(x2), by = GY + 13;
    // 주막
    thatched(x2, 4, by, 38, false);
    rect(42, by - 32, 1, 32, '#3a2414'); rect(36, by - 32, 6, 8, '#e04040'); rect(37, by - 31, 4, 1, '#ffffff'); rect(38, by - 29, 2, 3, '#ffffff');
    rect(2, by + 1, 12, 2, '#7a5232'); rect(3, by + 3, 1, 3, '#5a3a22'); rect(12, by + 3, 1, 3, '#5a3a22');
    // 의뢰 게시판
    rect(49, by - 18, 2, 20, '#5a3a22'); rect(62, by - 18, 2, 20, '#5a3a22'); rect(48, by - 20, 17, 2, '#3a2414');
    rect(50, by - 17, 13, 11, '#7a5232'); rect(51, by - 16, 4, 5, '#efe6d8'); rect(56, by - 15, 5, 4, '#efe6d8'); rect(52, by - 10, 6, 3, '#efe6d8'); rect(59, by - 10, 3, 3, '#ffd34a');
    // 노점
    tent(x2, 70, by + 2, '#7a4ab0');
    // 무당 점집: 오방색 깃발 + 상
    rect(102, by - 22, 1, 24, '#3a2414'); rect(122, by - 22, 1, 24, '#3a2414');
    ['#e04050', '#3a7ae0', '#f0c040', '#f0f0f0', '#40a060'].forEach((c, i) => { rect(103 + i * 4, by - 21, 3, 6, c); });
    rect(102, by - 22, 21, 1, '#d8c8a0');
    rect(104, by - 2, 16, 2, '#8a2a2a'); rect(105, by, 1, 3, '#5a1a1a'); rect(118, by, 1, 3, '#5a1a1a');
    rect(106, by - 5, 1, 3, '#f0f0f0'); rect(106, by - 6, 1, 1, '#ffd34a'); rect(116, by - 5, 1, 3, '#f0f0f0'); rect(116, by - 6, 1, 1, '#ffd34a');
    rect(110, by - 4, 4, 2, '#e0c060');
    lanterns.push({ x: 106, y: by - 6, col: '#ffcf6a', r: 4, a: 0.3 }, { x: 116, y: by - 6, col: '#ffcf6a', r: 4, a: 0.3 });
    // 산신 제단: 돌탑 + 작은 사당
    const sx0 = WW - 120; cairn(x2, sx0, by + 4);
    rect(sx0 + 6, by - 14, 12, 2, '#3a2a40'); rect(sx0 + 7, by - 12, 10, 10, '#7a2a2a'); rect(sx0 + 9, by - 10, 6, 6, '#2a1a1a'); rect(sx0 + 11, by - 8, 2, 2, '#ffd34a');
    lanterns.push({ x: sx0 + 12, y: by - 7, col: '#ffd34a', r: 5, a: 0.3 });
    // 도감 비석
    const sx = WW - 102; rect(sx - 2, by - 2, 10, 3, '#4a4a56'); rect(sx, by - 20, 6, 18, '#6a6a78'); rect(sx + 1, by - 20, 1, 18, '#8a8a98'); rect(sx - 1, by - 22, 8, 2, '#5a5a66');
    rect(sx + 2, by - 16, 2, 2, '#7fd0ff'); rect(sx + 2, by - 12, 2, 1, '#7fd0ff'); rect(sx + 2, by - 9, 2, 1, '#7fd0ff');
    lanterns.push({ x: sx + 3, y: by - 13, col: '#7fd0ff', r: 6, a: 0.25 });
    // 꽃밭 울타리
    const gx = WW - 82, gy = GY + 12;
    for (let x = gx; x <= gx + 50; x += 5) { rect(x, gy - 4, 1, 5, '#7a5232'); rect(x, gy + 32, 1, 5, '#7a5232'); }
    rect(gx, gy - 2, 52, 1, '#5a3a22'); rect(gx, gy + 34, 52, 1, '#5a3a22'); rect(gx, gy - 2, 1, 36, '#5a3a22'); rect(gx + 51, gy - 2, 1, 36, '#5a3a22');
    // 파견 나루
    const tx = WW - 24; rect(tx, by - 26, 2, 28, '#a02a2a'); rect(tx + 16, by - 26, 2, 28, '#a02a2a'); rect(tx - 2, by - 26, 22, 2, '#a02a2a'); rect(tx - 2, by - 26, 22, 1, '#e05050');
    for (let i = 2; i < 16; i += 3) rect(tx + i, by - 30, 1, 5, '#a02a2a');
    lanterns.push({ x: tx + 1, y: by - 22, col: '#ff8a6a', r: 5, a: 0.25 }, { x: tx + 17, y: by - 22, col: '#ff8a6a', r: 5, a: 0.25 });
  }

  // ---------- 개체 ----------
  function resize() {
    const r = cv.getBoundingClientRect();
    S = r.width >= 700 ? 5 : r.width >= 520 ? 4 : r.width >= 300 ? 3 : 2;
    W = Math.ceil(r.width / S); H = Math.ceil(r.height / S); GY = Math.round(H * 0.5); WW = Math.round(W * 2.4);
    cv.width = W; cv.height = H; g.imageSmoothingEnabled = false;
    lanterns = []; bake(); flies = [];
    reaper.x = Math.min(Math.max(reaper.x, 12), WW - 12); reaper.y = clampFeet(reaper.y);
    critters = [{ k: 'cat', x: 30, y: GY + 20, vx: 4, t: 0 }, { k: 'crow', x: 20, y: GY - 14, t: 0, perch: 1 }];
    if (mini) { mini.width = WW; mini.height = 1; }
  }
  function spawnSoul() {
    const r = cfg.roll(), units = [reaper, ...minions], u = units[Math.floor(Math.random() * units.length)];
    const x = cfg.parade ? camX + rnd(8, W - 8) : Math.max(8, Math.min(WW - 8, u.x + rnd(-55, 55)));
    if (cfg.parade && r.sp < 0 && Math.random() < 0.15) r.tier = 2;
    souls.push({ x, y: 0, by: rnd(GY - 8, GY + (H - GY) * 0.5), tier: r.tier, sp: r.sp, ph: rnd(0, 6), t: 0, st: 'float', who: null, a: 0 });
  }
  function pickSoul(who) {
    let best = null, bd = 1e9;
    for (const s of souls) if (s.st === 'float' && !s.who && s.a > 0.6) { const d = Math.abs(s.x - who.x) + Math.abs(s.by - who.y) * 0.5; if (d < bd) { bd = d; best = s; } }
    return bd < 160 ? best : null;
  }
  function think(u, dt, walk, reap, isMain) {
    u.t += dt; u.ft = (u.ft || 0) + dt;
    if (u.st === 'idle') {
      const s = pickSoul(u);
      if (s) { s.who = u; u.target = s; u.st = 'walk'; u.t = 0; }
      else if (u.t > (isMain ? 4 : 2)) { u.wx = Math.max(10, Math.min(WW - 10, u.x + rnd(-60, 60))); u.wy = clampFeet(rnd(GY + 14, H - 3)); u.st = 'wander'; }
    } else if (u.st === 'wander') {
      const dx = u.wx - u.x, dy = u.wy - u.y, d = Math.hypot(dx, dy);
      if (d < 1 || pickSoul(u)) { u.st = 'idle'; u.t = 0; }
      else { const v = walk * 0.5 * dt; u.x += dx / d * v; u.y += dy / d * v; u.face = dx < 0 ? -1 : 1; }
    } else if (u.st === 'walk') {
      const s = u.target;
      if (!s || s.st !== 'float') { u.st = 'idle'; u.t = 0; return; }
      const side = s.x > u.x ? -1 : 1, tx = s.x + side * (isMain ? 7 : 5), ty = clampFeet(s.by + (isMain ? 17 : 13));
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy), v = walk * dt;
      if (d <= v) { u.x = tx; u.y = ty; u.st = 'reap'; u.t = 0; u.face = s.x > u.x ? 1 : -1; s.st = 'pull'; s.t = 0; s.who = u; s.sx = s.x; s.sy = s.y; s.dur = reap; if (isMain) Sound.play('reap'); sweep(u, s, reap, isMain); }
      else { u.x += dx / d * v; u.y += dy / d * v; u.face = dx < 0 ? -1 : 1; }
    } else if (u.st === 'reap') {
      if (u.t >= reap + 0.15) { u.st = 'idle'; u.t = 0; u.target = null; }
    }
  }
  // 한 번 거둘 때 주변 혼령도 함께 빨아들임
  function sweep(u, s, reap, isMain) {
    const R = isMain ? (cfg.reapR || 14) : 8, max = isMain ? (cfg.reapMax || 3) : 1;
    let n = 0;
    for (const o of souls) {
      if (n >= max) break;
      if (o === s || o.st !== 'float' || o.who || o.a < 0.6) continue;
      if (Math.hypot(o.x - s.x, o.by - s.by) > R) continue;
      o.st = 'pull'; o.t = -rnd(0, 0.15); o.who = u; o.sx = o.x; o.sy = o.y; o.dur = reap; n++;
    }
  }
  function scrollPos(u) { return u.mini ? { x: u.x + u.face * 3, y: u.y - 8 } : { x: u.x + u.face * 9, y: u.y - 16 }; }
  const scr = (x, y) => ({ x: (x - camX) * S, y: y * S });
  function burst(x, y, col, n, spd) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(spd * 0.4, spd); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: rnd(0.4, 0.8), max: 0.8, col, g: 30 }); } }
  function update(dt) {
    time += dt;
    const sd = dt * cfg.speed;
    spawnT += sd;
    const vis = Math.min(5, cfg.minions);
    if (spawnT >= (cfg.parade ? 0.09 : cfg.spawn)) { spawnT = 0; if (souls.filter(s => s.st === 'float').length < (cfg.parade ? 45 : cfg.maxSouls + vis * 2)) spawnSoul(); }
    if (cfg.parade) { if (Math.random() < dt * 1.2) ghosts.push({ x: camX - 16, y: GY - 2 + rnd(-3, 3), t: 0, k: Math.random() < 0.5 }); if (Math.random() < 0.5) parts.push({ x: camX + rnd(0, W), y: rnd(GY - 30, GY + 10), vx: rnd(4, 10), vy: -rnd(0, 4), life: 1.2, max: 1.2, col: Math.random() < 0.5 ? '#6fb0ff' : '#ff6a8a', g: 0 }); }
    ghosts.forEach(gh => { gh.t += dt; gh.x += 14 * dt; }); ghosts = ghosts.filter(gh => gh.x < camX + W + 20 && gh.t < 30);
    if (petData) { if (!pet) pet = { x: reaper.x, y: reaper.y, t: 0 }; pet.t += dt; const fly = petData.kind === 'bird' || petData.kind === 'dragon'; const tx = reaper.x - reaper.face * 11, ty = reaper.y - (fly ? 12 : 0); pet.x += (tx - pet.x) * Math.min(1, dt * 4); pet.y += (ty - pet.y) * Math.min(1, dt * 4); pet.face = tx > pet.x + 0.5 ? 1 : tx < pet.x - 0.5 ? -1 : reaper.face; pet.fly = fly; } else pet = null;
    think(reaper, sd, cfg.walk, cfg.reap, true);
    while (minions.length < vis) minions.push({ x: rnd(FIELD0(), FIELD1()), y: clampFeet(rnd(GY + 14, H - 3)), st: 'idle', t: 0, face: 1, mini: true });
    while (minions.length > vis) minions.pop();
    minions.forEach(m => think(m, sd, cfg.mWalk, cfg.mReap, false));
    for (const s of souls) {
      s.t += sd; s.a = Math.min(1, s.a + dt * 2);
      if (s.st === 'float') s.y = s.by + Math.sin(time * 2 + s.ph) * 2;
      else if (s.st === 'pull') {
        const p = scrollPos(s.who), k = Math.min(1, s.t / s.dur), e = k * k, sw = Math.sin(k * Math.PI) * 6 * (1 - k);
        s.x = s.sx + (p.x - s.sx) * e + Math.cos(k * 9) * sw; s.y = s.sy + (p.y - s.sy) * e + Math.sin(k * 9) * sw; s.scale = 1 - k * 0.6;
        if (Math.random() < 0.6) parts.push({ x: s.x + rnd(-2, 2), y: s.y + rnd(-2, 2), vx: 0, vy: -4, life: 0.35, max: 0.35, col: SP.SOUL_PAL[s.tier].Q, g: 0 });
        if (k >= 1) { s.st = 'done'; burst(p.x, p.y, SP.SOUL_PAL[s.tier].z, 8 + s.tier * 4, 30); const sp = scr(p.x, p.y); hooks.collect && hooks.collect(s, s.who === reaper ? 'main' : s.who.tap ? 'tap' : 'minion', sp.x, sp.y); }
      }
    }
    souls = souls.filter(s => s.st !== 'done');
    if (R().id === 'hell' && Math.random() < 0.4) parts.push({ x: camX + rnd(0, W), y: H - rnd(0, H - GY), vx: rnd(-3, 3), vy: -rnd(6, 14), life: 1.6, max: 1.6, col: Math.random() < 0.5 ? '#ff7a20' : '#ffd040', g: 0 });
    if (R().id === 'field' && Math.random() < 0.15) parts.push({ x: camX + rnd(0, W), y: rnd(GY, H), vx: rnd(2, 5), vy: -rnd(1, 3), life: 2.5, max: 2.5, col: '#e8f0ff', g: 0 });
    parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; });
    parts = parts.filter(p => p.life > 0);
    if (wraith) {
      wraith.t += dt; wraith.flash = Math.max(0, wraith.flash - dt); wraith.x += Math.sin(wraith.t * 0.7) * dt * 6;
      if (wraith.dead) { wraith.fade -= dt; if (wraith.fade <= 0) wraith = null; }
      else if (wraith.t > wraith.life) { wraith.dead = true; wraith.fade = 0.6; hooks.wraithGone && hooks.wraithGone(); }
    }
    for (const c of critters) {
      c.t += dt;
      if (c.k === 'cat') { c.x += c.vx * dt; if (c.x > 120 || c.x < 20) { c.vx = -c.vx; } }
      if (c.k === 'crow' && !c.perch) { c.x += c.vx * dt; c.y -= 6 * dt; if (c.y < -10) { c.perch = 1; c.y = c.hy; c.x = c.hx; } }
      if (c.k === 'crow' && c.perch && Math.abs(reaper.x - c.x) < 14 && Math.abs(reaper.y - c.y) < 40) { c.perch = 0; c.hx = c.x; c.hy = c.y; c.vx = rnd(10, 18) * (Math.random() < 0.5 ? -1 : 1); }
    }
    shake = Math.max(0, shake - dt * 20);
    // 카메라: 주인공 따라가기 (끌어서 둘러보면 6초 뒤 복귀)
    if (!follow && time > followAt) follow = true;
    if (follow) camX += ((reaper.x - W / 2) - camX) * Math.min(1, dt * 3);
    camX = Math.max(0, Math.min(WW - W, camX));
  }

  // ---------- 그리기 ----------
  const flipped = new Map();
  const flipOf = c => { if (!flipped.has(c)) flipped.set(c, flipX(c)); return flipped.get(c); };
  function glow(x, y, r, col, a) {
    const C = hex(col); g.fillStyle = `rgba(${C[0]},${C[1]},${C[2]},${a})`;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = Math.hypot(xx, yy) / r; if (d <= 1 && BAYER[(yy + 64) & 3][(xx + 64) & 3] > d * 0.95) g.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1); }
  }
  const onScreen = (x, m = 20) => x - camX > -m && x - camX < W + m;
  function drawUnit(u) {
    if (!onScreen(u.x)) return;
    const fi = Math.floor(u.ft * (u.st === 'walk' || u.st === 'wander' ? 8 : u.st === 'reap' ? 6 : 2.5));
    let img = u.mini ? SP.mini(u.st === 'walk' || u.st === 'wander' ? 'walk' : 'idle', fi) : SP.reaper(kind, rank, u.st === 'wander' ? 'walk' : u.st, fi % 4);
    if (u.face < 0) img = flipOf(img);
    const sx = u.x - camX;
    g.fillStyle = 'rgba(0,0,0,0.35)'; const sw = u.mini ? 6 : 10; g.fillRect(Math.round(sx - sw / 2), Math.round(u.y - 1), sw, 2);
    g.drawImage(img, Math.round(sx - img.width / 2), Math.round(u.y - img.height + 1));
    if (!u.mini) {
      const my = Math.round(u.y - img.height - 2 + Math.sin(time * 4) * 1.2), mx = Math.round(sx) - 1;
      g.fillStyle = '#0f0c18'; g.fillRect(mx - 2, my - 1, 5, 3); g.fillRect(mx - 1, my + 2, 3, 1); g.fillRect(mx, my + 3, 1, 1);
      g.fillStyle = '#ffd34a'; g.fillRect(mx - 1, my, 3, 1); g.fillRect(mx, my + 1, 1, 1);
      if (rank >= 8 && Math.random() < 0.3) parts.push({ x: u.x + rnd(-7, 7), y: u.y - rnd(0, 16), vx: 0, vy: -12, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#ff6a3a' : '#ffd34a', g: 0 });
    }
    if (u.st === 'reap') { const p = scrollPos(u); glow(p.x - camX, p.y, u.mini ? 3 : 5, '#ffe08a', 0.35); }
  }
  function drawNpc(name, x, y, face) {
    if (!onScreen(x)) return;
    let img = SP.npc(name); if (face < 0) img = flipOf(img);
    const b = Math.floor(time * 1.5 + x) % 2;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(x - camX - 4), y - 1, 8, 2);
    g.drawImage(img, Math.round(x - camX - img.width / 2), y - img.height + 1 + b);
  }
  function render() {
    const ox = shake ? Math.round(rnd(-shake, shake)) : 0;
    g.setTransform(1, 0, 0, 1, ox, 0);
    g.drawImage(skyC, 0, 0);
    for (const s of stars) if (s.big || (s.ph * 10 | 0) % 4 === 0) { const k = Math.sin(time * 2 + s.ph); if (k > 0.6) { g.fillStyle = '#fffbe8'; g.fillRect(s.x, s.y, 1, 1); } }
    g.drawImage(mtC, -Math.round(camX * 0.35), 0);
    g.drawImage(groundC, -Math.round(camX), 0);
    for (const l of lanterns) if (onScreen(l.x)) glow(l.x - camX, l.y, l.small ? l.r : l.r + Math.round(Math.sin(time * 6 + l.x) * 0.8), l.col, l.a);
    if (R().river) { g.fillStyle = 'rgba(160,190,255,0.7)'; for (let i = 0; i < 10; i++) { const x = (i * 37 + time * 8) % WW, y = GY + 4 + (i * 5) % Math.round((H - GY) * 0.24); if (onScreen(x) && x > FIELD0() && x < FIELD1()) g.fillRect(Math.round(x - camX), y, 3, 1); } }
    // 꽃밭 식물
    if (typeof Life !== 'undefined' && Game.S && Game.S.garden) PLOTS.forEach((p, i) => {
      if (!onScreen(p.x)) return;
      const st = i < Game.S.plots ? Life.plotState(i) : null;
      let img = st && !st.empty ? SP.plant(st.stage, st.f.pal, st.f.id) : SP.plant(-1, {}, 'soil');
      if (i >= Game.S.plots) { g.globalAlpha = 0.35; }
      g.drawImage(img, Math.round(p.x - camX - 8), p.y - 16);
      g.globalAlpha = 1;
      if (st && st.ready) { glow(p.x - camX, p.y - 10, 7, '#ffe08a', 0.25 + Math.sin(time * 4) * 0.08); if (Math.random() < 0.05) parts.push({ x: p.x + rnd(-5, 5), y: p.y - rnd(6, 14), vx: 0, vy: -6, life: 0.8, max: 0.8, col: '#ffe08a', g: 0 }); }
    });
    // 반딧불
    if (!flies.length) for (let i = 0; i < 18; i++) flies.push({ x: rnd(0, WW), y: rnd(GY - 10, H - 4), ph: rnd(0, 6), sp: rnd(0.3, 0.8) });
    for (const f of flies) { f.x += Math.sin(time * f.sp + f.ph) * 0.12; f.y += Math.cos(time * f.sp * 1.3 + f.ph) * 0.08; if (!onScreen(f.x, 2)) continue; const k = Math.sin(time * 2.2 + f.ph * 3); if (k > 0.1) { g.fillStyle = k > 0.7 ? '#fffbb0' : '#c8e870'; g.fillRect(Math.round(f.x - camX), Math.round(f.y), 1, 1); } }
    // 주민 · 동물
    const by = GY + 13;
    for (const n of NPCS) {
      if (n.cond === 'merchant' && !cfg.merchant) continue;
      if (!onScreen(n.x)) continue;
      let img = n.id === 'judge' ? SP.reaper('m', 5, 'idle', 0) : n.id === 'kkachi' ? SP.pet(PETS[0], Math.floor(time * 2)) : SP.npc(n.id);
      if ((n.face || 1) < 0) img = flipOf(img);
      const bob = n.perch ? 0 : Math.floor(time * 1.5 + n.x) % 2;
      if (!n.perch) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(n.x - camX - 4), n.y - 1, 8, 2); }
      g.drawImage(img, Math.round(n.x - camX - img.width / 2), n.y - img.height + 1 + bob);
      if (n.id === 'kkachi') { g.fillStyle = '#c8a060'; g.fillRect(Math.round(n.x - camX - 1), n.y - 6, 4, 3); g.fillStyle = '#e04040'; g.fillRect(Math.round(n.x - camX), n.y - 5, 2, 1); }
      if (hooks.npcHot && hooks.npcHot(n.id)) { // 머리 위 느낌표
        const ex = Math.round(n.x - camX), ey = n.y - img.height - 7 + Math.round(Math.sin(time * 5) * 1.5);
        g.fillStyle = '#0f0c18'; g.fillRect(ex - 2, ey - 1, 5, 9); g.fillStyle = '#ffd34a'; g.fillRect(ex - 1, ey, 3, 4); g.fillRect(ex - 1, ey + 5, 3, 2);
      }
    }
    for (const c of critters) {
      if (!onScreen(c.x)) continue;
      const img = c.k === 'cat' ? SP.cat(c.vx === 0 ? 1 : Math.floor(c.t * 4) % 2) : SP.crow(c.perch ? 0 : Math.floor(c.t * 8) % 2);
      g.drawImage(c.k === 'cat' && c.vx < 0 ? flipOf(img) : img, Math.round(c.x - camX - img.width / 2), Math.round(c.y - img.height));
    }
    for (const s of souls) if (s.st === 'float' && onScreen(s.x)) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(Math.round(s.x - camX - 2), Math.round(clampFeet(s.by + 17) - 1), 4, 1); }
    for (const gh of ghosts) { if (!onScreen(gh.x)) continue; g.globalAlpha = 0.35; const im = SP.wraith(Math.floor(gh.t * 3) % 2); g.drawImage(gh.k ? flipOf(im) : im, Math.round(gh.x - camX - 7), Math.round(gh.y - 17 + Math.sin(gh.t * 3) * 2)); g.globalAlpha = 1; glow(gh.x - camX + 6, gh.y - 12, 3, gh.k ? '#6fb0ff' : '#ff6a8a', 0.5); }
    const units = [reaper, ...minions]; if (pet) units.push(Object.assign(pet, { isPet: 1 }));
    units.sort((a, b) => a.y - b.y).forEach(u => {
      if (!u.isPet) return drawUnit(u);
      if (!onScreen(u.x)) return;
      let im = SP.pet(petData, Math.floor(u.t * (u.fly ? 6 : 3))); if (u.face < 0) im = flipOf(im);
      const hop = u.fly ? Math.sin(u.t * 4) * 1.5 : -Math.abs(Math.sin(u.t * 6)) * (Math.abs(reaper.x - u.x) > 12 ? 2 : 0.4);
      if (petData.aura) glow(u.x - camX, u.y - 5 + hop, 6, petData.aura, 0.25);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(u.x - camX - 3), Math.round((u.fly ? u.y + 12 : u.y) - 1), 6, 1);
      g.drawImage(im, Math.round(u.x - camX - im.width / 2), Math.round(u.y - im.height + 1 + hop));
    });
    if (cfg.parade) { g.fillStyle = 'rgba(90,30,140,0.12)'; g.fillRect(0, 0, W, H); }
    for (const s of souls) {
      if (!onScreen(s.x)) continue;
      const img = s.sp >= 0 ? SP.special(s.sp) : SP.soul(s.tier, Math.floor(time * 6 + s.ph) % 3), sx = s.x - camX;
      glow(sx, s.y, s.sp >= 0 ? 9 : s.tier ? 7 : 5, s.sp >= 0 ? '#e0a0ff' : SP.SOUL_PAL[s.tier].Q, (s.sp >= 0 ? 0.4 : 0.25) * s.a);
      g.globalAlpha = s.a;
      const sc = s.scale || 1;
      if (sc < 1) g.drawImage(img, Math.round(sx - img.width * sc / 2), Math.round(s.y - img.height * sc / 2), Math.round(img.width * sc), Math.round(img.height * sc));
      else g.drawImage(img, Math.round(sx - img.width / 2), Math.round(s.y - img.height / 2));
      g.globalAlpha = 1;
    }
    if (wraith) {
      const img = SP.wraith(Math.floor(wraith.t * 3) % 2), y = wraith.y + Math.sin(wraith.t * 2) * 3, wx = wraith.x - camX;
      g.globalAlpha = wraith.dead ? Math.max(0, wraith.fade / 0.6) : Math.min(1, wraith.t * 2) * (0.85 + Math.sin(wraith.t * 9) * 0.1);
      glow(wx, y, 11, '#ff2e4a', 0.12);
      g.drawImage(img, Math.round(wx - img.width / 2 + (wraith.flash ? rnd(-1, 1) : 0)), Math.round(y - img.height / 2));
      if (wraith.flash) { g.globalAlpha = wraith.flash * 3; g.globalCompositeOperation = 'lighter'; g.drawImage(img, Math.round(wx - img.width / 2), Math.round(y - img.height / 2)); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1;
      if (!wraith.dead) { const bw = 18, bx = Math.round(wx - bw / 2), bby = Math.round(y - img.height / 2 - 6); g.fillStyle = '#0f0c18'; g.fillRect(bx - 1, bby - 1, bw + 2, 4); g.fillStyle = '#4a1020'; g.fillRect(bx, bby, bw, 2); g.fillStyle = '#ff3a5a'; g.fillRect(bx, bby, Math.round(bw * wraith.hp / wraith.max), 2); }
    }
    for (const p of parts) { if (!onScreen(p.x, 2)) continue; g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x - camX), Math.round(p.y), 1, 1); }
    g.globalAlpha = 1;
    const fog = hex(R().fog); g.fillStyle = `rgba(${fog[0]},${fog[1]},${fog[2]},${R().id === 'bamboo' || R().id === 'field' ? 0.16 : 0.1})`;
    for (let y = GY - 6; y < GY + 10; y++) for (let x = 0; x < W; x++) { const dd = Math.sin((x + camX + time * 6) * 0.08 + y * 0.4) * 0.5 + 0.5; if (BAYER[y & 3][x & 3] < dd * 0.5) g.fillRect(x, y, 1, 1); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // 미니맵: 맵 전체에서 내 위치 · 혼령 · 원귀 · 건물
  function drawMini() {
    if (!mg) return;
    const w = mini.width = mini.clientWidth || 300, h = mini.height = 12, k = w / WW;
    mg.fillStyle = 'rgba(10,8,24,0.75)'; mg.fillRect(0, 0, w, h);
    mg.fillStyle = 'rgba(255,255,255,0.12)'; mg.fillRect(Math.round(camX * k), 0, Math.round(W * k), h);
    mg.fillStyle = 'rgba(255,255,255,0.5)'; mg.fillRect(Math.round(camX * k), 0, Math.round(W * k), 1); mg.fillRect(Math.round(camX * k), h - 1, Math.round(W * k), 1);
    POIS.forEach(p => { mg.fillStyle = p.id === 'garden' && hooks.gardenReady && hooks.gardenReady() ? '#ffd34a' : '#7a6aa0'; mg.fillRect(Math.round((p.x + p.w / 2) * k) - 1, 4, 3, 4); });
    mg.fillStyle = '#6fb0ff'; souls.forEach(s => mg.fillRect(Math.round(s.x * k), 5, 1, 2));
    mg.fillStyle = '#9ab0c8'; minions.forEach(m => mg.fillRect(Math.round(m.x * k), 7, 2, 2));
    if (wraith && !wraith.dead) { mg.fillStyle = '#ff3a5a'; mg.fillRect(Math.round(wraith.x * k) - 1, 2, 3, 6); }
    mg.fillStyle = '#ffd34a'; mg.fillRect(Math.round(reaper.x * k) - 1, 3, 3, 6);
  }
  let last = 0, miniT = 0;
  function loop(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
    update(dt); render();
    if ((miniT += dt) > 0.15) { miniT = 0; drawMini(); }
    hooks.tick && hooks.tick(dt);
    requestAnimationFrame(loop);
  }
  // ---------- 입력: 끌어서 둘러보기 / 탭 ----------
  let drag = null;
  function down(e) { drag = { x: e.clientX, cam: camX, moved: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }
  function move(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) drag.moved = true;
    if (drag.moved) { camX = Math.max(0, Math.min(WW - W, drag.cam - dx / S)); follow = false; followAt = time + 6; }
  }
  function up(e) { const d = drag; drag = null; if (d && !d.moved) tap(e); }
  function tap(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / S + camX, y = (e.clientY - r.top) / S;
    if (wraith && !wraith.dead && Math.abs(x - wraith.x) < 10 && Math.abs(y - wraith.y) < 12) { const sp = scr(x, y); hooks.wraithTap && hooks.wraithTap(sp.x, sp.y); return; }
    for (const n of NPCS) { if (n.cond === 'merchant' && !cfg.merchant) continue; if (Math.abs(x - n.x) < 7 && y > n.y - 17 && y < n.y + 3) { hooks.poi && hooks.poi(n.id === 'gob' ? 'merchant' : n.id); return; } }
    let best = null, bd = 10;
    for (const s of souls) if (s.st === 'float') { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
    if (best) {
      if (best.who && best.who.target === best) best.who.target = null;
      const tapper = { face: reaper.face, tap: true };
      Object.defineProperty(tapper, 'x', { get: () => reaper.x }); Object.defineProperty(tapper, 'y', { get: () => reaper.y });
      best.who = tapper; best.st = 'pull'; best.t = 0; best.sx = best.x; best.sy = best.y; best.dur = 0.35;
      Sound.play('tap'); return;
    }
    for (let i = 0; i < PLOTS.length; i++) { const p = PLOTS[i]; if (Math.abs(x - p.x) < 10 && y > p.y - 18 && y < p.y + 2) { hooks.poi && hooks.poi('plot', i); return; } }
    for (const p of POIS) if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) { if (p.id === 'stall' && cfg.merchant) { hooks.poi && hooks.poi('merchant'); return; } hooks.poi && hooks.poi(p.id); return; }
    burst(x, y, '#c9b6ff', 5, 18);
  }
  return {
    init(canvas, h, miniCanvas) {
      cv = canvas; g = cv.getContext('2d'); hooks = h || {};
      if (miniCanvas) { mini = miniCanvas; mg = mini.getContext('2d'); mini.addEventListener('pointerdown', e => { const r = mini.getBoundingClientRect(); camX = Math.max(0, Math.min(WW - W, ((e.clientX - r.left) / r.width) * WW - W / 2)); follow = false; followAt = time + 6; }); }
      resize(); reaper.x = WW * 0.5; reaper.y = clampFeet(GY + (H - GY) * 0.65); camX = reaper.x - W / 2;
      window.addEventListener('resize', resize);
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => (drag = null));
      requestAnimationFrame(loop);
    },
    resize,
    setRegion(i) { const n = Math.max(0, Math.min(REGIONS.length - 1, i)); if (n !== region || !groundC) { region = n; lanterns = []; bake(); } },
    setKind(k) { kind = k; },
    setRank(r) { rank = r; },
    setPet(p) { petData = p; },
    pillar() { for (let i = 0; i < 60; i++) parts.push({ x: reaper.x + rnd(-6, 6), y: reaper.y - rnd(0, 40), vx: rnd(-4, 4), vy: -rnd(20, 50), life: rnd(0.8, 1.6), max: 1.6, col: Math.random() < 0.6 ? '#ffd34a' : '#ffffff', g: 0 }); follow = true; },
    config(c) { Object.assign(cfg, c); },
    spawnWraith(hp, life) { wraith = { x: Math.max(20, Math.min(WW - 20, reaper.x + rnd(-30, 30))), y: GY * 0.85, hp, max: hp, t: 0, life, flash: 0 }; follow = true; Sound.play('wraith'); },
    hitWraith(dmg) {
      if (!wraith || wraith.dead) return false;
      wraith.hp = Math.max(0, wraith.hp - dmg); wraith.flash = 0.15; shake = Math.max(shake, 1.5);
      burst(wraith.x + rnd(-6, 6), wraith.y + rnd(-8, 8), '#ffffff', 4, 25);
      if (wraith.hp <= 0) { wraith.dead = true; wraith.fade = 0.8; burst(wraith.x, wraith.y, '#ff6a8a', 30, 50); burst(wraith.x, wraith.y, '#ffffff', 20, 40); return true; }
      return false;
    },
    wraithAlive: () => !!(wraith && !wraith.dead),
    wraithHp: () => wraith ? wraith.hp : 0,
    wraithPos: () => wraith ? scr(wraith.x, wraith.y) : null,
    // 화면에 보이는 건물 이름표 위치 (CSS px)
    labels: () => POIS.map(p => ({ id: p.id, x: (p.x + p.w / 2 - camX) * S, y: (p.y - 4) * S, vis: onScreen(p.x + p.w / 2, 4) })).concat(NPCS.map(n => ({ id: 'n_' + n.id, x: (n.x - camX) * S, y: (n.y - (n.id === 'judge' ? 26 : 18)) * S, vis: onScreen(n.x, 4) && !(n.cond === 'merchant' && !cfg.merchant) }))),
    focus(id) { const p = POIS.find(q => q.id === id); if (p) { camX = Math.max(0, Math.min(WW - W, p.x + p.w / 2 - W / 2)); follow = false; followAt = time + 8; } },
    get scale() { return S; },
  };
})();
