'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const STEPS = [
  '/onboarding/email',
  '/onboarding/verify',
  '/onboarding/password',
  '/onboarding/name',
  '/onboarding/gender',
  '/onboarding/age',
  '/onboarding/looking-for',
  '/onboarding/location',
  '/onboarding/study',
  '/onboarding/photos',
  '/onboarding/about',
];

const BACK_MAP: Record<string, string> = {
  '/onboarding/verify':      '/onboarding/email',
  '/onboarding/password':    '/onboarding/verify',
  '/onboarding/name':        '/onboarding/password',
  '/onboarding/gender':      '/onboarding/name',
  '/onboarding/age':         '/onboarding/gender',
  '/onboarding/looking-for': '/onboarding/age',
  '/onboarding/location':    '/onboarding/looking-for',
  '/onboarding/study':       '/onboarding/location',
  '/onboarding/photos':      '/onboarding/study',
  '/onboarding/about':       '/onboarding/photos',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const stepIndex = STEPS.findIndex((s) => pathname.startsWith(s));
  const current = stepIndex + 1;
  const total = STEPS.length;
  const backHref = BACK_MAP[pathname];

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">

      {/* Top bar */}
      <div className="shrink-0 px-5 pt-safe pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          {/* Back button */}
          {backHref ? (
            <button
              onClick={() => router.push(backHref)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="w-9" />
          )}

          {/* Logo */}
          <span className="flex-1 text-center text-base font-bold text-blue-600 tracking-tight">
            HowWeMet
          </span>

          {/* Step counter */}
          <span className="text-xs text-gray-400 font-medium w-9 text-left">
            {current}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={false}
            animate={{ width: `${(current / total) * 100}%` }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
