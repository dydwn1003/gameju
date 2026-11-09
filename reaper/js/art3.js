// ===== 게임 전체 도트 (시안 v3 화풍): 저승사자 남녀 · 계급 옷 · 졸개 · 주민 · 원귀 · 혼불 =====
const A3_PAL = Object.assign({}, R2_PAL, { U: '#22202a', u: '#3a3846', I: '#d8d4cc', d: '#2a1a14', Y: '#ffe08a', O: '#c89a30', G: '#e83a3a' });
const Art3 = (() => {
  const W = 36;
  const pad = r => (r + '.'.repeat(W)).slice(0, W);
  // ---- 모자 (절반 18칸 · 13줄) ----
  const HATS = {
    gat: ['............KKKKKK', '...........KHHhHHH', '...........KHHhHHH', '...........KHHhHHH', '...........KHHHHHH', '...........KHHHHHH', '...........KjjjjjJ',
      '.....KKKKKKKjjjjjj', '...KKJJJHHHHHHHHHH', '.KKHHJHHHHHHHHHHHH', 'KHHHHHHHHHHHHHHHHH', '.KKjjjjjjjjjjjjjjj', '...KKKKKKKKKKKKKKK'],
    samo: ['', '', '', '............KKKKKK', '...........KHHhHHH', '...........KHHhHHH', '..KKKK....KHHHHHHH', '.KHhHHK..KHHHHHHHH', 'KHHHHHHKKHHHHHHHHH', '.KHHHHK.KHHHHHHHHH', '..KKKK..KjjjjjjjjJ', '.........KKKKKKKKK', ''],
    crown: ['', '', '.........K...K...K', '........KYK.KYK.KY', '........KYYKYYYKYY', '........KOYYYYYYYY', '........KOYGOYYGOY', '........KOYYYYYYYY', '........KKKKKKKKKK', '........KHHHHHHHHH', '........KjjjjjjjjJ', '.........KKKKKKKKK', ''],
    myeon: ['', '..KKKKKKKKKKKKKKKK', '..KHhhHHHHHHHHHHHH', '..KKKKKKKKKKKKKKKK', '...O.O.....KHHHHHH', '...Y.Y.....KHHhHHH', '...O.O.....KHHHHHH', '...Y.Y.....KHHHHHH', '...O.O....KYYYYYYG', '...Y.Y....KOOOOOOG', '...O.O.....KKKKKKK', '', ''],
    smallgat: ['', '', '', '', '.............KKKK', '............KHHhH', '............KHHHH', '............KjjjJ', '.......KKKKKKjjjj', '.....KKJHHHHHHHHH', '....KHHHHHHHHHHHH', '.....KKjjjjjjjjjj', '.......KKKKKKKKKK'],
    bun: ['', '', '', '', '', '', '', '', '............KKKK', '...........KAaAA', '...........KAAAA', '............KKKK', ''],
    topknot: ['', '', '', '', '', '', '', '', '', '...............KK', '..............KAA', '...............KK', ''],
    straw: ['', '', '', '', '...............KKK', '.............KKTTT', '...........KKTTxTT', '.........KKTTTTTxT', '.......KKTTxTTTTTT', '.....KKTTTTTTxTTTT', '...KKTTxTTTTTTTTTx', '..KKKKKKKKKKKKKKKK', ''],
    horns: ['', '', '', '', '', '', '', '', '.........Ky......', '..........Ky.....', '..........KKy....', '', ''],
    feather: ['', '', '.........r.o.y.o.', '..........roy.yor', '.............KKKK', '............KHHHH', '............KHHHH', '......KKKKKKKjjjj', '....KKHHHHHHHHHHH', '...KHHHHHHHHHHHHH', '....KKjjjjjjjjjjj', '......KKKKKKKKKKK', ''],
  };
  // ---- 얼굴 (11줄) ----
  const FACE_M = ['......b...KAAAAAAA', '......y..KAAaAAAAA', '......b..KAAAAAaAA', '......y..KAsSSAASS', '......b..KASSsKKSS', '......y..KASSKEeSS', '......b..KASSsggSS', '......y..KAsSSSSSS', '.......b.KAsSSSSSt', '.......y..KKsSSSSS', '........b..KKKKsss'];
  const FACE_F = ['.....b..KAAAAAAAAA', '.....y.KAAaAAAAAAA', '.....b.KAaAAAAAaAA', '.....y.KAaAsSSAASS', '.....b.KAaASSKKKSS', '.....y.KAaASSKEeSS', '.....b.KAaASSsggSS', '.....y.KAaAsSSSSSS', '.....b.KAaAKsSSSSM', '.....y.KAaAAKKsSSS', '......bKAaAAA.KKKK'];
  // ---- 몸 (22줄) ----
  const COLLAR = ['RWWsssWWRR', 'RRWWssWRRR', 'RRRWWWRRRR', 'RRRRWWRRRR', 'RRRRRWWRRR', 'RRRRRRWWRR', 'RRRRRRRWWR'];
  const BODY_M = patch(mirror(['..........KKRRRRRR', '........KKRRLRRRRR', '.......KRRLLRRRRRR', '......KRRLRRRRRRRR', '.....KRRLRRRKRRRRR', '.....KRLRRRKRRRRRR', '....KRLLRRRKRRRRRR',
    '....KRLRRRKRBBBBBB', '....KRLRRRKRcccccc', '....KRLRRRKRRRRRRR', '...KRLRRRRKRRRRrRR', '...KRLLRRRKRRRRrRR', '...KRrrrrrKRRRRrRR', '....KKSSKKRRRRRrRR',
    '.....KsSK.KRRRRrRR', '......KK..KRLRRrRR', '.........KRLRRRrRR', '........KRLRRRRrRR', '........KRLRRRRrRR', '.......KRLRRRRrRRR', '.......KrRrRrRrRrR', '.......KKKKKKKKKKK']), 13, 0, COLLAR);
  const BODY_F = patch(mirror(['.......KAaKKRRRRRR', '.......KAaKRRLRRRR', '......KAaKRRLLRRRR', '......KKKRRLRRRRRR', '.....KRRLRRRKRRRRR', '.....KRLRRRKRRRRRR', '....KRLLRRRKRRRRRR',
    '....KRLRRRKKKKKKKK', '....KRLRRRKUUUUUUU', '....KRLRRRKUuUUUUU', '...KRLRRRRKUuUUUUU', '...KRLLRRRKUUuUUUU', '...KRrrrrrKUUuUUUU', '....KKSSKKUUUuUUUU',
    '.....KsSKUUUUuUUUU', '......KKUUuUUUuUUU', '.......KUUuUUUuUUU', '.......KUuUUUuUUUU', '......KUUuUUUuUUUU', '......KUuUUUuUUUuU', '.....KUUuUUuUUUuUU', '.....KKKKKKKKKKKKK']), 13, 0, COLLAR);
  const SACK = ['...KKK..', '..KmNNK.', '.KmNNNNK', 'KNNNnNNK', 'KNNnNNNK', 'KnNNNNnK', '.KnnnnK.', '..KKKK..'];
  const SASH_TAIL = ['oB', 'BBc', '.Bc', '.Bc', '.B.', 'Bc.', 'B..'];
  const GOREUM = ['oB.', 'BBB', 'Bc.', 'B.c', 'B..', 'c..'];
  const SCROLL = ['KKKKKK', 'KTTTTK', 'KTXXTK', 'KTTTxK', 'KTXTTK', 'KTTXxK', 'KTTTxK', 'KKKKKK'];
  const OPEN = ['KK........KK', 'KTTTTTTTTTTK', 'KTXXTXTTXXTK', 'KTTTTTTTTTTK', 'KTXTTXXTXTTK', 'KTTTTTTTTTTK', 'KK........KK'];
  const ARM_FWD = ['KKKKKK..', 'KRLLRRKK', 'KRRRRRRK', 'KrrrrKSSK', '.KKKK.KK.'];
  const HAND = ['KSSK', 'KsSK', '.KK.'];
  const FOOT = ['KFfFK', 'KKKKK'];
  const BADGE = ['KKKK', 'KYOK', 'KOYK', 'KKKK'];
  const LAMP = ['.K.', 'KQK', 'QzQ', 'KqK'];
  const BOOK = ['KKKKK', 'KcBBK', 'KyBBK', 'KcBBK', 'KKKKK'];
  // ---- 계급별 옷 ----
  const LOOKS = [
    { hat: 'gat', R: '#4a4a54', r: '#30303a', L: '#62626e', l: '#7a7a88', B: '#5a5a66', c: '#3a3a44', o: '#7a7a88', U: '#3c3c48', u: '#56566a' },
    { hat: 'gat', B: '#7c1a26', c: '#4e1018', o: '#ac3242' },
    { hat: 'gat', beads: 1 },
    { hat: 'gat', beads: 1, lamp: 1, L: '#6e6e84', l: '#a4a4ba', u: '#6e6e84' },
    { hat: 'gat', beads: 1, lamp: 1, R: '#1c2648', r: '#10172e', L: '#c8a040', l: '#e8c868', U: '#1e2a56', u: '#c8a040' },
    { hat: 'samo', badge: 1, R: '#7a1e28', r: '#4a1018', L: '#a83a44', l: '#d0606a', B: '#1b1a20', c: '#0f0e12', o: '#3a3942', U: '#6a1824', u: '#9a3440' },
    { hat: 'samo', badge: 1, book: 1, R: '#9a1a30', r: '#5e0e1c', L: '#d04a56', l: '#f07a80', B: '#d8a838', c: '#9a7020', o: '#fff0a0', U: '#86162a', u: '#c44450' },
    { hat: 'crown', badge: 1, R: '#1c2a62', r: '#0f183c', L: '#4a68c0', l: '#7a98e6', B: '#d8a838', c: '#9a7020', o: '#fff0a0', U: '#1e2c70', u: '#4a68c0' },
    { hat: 'myeon', badge: 1, R: '#a81c28', r: '#680e18', L: '#e0b040', l: '#fff0a0', B: '#e8b838', c: '#a07010', o: '#fff8c0', U: '#961a26', u: '#e0b040' },
  ];
  function headRows(hatName, face, beads) {
    const hat = HATS[hatName].map(r => (r + '.'.repeat(18)).slice(0, 18));
    let f = face.slice();
    if (!beads) f = f.map(r => r.replace(/[by]/g, '.'));
    return mirror(hat.concat(f));
  }
  // pose: idle 0~3 · walk 0~3 · reap 0~1 · flame · sickle · tired
  function reaper(kind, rank, pose, i) {
    const look = Object.assign({}, LOOKS[Math.min(rank, 8)]);
    const head = headRows(look.hat, kind === 'f' ? FACE_F : FACE_M, look.beads && look.hat === 'gat');
    let body = (kind === 'f' ? BODY_F : BODY_M).map(pad);
    if (kind === 'f') body = patch(body, 19, 4, GOREUM);
    if (look.badge) body = patch(body, 16, kind === 'f' ? 2 : 9, BADGE);
    if (look.lamp) body = patch(body, 1, 13, LAMP);
    const top = 3, by = top + head.length - 1, fy = by + body.length;
    let hb = 0, bob = 0, lf = 0, rf = 0;
    if (pose === 'idle') hb = [0, 0, 1, 1][i % 4];
    if (pose === 'walk') { const k = i % 4; bob = k % 2; hb = bob; lf = k === 0 ? -1 : 0; rf = k === 2 ? -1 : 0; const d = k === 0 ? 1 : k === 2 ? -1 : 0; if (d) body = body.map((r, y) => y >= 17 ? (d > 0 ? '.' + r.slice(0, -1) : r.slice(1) + '.') : r); }
    if (pose === 'reap') hb = i % 2 ? -1 : 0;
    const parts = [[SACK, 26, by + 2 + bob], [FOOT, 12, fy + lf], [FOOT, 19, fy + rf], [body, 0, by + bob]];
    if (kind !== 'f') parts.push([SASH_TAIL, 22, by + 8 + bob]);
    parts.push([head, 0, top + hb]);
    if (pose === 'reap') { parts.push([ARM_FWD, 26, by + 7]); parts.push([OPEN, 30, by + 1 + (i % 2)]); }
    else if (pose === 'flame') { parts.push([['..q..', '.qQ..', '.QzQ.', 'qQzzQ', 'qQzzQ', '.qQq.'], 30, by + 9]); }
    else { parts.push([look.book ? BOOK : SCROLL, look.book ? 27 : 27, by + 10 + bob]); parts.push([HAND, 25, by + 12 + bob]); }
    return compose(44, fy + 3, parts, Object.assign({}, A3_PAL, look));
  }
  // ---- 졸개 (작은 차사 24x30) ----
  const MINI = mirror(['........KKKK', '.......KHHhH', '.......KHHHH', '....KKKKjjjj', '..KKHHHHHHHH', '.Kjjjjjjjjjj', '..KKKKKKKKKK', '......KAAAAA', '.....KAAaAAA', '.....KAsSSSS', '.....KASKESS', '.....KAsSSSS', '......KKsSSt', '.......KKKKs',
    '......KRRRWW', '.....KRLRRRW', '....KRLRRRRR', '....KRLRBBBB', '....KRLRcccc', '....KSSKRRRR', '.....KKRLRRR', '.....KRLRRRR', '....KRLRRRRR', '....KrRrRrRr', '....KKKKKKKK']);
  function mini(pose, i) {
    const k = i % 4, bob = pose === 'walk' ? k % 2 : [0, 0, 1, 1][k], lf = pose === 'walk' && k === 0 ? -1 : 0, rf = pose === 'walk' && k === 2 ? -1 : 0;
    return compose(26, 30, [[['KFK'], 8, 27 + lf], [['KFK'], 13, 27 + rf], [MINI, 1, 2 + bob], [LAMP, 20, 18 + bob]], Object.assign({}, A3_PAL, { R: '#3a4456', r: '#262c38', L: '#56627a', l: '#7482a0', B: '#5a7a9a', c: '#3e5670', E: '#2a1a14' }));
  }
  // ---- 주민: 머리(모자·머리카락·수염)를 통째로 그려 얼굴과 끊김 없이 잇는다 ----
  const FM = FACE_M.map(r => r.replace(/[by]/g, '.')), FF = FACE_F.map(r => r.replace(/[by]/g, '.'));
  const HEADS = {
    jumo: [ // 쪽머리 + 비녀
      '..............KKKK', '.............KAaAA', '.........OYYYKAAAA', '............KAAAAA', '..........KKKAAaAA', '........KKAAAAAAAA',
    ].concat(FF),
    elder: [ // 상투 + 망건 + 흰 눈썹 · 콧수염 · 턱수염
      '................KK', '...............KAA', '...............KAA', '...........KKKKKKK', '..........KjjjjjjJ', '.........KAAjjjjjj',
      '.........KAAaAAAAA', '.........KAAAAAaAA', '.........KAsSSAASS', '.........KASiiiKSS', '.........KASSKEeSS', '.........KASSsggSS',
      '.........KAsSSSSSS', '.........KAsSiiiii', '..........KiiiiIii', '...........KiiiIii', '............KiiIii', '.............KiIii', '..............KiIi', '...............KKI'],
    gob: [ // 뿔 + 덥수룩한 머리
      '.........K........', '.........KY.......', '.........KYK......', '........KAYYK.....', '.......KAAYAKKKKKK', '.......KAaAAAAAaAA',
      '......KAAAaAAAAAAA', '......KAaAAAAaAAAA', '......KAAsSSAAsSSS', '......KAASSsKKSSSS', '......KAASSKEeSSSS', '......KAASSsggSSSS',
      '......KAAsSSSSSSSS', '.......KAsSSKKKKSS', '........KKsSSSSSSS', '..........KKKKssss'],
    boat: [ // 삿갓
      '...............KKK', '.............KKTTT', '...........KKTTxTT', '.........KKTTTTTxT', '.......KKTTxTTTTTT', '.....KKTTTTTTxTTTT',
      '...KKTTxTTTTTTTTTx', '..KKKKKKKKKKKKKKKK'].concat(FM),
    mudang: [ // 깃털 꽂은 전립
      '...............GYo', '..............GYoK', '.............KKKKK', '............KHHhHH', '............KHHHHH', '.......KKKKKKjjjjj',
      '.....KKJHHHHHHHHHH', '....KHHHHHHHHHHHHH', '.....KKjjjjjjjjjjj', '.......KKKKKKKKKKK'].concat(FF),
    sansin: [ // 흰 상투 + 어깨까지 늘어진 흰 머리 + 긴 수염
      '................KK', '...............KAA', '...............KAA', '...........KKKKKKK', '.........KKAAAAAAA', '........KAAAaAAAAA',
      '........KAAAAAAaAA', '........KAAsSSAASS', '........KAASiiiKSS', '........KAASSKEeSS', '........KAASSsggSS', '........KAAsSSSSSS',
      '........KAAsSiiiii', '........KAAKiiiIii', '........KAaAKiiIii', '........KAaAAKiIii', '........KAaAAKiIii', '.........KAaAKKiIi', '..........KKK.KKiI', '...............KKK'],
  };
  const NPCS = {
    jumo: { kind: 'f', apron: 1, pal: { R: '#e8dfd2', r: '#bcae9a', L: '#ffffff', l: '#ffffff', W: '#ffffff', U: '#8a2e30', u: '#b04446', B: '#c8303e', c: '#801c28', o: '#e05a5a' } },
    elder: { kind: 'm', item: 'cane', pal: { R: '#7c7c8c', r: '#5a5a6a', L: '#9a9aaa', l: '#b8b8c6', B: '#4a4a5a', c: '#3a3a48', o: '#6a6a7a', A: '#e8e8ee', a: '#c4c4d0', i: '#f4f4f8', I: '#c8c8d4' } },
    gob: { kind: 'm', item: 'sack', pal: { R: '#3a5a9a', r: '#24406e', L: '#5a7ac0', l: '#7a9ae0', B: '#c83a3a', c: '#8a2222', o: '#e86a6a', A: '#26381e', a: '#466a38', S: '#78c484', s: '#4e9a5a', t: '#3a7a46', Y: '#f0d070' } },
    boat: { kind: 'm', item: 'pole', pal: { R: '#3e5a76', r: '#283e54', L: '#5a7896', l: '#7a98b6', B: '#b89050', c: '#8a6a34', o: '#d8b070', T: '#d4b46a', x: '#a8884a' } },
    mudang: { kind: 'f', item: 'fan', pal: { R: '#2f5ad0', r: '#1e3c94', L: '#5a7ae6', l: '#8aa4ff', U: '#c83444', u: '#e85666', H: '#2a2030', h: '#4a3a50', j: '#1a1420', J: '#3a3046', B: '#f0c040', c: '#b08a20', o: '#fff0a0', G: '#e83a3a', Y: '#ffe08a' } },
    sansin: { kind: 'm', item: 'staff', pal: { R: '#e4eaf4', r: '#b8c2d2', L: '#ffffff', l: '#ffffff', B: '#c8a060', c: '#9a7a40', o: '#e8c890', A: '#f4f6fa', a: '#cfd6e2', i: '#ffffff', I: '#cfd6e2' } },
  };
  // 손에 든 물건 (손 위치 x=25~28, y=by+12 기준으로 이어지게)
  const ITEM_GRID = {
    cane: { rows: ['KnnK', 'Kn..', 'Kn..'].concat(Array.from({ length: 16 }, () => '.nK.')), x: 25, y: 10, behind: 1 },
    pole: { rows: Array.from({ length: 44 }, () => 'KnK'), x: 26, y: -26, behind: 1 },
    staff: { rows: ['.KKK.', 'KnnnK', 'KnKnK', '.KnK.'].concat(Array.from({ length: 22 }, () => '.KnK.')), x: 25, y: 2, behind: 1 },
    sack: { rows: ['...KK....', '..KnnK...', '.KmNNNK..', 'KmNNNNNK.', 'KNNNnNNNK', 'KNNnNNNNK', 'KNNNNNnNK', '.KnnnnnK.', '..KKKKK..'], x: 24, y: 13 },
    fan: { rows: ['KKKKKKK..', 'KGYGYGYK.', '.KGYGYGK.', '..KGYGK..', '...KnK...', '....n....'], x: 22, y: 6 },
  };
  function npc(name) {
    const N = NPCS[name];
    const head = mirror(HEADS[name].map(r => (r + '.'.repeat(18)).slice(0, 18)));
    let body = (N.kind === 'f' ? BODY_F : BODY_M).map(pad);
    if (N.apron) body = patch(body, 13, 8, ['vIIIIIIIIv', 'IIIIIIIIII', 'IIvIIIIvII', 'IIIIIIIIII', 'IIIIIIIIII', 'IvIIIIIIvI', 'IIIIIIIIII', 'vIIIIIIIIv', '.vvvvvvvv.']);
    const H = head.length, chin = { elder: 14, sansin: 14 }[name] || H - 1, top = 3, by = top + 24 - 1, fy = by + body.length, hy = by - chin;
    const it = N.item && ITEM_GRID[N.item];
    const parts = [[FOOT, 12, fy], [FOOT, 19, fy]];
    if (it && it.behind) parts.push([it.rows, it.x, by + it.y]);
    parts.push([body, 0, by]);
    if (N.kind !== 'f') parts.push([SASH_TAIL, 22, by + 8]);
    parts.push([head, 0, hy]);
    if (it && !it.behind) parts.push([it.rows, it.x, by + it.y]);
    parts.push([HAND, 25, by + 12]);
    return compose(44, fy + 3, parts, Object.assign({}, A3_PAL, { E: '#2a1a14', e: '#6a4a3a', g: '#c9a99e' }, N.pal));
  }
  // ---- 원귀 (긴 머리 소복 귀신 26x32) ----
  const WRAITH = ['........KKKKKK..........', '......KKAAAAAAKK........', '.....KAAAaAAAAAAK.......', '....KAAaAAAAAAAAAK......', '....KAaAAiiiiiAAAK......',
    '...KAAaAieeeeeiAAAK.....', '...KAaAAiiEiiiiAaAK.....', '...KAaAAiiiiiiiAaAK.....', '...KAaAAAKiiiKAAaAK.....', '...KAaAAKIIIIIKAaAK.....',
    '..KAAaAKiiiiiiiKaAAK....', '..KAaAKiiiIiiiiiKaAK....', '..KAaAKiiiIiiiiiKaAK....', '.oKAaAKiiiIiiiiiKaAK....', 'oeKAaAKiiiIiiiiiKaAK....',
    'eeKAaKiiiiIiiiiiiKAK....', 'eoKAaKiiiiIiiiiiiKAK....', 'oeKAKiiiiiiIiiiiiKAK....', 'e.KAKiiiiiiIiiiiiiKK....', '..KKiiiiiiiIiiiiiiK.....',
    '...KiiIiiiiIiiiiIiK.....', '...KiiIiiiiiIiiiIiiK....', '..KiiiIiiiiiIiiiIiiK....', '..KkiiIkiiiiIkiiIkiK....', '...KkKKkKKKKkKKKkKK.....'];
  const WRAITH2 = patch(WRAITH, 0, 13, ['_o', 'oe', 'eeo', 'oee', 'eoe', '_oe', 'o_', 'e_']);
  function wraith(i) { return compose(26, 28, [[i % 2 ? WRAITH2 : WRAITH, 1, 1]], Object.assign({}, A3_PAL, { A: '#16141a', a: '#34303c', i: '#f2f4f8', I: '#c4ccd8', k: '#8e98ac', e: '#3a5ad0', o: '#8aa8ff', E: '#ff2e4a' })); }
  // ---- 혼불 (12x14) ----
  const SOUL = [['.....q......', '....qQ......', '....qQq.....', '...qQzQ.....', '...qQzQq....', '..qQzzzQ....', '..qQzZzQq...', '.qQzzZzzQ...', '.qQzZZZzQq..', 'qQzzZZZzzQ..', 'qQzzzZzzzQq.', '.qQzzzzzQq..', '..qQQQQQq...', '....qqq.....'],
    ['......q.....', '.....qQ.....', '.....qQq....', '....qQzQ....', '...qQzQq....', '..qQzzzQ....', '..qQzZzQq...', '.qQzzZzzQ...', '.qQzZZZzQq..', 'qQzzZZZzzQ..', 'qQzzzZzzzQq.', '.qQzzzzzQq..', '..qQQQQQq...', '....qqq.....'],
    ['....q.......', '...qQ.......', '...qQq......', '...qQzQ.....', '...qQzQq....', '..qQzzzQ....', '..qQzZzQq...', '.qQzzZzzQ...', '.qQzZZZzQq..', 'qQzzZZZzzQ..', 'qQzzzZzzzQq.', '.qQzzzzzQq..', '..qQQQQQq...', '....qqq.....']];
  function soul(pal, i) { return bake(SOUL[i % 3], Object.assign({ Z: '#ffffff' }, pal)); }
  return { reaper, mini, npc, wraith, soul, LOOKS };
})();
