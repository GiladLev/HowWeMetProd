'use client';

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CinderellaLike {
  id: number;
  name: string;
  age: number;
  timeAgo: string;
  icebreaker: string;
  avatar: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  sentAt: number;
  isIcebreaker?: boolean;
}

export interface ActiveChat {
  like: CinderellaLike;
  messages: ChatMessage[];
  /** Absolute timestamp when the chat expires (midnight) */
  expiresAt: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const INITIAL_LIKES: CinderellaLike[] = [
  {
    id: 1,
    name: 'נועה',
    age: 26,
    timeAgo: 'לפני 31 דקות',
    icebreaker: 'פיצה עם מלא אננס, תשפטו אותי 🍕',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    isOnline: true,
  },
  {
    id: 2,
    name: 'מאיה',
    age: 24,
    timeAgo: 'לפני 2 שעות',
    icebreaker: 'מה הדבר שאסור לי בשום אופן להתחיל לדבר עליו איתך? 🚫',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face',
    isOnline: true,
  },
  {
    id: 3,
    name: 'עידו',
    age: 29,
    timeAgo: 'לפני 4 שעות',
    icebreaker: 'אם היית חייב לאכול רק דבר אחד שנה שלמה, מה היה?',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
    isOnline: false,
  },
];

export const SESSION_DURATION_SECONDS = 45 * 60; // 45 minutes

// ─── Store ────────────────────────────────────────────────────────────────────

interface CinderellaStore {
  likes: CinderellaLike[];
  chat: ActiveChat | null;

  /** Match with a like → open chat with icebreaker as first message */
  match: (like: CinderellaLike) => void;
  /** Dismiss a like without matching */
  reject: (id: number) => void;
  /** Send a message in active chat */
  sendMessage: (text: string) => void;
  /** Permanently end / expire the chat */
  endChat: () => void;
}

export const useCinderellaStore = create<CinderellaStore>((set, get) => ({
  likes: INITIAL_LIKES,
  chat: null,

  match: (like) => {
    const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
    const openingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: like.icebreaker,
      sender: 'them',
      sentAt: Date.now(),
      isIcebreaker: true,
    };
    set({
      chat: { like, messages: [openingMsg], expiresAt },
      likes: get().likes.filter((l) => l.id !== like.id),
    });
  },

  reject: (id) => {
    set({ likes: get().likes.filter((l) => l.id !== id) });
  },

  sendMessage: (text) => {
    const chat = get().chat;
    if (!chat || !text.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      sender: 'me',
      sentAt: Date.now(),
    };
    set({ chat: { ...chat, messages: [...chat.messages, msg] } });
  },

  endChat: () => set({ chat: null }),
}));
