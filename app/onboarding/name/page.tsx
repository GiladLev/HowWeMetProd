'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

export default function NameStep() {
  const router = useRouter();
  const { firstName: stored, setFirstName } = useOnboardingStore();
  const [value, setValue] = useState(stored);
  const [touched, setTouched] = useState(false);
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

  const trimmed = value.trim();
  const isValid = trimmed.length >= 2;
  const showError = touched && !isValid;

  const handleContinue = () => {
    setTouched(true);
    if (!isValid) return;
    setFirstName(trimmed);
    router.push('/onboarding/gender');
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
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <User size={26} className="text-blue-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        מה שמך?
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        השם שיוצג לאנשים אחרים.
        <br />
        ניתן להשתמש בשם פרטי בלבד.
      </p>

      {/* Input */}
      <div className="mb-auto">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">
          שם פרטי
        </label>
        <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
          showError
            ? 'border-red-300 bg-red-50'
            : trimmed && isValid
            ? 'border-blue-400 bg-white'
            : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
        }`}>
          <input
            type="text"
            value={value}
            autoFocus
            onChange={(e) => { setValue(e.target.value); setTouched(false); }}
            onBlur={() => setTouched(true)}
            placeholder="לדוגמה: יונתן"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
          />
        </div>
        {showError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 mt-1.5"
          >
            יש להזין שם של לפחות 2 תווים
          </motion.p>
        )}
      </div>

      {/* Continue button */}
      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
          isValid
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        המשך
      </motion.button>
    </motion.div>
  );
}
