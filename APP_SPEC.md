# מסמך אפיון - HowWeMet

## 1. סקירה כללית

**HowWeMet** היא אפליקציית דייטינג מודרנית המחברת אנשים בישראל דרך חוויה חברתית ומשמעותית. האפליקציה מעודדת משתמשים למצוא זוגות חדשים בהתאם להעדפותיהם האישיות, עם דגש על תקשורת אמיתית ושיתוף ערכים.

**URL:** `localhost:3000` (פיתוח)  
**פלטפורמה:** Web (Responsive, Mobile-First)  
**שפה:** עברית (RTL)  
**סטאק טכנולוגי:** Next.js 15, React, Tailwind CSS, Supabase, TypeScript  

---

## 2. מטרות האפליקציה

✅ **חיבור אמיתי:** מחברת אנשים שחולקים ערכים וטעם דומים  
✅ **חוויה ידידותית:** ממשק פשוט וזרימה טבעית של דייטינג  
✅ **בטיחות:** אימות משתמשים, חסימה של משתמשים בעייתיים  
✅ **תקשורת:** צ'ט חי בין משתמשים שתאמו  
✅ **ניהול פרופיל:** שליטה מלאה בנתונים ותדמיתך האישית  

---

## 3. יחודיות האפליקציה

### מה שמייחד את HowWeMet?

1. **ממשק אינטוליטיבי ומהיר**
   - עיצוב עברי native עם RTL
   - זרימה פשוטה: בחר → צפה → אהב/לא → צ'ט
   - ללא פרסומות או עירבול

2. **התאמה מהירה ומדויקת**
   - סנון לפי גובה, גיל, מיקום, העדפות מגדריות
   - התאמה אמיתית בהתבסס על העדפות משתמש
   - אי-חזרה על אותם אנשים

3. **מערכת לייק וחיבורים**
   - Like/Dislike זוג כדי ליצור התאמה
   - בפעם הראשונה שהשניים אוהבים זה את זה → צ'ט נפתח
   - הודעות זמינות רק לאחר התאמה הדדית

4. **ניהול זמינות דינאמי**
   - סטטוס "זמין עד [שעה]" כדי להודיע למי שעוד מעוניין
   - תאמה מעודכנת בזמן אמת

---

## 4. מבנה האפליקציה (Pages)

### 4.1 Onboarding Flow (הרשמה)

**מסלול:** `/onboarding`

תהליך הרשמה בשלבים:
1. **Step 1: Sign Up** - אימייל וסיסמה
2. **Step 2: Basic Info** - שם, גיל, מיקום
3. **Step 3: Photos** - הוסף עד 5 תמונות
4. **Step 4: Profile** - ביו, משכנע וקצר
5. **Step 5: Preferences** - בחר העדפות (גברים/נשים, גיל, עיר וכו')

**Output:** משתמש חדש עם פרופיל מלא

---

### 4.2 Home / Discover Page

**מסלול:** `/` או `/home`

**מטרה:** התאמת משתמשים חדשים

**תוכן:**
- **כרטיס משתמש (Swipe-able)**
  - תמונה גדולה (מורח מלא)
  - שם + גיל + עיר
  - ביו קצר (100 תווים)
  - Like button (❤️) / Dislike button (X)
  
- **זרימה:**
  - עלון כרטיס → הצג משתמש הבא
  - אם Like הדדי → צ'ט נפתח באופן אוטומטי

---

### 4.3 Likes Page

**מסלול:** `/likes`

**מטרה:** ראה מי אהב אותך

**תוכן:**
- רשימת משתמשים שאהבו את הפרופיל שלך
- אפשרות Like Back או Dislike
- כל Like → התאמה + פתיחת צ'ט

---

### 4.4 Matches Page

**מסלול:** `/matches`

**מטרה:** ניהול התאמות וצ'טים

**תוכן:**
- רשימה של כל ההתאמות שלך
- סדר לפי הודעה אחרונה
- לחיצה על התאמה → פתח צ'ט
- סדר עדיפויות בהתבסס על פעילות

---

### 4.5 Chat Page

**מסלול:** `/chat/[id]`

**מטרה:** שיחה עם מישהו שתאם

**תוכן:**
- חלון צ'ט זמן אמת
- שיתוף טקסט ותמונות
- אינדיקטור הקלדה
- אפשרות חסימה / דוח משתמש

---

### 4.6 Profile Page

**מסלול:** `/profile` (ראה `PROFILE_SPEC.md` לפרטים מלאים)

**מטרה:** עריכת נתונים אישיים

**תוכן:**
- צילום וניהול תמונות (עד 5)
- שדות בסיסיים: שם, גיל, עיר, בחירת כיוון
- עדכון ביו ותיאור עצמי
- סטטוס זמינות ("זמין עד [שעה]")
- כפתורים: בלוקים, העדפות, מחיקת חשבון

---

## 5. תזרים נתונים (Data Flow)

### זרימת עיקרית - דייטינג

```
1. משתמש נכנס ל-/home
2. API: GET /api/discover → משיכה משתמשים פתוחים (לא בבלוקים, לא בכולם שהוא אהב)
3. משתמש לוחץ Like ❤️ / Dislike ❌
4. API: POST /api/interactions (like/dislike)
5. בדוק: האם ההתאמה הדדית? (שניהם אהבו)
   - כן → צור match record, פתח צ'ט
   - לא → חזור לשלב 2
```

### זרימת צ'ט

```
1. משתמשים עם התאמה מוגדרת
2. API: WebSocket connection ל-Supabase Realtime
3. הודעה חדשה → עדכן immediately בfrontend
4. פרטיות: צ'ט מאוחסן בSupabase, נמחק בבקשת משתמש
```

### זרימת פרופיל

```
1. משתמש פותח /profile
2. API: GET /api/user/profile → קבל נתונים מ-Supabase
3. משתמש עורך שדה
4. API: POST /api/user/profile (field_name: new_value)
5. Supabase RLS מאמת שזה משתמש authorized
6. חזור עם התוצאה המעדכנת
```

---

## 6. מאפיינים עיקריים

### A. Discover / Matching

- **Swipe-like card UI** - הצג משתמש בכל פעם
- **Infinite scroll** - ככל שמקבל דיסליק, קבל משתמשים חדשים
- **Like/Dislike tracking** - שמור כל אינטראקציה
- **Mutual match detection** - שיתוף איתור מיידי

### B. Chat & Messaging

- **Real-time messaging** - Supabase Realtime
- **Typing indicator** - "משתמש מקליד..."
- **Message status** - נשלח / נקרא
- **Block user** - חסום משתמש כדי להסתיר הודעות

### C. Profile Management

- **Photo gallery** - עד 5 תמונות, דחוס תמונות גדולות
- **Dynamic availability** - הגדר "זמין עד [זמן]" כדי להחזיר למצב זמין
- **Edit inline** - ערוך שדות ישירות מ/profile
- **Delete account** - מחק חשבון לחלוטין + נתונים

### D. Preferences & Filtering

- **Gender/Location/Age filtering** - חפש משתמשים שמתאימים
- **Availability status** - בדוק אם משתמש בחיפוש
- **Block/Report system** - חסום אנשים בעייתיים

---

## 7. ממשק המשתמש - Flow

### Flow 1: חדש משתמש

1. בחר `Sign Up` ב-/onboarding
2. מלא דוא"ל + סיסמה
3. מלא שדות בסיסיים
4. הוסף תמונות
5. כתוב ביו קצר
6. בחר העדפות (גברים/נשים, גיל, מיקום)
7. סיום → עבור ל/home לדייטינג

### Flow 2: דייטינג

1. פתח `/home`
2. צפה בכרטיס משתמש (שם, תמונה, גיל, ביו)
3. לחץ ❤️ אם אתה אוהב / ❌ אם לא
4. אם Like הדדי → צ'ט נפתח
5. צא לצ'ט, או חזור ל/home לדייטינג נוסף

### Flow 3: צ'ט ותקשורת

1. פתח `/matches`
2. לחץ על בן/בת זוג
3. צפה בהיסטוריית צ'ט
4. קלד הודעה, שלח
5. ראה סטטוס "נשלח", "נקרא" בהודעה
6. אם משהו לא בסדר → Block / Report

### Flow 4: ניהול פרופיל

1. לחץ על איקון Profile
2. צפה בפרופיל שלך
3. ערוך שדה (לחץ על השדה)
4. אשר שינוי, לחץ Save
5. אם בחירת תמונה חדשה → דחוס וטען
6. אם רוצה למחוק חשבון → בחר "Delete Account"

---

## 8. Design System

### צבעים

- **Primary (Pink):** `#EC4899` - כפתורים עיקריים, highlights
- **Secondary (Gray):** `#6B7280` - טקסט משני, borders
- **Background:** `#FFFFFF` - רקע בסיס
- **Success:** `#10B981` - סימנים לחיוביות
- **Danger:** `#EF4444` - delete, danger actions
- **Light backgrounds:** `#F9FAFB`, `#F3F4F6` - חלוקות וקטעים

### Typography

- **Headers:** `font-bold text-2xl` - כותרות עמודים
- **Subheaders:** `font-semibold text-lg` - כותרות סעיפים
- **Body:** `text-base text-gray-900` - טקסט רגיל
- **Labels:** `text-xs text-gray-500 font-semibold` - תווית שדות
- **Caption:** `text-xs text-gray-400` - טקסט קטן עוזר

### Spacing

- **Page padding:** `px-5 py-6`
- **Card padding:** `px-4 py-3`
- **Gap between sections:** `gap-6`
- **Gap within items:** `gap-3`

### Animations

- **Spring transitions:** `{ type: 'spring', stiffness: 320, damping: 30 }`
- **Button press:** `whileTap={{ scale: 0.97 }}`
- **Modal entrance:** `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`
- **Slide animations:** `initial={{ x: 50 }} animate={{ x: 0 }}`

### Border Radius

- **Cards & buttons:** `rounded-2xl`
- **Inputs & modals:** `rounded-2xl`
- **Avatar/images:** `rounded-2xl`

---

## 9. נתונים + Database

### Supabase Tables

#### `profiles`
```
id (UUID, PK)
user_id (UUID, FK → auth.users)
first_name (string)
bio (text, nullable)
age (integer)
gender (enum: male, female, other)
gender_preference (enum: men, women, both)
sexuality (enum: straight, gay, lesbian, bi, ace, etc.)
university (string, nullable)
field_of_study (string, nullable)
location (string, enum: 29 ערים ישראליות)
photo_urls (array)
is_available (boolean)
available_until (timestamp, nullable)
created_at (timestamp)
updated_at (timestamp)
```

#### `interactions`
```
id (UUID, PK)
user_id (UUID, FK)
target_user_id (UUID, FK)
interaction_type (enum: like, dislike)
created_at (timestamp)
```

#### `matches`
```
id (UUID, PK)
user_id_1 (UUID, FK)
user_id_2 (UUID, FK)
created_at (timestamp)
last_message_at (timestamp)
```

#### `messages`
```
id (UUID, PK)
match_id (UUID, FK)
sender_id (UUID, FK)
content (text)
is_read (boolean)
created_at (timestamp)
```

#### `blocks`
```
id (UUID, PK)
user_id (UUID, FK)
blocked_user_id (UUID, FK)
reason (text, nullable)
created_at (timestamp)
```

### RLS (Row Level Security)

- משתמש יכול לראות רק פרופיל אחרים, לא שלו לחלוטין
- משתמש יכול לערוך רק את הפרופיל שלו
- משתמש יכול לראות צ'טים שלו בלבד
- בלוקים הם דו-כיווניים (אם A חוסם את B, B לא רואה את A)

---

## 10. API Endpoints

### Authentication
```
POST /api/auth/signup - הרשמה
POST /api/auth/login - התחברות
POST /api/auth/logout - התנתקות
POST /api/auth/refresh - רענן token
```

### Profile
```
GET /api/user/profile - קבל פרופיל שלי
POST /api/user/profile - עדכן פרופיל
GET /api/user/profile/[id] - קבל פרופיל אחר
```

### Discover & Interactions
```
GET /api/discover - משיכה משתמשים לדייטינג
POST /api/interactions - שלח like/dislike
```

### Matches & Messages
```
GET /api/matches - קבל כל ההתאמות שלי
GET /api/chat/[matchId] - היסטוריית צ'ט
POST /api/chat/[matchId] - שלח הודעה
WS /api/chat/realtime - WebSocket לצ'טים בזמן אמת
```

### Users Management
```
DELETE /api/user/profile - מחק חשבון
POST /api/user/block - חסום משתמש
```

---

## 11. Security & Privacy

✅ **Authentication:** Supabase Auth עם email + password  
✅ **Authorization:** RLS policies בSupabase  
✅ **Data Encryption:** HTTPS כל-השדות  
✅ **Photo Storage:** Supabase Storage עם signed URLs  
✅ **Message Privacy:** צ'טים מאוחסנים בDB, נמחקים בבקשה  
✅ **Block System:** חסימה הדדית, אין חצופה  
✅ **No 3rd parties:** כל הנתונים בSupabase בלבד  

---

## 12. תוכנית פיתוח (Timeline)

| שלב | מה | עדיפות |
|-----|-----|--------|
| 1 | Onboarding + Profile edit | 🔴 HIGH |
| 2 | Discover page + Like system | 🔴 HIGH |
| 3 | Matches list + Chat | 🔴 HIGH |
| 4 | Block/Report system | 🟡 MEDIUM |
| 5 | Real-time typing indicator | 🟡 MEDIUM |
| 6 | Availability status | 🟡 MEDIUM |
| 7 | Notifications | 🟢 LOW |
| 8 | Profile analytics | 🟢 LOW |

---

## 13. Testing Checklist

- [ ] Sign up עם דוא"ל תקין
- [ ] Login עם סיסמה תקינה
- [ ] Discover הצגת משתמשים לא-חוסמים
- [ ] Like/Dislike tracking
- [ ] Mutual match creates chat
- [ ] Chat message send/receive
- [ ] Block user removes from discover
- [ ] Profile edit saves to DB
- [ ] Photo upload דחוס בנכון
- [ ] Mobile responsive (320-480px)
- [ ] RTL layout עברית
- [ ] Accessibility (ARIA, Tab nav)

---

## 14. Success Metrics

📊 **בשביל להודע שהאפליקציה מצליחה:**

- משתמשים חדשים מסיימים onboarding
- משתמשים חוזרים לדייטינג כל יום
- Like rate גדול מ-50%
- Match rate > 40%
- Conversation starter בתוך 1 שעה מהתאמה
- משתמשים נשארים בפלטפורמה יותר מ-2 שבועות

---

## 15. מה זה בעצם?

**בעד:**
- אפליקציית דייטינג מלאה עם צ'ט בזמן אמת
- UI עברי מלא, RTL
- התאמה חכמה בהתבסס על עדיפויות
- טוב לדייטינג ממשי, לא swipe בלבד

**לא:**
- Tinder/Bumble clone (בדרך שלנו)
- Social network (לא בחברים)
- Matchmaker AI (התאמה מונעת)
- Premium subscription (כל משהו בחינם)

---

