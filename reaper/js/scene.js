// ===== 전투(수확) 화면: 저해상도 캔버스에 도트로 그리고 정수배로 키운다 =====
const REGIONS = [
  { id: 'village', name: '이승 마을', sky: ['#07061a', '#110f33', '#1e1a4d', '#2e2563', '#463575'], halo: '#8a7ac0',
    mt: ['#191637', '#221d47'], rim: '#4a3f7e', ground: ['#1a2027', '#202a2c', '#263330'], tuft: '#3b4d40', path: ['#3a3631', '#4a443a'], fog: '#8f88c8' },
  { id: 'pass', name: '서낭당 고갯길', sky: ['#04100f', '#0a1f22', '#123236', '#1d4a49', '#2f625a'], halo: '#7ab0a0',
    mt: ['#0b1d1d', '#123029'], rim: '#3f7564', ground: ['#14211b', '#1a2b21', '#213527'], tuft: '#3d5b3a', path: ['#3b3a2c', '#4b4936'], fog: '#9fd0c0' },
  { id: 'river', name: '삼도천', sky: ['#05050f', '#0e0d24', '#1c1940', '#33295c', '#55407a'], halo: '#b098d8',
    mt: ['#120f27', '#1b1638'], rim: '#55467e', ground: ['#16141f', '#1c1a28', '#232031'], tuft: '#3a3550', path: ['#3a3446', '#4a4258'], fog: '#c0b0e8', river: ['#1a2a5a', '#24407a', '#5a7ac0'] },
  { id: 'gate', name: '저승문', sky: ['#0a0206', '#1e050e', '#360a17', '#561322', '#7a2230'], halo: '#e07060',
    mt: ['#1c050c', '#2a0a12'], rim: '#7a2a2a', ground: ['#1a1114', '#22151a', '#2a1a1f'], tuft: '#4a2a2a', path: ['#3e2e2e', '#4e3a38'], fog: '#e09090' },
  { id: 'palace', name: '명부전', sky: ['#06030c', '#140a24', '#26143a', '#3e2248', '#5e3a4a'], halo: '#e8c070',
    mt: ['#140a1e', '#1e1029'], rim: '#6a4a5a', ground: ['#1c1622', '#241c2a', '#2c2232'], tuft: '#4a3a4a', path: ['#4a3c42', '#5c4a4e'], fog: '#e8c8a0' },
];

const Scene = (() => {
  let cv, g, W = 130, H = 150, S = 3, GY = 90, bg = null, region = 0, kind = 'm';
  let hooks = {}, cfg = { spawn: 2, maxSouls: 6, walk: 20, reap: 0.8, minions: 0, mWalk: 12, mReap: 1.4, roll: () => 0, speed: 1 };
  const reaper = { x: 60, y: 120, st: 'idle', t: 0, f: 0, face: 1, target: null };
  let minions = [], souls = [], parts = [], flies = [], wraith = null, spawnT = 0, time = 0, stars = [], lanterns = [], shake = 0;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(r => r.map(v => (v + 0.5) / 16));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const R = () => REGIONS[region];

  // ---------- 배경 굽기 ----------
  function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function bake() {
    const P = R(), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x2 = c.getContext('2d'), im = x2.createImageData(W, H), d = im.data;
    const set = (x, y, col) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
    const sky = P.sky.map(hex), n = sky.length;
    // 하늘: 디더링된 띠
    for (let y = 0; y < GY; y++) {
      const f = (y / GY) * (n - 1);
      for (let x = 0; x < W; x++) set(x, y, sky[Math.max(0, Math.min(n - 1, Math.floor(f + BAYER[y & 3][x & 3] - 0.25)))]);
    }
    // 달 + 달무리
    const mx = Math.round(W * 0.76), my = Math.round(GY * 0.26), mr = 9 + (W > 160 ? 2 : 0), halo = hex(P.halo);
    const moonC = [hex('#fff4d6'), hex('#f0dcae'), hex('#d4bd8a')];
    for (let y = my - mr - 9; y <= my + mr + 9; y++) for (let x = mx - mr - 9; x <= mx + mr + 9; x++) {
      const dd = Math.hypot(x - mx, y - my);
      if (dd <= mr) {
        const shade = Math.hypot(x - mx + 3, y - my + 3) / mr;
        set(x, y, moonC[shade > 1.15 ? 2 : shade > 0.85 ? 1 : 0]);
      } else if (dd <= mr + 8) {
        const k = 1 - (dd - mr) / 8;
        if (BAYER[y & 3][x & 3] < k * 0.55) {
          const i = (y * W + x) * 4; d[i] = (d[i] + halo[0]) >> 1; d[i + 1] = (d[i + 1] + halo[1]) >> 1; d[i + 2] = (d[i + 2] + halo[2]) >> 1;
        }
      }
    }
    // 달 얼룩
    const craters = [[-3, -2, 2], [2, 2, 1.5], [3, -4, 1], [-1, 4, 1]];
    craters.forEach(([cx, cy, r]) => { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) <= r) set(mx + cx + x, my + cy + y, moonC[1]); });
    // 별 (고정)
    const r1 = seeded(7 + region);
    stars = [];
    for (let i = 0; i < W * GY / 90; i++) {
      const x = Math.floor(r1() * W), y = Math.floor(r1() * GY * 0.8);
      if (Math.hypot(x - mx, y - my) < mr + 10) continue;
      const big = r1() < 0.12; stars.push({ x, y, big, ph: r1() * 6 });
      set(x, y, hex(big ? '#fff6d0' : '#9a92c8'));
    }
    // 산 두 겹
    const ridge = (seed, base, amp, col, rim) => {
      const C = hex(col), RC = hex(rim);
      let prev = 0;
      for (let x = 0; x < W; x++) {
        const t = x + seed * 50;
        const nn = Math.sin(t * 0.045 + seed) * 0.5 + Math.sin(t * 0.11 + seed * 2) * 0.3 + Math.abs(Math.sin(t * 0.23 + seed * 3)) * 0.35;
        const top = Math.round(base - amp * nn);
        for (let y = top; y < GY; y++) set(x, y, C);
        if (x > 0 && top <= prev) set(x, top, RC);
        prev = top;
      }
    };
    ridge(region * 3 + 1, GY * 0.62, GY * 0.22, P.mt[0], P.rim);
    ridge(region * 3 + 2, GY * 0.86, GY * 0.16, P.mt[1], P.rim);
    // 땅: 위는 어둡고 아래로 갈수록 밝게 (디더)
    const gr = P.ground.map(hex);
    for (let y = GY; y < H; y++) {
      const f = ((y - GY) / (H - GY)) * (gr.length - 1);
      for (let x = 0; x < W; x++) set(x, y, gr[Math.max(0, Math.min(gr.length - 1, Math.floor(f + BAYER[y & 3][x & 3] - 0.25)))]);
    }
    // 지평선 밝은 선
    for (let x = 0; x < W; x++) if ((x + region) % 3) set(x, GY, hex(P.rim));
    // 길 (흙길 + 조약돌)
    const pa = P.path.map(hex), py0 = Math.round(GY + (H - GY) * 0.56), py1 = Math.round(GY + (H - GY) * 0.74);
    for (let y = py0 - 3; y <= py1 + 3; y++) for (let x = 0; x < W; x++) {
      const wob = Math.round(Math.sin(x * 0.07 + region) * 2);
      const yy = y - wob, edge = yy < py0 ? (py0 - yy) / 4 : yy > py1 ? (yy - py1) / 4 : 0;
      if (edge >= 1 || (edge && BAYER[y & 3][x & 3] < edge)) continue;
      set(x, y, pa[BAYER[y & 3][x & 3] > 0.85 ? 1 : 0]);
    }
    const rp = seeded(91 + region);
    for (let i = 0; i < W / 6; i++) { const x = Math.floor(rp() * W), y = Math.floor(py0 + rp() * (py1 - py0)) + Math.round(Math.sin(x * 0.07 + region) * 2); set(x, y, pa[1]); if (rp() < 0.4) set(x + 1, y, pa[1]); set(x, y + 1, hex(P.ground[0])); }
    // 강 (삼도천)
    if (P.river) {
      const rv = P.river.map(hex), ry0 = GY + 2, ry1 = Math.round(GY + (H - GY) * 0.34);
      for (let y = ry0; y <= ry1; y++) for (let x = 0; x < W; x++) set(x, y, rv[(y - ry0) < 2 ? 0 : (Math.sin(x * 0.3 + y * 1.7) > 0.85 ? 2 : (BAYER[y & 3][x & 3] > 0.6 ? 1 : 0))]);
      for (let x = 0; x < W; x++) set(x, ry1 + 1, hex(P.rim));
    }
    // 풀포기
    const r2 = seeded(31 + region), tuft = hex(P.tuft);
    for (let i = 0; i < W / 4; i++) {
      const x = Math.floor(r2() * W), y = Math.floor(GY + 3 + r2() * (H - GY - 4));
      if (y >= py0 - 2 && y <= py1 + 2) continue;
      if (P.river && y < GY + (H - GY) * 0.36) continue;
      set(x, y, tuft); set(x - 1, y - 1, tuft); set(x + 1, y - 1, tuft); if (r2() < 0.5) set(x, y - 2, tuft);
    }
    im.data.set(d); x2.putImageData(im, 0, 0);
    props(x2, P);
    return c;
  }

  // 지역별 배경 소품 (캔버스 도형으로 도트 그리기)
  function props(x2, P) {
    const rect = (x, y, w, h, col) => { x2.fillStyle = col; x2.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    lanterns = [];
    const lamp = (x, y, gold) => { rect(x + 3, y + 10, 1, GY + 14 - y - 10 > 0 ? 0 : 0, '#000'); x2.drawImage(SP.lantern(gold ? 2 : 1), x, y); lanterns.push({ x: x + 3, y: y + 5, gold }); };
    const pole = (x, top, bottom, col) => rect(x, top, 1, bottom - top, col);
    if (P.id === 'village') {
      // 먼 초가집 실루엣
      [[0.08, 0], [0.3, 1], [0.55, 0]].forEach(([fx, k]) => thatched(x2, Math.round(W * fx), GY + 1, 18 + k * 4, true));
      // 돌담
      for (let x = 0; x < W; x += 4) { rect(x, GY + 6, 4, 3, '#2a2a33'); rect(x + 1, GY + 6, 2, 1, '#3e3d4a'); rect(x + 3, GY + 6, 1, 3, '#17161e'); }
      thatched(x2, W - 34, GY + 14, 34, false);
      pole(9, GY - 8, GY + 18, '#3a2414'); rect(5, GY - 9, 9, 1, '#3a2414'); lamp(7, GY - 8);
      x2.drawImage(SP.jangseung(), 16, GY - 6);
    } else if (P.id === 'pass') {
      tree(x2, 14, GY + 10);
      // 돌무더기
      const cx = W - 22, cy = GY + 12;
      [[0, 0, 9], [-6, 0, 7], [6, 1, 7], [-3, -5, 7], [3, -5, 6], [0, -10, 5], [0, -14, 3]].forEach(([dx, dy, w]) => {
        rect(cx + dx - w / 2, cy + dy - 4, w, 4, '#4a4a52'); rect(cx + dx - w / 2, cy + dy - 4, w, 1, '#6a6a76'); rect(cx + dx - w / 2, cy + dy - 1, w, 1, '#2a2a30');
      });
      x2.drawImage(SP.jangseung(), W - 46, GY - 4);
      x2.drawImage(SP.jangseung(), W - 56, GY - 2);
      pole(32, GY - 6, GY + 12, '#3a2414'); lamp(30, GY - 6);
    } else if (P.id === 'river') {
      // 갈대
      for (let x = 2; x < W; x += 3) if ((x * 7) % 11 < 4) { const h = 6 + (x * 13) % 7; rect(x, GY + (H - GY) * 0.36 - h, 1, h, '#4a4060'); rect(x - 1, GY + (H - GY) * 0.36 - h, 1, 2, '#6a5a80'); }
      x2.drawImage(SP.boat(), Math.round(W * 0.18), GY + 2);
      // 저편의 등불
      for (let i = 0; i < 4; i++) { const x = Math.round(W * (0.55 + i * 0.1)); rect(x, GY - 3, 1, 3, '#2a2040'); lanterns.push({ x, y: GY - 4, gold: true, small: true }); }
      pole(W - 12, GY + 4, GY + 26, '#3a2414'); lamp(W - 15, GY + 4);
    } else if (P.id === 'gate') {
      hongsal(x2, Math.round(W / 2), GY + 2);
      stoneLamp(x2, 10, GY + 14); stoneLamp(x2, W - 18, GY + 14);
      lanterns.push({ x: 14, y: GY + 4, gold: false }, { x: W - 14, y: GY + 4, gold: false });
    } else if (P.id === 'palace') {
      palace(x2, Math.round(W / 2), GY + 4);
      pole(8, GY - 2, GY + 22, '#5a3a22'); lamp(6, GY - 2, true);
      pole(W - 9, GY - 2, GY + 22, '#5a3a22'); lamp(W - 11, GY - 2, true);
    }
  }
  function thatched(x2, x, y, w, far) {
    const rect = (a, b, c, d, col) => { x2.fillStyle = col; x2.fillRect(Math.round(a), Math.round(b), Math.round(c), Math.round(d)); };
    const h = Math.round(w * (far ? 0.42 : 0.66)), rh = Math.round(w * (far ? 0.32 : 0.3));
    if (far) {
      rect(x + 2, y - h + rh - 1, w - 4, h - rh + 1, '#1b1832');
      for (let i = 0; i < rh; i++) { const ww = w * Math.sqrt(1 - Math.pow(1 - i / rh, 2)); rect(x + (w - ww) / 2, y - h + i, ww, 1, '#221e3e'); }
      rect(x + w / 2 - 1, y - h + rh + 1, 2, 2, '#c08a3a');
      return;
    }
    // 벽
    rect(x + 2, y - h + rh - 1, w - 4, h - rh + 1, '#c9b894');
    rect(x + 2, y - h + rh - 1, w - 4, 1, '#8a7a5a');
    rect(x + 2, y - 1, w - 4, 1, '#6e604a');
    for (let i = 4; i < w - 4; i += 7) rect(x + i, y - h + rh, 1, h - rh, '#5a3a22');
    // 문살 창 (불 켜짐)
    const wx = x + Math.round(w * 0.22), wy = y - h + rh + 2;
    rect(wx, wy, 8, 6, '#ffcf6a'); rect(wx, wy, 8, 1, '#ffe8a8');
    rect(wx + 4, wy, 1, 6, '#b07a2a'); rect(wx, wy + 3, 8, 1, '#b07a2a'); rect(wx - 1, wy - 1, 10, 1, '#5a3a22'); rect(wx - 1, wy + 6, 10, 1, '#5a3a22');
    // 문
    rect(x + w - 12, y - 9, 6, 8, '#5a3a22'); rect(x + w - 11, y - 8, 4, 7, '#7a5232');
    // 초가 지붕
    for (let i = 0; i < rh; i++) {
      const ww = (w + 4) * Math.sqrt(1 - Math.pow(1 - i / rh, 2));
      rect(x - 2 + (w + 4 - ww) / 2, y - h + i, ww, 1, i % 3 === 0 ? '#a07a3a' : i < 2 ? '#e0bf78' : '#c9a256');
    }
    rect(x - 2, y - h + rh - 1, w + 4, 1, '#6e5226');
    for (let i = 0; i < w; i += 5) rect(x + i, y - h + rh, 1, 1, '#6e5226');
    // 지붕 새끼줄
    for (let i = 1; i < 4; i++) rect(x + (w * i) / 4, y - h + 1, 1, rh - 2, '#8a6630');
  }
  function tree(x2, x, y) {
    const rect = (a, b, c, d, col) => { x2.fillStyle = col; x2.fillRect(Math.round(a), Math.round(b), Math.round(c), Math.round(d)); };
    rect(x - 2, y - 26, 5, 26, '#3a2a20'); rect(x - 2, y - 26, 1, 26, '#5a4030');
    rect(x - 6, y - 22, 4, 2, '#3a2a20'); rect(x + 3, y - 18, 5, 2, '#3a2a20');
    const blobs = [[0, -34, 11], [-8, -28, 8], [8, -27, 8], [-4, -40, 7], [6, -38, 7]];
    blobs.forEach(([dx, dy, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) rect(x + dx + xx, y + dy + yy, 1, 1, (xx + yy < -r * 0.6) ? '#2f5a3a' : '#1e3d29'); });
    // 오색천
    const cols = ['#e04050', '#f0c040', '#40a0e0', '#f0f0f0', '#50c060'];
    for (let i = 0; i < 9; i++) rect(x - 9 + i * 2, y - 24 + (i % 3), 1, 4 + (i % 3), cols[i % 5]);
    rect(x - 10, y - 25, 19, 1, '#d8c8a0');
  }
  function hongsal(x2, cx, y) {
    const rect = (a, b, c, d, col) => { x2.fillStyle = col; x2.fillRect(Math.round(a), Math.round(b), Math.round(c), Math.round(d)); };
    const w = 50, top = y - 46;
    rect(cx - w / 2, top, 3, 46, '#b02a2a'); rect(cx + w / 2 - 3, top, 3, 46, '#b02a2a');
    rect(cx - w / 2, top, 1, 46, '#e05050'); rect(cx + w / 2 - 3, top, 1, 46, '#e05050');
    rect(cx - w / 2 - 3, top + 6, w + 6, 3, '#b02a2a'); rect(cx - w / 2 - 3, top + 6, w + 6, 1, '#e05050');
    rect(cx - w / 2 - 1, top + 13, w + 2, 2, '#8a1a1a');
    for (let i = -w / 2 + 4; i < w / 2 - 3; i += 3) { rect(cx + i, top - 4, 1, 10, '#b02a2a'); rect(cx + i, top - 5, 1, 1, '#f0c040'); }
    // 태극
    rect(cx - 3, top + 1, 6, 6, '#1a1a40'); rect(cx - 3, top + 1, 6, 3, '#c03030'); rect(cx - 2, top + 2, 2, 1, '#3040a0'); rect(cx + 1, top + 5, 2, 1, '#e05050');
  }
  function stoneLamp(x2, x, y) {
    const rect = (a, b, c, d, col) => { x2.fillStyle = col; x2.fillRect(a, b, c, d); };
    rect(x, y - 2, 8, 2, '#4a4048'); rect(x + 2, y - 10, 4, 8, '#5a5058'); rect(x - 1, y - 12, 10, 2, '#6a6070');
    rect(x + 1, y - 17, 6, 5, '#5a5058'); rect(x + 2, y - 16, 4, 3, '#ffb040'); rect(x - 1, y - 19, 10, 2, '#6a6070'); rect(x + 3, y - 21, 2, 2, '#6a6070');
  }
  function palace(x2, cx, y) {
    const rect = (a, b, c, d, col) => { x2.fillStyle = col; x2.fillRect(Math.round(a), Math.round(b), Math.round(c), Math.round(d)); };
    const w = 70;
    // 계단 + 기단
    for (let i = 0; i < 4; i++) rect(cx - 14 + i * 2, y - 2 - i * 2, 28 - i * 4, 2, i % 2 ? '#5a4a52' : '#6a5a62');
    rect(cx - w / 2, y - 10, w, 2, '#4a3c44');
    // 기둥
    for (let i = 0; i < 6; i++) { const px = cx - w / 2 + 5 + i * ((w - 10) / 5); rect(px - 1, y - 30, 3, 20, '#9a2a2a'); rect(px - 1, y - 30, 1, 20, '#c84040'); }
    // 문 (빛)
    rect(cx - 8, y - 26, 16, 16, '#3a1a1a'); rect(cx - 7, y - 25, 14, 15, '#ffcf6a'); rect(cx, y - 25, 1, 15, '#b07a2a');
    // 단청 띠
    rect(cx - w / 2, y - 34, w, 4, '#2a6a5a'); for (let i = 0; i < w; i += 4) rect(cx - w / 2 + i, y - 33, 2, 2, '#e0a040');
    // 기와 지붕 (처마 곡선)
    for (let i = 0; i < 12; i++) {
      const ww = w + 16 - i * 4 + (i < 3 ? (3 - i) * 2 : 0);
      rect(cx - ww / 2, y - 35 - i, ww, 1, i === 0 ? '#14101c' : i % 2 ? '#2a2236' : '#342a44');
    }
    rect(cx - w / 2 - 12, y - 38, 4, 2, '#342a44'); rect(cx + w / 2 + 8, y - 38, 4, 2, '#342a44');
    rect(cx - 22, y - 47, 44, 1, '#4a3e5e');
    // 현판
    rect(cx - 7, y - 44, 14, 6, '#1a1020'); rect(cx - 6, y - 43, 12, 4, '#e0b040');
  }

  // ---------- 개체 ----------
  function resize() {
    const r = cv.getBoundingClientRect();
    S = r.width >= 700 ? 5 : r.width >= 520 ? 4 : r.width >= 300 ? 3 : 2;
    W = Math.ceil(r.width / S); H = Math.ceil(r.height / S); GY = Math.round(H * 0.56);
    cv.width = W; cv.height = H;
    g.imageSmoothingEnabled = false;
    bg = bake(); flies = [];
    reaper.x = Math.min(Math.max(reaper.x, 12), W - 12); reaper.y = clampFeet(reaper.y);
  }
  const clampFeet = y => Math.max(GY + 26, Math.min(H - 3, y));
  function spawnSoul() {
    const tier = cfg.roll();
    souls.push({ x: rnd(10, W - 10), y: 0, by: rnd(GY - 16, GY + (H - GY) * 0.38), tier, ph: rnd(0, 6), t: 0, st: 'float', who: null, a: 0 });
  }
  function pickSoul(who) {
    let best = null, bd = 1e9;
    for (const s of souls) if (s.st === 'float' && !s.who && s.a > 0.6) { const d = Math.abs(s.x - who.x) + Math.abs(s.by - who.y) * 0.5; if (d < bd) { bd = d; best = s; } }
    return best;
  }
  function think(u, dt, walk, reap, isMain) {
    u.t += dt; u.ft = (u.ft || 0) + dt;
    if (u.st === 'idle') {
      const s = pickSoul(u);
      if (s) { s.who = u; u.target = s; u.st = 'walk'; u.t = 0; }
      else if (!isMain && u.t > 2) { u.wx = rnd(10, W - 10); u.wy = clampFeet(rnd(GY + 26, H - 3)); u.st = 'wander'; }
    } else if (u.st === 'wander') {
      const dx = u.wx - u.x, dy = u.wy - u.y, d = Math.hypot(dx, dy);
      if (d < 1 || pickSoul(u)) { u.st = 'idle'; u.t = 0; }
      else { const v = walk * 0.5 * dt; u.x += dx / d * v; u.y += dy / d * v; u.face = dx < 0 ? -1 : 1; }
    } else if (u.st === 'walk') {
      const s = u.target;
      if (!s || s.st !== 'float') { u.st = 'idle'; u.t = 0; return; }
      const side = s.x > u.x ? -1 : 1, tx = s.x + side * (isMain ? 9 : 6), ty = clampFeet(s.by + (isMain ? 30 : 22));
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy), v = walk * dt;
      if (d <= v) { u.x = tx; u.y = ty; u.st = 'reap'; u.t = 0; u.face = s.x > u.x ? 1 : -1; s.st = 'pull'; s.t = 0; s.who = u; s.sx = s.x; s.sy = s.y; s.dur = reap; Sound.play('reap'); }
      else { u.x += dx / d * v; u.y += dy / d * v; u.face = dx < 0 ? -1 : 1; }
    } else if (u.st === 'reap') {
      if (u.t >= reap + 0.15) { u.st = 'idle'; u.t = 0; u.target = null; }
    }
  }
  // 명부(두루마리) 위치 = 혼이 빨려드는 곳
  function scrollPos(u) {
    if (u.mini) return { x: u.x + u.face * 4, y: u.y - 12 };
    return { x: u.x + u.face * 13, y: u.y - 34 };
  }
  function burst(x, y, col, n, spd) {
    for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(spd * 0.4, spd); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: rnd(0.4, 0.8), max: 0.8, col, g: 30 }); }
  }
  function update(dt) {
    time += dt;
    const sd = dt * cfg.speed;
    spawnT += sd;
    if (spawnT >= cfg.spawn) { spawnT = 0; if (souls.filter(s => s.st === 'float').length < cfg.maxSouls) spawnSoul(); }
    think(reaper, sd, cfg.walk, cfg.reap, true);
    // 졸개 수 맞추기 (화면에는 최대 4명)
    const vis = Math.min(4, cfg.minions);
    while (minions.length < vis) minions.push({ x: rnd(10, W - 10), y: clampFeet(rnd(GY + 26, H - 3)), st: 'idle', t: 0, face: 1, mini: true });
    while (minions.length > vis) minions.pop();
    minions.forEach(m => think(m, sd, cfg.mWalk, cfg.mReap, false));
    for (const s of souls) {
      s.t += sd; s.a = Math.min(1, s.a + dt * 2);
      if (s.st === 'float') s.y = s.by + Math.sin(time * 2 + s.ph) * 2;
      else if (s.st === 'pull') {
        const p = scrollPos(s.who), k = Math.min(1, s.t / s.dur), e = k * k;
        const sw = Math.sin(k * Math.PI) * 6 * (1 - k);
        s.x = s.sx + (p.x - s.sx) * e + Math.cos(k * 9) * sw; s.y = s.sy + (p.y - s.sy) * e + Math.sin(k * 9) * sw;
        s.scale = 1 - k * 0.6;
        if (Math.random() < 0.6) parts.push({ x: s.x + rnd(-2, 2), y: s.y + rnd(-2, 2), vx: 0, vy: -4, life: 0.35, max: 0.35, col: SP.SOUL_PAL[s.tier].Q, g: 0 });
        if (k >= 1) {
          s.st = 'done';
          burst(p.x, p.y, SP.SOUL_PAL[s.tier].z, 8 + s.tier * 4, 30);
          hooks.collect && hooks.collect(s, s.who === reaper ? 'main' : s.who.tap ? 'tap' : 'minion', p.x * S, p.y * S);
        }
      }
    }
    souls = souls.filter(s => s.st !== 'done');
    parts.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; });
    parts = parts.filter(p => p.life > 0);
    if (wraith) {
      wraith.t += dt; wraith.flash = Math.max(0, wraith.flash - dt);
      wraith.x += Math.sin(wraith.t * 0.7) * dt * 6;
      if (wraith.dead) { wraith.fade -= dt; if (wraith.fade <= 0) wraith = null; }
      else if (wraith.t > wraith.life) { wraith.dead = true; wraith.fade = 0.6; hooks.wraithGone && hooks.wraithGone(); }
    }
    shake = Math.max(0, shake - dt * 20);
  }

  // ---------- 그리기 ----------
  const flipped = new Map();
  function flipOf(c) { if (!flipped.has(c)) flipped.set(c, flipX(c)); return flipped.get(c); }
  function glow(x, y, r, col, a) {
    const C = hex(col);
    g.fillStyle = `rgba(${C[0]},${C[1]},${C[2]},${a})`;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
      const d = Math.hypot(xx, yy) / r;
      if (d <= 1 && BAYER[(yy + 64) & 3][(xx + 64) & 3] > d * 0.95) g.fillRect(Math.round(x + xx), Math.round(y + yy), 1, 1);
    }
  }
  function drawUnit(u) {
    let img;
    const fi = Math.floor(u.ft * (u.st === 'walk' || u.st === 'wander' ? 8 : u.st === 'reap' ? 6 : 2.5));
    if (u.mini) img = SP.mini(u.st === 'walk' || u.st === 'wander' ? 'walk' : 'idle', fi);
    else img = SP.reaper(kind, u.st === 'wander' ? 'walk' : u.st, fi % 4);
    if (u.face < 0) img = flipOf(img);
    // 그림자
    g.fillStyle = 'rgba(0,0,0,0.35)';
    const sw = u.mini ? 8 : 14; g.fillRect(Math.round(u.x - sw / 2), Math.round(u.y - 1), sw, 2); g.fillRect(Math.round(u.x - sw / 2 + 2), Math.round(u.y - 2), sw - 4, 1);
    g.drawImage(img, Math.round(u.x - img.width / 2), Math.round(u.y - img.height + 1));
    if (u.st === 'reap') { const p = scrollPos(u); glow(p.x, p.y, u.mini ? 4 : 7, '#ffe08a', 0.35); }
  }
  function render() {
    const ox = shake ? Math.round(rnd(-shake, shake)) : 0;
    g.setTransform(1, 0, 0, 1, ox, 0);
    g.drawImage(bg, 0, 0);
    // 별 반짝임
    for (const s of stars) if (s.big || (s.ph * 10 | 0) % 4 === 0) {
      const k = Math.sin(time * 2 + s.ph);
      if (k > 0.6) { g.fillStyle = '#fffbe8'; g.fillRect(s.x, s.y, 1, 1); if (s.big && k > 0.85) { g.fillStyle = 'rgba(255,250,220,0.6)'; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } }
    }
    // 등불 빛
    for (const l of lanterns) glow(l.x, l.y, l.small ? 3 : 8 + Math.round(Math.sin(time * 6 + l.x) * 0.8), l.gold ? '#ffcf6a' : '#ff8a6a', l.small ? 0.5 : 0.22);
    // 반딧불
    if (!flies.length) for (let i = 0; i < 7; i++) flies.push({ x: rnd(0, W), y: rnd(GY - 10, H - 4), ph: rnd(0, 6), sp: rnd(0.3, 0.8) });
    for (const f of flies) {
      f.x += Math.sin(time * f.sp + f.ph) * 0.12; f.y += Math.cos(time * f.sp * 1.3 + f.ph) * 0.08;
      if (f.x < 0) f.x += W; if (f.x > W) f.x -= W;
      const k = Math.sin(time * 2.2 + f.ph * 3);
      if (k > 0.1) { g.fillStyle = k > 0.7 ? '#fffbb0' : '#c8e870'; g.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); if (k > 0.75) { g.fillStyle = 'rgba(220,255,140,0.35)'; g.fillRect(Math.round(f.x) - 1, Math.round(f.y), 3, 1); g.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3); } }
    }
    // 강물 반짝임
    if (R().river) { g.fillStyle = 'rgba(160,190,255,0.7)'; for (let i = 0; i < 6; i++) { const x = (i * 23 + time * 8) % W, y = GY + 4 + (i * 5) % Math.round((H - GY) * 0.28); g.fillRect(Math.round(x), y, 3, 1); } }
    // 개체 (발 위치 순서)
    const list = [reaper, ...minions].sort((a, b) => a.y - b.y);
    // 혼령은 공중이라 먼저 그림자만, 그리고 위에
    for (const s of souls) if (s.st === 'float') { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(Math.round(s.x - 3), Math.round(clampFeet(s.by + 30) - 1), 6, 1); }
    list.forEach(drawUnit);
    for (const s of souls) {
      const img = SP.soul(s.tier, Math.floor(time * 6 + s.ph) % 3);
      glow(s.x, s.y, s.tier ? 9 : 7, SP.SOUL_PAL[s.tier].Q, 0.25 * s.a);
      g.globalAlpha = s.a;
      const sc = s.scale || 1;
      if (sc < 1) g.drawImage(img, Math.round(s.x - img.width * sc / 2), Math.round(s.y - img.height * sc / 2), Math.round(img.width * sc), Math.round(img.height * sc));
      else g.drawImage(img, Math.round(s.x - img.width / 2), Math.round(s.y - img.height / 2));
      g.globalAlpha = 1;
    }
    if (wraith) {
      const img = SP.wraith(Math.floor(wraith.t * 3) % 2), y = wraith.y + Math.sin(wraith.t * 2) * 3;
      g.globalAlpha = wraith.dead ? Math.max(0, wraith.fade / 0.6) : Math.min(1, wraith.t * 2) * (0.85 + Math.sin(wraith.t * 9) * 0.1);
      glow(wraith.x, y, 16, '#ff2e4a', 0.12);
      g.drawImage(img, Math.round(wraith.x - img.width / 2 + (wraith.flash ? rnd(-1, 1) : 0)), Math.round(y - img.height / 2));
      if (wraith.flash) { g.globalAlpha = wraith.flash * 3; g.globalCompositeOperation = 'lighter'; g.drawImage(img, Math.round(wraith.x - img.width / 2), Math.round(y - img.height / 2)); g.globalCompositeOperation = 'source-over'; }
      g.globalAlpha = 1;
      if (!wraith.dead) { // 체력바
        const bw = 26, bx = Math.round(wraith.x - bw / 2), by = Math.round(y - img.height / 2 - 6);
        g.fillStyle = '#0f0c18'; g.fillRect(bx - 1, by - 1, bw + 2, 4);
        g.fillStyle = '#4a1020'; g.fillRect(bx, by, bw, 2);
        g.fillStyle = '#ff3a5a'; g.fillRect(bx, by, Math.round(bw * wraith.hp / wraith.max), 2);
      }
    }
    for (const p of parts) { g.globalAlpha = Math.min(1, p.life / p.max * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    g.globalAlpha = 1;
    // 안개
    const fog = hex(R().fog);
    g.fillStyle = `rgba(${fog[0]},${fog[1]},${fog[2]},0.10)`;
    for (let y = GY - 6; y < GY + 10; y++) for (let x = 0; x < W; x++) {
      const dd = Math.sin((x + time * 6) * 0.08 + y * 0.4) * 0.5 + 0.5;
      if (BAYER[y & 3][x & 3] < dd * 0.5) g.fillRect(x, y, 1, 1);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  let last = 0;
  function loop(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
    update(dt); render();
    hooks.tick && hooks.tick(dt);
    requestAnimationFrame(loop);
  }
  function tap(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / S, y = (e.clientY - r.top) / S;
    if (wraith && !wraith.dead && Math.abs(x - wraith.x) < 13 && Math.abs(y - wraith.y) < 15) { hooks.wraithTap && hooks.wraithTap(x * S, y * S); return; }
    let best = null, bd = 14;
    for (const s of souls) if (s.st === 'float') { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
    if (best) {
      if (best.who && best.who.target === best) best.who.target = null;
      const tapper = { x: reaper.x, y: reaper.y, face: reaper.face, tap: true };
      best.who = tapper; best.st = 'pull'; best.t = 0; best.sx = best.x; best.sy = best.y; best.dur = 0.35;
      Object.defineProperty(tapper, 'x', { get: () => reaper.x }); Object.defineProperty(tapper, 'y', { get: () => reaper.y });
      Sound.play('tap');
      return;
    }
    burst(x, y, '#c9b6ff', 5, 18);
  }
  return {
    init(canvas, h) {
      cv = canvas; g = cv.getContext('2d'); hooks = h || {};
      resize(); reaper.x = W * 0.4; reaper.y = clampFeet(GY + (H - GY) * 0.65);
      window.addEventListener('resize', resize);
      cv.addEventListener('pointerdown', tap);
      requestAnimationFrame(loop);
    },
    resize,
    setRegion(i) { region = Math.max(0, Math.min(REGIONS.length - 1, i)); bg = bake(); },
    setKind(k) { kind = k; },
    config(c) { Object.assign(cfg, c); },
    spawnWraith(hp, life) { wraith = { x: rnd(W * 0.3, W * 0.7), y: GY * 0.75, hp, max: hp, t: 0, life, flash: 0 }; Sound.play('wraith'); },
    hitWraith(dmg) {
      if (!wraith || wraith.dead) return false;
      wraith.hp = Math.max(0, wraith.hp - dmg); wraith.flash = 0.15; shake = Math.max(shake, 1.5);
      burst(wraith.x + rnd(-6, 6), wraith.y + rnd(-8, 8), '#ffffff', 4, 25);
      if (wraith.hp <= 0) { wraith.dead = true; wraith.fade = 0.8; burst(wraith.x, wraith.y, '#ff6a8a', 30, 50); burst(wraith.x, wraith.y, '#ffffff', 20, 40); return true; }
      return false;
    },
    wraithAlive: () => !!(wraith && !wraith.dead),
    wraithHp: () => wraith ? wraith.hp : 0,
    wraithPos: () => wraith ? { x: wraith.x * S, y: wraith.y * S } : null,
    burstAt(xc, yc, col, n) { burst(xc / S, yc / S, col, n, 40); },
    get scale() { return S; },
  };
})();
