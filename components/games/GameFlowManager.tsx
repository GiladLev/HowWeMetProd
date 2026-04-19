'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameSync } from './useGameSync';
import GameShell from './GameShell';
import Game01RPS from './Game01RPS';
import Game02Trivia from './Game02Trivia';
import Game03Bomb from './Game03Bomb';
import Game04Food from './Game04Food';
import Game05ThisOrThat from './Game05ThisOrThat';
import Game06Music from './Game06Music';
import Game07ClickWar from './Game07ClickWar';
import Game08Taboo from './Game08Taboo';
import Game09Roulette from './Game09Roulette';
import Game10BlindDraw from './Game10BlindDraw';
import type { GameState, GameData, DatePlan, LiveEventMeta } from '../../types';
import { GAME_TO_PLAN_KEY } from '../../types';

interface GameFlowManagerProps {
  matchId: string;
  userId: string;
  otherUserId: string;
  otherUserName?: string;
  initialGameState: GameState;
  onAllGamesComplete: (datePlan: DatePlan) => void;
}

const ACTIVE_GAME_SEQUENCE = [5] as const;
const FIRST_ACTIVE_GAME = ACTIVE_GAME_SEQUENCE[0];

const GAME_COMPONENTS: Record<number, React.ComponentType<{
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}>> = {
  1: Game01RPS,
  2: Game02Trivia,
  3: Game03Bomb,
  4: Game04Food,
  5: Game05ThisOrThat,
  6: Game06Music,
  7: Game07ClickWar,
  8: Game08Taboo,
  9: Game09Roulette,
  10: Game10BlindDraw,
};

export default function GameFlowManager({
  matchId,
  userId,
  otherUserId,
  otherUserName,
  initialGameState,
  onAllGamesComplete,
}: GameFlowManagerProps) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [dbError, setDbError] = useState('');

  const handleRemoteUpdate = useCallback((remote: GameState) => {
    setGameState(remote);
  }, []);

  const { updateGameData, updateGameState } = useGameSync(matchId, gameState, handleRemoteUpdate);

  const currentGame = gameState.currentGame;
  const currentGameData = gameState.games[String(currentGame)];
  const GameComponent = GAME_COMPONENTS[currentGame];

  const withLiveMeta = useCallback((partial: Partial<GameData>, event: LiveEventMeta['event']) => {
    const currentPlayerData = partial.playerData ?? {};
    return {
      ...partial,
      playerData: {
        ...currentPlayerData,
        _live: {
          event,
          by: userId,
          at: new Date().toISOString(),
          gameNumber: currentGame,
        } as unknown as Record<string, string | number | boolean | null>,
      },
    };
  }, [userId, currentGame]);

  useEffect(() => {
    if (gameState.phase !== 'lobby') return;
    const startedAt = new Date().toISOString();
    const startPartial: Partial<GameState> = {
      currentGame: FIRST_ACTIVE_GAME,
      phase: 'playing',
      games: {
        [String(FIRST_ACTIVE_GAME)]: {
          status: 'playing',
          startedAt,
        } as GameData,
      },
    };
    void (async () => {
      const { merged, error } = await updateGameState(startPartial);
      if (error) {
        setDbError(error);
      } else if (merged) {
        setGameState(merged);
      }
    })();
  }, [gameState.phase, updateGameState]);

  // ── Update current game's data (player moves) ──────────────────────
  const handleGameUpdate = useCallback(
    async (partial: Partial<GameData>) => {
      const key = String(currentGame);

      const isStartEvent =
        gameState.games[key]?.startedAt === null ||
        partial.startedAt !== undefined ||
        gameState.games[key]?.playerData?._live === undefined;
      const partialWithMeta = withLiveMeta(partial, isStartEvent ? 'start' : 'progress');

      // Optimistic local update
      const optimistic: GameState = {
        ...gameState,
        games: {
          ...gameState.games,
          [key]: { ...gameState.games[key], ...partialWithMeta },
        },
      };
      setGameState(optimistic);

      // Check if this is a playerData reset (e.g., tie in RPS)
      const isReset = partial.playerData && Object.keys(partial.playerData).length === 0;

      // Atomic server merge
      const { merged, error } = await updateGameData(key, partialWithMeta, isReset);
      if (error) {
        setDbError(error);
      } else if (merged) {
        setGameState(merged);
      }
    },
    [gameState, currentGame, updateGameData, withLiveMeta],
  );

  // ── Game finished — winner determined, move to choosing phase ───────
  const handleGameComplete = useCallback(
    async (winnerId: string) => {
      const key = String(currentGame);

      const completePayload = withLiveMeta({ status: 'choosing', winnerId }, 'finish');

      // Optimistic local update
      setGameState(prev => ({
        ...prev,
        phase: 'completed',
        games: {
          ...prev.games,
          [key]: { ...prev.games[key], ...completePayload, status: 'done' },
        },
      }));

      // Atomic: update game data for final state
      await updateGameData(key, { ...completePayload, status: 'done' });

      // Atomic: advance phase and unlock regular chat
      const { merged, error } = await updateGameState({
        phase: 'completed',
        finalDecision: { [userId]: 'date', [otherUserId]: 'date' },
      });
      if (error) {
        setDbError(error);
      } else if (merged) {
        setGameState(merged);
      }
      onAllGamesComplete(gameState.datePlan);
    },
    [currentGame, updateGameData, updateGameState, withLiveMeta, onAllGamesComplete, gameState.datePlan, userId, otherUserId],
  );

  // ── Winner chose an option — advance to next game ──────────────────
  const handleChoose = useCallback(
    async (option: string) => {
      const key = String(currentGame);
      const planKey = GAME_TO_PLAN_KEY[currentGame];
      const currentSequenceIndex = ACTIVE_GAME_SEQUENCE.indexOf(currentGame as (typeof ACTIVE_GAME_SEQUENCE)[number]);
      const isLastGame = currentSequenceIndex === -1 || currentSequenceIndex === ACTIVE_GAME_SEQUENCE.length - 1;
      const nextGame = isLastGame ? currentGame : ACTIVE_GAME_SEQUENCE[currentSequenceIndex + 1];

      // Optimistic local update
      const optimisticGames = { ...gameState.games };
      optimisticGames[key] = { ...optimisticGames[key], status: 'done' as const, chosenOption: option };
      if (!isLastGame) {
        optimisticGames[String(nextGame)] = {
          ...optimisticGames[String(nextGame)],
          status: 'playing' as const,
          startedAt: new Date().toISOString(),
        };
      }
      const optimisticPlan = { ...gameState.datePlan, [planKey]: option };

      setGameState(prev => ({
        ...prev,
        currentGame: isLastGame ? currentGame : nextGame,
        phase: isLastGame ? 'completed' : 'playing',
        games: optimisticGames,
        datePlan: optimisticPlan,
      }));

      // Atomic: mark current game done
      await updateGameData(key, { status: 'done', chosenOption: option });

      // Build the state transition
      const statePartial: Partial<GameState> = {
        currentGame: isLastGame ? currentGame : nextGame,
        phase: isLastGame ? 'completed' : 'playing',
        datePlan: { ...gameState.datePlan, [planKey]: option },
      };

      // If not last game, also start next game
      if (!isLastGame) {
        statePartial.games = {
          [String(nextGame)]: {
            status: 'playing',
            startedAt: new Date().toISOString(),
          } as GameData,
        };
      }

      const { merged, error } = await updateGameState(statePartial);
      if (error) {
        setDbError(error);
      } else if (merged) {
        setGameState(merged);
      }

      if (isLastGame) {
        onAllGamesComplete(optimisticPlan);
      }
    },
    [gameState, currentGame, updateGameData, updateGameState, onAllGamesComplete],
  );

  if (!GameComponent || !currentGameData) return null;

  return (
    <div className="flex flex-col h-full font-sans">
      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 text-xs text-red-600 text-center">
          {dbError}
        </div>
      )}

      <AnimatePresence mode="wait">
        <GameShell
          key={currentGame}
          gameNumber={currentGame}
          gameData={currentGameData}
          winnerId={currentGameData.winnerId}
          userId={userId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          onChoose={handleChoose}
        >
          <GameComponent
            matchId={matchId}
            userId={userId}
            otherUserId={otherUserId}
            gameNumber={currentGame}
            gameData={currentGameData}
            onUpdate={handleGameUpdate}
            onComplete={handleGameComplete}
          />
        </GameShell>
      </AnimatePresence>
    </div>
  );
}
