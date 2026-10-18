-- Web Push subscriptions + reminder send log (Lucy 2026-10-18:
-- in-app reminders + web push for upcoming climbs).
--
-- push_subscriptions: one row per (user, browser/device endpoint).
-- Owner-locked: a user manages only their own subscriptions. The
-- send-reminders Edge Function reads all rows with the service role.
--
-- push_reminder_log: dedupe ledger for the sender — one row per
-- (user, climb, horizon) ever sent. No policies: service-role only.
--
-- The pg_cron job at the bottom calls the Edge Function every
-- 15 minutes; the x-cron-secret header must match the function's
-- CRON_SECRET secret. Safe to re-run: the job is replaced by name.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_select_own') then
    create policy push_subscriptions_select_own on public.push_subscriptions
      for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_insert_own') then
    create policy push_subscriptions_insert_own on public.push_subscriptions
      for insert with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_update_own') then
    create policy push_subscriptions_update_own on public.push_subscriptions
      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_delete_own') then
    create policy push_subscriptions_delete_own on public.push_subscriptions
      for delete using (user_id = auth.uid());
  end if;
end $$;

create table if not exists public.push_reminder_log (
  user_id uuid not null,
  target_kind text not null,
  target_id uuid not null,
  horizon text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, target_kind, target_id, horizon)
);

alter table public.push_reminder_log enable row level security;

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('send-climb-reminders');
exception when others then
  null; -- job didn't exist yet
end $$;

select cron.schedule(
  'send-climb-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://njthgcbvmlavhwvcwqqx.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'PoOmLkh9xZ5Cgr48gghVfUPX3qUxGnak'
    ),
    body := '{}'::jsonb
  );
  $$
);
