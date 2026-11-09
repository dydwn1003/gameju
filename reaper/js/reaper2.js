// ===== 저승사자 시안 v3 (참고 그림 기반: 큰 갓 · 갓끈 구슬 · 붉은 눈 · 붉은 띠 · 등 자루 · 명부 · 혼불) =====
const R2_PAL = {
  K: '#0b0a0e', H: '#1b1a20', h: '#3a3942', j: '#0f0e12', J: '#2c2b33',
  A: '#16141a', a: '#2e2b35',
  S: '#ecd6c6', s: '#c9a99e', t: '#a07f7a',
  E: '#d81e2e', e: '#ff7070', g: '#3a0a10',
  R: '#1f1e25', r: '#121116', L: '#34333d', l: '#4c4a58',
  W: '#cfcbd4', v: '#8e8a98',
  B: '#7c1a26', c: '#4e1018', o: '#ac3242',
  N: '#6e4c30', n: '#4a3220', m: '#906c48',
  T: '#ebdfb4', x: '#bcab7a', X: '#5a4a30',
  F: '#3a3944', f: '#6a6878',
  b: '#2c2a33', y: '#6a6876',
  Q: '#3a8cff', q: '#1a48d0', z: '#c4ecff',
  M: '#8a8a96', i: '#d8d8e4', p: '#5a3a24',
};
const Reaper2 = (() => {
  const W = 36;
  const pad = r => (r + '.'.repeat(W)).slice(0, W);
  // 머리: 갓 13줄 + 얼굴 11줄 (왼쪽 절반 18칸 → 대칭)
  const HEAD = mirror([
    '............KKKKKK',
    '...........KHHhHHH',
    '...........KHHhHHH',
    '...........KHHhHHH',
    '...........KHHHHHH',
    '...........KHHHHHH',
    '...........KjjjjjJ',
    '.....KKKKKKKjjjjjj',
    '...KKJJJHHHHHHHHHH',
    '.KKHHJHHHHHHHHHHHH',
    'KHHHHHHHHHHHHHHHHH',
    '.KKjjjjjjjjjjjjjjj',
    '...KKKKKKKKKKKKKKK',
    '......b...KAAAAAAA',
    '......y..KAAaAAAAA',
    '......b..KAAAAAaAA',
    '......y..KAsSSAASS',
    '......b..KASSsKKSS',
    '......y..KASSKEeSS',
    '......b..KASSsggSS',
    '......y..KAsSSSSSS',
    '.......b.KAsSSSSSt',
    '.......y..KKsSSSSS',
    '........b..KKKKsss',
  ]);
  // 몸 22줄
  const BODY = patch(mirror([
    '..........KKRRRRRR',
    '........KKRRLRRRRR',
    '.......KRRLLRRRRRR',
    '......KRRLRRRRRRRR',
    '.....KRRLRRRKRRRRR',
    '.....KRLRRRKRRRRRR',
    '....KRLLRRRKRRRRRR',
    '....KRLRRRKRBBBBBB',
    '....KRLRRRKRcccccc',
    '....KRLRRRKRRRRRRR',
    '...KRLRRRRKRRRRrRR',
    '...KRLLRRRKRRRRrRR',
    '...KRrrrrrKRRRRrRR',
    '....KKSSKKRRRRRrRR',
    '.....KsSK.KRRRRrRR',
    '......KK..KRLRRrRR',
    '.........KRLRRRrRR',
    '........KRLRRRRrRR',
    '........KRLRRRRrRR',
    '.......KRLRRRRrRRR',
    '.......KrRrRrRrRrR',
    '.......KKKKKKKKKKK',
  ]), 13, 0, ['RWWsssWWRR', 'RRWWssWRRR', 'RRRWWWRRRR', 'RRRRWWRRRR', 'RRRRRWWRRR', 'RRRRRRWWRR', 'RRRRRRRWWR']);
  const SACK = ['...KKK..', '..KmNNK.', '.KmNNNNK', 'KNNNnNNK', 'KNNnNNNK', 'KnNNNNnK', '.KnnnnK.', '..KKKK..'];
  const SASH_TAIL = ['oB', 'BBc', '.Bc', '.Bc', '.B.', 'Bc.', 'B..'];
  const SCROLL = ['KKKKKK', 'KTTTTK', 'KTXXTK', 'KTTTxK', 'KTXTTK', 'KTTXxK', 'KTTTxK', 'KKKKKK'];
  const SICKLE = ['.....KKKKK....', '...KKiiiiiKK..', '..KiiMMMMMiiK.', '.KiMKK...KKMK.', 'KiMK.......KK.', 'KMK...........', 'KK.....Kp.....', '.......Kp.....', '......Kp......', '......Kp......', '.....Kp.......', '.....Kp.......'];
  const ARM_UP = ['.....KK', '....KRLK', '...KRLRK', '..KRLRK.', '.KRLRK..', 'KRLRK...', 'KRRK....', 'KKK.....'];
  const HAND = ['KSSK', 'KsSK', '.KK.'];
  const FLAME = ['..q..', '.qQ..', '.QzQ.', 'qQzzQ', 'qQzzQ', '.qQq.'];
  const FOOT = ['KFfFK', 'KKKKK'];
  // pose: idle0/1 · walk0..3 · scroll · flame · sickle · tired
  function frame(pose) {
    const H = HEAD.length, top = 4, by = top + H - 1, fy = by + BODY.length;
    let hb = 0, bob = 0, lf = 0, rf = 0;
    if (pose === 'idle1') hb = 1;
    if (pose.startsWith('walk')) { const k = +pose.slice(4); bob = k % 2; hb = bob; lf = k === 0 ? -1 : 0; rf = k === 2 ? -1 : 0; }
    if (pose === 'tired') { hb = 2; bob = 1; }
    let body = BODY.map(pad);
    if (pose.startsWith('walk')) { const k = +pose.slice(4), d = k === 0 ? 1 : k === 2 ? -1 : 0; if (d) body = body.map((r, y) => y >= 17 ? (d > 0 ? '.' + r.slice(0, -1) : r.slice(1) + '.') : r); }
    const parts = [
      [SACK, 26, by + 2 + bob],
      [FOOT, 12, fy + lf], [FOOT, 19, fy + rf],
      [body, 0, by + bob],
      [SASH_TAIL, 22, by + 8 + bob],
      [HEAD.map(pad), 0, top + hb],
    ];
    if (pose === 'scroll' || pose.startsWith('idle') || pose.startsWith('walk')) { parts.push([SCROLL, 27, by + 10 + bob]); parts.push([HAND, 25, by + 12 + bob]); }
    if (pose === 'scroll') parts.push([FLAME, 31, by + 4]);
    if (pose === 'flame') { parts.push([FLAME, 30, by + 9]); parts.push([FLAME, 2, by + 9]); }
    if (pose === 'sickle') { parts.push([ARM_UP, 24, by + 1]); parts.push([SICKLE, 24, by - 11]); }
    if (pose === 'tired') parts.push([['.K.', 'KzK', '.K.'], 6, top + 8]);
    return compose(40, fy + 3, parts, R2_PAL);
  }
  return { frame, POSES: ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'scroll', 'flame', 'sickle', 'tired'] };
})();
