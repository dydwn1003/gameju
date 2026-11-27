-- ===== 계정 정지 + 결제 검증 준비 (Supabase SQL Editor 에 통째로 붙여 넣고 Run · 여러 번 실행해도 안전) =====

-- 1) 정지된 계정 목록
create table if not exists public.bans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason  text,
  at      timestamptz not null default now()
);
alter table public.bans enable row level security;          -- 정책 없음 = 앱에서 직접 못 읽고 못 씀 (아래 함수로만)
revoke all on public.bans from anon, authenticated;

create or replace function public.is_banned(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where user_id = p);
$$;

-- 게임이 "내가 정지됐는지" 물어보는 함수 (정지 사유만 돌려줌, 아니면 null)
create or replace function public.my_ban() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(reason, '운영 정책 위반') from public.bans where user_id = auth.uid();
$$;
grant execute on function public.my_ban() to authenticated;

-- 정지하기: 회원 코드(8자리) · 닉네임 · 이메일 아무거나
--   select ban_user('9A9D13D8', '변조된 앱으로 결제를 조작');
create or replace function public.ban_user(p text, p_reason text default '운영 정책 위반') returns text
language plpgsql security definer set search_path = public, auth as $$
declare v uuid; n int := 0;
begin
  for v in
    select u.id from auth.users u left join public.saves sv on sv.user_id = u.id
    where replace(u.id::text, '-', '') ilike replace(trim(p), '-', '') || '%'
       or lower(u.email) = lower(trim(p)) or sv.data ->> 'name' = trim(p)
  loop
    insert into public.bans (user_id, reason) values (v, p_reason)
      on conflict (user_id) do update set reason = excluded.reason, at = now();
    delete from public.docs where col in ('rank', 'offices', 'visits') and doc_id = v::text;  -- 순위 · 집무실에서 내리기
    n := n + 1;
  end loop;
  if n = 0 then return '찾는 계정이 없어요'; end if;
  return n || '개 계정을 정지했어요';
end $$;
revoke all on function public.ban_user(text, text) from public, anon, authenticated;

-- 정지 풀기:  select unban_user('9A9D13D8');
create or replace function public.unban_user(p text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  delete from public.bans b using auth.users u
   where b.user_id = u.id and (replace(u.id::text, '-', '') ilike replace(trim(p), '-', '') || '%' or lower(u.email) = lower(trim(p)));
  get diagnostics n = row_count;
  return n || '개 계정의 정지를 풀었어요';
end $$;
revoke all on function public.unban_user(text) from public, anon, authenticated;

-- 정지 목록 보기:  select * from ban_list;
create or replace view public.ban_list as
  select upper(left(replace(b.user_id::text, '-', ''), 8)) as code, sv.data ->> 'name' as nick, u.email, b.reason, b.at at time zone 'Asia/Seoul' as at_kst
  from public.bans b join auth.users u on u.id = b.user_id left join public.saves sv on sv.user_id = b.user_id
  order by b.at desc;
revoke all on public.ban_list from anon, authenticated;

-- 2) 정지된 계정은 순위 · 집무실 · 방문 기록과 저장을 서버에 쓸 수 없게
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (
  owner = auth.uid() and (
    (col in ('offices', 'visits') and doc_id = auth.uid()::text and not public.is_banned(auth.uid()))
    or (col = 'rank' and doc_id = auth.uid()::text and not public.is_admin() and not public.is_banned(auth.uid()))
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using ((col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text) or (col in ('notices', 'mail', 'mod') and public.is_admin()))
  with check (owner = auth.uid() and (
    (col in ('offices', 'visits') and doc_id = auth.uid()::text and not public.is_banned(auth.uid()))
    or (col = 'rank' and doc_id = auth.uid()::text and not public.is_admin() and not public.is_banned(auth.uid()))
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
drop policy if exists saves_own on public.saves;
create policy saves_own on public.saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and not public.is_banned(auth.uid()));

-- 3) 검증된 결제 기록 (같은 결제를 여러 계정에서 돌려 쓰지 못하게) · 결제 검증 함수(verify-purchase)만 씀
create table if not exists public.iap_receipts (
  store      text not null,              -- google · apple
  tx_id      text not null,              -- 구글 주문 번호(GPA.…) · 애플 거래 번호
  product    text not null,
  user_id    uuid references auth.users (id) on delete set null,
  info       jsonb,
  created_at timestamptz not null default now(),
  primary key (store, tx_id)
);
alter table public.iap_receipts enable row level security;
revoke all on public.iap_receipts from anon, authenticated;

-- 4) 결제 검증 켜기 · 끄기 (verify-purchase 함수 배포 + 비밀값 넣은 뒤에 켜기!)
--   select set_iap_verify(true);   -- 켜기: 새 버전(1.0.4~) 게임은 서버가 진짜라고 확인한 결제만 지급
--   select set_iap_verify(false);  -- 끄기: 예전처럼 바로 지급 (문제가 생겼을 때 임시로)
create or replace function public.set_iap_verify(p_on boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  insert into public.docs (path, col, doc_id, data) values ('config/iap', 'config', 'iap', jsonb_build_object('verify', p_on))
  on conflict (path) do update set data = public.docs.data || jsonb_build_object('verify', p_on), updated_at = now()
  returning data into d;
  return d;
end $$;
revoke all on function public.set_iap_verify(boolean) from public, anon, authenticated;

-- 플랫폼별로 검증 끄기 · 다시 켜기 (검증 전체 스위치가 켜져 있을 때만 의미 있음)
--   select set_iap_platform('ios', false);   -- 아이폰은 확인 없이 통과 (애플 설정이 아직 안 끝났을 때)
--   select set_iap_platform('ios', true);    -- 아이폰도 확인
--   select data from docs where path = 'config/iap';  -- 지금 설정 보기
create or replace function public.set_iap_platform(p_platform text, p_on boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  if p_platform not in ('android', 'ios') then raise exception 'p_platform 은 android 또는 ios 로 써 주세요'; end if;
  insert into public.docs (path, col, doc_id, data) values ('config/iap', 'config', 'iap', jsonb_build_object(p_platform, p_on))
  on conflict (path) do update set data = public.docs.data || jsonb_build_object(p_platform, p_on), updated_at = now()
  returning data into d;
  return d;
end $$;
revoke all on function public.set_iap_platform(text, boolean) from public, anon, authenticated;
