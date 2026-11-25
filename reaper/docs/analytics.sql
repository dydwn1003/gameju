-- ============================================================
--  저승사자 키우기 · 운영 데이터 보기 (Supabase SQL Editor 에서 블록 하나씩 실행)
--  · 운영자 계정은 모두 빠짐 · 시간은 한국 시간 · 금액은 스토어 수수료 빼기 전 판매가
-- ============================================================

-- ① 한눈에 요약 (오늘 기준)
with adm as (select user_id from public.admins),
 sv as (select * from public.saves where user_id not in (select user_id from adm)),
 today as (select (now() at time zone 'Asia/Seoul')::date d)
select
  (select count(*) from auth.users where id not in (select user_id from adm))                      as 가입_계정,
  (select count(*) from sv)                                                                         as 저장_기록_있는_계정,
  (select count(distinct dev) from public.stats)                                                    as 누적_기기,
  (select count(*) from public.stats, today where day = today.d)                                    as 오늘_DAU,
  (select count(*) from public.stats s, today where s.day = today.d and s.first_day = today.d)      as 오늘_신규,
  (select count(distinct dev) from public.stats, today where day > today.d - 7)                     as 최근7일_WAU,
  (select round(avg(sec) / 60.0, 1) from public.stats, today where day = today.d)                   as 오늘_평균_플레이_분,
  (select count(*) from sv where updated_at > now() - interval '1 day')                             as 하루안에_저장한_계정,
  (select count(*) from sv where coalesce((data ->> 'reborn')::int, 0) > 0)                         as 윤회한_계정,
  (select count(*) from sv where (data -> 'bought') is not null and data -> 'bought' <> '{}'::jsonb) as 결제한_계정,
  (select count(*) from public.inquiries where reply is null)                                       as 답변_안한_문의;

-- ② 날짜별 추이 (최근 14일): DAU · 신규 · 평균 플레이 시간 · 기기 · 로그인 비율
select * from public.stats_daily limit 14;

-- ③ 재접속률 (D1 · D3 · D7 · D14 · D30, %)
select * from public.stats_retention limit 21;

-- ④ 계급 분포: 지금 어느 계급에 몰려 있나 (윤회 안 한 계정 기준 · 이탈 지점 찾기)
with adm as (select user_id from public.admins)
select coalesce((data ->> 'rank')::int, 0) as 계급,
       (array['수습 차사','말단 차사','차사','선임 차사','차사장','판관','명부 판관','시왕','염라대왕'])[coalesce((data ->> 'rank')::int, 0) + 1] as 이름,
       count(*) as 인원,
       count(*) filter (where updated_at < now() - interval '7 days') as 일주일_넘게_안옴,
       round(100.0 * count(*) filter (where updated_at < now() - interval '7 days') / count(*), 1) as 이탈_비율
from public.saves where user_id not in (select user_id from adm) and coalesce((data ->> 'reborn')::int, 0) = 0
group by 1 order by 1;

-- ⑤ 윤회 분포
with adm as (select user_id from public.admins)
select coalesce((data ->> 'reborn')::int, 0) as 환, count(*) as 인원,
       round(avg(coalesce((data ->> 'rbStone')::int, 0)), 1) as 평균_보유_윤회석
from public.saves where user_id not in (select user_id from adm)
group by 1 order by 1;

-- ⑥ 튜토리얼 · 닉네임 · 로그인: 처음 들어와서 어디까지 했나
with adm as (select user_id from public.admins),
 sv as (select data from public.saves where user_id not in (select user_id from adm))
select count(*) as 전체,
       count(*) filter (where data ->> 'kind' is not null)  as 캐릭터_만듦,
       count(*) filter (where data ->> 'tut' = 'done')      as 튜토리얼_끝,
       count(*) filter (where (data ->> 'nickSet')::boolean) as 닉네임_정함,
       count(*) filter (where data ->> 'otut' = 'done')     as 집무실_안내_끝,
       round(100.0 * count(*) filter (where data ->> 'tut' = 'done') / nullif(count(*), 0), 1) as 튜토리얼_완료율
from sv;

-- ⑦ 결제: 상품별 구매 수와 예상 매출 (판매가 기준)
with adm as (select user_id from public.admins),
 price(id, 이름, 원) as (values ('jade100','옥 100개',1200),('jade550','옥 550개',5900),('jade1200','옥 1,200개',12000),
   ('starter','신입 차사 패키지',1200),('promo','승진 응원 패키지',3300),('perm2','염라의 인장',9900),('noads','광고 제거',6900)),
 b as (select s.user_id, k.key as id, k.value::int as n from public.saves s, jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) k
       where s.user_id not in (select user_id from adm))
select coalesce(p.이름, b.id) as 상품, count(distinct b.user_id) as 산_사람, sum(b.n) as 판매_수, sum(b.n * coalesce(p.원, 0)) as 예상_매출
from b left join price p on p.id = b.id
group by 1 order by 예상_매출 desc nulls last;

-- ⑧ 결제 요약: 결제자 수 · 결제율 · 1인당 결제액(ARPPU)
with adm as (select user_id from public.admins),
 price(id, 원) as (values ('jade100',1200),('jade550',5900),('jade1200',12000),('starter',1200),('promo',3300),('perm2',9900),('noads',6900)),
 b as (select s.user_id, sum(k.value::int * coalesce(p.원, 0)) as 원 from public.saves s
       cross join jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) k left join price p on p.id = k.key
       where s.user_id not in (select user_id from adm) group by s.user_id having sum(k.value::int) > 0)
select (select count(*) from public.saves where user_id not in (select user_id from adm)) as 전체_계정,
       count(*) as 결제자, round(100.0 * count(*) / nullif((select count(*) from public.saves where user_id not in (select user_id from adm)), 0), 2) as 결제율,
       sum(원) as 총_매출, round(avg(원)) as 결제자_1인당
from b;

-- ⑨ 재화 현황: 옥 · 소환권이 너무 쌓이거나 모자라지 않은지 (중간값 · 상위 10%)
with adm as (select user_id from public.admins),
 sv as (select data from public.saves where user_id not in (select user_id from adm) and data ->> 'kind' is not null)
select round(avg((data ->> 'jade')::numeric)) as 옥_평균,
       percentile_cont(0.5) within group (order by (data ->> 'jade')::numeric) as 옥_중간값,
       percentile_cont(0.9) within group (order by (data ->> 'jade')::numeric) as 옥_상위10퍼,
       round(avg(coalesce((data ->> 'tickets')::numeric, 0)), 1) as 소환권_평균,
       max((data ->> 'jade')::numeric) as 옥_최대
from sv;

-- ⑩ 영물: 많이 데리고 다니는 영물 TOP 15 · 등급별 보유
with adm as (select user_id from public.admins)
select data ->> 'petEq' as 장착_영물, count(*) as 인원
from public.saves where user_id not in (select user_id from adm) and data ->> 'petEq' is not null
group by 1 order by 2 desc limit 15;

-- ⑪ 기기 · 버전 · 언어 (최근 3일 접속 기준): 강제 업데이트 뒤 새 버전으로 넘어왔는지 보기
select os, ver as 버전, lang as 언어, count(distinct dev) as 기기
from public.stats where day > (now() at time zone 'Asia/Seoul')::date - 3
group by 1, 2, 3 order by 4 desc;

-- ⑫ 오래 한 사람 TOP 20 (실제 켜 둔 시간)
with adm as (select user_id from public.admins)
select data ->> 'name' as 닉네임, round(coalesce((data ->> 'playSec')::numeric, 0) / 3600, 1) as 플레이_시간,
       (data ->> 'rank')::int as 계급, coalesce((data ->> 'reborn')::int, 0) as 환,
       updated_at at time zone 'Asia/Seoul' as 마지막_저장
from public.saves where user_id not in (select user_id from adm)
order by coalesce((data ->> 'playSec')::numeric, 0) desc limit 20;

-- ⑬ 이상한 기록 의심 (조작 · 오류 확인용)
--   옥이 비정상적으로 많음 / 플레이 시간에 비해 계급이 너무 높음 / 최근 영물·기록이 크게 줄어든 이벤트
with adm as (select user_id from public.admins)
select data ->> 'name' as 닉네임, upper(left(replace(user_id::text, '-', ''), 8)) as 회원코드,
       (data ->> 'jade')::numeric as 옥, (data ->> 'rank')::int as 계급, coalesce((data ->> 'reborn')::int, 0) as 환,
       round(coalesce((data ->> 'playSec')::numeric, 0) / 3600, 1) as 플레이_시간,
       case when (data ->> 'jade')::numeric > 50000 then '옥 과다'
            when (data ->> 'rank')::int >= 6 and coalesce((data ->> 'playSec')::numeric, 0) < 3 * 3600 then '너무 빠른 승진' end as 사유
from public.saves where user_id not in (select user_id from adm)
  and ((data ->> 'jade')::numeric > 50000 or ((data ->> 'rank')::int >= 6 and coalesce((data ->> 'playSec')::numeric, 0) < 3 * 3600))
order by 3 desc;

select e.at at time zone 'Asia/Seoul' as 시각, s.data ->> 'name' as 닉네임, e.kind as 종류, e.detail as 내용
from public.save_events e left join public.saves s using (user_id)
where e.at > now() - interval '7 days' order by e.at desc limit 50;
