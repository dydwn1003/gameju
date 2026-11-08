// ===== 게임 데이터 정의 =====
const SAVE_KEY = 'monster_idle_v2';

const ELEMENTS = {
  fire:  { name: '불',   icon: '🔥', color: '#ff7a45' },
  water: { name: '물',   icon: '💧', color: '#3fa7ff' },
  grass: { name: '나무', icon: '🌿', color: '#4cc45a' },
  light: { name: '빛',   icon: '✨', color: '#ffcf3a' },
  dark:  { name: '어둠', icon: '🌙', color: '#8a5cf0' },
};
const ELEMENT_ORDER = ['grass', 'water', 'fire', 'dark', 'light'];
// 공격 속성 → 유리한 상대 속성
const ADV = { fire: 'grass', grass: 'water', water: 'fire', light: 'dark', dark: 'light' };

// 등급: C < B < A < S < SS < SSS
const RARITY = {
  // 등급 배율: C 1 · B 1.5 · A 2.3 · S 3.5 · SS 5.5 · SSS 8.5  (확률 합계 100%)
  C:   { rate: 54.3, color: '#a3acb8', base: { atk: 10, hp: 80,  def: 4 } },
  B:   { rate: 30,   color: '#56c46e', base: { atk: 15, hp: 120, def: 6 } },
  A:   { rate: 12,   color: '#4fa3ff', base: { atk: 23, hp: 184, def: 9 } },
  S:   { rate: 3,    color: '#b26bff', base: { atk: 35, hp: 280, def: 14 } },
  SS:  { rate: 0.62, color: '#ffb020', base: { atk: 55, hp: 440, def: 22 } },
  SSS: { rate: 0.08, color: '#ff4f6b', base: { atk: 85, hp: 680, def: 34 } },
};
const RARITY_ORDER = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
const PITY_MAX = 80;       // 80회 안에 S 이상 확정 (천장: S 80% · SS 18% · SSS 2%)
const SKILL_TIER = { C: 1, B: 1.12, A: 1.25, S: 1.42, SS: 1.65, SSS: 2 }; // 등급별 스킬 위력 배율
const TEN_PULL_MIN = 'A';  // 10회 소환 마지막은 A 이상

const SKILLS = {
  nuke:   { name: '필살 일격', desc: '적 1명에게 공격력 320% 피해' },
  blast:  { name: '광역 술법', desc: '모든 적에게 공격력 140% 피해' },
  heal:   { name: '치유의 기운', desc: '아군 전체 회복 (가장 약한 아군은 크게 회복)' },
  shield: { name: '수호 결계', desc: '아군 전체에게 보호막 + 적 1명 120% 피해' },
  drain:  { name: '혼 빨아들이기', desc: '적 1명 240% 피해, 피해량 60% 회복' },
};

// ===== 뽑기 몬스터 82종 (한국 옛이야기 요괴·영물) =====
// arch: 그림 체형 / pal: [몸, 배·밝은색, 포인트] / feat: 장식 / tails: 단계별 꼬리 수
const EPITHET = { C: '큰', B: '용맹한', A: '신령한', S: '대', SS: '신수', SSS: '태초의' };
const LINES_RAW = [
  // ---------- C (33) ----------
  { id: 'jipsin',   el: 'grass', r: 'C', n: '짚신동이',   arch: 'shoe',    pal: ['#d8b46a', '#f0d898', '#8a6a3a'], feat: [], skill: 'shield', spd: 0.95 },
  { id: 'bitjaru',  el: 'dark',  r: 'C', n: '빗자루귀',   arch: 'broom',   pal: ['#c8a050', '#7a5a3a', '#d8463a'], feat: ['horn1'], skill: 'nuke', spd: 1.1 },
  { id: 'jangdok',  el: 'water', r: 'C', n: '장독이',     arch: 'jar',     pal: ['#7a4a32', '#a86a48', '#f4e6c8'], feat: ['lid'], skill: 'shield', spd: 0.85 },
  { id: 'horong',   el: 'fire',  r: 'C', n: '호롱불이',   arch: 'lantern', pal: ['#c8902a', '#fff2a0', '#ff7a2a'], feat: ['flame'], skill: 'blast', spd: 1.0 },
  { id: 'yeopjeon', el: 'light', r: 'C', n: '엽전귀',     arch: 'coin',    pal: ['#d8a838', '#fff0a0', '#8a6a1a'], feat: [], skill: 'nuke', spd: 1.15 },
  { id: 'bokjumeo', el: 'light', r: 'C', n: '복주머니',   arch: 'pouch',   pal: ['#e04a5a', '#ff9aa8', '#f2c14e'], feat: [], skill: 'heal', spd: 1.0 },
  { id: 'tteok',    el: 'light', r: 'C', n: '떡보',       arch: 'blob',    pal: ['#f8f4ec', '#ffffff', '#ff9ac0'], feat: ['blush'], skill: 'heal', spd: 0.95 },
  { id: 'songpyeon',el: 'grass', r: 'C', n: '송편이',     arch: 'blob',    pal: ['#9ad08a', '#d8f0c8', '#f2c14e'], feat: ['leaf'], skill: 'heal', spd: 1.0 },
  { id: 'dotori',   el: 'grass', r: 'C', n: '도토리귀',   arch: 'blob',    pal: ['#c98a4b', '#e8c08a', '#6a4220'], feat: ['acorn'], skill: 'nuke', spd: 1.05 },
  { id: 'dukkeobi', el: 'water', r: 'C', n: '꼬마두꺼비', arch: 'toad',    pal: ['#7aa84a', '#e8e0a0', '#4a6a2a'], feat: ['spots'], skill: 'shield', spd: 0.9 },
  { id: 'gaeguri',  el: 'grass', r: 'C', n: '개구리동자', arch: 'toad',    pal: ['#5ac85a', '#e8ffd0', '#2a8a3a'], feat: ['leafhat'], skill: 'nuke', spd: 1.1 },
  { id: 'cheongseol',el:'grass', r: 'C', n: '청설모',     arch: 'quad',    pal: ['#7a6a6a', '#d8ccc0', '#4a3a3a'], feat: ['ears_round', 'tail_big'], skill: 'nuke', spd: 1.25 },
  { id: 'neoguri',  el: 'dark',  r: 'C', n: '너구리',     arch: 'quad',    pal: ['#8a7a6a', '#e8dcc8', '#3a2a2a'], feat: ['ears_round', 'mask', 'tail_ring'], skill: 'drain', spd: 1.05 },
  { id: 'metdwaeji',el: 'grass', r: 'C', n: '아기멧돼지', arch: 'quad',    pal: ['#8a5a3a', '#c89a7a', '#f4f0e6'], feat: ['ears_round', 'tusks', 'stripes_back'], skill: 'nuke', spd: 1.0 },
  { id: 'bandit',   el: 'fire',  r: 'C', n: '반딧불요정', arch: 'insect',  pal: ['#ffb347', '#fff27a', '#5a4a2a'], feat: ['antenna', 'glowtail'], skill: 'blast', spd: 1.2 },
  { id: 'nabi',     el: 'light', r: 'C', n: '나비정령',   arch: 'insect',  pal: ['#ff9ad8', '#fff0f8', '#8a4aa0'], feat: ['antenna', 'butterfly'], skill: 'heal', spd: 1.15 },
  { id: 'kkachi',   el: 'light', r: 'C', n: '까치',       arch: 'bird',    pal: ['#2a2a3a', '#f4f4f8', '#3f62c8'], feat: [], skill: 'nuke', spd: 1.25 },
  { id: 'chamsae',  el: 'grass', r: 'C', n: '참새동이',   arch: 'bird',    pal: ['#a87a4a', '#f0e0c8', '#4a3a2a'], feat: [], skill: 'nuke', spd: 1.3 },
  { id: 'pyeonbok', el: 'dark',  r: 'C', n: '편복이',     arch: 'bat',     pal: ['#5a4a7a', '#a898c8', '#2a1d3a'], feat: ['ears_bat'], skill: 'drain', spd: 1.2 },
  { id: 'ingeo',    el: 'water', r: 'C', n: '꼬마잉어',   arch: 'fish',    pal: ['#ff7a4a', '#fff4e8', '#f4f4f8'], feat: ['koi'], skill: 'blast', spd: 1.1 },
  { id: 'megi',     el: 'water', r: 'C', n: '메기',       arch: 'fish',    pal: ['#6a6a5a', '#c8c0a0', '#3a3a2a'], feat: ['whiskers'], skill: 'shield', spd: 0.9 },
  { id: 'kkotge',   el: 'water', r: 'C', n: '꽃게',       arch: 'crab',    pal: ['#e05a3a', '#ffc0a0', '#7a2a1a'], feat: [], skill: 'shield', spd: 0.95 },
  { id: 'dokkaebibul', el:'fire',r: 'C', n: '도깨비불',   arch: 'wisp',    pal: ['#ff7a2a', '#fff2a0', '#d8361a'], feat: [], skill: 'blast', spd: 1.15 },
  { id: 'pureunbul',el: 'dark',  r: 'C', n: '푸른혼불',   arch: 'wisp',    pal: ['#4a8aff', '#d0f0ff', '#2a3aa0'], feat: [], skill: 'drain', spd: 1.1 },
  { id: 'dalgyal',  el: 'dark',  r: 'C', n: '달걀귀신',   arch: 'egghost', pal: ['#f4f0e6', '#ffffff', '#c8c0b0'], feat: [], skill: 'drain', spd: 1.0 },
  { id: 'idkki',    el: 'grass', r: 'C', n: '이끼돌',     arch: 'rock',    pal: ['#8c948a', '#b8bcb0', '#5ac05a'], feat: ['moss'], skill: 'shield', spd: 0.85 },
  { id: 'godeureum',el: 'water', r: 'C', n: '고드름이',   arch: 'blob',    pal: ['#bfe8ff', '#ffffff', '#5fa8e0'], feat: ['icicle'], skill: 'nuke', spd: 1.0 },
  { id: 'horibyeong',el:'grass', r: 'C', n: '호리병',     arch: 'gourd',   pal: ['#d8c060', '#f4e8a0', '#d8463a'], feat: [], skill: 'heal', spd: 0.95 },
  { id: 'buchae',   el: 'light', r: 'C', n: '부채정령',   arch: 'fan',     pal: ['#f4ecd8', '#ffffff', '#d8463a'], feat: [], skill: 'blast', spd: 1.05 },
  { id: 'hahoetal', el: 'light', r: 'C', n: '하회탈',     arch: 'mask',    pal: ['#e8c890', '#f8e4b8', '#7a4a2a'], feat: [], skill: 'nuke', spd: 1.05 },
  { id: 'yeonkkot', el: 'water', r: 'C', n: '연꽃정령',   arch: 'blob',    pal: ['#ffb0cc', '#fff0f6', '#5ac05a'], feat: ['lotus'], skill: 'heal', spd: 1.0 },
  { id: 'haepari',  el: 'water', r: 'C', n: '해파리',     arch: 'jelly',   pal: ['#a8c8ff', '#e8f0ff', '#ff9ad8'], feat: [], skill: 'drain', spd: 1.0 },
  { id: 'jindo',    el: 'light', r: 'C', n: '진돗개',     arch: 'quad',    pal: ['#e8c88a', '#fff4e0', '#5a3a2a'], feat: ['ears_dog', 'tail_curl'], skill: 'nuke', spd: 1.2 },
  // ---------- B (22) ----------
  { id: 'sapsal',   el: 'light', r: 'B', n: '삽살개',     arch: 'quad',    pal: ['#c8b8a0', '#f0e8d8', '#3a2a2a'], feat: ['ears_floppy', 'shaggy', 'tail_curl'], skill: 'shield', spd: 1.0 },
  { id: 'cheongdok',el: 'water', r: 'B', n: '청도깨비',   arch: 'goblin',  pal: ['#4a8ad8', '#a8d0ff', '#f2c14e'], feat: ['horn1', 'club', 'tigerpants'], skill: 'nuke', spd: 1.05 },
  { id: 'hongdok',  el: 'fire',  r: 'B', n: '홍도깨비',   arch: 'goblin',  pal: ['#d8463a', '#ffa890', '#f2c14e'], feat: ['horn1', 'club', 'tigerpants'], skill: 'blast', spd: 1.05 },
  { id: 'jangseung',el: 'grass', r: 'B', n: '장승',       arch: 'totem',   pal: ['#a87a4a', '#d8b080', '#d8463a'], feat: ['gwanmo'], skill: 'shield', spd: 0.8 },
  { id: 'hak',      el: 'light', r: 'B', n: '두루미',     arch: 'crane',   pal: ['#f8f8fc', '#ffffff', '#d8263a'], feat: [], skill: 'heal', spd: 1.1 },
  { id: 'buheong',  el: 'dark',  r: 'B', n: '수리부엉이', arch: 'owl',     pal: ['#8a6a4a', '#e8d0a8', '#ffb020'], feat: ['ears_tuft'], skill: 'nuke', spd: 1.1 },
  { id: 'yeowoo',   el: 'fire',  r: 'B', n: '불여우',     arch: 'quad',    pal: ['#ff8a3d', '#fff0dc', '#ffd23f'], feat: ['ears_fox', 'tail_fox'], tails: [1, 1, 2], skill: 'blast', spd: 1.2 },
  { id: 'noru',     el: 'grass', r: 'B', n: '노루',       arch: 'quad',    pal: ['#c8905a', '#f4e0c0', '#6a4a2a'], feat: ['ears_long', 'antlers_small', 'spots'], skill: 'heal', spd: 1.2 },
  { id: 'bandal',   el: 'dark',  r: 'B', n: '반달곰',     arch: 'bear',    pal: ['#2e2a38', '#5a5468', '#f4f0e6'], feat: ['ears_round', 'moonmark'], skill: 'shield', spd: 0.9 },
  { id: 'sudal',    el: 'water', r: 'B', n: '수달',       arch: 'quad',    pal: ['#7a5a3a', '#e8d0b0', '#3a2a1a'], feat: ['ears_round', 'whiskers', 'tail_thick'], skill: 'nuke', spd: 1.2 },
  { id: 'geobuk',   el: 'water', r: 'B', n: '거북',       arch: 'turtle',  pal: ['#5aa86a', '#e8e0b0', '#4a6a3a'], feat: [], skill: 'shield', spd: 0.8 },
  { id: 'gureongi', el: 'grass', r: 'B', n: '구렁이',     arch: 'serpent', pal: ['#6a8a3a', '#d8d890', '#3a4a1a'], feat: ['scales'], skill: 'drain', spd: 1.05 },
  { id: 'jine',     el: 'dark',  r: 'B', n: '지네',       arch: 'centipede', pal: ['#a83a2a', '#f2c14e', '#3a1a1a'], feat: [], skill: 'drain', spd: 1.15 },
  { id: 'muneo',    el: 'water', r: 'B', n: '문어',       arch: 'octo',    pal: ['#d86a6a', '#ffc0b8', '#7a2a2a'], feat: [], skill: 'blast', spd: 0.95 },
  { id: 'cheonyeo', el: 'dark',  r: 'B', n: '처녀귀신',   arch: 'ghostlady', pal: ['#f4f4fa', '#ffffff', '#1a1a24'], feat: [], skill: 'drain', spd: 1.05 },
  { id: 'mulgwi',   el: 'water', r: 'B', n: '물귀신',     arch: 'ghost',   pal: ['#7ad0c0', '#d8fff4', '#2a6a6a'], feat: ['seaweed'], skill: 'drain', spd: 1.0 },
  { id: 'chorong',  el: 'fire',  r: 'B', n: '청사초롱',   arch: 'lantern', pal: ['#3f62c8', '#ff6a5a', '#f2c14e'], feat: ['flame', 'tassel'], skill: 'blast', spd: 1.0 },
  { id: 'maetdol',  el: 'grass', r: 'B', n: '맷돌정령',   arch: 'millstone', pal: ['#9a9a94', '#c8c8c0', '#6a4a2a'], feat: [], skill: 'shield', spd: 0.85 },
  { id: 'kkotsasum',el: 'grass', r: 'B', n: '꽃사슴',     arch: 'quad',    pal: ['#d89a6a', '#fff0d8', '#ff8ab0'], feat: ['ears_long', 'antlers', 'flowers', 'spots'], skill: 'heal', spd: 1.15 },
  { id: 'eunin',    el: 'light', r: 'B', n: '은빛잉어',   arch: 'fish',    pal: ['#d8e0f0', '#ffffff', '#7a8ab0'], feat: ['whiskers', 'finbig'], skill: 'heal', spd: 1.05 },
  { id: 'hwaro',    el: 'fire',  r: 'B', n: '화로정령',   arch: 'jar',     pal: ['#5a4a4a', '#8a7070', '#ff7a2a'], feat: ['coals'], skill: 'blast', spd: 0.9 },
  { id: 'juibul',   el: 'fire',  r: 'B', n: '쥐불이',     arch: 'quad',    pal: ['#8a8a94', '#e0d8d8', '#ff7a2a'], feat: ['ears_round', 'tail_thin', 'flame'], skill: 'nuke', spd: 1.3 },
  // ---------- A (11) ----------
  { id: 'geumdu',   el: 'light', r: 'A', n: '금두꺼비',   arch: 'toad',    pal: ['#e8b830', '#fff0a0', '#a87a10'], feat: ['coinmouth', 'spots'], skill: 'heal', spd: 0.95 },
  { id: 'geuseundae',el:'dark',  r: 'A', n: '그슨대',     arch: 'shadow',  pal: ['#2a2240', '#4a3a6a', '#ff3a5a'], feat: [], skill: 'drain', spd: 1.05 },
  { id: 'dueok',    el: 'dark',  r: 'A', n: '두억시니',   arch: 'goblin',  pal: ['#4a3a6a', '#8a78b0', '#c8c8d0'], feat: ['horns2', 'club', 'tigerpants'], skill: 'nuke', spd: 1.0 },
  { id: 'geumdok',  el: 'light', r: 'A', n: '금도깨비',   arch: 'goblin',  pal: ['#e8b830', '#fff0a0', '#d8463a'], feat: ['horn1', 'club_gold', 'tigerpants'], skill: 'blast', spd: 1.05 },
  { id: 'maegu',    el: 'light', r: 'A', n: '매구',       arch: 'quad',    pal: ['#f4f0f8', '#ffffff', '#b06bff'], feat: ['ears_fox', 'tail_fox'], tails: [1, 2, 3], skill: 'drain', spd: 1.2 },
  { id: 'yongma',   el: 'water', r: 'A', n: '용마',       arch: 'horse',   pal: ['#4a8ad8', '#d8ecff', '#f2c14e'], feat: ['mane_wave', 'horn1'], skill: 'nuke', spd: 1.25 },
  { id: 'bulgom',   el: 'fire',  r: 'A', n: '불곰신',     arch: 'bear',    pal: ['#8a3a2a', '#d87a5a', '#ffb020'], feat: ['ears_round', 'flame'], skill: 'shield', spd: 0.95 },
  { id: 'cheonghak',el: 'water', r: 'A', n: '청학',       arch: 'crane',   pal: ['#7ab0e8', '#e8f4ff', '#2a4a8a'], feat: [], skill: 'heal', spd: 1.15 },
  { id: 'eopgu',    el: 'light', r: 'A', n: '업구렁이',   arch: 'serpent', pal: ['#e8c050', '#fff0b0', '#8a6a1a'], feat: ['scales', 'crown_small'], skill: 'heal', spd: 1.0 },
  { id: 'mokgak',   el: 'grass', r: 'A', n: '목각장군',   arch: 'totem',   pal: ['#8a5a32', '#c89a6a', '#3f62c8'], feat: ['armor', 'helm'], skill: 'shield', spd: 0.85 },
  { id: 'jowang',   el: 'fire',  r: 'A', n: '조왕신',     arch: 'jar',     pal: ['#3a3a44', '#6a6a78', '#ffb020'], feat: ['coals', 'crown_small'], skill: 'heal', spd: 0.95 },
  // ---------- S (8) ----------
  { id: 'haetae',   el: 'light', r: 'S', n: '해태',       arch: 'lion',    pal: ['#e8c890', '#fff4d8', '#3f8a6a'], feat: ['horn1', 'mane_curl'], skill: 'shield', spd: 1.0 },
  { id: 'bulgasari',el: 'fire',  r: 'S', n: '불가사리',   arch: 'lion',    pal: ['#6a6a78', '#a8a8b8', '#ff7a2a'], feat: ['spikes', 'horns2'], skill: 'nuke', spd: 0.95 },
  { id: 'imugi',    el: 'water', r: 'S', n: '이무기',     arch: 'serpent', pal: ['#3a6a8a', '#a8d8e8', '#f2c14e'], feat: ['scales', 'whiskers', 'horns_small'], skill: 'blast', spd: 1.05 },
  { id: 'samjok',   el: 'light', r: 'S', n: '삼족오',     arch: 'bird',    pal: ['#1a1a24', '#3a3a4a', '#ffb020'], feat: ['sun', 'threelegs'], skill: 'blast', spd: 1.2 },
  { id: 'jangsan',  el: 'dark',  r: 'S', n: '장산범',     arch: 'lion',    pal: ['#f4f0f8', '#ffffff', '#5a4a7a'], feat: ['mane_long'], skill: 'drain', spd: 1.15 },
  { id: 'sangun',   el: 'grass', r: 'S', n: '산군',       arch: 'tiger',   pal: ['#e8902a', '#fff0d8', '#2a1a1a'], feat: ['ears_round', 'stripes'], skill: 'nuke', spd: 1.15 },
  { id: 'yongwang', el: 'water', r: 'S', n: '용왕거북',   arch: 'turtle',  pal: ['#3a8a7a', '#f2c14e', '#2a4a5a'], feat: ['crown_small', 'whiskers'], skill: 'heal', spd: 0.85 },
  { id: 'dokdaejang',el:'dark',  r: 'S', n: '도깨비대장', arch: 'goblin',  pal: ['#6a2a8a', '#c890e8', '#f2c14e'], feat: ['horns2', 'club_gold', 'tigerpants', 'cape'], skill: 'blast', spd: 1.0 },
  // ---------- SS (5) ----------
  { id: 'cheongryong',el:'water',r: 'SS', n: '청룡',      arch: 'dragon',  pal: ['#2f8ad8', '#bfe8ff', '#f2c14e'], feat: ['whiskers', 'horns_deer', 'mane_wave'], names: ['푸른새끼용', '청룡', '동방청룡'], skill: 'blast', spd: 1.15 },
  { id: 'baekho',   el: 'light', r: 'SS', n: '백호',       arch: 'tiger',   pal: ['#f4f4f8', '#ffffff', '#2a2a3a'], feat: ['ears_round', 'stripes'], names: ['아기백호', '백호', '서방백호'], skill: 'nuke', spd: 1.2 },
  { id: 'jujak',    el: 'fire',  r: 'SS', n: '주작',       arch: 'phoenix', pal: ['#e8382a', '#ffd23f', '#ff8a2a'], feat: ['crest'], names: ['불새', '주작', '남방주작'], skill: 'blast', spd: 1.2 },
  { id: 'hyeonmu',  el: 'dark',  r: 'SS', n: '현무',       arch: 'turtle',  pal: ['#2a3a5a', '#6a8ab0', '#2a8a6a'], feat: ['snaketail'], names: ['검은거북', '현무', '북방현무'], skill: 'shield', spd: 0.9 },
  { id: 'girin',    el: 'grass', r: 'SS', n: '기린',       arch: 'horse',   pal: ['#7ac85a', '#f4f0c8', '#f2c14e'], feat: ['horn1', 'mane_wave', 'scales'], names: ['새끼기린', '기린', '성수기린'], skill: 'heal', spd: 1.2 },
  // ---------- SSS (3) ----------
  { id: 'hwangryong',el:'light', r: 'SSS', n: '황룡',     arch: 'dragon',  pal: ['#f2c14e', '#fff6c8', '#d8463a'], feat: ['whiskers', 'horns_deer', 'mane_wave', 'pearl'], names: ['여의주알', '황룡', '중앙황룡'], skill: 'blast', spd: 1.15 },
  { id: 'cheonho',  el: 'fire',  r: 'SSS', n: '천호',      arch: 'fox',     pal: ['#fff4ec', '#ffffff', '#ff6a3a'], feat: ['ears_fox', 'tail_fox', 'foxfire'], tails: [3, 6, 9], names: ['꼬리셋여우', '구미호', '천년천호'], skill: 'drain', spd: 1.25 },
  { id: 'yeomra',   el: 'dark',  r: 'SSS', n: '염라',      arch: 'reaper',  pal: ['#1a1a24', '#3a3a4a', '#d8463a'], feat: ['gat'], names: ['저승차사', '저승사자', '염라대왕'], skill: 'drain', spd: 1.05 },
];
const LINES = LINES_RAW.map(l => Object.assign({}, l, {
  names: Array(3).fill(l.names ? l.names[1] : l.n), // 진화 삭제 → 이름 하나
}));
const LINE_MAP = Object.fromEntries(LINES.map(l => [l.id, l]));

// ===== 적 몬스터 (뽑기와 별개, 챕터별 4종 + 보스) =====
const ENEMIES = [
  // 1장: 산골 마을 (나무)
  { id: 'e_jwi',     ch: 'grass', n: '들쥐요괴',   arch: 'quad',    pal: ['#7a6a6a', '#c8b8b0', '#3a2a2a'], feat: ['ears_round', 'tail_thin'] },
  { id: 'e_dwaeji',  ch: 'grass', n: '성난멧돼지', arch: 'boar',    pal: ['#5a3a2a', '#8a6a5a', '#f4f0e6'], feat: ['tusks', 'mane_back'] },
  { id: 'e_beoseot', ch: 'grass', n: '독버섯귀',   arch: 'blob',    pal: ['#a85ac0', '#e0b0f0', '#d83a4a'], feat: ['mushroom'] },
  { id: 'e_sandok',  ch: 'grass', n: '산도깨비',   arch: 'goblin',  pal: ['#5a8a3a', '#a8d080', '#7a5a3a'], feat: ['horn1', 'club', 'tigerpants'] },
  { id: 'e_heukgom', ch: 'grass', n: '흑곰대장',   arch: 'bear',    pal: ['#2a2430', '#4a4058', '#d8463a'], feat: ['ears_round', 'scar'], boss: true },
  // 2장: 바닷가 (물)
  { id: 'e_mulgwi',  ch: 'water', n: '익사귀',     arch: 'ghost',   pal: ['#5aa890', '#b0e8d8', '#1a3a3a'], feat: ['seaweed'] },
  { id: 'e_haepari', ch: 'water', n: '독해파리',   arch: 'jelly',   pal: ['#b06bff', '#e8c8ff', '#5fe0ff'], feat: [] },
  { id: 'e_jipge',   ch: 'water', n: '집게귀',     arch: 'crab',    pal: ['#a8382a', '#e88a6a', '#3a1a1a'], feat: [] },
  { id: 'e_agwi',    ch: 'water', n: '아귀',       arch: 'fish',    pal: ['#6a5a4a', '#a8987a', '#f4f0e6'], feat: ['teeth', 'lure'] },
  { id: 'e_daemuneo',ch: 'water', n: '대왕문어',   arch: 'octo',    pal: ['#8a3a6a', '#d88ab8', '#f2c14e'], feat: [], boss: true },
  // 3장: 화산 (불)
  { id: 'e_buldok',  ch: 'fire',  n: '불도깨비',   arch: 'goblin',  pal: ['#c8321a', '#ff8a5a', '#2a1a1a'], feat: ['horns2', 'club', 'flame'] },
  { id: 'e_hwajwi',  ch: 'fire',  n: '화서',       arch: 'quad',    pal: ['#d85a2a', '#ffb07a', '#ffd23f'], feat: ['ears_round', 'tail_thin', 'flame'] },
  { id: 'e_yongam',  ch: 'fire',  n: '용암두꺼비', arch: 'toad',    pal: ['#4a2a2a', '#7a4a3a', '#ff7a2a'], feat: ['magma'] },
  { id: 'e_hwabak',  ch: 'fire',  n: '화염박쥐',   arch: 'bat',     pal: ['#7a2a1a', '#d85a3a', '#ffb020'], feat: ['ears_bat', 'flame'] },
  { id: 'e_hwasan',  ch: 'fire',  n: '화산거인',   arch: 'golem',   pal: ['#3a2a2a', '#6a4a40', '#ff6a1a'], feat: ['magma'], boss: true },
  // 4장: 밤 숲 (어둠)
  { id: 'e_wonhon',  ch: 'dark',  n: '원혼',       arch: 'ghostlady', pal: ['#e8e8f4', '#ffffff', '#101018'], feat: ['blood'] },
  { id: 'e_dalgyal', ch: 'dark',  n: '얼굴없는귀', arch: 'egghost', pal: ['#d8d4e0', '#f4f0f8', '#8a84a0'], feat: [] },
  { id: 'e_haegol',  ch: 'dark',  n: '해골병사',   arch: 'goblin',  pal: ['#e8e4d8', '#ffffff', '#5a5a64'], feat: ['bones', 'spear'] },
  { id: 'e_neukdae', ch: 'dark',  n: '그림자늑대', arch: 'quad',    pal: ['#3a3a5a', '#6a6a8a', '#ff3a5a'], feat: ['ears_fox', 'mane_back', 'tail_big'] },
  { id: 'e_saja',    ch: 'dark',  n: '저승사자',   arch: 'reaper',  pal: ['#141418', '#2a2a34', '#f4f0e6'], feat: ['gat'], boss: true },
  // 5장: 하늘 사원 (빛)
  { id: 'e_seoksang',ch: 'light', n: '석상해태',   arch: 'lion',    pal: ['#a8a8a0', '#d0d0c8', '#6a6a64'], feat: ['horn1', 'mane_curl', 'cracks'] },
  { id: 'e_cheondung',ch:'light', n: '천둥새',     arch: 'bird',    pal: ['#4a5ad8', '#d8e0ff', '#ffe066'], feat: ['bolt'] },
  { id: 'e_gureum',  ch: 'light', n: '먹구름요괴', arch: 'cloud',   pal: ['#8a8aa0', '#c8c8d8', '#ffe066'], feat: ['bolt'] },
  { id: 'e_geumgang',ch: 'light', n: '금강역사',   arch: 'goblin',  pal: ['#d8a838', '#fff0a0', '#d8463a'], feat: ['armor', 'helm', 'spear'] },
  { id: 'e_noesin',  ch: 'light', n: '뇌신',       arch: 'golem',   pal: ['#3a4a8a', '#7a8ad8', '#ffe066'], feat: ['drums', 'bolt'], boss: true },
  // 레이드 전용
  { id: 'r_heugimugi', ch: 'dark', n: '흑이무기',   arch: 'dragon',  pal: ['#2a2a3a', '#5a5a7a', '#ff3a5a'], feat: ['whiskers', 'horns_deer', 'mane_wave'], raid: true },
  { id: 'r_gumiho',  ch: 'fire',  n: '구미호여왕', arch: 'fox',     pal: ['#3a2a4a', '#8a6aa8', '#ff4a8a'], feat: ['ears_fox', 'tail_fox', 'foxfire'], tails: [9, 9, 9], raid: true },
];
const ENEMY_MAP = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
const RACES = { human: '인간', fox: '구미호', goblin: '도깨비' }; // 메인 캐릭터 종족 (직업 없음)

// 성장 공식
const FORM_MUL = [1, 1, 1]; // 단계(크기 연출용)는 능력치에 영향 없음
// 진화 없음: 몬스터는 레벨(최대 100)과 성급으로만 성장
const MON_MAX_LV = 100;
const FORM_CAP = [MON_MAX_LV, MON_MAX_LV, MON_MAX_LV];
const STAR_STONES = star => 3 * (star + 1); // 성급 강화에 드는 영혼석
const MAX_STAR = 5;
const DUP_SHARDS = 10;

// 탐험
const EXPEDITIONS = [
  { min: 30,  label: '30분 탐험', gems: 10,  stones: 0, ench: 3,  mul: 1.6 },
  { min: 120, label: '2시간 탐험', gems: 40,  stones: 1, ench: 8,  mul: 1.8 },
  { min: 480, label: '8시간 탐험', gems: 150, stones: 4, ench: 25, mul: 2.0 },
];

// 상점 (실결제 상품은 테스트 결제 처리)
const IAP = [
  { id: 'gem_s',   name: '다이아 300',          gems: 300,  price: '₩1,200' },
  { id: 'gem_m',   name: '다이아 1,500 +150',   gems: 1650, price: '₩5,900' },
  { id: 'gem_l',   name: '다이아 3,300 +500',   gems: 3800, price: '₩12,000' },
  { id: 'gem_xl',  name: '다이아 7,000 +1,500', gems: 8500, price: '₩29,000' },
];

// 일일 광고 제한
const AD_LIMITS = { pull: 3, gem: 5, boost: 6, idle: 10, exped: 10, raidAd: 2, arenaAd: 3, attend: 1, gearPull: 2 };
const AD_GEM_REWARD = 30;
const BOOST_MIN = 30;
const IDLE_CAP_MIN = 720; // 12시간

// 출석 (7일 주기) — goldMin: 방치 보상 N분 어치
const ATTENDANCE = [
  { gems: 100 },
  { goldMin: 120 },
  { stones: 3 },
  { gems: 150 },
  { ench: 20, goldMin: 60 },
  { stones: 5, goldMin: 180 },
  { gems: 500 },
];

// 일일 퀘스트
const QUESTS = [
  { id: 'stage',   name: '스테이지 클리어',  target: 10, reward: { gems: 30 } },
  { id: 'levelup', name: '몬스터 레벨업',    target: 10, reward: { goldMin: 60 } },
  { id: 'summon',  name: '몬스터 소환',      target: 5,  reward: { gems: 30 } },
  { id: 'ad',      name: '광고 시청',        target: 3,  reward: { gems: 40 } },
  { id: 'idle',    name: '방치 보상 받기',   target: 2,  reward: { ench: 5 } },
  { id: 'enhance', name: '장비 강화',        target: 5,  reward: { gems: 30 } },
  { id: 'raid',    name: '보스 레이드 도전', target: 1,  reward: { stones: 2 } },
  { id: 'arena',   name: '아레나 전투',      target: 2,  reward: { gems: 20 } },
];
const QUEST_ALL_REWARD = { gems: 100, stones: 3, ench: 10 };

// 보스 레이드 (요일별 보스)
const RAID = { time: 45, tickets: 3 };
const RAID_BOSSES = ['e_saja', 'e_heukgom', 'e_daemuneo', 'e_hwasan', 'r_heugimugi', 'e_noesin', 'r_gumiho']; // 일~토

// 아레나
const ARENA = { time: 60, tickets: 5, start: 1000, refreshCost: 10 };
const ARENA_TIERS = [
  { name: '브론즈',   min: 0,    color: '#c98a4b' },
  { name: '실버',     min: 1100, color: '#c9d3e0' },
  { name: '골드',     min: 1250, color: '#ffc94a' },
  { name: '플래티넘', min: 1450, color: '#5fe0d0' },
  { name: '다이아',   min: 1700, color: '#8fb8ff' },
  { name: '마스터',   min: 2000, color: '#ff6bd5' },
];
const NICK_A = ['용감한', '졸린', '빛나는', '무서운', '귀여운', '전설의', '배고픈', '수상한', '행복한', '어둠의', '번개', '말랑한'];
const NICK_B = ['조련사', '모험가', '사냥꾼', '마법사', '기사', '소환사', '탐험가', '수호자', '도토리', '용사'];

// ================= 메인 캐릭터 =================
// 성능 차이는 크지 않게: 전투력 공식(atk*4 + hp*0.6 + def*3) 기준 비슷하게 맞춤
// 메인 캐릭터 종족 (직업 없음). 성능 차이는 크지 않게 (전투력 공식 기준 비슷)
const CLASSES = {
  human:  { name: '인간',   weapon: '환도',     desc: '검과 부적을 함께 쓰는 균형형', base: { atk: 22, hp: 180, def: 10 }, spd: 1.05,
            skill: { name: '부적술', type: 'nuke', mult: 3.2, desc: '부적을 날려 적 1명에게 공격력 320% 피해' } },
  fox:    { name: '구미호', weapon: '여우구슬', desc: '빠르고 치명적인 여우불', base: { atk: 24, hp: 160, def: 9 }, spd: 1.15, crit: 0.2,
            skill: { name: '여우불', type: 'multi', mult: 1.1, hits: 4, desc: '여우불 4발, 무작위 적에게 110% 피해' } },
  goblin: { name: '도깨비', weapon: '방망이',   desc: '튼튼한 몸과 광역 벼락', base: { atk: 20, hp: 200, def: 12 }, spd: 0.95,
            skill: { name: '벼락 방망이', type: 'blast', mult: 1.4, desc: '벼락을 내리쳐 모든 적에게 공격력 140% 피해' } },
};
const GENDERS = { m: '남자', f: '여자' };
const HERO_MAX_LV = 100;

// ================= 장비 =================
// owner: 'hero' 또는 'mon' (몬스터 장비는 모든 몬스터가 돌려 쓸 수 있음)
const GEAR_SLOTS = {
  weapon: { name: '무기',   owner: 'hero', icon: '⚔️', stat: { atk: 1 } },
  armor:  { name: '갑옷',   owner: 'hero', icon: '🛡️', stat: { hp: 1 } },
  helmet: { name: '투구',   owner: 'hero', icon: '⛑️', stat: { def: 1, hp: 0.4 } },
  ring:   { name: '반지',   owner: 'hero', icon: '💍', stat: { atk: 0.5, def: 0.6 } },
  collar: { name: '목걸이', owner: 'mon',  icon: '📿', stat: { atk: 1 } },
  charm:  { name: '부적',   owner: 'mon',  icon: '🧿', stat: { hp: 1, def: 0.4 } },
};
const HERO_SLOTS = ['weapon', 'armor', 'helmet', 'ring'];
const MON_SLOTS = ['collar', 'charm'];
const GEAR_STAT_UNIT = { atk: 6, hp: 50, def: 4 };
const GEAR_RARITY = {
  C:   { prefix: '낡은',   mul: 1,   rate: 55,  dis: 1 },
  B:   { prefix: '단단한', mul: 1.4, rate: 28,  dis: 3 },
  A:   { prefix: '정교한', mul: 2,   rate: 11,  dis: 8 },
  S:   { prefix: '영웅의', mul: 3,   rate: 4.5, dis: 20 },
  SS:  { prefix: '전설의', mul: 4.5, rate: 1.2, dis: 50 },
  SSS: { prefix: '신화의', mul: 6.5, rate: 0.3, dis: 120 },
};
const GEAR_MAX_ENH = 15;
const ENH_RATE = [100, 100, 100, 100, 100, 90, 80, 70, 60, 50, 45, 40, 35, 30, 25]; // +n → +n+1 성공률
const GEAR_BAG_MAX = 120;

// ===== 전투 화면 크기 (키 기준) =====
// xs 아주 작음 · s 작음 · m 보통 · l 큼 · xl 아주 큼 · xxl 거대. 값 = 기본 유닛 칸 너비 대비 키
const SIZE_H = { xs: 0.5, s: 0.66, m: 0.84, l: 1.02, xl: 1.22, xxl: 1.45 };
const SIZE_CLASS = (() => {
  const t = {
    xs: 'bandit chamsae',
    s: 'jipsin horong yeopjeon bokjumeo tteok songpyeon dotori dukkeobi gaeguri cheongseol metdwaeji nabi kkachi pyeonbok ingeo kkotge dokkaebibul pureunbul godeureum horibyeong buchae hahoetal yeonkkot haepari jindo juibul e_jwi e_beoseot e_haepari e_hwajwi',
    m: 'bitjaru jangdok neoguri megi dalgyal idkki sapsal cheongdok hongdok buheong yeowoo sudal geobuk gureongi jine muneo cheonyeo mulgwi chorong maetdol eunin hwaro geumdu geumdok maegu eopgu jowang e_dwaeji e_sandok e_mulgwi e_jipge e_agwi e_buldok e_yongam e_hwabak e_wonhon e_dalgyal e_haegol e_neukdae e_cheondung e_gureum',
    l: 'jangseung hak noru bandal kkotsasum dueok yongma bulgom cheonghak mokgak haetae bulgasari samjok jangsan sangun yongwang dokdaejang yeomra e_seoksang e_geumgang e_saja',
    xl: 'geuseundae imugi cheongryong baekho jujak hyeonmu girin cheonho e_heukgom e_daemuneo e_hwasan e_noesin',
    xxl: 'hwangryong r_heugimugi r_gumiho',
  };
  const o = {};
  for (const [k, v] of Object.entries(t)) for (const id of v.split(' ')) o[id] = k;
  return o;
})();
const sizeOf = id => SIZE_H[SIZE_CLASS[id] || (ENEMY_MAP[id] && ENEMY_MAP[id].boss ? 'xl' : 'm')];

// ===== 추가 챕터 6~20 (적 75종) =====
// [속성, 챕터 이름, [[id, 이름, 체형, 색, 장식, 그림 설명(영문)] x5 (마지막은 보스)]]
const MORE_CHAPTERS = [
  ['water', '설산', [
    ['e_nungwi', '눈귀신', 'ghost', ['#e8f4ff', '#ffffff', '#5fa8e0'], ['icicle'], 'a snow ghost made of swirling snow'],
    ['e_eoreumneukdae', '얼음늑대', 'quad', ['#bfe0f4', '#ffffff', '#3a6a9a'], ['ears_fox', 'crystal', 'tail_big'], 'an ice wolf with crystal spikes on its back'],
    ['e_seorin', '설인', 'bear', ['#f0f4f8', '#ffffff', '#7a8aa0'], ['ears_round', 'shaggy'], 'a shaggy white yeti'],
    ['e_godeureumbak', '고드름박쥐', 'bat', ['#8ab8e0', '#e0f0ff', '#2a4a7a'], ['ears_bat', 'icicle'], 'an icicle bat with frozen wings'],
    ['e_bingryong', '빙룡', 'dragon', ['#9ad0f4', '#ffffff', '#3a7ac0'], ['horns_deer', 'mane_wave', 'whiskers'], 'BOSS: a frost dragon breathing icy mist'],
  ]],
  ['grass', '대나무 숲', [
    ['e_juksun', '죽순귀', 'blob', ['#a8c860', '#e8f0b0', '#5a7a2a'], ['leaf'], 'a bamboo shoot imp with angry eyes'],
    ['e_salkwaeng', '살쾡이', 'quad', ['#c89a5a', '#f0e0c0', '#3a2a1a'], ['ears_fox', 'stripes', 'tail_big'], 'a fierce Korean wildcat (salkwaengi)'],
    ['e_cheongsa', '청사', 'serpent', ['#5ac05a', '#d8f0a0', '#2a6a2a'], ['scales'], 'a green bamboo viper'],
    ['e_chik', '칡넝쿨귀', 'golem', ['#4a8a3a', '#8ac06a', '#2a4a1a'], ['moss'], 'a creature made of tangled arrowroot vines'],
    ['e_daejeong', '대나무 정령', 'golem', ['#7ab04a', '#c8e090', '#f2c14e'], ['moss'], 'BOSS: a giant bamboo spirit giant with bamboo-stalk limbs'],
  ]],
  ['dark', '도깨비 시장', [
    ['e_yeopdo', '엽전도둑', 'goblin', ['#6a5a8a', '#b0a0d0', '#f2c14e'], ['horn1', 'club'], 'a sneaky little dokkaebi thief carrying a coin bag'],
    ['e_noreum', '노름도깨비', 'goblin', ['#8a3a4a', '#d07a8a', '#2a1a1a'], ['horns2', 'club'], 'a gambling dokkaebi holding dice'],
    ['e_talgwi', '탈귀신', 'mask', ['#d8c0a0', '#f4e4c8', '#5a2a2a'], [], 'a creepy floating mask ghost with ribbons'],
    ['e_sulbyeong', '술병요괴', 'gourd', ['#7a9a5a', '#c8d8a0', '#d8463a'], [], 'a drunk rice-wine bottle yokai with a red face'],
    ['e_sijangdumok', '시장 두목', 'goblin', ['#3a2a5a', '#7a6aa0', '#f2c14e'], ['horns2', 'club_gold', 'cape'], 'BOSS: the market boss dokkaebi with a golden club and fur cape'],
  ]],
  ['water', '용궁', [
    ['e_haemabyeong', '해마병사', 'fish', ['#e8a03a', '#fff0c0', '#8a4a1a'], ['finbig'], 'a seahorse soldier holding a tiny spear'],
    ['e_jaradaesin', '자라대신', 'turtle', ['#6a8a5a', '#d8d0a0', '#3a4a2a'], ['whiskers'], 'a softshell turtle minister in an official hat'],
    ['e_jogaemusa', '조개무사', 'crab', ['#d8b0c0', '#fff0f4', '#8a5a6a'], [], 'a clam warrior with shell armor and a sword'],
    ['e_galchi', '갈치검객', 'fish', ['#d0d8e8', '#ffffff', '#6a7a9a'], ['teeth'], 'a silver cutlassfish swordsman'],
    ['e_sangeojang', '상어장군', 'fish', ['#5a6a8a', '#d8e0f0', '#d8463a'], ['teeth', 'finbig'], 'BOSS: a shark general in red armor'],
  ]],
  ['dark', '저승길', [
    ['e_mangja', '망자', 'ghost', ['#9aa0b8', '#d0d4e0', '#3a3a4a'], [], 'a wandering dead spirit in a mourning robe'],
    ['e_haegolma', '해골말', 'horse', ['#e0dcd0', '#ffffff', '#3a3a3a'], ['mane_wave'], 'a skeleton horse with blue ghost-fire mane'],
    ['e_sasingyeon', '저승개', 'quad', ['#2a2a3a', '#5a5a6a', '#ff3a3a'], ['ears_fox', 'mane_back'], 'a black hellhound with glowing red eyes'],
    ['e_jeoseungsae', '저승새', 'bird', ['#3a3a5a', '#7a7a9a', '#7ad8ff'], [], 'a dark spirit bird trailing blue soul fire'],
    ['e_pangwan', '저승 판관', 'reaper', ['#2a1a1a', '#5a3a3a', '#f2c14e'], ['gat'], 'BOSS: an underworld judge holding a judgment brush and scroll'],
  ]],
  ['fire', '숯가마 마을', [
    ['e_sutgeom', '숯검댕이', 'blob', ['#2a2a2a', '#5a5a5a', '#ff7a2a'], [], 'a soot sprite with glowing ember eyes'],
    ['e_bulnabang', '불나방', 'insect', ['#d86a2a', '#ffd07a', '#5a2a1a'], ['antenna', 'butterfly'], 'a fire moth with burning wings'],
    ['e_gamasot', '가마솥귀', 'jar', ['#3a3a3a', '#6a6a6a', '#ff7a2a'], ['coals'], 'a big iron cauldron yokai bubbling with fire'],
    ['e_hwadeok', '화덕도깨비', 'goblin', ['#c8401a', '#ff9a6a', '#2a1a1a'], ['horn1', 'club', 'flame'], 'a furnace dokkaebi with a burning club'],
    ['e_bulyeoudaemo', '불여우 대모', 'fox', ['#ff6a2a', '#ffe0c0', '#ffd23f'], ['ears_fox', 'tail_fox', 'foxfire'], 'BOSS: a fire fox matriarch with five flaming tails'],
  ]],
  ['light', '폐사찰', [
    ['e_mogeo', '목어귀', 'fish', ['#a87a4a', '#d8b080', '#5a3a1a'], [], 'a wooden fish (mogeo) temple ornament come alive'],
    ['e_seokdeung', '석등귀', 'lantern', ['#a8a8a0', '#ffe9a0', '#6a6a64'], ['flame'], 'a stone lantern yokai with a flickering light'],
    ['e_punggyeong', '풍경귀', 'lantern', ['#c8a050', '#fff0c0', '#5a4a2a'], ['tassel'], 'a wind-chime spirit with a fish-shaped clapper'],
    ['e_seoktap', '석탑골렘', 'golem', ['#9a9a90', '#c8c8c0', '#5a5a54'], ['cracks'], 'a stone pagoda golem'],
    ['e_beomjong', '범종귀', 'jar', ['#7a5a2a', '#c8a050', '#f2c14e'], [], 'BOSS: a giant bronze temple bell yokai with a booming shockwave'],
  ]],
  ['grass', '늪지', [
    ['e_geomeori', '거머리', 'centipede', ['#4a3a2a', '#8a6a4a', '#d83a3a'], [], 'a giant swamp leech'],
    ['e_neupdu', '늪두꺼비', 'toad', ['#5a6a3a', '#a8b07a', '#2a3a1a'], ['spots'], 'a swamp toad covered in moss'],
    ['e_ikkigol', '이끼골렘', 'golem', ['#4a6a3a', '#7a9a5a', '#2a4a1a'], ['moss'], 'a mossy mud golem'],
    ['e_mulbaem', '물뱀', 'serpent', ['#3a5a4a', '#8ab0a0', '#1a2a2a'], ['scales'], 'a dark water snake'],
    ['e_neupjuin', '늪의 주인', 'fish', ['#4a4a3a', '#8a8a6a', '#f2c14e'], ['whiskers', 'teeth'], 'BOSS: a colossal swamp catfish lord'],
  ]],
  ['water', '폭풍 바다', [
    ['e_haejeokdok', '해적도깨비', 'goblin', ['#3a6a8a', '#8ab0c8', '#d8463a'], ['horn1', 'club'], 'a pirate dokkaebi with an eyepatch'],
    ['e_badabaem', '바다뱀', 'serpent', ['#2a6a8a', '#8ad0e8', '#f2c14e'], ['scales', 'mane_wave'], 'a sea serpent with fins'],
    ['e_haegolseonwon', '해골선원', 'goblin', ['#e0dcd0', '#ffffff', '#3a6a8a'], ['bones'], 'a skeleton sailor with a cutlass'],
    ['e_pokpungsae', '폭풍새', 'bird', ['#4a5a7a', '#c8d0e8', '#ffe066'], ['bolt'], 'a storm petrel crackling with lightning'],
    ['e_daewangojing', '대왕오징어', 'octo', ['#c84a5a', '#f0a0a8', '#3a1a2a'], [], 'BOSS: a giant squid wrapping a ship mast'],
  ]],
  ['light', '하늘 성채', [
    ['e_cheonma', '천마', 'horse', ['#f4f4f8', '#ffffff', '#ffd23f'], ['mane_wave'], 'a white heavenly horse (cheonma) with wings'],
    ['e_beongaejeong', '번개정령', 'wisp', ['#ffe066', '#ffffff', '#4a5ad8'], [], 'a lightning spirit'],
    ['e_geumhak', '금빛학', 'crane', ['#f2c14e', '#fff0b0', '#d8263a'], [], 'a golden crane'],
    ['e_gureumgisa', '구름기사', 'goblin', ['#d8e0f0', '#ffffff', '#4a6ad8'], ['armor', 'helm', 'spear'], 'a cloud knight in white armor'],
    ['e_cheondungjang', '천둥장군', 'golem', ['#3a4a8a', '#8a9ae0', '#ffe066'], ['bolt', 'drums'], 'BOSS: a thunder general giant with lightning drums'],
  ]],
  ['fire', '용암 동굴', [
    ['e_yongamseul', '용암슬라임', 'blob', ['#ff6a1a', '#ffd07a', '#5a1a0a'], ['magma'], 'a lava slime'],
    ['e_hwaedomaem', '화염도마뱀', 'quad', ['#d84a1a', '#ffb07a', '#3a1a0a'], ['spikes', 'tail_thick'], 'a fire lizard with spiky back'],
    ['e_heugyoseok', '흑요석골렘', 'golem', ['#2a2a3a', '#4a4a5a', '#ff4a1a'], ['magma'], 'an obsidian golem with lava cracks'],
    ['e_bulbak', '불박쥐', 'bat', ['#5a1a1a', '#c84a2a', '#ffb020'], ['ears_bat', 'flame'], 'a burning cave bat'],
    ['e_hwaryong', '화룡', 'dragon', ['#d8321a', '#ffb07a', '#ffd23f'], ['horns_deer', 'mane_wave'], 'BOSS: a fire dragon emerging from magma'],
  ]],
  ['dark', '그림자 궁궐', [
    ['e_geurimjamusa', '그림자 무사', 'goblin', ['#2a2a3a', '#4a4a6a', '#ff3a5a'], ['helm', 'spear'], 'a shadow palace guard'],
    ['e_gungnyeo', '저주받은 궁녀', 'ghostlady', ['#e8d8e8', '#ffffff', '#3a1a2a'], [], 'a cursed court lady ghost in faded hanbok'],
    ['e_geomeungoyang', '검은 고양이', 'quad', ['#1a1a24', '#3a3a4a', '#ffd23f'], ['ears_fox', 'tail_thin'], 'a black cat yokai with two tails'],
    ['e_yuryeongdeung', '유령등불', 'lantern', ['#3a3a5a', '#7ad8ff', '#1a1a2a'], ['flame'], 'a ghostly palace lantern with blue fire'],
    ['e_geurimjawang', '그림자 왕', 'shadow', ['#1a1424', '#3a2a4a', '#ffd23f'], [], 'BOSS: the shadow king wearing a dark crown'],
  ]],
  ['grass', '신령의 산', [
    ['e_sanyang', '산양', 'quad', ['#d8d0c0', '#f4f0e8', '#5a4a3a'], ['horns2', 'shaggy'], 'a long-haired mountain goat'],
    ['e_namugwi', '나무귀', 'golem', ['#6a4a2a', '#9a7a4a', '#4a8a3a'], ['moss'], 'a walking tree spirit (treant)'],
    ['e_beoseotgun', '버섯군락', 'blob', ['#c8a080', '#f0e0d0', '#d8463a'], ['mushroom'], 'a cluster of mushroom spirits'],
    ['e_sankkamagwi', '산까마귀', 'bird', ['#1a1a24', '#3a3a4a', '#ffb020'], [], 'a mountain raven'],
    ['e_sansin', '산신 거목', 'golem', ['#4a6a2a', '#8ab05a', '#f2c14e'], ['moss'], 'BOSS: an ancient mountain-god tree with a face and white beard of moss'],
  ]],
  ['water', '빙하 동굴', [
    ['e_eoreumge', '얼음게', 'crab', ['#a8d8f4', '#ffffff', '#3a7ac0'], [], 'an ice crab with crystal claws'],
    ['e_sujeongbak', '수정박쥐', 'bat', ['#9ad0f4', '#e0f4ff', '#5a3aa0'], ['ears_bat'], 'a crystal bat'],
    ['e_seolnyeo', '설녀', 'ghostlady', ['#e8f4ff', '#ffffff', '#3a6a9a'], [], 'a snow woman spirit with icy breath'],
    ['e_eoreumgeobuk', '얼음거북', 'turtle', ['#8ab8d8', '#e0f0ff', '#3a5a7a'], [], 'an ice turtle with a glacier shell'],
    ['e_binghageoin', '빙하 거인', 'golem', ['#9ac8e8', '#e0f4ff', '#3a6a9a'], ['cracks'], 'BOSS: a glacier giant'],
  ]],
  ['light', '혼돈의 문', [
    ['e_hondonsu', '혼돈수', 'lion', ['#7a4aa0', '#c8a0e0', '#ffd23f'], ['horn1', 'mane_curl'], 'a chaos chimera beast'],
    ['e_taraksun', '타락 선녀', 'ghostlady', ['#f0e0f8', '#ffffff', '#5a2a7a'], [], 'a fallen celestial maiden with torn wings'],
    ['e_gonghonbul', '공허혼불', 'wisp', ['#8a5aff', '#e0d0ff', '#2a1a5a'], [], 'a void soul flame'],
    ['e_hondongisa', '혼돈기사', 'goblin', ['#3a2a5a', '#7a5aa0', '#ff4a8a'], ['armor', 'helm', 'spear'], 'a chaos knight in cracked dark armor'],
    ['e_hondonryong', '혼돈의 용', 'dragon', ['#5a2a8a', '#c8a0f0', '#ff4a8a'], ['horns_deer', 'mane_wave', 'whiskers'], 'BOSS: the dragon of chaos with rainbow-dark scales'],
  ]],
];
for (const [el, , list] of MORE_CHAPTERS) list.forEach(([id, n, arch, pal, feat, d], i) => {
  const e = { id, ch: el, n, arch, pal, feat, d };
  if (i === 4) e.boss = true;
  ENEMIES.push(e); ENEMY_MAP[id] = e;
});

// ===== 스테이지 구성 =====
// 챕터 하나(1-1 ~ 1-10) = 몬스터 세트 하나 (일반 4종 + 10스테이지 보스).
// 세트를 다 돌면 처음 세트로 돌아가되 더 강한 '강화' 회차가 되어 무한히 이어진다.
const BASE_CHAPTER_NAMES = { grass: '산골 마을', water: '바닷가 포구', fire: '화산 계곡', dark: '귀신 나오는 밤숲', light: '하늘 궁궐' };
const ENEMY_SETS = ELEMENT_ORDER.map(el => ({
  el, name: BASE_CHAPTER_NAMES[el],
  normals: ENEMIES.filter(e => e.ch === el && !e.boss && !e.raid && !e.d).map(e => e.id),
  boss: ENEMIES.find(e => e.ch === el && e.boss && !e.d).id,
})).concat(MORE_CHAPTERS.map(([el, name, list]) => ({ el, name, normals: list.slice(0, 4).map(x => x[0]), boss: list[4][0] })));
