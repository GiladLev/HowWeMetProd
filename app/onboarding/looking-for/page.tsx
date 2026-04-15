'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';
import type { GenderPreference } from '../../../types';

const OPTIONS: { value: GenderPreference; emoji: string; label: string; sub: string }[] = [
  { value: 'male',   emoji: '👨', label: 'גברים',   sub: 'הצג לי גברים' },
  { value: 'female', emoji: '👩', label: 'נשים',    sub: 'הצג לי נשים' },
  { value: 'both',   emoji: '💑', label: 'שניהם',   sub: 'פתוח לכולם' },
];

export default function LookingForStep() {
  const router = useRouter();
  const { genderPreference: stored, setGenderPreference } = useOnboardingStore();
  const [selected, setSelected] = useState<GenderPreference>(stored);
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
    setGenderPreference(selected);
    router.push('/onboarding/location');
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
        🔍
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        מי את/ה מחפש/ת?
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        נציג לך רק אנשים שמתאימים להעדפה שלך.
      </p>

      <div className="flex flex-col gap-3 mb-auto">
        {OPTIONS.map(({ value, emoji, label, sub }) => {
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
              <div className="text-right">
                <p className={`font-semibold text-base ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>{sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-2xl font-bold text-base mt-6 bg-blue-500 text-white shadow-lg shadow-blue-200 transition-all"
      >
        המשך
      </motion.button>
    </motion.div>
  );
}
