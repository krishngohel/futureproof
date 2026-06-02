-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Profiles table (extends Supabase Auth users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  is_subscribed boolean default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Progress tracking per module per user
create table if not exists module_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  module_id text not null,
  completed boolean default false,
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, module_id)
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that fires on every new auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── IDE Tables ──────────────────────────────────────────────────────────────

-- One project per user (extendable to many later)
create table if not exists ide_projects (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null default 'My Project',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Files stored as plain text; Postgres TOAST compresses values > 2 KB automatically
create table if not exists ide_files (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references ide_projects(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  path        text not null,
  content     text not null default '',
  language    text not null default 'plaintext',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint ide_files_project_path_unique unique (project_id, path)
);

-- Auto-update updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger ide_files_updated_at
  before update on ide_files for each row execute function update_updated_at();

create trigger ide_projects_updated_at
  before update on ide_projects for each row execute function update_updated_at();

-- Row Level Security
alter table profiles enable row level security;
alter table module_progress enable row level security;

-- Profiles: users can only see and update their own row
create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- Module progress: users can only see and write their own rows
create policy "progress: select own" on module_progress
  for select using (auth.uid() = user_id);

create policy "progress: insert own" on module_progress
  for insert with check (auth.uid() = user_id);

create policy "progress: update own" on module_progress
  for update using (auth.uid() = user_id);

-- IDE RLS: users own their projects and files
alter table ide_projects enable row level security;
alter table ide_files    enable row level security;

create policy "ide_projects: all own" on ide_projects
  for all using (auth.uid() = user_id);

create policy "ide_files: all own" on ide_files
  for all using (auth.uid() = user_id);
