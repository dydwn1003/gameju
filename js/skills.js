// ===== 몬스터 스킬: 액티브(기력 100이 차면 발동) + 패시브(항상 적용) =====
// 수치는 등급이 높을수록 커진다 (SKILL_TIER: 액티브 위력, PASSIVE_TIER: 패시브 수치)
const PASSIVE_TIER = { C: 1, B: 1.3, A: 1.6, S: 2, SS: 2.5, SSS: 3 };

// ---- 액티브 종류 ----
// mult: 공격력 대비 피해 배율 / aoe: 적 전체 / hits: 연타 수 / 그 밖의 효과
const ACTIVE_TYPES = {
  strike:  { mult: 2.8, desc: v => `적 1명에게 공격력 ${pct(v.mult)} 피해` },
  burst:   { mult: 1.25, aoe: 1, desc: v => `적 전체에게 공격력 ${pct(v.mult)} 피해` },
  barrage: { mult: 0.8, hits: 4, desc: v => `무작위 적에게 공격력 ${pct(v.mult)} 피해 ${v.hits}회` },
  dot:     { mult: 1.6, burn: 0.35, dur: 4, desc: v => `적 1명에게 ${pct(v.mult)} 피해 + ${v.dur}초간 매초 ${pct(v.burn)} 지속 피해` },
  stun:    { mult: 1.9, stun: 1.6, desc: v => `적 1명에게 ${pct(v.mult)} 피해 + ${v.stun.toFixed(1)}초 기절` },
  heal:    { heal: 2.6, healAll: 1.1, desc: v => `가장 약한 아군 공격력 ${pct(v.heal)}, 나머지 ${pct(v.healAll)} 회복` },
  shield:  { shield: 1.9, atkUp: 0.15, dur: 5, desc: v => `아군 전체 보호막(공격력 ${pct(v.shield)}) + ${v.dur}초간 공격력 +${pct(v.atkUp)}` },
  drain:   { mult: 2.3, steal: 0.6, desc: v => `적 1명에게 ${pct(v.mult)} 피해, 피해량의 ${pct(v.steal)} 회복` },
  warcry:  { mult: 1.0, atkUp: 0.25, dur: 6, desc: v => `적 1명에게 ${pct(v.mult)} 피해 + 아군 전체 ${v.dur}초간 공격력 +${pct(v.atkUp)}` },
  curse:   { mult: 0.85, aoe: 1, defDown: 0.3, dur: 6, desc: v => `적 전체에게 ${pct(v.mult)} 피해 + ${v.dur}초간 방어력 -${pct(v.defDown)}` },
  execute: { mult: 2.2, exec: 0.35, desc: v => `적 1명에게 ${pct(v.mult)} 피해, 체력 ${pct(v.exec)} 이하면 피해 2배` },
};
const pct = x => Math.round(x * 100) + '%';

// 속성별 스킬 이름
const ACTIVE_NAMES = {
  strike:  { fire: '화염 일격', water: '물결 강타', grass: '가시 찌르기', light: '빛의 일격', dark: '그림자 베기' },
  burst:   { fire: '불꽃 폭발', water: '해일', grass: '나뭇잎 폭풍', light: '광휘 폭발', dark: '어둠 폭발' },
  barrage: { fire: '불씨 연사', water: '물방울 난사', grass: '도토리 연타', light: '별빛 난사', dark: '혼불 난사' },
  dot:     { fire: '화상의 불꽃', water: '독안개', grass: '독가시', light: '작열광', dark: '저주의 상처' },
  stun:    { fire: '폭염 강타', water: '얼음 속박', grass: '덩굴 묶기', light: '섬광', dark: '공포의 눈빛' },
  heal:    { fire: '온기의 불씨', water: '맑은 샘물', grass: '생명의 새싹', light: '치유의 빛', dark: '혼의 위로' },
  shield:  { fire: '화염 장막', water: '물의 결계', grass: '나무 방패', light: '수호 결계', dark: '그림자 장막' },
  drain:   { fire: '불꽃 흡수', water: '생기 흡수', grass: '양분 흡수', light: '빛 흡수', dark: '혼 빨아들이기' },
  warcry:  { fire: '불타는 함성', water: '파도의 북소리', grass: '숲의 함성', light: '승리의 나팔', dark: '귀곡성' },
  curse:   { fire: '잿빛 저주', water: '부식의 비', grass: '시듦의 저주', light: '눈부신 낙인', dark: '원한의 저주' },
  execute: { fire: '단죄의 불꽃', water: '심해의 송곳니', grass: '사냥꾼의 일격', light: '심판의 빛', dark: '사신의 낫' },
};

// ---- SS·SSS 전용 궁극기 ----
const ULTIMATES = {
  cheongryong: { name: '청룡승천', type: 'burst', mult: 1.7, stunAll: 1.0, fx: 'water', desc: v => `적 전체에게 공격력 ${pct(v.mult)} 피해 + ${v.stunAll}초 기절` },
  baekho:      { name: '백호참', type: 'barrage', mult: 1.0, hits: 6, critAll: 1, fx: 'light', desc: v => `무작위 적에게 공격력 ${pct(v.mult)} 피해 ${v.hits}회 (모두 치명타)` },
  jujak:       { name: '주작강림', type: 'burst', mult: 1.5, burnAll: 0.4, dur: 5, fx: 'fire', desc: v => `적 전체에게 공격력 ${pct(v.mult)} 피해 + ${v.dur}초간 매초 ${pct(v.burnAll)} 화상` },
  hyeonmu:     { name: '현무진', type: 'shield', shield: 3.2, defUp: 0.35, dur: 7, fx: 'shield', desc: v => `아군 전체 보호막(공격력 ${pct(v.shield)}) + ${v.dur}초간 방어력 +${pct(v.defUp)}` },
  girin:       { name: '기린의 축복', type: 'heal', heal: 2.2, healAll: 2.2, atkUp: 0.3, dur: 8, fx: 'heal', desc: v => `아군 전체 공격력 ${pct(v.heal)} 회복 + ${v.dur}초간 공격력 +${pct(v.atkUp)}` },
  hwangryong:  { name: '천룡강림', type: 'burst', mult: 2.2, stunAll: 1.5, atkUpTeam: 0.3, dur: 8, fx: 'light', desc: v => `적 전체에게 공격력 ${pct(v.mult)} 피해 + ${v.stunAll}초 기절, 아군 ${v.dur}초간 공격력 +${pct(v.atkUpTeam)}` },
  cheonho:     { name: '구미호 여우불 폭풍', type: 'barrage', mult: 1.1, hits: 9, burnAll: 0.3, dur: 4, fx: 'foxfire', desc: v => `여우불 ${v.hits}발 (각 공격력 ${pct(v.mult)}) + 맞은 적 ${v.dur}초간 매초 ${pct(v.burnAll)} 화상` },
  yeomra:      { name: '저승문 심판', type: 'burst', mult: 1.9, reap: 0.2, teamSteal: 0.3, fx: 'dark', desc: v => `적 전체에게 공격력 ${pct(v.mult)} 피해, 체력 ${pct(v.reap)} 이하 일반 적 즉사, 준 피해의 ${pct(v.teamSteal)}만큼 아군 회복` },
};

// ---- 패시브 종류 (C 등급 기준 수치) ----
const PASSIVE_TYPES = {
  tough:     { name: '강인함',     v: 0.10, desc: v => `최대 체력 +${pct(v)}` },
  fierce:    { name: '맹렬함',     v: 0.08, desc: v => `공격력 +${pct(v)}` },
  guard:     { name: '단단함',     v: 0.15, desc: v => `방어력 +${pct(v)}` },
  keen:      { name: '날카로움',   v: 0.05, desc: v => `치명타 확률 +${pct(v)}` },
  brutal:    { name: '잔혹함',     v: 0.2,  desc: v => `치명타 피해 +${pct(v)}` },
  vamp:      { name: '흡혈',       v: 0.06, desc: v => `준 피해의 ${pct(v)} 회복` },
  evasion:   { name: '날렵함',     v: 0.05, desc: v => `${pct(v)} 확률로 공격 회피` },
  regen:     { name: '재생',       v: 0.02, desc: v => `3초마다 최대 체력의 ${pct(v)} 회복` },
  thorns:    { name: '가시 몸',    v: 0.12, desc: v => `받은 피해의 ${pct(v)} 반사` },
  quick:     { name: '선제',       v: 25,   desc: v => `전투 시작 시 기력 +${Math.round(v)}` },
  aura_atk:  { name: '전투 오라',  v: 0.03, desc: v => `아군 전체 공격력 +${pct(v)}` },
  aura_hp:   { name: '수호 오라',  v: 0.04, desc: v => `아군 전체 최대 체력 +${pct(v)}` },
  elemental: { name: '속성 숙련',  v: 0.12, desc: v => `속성 우위일 때 피해 +${pct(v)}` },
  bossbane:  { name: '거인 사냥',  v: 0.15, desc: v => `보스에게 주는 피해 +${pct(v)}` },
};
const ULT_PASSIVE = { cheongryong: 'elemental', baekho: 'brutal', jujak: 'fierce', hyeonmu: 'thorns', girin: 'aura_hp', hwangryong: 'aura_atk', cheonho: 'evasion', yeomra: 'vamp' };

// 역할(기존 skill 필드)에 따라 어울리는 스킬 후보
const ROLE_ACTIVE = { nuke: ['strike', 'execute', 'stun', 'dot'], blast: ['burst', 'curse', 'barrage'], heal: ['heal', 'heal', 'warcry'], shield: ['shield', 'warcry', 'stun'], drain: ['drain', 'dot', 'execute'] };
const ROLE_PASSIVE = { nuke: ['fierce', 'keen', 'brutal', 'bossbane'], blast: ['elemental', 'fierce', 'quick'], heal: ['regen', 'aura_hp', 'tough'], shield: ['guard', 'thorns', 'tough', 'aura_atk'], drain: ['vamp', 'evasion', 'keen'] };
const hashId = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const SkillDB = (() => {
  const cache = {};
  function of(id) {
    if (cache[id]) return cache[id];
    const L = LINE_MAP[id], t = SKILL_TIER[L.r] || 1, pt = PASSIVE_TIER[L.r] || 1, h = hashId(id);
    let active;
    if (ULTIMATES[id]) active = Object.assign({ ult: true, hits: 1 }, ULTIMATES[id], { desc: null });
    else {
      const type = ROLE_ACTIVE[L.skill][h % ROLE_ACTIVE[L.skill].length], T = ACTIVE_TYPES[type];
      active = Object.assign({ type, name: ACTIVE_NAMES[type][L.el] }, T);
    }
    // 등급 배율: 피해·회복·보호막은 SKILL_TIER, 지속시간·기절은 조금만
    for (const k of ['mult', 'heal', 'healAll', 'shield']) if (active[k]) active[k] = +(active[k] * t).toFixed(2);
    for (const k of ['burn', 'burnAll']) if (active[k]) active[k] = +(active[k] * t).toFixed(2);
    if (active.stun) active.stun = +(active.stun * (1 + (t - 1) * 0.4)).toFixed(1);
    if (!active.desc || typeof active.desc === 'function') active.descText = (ACTIVE_TYPES[active.type].desc)(active);
    if (active.ult) active.descText = ULTIMATES[id].desc(active);
    const pk = ULT_PASSIVE[id] || ROLE_PASSIVE[L.skill][(h >>> 3) % ROLE_PASSIVE[L.skill].length];
    const P = PASSIVE_TYPES[pk], pv = pk === 'quick' ? P.v * pt : +(P.v * pt).toFixed(3);
    const passive = { key: pk, name: P.name, v: pv, descText: P.desc(pv) };
    return (cache[id] = { active, passive });
  }
  // 적: 체형별 간단한 액티브, 보스는 강인함 패시브
  const ENEMY_ACTIVE = { ghost: 'drain', ghostlady: 'drain', egghost: 'curse', reaper: 'execute', jelly: 'dot', cloud: 'stun', golem: 'burst', octo: 'burst', dragon: 'burst', fox: 'barrage', bear: 'stun', crab: 'strike', goblin: 'strike', toad: 'dot', bat: 'drain', lion: 'stun', serpent: 'dot', fish: 'strike', bird: 'barrage' };
  function enemy(id, boss) {
    const E = ENEMY_MAP[id], type = ENEMY_ACTIVE[E.arch] || 'strike', T = ACTIVE_TYPES[type];
    const active = Object.assign({ type, name: ACTIVE_NAMES[type][E.ch] || '공격' }, T);
    if (boss) { active.mult = (active.mult || 1) * 1.2; }
    return { active, passive: boss ? { key: 'tough', v: 0.2 } : null };
  }
  return { of, enemy };
})();

// ===== 조합 시너지 =====
// ① 속성 시너지: 같은 속성 몬스터 2/3/4마리  ② 테마 세트: 정해진 몬스터를 2/3/4마리 넣으면 보너스
const BONUS_LABEL = { atk: '공격력', hp: '체력', def: '방어력', crit: '치명타', critDmg: '치명 피해', spd: '속도', dodge: '회피', lifesteal: '흡혈', skill: '스킬 피해', regen: '재생' };
const ELEMENT_SYNERGY = { 2: { atk: 0.08 }, 3: { atk: 0.15, hp: 0.1 }, 4: { atk: 0.25, hp: 0.2, skill: 0.1 } };
const SYNERGY_SETS = [
  { id: 'sasin', name: '사신', icon: '🐉', members: ['cheongryong', 'baekho', 'jujak', 'hyeonmu'], tiers: { 2: { atk: 0.15 }, 3: { atk: 0.25, hp: 0.15 }, 4: { atk: 0.4, hp: 0.3, skill: 0.25 } } },
  { id: 'dragon', name: '용의 혈통', icon: '🐲', members: ['imugi', 'cheongryong', 'hwangryong', 'yongma', 'eopgu', 'yongwang'], tiers: { 2: { skill: 0.1 }, 3: { skill: 0.2, atk: 0.1 }, 4: { skill: 0.35, atk: 0.2 } } },
  { id: 'fox', name: '여우 일족', icon: '🦊', members: ['yeowoo', 'maegu', 'cheonho'], tiers: { 2: { crit: 0.08 }, 3: { crit: 0.15, critDmg: 0.35 } } },
  { id: 'dokkaebi', name: '도깨비 패거리', icon: '👹', members: ['bitjaru', 'cheongdok', 'hongdok', 'dueok', 'geumdok', 'dokdaejang', 'dokkaebibul'], tiers: { 2: { atk: 0.08 }, 3: { atk: 0.15, crit: 0.05 }, 4: { atk: 0.25, crit: 0.1 } } },
  { id: 'ghost', name: '원혼', icon: '👻', members: ['dalgyal', 'cheonyeo', 'mulgwi', 'geuseundae', 'yeomra', 'pureunbul'], tiers: { 2: { lifesteal: 0.05 }, 3: { lifesteal: 0.1, dodge: 0.05 }, 4: { lifesteal: 0.15, dodge: 0.1 } } },
  { id: 'object', name: '물건 요괴', icon: '🏺', members: ['jipsin', 'jangdok', 'horong', 'yeopjeon', 'bokjumeo', 'horibyeong', 'buchae', 'hahoetal', 'maetdol', 'chorong', 'hwaro'], tiers: { 2: { hp: 0.1 }, 3: { hp: 0.18, def: 0.1 }, 4: { hp: 0.3, def: 0.2 } } },
  { id: 'longevity', name: '십장생', icon: '🦌', members: ['hak', 'cheonghak', 'geobuk', 'noru', 'kkotsasum', 'yongwang', 'idkki'], tiers: { 2: { hp: 0.08, regen: 0.01 }, 3: { hp: 0.15, regen: 0.02 }, 4: { hp: 0.25, regen: 0.03 } } },
  { id: 'forest', name: '숲의 짐승', icon: '🐻', members: ['cheongseol', 'neoguri', 'metdwaeji', 'noru', 'bandal', 'sangun', 'sudal', 'jindo', 'sapsal'], tiers: { 2: { spd: 0.05 }, 3: { spd: 0.1, atk: 0.08 }, 4: { spd: 0.15, atk: 0.15 } } },
  { id: 'sea', name: '바다 친구들', icon: '🐟', members: ['ingeo', 'megi', 'kkotge', 'haepari', 'muneo', 'eunin', 'sudal', 'geobuk', 'yongwang'], tiers: { 2: { def: 0.1 }, 3: { def: 0.18, hp: 0.1 }, 4: { def: 0.3, hp: 0.18 } } },
  { id: 'sky', name: '하늘의 날개', icon: '🪶', members: ['kkachi', 'chamsae', 'pyeonbok', 'bandit', 'nabi', 'hak', 'buheong', 'cheonghak', 'samjok', 'jujak'], tiers: { 2: { dodge: 0.04 }, 3: { dodge: 0.08, spd: 0.08 }, 4: { dodge: 0.12, spd: 0.12 } } },
  { id: 'holy', name: '영물', icon: '✨', members: ['haetae', 'samjok', 'girin', 'jujak', 'bulgasari', 'jangsan', 'hwangryong'], tiers: { 2: { atk: 0.12 }, 3: { atk: 0.2, def: 0.15 }, 4: { atk: 0.3, def: 0.25 } } },
];
const bonusText = b => Object.entries(b).map(([k, v]) => `${BONUS_LABEL[k]} +${Math.round(v * 100)}%`).join(' · ');

const Synergy = (() => {
  function compute(ids) {
    const bonus = {}, active = [];
    const add = b => { for (const [k, v] of Object.entries(b)) bonus[k] = (bonus[k] || 0) + v; };
    const byEl = {};
    ids.forEach(id => { const el = LINE_MAP[id].el; byEl[el] = (byEl[el] || 0) + 1; });
    for (const [el, n] of Object.entries(byEl)) {
      const tier = Math.min(4, n);
      if (tier >= 2) { add(ELEMENT_SYNERGY[tier]); active.push({ name: `${ELEMENTS[el].name} 속성`, icon: ELEMENTS[el].icon, n, max: 4, text: bonusText(ELEMENT_SYNERGY[tier]) }); }
    }
    for (const S of SYNERGY_SETS) {
      const n = ids.filter(id => S.members.includes(id)).length, need = Object.keys(S.tiers).map(Number);
      const reached = need.filter(t => n >= t).pop();
      if (reached) { add(S.tiers[reached]); active.push({ name: S.name, icon: S.icon, n, max: Math.max(...need), text: bonusText(S.tiers[reached]) }); }
    }
    return { bonus, active };
  }
  const setsOf = id => SYNERGY_SETS.filter(S => S.members.includes(id));
  return { compute, setsOf };
})();
