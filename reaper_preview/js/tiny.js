// ===== 탑다운 맵용 작은 도트 (16x20): 앞 · 뒤 · 옆 3방향 + 걷기 =====
const TINY_PAL = Object.assign({}, R2_PAL, { U: '#22202a', u: '#3a3846', Y: '#ffe08a', O: '#c89a30', G: '#e83a3a', I: '#d8d4cc' });
const Tiny = (() => {
  const HAT = {
    gat: mirror(['.....KKK', '.....KHh', '.....KHH', '..KKKKjj', '.KHHHHHH', '..KKKKKK']),
    samo: mirror(['........', '.....KKK', '....KHhH', 'KK..KHHH', 'KHKKjjjj', 'KK.KKKKK']),
    crown: mirror(['.....K.K', '....KYKY', '....KYYY', '....KOGY', '....KYYY', '....KKKK']),
    myeon: mirror(['.KKKKKKK', '.KHHHHHH', '.KKKKKKK', '.O..KHHH', '.Y..KYYY', '.O..KKKK']),
    none: mirror(['', '', '', '', '', '']).map(() => '................'),
    bun: mirror(['', '', '......KK', '.....KAA', '....KKAA', '....KAAA']),
    topknot: mirror(['', '', '.......K', '......KA', '....KKKK', '....KAAA']),
    straw: mirror(['.......K', '.....KKT', '...KKTTT', '.KKTTxTT', 'KKKKKKKK', '....KAAA']),
    horns: mirror(['', '', '...KY...', '....KY..', '....KAAA', '...KAAAA']),
    feather: mirror(['......GY', '.....KKK', '....KHHH', '..KKKjjj', '.KHHHHHH', '..KKKKKK']),
  };
  const pad16 = r => (r + '................').slice(0, 16);
  const FACE_D = mirror(['....KAAA', '...bKSSS', '...yKSES', '...bKsSS', '....bKKK']);
  const FACE_DF = mirror(['...KAAAA', '...KASSS', '...KASES', '...KAsSS', '...KAKKK']);
  const FACE_U = mirror(['....KAAA', '...bKAAA', '...yKAaA', '...bKAAA', '....bKKK']);
  const FACE_UF = mirror(['...KAAAA', '...KAAAA', '...KAaAA', '...KAAAA', '...KAAAA']);
  const BODY_D = patch(mirror(['....KRRR', '...KRRLR', '..KRRLRR', '..KRRBBB', '..KSRRRR', '...KRRRR', '...KRrRr', '...KKKKK']), 7, 0, ['WW', '.W']);
  const BODY_DF = mirror(['...KARRR', '...KRRLR', '..KRRLRR', '..KRRRRR', '..KSUUUU', '...KUUuU', '..KUuUUu', '..KKKKKK']);
  const BODY_U = patch(mirror(['....KRRR', '...KRRLR', '..KRRLRR', '..KRRBBB', '..KSRRRR', '...KRRRR', '...KRrRr', '...KKKKK']), 6, 1, ['KmNK', 'mNNn', 'KnnK']);
  const BODY_UF = patch(mirror(['...KAAAA', '...KAAAA', '..KRAAAA', '..KRRAAR', '..KSUUUU', '...KUUuU', '..KUuUUu', '..KKKKKK']), 6, 1, ['KmNK', 'mNNn']);
  // 옆모습 (오른쪽을 봄)
  const SIDE_HEAD = ['......KAAAK.....', '.....bKAASSK....', '.....yKAASEK....', '.....bKAsSSK....', '......KKKKK.....'];
  const SIDE_HEAD_F = ['.....KAAAAK.....', '....KAAASSK.....', '....KAAASEK.....', '....KAAsSSK.....', '....KAAKKKK.....'];
  const SIDE_BODY = ['.....KRRWK......', '....KRRLRK......', '...KmKRLRRK.....', '...KNKBBBBK.....', '...KnKRRSK......', '.....KRRRK......', '.....KrRrK......', '.....KKKKK......'];
  const SIDE_BODY_F = ['....KAKRWK......', '....KAKRLK......', '...KmKRLRRK.....', '...KNKRRRRK.....', '...KnKUUSK......', '....KUUuUK......', '....KUuUUUK.....', '....KKKKKKK.....'];
  const LOOKS = Art3.LOOKS;
  function head(dir, kind, hatName, beads) {
    let face = dir === 'up' ? (kind === 'f' ? FACE_UF : FACE_U) : dir === 'side' ? (kind === 'f' ? SIDE_HEAD_F : SIDE_HEAD) : (kind === 'f' ? FACE_DF : FACE_D);
    if (!beads) face = face.map(r => r.replace(/[by]/g, '.'));
    return HAT[hatName].map(pad16).concat(face.map(pad16));
  }
  function body(dir, kind) {
    if (dir === 'side') return (kind === 'f' ? SIDE_BODY_F : SIDE_BODY).map(pad16);
    if (dir === 'up') return (kind === 'f' ? BODY_UF : BODY_U).map(pad16);
    return (kind === 'f' ? BODY_DF : BODY_D).map(pad16);
  }
  // pose: idle · walk(0~3) · reap
  function person(spec, dir, pose, i) {
    const hd = head(dir, spec.kind, spec.hat, spec.beads), bd = body(dir, spec.kind);
    const k = i % 4, bob = pose === 'walk' ? k % 2 : pose === 'idle' && k >= 2 ? 1 : 0;
    let lf = 0, rf = 0;
    if (pose === 'walk') { lf = k === 0 ? -1 : 0; rf = k === 2 ? -1 : 0; }
    const fy = 11 + bd.length - 1;
    const feet = dir === 'side' ? [[['KF'], 6 + (k === 0 ? -1 : k === 2 ? 1 : 0), fy + 1], [['KF'], 8 + (k === 0 ? 1 : k === 2 ? -1 : 0), fy + 1]] : [[['KF'], 5, fy + 1 + lf], [['FK'], 9, fy + 1 + rf]];
    const parts = feet.concat([[bd, 0, 11 + bob], [hd, 0, bob]]);
    if (spec.extra) spec.extra.forEach(e => parts.push([e[2], e[0], e[1] + bob]));
    if (pose === 'reap' && dir !== 'up') parts.push([['KTK', 'TxT', 'KTK'], dir === 'side' ? 11 : 12, 12]);
    return compose(16, fy + 3, parts, Object.assign({}, TINY_PAL, spec.pal || {}));
  }
  function reaper(kind, rank, dir, pose, i) {
    const look = LOOKS[Math.min(rank, 8)];
    return person({ kind, hat: look.hat, beads: look.beads && look.hat === 'gat', pal: look }, dir, pose, i);
  }
  const NPC_SPEC = {
    jumo: { kind: 'f', hat: 'bun', pal: { R: '#e8dfd2', r: '#bcae9a', L: '#ffffff', l: '#ffffff', W: '#ffffff', U: '#8a2e30', u: '#b04446' } },
    elder: { kind: 'm', hat: 'topknot', pal: { R: '#7c7c8c', r: '#5a5a6a', L: '#9a9aaa', B: '#4a4a5a', A: '#eeeeee', a: '#c8c8d4' }, extra: [[6, 8, ['iiii', '.ii.']]] },
    gob: { kind: 'm', hat: 'horns', pal: { R: '#3a5a9a', r: '#24406e', L: '#5a7ac0', B: '#c83a3a', A: '#26381e', S: '#78c484', s: '#4e9a5a', Y: '#f0d070' } },
    boat: { kind: 'm', hat: 'straw', pal: { R: '#3e5a76', r: '#283e54', L: '#5a7896', B: '#b89050', T: '#d4b46a', x: '#a8884a' } },
    mudang: { kind: 'f', hat: 'feather', pal: { R: '#2f5ad0', r: '#1e3c94', L: '#5a7ae6', U: '#c83444', u: '#e85666', H: '#2a2030', h: '#4a3a50', j: '#1a1420', J: '#3a3046' } },
    sansin: { kind: 'm', hat: 'topknot', pal: { R: '#e4eaf4', r: '#b8c2d2', L: '#ffffff', B: '#c8a060', A: '#ffffff', a: '#dce2ee' }, extra: [[6, 8, ['iiii', 'iiii', '.ii.']]] },
  };
  function npc(name, i) {
    const S = NPC_SPEC[name];
    return person(Object.assign({}, S, { pal: Object.assign({ E: '#2a1a14', i: '#f8f8fc' }, S.pal) }), 'down', 'idle', i || 0);
  }
  // 졸개 (12x16)
  const MINI_D = mirror(['....KK', '....KH', '.KKKjj', 'KHHHHH', '.KKKKK', '...KSS', '...KES', '....KK', '...KRW', '..KRBB', '..KSRR', '...KRR', '...KKK']);
  const MINI_U = mirror(['....KK', '....KH', '.KKKjj', 'KHHHHH', '.KKKKK', '...KAA', '...KAA', '....KK', '...KRR', '..KRBB', '..KSRR', '...KRR', '...KKK']);
  function mini(dir, pose, i) {
    const k = i % 4, bob = pose === 'walk' ? k % 2 : 0, lf = pose === 'walk' && k === 0 ? -1 : 0, rf = pose === 'walk' && k === 2 ? -1 : 0;
    return compose(12, 16, [[['K'], 4, 13 + lf], [['K'], 7, 13 + rf], [dir === 'up' ? MINI_U : MINI_D, 0, bob]], Object.assign({}, TINY_PAL, { R: '#3a4456', r: '#262c38', L: '#56627a', B: '#5a7a9a', E: '#2a1a14' }));
  }
  const WRAITH = ['....KKKK....', '...KAAAAK...', '..KAAiiiAK..', '..KAieKiAK..', '..KAiiiiAK..', '..KAAiiAAK..', '.KAAiiiiAAK.', '.KAiiiiiiAK.', '.KAiiiiiiAK.', '..KiiiiiiK..', '..KiiiiiiK..', '...KiiiiK...', '...KiKiK....', '....K.K.....'];
  function wraith(i) { return bake(i % 2 ? patch(WRAITH, 0, 12, ['___KiiK_____', '____KK______']) : WRAITH, Object.assign({}, TINY_PAL, { A: '#16141a', i: '#f2f4f8', e: '#ff2e4a' })); }
  const SOUL = [['...q...', '..qQ...', '..qQq..', '.qQzQ..', '.qQzQq.', 'qQzZzQ.', 'qQzzzQq', '.qQzQq.', '..qqq..'], ['....q..', '...qQ..', '..qQq..', '.qQzQ..', '.qQzQq.', 'qQzZzQ.', 'qQzzzQq', '.qQzQq.', '..qqq..'], ['..q....', '..qQ...', '..qQq..', '.qQzQ..', '.qQzQq.', 'qQzZzQ.', 'qQzzzQq', '.qQzQq.', '..qqq..']];
  function soul(pal, i) { return bake(SOUL[i % 3], Object.assign({ Z: '#ffffff' }, pal)); }
  return { reaper, npc, mini, wraith, soul };
})();
