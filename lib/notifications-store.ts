'use client';

import { create } from 'zustand';

interface NotificationsState {
  messagesCount: number;
  incrementMessages: () => void;
  resetMessages: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  messagesCount: 0,
  incrementMessages: () => set((s) => ({ messagesCount: s.messagesCount + 1 })),
  resetMessages:     () => set({ messagesCount: 0 }),
}));
