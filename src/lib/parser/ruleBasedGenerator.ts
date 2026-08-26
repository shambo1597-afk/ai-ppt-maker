import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../../types/llm';
import { AssetItem } from '../../types/asset';
import { applyRhythmToAISlides } from '../engine/rhythm';
import { newDeckSeed, seededRandom } from '../utils/prng';
import { generateTheme, hueHintForMood, inferGravity } from '../design/themeGenerator';
import { buildSlideChunks } from './verbatimText';
import { verifySlideTextFidelity } from './verifyTextFidelity';
import { stripMarkdownSyntax, isHorizontalRuleLine } from './markdownStrip';

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
  // 'auto' (nobody asked for a specific slide count — the code has no
  // opinion of its own) is the default, not a hardcoded 6. That
  // distinction matters: buildSlideChunks() lets a heading-structured
  // input's own natural section count win under 'auto', but a genuine
  // explicit number (the UI's own 5/7/10/custom slide-count picker)
  // still caps/merges as before. See verbatimText.ts's buildSlideChunks().
  targetSlideCount: number | 'auto' = 'auto',
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

  // 2. Generate a theme, seeded the same way the cloud path is (client.ts's
  // cleanAndParseJsonResponse): a procedurally generated palette, hue-
  // biased by the brief's own topic keywords (hueHintForMood(), the same
  // keyword table the LLM path's themeMood hint resolves against) and
  // constrained by the brief's inferred content-tone gravity, deterministic
  // for this deck's own seed. There's no fixed theme registry to match
  // against any more, so — unlike the old keyword ladder this replaces —
  // every keyword bucket now only ever biases a hue, never picks a fixed
  // palette outright.
  const gravity = inferGravity(text);
  const themeTokens = generateTheme({ hueHint: hueHintForMood(text), gravity, rand: seededRandom(deckSeed) });

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
    themeGravity: gravity,
    tokens: themeTokens,
  };

  // 3. Build the slide-number -> source-chunk plan: explicit [[slide:N]]
  // pins keep their exact number; everything else is auto-distributed
  // paragraph/sentence chunks (see verbatimText.ts). This path was always
  // purely extractive (it never wrote new copy), but it did fabricate
  // placeholder labels ("Key Topic 0N", "SECTION 0N", "EXECUTIVE BRIEF")
  // whenever a section had no natural heading — those get caught and
  // stripped by verifySlideTextFidelity() below exactly like the LLM
  // path's invented text would be, so "verbatim-always" applies uniformly
  // to both generation paths.
  // NOTE: unlike client.ts's LLM path, chunks here are deliberately NOT
  // pre-stripped of markdown syntax before parseSectionContent() runs —
  // this heuristic (unlike an LLM) detects structure (heading/bullet/
  // quote) by literally matching marker characters (`#`, `- `, `1. `,
  // `>`) at the start of each line; stripping them upstream would blind
  // it to that structure entirely (verified: it collapses every chunk
  // into one undifferentiated body paragraph, losing points/headings).
  // Every field parseSectionContent() extracts is still run through
  // stripMarkdownSyntax() itself, below, before it's returned — so the
  // *output* is exactly as clean as the LLM path's, just reached by
  // stripping after structural classification instead of before it.
  const { chunks, slideCount, hasPinnedMarkers } = buildSlideChunks(text, targetSlideCount);

  // 4. Build one slide per claimed slide number, each parsed from (and
  // hard-verified against) its own exact source chunk.
  const slides: AISlideItem[] = [];
  for (let slideNum = 1; slideNum <= slideCount; slideNum++) {
    const chunkText = chunks.get(slideNum);
    if (!chunkText) {
      // A genuine gap — a pinned number left earlier slots unclaimed with
      // no unpinned text to fill them. An empty slide is more honest than
      // fabricating placeholder copy for it.
      slides.push({ headline: '', body: '', iconName: 'sparkles', notes: '' });
      continue;
    }

    const sec = parseSectionContent(chunkText, slideNum);

    // A chunk with its own captured quote+attribution is a quote slide
    // (see designSchoolGuidelines.ts's Dijkstra example: headline IS the
    // quote text, never a section title next to it) — the same pattern
    // the LLM prompt is told to follow. Preferring sec.heading here
    // unconditionally (the old behavior) meant a chunk like "### 05. A
    // Perspective on Near-Space Infrastructure\n\"...\"\n— Author" used
    // its own section title as headline and left the actual quote text
    // to fall through to the coverage-check safety net as a confusingly-
    // ordered body append. The section's own heading text still isn't
    // discarded — it becomes the subheading/eyebrow instead, so it's
    // still verbatim-verified, just in a field that fits it.
    const isQuoteSection = Boolean(sec.quote && sec.author);
    // Same "no natural headline-length line -> reuse the chunk's own
    // first sentence" rule the LLM prompt asks the model to follow (see
    // designSchoolGuidelines.ts), applied here too so a chunk with no
    // markdown heading still gets a real, verbatim headline instead of a
    // fabricated one.
    const headline = isQuoteSection ? (sec.quote as string) : sec.heading || firstSentence(chunkText);
    const subheading = isQuoteSection ? sec.heading || undefined : sec.subheading;
    const iconName = sec.statValue ? 'zap' : sec.points.length >= 3 ? 'layers' : 'sparkles';

    const slide: AISlideItem = {
      headline,
      subheading,
      body: sec.body,
      statValue: sec.statValue,
      statLabel: sec.statLabel,
      points: sec.points.length > 0 ? sec.points : undefined,
      author: sec.author,
      iconName,
      notes: '',
    };

    slides.push(verifySlideTextFidelity(chunkText, slide));
  }

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

  // designSchoolGuidelines.ts's LLM-facing "vary slide types" guidance has
  // no equivalent for this deterministic local path at all — a process-
  // heavy brief parses into GRID slide after GRID slide every single time
  // without this. Skipped when the user pinned explicit slide numbers:
  // rhythm enforcement can insert/reorder slides (e.g. splitting an
  // overlong grid into two), which would shift a pinned chunk away from
  // the exact position the user asked for.
  return {
    presentationTitle,
    theme,
    slides: hasPinnedMarkers ? slides : applyRhythmToAISlides(slides),
    deckSeed,
  };
}

/** The chunk's own first sentence (up to the first ./!/?, or its first
 * line if there's no sentence-ending punctuation at all) — the same
 * verbatim fallback headline rule the LLM prompt is asked to follow when
 * a chunk has no natural short headline-length line. Never invents a
 * punchier title; if there's nothing to extract, returns ''. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[^.!?\n]*[.!?]/);
  if (match) return match[0].trim();
  return trimmed.split('\n')[0].trim();
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
  // The first metric-shaped bullet found, if any — only promoted to an
  // actual statValue/statLabel after the loop, once we know whether this
  // section turned out to have exactly one point (a real hero metric) or
  // several (a parallel metrics list — see the points.length === 1 gate
  // below, and designSchoolGuidelines.ts's matching instruction for the
  // LLM path).
  let statCandidate: { point: string; value: string } | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Standalone horizontal rule (---/***/___) — structural markup the
    // user's authoring tool inserted between sections, never a word they
    // wrote (see markdownStrip.ts / verifyTextFidelity.ts's class
    // comment). Drop it outright, same as it would be dropped if this
    // chunk went through stripMarkdownSyntax() wholesale — otherwise it
    // falls through to the body-paragraph bucket below and renders as a
    // literal "---" on the slide.
    if (isHorizontalRuleLine(line)) {
      continue;
    }

    // Heading Match — detected on the raw, marker-intact line (this
    // heuristic, unlike an LLM, can only recognize structure by literal
    // marker characters), but the extracted text itself is run through
    // stripMarkdownSyntax() below so the field this function returns is
    // exactly as clean as the LLM path's.
    if (line.startsWith('#') && !heading) {
      heading = stripMarkdownSyntax(line);
      continue;
    }

    // Numbered or Bulleted list item
    if (/^[•*-]\s+/.test(line) || /^[0-9]+[.)]\s+/.test(line)) {
      const cleanPoint = stripMarkdownSyntax(line);
      points.push(cleanPoint);

      // Check for a numeric metric in the bullet — but don't decide yet
      // whether it becomes the slide's statValue; that depends on how
      // many *other* bullets this section turns out to have, which we
      // don't know until the loop finishes (see the points.length === 1
      // gate below). Only the first metric-shaped bullet is remembered,
      // matching the old "first wins" behavior for the single-stat case.
      // The trailing boundary is a negative lookahead rather than \b: \b
      // only fires between a word and non-word character, so it never
      // matches after a symbol unit like "%" when followed by a space or
      // end of string (both sides non-word) — which is the overwhelmingly
      // common shape ("312% growth", "312%" at a line's end), so a
      // \b-based regex would miss most real percentage metrics entirely.
      const metricMatch = cleanPoint.match(/(\b\d+(?:\.\d+)?\s*(?:ms|%|x|k|M|B|GB|TB|TB\/s|fps)(?![a-zA-Z0-9])|\$\d+(?:\.\d+)?(?:M|B|K)?(?![a-zA-Z0-9]))/i);
      if (metricMatch && !statCandidate) {
        statCandidate = { point: cleanPoint, value: metricMatch[1] };
      }
      continue;
    }

    // Quote detection
    if (line.startsWith('>') || line.startsWith('“') || line.startsWith('"')) {
      quote = stripMarkdownSyntax(line.replace(/^[>“"\s]+|[”"\s]+$/g, ''));
      continue;
    }

    // Author attribution: an em-dash/hyphen prefix immediately following
    // a quote already captured on an earlier line (e.g. "— Jane Doe"),
    // mirroring the exact pattern the LLM prompt is told to recognize
    // (see designSchoolGuidelines.ts's Dijkstra example: "— Edsger W.
    // Dijkstra" -> author). Gated on `quote` already being set so a body
    // paragraph that merely starts with a hyphen elsewhere in the deck is
    // never misread as an attribution.
    if (quote && !author && /^[—–-]\s*\S/.test(line)) {
      author = stripMarkdownSyntax(line.replace(/^[—–-]\s*/, ''));
      continue;
    }

    // Body paragraph
    bodyParagraphs.push(stripMarkdownSyntax(line));
  }

  const body = bodyParagraphs.join(' ').trim();

  // statValue/statLabel is reserved for a section whose ENTIRE point is
  // one single number — never extracted from a section that naturally
  // forms a parallel list of 2+ items, even when several of those items
  // are individually numeric ("100 Gbps" / "20,000 m" / "365+ Days" is a
  // 3-item metrics list, not one hero stat with two leftover items).
  // Promoting the first numeric-looking bullet into statValue there would
  // silently drop the other two: detectRegime() (composer.ts) picks the
  // STAT regime over GRID whenever a stat is present at all, regardless
  // of how many parallel points also exist, and composeStat() has no
  // bullets slot to fall back on. See designSchoolGuidelines.ts's
  // matching instruction for the LLM path.
  if (points.length === 1 && statCandidate) {
    statValue = statCandidate.value;
    const colonIdx = statCandidate.point.indexOf(':');
    if (colonIdx !== -1) {
      // Strip the metric itself back out of the label half — a bullet
      // like "312% Revenue Growth: driven by..." would otherwise
      // produce statLabel "312% REVENUE GROWTH", repeating the exact
      // value the big display number already shows right next to it.
      const strippedLabel = statCandidate.point
        .substring(0, colonIdx)
        .replace(statValue, '')
        .replace(/^[\s,;-]+|[\s,;-]+$/g, '')
        .trim();
      statLabel = (strippedLabel || 'KEY METRIC').toUpperCase();
    } else {
      statLabel = 'KEY METRIC';
    }
  }

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
  const themeTokens = generateTheme({ rand: seededRandom(deckSeed) });
  return {
    presentationTitle: 'Presentation',
    theme: {
      background: themeTokens.canvasBg,
      primary: themeTokens.textPrimary,
      accent: themeTokens.accent,
      fontHeader: themeTokens.fontHeading,
      fontBody: themeTokens.fontBody,
      themeId: themeTokens.id,
      tokens: themeTokens,
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
