-- Run once in the SUNJOVIA GLOBAL Supabase SQL Editor.
create table if not exists public.saved_recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null,
  recipe_name text not null,
  category text not null,
  day integer not null check (day between 1 and 30),
  servings integer not null check (servings between 1 and 30),
  created_at timestamptz not null default now(),
  primary key (user_id,recipe_id)
);
alter table public.saved_recipes enable row level security;
create policy "Members can view own saved recipes" on public.saved_recipes for select to authenticated using ((select auth.uid())=user_id);
create policy "Members can insert own saved recipes" on public.saved_recipes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Members can update own saved recipes" on public.saved_recipes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Members can delete own saved recipes" on public.saved_recipes for delete to authenticated using ((select auth.uid())=user_id);
