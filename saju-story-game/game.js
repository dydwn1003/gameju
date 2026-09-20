/* 게임 루프: 캐릭터 생성 -> 사주 원국 확인 -> 월별 진행(0~100세) -> 엔딩 */

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

  const SKIP_STRATEGIES = {
    challenge: { label: '도전적으로 산다', perYear: { wealth: 3, happy: 1, health: -2, wisdom: 1, fame: 2 } },
    stable: { label: '안정적으로 산다', perYear: { wealth: 2, happy: 2, health: 1, wisdom: 1, fame: 1 } },
    relaxed: { label: '여유롭게 흘러가는 대로 둔다', perYear: { wealth: 0, happy: 3, health: 2, wisdom: 0, fame: -1 } },
  };

  const PORTRAIT_MOOD = {
    happy: { mouth: 'M68,86 Q80,98 92,86', browL: 'M62,58 Q68,52 76,58', browR: 'M84,58 Q92,52 98,58' },
    neutral: { mouth: 'M70,88 Q80,91 90,88', browL: 'M62,60 Q68,56 75,60', browR: 'M85,60 Q92,56 98,60' },
    tired: { mouth: 'M70,90 Q80,85 90,90', browL: 'M62,64 Q69,68 76,62', browR: 'M84,62 Q91,68 98,64' },
  };

  const PORTRAIT_SVG = `<svg viewBox="0 0 160 180" class="portrait-svg">
    <circle cx="80" cy="90" r="76" class="portrait-ring"/>
    <path class="portrait-robe" d="M30,178 Q30,118 56,106 L104,106 Q130,118 130,178 Z"/>
    <path class="portrait-collar" d="M56,106 L80,138 L104,106"/>
    <rect x="68" y="93" width="24" height="24" rx="6" class="portrait-skin"/>
    <circle cx="80" cy="68" r="34" class="portrait-skin"/>
    <path class="portrait-hair-m" d="M46,58 Q46,28 80,28 Q114,28 114,58 Q114,42 80,42 Q46,42 46,58 Z"/>
    <g class="portrait-hair-f">
      <path d="M44,60 Q40,26 80,26 Q120,26 116,60 Q118,108 104,118 Q112,78 96,48 Q88,40 80,40 Q72,40 64,48 Q48,78 56,118 Q42,108 44,60 Z"/>
      <circle cx="117" cy="64" r="4" class="portrait-pin"/>
    </g>
    <path class="portrait-brow-l" d="M62,60 Q68,56 75,60"/>
    <path class="portrait-brow-r" d="M85,60 Q92,56 98,60"/>
    <ellipse cx="68" cy="70" rx="3.2" ry="4" class="portrait-eye"/>
    <ellipse cx="92" cy="70" rx="3.2" ry="4" class="portrait-eye"/>
    <path class="portrait-mouth" d="M70,86 Q80,90 90,86"/>
  </svg>`;

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
  }

  function clampStats() {
    for (const s of GameData.STATS) {
      const cap = s.key === 'wealth' ? 9999 : 100;
      state.stats[s.key] = Math.max(0, Math.min(cap, state.stats[s.key]));
    }
  }

  // ── 캐릭터 초상화 ──
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

  function updatePortrait(container) {
    if (!container) return;
    if (!container.querySelector('.portrait-svg')) container.innerHTML = PORTRAIT_SVG;
    const isMale = state.gender === 'M';
    const hairM = container.querySelector('.portrait-hair-m');
    const hairF = container.querySelector('.portrait-hair-f');
    if (hairM) hairM.style.display = isMale ? '' : 'none';
    if (hairF) hairF.style.display = isMale ? 'none' : '';
    const robe = container.querySelector('.portrait-robe');
    if (robe) robe.style.fill = `var(--el-${dominantElement()})`;
    const mood = PORTRAIT_MOOD[moodFromHappy(state.stats.happy)];
    const mouth = container.querySelector('.portrait-mouth');
    const browL = container.querySelector('.portrait-brow-l');
    const browR = container.querySelector('.portrait-brow-r');
    if (mouth) mouth.setAttribute('d', mood.mouth);
    if (browL) browL.setAttribute('d', mood.browL);
    if (browR) browR.setAttribute('d', mood.browR);
  }

  function renderAllPortraits() {
    ['#portrait-natal', '#portrait-game', '#portrait-end'].forEach((sel) => updatePortrait($(sel)));
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

    renderAllPortraits();

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

    if (age >= 100) {
      triggerEnding('lifespan', age);
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
    $('#game-header-name').textContent = state.name;
    $('#game-header-age').textContent = `${age}세`;
    $('#game-header-date').textContent = `${year}년 ${month}월`;
    renderStatBars();

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
      btn.textContent = choice.text;
      btn.onclick = () => chooseOption(idx);
      choiceWrap.appendChild(btn);
    });

    $('#result-panel').classList.add('hidden');
    choiceWrap.classList.remove('hidden');
    renderLog();

    $('#skip-open-btn').classList.toggle('hidden', isMilestone);
    closeSkipPanel();
  }

  // ── 시간 건너뛰기 ──
  function findMilestoneCap(fromAge, toAge) {
    let capAge = toAge;
    for (const ms of GameData.MILESTONES) {
      if (ms.age > fromAge && ms.age <= toAge && !state.usedMilestones.has(ms.id) && ms.age < capAge) {
        capAge = ms.age;
      }
    }
    return capAge;
  }

  function openSkipPanel() {
    const currentAge = state.current ? state.current.age : currentCalendar().age;
    const input = $('#skip-target-age');
    input.min = currentAge + 1;
    input.max = 100;
    input.value = Math.min(100, currentAge + 5);
    $('#skip-panel').classList.remove('hidden');
  }

  function closeSkipPanel() {
    $('#skip-panel').classList.add('hidden');
  }

  function executeSkip(strategyKey) {
    const strategy = SKIP_STRATEGIES[strategyKey];
    const currentAge = state.current ? state.current.age : currentCalendar().age;
    let targetAge = parseInt($('#skip-target-age').value, 10);
    if (!targetAge || targetAge <= currentAge) targetAge = currentAge + 1;
    targetAge = Math.min(100, targetAge);

    const capAge = findMilestoneCap(currentAge, targetAge);
    const targetMonthsElapsed = capAge * 12;
    const skipMonths = targetMonthsElapsed - state.monthsElapsed;
    if (skipMonths <= 0) { closeSkipPanel(); return; }

    let tierSum = 0, count = 0;
    for (let me = state.monthsElapsed + 1; me <= targetMonthsElapsed; me++) {
      const cal = calendarForMonths(me);
      if (cal.age >= 100) break;
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
    state.log.unshift({
      age: fromCal.age, year: fromCal.year, month: fromCal.month,
      title: '시간을 건너뛰다',
      choiceText: `${strategy.label} (${years.toFixed(1)}년)`,
      result: `${fromCal.age}세부터 ${capAge}세까지, ${strategy.label} 시간을 보냈습니다.`,
      applied, tier: avgTier,
    });
    if (state.log.length > 30) state.log.pop();

    closeSkipPanel();

    if (state.stats.health <= 0) {
      state.alive = false;
      triggerEnding('death', capAge);
      return;
    }

    state.monthsElapsed = targetMonthsElapsed - 1;
    advanceAndShow();
  }

  function initSkipPanel() {
    $('#skip-open-btn').addEventListener('click', openSkipPanel);
    $('#skip-cancel-btn').addEventListener('click', closeSkipPanel);
    document.querySelectorAll('.skip-strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => executeSkip(btn.dataset.strategy));
    });
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

    renderStatBars();
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
      $('#next-month-btn').onclick = () => triggerEnding('death');
      return;
    }

    $('#next-month-btn').textContent = '다음 달로';
    $('#next-month-btn').onclick = () => advanceAndShow();
  }

  function renderStatBars() {
    const wrap = $('#stat-bars');
    wrap.innerHTML = '';
    for (const s of GameData.STATS) {
      const val = state.stats[s.key];
      const pct = s.key === 'wealth' ? Math.min(100, val / 3) : val;
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span class="stat-icon">${s.icon}</span><span class="stat-name">${s.label}</span>
        <div class="stat-track"><div class="stat-fill stat-${s.key}" style="width:${pct}%"></div></div>
        <span class="stat-val">${val}</span>`;
      wrap.appendChild(row);
    }
    renderAllPortraits();
  }

  function renderLog() {
    const wrap = $('#history-log');
    wrap.innerHTML = state.log.slice(0, 6).map((entry) => `
      <div class="log-item">
        <span class="log-age">${entry.age}세 ${entry.year}.${String(entry.month).padStart(2, '0')}</span>
        <span class="log-tier tier-${entry.tier}">${entry.tier}</span>
        <span class="log-title">${entry.title}</span> — ${entry.choiceText}
      </div>`).join('');
  }

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

  function triggerEnding(kind, ageOverride) {
    showScreen('end');
    const age = ageOverride != null ? ageOverride : (state.current ? state.current.age : Math.floor(state.monthsElapsed / 12));
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
    renderAllPortraits();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initIntroForm();
    initSkipPanel();
  });
})();
