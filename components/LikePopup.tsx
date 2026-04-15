'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useMatchStore } from '../lib/store';
import { createClient } from '../lib/supabase';
import { createInitialGameState, MEET_CUTE_LABELS } from '../types';

interface LikeProfileDetails {
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

export function LikePopup() {
  const pendingLike = useMatchStore((s) => s.pendingLike);
  const clearPendingLike = useMatchStore((s) => s.clearPendingLike);
  const setPendingMatch = useMatchStore((s) => s.setPendingMatch);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [details, setDetails] = useState<LikeProfileDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleAccept = async () => {
    if (!pendingLike || loading) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Create match
    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        user1_id: user.id,
        user2_id: pendingLike.fromUserId,
        trivia_state: createInitialGameState(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[LikePopup] match insert failed:', error);
      clearPendingLike();
      setLoading(false);
      return;
    }

    if (match) {
      // Delete the like
      await supabase.from('likes').delete().eq('id', pendingLike.likeId);

      // Show match popup
      clearPendingLike();
      setPendingMatch({
        matchId: match.id,
        otherName: pendingLike.fromName,
        otherPhoto: pendingLike.fromPhoto,
      });
    } else {
      clearPendingLike();
    }

    setLoading(false);
  };

  const handleReject = async () => {
    if (!pendingLike || loading) return;
    setLoading(true);

    const supabase = createClient();
    await supabase.from('likes').delete().eq('id', pendingLike.likeId);

    clearPendingLike();
    setLoading(false);
  };

  const openProfile = async () => {
    if (!pendingLike || loadingDetails) return;
    setShowProfile(true);
    if (details) return;
    setLoadingDetails(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('photo_urls, bio, location, university, field_of_study, meet_cute_activity, meet_cute_mindset, meet_cute_availability_vibe')
      .eq('id', pendingLike.fromUserId)
      .single();
    setDetails((data as LikeProfileDetails | null) ?? null);
    setLoadingDetails(false);
  };

  return (
    <AnimatePresence>
      {pendingLike && (
        <motion.div
          key="like-popup-main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl"
          >
            <span className="text-4xl block mb-3">💌</span>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-1">יש לך לייק חדש!</h2>
            <p className="text-sm text-gray-400 mb-5">מישהו מחכה להכיר אותך.</p>

            {/* Profile preview */}
            <button onClick={openProfile} className="w-full flex flex-col items-center mb-6 rounded-2xl hover:bg-gray-50 transition-colors py-2">
              {pendingLike.fromPhoto ? (
                <img
                  src={pendingLike.fromPhoto}
                  alt={pendingLike.fromName}
                  className="w-24 h-24 rounded-full object-cover border-3 border-blue-200 mb-3"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Heart size={32} className="text-blue-400" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">
                {pendingLike.fromName}, {pendingLike.fromAge}
              </h3>
              {pendingLike.fromFieldOfStudy && (
                <p className="text-sm text-gray-400">{pendingLike.fromFieldOfStudy}</p>
              )}
              <p className="text-xs text-blue-500 mt-1 font-semibold">לחצ/י לצפייה בפרופיל</p>
            </button>

            {/* Action buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleReject}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X size={16} /> לא הפעם
              </motion.button>
              <motion.button
                onClick={handleAccept}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Heart size={16} /> מתאים לי!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {pendingLike && showProfile && (
        <motion.div
          key="like-popup-profile"
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
                    <img
                      key={`${img}-${idx}`}
                      src={img}
                      alt={`${pendingLike.fromName} ${idx + 1}`}
                      className="w-full h-64 object-cover rounded-2xl bg-gray-100"
                    />
                  ))}
                </>
              ) : pendingLike.fromPhoto ? (
                <img src={pendingLike.fromPhoto} alt={pendingLike.fromName} className="w-full h-64 object-cover rounded-2xl bg-gray-100" />
              ) : (
                <div className="w-full h-64 rounded-2xl bg-gray-100 flex items-center justify-center text-6xl">👤</div>
              )}

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <h4 className="text-xl font-bold text-gray-900">
                  {pendingLike.fromName}, {pendingLike.fromAge}
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
  );
}
