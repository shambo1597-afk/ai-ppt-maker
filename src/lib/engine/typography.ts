import { DESIGN_GRAMMAR } from '../design/designGrammar';
import { CANVAS_H } from './grid';

/**
 * Count wrapped lines by simulating real greedy word-wrap with an actual
 * canvas 2D context (available wherever this engine composes slides — the
 * browser). This is what makes estimateTextHeight trustworthy: a naive
 * "average char width" ratio only holds up for short, evenly-worded text —
 * for real headline/body copy it can be off by a full extra wrapped line,
 * because it can't see actual glyph widths (which vary by font, weight,
 * and the specific mix of characters) or where words actually break.
 * Measuring with the real font/size/weight and simulating the same
 * greedy-fill wrapping CSS does reproduces the DOM's line count exactly
 * (verified against real rendered headings across every theme's heading
 * font, down to sub-pixel agreement) instead of guessing at it.
 */
let sharedMeasureCtx: CanvasRenderingContext2D | null | undefined;
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (sharedMeasureCtx !== undefined) return sharedMeasureCtx;
  if (typeof document === 'undefined') {
    sharedMeasureCtx = null;
    return sharedMeasureCtx;
  }
  const canvas = document.createElement('canvas');
  sharedMeasureCtx = canvas.getContext('2d');
  return sharedMeasureCtx;
}

/** The subset of font styling that affects wrapping — must match the
 * eventual text element's own values, or the measurement (however precise)
 * is measuring the wrong glyphs. Every field is optional because most
 * callers only care about getting *a* reasonable box before real content
 * is known; composer.ts's regimes pass the real values once the element's
 * actual styling is decided. */
export interface TextMeasureFont {
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
}

function countWrappedLinesExact(paragraph: string, fontSize: number, containerWidth: number, font: TextMeasureFont): number | null {
  const ctx = getMeasureContext();
  if (!ctx) return null;
  const { fontFamily = 'sans-serif', fontWeight = '400', fontStyle = 'normal', letterSpacing = 0 } = font;
  ctx.font = `${fontStyle === 'italic' ? 'italic ' : ''}${fontWeight} ${fontSize}px ${fontFamily}`;
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const spaceWidth = ctx.measureText(' ').width + letterSpacing;
  let lineCount = 1;
  let currentWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width + letterSpacing * word.length;
    const needed = currentWidth === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;
    if (needed > containerWidth && currentWidth > 0) {
      lineCount += 1;
      currentWidth = wordWidth;
    } else {
      currentWidth = needed;
    }
  }
  return lineCount;
}

/** Character-count fallback for contexts with no canvas (Node/SSR/tests) —
 * the same heuristic this function used everywhere until real measurement
 * was available, kept only as a degrade-gracefully path. */
function countWrappedLinesApprox(paragraph: string, fontSize: number, containerWidth: number): number {
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(6, Math.floor(containerWidth / avgCharWidth));
  return Math.max(1, Math.ceil(paragraph.length / charsPerLine));
}

/**
 * Estimate the rendered height of a text block at a given font size/width,
 * used to auto-fit type sizes to their content box instead of hand-picking
 * per-slide pixel heights. Accurate to real DOM layout wherever a canvas is
 * available (see countWrappedLinesExact) — pass `font` matching the actual
 * text element being sized, since a wrong font measures the wrong glyphs.
 * Degrades to an approximation where no canvas exists (Node/SSR/tests).
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  containerWidth: number,
  lineHeightRatio: number = 1.4,
  font: TextMeasureFont = {}
): number {
  if (!text) return 0;

  const paragraphs = text.split('\n');
  let totalLines = 0;
  paragraphs.forEach((p) => {
    if (p.trim().length === 0) {
      totalLines += 0.5;
    } else {
      totalLines += countWrappedLinesExact(p, fontSize, containerWidth, font) ?? countWrappedLinesApprox(p, fontSize, containerWidth);
    }
  });

  return Math.ceil(totalLines * fontSize * lineHeightRatio);
}

/** Grammar-derived base sizes, expressed relative to the canvas so they hold at any export resolution. */
export function baseTitleSize(): number {
  return Math.round(CANVAS_H * DESIGN_GRAMMAR.typeScale.titleToCanvasHeightRatio);
}

export function baseBodySize(): number {
  return Math.round(CANVAS_H * DESIGN_GRAMMAR.typeScale.bodyToCanvasHeightRatio);
}

export function titleToBodyRatio(): number {
  return DESIGN_GRAMMAR.typeScale.titleToBodyRatio;
}

export interface AutoFitOptions extends TextMeasureFont {
  maxSize: number;
  minSize: number;
  lineHeightRatio?: number;
  step?: number;
}

/**
 * Shrink a font size from `maxSize` down to whatever fits `heightBudget`
 * (floored at `minSize`). This is the mechanism that lets headline/body/
 * bullet sizes respond to actual content volume rather than being fixed
 * per composition — a two-word headline renders near `maxSize`, a
 * three-line one shrinks until it fits. `opts`'s font fields must match
 * the eventual text element's own styling (see estimateTextHeight).
 *
 * This tolerates wrapping to multiple lines, as long as the total block
 * still fits the height budget — correct for headline/body/bullet text,
 * where wrapping is the normal, expected outcome. It is NOT correct for
 * text that must never wrap at all (see autoFitSingleLineFontSize below).
 */
export function autoFitFontSize(text: string, boxWidth: number, heightBudget: number, opts: AutoFitOptions): number {
  const { maxSize, minSize, lineHeightRatio = 1.1, step = 2, ...font } = opts;
  let size = maxSize;
  while (size > minSize) {
    if (estimateTextHeight(text, size, boxWidth, lineHeightRatio, font) <= heightBudget) {
      return size;
    }
    size -= step;
  }
  return minSize;
}

export interface SingleLineFitOptions extends TextMeasureFont {
  maxSize: number;
  minSize: number;
  step?: number;
}

/**
 * Shrink a font size from `maxSize` down until `text` fits on a single
 * unbroken line within `boxWidth` (floored at `minSize`) — never
 * tolerates a wrap, unlike autoFitFontSize() above, which only bounds
 * total rendered *height* and is perfectly happy to accept a wrap that
 * still fits that height budget.
 *
 * Built for composer.ts's STAT regime hero number: `autoFitFontSize` was
 * originally used there too, sized against a height budget alone — which
 * only ever got exercised against short model-invented values like "68%"
 * during development. A longer real value like "20,000 m" could still
 * fit that height budget by wrapping onto two lines ("20" stacked over
 * "000 m"), which is a fundamentally broken layout for a single hero
 * number, not just an oversized one. Any text that must read as one
 * line — a stat, a ticker value, a monospaced code/id string — should use
 * this instead of autoFitFontSize().
 */
export function autoFitSingleLineFontSize(text: string, boxWidth: number, opts: SingleLineFitOptions): number {
  const { maxSize, minSize, step = 2, ...font } = opts;
  let size = maxSize;
  while (size > minSize) {
    const lineCount = countWrappedLinesExact(text, size, boxWidth, font) ?? countWrappedLinesApprox(text, size, boxWidth);
    if (lineCount <= 1) {
      return size;
    }
    size -= step;
  }
  return minSize;
}
