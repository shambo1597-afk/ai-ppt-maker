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
  /** A per-item vector icon, matched to this bullet's own text (see
   * iconHelper.ts's inferIconForText) rather than reusing one icon across
   * every card — see BuildSlideContentOptions.bulletIconSvgData. */
  iconSvgData?: string;
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

/** The non-empty points parseBullets will actually turn into bullets, in
 * the same order — exported so slideComposer.ts can fetch one icon per
 * *eventual* bullet (via Promise.all, before buildSlideContent even runs)
 * and hand the results back aligned to the same indices, instead of
 * duplicating this filter and risking the two lists drifting apart. */
export function nonEmptyPoints(points: string[] | undefined): string[] {
  return (points || []).filter((p) => p && p.trim().length > 0);
}

/**
 * Split "Title: description" list items into {title, description}; plain
 * items become description-only bullets. Purely mechanical text parsing —
 * no layout decisions are made here.
 */
function parseBullets(points: string[] | undefined): SlideBullet[] {
  return nonEmptyPoints(points).map((point) => {
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

/**
 * composeStat() renders statValue as a monumental display number with
 * statLabel directly beneath it — so a label that repeats the value (a
 * source bullet like "312% Revenue Growth" naively split into both
 * fields, or an LLM echoing the number back) renders as a visible
 * duplicate of the number it's meant to caption. Defends both content
 * sources — the rule-based parser and the LLM — from the same choke
 * point, rather than trusting each producer to never do this.
 */
function sanitizeStatLabel(value: string, label: string | undefined): string | undefined {
  if (!label) return undefined;
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return undefined;
  if (trimmedLabel.toLowerCase() === value.trim().toLowerCase()) return undefined;
  if (trimmedLabel.toLowerCase().includes(value.trim().toLowerCase())) {
    const stripped = trimmedLabel
      .replace(new RegExp(value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
      .replace(/^[\s,;:-]+|[\s,;:-]+$/g, '')
      .trim();
    return stripped || undefined;
  }
  return trimmedLabel;
}

export interface BuildSlideContentOptions {
  index: number; // 1-based
  total: number;
  imageUrl?: string;
  iconSvgData?: string;
  /** One fetched icon per eventual bullet (see nonEmptyPoints), aligned by
   * index — undefined entries mean no icon was matched/fetched for that
   * bullet and composeGrid() should decide its own fallback. */
  bulletIconSvgData?: (string | undefined)[];
}

export function buildSlideContent(slide: AISlideItem, opts: BuildSlideContentOptions): SlideContent {
  const { index, total, imageUrl, iconSvgData, bulletIconSvgData } = opts;
  const bullets = parseBullets(slide.points);
  bullets.forEach((bullet, i) => {
    bullet.iconSvgData = bulletIconSvgData?.[i];
  });

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
    stat: hasStat ? { value: slide.statValue as string, label: sanitizeStatLabel(slide.statValue as string, slide.statLabel) } : undefined,
    quote: isQuoteFacet ? { text: slide.headline || '', author: slide.author || (slide.body || undefined) } : undefined,
    imageUrl,
    iconSvgData,
    diagram: slide.diagram,
    notes: slide.notes,
  };
}
