// ===== 바람의나라 풍 도트 (약 22x36, 3등신, 정면에서 살짝 오른쪽) =====
const BR_PAL = {
  K: '#0e0c10', H: '#1d1c22', h: '#3c3b44', j: '#29282f', J: '#47464f',
  A: '#2a1f1c', a: '#4c3a32',
  S: '#f2d4b8', s: '#d4aa8a', E: '#3a2418', m: '#b06a5a', M: '#c8384a',
  R: '#2c2c31', r: '#1a1a1e', L: '#45454c', l: '#5c5c66', W: '#bdb8b0',
  F: '#16161a', f: '#34343a',
  n: '#6a4a2a', Q: '#3a4ac0', q: '#1c287a', z: '#8a9af0',
  B: '#c8303e', c: '#801c28', y: '#f0c040', b: '#c08a20',
  U: '#3a2d58', u: '#56467c',
  i: '#f4f6fa', I: '#cfd6e2', k: '#8e98ac', e: '#3a5ad0', o: '#9ab4ff',
};
const Baram = (() => {
  const pad = (rows, w) => rows.map(r => (r + '.'.repeat(w)).slice(0, w));
  // ---- 모자 (9줄) ----
  const HAT = {
    gat: [
      '.........KKKK.........',
      '........KHhHHK........',
      '........KHhHHK........',
      '........KjjjjK........',
      '..KKKKKKKjjjjKKKKKKK..',
      '.KjJJjjjjjjjjjjjJjjjK.',
      '..KKKKKKKKKKKKKKKKKK..'],
    samo: [
      '.......KHhHHHK........',
      '.......KHhHHHK........',
      '.KKK..KHHHHHHHK..KKK..',
      'KhHHKKHHHHHHHHHKKHHhK.',
      '.KKK.KjjjjjjjjjK.KKK..',
      '.....KjjjjjjjjjK......',
      '......KKKKKKKKK.......'],
    crown: [
      '......KyyKbyyKbyyK....',
      '......KbyyyyyyyybK....',
      '......KyBbyyyybByK....',
      '......KbyyyyyyyybK....',
      '......KHHHHHHHHHHK....',
      '.......KKKKKKKKKK.....'],
    myeon: [
      '...KKKKKKKKKKKKKKKK...',
      '...KHhhHHHHHHHHHHHK...',
      '...KKKKKKKKKKKKKKKK...',
      '...b.y..KHHHHHK.y.b...',
      '...y.b..KHhHHHK.b.y...',
      '...b.y..KHHHHHK.y.b...',
      '...y.b.KyyyyyyyK.b.y..',
      '........KKKKKKK.......'],
  };
  // ---- 얼굴 (9줄) ----
  const FACE_M = [
    '.......KKAAAAK........',
    '......KAAaAAAAK.......',
    '......KAssssssK.......',
    '......KASESSESK.......',
    '......KASSSSsSK.......',
    '.......KSSmSsK........',
    '........KKssK.........'];
  const FACE_F = [
    '......KKAAAAAK........',
    '.....KAAaAAAAAK.......',
    '.....KAAssssssAK......',
    '.....KAASESSESAK......',
    '.....KAASSSSsSAK......',
    '.....KAaKSMSsKaAK.....',
    '.....KAaAKssKAaAK.....'];
  // ---- 몸 (16줄) ----
  const BODY_M = [
    '......KKRRLRRRKK......',
    '.....KRRRRLLRRRrK.....',
    '....KRLRRRRLRRRRrK....',
    '...KRLLRRRRRLRRRrrK...',
    '...KRLRRRRRRLRRRrrK...',
    '...KRLRRRRRRRLRRrrK...',
    '...KRLRBBBBBBBBRrrK...',
    '...KRLRRRRRrRRRRrrK...',
    '...KRLRRRRRrRRRRrrK...',
    '...KSSKRRRRrRRRKSSK...',
    '....KKRLRRRrRRRrKK....',
    '.....KRLRRRrRRRrK.....',
    '.....KRLRRRRrRRrK.....',
    '.....KRLRRRRrRRrK.....',
    '.....KRLLRRRrRRrK.....',
    '.....KRLRRRRrRRrK.....',
    '.....KRRRRRRrRrrK.....',
    '.....KKKKKKKKKKKK.....'];
  const BODY_F = [
    '.....KAaKRLRRKaAK.....',
    '....KAaKRRRLLRKaAK....',
    '....KAKRLRRRLRRKaK....',
    '...KAKRLLRRRRLRrKaK...',
    '...KAKRLRRRRRRLrKaK...',
    '...KKRLRRBBBBRRrrKK...',
    '...KRLRRRRBcRRRRrrK...',
    '...KRLUUUUUUUUUUrrK...',
    '...KRLUUUUuUUUUUrrK...',
    '...KSSKUUUuUUUUKSSK...',
    '....KKUUuUUUuUUUKK....',
    '.....KUUuUUUuUUUK.....',
    '.....KUuUUUuUUUuK.....',
    '....KUUuUUUuUUUuUK....',
    '....KUuUUUuUUUUuUK....',
    '...KUUuUUUuUUUUuUUK...',
    '...KUuUUUuUUUUuUUuK...',
    '...KKKKKKKKKKKKKKKK...'];
  // ---- 염주 지팡이 ----
  const STAFF = (() => {
    const w = 16, h = 34, g = Array.from({ length: h }, () => Array(w).fill('.'));
    const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h && (g[y][x] === '.' || c !== 'K')) g[y][x] = c; };
    for (let t = 0; t <= 1; t += 0.02) put(2 + t * 10, 2 + t * 20, 'n');
    for (let y = 22; y < 33; y++) put(12, y, 'n');
    for (let k = 0; k < 6; k++) { const x = k * 2.1, y = k * 3.4; ['.KK.', 'KzQK', 'KQqK', '.KK.'].forEach((r, dy) => [...r].forEach((c, dx) => c !== '.' && put(x + dx, y + dy, c))); }
    put(13, 27, 'B'); put(13, 28, 'c'); put(14, 29, 'B');
    return g.map(r => r.join(''));
  })();
  const STAFF_UP = [
    'Kz..Kz..Kz.......',
    'QQKKQQKKQQKnnnnnK',
    'qQK.qQK.qQK......',
    '.KK..KK..KK......'];
  const LOOKS = [
    { hat: 'gat', R: '#5c5c66', r: '#3e3e46', L: '#7a7a86', l: '#9696a4', B: '#5c5c66', c: '#3e3e46', U: '#4c4c58', u: '#6a6a78' },
    { hat: 'gat', R: '#2c2c31', r: '#1a1a1e', L: '#45454c', l: '#5c5c66', B: '#c8303e', c: '#801c28', U: '#2e2440', u: '#463a60' },
    { hat: 'gat', beads: 1, R: '#2c2c31', r: '#1a1a1e', L: '#45454c', l: '#5c5c66', B: '#c8303e', c: '#801c28', U: '#2e2440', u: '#463a60' },
    { hat: 'gat', beads: 1, R: '#26262c', r: '#151518', L: '#8a8a9a', l: '#b4b4c4', B: '#c8303e', c: '#801c28', U: '#2a2a36', u: '#8a8a9a' },
    { hat: 'gat', beads: 1, R: '#1e2a52', r: '#111a36', L: '#c8a040', l: '#f0d070', B: '#c8303e', c: '#801c28', U: '#22306a', u: '#c8a040' },
    { hat: 'samo', badge: 1, R: '#8a2632', r: '#56161f', L: '#b8464e', l: '#de6a70', B: '#1d1c22', c: '#0e0c10', U: '#7a1e2c', u: '#a83a46' },
    { hat: 'samo', badge: 1, R: '#ac203a', r: '#6a1222', L: '#e05a62', l: '#ff8a8a', B: '#e0b040', c: '#9a7020', U: '#961a32', u: '#d44a56' },
    { hat: 'crown', badge: 1, R: '#1e2c66', r: '#101a40', L: '#4a6ac0', l: '#7a9ae6', B: '#e0b040', c: '#9a7020', U: '#22307a', u: '#4a6ac0' },
    { hat: 'myeon', badge: 1, R: '#b4202c', r: '#70101a', L: '#f0c040', l: '#fff0a0', B: '#f0c040', c: '#a07010', U: '#9e1c2a', u: '#f0c040' },
  ];
  // ---- 주민 공통 ----
  const NHAT = {
    none: ['', '', '', '', '', '', ''],
    bun: ['', '', '.........KKKK', '........KAaAAK', '........KAAAAK.yy', '.........KKKK', ''],
    topknot: ['', '', '..........KK', '.........KAAK', '..........KK', '', ''],
    straw: ['..........KK', '........KKTTKK', '......KKTTxTTTKK', '....KKTTTTTxTTTTKK', '..KKTTxTTTTTTTxTTTKK', '.KKKKKKKKKKKKKKKKKKKK', ''],
    horns: ['', '', '......Ky......yK', '.......Ky....yK', '', '', ''],
    feather: ['.....r.o.y.o.r', '......roy.yor', '........KKKKK', '.......KHHHHHK', '..KKKKKHHHHHHHKKKKK', '.KHHHHHHHHHHHHHHHHHK', '..KKKKKKKKKKKKKKKKK'],
    smallgat: ['', '..........KKK', '.........KHhHK', '.........KjjjK', '....KKKKKKjjjKKKKKK', '...KjJjjjjjjjjjjJjjK', '....KKKKKKKKKKKKKKK'],
  };
  const BEARD = ['.KAAAK.', 'KAAAAAK', 'KAaAAAK', '.KAAAK.', '..KAK..'];
  const APRON = ['KWWWWWWK', 'KWWWWWWK', 'KWIWWIWK', 'KWWWWWWK', 'KWWWWWWK', '.KKKKKK.'];
  const SACK = ['..KKK.', '.KTTTK', 'KTTxTTK', 'KTTTTTK', 'KTxTTTK', '.KKKKK.'];
  const FAN = ['.KKK.', 'KrBrK', 'KBrBK', '.KnK.', '..n..'];
  const ITEMS = {
    cane: Array.from({ length: 16 }, (_, k) => k === 0 ? 'nK' : 'n.'),
    pole: Array.from({ length: 34 }, () => 'n'),
    gnarled: ['.nn.', 'n..n', '.n..', '.n..'].concat(Array.from({ length: 22 }, () => '.n..')),
    lantern: ['.n.', '.n.', 'KKK', 'QzQ', 'QQQ', 'KKK'],
  };
  function npcFrame(sp, i) {
    const look = Object.assign({ R: '#5a5a66', r: '#3a3a44', L: '#7a7a88', l: '#9a9aa8', B: '#3a3a44', c: '#2a2a30', U: '#4a4a58', u: '#6a6a7a' }, sp.pal || {});
    let hat = pad(NHAT[sp.hat || 'none'], 22), face = pad(sp.kind === 'f' ? FACE_F : FACE_M, 22), body = pad(sp.kind === 'f' ? BODY_F : BODY_M, 22);
    if (sp.beard) face = patch(face, 7, 3, BEARD.slice(0, 4));
    if (sp.apron) body = patch(body, 7, 7, APRON);
    const hb = [0, 0, 1, 1][i % 4], OX = 6, top = 2, fy = top + 32 - 1;
    const parts = [[['KFFK'], OX + 7, fy], [['KFfK'], OX + 11, fy], [body, OX, top + 14], [face, OX, top + 7 + hb], [hat, OX, top + hb]];
    if (sp.beard) parts.push([BEARD.slice(3), OX + 7, top + 14 + hb]);
    if (sp.item === 'pole') parts.unshift([ITEMS.pole, OX + 4, top]);
    else if (sp.item) parts.push([ITEMS[sp.item], OX + (sp.item === 'lantern' ? 2 : 3), top + (sp.item === 'lantern' ? 22 : 14)]);
    if (sp.sack) parts.push([SACK, OX + 15, top + 20]);
    if (sp.fan) parts.push([FAN, OX + 15, top + 20]);
    return compose(32, fy + 2, parts, Object.assign({}, BR_PAL, look, { T: '#d8b870', x: '#a88a50', I: '#d8d4cc', r: look.r2 || '#e04050', o: '#40a060' }, sp.skin || {}));
  }
  const NPCS = {
    jumo: { kind: 'f', hat: 'bun', apron: 1, pal: { R: '#efe6d8', r: '#c8bca8', L: '#ffffff', l: '#ffffff', B: '#c8303e', c: '#801c28', U: '#9a3434', u: '#bc4a4a' } },
    elder: { kind: 'm', hat: 'topknot', beard: 1, item: 'cane', pal: { R: '#8c8c9c', r: '#6a6a7a', L: '#aaaab8', l: '#c4c4d0', B: '#4a4a5a', c: '#3a3a48', A: '#eeeeee', a: '#c8c8d4' } },
    gob: { kind: 'm', hat: 'horns', sack: 1, pal: { R: '#3a6ab0', r: '#24447a', L: '#5a8ad0', l: '#7aaaf0', B: '#e04040', c: '#a02a2a', A: '#2a3a20', a: '#4a6a3a' }, skin: { S: '#72c47e', s: '#4a9a5a', E: '#1a1024' } },
    boat: { kind: 'm', hat: 'straw', item: 'pole', pal: { R: '#4a6a8a', r: '#2e4a66', L: '#6a8aaa', l: '#8aaacc', B: '#c8a060', c: '#9a7a40' } },
    mudang: { kind: 'f', hat: 'feather', fan: 1, pal: { R: '#3a6ae0', r: '#2448a8', L: '#6a8af0', l: '#9ab0ff', B: '#f0c040', c: '#b08a20', U: '#d83848', u: '#f05a68', H: '#2a2030', h: '#4a3a50' } },
    sansin: { kind: 'm', hat: 'topknot', beard: 1, item: 'gnarled', pal: { R: '#e8eef8', r: '#c0cad8', L: '#ffffff', l: '#ffffff', B: '#c8a060', c: '#9a7a40', A: '#ffffff', a: '#dde4f0' } },
    minion: { kind: 'm', hat: 'smallgat', item: 'lantern', pal: { R: '#3e4a5e', r: '#28303e', L: '#5a6a82', l: '#7a8aa2', B: '#6a8fb0', c: '#4a6a88' } },
  };
  // ---- 원귀 (긴 머리 소복 귀신) ----
  const WRAITH = [
    '.......KKKKKK.........', '......KAAAAAAK........', '.....KAAaAAAAAK.......', '.....KAaAAAAAAK.......', '....KAAAiiiiiAAK......',
    '....KAAeeeeeeAAK......', '....KAAiioiiiAAK......', '....KAAiiiiiiAAK......', '....KAAAKiiKAAAK......', '....KAAKIIIIKAAK......',
    '...KAAKiiiiiiKAAK.....', '...KAaKiiIiiiKaAK.....', '...KAaKiiIiiiKaAK.....', '..oKAaKiiIiiiKaAK.....', '.oeKAaKiiIiiiKaAK.....',
    'oeeKAKiiiIiiiiKAK.....', 'eeoKAKiiiIiiiiKAK.....', 'eoeKAKiiiiIiiiKAK.....', 'oe.KKiiiiiIiiiiKK.....', 'e...KiiiiiIiiiiiK.....',
    '....KiIiiiIiiiIiK.....', '...KiiIiiiiIiiIiiK....', '...KiiIiiiiIiiIiiK....', '...KkiiIkiiIkiiIkK....', '....KkKKkKKkKKkKK.....'];
  const WRAITH2 = patch(WRAITH, 0, 13, ['_o', 'oe', '_ee', 'oee', 'eoe', '_oe', 'o_', 'e_']);
  function wraith(i) { return compose(24, 28, [[i % 2 ? WRAITH2 : WRAITH, 1, 1]], Object.assign({}, BR_PAL, { A: '#1c1820', a: '#3a3440', i: '#f4f6fa', I: '#c8d0dc', k: '#9aa4b8', e: '#3a5ad0', o: '#8aa8ff' })); }
  function frame(kind, rank, pose, i) {
    const look = LOOKS[Math.min(rank, 8)];
    let hat = pad(HAT[look.hat], 22), face = pad(kind === 'f' ? FACE_F : FACE_M, 22), body = pad(kind === 'f' ? BODY_F : BODY_M, 22);
    if (look.beads && look.hat === 'gat') face = patch(face, 5, 0, ['b', 'y', 'b', '.y', '.b', '..yb']);
    if (look.badge) body = patch(body, 9, 2, ['KKKK', 'KybK', 'KbyK', 'KKKK']);
    let hb = 0, bob = 0, lf = 0, rf = 0;
    if (pose === 'idle') hb = [0, 0, 1, 1][i % 4];
    if (pose === 'walk') { bob = [0, 1, 0, 1][i % 4]; hb = bob; lf = i % 4 === 0 ? -1 : 0; rf = i % 4 === 2 ? -1 : 0; }
    const OX = 10, top = 2, fy = top + 7 + 7 + 18 - 1;
    const parts = [
      [['KFFK'], OX + 7, fy + lf], [['KFfK'], OX + 11, fy + rf],
      [body, OX, top + 14 + bob], [face, OX, top + 7 + hb], [hat, OX, top + hb],
    ];
    if (pose === 'reap') parts.push([STAFF_UP, OX + 15, top + 22 + (i % 2)]);
    else parts.unshift([STAFF, OX - 8, top + 1 + bob]);
    return compose(38, fy + 2, parts, Object.assign({}, BR_PAL, { R: look.R, r: look.r, L: look.L, l: look.l, B: look.B, c: look.c, U: look.U, u: look.u }));
  }
  return { frame, LOOKS, npc: (name, i) => npcFrame(NPCS[name], i || 0), wraith };
})();
