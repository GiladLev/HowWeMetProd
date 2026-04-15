'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  LifeBuoy,
  Mail,
  MessageCircle,
  Shield,
  UserX,
  HelpCircle,
  ChevronDown,
  Heart,
  AlertTriangle,
  Lock,
  Trash2,
} from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
  icon: typeof HelpCircle;
}

const FAQS: FAQ[] = [
  {
    icon: Mail,
    q: 'למה צריך מייל אוניברסיטאי?',
    a: 'HowWeMet מיועדת לסטודנטים בלבד. אנחנו משתמשים במייל האוניברסיטאי (.ac.il / .edu) כדי לוודא שרק סטודנטים מצטרפים לקהילה שלנו ולשמור על סביבה בטוחה ורלוונטית.',
  },
  {
    icon: Heart,
    q: 'איך עובד ה-Match?',
    a: 'כשאתם ואדם אחר מסמנים לייק אחד לשני, נוצר Match ואתם יכולים להתחיל לשוחח. פשוט, ישיר ובלי משחקים.',
  },
  {
    icon: Shield,
    q: 'איך שומרים על הפרטיות שלי?',
    a: 'המידע האישי שלכם מוצפן ומאובטח. אנחנו לא חולקים את הפרטים שלכם עם צדדים שלישיים. הפרופיל שלכם גלוי רק למשתמשים רשומים ומאומתים.',
  },
  {
    icon: UserX,
    q: 'איך חוסמים או מדווחים על משתמש?',
    a: 'בכל פרופיל יש אפשרות לחסום או לדווח. דיווחים נבדקים תוך 24 שעות, ומשתמשים שמפרים את כללי הקהילה מוסרים לצמיתות.',
  },
  {
    icon: Lock,
    q: 'שכחתי את הסיסמה, מה עושים?',
    a: 'במסך ההתחברות יש קישור "שכחתי סיסמה". תקבלו קוד אימות למייל ותוכלו לאפס את הסיסמה בקלות.',
  },
  {
    icon: Trash2,
    q: 'איך מוחקים את החשבון?',
    a: 'בהגדרות החשבון יש אפשרות למחיקה מלאה. המחיקה קבועה וכל המידע יימחק תוך 30 יום.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]" dir="rtl">
      {/* Background bubbles */}
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[5%] right-[-10%] w-[250px] h-[250px] bg-indigo-50 rounded-full blur-3xl -z-10" />

      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-5 py-4 z-20">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronRight size={22} />
        </button>
        <h1 className="font-bold text-gray-900">תמיכה ועזרה</h1>
      </div>

      <div className="flex-1 px-5 py-6 max-w-xl mx-auto w-full relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
            <LifeBuoy size={32} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            איך אפשר לעזור?
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
            כאן תמצאו תשובות לשאלות נפוצות ודרכים ליצור איתנו קשר
          </p>
        </motion.div>

        {/* Quick Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <a
            href="mailto:support@howwemet.co.il"
            className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Mail size={18} className="text-blue-500" />
            </div>
            <p className="font-bold text-gray-900 text-sm mb-1">שלחו מייל</p>
            <p className="text-xs text-gray-400">תשובה תוך 24 שעות</p>
          </a>

          <a
            href="mailto:report@howwemet.co.il"
            className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="font-bold text-gray-900 text-sm mb-1">דיווח דחוף</p>
            <p className="text-xs text-gray-400">התנהגות פוגענית</p>
          </a>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <HelpCircle size={18} className="text-blue-500" />
            <h3 className="font-bold text-gray-900">שאלות נפוצות</h3>
          </div>

          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => {
              const Icon = faq.icon;
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                    isOpen ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-gray-100'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-right"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-blue-100' : 'bg-gray-50'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isOpen ? 'text-blue-500' : 'text-gray-400'}
                      />
                    </div>
                    <span className="flex-1 font-bold text-sm text-gray-900">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-500' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pr-16">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Community Guidelines Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm mb-1">
                קהילה בטוחה ומכבדת
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                HowWeMet אוכפת מדיניות של אפס סובלנות כלפי הטרדה, תוכן פוגעני
                או התנהגות פוגעת. קראו את כללי הקהילה המלאים.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => router.push('/terms')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                >
                  תנאי שימוש ←
                </button>
                <span className="text-xs text-gray-300">•</span>
                <button
                  onClick={() => router.push('/privacy')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                >
                  מדיניות פרטיות ←
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Still need help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center pb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle size={16} className="text-gray-400" />
            <p className="text-sm text-gray-500 font-medium">
              עדיין צריכים עזרה?
            </p>
          </div>
          <a
            href="mailto:support@howwemet.co.il"
            className="inline-block px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-[0.98] transition-all"
          >
            צרו איתנו קשר
          </a>
          <p className="text-[11px] text-gray-400 mt-4">
            צוות HowWeMet כאן בשבילכם כל יום
          </p>
        </motion.div>
      </div>
    </div>
  );
}
