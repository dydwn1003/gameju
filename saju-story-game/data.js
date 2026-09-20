/* 게임 데이터: 스탯 정의 + 생애주기 이벤트 풀 + 마일스톤 이벤트
 * 각 이벤트의 domain 은 십성 그룹(비겁/식상/재성/관성/인성)과 연결되어,
 * 그 달의 사주 운세가 가리키는 기운과 같은 계열의 이벤트가 우선적으로 등장한다.
 * choices 는 항상 4개: 최고의 선택 -> 중간 선택 -> 안좋은 선택 -> 최악의 선택 순.
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
      { text: '계획을 세워 학원에 등록한다', effects: { wisdom: 10, wealth: -4 }, result: '체계적인 공부로 예상보다 빨리 자격증을 취득했습니다.' },
      { text: '독학으로 꾸준히 준비한다', effects: { wisdom: 5, happy: -1 }, result: '스스로의 힘으로 차근차근 실력을 쌓았습니다.' },
      { text: '미루다가 벼락치기로 임한다', effects: { wisdom: 2, health: -3 }, result: '급하게 몰아붙이느라 몸도 마음도 지쳤습니다.' },
      { text: '결국 흐지부지 포기한다', effects: { wisdom: -4, happy: -3 }, result: '괜한 자괴감만 남긴 채 흐지부지되었습니다.' },
    ] },
    { id: 'yng_exam', domain: '관성', minAge: 19, maxAge: 26, title: '중요한 시험', desc: '입사 시험 혹은 자격 평가가 코앞으로 다가왔습니다.', choices: [
      { text: '계획적으로 준비하며 컨디션도 관리한다', effects: { wisdom: 8, health: 1 }, result: '차분한 준비 끝에 좋은 결과를 얻었습니다.' },
      { text: '평소 실력대로 임한다', effects: { wisdom: 3, happy: 1 }, result: '담담하게 시험을 치르고 결과를 기다렸습니다.' },
      { text: '밤을 새워 벼락치기로 준비한다', effects: { wisdom: 4, health: -5 }, result: '무리한 만큼 몸이 크게 축났습니다.' },
      { text: '될 대로 되라며 대충 본다', effects: { wisdom: -5, happy: -4 }, result: '성의 없는 태도가 결과로 고스란히 돌아왔습니다.' },
    ] },
    { id: 'yng_boss', domain: '관성', minAge: 23, maxAge: 35, title: '까다로운 평가', desc: '깐깐한 상사(혹은 거래처)에게 엄격한 평가를 받게 되었습니다.', choices: [
      { text: '철저히 준비해 정면으로 부딪힌다', effects: { fame: 7, wisdom: 2, health: -2 }, result: '힘들었지만 결국 실력을 확실히 인정받았습니다.' },
      { text: '묵묵히 기본에 충실한다', effects: { fame: 2, happy: -1 }, result: '큰 티는 안 났지만 신뢰를 조금씩 쌓았습니다.' },
      { text: '위축된 채 소극적으로 넘긴다', effects: { fame: -3, happy: -4 }, result: '자신감을 잃고 실수가 잦아졌습니다.' },
      { text: '감정적으로 맞받아치다 크게 부딪힌다', effects: { fame: -8, happy: -5 }, result: '돌이키기 힘든 앙금만 남기고 말았습니다.' },
    ] },
    { id: 'yng_sidejob', domain: '재성', minAge: 19, maxAge: 27, title: '부업의 기회', desc: '본업 외에 돈을 벌 수 있는 부업 제안이 들어왔습니다.', choices: [
      { text: '계획적으로 시간을 나눠 부업을 시작한다', effects: { wealth: 8, health: -1 }, result: '균형을 잘 잡아 통장이 두둑해졌습니다.' },
      { text: '본업에만 집중한다', effects: { wisdom: 2, happy: 1 }, result: '무리하지 않고 본업에 집중했습니다.' },
      { text: '무리하게 부업에만 매달린다', effects: { wealth: 3, health: -5, fame: -2 }, result: '본업을 소홀히 한 대가가 뒤늦게 돌아왔습니다.' },
      { text: '앞뒤 안 보고 수상한 제안에 뛰어든다', effects: { wealth: -9, wisdom: -2 }, result: '결국 사기성 부업이었음을 뒤늦게 깨달았습니다.' },
    ] },
    { id: 'yng_startup', domain: '재성', minAge: 24, maxAge: 35, title: '창업의 꿈', desc: '작은 사업을 시작해볼까 고민합니다.', choices: [
      { text: '철저히 준비한 끝에 과감히 도전한다', effects: { wealth: 12, happy: 4, health: -2 }, result: '탄탄한 준비 덕에 사업이 순조롭게 자리 잡았습니다.' },
      { text: '작게 시작해 안정적으로 키운다', effects: { happy: 3, wealth: 3 }, result: '무리하지 않고 차근차근 나아갔습니다.' },
      { text: '준비 없이 무리하게 확장한다', effects: { wealth: -4, health: -3 }, result: '욕심이 앞서 자금 사정이 꼬였습니다.' },
      { text: '전 재산을 걸고 무모하게 뛰어든다', effects: { wealth: -14, happy: -6, health: -3 }, result: '큰 실패로 오랫동안 후유증을 겪었습니다.' },
    ] },
    { id: 'yng_love', domain: '식상', minAge: 19, maxAge: 34, title: '연애', desc: '마음이 잘 맞는 사람을 만나게 되었습니다.', choices: [
      { text: '서로를 배려하며 관계를 정성껏 키운다', effects: { happy: 8, fame: 2 }, result: '설레는 연애로 하루하루가 즐거웠습니다.' },
      { text: '편안하게 만남을 이어간다', effects: { happy: 4 }, result: '무리하지 않는 편안한 만남을 이어갔습니다.' },
      { text: '일에 치여 관계에 소홀해진다', effects: { happy: -3, wealth: 2 }, result: '커리어는 챙겼지만 관계에는 서운함이 쌓였습니다.' },
      { text: '감정 기복으로 크게 다투고 멀어진다', effects: { happy: -8, fame: -2 }, result: '돌이키기 힘든 이별로 마음이 크게 상했습니다.' },
    ] },
    { id: 'yng_move', domain: '비겁', minAge: 19, maxAge: 30, title: '독립', desc: '부모님 곁을 떠나 자취를 시작할지 고민합니다.', choices: [
      { text: '꼼꼼히 계획을 세워 독립한다', effects: { happy: 6, wisdom: 3, wealth: -3 }, result: '자유로움과 함께 알찬 살림 노하우도 배웠습니다.' },
      { text: '조금 더 부모님과 함께 산다', effects: { wealth: 3, happy: -1 }, result: '가족과 시간을 더 보내며 돈을 아꼈습니다.' },
      { text: '준비 없이 충동적으로 독립한다', effects: { happy: 2, wealth: -6 }, result: '자유는 얻었지만 생활비에 매달 허덕였습니다.' },
      { text: '감당 못할 곳에 덜컥 계약한다', effects: { wealth: -9, health: -2, happy: -3 }, result: '무리한 지출로 오랫동안 쪼들리게 되었습니다.' },
    ] },
    { id: 'yng_travel', domain: '식상', minAge: 19, maxAge: 40, title: '훌쩍 떠난 여행', desc: '일상에 지쳐 훌쩍 여행을 떠나고 싶어졌습니다.', choices: [
      { text: '알차게 계획을 세워 여행을 떠난다', effects: { happy: 9, wisdom: 3, wealth: -4 }, result: '낯선 곳에서 견문을 넓히고 제대로 재충전했습니다.' },
      { text: '짧게 다녀온다', effects: { happy: 4, wealth: -2 }, result: '짧지만 알찬 시간으로 기분을 전환했습니다.' },
      { text: '즉흥적으로 떠나 무리하게 쓴다', effects: { happy: 3, wealth: -8 }, result: '즐겁긴 했지만 지출이 예상보다 훨씬 컸습니다.' },
      { text: '충동적으로 떠났다가 사고를 당한다', effects: { happy: -4, wealth: -10, health: -2 }, result: '여행 중 사고와 분실로 큰 손해를 봤습니다.' },
    ] },

    // ── 장년기 36-55 ──
    { id: 'adt_promo', domain: '관성', minAge: 30, maxAge: 55, title: '승진 기회', desc: '치열한 경쟁 끝에 승진 기회가 찾아왔습니다.', choices: [
      { text: '실력으로 정면 승부해 도전한다', effects: { wealth: 10, fame: 5, health: -2 }, result: '노력 끝에 당당히 승진에 성공했습니다.' },
      { text: '무리하지 않고 현재 자리를 지킨다', effects: { happy: 4, health: 2 }, result: '무리하지 않고 워라밸을 지켰습니다.' },
      { text: '무리하게 욕심을 내다 지친다', effects: { wealth: 2, health: -6 }, result: '애는 썼지만 성과 없이 몸만 상했습니다.' },
      { text: '사내 정치싸움에 휘말려 밀려난다', effects: { fame: -6, happy: -5 }, result: '억울하게 기회를 놓치고 마음도 크게 다쳤습니다.' },
    ] },
    { id: 'adt_invest', domain: '재성', minAge: 28, maxAge: 55, title: '재테크 고민', desc: '모아둔 돈을 어떻게 굴릴지 고민이 됩니다.', choices: [
      { text: '충분히 공부하고 분산 투자한다', effects: { wealth: 11, wisdom: 2 }, result: '신중한 분석 덕에 안정적으로 수익을 냈습니다.' },
      { text: '안전하게 저축한다', effects: { wealth: 4, happy: 1 }, result: '느리지만 꾸준히 자산을 불렸습니다.' },
      { text: '근거 없이 한 곳에 몰빵한다', effects: { wealth: -6 }, result: '성급한 판단으로 손해를 보고 말았습니다.' },
      { text: '무리한 대출까지 받아 투자한다', effects: { wealth: -16, happy: -5, health: -2 }, result: '시장이 무너지며 감당 못할 빚만 남았습니다.' },
    ] },
    { id: 'adt_home', domain: '재성', minAge: 30, maxAge: 50, title: '내 집 마련', desc: '드디어 내 집을 마련할 기회가 생겼습니다.', choices: [
      { text: '꼼꼼히 따져 무리 없는 대출로 산다', effects: { wealth: -5, happy: 7, fame: 2 }, result: '감당 가능한 선에서 안정된 보금자리를 얻었습니다.' },
      { text: '조금 더 모은 뒤 결정한다', effects: { wealth: 4, happy: -1 }, result: '신중하게 때를 기다리기로 했습니다.' },
      { text: '급한 마음에 과한 대출을 진다', effects: { wealth: -10, happy: 2, health: -2 }, result: '집은 샀지만 매달 이자에 시달리게 되었습니다.' },
      { text: '무리한 갭투자에 손을 댄다', effects: { wealth: -16, health: -4, happy: -5 }, result: '큰 빚더미에 앉아 오랫동안 고생했습니다.' },
    ] },
    { id: 'adt_health', domain: '관성', minAge: 35, maxAge: 55, title: '건강 적신호', desc: '건강검진에서 관리가 필요하다는 소견을 들었습니다.', choices: [
      { text: '생활습관을 전면적으로 바꾼다', effects: { health: 10, happy: -1 }, result: '운동과 식단 관리로 몸이 눈에 띄게 좋아졌습니다.' },
      { text: '조금씩 신경 쓴다', effects: { health: 4 }, result: '무리하지 않는 선에서 조금씩 관리했습니다.' },
      { text: '대수롭지 않게 넘긴다', effects: { health: -5 }, result: '당장은 편했지만 몸이 조금씩 나빠졌습니다.' },
      { text: '몸이 보내는 신호를 계속 무시한다', effects: { health: -12, wealth: -4 }, result: '결국 크게 탈이 나 큰 병원비를 치렀습니다.' },
    ] },
    { id: 'adt_switch', domain: '관성', minAge: 32, maxAge: 55, title: '이직 고민', desc: '더 나은 조건의 이직 제안을 받았습니다.', choices: [
      { text: '충분히 알아보고 이직을 결정한다', effects: { wealth: 8, happy: 4, fame: 1 }, result: '새 직장에서 성공적으로 적응했습니다.' },
      { text: '익숙한 곳에 남는다', effects: { happy: 2, fame: 2 }, result: '쌓아온 신뢰와 안정감을 지켰습니다.' },
      { text: '충동적으로 이직했다가 안 맞는다', effects: { wealth: 2, happy: -4 }, result: '막상 옮기고 보니 기대와 많이 달랐습니다.' },
      { text: '무턱대고 그만뒀다가 자리를 못 구한다', effects: { wealth: -8, happy: -6, fame: -3 }, result: '앞뒤 재지 않은 결정을 오래도록 후회했습니다.' },
    ] },
    { id: 'adt_relation', domain: '비겁', minAge: 30, maxAge: 55, title: '인간관계의 무게', desc: '직장과 사회에서의 인간관계에 지쳐갑니다.', choices: [
      { text: '솔직한 대화로 관계를 조율한다', effects: { happy: 6, fame: 2 }, result: '진심이 통해 관계가 한결 편안해졌습니다.' },
      { text: '적당히 거리를 두며 지낸다', effects: { happy: 3 }, result: '마음의 짐을 조금 덜고 편해졌습니다.' },
      { text: '내색 않고 계속 참기만 한다', effects: { happy: -4, health: -2 }, result: '쌓인 스트레스가 몸으로 나타나기 시작했습니다.' },
      { text: '한계에 다다라 관계가 크게 틀어진다', effects: { fame: -6, happy: -6 }, result: '오래된 인연이 돌이키기 힘들게 끊어졌습니다.' },
    ] },
    { id: 'adt_hobby', domain: '식상', minAge: 36, maxAge: 55, title: '나를 위한 시간', desc: '오랜만에 온전히 나를 위한 취미나 자기계발을 시작해볼까 합니다.', choices: [
      { text: '새로운 활동에 적극적으로 몰입한다', effects: { happy: 7, wisdom: 3, wealth: -2 }, result: '오랜만에 나만의 즐거움을 제대로 되찾았습니다.' },
      { text: '가족과 시간을 보낸다', effects: { happy: 4, fame: 1 }, result: '소소하지만 따뜻한 시간을 보냈습니다.' },
      { text: '별생각 없이 시간을 흘려보낸다', effects: { happy: 1 }, result: '딱히 남는 것 없이 시간만 지나갔습니다.' },
      { text: '취미에 과몰입해 본업을 소홀히 한다', effects: { happy: 3, fame: -4, wealth: -3 }, result: '균형을 잃어 주변의 신뢰를 잃고 말았습니다.' },
    ] },
    { id: 'adt_mentor', domain: '인성', minAge: 36, maxAge: 55, title: '뜻밖의 조언', desc: '존경하던 선배(혹은 스승)에게서 중요한 조언을 듣게 되었습니다.', choices: [
      { text: '겸허히 받아들여 방향을 바꾼다', effects: { wisdom: 8, happy: 3 }, result: '새로운 시각을 얻고 한층 성장했습니다.' },
      { text: '참고만 하고 소신을 지킨다', effects: { wisdom: 2, fame: 2 }, result: '나만의 방식을 지키며 나아갔습니다.' },
      { text: '건성으로 듣고 흘려버린다', effects: { wisdom: -2, happy: -2 }, result: '나중에서야 그 조언의 무게를 깨달았습니다.' },
      { text: '발끈하며 반발해 관계까지 틀어진다', effects: { fame: -5, wisdom: -3 }, result: '좋은 인연을 감정적으로 놓치고 말았습니다.' },
    ] },

    // ── 중년기 56-70 ──
    { id: 'mid_retire', domain: '식상', minAge: 55, maxAge: 65, title: '은퇴 준비', desc: '은퇴 후의 삶을 어떻게 꾸릴지 고민이 됩니다.', choices: [
      { text: '새로운 활동과 소일거리를 함께 준비한다', effects: { happy: 7, wealth: 3 }, result: '텃밭 가꾸기와 소일거리로 활기찬 나날을 보냈습니다.' },
      { text: '작은 일을 계속한다', effects: { wealth: 4, health: -1 }, result: '소일거리를 하며 생활에 여유를 더했습니다.' },
      { text: '별다른 계획 없이 시간을 보낸다', effects: { happy: -3 }, result: '무료한 나날에 마음이 조금씩 허전해졌습니다.' },
      { text: '노후자금으로 무리한 사업을 벌인다', effects: { wealth: -12, happy: -4 }, result: '뒤늦은 도전이 큰 손실로 돌아왔습니다.' },
    ] },
    { id: 'mid_checkup', domain: '인성', minAge: 56, maxAge: 75, title: '정기 건강검진', desc: '나이가 들며 건강검진이 중요해졌습니다.', choices: [
      { text: '꼼꼼히 검진받고 철저히 관리한다', effects: { health: 8, wealth: -3 }, result: '이상 소견을 조기에 발견하고 잘 관리했습니다.' },
      { text: '간단히 검진만 받는다', effects: { health: -1 }, result: '큰 이상 없이 무난히 넘어갔습니다.' },
      { text: '귀찮다는 이유로 미룬다', effects: { health: -4 }, result: '미루는 사이 몸 상태가 조금씩 나빠졌습니다.' },
      { text: '증상을 방치하다 뒤늦게 병원을 찾는다', effects: { health: -10, wealth: -8 }, result: '초기에 잡았으면 좋았을 병이 크게 자랐습니다.' },
    ] },
    { id: 'mid_hobby', domain: '식상', minAge: 56, maxAge: 70, title: '여유로운 취미', desc: '시간적 여유가 생겨 새로운 것을 배워볼까 합니다.', choices: [
      { text: '동호회에 적극적으로 가입한다', effects: { happy: 6, fame: 3, wealth: -2 }, result: '비슷한 또래와 어울리며 활력을 되찾았습니다.' },
      { text: '혼자 조용히 즐긴다', effects: { happy: 4, wisdom: 2 }, result: '고요한 시간 속에서 마음의 평화를 얻었습니다.' },
      { text: '의욕 없이 하루하루를 흘려보낸다', effects: { happy: -3 }, result: '무기력함이 마음을 짓눌렀습니다.' },
      { text: '무리한 활동으로 몸을 상한다', effects: { happy: 2, health: -5 }, result: '의욕이 앞서 몸에 무리가 왔습니다.' },
    ] },
    { id: 'mid_grandchild', domain: '식상', minAge: 55, maxAge: 75, title: '손주 재롱', desc: '오랜만에 만난 어린 조카(혹은 손주)가 재롱을 부립니다.', choices: [
      { text: '함께 시간을 듬뿍 보낸다', effects: { happy: 8, health: -1 }, result: '웃음 가득한 시간을 보내며 행복해했습니다.' },
      { text: '용돈을 쥐여준다', effects: { happy: 4, wealth: -3 }, result: '환하게 웃는 모습에 덩달아 기분이 좋아졌습니다.' },
      { text: '피곤해서 건성으로 대한다', effects: { happy: -2 }, result: '아이의 서운한 표정에 마음이 편치 않았습니다.' },
      { text: '짜증을 내며 매몰차게 대한다', effects: { happy: -5, fame: -2 }, result: '두고두고 후회할 말을 내뱉고 말았습니다.' },
    ] },

    // ── 노년기 71-100 ──
    { id: 'old_walk', domain: '인성', minAge: 71, maxAge: 99, title: '아침 산책', desc: '동네를 천천히 걷는 것이 하루의 큰 낙이 되었습니다.', choices: [
      { text: '매일 꾸준히 걷는다', effects: { health: 6, happy: 3 }, result: '규칙적인 산책 덕분에 몸이 한결 가벼워졌습니다.' },
      { text: '날이 좋을 때만 나간다', effects: { happy: 3 }, result: '무리하지 않고 편안하게 지냈습니다.' },
      { text: '귀찮아서 거의 나가지 않는다', effects: { health: -3 }, result: '움직임이 줄며 몸이 조금씩 무거워졌습니다.' },
      { text: '무리하게 걷다가 넘어져 다친다', effects: { health: -8, happy: -2 }, result: '과욕이 부른 부상에 한동안 고생했습니다.' },
    ] },
    { id: 'old_friend', domain: '비겁', minAge: 71, maxAge: 99, title: '옛 친구들과의 모임', desc: '오랜 친구들과 모처럼 모임을 가졌습니다.', choices: [
      { text: '적극적으로 어울리며 즐긴다', effects: { happy: 7, fame: 2 }, result: '지나온 세월을 추억하며 크게 웃었습니다.' },
      { text: '잠깐 얼굴만 비춘다', effects: { happy: 3 }, result: '짧지만 반가운 시간을 보냈습니다.' },
      { text: '피곤해서 집에서 쉰다', effects: { health: 2, happy: -2 }, result: '몸은 편했지만 마음 한구석이 허전했습니다.' },
      { text: '오랜 갈등이 다시 불거져 크게 다툰다', effects: { happy: -6, fame: -2 }, result: '묵혀둔 앙금이 터지며 마음이 크게 상했습니다.' },
    ] },
    { id: 'old_hospital', domain: '인성', minAge: 72, maxAge: 99, title: '병원 나들이', desc: '몸 여기저기가 예전 같지 않아 병원을 찾았습니다.', choices: [
      { text: '적극적으로 치료받고 관리한다', effects: { health: 7, wealth: -5 }, result: '치료 덕분에 몸이 한결 편안해졌습니다.' },
      { text: '자연스럽게 받아들인다', effects: { happy: 2, health: -2 }, result: '나이 듦을 담담히 받아들이기로 했습니다.' },
      { text: '치료를 차일피일 미룬다', effects: { health: -5 }, result: '미루는 사이 불편함이 점점 커졌습니다.' },
      { text: '방치하다 상태가 크게 나빠진다', effects: { health: -11, wealth: -6 }, result: '뒤늦은 치료로 몸도 마음도 크게 지쳤습니다.' },
    ] },
    { id: 'old_reflect', domain: '인성', minAge: 75, maxAge: 99, title: '인생을 돌아보며', desc: '문득 지나온 삶을 돌아보게 되었습니다.', choices: [
      { text: '정성껏 일기로 기록을 남긴다', effects: { wisdom: 6, happy: 4 }, result: '차분히 지난 날들을 정리하며 마음이 평온해졌습니다.' },
      { text: '가족에게 이야기를 들려준다', effects: { fame: 4, happy: 2 }, result: '가족들이 귀 기울여 들으며 함께 웃고 울었습니다.' },
      { text: '씁쓸한 후회에 잠긴다', effects: { happy: -3 }, result: '지나간 일들이 자꾸 마음에 걸렸습니다.' },
      { text: '지난 일로 크게 마음의 병을 얻는다', effects: { happy: -7, health: -3 }, result: '풀지 못한 회한이 몸과 마음을 크게 갉아먹었습니다.' },
    ] },

    // ── 전 연령(19+) 공통 이벤트 ──
    { id: 'any_lottery', domain: '재성', minAge: 19, maxAge: 99, title: '뜻밖의 행운', desc: '길을 걷다 우연히 작은 행운이 찾아왔습니다.', choices: [
      { text: '감사히 받아 의미 있게 쓴다', effects: { wealth: 6, happy: 4 }, result: '작은 행운을 알차게 나누며 하루가 즐거워졌습니다.' },
      { text: '대수롭지 않게 넘긴다', effects: { wisdom: 2 }, result: '큰 의미를 두지 않고 평소처럼 지냈습니다.' },
      { text: '들뜬 마음에 충동적으로 써버린다', effects: { happy: 3, wealth: -2 }, result: '잠깐의 즐거움 뒤에 아쉬움이 남았습니다.' },
      { text: '이를 노린 사기에 휘말린다', effects: { wealth: -8, wisdom: -2 }, result: '뜻밖의 행운이 오히려 화근이 되었습니다.' },
    ] },
    { id: 'any_scam', domain: '재성', minAge: 20, maxAge: 80, title: '수상한 제안', desc: '솔깃한 투자 제안을 받았습니다. 어딘가 미심쩍습니다.', choices: [
      { text: '단호히 거절하고 신고까지 한다', effects: { wisdom: 5, fame: 3 }, result: '현명한 판단으로 스스로도 주변도 지켜냈습니다.' },
      { text: '정중히 거절한다', effects: { wisdom: 2 }, result: '괜한 위험을 피해 갔습니다.' },
      { text: '반신반의하며 조금 발을 담근다', effects: { wealth: -4, wisdom: -1 }, result: '작게 시작했지만 결국 손해를 봤습니다.' },
      { text: '솔깃해 크게 투자했다가 전부 잃는다', effects: { wealth: -12, wisdom: -3 }, result: '뒤늦게야 사기였음을 깨닫고 크게 자책했습니다.' },
    ] },
    { id: 'any_conflict', domain: '비겁', minAge: 19, maxAge: 90, title: '갈등의 순간', desc: '가까운 사람과 오해가 생겨 갈등이 있었습니다.', choices: [
      { text: '진심으로 다가가 풀어낸다', effects: { fame: 5, happy: 3 }, result: '진심이 통해 관계가 더 돈독해졌습니다.' },
      { text: '시간이 해결해주길 기다린다', effects: { happy: -1 }, result: '시간이 지나며 자연스레 풀렸습니다.' },
      { text: '자존심 때문에 먼저 말을 아낀다', effects: { happy: -3, fame: -1 }, result: '풀리지 않은 앙금이 계속 마음에 남았습니다.' },
      { text: '감정이 폭발해 크게 틀어진다', effects: { fame: -6, happy: -5 }, result: '돌이키기 힘든 상처만 남기고 말았습니다.' },
    ] },
    { id: 'any_weather', domain: '인성', minAge: 19, maxAge: 99, title: '궂은 날씨', desc: '오랜 장마와 궂은 날씨에 몸과 마음이 축축 처집니다.', choices: [
      { text: '컨디션을 관리하며 알차게 보낸다', effects: { health: 4, happy: 2 }, result: '무리하지 않고 컨디션을 잘 유지했습니다.' },
      { text: '실내에서 조용히 지낸다', effects: { happy: 1 }, result: '차분하게 시간을 흘려보냈습니다.' },
      { text: '무기력하게 하루하루를 보낸다', effects: { happy: -2 }, result: '축 처진 날씨만큼이나 기분도 가라앉았습니다.' },
      { text: '컨디션 관리를 소홀히 해 크게 앓는다', effects: { health: -6, happy: -2 }, result: '날씨 탓만 하다 몸살을 크게 앓았습니다.' },
    ] },
  ];

  const MILESTONES = [
    { age: 19, id: 'ms_adult', title: '성인이 되다', desc: '어른이 되는 해입니다. 앞으로의 길을 정해야 합니다.', choices: [
      { text: '목표를 세워 대학 진학을 준비한다', effects: { wisdom: 9, wealth: -3 }, result: '뚜렷한 목표를 갖고 새로운 배움에 뛰어들었습니다.' },
      { text: '우선 사회에 진출해본다', effects: { wealth: 5, wisdom: -1 }, result: '일찍이 사회 경험을 쌓기 시작했습니다.' },
      { text: '별다른 계획 없이 흘러가는 대로 지낸다', effects: { happy: 1, wisdom: -3 }, result: '뚜렷한 방향 없이 하루하루를 보냈습니다.' },
      { text: '아무 결정도 못한 채 시간만 흘려보낸다', effects: { happy: -4, wisdom: -5, wealth: -2 }, result: '망설이는 사이 소중한 시간이 지나가 버렸습니다.' },
    ] },
    { age: 23, id: 'ms_career', title: '첫 사회생활', desc: '첫 직장(혹은 사업)에 발을 내딛는 순간입니다.', choices: [
      { text: '철저히 준비해 열정적으로 뛰어든다', effects: { wealth: 8, happy: 5, fame: 2 }, result: '열정적으로 뛰어들며 값진 경험을 쌓았습니다.' },
      { text: '신중하게 자리를 잡는다', effects: { fame: 3, wealth: 3 }, result: '차근차근 신뢰를 쌓으며 자리를 잡았습니다.' },
      { text: '자신감 없이 소극적으로 임한다', effects: { happy: -2, fame: -1 }, result: '주눅 든 태도로 좀처럼 기회를 살리지 못했습니다.' },
      { text: '큰 실수를 저질러 신뢰를 잃는다', effects: { fame: -6, happy: -4 }, result: '값비싼 실수로 첫 단추를 잘못 끼웠습니다.' },
    ] },
    { age: 28, id: 'ms_marriage', title: '인생의 동반자', desc: '결혼 적령기, 평생을 함께할 사람에 대해 고민하게 됩니다.', choices: [
      { text: '서로를 깊이 이해하고 결혼을 결심한다', effects: { happy: 9, wealth: -4, fame: 3 }, result: '평생의 동반자와 새로운 가정을 꾸렸습니다.' },
      { text: '지금은 혼자만의 삶에 집중한다', effects: { wisdom: 4, wealth: 3 }, result: '온전히 나에게 집중하는 시간을 택했습니다.' },
      { text: '확신 없이 떠밀리듯 관계를 이어간다', effects: { happy: -2 }, result: '마음 한구석에 계속 의문이 남았습니다.' },
      { text: '성급한 결정으로 큰 갈등을 겪는다', effects: { happy: -7, wealth: -6, fame: -2 }, result: '준비 없는 결정이 큰 아픔으로 돌아왔습니다.' },
    ] },
    { age: 40, id: 'ms_midlife', title: '불혹, 인생 중반', desc: '흔들리지 않을 나이, 지나온 삶을 돌아보게 됩니다.', choices: [
      { text: '지난 삶을 돌아보고 새 목표를 세운다', effects: { happy: 6, wisdom: 4 }, result: '인생 후반전을 위한 새 목표를 그렸습니다.' },
      { text: '지금까지의 안정을 지킨다', effects: { wealth: 4, health: 2 }, result: '쌓아온 것들을 단단히 지켜나가기로 했습니다.' },
      { text: '허탈감에 별다른 의욕이 없다', effects: { happy: -3 }, result: '이유 모를 허탈함이 계속 마음을 짓눌렀습니다.' },
      { text: '방황 끝에 무리한 선택으로 크게 흔들린다', effects: { wealth: -6, happy: -5 }, result: '충동적인 결정이 큰 후회로 남았습니다.' },
    ] },
    { age: 60, id: 'ms_hwan', title: '환갑잔치', desc: '60번째 생일, 가족과 지인들이 모여 환갑잔치를 열어주었습니다.', choices: [
      { text: '온 가족과 성대하게 기념한다', effects: { happy: 9, fame: 5, wealth: -4 }, result: '오랜만에 모인 사람들과 웃음꽃을 피웠습니다.' },
      { text: '가까운 가족끼리 조용히 보낸다', effects: { happy: 5, wealth: 1 }, result: '소박하지만 따뜻한 시간을 보냈습니다.' },
      { text: '형편이 여의치 않아 그냥 넘어간다', effects: { happy: -2 }, result: '아쉬움을 뒤로하고 조용히 넘어갔습니다.' },
      { text: '가족 간 갈등으로 잔치를 망친다', effects: { happy: -6, fame: -3 }, result: '뜻깊어야 할 날이 씁쓸하게 마무리됐습니다.' },
    ] },
    { age: 70, id: 'ms_gohee', title: '고희', desc: '70번째 생일, 예로부터 드물다는 나이에 이르렀습니다.', choices: [
      { text: '평생의 이야기를 정성껏 글로 남긴다', effects: { wisdom: 7, happy: 4 }, result: '지나온 삶을 글로 정리하며 뜻깊은 시간을 보냈습니다.' },
      { text: '남은 날들을 편히 즐긴다', effects: { happy: 6, health: 2 }, result: '욕심을 내려놓고 하루하루를 여유롭게 즐겼습니다.' },
      { text: '몸이 예전 같지 않아 씁쓸해한다', effects: { happy: -2, health: -2 }, result: '예전만 못한 몸에 마음이 편치 않았습니다.' },
      { text: '건강이 크게 나빠져 뜻대로 지내지 못한다', effects: { health: -8, happy: -4 }, result: '바라던 것과 달리 몸져눕는 날이 많아졌습니다.' },
    ] },
    { age: 80, id: 'ms_pal', title: '팔순', desc: '80번째 생일, 온 가족이 모여 축하해주었습니다.', choices: [
      { text: '온 가족과 함께 성대히 기념한다', effects: { happy: 9, fame: 4 }, result: '자손들에 둘러싸여 벅찬 행복을 느꼈습니다.' },
      { text: '조용히 지난 세월을 음미한다', effects: { happy: 5, wisdom: 3 }, result: '고요한 하루, 지나온 세월을 가만히 되새겼습니다.' },
      { text: '몸이 힘들어 자리를 지키기도 버겁다', effects: { happy: -2, health: -3 }, result: '마음과 달리 몸이 따라주지 않았습니다.' },
      { text: '건강이 크게 악화되어 자리에 눕는다', effects: { health: -10, happy: -5 }, result: '뜻깊은 날을 병상에서 맞이하고 말았습니다.' },
    ] },
  ];

  return { STATS, EVENT_POOL, MILESTONES };
})();

if (typeof module !== 'undefined') module.exports = GameData;
