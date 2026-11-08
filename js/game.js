// ===== 게임 상태 / 경제 / 전투 =====
const G = { state: null, battle: null, speed: 1 };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const today = () => new Date().toISOString().slice(0, 10);

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

const Game = (() => {
  // ---------- 저장 ----------
  function defaultState() {
    return {
      gold: 800, food: 500, gems: 300, stones: 0,
      owned: {}, shards: {}, team: [],
      best: 0, cur: 1, autoChallenge: true,
      idle: { gold: 0, food: 0 }, boostUntil: 0, adFree: false,
      pity: 0, totalPulls: 0,
      daily: { date: '', pull: 0, gem: 0, boost: 0, idle: 0, exped: 0 },
      exped: [null, null, null], bought: {},
      lastSave: Date.now(), seenIntro: false,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = Object.assign(defaultState(), JSON.parse(raw));
        s.daily = Object.assign(defaultState().daily, s.daily);
        return s;
      }
    } catch (e) { console.warn(e); }
    return null;
  }

  function save() {
    G.state.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) {}
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  function checkDaily() {
    const d = today();
    if (G.state.daily.date !== d) G.state.daily = { date: d, pull: 0, gem: 0, boost: 0, idle: 0, exped: 0 };
  }

  // ---------- 성장 공식 ----------
  function stats(lineId, lvl, form, star) {
    const L = LINE_MAP[lineId], b = RARITY[L.r].base;
    const m = (1 + 0.12 * (lvl - 1)) * FORM_MUL[form] * (1 + 0.15 * star);
    return { atk: Math.round(b.atk * m), hp: Math.round(b.hp * m), def: Math.round(b.def * m), spd: L.spd };
  }
  function monStats(id) { const o = G.state.owned[id]; return stats(id, o.lvl, o.form, o.star); }
  function power(st) { return Math.round(st.atk * 4 + st.hp * 0.6 + st.def * 3); }
  function teamPower() { return G.state.team.reduce((a, id) => a + power(monStats(id)), 0); }
  function levelCost(lvl) {
    const k = Math.pow(1.04, lvl);
    return { gold: Math.round(18 * lvl * k), food: Math.round(10 * lvl * k) };
  }
  function starCost(star) { return DUP_SHARDS * (star + 1); }
  function idleRate() { // 분당
    const s = Math.max(1, G.state.best);
    return { gold: 8 + s * 3, food: 5 + s * 2 };
  }
  function boosted() { return Date.now() < G.state.boostUntil; }

  // ---------- 몬스터 획득 / 강화 ----------
  function give(id) {
    const s = G.state;
    if (!s.owned[id]) {
      s.owned[id] = { lvl: 1, form: 0, star: 0 };
      if (s.team.length < 5) { s.team.push(id); restartStage(); }
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
      if (G.state.gold < c.gold || G.state.food < c.food) break;
      G.state.gold -= c.gold; G.state.food -= c.food; o.lvl++; n++;
    }
    return n;
  }

  function canEvolve(id) {
    const o = G.state.owned[id];
    if (o.form >= 2 || o.lvl < FORM_CAP[o.form]) return false;
    const c = EVO_COST[o.form];
    return G.state.stones >= c.stones && G.state.gold >= c.gold;
  }
  function evolve(id) {
    if (!canEvolve(id)) return false;
    const o = G.state.owned[id], c = EVO_COST[o.form];
    G.state.stones -= c.stones; G.state.gold -= c.gold; o.form++;
    return true;
  }

  function starUp(id) {
    const o = G.state.owned[id], need = starCost(o.star);
    if (o.star >= MAX_STAR || (G.state.shards[id] || 0) < need) return false;
    G.state.shards[id] -= need; o.star++;
    return true;
  }

  function toggleTeam(id) {
    const t = G.state.team, i = t.indexOf(id);
    if (i >= 0) { if (t.length <= 1) return 'last'; t.splice(i, 1); }
    else { if (t.length >= 5) return 'full'; t.push(id); }
    restartStage();
    return 'ok';
  }

  // ---------- 뽑기 ----------
  function rollRarity(guaranteeSR) {
    const s = G.state;
    s.pity++;
    let r;
    if (s.pity >= 80) r = Math.random() < 0.15 ? 'UR' : 'SSR';
    else {
      let x = Math.random() * 100;
      r = 'N';
      for (const k of ['UR', 'SSR', 'SR', 'R', 'N']) { x -= RARITY[k].rate; if (x <= 0) { r = k; break; } }
    }
    if (guaranteeSR && (r === 'N' || r === 'R')) r = 'SR';
    if (r === 'SSR' || r === 'UR') s.pity = 0;
    return r;
  }
  function pull(n) {
    const res = [];
    for (let i = 0; i < n; i++) {
      const r = rollRarity(n >= 10 && i === n - 1);
      const line = pick(LINES.filter(l => l.r === r));
      res.push(give(line.id));
    }
    G.state.totalPulls += n;
    save();
    return res;
  }

  // ---------- 방치 보상 ----------
  function accrueIdle(sec) {
    const r = idleRate(), s = G.state, cap = IDLE_CAP_MIN;
    const mul = boosted() ? 2 : 1;
    s.idle.gold = Math.min(r.gold * cap, s.idle.gold + r.gold * mul * sec / 60);
    s.idle.food = Math.min(r.food * cap, s.idle.food + r.food * mul * sec / 60);
  }
  function claimIdle(mult = 1) {
    const s = G.state, g = Math.floor(s.idle.gold * mult), f = Math.floor(s.idle.food * mult);
    s.gold += g; s.food += f; s.idle.gold = 0; s.idle.food = 0;
    save();
    return { gold: g, food: f };
  }

  // ---------- 탐험 ----------
  function startExped(slot, typeIdx) {
    const E = EXPEDITIONS[typeIdx], r = idleRate(), now = Date.now();
    G.state.exped[slot] = {
      type: typeIdx, start: now, end: now + E.min * 60000,
      reward: { gold: Math.round(r.gold * E.min * E.mul), food: Math.round(r.food * E.min * E.mul), gems: E.gems, stones: E.stones },
    };
    save();
  }
  function claimExped(slot) {
    const x = G.state.exped[slot];
    if (!x || Date.now() < x.end) return null;
    const s = G.state;
    s.gold += x.reward.gold; s.food += x.reward.food; s.gems += x.reward.gems; s.stones += x.reward.stones;
    s.exped[slot] = null; save();
    return x.reward;
  }
  function skipCost(slot) {
    const x = G.state.exped[slot];
    return Math.max(1, Math.ceil((x.end - Date.now()) / 600000)) * 5;
  }

  // ================= 전투 =================
  function stageInfo(s) {
    const ch = Math.ceil(s / 10), sub = ((s - 1) % 10) + 1;
    return { ch, sub, boss: sub === 10, el: ELEMENT_ORDER[(ch - 1) % 5], label: `${ch}-${sub}` };
  }

  function enemyStats(s, boss) {
    const lvl = 1 + Math.floor((s - 1) * 0.8);
    const m = (1 + 0.1 * (lvl - 1)) * Math.pow(1.03, s - 1);
    const b = RARITY.N.base;
    const st = { atk: b.atk * m, hp: b.hp * m, def: b.def * m };
    if (boss) { st.atk *= 1.5; st.hp *= 3.5; st.def *= 1.3; }
    return st;
  }

  function makeWave(s, w, waves) {
    const info = stageInfo(s);
    const isBoss = info.boss && w === waves - 1;
    const pool = LINES.filter(l => l.el === info.el && l.r !== 'UR');
    const others = LINES.filter(l => l.r === 'N' || l.r === 'R');
    const form = s < 15 ? 0 : s < 40 ? 1 : 2;
    const list = [];
    if (isBoss) {
      const bossLine = pick(LINES.filter(l => l.el === info.el && (l.r === 'SSR' || l.r === 'SR')));
      list.push({ line: bossLine.id, form: Math.min(2, form + 1), boss: true });
      const extra = Math.min(2, Math.floor(s / 20));
      for (let i = 0; i < extra; i++) list.push({ line: pick(pool).id, form });
    } else {
      const n = Math.min(5, 2 + Math.floor(s / 6) + (w > 0 ? 1 : 0));
      for (let i = 0; i < n; i++) list.push({ line: (Math.random() < 0.7 ? pick(pool) : pick(others)).id, form });
    }
    return list.map((e, i) => {
      const st = enemyStats(s, e.boss);
      const L = LINE_MAP[e.line];
      return unit('enemy', e.line, e.form, { atk: Math.round(st.atk), hp: Math.round(st.hp), def: Math.round(st.def), spd: L.spd * 0.95 }, i, !!e.boss);
    });
  }

  function unit(side, lineId, form, st, idx, boss = false) {
    const L = LINE_MAP[lineId];
    return {
      side, lineId, form, idx, boss, el: L.el, skill: L.skill,
      atk: st.atk, maxHp: st.hp, hp: st.hp, def: st.def, spd: st.spd,
      cd: rand(0.3, 1.0), energy: side === 'ally' ? 0 : -34, shield: 0, alive: true, dom: null,
    };
  }

  function startStage(s) {
    G.state.cur = s;
    const info = stageInfo(s);
    const allies = G.state.team.map((id, i) => {
      const o = G.state.owned[id];
      return unit('ally', id, o.form, monStats(id), i);
    });
    const waves = 2;
    G.battle = { stage: s, info, wave: 0, waves, allies, enemies: makeWave(s, 0, waves), over: false, timer: 0, next: null };
    BattleView.render(G.battle);
    UI.refreshStage();
  }

  function restartStage() { if (G.battle) startStage(G.state.cur); }

  function challenge() {
    G.state.autoChallenge = true;
    startStage(G.state.best + 1);
  }

  function tick(dt) {
    const B = G.battle;
    if (!B) return;
    if (B.over) {
      B.timer -= dt;
      if (B.timer <= 0 && B.next) { const f = B.next; B.next = null; f(); }
      return;
    }
    for (const u of B.allies.concat(B.enemies)) {
      if (!u.alive) continue;
      u.cd -= dt;
      if (u.cd <= 0) { act(u, B); u.cd = 1.2 / u.spd; if (B.over) return; }
    }
  }

  function alive(arr) { return arr.filter(u => u.alive); }

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
      castSkill(u, foes, friends);
    } else {
      const t = pickTarget(foes);
      BattleView.lunge(u);
      hit(u, t, 1);
      u.energy += 34;
    }
    BattleView.bars(u);
    checkEnd(B);
  }

  function hit(src, tgt, mult) {
    let elem = 1;
    if (ADV[src.el] === tgt.el) elem = 1.5;
    else if (ADV[tgt.el] === src.el) elem = 0.75;
    const crit = Math.random() < 0.12;
    let dmg = src.atk * mult * elem * (100 / (100 + tgt.def * 2)) * rand(0.9, 1.1) * (crit ? 1.6 : 1);
    dmg = Math.max(1, Math.round(dmg));
    let shown = dmg;
    if (tgt.shield > 0) { const a = Math.min(tgt.shield, dmg); tgt.shield -= a; dmg -= a; }
    tgt.hp -= dmg;
    BattleView.damage(tgt, shown, crit, elem);
    if (tgt.hp <= 0) { tgt.hp = 0; tgt.alive = false; BattleView.die(tgt); }
    else BattleView.bars(tgt);
    return shown;
  }

  function castSkill(u, foes, friends) {
    const sk = SKILLS[u.skill];
    BattleView.skill(u, sk.name);
    switch (u.skill) {
      case 'nuke': {
        const t = foes.reduce((a, b) => (b.hp > a.hp ? b : a));
        BattleView.beam(u, t); hit(u, t, 3.2); break;
      }
      case 'blast':
        BattleView.flash(u.el);
        foes.forEach(t => hit(u, t, 1.4)); break;
      case 'heal': {
        const low = friends.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
        friends.forEach(f => heal(f, f === low ? u.atk * 3 : u.atk * 1.2));
        break;
      }
      case 'shield':
        friends.forEach(f => { f.shield += Math.round(u.atk * 2); BattleView.shield(f); });
        hit(u, pickTarget(foes), 1.2); break;
      case 'drain': {
        const t = pickTarget(foes);
        BattleView.beam(u, t);
        const d = hit(u, t, 2.4); heal(u, d * 0.6); break;
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
    if (!alive(B.enemies).length) {
      if (B.wave < B.waves - 1) {
        B.over = true; B.timer = 0.7;
        B.next = () => {
          B.wave++;
          B.allies.forEach(a => { if (a.alive) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.25); });
          B.enemies = makeWave(B.stage, B.wave, B.waves);
          B.over = false;
          BattleView.render(B);
          UI.refreshStage();
        };
      } else win(B);
    } else if (!alive(B.allies).length) lose(B);
  }

  function stageReward(s, first) {
    const info = stageInfo(s);
    const r = { gold: Math.round(60 + s * 20), food: Math.round(40 + s * 14), gems: 0, stones: 0 };
    if (info.boss) { r.gold *= 3; r.food *= 3; r.stones = first ? 3 : 1; if (first) r.gems += 50; }
    else if (first && s % 5 === 0) r.gems += 20;
    else if (first) r.gems += 5;
    return r;
  }

  function win(B) {
    const s = G.state, first = B.stage > s.best;
    const r = stageReward(B.stage, first);
    s.gold += r.gold; s.food += r.food; s.gems += r.gems; s.stones += r.stones;
    if (first) s.best = B.stage;
    BattleView.banner('CLEAR!', r);
    B.over = true; B.timer = 1.4;
    B.next = () => startStage(s.autoChallenge ? s.best + 1 : Math.max(1, s.best));
    save();
    UI.refresh();
  }

  function lose(B) {
    const s = G.state;
    s.autoChallenge = false;
    BattleView.banner('패배...', null, true);
    B.over = true; B.timer = 1.6;
    B.next = () => startStage(Math.max(1, s.best));
    UI.toast('패배! 몬스터를 강화하고 다시 도전하세요');
    UI.refresh();
  }

  // ---------- 초기화 / 메인루프 ----------
  function init() {
    const loaded = load();
    G.state = loaded || defaultState();
    if (!loaded) {
      ['coal', 'clam', 'acorn'].forEach(id => give(id));
    }
    checkDaily();
    // 오프라인 보상
    const away = Math.min(IDLE_CAP_MIN * 60, (Date.now() - G.state.lastSave) / 1000);
    if (loaded && away > 60) {
      accrueIdle(away);
      UI.offline(away);
    }
    startStage(G.state.autoChallenge ? G.state.best + 1 : Math.max(1, G.state.best));
    let last = performance.now(), lastReal = Date.now(), saveT = 0, uiT = 0;
    function loop(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const realNow = Date.now(), realDt = Math.min(IDLE_CAP_MIN * 60, (realNow - lastReal) / 1000); lastReal = realNow;
      tick(dt * (boosted() ? 2 : 1) * G.speed);
      accrueIdle(realDt);
      uiT += dt; saveT += dt;
      if (uiT > 0.5) { uiT = 0; UI.tickUI(); }
      if (saveT > 10) { saveT = 0; checkDaily(); save(); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    window.addEventListener('beforeunload', save);
    if (!G.state.seenIntro) UI.intro();
  }

  return {
    init, save, reset, checkDaily, stats, monStats, power, teamPower, levelCost, starCost, idleRate, boosted,
    give, levelUp, canEvolve, evolve, starUp, toggleTeam, pull, claimIdle, startExped, claimExped, skipCost,
    stageInfo, startStage, restartStage, challenge,
  };
})();
