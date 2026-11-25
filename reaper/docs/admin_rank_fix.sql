-- 운영자가 순위에 올라가지 않게 (서버에서 막기) · Supabase SQL Editor 에서 한 번 실행
-- 1) 이미 올라간 운영자 순위 기록 지우기
delete from public.docs where col = 'rank' and doc_id in (select user_id::text from public.admins);

-- 2) 앞으로 운영자는 순위(rank) 기록을 쓸 수 없게
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (
  owner = auth.uid() and (
    (col in ('offices', 'visits') and doc_id = auth.uid()::text)
    or (col = 'rank' and doc_id = auth.uid()::text and not public.is_admin())
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using ((col in ('rank', 'offices', 'visits') and doc_id = auth.uid()::text) or (col in ('notices', 'mail', 'mod') and public.is_admin()))
  with check (owner = auth.uid() and (
    (col in ('offices', 'visits') and doc_id = auth.uid()::text)
    or (col = 'rank' and doc_id = auth.uid()::text and not public.is_admin())
    or (col in ('notices', 'mail', 'mod') and public.is_admin())
  ));
