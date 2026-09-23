// 화면 연출: 타이틀 · 직업 선택 · 스토리
//  - 배경 캔버스(별·균열·불씨 입자), 직업 선택 무대(발판·빛줄기·직업별 입자·걷는 캐릭터)
//  - 스토리는 타자기 효과
'use strict';
(function () {
  const UI = R.UI, $ = (id) => document.getElementById(id);
  const SPR = R.SPR, S = R.SCALE;
  const IDS = Object.keys(R.CLASSES);
  const DPR = () => Math.min(2, window.devicePixelRatio || 1);
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function fit(cv) {
    const w = Math.round(cv.clientWidth * DPR()), h = Math.round(cv.clientHeight * DPR());
    if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
    return cv.getContext('2d');
  }

  // ─── 입자 ────────────────────────────────────────────
  function spawn(list, kind, W, H, color) {
    const r = Math.random;
    const base = { x: r() * W, y: H + 10, vx: (r() - 0.5) * 12, vy: -(12 + r() * 26), life: 0, max: 4 + r() * 4, s: 1 + r() * 2, ph: r() * 6, c: color, kind };
    if (kind === 'leaf') Object.assign(base, { y: -10, vy: 16 + r() * 18, vx: -10 - r() * 14 });
    if (kind === 'star') Object.assign(base, { y: r() * H, vy: 0, vx: 0, max: 2 + r() * 3 });
    if (kind === 'smoke') Object.assign(base, { y: H * (0.55 + r() * 0.35), vy: -(6 + r() * 8), s: 6 + r() * 10 });
    list.push(base);
  }
  function drawParts(g, list, dt, W, H, k) {
    for (let i = list.length - 1; i >= 0; i--) {
      const q = list[i];
      q.life += dt; q.ph += dt * 2;
      q.x += (q.vx + Math.sin(q.ph) * 8) * dt * k; q.y += q.vy * dt * k;
      if (q.life > q.max || q.y < -20 || q.y > H + 20) { list.splice(i, 1); continue; }
      const a = Math.sin((q.life / q.max) * Math.PI);
      g.globalAlpha = a * (q.kind === 'smoke' ? 0.18 : q.kind === 'star' ? 0.9 : 0.85);
      g.fillStyle = q.c;
      const s = q.s * k;
      if (q.kind === 'smoke') { g.beginPath(); g.arc(q.x, q.y, s * 2, 0, Math.PI * 2); g.fill(); }
      else if (q.kind === 'leaf') { g.fillRect(q.x, q.y, s * 2, s); g.fillRect(q.x + (Math.sin(q.ph) > 0 ? s : 0), q.y + s, s * 2, s); }
      else if (q.kind === 'spark' || q.kind === 'star') { g.fillRect(q.x - s, q.y, s * 3, s); g.fillRect(q.x, q.y - s, s, s * 3); }
      else g.fillRect(q.x, q.y, s, s);
    }
    g.globalAlpha = 1;
  }

  // ─── 타이틀 ──────────────────────────────────────────
  const tParts = [];
  function drawTitle(t, dt) {
    const cv = $('title-fx'), g = fit(cv), W = cv.width, H = cv.height, k = DPR();
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c0818'); bg.addColorStop(0.5, '#1c1030'); bg.addColorStop(1, '#07050b');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // 하늘의 균열 (보라빛 틈)
    const cx = W * 0.5, cy = H * 0.24, pulse = 0.75 + Math.sin(t * 1.3) * 0.25;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
    rg.addColorStop(0, `rgba(170,90,255,${0.35 * pulse})`); rg.addColorStop(0.4, 'rgba(90,40,160,0.15)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    g.save(); g.translate(cx, cy); g.rotate(-0.25);
    g.fillStyle = `rgba(230,200,255,${0.55 * pulse})`;
    g.beginPath(); g.moveTo(0, -H * 0.16); g.lineTo(W * 0.012, -H * 0.04); g.lineTo(-W * 0.008, H * 0.03); g.lineTo(W * 0.006, H * 0.15); g.lineTo(-W * 0.012, H * 0.02); g.lineTo(W * 0.004, -H * 0.05); g.closePath(); g.fill();
    g.restore();
    // 먼 산 실루엣
    g.fillStyle = '#120b1e';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += W / 24) g.lineTo(x, H * 0.72 - Math.abs(Math.sin(x / W * 7.3 + 1.2)) * H * 0.07 - Math.sin(x / W * 17) * H * 0.012);
    g.lineTo(W, H); g.fill();
    g.fillStyle = '#0a0612';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += W / 30) g.lineTo(x, H * 0.8 - Math.abs(Math.sin(x / W * 5.1 + 3)) * H * 0.05);
    g.lineTo(W, H); g.fill();
    if (Math.random() < dt * 30) spawn(tParts, 'ember', W, H, Math.random() < 0.5 ? '#ffb45a' : '#c890ff');
    if (Math.random() < dt * 6) spawn(tParts, 'star', W, H * 0.6, '#ffffff');
    drawParts(g, tParts, dt, W, H, k);
    // 타이틀 캐릭터: 발판 위에서 숨쉬기 (검투사는 걷기 프레임)
    const art = $('title-art'), ag = art.getContext('2d');
    ag.clearRect(0, 0, art.width, art.height);
    ag.imageSmoothingEnabled = false;
    IDS.forEach((id, i) => {
      const x = 81 + i * 162, y = 236;
      const sh = ag.createRadialGradient(x, y, 2, x, y, 60);
      sh.addColorStop(0, hexA(R.CLASS_META[id].color, 0.45)); sh.addColorStop(1, 'rgba(0,0,0,0)');
      ag.fillStyle = sh; ag.fillRect(x - 70, y - 30, 140, 50);
      ag.fillStyle = 'rgba(0,0,0,0.45)'; ag.beginPath(); ag.ellipse(x, y, 34, 9, 0, 0, Math.PI * 2); ag.fill();
      drawChar(ag, id, x, y, 5, t + i * 0.7, 'idle');
    });
  }

  // 캐릭터 한 명 (프레임 시트가 있으면 걷기/대기 프레임, 없으면 디자인 시트 + 숨쉬기)
  function drawChar(g, id, x, y, px, t, mode, dir = 'down', alpha = 1) {
    const fs = R.Anim.framesOf(id);
    g.save(); g.globalAlpha = alpha;
    if (fs) {
      const row = fs.rows[dir] != null ? fs.rows[dir] : fs.rows.down;
      const seqW = (fs.walk && (fs.walk[dir] || fs.walk.down || fs.walk)) || [0];
      const seqI = (fs.idle && (fs.idle[dir] || fs.idle.down || fs.idle)) || [0];
      const seq = mode === 'walk' ? seqW : seqI;
      const col = seq[Math.floor(t * (mode === 'walk' ? 9 : 1)) % seq.length];
      const w = (fs.fw / fs.scale) * px, h = (fs.fh / fs.scale) * px;
      const bob = mode === 'walk' ? 0 : Math.sin(t * 2.4) * px * 0.35;
      g.drawImage(fs.img, col * fs.fw, row * fs.fh, fs.fw, fs.fh, Math.round(x - w / 2), Math.round(y - h + bob), w, h);
    } else {
      const f = SPR.frame(id);
      if (f) {
        const w = (f.w / S) * px, h = (f.h / S) * px;
        const br = Math.sin(t * 2.4);
        const sy = 1 + br * 0.02, sx = 1 - br * 0.01;
        g.translate(Math.round(x), Math.round(y));
        if (f.face === -1) g.scale(-1, 1);
        g.drawImage(SPR.sheet.img, f.x, f.y, f.w, f.h, -w * sx / 2, -h * sy, w * sx, h * sy);
      }
    }
    g.restore();
  }

  UI.showTitle = function () {
    $('title').classList.remove('hidden');
    $('select').classList.add('hidden');
    $('btn-continue').disabled = !(R.hasSave && R.hasSave());
  };

  // ─── 직업 선택 ───────────────────────────────────────
  let selIdx = 0, swT = 1, swDir = 1;
  const sParts = [];
  UI.selectedClass = () => IDS[selIdx];
  function pick(i, dir) {
    const n = IDS.length;
    selIdx = ((i % n) + n) % n; swT = 0; swDir = dir || 1;
    R.sfx('ui');
    renderSelect();
  }
  function renderSelect() {
    const id = IDS[selIdx], c = R.CLASSES[id], m = R.CLASS_META[id];
    const sel = $('select');
    sel.style.setProperty('--cc', m.color); sel.style.setProperty('--cg', m.glow);
    $('sel-count').textContent = `${selIdx + 1} / ${IDS.length}`;
    $('sel-en').textContent = m.en;
    $('sel-name').textContent = c.name;
    $('sel-tag').textContent = m.tagline;
    const main = c.atkStat.toUpperCase();
    $('sel-chips').innerHTML = m.role.map((r) => `<span>${r}</span>`).join('') +
      `<span>주 능력치 ${main}</span><span class="diff">난이도 ${'★'.repeat(m.diff)}${'☆'.repeat(3 - m.diff)}</span>`;
    const names = { str: '힘', dex: '민첩', int: '지능', vit: '체력', luk: '행운' };
    const maxV = 14;
    $('sel-info').innerHTML = `
      <div class="si-sec"><div class="si-h">기본 능력치</div>
        ${['str', 'dex', 'int', 'vit', 'luk'].map((k) => `<div class="si-stat ${k === c.atkStat ? 'main' : ''}"><span>${k.toUpperCase()}<small>${names[k]}</small></span><div class="si-bar"><i style="width:${(c.base[k] / maxV) * 100}%"></i></div><b>${c.base[k]}</b></div>`).join('')}</div>
      <div class="si-sec"><div class="si-h">대표 스킬</div>
        ${c.skills.map((k) => { const sk = R.SKILLS[k]; return `<div class="si-skill"><div class="si-ico">${sk.icon}</div><div><b>${sk.name}</b><small>${sk.desc}</small></div></div>`; }).join('')}</div>
      <div class="si-sec"><div class="si-h">Lv.30 전직</div><div class="si-advs">
        ${c.adv.map((a) => `<div class="si-adv"><span data-adv="${a}"></span><b>${R.ADVANCES[a].name}</b><small>${R.SKILLS[R.ADV_SKILL[a]].icon} ${R.SKILLS[R.ADV_SKILL[a]].name}</small></div>`).join('')}</div></div>`;
    $('sel-info').querySelectorAll('[data-adv]').forEach((el) => {
      const cv = document.createElement('canvas'); cv.width = 120; cv.height = 110;
      UI.fitSprite(cv.getContext('2d'), el.dataset.adv, null, 120, 110, 4);
      el.replaceWith(cv);
    });
    $('sel-info').scrollTop = 0;
    const tabs = $('sel-tabs');
    tabs.innerHTML = '';
    IDS.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'sel-tab' + (i === selIdx ? ' on' : '');
      b.style.setProperty('--tc', R.CLASS_META[k].color);
      const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
      UI.fitSprite(cv.getContext('2d'), k, null, 96, 110, 4);
      b.appendChild(cv);
      b.insertAdjacentHTML('beforeend', `<span>${R.CLASSES[k].name}</span>`);
      b.onclick = () => { if (i !== selIdx) pick(i, i > selIdx ? 1 : -1); };
      tabs.appendChild(b);
    });
  }
  UI.showSelect = function () {
    $('title').classList.add('hidden');
    $('select').classList.remove('hidden');
    renderSelect();
    swT = 0;
  };
  $('sel-prev').onclick = () => pick(selIdx - 1, -1);
  $('sel-next').onclick = () => pick(selIdx + 1, 1);
  // 무대 스와이프
  let swx = null;
  $('sel-stage-wrap').addEventListener('pointerdown', (e) => { swx = e.clientX; });
  $('sel-stage-wrap').addEventListener('pointerup', (e) => {
    if (swx == null) return;
    const dx = e.clientX - swx; swx = null;
    if (Math.abs(dx) > 40) pick(selIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  const SHOW = [['down', 'walk', 2.6], ['right', 'walk', 1.6], ['down', 'idle', 1.4], ['left', 'walk', 1.6], ['up', 'walk', 1.2]];
  function drawSelect(t, dt) {
    const id = IDS[selIdx], m = R.CLASS_META[id];
    const fx = $('sel-fx'), bgc = fit(fx), BW = fx.width, BH = fx.height;
    const bg = bgc.createLinearGradient(0, 0, 0, BH);
    bg.addColorStop(0, '#0e0a1a'); bg.addColorStop(0.45, hexA(m.color, 0.12)); bg.addColorStop(1, '#07050b');
    bgc.fillStyle = '#0a0712'; bgc.fillRect(0, 0, BW, BH);
    bgc.fillStyle = bg; bgc.fillRect(0, 0, BW, BH);

    const cv = $('sel-stage'), g = fit(cv), W = cv.width, H = cv.height, k = DPR();
    g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false;
    const cx = W / 2, fy = H * 0.86;
    // 뒤쪽 후광 + 회전하는 빛줄기
    const halo = g.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, H * 0.62);
    halo.addColorStop(0, hexA(m.glow, 0.42)); halo.addColorStop(0.45, hexA(m.color, 0.16)); halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.save(); g.translate(cx, H * 0.5); g.rotate(t * 0.12);
    for (let i = 0; i < 10; i++) {
      g.rotate(Math.PI / 5);
      g.fillStyle = hexA(m.glow, 0.05 + 0.03 * Math.sin(t * 1.5 + i));
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-W * 0.05, -H * 0.75); g.lineTo(W * 0.05, -H * 0.75); g.closePath(); g.fill();
    }
    g.restore();
    // 발판: 돌 원반 + 빛나는 룬 고리
    const rx = W * 0.3, ry = rx * 0.26;
    g.fillStyle = '#1a1426'; g.beginPath(); g.ellipse(cx, fy + ry * 0.35, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a2238'; g.beginPath(); g.ellipse(cx, fy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = hexA(m.color, 0.9); g.lineWidth = 2 * k;
    g.beginPath(); g.ellipse(cx, fy, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = t * 0.6 + (i / 12) * Math.PI * 2;
      g.fillStyle = hexA(m.glow, 0.5 + 0.5 * Math.sin(t * 3 + i));
      g.fillRect(cx + Math.cos(a) * rx * 0.72 - 1.5 * k, fy + Math.sin(a) * ry * 0.72 - 1.5 * k, 3 * k, 3 * k);
    }
    const ps = g.createRadialGradient(cx, fy, 0, cx, fy, rx * 0.6);
    ps.addColorStop(0, hexA(m.glow, 0.35)); ps.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ps; g.beginPath(); g.ellipse(cx, fy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); g.fill();
    // 직업별 입자
    const kind = m.fx === 'spark' ? (Math.random() < 0.5 ? 'spark' : 'ember') : m.fx;
    if (Math.random() < dt * (kind === 'smoke' ? 10 : 22)) spawn(sParts, kind, W, H, kind === 'ember' ? (Math.random() < 0.5 ? m.color : '#ffe070') : kind === 'smoke' ? m.color : m.glow);
    drawParts(g, sParts, dt, W, H, k);
    // 캐릭터: 전환 시 옆에서 미끄러져 들어온다
    swT = Math.min(1, swT + dt * 3.2);
    const e = 1 - Math.pow(1 - swT, 3);
    const px = Math.max(3, Math.floor((H * 0.62) / 30));
    let acc = 0, ph = SHOW[0];
    const cyc = SHOW.reduce((a, s) => a + s[2], 0), tt = t % cyc;
    for (const s of SHOW) { if (tt < acc + s[2]) { ph = s; break; } acc += s[2]; }
    const [dir, mode] = R.Anim.framesOf(id) ? ph : ['down', 'idle'];
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(cx, fy, px * 7, px * 2, 0, 0, Math.PI * 2); g.fill();
    drawChar(g, id, cx + (1 - e) * swDir * W * 0.25, fy + px, px, t, mode, dir, e);
    if (swT < 0.35) { g.fillStyle = `rgba(255,255,255,${(0.35 - swT) * 1.2})`; g.fillRect(0, 0, W, H); }
  }

  // ─── 스토리 (타자기) ─────────────────────────────────
  const stParts = [];
  let story = null;
  UI.story = function (lines, done) {
    const el = $('story');
    G.state = 'story';
    el.classList.remove('hidden');
    story = { lines, i: 0, shown: 0, done };
    $('story-dots').innerHTML = lines.map(() => '<i></i>').join('');
    showLine();
    el.onclick = () => {
      R.sfx('ui');
      const cur = story.lines[story.i];
      if (story.shown < cur.length) { story.shown = cur.length; return; }  // 먼저 한 줄을 끝까지
      story.i++;
      if (story.i >= story.lines.length) { el.classList.add('hidden'); el.onclick = null; const d = story.done; story = null; d && d(); }
      else showLine();
    };
  };
  function showLine() {
    story.shown = 0;
    const t = $('story-text');
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    [...$('story-dots').children].forEach((d, i) => d.classList.toggle('on', i <= story.i));
  }
  function drawStory(t, dt) {
    const cv = $('story-fx'), g = fit(cv), W = cv.width, H = cv.height, k = DPR();
    const bg = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, H * 0.8);
    bg.addColorStop(0, '#1e1432'); bg.addColorStop(1, '#050308');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (Math.random() < dt * 14) spawn(stParts, 'ember', W, H, Math.random() < 0.6 ? '#c890ff' : '#ffb45a');
    drawParts(g, stParts, dt, W, H, k);
    if (story) {
      const cur = story.lines[story.i];
      if (story.shown < cur.length) {
        const before = Math.floor(story.shown);
        story.shown = Math.min(cur.length, story.shown + dt * 26);
        if (Math.floor(story.shown) !== before) $('story-text').textContent = cur.slice(0, Math.floor(story.shown));
        if (Math.floor(story.shown) % 3 === 0 && Math.floor(story.shown) !== before && cur[before] !== ' ') R.sfx('tick');
      } else if ($('story-text').textContent !== cur) $('story-text').textContent = cur;
    }
  }

  // ─── 루프 ────────────────────────────────────────────
  let last = performance.now(), T = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    if (!$('title').classList.contains('hidden')) drawTitle(T, dt);
    if (!$('select').classList.contains('hidden')) drawSelect(T, dt);
    if (!$('story').classList.contains('hidden')) drawStory(T, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 맵 전환 페이드
  R.UI.fade = function () {
    const f = $('fade');
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  };
})();
