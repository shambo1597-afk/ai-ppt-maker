import { SlideElement } from '../../types/slide';
import { deriveGradient } from '../design/designGrammar';
import { Box, CANVAS_H, CANVAS_W } from './grid';
import { generateBlobPath, hashSeed } from './organicShapes';
import { seededRandom } from '../utils/prng';

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `el-poster-${prefix}-${Date.now()}-${counter}`;
}

/** The minimal palette a poster graphic needs — the composer's resolved
 * surface colors (which already account for hero vs. canvas tone), not a
 * raw ThemeTokens object. */
export interface PosterPalette {
  accent: string;
  accentBadge?: string;
  textPrimary: string;
  fontHeading: string;
}

function mkBlob(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
  color: string;
  opacity: number;
  zIndex: number;
  rotation?: number;
  points?: number;
  irregularity?: number;
}): SlideElement {
  return {
    id: nextId('blob'),
    type: 'shape',
    shapeType: 'blob',
    blobPoints: generateBlobPath(props.seed, props.points ?? 8, props.irregularity ?? 0.32),
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    rotation: props.rotation ?? 0,
    opacity: props.opacity,
    zIndex: props.zIndex,
    fillColor: props.color,
    fillOpacity: 1,
    borderColor: props.color,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
  };
}

/**
 * Real Canva gradients turn out to live almost entirely on headline text
 * and decorative shape strokes, never on a shape's own fill or the slide
 * background (see scripts/extractDesignGrammar.js) — and pptxgenjs's own
 * shape-fill API only supports solid colors, so a literal PPTX gradient
 * *fill* isn't something either the data or the export format actually
 * supports. Instead, this renders the same learned "vivid base -> pale
 * tint of the same hue" relationship (deriveGradient) as two overlapping
 * flat-filled blobs — a real two-tone bloom that's still just plain solid
 * custGeom shapes, so it exports with full native PPTX fidelity.
 */
function twoToneBlobCluster(
  box: Box,
  baseColor: string,
  facesRight: boolean,
  seedBase: number,
  zIndexBase: number,
  deckSeed: number
): SlideElement[] {
  // deriveGradient() now weighted-samples across the real observed
  // gradient pairs (see designGrammar.ts) rather than one flattened rule —
  // an explicit seeded rand keeps that pick (and therefore this tint)
  // reproducible for a given deckSeed, matching this cluster's own blob
  // seeds below.
  const { to: tint } = deriveGradient(baseColor, 1, seededRandom(hashSeed(deckSeed, seedBase, 3)));
  const outward = facesRight ? box.x + box.width : box.x;
  const bigSize = Math.round(box.height * 0.66);
  const smallSize = Math.round(bigSize * 0.62);

  return [
    mkBlob({
      x: facesRight ? outward - bigSize * 0.6 : outward - bigSize * 0.4,
      y: box.y - bigSize * 0.18,
      width: bigSize,
      height: bigSize,
      seed: hashSeed(deckSeed, seedBase, 1),
      color: baseColor,
      opacity: 0.16,
      zIndex: zIndexBase,
      rotation: (seedBase % 7) * 4,
    }),
    mkBlob({
      x: facesRight ? outward - smallSize * 0.85 : outward - smallSize * 0.15,
      y: box.y + box.height * 0.1,
      width: smallSize,
      height: smallSize,
      seed: hashSeed(deckSeed, seedBase, 2),
      color: tint,
      opacity: 0.6,
      zIndex: zIndexBase + 1,
      rotation: (seedBase % 5) * -6,
    }),
  ];
}

/**
 * Bold typographic/graphic poster dressing for slides with no user-supplied
 * image. This never fetches or guesses a stock photo — it only assembles
 * abstract organic blob geometry from the theme's own palette, so a slide
 * with no image still reads as an intentional graphic composition instead
 * of an empty box. The variant rotates with the slide's position in the
 * deck so a run of image-less slides doesn't repeat the same flourish,
 * and every shape bleeds toward `box`'s own outward edge — never toward
 * the shared boundary with whatever text column sits next to it.
 *
 * @param box the region reserved for the graphic (the "media" half of a
 *   grid.splitBox() call)
 * @param facesRight whether `box` is the right-hand column (so decoration
 *   should bleed toward the canvas's right edge) or the left-hand one
 */
export function generatePosterGraphic(
  box: Box,
  theme: PosterPalette,
  slideIndex: number,
  facesRight: boolean,
  zIndexBase: number = 0,
  deckSeed: number = 0
): SlideElement[] {
  const variant = slideIndex % 3;
  const outwardEdge = facesRight ? box.x + box.width : box.x;

  if (variant === 0) {
    return twoToneBlobCluster(box, theme.accent, facesRight, slideIndex, zIndexBase, deckSeed);
  }

  if (variant === 1) {
    // One large, very soft blob behind an oversized index numeral.
    const num = String(slideIndex).padStart(2, '0');
    const size = Math.round(box.height * 0.9);
    return [
      mkBlob({
        x: facesRight ? outwardEdge - size * 0.7 : outwardEdge - size * 0.3,
        y: box.y + box.height - size * 0.85,
        width: size,
        height: size,
        seed: hashSeed(deckSeed, slideIndex, 3),
        color: theme.accentBadge || theme.accent,
        opacity: 0.14,
        zIndex: zIndexBase,
      }),
      {
        id: nextId('numeral'),
        type: 'text',
        x: facesRight ? box.x + box.width - size * 0.95 : box.x - size * 0.05,
        y: box.y + box.height - size * 0.98,
        width: size,
        height: size,
        rotation: 0,
        opacity: 0.1,
        zIndex: zIndexBase + 1,
        text: num,
        fontSize: Math.round(size * 0.82),
        fontFamily: theme.fontHeading,
        fontWeight: '900',
        color: theme.textPrimary,
        align: facesRight ? 'right' : 'left',
        verticalAlign: 'bottom',
        lineHeight: 0.85,
      },
    ];
  }

  // variant 2: three small blobs stacked along the box's own outward edge.
  const sizes = [0.3, 0.42, 0.22];
  const colors = [theme.accent, theme.accentBadge || theme.accent, theme.accent];
  const opacities = [0.5, 0.28, 0.14];
  let y = box.y;
  return sizes.map((sizeRatio, i) => {
    const size = Math.round(box.height * sizeRatio);
    const el = mkBlob({
      x: facesRight ? outwardEdge - size * 0.7 : outwardEdge - size * 0.3,
      y,
      width: size,
      height: size,
      seed: hashSeed(deckSeed, slideIndex, 10 + i),
      color: colors[i],
      opacity: opacities[i],
      zIndex: zIndexBase + i,
      rotation: i * 22,
    });
    y += size * 0.72;
    return el;
  });
}

/**
 * Very low-opacity ambient blob texture usable behind ANY regime's
 * content (title, quote, stat, grid, media-split alike) — the organic,
 * human touch this composer applies deck-wide, not only to image-less
 * slides. Always sits at the lowest z-index and never uses more than a
 * whisper of opacity so it never competes with text contrast.
 */
export function generateAmbientBlobs(
  theme: PosterPalette,
  slideIndex: number,
  zIndexBase: number = 0,
  deckSeed: number = 0
): SlideElement[] {
  const corner = slideIndex % 2 === 0 ? 'br' : 'tl';
  const size = Math.round(CANVAS_H * 0.85);
  // See twoToneBlobCluster's own comment: seeded so the weighted gradient-
  // pair pick stays reproducible for a given deckSeed.
  const { to: tint } = deriveGradient(theme.accent, 0.6, seededRandom(hashSeed(deckSeed, slideIndex, 22)));

  const x = corner === 'br' ? CANVAS_W - size * 0.55 : -size * 0.35;
  const y = corner === 'br' ? CANVAS_H - size * 0.55 : -size * 0.35;

  return [
    mkBlob({
      x,
      y,
      width: size,
      height: size,
      seed: hashSeed(deckSeed, slideIndex, 20),
      color: theme.accent,
      opacity: 0.05,
      zIndex: zIndexBase,
      irregularity: 0.28,
    }),
    mkBlob({
      x: x + size * 0.18,
      y: y + size * 0.18,
      width: size * 0.55,
      height: size * 0.55,
      seed: hashSeed(deckSeed, slideIndex, 21),
      color: tint,
      opacity: 0.07,
      zIndex: zIndexBase + 1,
      irregularity: 0.28,
    }),
  ];
}
