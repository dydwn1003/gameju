-- ===== 저장 조작 막기 (Supabase SQL Editor 에 통째로 붙여 넣고 Run · 여러 번 실행해도 안전) =====
-- 게임이 서버에 저장을 올릴 때마다, 지난 저장과 비교해서 '말이 안 되게' 바뀐 게 있는지 서버가 검사한다.
--   정지(저장 막음): 옥 · 소환권 · 윤회석이 허용량을 크게 넘게 늘었을 때
--   기록만(운영자 확인): 위 재화가 허용량을 조금 넘음 · 계급 3단계 이상 급상승 · 윤회 2번 이상 ·
--                       결제 기록 없이 염라의 인장 · 광고 제거 · 특제 의자를 얻음
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

alter table public.anticheat_log add column if not exists kind text;   -- 무엇이 이상했는지 (jade · tickets · stones · rank · reborn · seal · noads · cash)

create or replace function public.check_save() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when tg_op = 'UPDATE' then old.data else '{}'::jsonb end; n jsonb := new.data;
  v_since timestamptz; v_hours numeric; v_dev text := new.data ->> 'devId';
  v_paid numeric := 0; v_mail_jade numeric := 0; v_mail_tk numeric := 0; v_seal_paid int := 0; v_noads_paid int := 0; v_cash_paid int := 0;
  d numeric; lim numeric; v_ban text := null; v_flags text[] := '{}';
  num constant text := '^-?[0-9.]+(e[+-]?[0-9]+)?$';
begin
  if auth.uid() is null then return new; end if;                 -- 운영자(SQL Editor) 작업은 통과
  if exists (select 1 from admins a where a.user_id = new.user_id) then return new; end if;   -- 운영자 계정(admins)은 시험용이라 검사 안 함
  -- 게임은 upsert 로 저장하는데, 이때 '새로 넣기' 검사가 먼저 한 번 돌아요. 이미 저장이 있으면 여기선 통과시키고
  -- 바로 이어서 도는 '고치기(UPDATE)' 검사에서 지난 저장과 비교해요. (안 그러면 가진 재화 전체를 '새로 늘어난 것'으로 봄)
  if tg_op = 'INSERT' and exists (select 1 from saves x where x.user_id = new.user_id) then return new; end if;
  -- 재화를 쓰는 것(줄어드는 것)은 절대 막지 않고, 늘어난 양만 검사해요.
  if tg_op = 'UPDATE' then v_since := old.updated_at; v_hours := least(extract(epoch from now() - old.updated_at) / 3600, 24);
  else v_since := now() - interval '30 days'; v_hours := least(coalesce((n ->> 'playSec')::numeric, 0) / 3600, 24); end if;

  -- 최근 서버가 확인한 결제 · 최근 운영자 우편 (결제로 산 옥은 몇 번을 사든 전부 허용)
  select coalesce(sum(case r.product when 'jade_100' then 100 when 'jade_550' then 550 when 'jade_1200' then 1200 when 'starter_pack' then 200 when 'promo_pack' then 300 else 0 end), 0),
         count(*) filter (where r.product = 'yeomra_seal_7d'), count(*) filter (where r.product = 'remove_ads'),
         count(*) filter (where r.product not in ('jade_100','jade_550','jade_1200','starter_pack','promo_pack','yeomra_seal_7d','remove_ads'))
    into v_paid, v_seal_paid, v_noads_paid, v_cash_paid
    from iap_receipts r
   where (r.user_id = new.user_id or (r.user_id is null and v_dev is not null and r.dev = v_dev))
     and (r.created_at > v_since - interval '1 hour' or r.product = 'remove_ads');   -- 지난 저장 이후의 결제 (몇 번을 사든 전부 허용 · 같은 결제를 두 번 세지 않음)
  select coalesce(sum(coalesce((x.data ->> 'jade')::numeric, 0)), 0), coalesce(sum(coalesce((x.data ->> 'tickets')::numeric, 0)), 0)
    into v_mail_jade, v_mail_tk from docs x where x.col = 'mail' and x.updated_at > now() - interval '30 days';

  -- ① 옥: 정상 플레이로는 한 번에 많아야 1,000개 → 1,000 + 시간당 200(최대 24시간) + 결제 + 우편
  --    + 예전에 삭제된 소품(옥좌 1,500 · 용상 1,100)을 옥으로 돌려받는 경우. 허용량을 2,000 넘게 초과하면 정지, 조금 넘으면 기록
  d := coalesce((n ->> 'jade')::numeric, 0) - coalesce((o ->> 'jade')::numeric, 0);
  lim := 1000 + v_hours * 200 + v_paid + v_mail_jade
       -- 처음 저장(게스트로 하다가 로그인 등): 게임을 시작한 뒤 지난 날수 × 1,000 (출시일 이후로만 셈)
       + case when tg_op = 'INSERT' then 1000 * least(
           greatest(extract(epoch from now()) - coalesce(case when (n ->> 'created') ~ num then (n ->> 'created')::numeric end, extract(epoch from now()) * 1000) / 1000, 0) / 86400,
           extract(epoch from now() - timestamptz '2026-10-20 00:00+09') / 86400) else 0 end
       + case when (o -> 'decor' -> 'own' ->> 'throne') ~ num and (n -> 'decor' -> 'own' ->> 'throne') is null then 1500 * (o -> 'decor' -> 'own' ->> 'throne')::numeric else 0 end
       + case when (o -> 'decor' -> 'own' ->> 'yongsang') ~ num and (n -> 'decor' -> 'own' ->> 'yongsang') is null then 1100 * (o -> 'decor' -> 'own' ->> 'yongsang')::numeric else 0 end;
  if d > lim + 2000 then v_ban := 'jade'; elsif d > lim then v_flags := array_append(v_flags, 'jade'); end if;
  -- 조금씩 나눠 올리기: 하루에 옥 '기록'이 3번 쌓이면 정지
  if v_ban is null and d > lim and (select count(*) from anticheat_log l where l.user_id = new.user_id and l.action = 'flag' and l.kind like '%jade%' and l.at > now() - interval '24 hours') >= 2 then v_ban := 'jade'; end if;

  -- ② 소환권: 20 + 시간당 3 + 우편 · 300장 넘게 초과하면 정지
  d := coalesce((n ->> 'tickets')::numeric, 0) - coalesce((o ->> 'tickets')::numeric, 0);
  lim := 20 + v_hours * 3 + v_mail_tk;
  if d > lim + 300 then v_ban := coalesce(v_ban, 'tickets'); elsif d > lim then v_flags := array_append(v_flags, 'tickets'); end if;

  -- ③ 윤회석: 한 번에 20개 넘게 늘면 기록 · 60개 넘으면 정지 (윤회 1번 최대 6개 + 주간 교환 2개)
  --    특성 초기화(옥 300)는 특성에 쓴 돌(Lv.L 까지 L×(L+1)개)을 돌려주므로, '가진 돌 + 특성에 쓴 돌' 합계로 비교
  d := (coalesce((n ->> 'rbStone')::numeric, 0) + (select coalesce(sum(case when value ~ num then value::numeric * (value::numeric + 1) else 0 end), 0) from jsonb_each_text(case when jsonb_typeof(n -> 'rbPerk') = 'object' then n -> 'rbPerk' else '{}'::jsonb end)))
     - (coalesce((o ->> 'rbStone')::numeric, 0) + (select coalesce(sum(case when value ~ num then value::numeric * (value::numeric + 1) else 0 end), 0) from jsonb_each_text(case when jsonb_typeof(o -> 'rbPerk') = 'object' then o -> 'rbPerk' else '{}'::jsonb end)));
  if tg_op = 'INSERT' then   -- 처음 저장(새 기기 등): 지금까지 윤회로 받을 수 있는 돌(2+3+4+…) + 주간 교환 몫을 빼고 비교
    lim := coalesce((n ->> 'reborn')::numeric, 0); d := d - (2 * lim + lim * (lim - 1) / 2) - 40; end if;
  if d > 60 then v_ban := coalesce(v_ban, 'stones'); elsif d > 20 then v_flags := array_append(v_flags, 'stones'); end if;

  -- ④ 계급 · 윤회: 한 번 저장에 계급 3단계 이상 · 윤회 2번 이상 오르면 기록
  if coalesce((n ->> 'rank')::int, 0) - coalesce((o ->> 'rank')::int, 0) >= 3 and tg_op = 'UPDATE' then v_flags := array_append(v_flags, 'rank'); end if;
  if coalesce((n ->> 'reborn')::int, 0) - coalesce((o ->> 'reborn')::int, 0) >= 2 and tg_op = 'UPDATE' then v_flags := array_append(v_flags, 'reborn'); end if;

  -- ⑤ 결제로만 얻는 것: 염라의 인장 · 광고 제거 · 특제 의자를 결제 기록 없이 얻었으면 기록
  if coalesce((n ->> 'sealUntil')::numeric, 0) > coalesce((o ->> 'sealUntil')::numeric, 0) + 86400000
     and coalesce((n ->> 'sealUntil')::numeric, 0) > extract(epoch from now()) * 1000 + 86400000 and v_seal_paid = 0 then v_flags := array_append(v_flags, 'seal'); end if;
  if coalesce((n ->> 'noAds')::boolean, false) and not coalesce((o ->> 'noAds')::boolean, false) and v_noads_paid = 0 then v_flags := array_append(v_flags, 'noads'); end if;
  if (select coalesce(sum(coalesce((value)::text::numeric, 0)), 0) from jsonb_each(coalesce(n -> 'decor' -> 'own', '{}')) where key like 'cc%')
   > (select coalesce(sum(coalesce((value)::text::numeric, 0)), 0) from jsonb_each(coalesce(o -> 'decor' -> 'own', '{}')) where key like 'cc%') and v_cash_paid = 0 then v_flags := array_append(v_flags, 'cash'); end if;

  if v_ban is not null then
    insert into anticheat_log (user_id, old_jade, new_jade, allowed, action, kind, note)
      values (new.user_id, (o ->> 'jade')::numeric, (n ->> 'jade')::numeric, null, 'ban', v_ban, tg_op);
    insert into bans (user_id, reason) values (new.user_id, '저장 데이터 조작 (비정상 재화)') on conflict (user_id) do nothing;
    delete from docs where col in ('rank', 'offices', 'visits') and doc_id = new.user_id::text;
    if tg_op = 'UPDATE' then return old; end if;                 -- 서버 저장은 예전 그대로
    return null;                                                  -- 처음 저장이면 아예 올리지 않음
  end if;
  if array_length(v_flags, 1) > 0 then
    insert into anticheat_log (user_id, old_jade, new_jade, allowed, action, kind, note)
      values (new.user_id, (o ->> 'jade')::numeric, (n ->> 'jade')::numeric, null, 'flag', array_to_string(v_flags, ','), tg_op);
  end if;
  return new;
end $$;
drop trigger if exists saves_anticheat on public.saves;
create trigger saves_anticheat before insert or update of data on public.saves
  for each row execute function public.check_save();

-- 걸린 기록 보기 (최근 순)
drop view if exists public.anticheat_list;
create view public.anticheat_list as
  select upper(left(replace(l.user_id::text, '-', ''), 8)) as code, s.data ->> 'name' as nick, l.action, l.kind, l.old_jade, l.new_jade,
         l.at at time zone 'Asia/Seoul' as at_kst, l.note
  from anticheat_log l left join saves s on s.user_id = l.user_id order by l.at desc;
revoke all on public.anticheat_list from anon, authenticated;
--   select * from anticheat_list;

-- 이번 계정 정지 (스릴, 가입 7분 만에 옥 99,438 · 결제 0건)
select ban_user('6D806FB6', '저장 데이터 조작 (비정상 재화)');
