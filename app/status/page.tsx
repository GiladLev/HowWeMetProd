'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { TRACKS, TRACK_THEME, type Track } from './data';
import { useAvailabilityStore } from '../../lib/store';
import type { MeetCuteLocation, MeetCuteOrder, MeetCuteWhoStarted } from '../../types';

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 350, damping: 35 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25 },
  }),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'track-select' | 'step';

interface Answers {
  step0: string | null; // choice
  step1: string | null; // choice
  step2: string;        // free text
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StatusPage() {
  const router = useRouter();
  const setAvailable = useAvailabilityStore((s) => s.setAvailable);

  const [screen, setScreen] = useState<Screen>('track-select');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [stepIndex, setStepIndex] = useState(0); // 0, 1, 2
  const [direction, setDirection] = useState(1);  // 1 = forward, -1 = backward
  const [answers, setAnswers] = useState<Answers>({ step0: null, step1: null, step2: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = selectedTrack
    ? TRACK_THEME[selectedTrack.color as keyof typeof TRACK_THEME]
    : TRACK_THEME.pink;

  const goForward = useCallback((nextStep: number) => {
    setDirection(1);
    setStepIndex(nextStep);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (stepIndex === 0) {
      setScreen('track-select');
      setSelectedTrack(null);
      setAnswers({ step0: null, step1: null, step2: '' });
    } else {
      setStepIndex((s) => s - 1);
    }
  }, [stepIndex]);

  const handleTrackSelect = (track: Track) => {
    setDirection(1);
    setSelectedTrack(track);
    setStepIndex(0);
    setAnswers({ step0: null, step1: null, step2: '' });
    setScreen('step');
  };

  const handleChoiceSelect = (option: string) => {
    if (stepIndex === 0) {
      setAnswers((a) => ({ ...a, step0: option }));
    } else {
      setAnswers((a) => ({ ...a, step1: option }));
    }
    // auto-advance after brief visual feedback
    setTimeout(() => goForward(stepIndex + 1), 160);
  };

  const handleFinish = async () => {
    if (!selectedTrack || !answers.step2.trim()) return;
    setIsSubmitting(true);

    // Map track answers → MeetCute (activity/mindset/availabilityVibe format)
    const activityMap: Record<number, 'coffee' | 'drink' | 'walk'> = { 1: 'coffee', 2: 'drink', 3: 'walk' };
    const mindsetMap: Record<number, 'real' | 'flow' | 'friends'> = { 1: 'real', 2: 'flow', 3: 'friends' };
    const vibeMap: Record<number, 'ready_now' | 'one_hour' | 'chat_first'> = { 1: 'ready_now', 2: 'one_hour', 3: 'chat_first' };

    setAvailable(60, {
      activity: activityMap[selectedTrack.id] ?? 'coffee',
      mindset: mindsetMap[selectedTrack.id] ?? 'real',
      availabilityVibe: vibeMap[selectedTrack.id] ?? 'ready_now',
    });

    await new Promise((r) => setTimeout(r, 400)); // brief loading feel
    router.push('/profiles');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white" dir="rtl">
      {/* Close button – always visible */}
      <button
        onClick={() => router.push('/profiles')}
        className="absolute top-4 left-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
        aria-label="סגור"
      >
        <X size={16} />
      </button>

      <AnimatePresence mode="wait" custom={direction}>
        {screen === 'track-select' ? (
          <motion.div
            key="track-select"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col flex-1 overflow-y-auto"
          >
            <TrackSelectScreen onSelect={handleTrackSelect} />
          </motion.div>
        ) : selectedTrack ? (
          <motion.div
            key={`step-${stepIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col flex-1 overflow-hidden"
          >
            <StepScreen
              track={selectedTrack}
              stepIndex={stepIndex}
              answers={answers}
              theme={theme}
              onChoiceSelect={handleChoiceSelect}
              onTextChange={(v) => setAnswers((a) => ({ ...a, step2: v }))}
              onBack={goBack}
              onFinish={handleFinish}
              isSubmitting={isSubmitting}
              fadeUp={fadeUp}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Track Select ─────────────────────────────────────────────────────────────

function TrackSelectScreen({ onSelect }: { onSelect: (t: Track) => void }) {
  const colors = Object.values(TRACK_THEME);

  return (
    <div className="flex flex-col px-5 pt-14 pb-8 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">
          מה הווייב שלך<br />
          <span className="text-blue-600">היום?</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">בחר טראק ונגדיר לך סטטוס ב-30 שניות</p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {TRACKS.map((track, i) => {
          const t = TRACK_THEME[track.color as keyof typeof TRACK_THEME];
          return (
            <motion.button
              key={track.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => onSelect(track)}
              className={`w-full text-right flex items-center gap-4 px-5 py-4 rounded-2xl border-2 bg-white transition-all active:scale-[0.98] ${t.trackCard}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${t.iconBg}`}>
                {track.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-base">{track.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{track.subtitle}</div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 rotate-180" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step Screen ──────────────────────────────────────────────────────────────

interface StepScreenProps {
  track: Track;
  stepIndex: number;
  answers: Answers;
  theme: (typeof TRACK_THEME)[keyof typeof TRACK_THEME];
  onChoiceSelect: (option: string) => void;
  onTextChange: (v: string) => void;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
  fadeUp: object;
}

function StepScreen({
  track,
  stepIndex,
  answers,
  theme,
  onChoiceSelect,
  onTextChange,
  onBack,
  onFinish,
  isSubmitting,
  fadeUp,
}: StepScreenProps) {
  const step = track.steps[stepIndex];
  const totalSteps = 3;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="חזור"
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold ${theme.text} flex items-center gap-1.5`}>
                <span>{track.emoji}</span>
                <span>{track.title}</span>
              </span>
              <span className="text-xs text-gray-400 font-medium">
                שלב {stepIndex + 1}/{totalSteps}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${theme.bar}`}
                initial={{ width: `${((stepIndex) / totalSteps) * 100}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Question title */}
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-lg font-bold text-gray-900 leading-snug"
        >
          {step.title}
        </motion.h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {step.type === 'choice' ? (
          <ChoiceStep
            step={step}
            selectedValue={stepIndex === 0 ? answers.step0 : answers.step1}
            theme={theme}
            onSelect={onChoiceSelect}
            fadeUp={fadeUp}
          />
        ) : (
          <TextInputStep
            step={step}
            value={answers.step2}
            theme={theme}
            onChange={onTextChange}
            onFinish={onFinish}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Choice Step ──────────────────────────────────────────────────────────────

function ChoiceStep({
  step,
  selectedValue,
  theme,
  onSelect,
  fadeUp,
}: {
  step: { type: 'choice'; title: string; options: string[]; layout?: string };
  selectedValue: string | null;
  theme: (typeof TRACK_THEME)[keyof typeof TRACK_THEME];
  onSelect: (v: string) => void;
  fadeUp: object;
}) {
  const isSplit = step.layout === 'split';

  return (
    <div className={`pt-3 ${isSplit ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}`}>
      {step.options.map((option, i) => {
        const isSelected = selectedValue === option;
        return (
          <motion.button
            key={option}
            custom={i}
            variants={fadeUp as Parameters<typeof motion.button>[0]['variants']}
            initial="hidden"
            animate="visible"
            onClick={() => onSelect(option)}
            className={`
              w-full text-right rounded-2xl border-2 transition-all duration-150 active:scale-[0.97]
              ${isSplit
                ? 'flex flex-col items-center justify-center gap-2 py-6 px-3 text-center'
                : 'flex items-center gap-4 px-5 py-4'
              }
              ${isSelected
                ? `${theme.selectedBg} ${theme.selectedBorder} ${theme.selectedText} shadow-lg`
                : `bg-white ${theme.border} text-gray-800 hover:${theme.bg}`
              }
            `}
          >
            {isSplit ? (
              <>
                <span className="text-3xl leading-none">
                  {option.match(/[\p{Emoji}]/gu)?.[0] ?? ''}
                </span>
                <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {option.replace(/[\p{Emoji}]/gu, '').trim()}
                </span>
              </>
            ) : (
              <>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                  isSelected ? 'border-white bg-white/30' : `${theme.border}`
                }`}>
                  {isSelected && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <span className={`font-medium text-base leading-snug flex-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {option}
                </span>
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Text Input Step ──────────────────────────────────────────────────────────

const MAX_CHARS = 60;

function TextInputStep({
  value,
  theme,
  onChange,
  onFinish,
  isSubmitting,
}: {
  step: { type: 'text'; title: string };
  value: string;
  theme: (typeof TRACK_THEME)[keyof typeof TRACK_THEME];
  onChange: (v: string) => void;
  onFinish: () => void;
  isSubmitting: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const charsLeft = MAX_CHARS - value.length;
  const canSubmit = value.trim().length > 0 && !isSubmitting;

  // auto-focus when step mounts
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5 pt-3"
    >
      {/* Textarea */}
      <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
        value.length > 0 ? `${theme.border}` : 'border-gray-200'
      }`}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="כתוב/י כאן..."
          rows={3}
          className="w-full px-4 pt-4 pb-2 text-base text-gray-900 placeholder-gray-300 resize-none outline-none bg-white leading-relaxed"
          dir="rtl"
        />
        {/* Char counter */}
        <div className={`flex justify-between items-center px-4 pb-3 text-xs ${
          charsLeft <= 10 ? 'text-red-400' : 'text-gray-300'
        }`}>
          <span>{charsLeft} תווים נותרו</span>
          <span className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  value.length > i * (MAX_CHARS / 3)
                    ? theme.dot
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onFinish}
        disabled={!canSubmit}
        className={`
          w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
          flex items-center justify-center gap-2
          ${canSubmit
            ? `${theme.cta} text-white shadow-lg active:scale-[0.98]`
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Spinner />
            טוען...
          </span>
        ) : (
          <>
            <span>יאללה, אני חי!</span>
            <span className="text-xl">🚀</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        הסטטוס שלך יהיה פעיל לשעה אחת
      </p>
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
