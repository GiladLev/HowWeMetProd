'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '../../../lib/supabase';

const MIN_LENGTH = 8;

export default function PasswordStep() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const isTooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const isValid = password.length >= MIN_LENGTH && password === confirm;

  const handleContinue = async () => {
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      router.push('/onboarding/name');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בהגדרת הסיסמה');
    } finally {
      setLoading(false);
    }
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
        <Lock size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">בחר סיסמה</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        לפחות {MIN_LENGTH} תווים. תשתמש בה כדי להתחבר בעתיד.
      </p>

      <div className="flex flex-col gap-4 mb-auto">
        {/* Password field */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">סיסמה</label>
          <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
            touched && isTooShort ? 'border-red-300 bg-red-50'
            : password.length >= MIN_LENGTH ? 'border-blue-400 bg-white'
            : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
          }`}>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 ml-2 shrink-0"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              autoFocus
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              placeholder="הכנס סיסמה"
              dir="ltr"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
            />
          </div>
          {touched && isTooShort && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-500">הסיסמה חייבת להכיל לפחות {MIN_LENGTH} תווים</span>
            </motion.div>
          )}
        </div>

        {/* Confirm field */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">אימות סיסמה</label>
          <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
            touched && mismatch ? 'border-red-300 bg-red-50'
            : confirm && !mismatch && password === confirm ? 'border-blue-400 bg-white'
            : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
          }`}>
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="text-gray-400 ml-2 shrink-0"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              placeholder="הכנס שוב את הסיסמה"
              dir="ltr"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
            />
          </div>
          {touched && mismatch && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2">
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-500">הסיסמאות אינן תואמות</span>
            </motion.div>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-500">{error}</span>
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-8 transition-all flex items-center justify-center gap-2 ${
          isValid && !loading
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        המשך
      </motion.button>
    </motion.div>
  );
}
