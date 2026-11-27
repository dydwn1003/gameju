// ===== 겨울 이벤트 '동짓날 팥죽' (2026-12-03 0시 ~ 12-31 업데이트 전, 한국 시간) =====
// - 게임을 켜 두고 있으면(화면이 보이는 동안만) 30분마다 맵에 '팥 영혼'이 하나 나타남 → 눌러서 모음 (자리 비움 · 꺼 둔 시간은 안 셈)
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
  const st = () => { const s = S(); s.ev = s.ev || {}; return s.ev[WINTER.id] || (s.ev[WINTER.id] = { n: 0, prog: 0, ready: false, got: {}, seen: false }); };
  const end = () => endOverride || WINTER.end;
  const active = () => { const t = now(); return t >= WINTER.start && t < end(); };
  const done = () => st().n >= WINTER.max;
  // 화면이 보이는 동안만 진행 (dt 가 1초를 넘으면 앱이 뒤에 있다 돌아온 것 → 안 셈)
  function tick(dt) {
    if (!active() || !S().kind || document.hidden || !(dt > 0) || dt > 1) return;
    const e = st(); if (e.ready || done()) return;
    e.prog += dt * (window.__evSpeed || 1);
    if (e.prog >= WINTER.per) { e.prog = 0; e.ready = true; Game.save(); if (onSpawn) onSpawn(); }
  }
  // 맵에 나타난 팥 영혼 줍기
  function collect() { const e = st(); if (!e.ready || !active()) return 0; e.ready = false; e.n = Math.min(WINTER.max, e.n + 1); Game.save(); return e.n; }
  const claimable = g => st().n >= g.n && !st().got[g.id];
  function claim(i) {
    const g = WINTER.goals[i], e = st(); if (!g || !claimable(g)) return null;
    if (g.kind === 'decor') Decor.grantId(g.id);
    else { const s = S(); s.pets = s.pets || {}; if (!s.pets[g.id]) s.pets[g.id] = 1; else { s.petInv = s.petInv || {}; s.petInv[g.id] = (s.petInv[g.id] || 0) + 1; } Game.apply(); }
    e.got[g.id] = 1; Game.save(); return g;
  }
  const left = () => Math.max(0, end() - now());
  const nextIn = () => st().ready ? 0 : Math.max(0, WINTER.per - st().prog) / (window.__evSpeed || 1);
  const hasDot = () => active() && (st().ready || WINTER.goals.some(claimable));
  return {
    active, st, tick, collect, claim, claimable, left, nextIn, hasDot, done,
    goals: WINTER.goals, max: WINTER.max, per: WINTER.per, startAt: WINTER.start, endAt: end,
    setEnd: ms => { if (ms > 0) endOverride = ms; }, onSpawn: f => { onSpawn = f; },
  };
})();
