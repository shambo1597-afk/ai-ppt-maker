import type { ThemeTokens } from './tokens';
import { hexToHsl, hslToHex, mixHex } from './colorMath';
import { DESIGN_GRAMMAR, deriveGradient, ContrastPair } from './designGrammar';
import { FONT_PAIRINGS } from './fontManifest';
import { weightedPick } from '../utils/prng';

/**
 * Procedural theme generation — the antidote to every deck on the same
 * topic converging on the same one of 7 fixed palettes. Instead of
 * looking a theme up by id, this derives a full ThemeTokens from a
 * random (or mood-biased) base hue, reusing the *rules* mined from the
 * real Canva decks (deriveGradient's hue-shift/lightness/saturation
 * relationship, and the real (bg,fg) contrast pairs) rather than
 * inventing color math from scratch or picking from a fixed list.
 */
/**
 * Content-tone axis, independent of hue. Two decks can share a hue (both
 * "blue") while one is a somber public-health brief and the other a bold
 * product launch — hue alone can't tell them apart, so this is a second,
 * orthogonal knob generateTheme() reads to constrain energy (saturation,
 * darkCanvas odds, font restraint, whether organic blob decoration even
 * appears) regardless of which hue got picked. 'energetic' is deliberately
 * never inferred locally (see inferGravity()) — only an explicit LLM
 * classification opts a deck into the more vivid ceiling.
 */
export type Gravity = 'somber' | 'neutral' | 'energetic';

export interface GenerateThemeOptions {
  /** Bias the base hue toward this 0-360 value (e.g. from a topic-mood
   * hint) instead of a fully uniform-random one — still randomized in a
   * window around it, so the same mood doesn't always land on the exact
   * same color. Omit for a fully random hue. */
  hueHint?: number;
  /** Content-tone axis (see the Gravity doc comment). Omit/'neutral' for
   * today's existing random ranges, unchanged. */
  gravity?: Gravity;
  /** Injectable PRNG (0..1, same contract as Math.random) so callers can
   * seed generation — see prng.ts / deckSeed threading. Defaults to
   * Math.random for ordinary "give me something new" calls. */
  rand?: () => number;
}

/**
 * Pick a real mined (bg,fg) contrast pair whose background is the same
 * light-vs-dark bucket as `bgHex`, and reapply its *measured relative
 * lightness offset* (not its literal hex — that belongs to a totally
 * different, unrelated background) onto bgHex. This is what "reuse the
 * empirical contrastPairs rather than inventing contrast ratios from
 * scratch" means in practice: the real decks' actual light-bg-gets-dark-
 * ink / dark-bg-gets-light-ink relationship, transplanted onto this
 * theme's own procedurally-chosen background instead of a fixed
 * "always pure black or white" rule invented from nothing.
 */
function deriveTextColor(bgHex: string, hue: number, rand: () => number): string {
  const bgHsl = hexToHsl(bgHex);
  if (!bgHsl) return '#0F172A';
  const bgIsDark = bgHsl.l < 0.5;

  const pairs: ContrastPair[] = DESIGN_GRAMMAR.contrastPairs;
  const bucket = pairs.filter((p) => {
    const pBg = hexToHsl(p.bg);
    return pBg ? (pBg.l < 0.5) === bgIsDark : false;
  });
  const pool = bucket.length > 0 ? bucket : pairs;
  const chosen = weightedPick(pool, rand);

  const fgHsl = hexToHsl(chosen.fg);
  const pairBgHsl = hexToHsl(chosen.bg);
  if (!fgHsl || !pairBgHsl) return bgIsDark ? '#FFFFFF' : '#0F172A';

  const l = Math.max(0.02, Math.min(0.98, bgHsl.l + (fgHsl.l - pairBgHsl.l)));
  // Keep primary/body ink near-neutral even when the mined pair we
  // borrowed the lightness jump from happened to be a colored one (a
  // handful of real pairs are, e.g. a red or blue accent-as-text) — a
  // whole paragraph in a saturated accent color reads as a mistake, not
  // a design choice, so cap saturation rather than copy it verbatim.
  const s = Math.min(fgHsl.s, 0.14);
  return hslToHex({ h: hue, s, l });
}

export function generateTheme(options: GenerateThemeOptions = {}): ThemeTokens {
  const rand = options.rand || Math.random;
  const gravity: Gravity = options.gravity || 'neutral';
  const hue =
    options.hueHint !== undefined
      ? (((options.hueHint + (rand() - 0.5) * 40) % 360) + 360) % 360
      : rand() * 360;

  // Light-canvas-with-dark-hero is the dominant pattern this app's themes
  // have always leaned toward, with a dark canvas as the rarer exception —
  // roughly 1-in-5 generated themes follow suit. A somber topic almost
  // never rolls a heavy, saturated dark-canvas "energetic" look (see the
  // saturation cap below), so its odds are pushed near zero rather than
  // removed outright — a restrained dark canvas can still be exactly the
  // right somber-appropriate call once in a while.
  const darkCanvasOdds = gravity === 'somber' ? 0.03 : 0.2;
  const darkCanvas = rand() < darkCanvasOdds;

  const canvasBg = darkCanvas
    ? hslToHex({ h: hue, s: 0.1 + rand() * 0.1, l: 0.06 + rand() * 0.05 })
    : hslToHex({ h: hue, s: 0.06 + rand() * 0.3, l: 0.95 + rand() * 0.02 });
  const heroBg = hslToHex({ h: hue, s: 0.15 + rand() * 0.35, l: 0.03 + rand() * 0.06 });
  const sidebarHsl = hexToHsl(heroBg)!;
  const sidebarBg = hslToHex({ h: sidebarHsl.h, s: sidebarHsl.s, l: Math.max(0.01, sidebarHsl.l - 0.015) });

  // The one place gravity most directly reads as "energy": how vivid the
  // theme's own accent color is allowed to be. A somber brief is capped
  // well below the default floor; an energetic one is pushed toward (and
  // past) the default ceiling. Neutral/unset keeps today's exact range.
  const accentSaturation =
    gravity === 'somber' ? 0.25 + rand() * 0.25 : gravity === 'energetic' ? 0.7 + rand() * 0.3 : 0.55 + rand() * 0.35;
  const accent = hslToHex({ h: hue, s: accentSaturation, l: 0.4 + rand() * 0.16 });
  // deriveGradient's mined rule was fit for a gradient's second stop
  // (typically a soft, much-lighter wash — see its own lightnessDelta),
  // so a smaller intensity keeps the badge a second *vivid* highlight
  // color (the real accentBadge role — e.g. Acid Lemon next to Electric
  // Cobalt) rather than washing the accent out toward white. An energetic
  // deck can afford to push that boldness a bit further; somber/neutral
  // keep the existing range.
  const gradientIntensity = gravity === 'energetic' ? 0.45 + rand() * 0.35 : 0.35 + rand() * 0.3;
  const accentBadge = deriveGradient(accent, gradientIntensity, rand).to;

  const textPrimary = deriveTextColor(canvasBg, hue, rand);
  const textHero = deriveTextColor(heroBg, hue, rand);
  const textMuted = mixHex(textPrimary, canvasBg, 0.42);
  const border = mixHex(textPrimary, canvasBg, 0.93);
  const cardBg = darkCanvas ? mixHex(canvasBg, '#FFFFFF', 0.05) : '#FFFFFF';

  // Somber content is restricted to the fontManifest.ts pairings tagged
  // 'restrained' (clean grotesk/serif — never a heavy/quirky display
  // face); neutral/energetic draw from the full pool as before.
  const restrainedPairings = FONT_PAIRINGS.filter((p) => p.mood === 'restrained');
  const fontPool = gravity === 'somber' && restrainedPairings.length > 0 ? restrainedPairings : FONT_PAIRINGS;
  const pairing = fontPool[Math.floor(rand() * fontPool.length)];
  // Real decks split close to 90/10 bold-vs-light display type (see
  // ThemeTokens.displayWeight's own doc comment) — mirrored here rather
  // than defaulting every generated theme to bold.
  const displayWeight: 'light' | 'bold' = rand() < 0.9 ? 'bold' : 'light';

  const id = `generated-${Math.round(hue)}-${Math.floor(rand() * 1e6).toString(36)}`;

  return {
    id,
    name: 'Generated Theme',
    canvasBg,
    heroBg,
    sidebarBg,
    cardBg,
    textPrimary,
    textMuted,
    textHero,
    accent,
    accentBadge,
    border,
    fontHeading: pairing.fontHeading,
    fontBody: pairing.fontBody,
    displayWeight,
    gravity,
  };
}

/**
 * Explicit-negative-list somber signal — subject matter serious enough
 * that no roll of the dice should ever land it on a bouncy, saturated
 * "energetic" look. Checked as inferGravity()'s first and only positive
 * classification: a match forces 'somber' outright, regardless of any
 * other word in the text (a "pandemic response" brief is somber even if
 * it also happens to mention "growth" or "launch"). Deliberately narrow
 * and literal rather than a broad sentiment model — a false negative here
 * just means a neutral (not energetic) theme, never a wrong-direction
 * one, and a false positive is rare given how specific these terms are.
 */
const SOMBER_SIGNAL_KEYWORDS = [
  'crisis',
  'pandemic',
  'epidemic',
  'outbreak',
  'mortality',
  'fatality',
  'fatalities',
  'casualties',
  'death',
  'deaths',
  'grief',
  'grieving',
  'bereavement',
  'layoff',
  'layoffs',
  'lawsuit',
  'litigation',
  'bankruptcy',
  'insolvency',
  'disaster',
  'emergency',
  'famine',
  'war',
  'conflict zone',
  'humanitarian crisis',
  'abuse',
  'trauma',
  'terminal illness',
  'recall notice',
  'data breach',
];

/**
 * Keyword fallback for a slide-tone classification when the model didn't
 * emit AIPresentationTheme.themeGravity (or wasn't run at all — see
 * ruleBasedGenerator.ts, the local zero-API path). Only ever resolves to
 * 'somber' or 'neutral': 'energetic' is a deliberate, explicit choice a
 * human or the LLM makes about celebratory/launch content, never something
 * a keyword scan should guess its way into — guessing wrong toward
 * "somber" just under-decorates a slide that could've been bolder, but
 * guessing wrong toward "energetic" is the exact failure this axis exists
 * to prevent (a crisis brief with bouncy blobs).
 */
export function inferGravity(text: string): Gravity {
  const lower = text.toLowerCase();
  if (SOMBER_SIGNAL_KEYWORDS.some((kw) => lower.includes(kw))) return 'somber';
  return 'neutral';
}

/**
 * Soft keyword -> hue-family hint, the same "keyword implies X" idea
 * ruleBasedGenerator.ts already uses for theme/icon selection, applied
 * to a mood phrase instead of raw brief text. Deliberately coarse and
 * order-sensitive (first match wins) — this only needs to bias
 * generateTheme() toward a plausible neighborhood, not pin an exact hue;
 * genuine per-call randomness still comes from generateTheme() itself.
 */
const MOOD_HUE_HINTS: Array<{ keywords: string[]; hue: number }> = [
  { keywords: ['tech', 'engineering', 'cyber', 'infrastructure', 'data', 'cloud', 'ai', 'software'], hue: 222 },
  { keywords: ['finance', 'enterprise', 'corporate', 'healthcare', 'medical', 'legal'], hue: 205 },
  { keywords: ['biotech', 'genomic', 'science', 'research', 'lab'], hue: 165 },
  { keywords: ['wellness', 'lifestyle', 'craft', 'community', 'culture', 'calm', 'organic', 'nature'], hue: 140 },
  { keywords: ['editorial', 'architecture', 'monograph', 'design', 'studio'], hue: 30 },
  { keywords: ['warm', 'earthy', 'terracotta', 'amber'], hue: 25 },
  { keywords: ['launch', 'startup', 'consumer', 'campaign', 'product', 'energetic', 'bold'], hue: 8 },
  { keywords: ['luxury', 'premium', 'creative', 'bold color', 'playful'], hue: 285 },
  { keywords: ['finance growth', 'investor', 'pitch'], hue: 155 },
];

/** Map a free-text mood description (e.g. "high-energy tech") to a hue
 * hint for generateTheme(), or undefined when nothing matches — a
 * genuinely unrecognized mood should still get a theme (a fully random
 * hue), not fall back to a fixed default palette. */
export function hueHintForMood(mood: string | undefined): number | undefined {
  if (!mood) return undefined;
  const lower = mood.toLowerCase();
  for (const entry of MOOD_HUE_HINTS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry.hue;
  }
  return undefined;
}
