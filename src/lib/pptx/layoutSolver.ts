import { SlideElement } from '../../types/slide';
import { AISlideItem, AIPresentationTheme } from '../../types/llm';
import { ThemeTokens, resolveThemeTokens } from '../design/tokens';
import { SlideNode, convertAISlideToSlideNode } from '../engine/types';

export interface GridDimensions {
  slideWidth: number;
  slideHeight: number;
  marginX: number;
  marginY: number;
  contentWidth: number;
  contentHeight: number;
  columns: number;
  gutter: number;
  colWidth: number;
}

export const CANVAS_GRID: GridDimensions = {
  slideWidth: 1920,
  slideHeight: 1080,
  marginX: 120,
  marginY: 100,
  contentWidth: 1680,
  contentHeight: 880,
  columns: 12,
  gutter: 32,
  colWidth: (1680 - 11 * 32) / 12,
};

export function estimateTextHeight(
  text: string,
  fontSize: number,
  containerWidth: number,
  lineHeightRatio: number = 1.4
): number {
  if (!text) return 40;
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(15, Math.floor(containerWidth / avgCharWidth));
  
  const paragraphs = text.split('\n');
  let totalLines = 0;

  paragraphs.forEach((p) => {
    if (p.trim().length === 0) {
      totalLines += 0.5;
    } else {
      totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
    }
  });

  return Math.ceil(totalLines * fontSize * lineHeightRatio) + 16;
}

/**
 * Solve Slide Elements directly from an AST SlideNode
 */
export function solveASTSlideLayout(
  node: SlideNode,
  theme: ThemeTokens | AIPresentationTheme,
  slideIndex: number = 1
): SlideElement[] {
  const dummySlide: AISlideItem = {
    archetype: (node.intent === 'HERO_STATEMENT' ? 'COVER' :
      node.intent === 'EDITORIAL_QUOTE' ? 'PULL_QUOTE' :
      node.intent === 'DATA_DOMINANCE' ? 'BIG_STAT' :
      node.intent === 'HORIZONTAL_TIMELINE' ? 'PROCESS_GRID' :
      node.intent === 'MULTI_FACET_GRID' ? 'PROCESS_GRID' : 'TWO_TONE_SPLIT') as any,
    headline: node.focalBlock.content,
    body: node.focalBlock.secondary || '',
    subheading: node.subheading,
    author: node.author,
    statValue: node.intent === 'DATA_DOMINANCE' ? node.focalBlock.content : undefined,
    statLabel: node.focalBlock.metric,
    points: node.supportingBlocks.map((b) => b.title ? `${b.title}: ${b.description}` : b.description),
    imageKeywords: '',
    iconName: node.iconName || 'sparkles',
  };

  return solve12ColumnSlideLayout(dummySlide, theme, node.userAssetUrl || '', '', slideIndex);
}

/**
 * 12-Column Layout Solver & 10x Canva Energy Poster Assembler
 * Produces native Canva PPTX elements bound to Cobalt Kinetic ThemeTokens.
 */
export function solve12ColumnSlideLayout(
  slide: AISlideItem,
  theme: ThemeTokens | AIPresentationTheme,
  imageUrl: string = '',
  iconSvgData: string = '',
  slideIndex: number = 1
): SlideElement[] {
  const now = Date.now();
  const elements: SlideElement[] = [];

  const t = resolveThemeTokens(theme);
  const accentBadgeBg = t.accentBadge || '#E6FF00';
  const sidebarBgColor = t.sidebarBg || '#0B132B';
  const accentColor = t.accent || '#004BFE';

  const cleanHeadline = slide.headline || '';
  const cleanBody = slide.body || '';
  const cleanSub = (slide.subheading || `SECTION 0${slideIndex}`).toUpperCase();

  const rawArchetype = (slide.archetype || 'TWO_TONE_SPLIT').toUpperCase();

  const isCover =
    rawArchetype === 'COVER' ||
    rawArchetype === 'COVER_TITLE' ||
    rawArchetype === 'HERO_MINIMAL' ||
    slideIndex === 1;

  const isSplit =
    !isCover &&
    (rawArchetype === 'TWO_TONE_SPLIT' ||
      rawArchetype === 'PHOTO_SPLIT' ||
      rawArchetype === 'EDITORIAL_SPLIT' ||
      rawArchetype === 'SPLIT_EDITORIAL' ||
      rawArchetype === 'SHOWCASE_FOCUS');

  const isStat =
    !isCover &&
    !isSplit &&
    (rawArchetype === 'BIG_STAT' ||
      rawArchetype === 'BIG_STAT_HERO' ||
      rawArchetype === 'STAT_IMPACT' ||
      Boolean(slide.statValue));

  const isProcessGrid =
    !isCover &&
    !isSplit &&
    !isStat &&
    (rawArchetype === 'PROCESS_GRID' ||
      rawArchetype === 'TIMELINE_LIST' ||
      rawArchetype === 'THREE_PART_FLOW' ||
      rawArchetype === 'DATA_GRID' ||
      rawArchetype === 'THREE_COLUMN_INSIGHTS' ||
      rawArchetype === 'COMPARISON_GRID' ||
      rawArchetype === 'STORY_2_COLUMN' ||
      rawArchetype === 'TIMELINE_NARRATIVE' ||
      (slide.points && slide.points.length >= 3));

  const isQuote =
    !isCover &&
    !isSplit &&
    !isStat &&
    !isProcessGrid &&
    (rawArchetype === 'PULL_QUOTE' ||
      rawArchetype === 'MINIMAL_QUOTE' ||
      rawArchetype === 'QUOTE_EDITORIAL' ||
      Boolean(slide.author));

  // =========================================================================
  // 1. COVER SLIDE: MONUMENTAL HIGH-ENERGY POSTER (theme.heroBg & textHero)
  // =========================================================================
  if (isCover) {
    // Top Acid Lemon Pill Badge
    elements.push({
      id: `el-${now}-badge-pill`,
      type: 'shape',
      shapeType: 'pill',
      x: 140,
      y: 120,
      width: 320,
      height: 44,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      fillColor: accentBadgeBg,
      fillOpacity: 1,
      borderColor: accentBadgeBg,
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 22,
    });

    elements.push({
      id: `el-${now}-eyebrow`,
      type: 'text',
      x: 160,
      y: 124,
      width: 280,
      height: 36,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: `[ ${slide.subheading || '2026 RESEARCH EDITION ↗'} ]`,
      fontSize: 13,
      fontFamily: t.fontBody,
      fontWeight: '800',
      color: '#080E1E',
      align: 'center',
      verticalAlign: 'middle',
      letterSpacing: 2,
    });

    // Top Right Monograph Stamp
    elements.push({
      id: `el-${now}-mono-idx`,
      type: 'text',
      x: 1300,
      y: 124,
      width: 480,
      height: 36,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: `[ MONOGRAPH 0${slideIndex} ]`,
      fontSize: 14,
      fontFamily: t.fontBody,
      fontWeight: '600',
      color: '#94A3B8',
      align: 'right',
      verticalAlign: 'middle',
      letterSpacing: 2,
    });

    // Top Hairline Divider
    elements.push({
      id: `el-${now}-top-line`,
      type: 'shape',
      shapeType: 'line',
      x: 140,
      y: 185,
      width: 1640,
      height: 1,
      rotation: 0,
      opacity: 0.6,
      zIndex: 1,
      fillColor: 'rgba(255, 255, 255, 0.15)',
      fillOpacity: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 0,
    });

    // Massive 88px Bold Display Headline: text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]
    const headlineH = estimateTextHeight(cleanHeadline, 88, 1400, 0.9);
    elements.push({
      id: `el-${now}-headline`,
      type: 'text',
      x: 140,
      y: 280,
      width: 1400,
      height: headlineH,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: cleanHeadline,
      fontSize: 88,
      fontFamily: t.fontHeading,
      fontWeight: '900',
      color: '#FFFFFF',
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 0.9,
      letterSpacing: -3,
    });

    // Glowing Accent Divider
    const divY = 280 + headlineH + 28;
    elements.push({
      id: `el-${now}-accent-line`,
      type: 'shape',
      shapeType: 'line',
      x: 140,
      y: divY,
      width: 180,
      height: 5,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      fillColor: accentColor,
      fillOpacity: 1,
      borderColor: accentColor,
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 2.5,
    });

    // Subtitle Narrative Prose
    if (cleanBody) {
      const bodyY = divY + 36;
      const bodyH = estimateTextHeight(cleanBody, 22, 1200, 1.65);
      elements.push({
        id: `el-${now}-body`,
        type: 'text',
        x: 140,
        y: bodyY,
        width: 1200,
        height: bodyH,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: cleanBody,
        fontSize: 22,
        fontFamily: t.fontBody,
        fontWeight: '400',
        color: '#CBD5E1',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.65,
      });
    }

    // Editorial Author Footer Line
    elements.push({
      id: `el-${now}-foot-line`,
      type: 'shape',
      shapeType: 'line',
      x: 140,
      y: 950,
      width: 1640,
      height: 1,
      rotation: 0,
      opacity: 0.6,
      zIndex: 1,
      fillColor: 'rgba(255, 255, 255, 0.15)',
      fillOpacity: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 0,
    });

    // Editorial Author Footer Text
    elements.push({
      id: `el-${now}-credit`,
      type: 'text',
      x: 140,
      y: 970,
      width: 1640,
      height: 30,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: slide.author
        ? `AUTHOR: ${slide.author}   •   CONFIDENTIAL & PROPRIETARY   •   © 2026 ALL RIGHTS RESERVED`
        : 'CONFIDENTIAL & PROPRIETARY   •   © 2026 ALL RIGHTS RESERVED',
      fontSize: 13,
      fontFamily: t.fontBody,
      fontWeight: '600',
      color: '#94A3B8',
      align: 'left',
      verticalAlign: 'middle',
      letterSpacing: 2,
    });

    return elements;
  }

  // =========================================================================
  // 2. TWO_TONE_SPLIT: SOLID NAVY LEFT 35% vs CRISP WHITE RIGHT 65%
  // =========================================================================
  if (isSplit) {
    if (imageUrl) {
      // With User Image: Left 45% Framed Image
      elements.push({
        id: `el-${now}-img`,
        type: 'image',
        x: 100,
        y: 140,
        width: 760,
        height: 800,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        src: imageUrl,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        objectFit: 'cover',
        shadow: true,
      });

      // Caption Tag on User Image
      elements.push({
        id: `el-${now}-img-tag`,
        type: 'text',
        x: 140,
        y: 880,
        width: 680,
        height: 36,
        rotation: 0,
        opacity: 0.95,
        zIndex: 3,
        text: `[ FIG 0${slideIndex} // USER ATTACHED ASSET ]`,
        fontSize: 13,
        fontFamily: t.fontBody,
        fontWeight: '700',
        color: '#FFFFFF',
        align: 'left',
        verticalAlign: 'middle',
        letterSpacing: 2,
      });

      // Right 55% Content
      const rightX = 940;
      const rightW = 840;
      let rightY = 240;

      // Eyebrow
      elements.push({
        id: `el-${now}-eyebrow`,
        type: 'text',
        x: rightX,
        y: rightY,
        width: rightW,
        height: 32,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: `[ ${cleanSub || `SECTION 0${slideIndex}`} ]`,
        fontSize: 14,
        fontFamily: t.fontBody,
        fontWeight: '700',
        color: accentColor,
        align: 'left',
        verticalAlign: 'middle',
        letterSpacing: 2.5,
      });
      rightY += 46;

      // Headline
      const headlineH = estimateTextHeight(cleanHeadline, 46, rightW, 1.15);
      elements.push({
        id: `el-${now}-headline`,
        type: 'text',
        x: rightX,
        y: rightY,
        width: rightW,
        height: headlineH,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: cleanHeadline,
        fontSize: 46,
        fontFamily: t.fontHeading,
        fontWeight: '800',
        color: '#0F172A',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.15,
      });
      rightY += headlineH + 24;

      // Accent Line
      elements.push({
        id: `el-${now}-line`,
        type: 'shape',
        shapeType: 'line',
        x: rightX,
        y: rightY,
        width: 100,
        height: 3,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        fillColor: accentColor,
        fillOpacity: 1,
        borderColor: accentColor,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 1.5,
      });
      rightY += 28;

      // Narrative Body
      if (cleanBody) {
        const bodyH = estimateTextHeight(cleanBody, 22, rightW, 1.75);
        elements.push({
          id: `el-${now}-body`,
          type: 'text',
          x: rightX,
          y: rightY,
          width: rightW,
          height: Math.min(500, bodyH),
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          text: cleanBody,
          fontSize: 22,
          fontFamily: t.fontBody,
          fontWeight: '400',
          color: '#64748B',
          align: 'left',
          verticalAlign: 'top',
          lineHeight: 1.75,
        });
      }
    } else {
      // Without User Image: Left 35% Solid Deep Navy (bg-[#0B132B] text-white)
      const sidebarW = 672;
      elements.push({
        id: `el-${now}-sidebar-bg`,
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: sidebarW,
        height: 1080,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        fillColor: sidebarBgColor,
        fillOpacity: 1,
        borderColor: '#1E293B',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 0,
      });

      // Sidebar Acid Lemon Pill
      elements.push({
        id: `el-${now}-sidebar-pill-bg`,
        type: 'shape',
        shapeType: 'pill',
        x: 80,
        y: 120,
        width: 220,
        height: 36,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        fillColor: accentBadgeBg,
        fillOpacity: 1,
        borderColor: accentBadgeBg,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 18,
      });

      elements.push({
        id: `el-${now}-sidebar-pill-text`,
        type: 'text',
        x: 80,
        y: 122,
        width: 220,
        height: 32,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        text: slide.subheading ? slide.subheading.toUpperCase() : 'KEY TAKEAWAYS',
        fontSize: 12,
        fontFamily: t.fontBody,
        fontWeight: '800',
        color: '#080E1E',
        align: 'center',
        verticalAlign: 'middle',
        letterSpacing: 2,
      });

      // Sidebar Highlights / Bullet Points
      const rawPoints = (slide.points && slide.points.length > 0)
        ? slide.points.slice(0, 3)
        : [];

      let sideY = 240;
      rawPoints.forEach((pt, pIdx) => {
        elements.push({
          id: `el-${now}-side-num-${pIdx}`,
          type: 'text',
          x: 80,
          y: sideY,
          width: 60,
          height: 30,
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          text: `0${pIdx + 1}.`,
          fontSize: 18,
          fontFamily: t.fontBody,
          fontWeight: '700',
          color: accentBadgeBg,
          align: 'left',
          verticalAlign: 'top',
        });

        elements.push({
          id: `el-${now}-side-desc-${pIdx}`,
          type: 'text',
          x: 140,
          y: sideY,
          width: 450,
          height: 90,
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          text: pt.replace(/^[•*-0-9.]+\s*/, ''),
          fontSize: 16,
          fontFamily: t.fontBody,
          fontWeight: '400',
          color: '#E2E8F0',
          align: 'left',
          verticalAlign: 'top',
          lineHeight: 1.5,
        });
        sideY += 120;
      });

      // Right 65% Main Content (Clean White Canvas)
      const rightX = 780;
      const rightW = 1000;
      let rightY = 220;

      // Eyebrow
      elements.push({
        id: `el-${now}-eyebrow`,
        type: 'text',
        x: rightX,
        y: rightY,
        width: rightW,
        height: 32,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: `[ ${cleanSub || `SECTION 0${slideIndex}`} ]`,
        fontSize: 14,
        fontFamily: t.fontBody,
        fontWeight: '700',
        color: accentColor,
        align: 'left',
        verticalAlign: 'middle',
        letterSpacing: 2.5,
      });
      rightY += 46;

      // Headline
      const headlineH = estimateTextHeight(cleanHeadline, 48, rightW, 1.15);
      elements.push({
        id: `el-${now}-headline`,
        type: 'text',
        x: rightX,
        y: rightY,
        width: rightW,
        height: headlineH,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: cleanHeadline,
        fontSize: 48,
        fontFamily: t.fontHeading,
        fontWeight: '800',
        color: '#0F172A',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.15,
      });
      rightY += headlineH + 28;

      // Accent Line
      elements.push({
        id: `el-${now}-line`,
        type: 'shape',
        shapeType: 'line',
        x: rightX,
        y: rightY,
        width: 120,
        height: 3,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        fillColor: accentColor,
        fillOpacity: 1,
        borderColor: accentColor,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 1.5,
      });
      rightY += 32;

      // Narrative Body
      if (cleanBody) {
        const bodyH = estimateTextHeight(cleanBody, 22, rightW, 1.75);
        elements.push({
          id: `el-${now}-body`,
          type: 'text',
          x: rightX,
          y: rightY,
          width: rightW,
          height: Math.min(500, bodyH),
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          text: cleanBody,
          fontSize: 22,
          fontFamily: t.fontBody,
          fontWeight: '400',
          color: '#64748B',
          align: 'left',
          verticalAlign: 'top',
          lineHeight: 1.75,
        });
      }
    }

    return elements;
  }

  // =========================================================================
  // 3. BIG_STAT: MONUMENTAL METRIC HERO (130px Electric Cobalt Stat)
  // =========================================================================
  if (isStat) {
    const statVal = slide.statValue || '68%';
    const statLab = (slide.statLabel || 'CORE PERFORMANCE MULTIPLIER').toUpperCase();

    // Left Column: Massive 130px Stat + 2-Line Summary
    const leftX = 140;
    const leftW = 760;
    let leftY = 220;

    // Category Badge
    elements.push({
      id: `el-${now}-stat-stamp`,
      type: 'text',
      x: leftX,
      y: leftY,
      width: leftW,
      height: 32,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: '[ VERIFIED BENCHMARK // HIGH IMPACT ]',
      fontSize: 14,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: accentColor,
      align: 'left',
      verticalAlign: 'middle',
      letterSpacing: 2.5,
    });
    leftY += 50;

    // Massive 130px Bold Display Stat Number in Electric Cobalt
    elements.push({
      id: `el-${now}-stat-num`,
      type: 'text',
      x: leftX,
      y: leftY,
      width: leftW,
      height: 180,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: statVal,
      fontSize: 130,
      fontFamily: t.fontHeading,
      fontWeight: '900',
      color: accentColor,
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 1.0,
      letterSpacing: -4,
    });
    leftY += 190;

    // Stat Metric Label
    elements.push({
      id: `el-${now}-stat-lab`,
      type: 'text',
      x: leftX,
      y: leftY,
      width: leftW,
      height: 40,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: statLab,
      fontSize: 20,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: '#0F172A',
      align: 'left',
      verticalAlign: 'top',
      letterSpacing: 2,
    });
    leftY += 46;

    if (slide.body) {
      elements.push({
        id: `el-${now}-stat-summary`,
        type: 'text',
        x: leftX,
        y: leftY,
        width: leftW - 60,
        height: 60,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: slide.body,
        fontSize: 16,
        fontFamily: t.fontBody,
        fontWeight: '400',
        color: '#64748B',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.6,
      });
    }

    // Right Column: Title & Narrative
    const rightX = 960;
    const rightW = 820;
    let rightY = 240;

    // Right Eyebrow
    elements.push({
      id: `el-${now}-right-eyebrow`,
      type: 'text',
      x: rightX,
      y: rightY,
      width: rightW,
      height: 32,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: `[ ${cleanSub || 'QUANTITATIVE IMPACT'} ]`,
      fontSize: 14,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: accentColor,
      align: 'left',
      verticalAlign: 'middle',
      letterSpacing: 2.5,
    });
    rightY += 46;

    // Headline (Using slide.headline)
    const headlineH = estimateTextHeight(cleanHeadline, 46, rightW, 1.15);
    elements.push({
      id: `el-${now}-headline`,
      type: 'text',
      x: rightX,
      y: rightY,
      width: rightW,
      height: headlineH,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: cleanHeadline,
      fontSize: 46,
      fontFamily: t.fontHeading,
      fontWeight: '800',
      color: '#0F172A',
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 1.15,
    });
    rightY += headlineH + 24;

    // Accent Line
    elements.push({
      id: `el-${now}-line`,
      type: 'shape',
      shapeType: 'line',
      x: rightX,
      y: rightY,
      width: 120,
      height: 3,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      fillColor: accentColor,
      fillOpacity: 1,
      borderColor: accentColor,
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 0,
    });
    rightY += 28;

    // Narrative Body
    if (cleanBody) {
      const bodyH = estimateTextHeight(cleanBody, 22, rightW, 1.75);
      elements.push({
        id: `el-${now}-body`,
        type: 'text',
        x: rightX,
        y: rightY,
        width: rightW,
        height: bodyH,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: cleanBody,
        fontSize: 22,
        fontFamily: t.fontBody,
        fontWeight: '400',
        color: '#64748B',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.75,
      });
    }

    return elements;
  }

  // =========================================================================
  // 4. PROCESS_GRID: 3 COMPACT CONTENT CARDS WITH SOLID PILL STEP TAGS
  // =========================================================================
  if (isProcessGrid) {
    const titleX = 140;
    const titleW = 1640;
    let yPos = 120;

    // Eyebrow & Stamp
    elements.push({
      id: `el-${now}-eyebrow`,
      type: 'text',
      x: titleX,
      y: yPos,
      width: 1000,
      height: 32,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: `[ ${cleanSub || 'STRATEGIC SEQUENCE'} ]`,
      fontSize: 14,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: accentColor,
      align: 'left',
      verticalAlign: 'middle',
      letterSpacing: 2.5,
    });

    elements.push({
      id: `el-${now}-grid-stamp`,
      type: 'text',
      x: 1200,
      y: yPos,
      width: 580,
      height: 32,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: `[ 0${slideIndex} // 3-PILLAR MATRIX ]`,
      fontSize: 13,
      fontFamily: t.fontBody,
      fontWeight: '600',
      color: '#64748B',
      align: 'right',
      verticalAlign: 'middle',
      letterSpacing: 2,
    });
    yPos += 42;

    // Headline (Using slide.headline)
    const headlineH = estimateTextHeight(cleanHeadline, 42, titleW, 1.15);
    elements.push({
      id: `el-${now}-headline`,
      type: 'text',
      x: titleX,
      y: yPos,
      width: titleW,
      height: headlineH,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: cleanHeadline,
      fontSize: 42,
      fontFamily: t.fontHeading,
      fontWeight: '800',
      color: '#0F172A',
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 1.15,
    });
    yPos += headlineH + 40;

    // 3 Equal Compact Columns (height = 580px)
    const rawPoints =
      slide.points && slide.points.length > 0
        ? slide.points
        : cleanBody.split('\n').filter((l) => l.trim().length > 0);

    const pillars = [0, 1, 2].map((idx) => {
      const p = rawPoints[idx] || `Phase 0${idx + 1}`;
      const colonIdx = p.indexOf(':');
      if (colonIdx !== -1) {
        return {
          num: `0${idx + 1}`,
          title: p.substring(0, colonIdx).replace(/^[•*-0-9.]+\s*/, '').trim(),
          desc: p.substring(colonIdx + 1).trim(),
        };
      }
      return {
        num: `0${idx + 1}`,
        title: `Phase 0${idx + 1}`,
        desc: p.replace(/^[•*-0-9.]+\s*/, '').trim(),
      };
    });

    const colW = 510;
    const colGap = 55;
    const cardHeight = 580;

    pillars.forEach((pillar, pIdx) => {
      const colX = titleX + pIdx * (colW + colGap);
      const colY = yPos;

      // Card Background (bg-white p-8 rounded-xl border border-slate-200 shadow-sm)
      elements.push({
        id: `el-${now}-col-card-${pIdx}`,
        type: 'shape',
        shapeType: 'roundRect',
        x: colX,
        y: colY,
        width: colW,
        height: cardHeight,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 16,
      });

      // Solid Pill Step Tag (bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full)
      elements.push({
        id: `el-${now}-col-pill-bg-${pIdx}`,
        type: 'shape',
        shapeType: 'pill',
        x: colX + 32,
        y: colY + 32,
        width: 80,
        height: 34,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        fillColor: accentColor,
        fillOpacity: 1,
        borderColor: accentColor,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 17,
      });

      elements.push({
        id: `el-${now}-col-pill-txt-${pIdx}`,
        type: 'text',
        x: colX + 32,
        y: colY + 34,
        width: 80,
        height: 30,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        text: pillar.num,
        fontSize: 16,
        fontFamily: t.fontBody,
        fontWeight: '800',
        color: '#FFFFFF',
        align: 'center',
        verticalAlign: 'middle',
      });

      // Bold 20px Subtitle
      const pTitleH = estimateTextHeight(pillar.title, 20, colW - 64, 1.25);
      elements.push({
        id: `el-${now}-col-title-${pIdx}`,
        type: 'text',
        x: colX + 32,
        y: colY + 84,
        width: colW - 64,
        height: pTitleH,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        text: pillar.title,
        fontSize: 20,
        fontFamily: t.fontHeading,
        fontWeight: '800',
        color: '#0F172A',
        align: 'left',
        verticalAlign: 'top',
        lineHeight: 1.25,
      });

      // Clean 14px Narrative Prose
      if (pillar.desc) {
        const pDescH = estimateTextHeight(pillar.desc, 15, colW - 64, 1.65);
        elements.push({
          id: `el-${now}-col-desc-${pIdx}`,
          type: 'text',
          x: colX + 32,
          y: colY + 96 + pTitleH,
          width: colW - 64,
          height: pDescH,
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          text: pillar.desc,
          fontSize: 15,
          fontFamily: t.fontBody,
          fontWeight: '400',
          color: '#64748B',
          align: 'left',
          verticalAlign: 'top',
          lineHeight: 1.65,
        });
      }
    });

    return elements;
  }

  // =========================================================================
  // 5. PULL_QUOTE: DEEP MIDNIGHT NAVY CANVAS + 48px ITALIC TYPE
  // =========================================================================
  if (isQuote) {
    const quoteText = `“${cleanHeadline.replace(/^["“]|["”]$/g, '')}”`;
    const quoteX = 260;
    const quoteW = 1400;
    let quoteY = 220;

    // Eyebrow Stamp
    elements.push({
      id: `el-${now}-eyebrow`,
      type: 'text',
      x: quoteX,
      y: quoteY,
      width: quoteW,
      height: 32,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      text: `[ ${cleanSub || 'GUIDING PHILOSOPHY'} ]`,
      fontSize: 14,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: '#FFFFFF',
      align: 'center',
      verticalAlign: 'middle',
      letterSpacing: 2.5,
    });
    quoteY += 60;

    // 100px Decorative Quote Glyph (“)
    elements.push({
      id: `el-${now}-quote-mark`,
      type: 'text',
      x: quoteX,
      y: quoteY,
      width: quoteW,
      height: 90,
      rotation: 0,
      opacity: 0.4,
      zIndex: 1,
      text: '“',
      fontSize: 100,
      fontFamily: t.fontHeading,
      fontWeight: '700',
      color: accentColor,
      align: 'center',
      verticalAlign: 'top',
    });
    quoteY += 70;

    // Huge 48px Italicized Serif Statement Centered on Screen
    const quoteH = estimateTextHeight(quoteText, 48, quoteW, 1.25);
    elements.push({
      id: `el-${now}-quote`,
      type: 'text',
      x: quoteX,
      y: quoteY,
      width: quoteW,
      height: quoteH,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: quoteText,
      fontSize: 48,
      fontFamily: t.fontHeading,
      fontStyle: 'italic',
      fontWeight: '600',
      color: '#FFFFFF',
      align: 'center',
      verticalAlign: 'top',
      lineHeight: 1.25,
    });
    quoteY += quoteH + 36;

    // Centered Bright Electric Cobalt Attribution Rule
    elements.push({
      id: `el-${now}-line`,
      type: 'shape',
      shapeType: 'line',
      x: 880,
      y: quoteY,
      width: 160,
      height: 4,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      fillColor: accentColor,
      fillOpacity: 1,
      borderColor: accentColor,
      borderWidth: 0,
      borderStyle: 'solid',
      borderRadius: 2,
    });
    quoteY += 32;

    // Clean Author Kicker in Acid Lemon / Cobalt
    elements.push({
      id: `el-${now}-author`,
      type: 'text',
      x: quoteX,
      y: quoteY,
      width: quoteW,
      height: 40,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: slide.author || (cleanBody && cleanBody !== cleanHeadline ? cleanBody : 'LEADERSHIP IMPERATIVE'),
      fontSize: 16,
      fontFamily: t.fontBody,
      fontWeight: '700',
      color: accentBadgeBg,
      align: 'center',
      verticalAlign: 'top',
      letterSpacing: 3,
    });

    return elements;
  }

  return elements;
}
