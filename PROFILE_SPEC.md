# מסמך אפיון - עמוד התדמית (Profile Page)

## 1. סקירה כללית

עמוד התדמית הוא המרכז של חווית המשתמש בה הוא יכול לצפות ולערוך את פרטיו האישיים. העמוד מציג את המידע המלא שמופיע לאנשים אחרים וממנו ניתן לנהל הגדרות, העדפות וחשבון.

**נתיב:** `/profile`  
**דור:** Client Component (עם קריאות API)  
**שפה:** עברית (RTL)

---

## 2. מטרות העמוד

- ✅ הצגה ברורה של פרטי הפרופיל המלא
- ✅ יכולת עריכה מהירה של כל שדה בלי עזיבת הדף
- ✅ ניהול תמונות (הצגה, הסרה, הוספה)
- ✅ גישה מהירה להגדרות עלומות (מחיקת חשבון, בלוקים)
- ✅ פידבק חזותי לעריכות (טוקן, שגיאה, הצלחה)
- ✅ הגנה על ערכים לא תקינים לפני שליחה

---

## 3. מבנה העמוד

### 3.1 Header (קבוע)

- **רוחב:** מלא מסך  
- **גובה:** 56px (בקירוב)  
- **רקע:** bg-white + border-b border-gray-100  
- **תוכן:**
  - **כפתור חזרה** (ChevronRight icon, צד ימין)  
    - טקסט: "הגדרות" (ניווט ל/settings בעתיד אפשרי)
  - **טקסט:** "פרופיל אישי" (מרכז, font-bold text-gray-900)
  - **מקום ריק** (צד שמאל, לשיווי משקל)

---

### 3.2 Content Area (Scrollable)

תוכן מחולק לקטעים בשורה בודדה, כל קטע עם כותרת אפורה קטנה.

#### A. תמונות (Photo Gallery)

**שדה:** `photo_urls` (מערך של URLs)

**תצוגה:**
- Horizontal scrollable gallery עם 5 משבצות רחבות
- כל משבצת: 120px × 120px (עם rounded-2xl)
- משבצת ריקה בסוף עם "+ הוסף תמונה" (אם פחות מ-5)

**Interactions:**
- **לחיצה על תמונה:** פתיחת modal להצגה בגודל מלא
  - במודל: כפתור X לסגירה, כפתור Trash לעריכה (בחלק התחתון)
- **לחיצה על + הוסף:** פתיחת מצלמה או בחירת מהלייבררי
- **בחירת תמונה:**
  - דחיסה (canvas, max 1200px, JPEG quality 0.82)
  - טעינה ל-Supabase Storage
  - הוספה לסוף המערך
- **הסרת תמונה:**
  - כפתור Trash בתוך modal
  - הסרה מהמערך ומ-Storage

**עיצוב:**
- Rounded-2xl, bg-gray-100 פנימה
- אם אין תמונה: emoji 📸 בגודל גדול
- אם יש תמונה: Image component עם object-cover
- Loading state: spinner בעת טעינה

**Accessibility:**
- alt text: "תמונה של [שם המשתמש]"

---

#### B. פרטים בסיסיים (Basic Info)

**שדות:**
- `first_name` (string, required)
- `age` (number, computed from birth_date in onboarding)
- `field_of_study` (string)
- `university` (string)

**עיצוב - כל שדה:**
- בטור בודד עם 2 שדות בשורה (בעיצומים בינוניים)
- כל שדה:
  - **Label:** קטן, אפור (text-gray-500 text-xs)
  - **ערך:** שחור, גדול יותר (text-gray-900 text-base)
  - **State - normal:** 
    - לחיצה לעריכה, שינוי background ל-bg-gray-50
    - icon "עט" (Edit) מימין
  - **State - editing:**
    - input field עם border-pink-400
    - כפתור "שמור" (bg-pink-500)
    - כפתור "ביטול" (bg-gray-100)
  - **State - saving:** opacity-50, disabled

**ולידציה:**
- `first_name`: minimum 2 characters, maximum 50
- `age`: 18-35 (מוגבל כבר בהרשמה)
- `field_of_study` ו-`university`: לא חובה, מוגבלים ל-100 תווים

---

#### C. מיקום והעדפות (Location & Preferences)

**שדות:**
- `location` (dropdown, 29 ערים ישראליות)
- `gender` (radio: זכר/נקבה/אחר)
- `gender_preference` (radio: גברים/נשים/שניהם)
- `sexuality` (dropdown: 8 אפשרויות)

**עיצוב:**
- כל שדה בעיצומים בודדים או בשורות של 2
- dropdowns: bg-white border-gray-200 rounded-2xl
- radio buttons: custom styled (צבע pink-500 כאשר selected)
- כמו פרטים בסיסיים - normal/editing/saving states

**ולידציה:**
- כל השדות מולאים בעיצומים בצורה נכונה

---

#### D. About / Bio

**שדה:** `bio` (string, nullable, max 500 characters)

**עיצוג:**
- textarea בעיצום מלא
- character counter בתחתית (בצבע אפור)
- placeholder: "ספר קצת על עצמך..."
- rounded-2xl border-gray-200
- כאשר ממוקד: border-pink-400

**עריכה:**
- inline ערוך בדומה לשאר השדות
- כפתור שמור/ביטול בתחתית

---

#### E. Availability Status

**שדה:** `is_available` (boolean)

**תצוגה:**
- סטטוס כיום: "באוויר" / "לא זמין"
- אם זמין: הצג "זמין עד [שעה]"
- כפתור: "ערוך זמינות" → navigate ל/available

---

#### F. פעולות מהדף

**סעיף תחתי עם כפתורים:**

1. **ערוך העדפות שינויי** → navigate ל/profile/preferences (עתיד)
2. **בלוקים וחסימות** → navigate ל/settings/blocked-users (עתיד)
3. **מחיקת חשבון** → navigate ל/settings/delete-account

**עיצוב כפתורים:**
- full-width, stacked
- primary (pink) = "מחיקת חשבון"
- secondary (gray) = שאר

---

## 4. מצבי טעינה וטעויות

### Loading State
- Spinner בעת הטעינה הראשונית
- Skeleton screens לכל קטע (ניתן להוסיף בעתיד)

### Error State
- Toast / Snackbar בראש העמוד
- טקסט אדום קטן תחת כל שדה שהשתבש
- Retry button אם אפשר

### Success State
- Toast קצר עם ✓ וטקסט "השתנויות נשמרו"
- עלעלה לפי 2 שניות

---

## 5. Data Flow

### Fetch Profile
```
GET /api/user/profile
→ Supabase .auth.getUser()
→ SELECT * FROM profiles WHERE id = user.id
```

### Save Field
```
POST /api/user/profile
Body: { field_name: value }
→ Supabase .update().eq('id', user.id)
→ Return updated profile
```

### Upload Photo
```
POST /api/user/photos
Body: FormData { file }
→ Compress image (Canvas)
→ Upload to Supabase Storage
→ Update photo_urls array
→ Return updated array
```

### Delete Photo
```
DELETE /api/user/photos/:photo_index
→ Remove from Storage
→ Update photo_urls array
```

---

## 6. עיצוב (Design System Compliance)

### Colors
- **Primary:** bg-pink-500 (כפתורים שמור)
- **Light bg:** bg-pink-50 (focus states)
- **Page bg:** bg-white
- **Borders:** border-gray-100 (עיקרי), border-pink-400 (focused input)
- **Text:** text-gray-900 (headings), text-gray-400 (labels)

### Typography
- **Headers:** text-2xl font-bold
- **Labels:** text-xs font-semibold text-gray-500
- **Values:** text-base text-gray-900

### Spacing
- **Horizontal padding:** px-5
- **Vertical gap:** gap-6 בין קטעים
- **Card padding:** px-4 py-3

### Animations
- **Spring transitions:** type: 'spring', stiffness: 320, damping: 30
- **Button tap:** whileTap={{ scale: 0.97 }}
- **Transitions in/out:** initial={{ opacity: 0 }} animate={{ opacity: 1 }}

### Border Radius
- **Cards:** rounded-2xl
- **Buttons:** rounded-2xl
- **Inputs:** rounded-2xl

### Shadows
- **Card shadow:** shadow-sm (border-gray-100)
- **Button shadow:** shadow-lg shadow-pink-200 (primary only)

---

## 7. דרישות טכניות

### State Management
- Zustand (profile store, עתיד)
- או useState עם API calls ישירות

### Form Validation
- Client-side validation לפני submit
- Error messages מה-API בעברית
- Input sanitization

### Accessibility
- ARIA labels לכל input
- Focus management
- Alt text לתמונות
- Keyboard navigation (tab, enter, escape)

### Performance
- Image lazy loading
- Memoization של components
- Debounce on field changes (300ms)

### Security
- Verify user auth before showing profile
- RLS policies בSupabase (בדוק שהמשתמש יכול להעדכן רק את שלו)
- No sensitive data in localStorage

---

## 8. User Flows

### Flow 1: Edit Name
1. User לוחץ על שם
2. Input field מופיע עם ערך הנוכחי
3. User כותב שם חדש
4. לחיצה על "שמור"
5. API call עם debounce
6. Success toast
7. שדה חוזר להצגה רגילה

### Flow 2: Upload Photo
1. User לוחץ "+ הוסף תמונה"
2. File picker נפתח
3. User בוחר תמונה
4. תמונה מודחסת (canvas)
5. Upload to Storage
6. Gallery מתעדכנת
7. Success toast

### Flow 3: Delete Account
1. User לוחץ "מחיקת חשבון"
2. Navigate ל/settings/delete-account
3. (ראה delete-account spec)

---

## 9. Edge Cases

- **אין תמונות:** הצג emoji בכל המשבצות
- **תמונה גדולה:** דחוס בעזרת Canvas
- **שדה ריק:** הצג placeholder בעריכה
- **Network error:** הצג Retry button
- **User logs out during edit:** Redirect ל/login
- **Stale data:** Refresh button בקטע הנתונים

---

## 10. Timeline & Priority

| Priority | Feature | Notes |
|----------|---------|-------|
| 🔴 HIGH | Display profile data | חשוב להצגה ראשונית |
| 🔴 HIGH | Edit basic info | שדות חובה |
| 🟡 MEDIUM | Edit photos | תכונה משמעותית |
| 🟡 MEDIUM | Edit location/preferences | אפיון נוכחי |
| 🟢 LOW | Edit bio | Nice-to-have |
| 🟢 LOW | Blocked users page | עתיד |
| 🟢 LOW | Preferences page | עתיד |

---

## 11. Testing Checklist

- [ ] Load profile data בחיבור לSupabase
- [ ] Edit כל שדה בודד והצל שינוי בDB
- [ ] Upload תמונה, דחוס, טען
- [ ] Delete תמונה מ-gallery ומ-Storage
- [ ] Network error handling
- [ ] Validation messages בעברית
- [ ] RTL layout נכון (inputs, icons, text)
- [ ] Mobile responsive (320px - 480px)
- [ ] Accessibility: Tab navigation, Screen reader
- [ ] Performance: צילום תמונה גדולה לא תקפא את ממשק

---

## 12. Future Enhancements

- [ ] Preferences customization page
- [ ] Blocked users management
- [ ] Profile stats (likes received, matches, etc.)
- [ ] Photo filters / editor
- [ ] Bio prompts (inspired by Hinge)
- [ ] Profile preview as others see it
- [ ] Activity log / history
