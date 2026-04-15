'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

const MAX_CHARS = 300;
const MIN_CHARS = 20;

const PROMPTS = [
  'מה מביא לך שמחה?',
  'מה עושה אותך ייחודי?',
  'מה אתה מחפש?',
  'הדבר הכי טוב שקרה לי השנה...',
  'בסוף שבוע אידיאלי אני...',
];

export default function AboutStep() {
  const router = useRouter();
  const { bio: stored, complete, firstName, age, gender, genderPreference, fieldOfStudy, university, location, photos, setBio } = useOnboardingStore();
  const [value, setValue] = useState(stored);
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

  const trimmed = value.trim();
  const isValid = trimmed.length >= MIN_CHARS;
  const showError = touched && !isValid;
  const remaining = MAX_CHARS - value.length;

  const handleContinue = async () => {
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('לא מחובר');

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: firstName,
        age,
        gender: gender ?? undefined,
        gender_preference: genderPreference,
        field_of_study: fieldOfStudy,
        university,
        location,
        bio: trimmed,
        photo_urls: photos.filter(Boolean),
        is_onboarding_complete: true,
      });

      if (upsertError) {
        console.error('upsert error message:', upsertError.message);
        console.error('upsert error code:', upsertError.code);
        console.error('upsert error details:', upsertError.details);
        console.error('upsert error hint:', upsertError.hint);
        throw new Error(upsertError.message ?? upsertError.code ?? 'unknown supabase error');
      }

      setBio(trimmed);
      complete();
      router.replace('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('profile save error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const appendPrompt = (prompt: string) => {
    const base = value ? value + ' ' : '';
    const next = base + prompt + ' ';
    if (next.length <= MAX_CHARS) setValue(next);
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
        <Sparkles size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        ספר על עצמך{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        כמה מילים שיעזרו לאנשים להכיר אותך.
        <br />
        לפחות {MIN_CHARS} תווים.
      </p>

      <div className="mb-4">
        <div className={`rounded-2xl border-2 px-4 py-3.5 transition-all ${
          showError ? 'border-red-300 bg-red-50'
          : trimmed && isValid ? 'border-blue-400 bg-white'
          : 'border-gray-200 bg-gray-50 focus-within:border-blue-300 focus-within:bg-white'
        }`}>
          <textarea
            value={value}
            autoFocus
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setValue(e.target.value);
                setTouched(false);
              }
            }}
            onBlur={() => setTouched(true)}
            placeholder="כתוב משהו על עצמך..."
            rows={4}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none text-right leading-relaxed"
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs font-medium transition-colors ${remaining < 30 ? 'text-red-400' : 'text-gray-300'}`}>
              {remaining}
            </span>
            <span className="text-xs text-gray-300">{trimmed.length} / {MIN_CHARS}+ תווים</span>
          </div>
        </div>
        {showError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1.5">
            יש לכתוב לפחות {MIN_CHARS} תווים
          </motion.p>
        )}
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1.5">
            {error}
          </motion.p>
        )}
      </div>

      <div className="mb-auto">
        <p className="text-xs text-gray-400 mb-2.5 font-medium">השראה לכתיבה:</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => appendPrompt(p)}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
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
        {loading ? 'שומר פרופיל...' : 'סיים הרשמה'}
      </motion.button>
    </motion.div>
  );
}
