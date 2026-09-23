// 렌더러: 3/4 쿼터뷰 타일 + Y정렬 스프라이트 + 이펙트
'use strict';
(function () {
  const TS = R.TILE, S = R.SCALE, SPR = R.SPR, T = R.T;
  const VW = R.VIEW_W, VH = R.VIEW_H;

  function tileVariantFloor(m, tx, ty) { return m.variant[ty * m.w + tx]; }

  function drawGround(g, m, x0, y0, x1, y1, time) {
    const theme = m.theme;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
      const t = m.tiles[ty * m.w + tx];
      const X = tx * TS, Y = ty * TS;
      if (t === T.PATH || t === T.EXIT) g.drawImage(SPR.path(tileVariantFloor(m, tx, ty)), X, Y);
      else if (t === T.RAIL) {
        g.drawImage(SPR.floor(theme, tileVariantFloor(m, tx, ty)), X, Y);
        g.fillStyle = '#4a3020'; for (let i = 1; i < TS; i += 5) g.fillRect(X + i, Y + 4, 3, 10);
        g.fillStyle = '#9a9aa8'; g.fillRect(X, Y + 5, TS, 1); g.fillRect(X, Y + 12, TS, 1);
        g.fillStyle = '#5a5a66'; g.fillRect(X, Y + 6, TS, 1); g.fillRect(X, Y + 13, TS, 1);
      }
      else if (t === T.ICE) g.drawImage(SPR.iceFloor(), X, Y);
      else if (t === T.WALL && R.THEMES[theme].wall !== 'tree') { /* 벽 스프라이트가 덮음 */ g.drawImage(SPR.floor(theme, 0), X, Y); }
      else g.drawImage(SPR.floor(theme, tileVariantFloor(m, tx, ty)), X, Y);
      if (t === T.HAZARD) {
        const H = R.THEMES[theme].hazard;
        g.fillStyle = H[0]; g.fillRect(X, Y, TS, TS);
        g.fillStyle = H[1];
        const ph = Math.floor(time * 3 + tx * 1.7 + ty * 2.3) % 4;
        g.fillRect(X + 2 + ph * 2, Y + 4, 4, 2); g.fillRect(X + 9 - ph, Y + 10, 3, 2);
        g.fillStyle = 'rgba(255,255,200,0.5)'; if (ph === 0) g.fillRect(X + 6, Y + 7, 1, 1);
      } else if (t === T.SWITCH) {
        const on = G.dungeon && G.dungeon.switchOn;
        g.fillStyle = '#2a2a30'; g.fillRect(X + 2, Y + 2, 12, 12);
        g.fillStyle = on ? '#6aff8a' : '#e0b030'; g.fillRect(X + 3, Y + (on ? 5 : 3), 10, on ? 8 : 10);
        g.fillStyle = on ? '#3a8a4a' : '#8a6a1a'; g.fillRect(X + 3, Y + 12, 10, 1);
      } else if (t === T.PORTAL) {
        const a = time * 3;
        g.fillStyle = 'rgba(80,180,255,0.35)'; g.beginPath(); g.ellipse(X + 8, Y + 8, 12, 7, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#8ad8ff'; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(X + 8, Y + 8, 4 + ((a + i * 2.1) % 6) * 1.4, 2.5 + ((a + i * 2.1) % 6) * 0.8, 0, 0, Math.PI * 2); g.stroke(); }
      } else if (t === T.EXIT) {
        g.fillStyle = '#ffe070';
        const b = Math.floor(time * 4) % 2;
        g.fillRect(X + 7, Y + 5 + b, 2, 5); g.fillRect(X + 5, Y + 9 + b, 6, 1); g.fillRect(X + 6, Y + 10 + b, 4, 1);
      }
    }
  }

  function shadow(g, x, y, w) {
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(x, y, w, w * 0.4, 0, 0, Math.PI * 2); g.fill();
  }

  function drawSprite(g, img, x, y, flash, alpha) {
    const dx = Math.round(x - img.width / 2), dy = Math.round(y - img.height);
    if (alpha != null && alpha < 1) g.globalAlpha = alpha;
    g.drawImage(flash ? SPR.white(img) : img, dx, dy);
    g.globalAlpha = 1;
  }


  function drawWeapon(g, p, cls) {
    const w = cls.weapon;
    const img = SPR.weapon(w);
    let ang, px = p.x, py = p.y - 8;
    const flipL = p.dir === 'left';
    if (p.state === 'attack') {
      const t = Math.min(1, p.stateT / p.dur);
      if (w === 'bow' || w === 'staff') ang = p.aim;
      else ang = p.aim + p.swingDir * (-1.3 + 2.6 * Math.min(1, t / 0.6));
    } else if (p.state === 'skill') {
      ang = p.aim + (p.act && p.act.dur === 0.4 ? p.stateT * 20 : 0);
    } else {
      if (w === 'bow') ang = p.dir === 'up' ? -Math.PI / 2 : p.dir === 'down' ? Math.PI / 2 : flipL ? Math.PI : 0;
      else if (w === 'staff') ang = -Math.PI / 2 + (flipL ? -0.25 : 0.25);
      else ang = flipL ? Math.PI - 1.0 : 1.0;
    }
    const off = w === 'bow' ? 6 : 3;
    px += Math.cos(ang) * off; py += Math.sin(ang) * off * 0.8;
    g.save();
    g.translate(Math.round(px), Math.round(py));
    g.rotate(ang);
    if (w === 'bow') g.drawImage(img, -2, -img.height / 2);
    else g.drawImage(img, -2, -Math.floor(img.height / 2));
    g.restore();
  }

  function drawPlayer(g, p) {
    const s = G.save, cls = R.CLASSES[s.cls];
    const c = Math.cos(p.aim);
    if (!p.faceX) p.faceX = 1;
    if (Math.abs(c) > 0.25 && p.state !== 'dodge') p.faceX = c > 0 ? 1 : -1;
    if (p.guardT > 0) {
      const a = Math.min(1, p.guardT) * (0.55 + Math.sin(G.time * 10) * 0.15);
      g.strokeStyle = `rgba(154,216,255,${a})`; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(p.x, p.y - 9, 13, 16, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = `rgba(154,216,255,${a * 0.18})`; g.fill();
    }
    if (SPR.frame(R.Anim.playerKey()) || R.Anim.hasFrames(R.Anim.playerKey())) {
      shadow(g, p.x, p.y, p.state === 'dodge' ? 5 : 7);
      R.Anim.player(g, p, G.rdt || 1 / 60);
      drawStatusMarks(g, p);
      return;
    }
    shadow(g, p.x, p.y, 6);
    if (p.dead) {
      const img = SPR.human('pl' + s.cls, cls.look, 'side', 0, false);
      g.save(); g.translate(Math.round(p.x), Math.round(p.y - 3)); g.rotate(-Math.PI / 2); g.globalAlpha = 0.8;
      g.drawImage(img, 0, -img.height / 2); g.restore(); g.globalAlpha = 1;
      return;
    }
    const moving = p.state === 'walk';
    const frame = moving ? Math.floor(p.anim * 9) % 4 : p.state === 'dodge' ? 1 : 0;
    const d = p.dir;
    const img = SPR.human('pl' + s.cls, Object.assign({ shield: s.cls === 'GLADIATOR' }, cls.look), d === 'left' || d === 'right' ? 'side' : d, frame, d === 'left');
    const blink = p.iframes > 0 && p.state !== 'dodge' && Math.floor(G.time * 20) % 2 === 0;
    if (d === 'up') drawWeapon(g, p, cls);
    drawSprite(g, img, p.x, p.y + 2 - p.z, p.flash > 0, blink ? 0.4 : 1);
    if (d !== 'up') drawWeapon(g, p, cls);
    drawStatusMarks(g, p);
  }
  function drawStatusMarks(g, p) {
    if (p.status.poison > 0 || p.status.burn > 0) {
      g.fillStyle = p.status.burn > 0 ? '#ff8a3a' : '#9ad84a';
      if (Math.floor(G.time * 6) % 2) g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 26, 2, 2);
    }
    if (p.status.slow > 0) { g.fillStyle = 'rgba(160,220,255,0.35)'; g.fillRect(Math.round(p.x) - 6, Math.round(p.y) - 4, 12, 4); }
  }

  function mobImage(m) {
    const d = m.def;
    const moving = m.ai === 'CHASE' || m.ai === 'RETURN' || m.ai === 'FIGHT';
    if (d.arch === 'human') {
      const frame = moving || m.ai === 'PATROL' ? Math.floor(m.anim * 7) % 4 : 0;
      const view = m.ai === 'PATROL' && !m.act ? 'down' : 'side';
      return SPR.human(m.id, d.look, view, frame, view === 'side' && m.face < 0, m.scale);
    }
    const frame = Math.floor(m.anim * (d.arch === 'flyer' ? 8 : 4)) % 2;
    const flip = (d.arch === 'quad' || d.arch === 'worm') ? m.face < 0 : false;
    return SPR.monster(m.id, d, frame, flip, m.scale);
  }

  function drawTeleMob(g, m) {
    const a = m.act;
    if (!a) return;
    if (a.type === 'melee' && a.t < a.dur) {
      const k = a.t / a.dur;
      g.fillStyle = `rgba(255,40,40,${0.12 + k * 0.25})`;
      g.beginPath(); g.moveTo(m.x, m.y - 4); g.arc(m.x, m.y - 4, a.range + m.r * 0.5, a.ang - 1.2, a.ang + 1.2); g.closePath(); g.fill();
    } else if (a.type === 'lunge' && a.t < 0.4) {
      g.save(); g.translate(m.x, m.y - 2); g.rotate(a.ang);
      g.fillStyle = `rgba(255,40,40,${0.15 + a.t * 0.5})`; g.fillRect(0, -m.r, 62, m.r * 2); g.restore();
    } else if (a.type === 'shoot' && a.t < a.dur) {
      g.fillStyle = R.ELEM[m.elem].color; g.globalAlpha = 0.5 + 0.5 * Math.sin(a.t * 30);
      g.beginPath(); g.arc(m.x, m.y - m.hh / 2, 2 + a.t * 5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    } else if (a.type === 'charge' && a.t < a.dur) {
      g.save(); g.translate(m.x, m.y - 2); g.rotate(a.ang);
      g.fillStyle = `rgba(255,30,30,${0.15 + (a.t / a.dur) * 0.3})`; g.fillRect(0, -m.r, a.len, m.r * 2);
      g.strokeStyle = 'rgba(255,80,80,0.8)'; g.lineWidth = 1; g.strokeRect(0, -m.r, a.len, m.r * 2); g.restore();
    } else if ((a.type === 'volley' || a.type === 'ring' || a.type === 'cast') && a.t < a.dur) {
      g.strokeStyle = R.ELEM[m.elem].color; g.lineWidth = 2; g.globalAlpha = 0.7;
      g.beginPath(); g.arc(m.x, m.y - m.hh / 2, 6 + (1 - a.t / a.dur) * 20, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
  }

  function drawMob(g, m) {
    if (m.dead && m.deathT > 0.45) return;
    if (!m.dead && G.tap && G.tap.mob === m) {
      // 지정한 적: 발밑에 도는 붉은 표식
      const r = Math.max(8, m.r * 1.3), a0 = G.time * 3;
      g.strokeStyle = '#ff4a4a'; g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(m.x, m.y, r, r * 0.45, 0, a0 + i * Math.PI / 2, a0 + i * Math.PI / 2 + 0.9); g.stroke(); }
    }
    const f = SPR.frame(m.sk || m.id);
    if (f) return drawMobSheet(g, m, f);
    const img = mobImage(m);
    const alpha = m.dead ? 1 - m.deathT / 0.45 : m.shield ? 0.45 + Math.sin(G.time * 8) * 0.15 : m.def.arch === 'ghost' ? 0.85 : 1;
    shadow(g, m.x, m.y, m.r * 1.1);
    if (m.elite && !m.dead) {
      g.strokeStyle = `rgba(255,210,80,${0.5 + Math.sin(G.time * 5) * 0.3})`; g.lineWidth = 1;
      g.beginPath(); g.ellipse(m.x, m.y, m.r + 4, (m.r + 4) * 0.45, 0, 0, Math.PI * 2); g.stroke();
    }
    const hover = m.def.arch === 'ghost' || m.def.arch === 'flyer' ? 4 + Math.sin(m.anim * 4) * 2 : 0;
    if (m.downT > 0) {
      g.save(); g.translate(Math.round(m.x), Math.round(m.y - 2)); g.rotate(m.face > 0 ? -Math.PI / 2 : Math.PI / 2);
      g.globalAlpha = alpha; g.drawImage(m.flash > 0 ? SPR.white(img) : img, m.face > 0 ? 0 : -img.width, -img.height / 2);
      g.restore(); g.globalAlpha = 1;
      if (Math.floor(G.time * 8) % 2) { g.fillStyle = '#ffe86a'; g.fillRect(Math.round(m.x) - 4, Math.round(m.y) - 14, 1, 1); g.fillRect(Math.round(m.x) + 3, Math.round(m.y) - 12, 1, 1); }
    } else {
      const shake = m.act && m.act.t < (m.act.dur || 0) && (m.act.type === 'lunge' || m.act.type === 'charge') ? (Math.random() - 0.5) * 2 : 0;
      drawSprite(g, img, m.x + shake, m.y + 1 - m.z - hover, m.flash > 0, alpha);
    }
    if (m.shield && !m.dead) { g.strokeStyle = '#e0a0ff'; g.lineWidth = 1.5; g.globalAlpha = 0.7; g.beginPath(); g.arc(m.x, m.y - m.hh / 2, m.r + 10, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    // 상태 이상 표시
    if (!m.dead) {
      const s = m.status;
      if (s.slow > 0) { g.fillStyle = 'rgba(160,220,255,0.35)'; g.fillRect(Math.round(m.x - m.r), Math.round(m.y) - 3, m.r * 2, 3); }
      if ((s.burn > 0 || s.poison > 0 || s.curse > 0) && Math.floor(G.time * 6 + m.anim) % 2) {
        g.fillStyle = s.burn > 0 ? '#ff8a3a' : s.poison > 0 ? '#9ad84a' : '#c890ff';
        g.fillRect(Math.round(m.x) + 3, Math.round(m.y - m.hh) - 4, 2, 2);
      }
    }
    // HP 바
    if (!m.boss && !m.dead && m.hp < m.maxHp) {
      const w = m.elite ? 22 : 16, x = Math.round(m.x - w / 2), y = Math.round(m.y - m.hh - 6 - m.z - hover);
      g.fillStyle = '#130f18'; g.fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle = '#4a1a1a'; g.fillRect(x, y, w, 2);
      g.fillStyle = m.elite ? '#ffb030' : '#ff4a4a'; g.fillRect(x, y, Math.max(1, Math.round((w * m.hp) / m.maxHp)), 2);
    }
  }


  // 채집 지점: 약초 싹 / 광석 바위 / 버섯
  function drawNode(g, n) {
    const x = Math.round(n.x), y = Math.round(n.y);
    g.globalAlpha = n.done ? 0.35 : 1;
    shadow(g, x, y, 6);
    if (n.type === 'ore') {
      g.fillStyle = '#4a4450'; g.fillRect(x - 6, y - 7, 12, 7); g.fillRect(x - 4, y - 9, 8, 2);
      g.fillStyle = '#6a6474'; g.fillRect(x - 5, y - 8, 6, 3); g.fillRect(x - 3, y - 9, 4, 1);
      if (!n.done) { const tw = Math.floor(G.time * 3 + n.x) % 3; g.fillStyle = tw ? '#ffd35a' : '#fff4c0'; g.fillRect(x - 2, y - 5, 2, 2); g.fillStyle = '#8ad8ff'; g.fillRect(x + 2, y - 4, 2, 1); }
    } else if (n.type === 'herb') {
      const sw = Math.round(Math.sin(G.time * 2 + n.x) * 1);
      g.fillStyle = '#2e7a2a'; g.fillRect(x - 1, y - 6, 1, 6); g.fillRect(x + 2, y - 5, 1, 5); g.fillRect(x - 4, y - 4, 1, 4);
      g.fillStyle = '#6ad84a'; g.fillRect(x - 3 + sw, y - 8, 3, 2); g.fillRect(x + 1 + sw, y - 7, 3, 2); g.fillRect(x - 6 + sw, y - 6, 3, 2);
      if (!n.done) { g.fillStyle = '#ffffff'; g.fillRect(x + sw, y - 9, 1, 1); }
    } else {
      g.fillStyle = '#e8dcc8'; g.fillRect(x - 3, y - 4, 2, 4); g.fillRect(x + 2, y - 3, 2, 3);
      g.fillStyle = '#c8402a'; g.fillRect(x - 5, y - 7, 6, 3); g.fillRect(x + 1, y - 5, 4, 2);
      g.fillStyle = '#ffe0d0'; g.fillRect(x - 4, y - 7, 1, 1); g.fillRect(x - 1, y - 6, 1, 1); g.fillRect(x + 3, y - 5, 1, 1);
    }
    g.globalAlpha = 1;
  }
  // 광차 · 레버 · 잔해
  function drawCart(g, c) {
    const x = Math.round(c.x), y = Math.round(c.y), sh = c.moving ? Math.round(Math.sin(G.time * 40)) : 0;
    shadow(g, x, y + 4, 9);
    g.fillStyle = '#2a2a30'; g.fillRect(x - 6, y + 1, 3, 3); g.fillRect(x + 3, y + 1, 3, 3);
    g.fillStyle = '#6a4a2a'; g.fillRect(x - 9, y - 9 + sh, 18, 10);
    g.fillStyle = '#8a6a3a'; g.fillRect(x - 9, y - 9 + sh, 18, 2);
    g.fillStyle = '#9a9aa8'; g.fillRect(x - 9, y - 4 + sh, 18, 1); g.fillRect(x - 9, y - 9 + sh, 1, 10); g.fillRect(x + 8, y - 9 + sh, 1, 10);
    g.fillStyle = '#5a5a66'; g.fillRect(x - 7, y - 12 + sh, 5, 3); g.fillRect(x - 1, y - 13 + sh, 6, 4); g.fillRect(x + 4, y - 11 + sh, 3, 2);
    g.fillStyle = '#ffd35a'; g.fillRect(x + 1, y - 12 + sh, 1, 1);
    if (c.moving) for (let i = 0; i < 2; i++) R.fx.push({ type: 'spark', x: x - c.dir * 7, y: y + 3, vx: -c.dir * (60 + Math.random() * 60), vy: -Math.random() * 60, life: 0.15, max: 0.15, color: '#ffd35a' });
  }
  function drawLever(g, l) {
    const x = Math.round(l.x), y = Math.round(l.y);
    shadow(g, x, y, 5);
    g.fillStyle = '#3a3a44'; g.fillRect(x - 4, y - 4, 8, 4);
    g.fillStyle = '#5a5a66'; g.fillRect(x - 4, y - 4, 8, 1);
    const a = l.on ? 0.6 : -0.6;
    g.save(); g.translate(x, y - 3); g.rotate(a);
    g.fillStyle = '#8a8a96'; g.fillRect(-1, -10, 2, 10);
    g.fillStyle = l.on ? '#6aff8a' : '#ff5a4a'; g.fillRect(-2, -12, 4, 3);
    g.restore();
  }
  function drawRubble(g, r) {
    const x = r.x, y = r.y;
    g.fillStyle = '#3a3036'; g.fillRect(x, y - 6, 16, 22);
    const c = ['#6a5a50', '#7a6a5e', '#544842'];
    for (let i = 0; i < 6; i++) { const px = x + ((i * 5 + r.v * 3) % 12), py = y - 6 + ((i * 7 + r.v) % 16); g.fillStyle = c[i % 3]; g.fillRect(px, py, 5, 4); }
    g.fillStyle = '#8a7a6a'; g.fillRect(x + 3, y - 6, 4, 2); g.fillRect(x + 9, y - 4, 5, 2);
  }
  function drawPet(g, pt) {
    const f = SPR.frame(pt.sk);
    if (!f) return;
    shadow(g, pt.x, pt.y, 4);
    R.Anim.mob(g, pt, f, G.rdt || 1 / 60, { alpha: 1 });
  }

  function drawMobSheet(g, mob, f) {
    const w = f.w / S * (mob.ss || 1), h = f.h / S * (mob.ss || 1) * (mob.elite ? 1.2 : 1);
    const face = mob.face || 1;
    shadow(g, mob.x, mob.y, Math.max(mob.r * 1.1, w * 0.32));
    if (mob.elite && !mob.dead) {
      g.strokeStyle = `rgba(255,210,80,${0.5 + Math.sin(G.time * 5) * 0.3})`; g.lineWidth = 1;
      g.beginPath(); g.ellipse(mob.x, mob.y, mob.r + 5, (mob.r + 5) * 0.45, 0, 0, Math.PI * 2); g.stroke();
    }
    let alpha = 1;
    if (mob.dead) alpha = 1 - mob.deathT / 0.45;
    if (mob.downT > 0 && Math.floor(G.time * 8) % 2) { g.fillStyle = '#ffe86a'; g.fillRect(Math.round(mob.x) - 4, Math.round(mob.y) - 14, 1, 1); g.fillRect(Math.round(mob.x) + 3, Math.round(mob.y) - 12, 1, 1); }
    if (mob.shield && !mob.dead) alpha = 0.45 + Math.sin(G.time * 8) * 0.15;
    if (mob.def.arch === 'ghost' && !mob.boss) alpha *= 0.9;
    const m = R.Anim.mob(g, mob, f, G.rdt || 1 / 60, { alpha });
    const top = mob.y - h - mob.z + m.oy;
    if (mob.shield && !mob.dead) { g.strokeStyle = '#e0a0ff'; g.lineWidth = 1.5; g.globalAlpha = 0.7; g.beginPath(); g.arc(mob.x, mob.y - h / 2, mob.r + 12, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    if (!mob.dead) {
      const s = mob.status;
      if (s.slow > 0) { g.fillStyle = 'rgba(160,220,255,0.35)'; g.fillRect(Math.round(mob.x - mob.r), Math.round(mob.y) - 3, mob.r * 2, 3); }
      if ((s.burn > 0 || s.poison > 0 || s.curse > 0) && Math.floor(G.time * 6 + mob.anim) % 2) {
        g.fillStyle = s.burn > 0 ? '#ff8a3a' : s.poison > 0 ? '#9ad84a' : '#c890ff';
        g.fillRect(Math.round(mob.x) + 3, Math.round(top) - 3, 2, 2);
      }
    }
    if (!mob.boss && !mob.dead && mob.hp < mob.maxHp) {
      const bw = mob.elite ? 22 : 16, x = Math.round(mob.x - bw / 2), y = Math.round(top - 5);
      g.fillStyle = '#130f18'; g.fillRect(x - 1, y - 1, bw + 2, 4);
      g.fillStyle = '#4a1a1a'; g.fillRect(x, y, bw, 2);
      g.fillStyle = mob.elite ? '#ffb030' : '#ff4a4a'; g.fillRect(x, y, Math.max(1, Math.round((bw * mob.hp) / mob.maxHp)), 2);
    }
  }

  function drawDrop(g, d) {
    const x = Math.round(d.x), y = Math.round(d.y - d.z);
    shadow(g, d.x, d.y, 3);
    if (d.kind === 'gold') {
      const f = Math.floor(G.time * 8 + d.x) % 4;
      g.fillStyle = '#8a6a10'; g.fillRect(x - 2, y - 5, f === 2 ? 2 : 4, 4);
      g.fillStyle = '#ffd84a'; g.fillRect(x - 2, y - 5, f === 2 ? 1 : 3, 3);
    } else if (d.kind === 'item') {
      const c = R.GRADES[d.item.grade].color;
      if (d.item.grade >= 2) { g.globalAlpha = 0.25 + Math.sin(G.time * 5) * 0.1; g.fillStyle = c; g.fillRect(x - 1, y - 30, 3, 26); g.globalAlpha = 1; }
      g.fillStyle = '#130f18'; g.fillRect(x - 4, y - 8, 8, 8);
      g.fillStyle = '#8a6a44'; g.fillRect(x - 3, y - 7, 6, 6);
      g.fillStyle = c; g.fillRect(x - 3, y - 7, 6, 2); g.fillRect(x - 1, y - 8, 2, 1);
    } else if (d.kind === 'mat') {
      g.fillStyle = '#130f18'; g.fillRect(x - 3, y - 6, 6, 6);
      g.fillStyle = d.id === 'iron' ? '#aab0bc' : d.id === 'stone' ? '#6ad8ff' : '#6a8aff'; g.fillRect(x - 2, y - 5, 4, 4);
      g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 5, 1, 1);
    } else if (d.kind === 'potion') {
      g.fillStyle = '#130f18'; g.fillRect(x - 3, y - 8, 6, 8);
      g.fillStyle = d.id === 'hpPotion' ? '#ff4a4a' : '#4a8aff'; g.fillRect(x - 2, y - 5, 4, 4);
      g.fillStyle = '#e8e0d0'; g.fillRect(x - 1, y - 7, 2, 2);
    }
  }

  function drawShot(g, s) {
    const x = s.x, y = s.y;
    const a = Math.atan2(s.vy, s.vx);
    switch (s.kind) {
      case 'arrow': case 'knife': {
        const img = SPR.weapon(s.kind);
        g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a); g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
        break;
      }
      case 'thunder':
        g.save(); g.translate(x, y); g.rotate(a);
        g.fillStyle = '#fff8a0'; g.fillRect(-12, -2, 18, 4); g.fillStyle = '#ffe040'; g.fillRect(-14, -1, 22, 2);
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(-10, 0);
        for (let i = 0; i < 4; i++) g.lineTo(-10 + i * 5, (Math.random() - 0.5) * 8); g.stroke(); g.restore();
        break;
      case 'bolt': case 'bigbolt': {
        const r = s.kind === 'bigbolt' ? 5 : 3;
        g.fillStyle = s.color || '#bfe6ff'; g.globalAlpha = 0.4; g.beginPath(); g.arc(x, y, r + 2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r - 1, 0, Math.PI * 2); g.fill();
        break;
      }
      case 'fireball':
        g.fillStyle = 'rgba(255,120,40,0.4)'; g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffe070'; g.beginPath(); g.arc(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, 2.5, 0, Math.PI * 2); g.fill();
        break;
      case 'icelance': case 'ice':
        g.save(); g.translate(x, y); g.rotate(a);
        g.fillStyle = '#6fb0e8'; g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -3); g.lineTo(-4, 0); g.lineTo(-6, 3); g.closePath(); g.fill();
        g.fillStyle = '#e8f8ff'; g.fillRect(-3, -1, 9, 1); g.restore();
        break;
      case 'spore':
        g.fillStyle = 'rgba(140,220,80,0.5)'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#b8f070'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        break;
      case 'bomb':
        g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(x, y - Math.sin((s.age / s.life) * Math.PI) * 14, 3.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = Math.floor(G.time * 20) % 2 ? '#ff4a2a' : '#ffe070'; g.fillRect(Math.round(x), Math.round(y - Math.sin((s.age / s.life) * Math.PI) * 14) - 5, 1, 2);
        break;
      case 'wave':
        g.save(); g.translate(x, y); g.rotate(a);
        g.strokeStyle = R.ELEM[s.elem || 'DARK'].color; g.lineWidth = 3; g.beginPath(); g.arc(-4, 0, 7, -1.1, 1.1); g.stroke();
        g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.arc(-4, 0, 7, -0.8, 0.8); g.stroke(); g.restore();
        break;
      default: {
        const c = R.ELEM[s.elem || 'DARK'].color;
        g.fillStyle = c; g.globalAlpha = 0.45; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
      }
    }
  }

  function drawFx(g, f) {
    const k = Math.max(0, f.life / f.max);
    switch (f.type) {
      case 'slash': {
        g.strokeStyle = f.color; g.globalAlpha = k; g.lineWidth = 3 * k + 1;
        const prog = 1 - k;
        if (f.full) { g.beginPath(); g.arc(f.x, f.y, f.r * (0.6 + prog * 0.4), f.ang + prog * 8, f.ang + prog * 8 + Math.PI * 1.6); g.stroke(); }
        else {
          const a0 = f.ang - f.arc * f.dir, a1 = f.ang - f.arc * f.dir + f.arc * 2 * f.dir * Math.min(1, prog * 2.5);
          g.beginPath(); g.arc(f.x, f.y, f.r * 0.85, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
          g.lineWidth = 1; g.globalAlpha = k * 0.6; g.beginPath(); g.arc(f.x, f.y, f.r * 0.6, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
        }
        g.globalAlpha = 1;
        break;
      }
      case 'ring':
        g.strokeStyle = f.color; g.globalAlpha = k; g.lineWidth = (f.w || 2) * k + 0.5;
        g.beginPath(); g.ellipse(f.x, f.y, f.r0 + (f.r1 - f.r0) * (1 - k), (f.r0 + (f.r1 - f.r0) * (1 - k)) * (f.flat ? 0.6 : 1), 0, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
        break;
      case 'zone':
        g.fillStyle = f.color; g.globalAlpha = (f.a || 0.3) * Math.min(1, k * 2);
        g.beginPath(); g.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, Math.PI * 2); g.fill();
        g.globalAlpha = Math.min(1, k * 2) * 0.8; g.strokeStyle = f.color; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
        break;
      case 'beam':
        g.save(); g.translate(f.x, f.y); g.rotate(f.ang); g.globalAlpha = Math.min(1, k * 1.5);
        g.fillStyle = f.color; g.fillRect(0, -f.w / 2, f.len, f.w);
        if (f.w > 2) { g.fillStyle = '#ffffff'; g.fillRect(0, -f.w / 6, f.len, f.w / 3); }
        g.restore(); g.globalAlpha = 1;
        break;
      case 'trap': {
        const x = Math.round(f.x), y = Math.round(f.y);
        g.fillStyle = '#5a4a30'; g.fillRect(x - 5, y - 1, 10, 2);
        g.fillStyle = f.armed ? '#c8c8d0' : '#7a7a80';
        for (let i = -4; i <= 4; i += 2) g.fillRect(x + i, y - 3, 1, 2);
        if (f.armed && Math.floor(G.time * 4) % 2) { g.fillStyle = '#9aff7a'; g.fillRect(x, y - 1, 1, 1); }
        break;
      }
      case 'meteor': {
        g.fillStyle = 'rgba(255,120,40,0.35)'; g.beginPath(); g.arc(f.x, f.y, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ff6a2a'; g.beginPath(); g.arc(f.x, f.y, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffe070'; g.beginPath(); g.arc(f.x - 1.5, f.y + 1.5, 3, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,160,60,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x + 16, f.y - 34); g.stroke();
        break;
      }
      case 'spark':
        g.strokeStyle = f.color; g.lineWidth = 1; g.globalAlpha = k;
        g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - f.vx * 0.04, f.y - f.vy * 0.04); g.stroke(); g.globalAlpha = 1;
        break;
      case 'dust':
        g.fillStyle = f.color; g.globalAlpha = Math.min(1, k * 1.5);
        g.fillRect(Math.round(f.x), Math.round(f.y), f.size || 2, f.size || 2); g.globalAlpha = 1;
        break;
      case 'ghost': {
        if (R.Anim.ghost(g, f, k * 0.22)) break;
        const s = G.save, cls = R.CLASSES[s.cls];
        const d = f.dir;
        const img = SPR.human('pl' + s.cls, Object.assign({ shield: s.cls === 'GLADIATOR' }, cls.look), d === 'left' || d === 'right' ? 'side' : d, 1, d === 'left');
        g.globalAlpha = k * 0.35; g.drawImage(SPR.white(img), Math.round(f.x - img.width / 2), Math.round(f.y + 2 - img.height)); g.globalAlpha = 1;
        break;
      }
    }
  }

  function drawTele(g, t) {
    const k = 1 - Math.max(0, t.t) / t.total;
    const ry = t.r / 1.3;
    g.fillStyle = 'rgba(255,30,30,0.18)';
    g.beginPath(); g.ellipse(t.x, t.y, t.r, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,40,40,0.35)';
    g.beginPath(); g.ellipse(t.x, t.y, t.r * k, ry * k, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,90,90,0.9)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(t.x, t.y, t.r, ry, 0, 0, Math.PI * 2); g.stroke();
    if (t.fx === 'rock' && t.t > 0) {
      const h = t.t * 160;
      g.fillStyle = '#6a5a4a'; g.fillRect(Math.round(t.x) - 4, Math.round(t.y - h) - 6, 8, 7);
      g.fillStyle = '#8a7a6a'; g.fillRect(Math.round(t.x) - 3, Math.round(t.y - h) - 6, 5, 2);
    }
  }

  R.render = function (ctx) {
    const m = G.map;
    if (!m) return;
    const time = G.time;
    // 카메라
    const p = G.player;
    const look = 0.18;
    let cx = p.x + (p.vxs || 0) * look - VW / 2, cy = p.y + (p.vys || 0) * look - VH * 0.52;
    cx = Math.max(0, Math.min(m.w * TS - VW, cx));
    cy = Math.max(-40, Math.min(m.h * TS - VH + 60, cy));
    const ck = 1 - Math.exp(-9 * (G.rdt || 1 / 60));
    G.cam.x += (cx - G.cam.x) * ck; G.cam.y += (cy - G.cam.y) * ck;
    if (Math.abs(cx - G.cam.x) > 200 || Math.abs(cy - G.cam.y) > 200) { G.cam.x = cx; G.cam.y = cy; }
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * G.shake; sy = (Math.random() - 0.5) * G.shake; }
    const camX = Math.round((G.cam.x + sx) * S) / S, camY = Math.round((G.cam.y + sy) * S) / S;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = R.THEMES[m.theme].sky;
    ctx.fillRect(0, 0, VW * S, VH * S);
    ctx.setTransform(S, 0, 0, S, -camX * S, -camY * S);

    const x0 = Math.floor(camX / TS) - 1, y0 = Math.floor(camY / TS) - 1;
    const x1 = x0 + Math.ceil(VW / TS) + 2, y1 = y0 + Math.ceil(VH / TS) + 3;
    drawGround(ctx, m, x0, y0, x1, y1, time);

    for (const t of G.teles) drawTele(ctx, t);
    for (const mob of G.mobs) if (!mob.dead) drawTeleMob(ctx, mob);

    // Y 정렬 드로어블
    const list = [];
    const wallTheme = m.theme;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = m.get(tx, ty);
      if (t === T.WALL) {
        if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
        list.push({ y: (ty + 1) * TS, img: SPR.wall(wallTheme, m.variant[ty * m.w + tx] === 2 ? 1 : m.variant[ty * m.w + tx] === 1 ? 2 : 0), x: tx * TS, dy: ty * TS - 12 });
      } else if (t === T.GATE) list.push({ y: (ty + 1) * TS, img: SPR.gate(wallTheme), x: tx * TS, dy: ty * TS - 12 });
      else if (t === T.VINE) list.push({ y: (ty + 1) * TS, img: SPR.vine(m.vineHp.get(m.idx(tx, ty)) || 1), x: tx * TS, dy: ty * TS - 12 });
      else if (t === T.BLOCK && m.kind === 'dungeon') list.push({ y: (ty + 1) * TS, rubble: { x: tx * TS, y: ty * TS, v: (tx * 7 + ty * 3) % 4 } });
    }
    // 맵 가장자리 바깥 벽 (빈 공간 방지)
    for (const pr of m.props) list.push({ y: pr.bottom, prop: pr });
    for (const c of m.chests) list.push({ y: c.y, chest: c });
    for (const n of m.npcs) list.push({ y: n.y, npc: n });
    for (const d of G.drops) list.push({ y: d.y, drop: d });
    for (const mob of G.mobs) list.push({ y: mob.y, mob });
    for (const nd of m.nodes || []) list.push({ y: nd.y, node: nd });
    if (m.cart) list.push({ y: m.cart.y + 4, cart: m.cart });
    if (m.lever) list.push({ y: m.lever.y, lever: m.lever });
    if (G.pet) list.push({ y: G.pet.y, pet: G.pet });
    list.push({ y: p.y, player: true });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.img) ctx.drawImage(o.img, o.x, o.dy);
      else if (o.mob) drawMob(ctx, o.mob);
      else if (o.player) drawPlayer(ctx, p);
      else if (o.drop) drawDrop(ctx, o.drop);
      else if (o.node) drawNode(ctx, o.node);
      else if (o.cart) drawCart(ctx, o.cart);
      else if (o.lever) drawLever(ctx, o.lever);
      else if (o.rubble) drawRubble(ctx, o.rubble);
      else if (o.pet) drawPet(ctx, o.pet);
      else if (o.chest) { const c = o.chest; shadow(ctx, c.x, c.y, 7); const img = SPR.chest(c.open); ctx.drawImage(img, Math.round(c.x - img.width / 2), Math.round(c.y - img.height)); }
      else if (o.npc) {
        const n = o.npc;
        shadow(ctx, n.x, n.y, 6);
        const frame = Math.floor(time * 2 + n.bob) % 2 === 0 ? 0 : 0;
        const img = SPR.human('npc' + n.id, n.look, n.dir === 'left' || n.dir === 'right' ? 'side' : n.dir, frame, n.dir === 'left');
        drawSprite(ctx, img, n.x, n.y + 2 - (Math.floor(time * 2 + n.bob) % 2));
      } else if (o.prop) {
        const pr = o.prop;
        if (pr.kind === 'house') ctx.drawImage(SPR.house(pr.v), pr.x, pr.y);
        else if (pr.kind === 'fountain') ctx.drawImage(SPR.fountain(Math.floor(time * 4)), pr.x, pr.y);
        else if (pr.kind === 'sign') ctx.drawImage(SPR.sign(), pr.x, pr.y);
      }
    }

    for (const s of G.shots) drawShot(ctx, s);
    for (const f of G.fx) drawFx(ctx, f);
    R.Season.draw(ctx, camX, camY, G.rdt || 1 / 60);
    for (const n of G.nums) {
      ctx.globalAlpha = Math.min(1, n.life * 3);
      SPR.num(ctx, n.text, n.x, n.y, n.color, n.sc);
      ctx.globalAlpha = 1;
    }

    // 조명 (광산/마계는 어둡게)
    const dark = { mine: 0.6, hell: 0.4, ruins: 0.25, ice: 0.12, forest: 0.18 }[m.theme] || 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (dark) {
      const px = (p.x - camX) * S, py = (p.y - 8 - camY) * S;
      const grd = ctx.createRadialGradient(px, py, 40 * S, px, py, 150 * S);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, `rgba(0,0,0,${dark})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, VW * S, VH * S);
    }
    // 이름표 / 상호작용 표시 (고해상도 텍스트)
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(5.5 * S)}px Galmuri11, "Noto Sans KR", sans-serif`;
    ctx.lineWidth = S * 1.4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(10,8,14,0.9)';
    const label = (text, x, y, color) => {
      const X = (x - camX) * S, Y = (y - camY) * S;
      ctx.strokeText(text, X, Y); ctx.fillStyle = color; ctx.fillText(text, X, Y);
    };
    for (const n of m.npcs) label(n.name, n.x, n.y - 25, '#ffe9a8');
    for (const pr of m.props) if (pr.label && pr.kind === 'house') label(pr.label, pr.x + 32, pr.y + 22, '#ffffff');
    // 몬스터 이름·레벨 (싸우는 중이거나 지정한 적, 정예) — 레벨 차이에 따라 색
    const tgt = G.tap && G.tap.kind === 'mob' ? G.tap.mob : null;
    ctx.font = `${Math.round(4.5 * S)}px Galmuri11, "Noto Sans KR", sans-serif`;
    for (const mob of G.mobs) {
      if (mob.dead || mob.boss || mob.hidden) continue;
      if (!(mob.elite || mob === tgt || mob.ai === 'CHASE' || (G.lastHit && G.lastHit.m === mob))) continue;
      const hb = mob.hp < mob.maxHp ? 6 : 0;
      label(`${mob.elite ? '정예 ' : ''}Lv.${mob.lv} ${mob.def.name}`, mob.x, mob.y - mob.hh * (mob.elite ? 1.2 : 1) * (mob.ss || 1) - 6 - hb - mob.z, mob.elite ? '#ffd060' : R.levelColor(mob.lv - G.save.level));
    }
    // 바닥의 장비 이름 (등급 색)
    for (const d of G.drops) if (d.kind === 'item' && d.t > 0.4) label(d.item.name.replace(/^\S+의 /, ''), d.x, d.y - 11, R.GRADES[d.item.grade].color);
    ctx.font = `${Math.round(5.5 * S)}px Galmuri11, "Noto Sans KR", sans-serif`;
    if (G.interact && !p.dead) {
      const it = G.interact;
      const b = Math.sin(time * 6) * 1.5;
      const X = (it.x - camX) * S, Y = (it.y - (it.h || 28) - camY + b) * S;
      ctx.fillStyle = '#ffe070';
      ctx.beginPath(); ctx.moveTo(X - 7, Y - 8); ctx.lineTo(X + 7, Y - 8); ctx.lineTo(X, Y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#130f18'; ctx.lineWidth = 2; ctx.stroke();
    }
  };
})();
