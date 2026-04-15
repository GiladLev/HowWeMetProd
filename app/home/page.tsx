'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvailabilityStore } from '../../lib/store';
import { MEET_CUTE_LABELS } from '../../types';
import type { DateActivity, Mindset, AvailabilityVibe, AvailabilityDuration } from '../../types';
import { Users, ChevronRight, Sparkles, Clock3, Radio, WandSparkles } from 'lucide-react';
import { createClient } from '../../lib/supabase';
import { useOnboardingGuard } from '../../lib/use-onboarding-guard';

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATION = 180; // 3 hours

const ACTIVITIES: { value: DateActivity; emoji: string; label: string }[] = [
  { value: 'coffee', emoji: '☕', label: 'קפה של אמצע היום' },
  { value: 'drink',  emoji: '🍷', label: 'דרינק של ערב' },
  { value: 'walk',   emoji: '🌳', label: 'סיבוב בחוץ באוויר הפתוח' },
];

const MINDSETS: { value: Mindset; emoji: string; label: string }[] = [
  { value: 'real',    emoji: '🎯', label: 'מחפש/ת את הדבר האמיתי' },
  { value: 'flow',    emoji: '🌊', label: 'זורם/ת לראות מה יקרה' },
  { value: 'friends', emoji: '✌️', label: 'רק מחפש/ת להכיר מישהו' },
];

const AVAILABILITY_VIBES: { value: AvailabilityVibe; emoji: string; label: string }[] = [
  { value: 'ready_now',  emoji: '👟', label: 'יאללה, רק שם/שמה נעליים' },
  { value: 'one_hour', emoji: '⏳', label: 'תן/י לי איזה שעה להתארגן' },
  { value: 'chat_first', emoji: '📱', label: 'מעדיף/ה להתכתב קצת קודם' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toAvailabilityDuration(minutes: number): AvailabilityDuration {
  if (minutes <= 30) return 30;
  if (minutes <= 60) return 60;
  return 180;
}

// ─── Animated ring button ────────────────────────────────────────────────────

const BTN = 216;
const R   = 98;
const SW  = 5;
const C   = 2 * Math.PI * R;

function AvailabilityRing({
  isAvailable,
  msLeft,
  totalMs,
  onClick,
}: {
  isAvailable: boolean;
  msLeft: number | null;
  totalMs: number;
  onClick: () => void;
}) {
  const pct    = totalMs > 0 && msLeft !== null ? Math.max(0, msLeft / totalMs) : 1;
  const offset = C * (1 - pct);
  const urgent = msLeft !== null && msLeft < 5 * 60 * 1000 && isAvailable;

  const ringColor  = urgent ? '#ef4444' : '#3b82f6';
  const trackColor = urgent ? '#fee2e2' : '#dbeafe';
  const btnBg      = 'bg-transparent';
  const btnShadow  = isAvailable ? (urgent ? 'shadow-red-100' : 'shadow-blue-100') : 'shadow-gray-100';
  const btnBorder  = isAvailable ? (urgent ? 'border-2 border-red-300/90' : 'border-2 border-blue-300/90') : 'border-2 border-blue-200/80';

  return (
    <div className="relative select-none" style={{ width: BTN, height: BTN }}>
      <AnimatePresence>
        {isAvailable && (
          <motion.div
            key="halo-soft"
            className={`absolute inset-0 rounded-full ${urgent ? 'bg-red-400' : 'bg-blue-400'}`}
            initial={{ opacity: 0.08, scale: 1 }}
            animate={{ opacity: [0.08, 0.03, 0.08], scale: [1, 1.06, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <svg className="absolute inset-0" width={BTN} height={BTN} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={BTN / 2} cy={BTN / 2} r={R} fill="none" stroke={isAvailable ? trackColor : '#f3f4f6'} strokeWidth={SW} />
        {isAvailable && (
          <motion.circle cx={BTN / 2} cy={BTN / 2} r={R} fill="none" stroke={ringColor} strokeWidth={SW} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} transition={{ duration: 0.8, ease: 'easeInOut' }} />
        )}
      </svg>

      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        initial={false}
        animate={!isAvailable ? { y: [0, -2, 0] } : { y: 0 }}
        transition={!isAvailable ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25, ease: 'easeOut' }}
        className={`absolute inset-[10px] rounded-full flex flex-col items-center justify-center gap-0.5 shadow-2xl transition-colors duration-500 ${btnBg} ${btnBorder} ${btnShadow}`}
      >
        <AnimatePresence mode="wait">
          {isAvailable ? (
            <motion.div key="on" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }} className="flex flex-col items-center gap-0.5">
              <span className={`text-[11px] font-semibold tracking-wide ${urgent ? 'text-red-500/90' : 'text-blue-500/90'}`}>באוויר</span>
              <span className={`font-bold tabular-nums leading-none ${urgent ? 'text-red-600' : 'text-blue-600'} ${msLeft !== null && msLeft < 3600_000 ? 'text-3xl' : 'text-2xl'}`}>{msLeft !== null ? formatCountdown(msLeft) : '—'}</span>
              <span className={`text-[10px] mt-0.5 ${urgent ? 'text-red-500/80' : 'text-blue-500/80'}`}>לחץ לסיום</span>
            </motion.div>
          ) : (
            <motion.div key="off" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }} className="flex flex-col items-center gap-1.5" />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ─── Meet Cute Builder (inline) ──────────────────────────────────────────────

type BuilderStep = 1 | 2 | 3;

const slideVariants = {
  enter: { opacity: 0, x: -28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 },
};

function MeetCuteBuilder({ onComplete, onCancel }: {
  onComplete: (activity: DateActivity, mindset: Mindset, vibe: AvailabilityVibe) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<BuilderStep>(1);
  const [activity, setActivity] = useState<DateActivity | null>(null);
  const [mindset, setMindset] = useState<Mindset | null>(null);

  const handleBack = () => {
    if (step === 1) onCancel();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="w-full max-w-md"
    >
      <div className="bg-white/90 backdrop-blur rounded-3xl border border-white shadow-xl shadow-blue-100/70 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
            <ChevronRight size={18} />
          </button>
          <div className="flex-1 flex items-center gap-2 text-blue-500">
            <WandSparkles size={14} />
            <span className="text-xs font-semibold">הגדרת הווייב שלך</span>
          </div>
          <span className="text-xs text-gray-400">{step} / 3</span>
        </div>
        <div className="flex gap-1.5 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-1.5 flex-1 rounded-full overflow-hidden bg-gray-100">
              <motion.div className="h-full rounded-full bg-blue-500" animate={{ width: s <= step ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">אם קופצים עכשיו למשהו, זה יהיה...</h2>
              <p className="text-sm text-gray-400 mb-5">בחר/י מה הכי מתחשק</p>
              <div className="flex flex-col gap-3">
                {ACTIVITIES.map(({ value, emoji, label }) => (
                  <motion.button key={value} onClick={() => { setActivity(value); setTimeout(() => setStep(2), 160); }} whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-right transition-all ${activity === value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <span className="text-3xl">{emoji}</span>
                    <p className={`flex-1 font-bold text-lg ${activity === value ? 'text-blue-700' : 'text-gray-900'}`}>{label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">מה הסטייט אוף מיינד שלך?</h2>
              <p className="text-sm text-gray-400 mb-5">תהיה/י כן/ה עם עצמך</p>
              <div className="flex flex-col gap-3">
                {MINDSETS.map(({ value, emoji, label }) => (
                  <motion.button key={value} onClick={() => { setMindset(value); setTimeout(() => setStep(3), 160); }} whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-right transition-all ${mindset === value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <span className="text-3xl">{emoji}</span>
                    <p className={`flex-1 font-bold text-lg ${mindset === value ? 'text-blue-700' : 'text-gray-900'}`}>{label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold text-gray-900 mb-1">מתי תכל&apos;ס נוח לך להיפגש/י?</h2>
              <p className="text-sm text-gray-400 mb-5">בלי לחץ, רק תיאום ציפיות</p>
              <div className="flex flex-col gap-3">
                {AVAILABILITY_VIBES.map(({ value, emoji, label }) => (
                  <motion.button key={value} onClick={() => { if (activity && mindset) onComplete(activity, mindset, value); }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-blue-300 hover:bg-blue-50 text-right transition-all">
                    <span className="text-3xl">{emoji}</span>
                    <p className="flex-1 font-bold text-lg text-gray-900">{label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ready = useOnboardingGuard();
  const { isAvailable, expiresAt, duration, meetCute, setAvailable, setUnavailable } = useAvailabilityStore();

  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [msLeft, setMsLeft] = useState<number | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const totalMs = (duration ?? 60) * 60 * 1000;

  // Rehydrate availability store from DB after refresh/reload
  useEffect(() => {
    let cancelled = false;
    const syncAvailabilityFromDb = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_available, available_until, meet_cute_activity, meet_cute_mindset, meet_cute_availability_vibe')
        .eq('id', user.id)
        .single();
      if (!profile || cancelled) return;

      const now = Date.now();
      const untilMs = profile.available_until ? new Date(profile.available_until).getTime() : 0;
      const stillAvailable = !!profile.is_available && untilMs > now;
      if (!stillAvailable) {
        setUnavailable();
        return;
      }

      const activity = profile.meet_cute_activity as DateActivity | null;
      const mindset = profile.meet_cute_mindset as Mindset | null;
      const availabilityVibe = profile.meet_cute_availability_vibe as AvailabilityVibe | null;
      const hasMeetCute = !!activity && !!mindset && !!availabilityVibe;
      if (!hasMeetCute) {
        setUnavailable();
        return;
      }

      const remainingMinutes = Math.max(1, Math.ceil((untilMs - now) / 60000));
      const exactExpiresAt = new Date(untilMs); // <-- הגדרת הזמן המדויק
      
      // העברת הזמן המדויק ל-store כדי שימשיך בדיוק מאותה מילי-שנייה
      setAvailable(
        toAvailabilityDuration(remainingMinutes), 
        { activity, mindset, availabilityVibe }, 
        exactExpiresAt
      );
    };
    void syncAvailabilityFromDb();
    return () => {
      cancelled = true;
    };
  }, [setAvailable, setUnavailable]);

  useEffect(() => {
    const shouldOpenQuestionnaire = searchParams.get('questionnaire') === '1';
    if (shouldOpenQuestionnaire && !isAvailable) {
      setShowBuilder(true);
    }
  }, [searchParams, isAvailable]);

  // Fetch count of available users
  useEffect(() => {
    if (!isAvailable) { setNearbyCount(null); return; }
    const supabase = createClient();
    async function fetchCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true)
        .gt('available_until', new Date().toISOString())
        .neq('id', user.id);
      setNearbyCount(count ?? 0);
    }
    fetchCount();
    const iv = setInterval(fetchCount, 30_000);

    const channel = supabase
      .channel('home-available-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void fetchCount();
      })
      .subscribe();

    return () => {
      clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, [isAvailable]);

  // Countdown tick
  useEffect(() => {
    if (!expiresAt) { setMsLeft(null); return; }
    const tick = () => {
      const ms = expiresAt.getTime() - Date.now();
      setMsLeft(Math.max(0, ms));
      if (ms <= 0) setUnavailable();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, setUnavailable]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7632/ingest/e06a49b8-5b17-4017-9417-c5fa9e56cc49',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdaf8a'},body:JSON.stringify({sessionId:'cdaf8a',runId:'initial',hypothesisId:'H6',location:'home/page.tsx:state-snapshot',message:'Home availability screen snapshot',data:{isAvailable,showBuilder,hasMeetCute:!!meetCute,nearbyCount:nearbyCount ?? -1,hasMsLeft:msLeft !== null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [isAvailable, showBuilder, meetCute, nearbyCount, msLeft]);

  const handleToggle = async () => {
    if (isAvailable) {
      setUnavailable();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles')
          .update({ is_available: false, available_until: null })
          .eq('id', user.id);
      }
    } else {
      setShowBuilder(true);
    }
  };

  const handleBuilderComplete = async (activity: DateActivity, mindset: Mindset, vibe: AvailabilityVibe) => {
    const expiresAt = new Date(Date.now() + DURATION * 60 * 1000);
    const mc = { activity, mindset, availabilityVibe: vibe };
    
    // מעבירים את ה-expiresAt גם כאן כדי שיהיה סנכרון מושלם בין ה-Store ל-DB
    setAvailable(DURATION, mc, expiresAt);
    setShowBuilder(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateErr } = await supabase.from('profiles')
        .update({
          is_available: true,
          available_until: expiresAt.toISOString(),
          meet_cute_activity: activity,
          meet_cute_mindset: mindset,
          meet_cute_availability_vibe: vibe,
        })
        .eq('id', user.id);
      if (updateErr) console.error('[home] availability update failed:', updateErr);
      else console.log('[home] availability set for', user.id, 'until', expiresAt.toISOString());
    } else {
      console.error('[home] no user found when completing builder');
    }
  };

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center px-6 pt-6 pb-8 select-none bg-white"
      dir="rtl"
    >
      <AnimatePresence mode="wait">
        {showBuilder ? (
          /* ── Meet Cute Builder (inline) ─────────────────── */
          <MeetCuteBuilder
            key="builder"
            onComplete={handleBuilderComplete}
            onCancel={() => setShowBuilder(false)}
          />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center w-full max-w-md relative z-10 gap-5"
          >
            {/* Logo + headline */}
            <div className="w-full text-center">
              <h1 className="text-3xl font-black tracking-tight text-blue-600">HowWeMet</h1>
            </div>

            {/* Ring */}
            <div className="w-full flex justify-center min-h-[216px]">
              <AvailabilityRing isAvailable={isAvailable} msLeft={msLeft} totalMs={totalMs} onClick={handleToggle} />
            </div>

            {/* Status text */}
            <AnimatePresence mode="wait">
              {isAvailable ? (
                <motion.p key="sub-on" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.1 }} className="text-center text-gray-400 text-sm max-w-xs leading-relaxed mt-1">
                  אנשים קרובים יכולים לראות אותך
                </motion.p>
              ) : (
                <motion.p key="sub-off" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.1 }} className="text-center text-gray-400 text-sm max-w-xs leading-relaxed mt-1">
                  לחץ כדי להתחיל את הקסם
                </motion.p>
              )}
            </AnimatePresence>

            {/* Cards – only when available */}
            <AnimatePresence>
              {isAvailable && (
                <motion.div key="cards" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 28 }} className="w-full mt-2 flex flex-col gap-3">
                  <motion.button onClick={() => router.push('/profiles')} whileTap={{ scale: 0.985 }}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-base">
                      <Users size={16} />
                      {nearbyCount !== null
                        ? nearbyCount > 0 ? `${nearbyCount} אנשים זמינים קרוב אליך` : 'אין אנשים זמינים כרגע'
                        : 'טוען...'}
                    </div>
                    <span className="text-gray-300 text-lg">&lsaquo;</span>
                  </motion.button>

                  {meetCute && (
                    <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
                      <p className="text-xs font-semibold text-blue-500 mb-3 flex items-center gap-1.5">
                        <Radio size={12} />
                        הסטטוס שלך עכשיו
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <MeetCuteChip emoji={meetCute.activity === 'coffee' ? '☕' : meetCute.activity === 'drink' ? '🍷' : '🌳'} value={MEET_CUTE_LABELS.activity[meetCute.activity]} />
                        <MeetCuteChip emoji={meetCute.mindset === 'real' ? '🎯' : meetCute.mindset === 'flow' ? '🌊' : '✌️'} value={MEET_CUTE_LABELS.mindset[meetCute.mindset]} />
                        <MeetCuteChip emoji={meetCute.availabilityVibe === 'ready_now' ? '👟' : meetCute.availabilityVibe === 'one_hour' ? '⏳' : '📱'} value={MEET_CUTE_LABELS.availabilityVibe[meetCute.availabilityVibe]} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint when not available */}
            <AnimatePresence>
              {!isAvailable && (
                <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 w-full">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-start gap-2">
                      <Clock3 size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        כשתהיה/י זמין/ה, הפרופיל שלך יופיע בלייב לאנשים מתאימים באזור ויוכלו להתחיל התאמה.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MeetCuteChip({ emoji, value }: { emoji: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-2.5 flex flex-col items-center gap-1.5 border border-blue-100 text-center shadow-sm">
      <span className="text-xl">{emoji}</span>
      <span className="text-[10px] font-semibold text-gray-600 leading-tight">{value}</span>
    </div>
  );
}