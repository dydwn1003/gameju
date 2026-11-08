// ===== 저승사자 · 혼령 · 원귀 · 소품 도트 =====
const SP = (() => {
  // ---------- 꼬마 저승사자 (16x20) ----------
  // 모자: 직급에 따라 갓 → 사모 → 금관 → 면류관
  const HATS = {
    gat: ['........', '.....KKK', '.....KhH', '.....KHH', '.....KDD', '..KKKKDD', '.KGgGGGG', '..KKKKKK'],
    samo: ['........', '........', '......KK', '.....KHH', 'KK..KHhH', 'KhKKKHHH', 'KKKHHHHH', '..KKKKKK'],
    crown: ['........', '....K.Ky', '....KyKy', '....Kyyy', '...KybBy', '...Kyyyy', '...KHHHH', '...KKKKK'],
    myeon: ['........', '.KKKKKKK', '.KHhHHHH', '.KKKKKKK', '.b..KHHH', '.y..KHHH', '.b.KKyyy', '.y.KKKKK'],
  };
  const M_FACE = ['...KSSSS', '...KSSES', '...KSPSS', '....KKKK'];
  const F_FACE = ['..KAAAAA', '..KASSES', '..KAPSSS', '..KAKKKK'];
  const M_BODY = ['...KRRWR', '..KRLRRW', '..KRLBBB', '..KRLRRR', '..KSKRRR', '...KRRRR', '...KKKKK'];
  const F_BODY = ['..KAKRWR', '..KRLRRW', '..KRLRRR', '..KSKUUU', '...KUUuU', '..KUUUuU', '..KKKKKK'];
  // 직급별 옷차림 (색 + 소품)
  const LOOKS = [
    { hat: 'gat', R: '#55556a', L: '#7a7a92', r: '#36364a', B: '#55556a', c: '#36364a', U: '#4a4a60', u: '#66667e' }, // 수습: 회색 옷
    { hat: 'gat', R: '#2a2540', L: '#4a4468', r: '#191626', B: '#c3313e', c: '#7e1f2a', U: '#3a2d55', u: '#55447a' }, // 말단: 붉은 띠
    { hat: 'gat', beads: 1, R: '#2a2540', L: '#4a4468', r: '#191626', B: '#c3313e', c: '#7e1f2a', U: '#3a2d55', u: '#55447a' }, // 차사: 갓끈 구슬
    { hat: 'gat', beads: 1, lamp: 1, R: '#23203a', L: '#9a98b8', r: '#15131f', B: '#c3313e', c: '#7e1f2a', U: '#2e2848', u: '#8a88aa' }, // 선임: 은빛 단 + 초롱
    { hat: 'gat', beads: 1, lamp: 1, R: '#1f2c52', L: '#d4a843', r: '#121a36', B: '#c3313e', c: '#7e1f2a', U: '#24346a', u: '#d4a843' }, // 차사장: 남색 + 금박
    { hat: 'samo', badge: 1, R: '#8a2430', L: '#b8444c', r: '#561520', B: '#1d1a2a', c: '#0f0c18', U: '#7a1e2a', u: '#a83a44' }, // 판관: 붉은 관복 + 사모
    { hat: 'samo', badge: 1, book: 1, R: '#b0203a', L: '#e45a60', r: '#6a1222', B: '#e0b040', c: '#9a7020', U: '#9a1a32', u: '#d84a56' }, // 명부 판관
    { hat: 'crown', badge: 1, R: '#1e2c66', L: '#4a6ac0', r: '#101a40', B: '#e0b040', c: '#9a7020', U: '#22307a', u: '#4a6ac0' }, // 시왕: 금관
    { hat: 'myeon', badge: 1, aura: 1, R: '#b8202c', L: '#f0c040', r: '#701018', B: '#f0c040', c: '#a07010', U: '#a01c28', u: '#f0c040' }, // 염라대왕: 면류관
  ];
  function headRows(kind, look) {
    const h = HATS[look.hat].slice(), f = (kind === 'f' ? F_FACE : M_FACE).slice();
    if (look.beads && look.hat === 'gat') { f[0] = '..b' + f[0].slice(3); f[1] = '..y' + f[1].slice(3); }
    if (kind === 'f') { f[0] = '..KAAAAA'; if (look.beads && look.hat === 'gat') { f[0] = '.bKAAAAA'; f[1] = '.y' + f[1].slice(2); } }
    if (look.hat === 'myeon') { f[0] = '.b' + f[0].slice(2); f[1] = '.y' + f[1].slice(2); }
    return mirror(h.concat(f));
  }
  function bodyRows(kind, look) {
    let b = mirror(kind === 'f' ? F_BODY : M_BODY);
    if (kind === 'f') b = patch(b, 9, 1, ['B', 'Bc', 'B']); // 고름
    else b = patch(b, 10, 3, ['B', 'c']); // 띠 술
    if (look.badge) b = patch(b, 7, kind === 'f' ? 2 : 3, ['yy']);
    if (look.lamp) b = patch(b, 0, 3, ['.K', 'KQ', 'Kq']);
    return b;
  }
  const FOOT = ['KFK'];
  const ITEM = ['n', 'T', 'n'];
  const BOOK = ['KKK', 'KyK', 'KcK'];
  const ARM_UP = ['..KK', '.KRK', 'KRK.', 'KK..'];
  const SCROLL_OPEN = ['n...n', 'TTtTT', 'TtTTt', 'n...n'];
  const FW = 22, OX = 3;
  function reaperFrame(kind, rank, pose, i) {
    const look = LOOKS[Math.min(rank, LOOKS.length - 1)];
    const head = headRows(kind, look), body = bodyRows(kind, look);
    let bob = 0, lf = 0, rf = 0, hb = 0;
    if (pose === 'idle') { bob = 0; hb = [0, 0, 1, 1][i % 4]; }
    if (pose === 'walk') { bob = [0, 1, 0, 1][i % 4]; hb = bob; lf = i % 4 === 0 ? -1 : 0; rf = i % 4 === 2 ? -1 : 0; }
    if (pose === 'reap') { hb = i % 2 ? -1 : 0; }
    const top = 1, by = top + head.length; // 머리 12줄
    const parts = [
      [FOOT, OX + 4, by + body.length + lf],
      [FOOT, OX + 9, by + body.length + rf],
      [body, OX, by + bob],
      [head, OX, top + hb],
    ];
    if (pose !== 'reap') parts.push([look.book ? BOOK : ITEM, OX + 13, by + 3 + bob]);
    else { parts.push([ARM_UP, OX + 12, by - 3]); parts.push([SCROLL_OPEN, OX + 15, by - 7 + (i % 2)]); }
    return compose(FW, by + body.length + 2, parts, { R: look.R, L: look.L, r: look.r, B: look.B, c: look.c, U: look.U, u: look.u });
  }

  // ---------- 혼령 (8x9) ----------
  const SOUL_BASE = [
    '.....q..',
    '....qQ..',
    '...qQq..',
    '..qQzQq.',
    '.qQzzzQq',
    '.qzEzEzq',
    '.qQPzPQq',
    '..qQQQq.',
    '...qqq..',
  ];
  const SOUL = [
    SOUL_BASE,
    patch(SOUL_BASE, 0, 0, ['______q_', '_____qQ_', '____qQq_']),
    patch(SOUL_BASE, 0, 0, ['____q___', '___qQ___', '___qQq__']),
  ];
  const SOUL_PAL = [
    { q: '#3561c9', Q: '#6fb0ff', z: '#d8f6ff' },
    { q: '#1f8f79', Q: '#55e0b3', z: '#d9fff1' },
    { q: '#b07a12', Q: '#ffd34a', z: '#fff7cc' },
    { q: '#9c1c4a', Q: '#ff5d8f', z: '#ffe0ea' },
  ];

  // ---------- 원귀 (14x17) ----------
  const WRAITH = [
    '....KKKKK.....',
    '...KAAAAAK....',
    '..KAaAAAAAK...',
    '..KAaiiiAAAK..',
    '..KAieKiiAAK..',
    '..KAiiiiiAaK..',
    '..KAAijiAAaK..',
    '.KjKAiiiAKaAK.',
    'KjiiiiiiiiijK.',
    'KjjiiiijiiijK.',
    '.KKKiiijiiKK..',
    '...Kiiijiik...',
    '...Kjiijiik...',
    '....Kiijik....',
    '....Kjijk.....',
    '.....Kjk......',
    '......K.......',
  ];
  const WRAITH2 = patch(WRAITH, 0, 13, ['____Kiijik____', '_____Kjijk____', '______Kjk_____', '_______K______']);

  // ---------- 졸개 차사 (10x13) ----------
  const MINI = mirror(['...KK', '..KHH', '.KKKK', 'KGgGG', '.KKKK', '.KSSS', '.KSES', '..KKK', '.KRRW', '.KRBB', '.KRRR', '..KKK']);
  function miniFrame(pose, i) {
    const bob = pose === 'walk' ? [0, 1, 0, 1][i % 4] : [0, 0, 1, 1][i % 4];
    const lf = pose === 'walk' && i % 4 === 0 ? -1 : 0, rf = pose === 'walk' && i % 4 === 2 ? -1 : 0;
    return compose(10, 14, [[['K'], 3, 13 + lf], [['K'], 6, 13 + rf], [MINI, 0, 1 + bob]], { R: '#3b4a5e', L: '#5d7390', r: '#26303e', B: '#6a8fb0' });
  }

  // ---------- 소품 ----------
  const LANTERN = [
    '..KKK..',
    '...K...',
    '.KKKKK.',
    'KcBoBcK',
    'KBoyoBK',
    'KqQzQqK',
    'KqQQQqK',
    '.KKKKK.',
    '...b...',
    '...y...',
  ];
  const JANGSEUNG = [
    '..KKKKK..',
    '.KHhHHHK.',
    'KHHHHHHHK',
    'KnTTTTTnK',
    'KTEKTKETK',
    'KTTTTTTTK',
    'KTnTnTnTK',
    'KTTKKKTTK',
    'KTwTwTwTK',
    'KTTKKKTTK',
    '.KTTTTTK.',
    '.KtTTTtK.',
    '.KTxxxTK.',
    '.KTxTxTK.',
    '.KTxxxTK.',
    '.KTxTxTK.',
    '.KTxxxTK.',
    '.KtTTTtK.',
    '.KTTTTTK.',
    '.KtTTTtK.',
    '.KTTTTTK.',
    'KKKKKKKKK',
  ];
  const BOAT = [
    '..............K.......',
    '..............Kn......',
    '..............Kn......',
    'KK............Kn....KK',
    'KnKKKKKKKKKKKKKKKKKKnK',
    '.KnnnnTnnnnnnnnnTnnnK.',
    '..KxnnnnnnnnnnnnnnxK..',
    '...KKKKKKKKKKKKKKKK...',
  ];

  // ---------- 아이콘 ----------
  const IC_JADE = ['..KKKK..', '.KQQzzK.', 'KQQQQzZK', 'KqQQQQzK', 'KqqQQQQK', '.KqqQQK.', '..KKKK..'];
  const IC_SCROLL = ['nxxxxn', 'TTTTTt', 'TtTtTt', 'TTTTTt', 'TtTTtt', 'nxxxxn'];
  // 성장 메뉴 아이콘 (10px)
  const UI_IC = {
    pen: ['........KK', '.......KnK', '......KnK.', '.....KnK..', '....KnK...', '...KxK....', '..KAAK....', '.KAaK.....', 'KAAK......', 'KK........'],
    step: ['..........', '..........', '..KKKKK...', '.KTtTtTK..', 'KTtTtTtTK.', 'KtTtTtTtTK', 'KTtTtTtTtK', '.KKKKKKKK.'],
    call: ['....q.....', '...qQ.....', '...Qq.....', '..qQQq....', '.qQzzQq...', 'qQzzzzQq..', 'qQzEzEzQ..', 'qQzzzzQq..', '.qQQQQq...', '..qqqq....'],
    hand: ['nn......nn', 'xTTTTTTTTx', 'xTtTtTTtTx', 'xTTTTTTTTx', 'xTtTTtTtTx', 'xTTTTTTTTx', 'nn......nn'],
    luck: ['...KKKK...', '..KbybbK..', '...KBBK...', '..KBBBBK..', '.KBBoBBBK.', 'KBBoyoBBBK', 'KBBBoBBBcK', 'KcBBBBBccK', '.KccccccK.', '..KKKKKK..'],
    minion: ['....KK....', '...KHHK...', '.KKKDDKKK.', 'KGGgGGGGGK', '.KKKKKKKK.', '..KSSSSK..', '..KESSEK..', '..KPSSPK..', '...KKKK...', '..KRRWRK..'],
    drill: ['K.........', 'KBBBo.....', 'KBBBBBo...', 'KBcBBBBB..', 'KBBcBBBo..', 'KBBBBo....', 'K.........', 'K.........', 'K.........', 'K.........'],
    ledger: ['KKKKKKKKK.', 'KcBBBBBBK.', 'KcBTTTTBK.', 'KcBBBBBBK.', 'KcBTTTBBK.', 'KcBBBBBBK.', 'KcByBBBBK.', 'KKKKKKKKK.'],
    gate: ['K.KKKKKK.K', 'KKBBBBBBKK', '.KBKKKKBK.', '.KB....BK.', '.KB....BK.', '.KB....BK.', '.KB....BK.', '.KB....BK.', '.KB....BK.', 'KKKK..KKKK'],
    gear: ['...KK.....', '.K.vvK.K..', 'KvKvvKvvK.', '.KvvvvvK..', 'KvvKKKvvK.', 'KvvK.KvvK.', '.KvvKvvK..', 'KvKvvKvK..', '.K.KvK.K..', '...KK.....'],
    wraith: ['..KKKKK...', '.KAAAAAK..', 'KAAiiiAAK.', 'KAieKiAAK.', 'KAiiiiAAK.', 'KiiiiiiiK.', 'KiijiijiK.', '.KiiiiiK..', '..KjiijK..', '...KKKK...'],
  };
  const cache = {};
  function get(key, fn) { return cache[key] || (cache[key] = fn()); }
  return {
    reaper: (kind, rank, pose, i) => get(`r${kind}${rank}${pose}${i}`, () => reaperFrame(kind, rank, pose, i)),
    LOOKS,
    soul: (tier, i) => get(`s${tier}${i}`, () => bake(SOUL[i % 3], SOUL_PAL[tier])),
    wraith: i => get(`w${i}`, () => bake(i % 2 ? WRAITH2 : WRAITH)),
    mini: (pose, i) => get(`m${pose}${i}`, () => miniFrame(pose, i)),
    lantern: (lit) => get(`l${lit}`, () => bake(LANTERN, lit === 2 ? { B: '#e8b030', c: '#9a6a10', o: '#fff0a0', q: '#c88a10', Q: '#ffd040' } : null)),
    jangseung: () => get('js', () => bake(JANGSEUNG, { E: '#c3313e' })),
    boat: () => get('boat', () => bake(BOAT)),
    ui: name => get(`u${name}`, () => bake(UI_IC[name])),
    icon: name => get(`i${name}`, () => name === 'soul' ? bake(SOUL_BASE) : bake(name === 'jade' ? IC_JADE : IC_SCROLL, { q: '#1f8f5a', Q: '#4fd68f', z: '#c8ffe0', Z: '#ffffff' })),
    SOUL_PAL,
  };
})();
