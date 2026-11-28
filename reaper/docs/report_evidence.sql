-- ===== 신고 자료 모으기 (Supabase SQL Editor 에 통째로 붙여 넣고 Run) =====
-- 맨 아래 줄 '9A9D13D8' 자리에 회원 코드(8자리)를 넣으면 그 계정의 자료를 한 표로 보여 줌.
-- 결과 표 오른쪽 위 'Export → CSV' 로 받아서 신고서에 첨부하면 돼요. (이메일 등 개인정보가 들어 있으니 신고 외에는 쓰지 마세요)
-- 먼저 security_update.sql · save_history.sql · stats_setup.sql 이 실행돼 있어야 해요 (없는 표는 빈 칸으로 나옴).

with p as (select '9A9D13D8'::text as code),
u as (select a.* from auth.users a, p where upper(left(replace(a.id::text, '-', ''), 8)) = upper(p.code) limit 1),
s as (select sv.* from saves sv join u on u.id = sv.user_id),
dv as (select s.data ->> 'devId' as dev from s),
price(pid, won, pname) as (values ('jade100', 1200, '옥 100개'), ('jade550', 5900, '옥 550개'), ('jade1200', 12000, '옥 1,200개'), ('starter', 1200, '신입 차사 패키지'),
  ('promo', 3300, '승진 응원 패키지'), ('perm2', 9900, '염라의 인장 7일'), ('noads', 6900, '광고 제거'),
  ('decor:cc0', 1200, '특제 의자 0'), ('decor:cc1', 1900, '특제 의자 1'), ('decor:cc2', 2500, '특제 의자 2'), ('decor:cc3', 3300, '특제 의자 3'), ('decor:cc4', 3900, '특제 의자 4'),
  ('decor:cc5', 4900, '특제 의자 5'), ('decor:cc6', 5900, '특제 의자 6'), ('decor:cc7', 7900, '특제 의자 7'), ('decor:cc8', 9900, '특제 의자 8')),
buy as (select k.key as pid, case when k.value ~ '^[0-9]+$' then k.value::int else 0 end as n from s, jsonb_each_text(coalesce(s.data -> 'bought', '{}'::jsonb)) k),
rc as (select r.* from iap_receipts r where r.user_id = (select id from u) or (r.dev is not null and r.dev = (select dev from dv))),
r(o, g, k, v) as (
  select 100, '① 계정', '회원 코드', (select upper(left(replace(id::text, '-', ''), 8)) from u)
  union all select 101, '① 계정', '계정 ID', (select id::text from u)
  union all select 102, '① 계정', '이메일', (select email from u)
  union all select 103, '① 계정', '로그인 방식', (select coalesce(raw_app_meta_data ->> 'provider', '-') from u)
  union all select 104, '① 계정', '가입 시각', (select to_char(created_at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') || ' (KST)' from u)
  union all select 105, '① 계정', '마지막 로그인', (select to_char(last_sign_in_at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') || ' (KST)' from u)
  union all select 200, '② 정지', '정지 사유', (select reason from bans where user_id = (select id from u))
  union all select 201, '② 정지', '정지 시각', (select to_char(at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') || ' (KST)' from bans where user_id = (select id from u))
  union all select 300, '③ 게임 저장 데이터', '닉네임', (select data ->> 'name' from s)
  union all select 301, '③ 게임 저장 데이터', '계급 (0 수습 ~ 8 염라대왕)', (select data ->> 'rank' from s)
  union all select 302, '③ 게임 저장 데이터', '보유 옥', (select data ->> 'jade' from s)
  union all select 303, '③ 게임 저장 데이터', '보유 소환권', (select data ->> 'tickets' from s)
  union all select 304, '③ 게임 저장 데이터', '플레이 시간(분)', (select round(coalesce((data ->> 'playSec')::numeric, 0) / 60)::text from s)
  union all select 305, '③ 게임 저장 데이터', '게임 처음 시작', (select to_char(to_timestamp((data ->> 'created')::numeric / 1000) at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') || ' (KST)' from s where (data ->> 'created') ~ '^[0-9]+$')
  union all select 306, '③ 게임 저장 데이터', '마지막 저장', (select to_char(updated_at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') || ' (KST)' from s)
  union all select 307, '③ 게임 저장 데이터', '기기 번호 (앱이 만든 무작위 번호)', (select dev from dv)
  union all select 308, '③ 게임 저장 데이터', '광고 제거 상태', (select coalesce(data ->> 'noAds', 'false') from s)
  union all select 400, '④ 게임이 받은 유료 상품 (저장 데이터)', coalesce(pr.pname, b.pid), b.n || '개 · 판매가 합계 ' || to_char(b.n * coalesce(pr.won, 0), 'FM999,999,999') || '원'
    from buy b left join price pr on pr.pid = b.pid where b.n > 0
  union all select 450, '④ 게임이 받은 유료 상품 (저장 데이터)', '판매가 합계', to_char((select coalesce(sum(b.n * coalesce(pr.won, 0)), 0) from buy b left join price pr on pr.pid = b.pid), 'FM999,999,999') || '원'
  union all select 500, '⑤ 서버가 구글 · 애플에 확인한 실제 결제', '건수', (select count(*)::text from rc)
  union all select 501, '⑤ 서버가 구글 · 애플에 확인한 실제 결제', r2.product, r2.store || ' · ' || r2.tx_id || ' · ' || to_char(r2.created_at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI') from rc r2
  union all select 600, '⑥ 게임이 받은 결제 번호 (Play Console 주문 관리에서 조회 → 없으면 가짜)', '번호 개수', (select jsonb_array_length(coalesce(data -> 'txDone', '[]'::jsonb))::text from s)
  union all select 601, '⑥ 게임이 받은 결제 번호 (Play Console 주문 관리에서 조회 → 없으면 가짜)', '번호', x.v from s, jsonb_array_elements_text(coalesce(s.data -> 'txDone', '[]'::jsonb)) as x(v)
  union all select 700, '⑦ 날짜별 저장 기록 (하루 1장)', to_char(h.day, 'YYYY-MM-DD'), '계급 ' || coalesce(h.data ->> 'rank', '-') || ' · 옥 ' || coalesce(h.data ->> 'jade', '-') || ' · 유료 상품 ' || coalesce((h.data -> 'bought')::text, '{}')
    from save_history h where h.user_id = (select id from u)
  union all select 800, '⑧ 이상 기록', e.kind, to_char(e.at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI') || ' · ' || left(coalesce(e.detail::text, ''), 200) from save_events e where e.user_id = (select id from u)
  union all select 900, '⑨ 접속 기록 (기기 번호 기준)', to_char(t.day, 'YYYY-MM-DD'), coalesce(t.os, '?') || ' ' || coalesce(t.ver, '?') || ' · ' || round(t.sec / 60.0) || '분 · 로그인 ' || case when t.login then 'O' else 'X' end
    from stats t where t.dev = (select dev from dv)
  union all select 1000, '⑩ 1:1 문의', to_char(q.created_at at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI'), left(coalesce(q.body, ''), 200) from inquiries q where q.user_id = (select id from u)
)
select g as "구분", k as "항목", v as "내용" from r where v is not null order by o, k
