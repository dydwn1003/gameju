// 제미나이 앱용 "격자(한 장에 여러 마리)" 프롬프트 생성기
// 사용: node tools/gen_grid_prompts.js [html_out_path]
// 출력: docs/PROMPTS_GRID.md (+ 복사 버튼 페이지)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + '\n;this.LINES=LINES;this.ENEMIES=ENEMIES;this.RACES=RACES;', ctx);
const { LINES, ENEMIES, RACES } = ctx;

const STYLE = [
  'Cute chibi pixel art sprites for a Korean folklore fantasy mobile RPG,',
  'old Joseon-era Korean fairy-tale mood (dokkaebi goblins, traditional hanbok, dancheong temple colors, hanji paper textures),',
  '16-bit retro SNES style, crisp hard pixel edges, every pixel clearly visible, no anti-aliasing, no blur, no gradients,',
  'limited warm palette, dark 1-pixel outline, soft cel shading with 2-3 tones, big expressive eyes,',
  'every character full body, facing right in 3/4 side view, all drawn at the same pixel size and similar scale.',
].join(' ');
const GRID = (rows, cols, n) => [
  `Sprite sheet: exactly ${n} different characters arranged in a ${rows}x${cols} grid of equal square cells, one character per cell,`,
  'each centered in its own cell with empty margin around it, nothing crossing into other cells,',
  'no grid lines, no frames, no labels, no numbers, no text anywhere,',
  'the entire background is one flat solid magenta color #FF00FF.',
  'Order: left to right, top to bottom.',
].join(' ');

// 뽑기 몬스터 설명 (대표 모습 = 2단계)
const D = {
  jipsin: 'a living woven straw sandal (jipsin) with tiny eyes on the toe and little legs',
  bitjaru: 'a traditional straw broom dokkaebi with a small horn and a goofy grin',
  jangdok: 'a round brown onggi earthenware soy-sauce jar with a lid and a sleepy face',
  horong: 'a small hanging oil-lamp (horongbul) spirit with a flickering flame on top',
  yeopjeon: 'a floating old brass Korean coin with a square hole in the middle and a cheeky face',
  bokjumeo: 'a red silk lucky pouch (bokjumeoni) with gold embroidery and a tied top',
  tteok: 'a soft white rice-cake (tteok) blob with pink cheeks',
  songpyeon: 'a half-moon green songpyeon rice-cake creature with a pine needle on its head',
  dotori: 'a round acorn creature wearing its acorn cap like a hat',
  dukkeobi: 'a tiny chubby spotted toad',
  gaeguri: 'a green frog child wearing a lotus-leaf hat',
  cheongseol: 'a gray Korean squirrel with a huge fluffy tail',
  neoguri: 'a raccoon dog (neoguri) with a dark eye mask and a ringed tail',
  metdwaeji: 'a striped baby wild boar piglet',
  bandit: 'a glowing firefly fairy with a bright lantern-like tail',
  nabi: 'a pink butterfly spirit with big patterned wings',
  kkachi: 'a black-and-white magpie (kkachi) with blue wing shine',
  chamsae: 'a round brown sparrow',
  pyeonbok: 'a little purple bat with big ears',
  ingeo: 'a small red-and-white koi carp',
  megi: 'a whiskered brown catfish',
  kkotge: 'a red blue-crab (kkotge) with raised claws',
  dokkaebibul: 'an orange dokkaebi fire wisp with a cute face',
  pureunbul: 'a blue ghost-fire wisp (honbul) with a cute face',
  dalgyal: 'an egg ghost (dalgyal gwisin) in a white robe with a completely blank smooth egg face',
  idkki: 'a mossy gray stone spirit',
  godeureum: 'an icy blue blob with icicles on its head',
  horibyeong: 'a gourd bottle (horibyeong) spirit tied with a red cord',
  buchae: 'a folding hanji paper fan spirit with a red taegeuk pattern',
  hahoetal: 'a floating Hahoe wooden mask with a big smiling crescent-eye face and a red ribbon',
  yeonkkot: 'a pink lotus flower spirit',
  haepari: 'a pale blue jellyfish with pink tentacles',
  jindo: 'a cream-colored Jindo dog puppy with a curled tail',
  sapsal: 'a shaggy Sapsal dog with long fur covering its eyes',
  cheongdok: 'a blue dokkaebi goblin with one horn, tiger-skin pants and a spiked wooden club',
  hongdok: 'a red dokkaebi goblin with one horn, tiger-skin pants and a spiked wooden club',
  jangseung: 'a walking jangseung (carved wooden village guardian totem) with bulging eyes, toothy grin and a black official hat',
  hak: 'an elegant white red-crowned crane',
  buheong: 'a Eurasian eagle owl with ear tufts and big orange eyes',
  yeowoo: 'a small fire fox with a flaming tail',
  noru: 'a roe deer with small antlers',
  bandal: 'an Asiatic black bear with a white crescent moon mark on its chest, standing',
  sudal: 'a playful river otter',
  geobuk: 'a green turtle',
  gureongi: 'a big olive-green house snake (gureongi)',
  jine: 'a red centipede with golden legs',
  muneo: 'a red octopus',
  cheonyeo: 'a maiden ghost (cheonyeo gwisin) in white hanbok with long black hair covering most of her face, floating',
  mulgwi: 'a green water ghost covered in seaweed, floating',
  chorong: 'a blue-and-red silk cheongsachorong lantern spirit with tassels',
  maetdol: 'a stone millstone (maetdol) spirit with a wooden handle',
  kkotsasum: 'a spotted sika deer with flowers blooming on its antlers',
  eunin: 'a silver carp with long flowing fins and whiskers',
  hwaro: 'a cast-iron brazier (hwaro) spirit full of glowing coals',
  juibul: 'a gray rat carrying a small torch flame (juibul)',
  geumdu: 'a golden lucky toad (geumdukkeobi) holding a gold coin in its mouth',
  geuseundae: 'a tall shadowy giant spirit (geuseundae) made of darkness with glowing red eyes',
  dueok: 'a dark purple dokkaebi (dueoksini) with two horns and a heavy club',
  geumdok: 'a golden dokkaebi with a golden club, rich and smug',
  maegu: 'a white three-tailed young fox spirit (maegu) with violet eyes',
  yongma: 'a blue dragon-horse (yongma) with a flowing water mane and a single horn',
  bulgom: 'a fire bear god with flaming fur, standing',
  cheonghak: 'a mystical blue crane',
  eopgu: 'a golden house-guardian serpent (eopgureongi) wearing a tiny crown',
  mokgak: 'a carved wooden general statue wearing armor and a helmet',
  jowang: 'the kitchen hearth god Jowangsin as a small iron cauldron spirit with flames and a tiny crown',
  haetae: 'Haetae, the mythical lion-dog guardian with one horn, golden body and green curly mane',
  bulgasari: 'Bulgasari, the iron-eating beast with metal spikes and glowing molten eyes',
  imugi: 'Imugi, a large teal serpent that has not yet become a dragon, small horns',
  samjok: 'Samjogo, the black three-legged sun crow in front of a red sun disc',
  jangsan: 'Jangsanbeom, a mysterious white long-haired beast like a white tiger with a long mane',
  sangun: 'Sangun, the mountain-lord Korean tiger with bold black stripes',
  yongwang: 'the Dragon King turtle (Yongwang) with a golden crown and long whiskers',
  dokdaejang: 'the Dokkaebi Chief, purple with two horns, red cape and a golden club',
  cheongryong: 'Cheongryong, the Azure Dragon: a long eastern blue dragon with deer horns and whiskers, flying',
  baekho: 'Baekho, the White Tiger: a majestic white tiger with black stripes',
  jujak: 'Jujak, the Vermilion Bird: a blazing red phoenix with long flowing tail feathers',
  hyeonmu: 'Hyeonmu, the Black Tortoise: a dark tortoise entwined with a snake',
  girin: 'Girin (qilin): a green scaly hooved beast with a single horn and golden mane',
  hwangryong: 'Hwangryong, the Yellow Dragon: a golden eastern dragon holding a red yeouiju pearl, divine aura',
  cheonho: 'Cheonho, the thousand-year nine-tailed fox (gumiho): white fur, nine fluffy tails fanned out, floating blue and orange foxfire orbs',
  yeomra: 'Yeomra, King of the Underworld: black royal robe, wide black gat hat, pale face, ominous blue soul flames',
};
const GRADE_HINT = {
  C: 'simple, small and cute everyday yokai',
  B: 'cute but a bit cooler, more detail',
  A: 'impressive spirit creatures with more detail and small glowing accents',
  S: 'legendary mythical beasts, detailed, with a faint aura',
  SS: 'the Four Guardian Gods, majestic and detailed with a golden aura',
  SSS: 'the rarest god-tier beings, most detailed and majestic, with a radiant aura and sparkles',
};

// 적 몬스터 설명 (조금 무섭게, 빨간 눈)
const E = {
  e_jwi: 'a gray rat yokai with red glowing eyes', e_dwaeji: 'an angry brown wild boar with big tusks',
  e_beoseot: 'a poisonous purple mushroom ghost with a red spotted cap', e_sandok: 'a green mountain dokkaebi bandit with a club',
  e_heukgom: 'BOSS: a huge black bear chief with a scar over its eye, standing',
  e_mulgwi: 'a drowned ghost dripping with seaweed', e_haepari: 'a purple poison jellyfish with glowing cyan tentacles',
  e_jipge: 'a red pincer crab yokai', e_agwi: 'an ugly anglerfish with a glowing lure and sharp teeth',
  e_daemuneo: 'BOSS: a giant purple octopus with a golden mark',
  e_buldok: 'a fire dokkaebi with two horns, burning hair and a club', e_hwajwi: 'a fire rat with a flaming back',
  e_yongam: 'a lava toad with glowing magma cracks', e_hwabak: 'a flame bat with burning wings',
  e_hwasan: 'BOSS: a volcano rock golem with glowing lava cracks',
  e_wonhon: 'a vengeful maiden ghost in blood-stained white hanbok with long black hair', e_dalgyal: 'a faceless gray ghost',
  e_haegol: 'a skeleton soldier with a spear', e_neukdae: 'a shadow wolf with glowing red eyes',
  e_saja: 'BOSS: Jeoseungsaja, the grim reaper in a black robe and wide black gat hat with a pale face',
  e_seoksang: 'a cracked stone haetae statue come to life', e_cheondung: 'a blue thunderbird crackling with lightning',
  e_gureum: 'a dark storm-cloud yokai with lightning bolts', e_geumgang: 'a golden armored temple guardian (geumgang yeoksa) with a spear',
  e_noesin: 'BOSS: the thunder god Noesin, a blue giant with a ring of drums behind him',
  r_heugimugi: 'RAID BOSS: a huge black imugi serpent-dragon with red eyes',
  r_gumiho: 'RAID BOSS: a dark purple nine-tailed fox queen with pink foxfire',
};

// 메인 캐릭터: 종족 3 × 성별 2 (직업 없음). 멋지고 전통적인 한국 판타지 MMORPG 도트 느낌
const COOL = 'Classic Korean fantasy MMORPG pixel sprite feel: stylish heroic SD proportions (about 2.5 to 3 heads tall, not baby-like), detailed traditional Joseon costume with flowing sleeves, ribbons and fabric folds, dancheong color accents (deep red, jade green, cobalt blue, gold), confident cool expression and dynamic stance, mystical and elegant, readable silhouette.';
const HEROES = [
  ['human_m', '인간 남자', 'a young human Joseon swordsman-taoist: black hair in a topknot with a long red headband whose tails flow in the wind, dark navy dopo coat over a white jeogori with gold trim, black boots, a hwando sword at the waist and a yellow paper talisman held between two fingers, sharp determined eyes'],
  ['fox_m', '구미호 남자', 'a REAL nine-tailed fox (gumiho), not a human: an elegant bipedal silver-white fox with a fox head, sharp golden eyes and red eye markings, wearing a dark violet Joseon noble durumagi robe and a black gat hat, nine large flowing tails with blue foxfire at the tips, dangerous charming smirk'],
  ['goblin_m', '도깨비 남자', 'a REAL dokkaebi, not a human: a muscular blue-skinned dokkaebi warrior with one great horn, wild white mane, fierce fangs, gold arm rings, tiger-skin wrap over dark hanbok pants, holding a huge spiked dokkaebi club crackling with blue lightning'],
  ['human_f', '인간 여자', 'a young human Joseon taoist heroine: long black hair half-tied with a jade binyeo hairpin and a red daenggi ribbon, white and crimson hanbok with long flowing sleeves and a sash, holding a folding fan with a taegeuk pattern, small paper talismans floating around her, calm and confident'],
  ['fox_f', '구미호 여자', 'a REAL nine-tailed fox (gumiho), not a human: a graceful bipedal snow-white fox with a fox head, crimson eye markings and long lashes, a jeweled hairpin between her ears, wearing a red and gold hanbok with long sleeves, nine large flowing tails with pink foxfire at the tips, alluring sly smile'],
  ['goblin_f', '도깨비 여자', 'a REAL dokkaebi, not a human: a crimson-skinned dokkaebi girl with one horn wrapped in a golden ring, wild curly hair, fierce fanged grin, dark jeogori with a tiger-skin skirt, holding a golden magic club strung with old lucky coins, ghostly blue dokkaebi fire around her'],
];
const HERO_SKILL = { human: 'throwing glowing paper talismans (bujeok) that burst into golden light', fox: 'conjuring swirling foxfire orbs', goblin: 'slamming the club to call blue lightning and dokkaebi fire' };
const POSES = 'Animation pose sheet of THIS SAME character from the attached image (keep exactly the same design, colors, costume and proportions), all facing right, 6 poses: 1) idle standing, 2) running, 3) melee attack with motion lines, 4) charging a spell (magic energy gathering around the hands), 5) releasing the spell forward with a magic burst, 6) hurt / knocked back.';

const groups = [];
// ---- 뽑기 몬스터: 9마리씩 (SSS 3종은 따로 크게) ----
const normal = LINES.filter(l => l.r !== 'SSS'), sss = LINES.filter(l => l.r === 'SSS');
const mg = { id: 'monster', title: '✅ 뽑기 몬스터 (82종)', note: '적용 완료 · 격자 10장 · 올려주시면 제가 잘라서 assets/monsters/ 에 넣어요 · 대표 모습(2단계) 기준', items: [] };
for (let i = 0, k = 1; i < normal.length; i += 9, k++) {
  const chunk = normal.slice(i, i + 9), n = chunk.length;
  const rows = n === 9 ? 3 : Math.ceil(n / 3), cols = 3;
  const grades = [...new Set(chunk.map(c => c.r))];
  const hint = grades.map(g => `${g}-rank: ${GRADE_HINT[g]}`).join('; ');
  const list = chunk.map((c, j) => `${j + 1}. ${D[c.id]}`).join('\n');
  const emptyNote = n < rows * cols ? ` Leave the last ${rows * cols - n} cell(s) empty magenta.` : '';
  mg.items.push({
    file: `grid_m${String(k).padStart(2, '0')}.png`, name: `${grades.join('·')}등급 ${i + 1}~${i + n}번`, tags: grades.map(g => g + '등급'),
    attach: k === 1 ? '' : 'grid_m01 결과 이미지 첨부 (같은 화풍 유지)',
    note: '순서: ' + chunk.map((c, j) => `${j + 1}.${c.n}`).join(' · '),
    prompt: `${k === 1 ? '' : 'Use exactly the same pixel art style, outline and pixel size as the attached image. '}${STYLE} ${GRID(rows, cols, n)}${emptyNote}\nRarity look: ${hint}.\n${list}`,
    _cast: { list: chunk, rows, cols },
  });
}
mg.items.push({
  file: `grid_m${String(mg.items.length + 1).padStart(2, '0')}.png`, name: 'SSS등급 3종 (크게)', tags: ['SSS등급'],
  attach: 'grid_m01 결과 이미지 첨부 (같은 화풍 유지)', note: '순서: ' + sss.map((c, j) => `${j + 1}.${c.n}`).join(' · '),
  prompt: `Use exactly the same pixel art style, outline and pixel size as the attached image, but these 3 are larger and more detailed. ${STYLE} ${GRID(1, 3, 3)}\nRarity look: ${GRADE_HINT.SSS}.\n${sss.map((c, j) => `${j + 1}. ${D[c.id]}`).join('\n')}`,
  _cast: { list: sss, rows: 1, cols: 3 },
});
groups.push(mg);

// ---- 적 몬스터: 9마리씩 3장 ----
const eg = { id: 'enemy', title: '✅ 적 몬스터 (27종)', note: '적용 완료 · 격자 3장 · 뽑기 몬스터와 다른 무서운 느낌 · assets/enemies/', items: [] };
for (let i = 0, k = 1; i < ENEMIES.length; i += 9, k++) {
  const chunk = ENEMIES.slice(i, i + 9);
  eg.items.push({
    file: `grid_e${String(k).padStart(2, '0')}.png`, name: `적 ${i + 1}~${i + chunk.length}번`, tags: [],
    attach: 'grid_m01 결과 이미지 첨부 (같은 화풍 유지)',
    note: '순서: ' + chunk.map((c, j) => `${j + 1}.${c.n}`).join(' · '),
    prompt: `Use exactly the same pixel art style, outline and pixel size as the attached image. ${STYLE} These are ENEMY monsters: a bit menacing but still chibi, angry red glowing eyes, darker colors; BOSS entries are bigger and more detailed. ${GRID(3, 3, chunk.length)}\n${chunk.map((c, j) => `${j + 1}. ${E[c.id]}`).join('\n')}`,
    _cast: { list: chunk.map(c => Object.assign({ el: c.ch }, c)), rows: 3, cols: 3, enemy: true },
  });
}
groups.push(eg);

// ---- 캐릭터: 6명 한 장 → 1명씩 고화질 → 동작 시트(마법 포함) ----
const hg = { id: 'hero', title: '✅ 메인 캐릭터 (인간·구미호·도깨비 × 남·여)', note: '적용 완료 · 직업 없음 · ① 6명 한 장으로 디자인 확정 → ② 1명씩 크게 → ③ 동작 6개(마법 모으기·발사 포함) · assets/hero/', items: [] };
const heroStyle = STYLE.replace('Cute chibi pixel art sprites', 'High quality pixel art main player character sprites').replace('big expressive eyes,', '');
const POS = ['top-left', 'top-middle', 'top-right', 'bottom-left', 'bottom-middle', 'bottom-right'];
hg.items.push({
  file: 'grid_h_all.png', name: '6명 한 장 (디자인 확정용)', tags: ['먼저'], attach: 'grid_m01 결과 이미지 첨부 (몬스터와 같은 도트 크기)',
  note: '순서: 위 줄 남자 인간·구미호·도깨비 / 아래 줄 여자 인간·구미호·도깨비',
  prompt: `Same pixel size and outline as the attached image, but these heroes are more detailed and cooler. ${heroStyle} ${COOL} All 6 are the same height and drawn at the same scale. ${GRID(2, 3, 6)}\nTop row = young men, bottom row = young women; columns left to right = human, gumiho, dokkaebi.\n${HEROES.map((h, j) => `${j + 1}. ${h[2]}`).join('\n')}`,
});
HEROES.forEach(([id, ko, desc], j) => hg.items.push({
  file: `hero_${id}.png`, name: `${ko} (1명 크게)`, tags: [], attach: 'grid_h_all 결과 이미지 첨부 (해당 캐릭터 디자인 그대로)', note: '',
  prompt: `Redraw only the ${POS[j]} character from the attached image as a single large sprite with much more detail, keeping exactly the same design, colors and pixel art style. ${heroStyle} ${COOL} Single character, full body, centered, facing right, flat solid magenta #FF00FF background, no text, square 1:1.\n${desc}`,
}));
HEROES.forEach(([id, ko]) => hg.items.push({
  file: `hero_${id}_poses.png`, name: `${ko} 동작 6개`, tags: ['움직임', '마법'], attach: `hero_${id} 결과 이미지 첨부`,
  note: '순서: 서있기 · 달리기 · 근접공격 · 마법 모으기 · 마법 발사 · 맞았을 때',
  prompt: `${POSES} Signature magic: ${HERO_SKILL[id.split('_')[0]]}. ${heroStyle} ${COOL} ${GRID(2, 3, 6)}`,
}));
groups.push(hg);

// ---- 마법 동작: 몬스터·적 격자를 같은 배치로 '마법 쓰는 모습' ----
const EL_MAGIC = { fire: 'fire magic', water: 'water magic', grass: 'nature magic with leaves and vines', light: 'golden holy light magic', dark: 'purple ghost-fire dark magic' };
const cg = { id: 'cast', title: '✅ 몬스터·적 마법 동작', note: '적용 완료 · 원본 격자와 같은 칸 배치로 마법 쓰는 모습 · 공격·맞는 동작은 게임 연출로 처리', items: [] };
for (const it of [...mg.items, ...eg.items]) {
  const c = it._cast, n = c.list.length;
  cg.items.push({
    file: it.file.replace('.png', '_cast.png'), name: `${it.name} · 마법 쓰는 모습`, tags: ['마법'], attach: `${it.file} 결과 이미지 첨부`,
    note: it.note,
    prompt: `Use the attached sprite sheet as the exact reference: the SAME ${n} characters in the SAME cell positions, same design, colors, pixel size and style. Redraw each one in a spell-casting pose (mouth open or arms/wings raised, body leaning forward) with a small matching magic effect glowing next to it, still facing right, still inside its own cell. ${STYLE} ${GRID(c.rows, c.cols, n)}\n${c.list.map((m, j) => `${j + 1}. ${m.n}: ${EL_MAGIC[m.el] || 'magic'}`).join('\n')}`,
  });
}
groups.push(cg);

// ---- 마법 이펙트: 6프레임 애니메이션 ----
const FX_STYLE = 'Pixel art spell effect animation sprite sheet for a Korean folklore fantasy RPG, 16-bit retro style, crisp hard pixels, no anti-aliasing, bright glowing colors, traditional Korean motifs, exactly 6 animation frames of equal size in one horizontal row, left to right in time order (appear, grow, peak, fade), no characters, no text, no letters, the entire background is flat solid black #000000.';
const FX = [
  ['fx_fire', '불 공격', 'a fireball flying right and exploding into flames with ember sparks'],
  ['fx_water', '물 공격', 'a swirling water orb bursting into a splash wave with droplets'],
  ['fx_wood', '나무 공격', 'sharp leaves and thorny vines whipping out and bursting'],
  ['fx_light', '빛 공격', 'a golden taegeuk-like circle of light expanding into radiant rays'],
  ['fx_dark', '어둠 공격', 'purple ghost-fire wisps spiraling and bursting into dark smoke'],
  ['fx_heal', '치유', 'soft green and gold sparkles rising with a blooming lotus flower'],
  ['fx_shield', '보호 결계', 'a round protective barrier with dancheong temple patterns appearing and shimmering'],
  ['fx_hit', '타격', 'a white and yellow impact spark with a slash streak'],
  ['fx_talisman', '인간: 부적술', 'a yellow paper talisman with abstract red brush marks flying right and exploding into golden light'],
  ['fx_foxfire', '구미호: 여우불', 'blue and pink foxfire orbs swirling together and blasting forward'],
  ['fx_dokkaebi', '도깨비: 벼락 방망이', 'a club smash shockwave on the ground with blue lightning bolts and flying gold coins'],
];
groups.push({ id: 'fx', title: '✅ 마법 이펙트 (11종)', note: '적용 완료 · 6프레임 애니메이션 · 검은 배경 그대로 OK (게임에서 빛나게 합성) · assets/fx/', items: FX.map(([id, ko, d]) => ({
  file: `${id}.png`, name: ko, tags: ['이펙트'], attach: 'grid_m01 결과 이미지 첨부 (같은 도트 크기)', note: '',
  prompt: `Same pixel size as the attached image. ${FX_STYLE}\nEffect: ${d}.`,
})) });

// ---- 🆕 자연스러운 모션: 몬스터 기본 공격 포즈 + 캐릭터 숨쉬기·공격 연속 프레임 ----
const ATK_KIND = { quad: 'pouncing forward with claws', fox: 'pouncing forward with claws', tiger: 'pouncing with a big claw swipe', lion: 'charging headbutt', horse: 'rearing up and kicking', boar: 'charging tusk tackle', bear: 'big paw swipe', goblin: 'swinging the club overhead', blob: 'jumping body slam', toad: 'tongue lash', bird: 'diving peck with wings spread', crane: 'sharp beak strike', owl: 'talon strike', bat: 'diving bite', insect: 'darting sting', phoenix: 'wing slash', fish: 'leaping tail slap', crab: 'claw pinch', octo: 'tentacle whip', jelly: 'stinging tentacle lash', wisp: 'flaming head-butt', ghost: 'scary lunge with claws', ghostlady: 'lunging with long hair whipping', egghost: 'sudden lunge', reaper: 'swinging a staff', shadow: 'giant shadow claw', turtle: 'shell bash', serpent: 'snapping strike', dragon: 'biting lunge', centipede: 'pincer bite', golem: 'ground punch', cloud: 'thunder bump', shoe: 'kicking hop', broom: 'sweeping swing', jar: 'rolling bash', millstone: 'heavy spin bash', lantern: 'swinging bump', coin: 'spinning roll', pouch: 'bouncing bump', gourd: 'head-butt', fan: 'sharp fan slash', mask: 'head-butt with a scary face', totem: 'heavy body slam', rock: 'rolling tackle' };
const ag = { id: 'motion', title: '🆕 자연스러운 모션 (25장)', note: '숨쉬기·흔들림은 코드로 처리 중 · 이 그림이 오면 공격이 더 생동감 있어져요 · 몬스터는 원본 격자와 같은 칸 배치', items: [] };
for (const it of [...mg.items, ...eg.items]) {
  const c = it._cast, n = c.list.length;
  ag.items.push({
    file: it.file.replace('.png', '_atk.png'), name: `${it.name} · 기본 공격 포즈`, tags: ['공격'], attach: `${it.file} 결과 이미지 첨부`,
    note: it.note,
    prompt: `Use the attached sprite sheet as the exact reference: the SAME ${n} characters in the SAME cell positions, same design, colors, pixel size and style. Redraw each one in the middle of a physical basic attack (NO magic): body leaning forward toward the right, a clear dynamic action pose with a few white motion lines, still facing right, still fully inside its own cell. ${STYLE} ${GRID(c.rows, c.cols, n)}\n${c.list.map((m, j) => `${j + 1}. ${m.n}: ${ATK_KIND[m.arch] || 'lunging strike'}`).join('\n')}`,
  });
}
const IDLE = 'Idle breathing animation of THIS SAME character from the attached image: exactly 4 frames in one horizontal row, the character stays in EXACTLY the same position, size and pose in every frame (pixel-identical except tiny changes): frame 1 neutral, frame 2 inhale (chest and shoulders rise by 1-2 pixels), frame 3 hold, frame 4 exhale back down; hair, ribbons, sleeves and tails sway very slightly. Do not move the feet. Same scale in all frames.';
const ATK4 = 'Basic attack animation of THIS SAME character from the attached image: exactly 4 frames in one horizontal row, keep the same design, colors and scale, feet stay on the same ground line: frame 1 anticipation (pulling back the weapon), frame 2 strike (fast swing with a white motion arc), frame 3 follow-through, frame 4 recover to ready stance.';
HEROES.forEach(([id, ko]) => {
  ag.items.push({ file: `hero_${id}_idle.png`, name: `${ko} 숨쉬기 4프레임`, tags: ['숨쉬기'], attach: `hero_${id} 결과 이미지 첨부`, note: '순서: 기본 · 들숨 · 멈춤 · 날숨',
    prompt: `${IDLE} ${heroStyle} ${COOL} ${GRID(1, 4, 4)}` });
  ag.items.push({ file: `hero_${id}_attack.png`, name: `${ko} 기본 공격 4프레임`, tags: ['공격'], attach: `hero_${id} 결과 이미지 첨부`, note: '순서: 예비동작 · 타격 · 마무리 · 복귀',
    prompt: `${ATK4} ${heroStyle} ${COOL} ${GRID(1, 4, 4)}` });
});
groups.push(ag);

// ===================== 다음 생성분 (2차) =====================
// ---- 등급별 스킬 이펙트: 모양·끝맺음이 전부 다르게, 등급이 오를수록 화려하게 ----
const FX2_STYLE = 'Pixel art skill effect animation sprite sheet for a Korean folklore fantasy RPG, same crisp 16-bit pixel style and pixel size as the attached effect sheet, bright glowing colors, traditional Korean motifs (dancheong patterns, taegeuk, clouds, talismans) but NO letters and NO text, frames of equal size in one horizontal row, left to right in time order, no characters, the entire background is flat solid black #000000.';
const TIER_LOOK = {
  1: 'Rank C-B: small and simple, quick and light, few particles.',
  2: 'Rank A: medium size, clearly more detail and a distinct shape.',
  3: 'Rank S: big and dramatic, fills most of the frame, layered glow and many particles.',
  4: 'Rank SS (Four Guardian Gods): huge, cinematic, a giant mythical creature made of energy appears, screen-filling.',
  5: 'Rank SSS (god tier): the most spectacular, cinematic ultimate move, multiple phases, radiant golden-white highlights, screen-filling, unforgettable finish.',
};
const FX2 = [
  // [파일, 이름, 등급단계, 프레임수, 시작~절정, 끝맺음(전부 다르게)]
  ['sk_fire_1', '불 C·B: 불씨 튕기기', 1, 6, 'a tiny ember pops forward and bursts into a few sparks', 'ends with a small curl of gray smoke drifting upward'],
  ['sk_fire_2', '불 A: 화염 화살', 2, 6, 'a flaming arrow streaks forward and sticks into the ground, flames licking up', 'ends with a scorched black mark on the ground with flickering embers'],
  ['sk_fire_3', '불 S: 화염 기둥', 3, 6, 'a roaring vertical pillar of fire erupts from a glowing crack in the ground', 'ends with the pillar collapsing into a rain of falling embers'],
  ['sk_water_1', '물 C·B: 물방울 튕기기', 1, 6, 'a small water droplet shoots forward and splashes', 'ends with expanding ripple rings on the ground'],
  ['sk_water_2', '물 A: 얼음 창', 2, 6, 'a sharp ice spear flies forward and pierces', 'ends with the spear shattering into glittering ice crystals that tinkle away'],
  ['sk_water_3', '물 S: 소용돌이 해일', 3, 6, 'a swirling whirlpool rises into a curling tidal wave that crashes down', 'ends with white foam and drifting mist settling'],
  ['sk_wood_1', '나무 C·B: 나뭇잎 표창', 1, 6, 'a flurry of spinning leaf blades flies forward', 'ends with a few leaves fluttering down slowly'],
  ['sk_wood_2', '나무 A: 가시덩굴 속박', 2, 6, 'thorny vines burst from the ground and wrap tightly around a spot', 'ends with the vines withering and crumbling into dry petals'],
  ['sk_wood_3', '나무 S: 신목의 뿌리', 3, 6, 'giant ancient tree roots erupt and a spirit tree blooms with plum blossoms', 'ends with a whirlwind of plum blossom petals swirling away'],
  ['sk_light_1', '빛 C·B: 별빛 반짝', 1, 6, 'a small star twinkles and pops', 'ends with a single gentle twinkle fading out'],
  ['sk_light_2', '빛 A: 빛의 검 교차', 2, 6, 'two golden light blades slash in an X', 'ends with the X lines fading and leaving glowing dancheong-pattern sparks'],
  ['sk_light_3', '빛 S: 천상의 빛기둥', 3, 6, 'a holy beam of light falls from the sky onto a glowing mandala circle', 'ends with soft feathers of light drifting down'],
  ['sk_dark_1', '어둠 C·B: 혼불 깨물기', 1, 6, 'a little purple ghost wisp dashes forward and bites', 'ends with the wisp giggling and vanishing in a puff of smoke'],
  ['sk_dark_2', '어둠 A: 그림자 손', 2, 6, 'shadowy hands reach up from a dark pool and grab', 'ends with the hands sinking back into a shrinking black puddle'],
  ['sk_dark_3', '어둠 S: 원혼의 사슬', 3, 6, 'a swarm of wailing spirits and black chains spirals and binds', 'ends with the chains snapping and spirits scattering like ash'],
  ['sk_hit_slash', '기본 공격: 베기', 1, 4, 'a sharp white crescent slash', 'ends with thin slash lines fading'],
  ['sk_hit_bite', '기본 공격: 물기', 1, 4, 'big cartoon fangs snapping shut with impact lines', 'ends with tooth-mark sparkles'],
  ['sk_hit_blunt', '기본 공격: 내려치기', 1, 4, 'a heavy blunt impact star with a ground crack', 'ends with dust puffs and a small rock spray'],
  ['sk_ss_cheongryong', 'SS 청룡: 푸른 용의 승천', 4, 8, 'a long azure water dragon made of water spirals across the frame, roars, and dives down', 'ends with a gentle rain of glowing blue scales and droplets'],
  ['sk_ss_baekho', 'SS 백호: 백호의 발톱', 4, 8, 'a giant translucent white tiger leaps out and rakes three huge claw slashes with a lightning roar shockwave', 'ends with three glowing claw marks that crack and break apart'],
  ['sk_ss_jujak', 'SS 주작: 불새의 강림', 4, 8, 'a vermilion phoenix of fire spreads its wings wide and dives in a firestorm', 'ends with burning feathers floating down and burning out one by one'],
  ['sk_ss_hyeonmu', 'SS 현무: 거북 등껍질 진', 4, 8, 'a giant black tortoise shell barrier slams down while a serpent of dark water strikes, earthquake shockwave', 'ends with hexagonal shell fragments sinking into the ground'],
  ['sk_ss_girin', 'SS 기린: 상서로운 질주', 4, 8, 'a radiant qilin gallops across leaving golden auspicious clouds and flowers, then bursts', 'ends with rainbow-colored auspicious clouds slowly dissolving'],
  ['sk_sss_hwangryong', 'SSS 황룡: 천룡강림', 5, 8, 'the heavens split open, a colossal golden dragon descends through swirling clouds, coils, and fires a blinding beam from its red yeouiju pearl', 'ends with a giant golden sun-disc mandala slowly fading while golden dust rains down'],
  ['sk_sss_cheonho', 'SSS 천호: 구미호 여우불 폭풍', 5, 8, 'nine huge fox tails fan out into a giant flower of blue and pink foxfire, then nine foxfire comets rain down one after another', 'ends with a fox-face shaped flame winking and vanishing into cherry blossom petals'],
  ['sk_sss_yeomra', 'SSS 염라: 저승문 심판', 5, 8, 'a massive red-lacquered underworld gate rises from the ground and swings open, ghostly black chains and blue soul flames pull everything inside', 'ends with the gate slamming shut, leaving a burning circular seal mark (abstract symbols, no letters) that fades'],
];
groups.push({ id: 'skillfx', title: '🆕 등급별 스킬 이펙트 (26종)', note: '끝나는 모양이 전부 다름 · C·B → A → S → SS(사신 전용) → SSS(전용 궁극기) 순으로 화려해짐 · 검은 배경 OK · assets/fx/', items: FX2.map(([id, ko, t, n, a, end]) => ({
  file: `${id}.png`, name: ko, tags: [['', 'C·B', 'A', 'S', 'SS', 'SSS'][t], `${n}프레임`], attach: '받은 이펙트 시트 아무거나 1장 첨부 (예: fx_fire)', note: '',
  prompt: `${FX2_STYLE} Exactly ${n} frames. ${TIER_LOOK[t]}\nAnimation: ${a}; ${end}. Make the final frames clearly different from a generic explosion.`,
})) });

// ---- 맵 (전투 배경) ----
const MAP_STYLE = 'Pixel art battle background for a Korean folklore fantasy mobile RPG, same crisp 16-bit pixel style as the attached image, Joseon-era fairy-tale mood, vertical portrait 3:4 (for example 1536x2048), the top 45% is sky and distant scenery with props, the bottom 55% is a wide FLAT open ground where characters stand, keep the middle of the ground empty (no big objects there), detailed but not busy, no characters, no text, no UI.';
const MAPS = [
  ['bg_grass', '1장: 산골 마을', 'a peaceful mountain village in spring: thatched-roof and tiled-roof hanok houses, stone walls, persimmon trees, distant green mountains, a jangseung pair at the village entrance, grassy dirt-path ground'],
  ['bg_water', '2장: 바닷가 포구', 'a seaside fishing harbor: wooden boats with sails, sandy beach, rocky cliffs with pine trees, blue sea and seagulls, wet sand ground'],
  ['bg_fire', '3장: 화산 계곡', 'a volcanic valley: smoking volcano, lava rivers in the distance, scorched dead trees, red-orange sky with ash, cracked dark rock ground with glowing seams'],
  ['bg_dark', '4장: 귀신 나오는 밤 숲', 'a haunted forest at night: huge purple full moon, twisted bare trees, old graves and stone markers, ghostly blue fires, mist, dark grass ground'],
  ['bg_light', '5장: 하늘 궁궐', 'a heavenly palace above the clouds: golden-roofed palace halls with dancheong colors, floating islands, rainbow and light rays, white marble floor ground'],
  ['bg_raid', '레이드: 요괴 소굴', 'the entrance to the underworld: giant red gate, chains, lanterns with blue soul fire, dark red sky, cracked stone courtyard ground'],
  ['bg_arena', '아레나: 무술 대련장', 'a traditional martial arts courtyard at dusk: wooden pavilion, colorful festival flags, drums, spectators silhouettes far in the background, packed sand ground with a ring (ssireum style)'],
];
groups.push({ id: 'map', title: '🆕 맵 · 전투 배경 (7장)', note: '세로 3:4 · 아래 55%는 캐릭터가 서는 평평한 땅 · assets/bg/', items: MAPS.map(([id, ko, d]) => ({
  file: `${id}.png`, name: ko, tags: [], attach: 'grid_m01 결과 이미지 첨부 (같은 도트 화풍)', note: '',
  prompt: `${MAP_STYLE}\nScene: ${d}.`,
})) });

// ---- 장비 아이콘: 한 줄 6개 (C → SSS) ----
const GEAR_STYLE = 'Pixel art RPG item icon sprite sheet, same crisp 16-bit pixel style as the attached image, Korean Joseon fantasy design, exactly 6 items of the same kind in one horizontal row, evenly spaced, equal size, left to right getting rarer and more magnificent: 1) C common plain and worn, 2) B sturdy with blue accents, 3) A fine craftsmanship with jade and purple gems, 4) S heroic, ornate gold with a soft glow, 5) SS legendary, gold and red with dancheong patterns and strong glow, 6) SSS mythic, radiant white-gold with rainbow aura and sparkles. Dark 1-pixel outline, no text, no labels, flat solid magenta #FF00FF background.';
const GEARS = [
  ['weapon_human', '인간 무기: 환도', 'Korean hwando sabers'],
  ['weapon_fox', '구미호 무기: 여우구슬', 'magical fox beads (yeowoo guseul) floating with foxfire'],
  ['weapon_goblin', '도깨비 무기: 방망이', 'dokkaebi clubs (bangmangi) with studs'],
  ['armor', '갑옷', 'Joseon armors: from a simple cloth jeogori to studded dujeonggap armor to a royal golden armor'],
  ['helmet', '머리 장비', 'Korean headgear: from a cloth headband to a straw hat, jeollip warrior hat, iron helmet, golden helmet with plume, and a royal crown'],
  ['ring', '가락지', 'Korean rings (garakji) with gems'],
  ['collar', '몬스터 목걸이', 'cute pet collars with a norigae tassel pendant'],
  ['charm', '몬스터 부적', 'charms: from a paper talisman to a jade pendant to a golden amulet'],
];
groups.push({ id: 'gear', title: '🆕 장비 아이콘 (시트 8장 → 48개)', note: '한 줄에 C~SSS 6개 · 제가 잘라서 등급별 파일로 넣어요 · 캐릭터가 끼면 아이콘·효과로 표시 · assets/gear/', items: GEARS.map(([id, ko, d]) => ({
  file: `${id}_sheet.png`, name: ko, tags: ['C~SSS'], attach: 'grid_m01 결과 이미지 첨부', note: '순서: C · B · A · S · SS · SSS',
  prompt: `${GEAR_STYLE}\nItems: ${d}.`,
})) });

// ---- UI 아이콘 ----
groups.push({ id: 'ui', title: '🆕 UI 아이콘 (시트 2장)', note: '16개 · assets/ui/', items: [
  ['ui_sheet_1', '재화·메뉴 8개', 'a pile of old Korean brass coins (gold), a shiny diamond, a glowing purple evolution crystal orb, a hammer with a glowing enhancement stone, a calendar scroll, a quest scroll with a red ribbon, a lacquered treasure chest, a lightning boost talisman', 'gold, gems, stones, ench, attend, quest, chest, boost'],
  ['ui_sheet_2', '모험·탭 8개', 'a golden trophy, a compass, a traveler bundle bag (bottari), crossed swords, a paw print, a glowing egg, a treasure map, a market stall bag', 'arena, exped, bag, nav_home, nav_mons, nav_summon, nav_adv, nav_shop'],
].map(([id, ko, d, keys]) => ({
  file: `${id}.png`, name: ko, tags: [], attach: 'grid_m01 결과 이미지 첨부', note: '순서: ' + keys,
  prompt: `Pixel art game UI icon sprite sheet, same crisp 16-bit pixel style as the attached image, Korean Joseon fantasy design, exactly 8 icons in 2 rows of 4, evenly spaced, equal size, glossy and cute, dark 1-pixel outline, no text, flat solid magenta #FF00FF background.\nIcons: ${d}.`,
})) });

function md() {
  const out = ['# 🧩 제미나이 격자 프롬프트 (한 장에 여러 마리)', '',
    '- 프롬프트를 **통째로** 복사해 제미나이에 붙여넣으세요. 첨부 표시가 있으면 그 이미지를 같이 올리세요.',
    '- 결과 이미지는 **파일 이름 그대로** 저장해서 대화창에 올려주세요. 잘라서 게임에 넣는 건 제가 합니다.',
    '- 칸이 삐뚤거나 그림에 글자가 들어가면 같은 프롬프트로 다시 뽑으면 돼요.', ''];
  for (const g of groups) {
    out.push(`## ${g.title}`, '', `> ${g.note}`, '');
    for (const it of g.items) {
      out.push(`### \`${it.file}\` ${it.name}`);
      if (it.attach) out.push(`첨부: ${it.attach}`);
      out.push(it.note, '', '```', it.prompt, '```', '');
    }
  }
  fs.writeFileSync(path.join(ROOT, 'docs/PROMPTS_GRID.md'), out.join('\n'));
}

groups.sort((a, b) => (a.title.startsWith("🆕") ? 0 : 1) - (b.title.startsWith("🆕") ? 0 : 1)); // 새로 만들 것 먼저
md();
if (process.argv[2]) {
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/prompts_page.html'), 'utf8')
    .replace('몬스터 키우기 프롬프트북', '몬스터 키우기 프롬프트북')
    .replace('제미나이에 그대로 붙여넣는 도트 그림 프롬프트 모음이에요. 위에서부터 순서대로 만들면 화풍이 맞춰져요.',
      '🆕 표시가 다음에 만들 것들이에요 (스킬 이펙트·맵·장비·UI). ✅ 표시는 이미 받아서 게임에 넣은 것이에요.');
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  fs.writeFileSync(process.argv[2], tpl.replace('__DATA__', JSON.stringify(groups)).replace('__TOTAL__', String(total)));
}
console.log(groups.map(g => g.title + ': ' + g.items.length).join(' / '));
