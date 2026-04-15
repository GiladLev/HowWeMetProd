'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';

// Food items with blurred images (using emoji + text-based approach)
const FOOD_ITEMS = [
  { name: 'פיצה', emoji: '🍕', options: ['פיצה', 'קיש', 'טוסט', 'לחמניה'] },
  { name: 'סושי', emoji: '🍣', options: ['סושי', 'אורז', 'דגים', 'סלט'] },
  { name: 'המבורגר', emoji: '🍔', options: ['המבורגר', 'סטייק', 'פלאפל', 'שווארמה'] },
  { name: 'גלידה', emoji: '🍦', options: ['גלידה', 'מילקשייק', 'פודינג', 'יוגורט'] },
  { name: 'פסטה', emoji: '🍝', options: ['פסטה', 'אורז', 'נודלס', 'קוסקוס'] },
  { name: 'פלאפל', emoji: '🧆', options: ['פלאפל', 'קציצות', 'כדורי שוקולד', 'כיבה'] },
];

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game04Food({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const foodIdx = Math.abs(hashCode(matchId + '4')) % FOOD_ITEMS.length;
  const food = FOOD_ITEMS[foodIdx];

  const [blur, setBlur] = useState(40);
  const [revealed, setRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const completedRef = useRef(false);
  const resetPendingRef = useRef(false);

  const myAnswer = gameData.playerData[userId]?.answer as string | undefined;
  const otherAnswer = gameData.playerData[otherUserId]?.answer as string | undefined;
  const myCorrect = myAnswer === food.name;
  const otherCorrect = otherAnswer === food.name;

  // Gradually unblur
  useEffect(() => {
    if (revealed || myAnswer !== undefined) return;
    intervalRef.current = setInterval(() => {
      setBlur(prev => {
        if (prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 150);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [revealed, myAnswer]);

  const handleGuess = async (guess: string) => {
    if (myAnswer !== undefined) return;

    // Send only own data — RPC merges without overwriting other player
    await onUpdate({
      playerData: {
        [userId]: { answer: guess, timestamp: Date.now() },
      },
    });

    // Wrong guess — nothing happens, they see it's wrong
    // Right guess — they see success, wait for other
  };

  // Check for winner when both answered or one got it right
  const bothAnswered = myAnswer !== undefined && otherAnswer !== undefined;

  useEffect(() => {
    if (gameData.status !== 'playing' || completedRef.current) return;

    // If one player got it right and other hasn't answered or got it wrong
    if (myCorrect && (otherAnswer === undefined || !otherCorrect)) {
      completedRef.current = true;
      setRevealed(true);
      setTimeout(() => onComplete(userId), 1500);
      return;
    }
    if (otherCorrect && (myAnswer === undefined || !myCorrect)) {
      completedRef.current = true;
      setRevealed(true);
      setTimeout(() => onComplete(otherUserId), 1500);
      return;
    }

    // Both answered correctly — compare timestamps
    if (bothAnswered && myCorrect && otherCorrect) {
      completedRef.current = true;
      setRevealed(true);
      const myTime = (gameData.playerData[userId]?.timestamp as number) ?? Infinity;
      const otherTime = (gameData.playerData[otherUserId]?.timestamp as number) ?? Infinity;
      setTimeout(() => onComplete(myTime <= otherTime ? userId : otherUserId), 1500);
      return;
    }

    // Both wrong — reset for another try (idempotent, GameFlowManager detects empty playerData)
    if (bothAnswered && !myCorrect && !otherCorrect && !resetPendingRef.current) {
      resetPendingRef.current = true;
      setTimeout(async () => {
        resetPendingRef.current = false;
        await onUpdate({ playerData: {} });
      }, 1500);
    }
  }, [myAnswer, otherAnswer, myCorrect, otherCorrect, bothAnswered, gameData, userId, otherUserId, onComplete, onUpdate]);

  // Shuffle options deterministically
  const shuffledOptions = [...food.options].sort((a, b) =>
    hashCode(a + matchId) - hashCode(b + matchId)
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500 mb-4 text-center">
        התמונה מתבהרת לאט — הראשון שמזהה מנצח!
      </p>

      {/* Blurred food display */}
      <div className="relative w-40 h-40 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center mb-6 overflow-hidden">
        <span
          className="text-8xl transition-all duration-300"
          style={{ filter: `blur(${blur}px)` }}
        >
          {food.emoji}
        </span>
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/80 flex items-center justify-center"
          >
            <span className="text-7xl">{food.emoji}</span>
          </motion.div>
        )}
      </div>

      {/* Answer buttons */}
      {!revealed && myAnswer === undefined && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {shuffledOptions.map((opt) => (
            <motion.button
              key={opt}
              onClick={() => handleGuess(opt)}
              whileTap={{ scale: 0.95 }}
              className="py-3 px-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-blue-300 transition-all"
            >
              {opt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {myAnswer !== undefined && !revealed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          {myCorrect ? (
            <p className="text-lg font-bold text-green-600">נכון! 🎉</p>
          ) : (
            <p className="text-lg font-bold text-red-500">לא נכון... 😅</p>
          )}
          {!otherAnswer && (
            <div className="mt-2">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-1">ממתינים...</p>
            </div>
          )}
        </motion.div>
      )}

      {revealed && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-blue-600"
        >
          זה {food.name}! {food.emoji}
        </motion.p>
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
