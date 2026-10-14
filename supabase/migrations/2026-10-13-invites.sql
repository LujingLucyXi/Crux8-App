-- Personal invites: a row per (kind, target, invitee). The inviter
-- inserts; the invitee reads and answers (accept/deny) any time until
-- the climb ends; ignoring is just leaving it pending. Guarded +
-- idempotent like the other 2026-10-13 migrations.

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('call', 'session')),
  target_id uuid not null,
  from_id uuid not null,
  to_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'denied')),
  created_at timestamptz not null default now(),
  unique (kind, target_id, to_id)
);

create index if not exists invites_to_idx on public.invites (to_id, status);

alter table public.invites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invites'
      and policyname = 'send invites'
  ) then
    create policy "send invites"
      on public.invites
      for insert to authenticated
      with check (from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invites'
      and policyname = 'see invites im part of'
  ) then
    create policy "see invites im part of"
      on public.invites
      for select to authenticated
      using (to_id = auth.uid() or from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invites'
      and policyname = 'answer my invites'
  ) then
    create policy "answer my invites"
      on public.invites
      for update to authenticated
      using (to_id = auth.uid())
      with check (to_id = auth.uid());
  end if;
end $$;
