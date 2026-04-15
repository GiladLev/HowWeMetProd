'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase';

/**
 * Checks that the signed-in user has completed every onboarding step.
 * If a step is missing it redirects to the right page automatically.
 *
 * Returns `ready = true` only when the check passes so the calling page
 * can delay rendering until then.
 */
export function useOnboardingGuard(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, gender, age, gender_preference, location, field_of_study, photo_urls, bio, is_onboarding_complete')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (!profile) {
        router.replace('/onboarding/email');
        return;
      }

      // Walk through each step in order — redirect to first incomplete one
      if (!profile.first_name)                          { router.replace('/onboarding/name');        return; }
      if (!profile.gender)                              { router.replace('/onboarding/gender');      return; }
      if (!profile.age)                                 { router.replace('/onboarding/age');         return; }
      if (!profile.gender_preference)                   { router.replace('/onboarding/looking-for'); return; }
      if (!profile.location)                            { router.replace('/onboarding/location');    return; }
      if (!profile.field_of_study)                      { router.replace('/onboarding/study');       return; }
      if (!profile.photo_urls || profile.photo_urls.length === 0) { router.replace('/onboarding/photos'); return; }
      if (!profile.bio)                                 { router.replace('/onboarding/about');       return; }

      if (!profile.is_onboarding_complete)              { router.replace('/onboarding/about');       return; }

      setReady(true);
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return ready;
}
