-- 저승사자 키우기 · 운영 데이터 한 번에 보기 (전체 붙여 넣고 Run 한 번)
-- 먼저 stats_setup.sql · security_update.sql 을 한 번 실행해 두세요 · 운영자 · 정지(가짜 결제) 계정 제외 · 한국 시간 · 매출은 판매가 기준
-- 기기 통계(stats: DAU · 리텐션 등)는 계정과 연결되지 않아 정지 계정도 포함됨 (1명이라 영향 미미)
with adm as (select user_id from public.admins union select user_id from public.bans
   union select '9a9d13d8-25a5-4956-bd57-b2d32918c223'::uuid),  -- 똘순이 (가짜 결제) · 정지 전이어도 제외
 sv as (select * from public.saves where user_id not in (select user_id from adm)),
 td as (select (now() at time zone 'Asia/Seoul')::date as d),
 price as (select * from (values ('jade100','옥 100개',1200),('jade550','옥 550개',5900),('jade1200','옥 1,200개',12000),
   ('starter','신입 차사 패키지',1200),('promo','승진 응원 패키지',3300),('perm2','염라의 인장',9900),('noads','광고 제거',6900)) as x(pid, pname, won)),
 buy as (select s.user_id, k.key as pid, k.value::int as n from sv s cross join lateral jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) as k),
 payer as (select b.user_id, sum(b.n * coalesce(p.won, 0)) as won from buy b left join price p on p.pid = b.pid group by b.user_id having sum(b.n) > 0),
 fd as (select dev, min(first_day) as d0 from public.stats group by dev),
 ret as (select s.dev, fd.d0, s.day - fd.d0 as n from public.stats s join fd on fd.dev = s.dev),
 r as (
  select 100 as o, '① 요약' as g, '가입 계정' as k, (select count(*) from auth.users where id not in (select user_id from adm))::text as v
  union all select 101, '① 요약', '저장 기록 있는 계정', (select count(*) from sv)::text
  union all select 102, '① 요약', '누적 기기', (select count(distinct dev) from public.stats)::text
  union all select 103, '① 요약', '오늘 DAU', (select count(*) from public.stats where day = (select d from td))::text
  union all select 104, '① 요약', '오늘 신규', (select count(*) from public.stats where day = (select d from td) and first_day = (select d from td))::text
  union all select 105, '① 요약', '최근 7일 WAU', (select count(distinct dev) from public.stats where day > (select d from td) - 7)::text
  union all select 106, '① 요약', '오늘 평균 플레이(분)', (select coalesce(round(avg(sec) / 60.0, 1), 0) from public.stats where day = (select d from td))::text
  union all select 107, '① 요약', '하루 안에 저장한 계정', (select count(*) from sv where updated_at > now() - interval '1 day')::text
  union all select 200 + ((select d from td) - day), '② 날짜별 (DAU / 신규 / 평균분)', to_char(day, 'MM-DD'),
         count(*) || ' / ' || count(*) filter (where first_day = day) || ' / ' || round(avg(sec) / 60.0, 1)
    from public.stats where day > (select d from td) - 7 group by day
  union all select 300, '③ 재접속률', 'D1 %',
         coalesce((select round(100.0 * count(distinct dev) filter (where n = 1) / nullif(count(distinct dev) filter (where n = 0), 0), 1) from ret where d0 <= (select d from td) - 1 and d0 > (select d from td) - 15)::text, '-')
  union all select 301, '③ 재접속률', 'D7 %',
         coalesce((select round(100.0 * count(distinct dev) filter (where n = 7) / nullif(count(distinct dev) filter (where n = 0), 0), 1) from ret where d0 <= (select d from td) - 7 and d0 > (select d from td) - 21)::text, '-')
  union all select 400 + coalesce((data ->> 'rank')::int, 0), '④ 계급 (인원 / 일주일 이탈%)',
         (array['수습 차사','말단 차사','차사','선임 차사','차사장','판관','명부 판관','시왕','염라대왕'])[coalesce((data ->> 'rank')::int, 0) + 1],
         count(*) || ' / ' || round(100.0 * count(*) filter (where updated_at < now() - interval '7 days') / count(*), 1) || '%'
    from sv where coalesce((data ->> 'reborn')::int, 0) = 0 group by coalesce((data ->> 'rank')::int, 0)
  union all select 500 + coalesce((data ->> 'reborn')::int, 0), '⑤ 윤회 (인원)', coalesce((data ->> 'reborn')::int, 0) || '환', count(*)::text
    from sv where coalesce((data ->> 'reborn')::int, 0) > 0 group by coalesce((data ->> 'reborn')::int, 0)
  union all select 600, '⑥ 처음 흐름', '캐릭터 만듦', (select count(*) from sv where data ->> 'kind' is not null)::text
  union all select 601, '⑥ 처음 흐름', '튜토리얼 끝', (select count(*) from sv where data ->> 'tut' = 'done')::text
  union all select 602, '⑥ 처음 흐름', '닉네임 정함', (select count(*) from sv where data ->> 'nickSet' = 'true')::text
  union all select 603, '⑥ 처음 흐름', '집무실 안내 끝', (select count(*) from sv where data ->> 'otut' = 'done')::text
  union all select 700, '⑦ 상품 (산 사람 / 판매 / 예상 매출)', coalesce(p.pname, b.pid),
         count(distinct b.user_id) || ' / ' || sum(b.n) || ' / ' || to_char(sum(b.n * coalesce(p.won, 0)), 'FM999,999,999') || '원'
    from buy b left join price p on p.pid = b.pid where b.n > 0 group by coalesce(p.pname, b.pid)
  union all select 800, '⑧ 결제', '결제자', (select count(*) from payer)::text
  union all select 801, '⑧ 결제', '결제율 %', coalesce((select round(100.0 * count(*) / nullif((select count(*) from sv), 0), 2) from payer)::text, '0')
  union all select 802, '⑧ 결제', '총 예상 매출', coalesce(to_char((select sum(won) from payer), 'FM999,999,999'), '0') || '원'
  union all select 803, '⑧ 결제', '결제자 1인당', coalesce(to_char((select round(avg(won)) from payer), 'FM999,999,999'), '0') || '원'
  union all select 900, '⑨ 재화', '옥 평균', (select round(avg((data ->> 'jade')::numeric)) from sv where data ->> 'kind' is not null)::text
  union all select 901, '⑨ 재화', '옥 최대', (select max((data ->> 'jade')::numeric) from sv)::text
  union all select 902, '⑨ 재화', '소환권 평균', (select round(avg(coalesce((data ->> 'tickets')::numeric, 0)), 1) from sv where data ->> 'kind' is not null)::text
  union all select 1000, '⑩ 인기 영물', data ->> 'petEq', count(*)::text from sv where data ->> 'petEq' is not null group by data ->> 'petEq'
  union all select 1100, '⑪ 기기·버전 (최근 3일)', coalesce(os, '?') || ' ' || coalesce(ver, '?'), count(distinct dev)::text
    from public.stats where day > (select d from td) - 3 group by os, ver
  union all select 1300, '⑬ 이상 기록', '옥 5만 개 넘는 계정', (select count(*) from sv where (data ->> 'jade')::numeric > 50000)::text
  union all select 1301, '⑬ 이상 기록', '3시간 안에 판관 이상', (select count(*) from sv where (data ->> 'rank')::int >= 6 and coalesce((data ->> 'playSec')::numeric, 0) < 10800)::text
 )
select g as "구분", k as "항목", v as "값" from r order by o, k;
