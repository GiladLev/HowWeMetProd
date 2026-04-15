'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Cake, AlertCircle } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

const MIN_AGE = 18;
const MAX_AGE = 35;

function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Default: 20 years ago today
function defaultDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 20);
  return d.toISOString().split('T')[0];
}

function maxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().split('T')[0];
}

function minDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE - 1);
  return d.toISOString().split('T')[0];
}

export default function AgeStep() {
  const router = useRouter();
  const { setAge } = useOnboardingStore();
  const [birthDate, setBirthDate] = useState(defaultDate());
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

  const parsed = new Date(birthDate);
  const age = isNaN(parsed.getTime()) ? null : calcAge(parsed);
  const tooYoung = age !== null && age < MIN_AGE;
  const tooOld   = age !== null && age > MAX_AGE;
  const isValid  = age !== null && !tooYoung && !tooOld;

  const errorMsg = tooYoung
    ? `יש להיות לפחות בן/בת ${MIN_AGE}`
    : tooOld
    ? `האפליקציה מיועדת לסטודנטים עד גיל ${MAX_AGE}`
    : '';

  const handleContinue = () => {
    setTouched(true);
    if (!isValid || age === null) return;
    setAge(age);
    router.push('/onboarding/looking-for');
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
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Cake size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        מתי נולדת?
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-3">
        HowWeMet היא אפליקציה ל<strong className="text-gray-600 font-semibold">משתמשים בגיל 18+ בלבד</strong>.
      </p>
      <p className="text-sm text-gray-400 leading-relaxed mb-10">
        על ידי המשך, אתה מאשר שאתה בן/בת 18 שנים ומעלה.
      </p>

      {/* Age display */}
      <div className="flex flex-col items-center mb-10">
        <motion.div
          key={age}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`text-7xl font-bold leading-none mb-1 ${isValid ? 'text-blue-600' : 'text-gray-300'}`}
        >
          {age !== null ? age : '—'}
        </motion.div>
        <span className="text-sm text-gray-400 font-medium">שנים</span>
      </div>

      {/* Date input */}
      <div className="mb-auto">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">תאריך לידה</label>
        <input
          type="date"
          value={birthDate}
          min={minDate()}
          max={maxDate()}
          onChange={(e) => { setBirthDate(e.target.value); setTouched(false); }}
          onBlur={() => setTouched(true)}
          className={`w-full border-2 rounded-2xl px-4 py-3.5 text-base bg-white outline-none transition-all text-right
            ${touched && errorMsg
              ? 'border-red-300 bg-red-50 text-red-700'
              : isValid
              ? 'border-blue-400 text-gray-800'
              : 'border-gray-200 text-gray-800 focus:border-blue-300'
            }`}
        />
        {touched && errorMsg && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-500">{errorMsg}</span>
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
          isValid ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
        }`}
      >
        המשך
      </motion.button>
    </motion.div>
  );
}
