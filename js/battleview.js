// ===== 전투 화면 렌더링 / 이펙트 =====
const BattleView = (() => {
  const ALLY_POS = [[33, 34], [33, 74], [15, 20], [15, 54], [15, 88]];
  const ENEMY_POS = [[67, 34], [67, 74], [85, 20], [85, 54], [85, 88]];
  let field;

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function render(B) {
    field = document.getElementById('field');
    field.querySelectorAll('.unit, .fx, .banner').forEach(n => n.remove());
    field.dataset.el = B.info.el;
    B.allies.forEach((u, i) => place(u, ALLY_POS[i]));
    B.enemies.forEach((u, i) => place(u, u.boss ? [76, 52] : ENEMY_POS[i]));
  }

  function place(u, pos) {
    const d = el(`<div class="unit ${u.side}${u.boss ? ' boss' : ''}${u.alive ? '' : ' dead'}" style="left:${pos[0]}%;top:${pos[1]}%">
      <div class="sprite">${Art.creature(u.lineId, u.form)}</div>
      <div class="bars"><div class="hp"><i></i><b></b></div>${u.side === 'ally' ? '<div class="en"><i></i></div>' : ''}</div>
    </div>`);
    u.dom = d;
    field.appendChild(d);
    bars(u);
  }

  function bars(u) {
    if (!u.dom) return;
    const hp = u.dom.querySelector('.hp i');
    hp.style.width = Math.max(0, (u.hp / u.maxHp) * 100) + '%';
    const sh = u.dom.querySelector('.hp b');
    sh.style.width = Math.min(100, (u.shield / u.maxHp) * 100) + '%';
    const en = u.dom.querySelector('.en i');
    if (en) en.style.width = Math.max(0, Math.min(100, u.energy)) + '%';
  }

  function retrigger(node, cls) {
    node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
  }

  function lunge(u) { if (u.dom) retrigger(u.dom.querySelector('.sprite'), 'atk'); }

  function floatText(u, text, cls) {
    if (!u.dom || !field) return;
    const t = el(`<div class="fx ftext ${cls}">${text}</div>`);
    t.style.left = u.dom.style.left;
    t.style.top = `calc(${u.dom.style.top} - 30px)`;
    t.style.setProperty('--dx', (Math.random() * 24 - 12) + 'px');
    field.appendChild(t);
    setTimeout(() => t.remove(), 900);
  }

  function damage(u, dmg, crit, elem) {
    if (u.dom) retrigger(u.dom.querySelector('.sprite'), 'hit');
    floatText(u, fmt(dmg) + (crit ? '!' : ''), (crit ? 'crit ' : '') + (elem > 1 ? 'eff' : elem < 1 ? 'weak' : ''));
  }

  function healFx(u, amt) { floatText(u, '+' + fmt(amt), 'heal'); if (u.dom) retrigger(u.dom, 'healed'); }
  function shield(u) { if (u.dom) retrigger(u.dom, 'shielded'); }

  function die(u) { if (u.dom) u.dom.classList.add('dead'); }

  function skill(u, name) {
    if (!u.dom) return;
    retrigger(u.dom.querySelector('.sprite'), 'cast');
    floatText(u, name, 'skillname');
  }

  function beam(a, b) {
    if (!a.dom || !b.dom) return;
    const f = el(`<div class="fx beam" data-el="${a.el}"></div>`);
    const fr = field.getBoundingClientRect(), ar = a.dom.getBoundingClientRect(), br = b.dom.getBoundingClientRect();
    const x1 = ar.left + ar.width / 2 - fr.left, y1 = ar.top + ar.height / 2 - fr.top;
    const x2 = br.left + br.width / 2 - fr.left, y2 = br.top + br.height / 2 - fr.top;
    const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1);
    Object.assign(f.style, { left: x1 + 'px', top: y1 + 'px', width: len + 'px', transform: `rotate(${ang}rad)` });
    field.appendChild(f);
    setTimeout(() => f.remove(), 450);
  }

  function flash(elName) {
    const f = el(`<div class="fx flash" data-el="${elName}"></div>`);
    field.appendChild(f);
    retrigger(field, 'shake');
    setTimeout(() => f.remove(), 500);
  }

  function banner(text, r, bad) {
    const rw = r ? `<div class="rw">💰 ${fmt(r.gold)} &nbsp; 🍖 ${fmt(r.food)}${r.gems ? ` &nbsp; 💎 ${r.gems}` : ''}${r.stones ? ` &nbsp; 🔮 ${r.stones}` : ''}</div>` : '';
    const b = el(`<div class="banner${bad ? ' bad' : ''}"><div class="bt">${text}</div>${rw}</div>`);
    field.appendChild(b);
    setTimeout(() => b.remove(), 1400);
  }

  return { render, bars, lunge, damage, healFx, shield, die, skill, beam, flash, banner };
})();
