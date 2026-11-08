// ===== 도트 그래픽: 팔레트 + 격자 스프라이트 + 렌더 도우미 =====
// 격자 문자 하나 = 픽셀 하나. '.'은 투명. 좌우 대칭 그림은 왼쪽 절반만 적고 mirror()로 펼친다.
const PAL = {
  K: '#0f0c18', // 외곽선
  H: '#1d1a2a', h: '#3b3654', D: '#121019', // 갓
  G: '#2a2640', g: '#4d4670', // 갓 챙
  b: '#d9a441', y: '#ffe08a', // 갓끈 구슬
  S: '#f3e8de', s: '#cdbab6', P: '#eea2ac', // 피부, 그늘, 볼터치
  E: '#1a1024', w: '#ffffff', m: '#8a3c4a', M: '#cf3346', // 눈, 하이라이트, 입, 입술
  R: '#2a2540', r: '#191626', L: '#4a4468', l: '#6a6390', // 도포
  W: '#efeaf4', v: '#b9b0cc', // 동정(흰 깃)
  B: '#c3313e', c: '#7e1f2a', o: '#ff6a5e', // 붉은 띠
  A: '#231d33', a: '#463c63', // 머리카락
  U: '#3a2d55', u: '#55447a', // 치마
  F: '#1a1724', f: '#38334f', // 신발
  T: '#e9d9b0', t: '#b09a6a', n: '#7a6440', x: '#3a2a20', // 명부(두루마리 종이)
  // 혼령
  q: '#3561c9', Q: '#6fb0ff', z: '#c9f2ff', Z: '#ffffff',
  // 원귀
  i: '#e8eef8', j: '#a9b6cc', k: '#6c7891', e: '#ff2e4a',
};

const mirror = rows => rows.map(r => r + [...r].reverse().join(''));
function patch(rows, x, y, pr) {
  const out = rows.slice();
  pr.forEach((line, dy) => {
    const arr = [...(out[y + dy] || '')];
    [...line].forEach((ch, dx) => { if (ch !== ' ') arr[x + dx] = ch === '_' ? '.' : ch; });
    out[y + dy] = arr.join('');
  });
  return out;
}

// 격자 → 캔버스 (pal: 팔레트 덮어쓰기)
function bake(rows, pal) {
  const P = Object.assign({}, PAL, pal || {});
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.' || ch === ' ' || !P[ch]) return;
    g.fillStyle = P[ch]; g.fillRect(x, y, 1, 1);
  }));
  return c;
}
// 여러 조각 합성: [[rows, dx, dy], ...]
function compose(w, h, parts, pal) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  parts.forEach(([rows, dx, dy]) => g.drawImage(bake(rows, pal), dx | 0, dy | 0));
  return c;
}
// 외곽선 없는 스프라이트에 1px 테두리 덧그리기
function outline(src, color) {
  const w = src.width + 2, h = src.height + 2;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
  g.fillStyle = color;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    if (d[(y * src.width + x) * 4 + 3] < 10) continue;
    g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y, 1, 3);
  }
  g.drawImage(src, 1, 1);
  return c;
}
function flipX(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
// 색 바꾼 복사본 (부하 차사, 원귀 등급 등)
function recolor(src, map) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const pairs = Object.entries(map).map(([a, b]) => [hex(a), hex(b)]);
  for (let i = 0; i < d.length; i += 4) {
    for (const [a, b] of pairs) if (d[i] === a[0] && d[i + 1] === a[1] && d[i + 2] === a[2]) { d[i] = b[0]; d[i + 1] = b[1]; d[i + 2] = b[2]; break; }
  }
  g.putImageData(im, 0, 0);
  return c;
}
// 캔버스를 키워서 <img>용 dataURL로
function toURL(src, scale) {
  const c = document.createElement('canvas'); c.width = src.width * scale; c.height = src.height * scale;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}
