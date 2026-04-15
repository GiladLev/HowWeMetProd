-- ═══════════════════════════════════════════════════════════════════════════
--  Unified matches policies — replaces all previous match RLS policies
--  Fixes: trivia updates blocked, match deletion blocked, realtime broken
-- ════════════════════════════════════════════════════════════════════��══════

-- Drop ALL existing match policies
drop policy if exists "matches_select" on public.matches;
drop policy if exists "matches_insert" on public.matches;
drop policy if exists "matches_update" on public.matches;
drop policy if exists "matches_delete" on public.matches;

-- Single unified policy per operation
-- SELECT: both participants can read
create policy "matches_select" on public.matches
  for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- INSERT: either participant can create (needed for likes page + profiles page)
create policy "matches_insert" on public.matches
  for insert to authenticated
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- UPDATE: both participants can update (trivia_state, is_confirmed, etc.)
create policy "matches_update" on public.matches
  for update to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- DELETE: both participants can delete (reject decision)
create policy "matches_delete" on public.matches
  for delete to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Enable full replica identity for Supabase Realtime to work with RLS filters
alter table public.matches replica identity full;
