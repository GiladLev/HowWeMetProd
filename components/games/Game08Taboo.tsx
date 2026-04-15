'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

// Things that annoy people — one player picks, other guesses
const ANNOYANCE_OPTIONS = [
  { id: 'phone', label: 'כשמשתמשים בטלפון באמצע שיחה', emoji: '📱' },
  { id: 'late', label: 'איחורים', emoji: '⏰' },
  { id: 'chew', label: 'אכילה רועשת', emoji: '🍽️' },
  { id: 'brag', label: 'התרברבות', emoji: '🗣️' },
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

export default function Game08Taboo({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [resultText, setResultText] = useState('');
  const completedRef = useRef(false);
  const playerData = gameData.playerData ?? {};
  const MAX_ATTEMPTS = 3;

  // Round 1 picker is deterministic, round 2 swaps roles
  const basePickerId = pickDeterministicPlayer(userId, otherUserId, `${matchId}:8:picker`);
  const roundState = (playerData.__state ?? {}) as {
    round?: number;
    rounds?: Record<string, {
      pickerId?: string;
      choice?: string;
      guesses?: string[];
      startedAt?: number;
      solvedMs?: number | null;
      completed?: boolean;
    }>;
  };
  const round = roundState.round === 2 ? 2 : 1;
  const roundKey = String(round);
  const rounds = roundState.rounds ?? {};
  const currentRound = rounds[roundKey] ?? {};
  const pickerId = currentRound.pickerId ?? (round === 1 ? basePickerId : (basePickerId === userId ? otherUserId : userId));
  const guesserId = pickerId === userId ? otherUserId : userId;
  const iAmPicker = pickerId === userId;

  const pickerChoice = currentRound.choice;
  const guesserGuesses = Array.isArray(currentRound.guesses) ? currentRound.guesses : [];
  const guesserGuess = guesserGuesses[guesserGuesses.length - 1];
  const attemptsUsed = guesserGuesses.length;
  const guessedCorrectly = !!pickerChoice && !!guesserGuess && pickerChoice === guesserGuess;
  const attemptsExhausted = attemptsUsed >= MAX_ATTEMPTS;
  const roundCompleted = currentRound.completed === true || guessedCorrectly || attemptsExhausted;

  // Picker chooses what annoys them
  const handlePick = async (choice: string) => {
    if (pickerChoice) return;
    const startedAt = Date.now();
    await onUpdate({
      playerData: {
        __state: {
          round,
          rounds: {
            [roundKey]: {
              pickerId,
              choice,
              guesses: [],
              startedAt,
              solvedMs: null,
              completed: false,
            },
          },
        },
      },
    });
  };

  // Guesser tries to guess
  const handleGuess = async (guess: string) => {
    if (attemptsExhausted) return;
    if (guesserGuesses.includes(guess)) return;
    const nextGuesses = [...guesserGuesses, guess];
    const now = Date.now();
    const startedAt = currentRound.startedAt ?? now;
    const solveMs = pickerChoice === guess ? Math.max(0, now - startedAt) : null;
    await onUpdate({
      playerData: {
        __state: {
          round,
          rounds: {
            [roundKey]: {
              pickerId,
              choice: pickerChoice,
              guesses: nextGuesses,
              startedAt,
              solvedMs: solveMs,
              completed: pickerChoice === guess || nextGuesses.length >= MAX_ATTEMPTS,
            },
          },
        },
      },
    });
  };

  // Round transition + final resolution
  useEffect(() => {
    if (!pickerChoice || !guesserGuess || !roundCompleted || gameData.status !== 'playing') return;
    if (revealed) return;

    setRevealed(true);
    const roundSolveMs = guessedCorrectly ? currentRound.solvedMs : null;
    if (guessedCorrectly && typeof roundSolveMs === 'number') {
      setResultText(`פגיעה! ניחוש נכון תוך ${(roundSolveMs / 1000).toFixed(2)} שניות`);
    } else {
      setResultText('לא הצלחתם לפגוע בסבב הזה');
    }

    const timer = setTimeout(async () => {
      if (round === 1) {
        await onUpdate({
          playerData: {
            __state: {
              round: 2,
            },
          },
        });
        setRevealed(false);
        return;
      }

      if (completedRef.current) return;
      completedRef.current = true;

      const round1 = rounds['1'] ?? {};
      const round2 = rounds['2'] ?? {};
      const round1Picker = round1.pickerId ?? basePickerId;
      const round1Guesser = round1Picker === userId ? otherUserId : userId;
      const round2Picker = round2.pickerId ?? (round1Picker === userId ? otherUserId : userId);
      const round2Guesser = round2Picker === userId ? otherUserId : userId;
      const round1Ms = typeof round1.solvedMs === 'number' ? round1.solvedMs : null;
      const round2Ms = typeof round2.solvedMs === 'number' ? round2.solvedMs : null;

      let winnerId: string;
      if (round1Ms !== null && round2Ms !== null) {
        winnerId = round1Ms < round2Ms ? round1Guesser : round2Ms < round1Ms ? round2Guesser : pickDeterministicPlayer(userId, otherUserId, `${matchId}:8:tiebreak`);
      } else if (round1Ms !== null) {
        winnerId = round1Guesser;
      } else if (round2Ms !== null) {
        winnerId = round2Guesser;
      } else {
        winnerId = pickDeterministicPlayer(userId, otherUserId, `${matchId}:8:none-solved`);
      }

      onComplete(winnerId);
    }, 1700);

    return () => clearTimeout(timer);
  }, [
    pickerChoice,
    guesserGuess,
    roundCompleted,
    gameData.status,
    guessedCorrectly,
    currentRound.solvedMs,
    revealed,
    round,
    rounds,
    basePickerId,
    userId,
    otherUserId,
    matchId,
    onComplete,
    onUpdate,
  ]);

  useEffect(() => {
    if (!pickerChoice || !guesserGuess || !roundCompleted) return;
    if (gameData.status !== 'playing') return;
  }, [pickerChoice, guesserGuess, roundCompleted, gameData.status]);

  // ── Picker view: choose what annoys you ────────────────────────────
  if (iAmPicker && !pickerChoice) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-3">🤔</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2">משחק 8 - סבב {round}/2</h3>
        <p className="text-sm text-gray-500 mb-6 text-center">
          בסבב הזה את/ה עונה, והצד השני מנחש.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {ANNOYANCE_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => handlePick(opt.id)}
              whileTap={{ scale: 0.97 }}
              className="py-3 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-blue-300 transition-all flex items-center gap-3"
            >
              <span className="text-xl">{opt.emoji}</span>
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Picker waiting for guesser ────────────────────────────────────
  if (iAmPicker && pickerChoice && !roundCompleted) {
    const chosen = ANNOYANCE_OPTIONS.find(o => o.id === pickerChoice);
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-3">🤐</span>
        <p className="text-xs text-blue-500 mb-2">סבב {round}/2</p>
        <p className="text-sm text-gray-700 mb-2">בחרת: <strong>{chosen?.label}</strong></p>
        <p className="text-sm text-gray-400 mb-2">ממתינים שהחבר/ה ינחש...</p>
        <p className="text-xs text-blue-500 mb-4">ניסיון {Math.min(attemptsUsed + 1, MAX_ATTEMPTS)} מתוך {MAX_ATTEMPTS}</p>
        <div className="w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Guesser: waiting for picker ───────────────────────────────────
  if (!iAmPicker && !pickerChoice) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-3">🤫</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2">משחק 8 - סבב {round}/2</h3>
        <p className="text-sm text-gray-400 mb-4">ממתינים שהחבר/ה יבחר/תבחר תשובה אמיתית...</p>
        <div className="w-8 h-8 border-3 border-blue-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Guesser: try to guess ─────────────────────────────────────────
  if (!iAmPicker && pickerChoice && !roundCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-3">🔮</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2">משחק 8 - סבב {round}/2</h3>
        <p className="text-sm text-gray-500 mb-6 text-center">
          נסה/י לגלות מהר את התשובה האמיתית. בסוף 2 הסבבים - המהיר/ה מנצח/ת.
        </p>
        <p className="text-xs text-blue-500 mb-3">ניסיון {attemptsUsed + 1} מתוך {MAX_ATTEMPTS}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {ANNOYANCE_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => handleGuess(opt.id)}
              disabled={guesserGuesses.includes(opt.id)}
              whileTap={{ scale: 0.97 }}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center gap-3 ${
                guesserGuesses.includes(opt.id)
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────
  if (revealed && pickerChoice && guesserGuess) {
    const pickerItem = ANNOYANCE_OPTIONS.find(o => o.id === pickerChoice);
    const guesserItem = ANNOYANCE_OPTIONS.find(o => o.id === guesserGuess);

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <span className="text-5xl block mb-3">{guessedCorrectly ? '🎯' : '❌'}</span>
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {resultText}
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 max-w-xs">
            <p className="text-xs text-blue-500 mb-2">סבב {round}/2</p>
            <p className="text-xs text-blue-500 mb-2">ניסיונות: {attemptsUsed}/{MAX_ATTEMPTS}</p>
            <p className="text-sm text-gray-600">
              <strong>התשובה:</strong> {pickerItem?.emoji} {pickerItem?.label}
            </p>
            {!guessedCorrectly && (
              <p className="text-sm text-gray-400 mt-1">
                <strong>הניחוש:</strong> {guesserItem?.emoji} {guesserItem?.label}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

