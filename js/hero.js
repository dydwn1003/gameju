// ===== 메인 캐릭터 도트 스프라이트 (20x21 픽셀) =====
// assets/hero/{성별}_{직업}.png 가 있으면 그 이미지를 대신 사용합니다. (예: f_mage.png)
const HeroArt = (() => {
  const W = 20;
  const BASE = [
    '....................',
    '......KKKKKK........',
    '....KKHHHHHHKK......',
    '...KHHHHHHHHHHK.....',
    '...KHHHHHHHHHHK.....',
    '..KHHHHHHHHHHHHK....',
    '..KHHSSSSSSSSHHK....',
    '..KHSSSSSSSSSSHK....',
    '..KSSEwSSSSwESSK....',
    '..KSSEESSSSEESSK....',
    '..KSPPSSSSSSPPSK....',
    '...KSSSSKKSSSSK.....',
    '....KKSSSSSSKK......',
    '....KCCCAACCCK......',
    '...KSCCCAACCCSK.....',
    '...KSCCCCCCCCSK.....',
    '....KAAAAAAAAK......',
    '....KCCCCCCCCK......',
    '.....KCCKKCCK.......',
    '.....KBBKKBBK.......',
    '.....KKKKKKKK.......',
  ];

  const HAIR = {
    warrior: { m: '#6b3f22', f: '#c8452e' },
    rogue:   { m: '#2c3350', f: '#6a4a9a' },
    mage:    { m: '#d9dbe8', f: '#b79cf0' },
    archer:  { m: '#e8b84a', f: '#7fbf5a' },
  };
  const CLOTH = {
    warrior: { C: '#d8463a', c: '#9a2a22', A: '#f2c14e' },
    rogue:   { C: '#3e4a5c', c: '#262e3b', A: '#8a6a4a' },
    mage:    { C: '#7b4fd6', c: '#5230a0', A: '#f2c14e' },
    archer:  { C: '#3f9a4f', c: '#2a6a35', A: '#8a5a2b' },
  };
  const BASE_PAL = {
    K: '#2a1d3a', S: '#ffd9b8', E: '#2a1d3a', w: '#ffffff', P: '#ff9aa8', B: '#6b4423',
    M: '#d5dde8', m: '#8a96a8', W: '#a0682f', G: '#5fe0ff', F: '#ff5a5a', R: '#ff6b9a', L: '#f6efe0',
  };

  function grid() { return BASE.map(r => r.padEnd(W, '.').slice(0, W).split('')); }
  function set(g, r, c, ch) { if (g[r] && c >= 0 && c < W) g[r][c] = ch; }
  function row(g, r, str, from = 0) { for (let i = 0; i < str.length; i++) if (str[i] !== ' ') set(g, r, from + i, str[i]); }

  function build(gender, cls) {
    const g = grid();
    // 여자: 긴 머리 + 리본 + 치마
    if (gender === 'f') {
      for (let r = 11; r <= 14; r++) { set(g, r, 1, 'K'); set(g, r, 2, 'H'); set(g, r, 15, 'H'); set(g, r, 16, 'K'); }
      set(g, 15, 2, 'K'); set(g, 15, 15, 'K');
      row(g, 17, '...KCCCCCCCCCCK');
      if (cls !== 'mage' && cls !== 'rogue') { row(g, 2, 'RR', 12); row(g, 3, 'R', 13); }
    }
    switch (cls) {
      case 'warrior':
        row(g, 5, 'MMMMMMMMMMMM', 3);                      // 머리띠
        set(g, 13, 4, 'M'); set(g, 13, 13, 'M');            // 어깨
        for (let r = 5; r <= 13; r++) { set(g, r, 16, 'M'); set(g, r, 17, 'm'); set(g, r, 18, 'K'); }
        set(g, 4, 16, 'K'); set(g, 4, 17, 'K');
        row(g, 14, 'KAAAAK', 14); row(g, 15, 'SWWK', 14); row(g, 16, 'KWK', 15);
        break;
      case 'rogue':
        for (let r = 1; r <= 5; r++) for (let c = 0; c < W; c++) if (g[r][c] === 'H') g[r][c] = 'C';
        for (let c = 3; c <= 14; c++) if (g[11][c] === 'S' || g[11][c] === 'K') g[11][c] = 'c';
        set(g, 11, 2, 'K'); set(g, 11, 15, 'K');
        row(g, 10, 'K', 16); row(g, 11, 'KMK', 15); row(g, 12, 'KMK', 15); row(g, 13, 'KMK', 15);
        row(g, 14, 'KAAAK', 14); row(g, 15, 'SKWK', 14);
        break;
      case 'mage':
        row(g, 0, '..........KK........');
        row(g, 1, '.........KCCK.......');
        row(g, 2, '........KCCCCK......');
        row(g, 3, '......KKCCCCCCK.....');
        row(g, 4, '....KKCCCCCCCCCK....');
        row(g, 5, '..KKAAAAAAAAAAAAK...');
        for (let r = 4; r <= 19; r++) set(g, r, 17, 'W');
        row(g, 1, 'KGK', 16); row(g, 2, 'GwG', 16); row(g, 3, 'KGK', 16);
        row(g, 15, 'SS', 15);
        row(g, 18, '....KCCCCCCCCK');                         // 로브
        row(g, 19, '....KccccccccK');
        row(g, 20, '....KKKKKKKKKK');
        break;
      case 'archer':
        row(g, 1, 'FF', 13); row(g, 2, 'F', 14); row(g, 0, 'F', 14);   // 깃털
        row(g, 5, 'CCCCCCCCCCCC', 3);                                  // 모자 테
        set(g, 8, 17, 'W'); set(g, 9, 18, 'W'); set(g, 10, 18, 'W');
        for (let r = 11; r <= 15; r++) set(g, r, 19, 'W');
        set(g, 16, 18, 'W'); set(g, 17, 18, 'W'); set(g, 18, 17, 'W');
        for (let r = 9; r <= 17; r++) set(g, r, 16, 'L');
        row(g, 14, 'SS', 14); row(g, 13, 'MMMK', 15);                  // 화살
        break;
    }
    return g;
  }

  function svg(gender, cls) {
    const pal = Object.assign({}, BASE_PAL, CLOTH[cls]);
    pal.H = HAIR[cls][gender];
    pal.h = Art.shade(pal.H, -0.25);
    const g = build(gender, cls);
    let rects = '';
    g.forEach((r, y) => {
      let x = 0;
      while (x < W) {
        const ch = r[x];
        if (ch === '.' || !pal[ch]) { x++; continue; }
        let n = 1;
        while (x + n < W && r[x + n] === ch) n++;
        rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${pal[ch]}"/>`;
        x += n;
      }
    });
    return `<svg class="pix" viewBox="-2 -3 24 26" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <ellipse cx="9.5" cy="21" rx="6" ry="1.2" fill="#000" opacity=".2"/>${rects}</svg>`;
  }

  // 메인 캐릭터 그림 (에셋 우선)
  function hero(gender, cls) {
    const key = `hero_${gender}_${cls}`;
    if (Assets.has(key)) return Assets.raw(key);
    return svg(gender, cls);
  }

  return { hero, svg };
})();
