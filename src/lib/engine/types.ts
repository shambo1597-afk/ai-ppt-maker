import { AISlideItem } from '../../types/llm';

export type SlideIntent =
  | 'HERO_STATEMENT'
  | 'DATA_DOMINANCE'
  | 'MULTI_FACET_GRID'
  | 'HORIZONTAL_TIMELINE'
  | 'SPLIT_NARRATIVE'
  | 'EDITORIAL_QUOTE';

export type SurfaceTone = 'CANVAS' | 'HERO' | 'ACCENT' | 'MUTED';

export type FocalBlockType = 'STAT' | 'HEADLINE' | 'MEDIA' | 'QUOTE';

export interface FocalBlock {
  type: FocalBlockType;
  content: string;
  secondary?: string;
  metric?: string;
}

export interface SupportingBlock {
  index?: string;
  title?: string;
  description: string;
  badge?: string;
  icon?: string;
}

export interface SlideNode {
  id: string;
  intent: SlideIntent;
  surfaceTone: SurfaceTone;
  focalBlock: FocalBlock;
  supportingBlocks: SupportingBlock[];
  userAssetUrl?: string;
  subheading?: string;
  author?: string;
  notes?: string;
  iconName?: string;
  icon?: string;
  diagram?: string;
}

export interface PresentationAST {
  title: string;
  themeId?: string;
  slides: SlideNode[];
}

/**
 * Converts an AISlideItem to a semantic SlideNode AST
 * Purely extracts content from user inputs without injecting hardcoded fake strings.
 */
export function convertAISlideToSlideNode(
  slide: AISlideItem,
  index: number = 1,
  userAssetUrl?: string
): SlideNode {
  const rawArchetype = (slide.archetype || slide.layoutType || '').toUpperCase();
  const slideId = `slide-node-${Date.now()}-${index}`;

  // 1. Dynamic Intent & Surface Tone Mapping
  let intent: SlideIntent = 'SPLIT_NARRATIVE';
  let surfaceTone: SurfaceTone = 'CANVAS';

  const isCover =
    index === 1 ||
    rawArchetype.includes('COVER') ||
    rawArchetype.includes('HERO_MINIMAL');

  const isStat =
    !isCover &&
    (Boolean(slide.statValue) ||
      rawArchetype.includes('STAT') ||
      rawArchetype.includes('METRIC') ||
      rawArchetype.includes('IMPACT'));

  const isQuote =
    !isCover &&
    !isStat &&
    (Boolean(slide.author) ||
      rawArchetype.includes('QUOTE') ||
      rawArchetype.includes('PHILOSOPHY'));

  const isTimeline =
    !isCover &&
    !isStat &&
    !isQuote &&
    (rawArchetype.includes('TIMELINE') ||
      rawArchetype.includes('ROADMAP') ||
      rawArchetype.includes('PROCESS') ||
      rawArchetype.includes('FLOW') ||
      rawArchetype.includes('SEQUENCE'));

  const isGrid =
    !isCover &&
    !isStat &&
    !isQuote &&
    !isTimeline &&
    (rawArchetype.includes('GRID') ||
      rawArchetype.includes('PILLAR') ||
      rawArchetype.includes('COLUMN') ||
      rawArchetype.includes('FACET') ||
      rawArchetype.includes('MATRIX') ||
      rawArchetype.includes('COMPARISON') ||
      Boolean(slide.points && slide.points.length >= 3));

  if (isCover) {
    intent = 'HERO_STATEMENT';
    surfaceTone = 'HERO';
  } else if (isQuote) {
    intent = 'EDITORIAL_QUOTE';
    surfaceTone = 'HERO';
  } else if (isStat) {
    intent = 'DATA_DOMINANCE';
    surfaceTone = 'CANVAS';
  } else if (isTimeline) {
    intent = 'HORIZONTAL_TIMELINE';
    surfaceTone = 'CANVAS';
  } else if (isGrid) {
    intent = 'MULTI_FACET_GRID';
    surfaceTone = 'CANVAS';
  } else {
    intent = 'SPLIT_NARRATIVE';
    surfaceTone = 'CANVAS';
  }

  // 2. Build Focal Block Purely from Slide Data
  let focalBlock: FocalBlock = {
    type: 'HEADLINE',
    content: slide.headline || '',
    secondary: slide.body || '',
  };

  if (intent === 'HERO_STATEMENT') {
    focalBlock = {
      type: 'HEADLINE',
      content: slide.headline || '',
      secondary: slide.body || '',
    };
  } else if (intent === 'DATA_DOMINANCE') {
    focalBlock = {
      type: 'STAT',
      content: slide.statValue || '',
      metric: slide.statLabel || '',
      secondary: slide.headline || '',
    };
  } else if (intent === 'EDITORIAL_QUOTE') {
    focalBlock = {
      type: 'QUOTE',
      content: slide.headline || '',
      secondary: slide.author || (slide.body && slide.body !== slide.headline ? slide.body : ''),
    };
  } else if (intent === 'SPLIT_NARRATIVE') {
    focalBlock = {
      type: userAssetUrl ? 'MEDIA' : 'HEADLINE',
      content: slide.headline || '',
      secondary: slide.body || '',
    };
  }

  // 3. Extract Supporting Blocks Purely from Input Data
  const supportingBlocks: SupportingBlock[] = [];

  if (slide.points && slide.points.length > 0) {
    slide.points.forEach((point, pIdx) => {
      if (!point || point.trim().length === 0) return;
      const colonIdx = point.indexOf(':');
      let title = '';
      let description = point;

      if (colonIdx !== -1) {
        title = point.substring(0, colonIdx).replace(/^[•*-0-9.]+\s*/, '').trim();
        description = point.substring(colonIdx + 1).trim();
      } else {
        description = point.replace(/^[•*-0-9.]+\s*/, '').trim();
      }

      supportingBlocks.push({
        index: `0${pIdx + 1}`,
        title: title || undefined,
        description,
      });
    });
  } else if (slide.body && (intent === 'MULTI_FACET_GRID' || intent === 'HORIZONTAL_TIMELINE' || intent === 'SPLIT_NARRATIVE')) {
    // Parse dynamic lines from body copy
    const rawLines = slide.body
      .split(/\n|(?<=[.!?])\s+(?=[A-Z0-9•*-])/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== slide.headline);

    if (rawLines.length > 1) {
      rawLines.slice(0, 4).forEach((line, pIdx) => {
        const colonIdx = line.indexOf(':');
        let title = '';
        let description = line;

        if (colonIdx !== -1) {
          title = line.substring(0, colonIdx).replace(/^[•*-0-9.]+\s*/, '').trim();
          description = line.substring(colonIdx + 1).trim();
        } else {
          description = line.replace(/^[•*-0-9.]+\s*/, '').trim();
        }

        supportingBlocks.push({
          index: `0${pIdx + 1}`,
          title: title || undefined,
          description,
        });
      });
    }
  }

  return {
    id: slideId,
    intent,
    surfaceTone,
    focalBlock,
    supportingBlocks,
    userAssetUrl,
    subheading: slide.subheading,
    author: slide.author,
    notes: slide.notes,
    iconName: slide.iconName || 'sparkles',
    icon: slide.icon,
    diagram: slide.diagram,
  };
}
