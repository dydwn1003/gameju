// 저승사자 키우기 — 제미나이 도트 그림 프롬프트 생성
// node reaper/tools/gen_prompts.js [promptbook.html]  →  reaper/docs/PROMPTS.md (+ 프롬프트북 HTML)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

const STYLE = 'Tiny super-deformed chibi (2 heads tall, very small and adorable), very low-resolution pixel sprite as if drawn on a 16x20 pixel canvas and scaled up with nearest-neighbor so every pixel is a big visible square block, minimal details, cute chibi pixel art for a Korean folklore idle mobile game about a Joseon-era grim reaper (jeoseung-saja) collecting wandering souls, eerie but adorable moonlit-night mood, traditional Korean motifs (black gat hats, hanbok robes, hanji paper scrolls, dancheong colors, cheongsachorong lanterns), 16-bit retro SNES style, crisp hard pixel edges, every pixel clearly visible, no anti-aliasing, no blur, no gradients, limited palette of deep indigo, black, bone white, soul blue and accent red/gold, dark 1-pixel outline, soft cel shading with 2-3 tones, big expressive eyes.';
const SHEET = (n, r, c) => `Sprite sheet: exactly ${n} images arranged in a ${c}x${r} grid of equal square cells (${c} columns, ${r} rows), one per cell, each centered in its own cell with empty margin around it, nothing crossing into other cells, all at the same pixel size and scale, no grid lines, no frames, no labels, no numbers, no text anywhere, the entire background is one flat solid magenta color #FF00FF. Order: left to right, top to bottom.`;
const STRIP = 'A horizontal strip of exactly 6 animation frames of the SAME effect, left to right, in 6 equal square cells side by side, the effect centered in each cell, growing then fading over the frames, glowing pixel colors only (no soft blur), no characters, no grid lines, no text, the entire background is one flat solid magenta color #FF00FF.';
const list = a => a.map((x, i) => `${i + 1}. ${x}`).join('\n');

const MALE = 'a young chibi male grim reaper of Korean folklore: pale white face, calm sharp dark eyes, a wide-brimmed black traditional gat hat with a string of amber beads hanging under the chin, a long black dopo robe with a white collar band crossing at the chest, a thin red sash belt tied with a hanging tassel, black shoes, holding a rolled hanji paper scroll (the ledger of the dead) in one hand';
const FEMALE = 'a young chibi female grim reaper of Korean folklore: pale white face, long straight black hair with bangs, red lips, calm dark eyes with lashes, a black traditional gat hat with a string of amber beads, a black jeogori top with a white collar and a long red goreum ribbon, a dark purple long chima skirt, a small red-and-gold norigae tassel at the waist, holding a rolled hanji paper scroll (the ledger of the dead) in one hand';
const POSES = [
  'standing idle, relaxed',
  'idle breathing: same pose but shoulders slightly lowered and body 1 pixel squashed',
  'walking: left foot forward, robe swaying',
  'walking: right foot forward, robe swaying the other way',
  'casting: raising the scroll high with one hand, the scroll unrolling open',
  'reaping: the open scroll glowing gold while a small blue soul flame spirals into it',
];
const RANK_LOOKS = [
  '수습 차사 (trainee): plain black robe, no beads, small plain hat, nervous smile',
  '말단 차사 (junior): black robe with a red sash belt',
  '차사 (reaper): black robe, red sash, amber bead string on the gat, scroll at the waist',
  '선임 차사 (senior): longer black dopo with silver trim, a small blue lantern hanging at the belt',
  '차사장 (chief reaper): dark navy robe with gold embroidery and red lining, confident pose',
  '판관 (judge): dark red Joseon official robe with a crane rank badge on the chest, black winged samo hat',
  '명부 판관 (ledger judge): deep crimson official robe with a golden rank badge, carrying a big thick ledger book',
  '시왕 (one of the Ten Kings): black-and-royal-blue robe with golden dragon embroidery, jade belt, small golden crown hat',
  '염라대왕 (King Yeomra of the underworld): majestic crimson-and-gold royal dragon robe, myeonryugwan crown with hanging bead strings, holding a hol tablet, small red flames behind',
];

const groups = [];
const G = (id, title, note, items) => groups.push({ id, title, note, items: items.map(it => Object.assign({ tags: [] }, it)) });

G('hero', '① 주인공 저승사자', '가장 먼저! 이 그림이 전체 화풍의 기준이 돼요. 남자를 먼저 만들고, 여자는 남자 그림을 첨부해서 같은 화풍으로 만들어요.', [
  { file: 'reaper_m_sheet.png', name: '남자 저승사자 · 6동작', tags: ['화풍 기준'], note: '칸 순서: 서기 · 숨쉬기 · 걷기1 · 걷기2 · 명부 펼치기 · 혼 거두기',
    prompt: `The SAME single character shown in 6 animation poses: ${MALE}. Full body, facing right in 3/4 view, identical design, size and colors in every cell, feet on the same baseline. ${STYLE} ${SHEET(6, 2, 3)}\n${list(POSES)}` },
  { file: 'reaper_f_sheet.png', name: '여자 저승사자 · 6동작', attach: 'reaper_m_sheet.png 결과 이미지 첨부', note: '칸 순서는 남자와 같아요',
    prompt: `Use the attached sprite sheet as the exact style, pixel size and pose reference. Draw a NEW character in the same 6 poses in the same cells: ${FEMALE}. Full body, facing right in 3/4 view, identical design, size and colors in every cell, feet on the same baseline. ${STYLE} ${SHEET(6, 2, 3)}\n${list(POSES)}` },
  { file: 'reaper_m_portrait.png', name: '남자 저승사자 · 얼굴 초상', attach: 'reaper_m_sheet.png 결과 이미지 첨부', note: '캐릭터 선택 화면 · 승진 팝업에 써요',
    prompt: `Use the attached sprite sheet as the exact character and style reference. Draw a single larger bust portrait (head and shoulders) of the SAME male grim reaper, facing slightly right, gentle mysterious smile, the gat hat brim fully visible, centered with empty margin. ${STYLE} One image only, no text, the entire background is one flat solid magenta color #FF00FF.` },
  { file: 'reaper_f_portrait.png', name: '여자 저승사자 · 얼굴 초상', attach: 'reaper_f_sheet.png 결과 이미지 첨부', note: '캐릭터 선택 화면 · 승진 팝업에 써요',
    prompt: `Use the attached sprite sheet as the exact character and style reference. Draw a single larger bust portrait (head and shoulders) of the SAME female grim reaper, facing slightly right, gentle mysterious smile, hair and red goreum ribbon visible, centered with empty margin. ${STYLE} One image only, no text, the entire background is one flat solid magenta color #FF00FF.` },
]);

G('rank', '② 직급별 옷차림', '승진할 때마다 옷이 바뀌어요. 주인공 그림을 첨부하면 얼굴이 같게 나와요.', [
  { file: 'rank_m.png', name: '남자 · 직급 9단계 옷', attach: 'reaper_m_sheet.png 결과 이미지 첨부', note: '칸 순서 = 직급 순서 (수습 차사 → 염라대왕)',
    prompt: `Use the attached sprite sheet as the exact character and style reference. Draw the SAME male grim reaper 9 times, standing idle facing right in 3/4 view, same face, body size and pixel size, but each wearing a progressively grander outfit for his rank in the underworld office. ${STYLE} ${SHEET(9, 3, 3)}\n${list(RANK_LOOKS)}` },
  { file: 'rank_f.png', name: '여자 · 직급 9단계 옷', attach: 'reaper_f_sheet.png 결과 이미지 첨부', note: '칸 순서 = 직급 순서 (여자 버전 한복 느낌으로)',
    prompt: `Use the attached sprite sheet as the exact character and style reference. Draw the SAME female grim reaper 9 times, standing idle facing right in 3/4 view, same face, long hair, body size and pixel size, but each wearing a progressively grander feminine hanbok-style outfit for her rank in the underworld office. ${STYLE} ${SHEET(9, 3, 3)}\n${list(RANK_LOOKS)}` },
]);

const SOULS1 = [
  'wandering soul: small round pale-blue soul flame with a curly flame tail on top, two dot eyes, pink cheeks (common)',
  'clear soul: same shape in mint green, sparkling (uncommon)',
  'golden soul: same shape in bright gold with tiny star sparkles (rare)',
  'grudge soul: same shape in crimson red with a slightly angry face (very rare)',
  'child soul: tiny blue soul flame wearing a little red hair ribbon',
  'grandpa soul: blue soul flame with a white beard and a tiny gat hat',
  'scholar soul: blue soul flame wearing a small black scholar hat, holding a tiny brush',
  'bride soul: pink soul flame with a jokduri bridal crown and red cheek dots',
  'warrior soul: blue soul flame wearing a tiny Joseon soldier helmet with a red tassel',
];
const SOULS2 = [
  'fisherman soul: teal soul flame with a straw hat',
  'merchant soul: soul flame carrying a tiny money pouch',
  'monk soul: soul flame with a tiny wooden prayer bead necklace',
  'dancer soul: soul flame waving a tiny fan',
  'drunk soul: red-cheeked soul flame holding a tiny makgeolli bowl',
  'cat soul: soul flame with cat ears and whiskers',
  'dog soul: soul flame with floppy dog ears',
  'twin souls: two tiny soul flames holding hands',
  'ancient soul: big purple soul flame with an old wise face and glowing aura',
];
G('soul', '③ 혼령 (거두는 대상)', '1번 장의 1~4번이 게임 속 혼령 등급(파랑·초록·황금·붉음)이에요. 나머지는 나중에 혼령 도감에 써요.', [
  { file: 'souls_01.png', name: '혼령 1~9 (등급 4종 + 특별 혼령)', tags: ['게임에 바로 사용'],
    prompt: `9 different cute floating soul spirits (hon-bul, ghost flames of the dead) for a grim reaper game, each small and round with a flame-shaped tail, glowing pixel colors, adorable faces. ${STYLE} ${SHEET(9, 3, 3)}\n${list(SOULS1)}` },
  { file: 'souls_02.png', name: '혼령 10~18 (도감용)', attach: 'souls_01.png 결과 이미지 첨부',
    prompt: `Use the attached sprite sheet as the exact style, size and shape reference. Draw 9 NEW cute floating soul spirits in the same style. ${STYLE} ${SHEET(9, 3, 3)}\n${list(SOULS2)}` },
]);

const WRAITHS = [
  'cheonyeo-gwisin: maiden ghost in a white sobok mourning dress, long black hair covering half her face, one glowing red eye, floating with no feet (이승 마을)',
  'mul-gwisin: drowned water ghost, pale blue skin, dripping wet hair, seaweed tangled (삼도천)',
  'dalgyal-gwisin: egg ghost with a smooth blank egg-shaped face and white robe, creepy but cute',
  'mongdal-gwisin: bachelor ghost in a white robe with a topknot, sad face',
  'jangsanbeom: white long-haired tiger-like mountain monster on all fours (서낭당 고갯길)',
  'gumiho wraith: nine-tailed fox spirit with glowing purple foxfire tails, half fox half woman',
  'jeoseung gatekeeper: huge horned red ogre guard of the underworld gate with an iron club (저승문)',
  'bulgasari: iron-eating beast of legend made of dark iron plates, glowing eyes',
  'trial wraith: giant shadowy vengeful spirit wrapped in torn black ledger pages, red glowing eyes, the promotion exam boss (명부전)',
];
G('wraith', '④ 원귀 · 승진 시험 보스', '가끔 나타나는 원귀와 승진 시험 보스예요. 혼령보다 훨씬 크게(약 2배) 그려져요.', [
  { file: 'wraiths_01.png', name: '원귀 9종',
    prompt: `9 different vengeful ghosts and underworld monsters from Korean folklore, spooky but still chibi-cute, each about the same height as the tiny reaper, full body, floating or standing, facing left toward the player in 3/4 view. ${STYLE} ${SHEET(9, 3, 3)}\n${list(WRAITHS)}` },
]);

G('minion', '⑤ 졸개 차사 (부하)', '고용하면 화면을 돌아다니며 혼을 거두는 작은 부하예요. 주인공보다 작게(약 0.6배).', [
  { file: 'minions_01.png', name: '졸개 차사 9종', attach: 'reaper_m_sheet.png 결과 이미지 첨부',
    prompt: `Use the attached sprite sheet as the style reference. Draw 9 different tiny helper grim reapers (jolgae-chasa, underworld errand runners), smaller and rounder than the main character (about 60% of its height), big heads, full body, facing right in 3/4 view, each one carrying something to catch souls. ${STYLE} ${SHEET(9, 3, 3)}\n${list([
      'grey robe, small black gat, holding a butterfly net',
      'dark blue robe, holding a small blue lantern on a stick',
      'black robe, carrying a big jar to store souls',
      'grey-green robe, holding a long-handled ladle',
      'navy robe with a red headband, running pose',
      'black robe, sleepy face, hugging a thin scroll',
      'grey robe with a straw raincoat (dorongi)',
      'chubby one in a dark robe holding a gourd bottle',
      'tall thin one with a long black gat and a bamboo pole',
    ])}` },
]);

const BG = (place, props) => `Pixel art game background scene for a vertical mobile game, portrait 4:5 aspect ratio, NO characters, NO souls, NO text. ${place} Composition: the upper 55% is night sky with a big pale full moon on the upper right, scattered stars and layered distant mountain silhouettes; the lower 45% is flat open ground seen from slightly above, with a soft dirt path crossing horizontally, mostly EMPTY in the middle so characters can walk on it; ${props} placed only near the left and right edges. ${STYLE} Full-bleed single image filling the whole canvas, no border.`;
G('bg', '⑥ 지역 배경 5곳', '승진할수록 근무지가 바뀌어요. 가운데 땅은 비워두라고 써놨어요 (캐릭터가 걸어 다니는 자리).', [
  { file: 'bg_village.png', name: '이승 마을 (1~2단계)', prompt: BG('Location: a quiet Joseon-era village at night, deep indigo-purple sky.', 'thatched-roof choga houses with warm lit paper windows, a stone wall, a pair of wooden jangseung totem poles, a hanging red-and-blue cheongsachorong lantern on a wooden pole') },
  { file: 'bg_pass.png', name: '서낭당 고갯길 (3~4단계)', prompt: BG('Location: a misty mountain pass with a seonangdang shrine, dark teal-green sky.', 'a huge old sacred tree tied with five-colored cloth strips, a stone cairn pile, two weathered jangseung, a small lantern') },
  { file: 'bg_river.png', name: '삼도천 (5~6단계)', prompt: BG('Location: the Samdocheon river of the dead, foggy violet-blue sky, a wide dark river with soft moonlight ripples across the middle-distance behind the path.', 'a small wooden ferry boat moored at the shore, tall reeds, tiny distant lanterns floating on the far bank') },
  { file: 'bg_gate.png', name: '저승문 (7단계)', prompt: BG('Location: the gate of the underworld, blood-crimson sky with dark clouds.', 'a tall red hongsalmun gate with spikes and a taegeuk symbol in the back center, glowing stone lanterns on both sides, cracked stone ground') },
  { file: 'bg_palace.png', name: '명부전 (8~9단계)', prompt: BG('Location: the Myeongbujeon palace of the Ten Kings of the underworld, deep purple-gold sky.', 'a grand Korean palace hall with curved giwa tile roof, red pillars and dancheong patterns in the back center, a glowing golden doorway, stone stairs, golden lanterns on poles') },
]);

G('fx', '⑦ 이펙트 (6프레임 띠)', '가로로 6칸이 이어진 애니메이션 띠예요. 한 장 = 효과 하나.', [
  { file: 'fx_collect.png', name: '혼 거두기 (명부로 빨려듦)', prompt: `Effect: a blue soul flame being sucked into an open scroll, spiral of small blue and white sparkles shrinking into a point, then a golden flash. ${STRIP}` },
  { file: 'fx_rare.png', name: '귀한 혼 획득 (황금 반짝임)', prompt: `Effect: a burst of golden star sparkles and small light rays exploding outward from the center, then twinkling away. ${STRIP}` },
  { file: 'fx_hit.png', name: '원귀 타격', prompt: `Effect: an impact hit spark, white and red slash cross with small talisman paper shreds flying, then fading. ${STRIP}` },
  { file: 'fx_banish.png', name: '원귀 퇴치 (사라짐)', prompt: `Effect: a ghost being purified, a white smoky spirit shape breaking into pale pink and white pixel particles that float upward and vanish. ${STRIP}` },
  { file: 'fx_promote.png', name: '승진 빛기둥', prompt: `Effect: a tall golden pillar of light rising from the ground with traditional Korean cloud swirl patterns and sparkles, then fading. Each cell is a tall effect. ${STRIP}` },
]);

const ICON = 'Game UI icons, each a single bold readable object on its own, front view, thick dark outline, chunky pixels.';
G('icon', '⑧ UI 아이콘', '메뉴 버튼·재화·상점에 쓰는 아이콘이에요.', [
  { file: 'icons_01.png', name: '성장 메뉴 아이콘 9종', note: '명부 필력 · 혼불 부르기 · 거둠의 손길 · 축지법 · 귀한 인연 · 저승 장부 · 졸개 고용 · 졸개 훈련 · 승진',
    prompt: `${ICON} ${STYLE} ${SHEET(9, 3, 3)}\n${list(['a calligraphy brush dripping black ink', 'a blue soul flame with a tiny beckoning hand', 'an open glowing hanji scroll', 'a pair of straw jipsin sandals with motion lines', 'a red lucky bokjumeoni pouch with gold strings', 'a thick black ledger book with a red cover band', 'a tiny helper reaper head wearing a black gat', 'a small red-and-black war flag on a pole', 'a red hongsalmun gate'])}` },
  { file: 'icons_02.png', name: '재화·상점 아이콘 9종', note: '혼 · 옥 · 2배 부적 · 시간 두루마리 · 보물 상자 · 염라 인장 · 광고 제거 · 출석부 · 설정',
    prompt: `${ICON} ${STYLE} ${SHEET(9, 3, 3)}\n${list(['a small blue soul flame coin-like icon (main currency)', 'a green jade gemstone (premium currency)', 'a yellow paper talisman bujeok with red brush marks', 'an hourglass beside a rolled scroll', 'an ornate wooden treasure chest with gold corners, slightly open, glowing', 'a square red royal seal stamp with a gold handle', 'a TV screen icon crossed out with a red stroke', 'a calendar booklet made of hanji paper with a red ribbon', 'a bronze gear cog'])}` },
]);

G('key', '⑨ 대표 그림 (스토어·로딩용)', '앱 아이콘, 로딩 화면, 스토어 이미지에 써요. 글자는 나중에 제가 넣어요.', [
  { file: 'key_art.png', name: '대표 일러스트', attach: 'reaper_m_sheet.png, reaper_f_sheet.png 결과 이미지 첨부',
    prompt: `Use the attached sprite sheets as the exact character references. Pixel art key illustration, portrait 9:16: the male and female grim reapers standing back to back on a moonlit path, holding glowing open scrolls, many cute blue, green and gold soul flames swirling around them, a big full moon and a red hongsalmun gate silhouette behind. Leave empty space in the top 25% for a title logo. ${STYLE} Full-bleed single image, no text.` },
  { file: 'app_icon.png', name: '앱 아이콘', attach: 'reaper_m_portrait.png 결과 이미지 첨부',
    prompt: `Use the attached portrait as the character reference. Pixel art mobile app icon, square 1:1: the cute male grim reaper's face with the black gat hat filling most of the square, one blue soul flame beside his cheek, deep indigo night background with a full moon, bold readable silhouette. ${STYLE} Single image, no text, no rounded corners.` },
]);

// ---- 출력 ----
const total = groups.reduce((a, g) => a + g.items.length, 0);
const md = ['# 👻 저승사자 키우기 · 제미나이 도트 프롬프트', '',
  '- 위에서부터 순서대로 만드세요. ①번 남자 저승사자가 전체 화풍의 기준이에요.',
  '- 프롬프트를 **통째로** 복사해 제미나이에 붙여넣고, 첨부 표시가 있으면 그 결과 이미지를 같이 올리세요.',
  '- 결과는 **파일 이름 그대로** 저장해서 대화창에 올려주세요. 마젠타(분홍) 배경 그대로 OK, 잘라서 넣는 건 제가 합니다.',
  '- 칸이 삐뚤거나 글자가 들어가면 같은 프롬프트로 다시 뽑으면 돼요.', '', `총 ${total}장`, ''];
for (const g of groups) {
  md.push(`## ${g.title}`, '', `> ${g.note}`, '');
  for (const it of g.items) {
    md.push(`### \`${it.file}\` ${it.name}`);
    if (it.attach) md.push(`첨부: ${it.attach}`);
    if (it.note) md.push(`메모: ${it.note}`);
    md.push('', '```', it.prompt, '```', '');
  }
}
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/PROMPTS.md'), md.join('\n'));
fs.writeFileSync(path.join(ROOT, 'docs/prompts.json'), JSON.stringify(groups, null, 1));
if (process.argv[2]) {
  const tpl = fs.readFileSync(path.join(ROOT, '../tools/prompts_page.html'), 'utf8')
    .replace(/몬스터 키우기 프롬프트북/g, '저승사자 키우기 프롬프트북')
    .replace("'promptbook-done-v1'", "'jeoseung-promptbook-v1'")
    .replace('진화 단계는 바로 전 단계 그림이에요.', '첨부할 그림은 앞에서 만든 결과 이미지예요.');
  fs.writeFileSync(process.argv[2], tpl.replace('__DATA__', JSON.stringify(groups)).replace('__TOTAL__', String(total)));
}
console.log('prompts', total);
