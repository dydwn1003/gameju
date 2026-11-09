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
  // ---------- 꽃밭 (16x16: 흙두둑 + 단계별 식물) ----------
  const PLANT = [
    ['..........', '..........', '..........', '..........', '..........', '..........', '...g..g...', '....gg....', '....G.....', '....G.....'],
    ['..........', '..........', '....pP....', '....PP....', '....G.....', '..g.G.g...', '...gGg....', '....G.....', '....G.....', '....G.....'],
    ['..........', '...pPPp...', '..pPPPPp..', '...PPPP...', '....G.....', '.gg.G.gg..', '..ggGgg...', '....G.....', '....G.....', '....G.....'],
    ['..P...P...', '.PPP.PPP..', '..PPyPP...', '.PPyyyPP..', '..PPyPP...', '.PP.G.PP..', '..g.G.g...', '...gGg....', '....G.....', '....G.....'],
  ];
  const SOIL = ['................', '..nnnnnnnnnnnn..', '.nxnnxnnnxnnxnn.', 'nxxnxxnxnxxnxxnn', 'xxnxxxxnxxxnxxxx', '.xxxxxxxxxxxxxx.'];
  function plantFrame(stage, pal) {
    const parts = [[SOIL, 0, 10]];
    if (stage >= 0) parts.push([PLANT[stage], 3, 1]);
    return compose(16, 16, parts, Object.assign({ G: '#2f6a3a', g: '#5ec46a', n: '#6a4a2e', x: '#3e2a1a' }, pal));
  }

  // ---------- 특별 혼령 (도감, 10x11) ----------
  const PAD = SOUL_BASE.map(r => '.' + r + '.'); while (PAD.length < 11) PAD.unshift('..........');
  const SP_ACC = [
    [5, 1, ['BB', 'B.']], // 아이: 댕기
    [3, 9, ['iiii', '.ii.']], // 할아버지: 수염
    [2, 0, ['..KK..', 'KKKKKK']], // 선비: 갓
    [3, 0, ['y.y.', 'yByy']], // 신부: 족두리
    [3, 0, ['.B..', 'KKKK']], // 군졸: 전립
    [1, 1, ['..TTTT..', 'TTttTTTT']], // 어부: 삿갓
    [8, 7, ['Bb', 'BB']], // 상인: 주머니
    [2, 9, ['b.b.b.']], // 스님: 염주
    [0, 4, ['P.', 'PP', 'P.']], // 무희: 부채
    [8, 8, ['TT', '.T']], // 주정뱅이: 술잔
    [2, 1, ['q....q', 'qq..qq']], // 고양이: 귀
    [1, 4, ['n.......n', 'n.......n']], // 강아지: 귀
    [4, 0, ['g.', 'gg']], // 약초꾼: 잎
    [2, 0, ['.yyyy.', 'yyByyy']], // 장군: 투구
    [6, 1, ['y', 'yB']], // 기생: 비녀
    [2, 1, ['y....y', 'y....y']], // 도깨비: 뿔
    [1, 2, ['y......y', '.y....y.']], // 용: 뿔·수염
    [0, 0, []], // 태고: 큰 보랏빛
  ];
  const SP_PAL = [0, 0, 0, 3, 0, 1, 2, 0, 3, 3, 1, 0, 1, 2, 3, 1, 2, -1];
  function specialFrame(i) {
    const rows = SP_ACC[i][2].length ? patch(PAD, SP_ACC[i][0], SP_ACC[i][1], SP_ACC[i][2]) : PAD;
    const pal = SP_PAL[i] < 0 ? { q: '#5a2a9a', Q: '#a070ff', z: '#eadcff' } : SOUL_PAL[SP_PAL[i]];
    return bake(rows, Object.assign({}, pal, { n: '#d8c090' }));
  }

  // ---------- 주민 · 동물 ----------
  const NPC = {
    jumo: { rows: mirror(['..KKK', '.KAAA', '.KAaA', 'KAAAA', 'KASSS', 'KASES', '.KSPS', '..KKK', '.KWWW', 'KWWBB', 'KSKUU', '.KUWW', '.KUWW', 'KUUWW', 'KKKKK']), pal: { U: '#8a3a3a', W: '#efe6d8' } },
    elder: { rows: mirror(['.....', '..KKK', '.KiSS', '.KiSS', '.KSES', '.KSSS', '..Kii', '..Kii', '.KjjW', 'KjjjW', 'KSKjj', '.Kjjj', '.Kjjj', '.Kjjj', '.KKKK']), pal: { j: '#8a8aa0', i: '#f0f0f0' }, cane: 1 },
    gob: { rows: mirror(['.y...', '.yK..', '.KOOO', 'KOOOO', 'KOEOO', 'KOOwO', '.KOOO', '..KKK', '.KBBB', 'KBBcB', 'KOKBB', '.KTTT', '.KTTT', '.KTTT', '.KKKK']), pal: { O: '#5ec46a', B: '#3a6ab0', c: '#24447a', T: '#c8a060', w: '#ffffff', E: '#1a1024' } },
    mudang: { rows: mirror(['..K.K', '.KyKy', '.KBBB', 'KAAAA', 'KASSS', 'KASES', '.KSPS', '..KKK', '.KBWW', 'KBBRR', 'KSKRR', '.KRBR', '.KRBR', 'KRRBR', 'KKKKK']), pal: { B: '#3a6ae0', R: '#e04050', W: '#f0f0f0', y: '#ffd34a' } },
    sansin: { rows: mirror(['..KKK', '.KiiK', 'KiiSS', 'KiSES', 'KiSSS', '.Kiii', 'KWiii', 'KWWii', 'KWWWW', 'KSWWW', '.KWWW', '.KWWW', 'KWWWW', 'KWWWW', 'KKKKK']), pal: { W: '#e8eef8', i: '#ffffff' }, cane: 1 },
    boat: { rows: mirror(['.KKKK', 'KTTTT', 'KtTTT', '..KKK', '..KSS', '..KSE', '...KK', '..KRR', '.KRRR', '.KSRR', '..KRR', '..KRR', '..KRR', '..KRR', '..KKK']), pal: { R: '#3a4a5a', T: '#c8a860', t: '#9a7a40' } },
  };
  const CAT = [['.K..K...', 'KAKKAK..', 'KAEAEK..', 'KAAAAKK.', '.KAAAAAK', '.KKKKKK.'], ['.K..K...', 'KAKKAK..', 'KAKAKK..', 'KAAAAK.K', '.KAAAAAK', '.KKKKKK.']];
  const CROW = [['..KK..', '.KKEK.', 'KKKKKy', '.KKK..', '..y...'], ['K....K', 'KK..KK', '.KKKK.', '..KEKy', '..KK..']];

  // ---------- 펫 (10x9 몸통 4종 + 장식) ----------
  const PET_BODY = {
    bird: ['....KKKK..', '...KHHHHK.', '...KHHEHKy', '..KBBHHHK.', '.KBBBbBBK.', 'KBBBbbBBK.', 'KBBBBBBK..', '.KKbbKK...', '...y.y....'],
    quad: ['......K.K.', '.....KHKHK', '.....KHHHK', 'K....KHHEK', 'BK..KBBHHK', '.BKKBBBBK.', '..KBBbBBK.', '..KBbbBBK.', '..KK.KK...'],
    round: ['..........', '...KKKK...', '..KBBBBK..', '.KBEBBEBK.', '.KBBBBBBK.', 'KBBbbbbBBK', 'KBbbbbbbBK', '.KBBBBBBK.', '..KK..KK..'],
    dragon: ['.......y.y', '......KHHK', '.....KHHEK', '..KK.KHHHy', '.KBBKKBBK.', 'KBbBBBBbK.', 'KBBK.KbBBK', '.KK...KBBK', '........KK'],
  };
  const PET_ACC = {
    wing: [2, 0, ['.yy.yy', 'y..y..']], longear: [5, 0, ['.K.K', 'KHKH']], beak: [8, 3, ['y']], mask: [6, 2, ['bbbb']],
    shag: [4, 3, ['b.b.b']], tuft: [3, 0, ['K....K']], shell: [2, 2, ['.bbbb.', 'bBbbBb']], horn: [7, 0, ['y']],
    crest: [5, 0, ['.yy', 'y..']], stripe: [4, 5, ['b.b.']], fire: [0, 3, ['y', 'oy']],
  };
  function petFrame(pet, i) {
    if (typeof PET_ART !== 'undefined' && PET_ART[pet.id]) { const A = PET_ART[pet.id]; return compose(16, 14, [[A.rows, 1, i % 2 ? 1 : 0]], Object.assign({ E: '#1a1024', w: '#ffffff', P: '#ff9ab0' }, A.pal)); }
    let rows = PET_BODY[pet.kind].slice();
    if (pet.acc && PET_ACC[pet.acc]) { const [x, y, r] = PET_ACC[pet.acc]; rows = patch(rows, x, y, r); }
    if (i % 2) rows = pet.kind === 'bird' || pet.kind === 'dragon' ? patch(rows, 0, 4, [pet.kind === 'bird' ? '.KbbbBBK..' : '.KBBKKBBK.']) : rows;
    return compose(12, 11, [[rows, 1, i % 2 ? 1 : 2]], Object.assign({ E: '#1a1024', o: '#ff7a30' }, pet.pal));
  }

  const cache = {};
  function get(key, fn) { return cache[key] || (cache[key] = fn()); }
  return {
    reaper: (kind, rank, pose, i) => get(`r${kind}${rank}${pose}${i}`, () => reaperFrame(kind, rank, pose, i)),
    LOOKS,
    soul: (tier, i) => get(`s${tier}${i}`, () => bake(SOUL[i % 3], SOUL_PAL[tier])),
    wraith: i => get(`w${i}`, () => bake(i % 2 ? WRAITH2 : WRAITH)),
    plant: (stage, pal, key) => get(`p${key}${stage}`, () => plantFrame(stage, pal)),
    special: i => get(`sp${i}`, () => specialFrame(i)),
    npc: name => get(`n${name}`, () => { const N = NPC[name]; return compose(12, 16, [[N.rows, 1, 1]].concat(N.cane ? [[['K', 'n', 'n', 'n', 'n', 'n', 'n'], 11, 8]] : []), N.pal); }),
    cat: i => get(`cat${i}`, () => bake(CAT[i % 2], { A: '#3a3a4a', E: '#ffd34a' })),
    crow: i => get(`crow${i}`, () => bake(CROW[i % 2], { E: '#ff5a5a' })),
    pet: (pet, i) => get(`pet${pet.id}${i % 2}`, () => petFrame(pet, i)),
    mini: (pose, i) => get(`m${pose}${i}`, () => miniFrame(pose, i)),
    lantern: (lit) => get(`l${lit}`, () => bake(LANTERN, lit === 2 ? { B: '#e8b030', c: '#9a6a10', o: '#fff0a0', q: '#c88a10', Q: '#ffd040' } : null)),
    jangseung: () => get('js', () => bake(JANGSEUNG, { E: '#c3313e' })),
    boat: () => get('boat', () => bake(BOAT)),
    ui: name => get(`u${name}`, () => bake(UI_IC[name])),
    icon: name => get(`i${name}`, () => name === 'soul' ? bake(SOUL_BASE) : bake(name === 'jade' ? IC_JADE : IC_SCROLL, { q: '#1f8f5a', Q: '#4fd68f', z: '#c8ffe0', Z: '#ffffff' })),
    SOUL_PAL,
  };
})();
