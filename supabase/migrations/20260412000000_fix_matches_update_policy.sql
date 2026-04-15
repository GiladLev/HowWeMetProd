-- ═══════════════════════════════════════════════════════════════════════════
--  Fix: Add UPDATE policy on matches for trivia_state updates
--  Bug: trivia answers were never saved to DB because RLS blocked all UPDATEs
-- ═══════════════════════════════════════════════════════════════════════════

-- Allow both match participants to update the match (trivia_state, etc.)
drop policy if exists "matches_update" on public.matches;
create policy "matches_update" on public.matches
  for update to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Allow match participants to delete matches (for "no" decision in chat)
drop policy if exists "matches_delete" on public.matches;
create policy "matches_delete" on public.matches
  for delete to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Enable REPLICA IDENTITY FULL for realtime filtering to work correctly
alter table public.matches replica identity full;
