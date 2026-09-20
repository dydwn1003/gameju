/* 사주(四柱) 계산 엔진
 * 절기(태양 황경) 기반의 정밀 월주 경계 계산 + 60갑자 연/월/일/시주 산출.
 * 태양 황경 공식은 Meeus 저 "Astronomical Algorithms"의 저정밀(low-precision) 태양 좌표식(오차 수 분~1시간 이내).
 */

const Saju = (() => {
  const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const STEM_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCH_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const ELEMENTS = ['목', '화', '토', '금', '수'];
  const STEM_ELEMENT_IDX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const BRANCH_ELEMENT_IDX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const STEM_YINYANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]; // 1=양, 0=음
  const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  function toRad(d) { return (d * Math.PI) / 180; }
  function normalize360(x) { return ((x % 360) + 360) % 360; }

  function kstToJD(y, m, d, hh, mm) {
    const ms = Date.UTC(y, m - 1, d, (hh || 0) - 9, mm || 0, 0);
    return ms / 86400000 + 2440587.5;
  }

  function solarLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mr = toRad(normalize360(M));
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
      0.000289 * Math.sin(3 * Mr);
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * T;
    const apparent = trueLong - 0.00569 - 0.00478 * Math.sin(toRad(omega));
    return normalize360(apparent);
  }

  function findTermJD(year, targetDeg, guessMonth, guessDay) {
    let jd = kstToJD(year, guessMonth, guessDay, 12, 0);
    for (let i = 0; i < 8; i++) {
      const L = solarLongitude(jd);
      let diff = targetDeg - L;
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      jd += diff / 0.9856002;
    }
    return jd;
  }

  function calendarJDN(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const y2 = y + 4800 - a;
    const m2 = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * m2 + 2) / 5) +
      365 * y2 +
      Math.floor(y2 / 4) -
      Math.floor(y2 / 100) +
      Math.floor(y2 / 400) -
      32045
    );
  }

  // 절기(절, 12개) 정의: branch = 그 절기가 시작하는 월지, angle = 태양황경, gm/gd = 탐색 초기값(월/일)
  const TERM_DEFS = [
    { branch: 1, angle: 285, gm: 1, gd: 6 },   // 축월 시작 - 소한
    { branch: 2, angle: 315, gm: 2, gd: 4 },   // 인월 시작 - 입춘
    { branch: 3, angle: 345, gm: 3, gd: 6 },   // 묘월 시작 - 경칩
    { branch: 4, angle: 15, gm: 4, gd: 5 },    // 진월 시작 - 청명
    { branch: 5, angle: 45, gm: 5, gd: 6 },    // 사월 시작 - 입하
    { branch: 6, angle: 75, gm: 6, gd: 6 },    // 오월 시작 - 망종
    { branch: 7, angle: 105, gm: 7, gd: 7 },   // 미월 시작 - 소서
    { branch: 8, angle: 135, gm: 8, gd: 8 },   // 신월 시작 - 입추
    { branch: 9, angle: 165, gm: 9, gd: 8 },   // 유월 시작 - 백로
    { branch: 10, angle: 195, gm: 10, gd: 8 }, // 술월 시작 - 한로
    { branch: 11, angle: 225, gm: 11, gd: 8 }, // 해월 시작 - 입동
    { branch: 0, angle: 255, gm: 12, gd: 7 },  // 자월 시작 - 대설
  ];

  const termJDCache = new Map();
  function termJD(year, def) {
    const key = year + '_' + def.angle;
    if (!termJDCache.has(key)) {
      termJDCache.set(key, findTermJD(year, def.angle, def.gm, def.gd));
    }
    return termJDCache.get(key);
  }

  // year 를 포함하도록 전년도 12월(자월) ~ 익년도 1월(축월)까지 경계 14개 생성
  function buildMonthBoundaries(y) {
    const points = [];
    points.push({ branch: 0, jd: termJD(y - 1, TERM_DEFS[11]) }); // 전년도 자월
    for (const def of TERM_DEFS) points.push({ branch: def.branch, jd: termJD(y, def) });
    points.push({ branch: 1, jd: termJD(y + 1, TERM_DEFS[0]) }); // 익년도 축월
    return points;
  }

  function findBracketBranch(points, jd) {
    for (let i = 0; i < points.length - 1; i++) {
      if (jd >= points[i].jd && jd < points[i + 1].jd) return points[i].branch;
    }
    return points[points.length - 2].branch;
  }

  function ipchunJD(year) {
    return termJD(year, TERM_DEFS[1]);
  }

  const MONTH_STEM_BASE = [2, 4, 6, 8, 0]; // yearStem%5 -> 인월의 천간
  function monthStemFromYearStem(yearStem, monthBranch) {
    const base = MONTH_STEM_BASE[((yearStem % 5) + 5) % 5];
    const offset = ((monthBranch - 2 + 12) % 12);
    return (base + offset) % 10;
  }

  const HOUR_STEM_BASE = [0, 2, 4, 6, 8]; // dayStem%5 -> 자시의 천간
  function hourStemFromDayStem(dayStem, hourBranch) {
    const base = HOUR_STEM_BASE[((dayStem % 5) + 5) % 5];
    return (base + hourBranch) % 10;
  }

  function hourBranchIndex(hh, mm) {
    if (hh == null) return null;
    return Math.floor((hh + 1) / 2) % 12;
  }

  // y,m,d,hh,mm: KST 기준 생년월일시 (hh/mm 은 null 허용 - 시주 미상)
  function calcFourPillars(y, m, d, hh, mm) {
    const birthJD = kstToJD(y, m, d, hh == null ? 12 : hh, hh == null ? 0 : mm);

    const ipchun = ipchunJD(y);
    const effYear = birthJD < ipchun ? y - 1 : y;
    const yearStem = ((effYear - 4) % 10 + 10) % 10;
    const yearBranch = ((effYear - 4) % 12 + 12) % 12;

    const boundaries = buildMonthBoundaries(y);
    const monthBranch = findBracketBranch(boundaries, birthJD);
    const monthStem = monthStemFromYearStem(yearStem, monthBranch);

    let sajuY = y, sajuM = m, sajuD = d;
    if (hh != null && hh >= 23) {
      const nd = new Date(Date.UTC(y, m - 1, d + 1));
      sajuY = nd.getUTCFullYear();
      sajuM = nd.getUTCMonth() + 1;
      sajuD = nd.getUTCDate();
    }
    const jdn = calendarJDN(sajuY, sajuM, sajuD);
    const dayStem = ((jdn + 9) % 10 + 10) % 10;
    const dayBranch = ((jdn + 1) % 12 + 12) % 12;

    let hourPillar = null;
    if (hh != null) {
      const hb = hourBranchIndex(hh, mm);
      const hs = hourStemFromDayStem(dayStem, hb);
      hourPillar = { stem: hs, branch: hb };
    }

    return {
      year: { stem: yearStem, branch: yearBranch },
      month: { stem: monthStem, branch: monthBranch },
      day: { stem: dayStem, branch: dayBranch },
      hour: hourPillar,
      effYear,
    };
  }

  // 게임 진행용: 특정 (연,월)의 세운/월운 간지만 필요할 때 (일/시는 대표값으로 계산, 무시)
  function calcYearMonthPillar(year, month) {
    const p = calcFourPillars(year, month, 15, 12, 0);
    return { year: p.year, month: p.month };
  }

  function pillarLabel(p, hanja) {
    if (!p) return '-';
    const stems = hanja ? STEM_HANJA : STEMS;
    const branches = hanja ? BRANCH_HANJA : BRANCHES;
    return stems[p.stem] + branches[p.branch];
  }

  function elementOf(idx, isStem) {
    return ELEMENTS[isStem ? STEM_ELEMENT_IDX[idx] : BRANCH_ELEMENT_IDX[idx]];
  }

  function countElements(pillars) {
    const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    for (const key of ['year', 'month', 'day', 'hour']) {
      const p = pillars[key];
      if (!p) continue;
      counts[elementOf(p.stem, true)]++;
      counts[elementOf(p.branch, false)]++;
    }
    return counts;
  }

  const GEN = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // 상생: 내가 낳는 오행
  const OVERCOME = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }; // 상극: 내가 극하는 오행

  // dayMasterEl 관점에서 otherEl 과의 관계(십성 그룹) 반환
  function tenGodGroup(dayMasterEl, otherEl) {
    if (otherEl === dayMasterEl) return '비겁';
    if (GEN[otherEl] === dayMasterEl) return '인성';
    if (GEN[dayMasterEl] === otherEl) return '식상';
    if (OVERCOME[dayMasterEl] === otherEl) return '재성';
    if (OVERCOME[otherEl] === dayMasterEl) return '관성';
    return '비겁';
  }

  const TEN_GOD_SCORE = { 비겁: 0.5, 인성: 2, 식상: 0.5, 재성: 1.5, 관성: -1.5 };

  // 십성(오행 관계)별 이번 달에 들어오는 기운을 설명하는 도입부
  const DOMAIN_INTRO = {
    비겁: '이번 달은 비견·겁재의 기운이 두드러져, 나 자신과 동료·친구·형제 같은 주변 사람들과의 관계가 화두로 떠오릅니다.',
    식상: '이번 달은 식신·상관의 기운이 강해져, 표현하고 움직이고 싶은 마음이 커지는 시기입니다.',
    재성: '이번 달은 재성의 기운이 짙게 들어와, 돈과 관련된 크고 작은 일들이 중심에 놓이는 시기입니다.',
    관성: '이번 달은 관성의 기운이 강하게 들어와, 책임과 역할, 평가와 관련된 일들이 무게감 있게 다가옵니다.',
    인성: '이번 달은 인성의 기운이 두드러져, 배움과 휴식, 그리고 나를 돌보는 일이 중요해지는 시기입니다.',
  };

  // 십성 x 길흉 등급별 - "구체적으로 이런 일이 일어나기 쉽다"는 해석
  const DOMAIN_TIER_BODY = {
    비겁: {
      대길: '동료나 친구와 힘을 합쳐 도전하면 경쟁에서 유리한 고지를 점하거나, 뜻이 맞는 사람과 새로운 일을 함께 도모하게 될 수 있습니다.',
      길: '주변 사람들과의 관계에서 좋은 기운이 따라, 든든한 지원군을 얻거나 협력의 기회가 생길 수 있습니다.',
      평: '큰 사건 없이 나 자신의 페이스를 지키며 무난히 흘러가지만, 주변과의 관계는 평소처럼 유지됩니다.',
      흉: '경쟁 상대와 부딪히거나, 믿었던 사람과 사소한 마찰이 생겨 마음이 상할 수 있습니다.',
      대흉: '가까운 사람과의 갈등이 커지거나, 동업·동료 관계에서 손해를 볼 수 있어 각별한 주의가 필요합니다.',
    },
    식상: {
      대길: '아이디어를 실행에 옮기거나 하고 싶은 말을 용기 내어 전하면, 예상보다 훨씬 크게 인정받거나 좋은 결실로 이어질 수 있습니다.',
      길: '활동적으로 움직이고 사람들과 어울리면 즐거운 인연이나 뜻밖의 기쁜 소식이 따를 수 있습니다.',
      평: '큰 기복 없이 하고 싶은 일을 하나씩 해나갈 수 있는, 평온하게 흘러가는 시기입니다.',
      흉: '의욕은 넘치지만 계획한 만큼의 성과로 이어지지 않아 헛수고가 되기 쉬우니 과욕을 조심해야 합니다.',
      대흉: '경솔한 말이나 무리한 시도가 구설수나 큰 화를 부를 수 있으니, 언행에 각별히 신경 써야 하는 시기입니다.',
    },
    재성: {
      대길: '뜻밖의 수입이 생기거나, 그동안 눈여겨보던 투자·사업 기회가 실제로 좋은 결과로 이어질 수 있는 시기입니다.',
      길: '수입이 늘거나 돈이 들어올 좋은 흐름이 따르니, 계획했던 재정적인 결정을 실행에 옮기기 좋은 때입니다.',
      평: '수입과 지출이 무난하게 흘러가며, 특별히 좋지도 나쁘지도 않은 평온한 재물운이 이어집니다.',
      흉: '예상치 못한 지출이 늘거나, 손에 쥔 재물이 조금씩 새어나가기 쉬운 시기입니다.',
      대흉: '충동적인 투자나 큰 지출, 금전 사고로 이어질 수 있는 위험한 시기이니 지갑을 단속해야 합니다.',
    },
    관성: {
      대길: '맡은 책임을 다한 만큼 크게 인정받아, 승진이나 중요한 자리를 제안받는 등 좋은 기회로 이어질 수 있습니다.',
      길: '맡은 일에 성실히 임하면 위에서 좋은 평가를 받거나, 신뢰를 쌓을 수 있는 기회가 생기는 시기입니다.',
      평: '해야 할 일은 많지만 크게 무리하지 않고 감당할 수 있는, 안정적인 흐름이 이어집니다.',
      흉: '책임과 부담이 평소보다 무겁게 느껴지고, 위에서의 압박이나 스트레스가 늘어날 수 있습니다.',
      대흉: '감당하기 힘든 압박이나 시련이 닥칠 수 있는 시기이니, 무리한 도전이나 새로운 책임은 피하는 것이 좋습니다.',
    },
    인성: {
      대길: '배움의 기회나 귀인의 도움이 자연스럽게 찾아와, 큰 힘을 들이지 않고도 원하는 것을 얻을 수 있는 시기입니다.',
      길: '차분히 쌓아온 노력과 지식이 빛을 발하며, 주변의 조언이나 도움이 힘이 되는 시기입니다.',
      평: '특별한 사건 없이 스스로를 돌아보고 재정비할 수 있는, 평온한 시기입니다.',
      흉: '생각이 많아지고 결정이 자꾸 늦어지며, 의지할 곳이 마땅치 않게 느껴질 수 있습니다.',
      대흉: '몸과 마음이 쉽게 지치고 건강에 적신호가 켜지기 쉬운 시기이니, 무리하지 말고 충분히 쉬어야 합니다.',
    },
  };

  // 길흉 등급별 마무리 조언 (도입부·본문과 조합되어 한 달 해석 전체를 구성)
  const TIER_ADVICE = {
    대길: '이런 흐름이라면 다소 과감하게 움직여도 좋은 결과로 이어질 가능성이 높습니다.',
    길: '무리하지 않는 선에서 적극적으로 움직여 보는 것도 좋은 시기입니다.',
    평: '큰 욕심 부리지 않고 평소의 리듬을 지키는 것이 좋은 시기입니다.',
    흉: '중요한 결정은 조금 미루고, 신중하게 상황을 살피는 편이 안전합니다.',
    대흉: '가능하다면 무리한 도전이나 큰 결정은 피하고, 몸과 마음을 추스르는 데 집중하는 것이 좋습니다.',
  };

  // natalPillars: calcFourPillars 결과, currentYear/currentMonth: 게임상 현재 연/월
  function monthlyFortune(natalPillars, currentYear, currentMonth) {
    const dayMasterEl = elementOf(natalPillars.day.stem, true);
    const cur = calcYearMonthPillar(currentYear, currentMonth);
    const parts = [
      { el: elementOf(cur.year.stem, true), w: 1 },
      { el: elementOf(cur.year.branch, false), w: 1 },
      { el: elementOf(cur.month.stem, true), w: 1.2 },
      { el: elementOf(cur.month.branch, false), w: 1.2 },
    ];
    let score = 0;
    const groups = {};
    for (const part of parts) {
      const g = tenGodGroup(dayMasterEl, part.el);
      groups[g] = (groups[g] || 0) + part.w;
      score += TEN_GOD_SCORE[g] * part.w;
    }
    let dominant = '비겁';
    let max = -Infinity;
    for (const g in groups) if (groups[g] > max) { max = groups[g]; dominant = g; }

    let tier, tierMult;
    if (score >= 3) { tier = '대길'; tierMult = 1.4; }
    else if (score >= 1) { tier = '길'; tierMult = 1.15; }
    else if (score > -1) { tier = '평'; tierMult = 1.0; }
    else if (score > -3) { tier = '흉'; tierMult = 0.85; }
    else { tier = '대흉'; tierMult = 0.6; }

    const desc = `${DOMAIN_INTRO[dominant]} ${DOMAIN_TIER_BODY[dominant][tier]} ${TIER_ADVICE[tier]}`;

    return {
      tier, tierMult, score, dominant,
      desc,
      pillarLabel: pillarLabel(cur.month),
    };
  }

  // 십성별 한 해 전체를 아우르는 도입부 (monthlyFortune의 DOMAIN_INTRO를 연 단위로 바꾼 버전)
  const YEAR_DOMAIN_INTRO = {
    비겁: '이 해는 비견·겁재의 기운이 두드러져, 나 자신과 동료·친구·형제 같은 주변 사람들과의 관계가 한 해의 화두로 떠오릅니다.',
    식상: '이 해는 식신·상관의 기운이 강해져, 표현하고 움직이고 도전하고 싶은 마음이 한 해 내내 커지는 시기입니다.',
    재성: '이 해는 재성의 기운이 짙게 들어와, 돈과 관련된 크고 작은 일들이 한 해의 중심에 놓이는 시기입니다.',
    관성: '이 해는 관성의 기운이 강하게 들어와, 책임과 역할, 평가와 관련된 일들이 한 해 내내 무게감 있게 다가옵니다.',
    인성: '이 해는 인성의 기운이 두드러져, 배움과 휴식, 나를 돌보는 일이 한 해의 중요한 화두가 되는 시기입니다.',
  };

  const TIER_REMARK = {
    대길: '사주에서 예견된 대로 좋은 결과로 이어졌습니다.',
    길: '전체적으로 무난하고 좋은 흐름이었습니다.',
    평: '예상한 범위 안에서 흘러갔습니다.',
    흉: '예상대로 순탄치만은 않았습니다.',
    대흉: '사주에서 우려했던 대로 어려움을 겪었습니다.',
  };

  // 연 단위 세운(歲運): 그 해 연주만으로 본 큰 흐름 (월주까지 보는 monthlyFortune보다 거시적)
  function yearlyFortune(natalPillars, year) {
    const dayMasterEl = elementOf(natalPillars.day.stem, true);
    const cur = calcYearMonthPillar(year, 6);
    const parts = [
      { el: elementOf(cur.year.stem, true), w: 1 },
      { el: elementOf(cur.year.branch, false), w: 1 },
    ];
    let score = 0;
    const groups = {};
    for (const part of parts) {
      const g = tenGodGroup(dayMasterEl, part.el);
      groups[g] = (groups[g] || 0) + part.w;
      score += TEN_GOD_SCORE[g] * part.w;
    }
    let dominant = '비겁';
    let max = -Infinity;
    for (const g in groups) if (groups[g] > max) { max = groups[g]; dominant = g; }

    let tier;
    if (score >= 1.5) tier = '대길';
    else if (score >= 0.5) tier = '길';
    else if (score > -0.5) tier = '평';
    else if (score > -1.5) tier = '흉';
    else tier = '대흉';

    const desc = `${YEAR_DOMAIN_INTRO[dominant]} ${DOMAIN_TIER_BODY[dominant][tier]} ${TIER_ADVICE[tier]}`;

    return { tier, dominant, desc, pillarLabel: pillarLabel(cur.year) };
  }

  // 대운(大運): 월주를 기준으로 순행/역행하며 10년마다 바뀌는 큰 운의 흐름
  // gender: 'M' | 'F', natal: calcFourPillars 결과
  function calcDaeun(y, m, d, hh, mm, gender, natal) {
    const bhh = hh == null ? 12 : hh;
    const bmm = hh == null ? 0 : mm;
    const birthJD = kstToJD(y, m, d, bhh, bmm);
    const yearStemYang = STEM_YINYANG[natal.year.stem] === 1;
    const forward = (yearStemYang && gender === 'M') || (!yearStemYang && gender === 'F');

    const boundaries = buildMonthBoundaries(y);
    let idx = 0;
    for (let i = 0; i < boundaries.length - 1; i++) {
      if (birthJD >= boundaries[i].jd && birthJD < boundaries[i + 1].jd) { idx = i; break; }
    }
    const daysToTerm = forward ? (boundaries[idx + 1].jd - birthJD) : (birthJD - boundaries[idx].jd);
    const startAge = Math.max(1, Math.round(daysToTerm / 3));

    const dir = forward ? 1 : -1;
    let cur = { stem: natal.month.stem, branch: natal.month.branch };
    const pillars = [];
    for (let i = 1; i <= 10; i++) {
      cur = { stem: ((cur.stem + dir) % 10 + 10) % 10, branch: ((cur.branch + dir) % 12 + 12) % 12 };
      const fromAge = startAge + (i - 1) * 10;
      if (fromAge > 100) break;
      pillars.push({ fromAge, toAge: fromAge + 9, stem: cur.stem, branch: cur.branch });
    }
    return { startAge, forward, pillars };
  }

  return {
    STEMS, BRANCHES, STEM_HANJA, BRANCH_HANJA, ELEMENTS, ANIMALS,
    calcFourPillars, calcYearMonthPillar, pillarLabel,
    elementOf, countElements, tenGodGroup, monthlyFortune, yearlyFortune, calcDaeun, TIER_REMARK,
  };
})();

if (typeof module !== 'undefined') module.exports = Saju;
