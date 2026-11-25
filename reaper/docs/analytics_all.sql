-- 저승사자 키우기 · 운영 데이터 한 번에 보기 (전체 붙여 넣고 Run 한 번)
-- 결과: 구분 · 항목 · 값 세 칸짜리 표 하나 · 운영자 계정 제외 · 한국 시간 · 매출은 판매가 기준(수수료 전)
with adm as (select user_id from public.admins),
 sv as (select * from public.saves where user_id not in (select user_id from adm)),
 today as (select (now() at time zone 'Asia/Seoul')::date d),
 price(id, 이름, 원) as (values ('jade100','옥 100개',1200),('jade550','옥 550개',5900),('jade1200','옥 1,200개',12000),
   ('starter','신입 차사 패키지',1200),('promo','승진 응원 패키지',3300),('perm2','염라의 인장',9900),('noads','광고 제거',6900)),
 buy as (select s.user_id, k.key as id, k.value::int as n from sv s, jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) k),
 payer as (select b.user_id, sum(b.n * coalesce(p.원, 0)) as 원 from buy b left join price p on p.id = b.id group by b.user_id having sum(b.n) > 0),
 f as (select dev, min(first_day) as fd from public.stats group by dev),
 ret as (select s.dev, f.fd, s.day - f.fd as n from public.stats s join f using (dev)),
 rows(정렬, 구분, 항목, 값) as (
  -- ① 요약
  select 100, '① 요약', '가입 계정', (select count(*) from auth.users where id not in (select user_id from adm))::text
  union all select 101, '① 요약', '저장 기록 있는 계정', (select count(*) from sv)::text
  union all select 102, '① 요약', '누적 기기', (select count(distinct dev) from public.stats)::text
  union all select 103, '① 요약', '오늘 DAU', (select count(*) from public.stats, today where day = today.d)::text
  union all select 104, '① 요약', '오늘 신규', (select count(*) from public.stats s, today where s.day = today.d and s.first_day = today.d)::text
  union all select 105, '① 요약', '최근 7일 WAU', (select count(distinct dev) from public.stats, today where day > today.d - 7)::text
  union all select 106, '① 요약', '오늘 평균 플레이(분)', (select coalesce(round(avg(sec) / 60.0, 1), 0) from public.stats, today where day = today.d)::text
  union all select 107, '① 요약', '하루 안에 저장한 계정', (select count(*) from sv where updated_at > now() - interval '1 day')::text
  union all select 108, '① 요약', '답변 안 한 문의', (select count(*) from public.inquiries where reply is null)::text
  -- ② 최근 7일 DAU · 신규
  union all select 200 + (today.d - day), '② 날짜별 (DAU / 신규 / 평균분)', to_char(day, 'MM-DD'),
         count(*) || ' / ' || count(*) filter (where first_day = day) || ' / ' || round(avg(sec) / 60.0, 1)
    from public.stats, today where day > today.d - 7 group by day, today.d
  -- ③ 재접속률
  union all select 300, '③ 재접속률', 'D1 (어제 시작한 사람 중 오늘 온 %)',
         coalesce((select round(100.0 * count(distinct dev) filter (where n = 1) / nullif(count(distinct dev) filter (where n = 0), 0), 1) from ret, today where fd <= today.d - 1 and fd > today.d - 15)::text, '-')
  union all select 301, '③ 재접속률', 'D7 (최근 2~3주 시작 기준 %)',
         coalesce((select round(100.0 * count(distinct dev) filter (where n = 7) / nullif(count(distinct dev) filter (where n = 0), 0), 1) from ret, today where fd <= today.d - 7 and fd > today.d - 21)::text, '-')
  -- ④ 계급 분포 (윤회 전) · 일주일 넘게 안 온 비율
  union all select 400 + coalesce((data ->> 'rank')::int, 0), '④ 계급 (인원 / 일주일 이탈%)',
         (array['수습 차사','말단 차사','차사','선임 차사','차사장','판관','명부 판관','시왕','염라대왕'])[coalesce((data ->> 'rank')::int, 0) + 1],
         count(*) || ' / ' || round(100.0 * count(*) filter (where updated_at < now() - interval '7 days') / count(*), 1) || '%'
    from sv where coalesce((data ->> 'reborn')::int, 0) = 0 group by coalesce((data ->> 'rank')::int, 0)
  -- ⑤ 윤회
  union all select 500 + coalesce((data ->> 'reborn')::int, 0), '⑤ 윤회 (인원)', coalesce((data ->> 'reborn')::int, 0) || '환', count(*)::text
    from sv where coalesce((data ->> 'reborn')::int, 0) > 0 group by coalesce((data ->> 'reborn')::int, 0)
  -- ⑥ 처음 흐름
  union all select 600, '⑥ 처음 흐름', '캐릭터 만듦', (select count(*) from sv where data ->> 'kind' is not null)::text
  union all select 601, '⑥ 처음 흐름', '튜토리얼 끝', (select count(*) from sv where data ->> 'tut' = 'done')::text
  union all select 602, '⑥ 처음 흐름', '닉네임 정함', (select count(*) from sv where (data ->> 'nickSet')::boolean)::text
  union all select 603, '⑥ 처음 흐름', '집무실 안내 끝', (select count(*) from sv where data ->> 'otut' = 'done')::text
  -- ⑦ 상품별 매출
  union all select 700, '⑦ 상품 (산 사람 / 판매 / 예상 매출)', coalesce(p.이름, b.id),
         count(distinct b.user_id) || ' / ' || sum(b.n) || ' / ' || to_char(sum(b.n * coalesce(p.원, 0)), 'FM999,999,999') || '원'
    from buy b left join price p on p.id = b.id where b.n > 0 group by coalesce(p.이름, b.id)
  -- ⑧ 결제 요약
  union all select 800, '⑧ 결제', '결제자', (select count(*) from payer)::text
  union all select 801, '⑧ 결제', '결제율', coalesce((select round(100.0 * count(*) / nullif((select count(*) from sv), 0), 2) from payer)::text, '0') || '%'
  union all select 802, '⑧ 결제', '총 예상 매출', coalesce(to_char((select sum(원) from payer), 'FM999,999,999'), '0') || '원'
  union all select 803, '⑧ 결제', '결제자 1인당', coalesce(to_char((select round(avg(원)) from payer), 'FM999,999,999'), '0') || '원'
  -- ⑨ 재화
  union all select 900, '⑨ 재화', '옥 평균 / 중간값 / 최대',
         (select round(avg((data ->> 'jade')::numeric)) || ' / ' || percentile_cont(0.5) within group (order by (data ->> 'jade')::numeric) || ' / ' || max((data ->> 'jade')::numeric) from sv where data ->> 'kind' is not null)
  union all select 901, '⑨ 재화', '소환권 평균', (select round(avg(coalesce((data ->> 'tickets')::numeric, 0)), 1) from sv where data ->> 'kind' is not null)::text
  -- ⑩ 인기 영물 TOP 5
  union all select * from (select 1000, '⑩ 인기 영물 (장착 인원)', data ->> 'petEq', count(*)::text from sv where data ->> 'petEq' is not null group by data ->> 'petEq' order by count(*) desc limit 5) t
  -- ⑪ 기기 · 버전 (최근 3일)
  union all select 1100, '⑪ 기기·버전 (최근 3일 기기 수)', coalesce(os, '?') || ' ' || coalesce(ver, '?'), count(distinct dev)::text
    from public.stats, today where day > today.d - 3 group by os, ver
  -- ⑬ 이상 기록
  union all select 1300, '⑬ 이상 기록', '옥 5만 개 넘는 계정', (select count(*) from sv where (data ->> 'jade')::numeric > 50000)::text
  union all select 1301, '⑬ 이상 기록', '3시간 안에 판관 이상', (select count(*) from sv where (data ->> 'rank')::int >= 6 and coalesce((data ->> 'playSec')::numeric, 0) < 3 * 3600)::text
  union all select 1302, '⑬ 이상 기록', '최근 7일 영물·기록 감소 이벤트', (select count(*) from public.save_events where at > now() - interval '7 days')::text
 )
select 구분, 항목, 값 from rows order by 정렬, 항목;
