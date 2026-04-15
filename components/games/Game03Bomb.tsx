'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game03Bomb({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  // Deterministic fuse duration from matchId (8-15 seconds)
  const fuseDuration = useRef(8000 + (Math.abs(hashCode(matchId + '3')) % 7000));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [exploded, setExploded] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Who currently holds the bomb
  const holder = (gameData.playerData['bomb']?.holder as string) || userId;
  const passCount = (gameData.playerData['bomb']?.passCount as number) || 0;
  const gameStarted = gameData.playerData['bomb']?.started === true;
  const iAmHolding = holder === userId;

  // Start the game — first player initiates
  const handleStart = useCallback(async () => {
    if (gameStarted) return;
    const startHolder = pickDeterministicPlayer(userId, otherUserId, `${matchId}:3:startHolder`);
    startTimeRef.current = Date.now();
    await onUpdate({
      playerData: {
        bomb: {
          holder: startHolder,
          passCount: 0,
          started: true,
          startedAt: Date.now(),
        },
      },
    });
  }, [gameStarted, matchId, userId, otherUserId, onUpdate]);

  // Pass the bomb
  const handlePass = useCallback(async () => {
    if (!iAmHolding || exploded) return;
    const newHolder = holder === userId ? otherUserId : userId;
    await onUpdate({
      playerData: {
        bomb: {
          holder: newHolder,
          passCount: passCount + 1,
          started: true,
          startedAt: gameData.playerData['bomb']?.startedAt ?? Date.now(),
        },
      },
    });
  }, [iAmHolding, exploded, holder, userId, otherUserId, passCount, gameData, onUpdate]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted) return;

    const startedAt = (gameData.playerData['bomb']?.startedAt as number) || Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = fuseDuration.current - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        setExploded(true);
        clearInterval(interval);
        // The holder loses, other player wins — guard against both clients firing
        if (!completedRef.current) {
          completedRef.current = true;
          const currentHolder = (gameData.playerData['bomb']?.holder as string) || userId;
          const winnerId = currentHolder === userId ? otherUserId : userId;
          setTimeout(() => onComplete(winnerId), 1500);
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, gameData.playerData, userId, onComplete, fuseDuration]);

  // Not started yet
  if (!gameStarted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">💣</span>
        <p className="text-sm text-gray-500 mb-6 text-center">
          מעבירים פצצה מצד לצד.<br />
          על מי שהיא מתפוצצת — הוא המפסיד!
        </p>
        <motion.button
          onClick={handleStart}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-8 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors"
        >
          מתחילים!
        </motion.button>
      </div>
    );
  }

  const seconds = timeLeft !== null ? (timeLeft / 1000).toFixed(1) : '—';
  const urgency = timeLeft !== null && timeLeft < 3000;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      {/* Bomb animation */}
      <motion.div
        animate={
          exploded
            ? { scale: [1, 1.5, 0.5], opacity: [1, 1, 0] }
            : iAmHolding
            ? { scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }
            : {}
        }
        transition={
          exploded
            ? { duration: 0.5 }
            : { duration: 0.4, repeat: Infinity }
        }
        className="mb-4"
      >
        <span className={`text-7xl block ${urgency ? 'animate-pulse' : ''}`}>
          {exploded ? '💥' : '💣'}
        </span>
      </motion.div>

      {/* Timer */}
      <p className={`text-3xl font-bold tracking-tight mb-2 ${urgency ? 'text-red-500' : 'text-gray-700'}`}>
        {exploded ? 'בום!' : seconds}
      </p>

      {/* Status */}
      <p className="text-sm text-gray-500 mb-6">
        {exploded
          ? iAmHolding
            ? 'התפוצצה אצלך... 😬'
            : 'התפוצצה אצל החבר/ה! 🎉'
          : iAmHolding
          ? 'הפצצה אצלך! תעביר מהר! 😱'
          : 'הפצצה אצל החבר/ה... ממתינים 😎'}
      </p>

      {/* Pass button */}
      {!exploded && iAmHolding && (
        <motion.button
          onClick={handlePass}
          whileTap={{ scale: 0.9 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
          className="py-4 px-10 rounded-2xl bg-red-500 text-white font-bold tracking-tight text-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
        >
          העבר! 💨
        </motion.button>
      )}

      {!exploded && !iAmHolding && (
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
    </div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

