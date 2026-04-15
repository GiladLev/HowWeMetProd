'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';

// Quick trivia questions pool
const TRIVIA_QUESTIONS = [
  { q: 'איזו חיה ישנה הכי הרבה שעות ביום?', options: ['קואלה', 'חתול', 'עטלף', 'עצלן'], correct: 0 },
  { q: 'כמה עצמות יש בגוף האדם הבוגר?', options: ['206', '186', '256', '176'], correct: 0 },
  { q: 'מה הצבע הנדיר ביותר בדגלי מדינות?', options: ['סגול', 'ורוד', 'חום', 'כתום'], correct: 0 },
  { q: 'באיזו מדינה המציאו את הגלידה?', options: ['סין', 'איטליה', 'צרפת', 'ארה"ב'], correct: 0 },
  { q: 'מה המהירות המקסימלית של דולפין?', options: ['60 קמ"ש', '40 קמ"ש', '80 קמ"ש', '30 קמ"ש'], correct: 0 },
  { q: 'כמה לבבות יש לתמנון?', options: ['3', '2', '4', '1'], correct: 0 },
  { q: 'מה המדינה הקטנה ביותר בעולם?', options: ['ותיקן', 'מונקו', 'סן מרינו', 'ליכטנשטיין'], correct: 0 },
  { q: 'באיזו שנה הומצא האינטרנט?', options: ['1983', '1990', '1975', '1995'], correct: 0 },
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

export default function Game02Trivia({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  // Pick a deterministic question based on matchId
  const qIdx = Math.abs(hashCode(matchId)) % TRIVIA_QUESTIONS.length;
  const question = TRIVIA_QUESTIONS[qIdx];
  const playerData = gameData.playerData ?? {};

  const myAnswer = playerData[userId]?.answer as number | undefined;
  const otherAnswer = playerData[otherUserId]?.answer as number | undefined;
  const myTimestamp = playerData[userId]?.timestamp as number | undefined;
  const otherTimestamp = playerData[otherUserId]?.timestamp as number | undefined;

  const bothAnswered = myAnswer !== undefined && otherAnswer !== undefined;

  const completedRef = useRef(false);

  const handleAnswer = async (answerIdx: number) => {
    if (myAnswer !== undefined) return;
    setSelected(answerIdx);

    // Send only own data — RPC merges without overwriting other player
    await onUpdate({
      playerData: {
        [userId]: { answer: answerIdx, timestamp: Date.now() },
      },
    });
  };

  // Determine winner when both answered — in useEffect to avoid firing on every render
  useEffect(() => {
    if (!bothAnswered || gameData.status !== 'playing' || completedRef.current) return;
    completedRef.current = true;

    const myCorrect = myAnswer === question.correct;
    const otherCorrect = otherAnswer === question.correct;

    let winnerId: string;
    if (myCorrect && !otherCorrect) winnerId = userId;
    else if (!myCorrect && otherCorrect) winnerId = otherUserId;
    else {
      // Both correct or both wrong — faster answerer wins
      winnerId = (myTimestamp ?? Infinity) <= (otherTimestamp ?? Infinity) ? userId : otherUserId;
    }

    setTimeout(() => onComplete(winnerId), 1500);
  }, [bothAnswered, gameData.status, myAnswer, otherAnswer, myTimestamp, otherTimestamp, question.correct, userId, otherUserId, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500 mb-2 text-center">הראשון שעונה נכון מנצח!</p>

      {/* Question */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-200 p-5 mb-6 w-full">
        <h3 className="text-lg font-bold text-gray-900 text-center leading-relaxed">
          {question.q}
        </h3>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {question.options.map((opt, i) => {
          const isMyAnswer = myAnswer === i;
          const isCorrect = bothAnswered && i === question.correct;
          const isWrong = bothAnswered && (myAnswer === i || otherAnswer === i) && i !== question.correct;

          return (
            <motion.button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={myAnswer !== undefined}
              whileTap={{ scale: 0.97 }}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                isCorrect
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : isWrong
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : isMyAnswer
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : myAnswer !== undefined
                  ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Status */}
      <div className="mt-4 text-center">
        {myAnswer !== undefined && !bothAnswered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
            <p className="text-xs text-gray-400">ממתינים לתשובת החבר/ה...</p>
          </motion.div>
        )}
        {bothAnswered && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-blue-600"
          >
            {myAnswer === question.correct ? 'תשובה נכונה! 🎉' : 'טעות... 😅'}
          </motion.p>
        )}
      </div>
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
