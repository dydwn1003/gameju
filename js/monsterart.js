// ===== 몬스터 도트 (48x48, 한국 요괴·영물) =====
// 시트 행: 0 대기(6프레임: 숨쉬기·날갯짓·꼬리·깜빡임) · 1 공격(4프레임)
// 체형(arch) + 색(pal) + 장식(feat) + 단계(form: 크기·위엄)로 조합해 그립니다.
const MonArt = (() => {
  const W = 48, H = 48, GY = 46, P = Pixel;
  const SC = [0.68, 0.85, 1.0];
  const EYE = '#231a2e';

  function stateOf(anim, f) {
    if (anim === 'idle') return { ox: 0, bob: [0, 0, 1, 1, 1, 0][f], hov: [0, -1, -2, -2, -1, 0][f], wing: [0, 1, 2, 1, 0, -1][f], tail: [0, 1, 1, 0, -1, -1][f], blink: f === 4, mouth: 0, f };
    return { ox: [-2, 3, 4, 1][f], bob: 0, hov: [0, 0, -1, 0][f], wing: [2, -2, -1, 0][f], tail: [1, -1, 0, 0][f], blink: false, mouth: [0, 1, 1, 0][f], f, atk: true };
  }

  // ---------- 공통 도우미 ----------
  const part = (F, fn, opt) => F.paste(P.part(W, H, fn, opt));
  const dk = (c, a = 0.25) => P.tone(c, -a);
  const lt = (c, a = 0.3) => P.tone(c, a);

  function face(F, x, y, gap, s, st, o = {}) {
    x = Math.round(x); y = Math.round(y); gap = Math.round(gap);
    const ec = o.eye || EYE, mood = o.mood || 'cute';
    if (st.blink) { F.rect(x, y + 1, 2, 1, ec); F.rect(x + gap, y + 1, 2, 1, ec); }
    else if (mood === 'angry' || mood === 'fierce') {
      const pc = o.pupil || (mood === 'angry' ? '#ff3a3a' : '#ffd23f');
      for (const ex of [x, x + gap]) { F.set(ex, y, ec); F.set(ex + 1, y, pc); F.set(ex, y + 1, ec); F.set(ex + 1, y + 1, ec); }
      F.set(x - 1, y - 1, ec); F.set(x, y - 1, ec); F.set(x + gap + 1, y - 1, ec); F.set(x + gap + 2, y - 1, ec);
    } else if (mood === 'slit') {
      for (const ex of [x, x + gap]) { F.set(ex, y + 1, ec); F.set(ex + 1, y, ec); F.set(ex + 1, y + 1, o.pupil || '#ff6a3a'); }
    } else {
      const tall = s >= 0.84 ? 1 : 0;
      for (const ex of [x, x + gap]) {
        F.set(ex, y, '#ffffff'); F.set(ex + 1, y, ec); F.set(ex, y + 1, ec); F.set(ex + 1, y + 1, ec);
        if (tall) { F.set(ex, y + 2, ec); F.set(ex + 1, y + 2, '#4a3a6a'); }
      }
    }
    const my = y + (mood === 'cute' && s >= 0.84 ? 4 : 3), mx = x + Math.round(gap / 2) + 1;
    if (o.noMouth) return;
    if (st.mouth) { F.rect(mx - 1, my, 2, 2, '#5a1a2a'); F.set(mx - 1, my, '#ff8a9a'); }
    else if (o.fang) { F.set(mx - 1, my, '#5a1a2a'); F.set(mx, my, '#5a1a2a'); F.set(mx - 1, my + 1, '#ffffff'); }
    else F.set(mx, my, '#7a2a3a');
    if (!o.noBlush && mood === 'cute') { F.set(x - 1, y + 2 + (s >= 0.84 ? 1 : 0), '#ff9ab0'); F.set(x + gap + 2, y + 2 + (s >= 0.84 ? 1 : 0), '#ff9ab0'); }
  }
  function moodOf(d, form, enemy) {
    if (enemy) return 'angry';
    if (d.feat.includes('ears_fox') && form > 0) return 'slit';
    const ri = RARITY_ORDER.indexOf(d.r);
    return form === 2 && ri >= 2 ? 'fierce' : 'cute';
  }

  // ---------- 장식 (머리 기준) ----------
  function backDeco(F, d, A, s, st, form) {
    const { hx, hy, hr } = A, has = k => d.feat.includes(k), [m, b, a] = d.pal;
    part(F, L => {
      if (has('ears_fox') || has('ears_cat')) { L.poly([[hx - hr * 0.7, hy - hr * 0.3], [hx - hr * 0.55, hy - hr * 1.55], [hx - hr * 0.05, hy - hr * 0.7]], m); L.poly([[hx + hr * 0.1, hy - hr * 0.75], [hx + hr * 0.45, hy - hr * 1.6], [hx + hr * 0.75, hy - hr * 0.4]], m); }
      if (has('ears_round')) { L.ell(hx - hr * 0.6, hy - hr * 0.75, hr * 0.38, hr * 0.38, m); L.ell(hx + hr * 0.45, hy - hr * 0.85, hr * 0.38, hr * 0.38, m); }
      if (has('ears_long')) { L.ell(hx - hr * 0.5, hy - hr * 1.2, hr * 0.25, hr * 0.7, m); L.ell(hx + hr * 0.2, hy - hr * 1.3, hr * 0.25, hr * 0.7, m); }
      if (has('ears_dog')) { L.poly([[hx - hr * 0.8, hy - hr * 0.2], [hx - hr * 0.6, hy - hr * 1.3], [hx - hr * 0.1, hy - hr * 0.7]], m); L.poly([[hx + hr * 0.15, hy - hr * 0.8], [hx + hr * 0.5, hy - hr * 1.45], [hx + hr * 0.8, hy - hr * 0.45]], m); }
      if (has('ears_floppy')) { L.ell(hx - hr * 0.85, hy, hr * 0.32, hr * 0.7, dk(m, 0.15)); }
      if (has('ears_bat')) { L.poly([[hx - hr * 0.8, hy - hr * 0.2], [hx - hr * 1.2, hy - hr * 1.6], [hx - hr * 0.2, hy - hr * 0.8]], m); L.poly([[hx + hr * 0.2, hy - hr * 0.8], [hx + hr * 0.9, hy - hr * 1.7], [hx + hr * 0.8, hy - hr * 0.2]], m); }
      if (has('ears_tuft')) { L.poly([[hx - hr * 0.7, hy - hr * 0.6], [hx - hr * 0.9, hy - hr * 1.4], [hx - hr * 0.3, hy - hr * 0.9]], dk(m)); L.poly([[hx + hr * 0.3, hy - hr * 0.9], [hx + hr * 0.8, hy - hr * 1.4], [hx + hr * 0.7, hy - hr * 0.5]], dk(m)); }
      if (has('mane_curl') || has('mane_long') || has('shaggy')) {
        const n = 9, R = hr * (has('mane_long') ? 1.45 : 1.3), c = has('mane_curl') ? a : has('shaggy') ? lt(m, 0.1) : b;
        for (let i = 0; i < n; i++) { const t = Math.PI * 0.55 + (i / (n - 1)) * Math.PI * 1.25; L.ell(hx + Math.cos(t) * R * 0.8 - 1, hy + Math.sin(t) * R * 0.8, hr * 0.42, hr * 0.42, c); }
      }
      if (has('mane_wave')) for (let i = 0; i < 4; i++) L.poly([[hx - hr * 0.5 - i * 2, hy - hr * 0.5 + i * 3], [hx - hr * 1.5 - i * 2, hy - hr * 0.6 + i * 3 + st.tail], [hx - hr * 0.6 - i * 2, hy + i * 3 + 1]], a);
      if (has('crest')) for (let i = 0; i < 3; i++) L.poly([[hx - 1 + i, hy - hr * 0.8], [hx - 4 - i * 2, hy - hr * 1.6 - i * 2 + st.tail], [hx + i, hy - hr * 0.5]], i % 2 ? a : b);
    });
    if (has('horn1')) part(F, L => L.poly([[hx - hr * 0.15, hy - hr * 0.85], [hx + hr * 0.05, hy - hr * 1.55 - form], [hx + hr * 0.3, hy - hr * 0.8]], '#f4ecd8'));
    if (has('horns2') || has('horns_small')) part(F, L => {
      const hh = has('horns_small') ? 0.4 : 0.8 + form * 0.15;
      L.poly([[hx - hr * 0.6, hy - hr * 0.6], [hx - hr * 0.9, hy - hr * (1 + hh)], [hx - hr * 0.25, hy - hr * 0.85]], '#f4ecd8');
      L.poly([[hx + hr * 0.2, hy - hr * 0.85], [hx + hr * 0.6, hy - hr * (1.05 + hh)], [hx + hr * 0.6, hy - hr * 0.55]], '#f4ecd8');
    });
    if (has('horns_deer') || has('antlers') || has('antlers_small')) part(F, L => {
      const t = has('antlers_small') ? 0.6 : 1 + form * 0.2, c = has('horns_deer') ? '#f2c14e' : '#c9a15b';
      for (const sx of [-0.45, 0.25]) {
        const bx = hx + hr * sx, by = hy - hr * 0.8;
        L.line(bx, by, bx - 2 * t, by - 6 * t, c, 2); L.line(bx - 1 * t, by - 3 * t, bx - 4 * t, by - 4 * t, c); L.line(bx - 2 * t, by - 6 * t, bx - 1 * t, by - 9 * t, c);
        if (has('flowers')) { L.set(bx - 4 * t, by - 5 * t, '#ff8ab0'); L.set(bx - 1 * t, by - 9 * t, '#ffffff'); }
      }
    });
  }

  function frontDeco(F, d, A, s, st, form) {
    const { hx, hy, hr } = A, has = k => d.feat.includes(k), [m, b, a] = d.pal, top = hy - hr;
    if (has('flame') || has('foxfire_head')) part(F, L => {
      const k = 0.8 + form * 0.3, fl = st.f % 2;
      L.poly([[hx - 3 * k, top + 1], [hx - 2 * k, top - 5 * k - fl], [hx, top - 3 * k], [hx + 1 * k, top - 8 * k + fl], [hx + 3 * k, top - 3 * k], [hx + 3.5 * k, top + 1]], '#ff9a2a');
      L.poly([[hx - 1 * k, top], [hx, top - 4 * k + fl], [hx + 2 * k, top]], '#ffe66a');
    }, { hl: 0.2, dk: 0.1 });
    if (has('leaf') || has('leafhat')) part(F, L => {
      if (has('leafhat')) L.ell(hx, top + 1, hr * 0.9, hr * 0.35, '#3fa04a');
      else { L.poly([[hx, top + 1], [hx - 5, top - 3], [hx - 1, top - 2]], '#5ac85a'); L.poly([[hx, top + 1], [hx + 5, top - 4], [hx + 1, top - 2]], '#7ae06a'); }
    });
    if (has('acorn')) part(F, L => { L.ell(hx, top + 2, hr * 0.95, hr * 0.5, '#7a4a22', (x, y) => y <= top + 2); L.rect(hx, top - 3, 1, 3, '#5a3a1a'); });
    if (has('mushroom')) part(F, L => {
      L.ell(hx, top + 2, hr * 1.25, hr * 0.75, a, (x, y) => y <= top + 3);
      [[-0.5, -0.1], [0.3, -0.35], [0.8, 0.1]].forEach(([u, v]) => L.ell(hx + hr * u, top + hr * v, 1.4, 1.2, '#ffffff'));
    }, { hl: 0.15 });
    if (has('lotus')) part(F, L => { for (let i = -2; i <= 2; i++) L.ell(hx + i * 2.5, top + 1 - (2 - Math.abs(i)) * 1.5, 1.8, 3, i % 2 ? '#ffd0e0' : '#ff9ac0'); });
    if (has('icicle')) part(F, L => { for (let i = -2; i <= 2; i++) L.poly([[hx + i * 3 - 1, top + 2], [hx + i * 3, top - 4 - (i % 2 ? 0 : 2)], [hx + i * 3 + 1, top + 2]], '#e8f8ff'); });
    if (has('gat')) part(F, L => { L.rect(hx - hr * 1.5, top + 2, hr * 3, 2, '#1a1a22'); L.rect(hx - hr * 0.55, top - 4 - form, hr * 1.1, 6 + form, '#1a1a22'); }, { hl: 0.35 });
    if (has('gwanmo')) part(F, L => { L.rect(hx - hr * 0.8, top - 4, hr * 1.6, 5, '#2a2a34'); L.rect(hx - hr * 1.1, top, hr * 2.2, 2, '#2a2a34'); });
    if (has('helm')) part(F, L => { L.ell(hx, top + 3, hr * 0.95, hr * 0.6, '#b8c2d0', (x, y) => y <= top + 3); L.rect(hx, top - 4, 1, 3, '#d8463a'); });
    if (has('crown_small') || (form === 2 && RARITY_ORDER.indexOf(d.r) >= 4 && !has('gat'))) part(F, L => {
      const w = hr * 0.9;
      L.rect(hx - w / 2, top - 2, w, 3, '#f2c14e');
      for (let i = 0; i < 3; i++) L.rect(hx - w / 2 + i * (w / 2) - 0.5, top - 4, 1, 2, '#f2c14e');
    });
    if (has('whiskers')) { const c = has('crown_small') || d.r === 'SS' || d.r === 'SSS' ? '#f2c14e' : '#f4ecd8'; F.line(hx + hr * 0.8, hy + 2, hx + hr * 1.4 + 3, hy + 3 + st.tail, c); F.line(hx + hr * 0.8, hy + 3, hx + hr * 1.3 + 2, hy + 6 + st.tail, c); }
    if (has('tusks')) { F.set(hx + hr * 0.9, hy + hr * 0.5, '#fffaf0'); F.set(hx + hr * 0.9, hy + hr * 0.5 - 1, '#fffaf0'); }
    if (has('moonmark')) for (let i = -2; i <= 2; i++) F.set(A.cx + i, A.cy - A.ry * 0.5 + Math.abs(i) * 0.5, '#f4f0e6');
    if (has('mask')) for (let i = 0; i < 4; i++) { F.tint(hx + hr * 0.05 + i, hy - 1, '#3a2a2a'); F.tint(hx + hr * 0.05 + i, hy, '#3a2a2a'); }
    if (has('scar')) { F.tint(hx + 2, hy - 3, '#ffb0b0'); F.tint(hx + 3, hy - 2, '#ffb0b0'); F.tint(hx + 4, hy - 1, '#ffb0b0'); }
  }

  function bodyDeco(F, d, A, s, st) {
    const has = k => d.feat.includes(k), { cx, cy, rx, ry } = A, [m, b, a] = d.pal;
    if (has('spots')) [[-0.4, -0.4], [0.1, -0.6], [0.5, -0.2], [-0.1, 0]].forEach(([u, v]) => { F.tint(cx + rx * u, cy + ry * v, lt(m, 0.35)); F.tint(cx + rx * u + 1, cy + ry * v, lt(m, 0.35)); });
    if (has('stripes') || has('stripes_back')) for (let i = -2; i <= 2; i++) for (let j = 0; j < (has('stripes') ? 4 : 2); j++) F.tint(cx + i * rx * 0.33 + j * 0.3, cy - ry * 0.9 + j, a === '#2a1a1a' || a === '#2a2a3a' ? a : dk(m, 0.45));
    if (has('scales')) for (let x = cx - rx * 0.6; x < cx + rx * 0.6; x += 3) for (let y = cy - ry * 0.4; y < cy + ry * 0.3; y += 3) F.tint(x + ((y | 0) % 2), y, dk(m, 0.2));
    if (has('magma') || has('cracks')) { const c = has('magma') ? '#ffb02e' : dk(m, 0.4); [[-0.5, -0.3, 1, 1], [0.1, -0.5, 1, 2], [0.3, 0.1, -1, 1]].forEach(([u, v, dx, dy]) => { for (let i = 0; i < 3; i++) F.tint(cx + rx * u + dx * i, cy + ry * v + dy * i, c); }); }
    if (has('moss')) part(F, L => { L.ell(cx - rx * 0.3, cy - ry * 0.85, rx * 0.35, ry * 0.25, '#5ac05a'); L.ell(cx + rx * 0.3, cy - ry * 0.95, rx * 0.3, ry * 0.2, '#6fd06a'); });
    if (has('blood')) { F.tint(cx + 2, cy + 3, '#c8202a'); F.tint(cx + 2, cy + 4, '#c8202a'); }
    if (has('bones')) for (let i = 0; i < 3; i++) F.tint(cx - 2 + i * 2, cy - 1, dk(m, 0.5));
  }

  // 꼬리 (몸 뒤)
  function tail(F, d, x, y, s, st, form) {
    const has = k => d.feat.includes(k), [m, b, a] = d.pal, w = st.tail;
    if (has('tail_fox')) {
      const n = (d.tails || [1, 2, 3])[form];
      part(F, L => {
        for (let i = 0; i < n; i++) {
          const t = -0.2 + (n === 1 ? 0.5 : i / (n - 1)) * 1.4, len = 9 * s + (n > 3 ? 2 : 0);
          const ex = x - Math.cos(t) * len, ey = y - Math.sin(t) * len - 3 * s + w * (i % 2 ? 1 : -1);
          L.ell((x + ex) / 2, (y + ey) / 2, 4.2 * s, 2.6 * s, m);
          L.ell(ex, ey, 2.4 * s, 2.4 * s, i % 2 ? b : lt(m, 0.4));
        }
      });
      return;
    }
    part(F, L => {
      if (has('tail_big')) L.ell(x - 3 * s, y - 6 * s + w, 3.8 * s, 6 * s, m);
      else if (has('tail_ring')) { L.ell(x - 4 * s, y - 2 * s + w, 5 * s, 2.6 * s, m); for (let i = 0; i < 3; i++) L.rect(x - 7 * s + i * 3 * s, y - 4 * s + w, 1, 4 * s, a); }
      else if (has('tail_curl')) { L.ell(x - 2 * s, y - 5 * s, 3 * s, 3 * s, m); L.ell(x - 1 * s, y - 5 * s, 1.4 * s, 1.4 * s, null); }
      else if (has('tail_thin')) L.line(x, y, x - 8 * s, y - 3 * s + w, dk(m, 0.1));
      else if (has('tail_thick')) L.ell(x - 5 * s, y + 1 + w * 0.5, 6 * s, 2.2 * s, m);
      else L.ell(x - 2 * s, y - 2 * s + w * 0.5, 2.6 * s, 2 * s, m);
    });
    if (has('tail_curl')) F.set(x - 2 * s, y - 5 * s, b);
  }

  // ---------- 체형 ----------
  // 네발짐승 (여우·개·호랑이·사자개·말·멧돼지 등)
  function quad(F, d, s, st, form, o = {}) {
    const [m, b, a] = d.pal;
    const bodyRx = (o.brx || 9.5) * s, bodyRy = (o.bry || 6) * s, legH = (o.leg || 4.5) * s;
    const cx = 21 + st.ox, cy = GY - legH - bodyRy + 1 + st.bob * 0.5;
    const hr = (o.hr || 6.4) * s * (form === 0 ? 1.12 : 1);
    const hx = cx + bodyRx * (o.hxk || 0.85), hy = cy - bodyRy * (o.hyk || 0.95) - (o.neck || 0) * s + st.bob * 0.5 - (st.atk && st.f === 1 ? 1 : 0);
    tail(F, d, cx - bodyRx + 1, cy - 1, s, st, form);
    part(F, L => { // 뒷다리 (멀리)
      L.rect(cx - bodyRx * 0.55, GY - legH, 2.2 * s + 0.5, legH, dk(m, 0.2));
      L.rect(cx + bodyRx * 0.45, GY - legH, 2.2 * s + 0.5, legH, dk(m, 0.2));
    });
    part(F, L => {
      L.ell(cx, cy, bodyRx, bodyRy, m);
      L.ell(cx + 1, cy + bodyRy * 0.45, bodyRx * 0.6, bodyRy * 0.45, b);
      L.rect(cx - bodyRx * 0.75, GY - legH, 2.4 * s + 0.6, legH, m);
      L.rect(cx + bodyRx * 0.2 + (st.atk && st.f === 1 ? 2 : 0), GY - legH, 2.4 * s + 0.6, legH, m);
      if (o.neck) L.poly([[cx + bodyRx * 0.4, cy - bodyRy * 0.6], [hx - hr * 0.3, hy], [hx + hr * 0.2, hy + hr * 0.6], [cx + bodyRx * 0.8, cy]], m);
    });
    const A = { hx, hy, hr, cx, cy, rx: bodyRx, ry: bodyRy };
    bodyDeco(F, d, A, s, st);
    backDeco(F, d, A, s, st, form);
    part(F, L => {
      L.ell(hx, hy, hr * (o.hw || 1.05), hr, m);
      L.ell(hx + hr * 0.75, hy + hr * 0.3, hr * (o.snout || 0.45), hr * 0.38, b);
      if (d.feat.includes('mane_back')) for (let i = 0; i < 4; i++) L.poly([[cx - 4 + i * 4, cy - bodyRy + 1], [cx - 3 + i * 4, cy - bodyRy - 3], [cx - 1 + i * 4, cy - bodyRy + 1]], dk(m, 0.3));
      if (d.feat.includes('spikes')) for (let i = 0; i < 5; i++) L.poly([[cx - bodyRx * 0.7 + i * 4 * s, cy - bodyRy + 2], [cx - bodyRx * 0.6 + i * 4 * s, cy - bodyRy - 4 * s], [cx - bodyRx * 0.45 + i * 4 * s, cy - bodyRy + 2]], '#c8c8d0');
    });
    F.set(hx + hr * 1.15, hy + hr * 0.15, '#2a1d2a'); // 코
    if (d.feat.includes('ears_floppy')) part(F, L => L.ell(hx - hr * 0.55, hy - hr * 0.1, hr * 0.32, hr * 0.7, dk(m, 0.15)));
    frontDeco(F, d, A, s, st, form);
    return A;
  }

  // 두 발로 서는 몸 (곰·도깨비)
  function biped(F, d, s, st, form, o = {}) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k);
    const legH = (o.leg || 4) * s, bry = (o.bry || 8) * s, brx = (o.brx || 7.5) * s;
    const cx = 22 + st.ox, cy = GY - legH - bry + 2 + st.bob * 0.5;
    const hr = (o.hr || 7) * s * (form === 0 ? 1.12 : 1), hx = cx + 1.5 * s, hy = cy - bry - hr * 0.55 + st.bob * 0.5;
    if (has('cape')) part(F, L => L.poly([[cx - brx * 0.6, cy - bry * 0.8], [cx - brx * 1.6, GY + st.tail], [cx + brx * 0.2, GY], [cx + brx * 0.3, cy - bry * 0.8]], '#7a1a2a'));
    if (has('drums')) part(F, L => { for (let i = 0; i < 7; i++) { const t = Math.PI * (0.95 + i * 0.18); L.ell(cx + Math.cos(t) * 17 * s, cy - 6 * s + Math.sin(t) * 15 * s, 3 * s, 3 * s, '#c8463a'); } });
    part(F, L => { L.line(cx - brx * 0.85, cy - bry * 0.5, cx - brx * 1.15, cy + bry * 0.25, dk(m, 0.15), 2); }); // 뒷팔
    part(F, L => {
      const pc = has('tigerpants') ? '#f2a03a' : has('armor') ? '#8a96a8' : dk(m, 0.12);
      L.rect(cx - brx * 0.6, GY - legH, 3 * s + 0.5, legH, pc); L.rect(cx + brx * 0.15, GY - legH, 3 * s + 0.5, legH, pc);
    });
    if (has('tigerpants')) for (let i = 0; i < 3; i++) { F.tint(cx - brx * 0.5 + i, GY - legH + i, '#2a1a1a'); F.tint(cx + brx * 0.25 + i, GY - legH + 1 + i, '#2a1a1a'); }
    part(F, L => {
      L.ell(cx, cy, brx, bry, has('armor') ? '#b8c2d0' : m);
      L.ell(cx + 1, cy + bry * 0.2, brx * 0.6, bry * 0.55, has('armor') ? '#8a96a8' : b);
      if (has('tigerpants')) L.rect(cx - brx, cy + bry * 0.45, brx * 2, bry * 0.55, '#f2a03a');
    });
    if (has('tigerpants')) for (let x = cx - brx + 1; x < cx + brx; x += 3) F.tint(x, cy + bry * 0.6, '#2a1a1a');
    const A = { hx, hy, hr, cx, cy, rx: brx, ry: bry };
    bodyDeco(F, d, A, s, st);
    backDeco(F, d, A, s, st, form);
    part(F, L => L.ell(hx, hy, hr * 1.05, hr, m));
    if (d.arch === 'bear') part(F, L => L.ell(hx + hr * 0.65, hy + hr * 0.3, hr * 0.42, hr * 0.32, b));
    frontDeco(F, d, A, s, st, form);
    // 무기 + 앞팔
    const ax = cx + brx * 0.7 + (st.atk ? [0, 3, 4, 1][st.f] : 0), ay = cy - bry * 0.1;
    if (has('club') || has('club_gold') || has('spear')) part(F, L => {
      const ang = st.atk ? [110, 40, -10, 70][st.f] : 70, r = (ang * Math.PI) / 180, dx = Math.cos(r), dy = -Math.sin(r), len = (has('spear') ? 18 : 11) * s + 2;
      const c = has('club_gold') ? '#f2c14e' : has('spear') ? '#8a5a2b' : '#8a5a2b';
      L.line(ax - dx * 2, ay - dy * 2, ax + dx * len, ay + dy * len, c, 2);
      if (has('spear')) L.poly([[ax + dx * len - dy * 2, ay + dy * len + dx * 2], [ax + dx * (len + 5), ay + dy * (len + 5)], [ax + dx * len + dy * 2, ay + dy * len - dx * 2]], '#d8dce4');
      else { L.ell(ax + dx * (len - 1), ay + dy * (len - 1), 3 * s + 1, 3 * s + 1, c); for (let i = 0; i < 3; i++) L.set(ax + dx * (len - 3 + i * 2) + 2, ay + dy * (len - 3 + i * 2) - 1, '#f4ecd8'); }
    });
    part(F, L => { L.line(cx + brx * 0.4, cy - bry * 0.5, ax, ay, m, 2); L.ell(ax, ay, 1.8 * s + 0.5, 1.8 * s + 0.5, d.arch === 'bear' ? dk(m, 0.2) : b); });
    return A;
  }

  // 둥근 몸 (떡·송편·도토리·고드름·연꽃·독버섯)
  function blob(F, d, s, st, form) {
    const [m, b] = d.pal, rx = 10 * s + st.bob * 0.4, ry = 9 * s - st.bob * 0.5;
    const cx = 22 + st.ox, cy = GY - ry - 1;
    part(F, L => { L.ell(cx - 4 * s, GY - 1, 2.6 * s, 1.6, dk(m, 0.15)); L.ell(cx + 4 * s, GY - 1, 2.6 * s, 1.6, dk(m, 0.15)); });
    part(F, L => { L.ell(cx, cy, rx, ry, m); L.ell(cx + 1, cy + ry * 0.35, rx * 0.6, ry * 0.45, b); L.ell(cx - rx * 0.95, cy + 1, 1.8 * s, 2.2 * s, m); L.ell(cx + rx * 0.95, cy + 1, 1.8 * s, 2.2 * s, m); });
    const A = { hx: cx, hy: cy, hr: rx * 0.95, cx, cy, rx, ry };
    bodyDeco(F, d, A, s, st);
    frontDeco(F, d, { hx: cx, hy: cy - 1, hr: rx * 0.9, cx, cy, rx, ry }, s, st, form);
    A.face = [cx - 1 + 1 * s, cy - 1, 5 * s + 1];
    return A;
  }

  // 두꺼비·개구리
  function toad(F, d, s, st, form) {
    const [m, b, a] = d.pal, rx = 11 * s, ry = 7 * s - st.bob * 0.5, cx = 22 + st.ox, cy = GY - ry - 1;
    part(F, L => { L.ell(cx - rx * 0.8, GY - 2, 3.5 * s, 2.2 * s, dk(m, 0.15)); });
    part(F, L => {
      L.ell(cx, cy, rx, ry, m); L.ell(cx + 2, cy + ry * 0.4, rx * 0.65, ry * 0.45, b);
      L.ell(cx - 2 * s, cy - ry * 0.85, 3 * s, 3 * s, m); L.ell(cx + 5 * s, cy - ry * 0.95, 3 * s, 3 * s, m);
      L.ell(cx + rx * 0.6, GY - 2, 3.2 * s, 2 * s, m);
    });
    const A = { hx: cx + 1.5 * s, hy: cy - ry * 0.4, hr: rx * 0.6, cx, cy, rx, ry };
    bodyDeco(F, d, A, s, st);
    frontDeco(F, d, A, s, st, form);
    A.face = [cx - 3 * s, cy - ry * 0.95 - 1, 7 * s];
    // 큰 입
    const my = cy + 1;
    for (let x = cx - rx * 0.2; x < cx + rx * 0.75; x++) F.set(x, my + (st.mouth ? 1 : 0), dk(m, 0.55));
    if (d.feat.includes('coinmouth')) part(F, L => { L.ell(cx + rx * 0.75, my + 1, 2.6, 2.6, '#f2c14e'); });
    A.noMouth = true;
    return A;
  }

  // 새 (까치·참새·삼족오)
  function bird(F, d, s, st, form, o = {}) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k);
    const fly = o.fly, r = (o.r || 7.5) * s;
    const cx = 22 + st.ox, cy = fly ? GY - 15 * s + st.hov * 1.5 : GY - 3 * s - r + st.bob * 0.5;
    if (fly) F.paste(P.part(W, H, L => L.ell(22, GY - 1, 6 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    if (has('sun')) part(F, L => L.ell(cx - 2, cy - 2, r * 1.9, r * 1.9, '#ff8a2a'), { hl: 0.4 });
    part(F, L => { // 꼬리깃
      L.poly([[cx - r * 0.6, cy], [cx - r * 1.9, cy - r * 0.6 + st.tail], [cx - r * 1.8, cy + r * 0.3 + st.tail], [cx - r * 0.5, cy + r * 0.5]], dk(m, 0.1));
    });
    if (!fly) part(F, L => {
      const n = has('threelegs') ? 3 : 2;
      for (let i = 0; i < n; i++) { const lx = cx - 2 * s + i * 3 * s; L.line(lx, cy + r * 0.8, lx, GY - 1, '#e8a030'); L.line(lx, GY - 1, lx + 2, GY - 1, '#e8a030'); }
    });
    part(F, L => { L.ell(cx, cy, r * 1.05, r, m); L.ell(cx + 1, cy + r * 0.35, r * 0.65, r * 0.55, b); });
    part(F, L => L.poly([[cx + r * 0.85, cy - r * 0.35], [cx + r * 1.65, cy - r * 0.05], [cx + r * 0.85, cy + r * 0.15]], '#f2a83a'));
    part(F, L => { // 날개
      const wy = cy - st.wing * (fly ? 1.5 : 0.5);
      if (fly) L.poly([[cx - r * 0.3, cy - r * 0.2], [cx - r * 1.6, wy - r * 1.4], [cx + r * 0.6, wy - r * 0.9], [cx + r * 0.4, cy]], dk(m, 0.05));
      else L.ell(cx - r * 0.2, cy + r * 0.05, r * 0.65, r * 0.45, dk(m, 0.08));
    });
    if (has('threelegs') && fly) part(F, L => { for (let i = 0; i < 3; i++) L.line(cx - 2 + i * 2, cy + r, cx - 3 + i * 2, cy + r + 4, '#e8a030'); });
    const A = { hx: cx + r * 0.2, hy: cy - r * 0.25, hr: r * 0.85, cx, cy, rx: r, ry: r };
    if (has('bolt')) part(F, L => { L.poly([[cx + 2, cy - r - 2], [cx - 1, cy - r - 7], [cx + 3, cy - r - 6], [cx, cy - r - 11]], '#ffe066'); });
    backDeco(F, d, A, s, st, form);
    frontDeco(F, d, A, s, st, form);
    A.face = [cx + r * 0.1, cy - r * 0.45, 4 * s + 1];
    A.small = true;
    return A;
  }

  function crane(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 20 + st.ox, cy = GY - 16 * s + st.bob * 0.5;
    part(F, L => { L.line(cx, cy + 4 * s, cx - 1, GY, '#2a2a34'); L.line(cx + 3 * s, cy + 4 * s, cx + 3 * s, GY, '#2a2a34'); });
    part(F, L => {
      L.ell(cx, cy, 8 * s, 5.5 * s, m);
      L.poly([[cx - 6 * s, cy - 2], [cx - 12 * s, cy + 1 + st.tail], [cx - 5 * s, cy + 3]], '#2a2a34');
    });
    const hx = cx + 7 * s + (st.atk ? [0, 3, 4, 1][st.f] : 0), hy = cy - 13 * s + st.bob * 0.5;
    part(F, L => { L.line(cx + 5 * s, cy - 2, hx, hy + 2, m, 2); L.ell(hx, hy, 3 * s + 0.5, 2.8 * s + 0.5, m); });
    part(F, L => L.poly([[hx + 2, hy - 1], [hx + 9 * s, hy + 1], [hx + 2, hy + 2]], '#3a3a3a'));
    F.set(hx, hy - 3 * s, a); F.set(hx + 1, hy - 3 * s, a); F.set(hx, hy - 3 * s - 1, a);
    part(F, L => L.ell(cx - 1, cy - 1 - st.wing * 0.5, 6 * s, 3.5 * s, lt(m, 0.05)));
    F.set(hx + 1, hy - 1, st.blink ? m : EYE);
    return { hx, hy, hr: 3 * s, cx, cy, rx: 8 * s, ry: 5.5 * s, faceDone: true };
  }

  function owl(F, d, s, st, form) {
    const [m, b, a] = d.pal, r = 9 * s, cx = 22 + st.ox, cy = GY - r - 1 + st.bob * 0.5;
    part(F, L => { L.ell(cx, cy, r, r * 1.05, m); L.ell(cx + 1, cy + r * 0.3, r * 0.6, r * 0.6, b); L.ell(cx - r * 0.75, cy + 1, r * 0.45, r * 0.75, dk(m, 0.1)); });
    const A = { hx: cx + 1, hy: cy - r * 0.35, hr: r * 0.85, cx, cy, rx: r, ry: r };
    backDeco(F, d, A, s, st, form);
    part(F, L => { L.ell(cx - 2 * s, cy - r * 0.35, 3.2 * s, 3.2 * s, b); L.ell(cx + 4 * s, cy - r * 0.35, 3.2 * s, 3.2 * s, b); }, { flat: true });
    for (const ex of [cx - 2 * s, cx + 4 * s]) { if (st.blink) F.rect(ex - 1, cy - r * 0.35, 3, 1, EYE); else { F.ell(ex, cy - r * 0.35, 2, 2, a); F.set(ex, cy - r * 0.35, EYE); F.set(ex - 1, cy - r * 0.35 - 1, '#ffffff'); } }
    part(F, L => L.poly([[cx + 1, cy - r * 0.1], [cx + 3, cy - r * 0.1], [cx + 2, cy + r * 0.15]], '#f2a83a'));
    A.faceDone = true;
    return A;
  }

  // 날아다니는 박쥐·곤충·봉황
  function bat(F, d, s, st, form) {
    const [m, b] = d.pal, r = 6.5 * s, cx = 22 + st.ox, cy = GY - 16 * s + st.hov * 1.5;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 6 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    part(F, L => {
      const wy = st.wing * 2;
      for (const sx of [-1, 1]) L.poly([[cx + sx * r * 0.6, cy - 2], [cx + sx * r * 2.6, cy - r * 1.2 - wy], [cx + sx * r * 2.3, cy + r * 0.2 - wy * 0.3], [cx + sx * r * 1.7, cy - wy * 0.2], [cx + sx * r * 1.3, cy + r * 0.7], [cx + sx * r * 0.5, cy + 2]], dk(m, 0.12));
    });
    part(F, L => { L.ell(cx, cy, r, r, m); L.ell(cx + 1, cy + r * 0.35, r * 0.55, r * 0.45, b); });
    const A = { hx: cx, hy: cy - 1, hr: r, cx, cy, rx: r, ry: r };
    backDeco(F, d, A, s, st, form);
    frontDeco(F, d, A, s, st, form);
    A.face = [cx - 2 * s, cy - 2, 4 * s + 1]; A.fang = true;
    return A;
  }

  function insect(F, d, s, st, form) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k), r = 5.5 * s, cx = 22 + st.ox, cy = GY - 15 * s + st.hov * 1.5;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 5 * s, 1.2, '#00000030'), { flat: true, noOutline: true }));
    part(F, L => {
      const wy = st.wing * 1.5;
      if (has('butterfly')) {
        L.ell(cx - r * 1.4, cy - r * 1.1 - wy, r * 1.3, r * 1.25, m); L.ell(cx - r * 1.2, cy + r * 0.7 - wy * 0.4, r * 0.9, r * 0.8, lt(m, 0.15));
        L.ell(cx - r * 1.5, cy - r * 1.1 - wy, r * 0.5, r * 0.5, a);
      } else { L.ell(cx - r * 0.9, cy - r * 1.3 - wy, r * 0.9, r * 1.2, '#e8f4ffc0'); L.ell(cx + r * 0.2, cy - r * 1.4 - wy, r * 0.8, r * 1.1, '#e8f4ffc0'); }
    }, { hl: 0.15 });
    if (has('glowtail')) part(F, L => L.ell(cx - r * 1.1, cy + r * 0.4, r * 0.9, r * 0.8, st.f % 2 ? '#fff9a0' : '#ffef6a'), { hl: 0.2 });
    part(F, L => { L.ell(cx, cy, r * 1.05, r, has('butterfly') ? dk(a, 0.1) : m); L.ell(cx + 1, cy + r * 0.3, r * 0.6, r * 0.45, b); });
    part(F, L => { L.line(cx + 1, cy - r, cx - 1, cy - r - 4 * s, dk(m, 0.5)); L.line(cx + 3, cy - r, cx + 5, cy - r - 4 * s, dk(m, 0.5)); });
    if (form === 2 && has('glowtail')) for (let i = 0; i < 4; i++) F.set(cx - 10 + ((i * 7 + st.f * 3) % 20), cy - 8 + ((i * 5 + st.f) % 16), '#fff6a6');
    const A = { hx: cx, hy: cy, hr: r, cx, cy, rx: r, ry: r };
    A.face = [cx - 1, cy - 1, 3 * s + 1];
    return A;
  }

  function phoenix(F, d, s, st, form) {
    const [m, b, a] = d.pal, r = 6.5 * s, cx = 21 + st.ox, cy = GY - 17 * s + st.hov * 1.5;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 7 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    part(F, L => { for (let i = 0; i < 3; i++) L.poly([[cx - r * 0.5, cy + 1], [cx - r * (2.4 + i * 0.5), cy + r * (0.6 + i * 0.9) + st.tail], [cx - r * (1.8 + i * 0.4), cy + r * (1.2 + i * 0.9) + st.tail], [cx - r * 0.2, cy + 2]], i % 2 ? a : b); });
    part(F, L => { const wy = st.wing * 2; L.poly([[cx - r * 0.2, cy - 1], [cx - r * 2.4, cy - r * 2 - wy], [cx - r * 0.6, cy - r * 1.4 - wy], [cx + r * 1.2, cy - r * 1.8 - wy], [cx + r * 0.6, cy]], m); });
    part(F, L => { L.ell(cx, cy, r * 1.1, r * 0.95, m); L.ell(cx + 1, cy + r * 0.3, r * 0.6, r * 0.45, b); L.ell(cx + r * 0.9, cy - r * 0.9, r * 0.6, r * 0.6, m); });
    part(F, L => L.poly([[cx + r * 1.3, cy - r * 1.05], [cx + r * 2.1, cy - r * 0.8], [cx + r * 1.3, cy - r * 0.6]], '#f2c14e'));
    const A = { hx: cx + r * 0.9, hy: cy - r * 0.9, hr: r * 0.6, cx, cy, rx: r, ry: r };
    backDeco(F, d, A, s, st, form);
    if (form === 2) for (let i = 0; i < 5; i++) F.set(cx - 12 + ((i * 9 + st.f * 4) % 26), cy + 6 - ((i * 4 + st.f * 2) % 14), i % 2 ? '#ffd23f' : '#ff8a2a');
    F.set(A.hx + 1, A.hy - 1, st.blink ? m : EYE); F.set(A.hx + 1, A.hy, st.blink ? m : EYE);
    A.faceDone = true;
    return A;
  }

  // 물고기
  function fish(F, d, s, st, form) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k), rx = 10.5 * s, ry = 6.2 * s;
    const cx = 22 + st.ox, cy = GY - 12 * s + st.hov;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 7 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    part(F, L => {
      L.poly([[cx - rx * 0.8, cy], [cx - rx * 1.6, cy - ry * (has('finbig') ? 1.3 : 1) + st.tail], [cx - rx * 1.4, cy + st.tail * 0.5], [cx - rx * 1.6, cy + ry * (has('finbig') ? 1.3 : 1) + st.tail]], dk(m, 0.05));
      L.poly([[cx - rx * 0.3, cy - ry * 0.8], [cx, cy - ry * 1.6], [cx + rx * 0.3, cy - ry * 0.85]], dk(m, 0.05));
    });
    part(F, L => { L.ell(cx, cy, rx, ry, m); L.ell(cx + 1, cy + ry * 0.45, rx * 0.7, ry * 0.4, b); });
    if (has('koi')) [[-0.4, -0.3, 3, 2], [0.15, -0.5, 2, 2], [-0.1, 0.1, 3, 2]].forEach(([u, v, w, h]) => F.paste(P.part(W, H, L => L.ell(cx + rx * u, cy + ry * v, w * s, h * s, a), { flat: true, noOutline: true })));
    part(F, L => L.poly([[cx, cy + ry * 0.2], [cx - rx * 0.3, cy + ry * 1.2 + st.wing * 0.5], [cx + rx * 0.2, cy + ry * 0.4]], lt(m, 0.1)));
    if (has('lure')) part(F, L => { L.line(cx + rx * 0.4, cy - ry, cx + rx * 1.2, cy - ry * 2, '#6a5a4a'); L.ell(cx + rx * 1.2, cy - ry * 2, 1.5, 1.5, '#ffef6a'); });
    const A = { hx: cx + rx * 0.5, hy: cy - 1, hr: ry, cx, cy, rx, ry };
    bodyDeco(F, d, A, s, st);
    frontDeco(F, d, { hx: cx + rx * 0.5, hy: cy - 1, hr: ry * 0.9 }, s, st, form);
    if (has('teeth')) for (let i = 0; i < 4; i++) F.set(cx + rx * 0.55 + i, cy + 2 + (i % 2), '#ffffff');
    A.face = [cx + rx * 0.35, cy - ry * 0.45, 3 * s + 1];
    return A;
  }

  function crab(F, d, s, st, form) {
    const [m, b] = d.pal, rx = 10 * s, ry = 6 * s, cx = 22 + st.ox, cy = GY - 5 * s - ry + st.bob * 0.5;
    part(F, L => { for (let i = 0; i < 3; i++) { L.line(cx - rx * 0.4 + i * 2, cy + ry * 0.5, cx - rx * 1.1 + i * 2, GY - 1, dk(m, 0.2)); L.line(cx + rx * 0.4 - i * 2, cy + ry * 0.5, cx + rx * 1.1 - i * 2, GY - 1, dk(m, 0.2)); } });
    part(F, L => { L.line(cx - 3, cy - ry * 0.6, cx - 3, cy - ry - 4 * s, m, 1); L.line(cx + 3, cy - ry * 0.6, cx + 3, cy - ry - 4 * s, m, 1); L.ell(cx - 3, cy - ry - 4 * s, 1.8, 1.8, b); L.ell(cx + 3, cy - ry - 4 * s, 1.8, 1.8, b); });
    part(F, L => { L.ell(cx, cy, rx, ry, m); L.ell(cx, cy + ry * 0.4, rx * 0.65, ry * 0.4, b); });
    const cl = st.atk ? [0, 3, 4, 1][st.f] : st.wing * 0.5;
    part(F, L => { L.ell(cx + rx + 2 * s + cl, cy - ry - cl * 0.5, 4 * s, 3.4 * s, m); L.poly([[cx + rx + 2 * s + cl, cy - ry - cl * 0.5], [cx + rx + 7 * s + cl, cy - ry - 3 * s], [cx + rx + 5 * s + cl, cy - ry + 1]], null); L.ell(cx - rx - 1 * s, cy - ry * 0.6, 3 * s, 2.6 * s, m); });
    for (const ex of [cx - 3, cx + 3]) { F.set(ex, cy - ry - 4 * s, st.blink ? b : EYE); }
    return { hx: cx, hy: cy, hr: rx * 0.6, cx, cy, rx, ry, face: [cx - 3, cy - 2, 5], eyeless: true };
  }

  function octo(F, d, s, st, form) {
    const [m, b] = d.pal, r = 8 * s, cx = 22 + st.ox, cy = GY - 9 * s - r * 0.6 + st.hov * 0.5;
    part(F, L => {
      for (let i = 0; i < 5; i++) {
        const bx = cx - r * 0.8 + i * r * 0.4, ph = st.f + i;
        let px = bx, py = cy + r * 0.5;
        for (let k = 1; k <= 5; k++) { const nx = bx + Math.sin((ph + k) * 0.9) * 2 + (i - 2) * k * 0.4, ny = cy + r * 0.5 + k * 2.2 * s; L.line(px, py, nx, ny, m, 2); px = nx; py = ny; }
      }
    });
    part(F, L => { L.ell(cx, cy - r * 0.2, r, r * 0.95, m); L.ell(cx - r * 0.3, cy - r * 0.6, r * 0.3, r * 0.25, lt(m, 0.2)); });
    if (form === 2) for (let i = 0; i < 4; i++) F.tint(cx - r * 0.5 + i * 3, cy - r * 0.7 + (i % 2) * 3, b);
    return { hx: cx, hy: cy, hr: r, cx, cy, rx: r, ry: r, face: [cx - 1, cy - 1, 5 * s + 1] };
  }

  function jelly(F, d, s, st, form) {
    const [m, b, a] = d.pal, r = 8 * s, cx = 22 + st.ox, cy = GY - 16 * s + st.hov * 1.5;
    part(F, L => { for (let i = 0; i < 5; i++) { const bx = cx - r * 0.7 + i * r * 0.35; for (let k = 0; k < 10 * s; k++) L.set(bx + Math.round(Math.sin((st.f + k + i) * 0.8)), cy + 2 + k, i % 2 ? a : lt(m, 0.2)); } }, { noOutline: true, flat: true });
    part(F, L => { L.ell(cx, cy, r, r * 0.75, m, (x, y) => y <= cy + 2); }, { hl: 0.35 });
    F.paste(P.part(W, H, L => L.ell(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.2, '#ffffffa0'), { flat: true, noOutline: true }));
    return { hx: cx, hy: cy, hr: r, cx, cy, rx: r, ry: r, face: [cx - 1, cy - 2, 5 * s] };
  }

  // 혼불·유령
  function wisp(F, d, s, st, form) {
    const [m, b, a] = d.pal, r = 7 * s, cx = 22 + st.ox, cy = GY - 12 * s + st.hov * 1.5, fl = st.f % 2;
    part(F, L => {
      L.poly([[cx - r, cy], [cx - r * 0.6, cy - r * 1.3], [cx - r * 0.1, cy - r * 0.9], [cx + r * 0.2, cy - r * (2.1 + fl * 0.2)], [cx + r * 0.6, cy - r * 1.1], [cx + r, cy - r * 0.4], [cx + r, cy]], m);
      L.ell(cx, cy, r, r * 0.95, m);
    }, { hl: 0.25, dk: 0.15 });
    F.paste(P.part(W, H, L => { L.ell(cx, cy + 1, r * 0.6, r * 0.55, b); L.poly([[cx - 2, cy - r * 0.5], [cx + 1, cy - r * (1.3 + fl * 0.2)], [cx + 3, cy - r * 0.4]], b); }, { flat: true, noOutline: true }));
    return { hx: cx, hy: cy, hr: r, cx, cy, rx: r, ry: r, face: [cx - 2, cy - 1, 4 * s + 1] };
  }

  function ghost(F, d, s, st, form, o = {}) {
    const [m, b, a] = d.pal, r = 7.5 * s, cx = 22 + st.ox, cy = GY - 14 * s + st.hov * 1.5;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 6 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    if (o.lady) part(F, L => L.poly([[cx - r * 1.05, cy - r * 0.6], [cx - r * 1.3, cy + r * 2.3 + st.tail], [cx + r * 0.2, cy + r * 1.2], [cx + r * 0.9, cy - r * 0.6]], '#14141c'));
    part(F, L => {
      L.ell(cx, cy, r, r, m);
      const bot = cy + r * (o.lady ? 2.4 : 1.6);
      L.poly([[cx - r, cy], [cx + r, cy], [cx + r * 0.9, bot - 2], [cx + r * 0.4, bot + (st.f % 2)], [cx, bot - 2], [cx - r * 0.5, bot + ((st.f + 1) % 2)], [cx - r * 1.2, bot - 3 + st.tail]], m);
      L.ell(cx + r * 0.8, cy + r * 0.6 + st.wing * 0.4, r * 0.3, r * 0.4, m);
    }, { hl: 0.2 });
    if (o.lady) part(F, L => { L.ell(cx - 1, cy - r * 0.15, r * 1.02, r * 0.95, '#14141c', (x, y) => x < cx + r * 0.1 || y < cy - r * 0.45); L.rect(cx - r, cy - r * 0.2, 3, r * 1.6, '#14141c'); });
    if (d.feat.includes('seaweed')) part(F, L => { L.line(cx - r * 0.8, cy - r * 0.8, cx - r * 1.1, cy + r * 0.4, '#3a8a4a', 2); L.line(cx + r * 0.3, cy - r, cx + r * 0.7, cy - r * 1.4, '#3a8a4a'); });
    const A = { hx: cx, hy: cy, hr: r, cx, cy, rx: r, ry: r };
    bodyDeco(F, d, A, s, st);
    if (o.lady) { A.face = [cx + r * 0.25, cy - 1, 99]; A.oneEye = true; }
    else A.face = [cx - 1, cy - 1, 5 * s + 1];
    frontDeco(F, d, A, s, st, form);
    return A;
  }

  function egghost(F, d, s, st, form) {
    const A = ghost(F, d, s, st, form);
    // 얼굴 없음: 매끈한 달걀 얼굴
    F.paste(P.part(W, H, L => L.ell(A.cx + 1, A.cy - 1, A.hr * 0.75, A.hr * 0.85, '#ffffff'), { hl: 0.1 }));
    A.faceDone = true;
    if (st.atk && st.mouth) F.rect(A.cx + 1, A.cy + 1, 2, 2, '#1a1a24');
    return A;
  }

  function reaper(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 22 + st.ox, top = GY - 30 * s + st.hov, hr = 5.5 * s;
    F.paste(P.part(W, H, L => L.ell(22, GY - 1, 7 * s, 1.4, '#00000040'), { flat: true, noOutline: true }));
    part(F, L => L.poly([[cx - 4 * s, top + 9 * s], [cx + 5 * s, top + 9 * s], [cx + 9 * s, GY - 2 + st.tail * 0.5], [cx + 2 * s, GY - 4], [cx - 3 * s, GY - 1], [cx - 10 * s, GY - 3 - st.tail]], m));
    for (let y = top + 11 * s; y < GY - 4; y += 4) F.tint(cx - 1, y, b);
    part(F, L => { L.line(cx + 4 * s, top + 11 * s, cx + 8 * s + (st.atk ? [0, 3, 4, 1][st.f] : 0), top + 17 * s, m, 2); });
    part(F, L => L.ell(cx + 1, top + 4 * s, hr, hr * 1.05, '#e8e4ec'));
    const A = { hx: cx + 1, hy: top + 4 * s, hr, cx, cy: top + 18 * s, rx: 7 * s, ry: 12 * s };
    frontDeco(F, d, A, s, st, form);
    if (form === 2 || d.r === 'SSS') for (let i = 0; i < 4; i++) F.set(cx - 12 + ((i * 8 + st.f * 3) % 26), top + 6 + ((i * 7 + st.f * 2) % 26), '#7ad8ff');
    A.face = [cx - 1, top + 4 * s, 4]; A.mood = 'fierce';
    return A;
  }

  function shadow(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 22 + st.ox, hgt = 30 * s, w = 9 * s;
    part(F, L => {
      L.ell(cx, GY - hgt + w, w, w, m);
      L.poly([[cx - w, GY - hgt + w], [cx + w, GY - hgt + w], [cx + w * 1.4, GY - 1], [cx - w * 1.4, GY - 1]], m);
    }, { hl: 0.12, oc: '#0a0812' });
    for (let i = 0; i < 6; i++) F.set(cx - w * 1.6 + ((i * 7 + st.f * 2) % (w * 3.2)), GY - 4 - ((i * 5 + st.f) % (hgt * 0.8)), '#4a3a6a');
    const ey = GY - hgt + w - 1;
    for (const ex of [cx - 1, cx + 4]) { F.set(ex, ey, st.blink ? m : a); F.set(ex + 1, ey, st.blink ? m : a); }
    if (st.mouth) F.rect(cx, ey + 4, 4, 2, '#0a0812');
    return { hx: cx, hy: ey, hr: w, cx, cy: GY - hgt / 2, rx: w, ry: hgt / 2, faceDone: true };
  }

  // 거북·현무
  function turtle(F, d, s, st, form) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k), rx = 11 * s, ry = 7.5 * s, cx = 21 + st.ox, cy = GY - 3 * s - ry * 0.6 + st.bob * 0.4;
    if (has('snaketail')) part(F, L => { let px = cx - rx, py = cy; for (let k = 1; k <= 6; k++) { const nx = cx - rx - k * 2 * s, ny = cy - k * 3 * s + Math.sin(k + st.f) * 2; L.line(px, py, nx, ny, a, 2); px = nx; py = ny; } L.ell(px, py - 1, 2.6 * s, 2 * s, a); });
    const hx = cx + rx * 1.05 + (st.atk ? [0, 2, 3, 1][st.f] : 0), hy = cy - 1;
    part(F, L => { L.rect(cx - rx * 0.7, GY - 4 * s, 3 * s, 4 * s, b); L.rect(cx + rx * 0.4, GY - 4 * s, 3 * s, 4 * s, b); L.ell(hx, hy, 4.5 * s, 4 * s, b); L.rect(cx + rx * 0.6, hy - 1, rx * 0.5, 4 * s, b); });
    part(F, L => { L.ell(cx, cy, rx, ry, m, (x, y) => y <= cy + ry * 0.35); L.rect(cx - rx, cy + ry * 0.3, rx * 2, 2, dk(m, 0.2)); });
    for (const [u, v] of [[-0.4, -0.2], [0.2, -0.45], [0.35, 0.05], [-0.1, 0.05]]) F.tint(cx + rx * u, cy + ry * v, a);
    const A = { hx, hy, hr: 4 * s, cx, cy, rx, ry };
    if (has('crown_small') || form === 2 && RARITY_ORDER.indexOf(d.r) >= 4) frontDeco(F, d, A, s, st, form);
    if (has('whiskers') && !has('crown_small')) frontDeco(F, d, A, s, st, form);
    A.face = [hx - 1, hy - 2, 3]; A.small = true;
    return A;
  }

  // 뱀·이무기·용
  function serpent(F, d, s, st, form, o = {}) {
    const [m, b, a] = d.pal, has = k => d.feat.includes(k), th = (o.dragon ? 3.6 : 3.2) * s;
    const fly = o.dragon, baseY = fly ? GY - 12 * s + st.hov * 1.5 : GY - th - 1;
    const pts = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([4 + t * 30 * s + st.ox * t, baseY - Math.sin(t * Math.PI * 1.6 + st.f * 0.5) * 4 * s - t * (fly ? 6 : 10) * s]); }
    if (fly) F.paste(P.part(W, H, L => L.ell(22, GY - 1, 9 * s, 1.4, '#00000030'), { flat: true, noOutline: true }));
    part(F, L => {
      pts.forEach(([x, y], i) => L.ell(x, y, th * (0.55 + (i / 14) * 0.5), th * (0.55 + (i / 14) * 0.5), m));
      if (fly) { [3, 9].forEach(i => { const [x, y] = pts[i]; L.line(x, y + th * 0.5, x + 1, y + th + 3 * s, dk(m, 0.1), 2); L.line(x + 1, y + th + 3 * s, x + 3, y + th + 3 * s, '#f4ecd8'); }); }
    });
    for (let i = 2; i < 14; i++) { const [x, y] = pts[i]; F.tint(x, y + th * 0.5, b); F.tint(x + 1, y + th * 0.5, b); if (has('scales') && i % 2) F.tint(x, y - th * 0.3, dk(m, 0.25)); }
    if (has('mane_wave') && fly) for (let i = 2; i < 13; i += 2) { const [x, y] = pts[i]; F.paste(P.part(W, H, L => L.poly([[x - 1, y - th * 0.7], [x - 3, y - th * 1.8 + st.tail], [x + 1, y - th * 0.8]], a))); }
    const [lx, ly] = pts[14], hr = (fly ? 5.5 : 5) * s;
    const hx = lx + 2 * s, hy = ly - 2 * s;
    const A = { hx, hy, hr, cx: 20, cy: baseY - 4, rx: 12 * s, ry: 6 * s };
    backDeco(F, d, A, s, st, form);
    part(F, L => { L.ell(hx, hy, hr * 1.15, hr, m); L.ell(hx + hr * 0.9, hy + hr * 0.3, hr * 0.6, hr * 0.42, b); });
    frontDeco(F, d, A, s, st, form);
    if (has('pearl')) part(F, L => L.ell(hx + hr * 2.2, hy + hr * 1.6 + st.hov * 0.5, 2.6, 2.6, '#ff5a6a'), { hl: 0.5 });
    A.face = [hx - 1, hy - 2, 4 * s + 1]; A.small = true;
    return A;
  }

  function centipede(F, d, s, st, form) {
    const [m, b, a] = d.pal, n = 7 + form * 2, r = 3.2 * s;
    let last;
    for (let i = 0; i < n; i++) {
      const x = 6 + i * 3.6 * s + st.ox * (i / n), y = GY - r - 1 - Math.max(0, i - n + 3) * 3 * s + Math.sin(i + st.f) * 0.6;
      part(F, L => { L.line(x, y, x - 1, GY - 1, b); L.ell(x, y, r, r, i % 2 ? m : dk(m, 0.1)); });
      last = [x, y];
    }
    const [hx, hy] = last;
    part(F, L => { L.line(hx + 2, hy - r, hx + 5, hy - r - 5, a); L.line(hx, hy - r, hx - 1, hy - r - 5, a); L.ell(hx + 2, hy, r * 1.3, r * 1.2, a); });
    return { hx: hx + 2, hy, hr: r, cx: 22, cy: GY - 6, rx: 16, ry: 4, face: [hx + 1, hy - 1, 3], fang: true, small: true };
  }

  function golem(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 22 + st.ox, w = 13 * s, h = 14 * s, by = GY - 5 * s - h + st.bob * 0.5;
    if (d.feat.includes('drums')) part(F, L => { for (let i = 0; i < 7; i++) { const t = Math.PI * (0.95 + i * 0.18); L.ell(cx + Math.cos(t) * 19 * s, by + 6 * s + Math.sin(t) * 16 * s, 3.2 * s, 3.2 * s, '#c8463a'); } });
    part(F, L => { L.rect(cx - w * 0.5, GY - 5 * s, 5 * s, 5 * s, dk(m, 0.15)); L.rect(cx + w * 0.15, GY - 5 * s, 5 * s, 5 * s, dk(m, 0.15)); L.rect(cx - w * 0.95, by + 2, 5 * s, 10 * s, dk(m, 0.1)); });
    part(F, L => { L.rect(cx - w * 0.75, by, w * 1.5, h, m); L.rect(cx - w * 0.35, by - 7 * s, w * 0.75, 8 * s, m); });
    const ax = cx + w * 0.75 + (st.atk ? [0, 3, 4, 1][st.f] : 0);
    part(F, L => L.rect(ax - 2 * s, by + 2, 5.5 * s, 11 * s, m));
    bodyDeco(F, d, { cx, cy: by + h / 2, rx: w * 0.75, ry: h / 2 }, s, st);
    return { hx: cx, hy: by - 3 * s, hr: 4 * s, cx, cy: by + h / 2, rx: w, ry: h, face: [cx - 2 * s, by - 4 * s, 4 * s], mood: 'angry' };
  }

  function cloud(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 22 + st.ox, cy = GY - 14 * s + st.hov * 1.5;
    part(F, L => { [[-7, 2, 5], [-2, -2, 6.5], [5, 0, 5.5], [9, 3, 4], [0, 4, 6]].forEach(([u, v, r]) => L.ell(cx + u * s, cy + v * s, r * s, r * s * 0.9, m)); }, { hl: 0.2 });
    if (d.feat.includes('bolt') || form > 0) part(F, L => { const x = cx + 2 * s; L.poly([[x, cy + 6 * s], [x - 3, cy + 11 * s], [x + 1, cy + 11 * s], [x - 2, cy + 17 * s], [x + 4, cy + 9 * s], [x, cy + 9 * s], [x + 2, cy + 6 * s]], a); });
    return { hx: cx, hy: cy, hr: 6 * s, cx, cy, rx: 10 * s, ry: 6 * s, face: [cx - 2, cy - 1, 5 * s + 1] };
  }

  // ---------- 물건 요괴 ----------
  function obj(F, d, s, st, form) {
    const [m, b, a] = d.pal, cx = 22 + st.ox, k = d.arch;
    const fl = st.hov * (k === 'lantern' || k === 'mask' || k === 'fan' || k === 'coin' ? 1.5 : 0);
    let A = { cx, cy: GY - 10 * s, hx: cx, hy: GY - 10 * s, hr: 8 * s, rx: 9 * s, ry: 9 * s };
    if (k === 'shoe') {
      const cy = GY - 5 * s - st.bob * 0.5;
      part(F, L => { L.poly([[cx - 12 * s, cy + 2 * s], [cx + 10 * s, cy + 3 * s], [cx + 13 * s, cy - 3 * s], [cx + 6 * s, cy - 5 * s], [cx - 9 * s, cy - 4 * s]], m); });
      for (let x = cx - 10 * s; x < cx + 10 * s; x += 2) F.tint(x, cy - 1 + ((x | 0) % 2), dk(m, 0.2));
      part(F, L => L.line(cx - 6 * s, cy - 4 * s, cx + 4 * s, cy - 8 * s, a));
      A = { cx, cy, hx: cx + 4 * s, hy: cy - 1, hr: 6 * s, rx: 12 * s, ry: 4 * s, face: [cx + 2 * s, cy - 2, 4 * s] };
    } else if (k === 'broom') {
      const by = GY - 9 * s - st.bob * 0.5;
      part(F, L => L.line(cx - 2 * s, by - 2, cx - 9 * s, by - 16 * s + st.tail, b, 2));
      part(F, L => { L.poly([[cx - 5 * s, by - 3 * s], [cx + 5 * s, by - 3 * s], [cx + 9 * s, GY - 1], [cx - 9 * s, GY - 1]], m); L.rect(cx - 5 * s, by - 3 * s, 10 * s, 2, a); });
      for (let x = cx - 8 * s; x < cx + 8 * s; x += 2) F.tint(x, GY - 2, dk(m, 0.25));
      A = { cx, cy: by + 3 * s, hx: cx, hy: by, hr: 6 * s, rx: 8 * s, ry: 6 * s, face: [cx - 2 * s, by + 1 * s, 4 * s + 1] };
    } else if (k === 'jar' || k === 'millstone') {
      const ry = 9 * s - st.bob * 0.4, cy = GY - ry - 1;
      if (k === 'millstone') {
        part(F, L => { L.ell(cx, cy + 3 * s, 11 * s, 5 * s, m); L.rect(cx - 11 * s, cy - 3 * s, 22 * s, 6 * s, m); L.ell(cx, cy - 3 * s, 11 * s, 4 * s, b); });
        part(F, L => { L.rect(cx + 8 * s, cy - 10 * s, 2, 7 * s, a); L.rect(cx + 8 * s, cy - 10 * s, 5 * s, 2, a); });
        A = { cx, cy, hx: cx, hy: cy, hr: 9 * s, rx: 11 * s, ry, face: [cx - 2 * s, cy + 1, 5 * s] };
      } else {
        part(F, L => { L.ell(cx, cy, 10 * s, ry, m); L.rect(cx - 6 * s, cy - ry - 1, 12 * s, 3 * s, dk(m, 0.1)); L.ell(cx, cy + ry * 0.2, 8 * s, ry * 0.5, b); });
        if (d.feat.includes('lid')) part(F, L => { L.ell(cx, cy - ry - 1, 7.5 * s, 2.4 * s, dk(m, 0.2)); L.rect(cx - 1, cy - ry - 4 * s, 3, 2, dk(m, 0.35)); });
        if (d.feat.includes('coals')) part(F, L => { for (let i = -2; i <= 2; i++) L.ell(cx + i * 3 * s, cy - ry - 1 - (st.f + i) % 2, 1.6 * s + 0.5, 1.6 * s + 0.5, i % 2 ? '#ff7a2a' : '#ffd23f'); }, { hl: 0.3 });
        F.tint(cx - 6 * s, cy - 2, a); F.tint(cx - 5 * s, cy - 3, a); F.tint(cx - 4 * s, cy - 2, a);
        A = { cx, cy, hx: cx, hy: cy - ry + 1, hr: 7 * s, rx: 10 * s, ry, face: [cx - 1, cy - 2, 5 * s + 1] };
      }
    } else if (k === 'lantern') {
      const cy = GY - 15 * s + fl;
      F.paste(P.part(W, H, L => L.ell(22, GY - 1, 5 * s, 1.2, '#00000030'), { flat: true, noOutline: true }));
      part(F, L => { L.rect(cx - 1, cy - 12 * s, 2, 3 * s, '#3a2a1a'); L.rect(cx - 7 * s, cy - 9 * s, 14 * s, 2, '#3a2a1a'); });
      part(F, L => { L.ell(cx, cy, 7 * s, 8 * s, m); L.rect(cx - 7 * s, cy - 2 * s, 14 * s, 4 * s, b); }, { hl: 0.35 });
      F.paste(P.part(W, H, L => L.ell(cx, cy, 4 * s, 5 * s, st.f % 2 ? '#fff6c0a0' : '#ffef9aa0'), { flat: true, noOutline: true }));
      if (d.feat.includes('tassel')) part(F, L => L.line(cx, cy + 8 * s, cx + st.tail, cy + 13 * s, '#d8463a', 2));
      A = { cx, cy, hx: cx, hy: cy - 8 * s, hr: 5 * s, rx: 7 * s, ry: 8 * s, face: [cx - 2, cy - 2, 4 * s + 1] };
      frontDeco(F, Object.assign({}, d, { feat: d.feat.filter(f => f === 'flame') }), { hx: cx, hy: cy - 5 * s, hr: 3 * s }, s * 0.7, st, form);
      return A;
    } else if (k === 'coin') {
      const cy = GY - 12 * s + fl;
      F.paste(P.part(W, H, L => L.ell(22, GY - 1, 6 * s, 1.2, '#00000030'), { flat: true, noOutline: true }));
      part(F, L => { L.ell(cx, cy, 9 * s, 9 * s, m); }, { hl: 0.35 });
      F.paste(P.part(W, H, L => { L.rect(cx - 2 * s, cy - 2 * s, 4 * s, 4 * s, dk(m, 0.4)); L.ell(cx, cy, 7 * s, 7 * s, a, (x, y) => ((x + 0.5 - cx) / (7 * s)) ** 2 + ((y + 0.5 - cy) / (7 * s)) ** 2 > 0.85); }, { flat: true, noOutline: true }));
      A = { cx, cy, hx: cx, hy: cy, hr: 9 * s, rx: 9 * s, ry: 9 * s, face: [cx - 4 * s, cy + 2 * s, 7 * s] };
    } else if (k === 'pouch') {
      const ry = 8 * s - st.bob * 0.4, cy = GY - ry - 1;
      part(F, L => { L.ell(cx, cy, 10 * s, ry, m); L.poly([[cx - 4 * s, cy - ry + 1], [cx - 6 * s, cy - ry - 5 * s], [cx, cy - ry - 2 * s], [cx + 6 * s, cy - ry - 5 * s], [cx + 4 * s, cy - ry + 1]], m); L.rect(cx - 4 * s, cy - ry, 8 * s, 2, a); });
      for (let x = cx - 7 * s; x <= cx + 7 * s; x += 3) F.tint(x, cy + 3 * s, a);
      A = { cx, cy, hx: cx, hy: cy, hr: 8 * s, rx: 10 * s, ry, face: [cx - 2, cy - 2, 5 * s + 1] };
    } else if (k === 'gourd') {
      const cy = GY - 7 * s - 1 - st.bob * 0.5;
      part(F, L => { L.ell(cx, cy, 8 * s, 7 * s, m); L.ell(cx, cy - 9 * s, 5 * s, 4.5 * s, m); L.rect(cx - 1, cy - 15 * s, 2, 3 * s, '#5a8a3a'); L.rect(cx - 6 * s, cy - 5 * s, 12 * s, 2, a); });
      A = { cx, cy, hx: cx, hy: cy, hr: 7 * s, rx: 8 * s, ry: 7 * s, face: [cx - 2, cy - 1, 5 * s + 1] };
    } else if (k === 'fan') {
      const cy = GY - 6 * s + fl;
      part(F, L => { L.ell(cx, cy, 13 * s, 12 * s, m, (x, y) => y <= cy); });
      F.paste(P.part(W, H, L => { for (let i = 0; i < 7; i++) { const t = Math.PI * (1 + i / 6); L.line(cx, cy, cx + Math.cos(t) * 12 * s, cy + Math.sin(t) * 11 * s, dk(m, 0.15)); } L.ell(cx, cy - 6 * s, 3 * s, 3 * s, a, (x, y) => true); }, { flat: true, noOutline: true }));
      part(F, L => L.rect(cx - 1, cy, 2, 5 * s, '#8a5a2b'));
      A = { cx, cy: cy - 5 * s, hx: cx, hy: cy - 5 * s, hr: 8 * s, rx: 12 * s, ry: 6 * s, face: [cx - 3 * s, cy - 6 * s, 6 * s] };
    } else if (k === 'mask') {
      const cy = GY - 14 * s + fl;
      F.paste(P.part(W, H, L => L.ell(22, GY - 1, 6 * s, 1.2, '#00000030'), { flat: true, noOutline: true }));
      part(F, L => L.line(cx - 9 * s, cy - 3 * s, cx - 13 * s, cy + 6 * s + st.tail, '#d8463a', 2));
      part(F, L => { L.ell(cx, cy, 8.5 * s, 10 * s, m); }, { hl: 0.25 });
      // 하회탈 얼굴: 초승달 눈, 웃는 입
      for (const ex of [cx - 4 * s, cx + 2 * s]) for (let i = 0; i < 4 * s; i++) F.set(ex + i, cy - 2 * s + Math.round(Math.abs(i - 1.5 * s) * 0.5) * -1 + 1, a);
      for (let i = -3; i <= 3; i++) F.set(cx + i * s, cy + 4 * s + Math.round((9 - i * i) * 0.18) * (st.mouth ? 1.5 : 1), a);
      F.set(cx - 5 * s, cy + 1 * s, '#e88a7a'); F.set(cx + 5 * s, cy + 1 * s, '#e88a7a');
      return { cx, cy, hx: cx, hy: cy, hr: 8 * s, rx: 8 * s, ry: 10 * s, faceDone: true };
    } else if (k === 'totem') {
      const top = GY - 30 * s + st.bob * 0.5;
      part(F, L => { L.rect(cx - 5 * s, top, 10 * s, GY - top, m); L.ell(cx, top + 6 * s, 7 * s, 7.5 * s, m); });
      for (let y = top + 15 * s; y < GY - 2; y += 3) F.tint(cx - 2 * s, y, dk(m, 0.2));
      const A2 = { cx, cy: top + 18 * s, hx: cx, hy: top + 7 * s, hr: 6.5 * s, rx: 6 * s, ry: 12 * s };
      frontDeco(F, d, A2, s, st, form);
      if (d.feat.includes('armor')) part(F, L => L.rect(cx - 6 * s, top + 14 * s, 12 * s, 9 * s, '#8a96a8'));
      // 장승 얼굴: 부리부리한 눈, 이빨
      const ey = top + 5 * s;
      for (const ex of [cx - 4 * s, cx + 1.5 * s]) { F.ell(ex + 1.2, ey, 2 * s, 2 * s, '#ffffff'); F.set(ex + 1.5, ey, EYE); F.set(ex + 1.5, ey + 1, EYE); }
      F.rect(cx - 3 * s, ey + 5 * s, 6 * s, 2, '#ffffff'); F.rect(cx - 3 * s, ey + 5 * s + 2, 6 * s, 1, a);
      return Object.assign(A2, { faceDone: true });
    } else if (k === 'rock') {
      const cy = GY - 7 * s - st.bob * 0.3;
      part(F, L => { L.poly([[cx - 11 * s, GY - 1], [cx - 9 * s, cy - 5 * s], [cx - 2 * s, cy - 9 * s], [cx + 7 * s, cy - 7 * s], [cx + 11 * s, GY - 1]], m); }, { hl: 0.3 });
      A = { cx, cy, hx: cx, hy: cy - 2, hr: 9 * s, rx: 11 * s, ry: 8 * s, face: [cx - 1, cy - 2, 5 * s + 1] };
    }
    bodyDeco(F, d, A, s, st);
    return A;
  }

  // 알 (최상위 용 1단계)
  function egg(F, d, s, st) {
    const [m, b, a] = d.pal, cx = 22, cy = GY - 11 - st.bob * 0.5, wob = st.atk ? [0, 2, -2, 0][st.f] : [0, 0, 0, 1, -1, 0][st.f];
    part(F, L => L.ell(cx + wob, cy, 9, 11, m), { hl: 0.35 });
    for (let x = -7; x <= 7; x++) F.tint(cx + wob + x, cy - 1 + (x % 2 ? 1 : -1), dk(m, 0.4));
    F.paste(P.part(W, H, L => L.ell(cx + wob, cy - 1, 6, 2, '#1a1424'), { flat: true, noOutline: true }));
    if (!st.blink) { F.set(cx + wob - 2, cy - 1, '#ffffff'); F.set(cx + wob + 2, cy - 1, '#ffffff'); }
    for (let i = 0; i < 3; i++) F.tint(cx + wob - 4 + i * 4, cy + 5, a);
    return { cx, cy, hx: cx, hy: cy, hr: 9, rx: 9, ry: 11, faceDone: true };
  }

  const ARCH = {
    quad: (F, d, s, st, fm) => quad(F, d, s, st, fm),
    fox: (F, d, s, st, fm) => quad(F, d, s, st, fm, { brx: 9, bry: 5.5, leg: 5, hr: 6.2, snout: 0.55 }),
    tiger: (F, d, s, st, fm) => quad(F, d, s, st, fm, { brx: 11, bry: 6.5, leg: 5, hr: 7 }),
    lion: (F, d, s, st, fm) => quad(F, d, s, st, fm, { brx: 9.5, bry: 6.5, leg: 5, hr: 8, snout: 0.5 }),
    horse: (F, d, s, st, fm) => quad(F, d, s, st, fm, { brx: 10, bry: 5.5, leg: 8, hr: 5.2, neck: 6, hxk: 0.95, hw: 1.3, snout: 0.6 }),
    boar: (F, d, s, st, fm) => quad(F, d, s, st, fm, { brx: 11, bry: 7.5, leg: 3.5, hr: 6, hyk: 0.4, snout: 0.6 }),
    bear: (F, d, s, st, fm) => biped(F, d, s, st, fm, { brx: 9, bry: 9, hr: 7, leg: 4 }),
    goblin: (F, d, s, st, fm) => biped(F, d, s, st, fm, { brx: 6.5, bry: 6.5, hr: 7.5, leg: 5 }),
    blob, toad, bird: (F, d, s, st, fm) => bird(F, d, s, st, fm, { fly: d.id === 'samjok' || d.id === 'e_cheondung' }),
    crane, owl, bat, insect, phoenix, fish, crab, octo, jelly, wisp,
    ghost: (F, d, s, st, fm) => ghost(F, d, s, st, fm),
    ghostlady: (F, d, s, st, fm) => ghost(F, d, s, st, fm, { lady: true }),
    egghost, reaper, shadow, turtle,
    serpent: (F, d, s, st, fm) => serpent(F, d, s, st, fm),
    dragon: (F, d, s, st, fm) => serpent(F, d, s, st, fm, { dragon: true }),
    centipede, golem, cloud,
    shoe: obj, broom: obj, jar: obj, millstone: obj, lantern: obj, coin: obj, pouch: obj, gourd: obj, fan: obj, mask: obj, totem: obj, rock: obj,
  };

  // ---------- 프레임 ----------
  function frame(d, form, anim, f, enemy) {
    const F = P.layer(W, H), st = stateOf(anim, f);
    let s = SC[form];
    if (d.arch === 'golem' || d.boss) s = Math.min(1, s + 0.12);
    const ri = RARITY_ORDER.indexOf(d.r);
    // 오라 (S 이상 3단계, 적 보스)
    if ((form === 2 && ri >= 3) || (enemy && d.boss)) {
      const c = enemy ? '#ff3a5a' : ri >= 5 ? '#ff6bd5' : ri >= 4 ? '#ffd23f' : '#b06bff';
      for (let i = 0; i < 8; i++) { const t = (i / 8) * Math.PI * 2 + f * 0.4; F.set(24 + Math.cos(t) * 20, 28 + Math.sin(t) * 14, (i + f) % 3 ? c : '#ffffff'); }
    }
    let A;
    if (form === 0 && (d.id === 'hwangryong')) A = egg(F, d, 1, st);
    else A = (ARCH[d.arch] || blob)(F, d, s, st, form);
    if (d.feat.includes('foxfire')) for (let i = 0; i < 3 + form; i++) { const t = (i / (3 + form)) * Math.PI * 2 + f * 0.5; F.paste(P.part(W, H, L => L.ell(24 + Math.cos(t) * 18, 22 + Math.sin(t) * 10, 1.8, 2.2, i % 2 ? '#7ad8ff' : '#ffb04a'), { hl: 0.4 })); }
    if (!A.faceDone && A.face) {
      const [fx, fy, gap] = A.face;
      if (A.oneEye) { if (!st.blink) { F.set(fx, fy, '#ffffff'); F.set(fx + 1, fy, '#c8202a'); F.set(fx, fy + 1, '#c8202a'); } }
      else face(F, fx, fy, gap, A.small ? Math.min(s, 0.8) : s, st, { mood: A.mood || moodOf(d, form, enemy), fang: A.fang, noMouth: A.noMouth, eye: A.eyeless ? null : undefined });
    }
    return F;
  }

  const cache = new Map();
  function sheetURL(d, form, enemy) {
    const key = (enemy ? 'e:' : 'm:') + d.id + ':' + form;
    let u = cache.get(key);
    if (!u) {
      const rows = [[0, 1, 2, 3, 4, 5].map(f => frame(d, form, 'idle', f, enemy)), [0, 1, 2, 3].map(f => frame(d, form, 'atk', f, enemy))];
      u = P.toURL(rows, W, H);
      cache.set(key, u);
    }
    return u;
  }
  function html(d, form, enemy, opts = {}) {
    return P.sprHTML(sheetURL(d, form, enemy), W, H, 2, 'mon' + (opts.silhouette ? ' silhouette' : '') + (opts.still ? ' still' : ''));
  }
  const monster = (id, form, opts) => html(LINE_MAP[id], form, false, opts);
  const enemy = (id, form, opts) => html(ENEMY_MAP[id], form, true, opts);

  return { monster, enemy, frame, sheetURL };
})();
