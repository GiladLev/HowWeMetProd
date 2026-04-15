-- =============================================
-- Atomic Game State Merge Functions
-- Solves race condition: two players writing to the same JSONB simultaneously
-- =============================================

-- ─── merge_game_data ─────────────────────────────────────────────────────────
-- Atomically merges partial GameData into trivia_state.games[game_key]
-- Deep-merges playerData so concurrent player submissions don't overwrite each other
--
-- Parameters:
--   p_match_id         UUID    — the match row
--   p_game_key         TEXT    — game number as string ('1' through '10')
--   p_partial          JSONB   — partial GameData to merge (status, playerData, winnerId, etc.)
--   p_replace_player_data BOOL — when true, replaces playerData entirely (for tie resets)
--
-- Returns: the full merged trivia_state JSONB

CREATE OR REPLACE FUNCTION merge_game_data(
  p_match_id UUID,
  p_game_key TEXT,
  p_partial JSONB,
  p_replace_player_data BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_state JSONB;
  current_game JSONB;
  merged_game JSONB;
  merged_state JSONB;
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Lock the row to prevent concurrent modification
  SELECT trivia_state INTO current_state
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF current_state IS NULL THEN
    RAISE EXCEPTION 'no game state found';
  END IF;

  current_game := current_state->'games'->p_game_key;
  IF current_game IS NULL THEN
    RAISE EXCEPTION 'invalid game key: %', p_game_key;
  END IF;

  -- Shallow merge: overlay p_partial onto current game data
  merged_game := current_game || p_partial;

  -- Deep merge playerData (unless replace mode)
  IF p_partial ? 'playerData' THEN
    IF p_replace_player_data THEN
      -- Replace entirely (used for tie resets)
      merged_game := jsonb_set(merged_game, '{playerData}', p_partial->'playerData');
    ELSE
      -- Deep merge: keep existing keys, add/update new ones
      merged_game := jsonb_set(
        merged_game,
        '{playerData}',
        COALESCE(current_game->'playerData', '{}'::jsonb) || (p_partial->'playerData')
      );
    END IF;
  END IF;

  -- Write merged game back into the full state
  merged_state := jsonb_set(current_state, ARRAY['games', p_game_key], merged_game);

  UPDATE public.matches
  SET trivia_state = merged_state
  WHERE id = p_match_id;

  RETURN merged_state;
END;
$$;


-- ─── advance_game_state ──────────────────────────────────────────────────────
-- Atomically merges top-level GameState fields (phase, currentGame, datePlan, etc.)
-- Also deep-merges games if provided (e.g., advancing next game status to 'playing')
--
-- Parameters:
--   p_match_id      UUID  — the match row
--   p_partial_state JSONB — partial GameState to merge
--
-- Returns: the full merged trivia_state JSONB

CREATE OR REPLACE FUNCTION advance_game_state(
  p_match_id UUID,
  p_partial_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_state JSONB;
  merged_state JSONB;
  game_key TEXT;
  current_game_data JSONB;
  partial_game_data JSONB;
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Lock the row
  SELECT trivia_state INTO current_state
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF current_state IS NULL THEN
    RAISE EXCEPTION 'no game state found';
  END IF;

  -- Shallow merge top-level fields (phase, currentGame, datePlan, finalDecision, ready)
  merged_state := current_state || p_partial_state;

  -- Deep merge 'games' if provided — merge each game key individually
  IF p_partial_state ? 'games' THEN
    -- Start with current games
    merged_state := jsonb_set(merged_state, '{games}', current_state->'games');

    -- Overlay each provided game key
    FOR game_key IN SELECT jsonb_object_keys(p_partial_state->'games')
    LOOP
      current_game_data := COALESCE(current_state->'games'->game_key, '{}'::jsonb);
      partial_game_data := p_partial_state->'games'->game_key;

      -- Merge game data, deep-merge playerData
      merged_state := jsonb_set(
        merged_state,
        ARRAY['games', game_key],
        current_game_data || partial_game_data
      );

      -- Deep merge playerData within this game if provided
      IF partial_game_data ? 'playerData' THEN
        merged_state := jsonb_set(
          merged_state,
          ARRAY['games', game_key, 'playerData'],
          COALESCE(current_game_data->'playerData', '{}'::jsonb) || (partial_game_data->'playerData')
        );
      END IF;
    END LOOP;
  END IF;

  -- Deep merge finalDecision if provided
  IF p_partial_state ? 'finalDecision' THEN
    merged_state := jsonb_set(
      merged_state,
      '{finalDecision}',
      COALESCE(current_state->'finalDecision', '{}'::jsonb) || (p_partial_state->'finalDecision')
    );
  END IF;

  UPDATE public.matches
  SET trivia_state = merged_state
  WHERE id = p_match_id;

  RETURN merged_state;
END;
$$;
