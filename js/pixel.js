// ===== 도트(픽셀) 그리기 엔진 =====
// 파츠별 레이어 → 자동 명암 → 자동 외곽선 → 합성 → 스프라이트 시트(PNG) → CSS steps() 애니메이션
const Pixel = (() => {
  const COLS = 6; // 시트 가로 프레임 수 (대기 6프레임, 공격/스킬 4프레임)

  // ---------- 색 ----------
  const memo = new Map();
  function tone(c, a) {
    const k = c + '|' + a;
    let v = memo.get(k);
    if (!v) { v = Art.shade(c.slice(0, 7), a) + (c.length > 7 ? c.slice(7) : ''); memo.set(k, v); }
    return v;
  }
  const rgbMemo = new Map();
  function rgba(c) {
    let v = rgbMemo.get(c);
    if (!v) {
      const n = parseInt(c.slice(1, 7), 16);
      v = [n >> 16, (n >> 8) & 255, n & 255, c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255];
      rgbMemo.set(c, v);
    }
    return v;
  }

  // ---------- 레이어 ----------
  class Layer {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
    set(x, y, c) {
      x = Math.round(x); y = Math.round(y);
      if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
    }
    get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null; }
    rect(x, y, w, h, c) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    }
    ell(cx, cy, rx, ry, c, test) {
      if (rx <= 0 || ry <= 0) return;
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1 && (!test || test(x, y))) this.set(x, y, c);
        }
    }
    poly(pts, c) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
        for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
          const px = x + 0.5, py = y + 0.5;
          let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
          }
          if (inside) this.set(x, y, c);
        }
    }
    line(x0, y0, x1, y1, c, t = 1) {
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5));
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        this.set(x, y, c);
        if (t > 1) { this.set(x + 1, y, c); this.set(x, y + 1, c); this.set(x + 1, y + 1, c); }
      }
    }
    // 빛은 왼쪽 위에서: 윗면 밝게, 아랫면/오른쪽 어둡게
    shade(hl = 0.3, dk = 0.24) {
      const s = this.d.slice(), w = this.w, h = this.h;
      const g = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? s[y * w + x] : null);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = s[y * w + x];
        if (!c || c.length > 7) continue;
        if (!g(x, y - 1) || (!g(x - 1, y) && !g(x - 1, y - 1))) this.d[y * w + x] = tone(c, hl);
        else if (!g(x, y + 1) || !g(x, y + 2) || !g(x + 1, y)) this.d[y * w + x] = tone(c, -dk);
      }
      return this;
    }
    // 바깥쪽 1픽셀 외곽선 (이웃 색보다 진한 색 = 컬러 외곽선)
    outline(fixed) {
      const s = this.d.slice(), w = this.w, h = this.h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (s[y * w + x]) continue;
        const n = (x > 0 && s[y * w + x - 1]) || (x < w - 1 && s[y * w + x + 1]) || (y > 0 && s[(y - 1) * w + x]) || (y < h - 1 && s[(y + 1) * w + x]);
        if (n && n.length <= 7) this.d[y * w + x] = fixed || tone(n, -0.62);
      }
      return this;
    }
    paste(o, ox = 0, oy = 0) {
      for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const c = o.d[y * o.w + x]; if (c) this.set(x + ox, y + oy, c); }
      return this;
    }
    // 그 자리 픽셀 색만 바꾸기 (이미 칠해진 곳에만)
    tint(x, y, c) { if (this.get(x, y)) this.set(x, y, c); }
  }
  const layer = (w, h) => new Layer(w, h);
  // 파츠 하나 = 그리고 → 명암 → 외곽선
  function part(w, h, fn, opt = {}) {
    const L = new Layer(w, h);
    fn(L);
    if (!opt.flat) L.shade(opt.hl, opt.dk);
    if (!opt.noOutline) L.outline(opt.oc);
    return L;
  }

  // ---------- 시트 ----------
  function toURL(frames, fw, fh) { // frames: [[Layer...] per row]
    const rows = frames.length;
    const cv = document.createElement('canvas');
    cv.width = fw * COLS; cv.height = fh * rows;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(cv.width, cv.height), D = img.data;
    frames.forEach((row, r) => row.forEach((L, f) => {
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        const c = L.d[y * L.w + x];
        if (!c) continue;
        const [R, G2, B, A] = rgba(c), i = ((r * fh + y) * cv.width + f * fw + x) * 4;
        D[i] = R; D[i + 1] = G2; D[i + 2] = B; D[i + 3] = A;
      }
    }));
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  }
  function stillURL(L) {
    const cv = document.createElement('canvas');
    cv.width = L.w; cv.height = L.h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(L.w, L.h), D = img.data;
    L.d.forEach((c, i) => { if (!c) return; const [R, G2, B, A] = rgba(c); D[i * 4] = R; D[i * 4 + 1] = G2; D[i * 4 + 2] = B; D[i * 4 + 3] = A; });
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  }
  function sprHTML(url, fw, fh, rows, cls = '') {
    return `<div class="spr ${cls}" style="--sheet:url(${url});--fw:${fw};--fh:${fh};--rows:${rows};--ry1:${(100 / (rows - 1)).toFixed(3)}%;--ry2:${rows > 2 ? 100 : 100}%"></div>`;
  }

  return { COLS, Layer, layer, part, tone, toURL, stillURL, sprHTML };
})();
