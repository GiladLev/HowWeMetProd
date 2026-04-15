'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trash2, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '../../../lib/supabase';

type Step = 'info' | 'confirm' | 'deleting' | 'done';

const DELETED_DATA = [
  { icon: '👤', text: 'פרופיל אישי ותמונות' },
  { icon: '💬', text: 'כל השיחות וההודעות' },
  { icon: '❤️', text: 'לייקים והתאמות' },
  { icon: '📧', text: 'כתובת המייל ופרטי החשבון' },
];

export default function DeleteAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setStep('deleting');
    setError('');
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'שגיאה במחיקת החשבון');
      }
      // Sign out locally
      const supabase = createClient();
      await supabase.auth.signOut();
      setStep('done');
      setTimeout(() => router.replace('/'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      setStep('confirm');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">

      {/* Top bar */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => step === 'confirm' ? setStep('info') : router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          disabled={step === 'deleting' || step === 'done'}
        >
          <ChevronRight size={20} />
        </button>
        <span className="flex-1 text-center text-base font-bold text-gray-900">מחיקת חשבון</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── Step 1: Info ── */}
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 pt-8 pb-8"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                <Trash2 size={28} className="text-red-500" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">מחיקת חשבון</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                לפני שתמשיך, חשוב שתדע מה יימחק לצמיתות ולא ניתן לשחזר:
              </p>

              {/* What gets deleted */}
              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-4 mb-8">
                {DELETED_DATA.map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Legal note — Apple requirement */}
              <p className="text-xs text-gray-400 leading-relaxed mb-auto">
                בהתאם לתנאי השימוש, מחיקת החשבון היא פעולה בלתי הפיכה.
                כל הנתונים יימחקו מהשרתים שלנו תוך 30 יום.
              </p>

              <div className="flex flex-col gap-3 mt-8">
                <button
                  onClick={() => setStep('confirm')}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-base hover:bg-red-600 active:scale-[0.98] transition-all"
                >
                  המשך למחיקה
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-all"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="absolute inset-0 flex flex-col px-6 pt-8 pb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                <AlertTriangle size={28} className="text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">אישור סופי</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                פעולה זו <span className="font-bold text-red-500">לא ניתנת לביטול</span>.
                כל הנתונים שלך יימחקו לצמיתות.
              </p>

              {/* Checkbox confirmation */}
              <button
                onClick={() => setConfirmed(!confirmed)}
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-right mb-auto ${
                  confirmed ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  confirmed ? 'border-red-500 bg-red-500' : 'border-gray-300 bg-white'
                }`}>
                  {confirmed && (
                    <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                      <polyline points="1,5 4,8 11,1" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">
                  אני מבין/ה שמחיקת החשבון היא פעולה בלתי הפיכה וכל הנתונים שלי יאבדו לצמיתות
                </span>
              </button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 text-center mt-4"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleDelete}
                  disabled={!confirmed}
                  className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                    confirmed
                      ? 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={17} />
                  מחק את החשבון שלי לצמיתות
                </button>
                <button
                  onClick={() => router.back()}
                  className="w-full py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-all"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Deleting ── */}
          {step === 'deleting' && (
            <motion.div
              key="deleting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              <Loader2 size={44} className="text-red-400 animate-spin" />
              <p className="text-lg font-bold text-gray-700">מוחק חשבון...</p>
              <p className="text-sm text-gray-400 text-center">אנא המתן, מוחקים את כל הנתונים שלך</p>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6"
            >
              <CheckCircle2 size={56} className="text-green-500" />
              <p className="text-xl font-bold text-gray-800">החשבון נמחק</p>
              <p className="text-sm text-gray-400 text-center">כל הנתונים שלך נמחקו בהצלחה. להתראות 👋</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
