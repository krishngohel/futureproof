-- ═══════════════════════════════════════════════════════════════════════════
-- Revision Inbox schema — run AFTER supabase/schema.sql (Futureproof base)
-- Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type project_status as enum ('active', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_category as enum ('copy', 'layout', 'color', 'bug', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_priority as enum ('urgent', 'normal', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_item_status as enum ('open', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_parse_status as enum ('pending', 'parsed', 'failed');
exception when duplicate_object then null; end $$;

-- ── Subscription + notification columns on profiles ─────────────────────────
alter table profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'solo')),
  add column if not exists email_notifications_enabled boolean not null default true;

-- ── projects ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  client_name text not null,
  target_url  text not null,
  status      project_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_user_id_idx on projects (user_id);
create index if not exists projects_user_status_idx on projects (user_id, status);

-- ── client_links ─────────────────────────────────────────────────────────────
create table if not exists client_links (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  token      text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists client_links_project_id_idx on client_links (project_id);

-- ── feedback_submissions ─────────────────────────────────────────────────────
create table if not exists feedback_submissions (
  id                     uuid default gen_random_uuid() primary key,
  project_id             uuid references projects(id) on delete cascade not null,
  raw_text               text not null,
  screenshot_url         text,
  screenshot_annotations jsonb,          -- [{x, y, note}] — x/y are percentages
  client_ip              text,           -- light abuse tracking only
  parse_status           submission_parse_status not null default 'pending',
  submitted_at           timestamptz not null default now()
);

create index if not exists feedback_submissions_project_id_idx
  on feedback_submissions (project_id);

-- ── feedback_items ───────────────────────────────────────────────────────────
create table if not exists feedback_items (
  id             uuid default gen_random_uuid() primary key,
  submission_id  uuid references feedback_submissions(id) on delete cascade,
  project_id     uuid references projects(id) on delete cascade not null,
  category       feedback_category not null default 'other',
  section        text not null default 'general',
  priority       feedback_priority not null default 'normal',
  summary        text not null,
  raw_feedback   text not null default '',
  status         feedback_item_status not null default 'open',
  created_at     timestamptz not null default now(),
  marked_done_at timestamptz
);

create index if not exists feedback_items_submission_id_idx on feedback_items (submission_id);
create index if not exists feedback_items_project_id_idx on feedback_items (project_id);
create index if not exists feedback_items_project_status_idx on feedback_items (project_id, status);

-- ── updated_at trigger on projects ───────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects for each row execute function update_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Public (client) traffic never touches these tables directly: the public
-- feedback page and /api/submissions run on the server with the service-role
-- key, which bypasses RLS. Authenticated freelancers hit them with the anon
-- key + session, so every policy below is scoped to ownership.

alter table projects             enable row level security;
alter table client_links         enable row level security;
alter table feedback_submissions enable row level security;
alter table feedback_items       enable row level security;

-- projects: owner has full access
drop policy if exists "projects: all own" on projects;
create policy "projects: all own" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- client_links: owner of the parent project
drop policy if exists "client_links: select own" on client_links;
create policy "client_links: select own" on client_links
  for select using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "client_links: insert own" on client_links;
create policy "client_links: insert own" on client_links
  for insert with check (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- feedback_submissions: owner can read/delete; inserts come from service role
drop policy if exists "submissions: select own" on feedback_submissions;
create policy "submissions: select own" on feedback_submissions
  for select using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "submissions: delete own" on feedback_submissions;
create policy "submissions: delete own" on feedback_submissions
  for delete using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- feedback_items: owner full access (AI inserts run via service role)
drop policy if exists "items: select own" on feedback_items;
create policy "items: select own" on feedback_items
  for select using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "items: insert own" on feedback_items;
create policy "items: insert own" on feedback_items
  for insert with check (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "items: update own" on feedback_items;
create policy "items: update own" on feedback_items
  for update using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "items: delete own" on feedback_items;
create policy "items: delete own" on feedback_items
  for delete using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ── Storage bucket for client screenshots ────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', true)
on conflict (id) do nothing;

-- Public read (screenshots are served by public URL); writes via service role only
drop policy if exists "screenshots: public read" on storage.objects;
create policy "screenshots: public read" on storage.objects
  for select using (bucket_id = 'feedback-screenshots');
