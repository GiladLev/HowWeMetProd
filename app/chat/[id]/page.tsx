'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCheck, MoreVertical, X } from 'lucide-react';
import { createClient } from '../../../lib/supabase';
import { ReportBlockSheet } from '../../../components/ReportBlockSheet';
import GameFlowManager from '../../../components/games/GameFlowManager';
import { MEET_CUTE_LABELS, type GameState, type DatePlan } from '../../../types';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

interface OtherProfile {
  id: string;
  first_name: string;
  age: number | null;
  photo_urls: string[] | null;
  bio: string | null;
  location: string | null;
  field_of_study: string | null;
  university: string | null;
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

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [myId, setMyId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [otherId, setOtherId] = useState<string | null>(null);

  // Limited chat state (after date confirmed)
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [datePlan, setDatePlan] = useState<DatePlan | null>(null);
  const [showDecision, setShowDecision] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async (targetMatchId: string) => {
    const supabase = createClient();
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, text, created_at')
      .eq('match_id', targetMatchId)
      .order('created_at', { ascending: true });
    setMessages(msgs ?? []);
  }, []);

  // ── Load match data ────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        setError('');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw new Error('אימות נכשל');
        if (!user) return;
        setMyId(user.id);

        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('user1_id, user2_id, trivia_state, is_confirmed')
          .eq('id', matchId)
          .single();

        if (matchError) throw new Error('שיחה לא נמצאה');

        if (match) {
          const resolvedOtherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          setOtherId(resolvedOtherId);

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, age, photo_urls, bio, location, field_of_study, university, meet_cute_activity, meet_cute_mindset, meet_cute_availability_vibe')
            .eq('id', resolvedOtherId)
            .single();

          if (profileError) throw new Error('פרטי המשתמש לא זמינים');
          setOtherProfile(profile);

          if (match.trivia_state) {
            const gs = match.trivia_state as GameState;
            setGameState(gs);

            // Game completed -> unlock chat immediately
            if (gs.phase === 'completed') {
              setChatUnlocked(true);
              await loadMessages(matchId);
            }
          }

          // Backward compatibility for older match flow.
          if (match.is_confirmed) {
            setChatUnlocked(true);
            await loadMessages(matchId);
          }
        }

        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
        setLoading(false);
      }
    }

    load();

    // Realtime for messages (limited chat)
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .subscribe();

    // Realtime for trivia_state updates (for decision sync)
    const gameChannel = supabase
      .channel(`game-decision-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}`,
      }, (payload) => {
        const updated = payload.new as { trivia_state?: GameState; is_confirmed?: boolean };
        if (updated.trivia_state) {
          const gs = updated.trivia_state;
          setGameState(gs);
          if (gs.phase === 'completed') {
            setChatUnlocked(true);
            void loadMessages(matchId);
          }
        }
        if (updated.is_confirmed) {
          setChatUnlocked(true);
          void loadMessages(matchId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(gameChannel);
    };
  }, [matchId, loadMessages]);

  useEffect(() => {
    if (!chatUnlocked) return;
    void loadMessages(matchId);
  }, [chatUnlocked, matchId, loadMessages]);

  // ── Games completed ────────────────────────────────────────────────────────
  const handleAllGamesComplete = useCallback((plan: DatePlan) => {
    setDatePlan(plan);
    setShowDecision(true);
  }, []);

  // ── Send message (limited chat) ────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !myId) return;
    setSending(true);
    setInput('');
    inputRef.current?.focus();

    const supabase = createClient();
    const { error: insertError } = await supabase.from('messages').insert({ match_id: matchId, sender_id: myId, text });
    if (insertError) {
      setInput(text);
    }
    setSending(false);
  }, [input, sending, myId, matchId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        {error ? (
          <>
            <div className="text-lg text-red-600 font-semibold">{error}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
              נסה שוב
            </button>
          </>
        ) : (
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  if (!otherProfile) {
    return <div className="flex items-center justify-center h-full min-h-[60vh] text-gray-400">שיחה לא נמצאה</div>;
  }

  const photo = otherProfile.photo_urls?.[0];
  const matchCount = Number(gameState?.games?.['5']?.playerData?.__state?.matches ?? 0);

  return (
    <div
      // התיקון כאן: חישוב הגובה פחות גובה תפריט הניווט (כברירת מחדל 64px)
      className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden bg-white relative"
      dir="rtl"
    >

      {/* ── Header ── */}
      <header className="shrink-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex-1 min-w-0 flex items-center gap-3 rounded-2xl hover:bg-gray-50 transition-colors text-right px-1 py-1"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
              {photo ? (
                <Image src={photo} alt={otherProfile.first_name} width={40} height={40} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {otherProfile.first_name}{otherProfile.age ? `, ${otherProfile.age}` : ''}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                {chatUnlocked ? 'צ\'אט' : 'משחק התאמות'}
              </p>
            </div>
          </button>
          <button onClick={() => setShowSheet(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Game flow */}
        {gameState && (gameState.phase === 'lobby' || gameState.phase === 'playing' || gameState.phase === 'choosing') && myId && otherId && (
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            <GameFlowManager
              matchId={matchId}
              userId={myId}
              otherUserId={otherId}
              otherUserName={otherProfile.first_name}
              initialGameState={gameState}
              onAllGamesComplete={handleAllGamesComplete}
            />
          </div>
        )}

        {/* Limited chat (after both said yes) */}
        {chatUnlocked && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0 px-4 py-2 bg-blue-50 border-y border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium">
                 מצאתם {matchCount} התאמות במשחק.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === myId;
                  const prevSender = messages[i - 1]?.sender_id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className={`flex items-end gap-2 ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'} ${prevSender === msg.sender_id ? 'mt-0.5' : 'mt-3'}`}
                    >
                      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe ? 'bg-blue-500 text-white rounded-tl-sm shadow-md shadow-blue-100'
                               : 'bg-white text-gray-800 rounded-tr-sm border border-gray-100 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] text-gray-400">{fmtTime(msg.created_at)}</span>
                          {isMe && <CheckCheck size={11} className="text-blue-400" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-100 pb-safe">
              <div className="flex items-center gap-2">
                <div className={`flex-1 flex items-center bg-gray-50 rounded-2xl border transition-all ${input ? 'border-blue-300 bg-white' : 'border-gray-200'}`}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="הקלדת הודעה..."
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 px-4 py-3 outline-none"
                    dir="rtl"
                  />
                </div>
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  whileTap={{ scale: 0.88 }}
                  className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    input.trim() ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Send size={17} className="rotate-180" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report / Block sheet */}
      <AnimatePresence>
        {showSheet && (
          <ReportBlockSheet
            reportedId={otherProfile.id}
            reportedName={otherProfile.first_name}
            onClose={() => setShowSheet(false)}
            onBlocked={() => router.replace('/matches')}
            onEndGame={() => router.replace('/home')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 flex items-end"
            onClick={() => setShowProfileModal(false)}
            dir="rtl"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="w-full max-w-md mx-auto bg-white rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">עם מי מדברים</h3>
                <button onClick={() => setShowProfileModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain">
                <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
                  {photo ? (
                    <Image src={photo} alt={otherProfile.first_name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                  )}
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <h4 className="text-xl font-bold text-gray-900">
                    {otherProfile.first_name}{otherProfile.age ? `, ${otherProfile.age}` : ''}
                  </h4>
                  {otherProfile.location && <p className="text-sm text-gray-500 mt-1">{otherProfile.location}</p>}
                </div>

                {otherProfile.meet_cute_activity && otherProfile.meet_cute_mindset && otherProfile.meet_cute_availability_vibe && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-xs text-blue-600 font-semibold mb-2">Meet Cute</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                        <span className="block text-base mb-0.5">
                          {MEET_CUTE_EMOJI.activity[otherProfile.meet_cute_activity as keyof typeof MEET_CUTE_EMOJI.activity]}
                        </span>
                        {MEET_CUTE_LABELS.activity[otherProfile.meet_cute_activity as keyof typeof MEET_CUTE_LABELS.activity]}
                      </div>
                      <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                        <span className="block text-base mb-0.5">
                          {MEET_CUTE_EMOJI.mindset[otherProfile.meet_cute_mindset as keyof typeof MEET_CUTE_EMOJI.mindset]}
                        </span>
                        {MEET_CUTE_LABELS.mindset[otherProfile.meet_cute_mindset as keyof typeof MEET_CUTE_LABELS.mindset]}
                      </div>
                      <div className="bg-white rounded-xl p-2 text-[11px] font-semibold text-blue-900">
                        <span className="block text-base mb-0.5">
                          {MEET_CUTE_EMOJI.availabilityVibe[otherProfile.meet_cute_availability_vibe as keyof typeof MEET_CUTE_EMOJI.availabilityVibe]}
                        </span>
                        {MEET_CUTE_LABELS.availabilityVibe[otherProfile.meet_cute_availability_vibe as keyof typeof MEET_CUTE_LABELS.availabilityVibe]}
                      </div>
                    </div>
                  </div>
                )}

                {otherProfile.bio && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 font-semibold mb-1">עליי</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{otherProfile.bio}</p>
                  </div>
                )}

                {(otherProfile.field_of_study || otherProfile.university) && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 font-semibold mb-1">לימודים</p>
                    {otherProfile.field_of_study && <p className="text-sm text-gray-800">{otherProfile.field_of_study}</p>}
                    {otherProfile.university && <p className="text-xs text-gray-500 mt-1">{otherProfile.university}</p>}
                  </div>
                )}

                {(otherProfile.photo_urls ?? []).slice(1).map((img, idx) => (
                  <div key={`${img}-${idx}`} className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
                    <Image src={img} alt={`${otherProfile.first_name} ${idx + 2}`} fill className="object-cover" />
                  </div>
                ))}

                <div className="h-2" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}