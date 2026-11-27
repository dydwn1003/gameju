-- ===== 환불 회수 + 게스트 패키지 재지급 막기 (Supabase SQL Editor 에 통째로 붙여 넣고 Run · 여러 번 실행해도 안전) =====
-- 먼저 security_update.sql 이 실행돼 있어야 해요 (iap_receipts 표).

-- 1) 결제 기록에 설치 번호(dev) 추가: 같은 설치에서 다시 묻는 것(응답 유실)과
--    앱을 지웠다 다시 깔고 '구매 복원'하는 것을 구분해서, 한 번만 사는 패키지 내용물을 두 번 주지 않음
alter table public.iap_receipts add column if not exists dev text;

-- 2) 환불된 결제 목록 (verify-purchase 함수가 구글 · 애플에서 확인해서 채움)
create table if not exists public.iap_refunds (
  store       text not null,
  tx_id       text not null,
  product     text not null,
  user_id     uuid references auth.users (id) on delete set null,
  dev         text,
  refunded_at timestamptz,
  applied_at  timestamptz,            -- 게임이 회수를 마친 시각 (비어 있으면 아직)
  created_at  timestamptz not null default now(),
  primary key (store, tx_id)
);
alter table public.iap_refunds enable row level security;
revoke all on public.iap_refunds from anon, authenticated;

-- 3) 게임이 "내 환불"을 받아 가는 함수 (로그인: 계정 기준 · 게스트: 설치 번호 기준)
create or replace function public.my_refunds(p_dev text default null) returns table (store text, tx_id text, product text)
language sql stable security definer set search_path = public as $$
  select r.store, r.tx_id, r.product from public.iap_refunds r
  where r.applied_at is null
    and ((auth.uid() is not null and r.user_id = auth.uid()) or (r.user_id is null and p_dev is not null and r.dev = p_dev));
$$;
grant execute on function public.my_refunds(text) to anon, authenticated;

-- 4) 회수를 마쳤다고 표시
create or replace function public.ack_refunds(p_dev text, p_ids text[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.iap_refunds r set applied_at = now()
   where r.applied_at is null and r.tx_id = any(p_ids)
     and ((auth.uid() is not null and r.user_id = auth.uid()) or (r.user_id is null and p_dev is not null and r.dev = p_dev));
  get diagnostics n = row_count; return n;
end $$;
grant execute on function public.ack_refunds(text, text[]) to anon, authenticated;

-- 환불 목록 보기:  select * from iap_refunds order by created_at desc;

-- 5) 구글 환불 목록을 하루 한 번 자동으로 가져오기 (대시보드 Database → Extensions 에서 pg_cron · pg_net 켜고 실행)
--    아래 <프로젝트주소> 를 config.js 의 url 처럼 https://xxxx.supabase.co 로 바꿔서 실행
-- select cron.schedule('reaper-refunds', '17 3 * * *', $$
--   select net.http_post(url := '<프로젝트주소>/functions/v1/verify-purchase',
--                        headers := '{"Content-Type":"application/json"}'::jsonb,
--                        body := '{"refundCheck":true}'::jsonb);
-- $$);
-- 지금 한 번 바로 돌려 보기:
-- select net.http_post(url := '<프로젝트주소>/functions/v1/verify-purchase', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{"refundCheck":true}'::jsonb);

-- 6) 반복 환불 자동 정지: 같은 계정의 환불이 2건이 되면 bans 에 올림 (게임은 정지 화면을 띄움)
--    풀어 주기: select unban_user('회원 코드');  (결제 금액을 다시 받은 뒤 등)
create or replace function public.refund_autoban() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and (select count(*) from public.iap_refunds where user_id = new.user_id) >= 2 then
    insert into public.bans (user_id, reason) values (new.user_id, '사용한 유료 상품을 반복해서 환불받음')
      on conflict (user_id) do nothing;
    delete from public.docs where col in ('rank', 'offices', 'visits') and doc_id = new.user_id::text;
  end if;
  return new;
end $$;
drop trigger if exists iap_refunds_autoban on public.iap_refunds;
create trigger iap_refunds_autoban after insert on public.iap_refunds for each row execute function public.refund_autoban();
