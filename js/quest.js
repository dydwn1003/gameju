// 퀘스트 & NPC 대화 스크립트
'use strict';
(function () {
  const Q = (R.Quest = {});
  const say = (...a) => R.UI.say(...a);
  const regionOf = (id) => R.REGIONS[id - 1];

  Q.give = function (def) {
    const s = G.save;
    const q = Object.assign({ p: 0, ready: false }, JSON.parse(JSON.stringify(def)));
    if (q.type === 'boss' && s.cleared[q.region]) { q.p = q.count; q.ready = true; }
    s.quests.push(q);
    R.toast(`퀘스트 수락: ${q.title}`, '#9ad8ff');
    R.sfx('ui');
    R.saveGame();
    return q;
  };
  Q.find = (id) => G.save.quests.find((q) => q.id === id);
  Q.remove = (id) => { G.save.quests = G.save.quests.filter((q) => q.id !== id); };

  Q.onKill = function (m) {
    const s = G.save;
    const rid = G.dungeon ? G.dungeon.region.id : 0;
    for (const q of s.quests) {
      if (q.ready) continue;
      let hit = false;
      if (q.type === 'kill' && q.region === rid && !m.boss) hit = true;
      if (q.type === 'killType' && q.target === m.id) hit = true;
      if (q.type === 'boss' && m.boss && regionOf(q.region).boss === m.id) hit = true;
      if (!hit) continue;
      q.p = Math.min(q.count, q.p + 1);
      if (q.p >= q.count) {
        q.ready = true;
        R.toast(`✔ ${q.title} 완료! ${q.giverName || '의뢰인'}에게 보고하세요`, '#7fffa0');
        R.sfx('rare');
      }
    }
  };

  Q.reward = function (q) {
    const s = G.save, rw = q.reward || {};
    const parts = [];
    if (rw.gold) { s.gold += rw.gold; parts.push(`${rw.gold} 골드`); }
    if (rw.mats) for (const k in rw.mats) if (rw.mats[k]) { s.bag[k] = (s.bag[k] || 0) + rw.mats[k]; parts.push(`${R.MATERIALS[k].name} x${rw.mats[k]}`); }
    if (rw.potions) { s.bag.hpPotion = (s.bag.hpPotion || 0) + rw.potions; parts.push(`빨간 물약 x${rw.potions}`); }
    if (q.id[0] === 'm' && !rw.gems) { s.gems = (s.gems || 0) + 50; parts.push('보석 50'); }
    if (rw.item) {
      const it = R.makeItem(rw.item.slot, Math.max(rw.item.ilvl, s.level), rw.item.grade, s.cls);
      s.inv.push(it); parts.push(it.name);
    }
    if (rw.gems) { s.gems = (s.gems || 0) + rw.gems; parts.push(`보석 ${rw.gems}`); }
    if (rw.coins) { s.coins = (s.coins || 0) + rw.coins; parts.push(`던전 코인 ${rw.coins}`); }
    if (rw.exp) { parts.push(`경험치 ${rw.exp}`); R.gainExp(rw.exp); }
    Q.remove(q.id);
    s.questsDone = (s.questsDone || 0) + 1;
    R.toast(`보상: ${parts.join(', ')}`, '#ffe070');
    R.sfx('levelup');
    R.saveGame();
    return parts.join(', ');
  };

  function mainActive() { return G.save.quests.find((q) => q.id[0] === 'm'); }
  function giveMain() {
    const s = G.save;
    if (s.mainIdx >= R.MAIN_QUESTS.length) return;
    const def = Object.assign({ giverName: '촌장 엘든' }, R.MAIN_QUESTS[s.mainIdx]);
    s.mainIdx++;
    Q.give(def);
  }

  // ─── NPC 스크립트 ────────────────────────────────────
  const N = (R.NPC_TALK = {});
  const favor = (id, d) => { const s = G.save; s.favor[id] = (s.favor[id] || 0) + d; };

  N.elder = function () {
    const s = G.save, name = '촌장 엘든';
    if (!s.flags.metElder) {
      say(name, [
        '오오, 정신이 드는가? 자네는 마을 외곽에 쓰러져 있었다네.',
        '몸에 새겨진 그 붉은 문양… 예사롭지 않군.',
        '그보다 큰일이야. 남쪽 숲 너머에서 이상한 불빛이 보이고 있어.',
      ], [
        { label: '① 무슨 일이죠?', fn: () => { s.flags.metElder = true; favor('elder', 1); say(name, ['「균열」이라네. 성좌전쟁 이후 세계 곳곳에 생겨난 틈이지.', '틈에서 몬스터가 쏟아지고 있어. 숲의 몬스터들을 좀 처치해 주겠나?', '남문으로 나가면 잊혀진 숲이라네. 조심하게.'], null, giveMain); } },
        { label: '② 보상은?', fn: () => { s.flags.metElder = true; s.gold += 100; say(name, ['허허, 당돌하군. 좋아, 선금으로 100골드를 주지.', '숲의 몬스터를 처치해 주게. 남문으로 나가면 된다네.'], null, giveMain); } },
        { label: '③ 관심 없습니다.', fn: () => { favor('elder', -1); say(name, ['…그런가. 기억도 없는 자에게 무리한 부탁이었군.', '마음이 바뀌면 언제든 다시 찾아오게.']); } },
      ]);
      return;
    }
    // 2차 전직
    if (s.level >= 30 && !s.adv) {
      const cls = R.CLASSES[s.cls];
      const [a, b] = cls.adv;
      say(name, ['…자네의 문양이 더욱 붉게 빛나는군.', `${cls.name}의 길은 이제 둘로 갈라진다네. 어느 길을 택하겠나?`], [
        { label: `${R.ADVANCES[a].name} — ${R.ADVANCES[a].desc}`, fn: () => advance(a) },
        { label: `${R.ADVANCES[b].name} — ${R.ADVANCES[b].desc}`, fn: () => advance(b) },
        { label: '조금 더 생각해 볼게요.' },
      ]);
      return;
    }
    const q = mainActive();
    if (q && q.ready) {
      const isFinal = q.id === 'm10';
      const rw = Q.reward(q);
      if (isFinal) { finale(); return; }
      const lines = [`수고했네! 약속한 보상일세.\n(${rw})`];
      if (q.type === 'boss') lines.push(`${R.BOSSES[regionOf(q.region).boss].name}을(를) 쓰러뜨리다니… 자네는 대체 누구인가.`, '새로운 길이 열렸네. 다음 지역으로 가 보게.');
      say(name, lines, null, giveMain);
      return;
    }
    if (q) {
      say(name, [`「${q.title}」\n${q.desc}\n(진행: ${q.p}/${q.count})`, '서두르지 말게. 물약은 연금술사 미라에게 살 수 있다네.']);
      return;
    }
    if (s.mainIdx < R.MAIN_QUESTS.length) { say(name, ['마침 잘 왔네. 부탁할 일이 있어.'], null, giveMain); return; }
    say(name, s.ending ? ['자네 덕분에 루멘은 오늘도 평화롭다네.', '…고맙네, 이름 없는 영웅이여.'] : ['공허의 왕을 쓰러뜨린 자네에게 더 부탁할 것은 없네.']);
  };

  function advance(id) {
    const s = G.save;
    s.adv = id;
    R.refreshStats();
    R.UI.banner(`2차 전직 : ${R.ADVANCES[id].name}`, '#ffb0ff');
    R.sfx('levelup');
    R.saveGame();
    say('촌장 엘든', [`이제 자네는 「${R.ADVANCES[id].name}」일세.\n${R.ADVANCES[id].desc}`]);
  }

  function finale() {
    say('촌장 엘든', [
      '…공허의 왕을 쓰러뜨렸다고? 그렇다면 자네도 알게 되었겠군.',
      '자네 몸의 문양. 그것은 성좌전쟁 때 만들어진 「최초의 마도병기」의 각인이라네.',
      '균열을 만든 것도, 균열을 닫을 수 있는 것도 자네뿐이야.',
      '선택하게. 자네의 이야기의 끝을.',
    ], [
      { label: 'A. 균열을 닫는다', fn: () => R.UI.ending('A') },
      { label: 'B. 균열을 유지한다', fn: () => R.UI.ending('B') },
      { label: 'C. 나를 희생해 세계를 복원한다', fn: () => R.UI.ending('C') },
    ]);
  }

  N.smith = function () {
    say('대장장이 브론', ['어서 오게! 장비를 단단히 해 두면 목숨이 붙어 있지.\n내 강화는 실패해도 부서지거나 단계가 떨어지지 않아. 안심하라고!'], [
      { label: '⚒ 장비 강화', fn: () => R.UI.forge() },
      { label: '🔩 재료 구매', fn: () => R.UI.shop('mats') },
      { label: '그만두기' },
    ]);
  };
  N.alchemist = function () {
    say('연금술사 미라', ['어머, 모험가님! 오늘은 무엇이 필요하세요?'], [
      { label: '🧪 물약 구매', fn: () => R.UI.shop('potions') },
      { label: '💰 장비 판매', fn: () => R.UI.shop('sell') },
      { label: '그만두기' },
    ]);
  };
  N.inn = function () {
    say('여관 주인 하나', ['푹 쉬고 가세요. 루멘 여관은 모험가에게 언제나 무료랍니다.'], [
      { label: '🛏 휴식하기 (HP/MP 회복 + 저장)', fn: () => {
        const p = G.player; p.hp = p.st.maxHp; p.mp = p.st.maxMp; p.status = {};
        R.saveGame(); R.sfx('potion');
        say('여관 주인 하나', ['잘 주무셨나요? 모험 기록도 안전하게 남겨 두었어요.']);
      } },
      { label: '그만두기' },
    ]);
  };

  N.guild = function () {
    const s = G.save, name = '길드장 레오';
    const q = Q.find('guild');
    if (q && q.ready) { const rw = Q.reward(q); s.honor = (s.honor || 0) + 1; say(name, [`의뢰 완료 확인했다. 보수다.\n(${rw})`, '명예 메달도 하나 챙겨 가라. 또 부탁하지.']); return; }
    if (q) { say(name, [`「${q.title}」 진행 중이군. (${q.p}/${q.count})`], [{ label: '의뢰 포기', fn: () => { Q.remove('guild'); R.toast('의뢰를 포기했습니다', '#ff8a8a'); } }, { label: '계속하기' }]); return; }
    const choices = [];
    for (let i = 1; i <= s.unlocked; i++) {
      const rg = regionOf(i);
      choices.push({ label: `[의뢰] ${rg.name} 토벌 (Lv.${rg.lv[0]}~${rg.lv[1]})`, fn: () => Q.give({
        id: 'guild', title: `${rg.name} 토벌 의뢰`, type: 'kill', region: i, count: 15, giverName: name,
        desc: `${rg.name}에서 몬스터 15마리를 처치하라.`,
        reward: { gold: 120 * i * i, exp: Math.round(R.expToNext(rg.lv[0]) * 0.6), gems: 20, coins: 5, mats: { iron: 2 + i, stone: i >= 2 ? 1 : 0, hstone: i >= 5 ? 1 : 0 } },
      }) });
    }
    choices.push({ label: '다음에 올게요.' });
    say(name, ['용병 길드다. 매일 새로운 토벌 의뢰가 들어오지.', '어느 지역을 맡겠나?'], choices);
  };

  const BARD_LORE = [
    '♪ 하늘의 별을 끌어내린 마법사들이여~ 그 대가는 땅의 균열이었네~',
    '성좌전쟁 때 만들어진 무기 중엔 「사람의 모습」을 한 것도 있었다더군요.',
    '빙결왕은 원래 백성을 사랑한 왕이었대요. 균열의 냉기가 그를 바꿔 버렸죠.',
    '마계의 문 너머엔 공허의 왕이 있어요. 그는 차원을 넘나들며 모습을 감춘답니다.',
    '당신의 문양… 옛 노래 속 「붉은 별의 아이」와 닮았네요.',
  ];
  N.bard = function () {
    const s = G.save, name = '음유시인 노아';
    s.flags.bardTalks = (s.flags.bardTalks || 0) + 1;
    const hq = Q.find('h1');
    if (hq && hq.ready) {
      const rw = Q.reward(hq); s.flags.h1done = true; favor('bard', 3);
      say(name, [`늑대들이 조용해졌어요! 이제 숲의 노래를 끝까지 부를 수 있겠네요.\n(${rw})`, '고마워요. 이건 제 할머니의 반지예요. 행운이 함께하길.']);
      return;
    }
    if (hq) { say(name, [`숲의 늑대들… 아직 울고 있어요. (${hq.p}/${hq.count})`]); return; }
    if (s.flags.bardTalks >= 3 && !s.flags.h1done) {
      say(name, ['…사실, 부탁이 하나 있어요.', '잊혀진 숲의 늑대들이 밤마다 울어서 노래를 완성할 수가 없어요.'], [
        { label: '① 제가 도와드릴게요.', fn: () => { favor('bard', 2); Q.give({ id: 'h1', title: '[숨겨진 의뢰] 숲의 노래', type: 'killType', target: 'wolf', count: 6, giverName: name, desc: '잊혀진 숲의 늑대 6마리를 처치하라.', reward: { gold: 300, exp: 400, item: { slot: 'ring', ilvl: 8, grade: 2 } } }); } },
        { label: '② 무슨 노래인데요?', fn: () => { favor('bard', 1); say(name, ['「이름 없는 영웅의 노래」예요. 균열을 닫은 누군가에 대한…', '끝 구절이 비어 있어요. 아무도 결말을 모르거든요.'], null, () => { s.flags.bardTalks = 2; }); } },
        { label: '③ 바빠서요.', fn: () => { favor('bard', -1); say(name, ['아… 네, 그렇죠.']); } },
      ]);
      return;
    }
    say(name, [BARD_LORE[(s.flags.bardTalks - 1) % BARD_LORE.length]]);
  };

  // ─── 보스 처치 ───────────────────────────────────────
  R.onBossKilled = function (m) {
    const s = G.save, rg = G.dungeon.region;
    const first = !s.cleared[rg.id];
    s.cleared[rg.id] = true;
    if (first) R.Prog.addGems(300, `${m.def.name} 첫 토벌`);
    R.UI.bossBar(null);
    R.UI.banner(`${m.def.name} 토벌!`, '#ff9a5a', first ? '대량의 경험치와 전리품을 획득했다' : '');
    R.Audio.playBgm(1 + rg.bgm);
    if (first && rg.id < R.REGIONS.length && s.unlocked < rg.id + 1) {
      s.unlocked = rg.id + 1;
      setTimeout(() => R.toast(`새 지역 해금: ${R.REGIONS[rg.id].name}`, '#ffe070'), 1800);
    }
    if (!G.dungeon.gateOpen) R.openGate();
    R.saveGame();
  };
})();
