// 애니메이션 리그: 디자인 시트의 한 장짜리 스프라이트를 부위별로 잘라 움직인다.
//  - 인간형/골렘: 상체(허리 위)와 좌우 다리를 나눠 걸음걸이·허리 비틀기
//  - 4족: 앞다리/뒷다리를 나눠 질주
//  - 비행: 좌우 날개를 몸통 기준으로 회전해 날갯짓
//  - 유령/벌레: 가로·세로 띠로 잘라 물결처럼 흔들기
// 포즈 값은 "스프라이트 로컬 공간"에서 계산한다. fwd(+1)는 스프라이트가 바라보는 쪽.
'use strict';
(function () {
  const S = R.SCALE, SPR = R.SPR, TAU = Math.PI * 2;
  const A = (R.Anim = {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeOut = (k) => 1 - (1 - k) * (1 - k);
  const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  // 타격 후 튕기며 제자리로 (1 → 0, 살짝 반대로 넘어갔다 복귀)
  const spring = (s) => Math.exp(-5.5 * s) * Math.cos(7.5 * s);
  const snap = (v) => Math.round(v * S) / S;

  // 아키타입별 리그 설정. hip: 위에서부터 허리선 비율, split: 좌우 다리 나누는 x 비율
  const RIG = {
    human: { hip: 0.64, split: 0.5 },
    golem: { hip: 0.7, split: 0.5, heavy: true },
    quad: { hip: 0.58, split: 0.5, quad: true },
    flyer: { wings: true },
    ghost: { wave: 'x' },
    worm: { wave: 'y' },
    blob: { jelly: true },
    mushroom: { hip: 0.58, split: 0.5 },
    spider: { jelly: true },
  };
  const rigOf = (def, key) => (key === 'void_king' ? RIG.ghost : RIG[def.arch] || RIG.human);

  function newPose() {
    return { ox: 0, oy: 0, rot: 0, sx: 1, sy: 1, center: false, lying: 0,
      torso: { ox: 0, oy: 0, rot: 0, sx: 1, sy: 1 }, legs: [{ ox: 0, oy: 0 }, { ox: 0, oy: 0 }], wing: 0, wave: 0, waveAmp: 0 };
  }

  // ─── 걸음 추적: 이동 거리로 보폭 위상을 진행시킨다 (미끄러지는 발 방지) ───
  function track(e, dt, stride) {
    if (e._ax === undefined) { e._ax = e.x; e._ay = e.y; e.gait = 0; e.walkBlend = 0; e.vxs = 0; e.vys = 0; }
    const dx = e.x - e._ax, dy = e.y - e._ay;
    e._ax = e.x; e._ay = e.y;
    const d = Math.hypot(dx, dy);
    const teleport = d > 30;
    const moving = !teleport && d > 0.05;
    if (moving) {
      e.gait += (d / stride) * Math.PI;
      e.vxs += (dx / Math.max(dt, 1e-3) - e.vxs) * 0.3; e.vys += (dy / Math.max(dt, 1e-3) - e.vys) * 0.3;
    }
    const target = moving ? 1 : 0;
    e.walkBlend += (target - e.walkBlend) * (1 - Math.exp(-(moving ? 14 : 8) * dt));
    // 멈추면 다리를 모으는 위치(위상 0 또는 π)로 부드럽게
    if (!moving && e.walkBlend < 0.5) { const tgt = Math.round(e.gait / Math.PI) * Math.PI; e.gait += (tgt - e.gait) * (1 - Math.exp(-10 * dt)); }
    return e.walkBlend;
  }

  // 인간형 걸음걸이
  function humanWalk(P, e, b, heavy) {
    const g = e.gait;
    const horiz = clamp(Math.abs(e.vxs) / (Math.hypot(e.vxs, e.vys) || 1), 0, 1);
    const stepX = (heavy ? 1.3 : 1.9) * (0.35 + 0.65 * horiz) * b;
    const lift = (heavy ? 1.6 : 1.5) * b;
    for (let i = 0; i < 2; i++) {
      const ph = g + i * Math.PI;
      P.legs[i].ox += Math.sin(ph) * stepX;
      P.legs[i].oy -= Math.max(0, Math.cos(ph)) * lift;
    }
    // 두 다리가 교차하는 순간 몸이 가장 높고, 벌어졌을 때 낮다
    const spread = Math.abs(Math.sin(g));
    P.oy -= (1 - spread) * (heavy ? 0.9 : 1.3) * b;
    P.torso.rot += (0.07 + Math.sin(g) * 0.035) * b;        // 앞으로 숙이며 좌우로 흔들림
    P.torso.ox += Math.sin(g) * 0.35 * b;
    P.torso.sy *= 1 - spread * 0.035 * b;                    // 착지 시 살짝 눌림
    if (heavy) { P.rot += Math.sin(g) * 0.04 * b; P.sx *= 1 + spread * 0.04 * b; P.sy *= 1 - spread * 0.05 * b; }
  }

  function breathe(P, t, amp = 0.028, spd = 2.6) {
    const s = Math.sin(t * spd);
    P.torso.sy *= 1 + s * amp; P.torso.sx *= 1 - s * amp * 0.4; P.torso.oy -= Math.max(0, s) * 0.2;
  }

  // 근접 휘두르기: 예비동작 → 타격(스프링) — power로 강도, style로 궤적
  function swing(P, k, hk, power, style) {
    if (k < hk) {
      const e = easeOut(k / hk);
      if (style === 'up') { P.torso.rot += 0.3 * e * power; P.oy += 1 * e; P.torso.sy *= 1 - 0.06 * e; }       // 몸을 낮췄다가
      else { P.torso.rot -= 0.42 * e * power; P.torso.ox -= 1.6 * e * power; P.legs[1].ox -= 1 * e; P.torso.sy *= 1 + 0.05 * e; }
      if (style === 'heavy') { P.oy -= 3 * e; P.sy *= 1 + 0.06 * e; }
    } else {
      const s = (k - hk) / Math.max(0.01, 1 - hk);
      const sp = spring(s);
      if (style === 'up') { P.torso.rot -= 0.45 * sp * power; P.oy -= 3.2 * Math.max(0, sp); P.torso.sy *= 1 + 0.08 * Math.max(0, sp); }
      else { P.torso.rot += 0.5 * sp * power; P.torso.ox += 2.4 * Math.max(0, sp) * power; }
      P.ox += 2.6 * Math.pow(1 - s, 2) * power;                   // 앞으로 내딛음
      P.legs[0].ox += 2.2 * Math.pow(1 - s, 2);
      if (style === 'heavy' && s < 0.35) { const q = 1 - s / 0.35; P.sx *= 1 + 0.16 * q; P.sy *= 1 - 0.14 * q; }
    }
  }
  // 원거리 발사: 조준(당김) → 반동
  function shootPose(P, k, hk) {
    if (k < hk) { const e = easeOut(k / hk); P.torso.rot -= 0.12 * e; P.torso.ox -= 1.2 * e; P.torso.sy *= 1 + 0.03 * e; }
    else { const s = (k - hk) / Math.max(0.01, 1 - hk); P.torso.rot -= 0.18 * spring(s); P.ox -= 1.2 * Math.pow(1 - s, 2); }
  }
  function hurt(P, flash, max = 0.15) {
    const k = clamp(flash / max, 0, 1);
    P.torso.rot -= 0.3 * k; P.ox -= 1.8 * k; P.torso.sx *= 1 - 0.05 * k;
  }

  // ─── 그리기 ────────────────────────────────────────────
  // 소스 픽셀 영역(sx,sy,sw,sh; 프레임 기준 정수)을 로컬 좌표 (dx,dy)에 그린다
  function part(g, img, f, sx, sy, sw, sh, dx, dy) {
    if (sw <= 0 || sh <= 0) return;
    g.drawImage(img, f.x + sx, f.y + sy, sw, sh, dx, dy, sw / S, sh / S);
  }

  function drawRig(g, f, P, rig, x, y, o) {
    const img = o.flash ? SPR.sheet.white : SPR.sheet.img;
    const w = f.w / S, h = f.h / S;
    const flip = f.face === -1 ? o.face > 0 : o.face < 0;
    g.save();
    if (o.alpha != null && o.alpha < 1) g.globalAlpha = Math.max(0, o.alpha);
    g.translate(snap(x), snap(y));
    if (flip) g.scale(-1, 1);
    const fwd = f.face || 1; // 로컬 공간에서 앞쪽
    const pv = P.center ? h * 0.45 : 0;
    g.translate(P.ox * fwd, P.oy - pv);
    if (P.lying) g.rotate(-fwd * Math.PI / 2 * P.lying);
    if (P.rot) g.rotate(P.rot * fwd);
    g.scale(P.sx * (o.scale || 1), P.sy * (o.scale || 1));
    g.translate(0, pv);
    const x0 = -w / 2;

    if (rig.hip && !P.lying) {
      const hipPx = Math.round(f.h * rig.hip), legPx = f.h - hipPx;
      const legH = legPx / S;
      const splitPx = Math.round(f.w * rig.split);
      // 다리: 뒤쪽 다리 먼저 (로컬에서 fwd 반대편)
      const L = [{ sx: 0, sw: splitPx, leg: P.legs[fwd > 0 ? 1 : 0] }, { sx: splitPx, sw: f.w - splitPx, leg: P.legs[fwd > 0 ? 0 : 1] }];
      for (const p of L) part(g, img, f, p.sx, hipPx, p.sw, legPx, x0 + p.sx / S + p.leg.ox * fwd, -legH + p.leg.oy);
      // 상체: 허리를 축으로 회전 (1px 겹쳐 이음새 가림)
      const T = P.torso;
      g.save();
      g.translate(T.ox * fwd, -legH + T.oy + 0.5);
      if (T.rot) g.rotate(T.rot * fwd);
      g.scale(T.sx, T.sy);
      part(g, img, f, 0, 0, f.w, hipPx + 2, x0, -hipPx / S - 0.5);
      g.restore();
    } else if (rig.wings && !P.lying) {
      const a = Math.round(f.w * 0.36), b = Math.round(f.w * 0.64);
      const wy = Math.round(f.h * 0.45);
      const flap = P.wing;
      part(g, img, f, a, 0, b - a, f.h, x0 + a / S, -h);
      // 왼쪽 날개: 안쪽 끝을 축으로 회전
      g.save(); g.translate(x0 + a / S, -h + wy / S); g.rotate(-flap); g.scale(1, 1 - Math.abs(flap) * 0.25);
      part(g, img, f, 0, 0, a, f.h, -a / S, -wy / S); g.restore();
      g.save(); g.translate(x0 + b / S, -h + wy / S); g.rotate(flap); g.scale(1, 1 - Math.abs(flap) * 0.25);
      part(g, img, f, b, 0, f.w - b, f.h, 0, -wy / S); g.restore();
    } else if (rig.wave && !P.lying) {
      const n = rig.wave === 'x' ? 8 : 8;
      if (rig.wave === 'x') {
        // 가로 띠: 아래로 갈수록 크게 물결 (유령 꼬리)
        for (let i = 0; i < n; i++) {
          const sy = Math.floor((f.h * i) / n), ey = Math.floor((f.h * (i + 1)) / n);
          const k = i / (n - 1);
          const off = Math.sin(P.wave + k * 2.4) * P.waveAmp * k * k;
          part(g, img, f, 0, sy, f.w, ey - sy + 1, x0 + off, -h + sy / S);
        }
      } else {
        // 세로 띠: 몸통을 따라 굽이치기 (벌레)
        for (let i = 0; i < n; i++) {
          const sx = Math.floor((f.w * i) / n), ex = Math.floor((f.w * (i + 1)) / n);
          const k = i / (n - 1);
          const off = Math.sin(P.wave - k * 4) * P.waveAmp * (0.4 + 0.6 * (1 - Math.abs(k - 0.5) * 2));
          part(g, img, f, sx, 0, ex - sx + 1, f.h, x0 + sx / S, -h + off);
        }
      }
    } else {
      part(g, img, f, 0, 0, f.w, f.h, x0, -h);
    }
    g.restore();
  }

  // ─── 플레이어 ──────────────────────────────────────────
  A.playerKey = () => { const s = G.save; return s.adv && SPR.frame(s.adv) ? s.adv : s.cls; };

  A.player = function (g, p, dt) {
    const key = A.playerKey(), f = SPR.frame(key);
    if (!f) return false;
    const cls = R.CLASSES[G.save.cls];
    const b = track(p, dt, 7);
    const P = newPose();
    const t = p.anim;
    if (p.dead) { P.lying = 1; P.oy = -f.w / S * 0.25; }
    else if (p.state === 'dodge') {
      const k = clamp(p.stateT / 0.24, 0, 1);
      P.center = true; P.rot = easeInOut(k) * TAU; P.sx = P.sy = 0.86; P.oy = -Math.sin(k * Math.PI) * 4;
      P.legs[0].oy = P.legs[1].oy = -1.5;
    } else if (p.state === 'attack') {
      const k = clamp(p.stateT / p.dur, 0, 1), hk = p.hitAt / p.dur;
      if (cls.melee) swing(P, k, hk, p.comboStep === 2 ? 1.35 : 1, p.comboStep === 1 ? 'up' : p.comboStep === 2 ? 'heavy' : 'slash');
      else shootPose(P, k, hk);
      humanWalk(P, p, b * 0.3, false);
    } else if (p.state === 'skill' && p.act) {
      const k = clamp(p.stateT / p.act.dur, 0, 1), id = p.act.id;
      if (id === 'whirl') { P.center = true; P.rot = easeOut(k) * TAU * 1.0; P.sy = 0.94; P.legs[0].ox = -1.5; P.legs[1].ox = 1.5; }
      else if (id === 'charge') { P.torso.rot = 0.38; P.torso.ox = 1.5; P.legs[0].ox = 2.5; P.legs[1].ox = -2.5; P.legs[1].oy = -1; P.sx = 1.08; }
      else if (id === 'shadowstep') { const s = Math.sin(k * Math.PI); P.sx = 1 - s * 0.45; P.sy = 1 + s * 0.3; }
      else if (id === 'poisonblade') { const q = (k * 5) % 1; swing(P, q, 0.3, 0.8, q < 0.5 ? 'slash' : 'up'); }
      else if (id === 'multishot' || id === 'pierce') shootPose(P, k, 0.35);
      else { // 시전: 몸을 젖혀 모았다가 내뻗기
        if (k < 0.35) { const e = easeOut(k / 0.35); P.torso.rot -= 0.25 * e; P.torso.sy *= 1 + 0.08 * e; P.oy -= 1.5 * e; }
        else { const s = (k - 0.35) / 0.65; P.torso.rot += 0.3 * spring(s); P.ox += 1.5 * Math.pow(1 - s, 2); }
      }
    } else {
      humanWalk(P, p, b, false);
      breathe(P, t * (1 - b * 0.5), 0.028 * (1 - b));
    }
    if (p.flash > 0 && !p.dead) hurt(P, p.flash);
    if (p.status.stun > 0) P.torso.rot += Math.sin(G.time * 30) * 0.08;
    const blink = p.iframes > 0 && p.state !== 'dodge' && !p.dead && Math.floor(G.time * 20) % 2 === 0;
    drawRig(g, f, P, RIG.human, p.x, p.y + 1 - p.z, { face: p.faceX, flash: p.flash > 0, alpha: blink ? 0.4 : p.dead ? 0.85 : 1 });
    p.lastPose = P;
    return true;
  };

  // 잔상 (회피·돌진)
  A.ghost = function (g, fx, alpha) {
    const key = A.playerKey(), f = SPR.frame(key);
    if (!f) return false;
    const P = newPose();
    if (fx.pose) { P.rot = fx.pose.rot; P.center = fx.pose.center; P.sx = fx.pose.sx; P.sy = fx.pose.sy; P.torso.rot = fx.pose.torso.rot; P.oy = fx.pose.oy; }
    drawRig(g, f, P, RIG.human, fx.x, fx.y + 1, { face: fx.face, flash: true, alpha });
    return true;
  };

  // ─── 몬스터 ────────────────────────────────────────────
  A.mob = function (g, mob, f, dt, extra) {
    const def = mob.def, rig = rigOf(def, mob.id);
    const heavy = !!(rig.heavy || mob.boss);
    const b = track(mob, dt, heavy ? 9 : rig.quad ? 8 : 6);
    const P = newPose();
    const t = mob.anim, fwdSign = 1;
    if (mob.dead) {
      const k = clamp(mob.deathT / 0.45, 0, 1);
      P.rot = -k * 1.1; P.sy = 1 - k * 0.35; P.sx = 1 + k * 0.15;
    } else if (mob.downT > 0) {
      P.lying = 1; P.oy = -f.w / S * 0.22;
    } else {
      // 이동
      if (rig.quad) {
        const gph = mob.gait;
        for (let i = 0; i < 2; i++) { // 0: 앞다리(로컬 앞쪽 절반), 1: 뒷다리
          const ph = gph + (i ? Math.PI * 0.85 : 0);
          P.legs[i].ox += Math.sin(ph) * 2.2 * b;
          P.legs[i].oy -= Math.max(0, Math.cos(ph)) * 1.8 * b;
        }
        P.rot += Math.sin(gph) * 0.07 * b;        // 몸통 앞뒤로 출렁
        P.oy -= Math.abs(Math.cos(gph)) * 1.4 * b;
        P.torso.rot += Math.sin(gph + 0.6) * 0.04 * b;
        breathe(P, t, 0.035 * (1 - b), 3.2);
      } else if (rig.hip) {
        humanWalk(P, mob, b, heavy);
        breathe(P, t, (heavy ? 0.022 : 0.03) * (1 - b), heavy ? 1.8 : 2.8);
      } else if (rig.wings) {
        P.wing = Math.sin(t * (b > 0.3 ? 16 : 11)) * 0.55;
        P.oy -= 6 + Math.sin(t * 4) * 2;
        P.rot += Math.sin(t * 3) * 0.05 + 0.1 * b;
        P.sy *= 1 + Math.sin(t * 16) * 0.04;
      } else if (rig.wave === 'x') {
        P.wave = t * 5; P.waveAmp = mob.boss ? 5 : 2.8;
        P.oy -= (mob.boss ? 2 : 4) + Math.sin(t * 2.6) * 2.4;
        P.rot += Math.sin(t * 1.8) * 0.05 + 0.08 * b;
      } else if (rig.wave === 'y') {
        P.wave = t * (b > 0.3 ? 11 : 5); P.waveAmp = 1.6;
        P.sx *= 1 + Math.sin(t * 9) * 0.03 * b;
      } else if (rig.jelly) {
        const ph = t * (b > 0.3 ? 9 : 3.4);
        const s = Math.sin(ph);
        P.sy *= 1 + s * (def.arch === 'spider' ? 0.05 : 0.13); P.sx *= 1 - s * (def.arch === 'spider' ? 0.03 : 0.11);
        if (b > 0.3) P.oy -= Math.max(0, s) * (def.arch === 'spider' ? 1 : 3.5);
        if (def.arch === 'spider' && b > 0.3) P.ox += Math.sin(t * 38) * 0.4;
      }
      // 행동 (예비동작 → 공격)
      const a = mob.act;
      if (a) {
        const dur = a.dur || 0.5;
        if (a.type === 'lunge' || a.type === 'charge') {
          const wind = a.type === 'lunge' ? 0.4 : dur;
          const run = a.type === 'lunge' ? 0.32 : 0.5;
          if (a.t < wind) {
            const e = easeOut(a.t / wind);
            P.sy *= 1 - 0.14 * e; P.sx *= 1 + 0.1 * e; P.rot -= 0.16 * e; P.torso.rot -= 0.2 * e;
            P.legs[0].ox -= 1.2 * e; P.legs[1].ox -= 1.2 * e;
            if (mob.boss) P.ox += (Math.random() - 0.5) * 1.4;
          } else if (a.t < wind + run) {
            P.sx *= 1.22; P.sy *= 0.84; P.rot += 0.2; P.torso.rot += 0.25;
            P.legs[0].ox += 2.2; P.legs[1].ox -= 2.2;
            if (rig.wings) P.wing = -0.7;
          }
        } else {
          const k = a.t < dur ? a.t / dur : 1 + (a.t - dur) / 0.3;
          if (a.type === 'shoot' || a.type === 'cast' || a.type === 'volley' || a.type === 'ring') {
            if (k < 1) { const e = easeOut(k); P.torso.rot -= 0.15 * e; P.torso.sy *= 1 + 0.08 * e + Math.sin(a.t * 40) * 0.015 * e; P.oy -= 1.5 * e; }
            else { const s = clamp(k - 1, 0, 1); P.torso.rot += 0.25 * spring(s); P.ox += 1.5 * Math.pow(1 - s, 2); }
            if (rig.wings) P.wing = k < 1 ? -0.8 * easeOut(k) : 0.8 * spring(clamp(k - 1, 0, 1));
          } else {
            const hk = 1 / (1 + 0.3 / dur);
            const kk = a.t < dur ? (a.t / dur) * hk : hk + ((a.t - dur) / 0.3) * (1 - hk);
            swing(P, clamp(kk, 0, 1), hk, heavy ? 1.3 : 1, a.type === 'slam' || heavy ? 'heavy' : 'slash');
            if (rig.jelly && a.t < dur) { const e = a.t / dur; P.sy *= 1 - 0.2 * e; P.sx *= 1 + 0.15 * e; }
            if (rig.wings && a.t < dur) P.wing = -0.6 * (a.t / dur);
          }
        }
      }
      if (mob.stunT > 0 || mob.status.stun > 0) { P.torso.rot += Math.sin(G.time * 32) * 0.1; P.rot += Math.sin(G.time * 32) * 0.03; }
      if (mob.flash > 0 && !mob.boss) hurt(P, mob.flash, 0.12);
    }
    void fwdSign;
    drawRig(g, f, P, rig, mob.x, mob.y + 1 - mob.z, { face: mob.face || 1, flash: mob.flash > 0, alpha: extra.alpha, scale: mob.elite ? 1.2 : 1 });
    return P;
  };
})();
