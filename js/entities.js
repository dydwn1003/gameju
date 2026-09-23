// 전투 엔진: 플레이어, 몬스터 AI, 보스 패턴, 투사체, 드랍, 스탯/데미지 공식
'use strict';
(function () {
  const G = (window.G = {
    state: 'title', map: null, player: null, mobs: [], shots: [], drops: [], fx: [], nums: [], teles: [],
    shake: 0, hitstop: 0, time: 0, dungeon: null, save: null, paused: false, cam: { x: 0, y: 0 },
    combo: { count: 0, t: 0 }, input: null,
  });
  const TS = R.TILE, Gd = R.Grid;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
  R.util = { rand, clamp, angDiff };

  // ─── 스탯 계산 (GDD COMBAT MATH) ─────────────────────
  R.computeStats = function (s) {
    const cls = R.CLASSES[s.cls];
    // 전직 + 세트 + 도감 보정을 하나로 합친다 (이후 코드에서는 st.adv 로 참조)
    const adv = Object.assign({}, s.adv ? R.ADVANCES[s.adv].mod : {});
    const setMods = R.Prog ? R.Prog.setMods(s.equip) : {};
    for (const k in setMods) adv[k] = (adv[k] || 0) + setMods[k];
    const dexB = R.Prog ? R.Prog.dexBonus() : 0;
    adv.atkPct = (adv.atkPct || 0) + dexB;
    adv.hpPct = (adv.hpPct || 0) + dexB;
    // 펫 · 음식 버프
    const pet = R.PETS && R.PETS.find((x) => x.id === s.pet);
    if (pet && pet.mod.movePct) adv.movePct = (adv.movePct || 0) + pet.mod.movePct;
    const tm = R.Season && R.Season.titleMod(s);
    if (tm) for (const k in tm) adv[k] = (adv[k] || 0) + tm[k];
    if (s.buffs) for (const k in s.buffs) if (s.buffs[k] > (s.playTime || 0) && R.FOODS[k]) for (const mk in R.FOODS[k].mod) adv[mk] = (adv[mk] || 0) + R.FOODS[k].mod[mk];
    const st = Object.assign({}, s.stats);
    let wAtk = 0, aDef = 0, hp = 0, mp = 0, crit = 0, atkPct = 0, elemDmg = 0, moveSpd = 0, atkSpdP = 0, elem = 'NONE';
    // 전설 효과 집계
    const legend = {};
    for (const sl of R.SLOTS) { const it = s.equip[sl]; if (it && it.legend) legend[it.legend] = (legend[it.legend] || 0) + 1; }
    if (legend.swift) { adv.movePct = (adv.movePct || 0) + 0.08; adv.dodgeCdr = (adv.dodgeCdr || 0) + 0.2; }
    for (const slot of R.SLOTS) {
      const it = s.equip[slot];
      if (!it) continue;
      const em = 1 + it.enh * 0.08;
      if (it.atk) wAtk += it.atk * em;
      if (it.def) aDef += it.def * em;
      if (it.elem) elem = it.elem;
      const om = it.atk || it.def ? 1 : 1 + it.enh * 0.06; // 장신구는 강화 시 옵션 증가
      for (const o of it.opts) {
        const v = o.v * om;
        if (o.k in st) st[o.k] += v;
        else if (o.k === 'hp') hp += v;
        else if (o.k === 'mp') mp += v;
        else if (o.k === 'crit') crit += v;
        else if (o.k === 'atkPct') atkPct += v;
        else if (o.k === 'elemDmg') elemDmg += v;
        else if (o.k === 'moveSpd') moveSpd += v;
        else if (o.k === 'atkSpd') atkSpdP += v;
      }
    }
    for (const k of ['str', 'dex', 'int', 'vit', 'luk']) st[k] = Math.round(st[k]);
    const baseAtk = cls.atkStat === 'int' ? st.int * 2.2 : st[cls.atkStat] * 2.0;
    return Object.assign(st, {
      atk: Math.round((baseAtk + wAtk) * (1 + atkPct / 100 + (adv.atkPct || 0))),
      def: Math.round((st.vit * 1.5 + aDef) * (1 + (adv.defPct || 0))),
      // 행운: 치명타율·치명타 피해 (암살자는 행운 효율 ↑) / 민첩: 공격속도 / 힘: 모든 직업 체력 소폭
      crit: Math.min(0.9, 0.05 + st.luk * R.STAT_FX.lukCrit * (cls.lukMul || 1) + crit / 100 + (cls.critBonus || 0) + (adv.crit || 0)),
      critDmg: 1.5 + st.luk * R.STAT_FX.lukCritDmg * (cls.lukMul || 1) + (adv.critDmg || 0),
      maxHp: Math.round((100 + st.vit * 20 + (cls.atkStat === 'str' ? 0 : st.str * R.STAT_FX.strHp) + s.level * 20 + hp) * (1 + (adv.hpPct || 0))),
      maxMp: Math.round(40 + st.int * 5 + s.level * 8 + mp),
      atkSpd: cls.atkSpeed * Math.min(1.8, Math.max(0.6, 1 + st.dex * R.STAT_FX.dexSpd + atkSpdP / 100)),
      legend,
      moveSpd: cls.moveSpeed * (1 + moveSpd / 100 + (adv.movePct || 0)),
      elem, elemDmg: elemDmg / 100 + (adv.elemDmg || 0), adv,
    });
  };

  // ─── 아이템 생성 ──────────────────────────────────────
  let uidSeq = Date.now() % 100000;
  R.rollGrade = function (bonus = 0, min = 0) {
    const r = Math.random() / (1 + bonus);
    let g = r < 0.005 ? 4 : r < 0.03 ? 3 : r < 0.15 ? 2 : r < 0.45 ? 1 : 0;
    return Math.max(g, min);
  };
  // 장비 종류 고르기: 무기는 직업 무기의 3종, 방어구는 직업 성향에 따라 약간 치우치게
  function pickVariant(base, cls) {
    const vs = R.ITEM_VARIANTS[base];
    if (!vs) return null;
    const lean = { MAGE: 2, RANGER: 1, ASSASSIN: 1 }[cls];
    if (lean != null && ['helmet', 'armor', 'gloves', 'boots'].includes(base) && Math.random() < 0.35) return vs[lean];
    return vs[(Math.random() * vs.length) | 0];
  }
  R.makeItem = function (slot, ilvl, grade, cls, setChance = 0, varId) {
    const tier = clamp(Math.floor((ilvl - 1) / 10), 0, 4);
    const wtype = slot === 'weapon' ? R.CLASSES[cls].weapon : null;
    const base = wtype || slot;
    const v = (varId && R.variantOf(varId)) || pickVariant(base, cls) || { id: base };
    const gm = 1 + grade * 0.15;
    const isDefault = v.id === base;
    const it = { uid: ++uidSeq, slot, wtype, var: v.id, name: isDefault ? R.ITEM_NAMES[base][tier] : `${R.TIER_WORD[tier]} ${v.name}`, grade, ilvl, enh: 0, opts: [] };
    if (slot === 'weapon') it.atk = Math.round((10 + ilvl * 4) * gm * (v.atk || 1) * rand(0.93, 1.07));
    const df = { helmet: 0.5, armor: 1, gloves: 0.35, boots: 0.4, cape: 0.3, belt: 0.25 }[slot];
    if (df) it.def = Math.max(1, Math.round((3 + ilvl * 1.6) * df * (v.def || 1) * gm * rand(0.93, 1.07)));
    // 고유 옵션 (종류마다 고정)
    for (const [k, v0, per] of v.innate || []) {
      const O = R.OPTIONS[k];
      const val = O.pct ? v0 : Math.max(1, Math.round((v0 + (per || 0) * ilvl) * (1 + grade * 0.1)));
      it.opts.push({ k, v: val, innate: true });
    }
    const acc = !it.atk && !it.def;
    const n = Math.min(4, grade + (acc ? 1 : 0)) + it.opts.length;
    const main = R.CLASSES[cls].atkStat;
    const pool = [main, main, 'vit', 'luk', 'str', 'dex', 'int', 'hp', 'mp', 'crit', 'atkPct', 'moveSpd'];
    if (slot === 'weapon') pool.push('elemDmg', 'atkPct', 'crit');
    const used = new Set(it.opts.map((o) => o.k));
    for (let i = 0; i < n; i++) {
      let k, t = 0;
      do { k = pool[(Math.random() * pool.length) | 0]; t++; } while (used.has(k) && t < 30);
      if (used.has(k)) continue;
      used.add(k);
      const O = R.OPTIONS[k];
      let v = O.roll(ilvl) * (1 + grade * 0.1);
      v = O.pct ? Math.round(v * 10) / 10 : Math.max(1, Math.round(v));
      it.opts.push({ k, v });
    }
    if (slot === 'weapon' && grade >= 2 && Math.random() < 0.55) {
      const els = ['FIRE', 'ICE', 'THUNDER', 'NATURE', 'DARK'];
      it.elem = els[(Math.random() * els.length) | 0];
      it.name = R.ELEM_PREFIX[it.elem] + ' ' + it.name;
    }
    if (setChance > 0 && R.SET_SLOTS.includes(slot) && Math.random() < setChance) it.set = tier;
    // 전설 등급: 60% 확률로 전설 효과
    if (grade >= 4 && Math.random() < 0.6) { const ks = Object.keys(R.LEGENDS); it.legend = ks[(Math.random() * ks.length) | 0]; }
    return it;
  };
  R.sellPrice = (it) => Math.round((8 + it.ilvl * 3) * (1 + it.grade * it.grade * 0.8) * (1 + it.enh * 0.25));
  R.itemMainText = (it) => (it.atk ? `공격력 +${Math.round(it.atk * (1 + it.enh * 0.08))}` : it.def ? `방어력 +${Math.round(it.def * (1 + it.enh * 0.08))}` : '장신구');
  R.optText = (o, it) => {
    const O = R.OPTIONS[o.k];
    const om = it && !it.atk && !it.def ? 1 + it.enh * 0.06 : 1;
    const v = O.pct ? (Math.round(o.v * om * 10) / 10) + '%' : Math.round(o.v * om);
    return `${O.name} +${v}`;
  };

  // ─── 플레이어 ────────────────────────────────────────
  R.createPlayer = function (save, x, y) {
    const p = {
      x, y, r: 5, vx: 0, vy: 0, z: 0, dir: 'down', aim: Math.PI / 2, state: 'idle', stateT: 0,
      comboStep: 0, comboWindow: 0, hitDone: false, iframes: 0, dodgeCd: 0, skillCd: [0, 0, 0, 0, 0], potionCd: 0, guardT: 0, buffs: [],
      flash: 0, anim: 0, status: {}, dead: false, deadT: 0, act: null, hazardT: 0,
    };
    p.st = R.computeStats(save);
    p.hp = save.hp != null ? Math.min(save.hp, p.st.maxHp) : p.st.maxHp;
    p.mp = save.mp != null ? Math.min(save.mp, p.st.maxMp) : p.st.maxMp;
    if (p.hp <= 0) p.hp = p.st.maxHp;
    return p;
  };
  R.refreshStats = function () {
    const p = G.player;
    if (!p) return;
    p.st = R.computeStats(G.save);
    p.hp = Math.min(p.hp, p.st.maxHp);
    p.mp = Math.min(p.mp, p.st.maxMp);
  };

  function dirFromAngle(a) {
    const c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(c) > Math.abs(s) * 0.9) return c > 0 ? 'right' : 'left';
    return s > 0 ? 'down' : 'up';
  }
  R.dirFromAngle = dirFromAngle;

  // 가장 가까운 적 (조준 보조)
  function nearestMob(x, y, range, ang, cone) {
    let best = null, bd = range;
    for (const m of G.mobs) {
      if (m.dead || m.hidden) continue;
      const dx = m.x - x, dy = m.y - m.hh / 2 - y, d = Math.hypot(dx, dy) - m.r;
      if (d > bd) continue;
      if (cone != null && angDiff(Math.atan2(dy, dx), ang) > cone) continue;
      if (!G.map.lineClear(x, y, m.x, m.y - 4)) continue;
      bd = d; best = m;
    }
    return best;
  }
  R.nearestMob = nearestMob;

  // 조준 보조 (칸 기준): 방향키를 누르지 않았으면 같은 행·열의 가장 가까운 적 쪽으로 돌아선다
  function autoAim(p, range) {
    if (!G.input.moving && !(G.tap && G.tap.kind === 'mob')) {
      let best = null, bd = range + 8;
      for (const m of G.mobs) {
        if (m.dead || m.hidden) continue;
        const dx = m.x - p.x, dy = m.y - p.y;
        const lat = Math.min(Math.abs(dx), Math.abs(dy)), d = Math.abs(dx) + Math.abs(dy);
        if (lat > Math.max(6, m.r * 0.8) || d - m.r > bd) continue;
        if (!G.map.lineClear(p.x, p.y - 4, m.x, m.y - 4)) continue;
        bd = d - m.r; best = m;
      }
      if (best) p.dir = Gd.dirOf(best.x - p.x, best.y - p.y);
    }
    p.aim = Gd.ANG[p.dir] != null ? Gd.ANG[p.dir] : p.aim;
  }

  function comboAction() {
    const cnt = G.combo.count + 1;
    return { cnt, bonus: R.comboBonus(cnt), landed: false };
  }
  function comboLand(ca) {
    if (ca.landed) return;
    ca.landed = true;
    G.combo.count = ca.cnt;
    G.combo.t = R.COMBO_TIMEOUT;
  }

  R.updatePlayer = function (dt) {
    const p = G.player, inp = G.input, cls = R.CLASSES[G.save.cls];
    if (p.dead) { p.deadT += dt; return; }
    p.anim += dt;
    p.iframes = Math.max(0, p.iframes - dt);
    p.dodgeCd = Math.max(0, p.dodgeCd - dt);
    p.potionCd = Math.max(0, p.potionCd - dt);
    for (let i = 0; i < p.skillCd.length; i++) p.skillCd[i] = Math.max(0, (p.skillCd[i] || 0) - dt);
    // 스킬 버프 만료
    if (p.buffs && p.buffs.length) p.buffs = p.buffs.filter((b) => (b.t -= dt) > 0);
    p.guardT = Math.max(0, (p.guardT || 0) - dt);
    updateJobs(dt);
    p.flash = Math.max(0, p.flash - dt);
    p.comboWindow -= dt;
    if (p.comboWindow <= 0 && p.state !== 'attack') p.comboStep = 0;
    if (G.combo.t > 0) { G.combo.t -= dt; if (G.combo.t <= 0) G.combo.count = 0; }
    // 자연 회복 (마을에선 빠르게)
    // 자연 회복: 마을은 빠르게, 던전은 교전 중 느리게 / 5초간 교전이 없으면 빠르게
    const RG = R.REGEN, town = G.map.kind === 'town';
    p.calmT = (p.calmT || 0) + dt;
    const rest = p.calmT > RG.restDelay;
    const regen = town ? RG.townHp : rest ? RG.hpRest : RG.hp;
    p.hp = Math.min(p.st.maxHp, p.hp + p.st.maxHp * (regen + (R.Prog.petMod().regenPct || 0) + (p.st.legend && p.st.legend.regen ? 0.006 : 0)) * dt);
    if (G.link && G.link.t > 0) { G.link.t -= dt; if (G.link.t <= 0) G.link.n = 0; }
    p.finT = Math.max(0, (p.finT || 0) - dt);
    // 음식 버프 만료 시 능력치 재계산
    const bt = G.save.buffs;
    if (bt) for (const k in bt) if (bt[k] && bt[k] <= G.save.playTime) { delete bt[k]; R.refreshStats(); R.toast(`${R.FOODS[k].name} 효과가 끝났다`, '#c8c0d8'); }
    p.mp = Math.min(p.st.maxMp, p.mp + p.st.maxMp * (town ? RG.townMp : rest ? RG.mpRest : RG.mp) * dt);
    tickStatus(p, dt, true);
    if (p.dead) return;

    // 용암/독늪
    const tile = G.map.tileAt(p.x, p.y);
    if (tile === R.T.HAZARD && p.state !== 'dodge') {
      p.hazardT -= dt;
      if (p.hazardT <= 0) { p.hazardT = 0.6; hurtPlayer(p.st.maxHp * 0.05 + 5, 'FIRE', { status: { burn: 2 }, raw: true }); }
    }
    if (G.map.switchPos && tile === R.T.SWITCH) R.onSwitch();
    if (inp.potionPressed) R.usePotion('hpPotion');
    if (inp.mpPotionPressed) R.usePotion('mpPotion');

    const stunned = p.status.stun > 0;
    const speedMul = p.status.slow > 0 ? 0.55 : 1;
    const onIce = tile === R.T.ICE;

    if (p.state === 'dodge') {
      // 회피: 최대 2칸 빠르게 미끄러지기
      p.stateT += dt;
      const ox = p.x, oy = p.y;
      if (!p.step || Gd.update(p, dt)) {
        if (p.dodgeN < 2 && Gd.tryStep(p, p.dodgeDir, 0.09)) { p.dodgeN++; Gd.update(p, 0); }
        else if (p.stateT >= 0.2) { p.state = 'idle'; }
      }
      p.vx = (p.x - ox) / Math.max(dt, 1e-3); p.vy = (p.y - oy) / Math.max(dt, 1e-3);
      if (Math.random() < 0.6) R.fxAfterimage(p);
      return;
    }
    if (p.state === 'attack') {
      p.stateT += dt;
      if (!p.hitDone && p.stateT >= p.hitAt) { p.hitDone = true; doBasicHit(p, cls); }
      if (p.step) Gd.update(p, dt);
      // 연계: 타격 이후에는 스킬로 후딜을 끊을 수 있다
      if (p.hitDone) { const si = skillInput(inp); if (si >= 0 && castSkill(p, si)) return; }
      if (p.stateT >= p.dur) {
        p.state = 'idle';
        p.comboWindow = 0.4;
        p.comboStep = (p.comboStep + 1) % 3;
        if (p.comboStep === 0) p.comboWindow = 0;
      } else if (inp.dodgePressed && p.dodgeCd <= 0 && p.stateT > p.hitAt) { startDodge(p); return; }
      else return;
    }
    if (p.state === 'skill') {
      p.stateT += dt;
      if (p.act && p.act.update) p.act.update(p, dt);
      if (p.step) Gd.update(p, dt);
      const cur = p.act && p.act.id;
      if (p.stateT >= p.act.dur) { p.state = 'idle'; p.act = null; if (G.link) { G.link.t = R.LINK.window; } }
      else if (p.stateT >= p.act.dur * R.LINK.cancelAt) {
        // 연계: 스킬 후반에 "다른" 스킬을 누르면 즉시 이어서 발동
        const si = skillInput(inp);
        if (si >= 0 && R.skillIds(G.save)[si] !== cur) { const keep = p.act; p.act = null; if (G.link) G.link.t = R.LINK.window; if (!castSkill(p, si)) p.act = keep; else return; }
        if (inp.dodgePressed && p.dodgeCd <= 0) { p.act = null; p.state = 'idle'; return startDodge(p); }
      }
      return;
    }
    if (stunned) { if (p.step) Gd.update(p, dt); return; }

    // ─── 칸 이동 (상하좌우 4방향) ───
    const mv = inp.move;
    const want = Math.hypot(mv.x, mv.y) > 0.3 ? Gd.dirOf(mv.x, mv.y) : null;
    const stepDur = TS / (p.st.moveSpd * speedMul * (1 + R.pbuf(p, 'move')));
    const ox = p.x, oy = p.y;
    // 스킬·넉백 등으로 칸 중심에서 벗어났으면 가장 가까운 빈 칸으로 정렬
    if (!p.step && (Math.abs(p.x - Gd.cx(p.gx)) > 0.5 || Math.abs(p.y - Gd.cy(p.gy)) > 0.5)) Gd.snap(p);
    if (p.step) {
      // 이동 중 입력은 도착 후 실행 (선입력)
      if (inp.dodgePressed && p.dodgeCd <= 0) p.queued = 'dodge';
      else if (skillInput(inp) >= 0) p.queued = 's' + skillInput(inp);
      else if (inp.atkPressed && !p.queued) p.queued = 'atk';
      const arrived = Gd.update(p, dt);
      p.vx = (p.x - ox) / Math.max(dt, 1e-3); p.vy = (p.y - oy) / Math.max(dt, 1e-3);
      if (!arrived) { p.state = 'walk'; return; }
      // 발자국 먼지
      const ft = G.map.tileAt(p.x, p.y);
      if (ft !== R.T.ICE && ft !== R.T.HAZARD) for (let i = 0; i < 2; i++) R.fx.push({ type: 'dust', x: p.x + (i ? 3 : -3), y: p.y - 1, vx: (i ? 12 : -12) + rand(-6, 6), vy: rand(-14, -6), life: 0.3, max: 0.3, color: G.map.theme === 'ice' ? '#e8f4ff' : G.map.kind === 'town' ? '#d8c4a0' : '#b0a090', size: 1, nograv: true });
      // 빙판: 멈추지 못하고 같은 방향으로 계속 미끄러진다
      if (G.map.tileAt(p.x, p.y) === R.T.ICE && p.stepDir && Gd.tryStep(p, p.stepDir, stepDur * 0.7)) { p.state = 'walk'; return; }
    }
    // 터치 이동·타겟 (바람의나라:연 식): 방향 입력이 있으면 취소
    if (want) G.tap = null;
    const auto = !want && G.tap ? autoPlan(p, cls) : null;
    const mdir = want || (auto && auto.dir);
    if (auto && auto.face) { p.dir = auto.face; p.aim = Gd.ANG[auto.face]; }
    const q = p.queued; p.queued = null;
    if (want) { p.dir = want; p.aim = Gd.ANG[want]; }

    // 행동
    if ((inp.dodgePressed || q === 'dodge') && p.dodgeCd <= 0) return startDodge(p);
    const si = skillInput(inp) >= 0 ? skillInput(inp) : q && q[0] === 's' ? +q[1] : -1;
    if (si >= 0) { castSkill(p, si); if (p.state === 'skill') return; }
    else if (((inp.atkPressed || inp.atkHeld || q === 'atk') && !G.interact) || (auto && auto.attack)) { startAttack(p, cls); return; }

    if (mdir && Gd.tryStep(p, mdir, stepDur)) {
      if (!want) { p.dir = mdir; p.aim = Gd.ANG[mdir]; }
      p.stepDir = mdir;
      p.state = 'walk';
      Gd.update(p, 0);
    } else { p.state = 'idle'; p.vx = 0; p.vy = 0; }
  };

  // 터치 목표까지의 다음 행동: { dir: 한 칸 이동 } / { face, attack } / null
  function autoPlan(p, cls) {
    const t = G.tap;
    if (t.kind === 'mob') {
      const m = t.mob;
      if (!m || m.dead || m.hidden) { G.tap = null; return null; }
      const mx = m.boss ? Gd.tx(m.x) : m.gx, my = m.boss ? Gd.ty(m.y) : m.gy;
      const rr = m.boss ? Math.max(1, Math.round(m.r / TS)) : 1;
      const reach = cls.melee ? rr : Math.max(2, Math.floor((cls.range || 100) / TS) - 1);
      const goal = (x, y) => {
        const dx = mx - x, dy = my - y, d = Math.abs(dx) + Math.abs(dy);
        if (dx && dy) return false;                                   // 같은 행·열
        if (cls.melee) return d >= 1 && d <= rr;
        return d >= 2 && d <= reach && Gd.lineClear(x, y, mx, my);
      };
      if (goal(p.gx, p.gy)) return { face: Gd.dirOf(mx - p.gx, my - p.gy), attack: true };
      const d = Gd.pathDir(p, goal);
      return d && d !== 'here' ? { dir: d } : null;
    }
    // 대상 옆(또는 위) 칸까지 걸어가서 상호작용
    const on = t.kind === 'tile' || t.kind === 'portal' || t.kind === 'node' || t.kind === 'exit';
    const goal = on ? (x, y) => x === t.tx && y === t.ty : (x, y) => Math.abs(x - t.tx) + Math.abs(y - t.ty) === 1;
    const d = Gd.pathDir(p, goal);
    if (d === 'here') {
      if (!on) { const f = Gd.dirOf(t.tx - p.gx, t.ty - p.gy); p.dir = f; p.aim = Gd.ANG[f]; }
      if (t.kind !== 'tile') G.tapInteract = true;
      G.tap = null;
      return null;
    }
    if (!d) { G.tap = null; return null; }
    return { dir: d };
  }
  // 화면 터치 → 목표 지정
  R.tapWorld = function (wx, wy) {
    const m = G.map, p = G.player;
    if (!m || !p || p.dead) return;
    let best = null, bd = 1e9;
    for (const mob of G.mobs) {
      if (mob.dead || mob.hidden) continue;
      const hw = Math.max(8, mob.r + 3);
      if (Math.abs(wx - mob.x) > hw || wy < mob.y - mob.hh - 3 || wy > mob.y + 5) continue;
      const d = Math.hypot(wx - mob.x, wy - (mob.y - mob.hh / 2));
      if (d < bd) { bd = d; best = mob; }
    }
    const ring = (x, y, c) => R.fx.push({ type: 'ring', x, y, r0: 10, r1: 3, life: 0.35, max: 0.35, color: c, w: 2, flat: true });
    if (best) { G.tap = { kind: 'mob', mob: best }; ring(best.x, best.y, '#ff5a5a'); R.sfx('ui'); return; }
    const tx = Gd.tx(wx), ty = Gd.ty(wy + 4);
    const near = (o, r = 10) => Math.abs(wx - o.x) < r && wy > o.y - 26 && wy < o.y + 6;
    for (const n of m.npcs) if (near(n)) { G.tap = { kind: 'npc', tx: Gd.tx(n.x), ty: Gd.ty(n.y) }; ring(n.x, n.y, '#ffe070'); return; }
    for (const c of m.chests) if (!c.open && near(c)) { G.tap = { kind: 'chest', tx: Gd.tx(c.x), ty: Gd.ty(c.y) }; ring(c.x, c.y, '#ffe070'); return; }
    if (m.lever && near(m.lever)) { G.tap = { kind: 'lever', tx: Gd.tx(m.lever.x), ty: Gd.ty(m.lever.y) }; ring(m.lever.x, m.lever.y, '#ffe070'); return; }
    for (const n of m.nodes || []) if (!n.done && near(n, 9)) { G.tap = { kind: 'node', tx: Gd.tx(n.x), ty: Gd.ty(n.y) }; ring(n.x, n.y, '#b8f0a0'); return; }
    const tile = m.get(tx, ty);
    if (R.isSolidTile(tile)) return;
    G.tap = { kind: tile === R.T.PORTAL ? 'portal' : tile === R.T.EXIT ? 'exit' : 'tile', tx, ty };
    ring(Gd.cx(tx), Gd.cy(ty), '#ffffff');
  };

  function startDodge(p) {
    p.state = 'dodge'; p.stateT = 0;
    const mv = G.input.move;
    p.dodgeDir = Math.hypot(mv.x, mv.y) > 0.3 ? Gd.dirOf(mv.x, mv.y) : Gd.dirFromAng(p.aim + Math.PI);
    p.dodgeAng = Gd.ANG[p.dodgeDir];
    p.dodgeN = 0;
    if (p.step) Gd.update(p, 1);
    p.iframes = R.DODGE_IFRAME;
    const adv = p.st.adv;
    p.dodgeCd = R.DODGE_CD * (1 - (adv.dodgeCdr || 0));
    p.comboStep = 0;
    R.sfx('dodge');
  }

  function startAttack(p, cls) {
    autoAim(p, cls.melee ? 46 : cls.range);
    const spd = p.st.atkSpd;
    const base = cls.melee ? 0.34 : 0.4;
    p.state = 'attack'; p.stateT = 0; p.hitDone = false;
    p.dur = (base + (p.comboStep === 2 ? 0.1 : 0)) / spd;
    p.hitAt = p.dur * 0.42;
    p.swingDir = p.comboStep === 1 ? -1 : 1;
    R.sfx('swing');
  }

  function doBasicHit(p, cls) {
    const step = R.COMBO_STEPS[p.comboStep];
    const ca = comboAction();
    const opt = { rate: step.rate, elem: p.st.elem, stun: step.stun, down: step.down, launch: step.launch, ca, basic: true };
    if (p.comboStep === 2) p.finT = R.LINK.finisher; // 3타 마무리 → 콤보 연계 가능
    if (cls.melee) {
      const range = cls.range * (p.comboStep === 2 ? 1.3 : 1);
      const arc = cls.arc * (p.comboStep === 2 ? 1.25 : 1);
      meleeArc(p, range, arc, opt);
      R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim, arc, r: range, life: 0.16, max: 0.16, dir: p.swingDir, color: p.comboStep === 2 ? '#ffe070' : '#ffffff' });
      if (p.comboStep === 2) { G.shake = Math.max(G.shake, 2); }
      R.fxAfterimage(p);
    } else if (cls.weapon === 'bow') {
      shoot({ x: p.x, y: p.y - 7, ang: p.aim, speed: 270, kind: 'arrow', team: 'p', r: 3, life: 0.6, opt, pierce: p.comboStep === 2 });
    } else {
      const k = p.comboStep === 2 ? 'bigbolt' : 'bolt';
      shoot({ x: p.x + Math.cos(p.aim) * 8, y: p.y - 9, ang: p.aim, speed: 190, kind: k, team: 'p', r: 4, life: 0.65, opt,
        explode: p.comboStep === 2 ? { r: 22, rate: step.rate } : null, color: R.ELEM[p.st.elem].color });
    }
  }

  // 근접 판정: 바라보는 방향의 칸 (range = 앞으로 닿는 거리, arc가 넓으면 좌우 칸까지)
  function meleeArc(p, range, arc, opt) {
    const cx = Math.cos(p.aim), cy = Math.sin(p.aim);
    const half = arc >= 1.05 ? 13 : 7;
    let hit = 0;
    for (const m of G.mobs) {
      if (m.dead || m.hidden) continue;
      const dx = m.x - p.x, dy = m.y - p.y;
      const along = dx * cx + dy * cy, lat = Math.abs(-dx * cy + dy * cx);
      if (along < -3 || along - m.r * 0.6 > range || lat > half + m.r * 0.6) continue;
      if (hitMob(m, opt, p.x, p.y - 6)) hit++;
    }
    // 덩굴 (앞 칸들)
    for (let d = TS; d <= Math.max(TS, range); d += TS) {
      R.hitVine(p.x + cx * d, p.y - 4 + cy * d);
      if (half > 10) { R.hitVine(p.x + cx * d - cy * TS, p.y - 4 + cy * d + cx * TS); R.hitVine(p.x + cx * d + cy * TS, p.y - 4 + cy * d - cx * TS); }
    }
    return hit;
  }

  // ─── 스킬 ────────────────────────────────────────────
  function castSkill(p, i) {
    const cls = R.CLASSES[G.save.cls];
    const id = R.skillIds(G.save)[i], sk = R.SKILLS[id];
    if (!sk || p.skillCd[i] > 0) return false;
    // 연계 단계 계산
    const L = G.link || (G.link = { n: 0, t: 0, last: null });
    const fin = p.finT > 0;
    let chain = L.t > 0 && L.last !== id ? Math.min(R.LINK.max, L.n + 1) : 0;
    if (fin) chain = Math.max(chain, 1);
    const cost = R.pbuf(p, 'mpFree') > 0 ? 0 : R.skillCost(sk, G.save.level, chain);
    if (p.mp < cost) { R.toast('MP가 부족합니다', '#6fb6ff'); p.skillCd[i] = 0.3; return false; }
    L.n = chain; L.last = id; L.t = 0; p.finT = 0;
    if (chain) {
      R.addNum(p.x, p.y - 34, fin && chain === 1 ? 'COMBO LINK' : 'LINK x' + (chain + 1), chain >= 3 ? '#ffb040' : '#c9a2ff', 1);
      R.sfx('crit');
    }
    const adv = p.st.adv;
    const md = R.Prog.skillMod(id); // 스킬 레벨 + 룬
    const aoe = (1 + (adv.aoePct || 0)) * md.aoe;
    const st = (base) => Object.assign({}, base || {}, md.status || {});
    autoAim(p, cls.melee ? 70 : 130);
    p.mp -= cost;
    p.skillCd[i] = sk.cd * md.cdMul;
    p.calmT = 0;
    p.state = 'skill'; p.stateT = 0;
    R.sfx(sk.elem === 'FIRE' ? 'fire' : sk.elem === 'ICE' ? 'ice' : sk.elem === 'THUNDER' ? 'thunder' : 'skill');
    const opt = { rate: sk.rate * md.dmg * (1 + chain * (R.LINK.dmg + 0.08 * ((p.st.legend || {}).chain || 0)) + (fin ? R.LINK.finisherBonus : 0)), elem: sk.elem, skill: true, ca: comboAction(), link: chain };
    if (md.status) opt.status = st();
    switch (id) {
      case 'charge': {
        const hitSet = new Set();
        p.iframes = 0.3;
        const dur = 0.28 * md.dist;
        p.act = { dur, update(p, dt) {
          R.moveBody(G.map, p, Math.cos(p.aim) * 280 * dt, Math.sin(p.aim) * 280 * dt);
          R.fxAfterimage(p);
          for (const m of G.mobs) {
            if (m.dead || hitSet.has(m)) continue;
            if (Math.hypot(m.x - p.x, m.y - p.y) < m.r + 12) { hitSet.add(m); hitMob(m, Object.assign({}, opt, { stun: 0.8 + md.stunAdd }), p.x, p.y); }
          }
        } };
        break;
      }
      case 'whirl': {
        const r = 36 * aoe;
        p.act = { dur: 0.4, update() {} };
        for (const m of G.mobs) {
          if (m.dead || m.hidden) continue;
          if (Math.hypot(m.x - p.x, m.y - m.hh / 2 - p.y + 6) < r + m.r) hitMob(m, Object.assign({}, opt, { down: true, stun: 1 }), p.x, p.y - 6);
        }
        for (let a = 0; a < 6; a++) R.hitVine(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24);
        R.fx.push({ type: 'ring', x: p.x, y: p.y - 6, r0: 8, r1: r, life: 0.3, max: 0.3, color: '#ffffff', w: 3 });
        R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim, arc: Math.PI, r, life: 0.3, max: 0.3, dir: 1, color: '#ffe070', full: true });
        G.shake = Math.max(G.shake, 3);
        break;
      }
      case 'multishot': {
        p.act = { dur: 0.25, update() {} };
        const n = 5 + md.extra, half = (n - 1) / 2;
        for (let k = 0; k < n; k++) shoot({ x: p.x, y: p.y - 7, ang: p.aim + (k - half) * (0.4 / Math.max(1, half)), speed: 260, kind: 'arrow', team: 'p', r: 3, life: 0.55, opt: Object.assign({}, opt) });
        break;
      }
      case 'pierce': {
        p.act = { dur: 0.3, update() {} };
        const n = 1 + md.extra;
        for (let k = 0; k < n; k++) shoot({ x: p.x, y: p.y - 7, ang: p.aim + (k - (n - 1) / 2) * 0.12, speed: 340, kind: 'thunder', team: 'p', r: 5, life: 0.7, pierce: true, opt: Object.assign({}, opt, { down: true, stun: 0.8 + md.stunAdd, status: st({ stun: 0.6 + md.stunAdd }) }) });
        break;
      }
      case 'fireball':
        p.act = { dur: 0.3, update() {} };
        shoot({ x: p.x + Math.cos(p.aim) * 8, y: p.y - 9, ang: p.aim, speed: 170, kind: 'fireball', team: 'p', r: 5, life: 0.9, opt: Object.assign(opt, { status: st({ burn: 3 }) }), explode: { r: 30 * aoe, rate: opt.rate } });
        break;
      case 'icelance': {
        p.act = { dur: 0.28, update() {} };
        const n = 1 + md.extra;
        for (let k = 0; k < n; k++) shoot({ x: p.x + Math.cos(p.aim) * 8, y: p.y - 9, ang: p.aim + (k - (n - 1) / 2) * 0.28, speed: 250, kind: 'icelance', team: 'p', r: 4, life: 0.7, pierce: true, opt: Object.assign({}, opt, { status: st({ slow: 3 }), stun: 0.3 }) });
        break;
      }
      case 'shadowstep': {
        const t = nearestMob(p.x, p.y - 6, 110, 0, null);
        R.fxSmoke(p.x, p.y - 6);
        if (t) {
          blinkTo(p, t);
          hitMob(t, Object.assign(opt, { forceCrit: true, stun: 0.8 }), p.x, p.y);
          R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim, arc: 0.9, r: 22, life: 0.2, max: 0.2, dir: 1, color: '#c890ff' });
        } else {
          for (let k = 0; k < 3; k++) if (!Gd.tryStep(p, p.dir, 0.01)) break; else Gd.place(p, p.gx, p.gy);
        }
        R.fxSmoke(p.x, p.y - 6);
        p.iframes = 0.35;
        p.act = { dur: 0.2, update() {} };
        break;
      }
      case 'poisonblade': {
        let n = 0, t = 0;
        const hits = 5 + md.extra;
        p.act = { dur: 0.1 * hits, update(p, dt) {
          t -= dt;
          if (t <= 0 && n < hits) {
            t = 0.09; n++;
            meleeArc(p, 24, 1.0, Object.assign({}, opt, { stun: 0.2, status: st({ poison: 4 }) }));
            R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim + (n % 2 ? 0.3 : -0.3), arc: 0.9, r: 22, life: 0.12, max: 0.12, dir: n % 2 ? 1 : -1, color: '#9aff7a' });
            R.sfx('swing');
          }
        } };
        break;
      }
      default: ultimate(p, id, opt, md, aoe, st);
    }
    if (p.act) p.act.id = id;
    if (sk.ult) { G.shake = Math.max(G.shake, 4); R.fx.push({ type: 'ring', x: p.x, y: p.y - 6, r0: 4, r1: 22, life: 0.35, max: 0.35, color: '#ffe9a8', w: 2 }); }
    if (chain) R.fx.push({ type: 'ring', x: p.x, y: p.y - 8, r0: 6, r1: 18 + chain * 6, life: 0.3, max: 0.3, color: chain >= 3 ? '#ffb040' : '#c9a2ff', w: 2 });
    return true;
  }
  const skillInput = (inp) => { for (let i = 0; i < 5; i++) if (inp.skillPressed[i] && (i < 4 || G.save.adv)) return i; return -1; };
  // 스킬 버프 합산 (atk, dmgTaken, move, crit)
  R.pbuf = (p, k) => { let v = 0; if (p && p.buffs) for (const b of p.buffs) v += b.mods[k] || 0; return v; };
  R.addBuff = (p, id, dur, mods, color) => addBuff(p, id, dur, mods, color);
  function addBuff(p, id, dur, mods, color) {
    p.buffs = (p.buffs || []).filter((b) => b.id !== id);
    p.buffs.push({ id, t: dur, max: dur, mods, color });
    R.fx.push({ type: 'ring', x: p.x, y: p.y - 8, r0: 20, r1: 6, life: 0.4, max: 0.4, color: color || '#ffe070', w: 3 });
    for (let i = 0; i < 12; i++) R.fx.push({ type: 'dust', x: p.x + rand(-7, 7), y: p.y, vx: rand(-8, 8), vy: rand(-70, -30), life: 0.7, max: 0.7, color: color || '#ffe070', size: 2, nograv: true });
  }

  // ─── 예약 작업 (궁극기 지연 피해·덫) ─────────────────
  // job.update(dt) 가 false 를 반환하면 제거
  function updateJobs(dt) {
    if (!G.jobs) G.jobs = [];
    if (!G.jobs.length) return;
    G.jobs = G.jobs.filter((j) => j.update(dt) !== false);
  }
  const addJob = (j) => { (G.jobs = G.jobs || []).push(j); };
  function areaHit(x, y, r, opt) {
    let n = 0;
    for (const m of G.mobs) {
      if (m.dead || m.hidden) continue;
      if (Math.hypot(m.x - x, (m.y - m.hh / 2 - y) * 1.3) < r + m.r) { hitMob(m, Object.assign({}, opt), x, y); n++; }
    }
    for (let a = 0; a < 6; a++) R.hitVine(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    return n;
  }
  function burst(x, y, n, colors, sp = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(sp * 0.3, sp);
      R.fx.push({ type: 'dust', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5, color: colors[i % colors.length], size: 2, nograv: true });
    }
  }
  // 대상의 상하좌우 빈 칸으로 순간이동 (뒤쪽 우선)
  function blinkTo(p, t) {
    const tx = t.boss ? Gd.tx(t.x) : t.gx, ty = t.boss ? Gd.ty(t.y) : t.gy, rr = t.boss ? Math.max(1, Math.round(t.r / TS)) : 1;
    const back = Gd.dirOf(t.x - p.x, t.y - p.y);
    const order = [back, 'left', 'right', 'up', 'down'].filter((d, i, a) => a.indexOf(d) === i);
    for (const d of order) {
      const [dx, dy] = Gd.DIRS[d];
      const nx = tx + dx * rr, ny = ty + dy * rr;
      if (!Gd.blocked(nx, ny, p)) { Gd.place(p, nx, ny); break; }
    }
    p.dir = Gd.dirOf(t.x - p.x, t.y - p.y); p.aim = Gd.ANG[p.dir];
  }

  // ─── 데이터형 스킬 (R.SKILLS 의 type 으로 동작) ──────────
  const ELC = { FIRE: '#ff8a3a', ICE: '#9ad8ff', THUNDER: '#ffe86a', NATURE: '#9aff7a', DARK: '#c890ff', NONE: '#ffffff' };
  function genericSkill(p, sk, opt, md, aoe, st) {
    const col = sk.color || ELC[sk.elem] || '#ffffff';
    const o = Object.assign({}, opt, { stun: (sk.stun || 0.3) + md.stunAdd, down: !!sk.down, status: sk.status || md.status ? st(sk.status) : undefined, forceCrit: !!sk.forceCrit });
    const cx = Math.cos(p.aim), cy = Math.sin(p.aim);
    const healOn = (n) => { if (sk.heal && n) { const h = Math.round(p.st.maxHp * sk.heal * n); p.hp = Math.min(p.st.maxHp, p.hp + h); R.addNum(p.x, p.y - 26, '+' + h, '#7fffa0', 1); } };
    switch (sk.type) {
      case 'cone': {
        const hits = sk.hits || 1, range = (sk.reach || 1) * TS + 6;
        let n = 0, t = 0;
        p.act = { dur: 0.22 + hits * 0.1, update(p, dt) {
          t -= dt;
          if (t > 0 || n >= hits) return;
          t = 0.1; n++;
          const c = meleeArc(p, range * aoe, sk.wide ? 1.2 : 0.8, o);
          healOn(c);
          R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim, arc: sk.wide ? 1.3 : 0.7, r: range, life: 0.2, max: 0.2, dir: n % 2 ? 1 : -1, color: col });
          if (sk.reach > 1) R.fx.push({ type: 'beam', x: p.x, y: p.y - 6, ang: p.aim, len: range, life: 0.2, max: 0.2, color: col, w: sk.wide ? 10 : 5 });
          G.shake = Math.max(G.shake, 2.5);
        } };
        break;
      }
      case 'nova': {
        const hits = sk.hits || 1, r = (sk.r || 36) * aoe;
        let n = 0, t = 0;
        p.act = { dur: 0.2 + hits * 0.12, update(p, dt) {
          t -= dt;
          if (t > 0 || n >= hits) return;
          t = 0.12; n++;
          healOn(areaHit(p.x, p.y - 6, r, o));
          R.fx.push({ type: 'ring', x: p.x, y: p.y - 4, r0: 6, r1: r, life: 0.3, max: 0.3, color: col, w: 3, flat: true });
          R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim + n, arc: Math.PI, r: r * 0.8, life: 0.2, max: 0.2, dir: 1, color: col, full: true });
        } };
        if (sk.selfBuff) addBuff(p, sk.name, sk.selfBuff.dur, sk.selfBuff.mods, col);
        G.shake = Math.max(G.shake, 3);
        break;
      }
      case 'line': case 'ring': {
        const n = (sk.count || 1) + (md.extra || 0);
        const fire = (k) => {
          const ang = sk.type === 'ring' ? p.aim + (k / n) * Math.PI * 2 : p.aim + (sk.seq ? 0 : (k - (n - 1) / 2) * (sk.spread || 0.15));
          shoot({ x: p.x + Math.cos(ang) * 6, y: p.y - 7, ang, speed: sk.speed || 240, kind: sk.kind || 'bolt', team: 'p', r: sk.kind === 'wave' || sk.kind === 'orb' ? 6 : 4, life: sk.life || 0.8, pierce: !!sk.pierce, opt: Object.assign({}, o), color: col, elem: sk.elem });
        };
        if (sk.seq) {
          let k = 0, t = 0;
          p.act = { dur: 0.12 * n + 0.1, update(p, dt) { t -= dt; if (t <= 0 && k < n) { t = 0.12; fire(k++); R.sfx('swing'); } } };
        } else { p.act = { dur: 0.3, update() {} }; for (let k = 0; k < n; k++) fire(k); }
        break;
      }
      case 'zone': {
        p.act = { dur: 0.4, update() {} };
        const t0 = sk.at === 'target' ? nearestMob(p.x, p.y - 6, 150, 0, null) : null;
        const count = sk.count || 1, hits = sk.hits || 1;
        for (let c = 0; c < count; c++) {
          let x, y;
          if (sk.at === 'front') { x = p.x + cx * TS * (c + 1.2); y = p.y + cy * TS * (c + 1.2); }
          else { x = t0 ? t0.x : p.x + cx * 48; y = t0 ? t0.y : p.y + cy * 40; }
          const r = (sk.r || 30) * aoe, delay = (sk.delay || 0.4) + c * 0.18;
          let t = 0, done = 0;
          addJob({ update(dt) {
            t += dt;
            if (t < delay) { R.fx.push({ type: 'zone', x, y, r: r * (0.4 + 0.6 * t / delay), life: 0.02, max: 0.02, color: col, a: 0.22 }); return true; }
            if (t >= delay + done * 0.28) {
              done++;
              areaHit(x, y - 4, r, o);
              zoneFx(sk.fx, x, y, r, col);
            }
            return done < hits;
          } });
        }
        break;
      }
      case 'buff': {
        p.act = { dur: 0.35, update() {} };
        if (sk.hpCost) { const c = Math.round(p.hp * sk.hpCost); p.hp = Math.max(1, p.hp - c); R.addNum(p.x, p.y - 24, '-' + c, '#ff6a6a', 1); }
        addBuff(p, sk.name, sk.dur, sk.mods, col);
        R.toast(`${sk.icon} ${sk.name} — ${sk.desc}`, col);
        break;
      }
      case 'leap': {
        const back = Gd.dirFromAng(p.aim + Math.PI);
        p.iframes = 0.4;
        let k = 0;
        p.act = { dur: 0.3, update(p) { if (!p.step && k < (sk.tiles || 2)) { if (Gd.tryStep(p, back, 0.09)) k++; else k = 99; } if (p.step) Gd.update(p, 1 / 60); R.fxAfterimage(p); } };
        addBuff(p, sk.name, sk.dur, sk.mods, col);
        break;
      }
      case 'dash': {
        const hitSet = new Set(), len = (sk.tiles || 3) * TS;
        let run = 0;
        p.iframes = 0.35;
        p.act = { dur: 0.3, update(p, dt) {
          if (run < len) { const v = Math.min(len - run, 320 * dt); if (!R.moveBody(G.map, p, cx * v, cy * v)) run = len; run += v; }
          R.fxAfterimage(p);
          for (const m of G.mobs) {
            if (m.dead || hitSet.has(m)) continue;
            if (Math.hypot(m.x - p.x, m.y - p.y) < m.r + 12) { hitSet.add(m); hitMob(m, o, p.x, p.y); }
          }
        } };
        break;
      }
      case 'blink': {
        const t = nearestMob(p.x, p.y - 6, 120, 0, null);
        p.act = { dur: 0.3, update() {} };
        R.fxSmoke(p.x, p.y - 6);
        if (!t) { R.toast('대상이 없다', '#c890ff'); break; }
        blinkTo(p, t);
        p.iframes = 0.3;
        hitMob(t, o, p.x, p.y);
        R.fx.push({ type: 'slash', x: t.x, y: t.y - t.hh / 2, ang: p.aim, arc: 1.2, r: 26, life: 0.22, max: 0.22, dir: 1, color: col });
        R.fxSmoke(p.x, p.y - 6);
        break;
      }
      case 'drain': {
        const t = nearestMob(p.x, p.y - 6, 120, 0, null);
        p.act = { dur: 0.45, update() {} };
        if (!t) { R.toast('대상이 없다', '#c890ff'); break; }
        hitMob(t, o, p.x, p.y);
        healOn(1);
        R.fx.push({ type: 'beam', x: p.x, y: p.y - 8, ang: Math.atan2(t.y - t.hh / 2 - p.y + 8, t.x - p.x), len: Math.hypot(t.x - p.x, t.y - t.hh / 2 - p.y + 8), life: 0.4, max: 0.4, color: col, w: 3 });
        break;
      }
    }
  }
  function zoneFx(kind, x, y, r, col) {
    if (kind === 'thunder') { R.fx.push({ type: 'beam', x, y: y - 80, ang: Math.PI / 2, len: 80, life: 0.18, max: 0.18, color: '#fff8a0', w: 4 }); G.shake = Math.max(G.shake, 3); R.sfx('thunder'); }
    else if (kind === 'fire') { for (let i = 0; i < 10; i++) R.fx.push({ type: 'dust', x: x + rand(-r / 2, r / 2), y, vx: rand(-10, 10), vy: rand(-110, -50), life: 0.5, max: 0.5, color: i % 2 ? '#ffb040' : '#ff5a2a', size: 2, nograv: true }); R.sfx('fire'); }
    else if (kind === 'arrows') { for (let i = 0; i < 6; i++) R.fx.push({ type: 'beam', x: x + rand(-r, r) * 0.7, y: y + rand(-r, r) * 0.4 - 24, ang: Math.PI / 2 + 0.2, len: 22, life: 0.15, max: 0.15, color: '#e8d8b0', w: 1 }); R.sfx('swing'); }
    else if (kind === 'ice') { for (let i = 0; i < 8; i++) R.fx.push({ type: 'dust', x: x + rand(-r, r) * 0.8, y: y + rand(-r, r) * 0.5, vx: rand(-20, 20), vy: rand(10, 40), life: 0.6, max: 0.6, color: '#e8f8ff', size: 2, nograv: true }); R.sfx('ice'); }
    else if (kind === 'poison') { R.fx.push({ type: 'zone', x, y, r, life: 0.35, max: 0.35, color: '#7ad85a', a: 0.3 }); }
    R.fx.push({ type: 'ring', x, y, r0: 4, r1: r, life: 0.3, max: 0.3, color: col, w: 3, flat: true });
  }

  function ultimate(p, id, opt, md, aoe, st) {
    switch (id) {
      default: genericSkill(p, R.SKILLS[id], opt, md, aoe, st); break;
      case 'bulwark': {
        p.act = { dur: 0.45, update() {} };
        p.guardT = 5;
        areaHit(p.x, p.y - 6, 44 * aoe, Object.assign({}, opt, { stun: 1.6 + md.stunAdd, down: true }));
        R.fx.push({ type: 'ring', x: p.x, y: p.y - 2, r0: 6, r1: 44 * aoe, life: 0.4, max: 0.4, color: '#9ad8ff', w: 4, flat: true });
        R.fx.push({ type: 'zone', x: p.x, y: p.y, r: 44 * aoe, life: 0.35, max: 0.35, color: '#9ad8ff', a: 0.35 });
        R.toast('🛡 수호의 방벽 — 5초간 받는 피해 -60%', '#9ad8ff');
        break;
      }
      case 'bloodrage': {
        const miss = 1 - p.hp / p.st.maxHp;
        const o = Object.assign({}, opt, { rate: opt.rate * (1 + miss * 1.5), down: true, stun: 1 });
        let t = 0, done = false;
        const tx = p.x + Math.cos(p.aim) * 30, ty = p.y + Math.sin(p.aim) * 30;
        p.iframes = 0.5;
        p.act = { dur: 0.5, update(p, dt) {
          t += dt;
          if (t < 0.3) { R.moveBody(G.map, p, (tx - p.x) * dt * 8, (ty - p.y) * dt * 8); R.fxAfterimage(p); }
          else if (!done) {
            done = true;
            areaHit(p.x + Math.cos(p.aim) * 10, p.y - 4, 38 * aoe, o);
            R.fx.push({ type: 'ring', x: p.x + Math.cos(p.aim) * 10, y: p.y, r0: 4, r1: 40 * aoe, life: 0.35, max: 0.35, color: '#ff4a3a', w: 4, flat: true });
            burst(p.x, p.y - 2, 18, ['#ff4a3a', '#ffb070', '#5a1010'], 110);
            G.shake = 7; R.sfx('boom');
          }
        } };
        if (miss > 0.5) R.addNum(p.x, p.y - 30, 'RAGE', '#ff4a3a', 1);
        break;
      }
      case 'deadeye': {
        p.act = { dur: 0.55, update() {} };
        let fired = false, t = 0;
        addJob({ update(dt) {
          t += dt;
          R.fx.push({ type: 'beam', x: p.x, y: p.y - 7, ang: p.aim, len: 200, life: 0.03, max: 0.03, color: '#ff6a6a', w: 0.6 });
          if (t < 0.35) return true;
          if (!fired) {
            fired = true;
            const o = Object.assign({}, opt, { forceCrit: true, down: true, stun: 0.8 });
            const cx = Math.cos(p.aim), cy = Math.sin(p.aim);
            for (const m of G.mobs) {
              if (m.dead || m.hidden) continue;
              const dx = m.x - p.x, dy = m.y - m.hh / 2 - (p.y - 7);
              const along = dx * cx + dy * cy, perp = Math.abs(-dx * cy + dy * cx);
              if (along > 0 && along < 220 && perp < m.r + 7) hitMob(m, o, m.x - cx * 6, m.y - cy * 6);
            }
            R.fx.push({ type: 'beam', x: p.x, y: p.y - 7, ang: p.aim, len: 220, life: 0.3, max: 0.3, color: '#fff4c0', w: 5 });
            R.moveBody(G.map, p, -cx * 6, -cy * 6);
            G.shake = 5; R.sfx('thunder');
          }
          return false;
        } });
        break;
      }
      case 'snare': {
        p.act = { dur: 0.35, update() {} };
        const o = Object.assign({}, opt, { stun: 1.2 + md.stunAdd, status: st({ slow: 4 }), down: true });
        for (let k = 0; k < 5; k++) {
          const a = p.aim + (k - 2) * 0.55, d = 26 + (k % 2) * 14;
          const tr = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.8, t: 10, arm: 0.3 + k * 0.05 };
          if (G.map.solidAt(tr.x, tr.y)) { tr.x = p.x; tr.y = p.y; }
          addJob({ update(dt) {
            tr.t -= dt; tr.arm -= dt;
            if (tr.t <= 0) return false;
            R.fx.push({ type: 'trap', x: tr.x, y: tr.y, life: 0.02, max: 0.02, armed: tr.arm <= 0 });
            if (tr.arm > 0) return true;
            for (const m of G.mobs) {
              if (m.dead || m.hidden || m.def.arch === 'flyer') continue;
              if (Math.hypot(m.x - tr.x, (m.y - tr.y) * 1.3) < m.r + 8) {
                areaHit(tr.x, tr.y - 4, 28 * aoe, o);
                R.fx.push({ type: 'ring', x: tr.x, y: tr.y, r0: 3, r1: 28 * aoe, life: 0.3, max: 0.3, color: '#9aff7a', w: 3, flat: true });
                burst(tr.x, tr.y - 3, 12, ['#9aff7a', '#e0c070', '#ffffff']);
                R.sfx('boom');
                return false;
              }
            }
            return true;
          } });
        }
        break;
      }
      case 'meteor': {
        p.act = { dur: 0.5, update() {} };
        const t0 = nearestMob(p.x, p.y - 6, 150, 0, null);
        const cx = t0 ? t0.x : p.x + Math.cos(p.aim) * 60, cy = t0 ? t0.y : p.y + Math.sin(p.aim) * 50;
        const o = Object.assign({}, opt, { down: true, stun: 0.8, status: st({ burn: 4 }) });
        [[0, 0], [-22, 12], [22, 10]].forEach(([ox, oy], k) => {
          const x = cx + ox * aoe, y = cy + oy * aoe, r = 32 * aoe, delay = 0.7 + k * 0.25;
          let t = 0;
          addJob({ update(dt) {
            t += dt;
            const q = Math.min(1, t / delay);
            R.fx.push({ type: 'zone', x, y, r: r * (0.3 + q * 0.7), life: 0.02, max: 0.02, color: '#ff6a2a', a: 0.25 });
            R.fx.push({ type: 'meteor', x: x + (1 - q) * 70, y: y - (1 - q) * 150, life: 0.02, max: 0.02 });
            if (t < delay) return true;
            areaHit(x, y - 4, r, o);
            R.fx.push({ type: 'ring', x, y, r0: 6, r1: r, life: 0.4, max: 0.4, color: '#ffb040', w: 4, flat: true });
            burst(x, y - 3, 20, ['#ff6a2a', '#ffe070', '#5a2a1a'], 120);
            G.shake = 6; R.sfx('boom');
            return false;
          } });
        });
        break;
      }
      case 'hex': {
        p.act = { dur: 0.5, update() {} };
        const r = 90 * aoe;
        let n = 0;
        for (const m of G.mobs) {
          if (m.dead || m.hidden) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) > r) continue;
          const cursed = m.status.curse > 0;
          hitMob(m, Object.assign({}, opt, { rate: opt.rate * (cursed ? 2 : 1), status: st({ curse: 6 }), stun: 0.5 }), p.x, p.y);
          R.fx.push({ type: 'beam', x: p.x, y: p.y - 8, ang: Math.atan2(m.y - m.hh / 2 - p.y + 8, m.x - p.x), len: Math.hypot(m.x - p.x, m.y - m.hh / 2 - p.y + 8), life: 0.3, max: 0.3, color: '#c890ff', w: 2 });
          n++;
        }
        R.fx.push({ type: 'zone', x: p.x, y: p.y, r, life: 0.5, max: 0.5, color: '#7a3aff', a: 0.22 });
        R.fx.push({ type: 'ring', x: p.x, y: p.y, r0: r, r1: 6, life: 0.45, max: 0.45, color: '#c890ff', w: 3, flat: true });
        if (n) { const h = Math.round(p.st.maxHp * 0.04 * n); p.hp = Math.min(p.st.maxHp, p.hp + h); R.addNum(p.x, p.y - 26, '+' + h, '#7fffa0', 1); }
        break;
      }
      case 'execute': {
        let t = null;
        for (const m of G.mobs) {
          if (m.dead || m.hidden || Math.hypot(m.x - p.x, m.y - p.y) > 130) continue;
          if (!t || m.hp / m.maxHp < t.hp / t.maxHp) t = m;
        }
        R.fxSmoke(p.x, p.y - 6);
        p.iframes = 0.5;
        p.act = { dur: 0.35, update() {} };
        if (!t) { R.toast('처형할 대상이 없다', '#c890ff'); break; }
        blinkTo(p, t);
        const low = t.hp / t.maxHp <= 0.3;
        hitMob(t, Object.assign({}, opt, { rate: opt.rate * (low ? 2 : 1), forceCrit: true, stun: 1, down: true }), p.x, p.y);
        R.fx.push({ type: 'slash', x: t.x, y: t.y - t.hh / 2, ang: p.aim, arc: 1.3, r: 30, life: 0.25, max: 0.25, dir: 1, color: '#ff3a5a' });
        R.fx.push({ type: 'slash', x: t.x, y: t.y - t.hh / 2, ang: p.aim + 1.6, arc: 1.3, r: 30, life: 0.25, max: 0.25, dir: -1, color: '#ffffff' });
        if (low) R.addNum(t.x, t.y - t.hh - 10, 'EXECUTE', '#ff3a5a', 1);
        R.fxSmoke(p.x, p.y - 6);
        break;
      }
      case 'clones': {
        let n = 0, tt = 0;
        const hits = 8 + md.extra;
        p.iframes = 0.12 * hits + 0.3;
        R.fxSmoke(p.x, p.y - 6);
        p.act = { dur: 0.12 * hits + 0.1, update(p, dt) {
          tt -= dt;
          if (tt > 0 || n >= hits) return;
          tt = 0.12; n++;
          const alive = G.mobs.filter((m) => !m.dead && !m.hidden && Math.hypot(m.x - p.x, m.y - p.y) < 120);
          if (!alive.length) return;
          const t = alive[n % alive.length];
          R.fxAfterimage(p);
          blinkTo(p, t);
          hitMob(t, Object.assign({}, opt, { stun: 0.3 }), p.x, p.y);
          R.fx.push({ type: 'slash', x: t.x, y: t.y - t.hh / 2, ang: p.aim + (n % 2 ? 0.8 : -0.8), arc: 1.0, r: 24, life: 0.15, max: 0.15, dir: n % 2 ? 1 : -1, color: '#b0e0ff' });
          R.sfx('swing');
        } };
        break;
      }
    }
  }

  // ─── 데미지 (GDD: (ATK*SkillRate)*ElementMod*[100/(100+DEF)]) ──
  function hitMob(m, opt, fx, fy) {
    if (m.dead) return false;
    const p = G.player, st = p.st, adv = st.adv;
    if (opt.ca) comboLand(opt.ca);
    const bonus = opt.ca ? opt.ca.bonus : 0;
    const em = R.elemMod(opt.elem, m.elem);
    let dmg = st.atk * opt.rate * em * (100 / (100 + m.armor)) * (1 + bonus) * (1 + R.pbuf(p, 'atk')) * rand(0.92, 1.08);
    if (opt.elem && opt.elem !== 'NONE') dmg *= (1 + st.elemDmg) * (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'resist' ? 0.5 : 1);
    if (opt.skill && adv.skillPct) dmg *= 1 + adv.skillPct;
    if (adv.berserk && p.hp < st.maxHp * 0.5) dmg *= 1 + adv.berserk;
    const crit = opt.forceCrit || Math.random() < st.crit + R.pbuf(p, 'crit');
    if (crit) dmg *= st.critDmg;
    const LG = st.legend || {};
    if (m.boss && LG.slayer) dmg *= 1.15;
    dmg = Math.max(1, Math.round(dmg));
    if (m.shield) { dmg = 0; }
    // 전설 효과: 흡혈 · 업화 · 마나 순환 · 치유의 일격
    if (dmg > 0) {
      const vamp = (LG.vamp || 0) * 0.03 + R.pbuf(p, 'vamp');
      if (vamp) p.hp = Math.min(st.maxHp, p.hp + dmg * vamp);
      // 황금 고블린: 맞을 때마다 금화를 흘린다
      if (m.def.treasure && Math.random() < 0.6) dropAt(m.x, m.y, { kind: 'gold', v: Math.max(1, Math.round(m.gold * 0.6)) });
      if (LG.ember && Math.random() < 0.15) applyStatus(m, { burn: 3 }, dmg);
      if (LG.mana) p.mp = Math.min(st.maxMp, p.mp + st.maxMp * 0.01 * LG.mana);
      if (LG.critheal && crit) p.hp = Math.min(st.maxHp, p.hp + st.maxHp * 0.015 * LG.critheal);
    }
    m.hp -= dmg;
    m.flash = 0.12;
    G.lastHit = { m, t: G.time };
    p.calmT = 0;
    // 기본 공격 적중 → MP 회복 (한 번 휘두를 때 한 번)
    if (opt.basic && !opt.mpGot) { opt.mpGot = true; p.mp = Math.min(st.maxMp, p.mp + st.maxMp * R.REGEN.mpOnHit); }
    m.aggro = true;
    if (m.ai === 'PATROL' || m.ai === 'RETURN') m.ai = 'CHASE';
    // 경직 / 다운 / 띄움 (보스는 무시)
    const a = Math.atan2(m.y - fy, m.x - fx);
    // 넉백: 다운 공격이면 한 칸 밀려난다 (정예는 버팀)
    if (!m.boss && opt.down && !m.elite && !m.step && m.hp > 0) { if (Gd.tryStep(m, Gd.dirOf(Math.cos(a), Math.sin(a)), 0.12)) m.movedAt = G.time; }
    if (!m.boss) {
      if (opt.stun) m.stunT = Math.max(m.stunT, opt.stun * (m.elite ? 0.5 : 1));
      if (opt.down && !m.elite) { m.downT = 1.0; m.act = null; m.ai = 'DOWNED'; }
      if (opt.launch) m.vz = 70;
      if (m.act && (opt.down || opt.stun >= 0.3) && !m.elite) m.act = null;
    }
    if (opt.status) applyStatus(m, opt.status, dmg);
    if (adv.slowOnHit) applyStatus(m, { slow: 1.5 }, dmg);
    if (adv.dotOnHit) applyStatus(m, { curse: 3 }, dmg);
    G.hitstop = Math.max(G.hitstop, crit ? 0.06 : opt.down ? 0.07 : 0.035);
    if (crit) G.shake = Math.max(G.shake, 2.5);
    const weak = em > 1;
    R.addNum(m.x, m.y - m.hh - 2, m.shield ? '0' : String(dmg) + (weak ? '!' : ''), crit ? '#ffe040' : weak ? '#ff9a3a' : '#ffffff', crit ? 2 : 1);
    R.fxHit(m.x, m.y - m.hh / 2, R.ELEM[opt.elem || 'NONE'].color, crit);
    R.sfx(crit ? 'crit' : 'hit');
    if (m.hp <= 0) killMob(m);
    return true;
  }
  R.hitMob = hitMob;

  function applyStatus(e, st, dmg) {
    const s = e.status;
    if (st.burn) { s.burn = Math.max(s.burn || 0, st.burn); s.burnDps = Math.max(s.burnDps || 0, (dmg || 10) * 0.12); }
    if (st.poison) { s.poison = Math.max(s.poison || 0, st.poison); s.poisonDps = Math.max(s.poisonDps || 0, (dmg || 10) * 0.1); }
    if (st.curse) { s.curse = 3; s.curseDps = (s.curseDps || 0) * 0.7 + (dmg || 10) * 0.06; }
    if (st.slow) s.slow = Math.max(s.slow || 0, st.slow);
    if (st.stun) s.stun = Math.max(s.stun || 0, st.stun);
  }
  R.applyStatus = applyStatus;

  function tickStatus(e, dt, isPlayer) {
    const s = e.status;
    for (const k of ['burn', 'poison', 'curse']) {
      if (s[k] > 0) {
        s[k] -= dt;
        s[k + 'Acc'] = (s[k + 'Acc'] || 0) + s[k + 'Dps'] * dt;
        s[k + 'Tick'] = (s[k + 'Tick'] || 0) + dt;
        if (s[k + 'Tick'] >= 0.5) {
          s[k + 'Tick'] = 0;
          const d = Math.max(1, Math.round(s[k + 'Acc']));
          s[k + 'Acc'] = 0;
          if (isPlayer) { G.player.hp -= d; R.addNum(e.x, e.y - 20, String(d), k === 'burn' ? '#ff9a3a' : '#9ad84a', 1); if (G.player.hp <= 0) killPlayer(); }
          else if (!e.dead) { e.hp -= d; R.addNum(e.x, e.y - e.hh - 2, String(d), k === 'burn' ? '#ff9a3a' : k === 'poison' ? '#9ad84a' : '#c890ff', 1); if (e.hp <= 0) killMob(e); }
        }
        if (s[k] <= 0) { s[k + 'Dps'] = 0; }
      }
    }
    if (s.slow > 0) s.slow -= dt;
    if (s.stun > 0) s.stun -= dt;
  }

  // ─── 플레이어 피격 ────────────────────────────────────
  function hurtPlayer(raw, elem, o = {}) {
    const p = G.player;
    if (p.dead) return false;
    if (p.iframes > 0 && !o.raw) {
      if (p.state === 'dodge' && !p.perfectShown) { R.addNum(p.x, p.y - 24, 'x', '#7fffd0', 1); }
      return false;
    }
    const adv = p.st.adv;
    let dmg = o.raw ? raw : raw * (100 / (100 + p.st.def)) * rand(0.9, 1.1);
    dmg *= 1 + (adv.dmgTaken || 0);
    if (p.guardT > 0) dmg *= 0.4;
    dmg *= Math.max(0.2, 1 + R.pbuf(p, 'dmgTaken'));
    if (p.st.legend && p.st.legend.laststand && p.hp < p.st.maxHp * 0.3) dmg *= 0.7;
    if (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'fragile') dmg *= 1.3;
    dmg = Math.max(1, Math.round(dmg));
    p.hp -= dmg;
    p.calmT = 0;
    p.flash = 0.15;
    if (!o.raw) p.iframes = 0.35;
    G.shake = Math.max(G.shake, 3);
    R.addNum(p.x, p.y - 24, String(dmg), '#ff4a4a', 1);
    R.sfx('hurt');
    if (o.status) applyStatus(p, o.status, dmg * 0.5);
    void o.knock; // 칸 이동: 피격 넉백 없음
    if (p.hp <= 0) killPlayer();
    return true;
  }
  R.hurtPlayer = hurtPlayer;

  function killPlayer() {
    const p = G.player;
    if (p.dead) return;
    p.hp = 0; p.dead = true; p.deadT = 0; p.state = 'dead'; R.Ach.add('deaths');
    G.combo.count = 0;
    R.sfx('die');
    setTimeout(() => R.UI.death(), 1100);
  }

  // ─── 몬스터 ──────────────────────────────────────────
  const ARCH_H = { human: 21, mimic: 15, blob: 12, mushroom: 16, quad: 13, spider: 11, ghost: 15, flyer: 13, golem: 23, worm: 13 };
  R.spawnMob = function (id, lv, x, y, o = {}) {
    const def = o.boss ? R.BOSSES[id] : R.MONSTERS[id];
    const D = !o.summoned && G.dungeon && G.dungeon.diff;
    if (D) lv += D.lv;
    const st = R.monsterStats(def, lv);
    if (o.boss) st.maxHp = Math.round(st.maxHp * R.BOSS_HP_MUL);
    if (D) { st.maxHp = Math.round(st.maxHp * D.hp); st.atk = Math.round(st.atk * D.atk); st.exp = Math.round(st.exp * D.exp); }
    const sk = def.sprite || id, ss = def.spriteScale || 1;
    const scale = o.boss ? Math.round(def.scale || 2) : o.elite ? 1 : 1;
    const m = {
      id, def, lv, x, y, homeX: x, homeY: y, r: (def.r || 6) * (o.elite ? 1.2 : 1),
      sk, ss,
      hh: R.SHEET && R.SHEET.frames[sk] ? Math.round(R.SHEET.frames[sk].h / R.SCALE * ss * (o.elite ? 1.2 : 1)) : (ARCH_H[def.arch] || 14) * scale,
      maxHp: st.maxHp * (o.elite ? 2.5 : 1), atk: st.atk * (o.elite ? 1.3 : 1), armor: st.def, exp: st.exp * (o.elite ? 3 : 1), gold: st.gold * (o.elite ? 3 : 1),
      elem: def.elem, spd: def.spd, ai: 'PATROL', aiT: 0, act: null, atkCd: rand(0.5, 1.5), flash: 0, stunT: 0, downT: 0,
      kx: 0, ky: 0, z: 0, vz: 0, dead: false, deathT: 0, status: {}, face: 1, anim: rand(0, 3), wanderX: x, wanderY: y,
      elite: !!o.elite, boss: !!o.boss, scale, spawn: o.spawn || null, summoned: !!o.summoned,
    };
    m.hp = m.maxHp;
    if (!o.boss && G.map) {
      Gd.place(m, Gd.tx(x), Gd.ty(y));
      if (Gd.blocked(m.gx, m.gy, m)) { Gd.snap(m); Gd.update(m, 1); }
      m.homeX = m.x; m.homeY = m.y; m.hgx = m.gx; m.hgy = m.gy;
    }
    if (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'haste') m.spd *= 1.3;
    if (o.boss) { m.phase = 0; m.moveCd = 1.5; m.aggro = false; m.ai = 'SLEEP'; }
    G.mobs.push(m);
    return m;
  };



  // ─── 몬스터 칸 이동 ─────────────────────────────────
  function mobStep(m, dir, mul = 1) {
    const slow = m.status.slow > 0 ? 0.5 : 1;
    const ok = Gd.tryStep(m, dir, TS / Math.max(8, m.spd * slow * mul));
    if (ok) {
      m.dir = dir;
      if (dir === 'left' || dir === 'right') m.face = dir === 'right' ? 1 : -1;
      m.movedAt = G.time;
      Gd.update(m, 0);
    }
    return ok;
  }
  // 목표 칸 쪽으로 한 칸 (막히면 다른 축, 그래도 막히면 가끔 옆걸음)
  function stepToward(m, gx, gy, mul, away) {
    let dx = gx - m.gx, dy = gy - m.gy;
    if (away) { dx = -dx; dy = -dy; }
    const h = dx ? (dx > 0 ? 'right' : 'left') : null, v = dy ? (dy > 0 ? 'down' : 'up') : null;
    const first = Math.abs(dx) >= Math.abs(dy) ? [h, v] : [v, h];
    for (const d of first) if (d && mobStep(m, d, mul)) return true;
    if (Math.random() < 0.3) {
      const side = (first[0] === 'left' || first[0] === 'right') ? ['up', 'down'] : ['left', 'right'];
      return mobStep(m, side[(Math.random() * 2) | 0], mul);
    }
    return false;
  }
  const faceTo = (m, dir) => { m.dir = dir; if (dir === 'left' || dir === 'right') m.face = dir === 'right' ? 1 : -1; };

  R.updateMobs = function (dt) {
    const p = G.player;
    for (const m of G.mobs) {
      if (m.dead) { m.deathT += dt; continue; }
      m.anim += dt;
      m.flash = Math.max(0, m.flash - dt);
      if (m.fleeT != null) m.fleeT += dt;   // 황금 고블린 도주 시간 (칸 이동 중에도 흐른다)
      tickStatus(m, dt, false);
      if (m.dead) continue;
      // 띄움
      if (m.z > 0 || m.vz) { m.vz -= 300 * dt; m.z = Math.max(0, m.z + m.vz * dt); if (m.z === 0) m.vz = 0; }
      if (m.boss) {
        if (m.downT > 0) { m.downT -= dt; continue; }
        if (m.stunT > 0 || m.status.stun > 0) { m.stunT -= dt; continue; }
        R.updateBoss(m, dt); continue;
      }
      // 칸 이동 보간 (넉백 포함)
      if (m.step) { if (!Gd.update(m, dt)) { if (m.act) runMobAct(m, dt); continue; } }
      else if (!m.act && (Math.abs(m.x - Gd.cx(m.gx)) > 0.5 || Math.abs(m.y - Gd.cy(m.gy)) > 0.5)) { Gd.snap(m); continue; }
      if (m.downT > 0) { m.downT -= dt; if (m.downT <= 0) m.ai = 'CHASE'; continue; }
      if (m.stunT > 0 || m.status.stun > 0) { m.stunT -= dt; continue; }
      m.atkCd -= dt;
      if (m.act) { runMobAct(m, dt); continue; }
      const dist = Math.hypot(p.x - m.x, p.y - m.y);
      const adx = Math.abs(p.gx - m.gx), ady = Math.abs(p.gy - m.gy), man = adx + ady;
      const aligned = adx === 0 || ady === 0;
      const toP = Gd.dirOf(p.gx - m.gx, p.gy - m.gy);
      if (m.def.ai === 'flee') { fleeAI(m, dt, p, dist, man); continue; }
      switch (m.ai) {
        case 'PATROL': {
          m.aiT -= dt;
          if (m.aiT <= 0) {
            m.aiT = rand(1.2, 3.2);
            const far = Math.abs(m.gx - m.hgx) + Math.abs(m.gy - m.hgy) > 2;
            if (far) stepToward(m, m.hgx, m.hgy, 0.5);
            else if (Math.random() < 0.7) mobStep(m, ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0], 0.5);
          }
          if (!p.dead && (dist < (m.elite ? 100 : 80) || m.aggro) && G.map.lineClear(m.x, m.y - 4, p.x, p.y - 4)) { m.ai = 'CHASE'; R.addNum(m.x, m.y - m.hh - 6, '!', '#ff5a5a', 1); }
          break;
        }
        case 'RETURN': {
          if (m.gx === m.hgx && m.gy === m.hgy) { m.ai = 'PATROL'; m.aggro = false; break; }
          if (!stepToward(m, m.hgx, m.hgy, 1.2) && Math.random() < 0.02) { m.hgx = m.gx; m.hgy = m.gy; }
          m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.3 * dt);
          break;
        }
        case 'CHASE': {
          if (p.dead || Math.hypot(m.x - m.homeX, m.y - m.homeY) > 230) { m.ai = 'RETURN'; break; }
          const t = m.def.ai;
          if (t === 'ranged') {
            // 같은 행·열에 서서 쏜다. 붙으면 물러나고, 어긋나 있으면 줄을 맞춘다
            if (aligned && man >= 2 && man <= 7 && Gd.lineClear(m.gx, m.gy, p.gx, p.gy)) {
              faceTo(m, toP);
              if (m.atkCd <= 0) m.act = { type: 'shoot', t: 0, dur: 0.55, ang: Gd.ANG[toP] };
            } else if (man <= 1) stepToward(m, p.gx, p.gy, 1, true);
            else if (!aligned) {
              const alignX = adx <= ady; // 차이가 작은 축을 0으로
              const d = alignX ? (p.gx > m.gx ? 'right' : 'left') : (p.gy > m.gy ? 'down' : 'up');
              if (!mobStep(m, d)) stepToward(m, p.gx, p.gy, 1);
            } else if (man > 7) stepToward(m, p.gx, p.gy, 1);
          } else if (t === 'charger') {
            if (aligned && man >= 2 && man <= 4 && m.atkCd <= 0 && Gd.lineClear(m.gx, m.gy, p.gx, p.gy)) { faceTo(m, toP); m.act = { type: 'lunge', t: 0, dur: 0.5, dir: toP, ang: Gd.ANG[toP], hit: false, run: 0 }; }
            else if (man === 1 && m.atkCd <= 0) { faceTo(m, toP); m.act = { type: 'melee', t: 0, dur: 0.4, dir: toP, ang: Gd.ANG[toP], range: 18 }; }
            else if (man > 1) stepToward(m, p.gx, p.gy, 1);
          } else {
            const hover = t === 'hover';
            if (man === 1) {
              faceTo(m, toP);
              if (m.atkCd <= 0) m.act = { type: 'melee', t: 0, dur: hover ? 0.3 : 0.45, dir: toP, ang: Gd.ANG[toP], range: 18 };
            } else if (hover && Math.random() < 0.25) mobStep(m, ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0], 1.3);
            else stepToward(m, p.gx, p.gy, hover ? 1.3 : 1);
          }
          break;
        }
      }
    }
  };

  // 황금 고블린: 들키면 도망치고, 제한 시간이 지나면 사라진다
  function fleeAI(m, dt, p, dist, man) {
    if (m.ai !== 'CHASE') {
      m.aiT -= dt;
      if (m.aiT <= 0) { m.aiT = rand(0.6, 1.4); mobStep(m, ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0], 0.6); }
      if (!p.dead && (dist < 90 || m.aggro)) {
        m.ai = 'CHASE'; m.fleeT = 0;
        R.addNum(m.x, m.y - m.hh - 6, '!', '#ffd35a', 1.2);
        R.toast(`💰 황금 고블린이 도망친다! ${R.DUNGEON_EVENTS.goblinEscape}초 안에 잡아라`, '#ffd35a');
      }
      return;
    }
    if (m.fleeT > R.DUNGEON_EVENTS.goblinEscape) {
      m.dead = true; m.deathT = 0.2; m.escaped = true;
      R.fxSmoke(m.x, m.y - 6);
      R.toast('황금 고블린이 차원문으로 도망쳤다…', '#c9b98a');
      return;
    }
    if (man <= 8) { if (!stepToward(m, p.gx, p.gy, 1, true)) mobStep(m, ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0], 1); }
    else if (Math.random() < 0.02) mobStep(m, ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0], 0.8);
  }

  function runMobAct(m, dt) {
    const a = m.act, p = G.player;
    a.t += dt;
    const def = m.def;
    const onStatus = {};
    if (def.poison) onStatus.poison = 4;
    if (def.burn) onStatus.burn = 3;
    if (def.slow) onStatus.slow = 2;
    if (a.type === 'melee') {
      if (!a.done && a.t >= a.dur) {
        a.done = true;
        // 바라보는 방향 앞 칸에 플레이어가 있으면 적중
        const cx = Math.cos(a.ang), cy = Math.sin(a.ang), dx = p.x - m.x, dy = p.y - m.y;
        const along = dx * cx + dy * cy, lat = Math.abs(-dx * cy + dy * cx);
        if (along > 0 && along < TS + 8 && lat < 10) hurtPlayer(m.atk, m.elem, { status: onStatus, knock: a.ang });
        R.fx.push({ type: 'slash', x: m.x, y: m.y - m.hh / 2, ang: a.ang, arc: 1.0, r: a.range, life: 0.14, max: 0.14, dir: 1, color: '#ff8a8a' });
      }
      if (a.t >= a.dur + 0.3) { m.act = null; m.atkCd = rand(1.0, 1.8); }
    } else if (a.type === 'lunge') {
      // 예비동작 후 직선으로 최대 4칸 돌진 (벽이나 플레이어에 닿으면 멈춤)
      if (a.t >= 0.4 && a.t < 0.8 && !a.stop) {
        const v = 200 * dt;
        const ok = R.moveBody(G.map, m, Math.cos(a.ang) * v, Math.sin(a.ang) * v);
        a.run += v;
        if (!a.hit && Math.hypot(p.x - m.x, p.y - m.y) < 12) { a.hit = true; a.stop = true; hurtPlayer(m.atk * 1.15, m.elem, { status: onStatus, knock: a.ang }); }
        if (!ok || a.run > TS * 4) a.stop = true;
      } else if (a.t >= 0.8 || a.stop) { m.act = null; m.atkCd = rand(1.4, 2.4); Gd.snap(m); }
    } else if (a.type === 'shoot') {
      if (!a.done && a.t >= a.dur) {
        a.done = true;
        const aim = a.ang; // 행·열을 따라 직선으로
        const kind = def.shot || 'orb';
        const sp = kind === 'spore' ? 80 : kind === 'bomb' ? 95 : 130;
        const shot = { x: m.x, y: m.y - Math.min(10, m.hh / 2), ang: aim, speed: sp, kind, team: 'e', r: 4, life: 1.6, dmg: m.atk, elem: m.elem, status: onStatus };
        if (kind === 'spore') shot.status = { poison: 4 };
        if (kind === 'bomb') { shot.explodeE = 18; shot.status = { burn: 3 }; shot.life = 1.1; }
        if (kind === 'ice') shot.status = { slow: 2.5 };
        shoot(shot);
      }
      if (a.t >= a.dur + 0.25) { m.act = null; m.atkCd = rand(1.6, 2.6); }
    }
  }

  // ─── 보스 ────────────────────────────────────────────
  R.updateBoss = function (b, dt) {
    const p = G.player, def = b.def;
    const dx = p.x - b.x, dy = p.y - b.y, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    if (b.ai === 'SLEEP') {
      const br = G.map.bossRoom;
      const ptx = p.x / TS, pty = p.y / TS;
      if (!p.dead && ptx > br.x && ptx < br.x + br.w && pty > br.y && pty < br.y + br.h + 0.5) {
        b.ai = 'FIGHT';
        R.UI.bossIntro(b);
        R.sfx('roar');
        G.shake = 6;
      }
      return;
    }
    if (p.dead) return;
    // 페이즈 전환
    const ratio = b.hp / b.maxHp;
    while (b.phase + 1 < def.phases.length && ratio <= def.phases[b.phase + 1].at) {
      b.phase++;
      const ph = def.phases[b.phase];
      R.toast(`${def.name}의 기운이 변했다!`, '#ff6a6a');
      G.shake = 6; R.sfx('roar');
      b.act = null; b.moveCd = 1.0;
      if (ph.enrage) { b.enrage = true; R.toast('폭주! 공격 속도 +50%', '#ff3a3a'); }
      if (ph.summon) summonAdds(b);
    }
    // 차원 전환 (소환수 생존 중 무적)
    if (b.shield) {
      b.shieldT -= dt;
      const alive = G.mobs.some((m) => m.summoned && !m.dead);
      if (!alive || b.shieldT <= 0) { b.shield = false; R.toast('차원의 장막이 걷혔다!', '#e0a0ff'); }
    }
    const spdMul = b.enrage ? 1.5 : 1;
    const ph = def.phases[b.phase];
    if (b.act) { runBossAct(b, dt, spdMul); return; }
    b.moveCd -= dt * spdMul;
    // 추적
    if (dist > b.r + 18) {
      // 보스도 상하좌우로만 걷는다 (차이가 큰 축 먼저)
      const sp = b.spd * spdMul * dt;
      if (Math.abs(dx) > Math.abs(dy) + 4 || Math.abs(dy) < 3) { if (!R.moveBody(G.map, b, Math.sign(dx) * sp, 0)) R.moveBody(G.map, b, 0, Math.sign(dy || 1) * sp); }
      else if (!R.moveBody(G.map, b, 0, Math.sign(dy) * sp)) R.moveBody(G.map, b, Math.sign(dx || 1) * sp, 0);
      if (Math.abs(dx) > 2) b.face = dx >= 0 ? 1 : -1;
      b.movedAt = G.time;
    }
    if (b.moveCd <= 0) {
      let moves = ph.moves.slice();
      if (dist > 70) moves = moves.filter((mv) => mv !== 'slam');
      if (!moves.length) moves = ['charge'].filter((x) => ph.moves.includes(x));
      if (!moves.length) { b.moveCd = 0.3; return; }
      const mv = moves[(Math.random() * moves.length) | 0];
      startBossMove(b, mv, ang, spdMul);
    }
  };

  function startBossMove(b, mv, ang, spdMul) {
    const p = G.player;
    const wind = (t) => t / (b.enrage ? 1.35 : 1);
    switch (mv) {
      case 'slam': {
        const r = 34, cx = b.x + Math.cos(ang) * 18, cy = b.y + Math.sin(ang) * 12;
        b.act = { type: 'slam', t: 0, dur: wind(0.85) };
        tele({ x: cx, y: cy, r, t: b.act.dur, dmg: b.atk * 1.3, elem: b.elem, fx: 'slam' });
        break;
      }
      case 'charge':
        b.act = { type: 'charge', t: 0, dur: wind(0.75), ang: R.Grid.ANG[R.Grid.dirFromAng(ang)], hit: false, len: 150 };
        break;
      case 'quake': {
        b.act = { type: 'cast', t: 0, dur: wind(1.1) };
        const n = b.enrage ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const ox = i === 0 ? 0 : rand(-60, 60), oy = i === 0 ? 0 : rand(-45, 45);
          tele({ x: p.x + ox, y: p.y + oy, r: 20, t: b.act.dur, dmg: b.atk * 1.0, elem: b.elem, fx: b.elem === 'ICE' ? 'ice' : 'quake', status: b.elem === 'ICE' ? { slow: 2 } : null });
        }
        break;
      }
      case 'rocks': {
        b.act = { type: 'cast', t: 0, dur: wind(0.6) };
        const br = G.map.bossRoom;
        for (let i = 0; i < 8; i++) {
          const x = (br.x + 1 + Math.random() * (br.w - 2)) * TS, y = (br.y + 1 + Math.random() * (br.h - 2)) * TS;
          tele({ x, y, r: 16, t: 1.2 + i * 0.1, dmg: b.atk * 0.9, elem: 'NONE', fx: 'rock' });
        }
        tele({ x: p.x, y: p.y, r: 16, t: 1.2, dmg: b.atk * 0.9, elem: 'NONE', fx: 'rock' });
        break;
      }
      case 'wave':
        b.act = { type: 'volley', t: 0, dur: wind(0.6), ang, n: 5, spread: 0.28 };
        break;
      case 'ring':
        b.act = { type: 'ring', t: 0, dur: wind(0.7), rings: b.enrage ? 2 : 1, fired: 0 };
        break;
    }
    b.moveCd = (b.enrage ? 0.9 : 1.5) + Math.random() * 0.6;
  }

  function runBossAct(b, dt, spdMul) {
    const a = b.act, p = G.player;
    a.t += dt;
    if (a.type === 'slam' || a.type === 'cast') {
      if (a.t >= a.dur + 0.3) b.act = null;
    } else if (a.type === 'charge') {
      if (a.t < a.dur) { if (a.t < a.dur * 0.6) a.ang = Math.atan2(p.y - b.y, p.x - b.x); b.face = Math.cos(a.ang) >= 0 ? 1 : -1; }
      else if (a.t < a.dur + 0.5) {
        const ok = R.moveBody(G.map, b, Math.cos(a.ang) * 300 * dt, Math.sin(a.ang) * 300 * dt);
        if (Math.random() < 0.5) R.fx.push({ type: 'dust', x: b.x + rand(-8, 8), y: b.y, vx: rand(-20, 20), vy: rand(-30, -10), life: 0.4, max: 0.4, color: '#b8a888', size: 2 });
        if (!a.hit && Math.hypot(p.x - b.x, p.y - b.y) < b.r + p.r + 6) { a.hit = true; hurtPlayer(b.atk * 1.2, b.elem, { knock: a.ang }); }
        if (!ok) { G.shake = 4; a.t = a.dur + 0.5; R.sfx('slam'); }
      } else if (a.t > a.dur + 0.9) b.act = null;
    } else if (a.type === 'volley') {
      if (!a.done && a.t >= a.dur) {
        a.done = true;
        const aim = Math.atan2(p.y - b.y, p.x - b.x);
        for (let i = 0; i < a.n; i++) {
          const ang = aim + (i - (a.n - 1) / 2) * a.spread;
          shoot({ x: b.x, y: b.y - b.hh / 2, ang, speed: 125, kind: b.elem === 'ICE' ? 'ice' : 'wave', team: 'e', r: 5, life: 2, dmg: b.atk * 0.9, elem: b.elem, status: b.elem === 'ICE' ? { slow: 2 } : null });
        }
        R.sfx('skill');
      }
      if (a.t > a.dur + 0.4) b.act = null;
    } else if (a.type === 'ring') {
      const need = Math.min(a.rings, Math.floor((a.t - a.dur) / 0.45) + 1);
      while (a.t >= a.dur && a.fired < need) {
        const off = a.fired * 0.26;
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + off;
          shoot({ x: b.x, y: b.y - b.hh / 2, ang, speed: 95, kind: b.elem === 'ICE' ? 'ice' : 'orb', team: 'e', r: 4, life: 2.6, dmg: b.atk * 0.8, elem: b.elem, status: b.elem === 'ICE' ? { slow: 2 } : null });
        }
        a.fired++;
        R.sfx('skill');
      }
      if (a.t > a.dur + a.rings * 0.45 + 0.3) b.act = null;
    }
  }

  function summonAdds(b) {
    const ids = ['demon', 'hellhound', 'fallen_angel'];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const x = b.x + Math.cos(a) * 40, y = b.y + Math.sin(a) * 30;
      if (G.map.boxHits(x, y, 6)) continue;
      const m = R.spawnMob(ids[i], b.lv - 6, x, y, { summoned: true });
      m.ai = 'CHASE'; m.aggro = true;
      R.fxSmoke(x, y - 8);
    }
    b.shield = true; b.shieldT = 12;
    R.toast('공허의 왕이 차원 너머로 숨었다! 소환수를 처치하라', '#e0a0ff');
  }

  function tele(o) {
    o.total = o.t;
    G.teles.push(o);
  }
  R.tele = tele;

  R.updateTeles = function (dt) {
    const p = G.player;
    for (const t of G.teles) {
      t.t -= dt;
      if (t.t <= 0 && !t.done) {
        t.done = true;
        if (!p.dead && Math.hypot(p.x - t.x, (p.y - t.y) * 1.3) < t.r + p.r) hurtPlayer(t.dmg, t.elem, { status: t.status, knock: Math.atan2(p.y - t.y, p.x - t.x) });
        G.shake = Math.max(G.shake, t.fx === 'slam' ? 5 : 3);
        R.sfx(t.fx === 'ice' ? 'ice' : 'slam');
        const col = t.fx === 'ice' ? '#bfe6ff' : t.fx === 'rock' ? '#8a7a6a' : '#c8a878';
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2, s = rand(20, 70);
          R.fx.push({ type: 'dust', x: t.x, y: t.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 20, life: 0.5, max: 0.5, color: col, size: t.fx === 'rock' ? 3 : 2 });
        }
        R.fx.push({ type: 'ring', x: t.x, y: t.y, r0: t.r * 0.4, r1: t.r * 1.1, life: 0.25, max: 0.25, color: col, w: 2, flat: true });
      }
    }
    G.teles = G.teles.filter((t) => t.t > -0.05);
  };

  // ─── 처치 & 보상 ─────────────────────────────────────
  // 연속 처치 (4초 안에 다음 처치) → 경험치 보너스, 25킬마다 피버 타임
  function addStreak(p) {
    const K = G.streak || (G.streak = { n: 0, t: 0, best: 0 }), S = R.STREAK;
    K.n++; K.t = S.window; K.best = Math.max(K.best, K.n);
    R.Quest.onEvent('streak', K.n);
    R.Ach.max('maxStreak', K.n);
    if (K.n % S.fever === 0) {
      addBuff(p, '피버 타임', S.feverDur, S.feverMods, '#ffd35a');
      R.Ach.add('fevers');
      K.fever = S.feverDur;
      R.UI.banner(`🔥 FEVER TIME! ${K.n}연속 처치`, '#ffd35a', `${S.feverDur}초간 공격력 +30% · 이동 +20% · 스킬 MP 0`);
      R.sfx('levelup'); G.shake = Math.max(G.shake, 5);
    } else if (K.n === 10 || K.n === 50 || K.n % 100 === 0) R.addNum(p.x, p.y - 40, `${K.n} KILL!`, '#ffd35a', 1.6);
    return Math.min(S.expMax, (K.n - 1) * S.expPer);
  }
  R.updateStreak = (dt) => {
    const K = G.streak;
    if (!K) return;
    if (K.fever > 0) K.fever -= dt;
    else if (K.n && (K.t -= dt) <= 0) K.n = 0;   // 피버 중에는 끊기지 않는다
  };

  function killMob(m) {
    if (m.dead) return;
    m.dead = true; m.deathT = 0; m.act = null;
    const s = G.save, p = G.player;
    R.sfx(m.boss ? 'bossdie' : 'kill');
    for (let i = 0; i < (m.boss ? 40 : 10); i++) {
      const a = Math.random() * Math.PI * 2, sp = rand(20, m.boss ? 120 : 60);
      R.fx.push({ type: 'dust', x: m.x, y: m.y - m.hh / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5, max: 0.5, color: i % 2 ? m.def.pal?.[0] || '#ffffff' : '#ffffff', size: 2 });
    }
    if (m.summoned) return;
    R.Season.onKill(m);
    // 경험치 (레벨 차이 보정)
    const D = (G.dungeon && G.dungeon.diff) || R.DIFFICULTY[0];
    const petM = R.Prog.petMod();
    const streakBonus = addStreak(p);
    R.Ach.add('kills');
    if (m.boss) R.Ach.add('bosses');
    if (m.def.treasure) R.Ach.add('goblins');
    if (m.def.mimic) R.Ach.add('mimics');
    const exp = Math.round(m.exp * R.expMod(m.lv - s.level) * (1 + streakBonus + R.pbuf(p, 'exp')));
    R.gainExp(exp);
    if (exp > 0) R.log('✦ 경험치 +{n}', '#9ad8ff', 'exp', exp);
    // 골드
    const coins = m.boss ? 8 : m.elite ? 4 : 1 + (Math.random() < 0.5 ? 1 : 0);
    const gold = Math.round(m.gold * rand(0.8, 1.2) * (m.boss ? 6 : 1) * (1 + R.pbuf(p, 'gold')));
    for (let i = 0; i < coins; i++) dropAt(m.x, m.y, { kind: 'gold', v: Math.max(1, Math.round(gold / coins)) });
    // 장비
    const luck = p.st.luk * 0.004 + D.drop;
    const tier = G.dungeon && G.dungeon.region.hidden ? 5 : Math.max(0, R.REGIONS.findIndex((r) => r.boss === m.id));
    if (m.boss) {
      for (let i = 0; i < 3; i++) dropAt(m.x, m.y, { kind: 'item', item: randomDrop(m.lv, R.rollGrade(0.6 + luck, i === 0 ? 2 : 1), 0.5) });
      R.Prog.addCoins(10 + 5 * tier);
      dropAt(m.x, m.y, { kind: 'mat', id: 'stone', n: 2 + tier });
      if (m.lv >= 26) dropAt(m.x, m.y, { kind: 'mat', id: 'hstone', n: 1 });
    } else {
      const chance = m.elite ? 1 : 0.16 * (1 + (petM.dropPct || 0)) * (1 + D.drop * 0.5) * (1 + R.pbuf(p, 'drop'));
      if (Math.random() < chance) dropAt(m.x, m.y, { kind: 'item', item: randomDrop(m.lv, R.rollGrade(luck + (m.elite ? 0.5 : 0), m.elite ? 1 : 0), m.elite ? 0.25 : 0.03) });
      if (m.elite) R.Prog.addCoins(3);
      else if (Math.random() < 0.05) R.Prog.addCoins(1, true);
      if (Math.random() < 0.22) dropAt(m.x, m.y, { kind: 'mat', id: 'iron', n: 1 });
      if (m.lv >= 10 && Math.random() < 0.06) dropAt(m.x, m.y, { kind: 'mat', id: 'stone', n: 1 });
      if (m.lv >= 28 && Math.random() < 0.015) dropAt(m.x, m.y, { kind: 'mat', id: 'hstone', n: 1 });
      if (Math.random() < 0.08) dropAt(m.x, m.y, { kind: 'potion', id: Math.random() < 0.6 ? 'hpPotion' : 'mpPotion', n: 1 });
    }
    // 특별한 몬스터: 황금 고블린 · 미믹
    if (m.def.treasure || m.def.mimic) {
      const big = m.def.treasure;
      for (let i = 0; i < 12; i++) dropAt(m.x, m.y, { kind: 'gold', v: Math.round(m.gold * (big ? 2.5 : 1.2)) });
      for (let i = 0; i < 2; i++) dropAt(m.x, m.y, { kind: 'item', item: randomDrop(m.lv + 2, R.rollGrade(0.9 + luck, 2), 0.3) });
      dropAt(m.x, m.y, { kind: 'mat', id: m.lv >= 26 ? 'hstone' : 'stone', n: big ? 2 : 1 });
      R.Prog.addGems(big ? 15 : 8, big ? '황금 고블린 처치' : '미믹 처치');
      R.UI.banner(big ? '💰 대박! 황금 고블린을 잡았다' : '📦 미믹이 삼킨 보물을 토해냈다', '#ffd35a');
      G.shake = Math.max(G.shake, 4);
    }
    // 도감 & 퀘스트
    if (!s.codex[m.id]) R.Prog.addGems(m.boss ? 50 : 10, `도감 등록: ${m.def.name}`);
    s.codex[m.id] = (s.codex[m.id] || 0) + 1;
    R.Quest.onKill(m);
    if (m.boss) R.onBossKilled(m);
  }
  R.killMob = killMob;

  function randomDrop(lv, grade, setChance = 0.03) {
    const slot = R.SLOTS[(Math.random() * R.SLOTS.length) | 0];
    const ilvl = Math.max(1, lv + ((Math.random() * 3) | 0) - 1);
    return R.makeItem(slot, ilvl, grade, G.save.cls, setChance);
  }
  R.randomDrop = randomDrop;

  function dropAt(x, y, d) {
    const a = Math.random() * Math.PI * 2, s = rand(15, 45);
    G.drops.push(Object.assign({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, z: 0, vz: rand(60, 100), t: 0 }, d));
  }
  R.dropAt = dropAt;

  R.updateDrops = function (dt) {
    const p = G.player;
    for (const d of G.drops) {
      d.t += dt;
      if (d.vz || d.z > 0) { d.vz -= 280 * dt; d.z = Math.max(0, d.z + d.vz * dt); if (d.z === 0) { d.vz = d.vz < -40 ? -d.vz * 0.4 : 0; } }
      if (Math.abs(d.vx) + Math.abs(d.vy) > 0.5) {
        const o = { x: d.x, y: d.y, r: 2 };
        R.moveBody(G.map, o, d.vx * dt, d.vy * dt);
        d.x = o.x; d.y = o.y;
        d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt);
      }
      if (p.dead || d.t < 0.5) continue;
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      const mag = 42 * (R.Prog.petMod().pickMul || 1);
      if (dist < mag) { d.x += ((p.x - d.x) / dist) * 140 * dt; d.y += ((p.y - d.y) / dist) * 140 * dt; }
      if (dist < 9) { if (R.pickup(d)) d.gone = true; else d.t = -1.5; }
    }
    G.drops = G.drops.filter((d) => !d.gone);
  };

  R.pickup = function (d) {
    const s = G.save;
    if (d.kind === 'gold') { const v = Math.round(d.v * (1 + (R.Prog.petMod().goldPct || 0) + (G.player.st.legend && G.player.st.legend.fortune ? 0.3 : 0))); s.gold += v; R.log('💰 골드 +{n}', '#ffd35a', 'gold', v); R.sfx('coin'); return true; }
    if (d.kind === 'mat' || d.kind === 'potion') {
      s.bag[d.id] = (s.bag[d.id] || 0) + d.n;
      const info = R.Prog.itemInfo(d.id);
      R.log(`${info.icon} ${info.name} +{n}`, '#e8e8e8', 'mat:' + d.id, d.n);
      R.sfx('pickup');
      return true;
    }
    if (d.kind === 'item') {
      if (s.inv.length >= 40) { R.toast('가방이 가득 찼습니다', '#ff8a8a'); return false; }
      s.inv.push(d.item);
      const nm = `${d.item.name} 획득${d.item.set != null ? ` [${R.SETS[d.item.set].name} 세트]` : ''}`;
      R.log('🎒 ' + nm, R.GRADES[d.item.grade].color);
      if (d.item.grade >= 2) R.toast(nm, R.GRADES[d.item.grade].color);
      R.Prog.dexAdd(d.item);
      R.sfx(d.item.grade >= 2 ? 'rare' : 'pickup');
      return true;
    }
    return true;
  };

  R.gainExp = function (n) {
    const s = G.save, p = G.player;
    if (s.level >= R.MAX_LEVEL) return;
    s.exp += n;
    let up = false;
    while (s.level < R.MAX_LEVEL && s.exp >= R.expToNext(s.level)) {
      s.exp -= R.expToNext(s.level);
      s.level++;
      const g = R.CLASSES[s.cls].grow;
      for (const k in g) s.stats[k] += g[k];
      s.points += 3;
      s.sp = (s.sp || 0) + 1;
      if (s.level % 5 === 0) R.Prog.addGems(50, `Lv.${s.level} 달성`);
      const nsk = R.CLASSES[s.cls].skills.filter((id, i) => R.SKILL_UNLOCK[i] === s.level);
      for (const id of nsk) setTimeout(() => { R.toast(`${R.SKILLS[id].icon} 새 스킬 습득: ${R.SKILLS[id].name}`, '#ffe070'); R.ensureSlots(s); R.UI.setSkillButtons(); }, 900);
      up = true;
    }
    if (up) {
      R.refreshStats();
      p.hp = p.st.maxHp; p.mp = p.st.maxMp;
      R.UI.banner(`LEVEL UP!  Lv.${s.level}`, '#ffe070');
      R.fx.push({ type: 'ring', x: p.x, y: p.y - 8, r0: 4, r1: 40, life: 0.6, max: 0.6, color: '#ffe070', w: 3 });
      R.fx.push({ type: 'pillar', x: p.x, y: p.y + 2, w: 22, life: 1.1, max: 1.1, color: 'rgba(255,224,112,0.9)' });
      R.fx.push({ type: 'ring', x: p.x, y: p.y, r0: 30, r1: 6, life: 0.5, max: 0.5, color: '#ffffff', w: 2, flat: true });
      for (let i = 0; i < 20; i++) R.fx.push({ type: 'dust', x: p.x + rand(-8, 8), y: p.y, vx: rand(-10, 10), vy: rand(-80, -30), life: 0.9, max: 0.9, color: i % 2 ? '#ffe070' : '#ffffff', size: 2, nograv: true });
      R.sfx('levelup');
      if (s.level === 30 && !s.adv) R.toast('Lv.30 달성! 촌장에게 2차 전직을 문의하세요', '#ffb0ff');
      R.saveGame();
    }
  };

  R.usePotion = function (id) {
    const p = G.player, s = G.save;
    if (p.dead || p.potionCd > 0) return;
    if (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'nopotion') { R.toast('이 층에서는 물약을 쓸 수 없다', '#ff8a8a'); p.potionCd = 1; return; }
    const potM = 1 + (R.Prog.petMod().potPct || 0);
    if (!s.bag[id]) { R.toast(`${R.CONSUMABLES[id].name}이 없습니다`, '#ff8a8a'); p.potionCd = 0.5; return; }
    if (id === 'hpPotion' && p.hp >= p.st.maxHp) return;
    s.bag[id]--;
    p.potionCd = R.POTION.cd;
    if (id === 'hpPotion') { const v = Math.round((p.st.maxHp * R.POTION.hp + R.POTION.hpFlat) * potM); p.hp = Math.min(p.st.maxHp, p.hp + v); R.addNum(p.x, p.y - 24, '+' + v, '#6aff6a', 1); }
    if (id === 'mpPotion') { const v = Math.round((p.st.maxMp * R.POTION.mp + R.POTION.mpFlat) * potM); p.mp = Math.min(p.st.maxMp, p.mp + v); R.addNum(p.x, p.y - 24, '+' + v, '#6ab6ff', 1); }
    R.sfx('potion');
  };

  // ─── 투사체 ──────────────────────────────────────────
  function shoot(o) {
    o.vx = Math.cos(o.ang) * o.speed; o.vy = Math.sin(o.ang) * o.speed;
    o.hit = new Set(); o.age = 0;
    G.shots.push(o);
  }
  R.shoot = shoot;

  function explode(s) {
    const r = s.explode.r;
    const ca = s.opt.ca;
    for (const m of G.mobs) {
      if (m.dead || m.hidden || s.hit.has(m)) continue;
      if (Math.hypot(m.x - s.x, m.y - m.hh / 2 - s.y) < r + m.r) hitMob(m, Object.assign({}, s.opt, { rate: s.explode.rate, ca, down: true, stun: 0.6 }), s.x, s.y);
    }
    for (let a = 0; a < 6; a++) R.hitVine(s.x + Math.cos(a) * r * 0.6, s.y + Math.sin(a) * r * 0.6);
    R.fx.push({ type: 'ring', x: s.x, y: s.y, r0: 4, r1: r, life: 0.3, max: 0.3, color: s.kind === 'fireball' ? '#ff9a3a' : '#bfe6ff', w: 3 });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, sp = rand(20, 80);
      R.fx.push({ type: 'dust', x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, max: 0.4, color: i % 2 ? '#ffd040' : '#ff6a2a', size: 2, nograv: true });
    }
    G.shake = Math.max(G.shake, 3);
    R.sfx('boom');
  }

  R.updateShots = function (dt) {
    const p = G.player;
    for (const s of G.shots) {
      s.age += dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.age >= s.life) { s.dead = true; if (s.explode) explode(s); if (s.explodeE) explodeEnemy(s); continue; }
      if (G.map.solidAt(s.x, s.y + 6)) {
        s.dead = true;
        if (s.team === 'p') R.hitVine(s.x, s.y + 6);
        if (s.explode) explode(s);
        if (s.explodeE) explodeEnemy(s);
        R.fxHit(s.x, s.y, '#cccccc', false);
        continue;
      }
      if (s.team === 'p') {
        for (const m of G.mobs) {
          if (m.dead || m.hidden || s.hit.has(m)) continue;
          if (Math.hypot(m.x - s.x, m.y - m.hh / 2 - s.y) < m.r + s.r + 2) {
            s.hit.add(m);
            if (s.explode) { s.dead = true; explode(s); break; }
            hitMob(m, s.opt, s.x - s.vx * 0.05, s.y - s.vy * 0.05);
            if (!s.pierce) { s.dead = true; break; }
          }
        }
      } else if (!p.dead) {
        if (Math.hypot(p.x - s.x, p.y - 7 - s.y) < p.r + s.r + 1) {
          if (s.explodeE) { s.dead = true; explodeEnemy(s); continue; }
          if (hurtPlayer(s.dmg, s.elem, { status: s.status, knock: Math.atan2(s.vy, s.vx) })) s.dead = true;
        }
      }
      if (s.kind === 'fireball' || s.kind === 'thunder' || s.kind === 'bigbolt') {
        if (Math.random() < 0.7) R.fx.push({ type: 'dust', x: s.x, y: s.y, vx: rand(-10, 10), vy: rand(-10, 10), life: 0.25, max: 0.25, color: s.kind === 'thunder' ? '#ffe86a' : s.kind === 'fireball' ? '#ff8a3a' : s.color || '#bfe6ff', size: 2, nograv: true });
      }
    }
    G.shots = G.shots.filter((s) => !s.dead);
  };

  function explodeEnemy(s) {
    const p = G.player;
    tele({ x: s.x, y: s.y + 6, r: s.explodeE, t: 0.01, dmg: s.dmg, elem: s.elem, fx: 'quake', status: s.status });
    for (let i = 0; i < 8; i++) R.fx.push({ type: 'dust', x: s.x, y: s.y, vx: rand(-50, 50), vy: rand(-50, 20), life: 0.35, max: 0.35, color: '#ff8a3a', size: 2 });
  }

  // ─── 덩굴 / 스위치 / 상자 / 게이트 ───────────────────
  R.hitVine = function (x, y) {
    const m = G.map;
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    if (m.get(tx, ty) !== R.T.VINE) return;
    const k = m.idx(tx, ty);
    const hp = (m.vineHp.get(k) || 1) - 1;
    for (let i = 0; i < 5; i++) R.fx.push({ type: 'dust', x: tx * TS + 8, y: ty * TS + 8, vx: rand(-40, 40), vy: rand(-50, 0), life: 0.4, max: 0.4, color: '#4a9a3a', size: 2 });
    R.sfx('vine');
    if (hp <= 0) { m.vineHp.delete(k); m.set(tx, ty, R.T.FLOOR); if (![...m.vineHp.keys()].length) R.toast('덩굴 장벽이 걷혔다', '#8aff8a'); }
    else m.vineHp.set(k, hp);
  };

  R.onSwitch = function () {
    const d = G.dungeon;
    if (d.switchOn) return;
    d.switchOn = true;
    R.openGate();
    R.toast('철컥! 어딘가의 문이 열리는 소리가 들린다', '#ffe070');
    R.sfx('gate');
  };

  R.openGate = function () {
    const m = G.map, g = m.gate;
    if (!g) return;
    for (let i = 0; i < g.w; i++) m.set(g.x + i, g.y, R.T.FLOOR);
    G.dungeon.gateOpen = true;
    G.shake = 3;
  };

  // ─── 이펙트 헬퍼 ─────────────────────────────────────
  R.fx = G.fx;
  R.addNum = function (x, y, text, color, sc) {
    G.nums.push({ x: x + rand(-3, 3), y, text, color, sc: sc || 1, life: 0.8, vy: -38 });
  };
  R.fxHit = function (x, y, color, big) {
    for (let i = 0; i < (big ? 10 : 5); i++) {
      const a = Math.random() * Math.PI * 2, s = rand(30, big ? 110 : 70);
      G.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2, max: 0.2, color: i % 2 ? color : '#ffffff' });
    }
  };
  R.fxSmoke = function (x, y) {
    for (let i = 0; i < 10; i++) G.fx.push({ type: 'dust', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-20, 20), vy: rand(-30, 0), life: 0.5, max: 0.5, color: i % 2 ? '#3a2a4a' : '#6a5a7a', size: 3, nograv: true });
  };
  R.fxAfterimage = function (p) {
    const lp = p.lastPose;
    G.fx.push({ type: 'ghost', x: p.x, y: p.y, dir: p.dir, face: p.faceX || 1, anim: p.anim, life: 0.18, max: 0.18,
      pose: lp && { rot: lp.rot, center: lp.center, sx: lp.sx, sy: lp.sy, oy: lp.oy } });
  };
  R.updateFx = function (dt) {
    for (const f of G.fx) {
      f.life -= dt;
      if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.type === 'dust' && !f.nograv) f.vy += 120 * dt; }
    }
    for (let i = G.fx.length - 1; i >= 0; i--) if (G.fx[i].life <= 0) G.fx.splice(i, 1);
    for (const n of G.nums) { n.life -= dt; n.y += n.vy * dt; n.vy *= Math.pow(0.02, dt); }
    G.nums = G.nums.filter((n) => n.life > 0);
  };
})();
