// ===== 결제 검증 (Supabase Edge Function) =====
// 게임이 "결제됐어요"라고 보내면, 서버가 구글 · 애플에 그 결제가 진짜인지 직접 물어본 뒤에만 지급을 허락한다.
// 조작된 앱(가짜 결제 창 · 가짜 영수증)으로 만든 결제는 구글 · 애플에 기록이 없어서 여기서 걸러진다.
// 같은 결제를 여러 계정에서 돌려 쓰지 못하게 iap_receipts 표에 결제 번호를 한 번만 기록한다.
//
// 배포: 대시보드 Edge Functions → Deploy a new function → Via Editor, 이름 verify-purchase, 이 파일 내용 붙여 넣기.
//       Verify JWT 는 꺼 두기 (게스트도 결제할 수 있어서 · 로그인 토큰은 있으면 함수 안에서 직접 확인)
// 비밀값 (Edge Functions → Secrets):
//   GOOGLE_SERVICE_ACCOUNT  구글 서비스 계정 키 JSON 파일 내용 전체 (Play Console 에서 '주문 보기' 권한을 준 계정)
//   APPLE_ISSUER_ID         App Store Connect → 사용자 및 액세스 → 통합 → 앱 내 구입 의 Issuer ID
//   APPLE_KEY_ID            같은 화면에서 만든 앱 내 구입 키의 Key ID
//   APPLE_PRIVATE_KEY       그 키 파일(.p8) 내용 전체 (-----BEGIN PRIVATE KEY----- 부터 끝까지)
//   (선택) ANDROID_PACKAGE  기본 com.jeoseungsaja.idle · (선택) IOS_BUNDLE_ID 기본 com.jeoseungsaja.idle
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
// 결과: ok (진짜 · 지급) · owned (진짜지만 이미 다른 설치에서 지급됨 → 한 번만 사는 상품은 '보유'만, 내용물은 다시 안 줌) · invalid (가짜 · 지급 안 함, 거래 끝냄) · retry (지금은 확인 못 함 · 나중에 다시)
// 환불 회수: { refundCheck: true } 로 부르면 구글 '취소된 구매' 목록을 훑어 iap_refunds 에 기록 (하루 한 번 예약 실행)
//            애플 App Store Server Notifications V2 (환불 알림)도 이 주소로 받음 → 애플에 다시 확인한 뒤 기록
//            게임은 my_refunds() 로 자기 환불을 받아 지급했던 것을 회수하고 ack_refunds() 로 처리 완료 표시
const ok = (extra: Record<string, unknown> = {}) => json({ result: 'ok', ...extra });
const invalid = (why: string) => json({ result: 'invalid', why });
const retry = (why: string) => json({ result: 'retry', why });

const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));
const pemToDer = (pem: string) => Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));

// ---------- 구글: 서비스 계정으로 접근 토큰 받기 ----------
let gTok = { v: '', exp: 0 };
async function googleToken(sa: { client_email: string; private_key: string }) {
  if (gTok.v && Date.now() < gTok.exp - 60e3) return gTok.v;
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64urlStr(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${b64url(sig)}` }),
  });
  if (!r.ok) throw new Error('google token ' + r.status);
  const t = await r.json();
  gTok = { v: t.access_token, exp: Date.now() + (t.expires_in ?? 3600) * 1000 };
  return gTok.v;
}

// ---------- 애플: App Store Server API 용 토큰 (ES256) ----------
async function appleToken(issuer: string, kid: string, pem: string, bid: string) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlStr(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }));
  const body = b64urlStr(JSON.stringify({ iss: issuer, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1', bid }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(pem), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}
const jwsPayload = (jws: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(jws.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));

// ---------- 환불 회수: 구글 '취소된 구매'(환불 · 지불 거절) 목록 → iap_refunds ----------
// deno-lint-ignore no-explicit-any
async function googleRefunds(admin: any) {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT'); if (!raw) return retry('google not set');
  try {
    const sa = JSON.parse(raw), pkg = Deno.env.get('ANDROID_PACKAGE') ?? 'com.jeoseungsaja.idle', at = await googleToken(sa);
    const since = Date.now() - 29 * 86400e3;   // 구글은 최근 30일까지만 (경계에서 거절되지 않게 29일) let token = '', added = 0, seen = 0;
    for (let page = 0; page < 20; page++) {
      const u = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/voidedpurchases?startTime=${since}&maxResults=1000${token ? '&token=' + encodeURIComponent(token) : ''}`;
      const r = await fetch(u, { headers: { Authorization: `Bearer ${at}` } }); if (!r.ok) return retry('google voided ' + r.status + ' ' + (await r.text()).slice(0, 300));
      const j = await r.json();
      for (const v of j.voidedPurchases ?? []) {
        seen++;
        const { data: rc } = await admin.from('iap_receipts').select('tx_id, product, user_id, dev').eq('store', 'google').in('tx_id', [v.orderId, v.purchaseToken].filter(Boolean)).maybeSingle();
        if (!rc) continue;
        const ins = await admin.from('iap_refunds').insert({ store: 'google', tx_id: rc.tx_id, product: rc.product, user_id: rc.user_id, dev: rc.dev, refunded_at: new Date(+v.voidedTimeMillis || Date.now()).toISOString() });
        if (!ins.error) added++;
      }
      token = j.tokenPagination?.nextPageToken ?? ''; if (!token) break;
    }
    return json({ result: 'ok', seen, added });
  } catch (e) { return retry('error ' + (e as Error).message); }
}
// ---------- 환불 회수: 애플 환불 알림 (App Store Server Notifications V2) ----------
// 알림 내용은 믿지 않고, 거래 번호로 애플에 다시 물어서 '환불됨(revocationDate)'일 때만 기록
// deno-lint-ignore no-explicit-any
async function appleNotification(admin: any, signedPayload: string) {
  try {
    const n = jwsPayload(signedPayload);
    if (n.notificationType !== 'REFUND' && n.notificationType !== 'REVOKE') return json({ result: 'ok', ignored: n.notificationType });
    const info = jwsPayload(n.data?.signedTransactionInfo ?? ''), txId = String(info.transactionId ?? '');
    const issuer = Deno.env.get('APPLE_ISSUER_ID'), kid = Deno.env.get('APPLE_KEY_ID'), pem = Deno.env.get('APPLE_PRIVATE_KEY');
    if (!txId || !issuer || !kid || !pem) return retry('apple not set');
    const bid = Deno.env.get('IOS_BUNDLE_ID') ?? 'com.jeoseungsaja.idle', at = await appleToken(issuer, kid, pem, bid);
    let t: Record<string, unknown> | null = null;
    for (const host of ['https://api.storekit.itunes.apple.com', 'https://api.storekit-sandbox.itunes.apple.com']) {
      const r = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(txId)}`, { headers: { Authorization: `Bearer ${at}` } });
      if (r.ok) { t = jwsPayload((await r.json()).signedTransactionInfo); break; }
    }
    if (!t || !t.revocationDate) return json({ result: 'ok', ignored: 'not revoked' });
    const { data: rc } = await admin.from('iap_receipts').select('tx_id, product, user_id, dev').eq('store', 'apple').eq('tx_id', txId).maybeSingle();
    if (rc) await admin.from('iap_refunds').insert({ store: 'apple', tx_id: rc.tx_id, product: rc.product, user_id: rc.user_id, dev: rc.dev, refunded_at: new Date(Number(t.revocationDate)).toISOString() });
    return json({ result: 'ok' });
  } catch (e) { return retry('error ' + (e as Error).message); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!key) { try { const o = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'); key = o.default ?? Object.values(o)[0] ?? ''; } catch (_) { /* 없음 */ } }
  if (!key) return retry('server key');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, key, { auth: { persistSession: false } });

  let p: { platform?: string; product?: string; token?: string; tx?: string; dev?: string; refundCheck?: boolean; signedPayload?: string } = {};
  try { p = await req.json(); } catch (_) { return invalid('body'); }
  if (p.refundCheck) return await googleRefunds(admin);
  if (p.signedPayload) return await appleNotification(admin, p.signedPayload);
  const platform = p.platform, product = String(p.product ?? ''), token = String(p.token ?? ''), txId = String(p.tx ?? '');
  if (!product || (platform !== 'android' && platform !== 'ios')) return invalid('params');

  // 로그인한 사람이면 누구의 결제인지 기록 (게스트는 비워 둠)
  // 플랫폼별 검증 끄기: config/iap 에 { android: false } 또는 { ios: false } 가 있으면 그 플랫폼은 확인 없이 통과
  //   (SQL: select set_iap_platform('ios', false);) — 한쪽 설정이 아직 안 끝났을 때 다른 쪽만 먼저 켜려고
  try {
    const { data: cfg } = await admin.from('docs').select('data').eq('path', 'config/iap').maybeSingle();
    if (cfg?.data && cfg.data[platform] === false) return ok({ skipped: true });
  } catch (_) { /* 설정을 못 읽으면 그대로 검증 */ }

  let uid: string | null = null;
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (jwt) { try { const { data } = await admin.auth.getUser(jwt); uid = data?.user?.id ?? null; } catch (_) { /* 게스트 */ } }

  let store = '', id = '', info: Record<string, unknown> = {};
  try {
    if (platform === 'android') {
      if (!token) return invalid('no token');
      const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
      if (!raw) return retry('google not set');
      const sa = JSON.parse(raw), pkg = Deno.env.get('ANDROID_PACKAGE') ?? 'com.jeoseungsaja.idle';
      const at = await googleToken(sa);
      const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/products/${encodeURIComponent(product)}/tokens/${encodeURIComponent(token)}`, { headers: { Authorization: `Bearer ${at}` } });
      if (r.status === 400 || r.status === 404 || r.status === 410) return invalid('google ' + r.status); // 구글에 없는 결제 = 가짜
      if (!r.ok) return retry('google ' + r.status);
      const g = await r.json();
      if (g.purchaseState === 1) return invalid('canceled');   // 취소된 결제
      if (g.purchaseState !== 0) return retry('pending');      // 2 = 대기 중 (아직 돈이 안 들어옴)
      if (g.consumptionState === 1) return invalid('already consumed'); // 이미 지급 · 소비된 결제를 다른 거래 번호로 다시 보내는 것 막기 (게임은 지급한 뒤에만 소비함)
      store = 'google'; id = g.orderId || token;
      info = { orderId: g.orderId, test: g.purchaseType === 0, time: g.purchaseTimeMillis };
    } else {
      if (!txId) return invalid('no tx');
      const issuer = Deno.env.get('APPLE_ISSUER_ID'), kid = Deno.env.get('APPLE_KEY_ID'), pem = Deno.env.get('APPLE_PRIVATE_KEY');
      if (!issuer || !kid || !pem) return retry('apple not set');
      const bid = Deno.env.get('IOS_BUNDLE_ID') ?? 'com.jeoseungsaja.idle';
      const at = await appleToken(issuer, kid, pem, bid);
      let t: Record<string, unknown> | null = null, sandbox = false;
      for (const host of ['https://api.storekit.itunes.apple.com', 'https://api.storekit-sandbox.itunes.apple.com']) { // 실제 → TestFlight(샌드박스)
        const r = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(txId)}`, { headers: { Authorization: `Bearer ${at}` } });
        if (r.ok) { t = jwsPayload((await r.json()).signedTransactionInfo); sandbox = host.includes('sandbox'); break; }
        if (r.status !== 404 && r.status !== 400) return retry('apple ' + r.status);
      }
      if (!t) return invalid('apple not found');                                   // 애플에 없는 결제 = 가짜
      if (t.bundleId !== bid || t.productId !== product) return invalid('mismatch');
      if (t.revocationDate) return invalid('revoked');                              // 환불된 결제
      store = 'apple'; id = String(t.transactionId); info = { original: t.originalTransactionId, sandbox, time: t.purchaseDate };
    }
  } catch (e) {
    return retry('error ' + (e as Error).message);
  }

  // 같은 결제 번호는 한 번만: 처음이면 기록, 이미 있으면 같은 사람(같은 계정 · 게스트끼리)만 허용
  const dev = String(p.dev ?? '').slice(0, 64) || null;
  const row = { store, tx_id: id, product, user_id: uid, info, dev };
  const ins = await admin.from('iap_receipts').insert(row);
  if (ins.error) {
    if (ins.error.code !== '23505') return retry('db ' + ins.error.code);
    const { data: old } = await admin.from('iap_receipts').select('user_id, dev, created_at').eq('store', store).eq('tx_id', id).maybeSingle();
    if (old && old.user_id && uid && old.user_id !== uid) return invalid('used by another account');
    // 같은 설치(dev)에서 3일 안에 다시 확인 = 응답을 못 받아 다시 묻는 것 → 정상 지급
    // 다른 설치(앱을 지웠다 다시 깔고 '구매 복원' 등) → 'owned': 한 번만 사는 상품은 보유만 표시, 내용물은 다시 안 줌
    const fresh = old && old.dev && dev && old.dev === dev && Date.now() - new Date(old.created_at).getTime() < 3 * 86400e3;
    if (!fresh) return json({ result: 'owned', id });
  }
  return ok({ id });
});
