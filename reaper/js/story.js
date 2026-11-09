// ===== 메인 스토리: 장별 대화 + 순서대로 깨는 퀘스트 + 보상 =====
// 말하는 사람: me(나) · gangrim(선배 강림 차사) · jumo(주모) · elder(게시판 할아버지) · gob(도깨비 상인) · boat(뱃사공) · yeomra(염라대왕) · wraith(원귀)
const SPEAKERS = { me: '{name}', gangrim: '강림 차사', jumo: '주모', elder: '게시판 할아버지', gob: '도깨비 상인', boat: '뱃사공', yeomra: '염라대왕', wraith: '원귀' };
// k: 확인할 것 (cnt.* 누적 횟수, lv 레벨, rank 직급, pen 필력, minion 졸개, dex 도감, pets 펫 종류)
const STORY = [
  { title: '첫 근무', intro: [
      ['gangrim', '어이, 신입! 네가 오늘부터 이승 마을을 맡게 된 {name}인가?'],
      ['me', '네! 수습 차사 {name}, 첫 근무 나왔습니다!'],
      ['gangrim', '나는 강림. 저승에서 제일 바쁜 차사지. 일은 간단해. 떠도는 혼을 명부에 거둬 저승으로 보내는 거야.'],
      ['gangrim', '혼령이 보이면 직접 톡 건드려도 돼. 자, 시작해 볼까?']],
    quests: [
      { t: '혼령 100개 거두기', k: 'cnt.soul', n: 100, r: { jade: 20 } },
      { t: '혼령을 직접 터치해서 10번 거두기', k: 'cnt.tap', n: 10, r: { jade: 20 } },
      { t: '명부 필력 Lv.5 달성', k: 'pen', n: 5, r: { hours: 0.5 } },
      { t: '차사 레벨 20 달성', k: 'lv', n: 20, r: { jade: 30 } }],
    outro: [['gangrim', '오, 손이 빠른데? 하지만 혼자서는 금방 지칠 거다. 다음엔 부하를 들여 보자고.']] },
  { title: '졸개를 거느리다', intro: [
      ['gangrim', '저승에는 "졸개 차사"라는 꼬맹이들이 있지. 품삯만 주면 대신 혼을 거둬 준다.'],
      ['gangrim', '아, 그리고 가끔 원한이 깊은 혼, 원귀가 나타나. 겁먹지 말고 연타로 퇴치해!']],
    quests: [
      { t: '졸개 차사 1명 고용하기', k: 'minion', n: 1, r: { jade: 30 } },
      { t: '원귀 1마리 퇴치하기', k: 'cnt.wraith', n: 1, r: { jade: 30 } },
      { t: '차사 레벨 60 달성', k: 'lv', n: 60, r: { ticket: 1 } }],
    outro: [['wraith', '으으… 이승에… 남고 싶었는데…'], ['gangrim', '잘했다. 원귀도 결국 거둬 줘야 할 혼이야. 이제 승진 시험을 볼 때가 됐군!']] },
  { title: '첫 승진', intro: [
      ['gangrim', '레벨이 차면 승진 시험을 볼 수 있어. 시험관 원귀를 30초 안에 쓰러뜨리면 합격이다.'],
      ['me', '떨리네요… 옷도 바뀌나요?'],
      ['gangrim', '물론! 붉은 띠를 매게 될 거다. 하하.']],
    quests: [
      { t: '말단 차사로 승진하기', k: 'rank', n: 1, r: { jade: 50, ticket: 1 } }],
    outro: [['gangrim', '축하한다, 말단 차사! 이제 저승 장터 쪽도 돌아다닐 수 있겠군. 아, 배고프면 주막에 들러 봐.']] },
  { title: '주막의 비밀', intro: [
      ['jumo', '어서 오시게, 젊은 차사 양반! 강림이 말한 신입이 자네로구먼.'],
      ['jumo', '우리 주막 뒤 꽃밭에 망각초를 심어 보게. 꽃을 가져오면 기운 나는 탕약을 달여 주지.'],
      ['me', '꽃으로 탕약을요?'],
      ['jumo', '망각탕 한 사발이면 혼이 두 배로 잘 거둬진다네. 호호.']],
    quests: [
      { t: '꽃밭에서 꽃 1번 수확하기', k: 'cnt.harvest', n: 1, r: { jade: 30 } },
      { t: '주막에서 탕약 1번 달이기', k: 'cnt.brew', n: 1, r: { jade: 30 } },
      { t: '졸개를 파견 보내기 1번', k: 'cnt.send', n: 1, r: { hours: 1 } },
      { t: '혼령 5,000개 거두기', k: 'cnt.soul', n: 5000, r: { ticket: 1 } }],
    outro: [['jumo', '일 잘하는구먼! 참, 요즘 장터에 도깨비 하나가 수상한 물건을 판다더군.']] },
  { title: '저승 장터의 도깨비', intro: [
      ['gob', '헤헤헤! 차사 나리, 좋은 물건 있어! 영물을 부르는 소환권, 관심 없어?'],
      ['me', '영물이요?'],
      ['gob', '저승사자를 따라다니며 돕는 신령한 짐승이지! 운 좋으면 황룡도 나온다고, 헤헤.']],
    quests: [
      { t: '차사로 승진하기', k: 'rank', n: 2, r: { jade: 60 } },
      { t: '영물(펫) 1마리 데려오기', k: 'pets', n: 1, r: { ticket: 2 } },
      { t: '혼령 도감 1종 등록하기', k: 'dex', n: 1, r: { jade: 50 } }],
    outro: [['gob', '헤헤, 단골 됐네! 가끔 노점에 들를 테니 또 보자고!']] },
  { title: '백귀야행의 밤', intro: [
      ['elder', '젊은이, 오늘 밤 조심하게. 백귀야행이 지나갈 걸세.'],
      ['me', '백귀야행이요?'],
      ['elder', '귀신들이 줄지어 지나가는 밤이지. 혼령이 쏟아지니 바쁘겠지만… 거둘 혼도 넘쳐 나지!']],
    quests: [
      { t: '백귀야행 1번 겪기', k: 'cnt.parade', n: 1, r: { jade: 60 } },
      { t: '원귀 10마리 퇴치하기', k: 'cnt.wraith', n: 10, r: { ticket: 1 } },
      { t: '선임 차사로 승진하기', k: 'rank', n: 3, r: { jade: 80, ticket: 1 } }],
    outro: [['gangrim', '백귀야행을 버텨 내다니! 이제 대숲 너머 삼도천으로 가 봐야겠다.']] },
  { title: '삼도천을 건너', intro: [
      ['boat', '삼도천 나룻배요~ 혼 하나에 한 번씩 건너 드립니다~'],
      ['boat', '차사 나리, 졸개들을 보내 주시면 뱃길 순찰을 맡겨 드리지요.']],
    quests: [
      { t: '차사장으로 승진하기', k: 'rank', n: 4, r: { jade: 100 } },
      { t: '졸개 파견 5번 보내기', k: 'cnt.send', n: 5, r: { ticket: 1 } },
      { t: '꽃 10번 수확하기', k: 'cnt.harvest', n: 10, r: { hours: 2 } },
      { t: '졸개 차사 10명 거느리기', k: 'minion', n: 10, r: { ticket: 2 } }],
    outro: [['boat', '나리 덕분에 뱃길이 조용하네요. 강 건너엔… 망각의 들판이 있지요.']] },
  { title: '망각의 들판', intro: [
      ['gangrim', '여긴 망각의 들판. 혼들이 이승의 기억을 내려놓는 곳이다.'],
      ['gangrim', '…{name}, 너는 왜 저승사자가 됐는지 기억나?'],
      ['me', '…아뇨. 눈을 떠 보니 명부를 들고 있었어요.'],
      ['gangrim', '언젠가 알게 될 거다. 지금은 판관이 되는 것부터 하자.']],
    quests: [
      { t: '판관으로 승진하기', k: 'rank', n: 5, r: { jade: 120, ticket: 1 } },
      { t: '혼령 도감 6종 등록하기', k: 'dex', n: 6, r: { ticket: 2 } },
      { t: '영물 5종 모으기', k: 'pets', n: 5, r: { jade: 100 } }],
    outro: [['gangrim', '판관 관복이 잘 어울리는군. 다음은 저승문… 그리고 지옥이다.']] },
  { title: '지옥의 불길', intro: [
      ['wraith', '크크크… 판관 따위가 화탕지옥까지 오다니…'],
      ['me', '끓는 가마솥에 갇힌 혼들을 구하러 왔다!'],
      ['gangrim', '조심해! 여기 원귀들은 독하다. 혼불주를 마시고 싸워!']],
    quests: [
      { t: '명부 판관으로 승진하기', k: 'rank', n: 6, r: { jade: 150 } },
      { t: '원귀 50마리 퇴치하기', k: 'cnt.wraith', n: 50, r: { ticket: 2 } },
      { t: '백귀야행 5번 겪기', k: 'cnt.parade', n: 5, r: { jade: 150 } },
      { t: '시왕으로 승진하기', k: 'rank', n: 7, r: { ticket: 3 } }],
    outro: [['gangrim', '시왕이라니… 이제 너는 나보다 높은 분이 됐구나. 염라대왕께서 부르신다.']] },
  { title: '염라의 후계자', intro: [
      ['yeomra', '네가 {name}인가. 수습 차사가 시왕까지 오르다니, 기특하구나.'],
      ['yeomra', '사실 너는 이승에서 수많은 이를 도운 착한 혼이었다. 그래서 차사로 남겨 두었지.'],
      ['me', '제가… 그런 혼이었다니.'],
      ['yeomra', '이제 내 자리를 이어받아라. 염라대왕이 되어 저승을 다스리거라.']],
    quests: [
      { t: '염라대왕으로 즉위하기', k: 'rank', n: 8, r: { jade: 300, ticket: 5 } }],
    outro: [['yeomra', '잘했다, 새 염라대왕이여. 저승의 일은 끝이 없지. 윤회하여 다시 시작해도 좋다.'],
      ['gangrim', '하하, 다음 생에도 같이 일하자고, {name}!']] },
];

const Story = (() => {
  const S = () => Game.S;
  function ensure() { const s = S(); s.story = s.story || { ch: 0, q: 0, intro: false }; s.cnt = s.cnt || {}; s.tickets = s.tickets || 0; }
  function value(k) {
    const s = S();
    if (k.startsWith('cnt.')) return (s.cnt || {})[k.slice(4)] || 0;
    if (k === 'lv') return Game.level();
    if (k === 'rank') return s.rank + (s.reborn ? 99 : 0);
    if (k === 'pen') return Game.lv('pen');
    if (k === 'minion') return Game.minions();
    if (k === 'dex') return Object.keys(s.dex || {}).length;
    if (k === 'pets') return Object.keys(s.pets || {}).length;
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
    return { got, chapterDone, outro: chapterDone ? c.C.outro : null };
  }
  function seenIntro() { S().story.intro = true; Game.save(); }
  const rewardText = r => [r.jade ? `옥 ${r.jade}` : '', r.ticket ? `소환권 ${r.ticket}` : '', r.hours ? `${r.hours >= 1 ? r.hours + '시간' : r.hours * 60 + '분'}치 혼` : ''].filter(Boolean).join(' · ');
  return { ensure, cur, claim, seenIntro, rewardText };
})();
