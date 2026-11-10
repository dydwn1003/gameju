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
