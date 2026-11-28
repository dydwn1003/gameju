-- ===== 저장 조작 막기 (Supabase SQL Editor 에 통째로 붙여 넣고 Run · 여러 번 실행해도 안전) =====
-- 게임이 서버에 저장을 올릴 때마다, 지난 저장보다 옥이 '말이 안 되게' 늘었는지 서버가 검사한다.
--   허용량 = 기본 3,000 + 지난 저장 뒤 지난 시간 × 시간당 600 (최대 7일치)
--          + 그동안 서버가 확인한 결제의 옥 + 최근 30일 운영자 우편의 옥
--   허용량을 넘으면 → anticheat_log 에 기록 (운영자가 확인)
--   허용량보다 20,000 이상 많으면 → 저장을 막고 계정을 자동 정지 (메모리 조작 앱 등으로 옥을 바꾼 경우)
-- 운영자가 SQL Editor 에서 직접 고치는 저장(로그인 없음)은 검사하지 않음.
-- 먼저 security_update.sql (bans · iap_receipts) 과 refund_update.sql (dev 칸) 이 실행돼 있어야 함.

create table if not exists public.anticheat_log (
  id        bigserial primary key,
  user_id   uuid references auth.users (id) on delete cascade,
  at        timestamptz not null default now(),
  old_jade  numeric, new_jade numeric, allowed numeric,
  action    text,          -- flag(기록만) · ban(저장 막고 정지)
  note      text
);
alter table public.anticheat_log enable row level security;
revoke all on public.anticheat_log from anon, authenticated;

create or replace function public.check_save() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old numeric := 0; v_new numeric; v_since timestamptz; v_hours numeric := 0; v_paid numeric := 0; v_mail numeric := 0; v_allowed numeric; v_dev text;
begin
  if auth.uid() is null then return new; end if;                 -- 운영자(SQL Editor) 작업은 통과
  v_new := coalesce((new.data ->> 'jade')::numeric, 0);
  v_dev := new.data ->> 'devId';
  if tg_op = 'UPDATE' then
    v_old := coalesce((old.data ->> 'jade')::numeric, 0);
    v_since := old.updated_at;
    v_hours := least(extract(epoch from now() - old.updated_at) / 3600, 24 * 7);
  else
    v_since := now() - interval '30 days';
    v_hours := least(coalesce((new.data ->> 'playSec')::numeric, 0) / 3600, 24 * 7);   -- 처음 올리는 저장: 게스트로 플레이한 시간만큼
  end if;
  if v_new - v_old <= 3000 then return new; end if;              -- 대부분은 여기서 끝 (빠름)

  select coalesce(sum(case r.product when 'jade_100' then 100 when 'jade_550' then 550 when 'jade_1200' then 1200
                                      when 'starter_pack' then 200 when 'promo_pack' then 300 else 0 end), 0)
    into v_paid from iap_receipts r
   where (r.user_id = new.user_id or (r.user_id is null and v_dev is not null and r.dev = v_dev))
     and r.created_at > v_since - interval '1 hour';
  select coalesce(sum(coalesce((d.data ->> 'jade')::numeric, 0)), 0) into v_mail
    from docs d where d.col = 'mail' and d.updated_at > now() - interval '30 days';

  v_allowed := 3000 + v_hours * 600 + v_paid + v_mail;
  if v_new - v_old <= v_allowed then return new; end if;

  if v_new - v_old > v_allowed + 20000 then
    insert into anticheat_log (user_id, old_jade, new_jade, allowed, action, note)
      values (new.user_id, v_old, v_new, v_allowed, 'ban', tg_op);
    insert into bans (user_id, reason) values (new.user_id, '저장 데이터 조작 (비정상 재화)') on conflict (user_id) do nothing;
    delete from docs where col in ('rank', 'offices', 'visits') and doc_id = new.user_id::text;
    if tg_op = 'UPDATE' then return old; end if;                 -- 서버 저장은 예전 그대로 둠
    return null;                                                  -- 처음 저장이면 아예 올리지 않음
  end if;
  insert into anticheat_log (user_id, old_jade, new_jade, allowed, action, note)
    values (new.user_id, v_old, v_new, v_allowed, 'flag', tg_op);
  return new;
end $$;
drop trigger if exists saves_anticheat on public.saves;
create trigger saves_anticheat before insert or update of data on public.saves
  for each row execute function public.check_save();

-- 걸린 기록 보기 (최근 순)
create or replace view public.anticheat_list as
  select upper(left(replace(l.user_id::text, '-', ''), 8)) as code, s.data ->> 'name' as nick, l.action, l.old_jade, l.new_jade, l.allowed,
         l.at at time zone 'Asia/Seoul' as at_kst, l.note
  from anticheat_log l left join saves s on s.user_id = l.user_id order by l.at desc;
revoke all on public.anticheat_list from anon, authenticated;
--   select * from anticheat_list;

-- 이번 계정 정지 (스릴, 가입 7분 만에 옥 99,438 · 결제 0건)
select ban_user('6D806FB6', '저장 데이터 조작 (비정상 재화)');
