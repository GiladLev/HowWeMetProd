'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '../../../lib/supabase';

type Step = 'combined' | 'otp';

const UNI_DOMAINS = ['.ac.il', '.edu', '.ac.uk', '.edu.au', 'gmail'];

function isUniversityEmail(email: string) {
  const lower = email.toLowerCase();
  return UNI_DOMAINS.some((d) => lower.includes(d));
}

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('combined');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Password step
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP step
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(email);
  const isUni = isUniversityEmail(email);
  const isEmailValid = isValidFormat && isUni;

  let emailClientError = '';
  if (emailTouched && email && !isValidFormat) emailClientError = 'כתובת מייל לא תקינה';
  else if (emailTouched && isValidFormat && !isUni) emailClientError = 'יש להשתמש במייל אוניברסיטאי בלבד';
  const emailError = emailClientError || serverError;

  // Combined form submission
  const handleSubmit = async () => {
    setEmailTouched(true);
    if (!isEmailValid) return;
    if (!password) return;

    setLoading(true);
    setServerError('');
    const supabase = createClient();

    // Try password login first
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setServerError('מייל או סיסמה שגויים.');
      } else {
        setServerError(error.message);
      }
      return;
    }
    router.replace('/profiles');
  };

  const handleSwitchToOtp = async () => {
    setPassword('');
    setServerError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        setServerError('שלחנו כבר קוד לאחרונה. המתן מספר דקות ונסה שוב.');
      } else if (error.message === 'Signups not allowed for otp') {
        setServerError('לא נמצא חשבון עם מייל זה. אנא הירשם תחילה.');
      } else {
        setServerError(error.message);
      }
      return;
    }
    setStep('otp');
  };

  // OTP
  const code = digits.join('');
  const isOtpValid = code.length === 6;

  const handleDigitChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setOtpError('');
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

  const handleOtpSubmit = async () => {
    if (!isOtpValid) return;
    setOtpLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' });
    setOtpLoading(false);
    if (error) {
      setOtpError(error.message === 'Token has expired or is invalid'
        ? 'הקוד שגוי או פג תוקף. נסה שנית.'
        : error.message);
      return;
    }
    router.replace('/profiles');
  };

  const handleResend = async () => {
    setDigits(['', '', '', '', '', '']);
    setOtpError('');
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    inputs.current[0]?.focus();
  };

  const progressWidth = step === 'combined' ? '50%' : '100%';
  const handleBack = () => {
    if (step === 'otp') { setStep('combined'); setDigits(['', '', '', '', '', '']); }
    else router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir="rtl">
      {/* Top bar */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronRight size={20} />
        </button>
        <span className="flex-1 text-center text-base font-bold text-blue-600 tracking-tight">HowWeMet</span>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-5 pb-3">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            animate={{ width: progressWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── Combined Email + Password step ── */}
          {step === 'combined' && (
            <motion.div
              key="combined"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 pt-8 pb-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <Mail size={26} className="text-blue-500" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">כניסה לחשבון</h1>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                הזן את המייל והסיסמה שלך.
              </p>

              <div className="flex flex-col gap-4 mb-auto">
                {/* Email field */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-2 block">כתובת מייל</label>
                  <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
                    emailError ? 'border-red-300 bg-red-50'
                    : email && isEmailValid ? 'border-blue-400 bg-white'
                    : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
                  }`}>
                    <input
                      type="email"
                      value={email}
                      autoFocus
                      onChange={(e) => { setEmail(e.target.value); setEmailTouched(false); setServerError(''); }}
                      onBlur={() => setEmailTouched(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="example@university.ac.il"
                      dir="ltr"
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
                    />
                  </div>
                  {emailError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 mt-2">
                      <AlertCircle size={13} className="text-red-400 shrink-0" />
                      <span className="text-xs text-red-500">{emailError}</span>
                    </motion.div>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-2 block">סיסמה</label>
                  <div className={`flex items-center rounded-2xl border-2 px-4 py-3.5 transition-all ${
                    serverError && password ? 'border-red-300 bg-red-50'
                    : password ? 'border-blue-400 bg-white'
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
                      onChange={(e) => { setPassword(e.target.value); setServerError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="הכנס סיסמה"
                      dir="ltr"
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-right"
                    />
                  </div>
                </div>

                {serverError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-500">{serverError}</span>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {UNI_DOMAINS.map((d) => (
                  <span key={d} className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full font-medium">{d}</span>
                ))}
              </div>

              <motion.button
                onClick={handleSubmit}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  isEmailValid && password && !loading
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                כניסה
              </motion.button>

              <button
                onClick={handleSwitchToOtp}
                disabled={loading}
                className="text-center text-xs text-blue-500 font-semibold mt-4 flex items-center justify-center gap-1"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                שכחתי סיסמה — כניסה עם קוד OTP
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                אין לך חשבון?{' '}
                <button onClick={() => router.push('/onboarding/email')} className="text-blue-500 font-semibold">הרשמה</button>
              </p>
            </motion.div>
          )}

          {/* ── OTP step ── */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 pt-8 pb-6"
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

              <div className="flex gap-3 justify-center mb-3" dir="ltr">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    autoFocus={i === 0}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all
                      ${d ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-800'}
                      focus:border-blue-400 focus:bg-white`}
                  />
                ))}
              </div>

              {otpError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 text-center mb-2">
                  {otpError}
                </motion.p>
              )}

              <button onClick={handleResend} className="text-xs text-blue-500 font-medium text-center mb-auto mt-2">
                שלח קוד מחדש
              </button>

              <motion.button
                onClick={handleOtpSubmit}
                whileTap={{ scale: 0.97 }}
                disabled={otpLoading}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  isOtpValid && !otpLoading
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {otpLoading && <Loader2 size={18} className="animate-spin" />}
                כניסה
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
