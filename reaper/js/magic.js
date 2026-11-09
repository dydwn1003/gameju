// ===== 승진 마법진: 발밑에 깔리는 도트 마법진 (계급이 오를수록 고리·문양·빛이 늘어남) =====
const MAGIC = [
  null,
  { c: ['#8fa8d8', '#c8d8ff'], rings: 1, ticks: 4 },                                   // 말단 차사
  { c: ['#5aa8ff', '#bfe0ff'], rings: 2, ticks: 6 },                                   // 차사
  { c: ['#b8c4ff', '#ffffff'], rings: 2, runes: 8 },                                   // 선임 차사
  { c: ['#ffd34a', '#6fb0ff', '#fff3b0'], rings: 2, runes: 8, star: 3 },               // 차사장
  { c: ['#ff5a6a', '#ffc0c8', '#ffffff'], rings: 3, runes: 10, star: 6 },              // 판관
  { c: ['#ff3a5a', '#ffd34a', '#fff0b0'], rings: 3, runes: 12, star: 6, motes: 1 },    // 명부 판관
  { c: ['#7a8aff', '#ffd34a', '#ffffff', '#c0a0ff'], rings: 3, runes: 12, star: 6, outer: 1, motes: 2 }, // 시왕
  { c: ['#ffd34a', '#ff7a30', '#fff0a0', '#ff4a6a', '#7ad0ff'], rings: 4, runes: 16, star: 6, outer: 1, motes: 3, rays: 1 }, // 염라대왕
];
// ctx 위 (cx, cy)를 중심으로 그린다. t: 초 단위 시간. 반지름은 계급에 따라 커짐.
function drawMagic(ctx, cx, cy, rank, t, scale) {
  const M = MAGIC[Math.min(rank, 8)]; if (!M) return;
  const sc = scale || 1, R = (8 + rank * 1.1) * sc, E = 0.42;
  const px = (x, y, c, a) => { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = c; ctx.fillRect(Math.round(cx + x), Math.round(cy + y * E), 1, 1); };
  const ring = (r, c, a, dash, rot) => { const n = Math.max(12, Math.round(r * 6.3)); for (let i = 0; i < n; i++) { if (dash && ((i + Math.floor(rot * 4)) % dash) === 0) continue; const q = i / n * Math.PI * 2 + (rot || 0); px(Math.cos(q) * r, Math.sin(q) * r, c, a); } };
  const line = (a1, a2, r, c, a) => { const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r, x2 = Math.cos(a2) * r, y2 = Math.sin(a2) * r, n = Math.ceil(Math.hypot(x2 - x1, y2 - y1)); for (let k = 0; k <= n; k++) px(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n, c, a); };
  const pulse = 0.75 + 0.25 * Math.sin(t * 3), c0 = M.c[0], c1 = M.c[1];
  // 바닥 빛 (도트 디더)
  ctx.globalAlpha = 0.16 + rank * 0.02; ctx.fillStyle = c0;
  for (let yy = -R * E; yy <= R * E; yy++) for (let xx = -R; xx <= R; xx++) { const d = Math.hypot(xx / R, yy / (R * E)); if (d < 1 && ((Math.round(xx) + Math.round(yy)) & 1) && d > 0.15) ctx.fillRect(Math.round(cx + xx), Math.round(cy + yy), 1, 1); }
  // 고리
  ring(R, c0, 0.95 * pulse, 0, 0);
  if (M.rings >= 2) ring(R - 3 * sc, c1, 0.8, 0, 0);
  if (M.rings >= 3) ring(R + 2 * sc, c0, 0.55, 3, -t * 0.6);
  if (M.rings >= 4) ring(R - 6 * sc, M.c[2], 0.7, 4, t * 0.8);
  // 눈금
  if (M.ticks) for (let i = 0; i < M.ticks; i++) { const q = i / M.ticks * Math.PI * 2 + t * 0.5; px(Math.cos(q) * (R - 1), Math.sin(q) * (R - 1), c1); px(Math.cos(q) * (R - 2), Math.sin(q) * (R - 2), c1, 0.7); }
  // 고리 사이를 도는 룬 문자
  if (M.runes) { const rr = R - 1.5 * sc; for (let i = 0; i < M.runes; i++) { const q = i / M.runes * Math.PI * 2 + t * 0.7, x = Math.cos(q) * rr, y = Math.sin(q) * rr, c = M.c[(i % (M.c.length - 1)) + 1], on = (i + Math.floor(t * 5)) % 4 !== 0; if (!on) continue; px(x, y, c); if (i % 2) px(x + 1, y, c, 0.8); else px(x, y - 1 / E, c, 0.8); } }
  // 안쪽 별 문양 (삼각형 → 육망성)
  if (M.star) { const sr = R - (M.rings >= 2 ? 4 : 2) * sc, rot = -t * 0.4, k = M.star === 3 ? 3 : 3; for (let s = 0; s < (M.star === 6 ? 2 : 1); s++) for (let i = 0; i < k; i++) { const a1 = rot + s * Math.PI / 3 + i / k * Math.PI * 2, a2 = rot + s * Math.PI / 3 + (i + 1) / k * Math.PI * 2; line(a1 - Math.PI / 2, a2 - Math.PI / 2, sr, s ? M.c[2] || c1 : c1, 0.75); } }
  // 바깥 반대로 도는 점선 고리 + 꼭짓점 보석
  if (M.outer) { ring(R + 4.5 * sc, M.c[2], 0.5, 2, t * 1.1); for (let i = 0; i < 4; i++) { const q = i / 4 * Math.PI * 2 - t * 1.1; px(Math.cos(q) * (R + 4.5 * sc), Math.sin(q) * (R + 4.5 * sc), '#ffffff'); } }
  // 빛줄기 (염라대왕)
  if (M.rays) for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2 + t * 0.3, a = 0.25 + 0.25 * Math.sin(t * 4 + i); for (let d = R + 6 * sc; d < R + 9 * sc; d++) px(Math.cos(q) * d, Math.sin(q) * d, M.c[i % M.c.length], a); }
  ctx.globalAlpha = 1;
}
// 위로 피어오르는 빛가루를 낼지 (명부 판관 이상)
const magicMotes = rank => (MAGIC[Math.min(rank, 8)] || {}).motes || 0;
