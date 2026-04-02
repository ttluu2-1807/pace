-- ============================================================
-- PACE — Initial Database Schema
-- Run this in Supabase: SQL Editor → New query → paste → Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with PACE-specific data
-- ============================================================
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  name            text,
  age             integer,
  sex             text check (sex in ('male', 'female', 'other')),
  weight_kg       numeric,
  height_cm       numeric,
  weekly_run_frequency integer default 3,
  longest_recent_run_km numeric default 5,
  primary_goal    text default 'health' check (primary_goal in ('health', 'race', 'weight', 'return-from-injury')),
  depth_preference text default 'balanced' check (depth_preference in ('simple', 'balanced', 'full')),
  coaching_voice  text default 'balanced' check (coaching_voice in ('encouraging', 'clinical', 'direct', 'balanced')),
  onboarding_phase integer default 1,
  is_pro          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRAINING PLANS
-- ============================================================
create table if not exists public.training_plans (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  name            text not null,
  race_type       text check (race_type in ('5k', '10k', 'half-marathon', 'marathon', 'general')),
  race_date       date,
  current_phase   text default 'base' check (current_phase in ('base', 'build', 'peak', 'taper', 'recovery')),
  current_week    integer default 1,
  total_weeks     integer default 12,
  weekly_volume_km numeric default 0,
  acwr            numeric,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- ============================================================
-- WORKOUTS
-- ============================================================
create table if not exists public.workouts (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  plan_id         uuid references public.training_plans(id) on delete set null,
  date            date not null,
  type            text not null check (type in ('easy', 'long', 'tempo', 'interval', 'strides', 'hill-repeats', 'cross-training', 'recovery-walk', 'rest')),
  title           text not null,
  description     text,
  duration_minutes integer,
  distance_km     numeric,
  target_zone     integer check (target_zone between 1 and 5),
  target_rpe      numeric check (target_rpe between 1 and 10),
  completed       boolean default false,
  actual_duration_minutes integer,
  actual_distance_km numeric,
  actual_avg_hr   integer,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- NUTRITION
-- ============================================================
create table if not exists public.nutrition_days (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  date            date not null,
  total_calories  numeric,
  carbs_g         numeric,
  protein_g       numeric,
  fat_g           numeric,
  carb_target_g   numeric,
  protein_target_g numeric,
  pre_run_fuelled boolean default false,
  post_run_recovery boolean default false,
  energy_availability numeric,
  source          text default 'manual' check (source in ('manual', 'mfp', 'cronometer', 'ai-inference')),
  unique (user_id, date)
);

-- ============================================================
-- INJURIES
-- ============================================================
create table if not exists public.injuries (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  body_region     text not null check (body_region in ('foot-ankle', 'lower-leg', 'knee', 'hip-glute', 'lower-back', 'upper-body', 'other')),
  condition       text not null,
  severity        text not null check (severity in ('monitoring', 'mild', 'moderate', 'severe')),
  status          text not null check (status in ('current', 'recovering', 'historical')),
  onset_type      text not null check (onset_type in ('gradual', 'acute', 'post-surgery')),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- WEEKLY CHECK-INS
-- ============================================================
create table if not exists public.weekly_checkins (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  week_start      date not null,
  energy          integer check (energy between 1 and 5),
  soreness        integer check (soreness between 1 and 5),
  mood            integer check (mood between 1 and 5),
  sleep           integer check (sleep between 1 and 5),
  motivation      integer check (motivation between 1 and 5),
  notes           text,
  created_at      timestamptz default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- INTEGRATIONS
-- ============================================================
create table if not exists public.integrations (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  type            text not null check (type in ('apple-health', 'garmin', 'strava', 'whoop', 'oura', 'mfp', 'cronometer')),
  connected       boolean default false,
  last_synced     timestamptz,
  status          text default 'disconnected' check (status in ('active', 'error', 'disconnected')),
  unique (user_id, type)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only access their own data
-- ============================================================
alter table public.profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.nutrition_days enable row level security;
alter table public.injuries enable row level security;
alter table public.weekly_checkins enable row level security;
alter table public.integrations enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Training plans
create policy "Users can manage own plans" on public.training_plans for all using (auth.uid() = user_id);

-- Workouts
create policy "Users can manage own workouts" on public.workouts for all using (auth.uid() = user_id);

-- Nutrition
create policy "Users can manage own nutrition" on public.nutrition_days for all using (auth.uid() = user_id);

-- Injuries
create policy "Users can manage own injuries" on public.injuries for all using (auth.uid() = user_id);

-- Weekly check-ins
create policy "Users can manage own checkins" on public.weekly_checkins for all using (auth.uid() = user_id);

-- Integrations
create policy "Users can manage own integrations" on public.integrations for all using (auth.uid() = user_id);
