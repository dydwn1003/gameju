// ===== 메인 스토리 「빈칸의 이름」: 장별 대화 + 순서대로 깨는 퀘스트 + 기억 조각 =====
// 이름 없는 신입 차사가 사라지는 명부의 비밀을 쫓다가, 자신이 왜 저승사자가 됐는지 알게 되는 이야기.
// 개그(강림·졸개·도깨비) · 감동(주모·뱃사공·동생) · 공포(백귀야행·묵 판관)를 장마다 섞었다.
const SPEAKERS = { me: '{name}', gangrim: '강림 차사', jumo: '주모', elder: '게시판 할아버지', gob: '도깨비 상인', boat: '뱃사공', yeomra: '염라대왕', wraith: '원귀',
  judge: '판관 나리', minion: '졸개 차사', muk: '묵(墨) 판관', sib: '동생', kkachi: '까치', narr: '' };
// k: 확인할 것 (cnt.* 누적 횟수, lv 레벨, rank 직급, pen 필력, minion 졸개, dex 도감, pets 펫 종류, clue 지도 위 단서, reborn 윤회, rankNow 이번 생 직급)
// mem: 장을 끝내면 얻는 기억 조각
const STORY = [
  { title: '첫 근무', intro: [
      ['gangrim', '어이, 신입! 오늘부터 이승 마을을 맡게 된 {name}이지?'],
      ['me', '네! 수습 차사 {name}, 첫 근무 나왔습니다!'],
      ['gangrim', '나는 강림. 저승에서 제일 바쁘고, 제일 잘생긴 차사지.'],
      ['me', '…앞에 건 알겠는데 뒤에 건 잘 모르겠네요.'],
      ['gangrim', '크흠. 아무튼! 떠도는 혼을 명부에 거둬 저승으로 보내는 게 우리 일이다. 혼령이 보이면 톡 건드려!']],
    quests: [
      { t: '혼령 100개 거두기', k: 'cnt.soul', n: 100, r: { jade: 20 } },
      { t: '혼령을 직접 터치해서 10번 거두기', k: 'cnt.tap', n: 10, r: { jade: 20 } },
      { t: '명부 필력 Lv.1 달성', k: 'pen', n: 1, r: { hours: 0.35 } },
      { t: '차사 레벨 8 달성', k: 'lv', n: 8, r: { jade: 30 } }],
    outro: [['me', '선배, 명부 첫 장에… 제 이름 칸만 비어 있어요.'],
      ['gangrim', '…인쇄가 덜 됐나 보지. 저승 인쇄소가 원래 그래. 하하… 하.'],
      ['narr', '강림 선배는 웃었지만, 눈은 웃고 있지 않았다.']],
    mem: { t: '빈칸', d: '명부의 모든 혼에는 이름이 있다. 단 하나, 내 이름이 적혀야 할 자리만 하얗게 비어 있다.' } },
  { title: '졸개를 거느리다', intro: [
      ['gangrim', '혼자선 금방 지친다. 졸개 차사를 들이자. 품삯만 주면 부지런히 일하지.'],
      ['minion', '안녕하십니까 나리! 품삯은… 혹시 떡으로 주시면 안 됩니까? 꿀떡이면 더 좋고요!'],
      ['me', '떡…?'],
      ['gangrim', '신경 쓰지 마. 그리고 원한 깊은 혼, 원귀가 나타나면 연타로 퇴치해!']],
    quests: [
      { t: '졸개 차사 1명 고용하기', k: 'minion', n: 1, r: { jade: 30 } },
      { t: '원귀 1마리 퇴치하기', k: 'cnt.wraith', n: 1, r: { jade: 30 } },
      { t: '원귀가 떨어뜨린 종이 조각 찾기 (지도의 ✦)', k: 'clue', n: 1, r: { jade: 30 } },
      { t: '차사 레벨 18 달성', k: 'lv', n: 18, r: { ticket: 1 } }],
    outro: [['wraith', '내 이름… 누가… 명부에서 내 이름을 지웠어…'],
      ['narr', '주운 종이 조각에 검은 먹물이 번져 있다. 이름 하나가 통째로 지워진 흔적이다.'],
      ['gangrim', '…이건 판관 나리께 보고해야겠다.']],
    mem: { t: '낡은 짚신 한 짝', d: '먹물 조각을 쥐자 손바닥이 따끔했다. 작은 짚신 한 짝, 그리고 누군가의 손을 꼭 잡고 달리던 감각.' } },
  { title: '첫 승진', intro: [
      ['judge', '네가 강림이 데려온 신입이냐. 지워진 명부라… 흠, 그건 내가 조사하마.'],
      ['judge', '그보다 너! 레벨이 차면 승진이다. 저승은 실적으로 말한다!'],
      ['narr', '판관 나리의 수염이 말할 때마다 파르르 떨린다…'],
      ['me', '(웃으면 안 돼… 웃으면 안 돼…)']],
    quests: [
      { t: '말단 차사로 승진하기', k: 'rank', n: 1, r: { jade: 50, ticket: 1 } }],
    outro: [['judge', '축하한다, 말단 차사. 붉은 띠가 제법이구나. 승진할수록 집무실도 넓어질 게다.'],
      ['gangrim', '이제 너도 어엿한 차사다. 배고프면 주막에 가 봐. 주모 국밥이 저승 최고지.']] },
  { title: '주막의 비밀', intro: [
      ['jumo', '어서 오시게. 자네가 그 신입이구먼… 얼굴 보니 알겠네.'],
      ['me', '저를 아세요?'],
      ['jumo', '저승에 오는 혼은 다 내 망각탕을 한 사발씩 마시고 가지. 자네도 그랬다네. 아주… 서럽게 울면서.'],
      ['jumo', '아픈 기억은 묻어 두는 게 나아. 그래도 찾고 싶거든 꽃을 가져오게. 탕약을 달이며 조금씩 돌려주지.']],
    quests: [
      { t: '꽃밭에서 꽃 1번 수확하기', k: 'cnt.harvest', n: 1, r: { jade: 30 } },
      { t: '주막에서 탕약 1번 달이기', k: 'cnt.brew', n: 1, r: { jade: 30 } },
      { t: '꽃밭 근처에 묻힌 붉은 머리끈 찾기 (지도의 ✦)', k: 'clue', n: 1, r: { jade: 40 } },
      { t: '졸개를 파견 보내기 1번', k: 'cnt.send', n: 1, r: { hours: 0.7 } },
      { t: '혼령 5,000개 거두기', k: 'cnt.soul', n: 5000, r: { ticket: 1 } }],
    outro: [['jumo', '그 머리끈… 자네 소매에서 떨어진 걸 내가 꽃밭에 묻어 두었지.'],
      ['me', '왜 이렇게… 가슴이 아프죠.'],
      ['jumo', '자네가 아직 누군가를 기다린다는 뜻일세.']],
    mem: { t: '붉은 머리끈', d: '늘 붉은 머리끈을 매던 작은 아이. "{name}, 같이 가!" 그 목소리가 귓가에 맴돈다.' } },
  { title: '저승 장터의 도깨비', intro: [
      ['gob', '헤헤헤! 차사 나리! 오늘의 특가! 찢어진 명부 한 장, 단돈 옥 0개!'],
      ['me', '공짜잖아요.'],
      ['gob', '사실 들고 있으면 밤마다 누가 "돌려줘…" 하고 속삭여서. 헤헤… 가져가 줘, 제발.'],
      ['gob', '아, 영물 소환권은 진짜 유료야! 황룡 나오면 나한테도 자랑해!'],
      ['gob', '그리고 이 동네 물건들 함부로 지나치지 마. 나무, 항아리, 장승… 다 뭔가 숨기고 있다고, 헤헤.']],
    quests: [
      { t: '차사로 승진하기', k: 'rank', n: 2, r: { jade: 60 } },
      { t: '영물(펫) 1마리 데려오기', k: 'pets', n: 1, r: { ticket: 2 } },
      { t: '지도의 나무·소품 5번 살펴보기', k: 'cnt.prop', n: 5, r: { jade: 40 } },
      { t: '혼령 도감 1종 등록하기', k: 'dex', n: 1, r: { jade: 50 } }],
    outro: [['narr', '찢어진 명부에 이름이 수십 개 지워져 있다. 먹물에서 비릿한 쇠 냄새가 난다.'],
      ['gob', '그 먹물… 지옥 쪽 판관들이 쓰는 거야. 난 아무 말도 안 했다? 헤헤.']],
    mem: { t: '장맛비', d: '그해 여름, 장맛비가 열흘이나 내렸다. 개울물이 마을 길까지 넘쳐 올랐다.' } },
  { title: '백귀야행의 밤', intro: [
      ['elder', '젊은이, 오늘 밤엔 바깥에 나오지 말게. 백귀야행이 지나가네.'],
      ['elder', '근데 요즘 행렬이 이상해. 귀신들이 줄을 지어 어딘가로… 끌려가는 것 같거든.'],
      ['wraith', '묵(墨) 판관님께… 바칠… 혼이다… 비켜라… 차사…'],
      ['me', '묵 판관…?']],
    quests: [
      { t: '백귀야행 1번 겪기', k: 'cnt.parade', n: 1, r: { jade: 60 } },
      { t: '원귀 10마리 퇴치하기', k: 'cnt.wraith', n: 10, r: { ticket: 1 } },
      { t: '행렬이 지나간 자리의 먹물 자국 찾기 (지도의 ✦)', k: 'clue', n: 1, r: { jade: 60 } },
      { t: '선임 차사로 승진하기', k: 'rank', n: 3, r: { jade: 80, ticket: 1 } }],
    outro: [['gangrim', '묵 판관. 수백 년 전 염라대왕께 반기를 들었다가 쫓겨난 자다. 아직 남아 있었다니.'],
      ['gangrim', '{name}, 이 일에서 손 떼. …너한테는 특히 위험해.'],
      ['me', '저한테 특히요? 왜요?'],
      ['gangrim', '……']],
    mem: { t: '불어난 개울', d: '흙탕물 속으로 작은 손이 미끄러졌다. 생각할 틈도 없이 나는 물속으로 뛰어들었다.' } },
  { title: '삼도천을 건너', intro: [
      ['boat', '삼도천 나룻배요~ 혼 하나에 한 번씩 건너 드립니다~'],
      ['boat', '…어라, 나리. 그 얼굴 기억나요. 옛날에 배를 안 타겠다고 버티던 혼이 있었는데.'],
      ['boat', '"동생이 올 때까지 여기서 기다릴래요" 하고는 강가에 주저앉아 꼼짝을 안 했지요. 그게 나리였어요.'],
      ['me', '제가… 동생을요?']],
    quests: [
      { t: '차사장으로 승진하기', k: 'rank', n: 4, r: { jade: 100 } },
      { t: '졸개 파견 5번 보내기', k: 'cnt.send', n: 5, r: { ticket: 1 } },
      { t: '강가로 떠내려온 짚신 한 짝 찾기 (지도의 ✦)', k: 'clue', n: 1, r: { jade: 80 } },
      { t: '꽃 10번 수확하기', k: 'cnt.harvest', n: 10, r: { hours: 1.5 } },
      { t: '졸개 차사 10명 거느리기', k: 'minion', n: 10, r: { ticket: 2 } }],
    outro: [['boat', '결국 강림 나리가 와서 한참 이야기하더니, 나리는 배를 안 타고 차사가 됐지요. 대신 무언가를 내려놓고요.'],
      ['me', '무엇을요?'],
      ['boat', '그건… 강림 나리께 직접 들으세요.']],
    mem: { t: '둑 위로', d: '있는 힘을 다해 동생을 둑 위로 밀어 올렸다. 동생이 울며 손을 뻗었지만, 나는 그 손을 잡지 못했다.' } },
  { title: '망각의 들판', intro: [
      ['gangrim', '…알아 버렸구나. 그래. 네 혼을 데리러 간 차사가 나였다.'],
      ['gangrim', '넌 동생을 구하고 물에 빠졌어. 저승에 와서도 동생을 기다리겠다며 윤회를 거부했지.'],
      ['gangrim', '염라대왕께서 조건을 거셨다. 이름을 내려놓고 차사로 일하면, 동생이 올 때 마중 나갈 수 있게 해 주겠다고.'],
      ['me', '그래서… 명부에 제 이름이 없었던 거군요.'],
      ['gangrim', '말 못 해서 미안하다. 기억을 되찾으면 네가 아파할까 봐.']],
    quests: [
      { t: '판관으로 승진하기', k: 'rank', n: 5, r: { jade: 120, ticket: 1 } },
      { t: '집무실에서 망자 심판 10번 하기', k: 'cnt.judge', n: 10, r: { jade: 80 } },
      { t: '혼령 도감 6종 등록하기', k: 'dex', n: 6, r: { ticket: 2 } },
      { t: '영물 5종 모으기', k: 'pets', n: 5, r: { jade: 100 } }],
    outro: [['me', '선배. 제 동생은… 지금 어디 있어요?'],
      ['gangrim', '얼마 전 이승의 삶을 마쳤다. 아흔 해, 아주 긴 삶이었지. 그런데… 저승에 도착하지 않았다.'],
      ['gangrim', '명부에서 이름이 지워졌어. 묵 판관 짓이다.']],
    mem: { t: '검은 갓의 손', d: '물속에서 마지막으로 본 것은 검은 갓을 쓴 차사의 손이었다. 그 손은 이상하게 따뜻했다.' } },
  { title: '지옥의 불길', intro: [
      ['muk', '크크크… 이름 없는 차사가 여기까지 왔구나.'],
      ['muk', '미련이 깊은 혼일수록 좋은 원귀가 되지. 네 동생은 아흔 해 동안 너를 그리워했다. 최고의 재료야.'],
      ['me', '내 동생을 돌려줘!'],
      ['muk', '와서 가져가 보거라. 판관 나부랭이가 감당할 수 있다면!'],
      ['gangrim', '{name}! 혼불주 마시고 따라와! 이번엔 나도 같이 간다!']],
    quests: [
      { t: '명부 판관으로 승진하기', k: 'rank', n: 6, r: { jade: 150 } },
      { t: '원귀 50마리 퇴치하기', k: 'cnt.wraith', n: 50, r: { ticket: 2 } },
      { t: '지옥 가마솥 속 동생의 흔적 찾기 (지도의 ✦)', k: 'clue', n: 1, r: { jade: 120 } },
      { t: '백귀야행 5번 겪기', k: 'cnt.parade', n: 5, r: { jade: 150 } },
      { t: '시왕으로 승진하기', k: 'rank', n: 7, r: { ticket: 3 } }],
    outro: [['muk', '이럴 수가… 시왕의 기운이라니…!'],
      ['sib', '……{name}? 정말… {name}이야?'],
      ['me', '…응. 늦어서 미안해.'],
      ['sib', '난 이렇게 늙었는데, 넌 그대로네. 평생 그 개울에 돌다리를 놓았어. 다시는 누구도 빠지지 않게.']],
    mem: { t: '돌다리', d: '동생은 평생 개울에 돌다리를 놓았다. 다리 하나를 놓을 때마다 내 이름을 불렀다고 했다.' } },
  { title: '염라의 후계자', intro: [
      ['yeomra', '이름 없는 차사여. 너는 약속을 지켰다. 동생을 마중 나갔구나.'],
      ['yeomra', '이제 이름을 돌려주마. 명부를 펼쳐 보거라.'],
      ['narr', '빈칸에 글자가 하나씩 떠오른다. {name}. 동생이 평생 불러 준 이름이다.'],
      ['yeomra', '그리고 묵을 꺾은 그 힘으로, 내 자리를 이어 저승을 다스려 다오.']],
    quests: [
      { t: '염라대왕으로 즉위하기', k: 'rank', n: 8, r: { jade: 300, ticket: 5 } }],
    outro: [['sib', '먼저 갈게. 다음 생엔 내가 지켜 줄게, {name}.'],
      ['me', '응. 다음 생에서 꼭 만나.'],
      ['gangrim', '…크흠. 눈에 먼지가 들어갔네. 자, 새 염라대왕님! 결재 서류가 산더미입니다!'],
      ['me', '선배, 방금 감동적인 장면이었잖아요!']],
    mem: { t: '이름', d: '빈칸이 채워졌다. 동생이 아흔 해 동안 불러 준 이름, {name}.' } },
  { title: '다음 생', intro: [
      ['gangrim', '윤회를 택했다고? 하하, 역시 너답다.'],
      ['gangrim', '그런데 말이야… 이승 마을에 붉은 머리끈을 맨 아이가 하나 태어났다더군.'],
      ['me', '…!']],
    quests: [
      { t: '윤회하기', k: 'reborn', n: 1, r: { jade: 100 } },
      { t: '이번 생에서 선임 차사까지 오르기', k: 'rankNow', n: 3, r: { ticket: 3 } }],
    outro: [['narr', '마을 개울가, 돌다리 위에서 붉은 머리끈을 맨 아이가 손을 흔든다.'],
      ['gangrim', '이번 생엔 네가 지켜 줘라, {name}.']] },
];
// 이야기와 이어지는 망자 심판 사례 (그 장에 이르면 먼저 나온다)
const JUDGE_STORY = [
  { ch: 4, c: ['먹물 묻은 하급 관리', 41, '명부를 정리하는 척하며 먹물로 남의 이름을 몰래 지웠다. "묵 판관님이 시키셨다"고 한다.', 0] },
  { ch: 6, c: ['쫓기던 혼', 23, '검은 먹물을 피해 사흘 밤낮을 도망쳤다. 끝까지 다른 혼들의 손을 놓지 않았다.', 1] },
  { ch: 7, c: ['개울가 이웃 노인', 88, '장마철마다 개울가 돌다리를 함께 고쳤다. "그 집 아이는 평생 누군가를 기다렸지" 하고 말했다.', 1] },
];

const Story = (() => {
  const S = () => Game.S;
  function ensure() { const s = S(); s.story = s.story || { ch: 0, q: 0, intro: false }; s.cnt = s.cnt || {}; s.tickets = s.tickets || 0; s.clues = s.clues || {}; }
  function value(k) {
    const s = S();
    if (k.startsWith('cnt.')) return (s.cnt || {})[k.slice(4)] || 0;
    if (k === 'lv') return Game.level();
    if (k === 'rank') return s.rank + (s.reborn ? 99 : 0);
    if (k === 'rankNow') return s.rank;
    if (k === 'reborn') return s.reborn || 0;
    if (k === 'pen') return Game.ulv('pen');
    if (k === 'minion') return Game.minions();
    if (k === 'dex') return Object.keys(s.dex || {}).length;
    if (k === 'pets') return Object.keys(s.pets || {}).length;
    if (k === 'clue') return (s.clues || {})[s.story.ch] ? 1 : 0;
    return 0;
  }
  function cur() {
    ensure(); const st = S().story, C = STORY[st.ch];
    if (!C) return { end: true };
    const Q = C.quests[st.q], have = Math.min(Q.n, value(Q.k));
    return { C, Q, ch: st.ch, q: st.q, have, need: Q.n, done: have >= Q.n, intro: st.intro };
  }
  function claim() {
    const c = cur(); if (c.end || !c.done) return null;
    const s = S(), r = c.Q.r, got = { jade: r.jade || 0, ticket: r.ticket || 0, souls: 0 };
    if (r.jade) s.jade += r.jade;
    if (r.ticket) s.tickets += r.ticket;
    if (r.hours) { got.souls = Game.incomePerSec(true) * 3600 * r.hours; Game.gain(got.souls); }
    const st = s.story; let chapterDone = false;
    st.q++;
    if (st.q >= c.C.quests.length) { st.ch++; st.q = 0; st.intro = false; chapterDone = true; }
    Game.save();
    return { got, chapterDone, doneCh: c.ch, outro: chapterDone ? c.C.outro : null, mem: chapterDone ? c.C.mem : null };
  }
  function seenIntro() { S().story.intro = true; Game.save(); }
  // 지금 지도에 단서(✦)를 띄워야 하면 그 장 번호, 아니면 -1
  function clueActive() { const c = cur(); return !c.end && c.intro && c.Q.k === 'clue' && !c.done ? c.ch : -1; }
  function takeClue() { const ch = clueActive(); if (ch < 0) return false; S().clues[ch] = 1; Game.save(); return true; }
  // 지금까지 얻은 기억 조각 (끝낸 장들)
  const memories = () => STORY.slice(0, S().story.ch).map((C, i) => C.mem ? Object.assign({ ch: i }, C.mem) : null).filter(Boolean);
  const memTotal = STORY.filter(C => C.mem).length;
  const rewardText = r => [r.jade ? `옥 ${r.jade}` : '', r.ticket ? `소환권 ${r.ticket}` : '', r.hours ? `${r.hours >= 1 ? r.hours + '시간' : r.hours * 60 + '분'}치 혼` : ''].filter(Boolean).join(' · ');
  return { ensure, cur, claim, seenIntro, rewardText, clueActive, takeClue, memories, memTotal };
})();
