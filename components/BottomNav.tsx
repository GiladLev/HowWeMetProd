'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Search, User } from 'lucide-react';
import { useAvailabilityStore } from '../lib/store';

const tabs = [
  { href: '/home',     icon: Home,          label: 'בית',    isHome: true  },
  { href: '/profiles', icon: Search,         label: 'חיפוש',  isHome: false },
  { href: '/matches',  icon: MessageCircle,  label: "צ'אט",   isHome: false },
  { href: '/profile',  icon: User,           label: 'פרופיל', isHome: false },
];

export function BottomNav() {
  const pathname      = usePathname();
  const isAvailable   = useAvailabilityStore((s) => s.isAvailable);

  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding')
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 right-0 left-0 max-w-md mx-auto bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map(({ href, icon: Icon, label, isHome }) => {
          const isChatTab = href === '/matches';
          const isActive =
            pathname === href ||
            (isChatTab && (pathname.startsWith('/matches') || pathname.startsWith('/chat')));

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? 'fill-blue-50' : ''}
                />

                {/* Green availability dot on Home */}
                {isHome && isAvailable && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}

              </div>

              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
