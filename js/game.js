// ===== 게임 상태 / 경제 / 전투 =====
const G = { state: null, battle: null, speed: 1 };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

const Game = (() => {
  // ================= 저장 =================
  function freshDaily() {
    return { date: today(), pull: 0, gem: 0, boost: 0, idle: 0, exped: 0, raidAd: 0, arenaAd: 0, attend: 0, raidUsed: 0, arenaUsed: 0 };
  }
  function defaultState() {
    return {
      gold: 1500, gems: 300, stones: 0, ench: 20,
      hero: null, gear: [], gearSeq: 0,
      owned: {}, shards: {}, team: [],
      best: 0, cur: 1, autoChallenge: true,
      idle: { gold: 0 }, boostUntil: 0, adFree: false,
      pity: 0, totalPulls: 0,
      daily: freshDaily(),
      quests: { date: '', prog: {}, claimed: {}, all: false },
      attend: { idx: 0, last: '' },
      raid: { lvl: 1, bestPct: 0 },
      arena: { pts: ARENA.start, wins: 0, losses: 0, opps: null },
      exped: [null, null, null], bought: {},
      settings: { bgm: true, sfx: true },
      lastSave: Date.now(), seenIntro: false,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = Object.assign(defaultState(), JSON.parse(raw));
        s.daily = Object.assign(freshDaily(), s.daily);
        for (const k of ['quests', 'attend', 'raid', 'arena', 'settings']) s[k] = Object.assign(defaultState()[k], s[k]);
        // 구버전 마이그레이션: 먹이 → 골드, 팀 4마리
        if (s.food) { s.gold += s.food; delete s.food; }
        if (s.idle && s.idle.food) { s.idle.gold += s.idle.food; delete s.idle.food; }
        s.team = s.team.slice(0, 4);
        if (s.hero && !CLASSES[s.hero.cls]) s.hero.cls = 'human';
        for (const o of Object.values(s.owned)) o.form = 0;
        return s;
      }
    } catch (e) { console.warn(e); }
    return null;
  }

  function save() {
    G.state.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) {}
  }

  function reset() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }

  function checkDaily() {
    const d = today(), s = G.state;
    if (s.daily.date !== d) s.daily = freshDaily();
    if (s.quests.date !== d) s.quests = { date: d, prog: {}, claimed: {}, all: false };
  }

  // ================= 보상 공통 =================
  function resolveReward(r) {
    const rate = idleRate(), o = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === 'goldMin' || k === 'foodMin') o.gold = (o.gold || 0) + Math.round(rate.gold * v);
      else if (k === 'food') o.gold = (o.gold || 0) + v;
      else o[k] = (o[k] || 0) + v;
    }
    return o;
  }
  function grant(r, mult = 1) {
    const s = G.state, o = {};
    for (const k of ['gold', 'gems', 'stones', 'ench']) if (r[k]) { o[k] = Math.round(r[k] * mult); s[k] += o[k]; }
    return o;
  }

  // ================= 퀘스트 / 출석 =================
  function quest(id, n = 1) {
    checkDaily();
    const q = G.state.quests;
    q.prog[id] = (q.prog[id] || 0) + n;
  }
  function questDone(Q) { return (G.state.quests.prog[Q.id] || 0) >= Q.target; }
  function claimQuest(id) {
    const Q = QUESTS.find(x => x.id === id), q = G.state.quests;
    if (!Q || q.claimed[id] || !questDone(Q)) return null;
    q.claimed[id] = true; save();
    return grant(resolveReward(Q.reward));
  }
  function allQuestsClaimed() { return QUESTS.every(Q => G.state.quests.claimed[Q.id]); }
  function claimQuestAll() {
    const q = G.state.quests;
    if (q.all || !allQuestsClaimed()) return null;
    q.all = true; save();
    return grant(QUEST_ALL_REWARD);
  }
  function questAlert() {
    checkDaily();
    const q = G.state.quests;
    return QUESTS.some(Q => questDone(Q) && !q.claimed[Q.id]) || (allQuestsClaimed() && !q.all);
  }

  function canAttend() { return G.state.attend.last !== today(); }
  function attend(mult = 1) {
    const a = G.state.attend;
    if (!canAttend()) return null;
    const r = grant(resolveReward(ATTENDANCE[a.idx]), mult);
    a.idx = (a.idx + 1) % ATTENDANCE.length; a.last = today();
    save();
    return r;
  }

  // ================= 성장 공식 =================
  function stats(lineId, lvl, form, star) {
    const L = LINE_MAP[lineId], b = RARITY[L.r].base;
    const m = (1 + 0.15 * (lvl - 1)) * FORM_MUL[form] * (1 + 0.2 * star); // 진화 대신 레벨·성급 성장 강화
    return { atk: Math.round(b.atk * m), hp: Math.round(b.hp * m), def: Math.round(b.def * m), spd: L.spd };
  }
  function monStats(id) {
    const o = G.state.owned[id], st = stats(id, o.lvl, o.form, o.star), b = Gear.bonus('m:' + id);
    st.atk += b.atk; st.hp += b.hp; st.def += b.def;
    return st;
  }
  // ----- 메인 캐릭터 -----
  function heroStats(h = G.state.hero) {
    const C = CLASSES[h.cls], m = 1 + 0.12 * (h.lvl - 1), b = Gear.bonus('hero');
    return { atk: Math.round(C.base.atk * m) + b.atk, hp: Math.round(C.base.hp * m) + b.hp, def: Math.round(C.base.def * m) + b.def, spd: C.spd };
  }
  function createHero(gender, cls, name, look = {}) {
    const s = G.state;
    s.hero = Object.assign({ gender, cls, name: name || (gender === 'f' ? '연화' : '무진'), lvl: 1 }, look);
    if (!s.gear.some(x => x.eq === 'hero')) {
      Gear.equip(Gear.create('weapon', 'B', 1).id, 'hero');
      Gear.equip(Gear.create('armor', 'C', 1).id, 'hero');
      const c = Gear.create('collar', 'C', 1);
      if (s.team[0]) Gear.equip(c.id, 'm:' + s.team[0]);
    }
    save();
    restartStage();
  }
  function heroLevelUp(times = 1) {
    const h = G.state.hero;
    let n = 0;
    while (n < times && h.lvl < HERO_MAX_LV) {
      const c = levelCost(h.lvl);
      if (G.state.gold < c.gold) break;
      G.state.gold -= c.gold; h.lvl++; n++;
    }
    if (n) quest('levelup', n);
    return n;
  }
  function heroCanLevel() { const h = G.state.hero; return h && h.lvl < HERO_MAX_LV && G.state.gold >= levelCost(h.lvl).gold; }
  function power(st) { return Math.round(st.atk * 4 + st.hp * 0.6 + st.def * 3); }
  function teamPower() { return G.state.team.reduce((a, id) => a + power(monStats(id)), G.state.hero ? power(heroStats()) : 0); }
  function levelCost(lvl) {
    const k = Math.pow(1.04, lvl);
    return { gold: Math.round(28 * lvl * k) };
  }
  function starCost(star) { return DUP_SHARDS * (star + 1); }
  function idleRate() {
    const s = Math.max(1, G.state.best);
    return { gold: 13 + s * 5 };
  }
  function boosted() { return Date.now() < G.state.boostUntil; }

  // ================= 몬스터 =================
  function give(id) {
    const s = G.state;
    if (!s.owned[id]) {
      s.owned[id] = { lvl: 1, form: 0, star: 0 };
      if (s.team.length < 4) { s.team.push(id); restartStage(); }
      return { id, isNew: true };
    }
    s.shards[id] = (s.shards[id] || 0) + DUP_SHARDS;
    return { id, isNew: false, shards: DUP_SHARDS };
  }

  function levelUp(id, times = 1) {
    const o = G.state.owned[id];
    let n = 0;
    while (n < times && o.lvl < FORM_CAP[o.form]) {
      const c = levelCost(o.lvl);
      if (G.state.gold < c.gold) break;
      G.state.gold -= c.gold; o.lvl++; n++;
    }
    if (n) quest('levelup', n);
    return n;
  }
  function canLevel(id) {
    const o = G.state.owned[id];
    if (o.lvl >= FORM_CAP[o.form]) return false;
    const c = levelCost(o.lvl);
    return G.state.gold >= c.gold;
  }
  const canEvolve = () => false; // 진화 삭제
  const evolve = () => false;
  function canStar(id) {
    const o = G.state.owned[id];
    return o.star < MAX_STAR && (G.state.shards[id] || 0) >= starCost(o.star) && G.state.stones >= STAR_STONES(o.star);
  }
  function starUp(id) {
    if (!canStar(id)) return false;
    const o = G.state.owned[id];
    G.state.shards[id] -= starCost(o.star); G.state.stones -= STAR_STONES(o.star); o.star++;
    return true;
  }
  function monAlert() { return Object.keys(G.state.owned).some(id => canStar(id)); }

  function toggleTeam(id) {
    const t = G.state.team, i = t.indexOf(id);
    if (i >= 0) { if (t.length <= 1) return 'last'; t.splice(i, 1); }
    else { if (t.length >= 4) return 'full'; t.push(id); }
    restartStage();
    return 'ok';
  }

  // ================= 뽑기 =================
  function rollRarity(guaranteeSR) {
    const s = G.state;
    s.pity++;
    let r;
    const idx = k => RARITY_ORDER.indexOf(k);
    if (s.pity >= PITY_MAX) { const x = Math.random(); r = x < 0.02 ? 'SSS' : x < 0.2 ? 'SS' : 'S'; }
    else {
      let x = Math.random() * 100;
      r = 'C';
      for (const k of RARITY_ORDER.slice().reverse()) { x -= RARITY[k].rate; if (x <= 0) { r = k; break; } }
    }
    if (guaranteeSR && idx(r) < idx(TEN_PULL_MIN)) r = TEN_PULL_MIN;
    if (idx(r) >= idx('S')) s.pity = 0;
    return r;
  }
  function pull(n) {
    const res = [];
    for (let i = 0; i < n; i++) {
      const r = rollRarity(n >= 10 && i === n - 1);
      res.push(give(pick(LINES.filter(l => l.r === r)).id));
    }
    G.state.totalPulls += n;
    quest('summon', n);
    save();
    return res;
  }

  // ================= 방치 =================
  function accrueIdle(sec) {
    const r = idleRate(), s = G.state, cap = IDLE_CAP_MIN, mul = boosted() ? 2 : 1;
    s.idle.gold = Math.min(r.gold * cap, s.idle.gold + r.gold * mul * sec / 60);
  }
  function claimIdle(mult = 1) {
    const s = G.state, g = Math.floor(s.idle.gold * mult);
    s.gold += g; s.idle.gold = 0;
    if (g) quest('idle');
    save();
    return { gold: g };
  }

  // ================= 탐험 =================
  function startExped(slot, typeIdx) {
    const E = EXPEDITIONS[typeIdx], r = idleRate(), now = Date.now();
    G.state.exped[slot] = {
      type: typeIdx, start: now, end: now + E.min * 60000,
      reward: { gold: Math.round(r.gold * E.min * E.mul), gems: E.gems, stones: E.stones, ench: E.ench },
    };
    save();
  }
  function claimExped(slot) {
    const x = G.state.exped[slot];
    if (!x || Date.now() < x.end) return null;
    G.state.exped[slot] = null;
    const r = grant(x.reward); save();
    return r;
  }
  function skipCost(slot) {
    const x = G.state.exped[slot];
    return Math.max(1, Math.ceil((x.end - Date.now()) / 600000)) * 5;
  }
  const expedAlert = () => G.state.exped.some(x => x && Date.now() >= x.end);

  // ================= 레이드 / 아레나 =================
  const raidTickets = () => RAID.tickets + G.state.daily.raidAd - G.state.daily.raidUsed;
  const arenaTickets = () => ARENA.tickets + G.state.daily.arenaAd - G.state.daily.arenaUsed;
  const raidBossId = () => RAID_BOSSES[new Date().getDay()];
  function raidBossStats(lvl) {
    const e = enemyStats(4 + lvl * 7, false);
    return { atk: Math.round(e.atk * 1.3), hp: Math.round(15000 * Math.pow(1.7, lvl - 1)), def: Math.round(e.def), spd: 0.75 };
  }
  function arenaTier(pts = G.state.arena.pts) {
    let t = ARENA_TIERS[0];
    for (const x of ARENA_TIERS) if (pts >= x.min) t = x;
    return t;
  }

  function genOpp(mult) {
    const target = Math.max(200, teamPower() * mult);
    const n = Math.max(3, Math.min(5, G.state.team.length + 1));
    const pool = LINES.filter(l => RARITY_ORDER.indexOf(l.r) < 4 || Math.random() < 0.3);
    const lines = [];
    while (lines.length < n) { const l = pick(pool).id; if (!lines.includes(l)) lines.push(l); }
    const formOf = () => 2;
    const pw = lv => lines.reduce((a, id) => a + power(stats(id, lv, formOf(lv), 0)), 0);
    let lvl = 1;
    while (lvl < 60 && pw(lvl) < target) lvl++;
    return { name: pick(NICK_A) + ' ' + pick(NICK_B), lines, lvl, form: formOf(lvl), power: pw(lvl),
      pts: Math.max(900, Math.round(G.state.arena.pts + (mult - 1) * 300 + rand(-40, 40))), mult };
  }
  function refreshOpps() {
    G.state.arena.opps = [0.8, 1.0, 1.2].map(genOpp);
    save();
    return G.state.arena.opps;
  }

  // ================= 전투 =================
  function stageInfo(s) {
    const ch = Math.ceil(s / 10), sub = ((s - 1) % 10) + 1;
    const n = ENEMY_SETS.length, set = ENEMY_SETS[(ch - 1) % n], loop = Math.floor((ch - 1) / n);
    return { ch, sub, boss: sub === 10, el: set.el, set, loop, label: `${ch}-${sub}` };
  }

  function enemyStats(s, boss) {
    const lvl = 1 + Math.floor((s - 1) * 0.8);
    const m = (1 + 0.1 * (lvl - 1)) * Math.pow(1.03, s - 1);
    const b = RARITY.C.base;
    const st = { atk: b.atk * m, hp: b.hp * m, def: b.def * m };
    if (boss) { st.atk *= 1.5; st.hp *= 3.5; st.def *= 1.3; }
    return st;
  }

  function makeWave(s, w, waves) {
    const info = stageInfo(s);
    const isBoss = info.boss && w === waves - 1;
    // 챕터마다 고정 구성: 같은 4종이 정해진 순서로 나오고, 뒤 스테이지일수록 마릿수가 늘어남
    const N = info.set.normals, sub = info.sub, form = 2;
    const list = [];
    if (isBoss) {
      list.push({ id: info.set.boss, form, boss: true });
      list.push({ id: N[0], form }, { id: N[1], form });
    } else {
      const n = Math.min(5, 2 + Math.floor((sub - 1) / 3) + w); // 1~3: 2·3마리, 4~6: 3·4, 7~9: 4·5
      for (let i = 0; i < n; i++) list.push({ id: N[(sub + w + i) % N.length], form });
    }
    return list.map((e, i) => {
      const st = enemyStats(s, e.boss);
      const u = enemyUnit(e.id, e.form, { atk: Math.round(st.atk), hp: Math.round(st.hp), def: Math.round(st.def), spd: 0.95 + ((i * 37 + s) % 10) / 100 }, i, !!e.boss);
      u.loop = info.loop;
      return u;
    });
  }

  const ENEMY_SKILL = { ghost: 'drain', ghostlady: 'drain', egghost: 'drain', reaper: 'drain', jelly: 'blast', cloud: 'blast', golem: 'blast', octo: 'blast', dragon: 'blast', fox: 'drain', bear: 'shield', crab: 'shield' };
  function enemyUnit(id, form, st, idx, boss = false) {
    const E = ENEMY_MAP[id];
    return {
      side: 'enemy', enemyId: id, lineId: null, form, idx, boss, el: E.ch, skill: ENEMY_SKILL[E.arch] || 'nuke', r: boss ? 'S' : 'C',
      atk: st.atk, maxHp: st.hp, hp: st.hp, def: st.def, spd: st.spd,
      cd: rand(0.3, 1.0), energy: -34, shield: 0, alive: true, dom: null,
    };
  }
  function unit(side, lineId, form, st, idx, boss = false) {
    const L = LINE_MAP[lineId];
    return {
      side, lineId, form, idx, boss, el: L.el, skill: L.skill, r: L.r,
      atk: st.atk, maxHp: st.hp, hp: st.hp, def: st.def, spd: st.spd,
      cd: rand(0.3, 1.0), energy: side === 'ally' ? 0 : -34, shield: 0, alive: true, dom: null,
    };
  }
  function heroUnit() {
    const h = G.state.hero, st = heroStats(), C = CLASSES[h.cls];
    return { side: 'ally', hero: true, gender: h.gender, cls: h.cls, name: h.name, lineId: null, form: 0, idx: 0, boss: false, el: null, skill: 'hero', r: 'S',
      atk: st.atk, maxHp: st.hp, hp: st.hp, def: st.def, spd: st.spd, crit: C.crit || 0, cd: rand(0.2, 0.6), energy: 0, shield: 0, alive: true, dom: null };
  }
  function teamUnits() {
    const list = G.state.hero ? [heroUnit()] : [];
    G.state.team.forEach(id => { const o = G.state.owned[id]; list.push(unit('ally', id, 2, monStats(id), list.length)); });
    return list;
  }

  function startStage(s) {
    G.state.cur = s;
    const info = stageInfo(s);
    G.battle = { mode: 'stage', stage: s, info, wave: 0, waves: 2, allies: teamUnits(), enemies: makeWave(s, 0, 2), over: false, timer: 0, next: null, time: 0, dmg: 0 };
    BattleView.render(G.battle);
    Sound.bgm(info.boss ? 'boss' : 'stage');
    UI.refreshStage();
  }
  function restartStage() { if (G.battle && G.battle.mode === 'stage') startStage(G.state.cur); }
  function resumeStage() { startStage(G.state.autoChallenge ? G.state.best + 1 : Math.max(1, G.state.best)); }
  function challenge() { G.state.autoChallenge = true; startStage(G.state.best + 1); }

  function startRaid() {
    checkDaily();
    if (raidTickets() <= 0) return false;
    G.state.daily.raidUsed++;
    quest('raid');
    const id = raidBossId(), lvl = G.state.raid.lvl;
    const boss = enemyUnit(id, 2, raidBossStats(lvl), 0, true);
    boss.raid = true; boss.energy = 0;
    G.battle = { mode: 'raid', info: { el: ENEMY_MAP[id].ch, label: `보스 레이드 Lv.${lvl}` }, wave: 0, waves: 1,
      allies: teamUnits(), enemies: [boss], over: false, timer: 0, next: null, time: 0, limit: RAID.time, dmg: 0, lvl };
    BattleView.render(G.battle);
    BattleView.warning();
    Sound.bgm('raid');
    save();
    UI.refreshStage();
    return true;
  }

  function startArena(i) {
    checkDaily();
    const opp = G.state.arena.opps && G.state.arena.opps[i];
    if (!opp || arenaTickets() <= 0) return false;
    G.state.daily.arenaUsed++;
    quest('arena');
    const enemies = opp.lines.map((id, k) => unit('enemy', id, opp.form, stats(id, opp.lvl, opp.form, 0), k));
    enemies.forEach(e => { e.energy = 0; });
    G.battle = { mode: 'arena', info: { el: 'dark', label: `아레나 vs ${opp.name}` }, wave: 0, waves: 1, opp,
      allies: teamUnits(), enemies, over: false, timer: 0, next: null, time: 0, limit: ARENA.time, dmg: 0 };
    BattleView.render(G.battle);
    BattleView.versus(opp.name);
    Sound.bgm('arena');
    save();
    UI.refreshStage();
    return true;
  }

  function giveUp() {
    const B = G.battle;
    if (!B || B.over || B.mode === 'stage') return;
    if (B.mode === 'raid') raidEnd(B, false); else arenaEnd(B, false);
  }

  function tick(dt) {
    const B = G.battle;
    if (!B) return;
    if (B.over) {
      B.timer -= dt;
      if (B.timer <= 0 && B.next) { const f = B.next; B.next = null; f(); }
      return;
    }
    B.time += dt;
    if (B.limit && B.time >= B.limit) {
      if (B.mode === 'raid') raidEnd(B, false); else arenaEnd(B, false);
      return;
    }
    for (const u of B.allies.concat(B.enemies)) {
      if (!u.alive) continue;
      u.cd -= dt;
      if (u.cd <= 0) { act(u, B); u.cd = 1.2 / u.spd; if (B.over) return; }
    }
  }

  const alive = arr => arr.filter(u => u.alive);
  function pickTarget(foes) {
    const front = foes.filter(u => u.idx < 2);
    return pick(front.length ? front : foes);
  }

  function act(u, B) {
    const foes = alive(u.side === 'ally' ? B.enemies : B.allies);
    const friends = alive(u.side === 'ally' ? B.allies : B.enemies);
    if (!foes.length) return;
    if (u.energy >= 100) {
      u.energy = 0;
      castSkill(u, foes, friends, B);
    } else {
      BattleView.lunge(u);
      hit(u, pickTarget(foes), 1, B);
      u.energy += u.raid ? 25 : 34;
    }
    BattleView.bars(u);
    checkEnd(B);
  }

  function hit(src, tgt, mult, B) {
    let elem = 1;
    if (ADV[src.el] === tgt.el) elem = 1.5;
    else if (ADV[tgt.el] === src.el) elem = 0.75;
    const crit = Math.random() < 0.12 + (src.crit || 0);
    let dmg = src.atk * mult * elem * (100 / (100 + tgt.def * 2)) * rand(0.9, 1.1) * (crit ? 1.6 : 1);
    dmg = Math.max(1, Math.round(dmg));
    const shown = dmg;
    if (tgt.shield > 0) { const a = Math.min(tgt.shield, dmg); tgt.shield -= a; dmg -= a; }
    const real = Math.min(tgt.hp, dmg);
    tgt.hp -= dmg;
    if (src.side === 'ally') B.dmg += real;
    BattleView.damage(tgt, shown, crit, elem);
    if (crit) BattleView.fx(tgt, 'hit', 0.7);
    if (tgt.hp <= 0) {
      tgt.hp = 0; tgt.alive = false;
      BattleView.die(tgt, B.mode === 'stage' && tgt.side === 'enemy');
    } else BattleView.bars(tgt);
    return shown;
  }

  function castSkill(u, foes, friends, B) {
    if (u.hero) {
      const C = CLASSES[u.cls].skill;
      BattleView.skill(u, C.name);
      const fxn = { human: 'talisman', fox: 'foxfire', goblin: 'dokkaebi' }[u.cls];
      if (C.type === 'blast') { BattleView.flash({ human: 'light', fox: 'fire', goblin: 'water' }[u.cls] || 'light'); Sound.play('blast'); foes.forEach(t => { BattleView.fx(t, fxn, 1.2); hit(u, t, C.mult, B); }); }
      else if (C.type === 'nuke') { const t = foes.reduce((a, b) => (b.hp > a.hp ? b : a)); BattleView.beam(u, t); BattleView.fx(t, fxn, 1.5); hit(u, t, C.mult, B); }
      else for (let i = 0; i < C.hits; i++) { const al = foes.filter(f => f.alive); if (!al.length) break; const t = pick(al); BattleView.beam(u, t); BattleView.fx(t, fxn, 1); hit(u, t, C.mult, B); }
      return;
    }
    BattleView.skill(u, u.raid ? '대지 진동' : SKILLS[u.skill].name);
    if (u.raid) {
      BattleView.flash(u.el); Sound.play('blast');
      foes.forEach(t => { BattleView.fx(t, u.el, 1.4); hit(u, t, 1.1, B); });
      return;
    }
    const tier = 1 + Math.max(0, RARITY_ORDER.indexOf(u.r)) * 0.12; // 등급이 높을수록 이펙트가 큼
    const sp = u.side === 'ally' ? (SKILL_TIER[u.r] || 1) : 1;      // 등급이 높을수록 스킬이 셈
    switch (u.skill) {
      case 'nuke': {
        const t = foes.reduce((a, b) => (b.hp > a.hp ? b : a));
        BattleView.beam(u, t); BattleView.fx(t, u.el, 1.3 * tier); hit(u, t, 3.2 * sp, B); break;
      }
      case 'blast':
        BattleView.flash(u.el); Sound.play('blast');
        foes.forEach(t => { BattleView.fx(t, u.el, tier); hit(u, t, 1.4 * sp, B); }); break;
      case 'heal': {
        const low = friends.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
        friends.forEach(f => { BattleView.fx(f, 'heal', f === low ? 1.1 * tier : 0.7); heal(f, (f === low ? u.atk * 3 : u.atk * 1.2) * sp); });
        Sound.play('heal'); break;
      }
      case 'shield':
        friends.forEach(f => { f.shield += Math.round(u.atk * 2 * sp); BattleView.shield(f); BattleView.fx(f, 'shield', 0.9 * tier); });
        Sound.play('shield');
        hit(u, pickTarget(foes), 1.2, B); break;
      case 'drain': {
        const t = pickTarget(foes);
        BattleView.beam(u, t); BattleView.fx(t, 'dark', 1.1 * tier);
        heal(u, hit(u, t, 2.4 * sp, B) * 0.6); break;
      }
    }
  }

  function heal(u, amt) {
    amt = Math.round(amt);
    u.hp = Math.min(u.maxHp, u.hp + amt);
    BattleView.healFx(u, amt);
    BattleView.bars(u);
  }

  function checkEnd(B) {
    if (B.over) return;
    const enemiesDead = !alive(B.enemies).length, alliesDead = !alive(B.allies).length;
    if (B.mode === 'raid') { if (enemiesDead) raidEnd(B, true); else if (alliesDead) raidEnd(B, false); return; }
    if (B.mode === 'arena') { if (enemiesDead) arenaEnd(B, true); else if (alliesDead) arenaEnd(B, false); return; }
    if (enemiesDead) {
      if (B.wave < B.waves - 1) {
        B.over = true; B.timer = 0.7;
        B.next = () => {
          B.wave++;
          B.allies.forEach(a => { if (a.alive) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.25); });
          B.enemies = makeWave(B.stage, B.wave, B.waves);
          B.over = false;
          BattleView.render(B);
          if (B.info.boss) BattleView.warning();
          UI.refreshStage();
        };
      } else stageWin(B);
    } else if (alliesDead) stageLose(B);
  }

  function stageReward(s, first) {
    const info = stageInfo(s);
    const r = { gold: Math.round(100 + s * 34), gems: 0, stones: 0, ench: 0 };
    if (info.boss) { r.gold *= 3; r.stones = first ? 3 : 1; r.ench = first ? 10 : 3; if (first) r.gems += 50; }
    else if (first && s % 5 === 0) r.gems += 20;
    else if (first) r.gems += 5;
    return r;
  }

  function stageWin(B) {
    const s = G.state, first = B.stage > s.best;
    const r = stageReward(B.stage, first);
    grant(r);
    if (first) s.best = B.stage;
    quest('stage');
    if (B.info.boss || Math.random() < 0.25) {
      const it = Gear.drop(B.stage, B.info.boss && first ? 'B' : 'C');
      r.item = it;
    }
    BattleView.banner('CLEAR!', r);
    Sound.play('win');
    B.over = true; B.timer = 1.4;
    B.next = () => startStage(s.autoChallenge ? s.best + 1 : Math.max(1, s.best));
    save();
    UI.refresh();
  }

  function stageLose(B) {
    G.state.autoChallenge = false;
    BattleView.banner('패배...', null, true);
    Sound.play('lose');
    B.over = true; B.timer = 1.6;
    B.next = () => startStage(Math.max(1, G.state.best));
    UI.toast('패배! 몬스터를 강화하고 다시 도전하세요');
    UI.refresh();
  }

  function raidEnd(B, killed) {
    if (B.over) return;
    B.over = true; B.timer = 9999; B.next = null;
    const boss = B.enemies[0];
    const pct = Math.min(1, B.dmg / boss.maxHp);
    const rate = idleRate(), lv = 1 + 0.25 * (B.lvl - 1);
    const r = {
      gold: Math.round(rate.gold * (40 + 200 * pct) * lv),
      stones: Math.floor(pct * 4) + (killed ? 3 : 0),
      ench: Math.floor(pct * 10 * lv) + (killed ? 15 : 0),
      gems: killed ? 50 : 0,
    };
    grant(r);
    if (killed || pct >= 0.5) r.item = Gear.drop(Math.max(G.state.best, 5 + B.lvl * 7), killed ? 'A' : 'B');
    const R = G.state.raid;
    R.bestPct = Math.max(R.bestPct, pct);
    if (killed) { R.lvl++; R.bestPct = 0; BattleView.banner('격파!', null); }
    Sound.play(killed ? 'win' : 'reward');
    save();
    setTimeout(() => UI.raidResult({ killed, pct, dmg: B.dmg, reward: r, lvl: B.lvl }, resumeStage), 700);
  }

  function arenaEnd(B, won) {
    if (B.over) return;
    B.over = true; B.timer = 9999; B.next = null;
    const A = G.state.arena, opp = B.opp;
    const delta = won ? Math.round(14 + 10 * opp.mult) : -8;
    const before = arenaTier();
    A.pts = Math.max(0, A.pts + delta);
    won ? A.wins++ : A.losses++;
    const got = grant(resolveReward(won ? { gems: Math.round(10 + 10 * opp.mult), goldMin: 10, ench: 3 } : { goldMin: 3 }));
    if (won && Math.random() < 0.3) got.item = Gear.drop(G.state.best, 'B');
    const after = arenaTier();
    refreshOpps();
    Sound.play(won ? 'win' : 'lose');
    BattleView.banner(won ? '승리!' : '패배...', null, !won);
    save();
    setTimeout(() => UI.arenaResult({ won, delta, pts: A.pts, reward: got, promoted: after.min > before.min ? after : null }, resumeStage), 900);
  }

  // ================= 초기화 / 메인루프 =================
  function init() {
    const loaded = load();
    G.state = loaded || defaultState();
    if (!loaded) ['jipsin', 'tteok', 'dukkeobi'].forEach(id => give(id));
    checkDaily();
    Sound.set('bgm', G.state.settings.bgm);
    Sound.set('sfx', G.state.settings.sfx);
    const away = Math.min(IDLE_CAP_MIN * 60, (Date.now() - G.state.lastSave) / 1000);
    if (loaded && away > 60) { accrueIdle(away); UI.offline(away); }
    resumeStage();
    let last = performance.now(), lastReal = Date.now(), saveT = 0, uiT = 0;
    function loop(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const realNow = Date.now(), realDt = Math.min(IDLE_CAP_MIN * 60, (realNow - lastReal) / 1000); lastReal = realNow;
      tick(dt * (boosted() ? 2 : 1) * G.speed);
      accrueIdle(realDt);
      uiT += dt; saveT += dt;
      if (uiT > 0.25) { uiT = 0; UI.tickUI(); }
      if (saveT > 10) { saveT = 0; checkDaily(); save(); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    window.addEventListener('beforeunload', save);
    if (!G.state.hero) UI.createHero(!G.state.seenIntro);
    else if (!G.state.seenIntro) UI.intro();
    else if (canAttend()) setTimeout(() => UI.attendance(), 600);
  }

  return {
    init, save, reset, checkDaily, stats, monStats, heroStats, createHero, heroLevelUp, heroCanLevel, power, teamPower, levelCost, starCost, idleRate, boosted,
    give, levelUp, canLevel, canEvolve, evolve, canStar, starUp, monAlert, toggleTeam, pull, claimIdle,
    startExped, claimExped, skipCost, expedAlert,
    quest, questDone, claimQuest, claimQuestAll, allQuestsClaimed, questAlert, canAttend, attend, resolveReward, grant,
    raidTickets, arenaTickets, raidBossId, raidBossStats, arenaTier, refreshOpps,
    stageInfo, startStage, restartStage, resumeStage, challenge, startRaid, startArena, giveUp,
  };
})();
