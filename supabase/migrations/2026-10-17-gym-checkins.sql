-- Server-backed gym check-ins (Lucy 2026-10-17: a friend checked in
-- to a gym on his phone, then signed in on a computer and saw
-- nothing — check-ins lived only in the per-browser local store,
-- violating her "nothing lives on device only" rule).
--
-- One row per user: their CURRENT check-in. Reads are open to
-- signed-in users so gym presence ("who's here now") can be built
-- from real check-ins instead of only local theater; writes are
-- locked to the row's owner.
--
-- Run in the Supabase SQL Editor. Idempotent.

create table if not exists public.gym_checkins (
  user_id uuid primary key,
  gym_id text not null,
  checked_in_at timestamptz not null default now()
);

alter table public.gym_checkins enable row level security;

drop policy if exists "check-ins readable by signed-in users" on public.gym_checkins;
create policy "check-ins readable by signed-in users"
  on public.gym_checkins for select
  to authenticated
  using (true);

drop policy if exists "own check-in insert" on public.gym_checkins;
create policy "own check-in insert"
  on public.gym_checkins for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "own check-in update" on public.gym_checkins;
create policy "own check-in update"
  on public.gym_checkins for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own check-in delete" on public.gym_checkins;
create policy "own check-in delete"
  on public.gym_checkins for delete
  to authenticated
  using (user_id = auth.uid());
