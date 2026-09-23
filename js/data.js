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
    range: 20, arc: 1.1, moveSpeed: 62, atkSpeed: 1.0,
    look: { skin: '#f1c29a', hair: '#7a4a24', body: '#8e9bb0', bodyD: '#5d6a80', legs: '#4a4f5c', boots: '#3a2a20', hat: 'helm', hatC: '#c9d1dc', cape: '#b33a3a' },
    skills: ['charge', 'whirl'],
    adv: ['GUARDIAN', 'BERSERKER'],
  },
  RANGER: {
    name: '레인저', weapon: 'bow', desc: '장궁 / 원거리 무빙샷',
    base: { str: 5, dex: 13, int: 4, vit: 8, luk: 6 },
    grow: { dex: 1, luk: 1 }, atkStat: 'dex', melee: false,
    range: 120, moveSpeed: 66, atkSpeed: 1.05,
    look: { skin: '#f1c29a', hair: '#c68a3c', body: '#3f8a3a', bodyD: '#2a5e28', legs: '#5a4630', boots: '#3a2a20', hat: 'hood', hatC: '#3f8a3a', cape: '#2a5e28' },
    skills: ['multishot', 'pierce'],
    adv: ['SNIPER', 'TRAPPER'],
  },
  MAGE: {
    name: '원소술사', weapon: 'staff', desc: '지팡이 / 범위 원소 폭딜',
    base: { str: 3, dex: 5, int: 14, vit: 7, luk: 5 },
    grow: { int: 1, vit: 1 }, atkStat: 'int', melee: false,
    range: 110, moveSpeed: 60, atkSpeed: 0.95,
    look: { skin: '#f1c29a', hair: '#e8e0d0', body: '#3a57b8', bodyD: '#263c85', legs: '#263c85', boots: '#3a2a20', hat: 'wizard', hatC: '#3a57b8', cape: '#263c85' },
    skills: ['fireball', 'icelance'],
    adv: ['ARCHMAGE', 'WARLOCK'],
  },
  ASSASSIN: {
    name: '암살자', weapon: 'dagger', desc: '쌍단검 / 고기동 치명타',
    base: { str: 11, dex: 10, int: 3, vit: 7, luk: 10 },
    grow: { str: 1, luk: 1 }, atkStat: 'str', melee: true,
    range: 17, arc: 0.95, moveSpeed: 70, atkSpeed: 1.3, critBonus: 0.12,
    look: { skin: '#e8b890', hair: '#1c1c24', body: '#3a3a4a', bodyD: '#24242e', legs: '#24242e', boots: '#18181e', hat: 'mask', hatC: '#24242e', cape: '#5a2a6a' },
    skills: ['shadowstep', 'poisonblade'],
    adv: ['ASSASSIN2', 'NINJA'],
  },
};

// 2차 전직 (Lv.30) — 패시브 보정
R.ADVANCES = {
  GUARDIAN:  { name: '가디언',     desc: '방어력 +30%, 받는 피해 -15%', mod: { defPct: 0.3, dmgTaken: -0.15 } },
  BERSERKER: { name: '버서커',     desc: '공격력 +20%, 체력 50% 이하일 때 추가 +20%', mod: { atkPct: 0.2, berserk: 0.2 } },
  SNIPER:    { name: '스나이퍼',   desc: '치명타 +15%, 치명타 피해 +30%', mod: { crit: 0.15, critDmg: 0.3 } },
  TRAPPER:   { name: '트래퍼',     desc: '스킬 피해 +20%, 적중 시 둔화', mod: { skillPct: 0.2, slowOnHit: true } },
  ARCHMAGE:  { name: '아크메이지', desc: '스킬 범위 +30%, 마법 공격력 +15%', mod: { aoePct: 0.3, atkPct: 0.15 } },
  WARLOCK:   { name: '워록',       desc: '모든 적중에 저주(지속 피해) 중첩', mod: { dotOnHit: true, atkPct: 0.05 } },
  ASSASSIN2: { name: '어쌔신',     desc: '치명타 +10%, 치명타 피해 +40%', mod: { crit: 0.1, critDmg: 0.4 } },
  NINJA:     { name: '닌자',       desc: '회피 쿨타임 -40%, 이동속도 +15%', mod: { dodgeCdr: 0.4, movePct: 0.15 } },
};

// ─── 스킬 ───────────────────────────────────────────────
R.SKILLS = {
  charge:      { name: '돌진',       mp: 15, cd: 4, rate: 1.5, elem: 'NONE',    icon: '💨', desc: '전방으로 돌진하며 경로상의 적에게 150% 피해 + 기절' },
  whirl:       { name: '회전베기',   mp: 25, cd: 6, rate: 2.0, elem: 'NONE',    icon: '🌀', desc: '주변 360도 적에게 200% 피해, 다운' },
  multishot:   { name: '연사',       mp: 15, cd: 3, rate: 1.2, elem: 'NONE',    icon: '🏹', desc: '부채꼴로 화살 5발 발사, 각 120%' },
  pierce:      { name: '뇌전화살',   mp: 25, cd: 6, rate: 2.6, elem: 'THUNDER', icon: '⚡', desc: '적을 관통하는 번개 화살 260%, 감전' },
  fireball:    { name: '화염구',     mp: 20, cd: 3, rate: 2.2, elem: 'FIRE',    icon: '🔥', desc: '폭발하는 화염구 220% 범위 피해 + 화상' },
  icelance:    { name: '빙결창',     mp: 18, cd: 4, rate: 1.8, elem: 'ICE',     icon: '❄', desc: '관통하는 얼음창 180% + 빙결(둔화)' },
  shadowstep:  { name: '그림자이동', mp: 18, cd: 5, rate: 2.5, elem: 'DARK',    icon: '👤', desc: '가까운 적 뒤로 순간이동 후 250% 확정 치명타' },
  poisonblade: { name: '독칼난무',   mp: 22, cd: 6, rate: 0.7, elem: 'NATURE',  icon: '🗡', desc: '전방을 5회 연속 베어 각 70% + 중독' },
};

// ─── 장비 ───────────────────────────────────────────────
R.SLOTS = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'necklace', 'earring'];
R.SLOT_NAME = { weapon: '무기', helmet: '투구', armor: '갑옷', gloves: '장갑', boots: '신발', ring: '반지', necklace: '목걸이', earring: '귀걸이' };
R.SLOT_ICON = { weapon: '⚔️', helmet: '⛑️', armor: '🛡️', gloves: '🧤', boots: '👢', ring: '💍', necklace: '📿', earring: '✨' };
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
};
// 대장간 안전 강화 (실패해도 단계 하락/파괴 없음)
R.ENHANCE_RATE = [1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]; // index = 현재 강화 단계
R.enhanceMat = (enh) => (enh < 3 ? 'iron' : enh < 7 ? 'stone' : 'hstone');
R.enhanceMatCount = (enh) => (enh < 3 ? enh + 1 : enh < 7 ? enh - 2 : enh - 6);
R.enhanceGold = (item) => Math.round(40 * (item.enh + 1) * (1 + item.ilvl * 0.15));
R.MATERIALS = {
  iron:   { name: '철 조각',     icon: '🔩', price: 30 },
  stone:  { name: '강화석',      icon: '💎', price: 180 },
  hstone: { name: '고급 강화석', icon: '🔷', price: 900 },
};
R.CONSUMABLES = {
  hpPotion: { name: '빨간 물약', icon: '🧪', price: 35, desc: '최대 HP의 35% 회복' },
  mpPotion: { name: '파란 물약', icon: '💧', price: 35, desc: '최대 MP의 40% 회복' },
  reviveStone: { name: '부활석', icon: '🪨', price: 400, desc: '쓰러진 자리에서 즉시 부활' },
};

// ─── 몬스터 ─────────────────────────────────────────────
// 실제 스탯 = 레벨 기반 공식 × 배율. ai: melee / charger / ranged / hover
R.monsterStats = (m, lv) => ({
  maxHp: Math.round((60 + lv * 28) * (1 + lv * 0.03) * (m.hp || 1)),
  atk: Math.round((12 + lv * 6) * (1 + lv * 0.04) * (m.atk || 1)),
  def: Math.round(lv * 2.5 * (m.def || 1)),
  exp: Math.round((12 + lv * 6) * (1 + lv * 0.03) * (m.exp || 1)),
  gold: Math.round((3 + lv * 2) * (m.gold || 1)),
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
  { id: 3, name: '용암 광산',  lv: [15, 25], theme: 'mine',   gimmick: 'rocks',  monsters: ['mine_goblin', 'golem', 'bat', 'lava_worm'], boss: 'iron_golem', bossLv: 26, bgm: 2, gimmickText: '떨어지는 낙석을 피하며 열쇠를 찾아라' },
  { id: 4, name: '얼어붙은 성', lv: [25, 35], theme: 'ice',   gimmick: 'ice',    monsters: ['ice_wolf', 'frost_mage', 'ice_knight'], boss: 'ice_king', bossLv: 36, bgm: 3, gimmickText: '미끄러운 빙판 위에서 관성을 제어하라' },
  { id: 5, name: '마계의 문',  lv: [35, 50], theme: 'hell',   gimmick: 'phase',  monsters: ['demon', 'fallen_angel', 'hellhound', 'demon_knight'], boss: 'void_king', bossLv: 50, bgm: 4, gimmickText: '공허의 왕은 차원을 넘나든다' },
];

// ─── 퀘스트 ─────────────────────────────────────────────
// type: kill (지역 내 몬스터 처치), boss (보스 처치), killType (특정 몬스터)
R.MAIN_QUESTS = [];
R.REGIONS.forEach((rg, i) => {
  R.MAIN_QUESTS.push({
    id: 'm' + (i * 2 + 1), title: `${rg.name}의 이변`, type: 'kill', region: rg.id, count: 8 + i * 2,
    desc: `${rg.name}에서 몬스터 ${8 + i * 2}마리를 처치하라.`,
    reward: { exp: 120 * (i + 1) * (i + 1), gold: 150 * (i + 1), mats: { iron: 3 + i, stone: i } },
  });
  R.MAIN_QUESTS.push({
    id: 'm' + (i * 2 + 2), title: `${R.BOSSES[rg.boss].name} 토벌`, type: 'boss', region: rg.id, count: 1,
    desc: `${rg.name} 깊은 곳의 ${R.BOSSES[rg.boss].name}을(를) 쓰러뜨려라.`,
    reward: { exp: 400 * (i + 1) * (i + 1), gold: 500 * (i + 1), mats: { stone: 2 + i, hstone: i >= 2 ? i - 1 : 0 } },
  });
});

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
