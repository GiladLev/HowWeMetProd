'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '../lib/supabase';

/**
 * Listens for the Expo native bridge to provide a push token,
 * then saves it to the user's profile in Supabase.
 * Only active when running inside the native WebView wrapper.
 */
export function PushTokenBridge() {
  const savedRef = useRef<string | null>(null);

  useEffect(() => {
    const handleToken = async (e: Event) => {
      const token = (e as CustomEvent).detail?.token;
      if (!token || typeof token !== 'string' || token === savedRef.current) return;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Save directly to Supabase (client-side, RLS allows own-row update)
        await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);

        savedRef.current = token;
      } catch {
        // Silently ignore — non-critical
      }
    };

    window.addEventListener('nativePushToken', handleToken);

    // Also check if the bridge already injected the token before this component mounted
    const bridge = (window as any).ReactNativeBridge;
    if (bridge?.pushToken) {
      handleToken(new CustomEvent('nativePushToken', { detail: { token: bridge.pushToken } }));
    }

    return () => window.removeEventListener('nativePushToken', handleToken);
  }, []);

  return null;
}
