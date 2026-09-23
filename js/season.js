// 시즌 이벤트: 실제 계절에 맞춰 열리는 축제 — 이벤트 재화, 일일 미션, 교환 상점, 한정 칭호, 마을 장식
'use strict';
(function () {
  R.SEASONS = [
    { id: 'spring', name: '벚꽃 축제', icon: '🌸', token: { name: '벚꽃잎', icon: '🌸' }, color: '#ff9ac8', months: [3, 4, 5],
      title: { name: '벚꽃 기사', desc: '최대 HP +5%, 공격력 +3%', mod: { hpPct: 0.05, atkPct: 0.03 } },
      fx: { kind: 'petal', colors: ['#ffc0dc', '#ff9ac8', '#ffe4f0'], rate: 12 }, greet: '루멘에 벚꽃이 흩날리는 계절이에요!' },
    { id: 'summer', name: '한여름 해변 축제', icon: '🏖', token: { name: '조개껍데기', icon: '🐚' }, color: '#5ad8ff', months: [6, 7, 8],
      title: { name: '파도의 용사', desc: '이동속도 +5%, 공격력 +3%', mod: { movePct: 0.05, atkPct: 0.03 } },
      fx: { kind: 'spark', colors: ['#fff8c0', '#ffffff', '#9ae8ff'], rate: 8 }, greet: '뜨거운 여름! 균열 너머 바다에서 조개가 밀려왔대요.' },
    { id: 'autumn', name: '수확제', icon: '🍁', token: { name: '단풍잎', icon: '🍁' }, color: '#ffa04a', months: [9, 10, 11],
      title: { name: '풍요의 수호자', desc: '방어력 +5%, 공격력 +3%', mod: { defPct: 0.05, atkPct: 0.03 } },
      fx: { kind: 'leaf', colors: ['#e8702a', '#d8a030', '#b8401a'], rate: 9 }, greet: '올해도 풍년이에요! 수확제에 오신 걸 환영해요.' },
    { id: 'winter', name: '눈꽃 축제', icon: '❄', token: { name: '눈꽃 결정', icon: '❄' }, color: '#bfe6ff', months: [12, 1, 2],
      title: { name: '서리꽃 방랑자', desc: '치명타 +3%, 공격력 +3%', mod: { crit: 0.03, atkPct: 0.03 } },
      fx: { kind: 'snow', colors: ['#ffffff', '#e8f4ff', '#cfe6ff'], rate: 18 }, greet: '하얀 눈이 소복이! 눈꽃 결정을 모아 오세요.' },
  ];
  // 교환 상점 (시즌마다 구매 횟수 초기화)
  R.SEASON_SHOP = [
    { id: 'gems', name: '보석 50', icon: '💎', cost: 40, limit: 10, give: (s) => { s.gems = (s.gems || 0) + 50; } },
    { id: 'hstone', name: '고급 강화석', icon: '🔷', cost: 30, limit: 5, give: (s) => { s.bag.hstone = (s.bag.hstone || 0) + 1; } },
    { id: 'revive', name: '부활석', icon: '🪨', cost: 20, limit: 5, give: (s) => { s.bag.reviveStone = (s.bag.reviveStone || 0) + 1; } },
    { id: 'feast', name: '모험가 도시락 x2', icon: '🍱', cost: 15, limit: 10, give: (s) => { s.bag.feast = (s.bag.feast || 0) + 2; } },
    { id: 'box', name: '축제 장신구 상자 (영웅)', icon: '🎁', cost: 120, limit: 2, give: (s) => {
      const slot = ['ring', 'necklace', 'earring'][(Math.random() * 3) | 0];
      const it = R.makeItem(slot, Math.max(1, s.level), 3, s.cls, 0.3);
      s.inv.push(it); R.Prog.dexAdd(it);
      R.toast(`🎁 ${it.name} 획득!`, R.GRADES[3].color);
    }, need: (s) => s.inv.length < 40 },
    { id: 'title', name: '시즌 한정 칭호', icon: '🎖', cost: 200, limit: 1, give: (s, se) => { s.titles = s.titles || []; if (!s.titles.includes(se.id)) s.titles.push(se.id); s.title = se.id; } },
  ];
  R.SEASON_MISSION = { kills: 40, reward: { tokens: 30, gems: 50 } };

  const Se = (R.Season = {});
  const S = () => G.save;
  Se.byId = (id) => R.SEASONS.find((x) => x.id === id);
  // 현재 시즌 (실제 날짜 기준; 저장 데이터의 seasonOverride로 테스트 가능)
  Se.current = (date = new Date()) => {
    const s = G.save;
    if (s && s.seasonOverride) return Se.byId(s.seasonOverride);
    const mo = date.getMonth() + 1;
    return R.SEASONS.find((x) => x.months.includes(mo));
  };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const seasonKey = (se) => { const d = new Date(), y = d.getFullYear() - (se.id === 'winter' && d.getMonth() < 2 ? 1 : 0); return `${se.id}-${y}`; };
  // 시즌 상태 (시즌이 바뀌면 재화·구매 기록 초기화, 칭호는 유지)
  Se.state = () => {
    const s = S(), se = Se.current(), key = seasonKey(se);
    if (!s.season || s.season.key !== key) s.season = { key, tokens: 0, bought: {}, total: 0 };
    const st = s.season;
    if (!st.mission || st.mission.day !== today()) st.mission = { day: today(), kills: 0, claimed: false };
    return st;
  };
  Se.addTokens = (n, quiet) => {
    const st = Se.state(), se = Se.current();
    st.tokens += n; st.total += n;
    if (!quiet) R.toast(`${se.token.icon} ${se.token.name} +${n}`, se.color);
  };
  // 몬스터 처치 시 호출 (던전·탑)
  Se.onKill = (m) => {
    if (!G.dungeon || m.summoned) return;
    const st = Se.state(), se = Se.current();
    const n = m.boss ? 10 : m.elite ? 3 : Math.random() < 0.3 ? 1 : 0;
    if (n) { Se.addTokens(n, true); R.addNum(m.x, m.y - m.hh - 12, `${se.token.icon}+${n}`, se.color, 0.8); }
    const ms = st.mission;
    if (!ms.claimed && ms.kills < R.SEASON_MISSION.kills) {
      ms.kills++;
      if (ms.kills === R.SEASON_MISSION.kills) R.toast(`${se.icon} 오늘의 축제 미션 완료! 축제 안내원 루루에게 보상을 받으세요`, se.color);
    }
  };
  Se.claimMission = () => {
    const st = Se.state(), ms = st.mission, rw = R.SEASON_MISSION.reward;
    if (ms.claimed || ms.kills < R.SEASON_MISSION.kills) return false;
    ms.claimed = true;
    Se.addTokens(rw.tokens);
    R.Prog.addGems(rw.gems, '축제 미션');
    R.sfx('levelup');
    R.saveGame();
    return true;
  };
  Se.boughtN = (id) => Se.state().bought[id] || 0;
  Se.canBuy = (it) => { const st = Se.state(); return st.tokens >= it.cost && Se.boughtN(it.id) < it.limit && (!it.need || it.need(S())) && !(it.id === 'title' && (S().titles || []).includes(Se.current().id)); };
  Se.buy = (it) => {
    if (!Se.canBuy(it)) return false;
    const st = Se.state();
    st.tokens -= it.cost;
    st.bought[it.id] = Se.boughtN(it.id) + 1;
    it.give(S(), Se.current());
    if (G.player) R.refreshStats();
    R.sfx('rare');
    R.saveGame();
    return true;
  };
  // 칭호 (장착 시 능력치 보너스)
  Se.titleMod = (s) => { const se = s.title && Se.byId(s.title); return se ? se.title.mod : null; };
  Se.setTitle = (id) => { const s = S(); s.title = s.title === id ? null : id; if (G.player) R.refreshStats(); R.sfx('ui'); };

  // ─── 마을 계절 장식: 꽃잎·낙엽·눈 입자 (월드 좌표) ─────────────
  const parts = [];
  let acc = 0;
  Se.draw = function (g, camX, camY, dt) {
    const m = G.map;
    if (!m || !G.save) return;
    const se = Se.current(), f = se.fx;
    const on = m.kind === 'town' || m.theme === 'forest' || (se.id === 'winter' && m.theme === 'ice');
    if (on) {
      acc += dt * f.rate;
      while (acc > 1) {
        acc--;
        const L = f.kind === 'spark' ? 0.8 : 4 + Math.random() * 3;
        parts.push({ x: camX + Math.random() * (R.VIEW_W + 40) - 20, y: camY - 10 + Math.random() * R.VIEW_H * 0.9, vx: f.kind === 'snow' ? (Math.random() - 0.5) * 8 : -8 - Math.random() * 12, vy: f.kind === 'spark' ? 0 : 18 + Math.random() * 16, ph: Math.random() * 6, life: L, max: L, c: f.colors[(Math.random() * f.colors.length) | 0] });
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i];
      q.life -= dt; q.ph += dt * 3;
      q.x += (q.vx + Math.sin(q.ph) * (f.kind === 'snow' ? 6 : 12)) * dt; q.y += q.vy * dt;
      if (q.life <= 0 || q.y > camY + R.VIEW_H + 10) { parts.splice(i, 1); continue; }
      const x = Math.round(q.x), y = Math.round(q.y);
      g.fillStyle = q.c;
      if (f.kind !== 'spark') g.globalAlpha = Math.min(1, (q.max - q.life) * 2, q.life);
      if (f.kind === 'spark') { g.globalAlpha = Math.sin((q.life / 0.8) * Math.PI); g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); g.globalAlpha = 1; }
      else if (f.kind === 'snow') g.fillRect(x, y, q.ph % 6 < 3 ? 2 : 1, 2);
      else if (f.kind === 'leaf') { g.fillRect(x, y, 2, 1); g.fillRect(x + (Math.sin(q.ph) > 0 ? 1 : 0), y + 1, 2, 1); }
      else { g.fillRect(x, y, Math.sin(q.ph) > 0 ? 2 : 1, 1); g.fillRect(x + 1, y + 1, 1, 1); }
      g.globalAlpha = 1;
    }
    if (parts.length > 160) parts.splice(0, parts.length - 160);
  };
  Se.clearFx = () => { parts.length = 0; };
})();
