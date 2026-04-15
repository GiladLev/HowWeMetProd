'use client';

import { motion } from 'framer-motion';

/**
 * Brand logo: a pink heart overlapping a dark navy circle.
 * Supports static, animated (entrance), and pulsing (loading) modes.
 *
 * Inspired by the brand identity — two shapes meeting, creating something new.
 */

interface HowWeMetLogoProps {
  size?: number;
  mode?: 'static' | 'animated' | 'loading';
  className?: string;
}

// Heart SVG path centered around origin, scaled to ~36x32 native
const HEART_PATH =
  'M0 -8 C-2.5 -16, -14 -16, -14 -8 C-14 0, 0 10, 0 14 C0 10, 14 0, 14 -8 C14 -16, 2.5 -16, 0 -8 Z';

export default function HowWeMetLogo({ size = 80, mode = 'static', className = '' }: HowWeMetLogoProps) {
  const circleR = size * 0.28;
  const heartScale = size / 80; // base scale at size=80

  // Positions: heart upper-left, circle lower-right, overlapping in center
  const heartX = size * 0.38;
  const heartY = size * 0.34;
  const circleX = size * 0.62;
  const circleY = size * 0.62;

  if (mode === 'loading') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Circle */}
          <motion.circle
            cx={circleX}
            cy={circleY}
            r={circleR}
            fill="#1e1b4b"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: `${circleX}px`, originY: `${circleY}px` }}
          />
          {/* Heart */}
          <motion.g
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            style={{ originX: `${heartX}px`, originY: `${heartY}px` }}
          >
            <g transform={`translate(${heartX}, ${heartY}) scale(${heartScale * 0.9})`}>
              <path d={HEART_PATH} fill="#ec4899" />
            </g>
          </motion.g>
        </svg>
      </div>
    );
  }

  if (mode === 'animated') {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Circle slides in from bottom-right */}
          <motion.circle
            cx={circleX}
            cy={circleY}
            r={circleR}
            fill="#1e1b4b"
            initial={{ opacity: 0, cx: size * 0.9, cy: size * 0.9 }}
            animate={{ opacity: 1, cx: circleX, cy: circleY }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          />
          {/* Heart slides in from top-left */}
          <motion.g
            initial={{ opacity: 0, x: -size * 0.3, y: -size * 0.3 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
          >
            <g transform={`translate(${heartX}, ${heartY}) scale(${heartScale * 0.9})`}>
              <path d={HEART_PATH} fill="#ec4899" />
            </g>
          </motion.g>
          {/* Sparkle on meet */}
          <motion.circle
            cx={size * 0.5}
            cy={size * 0.48}
            r={size * 0.03}
            fill="white"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 0.4, delay: 1.0 }}
          />
        </svg>
      </div>
    );
  }

  // Static mode
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Circle (dark navy) */}
        <circle cx={circleX} cy={circleY} r={circleR} fill="#1e1b4b" />
        {/* Heart (pink) — in front, overlapping */}
        <g transform={`translate(${heartX}, ${heartY}) scale(${heartScale * 0.9})`}>
          <path d={HEART_PATH} fill="#ec4899" />
        </g>
      </svg>
    </div>
  );
}
