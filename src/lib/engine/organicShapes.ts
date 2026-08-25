import { BlobPoint } from '../../types/slide';
import { seededRandom } from '../utils/prng';

export { seededRandom };

/**
 * Generate a closed, organic blob path normalized to a 0..1 unit box.
 * Technique: scatter `points` vertices around a circle with per-vertex
 * radius jitter, then smooth them into a closed loop of cubic Beziers via
 * Catmull-Rom-to-Bezier conversion — the standard approach for procedural
 * "blobby" shapes. Fully deterministic for a given seed.
 */
export function generateBlobPath(seed: number, points: number = 8, irregularity: number = 0.35): BlobPoint[] {
  const rand = seededRandom(seed);
  const count = Math.max(5, Math.min(14, points));
  const angleStep = (Math.PI * 2) / count;

  const verts = Array.from({ length: count }, (_, i) => {
    const jitter = 1 + (rand() - 0.5) * 2 * irregularity;
    const radius = 0.5 * Math.max(0.35, jitter);
    const angle = i * angleStep + (rand() - 0.5) * angleStep * 0.4;
    return { x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius };
  });

  const tension = 6;
  const path: BlobPoint[] = [{ x: verts[0].x, y: verts[0].y }];
  for (let i = 0; i < count; i++) {
    const p0 = verts[(i - 1 + count) % count];
    const p1 = verts[i];
    const p2 = verts[(i + 1) % count];
    const p3 = verts[(i + 2) % count];
    path.push({
      x: p2.x,
      y: p2.y,
      curve: {
        x1: p1.x + (p2.x - p0.x) / tension,
        y1: p1.y + (p2.y - p0.y) / tension,
        x2: p2.x - (p3.x - p1.x) / tension,
        y2: p2.y - (p3.y - p1.y) / tension,
      },
    });
  }
  return path;
}

/** Turn a small integer seed into a hash usable as a PRNG seed, so callers
 * can key blobs off simple values (slide index, a layer number) without
 * worrying about collisions between nearby integers producing near-
 * identical shapes. */
export function hashSeed(...parts: number[]): number {
  let h = 2166136261;
  for (const p of parts) {
    h = Math.imul(h ^ Math.round(p * 97), 16777619);
  }
  return h >>> 0;
}

function scalePoints(points: BlobPoint[], width: number, height: number): BlobPoint[] {
  return points.map((p) => ({
    x: p.x * width,
    y: p.y * height,
    curve: p.curve
      ? {
          x1: p.curve.x1 * width,
          y1: p.curve.y1 * height,
          x2: p.curve.x2 * width,
          y2: p.curve.y2 * height,
        }
      : undefined,
  }));
}

/** Render a normalized blob path as an SVG `<path d="…">`, scaled to the
 * element's actual pixel size — used by the canvas renderer. */
export function blobPathToSvgD(points: BlobPoint[], width: number, height: number): string {
  const scaled = scalePoints(points, width, height);
  if (scaled.length === 0) return '';
  let d = `M ${scaled[0].x.toFixed(2)} ${scaled[0].y.toFixed(2)}`;
  for (let i = 1; i < scaled.length; i++) {
    const p = scaled[i];
    if (p.curve) {
      d += ` C ${p.curve.x1.toFixed(2)} ${p.curve.y1.toFixed(2)}, ${p.curve.x2.toFixed(2)} ${p.curve.y2.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    } else {
      d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
  }
  return `${d} Z`;
}

export interface PptxFreeformPoint {
  x: number;
  y: number;
  moveTo?: boolean;
  curve?: { type: 'cubic'; x1: number; y1: number; x2: number; y2: number };
}

/**
 * Render a normalized blob path as the `points` array pptxgenjs expects
 * for a `custGeom` (freeform) shape, scaled to the shape's actual size in
 * inches — pptxgenjs's local path coordinate space is the shape's own
 * on-slide extent, so this is the exact geometric twin of blobPathToSvgD.
 */
export function blobPathToPptxPoints(
  points: BlobPoint[],
  widthInches: number,
  heightInches: number
): Array<PptxFreeformPoint | { close: true }> {
  const scaled = scalePoints(points, widthInches, heightInches);
  const out: Array<PptxFreeformPoint | { close: true }> = [];
  scaled.forEach((p, i) => {
    if (i === 0) {
      out.push({ x: p.x, y: p.y, moveTo: true });
      return;
    }
    if (p.curve) {
      out.push({ x: p.x, y: p.y, curve: { type: 'cubic', x1: p.curve.x1, y1: p.curve.y1, x2: p.curve.x2, y2: p.curve.y2 } });
    } else {
      out.push({ x: p.x, y: p.y });
    }
  });
  out.push({ close: true });
  return out;
}
