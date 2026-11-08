// ===== 저승사자 · 혼령 · 원귀 · 소품 도트 =====
const SP = (() => {
  // ---------- 남자 저승사자 ----------
  const M_HEAD = mirror([
    '........KKKK',
    '.......KHHHH',
    '.......KHhHH',
    '.......KHhHH',
    '.......KHhHH',
    '.......KDDDD',
    '..KKKKKKDDDD',
    '.KGGgggGGGGG',
    'KGGGGGGGGGGG',
    '.KKKKKKKKKKK',
    '....b.KDDDDD',
    '....y.KSssss',
    '....b.KSSSSS',
    '....b.KSwESS',
    '....y.KSEESS',
    '....b.KPSSSS',
    '.....bKKSSSm',
    '......bbKKKK',
  ]);
  M_HEAD[16] = M_HEAD[16].slice(0, 12) + 'S' + M_HEAD[16].slice(13);
  const M_BODY = mirror([
    '......KKRWRR',
    '.....KRRRRWR',
    '....KRLRRRRW',
    '...KRLRRrRRR',
    '..KRLRRrRRRR',
    '..KRLRRrBBBB',
    '.KRLRRRroBBB',
    '.KRLRRRrcccc',
    '.KRLRRRrRRRR',
    '.KrRRRrrRRRR',
    '.KKrrrKrRRRR',
    '..KSSKrRRRRR',
    '...KLRRRRRRR',
    '..KRLRRRRRRr',
    '..KKKKKKKKKK',
  ]);
  const COLLAR = ['RWsssWWR', 'RWWsWWRR', 'RRWWWRRR', 'RRRWWWRR', 'RRRRvWWR'];
  // 띠 매듭 + 술 (비대칭)
  const M_BODY2 = patch(patch(M_BODY, 8, 0, COLLAR), 13, 5, [
    ' oB',
    'BBc',
    ' Bc',
    ' B ',
    ' c ',
  ]);

  // ---------- 여자 저승사자 ----------
  const F_HEAD = mirror([
    '............',
    '........KKKK',
    '.......KHHHH',
    '.......KHhHH',
    '.......KDDDD',
    '..KKKKKKDDDD',
    '.KGGgggGGGGG',
    'KGGGGGGGGGGG',
    '.KKKKKKKKKKK',
    '....bKAAAAAA',
    '....KAaAAAAA',
    '...yKAaAAAAS',
    '...bKAaAASSS',
    '...bKAaASSSS',
    '...bKAAKKKSS',
    '...yKAASwESS',
    '...bKAASEESS',
    '....KAAPSSSS',
    '....KAAKSSSM',
    '....KAAAKKKK',
  ]);
  const F_BODY = mirror([
    '....KAAKRWRR',
    '....KAKRRRWR',
    '...KAKRLRRRW',
    '..KRRLRRrRRR',
    '..KRLRRRrRRR',
    '..KRLRRRrRRR',
    '.KRLRRRrKKKK',
    '.KrRRRrKUUUU',
    '.KKrrrKUUuUU',
    '..KSSKUUUuUU',
    '...KKUUUUuUU',
    '...KUUUUUuUU',
    '..KUUUUUUuUU',
    '..KUuUUUUUuU',
    '..KKKKKKKKKK',
  ]);
  // 붉은 고름 + 노리개
  const F_BODY2 = patch(patch(F_BODY, 8, 0, COLLAR), 12, 3, [
    'oB ',
    'BBB',
    'Bc ',
    'B c',
    'B  ',
    '   ',
    '    b',
    '    y',
    '    B',
    '   BBB',
    '   BcB',
  ]);

  const FOOT_L = ['KFFfK', '.KKK.'];
  const FOOT_R = ['KfFFK', '.KKK.'];

  // 명부(두루마리) - 손에 든 모습 / 펼친 모습
  const SCROLL = ['nxn', 'TTt', 'TTt', 'TTt', 'nxn'];
  const SCROLL_OPEN = [
    'nn........nn',
    'xTTTTTTTTTTx',
    'xTtTtTTtTTTx',
    'xTTTTTTTTTTx',
    'xTtTTtTtTTTx',
    'xTTTTTTTTTTx',
    'nn........nn',
  ];
  // 들어 올린 소매(오른쪽) - 몸통 위에 덮어 그림
  const ARM_UP = [
    '......KKK',
    '.....KRLK',
    '....KRLRK',
    '...KRLRRK',
    '..KRLRRK.',
    '.KRLRRrK.',
    'KRLRRrK..',
    'KRRRrK...',
    'KrrrK....',
  ];

  // 프레임 생성: kind 'm' | 'f', pose 'idle'|'walk'|'reap', i 프레임
  const FW = 36, OX = 6; // 명부가 옆으로 튀어나오니 여백
  function reaperFrame(kind, pose, i) {
    const head = kind === 'f' ? F_HEAD : M_HEAD, body = kind === 'f' ? F_BODY2 : M_BODY2;
    const hh = head.length, bh = body.length, H = hh + bh + 2 + 2;
    let bob = 0, lf = 0, rf = 0, hb = 0;
    if (pose === 'idle') { bob = [0, 0, 1, 1][i % 4]; hb = bob; }
    if (pose === 'walk') { bob = [0, 1, 0, 1][i % 4]; hb = bob; lf = i % 4 === 0 ? -2 : 0; rf = i % 4 === 2 ? -2 : 0; }
    if (pose === 'reap') { bob = 0; hb = i % 2 ? -1 : 0; }
    const top = 2, by = top + hh;
    const parts = [
      [FOOT_L, OX + 4, by + bh - 1 + lf + 0],
      [FOOT_R, OX + 15, by + bh - 1 + rf + 0],
      [body, OX, by + bob],
      [head, OX, top + hb],
    ];
    if (pose !== 'reap') parts.push([SCROLL, OX + 19, by + 10 + bob]);
    else {
      parts.push([ARM_UP, OX + 16, by - 4]);
      parts.push([SCROLL_OPEN, OX + 22, by - 9 + (i % 2)]);
    }
    return compose(FW, H, parts);
  }

  // ---------- 혼령 ----------
  const SOUL_BASE = [
    '.......qq...',
    '......qQq...',
    '.....qQq....',
    '.....qQ.....',
    '....qQQq....',
    '...qQzzQq...',
    '..qQzzzzQq..',
    '.qQzZzzzzQq.',
    '.qQzEzzEzQq.',
    '.qQPzzzzPQq.',
    '.qQQzzzzQQq.',
    '..qQQzzQQq..',
    '...qqQQqq...',
    '.....qq.....',
  ];
  const SOUL = [
    SOUL_BASE,
    patch(SOUL_BASE, 0, 0, ['________qq__', '_______qQq__', '______qQq___', '_____qQq____']),
    patch(SOUL_BASE, 0, 0, ['______qq____', '_____qQq____', '_____qQq____', '_____qQ_____']),
  ];
  // 혼령 등급 색 (일반/푸른/황금/붉은)
  const SOUL_PAL = [
    { q: '#3561c9', Q: '#6fb0ff', z: '#d8f6ff' },
    { q: '#1f8f79', Q: '#55e0b3', z: '#d9fff1' },
    { q: '#b07a12', Q: '#ffd34a', z: '#fff7cc' },
    { q: '#9c1c4a', Q: '#ff5d8f', z: '#ffe0ea' },
  ];

  // ---------- 원귀 (소복 귀신) ----------
  const WRAITH = [
    '........KKKKKK..........',
    '......KKAAAAAAKK........',
    '.....KAAAaAAAAAAK.......',
    '....KAAaAAAAAAAAAK......',
    '....KAaAAAiiiiAAAAK.....',
    '...KAAaAiiiiiiiAAAK.....',
    '...KAaAAieKiiiiAAAAK....',
    '...KAaAAiiiiijiAaAAK....',
    '...KAaAAAiikkiAAaAAK....',
    '...KAaAAAAiiiAAAaAAK....',
    '..KAAaAAKKjjjKKAaAAAK...',
    '..KAaAAKiiiiiiiKaAAAK...',
    '.KjiiKKiiiiiiiiiKKiijK..',
    'Kjiiiiiiiiijiiiiiiiiijk.',
    'Kjjiiiiiiiijiiiiiiiijjk.',
    '.KkjjKiiiiijiiiiiiKjkK..',
    '..KKKKiiiiijiiiiiiKKK...',
    '......Kiiiiijiiiiik.....',
    '......Kiiiijiiiiiik.....',
    '.......Kiiijiiiiik......',
    '.......Kjiijiiiijk......',
    '........Kiijiiijk.......',
    '........Kjiiijjk........',
    '.........Kjijk.K........',
    '..........Kjk...........',
    '...........K............',
  ];
  // ---------- 졸개 차사 (작은 부하) ----------
  const MINI = mirror([
    '.....KK',
    '....KHH',
    '....KHh',
    '.KKKKDD',
    'KGGgGGG',
    '.KKKKKK',
    '...KSSS',
    '...KSES',
    '...KPSS',
    '....KKK',
    '...KRRW',
    '..KRLRR',
    '..KRLBB',
    '..KRLRR',
    '..KSKRR',
    '...KKKK',
  ]);
  const MINI_FOOT = ['KFK', '.K.'];
  function miniFrame(pose, i) {
    const bob = pose === 'walk' ? [0, 1, 0, 1][i % 4] : [0, 0, 1, 1][i % 4];
    const lf = pose === 'walk' && i % 4 === 0 ? -1 : 0, rf = pose === 'walk' && i % 4 === 2 ? -1 : 0;
    return compose(14, 19, [[MINI_FOOT, 3, 16 + lf], [MINI_FOOT, 8, 16 + rf], [MINI, 0, 1 + bob]], { R: '#3b4a5e', L: '#5d7390', r: '#26303e', B: '#6a8fb0' });
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
    reaper: (kind, pose, i) => get(`r${kind}${pose}${i}`, () => reaperFrame(kind, pose, i)),
    soul: (tier, i) => get(`s${tier}${i}`, () => bake(SOUL[i % 3], SOUL_PAL[tier])),
    wraith: i => get(`w${i}`, () => bake(i % 2 ? patch(WRAITH, 0, 21, ['_______Kiijiiijk', '_______Kjiiijjk_', '_________Kjik_K_', '__________Kk____', '___________K____']) : WRAITH)),
    mini: (pose, i) => get(`m${pose}${i}`, () => miniFrame(pose, i)),
    lantern: (lit) => get(`l${lit}`, () => bake(LANTERN, lit === 2 ? { B: '#e8b030', c: '#9a6a10', o: '#fff0a0', q: '#c88a10', Q: '#ffd040' } : null)),
    jangseung: () => get('js', () => bake(JANGSEUNG, { E: '#c3313e' })),
    boat: () => get('boat', () => bake(BOAT)),
    ui: name => get(`u${name}`, () => bake(UI_IC[name])),
    icon: name => get(`i${name}`, () => name === 'soul' ? bake(SOUL_BASE) : bake(name === 'jade' ? IC_JADE : IC_SCROLL, { q: '#1f8f5a', Q: '#4fd68f', z: '#c8ffe0', Z: '#ffffff' })),
    SOUL_PAL,
  };
})();
