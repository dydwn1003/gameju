// RELIC : 잊혀진 영웅 — 데이터 테이블
// GDD의 수치/공식을 그대로 옮긴 파일. 밸런스 조정은 여기서만 한다.
'use strict';
const R = (window.R = {});

R.VIEW_W = 216;        // 논리 해상도 (9:16)
R.VIEW_H = 384;
R.SCALE = 3;           // 캔버스 실제 픽셀 배율
R.TILE = 16;
R.MAX_LEVEL = 50;

// ─── 속성 ───────────────────────────────────────────────
R.ELEM = {
  NONE:    { name: '무',   color: '#e8e8e8', icon: '·' },
  FIRE:    { name: '화염', color: '#ff7a33', icon: '🔥' },
  ICE:     { name: '냉기', color: '#7fd8ff', icon: '❄' },
  THUNDER: { name: '번개', color: '#ffe14d', icon: '⚡' },
  NATURE:  { name: '자연', color: '#6be06b', icon: '🌿' },
  DARK:    { name: '암흑', color: '#b27bff', icon: '🌑' },
};
// 화염 → 자연 → 번개 → 냉기 → 화염, 암흑 ↔ 암흑
R.ELEM_BEATS = { FIRE: 'NATURE', NATURE: 'THUNDER', THUNDER: 'ICE', ICE: 'FIRE', DARK: 'DARK' };
R.elemMod = (atk, def) => (atk && atk !== 'NONE' && R.ELEM_BEATS[atk] === def ? 1.25 : 1);
R.weaknessOf = (elem) => Object.keys(R.ELEM_BEATS).find((k) => R.ELEM_BEATS[k] === elem) || null;

// ─── 콤보 ───────────────────────────────────────────────
R.COMBO_STEPS = [
  { name: '베기',     rate: 1.0, stun: 0.15, launch: 0,  down: false },
  { name: '올려베기', rate: 1.3, stun: 0.3,  launch: 1,  down: false },
  { name: '강타',     rate: 1.8, stun: 1.0,  launch: 0,  down: true },
];
R.comboBonus = (n) => (n >= 5 ? 0.3 : n === 4 ? 0.2 : n === 3 ? 0.1 : n === 2 ? 0.05 : 0);
R.COMBO_TIMEOUT = 2.0;
R.DODGE_CD = 2.0;
R.DODGE_IFRAME = 0.25;

// ─── 경험치 ─────────────────────────────────────────────
R.expToNext = (lv) => Math.floor(80 * Math.pow(lv, 1.35) + 20); // Lv1→2 = 100
R.expMod = (d) => {                                             // d = 몬스터Lv - 플레이어Lv
  if (d <= -10) return 0.3;
  if (d < 0) return 1 + d * 0.07;
  if (d <= 5) return 1 + d * 0.04;
  if (d <= 10) return 1.2 - (d - 5) * 0.04;
  return 1.0;
};

// ─── 직업 ───────────────────────────────────────────────
// atkStat: 공격력 계산에 쓰는 스탯. 마법은 INT*2.2, 물리는 STAT*2.0
R.CLASSES = {
  GLADIATOR: {
    name: '검투사', weapon: 'sword', desc: '한손검 + 방패 / 안정적 근접',
    base: { str: 12, dex: 6, int: 3, vit: 10, luk: 4 },
    grow: { str: 1, vit: 1 }, atkStat: 'str', melee: true,
    range: 20, arc: 1.1, moveSpeed: 62, atkSpeed: 1.1,
    look: { skin: '#f1c29a', hair: '#7a4a24', body: '#8e9bb0', bodyD: '#5d6a80', legs: '#4a4f5c', boots: '#3a2a20', hat: 'helm', hatC: '#c9d1dc', cape: '#b33a3a' },
    skills: ['charge', 'whirl', 'shieldbash', 'warcry'],
    adv: ['GUARDIAN', 'BERSERKER'],
  },
  RANGER: {
    name: '레인저', weapon: 'bow', desc: '장궁 / 원거리 무빙샷',
    base: { str: 5, dex: 13, int: 4, vit: 8, luk: 6 },
    grow: { dex: 1, luk: 1 }, atkStat: 'dex', melee: false,
    range: 120, moveSpeed: 66, atkSpeed: 1.05,
    look: { skin: '#f1c29a', hair: '#c68a3c', body: '#3f8a3a', bodyD: '#2a5e28', legs: '#5a4630', boots: '#3a2a20', hat: 'hood', hatC: '#3f8a3a', cape: '#2a5e28' },
    skills: ['multishot', 'pierce', 'arrowrain', 'evade'],
    adv: ['SNIPER', 'TRAPPER'],
  },
  MAGE: {
    name: '원소술사', weapon: 'staff', desc: '지팡이 / 범위 원소 폭딜',
    base: { str: 3, dex: 5, int: 14, vit: 7, luk: 5 },
    grow: { int: 1, vit: 1 }, atkStat: 'int', melee: false,
    range: 110, moveSpeed: 60, atkSpeed: 0.95,
    look: { skin: '#f1c29a', hair: '#e8e0d0', body: '#3a57b8', bodyD: '#263c85', legs: '#263c85', boots: '#3a2a20', hat: 'wizard', hatC: '#3a57b8', cape: '#263c85' },
    skills: ['fireball', 'icelance', 'thunder', 'frostnova'],
    adv: ['ARCHMAGE', 'WARLOCK'],
  },
  ASSASSIN: {
    name: '암살자', weapon: 'dagger', desc: '쌍단검 / 고기동 치명타',
    base: { str: 11, dex: 10, int: 3, vit: 7, luk: 10 },
    grow: { str: 1, luk: 1 }, atkStat: 'str', melee: true,
    range: 17, arc: 0.95, moveSpeed: 70, atkSpeed: 1.3, critBonus: 0.12, lukMul: 1.6,
    look: { skin: '#e8b890', hair: '#1c1c24', body: '#3a3a4a', bodyD: '#24242e', legs: '#24242e', boots: '#18181e', hat: 'mask', hatC: '#24242e', cape: '#5a2a6a' },
    skills: ['shadowstep', 'poisonblade', 'kunai', 'smokebomb'],
    adv: ['ASSASSIN2', 'NINJA'],
  },
};

// 스탯 효과 계수 (1포인트당). 주 능력치(atkStat)는 공격력 +2 (지능은 +2.2)
R.STAT_FX = { lukCrit: 0.0015, lukCritDmg: 0.004, dexSpd: 0.004, strHp: 5 };
// 직업별 추천 능력치 (스탯 창에 표시)
R.STAT_REC = { GLADIATOR: ['str', 'vit'], RANGER: ['dex', 'luk'], MAGE: ['int', 'vit'], ASSASSIN: ['str', 'luk'] };
// 스탯 +1 포인트의 효과 설명 (직업별)
R.statEffect = (cls, k) => {
  const c = R.CLASSES[cls], F = R.STAT_FX, m = c.lukMul || 1;
  const out = [];
  if (k === c.atkStat) out.push(`공격력 +${k === 'int' ? 2.2 : 2}`);
  if (k === 'str' && c.atkStat !== 'str') out.push(`최대 HP +${F.strHp}`);
  if (k === 'dex') out.push(`공격속도 +${(F.dexSpd * 100).toFixed(1)}%`);
  if (k === 'int') out.push('최대 MP +5');
  if (k === 'vit') out.push('최대 HP +20', '방어력 +1.5');
  if (k === 'luk') out.push(`치명타 +${(F.lukCrit * m * 100).toFixed(2)}%`, `치명타 피해 +${(F.lukCritDmg * m * 100).toFixed(1)}%`, '희귀 드랍 ↑');
  return out.join(' · ');
};

// 직업 선택 화면 연출용 정보
R.CLASS_META = {
  GLADIATOR: { en: 'GLADIATOR', color: '#ff9a3a', glow: '#ffcf6a', role: ['근접', '탱커'], diff: 1, tagline: '방패로 버티고, 한 칼에 쓸어버린다', fx: 'ember' },
  RANGER: { en: 'RANGER', color: '#7ad85a', glow: '#c8ff9a', role: ['원거리', '딜러'], diff: 2, tagline: '거리를 벌리고 화살비를 쏟아낸다', fx: 'leaf' },
  MAGE: { en: 'ELEMENTALIST', color: '#6ab6ff', glow: '#bfe6ff', role: ['원거리', '광역'], diff: 3, tagline: '불과 얼음으로 적진을 휩쓴다', fx: 'spark' },
  ASSASSIN: { en: 'ASSASSIN', color: '#c890ff', glow: '#e8ccff', role: ['근접', '치명타'], diff: 3, tagline: '그림자에서 나타나 급소를 꿰뚫는다', fx: 'smoke' },
};

// 2차 전직 (Lv.30) — 패시브 보정
R.ADVANCES = {
  GUARDIAN:  { name: '가디언',     desc: '방어력 +30%, 받는 피해 -15%, 공격력 +10%', mod: { defPct: 0.3, dmgTaken: -0.15, atkPct: 0.1 } },
  BERSERKER: { name: '버서커',     desc: '공격력 +20%, 체력 50% 이하일 때 추가 +20%', mod: { atkPct: 0.2, berserk: 0.2 } },
  SNIPER:    { name: '스나이퍼',   desc: '치명타 +15%, 치명타 피해 +20%', mod: { crit: 0.15, critDmg: 0.2 } },
  TRAPPER:   { name: '트래퍼',     desc: '스킬 피해 +20%, 적중 시 둔화', mod: { skillPct: 0.2, slowOnHit: true } },
  ARCHMAGE:  { name: '아크메이지', desc: '스킬 범위 +30%, 마법 공격력 +10%', mod: { aoePct: 0.3, atkPct: 0.1 } },
  WARLOCK:   { name: '워록',       desc: '모든 적중에 저주(지속 피해) 중첩', mod: { dotOnHit: true, atkPct: 0.05 } },
  ASSASSIN2: { name: '어쌔신',     desc: '치명타 +10%, 치명타 피해 +40%', mod: { crit: 0.1, critDmg: 0.4 } },
  NINJA:     { name: '닌자',       desc: '회피 쿨타임 -40%, 이동속도 +15%', mod: { dodgeCdr: 0.4, movePct: 0.15 } },
};

// ─── 스킬 ───────────────────────────────────────────────
R.SKILLS = {
  charge:      { name: '돌진',       mp: 15, cd: 4, rate: 2.0, elem: 'NONE',    icon: '💨', desc: '전방으로 돌진하며 경로상의 적에게 200% 피해 + 기절' },
  whirl:       { name: '회전베기',   mp: 25, cd: 6, rate: 2.4, elem: 'NONE',    icon: '🌀', desc: '주변 360도 적에게 240% 피해, 다운' },
  multishot:   { name: '연사',       mp: 15, cd: 3, rate: 1.0, elem: 'NONE',    icon: '🏹', desc: '부채꼴로 화살 5발 발사, 각 100%' },
  pierce:      { name: '뇌전화살',   mp: 25, cd: 6, rate: 2.6, elem: 'THUNDER', icon: '⚡', desc: '적을 관통하는 번개 화살 260%, 감전' },
  fireball:    { name: '화염구',     mp: 20, cd: 3, rate: 2.5, elem: 'FIRE',    icon: '🔥', desc: '폭발하는 화염구 250% 범위 피해 + 화상' },
  icelance:    { name: '빙결창',     mp: 18, cd: 4, rate: 2.2, elem: 'ICE',     icon: '❄', desc: '관통하는 얼음창 220% + 빙결(둔화)' },
  shadowstep:  { name: '그림자이동', mp: 18, cd: 5, rate: 2.5, elem: 'DARK',    icon: '👤', desc: '가까운 적 뒤로 순간이동 후 250% 확정 치명타' },
  poisonblade: { name: '독칼난무',   mp: 22, cd: 6, rate: 0.7, elem: 'NATURE',  icon: '🗡', desc: '전방을 5회 연속 베어 각 70% + 중독' },
  // 전직 전용 궁극기 (GDD 12: 2차 전직 시 세 번째 스킬 슬롯 개방)
  bulwark:     { name: '수호의 방벽', mp: 40, cd: 16, rate: 2.4, elem: 'NONE',    icon: '🛡', ult: true, desc: '충격파 240% + 주변 적 기절, 5초간 받는 피해 -60%' },
  bloodrage:   { name: '피의 격노',   mp: 35, cd: 14, rate: 3.2, elem: 'FIRE',    icon: '🩸', ult: true, desc: '도약 내려찍기 320% — 잃은 체력 1%당 피해 +1.5%' },
  deadeye:     { name: '데드아이',    mp: 40, cd: 15, rate: 4.5, elem: 'NONE',    icon: '🎯', ult: true, desc: '모든 적을 꿰뚫는 저격 450%, 확정 치명타' },
  snare:       { name: '덫 지대',     mp: 35, cd: 14, rate: 2.2, elem: 'NATURE',  icon: '🪤', ult: true, desc: '덫 5개 설치 — 밟으면 폭발 220% + 기절·둔화 (10초 유지)' },
  meteor:      { name: '메테오',      mp: 50, cd: 16, rate: 3.0, elem: 'FIRE',    icon: '☄', ult: true, desc: '조준 지점에 운석 3개 낙하, 각 300% 범위 피해 + 화상' },
  hex:         { name: '파멸의 저주', mp: 40, cd: 14, rate: 2.0, elem: 'DARK',    icon: '🕯', ult: true, desc: '주변 적 전체 200% + 저주. 이미 저주받은 적은 2배, 적중마다 HP 회복' },
  execute:     { name: '처형',        mp: 35, cd: 12, rate: 4.0, elem: 'DARK',    icon: '💀', ult: true, desc: '가장 약한 적에게 순간이동 400% 확정 치명타, 체력 30% 이하면 2배' },
  clones:      { name: '분신술',      mp: 40, cd: 15, rate: 1.3, elem: 'NONE',    icon: '🥷', ult: true, desc: '무적 상태로 주변 적 사이를 8회 순간이동하며 각 130%' },
};
// ─── 추가 스킬 (type 으로 동작을 정하는 데이터형 스킬) ─────────────
//  cone: 앞 칸 베기(reach 칸, wide 좌우 포함, hits 연타)  nova: 내 주변 폭발(r, hits)
//  line: 투사체(count, spread, kind, speed, pierce, seq=연속 발사)  ring: 8방향 투사체
//  zone: 지점 폭발(at: target/front, count, r, delay)  buff: 자기 강화(mods, dur)
//  leap: 뒤로 도약 + 버프   dash: 앞으로 돌진하며 베기(tiles)   blink: 가장 가까운 적 뒤로   drain: 흡수
Object.assign(R.SKILLS, {
  // 검투사
  shieldbash:  { name: '방패 강타',   mp: 16, cd: 5,  rate: 2.2, elem: 'NONE', icon: '🛡', type: 'cone', reach: 1, stun: 1.6, desc: '앞의 적을 방패로 후려쳐 220% 피해 + 기절 1.6초' },
  warcry:      { name: '전투의 함성', mp: 22, cd: 20, rate: 0,   elem: 'NONE', icon: '📣', type: 'buff', dur: 8, mods: { atk: 0.25, dmgTaken: -0.15 }, color: '#ffb040', desc: '8초간 공격력 +25%, 받는 피해 -15%' },
  // 레인저
  arrowrain:   { name: '화살비',     mp: 20, cd: 8,  rate: 0.9, elem: 'NONE', icon: '🌧', type: 'zone', at: 'target', r: 34, hits: 3, delay: 0.45, fx: 'arrows', desc: '지정 지점에 화살비 3회, 각 90% 범위 피해' },
  evade:       { name: '후방 도약',   mp: 14, cd: 7,  rate: 0,   elem: 'NONE', icon: '🦘', type: 'leap', tiles: 2, dur: 3, mods: { move: 0.3 }, color: '#7ad85a', desc: '뒤로 2칸 도약(무적) 후 3초간 이동속도 +30%' },
  // 원소술사
  thunder:     { name: '낙뢰',       mp: 22, cd: 6,  rate: 3.0, elem: 'THUNDER', icon: '🌩', type: 'zone', at: 'target', r: 22, delay: 0.3, stun: 0.8, fx: 'thunder', desc: '가장 가까운 적에게 번개가 떨어져 300% + 기절' },
  frostnova:   { name: '서리 폭발',   mp: 26, cd: 9,  rate: 1.4, elem: 'ICE',  icon: '💠', type: 'nova', r: 40, status: { slow: 4 }, stun: 0.6, desc: '주변을 얼려 140% 피해 + 빙결 4초' },
  // 암살자
  kunai:       { name: '표창 투척',   mp: 12, cd: 4,  rate: 1.2, elem: 'NATURE', icon: '✴', type: 'line', count: 3, spread: 0.22, kind: 'knife', speed: 260, status: { poison: 3 }, desc: '독 묻은 표창 3개, 각 120% + 중독' },
  smokebomb:   { name: '연막탄',     mp: 20, cd: 12, rate: 0.8, elem: 'DARK', icon: '💨', type: 'nova', r: 38, stun: 1.4, selfBuff: { dur: 3, mods: { move: 0.25, dmgTaken: -0.3 } }, color: '#9a8aaa', desc: '연막으로 주변 적 기절 1.4초, 3초간 이동속도 +25%·받는 피해 -30%' },

  // 가디언
  fortress:    { name: '철벽',       mp: 26, cd: 16, rate: 0,   elem: 'NONE', icon: '🏰', type: 'buff', dur: 6, mods: { dmgTaken: -0.4 }, color: '#9ad8ff', desc: '6초간 받는 피해 -40%' },
  shieldwave:  { name: '방패 파동',   mp: 28, cd: 7,  rate: 2.8, elem: 'NONE', icon: '🌊', type: 'line', count: 1, kind: 'wave', speed: 200, pierce: true, down: true, desc: '관통하는 방패 충격파 280% + 다운' },
  holystrike:  { name: '심판의 일격', mp: 30, cd: 9,  rate: 3.6, elem: 'NONE', icon: '⚜', type: 'cone', reach: 2, wide: true, heal: 0.04, down: true, desc: '앞 2칸을 넓게 내리쳐 360% — 맞힌 적마다 HP 4% 회복' },
  // 버서커
  frenzy:      { name: '광란',       mp: 20, cd: 18, rate: 0,   elem: 'NONE', icon: '😡', type: 'buff', dur: 8, mods: { atk: 0.4, dmgTaken: 0.15 }, color: '#ff4a3a', desc: '8초간 공격력 +40% (받는 피해 +15%)' },
  cleave:      { name: '대지 가르기', mp: 26, cd: 6,  rate: 2.8, elem: 'NONE', icon: '🪓', type: 'cone', reach: 3, down: true, desc: '앞 3칸을 일직선으로 갈라 280% + 다운' },
  bloodspin:   { name: '피의 회오리', mp: 30, cd: 9,  rate: 1.1, elem: 'FIRE', icon: '🌪', type: 'nova', r: 36, hits: 3, heal: 0.015, desc: '회전하며 주변 3연타 각 110% — 적중마다 HP 1.5% 회복' },
  // 스나이퍼
  headshot:    { name: '헤드샷',     mp: 24, cd: 8,  rate: 3.2, elem: 'NONE', icon: '🎯', type: 'line', count: 1, kind: 'arrow', speed: 420, forceCrit: true, desc: '빠른 한 발 320%, 확정 치명타' },
  focus:       { name: '집중',       mp: 20, cd: 18, rate: 0,   elem: 'NONE', icon: '👁', type: 'buff', dur: 8, mods: { crit: 0.25, atk: 0.15 }, color: '#ffe070', desc: '8초간 치명타 +25%, 공격력 +15%' },
  burstshot:   { name: '연발 사격',   mp: 22, cd: 5,  rate: 1.3, elem: 'NONE', icon: '🏹', type: 'line', count: 3, seq: true, kind: 'arrow', speed: 320, desc: '같은 방향으로 3연발, 각 130%' },
  // 트래퍼
  netshot:     { name: '그물 화살',   mp: 18, cd: 6,  rate: 1.4, elem: 'NATURE', icon: '🕸', type: 'line', count: 1, kind: 'arrow', speed: 260, stun: 1.2, status: { slow: 4 }, desc: '그물 화살 140% + 기절 1.2초 + 둔화' },
  poisoncloud: { name: '독안개',     mp: 26, cd: 9,  rate: 0.7, elem: 'NATURE', icon: '☁', type: 'zone', at: 'target', r: 40, hits: 4, delay: 0.3, status: { poison: 6 }, fx: 'poison', desc: '지정 지점에 독안개 4회 각 70% + 강한 중독' },
  volley:      { name: '일제 사격',   mp: 28, cd: 8,  rate: 1.3, elem: 'NONE', icon: '✳', type: 'ring', count: 8, kind: 'arrow', speed: 240, desc: '8방향으로 화살 발사, 각 130%' },
  // 아크메이지
  flamepillar: { name: '화염 기둥',   mp: 28, cd: 8,  rate: 2.2, elem: 'FIRE', icon: '🔥', type: 'zone', at: 'front', count: 3, r: 18, delay: 0.25, status: { burn: 4 }, fx: 'fire', desc: '앞으로 불기둥 3개가 차례로 솟아 각 220% + 화상' },
  blizzard:    { name: '눈보라',     mp: 34, cd: 12, rate: 0.85, elem: 'ICE',  icon: '🌨', type: 'zone', at: 'target', r: 48, hits: 4, delay: 0.35, status: { slow: 3 }, fx: 'ice', desc: '넓은 눈보라 4회 각 85% + 빙결' },
  arcanemissile: { name: '마력 탄환', mp: 20, cd: 4,  rate: 0.8, elem: 'NONE', icon: '✨', type: 'line', count: 5, spread: 0.18, kind: 'bolt', speed: 230, desc: '마력 탄환 5발, 각 80%' },
  // 워록
  curseorb:    { name: '저주 구체',   mp: 24, cd: 6,  rate: 2.6, elem: 'DARK', icon: '🔮', type: 'line', count: 1, kind: 'orb', speed: 120, pierce: true, status: { curse: 6 }, desc: '느리게 관통하는 저주 구체 260% + 저주' },
  drain:       { name: '생명 흡수',   mp: 22, cd: 7,  rate: 2.6, elem: 'DARK', icon: '🩸', type: 'drain', heal: 0.08, desc: '가까운 적 하나에서 생명을 빼앗아 260% + HP 8% 회복' },
  darkpact:    { name: '어둠의 계약', mp: 10, cd: 20, rate: 0,   elem: 'DARK', icon: '📜', type: 'buff', dur: 8, hpCost: 0.1, mods: { atk: 0.35 }, color: '#b27bff', desc: 'HP 10%를 바쳐 8초간 공격력 +35%' },
  // 어쌔신
  backstab:    { name: '암습',       mp: 22, cd: 8,  rate: 3.0, elem: 'DARK', icon: '🗡', type: 'blink', forceCrit: true, desc: '가까운 적의 뒤로 이동해 300% 확정 치명타' },
  bladedance:  { name: '칼날 폭풍',   mp: 28, cd: 9,  rate: 0.8, elem: 'NONE', icon: '🌀', type: 'nova', r: 34, hits: 4, desc: '주변을 4연타 각 80%' },
  deathmark:   { name: '죽음의 표식', mp: 20, cd: 18, rate: 0,   elem: 'DARK', icon: '☠', type: 'buff', dur: 6, mods: { crit: 0.3, atk: 0.1 }, color: '#ff3a5a', desc: '6초간 치명타 +30%, 공격력 +10%' },
  // 닌자
  shuriken:    { name: '풍마 수리검', mp: 20, cd: 5,  rate: 2.6, elem: 'NONE', icon: '✴', type: 'line', count: 1, kind: 'knife', speed: 280, pierce: true, desc: '모든 적을 꿰뚫는 거대 수리검 260%' },
  flashstep:   { name: '섬광보',     mp: 18, cd: 6,  rate: 2.2, elem: 'NONE', icon: '⚡', type: 'dash', tiles: 4, desc: '무적 상태로 앞으로 4칸 질주하며 경로의 적 220%' },
  kage:        { name: '그림자 분신', mp: 22, cd: 16, rate: 0,   elem: 'DARK', icon: '👥', type: 'buff', dur: 6, mods: { move: 0.35, dmgTaken: -0.2 }, color: '#8a8aff', desc: '6초간 이동속도 +35%, 받는 피해 -20%' },
});
// 기본 스킬 습득 레벨 (직업 스킬 순서대로)
R.SKILL_UNLOCK = [1, 1, 8, 16];
// 전직 시 새로 얻는 스킬 3개 (+ 궁극기)
R.ADV_SKILLS = {
  GUARDIAN: ['fortress', 'shieldwave', 'holystrike'], BERSERKER: ['frenzy', 'cleave', 'bloodspin'],
  SNIPER: ['headshot', 'focus', 'burstshot'], TRAPPER: ['netshot', 'poisoncloud', 'volley'],
  ARCHMAGE: ['flamepillar', 'blizzard', 'arcanemissile'], WARLOCK: ['curseorb', 'drain', 'darkpact'],
  ASSASSIN2: ['backstab', 'bladedance', 'deathmark'], NINJA: ['shuriken', 'flashstep', 'kage'],
};
R.SLOT_COUNT = 4;   // 일반 스킬 슬롯 (+ 전직 후 궁극기 슬롯 1)
// 지금 배운 스킬 (레벨 도달 + 전직)
R.learnedSkills = (save) => {
  const c = R.CLASSES[save.cls];
  const base = c.skills.filter((id, i) => save.level >= R.SKILL_UNLOCK[i]);
  return save.adv ? [...base, ...R.ADV_SKILLS[save.adv], R.ADV_SKILL[save.adv]] : base;
};
R.skillUnlockLv = (save, id) => { const i = R.CLASSES[save.cls].skills.indexOf(id); return i >= 0 ? R.SKILL_UNLOCK[i] : 30; };
// 슬롯 정리: 없으면 만들고, 배운 스킬 중 빈 슬롯은 자동으로 채운다
R.ensureSlots = (save) => {
  if (!save.slots) {
    save.slots = [null, null, null, null];
    if (save.adv) save.slots = [...R.ADV_SKILLS[save.adv], R.CLASSES[save.cls].skills[0]];
  }
  const learned = R.learnedSkills(save).filter((id) => !R.SKILLS[id].ult);
  for (let i = 0; i < R.SLOT_COUNT; i++) if (!save.slots[i] || !learned.includes(save.slots[i])) save.slots[i] = null;   // 제자리에서 정리 (참조 유지)
  for (const id of learned) {
    if (save.slots.includes(id)) continue;
    const e = save.slots.indexOf(null);
    if (e < 0) break;
    save.slots[e] = id;
  }
  return save.slots;
};
// 전직: 새 스킬 3개 + 기존 스킬 1개(첫 슬롯에 있던 것)를 남긴다
R.advanceSlots = (save) => {
  const keep = (save.slots || []).find((id) => id && R.CLASSES[save.cls].skills.includes(id)) || R.CLASSES[save.cls].skills[0];
  save.slots = [...R.ADV_SKILLS[save.adv], keep];
};
R.ADV_SKILL = { GUARDIAN: 'bulwark', BERSERKER: 'bloodrage', SNIPER: 'deadeye', TRAPPER: 'snare', ARCHMAGE: 'meteor', WARLOCK: 'hex', ASSASSIN2: 'execute', NINJA: 'clones' };
// 스킬 버튼 5칸: 슬롯 4개 + 궁극기 (비어 있으면 null)
R.skillIds = (save) => [...R.ensureSlots(save), save.adv ? R.ADV_SKILL[save.adv] : null];

// ─── 장비 ───────────────────────────────────────────────
R.SLOTS = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'cape', 'ring', 'necklace', 'earring', 'belt'];
R.SLOT_NAME = { weapon: '무기', helmet: '머리', armor: '갑옷', gloves: '장갑', boots: '신발', ring: '반지', necklace: '목걸이', earring: '귀걸이', cape: '망토', belt: '허리띠' };
R.SLOT_ICON = { weapon: '⚔️', helmet: '⛑️', armor: '🛡️', gloves: '🧤', boots: '👢', ring: '💍', necklace: '📿', earring: '✨', cape: '🧣', belt: '🎗️' };
R.WEAPON_ICON = { sword: '⚔️', bow: '🏹', staff: '🪄', dagger: '🗡️' };
R.GRADES = [
  { name: '일반', color: '#e6e6e6', rate: 0.55 },
  { name: '고급', color: '#5fd35f', rate: 0.30 },
  { name: '희귀', color: '#4f9bff', rate: 0.12 },
  { name: '영웅', color: '#b56bff', rate: 0.025 },
  { name: '전설', color: '#ff9a2e', rate: 0.005 },
];
R.ITEM_NAMES = {
  sword:    ['낡은 철검', '기사검', '광부의 대검', '서리 장검', '공허의 검'],
  bow:      ['사냥 활', '망자의 장궁', '용암 각궁', '서리 활', '마계 장궁'],
  staff:    ['견습 지팡이', '성직자의 지팡이', '용암 지팡이', '얼음 홀', '공허의 지팡이'],
  dagger:   ['녹슨 단검', '망자의 단검', '광석 단검', '빙결 단검', '그림자 단검'],
  helmet:   ['가죽 두건', '폐허의 투구', '광부 헬멧', '서리 투구', '마족 투구'],
  armor:    ['누비 갑옷', '폐허의 갑옷', '철판 갑옷', '서리 판금', '마족 갑주'],
  gloves:   ['가죽 장갑', '기사 건틀릿', '광부 장갑', '서리 장갑', '마족 건틀릿'],
  boots:    ['가죽 신발', '폐허의 장화', '강철 장화', '서리 장화', '마족 장화'],
  ring:     ['구리 반지', '망령의 반지', '루비 반지', '서리 반지', '공허의 반지'],
  necklace: ['나무 목걸이', '성직자의 목걸이', '용암석 목걸이', '빙정 목걸이', '공허의 목걸이'],
  earring:  ['돌 귀걸이', '은 귀걸이', '화염 귀걸이', '서리 귀걸이', '심연 귀걸이'],
};
// ─── 장비 종류 (부위마다 3가지) ─────────────────────────────
// atk/def: 기본 수치 배율, innate: 고유 옵션 [키, 기본값, 레벨당] (퍼센트 옵션은 레벨 무관)
// 첫 번째가 기본형 (이름은 ITEM_NAMES), 나머지는 "티어 접두어 + 이름"
R.TIER_WORD = ['낡은', '기사의', '용암', '서리', '공허의'];
R.ITEM_VARIANTS = {
  sword: [{ id: 'sword', name: '한손검' }, { id: 'greatsword', name: '대검', atk: 1.28, innate: [['atkSpd', -12]] }, { id: 'axe', name: '전투도끼', atk: 1.12, innate: [['crit', 4]] }],
  bow: [{ id: 'bow', name: '장궁' }, { id: 'crossbow', name: '석궁', atk: 1.28, innate: [['atkSpd', -12]] }, { id: 'shortbow', name: '단궁', atk: 0.9, innate: [['atkSpd', 14]] }],
  staff: [{ id: 'staff', name: '지팡이' }, { id: 'orb', name: '마력 오브', atk: 0.92, innate: [['elemDmg', 12]] }, { id: 'rod', name: '원소봉', atk: 1.05, innate: [['mp', 20, 3]] }],
  dagger: [{ id: 'dagger', name: '쌍단검' }, { id: 'katar', name: '카타르', atk: 1.15, innate: [['crit', 3]] }, { id: 'claw', name: '클로', atk: 0.9, innate: [['atkSpd', 15]] }],
  helmet: [{ id: 'helmet', name: '투구', def: 1.3, innate: [['hp', 20, 4]] }, { id: 'hood', name: '두건', def: 0.85, innate: [['luk', 1, 0.2]] }, { id: 'circlet', name: '서클릿', def: 0.75, innate: [['int', 1, 0.25]] }],
  armor: [{ id: 'armor', name: '판금 갑옷', def: 1.3, innate: [['hp', 40, 8]] }, { id: 'leather', name: '가죽 갑옷', def: 1, innate: [['moveSpd', 3]] }, { id: 'robe', name: '로브', def: 0.75, innate: [['mp', 20, 3]] }],
  gloves: [{ id: 'gloves', name: '건틀릿', def: 1.2, innate: [['str', 1, 0.25]] }, { id: 'lgloves', name: '가죽 장갑', def: 0.9, innate: [['atkSpd', 4]] }, { id: 'mgloves', name: '마법 장갑', def: 0.8, innate: [['int', 1, 0.25]] }],
  boots: [{ id: 'boots', name: '철장화', def: 1.25, innate: [['vit', 1, 0.25]] }, { id: 'lboots', name: '가죽 장화', def: 0.9, innate: [['moveSpd', 4]] }, { id: 'mboots', name: '마법 신발', def: 0.8, innate: [['mp', 10, 2]] }],
  cape: [{ id: 'cape', name: '망토', def: 1, innate: [['luk', 1, 0.2]] }, { id: 'coat', name: '외투', def: 1.3, innate: [['hp', 20, 5]] }, { id: 'wingcape', name: '날개 망토', def: 0.8, innate: [['moveSpd', 5]] }],
  belt: [{ id: 'belt', name: '허리띠', def: 1, innate: [['hp', 20, 5]] }, { id: 'sash', name: '복대', def: 0.9, innate: [['vit', 1, 0.25]] }, { id: 'warbelt', name: '전사의 허리띠', def: 1.1, innate: [['atkPct', 3]] }],
  ring: [{ id: 'ring', name: '반지', innate: [['atkPct', 3]] }, { id: 'signet', name: '인장 반지', innate: [['crit', 3]] }, { id: 'band', name: '밴드', innate: [['hp', 30, 6]] }],
  necklace: [{ id: 'necklace', name: '목걸이', innate: [['hp', 30, 6]] }, { id: 'pendant', name: '펜던트', innate: [['mp', 20, 3]] }, { id: 'amulet', name: '부적', innate: [['elemDmg', 8]] }],
  earring: [{ id: 'earring', name: '귀걸이', innate: [['luk', 1, 0.25]] }, { id: 'piercing', name: '피어싱', innate: [['dex', 1, 0.25]] }, { id: 'cuff', name: '이어커프', innate: [['crit', 2]] }],
};
R.ITEM_NAMES.cape = ['해진 망토', '기사단 망토', '화염 망토', '서리 망토', '공허의 망토'];
R.ITEM_NAMES.belt = ['가죽 허리띠', '기사의 허리띠', '용암 허리띠', '서리 허리띠', '공허의 허리띠'];
R.variantOf = (id) => { for (const b in R.ITEM_VARIANTS) { const v = R.ITEM_VARIANTS[b].find((x) => x.id === id); if (v) return Object.assign({ base: b }, v); } return null; };
// 전설 효과 (전설 등급 장비의 60%에 붙는다)
R.LEGENDS = {
  vamp: { name: '흡혈', desc: '준 피해의 3%만큼 HP 회복' },
  ember: { name: '업화', desc: '적중 시 15% 확률로 화상' },
  mana: { name: '마나 순환', desc: '적중 시 최대 MP의 1% 회복' },
  critheal: { name: '치유의 일격', desc: '치명타 시 최대 HP의 1.5% 회복' },
  laststand: { name: '불굴', desc: 'HP 30% 이하일 때 받는 피해 -30%' },
  swift: { name: '질풍', desc: '이동속도 +8%, 회피 쿨타임 -20%' },
  slayer: { name: '보스 사냥꾼', desc: '보스에게 주는 피해 +15%' },
  chain: { name: '연쇄', desc: '스킬 연계 단계마다 피해 +8% 추가' },
  fortune: { name: '황금손', desc: '골드 획득 +30%' },
  regen: { name: '재생', desc: '초당 최대 HP의 0.6% 회복' },
};
R.ELEM_PREFIX = { FIRE: '불꽃의', ICE: '서리의', THUNDER: '뇌전의', NATURE: '맹독의', DARK: '심연의' };
// 장비 옵션: key → 이름, 기본값 계산(ilvl), 퍼센트 여부
R.OPTIONS = {
  str:    { name: 'STR',       roll: (l) => 1 + l * 0.35 },
  dex:    { name: 'DEX',       roll: (l) => 1 + l * 0.35 },
  int:    { name: 'INT',       roll: (l) => 1 + l * 0.35 },
  vit:    { name: 'VIT',       roll: (l) => 1 + l * 0.35 },
  luk:    { name: 'LUK',       roll: (l) => 1 + l * 0.35 },
  hp:     { name: '최대 HP',   roll: (l) => 15 + l * 8 },
  mp:     { name: '최대 MP',   roll: (l) => 8 + l * 3 },
  crit:   { name: '치명타',    roll: () => 1 + Math.random() * 4, pct: true },
  atkPct: { name: '공격력',    roll: () => 2 + Math.random() * 6, pct: true },
  elemDmg:{ name: '속성 피해', roll: () => 5 + Math.random() * 10, pct: true },
  moveSpd:{ name: '이동속도',  roll: () => 2 + Math.random() * 4, pct: true },
  atkSpd: { name: '공격속도',  roll: () => 2 + Math.random() * 4, pct: true },
};
// 대장간 안전 강화 (실패해도 단계 하락/파괴 없음)
R.ENHANCE_RATE = [1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]; // index = 현재 강화 단계
R.enhanceMat = (enh) => (enh < 3 ? 'iron' : enh < 7 ? 'stone' : 'hstone');
R.enhanceMatCount = (enh) => (enh < 3 ? enh + 1 : enh < 7 ? enh - 2 : enh - 6);
R.enhanceGold = (item) => Math.round(30 * (item.enh + 1) * (1 + item.ilvl * 0.1));
R.MATERIALS = {
  iron:   { name: '철 조각',     icon: '🔩', price: 30 },
  stone:  { name: '강화석',      icon: '💎', price: 180 },
  hstone: { name: '고급 강화석', icon: '🔷', price: 900 },
};
R.CONSUMABLES = {
  hpPotion: { name: '빨간 물약', icon: '🧪', price: 30, desc: '최대 HP의 30% + 30 회복 (재사용 2.5초)' },
  mpPotion: { name: '파란 물약', icon: '💧', price: 30, desc: '최대 MP의 35% + 15 회복 (재사용 2.5초)' },
  reviveStone: { name: '부활석', icon: '🪨', price: 400, desc: '쓰러진 자리에서 즉시 부활' },
};

// ─── 몬스터 ─────────────────────────────────────────────
// 실제 스탯 = 레벨 기반 공식 × 배율. ai: melee / charger / ranged / hover
R.monsterStats = (m, lv) => ({
  maxHp: Math.round((70 + lv * 32) * (1 + lv * 0.03) * (m.hp || 1)),
  atk: Math.round((18 + lv * 9) * (1 + lv * 0.05) * (m.atk || 1)),
  def: Math.round(lv * 2.5 * (m.def || 1)),
  exp: Math.round((12 + lv * 6) * (1 + lv * 0.03) * (1 + lv * 0.02) * (m.exp || 1)),   // 후반 지역은 레벨 폭이 넓어 경험치를 더 준다
  gold: Math.round((4 + lv * 2.5) * (m.gold || 1)),
});
const H = (o) => Object.assign({ arch: 'human' }, o);
R.MONSTERS = {
  // 1지역 : 잊혀진 숲
  slime:    { name: '슬라임', arch: 'blob', elem: 'NATURE', pal: ['#59c94a', '#2d7f2a', '#b8f59a'], hp: 0.85, atk: 0.8, def: 0.5, spd: 24, ai: 'melee', r: 6, danger: 1, desc: '숲 어디에나 있는 끈적한 생명체. 느리지만 떼로 몰려다닌다.' },
  goblin:   H({ name: '고블린', elem: 'NATURE', look: { skin: '#79b63a', hair: '#3a5a1a', body: '#7a5a3a', bodyD: '#5a3e24', legs: '#4a3a2a', boots: '#2a2018', hat: 'none', ears: true, eye: '#ffdd33' }, hp: 1, atk: 1, spd: 34, ai: 'melee', r: 6, danger: 1, desc: '몽둥이를 휘두르는 교활한 소인족.' }),
  mushroom: { name: '버섯', arch: 'mushroom', elem: 'NATURE', pal: ['#d8423a', '#8a2320', '#f3e6d0'], hp: 0.9, atk: 0.9, spd: 16, ai: 'ranged', shot: 'spore', r: 6, danger: 1, desc: '독포자를 날리는 걸어다니는 버섯. 포자에 맞으면 중독된다.' },
  wolf:     { name: '늑대', arch: 'quad', elem: 'NATURE', pal: ['#9aa0a8', '#5f646c', '#d6dade'], hp: 1.1, atk: 1.15, spd: 44, ai: 'charger', r: 7, danger: 2, desc: '거리를 좁혀 순식간에 덮쳐오는 숲의 사냥꾼.' },
  spider:   { name: '독거미', arch: 'spider', elem: 'NATURE', pal: ['#3a2a3a', '#1e141e', '#d23a3a'], hp: 0.95, atk: 1.1, spd: 38, ai: 'melee', poison: true, r: 7, danger: 2, desc: '물리면 중독된다. 빠르게 기어 다닌다.' },
  // 2지역 : 폐허 도시
  skeleton: H({ name: '해골병사', elem: 'DARK', look: { skin: '#e8e4d4', hair: '#e8e4d4', body: '#cfcab8', bodyD: '#9a9684', legs: '#cfcab8', boots: '#9a9684', hat: 'none', skull: true, eye: '#ff3a3a' }, hp: 1.05, atk: 1, def: 1.2, spd: 30, ai: 'melee', r: 6, danger: 2, desc: '녹슨 검을 든 망자의 병사. 뼈라서 단단하다.' }),
  ghost:    { name: '망령', arch: 'ghost', elem: 'DARK', pal: ['#bfe8ff', '#7fb4d8', '#ffffff'], hp: 0.8, atk: 1.1, spd: 30, ai: 'hover', r: 6, danger: 2, desc: '폐허를 떠도는 원혼. 불규칙하게 날아다닌다.' },
  bandit:   H({ name: '도적', elem: 'NONE', look: { skin: '#d8a070', hair: '#2a1a10', body: '#8a4a2a', bodyD: '#5e301a', legs: '#4a3020', boots: '#2a1a10', hat: 'bandana', hatC: '#c02a2a' }, hp: 1, atk: 1.1, spd: 40, ai: 'ranged', shot: 'knife', r: 6, danger: 2, desc: '단검을 던지는 폐허의 약탈자.' }),
  gargoyle: { name: '가고일', arch: 'flyer', elem: 'DARK', pal: ['#6a6a7a', '#3e3e4a', '#ff4a3a'], big: true, hp: 1.3, atk: 1.15, def: 1.5, spd: 34, ai: 'charger', r: 8, danger: 3, desc: '석상인 척하다 급강하하는 날개 달린 괴물.' },
  // 3지역 : 용암 광산
  mine_goblin: H({ name: '광산 고블린', elem: 'FIRE', look: { skin: '#79b63a', hair: '#3a5a1a', body: '#8a6a3a', bodyD: '#5e4424', legs: '#4a3a2a', boots: '#2a2018', hat: 'minehelm', hatC: '#e0b030', ears: true, eye: '#ffdd33' }, hp: 1, atk: 1.05, spd: 36, ai: 'ranged', shot: 'bomb', r: 6, danger: 2, desc: '폭탄을 던지는 광부 고블린. 폭발은 화상을 남긴다.' }),
  golem:    { name: '골렘', arch: 'golem', elem: 'NATURE', pal: ['#8a5a3a', '#5a3a24', '#c08a5a'], hp: 1.8, atk: 1.2, def: 2, spd: 20, ai: 'melee', r: 9, danger: 3, desc: '광맥이 뭉쳐 태어난 바위 거인. 느리지만 강하다.' },
  bat:      { name: '박쥐', arch: 'flyer', elem: 'DARK', pal: ['#5a3a7a', '#2e1e44', '#ff5a5a'], hp: 0.7, atk: 0.9, spd: 52, ai: 'hover', r: 5, danger: 1, desc: '어둠 속에서 몰려드는 흡혈 박쥐.' },
  lava_worm:{ name: '용암벌레', arch: 'worm', elem: 'FIRE', pal: ['#e0501e', '#8a2a10', '#ffd040'], hp: 1.2, atk: 1.15, spd: 26, ai: 'ranged', shot: 'fireball', burn: true, r: 7, danger: 3, desc: '용암을 뱉는 거대 벌레. 화상에 주의.' },
  // 4지역 : 얼어붙은 성
  ice_wolf: { name: '얼음늑대', arch: 'quad', elem: 'ICE', pal: ['#bfe6ff', '#6fa8d8', '#ffffff'], hp: 1.15, atk: 1.2, spd: 48, ai: 'charger', slow: true, r: 7, danger: 3, desc: '냉기를 두른 늑대. 물리면 몸이 얼어붙는다.' },
  frost_mage: H({ name: '서리마법사', elem: 'ICE', look: { skin: '#9fd8ff', hair: '#e8f6ff', body: '#3a7ab8', bodyD: '#24568a', legs: '#24568a', boots: '#1a3a5a', hat: 'hood', hatC: '#5a9ad8', eye: '#ffffff' }, hp: 0.9, atk: 1.25, spd: 28, ai: 'ranged', shot: 'ice', slow: true, r: 6, danger: 3, desc: '얼음 화살을 쏘는 성의 마법사.' }),
  ice_knight: H({ name: '얼음기사', elem: 'ICE', look: { skin: '#bfe6ff', hair: '#bfe6ff', body: '#8fc6f0', bodyD: '#5a94c8', legs: '#5a94c8', boots: '#3a6a9a', hat: 'helm', hatC: '#d8f0ff', shield: true }, hp: 1.6, atk: 1.2, def: 2, spd: 28, ai: 'melee', r: 7, danger: 3, desc: '얼음으로 된 갑옷을 입은 기사. 방어가 단단하다.' }),
  // 5지역 : 마계의 문
  demon:    H({ name: '악마', elem: 'FIRE', look: { skin: '#d23a2a', hair: '#5a1010', body: '#a02a1e', bodyD: '#6a1a12', legs: '#6a1a12', boots: '#2a0a08', hat: 'horns', hatC: '#2a1a1a', wings: '#7a1a14', eye: '#ffe040' }, hp: 1.3, atk: 1.25, spd: 36, ai: 'melee', burn: true, r: 7, danger: 4, desc: '마계의 불꽃을 두른 하급 악마.' }),
  fallen_angel: H({ name: '타락천사', elem: 'DARK', look: { skin: '#f0d0c0', hair: '#f0d860', body: '#6a4a7a', bodyD: '#4a2e5a', legs: '#4a2e5a', boots: '#2a1a30', hat: 'halo', wings: '#3a2a4a', eye: '#b27bff' }, hp: 1.1, atk: 1.3, spd: 34, ai: 'ranged', shot: 'dark', r: 6, danger: 4, desc: '검게 물든 날개의 천사. 암흑 구체를 날린다.' }),
  hellhound:{ name: '지옥견', arch: 'quad', elem: 'FIRE', pal: ['#8a3a2a', '#4a1a12', '#ffb030'], hp: 1.25, atk: 1.3, spd: 50, ai: 'charger', burn: true, r: 7, danger: 4, desc: '불꽃을 뿜으며 돌진하는 마계의 사냥개.' },
  demon_knight: H({ name: '마족기사', elem: 'DARK', look: { skin: '#4a3a4a', hair: '#1a1a1a', body: '#3a2a3a', bodyD: '#1e141e', legs: '#1e141e', boots: '#0e0a0e', hat: 'helm', hatC: '#4a3a4a', shield: true, eye: '#ff3a3a' }, hp: 1.8, atk: 1.3, def: 2.2, spd: 30, ai: 'melee', r: 7, danger: 4, desc: '공허의 왕을 지키는 흑철의 기사.' }),
  // 특별한 몬스터 (던전 이벤트로 등장)
  gold_goblin: H({ name: '황금 고블린', elem: 'NATURE', sprite: 'goblin', tint: 'gold', special: true, treasure: true, look: { skin: '#e8c040', hair: '#8a6a10', body: '#c8a030', bodyD: '#8a6a10', legs: '#6a5010', boots: '#3a2a08', hat: 'none', ears: true, eye: '#ffffff' }, hp: 1.6, atk: 0.01, def: 1, spd: 44, ai: 'flee', r: 6, danger: 1, desc: '보물 자루를 짊어지고 도망치는 고블린. 때릴 때마다 금화를 흘리고, 잡으면 대박. 14초 안에 못 잡으면 사라진다!' }),
  mimic:    { name: '미믹', arch: 'mimic', elem: 'DARK', special: true, pal: ['#a8642a', '#6a3a18', '#ffd35a'], hp: 2.2, atk: 1.25, def: 1.2, spd: 36, ai: 'charger', r: 7, danger: 3, desc: '보물 상자인 척하는 괴물. 가끔 몸을 들썩인다. 쓰러뜨리면 삼킨 보물을 토해낸다.' },
};

// 보스 — phases: 체력 비율에 따라 사용하는 패턴이 늘어난다
R.BOSSES = {
  forest_beast: { name: '숲의 거수', arch: 'golem', elem: 'NATURE', pal: ['#4a7a2a', '#2a4a18', '#8ac04a'], hp: 14, atk: 1.4, def: 1.5, spd: 30, r: 14, scale: 2,
    phases: [{ at: 1, moves: ['slam'] }, { at: 0.7, moves: ['slam', 'charge'] }, { at: 0.4, moves: ['slam', 'charge', 'quake'] }, { at: 0.2, moves: ['slam', 'charge', 'quake'], enrage: true }],
    desc: '숲을 지키던 고대의 수호수. 균열의 기운에 폭주했다.' },
  fallen_knight: { name: '타락한 기사', arch: 'human', elem: 'DARK', look: { skin: '#5a4a5a', hair: '#1a1a1a', body: '#4a3a4a', bodyD: '#2a1e2a', legs: '#2a1e2a', boots: '#1a121a', hat: 'helm', hatC: '#6a5a6a', shield: true, cape: '#8a1a1a', eye: '#ff3a3a' }, hp: 16, atk: 1.4, def: 1.6, spd: 38, r: 10, scale: 2,
    phases: [{ at: 1, moves: ['slam', 'wave'] }, { at: 0.6, moves: ['slam', 'wave', 'charge'] }, { at: 0.3, moves: ['slam', 'wave', 'charge'], enrage: true }],
    desc: '폐허 도시를 지키던 기사단장. 망자가 되어서도 검을 놓지 않았다.' },
  iron_golem: { name: '철의 골렘', arch: 'golem', elem: 'FIRE', pal: ['#7a7e88', '#4a4e58', '#ff7a33'], hp: 18, atk: 1.45, def: 2.2, spd: 24, r: 14, scale: 2,
    phases: [{ at: 1, moves: ['slam', 'rocks'] }, { at: 0.6, moves: ['slam', 'rocks', 'quake'] }, { at: 0.25, moves: ['slam', 'rocks', 'quake'], enrage: true }],
    desc: '광산 깊은 곳 용암으로 달궈진 강철 거인.' },
  ice_king: { name: '빙결왕', arch: 'human', elem: 'ICE', look: { skin: '#bfe6ff', hair: '#e8f6ff', body: '#6fb0e8', bodyD: '#3a7ab8', legs: '#3a7ab8', boots: '#24568a', hat: 'crown', hatC: '#e8f6ff', cape: '#d8f0ff', eye: '#ffffff' }, hp: 18, atk: 1.5, def: 1.8, spd: 30, r: 10, scale: 2,
    phases: [{ at: 1, moves: ['ring', 'slam'] }, { at: 0.6, moves: ['ring', 'slam', 'quake'] }, { at: 0.3, moves: ['ring', 'slam', 'quake', 'wave'], enrage: true }],
    desc: '얼어붙은 성의 주인. 한때는 인자한 왕이었다.' },
  void_king: { name: '공허의 왕', arch: 'ghost', elem: 'DARK', pal: ['#5a2a8a', '#2a1244', '#ff4aff'], hp: 22, atk: 1.6, def: 2, spd: 34, r: 14, scale: 2.5,
    phases: [{ at: 1, moves: ['ring', 'charge'] }, { at: 0.7, moves: ['ring', 'charge', 'quake'], summon: true }, { at: 0.35, moves: ['ring', 'charge', 'quake', 'wave'], summon: true, enrage: true }],
    desc: '균열 너머에서 온 존재. 차원을 넘나들며 모습을 바꾼다.' },
};

// ─── 지역 ───────────────────────────────────────────────
R.REGIONS = [
  { id: 1, name: '잊혀진 숲',  lv: [1, 8],   theme: 'forest', gimmick: 'vine',   monsters: ['slime', 'goblin', 'mushroom', 'wolf', 'spider'], boss: 'forest_beast', bossLv: 9,  bgm: 0, gimmickText: '덩굴 장벽을 베어내고 열쇠를 찾아라' },
  { id: 2, name: '폐허 도시',  lv: [8, 15],  theme: 'ruins',  gimmick: 'switch', monsters: ['skeleton', 'ghost', 'bandit', 'gargoyle'], boss: 'fallen_knight', bossLv: 16, bgm: 1, gimmickText: '바닥 압력 스위치로 잠금을 해제하라' },
  { id: 3, name: '용암 광산',  lv: [15, 25], theme: 'mine',   gimmick: 'rocks',  monsters: ['mine_goblin', 'golem', 'bat', 'lava_worm'], boss: 'iron_golem', bossLv: 26, bgm: 2, cart: true, gimmickText: '낙석을 피하고, 레버로 광차를 보내 무너진 갱도를 뚫어라' },
  { id: 4, name: '얼어붙은 성', lv: [25, 35], theme: 'ice',   gimmick: 'ice',    monsters: ['ice_wolf', 'frost_mage', 'ice_knight'], boss: 'ice_king', bossLv: 36, bgm: 3, gimmickText: '미끄러운 빙판 위에서 관성을 제어하라' },
  { id: 5, name: '마계의 문',  lv: [35, 50], theme: 'hell',   gimmick: 'phase',  monsters: ['demon', 'fallen_angel', 'hellhound', 'demon_knight'], boss: 'void_king', bossLv: 50, bgm: 4, gimmickText: '공허의 왕은 차원을 넘나든다' },
];

// ─── 퀘스트 ─────────────────────────────────────────────
// type: kill (지역 내 몬스터 처치), boss (보스 처치), killType (특정 몬스터)
// 메인 퀘스트·서브 퀘스트는 js/story.js

// ─── 스토리 ─────────────────────────────────────────────
R.PROLOGUE = [
  '과거, 마법사들은 하늘의 힘을 인간에게 끌어내렸다.',
  '사람들은 그것을 「성좌전쟁」이라 불렀다.',
  '전쟁이 끝난 뒤, 세계 곳곳에 「균열」이 생겨났고\n균열에서 몬스터가 쏟아지기 시작했다.',
  '……그리고 지금.\n변방의 마을 루멘 외곽에서 한 사람이 발견된다.',
  '기억은 없다.\n손에는 정체불명의 무기 하나,\n몸에는 붉은 문양이 새겨져 있다.',
];
R.ENDINGS = {
  A: { title: 'ENDING A — 봉인', text: '당신은 문양의 힘을 모두 쏟아 균열을 닫았다.\n몬스터는 사라졌고, 루멘에는 평화가 찾아왔다.\n하지만 당신의 기억은 끝내 돌아오지 않았다.' },
  B: { title: 'ENDING B — 공존', text: '당신은 균열을 닫지 않기로 했다.\n하늘의 힘은 여전히 세계에 흐르고,\n사람들은 균열과 함께 살아가는 법을 배워 간다.\n당신은 그 경계를 지키는 파수꾼이 되었다.' },
  C: { title: 'ENDING C — 귀환', text: '당신은 자신이 균열을 만든 최초의 마도병기였음을 받아들였다.\n몸에 새겨진 문양이 빛으로 흩어지며 세계를 꿰맨다.\n루멘의 광장에는 이름 없는 영웅의 석상이 세워졌다.' },
};

// ─── 스킬 성장 (GDD 39·40) ───────────────────────────────
// 스킬 레벨 1~5: 레벨당 피해 +12%, Lv4 범위 +10%, Lv5 쿨타임 -20%. 레벨업 비용 = 현재 레벨 SP
R.SKILL_MAX = 5;
// ─── 자원 밸런스 ─────────────────────────────────────────
// 스킬 MP: 레벨에 따라 오른다 (Lv.30에서 약 2배). 연계 단계마다 -15%
R.skillCost = (sk, lv, chain = 0) => Math.max(1, Math.round(sk.mp * (1 + (lv - 1) * 0.035) * (1 - 0.15 * chain)));
R.REGEN = {
  townHp: 0.1, townMp: 0.1,          // 마을: 초당 최대치의 10%
  hp: 0.003, hpRest: 0.015,          // 던전: 전투 중 0.3%/s, 5초간 교전이 없으면 1.5%/s
  mp: 0.01, mpRest: 0.025,           // MP도 같은 방식
  restDelay: 5,
  mpOnHit: 0.05,                     // 기본 공격 적중 시 최대 MP의 4% (공격 → 스킬 순환)
};
// 몬스터 레벨 색 (바람의나라:연처럼 나보다 약하면 회색, 강할수록 노랑·빨강)
R.levelColor = (gap) => (gap <= -5 ? '#9a9aa4' : gap <= 2 ? '#ffffff' : gap <= 5 ? '#ffe070' : '#ff6a5a');
R.BOSS_HP_MUL = 2.0;             // 보스전 30~90초 목표 (밸런스 시뮬레이션 기준)

// ─── 던전 이벤트 ────────────────────────────────────────
// 입장할 때마다 새로 굴린다: 보너스 상자(일부는 미믹), 축복의 제단, 황금 고블린
R.DUNGEON_EVENTS = { bonusChests: [1, 2], mimicChance: 0.22, shrineChance: 0.55, goblinChance: 0.18, goblinEscape: 14 };
// 축복의 제단: 만지면 60초 버프 (mods 는 스킬 버프와 같은 키 + exp/gold/drop/vamp)
R.SHRINES = [
  { id: 'fury',    name: '분노의 제단', icon: '🔥', color: '#ff6a4a', mods: { atk: 0.3 },               desc: '공격력 +30%' },
  { id: 'guard',   name: '수호의 제단', icon: '🛡', color: '#7ac8ff', mods: { dmgTaken: -0.3 },         desc: '받는 피해 -30%' },
  { id: 'gale',    name: '질풍의 제단', icon: '🌪', color: '#7affc8', mods: { move: 0.35, crit: 0.1 },  desc: '이동속도 +35%, 치명타 +10%' },
  { id: 'fortune', name: '행운의 제단', icon: '🍀', color: '#ffd35a', mods: { gold: 1, drop: 1 },       desc: '골드·장비 드랍 2배' },
  { id: 'wisdom',  name: '지혜의 제단', icon: '📘', color: '#b79bff', mods: { exp: 0.5 },               desc: '경험치 +50%' },
  { id: 'blood',   name: '피의 제단',   icon: '🩸', color: '#ff4a6a', mods: { vamp: 0.05 },             desc: '준 피해의 5% 흡혈' },
];
R.SHRINE_DUR = 60;
// 연속 처치: 4초 안에 다음 적을 쓰러뜨리면 이어진다. 1킬마다 경험치 +1% (최대 +30%), 25킬마다 피버 타임
R.STREAK = { window: 4, expPer: 0.01, expMax: 0.3, fever: 25, feverDur: 10, feverMods: { atk: 0.3, move: 0.2, crit: 0.1, mpFree: 1 } };
R.POTION = { hp: 0.3, hpFlat: 30, mp: 0.35, mpFlat: 15, cd: 2.5 };
R.potionPrice = (k, lv) => Math.round(R.CONSUMABLES[k].price * (1 + (lv - 1) * 0.06));
// 스킬 연계: 스킬이 끝난 뒤 1.6초 안에 "다른" 스킬을 쓰면 연계 단계 +1 (최대 3)
//  단계마다 피해 +20%, MP -15%. 3타 콤보 마무리 직후 스킬은 "콤보 연계"로 1단계부터 시작
R.LINK = { window: 1.6, max: 3, dmg: 0.2, finisher: 0.9, finisherBonus: 0.1, cancelAt: 0.55 };
R.skillLevelMod = (lv) => ({ dmg: 1 + 0.12 * (lv - 1), aoe: lv >= 4 ? 1.1 : 1, cdMul: lv >= 5 ? 0.8 : 1 });
// 룬: 스킬당 3종 중 1개 장착. 던전 코인으로 해금
R.RUNE_COST = 30;
R.RUNES = {
  charge:      [{ name: '돌풍', desc: '돌진 거리 +40%', mod: { dist: 1.4 } }, { name: '충격', desc: '기절 시간 +0.8초', mod: { stunAdd: 0.8 } }, { name: '분쇄', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  whirl:       [{ name: '폭풍', desc: '범위 +30%', mod: { aoe: 1.3 } }, { name: '출혈', desc: '적중 시 출혈(지속 피해)', mod: { status: { poison: 4 } } }, { name: '강철', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  multishot:   [{ name: '산탄', desc: '화살 +2발', mod: { extra: 2 } }, { name: '마비', desc: '적중 시 둔화', mod: { status: { slow: 2 } } }, { name: '정밀', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  pierce:      [{ name: '연쇄', desc: '번개 화살 +1발', mod: { extra: 1 } }, { name: '과부하', desc: '기절 +0.6초', mod: { stunAdd: 0.6 } }, { name: '고압', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  fireball:    [{ name: '대폭발', desc: '폭발 범위 +30%', mod: { aoe: 1.3 } }, { name: '업화', desc: '화상 지속 +3초·강화', mod: { status: { burn: 6 } } }, { name: '압축', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  icelance:    [{ name: '삼지창', desc: '얼음창 3갈래', mod: { extra: 2 } }, { name: '절대영도', desc: '빙결 5초 + 기절 0.5초', mod: { status: { slow: 5, stun: 0.5 } } }, { name: '예리', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  shadowstep:  [{ name: '연속 암습', desc: '쿨타임 -40%', mod: { cdMul: 0.6 } }, { name: '독 묻은 칼', desc: '적중 시 중독', mod: { status: { poison: 5 } } }, { name: '처형', desc: '피해 +25%', mod: { dmg: 1.25 } }],
  poisonblade: [{ name: '난무', desc: '타수 +3', mod: { extra: 3 } }, { name: '맹독', desc: '중독 강화', mod: { status: { poison: 7 } } }, { name: '예리', desc: '피해 +25%', mod: { dmg: 1.25 } }],
};

// ─── 재화 (GDD 29) ───────────────────────────────────────
// 보석: 플레이로만 획득 (실제 결제 없음). 던전 코인: 던전 파밍 전용 (룬 해금)
R.CURRENCY = {
  gold: { name: '골드', icon: '💰' },
  gems: { name: '보석', icon: '💎' },
  coins: { name: '던전 코인', icon: '🪙' },
  honor: { name: '명예 메달', icon: '🏅' },
};

// ─── 장비 소환 (GDD 30~33) ───────────────────────────────
R.SUMMON = { cost1: 100, cost10: 900, pity: 80, rates: [0.55, 0.30, 0.12, 0.025, 0.005] };

// ─── 장비 세트 (GDD 69) ──────────────────────────────────
// 방어구·장신구 6부위(투구·갑옷·장갑·신발·반지·목걸이)에 붙는다. 지역 티어별 1세트
R.SET_SLOTS = ['helmet', 'armor', 'gloves', 'boots', 'ring', 'necklace'];
R.SETS = [
  { id: 'warden', name: '숲지기', color: '#7ad85a', bonus: { 2: { hpPct: 0.1 }, 4: { movePct: 0.08 }, 6: { atkPct: 0.15 } } },
  { id: 'knight', name: '기사', color: '#9ab4ff', bonus: { 2: { defPct: 0.1 }, 4: { hpPct: 0.15 }, 6: { skillPct: 0.3 } } },
  { id: 'magma', name: '용암', color: '#ff8a4a', bonus: { 2: { atkPct: 0.08 }, 4: { elemDmg: 0.2 }, 6: { crit: 0.1 } } },
  { id: 'frost', name: '서리', color: '#8ad8ff', bonus: { 2: { defPct: 0.12 }, 4: { hpPct: 0.2 }, 6: { dmgTaken: -0.15 } } },
  { id: 'void', name: '공허', color: '#c890ff', bonus: { 2: { atkPct: 0.12 }, 4: { critDmg: 0.4 }, 6: { skillPct: 0.4 } } },
];
R.MOD_TEXT = {
  hpPct: (v) => `최대 HP +${Math.round(v * 100)}%`, defPct: (v) => `방어력 +${Math.round(v * 100)}%`, atkPct: (v) => `공격력 +${Math.round(v * 100)}%`,
  movePct: (v) => `이동속도 +${Math.round(v * 100)}%`, skillPct: (v) => `스킬 피해 +${Math.round(v * 100)}%`, elemDmg: (v) => `속성 피해 +${Math.round(v * 100)}%`,
  crit: (v) => `치명타 +${Math.round(v * 100)}%`, critDmg: (v) => `치명타 피해 +${Math.round(v * 100)}%`, dmgTaken: (v) => `받는 피해 ${Math.round(v * 100)}%`,
};

// ─── 장비 도감 (GDD 34) ──────────────────────────────────
// 5종 수집마다 공격력 +1%, 최대 HP +1%
R.DEX_STEP = 8;   // 장비 종류가 늘어서 (약 150종) 8종마다 +1%

// ─── 펫 (GDD 49) — 디자인 시트 몬스터의 꼬마 버전. 전투력보다 보조 기능 ─────
R.PETS = [
  { id: 'slime', name: '말랑이', desc: '초당 최대 HP 0.5% 재생', mod: { regenPct: 0.005 }, price: { gold: 1500 } },
  { id: 'mushroom', name: '포자', desc: '물약 회복량 +30%', mod: { potPct: 0.3 }, price: { honor: 2 } },
  { id: 'wolf', name: '아기 늑대', desc: '이동속도 +6%', mod: { movePct: 0.06 }, price: { gems: 300 } },
  { id: 'bat', name: '비비', desc: '아이템을 멀리서도 끌어모음 (줍기 범위 ×2.2)', mod: { pickMul: 2.2 }, price: { gold: 4000 } },
  { id: 'ghost', name: '꼬마 망령', desc: '장비 드랍률 +15%', mod: { dropPct: 0.15 }, price: { gems: 600 } },
  { id: 'hellhound', name: '아기 지옥견', desc: '골드 획득 +20%', mod: { goldPct: 0.2 }, price: { honor: 5 } },
];

// ─── 채집 & 제작 (GDD 50) ─────────────────────────────────
R.GATHER = {
  herb: { name: '약초', icon: '🌿' },
  ore: { name: '광석', icon: '🪨' },
  shroom: { name: '야생 버섯', icon: '🍄' },
};
R.GATHER_BY_THEME = { forest: ['herb', 'shroom'], ruins: ['herb', 'ore'], mine: ['ore', 'ore', 'shroom'], ice: ['ore', 'herb'], hell: ['ore', 'shroom'] };
R.FOODS = {
  feast: { name: '모험가 도시락', icon: '🍱', desc: '5분간 공격력·방어력 +10%', dur: 300, mod: { atkPct: 0.1, defPct: 0.1 } },
};
R.RECIPES = [
  { out: 'hpPotion', n: 2, need: { herb: 2 } },
  { out: 'mpPotion', n: 2, need: { shroom: 2 } },
  { out: 'feast', n: 1, need: { herb: 2, shroom: 2 } },
  { out: 'stone', n: 1, need: { ore: 4, iron: 2 } },
  { out: 'hstone', n: 1, need: { ore: 10, stone: 2 } },
  { out: 'reviveStone', n: 1, need: { ore: 6, herb: 4, shroom: 4 } },
];

// ─── NPC 호감도 (GDD 66) — 선물(약초 3)로 오르고 3 이상이면 혜택 ──────
R.GIFT_COST = { herb: 3 };
R.FAVOR_PERKS = {
  elder: '호감도 3: 부활석 2개 선물 (1회)',
  smith: '호감도 3: 강화 비용 -20%',
  alchemist: '호감도 3: 상점 가격 -20%',
  bard: '호감도 3: 숨겨진 던전의 단서',
};

// ─── 숨겨진 던전 (GDD 68) — 용암 광산 클리어 + 음유시인 호감도 3 ──────
R.BOSSES.obsidian_golem = { name: '흑요석 골렘', arch: 'golem', sprite: 'golem', spriteScale: 1.75, elem: 'DARK', pal: ['#3a2a44', '#1a1224', '#b27bff'], hp: 20, atk: 1.55, def: 2.4, spd: 26, r: 14, scale: 2,
  phases: [{ at: 1, moves: ['slam', 'rocks'] }, { at: 0.6, moves: ['slam', 'rocks', 'quake', 'ring'] }, { at: 0.3, moves: ['slam', 'rocks', 'quake', 'ring'], enrage: true }],
  desc: '검은 광산의 가장 깊은 곳, 균열의 어둠을 삼킨 바위 거인.' };
R.HIDDEN_REGION = { id: 6, name: '검은 광산', lv: [30, 40], theme: 'mine', gimmick: 'rocks', monsters: ['golem', 'bat', 'lava_worm', 'mine_goblin', 'demon_knight'], boss: 'obsidian_golem', bossLv: 42, bgm: 2, hidden: true, gimmickText: '빛이 닿지 않는 폐광. 낙석과 어둠을 조심하라' };
R.regionById = (id) => (id === 6 ? R.HIDDEN_REGION : R.REGIONS[id - 1]);

// ─── 난이도 (GDD 71) ─────────────────────────────────────
R.DIFFICULTY = [
  { id: 'normal', name: '일반', lv: 0, hp: 1, atk: 1, exp: 1, drop: 0, color: '#a8e0a0' },
  { id: 'hard', name: '어려움', lv: 12, hp: 1.5, atk: 1.35, exp: 1.5, drop: 0.5, color: '#ffb05a' },
  { id: 'nightmare', name: '악몽', lv: 22, hp: 2.4, atk: 1.8, exp: 2, drop: 1, color: '#ff5a7a' },
];

// ─── 심연의 탑 (GDD 72) — 50층, 층마다 제한 조건, 10층마다 보스 ──────
R.TOWER_FLOORS = 50;
R.TOWER_MODS = [
  { id: 'nopotion', name: '회복 금지', desc: '물약을 사용할 수 없다' },
  { id: 'haste', name: '광란', desc: '몬스터 이동속도 +30%' },
  { id: 'fragile', name: '유리 몸', desc: '받는 피해 +30%' },
  { id: 'resist', name: '원소 저항', desc: '속성 피해 -50%' },
  { id: 'elite', name: '정예의 층', desc: '모든 몬스터가 정예' },
];
R.towerMod = (f) => (f % 10 === 0 || f < 3 ? null : R.TOWER_MODS[(f * 7 + 3) % R.TOWER_MODS.length]);

// ─── 던전 (지역마다 5개, 마지막 던전에 지역 보스) ─────────────────
// 앞의 4개 던전은 그 지역 몬스터 중 하나가 "우두머리"로 등장한다.
// 새 몬스터가 추가되면 monsters / chief 만 바꾸면 된다.
const CHIEF_MOVES = {
  melee: [['slam'], ['slam', 'charge'], ['slam', 'charge', 'quake']],
  charger: [['charge'], ['charge', 'slam'], ['charge', 'slam', 'quake']],
  ranged: [['wave'], ['wave', 'ring'], ['wave', 'ring', 'quake']],
  hover: [['ring'], ['ring', 'charge'], ['ring', 'charge', 'wave']],
};
R.chiefId = (mon) => 'chief_' + mon;
function makeChief(mon, title, hp) {
  const m = R.MONSTERS[mon], mv = CHIEF_MOVES[m.ai] || CHIEF_MOVES.melee;
  R.BOSSES[R.chiefId(mon)] = {
    name: title, arch: m.arch || 'human', sprite: mon, spriteScale: 1.7, elem: m.elem, pal: m.pal || ['#8a6a4a', '#5a4030', '#e0c090'],
    hp, atk: 1.12 + hp * 0.005, def: 1.2 * (m.def || 1), spd: Math.round(m.spd * 0.8), r: Math.round(m.r * 1.6), scale: 2, chief: true,
    phases: [{ at: 1, moves: mv[0] }, { at: 0.65, moves: mv[1] }, { at: 0.3, moves: mv[2], enrage: true }],
    desc: `${m.name} 무리를 이끄는 우두머리. ${m.desc}`,
  };
}
// [이름, 레벨 범위, 우두머리 몬스터, 우두머리 이름, 몬스터 목록(앞쪽일수록 초반 방), 방 개수, 특수]
const DUNGEON_TABLE = {
  1: [
    ['숲 입구 오솔길', [1, 3], 'slime', '왕 슬라임', ['slime', 'goblin'], 3],
    ['거미 굴', [2, 5], 'spider', '독거미 여왕', ['spider', 'slime', 'goblin'], 4],
    ['버섯 늪지', [3, 6], 'mushroom', '거대 독버섯', ['mushroom', 'goblin', 'spider'], 4],
    ['늑대 언덕', [5, 8], 'wolf', '은빛 늑대왕', ['wolf', 'goblin', 'mushroom', 'spider'], 5],
  ],
  2: [
    ['무너진 성문', [8, 10], 'bandit', '도적 두목', ['bandit', 'skeleton'], 3],
    ['지하 납골당', [9, 12], 'skeleton', '해골 대장', ['skeleton', 'ghost', 'bandit'], 4],
    ['망령의 광장', [11, 14], 'ghost', '원혼의 군주', ['ghost', 'skeleton', 'gargoyle'], 5],
    ['가고일 첨탑', [12, 15], 'gargoyle', '가고일 수장', ['gargoyle', 'bandit', 'ghost', 'skeleton'], 5],
  ],
  3: [
    ['버려진 갱도', [15, 18], 'mine_goblin', '고블린 십장', ['mine_goblin', 'bat'], 3, { cart: true }],
    ['박쥐 동굴', [17, 20], 'bat', '흡혈 박쥐왕', ['bat', 'mine_goblin', 'golem'], 4],
    ['용암 수로', [19, 22], 'lava_worm', '거대 용암벌레', ['lava_worm', 'bat', 'mine_goblin'], 5],
    ['광맥 심층', [21, 24], 'golem', '원시 골렘', ['golem', 'lava_worm', 'mine_goblin', 'bat'], 5, { cart: true }],
  ],
  4: [
    ['서리 정원', [25, 28], 'ice_wolf', '서리 늑대 우두머리', ['ice_wolf', 'frost_mage'], 3],
    ['얼음 회랑', [27, 30], 'frost_mage', '서리 대마법사', ['frost_mage', 'ice_wolf', 'ice_knight'], 4],
    ['기사단 막사', [29, 32], 'ice_knight', '얼음 기사단장', ['ice_knight', 'frost_mage', 'ice_wolf'], 5],
    ['눈보라 고원', [31, 34], 'ice_wolf', '눈보라 늑대왕', ['ice_wolf', 'ice_knight', 'frost_mage'], 6],
  ],
  5: [
    ['불타는 협곡', [35, 39], 'demon', '악마 군주', ['demon', 'hellhound'], 4],
    ['타락의 성소', [38, 42], 'fallen_angel', '타락천사장', ['fallen_angel', 'demon', 'demon_knight'], 5],
    ['지옥견 사육장', [41, 45], 'hellhound', '케르베로스', ['hellhound', 'demon', 'fallen_angel'], 5],
    ['흑철 요새', [44, 48], 'demon_knight', '흑기사단장', ['demon_knight', 'hellhound', 'fallen_angel', 'demon'], 6],
  ],
};
const FINAL_NAME = { 1: '숲의 심장', 2: '몰락한 왕궁', 3: '거인의 대장간', 4: '빙결 옥좌', 5: '공허의 문' };
R.DUNGEONS = [];
for (const rg of R.REGIONS) {
  (DUNGEON_TABLE[rg.id] || []).forEach(([name, lv, chief, title, monsters, rooms, extra], i) => {
    const id = rg.id * 10 + i + 1;
    // 우두머리 체력: 지역 보스(14~22)보다 약하게, 지역·순서에 따라 증가
    makeChief(chief, title, 7 + rg.id * 1.5 + i * 0.8);
    const bid = 'd' + id;
    R.BOSSES[bid] = R.BOSSES[R.chiefId(chief)];
    delete R.BOSSES[R.chiefId(chief)];
    R.DUNGEONS.push(Object.assign({}, rg, { did: id, idx: i, name, regionName: rg.name, lv, monsters, boss: bid, bossLv: lv[1] + 1, rooms, seed: id * 7919 + 131, final: false, gimmickText: `${title}이(가) 기다린다 · ${rg.gimmickText}` }, extra || {}));
  });
  R.DUNGEONS.push(Object.assign({}, rg, { did: rg.id * 10 + 5, idx: 4, name: FINAL_NAME[rg.id], regionName: rg.name, lv: [Math.max(rg.lv[0], rg.lv[1] - 3), rg.lv[1]], rooms: 4, seed: rg.id * 7919 + 13, final: true }));
}
R.dungeonById = (did) => R.DUNGEONS.find((d) => d.did === did);
R.dungeonsOf = (rid) => R.DUNGEONS.filter((d) => d.id === rid);
R.finalDungeon = (rid) => R.DUNGEONS.find((d) => d.id === rid && d.final);
