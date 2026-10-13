-- Climb call editing: make sure a host can UPDATE their own climb_calls
-- row (the app edits title/category/grade/gym/time/note/capacity).
-- Guarded + idempotent: safe to run even if an equivalent policy exists
-- (permissive policies combine with OR).

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'climb_calls'
      and policyname = 'hosts can edit their calls'
  ) then
    create policy "hosts can edit their calls"
      on public.climb_calls
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
