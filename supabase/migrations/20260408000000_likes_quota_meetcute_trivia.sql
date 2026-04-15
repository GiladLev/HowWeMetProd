-- ═══════════════════════════════════════════════════════════════════════════
--  Likes quota, meet cute persistence, and trivia system
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Add meet cute persistence to profiles ────────────────────────────────

alter table if exists public.profiles
  add column if not exists meet_cute_activity text,
  add column if not exists meet_cute_mindset text,
  add column if not exists meet_cute_touch text;

-- ─── Add daily likes quota to profiles ────────────────────────────────────

alter table if exists public.profiles
  add column if not exists daily_likes_used int not null default 0,
  add column if not exists daily_likes_reset_at timestamptz not null default now();

-- ─── Add trivia state to matches ──────────────────────────────────────────

alter table if exists public.matches
  add column if not exists trivia_state jsonb default null;

-- ─── Fix RLS: allow both from_user_id AND to_user_id to delete likes ──────

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes
  for delete to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ─── Enable realtime on amatches (for trivia sync) ──────────────────────────

-- Only run if matches is not already in the publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
end $$;
