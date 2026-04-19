'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldOff, AlertTriangle, Flag } from 'lucide-react';
import { createClient } from '../lib/supabase';

type View = 'menu' | 'report-reasons' | 'block-confirm' | 'end-confirm' | 'done';

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'underage' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'inappropriate', label: 'תוכן לא הולם',         desc: 'תמונות או הודעות פוגעניות / מיניות' },
  { value: 'harassment',    label: 'הטרדה או בריונות',     desc: 'מטריד/ת, מאיים/ה או משפיל/ה' },
  { value: 'spam',          label: 'ספאם או פרסום',        desc: 'מפרסם/ת שירותים או מוצרים' },
  { value: 'fake',          label: 'פרופיל מזויף',         desc: 'תמונות גנובות, התחזות, פרטים שקריים' },
  { value: 'underage',      label: 'מתחת לגיל 18',         desc: 'חשד שהמשתמש/ת קטין/ה' },
  { value: 'other',         label: 'אחר',                   desc: 'סיבה אחרת' },
];

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
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [detail, setDetail]   = useState('');

  // ── Block user ─────────────────────────────────────────────────────────────
  const handleBlock = async (autoReason?: ReportReason) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Record the block
      await supabase.from('blocked_users').upsert({
        blocker_id: user.id,
        blocked_id: reportedId,
      });

      // If called from report flow, persist the report for moderators (24-hour SLA).
      if (autoReason) {
        await supabase.from('reported_users').insert({
          reporter_id: user.id,
          reported_id: reportedId,
          reason: autoReason,
          detail: detail.trim() ? detail.trim() : null,
        });
      }

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
    setDoneMsg(
      autoReason
        ? `הדיווח נשלח לצוות. ${reportedName} נחסם/ה ולא יופיע/תופיע יותר.`
        : `חסמת את ${reportedName}. הם לא יופיעו יותר.`,
    );
    setView('done');
    setTimeout(onBlocked, 1600);
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
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe max-h-[90dvh] overflow-y-auto"
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
              onClick={() => setView('report-reasons')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 hover:bg-orange-50 transition-colors text-right"
            >
              <Flag size={18} className="text-orange-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-orange-600">דווח על תוכן פוגעני</p>
                <p className="text-xs text-gray-400 mt-0.5">נטפל בדיווח תוך 24 שעות · המשתמש/ת ייחסם/תיחסם אוטומטית</p>
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

        {/* ── Report reasons view ── */}
        {view === 'report-reasons' && (
          <div className="px-5 pt-4 pb-8 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900">דיווח על {reportedName}</h2>
              <button onClick={() => setView('menu')} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-1">
              HowWeMet נוקטת מדיניות של אפס סובלנות לתוכן פוגעני. כל דיווח נבדק תוך 24 שעות, והמשתמש/ת ייחסם/תיחסם אוטומטית עד סיום הבדיקה.
            </p>

            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  className={`flex items-start gap-2 px-4 py-3 rounded-2xl border-2 text-right transition-all ${
                    selectedReason === r.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${selectedReason === r.value ? 'text-orange-700' : 'text-gray-800'}`}>{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, 400))}
              rows={3}
              placeholder="פרטים נוספים (אופציונלי)"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:border-orange-400 outline-none resize-none mt-1"
            />

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                onClick={() => selectedReason && handleBlock(selectedReason)}
                disabled={!selectedReason || loading}
                className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                {loading ? 'שולח דיווח...' : 'שלח דיווח וחסום'}
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
                onClick={() => handleBlock()}
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
