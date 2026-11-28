-- 접속 통계(stats) 테이블 만들기 · Supabase SQL Editor 에서 한 번 실행 (여러 번 실행해도 괜찮아요)
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
  if p_day > v_today then p_day := v_today; end if;                                   -- 시계가 앞선 기기: 아직 오지 않은 날짜 대신 서버의 한국 시간 오늘로
  if p_first > p_day then p_first := p_day; end if;
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
