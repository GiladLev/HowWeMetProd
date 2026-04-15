'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gender, GenderPreference } from '../types';

export const ISRAELI_UNIVERSITIES = [
  'אוניברסיטת תל אביב',
  'האוניברסיטה העברית בירושלים',
  'הטכניון - מכון טכנולוגי לישראל',
  'אוניברסיטת בן גוריון בנגב',
  'אוניברסיטת חיפה',
  'אוניברסיטת בר אילן',
  'אוניברסיטת רייכמן (IDC הרצליה)',
  'אוניברסיטת אריאל',
  'המכללה האקדמית תל אביב יפו',
  'מכללה למינהל',
  'אחר',
];

interface OnboardingStore {
  email: string;
  isVerified: boolean;
  firstName: string;
  age: number;
  gender: Gender | null;
  genderPreference: GenderPreference;
  fieldOfStudy: string;
  university: string;
  location: string;
  photos: string[]; // object/data URLs – not persisted
  bio: string;
  isComplete: boolean;

  setEmail: (email: string) => void;
  setVerified: () => void;
  setFirstName: (name: string) => void;
  setAge: (age: number) => void;
  setGender: (gender: Gender) => void;
  setGenderPreference: (pref: GenderPreference) => void;
  setStudy: (field: string, uni: string) => void;
  setLocation: (location: string) => void;
  setPhoto: (index: number, url: string) => void;
  removePhoto: (index: number) => void;
  setBio: (bio: string) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      email: '',
      isVerified: false,
      firstName: '',
      age: 20,
      gender: null,
      genderPreference: 'both',
      fieldOfStudy: '',
      university: '',
      location: '',
      photos: [],
      bio: '',
      isComplete: false,

      setEmail: (email) => set({ email }),
      setVerified: () => set({ isVerified: true }),
      setFirstName: (firstName) => set({ firstName }),
      setAge: (age) => set({ age }),
      setGender: (gender) => set({ gender }),
      setGenderPreference: (genderPreference) => set({ genderPreference }),
      setStudy: (fieldOfStudy, university) => set({ fieldOfStudy, university }),
      setLocation: (location) => set({ location }),
      setPhoto: (index, url) => {
        const photos = [...get().photos];
        while (photos.length <= index) photos.push('');
        photos[index] = url;
        set({ photos });
      },
      removePhoto: (index) => {
        const photos = [...get().photos];
        photos[index] = '';
        set({ photos });
      },
      setBio: (bio) => set({ bio }),
      complete: () => set({ isComplete: true }),
      reset: () => set({
        email: '', isVerified: false, firstName: '', age: 20,
        gender: null, genderPreference: 'both',
        fieldOfStudy: '', university: '', location: '', photos: [], bio: '', isComplete: false,
      }),
    }),
    {
      name: 'howwemet-onboarding',
      // Don't persist photos (blob URLs die between sessions)
      partialize: (s) => ({
        email: s.email,
        isVerified: s.isVerified,
        firstName: s.firstName,
        age: s.age,
        gender: s.gender,
        genderPreference: s.genderPreference,
        fieldOfStudy: s.fieldOfStudy,
        university: s.university,
        location: s.location,
        bio: s.bio,
        isComplete: s.isComplete,
      }),
    },
  ),
);
