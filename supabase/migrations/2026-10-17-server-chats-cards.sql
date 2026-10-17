-- Server-backed chat messages + collected cards (Lucy 2026-10-17:
-- "I don't want anything to live on device only" — her chat history
-- vanished with a device-local store wipe; message bodies and the
-- card Vault were local-only by the original design).
--
-- chat_messages: one row per message.
--   thread_kind: 'dm' | 'session' | 'event' | 'call' | 'group'
--   thread_id:   for DMs, the canonical pair key '<uuidA>:<uuidB>'
--                (sorted); otherwise the session / call / group id.
--   peer_id:     DMs only — the other participant, so RLS can scope
--                reads to the two parties.
-- Session / group / call threads are readable by any signed-in user
-- (beta posture; membership-scoped policies can tighten later) —
-- DMs are strictly two-party. Inserts are sender-locked; reaction
-- updates are allowed for thread participants.
--
-- collected_cards: one row per (owner, card subject). card_user_id
-- is text because cards can be collected for seeded climbers whose
-- ids are not uuids.
--
-- Run in the Supabase SQL Editor. Idempotent.

create table if not exists public.chat_messages (
  id text primary key,
  thread_kind text not null,
  thread_id text not null,
  sender_id uuid not null,
  peer_id uuid,
  body text not null,
  reactions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_kind, thread_id, created_at);
create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_id);
create index if not exists chat_messages_peer_idx
  on public.chat_messages (peer_id);

alter table public.chat_messages enable row level security;

drop policy if exists "read own dms and shared threads" on public.chat_messages;
create policy "read own dms and shared threads"
  on public.chat_messages for select
  to authenticated
  using (
    thread_kind <> 'dm'
    or sender_id = auth.uid()
    or peer_id = auth.uid()
  );

drop policy if exists "send messages as yourself" on public.chat_messages;
create policy "send messages as yourself"
  on public.chat_messages for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "participants update reactions" on public.chat_messages;
create policy "participants update reactions"
  on public.chat_messages for update
  to authenticated
  using (
    thread_kind <> 'dm'
    or sender_id = auth.uid()
    or peer_id = auth.uid()
  )
  with check (
    thread_kind <> 'dm'
    or sender_id = auth.uid()
    or peer_id = auth.uid()
  );

create table if not exists public.collected_cards (
  owner_id uuid not null,
  card_user_id text not null,
  archetype_id text not null default '',
  house_id text not null default '',
  collected_at timestamptz not null,
  sessions_together integer not null default 1,
  source text not null default 'cruxmate',
  primary key (owner_id, card_user_id)
);

alter table public.collected_cards enable row level security;

drop policy if exists "own cards only" on public.collected_cards;
create policy "own cards only"
  on public.collected_cards for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
