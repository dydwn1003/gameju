// 애니메이션: 스프라이트를 자르지 않고 "통째로" 움직인다.
//  - 칸 이동: 한 칸마다 통통 튀는 걸음 + 좌우로 살짝 뒤뚱 (바람의나라식)
//  - 공격: 뒤로 젖혔다가 앞으로 내딛기 + 무기 휘두르기 궤적
//  - 프레임 이미지(assets/anim/manifest.js)가 등록된 캐릭터는 그 프레임을 그대로 재생한다
'use strict';
(function () {
  const S = R.SCALE, SPR = R.SPR, TAU = Math.PI * 2;
  const A = (R.Anim = {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeOut = (k) => 1 - (1 - k) * (1 - k);
  const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const spring = (s) => Math.exp(-5.5 * s) * Math.cos(7.5 * s);
  const snap = (v) => Math.round(v * S) / S;

  // 아키타입별 움직임 성격
  const KIND = {
    human: { hop: 1.4, sway: 0.06 }, golem: { hop: 0.7, sway: 0.08, heavy: true }, quad: { hop: 1.8, sway: 0.03 },
    mushroom: { hop: 1.6, sway: 0.08 }, blob: { jelly: true }, spider: { hop: 0.8, sway: 0.02 },
    flyer: { fly: true }, ghost: { float: true }, worm: { worm: true },
  };
  const kindOf = (def, key) => (key === 'void_king' ? KIND.ghost : KIND[def.arch] || KIND.human);

  const newPose = () => ({ ox: 0, oy: 0, rot: 0, sx: 1, sy: 1, center: false, lying: 0 });

  // 이동 거리로 걸음 위상 진행 (한 칸 = 반 주기 → 칸마다 한 번 통통)
  function track(e, dt) {
    if (e._ax === undefined) { e._ax = e.x; e._ay = e.y; e.gait = 0; e.walkBlend = 0; }
    const dx = e.x - e._ax, dy = e.y - e._ay;
    e._ax = e.x; e._ay = e.y;
    const d = Math.hypot(dx, dy);
    const moving = d > 0.05 && d < 30;
    if (moving) e.gait += (d / R.TILE) * Math.PI;
    e.walkBlend += ((moving ? 1 : 0) - e.walkBlend) * (1 - Math.exp(-(moving ? 18 : 10) * dt));
    if (!moving && e.walkBlend < 0.5) { const t = Math.round(e.gait / Math.PI) * Math.PI; e.gait += (t - e.gait) * (1 - Math.exp(-12 * dt)); }
    return e.walkBlend;
  }
  function walk(P, e, b, k) {
    const s = Math.abs(Math.sin(e.gait));
    P.oy -= s * k.hop * b;                                   // 칸 사이에서 폴짝
    P.rot += Math.sin(e.gait) * k.sway * b;                  // 칸마다 좌우로 뒤뚱
    P.sy *= 1 + (s - 0.5) * 0.06 * b; P.sx *= 1 - (s - 0.5) * 0.04 * b;   // 착지할 때 살짝 눌림
    if (k.heavy) P.ox += Math.sin(e.gait) * 0.4 * b;
  }
  function breathe(P, t, amp = 0.022, spd = 2.6) { const s = Math.sin(t * spd); P.sy *= 1 + s * amp; P.sx *= 1 - s * amp * 0.5; }
  // 근접 공격: 젖힘 → 앞으로 내딛으며 휘두름 (스프링 복귀)
  function strike(P, k, hk, power) {
    if (k < hk) { const e = easeOut(k / hk); P.rot -= 0.13 * e * power; P.ox -= 1.2 * e; P.sy *= 1 + 0.04 * e; }
    else {
      const s = (k - hk) / Math.max(0.01, 1 - hk);
      P.rot += 0.16 * spring(s) * power; P.ox += 3 * Math.pow(1 - s, 2) * power;
      if (power > 1.2 && s < 0.3) { const q = 1 - s / 0.3; P.sx *= 1 + 0.12 * q; P.sy *= 1 - 0.1 * q; }
    }
  }
  function shootPose(P, k, hk) {
    if (k < hk) { const e = easeOut(k / hk); P.ox -= 1 * e; P.sy *= 1 + 0.03 * e; }
    else { const s = (k - hk) / Math.max(0.01, 1 - hk); P.ox -= 1.5 * Math.pow(1 - s, 2); P.rot -= 0.06 * spring(s); }
  }
  function hurt(P, flash, max = 0.15) { const k = clamp(flash / max, 0, 1); P.rot -= 0.18 * k; P.ox -= 2 * k; }

  // 위·아래를 볼 때는 앞으로 내딛는 움직임을 세로로 바꾼다
  function faceVertical(P, dir) {
    if (dir !== 'up' && dir !== 'down') return;
    P.oy += (dir === 'down' ? 0.7 : -0.7) * P.ox; P.ox = 0; P.rot *= 0.35;
  }

  // ─── 그리기: 스프라이트 한 장을 통째로 변형 ─────────────────
  function drawWhole(g, img, sx, sy, sw, sh, dw, dh, P, x, y, o) {
    const flip = o.flip;
    g.save();
    if (o.alpha != null && o.alpha < 1) g.globalAlpha = Math.max(0, o.alpha);
    g.translate(snap(x), snap(y));
    if (flip) g.scale(-1, 1);
    const pv = P.center ? dh * 0.45 : 0;
    g.translate(P.ox, P.oy - pv);
    if (P.lying) g.rotate(-Math.PI / 2 * P.lying);
    if (P.rot) g.rotate(P.rot);
    g.scale(P.sx * (o.scale || 1), P.sy * (o.scale || 1));
    g.translate(0, pv);
    g.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
    g.restore();
  }
  // 디자인 시트 프레임 (로컬 앞쪽 = +x 로 맞춰서)
  function drawSheet(g, f, P, x, y, o) {
    if (o.look && !o.flash) {
      const flip = f.face === -1 ? o.face > 0 : o.face < 0, fwd = f.face || 1;
      const Q = Object.assign({}, P, { ox: P.ox * fwd, rot: P.rot * fwd, lying: P.lying * fwd });
      return drawWhole(g, o.look, 0, 0, f.w, f.h, f.w / S, f.h / S, Q, x, y, { flip, alpha: o.alpha, scale: o.scale });
    }
    const img = o.flash ? SPR.sheet.white : SPR.sheet.img;
    const flip = f.face === -1 ? o.face > 0 : o.face < 0;
    // 포즈의 ox/rot는 "앞쪽" 기준 → 뒤집은 뒤의 로컬 앞쪽(f.face)에 맞춰 부호 보정
    const fwd = f.face || 1;
    const Q = Object.assign({}, P, { ox: P.ox * fwd, rot: P.rot * fwd, lying: P.lying * fwd });
    drawWhole(g, img, f.x, f.y, f.w, f.h, f.w / S, f.h / S, Q, x, y, { flip, alpha: o.alpha, scale: o.scale });
  }

  // ─── 장비 외형: 입은 갑옷 티어에 따라 옷·갑옷 색을 바꾼다 (그림 없이 색 변환) ──────────
  // 티어 0 철(원래 색) · 1 기사(은청) · 2 용암(적동) · 3 서리(빙청) · 4 공허(자수정)
  const LOOK_TINT = [null, { h: 218, s: 0.13, v: 1.2 }, { h: 14, s: 0.78, v: 1.02 }, { h: 194, s: 0.6, v: 1.12 }, { h: 272, s: 0.62, v: 0.98 }];
  // 직업별로 "갑옷·옷"으로 볼 픽셀 (HSV)
  const LOOK_MASK = {
    GLADIATOR: (h, s, v) => s < 0.22 && v > 0.3 && v < 0.97,
    RANGER: (h, s, v) => h > 60 && h < 170 && s > 0.2 && v > 0.12,
    MAGE: (h, s, v) => h > 195 && h < 262 && s > 0.28 && v > 0.12,
    ASSASSIN: (h, s, v) => (s < 0.28 && v > 0.1 && v < 0.55) || (h > 255 && h < 315 && s > 0.2),
  };
  function rgb2hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
  }
  function hsv2rgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  const lookCache = new Map();
  function recolor(img, sx, sy, sw, sh, fam, tier) {
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const g = c.getContext('2d'); g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const T = LOOK_TINT[tier], mask = LOOK_MASK[fam];
    if (!T || !mask) return c;
    const d = g.getImageData(0, 0, sw, sh), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] < 8) continue;
      const [h, s, v] = rgb2hsv(a[i], a[i + 1], a[i + 2]);
      if (!mask(h, s, v)) continue;
      const [r, gg, b] = hsv2rgb(T.h, Math.max(T.s, s * 0.9), Math.min(1, v * T.v));
      a[i] = r; a[i + 1] = gg; a[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
    return c;
  }
  A.lookTier = () => { const ar = G.save && G.save.equip && G.save.equip.armor; return ar ? SPR.itemTier(ar) : 0; };
  // 디자인 시트 프레임 한 장의 외형 (티어 0 이면 null → 원래 그림)
  A.lookFrame = (key, tier = A.lookTier()) => {
    const f = SPR.frame(key);
    if (!f || !tier || !SPR.sheet.img) return null;
    const k = `f:${key}:${tier}`;
    if (!lookCache.has(k)) lookCache.set(k, recolor(SPR.sheet.img, f.x, f.y, f.w, f.h, G.save.cls, tier));
    return lookCache.get(k);
  };
  function lookSheet(key, d, tier) {
    if (!tier) return null;
    const k = `s:${key}:${tier}`;
    if (!lookCache.has(k)) lookCache.set(k, recolor(d.img, 0, 0, d.img.width, d.img.height, G.save.cls, tier));
    return lookCache.get(k);
  }

  // ─── 프레임 시트 (사용자가 넣는 도트 애니메이션) ──────────────
  // R.ANIM_SHEETS[key] = { src, fw, fh, scale, rows: { down, up, side }, idle: [...], walk: [...], attack: [...], hurt, side: 1(오른쪽을 봄) }
  const FS = {};
  A.loadSheets = function () {
    const list = R.ANIM_SHEETS || {};
    for (const k in list) {
      const d = list[k], img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        FS[k] = Object.assign({ scale: 1, side: 1, idle: [0], walk: [1, 2, 3, 4], rows: { down: 0, up: 1, side: 2 } }, d, { img, white: c });
      };
      img.onerror = () => console.warn('애니메이션 시트를 불러오지 못했습니다:', d.src);
      img.src = d.src;
    }
  };
  A.hasFrames = (key) => !!FS[key];
  A.framesOf = (key) => FS[key] || null;
  // 방향·상태에 맞는 프레임 한 칸을 그린다
  // 방향별 값: 배열/숫자면 공통, 객체면 { down, up, left, right, side }
  const perDir = (v, dir, side) => (v == null || Array.isArray(v) || typeof v !== 'object' ? v : v[dir] != null ? v[dir] : v[side] != null ? v[side] : v.side);
  function drawFrames(g, key, e, st, P, o) {
    const d = FS[key];
    const fx = e.faceX || e.face || 1;
    const lr = fx > 0 ? 'right' : 'left';
    // 방향: 위/아래 줄, 옆은 왼쪽·오른쪽 줄이 따로 있으면 그대로, 없으면 side 줄을 뒤집어 쓴다
    const dir = e.dir === 'up' || e.dir === 'down' ? e.dir : lr;
    let rowKey = d.rows[dir] != null ? dir : d.rows.side != null ? 'side' : 'down';
    if ((dir === 'up' || dir === 'down') && d.rows[dir] == null) rowKey = d.rows[lr] != null ? lr : 'side';
    const row = d.rows[rowKey];
    const walkSeq = perDir(d.walk, rowKey, 'side'), idleSeq = perDir(d.idle, rowKey, 'side') || [0];
    let seq = idleSeq, i = Math.floor(e.anim * 3);
    if (st.kind === 'walk' && walkSeq) {
      seq = walkSeq;
      const per = perDir(d.walkPerTile, rowKey, 'side') || 2;         // 한 칸 이동에 넘어가는 프레임 수
      i = Math.floor((e.gait / Math.PI) * per);
    } else if (st.kind === 'attack' && d.attack) { const at = perDir(d.attack, rowKey, 'side'); if (at) { seq = at; i = Math.min(seq.length - 1, Math.floor(st.k * seq.length)); } }
    else if (st.kind === 'hurt' && d.hurt) { const h = perDir(d.hurt, rowKey, 'side'); if (h) { seq = h; i = 0; } }
    const col = seq[((i % seq.length) + seq.length) % seq.length];
    const flip = rowKey === 'side' && fx !== d.side;
    const img = o.flash ? d.white : (o.tier && lookSheet(key, d, o.tier)) || d.img;
    // 로컬 앞쪽: 옆줄이면 바라보는 쪽, 위·아래 줄이면 포즈를 세로로 이미 바꿔 둠
    const fwd = rowKey === 'left' ? -1 : rowKey === 'right' ? 1 : rowKey === 'side' ? d.side : 1;
    const Q = Object.assign({}, P, { ox: P.ox * fwd, rot: P.rot * fwd, lying: P.lying * fwd });
    drawWhole(g, img, col * d.fw, row * d.fh, d.fw, d.fh, d.fw / d.scale, d.fh / d.scale, Q, e.x, e.y + 1 - (e.z || 0), { flip, alpha: o.alpha, scale: o.scale });
  }

  // 무기 휘두르기 궤적 (근접 직업)
  function drawSwing(g, p, k, hk, cls) {
    if (k < hk * 0.7 || k > 0.95) return;
    const img = SPR.weapon(cls.weapon);
    if (!img) return;
    const s = clamp((k - hk * 0.7) / (1 - hk * 0.7), 0, 1);
    const dir = p.swingDir || 1, heavy = p.comboStep === 2;
    const a0 = p.aim - dir * (heavy ? 1.6 : 1.2), a = a0 + dir * (heavy ? 3.2 : 2.4) * easeOut(s);
    const hx = p.x + Math.cos(p.aim) * 3, hy = p.y - 8 + Math.sin(p.aim) * 2;
    g.save();
    g.globalAlpha = 1 - Math.max(0, s - 0.7) / 0.3;
    g.translate(snap(hx), snap(hy));
    g.rotate(a);
    g.drawImage(img, 1, -img.height / 2);
    g.restore();
  }

  // ─── 플레이어 ──────────────────────────────────────────
  // 프레임 시트가 있는 쪽을 우선 (전직 전용 시트가 없으면 기본 직업의 걷기 프레임 사용)
  // 외형: 입은 갑옷 티어별 시트(예: GLADIATOR@2)가 등록돼 있으면 그 모습으로 → 전직 → 기본 직업 순
  A.playerKey = () => {
    const s = G.save, ar = s.equip && s.equip.armor, t = ar ? SPR.itemTier(ar) : 0;
    for (const k of [s.adv && `${s.adv}@${t}`, s.adv, `${s.cls}@${t}`]) if (k && FS[k]) return k;
    if (FS[s.cls]) return s.cls;
    return s.adv && SPR.frame(s.adv) ? s.adv : s.cls;
  };

  A.player = function (g, p, dt) {
    const key = A.playerKey(), f = SPR.frame(key);
    if (!f && !FS[key]) return false;
    const cls = R.CLASSES[G.save.cls];
    const b = track(p, dt);
    const P = newPose();
    const t = p.anim;
    const st = { kind: b > 0.3 ? 'walk' : 'idle', k: 0 };
    let atk = null;
    if (p.dead) { P.lying = 1; P.oy = -3; }
    else if (p.state === 'dodge') {
      const k = clamp(p.stateT / 0.2, 0, 1);
      P.center = true; P.rot = easeInOut(k) * TAU; P.sx = P.sy = 0.88; P.oy = -Math.sin(k * Math.PI) * 4;
    } else if (p.state === 'attack') {
      const k = clamp(p.stateT / p.dur, 0, 1), hk = p.hitAt / p.dur;
      st.kind = 'attack'; st.k = k;
      if (cls.melee) { strike(P, k, hk, p.comboStep === 2 ? 1.4 : 1); atk = { k, hk }; }
      else shootPose(P, k, hk);
    } else if (p.state === 'skill' && p.act) {
      const k = clamp(p.stateT / p.act.dur, 0, 1), id = p.act.id;
      st.kind = 'attack'; st.k = k;
      if (id === 'whirl') { P.center = true; P.rot = easeOut(k) * TAU; }
      else if (id === 'charge' || id === 'bloodrage') { P.rot = 0.22; P.ox = 2; P.sx = 1.06; if (id === 'bloodrage' && k < 0.6) P.oy -= Math.sin((k / 0.6) * Math.PI) * 10; }
      else if (id === 'shadowstep' || id === 'execute') { const s = Math.sin(k * Math.PI); P.sx = 1 - s * 0.4; P.sy = 1 + s * 0.25; }
      else if (id === 'poisonblade' || id === 'clones') { const q = (k * (id === 'clones' ? 8 : 5)) % 1; strike(P, q, 0.3, 0.8); atk = { k: q, hk: 0.3 }; }
      else if (id === 'multishot' || id === 'pierce' || id === 'deadeye') shootPose(P, k, id === 'deadeye' ? 0.7 : 0.35);
      else if (id === 'bulwark') { const e = k < 0.3 ? easeOut(k / 0.3) : 1 - (k - 0.3) / 0.7; P.sy = 1 - 0.12 * e; P.sx = 1 + 0.08 * e; }
      else { // 시전: 몸을 모았다가 뻗기
        if (k < 0.35) { const e = easeOut(k / 0.35); P.sy *= 1 + 0.06 * e; P.oy -= 2 * e; }
        else { const s = (k - 0.35) / 0.65; P.ox += 1.5 * Math.pow(1 - s, 2); P.rot += 0.1 * spring(s); }
      }
    } else if (b > 0.02) walk(P, p, b, FS[key] ? { hop: 0.4, sway: 0 } : KIND.human);
    if (b < 1 && !p.dead && p.state !== 'dodge') breathe(P, t, 0.022 * (1 - b));
    if (p.flash > 0 && !p.dead) { hurt(P, p.flash); if (st.kind !== 'attack') st.kind = 'hurt'; }
    if (p.status.stun > 0) P.rot += Math.sin(G.time * 30) * 0.06;
    const blink = p.iframes > 0 && p.state !== 'dodge' && !p.dead && Math.floor(G.time * 20) % 2 === 0;
    const tier = A.lookTier();
    const o = { face: p.faceX, flash: p.flash > 0, alpha: blink ? 0.4 : p.dead ? 0.85 : 1, tier, look: FS[key] ? null : A.lookFrame(key, tier) };
    if (!P.center && !p.dead) faceVertical(P, p.dir);
    const behind = atk && p.dir === 'up';
    if (behind) drawSwing(g, p, atk.k, atk.hk, cls);
    if (FS[key]) drawFrames(g, key, p, st, P, o);
    else drawSheet(g, f, P, p.x, p.y + 1 - p.z, o);
    if (atk && !behind && !FS[key]) drawSwing(g, p, atk.k, atk.hk, cls);
    p.lastPose = P;
    return true;
  };

  // 잔상 (회피·돌진)
  A.ghost = function (g, fx, alpha) {
    const key = A.playerKey(), f = SPR.frame(key);
    if (!f) return false;
    const P = newPose();
    if (fx.pose) { P.rot = fx.pose.rot; P.center = fx.pose.center; P.sx = fx.pose.sx; P.sy = fx.pose.sy; P.oy = fx.pose.oy; }
    drawSheet(g, f, P, fx.x, fx.y + 1, { face: fx.face, flash: true, alpha });
    return true;
  };

  // ─── 몬스터 ────────────────────────────────────────────
  A.mob = function (g, mob, f, dt, extra) {
    const def = mob.def, kd = kindOf(def, mob.id);
    const b = track(mob, dt);
    const P = newPose();
    const t = mob.anim;
    const st = { kind: b > 0.3 ? 'walk' : 'idle', k: 0 };
    if (mob.dead) {
      const k = clamp(mob.deathT / 0.45, 0, 1);
      P.rot = -k * 1.1; P.sy = 1 - k * 0.35; P.sx = 1 + k * 0.15;
    } else if (mob.downT > 0) {
      P.lying = 1; P.oy = -f.w / S * 0.22;
    } else {
      if (kd.fly) { P.oy -= 6 + Math.sin(t * 5) * 2.5; P.sy *= 1 + Math.sin(t * 16) * 0.06; P.rot += Math.sin(t * 3) * 0.05 + 0.08 * b; }
      else if (kd.float) { P.oy -= (mob.boss ? 2 : 4) + Math.sin(t * 2.6) * 2.4; P.rot += Math.sin(t * 1.8) * 0.05; }
      else if (kd.worm) { const s = Math.sin(t * (b > 0.3 ? 11 : 4)); P.sx *= 1 + s * 0.08; P.sy *= 1 - s * 0.06; }
      else if (kd.jelly) {
        const s = Math.sin(t * (b > 0.3 ? 9 : 3.4));
        P.sy *= 1 + s * 0.12; P.sx *= 1 - s * 0.1;
        if (b > 0.3) P.oy -= Math.abs(Math.sin(mob.gait)) * 3;
      } else {
        if (b > 0.02) walk(P, mob, b, kd);
        breathe(P, t, (kd.heavy ? 0.018 : 0.025) * (1 - b), kd.heavy ? 1.8 : 2.8);
      }
      // 행동 (예비동작 → 공격)
      const a = mob.act;
      if (a) {
        const dur = a.dur || 0.5;
        st.kind = 'attack';
        if (a.type === 'lunge' || a.type === 'charge') {
          const wind = a.type === 'lunge' ? 0.4 : dur;
          if (a.t < wind) {
            const e = easeOut(a.t / wind);
            P.sy *= 1 - 0.12 * e; P.sx *= 1 + 0.1 * e; P.rot -= 0.14 * e; P.ox -= 1.5 * e;
            if (mob.boss) P.ox += (Math.random() - 0.5) * 1.4;
          } else { P.sx *= 1.18; P.sy *= 0.86; P.rot += 0.16; }
          st.k = clamp(a.t / (wind + 0.3), 0, 1);
        } else {
          const k = a.t < dur ? a.t / dur : 1 + (a.t - dur) / 0.3;
          st.k = clamp(k / 1.3, 0, 1);
          if (a.type === 'shoot' || a.type === 'cast' || a.type === 'volley' || a.type === 'ring') {
            if (k < 1) { const e = easeOut(k); P.sy *= 1 + 0.07 * e; P.oy -= 1.5 * e; }
            else { const s = clamp(k - 1, 0, 1); P.ox += 1.5 * Math.pow(1 - s, 2); P.rot += 0.1 * spring(s); }
          } else {
            const hk = 1 / (1 + 0.3 / dur);
            const kk = a.t < dur ? (a.t / dur) * hk : hk + ((a.t - dur) / 0.3) * (1 - hk);
            strike(P, clamp(kk, 0, 1), hk, kd.heavy || mob.boss ? 1.4 : 1);
            if (kd.jelly && a.t < dur) { const e = a.t / dur; P.sy *= 1 - 0.2 * e; P.sx *= 1 + 0.15 * e; }
          }
        }
      }
      if (mob.stunT > 0 || mob.status.stun > 0) P.rot += Math.sin(G.time * 32) * 0.06;
      if (mob.flash > 0 && !mob.boss) hurt(P, mob.flash, 0.12);
    }
    if (!P.lying && !mob.dead && !mob.boss) faceVertical(P, mob.dir);
    const o = { face: mob.face || 1, flash: mob.flash > 0, alpha: extra.alpha, scale: (mob.elite ? 1.2 : 1) * (mob.ss || 1) };
    const key = mob.sk || mob.id;
    if (FS[key]) drawFrames(g, key, mob, st, P, o);
    else drawSheet(g, f, P, mob.x, mob.y + 1 - mob.z, o);
    return P;
  };
  A.loadSheets();
})();
