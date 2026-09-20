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

  // 십성(오행 관계) x 길흉 등급별 예측 문구 - "이번 달엔 이런 일이 일어나기 쉽다"는 해석
  const TEN_GOD_PREDICTIONS = {
    비겁: {
      대길: '주변 사람들과 힘을 합치면 큰 성과를 낼 수 있는 달입니다. 경쟁에서도 유리한 흐름이 이어집니다.',
      길: '동료나 친구와의 관계에서 좋은 기운이 따르는 달입니다.',
      평: '나 자신의 페이스를 지키며 무난히 흘러가는 달입니다.',
      흉: '주변과 다소 부딪히거나 경쟁에서 밀릴 수 있는 달입니다.',
      대흉: '가까운 사람과 갈등이 커지거나 손해를 볼 수 있으니 각별한 주의가 필요한 달입니다.',
    },
    식상: {
      대길: '표현하고 도전한 만큼 크게 인정받는 달입니다. 새로운 시도가 좋은 결실을 맺습니다.',
      길: '활동적으로 움직이면 즐거운 일이 따르는 달입니다.',
      평: '큰 기복 없이 하고 싶은 일을 해나갈 수 있는 달입니다.',
      흉: '의욕은 넘치지만 헛수고가 되기 쉬운 달입니다. 과욕을 조심하세요.',
      대흉: '경솔한 언행이나 무리한 시도가 큰 화를 부를 수 있는 달입니다.',
    },
    재성: {
      대길: '재물운이 크게 열리는 달입니다. 뜻밖의 수입이나 좋은 투자 기회가 찾아올 수 있습니다.',
      길: '돈과 관련해 좋은 흐름이 따르는 달입니다.',
      평: '수입과 지출이 무난하게 흘러가는 달입니다.',
      흉: '지출이 늘거나 재물이 새어나가기 쉬운 달입니다.',
      대흉: '큰 손실이나 금전 사고를 조심해야 하는 달입니다.',
    },
    관성: {
      대길: '책임을 맡을수록 크게 인정받는 달입니다. 승진이나 좋은 자리로 이어질 수 있습니다.',
      길: '맡은 일에 성실히 임하면 좋은 평가가 따르는 달입니다.',
      평: '할 일은 많지만 무난히 감당할 수 있는 달입니다.',
      흉: '책임과 부담이 무겁게 느껴지는 달입니다. 스트레스 관리가 필요합니다.',
      대흉: '큰 압박이나 시련이 닥칠 수 있는 달입니다. 무리한 도전은 피하는 것이 좋습니다.',
    },
    인성: {
      대길: '배움과 귀인의 도움이 크게 따르는 달입니다. 좋은 기회가 자연스레 찾아옵니다.',
      길: '차분히 쌓아온 것들이 빛을 발하는 달입니다.',
      평: '평온하게 스스로를 돌아볼 수 있는 달입니다.',
      흉: '생각이 많아지고 결정이 늦어지기 쉬운 달입니다.',
      대흉: '건강이나 마음이 지치기 쉬운 달이니 무리하지 말고 쉬어가세요.',
    },
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

    return {
      tier, tierMult, score, dominant,
      desc: TEN_GOD_PREDICTIONS[dominant][tier],
      pillarLabel: pillarLabel(cur.month),
    };
  }

  const TIER_REMARK = {
    대길: '사주에서 예견된 대로 좋은 결과로 이어졌습니다.',
    길: '전체적으로 무난하고 좋은 흐름이었습니다.',
    평: '예상한 범위 안에서 흘러갔습니다.',
    흉: '예상대로 순탄치만은 않았습니다.',
    대흉: '사주에서 우려했던 대로 어려움을 겪었습니다.',
  };

  return {
    STEMS, BRANCHES, STEM_HANJA, BRANCH_HANJA, ELEMENTS, ANIMALS,
    calcFourPillars, calcYearMonthPillar, pillarLabel,
    elementOf, countElements, tenGodGroup, monthlyFortune, TIER_REMARK,
  };
})();

if (typeof module !== 'undefined') module.exports = Saju;
