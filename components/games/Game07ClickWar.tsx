'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

const GAME_DURATION = 5000; // 5 seconds

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game07ClickWar({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);
  const lastProgressSyncRef = useRef(0);


  const playerData = gameData.playerData ?? {};
  const sharedStartedAt = playerData.__state?.startedAt as number | undefined;
  const myTaps = (playerData[userId]?.taps as number) ?? 0;
  const otherTaps = (playerData[otherUserId]?.taps as number) ?? 0;
  const myFinished = playerData[userId]?.finished === true;
  const otherFinished = playerData[otherUserId]?.finished === true;
  const remoteStarted = sharedStartedAt !== undefined;
  const syncedMyTaps = Math.max(taps, myTaps);

  const handleStart = useCallback(async () => {
    if (started || remoteStarted) return;
    const startedAt = Date.now();
    setStarted(true);
    startTimeRef.current = startedAt;
    await onUpdate({
      playerData: {
        __state: { startedAt },
        [userId]: { taps: 0, finished: false },
      },
    });
  }, [started, remoteStarted, onUpdate, userId]);

  useEffect(() => {
    if (remoteStarted && !started && !finished) {
      setStarted(true);
      startTimeRef.current = sharedStartedAt ?? Date.now();
    }
  }, [remoteStarted, sharedStartedAt, started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    if (myTaps > taps) {
      setTaps(myTaps);
    }
  }, [myTaps, taps, started, finished]);

  // Tap handler
  const handleTap = useCallback(() => {
    if (!started || finished) return;
    setTaps(prev => prev + 1);
  }, [started, finished]);

  // Timer countdown
  useEffect(() => {
    if (!started || finished) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (sharedStartedAt ?? startTimeRef.current);
      const remaining = GAME_DURATION - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setFinished(true);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [started, finished, sharedStartedAt]);

  useEffect(() => {
    if (!started || finished) return;
    const now = Date.now();
    if (now - lastProgressSyncRef.current < 250) return;
    lastProgressSyncRef.current = now;
    void onUpdate({
      playerData: {
        [userId]: { taps: syncedMyTaps, finished: false },
      },
    });
  }, [syncedMyTaps, started, finished, onUpdate, userId]);

  // Sync taps to DB only when finished (avoids race conditions from frequent writes)
  useEffect(() => {
    if (!started || !finished) return;

    // Send only own data — RPC merges without overwriting other player
    onUpdate({
      playerData: {
        [userId]: { taps: syncedMyTaps, finished: true },
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Determine winner when both finished
  useEffect(() => {
    if (!myFinished || !otherFinished || gameData.status !== 'playing' || completedRef.current) return;
    completedRef.current = true;
    // Tie: use sorted userId hash so both clients agree on the winner
    const tiebreakWinnerId = pickDeterministicPlayer(userId, otherUserId, `${matchId}:7:winner`);
    const winnerId =
      myTaps > otherTaps ? userId :
      otherTaps > myTaps ? otherUserId :
      tiebreakWinnerId;
    setTimeout(() => onComplete(winnerId), 1500);
  }, [myFinished, otherFinished, myTaps, otherTaps, matchId, userId, otherUserId, gameData.status, onComplete]);

  const seconds = (timeLeft / 1000).toFixed(1);
  const totalTaps = syncedMyTaps + otherTaps;
  const myPercent = totalTaps > 0 ? (syncedMyTaps / totalTaps) * 100 : 50;
  const myZoneFlex = Math.max(0.6, myPercent / 50);
  const otherZoneFlex = Math.max(0.6, (100 - myPercent) / 50);

  // Not started
  if (!started) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-5xl mb-4">🖱️</span>
        <p className="text-sm text-gray-500 mb-2 text-center">
          המסך חצוי! לחצו כמה שיותר מהר ב-5 שניות
        </p>
        <p className="text-xs text-gray-400 mb-6 text-center">
          כדי להשתלט על שטח המסך של השני
        </p>
        <motion.button
          onClick={handleStart}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-8 rounded-2xl bg-blue-500 text-white font-bold text-sm"
        >
          מתחילים!
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Timer */}
      <div className="text-center py-2">
        <span className={`text-2xl font-black ${timeLeft < 2000 ? 'text-red-500' : 'text-gray-700'}`}>
          {finished ? '⏱️ נגמר!' : seconds}
        </span>
      </div>

      {/* Split screen territory bar */}
      <div className="flex h-4 rounded-full overflow-hidden mx-4 mb-4 border border-gray-200">
        <motion.div
          animate={{ width: `${myPercent}%` }}
          className="bg-blue-500 transition-all"
        />
        <motion.div
          animate={{ width: `${100 - myPercent}%` }}
          className="bg-indigo-500 transition-all"
        />
      </div>

      {/* Tap zones */}
      <div className="flex-1 flex gap-1 mx-4 mb-4">
        {/* My zone */}
        <motion.button
          onClick={handleTap}
          disabled={finished}
          whileTap={{ scale: 0.98 }}
          animate={{ flexGrow: myZoneFlex }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-colors ${
            finished
              ? 'bg-blue-100 border-2 border-blue-300'
              : 'bg-blue-50 border-2 border-blue-200 active:bg-blue-200'
          }`}
        >
          <span className="text-4xl mb-2">👆</span>
          <span className="text-3xl font-black text-blue-600">{syncedMyTaps}</span>
          <span className="text-xs text-blue-400 mt-1">אתה</span>
        </motion.button>

        {/* Other zone (display only) */}
        <motion.div
          animate={{ flexGrow: otherZoneFlex }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="flex-1 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex flex-col items-center justify-center"
        >
          <span className="text-4xl mb-2">👆</span>
          <span className="text-3xl font-black text-indigo-600">{otherTaps}</span>
          <span className="text-xs text-indigo-400 mt-1">חבר/ה</span>
        </motion.div>
      </div>

      {/* Result */}
      {finished && !otherFinished && (
        <div className="text-center pb-4">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-1">ממתינים שהחבר/ה יסיים...</p>
        </div>
      )}

      {myFinished && otherFinished && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pb-4"
        >
          <p className="text-lg font-bold text-blue-600">
            {syncedMyTaps >= otherTaps ? 'ניצחת! 🏆' : 'החבר/ה ניצח/ה! 😅'}
          </p>
          <p className="text-xs text-gray-400">{syncedMyTaps} vs {otherTaps} לחיצות</p>
        </motion.div>
      )}
    </div>
  );
}

