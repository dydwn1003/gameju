// ===== 겨울 이벤트 '동짓날 팥죽' (2026-12-03 0시 ~ 12-31 업데이트 전, 한국 시간) =====
// - 게임을 켜 두면 30분마다 맵에 '팥 영혼'이 하나씩 나타남 (못 먹어도 쌓임) → 저승사자가 거두거나 눌러서 모음
// - 접속하지 않은 동안은 30분 넘게 지나도 하나만 나옴
// - 겨울 출석: 하루 1번 · 매번 기본 보상 · 14일 사슴뿔 머리띠 · 28일 저승사자 목도리
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
  const SHOP = { bowl: { jade: 80, day: 2 } };
  // 저승사자 꾸미기 (겨울 출석 보상): 받은 것은 이벤트가 끝나도 계속 쓸 수 있고, 내 정보에서 쓰기 · 벗기를 고를 수 있음
  const ITEMS = { antler: { ch: 'a', name: '사슴뿔 머리띠' }, rscarf: { ch: 's', name: '저승사자 목도리' } };
  // ---------- 겨울 출석 (12-03 ~ 12-31, 한국 시간 하루 1번) ----------
  // 출석한 날 수(이어지지 않아도 됨)로 셈 · 매번 기본 보상 · 14일째 사슴뿔 머리띠 · 28일째 저승사자 목도리
  const ATT_MAX = 28, ATT_GOALS = [{ n: 14, id: 'antler' }, { n: 28, id: 'rscarf' }];
  const ATT_SEED = [{ lotus: 3 }, { honbul: 2 }, { lotus: 3 }, { saengsa: 1 }];
  function attReward(d) {          // d: 몇 번째 출석 (1~28)
    const w = Math.floor((d - 1) / 7), k = (d - 1) % 7;
    return [{ hours: 1 }, { jade: 20 }, { tickets: 5 }, { seed: ATT_SEED[w % 4] }, { hours: 2 }, { jade: 30 }, { tickets: 5 }][k];
  }
  const att = () => { const e = st(); const a = e.att || (e.att = { n: 0, day: '' }); a.mk = a.mk || 0; return a; };
  // 놓친 날 채우기: 옥 50개로 지나간 날 출석을 하루씩 채움 (횟수 제한 없음 · 놓친 날만큼)
  const MK_JADE = 50;
  const dayNo = () => Math.floor((now() + 9 * 3600e3) / 864e5) - Math.floor((WINTER.start + 9 * 3600e3) / 864e5) + 1;   // 오늘이 이벤트 며칠째인지 (한국 시간)
  const missed = () => { const a = att(); if (!active()) return 0; return Math.max(0, dayNo() - a.n - (a.day === kstDay(now()) ? 0 : 1)); };   // 지나간 날 중 출석 못 한 날 (오늘은 빼고)
  const canMakeup = () => active() && att().n < ATT_MAX && missed() > 0;
  const canAttend = () => active() && att().n < ATT_MAX && att().day !== kstDay(now());
  function attend(makeup) {
    const s = S();
    if (makeup) { if (!canMakeup() || s.jade < MK_JADE) return null; s.jade -= MK_JADE; att().mk++; }
    else if (!canAttend()) return null;
    const a = att(), d = a.n + 1, r = attReward(d);
    a.n = d; if (!makeup) a.day = kstDay(now());
    if (r.jade) s.jade += r.jade;
    if (r.tickets) s.tickets = (s.tickets || 0) + r.tickets;
    let souls = 0; if (r.hours) { souls = Game.incomePerSec(true) * 3600 * r.hours; Game.gain(souls); }
    if (r.seed) { s.seeds = s.seeds || {}; for (const k in r.seed) s.seeds[k] = (s.seeds[k] || 0) + r.seed[k]; }
    const g = ATT_GOALS.find(x => x.n === d); let item = null;
    if (g && !owns(g.id)) { const e = st(); e.items = e.items || {}; e.items[g.id] = 1; e.wear = e.wear || {}; e.wear[g.id] = true; item = g.id; }
    Game.save(); return { d, r, item, souls };
  }
  const bowlDay = () => { const e = st(), d = kstDay(now()); if (!e.bowl || e.bowl.d !== d) e.bowl = { d, n: 0 }; return e.bowl; };
  const bowlLeft = () => SHOP.bowl.day - bowlDay().n;
  function buyBowl() { const s = S(); if (!active() || bowlLeft() <= 0 || room() <= 0 || s.jade < SHOP.bowl.jade) return false; s.jade -= SHOP.bowl.jade; bowlDay().n++; st().pend++; Game.save(); if (onSpawn) onSpawn(); return true; }
  const owns = id => !!(st().items || {})[id];
  const wearing = id => owns(id) && (st().wear || {})[id] !== false;
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
    SHOP, ITEMS, bowlLeft, buyBowl, owns, wearing, toggleWear, deco,
    att, attReward, canAttend, attend, missed, canMakeup, mkJade: MK_JADE, attMax: ATT_MAX, attGoals: ATT_GOALS,
    active, st, room, tick, collect, claim, claimable, left, nextIn, hasDot, done,
    goals: WINTER.goals, max: WINTER.max, per: WINTER.per, startAt: WINTER.start, endAt: end,
    setEnd: ms => { if (ms > 0) endOverride = ms; }, onSpawn: f => { onSpawn = f; },
  };
})();
