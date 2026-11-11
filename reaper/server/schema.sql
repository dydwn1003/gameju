-- ===== 저승사자 키우기: Supabase 데이터베이스 =====
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 하세요. 여러 번 실행해도 안전합니다.

-- 1) 게임 저장 (한 사람당 한 줄)
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2) 공유 데이터: 순위(rank) · 집무실(offices) · 방문/좋아요/방명록(visits) · 공지(notices) · 우편(mail)
--    path = '컬렉션/문서id' (예: 'rank/<user id>', 'notices/n1700000000')
create table if not exists public.docs (
  path       text primary key,
  col        text not null,
  doc_id     text not null,
  owner      uuid references auth.users (id) on delete cascade,
  data       jsonb not null,
  score      numeric generated always as ((data ->> 'score')::numeric) stored,  -- 순위 정렬
  at         bigint  generated always as ((data ->> 'at')::bigint) stored,      -- 최신순 정렬
  likes      integer generated always as ((data ->> 'likes')::integer) stored,  -- 인기순 정렬
  updated_at timestamptz not null default now()
);
create index if not exists docs_col_score on public.docs (col, score desc);
create index if not exists docs_col_at    on public.docs (col, at desc);
create index if not exists docs_col_likes on public.docs (col, likes desc);
create index if not exists docs_data_gin  on public.docs using gin (data jsonb_path_ops);

-- 3) 운영자 목록 (공지 쓰기 · 전체 우편 보내기)
create table if not exists public.admins (user_id uuid primary key references auth.users (id) on delete cascade);
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- ===== 접근 규칙 (RLS) =====
alter table public.saves  enable row level security;
alter table public.docs   enable row level security;
alter table public.admins enable row level security;

-- 저장: 자기 것만 읽고 쓰기
drop policy if exists saves_own on public.saves;
create policy saves_own on public.saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 공유 데이터: 누구나 읽기
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to anon, authenticated using (true);

-- 쓰기: rank/offices/visits 는 문서 id 가 내 id 일 때만, notices/mail/mod(방명록 숨기기) 는 운영자만
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (
  owner = auth.uid() and (
    (col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text)
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using ((col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text) or (col in ('notices', 'mail', 'mod') and public.is_admin()))
  with check (owner = auth.uid() and (
    (col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text)
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using ((col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text) or (col in ('notices', 'mail', 'mod') and public.is_admin()));

-- 운영자 목록은 운영자만 볼 수 있음 (추가는 대시보드에서 직접)
drop policy if exists admins_read on public.admins;
create policy admins_read on public.admins for select to authenticated using (public.is_admin());

-- 4) 1:1 문의: 내가 쓴 것만 보이고, 운영자는 모두 보고 답변
create table if not exists public.inquiries (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nick       text,
  category   text not null default '기타',
  body       text not null check (char_length(body) between 2 and 1000),
  info       text,                         -- 기기 · 앱 정보 (문제 확인용)
  reply      text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index if not exists inquiries_user on public.inquiries (user_id, created_at desc);
alter table public.inquiries enable row level security;
drop policy if exists inq_insert on public.inquiries;
create policy inq_insert on public.inquiries for insert to authenticated with check (user_id = auth.uid() and reply is null);
drop policy if exists inq_read on public.inquiries;
create policy inq_read on public.inquiries for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists inq_reply on public.inquiries;
create policy inq_reply on public.inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists inq_delete on public.inquiries;
create policy inq_delete on public.inquiries for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- updated_at 자동 갱신
create or replace function public.touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.touch();

-- ===== 운영자 등록 (내 계정으로 한 번 로그인한 뒤 실행) =====
-- Authentication > Users 에서 내 User UID 를 복사해 아래에 넣고 실행:
-- insert into public.admins (user_id) values ('여기에-내-UID');

-- ===== 운영자 우편을 SQL 로 보내기 =====
-- SQL Editor 에서만 쓸 수 있어요 (게임 앱 · 다른 사용자는 실행 불가).
-- 받는 사람 p_to: 'all' 모두(지금 + 새로 올 사람) · 'old' 지금 하고 있는 사람만 · 'new' 새로 시작하는 사람만
--                 'online' 지금 접속 중인 사람만 · 'user' 특정 플레이어(p_nicks 에 닉네임 목록)
-- 예)
--   select send_mail('오픈 기념 선물', 'all', p_jade => 300, p_days => 14);
--   select send_mail('점검 보상', 'old', p_jade => 100, p_hours => 2, p_body => '점검 동안 기다려 주셔서 감사해요');
--   select send_mail('신규 차사 환영 선물', 'new', p_jade => 200, p_tickets => 3, p_days => 30);
--   select send_mail('깜짝 선물!', 'online', p_jade => 50, p_days => 1);
--   select send_mail('이벤트 당첨', 'user', p_jade => 500, p_nicks => array['갓주', '차사왕']);
-- 보낸 우편 보기:  select * from mail_list;
-- 우편 지우기:     delete from public.docs where path = 'mail/m1700000000000';   (이미 받은 사람의 보상은 그대로)
drop function if exists public.send_mail(text, text, integer, integer, numeric, integer, text, text, text[]);
create or replace function public.send_mail(
  p_title   text,
  p_to      text    default 'all',
  p_jade    integer default 0,
  p_tickets integer default 0,
  p_hours   numeric default 0,
  p_days    integer default 7,
  p_body    text    default '',
  p_decor   text    default '',
  p_nicks   text[]  default null,
  p_souls   bigint  default 0
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_id text := 'm' || v_at;
  v_uids jsonb;
  v_missing text[];
begin
  if p_to not in ('all', 'old', 'new', 'online', 'user') then
    raise exception '받는 사람(p_to)은 all / old / new / online / user 중 하나예요';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception '제목(p_title)을 넣어 주세요'; end if;
  if coalesce(p_jade, 0) <= 0 and coalesce(p_tickets, 0) <= 0 and coalesce(p_hours, 0) <= 0 and coalesce(p_souls, 0) <= 0 and coalesce(p_decor, '') = '' then
    raise exception '보상(p_jade · p_tickets · p_souls · p_hours · p_decor)을 하나 이상 넣어 주세요';
  end if;
  if p_to = 'user' then
    if coalesce(array_length(p_nicks, 1), 0) = 0 then raise exception '특정 플레이어는 p_nicks => array[''닉네임''] 으로 넣어 주세요'; end if;
    select array_agg(n) into v_missing from unnest(p_nicks) n
      where not exists (select 1 from docs where col = 'rank' and data ->> 'nick' = n);
    if v_missing is not null then raise exception '닉네임을 찾지 못했어요: %', array_to_string(v_missing, ', '); end if;
    select jsonb_agg(distinct doc_id) into v_uids from docs where col = 'rank' and data ->> 'nick' = any (p_nicks);
  end if;
  insert into docs (path, col, doc_id, owner, data) values ('mail/' || v_id, 'mail', v_id, null, jsonb_strip_nulls(jsonb_build_object(
    'at', v_at, 'title', trim(p_title), 'body', coalesce(p_body, ''),
    'jade', greatest(coalesce(p_jade, 0), 0), 'tickets', greatest(coalesce(p_tickets, 0), 0), 'hours', greatest(coalesce(p_hours, 0), 0), 'souls', greatest(coalesce(p_souls, 0), 0),
    'decor', coalesce(p_decor, ''), 'until', v_at + greatest(coalesce(p_days, 7), 1)::bigint * 86400000,
    'to', p_to, 'uids', v_uids, 'nicks', case when p_to = 'user' then to_jsonb(p_nicks) end)));
  return v_id;
end $$;
revoke all on function public.send_mail(text, text, integer, integer, numeric, integer, text, text, text[], bigint) from public, anon, authenticated;

-- 보낸 우편 목록 (SQL Editor 에서 보기 좋게)
drop view if exists public.mail_list;
create view public.mail_list with (security_invoker = true) as
  select path, data ->> 'title' as title, coalesce(data ->> 'to', 'all') as "to", data -> 'nicks' as nicks,
         (data ->> 'jade')::int as jade, (data ->> 'tickets')::int as tickets, (data ->> 'hours')::numeric as hours, (data ->> 'souls')::bigint as souls, data ->> 'decor' as decor,
         to_timestamp(at / 1000.0) at time zone 'Asia/Seoul' as sent_kst,
         to_timestamp((data ->> 'until')::bigint / 1000.0) at time zone 'Asia/Seoul' as until_kst
  from public.docs where col = 'mail' order by at desc;
revoke all on public.mail_list from anon, authenticated;

-- ===== 운영자 · 1:1 문의를 SQL 로 =====
-- 운영자 등록: 게임에서 로그인한 계정의 이메일(또는 닉네임)로
--   select add_admin('내이메일@gmail.com');
--   select add_admin('갓주');               -- 닉네임으로도 돼요
-- 운영자 목록:        select * from admin_list;
-- 운영자 빼기:        delete from public.admins where user_id = '<user_id>';
create or replace function public.add_admin(p_who text) returns text
  language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid; v_n int;
begin
  select count(*) into v_n from auth.users where lower(email) = lower(trim(p_who));
  if v_n > 1 then raise exception '이 이메일로 된 계정이 %개예요. user_id 로 직접 넣어 주세요 (select * from admin_list 참고)', v_n; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_who)) limit 1;
  if v_id is null then
    select count(*) into v_n from docs where col = 'rank' and data ->> 'nick' = trim(p_who);
    if v_n > 1 then raise exception '이 닉네임이 %명이에요. 이메일로 넣어 주세요', v_n; end if;
    select doc_id::uuid into v_id from docs where col = 'rank' and data ->> 'nick' = trim(p_who) limit 1;
  end if;
  if v_id is null then raise exception '계정을 찾지 못했어요: % (게임에서 그 계정으로 한 번 로그인했는지 확인)', p_who; end if;
  insert into admins (user_id) values (v_id) on conflict do nothing;
  return '운영자 등록 완료: ' || v_id;
end $$;
revoke all on function public.add_admin(text) from public, anon, authenticated;

create or replace view public.admin_list with (security_invoker = true) as
  select a.user_id, u.email, (select data ->> 'nick' from public.docs d where d.col = 'rank' and d.doc_id = a.user_id::text) as nick
  from public.admins a left join auth.users u on u.id = a.user_id;
revoke all on public.admin_list from anon, authenticated;

-- 1:1 문의 목록 (답변 안 한 것 먼저, 한국 시간)
--   select * from inquiry_list;                       -- 전부
--   select * from inquiry_list where replied = false; -- 답변 대기만
create or replace view public.inquiry_list with (security_invoker = true) as
  select id, reply is not null as replied, category, nick, body, reply,
         created_at at time zone 'Asia/Seoul' as asked_kst, replied_at at time zone 'Asia/Seoul' as replied_kst, info, user_id
  from public.inquiries order by (reply is not null), created_at desc;
revoke all on public.inquiry_list from anon, authenticated;

-- 답변하기 (+ 원하면 그 사람에게 보상 우편도 같이)
--   select reply_inquiry(12, '확인했어요. 불편을 드려 죄송해요!');
--   select reply_inquiry(12, '결제 상품을 우편으로 보냈어요.', p_jade => 550);
create or replace function public.reply_inquiry(p_id bigint, p_reply text, p_jade integer default 0, p_tickets integer default 0, p_hours numeric default 0, p_title text default '📮 문의 답변 보상')
  returns text language plpgsql security definer set search_path = public as $$
declare q public.inquiries; v_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; v_mail text := '';
begin
  select * into q from inquiries where id = p_id;
  if q.id is null then raise exception '문의 번호 %를 찾지 못했어요', p_id; end if;
  if coalesce(trim(p_reply), '') = '' then raise exception '답변 내용을 넣어 주세요'; end if;
  update inquiries set reply = trim(p_reply), replied_at = now() where id = p_id;
  if coalesce(p_jade, 0) > 0 or coalesce(p_tickets, 0) > 0 or coalesce(p_hours, 0) > 0 then
    insert into docs (path, col, doc_id, owner, data) values ('mail/m' || v_at, 'mail', 'm' || v_at, null, jsonb_build_object(
      'at', v_at, 'title', p_title, 'body', '1:1 문의 답변과 함께 보내 드려요.', 'jade', greatest(coalesce(p_jade, 0), 0), 'tickets', greatest(coalesce(p_tickets, 0), 0),
      'hours', greatest(coalesce(p_hours, 0), 0), 'decor', '', 'until', v_at + 30::bigint * 86400000, 'to', 'user',
      'uids', jsonb_build_array(q.user_id::text), 'nicks', jsonb_build_array(coalesce(q.nick, '?'))));
    v_mail := ' + 보상 우편 mail/m' || v_at;
  end if;
  return '답변 완료 (문의 ' || p_id || ')' || v_mail;
end $$;
revoke all on function public.reply_inquiry(bigint, text, integer, integer, numeric, text) from public, anon, authenticated;

-- ===== 새 버전 안내 (게임을 켤 때 '새 버전이 나왔어요' 창) =====
-- select set_app_version('android', 140);            -- 140 보다 낮은 빌드는 안내 창 (닫기 가능)
-- select set_app_version('android', 140, 135);       -- 135 보다 낮은 빌드는 닫기 없이 꼭 업데이트
-- select set_app_version('ios', 12, 0, '새 영물이 추가됐어요!');  -- 안내 문구도 바꾸기
-- select data from public.docs where path = 'config/version';     -- 지금 설정 보기
create or replace function public.set_app_version(p_platform text, p_latest integer, p_min integer default 0, p_msg text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cur jsonb;
begin
  if p_platform not in ('android', 'ios') then raise exception 'p_platform 은 android 또는 ios 로 써 주세요'; end if;
  select data into cur from public.docs where path = 'config/version';
  cur := coalesce(cur, '{}'::jsonb) || jsonb_build_object(p_platform, jsonb_build_object('latest', p_latest, 'min', coalesce(p_min, 0)));
  if p_msg is not null then cur := cur || jsonb_build_object('msg', p_msg); end if;
  insert into public.docs (path, col, doc_id, data) values ('config/version', 'config', 'version', cur)
  on conflict (path) do update set data = excluded.data, updated_at = now();
  return cur;
end $$;
revoke execute on function public.set_app_version(text, integer, integer, text) from public, anon, authenticated;
