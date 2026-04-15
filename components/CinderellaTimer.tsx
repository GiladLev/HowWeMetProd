'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SESSION_DURATION_SECONDS } from '../lib/cinderella-store';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Clock numerals arranged around the face
const CLOCK_NUMERALS = [
  { n: '12', x: 50, y: 13,  bold: true  },
  { n: '3',  x: 89, y: 52,  bold: false },
  { n: '6',  x: 50, y: 91,  bold: false },
  { n: '9',  x: 11, y: 52,  bold: false },
];

interface CinderellaTimerProps {
  secondsLeft: number;
  /** compact = smaller, used in header */
  size?: 'normal' | 'compact';
}

export function CinderellaTimer({ secondsLeft, size = 'normal' }: CinderellaTimerProps) {
  const progress = Math.max(0, secondsLeft / SESSION_DURATION_SECONDS);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isWarning = secondsLeft < 5 * 60;   // < 5 min  → orange pulse
  const isCritical = secondsLeft < 60;       // < 1 min  → red fury

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const ringColor = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#f59e0b';
  const glowColor = isCritical ? 'rgba(239,68,68,0.5)' : isWarning ? 'rgba(249,115,22,0.4)' : 'rgba(245,158,11,0.3)';

  const dimension = size === 'compact' ? 72 : 110;
  const scale = dimension / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
      {/* Outer magic glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isWarning
            ? [
                `0 0 12px 4px ${glowColor}`,
                `0 0 28px 10px ${glowColor}`,
                `0 0 12px 4px ${glowColor}`,
              ]
            : [
                `0 0 8px 2px ${glowColor}`,
                `0 0 16px 6px ${glowColor}`,
                `0 0 8px 2px ${glowColor}`,
              ],
        }}
        transition={{
          duration: isWarning ? 0.8 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG clock */}
      <svg
        width={100 * scale}
        height={100 * scale}
        viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Clock face */}
        <circle cx="50" cy="50" r="48" fill="#0b1120" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#1e3a5f" strokeWidth="1.5" />

        {/* Track ring (dim) */}
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="4"
        />

        {/* Progress ring */}
        <motion.circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset, stroke: ringColor }}
          transition={{ duration: 0.5 }}
        />
      </svg>

      {/* Clock overlay (un-rotated) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ width: dimension, height: dimension }}
      >
        {/* Numerals */}
        {size === 'normal' && CLOCK_NUMERALS.map(({ n, x, y, bold }) => (
          <span
            key={n}
            className="absolute text-center"
            style={{
              left: `${(x / 100) * dimension}px`,
              top: `${(y / 100) * dimension}px`,
              transform: 'translate(-50%, -50%)',
              fontSize: 8 * scale,
              fontWeight: bold ? 700 : 400,
              color: bold ? '#f59e0b' : '#334155',
              lineHeight: 1,
            }}
          >
            {n}
          </span>
        ))}

        {/* Digital countdown */}
        <div className="flex flex-col items-center">
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: size === 'compact' ? 14 : 18,
              color: isCritical ? '#ef4444' : isWarning ? '#f97316' : '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            {mm}:{ss}
          </span>
          {size === 'normal' && (
            <span className="text-slate-500" style={{ fontSize: 7 }}>
              חצות
            </span>
          )}
        </div>
      </div>

      {/* Warning sparkle ring */}
      <AnimatePresence>
        {isWarning && <SparkleRing critical={isCritical} dimension={dimension} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Sparkle ring ─────────────────────────────────────────────────────────────

const SPARKLE_COUNT = 8;
const SPARKLE_CHARS = ['✦', '✧', '⋆', '·', '✦', '✧', '⋆', '·'];

function SparkleRing({ critical, dimension }: { critical: boolean; dimension: number }) {
  return (
    <>
      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
        const angle = (i / SPARKLE_COUNT) * 360;
        const r = dimension / 2 + 8;
        const x = r + Math.cos((angle * Math.PI) / 180) * r;
        const y = r + Math.sin((angle * Math.PI) / 180) * r;
        return (
          <motion.span
            key={i}
            className="absolute pointer-events-none select-none"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              fontSize: critical ? 10 : 8,
              color: critical ? '#ef4444' : '#f59e0b',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: critical ? 0.5 : 1.2,
              delay: i * (critical ? 0.06 : 0.15),
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {SPARKLE_CHARS[i]}
          </motion.span>
        );
      })}
    </>
  );
}

// ─── Match burst (one-shot sparkle on match) ──────────────────────────────────

const BURST_COUNT = 16;
export function SparkleMatchBurst() {
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {Array.from({ length: BURST_COUNT }).map((_, i) => {
        const angle = (i / BURST_COUNT) * 360;
        const distance = 80 + Math.random() * 60;
        const duration = 0.6 + Math.random() * 0.4;
        return (
          <motion.span
            key={i}
            className="absolute text-yellow-300 font-bold"
            style={{
              top: '50%',
              left: '50%',
              fontSize: 12 + Math.random() * 10,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: 0,
              scale: 1.5,
            }}
            transition={{ duration, ease: 'easeOut' }}
          >
            {['✦', '✧', '⋆', '★'][i % 4]}
          </motion.span>
        );
      })}
    </div>
  );
}
