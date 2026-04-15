-- =============================================
-- Migration: Game System (replaces trivia)
-- =============================================

-- Note: keeping column name as trivia_state (no rename) — all code references trivia_state

-- Add game tracking columns
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS game_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_plan jsonb DEFAULT NULL;


-- Add meet cute columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS meet_cute_activity text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meet_cute_mindset text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meet_cute_availability_vibe text DEFAULT NULL;

-- http://localhost:3000/api/debug-profiles?action=reset