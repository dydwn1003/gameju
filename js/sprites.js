// 절차적 픽셀 스프라이트 — 외부 이미지 없이 코드로 모든 도트를 그린다.
'use strict';
(function () {
  const cache = new Map();
  const OUTLINE = '#130f18';

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // fn(g) 로 그린 뒤 1px 외곽선을 자동으로 두른 캔버스를 만든다 (w+2, h+2)
  function outlined(w, h, fn, col = OUTLINE) {
    const a = mk(w + 2, h + 2);
    const ga = a.getContext('2d');
    ga.translate(1, 1);
    fn(ga);
    const s = mk(w + 2, h + 2);
    const gs = s.getContext('2d');
    gs.drawImage(a, 0, 0);
    gs.globalCompositeOperation = 'source-in';
    gs.fillStyle = col;
    gs.fillRect(0, 0, w + 2, h + 2);
    const out = mk(w + 2, h + 2);
    const go = out.getContext('2d');
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) go.drawImage(s, dx, dy);
    go.drawImage(a, 0, 0);
    return out;
  }

  function get(key, make) {
    let c = cache.get(key);
    if (!c) { c = make(); cache.set(key, c); }
    return c;
  }

  function scaled(src, s) {
    if (s === 1) return src;
    const c = mk(src.width * s, src.height * s);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  function flipped(src) {
    const c = mk(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }

  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const px = (g, x, y, c) => rect(g, x, y, 1, 1, c);
  function ell(g, cx, cy, rx, ry, c, clip) {
    g.fillStyle = c;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) g.fillRect(x, y, 1, 1);
      }
    }
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return '#' + ((1 << 24) | (f(r) << 16) | (f(gg) << 8) | f(b)).toString(16).slice(1);
  }

  // ─── 인간형 (플레이어·NPC·인간형 몬스터) ─────────────────
  // 캔버스 18x23, 머리 위 모자 여유 2px. dir: down / up / side(오른쪽)
  function drawHuman(g, L, dir, frame) {
    g.translate(1, 2);
    const eye = L.eye || '#1a1420';
    const skin = L.skin, hair = L.hair, body = L.body, bodyD = L.bodyD;
    const walk = frame % 4;
    // 날개 / 망토 (뒤)
    if (L.wings) {
      const up = frame % 2 === 0 ? 0 : 1;
      rect(g, -1, 7 + up, 5, 4, L.wings); rect(g, 0, 11 + up, 3, 2, L.wings);
      rect(g, 12, 7 + up, 5, 4, L.wings); rect(g, 13, 11 + up, 3, 2, L.wings);
    }
    if (L.cape && dir !== 'up') rect(g, dir === 'side' ? 3 : 3, 9, dir === 'side' ? 4 : 10, 7, L.cape);
    // 다리
    if (dir === 'side') {
      const pos = walk === 1 ? [5, 9] : walk === 3 ? [9, 5] : [6, 8];
      for (const lx of pos) { rect(g, lx, 15, 2, 3, L.legs); rect(g, lx, 17, 2, 2, L.boots); }
      if (walk === 1 || walk === 3) px(g, pos[0] + (pos[0] < 7 ? 2 : -1), 18, L.boots);
    } else {
      const lh = walk === 1 ? 3 : 4, rh = walk === 3 ? 3 : 4;
      rect(g, 5, 15, 2, lh, L.legs); rect(g, 5, 15 + lh - 2, 2, 2, L.boots);
      rect(g, 9, 15, 2, rh, L.legs); rect(g, 9, 15 + rh - 2, 2, 2, L.boots);
    }
    // 몸통
    if (dir === 'side') {
      rect(g, 5, 9, 6, 6, body); rect(g, 5, 9, 1, 6, bodyD); rect(g, 5, 13, 6, 1, bodyD);
    } else {
      rect(g, 4, 9, 8, 6, body); rect(g, 4, 9, 1, 6, bodyD); rect(g, 4, 13, 8, 1, bodyD);
      if (dir === 'down') rect(g, 7, 10, 2, 2, shade(body, 0.25));
    }
    if (L.cape && dir === 'up') rect(g, 4, 9, 8, 7, L.cape);
    // 팔
    const swing = walk === 1 ? 1 : walk === 3 ? -1 : 0;
    if (dir === 'side') {
      rect(g, 7 + swing, 9, 2, 4, bodyD); px(g, 7 + swing, 13, skin); px(g, 8 + swing, 13, skin);
    } else {
      rect(g, 3, 9 + Math.max(0, swing), 1, 4, bodyD); px(g, 3, 13 + Math.max(0, swing), skin);
      rect(g, 12, 9 + Math.max(0, -swing), 1, 4, bodyD); px(g, 12, 13 + Math.max(0, -swing), skin);
    }
    // 머리
    if (dir === 'up') {
      rect(g, 4, 2, 8, 7, hair); rect(g, 4, 7, 8, 1, shade(hair, -0.2));
    } else if (dir === 'side') {
      rect(g, 4, 2, 8, 7, skin);
      rect(g, 4, 2, 8, 2, hair); rect(g, 4, 2, 4, 6, hair); px(g, 8, 4, hair);
      if (!L.skull) rect(g, 10, 5, 1, 2, eye);
      else { rect(g, 9, 5, 2, 2, '#241c20'); px(g, 10, 5, eye); }
      if (L.ears) { rect(g, 3, 4, 2, 2, skin); px(g, 2, 3, skin); }
    } else {
      rect(g, 4, 2, 8, 7, skin);
      rect(g, 4, 2, 8, 2, hair); rect(g, 4, 4, 1, 3, hair); rect(g, 11, 4, 1, 3, hair);
      if (L.skull) { rect(g, 5, 5, 2, 2, '#241c20'); rect(g, 9, 5, 2, 2, '#241c20'); px(g, 6, 6, eye); px(g, 9, 6, eye); rect(g, 6, 8, 4, 1, '#9a9684'); }
      else { rect(g, 6, 5, 1, 2, eye); rect(g, 9, 5, 1, 2, eye); px(g, 5, 7, shade(skin, -0.12)); px(g, 10, 7, shade(skin, -0.12)); }
      if (L.ears) { rect(g, 2, 4, 2, 2, skin); px(g, 1, 3, skin); rect(g, 12, 4, 2, 2, skin); px(g, 14, 3, skin); }
    }
    // 모자
    const hc = L.hatC || hair;
    const side = dir === 'side';
    switch (L.hat) {
      case 'helm':
        rect(g, 3, 1, 10, 5, hc); rect(g, 3, 1, 10, 1, shade(hc, 0.3));
        if (dir === 'down') { rect(g, 5, 5, 6, 1, '#1a1420'); rect(g, 7, -1, 2, 2, '#c23a3a'); }
        else if (side) { rect(g, 8, 5, 4, 1, '#1a1420'); rect(g, 5, -1, 3, 2, '#c23a3a'); }
        else rect(g, 7, -1, 2, 2, '#c23a3a');
        rect(g, 3, 6, 1, 2, hc); rect(g, 12, 6, 1, 2, hc);
        break;
      case 'hood':
        rect(g, 3, 1, 10, 3, hc); rect(g, 3, 1, 2, 8, hc); rect(g, 11, 1, 2, 8, hc);
        if (dir === 'up') rect(g, 3, 1, 10, 9, hc);
        if (side) { rect(g, 3, 1, 6, 9, hc); }
        px(g, 8, 0, hc);
        break;
      case 'wizard':
        rect(g, 2, 3, 12, 1, hc); rect(g, 4, 0, 8, 3, hc); rect(g, 5, -2, 6, 2, hc); rect(g, 7, -3, 3, 1, hc);
        rect(g, 4, 2, 8, 1, '#e0c040');
        break;
      case 'mask':
        rect(g, 3, 1, 10, 3, hc);
        if (dir === 'down') rect(g, 4, 7, 8, 2, hc);
        else if (side) rect(g, 8, 7, 4, 2, hc);
        else rect(g, 3, 1, 10, 7, hc);
        if (dir !== 'up') rect(g, side ? 2 : 1, 3, 2, 1, '#c23a3a');
        break;
      case 'bandana':
        rect(g, 3, 2, 10, 2, hc); rect(g, side ? 2 : 12, 3, 2, 2, hc);
        break;
      case 'minehelm':
        rect(g, 3, 0, 10, 3, hc); rect(g, 2, 3, 12, 1, shade(hc, -0.2));
        if (dir !== 'up') rect(g, side ? 10 : 7, 1, 2, 1, '#fffbe0');
        break;
      case 'horns':
        rect(g, 3, -1, 2, 3, hc); px(g, 2, -2, hc); rect(g, 11, -1, 2, 3, hc); px(g, 13, -2, hc);
        break;
      case 'crown':
        rect(g, 4, 0, 8, 2, hc); px(g, 4, -1, hc); px(g, 7, -2, hc); px(g, 8, -2, hc); px(g, 11, -1, hc);
        px(g, 8, 0, '#4fa8ff');
        break;
      case 'halo':
        rect(g, 5, -2, 6, 1, '#ffe86a'); px(g, 4, -1, '#ffe86a'); px(g, 11, -1, '#ffe86a');
        break;
    }
    // 방패 (앞)
    if (L.shield) {
      const sc = L.shieldC || '#c9a040';
      if (dir === 'down') { rect(g, 1, 10, 4, 5, sc); rect(g, 2, 11, 2, 3, '#b33a3a'); rect(g, 2, 12, 2, 1, '#e8e0c0'); }
      else if (side) { rect(g, 9, 9, 3, 6, sc); rect(g, 10, 10, 1, 4, '#b33a3a'); }
    }
  }

  // ─── 비인간형 몬스터 ─────────────────────────────────────
  const ARCH = {
    blob: { w: 16, h: 13, draw(g, p, f) {
      const s = f % 2;
      ell(g, 8, 8 + s * 0.5, 7 + s * 0.5, 5.5 - s * 0.5, p[0]);
      ell(g, 8, 10 + s * 0.5, 6, 2.5, p[1], (x, y) => y >= 10);
      ell(g, 5.5, 6 + s, 2, 1.5, p[2]);
      rect(g, 5, 8 + s, 1, 2, '#1a1420'); rect(g, 10, 8 + s, 1, 2, '#1a1420');
    } },
    mushroom: { w: 16, h: 17, draw(g, p, f) {
      const s = f % 2;
      rect(g, 5, 8, 6, 7, p[2]); rect(g, 5, 8, 1, 7, shade(p[2], -0.2));
      rect(g, 6, 10, 1, 2, '#1a1420'); rect(g, 9, 10, 1, 2, '#1a1420');
      rect(g, s ? 4 : 5, 15, 3, 2, shade(p[2], -0.3)); rect(g, s ? 10 : 9, 15, 3, 2, shade(p[2], -0.3));
      ell(g, 8, 6, 8, 6, p[0], (x, y) => y <= 8);
      rect(g, 1, 8, 14, 1, p[1]);
      px(g, 4, 3, '#fff'); rect(g, 5, 4, 2, 2, '#fff'); rect(g, 10, 2, 2, 2, '#fff'); px(g, 12, 6, '#fff'); px(g, 8, 6, '#fff');
    } },
    quad: { w: 22, h: 14, draw(g, p, f, m) {
      const s = f % 2;
      const eye = m.eye || (m.elem === 'FIRE' ? '#ffe040' : '#ffd23a');
      rect(g, 0, 3 + s, 4, 2, p[0]); px(g, 0, 2 + s, p[0]);
      rect(g, 3, 4, 13, 6, p[0]); rect(g, 4, 8, 11, 2, p[2]); rect(g, 3, 4, 13, 1, shade(p[0], 0.2));
      rect(g, 14, 1, 6, 6, p[0]); rect(g, 19, 4, 3, 2, p[0]); px(g, 21, 4, '#1a1420');
      rect(g, 15, -1, 2, 2, p[1]); rect(g, 18, -1, 2, 2, p[1]);
      px(g, 17, 3, eye); rect(g, 19, 6, 2, 1, p[2]);
      const ly = [s ? 10 : 10, s ? 9 : 10, s ? 10 : 9, s ? 9 : 10];
      [4, 7, 12, 15].forEach((x, i) => rect(g, x, ly[i], 2, 14 - ly[i], p[1]));
      if (m.elem === 'FIRE') { px(g, 1, 1 + s, '#ffb030'); px(g, 3, 2, '#ff7a33'); }
    } },
    spider: { w: 20, h: 13, draw(g, p, f) {
      const s = f % 2;
      for (let i = 0; i < 4; i++) {
        const o = (i + s) % 2;
        const y = 4 + i * 2;
        rect(g, 1 + o, y, 5, 1, p[1]); rect(g, 0 + o, y + 1, 1, 2, p[1]);
        rect(g, 14 - o, y, 5, 1, p[1]); rect(g, 19 - o, y + 1, 1, 2, p[1]);
      }
      ell(g, 10, 5, 5, 4.5, p[0]);
      ell(g, 10, 10, 3, 2.5, p[1]);
      rect(g, 9, 3, 2, 3, p[2]); px(g, 8, 4, p[2]); px(g, 11, 4, p[2]);
      px(g, 9, 10, '#ff3a3a'); px(g, 11, 10, '#ff3a3a');
    } },
    ghost: { w: 14, h: 16, draw(g, p, f) {
      const s = f % 2;
      ell(g, 7, 6, 6.5, 6, p[0]);
      rect(g, 1, 6, 12, 7, p[0]);
      for (let x = 1; x < 13; x++) if ((x + s) % 3 !== 0) rect(g, x, 13, 1, 2 - ((x + s) % 2), p[0]);
      rect(g, 1, 6, 1, 7, p[1]);
      ell(g, 4.5, 4, 1.5, 1.5, p[2]);
      rect(g, 4, 6, 2, 3, '#1a1420'); rect(g, 8, 6, 2, 3, '#1a1420'); rect(g, 6, 10, 2, 2, '#1a1420');
    } },
    flyer: { w: 22, h: 15, draw(g, p, f) {
      const up = f % 2 === 0;
      if (up) {
        for (let i = 0; i < 7; i++) { rect(g, 1 + i, 7 - i, 1, i + 1, p[1]); rect(g, 20 - i, 7 - i, 1, i + 1, p[1]); }
        rect(g, 1, 7, 7, 2, p[1]); rect(g, 14, 7, 7, 2, p[1]);
      } else {
        for (let i = 0; i < 6; i++) { rect(g, 1 + i, 6, 1, 3 + i, p[1]); rect(g, 20 - i, 6, 1, 3 + i, p[1]); }
        rect(g, 1, 6, 7, 2, p[1]); rect(g, 14, 6, 7, 2, p[1]);
      }
      ell(g, 11, 8, 4, 5, p[0]);
      rect(g, 8, 2, 2, 3, p[0]); rect(g, 12, 2, 2, 3, p[0]);
      px(g, 9, 6, p[2]); px(g, 12, 6, p[2]);
      rect(g, 10, 13, 1, 2, p[1]); rect(g, 12, 13, 1, 2, p[1]);
    } },
    golem: { w: 22, h: 24, draw(g, p, f) {
      const s = f % 2;
      rect(g, 5, 17, 5, 7, p[1]); rect(g, 12, 17, 5, 7, p[1]);
      rect(g, 3, 6, 16, 12, p[0]); rect(g, 3, 6, 16, 2, p[2]); rect(g, 3, 6, 2, 12, p[1]);
      rect(g, 0, 7 + s, 4, 11, p[0]); rect(g, 0, 16 + s, 4, 3, p[1]);
      rect(g, 18, 8 - s, 4, 11, p[0]); rect(g, 18, 17 - s, 4, 3, p[1]);
      rect(g, 6, 0, 10, 7, p[0]); rect(g, 6, 0, 10, 1, p[2]);
      rect(g, 8, 3, 2, 2, p[2] === '#ff7a33' ? '#ffcc33' : '#ffe86a'); rect(g, 12, 3, 2, 2, p[2] === '#ff7a33' ? '#ffcc33' : '#ffe86a');
      px(g, 7, 10, p[1]); px(g, 8, 11, p[1]); px(g, 14, 12, p[1]); px(g, 15, 13, p[1]); px(g, 10, 14, p[1]);
      if (p[0] === '#4a7a2a') { rect(g, 4, 5, 5, 2, '#8ac04a'); rect(g, 13, 5, 4, 2, '#8ac04a'); px(g, 5, 7, '#8ac04a'); px(g, 16, 7, '#8ac04a'); }
    } },
    worm: { w: 22, h: 15, draw(g, p, f) {
      const s = f % 2;
      for (let i = 0; i < 5; i++) {
        const x = 3 + i * 4, y = 9 + Math.round(Math.sin(i * 1.3 + s * 1.6) * 2);
        ell(g, x, y, 3.2 - i * 0.1, 3, i % 2 ? p[1] : p[0]);
        px(g, x, y - 2, p[2]);
      }
      ell(g, 19, 6 + s, 3.5, 3.5, p[0]);
      rect(g, 20, 6 + s, 3, 2, '#1a0a08'); px(g, 21, 6 + s, p[2]);
      px(g, 18, 4 + s, '#ffe86a');
    } },
  };

  // ─── 공개 API ─────────────────────────────────────────
  const S = (R.SPR = {});
  S.shade = shade;

  // 인간형 스프라이트. flip=true면 왼쪽을 본다
  S.human = function (key, look, dir, frame, flip, scale = 1) {
    const d = dir === 'left' || dir === 'right' ? 'side' : dir;
    const k = `h:${key}:${d}:${frame % 4}:${flip ? 1 : 0}:${scale}`;
    return get(k, () => {
      const base = get(`h:${key}:${d}:${frame % 4}:0:1`, () => outlined(18, 23, (g) => drawHuman(g, look, d, frame)));
      let c = flip ? flipped(base) : base;
      return scaled(c, scale);
    });
  };

  S.monster = function (id, m, frame, flip, scale = 1) {
    const a = ARCH[m.arch];
    const k = `m:${id}:${frame % 2}:${flip ? 1 : 0}:${scale}`;
    return get(k, () => {
      const base = get(`m:${id}:${frame % 2}:0:1`, () => outlined(a.w, a.h, (g) => a.draw(g, m.pal, frame, m)));
      return scaled(flip ? flipped(base) : base, scale);
    });
  };

  // 흰색 피격 플래시용 실루엣
  S.white = function (src) {
    const k = src; // 캔버스 객체 자체를 키로
    let c = cache.get(k);
    if (!c) {
      c = mk(src.width, src.height);
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);
      cache.set(k, c);
    }
    return c;
  };

  // ─── 무기 (오른쪽을 향한 상태, 손잡이가 (0, h/2)) ─────
  S.weapon = function (type) {
    return get('w:' + type, () => {
      switch (type) {
        case 'sword': return outlined(13, 5, (g) => { rect(g, 0, 1, 3, 3, '#6a4a2a'); rect(g, 3, 0, 1, 5, '#c9a040'); rect(g, 4, 1, 8, 3, '#dfe6f0'); rect(g, 4, 1, 8, 1, '#ffffff'); rect(g, 12, 2, 1, 1, '#dfe6f0'); });
        case 'dagger': return outlined(8, 3, (g) => { rect(g, 0, 0, 2, 3, '#4a2a3a'); rect(g, 2, 0, 1, 3, '#8a8a9a'); rect(g, 3, 0, 5, 2, '#dfe6f0'); rect(g, 3, 2, 4, 1, '#9aa4b4'); });
        case 'staff': return outlined(15, 5, (g) => { rect(g, 0, 2, 12, 1, '#7a5230'); rect(g, 11, 1, 1, 3, '#c9a040'); rect(g, 12, 0, 3, 5, '#6fd8ff'); px(g, 13, 1, '#ffffff'); });
        case 'bow': return outlined(6, 15, (g) => { for (let y = 0; y < 15; y++) { const x = Math.round(Math.sin((y / 14) * Math.PI) * 4); px(g, x + 1, y, '#8a5a2a'); } rect(g, 1, 0, 1, 15, '#e8e0d0'); });
        case 'club': return outlined(10, 5, (g) => { rect(g, 0, 2, 5, 1, '#6a4a2a'); rect(g, 5, 0, 5, 5, '#8a6a3a'); px(g, 7, 1, '#aa8a5a'); });
        case 'arrow': return outlined(10, 3, (g) => { rect(g, 0, 1, 8, 1, '#c9a070'); rect(g, 8, 0, 2, 3, '#dfe6f0'); rect(g, 0, 0, 2, 1, '#e84a4a'); rect(g, 0, 2, 2, 1, '#e84a4a'); });
        case 'knife': return outlined(6, 3, (g) => { rect(g, 0, 1, 2, 1, '#4a2a2a'); rect(g, 2, 0, 4, 3, '#dfe6f0'); });
      }
    });
  };

  // ─── 타일 ─────────────────────────────────────────────
  R.THEMES = {
    forest: { floor: ['#3f7a34', '#468536', '#3a7030'], dots: ['#5fa84a', '#2f5e28', '#78b85a'], wall: 'tree', top: '#2d6a2a', mid: '#3f8a3a', hi: '#6ab84a', front: '#5a3a22', hazard: ['#5a3a7a', '#7a4a9a'], sky: '#1c3a1c' },
    ruins:  { floor: ['#6a6a72', '#62626a', '#70707a'], dots: ['#54545c', '#80808a', '#5a6a4a'], wall: 'block', top: '#35323d', mid: '#2c2a33', hi: '#4a4654', front: '#8a8494', hazard: ['#3a2a4a', '#5a3a6a'], sky: '#24242c' },
    mine:   { floor: ['#6a5040', '#644a3a', '#705644'], dots: ['#56402c', '#86684e', '#4e3a2a'], wall: 'rock', top: '#2e2018', mid: '#3a2a20', hi: '#4a3628', front: '#8a6a4e', hazard: ['#e0501e', '#ffa030'], sky: '#1c1410' },
    ice:    { floor: ['#9fcce6', '#a8d4ec', '#96c4e0'], dots: ['#d8f0ff', '#84b4d4', '#ffffff'], wall: 'block', top: '#2e4a66', mid: '#26405a', hi: '#3e5e7e', front: '#bfe2f8', hazard: ['#4a8ac8', '#6fb0e8'], sky: '#1a2a3a' },
    hell:   { floor: ['#3a1a24', '#361820', '#40202a'], dots: ['#5a2030', '#2a1018', '#6a2a2a'], wall: 'spike', top: '#3a2a3a', mid: '#2e202e', hi: '#5a3a5a', front: '#160c16', hazard: ['#e0401e', '#ff8a30'], sky: '#12060a' },
    town:   { floor: ['#4a8a3c', '#51933f', '#468536'], dots: ['#6ab84a', '#3a7030', '#88c860'], wall: 'tree', top: '#2d6a2a', mid: '#3f8a3a', hi: '#6ab84a', front: '#5a3a22', hazard: ['#3a7ad8', '#5a9af0'], sky: '#1c3a1c', path: '#b89a6a' },
  };

  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  S.floor = function (theme, v) {
    return get(`f:${theme}:${v}`, () => {
      const T = R.THEMES[theme];
      const c = mk(16, 16), g = c.getContext('2d');
      const rnd = seeded(v * 977 + theme.length * 31);
      rect(g, 0, 0, 16, 16, T.floor[v % 3]);
      const n = theme === 'ruins' || theme === 'ice' ? 6 : 10;
      for (let i = 0; i < n; i++) px(g, (rnd() * 16) | 0, (rnd() * 16) | 0, T.dots[(rnd() * 3) | 0]);
      if (theme === 'ruins') { rect(g, 0, 0, 16, 1, shade(T.floor[0], -0.15)); rect(g, 0, 0, 1, 16, shade(T.floor[0], -0.15)); if (v === 2) { px(g, 5, 6, '#4a4a52'); px(g, 6, 7, '#4a4a52'); px(g, 7, 7, '#4a4a52'); } }
      if (theme === 'ice') { rect(g, 3 + v, 4, 3, 1, '#e8f8ff'); px(g, 10, 11 - v, '#ffffff'); }
      if ((theme === 'forest' || theme === 'town') && v === 1) { px(g, 4, 9, '#78b85a'); px(g, 5, 8, '#78b85a'); px(g, 6, 9, '#78b85a'); }
      if (theme === 'hell' && v === 2) { px(g, 8, 8, '#8a2a2a'); px(g, 9, 9, '#6a1a1a'); }
      return c;
    });
  };

  S.path = function (v) {
    return get('path:' + v, () => {
      const c = mk(16, 16), g = c.getContext('2d');
      const rnd = seeded(v * 71 + 5);
      rect(g, 0, 0, 16, 16, '#b89a6a');
      for (let i = 0; i < 9; i++) px(g, (rnd() * 16) | 0, (rnd() * 16) | 0, rnd() < 0.5 ? '#a08458' : '#ccb084');
      return c;
    });
  };

  S.iceFloor = function () {
    return get('icefloor', () => {
      const c = mk(16, 16), g = c.getContext('2d');
      rect(g, 0, 0, 16, 16, '#cfeeff'); rect(g, 0, 0, 16, 1, '#e8f8ff');
      rect(g, 2, 3, 5, 1, '#ffffff'); rect(g, 3, 4, 3, 1, '#ffffff'); rect(g, 9, 10, 4, 1, '#ffffff'); px(g, 12, 6, '#a8d8f0');
      return c;
    });
  };

  // 벽: 16x28 (타일 위로 12px 솟음)
  S.wall = function (theme, v) {
    return get(`w:${theme}:${v}`, () => {
      const T = R.THEMES[theme];
      const c = mk(16, 28), g = c.getContext('2d');
      const rnd = seeded(v * 131 + 7);
      if (T.wall === 'tree') {
        g.globalAlpha = 0.35; ell(g, 8, 26, 7, 2.5, '#0a1a0a'); g.globalAlpha = 1;
        rect(g, 6, 18, 4, 9, T.front); rect(g, 6, 18, 1, 9, shade(T.front, -0.3)); rect(g, 9, 18, 1, 9, shade(T.front, 0.2));
        ell(g, 8, 11, 8, 9, OUTLINE);
        ell(g, 8, 11, 7.2, 8.2, T.top);
        ell(g, 8, 10, 6.2, 7, T.mid);
        ell(g, 6, 7, 3, 3, T.hi);
        for (let i = 0; i < 6; i++) px(g, 3 + ((rnd() * 10) | 0), 5 + ((rnd() * 10) | 0), i % 2 ? T.top : T.hi);
        if (v === 1) { px(g, 10, 12, '#e84a4a'); px(g, 5, 13, '#e84a4a'); }
      } else if (T.wall === 'spike') {
        rect(g, 0, 20, 16, 8, T.front);
        rect(g, 0, 12, 16, 8, T.top);
        for (let i = 0; i < 3; i++) { const x = 1 + i * 5, h = 6 + ((rnd() * 6) | 0); for (let k = 0; k < h; k++) rect(g, x + (k >> 2), 12 - k, Math.max(1, 4 - (k >> 1)), 1, k % 3 ? T.mid : T.hi); }
        rect(g, 0, 12, 16, 1, T.hi);
        px(g, 4, 23, '#e0401e'); px(g, 11, 25, '#e0401e');
      } else {
        // block / rock: 윗면 16px + 앞면 12px
        rect(g, 0, 16, 16, 12, T.front);
        rect(g, 0, 16, 16, 1, shade(T.front, -0.3));
        rect(g, 0, 0, 16, 16, T.top);
        rect(g, 0, 0, 16, 1, T.hi); rect(g, 0, 0, 1, 16, T.hi);
        rect(g, 15, 0, 1, 16, T.mid); rect(g, 0, 15, 16, 1, T.mid);
        if (T.wall === 'block') {
          rect(g, 0, 21, 16, 1, shade(T.front, -0.25)); rect(g, 7, 16, 1, 5, shade(T.front, -0.25)); rect(g, 3, 22, 1, 6, shade(T.front, -0.25)); rect(g, 12, 22, 1, 6, shade(T.front, -0.25));
          if (v === 2) { rect(g, 4, 4, 5, 5, T.mid); }
        } else {
          for (let i = 0; i < 5; i++) px(g, 2 + ((rnd() * 12) | 0), 2 + ((rnd() * 12) | 0), T.mid);
          px(g, 3 + ((rnd() * 10) | 0), 20 + ((rnd() * 6) | 0), T.hi);
          if (v === 1 && theme === 'mine') { rect(g, 6, 20, 2, 2, '#ffd040'); rect(g, 10, 23, 1, 1, '#ffd040'); }
        }
      }
      return c;
    });
  };

  S.gate = function (theme) {
    return get('gate:' + theme, () => {
      const c = mk(16, 28), g = c.getContext('2d');
      rect(g, 0, 4, 16, 24, '#1a1420');
      for (let x = 1; x < 16; x += 3) rect(g, x, 4, 2, 24, '#8a8e98');
      rect(g, 0, 8, 16, 2, '#6a6e78'); rect(g, 0, 18, 16, 2, '#6a6e78');
      rect(g, 0, 2, 16, 3, '#c9a040'); rect(g, 6, 12, 4, 4, '#c9a040'); px(g, 7, 13, '#1a1420');
      return c;
    });
  };

  S.vine = function (hp) {
    return get('vine:' + hp, () => {
      const c = mk(16, 28), g = c.getContext('2d');
      const rnd = seeded(hp * 19 + 3);
      const n = 10 + hp * 8;
      for (let i = 0; i < n; i++) {
        const x = (rnd() * 14) | 0, y = 4 + ((rnd() * 22) | 0);
        rect(g, x, y, 2, 3, i % 3 === 0 ? '#2d6a2a' : i % 3 === 1 ? '#4a9a3a' : '#1f4a1e');
      }
      for (let i = 0; i < 4; i++) px(g, (rnd() * 16) | 0, 4 + ((rnd() * 22) | 0), '#c83a6a');
      return c;
    });
  };

  S.chest = function (open) {
    return get('chest:' + open, () => outlined(14, 11, (g) => {
      if (open) { rect(g, 0, 0, 14, 3, '#5a3a1e'); rect(g, 1, 1, 12, 2, '#1a1010'); }
      else { rect(g, 0, 0, 14, 5, '#9a6a34'); rect(g, 0, 0, 14, 1, '#c08a4a'); }
      rect(g, 0, 4, 14, 7, '#7a5226'); rect(g, 0, 4, 14, 1, '#c9a040');
      rect(g, 6, 3, 2, 3, '#e8c850');
      if (open) { rect(g, 3, 2, 2, 2, '#ffe86a'); px(g, 8, 1, '#ffffff'); }
    }));
  };

  S.house = function (variant) {
    return get('house:' + variant, () => {
      const roofs = ['#b33a3a', '#3a5ab3', '#6a4a8a', '#3a8a5a', '#b37a2a'];
      const roof = roofs[variant % roofs.length];
      const c = mk(64, 60), g = c.getContext('2d');
      g.globalAlpha = 0.3; rect(g, 2, 56, 62, 4, '#000'); g.globalAlpha = 1;
      rect(g, 4, 26, 56, 32, '#e8d8b8'); rect(g, 4, 26, 56, 2, '#c8b898');
      for (let y = 30; y < 58; y += 6) rect(g, 4, y, 56, 1, '#d8c8a8');
      rect(g, 4, 26, 2, 32, '#8a6a4a'); rect(g, 58, 26, 2, 32, '#8a6a4a');
      for (let i = 0; i < 22; i++) rect(g, i + 1, 24 - i, 62 - i * 2, 2, i % 4 === 0 ? shade(roof, -0.25) : roof);
      rect(g, 0, 24, 64, 3, shade(roof, -0.35));
      rect(g, 27, 42, 10, 16, '#6a4424'); rect(g, 27, 42, 10, 1, '#4a2e18'); px(g, 34, 50, '#e8c850');
      rect(g, 11, 36, 9, 8, '#4a3a2a'); rect(g, 12, 37, 7, 6, '#9ad8ff'); rect(g, 15, 37, 1, 6, '#4a3a2a');
      rect(g, 44, 36, 9, 8, '#4a3a2a'); rect(g, 45, 37, 7, 6, '#9ad8ff'); rect(g, 48, 37, 1, 6, '#4a3a2a');
      rect(g, 46, 2, 6, 10, '#8a5a3a');
      return c;
    });
  };

  S.fountain = function (f) {
    return get('fountain:' + (f % 2), () => {
      const c = mk(34, 36), g = c.getContext('2d');
      ell(g, 17, 26, 16, 9, '#6a6a78'); ell(g, 17, 25, 14, 7.5, '#3a7ad8'); ell(g, 13, 23, 4, 2, '#7ab0f0');
      rect(g, 14, 8, 6, 18, '#8a8a98'); rect(g, 14, 8, 2, 18, '#aaaab8');
      ell(g, 17, 9, 7, 3, '#8a8a98'); ell(g, 17, 8, 5, 2, '#3a7ad8');
      const d = f % 2;
      rect(g, 16, 0 + d, 2, 6, '#bfe0ff'); px(g, 12, 5 + d, '#bfe0ff'); px(g, 22, 4 + d, '#bfe0ff'); px(g, 10, 18 - d, '#ffffff'); px(g, 24, 20 + d, '#ffffff');
      return c;
    });
  };

  S.sign = function () {
    return get('sign', () => outlined(14, 16, (g) => {
      rect(g, 6, 7, 2, 9, '#6a4424'); rect(g, 0, 1, 14, 7, '#9a6a34'); rect(g, 0, 1, 14, 1, '#c08a4a');
      rect(g, 2, 3, 10, 1, '#4a2e18'); rect(g, 2, 5, 7, 1, '#4a2e18');
    }));
  };

  // ─── 디자인 시트 아틀라스 (assets/sprites.png) ─────────
  // tools/extract_sprites.py 가 디자인 시트에서 잘라 만든 캐릭터/몬스터. 로드 전에는 절차적 도트로 대체한다
  const SH = R.SHEET;
  S.sheet = { img: null, white: null, ready: false };
  if (SH) {
    const img = new Image();
    img.onload = () => {
      const w = mk(img.width, img.height), g = w.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w.width, w.height);
      S.sheet.img = img; S.sheet.white = w; S.sheet.ready = true;
      if (S.onSheetReady) S.onSheetReady();
    };
    img.src = SH.src;
  }
  S.frame = (key) => (S.sheet.ready && SH.frames[key]) || null;
  // UI용: 한 프레임만 잘라낸 캔버스 (로드 후에만 호출)
  S.frameCanvas = (key) => get('fc:' + key, () => {
    const f = SH.frames[key];
    const c = mk(f.w, f.h);
    c.getContext('2d').drawImage(S.sheet.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    return c;
  });

  // ─── 3x5 픽셀 숫자 폰트 ────────────────────────────────
  const FONT = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
    '+': '000010111010000', '-': '000000111000000', '!': '010010010000010', x: '000101010101000', ' ': '000000000000000',
  };
  S.num = function (g, str, x, y, color, sc = 1) {
    const w = str.length * 4 * sc - sc;
    let cx = Math.round(x - w / 2);
    y = Math.round(y);
    for (const ch of str) {
      const f = FONT[ch];
      if (f) {
        for (let i = 0; i < 15; i++) if (f[i] === '1') {
          const px_ = cx + (i % 3) * sc, py_ = y + ((i / 3) | 0) * sc;
          g.fillStyle = OUTLINE; g.fillRect(px_ - 1, py_ - 1, sc + 2, sc + 2);
        }
      }
      cx += 4 * sc;
    }
    cx = Math.round(x - w / 2);
    g.fillStyle = color;
    for (const ch of str) {
      const f = FONT[ch];
      if (f) for (let i = 0; i < 15; i++) if (f[i] === '1') g.fillRect(cx + (i % 3) * sc, y + ((i / 3) | 0) * sc, sc, sc);
      cx += 4 * sc;
    }
  };
})();
