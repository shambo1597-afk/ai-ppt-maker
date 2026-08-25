import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../../types/llm';
import { AssetItem } from '../../types/asset';
import { MASTER_THEMES } from '../design/tokens';
import { applyRhythmToAISlides } from '../engine/rhythm';
import { newDeckSeed } from '../utils/prng';

interface ParsedSection {
  heading: string;
  subheading?: string;
  body: string;
  points: string[];
  statValue?: string;
  statLabel?: string;
  quote?: string;
  author?: string;
}

/**
 * Intelligent client-side rule-based presentation generator
 * Parses raw assignment text, markdown outlines, headings, stats, and bullets into dynamic slides.
 * Produces pure content (AISlideItem[]) — no layout/archetype decision is made here; the
 * scene-graph composer (lib/engine/composer.ts) derives each slide's structure from this
 * content when it's compiled.
 */
export function generateDynamicSlidesFromText(
  rawText: string,
  uploadedAssets: AssetItem[] = [],
  targetSlideCount: number = 6,
  deckSeed: number = newDeckSeed()
): AIPresentationResponse {
  const text = rawText.trim();
  if (!text) {
    return generateEmptyPresentation(deckSeed);
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Detect Overall Topic and Presentation Title
  let presentationTitle = 'Presentation';
  const h1Match = text.match(/^#\s+(.+)$/m);
  if (h1Match) {
    presentationTitle = h1Match[1].trim();
  } else if (lines[0]) {
    presentationTitle = lines[0].replace(/^[#*-.\s]+/, '').slice(0, 70).trim();
  }

  // 2. Autonomously Detect Domain Aesthetic & Theme from Master Themes
  const lowerText = text.toLowerCase();
  let themeTokens = MASTER_THEMES['cobalt-kinetic'];

  if (
    lowerText.includes('security') ||
    lowerText.includes('cyber') ||
    lowerText.includes('latency') ||
    lowerText.includes('infrastructure') ||
    lowerText.includes('cloud') ||
    lowerText.includes('distributed') ||
    lowerText.includes('agent') ||
    lowerText.includes('hardware')
  ) {
    themeTokens = MASTER_THEMES['midnight-iridescent'];
  } else if (
    lowerText.includes('revenue') ||
    lowerText.includes('investor') ||
    lowerText.includes('arr') ||
    lowerText.includes('growth') ||
    lowerText.includes('market') ||
    lowerText.includes('pitch') ||
    lowerText.includes('series a') ||
    lowerText.includes('clinical') ||
    lowerText.includes('genomics') ||
    lowerText.includes('therapeutics')
  ) {
    themeTokens = MASTER_THEMES['nordic-slate'];
  } else if (
    lowerText.includes('swiss') ||
    lowerText.includes('studio') ||
    lowerText.includes('minimal') ||
    lowerText.includes('framework')
  ) {
    themeTokens = MASTER_THEMES['swiss-studio'];
  } else if (
    lowerText.includes('architecture') ||
    lowerText.includes('monograph') ||
    lowerText.includes('design') ||
    lowerText.includes('editorial')
  ) {
    themeTokens = MASTER_THEMES['warm-editorial'];
  } else if (
    lowerText.includes('launch') ||
    lowerText.includes('campaign') ||
    lowerText.includes('startup') ||
    lowerText.includes('consumer')
  ) {
    themeTokens = MASTER_THEMES['carbon-mono'];
  } else if (
    lowerText.includes('wellness') ||
    lowerText.includes('lifestyle') ||
    lowerText.includes('craft') ||
    lowerText.includes('community') ||
    lowerText.includes('culture')
  ) {
    themeTokens = MASTER_THEMES['porcelain-light'];
  }

  const theme: AIPresentationTheme = {
    background: themeTokens.canvasBg,
    heroBg: themeTokens.heroBg,
    cardBg: themeTokens.cardBg,
    primary: themeTokens.textPrimary,
    textMuted: themeTokens.textMuted,
    textHero: themeTokens.textHero,
    accent: themeTokens.accent,
    border: themeTokens.border,
    fontHeader: themeTokens.fontHeading,
    fontBody: themeTokens.fontBody,
    themeId: themeTokens.id,
    tokens: themeTokens,
  };

  // 3. Segment Text into Logical Sections
  const rawSections = splitTextIntoSections(text);
  const parsedSections: ParsedSection[] = rawSections.map((sec, idx) => parseSectionContent(sec, idx + 1));

  // 4. Build Structured Content Slides
  const slides: AISlideItem[] = [];

  // Slide 1: Cover
  let coverSubtitle = parsedSections[0]?.body || '';
  let sectionsStartIdx = 1;

  // A short "## Subtitle" line directly under the title heading splits
  // into its own bare section, same as any other ## — splitTextIntoSections
  // can't tell "the deck's subtitle" apart from "a real section" by
  // syntax alone. But a real section always carries body prose, points,
  // a stat, or a quote; a subtitle-only heading carries nothing but
  // itself. When the section right after the title looks like that, fold
  // its heading into the cover subtitle instead of letting it render as
  // its own near-empty slide.
  const possibleSubtitleSection = parsedSections[1];
  const looksLikeSubtitle =
    possibleSubtitleSection &&
    possibleSubtitleSection.heading &&
    !possibleSubtitleSection.body &&
    possibleSubtitleSection.points.length === 0 &&
    !possibleSubtitleSection.statValue &&
    !possibleSubtitleSection.quote;
  if (looksLikeSubtitle) {
    coverSubtitle = possibleSubtitleSection.heading;
    sectionsStartIdx = 2;
  }

  slides.push({
    headline: presentationTitle,
    subheading: 'EXECUTIVE BRIEF',
    body: coverSubtitle.slice(0, 220),
    iconName: 'sparkles',
    notes: '',
  });

  // Subsequent Slides
  const remainingSections = parsedSections.length > sectionsStartIdx ? parsedSections.slice(sectionsStartIdx) : parsedSections;

  remainingSections.forEach((sec, idx) => {
    const slideIdx = idx + 2;
    const iconName = sec.statValue ? 'zap' : sec.points.length >= 3 ? 'layers' : 'sparkles';

    slides.push({
      headline: sec.heading || `Key Topic 0${slideIdx}`,
      subheading: sec.subheading || `SECTION 0${slideIdx}`,
      body: sec.body || '',
      statValue: sec.statValue,
      statLabel: sec.statLabel,
      points: sec.points.length > 0 ? sec.points : undefined,
      author: sec.author,
      iconName,
      notes: '',
    });
  });

  // Assign user assets if available
  if (uploadedAssets.length > 0) {
    uploadedAssets.forEach((asset) => {
      const targetIdx = typeof asset.targetSlide === 'number' ? asset.targetSlide - 1 : 1;
      if (slides[targetIdx]) {
        slides[targetIdx].attachedAssetId = asset.id;
        slides[targetIdx].attachedAssetName = asset.name;
      }
    });
  }

  // designSchoolGuidelines.ts's LLM-facing "vary slide types" guidance
  // has no equivalent for this deterministic local path at all — a
  // process-heavy brief parses into GRID slide after GRID slide every
  // single time without this.
  return {
    presentationTitle,
    theme,
    slides: applyRhythmToAISlides(slides.slice(0, targetSlideCount)),
    deckSeed,
  };
}

/**
 * Split text by markdown headings or major block paragraphs
 */
function splitTextIntoSections(text: string): string[] {
  if (/^##\s+/m.test(text) || /^###\s+/m.test(text)) {
    const rawChunks = text.split(/(?=^##?\s+|^###\s+)/m).filter((c) => c.trim().length > 0);
    return rawChunks;
  }

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return paragraphs;
}

/**
 * Parse an individual section into structured attributes (heading, stat, points, quote)
 */
function parseSectionContent(sectionText: string, index: number): ParsedSection {
  const lines = sectionText.split('\n').map((l) => l.trim()).filter(Boolean);
  let heading = '';
  let subheading = `SECTION 0${index}`;
  const points: string[] = [];
  const bodyParagraphs: string[] = [];
  let statValue: string | undefined;
  let statLabel: string | undefined;
  let quote: string | undefined;
  let author: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading Match
    if (line.startsWith('#') && !heading) {
      heading = line.replace(/^[#]+\s*/, '').trim();
      continue;
    }

    // Numbered or Bulleted list item
    if (/^[•*-]\s+/.test(line) || /^[0-9]+[.)]\s+/.test(line)) {
      const cleanPoint = line.replace(/^[•*-0-9.)]+\s*/, '').replace(/\*\*/g, '').trim();
      points.push(cleanPoint);

      // Check for numeric metrics in the bullet. The trailing boundary is
      // a negative lookahead rather than \b: \b only fires between a word
      // and non-word character, so it never matches after a symbol unit
      // like "%" when followed by a space or end of string (both sides
      // non-word) — which is the overwhelmingly common shape ("312%
      // growth", "312%" at a line's end), so the old \b-based regex
      // missed most real percentage metrics entirely.
      const metricMatch = cleanPoint.match(/(\b\d+(?:\.\d+)?\s*(?:ms|%|x|k|M|B|GB|TB|TB\/s|fps)(?![a-zA-Z0-9])|\$\d+(?:\.\d+)?(?:M|B|K)?(?![a-zA-Z0-9]))/i);
      if (metricMatch && !statValue) {
        statValue = metricMatch[1];
        const colonIdx = cleanPoint.indexOf(':');
        if (colonIdx !== -1) {
          // Strip the metric itself back out of the label half — a bullet
          // like "312% Revenue Growth: driven by..." would otherwise
          // produce statLabel "312% REVENUE GROWTH", repeating the exact
          // value the big display number already shows right next to it.
          const strippedLabel = cleanPoint
            .substring(0, colonIdx)
            .replace(statValue, '')
            .replace(/^[\s,;-]+|[\s,;-]+$/g, '')
            .trim();
          statLabel = (strippedLabel || 'KEY METRIC').toUpperCase();
        } else {
          statLabel = 'KEY METRIC';
        }
      }
      continue;
    }

    // Quote detection
    if (line.startsWith('>') || line.startsWith('“') || line.startsWith('"')) {
      quote = line.replace(/^[>“"\s]+|[”"\s]+$/g, '').trim();
      continue;
    }

    // Body paragraph
    bodyParagraphs.push(line.replace(/\*\*/g, ''));
  }

  const body = bodyParagraphs.join(' ').trim();

  return {
    heading,
    subheading,
    body,
    points,
    statValue,
    statLabel,
    quote,
    author,
  };
}

function generateEmptyPresentation(deckSeed: number = newDeckSeed()): AIPresentationResponse {
  const themeTokens = MASTER_THEMES['cobalt-kinetic'];
  return {
    presentationTitle: 'Presentation',
    theme: {
      background: themeTokens.canvasBg,
      primary: themeTokens.textPrimary,
      accent: themeTokens.accent,
      fontHeader: themeTokens.fontHeading,
      fontBody: themeTokens.fontBody,
      themeId: themeTokens.id,
    },
    slides: [
      {
        headline: 'Presentation Title',
        subheading: 'EXECUTIVE BRIEF',
        body: '',
        iconName: 'sparkles',
      },
      {
        headline: 'Overview',
        subheading: 'SECTION 02',
        body: '',
        iconName: 'layers',
      },
    ],
    deckSeed,
  };
}
