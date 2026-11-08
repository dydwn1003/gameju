// ===== 장비: 생성 / 착용 / 강화 / 분해 =====
// it = { id, slot, r(등급), ilvl(아이템 레벨), enh(강화), eq(착용자: 'hero' | 'm:<몬스터id>' | null) }
const Gear = (() => {
  const S = () => G.state;

  function baseName(it) {
    if (it.slot === 'weapon') return S().hero ? CLASSES[S().hero.cls].weapon : '무기';
    return GEAR_SLOTS[it.slot].name;
  }
  function name(it) { return `${GEAR_RARITY[it.r].prefix} ${baseName(it)}`; }
  function fullName(it) { return `${name(it)}${it.enh ? ` +${it.enh}` : ''}`; }

  function statsOf(it, enh = it.enh) {
    const sl = GEAR_SLOTS[it.slot];
    const m = GEAR_RARITY[it.r].mul * (1 + 0.06 * (it.ilvl - 1)) * (1 + 0.12 * enh);
    const o = { atk: 0, hp: 0, def: 0 };
    for (const [k, w] of Object.entries(sl.stat)) o[k] = Math.round(GEAR_STAT_UNIT[k] * w * m);
    return o;
  }
  const power = it => Game.power(statsOf(it));

  function icon(it) {
    const key = it.slot === 'weapon' && S().hero ? `gear_weapon_${S().hero.cls}_${it.r}` : `gear_${it.slot}_${it.r}`;
    if (Assets.has(key)) return Assets.raw(key, 'gimg');
    if (it.slot === 'weapon' && S().hero) return { human: '🗡️', fox: '🔮', goblin: '🏏' }[S().hero.cls] || '⚔️';
    return GEAR_SLOTS[it.slot].icon;
  }

  function create(slot, r, ilvl) {
    const s = S();
    s.gearSeq = (s.gearSeq || 0) + 1;
    const it = { id: s.gearSeq, slot, r, ilvl: Math.max(1, Math.round(ilvl)), enh: 0, eq: null };
    s.gear.push(it);
    return it;
  }

  function rollRarity(minIdx = 0) {
    let x = Math.random() * 100, r = 'C';
    for (const k of RARITY_ORDER.slice().reverse()) { x -= GEAR_RARITY[k].rate; if (x <= 0) { r = k; break; } }
    if (RARITY_ORDER.indexOf(r) < minIdx) r = RARITY_ORDER[minIdx];
    return r;
  }

  // 무작위 장비 획득 (가방이 가득 차면 강화석으로 자동 분해)
  function drop(ilvl, minR = 'C') {
    const slots = Object.keys(GEAR_SLOTS);
    const slot = pick(slots);
    const r = rollRarity(RARITY_ORDER.indexOf(minR));
    const it = create(slot, r, ilvl);
    if (S().gear.length > GEAR_BAG_MAX) { disassemble([it.id]); it.auto = true; }
    return it;
  }

  const find = id => S().gear.find(x => x.id === id);
  const ofOwner = owner => S().gear.filter(x => x.eq === owner);
  const inSlot = (owner, slot) => S().gear.find(x => x.eq === owner && x.slot === slot);

  function bonus(owner) {
    const o = { atk: 0, hp: 0, def: 0 };
    for (const it of ofOwner(owner)) { const st = statsOf(it); o.atk += st.atk; o.hp += st.hp; o.def += st.def; }
    return o;
  }

  function canWear(it, owner) {
    const t = GEAR_SLOTS[it.slot].owner;
    return (t === 'hero' && owner === 'hero') || (t === 'mon' && owner.startsWith('m:'));
  }

  function equip(id, owner) {
    const it = find(id);
    if (!it || !canWear(it, owner)) return false;
    const cur = inSlot(owner, it.slot);
    if (cur) cur.eq = null;
    it.eq = owner; // 다른 몬스터가 끼고 있었다면 그대로 옮겨짐
    return true;
  }
  function unequip(id) { const it = find(id); if (it) it.eq = null; }

  // 빈 칸이나 더 강한 장비로 자동 장착
  function autoEquip(owner) {
    const slots = owner === 'hero' ? HERO_SLOTS : MON_SLOTS;
    let n = 0;
    for (const sl of slots) {
      const cur = inSlot(owner, sl);
      const best = S().gear.filter(x => x.slot === sl && (!x.eq || x.eq === owner))
        .sort((a, b) => power(b) - power(a))[0];
      if (best && best !== cur && (!cur || power(best) > power(cur))) { equip(best.id, owner); n++; }
    }
    return n;
  }

  function enhCost(it) {
    const m = GEAR_RARITY[it.r].mul;
    return { gold: Math.round(120 * Math.pow(it.enh + 1, 1.6) * m), ench: Math.ceil((it.enh + 1) * m * 0.8) };
  }

  function enhance(id) {
    const it = find(id), s = S();
    if (!it) return 'none';
    if (it.enh >= GEAR_MAX_ENH) return 'max';
    const c = enhCost(it);
    if (s.gold < c.gold || s.ench < c.ench) return 'nores';
    s.gold -= c.gold; s.ench -= c.ench;
    Game.quest('enhance');
    if (Math.random() * 100 < ENH_RATE[it.enh]) { it.enh++; return 'ok'; }
    return 'fail';
  }

  function disValue(it) { return GEAR_RARITY[it.r].dis + Math.floor(it.enh * it.enh * 0.6); }
  function disassemble(ids) {
    const s = S();
    let total = 0;
    s.gear = s.gear.filter(it => {
      if (!ids.includes(it.id)) return true;
      total += disValue(it);
      return false;
    });
    s.ench += total;
    return total;
  }

  function pull(n) {
    const ilvl = Math.max(1, S().best), res = [];
    for (let i = 0; i < n; i++) {
      const it = create(pick(Object.keys(GEAR_SLOTS)), rollRarity(n >= 10 && i === n - 1 ? 2 : 0), ilvl);
      res.push(it);
    }
    Game.save();
    return res;
  }

  function ownerName(owner) {
    if (!owner) return '';
    if (owner === 'hero') return S().hero ? S().hero.name : '영웅';
    const id = owner.slice(2), o = S().owned[id];
    return o ? LINE_MAP[id].names[1] : '';
  }

  return { name, fullName, statsOf, power, icon, create, drop, find, ofOwner, inSlot, bonus, canWear, equip, unequip, autoEquip,
    enhCost, enhance, disValue, disassemble, pull, ownerName };
})();
