// ===== 계정 삭제 (Supabase Edge Function) =====
// 구글 플레이 · 앱스토어는 "앱 안에서 계정 삭제"를 필수로 요구한다.
// 로그인한 사용자가 부르면 그 사람의 저장 · 순위 · 집무실 · 방명록과 로그인 계정을 모두 지운다.
// 배포: 대시보드 Edge Functions → Via Editor 에 붙여 넣고 이름 delete-account. 비밀값은 Supabase 가 자동으로 넣어 줌.
// 로그인 토큰은 함수 안에서 직접 확인하므로 Verify JWT 는 켜도 · 꺼도 안전 (새 API 키 방식에서 막히면 끄기).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  // 서버 전용 키: 예전 방식(SUPABASE_SERVICE_ROLE_KEY) 또는 새 방식(SUPABASE_SECRET_KEYS) 중 있는 것
  let key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!key) { try { const o = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'); key = o.default ?? Object.values(o)[0] ?? ''; } catch (_) { /* 없음 */ } }
  if (!key) return json({ error: 'server key' }, 500);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, key, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(jwt);
  const id = data?.user?.id;
  if (error || !id) return json({ error: 'unauthorized' }, 401);
  // 카카오 연결 끊기: 다음에 카카오로 로그인하면 동의 창이 처음처럼 다시 뜬다
  // 비밀값 KAKAO_ADMIN_KEY (카카오 디벨로퍼스의 Admin 키) 가 Secrets 에 있을 때만. 실패해도 계정 삭제는 계속한다
  const kakaoKey = Deno.env.get('KAKAO_ADMIN_KEY') ?? '';
  const kakao = (data.user.identities ?? []).find((i) => i.provider === 'kakao');
  const kakaoId = kakao ? String(kakao.identity_data?.provider_id ?? kakao.identity_data?.sub ?? kakao.id ?? '') : '';
  let kakaoUnlinked = false;
  if (kakaoKey && kakaoId) {
    try {
      const r = await fetch('https://kapi.kakao.com/v1/user/unlink', {
        method: 'POST',
        headers: { Authorization: `KakaoAK ${kakaoKey}`, 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: new URLSearchParams({ target_id_type: 'user_id', target_id: kakaoId }),
      });
      kakaoUnlinked = r.ok;
    } catch (_) { /* 카카오 응답이 없어도 계정 삭제는 진행 */ }
  }
  // 테이블들은 auth.users 에 on delete cascade 로 묶여 있지만, 순서대로 확실히 지운다
  await admin.from('docs').delete().eq('owner', id);
  await admin.from('saves').delete().eq('user_id', id);
  const del = await admin.auth.admin.deleteUser(id);
  if (del.error) return json({ error: 'delete failed' }, 500);
  return json({ ok: true, kakaoUnlinked });
});
