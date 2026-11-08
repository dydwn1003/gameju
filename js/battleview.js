// ===== 전투 화면 렌더링 / 이펙트 =====
const BattleView = (() => {
  // 좌표 = 발 위치(%)
  const ALLY_POS = [[33, 64], [33, 88], [14, 58], [14, 76], [14, 94]];
  const ENEMY_POS = [[67, 64], [67, 88], [86, 58], [86, 76], [86, 94]];
  let layer, field, lastCutin = 0;

  const artOf = u => {
    if (u.hero) return HeroArt.of(G.state.hero, { battle: true });
    const o = { battle: true, base: u.raid ? 2.6 * 21 / 58 : u.boss ? 1.45 * 21 / 34 : 1 };
    return u.enemyId ? Assets.enemy(u.enemyId, u.form, o) : Assets.monster(u.lineId, u.form, o);
  };
  const nameOf = u => (u.hero ? u.name : u.enemyId ? ENEMY_MAP[u.enemyId].n : LINE_MAP[u.lineId].names[u.form]);

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function setScene(elName) {
    field = document.getElementById('field');
    if (field.dataset.el === elName) return;
    field.dataset.el = elName;
    const bg = Assets.bg(elName), img = document.getElementById('bg-img');
    if (bg) { img.style.backgroundImage = `url("${bg}")`; field.classList.add('has-bg'); }
    else field.classList.remove('has-bg');
  }

  function render(B) {
    layer = document.getElementById('units');
    setScene(B.info.el);
    field.dataset.mode = B.mode;
    layer.innerHTML = '';
    B.allies.forEach((u, i) => place(u, ALLY_POS[i]));
    B.enemies.forEach((u, i) => place(u, u.raid ? [74, 92] : u.boss ? [75, 86] : ENEMY_POS[i]));
  }

  function place(u, pos) {
    const cls = `unit ${u.side}${u.hero ? ' hero' : ''}${u.boss ? ' boss' : ''}${u.raid ? ' raid' : ''}${u.alive ? '' : ' dead'}`;
    const d = el(`<div class="${cls}" style="left:${pos[0]}%;top:${pos[1]}%;z-index:${Math.round(pos[1])}">
      ${u.raid ? '' : `<div class="ubar"><div class="hp"><i></i><b></b></div>${u.side === 'ally' ? '<div class="en"><i></i></div>' : ''}</div>`}
      <div class="shadow"></div>
      <div class="sprite"><div class="bob" style="animation-delay:${(-Math.random() * 2).toFixed(2)}s">${artOf(u)}</div></div>
    </div>`);
    u.dom = d;
    layer.appendChild(d);
    bars(u);
  }

  function bars(u) {
    if (u.raid) { UI.raidBar(u); return; }
    if (!u.dom) return;
    u.dom.querySelector('.hp i').style.width = Math.max(0, (u.hp / u.maxHp) * 100) + '%';
    u.dom.querySelector('.hp b').style.width = Math.min(100, (u.shield / u.maxHp) * 100) + '%';
    const en = u.dom.querySelector('.en i');
    if (en) {
      en.style.width = Math.max(0, Math.min(100, u.energy)) + '%';
      u.dom.classList.toggle('ready', u.energy >= 100);
    }
  }

  function retrigger(node, cls) { if (!node) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
  const sprite = u => u.dom && u.dom.querySelector('.sprite');

  // 캐릭터 동작 프레임: 0 서기 · 1 달리기 · 2 공격 · 3 기모으기 · 4 발사 · 5 피격
  function pose(u, seq) {
    const im = u.dom && u.dom.querySelector('img.hero-pose');
    if (!im) return;
    clearTimeout(u._poseT);
    const k = im.dataset.k, step = i => {
      if (i >= seq.length) { im.src = `assets/hero/${k}_p0.png`; u._posing = false; return; }
      im.src = `assets/hero/${k}_p${seq[i][0]}.png`; u._posing = true;
      u._poseT = setTimeout(() => step(i + 1), seq[i][1]);
    };
    step(0);
  }
  function lunge(u) { retrigger(sprite(u), 'atk'); if (u.hero) pose(u, [[2, 380]]); }

  // 유닛 몸통 중앙 좌표 (layer 기준 px)
  function center(u) {
    const lr = layer.getBoundingClientRect(), r = u.dom.querySelector('.sprite').getBoundingClientRect();
    return { x: r.left + r.width / 2 - lr.left, y: r.top + r.height * 0.55 - lr.top };
  }

  function floatText(u, text, cls) {
    if (!u.dom) return;
    const c = center(u);
    const t = el(`<div class="fx ftext ${cls}">${text}</div>`);
    t.style.left = c.x + 'px';
    t.style.top = (c.y - (u.raid ? 60 : 30)) + 'px';
    t.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
    layer.appendChild(t);
    setTimeout(() => t.remove(), 1000);
  }

  function sparks(u, color, n = 7) {
    if (!u.dom) return;
    const c = center(u);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 26;
      const p = el(`<div class="fx spark"></div>`);
      p.style.left = c.x + 'px'; p.style.top = c.y + 'px';
      p.style.setProperty('--tx', Math.cos(a) * d + 'px');
      p.style.setProperty('--ty', Math.sin(a) * d + 'px');
      p.style.background = color;
      layer.appendChild(p);
      setTimeout(() => p.remove(), 500);
    }
  }

  function damage(u, dmg, crit, elem) {
    if (u.hero && !u._posing) pose(u, [[5, 300]]);
    retrigger(sprite(u), 'hit');
    floatText(u, fmt(dmg) + (crit ? '!' : ''), (crit ? 'crit ' : '') + (elem > 1 ? 'eff' : elem < 1 ? 'weak' : ''));
    sparks(u, crit ? '#ffe14a' : '#fff', crit ? 10 : 5);
    Sound.play(crit ? 'crit' : 'hit');
    if (crit && u.raid) retrigger(field, 'shake');
  }

  function healFx(u, amt) { floatText(u, '+' + fmt(amt), 'heal'); if (u.dom) retrigger(u.dom, 'healed'); sparks(u, '#6bff9c', 6); }
  function shield(u) { if (u.dom) retrigger(u.dom, 'shielded'); }

  function die(u, dropCoins) {
    if (!u.dom) return;
    u.dom.classList.add('dead');
    sparks(u, '#ffffff', 12);
    Sound.play('die');
    if (dropCoins) coins(u);
  }

  function coins(u) {
    const c = center(u);
    const target = document.getElementById('c-gold');
    if (!target) return;
    const lr = layer.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const tx = tr.left - lr.left, ty = tr.top - lr.top + 6;
    for (let i = 0; i < 4; i++) {
      const k = el(`<div class="fx coin">${Assets.icon('gold', '💰')}</div>`);
      k.style.left = c.x + 'px'; k.style.top = c.y + 'px';
      layer.appendChild(k);
      const sx = (Math.random() - 0.5) * 60, sy = -20 - Math.random() * 30;
      k.animate([
        { transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 },
        { transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${tx - c.x}px), calc(-50% + ${ty - c.y}px)) scale(.5)`, opacity: 0.6 },
      ], { duration: 800 + i * 90, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
      setTimeout(() => { k.remove(); if (i === 0) { Sound.play('coin'); retrigger(target.parentNode, 'bump'); } }, 800 + i * 90);
    }
  }

  function skill(u, name) {
    retrigger(sprite(u), 'cast');
    if (u.hero) pose(u, [[3, 300], [4, 500]]);
    Sound.play('skill');
    const big = u.side === 'ally' && RARITY_ORDER.indexOf(u.r) >= 3;
    if (big && performance.now() - lastCutin > 3500) { lastCutin = performance.now(); cutin(u, name); }
    else floatText(u, name, 'skillname');
  }

  function cutin(u, name) {
    const c = el(`<div class="fx cutin" data-el="${u.el || 'light'}">
      <div class="ci-art">${u.hero ? HeroArt.of(G.state.hero) : u.enemyId ? Assets.enemy(u.enemyId, u.form) : Assets.monster(u.lineId, u.form)}</div>
      <div class="ci-txt"><small>${nameOf(u)}</small><b>${name}</b></div></div>`);
    layer.appendChild(c);
    setTimeout(() => c.remove(), 1100);
  }

  function beam(a, b) {
    if (!a.dom || !b.dom) return;
    const p = center(a), q = center(b);
    const f = el(`<div class="fx beam" data-el="${a.el || 'light'}"></div>`);
    const len = Math.hypot(q.x - p.x, q.y - p.y), ang = Math.atan2(q.y - p.y, q.x - p.x);
    Object.assign(f.style, { left: p.x + 'px', top: p.y + 'px', width: len + 'px', transform: `rotate(${ang}rad)` });
    layer.appendChild(f);
    setTimeout(() => f.remove(), 450);
  }

  function flash(elName) {
    const f = el(`<div class="fx flash" data-el="${elName}"></div>`);
    layer.appendChild(f);
    retrigger(field, 'shake');
    setTimeout(() => f.remove(), 550);
  }

  function banner(text, r, bad) {
    const rw = r ? `<div class="rw">${Assets.icon('gold', '💰')} ${fmt(r.gold)}${r.gems ? ` &nbsp; ${Assets.icon('gems', '💎')} ${r.gems}` : ''}${r.stones ? ` &nbsp; ${Assets.icon('stones', '🔮')} ${r.stones}` : ''}${r.ench ? ` &nbsp; ${Assets.icon('ench', '🔨')} ${r.ench}` : ''}</div>`
      + (r.item ? `<div class="rw item" style="--rc:${RARITY[r.item.r].color}">${Gear.icon(r.item)} ${r.item.auto ? '가방 가득 → 분해' : Gear.name(r.item)} 획득!</div>` : '') : '';
    const b = el(`<div class="fx banner${bad ? ' bad' : ''}"><div class="bt">${text}</div>${rw}</div>`);
    layer.appendChild(b);
    setTimeout(() => b.remove(), 1500);
  }

  function warning() {
    const w = el(`<div class="fx warning"><div class="stripe"></div><b>WARNING</b><small>강력한 보스가 나타났다!</small><div class="stripe"></div></div>`);
    layer.appendChild(w);
    Sound.play('warning');
    setTimeout(() => w.remove(), 1800);
  }

  function versus(name) {
    const w = el(`<div class="fx versus"><b>VS</b><small>${name}</small></div>`);
    layer.appendChild(w);
    Sound.play('warning');
    setTimeout(() => w.remove(), 1500);
  }

  return { render, bars, lunge, damage, healFx, shield, die, skill, beam, flash, banner, warning, versus, setScene };
})();
