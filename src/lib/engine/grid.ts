import { DESIGN_GRAMMAR } from '../design/designGrammar';

/**
 * Canvas grid math. Every number here is derived from the extracted design
 * grammar (proportions of the canvas) rather than hand-picked pixel
 * constants, so margins/gutters/columns respond to what the sample Canva
 * decks actually do and stay correct if the grammar is ever re-extracted.
 */
export const CANVAS_W = 1920;
export const CANVAS_H = 1080;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The safe content area inside the canvas margins. */
export function getContentBox(): Box {
  const marginX = Math.round(CANVAS_W * DESIGN_GRAMMAR.margins.xRatio);
  const marginY = Math.round(CANVAS_H * DESIGN_GRAMMAR.margins.yRatio);
  return {
    x: marginX,
    y: marginY,
    width: CANVAS_W - marginX * 2,
    height: CANVAS_H - marginY * 2,
  };
}

export function stackGap(): number {
  return Math.round(CANVAS_H * DESIGN_GRAMMAR.spacing.stackGapRatio);
}

export function columnGutter(): number {
  return Math.round(CANVAS_W * DESIGN_GRAMMAR.spacing.columnGutterRatio);
}

export function imageColumnWidth(availableWidth: number): number {
  return Math.round(availableWidth * DESIGN_GRAMMAR.imageColumnRatio);
}

/**
 * Split a box horizontally into an image column and a text column, honoring
 * the empirical image-column ratio. `imageFirst` flips which side the image
 * lands on so consecutive split slides don't all mirror one another.
 */
export function splitBox(box: Box, imageFirst: boolean, gutter: number = columnGutter()): { media: Box; text: Box } {
  const mediaWidth = imageColumnWidth(box.width);
  const textWidth = box.width - mediaWidth - gutter;
  const mediaX = imageFirst ? box.x : box.x + textWidth + gutter;
  const textX = imageFirst ? box.x + mediaWidth + gutter : box.x;

  return {
    media: { x: mediaX, y: box.y, width: mediaWidth, height: box.height },
    text: { x: textX, y: box.y, width: textWidth, height: box.height },
  };
}

/**
 * Compute an N-up grid (wrapping into rows once a row would exceed
 * `maxCols`) sized purely from the item count and available box — never a
 * fixed "3 columns" constant.
 */
export function computeGrid(itemCount: number, box: Box, maxCols: number = 4, gutter: number = columnGutter()) {
  const cols = Math.max(1, Math.min(maxCols, itemCount));
  const rows = Math.ceil(itemCount / cols);
  const colWidth = (box.width - gutter * (cols - 1)) / cols;
  const rowGutter = stackGap() * 1.5;
  const rowHeight = (box.height - rowGutter * (rows - 1)) / rows;

  return Array.from({ length: itemCount }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: Math.round(box.x + col * (colWidth + gutter)),
      y: Math.round(box.y + row * (rowHeight + rowGutter)),
      width: Math.round(colWidth),
      height: Math.round(rowHeight),
    };
  });
}
