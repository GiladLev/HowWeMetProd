'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

const QUESTIONS = [
  // טבע וטיולים
  { q: 'חתולים או כלבים?',              a: 'חתולים',          b: 'כלבים',           emojiA: '🐱', emojiB: '🐶' },
  { q: 'ים או מעיין?',                   a: 'ים',              b: 'מעיין',           emojiA: '🌊', emojiB: '🏞️' },
  { q: 'זריחה או שקיעה?',               a: 'זריחה',           b: 'שקיעה',           emojiA: '🌅', emojiB: '🌇' },
  { q: 'חורף או קיץ?',                  a: 'חורף',            b: 'קיץ',             emojiA: '❄️', emojiB: '☀️' },
  { q: 'הרים מושלגים או אי טרופי?',     a: 'הרים מושלגים',   b: 'אי טרופי',        emojiA: '🏔️', emojiB: '🏝️' },
  { q: 'טיול בטבע או סיבוב בעיר?',     a: 'טיול בטבע',      b: 'סיבוב בעיר',      emojiA: '🥾', emojiB: '🏙️' },
  { q: 'קמפינג באוהל או מלון בוטיק?',  a: 'קמפינג באוהל',   b: 'מלון בוטיק',      emojiA: '⛺', emojiB: '🏨' },
  { q: 'פריחת הדובדבן או שלכת?',        a: 'פריחת הדובדבן',  b: 'שלכת',            emojiA: '🌸', emojiB: '🍂' },
  // אוכל ובילויים
  { q: 'בר או מסעדה?',                  a: 'בר',              b: 'מסעדה',           emojiA: '🍺', emojiB: '🍽️' },
  { q: 'פיצה או המבורגר?',              a: 'פיצה',            b: 'המבורגר',         emojiA: '🍕', emojiB: '🍔' },
  { q: 'מתוק או מלוח?',                 a: 'מתוק',            b: 'מלוח',            emojiA: '🍫', emojiB: '🥨' },
  { q: 'קפה או תה?',                    a: 'קפה',             b: 'תה',              emojiA: '☕', emojiB: '🍵' },
  { q: 'בישול בבית או משלוח?',          a: 'בישול בבית',      b: 'משלוח',           emojiA: '🍳', emojiB: '🛵' },
  { q: 'שוקולד חלב או שוקולד מריר?',   a: 'שוקולד חלב',     b: 'שוקולד מריר',     emojiA: '🍬', emojiB: '🍫' },
  { q: 'יין או בירה?',                  a: 'יין',             b: 'בירה',            emojiA: '🍷', emojiB: '🍺' },
  { q: 'ארוחת בוקר בחוץ או ארוחת ערב?', a: 'ארוחת בוקר',   b: 'ארוחת ערב',       emojiA: '🌅', emojiB: '🕯️' },
  { q: 'גלידה בגביע או בכוס?',          a: 'גביע',            b: 'כוס',             emojiA: '🍦', emojiB: '🍨' },
  { q: 'סושי או פסטה?',                 a: 'סושי',            b: 'פסטה',            emojiA: '🍣', emojiB: '🍝' },
  // בית ופנאי
  { q: 'ספר מודפס או ספר דיגיטלי?',    a: 'ספר מודפס',       b: 'ספר דיגיטלי',     emojiA: '📖', emojiB: '📱' },
  { q: 'נטפליקס במיטה או קולנוע?',     a: 'נטפליקס במיטה',  b: 'קולנוע',          emojiA: '🛋️', emojiB: '🎬' },
  { q: 'לקום מוקדם או לישון עד מאוחר?', a: 'לקום מוקדם',    b: 'לישון עד מאוחר', emojiA: '🌅', emojiB: '😴' },
  { q: 'מוזיקה רועשת או שקט מוחלט?',   a: 'מוזיקה רועשת',   b: 'שקט מוחלט',       emojiA: '🎵', emojiB: '🤫' },
  { q: 'אמבטיה מפנקת או מקלחת זריזה?', a: 'אמבטיה',          b: 'מקלחת זריזה',     emojiA: '🛁', emojiB: '🚿' },
  { q: 'משחקי קופסה או משחקי וידאו?',  a: 'משחקי קופסה',    b: 'משחקי וידאו',     emojiA: '🎲', emojiB: '🎮' },
  { q: 'לעבוד מהבית או מהמשרד?',       a: 'מהבית',           b: 'מהמשרד',          emojiA: '🏠', emojiB: '🏢' },
  { q: 'שיחת טלפון או הודעת ווטסאפ?',  a: 'שיחת טלפון',     b: 'הודעת ווטסאפ',    emojiA: '📞', emojiB: '💬' },
];

const MAX_LIVES       = 3; // lives (lose one on mismatch)

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game05ThisOrThat({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const round = toSafeInt(gameData.playerData.__state?.round, 0);
  const matches = toSafeInt(gameData.playerData.__state?.matches, 0);
  const lives = toSafeInt(gameData.playerData.__state?.lives, MAX_LIVES);
  const lastResolvedRound = toSafeInt(gameData.playerData.__state?.lastResolvedRound, -1);
  const [showResult, setShowResult] = useState(false);
  const completedRef = useRef(false);
  const resolvedRoundRef = useRef<number | null>(null);

  // Pick a deterministic (but non-repeating within a session) question per round
  const currentQ = QUESTIONS[Math.abs(hashCode(matchId + '5r' + round)) % QUESTIONS.length];

  // Flat keys at playerData level — safe for RPC shallow merge.
  // Each player writes only their own key: `${userId}_r${round}`
  const myKey    = `${userId}_r${round}`;
  const otherKey = `${otherUserId}_r${round}`;
  const myChoice    = gameData.playerData[myKey]?.choice    as string | undefined;
  const otherChoice = gameData.playerData[otherKey]?.choice as string | undefined;
  const bothChose = !!myChoice && !!otherChoice;

  const handleChoose = async (choice: string) => {
    if (myChoice) return;
    await onUpdate({
      playerData: { [myKey]: { choice } },
    });
  };

  useEffect(() => {
    if (!bothChose || resolvedRoundRef.current === round || lastResolvedRound >= round) return;
    resolvedRoundRef.current = round;
    setShowResult(true);

    const matched = myChoice === otherChoice;
    const lifeLoss = matched ? 0 : 1;
    const newMatches = matches + (matched ? 1 : 0);
    const newLives = Math.max(0, lives - lifeLoss);
    const gameOver   = newLives <= 0;

    const timer = setTimeout(() => {
      if (gameOver) {
        if (completedRef.current) return;
        completedRef.current = true;
        const winnerId = pickDeterministicPlayer(userId, otherUserId, `${matchId}:5:winner`);
        onComplete(winnerId);
      } else {
        const nextRound = round + 1;
        void onUpdate({
          playerData: {
            __state: { round: nextRound, matches: newMatches, lives: newLives, lastResolvedRound: round },
          },
        });
        setShowResult(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [bothChose, myChoice, otherChoice, matches, lives, round, lastResolvedRound, matchId, userId, otherUserId, onComplete, onUpdate]);

  useEffect(() => {
    // When round advances from remote/local sync, allow next reveal cycle.
    resolvedRoundRef.current = null;
    setShowResult(false);
  }, [round]);

  if (!currentQ) return null;

  const isMatch = bothChose && myChoice === otherChoice;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">

      {/* ── Lives + match counter ────────────────────── */}
      <div className="flex flex-col items-center gap-1 mb-5">
        <div className="flex gap-1">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i === lives && lives < MAX_LIVES ? [1.2, 0.8, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="text-2xl"
            >
              {i < lives ? '❤️' : '🖤'}
            </motion.span>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          מצאנו <strong>{matches}</strong> התאמות יחד
        </p>
      </div>

      {/* ── Question ─────────────────────────────────── */}
      <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-6 text-center">{currentQ.q}</h3>

      {/* ── Result reveal ────────────────────────────── */}
      <AnimatePresence mode="wait">
        {bothChose && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-6 mb-6"
          >
            <div className="text-center">
              <span className="text-4xl block mb-1">
                {myChoice === currentQ.a ? currentQ.emojiA : currentQ.emojiB}
              </span>
              <p className="text-xs text-gray-500">אתה</p>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
              className={`text-xl font-bold ${isMatch ? 'text-green-500' : 'text-red-400'}`}
            >
              {isMatch ? '💚 התאמה!' : '💔 שונה'}
            </motion.span>
            <div className="text-center">
              <span className="text-4xl block mb-1">
                {otherChoice === currentQ.a ? currentQ.emojiA : currentQ.emojiB}
              </span>
              <p className="text-xs text-gray-500">חבר/ה</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Choice buttons ────────────────────────────── */}
      {!bothChose && !myChoice && (
        <div className="flex gap-4">
          {[{ label: currentQ.a, emoji: currentQ.emojiA }, { label: currentQ.b, emoji: currentQ.emojiB }].map(
            ({ label, emoji }) => (
              <motion.button
                key={label}
                onClick={() => handleChoose(label)}
                whileTap={{ scale: 0.93 }}
                className="w-32 h-32 rounded-2xl bg-white border-2 border-blue-200 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <span className="text-5xl">{emoji}</span>
                <span className="text-sm font-bold text-gray-700">{label}</span>
              </motion.button>
            )
          )}
        </div>
      )}

      {/* ── Waiting for other ─────────────────────────── */}
      {myChoice && !otherChoice && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-4">
          <p className="text-sm font-bold text-blue-600 mb-2">בחרת: {myChoice}</p>
          <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-1">ממתינים לחבר/ה...</p>
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

function toSafeInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed);
  }
  return fallback;
}
