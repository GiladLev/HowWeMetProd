'use client';

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

export default function VerifyStep() {
  const router = useRouter();
  const { email, setVerified } = useOnboardingStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Check if email is set (user came from email step), redirect to start if not
  useEffect(() => {
    if (!email) {
      router.replace('/onboarding/email');
    }
  }, [email, router]);

  const code = digits.join('');
  const isValid = code.length === 6;

  const handleChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setError('');
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message === 'Token has expired or is invalid'
        ? 'הקוד שגוי או פג תוקף. נסה שנית.'
        : verifyError.message);
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }

    setVerified();
    router.push('/onboarding/password');
  };

  const handleResend = async () => {
    setError('');
    setDigits(['', '', '', '', '', '']);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

    if (resendError) {
      if (resendError.message.toLowerCase().includes('rate limit') || resendError.status === 429) {
        setCooldownSeconds(60);
        setError('שלחנו קוד לאחרונה. המתן 60 שניות.');
      } else {
        setError(resendError.message);
      }
    } else {
      setError('');
    }
    inputs.current[0]?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="flex flex-col flex-1 px-6 pt-8 pb-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <ShieldCheck size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">קוד אימות</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        שלחנו קוד בן 6 ספרות לכתובת
        <br />
        <span className="text-gray-600 font-medium" dir="ltr">{email}</span>
      </p>

      <div className="flex gap-3 justify-center mb-3 ltr" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all
              ${d ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
              focus:border-blue-400 focus:bg-white`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 text-center mb-2"
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handleResend}
        disabled={cooldownSeconds > 0}
        className={`text-xs font-medium text-center mb-auto mt-2 transition-colors ${
          cooldownSeconds > 0
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-500 hover:text-blue-600'
        }`}
      >
        {cooldownSeconds > 0 ? `המתן ${cooldownSeconds}s` : 'שלח קוד מחדש'}
      </button>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
          isValid && !loading
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        אמת והמשך
      </motion.button>
    </motion.div>
  );
}
