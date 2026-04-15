'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';

const ISRAELI_CITIES = [
  'תל אביב-יפו',
  'ירושלים',
  'חיפה',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'באר שבע',
  'בני ברק',
  'רמת גן',
  'בת ים',
  'רחובות',
  'אשקלון',
  'הרצליה',
  'כפר סבא',
  'חולון',
  'רעננה',
  'מודיעין-מכבים-רעות',
  'גבעתיים',
  'רמת השרון',
  'הוד השרון',
  'לוד',
  'רמלה',
  'נהריה',
  'עכו',
  'טבריה',
  'נצרת',
  'אילת',
  'אחר',
];

export default function LocationStep() {
  const router = useRouter();
  const { location: stored, setLocation } = useOnboardingStore();
  const [selected, setSelected] = useState(stored);
  const [open, setOpen] = useState(false);
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

  const handleContinue = () => {
    setTouched(true);
    if (!selected) return;
    setLocation(selected);
    router.push('/onboarding/study');
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
        <MapPin size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">איפה אתה גר?</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-8">
        בחר את העיר שלך מהרשימה.
      </p>

      <div className="mb-auto">
        <label className="text-xs font-semibold text-gray-500 mb-2 block">עיר מגורים</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-sm ${
              touched && !selected
                ? 'border-red-300 bg-red-50'
                : selected
                ? 'border-blue-400 bg-white text-gray-800'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            <span>{selected || 'בחר עיר'}</span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
              >
                {ISRAELI_CITIES.map((city) => (
                  <li key={city}>
                    <button
                      type="button"
                      onClick={() => { setSelected(city); setOpen(false); }}
                      className={`w-full text-right px-4 py-3 text-sm transition-colors hover:bg-blue-50 ${
                        selected === city ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      {city}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {touched && !selected && (
          <p className="text-xs text-red-500 mt-1.5">יש לבחור עיר</p>
        )}
      </div>

      <motion.button
        onClick={handleContinue}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-8 transition-all ${
          selected
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        המשך
      </motion.button>
    </motion.div>
  );
}
