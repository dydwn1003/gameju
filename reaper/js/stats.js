// ===== 이용 통계 (익명) =====
// 하루마다 접속 여부 · 플레이 시간 · 접속 횟수를 서버(stats 표)에 보낸다. 게스트 포함.
// 이름 · 이메일 · 광고 ID 는 보내지 않고, 앱이 만든 무작위 번호(devId)로만 구분한다.
// 운영자는 Supabase SQL 로 DAU · 신규 · 재접속률(리텐션) · 평균 플레이 시간을 본다 (docs/STATS_SQL.md).
const Stats = (() => {
  const S = () => Game.S;
  let lastSig = '', lastAt = 0, sending = false, hiddenAt = 0;
  const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
  function today() { const s = S(), d = kstDay(); if (!s.stat || s.stat.d !== d) s.stat = { d, sec: 0, n: 0 }; return s.stat; } // 새 날이 되면 0부터 (보낼 때 최소 1회)
  function devId() { const s = S(); if (!s.devId) s.devId = newId(); return s.devId; }
  // 화면이 켜져 있을 때만 시간을 센다 (ui 의 tick 에서 부름)
  function tick(dt) { if (S() && S().kind && !document.hidden && dt < 1) today().sec += dt; }
  // 새 접속: 앱을 켤 때, 2분 넘게 나갔다가 돌아올 때
  function session() { const s = S(); if (!s || !s.kind) return; const d = kstDay(); if (!s.stat || s.stat.d !== d) s.stat = { d, sec: 0, n: 0 }; s.stat.n++; send(true); }
  async function send(force) {
    const s = S();
    if (!s || !s.kind || typeof Cloud === 'undefined' || !Cloud.ready() || sending) return;
    const st = today(), sec = Math.floor(st.sec / 60) * 60; // 분 단위로만
    const row = {
      p_dev: devId(), p_day: st.d, p_first: kstDay(s.created || Date.now()), p_sec: sec, p_n: Math.max(1, st.n),
      p_os: typeof Native !== 'undefined' ? Native.platform() : 'web', p_ver: (typeof APP !== 'undefined' && APP.version) || '', p_lang: (typeof I18N !== 'undefined' && I18N.lang) || 'ko',
      p_login: !!Cloud.signedIn(), p_rank: s.rank || 0, p_lv: Game.level(),
    };
    const sig = JSON.stringify(row);
    if (sig === lastSig || (!force && Date.now() - lastAt < 5 * 60e3)) return; // 바뀐 게 있을 때, 최대 5분에 한 번
    sending = true; lastAt = Date.now();
    try { if (await Cloud.rpc('track', row)) lastSig = sig; } finally { sending = false; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); send(true); }
    else if (hiddenAt && Date.now() - hiddenAt > 120e3) session();
  });
  return { tick, session, send, devId };
})();
