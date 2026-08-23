import { AISlideItem } from '../../types/llm';

/**
 * SlideContent — the pure, layout-agnostic content model the scene-graph
 * composer works from. It carries only *what* is on the slide (a headline,
 * a stat, a handful of bullets, a quote, an optional user asset...) and
 * never *where* anything sits or how big it is — that geometry is derived
 * procedurally by lib/engine/composer.ts from this content plus the
 * extracted design grammar. There is no archetype/layoutType field: the
 * composer decides its structural regime from which facets are present.
 */
export interface SlideBullet {
  title?: string;
  description: string;
}

export interface SlideStat {
  value: string;
  label?: string;
}

export interface SlideQuote {
  text: string;
  author?: string;
}

export interface SlideContent {
  id: string;
  index: number; // 1-based position in the deck
  total: number;
  isTitleSlide: boolean;
  eyebrow?: string;
  headline: string;
  body?: string;
  bullets: SlideBullet[];
  stat?: SlideStat;
  quote?: SlideQuote;
  imageUrl?: string;
  iconSvgData?: string;
  diagram?: string;
  notes?: string;
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^[•*\-0-9.]+\s*/, '').trim();
}

/**
 * Split "Title: description" list items into {title, description}; plain
 * items become description-only bullets. Purely mechanical text parsing —
 * no layout decisions are made here.
 */
function parseBullets(points: string[] | undefined): SlideBullet[] {
  if (!points || points.length === 0) return [];
  return points
    .filter((p) => p && p.trim().length > 0)
    .map((point) => {
      const colonIdx = point.indexOf(':');
      if (colonIdx !== -1 && colonIdx < 60) {
        return {
          title: stripBulletPrefix(point.substring(0, colonIdx)),
          description: point.substring(colonIdx + 1).trim(),
        };
      }
      return { description: stripBulletPrefix(point) };
    });
}

function looksLikeQuote(headline: string): boolean {
  const trimmed = headline.trim();
  return trimmed.startsWith('"') || trimmed.startsWith('“') || trimmed.startsWith('‘');
}

export interface BuildSlideContentOptions {
  index: number; // 1-based
  total: number;
  imageUrl?: string;
  iconSvgData?: string;
}

export function buildSlideContent(slide: AISlideItem, opts: BuildSlideContentOptions): SlideContent {
  const { index, total, imageUrl, iconSvgData } = opts;
  const bullets = parseBullets(slide.points);

  const hasStat = Boolean(slide.statValue && slide.statValue.trim().length > 0);
  const hasAuthor = Boolean(slide.author && slide.author.trim().length > 0);
  const isQuoteFacet =
    !hasStat &&
    bullets.length === 0 &&
    index !== 1 &&
    (hasAuthor || looksLikeQuote(slide.headline || ''));

  return {
    id: `slide-content-${Date.now()}-${index}`,
    index,
    total,
    isTitleSlide: index === 1,
    eyebrow: slide.subheading,
    headline: slide.headline || '',
    body: slide.body || '',
    bullets,
    stat: hasStat ? { value: slide.statValue as string, label: slide.statLabel } : undefined,
    quote: isQuoteFacet ? { text: slide.headline || '', author: slide.author || (slide.body || undefined) } : undefined,
    imageUrl,
    iconSvgData,
    diagram: slide.diagram,
    notes: slide.notes,
  };
}
