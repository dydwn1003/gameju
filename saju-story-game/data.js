/* 게임 데이터: 스탯 정의 + 생애주기 이벤트 풀 + 마일스톤 이벤트
 * 각 이벤트의 domain 은 십성 그룹(비겁/식상/재성/관성/인성)과 연결되어,
 * 그 달의 사주 운세가 가리키는 기운과 같은 계열의 이벤트가 우선적으로 등장한다.
 * choices 는 4개씩 있고 effects 크기는 다르지만, 문구만으로 어떤 게 좋은 선택인지
 * 티 나지 않도록 일부러 톤을 중립적으로 맞췄다 (표시 순서도 매번 섞는다).
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
      { text: '학원에 등록해 정해진 커리큘럼을 따른다', effects: { wisdom: 10, wealth: -4 }, result: '체계적인 공부로 예상보다 빨리 자격증을 취득했습니다.' },
      { text: '인터넷 강의로 각자 진도에 맞춰 준비한다', effects: { wisdom: 5, happy: -1 }, result: '스스로의 힘으로 차근차근 실력을 쌓았습니다.' },
      { text: '친구를 통해 얻은 자료로 준비한다', effects: { wisdom: 2, health: -3 }, result: '급하게 몰아붙이느라 몸도 마음도 지쳤습니다.' },
      { text: '일단 접수부터 해두고 나중에 준비한다', effects: { wisdom: -4, happy: -3 }, result: '괜한 자괴감만 남긴 채 흐지부지되었습니다.' },
    ] },
    { id: 'yng_exam', domain: '관성', minAge: 19, maxAge: 26, title: '중요한 시험', desc: '입사 시험 혹은 자격 평가가 코앞으로 다가왔습니다.', choices: [
      { text: '따로 시간을 내어 실전처럼 모의고사를 풀어본다', effects: { wisdom: 8, health: 1 }, result: '차분한 준비 끝에 좋은 결과를 얻었습니다.' },
      { text: '평소 하던 방식대로 마무리 정리를 한다', effects: { wisdom: 3, happy: 1 }, result: '담담하게 시험을 치르고 결과를 기다렸습니다.' },
      { text: '전날 밤늦게까지 정리 노트를 훑어본다', effects: { wisdom: 4, health: -5 }, result: '무리한 만큼 몸이 크게 축났습니다.' },
      { text: '긴장을 풀 겸 준비를 일찍 끝내버린다', effects: { wisdom: -5, happy: -4 }, result: '성의 없는 태도가 결과로 고스란히 돌아왔습니다.' },
    ] },
    { id: 'yng_boss', domain: '관성', minAge: 23, maxAge: 35, title: '까다로운 평가', desc: '깐깐한 상사(혹은 거래처)에게 엄격한 평가를 받게 되었습니다.', choices: [
      { text: '그동안의 성과를 자료로 정리해 제시한다', effects: { fame: 7, wisdom: 2, health: -2 }, result: '힘들었지만 결국 실력을 확실히 인정받았습니다.' },
      { text: '평소 하던 대로 업무를 이어간다', effects: { fame: 2, happy: -1 }, result: '큰 티는 안 났지만 신뢰를 조금씩 쌓았습니다.' },
      { text: '상대의 지적에 곧바로 해명한다', effects: { fame: -3, happy: -4 }, result: '자신감을 잃고 실수가 잦아졌습니다.' },
      { text: '자리에서 속마음을 그대로 드러낸다', effects: { fame: -8, happy: -5 }, result: '돌이키기 힘든 앙금만 남기고 말았습니다.' },
    ] },
    { id: 'yng_sidejob', domain: '재성', minAge: 19, maxAge: 27, title: '부업의 기회', desc: '본업 외에 돈을 벌 수 있는 부업 제안이 들어왔습니다.', choices: [
      { text: '주말 시간을 활용해 부업을 병행한다', effects: { wealth: 8, health: -1 }, result: '균형을 잘 잡아 통장이 두둑해졌습니다.' },
      { text: '일단 본업에 집중하기로 한다', effects: { wisdom: 2, happy: 1 }, result: '무리하지 않고 본업에 집중했습니다.' },
      { text: '퇴근 후 시간을 모두 부업에 쏟는다', effects: { wealth: 3, health: -5, fame: -2 }, result: '본업을 소홀히 한 대가가 뒤늦게 돌아왔습니다.' },
      { text: '지인이 소개해준 자리에 바로 뛰어든다', effects: { wealth: -9, wisdom: -2 }, result: '결국 사기성 부업이었음을 뒤늦게 깨달았습니다.' },
    ] },
    { id: 'yng_startup', domain: '재성', minAge: 24, maxAge: 35, title: '창업의 꿈', desc: '작은 사업을 시작해볼까 고민합니다.', choices: [
      { text: '사업계획서를 준비해 투자자를 만나본다', effects: { wealth: 12, happy: 4, health: -2 }, result: '탄탄한 준비 덕에 사업이 순조롭게 자리 잡았습니다.' },
      { text: '작은 규모로 우선 시작해본다', effects: { happy: 3, wealth: 3 }, result: '무리하지 않고 차근차근 나아갔습니다.' },
      { text: '가진 돈을 모두 끌어모아 시작한다', effects: { wealth: -11, health: -4 }, result: '욕심이 앞서 모아둔 돈 대부분을 날리고 자금 사정이 크게 꼬였습니다.' },
      { text: '믿을 만한 사람의 제안을 그대로 따른다', effects: { wealth: -16, happy: -6, health: -3 }, result: '알고 보니 사기에 가까운 제안이었고, 전 재산에 가까운 돈을 잃은 채 오랫동안 후유증을 겪었습니다.' },
    ] },
    { id: 'yng_love', domain: '식상', minAge: 19, maxAge: 34, title: '연애', desc: '마음이 잘 맞는 사람을 만나게 되었습니다.', choices: [
      { text: '서로의 일정을 맞춰가며 만남을 이어간다', effects: { happy: 8, fame: 2 }, result: '설레는 연애로 하루하루가 즐거웠습니다.' },
      { text: '가끔씩 편하게 연락하며 지낸다', effects: { happy: 4 }, result: '무리하지 않는 편안한 만남을 이어갔습니다.' },
      { text: '바쁜 시기라 만남을 뒤로 미룬다', effects: { happy: -3, wealth: 2 }, result: '커리어는 챙겼지만 관계에는 서운함이 쌓였습니다.' },
      { text: '서운한 감정을 그때그때 드러낸다', effects: { happy: -8, fame: -2 }, result: '돌이키기 힘든 이별로 마음이 크게 상했습니다.' },
    ] },
    { id: 'yng_move', domain: '비겁', minAge: 19, maxAge: 30, title: '독립', desc: '부모님 곁을 떠나 자취를 시작할지 고민합니다.', choices: [
      { text: '예산을 짜서 계획대로 독립을 준비한다', effects: { happy: 6, wisdom: 3, wealth: -3 }, result: '자유로움과 함께 알찬 살림 노하우도 배웠습니다.' },
      { text: '조금 더 부모님과 함께 지내기로 한다', effects: { wealth: 3, happy: -1 }, result: '가족과 시간을 더 보내며 돈을 아꼈습니다.' },
      { text: '마음에 드는 집을 발견해 바로 계약한다', effects: { happy: 2, wealth: -6 }, result: '자유는 얻었지만 생활비에 매달 허덕였습니다.' },
      { text: '친구의 권유로 급하게 집을 구한다', effects: { wealth: -9, health: -2, happy: -3 }, result: '무리한 지출로 오랫동안 쪼들리게 되었습니다.' },
    ] },
    { id: 'yng_travel', domain: '식상', minAge: 19, maxAge: 40, title: '훌쩍 떠난 여행', desc: '일상에 지쳐 훌쩍 여행을 떠나고 싶어졌습니다.', choices: [
      { text: '일정을 짜서 원하는 곳들을 둘러본다', effects: { happy: 9, wisdom: 3, wealth: -4 }, result: '낯선 곳에서 견문을 넓히고 제대로 재충전했습니다.' },
      { text: '짧게 근교로 다녀온다', effects: { happy: 4, wealth: -2 }, result: '짧지만 알찬 시간으로 기분을 전환했습니다.' },
      { text: '즉흥적으로 항공권부터 끊는다', effects: { happy: 3, wealth: -8 }, result: '즐겁긴 했지만 지출이 예상보다 훨씬 컸습니다.' },
      { text: '아는 사람 없는 낯선 곳으로 무작정 떠난다', effects: { happy: -4, wealth: -10, health: -2 }, result: '여행 중 사고와 분실로 큰 손해를 봤습니다.' },
    ] },
    { id: 'yng_roommate', domain: '비겁', minAge: 19, maxAge: 30, title: '룸메이트와의 트러블', desc: '함께 사는 룸메이트와 생활 방식 차이로 자꾸 부딪힙니다.', choices: [
      { text: '차분히 대화로 생활 규칙을 다시 정한다', effects: { happy: 6, fame: 2 }, result: '서로 맞춰가며 한결 편안한 사이가 되었습니다.' },
      { text: '서로 조금씩 양보하며 지낸다', effects: { happy: 3 }, result: '큰 탈 없이 무난하게 지냈습니다.' },
      { text: '불편해도 그냥 참고 넘어간다', effects: { happy: -3, health: -1 }, result: '쌓인 불만이 조금씩 스트레스가 되었습니다.' },
      { text: '화가 나서 크게 쏘아붙인다', effects: { happy: -6, fame: -3 }, result: '감정이 상한 채로 서먹한 사이가 되었습니다.' },
    ] },
    { id: 'yng_freelance', domain: '재성', minAge: 20, maxAge: 32, title: '프리랜서 제안', desc: '알게 된 인맥을 통해 프리랜서 외주 제안을 받았습니다.', choices: [
      { text: '꼼꼼히 계약서를 검토하고 받아들인다', effects: { wealth: 9, wisdom: 2 }, result: '조건을 잘 따진 덕에 만족스러운 결과를 얻었습니다.' },
      { text: '작은 건부터 시험 삼아 해본다', effects: { wealth: 4, happy: 1 }, result: '무리하지 않고 새로운 수입원을 늘렸습니다.' },
      { text: '자세히 안 보고 일단 승낙한다', effects: { wealth: -5, health: -2 }, result: '생각보다 조건이 나빠 손해를 봤습니다.' },
      { text: '무리하게 여러 건을 한꺼번에 받는다', effects: { wealth: 2, health: -7, happy: -3 }, result: '감당 못할 일정에 몸도 마음도 지쳤습니다.' },
    ] },
    { id: 'yng_friend_money', domain: '비겁', minAge: 19, maxAge: 35, title: '친구의 돈 부탁', desc: '가까운 친구가 사정이 있다며 돈을 빌려달라고 합니다.', choices: [
      { text: '감당 가능한 만큼만, 차용증을 쓰고 빌려준다', effects: { fame: 5, wisdom: 2, wealth: -2 }, result: '관계도 지키고 돈도 무사히 돌려받았습니다.' },
      { text: '완곡히 거절하되 다른 도움을 제안한다', effects: { wisdom: 2 }, result: '서운함은 있었지만 무리하지 않고 넘어갔습니다.' },
      { text: '거절하지 못해 무리해서 빌려준다', effects: { wealth: -7, happy: -2 }, result: '돌려받지 못한 채 마음만 불편해졌습니다.' },
      { text: '전 재산을 긁어모아 빌려준다', effects: { wealth: -13, happy: -4 }, result: '연락이 끊긴 친구 대신 큰 빚만 떠안았습니다.' },
    ] },
    { id: 'yng_license_fail', domain: '관성', minAge: 19, maxAge: 28, title: '떨어진 시험', desc: '기대했던 시험(자격증 혹은 입사)에서 아쉽게 고배를 마셨습니다.', choices: [
      { text: '원인을 분석하고 다음을 준비한다', effects: { wisdom: 7, happy: -1 }, result: '실패를 발판 삼아 다음 기회를 더 단단히 준비했습니다.' },
      { text: '잠시 쉬었다가 다시 도전한다', effects: { happy: 2, wisdom: 2 }, result: '마음을 추스르고 다시 힘을 냈습니다.' },
      { text: '낙담한 채로 시간을 흘려보낸다', effects: { happy: -4 }, result: '한동안 아무것도 손에 잡히지 않았습니다.' },
      { text: '자신을 탓하며 자책을 이어간다', effects: { happy: -8, health: -3 }, result: '깊은 자책감에 몸과 마음이 함께 상했습니다.' },
    ] },
    { id: 'yng_bodyweak', domain: '인성', minAge: 19, maxAge: 34, title: '잦은 몸살', desc: '무리한 일정 탓인지 요즘 부쩍 몸살을 자주 앓습니다.', choices: [
      { text: '병원에 가서 제대로 원인을 찾는다', effects: { health: 8, wealth: -3 }, result: '원인을 정확히 찾아 몸이 한결 나아졌습니다.' },
      { text: '충분히 쉬며 몸을 추스른다', effects: { health: 5 }, result: '무리하지 않고 컨디션을 잘 회복했습니다.' },
      { text: '피곤해도 일정을 그대로 소화한다', effects: { health: -4 }, result: '몸살이 좀처럼 낫지 않고 이어졌습니다.' },
      { text: '괜찮다며 무리한 일정을 더 늘린다', effects: { health: -9, happy: -2 }, result: '결국 크게 앓아누워 일상에 지장이 생겼습니다.' },
    ] },
    { id: 'yng_sns', domain: '식상', minAge: 19, maxAge: 32, title: 'SNS 논쟁', desc: 'SNS에 올린 글이 예상 밖으로 큰 논쟁에 휘말렸습니다.', choices: [
      { text: '차분히 설명하는 글을 올리고 상황을 정리한다', effects: { fame: 5, wisdom: 2 }, result: '차분한 대응으로 오히려 신뢰를 얻었습니다.' },
      { text: '조용히 글을 내리고 넘어간다', effects: { happy: 1 }, result: '별다른 탈 없이 조용히 지나갔습니다.' },
      { text: '신경 쓰이지만 그냥 내버려 둔다', effects: { happy: -3, fame: -1 }, result: '찜찜한 마음이 한동안 이어졌습니다.' },
      { text: '감정적으로 맞받아치며 논쟁을 키운다', effects: { fame: -7, happy: -4 }, result: '논쟁이 커지며 평판에 흠집이 났습니다.' },
    ] },
    { id: 'yng_jobsearch', domain: '관성', minAge: 19, maxAge: 27, title: '취업 준비', desc: '본격적으로 취업 준비를 시작하며 진로를 고민합니다.', choices: [
      { text: '여러 회사와 직무를 꼼꼼히 조사하고 지원한다', effects: { wisdom: 6, wealth: 3 }, result: '꼼꼼한 준비 끝에 원하는 곳에 자리를 잡았습니다.' },
      { text: '일단 눈에 띄는 곳부터 지원해본다', effects: { wealth: 2, happy: 1 }, result: '무리하지 않고 하나씩 경험을 쌓았습니다.' },
      { text: '막막한 마음에 준비를 계속 미룬다', effects: { happy: -4, wisdom: -2 }, result: '시간만 흘러가며 조급함이 커졌습니다.' },
      { text: '묻지마 지원을 반복하다 지쳐버린다', effects: { happy: -6, health: -3 }, result: '성과 없는 반복에 몸도 마음도 지쳤습니다.' },
    ] },
    { id: 'yng_breakup', domain: '식상', minAge: 20, maxAge: 34, title: '이별의 후유증', desc: '오래 만난 사람과 헤어진 뒤 마음을 추스르는 중입니다.', choices: [
      { text: '주변 사람들과 시간을 보내며 마음을 다잡는다', effects: { happy: 6, fame: 1 }, result: '따뜻한 사람들 덕에 서서히 마음을 추슬렀습니다.' },
      { text: '혼자만의 시간을 가지며 천천히 회복한다', effects: { happy: 2, wisdom: 2 }, result: '스스로를 돌아보며 조금씩 나아졌습니다.' },
      { text: '일에 파묻혀 애써 잊으려 한다', effects: { happy: -3, health: -2 }, result: '마음의 상처가 겉으로만 무뎌졌습니다.' },
      { text: '괴로운 마음에 술로 나날을 보낸다', effects: { happy: -7, health: -6 }, result: '몸도 마음도 함께 무너져 내렸습니다.' },
    ] },
    { id: 'yng_scholarship', domain: '인성', minAge: 19, maxAge: 26, title: '장학금 기회', desc: '노력한 성과를 인정받아 장학금 지원 기회가 생겼습니다.', choices: [
      { text: '서류를 꼼꼼히 준비해 지원한다', effects: { wealth: 7, wisdom: 3 }, result: '꼼꼼한 준비 덕에 장학금을 받게 되었습니다.' },
      { text: '되든 안 되든 편하게 지원해본다', effects: { wealth: 3 }, result: '큰 기대 없이 지원했는데 좋은 결과를 얻었습니다.' },
      { text: '귀찮아서 지원 자체를 미루다 놓친다', effects: { happy: -3 }, result: '아까운 기회를 그냥 흘려보냈습니다.' },
      { text: '서류를 대충 준비해 제출한다', effects: { wisdom: -2, happy: -2 }, result: '성의 없는 준비가 결과로 이어지지 않았습니다.' },
    ] },
    { id: 'yng_carbuy', domain: '재성', minAge: 22, maxAge: 33, title: '첫 차 구입', desc: '생애 첫 자동차를 살지 고민하게 되었습니다.', choices: [
      { text: '예산에 맞는 중고차를 꼼꼼히 알아본다', effects: { happy: 5, wealth: -4 }, result: '합리적인 선택으로 만족스러운 첫 차를 얻었습니다.' },
      { text: '당분간 대중교통으로 만족하기로 한다', effects: { wealth: 2 }, result: '무리하지 않고 다음 기회를 기다리기로 했습니다.' },
      { text: '할부로 무리해서 새 차를 산다', effects: { wealth: -8, happy: 2 }, result: '기분은 좋았지만 매달 할부금이 부담됐습니다.' },
      { text: '덜컥 고가의 차를 계약한다', effects: { wealth: -13, happy: 1 }, result: '순간의 기분으로 지른 계약에 지갑이 크게 휘청였습니다.' },
    ] },
    { id: 'yng_credit', domain: '재성', minAge: 19, maxAge: 32, title: '카드값 압박', desc: '생각 없이 쓴 카드값 고지서를 보고 깜짝 놀랐습니다.', choices: [
      { text: '지출 내역을 점검하고 씀씀이를 줄인다', effects: { wisdom: 5, wealth: -2 }, result: '지출 습관을 돌아보며 씀씀이를 바로잡았습니다.' },
      { text: '이번 달만 허리띠를 졸라맨다', effects: { wealth: -1 }, result: '잠깐의 절약으로 고비를 넘겼습니다.' },
      { text: '일단 최소 금액만 내고 미룬다', effects: { wealth: -6, wisdom: -2 }, result: '이자가 붙으며 부담이 점점 커졌습니다.' },
      { text: '돌려막기로 더 큰 빚을 만든다', effects: { wealth: -14, happy: -4 }, result: '눈덩이처럼 불어난 빚에 마음이 무거워졌습니다.' },
    ] },
    { id: 'yng_group_project', domain: '비겁', minAge: 19, maxAge: 29, title: '팀플 갈등', desc: '함께하는 프로젝트에서 팀원과 의견이 크게 엇갈립니다.', choices: [
      { text: '서로의 입장을 듣고 절충안을 찾는다', effects: { fame: 5, wisdom: 2 }, result: '차분한 조율 끝에 팀워크가 오히려 단단해졌습니다.' },
      { text: '맡은 몫만 확실히 해낸다', effects: { fame: 2 }, result: '자기 역할에 충실하며 무난히 넘어갔습니다.' },
      { text: '갈등이 불편해 대충 넘어간다', effects: { happy: -3 }, result: '찜찜함을 남긴 채 결과물도 아쉬웠습니다.' },
      { text: '감정적으로 부딪혀 관계가 틀어진다', effects: { fame: -6, happy: -3 }, result: '팀 분위기가 크게 상하고 말았습니다.' },
    ] },
    { id: 'yng_bodypain', domain: '인성', minAge: 22, maxAge: 35, title: '직업병', desc: '같은 자세로 오래 일하다 보니 몸 여기저기가 아파옵니다.', choices: [
      { text: '전문적인 치료와 자세 교정을 받는다', effects: { health: 7, wealth: -3 }, result: '제대로 된 관리로 통증이 눈에 띄게 줄었습니다.' },
      { text: '스트레칭 등으로 틈틈이 관리한다', effects: { health: 3 }, result: '작은 습관들이 쌓여 몸이 한결 편해졌습니다.' },
      { text: '바빠서 계속 방치한다', effects: { health: -4 }, result: '통증이 좀처럼 나아지지 않고 이어졌습니다.' },
      { text: '통증을 참고 계속 무리한다', effects: { health: -9, happy: -2 }, result: '결국 크게 탈이 나 일상에 지장이 생겼습니다.' },
    ] },
    { id: 'yng_language', domain: '인성', minAge: 19, maxAge: 33, title: '새로운 도전', desc: '외국어(혹은 새로운 자격)에 도전해볼까 고민합니다.', choices: [
      { text: '꾸준한 계획을 세워 매일 학습한다', effects: { wisdom: 8, happy: 1 }, result: '꾸준함이 쌓여 눈에 띄는 실력 향상을 이뤘습니다.' },
      { text: '부담 없이 취미처럼 배운다', effects: { wisdom: 3, happy: 2 }, result: '즐기면서 배우니 부담 없이 실력이 늘었습니다.' },
      { text: '의욕만 앞서다 흐지부지된다', effects: { wisdom: -2, happy: -2 }, result: '작심삼일로 끝나 아쉬움만 남았습니다.' },
      { text: '비싼 교재와 강의만 결제하고 손 놓는다', effects: { wealth: -6, wisdom: -2 }, result: '돈만 쓰고 실속은 챙기지 못했습니다.' },
    ] },
    { id: 'yng_sibling', domain: '비겁', minAge: 19, maxAge: 35, title: '형제자매와의 갈등', desc: '가족 문제로 형제자매와 의견이 부딪혔습니다.', choices: [
      { text: '시간을 두고 차분히 대화를 시도한다', effects: { happy: 5, fame: 2 }, result: '진솔한 대화 끝에 오해를 풀었습니다.' },
      { text: '일단 감정이 가라앉기를 기다린다', effects: { happy: 1 }, result: '시간이 지나며 자연스레 누그러졌습니다.' },
      { text: '서로 연락을 피하며 지낸다', effects: { happy: -3 }, result: '서먹한 사이가 한동안 이어졌습니다.' },
      { text: '묵은 감정까지 꺼내며 크게 다툰다', effects: { happy: -7, fame: -2 }, result: '돌이키기 힘든 앙금을 남기고 말았습니다.' },
    ] },
    { id: 'yng_volunteering', domain: '식상', minAge: 19, maxAge: 35, title: '봉사활동', desc: '우연한 기회로 봉사활동에 참여하게 되었습니다.', choices: [
      { text: '꾸준히 참여하며 의미를 찾아간다', effects: { happy: 6, fame: 3 }, result: '나누는 기쁨 속에서 삶의 의미를 새로 느꼈습니다.' },
      { text: '가벼운 마음으로 한 번 참여해본다', effects: { happy: 3 }, result: '색다른 경험으로 기분 좋은 하루를 보냈습니다.' },
      { text: '귀찮은 마음에 대충 시간만 때운다', effects: { happy: -1 }, result: '마지못해 참여하다 보니 남는 것이 적었습니다.' },
      { text: '번거로움에 도중에 그만둔다', effects: { happy: -3, fame: -2 }, result: '중도 포기가 마음에 걸림돌로 남았습니다.' },
    ] },

    // ── 장년기 36-55 ──
    { id: 'adt_promo', domain: '관성', minAge: 30, maxAge: 55, title: '승진 기회', desc: '치열한 경쟁 끝에 승진 기회가 찾아왔습니다.', choices: [
      { text: '그간의 실적을 정리해 적극적으로 어필한다', effects: { wealth: 10, fame: 5, health: -2 }, result: '노력 끝에 당당히 승진에 성공했습니다.' },
      { text: '맡은 업무만 묵묵히 해낸다', effects: { happy: 4, health: 2 }, result: '무리하지 않고 워라밸을 지켰습니다.' },
      { text: '동료들보다 앞서기 위해 일정을 빡빡하게 잡는다', effects: { wealth: 2, health: -6 }, result: '애는 썼지만 성과 없이 몸만 상했습니다.' },
      { text: '윗사람들 사이의 알력에 발을 담근다', effects: { fame: -6, happy: -5 }, result: '억울하게 기회를 놓치고 마음도 크게 다쳤습니다.' },
    ] },
    { id: 'adt_invest', domain: '재성', minAge: 28, maxAge: 55, title: '재테크 고민', desc: '모아둔 돈을 어떻게 굴릴지 고민이 됩니다.', choices: [
      { text: '관련 자료를 찾아보고 나눠서 투자한다', effects: { wealth: 11, wisdom: 2 }, result: '신중한 분석 덕에 안정적으로 수익을 냈습니다.' },
      { text: '적금에 꾸준히 돈을 넣는다', effects: { wealth: 4, happy: 1 }, result: '느리지만 꾸준히 자산을 불렸습니다.' },
      { text: '주변에서 좋다는 종목에 돈을 넣는다', effects: { wealth: -6 }, result: '성급한 판단으로 손해를 보고 말았습니다.' },
      { text: '대출까지 받아 한 곳에 크게 투자한다', effects: { wealth: -16, happy: -5, health: -2 }, result: '시장이 무너지며 감당 못할 빚만 남았습니다.' },
    ] },
    { id: 'adt_home', domain: '재성', minAge: 30, maxAge: 50, title: '내 집 마련', desc: '드디어 내 집을 마련할 기회가 생겼습니다.', choices: [
      { text: '여러 매물을 비교해보고 대출 규모를 정한다', effects: { wealth: -5, happy: 7, fame: 2 }, result: '감당 가능한 선에서 안정된 보금자리를 얻었습니다.' },
      { text: '조금 더 자금을 모으기로 한다', effects: { wealth: 4, happy: -1 }, result: '신중하게 때를 기다리기로 했습니다.' },
      { text: '마음에 드는 곳을 발견해 서둘러 계약한다', effects: { wealth: -10, happy: 2, health: -2 }, result: '집은 샀지만 매달 이자에 시달리게 되었습니다.' },
      { text: '시세 차익을 노리고 매입 규모를 키운다', effects: { wealth: -16, health: -4, happy: -5 }, result: '큰 빚더미에 앉아 오랫동안 고생했습니다.' },
    ] },
    { id: 'adt_health', domain: '관성', minAge: 35, maxAge: 55, title: '건강 적신호', desc: '건강검진에서 관리가 필요하다는 소견을 들었습니다.', choices: [
      { text: '식단과 운동 루틴을 새로 짠다', effects: { health: 10, happy: -1 }, result: '운동과 식단 관리로 몸이 눈에 띄게 좋아졌습니다.' },
      { text: '할 수 있는 만큼씩 조금씩 관리한다', effects: { health: 4 }, result: '무리하지 않는 선에서 조금씩 관리했습니다.' },
      { text: '일단 하던 대로 지낸다', effects: { health: -5 }, result: '당장은 편했지만 몸이 조금씩 나빠졌습니다.' },
      { text: '몸이 보내는 신호를 계속 뒤로 미룬다', effects: { health: -12, wealth: -4 }, result: '결국 크게 탈이 나 큰 병원비를 치렀습니다.' },
    ] },
    { id: 'adt_switch', domain: '관성', minAge: 32, maxAge: 55, title: '이직 고민', desc: '더 나은 조건의 이직 제안을 받았습니다.', choices: [
      { text: '여러 곳을 알아보고 조건을 비교한다', effects: { wealth: 8, happy: 4, fame: 1 }, result: '새 직장에서 성공적으로 적응했습니다.' },
      { text: '지금 자리에 계속 머무른다', effects: { happy: 2, fame: 2 }, result: '쌓아온 신뢰와 안정감을 지켰습니다.' },
      { text: '제안받은 곳에 바로 답을 준다', effects: { wealth: 2, happy: -4 }, result: '막상 옮기고 보니 기대와 많이 달랐습니다.' },
      { text: '별다른 계획 없이 사표부터 낸다', effects: { wealth: -8, happy: -6, fame: -3 }, result: '앞뒤 재지 않은 결정을 오래도록 후회했습니다.' },
    ] },
    { id: 'adt_relation', domain: '비겁', minAge: 30, maxAge: 55, title: '인간관계의 무게', desc: '직장과 사회에서의 인간관계에 지쳐갑니다.', choices: [
      { text: '시간을 내어 속마음을 터놓고 이야기한다', effects: { happy: 6, fame: 2 }, result: '진심이 통해 관계가 한결 편안해졌습니다.' },
      { text: '필요한 만큼만 거리를 두고 지낸다', effects: { happy: 3 }, result: '마음의 짐을 조금 덜고 편해졌습니다.' },
      { text: '불편한 내색 없이 계속 맞춰준다', effects: { happy: -4, health: -2 }, result: '쌓인 스트레스가 몸으로 나타나기 시작했습니다.' },
      { text: '쌓인 감정을 한번에 쏟아낸다', effects: { fame: -6, happy: -6 }, result: '오래된 인연이 돌이키기 힘들게 끊어졌습니다.' },
    ] },
    { id: 'adt_hobby', domain: '식상', minAge: 36, maxAge: 55, title: '나를 위한 시간', desc: '오랜만에 온전히 나를 위한 취미나 자기계발을 시작해볼까 합니다.', choices: [
      { text: '새로운 강좌나 모임에 등록한다', effects: { happy: 7, wisdom: 3, wealth: -2 }, result: '오랜만에 나만의 즐거움을 제대로 되찾았습니다.' },
      { text: '가족과 함께할 수 있는 것을 찾는다', effects: { happy: 4, fame: 1 }, result: '소소하지만 따뜻한 시간을 보냈습니다.' },
      { text: '딱히 정하지 않고 흘러가는 대로 둔다', effects: { happy: 1 }, result: '딱히 남는 것 없이 시간만 지나갔습니다.' },
      { text: '새로 빠진 것에 남는 시간을 모두 쓴다', effects: { happy: 3, fame: -4, wealth: -3 }, result: '균형을 잃어 주변의 신뢰를 잃고 말았습니다.' },
    ] },
    { id: 'adt_mentor', domain: '인성', minAge: 36, maxAge: 55, title: '뜻밖의 조언', desc: '존경하던 선배(혹은 스승)에게서 중요한 조언을 듣게 되었습니다.', choices: [
      { text: '조언을 곱씹어보고 계획을 조정한다', effects: { wisdom: 8, happy: 3 }, result: '새로운 시각을 얻고 한층 성장했습니다.' },
      { text: '일단 새겨듣되 하던 대로 밀고 나간다', effects: { wisdom: 2, fame: 2 }, result: '나만의 방식을 지키며 나아갔습니다.' },
      { text: '듣고도 크게 신경 쓰지 않는다', effects: { wisdom: -2, happy: -2 }, result: '나중에서야 그 조언의 무게를 깨달았습니다.' },
      { text: '기분이 상해 날 선 말로 되받아친다', effects: { fame: -5, wisdom: -3 }, result: '좋은 인연을 감정적으로 놓치고 말았습니다.' },
    ] },
    { id: 'adt_kids_edu', domain: '인성', minAge: 32, maxAge: 55, title: '자녀 교육 고민', desc: '아이의 교육 방향을 두고 고민이 깊어집니다.', choices: [
      { text: '아이와 충분히 대화하며 방향을 함께 정한다', effects: { happy: 7, wisdom: 3, wealth: -3 }, result: '아이와의 신뢰도 쌓고 방향도 잘 잡았습니다.' },
      { text: '무리하지 않는 선에서 지원한다', effects: { happy: 3, wealth: -1 }, result: '부담 없이 꾸준한 지원을 이어갔습니다.' },
      { text: '유행한다는 사교육에 무작정 큰돈을 쓴다', effects: { wealth: -9, happy: -2 }, result: '큰돈만 나가고 큰 효과는 보지 못했습니다.' },
      { text: '바쁘다는 핑계로 신경을 거의 못 쓴다', effects: { happy: -6, fame: -2 }, result: '아이와의 사이가 조금씩 서먹해졌습니다.' },
    ] },
    { id: 'adt_parent_care', domain: '인성', minAge: 35, maxAge: 55, title: '부모님 건강', desc: '연로하신 부모님의 건강이 예전 같지 않아 걱정이 됩니다.', choices: [
      { text: '시간을 내어 병원에 모시고 다닌다', effects: { happy: 5, health: -2, wealth: -4 }, result: '고단했지만 부모님도 마음도 한결 편안해졌습니다.' },
      { text: '형제자매와 역할을 나누어 돌본다', effects: { happy: 3, wealth: -2 }, result: '부담을 나누며 무리 없이 챙길 수 있었습니다.' },
      { text: '바쁘다는 이유로 자꾸 미룬다', effects: { happy: -4 }, result: '마음 한구석이 계속 무거웠습니다.' },
      { text: '거의 신경 쓰지 못한 채 지낸다', effects: { happy: -7, fame: -3 }, result: '뒤늦은 후회와 함께 가족의 서운함을 샀습니다.' },
    ] },
    { id: 'adt_layoff', domain: '관성', minAge: 32, maxAge: 55, title: '구조조정 소식', desc: '회사에 구조조정 이야기가 돌며 불안한 분위기가 감돕니다.', choices: [
      { text: '실력을 더 쌓으며 이직도 함께 준비한다', effects: { wealth: 6, wisdom: 4, health: -2 }, result: '만약을 대비한 준비 덕에 흔들리지 않았습니다.' },
      { text: '동요하지 않고 맡은 일에 집중한다', effects: { fame: 3, happy: 1 }, result: '묵묵한 태도가 오히려 신뢰로 돌아왔습니다.' },
      { text: '불안한 마음에 일이 손에 잡히지 않는다', effects: { happy: -4, wisdom: -2 }, result: '불안 속에 한동안 집중하지 못했습니다.' },
      { text: '소문에 휩쓸려 성급하게 사표를 낸다', effects: { wealth: -10, happy: -5 }, result: '성급한 결정을 오래도록 후회했습니다.' },
    ] },
    { id: 'adt_lawsuit', domain: '관성', minAge: 33, maxAge: 55, title: '억울한 분쟁', desc: '억울하게 계약(혹은 거래) 관련 분쟁에 휘말렸습니다.', choices: [
      { text: '전문가의 조언을 받아 차분히 대응한다', effects: { fame: 4, wealth: -5, wisdom: 3 }, result: '비용은 들었지만 정당하게 문제를 풀었습니다.' },
      { text: '원만한 합의를 시도한다', effects: { wealth: -3, happy: 1 }, result: '적당한 선에서 마무리 지었습니다.' },
      { text: '대응하지 않고 그냥 넘어간다', effects: { wealth: -6, fame: -2 }, result: '손해를 본 채로 흐지부지 넘어갔습니다.' },
      { text: '감정적으로 맞서다 일을 더 키운다', effects: { wealth: -11, fame: -5, happy: -3 }, result: '일이 커지며 손해와 앙금만 남았습니다.' },
    ] },
    { id: 'adt_reunion', domain: '비겁', minAge: 35, maxAge: 55, title: '동창 모임', desc: '오랜만에 동창 모임에 나가게 되었습니다.', choices: [
      { text: '반가운 얼굴들과 즐겁게 어울린다', effects: { happy: 6, fame: 2 }, result: '오랜만의 만남으로 마음이 훈훈해졌습니다.' },
      { text: '잠깐 얼굴만 비추고 돌아온다', effects: { happy: 2 }, result: '부담 없이 짧게 안부를 나누고 왔습니다.' },
      { text: '비교하는 분위기에 마음이 상한다', effects: { happy: -4 }, result: '돌아오는 길이 왠지 씁쓸했습니다.' },
      { text: '허세를 부리다 무리한 지출을 한다', effects: { wealth: -7, happy: -1 }, result: '괜한 자존심에 지갑만 얇아졌습니다.' },
    ] },
    { id: 'adt_burnout', domain: '식상', minAge: 35, maxAge: 55, title: '번아웃', desc: '오랜 시간 쉼 없이 달려온 탓인지 무기력함이 몰려옵니다.', choices: [
      { text: '휴가를 내고 충분히 쉬어간다', effects: { happy: 7, health: 3, wealth: -2 }, result: '푹 쉬고 나니 다시 힘이 났습니다.' },
      { text: '틈틈이 짧은 휴식을 챙긴다', effects: { happy: 3, health: 1 }, result: '조금씩이나마 숨 돌릴 틈을 챙겼습니다.' },
      { text: '그냥 참고 계속 버틴다', effects: { happy: -4, health: -3 }, result: '지친 몸과 마음이 좀처럼 회복되지 않았습니다.' },
      { text: '아무 대책 없이 일을 손에서 놓아버린다', effects: { wealth: -6, happy: -3, fame: -3 }, result: '갑작스러운 공백에 주변까지 곤란해졌습니다.' },
    ] },
    { id: 'adt_divorce_thought', domain: '식상', minAge: 33, maxAge: 55, title: '권태기', desc: '배우자(혹은 반려자)와의 사이에 권태기가 찾아왔습니다.', choices: [
      { text: '시간을 내어 관계 회복을 위해 노력한다', effects: { happy: 7, wealth: -2 }, result: '함께 노력한 끝에 다시 가까워졌습니다.' },
      { text: '각자의 시간을 존중하며 지켜본다', effects: { happy: 2 }, result: '무리하지 않고 자연스럽게 흘러가도록 두었습니다.' },
      { text: '문제를 외면한 채 지낸다', effects: { happy: -4 }, result: '외면한 문제가 조용히 쌓여갔습니다.' },
      { text: '갈등 끝에 크게 틀어진다', effects: { happy: -9, wealth: -6 }, result: '돌이키기 힘든 갈등으로 마음이 크게 상했습니다.' },
    ] },
    { id: 'adt_franchise', domain: '재성', minAge: 35, maxAge: 55, title: '프랜차이즈 창업', desc: '안정적인 프랜차이즈 창업을 제안받았습니다.', choices: [
      { text: '상권과 조건을 꼼꼼히 분석하고 시작한다', effects: { wealth: 10, happy: 2 }, result: '철저한 분석 덕에 안정적으로 자리 잡았습니다.' },
      { text: '소자본으로 작게 시작해본다', effects: { wealth: 4 }, result: '무리하지 않고 차근차근 매장을 키워갔습니다.' },
      { text: '분위기에 휩쓸려 계약부터 한다', effects: { wealth: -9, happy: -2 }, result: '준비 부족이 그대로 손해로 이어졌습니다.' },
      { text: '무리한 대출로 큰 매장을 낸다', effects: { wealth: -15, health: -3 }, result: '감당 못할 대출 이자에 오래도록 시달렸습니다.' },
    ] },
    { id: 'adt_realestate_loss', domain: '재성', minAge: 33, maxAge: 55, title: '부동산 하락', desc: '가지고 있던 부동산 가격이 크게 떨어졌습니다.', choices: [
      { text: '장기적인 관점에서 담담히 지켜본다', effects: { wisdom: 4, happy: -1 }, result: '흔들리지 않는 태도로 상황을 잘 넘겼습니다.' },
      { text: '상황을 지켜보며 대응을 미룬다', effects: { happy: -2 }, result: '불안한 마음으로 시세를 지켜봤습니다.' },
      { text: '불안한 마음에 손해를 보고 처분한다', effects: { wealth: -8, happy: -3 }, result: '성급한 처분이 손해로 돌아왔습니다.' },
      { text: '공포에 휩쓸려 헐값에 급매한다', effects: { wealth: -14, happy: -5 }, result: '공포에 떠밀린 결정을 두고두고 후회했습니다.' },
    ] },
    { id: 'adt_award', domain: '관성', minAge: 33, maxAge: 55, title: '업계의 인정', desc: '그동안의 노력을 인정받아 상을 받을 기회가 생겼습니다.', choices: [
      { text: '겸손하게, 그러나 당당히 수상한다', effects: { fame: 8, happy: 4 }, result: '노력을 제대로 인정받아 뿌듯한 하루였습니다.' },
      { text: '큰 기대 없이 담담하게 참석한다', effects: { fame: 3 }, result: '담담한 태도로 자리를 잘 마무리했습니다.' },
      { text: '부담스러워 자리를 피한다', effects: { happy: -2 }, result: '아까운 기회를 스스로 피하고 말았습니다.' },
      { text: '우쭐해져 주변에 과시하고 다닌다', effects: { fame: -5, happy: -2 }, result: '지나친 과시가 오히려 눈총을 샀습니다.' },
    ] },
    { id: 'adt_coworker_conflict', domain: '비겁', minAge: 30, maxAge: 55, title: '동료와의 갈등', desc: '가깝게 지내던 동료와 업무 방식 차이로 부딪혔습니다.', choices: [
      { text: '솔직한 대화로 오해를 풀어간다', effects: { happy: 5, fame: 2 }, result: '솔직한 대화 끝에 사이가 오히려 돈독해졌습니다.' },
      { text: '적당히 거리를 두고 지낸다', effects: { happy: 2 }, result: '적당한 거리를 두며 무난히 지냈습니다.' },
      { text: '불편해도 내색하지 않고 참는다', effects: { happy: -3, health: -1 }, result: '쌓인 불편함이 스트레스로 이어졌습니다.' },
      { text: '다른 동료들 앞에서 크게 맞선다', effects: { fame: -6, happy: -4 }, result: '공개적인 갈등에 평판이 크게 흔들렸습니다.' },
    ] },
    { id: 'adt_stock_crash', domain: '재성', minAge: 30, maxAge: 55, title: '주식 폭락장', desc: '갑작스러운 폭락장에 투자한 자산이 크게 흔들립니다.', choices: [
      { text: '분산된 포트폴리오 덕에 크게 흔들리지 않는다', effects: { wisdom: 4, wealth: -2 }, result: '평소의 신중함 덕에 손실을 최소화했습니다.' },
      { text: '동요하지 않고 장기적으로 지켜본다', effects: { wisdom: 2 }, result: '흔들리지 않는 마음으로 폭풍을 넘겼습니다.' },
      { text: '불안한 마음에 손해를 보고 정리한다', effects: { wealth: -9 }, result: '저점에서 정리하며 손실을 확정지었습니다.' },
      { text: '패닉에 빠져 무리하게 물타기를 한다', effects: { wealth: -15, happy: -4 }, result: '패닉 속 판단이 더 큰 손실로 돌아왔습니다.' },
    ] },
    { id: 'adt_side_business', domain: '재성', minAge: 32, maxAge: 55, title: '부업의 사업화', desc: '취미 삼아 하던 부업이 꽤 잘 되어 사업화를 고민합니다.', choices: [
      { text: '차근차근 규모를 키우며 사업자를 낸다', effects: { wealth: 9, happy: 3 }, result: '체계적인 확장으로 탄탄하게 자리 잡았습니다.' },
      { text: '지금 규모를 유지하며 지켜본다', effects: { wealth: 3, happy: 1 }, result: '무리하지 않고 꾸준한 수입을 유지했습니다.' },
      { text: '준비 없이 성급하게 확장한다', effects: { wealth: -7, health: -2 }, result: '준비 부족이 고스란히 손실로 이어졌습니다.' },
      { text: '무리한 대출로 크게 벌인다', effects: { wealth: -14, health: -3 }, result: '과도한 확장이 감당 못할 빚으로 돌아왔습니다.' },
    ] },
    { id: 'adt_networking', domain: '비겁', minAge: 30, maxAge: 55, title: '인맥 모임', desc: '업계 사람들이 모이는 자리에 초대를 받았습니다.', choices: [
      { text: '적극적으로 다가가 좋은 인연을 만든다', effects: { fame: 6, happy: 2 }, result: '좋은 인연들을 만나 앞으로에 큰 힘이 되었습니다.' },
      { text: '가볍게 얼굴을 비추고 온다', effects: { fame: 2 }, result: '부담 없이 안면을 넓히고 돌아왔습니다.' },
      { text: '낯을 가리다 별 소득 없이 돌아온다', effects: { happy: -2 }, result: '어색함 속에 별다른 소득이 없었습니다.' },
      { text: '무리하게 어울리다 실수를 저지른다', effects: { fame: -5, happy: -2 }, result: '과음 끝에 저지른 실수가 두고두고 부끄러웠습니다.' },
    ] },
    { id: 'adt_health_scare', domain: '인성', minAge: 38, maxAge: 55, title: '중대 질병 진단', desc: '건강검진에서 정밀검사가 필요하다는 소견을 받았습니다.', choices: [
      { text: '즉시 정밀검사와 치료를 받는다', effects: { health: 9, wealth: -6 }, result: '빠른 대처 덕에 건강을 잘 지켜냈습니다.' },
      { text: '경과를 지켜보며 관리한다', effects: { health: 3, wealth: -2 }, result: '차분한 관리로 상태를 잘 유지했습니다.' },
      { text: '바쁘다는 핑계로 검사를 미룬다', effects: { health: -5 }, result: '미루는 사이 몸 상태가 나빠졌습니다.' },
      { text: '두려운 마음에 계속 외면한다', effects: { health: -12, happy: -4 }, result: '뒤늦은 대처로 몸과 마음이 크게 지쳤습니다.' },
    ] },
    { id: 'adt_car_accident', domain: '관성', minAge: 30, maxAge: 55, title: '교통사고', desc: '운전 중 작지 않은 교통사고를 겪었습니다.', choices: [
      { text: '절차대로 침착하게 처리한다', effects: { wisdom: 3, wealth: -4 }, result: '침착한 대응으로 큰 탈 없이 마무리했습니다.' },
      { text: '다행히 크게 다치지 않아 안도한다', effects: { happy: 1, wealth: -3 }, result: '놀란 가슴을 쓸어내리며 안도했습니다.' },
      { text: '놀란 마음에 처리를 미룬다', effects: { happy: -3, wealth: -3 }, result: '미뤄둔 처리에 뒤늦게 골머리를 앓았습니다.' },
      { text: '제대로 대응 못 해 손해를 크게 본다', effects: { wealth: -11, health: -3 }, result: '미숙한 대응이 더 큰 손해로 돌아왔습니다.' },
    ] },

    // ── 중년기 56-70 ──
    { id: 'mid_retire', domain: '식상', minAge: 55, maxAge: 65, title: '은퇴 준비', desc: '은퇴 후의 삶을 어떻게 꾸릴지 고민이 됩니다.', choices: [
      { text: '배우고 싶던 것과 소일거리를 함께 찾아본다', effects: { happy: 7, wealth: 3 }, result: '텃밭 가꾸기와 소일거리로 활기찬 나날을 보냈습니다.' },
      { text: '하던 일을 규모만 줄여 이어간다', effects: { wealth: 4, health: -1 }, result: '소일거리를 하며 생활에 여유를 더했습니다.' },
      { text: '특별한 계획 없이 하루하루를 보낸다', effects: { happy: -3 }, result: '무료한 나날에 마음이 조금씩 허전해졌습니다.' },
      { text: '새로운 사업 아이템에 자금을 투입한다', effects: { wealth: -12, happy: -4 }, result: '뒤늦은 도전이 큰 손실로 돌아왔습니다.' },
    ] },
    { id: 'mid_checkup', domain: '인성', minAge: 56, maxAge: 75, title: '정기 건강검진', desc: '나이가 들며 건강검진이 중요해졌습니다.', choices: [
      { text: '정밀검사까지 포함해 꼼꼼히 받는다', effects: { health: 8, wealth: -3 }, result: '이상 소견을 조기에 발견하고 잘 관리했습니다.' },
      { text: '기본 항목만 간단히 받는다', effects: { health: -1 }, result: '큰 이상 없이 무난히 넘어갔습니다.' },
      { text: '다음으로 미루고 넘어간다', effects: { health: -4 }, result: '미루는 사이 몸 상태가 조금씩 나빠졌습니다.' },
      { text: '몸이 이상해도 검진을 계속 피한다', effects: { health: -10, wealth: -8 }, result: '초기에 잡았으면 좋았을 병이 크게 자랐습니다.' },
    ] },
    { id: 'mid_hobby', domain: '식상', minAge: 56, maxAge: 70, title: '여유로운 취미', desc: '시간적 여유가 생겨 새로운 것을 배워볼까 합니다.', choices: [
      { text: '동호회에 가입해 사람들과 어울린다', effects: { happy: 6, fame: 3, wealth: -2 }, result: '비슷한 또래와 어울리며 활력을 되찾았습니다.' },
      { text: '혼자 할 수 있는 것을 찾아 즐긴다', effects: { happy: 4, wisdom: 2 }, result: '고요한 시간 속에서 마음의 평화를 얻었습니다.' },
      { text: '딱히 하고 싶은 게 없어 그냥 지낸다', effects: { happy: -3 }, result: '무기력함이 마음을 짓눌렀습니다.' },
      { text: '몸 상태를 생각지 않고 활동에 몰두한다', effects: { happy: 2, health: -5 }, result: '의욕이 앞서 몸에 무리가 왔습니다.' },
    ] },
    { id: 'mid_grandchild', domain: '식상', minAge: 55, maxAge: 75, title: '손주 재롱', desc: '오랜만에 만난 어린 조카(혹은 손주)가 재롱을 부립니다.', choices: [
      { text: '하루 시간을 비워 함께 놀아준다', effects: { happy: 8, health: -1 }, result: '웃음 가득한 시간을 보내며 행복해했습니다.' },
      { text: '용돈을 넉넉히 쥐여준다', effects: { happy: 4, wealth: -3 }, result: '환하게 웃는 모습에 덩달아 기분이 좋아졌습니다.' },
      { text: '피곤한 티를 내며 건성으로 대한다', effects: { happy: -2 }, result: '아이의 서운한 표정에 마음이 편치 않았습니다.' },
      { text: '쌓인 짜증을 그대로 드러낸다', effects: { happy: -5, fame: -2 }, result: '두고두고 후회할 말을 내뱉고 말았습니다.' },
    ] },
    { id: 'mid_move', domain: '재성', minAge: 56, maxAge: 70, title: '노후 거처 고민', desc: '지금 사는 곳을 계속 지킬지, 옮길지 고민이 됩니다.', choices: [
      { text: '충분히 알아보고 적당한 곳으로 옮긴다', effects: { happy: 6, wealth: -3 }, result: '생활하기 더 편한 곳으로 자리를 잘 옮겼습니다.' },
      { text: '지금 사는 곳을 그대로 지킨다', effects: { happy: 2, wealth: 2 }, result: '익숙한 곳에서 편안하게 지냈습니다.' },
      { text: '별생각 없이 결정을 미룬다', effects: { happy: -2 }, result: '뚜렷한 결정 없이 시간만 흘러갔습니다.' },
      { text: '성급하게 결정해 손해를 본다', effects: { wealth: -9, happy: -3 }, result: '서두른 결정에 손해와 후회가 남았습니다.' },
    ] },
    { id: 'mid_secondlife', domain: '관성', minAge: 56, maxAge: 68, title: '제2의 인생', desc: '새로운 일이나 배움에 다시 도전해볼까 고민합니다.', choices: [
      { text: '차근차근 준비해 새 일을 시작한다', effects: { wealth: 6, happy: 5, wisdom: 2 }, result: '새로운 활력과 함께 제법 짭짤한 보람도 얻었습니다.' },
      { text: '부담 없는 선에서 조금씩 알아본다', effects: { happy: 3, wisdom: 2 }, result: '느긋하게 가능성을 넓혀갔습니다.' },
      { text: '엄두가 나지 않아 미루기만 한다', effects: { happy: -3 }, result: '망설이는 사이 의욕도 조금씩 사그라들었습니다.' },
      { text: '무리하게 뛰어들었다가 손해를 본다', effects: { wealth: -8, happy: -3 }, result: '준비 없는 도전이 손실로 돌아왔습니다.' },
    ] },
    { id: 'mid_couple', domain: '식상', minAge: 55, maxAge: 70, title: '부부(혹은 반려자)의 시간', desc: '자녀들이 독립한 뒤, 배우자(혹은 반려자)와 둘만의 시간이 늘었습니다.', choices: [
      { text: '함께할 수 있는 새로운 취미를 찾는다', effects: { happy: 8, wealth: -2 }, result: '둘만의 새로운 즐거움을 찾아 다시 가까워졌습니다.' },
      { text: '각자의 시간도 존중하며 지낸다', effects: { happy: 4 }, result: '적당한 거리 속에 편안한 사이를 유지했습니다.' },
      { text: '서먹한 분위기를 그냥 내버려 둔다', effects: { happy: -3 }, result: '데면데면한 시간이 계속 이어졌습니다.' },
      { text: '사소한 일로 다투다 마음이 상한다', effects: { happy: -6, fame: -1 }, result: '작은 다툼이 오래가는 서운함으로 남았습니다.' },
    ] },
    { id: 'mid_finance', domain: '재성', minAge: 60, maxAge: 80, title: '노후 자금 점검', desc: '남은 삶을 위해 모아둔 자금을 다시 점검해볼 때가 되었습니다.', choices: [
      { text: '전문가와 함께 꼼꼼히 계획을 세운다', effects: { wealth: 7, wisdom: 3 }, result: '체계적인 계획 덕에 마음이 한결 든든해졌습니다.' },
      { text: '아끼며 있는 자금을 지켜간다', effects: { wealth: 3 }, result: '무리하지 않고 자금을 잘 지켰습니다.' },
      { text: '점검을 미루고 그냥 지낸다', effects: { wealth: -3 }, result: '막연한 불안이 계속 마음 한구석에 남았습니다.' },
      { text: '불안한 마음에 무리한 곳에 손을 댄다', effects: { wealth: -12, happy: -4 }, result: '조급함이 부른 손실에 마음이 크게 무거워졌습니다.' },
    ] },
    { id: 'mid_inheritance', domain: '재성', minAge: 55, maxAge: 75, title: '상속 문제', desc: '부모님(혹은 친척)의 유산 문제로 가족 간 이야기가 오갑니다.', choices: [
      { text: '가족과 터놓고 대화해 원만히 정리한다', effects: { happy: 6, fame: 2 }, result: '솔직한 대화 덕에 갈등 없이 잘 정리했습니다.' },
      { text: '욕심내지 않고 흘러가는 대로 따른다', effects: { happy: 2 }, result: '무리하지 않고 담담하게 받아들였습니다.' },
      { text: '서운한 마음을 속으로만 삭인다', effects: { happy: -4 }, result: '말 못 한 서운함이 마음에 쌓였습니다.' },
      { text: '재산 문제로 크게 다투고 만다', effects: { happy: -8, fame: -4 }, result: '돈 문제로 가족 간 골이 깊어졌습니다.' },
    ] },
    { id: 'mid_travel', domain: '식상', minAge: 56, maxAge: 70, title: '은퇴 후 여행', desc: '시간 여유가 생겨 오래 벼르던 여행을 계획합니다.', choices: [
      { text: '예산을 세워 알찬 일정으로 다녀온다', effects: { happy: 8, wealth: -5 }, result: '알찬 일정으로 오랫동안 기억에 남을 여행을 했습니다.' },
      { text: '짧고 가벼운 일정으로 다녀온다', effects: { happy: 4, wealth: -2 }, result: '부담 없이 기분 좋은 나들이를 다녀왔습니다.' },
      { text: '막상 귀찮아져 계획을 접는다', effects: { happy: -2 }, result: '벼르던 계획을 결국 접고 말았습니다.' },
      { text: '즉흥적으로 무리한 장기 여행을 떠난다', effects: { wealth: -11, health: -3 }, result: '무리한 일정에 몸도 지갑도 크게 축났습니다.' },
    ] },
    { id: 'mid_volunteer', domain: '인성', minAge: 56, maxAge: 75, title: '재능기부', desc: '그동안 쌓아온 경험을 나눠볼까 고민합니다.', choices: [
      { text: '정기적으로 재능기부 활동을 시작한다', effects: { happy: 7, fame: 3 }, result: '나누는 기쁨 속에서 삶의 활력을 되찾았습니다.' },
      { text: '가끔 생각날 때만 참여한다', effects: { happy: 2 }, result: '부담 없는 선에서 가끔 보람을 느꼈습니다.' },
      { text: '엄두가 안 나 미루기만 한다', effects: { happy: -2 }, result: '마음만 있고 실행하지 못해 아쉬웠습니다.' },
      { text: '의욕만 앞서다 몸에 무리가 온다', effects: { happy: 2, health: -5 }, result: '지나친 의욕이 몸에는 무리가 되었습니다.' },
    ] },
    { id: 'mid_investment_scam', domain: '재성', minAge: 56, maxAge: 75, title: '노후자금을 노린 제안', desc: '모아둔 노후자금을 겨냥한 솔깃한 투자 제안을 받았습니다.', choices: [
      { text: '단호히 거절하고 주변에도 알린다', effects: { wisdom: 6, fame: 2 }, result: '현명한 판단으로 소중한 노후자금을 지켜냈습니다.' },
      { text: '정중히 거절하고 넘어간다', effects: { wisdom: 2 }, result: '괜한 위험을 피해 넘어갔습니다.' },
      { text: '혹시나 하는 마음에 소액을 넣어본다', effects: { wealth: -6 }, result: '작게 시작했지만 결국 손해로 끝났습니다.' },
      { text: '노후자금 대부분을 맡기고 만다', effects: { wealth: -16, happy: -5 }, result: '평생 모은 돈을 한순간에 잃고 크게 상심했습니다.' },
    ] },
    { id: 'mid_reskill', domain: '관성', minAge: 56, maxAge: 70, title: '재취업 도전', desc: '조금 더 일하고 싶은 마음에 재취업을 준비합니다.', choices: [
      { text: '새로운 분야를 차분히 배우며 준비한다', effects: { wealth: 6, wisdom: 3 }, result: '꾸준한 준비 끝에 새로운 자리를 얻었습니다.' },
      { text: '할 수 있는 만큼만 가볍게 알아본다', effects: { happy: 2 }, result: '부담 없이 가능성을 넓혀갔습니다.' },
      { text: '막막한 마음에 자꾸 미룬다', effects: { happy: -3 }, result: '망설이는 사이 의욕이 조금씩 사그라들었습니다.' },
      { text: '조급한 마음에 이상한 곳에 발을 들인다', effects: { wealth: -8, happy: -3 }, result: '성급한 선택이 손해로 돌아왔습니다.' },
    ] },
    { id: 'mid_pet', domain: '식상', minAge: 55, maxAge: 80, title: '반려동물과의 하루', desc: '반려동물(혹은 이웃의 동물)과 정을 나누는 하루입니다.', choices: [
      { text: '정성껏 돌보며 하루를 함께 보낸다', effects: { happy: 6, wealth: -1 }, result: '함께한 시간이 큰 위안이 되었습니다.' },
      { text: '가볍게 산책이나 함께 한다', effects: { happy: 3 }, result: '소소한 산책으로 기분이 좋아졌습니다.' },
      { text: '귀찮은 마음에 소홀히 대한다', effects: { happy: -2 }, result: '소홀했던 마음이 뒤늦게 미안해졌습니다.' },
      { text: '갑작스러운 병원비로 마음이 상한다', effects: { wealth: -7, happy: -2 }, result: '예상 못한 병원비에 마음이 무거워졌습니다.' },
    ] },
    { id: 'mid_community', domain: '비겁', minAge: 56, maxAge: 75, title: '마을 공동체 활동', desc: '동네 주민들과 함께하는 모임에 참여할 기회가 생겼습니다.', choices: [
      { text: '적극적으로 참여하며 새 인연을 만든다', effects: { happy: 6, fame: 3 }, result: '새로운 인연들과 활기찬 나날을 보냈습니다.' },
      { text: '가벼운 마음으로 몇 번 참여해본다', effects: { happy: 2 }, result: '부담 없이 좋은 시간을 보냈습니다.' },
      { text: '낯설어서 참여를 망설이다 만다', effects: { happy: -2 }, result: '아쉬운 마음으로 기회를 흘려보냈습니다.' },
      { text: '모임 내 갈등에 휘말려 마음이 상한다', effects: { happy: -5, fame: -2 }, result: '뜻하지 않은 갈등에 마음이 상했습니다.' },
    ] },
    { id: 'mid_health_major', domain: '인성', minAge: 58, maxAge: 75, title: '큰 수술', desc: '큰 수술이 필요하다는 진단을 받았습니다.', choices: [
      { text: '믿을 수 있는 병원에서 제대로 치료받는다', effects: { health: 10, wealth: -9 }, result: '적극적인 치료 끝에 건강을 되찾았습니다.' },
      { text: '필요한 만큼만 치료를 받는다', effects: { health: 4, wealth: -4 }, result: '무리하지 않는 선에서 치료를 마쳤습니다.' },
      { text: '두려운 마음에 치료를 미룬다', effects: { health: -6 }, result: '미루는 사이 몸 상태가 더 나빠졌습니다.' },
      { text: '끝까지 치료를 거부한다', effects: { health: -14, happy: -4 }, result: '치료 시기를 놓쳐 크게 고생했습니다.' },
    ] },

    // ── 노년기 71-100 ──
    { id: 'old_walk', domain: '인성', minAge: 71, maxAge: 99, title: '아침 산책', desc: '동네를 천천히 걷는 것이 하루의 큰 낙이 되었습니다.', choices: [
      { text: '매일 같은 시간에 꾸준히 걷는다', effects: { health: 6, happy: 3 }, result: '규칙적인 산책 덕분에 몸이 한결 가벼워졌습니다.' },
      { text: '날씨 좋은 날만 골라 나간다', effects: { happy: 3 }, result: '무리하지 않고 편안하게 지냈습니다.' },
      { text: '귀찮은 마음에 자꾸 미룬다', effects: { health: -3 }, result: '움직임이 줄며 몸이 조금씩 무거워졌습니다.' },
      { text: '몸 상태를 생각지 않고 무리해서 걷는다', effects: { health: -8, happy: -2 }, result: '과욕이 부른 부상에 한동안 고생했습니다.' },
    ] },
    { id: 'old_friend', domain: '비겁', minAge: 71, maxAge: 99, title: '옛 친구들과의 모임', desc: '오랜 친구들과 모처럼 모임을 가졌습니다.', choices: [
      { text: '적극적으로 어울리며 이야기를 나눈다', effects: { happy: 7, fame: 2 }, result: '지나온 세월을 추억하며 크게 웃었습니다.' },
      { text: '잠깐 얼굴만 비추고 돌아온다', effects: { happy: 3 }, result: '짧지만 반가운 시간을 보냈습니다.' },
      { text: '피곤하다는 핑계로 집에 머문다', effects: { health: 2, happy: -2 }, result: '몸은 편했지만 마음 한구석이 허전했습니다.' },
      { text: '묵은 이야기를 다시 꺼내 든다', effects: { happy: -6, fame: -2 }, result: '묵혀둔 앙금이 터지며 마음이 크게 상했습니다.' },
    ] },
    { id: 'old_hospital', domain: '인성', minAge: 72, maxAge: 99, title: '병원 나들이', desc: '몸 여기저기가 예전 같지 않아 병원을 찾았습니다.', choices: [
      { text: '여러 검사를 받으며 적극적으로 치료한다', effects: { health: 7, wealth: -5 }, result: '치료 덕분에 몸이 한결 편안해졌습니다.' },
      { text: '필요한 만큼만 받고 나머지는 지켜본다', effects: { happy: 2, health: -2 }, result: '나이 듦을 담담히 받아들이기로 했습니다.' },
      { text: '예약을 계속 미룬다', effects: { health: -5 }, result: '미루는 사이 불편함이 점점 커졌습니다.' },
      { text: '불편함을 참고 병원을 아예 찾지 않는다', effects: { health: -11, wealth: -6 }, result: '뒤늦은 치료로 몸도 마음도 크게 지쳤습니다.' },
    ] },
    { id: 'old_reflect', domain: '인성', minAge: 75, maxAge: 99, title: '인생을 돌아보며', desc: '문득 지나온 삶을 돌아보게 되었습니다.', choices: [
      { text: '그동안의 이야기를 글로 정리해본다', effects: { wisdom: 6, happy: 4 }, result: '차분히 지난 날들을 정리하며 마음이 평온해졌습니다.' },
      { text: '가족들을 불러 이야기를 들려준다', effects: { fame: 4, happy: 2 }, result: '가족들이 귀 기울여 들으며 함께 웃고 울었습니다.' },
      { text: '혼자 조용히 지난 일들을 떠올린다', effects: { happy: -3 }, result: '지나간 일들이 자꾸 마음에 걸렸습니다.' },
      { text: '풀지 못한 일들을 계속 곱씹는다', effects: { happy: -7, health: -3 }, result: '풀지 못한 회한이 몸과 마음을 크게 갉아먹었습니다.' },
    ] },
    { id: 'old_grandkid_visit', domain: '식상', minAge: 71, maxAge: 99, title: '자식들의 발걸음', desc: '자식들이 얼마나 자주 찾아오는지가 요즘 마음을 오가게 합니다.', choices: [
      { text: '먼저 연락하며 마음을 표현한다', effects: { happy: 6, fame: 2 }, result: '먼저 건넨 연락에 더 자주 얼굴을 보게 되었습니다.' },
      { text: '오면 반갑게, 안 오면 그러려니 한다', effects: { happy: 2 }, result: '욕심내지 않고 마음을 편히 가졌습니다.' },
      { text: '서운한 마음을 혼자 삭인다', effects: { happy: -4 }, result: '표현 못 한 서운함이 마음에 쌓였습니다.' },
      { text: '서운함을 자식들에게 쏟아낸다', effects: { happy: -6, fame: -3 }, result: '뜻과 달리 사이가 더 서먹해졌습니다.' },
    ] },
    { id: 'old_will', domain: '관성', minAge: 75, maxAge: 99, title: '유언과 정리', desc: '남은 것들을 어떻게 정리할지 생각하게 되는 나이가 되었습니다.', choices: [
      { text: '가족과 상의해 미리 정리해둔다', effects: { happy: 5, fame: 3, wisdom: 2 }, result: '미리 정리해두니 마음이 한결 가벼워졌습니다.' },
      { text: '천천히 생각해보기로 한다', effects: { happy: 1 }, result: '서두르지 않고 천천히 생각을 이어갔습니다.' },
      { text: '생각하기 싫어 자꾸 미룬다', effects: { happy: -3 }, result: '막연한 부담감이 계속 남아 있었습니다.' },
      { text: '갑작스러운 다툼거리를 남기고 만다', effects: { fame: -6, happy: -4 }, result: '뜻하지 않게 가족 간 갈등의 씨앗을 남겼습니다.' },
    ] },
    { id: 'old_neighbor', domain: '비겁', minAge: 71, maxAge: 99, title: '이웃과의 정', desc: '오래 지낸 이웃과 이런저런 정을 나누는 하루입니다.', choices: [
      { text: '따뜻한 음식을 나누며 이야기를 나눈다', effects: { happy: 6, fame: 2 }, result: '정겨운 이야기 속에 하루가 따뜻해졌습니다.' },
      { text: '가볍게 안부만 주고받는다', effects: { happy: 2 }, result: '짧지만 소소한 정을 나눴습니다.' },
      { text: '귀찮아서 만남을 피한다', effects: { happy: -2 }, result: '혼자만의 시간이 조금 쓸쓸하게 느껴졌습니다.' },
      { text: '사소한 일로 얼굴을 붉힌다', effects: { happy: -5, fame: -2 }, result: '오래된 정이 서운함으로 얼룩졌습니다.' },
    ] },
    { id: 'old_memento', domain: '인성', minAge: 75, maxAge: 99, title: '오래된 물건들', desc: '오래된 사진과 물건들을 정리하다 옛 추억에 잠깁니다.', choices: [
      { text: '하나하나 의미를 되새기며 정리한다', effects: { happy: 5, wisdom: 3 }, result: '지나온 시간을 되새기며 마음이 따뜻해졌습니다.' },
      { text: '가볍게 훑어보고 넘어간다', effects: { happy: 1 }, result: '가벼운 마음으로 추억을 스쳐 지났습니다.' },
      { text: '괜히 마음만 심란해진다', effects: { happy: -3 }, result: '지난 기억들에 마음이 어수선해졌습니다.' },
      { text: '지난 후회에 잠겨 잠을 설친다', effects: { happy: -6, health: -3 }, result: '오래된 후회가 밤늦도록 마음을 붙들었습니다.' },
    ] },
    { id: 'old_medical_bill', domain: '인성', minAge: 75, maxAge: 99, title: '큰 병원비', desc: '예상치 못한 병원비가 크게 나와 걱정이 됩니다.', choices: [
      { text: '모아둔 돈으로 차분히 감당한다', effects: { wealth: -6, happy: 2 }, result: '준비해둔 덕에 큰 걱정 없이 넘겼습니다.' },
      { text: '필요한 만큼만 우선 처리한다', effects: { wealth: -3 }, result: '무리하지 않는 선에서 처리했습니다.' },
      { text: '부담에 치료를 미루며 넘긴다', effects: { health: -4 }, result: '미룬 치료에 몸 상태가 더 나빠졌습니다.' },
      { text: '감당 못할 빚을 지고 만다', effects: { wealth: -13, happy: -4 }, result: '늘어난 빚 걱정에 마음이 무거워졌습니다.' },
    ] },
    { id: 'old_pension', domain: '재성', minAge: 71, maxAge: 99, title: '연금 이야기', desc: '매달 들어오는 연금을 어떻게 쓸지 고민이 됩니다.', choices: [
      { text: '계획을 세워 알뜰하게 관리한다', effects: { wealth: 5, wisdom: 2 }, result: '계획적인 관리로 안정적인 생활을 이어갔습니다.' },
      { text: '적당히 쓰며 지낸다', effects: { wealth: 2 }, result: '무난하게 한 달을 보냈습니다.' },
      { text: '별생각 없이 흘러가는 대로 쓴다', effects: { wealth: -2 }, result: '생각보다 씀씀이가 헐거웠습니다.' },
      { text: '자식(혹은 지인)에게 무리하게 보태준다', effects: { wealth: -9, happy: -1 }, result: '보태준 돈에 정작 생활이 빠듯해졌습니다.' },
    ] },
    { id: 'old_greatgrandkid', domain: '식상', minAge: 80, maxAge: 99, title: '증손주의 방문', desc: '귀여운 증손주가 오랜만에 찾아왔습니다.', choices: [
      { text: '온 힘을 다해 반갑게 맞아준다', effects: { happy: 8, health: -2 }, result: '온 힘을 쏟은 만큼 행복이 넘쳤습니다.' },
      { text: '무리하지 않는 선에서 함께 시간을 보낸다', effects: { happy: 4 }, result: '적당히 즐거운 시간을 보냈습니다.' },
      { text: '피곤한 기색을 감추지 못한다', effects: { happy: -2 }, result: '아쉬운 표정을 감추지 못했습니다.' },
      { text: '짜증을 내어 서운한 기억을 남긴다', effects: { happy: -5, fame: -2 }, result: '뜻하지 않게 서운한 기억을 남기고 말았습니다.' },
    ] },
    { id: 'old_donation', domain: '인성', minAge: 71, maxAge: 99, title: '기부의 마음', desc: '평생 모은 것 중 일부를 나누고 싶은 마음이 듭니다.', choices: [
      { text: '의미 있는 곳을 찾아 꾸준히 기부한다', effects: { happy: 7, fame: 4, wealth: -3 }, result: '나눔의 기쁨 속에 뿌듯한 나날을 보냈습니다.' },
      { text: '부담 없는 선에서 가볍게 나눈다', effects: { happy: 3, wealth: -1 }, result: '작은 나눔이 마음을 따뜻하게 채웠습니다.' },
      { text: '마음만 있고 실행하지 못한다', effects: { happy: -1 }, result: '마음만 앞선 채 실행하지 못했습니다.' },
      { text: '충동적으로 무리하게 다 내어준다', effects: { wealth: -10, happy: 1 }, result: '뿌듯함도 잠시, 생활이 빠듯해졌습니다.' },
    ] },
    { id: 'old_scam_target', domain: '재성', minAge: 71, maxAge: 99, title: '수상한 전화', desc: '낯선 번호로 걸려온 전화가 자꾸 불안한 제안을 합니다.', choices: [
      { text: '단호히 끊고 가족에게 바로 알린다', effects: { wisdom: 6, fame: 2 }, result: '현명한 대처로 위험을 미리 피했습니다.' },
      { text: '대충 둘러대고 전화를 끊는다', effects: { wisdom: 2 }, result: '괜한 위험을 피해 넘어갔습니다.' },
      { text: '혹시나 하는 마음에 정보를 조금 알려준다', effects: { wealth: -5, wisdom: -2 }, result: '방심한 사이 정보를 이용당하고 말았습니다.' },
      { text: '속아서 돈을 보내고 만다', effects: { wealth: -15, happy: -5 }, result: '뒤늦게 사기임을 깨닫고 크게 상심했습니다.' },
    ] },
    { id: 'old_reunion_family', domain: '비겁', minAge: 71, maxAge: 99, title: '온 가족이 모이는 날', desc: '명절(혹은 기념일)을 맞아 온 가족이 모였습니다.', choices: [
      { text: '모두를 살뜰히 챙기며 자리를 즐긴다', effects: { happy: 8, fame: 2 }, result: '온 가족과 함께한 시간이 큰 행복으로 남았습니다.' },
      { text: '조용히 앉아 흐뭇하게 지켜본다', effects: { happy: 4 }, result: '조용한 흐뭇함 속에 하루가 지나갔습니다.' },
      { text: '서운한 마음이 자꾸 앞선다', effects: { happy: -3 }, result: '괜한 서운함에 마음이 편치 않았습니다.' },
      { text: '묵은 감정이 터져 자리가 어색해진다', effects: { happy: -6, fame: -2 }, result: '뜻깊은 자리가 씁쓸하게 마무리됐습니다.' },
    ] },
    { id: 'old_hobbies_new', domain: '인성', minAge: 71, maxAge: 99, title: '늦게 배우는 즐거움', desc: '나이가 들어서도 새로운 것을 배워보고 싶은 마음이 듭니다.', choices: [
      { text: '배우고 싶던 것을 용기 내어 시작한다', effects: { happy: 7, wisdom: 3 }, result: '늦은 도전이 삶에 새로운 활력을 주었습니다.' },
      { text: '가벼운 마음으로 조금씩 익혀본다', effects: { happy: 3 }, result: '부담 없이 소소한 즐거움을 얻었습니다.' },
      { text: '나이 탓을 하며 포기한다', effects: { happy: -3 }, result: '아쉬운 마음으로 도전을 접었습니다.' },
      { text: '무리하게 욕심을 내다 몸이 상한다', effects: { happy: 1, health: -5 }, result: '지나친 의욕에 몸이 따라주지 않았습니다.' },
    ] },
    { id: 'old_loneliness', domain: '식상', minAge: 75, maxAge: 99, title: '홀로 있는 시간', desc: '혼자 지내는 시간이 길어지며 외로움이 밀려옵니다.', choices: [
      { text: '먼저 연락하고 사람들을 만나러 나간다', effects: { happy: 6, fame: 1 }, result: '먼저 다가간 발걸음이 외로움을 달래주었습니다.' },
      { text: '좋아하는 일을 하며 시간을 보낸다', effects: { happy: 3 }, result: '스스로 즐거움을 찾으며 시간을 채웠습니다.' },
      { text: '외로움을 그저 견디며 지낸다', effects: { happy: -4 }, result: '깊어지는 외로움을 그저 견뎠습니다.' },
      { text: '깊은 외로움에 마음의 병을 얻는다', effects: { happy: -8, health: -3 }, result: '오랜 외로움이 몸과 마음에 깊은 그늘을 남겼습니다.' },
    ] },

    // ── 전 연령(19+) 공통 이벤트 ──
    { id: 'any_lottery', domain: '재성', minAge: 19, maxAge: 99, title: '뜻밖의 행운', desc: '길을 걷다 우연히 작은 행운이 찾아왔습니다.', choices: [
      { text: '의미 있는 곳에 나누어 쓴다', effects: { wealth: 6, happy: 4 }, result: '작은 행운을 알차게 나누며 하루가 즐거워졌습니다.' },
      { text: '특별히 신경 쓰지 않고 넘어간다', effects: { wisdom: 2 }, result: '큰 의미를 두지 않고 평소처럼 지냈습니다.' },
      { text: '기분 내키는 대로 바로 써버린다', effects: { happy: 3, wealth: -2 }, result: '잠깐의 즐거움 뒤에 아쉬움이 남았습니다.' },
      { text: '더 키워보겠다며 어딘가에 맡긴다', effects: { wealth: -8, wisdom: -2 }, result: '뜻밖의 행운이 오히려 화근이 되었습니다.' },
    ] },
    { id: 'any_scam', domain: '재성', minAge: 20, maxAge: 80, title: '수상한 제안', desc: '솔깃한 투자 제안을 받았습니다. 어딘가 미심쩍습니다.', choices: [
      { text: '거절하고 주변에도 알린다', effects: { wisdom: 5, fame: 3 }, result: '현명한 판단으로 스스로도 주변도 지켜냈습니다.' },
      { text: '정중히 거절하고 넘어간다', effects: { wisdom: 2 }, result: '괜한 위험을 피해 갔습니다.' },
      { text: '일단 소액만 넣어본다', effects: { wealth: -4, wisdom: -1 }, result: '작게 시작했지만 결국 손해를 봤습니다.' },
      { text: '권유를 믿고 크게 투자한다', effects: { wealth: -12, wisdom: -3 }, result: '뒤늦게야 사기였음을 깨닫고 크게 자책했습니다.' },
    ] },
    { id: 'any_conflict', domain: '비겁', minAge: 19, maxAge: 90, title: '갈등의 순간', desc: '가까운 사람과 오해가 생겨 갈등이 있었습니다.', choices: [
      { text: '먼저 연락해 이야기를 나눈다', effects: { fame: 5, happy: 3 }, result: '진심이 통해 관계가 더 돈독해졌습니다.' },
      { text: '시간을 두고 지켜본다', effects: { happy: -1 }, result: '시간이 지나며 자연스레 풀렸습니다.' },
      { text: '먼저 말을 걸지 않고 기다린다', effects: { happy: -3, fame: -1 }, result: '풀리지 않은 앙금이 계속 마음에 남았습니다.' },
      { text: '쌓아둔 말을 한꺼번에 쏟아낸다', effects: { fame: -6, happy: -5 }, result: '돌이키기 힘든 상처만 남기고 말았습니다.' },
    ] },
    { id: 'any_weather', domain: '인성', minAge: 19, maxAge: 99, title: '궂은 날씨', desc: '오랜 장마와 궂은 날씨에 몸과 마음이 축축 처집니다.', choices: [
      { text: '실내에서 할 수 있는 걸 찾아 지낸다', effects: { health: 4, happy: 2 }, result: '무리하지 않고 컨디션을 잘 유지했습니다.' },
      { text: '평소처럼 조용히 지낸다', effects: { happy: 1 }, result: '차분하게 시간을 흘려보냈습니다.' },
      { text: '괜히 기분만 가라앉은 채로 보낸다', effects: { happy: -2 }, result: '축 처진 날씨만큼이나 기분도 가라앉았습니다.' },
      { text: '날씨에 아랑곳 않고 계속 활동한다', effects: { health: -6, happy: -2 }, result: '날씨 탓만 하다 몸살을 크게 앓았습니다.' },
    ] },
    { id: 'any_health_checkup', domain: '인성', minAge: 19, maxAge: 99, title: '몸의 작은 신호', desc: '요즘 들어 몸이 보내는 작은 신호가 느껴집니다.', choices: [
      { text: '가볍게라도 병원에 들러 확인한다', effects: { health: 6, wealth: -2 }, result: '별일 아니라는 확인에 마음이 놓였습니다.' },
      { text: '당분간 컨디션을 살피며 지낸다', effects: { health: 2 }, result: '무리하지 않고 스스로를 잘 살폈습니다.' },
      { text: '별일 아니겠거니 넘긴다', effects: { health: -3 }, result: '대수롭지 않게 넘겼지만 찜찜함이 남았습니다.' },
      { text: '신호를 계속 무시하고 무리한다', effects: { health: -8, wealth: -3 }, result: '결국 몸이 크게 탈이 나 병원비까지 들었습니다.' },
    ] },
    { id: 'any_gift', domain: '비겁', minAge: 19, maxAge: 99, title: '뜻밖의 선물', desc: '가까운 사람에게서 뜻밖의 선물(혹은 호의)을 받았습니다.', choices: [
      { text: '고마운 마음을 담아 답례를 전한다', effects: { happy: 5, fame: 2 }, result: '따뜻한 마음이 오가며 사이가 더 돈독해졌습니다.' },
      { text: '가볍게 고맙다는 인사를 전한다', effects: { happy: 2 }, result: '부담 없이 고마운 마음을 전했습니다.' },
      { text: '별생각 없이 넘어간다', effects: { happy: -1 }, result: '무심코 넘긴 것이 살짝 마음에 걸렸습니다.' },
      { text: '당연하게 여기며 무심하게 대한다', effects: { happy: -3, fame: -3 }, result: '상대의 서운한 기색에 사이가 서먹해졌습니다.' },
    ] },
    { id: 'any_accident', domain: '관성', minAge: 19, maxAge: 99, title: '뜻밖의 사고', desc: '예상치 못한 작은 사고(낙상, 부딪힘 등)를 겪었습니다.', choices: [
      { text: '바로 병원에서 제대로 치료받는다', effects: { health: 6, wealth: -3 }, result: '빠른 대처 덕에 큰 탈 없이 나았습니다.' },
      { text: '가볍게 넘어갈 정도로 무난히 지나간다', effects: { health: 1 }, result: '다행히 큰 탈 없이 지나갔습니다.' },
      { text: '대수롭지 않게 여기고 넘긴다', effects: { health: -3 }, result: '가볍게 여긴 것치고 여파가 오래갔습니다.' },
      { text: '방치하다 상태가 더 나빠진다', effects: { health: -8, wealth: -4 }, result: '방치한 대가로 몸도 지갑도 상했습니다.' },
    ] },
    { id: 'any_old_friend', domain: '비겁', minAge: 19, maxAge: 99, title: '오래된 인연과의 재회', desc: '연락이 끊겼던 오래된 인연과 우연히 다시 마주쳤습니다.', choices: [
      { text: '반갑게 안부를 나누고 인연을 다시 잇는다', effects: { happy: 6, fame: 2 }, result: '반가운 재회로 다시 좋은 인연을 이어갔습니다.' },
      { text: '가볍게 인사만 나누고 지나간다', effects: { happy: 2 }, result: '짧지만 반가운 인사를 나눴습니다.' },
      { text: '어색해서 모른 척 지나친다', effects: { happy: -2 }, result: '지나고 나니 못내 아쉬운 마음이 남았습니다.' },
      { text: '지난 앙금이 떠올라 불편하게 마주친다', effects: { happy: -5, fame: -2 }, result: '불편한 기억이 되살아나 마음이 상했습니다.' },
    ] },
    { id: 'any_offer', domain: '재성', minAge: 19, maxAge: 90, title: '뜻밖의 제안', desc: '생각지도 못한 곳에서 솔깃한 제안이 들어왔습니다.', choices: [
      { text: '조건을 꼼꼼히 따져보고 받아들인다', effects: { wealth: 8, wisdom: 2 }, result: '신중한 판단 끝에 좋은 기회로 이어졌습니다.' },
      { text: '신중하게 조금 더 지켜보기로 한다', effects: { wisdom: 2 }, result: '서두르지 않고 상황을 더 지켜봤습니다.' },
      { text: '별 고민 없이 거절해버린다', effects: { happy: -1 }, result: '나중에서야 아쉬운 마음이 들었습니다.' },
      { text: '충동적으로 덥석 받아들였다 후회한다', effects: { wealth: -8, happy: -2 }, result: '성급한 결정을 뒤늦게 후회했습니다.' },
    ] },
    { id: 'any_fine', domain: '관성', minAge: 19, maxAge: 90, title: '작은 다툼과 벌금', desc: '사소한 부주의로 작은 다툼(혹은 범칙금 문제)이 생겼습니다.', choices: [
      { text: '깔끔하게 인정하고 바로 처리한다', effects: { wisdom: 3, wealth: -2 }, result: '깔끔한 처리로 뒤탈 없이 넘겼습니다.' },
      { text: '번거롭지만 절차대로 처리한다', effects: { wealth: -2 }, result: '번거로웠지만 무난히 마무리했습니다.' },
      { text: '억울한 마음에 처리를 미룬다', effects: { wealth: -4, happy: -2 }, result: '미룬 사이 부담만 더 커졌습니다.' },
      { text: '감정적으로 대응하다 일이 커진다', effects: { wealth: -7, fame: -3 }, result: '감정적인 대응이 일을 더 키우고 말았습니다.' },
    ] },
  ];

  const MILESTONES = [
    { age: 19, id: 'ms_adult', title: '성인이 되다', desc: '어른이 되는 해입니다. 앞으로의 길을 정해야 합니다.', choices: [
      { text: '대학 진학을 목표로 준비한다', effects: { wisdom: 9, wealth: -3 }, result: '뚜렷한 목표를 갖고 새로운 배움에 뛰어들었습니다.' },
      { text: '곧바로 사회에 나가본다', effects: { wealth: 5, wisdom: -1 }, result: '일찍이 사회 경험을 쌓기 시작했습니다.' },
      { text: '일단 시간을 두고 지켜본다', effects: { happy: 1, wisdom: -3 }, result: '뚜렷한 방향 없이 하루하루를 보냈습니다.' },
      { text: '아무 결정도 내리지 못한 채 지낸다', effects: { happy: -4, wisdom: -5, wealth: -2 }, result: '망설이는 사이 소중한 시간이 지나가 버렸습니다.' },
    ] },
    { age: 23, id: 'ms_career', title: '첫 사회생활', desc: '첫 직장(혹은 사업)에 발을 내딛는 순간입니다.', choices: [
      { text: '적극적으로 나서서 일을 배운다', effects: { wealth: 8, happy: 5, fame: 2 }, result: '열정적으로 뛰어들며 값진 경험을 쌓았습니다.' },
      { text: '천천히 분위기를 살피며 적응한다', effects: { fame: 3, wealth: 3 }, result: '차근차근 신뢰를 쌓으며 자리를 잡았습니다.' },
      { text: '자신 없는 채로 눈치만 본다', effects: { happy: -2, fame: -1 }, result: '주눅 든 태도로 좀처럼 기회를 살리지 못했습니다.' },
      { text: '서두르다 중요한 실수를 저지른다', effects: { fame: -6, happy: -4 }, result: '값비싼 실수로 첫 단추를 잘못 끼웠습니다.' },
    ] },
    { age: 28, id: 'ms_marriage', title: '인생의 동반자', desc: '결혼 적령기, 평생을 함께할 사람에 대해 고민하게 됩니다.', choices: [
      { text: '충분히 이야기를 나눈 끝에 결혼을 결심한다', effects: { happy: 9, wealth: -4, fame: 3 }, result: '평생의 동반자와 새로운 가정을 꾸렸습니다.' },
      { text: '지금은 혼자만의 시간을 갖기로 한다', effects: { wisdom: 4, wealth: 3 }, result: '온전히 나에게 집중하는 시간을 택했습니다.' },
      { text: '확신 없이 관계를 이어간다', effects: { happy: -2 }, result: '마음 한구석에 계속 의문이 남았습니다.' },
      { text: '서둘러 결정하고 만다', effects: { happy: -7, wealth: -6, fame: -2 }, result: '준비 없는 결정이 큰 아픔으로 돌아왔습니다.' },
    ] },
    { age: 40, id: 'ms_midlife', title: '불혹, 인생 중반', desc: '흔들리지 않을 나이, 지나온 삶을 돌아보게 됩니다.', choices: [
      { text: '지난 삶을 정리하고 새 목표를 그려본다', effects: { happy: 6, wisdom: 4 }, result: '인생 후반전을 위한 새 목표를 그렸습니다.' },
      { text: '지금까지 해온 것들을 그대로 지킨다', effects: { wealth: 4, health: 2 }, result: '쌓아온 것들을 단단히 지켜나가기로 했습니다.' },
      { text: '이렇다 할 의욕 없이 지낸다', effects: { happy: -3 }, result: '이유 모를 허탈함이 계속 마음을 짓눌렀습니다.' },
      { text: '갑작스러운 결정으로 크게 방향을 튼다', effects: { wealth: -6, happy: -5 }, result: '충동적인 결정이 큰 후회로 남았습니다.' },
    ] },
    { age: 60, id: 'ms_hwan', title: '환갑잔치', desc: '60번째 생일, 가족과 지인들이 모여 환갑잔치를 열어주었습니다.', choices: [
      { text: '온 가족을 불러 크게 자리를 마련한다', effects: { happy: 9, fame: 5, wealth: -4 }, result: '오랜만에 모인 사람들과 웃음꽃을 피웠습니다.' },
      { text: '가까운 가족끼리 조용히 보낸다', effects: { happy: 5, wealth: 1 }, result: '소박하지만 따뜻한 시간을 보냈습니다.' },
      { text: '형편상 별다른 자리 없이 넘어간다', effects: { happy: -2 }, result: '아쉬움을 뒤로하고 조용히 넘어갔습니다.' },
      { text: '묵은 갈등이 자리에서 터진다', effects: { happy: -6, fame: -3 }, result: '뜻깊어야 할 날이 씁쓸하게 마무리됐습니다.' },
    ] },
    { age: 70, id: 'ms_gohee', title: '고희', desc: '70번째 생일, 예로부터 드물다는 나이에 이르렀습니다.', choices: [
      { text: '지나온 이야기를 정리해 글로 남긴다', effects: { wisdom: 7, happy: 4 }, result: '지나온 삶을 글로 정리하며 뜻깊은 시간을 보냈습니다.' },
      { text: '남은 날들을 편하게 즐기기로 한다', effects: { happy: 6, health: 2 }, result: '욕심을 내려놓고 하루하루를 여유롭게 즐겼습니다.' },
      { text: '예전 같지 않은 몸 상태를 느낀다', effects: { happy: -2, health: -2 }, result: '예전만 못한 몸에 마음이 편치 않았습니다.' },
      { text: '몸이 크게 상해 눕는 날이 많아진다', effects: { health: -8, happy: -4 }, result: '바라던 것과 달리 몸져눕는 날이 많아졌습니다.' },
    ] },
    { age: 80, id: 'ms_pal', title: '팔순', desc: '80번째 생일, 온 가족이 모여 축하해주었습니다.', choices: [
      { text: '온 가족과 함께 자리를 크게 갖는다', effects: { happy: 9, fame: 4 }, result: '자손들에 둘러싸여 벅찬 행복을 느꼈습니다.' },
      { text: '조용히 지난 세월을 되새긴다', effects: { happy: 5, wisdom: 3 }, result: '고요한 하루, 지나온 세월을 가만히 되새겼습니다.' },
      { text: '자리를 지키는 것조차 버거워한다', effects: { happy: -2, health: -3 }, result: '마음과 달리 몸이 따라주지 않았습니다.' },
      { text: '몸져누워 자리를 지키지 못한다', effects: { health: -10, happy: -5 }, result: '뜻깊은 날을 병상에서 맞이하고 말았습니다.' },
    ] },
  ];

  return { STATS, EVENT_POOL, MILESTONES };
})();

if (typeof module !== 'undefined') module.exports = GameData;
