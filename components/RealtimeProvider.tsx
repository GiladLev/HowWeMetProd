'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '../lib/supabase';
import { useNotificationsStore } from '../lib/notifications-store';
import { useMatchStore } from '../lib/store';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const incrementMessages = useNotificationsStore((s) => s.incrementMessages);
  const setPendingMatch   = useMatchStore((s) => s.setPendingMatch);
  const setPendingLike    = useMatchStore((s) => s.setPendingLike);

  const incrementMessagesRef = useRef(incrementMessages);
  const setPendingMatchRef   = useRef(setPendingMatch);
  const setPendingLikeRef    = useRef(setPendingLike);
  incrementMessagesRef.current = incrementMessages;
  setPendingMatchRef.current   = setPendingMatch;
  setPendingLikeRef.current    = setPendingLike;

  useEffect(() => {
    const supabase = createClient();
    const channels: ReturnType<typeof supabase.channel>[] = [];
    let cancelled = false;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const userId = user.id;

      // Like notification — show popup with liker's profile
      const likesChannel = supabase
        .channel(`likes-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'likes', filter: `to_user_id=eq.${userId}` },
          async (payload) => {
            const like = payload.new as { id: string; from_user_id: string };
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, photo_urls, age, field_of_study')
              .eq('id', like.from_user_id)
              .single();
            if (profile) {
              setPendingLikeRef.current({
                likeId: like.id,
                fromUserId: like.from_user_id,
                fromName: profile.first_name || 'מישהו',
                fromPhoto: profile.photo_urls?.[0] ?? null,
                fromAge: profile.age ?? 0,
                fromFieldOfStudy: profile.field_of_study || '',
              });
            }
          },
        )
        .subscribe();
      channels.push(likesChannel);

      // Messages notification
      const messagesChannel = supabase
        .channel(`messages-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if ((payload.new as { sender_id: string }).sender_id !== userId) {
              incrementMessagesRef.current();
            }
          },
        )
        .subscribe();
      channels.push(messagesChannel);

      // Match notification — for when user2 receives a match from user1
      const matchChannel = supabase
        .channel(`matches-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'matches', filter: `user2_id=eq.${userId}` },
          async (payload) => {
            const match = payload.new as { id: string; user1_id: string };
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, photo_urls')
              .eq('id', match.user1_id)
              .single();
            setPendingMatchRef.current({
              matchId: match.id,
              otherName: profile?.first_name || 'משהו',
              otherPhoto: profile?.photo_urls?.[0] ?? null,
            });
          },
        )
        .subscribe();
      channels.push(matchChannel);
    }

    setup();

    return () => {
      cancelled = true;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
