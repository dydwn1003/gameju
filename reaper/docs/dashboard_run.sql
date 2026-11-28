-- ===== 운영 대시보드 + 접속 통계 날짜 고치기 (Supabase SQL Editor 에 통째로 붙여 넣고 Run 한 번 · 여러 번 실행해도 안전) =====

-- 1) 접속 기록 함수: 시계가 앞선 기기도 서버의 한국 시간 날짜로 기록
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

-- 2) 이미 들어간 '아직 오지 않은 날짜' 기록을 오늘로 옮기고, 처음 온 날이 접속한 날보다 늦은 것 바로잡기
update public.stats s set day = (now() at time zone 'Asia/Seoul')::date
 where s.day > (now() at time zone 'Asia/Seoul')::date
   and not exists (select 1 from public.stats t where t.dev = s.dev and t.day = (now() at time zone 'Asia/Seoul')::date);
delete from public.stats where day > (now() at time zone 'Asia/Seoul')::date;
update public.stats set first_day = day where first_day > day;

-- 3) 운영 대시보드 요약 함수
create or replace function public.admin_dashboard(p_days int default 14) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  td date := (now() at time zone 'Asia/Seoul')::date;
  n int := least(greatest(coalesce(p_days, 14), 7), 60);
  r jsonb;
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'not admin'; end if;   -- SQL Editor(로그인 없음)에서는 바로 볼 수 있음
  with adm as (select user_id from admins union select user_id from bans
               union select user_id from saves where data ->> 'name' in ('갓주')),
  sv as (select * from saves where user_id not in (select user_id from adm)),
  dv as (select dev, min(first_day) as d0, bool_or(coalesce(login, false)) as lg, max(day) as last from stats group by dev),   -- 기기마다: 처음 온 날 · 로그인 한 적 있는지
  st as (select s.*, dv.d0, dv.lg as dlg from stats s join dv on dv.dev = s.dev),
  price(pid, won) as (values ('jade_100',1200),('jade_550',5900),('jade_1200',12000),('starter_pack',1200),('promo_pack',3300),('yeomra_seal_7d',9900),('remove_ads',6900),
    ('chair_cc0',1200),('chair_cc1',1900),('chair_cc2',2500),('chair_cc3',3300),('chair_cc4',3900),('chair_cc5',4900),('chair_cc6',5900),('chair_cc7',7900),('chair_cc8',9900)),
  gprice(pid, won) as (values ('jade100',1200),('jade550',5900),('jade1200',12000),('starter',1200),('promo',3300),('perm2',9900),('noads',6900)),
  gbuy as (select s.user_id, k.key as pid, case when k.value ~ '^[0-9]+$' then k.value::int else 0 end as qty from sv s cross join lateral jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) k),
  rc as (select r.*, coalesce(p.won, 0) as won, (r.created_at at time zone 'Asia/Seoul')::date as d from iap_receipts r left join price p on p.pid = r.product
         where (r.user_id is null or r.user_id not in (select user_id from adm)) and coalesce(r.info ->> 'sandbox', 'false') <> 'true' and coalesce(r.info ->> 'test', 'false') <> 'true'   -- 애플 샌드박스 · 구글 테스트 결제 제외
           and not exists (select 1 from iap_refunds f where f.store = r.store and f.tx_id = r.tx_id))
  select jsonb_build_object(
    'at', to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI'), 'today', to_char(td, 'MM-DD'),
    'rng', jsonb_build_object('d1', to_char(td - 14, 'MM-DD') || '~' || to_char(td - 1, 'MM-DD'), 'd3', to_char(td - 16, 'MM-DD') || '~' || to_char(td - 3, 'MM-DD'), 'd7', to_char(td - 20, 'MM-DD') || '~' || to_char(td - 7, 'MM-DD'),
      'w7', to_char(td - 6, 'MM-DD') || '~' || to_char(td, 'MM-DD'), 'w30', to_char(td - 29, 'MM-DD') || '~' || to_char(td, 'MM-DD'), 'd3v', to_char(td - 2, 'MM-DD') || '~' || to_char(td, 'MM-DD')),
    'sum', jsonb_build_object(
      'accounts', (select count(*) from auth.users where id not in (select user_id from adm)),
      'saves', (select count(*) from sv),
      'devices', (select count(*) from dv), 'dev_login', (select count(*) from dv where lg), 'dev_guest', (select count(*) from dv where not lg),
      'dau', (select count(*) from stats where day = td), 'dau_guest', (select count(*) from st where day = td and not dlg),
      'new', (select count(*) from dv where d0 = td), 'new_guest', (select count(*) from dv where d0 = td and not lg),
      'wau', (select count(distinct dev) from stats where day > td - 7), 'mau', (select count(distinct dev) from stats where day > td - 30),
      'avg_min', (select coalesce(round(avg(sec) / 60.0, 1), 0) from stats where day = td),
      'saved_1d', (select count(*) from sv where updated_at > now() - interval '1 day')),
    'days', (select coalesce(jsonb_agg(x order by x.d), '[]') from (
      select to_char(g.d, 'MM-DD') as d,
             (select count(*) from stats s where s.day = g.d) as dau,
             (select count(*) from st where st.day = g.d and not st.dlg) as dau_g,
             (select count(*) from dv where dv.d0 = g.d) as new,
             (select count(*) from dv where dv.d0 = g.d and not dv.lg) as new_g,
             (select coalesce(round(avg(sec) / 60.0, 1), 0) from stats s where s.day = g.d) as min,
             (select coalesce(sum(won), 0) from rc where rc.d = g.d) as won
      from generate_series(td - (n - 1), td, interval '1 day') as g(d)) x),
    'now', jsonb_build_object(   -- 지금 기준 재접속: 오늘 0시부터 지금까지
      'back', (select count(*) from st where day = td and d0 < td),                                   -- 오늘 다시 온 사람 (처음 온 날이 오늘 전)
      'back_guest', (select count(*) from st where day = td and d0 < td and not dlg),
      'yd_new', (select count(*) from dv where d0 = td - 1),                                          -- 어제 처음 온 설치
      'yd_back', (select count(*) from dv where d0 = td - 1 and exists (select 1 from stats s where s.dev = dv.dev and s.day = td)),
      'wk_new', (select count(*) from dv where d0 >= td - 7 and d0 < td),                             -- 지난 7일 처음 온 설치
      'wk_back', (select count(*) from dv where d0 >= td - 7 and d0 < td and exists (select 1 from stats s where s.dev = dv.dev and s.day = td))),
    'ret', (select jsonb_build_object(   -- 재접속률: 처음 온 날 뒤 N일째에 다시 온 기기 비율 (전체 · 로그인 · 게스트)
      'd1', (select round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 1)) / nullif(count(*), 0), 1) from dv where d0 <= td - 1 and d0 > td - 15),
      'd3', (select round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 3)) / nullif(count(*), 0), 1) from dv where d0 <= td - 3 and d0 > td - 17),
      'd7', (select round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 7)) / nullif(count(*), 0), 1) from dv where d0 <= td - 7 and d0 > td - 21),
      'd1_login', (select round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 1)) / nullif(count(*), 0), 1) from dv where lg and d0 <= td - 1 and d0 > td - 15),
      'd1_guest', (select round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 1)) / nullif(count(*), 0), 1) from dv where not lg and d0 <= td - 1 and d0 > td - 15))),
    'cohort', (select coalesce(jsonb_agg(x order by x.d desc), '[]') from (   -- 최근 7일 시작한 기기들이 며칠째까지 남았는지
      select to_char(dv.d0, 'MM-DD') as d, count(*) as size,
             round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 1)) / count(*)) as d1,
             round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 3)) / count(*)) as d3,
             round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = dv.d0 + 7)) / count(*)) as d7,
             round(100.0 * count(*) filter (where not dv.lg) / count(*)) as guest,
             round(100.0 * count(*) filter (where exists (select 1 from stats s where s.dev = dv.dev and s.day = td)) / count(*)) as today
      from dv where dv.d0 > td - 8 and dv.d0 < td group by dv.d0) x),
    'os', (select coalesce(jsonb_object_agg(k, v), '{}') from (select coalesce(os, '?') as k, count(distinct dev) as v from stats where day > td - 7 group by 1) x),
    'ver', (select coalesce(jsonb_object_agg(k, v), '{}') from (select coalesce(os, '?') || ' ' || coalesce(ver, '?') as k, count(distinct dev) as v from stats where day > td - 3 group by 1) x),
    'lang', (select coalesce(jsonb_object_agg(k, v), '{}') from (select coalesce(lang, '?') as k, count(distinct dev) as v from stats where day > td - 7 group by 1) x),
    'rank', (select coalesce(jsonb_agg(x order by x.r), '[]') from (   -- 계급별 인원 · 일주일 넘게 안 온 비율 (윤회 전)
      select coalesce((data ->> 'rank')::int, 0) as r, count(*) as n, round(100.0 * count(*) filter (where updated_at < now() - interval '7 days') / count(*)) as gone
      from sv where coalesce((data ->> 'reborn')::int, 0) = 0 and data ->> 'kind' is not null group by 1) x),
    'reborn', (select coalesce(jsonb_object_agg(k, v), '{}') from (select (data ->> 'reborn') || '환' as k, count(*) as v from sv where coalesce((data ->> 'reborn')::int, 0) > 0 group by 1) x),
    'funnel', jsonb_build_object(
      'save', (select count(*) from sv), 'kind', (select count(*) from sv where data ->> 'kind' is not null), 'tut', (select count(*) from sv where data ->> 'tut' = 'done'),
      'nick', (select count(*) from sv where data ->> 'nickSet' = 'true'), 'office', (select count(*) from sv where data ->> 'otut' = 'done'),
      'r3', (select count(*) from sv where coalesce((data ->> 'rank')::int, 0) >= 3 or coalesce((data ->> 'reborn')::int, 0) > 0),
      'r8', (select count(*) from sv where coalesce((data ->> 'rank')::int, 0) >= 8 or coalesce((data ->> 'reborn')::int, 0) > 0)),
    'pay', jsonb_build_object(   -- 서버가 확인한 결제 기록 기준 (환불 · 테스트 결제 · 운영자 제외)
      'won_today', (select coalesce(sum(won), 0) from rc where d = td), 'won_yday', (select coalesce(sum(won), 0) from rc where d = td - 1),
      'payers_today', (select count(distinct coalesce(user_id::text, dev)) from rc where d = td),
      'last', (select to_char(max(created_at) at time zone 'Asia/Seoul', 'MM-DD HH24:MI') from rc),
      'won30', (select coalesce(sum(won), 0) from rc where created_at > now() - interval '30 days'),
      'won_all', (select coalesce(sum(won), 0) from rc),
      'payers30', (select count(distinct coalesce(user_id::text, dev)) from rc where created_at > now() - interval '30 days'),
      'payers_all', (select count(distinct coalesce(user_id::text, dev)) from rc),
      'by', (select coalesce(jsonb_agg(x order by x.won desc), '[]') from (select product as p, count(*) as n, sum(won) as won from rc group by product) x),
      'refunds30', (select count(*) from iap_refunds where created_at > now() - interval '30 days'),
      -- 게임 저장 기록 기준 (로그인 계정 · 처음부터 · 결제 확인 전 구매와 아이폰 결제도 포함, 날짜는 없음)
      'game_won', (select coalesce(sum(b.qty * coalesce(p.won, 0)), 0) from gbuy b left join gprice p on p.pid = b.pid),
      'game_payers', (select count(distinct user_id) from gbuy where qty > 0 and pid in (select pid from gprice))),
    'safe', jsonb_build_object(
      'bans', (select count(*) from bans),
      'flags7', (select count(*) from anticheat_log where action = 'flag' and at > now() - interval '7 days'),
      'bans7', (select count(*) from anticheat_log where action = 'ban' and at > now() - interval '7 days'),
      'jade50k', (select count(*) from sv where (data ->> 'jade') ~ '^[0-9.]+$' and (data ->> 'jade')::numeric > 50000))
  ) into r;
  return r;
end $$;
revoke all on function public.admin_dashboard(int) from public, anon;
grant execute on function public.admin_dashboard(int) to authenticated;   -- 로그인한 사람만 부를 수 있고, 함수 안에서 운영자인지 다시 확인

-- SQL Editor 에서 바로 보기:  select jsonb_pretty(admin_dashboard())
