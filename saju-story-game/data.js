/* 게임 데이터: 스탯 정의 + 생애주기 이벤트 풀 + 마일스톤 이벤트
 * 각 이벤트의 domain 은 십성 그룹(비겁/식상/재성/관성/인성)과 연결되어,
 * 그 달의 사주 운세가 가리키는 기운과 같은 계열의 이벤트가 우선적으로 등장한다.
 */

const GameData = (() => {
  const STATS = [
    { key: 'health', label: '건강', icon: '❤' },
    { key: 'wealth', label: '재물', icon: '💰' },
    { key: 'happy', label: '행복', icon: '☺' },
    { key: 'wisdom', label: '지혜', icon: '📖' },
    { key: 'fame', label: '인망', icon: '★' },
  ];

  // effects 는 각 선택지 결과의 스탯 변화량(월별 운세 tierMult 로 증폭/감쇠됨)
  const EVENT_POOL = [
    // ── 청년기 19-35 ──
    { id: 'yng_cert', domain: '인성', minAge: 19, maxAge: 30, title: '자격증 공부', desc: '취업에 도움이 될 자격증 공부를 시작할까 합니다.', choices: [
      { text: '학원에 등록한다', effects: { wisdom: 6, wealth: -6 }, result: '체계적인 공부로 자격증을 취득했습니다.' },
      { text: '독학으로 준비한다', effects: { wisdom: 4, happy: -1 }, result: '스스로의 힘으로 꾸준히 실력을 쌓았습니다.' },
    ] },
    { id: 'yng_exam', domain: '관성', minAge: 19, maxAge: 26, title: '중요한 시험', desc: '입사 시험 혹은 자격 평가가 코앞으로 다가왔습니다.', choices: [
      { text: '밤을 새워서라도 준비한다', effects: { wisdom: 6, health: -4 }, result: '무리한 만큼 좋은 결과를 얻었습니다.' },
      { text: '평소 실력대로 임한다', effects: { wisdom: 3, happy: 1 }, result: '담담하게 시험을 치르고 결과를 기다렸습니다.' },
    ] },
    { id: 'yng_boss', domain: '관성', minAge: 23, maxAge: 35, title: '까다로운 평가', desc: '깐깐한 상사(혹은 거래처)에게 엄격한 평가를 받게 되었습니다.', choices: [
      { text: '정면으로 부딪히며 인정받으려 한다', effects: { fame: 5, health: -3 }, result: '힘들었지만 결국 실력을 인정받았습니다.' },
      { text: '묵묵히 기본에 충실한다', effects: { fame: 2, happy: -1 }, result: '큰 티는 안 났지만 신뢰를 조금씩 쌓았습니다.' },
    ] },
    { id: 'yng_sidejob', domain: '재성', minAge: 19, maxAge: 27, title: '부업의 기회', desc: '본업 외에 돈을 벌 수 있는 부업 제안이 들어왔습니다.', choices: [
      { text: '시간을 쪼개 부업을 시작한다', effects: { wealth: 6, health: -2 }, result: '몸은 고됐지만 통장이 두둑해졌습니다.' },
      { text: '본업에만 집중한다', effects: { wisdom: 2, happy: 1 }, result: '무리하지 않고 본업에 집중했습니다.' },
    ] },
    { id: 'yng_startup', domain: '재성', minAge: 24, maxAge: 35, title: '창업의 꿈', desc: '작은 사업을 시작해볼까 고민합니다.', choices: [
      { text: '과감히 도전한다', effects: { wealth: 10, happy: 4, health: -3 }, result: '위험 부담은 컸지만 사업이 순조롭게 자리 잡았습니다.' },
      { text: '안정적인 길을 택한다', effects: { happy: 2, wealth: 2 }, result: '무리하지 않고 차근차근 나아갔습니다.' },
    ] },
    { id: 'yng_love', domain: '식상', minAge: 19, maxAge: 34, title: '연애', desc: '마음이 잘 맞는 사람을 만나게 되었습니다.', choices: [
      { text: '적극적으로 만남을 이어간다', effects: { happy: 6, wealth: -3 }, result: '설레는 연애로 하루하루가 즐거웠습니다.' },
      { text: '일에 더 집중한다', effects: { wealth: 3, happy: -2 }, result: '아쉬움은 있었지만 커리어에 집중했습니다.' },
    ] },
    { id: 'yng_move', domain: '비겁', minAge: 19, maxAge: 30, title: '독립', desc: '부모님 곁을 떠나 자취를 시작할지 고민합니다.', choices: [
      { text: '독립한다', effects: { happy: 4, wisdom: 2, wealth: -5 }, result: '자유로움과 동시에 살림의 어려움도 배웠습니다.' },
      { text: '조금 더 함께 산다', effects: { wealth: 3, happy: -1 }, result: '가족과 시간을 더 보내며 돈을 아꼈습니다.' },
    ] },
    { id: 'yng_travel', domain: '식상', minAge: 19, maxAge: 40, title: '훌쩍 떠난 여행', desc: '일상에 지쳐 훌쩍 여행을 떠나고 싶어졌습니다.', choices: [
      { text: '과감히 여행을 떠난다', effects: { happy: 7, wealth: -6, wisdom: 2 }, result: '낯선 곳에서 견문을 넓히고 재충전했습니다.' },
      { text: '돈을 아끼고 참는다', effects: { wealth: 3, happy: -3 }, result: '아쉬움을 뒤로하고 통장을 지켰습니다.' },
    ] },

    // ── 장년기 36-55 ──
    { id: 'adt_promo', domain: '관성', minAge: 30, maxAge: 55, title: '승진 기회', desc: '치열한 경쟁 끝에 승진 기회가 찾아왔습니다.', choices: [
      { text: '적극적으로 도전한다', effects: { wealth: 8, fame: 4, health: -3 }, result: '노력 끝에 승진에 성공했습니다.' },
      { text: '현재 자리에 만족한다', effects: { happy: 4, health: 2 }, result: '무리하지 않고 워라밸을 지켰습니다.' },
    ] },
    { id: 'adt_invest', domain: '재성', minAge: 28, maxAge: 55, title: '재테크 고민', desc: '모아둔 돈을 어떻게 굴릴지 고민이 됩니다.', choices: [
      { text: '투자에 나선다', effects: { wealth: 9, happy: -2 }, result: '시장 흐름을 잘 타 수익을 냈습니다.' },
      { text: '안전하게 저축한다', effects: { wealth: 3, happy: 2 }, result: '느리지만 꾸준히 자산을 불렸습니다.' },
    ] },
    { id: 'adt_home', domain: '재성', minAge: 30, maxAge: 50, title: '내 집 마련', desc: '드디어 내 집을 마련할 기회가 생겼습니다.', choices: [
      { text: '대출을 받아 집을 산다', effects: { wealth: -8, happy: 6, fame: 2 }, result: '빚은 늘었지만 안정된 보금자리를 얻었습니다.' },
      { text: '조금 더 모은 뒤 결정한다', effects: { wealth: 4, happy: -1 }, result: '신중하게 때를 기다리기로 했습니다.' },
    ] },
    { id: 'adt_health', domain: '관성', minAge: 35, maxAge: 55, title: '건강 적신호', desc: '건강검진에서 관리가 필요하다는 소견을 들었습니다.', choices: [
      { text: '생활습관을 크게 바꾼다', effects: { health: 8, happy: -2 }, result: '운동과 식단 관리로 몸이 눈에 띄게 좋아졌습니다.' },
      { text: '대수롭지 않게 넘긴다', effects: { health: -5, happy: 2 }, result: '당장은 편했지만 몸이 조금씩 나빠졌습니다.' },
    ] },
    { id: 'adt_switch', domain: '관성', minAge: 32, maxAge: 55, title: '이직 고민', desc: '더 나은 조건의 이직 제안을 받았습니다.', choices: [
      { text: '새로운 도전을 택한다', effects: { wealth: 6, happy: 3, fame: -1 }, result: '새 직장에서 성공적으로 적응했습니다.' },
      { text: '익숙한 곳에 남는다', effects: { happy: 2, fame: 2 }, result: '쌓아온 신뢰와 안정감을 지켰습니다.' },
    ] },
    { id: 'adt_relation', domain: '비겁', minAge: 30, maxAge: 55, title: '인간관계의 무게', desc: '직장과 사회에서의 인간관계에 지쳐갑니다.', choices: [
      { text: '관계를 정리하며 거리를 둔다', effects: { happy: 4, fame: -3 }, result: '마음의 짐을 덜고 한결 편해졌습니다.' },
      { text: '꾹 참고 두루 관계를 유지한다', effects: { fame: 5, happy: -3 }, result: '힘들었지만 폭넓은 인맥을 지켰습니다.' },
    ] },
    { id: 'adt_hobby', domain: '식상', minAge: 36, maxAge: 55, title: '나를 위한 시간', desc: '오랜만에 온전히 나를 위한 취미나 자기계발을 시작해볼까 합니다.', choices: [
      { text: '새로운 활동을 시작한다', effects: { happy: 6, wisdom: 2, wealth: -2 }, result: '오랜만에 나만의 즐거움을 되찾았습니다.' },
      { text: '가족과 시간을 보낸다', effects: { happy: 4, fame: 1 }, result: '소소하지만 따뜻한 시간을 보냈습니다.' },
    ] },
    { id: 'adt_mentor', domain: '인성', minAge: 36, maxAge: 55, title: '뜻밖의 조언', desc: '존경하던 선배(혹은 스승)에게서 중요한 조언을 듣게 되었습니다.', choices: [
      { text: '조언을 받아들여 방향을 바꾼다', effects: { wisdom: 6, happy: 2 }, result: '새로운 시각을 얻고 한층 성장했습니다.' },
      { text: '참고만 하고 소신을 지킨다', effects: { wisdom: 2, fame: 2 }, result: '나만의 방식을 지키며 나아갔습니다.' },
    ] },

    // ── 중년기 56-70 ──
    { id: 'mid_retire', domain: '식상', minAge: 55, maxAge: 65, title: '은퇴 준비', desc: '은퇴 후의 삶을 어떻게 꾸릴지 고민이 됩니다.', choices: [
      { text: '새로운 취미를 시작한다', effects: { happy: 6, wisdom: 2 }, result: '텃밭 가꾸기와 그림 그리기로 활기를 되찾았습니다.' },
      { text: '작은 일을 계속한다', effects: { wealth: 5, health: -2 }, result: '소일거리를 하며 생활에 여유를 더했습니다.' },
    ] },
    { id: 'mid_checkup', domain: '인성', minAge: 56, maxAge: 75, title: '정기 건강검진', desc: '나이가 들며 건강검진이 중요해졌습니다.', choices: [
      { text: '꼼꼼히 검진받는다', effects: { health: 6, wealth: -3 }, result: '이상 소견을 조기에 발견하고 관리했습니다.' },
      { text: '간단히 넘긴다', effects: { wealth: 1, health: -3 }, result: '별일 없길 바라며 넘어갔습니다.' },
    ] },
    { id: 'mid_hobby', domain: '식상', minAge: 56, maxAge: 70, title: '여유로운 취미', desc: '시간적 여유가 생겨 새로운 것을 배워볼까 합니다.', choices: [
      { text: '동호회에 가입한다', effects: { happy: 5, fame: 3, wealth: -2 }, result: '비슷한 또래와 어울리며 활력을 찾았습니다.' },
      { text: '혼자 조용히 즐긴다', effects: { happy: 4, wisdom: 2 }, result: '고요한 시간 속에서 마음의 평화를 얻었습니다.' },
    ] },
    { id: 'mid_grandchild', domain: '식상', minAge: 55, maxAge: 75, title: '손주 재롱', desc: '오랜만에 만난 어린 조카(혹은 손주)가 재롱을 부립니다.', choices: [
      { text: '함께 시간을 듬뿍 보낸다', effects: { happy: 7, health: -1 }, result: '웃음 가득한 시간을 보내며 행복해했습니다.' },
      { text: '용돈을 듬뿍 쥐여준다', effects: { happy: 4, wealth: -4 }, result: '환하게 웃는 모습에 덩달아 기분이 좋아졌습니다.' },
    ] },

    // ── 노년기 71-100 ──
    { id: 'old_walk', domain: '인성', minAge: 71, maxAge: 99, title: '아침 산책', desc: '동네를 천천히 걷는 것이 하루의 큰 낙이 되었습니다.', choices: [
      { text: '매일 꾸준히 걷는다', effects: { health: 5, happy: 3 }, result: '규칙적인 산책 덕분에 몸이 한결 가벼워졌습니다.' },
      { text: '날이 좋을 때만 나간다', effects: { happy: 3 }, result: '무리하지 않고 편안하게 지냈습니다.' },
    ] },
    { id: 'old_friend', domain: '비겁', minAge: 71, maxAge: 99, title: '옛 친구들과의 모임', desc: '오랜 친구들과 모처럼 모임을 가졌습니다.', choices: [
      { text: '옛 이야기를 나누며 즐긴다', effects: { happy: 6, fame: 2 }, result: '지나온 세월을 추억하며 크게 웃었습니다.' },
      { text: '피곤해서 집에서 쉰다', effects: { health: 3, happy: -2 }, result: '조용히 쉬며 체력을 아꼈습니다.' },
    ] },
    { id: 'old_hospital', domain: '인성', minAge: 72, maxAge: 99, title: '병원 나들이', desc: '몸 여기저기가 예전 같지 않아 병원을 찾았습니다.', choices: [
      { text: '적극적으로 치료받는다', effects: { health: 6, wealth: -5 }, result: '치료 덕분에 몸이 한결 편안해졌습니다.' },
      { text: '자연스럽게 받아들인다', effects: { happy: 3, health: -2 }, result: '나이 듦을 담담히 받아들이기로 했습니다.' },
    ] },
    { id: 'old_reflect', domain: '인성', minAge: 75, maxAge: 99, title: '인생을 돌아보며', desc: '문득 지나온 삶을 돌아보게 되었습니다.', choices: [
      { text: '일기를 쓰며 정리한다', effects: { wisdom: 4, happy: 4 }, result: '차분히 지난 날들을 정리하며 마음이 평온해졌습니다.' },
      { text: '가족에게 이야기를 들려준다', effects: { fame: 4, happy: 3 }, result: '가족들이 귀 기울여 들으며 함께 웃고 울었습니다.' },
    ] },

    // ── 전 연령(19+) 공통 이벤트 ──
    { id: 'any_lottery', domain: '재성', minAge: 19, maxAge: 99, title: '뜻밖의 행운', desc: '길을 걷다 우연히 작은 행운이 찾아왔습니다.', choices: [
      { text: '감사히 받아들인다', effects: { wealth: 5, happy: 3 }, result: '작은 행운에 하루가 즐거워졌습니다.' },
      { text: '대수롭지 않게 넘긴다', effects: { wisdom: 2 }, result: '큰 의미를 두지 않고 평소처럼 지냈습니다.' },
    ] },
    { id: 'any_scam', domain: '재성', minAge: 20, maxAge: 80, title: '수상한 제안', desc: '솔깃한 투자 제안을 받았습니다. 어딘가 미심쩍습니다.', choices: [
      { text: '거절하고 신고한다', effects: { wisdom: 4, fame: 2 }, result: '현명한 판단으로 피해를 막았습니다.' },
      { text: '혹시나 하며 응한다', effects: { wealth: -7, wisdom: -2 }, result: '아쉽게도 사기였음을 뒤늦게 깨달았습니다.' },
    ] },
    { id: 'any_conflict', domain: '비겁', minAge: 19, maxAge: 90, title: '갈등의 순간', desc: '가까운 사람과 오해가 생겨 갈등이 있었습니다.', choices: [
      { text: '먼저 다가가 풀어낸다', effects: { fame: 4, happy: 2 }, result: '진심이 통해 관계가 더 돈독해졌습니다.' },
      { text: '시간이 해결해주길 기다린다', effects: { happy: -2, wisdom: 2 }, result: '시간이 지나며 자연스레 풀렸습니다.' },
    ] },
    { id: 'any_weather', domain: '인성', minAge: 19, maxAge: 99, title: '궂은 날씨', desc: '오랜 장마와 궂은 날씨에 몸과 마음이 축축 처집니다.', choices: [
      { text: '실내에서 컨디션을 관리한다', effects: { health: 3, happy: 1 }, result: '무리하지 않고 컨디션을 잘 유지했습니다.' },
      { text: '개의치 않고 활동한다', effects: { happy: 3, health: -2 }, result: '날씨에 아랑곳하지 않고 활기차게 지냈습니다.' },
    ] },
  ];

  const MILESTONES = [
    { age: 19, id: 'ms_adult', title: '성인이 되다', desc: '어른이 되는 해입니다. 앞으로의 길을 정해야 합니다.', choices: [
      { text: '대학 진학을 택한다', effects: { wisdom: 8, wealth: -4 }, result: '대학 생활을 시작하며 새로운 배움에 뛰어들었습니다.' },
      { text: '곧바로 사회에 진출한다', effects: { wealth: 6, wisdom: -2 }, result: '일찍이 사회 경험을 쌓기 시작했습니다.' },
      { text: '기술을 배운다', effects: { wealth: 3, wisdom: 3 }, result: '실용적인 기술을 익히며 자립을 준비했습니다.' },
    ] },
    { age: 23, id: 'ms_career', title: '첫 사회생활', desc: '첫 직장(혹은 사업)에 발을 내딛는 순간입니다.', choices: [
      { text: '패기 있게 도전한다', effects: { wealth: 6, happy: 4, health: -2 }, result: '열정적으로 뛰어들며 값진 경험을 쌓았습니다.' },
      { text: '신중하게 자리를 잡는다', effects: { fame: 4, wealth: 3 }, result: '차근차근 신뢰를 쌓으며 자리를 잡았습니다.' },
    ] },
    { age: 28, id: 'ms_marriage', title: '인생의 동반자', desc: '결혼 적령기, 평생을 함께할 사람에 대해 고민하게 됩니다.', choices: [
      { text: '결혼을 결심한다', effects: { happy: 8, wealth: -6, fame: 3 }, result: '평생의 동반자와 새로운 가정을 꾸렸습니다.' },
      { text: '지금은 혼자만의 삶에 집중한다', effects: { wisdom: 4, wealth: 3 }, result: '온전히 나에게 집중하는 시간을 택했습니다.' },
    ] },
    { age: 40, id: 'ms_midlife', title: '불혹, 인생 중반', desc: '흔들리지 않을 나이, 지나온 삶을 돌아보게 됩니다.', choices: [
      { text: '새로운 목표를 세운다', effects: { happy: 5, wisdom: 3 }, result: '인생 후반전을 위한 새 목표를 그렸습니다.' },
      { text: '지금까지의 안정을 지킨다', effects: { wealth: 4, health: 2 }, result: '쌓아온 것들을 단단히 지켜나가기로 했습니다.' },
    ] },
    { age: 60, id: 'ms_hwan', title: '환갑잔치', desc: '60번째 생일, 가족과 지인들이 모여 환갑잔치를 열어주었습니다.', choices: [
      { text: '큰 잔치를 연다', effects: { happy: 8, fame: 4, wealth: -5 }, result: '오랜만에 모인 사람들과 웃음꽃을 피웠습니다.' },
      { text: '가까운 가족끼리 조용히 보낸다', effects: { happy: 5, wealth: 1 }, result: '소박하지만 따뜻한 시간을 보냈습니다.' },
    ] },
    { age: 70, id: 'ms_gohee', title: '고희', desc: '70번째 생일, 예로부터 드물다는 나이에 이르렀습니다.', choices: [
      { text: '평생의 이야기를 글로 남긴다', effects: { wisdom: 6, happy: 4 }, result: '지나온 삶을 글로 정리하며 뜻깊은 시간을 보냈습니다.' },
      { text: '남은 날들을 편히 즐긴다', effects: { happy: 6, health: 2 }, result: '욕심을 내려놓고 하루하루를 여유롭게 즐겼습니다.' },
    ] },
    { age: 80, id: 'ms_pal', title: '팔순', desc: '80번째 생일, 온 가족이 모여 축하해주었습니다.', choices: [
      { text: '온 가족과 함께 기념한다', effects: { happy: 8, fame: 3 }, result: '자손들에 둘러싸여 벅찬 행복을 느꼈습니다.' },
      { text: '조용히 지난 세월을 음미한다', effects: { happy: 5, wisdom: 3 }, result: '고요한 하루, 지나온 세월을 가만히 되새겼습니다.' },
    ] },
  ];

  return { STATS, EVENT_POOL, MILESTONES };
})();

if (typeof module !== 'undefined') module.exports = GameData;
