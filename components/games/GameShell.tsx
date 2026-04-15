'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GAME_TITLES, GAME_OPTIONS, type GameData } from '../../types';

interface GameShellProps {
  gameNumber: number;
  gameData: GameData;
  winnerId: string | null;
  userId: string;
  otherUserId: string;
  otherUserName?: string;
  onChoose: (option: string) => void;
  children: React.ReactNode;
}

export default function GameShell({
  gameNumber,
  gameData,
  winnerId,
  userId,
  otherUserId,
  otherUserName,
  onChoose,
  children,
}: GameShellProps) {
  const meta    = GAME_TITLES[gameNumber];
  const options = GAME_OPTIONS[gameNumber];

  const isWinner   = !!winnerId && winnerId === userId;
  const isLoser    = !!winnerId && winnerId === otherUserId;
  const isChoosing = gameData.status === 'choosing';
  const winnerName = isLoser ? (otherUserName ?? 'השני') : 'את/ה';

  return (
    <motion.div
      key={`game-${gameNumber}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full px-4 pb-4 font-sans"
    >
      <div className="rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-100/50 p-4 sm:p-5 h-full flex flex-col overflow-hidden">
        <div className="flex justify-center mb-4">
          <span className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
            מתחילים להכיר...
          </span>
        </div>

        {/* ── Title ─────────────────────────────────────────── */}
        <div className="text-center mb-4">
          <span className="text-3xl mb-1 block">{meta?.emoji}</span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{meta?.title}</h2>
        </div>

        {/* ── Game content OR choosing phase ────────────────── */}
        <AnimatePresence mode="wait">
          {isChoosing ? (
            <motion.div
              key="choosing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-4 rounded-2xl bg-gradient-to-b from-blue-50/70 to-white border border-blue-100/80"
            >
              {isWinner ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="text-5xl mb-3"
                  >
                    🏆
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-bold tracking-tight text-gray-900 mb-1"
                  >
                    ניצחת! 🎉
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-gray-500 mb-6"
                  >
                    הפריבילגיה שלך - תבחר/י:
                  </motion.p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {options?.map((option, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        onClick={() => onChoose(option)}
                        whileTap={{ scale: 0.97 }}
                        className="py-3.5 px-4 rounded-2xl bg-white border-2 border-blue-200 text-sm font-bold text-gray-800 hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </>

              ) : isLoser ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="text-5xl mb-3"
                  >
                    😅
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-bold tracking-tight text-gray-900 mb-1"
                  >
                    {winnerName} ניצח/ה
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-gray-400 mb-6"
                  >
                    {winnerName} בוחר/ת עכשיו...
                  </motion.p>
                  <div className="mt-2 w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full animate-spin" />
                </>

              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">קובעים מנצח...</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
