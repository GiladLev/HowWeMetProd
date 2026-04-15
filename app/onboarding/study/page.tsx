'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';
import { useOnboardingStore, ISRAELI_UNIVERSITIES } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

const FIELDS = [
  'מדעי המחשב',
  'הנדסת תוכנה',
  'הנדסה',
  'רפואה',
  'משפטים',
  'כלכלה וניהול',
  'פסיכולוגיה',
  'תקשורת',
  'חינוך',
  'מדעי החברה',
  'ביולוגיה',
  'כימיה',
  'אדריכלות',
  'עיצוב',
  'אחר',
];

export default function StudyStep() {
  const router = useRouter();
  const { fieldOfStudy: storedField, university: storedUni, setStudy } = useOnboardingStore();
  const [field, setField] = useState(storedField);
  const [uni, setUni] = useState(storedUni);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [uniOpen, setUniOpen] = useState(false);
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

  const isValid = field.length > 0 && uni.length > 0;

  const handleContinue = () => {
    setTouched(true);
    if (!isValid) return;
    setStudy(field, uni);
    router.push('/onboarding/photos');
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
        <BookOpen size={26} className="text-blue-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
        מה אתה לומד?
      </h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        תחום הלימודים והמוסד האקדמי שלך.
      </p>

      <div className="flex flex-col gap-4 mb-auto">
        {/* Field of study dropdown */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">תחום לימודים</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setFieldOpen(!fieldOpen); setUniOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-sm ${
                touched && !field
                  ? 'border-red-300 bg-red-50'
                  : field
                  ? 'border-blue-400 bg-white text-gray-800'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${fieldOpen ? 'rotate-180' : ''}`} />
              <span>{field || 'בחר תחום לימודים'}</span>
            </button>

            <AnimatePresence>
              {fieldOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {FIELDS.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => { setField(f); setFieldOpen(false); }}
                        className={`w-full text-right px-4 py-3 text-sm transition-colors hover:bg-blue-50 ${
                          field === f ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {f}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {touched && !field && (
            <p className="text-xs text-red-500 mt-1.5">יש לבחור תחום לימודים</p>
          )}
        </div>

        {/* University dropdown */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">מוסד אקדמי</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setUniOpen(!uniOpen); setFieldOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-sm ${
                touched && !uni
                  ? 'border-red-300 bg-red-50'
                  : uni
                  ? 'border-blue-400 bg-white text-gray-800'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${uniOpen ? 'rotate-180' : ''}`} />
              <span>{uni || 'בחר מוסד אקדמי'}</span>
            </button>

            <AnimatePresence>
              {uniOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto"
                >
                  {ISRAELI_UNIVERSITIES.map((u) => (
                    <li key={u}>
                      <button
                        type="button"
                        onClick={() => { setUni(u); setUniOpen(false); }}
                        className={`w-full text-right px-4 py-3 text-sm transition-colors hover:bg-blue-50 ${
                          uni === u ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {u}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {touched && !uni && (
            <p className="text-xs text-red-500 mt-1.5">יש לבחור מוסד אקדמי</p>
          )}
        </div>
      </div>

      {/* Continue button */}
      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-8 transition-all ${
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
