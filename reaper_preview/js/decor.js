// ===== 집무실 꾸미기 소품: 도트 디자인 · 보유/배치 · 품격 보너스 =====
// 바닥 소품은 10px 격자 위 fw×fh 칸을 차지하고, 벽 소품(wall)은 벽 띠에 걸린다. seat 소품은 앉을 수 있다.
// price: 옥 가격 · free: 처음 무료 지급 · premium: 귀한 소품 · pt: 품격 (배치한 품격 합계로 수확량 보너스)
const DECOR_G = 10;
const DECOR = (() => {
  const O = '#0f0c18';
  // 작은 캔버스에 픽셀 그리기 도우미
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x2 = c.getContext('2d'); const r = (x, y, ww, hh, col) => { x2.fillStyle = col; x2.fillRect(x, y, ww, hh); }; fn(r, x2); return c; };
  const box = (r, x, y, w, h, fill, hi, lo) => { r(x - 1, y - 1, w + 2, h + 2, O); r(x, y, w, h, fill); if (hi) r(x, y, w, 1, hi); if (lo) r(x, y + h - 1, w, 1, lo); };
  const list = [
    // ---------- 무료 4종 ----------
    { id: 'orchid', name: '난초 화분', fw: 1, fh: 1, pt: 5, free: 1, desc: '선비의 기개를 담은 난초', draw: () => mk(12, 18, r => {
      box(r, 3, 12, 6, 5, '#7a4a32', '#9a6244', '#5a3424');
      r(5, 3, 1, 9, '#3a8a4a'); r(4, 5, 1, 6, '#2e7a3e'); r(7, 4, 1, 8, '#3a8a4a'); r(8, 6, 1, 4, '#2e7a3e'); r(3, 7, 1, 4, '#3a8a4a'); r(6, 2, 1, 2, '#4aa05a');
      r(8, 5, 2, 1, '#f0e0ff'); r(9, 4, 1, 1, '#ffd34a'); r(2, 6, 2, 1, '#f0e0ff'); }) },
    { id: 'incense', name: '향로', fw: 1, fh: 1, pt: 5, free: 1, desc: '은은한 향이 피어오르는 청동 향로', smoke: 1, draw: () => mk(12, 14, r => {
      box(r, 2, 7, 8, 4, '#6a7a5a', '#8a9a72', '#4a5a3e'); r(1, 6, 10, 1, O); r(1, 6, 10, 1, '#5a6a4a'); r(3, 11, 1, 2, O); r(8, 11, 1, 2, O); r(5, 8, 2, 1, '#c8b060'); r(5, 3, 1, 3, '#d8d0c0'); r(6, 1, 1, 2, '#bdb4a8'); }) },
    { id: 'cushion', name: '비단 방석', fw: 1, fh: 1, pt: 5, free: 1, seat: 1, desc: '앉아서 쉴 수 있는 비단 방석', draw: () => mk(14, 8, r => {
      box(r, 1, 2, 12, 5, '#a02a3a', '#c84a5a', '#7a1a2a'); r(3, 4, 8, 1, '#e0b040'); r(6, 3, 2, 3, '#e0b040'); r(0, 2, 1, 1, '#e0b040'); r(13, 2, 1, 1, '#e0b040'); }) },
    { id: 'sansu', name: '산수화 족자', wall: 1, fw: 1, fh: 2, pt: 5, free: 1, desc: '안개 낀 산을 그린 족자', draw: () => mk(12, 22, r => {
      r(0, 0, 12, 2, '#5a3a22'); box(r, 1, 2, 10, 17, '#efe6cc'); r(2, 3, 8, 15, '#e6dcbe'); r(2, 12, 3, 3, '#6a7a8a'); r(4, 10, 3, 5, '#5a6a7a'); r(6, 11, 3, 4, '#7a8a9a'); r(3, 8, 6, 1, '#d8d0c0'); r(7, 5, 2, 2, '#c84040'); r(0, 19, 12, 2, '#5a3a22'); r(5, 21, 2, 1, '#e0b040'); }) },
    // ---------- 옥으로 사는 소품 ----------
    { id: 'chorong', name: '청사초롱', wall: 1, fw: 1, fh: 2, pt: 8, price: 120, desc: '푸른 비단과 붉은 비단으로 만든 등', glow: '#ffb070', draw: () => mk(10, 20, r => {
      r(4, 0, 2, 4, '#3a2a20'); box(r, 2, 4, 6, 3, '#2a5ab0', '#4a7ad0'); box(r, 2, 7, 6, 6, '#c83a3a', '#e05a5a', '#a02a2a'); r(3, 8, 4, 4, '#ffcf6a'); box(r, 2, 13, 6, 2, '#2a5ab0'); r(4, 15, 2, 4, '#e0b040'); r(3, 19, 4, 1, '#c83a3a'); }) },
    { id: 'fan', name: '태극선', wall: 1, fw: 1, fh: 1, pt: 6, price: 140, desc: '태극 무늬를 그린 둥근 부채', draw: () => mk(12, 14, r => {
      r(3, 0, 6, 1, O); r(1, 1, 10, 1, O); r(0, 2, 12, 6, O); r(1, 8, 10, 1, O); r(3, 9, 6, 1, O);
      r(3, 1, 6, 1, '#c83a3a'); r(1, 2, 10, 3, '#c83a3a'); r(1, 5, 10, 3, '#2a5ab0'); r(3, 8, 6, 1, '#2a5ab0'); r(4, 4, 3, 2, '#2a5ab0'); r(6, 5, 3, 2, '#c83a3a'); r(1, 3, 2, 3, '#e0b040'); r(9, 4, 2, 3, '#e0b040');
      r(5, 10, 2, 4, '#7a5232'); }) },
    { id: 'candle', name: '놋쇠 촛대', fw: 1, fh: 1, pt: 6, price: 150, desc: '밤새 집무실을 밝히는 촛대', glow: '#ffcf6a', draw: () => mk(10, 20, r => {
      r(4, 2, 2, 2, '#ffd34a'); r(4, 1, 2, 1, '#fff3b0'); r(4, 4, 2, 6, '#f0ece0'); box(r, 3, 10, 4, 1, '#c89a30'); r(4, 11, 2, 6, '#b08a2a'); r(4, 11, 1, 6, '#e0b040'); box(r, 2, 17, 6, 2, '#c89a30', '#e0b040'); }) },
    { id: 'mask', name: '하회탈', wall: 1, fw: 1, fh: 1, pt: 7, price: 180, desc: '웃는 얼굴의 양반탈', draw: () => mk(12, 14, r => {
      r(2, 0, 8, 1, O); r(1, 1, 10, 11, O); r(2, 12, 8, 1, O); r(2, 1, 8, 11, '#e8c890'); r(2, 1, 8, 2, '#c8a070'); r(3, 4, 2, 1, '#3a2a20'); r(7, 4, 2, 1, '#3a2a20'); r(3, 3, 2, 1, '#8a6040'); r(7, 3, 2, 1, '#8a6040'); r(5, 6, 2, 2, '#d8a870'); r(3, 9, 6, 1, '#7a3a2a'); r(4, 10, 4, 1, '#c86050'); r(2, 7, 1, 1, '#f0a0a0'); r(9, 7, 1, 1, '#f0a0a0'); }) },
    { id: 'celadon', name: '청자 매병', fw: 1, fh: 1, pt: 9, price: 200, desc: '비췻빛 고려청자, 구름과 학 무늬', draw: () => mk(12, 20, r => {
      r(4, 0, 4, 1, O); r(4, 1, 4, 2, O); r(2, 3, 8, 1, O); r(1, 4, 10, 8, O); r(2, 12, 8, 4, O); r(3, 16, 6, 3, O);
      r(5, 1, 2, 2, '#7ab0a0'); r(3, 4, 6, 1, '#8ac4b0'); r(2, 5, 8, 7, '#7ab0a0'); r(3, 12, 6, 4, '#6a9a8a'); r(4, 16, 4, 2, '#5a8a7a'); r(3, 5, 1, 6, '#a8dcc8'); r(5, 7, 2, 1, '#f0f0f0'); r(6, 6, 1, 1, '#f0f0f0'); r(7, 9, 2, 1, '#e8e8f0'); }) },
    { id: 'bookstand', name: '서안과 문방사우', fw: 2, fh: 1, pt: 10, price: 250, desc: '붓·먹·종이·벼루를 올린 낮은 책상', draw: () => mk(22, 14, r => {
      box(r, 1, 6, 20, 2, '#7a4a2a', '#9a6238'); r(2, 8, 2, 5, '#5a3420'); r(18, 8, 2, 5, '#5a3420'); r(1, 13, 4, 1, O); r(17, 13, 4, 1, O);
      box(r, 4, 3, 6, 3, '#efe6cc'); box(r, 12, 4, 4, 2, '#2a2a34'); r(17, 1, 1, 5, '#7a5232'); r(17, 0, 1, 1, '#2a2a34'); r(11, 4, 1, 2, '#3a3a44'); }) },
    { id: 'bowrack', name: '각궁 거치대', fw: 1, fh: 1, pt: 10, price: 260, desc: '명궁의 각궁과 화살통', draw: () => mk(12, 22, r => {
      r(2, 4, 1, 17, '#5a3420'); r(9, 4, 1, 17, '#5a3420'); r(1, 20, 10, 2, O); r(2, 20, 8, 1, '#7a4a2a');
      r(1, 2, 1, 1, O); r(2, 1, 1, 1, '#c89a30'); for (let k = 0; k < 14; k++) r(3 + Math.round(Math.sin(k / 13 * Math.PI) * 4), 2 + k, 1, 1, '#a0602a'); r(3, 2, 1, 14, '#e8e0d0');
      box(r, 7, 10, 3, 8, '#7a2a2a'); r(7, 7, 1, 3, '#e8e0d0'); r(8, 6, 1, 4, '#e8e0d0'); r(9, 8, 1, 2, '#e8e0d0'); }) },
    { id: 'moonjar', name: '백자 달항아리', fw: 1, fh: 1, pt: 12, price: 300, desc: '보름달처럼 둥근 조선 백자', draw: () => mk(14, 16, r => {
      r(4, 0, 6, 1, O); r(2, 1, 10, 1, O); r(1, 2, 12, 11, O); r(2, 13, 10, 1, O); r(4, 14, 6, 1, O);
      r(4, 1, 6, 1, '#e8e4dc'); r(2, 2, 10, 11, '#f4f0e8'); r(4, 13, 6, 1, '#d8d4cc'); r(10, 4, 2, 8, '#dcd8d0'); r(3, 3, 2, 3, '#ffffff'); r(2, 8, 10, 1, '#e8e4dc'); }) },
    { id: 'tiger', name: '까치호랑이 민화', wall: 1, fw: 2, fh: 2, pt: 12, price: 320, desc: '익살스러운 호랑이와 까치', draw: () => mk(22, 20, r => {
      box(r, 1, 1, 20, 18, '#e8dcb8'); r(1, 1, 20, 1, '#7a4a2a'); r(1, 18, 20, 1, '#7a4a2a');
      r(4, 9, 10, 6, '#e0902a'); r(4, 10, 10, 1, '#3a2a20'); r(6, 12, 8, 1, '#3a2a20'); r(13, 6, 5, 6, '#e0902a'); r(14, 7, 1, 1, O); r(16, 7, 1, 1, O); r(15, 9, 2, 1, '#c83a3a'); r(13, 5, 1, 1, '#e0902a'); r(17, 5, 1, 1, '#e0902a'); r(3, 14, 2, 1, '#e0902a'); r(4, 15, 1, 2, '#3a2a20'); r(12, 15, 1, 2, '#3a2a20');
      r(15, 3, 3, 2, '#2a2a3a'); r(16, 4, 1, 1, '#f0f0f0'); r(18, 3, 1, 1, '#e0a030'); r(6, 3, 1, 6, '#5a3a22'); r(4, 4, 5, 1, '#3a7a4a'); r(5, 3, 3, 1, '#3a7a4a'); }) },
    { id: 'crane', name: '학 조각', fw: 1, fh: 1, pt: 12, price: 340, desc: '날개를 펼친 나무 학', draw: () => mk(16, 20, r => {
      box(r, 3, 17, 10, 2, '#5a3a22', '#7a5232'); r(8, 9, 1, 8, '#3a2a20');
      r(6, 5, 4, 5, O); r(7, 6, 2, 3, '#f4f0e8'); r(8, 2, 1, 4, O); r(8, 2, 1, 1, '#c83a3a'); r(9, 2, 2, 1, '#e0a030'); r(1, 4, 5, 1, O); r(2, 5, 4, 2, '#f4f0e8'); r(1, 4, 2, 1, '#2a2a3a'); r(10, 4, 5, 1, O); r(10, 5, 4, 2, '#f4f0e8'); r(13, 4, 2, 1, '#2a2a3a'); r(7, 9, 2, 1, '#2a2a3a'); }) },
    { id: 'turtle', name: '거북 석상', fw: 2, fh: 1, pt: 13, price: 350, desc: '장수를 비는 화강암 거북', draw: () => mk(22, 14, r => {
      r(3, 4, 14, 1, O); r(2, 5, 16, 6, O); r(3, 11, 14, 1, O); r(3, 5, 14, 6, '#8a8a92'); r(4, 5, 12, 1, '#a8a8b0'); for (let k = 0; k < 3; k++) r(5 + k * 4, 7, 3, 2, '#6a6a72');
      box(r, 17, 6, 4, 3, '#8a8a92', '#a8a8b0'); r(19, 7, 1, 1, O); r(3, 11, 2, 2, '#6a6a72'); r(14, 11, 2, 2, '#6a6a72'); r(1, 8, 1, 1, '#6a6a72'); }) },
    { id: 'drum', name: '법고', fw: 1, fh: 1, pt: 13, price: 380, desc: '울리면 혼들이 고개를 드는 큰 북', draw: () => mk(16, 20, r => {
      r(2, 16, 2, 4, '#5a3420'); r(12, 16, 2, 4, '#5a3420'); r(1, 19, 14, 1, O);
      r(1, 2, 14, 1, O); r(0, 3, 16, 12, O); r(1, 15, 14, 1, O); r(1, 3, 14, 12, '#a02a2a'); r(2, 4, 12, 10, '#f0e0c0'); r(5, 7, 6, 4, '#2a5ab0'); r(6, 8, 2, 2, '#c83a3a'); r(8, 8, 2, 2, '#e0b040');
      r(1, 3, 1, 12, '#e0b040'); r(14, 3, 1, 12, '#e0b040'); }) },
    { id: 'fishbowl', name: '저승 금붕어 어항', fw: 1, fh: 1, pt: 13, price: 380, desc: '혼불처럼 빛나는 금붕어가 산다', glow: '#7ad0ff', draw: () => mk(14, 18, r => {
      box(r, 2, 14, 10, 3, '#5a3a22', '#7a5232'); r(2, 4, 10, 1, O); r(1, 5, 12, 9, O); r(2, 5, 10, 9, '#4a7ab0'); r(2, 5, 10, 2, '#7ab0e0'); r(3, 7, 1, 5, '#a8d8ff');
      r(5, 9, 3, 2, '#ff8a3a'); r(8, 9, 1, 1, '#ffd34a'); r(4, 10, 1, 1, '#ff8a3a'); r(8, 11, 2, 1, '#7ad0ff'); r(9, 7, 1, 1, '#ffffff'); }) },
    { id: 'haetae', name: '해태 석상', fw: 1, fh: 1, pt: 14, price: 400, desc: '옳고 그름을 가리는 해태', draw: () => mk(14, 20, r => {
      box(r, 1, 16, 12, 3, '#6a6a72', '#8a8a92'); r(3, 7, 8, 9, O); r(4, 8, 6, 8, '#9a9aa2'); r(2, 2, 10, 6, O); r(3, 3, 8, 5, '#a8a8b0'); r(4, 4, 2, 1, O); r(8, 4, 2, 1, O); r(5, 6, 4, 1, '#6a6a72');
      r(6, 0, 2, 3, O); r(6, 1, 2, 1, '#a8a8b0'); r(2, 3, 1, 3, '#7a7a82'); r(11, 3, 1, 3, '#7a7a82'); r(4, 10, 1, 4, '#7a7a82'); r(9, 10, 1, 4, '#7a7a82'); }) },
    { id: 'lotus', name: '연꽃 수반', fw: 2, fh: 1, pt: 14, price: 420, desc: '맑은 물에 연꽃 두 송이', draw: () => mk(22, 14, r => {
      r(2, 6, 18, 1, O); r(1, 7, 20, 5, O); r(2, 12, 18, 1, O); r(2, 7, 18, 4, '#8a7a6a'); r(3, 7, 16, 2, '#3a6ab0'); r(3, 7, 16, 1, '#6a9ae0');
      r(5, 5, 3, 2, '#ff8ab0'); r(6, 4, 1, 1, '#ffc0d8'); r(13, 4, 4, 3, '#ff8ab0'); r(14, 3, 2, 1, '#ffc0d8'); r(9, 7, 3, 1, '#3a8a4a'); r(16, 7, 3, 1, '#3a8a4a'); }) },
    { id: 'screen10', name: '십장생 병풍', fw: 3, fh: 1, pt: 16, price: 450, desc: '해·산·물·소나무·학·거북… 오래 사는 열 가지', draw: () => mk(32, 26, r => {
      for (let k = 0; k < 4; k++) { const x = 1 + k * 7.5; box(r, Math.round(x), 2, 7, 22, '#efe2bf'); }
      r(2, 4, 28, 1, '#c83a3a'); r(25, 5, 3, 3, '#e04a3a'); r(3, 14, 10, 8, '#3a7a5a'); r(5, 11, 6, 4, '#4a8a6a'); r(15, 18, 13, 4, '#4a7ab0'); r(17, 19, 3, 1, '#a8d0f0');
      r(6, 7, 1, 7, '#5a3a22'); r(4, 7, 5, 2, '#2e6a3a'); r(19, 9, 3, 2, '#f4f0e8'); r(21, 8, 1, 1, '#c83a3a'); r(10, 20, 3, 2, '#8a8a72'); for (let k = 0; k < 4; k++) r(Math.round(1 + k * 7.5), 24, 7, 1, '#5a3a22'); }) },
    { id: 'nameplate', name: '현판 「冥府殿」', wall: 1, fw: 3, fh: 1, pt: 16, price: 500, desc: '금박 글씨로 쓴 명부전 현판', draw: () => mk(32, 12, r => {
      box(r, 1, 1, 30, 10, '#2a1a12', '#4a3020', '#1a0e08'); r(3, 3, 26, 6, '#1a1020'); r(2, 2, 28, 1, '#e0b040'); r(2, 9, 28, 1, '#e0b040');
      [[5, 4], [14, 4], [23, 4]].forEach(([x, y]) => { r(x, y, 4, 1, '#ffd34a'); r(x + 1, y + 1, 2, 2, '#ffd34a'); r(x, y + 3, 4, 1, '#ffd34a'); r(x + 3, y + 1, 1, 1, '#ffd34a'); }); }) },
    // ---------- 귀한 소품 (비싼 옥) ----------
    { id: 'irwol', price: 900, premium: 1, name: '일월오봉도', wall: 1, fw: 4, fh: 2, pt: 30, desc: '해와 달, 다섯 봉우리. 왕의 자리 뒤에만 놓던 그림', draw: () => mk(42, 22, r => {
      box(r, 1, 1, 40, 20, '#2a4a8a'); r(1, 1, 40, 1, '#e0b040'); r(1, 20, 40, 1, '#e0b040');
      r(5, 4, 4, 4, '#e83a3a'); r(33, 4, 4, 4, '#f4f0e8'); [[4, 12, 6], [11, 9, 7], [19, 6, 8], [27, 9, 7], [34, 12, 6]].forEach(([x, y, w]) => { for (let k = 0; k < 20 - y; k++) r(x + Math.max(0, w / 2 - k) | 0, y + k, Math.min(w, k * 2 + 1), 1, k < 2 ? '#e8e0d0' : '#2e7a5a'); });
      r(2, 17, 38, 3, '#3a6ab0'); for (let k = 0; k < 9; k++) r(3 + k * 4, 17, 2, 1, '#e8f0ff'); r(3, 9, 1, 8, '#7a3a22'); r(38, 9, 1, 8, '#7a3a22'); r(2, 9, 3, 2, '#c84a3a'); r(37, 9, 3, 2, '#c84a3a'); }) },
    { id: 'goldhaechi', price: 1000, premium: 1, name: '황금 해치상', fw: 1, fh: 1, pt: 30, desc: '저승 최고 판관만 가질 수 있는 황금 해치', glow: '#ffd34a', draw: () => mk(14, 22, r => {
      box(r, 1, 18, 12, 3, '#a02a2a', '#c84040'); r(3, 9, 8, 9, O); r(4, 10, 6, 8, '#e0b040'); r(2, 3, 10, 7, O); r(3, 4, 8, 6, '#ffd34a'); r(4, 5, 2, 1, '#c83a3a'); r(8, 5, 2, 1, '#c83a3a'); r(5, 8, 4, 1, '#b08a2a');
      r(6, 0, 2, 4, O); r(6, 1, 2, 2, '#fff3b0'); r(4, 12, 1, 4, '#b08a2a'); r(9, 12, 1, 4, '#b08a2a'); r(3, 4, 1, 2, '#fff3b0'); }) },
    { id: 'mirror', price: 1200, premium: 1, name: '업경대', fw: 2, fh: 1, pt: 35, desc: '죽은 이의 생전 업보를 비추는 저승의 거울', glow: '#9fd6ff', draw: () => mk(20, 28, r => {
      box(r, 3, 24, 14, 3, '#3a2a40', '#5a4a62'); r(9, 18, 2, 6, '#5a4a62'); r(5, 18, 10, 2, O); r(6, 18, 8, 1, '#c89a30');
      r(4, 1, 12, 1, O); r(2, 2, 16, 15, O); r(4, 17, 12, 1, O); r(3, 2, 14, 15, '#c89a30'); r(5, 4, 10, 11, '#3a5a8a'); r(6, 5, 8, 9, '#6a9ad0'); r(7, 6, 3, 4, '#c8ecff'); r(11, 10, 2, 2, '#9fd6ff');
      r(1, 6, 1, 6, '#e83a3a'); r(18, 6, 1, 6, '#e83a3a'); r(9, 0, 2, 2, '#ffd34a'); }) },
    { id: 'dragonjar', price: 800, premium: 1, name: '청화백자 용항아리', fw: 1, fh: 1, pt: 28, desc: '푸른 용이 휘감은 왕실 항아리', draw: () => mk(14, 20, r => {
      r(4, 0, 6, 1, O); r(3, 1, 8, 2, O); r(1, 3, 12, 12, O); r(3, 15, 8, 3, O); r(4, 1, 6, 2, '#e8e8f0'); r(2, 3, 10, 12, '#f4f4f8'); r(4, 15, 6, 2, '#dcdce4');
      [[3, 5], [5, 6], [7, 5], [9, 6], [10, 8], [8, 9], [6, 10], [4, 11], [3, 9]].forEach(([x, y]) => r(x, y, 2, 1, '#2a4aa0')); r(10, 7, 1, 1, '#c83a3a'); r(2, 4, 10, 1, '#5a7ac0'); r(2, 13, 10, 1, '#5a7ac0'); }) },
    // ---------- 추가 소품 (정원 · 풍류 · 서재 · 살림 · 저승) ----------
    { id: 'bamboo', name: '대나무 화분', fw: 1, fh: 1, pt: 8, price: 160, desc: '곧게 뻗은 사군자의 대나무', draw: () => mk(12, 24, r => {
      box(r, 2, 18, 8, 5, '#3a4a6a', '#5a6a8a', '#2a3a5a'); [3, 6, 8].forEach((x, k) => { r(x, 2 + k * 2, 1, 16 - k * 2, '#5aa05a'); for (let y = 5 + k * 2; y < 18; y += 4) r(x, y, 1, 1, '#2e6a3a'); });
      r(0, 4, 3, 1, '#4a9a4a'); r(9, 7, 3, 1, '#4a9a4a'); r(1, 10, 2, 1, '#4a9a4a'); r(9, 3, 2, 1, '#4a9a4a'); }) },
    { id: 'plum', name: '매화 화분', fw: 1, fh: 1, pt: 9, price: 180, desc: '눈 속에서 먼저 피는 매화', draw: () => mk(14, 22, r => {
      box(r, 3, 16, 8, 5, '#7a4a32', '#9a6244', '#5a3424'); r(6, 8, 2, 8, '#4a2e22'); r(4, 6, 2, 3, '#4a2e22'); r(8, 4, 2, 5, '#4a2e22'); r(3, 4, 1, 3, '#4a2e22'); r(10, 3, 1, 2, '#4a2e22');
      [[3, 3], [5, 5], [9, 2], [11, 4], [7, 6], [2, 7], [10, 7]].forEach(([x, y]) => { r(x, y, 2, 2, '#ff9ab8'); r(x, y, 1, 1, '#ffd8e4'); }); }) },
    { id: 'bonsai', name: '소나무 분재', fw: 1, fh: 1, pt: 11, price: 280, desc: '백 년을 가꾼 작은 소나무', draw: () => mk(16, 18, r => {
      box(r, 2, 13, 12, 4, '#4a4a5a', '#6a6a7a', '#3a3a4a'); r(7, 7, 2, 6, '#5a3a22'); r(5, 9, 2, 2, '#5a3a22'); r(9, 6, 2, 2, '#5a3a22');
      [[1, 4, 7], [7, 1, 7], [8, 6, 7], [2, 8, 5]].forEach(([x, y, w]) => { r(x, y, w, 3, '#2e6a3a'); r(x + 1, y, w - 2, 1, '#4a8a4a'); }); }) },
    { id: 'stonelamp', name: '석등', fw: 1, fh: 1, pt: 12, price: 320, desc: '정원을 밝히는 화강암 석등', glow: '#ffcf6a', draw: () => mk(12, 26, r => {
      box(r, 3, 22, 6, 3, '#7a7a82', '#9a9aa2'); r(5, 15, 2, 7, '#8a8a92'); box(r, 2, 13, 8, 2, '#7a7a82'); box(r, 3, 7, 6, 5, '#8a8a92'); r(4, 8, 4, 3, '#ffcf6a'); r(5, 9, 2, 1, '#fff3b0');
      r(1, 5, 10, 1, O); r(1, 6, 10, 1, '#6a6a72'); r(3, 3, 6, 2, O); r(4, 3, 4, 2, '#7a7a82'); r(5, 1, 2, 2, '#7a7a82'); }) },
    { id: 'jangdok', name: '장독대', fw: 2, fh: 1, pt: 10, price: 240, desc: '된장·간장·고추장이 익어 가는 독', draw: () => mk(22, 16, r => {
      box(r, 1, 13, 20, 2, '#8a8a92', '#a8a8b0'); [[2, 4, 8], [11, 6, 6], [16, 7, 5]].forEach(([x, y, w]) => { r(x, y + 1, w, 13 - y - 1, O); r(x + 1, y, w - 2, 1, O); r(x + 1, y + 1, w - 2, 12 - y - 1, '#6a3a22'); r(x + 1, y + 1, 1, 12 - y - 2, '#8a5232'); r(x + 2, y - 1, w - 4, 1, '#3a2014'); }); }) },
    { id: 'brazier', name: '숯불 화로', fw: 1, fh: 1, pt: 9, price: 200, desc: '겨울밤 손을 녹이는 화로', glow: '#ff8a3a', draw: () => mk(14, 12, r => {
      r(1, 3, 12, 1, O); r(0, 4, 14, 6, O); r(2, 10, 10, 1, O); r(1, 4, 12, 5, '#5a4a3a'); r(1, 4, 12, 1, '#7a6a5a'); r(2, 3, 10, 1, '#2a2a2a'); r(3, 2, 2, 1, '#ff6a2a'); r(6, 2, 3, 1, '#ffb040'); r(10, 2, 1, 1, '#ff6a2a'); r(5, 1, 1, 1, '#ffe08a'); r(2, 10, 1, 1, '#3a2a20'); r(11, 10, 1, 1, '#3a2a20'); }) },
    { id: 'mat', name: '왕골 돗자리', fw: 2, fh: 1, pt: 6, price: 120, seat: 1, desc: '시원한 왕골 돗자리. 앉아서 쉬어요', draw: () => mk(22, 8, r => {
      box(r, 1, 2, 20, 5, '#c8b070', '#e0c890', '#a8904a'); for (let x = 3; x < 20; x += 3) r(x, 2, 1, 5, '#a8904a'); r(1, 4, 20, 1, '#b8a060'); }) },
    { id: 'pyeongsang', name: '평상', fw: 3, fh: 1, pt: 14, price: 420, seat: 1, desc: '여름밤 별을 보던 나무 평상', draw: () => mk(32, 12, r => {
      box(r, 1, 2, 30, 4, '#8a6038', '#a87848', '#6a4428'); for (let x = 4; x < 30; x += 4) r(x, 2, 1, 4, '#6a4428'); r(2, 6, 3, 5, '#5a3420'); r(27, 6, 3, 5, '#5a3420'); r(14, 6, 3, 5, '#5a3420'); r(1, 11, 30, 1, 'rgba(0,0,0,0)'); }) },
    { id: 'gayageum', name: '가야금', fw: 3, fh: 1, pt: 13, price: 380, desc: '열두 줄 가야금', draw: () => mk(32, 10, r => {
      r(1, 3, 30, 1, O); r(0, 4, 32, 4, O); r(2, 8, 28, 1, O); r(1, 4, 30, 3, '#a0602a'); r(1, 4, 30, 1, '#c88040'); for (let k = 0; k < 6; k++) r(4 + k * 4, 3, 1, 2, '#f0e0c0'); for (let y = 4; y < 7; y++) r(3, y, 24, 1, y % 2 ? 'rgba(240,224,192,0.7)' : 'rgba(0,0,0,0)'); r(28, 4, 3, 3, '#c83a3a'); }) },
    { id: 'janggu', name: '장구', fw: 1, fh: 1, pt: 10, price: 260, desc: '덩기덕 쿵더러러', draw: () => mk(16, 14, r => {
      r(0, 2, 5, 9, O); r(11, 2, 5, 9, O); r(5, 4, 6, 5, O); r(1, 3, 3, 7, '#f0e0c0'); r(12, 3, 3, 7, '#f0e0c0'); r(4, 3, 1, 7, '#c83a3a'); r(11, 3, 1, 7, '#2a5ab0'); r(5, 5, 6, 3, '#a0602a'); r(5, 5, 6, 1, '#c88040');
      for (let k = 0; k < 4; k++) r(5 + k * 2, 4, 1, 1, '#e0b040'); r(6, 12, 4, 1, '#5a3a22'); }) },
    { id: 'baduk', name: '바둑판', fw: 2, fh: 1, pt: 11, price: 300, desc: '신선들이 두다 만 한 판', draw: () => mk(20, 14, r => {
      box(r, 1, 2, 18, 7, '#d8a860', '#e8c080', '#b88840'); for (let k = 0; k < 5; k++) { r(3 + k * 3.5 | 0, 3, 1, 5, '#8a6030'); } for (let k = 0; k < 3; k++) r(2, 4 + k * 2, 16, 1, '#a07838');
      [[5, 4, '#f0f0f0'], [9, 6, '#1a1a1a'], [12, 4, '#1a1a1a'], [15, 6, '#f0f0f0'], [7, 6, '#1a1a1a']].forEach(([x, y, c]) => r(x, y, 2, 1, c)); r(2, 9, 2, 4, '#7a5030'); r(16, 9, 2, 4, '#7a5030'); }) },
    { id: 'mungap', name: '문갑', fw: 2, fh: 1, pt: 12, price: 330, desc: '서책과 문서를 넣어 두는 낮은 장', draw: () => mk(22, 14, r => {
      box(r, 1, 2, 20, 10, '#6a3a22', '#8a5232', '#4a2814'); r(2, 3, 18, 1, '#8a5232'); for (let k = 0; k < 3; k++) { r(2 + k * 6, 4, 6, 7, '#5a3020'); r(2 + k * 6, 4, 1, 7, O); r(4 + k * 6, 7, 2, 1, '#e0b040'); } r(2, 12, 2, 2, '#3a2010'); r(18, 12, 2, 2, '#3a2010'); }) },
    { id: 'bandaji', name: '반닫이', fw: 2, fh: 1, pt: 12, price: 340, desc: '무쇠 장식을 단 앞닫이 궤', draw: () => mk(20, 16, r => {
      box(r, 1, 2, 18, 12, '#8a5030', '#a86a40', '#6a3820'); r(2, 7, 16, 1, O); r(8, 4, 4, 3, '#2a2a2a'); r(9, 5, 2, 1, '#8a8a92'); [[2, 3], [16, 3], [2, 11], [16, 11]].forEach(([x, y]) => r(x, y, 2, 2, '#2a2a2a')); r(6, 9, 8, 3, '#2a2a2a'); r(7, 10, 6, 1, '#6a6a72'); }) },
    { id: 'deungjan', name: '등잔', fw: 1, fh: 1, pt: 7, price: 140, desc: '심지 하나로 밤을 지키는 등잔', glow: '#ffcf6a', draw: () => mk(10, 18, r => {
      r(4, 0, 2, 2, '#ffd34a'); r(4, 1, 2, 1, '#fff3b0'); box(r, 2, 3, 6, 2, '#a8a8b0', '#d8d8e0'); r(4, 5, 2, 9, '#5a3a22'); r(4, 5, 1, 9, '#7a5232'); box(r, 1, 14, 8, 3, '#5a3a22', '#7a5232'); }) },
    { id: 'mokeo', name: '목어', wall: 1, fw: 2, fh: 1, pt: 10, price: 260, desc: '두드리면 잠든 혼이 깨는 나무 물고기', draw: () => mk(22, 12, r => {
      r(2, 3, 16, 1, O); r(1, 4, 18, 5, O); r(2, 9, 16, 1, O); r(2, 4, 16, 5, '#a0602a'); r(2, 4, 16, 1, '#c88040'); r(4, 5, 2, 2, O); r(5, 5, 1, 1, '#f0f0f0'); r(18, 3, 3, 2, O); r(18, 8, 3, 2, O); r(19, 3, 1, 1, '#a0602a'); r(19, 8, 1, 1, '#a0602a');
      for (let k = 0; k < 4; k++) r(8 + k * 2, 6, 1, 2, '#7a4020'); r(10, 0, 1, 3, '#3a2a20'); r(3, 6, 1, 1, '#c83a3a'); }) },
    { id: 'gatrack', name: '갓 걸이', fw: 1, fh: 1, pt: 9, price: 220, desc: '선배 차사들의 갓을 걸어 두는 곳', draw: () => mk(14, 24, r => {
      r(6, 4, 2, 18, '#5a3420'); box(r, 3, 21, 8, 2, '#5a3420', '#7a4a2a'); r(2, 7, 10, 1, '#5a3420');
      r(1, 2, 12, 1, O); r(0, 3, 14, 2, O); r(1, 3, 12, 1, '#2a2a34'); r(4, 0, 6, 2, O); r(5, 0, 4, 2, '#2a2a34'); for (let k = 0; k < 4; k++) r(1 + k, 8 + k * 2, 1, 1, '#e8d8a8'); r(12, 8, 1, 6, '#e8d8a8'); }) },
    { id: 'sundial', name: '앙부일구', fw: 1, fh: 1, pt: 15, price: 460, desc: '솥 모양 해시계. 저승에도 해가 뜰까?', draw: () => mk(16, 18, r => {
      r(3, 13, 2, 4, '#5a4a3a'); r(11, 13, 2, 4, '#5a4a3a'); r(7, 13, 2, 4, '#5a4a3a'); box(r, 2, 16, 12, 1, '#6a6a72');
      r(1, 5, 14, 1, O); r(0, 6, 16, 6, O); r(2, 12, 12, 1, O); r(1, 6, 14, 5, '#8a6a3a'); r(2, 6, 12, 2, '#e8d8a8'); for (let k = 0; k < 6; k++) r(3 + k * 2, 6, 1, 2, '#5a4a3a'); r(7, 2, 2, 5, '#3a2a20'); r(1, 5, 14, 1, '#c89a30'); }) },
    { id: 'honcheon', name: '혼천의', fw: 2, fh: 1, pt: 22, price: 760, desc: '하늘의 별자리를 재는 구리 고리', glow: '#ffd34a', draw: () => mk(20, 24, r => {
      box(r, 5, 21, 10, 2, '#5a4a3a', '#7a6a5a'); r(9, 17, 2, 4, '#c89a30');
      for (let a = 0; a < 40; a++) { const q = a / 40 * Math.PI * 2; r(Math.round(10 + Math.cos(q) * 8), Math.round(10 + Math.sin(q) * 8), 1, 1, '#c89a30'); r(Math.round(10 + Math.cos(q) * 8), Math.round(10 + Math.sin(q) * 3), 1, 1, '#e0b040'); r(Math.round(10 + Math.cos(q) * 3), Math.round(10 + Math.sin(q) * 8), 1, 1, '#a07a20'); }
      r(9, 9, 2, 2, '#7ad0ff'); r(10, 1, 1, 1, '#fff3b0'); }) },
    { id: 'jagae', name: '자개장', fw: 2, fh: 1, pt: 24, price: 820, desc: '전복 껍데기로 학과 구름을 새긴 장롱', draw: () => mk(22, 28, r => {
      box(r, 1, 2, 20, 23, '#1a1420', '#2a2030', '#100c14'); r(11, 3, 1, 21, O); r(1, 25, 2, 3, '#100c14'); r(19, 25, 2, 3, '#100c14');
      [[4, 6], [14, 9], [6, 14], [15, 17], [5, 20]].forEach(([x, y], k) => { r(x, y, 3, 1, ['#a8f0e0', '#f0d8ff', '#c8ecff'][k % 3]); r(x + 1, y - 1, 1, 1, '#ffffff'); }); r(4, 10, 4, 2, '#d8f0ff'); r(13, 5, 4, 1, '#f0d8ff'); r(9, 12, 1, 3, '#e0b040'); r(12, 12, 1, 3, '#e0b040'); }) },
    { id: 'maehwado', name: '매화도 족자', wall: 1, fw: 1, fh: 2, pt: 9, price: 200, desc: '먹으로 그린 홍매화', draw: () => mk(12, 22, r => {
      r(0, 0, 12, 2, '#5a3a22'); box(r, 1, 2, 10, 17, '#f0e8d0'); r(3, 6, 1, 10, '#2a2a2a'); r(4, 9, 3, 1, '#2a2a2a'); r(6, 5, 1, 5, '#2a2a2a'); r(2, 12, 2, 1, '#2a2a2a');
      [[5, 5], [7, 8], [3, 10], [6, 12], [2, 7]].forEach(([x, y]) => r(x, y, 2, 2, '#e04a6a')); r(8, 15, 2, 2, '#c83a3a'); r(0, 19, 12, 2, '#5a3a22'); }) },
    { id: 'bujeok', name: '부적 다발', wall: 1, fw: 1, fh: 1, pt: 6, price: 100, desc: '잡귀를 쫓는 붉은 글씨 부적', draw: () => mk(12, 14, r => {
      [[0, 1], [4, 0], [8, 1]].forEach(([x, y]) => { box(r, x + 1, y + 1, 3, 11, '#f0d860'); r(x + 2, y + 3, 1, 1, '#c83a3a'); r(x + 1, y + 5, 3, 1, '#c83a3a'); r(x + 2, y + 7, 1, 3, '#c83a3a'); }); }) },
    { id: 'pungkyeong', name: '풍경', wall: 1, fw: 1, fh: 2, pt: 7, price: 150, desc: '바람이 불면 땡그랑, 물고기 풍경', draw: () => mk(10, 22, r => {
      r(4, 0, 2, 3, '#3a2a20'); r(2, 3, 6, 1, O); r(1, 4, 8, 6, O); r(2, 4, 6, 5, '#5a7a6a'); r(2, 4, 6, 1, '#7a9a8a'); r(4, 10, 2, 4, '#3a2a20'); r(5, 10, 1, 4, '#c8a040'); r(2, 14, 6, 1, O); r(2, 15, 6, 4, O); r(3, 15, 4, 3, '#c8a040'); r(4, 16, 1, 1, O); r(1, 18, 2, 2, O); r(7, 18, 2, 2, O); }) },
    { id: 'dalchang', name: '달창', wall: 1, fw: 2, fh: 2, pt: 12, price: 300, desc: '둥근 창 너머로 보름달이 걸린다', glow: '#e8f0ff', draw: () => mk(20, 20, r => {
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = Math.hypot(x, y); if (d <= 9.5) r(10 + x, 10 + y, 1, 1, d > 8.2 ? '#5a3a22' : d > 7.6 ? O : '#1a2048'); }
      r(11, 5, 4, 4, '#f4f0d8'); r(12, 6, 1, 1, '#d8d0b0'); r(5, 12, 1, 1, '#ffffff'); r(8, 7, 1, 1, '#ffffff'); r(3, 9, 14, 1, '#5a3a22'); r(9, 3, 1, 14, '#5a3a22'); }) },
    { id: 'jeoseungmap', name: '저승 지도', wall: 1, fw: 3, fh: 2, pt: 14, price: 400, desc: '이승 마을부터 명부전까지 그려진 지도', draw: () => mk(32, 20, r => {
      box(r, 1, 1, 30, 18, '#e8d8a8'); r(1, 1, 30, 1, '#7a4a2a'); r(1, 18, 30, 1, '#7a4a2a'); for (let k = 0; k < 26; k++) r(3 + k, 10 + Math.round(Math.sin(k / 3) * 3), 1, 1, '#3a6ab0');
      [[4, 4, '#4a8a4a'], [10, 13, '#c83a3a'], [17, 5, '#8a6a4a'], [24, 12, '#2a2a3a'], [27, 4, '#e0b040']].forEach(([x, y, c]) => { r(x, y, 3, 3, c); r(x + 1, y + 1, 1, 1, '#f4f0e8'); }); r(6, 7, 1, 6, '#8a4a2a'); r(13, 9, 5, 1, '#8a4a2a'); r(20, 8, 1, 5, '#8a4a2a'); }) },
    { id: 'kite', name: '방패연', wall: 1, fw: 2, fh: 2, pt: 8, price: 170, desc: '태극 무늬 방패연', draw: () => mk(18, 22, r => {
      box(r, 2, 1, 14, 16, '#f4f0e8'); r(7, 7, 4, 4, O); r(7, 7, 2, 2, '#c83a3a'); r(9, 9, 2, 2, '#2a5ab0'); r(9, 7, 2, 2, '#c83a3a'); r(7, 9, 2, 2, '#2a5ab0'); r(2, 1, 14, 2, '#c83a3a'); r(2, 15, 14, 2, '#2a5ab0'); r(8, 17, 1, 5, '#e8d8a8'); r(9, 19, 1, 3, '#c83a3a'); }) },
    { id: 'taenghwa', name: '시왕도 탱화', wall: 1, fw: 3, fh: 2, pt: 26, price: 880, desc: '저승의 열 대왕을 그린 불화', draw: () => mk(32, 22, r => {
      box(r, 1, 1, 30, 20, '#7a1a1a'); r(2, 2, 28, 18, '#c83a2a'); r(1, 1, 30, 1, '#e0b040'); r(1, 20, 30, 1, '#e0b040');
      for (let k = 0; k < 5; k++) { const x = 3 + k * 5.6 | 0; r(x, 4, 4, 2, '#2a2a34'); r(x + 1, 6, 2, 2, '#e8c890'); r(x, 8, 4, 4, ['#2a5a8a', '#3a7a4a', '#e0b040', '#2a5a8a', '#7a3a8a'][k]); r(x, 13, 4, 1, '#e0b040'); }
      r(12, 15, 8, 4, '#e8c890'); r(14, 14, 4, 1, '#ffd34a'); r(13, 16, 6, 3, '#e0b040'); r(15, 17, 2, 1, '#c83a3a'); }) },
  ];
  list.forEach(d => { d.img = null; });
  return list;
})();
// 소품 세트: 옥으로 사는 묶음, 낱개 합보다 약 30% 싸다 (세트마다 한 번)
const DECOR_PACKS = [
  { id: 'p_seonbi', name: '선비의 서재 세트', items: ['bookstand', 'bamboo', 'maehwado', 'deungjan', 'mungap'] },
  { id: 'p_garden', name: '고즈넉한 정원 세트', items: ['bonsai', 'plum', 'stonelamp', 'lotus'] },
  { id: 'p_pungryu', name: '풍류 한마당 세트', items: ['gayageum', 'janggu', 'baduk', 'pyeongsang'] },
  { id: 'p_salim', name: '정겨운 살림 세트', items: ['jangdok', 'bandaji', 'brazier', 'mat', 'fan'] },
  { id: 'p_jeoseung', name: '저승 관아 세트', items: ['mokeo', 'gatrack', 'bujeok', 'jeoseungmap', 'drum'] },
  { id: 'p_royal', name: '왕실 집무실 세트', items: ['irwol', 'goldhaechi', 'dragonjar'] },
  { id: 'p_yeomra', name: '염라의 업경대 세트', items: ['mirror', 'taenghwa', 'jagae'] },
];
DECOR_PACKS.forEach(P => { P.full = P.items.reduce((a, id) => a + DECOR.find(d => d.id === id).price, 0); P.price = Math.round(P.full * 0.7 / 10) * 10; });
const Decor = (() => {
  const S = () => Game.S;
  const D = id => DECOR.find(d => d.id === id);
  const REMOVED = { throne: 1500, yongsang: 1100 }; // 삭제된 소품: 갖고 있던 만큼 옥으로 돌려줌
  function ensure() { const s = S(); if (!s.decor) s.decor = { own: {}, placed: [], gift: 0 };
    if (!s.decor.clean2) { Object.keys(s.decor.own).forEach(id => { if (!D(id)) { if (REMOVED[id]) s.jade += REMOVED[id] * s.decor.own[id]; delete s.decor.own[id]; } }); s.decor.placed = s.decor.placed.filter(p => D(p.id)); s.decor.clean2 = 1; } if (!s.decor.gift) { DECOR.filter(d => d.free).forEach(d => (s.decor.own[d.id] = (s.decor.own[d.id] || 0) + 1)); s.decor.gift = 1; } return s.decor; }
  const isEx = d => d.rank != null || d.story != null || !!d.quest; // 승진·이야기·의뢰로만 얻는 소품
  // 유료 특제 의자 (테스트 결제): 그 직급에 오르면 살 수 있다
  function buyCash(id) { const d = D(id), s = S(); if (!d || !d.cash || s.rank < (d.rankReq || 0)) return false; ensure().own[id] = owned(id) + 1; Game.save(); return true; }
  // 한정 소품 지급: 승진·이야기·의뢰 (중복 지급 방지)
  function grant(d) { const dc = ensure(); dc.got = dc.got || {}; if (dc.got[d.id]) return null; dc.got[d.id] = 1; dc.own[d.id] = (dc.own[d.id] || 0) + 1; return d; }
  function grantRank(rank) { const out = DECOR.filter(d => d.rank != null && d.rank <= rank).map(grant).filter(Boolean); if (out.length) Game.save(); return out; }
  function grantStory(ch) { const out = DECOR.filter(d => d.story != null && d.story <= ch).map(grant).filter(Boolean); if (out.length) Game.save(); return out; }
  function grantQuest() { const dc = ensure(); dc.got = dc.got || {}; const pool = DECOR.filter(d => d.quest && !dc.got[d.id]); if (!pool.length) return null; const d = grant(pool[Math.floor(Math.random() * pool.length)]); Game.save(); return d; }
  const img = id => { const d = D(id); return d.img || (d.img = d.draw()); };
  const owned = id => ensure().own[id] || 0;
  const placedCount = id => ensure().placed.filter(p => p.id === id).length;
  const spare = id => owned(id) - placedCount(id);
  const maxPlace = () => Infinity; // 배치 개수 제한 없음 (빈자리만 있으면 얼마든지)
  function buy(id) { const d = D(id), s = S(); if (!d || !d.price || isEx(d) || d.cash || s.jade < d.price) return false; s.jade -= d.price; ensure().own[id] = owned(id) + 1; Game.save(); return true; }
  function buyPack(pid) { const P = DECOR_PACKS.find(p => p.id === pid), s = S(); if (!P) return false; ensure(); s.decor.packs = s.decor.packs || {}; if (s.decor.packs[pid] || s.jade < P.price) return false; s.jade -= P.price; P.items.forEach(id => (s.decor.own[id] = owned(id) + 1)); s.decor.packs[pid] = 1; Game.save(); return true; }
  const packBought = pid => !!((ensure().packs || {})[pid]);
  function place(id, gx, gy) { const dc = ensure(); if (spare(id) <= 0 || dc.placed.length >= maxPlace()) return false; dc.placed.push({ id, gx, gy }); Game.apply(); Game.save(); return true; }
  function remove(i) { const dc = ensure(); const p = dc.placed.splice(i, 1)[0]; Game.apply(); Game.save(); return p; }
  // 품격: 배치한 소품의 합. 품격 1당 수확량 +0.25% (최대 +40%)
  const score = () => ensure().placed.reduce((a, p) => a + (D(p.id) ? D(p.id).pt : 0), 0);
  const mul = () => (S() && S().decor ? 1 + Math.min(0.4, score() * 0.0025) : 1);
  const title = sc => sc >= 160 ? '저승 제일의 집무실' : sc >= 100 ? '화려한 집무실' : sc >= 50 ? '품위 있는 집무실' : sc >= 20 ? '아늑한 집무실' : '소박한 집무실';
  return { D, isEx, buyCash, ensure, grantRank, grantStory, grantQuest, img, packBought, owned, spare, placedCount, maxPlace, buy, buyPack, place, remove, score, mul, title };
})();
