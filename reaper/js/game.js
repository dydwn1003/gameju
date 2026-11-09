// ===== 저승사자 키우기: 상태 · 경제 · 저장 · 오프라인 보상 =====
// lv: 승진 시험을 볼 수 있는 레벨(수련 총합), hp: 시험 원귀 체력
const RANKS = [
  { name: '수습 차사', mult: 1, lv: 0, hp: 0, region: 0 },
  { name: '말단 차사', mult: 3, lv: 95, hp: 21000, region: 1 },
  { name: '차사', mult: 9, lv: 300, hp: 3e07, region: 2 },
  { name: '선임 차사', mult: 27, lv: 360, hp: 6.5e08, region: 3 },
  { name: '차사장', mult: 80, lv: 400, hp: 5.2e09, region: 4 },
  { name: '판관', mult: 240, lv: 440, hp: 3.9e10, region: 5 },
  { name: '명부 판관', mult: 720, lv: 470, hp: 2.8e11, region: 6 },
  { name: '시왕', mult: 2200, lv: 500, hp: 2e12, region: 7 },
  { name: '염라대왕', mult: 6500, lv: 530, hp: 6.9e12, region: 8 },
];
const UPGRADES = [
  { id: 'pen', name: '명부 필력', icon: 'pen', desc: '혼 1개당 수확량 (25레벨마다 ×2)', base: 8, grow: 1.12, max: 999 },
  { id: 'step', name: '축지법', icon: 'step', desc: '저승사자 걸음 속도', base: 20, grow: 1.32, max: 30 },
  { id: 'call', name: '혼불 부르기', icon: 'call', desc: '혼령이 나타나는 속도', base: 35, grow: 1.36, max: 35 },
  { id: 'hand', name: '거둠의 손길', icon: 'hand', desc: '혼을 거두는 시간 단축', base: 30, grow: 1.34, max: 30 },
  { id: 'luck', name: '귀한 인연', icon: 'luck', desc: '귀한 혼령 출현 확률', base: 250, grow: 1.55, max: 25 },
  { id: 'minion', name: '졸개 차사 고용', icon: 'minion', desc: '자동으로 혼을 거두는 부하', base: 120, grow: 2.1, max: 20 },
  { id: 'drill', name: '졸개 훈련', icon: 'drill', desc: '졸개 걸음·수확량 증가', base: 300, grow: 1.3, max: 999 },
  { id: 'ledger', name: '저승 장부', icon: 'ledger', desc: '자리 비운 동안 쌓이는 최대 시간', base: 400, grow: 2.4, max: 10 },
];
const TIER_MULT = [1, 3, 10, 30];
const TIER_NAME = ['떠도는 혼', '맑은 혼', '황금 혼', '원한 서린 혼'];
const SHOP_IAP = [
  { id: 'jade100', name: '옥 100개', price: '₩1,200', jade: 100, icon: 'jade' },
  { id: 'jade550', name: '옥 550개', price: '₩5,900', jade: 550, icon: 'jade', tag: '+10%' },
  { id: 'jade1200', name: '옥 1,200개', price: '₩12,000', jade: 1200, icon: 'jade', tag: '+20%' },
  { id: 'starter', name: '신입 차사 패키지', price: '₩1,200', once: true, jade: 200, minion: 2, icon: 'minion', desc: '옥 200 + 졸개 2명 즉시 고용', tag: '1회 한정' },
  { id: 'promo', name: '승진 응원 패키지', price: '₩3,300', jade: 300, hours: 4, boost: 60, icon: 'luck', desc: '옥 300 + 4시간치 혼 + 2배 부적 60분', tag: '추천' },
  { id: 'perm2', name: '염라의 인장', price: '₩9,900', once: true, perm2: true, icon: 'ledger', desc: '영구적으로 모든 혼 수확 2배', tag: '영구' },
  { id: 'noads', name: '광고 제거', price: '₩6,900', once: true, noAds: true, icon: 'scroll', desc: '광고 없이 광고 보상 즉시 받기' },
];
const JADE_SHOP = [
  { id: 'j_time2', name: '시간의 두루마리', cost: 50, hours: 2, desc: '2시간치 혼 즉시 획득' },
  { id: 'j_time8', name: '큰 시간의 두루마리', cost: 160, hours: 8, desc: '8시간치 혼 즉시 획득' },
  { id: 'j_boost', name: '2배 부적 30분', cost: 60, boost: 30, desc: '30분간 혼 수확 2배' },
  { id: 'j_minion', name: '특급 졸개', cost: 300, minion: 1, desc: '졸개 1명 즉시 고용 (비용 없이)' },
];
const ATTEND = [20, 30, 40, 50, 60, 80, 150];
const AD_LIMIT = { boost: 8, jade: 5 };

const Game = (() => {
  const KEY = 'jeoseung_v1';
  let S = null;
  const fresh = () => ({
    v: 1, kind: null, name: '', souls: 0, jade: 30, total: 0, rank: 0, reborn: 0, upg: {},
    boostUntil: 0, ads: { day: '', boost: 0, jade: 0 }, perm2: false, noAds: false, bought: {},
    last: Date.now(), created: Date.now(), sound: true, bgm: true, attend: { day: '', streak: 0 }, lastBuy: Date.now(), stuckShown: 0,
    stats: { wraith: 0, tap: 0 },
  });
  const lv = id => S.upg[id] || 0;
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- 수치 ----------
  const rebornMult = () => 1 + S.reborn * 1.5;
  const penMul = L => (1 + L * 0.45) * Math.pow(2, Math.floor(L / 25));
  const valueBase = () => penMul(lv('pen')) * (1 + Life.dexBonus()) * RANKS[S.rank].mult * rebornMult() * (S.perm2 ? 2 : 1);
  const boosting = () => Date.now() < S.boostUntil;
  const value = () => valueBase() * (boosting() ? 2 : 1) * (Life.buffLeft('value') > 0 ? 1.5 : 1);
  const walk = () => (18 + lv('step') * 2.2) * Life.mul('spawn');
  const spawn = () => Math.max(0.3, 2.4 * Math.pow(0.93, lv('call'))) / Life.mul('spawn');
  const reap = () => Math.max(0.18, 0.9 * Math.pow(0.93, lv('hand')));
  const minions = () => lv('minion');
  const mWalk = () => Math.min(36, 11 * (1 + lv('drill') * 0.05));
  const mReap = () => Math.max(0.35, 1.5 * Math.pow(0.965, lv('drill')));
  const drillMul = () => 1 + lv('drill') * 0.08;
  const offHours = () => 2 + lv('ledger');
  function tierProbs() {
    const L = lv('luck');
    const p3 = 0.004 * (1 + 0.15 * L), p2 = 0.015 * (1 + 0.12 * L), p1 = 0.06 * (1 + 0.1 * L);
    return [1 - p1 - p2 - p3, p1, p2, p3];
  }
  function rollTier() {
    const p = tierProbs(); let r = Math.random();
    for (let i = 3; i >= 1; i--) { if (r < p[i]) return i; r -= p[i]; }
    return 0;
  }
  const avgTier = () => tierProbs().reduce((a, p, i) => a + p * TIER_MULT[i], 0);
  // 초당 수익 추정 (화면 표시 · 오프라인 계산)
  function incomePerSec(noBoost) {
    const dist = 40;
    const main = 1 / (dist / walk() + reap() + 0.15);
    const vis = Math.min(5, minions()), mr = vis ? 1 / (dist / mWalk() + mReap() + 0.15) : 0;
    const cap = 1 / spawn(), coll = Math.min(cap, main + vis * mr);
    const shareM = vis ? (vis * mr) / (main + vis * mr) : 0;
    const scale = vis ? (minions() / vis) * drillMul() : 0;
    const v = (noBoost ? valueBase() : value()) * avgTier();
    return coll * v * ((1 - shareM) + shareM * scale);
  }
  const tapValue = () => value() * 1.5;
  const wraithDps = () => (incomePerSec() + value() * 2) * Life.mul('fight');
  const tapDmg = () => (value() * 3 + incomePerSec() * 0.15) * Life.mul('fight');

  // 업그레이드 효과 표기 (레벨 L 기준)
  function eff(id, L) {
    switch (id) {
      case 'pen': { const m = (1 + L * 0.45) * Math.pow(2, Math.floor(L / 25)); return '×' + (m >= 100 ? fmt(m) : m.toFixed(2)); }
      case 'step': return Math.round(18 + L * 2.2) + '보';
      case 'call': return Math.max(0.3, 2.4 * Math.pow(0.93, L)).toFixed(2) + '초';
      case 'hand': return Math.max(0.18, 0.9 * Math.pow(0.93, L)).toFixed(2) + '초';
      case 'luck': { const p = 0.004 * (1 + 0.15 * L) + 0.015 * (1 + 0.12 * L) + 0.06 * (1 + 0.1 * L); return (p * 100).toFixed(1) + '%'; }
      case 'minion': return L + '명';
      case 'drill': return '×' + (1 + L * 0.08).toFixed(2);
      case 'ledger': return (2 + L) + '시간';
    }
  }
  // ---------- 비용 ----------
  function cost(id, n = 1) {
    const U = UPGRADES.find(u => u.id === id); let c = 0, L = lv(id);
    for (let i = 0; i < n && L + i < U.max; i++) c += Math.ceil(U.base * Math.pow(U.grow, L + i));
    return c;
  }
  function maxBuy(id) {
    const U = UPGRADES.find(u => u.id === id); let n = 0, c = 0;
    while (lv(id) + n < U.max) { const nc = cost(id, n + 1); if (nc > S.souls) break; c = nc; n++; if (n > 500) break; }
    return { n, c };
  }
  function buy(id, n) {
    const U = UPGRADES.find(u => u.id === id);
    if (n === 'max') n = Math.max(1, maxBuy(id).n);
    n = Math.min(n, U.max - lv(id));
    if (n <= 0) return false;
    const c = cost(id, n);
    if (c > S.souls) return false;
    S.souls -= c; S.upg[id] = lv(id) + n; S.lastBuy = Date.now();
    apply(); save();
    return true;
  }

  // ---------- 승진 ----------
  const nextRank = () => RANKS[S.rank + 1];
  const level = () => 1 + Object.values(S.upg).reduce((a, b) => a + b, 0);
  const canTest = () => !!nextRank() && level() >= nextRank().lv;
  const testHp = () => nextRank() ? nextRank().hp * rebornMult() : 0;
  function promote() {
    const N = nextRank(); if (!N || level() < N.lv) return false;
    S.rank++; S.lastBuy = Date.now();
    apply(); save();
    return true;
  }
  const canReborn = () => S.rank === RANKS.length - 1;
  function reborn() {
    if (!canReborn()) return false;
    S.reborn++; S.rank = 0; S.souls = 0; S.upg = {};
    apply(); save(); return true;
  }

  // ---------- 획득 ----------
  function gain(n) { S.souls += n; S.total += n; }
  function roll() { const sp = Life.rollSpecial(RANKS[S.rank].region, lv('luck')); return sp >= 0 ? { tier: 2, sp } : { tier: rollTier(), sp: -1 }; }
  function collect(tier, who, sp) {
    let v = value() * TIER_MULT[tier];
    if (who === 'minion') { const vis = Math.min(5, minions()); v *= (minions() / Math.max(1, vis)) * drillMul(); }
    if (who === 'tap') { v = tapValue() * TIER_MULT[tier]; S.stats.tap++; }
    gain(v); return v;
  }
  function addBoost(min) { S.boostUntil = Math.max(Date.now(), S.boostUntil) + min * 60000; S.boostUntil = Math.min(S.boostUntil, Date.now() + 180 * 60000); apply(); save(); }

  function apply() {
    Scene.config({ spawn: spawn(), walk: walk(), reap: reap(), minions: minions(), mWalk: mWalk(), mReap: mReap(), roll, maxSouls: 6 + Math.min(6, Math.floor(lv('call') / 5)), speed: boosting() ? 1.3 : 1 });
    Scene.setRegion(RANKS[S.rank].region);
    if (S.kind) Scene.setKind(S.kind);
    Scene.setRank(S.rank);
  }

  // ---------- 광고 ----------
  function adsToday() { if (S.ads.day !== today()) S.ads = { day: today(), boost: 0, jade: 0 }; return S.ads; }
  const adLeft = k => AD_LIMIT[k] - adsToday()[k];
  function useAd(k) { adsToday()[k]++; save(); }

  // ---------- 출석 ----------
  function attendState() {
    const a = S.attend, t = today();
    if (a.day === t) return { can: false, streak: a.streak };
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const streak = a.day === y ? a.streak % 7 : 0;
    return { can: true, streak, reward: ATTEND[streak] };
  }
  function attend() {
    const st = attendState(); if (!st.can) return 0;
    S.attend = { day: today(), streak: st.streak + 1 }; S.jade += st.reward; save(); return st.reward;
  }

  // ---------- 상점 ----------
  function iap(id) {
    const P = SHOP_IAP.find(p => p.id === id);
    if (P.once && S.bought[id]) return false;
    S.bought[id] = (S.bought[id] || 0) + 1;
    if (P.jade) S.jade += P.jade;
    if (P.minion) S.upg.minion = Math.min(20, lv('minion') + P.minion);
    if (P.hours) gain(incomePerSec(true) * 3600 * P.hours);
    if (P.boost) addBoost(P.boost);
    if (P.perm2) S.perm2 = true;
    if (P.noAds) S.noAds = true;
    apply(); save(); return true;
  }
  function jadeBuy(id) {
    const J = JADE_SHOP.find(j => j.id === id);
    if (S.jade < J.cost) return false;
    if (J.minion && lv('minion') >= 20) return false;
    S.jade -= J.cost;
    let got = 0;
    if (J.hours) { got = incomePerSec(true) * 3600 * J.hours; gain(got); }
    if (J.boost) addBoost(J.boost);
    if (J.minion) S.upg.minion = lv('minion') + 1;
    apply(); save(); return got || true;
  }

  // ---------- 저장 ----------
  function save() { if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
    if (!S) S = fresh();
    Life.ensure();
  }
  // 자리 비운 시간 보상 (졸개들이 대신 거둠, 효율 60%)
  function offline() {
    const away = Math.max(0, (Date.now() - S.last) / 1000);
    if (!S.kind || away < 60) return null;
    const secs = Math.min(away, offHours() * 3600);
    const amt = incomePerSec(true) * secs * 0.6;
    return { away, secs, amt, capped: away > secs };
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} S = fresh(); Life.ensure(); apply(); }

  return {
    get S() { return S; }, lv, load, save, apply, reset,
    value, valueBase, incomePerSec, walk, spawn, reap, minions, offHours, tierProbs, tapDmg, wraithDps, drillMul, boosting,
    eff, cost, maxBuy, buy, nextRank, level, canTest, testHp, promote, canReborn, reborn, rebornMult,
    collect, gain, addBoost, adLeft, useAd, attendState, attend, iap, jadeBuy, offline,
  };
})();

// 숫자 표기: 만 · 억 · 조 · 경 · 해
function fmt(n) {
  n = Math.floor(n);
  if (n < 1e4) return n.toLocaleString('ko-KR');
  const units = [['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
  for (const [u, v] of units) if (n >= v) { const x = n / v; return String(x >= 100 ? Math.floor(x) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '') + u; }
  return String(n);
}
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}시간 ${m}분` : m ? `${m}분 ${s}초` : `${s}초`;
}
