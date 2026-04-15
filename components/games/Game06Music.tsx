'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';

// Song hints using emoji sequences + partial titles
const SONGS = [
  { hint: '🌅 _____ של שמש', answer: 'שדות', options: ['שדות', 'ים', 'אור', 'חלום'], artist: 'שלום חנוך' },
  { hint: '🌹 _____ אדומה', answer: 'שושנה', options: ['שושנה', 'פרח', 'ורד', 'רוח'], artist: 'זוהר ארגוב' },
  { hint: '💃 _____ על המים', answer: 'רוקדים', options: ['רוקדים', 'שטים', 'חולמים', 'עפים'], artist: 'עידן רייכל' },
  { hint: '🌙 _____ בגליל', answer: 'לילה', options: ['לילה', 'יום', 'בוקר', 'ערב'], artist: 'אריק איינשטיין' },
  { hint: '🚂 _____ האחרונה', answer: 'הרכבת', options: ['הרכבת', 'המכונית', 'הדרך', 'התחנה'], artist: 'שלמה ארצי' },
  { hint: '🏠 _____ הלבן', answer: 'הבית', options: ['הבית', 'הגדר', 'הענן', 'הציפור'], artist: 'עומר אדם' },
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

export default function Game06Music({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const [showHint, setShowHint] = useState(false);
  const completedRef = useRef(false);
  const resetPendingRef = useRef(false);

  const songIdx = Math.abs(hashCode(matchId + '6')) % SONGS.length;
  const song = SONGS[songIdx];

  const myAnswer = gameData.playerData[userId]?.answer as string | undefined;
  const otherAnswer = gameData.playerData[otherUserId]?.answer as string | undefined;

  // Show hint after a short delay
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 500);
    return () => clearTimeout(t);
  }, []);

  const handleGuess = async (guess: string) => {
    if (myAnswer !== undefined) return;

    // Send only own data — RPC merges without overwriting other player
    await onUpdate({
      playerData: {
        [userId]: { answer: guess, timestamp: Date.now() },
      },
    });
  };

  // Determine winner
  useEffect(() => {
    if (gameData.status !== 'playing' || completedRef.current) return;

    const myCorrect = myAnswer === song.answer;
    const otherCorrect = otherAnswer === song.answer;

    const complete = (winnerId: string) => {
      completedRef.current = true;
      setTimeout(() => onComplete(winnerId), 1500);
    };

    if (myCorrect && otherCorrect) {
      const myTime = (gameData.playerData[userId]?.timestamp as number) ?? Infinity;
      const otherTime = (gameData.playerData[otherUserId]?.timestamp as number) ?? Infinity;
      complete(myTime <= otherTime ? userId : otherUserId);
    } else if (myCorrect && otherAnswer !== undefined) {
      // I'm right, other answered wrong
      complete(userId);
    } else if (otherCorrect && myAnswer !== undefined) {
      // Other is right, I answered wrong
      complete(otherUserId);
    } else if (myAnswer !== undefined && otherAnswer !== undefined && !myCorrect && !otherCorrect) {
      // No winner yet: both wrong. Reset this round and let both answer again.
      if (resetPendingRef.current) return;
      resetPendingRef.current = true;
      setTimeout(async () => {
        resetPendingRef.current = false;
        await onUpdate({ playerData: {} });
      }, 1200);
    }
  }, [myAnswer, otherAnswer, song, gameData, userId, otherUserId, onComplete]);

  // Shuffle options
  const shuffled = [...song.options].sort((a, b) => hashCode(a + matchId) - hashCode(b + matchId));

  const myCorrect = myAnswer === song.answer;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500 mb-4 text-center">
        השלימו את שם השיר — הראשון שמזהה מנצח!
      </p>

      {/* Song hint */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 p-6 mb-6 w-full text-center"
        >
          <p className="text-2xl font-black text-gray-900 leading-relaxed mb-2">
            {song.hint}
          </p>
          <p className="text-xs text-gray-400">{song.artist}</p>
        </motion.div>
      )}

      {/* Options */}
      {myAnswer === undefined && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {shuffled.map((opt) => (
            <motion.button
              key={opt}
              onClick={() => handleGuess(opt)}
              whileTap={{ scale: 0.95 }}
              className="py-3 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-purple-400 transition-all"
            >
              {opt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {myAnswer !== undefined && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className={`text-lg font-bold ${myCorrect ? 'text-green-600' : 'text-red-500'}`}>
            {myCorrect ? 'נכון! 🎵' : 'לא... 😅'}
          </p>
          {otherAnswer === undefined && (
            <>
              <div className="w-6 h-6 border-2 border-purple-300 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
              <p className="text-xs text-gray-400 mt-1">ממתינים...</p>
            </>
          )}
        </motion.div>
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
