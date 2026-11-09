// ===== 생활 콘텐츠: 저승 꽃밭 · 저승 주막 · 졸개 파견 · 혼령 도감 =====
const FLOWERS = [
  { id: 'mang', name: '망각초', grow: 10 * 60, yield: [3, 5], soul: 60, pal: { P: '#a8d8ff', p: '#5a8ad0', y: '#ffffff' }, desc: '망각의 강가에 피는 푸른 풀' },
  { id: 'lotus', name: '저승 연꽃', grow: 60 * 60, yield: [2, 4], soul: 400, pal: { P: '#ffa8d0', p: '#d05a90', y: '#ffe08a' }, desc: '삼도천 물가의 분홍 연꽃' },
  { id: 'honbul', name: '혼불꽃', grow: 4 * 3600, yield: [2, 3], jade: 30, pal: { P: '#7fe8ff', p: '#2a8ac0', y: '#ffffff' }, desc: '혼불을 머금고 피는 꽃' },
  { id: 'saengsa', name: '생사화', grow: 12 * 3600, yield: [1, 2], jade: 80, pal: { P: '#ff4a5a', p: '#a01828', y: '#ffd34a' }, desc: '삶과 죽음을 잇는 붉은 꽃' },
];
const RECIPES = [
  { id: 'mangtang', name: '망각탕', need: { mang: 3 }, buff: 'value', min: 30, desc: '30분간 혼 수확 +50%' },
  { id: 'lotustea', name: '연꽃차', need: { lotus: 2, mang: 2 }, buff: 'spawn', min: 30, desc: '30분간 혼령 출현·걸음 +40%' },
  { id: 'honju', name: '혼불주', need: { honbul: 2 }, buff: 'fight', min: 60, desc: '60분간 원귀·승진 시험 화력 ×3' },
  { id: 'saengdan', name: '생사단', need: { saengsa: 1, lotus: 2 }, instant: { hours: 4, jade: 20 }, desc: '4시간치 혼 + 옥 20 즉시 획득' },
];
const BUFF_NAME = { value: '망각탕', spawn: '연꽃차', fight: '혼불주' };
const EXPEDITIONS = [
  { id: 'e0', name: '이승 마을 순찰', rank: 0, hrs: 0.5, minion: 1, seed: { mang: 3 }, hours: 0.25, jade: 0 },
  { id: 'e1', name: '서낭당 고갯길 수색', rank: 2, hrs: 2, minion: 3, seed: { lotus: 2, mang: 2 }, hours: 0.5, jade: 2 },
  { id: 'e2', name: '삼도천 뱃길 순찰', rank: 4, hrs: 4, minion: 6, seed: { honbul: 2 }, hours: 1, jade: 5 },
  { id: 'e3', name: '저승문 경비', rank: 6, hrs: 8, minion: 10, seed: { saengsa: 1, honbul: 1 }, hours: 2, jade: 10 },
  { id: 'e4', name: '명부전 심부름', rank: 7, hrs: 12, minion: 15, seed: { saengsa: 2 }, hours: 3, jade: 20, dex: 1 },
];
const SPECIALS = [
  ['아이 혼', '댕기를 맨 꼬마 혼령', 0], ['할아버지 혼', '하얀 수염의 혼령', 0], ['선비 혼', '갓을 쓴 글공부 혼령', 1], ['신부 혼', '족두리를 쓴 혼령', 1],
  ['군졸 혼', '전립을 쓴 병사 혼령', 2], ['어부 혼', '삿갓 쓴 뱃사람 혼령', 4], ['상인 혼', '돈주머니를 찬 혼령', 1], ['스님 혼', '염주를 건 혼령', 2],
  ['무희 혼', '부채를 든 춤꾼 혼령', 3], ['주정뱅이 혼', '술잔을 든 혼령', 1], ['고양이 혼', '귀가 쫑긋한 혼령', 0], ['강아지 혼', '귀가 늘어진 혼령', 3],
  ['약초꾼 혼', '머리에 잎이 난 혼령', 5], ['장군 혼', '금빛 투구의 혼령', 6], ['기생 혼', '비녀를 꽂은 혼령', 5],
  ['도깨비 혼', '뿔 달린 장난꾸러기 혼령', 7], ['용의 혼', '용의 뿔이 난 혼령', 8], ['태고의 혼', '아주 오래된 보랏빛 혼령', 8],
].map(([name, desc, region], i) => ({ i, name, desc, region }));
const PLOT_COST = [0, 0, 0, 100, 200, 400]; // 옥으로 여는 밭
// 일일 의뢰 (게시판): 하루 4개, 모두 끝내면 보너스
const QUEST_POOL = [
  { id: 'soul', name: '혼 거두기', need: [150, 300, 500], jade: 15 },
  { id: 'tap', name: '혼령을 직접 터치해서 거두기', need: [20, 40], jade: 15 },
  { id: 'wraith', name: '원귀 퇴치하기', need: [2, 3], jade: 20 },
  { id: 'harvest', name: '꽃밭에서 꽃 수확하기', need: [2, 3], jade: 20 },
  { id: 'brew', name: '주막에서 탕약 달이기', need: [1, 2], jade: 20 },
  { id: 'send', name: '졸개 파견 보내기', need: [1, 2], jade: 20 },
  { id: 'buy', name: '수련 올리기', need: [15, 30], jade: 15 },
  { id: 'ad', name: '2배 부적 쓰기', need: [1], jade: 25 },
];
const QUEST_BONUS = 60;
// 도깨비 상인 (가끔 노점에 들름)
const MERCHANT_POOL = [
  { id: 'm_honbul', name: '혼불꽃 씨앗 ×2', jade: 35, seed: { honbul: 2 } },
  { id: 'm_saengsa', name: '생사화 씨앗 ×1', jade: 50, seed: { saengsa: 1 } },
  { id: 'm_mang', name: '망각초 씨앗 ×5', soul: 200, seed: { mang: 5 } },
  { id: 'm_lotus', name: '저승 연꽃 씨앗 ×3', soul: 900, seed: { lotus: 3 } },
  { id: 'm_time', name: '3시간치 혼 보따리', jade: 60, hours: 3 },
  { id: 'm_jade', name: '옥 15개', soul: 1500, jadeGet: 15 },
  { id: 'm_honju', name: '혼불주 한 병 (60분 화력 ×3)', jade: 40, buff: ['fight', 60] },
  { id: 'm_mangtang', name: '망각탕 한 사발 (30분 수확 +50%)', soul: 600, buff: ['value', 30] },
];

const Life = (() => {
  const S = () => Game.S;
  const now = () => Date.now();
  function ensure() {
    const s = S();
    s.plots = s.plots || 3;
    s.garden = s.garden || [];
    while (s.garden.length < 6) s.garden.push(null);
    s.seeds = s.seeds || { mang: 3 };
    s.flowers = s.flowers || {};
    s.buffs = s.buffs || {};
    s.expe = s.expe || [];
    s.dex = s.dex || {};
    s.merchant = s.merchant || { next: now() + 3 * 60e3, until: 0, offers: [], bought: [] };
    questDay();
  }

  // ---------- 일일 의뢰 ----------
  function questDay() {
    const s = S(), day = new Date().toISOString().slice(0, 10);
    if (s.quest && s.quest.day === day) return;
    let seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pool = QUEST_POOL.slice(), list = [];
    while (list.length < 4) { const q = pool.splice(Math.floor(r() * pool.length), 1)[0]; list.push({ id: q.id, need: q.need[Math.floor(r() * q.need.length)], have: 0, claimed: false }); }
    s.quest = { day, list, bonus: false };
  }
  function qEvent(id, n = 1) {
    const s = S(); if (!s || !s.quest) return; questDay();
    s.quest.list.forEach(q => { if (q.id === id && q.have < q.need) q.have = Math.min(q.need, q.have + n); });
  }
  function qClaim(i) {
    const s = S(), q = s.quest.list[i]; if (!q || q.claimed || q.have < q.need) return 0;
    const P = QUEST_POOL.find(x => x.id === q.id); q.claimed = true; s.jade += P.jade; Game.save(); return P.jade;
  }
  function qBonus() { const s = S(); if (s.quest.bonus || !s.quest.list.every(q => q.claimed)) return 0; s.quest.bonus = true; s.jade += QUEST_BONUS; Game.save(); return QUEST_BONUS; }
  const qReady = () => { const s = S(); return !!(s && s.quest) && (s.quest.list.some(q => !q.claimed && q.have >= q.need) || (!s.quest.bonus && s.quest.list.every(q => q.claimed))); };

  // ---------- 도깨비 상인 ----------
  function merchantTick() {
    const m = S().merchant, t = now();
    if (t >= m.next && t >= m.until) {
      const pool = MERCHANT_POOL.slice(); m.offers = [];
      while (m.offers.length < 3) m.offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
      m.until = t + 5 * 60e3; m.next = m.until + (15 + Math.random() * 10) * 60e3; m.bought = []; Game.save();
      return 'arrive';
    }
    return null;
  }
  const merchantHere = () => { const m = S() && S().merchant; return !!m && now() < m.until; };
  const offerPrice = o => o.jade ? { jade: o.jade } : { soul: Math.max(100, Math.ceil(Game.incomePerSec(true) * o.soul)) };
  function merchantBuy(id) {
    const s = S(), m = s.merchant, o = MERCHANT_POOL.find(x => x.id === id);
    if (!merchantHere() || m.bought.includes(id)) return false;
    const pr = offerPrice(o);
    if (pr.jade) { if (s.jade < pr.jade) return false; s.jade -= pr.jade; } else { if (s.souls < pr.soul) return false; s.souls -= pr.soul; }
    if (o.seed) Object.entries(o.seed).forEach(([k, v]) => (s.seeds[k] = (s.seeds[k] || 0) + v));
    if (o.hours) Game.gain(Game.incomePerSec(true) * 3600 * o.hours);
    if (o.jadeGet) s.jade += o.jadeGet;
    if (o.buff) s.buffs[o.buff[0]] = Math.min(now() + 4 * 3600e3, Math.max(now(), s.buffs[o.buff[0]] || 0) + o.buff[1] * 60e3);
    m.bought.push(id); Game.apply(); Game.save(); return true;
  }
  const F = id => FLOWERS.find(f => f.id === id);

  // ---------- 꽃밭 ----------
  function plotState(i) {
    const p = S().garden[i]; if (!p) return { empty: true };
    const f = F(p.f), el = (now() - p.t) / 1000, k = Math.min(1, el / f.grow);
    return { f, k, left: Math.max(0, f.grow - el), ready: k >= 1, stage: k >= 1 ? 3 : k < 0.34 ? 0 : k < 0.67 ? 1 : 2 };
  }
  function plant(i, fid) {
    const s = S(); if (i >= s.plots || s.garden[i] || !(s.seeds[fid] > 0)) return false;
    s.seeds[fid]--; s.garden[i] = { f: fid, t: now() }; Game.save(); return true;
  }
  function harvest(i) {
    const st = plotState(i); if (!st.ready) return 0;
    const n = st.f.yield[0] + Math.floor(Math.random() * (st.f.yield[1] - st.f.yield[0] + 1));
    S().flowers[st.f.id] = (S().flowers[st.f.id] || 0) + n; S().garden[i] = null; Game.save(); return n;
  }
  const seedSoulCost = f => Math.max(50, Math.ceil(Game.incomePerSec(true) * f.soul));
  function buySeed(fid, n) {
    const f = F(fid), s = S();
    if (f.soul) { const c = seedSoulCost(f) * n; if (s.souls < c) return false; s.souls -= c; }
    else { const c = f.jade * n; if (s.jade < c) return false; s.jade -= c; }
    s.seeds[fid] = (s.seeds[fid] || 0) + n; Game.save(); return true;
  }
  function unlockPlot() {
    const s = S(), c = PLOT_COST[s.plots]; if (s.plots >= 6 || s.jade < c) return false;
    s.jade -= c; s.plots++; Game.save(); return true;
  }

  // ---------- 주막 ----------
  const canBrew = r => Object.entries(r.need).every(([k, v]) => (S().flowers[k] || 0) >= v);
  function brew(id) {
    const r = RECIPES.find(x => x.id === id), s = S(); if (!canBrew(r)) return false;
    Object.entries(r.need).forEach(([k, v]) => (s.flowers[k] -= v));
    let got = null;
    if (r.buff) { s.buffs[r.buff] = Math.min(now() + 4 * 3600e3, Math.max(now(), s.buffs[r.buff] || 0) + r.min * 60e3); }
    if (r.instant) { got = Game.incomePerSec(true) * 3600 * r.instant.hours; Game.gain(got); s.jade += r.instant.jade; }
    Game.apply(); Game.save(); return got || true;
  }
  const buffLeft = k => Math.max(0, ((S().buffs || {})[k] || 0) - now()) / 1000;

  // ---------- 파견 ----------
  const slots = () => 1 + (S().rank >= 3 ? 1 : 0) + (S().rank >= 6 ? 1 : 0);
  function send(id) {
    const E = EXPEDITIONS.find(e => e.id === id), s = S();
    if (s.expe.length >= slots() || s.rank < E.rank || Game.minions() < E.minion) return false;
    s.expe.push({ id, t: now() }); Game.save(); return true;
  }
  const expeLeft = x => Math.max(0, EXPEDITIONS.find(e => e.id === x.id).hrs * 3600 - (now() - x.t) / 1000);
  function claim(idx) {
    const s = S(), x = s.expe[idx]; if (!x || expeLeft(x) > 0) return null;
    const E = EXPEDITIONS.find(e => e.id === x.id), r = { seeds: E.seed, jade: E.jade, souls: Game.incomePerSec(true) * 3600 * E.hours, dex: null };
    Object.entries(E.seed).forEach(([k, v]) => (s.seeds[k] = (s.seeds[k] || 0) + v));
    s.jade += E.jade; Game.gain(r.souls);
    if (E.dex) { const pool = SPECIALS.filter(p => !s.dex[p.i]); const pick = (pool.length ? pool : SPECIALS)[Math.floor(Math.random() * (pool.length || SPECIALS.length))]; s.dex[pick.i] = (s.dex[pick.i] || 0) + 1; r.dex = pick; }
    s.expe.splice(idx, 1); Game.save(); return r;
  }

  // ---------- 도감 ----------
  function rollSpecial(region, luck) {
    if (Math.random() > 0.012 * (1 + luck * 0.05)) return -1;
    const pool = SPECIALS.filter(p => p.region <= region);
    return pool[Math.floor(Math.random() * pool.length)].i;
  }
  function catchSpecial(i) { const s = S(), first = !s.dex[i]; s.dex[i] = (s.dex[i] || 0) + 1; Game.save(); return first; }
  // 등록 1종당 혼 수확 +3%, 10마리 모으면 +2% 더
  const dexBonus = () => Object.values(S().dex || {}).reduce((a, n) => a + (n > 0 ? 0.03 : 0) + (n >= 10 ? 0.02 : 0), 0);

  // ---------- 효과 ----------
  function mul(kind) {
    if (!S()) return 1;
    if (kind === 'value') return (1 + dexBonus()) * (buffLeft('value') > 0 ? 1.5 : 1);
    if (kind === 'spawn') return buffLeft('spawn') > 0 ? 1.4 : 1;
    if (kind === 'fight') return buffLeft('fight') > 0 ? 3 : 1;
    return 1;
  }
  // 알림 점: 수확할 꽃, 끝난 파견
  function alerts() {
    const s = S(); if (!s || !s.garden) return { garden: false, expe: false, brew: false };
    return {
      garden: s.garden.some((p, i) => i < s.plots && p && plotState(i).ready),
      expe: s.expe.some(x => expeLeft(x) <= 0),
      brew: RECIPES.some(canBrew),
    };
  }
  return { qEvent, qClaim, qBonus, qReady, merchantTick, merchantHere, offerPrice, merchantBuy, ensure, plotState, plant, harvest, seedSoulCost, buySeed, unlockPlot, canBrew, brew, buffLeft, slots, send, expeLeft, claim, rollSpecial, catchSpecial, dexBonus, mul, alerts };
})();
