import { seededRandom } from '../utils/prng';

/** Turn an arbitrary string (e.g. a presentation title) into a PRNG seed,
 * so the same deck always generates the same grain texture. */
export function hashStringSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * Procedural film-grain noise texture, generated at runtime — never a
 * bundled or fetched image file. Grounded in the real Canva samples: the
 * cover-slide background of several real decks turns out to be a flat
 * color or gradient with a visible grain/noise overlay layered on top
 * (see the design notes in slideComposer.ts), a distinct, deliberate
 * technique from stock photography — it's pure surface texture, not
 * content, so it doesn't conflict with the user-asset-first image policy.
 *
 * This needs the DOM canvas API (there's no dependency-free way to encode
 * a PNG's raw pixels otherwise), so it only runs in the browser — callers
 * get `undefined` outside one and should treat texture as optional.
 */
// Generated once at a fraction of canvas resolution and stretched to fill
// it (both renderers scale it with objectFit:'cover') — full-resolution
// per-pixel noise is unnecessary at the ~5-8% opacity this is meant to be
// used at, and PNG's lossless encoding compresses random noise very
// poorly (a 960x540 PNG at these settings is ~700KB). JPEG's lossy
// encoding handles noise far better — a few KB at this size — without
// looking any less like grain once blended in.
const TEXTURE_WIDTH = 480;
const TEXTURE_HEIGHT = 270;
const TEXTURE_JPEG_QUALITY = 0.5;

export function generateNoiseTextureDataUrl(
  seed: number,
  intensity: number = 40,
  width: number = TEXTURE_WIDTH,
  height: number = TEXTURE_HEIGHT
): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const imageData = ctx.createImageData(width, height);
  const rand = seededRandom(seed);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Mid-gray noise clustered near 128 (not full-range static) — this is
    // what reads as subtle film grain rather than TV static once blended
    // over a background at low opacity.
    const v = 128 + Math.round((rand() - 0.5) * 2 * intensity);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', TEXTURE_JPEG_QUALITY);
}
