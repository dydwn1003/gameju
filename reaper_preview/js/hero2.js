// ===== 저승사자 고해상도 도트 (28x42, 바람의나라 풍 2.5등신) =====
// 좌우 대칭 바탕은 왼쪽 절반(14칸)만 적고 mirror()로 펼친 뒤 비대칭 장식을 덧그린다.
const HERO_PAL = {
  K: '#140f1f', // 외곽선
  H: '#221d33', h: '#3c3656', j: '#120e1c', // 갓
  G: '#2c2742', g: '#4e4772', // 갓 챙 (대나무 결)
  A: '#1b1628', a: '#3d3557', // 머리카락
  S: '#f8ebe0', s: '#e2c9bd', t: '#c0a3a0', // 피부
  E: '#2a1430', e: '#8a3a6e', w: '#ffffff', P: '#f2a2ac', m: '#a8485a', M: '#d8384c', // 눈 · 볼 · 입
  W: '#f2eef8', v: '#c4bcd6', // 동정
  b: '#e0a840', y: '#fff0a0', // 구슬
  F: '#1a1724', f: '#3c3556', // 신
  T: '#f2e4bc', n: '#7a5030', x: '#c8b080', // 두루마리
};
const HeroArt = (() => {
  // ---- 모자 (14칸 절반 · 10줄) ----
  const HAT = {
    gat: [
      '.........KKKKK', '........KhhHHH', '........KhHHHH', '........KHHHHH', '........KjjjjK',
      '...KKKKKKjjjjj', '.KKGgGgGgGgGgG', 'KGgGgGgGgGgGgG', '.KKjjjjjjjjjjj', '...KKKKKKKKKKK'],
    samo: [
      '..............', '..........KKKK', '.........KhHHH', '.........KhHHH', '..KKK...KHHHHH',
      '.KhHHK.KHHHHHH', 'KhHHHHKHHHHHHH', '.KHHHKKjjjjjjj', '..KKK.Kjjjjjjj', '......KKKKKKKK'],
    crown: [
      '.......K..K..K', '......KyK.KyKy', '......KbyKbyby', '......Kbbbbbbb', '.....KbyBbbyBb',
      '.....Kbbbbbbbb', '.....KyyyyyyKK', '.....KHHHHHHHH', '.....KjjjjjjjK', '.....KKKKKKKKK'],
    myeon: [
      '..KKKKKKKKKKKK', '..KHhHHHHHHHHH', '..KKKKKKKKKKKK', '..b.y...KHHHHH', '..y.b...KHhHHH',
      '..b.y...KHHHHH', '..y.b..KbbbbbB', '..b.y..KyyyyyB', '.......KKKKKKK', '..............'],
  };
  // ---- 얼굴 · 머리 (10줄) ----
  const FACE_M = [
    '....b.KAAAAAAA', '....y.KAAaSSSS', '....b.KASKKSSS', '....y.KASSSSSS', '....b.KASKKKSS',
    '....y.KASwEESS', '....b.KASEeESS', '.....bKAPPSSSm', '......bKKSSSSS', '.......bbKKKKK'];
  const FACE_F = [
    '...KKAAAAAAAAA', '..KAAaAAAaAAAA', '..KAaASSSSSSSA', '..KAaSKKKKSSSS', '..KAaSwEESSSSS',
    '..KAASEeESSSSS', '..KAAPPPSSSSSS', '..KAASSSSSSSSM', '..KAAKKSSSSSSS', '..KAaAAKKKKKKK'];
  // ---- 몸 (20줄) ----
  const BODY_M = [
    '......KKRRWWSS', '.....KRRLRRWWS', '....KRRLRRRRWW', '...KRRLRRRRRRW', '..KRRLRRrRRRRR',
    '..KRLRRrRRRRRR', '..KRLRrKBBBBBB', '.KRLRRrKcccccc', '.KRLRRrKRRRRRR', '.KRLRRrKRRRRRR',
    'KRLlRRrKRRRRRR', 'KRLRRrrKRRRRrR', 'KrRRRrrKRRRRrR', 'KKrrrrKKRRRRrR', '.KSSsK.KRRRrRR',
    '..KKK..KRRrRRR', '......KRRRrRRR', '.....KRRRrRRRR', '.....KrLrRrRrR', '.....KKKKKKKKK'];
  const BODY_F = [
    '..KAaKKRRWWSSS', '..KAaKRRLRWWSS', '..KAKRRLRRRRWW', '..KKRRLRRRRRRW', '..KRRLRRrRRRRR',
    '..KRLRRrRRRRRR', '..KRLRrRRRRRRR', '.KRLRRrKKKKKKK', '.KRLRRrKUUUUUU', '.KRLRRrKUUuUUU',
    'KRLlRRrKUUuUUU', 'KRLRRrrKUUUuUU', 'KrRRRrrKUUUuUU', 'KKrrrrKUUUUuUU', '.KSSsKKUUuUUuU',
    '..KKKKUUUUuUUU', '....KUUuUUUuUU', '...KUUUuUUUuUU', '...KUuUUuUUuUU', '...KKKKKKKKKKK'];
  const FOOT = ['KFFfK', 'KKKKK'];
  // 비대칭 장식
  const SASH_TAIL = ['oB', 'BBc', '.Bc', '.B.', '.c.'];
  const GOREUM = ['oB.', 'BBB', 'Bc.', 'B.c', 'B..', 'c..'];
  const NORIGAE = ['.b.', '.y.', 'BBB', 'BcB', '.B.', 'B.B'];
  const SCROLL = ['nxn', 'TTx', 'TTx', 'TTx', 'TTx', 'nxn'];
  const BOOK = ['KKKK', 'KcBK', 'KyBK', 'KcBK', 'KKKK'];
  const ARM_UP = ['......KKK', '.....KRLK', '....KRLRK', '...KRLRRK', '..KRLRRK.', '.KRLRrK..', 'KRLRrK...', 'KRRrK....', 'KrrK.....', 'KKK......'];
  const SCROLL_OPEN = ['nn........nn', 'xTTTTTTTTTTx', 'xTxTTxTTxTTx', 'xTTTTTTTTTTx', 'xTTxTTxTxTTx', 'xTTTTTTTTTTx', 'nn........nn'];
  const LAMP = ['.K.', 'KQK', 'QzQ', 'KqK'];
  // 직급별 옷 (색 + 모자 + 장식)
  const LOOKS = [
    { hat: 'gat', R: '#5a5a70', r: '#3a3a4c', L: '#7c7c96', l: '#9a9ab4', B: '#5a5a70', c: '#3a3a4c', o: '#7c7c96', U: '#4a4a62', u: '#6a6a84' },
    { hat: 'gat', R: '#26213a', r: '#16131f', L: '#3e3860', l: '#575080', B: '#c8303e', c: '#841c28', o: '#ff6a5e', U: '#3a2d58', u: '#56467c' },
    { hat: 'gat', beads: 1, R: '#26213a', r: '#16131f', L: '#3e3860', l: '#575080', B: '#c8303e', c: '#841c28', o: '#ff6a5e', U: '#3a2d58', u: '#56467c' },
    { hat: 'gat', beads: 1, lamp: 1, R: '#22203a', r: '#14121f', L: '#8a88aa', l: '#b8b6d4', B: '#c8303e', c: '#841c28', o: '#ff6a5e', U: '#2e2848', u: '#8a88aa' },
    { hat: 'gat', beads: 1, lamp: 1, R: '#1e2c56', r: '#111a38', L: '#d4a843', l: '#f0d070', B: '#c8303e', c: '#841c28', o: '#ff6a5e', U: '#24346c', u: '#d4a843' },
    { hat: 'samo', badge: 1, R: '#8e2632', r: '#5a1620', L: '#bc464e', l: '#e06a70', B: '#1d1a2a', c: '#0f0c18', o: '#3a3550', U: '#7c1e2c', u: '#a83a46' },
    { hat: 'samo', badge: 1, book: 1, R: '#b2203a', r: '#6c1222', L: '#e45a62', l: '#ff8a8a', B: '#e0b040', c: '#9a7020', o: '#fff0a0', U: '#9a1a32', u: '#d84a56' },
    { hat: 'crown', badge: 1, R: '#1e2c6a', r: '#101a42', L: '#4a6ac4', l: '#7a9ae8', B: '#e0b040', c: '#9a7020', o: '#fff0a0', U: '#22307e', u: '#4a6ac4' },
    { hat: 'myeon', badge: 1, R: '#ba202c', r: '#72101a', L: '#f0c040', l: '#fff0a0', B: '#f0c040', c: '#a07010', o: '#fff8c0', U: '#a21c2a', u: '#f0c040' },
  ];
  function head(kind, look) {
    let hat = HAT[look.hat].slice(), face = (kind === 'f' ? FACE_F : FACE_M).slice();
    if (!(look.beads && look.hat === 'gat')) face = face.map(r => r.replace(/[by]/g, '.'));
    if (kind === 'f' && look.beads && look.hat === 'gat') face = face.map((r, i) => i < 8 ? (i % 2 ? '.y' : '.b') + r.slice(2) : r);
    return mirror(hat.concat(face));
  }
  function body(kind, look) {
    let b = mirror(kind === 'f' ? BODY_F : BODY_M);
    if (kind === 'f') { b = patch(b, 16, 2, GOREUM); b = patch(b, 18, 9, NORIGAE); }
    else b = patch(b, 17, 6, SASH_TAIL);
    if (look.badge) b = patch(b, 12, kind === 'f' ? 4 : 3, ['KKKK', 'KyyK', 'KybK', 'KKKK']);
    if (look.lamp) b = patch(b, 0, 13, LAMP);
    return b;
  }
  // ---- 졸개 차사 (16x20) ----
  const MINI = mirror(['.....KKK', '....KhHH', '....KHHH', '..KKKjjj', '.KGgGgGG', '..KKKKKK', '...KAAAA', '...KASSS', '...KASES', '...KAPSS', '....KKKK',
    '...KRRWW', '..KRLRRW', '..KRLBBB', '..KRLRRR', '..KSKRRR', '...KRRRR', '...KKKKK']);
  function mini(pose, i) {
    const bob = pose === 'walk' ? [0, 1, 0, 1][i % 4] : [0, 0, 1, 1][i % 4];
    const lf = pose === 'walk' && i % 4 === 0 ? -1 : 0, rf = pose === 'walk' && i % 4 === 2 ? -1 : 0;
    return compose(16, 21, [[['KFK'], 4, 18 + lf], [['KFK'], 9, 18 + rf], [MINI, 0, 1 + bob]], Object.assign({}, HERO_PAL, { R: '#3b4a60', L: '#5d7392', r: '#26303e', B: '#6a8fb0' }));
  }
  // ---- 주민 (22x32): 공통 머리 · 몸 + 머리모양/모자/소품 ----
  const N_HEAD = mirror(['....KKKKKKK', '...KAAAAAAA', '..KAAaAAAAA', '..KAaAAAAAA', '..KASSSSSSS', '..KASSSSSSS', '..KASKKKSSS', '..KASwEESSS', '..KASEeESSS', '..KAPPSSSSm', '...KKSSSSSS', '.....KKKKKK']);
  const N_BODY = mirror(['......KCWWS', '.....KCCCWW', '....KCCDCCW', '...KCCDCCCC', '...KCDCCCCC', '..KCCDCBBBB', '..KCDCCKDDD', '..KCDCCKDDD', '.KCDCCKDDDD', '.KCCCKKDdDD', '.KSSK.KDDdD', '..KK..KDDDd', '.....KDDDDD', '.....KDdDDD', '....KDDDdDD', '....KDdDDdD', '....KKKKKKK']);
  const NPC = {
    jumo: { pal: { C: '#f0e8dc', D: '#a83c3c', d: '#7a2a2a', B: '#d84a5a', A: '#1b1628' },
      over: [[5, 0, ['......KKKKK', '.....KAaAAAK', '.....KAAAAAK', '......KKKKK.']], [15, 1, ['yyyy', 'Kb']], [7, 22, ['KWWWWWWK', 'KWWWWWWK', 'KWvWWvWK', 'KWWWWWWK', '.KKKKKK.']]] },
    elder: { pal: { C: '#9a9ab0', D: '#7a7a90', d: '#5a5a70', B: '#5a4a6a', A: '#f4f4f4', a: '#c8c8d8' },
      over: [[9, 0, ['.KKKK.', 'KAAAAK']], [7, 19, ['..KWWWWK', '.KWWWWWWK', '..KWWWWK.', '...KWWK..']]], cane: 1 },
    gob: { pal: { C: '#3a6ab0', D: '#c8a060', d: '#9a7a40', B: '#e04040', A: '#2a3a20', a: '#4a6a3a', S: '#6ec47a', s: '#4a9a5a', P: '#ff8a8a', E: '#1a1024', e: '#ffd34a' },
      over: [[4, 0, ['.y..........y', 'Ky..........yK', '.Ky........yK.']], [14, 18, ['..KKK', '.KTTTK', 'KTTxTTK', 'KTTTTTK', '.KKKKK']]] },
    boat: { pal: { C: '#4a6a8a', D: '#3a4a5a', d: '#2a3442', B: '#c8a060', A: '#2a2030' },
      over: [[0, 0, ['.......KKKKKKKK.......', '....KKTTTTTTTTTTKK....', '..KKTTxTTxTTxTTxTTKK..', 'KKTTTTTTTTTTTTTTTTTTKK', '.KKKKKKKKKKKKKKKKKKKK.']], [20, 6, ['n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n']]] },
    mudang: { pal: { C: '#3a6ae0', D: '#e04050', d: '#a02a3a', B: '#f0c040', A: '#1b1628' },
      over: [[4, 0, ['.....KKKKKKKKKKKK', '...KKHHHHHHHHHHHHKK', '..KHHHHHHHHHHHHHHHK', '...KKKKKKKKKKKKKKK']], [6, -3, ['r.o.y.r.o.y']], [16, 15, ['.KKK', 'KyByK', 'KByBK', '.KnK.', '..n..']]] },
    sansin: { pal: { C: '#eef2fa', D: '#d8e0ee', d: '#b8c4d8', B: '#c8a060', A: '#ffffff', a: '#dde4f0' },
      over: [[2, 3, ['KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK']], [17, 3, ['KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK', 'KAK']], [7, 9, ['.KAAAAAAK', 'KAAaAAAAAK', 'KAAAAaAAAK', '.KAAAAAAK.', '..KAAAAK..', '...KAAK...', '....KK....']]], cane: 1 },
  };
  function npc(name) {
    const N = NPC[name];
    let rows = N_HEAD.concat(N_BODY);
    (N.over || []).forEach(([x, y, r]) => { if (y >= 0) rows = patch(rows, x, y, r); });
    const parts = [[['KFFK'], 6, 30], [['KFFK'], 12, 30], [rows, 0, 2]];
    (N.over || []).forEach(([x, y, r]) => { if (y < 0) parts.push([r, x, 2 + y + 3]); });
    if (N.cane) parts.push([['nK', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.', 'n.'], 20, 16]);
    return compose(24, 33, parts, Object.assign({}, HERO_PAL, { r: '#ff5a5a', o: '#40a060', H: '#2a2030', h: '#4a3a50', T: '#d8b870', x: '#a88a50' }, N.pal));
  }
  // ---- 혼령 (12x13) ----
  const SOUL = ['......qq....', '.....qQq....', '....qQzq....', '....qQq.....', '...qQQQq....', '..qQzzzQq...', '.qQzZzzzQq..', 'qQzzzzzzzQq.', 'qQzEzzzEzQq.', 'qQzPzzzPzQq.', '.qQzzzzzQq..', '..qQQQQQq...', '....qqq.....'];
  const SOUL_F = [SOUL, patch(SOUL, 0, 0, ['_______qq___', '______qQq___', '_____qQzq___', '_____qQq____']), patch(SOUL, 0, 0, ['_____qq_____', '____qQq_____', '___qQzq_____', '____qQq_____'])];
  function soul(pal, i) { return bake(SOUL_F[i % 3], pal); }
  // ---- 원귀 (22x28) ----
  const WRAITH = [
    '.......KKKKKKK........', '.....KKAAAAAAAKK......', '....KAAAaAAAAAAAK.....', '...KAAaAAAAAAAAAAK....', '...KAaAAAiiiiAAAAAK...',
    '..KAAaAiiiiiiiAAAAK...', '..KAaAAieKiiiiiAAAAK..', '..KAaAAiiiiiijiAaAAK..', '..KAaAAAiikkiiAAaAAK..', '..KAaAAAAiiiiAAAaAAK..',
    '.KAAaAAKKjjjjKKAaAAAK.', '.KAaAAKiiiiiiiiKaAAAK.', 'KjiiKKiiiiiiiiiiKKiijK', 'Kjiiiiiiiiijiiiiiiiijk', 'KjjiiiiiiiijiiiiiiijjK',
    '.KkjjKiiiiijiiiiiKjkK.', '..KKKKiiiiijiiiiiKKK..', '......Kiiiiijiiiiik...', '......Kiiiijiiiiiik...', '.......Kiiijiiiiik....',
    '.......Kjiijiiiijk....', '........Kiijiiijk.....', '........Kjiiijjk......', '.........Kjijk.K......', '..........Kjk.........', '...........K..........'];
  const WRAITH2 = patch(WRAITH, 0, 21, ['________Kiijiiijk_____', '_________Kjiijjk______', '__________Kjik_K______', '___________Kk_________', '______________________']);
  function wraith(i) { return bake(i % 2 ? WRAITH2 : WRAITH, { A: '#1b1628', a: '#3d3557', i: '#e8eef8', j: '#a9b6cc', k: '#6c7891', e: '#ff2e4a', K: '#140f1f' }); }
  const W = 36, OX = 4;
  function frame(kind, rank, pose, i) {
    const look = LOOKS[Math.min(rank, LOOKS.length - 1)], hd = head(kind, look), bd = body(kind, look);
    let hb = 0, bob = 0, lf = 0, rf = 0;
    if (pose === 'idle') hb = [0, 0, 1, 1][i % 4];
    if (pose === 'walk') { bob = [0, 1, 0, 1][i % 4]; hb = bob; lf = i % 4 === 0 ? -1 : 0; rf = i % 4 === 2 ? -1 : 0; }
    if (pose === 'reap') hb = i % 2 ? -1 : 0;
    const top = 3, by = top + hd.length - 1, fy = by + bd.length;
    const parts = [[FOOT, OX + 8, fy + lf], [FOOT, OX + 15, fy + rf], [bd, OX, by + bob], [hd, OX, top + hb]];
    if (pose !== 'reap') parts.push([look.book ? BOOK : SCROLL, OX + 24, by + 13 + bob]);
    else { parts.push([ARM_UP, OX + 20, by - 3]); parts.push([SCROLL_OPEN, OX + 23, by - 10 + (i % 2)]); }
    return compose(W, fy + 3, parts, Object.assign({}, HERO_PAL, { R: look.R, r: look.r, L: look.L, l: look.l, B: look.B, c: look.c, o: look.o, U: look.U, u: look.u, Q: '#6fb0ff', q: '#3561c9', z: '#e0f6ff' }));
  }
  return { frame, LOOKS, mini, npc, soul, wraith };
})();
