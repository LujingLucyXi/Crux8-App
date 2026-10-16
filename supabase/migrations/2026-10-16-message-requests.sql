-- Message requests (Lucy, 2026-10-16): following someone lets you
-- start a DM, but it arrives as a REQUEST — the recipient must accept
-- before the chat opens for both sides. Cruxmates (mutual follows)
-- skip requests entirely. Modeled on public.cruxmate_requests,
-- including the sender-revive policy, baked in from the start.

create table if not exists public.message_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null,
  to_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (from_id <> to_id),
  unique (from_id, to_id)
);

create index if not exists message_requests_to_idx
  on public.message_requests (to_id, status);

alter table public.message_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'message_requests'
      and policyname = 'send message requests'
  ) then
    create policy "send message requests"
      on public.message_requests
      for insert to authenticated
      with check (from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'message_requests'
      and policyname = 'see message requests im part of'
  ) then
    create policy "see message requests im part of"
      on public.message_requests
      for select to authenticated
      using (to_id = auth.uid() or from_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'message_requests'
      and policyname = 'answer my message requests'
  ) then
    create policy "answer my message requests"
      on public.message_requests
      for update to authenticated
      using (to_id = auth.uid())
      with check (to_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'message_requests'
      and policyname = 'revive my own message requests'
  ) then
    create policy "revive my own message requests"
      on public.message_requests
      for update to authenticated
      using (from_id = auth.uid())
      with check (from_id = auth.uid() and status = 'pending');
  end if;
end $$;
