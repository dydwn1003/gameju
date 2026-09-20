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

    $('#start-life-btn').onclick = () => {
      showScreen('game');
      advanceAndShow();
    };
  }

  // ── 시간 진행 ──
  function currentCalendar() {
    const total = state.birth.m - 1 + state.monthsElapsed;
    const age = Math.floor(state.monthsElapsed / 12);
    const year = state.birth.y + Math.floor(total / 12);
    const month = (total % 12) + 1;
    return { age, year, month };
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    initIntroForm();
  });
})();
