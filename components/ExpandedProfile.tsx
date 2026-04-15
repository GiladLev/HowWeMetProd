'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Heart, MapPin, Ruler, MessageCircle } from 'lucide-react';
import type { Profile, FlowAnswers } from '../types';

// ─── Animation variants ───────────────────────────────────────────────────────

/** Backdrop */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } },
};

/** Bottom-sheet panel */
const sheetVariants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 36 } },
  exit:    { y: '100%', transition: { type: 'tween' as const, duration: 0.25 } },
};

/** Stagger container for revealed answer cards */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.35,   // wait for sheet to settle first
    },
  },
};

/** Each revealed answer card */
const revealItem = {
  hidden:  { opacity: 0, y: 24, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
    },
  },
};

/** Icebreaker big quote – fades in last */
const icebreakerVariant = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween' as const, delay: 0.72, duration: 0.4 },
  },
};

// ─── Track theme map ──────────────────────────────────────────────────────────

const TRACK_COLORS: Record<string, {
  badge: string; icon: string; card: string; border: string; label: string;
}> = {
  pink: {
    badge:  'bg-blue-100 text-blue-700 border-blue-200',
    icon:   'bg-blue-600',
    card:   'bg-blue-50 border-blue-100',
    border: 'border-blue-200',
    label:  'text-blue-500',
  },
  violet: {
    badge:  'bg-violet-100 text-violet-700 border-violet-200',
    icon:   'bg-violet-600',
    card:   'bg-violet-50 border-violet-100',
    border: 'border-violet-200',
    label:  'text-violet-500',
  },
  amber: {
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
    icon:   'bg-amber-500',
    card:   'bg-amber-50 border-amber-100',
    border: 'border-amber-200',
    label:  'text-amber-600',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ExpandedProfileProps {
  profile: Profile;
  onClose: () => void;
  onLike: () => void;
  onSkip: () => void;
}

/**
 * Full-screen bottom-sheet profile view with:
 *   1. Track badge (shown immediately)
 *   2. Step 1 answer card (staggered pop-out, delay 0)
 *   3. Step 2 answer card (staggered pop-out, delay +140ms)
 *   4. Icebreaker – prominent quote (fades in last)
 *   5. Classic prompt answers (below)
 *   6. Sticky action bar
 */
export function ExpandedProfile({ profile, onClose, onLike, onSkip }: ExpandedProfileProps) {
  const [activePhoto, setActivePhoto] = useState(0);
  const fa = profile.flowAnswers;
  const theme = fa ? TRACK_COLORS[fa.trackColor] ?? TRACK_COLORS.pink : TRACK_COLORS.pink;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        {/* Sheet */}
        <motion.div
          key="sheet"
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md mx-auto bg-white rounded-t-3xl overflow-hidden max-h-[94dvh] flex flex-col shadow-2xl"
          dir="rtl"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 overscroll-contain">

            {/* ── Hero photo (shared layoutId with card) ── */}
            <motion.div
              layoutId={`card-${profile.id}`}
              className="relative w-full h-64 bg-gray-200 flex-shrink-0"
            >
              {profile.photos[activePhoto] && (
                <Image
                  src={profile.photos[activePhoto]}
                  alt={profile.firstName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              )}
              {/* Photo nav tap zones */}
              <div
                className="absolute inset-y-0 right-0 w-1/2"
                onClick={() => setActivePhoto((p) => Math.min(p + 1, profile.photos.length - 1))}
              />
              <div
                className="absolute inset-y-0 left-0 w-1/2"
                onClick={() => setActivePhoto((p) => Math.max(p - 1, 0))}
              />
              {/* Photo dots */}
              {profile.photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                  {profile.photos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all duration-200 ${
                        i === activePhoto ? 'bg-white w-5' : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            <div className="px-5 pt-4 pb-4">

              {/* ── Name + location ── */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {profile.firstName}, {profile.age}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-gray-400 text-xs flex-wrap">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {profile.location}
                      </span>
                    )}
                    {profile.height && (
                      <span className="flex items-center gap-1">
                        <Ruler size={11} /> {profile.height}
                      </span>
                    )}
                  </div>
                </div>
                {/* Close */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* ── Track badge (shown immediately, no delay) ── */}
              {fa && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring' as const, stiffness: 350, damping: 28 }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-5 ${theme.badge}`}
                >
                  <span>{fa.trackEmoji}</span>
                  <span>{fa.trackName}</span>
                </motion.div>
              )}

              {/* ── Staggered reveal: step1 + step2 ── */}
              {fa && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3 mb-5"
                >
                  <RevealCard
                    question={fa.step1Question}
                    answer={fa.step1Answer}
                    index={0}
                    theme={theme}
                  />
                  <RevealCard
                    question={fa.step2Question}
                    answer={fa.step2Answer}
                    index={1}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* ── Icebreaker – big, prominent, revealed last ── */}
              {fa?.icebreaker && (
                <motion.div
                  variants={icebreakerVariant}
                  initial="hidden"
                  animate="visible"
                  className="mb-5"
                >
                  <IcebreakerBlock text={fa.icebreaker} theme={theme} />
                </motion.div>
              )}

              {/* ── Classic prompt answers (below the flow section) ── */}
              {profile.prompts.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">עוד על {profile.firstName}</h3>
                  {profile.prompts.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium mb-1">{p.prompt}</p>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{p.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="h-4" />
            </div>
          </div>

          {/* ── Sticky CTA bar ── */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <motion.button
              onClick={onSkip}
              whileTap={{ scale: 0.92 }}
              className="flex-none w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
            >
              <X size={18} />
            </motion.button>
            <motion.button
              onClick={onLike}
              whileTap={{ scale: 0.92 }}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
            >
              <Heart size={16} className="fill-white" />
              לייק
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="flex-none w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
            >
              <MessageCircle size={18} />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Reveal Card ──────────────────────────────────────────────────────────────

function RevealCard({
  question,
  answer,
  theme,
}: {
  question: string;
  answer: string;
  index: number;
  theme: (typeof TRACK_COLORS)[string];
}) {
  return (
    <motion.div
      variants={revealItem}
      className={`rounded-2xl border p-4 ${theme.card}`}
    >
      {/* Question label */}
      <p className={`text-xs font-semibold mb-1.5 ${theme.label}`}>{question}</p>
      {/* Answer */}
      <p className="text-gray-800 text-base font-bold leading-snug">{answer}</p>
    </motion.div>
  );
}

// ─── Icebreaker Block ─────────────────────────────────────────────────────────

function IcebreakerBlock({
  text,
  theme,
}: {
  text: string;
  theme: (typeof TRACK_COLORS)[string];
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${theme.border} bg-white relative overflow-hidden`}>
      {/* Decorative quote mark */}
      <span
        className={`absolute -top-2 right-3 text-6xl font-serif leading-none select-none pointer-events-none opacity-10 ${theme.label}`}
        aria-hidden
      >
        &ldquo;
      </span>
      <p className={`text-xs font-semibold mb-2 ${theme.label}`}>שאלת הקרח ❄️</p>
      <p className="text-gray-900 text-lg font-bold leading-snug relative z-10">{text}</p>
    </div>
  );
}
