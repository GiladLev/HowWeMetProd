-- ═══════════════════════════════════════════════════════════════════════════
--  HowWeMet – complete schema (single source of truth)
--  Safe to run on both fresh and existing Supabase projects.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                     uuid        references auth.users on delete cascade primary key,
  first_name             text        not null default '',
  age                    integer     check (age >= 18 and age <= 35),
  field_of_study         text,
  university             text,
  bio                    text,
  photo_urls             text[]      not null default '{}',
  is_onboarding_complete boolean     not null default false,
  is_available           boolean     not null default false,
  available_until        timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Add availability columns if they don't exist yet (idempotent)
alter table public.profiles
  add column if not exists is_available    boolean     not null default false,
  add column if not exists available_until timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Fast "who is available now?" lookup
create index if not exists profiles_available_idx
  on public.profiles (is_available, available_until)
  where is_available = true;

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Create a stub profile row automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Storage: profile-photos ──────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "profile_photos_select" on storage.objects;
create policy "profile_photos_select" on storage.objects
  for select using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_insert" on storage.objects;
create policy "profile_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_update" on storage.objects;
create policy "profile_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_delete" on storage.objects;
create policy "profile_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Likes ───────────────────────────────────────────────────────────────────

create table if not exists public.likes (
  id           uuid        default gen_random_uuid() primary key,
  from_user_id uuid        references public.profiles(id) on delete cascade not null,
  to_user_id   uuid        references public.profiles(id) on delete cascade not null,
  created_at   timestamptz default now() not null,
  unique (from_user_id, to_user_id)
);

alter table public.likes enable row level security;

drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes
  for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes
  for insert to authenticated
  with check (auth.uid() = from_user_id);

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes
  for delete to authenticated
  using (auth.uid() = from_user_id);

-- ─── Matches ─────────────────────────────────────────────────────────────────

create table if not exists public.matches (
  id         uuid        default gen_random_uuid() primary key,
  user1_id   uuid        references public.profiles(id) on delete cascade not null,
  user2_id   uuid        references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.matches enable row level security;

drop policy if exists "matches_select" on public.matches;
create policy "matches_select" on public.matches
  for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "matches_insert" on public.matches;
create policy "matches_insert" on public.matches
  for insert to authenticated
  with check (auth.uid() = user1_id);

-- ─── Messages ────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id         uuid        default gen_random_uuid() primary key,
  match_id   uuid        references public.matches(id) on delete cascade not null,
  sender_id  uuid        references public.profiles(id) on delete cascade not null,
  text       text        not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = messages.sender_id
    and exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
    )
  );
-- ═══════════════════════════════════════════════════════════════════════════
--  Add gender + gender_preference columns to profiles (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists gender            text check (gender in ('male', 'female', 'other')),
  add column if not exists gender_preference text not null default 'both'
    check (gender_preference in ('male', 'female', 'both'));

-- Index for discovery filtering
create index if not exists profiles_gender_idx
  on public.profiles (gender, gender_preference)
  where is_available = true;

-- ═══════════════════════════════════════════════════════════════════════════
--  Add expiry + confirmation tracking to matches (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.matches
  add column if not exists expires_at   timestamptz,
  add column if not exists is_confirmed boolean not null default false;

-- Add sexuality / orientation column to profiles (idempotent)
alter table public.profiles
  add column if not exists sexuality text check (
    sexuality in ('straight','gay','lesbian','bisexual','pansexual','asexual','queer','prefer_not')
  );

-- ═══════════════════════════════════════════════════════════════════════════
--  UGC Safety: blocked_users, reported_users, is_suspended (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. is_suspended on profiles (admins flip this to ban a user)
alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

-- 2. blocked_users
create table if not exists public.blocked_users (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "Users manage own blocks" on public.blocked_users;
create policy "Users manage own blocks" on public.blocked_users
  for all using (auth.uid() = blocker_id);

-- 3. reported_users
create table if not exists public.reported_users (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('spam','harassment','inappropriate','fake','underage','other')),
  detail      text,
  created_at  timestamptz not null default now()
);

alter table public.reported_users enable row level security;

drop policy if exists "Users insert own reports" on public.reported_users;
create policy "Users insert own reports" on public.reported_users
  for insert with check (auth.uid() = reporter_id);

-- Service role / admins can read all reports (no RLS restriction for service_role)

-- ─── Location column ─────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists location text;

-- ─── Expo Push Token (for native app notifications) ─────────────────────────
alter table public.profiles
  add column if not exists expo_push_token text;

-- Enable Realtime for live chat, likes, and availability changes
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.profiles;
