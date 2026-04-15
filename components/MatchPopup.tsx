'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatchStore } from '../lib/store';
import Image from 'next/image';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '../lib/supabase';
import { MEET_CUTE_LABELS } from '../types';

interface MatchProfileDetails {
  first_name: string;
  age: number | null;
  photo_urls: string[] | null;
  bio: string | null;
  location: string | null;
  university: string | null;
  field_of_study: string | null;
  meet_cute_activity: string | null;
  meet_cute_mindset: string | null;
  meet_cute_availability_vibe: string | null;
}

const MEET_CUTE_EMOJI = {
  activity: {
    coffee: '☕',
    drink: '🍷',
    walk: '🌳',
  },
  mindset: {
    real: '🎯',
    flow: '🌊',
    friends: '✌️',
  },
  availabilityVibe: {
    ready_now: '👟',
    one_hour: '⏳',
    chat_first: '📱',
  },
} as const;

export function MatchPopup() {
  const router = useRouter();
  const { pendingMatch, clearPendingMatch } = useMatchStore();
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [details, setDetails] = useState<MatchProfileDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  if (!pendingMatch) return null;

  const handleStartChat = () => {
    const matchId = pendingMatch.matchId;
    clearPendingMatch();
    router.push(`/chat/${matchId}`);
  };

  const handleLater = () => {
    clearPendingMatch();
  };

  const openProfile = async () => {
    if (!pendingMatch || loadingDetails) return;
    setShowProfile(true);
    if (details) return;
    setLoadingDetails(true);
    const supabase = createClient();

    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setLoadingDetails(false);
      return;
    }

    const { data: match } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', pendingMatch.matchId)
      .single();
    if (!match) {
      setLoadingDetails(false);
      return;
    }

    const otherId = match.user1_id === me ? match.user2_id : match.user1_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, age, photo_urls, bio, location, university, field_of_study, meet_cute_activity, meet_cute_mindset, meet_cute_availability_vibe')
      .eq('id', otherId)
      .single();
    setDetails((profile as MatchProfileDetails | null) ?? null);
    setLoadingDetails(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      dir="rtl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center"
      >
        {/* Celebration emoji */}
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.span>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">יש התאמה!</h2>

        {/* Profile photo if available */}
        {pendingMatch.otherPhoto && (
          <button onClick={openProfile} className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-blue-200 mb-4">
            <Image
              src={pendingMatch.otherPhoto}
              alt={pendingMatch.otherName}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </button>
        )}

        {/* Description */}
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          אתה ו<span className="font-semibold text-gray-800">{pendingMatch.otherName}</span> אהבתם אחד את השני 💕
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleStartChat}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            מתחילים לתכנן דייט!
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLater}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            אחר כך
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {pendingMatch && showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/55 flex items-end"
            onClick={() => setShowProfile(false)}
            dir="rtl"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md mx-auto bg-white rounded-t-3xl max-h-[92dvh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">פרופיל</h3>
                <button onClick={() => setShowProfile(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain">
                {details?.photo_urls?.filter(Boolean).length ? (
                  <>
                    {details.photo_urls.filter(Boolean).map((img, idx) => (
                      <img key={`${img}-${idx}`} src={img} alt={`${details.first_name} ${idx + 1}`} className="w-full h-64 object-cover rounded-2xl bg-gray-100" />
                    ))}
                  </>
                ) : pendingMatch.otherPhoto ? (
                  <img src={pendingMatch.otherPhoto} alt={pendingMatch.otherName} className="w-full h-64 object-cover rounded-2xl bg-gray-100" />
                ) : (
                  <div className="w-full h-64 rounded-2xl bg-gray-100 flex items-center justify-center text-6xl">👤</div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <h4 className="text-xl font-bold text-gray-900">
                    {details?.first_name ?? pendingMatch.otherName}{details?.age ? `, ${details.age}` : ''}
                  </h4>
                  {details?.location && <p className="text-sm text-gray-500 mt-1">{details.location}</p>}
                </div>

                {loadingDetails ? (
                  <p className="text-xs text-gray-400 text-center py-2">טוען פרופיל...</p>
                ) : (
                  <>
                    {details?.bio && (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 font-semibold mb-1">עליי</p>
                        <p className="text-sm text-gray-800 leading-relaxed">{details.bio}</p>
                      </div>
                    )}
                    {(details?.field_of_study || details?.university) && (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 font-semibold mb-1">לימודים</p>
                        {details?.field_of_study && <p className="text-sm text-gray-800">{details.field_of_study}</p>}
                        {details?.university && <p className="text-xs text-gray-500 mt-1">{details.university}</p>}
                      </div>
                    )}
                    {details?.meet_cute_activity && details?.meet_cute_mindset && details?.meet_cute_availability_vibe && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-xs text-blue-600 font-semibold mb-2">Meet Cute</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                            <span className="block text-base mb-0.5">
                              {MEET_CUTE_EMOJI.activity[details.meet_cute_activity as keyof typeof MEET_CUTE_EMOJI.activity]}
                            </span>
                            {MEET_CUTE_LABELS.activity[details.meet_cute_activity as keyof typeof MEET_CUTE_LABELS.activity]}
                          </div>
                          <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                            <span className="block text-base mb-0.5">
                              {MEET_CUTE_EMOJI.mindset[details.meet_cute_mindset as keyof typeof MEET_CUTE_EMOJI.mindset]}
                            </span>
                            {MEET_CUTE_LABELS.mindset[details.meet_cute_mindset as keyof typeof MEET_CUTE_LABELS.mindset]}
                          </div>
                          <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                            <span className="block text-base mb-0.5">
                              {MEET_CUTE_EMOJI.availabilityVibe[details.meet_cute_availability_vibe as keyof typeof MEET_CUTE_EMOJI.availabilityVibe]}
                            </span>
                            {MEET_CUTE_LABELS.availabilityVibe[details.meet_cute_availability_vibe as keyof typeof MEET_CUTE_LABELS.availabilityVibe]}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="h-2" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
