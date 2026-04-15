'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';
import type { Gender } from '../../../types';

const OPTIONS: { value: Gender; emoji: string; label: string }[] = [
  { value: 'male',   emoji: '👨', label: 'גבר' },
  { value: 'female', emoji: '👩', label: 'אישה' },
  { value: 'other',  emoji: '🧑', label: 'אחר' },
];

export default function GenderStep() {
  const router = useRouter();
  const { gender: stored, setGender } = useOnboardingStore();
  const [selected, setSelected] = useState<Gender | null>(stored);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setReady(true);
    }
    checkAuth();
  }, [router]);

  const handleContinue = () => {
    if (!selected) return;
    setGender(selected);
    router.push('/onboarding/age');
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="flex flex-col flex-1 px-6 pt-8 pb-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-3xl">
        🪪
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        מי את/ה?
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        זה יעזור לנו להציג אותך לאנשים הנכונים.
      </p>

      <div className="flex flex-col gap-3 mb-auto">
        {OPTIONS.map(({ value, emoji, label }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-right transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-2xl">{emoji}</span>
              <span className={`font-semibold text-base ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-6 transition-all ${
          selected
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        המשך
      </motion.button>
    </motion.div>
  );
}
