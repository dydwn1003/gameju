// ===== 원격 푸시 보내기 (Supabase Edge Function) =====
// 운영자 우편(send_mail)이 올라가면 DB 트리거가 이 함수를 불러, 받는 사람 폰에 알림을 보낸다.
// 운영자는 게임 설정 → '푸시 테스트'로 자기 폰에 시험 알림을 보낼 수 있다.
//   안드로이드: Firebase Cloud Messaging(FCM) HTTP v1
//   아이폰: 애플 APNs 에 직접 (Firebase iOS 라이브러리 없이)
//
// 배포: 대시보드 Edge Functions → Deploy a new function → Via Editor, 이름 send-push, 이 파일 내용 붙여 넣기.
//       Verify JWT 는 꺼 두기 (DB 트리거는 x-hook 비밀값으로, 운영자는 로그인 토큰으로 함수 안에서 직접 확인)
// 비밀값 (Edge Functions → Secrets):
//   FCM_SERVICE_ACCOUNT   Firebase 프로젝트 설정 → 서비스 계정 → 새 비공개 키 (JSON 내용 전체)
//   APNS_KEY              애플 푸시 키 파일(.p8) 내용 전체 (아이폰용 · 없으면 아이폰은 건너뜀)
//   APNS_KEY_ID           그 키의 Key ID (10자리)
//   APNS_TEAM_ID          애플 개발자 Team ID (10자리)
//   (선택) IOS_BUNDLE_ID  기본 com.jeoseungsaja.idle
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hook', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));
const pemToDer = (pem: string) => Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));

// ---------- FCM: 서비스 계정 → 접근 토큰 ----------
let fTok = { v: '', exp: 0 };
async function fcmToken(sa: { client_email: string; private_key: string }) {
  if (fTok.v && Date.now() < fTok.exp - 60e3) return fTok.v;
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64urlStr(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${head}.${body}.${b64url(sig)}` });
  const j = await r.json(); if (!j.access_token) throw new Error('fcm token ' + JSON.stringify(j));
  fTok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; return fTok.v;
}
// ---------- APNs: .p8 키 → JWT (50분마다 새로) ----------
let aTok = { v: '', at: 0 };
async function apnsJwt(pem: string, kid: string, team: string) {
  if (aTok.v && Date.now() - aTok.at < 50 * 60e3) return aTok.v;
  const head = b64urlStr(JSON.stringify({ alg: 'ES256', kid })), body = b64urlStr(JSON.stringify({ iss: team, iat: Math.floor(Date.now() / 1000) }));
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(pem), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${head}.${body}`));
  aTok = { v: `${head}.${body}.${b64url(sig)}`, at: Date.now() }; return aTok.v;
}

type Tok = { token: string; platform: string };
type Msg = { title: string; body: string; kind: string };
// 한 기기에 보내기 → 'ok' · 'gone'(지운 앱 · 만료된 토큰: 지우기) · 'fail'
async function sendOne(t: Tok, m: Msg): Promise<string> {
  try {
    if (t.platform === 'ios') {
      const pem = Deno.env.get('APNS_KEY'), kid = Deno.env.get('APNS_KEY_ID'), team = Deno.env.get('APNS_TEAM_ID');
      if (!pem || !kid || !team) return 'fail';
      const bid = Deno.env.get('IOS_BUNDLE_ID') || 'com.jeoseungsaja.idle', jwt = await apnsJwt(pem, kid, team);
      const payload = JSON.stringify({ aps: { alert: { title: m.title, body: m.body }, sound: 'default' }, kind: m.kind });
      for (const host of ['https://api.push.apple.com', 'https://api.sandbox.push.apple.com']) {   // 앱스토어 · TestFlight → 실서버, Xcode 설치 → 샌드박스
        const r = await fetch(`${host}/3/device/${t.token}`, { method: 'POST', headers: { authorization: `bearer ${jwt}`, 'apns-topic': bid, 'apns-push-type': 'alert', 'apns-priority': '10' }, body: payload });
        if (r.ok) return 'ok';
        const e = await r.json().catch(() => ({})) as { reason?: string };
        if (r.status === 410 || e.reason === 'Unregistered') return 'gone';
        if (e.reason !== 'BadDeviceToken') return 'fail';   // BadDeviceToken 이면 다른 서버(샌드박스)로 한 번 더
      }
      return 'gone';
    }
    const sa = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT') || '{}'); if (!sa.project_id) return 'fail';
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST', headers: { authorization: `Bearer ${await fcmToken(sa)}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { token: t.token, notification: { title: m.title, body: m.body }, data: { kind: m.kind },
        android: { priority: 'high', notification: { icon: 'ic_stat_reaper', color: '#E8424F', sound: 'default' } } } }) });
    if (r.ok) return 'ok';
    const e = await r.text();
    return r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(e) ? 'gone' : 'fail';
  } catch (_e) { return 'fail'; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let p: Record<string, unknown> = {}; try { p = await req.json(); } catch (_e) { /* 빈 요청 */ }
  // 누가 불렀나: DB 트리거(x-hook 비밀값) 또는 로그인한 운영자
  const { data: cfg } = await admin.from('push_cfg').select('v').eq('k', 'hook').maybeSingle();
  const byHook = !!cfg && req.headers.get('x-hook') === cfg.v;
  let uid: string | null = null;
  const auth = req.headers.get('authorization') || '';
  if (!byHook && auth.startsWith('Bearer ')) { const { data } = await admin.auth.getUser(auth.slice(7)); uid = data?.user?.id || null; }
  let isAdmin = false; if (uid) { const { data } = await admin.from('admins').select('user_id').eq('user_id', uid).maybeSingle(); isAdmin = !!data; }
  if (!byHook && !isAdmin) return json({ error: 'not allowed' }, 403);

  let toks: Tok[] = [], msg: Msg;
  if (p.mail) {   // 운영자 우편: 받는 사람에게
    const { data: d } = await admin.from('docs').select('data').eq('col', 'mail').eq('doc_id', String(p.mail)).maybeSingle();
    if (!d) return json({ error: 'no mail' }, 404);
    const m = d.data || {}; msg = { title: '📮 ' + (m.title || '우편이 도착했어요'), body: (m.body || '우편함에서 선물을 받아 가세요').slice(0, 120), kind: 'mail' };
    let q = admin.from('push_tokens').select('token, platform');
    if (m.to === 'user' && Array.isArray(m.uids)) q = q.in('user_id', m.uids);
    const { data } = await q.limit(20000); toks = data || [];
  } else if (p.test) {   // 운영자 시험: 내 폰(들)에만
    msg = { title: String(p.title || '🔔 푸시 테스트'), body: String(p.body || '원격 푸시가 잘 도착했어요!'), kind: 'test' };
    const q = p.token ? admin.from('push_tokens').select('token, platform').eq('token', String(p.token)) : admin.from('push_tokens').select('token, platform').eq('user_id', uid);
    const { data } = await q; toks = data || [];
  } else return json({ error: 'nothing to send' }, 400);

  let ok = 0, fail = 0; const gone: string[] = [];
  for (let i = 0; i < toks.length; i += 20) {   // 20개씩 동시에
    const rs = await Promise.all(toks.slice(i, i + 20).map((t) => sendOne(t, msg)));
    rs.forEach((r, j) => { if (r === 'ok') ok++; else if (r === 'gone') gone.push(toks[i + j].token); else fail++; });
  }
  if (gone.length) await admin.from('push_tokens').delete().in('token', gone);
  return json({ sent: ok, failed: fail, removed: gone.length, total: toks.length });
});
