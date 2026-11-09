// ===== 클라우드 (Supabase): 로그인 · 게임 저장 동기화 · 공유 데이터 =====
// 공유 데이터(순위·집무실·방문·공지·우편)는 docs 테이블 하나에 저장하고,
// claude.ai 공유 저장소와 같은 모양(doc/collection/where/orderBy/limit)으로 감싸서 Board 가 그대로 쓴다.
const Cloud = (() => {
  let sb = null, session = null, listeners = [], lastPush = 0, pushing = false;
  const SORT_COLS = ['score', 'at', 'likes']; // docs 테이블에 따로 뽑아 둔 정렬용 숫자 칸
  const enabled = () => !!(CLOUD.url && CLOUD.anonKey) && !(window.claude && window.claude.use);
  const uid = () => (session && session.user ? session.user.id : null);
  const provider = () => (session && session.user ? (session.user.app_metadata && session.user.app_metadata.provider) || (session.user.user_metadata && session.user.user_metadata.provider) || 'email' : null);

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = CLOUD.sdk; s.onload = res; s.onerror = () => rej(new Error('sdk')); document.head.appendChild(s); });
  }
  async function init() {
    if (!enabled()) return false;
    try {
      await Promise.race([loadSdk(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]);
      sb = window.__sbClient || window.supabase.createClient(CLOUD.url, CLOUD.anonKey, { auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });
      const { data } = await sb.auth.getSession(); session = data.session;
      sb.auth.onAuthStateChange((_e, s) => { session = s; listeners.forEach(f => f(s)); });
      return true;
    } catch (e) { sb = null; return false; }
  }
  // ---------- 로그인 ----------
  async function signIn(p) {
    if (!sb) return;
    const back = location.origin + location.pathname;
    if (p === 'naver') { location.href = `${CLOUD.url}/functions/v1/${CLOUD.naverFunction}/start?redirect=${encodeURIComponent(back)}`; return; }
    await sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: back } });
  }
  async function signOut() { if (sb) await sb.auth.signOut(); session = null; }

  // ---------- 게임 저장 ----------
  async function pullSave() {
    if (!uid()) return null;
    const { data, error } = await sb.from('saves').select('data, updated_at').eq('user_id', uid()).maybeSingle();
    if (error || !data) return null; return { data: data.data, at: new Date(data.updated_at).getTime() };
  }
  async function pushSave(state, force) {
    if (!uid() || pushing) return false;
    if (!force && Date.now() - lastPush < 30e3) return false;
    pushing = true; lastPush = Date.now();
    try { const { error } = await sb.from('saves').upsert({ user_id: uid(), data: state, updated_at: new Date().toISOString() }); return !error; }
    catch (e) { return false; } finally { pushing = false; }
  }

  // ---------- 공유 데이터: claude.ai db 와 같은 모양으로 ----------
  const snap = rows => ({ docs: rows.map(r => ({ id: r.doc_id, exists: true, data: () => r.data })), size: rows.length, empty: !rows.length });
  function query(col, filters = [], order = null, lim = 1000) {
    return {
      where: (f, op, v) => query(col, filters.concat([[f, op, v]]), order, lim),
      orderBy: (f, dir) => query(col, filters, [f, dir], lim),
      limit: n => query(col, filters, order, n),
      async get() {
        let q = sb.from('docs').select('doc_id, data').eq('col', col);
        for (const [f, op, v] of filters) {
          if (op === '==') q = q.eq(`data->>${f}`, String(v));
          else if (op === '>') q = SORT_COLS.includes(f) ? q.gt(f, v) : q.gt(`data->>${f}`, v);
          else if (op === 'array-contains') q = q.contains('data', { [f]: [v] });
        }
        if (order) q = SORT_COLS.includes(order[0]) ? q.order(order[0], { ascending: order[1] !== 'desc', nullsFirst: false }) : q.order(`data->>${order[0]}`, { ascending: order[1] !== 'desc' });
        q = q.limit(lim);
        const { data, error } = await q; if (error) throw error; return snap(data || []);
      },
    };
  }
  const db = {
    doc(path) {
      const [col, ...rest] = path.split('/'), id = rest.join('/');
      return {
        async get() { const { data, error } = await sb.from('docs').select('doc_id, data').eq('path', path).maybeSingle(); if (error) throw error; return data ? { id, exists: true, data: () => data.data } : { id, exists: false, data: () => undefined }; },
        async set(d) { const { error } = await sb.from('docs').upsert({ path, col, doc_id: id, owner: uid(), data: d }); if (error) throw error; },
        async delete() { const { error } = await sb.from('docs').delete().eq('path', path); if (error) throw error; },
      };
    },
    collection: c => query(c),
  };
  const user = {
    id: async () => uid(),
    profiles: async () => ({}), // 표시 이름은 게임 닉네임을 씀
    isOwner: async () => { try { const { data } = await sb.rpc('is_admin'); return !!data; } catch (e) { return false; } },
  };
  return { enabled, init, ready: () => !!sb, signedIn: () => !!uid(), uid, provider, signIn, signOut, pullSave, pushSave, db, user, onChange: f => listeners.push(f) };
})();
