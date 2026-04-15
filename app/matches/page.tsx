'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock } from 'lucide-react';
import { createClient } from '../../lib/supabase';
import { useOnboardingGuard } from '../../lib/use-onboarding-guard';
import type { GameState } from '../../types';

interface MatchItem {
  matchId: string;
  createdAt: string;
  firstName: string;
  age: number | null;
  photoUrls: string[] | null;
  isAvailable: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  gameStatus: string; // e.g. "משחק 4/10", "סיכום דייט", "צ'אט"
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'עכשיו';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} ש׳`;
  return `לפני ${Math.floor(h / 24)} ימים`;
}

function getGameStatus(gameState: GameState | null, isConfirmed: boolean): string {
  if (isConfirmed || gameState?.phase === 'completed') return 'צ\'אט';
  return 'מתחילים להכיר...';
}

export default function MatchesPage() {
  const router = useRouter();
  const ready = useOnboardingGuard();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: matchRows } = await supabase
      .from('matches')
      .select('id, created_at, user1_id, user2_id, trivia_state, is_confirmed')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!matchRows?.length) { setMatches([]); setLoading(false); return; }

    const { data: blockRows } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
    const blockedIds = new Set<string>(
      (blockRows ?? []).map((b) => b.blocker_id === user.id ? b.blocked_id : b.blocker_id),
    );

    const visibleMatches = matchRows.filter((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      return !blockedIds.has(otherId);
    });

    if (!visibleMatches.length) { setMatches([]); setLoading(false); return; }

    const otherIds = visibleMatches.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id,
    );

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, first_name, age, photo_urls, is_available, available_until')
      .in('id', otherIds);

    const profileMap = Object.fromEntries(
      (profileRows ?? []).map((p) => [p.id, p]),
    );

    const items: MatchItem[] = await Promise.all(
      visibleMatches.map(async (m) => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
        const p = profileMap[otherId];

        const { data: msgRows } = await supabase
          .from('messages')
          .select('text, created_at')
          .eq('match_id', m.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const last = msgRows?.[0] ?? null;
        const gs = m.trivia_state as GameState | null;

        return {
          matchId: m.id,
          createdAt: m.created_at,
          firstName: p?.first_name ?? 'אנונימי',
          age: p?.age ?? null,
          photoUrls: p?.photo_urls ?? null,
          isAvailable:
            !!p?.is_available &&
            !!p?.available_until &&
            p.available_until > new Date().toISOString(),
          lastMessage: last?.text ?? null,
          lastMessageAt: last?.created_at ?? null,
          gameStatus: getGameStatus(gs, !!m.is_confirmed),
        };
      }),
    );

    setMatches(items);
    // #region agent log
    fetch('http://127.0.0.1:7632/ingest/e06a49b8-5b17-4017-9417-c5fa9e56cc49',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cdaf8a'},body:JSON.stringify({sessionId:'cdaf8a',runId:'initial',hypothesisId:'H8',location:'matches/page.tsx:loadMatches',message:'Matches list loaded',data:{matchRowsCount:matchRows?.length ?? 0,visibleMatchesCount:visibleMatches.length,itemsCount:items.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void loadMatches();

    const matchesChannel = supabase
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        void loadMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void loadMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void loadMatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_users' }, () => {
        void loadMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };
  }, [loadMatches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-dvh bg-gray-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 shrink-0 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">שיחות</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {matches.length > 0 ? `${matches.length} התאמות פעילות` : 'עדיין אין שיחות פעילות'}
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyMatches />
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {matches.map((match, i) => (
            <motion.button
              key={match.matchId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/chat/${match.matchId}`)}
              className="w-full flex gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 active:scale-[0.99] transition-all text-right"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  {match.photoUrls?.[0] ? (
                    <Image src={match.photoUrls[0]} alt={match.firstName} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                {!match.lastMessage && match.gameStatus === 'התאמה חדשה' && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white" />
                )}
                {match.isAvailable && (
                  <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {match.firstName}{match.age ? `, ${match.age}` : ''}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock size={9} />
                    {timeAgo(match.lastMessageAt ?? match.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {match.lastMessage ?? match.gameStatus}
                </p>
              </div>

              <ChevronLeft size={14} className="text-gray-300 self-center shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyMatches() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-sm p-7 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">עדיין אין התאמות</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          ברגע שיהיה מאצ׳ חדש, הוא יופיע כאן ותוכלו להתחיל להכיר.
        </p>
        <p className="mt-4 inline-flex px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100">
          מתעדכן בלייב
        </p>
      </div>
    </div>
  );
}
