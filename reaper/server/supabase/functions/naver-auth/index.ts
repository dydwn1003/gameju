// ===== 네이버 로그인 (Supabase Edge Function) =====
// Supabase 는 네이버를 기본 지원하지 않아서, 이 함수가 네이버 로그인을 대신 처리하고
// 같은 이메일의 Supabase 계정에 '매직 링크'로 로그인시켜 게임으로 돌려보낸다.
//
// 흐름: 게임 → /naver-auth/start?redirect=게임주소 → 네이버 로그인 → /naver-auth/callback
//       → 네이버 토큰·프로필 확인 → Supabase 계정 찾기/만들기 → 매직 링크로 게임에 돌아감(로그인됨)
//
// 필요한 비밀값 (supabase secrets set ...):
//   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, ALLOWED_REDIRECTS (게임 주소, 쉼표로 여러 개)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase 가 자동으로 넣어 줌
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const env = (k: string) => Deno.env.get(k) ?? '';
const FN_URL = `${env('SUPABASE_URL')}/functions/v1/naver-auth`;
const allowed = () => env('ALLOWED_REDIRECTS').split(',').map((s) => s.trim()).filter(Boolean);
const okRedirect = (u: string) => allowed().some((a) => u === a || u.startsWith(a));
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const unb64 = (s: string) => decodeURIComponent(escape(atob(s)));
const text = (msg: string, status = 400) => new Response(msg, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/naver-auth/, '');

  // 1) 네이버 로그인 화면으로 보내기
  if (path === '/start') {
    const redirect = url.searchParams.get('redirect') ?? '';
    if (!okRedirect(redirect)) return text('허용되지 않은 주소예요 (ALLOWED_REDIRECTS 확인)');
    const state = b64(JSON.stringify({ r: redirect, n: crypto.randomUUID() }));
    const q = new URLSearchParams({ response_type: 'code', client_id: env('NAVER_CLIENT_ID'), redirect_uri: `${FN_URL}/callback`, state });
    return Response.redirect(`https://nid.naver.com/oauth2.0/authorize?${q}`, 302);
  }

  // 2) 네이버에서 돌아옴
  if (path === '/callback') {
    const code = url.searchParams.get('code'), state = url.searchParams.get('state') ?? '';
    let redirect = '';
    try { redirect = JSON.parse(unb64(state)).r; } catch { return text('잘못된 요청이에요'); }
    if (!code || !okRedirect(redirect)) return text('잘못된 요청이에요');

    // 토큰 교환
    const tq = new URLSearchParams({ grant_type: 'authorization_code', client_id: env('NAVER_CLIENT_ID'), client_secret: env('NAVER_CLIENT_SECRET'), code, state });
    const tok = await (await fetch(`https://nid.naver.com/oauth2.0/token?${tq}`)).json();
    if (!tok.access_token) return text('네이버 로그인에 실패했어요');

    // 프로필
    const me = await (await fetch('https://openapi.naver.com/v1/nid/me', { headers: { Authorization: `Bearer ${tok.access_token}` } })).json();
    const p = me.response;
    if (!p?.id) return text('네이버 프로필을 가져오지 못했어요');
    const email = p.email || `naver_${p.id}@users.noreply.local`;

    // Supabase 계정 찾기/만들기 → 매직 링크
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
    const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { provider: 'naver', naver_id: p.id, nickname: p.nickname } });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) return text('계정을 만들지 못했어요');
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: redirect } });
    if (link.error || !link.data?.properties?.action_link) return text('로그인 링크를 만들지 못했어요');
    return Response.redirect(link.data.properties.action_link, 302);
  }
  return text('not found', 404);
});
