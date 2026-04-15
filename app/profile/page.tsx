'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Edit2, LogOut, ChevronLeft, ChevronDown, Eye, Trash2, ShieldCheck, Check, Loader2, Sparkles, User, Search, MapPin, GraduationCap, BookOpen } from 'lucide-react';
import { createClient } from '../../lib/supabase';
import { useProfile } from '../../lib/useProfile';
import { MEET_CUTE_LABELS, type MeetCute } from '../../types';
import type { ProfileRow } from '../../lib/useProfile';

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyPhotoCard({ onEdit }: { onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3"
    >
      <span className="text-5xl">📸</span>
      <p className="text-sm font-medium text-gray-400">הוסף תמונה</p>
    </button>
  );
}

// ─── View tab (how others see you) ───────────────────────────────────────────

function ProfileView({ profile, meetCute, onEdit }: {
  profile: ReturnType<typeof useProfile>['profile'];
  meetCute: MeetCute | null;
  onEdit: () => void;
}) {
  const photos = profile?.photo_urls?.filter(Boolean) ?? [];
  const genderLabel = profile?.gender === 'male' ? 'גבר' : profile?.gender === 'female' ? 'אישה' : profile?.gender === 'other' ? 'אחר' : null;
  const prefLabel =
    profile?.gender_preference === 'male' ? 'מחפש/ת גברים' :
    profile?.gender_preference === 'female' ? 'מחפש/ת נשים' :
    'מחפש/ת את שניהם';

  return (
    <div className="px-4 py-4 pb-8">
      <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col">
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="relative bg-gray-100 aspect-[3/4] shrink-0">
            {photos[0] ? (
              <Image src={photos[0]} alt={profile?.first_name ?? 'תמונה'} fill className="object-cover" sizes="440px" loading="eager" />
            ) : (
              <EmptyPhotoCard onEdit={onEdit} />
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h2 className="text-[30px] font-bold tracking-tight text-white drop-shadow-sm">
                {profile?.first_name || 'שם לא הוגדר'}{profile?.age ? `, ${profile.age}` : ''}
              </h2>
              {profile?.location && (
                <p className="text-sm text-white/90 flex items-center gap-1 mt-1 font-medium">
                  <MapPin size={13} />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
            {genderLabel && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-full border border-blue-100">
                <User size={12} />
                {genderLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
              <Search size={12} />
              {prefLabel}
            </span>
          </div>

          {profile?.bio && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-blue-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">עליי</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {profile.bio}
              </p>
            </div>
          )}

          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={14} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">מיקום</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-800 font-semibold">{profile?.location || 'לא הוגדר עדיין'}</p>
            </div>
          </div>

          {meetCute && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-blue-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Meet Cute</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 grid grid-cols-3 gap-2">
                <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                  <span className="text-xl block">☕</span>
                  <span className="text-[11px] text-blue-800 font-semibold leading-tight">{MEET_CUTE_LABELS.activity[meetCute.activity]}</span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                  <span className="text-xl block">🎯</span>
                  <span className="text-[11px] text-blue-800 font-semibold leading-tight">{MEET_CUTE_LABELS.mindset[meetCute.mindset]}</span>
                </div>
                <div className="bg-white rounded-xl p-2 border border-blue-100 text-center">
                  <span className="text-xl block">📱</span>
                  <span className="text-[11px] text-blue-800 font-semibold leading-tight">{MEET_CUTE_LABELS.availabilityVibe[meetCute.availabilityVibe]}</span>
                </div>
              </div>
            </div>
          )}

          {(profile?.field_of_study || profile?.university) && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap size={14} className="text-blue-500" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">לימודים</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-1">
                {profile?.field_of_study && (
                  <p className="text-sm text-gray-800 font-semibold flex items-center gap-1.5">
                    <BookOpen size={13} className="text-gray-400" />
                    {profile.field_of_study}
                  </p>
                )}
                {profile?.university && <p className="text-xs text-gray-500">{profile.university}</p>}
              </div>
            </div>
          )}

          {photos.slice(1).map((src, idx) => (
            <div key={idx} className="relative bg-gray-100 aspect-[3/4] shrink-0 mt-4 mx-5 rounded-2xl overflow-hidden">
              <Image src={src} alt={profile?.first_name ?? 'תמונה'} fill className="object-cover" sizes="440px" loading="lazy" />
            </div>
          ))}
          <div className="h-4 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Edit tab (settings & controls) ──────────────────────────────────────────

const GENDERS   = [{ v: 'male', l: 'גבר' }, { v: 'female', l: 'אישה' }, { v: 'other', l: 'אחר' }] as const;
const GENDERPREFS = [{ v: 'male', l: 'גברים' }, { v: 'female', l: 'נשים' }, { v: 'both', l: 'שניהם' }] as const;
const CITIES = [
  'תל אביב-יפו','ירושלים','חיפה','ראשון לציון','פתח תקווה','אשדוד','נתניה','באר שבע',
  'בני ברק','רמת גן','בת ים','רחובות','אשקלון','הרצליה','כפר סבא','חולון','רעננה',
  'מודיעין-מכבים-רעות','גבעתיים','רמת השרון','הוד השרון','לוד','רמלה','נהריה',
  'עכו','טבריה','נצרת','אילת','אחר',
];
const FIELDS_OF_STUDY = [
  'מדעי המחשב','הנדסת תוכנה','הנדסה','רפואה','משפטים','כלכלה וניהול',
  'פסיכולוגיה','תקשורת','חינוך','מדעי החברה','ביולוגיה','כימיה','אדריכלות','עיצוב','אחר',
];
const UNIVERSITIES = [
  'אוניברסיטת תל אביב','האוניברסיטה העברית בירושלים','הטכניון - מכון טכנולוגי לישראל',
  'אוניברסיטת בן גוריון בנגב','אוניברסיטת חיפה','אוניברסיטת בר אילן',
  'אוניברסיטת רייכמן (IDC הרצליה)','אוניברסיטת אריאל','המכללה האקדמית תל אביב יפו',
  'מכללה למינהל','אחר',
];

type FieldKey = 'age' | 'gender' | 'gender_preference' | 'location' | 'study' | 'bio' | 'card_style';

async function saveField(userId: string, patch: Partial<ProfileRow>) {
  const supabase = createClient();
  await supabase.from('profiles').update(patch).eq('id', userId);
}

function CompletenessBar({ pct }: { pct: number }) {
  if (pct >= 100) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">שלמות הפרופיל</span>
        <span className="text-sm font-bold text-blue-500">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {pct < 40 ? 'הוסף תמונות כדי להתחיל' : 'הוסף פרטים לפרופיל מלא יותר'}
      </p>
    </div>
  );
}

function ExpandRow({
  icon, label, value, isOpen, onToggle, children,
}: {
  icon: string; label: string; value: string; isOpen: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-right"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-base">{icon}</span>
          <div className="flex flex-col items-start">
            <span className="text-sm text-gray-700">{label}</span>
            {value && <span className="text-xs text-gray-400">{value}</span>}
          </div>
        </div>
        <ChevronDown size={14} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-4 pb-4 bg-gray-50/50">{children}</div>}
    </div>
  );
}

function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error:', err);
    } finally {
      // Hard reload to fully reset React + Supabase state
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="w-full py-3.5 rounded-2xl border border-red-100 bg-white text-red-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-60"
    >
      {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
      {loggingOut ? 'מתנתק...' : 'התנתק'}
    </button>
  );
}

function SaveBtn({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="mt-3 w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
      {saving ? 'שומר...' : 'שמור'}
    </button>
  );
}

function ProfileEdit({
  profile, completeness, userId, onNavigate, onRefresh,
}: {
  profile: ProfileRow | null;
  completeness: number;
  userId: string;
  onNavigate: (href: string) => void;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState<FieldKey | null>(null);
  const toggle = (f: FieldKey) => setOpen((o) => (o === f ? null : f));
  const [saving, setSaving] = useState(false);

  // Local draft state
  const [age,    setAge]    = useState(profile?.age ?? 20);
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [genderPref, setGenderPref] = useState(profile?.gender_preference ?? 'both');
  const [loc,    setLoc]    = useState(profile?.location ?? '');
  const [field,  setField]  = useState(profile?.field_of_study ?? '');
  const [uni,    setUni]    = useState(profile?.university ?? '');
  const [bio,    setBio]    = useState(profile?.bio ?? '');

  const save = async (patch: Partial<ProfileRow>) => {
    setSaving(true);
    await saveField(userId, patch);
    setSaving(false);
    setOpen(null);
    onRefresh();
  };

  const chipCls = (active: boolean) =>
    `px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
      active ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'
    }`;

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">
      <CompletenessBar pct={completeness} />

      {/* ── Preferences (inline edit) ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">העדפות</p>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

          {/* גיל */}
          <ExpandRow icon="🎂" label="גיל" value={profile?.age ? `${profile.age}` : ''} isOpen={open === 'age'} onToggle={() => toggle('age')}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-500">{age}</span>
                <span className="text-xs text-gray-400">18–35</span>
              </div>
              <input
                type="range" min={18} max={35} value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <SaveBtn saving={saving} onSave={() => save({ age })} />
            </div>
          </ExpandRow>

          {/* מגדר */}
          <ExpandRow icon="🪪" label="מגדר" value={GENDERS.find(g => g.v === profile?.gender)?.l ?? ''} isOpen={open === 'gender'} onToggle={() => toggle('gender')}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {GENDERS.map(g => (
                  <button key={g.v} onClick={() => setGender(g.v)} className={chipCls(gender === g.v)}>{g.l}</button>
                ))}
              </div>
              <SaveBtn saving={saving} onSave={() => save({ gender: gender as ProfileRow['gender'] })} />
            </div>
          </ExpandRow>

          {/* מחפש/ת */}
          <ExpandRow icon="🔍" label="מחפש/ת" value={GENDERPREFS.find(g => g.v === profile?.gender_preference)?.l ?? ''} isOpen={open === 'gender_preference'} onToggle={() => toggle('gender_preference')}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {GENDERPREFS.map(g => (
                  <button key={g.v} onClick={() => setGenderPref(g.v)} className={chipCls(genderPref === g.v)}>{g.l}</button>
                ))}
              </div>
              <SaveBtn saving={saving} onSave={() => save({ gender_preference: genderPref as ProfileRow['gender_preference'] })} />
            </div>
          </ExpandRow>


          {/* מיקום */}
          <ExpandRow icon="📍" label="מיקום" value={profile?.location ?? ''} isOpen={open === 'location'} onToggle={() => toggle('location')}>
            <div className="flex flex-col gap-3">
              <select
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:border-blue-400 outline-none"
              >
                <option value="">בחר עיר</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <SaveBtn saving={saving} onSave={() => save({ location: loc })} />
            </div>
          </ExpandRow>

          {/* תחום לימודים */}
          {(profile?.field_of_study || profile?.university) && (
            <ExpandRow icon="📚" label="תחום לימודים" value={profile?.field_of_study ? `${profile.field_of_study}${profile.university ? ` · ${profile.university}` : ''}` : ''} isOpen={open === 'study'} onToggle={() => toggle('study')}>
              <div className="flex flex-col gap-3">
                <select value={field} onChange={(e) => setField(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:border-blue-400 outline-none">
                  <option value="">תחום לימודים</option>
                  {FIELDS_OF_STUDY.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={uni} onChange={(e) => setUni(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:border-blue-400 outline-none">
                  <option value="">מוסד אקדמי</option>
                  {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <SaveBtn saving={saving} onSave={() => save({ field_of_study: field, university: uni })} />
              </div>
            </ExpandRow>
          )}

          {/* ביו */}
          <ExpandRow icon="💬" label="ביו" value={profile?.bio ? profile.bio.slice(0, 40) + (profile.bio.length > 40 ? '…' : '') : ''} isOpen={open === 'bio'} onToggle={() => toggle('bio')}>
            <div className="flex flex-col gap-3">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-800 focus:border-blue-400 outline-none resize-none"
                placeholder="ספר על עצמך..."
              />
              <div className="text-left text-xs text-gray-300">{bio.length}/300</div>
              <SaveBtn saving={saving} onSave={() => save({ bio })} />
            </div>
          </ExpandRow>

          {/* תמונות — navigate */}
          <button
            onClick={() => onNavigate('/onboarding/photos')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-right"
          >
            <ChevronLeft size={14} className="text-gray-300" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">תמונות</span>
              <span className="text-base">📸</span>
            </div>
          </button>

        </div>
      </div>

      {/* ── Privacy ── */}
      <button
        onClick={() => onNavigate('/privacy')}
        className="flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors text-right"
      >
        <ChevronLeft size={14} className="text-gray-300" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">מדיניות פרטיות</span>
          <ShieldCheck size={16} className="text-gray-400" />
        </div>
      </button>

      {/* ── Logout ── */}
      <LogoutButton />

      {/* ── Delete account ── */}
      <button
        onClick={() => onNavigate('/settings/delete-account')}
        className="w-full py-3 text-xs text-gray-300 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
      >
        <Trash2 size={12} />
        מחק חשבון לצמיתות
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'view' | 'edit';

export default function ProfilePage() {
  const router  = useRouter();
  const { profile, userId, loading, refresh } = useProfile();
  const meetCute = profile?.meet_cute_activity && profile?.meet_cute_mindset && profile?.meet_cute_availability_vibe
    ? {
        activity: profile.meet_cute_activity as MeetCute['activity'],
        mindset: profile.meet_cute_mindset as MeetCute['mindset'],
        availabilityVibe: profile.meet_cute_availability_vibe as MeetCute['availabilityVibe'],
      }
    : null;
  const [tab, setTab] = useState<Tab>('view');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const photos     = profile?.photo_urls?.filter(Boolean) ?? [];
  const photoCount = photos.length;

  const completeness = Math.min(
    100,
    (profile?.first_name     ? 20 : 0) +
    (profile?.age            ? 20 : 0) +
    (profile?.field_of_study ? 20 : 0) +
    (profile?.bio            ? 20 : 0) +
    Math.min(20, photoCount * 4),
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-gray-900 mb-3">הפרופיל שלי</h1>

        {/* Tab bar */}
        <div className="flex gap-0">
          <button
            onClick={() => setTab('view')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'view'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Eye size={15} />
            תצוגה
          </button>
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'edit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Edit2 size={15} />
            עריכה
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'view' ? (
          <ProfileView
            profile={profile}
            meetCute={meetCute}
            onEdit={() => setTab('edit')}
          />
        ) : (
          <ProfileEdit
            profile={profile}
            completeness={completeness}
            userId={userId ?? ''}
            onNavigate={(href) => router.push(href)}
            onRefresh={refresh}
          />
        )}
      </div>
    </div>
  );
}
