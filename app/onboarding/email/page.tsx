'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

const UNI_DOMAINS = ['.ac.il', '.edu', 'gmail', '.edu.au'];

function isUniversityEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return UNI_DOMAINS.some((d) => lower.includes(d));
}

export default function EmailStep() {
  const router = useRouter();
  const { email: stored, setEmail } = useOnboardingStore();
  const [value, setValue] = useState(stored);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [eulaAccepted, setEulaAccepted] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(value);
  const isUni = isUniversityEmail(value);
  const isValid = isValidFormat && isUni;

  let clientError = '';
  if (touched && value && !isValidFormat) clientError = 'כתובת מייל לא תקינה';
  else if (touched && isValidFormat && !isUni) clientError = 'יש להשתמש במייל אוניברסיטאי בלבד';
  const errorMsg = clientError || serverError;

  const handleContinue = async () => {
    setTouched(true);
    setServerError('');
    if (!isValid) return;

    setLoading(true);
    const supabase = createClient();
    const trimmedEmail = value.trim();

    // Single signInWithOtp call — works for both new and existing accounts.
    // Prevents hitting Supabase email rate limit by avoiding double-calls.
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setLoading(false);
      const msg = error.message?.toLowerCase() || '';
      if (error.status === 429 || msg.includes('rate limit') || msg.includes('email rate limit')) {
        setServerError('נשלחו יותר מדי בקשות. המתן כמה דקות ונסה שוב.');
      } else if (msg.includes('invalid') || msg.includes('not valid')) {
        setServerError('כתובת המייל אינה תקינה.');
      } else {
        setServerError(error.message || 'שגיאה בשליחת קוד. נסה שנית.');
      }
      return;
    }

    // OTP sent successfully — proceed to verify step
    setEmail(trimmedEmail);
    router.push('/onboarding/verify');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring' as const, stiffness: 320, damping: 30 }}
      className="flex flex-col flex-1 px-6 pt-8 pb-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Mail size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">מייל אוניברסיטאי</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        HowWeMet מיועד לסטודנטים בלבד.
        <br />
        נשתמש במייל כדי לאמת שאתה סטודנט.
      </p>

      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">כתובת מייל</label>
        <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
          errorMsg ? 'border-red-300 bg-red-50'
          : value && isValid ? 'border-blue-400 bg-white'
          : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
        }`}>
          <input
            type="email"
            value={value}
            onChange={(e) => { setValue(e.target.value); setTouched(false); setServerError(''); }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="example@university.ac.il"
            dir="ltr"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
          />
        </div>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 mt-2"
          >
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-500">{errorMsg}</span>
          </motion.div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {UNI_DOMAINS.map((d) => (
          <span key={d} className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full font-medium">{d}</span>
        ))}
      </div>

      {/* EULA */}
      <label className="flex items-start gap-3 mb-auto cursor-pointer select-none">
        <div
          onClick={() => setEulaAccepted((v) => !v)}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
            eulaAccepted ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}
        >
          {eulaAccepted && (
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          קראתי ואני מסכים/ה{' '}
          <a href="/terms" className="text-blue-500 underline">לתנאי השימוש</a>
          {' '}ול
          <a href="/privacy" className="text-blue-500 underline">מדיניות הפרטיות</a>.
          {' '}HowWeMet אינה מסכימה לתוכן פוגעני, הטרדה, או שימוש לרעה — משתמשים שיפרו כללים אלה יוסרו מיידית.
        </p>
      </label>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        disabled={loading || !eulaAccepted}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-4 transition-all flex items-center justify-center gap-2 ${
          isValid && eulaAccepted && !loading
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        שלח קוד אימות
      </motion.button>
    </motion.div>
  );
}
