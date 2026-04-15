'use client';

import Image from 'next/image';
import { MapPin, Clock } from 'lucide-react';
import type { Profile } from '../types';
import { MEET_CUTE_LABELS } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onLike?: () => void;
  onSkip?: () => void;
  compact?: boolean;
}

function formatTimeLeft(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return 'פג תוקף';
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}ש׳ ${mins > 0 ? `${mins}ד׳` : ''}`;
  return `${minutes} דקות`;
}

export function ProfileCard({ profile, onLike, onSkip, compact = false }: ProfileCardProps) {
  const mainPhoto = profile.photos[0];
  const age = profile.age;

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm ${compact ? '' : 'card-hover'}`}>
      {/* Photo */}
      <div className={`relative w-full bg-gray-100 ${compact ? 'h-56' : 'h-80'}`}>
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={profile.firstName}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            👤
          </div>
        )}
        {/* Availability badge */}
        {profile.isAvailable && profile.availabilityExpiresAt && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            זמין עכשיו
          </div>
        )}
        {/* Time left overlay */}
        {profile.isAvailable && profile.availabilityExpiresAt && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Clock size={10} />
            {formatTimeLeft(profile.availabilityExpiresAt)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Name + Age */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">
            {profile.firstName}, {age}
          </h2>
          {profile.location && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={11} />
              {profile.location}
            </span>
          )}
        </div>

        {/* Height */}
        {profile.height && (
          <p className="text-xs text-gray-400 mb-3">{profile.height}</p>
        )}

        {/* Prompt answers */}
        {profile.prompts.slice(0, compact ? 1 : 2).map((p) => (
          <div key={p.id} className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{p.prompt}</p>
            <p className="text-sm text-gray-800 font-medium leading-relaxed">{p.answer}</p>
          </div>
        ))}

        {/* Meet Cute */}
        {profile.meetCute && !compact && (
          <div className="mt-3 bg-linear-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 mb-2">Meet Cute ✨</p>
            <div className="flex gap-2 flex-wrap">
              <Chip label={MEET_CUTE_LABELS.activity[profile.meetCute.activity]} />
              <Chip label={MEET_CUTE_LABELS.mindset[profile.meetCute.mindset]} />
              <Chip label={MEET_CUTE_LABELS.availabilityVibe[profile.meetCute.availabilityVibe]} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {(onLike || onSkip) && !compact && (
          <div className="flex gap-3 mt-4">
            {onSkip && (
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
              >
                דלג ✕
              </button>
            )}
            {onLike && (
              <button
                onClick={onLike}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-100"
              >
                לייק ♥
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="bg-white text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
      {label}
    </span>
  );
}
