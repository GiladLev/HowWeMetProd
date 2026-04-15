'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldOff, AlertTriangle } from 'lucide-react';
import { createClient } from '../lib/supabase';

type View = 'menu' | 'block-confirm' | 'end-confirm' | 'done';

interface Props {
  reportedId: string;     // user being reported/blocked
  reportedName: string;
  onClose: () => void;
  onBlocked: () => void;  // called after block — parent can navigate away
  onEndGame: () => void;
}

export function ReportBlockSheet({ reportedId, reportedName, onClose, onBlocked, onEndGame }: Props) {
  const [view, setView]       = useState<View>('menu');
  const [loading, setLoading] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  // ── Block user ─────────────────────────────────────────────────────────────
  const handleBlock = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('blocked_users').upsert({
        blocker_id: user.id,
        blocked_id: reportedId,
      });

      // Remove all relationship artifacts so blocked profiles and chats disappear immediately.
      await supabase
        .from('likes')
        .delete()
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${reportedId}),and(from_user_id.eq.${reportedId},to_user_id.eq.${user.id})`);

      await supabase
        .from('matches')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${reportedId}),and(user1_id.eq.${reportedId},user2_id.eq.${user.id})`);
    }
    setLoading(false);
    setDoneMsg(`חסמת את ${reportedName}. הם לא יופיעו יותר.`);
    setView('done');
    setTimeout(onBlocked, 1400);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe"
        dir="rtl"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

        {/* ── Menu view ── */}
        {view === 'menu' && (
          <div className="px-5 pt-4 pb-8 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900">{reportedName}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <button
              onClick={() => setView('end-confirm')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-right"
            >
              <AlertTriangle size={18} className="text-orange-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-gray-800">סיים משחק</p>
                <p className="text-xs text-gray-400 mt-0.5">יציאה מהמשחק הנוכחי</p>
              </div>
            </button>

            <button
              onClick={() => setView('block-confirm')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-red-50 transition-colors text-right"
            >
              <ShieldOff size={18} className="text-red-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-red-600">חסום משתמש</p>
                <p className="text-xs text-gray-400 mt-0.5">הם לא יוכלו לראות אותך</p>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 text-sm text-gray-400 font-medium"
            >
              ביטול
            </button>
          </div>
        )}

        {/* ── Block confirm view ── */}
        {view === 'block-confirm' && (
          <div className="px-5 pt-4 pb-8 flex flex-col gap-4 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mt-2">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">לחסום את {reportedName}?</h2>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                הם לא יוכלו לראות את הפרופיל שלך, ולא יוכלו לשלוח לך הודעות.
                <br />
                ניתן לבטל בהגדרות.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleBlock}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? 'חוסם...' : `חסום את ${reportedName}`}
              </button>
              <button
                onClick={() => setView('menu')}
                className="w-full py-3 text-sm text-gray-400 font-medium"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* ── End game confirm view ── */}
        {view === 'end-confirm' && (
          <div className="px-5 pt-4 pb-8 flex flex-col gap-4 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mt-2">
              <AlertTriangle size={28} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">לסיים את המשחק?</h2>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                תועבר/י חזרה למסך הבית.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onEndGame}
                className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-100"
              >
                סיים משחק
              </button>
              <button
                onClick={() => setView('menu')}
                className="w-full py-3 text-sm text-gray-400 font-medium"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* ── Done view ── */}
        {view === 'done' && (
          <div className="px-5 pt-6 pb-10 flex flex-col items-center text-center gap-4">
            <span className="text-5xl">✅</span>
            <p className="text-base font-semibold text-gray-800">{doneMsg}</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-full bg-gray-100 text-sm text-gray-600 font-medium"
            >
              סגור
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
