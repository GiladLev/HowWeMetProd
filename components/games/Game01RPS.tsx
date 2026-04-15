'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameData } from '../../types';

type RPSChoice = 'rock' | 'paper' | 'scissors';

const CHOICES: { id: RPSChoice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: 'אבן' },
  { id: 'paper', emoji: '✋', label: 'נייר' },
  { id: 'scissors', emoji: '✌️', label: 'מספרים' },
];

function getWinner(a: RPSChoice, b: RPSChoice): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie';
  if (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  ) return 'a';
  return 'b';
}

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game01RPS({
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  // Refs prevent the timer from being cancelled when onComplete/onUpdate change reference
  const actionFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myChoice = gameData.playerData?.[userId]?.choice as RPSChoice | undefined;
  const otherChoice = gameData.playerData?.[otherUserId]?.choice as RPSChoice | undefined;
  const bothChose = !!myChoice && !!otherChoice;

  const handleChoose = async (choice: RPSChoice) => {
    if (myChoice) return;
    await onUpdate({
      playerData: { [userId]: { choice } },
    });
  };

  useEffect(() => {
    if (!bothChose || actionFiredRef.current) return;
    actionFiredRef.current = true;

    const result = getWinner(myChoice!, otherChoice!);

    if (result === 'tie') {
      timerRef.current = setTimeout(async () => {
        actionFiredRef.current = false; // reset for next round
        await onUpdate({ playerData: {} });
      }, 2000);
    } else {
      const winnerId = result === 'a' ? userId : otherUserId;
      timerRef.current = setTimeout(() => {
        onComplete(winnerId);
      }, 1800);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothChose, myChoice, otherChoice]);

  const myChoiceEmoji = CHOICES.find(c => c.id === myChoice)?.emoji;
  const otherChoiceEmoji = CHOICES.find(c => c.id === otherChoice)?.emoji;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500 mb-6 text-center">
        כל אחד בוחר בסתר. האפליקציה חושפת יחד!
      </p>

      <AnimatePresence>
        {bothChose && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-8 mb-8"
          >
            <div className="text-center">
              <motion.span
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.6 }}
                className="text-6xl block"
              >
                {myChoiceEmoji}
              </motion.span>
              <p className="text-xs text-gray-400 mt-2">אתה</p>
            </div>
            <span className="text-2xl text-gray-300 font-black">VS</span>
            <div className="text-center">
              <motion.span
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl block"
              >
                {otherChoiceEmoji}
              </motion.span>
              <p className="text-xs text-gray-400 mt-2">חבר/ה</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bothChose && (() => {
        const result = getWinner(myChoice!, otherChoice!);
        if (result === 'tie') {
          return (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-yellow-600 mb-4"
            >
              תיקו! משחקים שוב...
            </motion.p>
          );
        }
        if (result === 'a') {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-1 mb-4"
            >
              <span className="text-3xl">🏆</span>
              <p className="text-lg font-bold text-green-600">ניצחת!</p>
            </motion.div>
          );
        }
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-1 mb-4"
          >
            <span className="text-3xl">😅</span>
            <p className="text-lg font-bold text-red-500">הפסדת...</p>
          </motion.div>
        );
      })()}

      {!bothChose && (
        <div className="flex gap-4">
          {CHOICES.map((c) => (
            <motion.button
              key={c.id}
              onClick={() => handleChoose(c.id)}
              disabled={!!myChoice}
              whileTap={{ scale: 0.9 }}
              className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                myChoice === c.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
                  : myChoice
                  ? 'border-gray-100 bg-gray-50 opacity-40'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <span className="text-4xl">{c.emoji}</span>
              <span className="text-xs font-bold text-gray-600">{c.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {myChoice && !otherChoice && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
          <div className="w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">ממתינים לבחירת החבר/ה...</p>
        </motion.div>
      )}
    </div>
  );
}