'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Plus, X, Images, Loader2, GripVertical } from 'lucide-react';
import { useOnboardingStore } from '../../../lib/onboarding-store';
import { createClient } from '../../../lib/supabase';
import { compressImage } from '../../../lib/compress-image';

const TOTAL = 6;
const MIN_PHOTOS = 2;

export default function PhotosStep() {
  const router = useRouter();
  const { photos, setPhoto, removePhoto } = useOnboardingStore();
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setReady(true);
    }
    checkAuth();
  }, [router]);

  // Drag state
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const filled = photos.filter(Boolean).length;
  const isValid = filled >= MIN_PHOTOS;
  const isAnyUploading = Object.values(uploading).some(Boolean);

  const handleFileChange = async (index: number, file: File | undefined) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhoto(index, previewUrl);
    setUploading((prev) => ({ ...prev, [index]: true }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const compressed = await compressImage(file);
      const path = `${user.id}/${index}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      URL.revokeObjectURL(previewUrl);
      setPhoto(index, publicUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
      removePhoto(index);
    } finally {
      setUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleRemove = async (index: number) => {
    const url = photos[index];
    removePhoto(index);

    if (url && url.includes('supabase')) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const parts = url.split(`/profile-photos/`);
        if (parts[1]) {
          await supabase.storage.from('profile-photos').remove([parts[1]]);
        }
      } catch { /* ignore */ }
    }
  };

  // ── Drag handlers ──

  const handleDragStart = (i: number) => {
    dragFrom.current = i;
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault(); // required to allow drop
    if (dragFrom.current !== null && dragFrom.current !== i) {
      setDragOver(i);
    }
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragFrom.current;
    if (fromIndex === null || fromIndex === toIndex) return;

    // Swap the two slots
    const fromUrl = photos[fromIndex] ?? '';
    const toUrl = photos[toIndex] ?? '';
    setPhoto(fromIndex, toUrl);
    setPhoto(toIndex, fromUrl);

    // Swap uploading state too
    setUploading((prev) => {
      const next = { ...prev };
      const tmp = next[fromIndex];
      next[fromIndex] = next[toIndex] ?? false;
      next[toIndex] = tmp ?? false;
      return next;
    });

    dragFrom.current = null;
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragFrom.current = null;
    setDragOver(null);
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="flex flex-col flex-1 px-6 pt-8 pb-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Images size={26} className="text-blue-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-1">הוסף תמונות</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        העלה לפחות {MIN_PHOTOS} תמונות. עד {TOTAL} תמונות.
        <br />
        <span className="text-blue-500 font-medium">{filled} מתוך {TOTAL}</span> נבחרו
        {filled >= 2 && <span className="text-gray-300"> · גרור לשינוי סדר</span>}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-auto">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const photo = photos[i];
          const isUploading = uploading[i];
          const isDraggable = !!photo && !isUploading;
          const isDropTarget = dragOver === i;

          return (
            <div
              key={i}
              className={`relative aspect-square transition-transform duration-150 ${
                isDropTarget ? 'scale-105' : ''
              }`}
              draggable={isDraggable}
              onDragStart={() => isDraggable && handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            >
              {photo ? (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className={`w-full h-full rounded-2xl overflow-hidden relative group ring-2 transition-all ${
                    isDropTarget ? 'ring-blue-400' : 'ring-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`תמונה ${i + 1}`} className="w-full h-full object-cover" />

                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                      <Loader2 size={22} className="text-white animate-spin" />
                    </div>
                  )}

                  {!isUploading && (
                    <>
                      {/* Drag handle — visible on hover */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} className="text-white drop-shadow" />
                      </div>
                      <button
                        onClick={() => handleRemove(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </>
                  )}

                  {i === 0 && !isUploading && (
                    <div className="absolute bottom-1.5 left-1.5 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ראשי
                    </div>
                  )}
                </motion.div>
              ) : (
                <button
                  onClick={() => fileInputs.current[i]?.click()}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                    isDropTarget
                      ? 'border-blue-400 bg-blue-50 scale-105'
                      : i === 0 && filled === 0
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {i === 0 && filled === 0
                    ? <Camera size={20} className="text-blue-400" />
                    : <Plus size={18} className={isDropTarget ? 'text-blue-400' : 'text-gray-400'} />
                  }
                </button>
              )}

              <input
                ref={(el) => { fileInputs.current[i] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(i, e.target.files?.[0])}
              />
            </div>
          );
        })}
      </div>

      {!isValid && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center text-gray-400 mt-4">
          פרופילים עם {MIN_PHOTOS}+ תמונות מקבלים פי 3 יותר התאמות
        </motion.p>
      )}

      <motion.button
        onClick={() => router.push('/onboarding/about')}
        whileTap={{ scale: 0.97 }}
        disabled={!isValid || isAnyUploading}
        className={`w-full py-4 rounded-2xl font-bold text-base mt-6 transition-all flex items-center justify-center gap-2 ${
          isValid && !isAnyUploading
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {isAnyUploading && <Loader2 size={18} className="animate-spin" />}
        {isAnyUploading ? 'מעלה תמונות...' : 'המשך'}
      </motion.button>
    </motion.div>
  );
}
