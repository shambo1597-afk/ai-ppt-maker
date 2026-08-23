import { DESIGN_GRAMMAR } from '../design/designGrammar';
import { CANVAS_H } from './grid';

/**
 * Estimate the rendered height of a text block at a given font size/width,
 * used to auto-fit type sizes to their content box instead of hand-picking
 * per-slide pixel heights.
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  containerWidth: number,
  lineHeightRatio: number = 1.4
): number {
  if (!text) return 0;
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(6, Math.floor(containerWidth / avgCharWidth));

  const paragraphs = text.split('\n');
  let totalLines = 0;
  paragraphs.forEach((p) => {
    if (p.trim().length === 0) {
      totalLines += 0.5;
    } else {
      totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
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

export interface AutoFitOptions {
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
 * three-line one shrinks until it fits.
 */
export function autoFitFontSize(text: string, boxWidth: number, heightBudget: number, opts: AutoFitOptions): number {
  const { maxSize, minSize, lineHeightRatio = 1.1, step = 2 } = opts;
  let size = maxSize;
  while (size > minSize) {
    if (estimateTextHeight(text, size, boxWidth, lineHeightRatio) <= heightBudget) {
      return size;
    }
    size -= step;
  }
  return minSize;
}
