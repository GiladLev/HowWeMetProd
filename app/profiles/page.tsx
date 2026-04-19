'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, X, MapPin, GraduationCap, User, Search, Sparkles, Ban, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '../../lib/supabase';
import { useOnboardingGuard } from '../../lib/use-onboarding-guard';
import type { ProfileRow } from '../../lib/useProfile';
import type { MeetCute } from '../../types';
import { createInitialGameState, MEET_CUTE_LABELS } from '../../types';
import { useAvailabilityStore, useMatchStore } from '../../lib/store';
import { notifyUser } from '../../lib/push-notify';
import Link from 'next/link';

// ─── Meet Cute (from live availability selection) ────────────────────────────
const MC_ACTIVITIES: MeetCute['activity'][] = ['coffee', 'drink', 'walk'];
const MC_MINDSETS: MeetCute['mindset'][] = ['real', 'flow', 'friends'];
const MC_AVAILABILITY_VIBES: MeetCute['availabilityVibe'][] = ['ready_now', 'one_hour', 'chat_first'];

function resolveMeetCute(profile: ProfileRow): MeetCute | null {
  const activity = profile.meet_cute_activity as MeetCute['activity'] | null;
  const mindset = profile.meet_cute_mindset as MeetCute['mindset'] | null;
  const availabilityVibe = profile.meet_cute_availability_vibe as MeetCute['availabilityVibe'] | null;

  if (!activity || !mindset || !availabilityVibe) return null;
  if (!MC_ACTIVITIES.includes(activity)) return null;
  if (!MC_MINDSETS.includes(mindset)) return null;
  if (!MC_AVAILABILITY_VIBES.includes(availabilityVibe)) return null;

  return { activity, mindset, availabilityVibe };
}

const CITY_COORDS: Record<string, { lat: number; lng: number; aliases: string[] }> = {
  tel_aviv: { lat: 32.0853, lng: 34.7818, aliases: ['תל אביב', 'תל-אביב', 'tel aviv', 'tlv'] },
  jerusalem: { lat: 31.7683, lng: 35.2137, aliases: ['ירושלים', 'jerusalem'] },
  haifa: { lat: 32.7940, lng: 34.9896, aliases: ['חיפה', 'haifa'] },
  beer_sheva: { lat: 31.2520, lng: 34.7915, aliases: ['באר שבע', 'באר-שבע', 'beer sheva', 'beersheba'] },
  rishon_lezion: { lat: 31.9710, lng: 34.7894, aliases: ['ראשון לציון', 'ראשון', 'rishon lezion'] },
  petah_tikva: { lat: 32.0840, lng: 34.8878, aliases: ['פתח תקווה', 'פתח תקוה', 'petah tikva'] },
  netanya: { lat: 32.3215, lng: 34.8532, aliases: ['נתניה', 'netanya'] },
  ashdod: { lat: 31.8014, lng: 34.6435, aliases: ['אשדוד', 'ashdod'] },
  holon: { lat: 32.0158, lng: 34.7874, aliases: ['חולון', 'holon'] },
  bat_yam: { lat: 32.0238, lng: 34.7503, aliases: ['בת ים', 'בת-ים', 'bat yam'] },
  bnei_brak: { lat: 32.0807, lng: 34.8338, aliases: ['בני ברק', 'bnei brak'] },
  herzliya: { lat: 32.1624, lng: 34.8447, aliases: ['הרצליה', 'herzliya'] },
  raanana: { lat: 32.1848, lng: 34.8713, aliases: ['רעננה', 'raanana'] },
  kfar_saba: { lat: 32.1782, lng: 34.9076, aliases: ['כפר סבא', 'kfar saba'] },
  rehovot: { lat: 31.8948, lng: 34.8113, aliases: ['רחובות', 'rehovot'] },
  ramat_gan: { lat: 32.0684, lng: 34.8248, aliases: ['רמת גן', 'ramat gan'] },
};

function normalizeLocation(input: string): string {
  return input.trim().toLowerCase();
}

function inferCityKey(location: string | null | undefined): string | null {
  if (!location) return null;
  const normalized = normalizeLocation(location);
  for (const [key, city] of Object.entries(CITY_COORDS)) {
    if (city.aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return key;
    }
  }
  return null;
}

function distanceKm(fromKey: string, toKey: string): number | null {
  const from = CITY_COORDS[fromKey];
  const to = CITY_COORDS[toKey];
  if (!from || !to) return null;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function isProfileAvailableNow(profile: ProfileRow): boolean {
  const nowIso = new Date().toISOString();
  return !!profile.is_available && !!profile.available_until && profile.available_until > nowIso;
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const ready = useOnboardingGuard();
  const setPendingMatch = useMatchStore((s) => s.setPendingMatch);
  const setAvailable = useAvailabilityStore((s) => s.setAvailable);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string>('');
  const [myId, setMyId]         = useState<string | null>(null);
  const [liking, setLiking]     = useState<string | null>(null); // profileId being liked
  const [blocking, setBlocking] = useState<string | null>(null); // profileId being blocked
  const [tick, setTick] = useState(0); // force re-render for countdowns
  const [likesRemaining, setLikesRemaining] = useState(10);
  const [isAvailableForLikes, setIsAvailableForLikes] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [myCityKey, setMyCityKey] = useState<string | null>(null);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [pendingRadiusKm, setPendingRadiusKm] = useState<number>(radiusKm ?? 50);
  const [myMeetCute, setMyMeetCute] = useState<MeetCute | null>(null);
  const [activatingAvailability, setActivatingAvailability] = useState(false);
  const canAccessDiscover = isAvailableForLikes;

  const loadProfiles = async () => {
    const supabase = createClient();
    try {
      setLoading(true);
      setError('');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('אימות נכשל');
      if (!user) { setLoading(false); return; }
      setMyId(user.id);

      // Already matched
      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      if (matchError) throw new Error('שגיאה בטעינת התאמות');
      const matchedIds = new Set<string>(
        (matchRows ?? []).map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id)),
      );

      // Blocked users
      const { data: blockRows, error: blockError } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      if (blockError) throw new Error('שגיאה בטעינת חסימות');
      const blockedIds = new Set<string>(
        (blockRows ?? []).map((b) => b.blocker_id === user.id ? b.blocked_id : b.blocker_id),
      );

      // My profile: gender_preference, daily likes quota
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('gender_preference, daily_likes_used, daily_likes_reset_at, is_available, available_until, location, meet_cute_activity, meet_cute_mindset, meet_cute_availability_vibe')
        .eq('id', user.id)
        .single();
      if (profileError) throw new Error('שגיאה בטעינת הפרופיל');
      const myTargetGender = myProfile?.gender_preference ?? 'both';
      const myMeetCuteActivity = myProfile?.meet_cute_activity as MeetCute['activity'] | null;
      const myMeetCuteMindset = myProfile?.meet_cute_mindset as MeetCute['mindset'] | null;
      const myMeetCuteVibe = myProfile?.meet_cute_availability_vibe as MeetCute['availabilityVibe'] | null;
      const hasValidMeetCute =
        !!myMeetCuteActivity &&
        !!myMeetCuteMindset &&
        !!myMeetCuteVibe &&
        MC_ACTIVITIES.includes(myMeetCuteActivity) &&
        MC_MINDSETS.includes(myMeetCuteMindset) &&
        MC_AVAILABILITY_VIBES.includes(myMeetCuteVibe);
      setMyMeetCute(
        hasValidMeetCute
          ? { activity: myMeetCuteActivity, mindset: myMeetCuteMindset, availabilityVibe: myMeetCuteVibe }
          : null,
      );
      const nowIso = new Date().toISOString();
      const isCurrentlyAvailable =
        !!myProfile?.is_available &&
        !!myProfile?.available_until &&
        myProfile.available_until > nowIso;
      setIsAvailableForLikes(isCurrentlyAvailable);
      setMyCityKey(inferCityKey(myProfile?.location));

      // Check if daily likes quota needs reset
      const nowDate = new Date();
      const resetHour = new Date(nowDate);
      resetHour.setHours(2, 0, 0, 0);
      if (resetHour > nowDate) resetHour.setDate(resetHour.getDate() - 1);

      const needsReset = myProfile && new Date(myProfile.daily_likes_reset_at) < resetHour;
      if (needsReset) {
        const { error: updateError } = await supabase.from('profiles').update({ daily_likes_used: 0, daily_likes_reset_at: nowDate.toISOString() }).eq('id', user.id);
        if (updateError) throw updateError;
        setLikesRemaining(10);
      } else {
        setLikesRemaining(Math.max(0, 10 - (myProfile?.daily_likes_used ?? 0)));
      }

      // Fetch all available profiles that match gender preference
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_available', true)
        .gt('available_until', new Date().toISOString());

      if (myTargetGender !== 'both') query = query.eq('gender', myTargetGender);

      const { data, error: dataError } = await query.order('created_at', { ascending: false });
      if (dataError) throw new Error('שגיאה בטעינת פרופילים');

      // Get profiles I've already liked
      const { data: likedProfiles, error: likedError } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);
      if (likedError) throw new Error('שגיאה בטעינת הלייקים שלך');

      const likedIds = new Set(likedProfiles?.map((l) => l.to_user_id) ?? []);

      // Filter out: blocked, already matched and already liked profiles
      const filtered = (data ?? []).filter(
        (p) => isProfileAvailableNow(p) && !blockedIds.has(p.id) && !matchedIds.has(p.id) && !likedIds.has(p.id),
      );
      setAllProfiles(filtered);
      setProfiles(filtered);

      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בטעינת הדף';
      setError(message);
      setLoading(false);
    }
  };

  // Refresh countdowns every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void loadProfiles();

    const profilesChannel = supabase
      .channel('discover-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new as ProfileRow | undefined;
        if (updated?.id) {
          const nowIso = new Date().toISOString();
          const stillAvailable =
            !!updated.is_available &&
            !!updated.available_until &&
            updated.available_until > nowIso;

          if (!stillAvailable) {
            setAllProfiles(prev => prev.filter((p) => p.id !== updated.id));
            setProfiles(prev => prev.filter((p) => p.id !== updated.id));
          }
        }
        void loadProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  useEffect(() => {
    if (radiusKm === null || !myCityKey) {
      setProfiles(allProfiles);
      return;
    }

    const distanceFiltered = allProfiles.filter((profile) => {
      if (!isProfileAvailableNow(profile)) return false;
      const targetCityKey = inferCityKey(profile.location);
      if (!targetCityKey) return false;
      const km = distanceKm(myCityKey, targetCityKey);
      return km !== null && km <= radiusKm;
    });
    setProfiles(distanceFiltered);
  }, [allProfiles, radiusKm, myCityKey]);

  const handleLike = async (profile: ProfileRow) => {
    if (!myId || liking) return;
    if (!canAccessDiscover) {
      setError('צריך להיות זמינ/ה כדי לשלוח לייקים. הפעילי זמינות במסך הבית.');
      return;
    }

    if (likesRemaining <= 0) {
      setError('נגמרו לך הלייקים להיום. חזור מחר!');
      return;
    }

    setLiking(profile.id);
    setError('');
    const supabase = createClient();

    try {
      // Safety check: do not allow liking users that are already matched or blocked.
      const [{ data: existingMatch }, { data: blockRelation }] = await Promise.all([
        supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${myId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${myId})`)
          .maybeSingle(),
        supabase
          .from('blocked_users')
          .select('id')
          .or(`and(blocker_id.eq.${myId},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${myId})`)
          .maybeSingle(),
      ]);

      if (existingMatch) {
        setAllProfiles((prev) => prev.filter((p) => p.id !== profile.id));
        setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
        setError('כבר קיימת התאמה עם המשתמש הזה.');
        setLiking(null);
        return;
      }

      if (blockRelation) {
        setAllProfiles((prev) => prev.filter((p) => p.id !== profile.id));
        setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
        setError('לא ניתן לשלוח לייק למשתמש חסום.');
        setLiking(null);
        return;
      }

      const { error, data: insertedData } = await supabase
        .from('likes')
        .insert({ from_user_id: myId, to_user_id: profile.id })
        .select('id')
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          setError('כבר לייקת את הפרופיל הזה.');
        } else {
          setError('שגיאה בשליחת הלייק');
          console.error('[like] insert failed:', error.message);
        }
        setLiking(null);
        return;
      }

      // Check for mutual like: did profile already like me?
      const { data: reverseData, error: reverseError } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', profile.id)
        .eq('to_user_id', myId)
        .single();

      if (reverseError && reverseError.code !== 'PGRST116') throw reverseError; // PGRST116 = not found

      if (reverseData) {
        // Mutual like detected! Create match and show popup
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: myId,
            user2_id: profile.id,
            trivia_state: createInitialGameState(),
          })
          .select('id')
          .single();

        if (matchError) throw matchError;

        if (matchData) {
          // Delete both likes
          await supabase
            .from('likes')
            .delete()
            .or(`from_user_id.eq.${myId},from_user_id.eq.${profile.id}`);

          // Fetch other user's profile for popup
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('first_name, photo_urls')
            .eq('id', profile.id)
            .single();

          // Set pending match to trigger popup
          setPendingMatch({
            matchId: matchData.id,
            otherName: otherProfile?.first_name || 'משהו',
            otherPhoto: otherProfile?.photo_urls?.[0] ?? null,
          });

          // Notify the other user about the match
          notifyUser(profile.id, 'התאמה חדשה! 🎉', 'מישהו לייק אותך בחזרה — יש לכם מאצ\'!', {
            screen: 'chat',
            matchId: matchData.id,
            url: `/chat/${matchData.id}`,
          });

          // Move to next profile
          setProfiles(profiles.slice(1));
          setLiking(null);
          return;
        }
      }

      // No mutual like yet, just increment daily_likes_used
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ daily_likes_used: 10 - likesRemaining + 1 })
        .eq('id', myId);

      if (updateError) throw updateError;

      // Notify the other user that someone liked them
      notifyUser(profile.id, 'לייק חדש! ❤️', 'מישהו חדש אוהב את הפרופיל שלך', {
        screen: 'matches',
        url: '/profiles',
      });

      setLikesRemaining(likesRemaining - 1);

      // Move to next profile
      setProfiles(profiles.slice(1));
      setLiking(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחת הלייק';
      setError(message);
      setLiking(null);
    }
  };

  const handleBlock = async (profile: ProfileRow) => {
    if (!myId || blocking) return;
    const confirmed = window.confirm(`לחסום את ${profile.first_name}?`);
    if (!confirmed) return;

    setBlocking(profile.id);
    setError('');
    const supabase = createClient();

    try {
      const { error: insertError } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: myId, blocked_id: profile.id });

      if (insertError && !insertError.message.toLowerCase().includes('duplicate')) {
        throw insertError;
      }

      // Clean existing relationship immediately: likes + match (messages cascade on match delete).
      await supabase
        .from('likes')
        .delete()
        .or(`and(from_user_id.eq.${myId},to_user_id.eq.${profile.id}),and(from_user_id.eq.${profile.id},to_user_id.eq.${myId})`);

      await supabase
        .from('matches')
        .delete()
        .or(`and(user1_id.eq.${myId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${myId})`);

      setAllProfiles(prev => prev.filter(p => p.id !== profile.id));
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בחסימה';
      setError(message);
    } finally {
      setBlocking(null);
    }
  };

  const handleActivateAvailability = async () => {
    if (activatingAvailability || canAccessDiscover) return;

    const chosenMeetCute: MeetCute = myMeetCute ?? {
      activity: 'coffee',
      mindset: 'flow',
      availabilityVibe: 'ready_now',
    };

    setActivatingAvailability(true);
    setError('');
    const durationMinutes = 180;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('משתמש לא מחובר');

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          is_available: true,
          available_until: expiresAt.toISOString(),
          meet_cute_activity: chosenMeetCute.activity,
          meet_cute_mindset: chosenMeetCute.mindset,
          meet_cute_availability_vibe: chosenMeetCute.availabilityVibe,
        })
        .eq('id', user.id);
      if (updateErr) throw updateErr;

      setAvailable(durationMinutes, chosenMeetCute);
      setIsAvailableForLikes(true);
      await loadProfiles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'לא הצלחנו להפעיל זמינות כרגע';
      setError(message);
    } finally {
      setActivatingAvailability(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4">
        {error ? (
          <>
            <div className="text-lg text-red-600 font-semibold text-center px-6">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              נסה שוב
            </button>
          </>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        )}
      </div>
    );
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (!canAccessDiscover) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-6" dir="rtl">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
            <span className="text-3xl">🟢</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">צריך להיות זמין/ה כדי לגשת לחיפוש</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            כדי להמשיך לחיפוש, נכנסים לשאלון ומפעילים זמינות
          </p>
          <Link
            href="/home?questionnaire=1"
            className="w-full inline-flex items-center justify-center py-3 rounded-2xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            להיות זמין
          </Link>
        </div>
      </div>
    );
  }

  const visibleProfiles = profiles.filter(isProfileAvailableNow);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 overflow-hidden" dir="rtl">
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200"
        >
          <span className="text-sm text-red-600">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </motion.div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">מי בסביבה שלך?</h1>
        </div>
        <button
          onClick={() => {
            setPendingRadiusKm(radiusKm ?? 50);
            setShowDistanceModal(true);
          }}
          className="h-9 px-3 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
        >
          פילטר
        </button>
      </header>

      <>
      {/* Single profile card with stack effect */}
      {visibleProfiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              showActivateCta={!canAccessDiscover}
              activating={activatingAvailability}
              onActivate={handleActivateAvailability}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Background card stacks for visual depth */}
            {visibleProfiles[1] && (
              <div className="absolute inset-0 mx-8 my-4 rounded-3xl bg-gray-100/80 border border-gray-100 z-0"
                style={{ transform: 'translateY(-16px) scale(0.94)' }}
              />
            )}
            {visibleProfiles[2] && (
              <div className="absolute inset-0 mx-4 my-4 rounded-3xl bg-gray-100/40 border border-gray-100 z-0"
                style={{ transform: 'translateY(-8px) scale(0.97)' }}
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={visibleProfiles[0]?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="flex-1 flex flex-col overflow-hidden relative z-10"
              >
                <ProfileCardScrollable
                  profile={visibleProfiles[0]}
                  meetCute={resolveMeetCute(visibleProfiles[0])}
                  liking={liking === visibleProfiles[0].id}
                  blocking={blocking === visibleProfiles[0].id}
                  disabled={!canAccessDiscover || likesRemaining <= 0 || !!liking || !!blocking}
                  onLike={() => handleLike(visibleProfiles[0])}
                  onBlock={() => handleBlock(visibleProfiles[0])}
                  onReject={() => {
                    // Remove from list and show next
                    setProfiles(profiles.filter((p) => p.id !== visibleProfiles[0].id));
                  }}
                  tick={tick}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </>

      <AnimatePresence>
        {showDistanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/35 flex items-start justify-center p-4 pt-16"
            onClick={() => setShowDistanceModal(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">סינון לפי מרחק</h3>
              <p className="text-xs text-gray-500 mb-4">בחר/י רדיוס חיפוש משוער לפי עיר</p>

              <div className="text-center mb-2">
                <span className="text-2xl font-bold tracking-tight text-blue-600">{pendingRadiusKm} ק"מ</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={pendingRadiusKm}
                onChange={(e) => setPendingRadiusKm(Number(e.target.value))}
                className="w-full accent-blue-500"
              />

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setRadiusKm(null)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    radiusKm === null
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  כל הארץ
                </button>
                <button
                  onClick={() => {
                    setRadiusKm(pendingRadiusKm);
                    setShowDistanceModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  החל
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Profile Card - Scrollable Layout ────────────────────────────────────────

function ProfileCardScrollable({
  profile, meetCute, liking, blocking, disabled, onLike, onBlock, onReject, tick,
}: {
  profile: ProfileRow;
  meetCute: MeetCute | null;
  liking: boolean;
  blocking: boolean;
  disabled: boolean;
  onLike: () => void;
  onBlock: () => void;
  onReject: () => void;
  tick: number;
}) {
  void tick; // used by parent to trigger re-render
  const [showActions, setShowActions] = useState(false);
  const photos = profile.photo_urls?.filter(Boolean) ?? [];

  const genderLabel = profile.gender === 'male' ? 'גבר' : profile.gender === 'female' ? 'אישה' : profile.gender === 'other' ? 'אחר' : null;
  const prefLabel =
    profile.gender_preference === 'male' ? 'מחפש/ת גברים' :
    profile.gender_preference === 'female' ? 'מחפש/ת נשים' :
    'מחפש/ת את שניהם';

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full mx-4 my-4">
      {/* Scrollable vertical content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* First photo + name overlay */}
        <div className="relative bg-gray-100 aspect-[3/4] shrink-0">
          {photos.length > 0 ? (
            <Image src={photos[0]} alt={profile.first_name} fill className="object-cover" sizes="440px" loading="eager" />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-sky-100 flex items-center justify-center">
              <span className="text-7xl">👤</span>
            </div>
          )}
          {/* Gradient overlay with name */}
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
            <h2 className="text-[30px] font-bold tracking-tight text-white drop-shadow-sm">
              {profile.first_name}{profile.age ? `, ${profile.age}` : ''}
            </h2>
            {profile.location && (
              <p className="text-sm text-white/90 flex items-center gap-1 mt-1 font-medium">
                <MapPin size={13} />
                {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Basic info pills */}
        <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
          {genderLabel && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-full border border-blue-100">
              <User size={12} />
              {genderLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
            <Search size={12} />
            {prefLabel}
          </span>
        </div>

        {/* Bio section */}
        {profile.bio && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">עליי</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-4 border border-gray-100">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Meet Cute from availability */}
        {meetCute && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Meet Cute</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                <span className="text-xl block">☕</span>
                <span className="text-[11px] text-blue-800 font-semibold leading-tight">
                  {MEET_CUTE_LABELS.activity[meetCute.activity]}
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                <span className="text-xl block">🎯</span>
                <span className="text-[11px] text-blue-800 font-semibold leading-tight">
                  {MEET_CUTE_LABELS.mindset[meetCute.mindset]}
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                <span className="text-xl block">📱</span>
                <span className="text-[11px] text-blue-800 font-semibold leading-tight">
                  {MEET_CUTE_LABELS.availabilityVibe[meetCute.availabilityVibe]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Second photo */}
        {photos[1] && (
          <div className="relative bg-gray-100 aspect-[3/4] shrink-0 mt-4">
            <Image src={photos[1]} alt={`${profile.first_name} 2`} fill className="object-cover" sizes="440px" loading="lazy" />
          </div>
        )}

        {/* Study details */}
        {(profile.field_of_study || profile.university) && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <GraduationCap size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">לימודים</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-1">
              {profile.field_of_study && (
                <p className="text-sm text-gray-800 font-semibold flex items-center gap-1.5">
                  <BookOpen size={13} className="text-gray-400" />
                  {profile.field_of_study}
                </p>
              )}
              {profile.university && (
                <p className="text-xs text-gray-500">
                  {profile.university}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Location details */}
        {profile.location && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">מיקום</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-800 font-semibold">{profile.location}</p>
            </div>
          </div>
        )}

        {/* Third photo */}
        {photos[2] && (
          <div className="relative bg-gray-100 aspect-[3/4] shrink-0 mt-4">
            <Image src={photos[2]} alt={`${profile.first_name} 3`} fill className="object-cover" sizes="440px" loading="lazy" />
          </div>
        )}

        {/* Remaining photos stacked */}
        {photos.slice(3).map((url, i) => (
          <div key={i + 3} className="relative bg-gray-100 aspect-[3/4] shrink-0 mt-4">
            <Image src={url} alt={`${profile.first_name} ${i + 4}`} fill className="object-cover" sizes="440px" loading="lazy" />
          </div>
        ))}

        {/* Bottom spacer */}
        <div className="h-4 shrink-0" />
      </div>

      {/* Action buttons - sticky at bottom */}
      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-gray-100 flex gap-2">
        <div className="relative">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="px-3 py-3 rounded-2xl bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:scale-[0.98] transition-all"
            aria-label="פעולות נוספות"
          >
            <MoreVertical size={16} />
          </button>
          {showActions && (
            <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-1 min-w-[120px] z-20">
              <button
                onClick={() => {
                  setShowActions(false);
                  onBlock();
                }}
                disabled={disabled}
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${
                  disabled ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
                }`}
              >
                {blocking ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <Ban size={14} />}
                חסום
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onReject}
          disabled={disabled}
          className={`flex-1 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-[0.98]'
          }`}
        >
          <X size={20} />
        </button>
        <button
          onClick={onLike}
          disabled={disabled}
          className={`flex-1 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-[0.98]'
          }`}
        >
          {liking ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Heart size={20} className="fill-current" />
              לייק
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  showActivateCta,
  activating,
  onActivate,
}: {
  showActivateCta: boolean;
  activating: boolean;
  onActivate: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
        <span className="text-4xl">✨</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">כרגע אין אנשים זמינים</h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-4">
        סיימת לעבור על כל האנשים שזמינים כרגע באזור שלך.
      </p>
      <p className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
        הרשימה מתעדכנת בלייב כשמשתמשים זמינים
      </p>
      {showActivateCta && (
        <button
          onClick={onActivate}
          disabled={activating}
          className="mt-4 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {activating ? 'מפעיל זמינות...' : 'להיות זמין/ה עכשיו'}
        </button>
      )}
    </div>
  );
}
