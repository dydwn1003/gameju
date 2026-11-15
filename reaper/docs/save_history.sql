-- 저장 기록 보관 (복구용) — Supabase SQL Editor 에 통째로 붙여넣고 Run (여러 번 실행해도 괜찮음)
-- ===== 저장 기록 보관 (복구용) =====
-- 서버 저장이 바뀔 때마다 그날(한국 시각)의 마지막 모습을 하루 1장씩 보관 · 30일 지나면 자동 삭제
-- 영물이 사라지거나 계급·누적 혼이 크게 줄면 save_events 에 따로 기록 (게임에서 영물은 원래 사라지지 않음)
--   select * from user_history('닉네임');                 -- 날짜별 계급 · 레벨 · 옥 · 소환권 · 영물 수, 그날 생긴/사라진 영물
--   select * from user_events('닉네임');                  -- 영물 사라짐 · 기록 되돌아감 같은 이상한 변화
--   select restore_save('닉네임', '2026-11-14');          -- 그날 기록으로 되돌리기 (플레이어가 게임을 끈 상태에서!)
--   select pet_of('닉네임', '2026-11-14');                -- 그날 가진 영물 (★별 · 여분)
-- 자세한 사용법: docs/OPERATOR_GUIDE.md "기록 보고 복구하기"
create table if not exists public.save_history (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,                 -- 한국 날짜
  data     jsonb not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.save_history enable row level security;   -- 정책 없음 = 게임(앱)에서는 못 읽고 못 씀, SQL Editor 에서만
revoke all on public.save_history from anon, authenticated;

create table if not exists public.save_events (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now(),
  kind    text not null,                  -- pet_lost (영물 사라짐 · 별 줄어듦) · rollback (계급 · 누적 혼 크게 줄어듦)
  detail  jsonb
);
create index if not exists save_events_user on public.save_events (user_id, at desc);
alter table public.save_events enable row level security;
revoke all on public.save_events from anon, authenticated;

create or replace function public.keep_save_history() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_day date := (now() at time zone 'Asia/Seoul')::date; v_lost jsonb;
begin
  insert into save_history (user_id, day, data, saved_at) values (new.user_id, v_day, new.data, now())
    on conflict (user_id, day) do update set data = excluded.data, saved_at = excluded.saved_at;
  if tg_op = 'UPDATE' and old.data is not null then
    -- 영물: 없어졌거나 별이 줄어든 것
    select jsonb_object_agg(k, jsonb_build_object('before', o.v, 'after', new.data -> 'pets' -> k)) into v_lost
      from jsonb_each(coalesce(old.data -> 'pets', '{}')) o(k, v)
      where coalesce((new.data -> 'pets' ->> k)::int, 0) < coalesce((o.v #>> '{}')::int, 0);
    if v_lost is not null then
      insert into save_events (user_id, kind, detail) values (new.user_id, 'pet_lost', v_lost);
    end if;
    -- 기록이 되돌아감: 계급이 내려갔거나(환생 제외) 누적 혼이 절반 아래로
    if coalesce((new.data ->> 'reborn')::int, 0) = coalesce((old.data ->> 'reborn')::int, 0)
       and (coalesce((new.data ->> 'rank')::int, 0) < coalesce((old.data ->> 'rank')::int, 0)
            or coalesce((new.data ->> 'total')::numeric, 0) < coalesce((old.data ->> 'total')::numeric, 0) * 0.5) then
      insert into save_events (user_id, kind, detail) values (new.user_id, 'rollback', jsonb_build_object(
        'rank', jsonb_build_array(old.data -> 'rank', new.data -> 'rank'),
        'total', jsonb_build_array(old.data -> 'total', new.data -> 'total'),
        'jade', jsonb_build_array(old.data -> 'jade', new.data -> 'jade')));
    end if;
  end if;
  delete from save_history where user_id = new.user_id and day < v_day - 30;
  delete from save_events where user_id = new.user_id and at < now() - interval '90 days';
  return new;
end $$;
revoke all on function public.keep_save_history() from public, anon, authenticated;
drop trigger if exists saves_history on public.saves;
create trigger saves_history after insert or update of data on public.saves
  for each row execute function public.keep_save_history();

-- 회원 코드 · 이메일 · 닉네임 → 계정 하나 (여러 명이면 오류)
create or replace function public.user_pick(p text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare v uuid[];
begin
  select array_agg(distinct u.id) into v from auth.users u left join saves sv on sv.user_id = u.id
   where replace(u.id::text, '-', '') ilike replace(trim(p), '-', '') || '%'
      or lower(u.email) = lower(trim(p)) or sv.data ->> 'name' = trim(p);
  if v is null then raise exception '계정을 찾지 못했어요: %', p; end if;
  if array_length(v, 1) > 1 then raise exception '계정이 여러 개 나와요 (%개) — 회원 코드나 이메일로 찾아 주세요', array_length(v, 1); end if;
  return v[1];
end $$;
revoke all on function public.user_pick(text) from public, anon, authenticated;

create or replace function public.user_history(p text)
returns table (day date, saved_kst timestamp, rank int, reborn int, total numeric, jade numeric, tickets int,
               pet_kinds int, pet_spares int, new_pets text, lost_pets text)
language sql security definer set search_path = public as $$
  with h as (
    select h.day, h.saved_at, h.data,
           lag(h.data -> 'pets') over (order by h.day) as prev
    from save_history h where h.user_id = user_pick(p))
  select h.day, h.saved_at at time zone 'Asia/Seoul', (h.data ->> 'rank')::int, (h.data ->> 'reborn')::int,
         floor((h.data ->> 'total')::numeric), (h.data ->> 'jade')::numeric, coalesce((h.data ->> 'tickets')::int, 0),
         (select count(*) from jsonb_object_keys(coalesce(h.data -> 'pets', '{}')))::int,
         (select coalesce(sum((v #>> '{}')::int), 0) from jsonb_each(coalesce(h.data -> 'petInv', '{}')) e(k, v))::int,
         (select string_agg(k, ', ') from jsonb_object_keys(coalesce(h.data -> 'pets', '{}')) k where h.prev is not null and not h.prev ? k),
         (select string_agg(k, ', ') from jsonb_object_keys(coalesce(h.prev, '{}')) k where not coalesce(h.data -> 'pets', '{}') ? k)
  from h order by h.day desc;
$$;
revoke all on function public.user_history(text) from public, anon, authenticated;

create or replace function public.user_events(p text)
returns table (at_kst timestamp, kind text, detail jsonb)
language sql security definer set search_path = public as $$
  select at at time zone 'Asia/Seoul', kind, detail from save_events where user_id = user_pick(p) order by at desc limit 100;
$$;
revoke all on function public.user_events(text) from public, anon, authenticated;

create or replace function public.pet_of(p text, p_day date)
returns table (pet text, star int, spares int)
language sql security definer set search_path = public as $$
  select k, (v #>> '{}')::int, coalesce((h.data -> 'petInv' ->> k)::int, 0)
  from save_history h, jsonb_each(coalesce(h.data -> 'pets', '{}')) e(k, v)
  where h.user_id = user_pick(p) and h.day = p_day order by 1;
$$;
revoke all on function public.pet_of(text, date) from public, anon, authenticated;

-- 그날 기록으로 되돌리기 · 지금 기록도 오늘 칸이 덮이기 전에 save_events 에 남겨 둠 (되돌리기 취소용)
-- 플레이어가 게임을 완전히 끈 상태에서 실행 → 다시 켜면 서버 기록을 불러옴
create or replace function public.restore_save(p text, p_day date) returns text
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := user_pick(p); v_old jsonb; v_new jsonb;
begin
  select data into v_new from save_history where user_id = v_uid and day = p_day;
  if v_new is null then raise exception '% 기록이 없어요 — select * from user_history(...) 로 남은 날짜를 봐 주세요', p_day; end if;
  select data into v_old from saves where user_id = v_uid;
  insert into save_events (user_id, kind, detail) values (v_uid, 'restored', jsonb_build_object('from_day', p_day, 'before', v_old));
  update saves set data = v_new, updated_at = now() where user_id = v_uid;
  return format('%s 의 기록으로 되돌렸어요 (계급 %s · 옥 %s · 영물 %s종). 플레이어에게 게임을 다시 켜 달라고 해 주세요.',
    p_day, v_new ->> 'rank', v_new ->> 'jade', (select count(*) from jsonb_object_keys(coalesce(v_new -> 'pets', '{}'))));
end $$;
revoke all on function public.restore_save(text, date) from public, anon, authenticated;
