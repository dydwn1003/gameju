// ===== 펫(저승사자를 보좌하는 영물) 뽑기: C ~ SSS =====
// 펫은 하나 데리고 다니며 수확량 · 이동속도 · 수확속도를 올려준다. 모은 펫 종류마다 수확량 +0.5%.
const PET_GRADES = {
  C: { rate: 0.58, col: '#a0a6b8', total: 0.05, dup: 3 },
  B: { rate: 0.28, col: '#5ac06a', total: 0.1, dup: 5 },
  A: { rate: 0.10, col: '#4a9aff', total: 0.18, dup: 10 },
  S: { rate: 0.03, col: '#c070ff', total: 0.32, dup: 30 },
  SS: { rate: 0.008, col: '#ffb030', total: 0.55, dup: 60 },
  SSS: { rate: 0.002, col: '#ff4a6a', total: 0.95, dup: 120 },
};
const PET_ORDER = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
// 등급이 높을수록 확률이 가파르게 낮아짐: C 58 · B 28 · A 10 · S 3 · SS 0.8 · SSS 0.2 (%)
const EMPH = { v: [0.7, 0.15, 0.15], w: [0.2, 0.6, 0.2], r: [0.2, 0.2, 0.6], all: [0.34, 0.33, 0.33] };
const PETS = [
  { id: 'kkachi', name: '아기 까치', g: 'C', kind: 'bird', e: 'v', pal: { H: '#2a2a3a', B: '#2a2a3a', b: '#f0f0f0', y: '#e0a030' }, desc: '반가운 소식을 물어오는 까치' },
  { id: 'daram', name: '다람쥐', g: 'C', kind: 'quad', e: 'w', pal: { H: '#a0683a', B: '#a0683a', b: '#e8c8a0' }, desc: '쪼르르 앞장서 길을 찾는다' },
  { id: 'bandi', name: '반딧불이', g: 'C', kind: 'round', e: 'r', pal: { B: '#3a4a2a', b: '#f0f070', y: '#fffbb0' }, acc: 'wing', desc: '혼령을 비춰 빨리 찾게 해준다' },
  { id: 'dukk', name: '새끼 두꺼비', g: 'C', kind: 'round', e: 'v', pal: { B: '#6a9a4a', b: '#c8d890' }, desc: '복을 부르는 두꺼비' },
  { id: 'tokki', name: '달토끼', g: 'C', kind: 'quad', e: 'w', pal: { H: '#f0f0f8', B: '#f0f0f8', b: '#ffc0d0' }, acc: 'longear', desc: '달에서 내려온 토끼' },
  { id: 'byeong', name: '병아리', g: 'C', kind: 'round', e: 'r', pal: { B: '#ffd84a', b: '#fff0a0', y: '#ff8a30' }, acc: 'beak', desc: '삐약삐약 부지런한 병아리' },
  { id: 'neoguri', name: '너구리', g: 'B', kind: 'quad', e: 'v', pal: { H: '#7a6a5a', B: '#7a6a5a', b: '#2a2a2a' }, acc: 'mask', desc: '꾀 많은 너구리' },
  { id: 'sapsal', name: '삽살개', g: 'B', kind: 'quad', e: 'w', pal: { H: '#e0c890', B: '#e0c890', b: '#b89a60' }, acc: 'shag', desc: '귀신을 쫓는 삽살개' },
  { id: 'heukmyo', name: '검은 고양이', g: 'B', kind: 'quad', e: 'r', pal: { H: '#2a2838', B: '#2a2838', b: '#4a4660', E: '#ffd34a' }, desc: '저승길을 아는 고양이' },
  { id: 'buheong', name: '부엉이', g: 'B', kind: 'bird', e: 'v', pal: { H: '#8a6a40', B: '#8a6a40', b: '#e0c8a0', y: '#ffb030', E: '#ffd34a' }, acc: 'tuft', desc: '밤눈 밝은 부엉이' },
  { id: 'geobuk', name: '아기 거북', g: 'B', kind: 'round', e: 'r', pal: { B: '#3a7a5a', b: '#8ac870' }, acc: 'shell', desc: '오래 사는 십장생 거북' },
  { id: 'haechi', name: '아기 해치', g: 'A', kind: 'quad', e: 'v', pal: { H: '#e0b040', B: '#e0b040', b: '#3a9a6a', y: '#3a9a6a' }, acc: 'horn', desc: '옳고 그름을 가리는 해치' },
  { id: 'yeowoo', name: '여우', g: 'A', kind: 'quad', e: 'w', pal: { H: '#ff8a3a', B: '#ff8a3a', b: '#fff0e0' }, desc: '날쌘 여우' },
  { id: 'hak', name: '학', g: 'A', kind: 'bird', e: 'r', pal: { H: '#f8f8ff', B: '#f8f8ff', b: '#2a2a3a', y: '#e0a030' }, acc: 'crest', desc: '천 년을 사는 학' },
  { id: 'baekho', name: '아기 백호', g: 'A', kind: 'quad', e: 'v', pal: { H: '#f0f0f8', B: '#f0f0f8', b: '#2a2a3a' }, acc: 'stripe', desc: '서쪽을 지키는 백호의 새끼' },
  { id: 'samjok', name: '삼족오', g: 'S', kind: 'bird', e: 'v', pal: { H: '#1a1428', B: '#1a1428', b: '#e0a030', y: '#ffd34a', E: '#ff4a4a' }, acc: 'crest', aura: '#ffd34a', desc: '태양에 사는 세 발 까마귀' },
  { id: 'bulyeo', name: '불여우', g: 'S', kind: 'quad', e: 'all', pal: { H: '#ff4a2a', B: '#ff4a2a', b: '#ffd040' }, acc: 'fire', aura: '#ff7a30', desc: '꼬리에 여우불을 단 여우' },
  { id: 'cheongryong', name: '아기 청룡', g: 'S', kind: 'dragon', e: 'r', pal: { H: '#3a8ae0', B: '#3a8ae0', b: '#a0e0ff', y: '#ffd34a' }, aura: '#6fb0ff', desc: '동쪽을 지키는 청룡의 새끼' },
  { id: 'girin', name: '기린', g: 'SS', kind: 'quad', e: 'all', pal: { H: '#ffd060', B: '#ffd060', b: '#ff8a5a', y: '#ffffff' }, acc: 'horn', aura: '#ffe08a', desc: '성인이 나타날 때 오는 영물' },
  { id: 'bonghwang', name: '봉황', g: 'SS', kind: 'bird', e: 'v', pal: { H: '#ff5a4a', B: '#ff5a4a', b: '#ffd34a', y: '#3aa0ff' }, acc: 'crest', aura: '#ff9a6a', desc: '태평성대를 알리는 봉황' },
  { id: 'hwangryong', name: '아기 황룡', g: 'SSS', kind: 'dragon', e: 'all', pal: { H: '#ffd040', B: '#ffd040', b: '#fff0b0', y: '#ff5a4a' }, aura: '#ffd34a', desc: '하늘의 중심을 지키는 황룡의 새끼' },
// ---- 새 영물 32종 (C 10 · B 8 · A 5 · S 4 · SS 3 · SSS 2) ----
  { id: 'chamsae', name: '참새', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#8a6040", "B": "#8a6040", "b": "#f0e0c8", "y": "#3a2a1e"}, desc: '처마 밑에서 재잘대는 참새' },
  { id: 'saengjwi', name: '생쥐', g: 'C', kind: 'quad', e: 'w', pal: {"H": "#9a9aa8", "B": "#9a9aa8", "b": "#f0e8ec", "y": "#ff9ab0"}, desc: '곳간을 지키는 꼬마 생쥐' },
  { id: 'cheonggae', name: '청개구리', g: 'C', kind: 'round', e: 'r', pal: {"H": "#4ac86a", "B": "#4ac86a", "b": "#e8f8c0", "y": "#2a8a4a"}, desc: '비 오는 날 우는 청개구리' },
  { id: 'ori', name: '아기 오리', g: 'C', kind: 'round', e: 'w', pal: {"H": "#fffaf0", "B": "#fffaf0", "b": "#ffffff", "y": "#ff9a2a"}, desc: '뒤뚱뒤뚱 따라오는 오리' },
  { id: 'bungeo', name: '붕어', g: 'C', kind: 'round', e: 'v', pal: {"H": "#8a9aa8", "B": "#8a9aa8", "b": "#e0e8ec", "y": "#5a6a7a"}, desc: '연못에 사는 은빛 붕어' },
  { id: 'bakjwi', name: '박쥐', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#4a3a5a", "B": "#4a3a5a", "b": "#8a7a9a", "y": "#2a2034"}, desc: '밤하늘을 나는 박쥐' },
  { id: 'dwaeji', name: '꼬마 돼지', g: 'C', kind: 'round', e: 'v', pal: {"H": "#f4a8b4", "B": "#f4a8b4", "b": "#ffd4dc", "y": "#d07888"}, desc: '복을 부르는 꼬마 돼지' },
  { id: 'gosum', name: '고슴도치', g: 'C', kind: 'round', e: 'w', pal: {"H": "#c8a070", "B": "#c8a070", "b": "#f0dcc0", "y": "#2a1a14"}, desc: '가시로 원귀를 콕콕' },
  { id: 'nabi', name: '호랑나비', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#2a2030", "B": "#2a2030", "b": "#ffd060", "y": "#2a2030"}, desc: '꽃밭을 맴도는 호랑나비' },
  { id: 'yeomso', name: '아기 염소', g: 'C', kind: 'quad', e: 'v', pal: {"H": "#f0ecf4", "B": "#f0ecf4", "b": "#ffffff", "y": "#a07a4a"}, desc: '풀밭의 꼬마 염소' },
  { id: 'sudal', name: '수달', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#7a5a3a", "B": "#7a5a3a", "b": "#e8d0b0", "y": "#5a4028"}, desc: '물살을 가르는 수달' },
  { id: 'kkamagwi', name: '까마귀', g: 'B', kind: 'bird', e: 'r', pal: {"H": "#1a1828", "B": "#1a1828", "b": "#3a3650", "y": "#5a5a6a"}, desc: '저승 소식을 전하는 까마귀' },
  { id: 'kkotsasum', name: '꽃사슴', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#c88a4a", "B": "#c88a4a", "b": "#fff0d8", "y": "#e0c890"}, desc: '등에 꽃무늬가 핀 사슴' },
  { id: 'baekgu', name: '백구', g: 'B', kind: 'quad', e: 'v', pal: {"H": "#f4f2ec", "B": "#f4f2ec", "b": "#ffffff", "y": "#d8d0c0"}, desc: '충직한 진돗개 백구' },
  { id: 'geumbung', name: '금붕어', g: 'B', kind: 'round', e: 'v', pal: {"H": "#ff7a2a", "B": "#ff7a2a", "b": "#fff0c0", "y": "#e04a1a"}, desc: '복을 헤엄치는 금붕어' },
  { id: 'haneul', name: '하늘다람쥐', g: 'B', kind: 'quad', e: 'r', pal: {"H": "#b8b0a0", "B": "#b8b0a0", "b": "#fff8ec", "y": "#4a4030"}, desc: '나무 사이를 활공한다' },
  { id: 'chijeu', name: '치즈 고양이', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#ffb048", "B": "#ffb048", "b": "#ffe0a8", "y": "#e08a2a"}, desc: '햇볕을 좋아하는 노랑이' },
  { id: 'bandal', name: '아기 반달곰', g: 'B', kind: 'quad', e: 'v', pal: {"H": "#2a2632", "B": "#2a2632", "b": "#f0ece0", "y": "#c8a080"}, desc: '가슴에 반달을 품은 곰' },
  { id: 'baeksa', name: '백사', g: 'A', kind: 'dragon', e: 'r', pal: {"H": "#f4f4fa", "B": "#f4f4fa", "b": "#ffffff", "y": "#ff5a6a"}, desc: '천 년 묵은 흰 뱀의 새끼' },
  { id: 'eunyeowoo', name: '은여우', g: 'A', kind: 'quad', e: 'w', pal: {"H": "#d8dce8", "B": "#d8dce8", "b": "#ffffff", "y": "#2a2838"}, desc: '달빛을 닮은 은빛 여우' },
  { id: 'horangi', name: '아기 호랑이', g: 'A', kind: 'quad', e: 'v', pal: {"H": "#ff9a3a", "B": "#ff9a3a", "b": "#2a1e14", "y": "#ffa0b8"}, desc: '산군의 새끼 호랑이' },
  { id: 'geumdukk', name: '금두꺼비', g: 'A', kind: 'round', e: 'v', pal: {"H": "#ffc83a", "B": "#ffc83a", "b": "#fff0b0", "y": "#c89020"}, desc: '재물을 부르는 금두꺼비' },
  { id: 'bulgasari', name: '불가사리', g: 'A', kind: 'quad', e: 'r', pal: {"H": "#6a6a7a", "B": "#6a6a7a", "b": "#a8a8b8", "y": "#ff7a3a"}, desc: '쇠를 먹고 자라는 괴수' },
  { id: 'hyeonmu', name: '아기 현무', g: 'S', kind: 'round', e: 'all', pal: {"H": "#2a3a5a", "B": "#2a3a5a", "b": "#9ab0d8", "y": "#4ad0b0"}, aura: '#6ab0ff', desc: '북쪽을 지키는 현무의 새끼' },
  { id: 'jujak', name: '아기 주작', g: 'S', kind: 'bird', e: 'v', pal: {"H": "#ff3a2a", "B": "#ff3a2a", "b": "#ffb040", "y": "#ffd34a"}, aura: '#ff6a3a', desc: '남쪽을 지키는 주작의 새끼' },
  { id: 'cheonma', name: '천마', g: 'S', kind: 'quad', e: 'w', pal: {"H": "#f8f8ff", "B": "#f8f8ff", "b": "#cfe8ff", "y": "#ffd34a"}, aura: '#a8d8ff', desc: '구름을 달리는 날개 달린 말' },
  { id: 'imugi', name: '이무기', g: 'S', kind: 'dragon', e: 'r', pal: {"H": "#2a8a8a", "B": "#2a8a8a", "b": "#a8e8d8", "y": "#ffd34a"}, aura: '#4ad0c0', desc: '용이 되기를 기다리는 이무기' },
  { id: 'gumiho', name: '구미호', g: 'SS', kind: 'quad', e: 'all', pal: {"H": "#fff0f4", "B": "#fff0f4", "b": "#ffffff", "y": "#c83a6a"}, aura: '#ff9ad0', desc: '아홉 꼬리를 감춘 여우' },
  { id: 'baektaek', name: '백택', g: 'SS', kind: 'quad', e: 'all', pal: {"H": "#f4f8ff", "B": "#f4f8ff", "b": "#8ab8ff", "y": "#ffd34a"}, aura: '#a8d0ff', desc: '만물을 아는 흰 신수' },
  { id: 'heukryong', name: '아기 흑룡', g: 'SS', kind: 'dragon', e: 'v', pal: {"H": "#2a2440", "B": "#2a2440", "b": "#8a7ab8", "y": "#ff4a5a"}, aura: '#a07aff', desc: '먹구름을 부르는 흑룡의 새끼' },
  { id: 'eungryong', name: '아기 응룡', g: 'SSS', kind: 'dragon', e: 'all', pal: {"H": "#9a6aff", "B": "#9a6aff", "b": "#f0e8ff", "y": "#ffd34a"}, aura: '#c8a0ff', desc: '날개 달린 용, 응룡의 새끼' },
  { id: 'geumsijo', name: '금시조', g: 'SSS', kind: 'bird', e: 'all', pal: {"H": "#ffc83a", "B": "#ffc83a", "b": "#fff4c0", "y": "#ff3a5a"}, aura: '#ffd34a', desc: '용을 잡아먹는 황금 새' },
];
const PULL_COST = { 1: 30, 10: 270 };
const PITY = 80; // 80번 안에 SS 이상 확정

const Pets = (() => {
  const S = () => Game.S;
  const P = id => PETS.find(p => p.id === id);
  function ensure() { const s = S(); s.pets = s.pets || {}; s.petEq = s.petEq || null; s.pity = s.pity || 0; s.petAd = s.petAd || { day: '', n: 0 }; s.petInv = s.petInv || {}; }
  // 펫 능력치: [수확량, 이동속도, 수확속도] (별 하나당 +15%)
  function stats(id) {
    const p = P(id), st = (S().pets || {})[id] || 1, t = PET_GRADES[p.g].total * (1 + 0.15 * (st - 1));
    return EMPH[p.e].map(x => x * t);
  }
  function mul(kind) {
    const s = S(); if (!s || !s.pets) return 1;
    const own = Object.keys(s.pets).length * 0.005;
    const st = s.petEq && s.pets[s.petEq] ? stats(s.petEq) : [0, 0, 0];
    if (kind === 'value') return 1 + st[0] + own;
    if (kind === 'walk') return 1 + st[1];
    if (kind === 'reap') return 1 + st[2];
    return 1;
  }
  function rollGrade(forceMin) {
    let r = Math.random(), g = 'C';
    for (const k of ['SSS', 'SS', 'S', 'A', 'B']) { if (r < PET_GRADES[k].rate) { g = k; break; } r -= PET_GRADES[k].rate; }
    if (forceMin && PET_ORDER.indexOf(g) < PET_ORDER.indexOf(forceMin)) g = forceMin;
    return g;
  }
  function pullOne(forceMin) {
    const s = S(); s.pity++;
    let g = rollGrade(forceMin);
    if (s.pity >= PITY && PET_ORDER.indexOf(g) < 4) g = Math.random() < 0.1 ? 'SSS' : 'SS';
    if (PET_ORDER.indexOf(g) >= 4) s.pity = 0;
    const pool = PETS.filter(p => p.g === g), p = pool[Math.floor(Math.random() * pool.length)];
    return give(p.id);
  }
  // 얻은 영물: 처음이면 도감 등록, 이미 있으면 여분(보관함)에 쌓임 → 별 올리기 · 합성 재료
  function give(id, up) {
    const s = S(), had = s.pets[id] || 0;
    if (!had) s.pets[id] = 1; else s.petInv[id] = (s.petInv[id] || 0) + 1;
    if (!s.petEq) s.petEq = id;
    return { id, isNew: !had, star: s.pets[id], up: !!up };
  }
  // 별 올리기: ★2←1마리, ★3←2, ★4←3, ★5←4
  const starCost = id => (S().pets[id] || 1);
  function starUp(id) {
    const s = S(), st = s.pets[id]; if (!st || st >= 5) return false;
    const c = starCost(id); if ((s.petInv[id] || 0) < c) return false;
    s.petInv[id] -= c; s.pets[id] = st + 1; Game.apply(); Game.save(); return true;
  }
  // 합성: 같은 등급 여분 3마리 → 1마리 (낮은 확률로 한 등급 위, 아니면 같은 등급 중 무작위)
  const FUSE_N = 3, FUSE_UP = { C: 0.12, B: 0.08, A: 0.04, S: 0.02, SS: 0.005 };
  const spares = g => PETS.filter(p => p.g === g).reduce((a, p) => a + (S().petInv[p.id] || 0), 0);
  function fuse(g, times) {
    const s = S(); ensure(); if (!(g in FUSE_UP)) return null;
    const n = Math.min(times, Math.floor(spares(g) / FUSE_N)); if (n <= 0) return null;
    const res = [];
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < FUSE_N; j++) {
        // ★5라 더 쓸 데 없는 여분부터, 그다음 많이 쌓인 것부터 사용
        const pool = PETS.filter(p => p.g === g && (s.petInv[p.id] || 0) > 0).sort((a, b) => ((s.pets[b.id] >= 5) - (s.pets[a.id] >= 5)) || (s.petInv[b.id] - s.petInv[a.id]));
        s.petInv[pool[0].id]--;
      }
      const up = Math.random() < FUSE_UP[g], ng = up ? PET_ORDER[PET_ORDER.indexOf(g) + 1] : g;
      const cand = PETS.filter(p => p.g === ng), p = cand[Math.floor(Math.random() * cand.length)];
      res.push(give(p.id, up));
    }
    Game.apply(); Game.save(); return res;
  }
  // n=1 · 10 (10회는 A 이상 1마리 확정), free=광고
  function pull(n, free) {
    const s = S(); ensure();
    if (!free) { if (s.jade < PULL_COST[n]) return null; s.jade -= PULL_COST[n]; }
    const res = [];
    for (let i = 0; i < n; i++) res.push(pullOne(n === 10 && i === 9 && !res.some(r => PET_ORDER.indexOf(P(r.id).g) >= 2) ? 'A' : null));
    Game.apply(); Game.save(); return res;
  }
  const today = () => new Date().toISOString().slice(0, 10);
  const adLeft = () => { const a = S().petAd; if (a.day !== today()) { a.day = today(); a.n = 0; } return 2 - a.n; };
  function adPull() { if (adLeft() <= 0) return null; S().petAd.n++; return pull(1, true); }
  function equip(id) { if (!S().pets[id]) return false; S().petEq = id; Game.apply(); Game.save(); return true; }
  return { P, ensure, stats, mul, pull, adPull, adLeft, equip, starUp, starCost, fuse, spares, FUSE_N, FUSE_UP };
})();
