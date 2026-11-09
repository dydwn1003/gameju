// ===== 펫(저승사자를 보좌하는 영물) 뽑기: C ~ SSS =====
// 펫은 하나 데리고 다니며 수확량 · 이동속도 · 수확속도를 올려준다. 모은 펫 종류마다 수확량 +1%.
const PET_GRADES = {
  C: { rate: 0.50, col: '#a0a6b8', total: 0.08, dup: 3 },
  B: { rate: 0.30, col: '#5ac06a', total: 0.15, dup: 5 },
  A: { rate: 0.13, col: '#4a9aff', total: 0.28, dup: 10 },
  S: { rate: 0.05, col: '#c070ff', total: 0.50, dup: 30 },
  SS: { rate: 0.017, col: '#ffb030', total: 0.85, dup: 60 },
  SSS: { rate: 0.003, col: '#ff4a6a', total: 1.5, dup: 120 },
};
const PET_ORDER = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
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
];
const PULL_COST = { 1: 30, 10: 270 };
const PITY = 80; // 80번 안에 SS 이상 확정

const Pets = (() => {
  const S = () => Game.S;
  const P = id => PETS.find(p => p.id === id);
  function ensure() { const s = S(); s.pets = s.pets || {}; s.petEq = s.petEq || null; s.pity = s.pity || 0; s.petAd = s.petAd || { day: '', n: 0 }; }
  // 펫 능력치: [수확량, 이동속도, 수확속도] (별 하나당 +20%)
  function stats(id) {
    const p = P(id), st = (S().pets || {})[id] || 1, t = PET_GRADES[p.g].total * (1 + 0.2 * (st - 1));
    return EMPH[p.e].map(x => x * t);
  }
  function mul(kind) {
    const s = S(); if (!s || !s.pets) return 1;
    const own = Object.keys(s.pets).length * 0.01;
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
    if (s.pity >= PITY && PET_ORDER.indexOf(g) < 4) g = Math.random() < 0.15 ? 'SSS' : 'SS';
    if (PET_ORDER.indexOf(g) >= 4) s.pity = 0;
    const pool = PETS.filter(p => p.g === g), p = pool[Math.floor(Math.random() * pool.length)];
    const had = s.pets[p.id] || 0; let refund = 0;
    if (!had) s.pets[p.id] = 1; else if (had < 5) s.pets[p.id] = had + 1; else { refund = PET_GRADES[g].dup; s.jade += refund; }
    if (!s.petEq) s.petEq = p.id;
    return { id: p.id, isNew: !had, star: s.pets[p.id], refund };
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
  return { P, ensure, stats, mul, pull, adPull, adLeft, equip };
})();
