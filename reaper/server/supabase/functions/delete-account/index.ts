// ===== 계정 삭제 (Supabase Edge Function) =====
// 구글 플레이 · 앱스토어는 "앱 안에서 계정 삭제"를 필수로 요구한다.
// 로그인한 사용자가 부르면 그 사람의 저장 · 순위 · 집무실 · 방명록과 로그인 계정을 모두 지운다.
// 배포: Verify JWT 를 켠 채로 (기본값) 배포하면 된다. 비밀값은 Supabase 가 자동으로 넣어 줌.
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
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(jwt);
  const id = data?.user?.id;
  if (error || !id) return json({ error: 'unauthorized' }, 401);
  // 테이블들은 auth.users 에 on delete cascade 로 묶여 있지만, 순서대로 확실히 지운다
  await admin.from('docs').delete().eq('owner', id);
  await admin.from('saves').delete().eq('user_id', id);
  const del = await admin.auth.admin.deleteUser(id);
  if (del.error) return json({ error: 'delete failed' }, 500);
  return json({ ok: true });
});
