export interface ChoiceStep {
  type: 'choice';
  title: string;
  options: string[];
  layout?: 'full' | 'split';
}

export interface TextStep {
  type: 'text';
  title: string;
}

export type FlowStep = ChoiceStep | TextStep;

export interface Track {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  color: string; // tailwind bg class for accent
  steps: [ChoiceStep, ChoiceStep, TextStep];
}

export const TRACKS: Track[] = [
  {
    id: 1,
    emoji: '🎯',
    title: 'הקלאסי והישיר',
    subtitle: 'יודע מה רוצה, יודע איך לבקש',
    color: 'pink',
    steps: [
      {
        type: 'choice',
        title: 'אם קופצים עכשיו למשהו, זה יהיה...',
        options: [
          'קפה של אמצע היום ☕',
          'דרינק של ערב 🍷',
          'סיבוב בחוץ באוויר הפתוח 🌳',
        ],
      },
      {
        type: 'choice',
        title: 'מה הסטייט אוף מיינד שלך לאחרונה?',
        options: [
          'מחפש/ת את הדבר האמיתי 🎯',
          'זורם/ת לראות מה יקרה 🌊',
          'רק בא לי חברה טובה להיום ✌️',
        ],
      },
      {
        type: 'text',
        title: 'מה הדבר שהכי בא לך לאכול או לשתות ממש ברגע זה? 🍕🍻',
      },
    ],
  },
  {
    id: 2,
    emoji: '🌊',
    title: 'הזורם והשובב',
    subtitle: 'ספונטני, מצחיק, חי את הרגע',
    color: 'violet',
    steps: [
      {
        type: 'choice',
        title: 'איך נראה הערב החופשי המושלם שלך?',
        options: [
          'ספה, פיצה ובינג׳ 🛋️',
          'יציאה ספונטנית לעיר 🪩',
          'בירה עם חברים קרובים 🍻',
        ],
      },
      {
        type: 'choice',
        title: 'מה עושה לך את זה בשיחה טובה?',
        options: [
          'דיבורים על החיים לתוך הלילה 🌙',
          'עקיצות וצחוקים 😂',
          'גם שתיקות נוחות זה סבבה 🤫',
        ],
      },
      {
        type: 'text',
        title: 'מה סדרת ה״גילטי פלז׳ר״ שאת/ה מתבייש/ת להודות שראית? 📺',
      },
    ],
  },
  {
    id: 3,
    emoji: '⚡',
    title: 'הממוקד',
    subtitle: 'ישיר, יעיל, יודע מה חשוב',
    color: 'amber',
    steps: [
      {
        type: 'choice',
        title: 'איך את/ה מקבל/ת החלטות?',
        layout: 'split',
        options: [
          'מתכנן מראש, שיהיה לו״ז 🗓️',
          'הכי ספונטני, מעכשיו לעכשיו 🎲',
        ],
      },
      {
        type: 'choice',
        title: 'מה מחמם לך את הלב?',
        options: [
          'מחוות קטנות ורומנטיות 🌹',
          'שעוזרים לי בדברים פרקטיים 💪',
          'פשוט שמקשיבים לי באמת 👂',
        ],
      },
      {
        type: 'text',
        title: 'אם יש לנו עכשיו שעה פנויה, על איזה נושא אסור לי בשום אופן להתחיל לדבר איתך? 🚫',
      },
    ],
  },
];

export const TRACK_THEME = {
  pink: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBg: 'bg-blue-600',
    selectedBorder: 'border-blue-600',
    selectedText: 'text-white',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    cta: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    trackCard: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    selectedBg: 'bg-violet-600',
    selectedBorder: 'border-violet-600',
    selectedText: 'text-white',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
    bar: 'bg-violet-500',
    cta: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    trackCard: 'border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-100',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    selectedBg: 'bg-amber-500',
    selectedBorder: 'border-amber-500',
    selectedText: 'text-white',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    cta: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    trackCard: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-100',
  },
} as const;
