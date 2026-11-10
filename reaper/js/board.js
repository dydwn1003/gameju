// ===== 순위: 레벨 기준 (윤회 횟수가 우선) =====
// claude.ai에서 열면 공유 db로 다른 플레이어와 겨루고, 그 밖에서는 내 기록만 보여 준다.
const Board = (() => {
  let db = null, user = null, uid = null, ready = false, lastSent = '', lastAt = 0, place = 0, onPlace = null;
  const score = s => (s.reborn || 0) * 10000 + Game.level();
  async function init() {
    if (ready) { push(true); pushOffice(); return; }
    try {
      if (window.claude && window.claude.use) { db = await window.claude.use('db'); user = await window.claude.use('user'); }
      else if (typeof Cloud !== 'undefined' && Cloud.signedIn()) { db = Cloud.db; user = Cloud.user; } // 우리 서버(Supabase)
      else return;
      if (db && user) { uid = await user.id(); ready = !!uid; } if (ready) isOwner();
      if (ready) { await push(true); refresh(); setInterval(refresh, 3 * 60e3); myLikes(); }
    } catch (e) { db = null; ready = false; }
  }
  // 내 기록 올리기 (바뀌었을 때만, 최대 1분에 한 번 · 승진 직후엔 바로)
  async function push(force) {
    if (!ready || !Game.S || !Game.S.kind || !Game.S.nickSet) return; // 닉네임을 정해야 순위에 오른다
    const s = Game.S, row = { score: score(s), lv: Game.level(), rank: s.rank, rb: s.reborn || 0, kind: s.kind, nick: s.name };
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
      if (!my && Game.S.nickSet) { const above = await db.collection('rank').where('score', '>', score(Game.S)).limit(1000).get(); my = above.size + 1; }
      let names = {}; try { names = await user.profiles(rows.map(r => r.id)); } catch (e) {}
      setPlace(Game.S.nickSet ? my : 0, rows.length);
      return { rows: rows.map(r => Object.assign(r, { name: r.nick || (names[r.id] && names[r.id].name) || '이름 모를 차사', me: r.id === uid })), my, total: rows.length };
    })();
    return Promise.race([q, done]);
  }
  // ===== 집무실 놀러 가기 =====
  // offices/{내 id}: 내 집무실 모습 · visits/{내 id}: 내가 누른 좋아요와 남긴 방명록 (각자 자기 문서만 씀)
  let myVisits = null, lastOffice = '';
  const today = () => new Date().toISOString().slice(0, 10);
  const timeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  async function pushOffice() {
    if (!ready || !Game.S || !Game.S.kind || !Game.S.nickSet) return;
    const s = Game.S, dc = Decor.ensure(), row = { nick: s.name, rank: s.rank, kind: s.kind, rb: s.reborn || 0, placed: dc.placed.map(p => ({ id: p.id, gx: p.gx, gy: p.gy })), score: Decor.score(), likes: (s.officeLikes || 0) };
    const sig = JSON.stringify(row); if (sig === lastOffice) return; lastOffice = sig;
    try { await db.doc('offices/' + uid).set(Object.assign(row, { at: Date.now() })); } catch (e) { lastOffice = ''; }
  }
  async function visitsDoc() { if (myVisits) return myVisits; try { const d = await timeout(db.doc('visits/' + uid).get()); myVisits = d.exists ? d.data() : {}; } catch (e) { myVisits = {}; } myVisits.likedIds = myVisits.likedIds || []; myVisits.blocked = myVisits.blocked || []; myVisits.reported = myVisits.reported || {}; myVisits.hid = myVisits.hid || {}; myVisits.likeDay = myVisits.likeDay || {}; myVisits.noteIds = myVisits.noteIds || []; myVisits.notes = myVisits.notes || {}; myVisits.friends = myVisits.friends || []; return myVisits; }
  const saveVisits = () => db.doc('visits/' + uid).set(Object.assign({}, myVisits, { nick: Game.S.name, at: Date.now() }));
  // 이웃 집무실 목록 (최근에 꾸민 순 · 좋아요 순)
  async function offices(sortLikes) {
    if (!ready) return null;
    await pushOffice();
    const snap = await timeout(db.collection('offices').orderBy(sortLikes ? 'likes' : 'at', 'desc').limit(40).get());
    const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    let names = {}; try { names = await user.profiles(rows.map(r => r.id)); } catch (e) {}
    return rows.map(r => Object.assign(r, { name: r.nick || (names[r.id] && names[r.id].name) || '이름 모를 차사', me: r.id === uid }));
  }
  // 한 집무실 + 그 방의 방명록
  async function office(id) {
    if (!ready) return null;
    const d = await timeout(db.doc('offices/' + id).get()); if (!d.exists) return null;
    const o = Object.assign({ id }, d.data());
    let names = {}; try { names = await user.profiles([id]); } catch (e) {}
    o.name = o.nick || (names[id] && names[id].name) || '이름 모를 차사'; o.me = id === uid;
    o.notes = await guestbook(id);
    const v = await visitsDoc(); o.likedToday = v.likeDay[id] === today(); o.liked = v.likedIds.includes(id);
    return o;
  }
  // 방명록: 쓴 사람 각자의 visits 문서에 notes[집무실 id] 로 저장
  // 숨기는 규칙: 집무실 주인이 차단한 사람 · 내가 차단한 사람 · 내가 신고한 글 · 운영자가 숨긴 글/사람
  let modCache = null, modAt = 0;
  async function modDoc() { if (modCache && Date.now() - modAt < 60e3) return modCache; try { const d = await timeout(db.doc('mod/guestbook').get()); modCache = d.exists ? d.data() : {}; } catch (e) { modCache = modCache || {}; } modCache.notes = modCache.notes || {}; modCache.users = modCache.users || []; modAt = Date.now(); return modCache; }
  // 집무실 주인의 설정: blocked(차단한 사람) · hid(주인이 지운 방명록: 쓴 사람 → 그 글의 시각)
  async function ownerData(id) { if (id === uid) { const v = await visitsDoc(); return { blocked: v.blocked, hid: v.hid }; } try { const d = await timeout(db.doc('visits/' + id).get()); const x = d.exists ? d.data() : {}; return { blocked: x.blocked || [], hid: x.hid || {} }; } catch (e) { return { blocked: [], hid: {} }; } }
  async function guestbook(id) {
    try { const snap = await timeout(db.collection('visits').where('noteIds', 'array-contains', id).limit(40).get());
      const [od, mine, mod] = await Promise.all([ownerData(id), visitsDoc(), modDoc()]); const ob = od.blocked;
      const rows = snap.docs.map(d => ({ by: d.id, nick: d.data().nick, n: (d.data().notes || {})[id] })).filter(r => r.n)
        .filter(r => r.by === uid || (!ob.includes(r.by) && !mine.blocked.includes(r.by) && !mine.reported[r.by + '|' + id] && !mod.users.includes(r.by) && !mod.notes[r.by + '|' + id] && !(od.hid[r.by] && od.hid[r.by] >= r.n.at)))
        .sort((a, b) => b.n.at - a.n.at).slice(0, 30);
      let names = {}; try { names = await user.profiles(rows.map(r => r.by)); } catch (e) {}
      return rows.map(r => ({ by: r.by, m: r.n.m, t: r.n.t, at: r.n.at, ed: r.n.ed, name: r.nick || (names[r.by] && names[r.by].name) || '이름 모를 차사', me: r.by === uid }));
    } catch (e) { return []; }
  }
  async function like(id) { const v = await visitsDoc(); if (v.likeDay[id] === today()) return false; v.likeDay[id] = today(); if (!v.likedIds.includes(id)) v.likedIds.push(id); await saveVisits(); return true; }
  // 남기기 · 고치기 (한 집무실에 한 사람 한 줄). 주인이 나를 차단했거나 운영자가 막았으면 'blocked'
  async function note(id, t) {
    const [od, mod] = await Promise.all([ownerData(id), modDoc()]);
    if (od.blocked.includes(uid) || mod.users.includes(uid)) return 'blocked';
    const v = await visitsDoc(), old = v.notes[id];
    v.notes[id] = { t: String(t).slice(0, 40), at: old ? old.at : Date.now() }; if (old) v.notes[id].ed = Date.now();
    if (!v.noteIds.includes(id)) v.noteIds.push(id); await saveVisits(); return true;
  }
  // 주인이 내 집무실 방명록 지우기 (쓴 사람 문서는 못 고치므로, 그 글을 모두에게 안 보이게 숨김. 새로 쓰면 다시 보임)
  async function ownerDel(by, at) { const v = await visitsDoc(); v.hid[by] = at || Date.now(); await saveVisits(); return true; }
  async function delNote(id) { const v = await visitsDoc(); delete v.notes[id]; v.noteIds = v.noteIds.filter(x => x !== id); await saveVisits(); return true; }
  // 차단: 그 사람의 방명록이 안 보이고, 내 집무실에 글을 남길 수 없음
  async function block(by) { const v = await visitsDoc(); if (!v.blocked.includes(by)) v.blocked.push(by); await saveVisits(); return true; }
  async function unblockAll() { const v = await visitsDoc(); v.blocked = []; v.blockedNames = {}; await saveVisits(); }
  async function blockedCount() { const v = await visitsDoc(); return v.blocked.length; }
  // 신고: 운영자에게 접수(1:1 문의 함께 씀) + 내 화면에서는 바로 숨김
  async function report(row, officeId, reason) {
    const v = await visitsDoc(); v.reported[row.by + '|' + officeId] = Date.now(); await saveVisits();
    if (typeof Cloud !== 'undefined' && Cloud.signedIn()) { try { await Cloud.inquiry.send('신고', `[방명록 신고] ${reason}\n작성자: ${row.name}\n내용: ${row.t != null ? row.t : ''}`, Game.S.name, `report|${row.by}|${officeId}`); } catch (e) {} }
    return true;
  }
  // 운영자: 글 하나 숨기기 · 그 사람 방명록 전체 금지
  async function modHide(by, officeId, banUser) { const m = await modDoc(); if (banUser) { if (!m.users.includes(by)) m.users.push(by); } else m.notes[by + '|' + officeId] = Date.now(); await db.doc('mod/guestbook').set({ notes: m.notes, users: m.users, at: Date.now() }); modAt = Date.now(); }
  // 이웃 (내 visits 문서에 저장)
  async function friends() { const v = await visitsDoc(); return v.friends.slice(); }
  async function toggleFriend(id) { const v = await visitsDoc(); const i = v.friends.indexOf(id); if (i >= 0) v.friends.splice(i, 1); else v.friends.push(id); await saveVisits(); return i < 0; }
  async function officesByIds(ids) {
    if (!ready || !ids.length) return [];
    const docs = await Promise.all(ids.map(id => timeout(db.doc('offices/' + id).get()).catch(() => null)));
    const rows = docs.map((d, k) => d && d.exists ? Object.assign({ id: ids[k] }, d.data()) : null).filter(Boolean);
    let names = {}; try { names = await user.profiles(rows.map(r => r.id)); } catch (e) {}
    return rows.map(r => Object.assign(r, { name: r.nick || (names[r.id] && names[r.id].name) || '이름 모를 차사', me: r.id === uid }));
  }
  // 내 집무실이 받은 좋아요 수 (좋아요를 누른 사람 수)
  async function myLikes() { if (!ready) return 0; try { const snap = await timeout(db.collection('visits').where('likedIds', 'array-contains', uid).limit(1000).get()); const n = snap.size; if (Game.S) { Game.S.officeLikes = n; } await pushOffice(); return n; } catch (e) { return Game.S && Game.S.officeLikes || 0; } }
  let total = 0;
  // ===== 공지사항 · 전체 우편 (운영자만 쓰기) =====
  let owner = false;
  async function isOwner() { try { owner = !!(user && await user.isOwner()); } catch (e) { owner = false; } return owner; }
  async function notices() { if (!ready) return null; const snap = await timeout(db.collection('notices').orderBy('at', 'desc').limit(20).get()); return snap.docs.map(d => Object.assign({ id: d.id }, d.data())); }
  async function postNotice(n) { const id = 'n' + Date.now(); await db.doc('notices/' + id).set(Object.assign({ at: Date.now() }, n)); return id; }
  async function delNotice(id) { await db.doc('notices/' + id).delete(); }
  async function mails() { if (!ready) return null; const snap = await timeout(db.collection('mail').orderBy('at', 'desc').limit(30).get()); const now = Date.now(); return snap.docs.map(d => Object.assign({ id: d.id }, d.data())).filter(m => !m.until || m.until > now); }
  async function sendMail(m) { const id = 'm' + Date.now(); await db.doc('mail/' + id).set(Object.assign({ at: Date.now() }, m)); return id; }
  async function delMail(id) { await db.doc('mail/' + id).delete(); }
  function setPlace(p, n) { if (n != null) total = n; if (p !== place || n != null) { place = p; onPlace && onPlace(p, total); } }
  // 닉네임 중복 확인
  async function nickTaken(n) { if (!ready) return false; try { const snap = await timeout(db.collection('rank').where('nick', '==', n).limit(3).get()); return snap.docs.some(d => d.id !== uid); } catch (e) { return false; } }
  async function refresh() { try { await top(); } catch (e) {} }
  // 순위 구간: 1 = 1위, 2 = 2~5위, 3 = 6~10위, 0 = 그 밖
  const tierOf = p => (p === 1 ? 1 : p >= 2 && p <= 5 ? 2 : p >= 6 && p <= 10 ? 3 : 0);
  return { init, push, top, nickTaken, isOwner: () => owner, checkOwner: isOwner, notices, postNotice, delNotice, mails, sendMail, delMail, total: () => total, pushOffice, offices, office, like, note, delNote, ownerDel, block, unblockAll, blockedCount, report, modHide, myLikes, guestbook, friends, toggleFriend, officesByIds, myId: () => uid, tierOf, online: () => ready, place: () => place, listen: f => (onPlace = f), _set: setPlace };
})();
