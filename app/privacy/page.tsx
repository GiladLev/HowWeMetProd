'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-white" dir="rtl">
      <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center gap-3 px-5 py-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ChevronRight size={22} />
        </button>
        <h1 className="font-bold text-gray-900">מדיניות פרטיות</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto w-full">

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">1. איזה מידע אנו אוספים</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-gray-600">
            <li>📧 <strong>אימייל</strong> (לאימות חשבון)</li>
            <li>🔐 <strong>סיסמה</strong> (מוצפנת ב-bcrypt, לא נשמרת כטקסט רגיל)</li>
            <li>👤 <strong>מידע אישי:</strong> שם, גיל, מין, מיקום, אוניברסיטה, תחום לימוד, ביו</li>
            <li>📸 <strong>תמונות פרופיל</strong> (עד 6 תמונות)</li>
            <li>💬 <strong>הודעות צ'אט</strong> (בין משתמשים הנמצאים בהתאמה)</li>
            <li>❤️ <strong>פעילות:</strong> לייקים, התאמות, דחיות, בלוקים</li>
            <li>📱 <strong>מידע טכני:</strong> device ID, IP address, זמני שימוש</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">2. כיצד אנו משתמשים במידע</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-gray-600">
            <li>🔍 <strong>חיפוש התאמות:</strong> להצגת פרופילים רלוונטיים</li>
            <li>💬 <strong>תקשורת:</strong> לעיבוד הודעות בזמן אמת</li>
            <li>🛡️ <strong>בטיחות:</strong> להונעת הערות, סחיטה, תוכן בדוק</li>
            <li>📊 <strong>שיפורים:</strong> ניתוח שימוש כדי לשפר את האפליקציה</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">3. שיתוף מידע</h2>
          <p className="mb-3">
            🔓 <strong>גלוי לכל משתמש:</strong> פרופיל (שם, גיל, תמונות, ביו, אוניברסיטה)
          </p>
          <p className="mb-3">
            🔒 <strong>פרטי:</strong> אימייל, סיסמה, הודעות (רק בין התאמות), העדפות
          </p>
          <p>
            ❌ <strong>לא מוכרים לאף אחד:</strong> אנו לא מוכרים את המידע שלך לצדדים שלישיים, לא ל-Facebook, Google, או חברות פרסום
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">4. אבטחת מידע</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-gray-600">
            <li>🔐 הנתונים מוצפנים ב-Supabase (PostgreSQL + encryption at rest)</li>
            <li>🔒 סיסמאות לא נשמרות; משתמשים בbcrypt + salt</li>
            <li>🚨 HTTPS בלבד (לא HTTP)</li>
            <li>🛡️ Row-Level Security: כל משתמש רואה רק את הנתונים שלו</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">5. זכויותיך (GDPR)</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-gray-600">
            <li>📥 <strong>ייצוא נתונים:</strong> בקש עותק של כל המידע שלך (תוך 30 יום)</li>
            <li>🗑️ <strong>מחיקה:</strong> מחק את חשבונך לחלוטין — כל הנתונים יוסרו תוך 30 ימים</li>
            <li>✏️ <strong>עריכה:</strong> עדכן את הפרופיל שלך בכל עת</li>
            <li>🔕 <strong>Opt-out הודעות:</strong> בטל כל הודעות (push, SMS, email) בהגדרות</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">6. כמה זמן אנו שומרים את הנתונים</h2>
          <ul className="list-disc list-inside flex flex-col gap-2 text-gray-600">
            <li>📱 <strong>חשבון פעיל:</strong> כל הנתונים נשמרים כל עוד החשבון פעיל</li>
            <li>🗑️ <strong>אחרי מחיקה:</strong> נשמר למשך 30 יום (אפשרות לבטל), אחר כך מחוזק לצמיתות</li>
            <li>💬 <strong>הודעות:</strong> נשמרות כל עוד שני הצדדים לא מחקו את ה-match</li>
            <li>📷 <strong>תמונות:</strong> אם מחזקת את החשבון, התמונות נמחקות מהשרתים</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg text-gray-900 mb-3">7. צור קשר</h2>
          <p className="mb-2">
            📧 לשאלות בנוגע לפרטיות שלך, שלח אימייל ל-<strong>support@howwemet.app</strong>
          </p>
          <p>
            אנחנו משיבים תוך 5 ימי עבודה.
          </p>
        </section>

        <section className="pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
          <p className="text-xs text-gray-400 text-center mt-1">GDPR Compliant ✓</p>
        </section>

      </div>
    </div>
  );
}
