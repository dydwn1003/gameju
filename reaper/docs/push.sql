-- ===== 원격 푸시 (Supabase SQL Editor 에 통째로 붙여 넣고 Run · 여러 번 실행해도 안전) =====
-- 1) 기기 푸시 주소(토큰) 표 · 저장 함수  2) 우편을 보내면 send-push 함수를 불러 폰에 알림
-- 먼저: Edge Function 'send-push' 배포 + Secrets(FCM_SERVICE_ACCOUNT 등), 대시보드 Database → Extensions 에서 pg_net 켜기

create table if not exists public.push_tokens (
  token      text primary key,
  dev        text,
  user_id    uuid references auth.users (id) on delete cascade,
  platform   text,             -- android · ios
  lang       text,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;     -- 정책 없음 = 앱에서 직접 못 읽고 못 씀 (아래 함수로만)
revoke all on public.push_tokens from anon, authenticated;

-- 게임이 켜질 때 자기 토큰을 올림 (로그인: 계정과 연결 · 게스트: 기기 번호만)
create or replace function public.save_push(p_token text, p_dev text, p_platform text, p_lang text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or length(p_token) < 20 or length(p_token) > 400 then return; end if;
  insert into push_tokens (token, dev, user_id, platform, lang, updated_at)
  values (p_token, left(p_dev, 64), auth.uid(), case when p_platform in ('android', 'ios') then p_platform else 'android' end, left(p_lang, 8), now())
  on conflict (token) do update set dev = excluded.dev, user_id = coalesce(excluded.user_id, push_tokens.user_id), platform = excluded.platform, lang = excluded.lang, updated_at = now();
end $$;
revoke all on function public.save_push(text, text, text, text) from public;
grant execute on function public.save_push(text, text, text, text) to anon, authenticated;

-- 트리거가 send-push 를 부를 때 쓰는 주소 · 비밀값 (앱에서는 못 읽음)
create table if not exists public.push_cfg (k text primary key, v text not null);
alter table public.push_cfg enable row level security;
revoke all on public.push_cfg from anon, authenticated;
insert into public.push_cfg (k, v) values ('hook', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (k) do nothing;
insert into public.push_cfg (k, v) values ('url', 'https://eurinhfamcdygqxepmdg.supabase.co/functions/v1/send-push') on conflict (k) do nothing;
insert into public.push_cfg (k, v) values ('mail_push', 'on') on conflict (k) do nothing;   -- 'off' 로 바꾸면 우편 알림 끄기

-- 우편이 새로 올라가면 → send-push 로 알림
create or replace function public.mail_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_hook text;
begin
  if new.col <> 'mail' or coalesce((select v from push_cfg where k = 'mail_push'), 'on') <> 'on' then return new; end if;
  select v into v_url from push_cfg where k = 'url'; select v into v_hook from push_cfg where k = 'hook';
  begin
    perform net.http_post(url := v_url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook', v_hook), body := jsonb_build_object('mail', new.doc_id));
  exception when others then null;   -- 알림이 실패해도 우편은 그대로 올라가게
  end;
  return new;
end $$;
drop trigger if exists docs_mail_push on public.docs;
create trigger docs_mail_push after insert on public.docs for each row execute function public.mail_push();

-- 보기:  select platform, count(*) from push_tokens group by platform
-- 우편 알림 끄기:  update push_cfg set v = 'off' where k = 'mail_push'
