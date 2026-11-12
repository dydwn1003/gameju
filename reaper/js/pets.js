// ===== 펫(저승사자를 보좌하는 영물) 뽑기: C ~ SSS =====
// 펫은 하나 데리고 다니며 수확량 · 이동속도 · 수확속도를 올려준다. 모은 펫 종류마다 수확량 +0.5%.
const PET_GRADES = {
  C: { rate: 0.58, col: '#a0a6b8', total: 0.05, dup: 3 },
  B: { rate: 0.28, col: '#5ac06a', total: 0.1, dup: 5 },
  A: { rate: 0.10, col: '#4a9aff', total: 0.18, dup: 10 },
  S: { rate: 0.03, col: '#c070ff', total: 0.32, dup: 30 },
  SS: { rate: 0.008, col: '#ffb030', total: 0.55, dup: 60 },
  SSS: { rate: 0.002, col: '#ff4a6a', total: 0.95, dup: 120 },
};
// 영물 도감 이야기 (영물을 누르면 보여요)
const PET_LORE = {
 "kkachi": "아침마다 반가운 소식을 물어 오는 아기 까치예요. 저승에서도 새 혼령이 오면 제일 먼저 알려 줘요.",
 "daram": "도토리를 숨긴 곳은 잊어도 길은 절대 잊지 않는 다람쥐예요. 쪼르르 앞장서 지름길을 찾아 줘요.",
 "bandi": "꽁무니의 작은 불빛으로 어둠 속 혼령을 비춰 주는 반딧불이예요. 길 잃은 혼도 이 빛을 따라와요.",
 "dukk": "등에 복을 지고 다닌다는 새끼 두꺼비예요. 우물가에서 개굴 울면 그날은 혼이 잘 모인대요.",
 "tokki": "달에서 방아를 찧다 내려온 토끼예요. 보름달이 뜨면 귀를 쫑긋 세우고 고향을 바라봐요.",
 "byeong": "해 뜨기 전부터 삐약삐약 일어나는 부지런한 병아리예요. 저승사자보다 먼저 출근해요.",
 "neoguri": "꾀가 많아 원귀도 속여 넘기는 너구리예요. 가끔 낙엽으로 둔갑해 낮잠을 자요.",
 "sapsal": "귀신을 쫓는다는 복슬복슬 삽살개예요. 원귀가 나타나면 털을 부풀리며 앞을 막아서요.",
 "heukmyo": "저승길을 훤히 아는 검은 고양이예요. 금빛 눈이 반짝이면 그쪽에 혼령이 있어요.",
 "buheong": "밤눈이 밝아 어둠 속 혼령을 놓치지 않는 부엉이예요. 낮에는 꾸벅꾸벅 졸아요.",
 "geobuk": "십장생의 하나인 아기 거북이에요. 느리지만 한번 잡은 혼은 절대 놓치지 않아요.",
 "haechi": "옳고 그름을 가리는 상상의 동물 해치의 새끼예요. 망자 심판 때 옆에서 고개를 끄덕여 줘요.",
 "yeowoo": "바람처럼 날쌘 여우예요. 혼령이 도망쳐도 한달음에 앞질러 길을 막아요.",
 "hak": "천 년을 산다는 학이에요. 우아한 날갯짓 한 번에 흩어진 혼이 모여들어요.",
 "baekho": "서쪽 하늘을 지키는 백호의 새끼예요. 아직 작지만 포효 한 번에 원귀가 움찔해요.",
 "samjok": "해 속에 산다는 세 발 까마귀예요. 날개에서 떨어지는 햇살이 혼의 값어치를 높여 줘요.",
 "bulyeo": "꼬리 끝에 여우불을 단 여우예요. 밤길을 밝히며 혼령을 저승사자 쪽으로 이끌어요.",
 "cheongryong": "동쪽 바다를 지키는 청룡의 새끼예요. 푸른 비늘이 반짝일 때마다 손길이 빨라져요.",
 "girin": "성인이 세상에 나타날 때 함께 온다는 영물 기린이에요. 기린이 곁에 있으면 좋은 일만 생겨요.",
 "bonghwang": "태평성대를 알린다는 봉황이에요. 오색 깃털이 펄럭이면 저승에도 잔치가 열려요.",
 "hwangryong": "하늘의 한가운데를 지키는 황룡의 새끼예요. 저승의 모든 영물이 고개를 숙이는 왕이에요.",
 "chamsae": "처마 밑에서 하루 종일 재잘대는 참새예요. 수다 속에 혼령이 어디 있는지 다 들어 있어요.",
 "saengjwi": "곳간의 쌀 한 톨도 놓치지 않는 꼬마 생쥐예요. 떨어진 혼 부스러기도 알뜰하게 주워 와요.",
 "cheonggae": "엄마 말을 거꾸로 듣던 청개구리예요. 비가 오면 미안한 마음에 더 열심히 혼을 모아요.",
 "ori": "뒤뚱뒤뚱 저승사자 뒤를 졸졸 따라오는 아기 오리예요. 처음 본 사람을 엄마로 알아요.",
 "bungeo": "연못 깊은 곳에 사는 은빛 붕어예요. 물속에 가라앉은 혼도 건져 올려 줘요.",
 "bakjwi": "밤하늘을 소리 없이 나는 박쥐예요. 거꾸로 매달려 저승 마을을 내려다봐요.",
 "dwaeji": "꿈에 나오면 복이 온다는 꼬마 돼지예요. 코를 킁킁대며 숨은 혼을 찾아내요.",
 "gosum": "작지만 가시는 날카로운 고슴도치예요. 원귀가 다가오면 몸을 말고 콕콕 찔러요.",
 "nabi": "꽃밭을 맴도는 호랑나비예요. 날개를 팔랑이면 꽃이 더 빨리 자란대요.",
 "yeomso": "풀밭을 뛰노는 꼬마 염소예요. 무엇이든 먹어 보려다 가끔 명부를 씹어요.",
 "sudal": "물살을 가르는 날쌘 수달이에요. 삼도천에 빠진 혼을 재빨리 건져 와요.",
 "kkamagwi": "이승과 저승을 오가며 소식을 전하는 까마귀예요. 까악 울면 누군가 저승으로 오고 있어요.",
 "kkotsasum": "등에 꽃무늬가 피어난 사슴이에요. 지나간 자리마다 저승 꽃이 피어나요.",
 "baekgu": "주인을 끝까지 지키는 충직한 진돗개 백구예요. 한 번 맡은 혼령은 끝까지 쫓아가요.",
 "geumbung": "복을 헤엄친다는 금붕어예요. 연못에 금빛 물결이 일면 귀한 혼령이 찾아와요.",
 "haneul": "나무와 나무 사이를 활공하는 하늘다람쥐예요. 높은 곳에서 혼령의 위치를 알려 줘요.",
 "chijeu": "햇볕 좋은 툇마루를 좋아하는 노랑 치즈 고양이예요. 낮잠을 자다가도 혼령 소리엔 귀가 번쩍 서요.",
 "bandal": "가슴에 반달 무늬를 품은 아기 곰이에요. 힘이 세서 원귀도 번쩍 들어 올려요.",
 "baeksa": "천 년 묵은 흰 뱀의 새끼예요. 조용히 똬리를 틀고 앉아 혼령의 기운을 살펴요.",
 "eunyeowoo": "달빛을 닮은 은빛 털의 여우예요. 보름밤엔 털이 빛나 혼령들이 넋을 잃고 다가와요.",
 "horangi": "산을 다스리는 산군의 새끼 호랑이예요. 아직 어흥 소리가 귀엽지만 원귀는 벌벌 떨어요.",
 "geumdukk": "재물을 부른다는 금두꺼비예요. 입에 문 엽전을 뱉을 때마다 옥이 굴러들어 온대요.",
 "bulgasari": "쇠를 먹고 자란다는 괴수 불가사리예요. 원귀의 쇠사슬도 오독오독 씹어 먹어요.",
 "hyeonmu": "북쪽을 지키는 현무의 새끼예요. 거북 등껍질과 뱀 꼬리로 저승사자를 든든히 지켜요.",
 "jujak": "남쪽을 지키는 주작의 새끼예요. 붉은 날개를 펼치면 저승 하늘이 노을처럼 물들어요.",
 "cheonma": "구름 위를 달리는 날개 달린 말이에요. 등에 태워 주면 저승 끝까지 한달음에 가요.",
 "imugi": "천 년을 기다려 용이 되기를 꿈꾸는 이무기예요. 혼을 많이 모을수록 꿈에 가까워진대요.",
 "gumiho": "아홉 개의 꼬리를 감춘 여우예요. 사람으로 둔갑할 줄 알지만 저승사자 앞에선 얌전해요.",
 "baektaek": "세상 만물의 이름과 이치를 안다는 흰 신수예요. 모르는 혼령이 없어서 도감을 채워 줘요.",
 "heukryong": "먹구름을 부르는 흑룡의 새끼예요. 비가 쏟아지는 날엔 숨어 있던 혼령들이 쏟아져 나와요.",
 "eungryong": "날개 달린 용, 응룡의 새끼예요. 하늘과 저승을 자유롭게 날며 귀한 혼을 물어 와요.",
 "geumsijo": "용도 잡아먹는다는 황금 새, 금시조예요. 날개를 펴면 저승 하늘이 온통 금빛으로 빛나요."
};
const PET_ORDER = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
// 등급이 높을수록 확률이 가파르게 낮아짐: C 58 · B 28 · A 10 · S 3 · SS 0.8 · SSS 0.2 (%)
const EMPH = { v: [0.7, 0.15, 0.15], w: [0.2, 0.6, 0.2], r: [0.2, 0.2, 0.6], all: [0.34, 0.33, 0.33] };
const PETS = [
  { id: 'kkachi', name: '아기 까치', g: 'C', kind: 'bird', e: 'v', pal: { H: '#2a2a3a', B: '#2a2a3a', b: '#f0f0f0', y: '#e0a030' }, desc: '반가운 소식을 물어오는 까치' },
  { id: 'daram', name: '다람쥐', g: 'C', kind: 'quad', e: 'w', pal: { H: '#a0683a', B: '#a0683a', b: '#e8c8a0' }, desc: '쪼르르 앞장서 길을 찾는다' },
  { id: 'bandi', name: '반딧불이', g: 'C', kind: 'round', e: 'r', pal: { B: '#3a4a2a', b: '#f0f070', y: '#fffbb0' }, acc: 'wing', desc: '혼령을 비춰 빨리 찾게 해준다' },
  { id: 'dukk', name: '새끼 두꺼비', g: 'C', kind: 'round', e: 'v', pal: { B: '#6a9a4a', b: '#c8d890' }, desc: '복을 부르는 두꺼비' },
  { id: 'tokki', name: '달토끼', g: 'C', kind: 'quad', e: 'w', pal: { H: '#f0f0f8', B: '#f0f0f8', b: '#ffc0d0' }, acc: 'longear', desc: '달에서 내려온 토끼' },
  { id: 'byeong', name: '병아리', g: 'C', kind: 'round', e: 'r', pal: { B: '#ffd84a', b: '#fff0a0', y: '#ff8a30' }, acc: 'beak', desc: '삐약삐약 부지런한 병아리' },
  { id: 'neoguri', name: '너구리', g: 'B', kind: 'quad', e: 'v', pal: { H: '#7a6a5a', B: '#7a6a5a', b: '#2a2a2a' }, acc: 'mask', desc: '꾀 많은 너구리' },
  { id: 'sapsal', name: '삽살개', g: 'B', kind: 'quad', e: 'w', pal: { H: '#e0c890', B: '#e0c890', b: '#b89a60' }, acc: 'shag', desc: '귀신을 쫓는 삽살개' },
  { id: 'heukmyo', name: '검은 고양이', g: 'B', kind: 'quad', e: 'r', pal: { H: '#2a2838', B: '#2a2838', b: '#4a4660', E: '#ffd34a' }, desc: '저승길을 아는 고양이' },
  { id: 'buheong', name: '부엉이', g: 'B', kind: 'bird', e: 'v', pal: { H: '#8a6a40', B: '#8a6a40', b: '#e0c8a0', y: '#ffb030', E: '#ffd34a' }, acc: 'tuft', desc: '밤눈 밝은 부엉이' },
  { id: 'geobuk', name: '아기 거북', g: 'B', kind: 'round', e: 'r', pal: { B: '#3a7a5a', b: '#8ac870' }, acc: 'shell', desc: '오래 사는 십장생 거북' },
  { id: 'haechi', name: '아기 해치', g: 'A', kind: 'quad', e: 'v', pal: { H: '#e0b040', B: '#e0b040', b: '#3a9a6a', y: '#3a9a6a' }, acc: 'horn', desc: '옳고 그름을 가리는 해치' },
  { id: 'yeowoo', name: '여우', g: 'A', kind: 'quad', e: 'w', pal: { H: '#ff8a3a', B: '#ff8a3a', b: '#fff0e0' }, desc: '날쌘 여우' },
  { id: 'hak', name: '학', g: 'A', kind: 'bird', e: 'r', pal: { H: '#f8f8ff', B: '#f8f8ff', b: '#2a2a3a', y: '#e0a030' }, acc: 'crest', desc: '천 년을 사는 학' },
  { id: 'baekho', name: '아기 백호', g: 'A', kind: 'quad', e: 'v', pal: { H: '#f0f0f8', B: '#f0f0f8', b: '#2a2a3a' }, acc: 'stripe', desc: '서쪽을 지키는 백호의 새끼' },
  { id: 'samjok', name: '삼족오', g: 'S', kind: 'bird', e: 'v', pal: { H: '#1a1428', B: '#1a1428', b: '#e0a030', y: '#ffd34a', E: '#ff4a4a' }, acc: 'crest', aura: '#ffd34a', desc: '태양에 사는 세 발 까마귀' },
  { id: 'bulyeo', name: '불여우', g: 'S', kind: 'quad', e: 'all', pal: { H: '#ff4a2a', B: '#ff4a2a', b: '#ffd040' }, acc: 'fire', aura: '#ff7a30', desc: '꼬리에 여우불을 단 여우' },
  { id: 'cheongryong', name: '아기 청룡', g: 'S', kind: 'dragon', e: 'r', pal: { H: '#3a8ae0', B: '#3a8ae0', b: '#a0e0ff', y: '#ffd34a' }, aura: '#6fb0ff', desc: '동쪽을 지키는 청룡의 새끼' },
  { id: 'girin', name: '기린', g: 'SS', kind: 'quad', e: 'all', pal: { H: '#ffd060', B: '#ffd060', b: '#ff8a5a', y: '#ffffff' }, acc: 'horn', aura: '#ffe08a', desc: '성인이 나타날 때 오는 영물' },
  { id: 'bonghwang', name: '봉황', g: 'SS', kind: 'bird', e: 'v', pal: { H: '#ff5a4a', B: '#ff5a4a', b: '#ffd34a', y: '#3aa0ff' }, acc: 'crest', aura: '#ff9a6a', desc: '태평성대를 알리는 봉황' },
  { id: 'hwangryong', name: '아기 황룡', g: 'SSS', kind: 'dragon', e: 'all', pal: { H: '#ffd040', B: '#ffd040', b: '#fff0b0', y: '#ff5a4a' }, aura: '#ffd34a', desc: '하늘의 중심을 지키는 황룡의 새끼' },
// ---- 새 영물 32종 (C 10 · B 8 · A 5 · S 4 · SS 3 · SSS 2) ----
  { id: 'chamsae', name: '참새', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#8a6040", "B": "#8a6040", "b": "#f0e0c8", "y": "#3a2a1e"}, desc: '처마 밑에서 재잘대는 참새' },
  { id: 'saengjwi', name: '생쥐', g: 'C', kind: 'quad', e: 'w', pal: {"H": "#9a9aa8", "B": "#9a9aa8", "b": "#f0e8ec", "y": "#ff9ab0"}, desc: '곳간을 지키는 꼬마 생쥐' },
  { id: 'cheonggae', name: '청개구리', g: 'C', kind: 'round', e: 'r', pal: {"H": "#4ac86a", "B": "#4ac86a", "b": "#e8f8c0", "y": "#2a8a4a"}, desc: '비 오는 날 우는 청개구리' },
  { id: 'ori', name: '아기 오리', g: 'C', kind: 'round', e: 'w', pal: {"H": "#fffaf0", "B": "#fffaf0", "b": "#ffffff", "y": "#ff9a2a"}, desc: '뒤뚱뒤뚱 따라오는 오리' },
  { id: 'bungeo', name: '붕어', g: 'C', kind: 'round', e: 'v', pal: {"H": "#8a9aa8", "B": "#8a9aa8", "b": "#e0e8ec", "y": "#5a6a7a"}, desc: '연못에 사는 은빛 붕어' },
  { id: 'bakjwi', name: '박쥐', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#4a3a5a", "B": "#4a3a5a", "b": "#8a7a9a", "y": "#2a2034"}, desc: '밤하늘을 나는 박쥐' },
  { id: 'dwaeji', name: '꼬마 돼지', g: 'C', kind: 'round', e: 'v', pal: {"H": "#f4a8b4", "B": "#f4a8b4", "b": "#ffd4dc", "y": "#d07888"}, desc: '복을 부르는 꼬마 돼지' },
  { id: 'gosum', name: '고슴도치', g: 'C', kind: 'round', e: 'w', pal: {"H": "#c8a070", "B": "#c8a070", "b": "#f0dcc0", "y": "#2a1a14"}, desc: '가시로 원귀를 콕콕' },
  { id: 'nabi', name: '호랑나비', g: 'C', kind: 'bird', e: 'r', pal: {"H": "#2a2030", "B": "#2a2030", "b": "#ffd060", "y": "#2a2030"}, desc: '꽃밭을 맴도는 호랑나비' },
  { id: 'yeomso', name: '아기 염소', g: 'C', kind: 'quad', e: 'v', pal: {"H": "#f0ecf4", "B": "#f0ecf4", "b": "#ffffff", "y": "#a07a4a"}, desc: '풀밭의 꼬마 염소' },
  { id: 'sudal', name: '수달', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#7a5a3a", "B": "#7a5a3a", "b": "#e8d0b0", "y": "#5a4028"}, desc: '물살을 가르는 수달' },
  { id: 'kkamagwi', name: '까마귀', g: 'B', kind: 'bird', e: 'r', pal: {"H": "#1a1828", "B": "#1a1828", "b": "#3a3650", "y": "#5a5a6a"}, desc: '저승 소식을 전하는 까마귀' },
  { id: 'kkotsasum', name: '꽃사슴', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#c88a4a", "B": "#c88a4a", "b": "#fff0d8", "y": "#e0c890"}, desc: '등에 꽃무늬가 핀 사슴' },
  { id: 'baekgu', name: '백구', g: 'B', kind: 'quad', e: 'v', pal: {"H": "#f4f2ec", "B": "#f4f2ec", "b": "#ffffff", "y": "#d8d0c0"}, desc: '충직한 진돗개 백구' },
  { id: 'geumbung', name: '금붕어', g: 'B', kind: 'round', e: 'v', pal: {"H": "#ff7a2a", "B": "#ff7a2a", "b": "#fff0c0", "y": "#e04a1a"}, desc: '복을 헤엄치는 금붕어' },
  { id: 'haneul', name: '하늘다람쥐', g: 'B', kind: 'quad', e: 'r', pal: {"H": "#b8b0a0", "B": "#b8b0a0", "b": "#fff8ec", "y": "#4a4030"}, desc: '나무 사이를 활공한다' },
  { id: 'chijeu', name: '치즈 고양이', g: 'B', kind: 'quad', e: 'w', pal: {"H": "#ffb048", "B": "#ffb048", "b": "#ffe0a8", "y": "#e08a2a"}, desc: '햇볕을 좋아하는 노랑이' },
  { id: 'bandal', name: '아기 반달곰', g: 'B', kind: 'quad', e: 'v', pal: {"H": "#2a2632", "B": "#2a2632", "b": "#f0ece0", "y": "#c8a080"}, desc: '가슴에 반달을 품은 곰' },
  { id: 'baeksa', name: '백사', g: 'A', kind: 'dragon', e: 'r', pal: {"H": "#f4f4fa", "B": "#f4f4fa", "b": "#ffffff", "y": "#ff5a6a"}, desc: '천 년 묵은 흰 뱀의 새끼' },
  { id: 'eunyeowoo', name: '은여우', g: 'A', kind: 'quad', e: 'w', pal: {"H": "#d8dce8", "B": "#d8dce8", "b": "#ffffff", "y": "#2a2838"}, desc: '달빛을 닮은 은빛 여우' },
  { id: 'horangi', name: '아기 호랑이', g: 'A', kind: 'quad', e: 'v', pal: {"H": "#ff9a3a", "B": "#ff9a3a", "b": "#2a1e14", "y": "#ffa0b8"}, desc: '산군의 새끼 호랑이' },
  { id: 'geumdukk', name: '금두꺼비', g: 'A', kind: 'round', e: 'v', pal: {"H": "#ffc83a", "B": "#ffc83a", "b": "#fff0b0", "y": "#c89020"}, desc: '재물을 부르는 금두꺼비' },
  { id: 'bulgasari', name: '불가사리', g: 'A', kind: 'quad', e: 'r', pal: {"H": "#6a6a7a", "B": "#6a6a7a", "b": "#a8a8b8", "y": "#ff7a3a"}, desc: '쇠를 먹고 자라는 괴수' },
  { id: 'hyeonmu', name: '아기 현무', g: 'S', kind: 'round', e: 'all', pal: {"H": "#2a3a5a", "B": "#2a3a5a", "b": "#9ab0d8", "y": "#4ad0b0"}, aura: '#6ab0ff', desc: '북쪽을 지키는 현무의 새끼' },
  { id: 'jujak', name: '아기 주작', g: 'S', kind: 'bird', e: 'v', pal: {"H": "#ff3a2a", "B": "#ff3a2a", "b": "#ffb040", "y": "#ffd34a"}, aura: '#ff6a3a', desc: '남쪽을 지키는 주작의 새끼' },
  { id: 'cheonma', name: '천마', g: 'S', kind: 'quad', e: 'w', pal: {"H": "#f8f8ff", "B": "#f8f8ff", "b": "#cfe8ff", "y": "#ffd34a"}, aura: '#a8d8ff', desc: '구름을 달리는 날개 달린 말' },
  { id: 'imugi', name: '이무기', g: 'S', kind: 'dragon', e: 'r', pal: {"H": "#2a8a8a", "B": "#2a8a8a", "b": "#a8e8d8", "y": "#ffd34a"}, aura: '#4ad0c0', desc: '용이 되기를 기다리는 이무기' },
  { id: 'gumiho', name: '구미호', g: 'SS', kind: 'quad', e: 'all', pal: {"H": "#fff0f4", "B": "#fff0f4", "b": "#ffffff", "y": "#c83a6a"}, aura: '#ff9ad0', desc: '아홉 꼬리를 감춘 여우' },
  { id: 'baektaek', name: '백택', g: 'SS', kind: 'quad', e: 'all', pal: {"H": "#f4f8ff", "B": "#f4f8ff", "b": "#8ab8ff", "y": "#ffd34a"}, aura: '#a8d0ff', desc: '만물을 아는 흰 신수' },
  { id: 'heukryong', name: '아기 흑룡', g: 'SS', kind: 'dragon', e: 'v', pal: {"H": "#2a2440", "B": "#2a2440", "b": "#8a7ab8", "y": "#ff4a5a"}, aura: '#a07aff', desc: '먹구름을 부르는 흑룡의 새끼' },
  { id: 'eungryong', name: '아기 응룡', g: 'SSS', kind: 'dragon', e: 'all', pal: {"H": "#9a6aff", "B": "#9a6aff", "b": "#f0e8ff", "y": "#ffd34a"}, aura: '#c8a0ff', desc: '날개 달린 용, 응룡의 새끼' },
  { id: 'geumsijo', name: '금시조', g: 'SSS', kind: 'bird', e: 'all', pal: {"H": "#ffc83a", "B": "#ffc83a", "b": "#fff4c0", "y": "#ff3a5a"}, aura: '#ffd34a', desc: '용을 잡아먹는 황금 새' },
];
const PULL_COST = { 1: 50, 10: 450 };
const PITY = 80; // 80번 안에 SS 이상 확정

const Pets = (() => {
  const S = () => Game.S;
  const P = id => PETS.find(p => p.id === id);
  function ensure() { const s = S(); s.pets = s.pets || {}; s.petEq = s.petEq || null; s.pity = s.pity || 0; s.petAd = s.petAd || { day: '', n: 0 }; s.petInv = s.petInv || {}; }
  // 펫 능력치: [수확량, 이동속도, 수확속도] (별 하나당 +15%)
  function stats(id) {
    const p = P(id), st = (S().pets || {})[id] || 1, t = PET_GRADES[p.g].total * (1 + 0.15 * (st - 1));
    return EMPH[p.e].map(x => x * t);
  }
  function mul(kind) {
    const s = S(); if (!s || !s.pets) return 1;
    const own = Object.keys(s.pets).length * 0.005;
    const st = s.petEq && s.pets[s.petEq] ? stats(s.petEq) : [0, 0, 0];
    if (kind === 'value') return 1 + st[0] + own;
    if (kind === 'walk') return 1 + st[1];
    if (kind === 'reap') return 1 + st[2];
    return 1;
  }
  function rollGrade(forceMin) {
    let r = Math.random(), g = 'C';
    for (const k of ['SSS', 'SS', 'S', 'A', 'B']) { if (r < PET_GRADES[k].rate) { g = k; break; } r -= PET_GRADES[k].rate; }
    if (forceMin && PET_ORDER.indexOf(g) < PET_ORDER.indexOf(forceMin)) g = forceMin;
    return g;
  }
  function pullOne(forceMin) {
    const s = S(); s.pity++;
    let g = rollGrade(forceMin);
    if (s.pity >= PITY && PET_ORDER.indexOf(g) < 4) g = Math.random() < 0.1 ? 'SSS' : 'SS';
    if (PET_ORDER.indexOf(g) >= 4) s.pity = 0;
    const pool = PETS.filter(p => p.g === g), p = pool[Math.floor(Math.random() * pool.length)];
    return give(p.id);
  }
  // 얻은 영물: 처음이면 도감 등록, 이미 있으면 여분(보관함)에 쌓임 → 별 올리기 · 합성 재료
  function give(id, up) {
    const s = S(), had = s.pets[id] || 0;
    if (!had) s.pets[id] = 1; else s.petInv[id] = (s.petInv[id] || 0) + 1;
    if (!s.petEq) s.petEq = id;
    return { id, isNew: !had, star: s.pets[id], up: !!up };
  }
  // 별 올리기: ★2←1마리, ★3←2, ★4←3, ★5←4
  const starCost = id => (S().pets[id] || 1);
  function starUp(id) {
    const s = S(), st = s.pets[id]; if (!st || st >= 5) return false;
    const c = starCost(id); if ((s.petInv[id] || 0) < c) return false;
    s.petInv[id] -= c; s.pets[id] = st + 1; Game.apply(); Game.save(); return true;
  }
  // 합성: 같은 등급 여분 3마리 → 1마리 (낮은 확률로 한 등급 위, 아니면 같은 등급 중 무작위)
  const FUSE_N = 3, FUSE_UP = { C: 0.12, B: 0.08, A: 0.04, S: 0.02, SS: 0.005 };
  const spares = g => PETS.filter(p => p.g === g).reduce((a, p) => a + (S().petInv[p.id] || 0), 0);
  function fuse(g, times) {
    const s = S(); ensure(); if (!(g in FUSE_UP)) return null;
    const n = Math.min(times, Math.floor(spares(g) / FUSE_N)); if (n <= 0) return null;
    const res = [];
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < FUSE_N; j++) {
        // ★5라 더 쓸 데 없는 여분부터, 그다음 많이 쌓인 것부터 사용
        const pool = PETS.filter(p => p.g === g && (s.petInv[p.id] || 0) > 0).sort((a, b) => ((s.pets[b.id] >= 5) - (s.pets[a.id] >= 5)) || (s.petInv[b.id] - s.petInv[a.id]));
        s.petInv[pool[0].id]--;
      }
      const up = Math.random() < FUSE_UP[g], ng = up ? PET_ORDER[PET_ORDER.indexOf(g) + 1] : g;
      const cand = PETS.filter(p => p.g === ng), p = cand[Math.floor(Math.random() * cand.length)];
      res.push(give(p.id, up));
    }
    Game.apply(); Game.save(); return res;
  }
  // n=1 · 10 (10회는 A 이상 1마리 확정), free=광고
  function pull(n, free) {
    const s = S(); ensure();
    if (!free) { if (s.jade < PULL_COST[n]) return null; s.jade -= PULL_COST[n]; }
    const res = [];
    for (let i = 0; i < n; i++) res.push(pullOne(n === 10 && i === 9 && !res.some(r => PET_ORDER.indexOf(P(r.id).g) >= 2) ? 'A' : null));
    Game.apply(); Game.save(); return res;
  }
  const today = () => kstDay();
  const adLeft = () => { const a = S().petAd; if (a.day !== today()) { a.day = today(); a.n = 0; } return 2 - a.n; };
  function adPull() { if (adLeft() <= 0) return null; S().petAd.n++; return pull(1, true); }
  function equip(id) { if (!S().pets[id]) return false; S().petEq = id; Game.apply(); Game.save(); return true; }
  // 모두 합성: 여분이 3마리 미만이 될 때까지 계속 (합성으로 새로 나온 여분 포함).
  // 여러 등급이면 낮은 등급부터 → 등급 상승으로 올라간 영물도 다음 등급에서 이어서 합성
  function fuseAll(grades) {
    const res = [], list = PET_ORDER.filter(g => g in FUSE_UP && grades.includes(g));
    for (const g of list) { let guard = 0; while (spares(g) >= FUSE_N && guard++ < 5000) { const r = fuse(g, 1); if (!r) break; res.push(...r); } }
    return res.length ? res : null;
  }
  return { P, ensure, stats, mul, pull, adPull, adLeft, equip, starUp, starCost, fuse, fuseAll, spares, FUSE_N, FUSE_UP };
})();
