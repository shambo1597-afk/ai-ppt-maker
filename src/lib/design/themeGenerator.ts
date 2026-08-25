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
export interface GenerateThemeOptions {
  /** Bias the base hue toward this 0-360 value (e.g. from a topic-mood
   * hint) instead of a fully uniform-random one — still randomized in a
   * window around it, so the same mood doesn't always land on the exact
   * same color. Omit for a fully random hue. */
  hueHint?: number;
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
  const hue =
    options.hueHint !== undefined
      ? (((options.hueHint + (rand() - 0.5) * 40) % 360) + 360) % 360
      : rand() * 360;

  // Real master themes are overwhelmingly light-canvas-with-dark-hero
  // (6 of 7) with midnight-iridescent the one dark-canvas exception —
  // roughly 1-in-5 generated themes follow suit.
  const darkCanvas = rand() < 0.2;

  const canvasBg = darkCanvas
    ? hslToHex({ h: hue, s: 0.1 + rand() * 0.1, l: 0.06 + rand() * 0.05 })
    : hslToHex({ h: hue, s: 0.06 + rand() * 0.3, l: 0.95 + rand() * 0.02 });
  const heroBg = hslToHex({ h: hue, s: 0.15 + rand() * 0.35, l: 0.03 + rand() * 0.06 });
  const sidebarHsl = hexToHsl(heroBg)!;
  const sidebarBg = hslToHex({ h: sidebarHsl.h, s: sidebarHsl.s, l: Math.max(0.01, sidebarHsl.l - 0.015) });

  const accent = hslToHex({ h: hue, s: 0.55 + rand() * 0.35, l: 0.4 + rand() * 0.16 });
  // deriveGradient's mined rule was fit for a gradient's second stop
  // (typically a soft, much-lighter wash — see its own lightnessDelta),
  // so a smaller intensity keeps the badge a second *vivid* highlight
  // color (the real accentBadge role — e.g. Acid Lemon next to Electric
  // Cobalt) rather than washing the accent out toward white.
  const accentBadge = deriveGradient(accent, 0.35 + rand() * 0.3, rand).to;

  const textPrimary = deriveTextColor(canvasBg, hue, rand);
  const textHero = deriveTextColor(heroBg, hue, rand);
  const textMuted = mixHex(textPrimary, canvasBg, 0.42);
  const border = mixHex(textPrimary, canvasBg, 0.93);
  const cardBg = darkCanvas ? mixHex(canvasBg, '#FFFFFF', 0.05) : '#FFFFFF';

  const pairing = FONT_PAIRINGS[Math.floor(rand() * FONT_PAIRINGS.length)];
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
  };
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
