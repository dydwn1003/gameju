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

// 메인 캐릭터: 종족 3 × 성별 2 (직업 없음). 최대한 만화처럼.
const CARTOON = 'Very cartoony and expressive like a Korean webtoon/comic: exaggerated chibi proportions (big head, about 2 heads tall), huge sparkling eyes, bold personality in the pose and facial expression, playful and lively.';
const HEROES = [
  ['human_m', '인간 남자', 'a human boy hero: messy black hair tied in a small topknot with a red headband, blue hanbok jeogori jacket with white collar and gray baji pants, straw sandals, a wooden sword on his shoulder, big confident grin'],
  ['fox_m', '구미호 남자', 'a REAL nine-tailed fox (gumiho), not a human: an anthropomorphic white fox boy standing on two legs, fox head with pointed ears and long snout, nine big fluffy tails fanned out behind him with golden tips, wearing a small purple hanbok vest, a blue foxfire flame floating above one paw, sly smirk'],
  ['goblin_m', '도깨비 남자', 'a REAL dokkaebi goblin, not a human: blue-skinned stocky goblin boy with one big horn on his forehead, wild spiky hair, sharp fangs in a huge toothy grin, tiger-skin pants, holding a spiked wooden dokkaebi club (bangmangi)'],
  ['human_f', '인간 여자', 'a human girl hero: long black hair in a single braid tied with a red daenggi ribbon, yellow jeogori jacket with red otgoreum bow and a pink chima skirt, holding a red-and-blue folding fan, cheerful wink'],
  ['fox_f', '구미호 여자', 'a REAL nine-tailed fox (gumiho), not a human: an anthropomorphic white fox girl standing on two legs, fox head with big ears and long eyelashes, nine big fluffy tails with pink tips fanned out behind her, a flower hairpin and red silk ribbon, a pink foxfire orb in her paw, mischievous smile'],
  ['goblin_f', '도깨비 여자', 'a REAL dokkaebi goblin, not a human: red-skinned goblin girl with one horn, curly hair in two buns, sharp little fangs in a big laugh, tiger-skin skirt, holding a small golden dokkaebi club with lucky coins'],
];
const POSES = 'Character pose sheet of THIS SAME character from the attached image (keep exactly the same design, colors, outfit and proportions): 4 poses in one horizontal row, all facing right: 1) idle standing, 2) running, 3) attacking with a big dynamic action and motion lines, 4) hurt / knocked back with a funny comic expression.';

const groups = [];
// ---- 뽑기 몬스터: 9마리씩 (SSS 3종은 따로 크게) ----
const normal = LINES.filter(l => l.r !== 'SSS'), sss = LINES.filter(l => l.r === 'SSS');
const mg = { id: 'monster', title: '뽑기 몬스터 (82종)', note: '격자 10장 · 올려주시면 제가 잘라서 assets/monsters/ 에 넣어요 · 대표 모습(2단계) 기준', items: [] };
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
  });
}
mg.items.push({
  file: `grid_m${String(mg.items.length + 1).padStart(2, '0')}.png`, name: 'SSS등급 3종 (크게)', tags: ['SSS등급'],
  attach: 'grid_m01 결과 이미지 첨부 (같은 화풍 유지)', note: '순서: ' + sss.map((c, j) => `${j + 1}.${c.n}`).join(' · '),
  prompt: `Use exactly the same pixel art style, outline and pixel size as the attached image, but these 3 are larger and more detailed. ${STYLE} ${GRID(1, 3, 3)}\nRarity look: ${GRADE_HINT.SSS}.\n${sss.map((c, j) => `${j + 1}. ${D[c.id]}`).join('\n')}`,
});
groups.push(mg);

// ---- 적 몬스터: 9마리씩 3장 ----
const eg = { id: 'enemy', title: '적 몬스터 (27종)', note: '격자 3장 · 뽑기 몬스터와 다른 무서운 느낌 · assets/enemies/', items: [] };
for (let i = 0, k = 1; i < ENEMIES.length; i += 9, k++) {
  const chunk = ENEMIES.slice(i, i + 9);
  eg.items.push({
    file: `grid_e${String(k).padStart(2, '0')}.png`, name: `적 ${i + 1}~${i + chunk.length}번`, tags: [],
    attach: 'grid_m01 결과 이미지 첨부 (같은 화풍 유지)',
    note: '순서: ' + chunk.map((c, j) => `${j + 1}.${c.n}`).join(' · '),
    prompt: `Use exactly the same pixel art style, outline and pixel size as the attached image. ${STYLE} These are ENEMY monsters: a bit menacing but still chibi, angry red glowing eyes, darker colors; BOSS entries are bigger and more detailed. ${GRID(3, 3, chunk.length)}\n${chunk.map((c, j) => `${j + 1}. ${E[c.id]}`).join('\n')}`,
  });
}
groups.push(eg);

// ---- 캐릭터: 6명 한 장 → 1명씩 고화질 → 동작 시트 ----
const hg = { id: 'hero', title: '메인 캐릭터 (인간·구미호·도깨비 × 남·여)', note: '직업 없음 · ① 6명 한 장으로 디자인 확정 → ② 1명씩 크게 → ③ 동작 4개 · assets/hero/', items: [] };
const heroStyle = STYLE.replace('sprites', 'main player character sprites');
hg.items.push({
  file: 'grid_h_all.png', name: '6명 한 장 (디자인 확정용)', tags: ['먼저'], attach: 'grid_m01 결과 이미지 첨부 (몬스터와 같은 화풍)',
  note: '순서: 위 줄 남자 인간·구미호·도깨비 / 아래 줄 여자 인간·구미호·도깨비',
  prompt: `Use exactly the same pixel art style, outline and pixel size as the attached image. ${heroStyle} ${CARTOON} All 6 are the same height and drawn at the same scale. ${GRID(2, 3, 6)}\nTop row = boys, bottom row = girls; columns left to right = human, gumiho, dokkaebi.\n${[0, 1, 2, 3, 4, 5].map(j => `${j + 1}. ${HEROES[j][2]}`).join('\n')}`,
});
HEROES.forEach(([id, ko, desc]) => hg.items.push({
  file: `hero_${id}.png`, name: `${ko} (1명 크게)`, tags: [], attach: 'grid_h_all 결과 이미지 첨부 (해당 캐릭터 디자인 그대로)',
  note: '',
  prompt: `Redraw only the ${ko === '인간 남자' ? 'top-left' : ko === '구미호 남자' ? 'top-middle' : ko === '도깨비 남자' ? 'top-right' : ko === '인간 여자' ? 'bottom-left' : ko === '구미호 여자' ? 'bottom-middle' : 'bottom-right'} character from the attached image as a single large sprite with more detail, keeping exactly the same design, colors and pixel art style. ${heroStyle} ${CARTOON} Single character, full body, centered, facing right, flat solid magenta #FF00FF background, no text, square 1:1.\n${desc}`,
}));
HEROES.forEach(([id, ko]) => hg.items.push({
  file: `hero_${id}_poses.png`, name: `${ko} 동작 4개`, tags: ['움직임'], attach: `hero_${id} 결과 이미지 첨부`,
  note: '순서: 서있기 · 달리기 · 공격 · 맞았을 때',
  prompt: `${POSES} ${heroStyle} ${CARTOON} ${GRID(1, 4, 4)}`,
}));
groups.push(hg);

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

md();
if (process.argv[2]) {
  const tpl = fs.readFileSync(path.join(ROOT, 'tools/prompts_page.html'), 'utf8')
    .replace('몬스터 키우기 프롬프트북', '몬스터 키우기 프롬프트북')
    .replace('제미나이에 그대로 붙여넣는 도트 그림 프롬프트 모음이에요. 위에서부터 순서대로 만들면 화풍이 맞춰져요.',
      '제미나이 한 번에 여러 마리를 그리는 격자 프롬프트예요. 맨 위 grid_m01부터 만들면 그 그림이 화풍 기준이 돼요.');
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  fs.writeFileSync(process.argv[2], tpl.replace('__DATA__', JSON.stringify(groups)).replace('__TOTAL__', String(total)));
}
console.log(groups.map(g => g.title + ': ' + g.items.length).join(' / '));
