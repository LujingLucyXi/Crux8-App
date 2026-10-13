-- Gym suggestions: users can propose a gym that isn't listed yet.
-- Insert-only for app users; review happens in the Supabase dashboard
-- (Table editor → gym_suggestions). Safe to run once.

create table if not exists public.gym_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  note text,
  suggested_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.gym_suggestions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_suggestions'
      and policyname = 'users can suggest gyms'
  ) then
    create policy "users can suggest gyms"
      on public.gym_suggestions
      for insert to authenticated
      with check (suggested_by = auth.uid());
  end if;
end $$;
