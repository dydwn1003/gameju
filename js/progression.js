// 성장 시스템: 스킬 레벨·룬, 재화, 장비 소환(천장), 장비 도감, 세트 효과
'use strict';
(function () {
  const P = (R.Prog = {});
  const S = () => G.save;

  // ─── 재화 ──────────────────────────────────────────────
  P.addGems = (n, why) => { S().gems = (S().gems || 0) + n; if (why) R.toast(`💎 보석 +${n} · ${why}`, '#9ad8ff'); };
  P.addCoins = (n, quiet) => { S().coins = (S().coins || 0) + n; if (!quiet) R.toast(`🪙 던전 코인 +${n}`, '#ffd35a'); };

  // ─── 스킬 레벨 & 룬 ────────────────────────────────────
  P.skillLv = (id) => (S().skillLv && S().skillLv[id]) || 1;
  P.runeState = (id) => {
    const s = S();
    s.runes = s.runes || {};
    return (s.runes[id] = s.runes[id] || { owned: [false, false, false], eq: -1 });
  };
  // 스킬 최종 보정: 레벨 + 장착 룬
  P.skillMod = (id) => {
    const lv = R.skillLevelMod(P.skillLv(id));
    const m = { dmg: lv.dmg, aoe: lv.aoe, cdMul: lv.cdMul, extra: 0, stunAdd: 0, dist: 1, status: null };
    const rs = P.runeState(id);
    if (rs.eq >= 0) {
      const r = R.RUNES[id][rs.eq].mod;
      if (r.dmg) m.dmg *= r.dmg;
      if (r.aoe) m.aoe *= r.aoe;
      if (r.cdMul) m.cdMul *= r.cdMul;
      if (r.extra) m.extra += r.extra;
      if (r.stunAdd) m.stunAdd += r.stunAdd;
      if (r.dist) m.dist *= r.dist;
      if (r.status) m.status = r.status;
    }
    return m;
  };
  P.skillUpCost = (id) => P.skillLv(id);
  P.levelUpSkill = (id) => {
    const s = S(), lv = P.skillLv(id), cost = P.skillUpCost(id);
    if (lv >= R.SKILL_MAX || (s.sp || 0) < cost) return false;
    s.sp -= cost;
    s.skillLv = s.skillLv || {};
    s.skillLv[id] = lv + 1;
    R.sfx('enhance_ok');
    return true;
  };
  P.buyRune = (id, i) => {
    const s = S(), rs = P.runeState(id);
    if (rs.owned[i]) return false;
    if ((s.coins || 0) < R.RUNE_COST) return false;
    s.coins -= R.RUNE_COST;
    rs.owned[i] = true;
    rs.eq = i;
    R.sfx('rare');
    return true;
  };
  P.equipRune = (id, i) => {
    const rs = P.runeState(id);
    if (!rs.owned[i]) return false;
    rs.eq = rs.eq === i ? -1 : i;
    R.sfx('ui');
    return true;
  };

  // ─── 장비 도감 ─────────────────────────────────────────
  const tierOf = (it) => Math.max(0, Math.min(4, Math.floor((it.ilvl - 1) / 10)));
  P.dexKey = (it) => `${it.wtype || it.slot}:${tierOf(it)}`;
  P.dexAdd = (it) => {
    const s = S();
    s.itemDex = s.itemDex || {};
    const k = P.dexKey(it);
    if (s.itemDex[k]) return;
    s.itemDex[k] = Math.max(s.itemDex[k] || 0, it.grade + 1);
    const before = Math.floor((P.dexCount() - 1) / R.DEX_STEP), after = Math.floor(P.dexCount() / R.DEX_STEP);
    R.toast(`📖 장비 도감 등록: ${it.name.replace(/^\S+의 /, '')}`, '#e8d8a8');
    if (after > before) { R.toast(`도감 보너스! 공격력·최대 HP +${after}%`, '#ffe070'); if (G.player) R.refreshStats(); }
  };
  P.dexCount = () => Object.keys(S().itemDex || {}).length;
  P.dexEntries = () => {
    const cls = R.CLASSES[S().cls];
    const bases = [cls.weapon, ...R.SLOTS.slice(1)];
    const out = [];
    for (const b of bases) for (let t = 0; t < 5; t++) out.push({ base: b, tier: t, key: `${b}:${t}`, name: R.ITEM_NAMES[b][t], slot: b === cls.weapon ? 'weapon' : b });
    return out;
  };
  P.dexBonus = () => Math.floor(P.dexCount() / R.DEX_STEP) / 100;

  // ─── 세트 ──────────────────────────────────────────────
  P.setCounts = (equip) => {
    const c = {};
    for (const k of R.SET_SLOTS) { const it = equip[k]; if (it && it.set != null) c[it.set] = (c[it.set] || 0) + 1; }
    return c;
  };
  P.setMods = (equip) => {
    const mods = {};
    const c = P.setCounts(equip);
    for (const si in c) {
      const set = R.SETS[si];
      for (const need of [2, 4, 6]) if (c[si] >= need) for (const k in set.bonus[need]) mods[k] = (mods[k] || 0) + set.bonus[need][k];
    }
    return mods;
  };

  // ─── 장비 소환 (천장 80회) ─────────────────────────────
  function rollSummonGrade() {
    const r = Math.random(), rt = R.SUMMON.rates;
    let acc = 0;
    for (let g = 4; g >= 0; g--) { acc += rt[g]; if (r < acc) return g; }
    return 0;
  }
  P.summon = (n) => {
    const s = S();
    const cost = n >= 10 ? R.SUMMON.cost10 : R.SUMMON.cost1;
    if ((s.gems || 0) < cost) return { error: `보석이 부족합니다 (${cost} 필요)` };
    if (s.inv.length + n > 40) return { error: `가방 공간이 부족합니다 (${n}칸 필요)` };
    s.gems -= cost;
    const got = [];
    for (let i = 0; i < n; i++) {
      s.pity = (s.pity || 0) + 1;
      let g = rollSummonGrade();
      if (s.pity >= R.SUMMON.pity) g = 4;
      if (g === 4) s.pity = 0;
      got.push(g);
    }
    if (n >= 10 && !got.some((g) => g >= 2)) got[got.length - 1] = 2; // 10회: 희귀 이상 1개 보장
    const items = got.map((g) => {
      const slot = R.SLOTS[(Math.random() * R.SLOTS.length) | 0];
      const it = R.makeItem(slot, Math.max(1, s.level), g, s.cls, g >= 2 ? 0.35 : 0);
      s.inv.push(it);
      P.dexAdd(it);
      return it;
    });
    s.summons = (s.summons || 0) + n;
    R.saveGame();
    return { items };
  };
})();
