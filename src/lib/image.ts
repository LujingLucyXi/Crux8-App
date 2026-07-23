/**
 * Avatar photo handling.
 *
 * Photos are stored inline in localStorage as data URLs, so they MUST be
 * downscaled first — a raw phone photo is 3–8 MB and would blow the ~5 MB
 * localStorage quota, throwing QuotaExceededError and corrupting the whole
 * persisted store. We center-crop to a square and re-encode as JPEG, which
 * lands around 15–40 KB.
 *
 * When the backend arrives this moves to Supabase Storage and we keep only
 * a URL — but the downscale is still worth doing client-side.
 */

const OUTPUT_SIZE = 256;
const JPEG_QUALITY = 0.82;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // reject absurd files early

export type ImageError = 'not-an-image' | 'too-large' | 'decode-failed';

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image' satisfies ImageError);
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('too-large' satisfies ImageError);

  const bitmap = await loadBitmap(file);

  // Center-crop to a square before scaling so faces aren't stretched.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('decode-failed' satisfies ImageError);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // White matte so transparent PNGs don't turn black under JPEG.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap honours EXIF orientation in modern browsers.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to the <img> path */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode-failed' satisfies ImageError));
    };
    img.src = url;
  });
}

/** Rough byte size of a data URL, for surfacing storage pressure. */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((b64.length * 3) / 4);
}
