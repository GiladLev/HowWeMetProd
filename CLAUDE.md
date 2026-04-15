@AGENTS.md

# HowWeMet — Project Reference

Hebrew RTL dating app for Israeli university students. "Meet Cute" concept: users go available for a limited time, get matched, play trivia, then chat.

## Tech Stack

- **Next.js 16.2** (App Router) + **React 19** + **TypeScript 5**
- **Supabase** (Auth OTP/password, PostgreSQL, Realtime, Storage)
- **Zustand 5** (state) + **Framer Motion 12** (animations) + **Tailwind CSS 4** (styling)
- **Lucide React** (icons) + **date-fns** (dates) + **DotLottie** (Lottie animations)

## Commands

```bash
npm run dev     # dev server (localhost:3000)
npm run build   # production build
npm run lint    # ESLint
```

## Project Structure

```
app/                    # Next.js App Router pages
  layout.tsx            # Root: AuthGuard → RealtimeProvider → main(pb-20) → BottomNav
  page.tsx              # Welcome/splash (public)
  auth/login/           # Login (password or OTP)
  onboarding/           # 11-step signup (see flow below)
  home/                 # Availability toggle (pulsing ring, countdown)
  available/            # 3-step meet cute builder (activity/mindset/vibe)
  profiles/             # Discovery — vertical scroll cards, like/reject
  likes/                # Incoming likes list
  matches/              # Match list with unread badges
  chat/[id]/            # Chat + trivia game
  profile/              # View/edit profile (tabs), logout, delete account
  support/              # Support & FAQ page
  privacy/ terms/       # Legal pages
  api/delete-account/   # Hard-delete endpoint (service role)
components/
  AuthGuard.tsx         # Auth wall; public: /, /auth, /onboarding
  BottomNav.tsx         # 5 tabs: Home, Discover, Likes, Matches, Profile (fixed bottom, hidden on auth/onboarding)
  RealtimeProvider.tsx  # Supabase subscriptions (likes, messages, matches → badge counters)
  MatchPopup.tsx        # Celebration modal on mutual like
  TriviaScreen.tsx      # Icebreaker questions before chat unlocks
  ReportBlockSheet.tsx  # Block/report menu
lib/
  supabase.ts           # Browser client + Database types
  supabase-server.ts    # Server client
  store.ts              # Zustand: useAvailabilityStore, useAppStore, useMatchStore
  onboarding-store.ts   # Zustand (persisted): useOnboardingStore
  chat-store.ts         # Zustand: useChatStore
  notifications-store.ts # Zustand: useNotificationsStore (badge counters)
  cinderella-store.ts   # Zustand: useCinderellaStore (timed session)
  useProfile.ts         # Hook: fetch current user profile
  use-onboarding-guard.ts # Redirect if onboarding incomplete
  compress-image.ts     # Canvas resize (max 1200px, JPEG 0.82)
types/index.ts          # Shared types (Gender, MeetCute, DateActivity, Mindset, etc.)
```

## Onboarding Flow (order matters)

```
email → verify (OTP) → password → name → gender → age → looking-for → location → study → photos → about → /home
```

## Database Tables

| Table | Key Columns |
|-------|------------|
| `profiles` | id, first_name, age, gender, gender_preference, bio, photo_urls[], field_of_study, university, location, is_available, available_until, is_onboarding_complete, daily_likes_used, daily_likes_reset_at, is_suspended |
| `likes` | id, from_user_id, to_user_id |
| `matches` | id, user1_id, user2_id, trivia_state (JSONB), created_at |
| `messages` | id, match_id, sender_id, text, created_at |
| `blocked_users` | id, blocker_id, blocked_id |
| `reported_users` | id, reporter_id, reported_id, reason |

## Auth Flow

1. **Signup**: University email (.ac.il / .edu / gmail) → Supabase OTP → verify code → set password → onboarding
2. **Login**: Email + password OR OTP
3. **AuthGuard** wraps all pages; public paths: `/`, `/auth/*`, `/onboarding/*`
4. **Middleware** (`proxy.ts`): refreshes Supabase session on every request
5. **Logout**: `signOut()` + `window.location.href = '/'` (hard reload to clear all state)

## Design System

- **RTL Hebrew** — `dir="rtl"` on `<html>`, all text right-aligned
- **Primary**: blue-500 (`#3b82f6`), accents: indigo, gray
- **Cards**: `rounded-2xl`, `border border-gray-100`, `shadow-lg shadow-blue-200`
- **Buttons**: `rounded-2xl`, `py-4`, blue-500 bg for primary, gray-100 for secondary
- **Animations**: Framer Motion spring transitions on pages, `whileTap={{ scale: 0.97 }}`
- **Layout**: `max-w-md mx-auto` container, `pb-20` on main for BottomNav clearance
- **Font**: Inter / system sans-serif
- **BottomNav**: fixed bottom, ~60px, z-50

## Key Business Rules

- **Daily like quota**: 10 likes/day, resets at 2:00 AM (`daily_likes_used`, `daily_likes_reset_at`)
- **Mutual like = Match**: When both users like each other → create match + delete likes + show popup
- **Trivia game**: 3 questions before chat unlocks (stored in `matches.trivia_state`)
- **Meet Cute availability**: User selects activity + mindset + vibe, goes online for limited time
- **Gender filtering**: Discovery only shows profiles matching `gender_preference`
- **Image upload**: Compress → upload to Supabase Storage → store URLs in `photo_urls[]`
- **University validation**: Email must contain .ac.il, .edu, or gmail domain

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # only for api/delete-account
```
