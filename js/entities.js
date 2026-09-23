// 전투 엔진: 플레이어, 몬스터 AI, 보스 패턴, 투사체, 드랍, 스탯/데미지 공식
'use strict';
(function () {
  const G = (window.G = {
    state: 'title', map: null, player: null, mobs: [], shots: [], drops: [], fx: [], nums: [], teles: [],
    shake: 0, hitstop: 0, time: 0, dungeon: null, save: null, paused: false, cam: { x: 0, y: 0 },
    combo: { count: 0, t: 0 }, input: null,
  });
  const TS = R.TILE;
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
    if (s.buffs) for (const k in s.buffs) if (s.buffs[k] > (s.playTime || 0) && R.FOODS[k]) for (const mk in R.FOODS[k].mod) adv[mk] = (adv[mk] || 0) + R.FOODS[k].mod[mk];
    const st = Object.assign({}, s.stats);
    let wAtk = 0, aDef = 0, hp = 0, mp = 0, crit = 0, atkPct = 0, elemDmg = 0, moveSpd = 0, elem = 'NONE';
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
      }
    }
    for (const k of ['str', 'dex', 'int', 'vit', 'luk']) st[k] = Math.round(st[k]);
    const baseAtk = cls.atkStat === 'int' ? st.int * 2.2 : st[cls.atkStat] * 2.0;
    return Object.assign(st, {
      atk: Math.round((baseAtk + wAtk) * (1 + atkPct / 100 + (adv.atkPct || 0))),
      def: Math.round((st.vit * 1.5 + aDef) * (1 + (adv.defPct || 0))),
      crit: Math.min(0.9, 0.05 + st.luk * 0.0005 + crit / 100 + (cls.critBonus || 0) + (adv.crit || 0)),
      critDmg: 1.5 + (adv.critDmg || 0),
      maxHp: Math.round((100 + st.vit * 20 + s.level * 20 + hp) * (1 + (adv.hpPct || 0))),
      maxMp: Math.round(50 + st.int * 10 + s.level * 10 + mp),
      atkSpd: cls.atkSpeed * (1 + st.dex * 0.002),
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
  R.makeItem = function (slot, ilvl, grade, cls, setChance = 0) {
    const tier = clamp(Math.floor((ilvl - 1) / 10), 0, 4);
    const wtype = slot === 'weapon' ? R.CLASSES[cls].weapon : null;
    const gm = 1 + grade * 0.15;
    const it = { uid: ++uidSeq, slot, wtype, name: R.ITEM_NAMES[wtype || slot][tier], grade, ilvl, enh: 0, opts: [] };
    if (slot === 'weapon') it.atk = Math.round((10 + ilvl * 4) * gm * rand(0.93, 1.07));
    const df = { helmet: 0.5, armor: 1, gloves: 0.35, boots: 0.4 }[slot];
    if (df) it.def = Math.max(1, Math.round((3 + ilvl * 1.6) * df * gm * rand(0.93, 1.07)));
    const acc = !it.atk && !it.def;
    const n = Math.min(4, grade + (acc ? 1 : 0));
    const main = R.CLASSES[cls].atkStat;
    const pool = [main, main, 'vit', 'luk', 'str', 'dex', 'int', 'hp', 'mp', 'crit', 'atkPct', 'moveSpd'];
    if (slot === 'weapon') pool.push('elemDmg', 'atkPct', 'crit');
    const used = new Set();
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
      comboStep: 0, comboWindow: 0, hitDone: false, iframes: 0, dodgeCd: 0, skillCd: [0, 0], potionCd: 0,
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

  function autoAim(p, range) {
    const cx = p.x, cy = p.y - 6;
    let t = nearestMob(cx, cy, range, p.aim, 1.2);
    if (!t && !G.input.moving) t = nearestMob(cx, cy, range * 0.8, 0, null);
    if (t) p.aim = Math.atan2(t.y - t.hh / 2 - cy, t.x - cx);
    p.dir = dirFromAngle(p.aim);
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
    p.skillCd[0] = Math.max(0, p.skillCd[0] - dt);
    p.skillCd[1] = Math.max(0, p.skillCd[1] - dt);
    p.flash = Math.max(0, p.flash - dt);
    p.comboWindow -= dt;
    if (p.comboWindow <= 0 && p.state !== 'attack') p.comboStep = 0;
    if (G.combo.t > 0) { G.combo.t -= dt; if (G.combo.t <= 0) G.combo.count = 0; }
    // 자연 회복 (마을에선 빠르게)
    const regen = G.map.kind === 'town' ? 0.08 : 0.004;
    p.hp = Math.min(p.st.maxHp, p.hp + p.st.maxHp * (regen + (R.Prog.petMod().regenPct || 0)) * dt);
    // 음식 버프 만료 시 능력치 재계산
    const bt = G.save.buffs;
    if (bt) for (const k in bt) if (bt[k] && bt[k] <= G.save.playTime) { delete bt[k]; R.refreshStats(); R.toast(`${R.FOODS[k].name} 효과가 끝났다`, '#c8c0d8'); }
    p.mp = Math.min(p.st.maxMp, p.mp + p.st.maxMp * (G.map.kind === 'town' ? 0.08 : 0.015) * dt);
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

    const stunned = p.status.stun > 0;
    const speedMul = p.status.slow > 0 ? 0.55 : 1;
    const onIce = tile === R.T.ICE;

    if (p.state === 'dodge') {
      p.stateT += dt;
      const sp = 210 * (1 - p.stateT / 0.24);
      R.moveBody(G.map, p, Math.cos(p.dodgeAng) * sp * dt, Math.sin(p.dodgeAng) * sp * dt);
      if (Math.random() < 0.6) R.fxAfterimage(p);
      if (p.stateT >= 0.24) { p.state = 'idle'; if (onIce) { p.vx = Math.cos(p.dodgeAng) * 80; p.vy = Math.sin(p.dodgeAng) * 80; } }
      return;
    }
    if (p.state === 'attack') {
      p.stateT += dt;
      if (!p.hitDone && p.stateT >= p.hitAt) { p.hitDone = true; doBasicHit(p, cls); }
      // 공격 중 살짝 전진
      if (cls.melee && p.stateT < p.hitAt) R.moveBody(G.map, p, Math.cos(p.aim) * 30 * dt, Math.sin(p.aim) * 30 * dt);
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
      if (p.stateT >= p.act.dur) { p.state = 'idle'; p.act = null; }
      return;
    }
    if (stunned) return;

    // 이동
    const mv = inp.move;
    let tvx = mv.x * p.st.moveSpd * speedMul, tvy = mv.y * p.st.moveSpd * speedMul;
    if (onIce) {
      const k = 1 - Math.pow(0.12, dt);
      p.vx += (tvx - p.vx) * k * 0.35; p.vy += (tvy - p.vy) * k * 0.35;
    } else { p.vx = tvx; p.vy = tvy; }
    if (Math.abs(p.vx) + Math.abs(p.vy) > 2) {
      const okx = R.moveBody(G.map, p, p.vx * dt, 0);
      const oky = R.moveBody(G.map, p, 0, p.vy * dt);
      if (onIce) { if (!okx) p.vx *= -0.3; if (!oky) p.vy *= -0.3; }
      if (inp.moving) { p.aim = Math.atan2(mv.y, mv.x); p.dir = dirFromAngle(p.aim); }
      p.state = 'walk';
    } else p.state = 'idle';

    // 행동
    if (inp.dodgePressed && p.dodgeCd <= 0) return startDodge(p);
    if (inp.skillPressed[0]) castSkill(p, 0);
    else if (inp.skillPressed[1]) castSkill(p, 1);
    else if ((inp.atkPressed || inp.atkHeld) && !G.interact) startAttack(p, cls);
  };

  function startDodge(p) {
    p.state = 'dodge'; p.stateT = 0;
    p.dodgeAng = G.input.moving ? Math.atan2(G.input.move.y, G.input.move.x) : p.aim + Math.PI;
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
    const opt = { rate: step.rate, elem: p.st.elem, stun: step.stun, down: step.down, launch: step.launch, ca };
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

  function meleeArc(p, range, arc, opt) {
    const cx = p.x, cy = p.y - 6;
    let hit = 0;
    for (const m of G.mobs) {
      if (m.dead || m.hidden) continue;
      const dx = m.x - cx, dy = m.y - m.hh / 2 - cy;
      const d = Math.hypot(dx, dy);
      if (d > range + m.r) continue;
      if (d > m.r + 4 && angDiff(Math.atan2(dy, dx), p.aim) > arc) continue;
      if (hitMob(m, opt, cx, cy)) hit++;
    }
    // 덩굴
    for (let a = -arc; a <= arc; a += arc / 2) {
      const hx = cx + Math.cos(p.aim + a) * range * 0.8, hy = p.y + Math.sin(p.aim + a) * range * 0.8;
      R.hitVine(hx, hy);
    }
    return hit;
  }

  // ─── 스킬 ────────────────────────────────────────────
  function castSkill(p, i) {
    const cls = R.CLASSES[G.save.cls];
    const id = cls.skills[i], sk = R.SKILLS[id];
    if (p.skillCd[i] > 0) return;
    if (p.mp < sk.mp) { R.toast('MP가 부족합니다', '#6fb6ff'); p.skillCd[i] = 0.3; return; }
    const adv = p.st.adv;
    const md = R.Prog.skillMod(id); // 스킬 레벨 + 룬
    const aoe = (1 + (adv.aoePct || 0)) * md.aoe;
    const st = (base) => Object.assign({}, base || {}, md.status || {});
    autoAim(p, cls.melee ? 70 : 130);
    p.mp -= sk.mp;
    p.skillCd[i] = sk.cd * md.cdMul;
    p.state = 'skill'; p.stateT = 0;
    R.sfx(sk.elem === 'FIRE' ? 'fire' : sk.elem === 'ICE' ? 'ice' : sk.elem === 'THUNDER' ? 'thunder' : 'skill');
    const opt = { rate: sk.rate * md.dmg, elem: sk.elem, skill: true, ca: comboAction() };
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
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          const nx = t.x + Math.cos(a) * (t.r + 9), ny = t.y + Math.sin(a) * (t.r + 9);
          if (!G.map.boxHits(nx, ny, p.r)) { p.x = nx; p.y = ny; }
          else { p.x = t.x - Math.cos(a) * (t.r + 9); p.y = t.y - Math.sin(a) * (t.r + 9); if (G.map.boxHits(p.x, p.y, p.r)) { p.x -= Math.cos(a) * 4; } }
          p.aim = Math.atan2(t.y - p.y, t.x - p.x); p.dir = dirFromAngle(p.aim);
          hitMob(t, Object.assign(opt, { forceCrit: true, stun: 0.8 }), p.x, p.y);
          R.fx.push({ type: 'slash', x: p.x, y: p.y - 6, ang: p.aim, arc: 0.9, r: 22, life: 0.2, max: 0.2, dir: 1, color: '#c890ff' });
        } else {
          for (let k = 0; k < 10; k++) R.moveBody(G.map, p, Math.cos(p.aim) * 6, Math.sin(p.aim) * 6);
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
    }
    if (p.act) p.act.id = id;
  }

  // ─── 데미지 (GDD: (ATK*SkillRate)*ElementMod*[100/(100+DEF)]) ──
  function hitMob(m, opt, fx, fy) {
    if (m.dead) return false;
    const p = G.player, st = p.st, adv = st.adv;
    if (opt.ca) comboLand(opt.ca);
    const bonus = opt.ca ? opt.ca.bonus : 0;
    const em = R.elemMod(opt.elem, m.elem);
    let dmg = st.atk * opt.rate * em * (100 / (100 + m.armor)) * (1 + bonus) * rand(0.92, 1.08);
    if (opt.elem && opt.elem !== 'NONE') dmg *= (1 + st.elemDmg) * (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'resist' ? 0.5 : 1);
    if (opt.skill && adv.skillPct) dmg *= 1 + adv.skillPct;
    if (adv.berserk && p.hp < st.maxHp * 0.5) dmg *= 1 + adv.berserk;
    const crit = opt.forceCrit || Math.random() < st.crit;
    if (crit) dmg *= st.critDmg;
    dmg = Math.max(1, Math.round(dmg));
    if (m.shield) { dmg = 0; }
    m.hp -= dmg;
    m.flash = 0.12;
    m.aggro = true;
    if (m.ai === 'PATROL' || m.ai === 'RETURN') m.ai = 'CHASE';
    // 경직 / 다운 / 띄움 (보스는 무시)
    const a = Math.atan2(m.y - fy, m.x - fx);
    const kb = m.boss ? 0 : (opt.down ? 150 : 60) / (m.elite ? 2 : 1);
    m.kx = Math.cos(a) * kb; m.ky = Math.sin(a) * kb;
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
    if (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'fragile') dmg *= 1.3;
    dmg = Math.max(1, Math.round(dmg));
    p.hp -= dmg;
    p.flash = 0.15;
    if (!o.raw) p.iframes = 0.35;
    G.shake = Math.max(G.shake, 3);
    R.addNum(p.x, p.y - 24, String(dmg), '#ff4a4a', 1);
    R.sfx('hurt');
    if (o.status) applyStatus(p, o.status, dmg * 0.5);
    if (o.knock) { R.moveBody(G.map, p, Math.cos(o.knock) * 8, Math.sin(o.knock) * 8); }
    if (p.hp <= 0) killPlayer();
    return true;
  }
  R.hurtPlayer = hurtPlayer;

  function killPlayer() {
    const p = G.player;
    if (p.dead) return;
    p.hp = 0; p.dead = true; p.deadT = 0; p.state = 'dead';
    G.combo.count = 0;
    R.sfx('die');
    setTimeout(() => R.UI.death(), 1100);
  }

  // ─── 몬스터 ──────────────────────────────────────────
  const ARCH_H = { human: 21, blob: 12, mushroom: 16, quad: 13, spider: 11, ghost: 15, flyer: 13, golem: 23, worm: 13 };
  R.spawnMob = function (id, lv, x, y, o = {}) {
    const def = o.boss ? R.BOSSES[id] : R.MONSTERS[id];
    const D = !o.summoned && G.dungeon && G.dungeon.diff;
    if (D) lv += D.lv;
    const st = R.monsterStats(def, lv);
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
    if (G.dungeon && G.dungeon.mod && G.dungeon.mod.id === 'haste') m.spd *= 1.3;
    if (o.boss) { m.phase = 0; m.moveCd = 1.5; m.aggro = false; m.ai = 'SLEEP'; }
    G.mobs.push(m);
    return m;
  };

  function mobMove(m, dx, dy) {
    const slow = m.status.slow > 0 ? 0.5 : 1;
    const ok = R.moveBody(G.map, m, dx * slow, dy * slow);
    if (!ok) {
      // 벽에 막히면 옆으로 미끄러지기
      if (dx && !dy) R.moveBody(G.map, m, 0, (m.y > G.player.y ? -1 : 1) * Math.abs(dx) * slow);
      if (dy && !dx) R.moveBody(G.map, m, (m.x > G.player.x ? -1 : 1) * Math.abs(dy) * slow, 0);
    }
    if (Math.abs(dx) > 0.01) m.face = dx > 0 ? 1 : -1;
    m.movedAt = G.time;
    return ok;
  }

  R.updateMobs = function (dt) {
    const p = G.player;
    for (const m of G.mobs) {
      if (m.dead) { m.deathT += dt; continue; }
      m.anim += dt;
      m.flash = Math.max(0, m.flash - dt);
      tickStatus(m, dt, false);
      if (m.dead) continue;
      // 띄움
      if (m.z > 0 || m.vz) { m.vz -= 300 * dt; m.z = Math.max(0, m.z + m.vz * dt); if (m.z === 0) m.vz = 0; }
      // 넉백
      if (Math.abs(m.kx) + Math.abs(m.ky) > 1) {
        R.moveBody(G.map, m, m.kx * dt, m.ky * dt);
        m.kx *= Math.pow(0.002, dt); m.ky *= Math.pow(0.002, dt);
      }
      if (m.downT > 0) { m.downT -= dt; if (m.downT <= 0) m.ai = 'CHASE'; continue; }
      if (m.stunT > 0 || m.status.stun > 0) { m.stunT -= dt; continue; }
      if (m.boss) { R.updateBoss(m, dt); continue; }
      m.atkCd -= dt;
      const dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const sp = m.spd * dt;
      if (m.act) { runMobAct(m, dt, dist, ang); continue; }
      switch (m.ai) {
        case 'PATROL': {
          m.aiT -= dt;
          if (m.aiT <= 0) { m.aiT = rand(1.5, 3.5); m.wanderX = m.homeX + rand(-30, 30); m.wanderY = m.homeY + rand(-24, 24); }
          const wx = m.wanderX - m.x, wy = m.wanderY - m.y, wd = Math.hypot(wx, wy);
          if (wd > 3) mobMove(m, (wx / wd) * sp * 0.4, (wy / wd) * sp * 0.4);
          if (!p.dead && (dist < (m.elite ? 100 : 80) || m.aggro) && G.map.lineClear(m.x, m.y - 4, p.x, p.y - 4)) { m.ai = 'CHASE'; R.addNum(m.x, m.y - m.hh - 6, '!', '#ff5a5a', 1); }
          break;
        }
        case 'RETURN': {
          const hx = m.homeX - m.x, hy = m.homeY - m.y, hd = Math.hypot(hx, hy);
          if (hd < 6) { m.ai = 'PATROL'; m.aggro = false; }
          else mobMove(m, (hx / hd) * sp * 1.2, (hy / hd) * sp * 1.2);
          m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.3 * dt);
          break;
        }
        case 'CHASE': {
          if (p.dead || Math.hypot(m.x - m.homeX, m.y - m.homeY) > 230) { m.ai = 'RETURN'; break; }
          const t = m.def.ai;
          if (t === 'ranged') {
            if (dist < 50) mobMove(m, -Math.cos(ang) * sp, -Math.sin(ang) * sp);
            else if (dist > 95) mobMove(m, Math.cos(ang) * sp, Math.sin(ang) * sp);
            else mobMove(m, Math.cos(ang + Math.PI / 2) * sp * 0.4 * Math.sign(Math.sin(m.anim)), Math.sin(ang + Math.PI / 2) * sp * 0.4 * Math.sign(Math.sin(m.anim)));
            if (m.atkCd <= 0 && dist < 130 && G.map.lineClear(m.x, m.y - 6, p.x, p.y - 6)) m.act = { type: 'shoot', t: 0, dur: 0.55, ang };
          } else if (t === 'charger') {
            if (dist > 55 || m.atkCd > 0) mobMove(m, Math.cos(ang) * sp, Math.sin(ang) * sp);
            if (dist < 70 && m.atkCd <= 0) m.act = { type: 'lunge', t: 0, dur: 0.5, ang, hit: false };
          } else if (t === 'hover') {
            const w = Math.sin(m.anim * 4) * 0.9;
            mobMove(m, Math.cos(ang + w) * sp, Math.sin(ang + w) * sp);
            if (dist < m.r + 14 && m.atkCd <= 0) m.act = { type: 'melee', t: 0, dur: 0.3, ang, range: 16 };
          } else {
            if (dist > m.r + 10) mobMove(m, Math.cos(ang) * sp, Math.sin(ang) * sp);
            if (dist < m.r + 16 && m.atkCd <= 0) m.act = { type: 'melee', t: 0, dur: 0.45, ang, range: 18 + m.r * 0.5 };
          }
          break;
        }
      }
    }
    // 몬스터끼리 밀어내기
    for (let i = 0; i < G.mobs.length; i++) {
      const a = G.mobs[i];
      if (a.dead) continue;
      for (let j = i + 1; j < G.mobs.length; j++) {
        const b = G.mobs[j];
        if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), md = a.r + b.r;
        if (d < md && d > 0.01) {
          const push = (md - d) * 0.5;
          if (!a.boss) R.moveBody(G.map, a, (-dx / d) * push, (-dy / d) * push);
          if (!b.boss) R.moveBody(G.map, b, (dx / d) * push, (dy / d) * push);
        }
      }
      // 플레이어와 겹침 방지
      if (!G.player.dead && G.player.state !== 'dodge') {
        const dx = G.player.x - a.x, dy = G.player.y - a.y, d = Math.hypot(dx, dy), md = a.r + G.player.r;
        if (d < md && d > 0.01) R.moveBody(G.map, G.player, (dx / d) * (md - d) * 0.6, (dy / d) * (md - d) * 0.6);
      }
    }
  };

  function runMobAct(m, dt, dist, ang) {
    const a = m.act, p = G.player;
    a.t += dt;
    const def = m.def;
    const onStatus = {};
    if (def.poison) onStatus.poison = 4;
    if (def.burn) onStatus.burn = 3;
    if (def.slow) onStatus.slow = 2;
    if (a.type === 'melee') {
      m.face = Math.cos(a.ang) >= 0 ? 1 : -1;
      if (!a.done && a.t >= a.dur) {
        a.done = true;
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (d < a.range + p.r + m.r * 0.5 && angDiff(Math.atan2(p.y - m.y, p.x - m.x), a.ang) < 1.2) hurtPlayer(m.atk, m.elem, { status: onStatus, knock: a.ang });
        R.fx.push({ type: 'slash', x: m.x, y: m.y - m.hh / 2, ang: a.ang, arc: 1.0, r: a.range, life: 0.14, max: 0.14, dir: 1, color: '#ff8a8a' });
      }
      if (a.t >= a.dur + 0.3) { m.act = null; m.atkCd = rand(1.0, 1.8); }
    } else if (a.type === 'lunge') {
      if (a.t < 0.4) { m.face = Math.cos(a.ang) >= 0 ? 1 : -1; if (a.t < 0.3) a.ang = Math.atan2(p.y - m.y, p.x - m.x); }
      else if (a.t < 0.72) {
        mobMove(m, Math.cos(a.ang) * 190 * dt, Math.sin(a.ang) * 190 * dt);
        if (!a.hit && Math.hypot(p.x - m.x, p.y - m.y) < m.r + p.r + 4) { a.hit = true; hurtPlayer(m.atk * 1.15, m.elem, { status: onStatus, knock: a.ang }); }
      } else { m.act = null; m.atkCd = rand(1.4, 2.4); }
    } else if (a.type === 'shoot') {
      if (!a.done && a.t >= a.dur) {
        a.done = true;
        const aim = Math.atan2(p.y - m.y, p.x - m.x);
        const kind = def.shot || 'orb';
        const sp = kind === 'spore' ? 80 : kind === 'bomb' ? 95 : 130;
        const shot = { x: m.x, y: m.y - m.hh / 2, ang: aim, speed: sp, kind, team: 'e', r: 4, life: 1.6, dmg: m.atk, elem: m.elem, status: onStatus };
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
      const sp = b.spd * spdMul * dt;
      R.moveBody(G.map, b, Math.cos(ang) * sp, Math.sin(ang) * sp);
      b.face = dx >= 0 ? 1 : -1;
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
        b.act = { type: 'charge', t: 0, dur: wind(0.75), ang, hit: false, len: 150 };
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
    // 경험치 (레벨 차이 보정)
    const D = (G.dungeon && G.dungeon.diff) || R.DIFFICULTY[0];
    const petM = R.Prog.petMod();
    const exp = Math.round(m.exp * R.expMod(m.lv - s.level));
    R.gainExp(exp);
    // 골드
    const coins = m.boss ? 8 : m.elite ? 4 : 1 + (Math.random() < 0.5 ? 1 : 0);
    const gold = Math.round(m.gold * rand(0.8, 1.2) * (m.boss ? 6 : 1));
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
      const chance = m.elite ? 1 : 0.16 * (1 + (petM.dropPct || 0)) * (1 + D.drop * 0.5);
      if (Math.random() < chance) dropAt(m.x, m.y, { kind: 'item', item: randomDrop(m.lv, R.rollGrade(luck + (m.elite ? 0.5 : 0), m.elite ? 1 : 0), m.elite ? 0.25 : 0.03) });
      if (m.elite) R.Prog.addCoins(3);
      else if (Math.random() < 0.05) R.Prog.addCoins(1, true);
      if (Math.random() < 0.22) dropAt(m.x, m.y, { kind: 'mat', id: 'iron', n: 1 });
      if (m.lv >= 10 && Math.random() < 0.06) dropAt(m.x, m.y, { kind: 'mat', id: 'stone', n: 1 });
      if (m.lv >= 28 && Math.random() < 0.015) dropAt(m.x, m.y, { kind: 'mat', id: 'hstone', n: 1 });
      if (Math.random() < 0.08) dropAt(m.x, m.y, { kind: 'potion', id: Math.random() < 0.6 ? 'hpPotion' : 'mpPotion', n: 1 });
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
    if (d.kind === 'gold') { s.gold += Math.round(d.v * (1 + (R.Prog.petMod().goldPct || 0))); R.sfx('coin'); return true; }
    if (d.kind === 'mat' || d.kind === 'potion') {
      s.bag[d.id] = (s.bag[d.id] || 0) + d.n;
      const info = R.Prog.itemInfo(d.id);
      R.toast(`${info.icon} ${info.name} x${d.n}`, '#e8e8e8');
      R.sfx('pickup');
      return true;
    }
    if (d.kind === 'item') {
      if (s.inv.length >= 40) { R.toast('가방이 가득 찼습니다', '#ff8a8a'); return false; }
      s.inv.push(d.item);
      R.toast(`${d.item.name} 획득${d.item.set != null ? ` [${R.SETS[d.item.set].name} 세트]` : ''}`, R.GRADES[d.item.grade].color);
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
      up = true;
    }
    if (up) {
      R.refreshStats();
      p.hp = p.st.maxHp; p.mp = p.st.maxMp;
      R.UI.banner(`LEVEL UP!  Lv.${s.level}`, '#ffe070');
      R.fx.push({ type: 'ring', x: p.x, y: p.y - 8, r0: 4, r1: 40, life: 0.6, max: 0.6, color: '#ffe070', w: 3 });
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
    p.potionCd = 1;
    if (id === 'hpPotion') { const v = Math.round(p.st.maxHp * 0.35 * potM); p.hp = Math.min(p.st.maxHp, p.hp + v); R.addNum(p.x, p.y - 24, '+' + v, '#6aff6a', 1); }
    if (id === 'mpPotion') { const v = Math.round(p.st.maxMp * 0.4 * potM); p.mp = Math.min(p.st.maxMp, p.mp + v); R.addNum(p.x, p.y - 24, '+' + v, '#6ab6ff', 1); }
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
      pose: lp && { rot: lp.rot, center: lp.center, sx: lp.sx, sy: lp.sy, oy: lp.oy, torso: { rot: lp.torso.rot } } });
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
