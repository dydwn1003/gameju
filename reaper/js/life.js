// ===== 생활 콘텐츠: 저승 꽃밭 · 저승 주막 · 졸개 파견 · 혼령 도감 =====
const FLOWERS = [
  { id: 'mang', name: '망각초', grow: 10 * 60, yield: [3, 5], soul: 120, pal: { P: '#a8d8ff', p: '#5a8ad0', y: '#ffffff' }, desc: '망각의 강가에 피는 푸른 풀' },
  { id: 'lotus', name: '저승 연꽃', grow: 60 * 60, yield: [2, 4], soul: 600, pal: { P: '#ffa8d0', p: '#d05a90', y: '#ffe08a' }, desc: '삼도천 물가의 분홍 연꽃' },
  { id: 'honbul', name: '혼불꽃', grow: 4 * 3600, yield: [2, 3], jade: 30, pal: { P: '#7fe8ff', p: '#2a8ac0', y: '#ffffff' }, desc: '혼불을 머금고 피는 꽃' },
  { id: 'saengsa', name: '생사화', grow: 12 * 3600, yield: [1, 2], jade: 80, pal: { P: '#ff4a5a', p: '#a01828', y: '#ffd34a' }, desc: '삶과 죽음을 잇는 붉은 꽃' },
];
const RECIPES = [
  { id: 'mangtang', name: '망각탕', need: { mang: 3 }, buff: 'value', min: 30, desc: '30분간 혼 수확 +50%' },
  { id: 'lotustea', name: '연꽃차', need: { lotus: 2, mang: 2 }, buff: 'spawn', min: 30, desc: '30분간 혼령 출현·걸음 +40%' },
  { id: 'honju', name: '혼불주', need: { honbul: 2 }, buff: 'fight', min: 60, desc: '60분간 원귀 퇴치 화력 ×3' },
  { id: 'saengdan', name: '생사단', need: { saengsa: 1, lotus: 2 }, instant: { hours: 3, jade: 20 }, desc: '3시간치 혼 + 옥 20 즉시 획득' },
];
const BUFF_NAME = { value: '망각탕', spawn: '연꽃차', fight: '혼불주' };
// 파견: 가장 짧은 것도 3시간. 보상(hours = 몇 시간치 혼)은 걸리는 시간의 약 1/8. 칸이 최대 5개라 동시에 돌리면 쌓이므로 낮게 잡음
const EXPEDITIONS = [
  { id: 'e0', name: '이승 마을 순찰', rank: 0, hrs: 3, minion: 1, seed: { mang: 4 }, hours: 0.15, jade: 3 },
  { id: 'e1', name: '서낭당 고갯길 수색', rank: 2, hrs: 6, minion: 3, seed: { lotus: 3, mang: 2 }, hours: 0.3, jade: 6 },
  { id: 'e2', name: '삼도천 뱃길 순찰', rank: 4, hrs: 9, minion: 6, seed: { honbul: 2, lotus: 1 }, hours: 0.4, jade: 10 },
  { id: 'e3', name: '저승문 경비', rank: 6, hrs: 14, minion: 10, seed: { saengsa: 1, honbul: 2 }, hours: 0.65, jade: 16 },
  { id: 'e4', name: '명부전 심부름', rank: 7, hrs: 24, minion: 15, seed: { saengsa: 2, honbul: 1 }, hours: 1.05, jade: 30, dex: 1 },
];
const SPECIALS = [
  ['아이 혼', '댕기를 맨 꼬마 혼령', 0], ['할아버지 혼', '하얀 수염의 혼령', 0], ['선비 혼', '갓을 쓴 글공부 혼령', 1], ['신부 혼', '족두리를 쓴 혼령', 1],
  ['군졸 혼', '전립을 쓴 병사 혼령', 2], ['어부 혼', '삿갓 쓴 뱃사람 혼령', 4], ['상인 혼', '돈주머니를 찬 혼령', 1], ['스님 혼', '염주를 건 혼령', 2],
  ['무희 혼', '부채를 든 춤꾼 혼령', 3], ['주정뱅이 혼', '술잔을 든 혼령', 1], ['고양이 혼', '귀가 쫑긋한 혼령', 0], ['강아지 혼', '귀가 늘어진 혼령', 3],
  ['약초꾼 혼', '머리에 잎이 난 혼령', 5], ['장군 혼', '금빛 투구의 혼령', 6], ['기생 혼', '비녀를 꽂은 혼령', 5],
  ['도깨비 혼', '뿔 달린 장난꾸러기 혼령', 7], ['용의 혼', '용의 뿔이 난 혼령', 8], ['태고의 혼', '아주 오래된 보랏빛 혼령', 8],
].map(([name, desc, region], i) => ({ i, name, desc, region }));
const PLOT_COST = [0, 0, 0, 100, 200, 400]; // 옥으로 여는 밭
// 일일 의뢰 (게시판): 하루 4개, 모두 끝내면 보너스
const QUEST_POOL = [
  { id: 'soul', name: '혼 거두기', need: [500, 1000, 2000], jade: 15 },
  { id: 'tap', name: '혼령을 직접 터치해서 거두기', need: [20, 40], jade: 15 },
  { id: 'wraith', name: '원귀 퇴치하기', need: [2, 3], jade: 20 },
  { id: 'harvest', name: '꽃밭에서 꽃 수확하기', need: [2, 3], jade: 20 },
  { id: 'brew', name: '주막에서 탕약 달이기', need: [1, 2], jade: 20 },
  { id: 'send', name: '졸개 파견 보내기', need: [1, 2], jade: 20 },
  { id: 'buy', name: '수련 올리기', need: [15, 30], jade: 15 },
  { id: 'ad', name: '2배 부적 쓰기', need: [1], jade: 25 },
  { id: 'judge', name: '집무실에서 망자 심판하기', need: [2, 3], jade: 20 },
  { id: 'docs', name: '집무실 결재 서류 처리하기', need: [1], jade: 20 },
];
const QUEST_BONUS = 60;
// 무당 운세 (하루 1번 무료 + 광고로 1번 더)
const FORTUNES = [
  { name: '대길', p: 0.06, mul: 2, min: 60, text: '하늘이 돕는 날! 1시간 동안 혼 수확 2배' },
  { name: '길', p: 0.24, mul: 1.5, min: 60, text: '좋은 기운이 감도네. 1시간 동안 혼 수확 +50%' },
  { name: '소길', p: 0.4, mul: 1.25, min: 60, text: '소소한 복이 있겠어. 1시간 동안 혼 수확 +25%' },
  { name: '평', p: 0.25, mul: 1.2, min: 30, text: '무난한 하루. 30분 동안 혼 수확 +20%' },
  { name: '흉', p: 0.05, mul: 1, min: 0, jade: 30, text: '액운이 끼었으니 부적값을 주지. 옥 30개' },
];
const MAIL_EVERY = 4 * 3600e3, MAIL_MAX = 3;
// 도깨비 상인 (가끔 노점에 들름)
const MERCHANT_POOL = [
  { id: 'm_honbul', name: '혼불꽃 씨앗 ×2', jade: 35, seed: { honbul: 2 } },
  { id: 'm_saengsa', name: '생사화 씨앗 ×1', jade: 50, seed: { saengsa: 1 } },
  { id: 'm_mang', name: '망각초 씨앗 ×5', soul: 200, seed: { mang: 5 } },
  { id: 'm_lotus', name: '저승 연꽃 씨앗 ×3', soul: 900, seed: { lotus: 3 } },
  { id: 'm_time', name: '2시간치 혼 보따리', jade: 60, hours: 2 },
  { id: 'm_jade', name: '옥 15개', soul: 1500, jadeGet: 15 },
  { id: 'm_honju', name: '혼불주 한 병 (60분 화력 ×3)', jade: 40, buff: ['fight', 60] },
  { id: 'm_mangtang', name: '망각탕 한 사발 (30분 수확 +50%)', soul: 600, buff: ['value', 30] },
];


// ===== 망자 심판: 하루 5명, 생전 기록을 보고 극락/지옥을 가린다 =====
const JUDGE_CASES = [
  ['나루터 김 영감', 72, '평생 나룻배로 사람들을 건네주며 뱃삯을 한 번도 받지 않았다.', 1],
  ['장터 박 서방', 45, '저울 밑에 돌을 붙여 30년 동안 손님을 속였다.', 0],
  ['이 총각', 30, '불난 초가에 뛰어들어 아이 둘을 구하고 숨을 거뒀다.', 1],
  ['최 부자', 60, '병든 부모를 헛간에 내쫓고 곳간 열쇠만 챙겼다.', 0],
  ['정 할머니', 80, '혼자 마을 우물을 파고 누구든 물을 길어 가게 했다.', 1],
  ['강 씨', 38, '남의 논물을 몰래 끌어다 쓰고 들키자 이웃에게 뒤집어씌웠다.', 0],
  ['윤 진사', 55, '흉년이 들자 곳간을 열어 마을 사람들에게 쌀을 나눴다.', 1],
  ['장 한량', 41, '노름으로 집을 날리고 아내의 혼수 패물까지 들고 나갔다.', 0],
  ['한 훈장', 66, '가난한 집 아이들을 서당에 공짜로 받아 글을 가르쳤다.', 1],
  ['오 대감', 50, '비싼 이자로 돈을 빌려주고 과부의 집을 빼앗았다.', 0],
  ['서 소녀', 19, '병든 어머니에게 드릴 약초를 캐러 벼랑에 올랐다가 떨어졌다.', 1],
  ['신 아전', 47, '뇌물을 받고 죄 없는 사람을 옥에 가뒀다.', 0],
  ['권 노인', 70, '길 잃은 강아지와 고아를 가리지 않고 거둬 키웠다.', 1],
  ['황 씨', 35, '이웃집 소를 훔쳐 팔고는 도둑이 들었다며 함께 울어 줬다.', 0],
  ['안 보살', 58, '마을 개울에 돌다리를 놓으려고 전 재산을 내놓았다.', 1],
  ['송 씨', 44, '친구를 보증 세워 큰돈을 빌린 뒤 밤에 몰래 달아났다.', 0],
  ['류 의원', 63, '역병이 돌 때 모두 떠난 마을에 남아 끝까지 환자를 돌봤다.', 1],
  ['가짜 박수', 52, '무당 행세를 하며 굿값으로 아픈 사람들의 돈을 뜯었다.', 0],
  ['전 효자', 29, '아버지 무덤 옆에 움막을 짓고 3년 동안 시묘살이를 했다.', 1],
  ['고 씨', 39, '담뱃불로 산불을 내고 모른 척 도망쳤다.', 0],
  ['문 할아버지', 75, '평생 짚신을 삼아 지나가는 길손에게 나눠 줬다.', 1],
  ['양 도굴꾼', 48, '남의 조상 묘를 파헤쳐 부장품을 훔쳐 팔았다.', 0],
  ['허 서방', 51, '저승사자에게 "노잣돈을 두 배로 줄 테니 극락으로 보내 달라"고 속삭였다.', 0],
  ['남 주모', 57, '돈 없는 나그네에게도 국밥 한 그릇은 꼭 말아 줬다.', 1],
  ['배 장군', 46, '전쟁터에서 부하들을 먼저 피신시키고 마지막까지 성문을 지켰다.', 1],
  ['구 씨', 33, '물에 빠진 사람을 보고도 옷이 젖는다며 그냥 지나쳤다.', 0],
];

const Life = (() => {
  const S = () => Game.S;
  const now = () => Date.now();
  function ensure() {
    const s = S();
    s.plots = s.plots || 3;
    s.garden = s.garden || [];
    while (s.garden.length < 6) s.garden.push(null);
    s.seeds = s.seeds || { mang: 3 };
    s.flowers = s.flowers || {};
    s.buffs = s.buffs || {};
    s.expe = s.expe || [];
    s.dex = s.dex || {};
    s.merchant = s.merchant || { next: now() + 3 * 60e3, until: 0, offers: [], bought: [] };
    questDay();
    s.fortune = s.fortune || { day: '', n: 0, mul: 1, until: 0, last: '' };
    s.offer = s.offer || { day: '', small: 0, big: 0 };
    s.mail = s.mail || { last: now() - MAIL_EVERY };
    s.docs = s.docs || { last: now() - 2 * 3600e3 };
  }
  const dayStr = () => new Date().toISOString().slice(0, 10);

  // ---------- 무당: 오늘의 운세 ----------
  function fortuneLeft() { const f = S().fortune; if (f.day !== dayStr()) { f.day = dayStr(); f.n = 0; } return 2 - f.n; }
  function drawFortune() {
    if (fortuneLeft() <= 0) return null;
    const f = S().fortune; f.n++;
    let r = Math.random(), F = FORTUNES[FORTUNES.length - 1];
    for (const x of FORTUNES) { if (r < x.p) { F = x; break; } r -= x.p; }
    if (F.min) { f.mul = F.mul; f.until = now() + F.min * 60e3; }
    if (F.jade) S().jade += F.jade;
    f.last = F.name; Game.apply(); Game.save(); return F;
  }
  const fortuneMul = () => { const f = S() && S().fortune; return f && now() < f.until ? f.mul : 1; };

  // ---------- 산신령: 공양 (혼 → 옥) ----------
  function offerState() { const o = S().offer; if (o.day !== dayStr()) { o.day = dayStr(); o.small = 0; o.big = 0; } return { small: 3 - o.small, big: 1 - o.big, smallCost: Math.max(200, Math.ceil(Game.incomePerSec(true) * 600)), bigCost: Math.max(1000, Math.ceil(Game.incomePerSec(true) * 3600)) }; }
  function offer(kind) {
    const st = offerState(), s = S();
    if (kind === 'small') { if (st.small <= 0 || s.souls < st.smallCost) return null; s.souls -= st.smallCost; s.offer.small++; s.jade += 10; Game.save(); return { jade: 10 }; }
    if (st.big <= 0 || s.souls < st.bigCost) return null; s.souls -= st.bigCost; s.offer.big++; s.jade += 50; s.tickets = (s.tickets || 0) + 1; Game.save(); return { jade: 50, ticket: 1 };
  }

  // ---------- 까치 우체부: 4시간마다 선물 (최대 3통) ----------
  const mailCount = () => { const m = S() && S().mail; return m ? Math.min(MAIL_MAX, Math.floor((now() - m.last) / MAIL_EVERY)) : 0; };
  function openMail() {
    const n = mailCount(); if (!n) return null;
    const s = S(), gifts = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      if (r < 0.1) { s.tickets = (s.tickets || 0) + 1; gifts.push('펫 소환권 1장'); }
      else if (r < 0.4) { const j = 10 + Math.floor(Math.random() * 11); s.jade += j; gifts.push(`옥 ${j}개`); }
      else if (r < 0.7) { const f = ['mang', 'lotus', 'honbul'][Math.floor(Math.random() * 3)], k = f === 'honbul' ? 1 : 3; s.seeds[f] = (s.seeds[f] || 0) + k; gifts.push(`${FLOWERS.find(x => x.id === f).name} 씨앗 ${k}개`); }
      else { const a = Game.incomePerSec(true) * 1800; Game.gain(a); gifts.push(`혼 ${fmt(a)} (30분치)`); }
    }
    s.mail.last = Math.max(s.mail.last + n * MAIL_EVERY, now() - MAIL_EVERY * (MAIL_MAX - 1));
    if (n >= MAIL_MAX) s.mail.last = now();
    Game.save(); return gifts;
  }
  // ---------- 집무실 결재함: 2시간마다 서류 1건 (최대 3건), 계급이 높을수록 보상 큼 ----------
  const DOC_EVERY = 2 * 3600e3;
  // 서류 1건 보상 = 몇 초치 혼. 처음엔 적게, 계급이 오를수록 늘어남 (2시간마다 1건, 최대 3건 쌓임)
  const DOC_SEC = [21, 35, 53, 77, 105, 133, 168, 210, 252]; // 결재 1건 = 몇 초치 혼
  const docsCount = () => { const d = S() && S().docs; return d ? Math.min(3, Math.floor((now() - d.last) / DOC_EVERY)) : 0; };
  function claimDocs() {
    const n = docsCount(); if (!n) return null;
    const s = S(), souls = Game.incomePerSec(true) * DOC_SEC[Math.min(8, s.rank)] * n, jade = (2 + s.rank) * n;
    Game.gain(souls); s.jade += jade;
    s.docs.last = n >= 3 ? now() : s.docs.last + n * DOC_EVERY; Game.save(); return { n, souls, jade };
  }
  const docsNext = () => Math.max(0, DOC_EVERY - ((now() - S().docs.last) % DOC_EVERY)) / 1000;
  const mailNext = () => { const m = S().mail; return Math.max(0, MAIL_EVERY - ((now() - m.last) % MAIL_EVERY)) / 1000; };

  // ---------- 지도 소품 살펴보기: 나무·항아리·장승·돌탑·석상·석등·가마솥·나룻배 ----------
  const PROP = {
    tree: { cd: 15 * 60, name: '나무' }, jars: { cd: 30 * 60, name: '항아리' }, jangseung: { cd: 4 * 3600, name: '장승' },
    cairn: { cd: 6 * 3600, name: '돌탑' }, statue: { cd: 2 * 3600, name: '망각의 석상' }, lamp: { cd: 3600, name: '석등' },
    cauldron: { cd: 3600, name: '가마솥' }, boat: { cd: 3600, name: '빈 나룻배' },
  };
  const STATUE_LINES = ['"…이름을 잃은 혼이 여기 서서 오래 울었지…"', '"…먹물이 번지는 밤엔 혼들이 사라진다…"', '"…기다림도 미련이다. 그러나 다정한 미련이다…"', '"…강 건너에서 누군가 아직 네 이름을 부른다…"', '"…가장 무거운 짐은 내려놓은 기억이다…"'];
  const propReady = key => now() >= ((S().props || {})[key] || 0);
  const propLeft = key => Math.max(0, (((S().props || {})[key] || 0) - now()) / 1000);
  // 결과: { msg, souls, jade, ticket, seed, buff, wraith, lit }
  function useProp(kind, key, lampsLit, lampsAll) {
    const s = S(), P = PROP[kind]; if (!P || !propReady(key)) return null;
    s.props = s.props || {}; s.props[key] = now() + P.cd * 1000;
    const inc = Game.incomePerSec(true), r = Math.random(), out = { msg: '' };
    const souls = sec => { out.souls = inc * sec; Game.gain(out.souls); };
    const jade = n => { out.jade = n; s.jade += n; };
    const seed = (f, n) => { s.seeds[f] = (s.seeds[f] || 0) + n; out.seed = `${FLOWERS.find(x => x.id === f).name} 씨앗 ${n}`; };
    const buff = (k, min) => { s.buffs[k] = Math.min(now() + 4 * 3600e3, Math.max(now(), s.buffs[k] || 0) + min * 60e3); out.buff = k; };
    if (kind === 'tree') {
      if (r < 0.03) { souls(300); out.msg = '✨ 황금 열매가 떨어졌다!'; }
      else if (r < 0.13) { jade(1 + (Math.random() < 0.4 ? 1 : 0)); out.msg = '나뭇가지에 옥이 걸려 있었다'; }
      else if (r < 0.33) { seed(Math.random() < 0.8 ? 'mang' : 'lotus', 1); out.msg = '씨앗이 툭 떨어졌다'; }
      else { souls(45); out.msg = '숨어 있던 혼령들이 우수수!'; }
    } else if (kind === 'jars') {
      if (r < 0.02) { s.tickets = (s.tickets || 0) + 1; out.ticket = 1; out.msg = '🎉 항아리 속에 소환권이!'; }
      else if (r < 0.22) { jade(3); out.msg = '항아리 바닥에 옥이 있었다'; }
      else if (r < 0.3) out.msg = '텅 비었다… 도깨비가 먼저 다녀갔나 보다';
      else { souls(120); out.msg = '항아리에 갇힌 혼령들을 풀어 줬다'; }
    } else if (kind === 'jangseung') { buff('spawn', 10); out.msg = '장승에게 절했다. 10분 동안 혼령이 더 자주 나타난다'; }
    else if (kind === 'cairn') {
      if (r < 0.1) { s.tickets = (s.tickets || 0) + 1; out.ticket = 1; out.msg = '돌탑에 소원을 빌었다… 소원이 이루어졌다!'; }
      else if (r < 0.5) { jade(5); out.msg = '돌탑 사이에서 옥을 찾았다'; }
      else { souls(300); out.msg = '돌을 하나 얹자 혼령들이 모여들었다'; }
    } else if (kind === 'statue') { jade(2); out.msg = '석상이 속삭인다. ' + STATUE_LINES[Math.floor(Math.random() * STATUE_LINES.length)]; }
    else if (kind === 'lamp') {
      out.lit = true;
      if (lampsLit + 1 >= lampsAll) { buff('spawn', 15); jade(5); out.msg = `🏮 석등 ${lampsAll}개에 모두 불이 켜졌다! 15분 동안 혼령이 더 자주 나타난다`; }
      else out.msg = `석등에 불을 밝혔다 (${lampsLit + 1}/${lampsAll}) · 모두 켜면 축복이 내린다`;
    } else if (kind === 'cauldron') { out.wraith = true; out.msg = '가마솥에서 갇혀 있던 원귀가 튀어나왔다!'; }
    else if (kind === 'boat') {
      if (r < 0.3) { seed('honbul', 1); out.msg = '배 안에서 유실물을 건졌다'; }
      else if (r < 0.6) { jade(3); out.msg = '뱃삯으로 남겨진 옥을 찾았다'; }
      else { souls(180); out.msg = '배에 남아 있던 혼령들을 거뒀다'; }
    }
    qEvent('prop'); Game.save(); return out;
  }

  // ---------- 시간 단축 (옥: 10분당 20개 · 광고: 30분 단축) ----------
  // kind: plot(밭 i) · expe(파견 i) · docs(결재) · mail(까치 우편) · parade(백귀야행)
  function timerLeft(kind, i) {
    const s = S();
    if (kind === 'plot') { const st = plotState(i); return st.empty ? 0 : st.left; }
    if (kind === 'expe') return s.expe[i] ? expeLeft(s.expe[i]) : 0;
    if (kind === 'docs') return docsCount() >= 3 ? 0 : docsNext();
    if (kind === 'mail') return mailCount() >= MAIL_MAX ? 0 : mailNext();
    if (kind === 'parade') return s.parade ? Math.max(0, (s.parade.next - now()) / 1000) : 0;
    return 0;
  }
  function shiftTimer(kind, i, secs) {
    const s = S(), ms = secs * 1000;
    if (kind === 'plot' && s.garden[i]) s.garden[i].t -= ms;
    else if (kind === 'expe' && s.expe[i]) s.expe[i].t -= ms;
    else if (kind === 'docs') s.docs.last -= ms;
    else if (kind === 'mail') s.mail.last -= ms;
    else if (kind === 'parade') s.parade.next -= ms;
    Game.save();
  }
  const skipCost = secs => Math.max(20, Math.ceil(secs / 600) * 20); // 10분당 옥 20개
  function skipJade(kind, i) {
    const l = timerLeft(kind, i), c = skipCost(l); if (l <= 0 || S().jade < c) return false;
    S().jade -= c; shiftTimer(kind, i, l + 1); return c;
  }
  const SKIP_AD = 30 * 60;
  function skipAd(kind, i) { const l = timerLeft(kind, i); if (l <= 0) return false; shiftTimer(kind, i, Math.min(l + 1, SKIP_AD)); return true; }

  // ---------- 망자 심판 ----------
  const JUDGE_MAX = 5;
  // 심판 1건 보상 = 몇 초치 혼 (맞히면). 처음엔 적게, 계급이 오를수록 늘어남 (틀리면 1/5)
  const JUDGE_SEC = [10, 18, 28, 42, 56, 74, 95, 116, 140]; // 심판 1건(정답) = 몇 초치 혼
  function judgeDay() { const s = S(), day = new Date().toISOString().slice(0, 10); if (!s.judge || s.judge.day !== day) s.judge = { day, n: 0, ok: 0, total: (s.judge && s.judge.total) || 0, seen: (s.judge && s.judge.seen) || [] }; return s.judge; }
  const judgeLeft = () => S() ? JUDGE_MAX - judgeDay().n : 0;
  function judgeCase() {
    const j = judgeDay(); if (j.n >= JUDGE_MAX) return null;
    if (j.cur == null && typeof JUDGE_STORY !== 'undefined') { const ch = S().story ? S().story.ch : 0, k = JUDGE_STORY.findIndex(x => ch >= x.ch && !j.seen.includes('s' + JUDGE_STORY.indexOf(x))); if (k >= 0) j.cur = 's' + k; }
    if (j.cur == null) { let pool = JUDGE_CASES.map((_, i) => i).filter(i => !j.seen.includes(i)); if (!pool.length) { j.seen = j.seen.filter(x => typeof x === 'string'); pool = JUDGE_CASES.map((_, i) => i); } j.cur = pool[Math.floor(Math.random() * pool.length)]; }
    const st = typeof j.cur === 'string', c = st ? JUDGE_STORY[+j.cur.slice(1)].c : JUDGE_CASES[j.cur]; return { i: j.cur, name: c[0], age: c[1], text: c[2], ans: c[3], story: st };
  }
  function judge(choice) {
    const j = judgeDay(), c = judgeCase(); if (!c) return null;
    const ok = choice === c.ans, s = S();
    const sec = JUDGE_SEC[Math.min(8, s.rank)], souls = Game.incomePerSec(true) * (ok ? sec : sec * 0.2), jade = ok ? 3 : 0;
    Game.gain(souls); s.jade += jade; j.n++; if (ok) { j.ok++; j.total++; } j.seen.push(c.i); j.cur = null;
    let bonus = 0; if (j.n >= JUDGE_MAX && j.ok >= JUDGE_MAX) { bonus = 15; s.jade += bonus; }
    Game.save(); return { ok, souls, jade, bonus, ans: c.ans, left: JUDGE_MAX - j.n, streak: j.ok };
  }

  // ---------- 일일 의뢰 ----------
  function questDay() {
    const s = S(), day = new Date().toISOString().slice(0, 10);
    if (s.quest && s.quest.day === day) return;
    let seed = [...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pool = QUEST_POOL.slice(), list = [];
    while (list.length < 4) { const q = pool.splice(Math.floor(r() * pool.length), 1)[0]; list.push({ id: q.id, need: q.need[Math.floor(r() * q.need.length)], have: 0, claimed: false }); }
    s.quest = { day, list, bonus: false };
  }
  function qEvent(id, n = 1) {
    const s = S(); if (!s) return; s.cnt = s.cnt || {}; s.cnt[id] = (s.cnt[id] || 0) + n;
    if (!s.quest) return; questDay();
    s.quest.list.forEach(q => { if (q.id === id && q.have < q.need) q.have = Math.min(q.need, q.have + n); });
  }
  function qClaim(i) {
    const s = S(), q = s.quest.list[i]; if (!q || q.claimed || q.have < q.need) return 0;
    const P = QUEST_POOL.find(x => x.id === q.id); q.claimed = true; s.jade += P.jade; Game.save(); return P.jade;
  }
  function qBonus() { const s = S(); if (s.quest.bonus || !s.quest.list.every(q => q.claimed)) return 0; s.quest.bonus = true; s.jade += QUEST_BONUS; Game.save(); return QUEST_BONUS; }
  const qReady = () => { const s = S(); return !!(s && s.quest) && (s.quest.list.some(q => !q.claimed && q.have >= q.need) || (!s.quest.bonus && s.quest.list.every(q => q.claimed))); };

  // ---------- 도깨비 상인 ----------
  function merchantTick() {
    const m = S().merchant, t = now();
    if (t >= m.next && t >= m.until) {
      const pool = MERCHANT_POOL.slice(); m.offers = [];
      while (m.offers.length < 3) m.offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
      m.until = t + 5 * 60e3; m.next = m.until + (15 + Math.random() * 10) * 60e3; m.bought = []; Game.save();
      return 'arrive';
    }
    return null;
  }
  const merchantHere = () => { const m = S() && S().merchant; return !!m && now() < m.until; };
  const offerPrice = o => o.jade ? { jade: o.jade } : { soul: Math.max(100, Math.ceil(Game.incomePerSec(true) * o.soul)) };
  function merchantBuy(id) {
    const s = S(), m = s.merchant, o = MERCHANT_POOL.find(x => x.id === id);
    if (!merchantHere() || m.bought.includes(id)) return false;
    const pr = offerPrice(o);
    if (pr.jade) { if (s.jade < pr.jade) return false; s.jade -= pr.jade; } else { if (s.souls < pr.soul) return false; s.souls -= pr.soul; }
    if (o.seed) Object.entries(o.seed).forEach(([k, v]) => (s.seeds[k] = (s.seeds[k] || 0) + v));
    if (o.hours) Game.gain(Game.incomePerSec(true) * 3600 * o.hours);
    if (o.jadeGet) s.jade += o.jadeGet;
    if (o.buff) s.buffs[o.buff[0]] = Math.min(now() + 4 * 3600e3, Math.max(now(), s.buffs[o.buff[0]] || 0) + o.buff[1] * 60e3);
    m.bought.push(id); Game.apply(); Game.save(); return true;
  }
  const F = id => FLOWERS.find(f => f.id === id);

  // ---------- 꽃밭 ----------
  function plotState(i) {
    const p = S().garden[i]; if (!p) return { empty: true };
    const f = F(p.f), el = (now() - p.t) / 1000, k = Math.min(1, el / f.grow);
    return { f, k, left: Math.max(0, f.grow - el), ready: k >= 1, stage: k >= 1 ? 3 : k < 0.34 ? 0 : k < 0.67 ? 1 : 2 };
  }
  function plant(i, fid) {
    const s = S(); if (i >= s.plots || s.garden[i] || !(s.seeds[fid] > 0)) return false;
    s.seeds[fid]--; s.garden[i] = { f: fid, t: now() }; Game.save(); return true;
  }
  function harvest(i) {
    const st = plotState(i); if (!st.ready) return 0;
    const n = st.f.yield[0] + Math.floor(Math.random() * (st.f.yield[1] - st.f.yield[0] + 1));
    S().flowers[st.f.id] = (S().flowers[st.f.id] || 0) + n; S().garden[i] = null; Game.save(); return n;
  }
  const seedSoulCost = f => Math.max(50, Math.ceil(Game.incomePerSec(true) * f.soul));
  function buySeed(fid, n) {
    const f = F(fid), s = S();
    if (f.soul) { const c = seedSoulCost(f) * n; if (s.souls < c) return false; s.souls -= c; }
    else { const c = f.jade * n; if (s.jade < c) return false; s.jade -= c; }
    s.seeds[fid] = (s.seeds[fid] || 0) + n; Game.save(); return true;
  }
  function unlockPlot() {
    const s = S(), c = PLOT_COST[s.plots]; if (s.plots >= 6 || s.jade < c) return false;
    s.jade -= c; s.plots++; Game.save(); return true;
  }

  // ---------- 주막 ----------
  const canBrew = r => Object.entries(r.need).every(([k, v]) => (S().flowers[k] || 0) >= v);
  function brew(id) {
    const r = RECIPES.find(x => x.id === id), s = S(); if (!canBrew(r)) return false;
    Object.entries(r.need).forEach(([k, v]) => (s.flowers[k] -= v));
    let got = null;
    if (r.buff) { s.buffs[r.buff] = Math.min(now() + 4 * 3600e3, Math.max(now(), s.buffs[r.buff] || 0) + r.min * 60e3); }
    if (r.instant) { got = Game.incomePerSec(true) * 3600 * r.instant.hours; Game.gain(got); s.jade += r.instant.jade; }
    Game.apply(); Game.save(); return got || true;
  }
  const buffLeft = k => Math.max(0, ((S().buffs || {})[k] || 0) - now()) / 1000;

  // ---------- 파견 ----------
  const slots = () => 1 + Math.floor(S().rank / 2); // 집무실 부하가 늘수록 파견 칸 증가 (1~5)
  const EXPE_DAY = 3; // 순찰지마다 하루에 보낼 수 있는 횟수
  function expeDay() { const s = S(), d = new Date().toISOString().slice(0, 10); if (!s.expeDay || s.expeDay.day !== d) s.expeDay = { day: d, n: {} }; return s.expeDay; }
  const expeTodayLeft = id => Math.max(0, EXPE_DAY - (expeDay().n[id] || 0));
  function send(id) {
    const E = EXPEDITIONS.find(e => e.id === id), s = S();
    if (s.expe.length >= slots() || s.rank < E.rank || Game.minions() < E.minion || expeTodayLeft(id) <= 0) return false;
    const d = expeDay(); d.n[id] = (d.n[id] || 0) + 1;
    s.expe.push({ id, t: now() }); Game.save(); return true;
  }
  const expeLeft = x => Math.max(0, EXPEDITIONS.find(e => e.id === x.id).hrs * 3600 - (now() - x.t) / 1000);
  function claim(idx) {
    const s = S(), x = s.expe[idx]; if (!x || expeLeft(x) > 0) return null;
    const E = EXPEDITIONS.find(e => e.id === x.id), r = { seeds: E.seed, jade: E.jade, souls: Game.incomePerSec(true) * 3600 * E.hours, dex: null };
    Object.entries(E.seed).forEach(([k, v]) => (s.seeds[k] = (s.seeds[k] || 0) + v));
    s.jade += E.jade; Game.gain(r.souls);
    if (E.dex) { const pool = SPECIALS.filter(p => !s.dex[p.i]); const pick = (pool.length ? pool : SPECIALS)[Math.floor(Math.random() * (pool.length || SPECIALS.length))]; s.dex[pick.i] = (s.dex[pick.i] || 0) + 1; r.dex = pick; }
    s.expe.splice(idx, 1); Game.save(); return r;
  }

  // ---------- 도감 ----------
  function rollSpecial(region, luck) {
    if (Math.random() > 0.012 * (1 + luck * 0.05)) return -1;
    const pool = SPECIALS.filter(p => p.region <= region);
    return pool[Math.floor(Math.random() * pool.length)].i;
  }
  function catchSpecial(i) { const s = S(), first = !s.dex[i]; s.dex[i] = (s.dex[i] || 0) + 1; Game.save(); return first; }
  // 등록 1종당 혼 수확 +2%, 10마리 모으면 +1% 더
  const dexBonus = () => Object.values(S().dex || {}).reduce((a, n) => a + (n > 0 ? 0.02 : 0) + (n >= 10 ? 0.01 : 0), 0);

  // ---------- 효과 ----------
  function mul(kind) {
    if (!S()) return 1;
    if (kind === 'value') return (1 + dexBonus()) * (buffLeft('value') > 0 ? 1.5 : 1);
    if (kind === 'spawn') return buffLeft('spawn') > 0 ? 1.4 : 1;
    if (kind === 'fight') return buffLeft('fight') > 0 ? 3 : 1;
    return 1;
  }
  // 알림 점: 수확할 꽃, 끝난 파견
  function alerts() {
    const s = S(); if (!s || !s.garden) return { garden: false, expe: false, brew: false };
    return {
      garden: s.garden.some((p, i) => i < s.plots && p && plotState(i).ready),
      expe: s.expe.some(x => expeLeft(x) <= 0),
      brew: RECIPES.some(canBrew),
    };
  }
  return { PROP, propReady, propLeft, useProp, timerLeft, skipCost, skipJade, skipAd, SKIP_AD, judgeLeft, judgeCase, judge, JUDGE_MAX, docsCount, claimDocs, docsNext, fortuneLeft, drawFortune, fortuneMul, offerState, offer, mailCount, openMail, mailNext, qEvent, qClaim, qBonus, qReady, merchantTick, merchantHere, offerPrice, merchantBuy, ensure, plotState, plant, harvest, seedSoulCost, buySeed, unlockPlot, canBrew, brew, buffLeft, slots, send, expeTodayLeft, EXPE_DAY, expeLeft, claim, rollSpecial, catchSpecial, dexBonus, mul, alerts };
})();
