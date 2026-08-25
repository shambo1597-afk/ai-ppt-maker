/**
 * Canvas-based duotone treatment — the second half of the treated stock-
 * photo pipeline (see stockPhotoFetcher.ts). Converts a background-removed
 * cutout to grayscale luminance, then remaps shadows toward `colorA` and
 * highlights toward `colorB` — always the caller's own theme colors, never
 * arbitrary ones (see fetchTreatedPhoto()'s heroBg/accent call) — so a
 * treated photo is automatically palette-locked to the specific deck it's
 * placed in. This, not the background removal alone, is what makes the
 * result read as a designed asset rather than a foreign inserted photo.
 *
 * Needs the DOM canvas API (no dependency-free way to decode/re-encode
 * pixel data otherwise) — same browser-only constraint as texture.ts's
 * noise generator, so this returns null outside a browser rather than
 * throwing.
 */
import { hexToRgb } from '../design/colorMath';

/**
 * Remap `imageBlob`'s luminance onto a two-color gradient between
 * `colorA` (shadows, luminance 0) and `colorB` (highlights, luminance 1).
 * The original alpha channel is preserved untouched, so a transparent
 * background-removed cutout stays transparent — only RGB is rewritten.
 * Returns a PNG data URL, or null on any failure (unsupported browser,
 * a corrupt/undecodable image, invalid hex colors) — callers must treat
 * null as "skip this image" per the no-raw-fallback policy, never fall
 * back to the untreated blob.
 */
export async function applyDuotone(imageBlob: Blob, colorA: string, colorB: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) return null;

  try {
    const bitmap = await createImageBitmap(imageBlob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Rec. 601 luma weights — the standard perceptual grayscale
      // conversion, so a shadow region reads as "dark" the same way a
      // human viewer would judge it, not just a flat RGB average.
      const luminance = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      data[i] = rgbA.r + (rgbB.r - rgbA.r) * luminance;
      data[i + 1] = rgbA.g + (rgbB.g - rgbA.g) * luminance;
      data[i + 2] = rgbA.b + (rgbB.b - rgbA.b) * luminance;
      // data[i + 3] (alpha) is left untouched.
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
