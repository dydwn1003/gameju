// ===== 저승사자 키우기: 상태 · 경제 · 저장 · 오프라인 보상 =====
// lv: 승진 시험을 볼 수 있는 전체 레벨(업그레이드 레벨 합 + 1, 최대 99), hp: 시험 원귀 체력
// 기준: 버프를 다 쓰는 플레이어(2배 부적 · 탕약 · 영물 · 꾸미기 · 도감 · 결재 · 파견 · 심판, 하루 4번 접속)가
//       3분 · 20분 · 1시간 · 2일 · 4일 · 10일 · 17일 · 27일에 승진, 염라대왕 = 레벨 99 = 모든 업그레이드 최대 (만렙)
//       하루 6시간 넘게 몰아서 해도 3계급 이후는 거의 같은 일정 (sim_binge)
// mult: 계급별 수확 배수 (승진할 때마다 약 2.2배)
const RANKS = [
  { name: '수습 차사', mult: 1, lv: 0, hp: 0, region: 0 },
  { name: '말단 차사', mult: 2.5, lv: 9, hp: 1.85e04, region: 1 },
  { name: '차사', mult: 6, lv: 36, hp: 4.37e06, region: 2 },
  { name: '선임 차사', mult: 14, lv: 51, hp: 4.66e08, region: 3 },
  { name: '차사장', mult: 32, lv: 77, hp: 7.23e11, region: 4 },
  { name: '판관', mult: 72, lv: 87, hp: 1.29e13, region: 5 },
  { name: '명부 판관', mult: 160, lv: 92, hp: 2.27e14, region: 6 },
  { name: '시왕', mult: 360, lv: 96, hp: 2.58e15, region: 7 },
  { name: '염라대왕', mult: 800, lv: 99, hp: 2.80e16, region: 8 },
];
// 강화(구매)할 때마다 능력치가 오르고 경험치 1. 경험치가 차면 업그레이드 레벨 ↑ (lmax 까지).
// 업그레이드 레벨 합 + 1 = 전체 레벨 (만렙 99 = 모든 업그레이드 최대 = 염라대왕). sq: 비용 증가율이 강화할수록 조금씩 줄어듦
const UPGRADES = [
  { id: 'pen', name: '명부 필력', icon: 'pen', desc: '혼 1개당 수확량 (120번 강화마다 ×2)', base: 8, grow: 1.04, sq: -0.905e-5, pa: 0.5, pd: 120, max: 1699, lmax: 30 },
  { id: 'step', name: '축지법', icon: 'step', desc: '저승사자 걸음 속도', base: 30, grow: 1.149, cap: 60, grow2: 1.15, max: 200, lmax: 10 },
  { id: 'call', name: '혼불 부르기', icon: 'call', desc: '혼령이 나타나는 속도', base: 40, grow: 1.166, cap: 70, grow2: 1.15, max: 200, lmax: 10 },
  { id: 'hand', name: '거둠의 손길', icon: 'hand', desc: '거두는 시간 단축 · 주변 혼령 함께 거두기', base: 40, grow: 1.158, cap: 60, grow2: 1.15, max: 200, lmax: 10 },
  { id: 'luck', name: '귀한 인연', icon: 'luck', desc: '귀한 혼령 출현 확률', base: 750, grow: 1.245, cap: 50, grow2: 1.15, max: 200, lmax: 10 },
  { id: 'minion', name: '졸개 차사 고용', icon: 'minion', desc: '자동으로 혼을 거두는 부하', base: 360, grow: 2.1, cap: 20, grow2: 1.4, max: 40, lmax: 8 },
  { id: 'drill', name: '졸개 훈련', icon: 'drill', desc: '졸개 걸음·수확량 증가', base: 900, grow: 1.08, max: 420, lmax: 14 },
  { id: 'ledger', name: '저승 장부', icon: 'ledger', desc: '자리 비운 동안 쌓이는 최대 시간', base: 1200, grow: 1.55, cap: 20, grow2: 1.34, max: 40, lmax: 6 },
];
const TIER_MULT = [1, 3, 10, 30];
var SOUL_MUL = 0.5; // 혼 1개의 기본 가치 배율 (전체 혼 양 조절)
const TIER_NAME = ['떠도는 혼', '맑은 혼', '황금 혼', '원한 서린 혼'];
const SHOP_IAP = [
  { id: 'jade100', name: '옥 100개', price: '₩1,200', jade: 100, icon: 'jade' },
  { id: 'jade550', name: '옥 550개', price: '₩5,900', jade: 550, icon: 'jade', tag: '+10%' },
  { id: 'jade1200', name: '옥 1,200개', price: '₩12,000', jade: 1200, icon: 'jade', tag: '+20%' },
  { id: 'starter', name: '신입 차사 패키지', price: '₩1,200', once: true, jade: 200, minion: 2, icon: 'minion', desc: '옥 200 + 졸개 2명 즉시 고용', tag: '1회 한정' },
  { id: 'promo', name: '승진 응원 패키지', price: '₩3,300', daily: 1, jade: 300, hours: 4, boost: 60, icon: 'luck', desc: '옥 300 + 4시간치 혼 + 2배 부적 60분', tag: '추천' },
  { id: 'perm2', name: '염라의 인장', price: '₩9,900', seal: 7, icon: 'ledger', desc: '7일 동안 모든 혼 수확 2배 (다시 사면 7일 연장)', tag: '7일' },
  { id: 'noads', name: '광고 제거', price: '₩6,900', once: true, noAds: true, icon: 'scroll', desc: '광고 없이 광고 보상 즉시 받기' },
];
const JADE_SHOP = [
  // 시간 두루마리는 하루 2번까지 (한 달 진행 밸런스 보호)
  { id: 'j_time2', name: '시간의 두루마리', cost: 120, prices: [120, 120], day: 2, hours: 1, desc: '1시간치 혼 즉시 획득' },
  { id: 'j_time8', name: '큰 시간의 두루마리', cost: 430, prices: [430, 430], day: 2, hours: 3, desc: '3시간치 혼 즉시 획득' },
  { id: 'j_boost', name: '2배 부적 30분', cost: 120, boost: 30, desc: '30분간 혼 수확 2배' },
  { id: 'j_minion', name: '특급 졸개', cost: 300, minion: 1, desc: '졸개 1명 즉시 고용' },
];
const ATTEND = [20, 30, 40, 50, 60, 80, 150];
const AD_LIMIT = { boost: 8, jade: 5, skip: 12, wraith: 5 }; // 하루 광고 횟수

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
  // 숙련: 원래 최대(cap)를 넘긴 레벨은 효과 대신 혼 가치 +1%씩 (걸음 · 부르기 · 손길 · 인연)
  const MASTER = ['step', 'call', 'hand', 'luck'];
  const MASTERY = 1.01; // 숙련 1레벨당 혼 가치 배수
  const capOf = id => { const U = UPGRADES.find(u => u.id === id); return U.cap || U.max; };
  const lc = id => Math.min(lv(id), capOf(id));
  // 걸음 · 부르기 · 손길 · 인연: 처음 강화는 크게 오르고 갈수록 오르는 폭이 좁아짐 (최대 강화에서 cap/2 효과)
  const FRONT = 3, curve = x => (1 - Math.exp(-FRONT * x)) / (1 - Math.exp(-FRONT));
  const leOf = (id, L) => { const c = capOf(id); return (c / 2) * curve(Math.min(L, c) / c); };
  const le = id => leOf(id, lv(id));
  const over = (id, L = lv(id)) => Math.max(0, L - capOf(id));
  const masteryMul = () => MASTER.reduce((m, id) => m * Math.pow(MASTERY, over(id)), 1);
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- 수치 ----------
  const rebornMult = () => 1 + S.reborn * 1.5;
  const PEN = UPGRADES[0];
  const penMul = L => (1 + L * PEN.pa) * Math.pow(2, Math.floor(L / PEN.pd)); // 처음엔 강화마다 크게(+pa), 갈수록 비율이 줄어듦 · pd번마다 ×2
  const valueBase = () => SOUL_MUL * penMul(lv('pen')) * (1 + Life.dexBonus()) * Pets.mul('value') * (typeof Decor !== 'undefined' ? Decor.mul() : 1) * masteryMul() * RANKS[S.rank].mult * rebornMult() * (S.perm2 || (S.sealUntil || 0) > Date.now() ? 2 : 1);
  const boosting = () => Date.now() < S.boostUntil;
  const value = () => valueBase() * (boosting() ? 2 : 1) * (Life.buffLeft('value') > 0 ? 1.5 : 1) * Life.fortuneMul();
  const walk = () => (30 + le('step') * 3) * Life.mul('spawn') * Pets.mul('walk');
  const spawn = () => Math.max(0.1, 0.7 * Math.pow(0.93, le('call'))) / Life.mul('spawn');
  const reap = () => Math.max(0.12, 0.9 * Math.pow(0.93, le('hand')) / Pets.mul('reap'));
  const minions = () => lv('minion');
  const mWalk = () => Math.min(56, 18 * (1 + 0.4 * Math.pow(lv('drill'), 0.6)));
  const mReap = () => Math.max(0.35, 1.5 * Math.pow(0.975, 4 * Math.sqrt(lv('drill'))));
  const drillMulOf = L => 1 + 0.45 * Math.pow(L, 0.55); // 처음 강화가 크게
  const drillMul = () => drillMulOf(lv('drill'));
  const OFFLINE_RATE = 0.12; // 자리 비운 동안 받는 비율 (켜 둔 실제 수입 대비 12%, 복귀 2배 광고로 24%)
  const offHoursOf = L => 2 + 6 * (1 - Math.exp(-L / 12)) / (1 - Math.exp(-40 / 12)); // 처음 강화가 크게, 최대 8시간
  const offHours = () => Math.min(8, offHoursOf(lv('ledger')));
  function tierProbs() {
    const L = le('luck');
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
    const group = 1.25 + 1.5 * (1 - Math.exp(-le('hand') / 8)); // 주변 혼령 함께 거두기 (한 번에 여러 개)
    const main = group / (dist / walk() + reap() + 0.15);
    const vis = Math.min(5, minions()), mr = vis ? vis / (dist / mWalk() + mReap() + 0.15) : 0;
    // 거두는 속도는 혼령이 나타나는 속도(1/spawn)를 넘을 수 없음 — 함께 거두기도 이 한도 안에서
    const cap = 1 / spawn(), tot = main + mr, coll = Math.min(cap, tot);
    const shareM = tot ? mr / tot : 0;
    const scale = vis ? (minions() / vis) * drillMul() : 0;
    const v = Math.max(1, (noBoost ? valueBase() : value()) * avgTier()); // 혼 1개 최소 1
    return coll * v * ((1 - shareM) + shareM * scale);
  }
  const tapValue = () => value() * 1.5;
  const wraithDps = () => (incomePerSec() + value() * 2) * Life.mul('fight');
  const tapDmg = () => (value() * 3 + incomePerSec() * 0.15) * Life.mul('fight');

  // 업그레이드 효과 표기 (레벨 L 기준)
  function eff(id, L) {
    if (MASTER.includes(id) && L > capOf(id)) return '숙련 ×' + Math.pow(MASTERY, L - capOf(id)).toFixed(2); // 혼 가치 배수
    return effBase(id, L);
  }
  function effBase(id, L) {
    switch (id) {
      case 'pen': { const m = penMul(L); return '×' + (m >= 100 ? fmt(m) : m.toFixed(2)); }
      case 'step': return Math.round(18 + leOf('step', L) * 2.2) + '보';
      case 'call': return Math.max(0.3, 2.4 * Math.pow(0.93, leOf('call', L))).toFixed(2) + '초';
      case 'hand': return Math.max(0.18, 0.9 * Math.pow(0.93, leOf('hand', L))).toFixed(2) + '초';
      case 'luck': { const l = leOf('luck', L), p = 0.004 * (1 + 0.15 * l) + 0.015 * (1 + 0.12 * l) + 0.06 * (1 + 0.1 * l); return (p * 100).toFixed(1) + '%'; }
      case 'minion': return L + '명';
      case 'drill': return '×' + drillMulOf(L).toFixed(2);
      case 'ledger': { const m = Math.round(Math.min(8, offHoursOf(L)) * 60), H = Math.floor(m / 60), M = m % 60; return H + '시간' + (M ? ' ' + M + '분' : ''); }
    }
  }
  // ---------- 비용 ----------
  function cost(id, n = 1) {
    const U = UPGRADES.find(u => u.id === id); let c = 0, L = lv(id);
    for (let i = 0; i < n && L + i < U.max; i++) { const k = L + i, cp = U.cap || U.max; c += Math.ceil((k < cp ? U.base * Math.pow(U.grow, k) : U.base * Math.pow(U.grow, cp) * Math.pow(U.grow2 || 1.22, k - cp + 1)) * (U.sq ? Math.exp(U.sq * k * k) : 1)); }
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
  // 업그레이드 레벨: 강화 경험치(구매 횟수)가 쌓여서 오름. 뒤로 갈수록 다음 레벨까지 경험치가 더 필요 (XP_POW)
  const XP_POW = 1.3, MAX_LEVEL = 99;
  const U_ = id => UPGRADES.find(u => u.id === id);
  const xpNeed = (id, k) => { const U = U_(id); return k <= 0 ? 0 : k >= U.lmax ? U.max : Math.ceil(U.max * Math.pow(k / U.lmax, XP_POW)); }; // k레벨까지 누적 경험치
  function ulv(id, P = lv(id)) { const U = U_(id); if (P >= U.max) return U.lmax; let k = Math.floor(U.lmax * Math.pow(P / U.max, 1 / XP_POW)); while (k < U.lmax && xpNeed(id, k + 1) <= P) k++; while (k > 0 && xpNeed(id, k) > P) k--; return k; }
  // 현재 레벨 안에서의 경험치 진행 { lv, cur, need } (need 0 = 최대)
  const uxp = id => { const P = lv(id), k = ulv(id, P), U = U_(id); if (k >= U.lmax) return { lv: k, cur: 0, need: 0 }; const a = xpNeed(id, k), b = xpNeed(id, k + 1); return { lv: k, cur: P - a, need: b - a }; };
  const level = () => Math.min(MAX_LEVEL, 1 + UPGRADES.reduce((a, U) => a + ulv(U.id), 0));
  const canTest = () => !!nextRank() && level() >= nextRank().lv;
  const testHp = () => nextRank() ? nextRank().hp * rebornMult() : 0;
  function promote() {
    const N = nextRank(); if (!N || !canTest()) return false;
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
  function gain(n) { if (n > 0 && n < 1) n = 1; S.souls += n; S.total += n; } // 0.몇 보상은 최소 1
  function roll() { const sp = Life.rollSpecial(RANKS[S.rank].region, le('luck')); return sp >= 0 ? { tier: 2, sp } : { tier: rollTier(), sp: -1 }; }
  function collect(tier, who, sp) {
    let v = value() * TIER_MULT[tier];
    if (who === 'minion') { const vis = Math.min(5, minions()); v *= (minions() / Math.max(1, vis)) * drillMul(); }
    if (who === 'tap') { v = tapValue() * TIER_MULT[tier]; S.stats.tap++; }
    v = Math.max(1, v); // 처음에도 혼 1개는 최소 1 (가치가 1보다 작을 때 '+0' 으로 보이지 않게)
    gain(v); return v;
  }
  function addBoost(min) { S.boostUntil = Math.max(Date.now(), S.boostUntil) + min * 60000; S.boostUntil = Math.min(S.boostUntil, Date.now() + 180 * 60000); apply(); save(); }

  function apply() {
    Scene.config({ spawn: spawn(), walk: walk(), reap: reap(), minions: minions(), mWalk: mWalk(), mReap: mReap(), roll, maxSouls: 18 + Math.min(18, Math.floor(le('call') / 2)), reapR: Math.min(26, 14 + le('hand') * 0.4), reapMax: 3 + Math.floor(le('hand') / 6), speed: boosting() ? 1.3 : 1 });
    Scene.setRegion(RANKS[S.rank].region);
    if (S.kind) Scene.setKind(S.kind);
    Scene.setRank(S.rank);
    Scene.setPet(S.petEq && S.pets && S.pets[S.petEq] ? Pets.P(S.petEq) : null);
  }

  // ---------- 광고 ----------
  function adsToday() { if (S.ads.day !== today()) S.ads = { day: today(), boost: 0, jade: 0 }; return S.ads; }
  const adLeft = k => AD_LIMIT[k] - (adsToday()[k] || 0);
  function useAd(k) { const a = adsToday(); a[k] = (a[k] || 0) + 1; save(); }

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
  // 하루 구매 제한(daily)이 있는 상품: 오늘 몇 번 더 살 수 있는지
  function iapDay() { const d = new Date().toISOString().slice(0, 10); if (!S.iapDay || S.iapDay.day !== d) S.iapDay = { day: d, n: {} }; return S.iapDay; }
  function iapLeft(id) { const P = SHOP_IAP.find(p => p.id === id); if (P.once) return S.bought[id] ? 0 : 1; return P.daily ? P.daily - (iapDay().n[id] || 0) : Infinity; }
  const sealLeft = () => Math.max(0, ((S.sealUntil || 0) - Date.now()) / 1000);
  function iap(id) {
    const P = SHOP_IAP.find(p => p.id === id);
    if (iapLeft(id) <= 0) return false;
    if (P.daily) { const d = iapDay(); d.n[id] = (d.n[id] || 0) + 1; }
    if (P.seal) S.sealUntil = Math.max(Date.now(), S.sealUntil || 0) + P.seal * 86400e3;
    S.bought[id] = (S.bought[id] || 0) + 1;
    if (P.jade) S.jade += P.jade;
    if (P.minion) S.upg.minion = Math.min(capOf('minion'), lv('minion') + P.minion);
    if (P.hours) gain(incomePerSec(true) * 3600 * P.hours);
    if (P.boost) addBoost(P.boost);
    if (P.perm2) S.perm2 = true;
    if (P.noAds) S.noAds = true;
    apply(); save(); return true;
  }
  function jbuyDay() { const d = new Date().toISOString().slice(0, 10); if (!S.jbuy || S.jbuy.day !== d) S.jbuy = { day: d, n: {} }; return S.jbuy; }
  // 오늘 남은 구매 횟수 (제한 없으면 Infinity) · 지금 가격 (다 샀으면 null)
  // 특급 졸개: 졸개가 최대(고용 한도)면 더 살 수 없음
  const jadeMaxed = id => { const J = JADE_SHOP.find(j => j.id === id); return !!(J && J.minion && lv('minion') >= capOf('minion')); };
  function jadeLeft(id) { const J = JADE_SHOP.find(j => j.id === id); return J.day ? J.day - (jbuyDay().n[id] || 0) : Infinity; }
  function jadeCost(id) { const J = JADE_SHOP.find(j => j.id === id); if (!J.prices) return J.cost; const k = jbuyDay().n[id] || 0; return k < J.prices.length ? J.prices[k] : null; }
  function jadeBuy(id) {
    const J = JADE_SHOP.find(j => j.id === id), cost = jadeCost(id);
    if (cost == null || jadeLeft(id) <= 0 || S.jade < cost) return false;
    if (J.minion && lv('minion') >= capOf('minion')) return false;
    S.jade -= cost; if (J.day) { const b = jbuyDay(); b.n[id] = (b.n[id] || 0) + 1; }
    let got = 0;
    if (J.hours) { got = incomePerSec(true) * 3600 * J.hours; gain(got); }
    if (J.boost) addBoost(J.boost);
    if (J.minion) S.upg.minion = lv('minion') + 1;
    apply(); save(); return got || true;
  }

  // ---------- 저장 ----------
  // 다른 저장(클라우드)으로 통째로 바꾸기
  function replace(obj) { S = Object.assign(fresh(), obj || {}); awayFrom = S.last || 0; Life.ensure(); Pets.ensure(); Story.ensure(); if (typeof Decor !== 'undefined') Decor.ensure(); migrate(); save(); apply(); }
  function save() { if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
    if (!S) S = fresh();
    awayFrom = S.last || 0; // 켜자마자 다른 곳에서 저장해도 자리 비운 시간이 사라지지 않게 미리 기억
    Life.ensure(); Pets.ensure(); Story.ensure(); if (typeof Decor !== 'undefined') Decor.ensure();
    migrate();
  }
  function migrate() {
    if (S.kind && S.name && !S.nickSet) S.nickSet = true; // 예전에 만든 캐릭터: 처음 정한 이름을 닉네임으로
    if (S.perm2) { S.perm2 = false; S.sealUntil = Math.max(S.sealUntil || 0, Date.now() + 7 * 86400e3); } // 영구 인장 → 7일 인장으로 바뀜
  }
  // 자리 비운 시간 보상 (졸개들이 대신 거둠, 효율 12%)
  let awayFrom = 0;
  function offline() {
    const from = awayFrom || S.last; awayFrom = 0;
    const away = Math.max(0, (Date.now() - from) / 1000);
    if (!S.kind || away < 60) return null;
    const secs = Math.min(away, offHours() * 3600);
    const amt = incomePerSec(true) * secs * OFFLINE_RATE;
    return { away, secs, amt, capped: away > secs };
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} S = fresh(); Life.ensure(); Pets.ensure(); Story.ensure(); apply(); }

  return {
    get S() { return S; }, lv, load, save, apply, reset, replace,
    value, valueBase, incomePerSec, walk, spawn, reap, minions, mWalk, mReap, avgTier, offHours, tierProbs, tapDmg, wraithDps, drillMul, boosting,
    eff, cost, maxBuy, buy, nextRank, level, ulv, uxp, xpNeed, MAX_LEVEL, canTest, testHp, promote, canReborn, reborn, rebornMult,
    collect, gain, addBoost, adLeft, useAd, attendState, attend, iap, jadeBuy, jadeCost, jadeLeft, jadeMaxed, iapLeft, sealLeft, offline, OFFLINE_RATE,
  };
})();

// 숫자 표기: 만 · 억 · 조 · 경 · 해
function fmt(n) {
  if (n > 0 && n < 1) n = 1; // 0.몇은 1로 표시 (획득도 최소 1)
  if (n < 10) { const t = Math.floor(n * 10) / 10; return t % 1 ? t.toFixed(1) : String(t); } // 한 자리 수는 소수점 한 자리 (1.2 · 6.6 · 9.3)
  n = Math.floor(n);
  if (n < 1e4) return n.toLocaleString('ko-KR');
  const units = [['극', 1e48], ['재', 1e44], ['정', 1e40], ['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
  for (const [u, v] of units) if (n >= v) { const x = n / v; const t = x >= 100 ? String(Math.floor(x)) : (x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, ''); return t + u; }
  return String(n);
}
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? (m ? `${h}시간 ${m}분` : `${h}시간`) : m ? (s ? `${m}분 ${s}초` : `${m}분`) : `${s}초`;
}
