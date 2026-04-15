'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabase';
import type { Database } from './supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [counter, setCounter] = useState(0);
  const refresh = () => setCounter((c) => c + 1);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUserId(user.id);

        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת פרופיל');
      } finally {
        setLoading(false);
      }
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter]);

  return { profile, userId, loading, error, refresh };
}
