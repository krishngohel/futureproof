-- Run this in the Supabase Dashboard → SQL Editor
-- Adds IDE project + file storage (plain text, compressed automatically by Postgres TOAST)

create table if not exists ide_projects (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null default 'My Project',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ide_files (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references ide_projects(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null,
  path       text not null,
  content    text not null default '',
  language   text not null default 'plaintext',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint ide_files_project_path_unique unique (project_id, path)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger ide_files_updated_at
  before update on ide_files for each row execute function update_updated_at();

create trigger ide_projects_updated_at
  before update on ide_projects for each row execute function update_updated_at();

-- Row Level Security: users can only access their own data
alter table ide_projects enable row level security;
alter table ide_files    enable row level security;

create policy "ide_projects: all own" on ide_projects
  for all using (auth.uid() = user_id);

create policy "ide_files: all own" on ide_files
  for all using (auth.uid() = user_id);
