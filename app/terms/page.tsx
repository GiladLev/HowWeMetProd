'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-white" dir="rtl">
      <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center gap-3 px-5 py-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ChevronRight size={22} />
        </button>
        <h1 className="font-bold text-gray-900">תנאי שימוש</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 text-sm text-gray-700 leading-relaxed max-w-xl mx-auto w-full">

        <section>
          <h2 className="font-bold text-gray-900 mb-2">ברוכים הבאים ל-HowWeMet</h2>
          <p>
            HowWeMet היא פלטפורמה דייטינג המיועדת לסטודנטים בלבד. השימוש בשירות כפוף לתנאים הבאים.
            <strong>השימוש באפליקציה מהווה הסכמה מלאה לכל התנאים המפורטים כאן.</strong>
          </p>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h2 className="font-bold text-blue-900 mb-2">✅ דרישות זכאות</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-blue-800">
            <li><strong>גיל:</strong> חייב להיות 18 שנים ומעלה (הרשמה מתחתיהו אסורה בחוק)</li>
            <li><strong>אימייל אוניברסיטאי:</strong> הרשמה בלבד עם כתובת @.ac.il או @.edu.il</li>
            <li><strong>פרטים אמיתיים:</strong> הרשמה עם שם בדוי, תחזות, או פרטים שקריים = בן איסור מידי</li>
            <li><strong>חשבון אחד:</strong> לא מותר להפעיל יותר מחשבון אחד</li>
          </ul>
        </section>

        <section className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <h2 className="font-bold text-red-700 mb-2">🚫 אפס סובלנות לתוכן פוגעני</h2>
          <p className="text-red-600">
            HowWeMet אוכפת מדיניות של אפס סובלנות כלפי תוכן פוגעני, הטרדה מינית,
            גזענות, בריונות רשת, תוכן מיני מפורש, או כל התנהגות פוגעת אחרת.
            <br /><br />
            <strong>משתמשים שיפרו כללים אלה יוסרו מהפלטפורמה באופן מיידי וסופי</strong>,
            ללא החזר או אפשרות ערעור.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">תוכן משתמשים</h2>
          <p>
            אתה אחראי בלעדית לכל תוכן שאתה מפרסם. אין להעלות תמונות של אחרים ללא רשותם,
            תוכן מוגן בזכויות יוצרים, או כל חומר בלתי חוקי.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">הגבלת אחריות</h2>
          <p>
            HowWeMet מסופקת "כפי שהיא" (as-is). אנו אינינו אחראים לפגישות שנוצרו
            דרך הפלטפורמה. פגשו אנשים חדשים בבטחה ובשיפוט טוב.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">שינויים בתנאים</h2>
          <p>
            אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה. שימוש מתמשך באפליקציה לאחר עדכון
            מהווה הסכמה לתנאים החדשים.
          </p>
        </section>

        <p className="text-xs text-gray-400 text-center pb-4">עדכון אחרון: אפריל 2026</p>
      </div>
    </div>
  );
}
