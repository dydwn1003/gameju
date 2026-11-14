// ===== 클라우드 (Supabase): 로그인 · 게임 저장 동기화 · 공유 데이터 =====
// 공유 데이터(순위·집무실·방문·공지·우편)는 docs 테이블 하나에 저장하고,
// claude.ai 공유 저장소와 같은 모양(doc/collection/where/orderBy/limit)으로 감싸서 Board 가 그대로 쓴다.
const Cloud = (() => {
  let sb = null, session = null, listeners = [], onLogin = null, lastPush = 0, pushing = false;
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
      const app = Native.isApp(); // 앱: 로그인 후 딥링크로 돌아와서 code 를 세션으로 바꿈 (PKCE)
      sb = window.__sbClient || window.supabase.createClient(CLOUD.url, CLOUD.anonKey, { auth: { persistSession: true, detectSessionInUrl: !app, autoRefreshToken: true, flowType: app ? 'pkce' : 'implicit' } });
      if (app) Native.onUrl(handleAuthUrl);
      const { data } = await sb.auth.getSession(); session = data.session;
      sb.auth.onAuthStateChange((_e, s) => { session = s; listeners.forEach(f => f(s)); });
      return true;
    } catch (e) { sb = null; return false; }
  }
  // 로그인 성공: 앱을 다시 켜지 않고 화면(UI)이 바로 기록을 맞춤 (UI 가 setOnLogin 으로 넘겨 줌)
  const loggedIn = () => { if (onLogin) onLogin(); else location.reload(); };
  // ---------- 로그인 ----------
  // 로그인할 때마다 계정 선택 창을 띄움 (로그아웃·계정 삭제 뒤 바로 자동 로그인되지 않게, 다른 계정으로 바꿀 수 있게)
  const PROMPT = { kakao: { prompt: 'select_account' }, google: { prompt: 'select_account' } };
  async function signIn(p) {
    if (!sb) return;
    if (Native.isApp()) {
      if (p === 'apple' && Native.platform() === 'ios') return appleNative();
      const back = APP.authRedirect;
      if (p === 'naver') return Native.openUrl(`${CLOUD.url}/functions/v1/${CLOUD.naverFunction}/start?redirect=${encodeURIComponent(back)}`);
      const { data, error } = await sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: back, skipBrowserRedirect: true, queryParams: PROMPT[p] } });
      if (error || !data || !data.url) throw error || new Error('login');
      return Native.openUrl(data.url);
    }
    const back = location.origin + location.pathname;
    if (p === 'naver') { location.href = `${CLOUD.url}/functions/v1/${CLOUD.naverFunction}/start?redirect=${encodeURIComponent(back)}`; return; }
    await sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: back, queryParams: PROMPT[p] } });
  }
  // iOS: 아이폰 기본 'Apple로 계속하기' 창 → Apple 이 준 ID 토큰으로 Supabase 로그인 (Secret Key · Services ID 필요 없음)
  // nonce: Apple 에는 sha256 값을, Supabase 에는 원래 값을 줌 (Supabase 가 다시 해시해서 맞춰 봄)
  async function appleNative() {
    const SL = Native.plugin('SocialLogin'); if (!SL) throw new Error('apple');
    const raw = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const hashed = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))), b => b.toString(16).padStart(2, '0')).join('');
    await SL.initialize({ apple: { clientId: 'com.jeoseungsaja.idle' } });
    const res = await SL.login({ provider: 'apple', options: { scopes: ['email', 'name'], nonce: hashed } });
    const token = res && res.result && res.result.idToken;
    if (!token) throw new Error('apple');
    const { error } = await sb.auth.signInWithIdToken({ provider: 'apple', token, nonce: raw });
    if (error) throw error;
    loggedIn();
  }
  // 앱으로 돌아온 로그인 주소 처리: ?code=… (구글·카카오·애플) 또는 #access_token=… (네이버 매직 링크)
  async function handleAuthUrl(url) {
    const scheme = APP.authRedirect.split('://')[0] + '://';
    if (!url || !url.startsWith(scheme)) return;
    Native.closeBrowser();
    const q = new URLSearchParams((url.split('?')[1] || '').split('#')[0]), h = new URLSearchParams(url.split('#')[1] || '');
    try {
      if (q.get('code')) { const { error } = await sb.auth.exchangeCodeForSession(q.get('code')); if (error) throw error; }
      else if (h.get('access_token')) { const { error } = await sb.auth.setSession({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token') }); if (error) throw error; }
      else return;
      loggedIn();
    } catch (e) { if (typeof toast === 'function') toast('로그인에 실패했어요. 다시 시도해 주세요'); }
  }
  // 계정 삭제 (구글 플레이 · 앱스토어 필수): 서버의 delete-account 함수가 계정과 모든 데이터를 지움
  async function deleteAccount() {
    if (!sb || !uid()) return false;
    const { error } = await sb.functions.invoke(CLOUD.deleteFunction, { method: 'POST', body: {} });
    if (error) throw error;
    await sb.auth.signOut().catch(() => {}); session = null; return true;
  }
  // ---------- 1:1 문의 ----------
  const inquiry = {
    async send(category, body, nick, info) { const { error } = await sb.from('inquiries').insert({ category, body, nick, info }); if (error) throw error; },
    async mine() { const { data, error } = await sb.from('inquiries').select('*').eq('user_id', uid()).order('created_at', { ascending: false }).limit(30); if (error) throw error; return data || []; },
    async all(open) { let q = sb.from('inquiries').select('*').order('created_at', { ascending: false }).limit(50); if (open) q = q.is('reply', null); const { data, error } = await q; if (error) throw error; return data || []; },
    async reply(id, text) { const { error } = await sb.from('inquiries').update({ reply: text, replied_at: new Date().toISOString() }).eq('id', id); if (error) throw error; },
  };
  async function signOut() { if (sb) await sb.auth.signOut(); session = null; }

  // ---------- 게임 저장 ----------
  async function pullSave() {
    if (!uid()) return null;
    const { data, error } = await sb.from('saves').select('data, updated_at').eq('user_id', uid()).maybeSingle();
    if (error) throw error; // 읽기 실패와 '기록 없음'을 구분 (실패했는데 없다고 보고 덮어쓰지 않게)
    if (!data) return null; return { data: data.data, at: new Date(data.updated_at).getTime() };
  }
  // 마지막으로 서버와 맞춘 기록의 지문 (계정마다, 이 기기에만): 다음에 켤 때 '서버가 바뀌었나 · 이 기기가 바뀌었나'를 가림
  const syncKey = () => 'reaper_sync_' + uid();
  function syncBase() { try { return JSON.parse(localStorage.getItem(syncKey()) || 'null'); } catch (e) { return null; } }
  function setSyncBase(fp) { try { if (uid() && fp) localStorage.setItem(syncKey(), JSON.stringify({ fp, at: Date.now() })); } catch (e) {} }
  let inflight = null, synced = false, held = false; // synced: 켤 때 서버 기록과 맞추기를 끝내야 올림 (맞추기 전에 이 기기 기록으로 덮어쓰지 않게)
  async function pushSave(state, force) {
    if (!uid() || !synced || held) return false; // held: 서버 점검 중
    if (pushing) { if (!force) return false; try { await inflight; } catch (e) {} return pushSave(state, true); } // 꼭 올려야 할 저장(앱을 닫을 때 · 로그아웃)은 올리던 것이 끝난 뒤 이어서
    if (!force && Date.now() - lastPush < 30e3) return false;
    pushing = true; lastPush = Date.now();
    const fp = typeof Game !== 'undefined' ? Game.fingerprint(state) : '';
    const body = { user_id: uid(), data: JSON.parse(JSON.stringify(state)), updated_at: new Date().toISOString() }; // 보내는 순간의 모습으로 고정
    inflight = (async () => { try { const { error } = await sb.from('saves').upsert(body); if (!error) { setSyncBase(fp); return true; } return false; } catch (e) { return false; } finally { pushing = false; } })();
    return inflight;
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
        if (order) q = SORT_COLS.includes(order[0]) ? q.order(order[0], { ascending: order[1] !== 'desc', nullsFirst: false }) : q.order(`data->${order[0]}`, { ascending: order[1] !== 'desc', nullsFirst: false }); // jsonb 로 정렬해야 숫자가 숫자 순서로
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
  // 서버 함수 부르기 (게스트도 공개 키로 부를 수 있는 것만: track 등)
  async function rpc(fn, args) { if (!sb) return false; try { const { error } = await sb.rpc(fn, args); return !error; } catch (e) { return false; } }
  return { enabled, init, ready: () => !!sb, rpc, signedIn: () => !!uid(), uid, provider, signIn, signOut, deleteAccount, inquiry, pullSave, pushSave, syncBase, setSyncBase, setSynced: v => { synced = !!v; }, hold: v => { held = !!v; }, isSynced: () => synced, db, user, onChange: f => listeners.push(f), setOnLogin: f => { onLogin = f; } };
})();
