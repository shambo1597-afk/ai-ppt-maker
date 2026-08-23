import { SlideElement } from '../../types/slide';
import { Box, columnGutter } from './grid';

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

/**
 * Bold typographic/graphic poster dressing for slides with no user-supplied
 * image. This never fetches or guesses a stock photo — it only assembles
 * abstract shape geometry from the theme's own palette, so a slide with no
 * image still reads as an intentional graphic composition instead of an
 * empty box. The variant rotates with the slide's position in the deck so a
 * run of image-less slides doesn't repeat the same flourish, and every
 * shape bleeds toward `box`'s own outward edge — never toward the shared
 * boundary with whatever text column sits next to it.
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
  zIndexBase: number = 0
): SlideElement[] {
  const variant = slideIndex % 3;
  const gutter = columnGutter();
  const outwardEdge = facesRight ? box.x + box.width : box.x;

  if (variant === 0) {
    // Layered corner blocks, bleeding off the outward top edge.
    const size = Math.round(box.height * 0.62);
    const blockABleed = size * 0.38;
    const blockBBleed = size * 0.08;
    const blockAWidth = size;
    const blockBWidth = size * 0.42;

    return [
      {
        id: nextId('block-a'),
        type: 'shape',
        shapeType: 'roundRect',
        x: facesRight ? outwardEdge - blockAWidth + blockABleed : outwardEdge - blockABleed,
        y: box.y - size * 0.22,
        width: blockAWidth,
        height: size,
        rotation: 8,
        opacity: 0.12,
        zIndex: zIndexBase,
        fillColor: theme.accent,
        fillOpacity: 1,
        borderColor: theme.accent,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: Math.round(size * 0.18),
      },
      {
        id: nextId('block-b'),
        type: 'shape',
        shapeType: 'circle',
        x: facesRight ? outwardEdge - blockBWidth + blockBBleed : outwardEdge - blockBBleed,
        y: box.y + box.height * 0.08,
        width: blockBWidth,
        height: blockBWidth,
        rotation: 0,
        opacity: 0.9,
        zIndex: zIndexBase + 1,
        fillColor: theme.accentBadge || theme.accent,
        fillOpacity: 1,
        borderColor: theme.accentBadge || theme.accent,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 999,
      },
    ];
  }

  if (variant === 1) {
    // A single oversized, low-opacity index numeral anchored to the box's
    // own bottom-outward corner.
    const num = String(slideIndex).padStart(2, '0');
    const size = Math.round(box.height * 0.9);
    return [
      {
        id: nextId('numeral'),
        type: 'text',
        x: facesRight ? outwardEdge - size * 0.95 : outwardEdge - size * 0.05,
        y: box.y + box.height - size * 0.98,
        width: size,
        height: size,
        rotation: 0,
        opacity: 0.08,
        zIndex: zIndexBase,
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

  // variant 2: stacked accent bars flush with the box's own outward edge.
  const barWidth = Math.round(gutter * 1.4);
  const barX = facesRight ? outwardEdge - barWidth : outwardEdge;
  const bars = [
    { h: 0.28, color: theme.accent, o: 0.9 },
    { h: 0.42, color: theme.accentBadge || theme.accent, o: 0.5 },
    { h: 0.2, color: theme.accent, o: 0.25 },
  ];
  let y = box.y;
  return bars.map((bar, i) => {
    const height = box.height * bar.h;
    const el: SlideElement = {
      id: nextId(`bar-${i}`),
      type: 'shape',
      shapeType: 'roundRect',
      x: barX,
      y,
      width: barWidth,
      height,
      rotation: 0,
      opacity: bar.o,
      zIndex: zIndexBase + i,
      fillColor: bar.color,
      fillOpacity: 1,
      borderColor: bar.color,
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: Math.round(barWidth / 3),
    };
    y += height + columnGutter() * 0.3;
    return el;
  });
}
