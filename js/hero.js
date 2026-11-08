// ===== 메인 캐릭터 도트 (32x40, 한국풍 SD) =====
// 시트 행: 0 대기(6프레임) · 1 공격(4) · 2 스킬(4)
// 장착한 무기·갑옷·투구·반지 등급이 외형에 그대로 반영됩니다.
// assets/hero/{성별}_{직업}.png 가 있으면 그 이미지를 대신 사용합니다.
const HeroArt = (() => {
  const W = 32, H = 40;
  const P = Pixel;

  const SKIN = ['#ffe3c8', '#f6c9a0', '#d79c6c'];
  const HAIR_COLORS = ['#2b2230', '#6b3f22', '#e8c050', '#d9dbe8', '#c8452e', '#3f62c8', '#f08cb4', '#4fa35a'];
  const HAIR_STYLES = { topknot: '상투', short: '짧은머리', long: '댕기머리', pony: '꽁지머리', bob: '단발', twin: '양갈래' };
  const OUTFIT = {
    warrior: { cloth: '#a0603c', pants: '#4a3a5a', collar: '#efe3c4', belt: '#3a2a1a', tie: '#d8463a' },
    rogue:   { cloth: '#3e4a5c', pants: '#262e3b', collar: '#9aa6b8', belt: '#7a5a3a', tie: '#7a2a3a' },
    mage:    { cloth: '#ece6d4', pants: '#4a5a8a', collar: '#3f62c8', belt: '#3f62c8', tie: '#3f62c8' },
    archer:  { cloth: '#5a8a4a', pants: '#5a4030', collar: '#efe3c4', belt: '#7a5a3a', tie: '#e0a020' },
  };
  const ARMOR = {
    R:   { c: '#3f6fd8', t: '#cfe0ff' },
    SR:  { c: '#7a4fd6', t: '#f2c14e' },
    SSR: { c: '#c8323c', t: '#f2c14e', pad: 1 },
    UR:  { c: '#f4f0e6', t: '#f2b830', pad: 1 },
  };
  const WEP = {
    N:   { blade: '#c8ccd6', hilt: '#7a5a3a', guard: '#8a8a94', orb: '#a8865a', wood: '#8a5a2b', n: 0 },
    R:   { blade: '#dce9ff', hilt: '#2f58b8', guard: '#bcd4ff', orb: '#4fa3ff', wood: '#7a4a2a', n: 1 },
    SR:  { blade: '#eadcff', hilt: '#5a2fa0', guard: '#f2c14e', orb: '#b26bff', wood: '#5a3a6a', n: 2 },
    SSR: { blade: '#fff4d0', hilt: '#a02020', guard: '#f2c14e', orb: '#ffb020', wood: '#a02020', n: 3 },
    UR:  { blade: '#ffffff', hilt: '#202848', guard: '#5fe0ff', orb: '#ff6bd5', wood: '#202848', n: 4, glow: 1 },
  };
  const DEFAULT_HAIR = { m: 'topknot', f: 'long' };

  // ---------- 무기 ----------
  function weapon(L, cls, tier, hx, hy, ang) {
    const T = WEP[tier || 'N'], a = (ang * Math.PI) / 180, dx = Math.cos(a), dy = -Math.sin(a), px = -dy, py = dx;
    const seg = (t0, t1, w, c) => {
      for (let t = t0; t <= t1; t += 0.5)
        for (let k = 0; k < w; k++) { const o = k - (w - 1) / 2; L.set(hx + dx * t + px * o, hy + dy * t + py * o, c); }
    };
    if (cls === 'warrior') {
      seg(-2, 0.5, 1, T.hilt); seg(1, 1.5, 5, T.guard); seg(2, 10 + T.n, 2, T.blade); seg(10.5 + T.n, 11.5 + T.n, 1, T.blade);
      if (T.n >= 3) L.set(hx + dx * 1.2, hy + dy * 1.2, '#e83a3a');
    } else if (cls === 'rogue') {
      seg(-1.5, 0.5, 1, T.hilt); seg(1, 1.5, 3, T.guard); seg(2, 6 + T.n * 0.6, 2, T.blade); seg(6.5 + T.n * 0.6, 7.5 + T.n * 0.6, 1, T.blade);
    } else if (cls === 'mage') {
      seg(-7, 13, 1, T.wood);
      L.ell(hx + dx * 15, hy + dy * 15, 2 + T.n * 0.25, 2 + T.n * 0.25, T.orb);
      if (T.n >= 2) { L.set(hx + dx * 13 + px * 2, hy + dy * 13 + py * 2, T.guard); L.set(hx + dx * 13 - px * 2, hy + dy * 13 - py * 2, T.guard); }
    }
  }
  function bow(L, tier, hx, hy) {
    const T = WEP[tier || 'N'], bx = hx + 2;
    for (let y = -10; y <= 9; y++) {
      const x = bx + Math.round(3 * Math.cos((y / 10) * (Math.PI / 2)));
      L.set(x, hy + y, T.wood); L.set(x + 1, hy + y, T.wood);
    }
    L.set(bx + 4, hy - 1, T.guard); L.set(bx + 4, hy, T.guard);
    if (T.n >= 3) { L.set(bx, hy - 10, T.orb); L.set(bx, hy + 9, T.orb); }
  }

  // ---------- 한 프레임 ----------
  function frame(look, anim, f) {
    const cls = look.cls, O = OUTFIT[cls], A = look.armor ? ARMOR[look.armor] : null;
    const skin = SKIN[look.skin || 0], hc = HAIR_COLORS[look.hairColor ?? 0], style = look.hair || DEFAULT_HAIR[look.gender];
    const cloth = A ? A.c : O.cloth, trim = A ? A.t : O.collar;
    // 포즈
    let by = 0, ox = 0, hand = [21, 29], ang = { warrior: 62, rogue: -70, mage: 86, archer: 0 }[cls], blink = false, glow = 0, pull = 0, arrow = false;
    if (anim === 'idle') { by = [0, 0, 1, 1, 1, 0][f]; blink = f === 4; hand = [21, 29 + by]; }
    if (anim === 'atk') {
      const T = {
        warrior: [[-1, 17, 22, 125], [2, 25, 24, 15], [2, 25, 29, -35], [1, 22, 28, 55]],
        rogue:   [[-1, 18, 25, 150], [3, 26, 26, 0], [3, 26, 27, -15], [1, 22, 28, -60]],
        mage:    [[0, 20, 24, 100], [1, 23, 22, 60], [1, 24, 23, 45], [0, 21, 28, 85]],
        archer:  [[0, 23, 25, 0], [-1, 23, 25, 0], [0, 23, 25, 0], [0, 22, 27, 0]],
      }[cls][f];
      [ox, hand[0], hand[1], ang] = T;
      if (cls === 'mage') glow = f === 1 || f === 2 ? 1 : 0;
      if (cls === 'archer') { pull = [2, 4, 0, 0][f]; arrow = f < 2; }
    }
    if (anim === 'cast') {
      by = [0, -1, -1, 0][f]; hand = [[21, 25], [22, 21], [22, 20], [21, 27]][f]; hand[1] += by;
      ang = cls === 'rogue' ? 90 : cls === 'archer' ? 0 : 90; glow = f === 1 || f === 2 ? 2 : 0;
      if (cls === 'archer') { pull = [1, 4, 4, 0][f]; arrow = f > 0 && f < 3; }
    }
    const cx = 16 + ox, cy = 14 + by;
    const F = P.layer(W, H);

    // 오라 (UR 갑옷 또는 SSR 이상 반지)
    if (look.armor === 'UR' || look.ring === 'SSR' || look.ring === 'UR') {
      const pts = [[5, 12], [27, 9], [4, 28], [28, 25], [9, 3], [24, 33]];
      pts.forEach(([x, y], i) => { if ((i + f) % 3 !== 0) F.set(x, y + ((f + i) % 2), i % 2 ? '#fff6a6' : '#ffd23f'); });
    }
    // 뒷머리
    if (style === 'long' || style === 'pony') F.paste(P.part(W, H, L => {
      if (style === 'long') { L.rect(cx - 9, cy - 1, 3, 13); L.rect(cx - 9, cy + 12, 3, 2, '#d8463a'); L.rect(cx - 9, cy - 1, 3, 13, hc); }
      else L.poly([[cx - 6, cy - 6], [cx - 11, cy - 3], [cx - 12, cy + 6], [cx - 9, cy + 9], [cx - 7, cy]], hc);
    }));
    // 등 뒤 화살통
    if (cls === 'archer') F.paste(P.part(W, H, L => {
      L.rect(cx - 8, cy + 5, 3, 9, '#7a4a2a');
      L.set(cx - 8, cy + 4, '#f4f0e6'); L.set(cx - 6, cy + 3, '#f4f0e6'); L.set(cx - 7, cy + 4, '#d8463a');
    }));
    // 뒤쪽 팔
    F.paste(P.part(W, H, L => {
      L.line(cx - 3, cy + 8, cx - 4, cy + 13, cloth, 2);
      L.rect(cx - 4, cy + 14, 2, 2, skin);
    }));
    // 다리
    const lx = Math.sign(ox) * Math.min(1, Math.abs(ox));
    F.paste(P.part(W, H, L => {
      L.rect(13 + lx, 31, 3, 5, O.pants); L.rect(17 + lx, 31, 3, 5, O.pants);
      L.rect(13 + lx, 36, 4, 2, '#4a2e1e'); L.rect(17 + lx, 36, 4, 2, '#4a2e1e');
    }));
    // 몸통
    F.paste(P.part(W, H, L => {
      if (cls === 'mage') L.poly([[cx - 4, cy + 7], [cx + 5, cy + 7], [cx + 7, 37], [cx - 6, 37]], cloth);
      else {
        L.rect(cx - 4, cy + 7, 9, 10, cloth);
        if (cls === 'warrior' || A) L.rect(cx - 5, cy + 14, 11, 4, A ? cloth : '#7a5a4a');
      }
    }));
    // 몸통 디테일 (외곽선 없이)
    for (let i = 0; i < 4; i++) F.tint(cx - 1 + i, cy + 7 + i, trim);       // 저고리 깃
    F.tint(cx - 2, cy + 7, trim);
    F.tint(cx + 2, cy + 11, O.tie); F.tint(cx + 3, cy + 12, O.tie); F.tint(cx + 3, cy + 13, O.tie); // 옷고름
    for (let x = cx - 4; x <= cx + 4; x++) F.tint(x, cy + 14, cls === 'mage' ? O.belt : (A ? A.t : O.belt));
    if (cls === 'warrior' || A) for (let x = cx - 4; x <= cx + 4; x += 3) for (let y = cy + 15; y <= cy + 17; y++) F.tint(x, y, P.tone(cloth, -0.3));
    if (A && A.pad) F.paste(P.part(W, H, L => L.ell(cx - 4, cy + 8, 2.6, 2, A.t)));

    // 머리 장식(상투/양갈래) - 머리 뒤
    if (style === 'topknot' || style === 'twin') F.paste(P.part(W, H, L => {
      if (style === 'topknot') { L.ell(cx - 1, cy - 8, 2.8, 2.6, hc); L.rect(cx - 2, cy - 6, 3, 1, '#d8463a'); }
      else { L.ell(cx - 6, cy - 6, 2.8, 2.8, hc); L.ell(cx + 4, cy - 8, 2.8, 2.8, hc); }
    }));
    // 얼굴 + 머리카락
    const helm = look.helmet;
    F.paste(P.part(W, H, L => {
      L.ell(cx, cy, 7.6, 7, skin);
      const capY = helm ? cy - 2 : cy - 3;
      L.ell(cx, cy, 7.6, 7, hc, (x, y) => y <= capY || (x <= cx - 4 && y <= cy + (style === 'bob' ? 6 : 3)));
      if (!helm) {
        for (let x = cx - 3; x <= cx + 5; x++) if ((x - cx + 9) % 3 !== 0) L.set(x, cy - 2, hc); // 앞머리
        if (style === 'short') { L.set(cx - 3, cy - 8, hc); L.set(cx, cy - 8, hc); L.set(cx + 3, cy - 7, hc); L.set(cx - 5, cy - 7, hc); }
        if (style === 'bob') for (let y = cy - 2; y <= cy + 3; y++) L.set(cx + 6, y, hc);
      }
    }, { hl: 0.22 }));
    // 얼굴
    const ex1 = cx + 1, ex2 = cx + 5, ey = cy;
    if (blink) { F.set(ex1, ey + 1, '#2a1d3a'); F.set(ex1 + 1, ey + 1, '#2a1d3a'); F.set(ex2, ey + 1, '#2a1d3a'); F.set(ex2 + 1, ey + 1, '#2a1d3a'); }
    else for (const ex of [ex1, ex2]) {
      F.set(ex, ey, '#ffffff'); F.set(ex + 1, ey, '#2a1d3a'); F.set(ex, ey + 1, '#2a1d3a'); F.set(ex + 1, ey + 1, '#3a2a5a');
    }
    if (look.gender === 'f') { F.set(ex2 + 2, ey - 1, '#2a1d3a'); F.set(ex1 - 1, ey - 1, '#2a1d3a'); }
    F.set(cx - 1, ey + 3, '#ff9aa8'); F.set(cx, ey + 3, '#ff9aa8'); F.set(cx + 6, ey + 3, '#ff9aa8');
    F.set(cx + 4, ey + 4, anim === 'atk' && f === 1 ? '#7a2030' : '#b04050');
    if (cls === 'rogue' && !helm) F.paste(P.part(W, H, L => L.rect(cx - 2, ey + 3, 9, 3, '#2f3848'), { flat: true }));

    // 투구 / 기본 모자
    if (helm) F.paste(P.part(W, H, L => {
      const inHead = (x, y) => ((x + 0.5 - cx) / 7.6) ** 2 + ((y + 0.5 - cy) / 7) ** 2 <= 1;
      if (helm === 'N') { for (let x = cx - 8; x <= cx + 8; x++) if (inHead(x, cy - 2)) L.set(x, cy - 2, '#f4f0e6'); L.set(cx - 8, cy - 1, '#f4f0e6'); L.set(cx - 9, cy, '#f4f0e6'); }
      if (helm === 'R') { L.ell(cx, cy, 7.6, 7, '#8a5a2b', (x, y) => y <= cy - 3); L.rect(cx - 7, cy - 3, 15, 1, '#5a3a1a'); }
      if (helm === 'SR') { L.ell(cx, cy, 7.8, 7.2, '#b8c2d0', (x, y) => y <= cy - 2); L.rect(cx - 7, cy - 2, 15, 1, '#7a8496'); L.rect(cx, cy - 10, 1, 3, '#b8c2d0'); }
      if (helm === 'SSR') {
        L.ell(cx, cy, 7.8, 7.2, '#f2c14e', (x, y) => y <= cy - 2); L.rect(cx - 7, cy - 2, 15, 1, '#c8902a');
        L.poly([[cx - 6, cy - 4], [cx - 12, cy - 10], [cx - 9, cy - 3]], '#f4f0e6');
        L.poly([[cx - 1, cy - 7], [cx - 6, cy - 12], [cx - 3, cy - 6]], '#d8463a');
      }
      if (helm === 'UR') {
        L.rect(cx - 5, cy - 10, 11, 3, '#f2c14e');
        for (const x of [cx - 5, cx - 2, cx + 1, cx + 4]) { L.set(x, cy - 11, '#f2c14e'); L.set(x + 1, cy - 12, '#f2c14e'); }
      }
    }));
    else if (cls === 'mage') F.paste(P.part(W, H, L => {           // 갓
      L.rect(cx - 4, cy - 10, 9, 6, '#2a2230');
      L.rect(cx - 10, cy - 4, 21, 2, '#2a2230');
    }, { hl: 0.4 }));
    else if (cls === 'archer') F.paste(P.part(W, H, L => {          // 머리띠 + 깃털
      L.rect(cx - 7, cy - 3, 15, 1, '#3f7a35');
      L.poly([[cx - 6, cy - 4], [cx - 11, cy - 11], [cx - 8, cy - 3]], '#e8463a');
    }));
    if (helm === 'UR') { F.set(cx - 2, cy - 9, '#e83a3a'); F.set(cx + 2, cy - 9, '#5fe0ff'); }
    if (cls === 'mage' && !helm) { F.set(cx + 6, cy + 1, '#7a5a3a'); F.set(cx + 6, cy + 3, '#7a5a3a'); F.set(cx + 7, cy + 5, '#7a5a3a'); } // 갓끈

    // 무기 (팔 뒤)
    F.paste(P.part(W, H, L => {
      if (cls === 'archer') bow(L, look.weapon, hand[0], hand[1]);
      else weapon(L, cls, look.weapon, hand[0] + 1, hand[1] + 1, ang);
    }));
    if (cls === 'archer') {
      const T = WEP[look.weapon || 'N'], bx = hand[0] + 2, sx = hand[0] - pull;
      F.line(bx, hand[1] - 10, sx, hand[1], '#f4f0e6'); F.line(sx, hand[1], bx, hand[1] + 9, '#f4f0e6');
      if (arrow) { F.line(sx, hand[1], hand[0] + 9, hand[1], '#c8a070'); F.set(hand[0] + 10, hand[1], T.blade); F.set(sx - 1, hand[1] - 1, '#e8463a'); }
    }
    // 앞팔
    F.paste(P.part(W, H, L => {
      L.line(cx + 3, cy + 8, hand[0], hand[1] - 1, cloth, 2);
      if (A && A.pad) L.ell(cx + 3, cy + 8, 2.4, 2, A.t);
      L.rect(hand[0], hand[1], 2, 2, skin);
    }));
    // 마법 반짝임
    if (glow) {
      const T = WEP[look.weapon || 'N'];
      const gx = cls === 'mage' ? hand[0] + 1 + Math.cos((ang * Math.PI) / 180) * 15 : hand[0] + 1, gy = cls === 'mage' ? hand[1] + 1 - Math.sin((ang * Math.PI) / 180) * 15 : hand[1] - 6;
      const pts = glow === 2 ? [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2]] : [[-2, 0], [2, 0], [0, -2], [0, 2]];
      pts.forEach(([x, y], i) => F.set(gx + x * (1 + (f % 2)), gy + y * (1 + (f % 2)), i % 2 ? '#ffffff' : T.orb));
    }
    if (WEP[look.weapon || 'N'].glow && anim === 'idle' && f % 2 === 0) F.set(hand[0] + 4, hand[1] - 8 - f, '#5fe0ff');
    return F;
  }

  // ---------- 시트 / HTML ----------
  const cache = new Map();
  function lookOf(h, opts = {}) {
    const look = { gender: h.gender, cls: { human: 'warrior', fox: 'mage', goblin: 'rogue' }[h.cls] || h.cls, hair: h.hair || DEFAULT_HAIR[h.gender], hairColor: h.hairColor ?? (h.gender === 'f' ? 4 : 0), skin: h.skin || 0 };
    if (!opts.bare && typeof Gear !== 'undefined' && G.state && G.state.hero && G.state.hero.gender === h.gender && G.state.hero.cls === h.cls) {
      const T = { C: 'N', B: 'R', A: 'SR', S: 'SSR', SS: 'UR', SSS: 'UR' };
      for (const sl of HERO_SLOTS) { const it = Gear.inSlot('hero', sl); look[sl] = it ? T[it.r] : null; }
    }
    return look;
  }
  function sheet(look) {
    const key = JSON.stringify(look);
    let url = cache.get(key);
    if (!url) {
      const rows = [
        [0, 1, 2, 3, 4, 5].map(f => frame(look, 'idle', f)),
        [0, 1, 2, 3].map(f => frame(look, 'atk', f)),
        [0, 1, 2, 3].map(f => frame(look, 'cast', f)),
      ];
      url = P.toURL(rows, W, H);
      cache.set(key, url);
    }
    return url;
  }
  // h: 캐릭터 정보 (G.state.hero 또는 미리보기용 객체)
  function of(h, opts = {}) {
    if (!h) return '';
    const key = `hero_${h.gender}_${h.cls}`;
    if (Assets.has(key)) return Assets.raw(key);
    const ik = `${h.cls}_${h.gender}`, sz = (window.ASSET_SIZES || {})['hero_' + ik];
    if (sz) {
      if (opts.battle) for (let i = 1; i < 6; i++) new Image().src = `assets/hero/${ik}_p${i}.png`; // 동작 프레임 미리 불러오기
      if (opts.battle) return `<div class="natbox"><img class="mimg nat hero-pose" data-k="${ik}" src="assets/hero/${ik}_p0.png" style="width:${Math.round((sz[0] / sz[1]) * 1.18 * 100 * (19 / 21))}%" draggable="false" alt=""></div>`;
      return `<div class="fitbox"><img class="mimg fit" src="assets/hero/${ik}.png" draggable="false" alt=""></div>`;
    }
    return P.sprHTML(sheet(lookOf(h, opts)), W, H, 3, 'hero' + (opts.cls ? ' ' + opts.cls : ''));
  }
  const hero = (gender, cls, extra = {}) => of(Object.assign({ gender, cls }, extra), { bare: true });

  // 장비 아이콘에서 재사용
  function drawWeaponIcon(L, cls, tier) {
    if (cls === 'archer') bow(L, tier, 6, 10);
    else weapon(L, cls, tier, cls === 'mage' ? 5 : 4, cls === 'mage' ? 17 : 15, 45);
  }

  return { of, hero, frame, lookOf, drawWeaponIcon, SKIN, HAIR_COLORS, HAIR_STYLES, ARMOR, WEP, DEFAULT_HAIR };
})();
