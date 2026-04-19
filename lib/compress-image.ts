/**
 * Compresses an image file for upload.
 * - Uses createImageBitmap (better HEIC/HEIF support on iOS Safari 17+)
 *   with a canvas fallback for older browsers.
 * - Resizes so the longest edge is at most `maxPx` pixels
 * - Re-encodes as JPEG with the given quality (0–1)
 * - Returns a Blob ready for upload
 */
export async function compressImage(
  file: File,
  { maxPx = 1200, quality = 0.82 }: { maxPx?: number; quality?: number } = {},
): Promise<Blob> {
  // Prefer createImageBitmap — it decodes HEIC natively on modern iOS/Safari
  // and avoids holding a full HTMLImageElement in memory (important on iPad).
  if (typeof createImageBitmap === 'function') {
    try {
      return await compressWithBitmap(file, maxPx, quality);
    } catch {
      // Fall through to canvas path
    }
  }

  return compressWithImage(file, maxPx, quality);
}

async function compressWithBitmap(
  file: File,
  maxPx: number,
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxPx || height > maxPx) {
    if (width >= height) {
      height = Math.round((height / width) * maxPx);
      width = maxPx;
    } else {
      width = Math.round((width / height) * maxPx);
      height = maxPx;
    }
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('OffscreenCanvas context unavailable');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.convertToBlob({ type: 'image/jpeg', quality });
}

function compressWithImage(
  file: File,
  maxPx: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width = maxPx;
        } else {
          width = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
