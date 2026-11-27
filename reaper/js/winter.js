// ===== 겨울 이벤트 '동짓날 팥죽' (2026-12-03 0시 ~ 12-31 업데이트 전, 한국 시간) =====
// - 게임을 켜 두면 30분마다 맵에 '팥 영혼'이 하나씩 나타남 (못 먹어도 쌓임) → 저승사자가 거두거나 눌러서 모음
// - 접속하지 않은 동안은 30분 넘게 지나도 하나만 나옴
// - 20개: 겨울 소품 '동짓날 팥죽 가마솥' · 40개: SS 영물 '눈꽃 백록'
// - 끝나는 시각은 서버 docs 'config/event' 의 winterEnd(ISO 문자열)로 바꿀 수 있음 (없으면 12-31 24시)
const WINTER = {
  id: 'w26',
  start: Date.parse('2026-12-03T00:00:00+09:00'),
  end: Date.parse('2027-01-01T00:00:00+09:00'),
  per: 1800,          // 팥 영혼 1개에 필요한 '켜 둔 시간' (초)
  max: 40,
  goals: [
    { n: 20, kind: 'decor', id: 'ev_patjuk' },
    { n: 40, kind: 'pet', id: 'seollok' },
  ],
};

const Winter = (() => {
  let endOverride = null, onSpawn = null;
  const S = () => Game.S;
  const now = () => Date.now() + (window.__evShift || 0);          // __evShift: 미리보기에서 날짜 옮기기용
  const st = () => { const s = S(); s.ev = s.ev || {}; const e = s.ev[WINTER.id] || (s.ev[WINTER.id] = { n: 0, prog: 0, pend: 0, got: {}, seen: false, last: 0 }); if (e.ready) { e.pend = (e.pend || 0) + 1; delete e.ready; } e.pend = e.pend || 0; return e; };
  const end = () => endOverride || WINTER.end;
  const active = () => { const t = now(); return t >= WINTER.start && t < end(); };
  const done = () => st().n >= WINTER.max;
  const room = () => WINTER.max - st().n - st().pend;     // 더 나올 수 있는 개수 (모은 것 + 맵에 있는 것 ≤ 40)
  // 켜 둔 동안: 30분마다 하나씩 계속 나옴 (못 먹어도 쌓임)
  // 접속 안 한 동안: 30분 넘게 지나도 하나만 (다시 켰을 때 한 번 더함)
  function tick(dt) {
    if (!active() || !S().kind || document.hidden || !(dt > 0)) return;
    const e = st(), t = now();
    if (e.last && t - e.last > 60e3) { if (room() > 0 && e.prog + (t - e.last) / 1000 * (window.__evSpeed || 1) >= WINTER.per) { e.pend++; e.prog = 0; Game.save(); if (onSpawn) onSpawn(); } }
    e.last = t;
    if (dt > 1 || room() <= 0) return;
    e.prog += dt * (window.__evSpeed || 1);
    if (e.prog >= WINTER.per) { e.prog = 0; e.pend++; Game.save(); if (onSpawn) onSpawn(); }
  }
  // 맵에 나타난 팥 영혼 줍기
  function collect() { const e = st(); if (e.pend <= 0 || !active()) return 0; e.pend--; e.n = Math.min(WINTER.max, e.n + 1); Game.save(); return e.n; }
  // 겨울 상점 (이벤트 기간에만 판매): 팥죽 한 그릇(옥 80 · 하루 2번 · 팥 영혼 1개 바로)
  // 저승사자 꾸미기: 목도리 · 사슴뿔 머리띠 (각 옥 200) — 산 것은 이벤트가 끝나도 계속 쓸 수 있고, 쓰기 · 벗기를 고를 수 있음
  const SHOP = { bowl: { jade: 80, day: 2 }, rscarf: { jade: 200, ch: 's' }, antler: { jade: 200, ch: 'a' } };
  const bowlDay = () => { const e = st(), d = kstDay(now()); if (!e.bowl || e.bowl.d !== d) e.bowl = { d, n: 0 }; return e.bowl; };
  const bowlLeft = () => SHOP.bowl.day - bowlDay().n;
  function buyBowl() { const s = S(); if (!active() || bowlLeft() <= 0 || room() <= 0 || s.jade < SHOP.bowl.jade) return false; s.jade -= SHOP.bowl.jade; bowlDay().n++; st().pend++; Game.save(); if (onSpawn) onSpawn(); return true; }
  const owns = id => !!(st().items || {})[id];
  const wearing = id => owns(id) && (st().wear || {})[id] !== false;
  function buyItem(id) { const s = S(), e = st(), it = SHOP[id]; if (!it || !it.ch || !active() || owns(id) || s.jade < it.jade) return false; s.jade -= it.jade; e.items = e.items || {}; e.items[id] = 1; e.wear = e.wear || {}; e.wear[id] = true; Game.save(); return true; }
  function toggleWear(id) { if (!owns(id)) return false; const e = st(); e.wear = e.wear || {}; e.wear[id] = !wearing(id); Game.save(); return e.wear[id]; }
  const deco = () => (wearing('rscarf') ? 's' : '') + (wearing('antler') ? 'a' : '');   // 저승사자 그림에 넘길 꾸미기 글자
  const claimable = g => st().n >= g.n && !st().got[g.id];
  function claim(i) {
    const g = WINTER.goals[i], e = st(); if (!g || !claimable(g)) return null;
    if (g.kind === 'decor') Decor.grantId(g.id);
    else { const s = S(); s.pets = s.pets || {}; if (!s.pets[g.id]) s.pets[g.id] = 1; else { s.petInv = s.petInv || {}; s.petInv[g.id] = (s.petInv[g.id] || 0) + 1; } Game.apply(); }
    e.got[g.id] = 1; Game.save(); return g;
  }
  const left = () => Math.max(0, end() - now());
  const nextIn = () => Math.max(0, WINTER.per - st().prog) / (window.__evSpeed || 1);
  const hasDot = () => active() && (st().pend > 0 || WINTER.goals.some(claimable));
  return {
    SHOP, bowlLeft, buyBowl, owns, wearing, buyItem, toggleWear, deco,
    active, st, room, tick, collect, claim, claimable, left, nextIn, hasDot, done,
    goals: WINTER.goals, max: WINTER.max, per: WINTER.per, startAt: WINTER.start, endAt: end,
    setEnd: ms => { if (ms > 0) endOverride = ms; }, onSpawn: f => { onSpawn = f; },
  };
})();
