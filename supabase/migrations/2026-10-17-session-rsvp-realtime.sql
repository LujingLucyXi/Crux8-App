-- Enable Postgres Changes for session participant and join-request updates.
-- Guard the addition so this migration is safe to run more than once.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'session_rsvps'
  ) then
    execute 'alter publication supabase_realtime add table public.session_rsvps';
  end if;
end
$$;
