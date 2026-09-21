/* 게임 루프: 캐릭터 생성 -> 사주 원국 확인 -> 월별 진행(19~100세, 무대형 UI) -> 엔딩 */

(() => {
  const STAT_ELEMENT_MAP = {
    health: ['수', '토'],
    wealth: ['금', '토'],
    happy: ['화', '목'],
    wisdom: ['수', '목'],
    fame: ['화', '금'],
  };
  const RECENT_WINDOW = 8;
  const START_AGE = 19;
  // pickEvent 에서 다음 상황을 고를 때: 그 달의 사주 기운과 맞는 이벤트 / 지금까지 쌓아온 내 선택의 흐름과 맞는 이벤트 / 완전히 열린 확률, 순서로 우선 시도
  const FORTUNE_MATCH_CHANCE = 0.5;
  const TALLY_MATCH_CHANCE = 0.25;
  const MAX_AGE = 100;

  const SKIP_STRATEGIES = {
    challenge: { label: '도전적으로 산다', perYear: { wealth: 3, happy: 1, health: -2, wisdom: 1, fame: 2 } },
    stable: { label: '안정적으로 산다', perYear: { wealth: 2, happy: 2, health: 1, wisdom: 1, fame: 1 } },
    relaxed: { label: '여유롭게 흘러가는 대로 둔다', perYear: { wealth: 0, happy: 3, health: 2, wisdom: 0, fame: -1 } },
  };

  const CHAR_MOOD = {
    happy: { mouth: 'M68,86 Q80,98 92,86', browL: 'M62,58 Q68,52 76,58', browR: 'M84,58 Q92,52 98,58' },
    neutral: { mouth: 'M70,88 Q80,91 90,88', browL: 'M62,60 Q68,56 75,60', browR: 'M85,60 Q92,56 98,60' },
    tired: { mouth: 'M70,90 Q80,85 90,90', browL: 'M62,64 Q69,68 76,62', browR: 'M84,62 Q91,68 98,64' },
  };

  // 전신 캐릭터: 배경 씬 위에 서 있는 스탠딩 스프라이트
  // 성별(char-hair-m/f)과 나이대(char-wrinkle/char-beard/char-cane)는 CSS에서
  // .stage[data-gender], .stage[data-age-group] 속성으로 보이고 숨겨진다.
  const STAGE_CHARACTER_SVG = `<svg viewBox="0 0 160 340" class="stage-character-svg">
    <path class="char-robe" d="M20,330 Q20,160 56,110 L104,110 Q140,160 140,330 Z"/>
    <path class="char-sleeve-l" d="M56,114 Q28,140 34,182 Q48,155 60,124 Z"/>
    <path class="char-sleeve-r" d="M104,114 Q132,140 126,182 Q112,155 100,124 Z"/>
    <path class="char-sash" d="M32,200 Q80,214 128,200 L128,208 Q80,222 32,208 Z"/>
    <path class="char-collar" d="M56,110 L80,142 L104,110"/>
    <path class="char-cane" d="M134,150 L140,325 M126,150 Q134,140 142,150"/>
    <rect x="68" y="97" width="24" height="24" rx="6" class="char-skin"/>
    <circle cx="80" cy="70" r="34" class="char-skin"/>
    <path class="char-hair-m" d="M46,60 Q46,30 80,30 Q114,30 114,60 Q114,44 80,44 Q46,44 46,60 Z"/>
    <g class="char-hair-f">
      <path d="M44,62 Q40,28 80,28 Q120,28 116,62 Q118,110 104,120 Q112,80 96,50 Q88,42 80,42 Q72,42 64,50 Q48,80 56,120 Q42,110 44,62 Z"/>
      <circle cx="117" cy="66" r="4" class="char-pin"/>
    </g>
    <path class="char-brow-l" d="M62,60 Q68,56 75,60"/>
    <path class="char-brow-r" d="M85,60 Q92,56 98,60"/>
    <ellipse cx="68" cy="70" rx="3.2" ry="4" class="char-eye"/>
    <ellipse cx="92" cy="70" rx="3.2" ry="4" class="char-eye"/>
    <path class="char-wrinkle-l" d="M58,76 Q62,79 65,76"/>
    <path class="char-wrinkle-r" d="M95,76 Q98,79 102,76"/>
    <path class="char-mouth" d="M70,86 Q80,90 90,86"/>
    <path class="char-beard" d="M64,92 Q80,110 96,92 Q90,102 80,104 Q70,102 64,92 Z"/>
    <circle class="char-badge" cx="80" cy="196" r="6"/>
  </svg>`;

  // 배경 씬: 계절(data-season) · 나이대(data-age-group) · 성별(data-gender) ·
  // 생년(data-bg-variant, 출생연도로 고정)에 따라 CSS 로 요소가 바뀌는 산/마을 실루엣
  const STAGE_BG_SVG = `<svg class="stage-bg-svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice">
    <circle class="scene-orb" cx="335" cy="72" r="20"/>
    <g class="scene-stars">
      <circle cx="60" cy="40" r="1.6"/>
      <circle cx="120" cy="58" r="1.2"/>
      <circle cx="195" cy="32" r="1.6"/>
      <circle cx="255" cy="54" r="1.3"/>
      <circle cx="300" cy="30" r="1.4"/>
      <circle cx="30" cy="90" r="1.2"/>
    </g>
    <g class="scene-clouds">
      <ellipse cx="90" cy="55" rx="26" ry="10"/>
      <ellipse cx="128" cy="48" rx="20" ry="8"/>
      <ellipse cx="258" cy="40" rx="30" ry="11"/>
      <ellipse cx="292" cy="50" rx="18" ry="7"/>
    </g>
    <g class="scene-sparkle">
      <path class="spark" d="M40,50 L43,58 L51,61 L43,64 L40,72 L37,64 L29,61 L37,58 Z"/>
      <path class="spark" d="M200,25 L202,31 L208,33 L202,35 L200,41 L198,35 L192,33 L198,31 Z"/>
      <path class="spark" d="M110,95 L112,101 L118,103 L112,105 L110,111 L108,105 L102,103 L108,101 Z"/>
    </g>
    <path class="scene-mountain-far" d="M0,180 L60,120 L130,170 L200,110 L280,165 L340,130 L400,175 L400,260 L0,260 Z"/>
    <path class="scene-mountain-near" d="M0,220 L90,160 L180,210 L260,150 L340,205 L400,175 L400,260 L0,260 Z"/>
    <g class="scene-landmark-hanok" transform="translate(235,168)">
      <path class="scene-hanok-roof" d="M-8,26 Q42,-18 92,26 Q42,10 -8,26 Z"/>
      <rect class="scene-hanok-wall" x="4" y="26" width="76" height="38"/>
      <rect class="scene-hanok-door" x="30" y="42" width="22" height="22"/>
    </g>
    <g class="scene-landmark-river">
      <path class="scene-river-water" d="M0,214 Q110,190 220,214 Q300,232 400,208 L400,236 Q300,258 220,240 Q110,218 0,240 Z"/>
      <g class="scene-bridge" transform="translate(248,168)">
        <path class="scene-bridge-arch" d="M0,34 Q45,-4 90,34"/>
        <rect class="scene-bridge-deck" x="-4" y="30" width="98" height="5"/>
        <rect class="scene-bridge-post" x="-4" y="30" width="4" height="20"/>
        <rect class="scene-bridge-post" x="90" y="30" width="4" height="20"/>
      </g>
    </g>
    <g class="scene-landmark-pavilion" transform="translate(255,150)">
      <path class="scene-pavilion-roof" d="M-38,22 Q0,-18 38,22 Q0,8 -38,22 Z"/>
      <rect class="scene-pavilion-post" x="-30" y="22" width="5" height="46"/>
      <rect class="scene-pavilion-post" x="25" y="22" width="5" height="46"/>
      <rect class="scene-pavilion-rail" x="-30" y="40" width="60" height="4"/>
    </g>
    <g class="scene-tree-blossom" transform="translate(55,188)">
      <rect class="scene-tree-trunk" x="-3" y="0" width="6" height="48"/>
      <circle class="scene-tree-foliage" cx="0" cy="-16" r="24"/>
      <circle class="scene-blossom" cx="-13" cy="-24" r="3.2"/>
      <circle class="scene-blossom" cx="9" cy="-30" r="3.2"/>
      <circle class="scene-blossom" cx="15" cy="-8" r="3.2"/>
      <circle class="scene-blossom" cx="-9" cy="-2" r="3.2"/>
      <circle class="scene-blossom" cx="2" cy="-16" r="3.2"/>
    </g>
    <g class="scene-tree-pine" transform="translate(55,188)">
      <rect class="scene-tree-trunk" x="-3" y="0" width="6" height="44"/>
      <path class="scene-pine-foliage" d="M0,-46 L18,-16 L9,-16 L24,6 L13,6 L28,30 L-28,30 L-13,6 L-24,6 L-9,-16 L-18,-16 Z"/>
      <circle class="scene-snow" cx="-9" cy="8" r="3"/>
      <circle class="scene-snow" cx="10" cy="-4" r="2.6"/>
      <circle class="scene-snow" cx="1" cy="18" r="3.2"/>
    </g>
    <rect class="scene-ground" x="0" y="228" width="400" height="32"/>
  </svg>`;

  const SEASON_MONTHS = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], winter: [12, 1, 2] };
  const AGE_GROUPS = [{ max: 34, key: 'youth' }, { max: 59, key: 'middle' }, { max: Infinity, key: 'elder' }];

  let state = null;

  const $ = (sel) => document.querySelector(sel);
  const screens = {
    intro: $('#screen-intro'),
    natal: $('#screen-natal'),
    game: $('#screen-game'),
    end: $('#screen-end'),
  };

  function showScreen(name) {
    for (const key in screens) screens[key].classList.toggle('hidden', key !== name);
    document.body.classList.toggle('wide-mode', name !== 'intro');
  }

  function clampStats() {
    for (const s of GameData.STATS) {
      const cap = s.key === 'wealth' ? 9999 : 100;
      state.stats[s.key] = Math.max(0, Math.min(cap, state.stats[s.key]));
    }
  }

  // ── 무대 배경 / 캐릭터 ──
  function seasonFromMonth(month) {
    for (const season in SEASON_MONTHS) if (SEASON_MONTHS[season].includes(month)) return season;
    return 'winter';
  }

  function ageGroupOf(age) {
    return AGE_GROUPS.find((g) => age <= g.max).key;
  }

  function initStageScenery() {
    document.querySelectorAll('.stage-bg-slot').forEach((el) => { el.innerHTML = STAGE_BG_SVG; });
    document.querySelectorAll('.stage-character-slot').forEach((el) => { el.innerHTML = STAGE_CHARACTER_SVG; });
  }

  // 성별·출생연도는 게임 내내 바뀌지 않으므로 캐릭터 생성 시 한 번만 세 무대에 고정한다
  function initStageIdentity() {
    const bgVariant = String((state.birth.y + state.birth.m) % 3);
    ['#natal-stage', '#game-stage', '#end-stage'].forEach((sel) => {
      const stage = $(sel);
      if (!stage) return;
      stage.dataset.gender = state.gender;
      stage.dataset.bgVariant = bgVariant;
    });
  }

  function updateStageAttrs(stageSel, month, age, fortuneTier) {
    const stage = $(stageSel);
    if (!stage) return;
    stage.dataset.season = seasonFromMonth(month);
    stage.dataset.ageGroup = ageGroupOf(age);
    if (fortuneTier) stage.dataset.fortuneTier = fortuneTier;
    else delete stage.dataset.fortuneTier;
  }

  function dominantElement() {
    let best = Saju.ELEMENTS[0], max = -Infinity;
    for (const el of Saju.ELEMENTS) {
      if (state.elements[el] > max) { max = state.elements[el]; best = el; }
    }
    return best;
  }

  function moodFromHappy(happy) {
    if (happy >= 70) return 'happy';
    if (happy < 30) return 'tired';
    return 'neutral';
  }

  const STAT_BADGE_COLOR = { health: 'var(--el-목)', wealth: 'var(--gold)', happy: 'var(--el-화)', wisdom: 'var(--el-수)', fame: 'var(--el-금)' };

  function updateCharacter(container) {
    if (!container) return;
    ['.char-robe', '.char-sleeve-l', '.char-sleeve-r'].forEach((sel) => {
      const el = container.querySelector(sel);
      if (el) el.style.fill = `var(--el-${dominantElement()})`;
    });
    const badge = container.querySelector('.char-badge');
    if (badge) badge.style.fill = STAT_BADGE_COLOR[dominantStat().key];
    const mood = CHAR_MOOD[moodFromHappy(state.stats.happy)];
    const mouth = container.querySelector('.char-mouth');
    const browL = container.querySelector('.char-brow-l');
    const browR = container.querySelector('.char-brow-r');
    if (mouth) mouth.setAttribute('d', mood.mouth);
    if (browL) browL.setAttribute('d', mood.browL);
    if (browR) browR.setAttribute('d', mood.browR);
  }

  function renderAllCharacters() {
    ['#char-natal', '#char-game', '#char-end'].forEach((sel) => updateCharacter($(sel)));
  }

  function initIntroForm() {
    const timeInput = $('#birth-time');
    const trueSolarTimeInput = $('#true-solar-time');
    const dstInput = $('#dst-correction');
    $('#unknown-time').addEventListener('change', (e) => {
      const unknown = e.target.checked;
      timeInput.disabled = unknown;
      trueSolarTimeInput.disabled = unknown;
      dstInput.disabled = unknown;
      if (unknown) { trueSolarTimeInput.checked = false; dstInput.checked = false; }
    });
    document.querySelectorAll('input[name="cal-type"]').forEach((r) => {
      r.addEventListener('change', (e) => {
        const isLunar = e.target.value === 'lunar';
        $('#lunar-leap-row').classList.toggle('hidden', !isLunar);
        if (!isLunar) $('#lunar-leap').checked = false;
      });
    });
    $('#intro-form').addEventListener('submit', onSubmitIntro);
  }

  function onSubmitIntro(e) {
    e.preventDefault();
    const name = $('#name').value.trim() || '이름 없음';
    const gender = $('input[name="gender"]:checked').value;
    const inputY = parseInt($('#birth-year').value, 10);
    const inputM = parseInt($('#birth-month').value, 10);
    const inputD = parseInt($('#birth-day').value, 10);
    const unknownTime = $('#unknown-time').checked;
    const timeVal = $('#birth-time').value; // "HH:MM"
    const hh = (unknownTime || !timeVal) ? null : parseInt(timeVal.slice(0, 2), 10);
    const mm = (unknownTime || !timeVal) ? null : parseInt(timeVal.slice(3, 5), 10);
    const timeOptions = {
      trueSolarTime: $('#true-solar-time').checked,
      dst: $('#dst-correction').checked,
    };

    if (!inputY || !inputM || !inputD) {
      alert('생년월일을 모두 입력해주세요.');
      return;
    }

    const calType = $('input[name="cal-type"]:checked').value;
    const lunarLeap = $('#lunar-leap').checked;
    let y = inputY, m = inputM, d = inputD;
    let lunarInfo = null;
    if (calType === 'lunar') {
      const solar = Saju.lunarToSolar(inputY, inputM, inputD, lunarLeap);
      if (!solar) {
        alert('입력한 음력 날짜를 양력으로 바꿀 수 없어요. 연/월/일과 윤달 여부를 다시 확인해주세요.');
        return;
      }
      y = solar.y; m = solar.m; d = solar.d;
      lunarInfo = { y: inputY, m: inputM, d: inputD, isLeap: lunarLeap };
    }

    const saju = Saju.calcFourPillars(y, m, d, hh, mm, timeOptions);
    const elements = Saju.countElements(saju);
    const strength = Saju.dayMasterStrength(saju);
    const shinsal = Saju.calcShinsal(saju);
    const daeun = Saju.calcDaeun(y, m, d, hh, mm, gender, saju, timeOptions);

    const stats = {};
    for (const s of GameData.STATS) {
      const rel = STAT_ELEMENT_MAP[s.key];
      const bonus = rel.reduce((sum, el) => sum + elements[el] * 6, 0);
      const base = s.key === 'wealth' ? 20 : 45;
      stats[s.key] = base + bonus + Math.floor(Math.random() * 7) - 3;
    }

    state = {
      name, gender, birth: { y, m, d, hh, mm, unknownTime, lunarInfo, ...timeOptions },
      saju, elements, strength, shinsal, daeun, stats,
      monthsElapsed: START_AGE * 12 - 1,
      recentEventIds: [],
      usedMilestones: new Set(),
      domainTally: { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 },
      log: [],
      alive: true,
    };
    clampStats();
    initStageIdentity();
    renderNatalScreen();
    showScreen('natal');
  }

  // 사주 원국(4기둥 그리드) + 오행 분포 바 - 사주 확인 화면과 게임 중 사주 팝업에서 공용으로 사용
  // 각 기둥의 천간/지지가 일간(나) 기준으로 정확히 무슨 십성(비견/겁재/식신/상관/편재/정재/편관/정관/편인/정인)인지 함께 보여준다
  function renderPillarsGrid(sel, saju) {
    const pillars = [
      ['시주', saju.hour], ['일주', saju.day], ['월주', saju.month], ['연주', saju.year],
    ];
    const dayStem = saju.day.stem;
    const wrap = $(sel);
    wrap.innerHTML = '';
    for (const [label, p] of pillars) {
      const col = document.createElement('div');
      col.className = 'pillar-col';
      if (p) {
        const stemEl = Saju.elementOf(p.stem, true);
        const branchEl = Saju.elementOf(p.branch, false);
        const hidden = Saju.hiddenStemsOf(p.branch).map((s) => Saju.STEMS[s]).join('');
        const stemGod = label === '일주' ? '일간(나)' : Saju.tenGodDetail(dayStem, p.stem, true);
        const branchGod = Saju.tenGodDetail(dayStem, p.branch, false);
        const stemGodTitle = label === '일주' ? '이 사주의 기준이 되는 나 자신' : Saju.TEN_GOD_MEANING[stemGod];
        col.innerHTML = `
          <div class="pillar-label">${label}</div>
          <div class="pillar-tengod" title="${stemGodTitle}">${stemGod}</div>
          <div class="pillar-char stem elem-${stemEl}">${Saju.STEM_HANJA[p.stem]}</div>
          <div class="pillar-char branch elem-${branchEl}">${Saju.BRANCH_HANJA[p.branch]}</div>
          <div class="pillar-tengod" title="${Saju.TEN_GOD_MEANING[branchGod]}">${branchGod}</div>
          <div class="pillar-sub">${Saju.STEMS[p.stem]}${Saju.BRANCHES[p.branch]}</div>
          <div class="pillar-hidden" title="지장간(地藏干)">지장간 ${hidden}</div>`;
      } else {
        col.innerHTML = `<div class="pillar-label">${label}</div><div class="pillar-char unknown">?</div><div class="pillar-sub">미상</div>`;
      }
      wrap.appendChild(col);
    }
  }

  function renderElementsBar(sel, elements) {
    const elBar = $(sel);
    elBar.innerHTML = '';
    const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
    for (const el of Saju.ELEMENTS) {
      const pct = Math.round((elements[el] / total) * 100);
      const row = document.createElement('div');
      row.className = 'elem-row';
      row.innerHTML = `<span class="elem-name elem-${el}">${el}</span>
        <div class="elem-bar-track"><div class="elem-bar-fill elem-bg-${el}" style="width:${pct}%"></div></div>
        <span class="elem-count">${elements[el]}</span>`;
      elBar.appendChild(row);
    }
  }

  const STRENGTH_DESC = {
    신강: '스스로의 기운이 넘치는 사주입니다. 식상·재성·관성의 기운이 들어올 때 오히려 반갑게 작용합니다.',
    신약: '스스로의 기운이 다소 약한 사주입니다. 비겁·인성의 기운이 들어올 때 힘이 되어줍니다.',
    중화: '오행이 비교적 고르게 균형 잡힌 사주입니다.',
  };

  // 일간 강약(신강/신약) + 신살 배지 - 사주 확인 화면과 게임 중 사주 팝업에서 공용으로 사용
  function renderStrengthShinsal(sel, strength, shinsal) {
    const wrap = $(sel);
    let html = `
      <div class="strength-row">
        <span class="strength-badge level-${strength.level}">${strength.level}</span>
        <p class="strength-desc">${STRENGTH_DESC[strength.level]}</p>
      </div>`;
    if (shinsal.length > 0) {
      html += `<div class="shinsal-wrap">${shinsal.map((s) => `<span class="shinsal-tag" title="${s.desc}">${s.name}</span>`).join('')}</div>`;
    }
    wrap.innerHTML = html;
  }

  // ── 사주 원국 화면 ──
  function renderNatalScreen() {
    const { saju, elements } = state;
    updateStageAttrs('#natal-stage', state.birth.m, START_AGE);
    $('#natal-name').textContent = `${state.name} (${state.gender === 'M' ? '남' : '여'})`;
    const corrNotes = [];
    if (state.birth.trueSolarTime) corrNotes.push('진태양시 보정');
    if (state.birth.dst) corrNotes.push('서머타임 보정');
    const lunarNote = state.birth.lunarInfo
      ? ` (음력 ${state.birth.lunarInfo.y}년 ${state.birth.lunarInfo.isLeap ? '윤' : ''}${state.birth.lunarInfo.m}월 ${state.birth.lunarInfo.d}일 → 양력 변환)`
      : '';
    $('#natal-birth').textContent =
      `${state.birth.y}년 ${state.birth.m}월 ${state.birth.d}일` +
      (state.birth.unknownTime ? ' (태어난 시 모름)' : ` ${String(state.birth.hh).padStart(2, '0')}시 ${String(state.birth.mm).padStart(2, '0')}분`) +
      lunarNote +
      (corrNotes.length ? ` · ${corrNotes.join(', ')} 적용됨` : '');

    renderPillarsGrid('#natal-pillars', saju);

    const animal = Saju.ANIMALS[saju.year.branch];
    $('#natal-animal').textContent = `${animal}띠`;

    renderElementsBar('#natal-elements', elements);
    renderStrengthShinsal('#natal-strength', state.strength, state.shinsal);

    const statWrap = $('#natal-initial-stats');
    statWrap.innerHTML = '';
    for (const s of GameData.STATS) {
      const item = document.createElement('div');
      item.className = 'stat-chip';
      item.innerHTML = `${s.icon} ${s.label} <b>${state.stats[s.key]}</b>`;
      statWrap.appendChild(item);
    }

    renderAllCharacters();

    $('#start-life-btn').onclick = () => {
      showScreen('game');
      advanceAndShow();
    };
  }

  // ── 시간 진행 ──
  function calendarForMonths(monthsElapsed) {
    const total = state.birth.m - 1 + monthsElapsed;
    const age = Math.floor(monthsElapsed / 12);
    const year = state.birth.y + Math.floor(total / 12);
    const month = (total % 12) + 1;
    return { age, year, month };
  }

  function currentCalendar() {
    return calendarForMonths(state.monthsElapsed);
  }

  // 그 나이에 흐르고 있는 대운(10년 단위 큰 운) 간지 - 월운/세운 계산에 함께 반영해 더 정밀하게 본다
  function daeunPillarForAge(age) {
    const p = state.daeun.pillars.find((p2) => age >= p2.fromAge && age <= p2.toAge);
    return p ? { stem: p.stem, branch: p.branch } : null;
  }

  function findEventById(id) {
    return GameData.EVENT_POOL.find((e) => e.id === id) || GameData.MILESTONES.find((e) => e.id === id);
  }

  // 지금까지 실제로 겪고 선택해온 이벤트의 domain(십성)을 누적 집계 - 과거의 선택이 앞으로 만날
  // 상황의 결로도 이어지도록 pickEvent 에서 이 흐름을 함께 반영한다 (사주 모달의 "인생의 흐름"에도 그대로 노출)
  function tallyDomain(domain) {
    state.domainTally[domain] = (state.domainTally[domain] || 0) + 1;
  }

  // 가장 많이 쌓인 domain - 충분히 쌓이기 전(총 3회 미만)에는 아직 뚜렷한 흐름이 없다고 보고 null
  function leadingTallyDomain() {
    const entries = Object.entries(state.domainTally);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    if (total < 3) return null;
    return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
  }

  function pickEvent(age, year, month, fortune) {
    const anniversary = month === state.birth.m;
    if (anniversary) {
      const ms = GameData.MILESTONES.find((mm) => mm.age === age && !state.usedMilestones.has(mm.id));
      if (ms) {
        state.usedMilestones.add(ms.id);
        return ms;
      }
    }
    const pool = GameData.EVENT_POOL.filter((ev) => age >= ev.minAge && age <= ev.maxAge);
    const fortunePool = pool.filter((ev) => ev.domain === fortune.dominant);
    const leadDomain = leadingTallyDomain();
    const tallyPool = leadDomain ? pool.filter((ev) => ev.domain === leadDomain) : [];

    const roll = Math.random();
    let candidates;
    if (roll < FORTUNE_MATCH_CHANCE && fortunePool.length > 0) candidates = fortunePool;
    else if (roll < FORTUNE_MATCH_CHANCE + TALLY_MATCH_CHANCE && tallyPool.length > 0) candidates = tallyPool;
    else candidates = pool;

    let fresh = candidates.filter((ev) => !state.recentEventIds.includes(ev.id));
    if (fresh.length === 0) fresh = candidates;
    if (fresh.length === 0) return null;
    return fresh[Math.floor(Math.random() * fresh.length)];
  }

  // 전략(perYear 선호 벡터)과 스탯 변화 방향이 가장 잘 맞는 선택지를 골라준다 (내적이 클수록 그 전략의 가치관에 부합)
  function autoChoiceIndex(strategyKey, event) {
    const pref = SKIP_STRATEGIES[strategyKey].perYear;
    let bestIdx = 0, bestScore = -Infinity;
    event.choices.forEach((choice, idx) => {
      let score = 0;
      for (const key in choice.effects) score += choice.effects[key] * (pref[key] || 0);
      if (score > bestScore) { bestScore = score; bestIdx = idx; }
    });
    return bestIdx;
  }

  // 건너뛰기 중 한 달을 실제로 진행: 이벤트를 뽑고, 선택한 전략에 가장 맞는 선택지를 자동으로 고른다.
  // 결과는 일반 선택과 똑같은 로그 엔트리로 남아 나중에 달력에서 그대로 열어 다시 고를 수 있다.
  function autoResolveMonth(strategyKey) {
    const { age, year, month } = currentCalendar();
    const fortune = Saju.monthlyFortune(state.saju, year, month, daeunPillarForAge(age));
    const event = pickEvent(age, year, month, fortune);
    if (!event) return;

    state.recentEventIds.push(event.id);
    if (state.recentEventIds.length > RECENT_WINDOW) state.recentEventIds.shift();
    const isMilestone = GameData.MILESTONES.some((mm) => mm.id === event.id);

    const idx = autoChoiceIndex(strategyKey, event);
    const choice = event.choices[idx];
    const applied = {};
    for (const key in choice.effects) {
      applied[key] = applyTier(choice.effects[key], fortune.tierMult);
      state.stats[key] = (state.stats[key] || 0) + applied[key];
    }
    clampStats();
    tallyDomain(event.domain);

    const reading = composeMonthlyReading({ title: event.title, fortune, age, year, month }, choice.text, choice.result, applied);
    state.log.unshift({
      age, year, month, title: event.title, choiceText: choice.text, result: choice.result,
      applied, tier: fortune.tier, domain: event.domain, reading,
      eventId: event.id, choiceIndex: idx, monthsElapsed: state.monthsElapsed,
      isMilestone, fortune, autoStrategy: strategyKey,
    });
  }

  function advanceAndShow() {
    state.monthsElapsed++;
    const { age, year, month } = currentCalendar();

    if (age >= MAX_AGE) {
      triggerEnding('lifespan', age, month);
      return;
    }

    const fortune = Saju.monthlyFortune(state.saju, year, month, daeunPillarForAge(age));
    const event = pickEvent(age, year, month, fortune);
    if (!event) { advanceAndShow(); return; }

    state.recentEventIds.push(event.id);
    if (state.recentEventIds.length > RECENT_WINDOW) state.recentEventIds.shift();

    const isMilestone = GameData.MILESTONES.some((mm) => mm.id === event.id);
    state.current = { age, year, month, fortune, event, isMilestone, resolved: false };
    renderEventScreen();
  }

  // 표시 순서를 매번 섞어 어떤 선택이 좋은지 위치로 짐작할 수 없게 한다 (원래 인덱스는 유지)
  function shuffleChoices(choices) {
    const shuffled = choices.map((choice, idx) => ({ choice, idx }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // A/B/C/D 인덱스 배지가 달린 선택지 버튼을 만든다 (event-choices, past-edit-choices 공용)
  function buildChoiceButton(text, i, isCurrent, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn' + (isCurrent ? ' current-choice' : '');
    btn.innerHTML = `<span class="choice-idx">${String.fromCharCode(65 + i)}</span><span class="choice-label">${text}</span>`
      + (isCurrent ? '<span class="current-choice-tag">현재 선택</span>' : '');
    btn.onclick = onClick;
    return btn;
  }

  function renderEventScreen() {
    const { age, year, month, fortune, event, isMilestone } = state.current;
    updateStageAttrs('#game-stage', month, age, fortune.tier);
    $('#game-header-name').textContent = state.name;
    $('#game-header-age').textContent = `${age}세`;
    $('#game-header-date').textContent = `${year}년 ${month}월`;
    renderStatChips();

    $('#fortune-badge').textContent = fortune.tier;
    $('#fortune-badge').className = `fortune-badge tier-${fortune.tier}`;
    $('#fortune-desc').textContent = `${fortune.pillarLabel} · ${fortune.desc}`;

    $('#event-title').textContent = (isMilestone ? '★ ' : '') + event.title;
    $('#event-desc').textContent = event.desc;

    // 어떤 선택이 좋은지 순서나 문구만으로 짐작할 수 없도록 표시 순서를 매번 섞는다
    const shuffled = shuffleChoices(event.choices);

    const choiceWrap = $('#event-choices');
    choiceWrap.innerHTML = '';
    shuffled.forEach(({ choice, idx }, i) => {
      choiceWrap.appendChild(buildChoiceButton(choice.text, i, false, () => chooseOption(idx)));
    });

    $('#result-panel').classList.add('hidden');
    choiceWrap.classList.remove('hidden');
    renderLog();

    $('#skip-open-btn').classList.toggle('hidden', isMilestone);
    closeSkipModal();
  }

  function applyTier(delta, tierMult) {
    if (delta === 0) return 0;
    const mult = delta > 0 ? tierMult : (2 - tierMult);
    return Math.round(delta * mult);
  }

  // 실제로 적용된 수치(applied)를 스탯별로 구체적인 문장(금액, 증상 등)으로 풀어서 서술
  // "만원" 금액을 상한 없이 계산한다: 선택 자체의 판돈 크기(base) x 그 달 사주 기운의 세기(intensity, monthlyFortune의
  // 연속 score값에서 뽑아낸 값이라 같은 등급이어도 매번 조금씩 다르다) x 우연성(luck, 로그정규 분포라 대부분은
  // 평범하지만 아주 드물게 크게 튄다). 어디에도 Math.min/max 로 값을 잘라내지 않으므로 이론상 한도가 없다 -
  // 사주가 강하게 좋거나/나쁠수록, 그리고 판돈이 큰 선택일수록 실제로 억대까지도 나올 수 있다.
  function wealthAmount(v, fortune) {
    const av = Math.abs(v);
    const base = av >= 12 ? av * 70 : av >= 8 ? av * 30 : av >= 4 ? av * 15 : av * 10;
    const score = fortune ? Math.abs(fortune.score) : 0;
    const intensity = 1 + score; // 사주 기운이 강할수록(등급이 아니라 연속 점수 기준) 변동폭도 함께 커진다
    const luck = Math.exp((Math.random() - 0.5) * intensity * 2); // 로그정규 변동 - 상한을 별도로 두지 않는다
    return Math.max(1, Math.round((base * luck) / 10) * 10);
  }

  // 실제로 그 달에 적용된(이미 사주 등급까지 반영된) 확정값을 그대로 서술한다 - "최대"처럼 범위인 듯한 표현은 쓰지 않는다.
  function wealthFlavor(v, fortune) {
    if (v === 0) return '';
    const amount = wealthAmount(v, fortune);
    if (v >= 12) return `그야말로 인생이 바뀔 만한 재물운이 터져, ${amount}만원에 이르는 목돈을 거머쥐었습니다.`;
    if (v >= 8) return `재물운이 크게 트여, ${amount}만원 상당의 목돈이 들어왔습니다.`;
    if (v >= 4) return `쏠쏠한 수입이 생겨 ${amount}만원 정도의 여윳돈이 들어옵니다.`;
    if (v >= 1) return `${amount}만원 안팎의 소소한 이득이 있습니다.`;
    if (v <= -12) return `전 재산이 흔들릴 만큼 크게 휘청여, ${amount}만원에 이르는 빚과 손실을 떠안았습니다.`;
    if (v <= -8) return `씀씀이가 크게 나가, ${amount}만원 상당의 손실을 봤습니다.`;
    if (v <= -4) return `예상치 못한 지출로 ${amount}만원 가량 나갑니다.`;
    if (v <= -1) return `${amount}만원 안팎의 자잘한 지출이 있습니다.`;
    return '';
  }
  function healthFlavor(v) {
    if (v >= 8) return '체력이 몰라보게 좋아져 그 어느 때보다 활기찼습니다.';
    if (v >= 4) return '컨디션이 눈에 띄게 좋아졌습니다.';
    if (v >= 1) return '몸이 한결 가벼워진 느낌입니다.';
    if (v <= -8) return '몸살을 넘어 정밀검사가 필요할 수 있는 수준으로 상했습니다. 방치하면 만성질환이나 큰 병으로 이어질 수 있는 위험 신호입니다.';
    if (v <= -4) return '감기나 몸살 기운으로 며칠 앓아누웠습니다.';
    if (v <= -1) return '몸이 으슬으슬하고 컨디션이 좋지 않았습니다.';
    return '';
  }
  function happyFlavor(v) {
    if (v >= 8) return '마음이 벅찰 만큼 행복한 나날이었습니다.';
    if (v >= 4) return '기분 좋은 일들이 이어졌습니다.';
    if (v >= 1) return '잔잔한 기쁨이 있었습니다.';
    if (v <= -8) return '깊은 상심에 빠져, 마음의 병으로 이어질 수도 있는 수준이었습니다.';
    if (v <= -4) return '우울한 기분이 며칠간 이어졌습니다.';
    if (v <= -1) return '마음이 조금 무거웠습니다.';
    return '';
  }
  function wisdomFlavor(v) {
    if (v >= 8) return '몰라보게 지혜와 통찰이 깊어졌습니다.';
    if (v >= 4) return '많은 것을 배우고 깨달았습니다.';
    if (v >= 1) return '작은 깨달음을 얻었습니다.';
    if (v <= -8) return '크게 그릇된 판단으로, 두고두고 후회할 만한 상황을 만들었습니다.';
    if (v <= -4) return '판단력이 흐려져 실수가 잦아졌습니다.';
    if (v <= -1) return '생각이 다소 흐트러졌습니다.';
    return '';
  }
  function fameFlavor(v) {
    if (v >= 8) return '평판이 크게 올라 주변의 신뢰를 한몸에 받았습니다.';
    if (v >= 4) return '좋은 평판을 얻었습니다.';
    if (v >= 1) return '작은 호감을 얻었습니다.';
    if (v <= -8) return '돌이키기 힘들 만큼 평판이 크게 무너졌습니다.';
    if (v <= -4) return '신뢰를 잃어 입지가 좁아졌습니다.';
    if (v <= -1) return '평판에 살짝 금이 갔습니다.';
    return '';
  }
  const STAT_FLAVOR = { health: healthFlavor, wealth: wealthFlavor, happy: happyFlavor, wisdom: wisdomFlavor, fame: fameFlavor };

  function detailedResultText(applied, fortune) {
    const entries = Object.entries(applied).filter(([, v]) => v !== 0);
    entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    return entries.map(([k, v]) => STAT_FLAVOR[k](v, fortune)).filter(Boolean).join(' ');
  }

  const DOMAINS = ['비겁', '식상', '재성', '관성', '인성'];
  const DOMAIN_NOUN = { 비겁: '비견·겁재', 식상: '식신·상관', 재성: '재성', 관성: '관성', 인성: '인성' };

  // 선택 하나를 "그 달의 사주 맥락 -> 선택 -> 결과 -> 예견과의 일치" 순서로 길게 풀어서 서술
  // (과거 달을 다시 선택할 때도 같은 함수로 그때그때의 해설을 다시 만들 수 있도록 개별 값만 받는다)
  function composeMonthlyReading({ title, fortune, age, year, month }, choiceText, choiceResult, applied) {
    // dominantDetail(정확한 십성 하나, 예: 겁재)이 있으면 그걸 한자와 함께 쓰고, 옛 기록처럼 없는 경우만 그룹 명(비견·겁재)으로 대체한다
    const godLabel = fortune.dominantDetail
      ? `${fortune.dominantDetail}(${Saju.TEN_GOD_HANJA[fortune.dominantDetail]})`
      : DOMAIN_NOUN[fortune.dominant];
    const detail = detailedResultText(applied, fortune);
    const remark = Saju.TIER_REMARK[fortune.tier];
    const parts = [
      `${year}년 ${month}월(${fortune.pillarLabel}), ${age}세의 이 달은 ${godLabel}의 기운이 짙게 흐르며 '${fortune.tier}'으로 풀이되던 시기였습니다.`,
      `그 가운데 「${title}」에서 '${choiceText}'를 선택했습니다. ${choiceResult}`,
      detail,
      remark,
    ];
    // 한 덩어리 문단이 아니라 문장 단위로 줄을 나눠 읽기 편하게 한다 (표시 쪽에서 white-space: pre-line 처리)
    return parts.filter(Boolean).join('\n');
  }

  function chooseOption(idx) {
    if (state.current.resolved) return;
    state.current.resolved = true;
    const { age, year, month, fortune, event } = state.current;
    const choice = event.choices[idx];
    const applied = {};
    for (const key in choice.effects) {
      applied[key] = applyTier(choice.effects[key], fortune.tierMult);
      state.stats[key] = (state.stats[key] || 0) + applied[key];
    }
    clampStats();
    tallyDomain(event.domain);

    const reading = composeMonthlyReading({ title: event.title, fortune, age, year, month }, choice.text, choice.result, applied);
    state.log.unshift({
      age, year, month, title: event.title, choiceText: choice.text, result: choice.result,
      applied, tier: fortune.tier, domain: event.domain, reading,
      eventId: event.id, choiceIndex: idx, monthsElapsed: state.monthsElapsed,
      isMilestone: state.current.isMilestone, fortune,
    });

    renderStatChips();
    $('#event-choices').classList.add('hidden');
    const panel = $('#result-panel');
    panel.classList.remove('hidden');
    $('#result-text').textContent = choice.result;
    $('#result-reading').textContent = reading;
    $('#result-effects').innerHTML = Object.entries(applied)
      .map(([k, v]) => {
        const def = GameData.STATS.find((s) => s.key === k);
        const sign = v > 0 ? '+' : '';
        return `<span class="eff ${v >= 0 ? 'pos' : 'neg'}">${def.icon} ${def.label} ${sign}${v}</span>`;
      }).join(' ');
    renderLog();

    if (state.stats.health <= 0) {
      state.alive = false;
      $('#next-month-btn').textContent = '결과 확인하기';
      $('#next-month-btn').onclick = () => triggerEnding('death', age, month);
      return;
    }

    $('#next-month-btn').textContent = '다음 달로';
    $('#next-month-btn').onclick = () => advanceAndShow();
  }

  function renderStatChips() {
    const wrap = $('#stat-bars');
    wrap.innerHTML = GameData.STATS.map((s) => {
      const val = state.stats[s.key];
      const pct = Math.max(0, Math.min(100, val));
      return `<span class="hud-stat-chip" title="${s.label}">
        <span class="hud-stat-icon">${s.icon}</span>
        <span class="hud-stat-track"><span class="hud-stat-fill" data-stat="${s.key}" style="width:${pct}%"></span></span>
        <span class="hud-stat-val">${val}</span>
      </span>`;
    }).join('');
    renderAllCharacters();
  }

  function renderLog() {
    const wrap = $('#history-log');
    wrap.innerHTML = state.log.slice(0, 10).map((entry) => `
      <div class="log-item">
        <span class="log-age">${entry.age}세 ${entry.year}.${String(entry.month).padStart(2, '0')}</span>
        <span class="log-tier tier-${entry.tier}">${entry.tier}</span>
        <span class="log-title">${entry.title}</span> — ${entry.choiceText}
      </div>`).join('');
  }

  // ── 시간 건너뛰기 (달력) ──
  let skipCalYear = null;
  let skipCalSelected = null;

  // 다음 미해결 마일스톤(또는 100세) 이전까지만 건너뛸 수 있다 - 달력 자체가 이 범위만 보여준다
  function reachableCapMonths() {
    let cap = MAX_AGE * 12;
    for (const ms of GameData.MILESTONES) {
      const msMonths = ms.age * 12;
      if (msMonths > state.monthsElapsed && !state.usedMilestones.has(ms.id) && msMonths < cap) cap = msMonths;
    }
    return cap;
  }

  function monthsElapsedFor(year, month) {
    return (year - state.birth.y) * 12 + (month - state.birth.m);
  }

  // 게임 속 연월은 실제 생년월일에 이어 붙여 계산되므로, 실제 오늘 날짜에 대응하는 monthsElapsed도 그대로 구할 수 있다.
  function realTodayMonthsElapsed() {
    const now = new Date();
    return monthsElapsedFor(now.getFullYear(), now.getMonth() + 1);
  }

  // '오늘 날짜로 가기' 버튼은 실제로 이동할 곳(19세 이후 & 아직 지나지 않은 미래)이 있을 때만 보여준다
  function updateGotoTodayButton() {
    const todayMonths = realTodayMonthsElapsed();
    const canGoToToday = todayMonths >= START_AGE * 12 && todayMonths > state.monthsElapsed;
    $('#skip-cal-goto-today').classList.toggle('hidden', !canGoToToday);
  }

  // 실제 오늘 날짜에 대응하는 지점(다음 마일스톤/100세를 넘지 않는 선에서)을 달력에서 선택한 것처럼 처리한다
  function gotoCurrentAge() {
    const target = Math.min(realTodayMonthsElapsed(), reachableCapMonths());
    if (target <= state.monthsElapsed) return;
    const targetCal = calendarForMonths(target);
    skipCalYear = targetCal.year;
    skipCalSelected = { year: targetCal.year, month: targetCal.month };
    renderSkipCalendar();
    showSkipStrategyPanel();
  }

  // 달력에 의미 있게 표시할 최소~최대 범위: 19세(게임 시작) ~ 다음 미해결 마일스톤(또는 100세)
  function calendarBoundsMonths() {
    return { min: START_AGE * 12, max: reachableCapMonths() };
  }

  function yearHasContent(year) {
    const { min, max } = calendarBoundsMonths();
    for (let m = 1; m <= 12; m++) {
      const tm = monthsElapsedFor(year, m);
      if (tm >= min && tm <= max) return true;
    }
    return false;
  }

  function findLogEntryForMonths(tm) {
    return state.log.find((e) => e.monthsElapsed === tm);
  }

  function openSkipModal() {
    skipCalYear = currentCalendar().year;
    skipCalSelected = null;
    closePastEventEditor();
    renderSkipCalendar();
    $('#skip-cal-strategy').classList.add('hidden');
    $('#skip-modal').classList.remove('hidden');
  }

  function closeSkipModal() {
    $('#skip-modal').classList.add('hidden');
    closePastEventEditor();
  }

  function renderSkipCalendar() {
    const cap = reachableCapMonths();
    $('#skip-cal-year').textContent = `${skipCalYear}년`;
    $('#skip-cal-prev').disabled = !yearHasContent(skipCalYear - 1);
    $('#skip-cal-next').disabled = !yearHasContent(skipCalYear + 1);
    updateGotoTodayButton();

    const grid = $('#skip-cal-grid');
    grid.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const tm = monthsElapsedFor(skipCalYear, m);
      const fortune = Saju.monthlyFortune(state.saju, skipCalYear, m, daeunPillarForAge(calendarForMonths(tm).age));
      const btn = document.createElement('button');
      btn.type = 'button';

      if (tm < START_AGE * 12 || tm > cap) {
        btn.className = 'skip-cal-cell out-of-range';
        btn.disabled = true;
        btn.innerHTML = `<span class="cal-cell-month">${m}월</span><span class="cal-cell-ganzhi">${fortune.pillarLabel}</span>`;
      } else if (tm > state.monthsElapsed) {
        const isSelected = skipCalSelected && skipCalSelected.year === skipCalYear && skipCalSelected.month === m;
        btn.className = `skip-cal-cell tier-${fortune.tier}` + (isSelected ? ' selected' : '');
        btn.innerHTML = `<span class="cal-cell-month">${m}월</span><span class="cal-cell-ganzhi">${fortune.pillarLabel}</span>`;
        btn.onclick = () => {
          skipCalSelected = { year: skipCalYear, month: m };
          renderSkipCalendar();
          showSkipStrategyPanel();
        };
      } else if (tm === state.monthsElapsed) {
        btn.className = `skip-cal-cell tier-${fortune.tier} current-month`;
        btn.disabled = true;
        btn.innerHTML = `<span class="cal-cell-month">${m}월</span><span class="cal-cell-ganzhi">${fortune.pillarLabel}</span><span class="cal-cell-tag">현재</span>`;
      } else {
        const entry = findLogEntryForMonths(tm);
        if (entry) {
          btn.className = `skip-cal-cell tier-${entry.tier} past-resolved`;
          btn.innerHTML = `<span class="cal-cell-month">${m}월</span><span class="cal-cell-ganzhi">${fortune.pillarLabel}</span><span class="cal-cell-tag">다시 선택</span>`;
          btn.onclick = () => openPastEventEditor(entry);
        } else {
          btn.className = 'skip-cal-cell past-locked';
          btn.disabled = true;
          btn.innerHTML = `<span class="cal-cell-month">${m}월</span><span class="cal-cell-ganzhi">${fortune.pillarLabel}</span>`;
        }
      }
      grid.appendChild(btn);
    }

    const capCal = calendarForMonths(cap);
    const reason = cap < MAX_AGE * 12 ? `다음 중요한 사건(${capCal.age}세)` : '100세';
    $('#skip-cal-range-hint').textContent = `${reason} 전까지만 이동할 수 있어요. 지나간 달 중 '다시 선택' 표시가 있는 달은 다시 클릭해 그때의 질문과 선택을 다시 볼 수 있어요.`;
  }

  // ── 과거 선택 다시 하기 (건너뛰기로 자동 진행된 달도 동일한 이벤트 기록이라 여기서 그대로 열린다) ──
  let pastEditEntry = null;
  let pastEditShuffled = null; // 패널을 여는 동안은 고정 - 다시 고를 때마다 선택지 위치가 바뀌지 않도록 한 번만 섞어서 재사용한다

  // entry.reading 이 아직 없는(이 기능 이전에 만들어진) 기록이라면 지금 가진 값들로 즉석에서 다시 만들어준다
  function readingOf(entry) {
    if (entry.reading) return entry.reading;
    return composeMonthlyReading(
      { title: entry.title, fortune: entry.fortune, age: entry.age, year: entry.year, month: entry.month },
      entry.choiceText, entry.result, entry.applied,
    );
  }

  // past-edit-choices 와 그 아래 해설/효과 박스를 entry 의 현재 상태로 (다시) 그린다 - 처음 열 때도, 다시 고른 직후에도 공용으로 쓴다
  function renderPastEditChoices(entry) {
    const wrap = $('#past-edit-choices');
    wrap.innerHTML = '';
    pastEditShuffled.forEach(({ choice, idx }, i) => {
      wrap.appendChild(buildChoiceButton(choice.text, i, idx === entry.choiceIndex, () => applyPastEventChoice(entry, idx)));
    });
    $('#past-edit-reading').textContent = readingOf(entry);
    $('#past-edit-effects').innerHTML = Object.entries(entry.applied)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => {
        const def = GameData.STATS.find((s) => s.key === k);
        const sign = v > 0 ? '+' : '';
        return `<span class="eff ${v >= 0 ? 'pos' : 'neg'}">${def.icon} ${def.label} ${sign}${v}</span>`;
      }).join(' ');
  }

  function openPastEventEditor(entry) {
    const event = findEventById(entry.eventId);
    if (!event) return;
    pastEditEntry = entry;
    pastEditShuffled = shuffleChoices(event.choices);

    $('#skip-cal-header').classList.add('hidden');
    $('#skip-cal-grid').classList.add('hidden');
    $('#cal-legend').classList.add('hidden');
    $('#skip-cal-range-hint').classList.add('hidden');
    $('#skip-cal-strategy').classList.add('hidden');
    $('#skip-cal-goto-today').classList.add('hidden');

    const autoNote = entry.autoStrategy ? ` · 건너뛰기 중 '${SKIP_STRATEGIES[entry.autoStrategy].label}'로 자동 선택됨` : '';
    $('#past-edit-label').textContent = `${entry.age}세 · ${entry.year}년 ${entry.month}월 (${entry.fortune.pillarLabel} · ${entry.tier})${autoNote}`;
    $('#past-edit-title').textContent = (entry.isMilestone ? '★ ' : '') + event.title;
    $('#past-edit-desc').textContent = event.desc;

    renderPastEditChoices(entry);

    $('#skip-cal-past-edit').classList.remove('hidden');
  }

  function closePastEventEditor() {
    pastEditEntry = null;
    pastEditShuffled = null;
    $('#skip-cal-past-edit').classList.add('hidden');
    $('#skip-cal-header').classList.remove('hidden');
    $('#skip-cal-grid').classList.remove('hidden');
    $('#cal-legend').classList.remove('hidden');
    $('#skip-cal-range-hint').classList.remove('hidden');
    updateGotoTodayButton();
  }

  // 과거 선택을 바꾸면 그때 적용됐던 효과를 되돌리고 새 선택의 효과를 같은 그 달의 사주 기운(tierMult)으로 다시 적용한다.
  // 패널은 닫지 않고 그대로 두어, 새로 고른 선택의 해설을 바로 확인할 수 있게 한다.
  function applyPastEventChoice(entry, idx) {
    const event = findEventById(entry.eventId);
    const choice = event.choices[idx];

    for (const key in entry.applied) {
      state.stats[key] = (state.stats[key] || 0) - entry.applied[key];
    }
    const applied = {};
    for (const key in choice.effects) {
      applied[key] = applyTier(choice.effects[key], entry.fortune.tierMult);
      state.stats[key] = (state.stats[key] || 0) + applied[key];
    }
    clampStats();

    entry.choiceIndex = idx;
    entry.choiceText = choice.text;
    entry.result = choice.result;
    entry.applied = applied;
    entry.reading = composeMonthlyReading(
      { title: entry.title, fortune: entry.fortune, age: entry.age, year: entry.year, month: entry.month },
      choice.text, choice.result, applied,
    );
    delete entry.autoStrategy; // 직접 다시 골랐으니 더 이상 '자동 선택'이 아니다

    renderStatChips();
    renderLog();
    renderPastEditChoices(entry);
    $('#past-edit-label').textContent = `${entry.age}세 · ${entry.year}년 ${entry.month}월 (${entry.fortune.pillarLabel} · ${entry.tier})`;
  }

  function showSkipStrategyPanel() {
    const targetMonths = monthsElapsedFor(skipCalSelected.year, skipCalSelected.month);
    const targetCal = calendarForMonths(targetMonths);
    $('#skip-cal-selected-label').textContent = `${skipCalSelected.year}년 ${skipCalSelected.month}월(${targetCal.age}세)까지 이동합니다.`;
    $('#skip-cal-strategy').classList.remove('hidden');
  }

  // 선택한 지점까지, 그 사이의 달들을 실제 이벤트로 하나씩 진행하며 고른 전략에 맞는 선택지를 자동으로 적용한다.
  // 마지막 달(선택한 그 달)만은 평소처럼 화면에 띄워 직접 고르게 한다.
  function executeSkip(strategyKey) {
    if (!skipCalSelected) return;
    const capMonths = monthsElapsedFor(skipCalSelected.year, skipCalSelected.month);
    if (capMonths <= state.monthsElapsed) { closeSkipModal(); return; }

    closeSkipModal();

    while (state.monthsElapsed < capMonths - 1) {
      state.monthsElapsed++;
      const { age, year, month } = currentCalendar();
      if (age >= MAX_AGE) { triggerEnding('lifespan', age, month); return; }

      autoResolveMonth(strategyKey);

      if (state.stats.health <= 0) {
        state.alive = false;
        triggerEnding('death', age, month);
        return;
      }
    }

    advanceAndShow();
  }

  // 팝업 바깥(오버레이) 클릭 시 닫히도록 하고, 우측 상단 X 버튼과도 연결한다
  function bindModalClose(overlaySel, xBtnSel, closeFn) {
    const overlay = $(overlaySel);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFn(); });
    $(xBtnSel).addEventListener('click', closeFn);
  }

  function initModals() {
    $('#skip-open-btn').addEventListener('click', openSkipModal);
    bindModalClose('#skip-modal', '#skip-modal-x', closeSkipModal);
    $('#skip-cal-prev').addEventListener('click', () => { skipCalYear--; renderSkipCalendar(); });
    $('#skip-cal-next').addEventListener('click', () => { skipCalYear++; renderSkipCalendar(); });
    $('#skip-cal-goto-today').addEventListener('click', gotoCurrentAge);
    document.querySelectorAll('#skip-cal-strategy .skip-strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => executeSkip(btn.dataset.strategy));
    });
    $('#past-edit-back').addEventListener('click', closePastEventEditor);

    $('#log-open-btn').addEventListener('click', () => $('#log-modal').classList.remove('hidden'));
    bindModalClose('#log-modal', '#log-modal-x', () => $('#log-modal').classList.add('hidden'));

    $('#saju-open-btn').addEventListener('click', openSajuModal);
    bindModalClose('#saju-modal', '#saju-modal-x', () => $('#saju-modal').classList.add('hidden'));
    document.querySelectorAll('.saju-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchSajuTab(btn.dataset.tab));
    });
  }

  function switchSajuTab(tab) {
    document.querySelectorAll('.saju-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    $('#saju-tab-natal').classList.toggle('hidden', tab !== 'natal');
    $('#saju-tab-future').classList.toggle('hidden', tab !== 'future');
    if (tab === 'future') renderFutureTab();
  }

  function openSajuModal() {
    renderPillarsGrid('#saju-modal-pillars', state.saju);
    renderElementsBar('#saju-modal-elements', state.elements);
    renderStrengthShinsal('#saju-modal-strength', state.strength, state.shinsal);
    const dayMasterEl = Saju.elementOf(state.saju.day.stem, true);
    $('#saju-modal-daymaster').textContent = `일간: ${Saju.STEMS[state.saju.day.stem]}(${dayMasterEl}) · ${Saju.ANIMALS[state.saju.year.branch]}띠`;
    switchSajuTab('natal');
    $('#saju-modal').classList.remove('hidden');
  }

  // 지금까지 실제로 겪고 선택해온 이벤트의 domain 누적치를 막대로 보여준다 - 과거의 선택이 앞으로 만날 상황과 이어진다는 걸 눈으로 확인할 수 있게
  function renderLifeTrendBar() {
    const tally = state.domainTally;
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    const wrap = $('#life-trend-bar');
    wrap.innerHTML = '';
    for (const domain of DOMAINS) {
      const count = tally[domain] || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'elem-row';
      row.innerHTML = `<span class="domain-name">${domain}</span>
        <div class="elem-bar-track"><div class="elem-bar-fill domain-bg-${domain}" style="width:${pct}%"></div></div>
        <span class="elem-count">${count}</span>`;
      wrap.appendChild(row);
    }
    const leadDomain = leadingTallyDomain();
    const hint = $('#life-trend-hint');
    if (leadDomain) {
      hint.textContent = `지금까지 ${DOMAIN_NOUN[leadDomain]} 쪽 상황을 가장 많이 마주하고 선택해왔어요. 이런 흐름이 쌓이면 앞으로도 비슷한 기회나 고비가 조금 더 자주 찾아올 수 있어요.`;
    } else if (total > 0) {
      hint.textContent = '아직 뚜렷한 흐름을 말하기엔 선택이 많지 않아요. 선택이 더 쌓이면 삶의 결이 드러나기 시작할 거예요.';
    } else {
      hint.textContent = '아직 아무 선택도 하지 않았어요. 앞으로의 선택 하나하나가 이 흐름을 만들어가고, 그 흐름은 다시 다음 상황에 영향을 줘요.';
    }
  }

  function renderFutureTab() {
    renderLifeTrendBar();
    const curAge = state.current ? state.current.age : Math.floor(state.monthsElapsed / 12);
    const curYear = state.current ? state.current.year : state.birth.y + curAge;

    const daeun = state.daeun;
    const daeunWrap = $('#daeun-list');
    daeunWrap.innerHTML = '';
    const daeunHeadNote = $('#daeun-head-note');
    if (daeunHeadNote) {
      daeunHeadNote.textContent = `대운수 ${daeun.startAge} · ${daeun.forward ? '순행' : '역행'}`;
    }
    for (const p of daeun.pillars) {
      const isCurrent = curAge >= p.fromAge && curAge <= p.toAge;
      const chip = document.createElement('div');
      chip.className = 'daeun-chip' + (isCurrent ? ' current' : '');
      chip.innerHTML = `
        <span class="daeun-chip-age">${p.fromAge}~${p.toAge}세</span>
        <span class="daeun-chip-ganzhi">${Saju.STEMS[p.stem]}${Saju.BRANCHES[p.branch]}</span>`;
      daeunWrap.appendChild(chip);
    }

    const saeunWrap = $('#saeun-list');
    saeunWrap.innerHTML = '';
    const endYear = state.birth.y + Math.min(MAX_AGE, 100);
    for (let year = curYear; year <= endYear; year++) {
      const age = year - state.birth.y;
      const fortune = Saju.yearlyFortune(state.saju, year, daeunPillarForAge(age));
      const row = document.createElement('div');
      row.className = `saeun-card tier-${fortune.tier}` + (year === curYear ? ' current' : '');
      row.innerHTML = `
        <div class="saeun-card-head">
          <span class="saeun-age">${age}세</span>
          <span class="saeun-year">${year}년</span>
          <span class="saeun-ganzhi">${fortune.pillarLabel}</span>
          <span class="saeun-tier-badge tier-${fortune.tier}">${fortune.tier}</span>
        </div>
        <p class="saeun-desc">${fortune.desc}</p>`;
      saeunWrap.appendChild(row);
    }
  }

  // ── 엔딩 ──
  function dominantStat() {
    let best = null, max = -Infinity;
    for (const s of GameData.STATS) {
      const norm = s.key === 'wealth' ? state.stats[s.key] / 20 : state.stats[s.key];
      if (norm > max) { max = norm; best = s; }
    }
    return best;
  }

  const EPITAPHS = {
    health: '건강한 몸으로 평생을 활기차게 살아간 사람이었습니다.',
    wealth: '풍족한 재물을 일구며 넉넉한 삶을 살아간 사람이었습니다.',
    happy: '늘 웃음이 끊이지 않던, 행복이 가득한 삶이었습니다.',
    wisdom: '지혜로운 판단으로 존경받으며 살아간 사람이었습니다.',
    fame: '많은 이들에게 신망을 받으며 살아간 사람이었습니다.',
  };

  // 받침 유무에 따라 "이/가", "은/는" 등 조사를 골라 자연스러운 문장을 만든다
  function josa(word, withBatchim, withoutBatchim) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    if (code < 0 || code > 11171) return withoutBatchim;
    return code % 28 !== 0 ? withBatchim : withoutBatchim;
  }

  const DOMAIN_LIFE_THEME = {
    비겁: '스스로의 힘과 주변 사람들과의 관계를 지키려는 선택들',
    식상: '표현하고 도전하며 움직이는 선택들',
    재성: '재물과 실질적인 성과를 좇는 선택들',
    관성: '책임과 명예를 지키려는 선택들',
    인성: '배움과 성찰을 우선하는 선택들',
  };
  const DAY_MASTER_TRAIT = {
    목: '유연하고 성장 지향적인',
    화: '열정적이고 표현력 넘치는',
    토: '안정적이고 신뢰를 중시하는',
    금: '결단력 있고 원칙을 지키는',
    수: '지혜롭고 통찰이 깊은',
  };

  // 평생의 선택 기록(state.log 전체)을 모아 일생을 돌아보는 해설을 구성
  function generateLifeReading() {
    const domainCount = {};
    const tierCount = { 대길: 0, 길: 0, 평: 0, 흉: 0, 대흉: 0 };
    const statTotals = { health: 0, wealth: 0, happy: 0, wisdom: 0, fame: 0 };
    const normMag = (key, v) => (key === 'wealth' ? v / 3 : v);
    let best = null, worst = null;

    for (const entry of state.log) {
      if (entry.domain) domainCount[entry.domain] = (domainCount[entry.domain] || 0) + 1;
      if (entry.tier in tierCount) tierCount[entry.tier]++;
      for (const key in entry.applied) {
        const v = entry.applied[key];
        statTotals[key] = (statTotals[key] || 0) + v;
        if (!best || normMag(key, v) > normMag(best.statKey, best.value)) best = { entry, statKey: key, value: v };
        if (!worst || normMag(key, v) < normMag(worst.statKey, worst.value)) worst = { entry, statKey: key, value: v };
      }
    }

    let dominantDomain = null, maxCount = -1;
    for (const d in domainCount) if (domainCount[d] > maxCount) { maxCount = domainCount[d]; dominantDomain = d; }

    let topGainKey = null, topGainVal = -Infinity, topLossKey = null, topLossVal = Infinity;
    for (const key in statTotals) {
      if (statTotals[key] > topGainVal) { topGainVal = statTotals[key]; topGainKey = key; }
      if (statTotals[key] < topLossVal) { topLossVal = statTotals[key]; topLossKey = key; }
    }
    const statLabel = (k) => GameData.STATS.find((s) => s.key === k).label;

    const dayMasterEl = Saju.elementOf(state.saju.day.stem, true);
    const domainTheme = dominantDomain ? DOMAIN_LIFE_THEME[dominantDomain] : '큰 굴곡 없이 흘러간 선택들';

    const parts = [
      `일간이 ${dayMasterEl}(五行)인 당신은 본래 ${DAY_MASTER_TRAIT[dayMasterEl]} 기질을 타고났습니다.`,
      `평생 ${state.log.length}번의 선택의 순간을 지나오며, 그중에서도 ${domainTheme}이 가장 두드러졌습니다.`,
      `사주의 흐름으로 보면 대길의 달이 ${tierCount.대길}번, 대흉의 달이 ${tierCount.대흉}번 있었을 만큼 굴곡이 있었지만, 전체적으로는 ${statLabel(topGainKey)}${josa(statLabel(topGainKey), '이', '가')} 가장 크게 늘고 ${statLabel(topLossKey)}${josa(statLabel(topLossKey), '이', '가')} 가장 크게 줄어든 생애였습니다.`,
    ];
    if (best) parts.push(`특히 ${best.entry.age}세의 「${best.entry.title}」${josa(best.entry.title, '은', '는')} 인생에서 가장 빛나던 순간으로 남았습니다.`);
    if (worst) parts.push(`반면 ${worst.entry.age}세의 「${worst.entry.title}」${josa(worst.entry.title, '은', '는')} 가장 힘겨웠던 순간이었습니다.`);
    return parts.join(' ');
  }

  function triggerEnding(kind, ageOverride, monthOverride) {
    showScreen('end');
    const age = ageOverride != null ? ageOverride : (state.current ? state.current.age : Math.floor(state.monthsElapsed / 12));
    const month = monthOverride != null ? monthOverride : (state.current ? state.current.month : state.birth.m);
    updateStageAttrs('#end-stage', month, age);
    $('#end-title').textContent = kind === 'death' ? '생을 마감하다' : '천수를 다하다';
    $('#end-age').textContent = `향년 ${age}세`;
    const best = dominantStat();
    $('#end-epitaph').textContent = EPITAPHS[best.key];
    $('#end-reading').textContent = generateLifeReading();

    const statWrap = $('#end-stats');
    statWrap.innerHTML = '';
    for (const s of GameData.STATS) {
      const item = document.createElement('div');
      item.className = 'stat-chip';
      item.innerHTML = `${s.icon} ${s.label} <b>${state.stats[s.key]}</b>`;
      statWrap.appendChild(item);
    }

    const logWrap = $('#end-log');
    logWrap.innerHTML = state.log.slice(0, 10).map((entry) => `
      <div class="log-item">
        <span class="log-age">${entry.age}세</span> ${entry.title} — ${entry.choiceText}
      </div>`).join('');

    $('#restart-btn').onclick = () => window.location.reload();
    renderAllCharacters();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStageScenery();
    initIntroForm();
    initModals();
  });
})();
