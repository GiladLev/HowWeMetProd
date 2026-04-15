'use client';

import { create } from 'zustand';
import type { AvailabilityDuration, MeetCute, Profile } from '../types';

interface AvailabilityState {
  isAvailable: boolean;
  duration: AvailabilityDuration | null;
  expiresAt: Date | null;
  meetCute: MeetCute | null;
  // הוספנו כאן את הפרמטר האופציונלי exactExpiresAt
  setAvailable: (duration: AvailabilityDuration, meetCute: MeetCute, exactExpiresAt?: Date) => void;
  setUnavailable: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  isAvailable: false,
  duration: null,
  expiresAt: null,
  meetCute: null,
  // מעדכנים את הפונקציה לקבל את התאריך המדויק
  setAvailable: (duration, meetCute, exactExpiresAt) => {
    // אם התקבל תאריך מדויק (כמו בריענון עמוד), נשתמש בו. אחרת, נחשב רגיל מהרגע הנוכחי
    const expiresAt = exactExpiresAt ? exactExpiresAt : new Date(Date.now() + duration * 60 * 1000);
    set({ isAvailable: true, duration, expiresAt, meetCute });
  },
  setUnavailable: () =>
    set({ isAvailable: false, duration: null, expiresAt: null, meetCute: null }),
}));

interface AppState {
  currentUser: Profile | null;
  setCurrentUser: (profile: Profile | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (profile) => set({ currentUser: profile }),
}));

interface MatchNotification {
  matchId: string;
  otherName: string;
  otherPhoto: string | null;
}

interface LikeNotificationData {
  likeId: string;
  fromUserId: string;
  fromName: string;
  fromPhoto: string | null;
  fromAge: number;
  fromFieldOfStudy: string;
}

interface MatchStore {
  pendingMatch: MatchNotification | null;
  setPendingMatch: (match: MatchNotification | null) => void;
  clearPendingMatch: () => void;
  pendingLike: LikeNotificationData | null;
  setPendingLike: (like: LikeNotificationData | null) => void;
  clearPendingLike: () => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  pendingMatch: null,
  setPendingMatch: (match) => set({ pendingMatch: match }),
  clearPendingMatch: () => set({ pendingMatch: null }),
  pendingLike: null,
  setPendingLike: (like) => set({ pendingLike: like }),
  clearPendingLike: () => set({ pendingLike: null }),
}));