-- Lexia independent progress store
-- Tehkné Solutions

create extension if not exists pgcrypto;

create table if not exists public.lexia_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  child_name text not null default 'Jogador',
  letter text not null,
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  interval integer not null default 0,
  repetitions integer not null default 0,
  next_review timestamptz,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  streak integer not null default 0,
  last_grade integer not null default 0 check (last_grade between 0 and 4),
  stars_earned integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lexia_progress_user_letter_unique unique (user_id, letter)
);

create index if not exists lexia_progress_user_next_review_idx
  on public.lexia_progress (user_id, next_review);

alter table public.lexia_progress enable row level security;

revoke all on table public.lexia_progress from anon;
grant select, insert, update, delete on table public.lexia_progress to authenticated;

drop policy if exists "lexia progress select own" on public.lexia_progress;
create policy "lexia progress select own"
  on public.lexia_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lexia progress insert own" on public.lexia_progress;
create policy "lexia progress insert own"
  on public.lexia_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lexia progress update own" on public.lexia_progress;
create policy "lexia progress update own"
  on public.lexia_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lexia progress delete own" on public.lexia_progress;
create policy "lexia progress delete own"
  on public.lexia_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
