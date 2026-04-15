'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Clock } from 'lucide-react';
import type { Profile } from '../types';

interface DiscoveryCardProps {
  profile: Profile;
  /** Called when user taps anywhere except the skip/like buttons */
  onOpen: () => void;
}

function timeLeft(expires: Date) {
  const m = Math.floor((expires.getTime() - Date.now()) / 60000);
  if (m <= 0) return null;
  return m >= 60 ? `${Math.floor(m / 60)}ש׳` : `${m} דק׳`;
}

/**
 * The "Discovery Feed Card" – shows ONLY:
 *   • Profile photo (full-bleed)
 *   • Name + age
 *   • Icebreaker (step3 free-text) as the hook
 *
 * Step 1 and Step 2 answers are intentionally hidden here
 * to drive curiosity and encourage tapping the card.
 */
export function DiscoveryCard({ profile, onOpen }: DiscoveryCardProps) {
  const photo = profile.photos[0];
  const icebreaker = profile.flowAnswers?.icebreaker;
  const tl = profile.isAvailable && profile.availabilityExpiresAt
    ? timeLeft(profile.availabilityExpiresAt)
    : null;

  return (
    <motion.div
      layoutId={`card-${profile.id}`}
      onClick={onOpen}
      className="relative h-full rounded-3xl overflow-hidden cursor-pointer bg-gray-200 shadow-xl shadow-black/10 select-none"
      whileTap={{ scale: 0.985 }}
    >
      {/* ── Full-bleed photo ── */}
      {photo && (
        <Image
          src={photo}
          alt={profile.firstName}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      )}

      {/* ── Top: availability pill ── */}
      {profile.isAvailable && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          זמינ{tl ? `ה · ${tl}` : 'ה'}
        </div>
      )}

      {/* ── Bottom gradient scrim ── */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

      {/* ── Bottom: name + icebreaker ── */}
      <div className="absolute bottom-0 right-0 left-0 p-5 z-10">

        {/* Name row */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white font-bold text-xl leading-tight drop-shadow-sm">
            {profile.firstName}, {profile.age}
          </h2>
          {profile.location && (
            <span className="text-white/60 text-xs flex items-center gap-0.5">
              <MapPin size={11} />
              {profile.location}
            </span>
          )}
        </div>

        {/* ── Icebreaker bubble – the ONLY content shown on card ── */}
        {icebreaker && (
          <IcebreakerBubble text={icebreaker} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Speech-bubble hook ───────────────────────────────────────────────────────

function IcebreakerBubble({ text }: { text: string }) {
  return (
    <div className="relative">
      {/* Bubble */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
        <p className="text-gray-900 text-sm font-medium leading-snug line-clamp-2">
          {text}
        </p>
      </div>
      {/* Tail pointing down-right */}
      <div
        className="absolute -bottom-2 left-4 w-4 h-4 bg-white/95 backdrop-blur-sm"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      />
      {/* Subtle "tap to see more" hint */}
      <div className="flex items-center gap-1 mt-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
              className="w-1 h-1 bg-white/60 rounded-full"
            />
          ))}
        </div>
        <span className="text-white/50 text-xs">לחץ לפרופיל מלא</span>
      </div>
    </div>
  );
}
