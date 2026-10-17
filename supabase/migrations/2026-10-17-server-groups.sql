-- Server-backed crews (Lucy 2026-10-17: "I don't want anything to
-- live on device only" — a crew she created vanished from her app
-- because groups existed only in the per-device local store, which
-- the account-switch guard wipes).
--
-- Design: the client already treats a crew as one document (the
-- Group object: roster, admins, join policy, survey, pending join
-- requests), so the server stores that document as jsonb with the
-- owner extracted into a column for RLS. User-created crews only —
-- the seeded demo crews and the auto-generated house hangouts are
-- identical built-in content on every client and are never written.
--
-- Run in the Supabase SQL Editor. Idempotent.

create table if not exists public.groups (
  id text primary key,
  owner_id uuid not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;

drop policy if exists "groups readable by signed-in users" on public.groups;
create policy "groups readable by signed-in users"
  on public.groups for select
  to authenticated
  using (true);

drop policy if exists "owners create groups" on public.groups;
create policy "owners create groups"
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Crew documents are collaborative (members join, admins review
-- requests), so any signed-in user may update a crew row; inserts
-- and deletes stay owner-locked. Beta posture, same spirit as the
-- public directory.
drop policy if exists "signed-in users update groups" on public.groups;
create policy "signed-in users update groups"
  on public.groups for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "owners delete groups" on public.groups;
create policy "owners delete groups"
  on public.groups for delete
  to authenticated
  using (owner_id = auth.uid());
