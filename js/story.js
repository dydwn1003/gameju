// 메인 퀘스트(스토리) & 서브 퀘스트 데이터
//  - 메인 퀘스트는 순서대로 이어진다. to = 보고할 NPC. 보고하면 그 NPC가 다음 퀘스트의 intro 를 말하며 맡긴다
//  - type: kill(지역 처치) · killType(특정 몬스터) · boss(지역 보스) · dclear(우두머리 던전 클리어)
//          gather(채집) · talk(to NPC와 대화) · elite(정예 처치) · streak(연속 처치 달성) · shrine(제단 사용) · tower(탑 층 도달)
'use strict';
(function () {
  R.NPC_NAMES = { elder: '촌장 엘든', smith: '대장장이 브론', alchemist: '연금술사 미라', bard: '음유시인 노아', inn: '여관 주인 하나', guild: '길드장 레오', merchant: '수상한 상인 모르', event: '축제 안내원 루루' };

  const D = (did) => R.dungeonById(did);
  const M = (id) => R.MONSTERS[id].name;
  const chief = (did) => R.BOSSES[D(did).boss].name;
  const regionBoss = (r) => R.BOSSES[R.REGIONS[r - 1].boss].name;
  // 보상: 지역 r 의 k 번째(0~4) 퀘스트 기준 레벨로 계산
  function reward(r, k, extra = {}) {
    const rg = R.REGIONS[r - 1], lv = Math.round(rg.lv[0] + ((rg.lv[1] - rg.lv[0]) * k) / 4);
    const big = k === 4;
    return Object.assign({
      exp: Math.round(R.expToNext(lv) * (big ? 1.0 : 0.45)),
      gold: Math.round((60 + lv * 22) * (big ? 3 : 1)),
      mats: { iron: 2 + r, stone: r >= 2 ? r - 1 + (big ? 2 : 0) : big ? 1 : 0, hstone: r >= 4 && big ? r - 3 : 0 },
    }, extra);
  }

  const MQ = [
    // ─── 1지역 · 잊혀진 숲 ───
    { r: 1, to: 'elder', type: 'kill', region: 1, count: 8, title: '숲의 이변',
      desc: '잊혀진 숲에서 몬스터 8마리를 처치하고 촌장 엘든에게 보고하라.',
      intro: ['「균열」이라네. 성좌전쟁 이후 세계 곳곳에 생겨난 틈이지.', '틈에서 몬스터가 쏟아지고 있어. 숲의 몬스터들을 좀 처치해 주겠나?', '남문으로 나가면 잊혀진 숲이라네. 조심하게.'],
      done: ['잘해 주었네! 그런데 이상하군…', '몬스터들이 자네를 공격하기보다 무언가에게서 달아나는 것 같았다고?'] },
    { r: 1, to: 'alchemist', type: 'dclear', did: 12, count: 1, title: '해독제의 재료',
      desc: () => `거미 굴의 ${chief(12)}을(를) 쓰러뜨리고 연금술사 미라에게 가져가라.`,
      intro: () => ['숲에서 돌아온 사람들이 독에 쓰러지고 있다네.', `연금술사 미라가 해독제를 만들려면 ${chief(12)}의 독낭이 필요하다더군.`, '거미 굴을 정리하고 미라에게 가 보게.'],
      done: ['와, 여왕의 독낭! 이걸로 해독제를 만들 수 있어요.', '마을 사람들 대신 고맙다고 할게요!'] },
    { r: 1, to: 'alchemist', type: 'gather', item: 'shroom', count: 4, title: '붉게 빛나는 버섯',
      desc: '던전의 채집 지점에서 야생 버섯 4개를 캐서 미라에게 가져가라.',
      intro: ['하나만 더 부탁해도 될까요?', '해독제를 굳히려면 야생 버섯이 4개 필요해요. 숲 곳곳의 채집 지점에서 캘 수 있어요.'],
      done: ['완벽해요! …어라, 이 버섯들, 안쪽에서 붉은 빛이 나요.', '균열의 기운을 먹고 자란 걸까요? 모험가님 몸의 문양이랑 색이 똑같아요…'] },
    { r: 1, to: 'elder', type: 'dclear', did: 14, count: 1, title: '언덕의 울음소리',
      desc: () => `늑대 언덕의 ${chief(14)}을(를) 쓰러뜨리고 촌장 엘든에게 보고하라.`,
      intro: () => ['아, 맞다! 촌장님이 급히 찾으셨어요.', `${chief(14)}이 무리를 이끌고 마을 쪽으로 내려오고 있대요. 늑대 언덕을 막아 주세요!`],
      done: ['늑대왕이 쓰러졌다니! 마을 사람들이 오늘 밤은 편히 자겠군.', '이제 숲의 가장 깊은 곳, 「숲의 심장」으로 가는 길이 열렸네.'] },
    { r: 1, to: 'elder', type: 'boss', region: 1, count: 1, title: () => `${regionBoss(1)} 토벌`,
      desc: () => `숲의 심장에서 ${regionBoss(1)}을(를) 쓰러뜨려라.`,
      intro: () => [`숲의 심장에는 ${regionBoss(1)}가 잠들어 있다네. 균열이 녀석을 깨운 게야.`, '녀석을 쓰러뜨리면 숲은 다시 조용해질 걸세.'],
      done: () => [`${regionBoss(1)}를 쓰러뜨리다니… 자네는 대체 누구인가.`, '북쪽 폐허 도시에서도 균열의 빛이 보인다는 소식이 왔네.'] },
    // ─── 2지역 · 폐허 도시 ───
    { r: 2, to: 'guild', type: 'talk', count: 1, title: '용병 길드',
      desc: '용병 길드의 길드장 레오를 찾아가라.',
      intro: ['폐허 도시는 숲과는 차원이 다르게 위험하네.', '먼저 용병 길드의 레오를 만나 보게. 폐허 사정은 그가 제일 잘 알지.'],
      done: ['촌장이 보냈나. 마침 잘 됐군.', '폐허 도시에 도적떼가 눌러앉았다. 놈들, 균열 조각을 긁어모으고 있어.'] },
    { r: 2, to: 'guild', type: 'dclear', did: 21, count: 1, title: '도적 두목의 지도',
      desc: () => `무너진 성문의 ${chief(21)}을(를) 쓰러뜨리고 레오에게 보고하라.`,
      intro: () => [`무너진 성문의 ${chief(21)}을(를) 잡아 와라.`, '놈이 가진 물건을 전부 가져오면 보수는 두둑이 쳐 주지.'],
      done: ['두목이 가진 이 지도… 몰락한 왕궁에 표시가 되어 있군.', '도적들도 거기서 뭔가를 찾고 있었어.'] },
    { r: 2, to: 'bard', type: 'killType', target: 'ghost', count: 10, title: '밤마다 우는 망령',
      desc: () => `폐허 도시의 ${M('ghost')} 10마리를 잠재우고 음유시인 노아에게 가라.`,
      intro: ['망령들이 밤마다 울부짖어서 폐허에 아무도 못 들어간다.', '음유시인 노아가 망령에 대해 뭔가 알더군. 10마리쯤 잠재우고 그에게 가 봐.'],
      done: ['망령들의 노래가 멈췄어요…', '그들은 몰락한 왕국의 기사들이에요. 마지막까지 왕을 지키다 죽었죠.'] },
    { r: 2, to: 'bard', type: 'dclear', did: 24, count: 1, title: '첨탑의 기록',
      desc: () => `가고일 첨탑의 ${chief(24)}을(를) 쓰러뜨리고 노아에게 돌아가라.`,
      intro: () => ['첨탑 꼭대기에 왕국의 기록이 남아 있을 거예요.', `하지만 ${chief(24)}이 지키고 있어요. 부탁해요!`],
      done: ['기록에 이렇게 적혀 있네요.', '「붉은 별의 아이가 깨어나면, 쓰러진 기사는 다시 칼을 들리라」…', '붉은 별의 아이… 설마 당신?'] },
    { r: 2, to: 'elder', type: 'boss', region: 2, count: 1, title: () => `${regionBoss(2)} 토벌`,
      desc: () => `몰락한 왕궁에서 ${regionBoss(2)}을(를) 쓰러뜨리고 촌장 엘든에게 보고하라.`,
      intro: () => [`${regionBoss(2)}… 그가 기다리는 건 당신일지도 몰라요.`, '왕궁에 가서 그를 쉬게 해 주세요. 그리고 촌장님께 꼭 알려 주세요.'],
      done: () => [`${regionBoss(2)}가 쓰러지기 전에 자네에게 고개를 숙였다고?`, '…자네의 문양 때문이겠지. 이제 더는 모른 척할 수 없겠군.', '용암 광산 쪽 균열이 커지고 있네. 부탁하네.'] },
    // ─── 3지역 · 용암 광산 ───
    { r: 3, to: 'smith', type: 'talk', count: 1, title: '광부의 아들',
      desc: '대장장이 브론을 찾아가 광산 이야기를 들어라.',
      intro: ['광산 이야기는 대장장이 브론이 잘 알지. 그는 광부 집안 출신이라네.'],
      done: ['광산이라… 내 고향이지. 균열이 생긴 뒤로 다들 떠났어.', '가겠다고? 그럼 그 장비로는 어림도 없다.'] },
    { r: 3, to: 'smith', type: 'gather', item: 'ore', count: 6, title: '대장장이의 선물',
      desc: '던전의 채집 지점에서 광석 6개를 캐서 브론에게 가져가라.',
      intro: ['광석 6개만 캐 와라. 쓸 만한 걸 두드려 주지.', '채집 지점은 반짝이는 돌무더기다. 광산에 널렸어.'],
      done: ['좋은 광석이군. 자, 이건 선물이다. 마음껏 휘둘러.'], reward: { item: { slot: 'weapon', grade: 2 } } },
    { r: 3, to: 'smith', type: 'killType', target: 'golem', count: 8, title: '골렘의 심장',
      desc: () => `용암 광산의 ${M('golem')} 8마리를 부수고 브론에게 보고하라.`,
      intro: () => [`갱도 깊은 곳의 ${M('golem')}들이 옛 대장간을 지키고 있어.`, '8마리만 부숴 줘. 놈들 심장을 보면 뭔가 알 수 있을지도 몰라.'],
      done: ['골렘 심장에 새겨진 이 문양… 잠깐, 네 몸의 것과 똑같잖아?!', '골렘을 만든 자와 너를 만든 자가 같다는 건가…'] },
    { r: 3, to: 'smith', type: 'dclear', did: 34, count: 1, title: '광맥의 주인',
      desc: () => `광맥 심층의 ${chief(34)}을(를) 쓰러뜨리고 브론에게 보고하라.`,
      intro: () => [`광맥 심층의 ${chief(34)}이 모든 골렘을 부리고 있다.`, '그놈을 쓰러뜨리면 골렘들도 멈출 거다.'],
      done: ['해냈군! 이제 「거인의 대장간」으로 가는 길이 열렸다.', '거기엔… 광부들이 「강철 거인」이라 부르던 놈이 있다.'] },
    { r: 3, to: 'elder', type: 'boss', region: 3, count: 1, title: () => `${regionBoss(3)} 토벌`,
      desc: () => `거인의 대장간에서 ${regionBoss(3)}을(를) 쓰러뜨리고 촌장 엘든에게 보고하라.`,
      intro: () => [`${regionBoss(3)}을(를) 쓰러뜨려 줘. 우리 광산을 돌려받고 싶다.`, '끝나면 촌장에게도 알려라. 걱정하고 있을 거다.'],
      done: () => [`${regionBoss(3)}… 성좌전쟁 때 만들어진 마도병기였다더군.`, '…자네처럼 말일세. 미안하네, 진작 말했어야 했는데.', '북쪽 얼어붙은 성에서 피난민들이 내려오고 있네.'] },
    // ─── 4지역 · 얼어붙은 성 ───
    { r: 4, to: 'inn', type: 'talk', count: 1, title: '북쪽의 피난민',
      desc: '여관 주인 하나에게 피난민들의 이야기를 들어라.',
      intro: ['얼어붙은 성에서 피난민이 왔네. 여관의 하나가 돌보고 있지.', '이야기를 들어 보게.'],
      done: ['어서 오세요. 피난민들 말로는…', '성의 왕이 스스로 얼음 속에 자신을 가뒀대요. 그 뒤로 성이 온통 얼어붙었고요.'] },
    { r: 4, to: 'inn', type: 'killType', target: 'ice_wolf', count: 10, title: '피난길 호위',
      desc: () => `얼어붙은 성의 ${M('ice_wolf')} 10마리를 쫓아내고 하나에게 보고하라.`,
      intro: () => ['아직 성에 남은 사람들이 서리 정원을 지나야 해요.', `${M('ice_wolf')}를 10마리만 쫓아 주세요. 부탁이에요!`],
      done: ['덕분에 다들 무사히 도착했어요! 따뜻한 수프라도 드세요.'], reward: { potions: 8 } },
    { r: 4, to: 'alchemist', type: 'dclear', did: 42, count: 1, title: '서리 결정',
      desc: () => `얼음 회랑의 ${chief(42)}을(를) 쓰러뜨리고 미라에게 가라.`,
      intro: () => ['미라가 부탁할 게 있대요.', `얼음 회랑의 ${chief(42)}가 가진 서리 결정이 필요하다나 봐요.`],
      done: ['서리 결정! 이걸로… 어? 결정 안에 누군가의 기억이 비쳐요.'] },
    { r: 4, to: 'alchemist', type: 'gather', item: 'herb', count: 6, title: '기억을 비추는 물약',
      desc: '약초 6개를 캐서 미라에게 가져가라.',
      intro: ['기억을 똑바로 보려면 약초 6개로 달인 물약이 필요해요.'],
      done: ['보여요…', '빙결왕이 백성을 지키려고 균열의 냉기를 온몸으로 막아서는 장면이에요.', '그는 괴물이 된 게 아니라… 아직도 싸우고 있는 거예요.'] },
    { r: 4, to: 'elder', type: 'boss', region: 4, count: 1, title: () => `${regionBoss(4)} 토벌`,
      desc: () => `빙결 옥좌의 ${regionBoss(4)}을(를) 쉬게 하고 촌장 엘든에게 보고하라.`,
      intro: ['빙결왕을 쉬게 해 주세요. 그게 그를 구하는 길이에요.', '촌장님께도 꼭 전해 주세요.'],
      done: () => [`${regionBoss(4)}가 마지막에 뭐라고 했나?`, '「공허의 왕이 문 너머에서 너를 기다린다」라…', '드디어 마지막이군. 마계의 문이 열렸네.'] },
    // ─── 5지역 · 마계의 문 ───
    { r: 5, to: 'merchant', type: 'talk', count: 1, title: '균열을 오가는 자',
      desc: '수상한 상인 모르에게 마계로 가는 길을 물어라.',
      intro: ['수상한 상인 모르… 그는 균열 너머를 오간다는 소문이 있지.', '마계로 가는 길을 물어보게.'],
      done: ['흐흐, 결국 왔군. 「붉은 별의 아이」.', '마계의 문은 네 문양에 반응할 거야. 하지만 그 전에 치울 것들이 있지.'] },
    { r: 5, to: 'merchant', type: 'dclear', did: 51, count: 1, title: '불타는 협곡',
      desc: () => `불타는 협곡의 ${chief(51)}을(를) 쓰러뜨리고 모르에게 보고하라.`,
      intro: () => [`불타는 협곡의 ${chief(51)}가 길을 막고 있어.`, '놈을 치우면 문의 비밀을 알려 주지. 흐흐.'],
      done: ['좋아, 좋아. 약속대로 알려 주지.', '타락천사들이 문의 봉인을 지키고 있어.'] },
    { r: 5, to: 'merchant', type: 'killType', target: 'fallen_angel', count: 10, title: '봉인의 깃털',
      desc: () => `${M('fallen_angel')} 10마리를 쓰러뜨리고 모르에게 가라.`,
      intro: () => [`${M('fallen_angel')} 10마리의 깃털이면 문의 봉인을 느슨하게 할 수 있지.`],
      done: ['흐흐… 사실 말이야, 나도 균열에서 태어났어.', '네가 균열을 닫으면 난 사라지겠지. 그래도 괜찮아. 재밌었거든.'] },
    { r: 5, to: 'guild', type: 'dclear', did: 54, count: 1, title: '흑철 요새',
      desc: () => `흑철 요새의 ${chief(54)}을(를) 쓰러뜨리고 레오에게 보고하라.`,
      intro: ['마지막 관문, 흑철 요새다.', '가기 전에 길드장에게 들러. 그 녀석, 너를 꽤 걱정하더라.'],
      done: ['흑기사단장을 쓰러뜨렸다고? 길드 역사상 최고의 용병이군.', '…돌아와라. 꼭.'] },
    { r: 5, to: 'elder', type: 'boss', region: 5, count: 1, title: () => `${regionBoss(5)} 토벌`,
      desc: () => `공허의 문에서 ${regionBoss(5)}을(를) 쓰러뜨리고 촌장 엘든에게 돌아가라.`,
      intro: ['촌장이 기다린다.', '공허의 왕을 쓰러뜨리고, 네 이야기를 끝내라.'],
      done: [], final: true },
  ];
  const val = (v) => (typeof v === 'function' ? v() : v);
  const k0 = {};
  R.MAIN_QUESTS = MQ.map((q, i) => {
    const k = (k0[q.r] = (k0[q.r] ?? -1) + 1);
    return Object.assign({}, q, {
      id: 'm' + (i + 1), title: val(q.title), desc: val(q.desc), intro: val(q.intro), done: val(q.done),
      giverName: R.NPC_NAMES[q.to], reward: reward(q.r, k, q.reward || {}),
    });
  });
  R.MAIN_FINAL = R.MAIN_QUESTS[R.MAIN_QUESTS.length - 1].id;

  // ─── 서브 퀘스트 (NPC 부탁, 한 번씩) ───
  // need: { lv, region(해금 지역), flag }
  const SQ = [
    { id: 's_elder1', from: 'elder', need: { lv: 2 }, type: 'kill', region: 1, count: 12, title: '마을 순찰',
      desc: '잊혀진 숲에서 몬스터 12마리를 처치하라.', intro: ['요즘 밤마다 숲 쪽에서 소리가 나서 잠을 못 자겠네.', '숲을 한 바퀴 돌며 몬스터를 12마리쯤 정리해 주겠나?'],
      done: ['고맙네! 늙은이가 오늘은 푹 자겠군.'], reward: { gold: 200, potions: 3 } },
    { id: 's_elder2', from: 'elder', need: { region: 2 }, type: 'killType', target: 'bandit', count: 8, title: '빼앗긴 부활석',
      desc: () => `폐허 도시의 ${M('bandit')} 8명을 혼내 주고 촌장에게 보고하라.`, intro: ['도적들이 마을 제단의 부활석을 훔쳐 갔다네!', '폐허 도시의 도적을 혼내 주고 되찾아 오게.'],
      done: ['오오, 되찾아 왔군! 하나는 자네가 가지게.'], reward: { gold: 500, revive: 2 } },
    { id: 's_smith1', from: 'smith', need: { lv: 5 }, type: 'gather', item: 'ore', count: 5, title: '철이 모자라',
      desc: '광석 5개를 캐서 브론에게 가져가라.', intro: ['요즘 강화하러 오는 놈들이 많아서 철이 모자라.', '광석 5개만 캐다 줘. 공짜로 부탁하진 않아.'],
      done: ['이거면 한동안 버티겠군. 받아라, 남는 재료다.'], reward: { gold: 150, mats: { iron: 6, stone: 1 } } },
    { id: 's_smith2', from: 'smith', need: { region: 3 }, type: 'killType', target: 'mine_goblin', count: 10, title: '광산 도둑',
      desc: () => `${M('mine_goblin')} 10마리를 쫓아내라.`, intro: () => [`${M('mine_goblin')} 녀석들이 광부들 곡괭이를 죄다 훔쳐 갔어.`, '10마리만 혼내 줘.'],
      done: ['곡괭이가 돌아왔군! 이건 내가 두드린 투구다.'], reward: { gold: 600, item: { slot: 'helmet', grade: 2 } } },
    { id: 's_smith3', from: 'smith', need: { region: 4 }, type: 'killType', target: 'ice_knight', count: 8, title: '빙결 강철',
      desc: () => `${M('ice_knight')} 8명을 쓰러뜨리고 브론에게 가라.`, intro: () => [`${M('ice_knight')}의 갑옷은 빙결 강철로 되어 있지.`, '8벌만 벗겨 와. 최고급 강화석을 만들어 주마.'],
      done: ['이 차가운 광택… 좋아, 약속대로다.'], reward: { gold: 1200, mats: { hstone: 2, stone: 3 } } },
    { id: 's_alc1', from: 'alchemist', need: { lv: 3 }, type: 'killType', target: 'mushroom', count: 8, title: '독버섯 연구',
      desc: () => `${M('mushroom')} 8마리를 쓰러뜨리고 미라에게 가라.`, intro: () => [`${M('mushroom')}가 뿜는 포자가 궁금해요.`, '8마리만 쓰러뜨려서 포자를 모아 주세요!'],
      done: ['포자 연구 끝! 새 물약이에요, 가져가세요.'], reward: { gold: 150, potions: 4, mpPotions: 4 } },
    { id: 's_alc2', from: 'alchemist', need: { region: 3 }, type: 'killType', target: 'bat', count: 10, title: '박쥐 날개 수프?',
      desc: () => `${M('bat')} 10마리를 쓰러뜨려라.`, intro: () => [`${M('bat')} 날개가 마력 물약에 좋대요.`, '…수프는 아니에요! 10마리 부탁해요.'],
      done: ['고마워요! 이건 보답이에요.'], reward: { gold: 700, mats: { stone: 2 }, mpPotions: 6 } },
    { id: 's_alc3', from: 'alchemist', need: { region: 5 }, type: 'killType', target: 'hellhound', count: 10, title: '지옥불 정수',
      desc: () => `${M('hellhound')} 10마리를 쓰러뜨려라.`, intro: () => [`${M('hellhound')}의 불꽃에서 정수를 뽑을 수 있대요.`, '위험하지만… 10마리 부탁해요.'],
      done: ['지옥불 정수! 이걸 박아 넣은 목걸이예요. 당신 거예요.'], reward: { gold: 1500, item: { slot: 'necklace', grade: 3 } } },
    { id: 's_inn1', from: 'inn', need: { lv: 3 }, type: 'gather', item: 'herb', count: 5, title: '여관의 향신료',
      desc: '약초 5개를 캐서 하나에게 가져가라.', intro: ['손님들 수프에 넣을 약초가 떨어졌어요.', '5개만 캐다 주실래요?'],
      done: ['향긋해라! 이건 특제 도시락이에요. 든든할 거예요.'], reward: { gold: 120, food: 'feast' } },
    { id: 's_inn2', from: 'inn', need: { region: 2 }, type: 'killType', target: 'skeleton', count: 10, title: '돌아오지 않는 손님',
      desc: () => `${M('skeleton')} 10마리를 쓰러뜨려라.`, intro: () => ['폐허로 간 손님이 돌아오지 않아요…', `${M('skeleton')}들이 길을 막고 있대요. 10마리만 부탁해요.`],
      done: ['손님이 무사히 돌아왔어요! 정말 고마워요.'], reward: { gold: 500, potions: 5, revive: 1 } },
    { id: 's_guild1', from: 'guild', need: { lv: 6 }, type: 'elite', count: 3, title: '정예 사냥꾼',
      desc: '던전의 정예 몬스터 3마리를 쓰러뜨려라.', intro: ['금빛 테두리가 있는 정예 몬스터를 봤나?', '3마리를 잡아 와라. 실력을 보자.'],
      done: ['합격이다. 길드의 정식 용병으로 인정하지.'], reward: { gold: 400, gems: 30, coins: 10 } },
    { id: 's_guild2', from: 'guild', need: { lv: 5 }, type: 'killType', target: 'gold_goblin', count: 1, title: '황금을 쫓는 자',
      desc: () => `던전에서 가끔 나타나는 ${M('gold_goblin')}을(를) 잡아라.`, intro: () => [`${M('gold_goblin')}을 본 적 있나? 도망치기 전에 잡으면 대박이지.`, '한 마리만 잡아 와라. 보너스를 주지.'],
      done: ['정말 잡았군! 운도 실력이다.'], reward: { gems: 50, gold: 300 } },
    { id: 's_guild3', from: 'guild', need: { lv: 5 }, type: 'killType', target: 'mimic', count: 1, title: '상자를 조심해',
      desc: () => `던전의 ${M('mimic')}을(를) 한 마리 쓰러뜨려라.`, intro: ['신입들이 상자를 열었다가 물리는 사고가 잦다.', '미믹이 어떻게 생겼는지 직접 확인해 와라. …들썩이는 상자를 조심하고.'],
      done: ['살아 돌아왔군. 이제 신입들 교육은 네가 해라.'], reward: { gems: 40, gold: 300 } },
    { id: 's_guild4', from: 'guild', need: { lv: 10 }, type: 'streak', count: 30, title: '멈추지 않는 칼날',
      desc: '연속 처치 30을 달성하라.', intro: ['쉬지 않고 30마리를 연달아 쓰러뜨릴 수 있나?', '피버 타임을 잘 써 봐라.'],
      done: ['대단하군! 길드에 네 이름을 걸어 두지.'], reward: { gems: 50, coins: 10 } },
    { id: 's_bard1', from: 'bard', need: { flag: 'h1done', region: 2 }, type: 'killType', target: 'ghost', count: 12, title: '원혼의 노래',
      desc: () => `${M('ghost')} 12마리를 잠재워라.`, intro: ['숲의 노래를 완성하니 다른 노래가 들려요.', '폐허의 망령들이 부르는 슬픈 노래예요. 그들을 잠재워 주세요.'],
      done: ['이제 원혼들도 편히 쉬겠네요. 이건 노래의 답례예요.'], reward: { gold: 600, item: { slot: 'earring', grade: 2 } } },
    { id: 's_mer1', from: 'merchant', need: { lv: 5 }, type: 'shrine', count: 3, title: '제단의 속삭임',
      desc: '던전의 축복의 제단을 3번 사용하라.', intro: ['던전의 제단 말이야, 사실 균열의 조각이야. 흐흐.', '3번 만져 보고 와. 네 문양이 어떻게 반응하는지 궁금하거든.'],
      done: ['역시! 네 문양이 제단의 힘을 빨아들이고 있어. 흥미롭군.'], reward: { gems: 40, gold: 300 } },
    { id: 's_mer2', from: 'merchant', need: { region: 3 }, type: 'tower', count: 10, title: '탑의 수집가',
      desc: '심연의 탑 10층에 도달하라.', intro: ['심연의 탑… 거기 10층에 내 물건이 떨어져 있을 거야.', '가져다주면 후하게 쳐 주지.'],
      done: ['오, 이거야 이거! 약속한 보석이다.'], reward: { gems: 100, gold: 1000 } },
  ];
  R.SUB_QUESTS = SQ.map((q) => Object.assign({}, q, { title: val(q.title), desc: val(q.desc), intro: val(q.intro), done: val(q.done), giverName: R.NPC_NAMES[q.from], to: q.from }));

  // ─── 업적 (달성하면 보석, 일부는 칭호) ───
  // v(s) = 현재 값, n = 목표. 기록은 s.rec (처치·보스·연속 처치 등)
  const rec = (k) => (s) => (s.rec && s.rec[k]) || 0;
  const maxEnh = (s) => Math.max(0, ...[...R.SLOTS.map((k) => s.equip[k]), ...s.inv].filter(Boolean).map((it) => it.enh || 0));
  const T = (name, desc, mod, icon, color) => ({ name, desc, mod, icon, color });
  R.ACHIEVEMENTS = [
    { id: 'kill1', name: '첫 걸음', desc: '몬스터를 처음 쓰러뜨린다', v: rec('kills'), n: 1, gems: 10 },
    { id: 'kill100', name: '사냥꾼', desc: '몬스터 100마리 처치', v: rec('kills'), n: 100, gems: 30 },
    { id: 'kill1000', name: '학살자', desc: '몬스터 1000마리 처치', v: rec('kills'), n: 1000, gems: 100, title: T('학살자', '공격력 +3%', { atkPct: 0.03 }, '⚔', '#ff7a5a') },
    { id: 'boss5', name: '우두머리 사냥', desc: '보스·우두머리 5마리 처치', v: rec('bosses'), n: 5, gems: 50 },
    { id: 'boss25', name: '보스 러시', desc: '보스·우두머리 25마리 처치', v: rec('bosses'), n: 25, gems: 120, title: T('거인 살해자', '최대 HP +3%, 공격력 +2%', { hpPct: 0.03, atkPct: 0.02 }, '👑', '#ffb040') },
    { id: 'lv10', name: '견습 모험가', desc: 'Lv.10 달성', v: (s) => s.level, n: 10, gems: 20 },
    { id: 'lv30', name: '숙련 모험가', desc: 'Lv.30 달성', v: (s) => s.level, n: 30, gems: 50 },
    { id: 'lv50', name: '전설의 모험가', desc: 'Lv.50 달성', v: (s) => s.level, n: 50, gems: 150, title: T('전설', '최대 HP +4%, 방어력 +4%', { hpPct: 0.04, defPct: 0.04 }, '🌟', '#ffe070') },
    { id: 'adv', name: '새로운 길', desc: '2차 전직', v: (s) => (s.adv ? 1 : 0), n: 1, gems: 30 },
    { id: 'streak50', name: '멈추지 않는 칼날', desc: '연속 처치 50 달성', v: rec('maxStreak'), n: 50, gems: 50, title: T('폭풍의 칼날', '치명타 +2%', { crit: 0.02 }, '🌪', '#7affc8') },
    { id: 'fever5', name: '피버 중독', desc: '피버 타임 5번', v: rec('fevers'), n: 5, gems: 30 },
    { id: 'goblin3', name: '황금손', desc: '황금 고블린 3마리 처치', v: rec('goblins'), n: 3, gems: 60, title: T('황금손', '이동속도 +4%', { movePct: 0.04 }, '💰', '#ffd35a') },
    { id: 'mimic3', name: '상자 감별사', desc: '미믹 3마리 처치', v: rec('mimics'), n: 3, gems: 50 },
    { id: 'shrine10', name: '축복받은 자', desc: '축복의 제단 10번 사용', v: rec('shrines'), n: 10, gems: 40 },
    { id: 'gather50', name: '채집가', desc: '채집 50회', v: rec('gathers'), n: 50, gems: 30 },
    { id: 'enh7', name: '강화의 맛', desc: '장비를 +7까지 강화', v: maxEnh, n: 7, gems: 50 },
    { id: 'enh10', name: '빛나는 강철', desc: '장비를 +10까지 강화', v: maxEnh, n: 10, gems: 150, title: T('빛나는 강철', '방어력 +4%', { defPct: 0.04 }, '🛡', '#9ad8ff') },
    { id: 'codex20', name: '몬스터 박사', desc: '몬스터 도감 20종 등록', v: (s) => Object.keys(s.codex || {}).length, n: 20, gems: 50 },
    { id: 'rich', name: '부자', desc: '골드 10,000 모으기', v: (s) => s.gold, n: 10000, gems: 30 },
    { id: 'tower20', name: '탑 등반가', desc: '심연의 탑 20층 도달', v: (s) => (s.tower && s.tower.best) || 0, n: 20, gems: 80 },
    { id: 'sub10', name: '마을의 해결사', desc: '서브 퀘스트 10개 완료', v: (s) => Object.keys(s.subDone || {}).length, n: 10, gems: 80, title: T('마을의 해결사', '최대 HP +3%', { hpPct: 0.03 }, '📜', '#b8f0a0') },
    { id: 'story', name: '이름 없는 영웅', desc: '메인 퀘스트 전부 완료', v: (s) => (s.ending ? R.MAIN_QUESTS.length : Math.max(0, (s.mainIdx || 1) - 1)), n: R.MAIN_QUESTS.length, gems: 200, title: T('이름 없는 영웅', '공격력 +3%, 최대 HP +3%', { atkPct: 0.03, hpPct: 0.03 }, '⭐', '#ff9a5a') },
    { id: 'rise', name: '넘어져도 다시', desc: '5번 쓰러지기', v: rec('deaths'), n: 5, gems: 20 },
  ];
})();
