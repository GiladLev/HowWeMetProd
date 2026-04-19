# Apple App Review Response — HowWeMet

Below is the response to send to Apple via App Store Connect → Reply to App Review. Copy the relevant sections.

---

## Guideline 2.1(a) — Bug: Tapping other users' icons displayed an error

**Root cause identified and fixed.**

The avatar images on the Matches list screen used Next.js `<Image fill>` inside a container that was missing the required CSS `position: relative`. On iPad, this caused the image component to throw a rendering error when tapped/displayed.

**Fix applied:** Added `position: relative` to the avatar container so the image renders correctly on all devices including iPad Air (M3).

Additionally, we removed leftover internal debug network calls (fetching `localhost`) that were present in 6 components. These calls silently failed on iOS but could have contributed to unexpected behavior on iPad.

---

## Guideline 2.1(a) — Crash: Attempting to take a photo

**Root cause identified and fixed.**

iPad cameras capture photos in HEIC format by default. Our image compression pipeline used the legacy `new Image()` + Canvas approach, which does not reliably decode HEIC files on iOS Safari.

**Fixes applied:**
1. Rewrote the image compressor to use `createImageBitmap()` (native HEIC decoding on iOS Safari 17+) with an automatic fallback to the Canvas pipeline for older browsers.
2. Changed the photo upload flow to compress the image **before** displaying a preview, avoiding loading the raw multi-megabyte camera file into the DOM (which could cause a WebView memory crash on iPad).

---

## Guideline 1.2 — User-Generated Content

All required UGC safety precautions are implemented:

### 1. EULA / Terms agreement before accessing UGC
Users must check a mandatory EULA checkbox during registration (email step) before they can proceed. The checkbox text reads (translated from Hebrew):

> "I have read and agree to the Terms of Use and Privacy Policy. HowWeMet does not tolerate objectionable content, harassment, or abuse — users who violate these rules will be removed immediately."

The button to continue is disabled until the user accepts.

**Location in app:** Registration → Email step (first screen of onboarding).

### 2. Zero-tolerance policy in Terms of Use
The Terms of Use page (`/terms`) includes a prominent red section titled "Zero Tolerance for Objectionable Content" stating:

> "HowWeMet enforces a zero-tolerance policy toward objectionable content, sexual harassment, racism, cyberbullying, explicit sexual content, or any other harmful behavior. Users who violate these rules will be removed from the platform immediately and permanently, with no refund or appeal."

### 3. Mechanism to flag objectionable content (Report)
Users can report objectionable content via the Report & Block sheet, accessible from any chat conversation (⋮ menu → "Report objectionable content").

The report flow includes:
- **6 categorized reasons:** Inappropriate content, Harassment/bullying, Spam/advertising, Fake profile, Underage user, Other
- **Free-text detail field** for additional context
- Reports are stored in the `reported_users` database table with timestamps

### 4. Mechanism to block abusive users
The same sheet includes a "Block user" option that:
- Immediately removes the blocked user from the reporter's feed
- Deletes all mutual likes and matches between the two users
- Prevents the blocked user from seeing the reporter's profile

### 5. Reporting also blocks + notifies developer
When a user files a report:
- The reported user is **automatically blocked** (content removed from the reporter's feed instantly)
- The report is recorded in our database for developer review
- We commit to reviewing and acting on all reports **within 24 hours**, removing objectionable content and ejecting offending users

---

## Guideline 5.1.1(v) — Account Deletion

Full account deletion is implemented and accessible:

**Path:** Profile tab → Edit tab → "Delete account permanently" (bottom of page) → `/settings/delete-account`

**Flow:**
1. Information screen listing all data that will be permanently deleted (profile, photos, chats, matches, email)
2. Confirmation screen with a mandatory checkbox: "I understand that deleting my account is irreversible and all my data will be permanently lost"
3. Final "Delete my account permanently" button

**Backend:** The deletion endpoint (`/api/delete-account`) performs a hard delete using a service role key:
- Deletes all messages, matches, likes, blocks, and reports associated with the user
- Deletes the user's profile
- Deletes the auth user from Supabase Auth
- This is a permanent, irreversible deletion — not a deactivation

---

## Guideline 4.3(b) — Design — Spam (Saturated Category)

HowWeMet is not a generic dating app. It has a unique "Meet Cute" concept specifically designed for Israeli university students:

1. **University-only access** — Registration requires a verified university email (.ac.il / .edu domain). This is not a general-purpose dating app.
2. **"Meet Cute" real-time availability** — Instead of endless swiping, users go "available" for a limited time window (up to 3 hours), selecting their preferred activity (coffee/drink/walk), mindset, and vibe. They only see other currently-available students.
3. **Icebreaker games before chat** — Matched users must play a series of interactive games together before chat unlocks. This replaces the typical "match → awkward first message" pattern with a shared experience.
4. **Hebrew RTL interface** — The entire app is built in Hebrew with right-to-left layout, designed specifically for the Israeli student market. There is no English-language equivalent serving this specific audience with this mechanic.

---

## Guideline 2.1(b) — Business Model Information

**Q: What paid content, subscriptions, or features are unlocked within the app that do not use In-App Purchase?**

A: HowWeMet is currently a **free app with no paid features**. There are no subscriptions, premium tiers, or unlockable content. All features are available to all users at no cost. If we introduce paid features in the future, we will use Apple's In-App Purchase system.

**Q: Does your app include any third-party AI? If yes, does the app share any user data with the AI?**

A: **No.** HowWeMet does not use any third-party AI services. All matching logic and game mechanics run on our own backend (Supabase/PostgreSQL). No user data is shared with AI providers.
