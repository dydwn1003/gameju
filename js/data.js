// ===== 게임 데이터 정의 =====
const SAVE_KEY = 'monster_idle_v1';

const ELEMENTS = {
  fire:  { name: '불',   icon: '🔥', color: '#ff7a45' },
  water: { name: '물',   icon: '💧', color: '#3fa7ff' },
  grass: { name: '풀',   icon: '🌿', color: '#4cc45a' },
  light: { name: '빛',   icon: '✨', color: '#ffcf3a' },
  dark:  { name: '어둠', icon: '🌙', color: '#8a5cf0' },
};
const ELEMENT_ORDER = ['grass', 'water', 'fire', 'dark', 'light'];
// 공격 속성 → 유리한 상대 속성
const ADV = { fire: 'grass', grass: 'water', water: 'fire', light: 'dark', dark: 'light' };

const RARITY = {
  N:   { rate: 52,  color: '#9aa5b1', base: { atk: 10, hp: 80,  def: 4 } },
  R:   { rate: 31,  color: '#4fa3ff', base: { atk: 13, hp: 100, def: 5 } },
  SR:  { rate: 13.5, color: '#b26bff', base: { atk: 17, hp: 130, def: 7 } },
  SSR: { rate: 3,   color: '#ffb020', base: { atk: 22, hp: 170, def: 9 } },
  UR:  { rate: 0.5, color: '#ff4f8b', base: { atk: 28, hp: 220, def: 12 } },
};
const RARITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR'];

const SKILLS = {
  nuke:   { name: '필살 일격', desc: '적 1명에게 공격력 320% 피해' },
  blast:  { name: '광역 폭발', desc: '모든 적에게 공격력 140% 피해' },
  heal:   { name: '치유의 빛', desc: '아군 전체 회복 (가장 약한 아군은 크게 회복)' },
  shield: { name: '수호 방벽', desc: '아군 전체에게 보호막 + 적 1명 120% 피해' },
  drain:  { name: '흡혈 송곳니', desc: '적 1명 240% 피해, 피해량 60% 회복' },
};

// 몬스터 계열 (3단계 진화)
const LINES = [
  { id: 'ember',   el: 'fire',  r: 'SSR', names: ['불꼬미', '화염꼬리', '염룡제'],     shape: 'round', ear: 'pointy',  feat: 'flame',     tail: true,  skill: 'nuke',   spd: 1.1 },
  { id: 'salam',   el: 'fire',  r: 'SR',  names: ['불도롱', '화염도롱', '용암룡'],     shape: 'tall',  ear: 'none',    feat: 'horns',     tail: true,  skill: 'blast',  spd: 1.0 },
  { id: 'coal',    el: 'fire',  r: 'R',   names: ['깜부기', '숯불곰', '화산곰'],       shape: 'wide',  ear: 'round',   feat: 'flame',     skill: 'shield', spd: 0.9 },
  { id: 'firefly', el: 'fire',  r: 'N',   names: ['불똥벌레', '반딧불이', '화염나방'], shape: 'drop',  ear: 'antenna', feat: 'sparkle',   wings: true, skill: 'blast',  spd: 1.2 },
  { id: 'koi',     el: 'water', r: 'SSR', names: ['꼬마잉어', '청룡잉어', '해룡왕'],   shape: 'drop',  ear: 'none',    feat: 'whiskers',  tail: true,  skill: 'blast',  spd: 1.1 },
  { id: 'whale',   el: 'water', r: 'SR',  names: ['물방울', '파도핀', '해신고래'],     shape: 'drop',  ear: 'none',    feat: 'fins',      skill: 'heal',   spd: 1.0 },
  { id: 'icecat',  el: 'water', r: 'R',   names: ['얼음냥', '빙결묘', '설원표범'],     shape: 'round', ear: 'pointy',  feat: 'crystal',   tail: true,  skill: 'nuke',   spd: 1.2 },
  { id: 'clam',    el: 'water', r: 'N',   names: ['조개롱', '진주게', '심해크랩'],     shape: 'wide',  ear: 'none',    feat: 'shell',     skill: 'shield', spd: 0.9 },
  { id: 'golem',   el: 'grass', r: 'SSR', names: ['이끼돌', '바위골렘', '대지거신'],   shape: 'wide',  ear: 'none',    feat: 'moss',      skill: 'shield', spd: 0.85 },
  { id: 'sprout',  el: 'grass', r: 'SR',  names: ['새싹이', '잎사귀토', '숲의수호자'], shape: 'tall',  ear: 'long',    feat: 'leaf',      skill: 'heal',   spd: 1.0 },
  { id: 'shroom',  el: 'grass', r: 'R',   names: ['독버섯', '독포자', '균사마왕'],     shape: 'tall',  ear: 'none',    feat: 'mushroom',  skill: 'blast',  spd: 1.0 },
  { id: 'acorn',   el: 'grass', r: 'N',   names: ['도토롱', '도토리곰', '고목왕'],     shape: 'round', ear: 'round',   feat: 'cap',       skill: 'nuke',   spd: 1.0 },
  { id: 'angel',   el: 'light', r: 'SSR', names: ['반짝이', '빛날개', '성천사'],       shape: 'drop',  ear: 'none',    feat: 'halo',      wings: true, skill: 'heal',   spd: 1.1 },
  { id: 'deer',    el: 'light', r: 'SR',  names: ['빛사슴', '은빛사슴', '태양록'],     shape: 'tall',  ear: 'pointy',  feat: 'antlers',   skill: 'nuke',   spd: 1.15 },
  { id: 'cloud',   el: 'light', r: 'R',   names: ['솜구름', '번개구름', '뇌운신'],     shape: 'wide',  ear: 'none',    feat: 'cloud',     skill: 'blast',  spd: 1.1 },
  { id: 'star',    el: 'light', r: 'N',   names: ['별사탕', '별조각', '유성'],         shape: 'star',  ear: 'none',    feat: 'sparkle',   skill: 'nuke',   spd: 1.2 },
  { id: 'bat',     el: 'dark',  r: 'SSR', names: ['그림자', '어둠박쥐', '밤의군주'],   shape: 'round', ear: 'bat',     feat: 'fangs',     wings: true, skill: 'drain',  spd: 1.2 },
  { id: 'wolf',    el: 'dark',  r: 'SR',  names: ['밤늑대', '그림자늑대', '월식랑'],   shape: 'round', ear: 'pointy',  feat: 'mane',      tail: true,  skill: 'nuke',   spd: 1.15 },
  { id: 'ghost',   el: 'dark',  r: 'R',   names: ['꼬마유령', '망령', '명계왕'],       shape: 'ghost', ear: 'none',    feat: 'wisp',      skill: 'drain',  spd: 1.0 },
  { id: 'octo',    el: 'dark',  r: 'N',   names: ['먹물이', '먹구름문어', '심연문어'], shape: 'round', ear: 'none',    feat: 'tentacles', skill: 'blast',  spd: 0.9 },
  { id: 'dragon',  el: 'light', r: 'UR',  names: ['시원알', '시원룡', '창세룡'],       shape: 'tall',  ear: 'pointy',  feat: 'horns',     wings: true, tail: true, skill: 'blast', spd: 1.1 },
  { id: 'abyss',   el: 'dark',  r: 'UR',  names: ['심연알', '심연룡', '종말룡'],       shape: 'round', ear: 'bat',     feat: 'horns',     wings: true, tail: true, skill: 'drain', spd: 1.1 },
];
const LINE_MAP = Object.fromEntries(LINES.map(l => [l.id, l]));

// 성장 공식
const FORM_MUL = [1, 1.7, 2.8];
const FORM_CAP = [20, 40, 60];
const FORM_LABEL = ['1단계', '2단계', '3단계'];
const EVO_COST = [ { stones: 5, gold: 3000 }, { stones: 20, gold: 25000 } ];
const MAX_STAR = 5;
const DUP_SHARDS = 10;

// 탐험
const EXPEDITIONS = [
  { min: 30,  label: '30분 탐험', gems: 10,  stones: 0, mul: 1.6 },
  { min: 120, label: '2시간 탐험', gems: 40,  stones: 1, mul: 1.8 },
  { min: 480, label: '8시간 탐험', gems: 150, stones: 4, mul: 2.0 },
];

// 상점 (실결제 상품은 테스트 결제 처리)
const IAP = [
  { id: 'gem_s',   name: '젬 300',          gems: 300,  price: '₩1,200' },
  { id: 'gem_m',   name: '젬 1,500 +150',   gems: 1650, price: '₩5,900' },
  { id: 'gem_l',   name: '젬 3,300 +500',   gems: 3800, price: '₩12,000' },
  { id: 'gem_xl',  name: '젬 7,000 +1,500', gems: 8500, price: '₩29,000' },
];

// 일일 광고 제한
const AD_LIMITS = { pull: 3, gem: 5, boost: 6, idle: 10, exped: 10, raidAd: 2, arenaAd: 3, attend: 1 };
const AD_GEM_REWARD = 30;
const BOOST_MIN = 30;
const IDLE_CAP_MIN = 720; // 12시간

// 출석 (7일 주기) — goldMin/foodMin: 방치 보상 N분 어치
const ATTENDANCE = [
  { gems: 100 },
  { goldMin: 120 },
  { stones: 3 },
  { gems: 150 },
  { foodMin: 180 },
  { stones: 5, goldMin: 180 },
  { gems: 500 },
];

// 일일 퀘스트
const QUESTS = [
  { id: 'stage',   name: '스테이지 클리어',  target: 10, reward: { gems: 30 } },
  { id: 'levelup', name: '몬스터 레벨업',    target: 10, reward: { goldMin: 60 } },
  { id: 'summon',  name: '몬스터 소환',      target: 5,  reward: { gems: 30 } },
  { id: 'ad',      name: '광고 시청',        target: 3,  reward: { gems: 40 } },
  { id: 'idle',    name: '방치 보상 받기',   target: 2,  reward: { foodMin: 60 } },
  { id: 'raid',    name: '보스 레이드 도전', target: 1,  reward: { stones: 2 } },
  { id: 'arena',   name: '아레나 전투',      target: 2,  reward: { gems: 20 } },
];
const QUEST_ALL_REWARD = { gems: 100, stones: 3 };

// 보스 레이드 (요일별 보스)
const RAID = { time: 45, tickets: 3 };
const RAID_BOSSES = ['abyss', 'golem', 'koi', 'ember', 'wolf', 'deer', 'dragon']; // 일~토

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
