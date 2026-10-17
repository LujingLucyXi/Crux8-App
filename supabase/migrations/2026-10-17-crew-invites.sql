-- Crew invitations (Lucy 2026-10-17): only cruxmates can be ADDED
-- to a crew directly; non-friends are INVITED and join by accepting.
-- Crew invites ride the existing invites table, which needs two
-- adjustments: kind must allow 'group', and target_id must hold
-- crew ids, which are text ('grp_…'), not uuids.
--
-- Run in the Supabase SQL Editor. Idempotent.

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.invites'::regclass and contype = 'c'
  loop
    execute format('alter table public.invites drop constraint %I', c);
  end loop;
  alter table public.invites
    add constraint invites_kind_check
    check (kind in ('call', 'session', 'group'));
  alter table public.invites
    add constraint invites_status_check
    check (status in ('pending', 'accepted', 'denied'));
end $$;

alter table public.invites
  alter column target_id type text using target_id::text;
