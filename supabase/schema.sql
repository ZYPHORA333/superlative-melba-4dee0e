-- NORTHSTAR cloud data foundation
-- Run in your own Supabase project's SQL editor after reviewing.
create extension if not exists pgcrypto;

create table if not exists public.saved_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  servings integer not null default 4 check (servings between 1 and 30),
  selected_days integer[] not null default '{}'::integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_meal_plans_user_idx on public.saved_meal_plans(user_id);
alter table public.saved_meal_plans enable row level security;
create policy "Users can view own meal plans" on public.saved_meal_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own meal plans" on public.saved_meal_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own meal plans" on public.saved_meal_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own meal plans" on public.saved_meal_plans for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Research location' check (char_length(label) between 1 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists saved_locations_user_idx on public.saved_locations(user_id);
alter table public.saved_locations enable row level security;
create policy "Users can view own locations" on public.saved_locations for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own locations" on public.saved_locations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own locations" on public.saved_locations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own locations" on public.saved_locations for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_size integer not null default 4 check (household_size between 1 and 30),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  wishlist jsonb not null default '[]'::jsonb check (jsonb_typeof(wishlist) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
create policy "Users can view own preferences" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own preferences" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own preferences" on public.user_preferences for delete to authenticated using ((select auth.uid()) = user_id);
