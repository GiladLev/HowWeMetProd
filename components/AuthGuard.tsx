'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';

const PUBLIC_PATHS = ['/auth', '/auth/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  const isAuthPage = pathname.startsWith('/auth');
  const isOnboarding = pathname.startsWith('/onboarding');
  const isPublic = pathname === '/' || PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    const supabase = createClient();
    let authCheckTimeout: NodeJS.Timeout;

    // Get initial session with timeout (iOS can be slow to propagate sessions)
    const authCheckPromise = supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Fallback: if auth check takes >3 seconds on protected page, assume no session
    authCheckTimeout = setTimeout(() => {
      if (user === undefined && !isPublic && !isOnboarding) {
        setUser(null);
      }
    }, 3000);

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(authCheckTimeout);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(authCheckTimeout);
    };
  }, []);

  useEffect(() => {
    if (user === undefined) return; // still loading
    if (isPublic || isOnboarding) return;
    if (!user) router.replace('/');
  }, [user, pathname, isPublic, isOnboarding, router]);

  // Show loading spinner while checking auth on protected pages (instead of blank screen)
  if (user === undefined && !isPublic && !isOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
