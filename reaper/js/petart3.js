// ===== 펫 21종 (시안 v3 화풍, 18x15 · 진한 외곽선 + 자동 3단 명암) =====
// B 몸 · W 배/흰 부분 · A 무늬(진한색) · y 부리/뿔/금빛 · o 불꽃/장식 · E 눈 · w 눈빛 · P 볼
const PET3 = {
  kkachi: { pal: { B: '#23233a', W: '#eef0f6', A: '#3a5cc0', y: '#5a5a6a' }, rows: [
    '..........KKKK....', '.........KBBBBK...', '........KBBwEBK...', '........KBBBBBKyyK', '...KK..KBBBBBK....', '..KAAKKBWWWBK.....',
    '.KAAAAKWWWWWK.....', 'KAAAAAAKWWWWK.....', 'KAAAAAAAKWWK......', '.KAAAAAAAKK.......', '..KKAAAAKK........', '....KKKKK.........', '.....yK.yK........'] },
  daram: { pal: { B: '#a8703e', W: '#f0d8b0', A: '#6a4424', y: '#5a3a1e' }, rows: [
    '..KKKK............', '.KBBBBK.....K..K..', 'KBWBBBBK...KBKKBK.', 'KBWBBBBK...KBBBBK.', 'KBWBBBK...KBBwEBK.', '.KBBBK...KBBBBBPK.',
    '..KBBK..KBBWWBBK..', '..KBBBKKBBWWWBK...', '...KBBBBBWyyWBK...', '....KBBBBWyyWBK...', '....KBAABBWWBK....', '....KBBKKBBBBK....', '....KKK..KKKKK....'] },
  bandi: { pal: { B: '#2e3a26', W: '#bfe8ff', A: '#556a3a', y: '#fff6a0', o: '#e0d860' }, rows: [
    '.......K.K........', '........K.K.......', '....KK.KKKKK......', '...KWWKBBBBBK.....', '..KWWWKBBwEBK.....', '..KWWKBBBBBBK.....',
    '...KKBBAABBK......', '....KoooooooK.....', '...KoyyyyyyooK....', '...KoyyyyyyyoK....', '....KoyyyyyoK.....', '.....KKKKKKK......', '..................'] },
  dukk: { pal: { B: '#5e9442', W: '#e4dc9c', A: '#3e6a2c', P: '#ff9a9a' }, rows: [
    '..................', '........KK..KK....', '.......KBBKKBBK...', '......KBwEBBwEBK..', '.....KBBBBBBBBBBK.', '....KBBABBBBBABPK.',
    '...KBBBBBBKKKKKK..', '...KBBBBBWWWWWWK..', '..KBBABBWWWWWWWK..', '..KBBBBBBWWWWWK...', '.KBBKKBBKKBBKBBK..', '.KKK..KKK..KKKKK..', '..................'] },
  tokki: { pal: { B: '#f2f2fa', W: '#ffc8d8', A: '#c8c8da', P: '#ffa0b8' }, rows: [
    '..........KK.KK...', '.........KWBKWBK..', '.........KWBKWBK..', '.........KBBKBBK..', '........KBBBBBBK..', '........KBBBwEBBK.',
    '...KK...KBBBBBPBK.', '..KBBK.KBBBBBBBK..', '..KBBBKBBBBBBBK...', '...KBBBBBABBBBK...', '...KBBBBBBABBBK...', '....KBBKKKBBKK....', '....KKK...KKK.....'] },
  byeong: { pal: { B: '#ffd448', W: '#fff2b0', A: '#e0a02a', y: '#ff8a2a', P: '#ffa0a0' }, rows: [
    '.........K........', '........KWK.......', '.......KWWWK......', '......KWWwEWK.....', '......KBBBBBBKyy..', '.....KBBBBBPBKy...',
    '....KBWBBBBBBK....', '...KBWWBBBBABBK...', '...KBBBBBBBABBK...', '...KBBBBBBBBBBK...', '....KBBBBBBBBK....', '.....KKyKKKyKK....', '.......y...y......'] },
  neoguri: { pal: { B: '#887868', W: '#e6dac4', A: '#2a2420' }, rows: [
    '............K..K..', '...........KBKKBK.', '..KKK......KBBBBK.', '.KABBK....KAAAAWK.', '.KBBAK....KAwEAAK.', '.KABBK...KBWWWWAK.',
    '..KBAKKKKBBWWK....', '...KBBBBBBBBK.....', '...KBBBBBWWBK.....', '...KBABBBWWBK.....', '...KBBBBBBBBK.....', '...KBBKKKBBKK.....', '...KKK...KKK......'] },
  sapsal: { pal: { B: '#e2c890', W: '#fff0c8', A: '#a88a54', E: '#2a2420' }, rows: [
    '..................', '...........KKKKK..', '...K......KWWWWWK.', '..KWK....KAWWWWWK.', '..KBK....KAWwEWWK.', '..KBK...KBAWWWWAK.',
    '...KBKKKBWBWWWWK..', '...KBWBWBWBWBWK...', '...KWBWBWBWBWBK...', '...KBWBWBWBWBK....', '...KWBKKKWBKK.....', '...KKK...KKK......', '..................'] },
  heukmyo: { pal: { B: '#2a2838', W: '#45415c', A: '#1a1826', E: '#ffd34a', w: '#2a2838', P: '#ff9ab0' }, rows: [
    '............K..K..', '...........KBKKBK.', '...........KPBBPK.', '...KK......KBBBBK.', '..KBK.....KBEBBEK.', '..KBK.....KBBBPBK.',
    '...KBK...KBBBBBK..', '....KBKKKBBBBBK...', '....KBBBBBWBBBK...', '....KBABBBWBBBK...', '....KBBKKBBKBBK...', '....KKK..KKK.KK...', '..................'] },
  buheong: { pal: { B: '#94704a', W: '#ecd8b4', A: '#5e442a', E: '#1a1024', y: '#ffb030', o: '#ffd34a' }, rows: [
    '.....K......K.....', '.....KK....KK.....', '.....KBKKKKBK.....', '....KBooBBooBK....', '....KBoEBBoEBK....', '....KBBByyBBBK....',
    '...KABWWWWWWBAK...', '...KABWAWWAWBAK...', '...KABWWAAWWBAK...', '...KAABWWWWBAAK...', '....KAABBBBAAK....', '.....KyK..KyK.....', '..................'] },
  geobuk: { pal: { B: '#4a8a5a', W: '#c8e0a0', A: '#2a5a3a', y: '#c8a858', P: '#ff9a9a' }, rows: [
    '..................', '..................', '.....KKKKKK.......', '....KyAyAyAK......', '...KyAAyAAyAKKK...', '..KyAAyAAyAAKWWK..',
    '..KyyyyyyyyyKwEK..', '.KBKKKKKKKKKKWPK..', '.KWWWWWWWWWWWWK...', '..KWKKWWWKKWWK....', '..KK..KKK..KK.....', '..................', '..................'] },
  haechi: { pal: { B: '#e0b23e', W: '#3a9a6a', A: '#a8801e', y: '#3a9a6a', o: '#ff5a4a' }, rows: [
    '............y.....', '...........yK.....', '.........KWWKK....', '..KK....KWBBBBK...', '.KWWK..KWBBwEBK...', '.KWKWK.KWBBBBoK...',
    '..K.KWKKWBBBBK....', '.....KWBBBABK.....', '.....KBBBABBK.....', '.....KBABBBBK.....', '.....KBBKKBBK.....', '.....KKK..KKK.....', '..................'] },
  yeowoo: { pal: { B: '#f2843a', W: '#fff2e4', A: '#b8521e', y: '#2a2028' }, rows: [
    '...........K.K....', '..........KBKBK...', 'KK........KWBWK...', 'KWK......KBBBBK...', 'KWBK.....KBwEBK...', '.KBBK...KBWWWyK...',
    '..KBBKKKBBWWK.....', '...KBBBBBBWK......', '...KBABBBBWK......', '...KBBABBBBK......', '...KyKKKKyKK......', '...KK....KK.......', '..................'] },
  hak: { pal: { B: '#f6f6fe', W: '#22223a', A: '#c8c8dc', y: '#e0a030', o: '#ff3a3a' }, rows: [
    '..........oo......', '.........KooK.....', '.........KBwEKyy..', '.........KBBBK....', '..........KWK.....', '..........KWK.....',
    '....KKKKKKBBK.....', '...KWWBBBBBBK.....', '..KWWWBBBABK......', '.KWWKKBBABK.......', '..KK..KKKK........', '.......K.K........', '......yK.Ky.......'] },
  baekho: { pal: { B: '#f2f2fa', W: '#22222e', A: '#c4c4d6', y: '#ffa0b8', E: '#3a8ae0' }, rows: [
    '............K.K...', '...........KBKBK..', '...........KWBWK..', '..KK......KBWBWK..', '..KWK.....KBEBEK..', '..KBWK...KBBByBK..',
    '...KBWKKKBWBBBK...', '....KBWBWBWBBK....', '....KBWBWBABBK....', '....KBBBBBABBK....', '....KBBKKKBBKK....', '....KKK...KK......', '..................'] },
  samjok: { pal: { B: '#1c162c', W: '#ffd34a', A: '#e8b030', E: '#ff3a3a', w: '#ffaaaa', y: '#ffd34a', o: '#ff8a30' }, rows: [
    '.......K.K.K......', '.......KoKoK......', '........KKKKK.....', '.......KBBwEBK....', '.......KBBBBBKyy..', '..KK..KBBBBBK.....',
    '.KAAKKBBAABK......', '.KAWAAKBAWAK......', '.KAWWAAKBAAK......', '..KAWAAKKBK.......', '...KKKKKKK........', '.....K.K.K........', '....yK.yK.yK......'] },
  bulyeo: { pal: { B: '#ff4a2a', W: '#fff0c0', A: '#b82a18', y: '#ffd040', o: '#ffea80' }, rows: [
    'o..........K.K....', 'yo........KBKBK...', 'yyo.......KWBWK...', 'KyyK.....KBBBBK...', 'KoyyK....KBwEBK...', '.KoyyK..KBWWWWK...',
    '..KooBKKBBWWK.....', '...KBBBBBBWK......', '...KBABBoBWK......', '...KBBABBBBK......', '...KBKKKKBKK......', '...KK....KK.......', '..................'] },
  cheongryong: { pal: { B: '#3a8ae8', W: '#e0f4ff', A: '#2050a0', y: '#ffd34a', o: '#ffffff' }, rows: [
    '..........y.y.....', '..........yKy.....', '.........KBBBK....', '........KBBwEBK...', '........KBBBBBy...', '...KKK..KWBBKy....',
    '..KBABK.KWBK......', '.KBK.KBKBWBK......', '.KBK..KBBWK.......', '..KAK.KBAWBK......', '...KBKBBKKBBK.....', '....KKKK..KK......', '..................'] },
  girin: { pal: { B: '#ffd060', W: '#ff8a5a', A: '#d89a30', y: '#ffffff', o: '#ff5a3a' }, rows: [
    '............y.....', '...........Ky.....', '..........KBBK....', '.........KBwEBK...', '....W....KBBBBK...', '...WoW..KWBBBK....',
    '...KWoWKWWBBK.....', '....KBBBBWBK......', '....KBABABBK......', '....KBBBBABK......', '....KBKKKBKK......', '....KoK..KoK......', '..................'] },
  bonghwang: { pal: { B: '#ff5a48', W: '#ffea90', A: '#c03028', y: '#3aa0ff', o: '#4ad08a', L: '#ffd34a' }, rows: [
    '.........LyL......', '........KKLKK.....', '........KBBwEK....', '........KBBBBKLL..', '.....KK.KWBBK.....', '....KLLKKWBBK.....',
    '...KLLLLKBBBK.....', '..KyLoLLBBBK......', '.KyyLooLLBK.......', '.KyoyLoLKK........', '..KyyoyK..........', '...KKKK...........', '..................'] },
  hwangryong: { pal: { B: '#ffd040', W: '#fff8e0', A: '#d8a020', y: '#ff5a4a', o: '#ffffff' }, rows: [
    '.........y...y....', '.........yK.Ky....', '.........KBBBK....', '........KBBwEBK...', '....o...KBBBBBy...', '...KKKK.KWBBKyy...',
    '..KBAABKKWBK......', '.KBK..KBBWBK......', '.KBAK.KBBWK.......', '..KBBKKBAWBK......', '...KKBBBKKBBK.....', '.....KKK..KK......', '..................'] },
};
// 자동 명암: 아래·오른쪽이 외곽선이면 어둡게, 위·왼쪽이 외곽선이면 밝게
function shadeSprite(c) {
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, w = c.width, h = c.height;
  const isK = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return true; const i = (y * w + x) * 4; return d[i + 3] < 10 || (d[i] < 30 && d[i + 1] < 30 && d[i + 2] < 40); };
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (d[i + 3] < 10 || isK(x, y)) continue;
    let f = 1;
    if (isK(x, y + 1) || isK(x + 1, y)) f = 0.72; else if (isK(x, y - 1) || isK(x - 1, y)) f = 1.18;
    out[i] = Math.min(255, d[i] * f); out[i + 1] = Math.min(255, d[i + 1] * f); out[i + 2] = Math.min(255, d[i + 2] * f);
  }
  im.data.set(out); g.putImageData(im, 0, 0); return c;
}
function petArt3(id, i) {
  const A = PET3[id]; if (!A) return null;
  // base: 다른 영물의 그림을 빌려 색만 바꾼 영물 (petart4.js)
  const Base = A.base ? PET3[A.base] : null, rows = A.rows || (Base && Base.rows); if (!rows) return null;
  return shadeSprite(compose(20, 16, [[rows, 1, i % 2 ? 2 : 1]], Object.assign({ K: '#0b0a0e', E: '#1a1024', w: '#ffffff', P: '#ff9ab0' }, Base ? Base.pal : {}, A.pal)));
}
