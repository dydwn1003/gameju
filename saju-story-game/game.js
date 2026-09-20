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
  const DOMAIN_MATCH_CHANCE = 0.75;
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
  const STAGE_CHARACTER_SVG = `<svg viewBox="0 0 160 340" class="stage-character-svg">
    <path class="char-robe" d="M20,330 Q20,160 56,110 L104,110 Q140,160 140,330 Z"/>
    <path class="char-sleeve-l" d="M56,114 Q28,140 34,182 Q48,155 60,124 Z"/>
    <path class="char-sleeve-r" d="M104,114 Q132,140 126,182 Q112,155 100,124 Z"/>
    <path class="char-sash" d="M32,200 Q80,214 128,200 L128,208 Q80,222 32,208 Z"/>
    <path class="char-collar" d="M56,110 L80,142 L104,110"/>
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
    <path class="char-mouth" d="M70,86 Q80,90 90,86"/>
  </svg>`;

  // 배경 씬: 계절(data-season)에 따라 CSS 로 색이 바뀌는 산/한옥/나무 실루엣
  const STAGE_BG_SVG = `<svg class="stage-bg-svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice">
    <circle class="scene-orb" cx="335" cy="72" r="20"/>
    <path class="scene-mountain-far" d="M0,180 L60,120 L130,170 L200,110 L280,165 L340,130 L400,175 L400,260 L0,260 Z"/>
    <path class="scene-mountain-near" d="M0,220 L90,160 L180,210 L260,150 L340,205 L400,175 L400,260 L0,260 Z"/>
    <g class="scene-hanok" transform="translate(235,168)">
      <path class="scene-hanok-roof" d="M-8,26 Q42,-18 92,26 Q42,10 -8,26 Z"/>
      <rect class="scene-hanok-wall" x="4" y="26" width="76" height="38"/>
      <rect class="scene-hanok-door" x="30" y="42" width="22" height="22"/>
    </g>
    <g class="scene-tree" transform="translate(55,188)">
      <rect class="scene-tree-trunk" x="-3" y="0" width="6" height="48"/>
      <circle class="scene-tree-foliage" cx="0" cy="-16" r="24"/>
      <circle class="scene-blossom" cx="-13" cy="-24" r="3.2"/>
      <circle class="scene-blossom" cx="9" cy="-30" r="3.2"/>
      <circle class="scene-blossom" cx="15" cy="-8" r="3.2"/>
      <circle class="scene-blossom" cx="-9" cy="-2" r="3.2"/>
      <circle class="scene-blossom" cx="2" cy="-16" r="3.2"/>
    </g>
    <rect class="scene-ground" x="0" y="228" width="400" height="32"/>
  </svg>`;

  const SEASON_MONTHS = { spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11], winter: [12, 1, 2] };

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

  function initStageScenery() {
    document.querySelectorAll('.stage-bg-slot').forEach((el) => { el.innerHTML = STAGE_BG_SVG; });
    document.querySelectorAll('.stage-character-slot').forEach((el) => { el.innerHTML = STAGE_CHARACTER_SVG; });
  }

  function updateSeason(stageSel, month) {
    const stage = $(stageSel);
    if (stage) stage.dataset.season = seasonFromMonth(month);
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

  function updateCharacter(container) {
    if (!container) return;
    const isMale = state.gender === 'M';
    const hairM = container.querySelector('.char-hair-m');
    const hairF = container.querySelector('.char-hair-f');
    if (hairM) hairM.style.display = isMale ? '' : 'none';
    if (hairF) hairF.style.display = isMale ? 'none' : '';
    ['.char-robe', '.char-sleeve-l', '.char-sleeve-r'].forEach((sel) => {
      const el = container.querySelector(sel);
      if (el) el.style.fill = `var(--el-${dominantElement()})`;
    });
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

  // ── 인트로 폼 ──
  function initIntroForm() {
    const hourSelect = $('#birth-hour');
    for (let h = 0; h < 24; h++) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `${String(h).padStart(2, '0')}시`;
      hourSelect.appendChild(opt);
    }
    const minSelect = $('#birth-min');
    for (let m = 0; m < 60; m += 10) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${String(m).padStart(2, '0')}분`;
      minSelect.appendChild(opt);
    }
    $('#unknown-time').addEventListener('change', (e) => {
      hourSelect.disabled = e.target.checked;
      minSelect.disabled = e.target.checked;
    });
    $('#intro-form').addEventListener('submit', onSubmitIntro);
  }

  function onSubmitIntro(e) {
    e.preventDefault();
    const name = $('#name').value.trim() || '이름 없음';
    const gender = $('input[name="gender"]:checked').value;
    const y = parseInt($('#birth-year').value, 10);
    const m = parseInt($('#birth-month').value, 10);
    const d = parseInt($('#birth-day').value, 10);
    const unknownTime = $('#unknown-time').checked;
    const hh = unknownTime ? null : parseInt($('#birth-hour').value, 10);
    const mm = unknownTime ? null : parseInt($('#birth-min').value, 10);

    if (!y || !m || !d) {
      alert('생년월일을 모두 입력해주세요.');
      return;
    }

    const saju = Saju.calcFourPillars(y, m, d, hh, mm);
    const elements = Saju.countElements(saju);

    const stats = {};
    for (const s of GameData.STATS) {
      const rel = STAT_ELEMENT_MAP[s.key];
      const bonus = rel.reduce((sum, el) => sum + elements[el] * 6, 0);
      const base = s.key === 'wealth' ? 20 : 45;
      stats[s.key] = base + bonus + Math.floor(Math.random() * 7) - 3;
    }

    state = {
      name, gender, birth: { y, m, d, hh, mm, unknownTime },
      saju, elements, stats,
      monthsElapsed: START_AGE * 12 - 1,
      recentEventIds: [],
      usedMilestones: new Set(),
      log: [],
      alive: true,
    };
    clampStats();
    renderNatalScreen();
    showScreen('natal');
  }

  // ── 사주 원국 화면 ──
  function renderNatalScreen() {
    const { saju, elements } = state;
    updateSeason('#natal-stage', state.birth.m);
    $('#natal-name').textContent = `${state.name} (${state.gender === 'M' ? '남' : '여'})`;
    $('#natal-birth').textContent =
      `${state.birth.y}년 ${state.birth.m}월 ${state.birth.d}일` +
      (state.birth.unknownTime ? ' (태어난 시 모름)' : ` ${String(state.birth.hh).padStart(2, '0')}시 ${String(state.birth.mm).padStart(2, '0')}분`);

    const pillars = [
      ['시주', saju.hour], ['일주', saju.day], ['월주', saju.month], ['연주', saju.year],
    ];
    const wrap = $('#natal-pillars');
    wrap.innerHTML = '';
    for (const [label, p] of pillars) {
      const col = document.createElement('div');
      col.className = 'pillar-col';
      if (p) {
        const stemEl = Saju.elementOf(p.stem, true);
        const branchEl = Saju.elementOf(p.branch, false);
        col.innerHTML = `
          <div class="pillar-label">${label}</div>
          <div class="pillar-char stem elem-${stemEl}">${Saju.STEM_HANJA[p.stem]}</div>
          <div class="pillar-char branch elem-${branchEl}">${Saju.BRANCH_HANJA[p.branch]}</div>
          <div class="pillar-sub">${Saju.STEMS[p.stem]}${Saju.BRANCHES[p.branch]}</div>`;
      } else {
        col.innerHTML = `<div class="pillar-label">${label}</div><div class="pillar-char unknown">?</div><div class="pillar-sub">미상</div>`;
      }
      wrap.appendChild(col);
    }

    const animal = Saju.ANIMALS[saju.year.branch];
    $('#natal-animal').textContent = `${animal}띠`;

    const elBar = $('#natal-elements');
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
    const domainPool = pool.filter((ev) => ev.domain === fortune.dominant);
    const candidates = (domainPool.length > 0 && Math.random() < DOMAIN_MATCH_CHANCE) ? domainPool : pool;
    let fresh = candidates.filter((ev) => !state.recentEventIds.includes(ev.id));
    if (fresh.length === 0) fresh = candidates;
    if (fresh.length === 0) return null;
    return fresh[Math.floor(Math.random() * fresh.length)];
  }

  function advanceAndShow() {
    state.monthsElapsed++;
    const { age, year, month } = currentCalendar();

    if (age >= MAX_AGE) {
      triggerEnding('lifespan', age, month);
      return;
    }

    const fortune = Saju.monthlyFortune(state.saju, year, month);
    const event = pickEvent(age, year, month, fortune);
    if (!event) { advanceAndShow(); return; }

    state.recentEventIds.push(event.id);
    if (state.recentEventIds.length > RECENT_WINDOW) state.recentEventIds.shift();

    const isMilestone = GameData.MILESTONES.some((mm) => mm.id === event.id);
    state.current = { age, year, month, fortune, event, isMilestone, resolved: false };
    renderEventScreen();
  }

  function renderEventScreen() {
    const { age, year, month, fortune, event, isMilestone } = state.current;
    updateSeason('#game-stage', month);
    $('#game-header-name').textContent = state.name;
    $('#game-header-age').textContent = `${age}세`;
    $('#game-header-date').textContent = `${year}년 ${month}월`;
    renderStatChips();

    $('#fortune-badge').textContent = fortune.tier;
    $('#fortune-badge').className = `fortune-badge tier-${fortune.tier}`;
    $('#fortune-desc').textContent = `${fortune.pillarLabel} · ${fortune.desc}`;

    $('#event-title').textContent = (isMilestone ? '★ ' : '') + event.title;
    $('#event-desc').textContent = event.desc;

    const choiceWrap = $('#event-choices');
    choiceWrap.innerHTML = '';
    event.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-text">${choice.text}</span><span class="choice-preview">${choiceOutlook(idx, fortune.tier)}</span>`;
      btn.onclick = () => chooseOption(idx);
      choiceWrap.appendChild(btn);
    });

    $('#result-panel').classList.add('hidden');
    choiceWrap.classList.remove('hidden');
    renderLog();

    $('#skip-open-btn').classList.toggle('hidden', isMilestone);
    closeSkipModal();
  }

  // 선택 전 미리 보여줄 해석: "내 사주(이번 달 기운) + 이 선택"을 합치면 어떤 한 달이 될지 서술
  // 선택지는 항상 [최고/중간/안좋음/최악] 순서로 되어 있다는 전제 하에 idx 로 선택의 질을 판단한다.
  const CHOICE_QUALITY_SCORE = [2, 1, -1, -2];
  const FORTUNE_OUTLOOK_SCORE = { 대길: 2, 길: 1, 평: 0, 흉: -1, 대흉: -2 };
  const OUTLOOK_NARRATIVE = {
    best: '사주의 흐름과 이 선택이 강하게 맞아떨어져, 오래 기억에 남을 만큼 좋은 한 달을 보내게 될 것 같습니다.',
    good: '전체적으로 무난하게, 그리고 꽤 만족스러운 한 달이 될 것 같습니다.',
    mid: '특별히 좋지도 나쁘지도 않은, 평범하게 흘러가는 한 달이 될 것 같습니다.',
    hard: '이런저런 어려움이 따르는, 다소 힘겨운 한 달이 될 수 있습니다.',
    worst: '사주의 흐름과도 맞지 않는 선택이라, 뜻대로 되지 않는 힘든 한 달을 보낼 수도 있습니다.',
  };

  function choiceOutlook(idx, fortuneTier) {
    const score = (CHOICE_QUALITY_SCORE[idx] || 0) + FORTUNE_OUTLOOK_SCORE[fortuneTier];
    if (score >= 3) return OUTLOOK_NARRATIVE.best;
    if (score >= 1) return OUTLOOK_NARRATIVE.good;
    if (score === 0) return OUTLOOK_NARRATIVE.mid;
    if (score >= -2) return OUTLOOK_NARRATIVE.hard;
    return OUTLOOK_NARRATIVE.worst;
  }

  function applyTier(delta, tierMult) {
    if (delta === 0) return 0;
    const mult = delta > 0 ? tierMult : (2 - tierMult);
    return Math.round(delta * mult);
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

    state.log.unshift({ age, year, month, title: event.title, choiceText: choice.text, result: choice.result, applied, tier: fortune.tier });
    if (state.log.length > 30) state.log.pop();

    renderStatChips();
    $('#event-choices').classList.add('hidden');
    const panel = $('#result-panel');
    panel.classList.remove('hidden');
    $('#result-text').textContent = choice.result;
    $('#result-remark').textContent = Saju.TIER_REMARK[fortune.tier];
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
    wrap.innerHTML = GameData.STATS.map((s) => `<span class="hud-stat-chip">${s.icon} ${state.stats[s.key]}</span>`).join('');
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

  function yearHasSelectable(year) {
    const cap = reachableCapMonths();
    for (let m = 1; m <= 12; m++) {
      const tm = monthsElapsedFor(year, m);
      if (tm > state.monthsElapsed && tm <= cap) return true;
    }
    return false;
  }

  function openSkipModal() {
    skipCalYear = currentCalendar().year;
    skipCalSelected = null;
    renderSkipCalendar();
    $('#skip-cal-strategy').classList.add('hidden');
    $('#skip-modal').classList.remove('hidden');
  }

  function closeSkipModal() {
    $('#skip-modal').classList.add('hidden');
  }

  function renderSkipCalendar() {
    const cap = reachableCapMonths();
    $('#skip-cal-year').textContent = `${skipCalYear}년`;
    $('#skip-cal-prev').disabled = !yearHasSelectable(skipCalYear - 1);
    $('#skip-cal-next').disabled = !yearHasSelectable(skipCalYear + 1);

    const grid = $('#skip-cal-grid');
    grid.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const tm = monthsElapsedFor(skipCalYear, m);
      const selectable = tm > state.monthsElapsed && tm <= cap;
      const isSelected = skipCalSelected && skipCalSelected.year === skipCalYear && skipCalSelected.month === m;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skip-cal-cell' + (isSelected ? ' selected' : '');
      btn.textContent = `${m}월`;
      btn.disabled = !selectable;
      btn.onclick = () => {
        skipCalSelected = { year: skipCalYear, month: m };
        renderSkipCalendar();
        showSkipStrategyPanel();
      };
      grid.appendChild(btn);
    }

    const capCal = calendarForMonths(cap);
    const reason = cap < MAX_AGE * 12 ? `다음 중요한 사건(${capCal.age}세)` : '100세';
    $('#skip-cal-range-hint').textContent = `${reason} 전까지만 이동할 수 있어요.`;
  }

  function showSkipStrategyPanel() {
    const targetMonths = monthsElapsedFor(skipCalSelected.year, skipCalSelected.month);
    const targetCal = calendarForMonths(targetMonths);
    $('#skip-cal-selected-label').textContent = `${skipCalSelected.year}년 ${skipCalSelected.month}월(${targetCal.age}세)까지 이동합니다.`;
    $('#skip-cal-strategy').classList.remove('hidden');
  }

  function executeSkip(strategyKey) {
    if (!skipCalSelected) return;
    const strategy = SKIP_STRATEGIES[strategyKey];
    const capMonths = monthsElapsedFor(skipCalSelected.year, skipCalSelected.month);
    const skipMonths = capMonths - state.monthsElapsed;
    if (skipMonths <= 0) { closeSkipModal(); return; }

    let tierSum = 0, count = 0;
    for (let me = state.monthsElapsed + 1; me <= capMonths; me++) {
      const cal = calendarForMonths(me);
      if (cal.age >= MAX_AGE) break;
      const f = Saju.monthlyFortune(state.saju, cal.year, cal.month);
      tierSum += f.tierMult;
      count++;
    }
    const avgMult = count > 0 ? tierSum / count : 1;
    const avgTier = avgMult >= 1.3 ? '대길' : avgMult >= 1.1 ? '길' : avgMult >= 0.95 ? '평' : avgMult >= 0.75 ? '흉' : '대흉';

    const years = skipMonths / 12;
    const applied = {};
    for (const key in strategy.perYear) {
      applied[key] = applyTier(strategy.perYear[key] * years, avgMult);
      state.stats[key] = (state.stats[key] || 0) + applied[key];
    }
    clampStats();

    const fromCal = currentCalendar();
    const capCal = calendarForMonths(capMonths);
    state.log.unshift({
      age: fromCal.age, year: fromCal.year, month: fromCal.month,
      title: '시간을 건너뛰다',
      choiceText: `${strategy.label} (${years.toFixed(1)}년)`,
      result: `${fromCal.age}세부터 ${capCal.age}세까지, ${strategy.label} 시간을 보냈습니다.`,
      applied, tier: avgTier,
    });
    if (state.log.length > 30) state.log.pop();

    closeSkipModal();

    if (state.stats.health <= 0) {
      state.alive = false;
      triggerEnding('death', capCal.age, capCal.month);
      return;
    }

    state.monthsElapsed = capMonths - 1;
    advanceAndShow();
  }

  function initModals() {
    $('#skip-open-btn').addEventListener('click', openSkipModal);
    $('#skip-modal-close').addEventListener('click', closeSkipModal);
    $('#skip-cal-prev').addEventListener('click', () => { skipCalYear--; renderSkipCalendar(); });
    $('#skip-cal-next').addEventListener('click', () => { skipCalYear++; renderSkipCalendar(); });
    document.querySelectorAll('#skip-cal-strategy .skip-strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => executeSkip(btn.dataset.strategy));
    });

    $('#log-open-btn').addEventListener('click', () => $('#log-modal').classList.remove('hidden'));
    $('#log-modal-close').addEventListener('click', () => $('#log-modal').classList.add('hidden'));
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

  function triggerEnding(kind, ageOverride, monthOverride) {
    showScreen('end');
    const age = ageOverride != null ? ageOverride : (state.current ? state.current.age : Math.floor(state.monthsElapsed / 12));
    const month = monthOverride != null ? monthOverride : (state.current ? state.current.month : state.birth.m);
    updateSeason('#end-stage', month);
    $('#end-title').textContent = kind === 'death' ? '생을 마감하다' : '천수를 다하다';
    $('#end-age').textContent = `향년 ${age}세`;
    const best = dominantStat();
    $('#end-epitaph').textContent = EPITAPHS[best.key];

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
