import { AISlideItem } from '../../types/llm';
import { SlideContent, buildSlideContent } from './contentModel';
import { detectRegime, Regime } from './composer';

/**
 * Post-processing pass that breaks up runs of more than 2 consecutive
 * same-regime slides and guarantees at least one TYPOGRAPHIC breather in
 * any 5+ slide deck. designSchoolGuidelines.ts already *asks* the model
 * to vary slide types, but nothing enforced it — a process-heavy brief
 * naturally suggests one shape (GRID slide after GRID slide) and LLMs
 * (and the local keyword parser) reliably under-diversify against that
 * pull. This is the enforcement.
 *
 * Pure over SlideContent[], using the exact same facet-detection
 * detectRegime() the composer itself uses (composer.ts) — "which regime
 * is this slide" is computed exactly once, never duplicated. An
 * already-well-varied deck comes back with every slide's *values*
 * unchanged (and, where nothing needed to move, the same object
 * references too — see renumber()).
 */
export function enforceSlideRhythm(slides: SlideContent[]): SlideContent[] {
  let result = slides.slice();

  // 1. Break every run of 3+ consecutive identical regimes. Re-derives
  // regimes from scratch each pass since breaking one run (especially a
  // split, which changes the array length) can shift what "3 in a row"
  // means afterward — bounded by a generous guard rather than trusted
  // to always terminate on its own, since that's cheap insurance against
  // a transform ever failing to actually shrink the offending run.
  for (let guard = 0; guard < 50; guard++) {
    const regimes = result.map(detectRegime);
    const offendingIndex = findMiddleOfFirstRun(regimes);
    if (offendingIndex === null) break;
    result = breakRun(result, offendingIndex);
  }

  // 2. Guarantee a typographic breather in any 5+ slide deck that
  // doesn't already have one. "Insert... before the final slide, not
  // the first" — read here as *convert* the second-to-last slide (never
  // slide 1, which is always TITLE) rather than fabricate a brand new
  // slide's content from nothing, which the simplest-transformation
  // principle above argues against just as much as it does for run-
  // breaking.
  if (result.length >= 5) {
    const regimes = result.map(detectRegime);
    if (!regimes.includes('typographic')) {
      const breatherIndex = Math.max(1, result.length - 2);
      result = result.map((s, i) => (i === breatherIndex ? downgradeToTypographic(s) : s));
    }
  }

  return renumber(result);
}

/** First run of 3+ consecutive equal regimes, returning its middle
 * index (title is structural — slide 1, never part of a "run" to
 * break) — or null once no run exceeds 2. */
function findMiddleOfFirstRun(regimes: Regime[]): number | null {
  let i = 0;
  while (i < regimes.length) {
    if (regimes[i] === 'title') {
      i += 1;
      continue;
    }
    let j = i;
    while (j < regimes.length && regimes[j] === regimes[i]) j += 1;
    const runLength = j - i;
    if (runLength > 2) return i + Math.floor(runLength / 2);
    i = j;
  }
  return null;
}

/** Break the run containing `offendingIndex` by transforming just that
 * one slide — prefer the simplest fix (a plain downgrade to
 * typographic) and only reach for the more disruptive split when the
 * slide actually has enough points to make a genuine follow-up slide
 * worthwhile instead of just flattening a rich list into a paragraph. */
function breakRun(slides: SlideContent[], offendingIndex: number): SlideContent[] {
  const target = slides[offendingIndex];
  if (detectRegime(target) === 'grid' && target.bullets.length >= 5) {
    return splitGridSlide(slides, offendingIndex);
  }
  return slides.map((s, i) => (i === offendingIndex ? downgradeToTypographic(s) : s));
}

/** Strip every facet that could make detectRegime() land anywhere but
 * 'typographic' — unconditionally, rather than switching on the
 * slide's current regime, so this is correct regardless of which
 * facet(s) were actually driving it (and safe to call on an
 * already-typographic slide as a no-op via the reference-preserving
 * check in enforceSlideRhythm's callers). Folds a stripped bullet list
 * into body prose instead of just discarding it. */
function downgradeToTypographic(content: SlideContent): SlideContent {
  let body = content.body || '';
  if (content.bullets.length > 0) {
    const folded = content.bullets.map((b) => (b.title ? `${b.title}: ${b.description}` : b.description)).join(' ');
    body = [body, folded].filter(Boolean).join(' ').slice(0, 500);
  }
  let headline = content.headline;
  if (content.quote) {
    // A literal leading quote mark is what looksLikeQuote() in
    // contentModel.ts keys off of — strip it too, or this slide would
    // re-qualify as a quote the next time regime is detected even
    // though `quote` itself is cleared below.
    headline = headline.replace(/^["“‘]\s*/, '').replace(/["”’]\s*$/, '');
  }
  return { ...content, headline, body, bullets: [], stat: undefined, quote: undefined, imageUrl: undefined };
}

/** GRID (5+ points) -> GRID (first 3) + a short follow-up TYPOGRAPHIC
 * slide folding the rest in as prose, immediately after it. Grows the
 * array by one and renumbers happen in enforceSlideRhythm's final
 * renumber() pass. */
function splitGridSlide(slides: SlideContent[], index: number): SlideContent[] {
  const original = slides[index];
  const overflow = original.bullets.slice(3);
  const folded = overflow.map((b) => (b.title ? `${b.title}: ${b.description}` : b.description)).join(' ');

  const trimmed: SlideContent = { ...original, bullets: original.bullets.slice(0, 3) };
  const followUp: SlideContent = {
    ...original,
    id: `${original.id}-split`,
    headline: `${original.headline} — Continued`,
    body: folded.slice(0, 400),
    bullets: [],
    stat: undefined,
    quote: undefined,
    imageUrl: undefined,
  };

  const result = slides.slice();
  result.splice(index, 1, trimmed, followUp);
  return result;
}

/** Recompute index/total/isTitleSlide after any length-changing
 * transform — preserves object identity for entries that were already
 * correct (i.e. nothing before them changed the deck's length), so a
 * deck enforceSlideRhythm() didn't need to touch comes back with every
 * slide reference-equal to its input, not just value-equal. */
function renumber(slides: SlideContent[]): SlideContent[] {
  const total = slides.length;
  return slides.map((s, i) => {
    const index = i + 1;
    const isTitleSlide = i === 0;
    if (s.index === index && s.total === total && s.isTitleSlide === isTitleSlide) return s;
    return { ...s, index, total, isTitleSlide };
  });
}

/**
 * The AISlideItem[]-level wiring both generation paths call — client.ts's
 * generatePresentation() (cloud) and ruleBasedGenerator.ts's
 * generateDynamicSlidesFromText() (local fallback) both produce
 * AISlideItem[], one stage earlier than the SlideContent[]
 * enforceSlideRhythm() itself operates on (SlideContent needs an
 * imageUrl/iconSvgData that only get resolved later, inside
 * slideComposer.ts). This builds a regime-detection-only SlideContent[]
 * (a real, empty-vs-non-empty imageUrl stand-in is enough for
 * detectRegime() — the real resolved URL doesn't matter for *which*
 * regime a slide lands in), runs enforceSlideRhythm(), and reconciles
 * whatever it changed back onto real AISlideItems by id — an unchanged
 * slide is returned as the exact original object (lossless: notes,
 * diagram, icon, attachedAssetName, everything), never round-tripped
 * through the lossier SlideContent shape.
 */
export function applyRhythmToAISlides(aiSlides: AISlideItem[]): AISlideItem[] {
  if (aiSlides.length === 0) return aiSlides;
  const total = aiSlides.length;

  const contents = aiSlides.map((slide, i) =>
    buildSlideContent(slide, {
      index: i + 1,
      total,
      imageUrl: slide.attachedAssetId ? 'placeholder' : '',
      iconSvgData: '',
    })
  );

  const adjusted = enforceSlideRhythm(contents);
  if (adjusted.length === contents.length && adjusted.every((c, i) => c === contents[i])) {
    return aiSlides;
  }

  const originalIndexById = new Map(contents.map((c, i) => [c.id, i]));

  return adjusted.map((content) => {
    const originalIndex = originalIndexById.get(content.id);
    if (originalIndex !== undefined) {
      if (contents[originalIndex] === content) return aiSlides[originalIndex];
      return reconcileAISlide(aiSlides[originalIndex], content);
    }
    // A synthesized split follow-up slide (its id has no match in the
    // original set) — always plain typographic, so a fresh, minimal
    // AISlideItem is the whole story; there's no richer original to
    // preserve fields from.
    return {
      headline: content.headline,
      body: content.body || '',
      subheading: content.eyebrow,
      iconName: 'sparkles',
      notes: content.notes,
      diagram: content.diagram,
    };
  });
}

/** Reflect enforceSlideRhythm()'s facet-stripping back onto the real
 * AISlideItem fields that produced them, keeping every field it didn't
 * touch (icon, attachedAssetName, notes, diagram, subheading...). */
function reconcileAISlide(original: AISlideItem, content: SlideContent): AISlideItem {
  const next: AISlideItem = { ...original, headline: content.headline, body: content.body || '' };
  if (content.bullets.length === 0) next.points = undefined;
  if (!content.stat) {
    next.statValue = undefined;
    next.statLabel = undefined;
  }
  if (!content.quote) next.author = undefined;
  if (!content.imageUrl) {
    next.attachedAssetId = undefined;
    next.attachedAssetName = undefined;
  }
  return next;
}
