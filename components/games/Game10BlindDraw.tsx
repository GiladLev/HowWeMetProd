'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

interface Point {
  x: number;
  y: number;
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

// Simple heart shape scoring — check how close drawn points are to a heart curve
function scoreHeart(points: Point[], width: number, height: number): number {
  if (points.length < 5) return 0;

  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) / 4;

  // Generate ideal heart points
  const idealPoints: Point[] = [];
  for (let t = 0; t < Math.PI * 2; t += 0.1) {
    idealPoints.push({
      x: cx + scale * 16 * Math.pow(Math.sin(t), 3) / 16,
      y: cy - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16,
    });
  }

  // Average minimum distance from each drawn point to nearest ideal point
  let totalDist = 0;
  for (const p of points) {
    let minDist = Infinity;
    for (const ip of idealPoints) {
      const d = Math.sqrt((p.x - ip.x) ** 2 + (p.y - ip.y) ** 2);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
  }

  const avgDist = totalDist / points.length;
  // Score: lower distance = higher score (max ~100)
  return Math.max(0, Math.round(100 - avgDist * 2));
}

export default function Game10BlindDraw({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [blind, setBlind] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const completedRef = useRef(false);

  // Deterministic tiebreaker — both clients sort userIds the same way
  const tiebreakWinnerId = useMemo(() => {
    return pickDeterministicPlayer(userId, otherUserId, `${matchId}:10:winner`);
  }, [matchId, userId, otherUserId]);

  const myScore = gameData.playerData[userId]?.score as number | undefined;
  const otherScore = gameData.playerData[otherUserId]?.score as number | undefined;
  const sharedStartedAt = gameData.playerData.__state?.startedAt as number | undefined;
  const otherSubmitted = gameData.playerData[otherUserId]?.submitted === true;
  const bothDone = myScore !== undefined && otherScore !== undefined;
  const hasSharedStart = sharedStartedAt !== undefined;

  // Start blind drawing with countdown
  const handleStart = useCallback(() => {
    if (hasSharedStart) return;
    const startedAt = Date.now();
    setSubmitted(false);
    setBlind(false);
    setCountdown(3);
    setPoints([]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    void onUpdate({
      playerData: {
        __state: { startedAt },
        [userId]: { submitted: false },
      },
    });
  }, [hasSharedStart, onUpdate, userId]);

  useEffect(() => {
    if (!sharedStartedAt || submitted) return;
    // #region agent log
    fetch('http://127.0.0.1:7632/ingest/e06a49b8-5b17-4017-9417-c5fa9e56cc49',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdaf8a'},body:JSON.stringify({sessionId:'cdaf8a',runId:'initial',hypothesisId:'H5',location:'Game10BlindDraw.tsx:countdown-sync-entry',message:'Game10 shared countdown sync effect entered',data:{hasSharedStartedAt:!!sharedStartedAt,submitted,blind,countdown},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const tick = () => {
      const elapsedMs = Date.now() - sharedStartedAt;
      const remaining = 3 - Math.floor(elapsedMs / 1000);
      if (remaining <= 0) {
        // #region agent log
        fetch('http://127.0.0.1:7632/ingest/e06a49b8-5b17-4017-9417-c5fa9e56cc49',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdaf8a'},body:JSON.stringify({sessionId:'cdaf8a',runId:'initial',hypothesisId:'H5',location:'Game10BlindDraw.tsx:countdown-finished',message:'Game10 countdown finished, enabling blind mode',data:{elapsedMs,remaining},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setCountdown(null);
        setBlind(true);
      } else {
        setCountdown(remaining);
        setBlind(false);
      }
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [sharedStartedAt, countdown, blind, submitted]);

  // Drawing handlers
  const getPos = (e: React.TouchEvent | React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!blind || submitted) return;
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    setPoints([pos]);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawing || !blind || submitted) return;
    e.preventDefault();
    const pos = getPos(e);
    setPoints(prev => [...prev, pos]);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineCap = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDraw = () => {
    setDrawing(false);
  };

  // Submit drawing
  const handleSubmit = async () => {
    if (submitted || !canvasRef.current) return;
    setSubmitted(true);
    setBlind(false);

    const canvas = canvasRef.current;
    const score = scoreHeart(points, canvas.width, canvas.height);

    // Send only own data — RPC merges without overwriting other player
    await onUpdate({
      playerData: {
        [userId]: { score, pointCount: points.length, submitted: true },
      },
    });
  };

  // Determine winner when both submitted
  useEffect(() => {
    if (!bothDone || gameData.status !== 'playing' || completedRef.current) return;
    completedRef.current = true;
    const myS = myScore ?? 0;
    const otherS = otherScore ?? 0;
    const winnerId =
      myS > otherS ? userId :
      otherS > myS ? otherUserId :
      tiebreakWinnerId; // exact tie: deterministic from matchId
    setTimeout(() => onComplete(winnerId), 2000);
  }, [bothDone, myScore, otherScore, tiebreakWinnerId, userId, otherUserId, gameData.status, onComplete]);

  // Not started yet
  if (!blind && countdown === null && !submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <span className="text-5xl mb-4">🎨</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2">ציור עיוור</h3>
        <p className="text-sm text-gray-500 mb-2 text-center">
          עצמו עיניים וציירו לב על המסך!
        </p>
        <p className="text-xs text-gray-400 mb-6 text-center">
          האלגוריתם יחשב מי ציייר לב יותר מדויק
        </p>
        <motion.button
          onClick={handleStart}
          disabled={hasSharedStart}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-8 rounded-2xl bg-blue-500 text-white font-bold text-sm disabled:opacity-60"
        >
          {hasSharedStart ? 'השני התחיל, מסתנכרנים...' : 'מוכנ/ה, עוצמים עיניים!'}
        </motion.button>
      </div>
    );
  }

  // Countdown
  if (countdown !== null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.span
          key={countdown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="text-6xl font-black text-blue-500"
        >
          {countdown}
        </motion.span>
        <p className="text-sm text-gray-400 mt-4">עוצמים עיניים!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4">
      {/* Status */}
      {blind && !submitted && (
        <div className="text-center mb-3">
          <p className="text-sm font-bold text-blue-600 animate-pulse">
            🙈 עיניים עצומות — ציירו לב!
          </p>
        </div>
      )}

      {/* Canvas */}
      <div className="relative w-full max-w-xs aspect-square mb-4">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className={`w-full h-full rounded-2xl border-2 ${
            blind
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-white'
          } touch-none`}
        />
        {/* Blind overlay */}
        {blind && !submitted && (
          <div className="absolute inset-0 rounded-2xl bg-black/90 flex items-center justify-center pointer-events-none">
            <span className="text-4xl">🙈</span>
          </div>
        )}
      </div>

      {/* Submit button */}
      {blind && !submitted && points.length > 5 && (
        <motion.button
          onClick={handleSubmit}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-3 px-8 rounded-2xl bg-blue-500 text-white font-bold text-sm mb-4"
        >
          סיימתי! 🎨
        </motion.button>
      )}

      {/* Score display */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 mb-1">הציון שלך:</p>
          <p className="text-3xl font-black text-blue-600">{myScore ?? '...'}/100</p>
          {!bothDone && (
            <>
              <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mt-3" />
              <p className="text-xs text-gray-400 mt-1">
                {otherSubmitted ? 'החבר/ה סיים/ה, מחשבים תוצאה...' : 'ממתינים לחבר/ה...'}
              </p>
            </>
          )}
          {bothDone && (
            <div className="mt-3">
              <p className="text-sm text-gray-500">חבר/ה: <strong>{otherScore}/100</strong></p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                {(myScore ?? 0) >= (otherScore ?? 0) ? 'ניצחת! 🏆' : 'החבר/ה ניצח/ה! 🎨'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

