-- ============================================================
-- FSF Challenge — Supabase Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES
-- Stores display name + email for each registered user
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email       text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read all profiles (for leaderboard)
create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

-- Users can only insert/update their own profile
create policy "Users manage own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- 2. PICKS
-- One row per user; stage1 and stage2 stored as JSONB
create table if not exists public.picks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete cascade,
  stage1      jsonb default '{}',
  stage2      jsonb default '{}',
  updated_at  timestamptz default now()
);

alter table public.picks enable row level security;

-- Users can only read/write their own picks
create policy "Users manage own picks"
  on public.picks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger picks_updated_at
  before update on public.picks
  for each row execute function update_updated_at();


-- 3. RESULTS
-- Single row (id=1) holding official match results as JSONB
-- Structure mirrors picks: { stage1: { matchResults, groupFirst, groupSecond, thirdPlace }, stage2: { knockout } }
create table if not exists public.results (
  id    int primary key,
  data  jsonb default '{}'
);

alter table public.results enable row level security;

-- Everyone can read results (needed for leaderboard scoring)
create policy "Anyone can read results"
  on public.results for select
  using (true);

-- Only service_role (admin API calls) can write results
-- The app uses the anon key for reads; admin panel uses a server-side approach
-- For simplicity with the admin panel, temporarily allow all authenticated users to upsert:
create policy "Authenticated can upsert results"
  on public.results for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed empty results row
insert into public.results (id, data)
values (1, '{"stage1": {"matchResults": {}, "groupFirst": {}, "groupSecond": {}, "thirdPlace": []}, "stage2": {"knockout": {}}}')
on conflict (id) do nothing;


-- 4. BRACKET
-- Single row (id=1) holding the published R32→Final bracket slots as JSONB
-- Structure: { r32: [{label, teams: [t1, t2]}, ...], r16: [...], qf: [...], sf: [...], final: [...] }
create table if not exists public.bracket (
  id    int primary key,
  slots jsonb default '{}'
);

alter table public.bracket enable row level security;

create policy "Anyone can read bracket"
  on public.bracket for select
  using (true);

create policy "Authenticated can upsert bracket"
  on public.bracket for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed empty bracket row
insert into public.bracket (id, slots)
values (1, '{}')
on conflict (id) do nothing;


-- ============================================================
-- DONE. Tables created:
--   public.profiles   — user display names
--   public.picks      — per-user picks (stage1 + stage2 JSONB)
--   public.results    — official results (admin-entered, single row)
--   public.bracket    — published knockout bracket (single row)
-- ============================================================
