-- Run this once in Supabase Dashboard → SQL Editor.
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text,
  avatar_url text,
  location text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  profile_completion integer not null default 0 check (profile_completion between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure older accounts have a profile row for the profile editor to update.
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Registration details used by the user dashboard and personalization modules.
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists education text;
alter table public.profiles add column if not exists degree text;
alter table public.profiles add column if not exists college text;
alter table public.profiles add column if not exists graduation_year integer;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists current_job_title text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists preferred_job_roles text[] not null default '{}';
alter table public.profiles add column if not exists preferred_locations text[] not null default '{}';
alter table public.profiles add column if not exists work_preference text;
alter table public.profiles add column if not exists career_interests text[] not null default '{}';
alter table public.profiles add column if not exists experience_entries jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists education_entries jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists projects_entries jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists certifications_entries jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists resume_name text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists portfolio_url text;

-- Migrate details collected during signup into the repeatable profile sections.
update public.profiles
set experience_entries = jsonb_build_array(jsonb_build_object(
  'title', coalesce(current_job_title, ''),
  'company', '', 'start', '', 'end', '', 'description', ''
))
where jsonb_array_length(experience_entries) = 0 and current_job_title is not null and current_job_title <> '';

update public.profiles
set education_entries = jsonb_build_array(jsonb_build_object(
  'degree', coalesce(degree, education, ''),
  'school', coalesce(college, ''),
  'year', coalesce(graduation_year::text, '')
))
where jsonb_array_length(education_entries) = 0 and (degree is not null or education is not null or college is not null);

create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  location text,
  salary text,
  description text,
  skills text[] not null default '{}',
  source text,
  external_url text,
  created_at timestamptz not null default now()
);
alter table public.jobs add column if not exists salary text;

-- Instagram imports remain isolated until an admin reviews and publishes them.
create table if not exists public.instagram_job_imports (
  id uuid primary key default uuid_generate_v4(),
  instagram_media_id text not null unique,
  permalink text,
  media_type text,
  caption text,
  media_url text,
  thumbnail_url text,
  posted_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.instagram_job_imports enable row level security;

create table if not exists public.saved_jobs (
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  resume_path text,
  source text,
  status text not null default 'saved' check (status in ('saved','applied','screening','interview','offer','rejected')),
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Resume',
  content jsonb not null default '{}',
  is_primary boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.mock_tests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  score integer check (score between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  unique(user_id, course_name)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  subject text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Voice Talk Zone matchmaking and availability records.
create table if not exists public.voice_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gender text check (gender in ('male', 'female', 'other')),
  is_available boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_practice_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('random', 'opposite', 'partner')),
  preferred_gender text,
  partner_code text,
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'active', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Allow unauthenticated Random/Partner sessions to wait for a match.
alter table public.voice_practice_sessions alter column user_id drop not null;
alter table public.voice_practice_sessions add column if not exists partner_session_id uuid references public.voice_practice_sessions(id) on delete set null;

-- Keep existing projects compatible before policies reference guest application fields.
alter table public.applications alter column user_id drop not null;
alter table public.applications add column if not exists applicant_name text;
alter table public.applications add column if not exists applicant_email text;
alter table public.applications add column if not exists applicant_phone text;
alter table public.applications add column if not exists resume_path text;
alter table public.applications add column if not exists source text;
alter table public.applications add column if not exists cover_letter text;

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.resumes enable row level security;
alter table public.mock_tests enable row level security;
alter table public.learning_progress enable row level security;
alter table public.messages enable row level security;
alter table public.voice_presence enable row level security;
alter table public.voice_practice_sessions enable row level security;

drop policy if exists "users manage own voice presence" on public.voice_presence;
create policy "users manage own voice presence" on public.voice_presence for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users can view available voice presence" on public.voice_presence;
create policy "users can view available voice presence" on public.voice_presence for select to authenticated using (is_available = true or auth.uid() = user_id);
drop policy if exists "users manage own voice sessions" on public.voice_practice_sessions;
create policy "users manage own voice sessions" on public.voice_practice_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "guests can create voice sessions" on public.voice_practice_sessions;
create policy "guests can create voice sessions" on public.voice_practice_sessions for insert to anon with check (user_id is null and mode in ('random', 'partner'));
drop policy if exists "guests can read waiting voice sessions" on public.voice_practice_sessions;
create policy "guests can read waiting voice sessions" on public.voice_practice_sessions for select to anon using (user_id is null and status = 'waiting');
drop policy if exists "guests can read matched voice sessions" on public.voice_practice_sessions;
create policy "guests can read matched voice sessions" on public.voice_practice_sessions for select to anon using (user_id is null and status = 'matched');
drop policy if exists "authenticated can read guest voice sessions" on public.voice_practice_sessions;
create policy "authenticated can read guest voice sessions"
on public.voice_practice_sessions
for select to authenticated
using (user_id is null and status in ('waiting', 'matched'));
grant select, insert on public.voice_practice_sessions to anon;
grant select, insert, update on public.voice_practice_sessions to authenticated;

-- Match the newest waiting session with one compatible waiting session.
create or replace function public.match_voice_partner(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_session public.voice_practice_sessions;
  partner_session public.voice_practice_sessions;
begin
  select * into current_session from public.voice_practice_sessions
    where id = p_session_id and status = 'waiting' for update;
  if not found then return false; end if;
  select s.* into partner_session from public.voice_practice_sessions as s
    where s.status = 'waiting'
      and s.id <> p_session_id
      and s.started_at > now() - interval '2 minutes'
      and (s.mode = current_session.mode or current_session.mode = 'partner' or s.mode = 'partner')
      and (current_session.mode <> 'partner' or lower(trim(s.partner_code)) = lower(trim(current_session.partner_code)))
    order by s.started_at desc limit 1 for update skip locked;
  if not found then return false; end if;
  update public.voice_practice_sessions set status = 'matched', partner_session_id = partner_session.id where id = p_session_id;
  update public.voice_practice_sessions set status = 'matched', partner_session_id = p_session_id where id = partner_session.id;
  return true;
end;
$$;
grant execute on function public.match_voice_partner(uuid) to anon, authenticated;

create or replace function public.get_voice_session_details(p_session_id uuid)
returns table(status text, partner_session_id uuid)
language sql security definer set search_path = public
as $$ select status, partner_session_id from public.voice_practice_sessions where id = p_session_id; $$;
grant execute on function public.get_voice_session_details(uuid) to anon, authenticated;

create or replace function public.cancel_voice_session(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.voice_practice_sessions
  set status = 'cancelled', ended_at = now()
  where id = p_session_id and status in ('waiting', 'matched', 'active');
  select true;
$$;
grant execute on function public.cancel_voice_session(uuid) to anon, authenticated;

create or replace function public.requeue_voice_session(p_session_id uuid)
returns boolean
language sql security definer set search_path = public
as $$
  update public.voice_practice_sessions
  set status = 'waiting', partner_session_id = null, started_at = now(), ended_at = null
  where id = p_session_id;
  select true;
$$;
grant execute on function public.requeue_voice_session(uuid) to anon, authenticated;

create or replace function public.get_voice_counts()
returns table(male bigint, female bigint)
language sql security definer set search_path = public
as $$
  select
    count(*) filter (where lower(preferred_gender) = 'male'),
    count(*) filter (where lower(preferred_gender) = 'female')
  from public.voice_practice_sessions
  where status = 'waiting';
$$;
grant execute on function public.get_voice_counts() to anon, authenticated;

create or replace function public.get_voice_session_status(p_session_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select status
  from public.voice_practice_sessions
  where id = p_session_id;
$$;
grant execute on function public.get_voice_session_status(uuid) to anon, authenticated;

-- Profile photos: create the bucket once and allow users to manage only their own folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and name like (select auth.uid()::text) || '/%');

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and name like (select auth.uid()::text) || '/%')
with check (bucket_id = 'avatars' and name like (select auth.uid()::text) || '/%');

drop policy if exists "Users can view their own avatars" on storage.objects;
create policy "Users can view their own avatars" on storage.objects
for select to authenticated
using (bucket_id = 'avatars' and name like (select auth.uid()::text) || '/%');

drop policy if exists "profiles are public to their owner" on public.profiles;
create policy "profiles are public to their owner" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "jobs are readable by signed in users" on public.jobs;
drop policy if exists "jobs are publicly readable" on public.jobs;
create policy "jobs are publicly readable" on public.jobs for select using (true);
drop policy if exists "users manage saved jobs" on public.saved_jobs;
create policy "users manage saved jobs" on public.saved_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage applications" on public.applications;
create policy "users manage applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "guests can submit applications" on public.applications;
create policy "guests can submit applications" on public.applications for insert to anon with check (user_id is null and applicant_name is not null and applicant_email is not null);
drop policy if exists "users manage interviews" on public.interviews;
create policy "users manage interviews" on public.interviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage resumes" on public.resumes;
create policy "users manage resumes" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage mock tests" on public.mock_tests;
create policy "users manage mock tests" on public.mock_tests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage learning progress" on public.learning_progress;
create policy "users manage learning progress" on public.learning_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users read their messages" on public.messages;
create policy "users read their messages" on public.messages for select using (auth.uid() = user_id);
drop policy if exists "users update their messages" on public.messages;
create policy "users update their messages" on public.messages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email)); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Migration for guest applications on an existing project.
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (status in ('saved','ready_to_apply','redirected','applied_confirmed','applied','screening','interview','offer','rejected'));
drop policy if exists "guests can submit applications" on public.applications;
create policy "guests can submit applications" on public.applications for insert to anon with check (user_id is null and applicant_name is not null and applicant_email is not null);

-- Run after creating the admin accounts in Authentication → Users.
update public.profiles set role = 'admin'
where id in (select id from auth.users where email in ('admin@softwarechinnodu.com', 'vardhanmudra12@gmail.com'));

-- Admin dashboard access: keep normal users restricted while allowing admins to
-- read production records across the platform. The security-definer function
-- avoids recursive evaluation of the profiles policy.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists "admins read jobs" on public.jobs;
create policy "admins read jobs" on public.jobs for select to authenticated using (public.is_admin());
drop policy if exists "admins read applications" on public.applications;
create policy "admins read applications" on public.applications for select to authenticated using (public.is_admin());
drop policy if exists "admins read mock tests" on public.mock_tests;
create policy "admins read mock tests" on public.mock_tests for select to authenticated using (public.is_admin());
drop policy if exists "admins read learning progress" on public.learning_progress;
create policy "admins read learning progress" on public.learning_progress for select to authenticated using (public.is_admin());
drop policy if exists "admins manage instagram imports" on public.instagram_job_imports;
create policy "admins manage instagram imports" on public.instagram_job_imports for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enable production realtime updates for the live voice lobby and matchmaking status.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voice_presence') then
    alter publication supabase_realtime add table public.voice_presence;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voice_practice_sessions') then
    alter publication supabase_realtime add table public.voice_practice_sessions;
  end if;
end $$;
