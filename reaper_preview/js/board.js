// ===== 순위: 레벨 기준 (윤회 횟수가 우선) =====
// claude.ai에서 열면 공유 db로 다른 플레이어와 겨루고, 그 밖에서는 내 기록만 보여 준다.
const Board = (() => {
  let db = null, user = null, uid = null, ready = false, lastSent = '', lastAt = 0, place = 0, onPlace = null;
  const score = s => (s.reborn || 0) * 10000 + Game.level();
  async function init() {
    try {
      if (typeof window.claude === 'undefined' || !window.claude.use) return;
      db = await window.claude.use('db'); user = await window.claude.use('user');
      if (db && user) { uid = await user.id(); ready = !!uid; }
      if (ready) { await push(true); refresh(); setInterval(refresh, 3 * 60e3); }
    } catch (e) { db = null; ready = false; }
  }
  // 내 기록 올리기 (바뀌었을 때만, 최대 1분에 한 번 · 승진 직후엔 바로)
  async function push(force) {
    if (!ready || !Game.S || !Game.S.kind) return;
    const s = Game.S, row = { score: score(s), lv: Game.level(), rank: s.rank, rb: s.reborn || 0, kind: s.kind };
    const sig = JSON.stringify(row);
    if (sig === lastSent || (!force && Date.now() - lastAt < 60e3)) return;
    lastSent = sig; lastAt = Date.now();
    try { await db.doc('rank/' + uid).set(Object.assign(row, { at: Date.now() })); } catch (e) { lastSent = ''; }
  }
  // 상위 50명 + 내 순위
  async function top() {
    if (!ready) return null;
    await push(true);
    const done = new Promise((res, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
    const q = (async () => {
      const snap = await db.collection('rank').orderBy('score', 'desc').limit(50).get();
      const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      let my = rows.findIndex(r => r.id === uid) + 1;
      if (!my) { const above = await db.collection('rank').where('score', '>', score(Game.S)).limit(1000).get(); my = above.size + 1; }
      let names = {}; try { names = await user.profiles(rows.map(r => r.id)); } catch (e) {}
      setPlace(my);
      return { rows: rows.map(r => Object.assign(r, { name: (names[r.id] && names[r.id].name) || '이름 모를 차사', me: r.id === uid })), my };
    })();
    return Promise.race([q, done]);
  }
  function setPlace(p) { if (p !== place) { place = p; onPlace && onPlace(p); } }
  async function refresh() { try { await top(); } catch (e) {} }
  // 순위 구간: 1 = 1위, 2 = 2~5위, 3 = 6~10위, 0 = 그 밖
  const tierOf = p => (p === 1 ? 1 : p >= 2 && p <= 5 ? 2 : p >= 6 && p <= 10 ? 3 : 0);
  return { init, push, top, tierOf, online: () => ready, place: () => place, listen: f => (onPlace = f), _set: setPlace };
})();
