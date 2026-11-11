// ===== 수확 화면: 탑다운 2D 타일 맵 =====
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

const POI_LABEL = { office: '집무실', stall: '노점', stele: '도감 비석', garden: '꽃밭', n_jumo: '주모 · 주막', n_elder: '할아버지 · 의뢰', n_gob: '도깨비 상인', n_mudang: '무당 · 운세', n_kkachi: '까치 · 우편', n_sansin: '산신령 · 공양', n_judge: '판관 · 승진', n_boat: '뱃사공 · 파견' };
// ===== 탑다운 맵 (스타듀밸리처럼 위에서 내려다보는 2D 타일 맵) =====
const Scene = (() => {
  const T = 16, TW = 26, TH = 30, MW = TW * T, MH = TH * T;
  let cv, g, W = 195, H = 245, S = 2, region = 0, kind = 'm', rank = 0;
  let groundC = null, tiles = [], objs = [], POIS = [], NPCS = [], PLOTS = [], lanterns = [];
  let camX = 0, camY = 0, follow = true, followAt = 0;
  let hooks = {}, cfg = { spawn: 2, maxSouls: 6, walk: 30, reap: 0.8, minions: 0, mWalk: 18, mReap: 1.4, roll: () => ({ tier: 0, sp: -1 }), speed: 1, merchant: false };
  const reaper = { x: 13 * T, y: 16 * T, st: 'idle', t: 0, ft: 0, face: 1, dir: 'down', target: null };
  let arena = false, arenaC = null, arenaLamps = [], saved = null, fade = 0, office = false, officeTier = 0, staff = [], docsPos = null;
  let minions = [], souls = [], parts = [], flies = [], wraith = null, spawnT = 0, time = 0, shake = 0, pet = null, petData = null, ghosts = [];
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => (v + 0.5) / 16));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * k));
  const lit = (a, f) => toHex(hex(a).map(v => v * f));
  const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const R = () => REGIONS[region];
  const rectOn = x2 => (x, y, w, h, col) => { x2.fillStyle = col; x2.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const tileAt = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); return tx < 0 || ty < 0 || tx >= TW || ty >= TH ? 9 : tiles[ty][tx]; };
  const walkable = (x, y) => { const t = tileAt(x, y); return t === 0 || t === 1 || t === 3; };
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
  function tent(x2, x, y, col, k = 1) {
    const r0 = rectOn(x2), rect = (dx, dy, w, h, c) => r0(x + dx * k, y + dy * k, Math.max(1, w * k), Math.max(1, h * k), c);
    rect(0, -16, 1, 16, '#3a2414'); rect(22, -16, 1, 16, '#3a2414');
    for (let i = 0; i < 5; i++) rect(-2 + i, -20 + i, 27 - i * 2, 1, i % 2 ? col : '#efe6d8');
    for (let q = 0; q < 27; q += 4) rect(-2 + q, -15, 2, 2, col);
    rect(1, -7, 21, 2, '#5a3a22'); rect(3, -9, 3, 2, '#e0a040'); rect(9, -10, 4, 3, '#60a0e0'); rect(16, -9, 3, 2, '#e05050');
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
  // ---------- 맵 만들기 ----------
  // 타일: 0 풀 · 1 길 · 2 물 · 3 다리 · 4 밭흙
  function genTiles() {
    const P = R(), rr = seeded(13 + region);
    tiles = Array.from({ length: TH }, () => Array(TW).fill(0));
    for (let x = 0; x < TW; x++) { tiles[14][x] = 1; tiles[15][x] = 1; }
    for (let y = 0; y < TH; y++) { tiles[y][12] = 1; tiles[y][13] = 1; }
    for (let y = 12; y <= 17; y++) for (let x = 10; x <= 15; x++) if (Math.hypot(x - 12.5, y - 14.5) < 3.2) tiles[y][x] = 1;
    // 연못 (왼쪽 아래) / 삼도천은 강
    if (P.river) { for (let x = 0; x < TW; x++) for (let y = 20; y <= 22; y++) tiles[y][x] = (x === 12 || x === 13) ? 3 : 2; }
    else for (let y = 22; y < TH; y++) for (let x = 0; x < 9; x++) if (Math.hypot((x - 3.5) / 1.3, y - 26.5) < 3.3) tiles[y][x] = 2;
    for (let y = 19; y <= 24; y++) for (let x = 17; x <= 23; x++) tiles[y][x] = 4;
  }
  function bakeGround() {
    const P = R(), c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const x2 = c.getContext('2d'), im = x2.createImageData(MW, MH), d = im.data;
    const set = (x, y, col) => { const i = (y * MW + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
    const gBase = lit(mix(P.ground[2], P.tuft, 0.55), 1.5), G = [hex(lit(gBase, 0.84)), hex(gBase), hex(lit(gBase, 1.12)), hex(lit(P.tuft, 1.6))];
    const pa = [hex(lit(P.path[1], 1.6)), hex(lit(P.path[1], 1.4)), hex(lit(P.path[0], 1.3))];
    const wv = P.id === 'hell' ? ['#7a1a08', '#c83a10', '#ff8a30'].map(hex) : (P.river || ['#1a2a5a', '#24407a', '#5a7ac0']).map(hex);
    const soil = ['#4a3220', '#5e4028', '#3a2616'].map(hex), plank = ['#6a4a2a', '#8a6038', '#4a321a'].map(hex);
    const rr = seeded(71 + region);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const tx = (x / T) | 0, ty = (y / T) | 0, t = tiles[ty][tx], b = BAYER[y & 3][x & 3];
      const n = Math.sin(x * 0.11 + y * 0.07) * 0.5 + Math.sin(x * 0.031 - y * 0.05) * 0.5;
      if (t === 0) set(x, y, G[n + b * 0.8 > 0.9 ? 2 : n + b * 0.8 < -0.3 ? 0 : 1]);
      else if (t === 1) {
        // 길 가장자리는 풀과 섞이게
        const lx = x % T, ly = y % T, near = (dx, dy) => { const t2 = (tiles[ty + dy] || [])[tx + dx]; return t2 === 0; };
        const edge = (lx < 3 && near(-1, 0)) || (lx > 12 && near(1, 0)) || (ly < 3 && near(0, -1)) || (ly > 12 && near(0, 1));
        set(x, y, edge && b < 0.45 ? G[1] : pa[b > 0.88 ? 0 : b < 0.1 ? 2 : 1]);
      } else if (t === 2) set(x, y, wv[(Math.sin(x * 0.4 + y * 0.9) > 0.8) ? 2 : b > 0.55 ? 1 : 0]);
      else if (t === 3) set(x, y, plank[(y % 4 === 0) ? 2 : (x % 16 === 0 ? 2 : (b > 0.7 ? 1 : 0))]);
      else if (t === 4) set(x, y, soil[(y % 6 === 0) ? 2 : b > 0.7 ? 1 : 0]);
    }
    // 풀포기 · 꽃
    const fl = ['#e8f0ff', '#ffd0e0', '#ffe08a', '#a8c8ff'].map(hex);
    for (let k = 0; k < 260; k++) { const x = (rr() * MW) | 0, y = (rr() * MH) | 0; if (tileAt(x, y) !== 0) continue; if (rr() < 0.35) set(x, y, fl[(rr() * 4) | 0]); else { set(x, y, G[3]); if (y > 0) set(x, y - 1, G[3]); if (x > 0 && y > 1) set(x - 1, y - 1, G[3]); } }
    // 물가 테두리
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) if (tileAt(x, y) === 2 && tileAt(x, y - 1) !== 2 && tileAt(x, y - 1) !== 3) set(x, y, hex(lit(P.path[0], 0.8)));
    im.data.set(d); x2.putImageData(im, 0, 0);
    // 꽃밭 울타리
    const rect = rectOn(x2), fx0 = 17 * T - 2, fy0 = 19 * T - 3, fw = 7 * T + 4, fh = 6 * T + 4;
    for (let x = fx0; x <= fx0 + fw; x += 6) { rect(x, fy0 - 4, 2, 6, '#7a5232'); rect(x, fy0 + fh - 4, 2, 6, '#7a5232'); }
    for (let y = fy0; y <= fy0 + fh; y += 6) { rect(fx0, y, 2, 4, '#7a5232'); rect(fx0 + fw, y, 2, 4, '#7a5232'); }
    rect(fx0, fy0 - 2, fw, 1, '#5a3a22'); rect(fx0, fy0 + fh - 2, fw, 1, '#5a3a22');
    return c;
  }
  // 건물 · 소품을 각자의 캔버스로 굽고 (x,y=발밑 중앙) 위치에 세움
  function makeObj(w, h, draw, x, y, id) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x2 = c.getContext('2d');
    const before = lanterns.length; draw(x2, w, h);
    const ox = x - w / 2, oy = y - h;
    for (let k = before; k < lanterns.length; k++) { lanterns[k].x += ox; lanterns[k].y += oy; }
    const o = { img: c, x: ox, y: oy, base: y, id }; objs.push(o); return o;
  }
  function lampPost(x, y, gold) { makeObj(8, 26, (x2) => { rectOn(x2)(3, 8, 1, 18, '#3a2414'); x2.drawImage(SP.lantern(gold ? 2 : 1), 0, 0); }, x, y); lanterns.push({ x, y: y - 21, col: gold ? '#ffcf6a' : '#ff8a6a', r: 9, a: 0.25 }); }
  function treeObj(x, y, kindT) {
    if (kindT === 'bamboo') return makeObj(14, 46, (x2) => { for (let k = 0; k < 3; k++) bamboo(x2, 2 + k * 4, 46, 30 + k * 5, k === 1); }, x, y);
    if (kindT === 'dead') return makeObj(18, 26, (x2) => deadTree(x2, 8, 25), x, y);
    if (kindT === 'pers') return makeObj(20, 30, (x2) => persimmon(x2, 10, 29), x, y);
    // 둥근 나무
    return makeObj(24, 30, (x2) => {
      const rect = rectOn(x2), c1 = mix(R().mt[1], '#2f6a3a', 0.6), c2 = lit(c1, 1.35), c3 = lit(c1, 0.7);
      rect(10, 18, 4, 12, '#3a2a20'); rect(10, 18, 1, 12, '#5a4030');
      [[12, 11, 9], [6, 15, 6], [18, 15, 6], [9, 7, 5], [15, 7, 5]].forEach(([cx, cy, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) rect(cx + xx, cy + yy, 1, 1, xx + yy < -r * 0.5 ? c2 : xx + yy > r * 0.6 ? c3 : c1); });
      rect(4, 22, 16, 1, 'rgba(0,0,0,0)');
    }, x, y);
  }
  function build() {
    const P = R(); objs = []; lanterns = [];
    genTiles(); groundC = bakeGround();
    const tp = (tx, ty) => [tx * T, ty * T];
    // 근거지 건물
    const [tvx, tvy] = tp(6, 11.5); makeObj(64, 46, (x2) => { thatched(x2, 4, 44, 56, false); const r = rectOn(x2); r(58, 10, 1, 34, '#3a2414'); r(52, 10, 6, 8, '#e04040'); r(53, 11, 4, 1, '#fff'); }, tvx, tvy, 'tavern');
    const [bdx, bdy] = tp(10.5, 11.5); makeObj(20, 24, (x2) => { const r = rectOn(x2); r(1, 4, 2, 20, '#5a3a22'); r(17, 4, 2, 20, '#5a3a22'); r(0, 2, 20, 2, '#3a2414'); r(2, 5, 16, 11, '#7a5232'); r(3, 6, 5, 4, '#efe6d8'); r(9, 7, 6, 3, '#efe6d8'); r(4, 11, 6, 3, '#efe6d8'); r(12, 11, 3, 3, '#ffd34a'); }, bdx, bdy, 'board');
    const [stx, sty] = tp(17, 11.5); makeObj(40, 32, (x2) => tent(x2, 6, 31, '#7a4ab0', 1.25), stx, sty, 'stall');
    const [mdx, mdy] = tp(22, 11.5); makeObj(26, 28, (x2) => { const r = rectOn(x2); r(1, 2, 1, 26, '#3a2414'); r(24, 2, 1, 26, '#3a2414'); ['#e04050', '#3a7ae0', '#f0c040', '#f0f0f0', '#40a060'].forEach((c, i) => r(2 + i * 4.5, 3, 4, 7, c)); r(1, 2, 24, 1, '#d8c8a0'); r(4, 20, 18, 3, '#8a2a2a'); r(6, 17, 1, 3, '#f0f0f0'); r(6, 16, 1, 1, '#ffd34a'); r(19, 17, 1, 3, '#f0f0f0'); r(19, 16, 1, 1, '#ffd34a'); }, mdx, mdy, 'mudang');
    lanterns.push({ x: mdx - 7, y: mdy - 12, col: '#ffcf6a', r: 5, a: 0.3 }, { x: mdx + 6, y: mdy - 12, col: '#ffcf6a', r: 5, a: 0.3 });
    const [shx, shy] = tp(4, 18.5); makeObj(30, 26, (x2) => { cairn(x2, 8, 25); const r = rectOn(x2); r(14, 8, 14, 2, '#3a2a40'); r(15, 10, 12, 14, '#7a2a2a'); r(18, 13, 6, 8, '#2a1a1a'); r(20, 16, 2, 2, '#ffd34a'); }, shx, shy, 'shrine');
    lanterns.push({ x: shx + 6, y: shy - 9, col: '#ffd34a', r: 6, a: 0.3 });
    const [slx, sly] = tp(8, 18.5); makeObj(12, 26, (x2) => { const r = rectOn(x2); r(0, 22, 12, 4, '#4a4a56'); r(3, 4, 6, 18, '#6a6a78'); r(4, 4, 1, 18, '#8a8a98'); r(2, 2, 8, 2, '#5a5a66'); r(5, 8, 2, 2, '#7fd0ff'); r(5, 12, 2, 1, '#7fd0ff'); r(5, 15, 2, 1, '#7fd0ff'); }, slx, sly, 'stele');
    lanterns.push({ x: slx, y: sly - 14, col: '#7fd0ff', r: 8, a: 0.25 });
    const [gtx, gty] = tp(12.5, 28.6); makeObj(40, 40, (x2) => { const r = rectOn(x2); r(4, 6, 3, 34, '#a02a2a'); r(33, 6, 3, 34, '#a02a2a'); r(0, 6, 40, 3, '#a02a2a'); r(0, 6, 40, 1, '#e05050'); for (let i = 6; i < 34; i += 3) r(i, 0, 1, 7, '#a02a2a'); r(17, 1, 6, 5, '#1a1a40'); r(17, 1, 6, 2, '#c03030'); }, gtx, gty, 'gate');
    lanterns.push({ x: gtx - 14, y: gty - 30, col: '#ff8a6a', r: 7, a: 0.25 }, { x: gtx + 14, y: gty - 30, col: '#ff8a6a', r: 7, a: 0.25 });
    const [ofx, ofy] = tp(12.5, 7.6); makeObj(56, 40, (x2) => { const r = rectOn(x2);
      r(2, 34, 52, 6, '#4a3c44'); r(4, 32, 48, 2, '#6a5a62');
      for (let i = 0; i < 4; i++) { const px = 8 + i * 13; r(px, 16, 3, 16, '#9a2a2a'); r(px, 16, 1, 16, '#c84040'); }
      r(22, 20, 12, 12, '#3a1a1a'); r(23, 21, 10, 11, '#ffcf6a'); r(28, 21, 1, 11, '#b07a2a');
      r(6, 13, 44, 3, '#2a6a5a'); for (let i = 0; i < 44; i += 4) r(6 + i, 14, 2, 1, '#e0a040');
      for (let i = 0; i < 9; i++) { const ww = 56 - i * 4 + (i < 2 ? 4 : 0); r(28 - ww / 2, 12 - i, ww, 1, i === 0 ? '#14101c' : i % 2 ? '#2a2236' : '#342a44'); }
      r(21, 1, 14, 5, '#1a1020'); r(22, 2, 12, 3, '#e0b040');
    }, ofx, ofy, 'office');
    lanterns.push({ x: ofx, y: ofy - 14, col: '#ffcf6a', r: 10, a: 0.22 });
    POIS = [
      { id: 'office', x: ofx - 28, y: ofy - 40, w: 56, h: 40 },
      { id: 'tavern', x: tvx - 30, y: tvy - 44, w: 60, h: 44 }, { id: 'board', x: bdx - 10, y: bdy - 22, w: 20, h: 22 },
      { id: 'stall', x: stx - 18, y: sty - 30, w: 36, h: 30 }, { id: 'stele', x: slx - 6, y: sly - 26, w: 12, h: 26 },
      { id: 'garden', x: 17 * T, y: 19 * T, w: 7 * T, h: 6 * T }, { id: 'gate', x: gtx - 20, y: gty - 40, w: 40, h: 40 },
      { id: 'shrine', x: shx - 15, y: shy - 26, w: 30, h: 26 }, { id: 'mudang', x: mdx - 13, y: mdy - 28, w: 26, h: 28 },
    ];
    PLOTS = [0, 1, 2, 3, 4, 5].map(i => ({ x: 18.5 * T + (i % 3) * 2 * T, y: 21.2 * T + Math.floor(i / 3) * 2.4 * T }));
    NPCS = [
      { id: 'jumo', x: tvx - 12, y: tvy + 10 }, { id: 'elder', x: bdx + 2, y: bdy + 10, face: -1 }, { id: 'gob', x: stx, y: sty + 10, face: -1, cond: 'merchant' },
      { id: 'mudang', x: mdx, y: mdy + 10 }, { id: 'kkachi', x: bdx, y: bdy - 22, perch: 1 },
      { id: 'sansin', x: shx + 2, y: shy + 10 }, { id: 'judge', x: gtx + 30, y: gty - 2, face: -1 }, { id: 'boat', x: gtx - 30, y: gty - 2 },
    ];
    // 길가 등불
    for (let x = 2; x < TW - 1; x += 5) if (Math.abs(x - 12.5) > 3) lampPost(x * T + 8, 13.6 * T, region >= 7);
    // 지역 장식: 가장자리 나무 + 지역 소품
    const rr = seeded(5 + region * 11), busy = (x, y) => objs.some(o => Math.abs(o.base - y) < 22 && x > o.x - 8 && x < o.x + o.img.width + 8) || !walkable(x, y) || (x > 17 * T - 10 && x < 24 * T + 10 && y > 19 * T - 10 && y < 25 * T + 10);
    const treeKind = { village: 'pers', bamboo: 'bamboo', field: 'dead', hell: 'dead' }[P.id] || 'round';
    for (let k = 0; k < 70; k++) {
      const edge = rr(), x = edge < 0.5 ? rr() * MW : (edge < 0.75 ? rr() * 2.2 * T : MW - rr() * 2.2 * T), y = edge < 0.5 ? (rr() < 0.6 ? 1.6 * T + rr() * 1.4 * T : MH - rr() * 1.2 * T) : rr() * MH;
      if (y < 20 || busy(x, y)) continue;
      const to = treeObj(x, y, rr() < 0.75 ? treeKind : 'round'); if (to) { to.prop = 'tree'; to.key = `t${region}_${k}`; }
    }
    let pk = 0;
    const place = (n, fn, kindP) => { for (let k = 0, m = 0; k < 80 && m < n; k++) { const x = (2 + rr() * (TW - 4)) * T, y = (4 + rr() * (TH - 7)) * T; if (busy(x, y) || tileAt(x, y) !== 0) continue; const before = objs.length; fn(x, y); const o = objs[before]; if (o && kindP) { o.prop = kindP; o.key = `${kindP}${region}_${pk++}`; } m++; } };
    if (P.id === 'village') place(3, (x, y) => makeObj(10, 24, (x2) => x2.drawImage(SP.jangseung(), 0, 1), x, y), 'jangseung');
    if (P.id === 'market') place(3, (x, y) => makeObj(24, 12, (x2) => jars(x2, 3, 11), x, y), 'jars');
    if (P.id === 'pass') { place(2, (x, y) => makeObj(16, 18, (x2) => cairn(x2, 8, 17), x, y), 'cairn'); place(1, (x, y) => makeObj(26, 46, (x2) => tree(x2, 12, 45), x, y), 'tree'); }
    if (P.id === 'field') place(4, (x, y) => makeObj(10, 20, (x2) => statue(x2, 2, 19), x, y), 'statue');
    if (P.id === 'gate') place(4, (x, y) => { makeObj(12, 22, (x2) => stoneLamp(x2, 2, 21), x, y); }, 'lamp');
    if (P.id === 'hell') place(4, (x, y) => { makeObj(18, 18, (x2) => cauldron(x2, 2, 17), x, y); lanterns.push({ x, y: y - 8, col: '#ff7a20', r: 9, a: 0.3 }); }, 'cauldron');
    if (P.id === 'palace') place(4, (x, y) => { makeObj(12, 22, (x2) => stoneLamp(x2, 2, 21), x, y); }, 'lamp');
    // (지역 소품은 아래에서 살펴보기 대상이 된다)
    if (P.id === 'river') place(2, (x, y) => makeObj(24, 10, (x2) => x2.drawImage(SP.boat(), 1, 1), x, y), 'boat');
  }

  // ---------- 승진 시험장 (명부전) ----------
  function bakeArena() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x2 = c.getContext('2d'), rect = rectOn(x2);
    const im = x2.createImageData(W, H), d = im.data, st = ['#2a2434', '#342c42', '#221c2c'].map(hex);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, gx = x % 16, gy = (y + ((x / 16 | 0) % 2) * 8) % 16, b = BAYER[y & 3][x & 3]; const col = gx === 0 || gy === 0 ? st[2] : b > 0.8 ? st[1] : st[0]; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    x2.putImageData(im, 0, 0);
    const wallH = Math.round(H * 0.2);
    rect(0, 0, W, wallH, '#160f1e'); rect(0, wallH - 3, W, 3, '#3a2a44'); rect(0, wallH, W, 1, '#0b0810');
    for (let x = 10; x < W; x += 34) { rect(x, 0, 6, wallH, '#8a2030'); rect(x, 0, 2, wallH, '#c83a4a'); rect(x - 2, wallH - 4, 10, 4, '#5a1420'); }
    for (let x = 27; x < W - 10; x += 34) { rect(x, 4, 8, 14, '#c8a040'); rect(x + 1, 5, 6, 12, '#7a1a26'); rect(x + 3, 8, 2, 6, '#ffd34a'); }
    // 붉은 카펫 + 법진
    const cx = W / 2, cy = H * 0.4;
    rect(cx - 12, cy, 24, H - cy, '#7a1a26'); rect(cx - 12, cy, 2, H - cy, '#d8a838'); rect(cx + 10, cy, 2, H - cy, '#d8a838');
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; rect(cx + Math.cos(a) * 34, cy + Math.sin(a) * 15, 1, 1, '#ffd34a'); if (k % 2 === 0) rect(cx + Math.cos(a) * 24, cy + Math.sin(a) * 10, 1, 1, '#ff6a5a'); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; rect(cx + Math.cos(a) * 29 - 1, cy + Math.sin(a) * 12.5 - 1, 3, 2, '#ffd34a'); }
    // 화로
    arenaLamps = [];
    [[18, H * 0.34], [W - 26, H * 0.34], [18, H * 0.78], [W - 26, H * 0.78]].forEach(([x, y]) => { stoneLamp(x2, x, y); arenaLamps.push({ x: x + 4, y: y - 14, col: '#ff9a4a', r: 12, a: 0.28 }); });
    return c;
  }

  // ---------- 집무실 (계급마다 9단계) ----------
  const OFFICE = [
    { name: '수습 차사의 초가방', floor: ['#5a4630', '#4a3a26'], wall: '#3a2e22', staff: 0 },
    { name: '말단 차사의 방', floor: ['#5a4630', '#4a3a26'], wall: '#3a2e22', staff: 1, shelf: 1 },
    { name: '차사의 사랑방', floor: ['#6a5238', '#5a442e'], wall: '#43342a', staff: 2, shelf: 1, screen: 1, lamp: 1 },
    { name: '선임 차사의 집무실', floor: ['#6a5238', '#5a442e'], wall: '#43342a', staff: 3, shelf: 2, screen: 1, lamp: 2, rug: 1 },
    { name: '차사장의 집무실', floor: ['#7a6040', '#684f34'], wall: '#2e3450', staff: 4, shelf: 3, screen: 1, lamp: 2, rug: 1, brazier: 1 },
    { name: '판관의 관아', floor: ['#4a3c44', '#3e3238'], wall: '#3a1a22', staff: 6, shelf: 3, screen: 2, lamp: 3, rug: 2, brazier: 2, pillar: 1, dais: 1 },
    { name: '명부 판관의 명부각', floor: ['#4a3c44', '#3e3238'], wall: '#3a1a22', staff: 8, shelf: 4, screen: 2, lamp: 4, rug: 2, brazier: 2, pillar: 1, dais: 1, ledger: 1 },
    { name: '시왕의 대전', floor: ['#2e2a48', '#262240'], wall: '#1a1838', staff: 10, shelf: 4, screen: 3, lamp: 4, rug: 3, brazier: 2, pillar: 2, dais: 2, ledger: 1, throne: 1 },
    { name: '염라대왕의 명부전 옥좌', floor: ['#3a2418', '#2e1c12'], wall: '#2a0e0e', staff: 12, shelf: 4, screen: 3, lamp: 6, rug: 3, brazier: 4, pillar: 2, dais: 2, ledger: 1, throne: 2, fire: 1 },
  ];
  let officeLamps = [];
  function bakeOffice(t, w, h) {
    const O = OFFICE[t], c = document.createElement('canvas'); c.width = w; c.height = h; const x2 = c.getContext('2d'), rect = rectOn(x2);
    const wallH = Math.round(h * 0.3), fl = O.floor.map(hex), im = x2.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, b = BAYER[y & 3][x & 3], col = (y % 8 === 0) ? hex(lit(O.floor[1], 0.8)) : fl[b > 0.7 ? 1 : 0]; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    x2.putImageData(im, 0, 0);
    rect(0, 0, w, wallH, O.wall); rect(0, wallH - 2, w, 2, lit(O.wall, 0.6)); rect(0, wallH, w, 1, '#0b0810');
    // 창살 창
    for (let k = 0; k < (t >= 4 ? 3 : 1); k++) { const wx = t >= 4 ? 18 + k * ((w - 60) / 2) : w / 2 - 12; rect(wx, 8, 24, 16, '#e8d8a8'); for (let q = 0; q < 24; q += 6) rect(wx + q, 8, 1, 16, '#6a4a2a'); rect(wx, 15, 24, 1, '#6a4a2a'); rect(wx - 1, 7, 26, 1, '#4a3020'); rect(wx - 1, 24, 26, 1, '#4a3020'); }
    if (O.pillar) for (let x = 6; x < w; x += Math.round(w / (2 + O.pillar * 2))) { rect(x, 0, 5, wallH + 4, '#9a2a2a'); rect(x, 0, 2, wallH + 4, '#c84040'); }
    if (O.shelf) for (let k = 0; k < O.shelf; k++) { const sx = k % 2 ? w - 30 - Math.floor(k / 2) * 0 : 4, sy = wallH - 22 + Math.floor(k / 2) * 0; if (k >= 2) continue; rect(sx, sy, 26, 22, '#5a3a22'); for (let r2 = 0; r2 < 3; r2++) { rect(sx + 2, sy + 2 + r2 * 7, 22, 1, '#3a2414'); for (let b = 0; b < 6; b++) rect(sx + 3 + b * 3.5, sy + 3 + r2 * 7, 2, 5, ['#e8d8a8', '#c83a3a', '#3a6ab0', '#e0b040'][(b + r2 + k) % 4]); } }
    if (O.ledger) { rect(w / 2 - 30, 4, 60, wallH - 10, '#1a1020'); rect(w / 2 - 28, 6, 56, wallH - 14, '#e8d8a8'); for (let k = 0; k < 6; k++) rect(w / 2 - 24 + k * 9, 9, 2, wallH - 20, '#3a2a20'); }
    const cx = w / 2, deskY = wallH + 26;
    if (O.rug) { const rw = 40 + O.rug * 18; rect(cx - rw / 2, wallH + 8, rw, h - wallH - 10, O.rug >= 3 ? '#8a1a26' : '#6a2a3a'); rect(cx - rw / 2 + 2, wallH + 10, rw - 4, 1, '#e0b040'); rect(cx - rw / 2 + 2, h - 5, rw - 4, 1, '#e0b040'); }
    if (O.dais) { rect(cx - 30 - O.dais * 6, wallH + 4, 60 + O.dais * 12, 22, '#5a4a52'); rect(cx - 30 - O.dais * 6, wallH + 4, 60 + O.dais * 12, 2, '#7a6a72'); rect(cx - 30 - O.dais * 6, wallH + 24, 60 + O.dais * 12, 2, '#3a2e34'); }
    if (O.screen) { const sw = 30 + O.screen * 12; rect(cx - sw / 2, wallH - 26, sw, 26, '#2a1a12'); for (let k = 0; k < sw / 8; k++) { rect(cx - sw / 2 + 1 + k * 8, wallH - 25, 7, 24, O.throne ? '#c8a040' : '#e8dcc0'); if (O.screen >= 2) rect(cx - sw / 2 + 3 + k * 8, wallH - 18, 3, 8, O.throne ? '#c83a2a' : '#3a6a5a'); } }
    if (O.throne) { rect(cx - 14, deskY - 26, 28, 30, '#c8a040'); rect(cx - 12, deskY - 24, 24, 24, '#8a1a1a'); rect(cx - 16, deskY - 28, 32, 4, '#ffd34a'); if (O.throne >= 2) { rect(cx - 20, deskY - 32, 4, 34, '#ffd34a'); rect(cx + 16, deskY - 32, 4, 34, '#ffd34a'); } }
    // 책상 (계급이 높을수록 넓고 화려하게)
    const dw = 26 + t * 5; rect(cx - dw / 2, deskY, dw, 8, t >= 5 ? '#6a1a1a' : '#6a4a2a'); rect(cx - dw / 2, deskY, dw, 2, t >= 5 ? '#a83a3a' : '#8a6038'); rect(cx - dw / 2 + 2, deskY + 8, 2, 5, '#3a2414'); rect(cx + dw / 2 - 4, deskY + 8, 2, 5, '#3a2414');
    rect(cx - 6, deskY - 2, 8, 3, '#e8d8a8'); rect(cx + 4, deskY - 3, 2, 4, '#1a1020');
    // 촛불 · 등 · 화로
    officeLamps = [{ x: cx - dw / 2 + 4, y: deskY - 4, col: '#ffcf6a', r: 9, a: 0.3 }];
    rect(cx - dw / 2 + 3, deskY - 4, 2, 4, '#f0f0f0'); rect(cx - dw / 2 + 3, deskY - 5, 2, 1, '#ffd34a');
    for (let k = 0; k < (O.lamp || 0); k++) { const lx = (k % 2 ? w - 14 : 8) + (k >= 2 ? (k % 2 ? -24 : 24) : 0) + (k >= 4 ? (k % 2 ? -24 : 24) : 0), ly = wallH - 6; x2.drawImage(SP.lantern(t >= 6 ? 2 : 1), lx - 3, ly - 6); officeLamps.push({ x: lx, y: ly - 1, col: t >= 6 ? '#ffcf6a' : '#ff8a6a', r: 10, a: 0.25 }); }
    for (let k = 0; k < (O.brazier || 0); k++) { const bx = k % 2 ? w - 18 : 10, by = h - 18 - Math.floor(k / 2) * 40; stoneLamp(x2, bx, by); officeLamps.push({ x: bx + 4, y: by - 14, col: '#ff9a4a', r: 12, a: 0.28 }); }
    // 부하 책상 자리
    const seats = [];
    for (let k = 0; k < O.staff; k++) { const col = k % 2, row = Math.floor(k / 2), sx = col ? w * 0.78 : w * 0.22, sy = wallH + 44 + row * 18; if (sy > h - 8) break; rect(sx - 8, sy - 2, 16, 4, '#5a3a22'); rect(sx - 8, sy - 2, 16, 1, '#7a5232'); rect(sx - 3, sy - 4, 5, 2, '#e8d8a8'); seats.push({ x: sx, y: sy + 9 }); }
    // 소품을 놓을 수 없는 자리 (벽: 창·책장·병풍 / 바닥: 책상·부하 자리·화로)
    const wallB = [], floorB = [{ x: cx - dw / 2 - 3, y: deskY - 1, w: dw + 6, h: 15 }];
    const chairB = { x: cx - dw / 2 - 3, y: deskY - 16, w: dw + 6, h: 15 }; // 책상 뒤: 의자(앉는 소품)만 놓을 수 있는 자리
    for (let k = 0; k < (t >= 4 ? 3 : 1); k++) { const wx = t >= 4 ? 18 + k * ((w - 60) / 2) : w / 2 - 12; wallB.push({ x: wx - 1, y: 7, w: 26, h: 18 }); }
    if (O.shelf) { wallB.push({ x: 3, y: wallH - 23, w: 28, h: 23 }); if (O.shelf > 1) wallB.push({ x: w - 31, y: wallH - 23, w: 28, h: 23 }); }
    if (O.ledger) wallB.push({ x: w / 2 - 31, y: 3, w: 62, h: wallH - 6 });
    if (O.screen) { const sw = 30 + O.screen * 12; wallB.push({ x: cx - sw / 2 - 1, y: wallH - 27, w: sw + 2, h: 27 }); }
    if (O.throne) floorB.push({ x: cx - 21, y: deskY - 33, w: 42, h: 20 });
    seats.forEach(p => floorB.push({ x: p.x - 9, y: p.y - 13, w: 18, h: 17 }));
    for (let k = 0; k < (O.brazier || 0); k++) { const bx = k % 2 ? w - 18 : 10, by = h - 18 - Math.floor(k / 2) * 40; floorB.push({ x: bx - 2, y: by - 20, w: 14, h: 22 }); }
    return { c, seats, wallH, wallB, floorB, chairB, desk: { x: cx, y: deskY - 1 }, docs: { x: cx + dw / 2 - 6, y: deskY - 1 } };
  }
  let officeData = null;
  // 집무실: 걸어 다니기 · 앉기 · 꾸미기 편집
  let me = null, edit = false, ghost = null, hover = null, visit = null; // visit: 남의 집무실 {kind, rank}
  const G = DECOR_G;
  // 소품 칸 → 실제 사각형 (바닥은 격자, 벽은 벽 띠 위 격자)
  function decoRect(id, gx, gy) { const d = Decor.D(id); return { x: gx * G, y: gy * G, w: d.fw * G, h: d.fh * G, wall: !!d.wall }; }
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  function decoFits(id, gx, gy, ignore) {
    if (!officeData) return false; const r = decoRect(id, gx, gy), od = officeData;
    if (r.x < 0 || r.x + r.w > W) return false;
    if (r.wall) { if (r.y < 2 || r.y + r.h > od.wallH - 2) return false; if (od.wallB.some(b => hit(r, b))) return false; }
    else { if (r.y < od.wallH + 4 || r.y + r.h > H - 2) return false; if (od.floorB.some(b => hit(r, b))) return false; if (hit(r, od.chairB) && !Decor.D(id).seat) return false; }
    const placed = hooks.decorPlaced ? hooks.decorPlaced() : [];
    return !placed.some((p, i) => i !== ignore && !!Decor.D(p.id).wall === r.wall && hit(r, decoRect(p.id, p.gx, p.gy)));
  }
  // 앉은 모습: 다리를 감추고 상반신만 엉덩이 높이에 그린 뒤, 의자의 앉는 판을 무릎 위로 다시 그린다
  function drawSeated(im, x, st) {
    const d = st.id ? Decor.D(st.id) : null, cut = st.desk ? 6 : 3, h = im.height - cut;
    let surf;
    if (st.desk) surf = officeData.desk.y + 1;                              // 책상 뒤: 책상 윗면에 가려진 듯
    else { const cim = Decor.img(st.id), r = st.r, top = r.y + r.h - cim.height; surf = d && d.chair ? top + cim.height - 11 : top + 4;
      g.drawImage(im, 0, 0, im.width, h, Math.round(x - im.width / 2), Math.round(surf - h + 1), im.width, h);
      if (d && d.chair) { const sy = cim.height - 12, cx = Math.round(r.x + (r.w - cim.width) / 2); g.drawImage(cim, 0, sy, cim.width, cim.height - sy, cx, Math.round(top + sy), cim.width, cim.height - sy); }   // 앉는 판·다리를 앞에
      else { g.fillStyle = '#1a1424'; g.fillRect(Math.round(x - 5), Math.round(surf - 1), 10, 2); }                                                   // 방석: 접은 다리
      return surf; }
    g.drawImage(im, 0, 0, im.width, h, Math.round(x - im.width / 2), Math.round(surf - h), im.width, h);
    return surf;
  }
  // 내가 앉을 수 있는 자리: 남의 방에서는 주인의 책상 자리는 빼고
  const mySeats = () => visit ? seatSpots().filter(q => !q.desk && !q.atDesk) : seatSpots();
  function seatSpots() {
    const list = [];
    (hooks.decorPlaced ? hooks.decorPlaced() : []).forEach(p => { const d = Decor.D(p.id); if (d.seat) { const r = decoRect(p.id, p.gx, p.gy); list.push({ x: r.x + r.w / 2, y: r.y + r.h - (d.id === 'throne' ? 7 : d.chair ? 3 : 2), id: d.id, r, atDesk: hit(r, officeData.chairB) }); } });
    // 책상 뒤에 의자를 놓지 않았으면 기본 자리(책상)에 앉는다
    if (!list.some(q => q.atDesk)) list.unshift({ x: officeData.desk.x, y: officeData.desk.y - 6, desk: true });
    return list;
  }

  // ---------- 개체 ----------
  function resize() {
    const r = cv.getBoundingClientRect();
    S = r.width >= 700 ? 3 : 2;
    W = Math.max(80, Math.ceil(r.width / S)); H = Math.max(100, Math.ceil(r.height / S));
    cv.width = W; cv.height = H; g.imageSmoothingEnabled = false;
    if (!groundC) build();
  }
  function randGround() { for (let k = 0; k < 30; k++) { const x = rnd(2 * T, MW - 2 * T), y = rnd(3 * T, MH - 2 * T); if (walkable(x, y) && tileAt(x, y) !== 4) return [x, y]; } return [13 * T, 15 * T]; }
  function spawnSoul() {
    const r = cfg.roll();
    let x, y;
    if (cfg.parade) { x = camX + rnd(10, W - 10); y = camY + rnd(20, H - 10); if (!walkable(x, y)) return; if (r.sp < 0 && Math.random() < 0.15) r.tier = 2; }
    else [x, y] = randGround();
    souls.push({ x, y, tier: r.tier, sp: r.sp, ph: rnd(0, 6), t: 0, st: 'float', who: null, a: 0, h: 9 });
  }
  function pickSoul(u) {
    let best = null, bd = 1e9;
    for (const s of souls) if (s.st === 'float' && !s.who && !s.tut && s.a > 0.6) { const d = Math.hypot(s.x - u.x, s.y - u.y); if (d < bd) { bd = d; best = s; } }
    return bd < 220 ? best : null;
  }
  function setDir(u, dx, dy) { if (Math.abs(dx) > Math.abs(dy) * 1.1) { u.dir = 'side'; u.face = dx < 0 ? -1 : 1; } else u.dir = dy < 0 ? 'up' : 'down'; }
  function stepTo(u, tx, ty, v) { const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy); if (d <= v) { u.x = tx; u.y = ty; return true; } u.x += dx / d * v; u.y += dy / d * v; setDir(u, dx, dy); return false; }
  function sweep(u, s, reap, isMain) {
    const Rr = isMain ? (cfg.reapR || 14) * 1.3 : 10, max = isMain ? (cfg.reapMax || 3) : 1; let n = 0;
    for (const o of souls) { if (n >= max) break; if (o === s || o.st !== 'float' || o.who || o.a < 0.6) continue; if (Math.hypot(o.x - s.x, o.y - s.y) > Rr) continue; o.st = 'pull'; o.t = -rnd(0, 0.15); o.who = u; o.sx = o.x; o.sy = o.y - o.h; o.dur = reap; n++; }
  }
  function think(u, dt, walk, reap, isMain) {
    u.t += dt; u.ft += dt;
    if (isMain && u.manual) {
      if (u.target && u.target.who === u && u.target.st === 'float') u.target.who = null;
      u.target = null;
      if (stepTo(u, u.manual.x, u.manual.y, walk * 1.15 * dt)) { u.manual = null; u.st = 'idle'; u.t = 0; } else u.st = 'move';
      return;
    }
    if (u.st === 'idle') {
      const s = pickSoul(u);
      if (s) { s.who = u; u.target = s; u.st = 'walk'; u.t = 0; }
      else if (u.t > (isMain ? 4 : 2)) { const [x, y] = randGround(); u.wx = u.x + (x - u.x) * 0.3; u.wy = u.y + (y - u.y) * 0.3; u.st = 'wander'; }
    } else if (u.st === 'wander') {
      if (pickSoul(u)) { u.st = 'idle'; u.t = 0; return; }
      if (stepTo(u, u.wx, u.wy, walk * 0.5 * dt)) { u.st = 'idle'; u.t = 0; }
    } else if (u.st === 'walk') {
      const s = u.target; if (!s || s.st !== 'float') { u.st = 'idle'; u.t = 0; return; }
      const side = s.x > u.x ? -1 : 1;
      if (stepTo(u, s.x + side * 7, s.y + 2, walk * dt)) { u.st = 'reap'; u.t = 0; u.dir = 'down'; u.face = s.x > u.x ? 1 : -1; s.st = 'pull'; s.t = 0; s.who = u; s.sx = s.x; s.sy = s.y - s.h; s.dur = reap; if (isMain) Sound.play('reap'); sweep(u, s, reap, isMain); }
    } else if (u.st === 'reap') { if (u.t >= reap + 0.15) { u.st = 'idle'; u.t = 0; u.target = null; } }
  }
  const handPos = u => ({ x: u.x + (u.mini ? 3 : 5), y: u.y - (u.mini ? 8 : 10) });
  const scr = (x, y) => ({ x: (x - camX) * S, y: (y - camY) * S });
  function burst(x, y, col, n, spd) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(spd * 0.4, spd); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: rnd(0.4, 0.8), max: 0.8, col, g: 30 }); } }
  function update(dt) {
    if (office) {
      time += dt; fade = Math.max(0, fade - dt * 1.5); reaper.ft += dt;
      if (me) { me.ft += dt; if (me.walk) { const dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy), v = 40 * dt; if (d <= v) { me.x = me.tx; me.y = me.ty; me.walk = false; if (me.goSit) { me.sit = me.goSit; me.goSit = null; } } else { me.x += dx / d * v; me.y += dy / d * v; me.dir = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down'; if (Math.abs(dx) > 0.3) me.face = dx > 0 ? 1 : -1; } } }
      if (Math.random() < dt * 2) (hooks.decorPlaced ? hooks.decorPlaced() : []).forEach(p => { const d = Decor.D(p.id); if (d.smoke) { const r = decoRect(p.id, p.gx, p.gy); parts.push({ x: r.x + r.w / 2 + rnd(-1, 1), y: r.y + r.h - 12, vx: rnd(-1.5, 1.5), vy: -rnd(4, 8), life: 1.6, max: 1.6, col: '#d8d0c8', g: 0 }); } });
      staff.forEach(m => { m.ft += dt; m.t -= dt; if (m.walk) { const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy), v = 14 * dt; if (d <= v) { m.x = m.tx; m.y = m.ty; m.walk = false; m.t = rnd(3, 8); } else { m.x += dx / d * v; m.y += dy / d * v; m.dir = Math.abs(dx) > Math.abs(dy) ? 'down' : dy < 0 ? 'up' : 'down'; } } else if (m.t <= 0) { if (Math.random() < 0.4) { m.walk = true; m.tx = rnd(W * 0.15, W * 0.85); m.ty = rnd(H * 0.45, H * 0.92); } else { m.walk = true; m.tx = m.sx; m.ty = m.sy; } } });
      parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }); parts = parts.filter(p => p.life > 0);
      if (OFFICE[officeTier].fire && Math.random() < 0.4) parts.push({ x: W / 2 + rnd(-22, 22), y: officeData.desk.y - rnd(20, 34), vx: 0, vy: -rnd(8, 16), life: 1, max: 1, col: Math.random() < 0.5 ? '#ff7a30' : '#ffd34a', g: 0 });
      camX = 0; camY = 0; return;
    }
    if (arena) {
      time += dt; fade = Math.max(0, fade - dt * 1.5); reaper.ft += dt; reaper.st = wraith && !wraith.dead ? 'reap' : 'idle'; reaper.dir = 'up';
      parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }); parts = parts.filter(p => p.life > 0);
      if (wraith) { wraith.t += dt; wraith.flash = Math.max(0, wraith.flash - dt); wraith.x = W / 2 + Math.sin(wraith.t * 0.9) * 18; if (wraith.dead) { wraith.fade -= dt; if (wraith.fade <= 0) wraith = null; } else if (wraith.t > wraith.life) { wraith.dead = true; wraith.fade = 0.6; hooks.wraithGone && hooks.wraithGone(); } }
      if (pet) { pet.t += dt; pet.x += ((reaper.x - 16) - pet.x) * Math.min(1, dt * 4); pet.y += ((reaper.y + 2) - pet.y) * Math.min(1, dt * 4); }
      shake = Math.max(0, shake - dt * 20); camX = 0; camY = 0; return;
    }
    time += dt; const sd = dt * cfg.speed; spawnT += sd;
    const vis = Math.min(5, cfg.minions);
    if (spawnT >= (cfg.parade ? 0.09 : cfg.spawn)) { spawnT = 0; if (souls.filter(s => s.st === 'float').length < (cfg.parade ? 45 : Math.round((cfg.maxSouls + vis * 2) * 1.6))) spawnSoul(); }
    think(reaper, sd, cfg.walk, cfg.reap, true);
    while (minions.length < vis) { const [x, y] = randGround(); minions.push({ x, y, st: 'idle', t: 0, ft: 0, face: 1, dir: 'down', mini: true }); }
    while (minions.length > vis) minions.pop();
    minions.forEach(m => think(m, sd, cfg.mWalk, cfg.mReap, false));
    for (const s of souls) {
      s.t += sd; s.a = Math.min(1, s.a + dt * 2);
      if (s.st === 'pull') {
        const p = handPos(s.who), k = Math.max(0, Math.min(1, s.t / s.dur)), e = k * k, sw = Math.sin(k * Math.PI) * 6 * (1 - k);
        s.px = s.sx + (p.x - s.sx) * e + Math.cos(k * 9) * sw; s.py = s.sy + (p.y - s.sy) * e + Math.sin(k * 9) * sw; s.scale = 1 - k * 0.6;
        if (Math.random() < 0.5) parts.push({ x: s.px + rnd(-2, 2), y: s.py + rnd(-2, 2), vx: 0, vy: -4, life: 0.35, max: 0.35, col: SP.SOUL_PAL[s.tier].Q, g: 0 });
        if (k >= 1) { s.st = 'done'; burst(p.x, p.y, SP.SOUL_PAL[s.tier].z, 8 + s.tier * 4, 30); const sp = scr(p.x, p.y); hooks.collect && hooks.collect(s, s.who === reaper ? 'main' : s.who.tap ? 'tap' : 'minion', sp.x, sp.y); }
      }
    }
    souls = souls.filter(s => s.st !== 'done');
    if (cfg.parade) { if (Math.random() < dt * 2.6) { const fromL = Math.random() < 0.5; ghosts.push({ x: fromL ? camX - 10 : camX + W + 10, y: camY + rnd(48, H - 30), t: 0, v: (fromL ? 1 : -1) * rnd(16, 26), gold: Math.random() < 0.1 }); } if (Math.random() < 0.5) parts.push({ x: camX + rnd(0, W), y: camY + rnd(0, H), vx: rnd(4, 10), vy: -rnd(0, 4), life: 1.2, max: 1.2, col: Math.random() < 0.5 ? '#6fb0ff' : '#ff6a8a', g: 0 }); }
    ghosts.forEach(gh => { gh.t += dt; gh.x += (gh.v || 16) * dt; }); ghosts = ghosts.filter(gh => !gh.dead && gh.x > camX - 30 && gh.x < camX + W + 30 && gh.t < 30); if (!cfg.parade && ghosts.length) ghosts = [];
    if (R().id === 'hell' && Math.random() < 0.3) parts.push({ x: camX + rnd(0, W), y: camY + rnd(0, H), vx: rnd(-3, 3), vy: -rnd(6, 14), life: 1.6, max: 1.6, col: Math.random() < 0.5 ? '#ff7a20' : '#ffd040', g: 0 });
    parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }); parts = parts.filter(p => p.life > 0);
    if (petData) { if (!pet) pet = { x: reaper.x, y: reaper.y, t: 0, face: 1 }; pet.t += dt; const tx = reaper.x - reaper.face * 12, ty = reaper.y + 2; pet.x += (tx - pet.x) * Math.min(1, dt * 4); pet.y += (ty - pet.y) * Math.min(1, dt * 4); pet.face = tx > pet.x + 0.5 ? 1 : tx < pet.x - 0.5 ? -1 : reaper.face; pet.fly = petData.kind === 'bird' || petData.kind === 'dragon'; } else pet = null;
    if (wraith) { wraith.t += dt; wraith.flash = Math.max(0, wraith.flash - dt); wraith.x += Math.sin(wraith.t * 0.7) * dt * 6; if (wraith.dead) { wraith.fade -= dt; if (wraith.fade <= 0) wraith = null; } else if (wraith.t > wraith.life) { wraith.dead = true; wraith.fade = 0.6; hooks.wraithGone && hooks.wraithGone(); } }
    shake = Math.max(0, shake - dt * 20);
    if (!follow && time > followAt) follow = true;
    if (follow) { camX += ((reaper.x - W / 2) - camX) * Math.min(1, dt * 3); camY += ((reaper.y - H / 2) - camY) * Math.min(1, dt * 3); }
    camX = MW <= W ? (MW - W) / 2 : Math.max(0, Math.min(MW - W, camX)); camY = MH <= H ? (MH - H) / 2 : Math.max(0, Math.min(MH - H, camY));
  }

  // ---------- 그리기 ----------
  const flipped = new Map();
  const flipOf = c => { if (!flipped.has(c)) flipped.set(c, flipX(c)); return flipped.get(c); };
  function glow(x, y, r, col, a) { const C = hex(col); g.fillStyle = `rgba(${C[0]},${C[1]},${C[2]},${a})`; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = Math.hypot(xx, yy) / r; if (d <= 1 && BAYER[(yy + 64) & 3][(xx + 64) & 3] > d * 0.95) g.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1); } }
  const vis = (x, y, m = 30) => x - camX > -m && x - camX < W + m && y - camY > -m && y - camY < H + m + 30;
  function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(x - camX - w / 2), Math.round(y - camY - 1), w, 2); }
  function sprite(img, x, y, flip) { const im = flip ? flipOf(img) : img; g.drawImage(im, Math.round(x - camX - im.width / 2), Math.round(y - camY - im.height + 1)); return im; }
  // 계급 아우라: 발밑 기운 + 떠오르는 빛가루 (계급이 오를수록 진하고 많아짐)
  const AURA = [null, ['#9ab0d8'], ['#6fb0ff'], ['#c8d0ff', '#ffffff'], ['#ffd34a', '#6fb0ff'], ['#ff5a5a', '#ffb0b0'], ['#ff3a5a', '#ffd34a'], ['#6a8aff', '#ffd34a', '#ffffff'], ['#ffd34a', '#ff7a30', '#fff0a0']];
  function auraUnder(u) { drawMagic(g, u.x - camX, u.y - camY, Math.min(rank, 8), time); }
  function aura(u) {
    const A = AURA[Math.min(rank, 8)]; if (!A) return;
    const m = magicMotes(rank); if (!m || Math.random() > m * 0.12) return; // 마법진 가장자리에서 빛가루
    const q = Math.random() * Math.PI * 2, R = 8 + rank * 1.1;
    parts.push({ x: u.x + Math.cos(q) * R, y: u.y + Math.sin(q) * R * 0.42, vx: rnd(-1, 1), vy: -rnd(10, 18 + rank * 2), life: 0.8 + rank * 0.06, max: 0.8 + rank * 0.06, col: A[(Math.random() * A.length) | 0], g: 0 });
  }
  // ===== 순위 이펙트: 1위 금 · 2~5위 은 · 6~10위 동 =====
  let rfx = 0;
  const RFX = { 1: { c: ['#ffd34a', '#fff3b0', '#ff8a5a', '#ffffff', '#7ad0ff', '#ff6ad0'], ring: '#ffd34a', r: 13, n: 18, glow: 0.32, sp: 0.4 },
    2: { c: ['#e8eeff', '#b8c8ff', '#ffffff'], ring: '#dfe8ff', r: 11, n: 12, glow: 0.22, sp: 0.18 },
    3: { c: ['#ffb070', '#e0904a', '#ffe0b0'], ring: '#e0904a', r: 9, n: 3, glow: 0.14, sp: 0.07 } };
  function rankFxUnder(u) {
    const F = RFX[rfx]; if (!F) return;
    const x = u.x - camX, y = u.y - camY, pulse = Math.sin(time * 4) * 0.5 + 0.5;
    glow(x, y - 6, F.r + 3, F.ring, F.glow + pulse * 0.08);
    if (rfx === 3) { for (let i = 0; i < 3; i++) { const a = time * 2.2 + i * 2.09; g.fillStyle = F.c[i]; g.fillRect(Math.round(x + Math.cos(a) * F.r) - 1, Math.round(y - 6 + Math.sin(a) * F.r * 0.45) - 1, 2, 2); } return; }
    for (let i = 0; i < F.n; i++) { const a = i / F.n * Math.PI * 2 + time * 1.4; g.globalAlpha = 0.55 + 0.45 * Math.sin(time * 6 + i); g.fillStyle = F.ring; g.fillRect(Math.round(x + Math.cos(a) * F.r), Math.round(y + Math.sin(a) * F.r * 0.4), 1, 1); }
    if (rfx === 1) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - time * 2; g.globalAlpha = 0.9; g.fillStyle = F.c[i % F.c.length]; g.fillRect(Math.round(x + Math.cos(a) * (F.r - 4)), Math.round(y - 1 + Math.sin(a) * (F.r - 4) * 0.4), 1, 1); }
    g.globalAlpha = 1;
  }
  // 머리 위 표식 (1위 왕관 · 2~5위 은관 · 6~10위 동별). 표식을 그렸으면 true
  function rankFxOver(u, im) {
    const F = RFX[rfx]; if (!F) return false;
    const cx = Math.round(u.x - camX), top = Math.round(u.y - camY - im.height - 1 + Math.sin(time * 3) * 1.2);
    if (Math.random() < F.sp) parts.push({ x: u.x + rnd(-8, 8), y: u.y - rnd(0, 18), vx: rnd(-3, 3), vy: -rnd(10, 22), life: rnd(0.6, 1.2), max: 1.2, col: F.c[(Math.random() * F.c.length) | 0], g: 0 });
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(cx + x, top + y, w, h); };
    if (rfx === 1) {
      glow(cx, top - 1, 6, '#ffd34a', 0.35 + Math.sin(time * 5) * 0.1);
      R(-4, -4, 9, 6, '#0f0c18'); R(-3, -3, 7, 4, '#ffd34a'); R(-3, -5, 1, 2, '#0f0c18'); R(0, -6, 1, 3, '#0f0c18'); R(3, -5, 1, 2, '#0f0c18');
      R(-3, -4, 1, 1, '#ffd34a'); R(0, -5, 1, 2, '#ffd34a'); R(3, -4, 1, 1, '#ffd34a'); R(-2, -1, 5, 1, '#c89a30'); R(0, -2, 1, 1, '#e83a3a'); R(-2, -2, 1, 1, '#7ad0ff'); R(2, -2, 1, 1, '#7ad0ff');
      if (Math.floor(time * 3) % 4 === 0) { R(4, -6, 1, 1, '#ffffff'); }
    } else if (rfx === 2) {
      R(-3, -3, 7, 4, '#0f0c18'); R(-2, -2, 5, 2, '#dfe8ff'); R(-2, -4, 1, 2, '#0f0c18'); R(0, -4, 1, 2, '#0f0c18'); R(2, -4, 1, 2, '#0f0c18'); R(-2, -3, 1, 1, '#dfe8ff'); R(0, -3, 1, 1, '#dfe8ff'); R(2, -3, 1, 1, '#dfe8ff'); R(0, -1, 1, 1, '#7a9aff');
    } else {
      R(-1, -3, 3, 3, '#0f0c18'); R(0, -4, 1, 5, '#0f0c18'); R(-2, -2, 5, 1, '#0f0c18'); R(0, -3, 1, 3, '#ffb070'); R(-1, -2, 3, 1, '#ffb070');
    }
    return true;
  }
  function unitImg(u) {
    const moving = u.st === 'walk' || u.st === 'wander' || u.st === 'move', pose = moving ? 'walk' : u.st === 'reap' ? 'reap' : 'idle';
    const fi = Math.floor(u.ft * (moving ? 8 : 2.5));
    return u.mini ? SP.minit(u.dir === 'up' ? 'up' : 'down', pose, fi) : SP.tinyReaper(kind, rank, u.dir, pose, fi);
  }
  // 이야기 단서 위치: 장마다 지도 위 걸을 수 있는 빈자리 하나 (지역·장 번호로 고정)
  const clueCache = {};
  function clueSpot(ch) {
    const key = region + '_' + ch; if (clueCache[key]) return clueCache[key];
    const r = seeded(ch * 97 + region * 13 + 7);
    for (let k = 0; k < 200; k++) { const x = (3 + r() * (TW - 6)) * T, y = (5 + r() * (TH - 9)) * T; if (!walkable(x, y)) continue; if (objs.some(o => x > o.x - 6 && x < o.x + o.img.width + 6 && y > o.y - 4 && y < o.base + 8)) continue; if (NPCS.some(n => Math.hypot(n.x - x, n.y - y) < 20)) continue; return (clueCache[key] = { x, y }); }
    return (clueCache[key] = { x: 13 * T, y: 16 * T });
  }
  function render() {
    if (office) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(officeData.c, 0, 0);
      for (const l of officeLamps) glow(l.x, l.y, l.r + Math.round(Math.sin(time * 6 + l.x) * 0.8), l.col, l.a);
      const list = [];
      staff.forEach(m => list.push({ y: m.y, f: () => { shadow(m.x, m.y, 7); const im = m.judge ? SP.tinyReaper('m', 5, 'down', m.walk ? 'walk' : 'idle', Math.floor(m.ft * (m.walk ? 8 : 2.5))) : SP.minit(m.walk ? m.dir : 'up', m.walk ? 'walk' : 'idle', Math.floor(m.ft * (m.walk ? 8 : 2.5))); g.drawImage(im, Math.round(m.x - im.width / 2), Math.round(m.y - im.height + 1)); } }));
      const placed = hooks.decorPlaced ? hooks.decorPlaced() : [];
      // 벽 소품
      placed.forEach((p, i) => { const d = Decor.D(p.id); if (!d.wall || (pend && pend.from === i)) return; const r = decoRect(p.id, p.gx, p.gy), im = Decor.img(p.id); if (d.glow) glow(r.x + r.w / 2, r.y + r.h / 2, 10, d.glow, 0.22 + Math.sin(time * 4 + i) * 0.05); g.drawImage(im, Math.round(r.x + (r.w - im.width) / 2), Math.round(r.y + (r.h - im.height) / 2)); if (edit) { g.strokeStyle = 'rgba(255,211,74,0.7)'; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); } });
      // 바닥 소품 (깊이 정렬)
      placed.forEach((p, i) => { const d = Decor.D(p.id); if (d.wall || (pend && pend.from === i)) return; const r = decoRect(p.id, p.gx, p.gy); list.push({ y: r.y + r.h - 1, f: () => { const im = Decor.img(p.id); if (d.glow) glow(r.x + r.w / 2, r.y + r.h - im.height / 2, 10, d.glow, 0.2 + Math.sin(time * 4 + i) * 0.05); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r.x + 2, r.y + r.h - 2, r.w - 4, 2); g.drawImage(im, Math.round(r.x + (r.w - im.width) / 2), Math.round(r.y + r.h - im.height)); if (edit) { g.strokeStyle = 'rgba(255,211,74,0.7)'; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); } } }); });
      // 남의 방: 주인이 책상 의자에 앉아 있다
      if (visit) { const os = seatSpots().find(q => q.atDesk || q.desk); if (os) list.push({ y: os.desk ? officeData.desk.y - 2 : os.r.y + os.r.h - 0.5, f: () => { drawMagic(g, os.x, os.y, Math.min(visit.rank, 8), time); const im = SP.tinyReaper(visit.kind || 'm', visit.rank, 'down', 'idle', Math.floor(time * 2.5)); drawSeated(im, os.x, os); } }); }
      // 나 (앉아 있거나 걸어 다님)
      if (!visit && me && me.sit && !me.sit.desk && me.sit.r && !seatSpots().some(q => q.r && q.r.x === me.sit.r.x && q.r.y === me.sit.r.y)) me.sit = seatSpots().find(q => q.atDesk || q.desk);
      if (me) { const sit = me.sit, y0 = sit ? sit.y + (sit.desk ? 0 : 1) : me.y; list.push({ y: sit ? (sit.desk ? officeData.desk.y - 2 : sit.r.y + sit.r.h - 0.5) : me.y, f: () => {
        const x = sit ? sit.x : me.x; auraUnder({ x: x + camX, y: y0 + camY }); rankFxUnder({ x: x + camX, y: y0 + camY });
        const moving = me.walk && !sit, im0 = SP.tinyReaper(kind, rank, sit ? 'down' : me.dir, moving ? 'walk' : 'idle', Math.floor((moving ? me.ft * 8 : time * 2.5))), im = me.dir === 'side' && me.face < 0 && !sit ? flipOf(im0) : im0;
        if (!sit) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(Math.round(x - 5), Math.round(y0 - 1), 10, 2); }
        if (sit) { const sf = drawSeated(im, x, sit); rankFxOver({ x: x + camX, y: sf + camY - 6 }, im); }
        else { g.drawImage(im, Math.round(x - im.width / 2), Math.round(y0 - im.height + 1)); rankFxOver({ x: x + camX, y: y0 + camY }, im); } } }); }
      list.sort((a, b) => a.y - b.y).forEach(o => o.f());
      if (edit) { // 격자 + 놓을 자리 미리보기
        g.fillStyle = 'rgba(255,255,255,0.07)'; for (let x = 0; x <= W; x += G) g.fillRect(x, 0, 1, H); for (let y = 0; y <= H; y += G) g.fillRect(0, y, W, 1);
        g.fillStyle = 'rgba(255,60,80,0.12)'; officeData.floorB.concat(officeData.wallB).forEach(b => g.fillRect(b.x, b.y, b.w, b.h));
        { const b = officeData.chairB; g.fillStyle = 'rgba(90,170,255,0.18)'; g.fillRect(b.x, b.y, b.w, b.h); g.fillStyle = 'rgba(160,210,255,0.9)'; g.fillRect(b.x + b.w / 2 - 3, b.y + 3, 6, 1); g.fillRect(b.x + b.w / 2 - 3, b.y + 3, 1, 6); g.fillRect(b.x + b.w / 2 + 2, b.y + 3, 1, 6); g.fillRect(b.x + b.w / 2 - 3, b.y + 8, 6, 1); }
        if (pend) { const r = decoRect(pend.id, pend.gx, pend.gy), ok = decoFits(pend.id, pend.gx, pend.gy, pend.from), im = Decor.img(pend.id), bob = Math.round(Math.sin(time * 6) * 1);
          g.fillStyle = ok ? 'rgba(80,255,140,0.22)' : 'rgba(255,60,80,0.3)'; g.fillRect(r.x, r.y, r.w, r.h); g.globalAlpha = 0.92; g.drawImage(im, Math.round(r.x + (r.w - im.width) / 2), Math.round((r.wall ? r.y + (r.h - im.height) / 2 : r.y + r.h - im.height) - 1 + bob)); g.globalAlpha = 1;
          g.strokeStyle = ok ? '#7fffb0' : '#ff6a7a'; g.setLineDash([2, 2]); g.lineDashOffset = -Math.floor(time * 8); g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); g.setLineDash([]); }
        if (ghost && hover) { const r = decoRect(ghost, hover.gx, hover.gy), ok = decoFits(ghost, hover.gx, hover.gy, hover.ignore), im = Decor.img(ghost); g.fillStyle = ok ? 'rgba(80,255,140,0.25)' : 'rgba(255,60,80,0.3)'; g.fillRect(r.x, r.y, r.w, r.h); g.globalAlpha = 0.75; g.drawImage(im, Math.round(r.x + (r.w - im.width) / 2), Math.round(r.wall ? r.y + (r.h - im.height) / 2 : r.y + r.h - im.height)); g.globalAlpha = 1; }
      }
      // 결재함
      const dc = hooks.docsCount ? hooks.docsCount() : 0, dp = officeData.docs;
      for (let k = 0; k < dc; k++) { g.fillStyle = '#efe0b8'; g.fillRect(dp.x - 4, dp.y - 3 - k * 2, 8, 2); g.fillStyle = '#b8a070'; g.fillRect(dp.x - 4, dp.y - 2 - k * 2, 8, 1); }
      if (dc) { glow(dp.x, dp.y - 4, 6, '#ffe08a', 0.3 + Math.sin(time * 5) * 0.1); g.fillStyle = '#0f0c18'; g.fillRect(dp.x - 2, dp.y - 16, 5, 9); g.fillStyle = '#ffd34a'; g.fillRect(dp.x - 1, dp.y - 15, 3, 4); g.fillRect(dp.x - 1, dp.y - 10, 3, 2); }
      for (const p of parts) { g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
      g.globalAlpha = 1;
      if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
      return;
    }
    if (arena) {
      const ox = shake ? Math.round(rnd(-shake, shake)) : 0; g.setTransform(1, 0, 0, 1, ox, 0);
      g.drawImage(arenaC, 0, 0);
      for (const l of arenaLamps) glow(l.x, l.y, l.r + Math.round(Math.sin(time * 6 + l.x) * 0.8), l.col, l.a);
      glow(W / 2, H * 0.4, 30, '#ff3a4a', 0.08 + Math.sin(time * 3) * 0.03);
      if (wraith) {
        const img = SP.wraith(Math.floor(wraith.t * 3)), y = wraith.y + Math.sin(wraith.t * 2) * 3;
        g.globalAlpha = wraith.dead ? Math.max(0, wraith.fade / 0.6) : Math.min(1, wraith.t * 2);
        glow(wraith.x, y, 22, '#ff2e4a', 0.16);
        g.drawImage(img, Math.round(wraith.x - img.width / 2 + (wraith.flash ? rnd(-1, 1) : 0)), Math.round(y - img.height / 2));
        if (wraith.flash) { g.globalAlpha = wraith.flash * 3; g.globalCompositeOperation = 'lighter'; g.drawImage(img, Math.round(wraith.x - img.width / 2), Math.round(y - img.height / 2)); g.globalCompositeOperation = 'source-over'; }
        g.globalAlpha = 1;
        if (!wraith.dead) { const bw = Math.round(W * 0.6), bx = Math.round((W - bw) / 2), by = Math.round(H * 0.22) + 4; g.fillStyle = '#0f0c18'; g.fillRect(bx - 1, by - 1, bw + 2, 6); g.fillStyle = '#4a1020'; g.fillRect(bx, by, bw, 4); g.fillStyle = '#ff3a5a'; g.fillRect(bx, by, Math.round(bw * wraith.hp / wraith.max), 4); g.fillStyle = '#ff9aaa'; g.fillRect(bx, by, Math.round(bw * wraith.hp / wraith.max), 1); }
      }
      if (pet && petData) { const im = SP.petTiny(petData, Math.floor(pet.t * 3)); drawPetAura(g, pet.x, pet.y + 1, im.width, im.height, petData.g, petData.star, time, 1); g.drawImage(im, Math.round(pet.x - im.width / 2), Math.round(pet.y - im.height + 1)); }
      shadow(reaper.x, reaper.y, 10);
      const im = sprite(SP.tinyReaper(kind, rank, 'up', 'idle', Math.floor(reaper.ft * 2.5)), reaper.x, reaper.y, false);
      if (reaper.st === 'reap') glow(reaper.x, reaper.y - 14, 5, '#ffe08a', 0.4);
      for (const p of parts) { g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.big ? 2 : 1, p.big ? 2 : 1); }
      g.globalAlpha = 1;
      if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
      g.setTransform(1, 0, 0, 1, 0, 0); return;
    }
    const ox = shake ? Math.round(rnd(-shake, shake)) : 0;
    g.setTransform(1, 0, 0, 1, ox, 0);
    g.fillStyle = '#0b0a12'; g.fillRect(0, 0, W, H);
    g.drawImage(groundC, -Math.round(camX), -Math.round(camY));
    // 물 반짝임
    g.fillStyle = 'rgba(190,210,255,0.55)';
    for (let i = 0; i < 18; i++) { const x = (i * 53 + time * 6) % MW, y = (i * 97) % MH; if (tileAt(x, y) === 2 && vis(x, y)) g.fillRect(Math.round(x - camX), Math.round(y - camY), 3, 1); }
    // 꽃밭 식물
    if (typeof Life !== 'undefined' && Game.S && Game.S.garden) PLOTS.forEach((p, i) => {
      if (!vis(p.x, p.y)) return;
      const st = i < Game.S.plots ? Life.plotState(i) : null;
      const img = st && !st.empty ? SP.plant(st.stage, st.f.pal, st.f.id) : SP.plant(-1, {}, 'soil');
      if (i >= Game.S.plots) g.globalAlpha = 0.35;
      g.drawImage(img, Math.round(p.x - camX - 8), Math.round(p.y - camY - 14)); g.globalAlpha = 1;
      if (st && st.ready) glow(p.x - camX, p.y - camY - 8, 7, '#ffe08a', 0.25 + Math.sin(time * 4) * 0.08);
    });
    // y 순서대로 그릴 것 모으기
    const list = [];
    objs.forEach(o => { if (vis(o.x + o.img.width / 2, o.base, o.img.width)) list.push({ y: o.base, f: () => {
      g.drawImage(o.img, Math.round(o.x - camX), Math.round(o.y - camY));
      if (!o.prop || !hooks.propReady) return;
      const cx = Math.round(o.x + o.img.width / 2 - camX), ready = hooks.propReady(o.key);
      if (o.prop === 'lamp' && !ready) { glow(cx, o.y + 7 - camY, 8, '#ffcf6a', 0.32 + Math.sin(time * 6 + o.x) * 0.05); g.fillStyle = '#ffe08a'; g.fillRect(cx - 1, Math.round(o.y + 6 - camY), 2, 2); }
      if (ready) { const sy = Math.round(o.y - 3 - camY + Math.sin(time * 3 + o.x) * 1.5), tw = (Math.floor(time * 4 + o.x) % 4); g.fillStyle = '#0f0c18'; g.fillRect(cx - 2, sy - 2, 5, 5); g.fillStyle = tw === 0 ? '#ffffff' : '#ffe08a'; g.fillRect(cx, sy - 2, 1, 5); g.fillRect(cx - 2, sy, 5, 1); g.fillStyle = '#ffffff'; g.fillRect(cx, sy, 1, 1); }
    } }); });
    // 이야기 단서 (✦ 빛나는 종이)
    const cl = hooks.clue ? hooks.clue() : -1;
    if (cl >= 0) { const p = clueSpot(cl); if (vis(p.x, p.y)) list.push({ y: p.y, f: () => { const x = Math.round(p.x - camX), y = Math.round(p.y - camY), b = Math.sin(time * 3) * 1.5; glow(x, y - 5 + b, 9, '#9fd6ff', 0.35 + Math.sin(time * 5) * 0.1); g.fillStyle = '#0f0c18'; g.fillRect(x - 4, Math.round(y - 9 + b), 8, 7); g.fillStyle = '#efe2bf'; g.fillRect(x - 3, Math.round(y - 8 + b), 6, 5); g.fillStyle = '#2a1a14'; g.fillRect(x - 2, Math.round(y - 7 + b), 4, 1); g.fillRect(x - 2, Math.round(y - 5 + b), 3, 1); if (Math.random() < 0.15) parts.push({ x: p.x + rnd(-4, 4), y: p.y - 8, vx: rnd(-2, 2), vy: -rnd(8, 14), life: 0.8, max: 0.8, col: '#c8ecff', g: 0 }); } }); }
    for (const n of NPCS) {
      if (n.cond === 'merchant' && !cfg.merchant) continue; if (!vis(n.x, n.y)) continue;
      list.push({ y: n.y, f: () => {
        let img = n.id === 'judge' ? SP.tinyReaper('m', 5, 'down', 'idle', Math.floor(time * 2.5)) : n.id === 'kkachi' ? SP.pet(PETS[0], Math.floor(time * 2)) : SP.npct(n.id, Math.floor(time * 2.5));
        if (!n.perch) shadow(n.x, n.y, 8);
        const im = sprite(img, n.x, n.y, (n.face || 1) < 0);
        if (hooks.npcHot && hooks.npcHot(n.id)) { const ex = Math.round(n.x - camX), ey = Math.round(n.y - camY - im.height - 6 + Math.sin(time * 5) * 1.5); g.fillStyle = '#0f0c18'; g.fillRect(ex - 2, ey - 1, 5, 9); g.fillStyle = '#ffd34a'; g.fillRect(ex - 1, ey, 3, 4); g.fillRect(ex - 1, ey + 5, 3, 2); }
      } });
    }
    [reaper, ...minions].forEach(u => { if (!vis(u.x, u.y)) return; list.push({ y: u.y, f: () => {
      shadow(u.x, u.y, u.mini ? 7 : 10);
      if (!u.mini) { auraUnder(u); rankFxUnder(u); }
      const im = sprite(unitImg(u), u.x, u.y, u.dir === 'side' && u.face < 0);
      if (!u.mini && rankFxOver(u, im)) aura(u);
      else if (!u.mini) { const mx = Math.round(u.x - camX) - 1, my = Math.round(u.y - camY - im.height - 3 + Math.sin(time * 4)); g.fillStyle = '#0f0c18'; g.fillRect(mx - 2, my - 1, 5, 3); g.fillRect(mx - 1, my + 2, 3, 1); g.fillStyle = '#ffd34a'; g.fillRect(mx - 1, my, 3, 1); g.fillRect(mx, my + 1, 1, 1);
        aura(u); }
      if (u.st === 'reap') { const p = handPos(u); glow(p.x - camX, p.y - camY, u.mini ? 3 : 5, '#ffe08a', 0.35); }
    } }); });
    if (pet && vis(pet.x, pet.y)) list.push({ y: pet.y, f: () => { const hop = pet.fly ? -8 + Math.sin(pet.t * 4) * 1.5 : -Math.abs(Math.sin(pet.t * 6)) * 1.2; shadow(pet.x, pet.y, 6); if (petData.aura) glow(pet.x - camX, pet.y - camY - 5 + hop, 5, petData.aura, 0.25); const im = SP.petTiny(petData, Math.floor(pet.t * (pet.fly ? 6 : 3))); drawPetAura(g, pet.x - camX, pet.y - camY + 1 + hop, im.width, im.height, petData.g, petData.star, time, 1); g.drawImage(pet.face < 0 ? flipOf(im) : im, Math.round(pet.x - camX - im.width / 2), Math.round(pet.y - camY - im.height + 1 + hop)); } });
    for (const s of souls) { const x = s.st === 'pull' ? s.px : s.x, y = s.st === 'pull' ? s.py + s.h : s.y; if (!vis(x, y)) continue; list.push({ y: y + 0.5, f: () => {
      const img = s.sp >= 0 ? SP.special(s.sp) : SP.soult(s.tier, Math.floor(time * 6 + s.ph) % 3), fy = y - s.h + (s.st === 'float' ? Math.sin(time * 2 + s.ph) * 1.5 : 0);
      if (s.st === 'float') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(Math.round(x - camX - 2), Math.round(y - camY), 4, 1); }
      glow(x - camX, fy - camY, s.sp >= 0 ? 7 : s.tier ? 6 : 4, s.sp >= 0 ? '#e0a0ff' : SP.SOUL_PAL[s.tier].Q, (s.sp >= 0 ? 0.4 : 0.25) * s.a);
      g.globalAlpha = s.a; const sc = s.scale || 1;
      g.drawImage(img, Math.round(x - camX - img.width * sc / 2), Math.round(fy - camY - img.height * sc / 2), Math.round(img.width * sc), Math.round(img.height * sc)); g.globalAlpha = 1;
    } }); }
    for (const gh of ghosts) list.push({ y: gh.y, f: () => { const bx = Math.round(gh.x - camX), by = Math.round(gh.y - camY + Math.sin(gh.t * 3) * 2);
      glow(bx, by - 8, 9, gh.gold ? '#ffd34a' : '#b070ff', gh.gold ? 0.45 : 0.3); g.globalAlpha = 0.92;
      const im = SP.wraitht(Math.floor(gh.t * 3)); g.drawImage(gh.v < 0 ? flipOf(im) : im, bx - 6, by - 16); g.globalAlpha = 1;
      if (gh.gold) { g.fillStyle = '#ffd34a'; g.fillRect(bx - 1, by - 20, 3, 1); g.fillRect(bx, by - 21, 1, 3); } } });
    if (wraith) list.push({ y: wraith.y + 20, f: () => {
      const img = SP.wraitht(Math.floor(wraith.t * 3)), y = wraith.y + Math.sin(wraith.t * 2) * 3, wx = wraith.x - camX, wy = y - camY;
      g.globalAlpha = wraith.dead ? Math.max(0, wraith.fade / 0.6) : Math.min(1, wraith.t * 2) * (0.85 + Math.sin(wraith.t * 9) * 0.1);
      glow(wx, wy, 10, '#ff2e4a', 0.14);
      g.drawImage(img, Math.round(wx - img.width / 2 + (wraith.flash ? rnd(-1, 1) : 0)), Math.round(wy - img.height / 2));
      if (wraith.flash) { g.globalAlpha = wraith.flash * 3; g.globalCompositeOperation = 'lighter'; g.drawImage(img, Math.round(wx - img.width / 2), Math.round(wy - img.height / 2)); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1;
      if (!wraith.dead) { const bw = 16, bx = Math.round(wx - bw / 2), by = Math.round(wy - img.height / 2 - 5); g.fillStyle = '#0f0c18'; g.fillRect(bx - 1, by - 1, bw + 2, 4); g.fillStyle = '#4a1020'; g.fillRect(bx, by, bw, 2); g.fillStyle = '#ff3a5a'; g.fillRect(bx, by, Math.round(bw * wraith.hp / wraith.max), 2); }
    } });
    list.sort((a, b) => a.y - b.y).forEach(o => o.f());
    // 목적지 고리
    if (reaper.manual) { const mx = reaper.manual.x - camX, my = reaper.manual.y - camY, rr = 5 + Math.sin(time * 8); g.fillStyle = 'rgba(255,224,138,0.9)'; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; g.fillRect(Math.round(mx + Math.cos(a) * rr), Math.round(my + Math.sin(a) * rr * 0.5), 1, 1); } }
    // 밤 분위기 + 불빛
    g.fillStyle = 'rgba(10,8,40,0.12)'; g.fillRect(0, 0, W, H);
    for (const l of lanterns) if (vis(l.x, l.y)) glow(l.x - camX, l.y - camY, l.r + Math.round(Math.sin(time * 6 + l.x) * 0.8), l.col, l.a);
    if (!flies.length) for (let i = 0; i < 24; i++) flies.push({ x: rnd(0, MW), y: rnd(0, MH), ph: rnd(0, 6), sp: rnd(0.3, 0.8) });
    for (const f of flies) { f.x += Math.sin(time * f.sp + f.ph) * 0.12; f.y += Math.cos(time * f.sp * 1.3 + f.ph) * 0.08; if (!vis(f.x, f.y, 2)) continue; const k = Math.sin(time * 2.2 + f.ph * 3); if (k > 0.1) { g.fillStyle = k > 0.7 ? '#fffbb0' : '#c8e870'; g.fillRect(Math.round(f.x - camX), Math.round(f.y - camY), 1, 1); } }
    for (const p of parts) { if (!vis(p.x, p.y, 2)) continue; g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), 1, 1); }
    g.globalAlpha = 1;
    if (cfg.parade) { g.fillStyle = 'rgba(90,30,140,0.14)'; g.fillRect(0, 0, W, H); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  let last = 0;
  function loop(ts) { const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts; update(dt); render(); hooks.tick && hooks.tick(dt); requestAnimationFrame(loop); }
  // ---------- 입력: 끌어서 둘러보기 · 탭 ----------
  let drag = null;
  function officeTap(x, y) {
    const placed = hooks.decorPlaced ? hooks.decorPlaced() : [];
    if (edit) {
      const gx = Math.floor(x / G), gy = Math.floor(y / G);
      if (ghost) { const d = Decor.D(ghost), sn = snapChair(ghost, { gx: Math.round(gx - (d.fw - 1) / 2), gy: d.wall ? Math.round(gy - (d.fh - 1) / 2) : gy - d.fh + 1 }), cx = sn.gx, cy = sn.gy; hover = { gx: cx, gy: cy, ignore: hover && hover.ignore }; hooks.decorTap && hooks.decorTap(cx, cy, decoFits(ghost, cx, cy, hover.ignore)); return; }
      for (let i = placed.length - 1; i >= 0; i--) { const p = placed[i], r = decoRect(p.id, p.gx, p.gy); if (x >= r.x && x < r.x + r.w && y >= r.y - (Decor.D(p.id).wall ? 0 : 10) && y < r.y + r.h) { hooks.decorPick && hooks.decorPick(i); return; } }
      return;
    }
    // (결재는 아래 '결재' 버튼으로만: 책상을 눌러도 결재 창이 뜨지 않게 해서 의자와 겹치지 않음)
    // 앉을 자리 (책상 · 방석 · 옥좌)
    for (const st of mySeats()) { const box = st.desk ? { x: st.x - 12, y: st.y - 18, w: 24, h: 26 } : { x: st.r.x - 2, y: st.r.y - (Decor.D(st.id).chair ? 22 : 8), w: st.r.w + 4, h: st.r.h + (Decor.D(st.id).chair ? 26 : 10) }; if (x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) { if (me.sit && me.sit.x === st.x && me.sit.y === st.y) return; const from = me.sit; if (from) { me.x = from.x; me.y = from.desk ? officeData.desk.y + 14 : from.y + 4; } me.sit = null; me.walk = true; me.tx = st.x; me.ty = st.desk ? officeData.desk.y + 14 : st.y + 2; me.goSit = st.desk ? { x: st.x, y: st.y, desk: true } : st; if (st.desk) { me.tx = st.x; } Sound.play('open'); return; } }
    // 바닥 걷기
    if (y > officeData.wallH + 6 && y < H - 2) { if (me.sit) { me.x = me.sit.desk ? me.sit.x : me.sit.x; me.y = me.sit.desk ? officeData.desk.y + 14 : me.sit.y + 4; me.sit = null; } me.walk = true; me.goSit = null; me.tx = Math.max(6, Math.min(W - 6, x)); me.ty = y; burst(x, y, '#ffe08a', 4, 12); }
  }
  // 꾸미기: 놓인 소품을 눌러 끌면 옮기고, 그냥 누르면 메뉴
  let press = null, pend = null; // pend: 놓기 전 확인을 기다리는 소품 {id, gx, gy, from}
  const toOffice = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / S, y: (e.clientY - r.top) / S }; };
  // 책상 뒤(파란 칸)에 놓는 의자는 책상 가운데에 딱 맞춘다
  function snapChair(id, c) { const d = Decor.D(id); if (!d.seat || !officeData) return c; const r = decoRect(id, c.gx, c.gy), b = officeData.chairB; if (!hit(r, { x: b.x, y: b.y - 6, w: b.w, h: b.h + 10 })) return c; return { gx: (officeData.desk.x - d.fw * G / 2) / G, gy: (b.y + b.h - d.fh * G) / G }; }
  const cellAt = (id, x, y) => { const d = Decor.D(id); return snapChair(id, { gx: Math.round(x / G - d.fw / 2), gy: Math.round(y / G - d.fh / 2) }); };
  function down(e) { if (office) { const p = toOffice(e);
      if (edit) {
        if (pend) { const r = decoRect(pend.id, pend.gx, pend.gy); if (p.x >= r.x - 4 && p.x < r.x + r.w + 4 && p.y >= r.y - (Decor.D(pend.id).wall ? 4 : 14) && p.y < r.y + r.h + 4) { press = { pend: true, x0: e.clientX, y0: e.clientY, moved: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); } return; }
        const placed = hooks.decorPlaced ? hooks.decorPlaced() : []; for (let i = placed.length - 1; i >= 0; i--) { const q = placed[i], r = decoRect(q.id, q.gx, q.gy); if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y - (Decor.D(q.id).wall ? 0 : 10) && p.y < r.y + r.h) { press = { i, id: q.id, x0: e.clientX, y0: e.clientY, moved: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); return; } } return; }
      officeTap(p.x, p.y); return; } if (arena) { tap(e); return; } drag = { x: e.clientX, y: e.clientY, cx: camX, cy: camY, moved: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }
  function move(e) {
    if (office && press) { if (!press.moved && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > 6) { press.moved = true; if (!press.pend) { const q = (hooks.decorPlaced ? hooks.decorPlaced() : [])[press.i]; pend = { id: press.id, gx: q.gx, gy: q.gy, from: press.i }; press.pend = true; } hooks.pendMoved && hooks.pendMoved(); }
      if (press.moved && pend) { const p = toOffice(e), c = cellAt(pend.id, p.x, p.y); pend.gx = c.gx; pend.gy = c.gy; } return; }
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true; if (drag.moved) { camX = drag.cx - dx / S; camY = drag.cy - dy / S; follow = false; followAt = time + 6; } }
  function up(e) {
    if (office && press) { const pr = press; press = null; if (pr.pend) { if (pr.moved) hooks.pendMoved && hooks.pendMoved(true); else hooks.pendTap && hooks.pendTap(); } else if (!pr.moved) hooks.decorPick && hooks.decorPick(pr.i); return; }
    if (arena || office) return; const d = drag; drag = null; if (d && !d.moved) tap(e); }
  function tap(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / S + camX, y = (e.clientY - r.top) / S + camY;
    if (arena) { if (wraith && !wraith.dead && Math.abs(x - wraith.x) < 22 && Math.abs(y - wraith.y) < 24) { const sp = scr(x, y); hooks.wraithTap && hooks.wraithTap(sp.x, sp.y); } return; }
    if (wraith && !wraith.dead && Math.abs(x - wraith.x) < 10 && Math.abs(y - wraith.y) < 12) { const sp = scr(x, y); hooks.wraithTap && hooks.wraithTap(sp.x, sp.y); return; }
    if (cfg.parade) { // 백귀야행: 귀신 → 혼령 순으로 가까운 것을 잡고, 빈 곳을 눌러도 걷지 않는다
      let gb = null, gd = 15; for (const gh of ghosts) { const d = Math.hypot(gh.x - x, gh.y - 8 - y); if (d < gd) { gd = d; gb = gh; } }
      if (gb) { gb.dead = true; burst(gb.x, gb.y - 8, gb.gold ? '#ffd34a' : '#c890ff', 22, 45); burst(gb.x, gb.y - 8, '#ffffff', 10, 30); shake = Math.max(shake, 1.2); const sp = scr(gb.x, gb.y - 10); hooks.ghostTap && hooks.ghostTap(sp.x, sp.y, gb.gold); return; }
    }
    for (const n of NPCS) { if (n.cond === 'merchant' && !cfg.merchant) continue; if (Math.abs(x - n.x) < 7 && y > n.y - 20 && y < n.y + 3) { hooks.poi && hooks.poi(n.id === 'gob' ? 'merchant' : n.id); return; } }
    let best = null, bd = cfg.parade ? 18 : 10;
    for (const s of souls) if (s.st === 'float') { const d = Math.hypot(s.x - x, s.y - s.h - y); if (d < bd) { bd = d; best = s; } }
    if (best) { if (best.who && best.who.target === best) best.who.target = null; const tp = { face: 1, tap: true }; Object.defineProperty(tp, 'x', { get: () => reaper.x }); Object.defineProperty(tp, 'y', { get: () => reaper.y }); best.who = tp; best.st = 'pull'; best.t = 0; best.sx = best.x; best.sy = best.y - best.h; best.dur = 0.35; Sound.play('tap'); return; }
    for (let i = 0; i < PLOTS.length; i++) { const p = PLOTS[i]; if (Math.abs(x - p.x) < 9 && y > p.y - 16 && y < p.y + 2) { hooks.poi && hooks.poi('plot', i); return; } }
    for (const p of POIS) if (p.id !== 'garden' && x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) { if (p.id === 'stall' && cfg.merchant) { hooks.poi && hooks.poi('merchant'); return; } hooks.poi && hooks.poi(p.id); return; }
    { const cl = hooks.clue ? hooks.clue() : -1; if (cl >= 0) { const p = clueSpot(cl); if (Math.abs(x - p.x) < 9 && y > p.y - 14 && y < p.y + 4) { burst(p.x, p.y - 6, '#c8ecff', 24, 40); hooks.poi && hooks.poi('clue'); return; } } }
    for (let k = objs.length - 1; k >= 0; k--) { const o = objs[k]; if (o.prop && x > o.x - 2 && x < o.x + o.img.width + 2 && y > o.y && y < o.base + 4) { const lamps = objs.filter(q => q.prop === 'lamp'); hooks.poi && hooks.poi('prop', { kind: o.prop, key: o.key, x: (o.x + o.img.width / 2 - camX) * S, y: (o.y - camY) * S, wx: o.x + o.img.width / 2, wy: o.base, lampsAll: lamps.length, lampsLit: lamps.filter(q => hooks.propReady && !hooks.propReady(q.key)).length }); if (o.prop === 'tree') { shake = Math.max(shake, 1); for (let i = 0; i < 6; i++) parts.push({ x: o.x + rnd(4, o.img.width - 4), y: o.y + rnd(4, 12), vx: rnd(-6, 6), vy: rnd(-4, 4), life: 0.8, max: 0.8, col: '#6aa84a', g: 30 }); } return; } }
    if (cfg.parade) { burst(x, y, '#c9b6ff', 4, 14); return; }
    if (walkable(x, y)) { reaper.manual = { x, y }; follow = true; Sound.play('open'); hooks.moved && hooks.moved(); return; }
    burst(x, y, '#c9b6ff', 5, 18);
  }
  return {
    init(canvas, h) {
      cv = canvas; g = cv.getContext('2d'); hooks = h || {};
      resize(); camX = reaper.x - W / 2; camY = reaper.y - H / 2;
      window.addEventListener('resize', resize);
      if (window.ResizeObserver) { let lw = 0, lh = 0; new ResizeObserver(() => { const r = cv.getBoundingClientRect(); if (Math.abs(r.width - lw) > 2 || Math.abs(r.height - lh) > 2) { lw = r.width; lh = r.height; resize(); } }).observe(cv); }
      cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => (drag = null));
      requestAnimationFrame(loop);
    },
    resize,
    setRegion(i) { const n = Math.max(0, Math.min(REGIONS.length - 1, i)); if (n !== region || !groundC) { region = n; build(); } },
    setKind(k) { kind = k; }, setRank(r) { rank = r; }, setRankFx(t) { rfx = t; }, me: () => ({ x: (reaper.x - camX) * S, y: (reaper.y - camY) * S }), setPet(p) { petData = p; },
    pillar() { for (let i = 0; i < 60; i++) parts.push({ x: reaper.x + rnd(-5, 5), y: reaper.y - rnd(0, 30), vx: rnd(-4, 4), vy: -rnd(20, 50), life: rnd(0.8, 1.6), max: 1.6, col: Math.random() < 0.6 ? '#ffd34a' : '#ffffff', g: 0 }); follow = true; },
    config(c) { Object.assign(cfg, c); },
    enterArena() { arena = true; saved = { x: reaper.x, y: reaper.y }; arenaC = bakeArena(); reaper.x = W / 2; reaper.y = Math.round(H * 0.86); reaper.manual = null; reaper.target = null; if (pet) { pet.x = reaper.x - 16; pet.y = reaper.y; } parts = []; fade = 1; camX = 0; camY = 0; },
    exitArena() { if (!arena) return; arena = false; if (saved) { reaper.x = saved.x; reaper.y = saved.y; } reaper.st = 'idle'; reaper.dir = 'down'; wraith = null; follow = true; camX = reaper.x - W / 2; camY = reaper.y - H / 2; },
    inArena: () => arena || office,
    enterOffice(t, v) { office = true; visit = v || null; officeTier = Math.max(0, Math.min(8, t)); officeData = bakeOffice(officeTier, W, H); fade = 1; parts = [];
      staff = officeData.seats.map((p, k) => ({ x: p.x, y: p.y, sx: p.x, sy: p.y, ft: rnd(0, 3), t: rnd(2, 8), walk: false, dir: 'up', judge: officeTier >= 5 && k < 2 }));
      { const ch = visit ? null : seatSpots().find(q => q.atDesk || q.desk); me = { x: officeData.desk.x, y: visit ? H - 26 : officeData.desk.y + 16, ft: 0, walk: false, dir: 'up', face: 1, sit: ch }; } edit = false; ghost = null; },
    exitOffice() { office = false; follow = true; edit = false; ghost = null; visit = null; },
    inVisit: () => !!visit,
    officeDragAt(cx, cy, id) { const r = cv.getBoundingClientRect(); if (!office || !edit || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom || document.elementFromPoint(cx, cy) !== cv) { hover = null; return null; } const x = (cx - r.left) / S, y = (cy - r.top) / S, c = cellAt(id, x, y); ghost = id; hover = { gx: c.gx, gy: c.gy }; return { gx: c.gx, gy: c.gy, ok: decoFits(id, c.gx, c.gy) }; },
    officeDragEnd() { ghost = null; hover = null; },
    officePend(id, gx, gy, from) { pend = { id, gx, gy, from: from == null ? null : from }; ghost = null; hover = null; },
    officePendClear() { pend = null; },
    officePendInfo() { if (!pend) return null; const r = decoRect(pend.id, pend.gx, pend.gy), c = cv.getBoundingClientRect(); return { id: pend.id, gx: pend.gx, gy: pend.gy, from: pend.from, ok: decoFits(pend.id, pend.gx, pend.gy, pend.from), x: c.left + (r.x + r.w / 2) * S, top: c.top + (r.y - (r.wall ? 0 : Decor.img(pend.id).height - r.h)) * S, bottom: c.top + (r.y + r.h) * S }; },
    // 눌러서 고른 소품: 화면 가운데 근처의 빈자리 찾기
    officeFreeSpot(id) { const d = Decor.D(id), cx = W / 2 / G, cy = d.wall ? officeData.wallH / 2 / G : (officeData.wallH + (H - officeData.wallH) * 0.55) / G; let best = null, bd = 1e9; for (let gy = 0; gy < H / G; gy++) for (let gx = 0; gx < W / G; gx++) { if (!decoFits(id, gx, gy)) continue; const dd = Math.hypot(gx + d.fw / 2 - cx, gy + d.fh / 2 - cy); if (dd < bd) { bd = dd; best = { gx, gy }; } } return best || { gx: Math.floor(cx - d.fw / 2), gy: Math.floor(cy) }; },
    officeEdit(on) { edit = !!on; ghost = null; hover = null; pend = null; },
    officeGhost(id, ignore) { ghost = id; hover = ignore != null ? { gx: -99, gy: -99, ignore } : null; },
    officeFits: (id, gx, gy, ignore) => decoFits(id, gx, gy, ignore),
    officeMe: () => (me ? { x: (me.sit ? me.sit.x : me.x) * S, y: (me.sit ? me.sit.y : me.y) * S, sit: !!me.sit } : null),
    officeInfo: () => (officeData ? { wallH: officeData.wallH, W, H, S, desk: officeData.desk } : null),
    inOffice: () => office,
    officeName: t => OFFICE[Math.max(0, Math.min(8, t))].name,
    officeThumb(t, w, h) { const tt = Math.max(0, Math.min(8, t)), o = bakeOffice(tt, w, h), x2 = o.c.getContext('2d');
      o.seats.forEach((p, k) => { const im = tt >= 5 && k < 2 ? SP.tinyReaper('m', 5, 'down', 'idle', 0) : SP.minit('up', 'idle', k); x2.drawImage(im, Math.round(p.x - im.width / 2), Math.round(p.y - im.height + 1)); });
      const im = SP.tinyReaper(kind, tt, 'down', 'idle', 0); x2.drawImage(im, Math.round(o.desk.x - im.width / 2), Math.round(o.desk.y - 6 - im.height + 1)); return o.c; },
    spawnWraith(hp, life) { if (arena) { wraith = { x: W / 2, y: Math.round(H * 0.4), hp, max: hp, t: 0, life, flash: 0, boss: 1 }; Sound.play('wraith'); return; } wraith = { x: Math.max(20, Math.min(MW - 20, reaper.x + rnd(-30, 30))), y: Math.max(30, reaper.y - rnd(10, 30)), hp, max: hp, t: 0, life, flash: 0 }; follow = true; Sound.play('wraith'); },
    hitWraith(dmg) { if (!wraith || wraith.dead) return false; if (arena) { for (let k = 0; k < 6; k++) { const t = k / 6; parts.push({ x: reaper.x + rnd(-2, 2), y: reaper.y - 14, vx: (wraith.x - reaper.x) * 2.4 + rnd(-8, 8), vy: (wraith.y - reaper.y + 14) * 2.4 + rnd(-8, 8), life: 0.4 - t * 0.05, max: 0.4, col: k % 2 ? '#6fb0ff' : '#c4ecff', g: 0, big: 1 }); } } wraith.hp = Math.max(0, wraith.hp - dmg); wraith.flash = 0.15; shake = Math.max(shake, 1.5); burst(wraith.x + rnd(-5, 5), wraith.y + rnd(-6, 6), '#ffffff', 4, 25); if (wraith.hp <= 0) { wraith.dead = true; wraith.fade = 0.8; burst(wraith.x, wraith.y, '#ff6a8a', 30, 50); burst(wraith.x, wraith.y, '#ffffff', 20, 40); return true; } return false; },
    wraithAlive: () => !!(wraith && !wraith.dead), wraithHp: () => wraith ? wraith.hp : 0, wraithPos: () => wraith ? scr(wraith.x, wraith.y) : null,
    labels: () => arena || office ? [] : POIS.filter(p => ['office', 'stall', 'stele', 'garden'].includes(p.id)).map(p => ({ id: p.id, x: (p.x + p.w / 2 - camX) * S, y: (p.y - 3 - camY) * S, vis: vis(p.x + p.w / 2, p.y, 4) }))
      .concat(NPCS.map(n => ({ id: 'n_' + n.id, x: (n.x - camX) * S, y: (n.y - (n.id === 'kkachi' ? 14 : 24) - camY) * S, vis: vis(n.x, n.y, 4) && !(n.cond === 'merchant' && !cfg.merchant) }))),
    ghostsOnScreen() { return ghosts.filter(gh => !gh.dead).map(gh => ({ x: (gh.x - camX) * S, y: (gh.y - 8 - camY) * S, gold: gh.gold })); },
    clueScreen(ch) { const p = clueSpot(ch); return { x: (p.x - camX) * S, y: (p.y - 6 - camY) * S }; },
    propsOnScreen() { return objs.filter(o => o.prop && vis(o.x + o.img.width / 2, o.base, 0)).map(o => ({ kind: o.prop, key: o.key, x: (o.x + o.img.width / 2 - camX) * S, y: (o.base - 6 - camY) * S })); },
    // 저승사자와 가장 가까운 살펴볼 수 있는(반짝이는) 소품으로 화면 이동 → 화면 좌표
    focusProp() { const r = objs.filter(o => o.prop && hooks.propReady && hooks.propReady(o.key)).sort((a, b) => Math.hypot(a.x - reaper.x, a.base - reaper.y) - Math.hypot(b.x - reaper.x, b.base - reaper.y))[0]; if (!r) return null; const cx = r.x + r.img.width / 2; camX = cx - W / 2; camY = r.base - H / 2; follow = false; followAt = time + 8; return { x: (cx - camX) * S, y: (r.y - camY) * S }; },
    focusClue(ch) { const p = clueSpot(ch); camX = p.x - W / 2; camY = p.y - H / 2; follow = false; followAt = time + 8; },
    focus(id) { const p = POIS.find(q => q.id === id) || POIS.find(q => q.id === 'stall'); if (p) { camX = p.x + p.w / 2 - W / 2; camY = p.y + p.h / 2 - H / 2; follow = false; followAt = time + 8; } },
    burstAt(xc, yc, col, n) { burst(xc / S + camX, yc / S + camY, col, n, 40); },
    soulNear() { for (const [fx, fy] of [[0.4, 0.62], [0.3, 0.7], [0.5, 0.75], [0.35, 0.5], [0.2, 0.6]]) { const x = camX + W * fx, y = camY + H * fy; if (walkable(x, y)) { souls.push({ x, y, tier: 0, sp: -1, ph: 0, t: 0, st: 'float', who: null, a: 1, h: 9, tut: 1 }); follow = false; followAt = time + 30; return; } } },
    groundSpot() {
      for (const [dx, dy] of [[34, 10], [-34, 10], [30, -20], [-30, -20], [0, 30], [40, 30], [-40, 30]]) {
        const x = reaper.x + dx, y = reaper.y + dy, sx = x - camX, sy = y - camY;
        if (sx < 16 || sx > W - 60 || sy < 50 || sy > H - 12 || !walkable(x, y)) continue;
        if (NPCS.some(n => Math.abs(n.x - x) < 16 && Math.abs(n.y - y) < 26) || objs.some(o => x > o.x - 4 && x < o.x + o.img.width + 4 && y > o.y && y < o.base + 6)) continue;
        return { x: sx * S, y: sy * S };
      }
      return null;
    },
    nearestSoul() { let best = null, bd = 1e9; for (const s of souls) if (s.st === 'float' && s.a > 0.6) { const sx = s.x - camX, sy = s.y - s.h - camY; if (!s.tut && souls.some(q => q.tut && q.st === 'float')) continue; if (sx < 6 || sy < 30 || sx > W - 6 || sy > H - 6) continue; const d = Math.hypot(sx - W / 2, sy - H / 2); if (d < bd) { bd = d; best = { x: sx * S, y: sy * S }; } } return best; },
    get scale() { return S; },
  };
})();
