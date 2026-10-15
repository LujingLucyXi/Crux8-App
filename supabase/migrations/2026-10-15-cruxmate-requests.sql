-- Cruxmate requests: person-to-person adds now need the other side's
-- accept. The sender inserts; the recipient reads and answers
-- (accept/deny) any time; ignoring is leaving it pending. Modeled on
-- public.invites (2026-10-13-invites.sql) — guarded + idempotent.

create table if not exists public.cruxmate_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null,
  to_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'denied')),
  created_at timestamptz not null default now(),
  check (from_id <> to_id),
  unique (from_id, to_id)
);

create index if not exists cruxmate_requests_to_idx
  on public.cruxmate_requests (to_id, status);

alter table public.cruxmate_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cruxmate_requests'
      and policyname = 'send mate requests'
  ) then
    create policy "send mate requests"
      on public.cruxmate_requests
      for insert to authenticated
      with check (from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cruxmate_requests'
      and policyname = 'see mate requests im part of'
  ) then
    create policy "see mate requests im part of"
      on public.cruxmate_requests
      for select to authenticated
      using (to_id = auth.uid() or from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cruxmate_requests'
      and policyname = 'answer my mate requests'
  ) then
    create policy "answer my mate requests"
      on public.cruxmate_requests
      for update to authenticated
      using (to_id = auth.uid())
      with check (to_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cruxmate_requests'
      and policyname = 'cancel my mate requests'
  ) then
    create policy "cancel my mate requests"
      on public.cruxmate_requests
      for delete to authenticated
      using (from_id = auth.uid());
  end if;
end $$;
