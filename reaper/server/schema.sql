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
  delete from docs where col = 'rank' and doc_id = v_id::text; -- 운영자는 순위에서 빠짐
  return '운영자 등록 완료: ' || v_id;
end $$;
revoke all on function public.add_admin(text) from public, anon, authenticated;

create or replace view public.admin_list with (security_invoker = true) as
  select a.user_id, u.email, (select data ->> 'name' from public.saves sv where sv.user_id = a.user_id) as nick
  from public.admins a left join auth.users u on u.id = a.user_id;
-- 운영자는 순위에서 빠짐: 이미 올라가 있던 운영자 순위 기록 지우기 (게임도 운영자 기록은 올리지 않음)
delete from public.docs where col = 'rank' and doc_id in (select user_id::text from public.admins);
revoke all on public.admin_list from anon, authenticated;

-- 1:1 문의 목록 (답변 안 한 것 먼저, 한국 시간)
--   select * from inquiry_list;                       -- 전부
--   select * from inquiry_list where replied = false; -- 답변 대기만
drop view if exists public.inquiry_list;
create view public.inquiry_list with (security_invoker = true) as
  select q.id, q.reply is not null as replied, q.category, q.nick,
         upper(left(replace(q.user_id::text, '-', ''), 8)) as code,     -- 게임 설정에 보이는 회원 코드
         u.email, u.raw_app_meta_data ->> 'provider' as login,
         q.body, q.reply,
         q.created_at at time zone 'Asia/Seoul' as asked_kst, q.replied_at at time zone 'Asia/Seoul' as replied_kst, q.info, q.user_id
  from public.inquiries q left join auth.users u on u.id = q.user_id
  order by (q.reply is not null), q.created_at desc;
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

-- ===== 이용 통계 (익명) =====
-- 게임이 하루마다 보내는 접속 기록. 기기마다 하루 한 줄 (dev = 앱이 만든 무작위 번호, 이름 · 이메일 없음)
-- 보는 법은 docs/STATS_SQL.md  (예: select * from stats_daily;  select * from stats_retention;)
create table if not exists public.stats (
  dev        text    not null,            -- 앱이 만든 무작위 번호
  day        date    not null,            -- 접속한 날 (한국 시간)
  first_day  date,                        -- 처음 시작한 날 (한국 시간)
  sec        integer not null default 0,  -- 그날 실제로 켜 둔 시간(초, 분 단위)
  sessions   integer not null default 0,  -- 그날 접속 횟수
  os text, ver text, lang text, login boolean, rank integer, lv integer,
  updated_at timestamptz not null default now(),
  primary key (dev, day)
);
create index if not exists stats_day on public.stats (day);
create index if not exists stats_first on public.stats (first_day);
alter table public.stats enable row level security; -- 정책 없음 = 앱에서 직접 읽기 · 쓰기 불가 (track 함수로만 쓰기)

create or replace function public.track(
  p_dev text, p_day date, p_first date, p_sec integer, p_n integer,
  p_os text, p_ver text, p_lang text, p_login boolean, p_rank integer, p_lv integer
) returns void language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if p_dev is null or length(p_dev) < 8 or length(p_dev) > 64 then return; end if;
  if p_day is null or p_day < v_today - 1 or p_day > v_today + 1 then return; end if; -- 시계가 크게 틀린 기기는 버림
  insert into stats (dev, day, first_day, sec, sessions, os, ver, lang, login, rank, lv)
  values (p_dev, p_day, least(coalesce(p_first, p_day), p_day), least(greatest(coalesce(p_sec, 0), 0), 86400), least(greatest(coalesce(p_n, 1), 1), 500),
          left(p_os, 16), left(p_ver, 16), left(p_lang, 8), p_login, least(greatest(coalesce(p_rank, 0), 0), 99), least(greatest(coalesce(p_lv, 0), 0), 100000))
  on conflict (dev, day) do update set
    sec = greatest(stats.sec, excluded.sec), sessions = greatest(stats.sessions, excluded.sessions),
    first_day = least(stats.first_day, excluded.first_day),
    os = excluded.os, ver = excluded.ver, lang = excluded.lang, login = excluded.login, rank = excluded.rank, lv = excluded.lv, updated_at = now();
end $$;
revoke all on function public.track(text, date, date, integer, integer, text, text, text, boolean, integer, integer) from public;
grant execute on function public.track(text, date, date, integer, integer, text, text, text, boolean, integer, integer) to anon, authenticated;

-- 날짜별: DAU · 신규 · 평균 플레이 시간 · 기기 · 로그인 비율
create or replace view public.stats_daily with (security_invoker = true) as
  with f as (select dev, min(first_day) as fd from public.stats group by dev)
  select s.day as 날짜,
         count(*) as dau,
         count(*) filter (where f.fd = s.day) as 신규,
         round(avg(s.sec) / 60.0, 1) as 평균_플레이_분,
         round(avg(s.sessions), 1) as 평균_접속_횟수,
         count(*) filter (where s.os = 'ios') as ios,
         count(*) filter (where s.os = 'android') as android,
         round(100.0 * count(*) filter (where s.login) / count(*), 1) as 로그인_비율
  from public.stats s join f using (dev)
  group by s.day order by s.day desc;
revoke all on public.stats_daily from anon, authenticated;

-- 재접속률(리텐션): 처음 시작한 날 기준 N일 뒤에 다시 들어온 비율(%) · 아직 그날이 안 됐으면 빈칸
create or replace view public.stats_retention with (security_invoker = true) as
  with f as (select dev, min(first_day) as fd from public.stats group by dev),
       a as (select s.dev, f.fd, s.day - f.fd as n from public.stats s join f using (dev))
  select fd as 시작일, count(distinct dev) filter (where n = 0) as 신규,
         case when fd + 1 <= (now() at time zone 'Asia/Seoul')::date then round(100.0 * count(distinct dev) filter (where n = 1)  / nullif(count(distinct dev) filter (where n = 0), 0), 1) end as d1,
         case when fd + 3 <= (now() at time zone 'Asia/Seoul')::date then round(100.0 * count(distinct dev) filter (where n = 3)  / nullif(count(distinct dev) filter (where n = 0), 0), 1) end as d3,
         case when fd + 7 <= (now() at time zone 'Asia/Seoul')::date then round(100.0 * count(distinct dev) filter (where n = 7)  / nullif(count(distinct dev) filter (where n = 0), 0), 1) end as d7,
         case when fd + 14 <= (now() at time zone 'Asia/Seoul')::date then round(100.0 * count(distinct dev) filter (where n = 14) / nullif(count(distinct dev) filter (where n = 0), 0), 1) end as d14,
         case when fd + 30 <= (now() at time zone 'Asia/Seoul')::date then round(100.0 * count(distinct dev) filter (where n = 30) / nullif(count(distinct dev) filter (where n = 0), 0), 1) end as d30
  from a group by fd order by fd desc;
revoke all on public.stats_retention from anon, authenticated;


-- ===== 유저 찾기 (문의 · 환불 · 보상 응대) =====
-- 회원 코드(게임 설정에 보임, 8자리) · 이메일 · 닉네임 아무거나로 찾기
--   select * from user_find('3F9A21C7');
--   select * from user_find('닉네임');
--   select * from user_find('someone@gmail.com');
-- purchases: 이 계정에 지급된 결제 거래 번호 (애플 · 구글 거래 번호) · bought: 산 상품별 횟수
create or replace function public.user_find(p text)
returns table (code text, nick text, email text, login text, joined_kst timestamp, last_login_kst timestamp,
               rank int, reborn int, jade numeric, saved_kst timestamp, purchases jsonb, bought jsonb, user_id uuid)
language sql security definer set search_path = public, auth as $$
  select upper(left(replace(u.id::text, '-', ''), 8)), sv.data ->> 'name', u.email, u.raw_app_meta_data ->> 'provider',
         u.created_at at time zone 'Asia/Seoul', u.last_sign_in_at at time zone 'Asia/Seoul',
         (sv.data ->> 'rank')::int, (sv.data ->> 'reborn')::int, (sv.data ->> 'jade')::numeric,
         sv.updated_at at time zone 'Asia/Seoul', sv.data -> 'txDone', sv.data -> 'bought', u.id
  from auth.users u left join public.saves sv on sv.user_id = u.id
  where replace(u.id::text, '-', '') ilike replace(trim(p), '-', '') || '%'
     or lower(u.email) = lower(trim(p))
     or sv.data ->> 'name' = trim(p)
  limit 20;
$$;
revoke all on function public.user_find(text) from public, anon, authenticated;

-- ===== 서버 점검 (게임 위에 '서버 점검 중' 화면) =====
--   select set_maintenance(true, '오후 3시까지 점검해요', 60);  -- 켜기 (안내 문구 · 예상 시간(분), 둘 다 생략 가능)
--   select set_maintenance(false);                               -- 끄기 (켜 둔 게임도 1분 안에 다시 열림)
-- 운영자 계정은 점검 중에도 그대로 이용 가능 · 점검 중에는 서버 저장을 멈추고 기기에만 저장
create or replace function public.set_maintenance(p_on boolean, p_msg text default null, p_minutes integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_now bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint; v jsonb;
begin
  v := jsonb_strip_nulls(jsonb_build_object('on', coalesce(p_on, false), 'msg', p_msg, 'at', v_now,
         'until', case when p_minutes is not null and p_minutes > 0 then v_now + p_minutes::bigint * 60000 end));
  insert into public.docs (path, col, doc_id, data) values ('config/maintenance', 'config', 'maintenance', v)
  on conflict (path) do update set data = excluded.data, updated_at = now();
  return v;
end $$;
revoke all on function public.set_maintenance(boolean, text, integer) from public, anon, authenticated;

-- ===== 운영자 예약 알림 (휴대폰 알림) =====
-- 정한 시각에 휴대폰 알림으로 보내요. 게임을 켜 둔 사람에게는 그 시각에 게임 안 알림으로 떠요.
-- ⚠️ 서버에서 바로 쏘는 푸시가 아니라, 게임이 미리 받아 두었다가 휴대폰에 예약하는 방식이에요.
--    → 알림 시각 '전에' 게임을 한 번이라도 켠 사람만 받아요. 이벤트는 하루 이상 미리 보내 두면 좋아요.
--   select send_push('🎉 주말 이벤트 시작!', '지금 접속하면 옥 2배!', '2026-11-21 20:00');  -- 한국 시간
--   select send_push('📢 점검 안내', '내일 오후 2시부터 1시간 점검해요');                    -- 시각 생략 = 10분 뒤
--   select * from push_list;                                   -- 보낸 알림 보기
--   delete from public.docs where path = 'push/p1700000000000'; -- 취소 (아직 안 울린 것만 의미 있음)
create or replace function public.send_push(p_title text, p_body text default '', p_at timestamp default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_at bigint; v_id text;
begin
  if coalesce(trim(p_title), '') = '' then raise exception '제목(p_title)을 넣어 주세요'; end if;
  v_at := floor(extract(epoch from coalesce(p_at at time zone 'Asia/Seoul', clock_timestamp() + interval '10 minutes')) * 1000)::bigint;
  if v_at < floor(extract(epoch from clock_timestamp()) * 1000)::bigint then raise exception '이미 지난 시각이에요: %', p_at; end if;
  v_id := 'p' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  insert into public.docs (path, col, doc_id, data) values ('push/' || v_id, 'push', v_id,
    jsonb_build_object('title', left(trim(p_title), 60), 'body', left(coalesce(p_body, ''), 200), 'at', v_at));
  return v_id || ' · ' || to_char(to_timestamp(v_at / 1000.0) at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI') || ' (한국 시간)';
end $$;
revoke all on function public.send_push(text, text, timestamp) from public, anon, authenticated;
create or replace view public.push_list with (security_invoker = true) as
  select path, data ->> 'title' as title, data ->> 'body' as body,
         to_timestamp((data ->> 'at')::bigint / 1000.0) at time zone 'Asia/Seoul' as at_kst
  from public.docs where col = 'push' order by (data ->> 'at')::bigint desc;
revoke all on public.push_list from anon, authenticated;
