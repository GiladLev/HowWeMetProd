'use client';

import { create } from 'zustand';

// ─── Date Recipe (built in the Mad Libs flow) ─────────────────────────────────

export interface DateRecipe {
  duration: 30 | 60 | 180;       // minutes the user is available
  step1: string;                  // "excuse for meeting"
  step2: string;                  // "vibe of the meeting"
  step3: string;                  // free-text demand / trigger
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export interface AppLike {
  id: number;
  name: string;
  age: number;
  timeAgo: string;
  /** Their Step 3 demand / "trigger" — the teaser shown on the card */
  trigger: string;
  step1: string;
  step2: string;
  avatar: string;
  isOnline: boolean;
  /** How many minutes they have left in their own session */
  sessionMinutesLeft: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  sentAt: number;
  isRecipe?: boolean;   // the combined "Date Recipe" opening message
}

export interface ActiveChat {
  like: AppLike;
  messages: ChatMessage[];
  /** Absolute ms timestamp — Math.min(myExpiresAt, theirExpiresAt) */
  expiresAt: number;
}

// ─── Mock likes ───────────────────────────────────────────────────────────────

export const INITIAL_LIKES: AppLike[] = [
  {
    id: 1, name: 'נועה', age: 26,
    timeAgo: 'לפני 31 דקות',
    trigger: 'הכלב שלך 🐶',
    step1: 'הפסקה מהחיים 🤯',
    step2: 'גלידה ברחוב 🍦',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    isOnline: true,
    sessionMinutesLeft: 25,
  },
  {
    id: 2, name: 'מאיה', age: 24,
    timeAgo: 'לפני 2 שעות',
    trigger: 'סיפור פדיחה 😂',
    step1: 'סתם סקרנות 😏',
    step2: 'שתייה על הבר 🍸',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face',
    isOnline: true,
    sessionMinutesLeft: 58,
  },
  {
    id: 3, name: 'יובל', age: 31,
    timeAgo: 'לפני 4 שעות',
    trigger: 'פלייליסט ביוטיוב 🎵',
    step1: 'נגמסנו 🍕',
    step2: 'שיחה עמוקה 🌳',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
    isOnline: false,
    sessionMinutesLeft: 170,
  },
];

// ─── Mad Libs options ─────────────────────────────────────────────────────────

export const STEP1_OPTIONS = [
  { value: 'הפסקה מהחיים 🤯', label: 'הפסקה מהחיים', emoji: '🤯' },
  { value: 'נגמסנו 🍕',       label: 'נגמסנו',       emoji: '🍕' },
  { value: 'סתם סקרנות 😏',   label: 'סתם סקרנות',   emoji: '😏' },
];

export const STEP2_OPTIONS = [
  { value: 'שיחה עמוקה 🌳',     label: 'שיחה עמוקה',    emoji: '🌳' },
  { value: 'שתייה על הבר 🍸',    label: 'שתייה על הבר', emoji: '🍸' },
  { value: 'גלידה ברחוב 🍦',     label: 'גלידה ברחוב',   emoji: '🍦' },
];

export const DURATION_OPTIONS: { value: 30 | 60 | 180; label: string; sub: string }[] = [
  { value: 30,  label: '30 דקות', sub: 'קצרצר'  },
  { value: 60,  label: 'שעה',     sub: 'נינוח'   },
  { value: 180, label: '3 שעות',  sub: 'יש זמן' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppStore {
  // ── Availability ──
  isAvailable: boolean;
  expiresAt: Date | null;
  dateRecipe: DateRecipe | null;

  activate: (recipe: DateRecipe) => void;
  deactivate: () => void;

  // ── Cinderella chat ──
  likes: AppLike[];
  chat: ActiveChat | null;

  match: (like: AppLike) => void;
  reject: (id: number) => void;
  sendMessage: (text: string) => void;
  endChat: () => void;
}

/** Builds the combined "Date Recipe" opening message */
function buildRecipeMessage(myRecipe: DateRecipe | null, like: AppLike): string {
  if (!myRecipe) {
    return `"${like.trigger}" — שאלת הקרח שלי 👋`;
  }
  return (
    `נפגשנו כי ${myRecipe.step1}, ` +
    `בווייב של ${myRecipe.step2}, ` +
    `ובתנאי שהבאת איתך ${like.trigger} 🥂\n` +
    `(ואני מביא/ה: ${myRecipe.step3})`
  );
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Availability ──
  isAvailable: false,
  expiresAt: null,
  dateRecipe: null,

  activate: (recipe) => {
    const expiresAt = new Date(Date.now() + recipe.duration * 60 * 1000);
    set({ isAvailable: true, expiresAt, dateRecipe: recipe });
  },

  deactivate: () =>
    set({ isAvailable: false, expiresAt: null, dateRecipe: null }),

  // ── Cinderella ──
  likes: INITIAL_LIKES,
  chat: null,

  match: (like) => {
    const { dateRecipe, expiresAt } = get();

    // CRITICAL: timer = Math.min(my time left, their time left)
    const myMsLeft = expiresAt
      ? Math.max(0, expiresAt.getTime() - Date.now())
      : 30 * 60 * 1000;
    const theirMsLeft = like.sessionMinutesLeft * 60 * 1000;
    const chatExpiresAt = Date.now() + Math.min(myMsLeft, theirMsLeft);

    const openingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: buildRecipeMessage(dateRecipe, like),
      sender: 'them',
      sentAt: Date.now(),
      isRecipe: true,
    };

    set({
      chat: { like, messages: [openingMsg], expiresAt: chatExpiresAt },
      likes: get().likes.filter((l) => l.id !== like.id),
    });
  },

  reject: (id) =>
    set({ likes: get().likes.filter((l) => l.id !== id) }),

  sendMessage: (text) => {
    const { chat } = get();
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
