import { SlideElement, TextElement, ShapeElement, ImageElement, IconElement } from '../../types/slide';
import { ThemeTokens } from '../design/tokens';
import { mixHex } from '../design/colorMath';
import { SlideContent, SlideBullet } from './contentModel';
import { Box, CANVAS_H, getContentBox, stackGap, columnGutter, splitBox, computeGrid } from './grid';
import { autoFitFontSize, baseTitleSize, baseBodySize, estimateTextHeight } from './typography';
import { generatePosterGraphic, generateAmbientBlobs, PosterPalette } from './poster';

/**
 * ============================================================================
 * SCENE-GRAPH COMPOSER
 * ============================================================================
 * Replaces the old solve12ColumnSlideLayout() switch/case template engine.
 * There is no `archetype`/`layoutType` lookup here: composeSlide() inspects
 * which content facets are actually present (a stat? a quote? bullets? a
 * user image?) and derives a structural regime from that, then computes
 * every coordinate procedurally from the extracted design grammar (margins,
 * type scale, spacing rhythm, image-column ratio) and the real length of
 * the content (auto-fit typography, content-counted grids) — never a fixed
 * per-template pixel constant.
 * ============================================================================
 */

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `el-${prefix}-${Date.now()}-${uid}`;
}

function mkText(props: Partial<TextElement> & Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'text' | 'fontSize' | 'color'>): TextElement {
  return {
    id: nextId('text'),
    type: 'text',
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.4,
    ...props,
  };
}

function mkShape(props: Partial<ShapeElement> & Pick<ShapeElement, 'x' | 'y' | 'width' | 'height' | 'shapeType' | 'fillColor'>): ShapeElement {
  return {
    id: nextId('shape'),
    type: 'shape',
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    fillOpacity: 1,
    borderColor: props.fillColor,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
    ...props,
  };
}

function mkImage(props: Partial<ImageElement> & Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'src'>): ImageElement {
  return {
    id: nextId('image'),
    type: 'image',
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    objectFit: 'cover',
    borderRadius: 16,
    ...props,
  };
}

function mkIcon(props: Partial<IconElement> & Pick<IconElement, 'x' | 'y' | 'width' | 'height' | 'iconName' | 'color'>): IconElement {
  return {
    id: nextId('icon'),
    type: 'icon',
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    strokeWidth: 2,
    ...props,
  };
}

interface Surface {
  isHero: boolean;
  fg: string;
  muted: string;
  accent: string;
  accentBadge: string;
  fontHeading: string;
  fontBody: string;
  /** 'bold' (900) or 'light' (300) for the slide's monumental display
   * type — see ThemeTokens.displayWeight. */
  displayFontWeight: '300' | '900';
}

function resolveSurface(theme: ThemeTokens, isHero: boolean): Surface {
  return {
    isHero,
    fg: isHero ? theme.textHero : theme.textPrimary,
    // Every color in the scene graph must be a plain hex the PPTX exporter
    // can round-trip — no rgba()/CSS color functions — so "muted white on
    // a dark hero surface" is a real blended hex, not an alpha channel.
    muted: isHero ? mixHex('#FFFFFF', theme.heroBg, 0.35) : theme.textMuted,
    accent: theme.accent,
    accentBadge: theme.accentBadge || theme.accent,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
    displayFontWeight: theme.displayWeight === 'light' ? '300' : '900',
  };
}

function toPosterPalette(surface: Surface): PosterPalette {
  return { accent: surface.accent, accentBadge: surface.accentBadge, textPrimary: surface.fg, fontHeading: surface.fontHeading };
}

/** Font-matching params for estimateTextHeight/autoFitFontSize — must
 * mirror whatever the corresponding mkText() below actually sets, or the
 * measurement is for the wrong glyphs (see typography.ts). Covers the
 * two recurring shapes: a bold heading-font line, and a body-font
 * paragraph at its default (non-bold) weight. */
function headingFont(surface: Surface, fontWeight: string = '800') {
  return { fontFamily: surface.fontHeading, fontWeight };
}
function bodyFont(surface: Surface) {
  return { fontFamily: surface.fontBody };
}

/** A slide is composed on the hero (dark, high-energy) surface when it's the
 * title slide or a standalone quote — every other slide sits on the shared
 * canvas surface. This mirrors the two-tone rhythm every sample deck uses. */
export function isHeroSurface(content: SlideContent): boolean {
  return content.isTitleSlide || Boolean(content.quote);
}

/** Small "[ EYEBROW ]" + "0N / TOTAL" header row shared by every non-title,
 * non-quote regime. Returns the elements and the y-coordinate content
 * should continue from. */
function composeHeaderRow(box: Box, content: SlideContent, surface: Surface, z: number) {
  const elements: SlideElement[] = [];
  const rowHeight = Math.round(baseBodySize() * 1.7);

  if (content.eyebrow) {
    elements.push(
      mkText({
        x: box.x,
        y: box.y,
        width: Math.round(box.width * 0.7),
        height: rowHeight,
        text: `[ ${content.eyebrow.toUpperCase()} ]`,
        fontSize: Math.round(baseBodySize() * 0.72),
        fontWeight: '700',
        color: surface.accent,
        letterSpacing: 2,
        verticalAlign: 'middle',
        zIndex: z,
      })
    );
  }

  elements.push(
    mkText({
      x: box.x + Math.round(box.width * 0.7),
      y: box.y,
      width: Math.round(box.width * 0.3),
      height: rowHeight,
      text: `[ ${String(content.index).padStart(2, '0')} / ${String(content.total).padStart(2, '0')} ]`,
      fontSize: Math.round(baseBodySize() * 0.62),
      fontWeight: '600',
      color: surface.muted,
      align: 'right',
      letterSpacing: 1.5,
      verticalAlign: 'middle',
      zIndex: z,
    })
  );

  return { elements, contentY: box.y + rowHeight + Math.round(stackGap() * 0.6) };
}

function composeAccentDivider(x: number, y: number, surface: Surface, z: number, width: number = 96): SlideElement {
  return mkShape({
    x,
    y,
    width,
    height: Math.max(3, Math.round(CANVAS_H * 0.0028)),
    shapeType: 'roundRect',
    fillColor: surface.accent,
    borderRadius: 4,
    zIndex: z,
  });
}

function composeIconBadge(box: Box, content: SlideContent, surface: Surface, z: number): SlideElement[] {
  if (!content.iconSvgData) return [];
  const size = Math.round(baseBodySize() * 2.4);
  return [
    mkIcon({
      x: box.x + box.width - size,
      y: box.y,
      width: size,
      height: size,
      iconName: 'icon',
      svgData: content.iconSvgData,
      isIconify: true,
      color: surface.accent,
      zIndex: z,
    }),
  ];
}

// ---------------------------------------------------------------------------
// Regime: TITLE — the deck's opening monumental poster slide.
// ---------------------------------------------------------------------------
function composeTitle(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = generateAmbientBlobs(toPosterPalette(surface), content.index, 0);
  let z = 1;

  if (content.eyebrow) {
    const badgeW = Math.round(baseBodySize() * 14);
    elements.push(
      mkShape({
        x: box.x,
        y: box.y,
        width: badgeW,
        height: Math.round(baseBodySize() * 2.2),
        shapeType: 'pill',
        fillColor: surface.accentBadge,
        borderRadius: 999,
        zIndex: z,
      })
    );
    elements.push(
      mkText({
        x: box.x,
        y: box.y,
        width: badgeW,
        height: Math.round(baseBodySize() * 2.2),
        text: `[ ${content.eyebrow.toUpperCase()} ]`,
        fontSize: Math.round(baseBodySize() * 0.68),
        fontWeight: '800',
        color: '#080E1E',
        align: 'center',
        verticalAlign: 'middle',
        letterSpacing: 2,
        zIndex: z + 1,
      })
    );
  }

  elements.push(
    mkText({
      x: box.x + Math.round(box.width * 0.66),
      y: box.y,
      width: Math.round(box.width * 0.34),
      height: Math.round(baseBodySize() * 2.2),
      text: `[ ${content.total} SLIDE BRIEF ]`,
      fontSize: Math.round(baseBodySize() * 0.62),
      fontWeight: '600',
      color: surface.muted,
      align: 'right',
      verticalAlign: 'middle',
      letterSpacing: 1.5,
      zIndex: z,
    })
  );
  z += 2;

  // Vertically centered focal headline + optional body, sized to the content.
  const focalWidth = Math.round(box.width * 0.78);
  const focalHeightBudget = Math.round(box.height * 0.46);
  const titleFont = { fontFamily: surface.fontHeading, fontWeight: surface.displayFontWeight, letterSpacing: surface.displayFontWeight === '300' ? 0 : -2 };
  const titleSize = autoFitFontSize(content.headline, focalWidth, focalHeightBudget, {
    maxSize: Math.round(baseTitleSize() * 1.75),
    minSize: Math.round(baseTitleSize() * 0.85),
    lineHeightRatio: 0.94,
    ...titleFont,
  });
  const titleHeight = estimateTextHeight(content.headline, titleSize, focalWidth, 0.94, titleFont);
  const focalY = box.y + Math.round((box.height - titleHeight) * 0.42);

  elements.push(
    mkText({
      x: box.x,
      y: focalY,
      width: focalWidth,
      height: titleHeight,
      text: content.headline,
      fontSize: titleSize,
      fontFamily: surface.fontHeading,
      fontWeight: surface.displayFontWeight,
      color: surface.fg,
      lineHeight: 0.94,
      letterSpacing: surface.displayFontWeight === '300' ? 0 : -2,
      zIndex: z,
    })
  );

  let cursorY = focalY + titleHeight + Math.round(stackGap() * 0.7);
  elements.push(composeAccentDivider(box.x, cursorY, surface, z + 1, Math.round(box.width * 0.09)));
  cursorY += Math.round(stackGap() * 0.9);

  // Footer sits at a fixed offset from the box bottom regardless of how
  // tall the title/body above it turned out to be, so — same as every
  // other regime's body text — it's clamped to whatever room is actually
  // left above the footer rather than its full natural height. Belt and
  // suspenders alongside accurate title-height measurement above: that
  // fix is what keeps titleHeight (and so cursorY) honest in the first
  // place, this is what keeps an unusually long body from re-creating
  // the same collision on its own.
  const footerY = box.y + box.height - Math.round(baseBodySize() * 1.8);
  if (content.body) {
    const bodyWidth = Math.round(box.width * 0.62);
    const bodySize = Math.round(baseBodySize() * 1.35);
    const remainingHeight = footerY - Math.round(stackGap() * 0.5) - cursorY;
    const bodyHeight = Math.min(Math.max(20, remainingHeight), estimateTextHeight(content.body, bodySize, bodyWidth, 1.6, { fontFamily: surface.fontBody }));
    elements.push(
      mkText({
        x: box.x,
        y: cursorY,
        width: bodyWidth,
        height: bodyHeight,
        text: content.body,
        fontSize: bodySize,
        fontFamily: surface.fontBody,
        color: surface.muted,
        lineHeight: 1.6,
        zIndex: z,
      })
    );
  }

  // Footer rule + author credit line.
  elements.push(
    mkShape({
      x: box.x,
      y: footerY,
      width: box.width,
      height: 1,
      shapeType: 'line',
      fillColor: '#FFFFFF',
      opacity: 0.15,
      zIndex: 1,
    })
  );
  elements.push(
    mkText({
      x: box.x,
      y: footerY + Math.round(baseBodySize() * 0.5),
      width: box.width,
      height: Math.round(baseBodySize() * 1.2),
      text: `SLIDE ${content.index} OF ${content.total}`,
      fontSize: Math.round(baseBodySize() * 0.65),
      fontWeight: '600',
      color: surface.muted,
      letterSpacing: 2,
      verticalAlign: 'middle',
      zIndex: 1,
    })
  );

  return elements;
}

// ---------------------------------------------------------------------------
// Regime: QUOTE — a standalone, centered editorial breather.
// ---------------------------------------------------------------------------
function composeQuote(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = generateAmbientBlobs(toPosterPalette(surface), content.index, 0);
  const quoteWidth = Math.round(box.width * 0.74);
  const quoteX = box.x + Math.round((box.width - quoteWidth) / 2);
  let cursorY = box.y + Math.round(box.height * 0.12);

  if (content.eyebrow) {
    elements.push(
      mkText({
        x: box.x,
        y: cursorY,
        width: box.width,
        height: Math.round(baseBodySize() * 2),
        text: `[ ${content.eyebrow.toUpperCase()} ]`,
        fontSize: Math.round(baseBodySize() * 0.75),
        fontWeight: '700',
        color: surface.fg,
        align: 'center',
        verticalAlign: 'middle',
        letterSpacing: 2.5,
        zIndex: 1,
      })
    );
    cursorY += Math.round(baseBodySize() * 2.4);
  }

  // A real collision here (found by a broader sweep, not one of the
  // originally-reported bugs, but the same class): mkText()'s default
  // lineHeight is 1.4, so this glyph's *real* rendered box was
  // glyphSize*1.4 tall while its declared `height` was only glyphSize —
  // and the cursor was then advanced by an unrelated fixed fraction
  // (glyphSize*0.72) instead of either figure, landing well short of
  // where the glyph actually ends and letting the quote text start
  // overlapping its tail. lineHeight:1 makes a single big glyph's
  // declared height and real height the same number, so advancing by
  // that height is now exactly correct instead of a guess.
  const glyphSize = Math.round(baseTitleSize() * 1.15);
  elements.push(
    mkText({
      x: box.x,
      y: cursorY,
      width: box.width,
      height: glyphSize,
      text: '“',
      fontSize: glyphSize,
      fontFamily: surface.fontHeading,
      fontWeight: '700',
      color: surface.accent,
      align: 'center',
      lineHeight: 1,
      opacity: 0.45,
      zIndex: 1,
    })
  );
  cursorY += glyphSize;

  const quoteText = content.quote!.text.replace(/^["“]|["”]$/g, '');
  const quoteHeightBudget = Math.round(box.height * 0.4);
  const quoteFont = { fontFamily: surface.fontHeading, fontStyle: 'italic' as const, fontWeight: '600' };
  const quoteSize = autoFitFontSize(quoteText, quoteWidth, quoteHeightBudget, {
    maxSize: Math.round(baseTitleSize() * 0.62),
    minSize: Math.round(baseBodySize() * 1.6),
    lineHeightRatio: 1.28,
    ...quoteFont,
  });
  const quoteHeight = estimateTextHeight(quoteText, quoteSize, quoteWidth, 1.28, quoteFont);
  elements.push(
    mkText({
      x: quoteX,
      y: cursorY,
      width: quoteWidth,
      height: quoteHeight,
      text: quoteText,
      fontSize: quoteSize,
      fontFamily: surface.fontHeading,
      fontStyle: 'italic',
      fontWeight: '600',
      color: surface.fg,
      align: 'center',
      lineHeight: 1.28,
      zIndex: 1,
    })
  );
  cursorY += quoteHeight + Math.round(stackGap());

  const dividerWidth = Math.round(box.width * 0.08);
  elements.push(composeAccentDivider(box.x + Math.round((box.width - dividerWidth) / 2), cursorY, surface, 1, dividerWidth));
  cursorY += Math.round(stackGap() * 0.8);

  if (content.quote?.author) {
    elements.push(
      mkText({
        x: box.x,
        y: cursorY,
        width: box.width,
        height: Math.round(baseBodySize() * 1.6),
        text: content.quote.author,
        fontSize: Math.round(baseBodySize() * 0.85),
        fontWeight: '700',
        color: surface.accentBadge,
        align: 'center',
        letterSpacing: 2.5,
        zIndex: 1,
      })
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Regime: MEDIA_SPLIT — the user's own uploaded asset paired with narrative.
// ---------------------------------------------------------------------------
function composeMediaSplit(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = [];
  const imageFirst = content.index % 2 === 0;
  const { media, text: textBox } = splitBox(box, imageFirst);

  elements.push(
    mkImage({
      x: media.x,
      y: media.y,
      width: media.width,
      height: media.height,
      src: content.imageUrl!,
      shadow: true,
      borderRadius: 16,
      zIndex: 1,
    })
  );
  elements.push(
    mkText({
      x: media.x + Math.round(baseBodySize()),
      y: media.y + media.height - Math.round(baseBodySize() * 2.2),
      width: media.width - Math.round(baseBodySize() * 2),
      height: Math.round(baseBodySize() * 1.8),
      text: `[ FIG ${String(content.index).padStart(2, '0')} • USER ATTACHED ASSET ]`,
      fontSize: Math.round(baseBodySize() * 0.62),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 1.5,
      verticalAlign: 'middle',
      zIndex: 2,
    })
  );

  const header = composeHeaderRow(textBox, content, surface, 1);
  elements.push(...header.elements, ...composeIconBadge(textBox, content, surface, 1));

  const headlineWidth = textBox.width;
  const headlineBudget = Math.round(box.height * 0.32);
  const headlineSize = autoFitFontSize(content.headline, headlineWidth, headlineBudget, {
    maxSize: Math.round(baseTitleSize() * 0.62),
    minSize: Math.round(baseTitleSize() * 0.34),
    lineHeightRatio: 1.15,
    ...headingFont(surface),
  });
  const headlineHeight = estimateTextHeight(content.headline, headlineSize, headlineWidth, 1.15, headingFont(surface));
  elements.push(
    mkText({
      x: textBox.x,
      y: header.contentY,
      width: headlineWidth,
      height: headlineHeight,
      text: content.headline,
      fontSize: headlineSize,
      fontFamily: surface.fontHeading,
      fontWeight: '800',
      color: surface.fg,
      lineHeight: 1.15,
      zIndex: 2,
    })
  );

  let cursorY = header.contentY + headlineHeight + Math.round(stackGap() * 0.7);
  elements.push(composeAccentDivider(textBox.x, cursorY, surface, 2, Math.round(headlineWidth * 0.12)));
  cursorY += Math.round(stackGap() * 0.85);

  if (content.body) {
    const bodySize = Math.round(baseBodySize() * 1.15);
    const remainingHeight = box.y + box.height - cursorY;
    const bodyHeight = Math.min(remainingHeight, estimateTextHeight(content.body, bodySize, headlineWidth, 1.7, bodyFont(surface)));
    elements.push(
      mkText({
        x: textBox.x,
        y: cursorY,
        width: headlineWidth,
        height: bodyHeight,
        text: content.body,
        fontSize: bodySize,
        fontFamily: surface.fontBody,
        color: surface.muted,
        lineHeight: 1.7,
        zIndex: 2,
      })
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Regime: STAT — a single dominant metric paired with narrative context.
// ---------------------------------------------------------------------------
function composeStat(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = generateAmbientBlobs(toPosterPalette(surface), content.index, 0);
  const [leftBox, rightBox] = computeGrid(2, box, 2);

  elements.push(
    mkText({
      x: leftBox.x,
      y: leftBox.y,
      width: leftBox.width,
      height: Math.round(baseBodySize() * 1.8),
      text: '[ VERIFIED BENCHMARK ]',
      fontSize: Math.round(baseBodySize() * 0.7),
      fontWeight: '700',
      color: surface.accent,
      letterSpacing: 2,
      zIndex: 1,
    })
  );

  const statValue = content.stat!.value;
  const statFont = { fontFamily: surface.fontHeading, fontWeight: surface.displayFontWeight, letterSpacing: surface.displayFontWeight === '300' ? 0 : -3 };
  const statSize = autoFitFontSize(statValue, leftBox.width, Math.round(leftBox.height * 0.42), {
    maxSize: Math.round(baseTitleSize() * 2.2),
    minSize: Math.round(baseTitleSize() * 1.1),
    lineHeightRatio: 0.95,
    ...statFont,
  });
  const statY = leftBox.y + Math.round(baseBodySize() * 2.3);
  const statHeight = estimateTextHeight(statValue, statSize, leftBox.width, 0.95, statFont);
  elements.push(
    mkText({
      x: leftBox.x,
      y: statY,
      width: leftBox.width,
      height: statHeight,
      text: statValue,
      fontSize: statSize,
      fontFamily: surface.fontHeading,
      fontWeight: surface.displayFontWeight,
      color: surface.accent,
      lineHeight: 0.95,
      letterSpacing: surface.displayFontWeight === '300' ? 0 : -3,
      zIndex: 2,
    })
  );

  let leftCursorY = statY + statHeight + Math.round(stackGap() * 0.6);
  if (content.stat!.label) {
    elements.push(
      mkText({
        x: leftBox.x,
        y: leftCursorY,
        width: leftBox.width,
        height: Math.round(baseBodySize() * 1.8),
        text: content.stat!.label!.toUpperCase(),
        fontSize: Math.round(baseBodySize() * 1.05),
        fontWeight: '700',
        color: surface.fg,
        letterSpacing: 1.5,
        zIndex: 2,
      })
    );
    leftCursorY += Math.round(baseBodySize() * 2.1);
  }
  if (content.body) {
    const bodySize = Math.round(baseBodySize() * 0.9);
    const bodyHeight = Math.min(leftBox.y + leftBox.height - leftCursorY, estimateTextHeight(content.body, bodySize, leftBox.width, 1.6, bodyFont(surface)));
    elements.push(
      mkText({
        x: leftBox.x,
        y: leftCursorY,
        width: leftBox.width,
        height: bodyHeight,
        text: content.body,
        fontSize: bodySize,
        fontFamily: surface.fontBody,
        color: surface.muted,
        lineHeight: 1.6,
        zIndex: 2,
      })
    );
  }

  const header = composeHeaderRow(rightBox, content, surface, 1);
  elements.push(...header.elements, ...composeIconBadge(rightBox, content, surface, 1));

  const headlineBudget = Math.round(box.height * 0.3);
  const headlineSize = autoFitFontSize(content.headline, rightBox.width, headlineBudget, {
    maxSize: Math.round(baseTitleSize() * 0.6),
    minSize: Math.round(baseTitleSize() * 0.32),
    lineHeightRatio: 1.15,
    ...headingFont(surface),
  });
  const headlineHeight = estimateTextHeight(content.headline, headlineSize, rightBox.width, 1.15, headingFont(surface));
  elements.push(
    mkText({
      x: rightBox.x,
      y: header.contentY,
      width: rightBox.width,
      height: headlineHeight,
      text: content.headline,
      fontSize: headlineSize,
      fontFamily: surface.fontHeading,
      fontWeight: '800',
      color: surface.fg,
      lineHeight: 1.15,
      zIndex: 2,
    })
  );

  return elements;
}

// ---------------------------------------------------------------------------
// Regime: GRID — three or more parallel points flow into an N-up grid whose
// column count and card size are computed from the actual bullet count.
// ---------------------------------------------------------------------------
function composeGrid(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = generateAmbientBlobs(toPosterPalette(surface), content.index, 0);
  const header = composeHeaderRow(box, content, surface, 1);
  elements.push(...header.elements, ...composeIconBadge(box, content, surface, 1));

  const headlineBudget = Math.round(box.height * 0.16);
  const headlineSize = autoFitFontSize(content.headline, Math.round(box.width * 0.7), headlineBudget, {
    maxSize: Math.round(baseTitleSize() * 0.5),
    minSize: Math.round(baseTitleSize() * 0.3),
    lineHeightRatio: 1.15,
    ...headingFont(surface),
  });
  const headlineHeight = estimateTextHeight(content.headline, headlineSize, Math.round(box.width * 0.7), 1.15, headingFont(surface));
  elements.push(
    mkText({
      x: box.x,
      y: header.contentY,
      width: Math.round(box.width * 0.7),
      height: headlineHeight,
      text: content.headline,
      fontSize: headlineSize,
      fontFamily: surface.fontHeading,
      fontWeight: '800',
      color: surface.fg,
      lineHeight: 1.15,
      zIndex: 2,
    })
  );

  const gridTop = header.contentY + headlineHeight + Math.round(stackGap() * 1.3);
  const gridBox: Box = { x: box.x, y: gridTop, width: box.width, height: box.y + box.height - gridTop };

  const cardPad = Math.round(baseBodySize() * 1.2);
  const pillSize = Math.round(baseBodySize() * 2.1);
  const cardTitleSize = Math.round(baseBodySize() * 1.15);
  const descMaxSize = Math.round(baseBodySize() * 0.95);
  const descMinSize = Math.round(baseBodySize() * 0.6);

  // Cards are sized to what their own content actually needs, not
  // stretched to fill whatever vertical space the grid box happens to
  // have (that was the "cards stretch across the full canvas height
  // with big empty voids" bug — a 1-row grid always got the box's
  // entire height regardless of how little text was in it). Every card
  // in the grid still shares one uniform height for visual alignment —
  // it's just sized off the *tallest* card's real content instead of
  // off the box.
  const cols = Math.max(1, Math.min(4, content.bullets.length));
  const rows = Math.ceil(content.bullets.length / cols);
  const gutter = columnGutter();
  const colWidth = (gridBox.width - gutter * (cols - 1)) / cols;
  const innerWidth = Math.round(colWidth) - cardPad * 2;
  const rowGutter = stackGap() * 1.5;
  const availableRowHeight = (gridBox.height - rowGutter * (rows - 1)) / rows;
  const pillBlockHeight = Math.round(pillSize * 0.62);

  const naturalCardHeights = content.bullets.map((bullet) => {
    let h = cardPad + pillBlockHeight + Math.round(stackGap() * 0.5);
    if (bullet.title) {
      h += estimateTextHeight(bullet.title, cardTitleSize, innerWidth, 1.25, headingFont(surface)) + Math.round(stackGap() * 0.35);
    }
    if (bullet.description) {
      h += estimateTextHeight(bullet.description, descMaxSize, innerWidth, 1.55, bodyFont(surface));
    }
    return h + cardPad;
  });
  const cardHeight = Math.min(Math.max(...naturalCardHeights), availableRowHeight);

  // Center the (now content-sized, not box-stretched) row block in the
  // remaining vertical space instead of pinning it to the top — otherwise
  // fixing the stretch just relocates the old "big empty void" from
  // inside the cards to a slab of dead space below them.
  const rowsBlockHeight = rows * cardHeight + (rows - 1) * rowGutter;
  const rowsTop = gridBox.y + Math.max(0, (gridBox.height - rowsBlockHeight) / 2);

  const cells: Box[] = content.bullets.map((_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      x: Math.round(gridBox.x + col * (colWidth + gutter)),
      y: Math.round(rowsTop + row * (cardHeight + rowGutter)),
      width: Math.round(colWidth),
      height: Math.round(cardHeight),
    };
  });

  content.bullets.forEach((bullet: SlideBullet, idx: number) => {
    const cell = cells[idx];
    elements.push(
      mkShape({
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        shapeType: 'roundRect',
        fillColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 16,
        zIndex: 1,
      })
    );

    elements.push(
      mkShape({
        x: cell.x + cardPad,
        y: cell.y + cardPad,
        width: pillSize,
        height: pillBlockHeight,
        shapeType: 'pill',
        fillColor: surface.accent,
        borderRadius: 999,
        zIndex: 2,
      })
    );
    elements.push(
      mkText({
        x: cell.x + cardPad,
        y: cell.y + cardPad,
        width: pillSize,
        height: pillBlockHeight,
        text: String(idx + 1).padStart(2, '0'),
        fontSize: Math.round(baseBodySize() * 0.85),
        fontWeight: '800',
        color: '#FFFFFF',
        align: 'center',
        verticalAlign: 'middle',
        zIndex: 3,
      })
    );

    let innerY = cell.y + cardPad + pillBlockHeight + Math.round(stackGap() * 0.5);

    if (bullet.title) {
      const titleHeight = estimateTextHeight(bullet.title, cardTitleSize, innerWidth, 1.25, headingFont(surface));
      elements.push(
        mkText({
          x: cell.x + cardPad,
          y: innerY,
          width: innerWidth,
          height: titleHeight,
          text: bullet.title,
          fontSize: cardTitleSize,
          fontFamily: surface.fontHeading,
          fontWeight: '800',
          color: '#0F172A',
          lineHeight: 1.25,
          zIndex: 2,
        })
      );
      innerY += titleHeight + Math.round(stackGap() * 0.35);
    }

    if (bullet.description) {
      const remainingHeight = cell.y + cell.height - innerY - cardPad;
      const descSize = autoFitFontSize(bullet.description, innerWidth, Math.max(20, remainingHeight), {
        maxSize: descMaxSize,
        minSize: descMinSize,
        lineHeightRatio: 1.55,
        ...bodyFont(surface),
      });
      elements.push(
        mkText({
          x: cell.x + cardPad,
          y: innerY,
          width: innerWidth,
          height: Math.max(20, remainingHeight),
          text: bullet.description,
          fontSize: descSize,
          fontFamily: surface.fontBody,
          color: '#64748B',
          lineHeight: 1.55,
          zIndex: 2,
        })
      );
    }
  });

  return elements;
}

// ---------------------------------------------------------------------------
// Regime: TYPOGRAPHIC — headline + prose only. No image, no stat, no list:
// the content itself becomes the graphic via bold auto-fit type, paired
// with a generated abstract poster flourish (never a stock photo).
// ---------------------------------------------------------------------------
function composeTypographic(content: SlideContent, box: Box, surface: Surface): SlideElement[] {
  const elements: SlideElement[] = [];
  const graphicFirst = content.index % 2 === 0;
  const { media: graphicBox, text: textBox } = splitBox(box, graphicFirst);

  elements.push(...generatePosterGraphic(graphicBox, toPosterPalette(surface), content.index, !graphicFirst, 0));

  const header = composeHeaderRow(textBox, content, surface, 1);
  elements.push(...header.elements, ...composeIconBadge(textBox, content, surface, 1));

  const typographicHeadlineFont = {
    fontFamily: surface.fontHeading,
    fontWeight: surface.displayFontWeight,
    letterSpacing: surface.displayFontWeight === '300' ? 0 : -1.5,
  };
  const headlineBudget = Math.round(box.height * 0.42);
  const headlineSize = autoFitFontSize(content.headline, textBox.width, headlineBudget, {
    maxSize: Math.round(baseTitleSize() * 1.3),
    minSize: Math.round(baseTitleSize() * 0.5),
    lineHeightRatio: 1.02,
    ...typographicHeadlineFont,
  });
  const headlineHeight = estimateTextHeight(content.headline, headlineSize, textBox.width, 1.02, typographicHeadlineFont);
  elements.push(
    mkText({
      x: textBox.x,
      y: header.contentY,
      width: textBox.width,
      height: headlineHeight,
      text: content.headline,
      fontSize: headlineSize,
      fontFamily: surface.fontHeading,
      fontWeight: surface.displayFontWeight,
      color: surface.fg,
      lineHeight: 1.02,
      letterSpacing: surface.displayFontWeight === '300' ? 0 : -1.5,
      zIndex: 2,
    })
  );

  let cursorY = header.contentY + headlineHeight + Math.round(stackGap() * 0.7);
  elements.push(composeAccentDivider(textBox.x, cursorY, surface, 2, Math.round(textBox.width * 0.14)));
  cursorY += Math.round(stackGap() * 0.85);

  if (content.body) {
    const bodySize = Math.round(baseBodySize() * 1.2);
    const remainingHeight = box.y + box.height - cursorY;
    const bodyHeight = Math.min(remainingHeight, estimateTextHeight(content.body, bodySize, textBox.width, 1.7, bodyFont(surface)));
    elements.push(
      mkText({
        x: textBox.x,
        y: cursorY,
        width: textBox.width,
        height: bodyHeight,
        text: content.body,
        fontSize: bodySize,
        fontFamily: surface.fontBody,
        color: surface.muted,
        lineHeight: 1.7,
        zIndex: 2,
      })
    );
  }

  return elements;
}

/**
 * Compose the full element scene graph for one slide of content. This is
 * the only place layout decisions are made — the resulting SlideElement[]
 * is consumed identically by the live canvas renderer and the PPTX
 * exporter, so whatever regime is chosen here renders 1:1 in both.
 */
export function composeSlide(content: SlideContent, theme: ThemeTokens): SlideElement[] {
  const box = getContentBox();
  const surface = resolveSurface(theme, isHeroSurface(content));

  if (content.isTitleSlide) return composeTitle(content, box, surface);
  if (content.quote) return composeQuote(content, box, surface);
  if (content.imageUrl) return composeMediaSplit(content, box, surface);
  if (content.stat) return composeStat(content, box, surface);
  if (content.bullets.length >= 2) return composeGrid(content, box, surface);
  return composeTypographic(content, box, surface);
}
