'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '../../lib/supabase';
import type { GameState, GameData } from '../../types';

/**
 * Hook for syncing game state between two matched users.
 *
 * Writes use Postgres RPC functions with FOR UPDATE row locking — guarantees
 * no concurrent write can overwrite another player's data.
 *
 * Reads use Supabase Realtime subscription + polling fallback (every 3s).
 */
export function useGameSync(
  matchId: string,
  localState: GameState | null,
  onRemoteUpdate: (state: GameState) => void,
) {
  const stateRef = useRef(localState);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const senderIdRef = useRef(`client-${Math.random().toString(36).slice(2, 10)}`);
  const lastRealtimeSyncAtRef = useRef<number>(Date.now());
  useEffect(() => {
    stateRef.current = localState;
  }, [localState]);

  // ── Poll DB as fallback only when realtime is quiet ─────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentState = stateRef.current;
      if (!currentState || currentState.phase === 'completed') return;
      // Realtime is healthy; skip noisy fallback fetches.
      if (Date.now() - lastRealtimeSyncAtRef.current < 3000) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('matches')
        .select('trivia_state')
        .eq('id', matchId)
        .single();

      if (data?.trivia_state) {
        const remote = data.trivia_state as GameState;
        if (isValidGameState(remote) && shouldAcceptRemote(stateRef.current, remote)) {
          lastRealtimeSyncAtRef.current = Date.now();
          onRemoteUpdate(remote);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [matchId, onRemoteUpdate]);

  // ── Realtime subscription ───────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`game-${matchId}`)
      .on(
        'broadcast',
        { event: 'game-patch' },
        ({ payload }) => {
          const incoming = payload as {
            senderId?: string;
            gameKey?: string;
            partial?: Partial<GameData>;
            replacePlayerData?: boolean;
          };
          if (!incoming || incoming.senderId === senderIdRef.current) return;
          if (!incoming.gameKey || !incoming.partial) return;
          const merged = applyGamePatch(stateRef.current, incoming.gameKey, incoming.partial, !!incoming.replacePlayerData);
          if (merged) {
            lastRealtimeSyncAtRef.current = Date.now();
            onRemoteUpdate(merged);
          }
        },
      )
      .on(
        'broadcast',
        { event: 'state-patch' },
        ({ payload }) => {
          const incoming = payload as {
            senderId?: string;
            partial?: Partial<GameState>;
          };
          if (!incoming || incoming.senderId === senderIdRef.current) return;
          if (!incoming.partial) return;
          const merged = applyStatePatch(stateRef.current, incoming.partial);
          if (merged) {
            lastRealtimeSyncAtRef.current = Date.now();
            onRemoteUpdate(merged);
          }
        },
      )
      .on(
        'broadcast',
        { event: 'state-full' },
        ({ payload }) => {
          const incoming = payload as {
            senderId?: string;
            state?: GameState;
          };
          if (!incoming || incoming.senderId === senderIdRef.current) return;
          if (!incoming.state || !isValidGameState(incoming.state)) return;
          if (shouldAcceptRemote(stateRef.current, incoming.state)) {
            lastRealtimeSyncAtRef.current = Date.now();
            onRemoteUpdate(incoming.state);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const remote = payload.new?.trivia_state as GameState | undefined;
          if (remote && isValidGameState(remote) && shouldAcceptRemote(stateRef.current, remote)) {
            lastRealtimeSyncAtRef.current = Date.now();
            onRemoteUpdate(remote);
          }
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [matchId, onRemoteUpdate]);

  // ── Atomic game data merge via RPC (server-side FOR UPDATE lock) ────
  const updateGameData = useCallback(
    async (
      gameKey: string,
      partial: Partial<GameData>,
      replacePlayerData = false,
    ): Promise<{ merged: GameState | null; error: string | null }> => {
      const channel = channelRef.current;
      if (channel) {
        void channel.send({
          type: 'broadcast',
          event: 'game-patch',
          payload: {
            senderId: senderIdRef.current,
            gameKey,
            partial,
            replacePlayerData,
          },
        });
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc('merge_game_data', {
        p_match_id: matchId,
        p_game_key: gameKey,
        p_partial: partial as unknown as Record<string, unknown>,
        p_replace_player_data: replacePlayerData,
      });

      if (error) {
        console.error('[game-sync] merge_game_data failed:', error.message);
        return { merged: null, error: 'שגיאה בשמירה. נסה שוב.' };
      }
      if (!isValidGameState(data)) {
        return { merged: null, error: 'התקבל מצב משחק לא תקין.' };
      }
      if (channel) {
        void channel.send({
          type: 'broadcast',
          event: 'state-full',
          payload: {
            senderId: senderIdRef.current,
            state: data as GameState,
          },
        });
      }
      return { merged: data as GameState, error: null };
    },
    [matchId],
  );

  // ── Atomic top-level state advance via RPC ──────────────────────────
  const updateGameState = useCallback(
    async (
      partial: Partial<GameState>,
    ): Promise<{ merged: GameState | null; error: string | null }> => {
      const channel = channelRef.current;
      if (channel) {
        void channel.send({
          type: 'broadcast',
          event: 'state-patch',
          payload: {
            senderId: senderIdRef.current,
            partial,
          },
        });
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc('advance_game_state', {
        p_match_id: matchId,
        p_partial_state: partial as unknown as Record<string, unknown>,
      });

      if (error) {
        console.error('[game-sync] advance_game_state failed:', error.message);
        return { merged: null, error: 'שגיאה בשמירה. נסה שוב.' };
      }
      if (!isValidGameState(data)) {
        return { merged: null, error: 'התקבל מצב משחק לא תקין.' };
      }
      if (channel) {
        void channel.send({
          type: 'broadcast',
          event: 'state-full',
          payload: {
            senderId: senderIdRef.current,
            state: data as GameState,
          },
        });
      }
      return { merged: data as GameState, error: null };
    },
    [matchId],
  );

  return { updateGameData, updateGameState };
}

/**
 * Accept remote state if it differs from local.
 * Server-side merges guarantee the DB state is always the most complete.
 */
function shouldAcceptRemote(
  local: GameState | null,
  remote: GameState,
): boolean {
  if (!local) return true;
  // Guard against out-of-order realtime/poll updates that can rewind game progression.
  // currentGame should never move backwards once a client already advanced.
  if (remote.currentGame < local.currentGame) return false;
  if (getPhaseRank(remote.phase) < getPhaseRank(local.phase)) return false;

  const activeGameKey = String(local.currentGame);
  const localActiveGame = local.games[activeGameKey];
  const remoteActiveGame = remote.games[activeGameKey];
  if (localActiveGame && remoteActiveGame) {
    if (getRound(remoteActiveGame.playerData) < getRound(localActiveGame.playerData)) return false;
    if (getStatusRank(remoteActiveGame.status) < getStatusRank(localActiveGame.status)) return false;
  }

  if (local.phase === 'completed' && remote.phase !== 'completed') return false;
  return JSON.stringify(local) !== JSON.stringify(remote);
}

function getRound(playerData: GameData['playerData'] | undefined): number {
  const roundValue = playerData?.__state?.round;
  const parsedRound = Number(roundValue);
  return Number.isFinite(parsedRound) ? parsedRound : 0;
}

function getPhaseRank(phase: GameState['phase']): number {
  const phaseRanks: Record<GameState['phase'], number> = {
    lobby: 0,
    playing: 1,
    choosing: 2,
    completed: 3,
  };
  return phaseRanks[phase];
}

function getStatusRank(status: GameData['status']): number {
  const statusRanks: Record<GameData['status'], number> = {
    pending: 0,
    playing: 1,
    choosing: 2,
    done: 3,
  };
  return statusRanks[status];
}

function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  if (typeof state.currentGame !== 'number') return false;
  if (typeof state.phase !== 'string') return false;
  if (!state.games || typeof state.games !== 'object') return false;
  return true;
}

function applyGamePatch(
  local: GameState | null,
  gameKey: string,
  partial: Partial<GameData>,
  replacePlayerData: boolean,
): GameState | null {
  if (!local || !local.games?.[gameKey]) return local;
  const currentGame = local.games[gameKey];
  const mergedPlayerData = partial.playerData
    ? (replacePlayerData
      ? partial.playerData
      : { ...currentGame.playerData, ...partial.playerData })
    : currentGame.playerData;
  const merged: GameState = {
    ...local,
    games: {
      ...local.games,
      [gameKey]: {
        ...currentGame,
        ...partial,
        playerData: mergedPlayerData,
      },
    },
  };
  return shouldAcceptRemote(local, merged) ? merged : local;
}

function applyStatePatch(
  local: GameState | null,
  partial: Partial<GameState>,
): GameState | null {
  if (!local) return local;
  const mergedGames = partial.games
    ? { ...local.games, ...partial.games }
    : local.games;
  const merged: GameState = {
    ...local,
    ...partial,
    games: mergedGames,
    datePlan: partial.datePlan ? { ...local.datePlan, ...partial.datePlan } : local.datePlan,
    finalDecision: partial.finalDecision ? { ...local.finalDecision, ...partial.finalDecision } : local.finalDecision,
  };
  return shouldAcceptRemote(local, merged) ? merged : local;
}
