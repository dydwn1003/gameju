-- 영물 우편 업데이트 (send_mail 에 p_pet · p_pet_n 추가, 운영자 닉네임도 찾기) — Supabase SQL Editor 에 통째로 붙여넣고 Run
drop function if exists public.send_mail(text, text, integer, integer, numeric, integer, text, text, text[]);
drop function if exists public.send_mail(text, text, integer, integer, numeric, integer, text, text, text[], bigint);
create or replace function public.send_mail(
  p_title   text,
  p_to      text    default 'all',
  p_jade    integer default 0,
  p_tickets integer default 0,
  p_hours   numeric default 0,
  p_days    integer default 7,
  p_body    text    default '',
  p_decor   text    default '',
  p_nicks   text[]  default null,
  p_souls   bigint  default 0,
  p_pet     text    default '',   -- 영물 id (docs/MAIL_SQL.md 목록)
  p_pet_n   integer default 1     -- 영물 마리 수 (1~10, 이미 있으면 여분으로)
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_at bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_id text := 'm' || v_at;
  v_uids jsonb;
  v_missing text[];
begin
  if p_to not in ('all', 'old', 'new', 'online', 'user') then
    raise exception '받는 사람(p_to)은 all / old / new / online / user 중 하나예요';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception '제목(p_title)을 넣어 주세요'; end if;
  if coalesce(p_jade, 0) <= 0 and coalesce(p_tickets, 0) <= 0 and coalesce(p_hours, 0) <= 0 and coalesce(p_souls, 0) <= 0 and coalesce(p_decor, '') = '' and coalesce(p_pet, '') = '' then
    raise exception '보상(p_jade · p_tickets · p_souls · p_hours · p_decor · p_pet)을 하나 이상 넣어 주세요';
  end if;
  if coalesce(p_pet, '') <> '' and not (trim(p_pet) = any (array['kkachi','daram','bandi','dukk','tokki','byeong','neoguri','sapsal','heukmyo','buheong','geobuk','haechi','yeowoo','hak','baekho','samjok','bulyeo','cheongryong','girin','bonghwang','hwangryong','chamsae','saengjwi','cheonggae','ori','bungeo','bakjwi','dwaeji','gosum','nabi','yeomso','sudal','kkamagwi','kkotsasum','baekgu','geumbung','haneul','chijeu','bandal','baeksa','eunyeowoo','horangi','geumdukk','bulgasari','hyeonmu','jujak','cheonma','imugi','gumiho','baektaek','heukryong','eungryong','geumsijo'])) then
    raise exception '영물 id(p_pet)를 찾지 못했어요: % — docs/MAIL_SQL.md 의 영물 목록을 봐 주세요', p_pet;
  end if;
  if p_to = 'user' then
    if coalesce(array_length(p_nicks, 1), 0) = 0 then raise exception '특정 플레이어는 p_nicks => array[''닉네임''] 으로 넣어 주세요'; end if;
    -- 랭킹 닉네임 + 저장 데이터 닉네임 둘 다에서 찾음 (운영자는 랭킹에서 빠져 있어서)
    select array_agg(n) into v_missing from unnest(p_nicks) n
      where not exists (select 1 from docs where col = 'rank' and data ->> 'nick' = n)
        and not exists (select 1 from saves where data ->> 'name' = n);
    if v_missing is not null then raise exception '닉네임을 찾지 못했어요: %', array_to_string(v_missing, ', '); end if;
    select jsonb_agg(distinct u) into v_uids from (
      select doc_id as u from docs where col = 'rank' and data ->> 'nick' = any (p_nicks)
      union select user_id::text from saves where data ->> 'name' = any (p_nicks)) x;
  end if;
  insert into docs (path, col, doc_id, owner, data) values ('mail/' || v_id, 'mail', v_id, null, jsonb_strip_nulls(jsonb_build_object(
    'at', v_at, 'title', trim(p_title), 'body', coalesce(p_body, ''),
    'jade', greatest(coalesce(p_jade, 0), 0), 'tickets', greatest(coalesce(p_tickets, 0), 0), 'hours', greatest(coalesce(p_hours, 0), 0), 'souls', greatest(coalesce(p_souls, 0), 0),
    'pet', nullif(trim(coalesce(p_pet, '')), ''), 'petN', case when coalesce(p_pet, '') <> '' then least(greatest(coalesce(p_pet_n, 1), 1), 10) end,
    'decor', coalesce(p_decor, ''), 'until', v_at + greatest(coalesce(p_days, 7), 1)::bigint * 86400000,
    'to', p_to, 'uids', v_uids, 'nicks', case when p_to = 'user' then to_jsonb(p_nicks) end)));
  return v_id;
end $$;
revoke all on function public.send_mail(text, text, integer, integer, numeric, integer, text, text, text[], bigint, text, integer) from public, anon, authenticated;

-- 보낸 우편 목록 (SQL Editor 에서 보기 좋게)
drop view if exists public.mail_list;
create view public.mail_list with (security_invoker = true) as
  select path, data ->> 'title' as title, coalesce(data ->> 'to', 'all') as "to", data -> 'nicks' as nicks,
         (data ->> 'jade')::int as jade, (data ->> 'tickets')::int as tickets, (data ->> 'hours')::numeric as hours, (data ->> 'souls')::bigint as souls, data ->> 'decor' as decor, data ->> 'pet' as pet, (data ->> 'petN')::int as pet_n,
         to_timestamp(at / 1000.0) at time zone 'Asia/Seoul' as sent_kst,
         to_timestamp((data ->> 'until')::bigint / 1000.0) at time zone 'Asia/Seoul' as until_kst
  from public.docs where col = 'mail' order by at desc;
revoke all on public.mail_list from anon, authenticated;
