-- Cruxmate requests: let a sender revive their own request row.
-- The table has unique (from_id, to_id), and a DENIED row stays in
-- place — so without an update path for the sender, re-adding someone
-- who once denied you (or whom you unfriended after an accept) fails
-- the unique constraint and the new request never reaches them.
-- The client upserts on (from_id, to_id); this policy permits the
-- update half of that upsert, restricted to the sender's own rows and
-- to flipping the row back to 'pending'. Guarded + idempotent.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cruxmate_requests'
      and policyname = 'revive my own mate requests'
  ) then
    create policy "revive my own mate requests"
      on public.cruxmate_requests
      for update to authenticated
      using (from_id = auth.uid())
      with check (from_id = auth.uid() and status = 'pending');
  end if;
end $$;
