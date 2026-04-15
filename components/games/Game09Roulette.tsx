'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameData } from '../../types';
import { pickDeterministicPlayer } from '../../types';

const WHEEL_ITEMS = ['🍷', '🍺', '🍹', '🍊', '☕', '🥤'];
const WHEEL_LABELS = ['יין', 'בירה', 'קוקטייל', 'מיץ', 'קפה', 'מים'];

interface Props {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string) => void;
}

export default function Game09Roulette({
  matchId,
  userId,
  otherUserId,
  gameData,
  onUpdate,
  onComplete,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [spinDone, setSpinDone] = useState(false);

  // Deterministic result from matchId
  const winnerId = pickDeterministicPlayer(userId, otherUserId, `${matchId}:9:winner`);

  // Spin duration and final position
  const totalSpins = 5 + (Math.abs(hashCode(matchId + '9spin')) % 3);
  const segmentAngle = 360 / WHEEL_ITEMS.length;
  const winnerSegment = Math.abs(hashCode(matchId + '9seg')) % WHEEL_ITEMS.length;
  const finalRotation = totalSpins * 360 + winnerSegment * segmentAngle;

  const handleSpin = async () => {
    if (spinning || spinDone) return;
    setSpinning(true);

    // Only write spin key — RPC merges without overwriting other data
    await onUpdate({
      playerData: {
        wheel: { spinning: true, startedBy: userId },
      },
    });

    setRotation(finalRotation);

    // After animation ends
    setTimeout(() => {
      setSpinning(false);
      setSpinDone(true);
      setWinner(winnerId === userId ? 'אתה' : 'החבר/ה');
      setTimeout(() => onComplete(winnerId), 1500);
    }, 4000);
  };

  // If other player started the spin
  const otherStarted = gameData.playerData['wheel']?.startedBy === otherUserId;
  useEffect(() => {
    if (otherStarted && !spinning && !spinDone) {
      setSpinning(true);
      setRotation(finalRotation);
      setTimeout(() => {
        setSpinning(false);
        setSpinDone(true);
        setWinner(winnerId === userId ? 'אתה' : 'החבר/ה');
        setTimeout(() => onComplete(winnerId), 1500);
      }, 4000);
    }
  }, [otherStarted, spinning, spinDone, finalRotation, winnerId, userId, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <p className="text-sm text-gray-500 mb-6 text-center">
        סובבו את הגלגל — המזל יחליט!
      </p>

      {/* Wheel */}
      <div className="relative w-56 h-56 mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <span className="text-2xl">▼</span>
        </div>

        {/* Spinning wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.2, 0.8, 0.3, 1] }}
          className="w-full h-full rounded-full border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center relative shadow-lg"
        >
          {WHEEL_ITEMS.map((item, i) => {
            const angle = (i * segmentAngle) - 90;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * 75;
            const y = Math.sin(rad) * 75;
            return (
              <span
                key={i}
                className="absolute text-3xl"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {item}
              </span>
            );
          })}
        </motion.div>
      </div>

      {/* Spin button */}
      {!spinning && !spinDone && (
        <motion.button
          onClick={handleSpin}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-8 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors"
        >
          סובב את הגלגל! 🎰
        </motion.button>
      )}

      {spinning && (
        <p className="text-sm text-gray-400 animate-pulse">הגלגל מסתובב...</p>
      )}

      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-blue-600">{winner} בוחר/ת! 🥂</p>
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
