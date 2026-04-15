// Availability
export type AvailabilityDuration = 30 | 60 | 180; // minutes

// Profile basics
export type Gender           = 'male' | 'female' | 'other';
export type GenderPreference = 'male' | 'female' | 'both';
export type Sexuality        = 'straight' | 'gay' | 'lesbian' | 'bisexual' | 'pansexual' | 'asexual' | 'queer' | 'prefer_not';

// MeetCute core
export type DateActivity = 'coffee' | 'drink' | 'walk';
export type Mindset      = 'real' | 'flow' | 'friends';

// 🔥 במקום Touch
export type AvailabilityVibe = 'ready_now' | 'one_hour' | 'chat_first';

// Meet cute subtypes (for status page)
export type MeetCuteLocation = string;
export type MeetCuteOrder = string;
export type MeetCuteWhoStarted = string;

export interface MeetCute {
  activity: DateActivity;
  mindset:  Mindset;
  availabilityVibe: AvailabilityVibe;
}

// Availability status
export interface AvailabilityStatus {
  id: string;
  userId: string;
  isAvailable: boolean;
  durationMinutes: AvailabilityDuration | null;
  expiresAt: Date | null;
  meetCute: MeetCute | null;
  createdAt: Date;
}

// Profile
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  bio?: string;
  photos: string[];
  prompts: PromptAnswer[];
  gender?: string;
  location?: string;
  height?: string;
  isAvailable?: boolean;
  availabilityExpiresAt?: Date | null;
  meetCute?: MeetCute | null;
  flowAnswers?: FlowAnswers;
}

// Prompts
export interface PromptAnswer {
  id: string;
  prompt: string;
  answer: string;
}

// Flow answers
export interface FlowAnswers {
  icebreaker?: string;
  trackColor: string;
  trackId?: number;
  trackEmoji: string;
  trackName: string;
  step1Question: string;
  step1Answer: string;
  step2Question: string;
  step2Answer: string;
}

// Likes
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  profile: Profile;
  photoUrl?: string;
  answer?: string;
  createdAt: Date;
}

// Matches
export interface Match {
  id: string;
  userId: string;
  profile: Profile;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  meetCute?: MeetCute | null;
}

// Labels
export const MEET_CUTE_LABELS = {
  activity: {
    coffee: 'קפה של אמצע היום',
    drink:  'דרינק של ערב',
    walk:   'סיבוב בחוץ',
  },
  mindset: {
    real:    'מחפש/ת את הדבר האמיתי',
    flow:    'זורם/ת לראות מה יקרה',
    friends: 'רק בא לי להכיר מישהו',
  },
  availabilityVibe: {
    ready_now: 'יאללה, רק שמה נעליים',
    one_hour: 'תנו לי איזה שעה להתארגן',
    chat_first: 'מעדיף/ה להתכתב קצת קודם',
  },
  availabilityQuestion: 'תי תכל\'ס נוח לך שניפגש?\nבלי לחץ, רק תיאום ציפיות',
} as const;

// Emojis
export const MEET_CUTE_EMOJI = {
  activity: { coffee: '☕', drink: '🍷', walk: '🌳' },
  mindset:  { real: '🎯', flow: '🌊', friends: '✌️' },
  availabilityVibe: {
    ready_now: '👟',
    one_hour: '⏳',
    chat_first: '📱',
  },
} as const;

// ── Game System Types ──────────────────────────────────────────────────

export type GameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface GameData {
  status: 'pending' | 'playing' | 'choosing' | 'done';
  playerData: Record<string, Record<string, any>>;
  winnerId: string | null;
  chosenOption: string | null;
  startedAt: string | null;
}

export type LiveEventType = 'start' | 'progress' | 'finish';

export interface LiveEventMeta {
  event: LiveEventType;
  by: string;
  at: string;
  gameNumber: number;
}

export interface DatePlan {
  inviter: string | null;        // Game 1: מי הבוס
  dateTime: string | null;       // Game 2: יומן מבצעים
  payment: string | null;        // Game 3: חשבון בבקשה
  foodStyle: string | null;      // Game 4: פתיחת תיאבון
  dressCode: string | null;      // Game 5: קוד לבוש
  venueType: string | null;      // Game 6: וייב ומוזיקה
  transportation: string | null; // Game 7: איך מגיעים
  tabooTopic: string | null;     // Game 8: נושא אסור
  firstDrink: string | null;     // Game 9: הלחיים הראשון
  crazyRule: string | null;      // Game 10: החותמת הסופית
}

export interface GameState {
  currentGame: number;
  phase: 'lobby' | 'playing' | 'choosing' | 'completed';
  ready: Record<string, boolean>;
  games: Record<string, GameData>;
  datePlan: DatePlan;
  finalDecision: Record<string, 'date' | 'friends' | null>;
}

export interface GameProps {
  matchId: string;
  userId: string;
  otherUserId: string;
  gameNumber: number;
  gameData: GameData;
  onUpdate: (data: Partial<GameData>) => Promise<void>;
  onComplete: (winnerId: string, chosenOption: string) => void;
}

export const GAME_TITLES: Record<number, { title: string; emoji: string; description: string }> = {
  1:  { title: 'מי מזמין את מי?',   emoji: '✊', description: 'אבן נייר ומספרים — המנצח הוא המזמין הרשמי' },
  2:  { title: 'מתי יוצאים?',       emoji: '⚡', description: 'טריוויית בזק — המנצח קובע מתי נפגשים' },
  3:  { title: 'מי משלם?',          emoji: '💣', description: 'הפצצה המתקתקת — המנצח קובע מי משלם' },
  4:  { title: 'מנה ראשונה',        emoji: '🍽️', description: 'תמונה מטושטשת — המנצח בוחר סגנון אוכל' },
  5:  { title: '',                  emoji: '',   description: 'זה או זה — המנצח קובע דרס קוד' },
  6:  { title: 'וייב ולוקיישן',     emoji: '🎵', description: 'תו ראשון — המנצח בוחר סוג מקום' },
  7:  { title: 'איך מגיעים?',       emoji: '🖱️', description: 'מלחמת קליקים — המנצח קובע תחבורה' },
  8:  { title: 'נושא אסור',         emoji: '🤫', description: 'הטאבו שלי — המנצח בוחר נושא טאבו' },
  9:  { title: 'הלחיים הראשון',     emoji: '🎰', description: 'רולטת מזל — המנצח בוחר משקה ראשון' },
  10: { title: 'חותמת הניצחון',     emoji: '🎨', description: 'ציור עיוור — המנצח מוסיף חוק מוגזם' },
};

/** Options the winner chooses from after each game */
export const GAME_OPTIONS: Record<number, string[]> = {
  1:  ['אני מזמין/ה 🙋', 'את/ה מזמין/ה 😏'],
  2:  ['היום בערב 🌙', 'מחר בצהריים ☀️', 'סוף השבוע 🎉'],
  3:  ['עלי 🎩', 'עליך 😏', 'חצי-חצי 🤝'],
  4:  ['משהו מטוגן 🍟', 'משהו חריף 🌶️', 'משהו עם דגים 🐟', 'קינוח לפני הכל 🍰'],
  5:  ['אלגנט 👗', 'ספורטיבי 🏃', 'חובה פריט ג\'ינס 👖', 'הפתעה - מה שבא 🎲'],
  6:  ['בר רועש 🎶', 'מסעדה רומנטית 🕯️', 'הופעה 🎤', 'ישיבה בפארק 🌳'],
  7:  [
    'באים ברכב (בתקווה למצוא חניה לפני 2027) 🚗',
    'עולים על קו 9 (הזדמנות מצוינת להשלים פערים בטיקטוק) 🚌',
    'נפגשים ישירות בנקודה. בלי עיכובים, ישר לעיקר 📍',
  ],
  8:  ['בלי עבודה 💼', 'בלי אקסים 💔', 'בלי פוליטיקה 🏛️', 'בלי טלפונים 📵'],
  9:  ['יין 🍷', 'בירה 🍺', 'קוקטייל מוזר 🍹', 'מיץ תפוזים 🍊'],
  10: ['חובה לאכול גלידה בסוף 🍦', 'סלפי מצחיק חובה 🤳', 'המפסיד מספר פדיחה 😳', 'להחליף מנות באמצע 🔄'],
};

/** Create initial game state for a new match */
export function createInitialGameState(): GameState {
  const games: Record<string, GameData> = {};
  for (let i = 1; i <= 10; i++) {
    games[String(i)] = {
      status: 'pending',
      playerData: {},
      winnerId: null,
      chosenOption: null,
      startedAt: null,
    };
  }
  games['5'] = {
    ...games['5'],
    status: 'playing',
    startedAt: new Date().toISOString(),
  };
  return {
    currentGame: 5,
    phase: 'playing',
    ready: {},
    games,
    datePlan: {
      inviter: null,
      dateTime: null,
      payment: null,
      foodStyle: null,
      dressCode: null,
      venueType: null,
      transportation: null,
      tabooTopic: null,
      firstDrink: null,
      crazyRule: null,
    },
    finalDecision: {},
  };
}

/** Map game number to date plan key */
export const GAME_TO_PLAN_KEY: Record<number, keyof DatePlan> = {
  1: 'inviter',
  2: 'dateTime',
  3: 'payment',
  4: 'foodStyle',
  5: 'dressCode',
  6: 'venueType',
  7: 'transportation',
  8: 'tabooTopic',
  9: 'firstDrink',
  10: 'crazyRule',
};

export function getStablePlayerOrder(userA: string, userB: string): [string, string] {
  return userA <= userB ? [userA, userB] : [userB, userA];
}

export function pickDeterministicPlayer(
  userA: string,
  userB: string,
  seed: string,
): string {
  const [firstId, secondId] = getStablePlayerOrder(userA, userB);
  return Math.abs(hashCode(seed)) % 2 === 0 ? firstId : secondId;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// ── Like Notification ─────────────────────────────────────────────────

export interface LikeNotification {
  likeId: string;
  fromUserId: string;
  fromName: string;
  fromPhoto: string | null;
  fromAge: number;
  fromFieldOfStudy: string;
}