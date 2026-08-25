import { generateTheme } from './themeGenerator';
import type { Gravity } from './themeGenerator';

export interface ThemeTokens {
  id: string;
  name: string;
  canvasBg: string;       // Primary background for all slides
  heroBg: string;         // Background for Cover & Anchor slides
  sidebarBg?: string;     // Solid Accent/Navy background for 2-Tone Asymmetric Split
  cardBg: string;         // Surface color for containers/cards
  textPrimary: string;    // Main headline/body color
  textMuted: string;      // Subtitles & metadata
  textHero: string;       // Text color on hero/cover
  accent: string;         // Highlight & key metric color
  accentBadge?: string;   // High-voltage badge/chip highlight color (e.g. Acid Lemon)
  border: string;         // Subtle divider/border lines
  fontHeading: string;    // e.g. 'Playfair Display', 'Syne', 'Space Grotesk'
  fontBody: string;       // e.g. 'Inter', 'Plus Jakarta Sans', 'DM Sans'
  /**
   * Whether this theme's monumental display type (cover headline, stat
   * number) should render bold/black or light/thin. Real Canva decks split
   * roughly 90/10 bold-vs-light on their display face (see
   * scripts/extractDesignGrammar.js's fontPairing.displayWeightCounts) —
   * defaults to 'bold' so every existing theme's behavior is unchanged.
   */
  displayWeight?: 'light' | 'bold';
  /**
   * Content-tone axis this theme was generated with (see
   * themeGenerator.ts's Gravity type) — undefined for the 7 curated
   * MASTER_THEMES, which aren't gravity-aware and stay exactly as
   * designed regardless of a deck's inferred tone. composer.ts reads this
   * to decide whether organic blob decoration should appear at all: a
   * 'somber' theme skips it outright.
   */
  gravity?: Gravity;
}

/**
 * 7 High-Energy Master Themes with Cobalt Kinetic as Flagship.
 *
 * Real Canva decks split close to 40/60 between using a single type family
 * at several weights and pairing two distinct families (see
 * scripts/extractDesignGrammar.js's fontPairing.singleFamilyRatio) — the
 * first 5 themes below are all two-family pairings; 'porcelain-light' and
 * 'carbon-mono' are single-family systems grounded in that finding.
 */
export const MASTER_THEMES: Record<string, ThemeTokens> = {
  'cobalt-kinetic': {
    id: 'cobalt-kinetic',
    name: 'Cobalt Kinetic',
    heroBg: '#080E1E',          // Deep Midnight Blue
    canvasBg: '#F4F6F9',        // Crisp Modern Slate
    sidebarBg: '#0B132B',       // Solid Deep Navy
    cardBg: '#FFFFFF',          // Crisp White Card
    textPrimary: '#0F172A',     // Slate Navy
    textMuted: '#64748B',       // Steel Slate
    textHero: '#FFFFFF',        // Pure White
    accent: '#004BFE',          // Electric Cobalt
    accentBadge: '#E6FF00',     // Acid Lemon for highlight chips
    border: '#E2E8F0',          // Clean border
    fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif",
    fontBody: "'Inter', sans-serif",
  },

  'warm-editorial': {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    canvasBg: '#FBF8F3',          // Warm tactile linen paper
    heroBg: '#0A0D17',            // High-energy dark obsidian hero
    sidebarBg: '#1A1715',         // Dark Espresso sidebar
    cardBg: '#FFFFFF',            // Crisp card surface
    textPrimary: '#1A1715',       // Deep rich espresso
    textMuted: '#6E655F',         // Warm charcoal subtitle
    textHero: '#FFFFFF',          // Crisp white on dark hero
    accent: '#D97706',            // Amber gold highlight
    accentBadge: '#F59E0B',       // Amber badge
    border: '#E8E2D9',            // Delicate linen divider
    fontHeading: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
  },

  'swiss-studio': {
    id: 'swiss-studio',
    name: 'Swiss Studio',
    canvasBg: '#F4F4F6',          // Clean architectural chalk
    heroBg: '#0A0D14',            // Jet black obsidian hero
    sidebarBg: '#111111',         // Jet black sidebar
    cardBg: '#FFFFFF',            // Surface card
    textPrimary: '#111111',       // High-contrast jet black
    textMuted: '#555555',         // Subdued gray
    textHero: '#FFFFFF',          // High-energy white
    accent: '#0044EE',            // Electric Klein Blue
    accentBadge: '#E6FF00',       // Acid Lemon
    border: '#E0E0E6',            // Hairline gray rule
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'Inter', sans-serif",
  },

  'nordic-slate': {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    canvasBg: '#F0F4F8',          // Crisp pale slate
    heroBg: '#0F172A',            // Deep navy slate hero
    sidebarBg: '#0F172A',         // Navy slate sidebar
    cardBg: '#FFFFFF',            // White surface
    textPrimary: '#0F172A',       // Navy slate primary
    textMuted: '#64748B',         // Slate gray
    textHero: '#F8FAFC',          // Light slate white
    accent: '#0284C7',            // Sky azure accent
    accentBadge: '#38BDF8',       // Bright cyan badge
    border: '#CBD5E1',            // Subtle border
    fontHeading: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Inter', sans-serif",
  },

  'midnight-iridescent': {
    id: 'midnight-iridescent',
    name: 'Midnight Iridescent',
    canvasBg: '#111319',          // Deep charcoal canvas
    heroBg: '#07090E',            // Pure void black hero
    sidebarBg: '#0B0D14',         // Midnight sidebar
    cardBg: '#1A1D27',            // Elevated charcoal card
    textPrimary: '#F8FAFC',       // Clean white primary
    textMuted: '#94A3B8',         // Muted silver
    textHero: '#FFFFFF',          // Pure white
    accent: '#004BFE',            // Electric Cobalt
    accentBadge: '#E6FF00',       // Acid Lemon badge
    border: 'rgba(255, 255, 255, 0.1)', // Glass border
    fontHeading: "'Syne', 'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
  },

  'porcelain-light': {
    id: 'porcelain-light',
    name: 'Porcelain Light',
    canvasBg: '#FAF8F5',          // Warm porcelain white
    heroBg: '#161A1D',            // Near-black charcoal hero
    sidebarBg: '#1F2427',         // Charcoal sidebar
    cardBg: '#FFFFFF',            // Crisp card surface
    textPrimary: '#1C1F22',       // Warm near-black
    textMuted: '#6B7280',         // Neutral gray
    textHero: '#F7F5F2',          // Warm off-white on dark
    accent: '#5C7C6C',            // Sage green
    accentBadge: '#E3A98F',       // Soft clay badge
    border: '#E5E1DB',            // Warm hairline
    // Single-family system: Manrope at every weight, never a second
    // typeface — grounded in the ~40% of real decks that do this (e.g.
    // "Neue Montreal"/"Telegraf"/"Inter" used across display and body).
    fontHeading: "'Manrope', sans-serif",
    fontBody: "'Manrope', sans-serif",
    // Airy, editorial mega-display type — the real-deck pattern behind
    // this is "Poppins Light" run at 127pt and "Telegraf Extra-Light".
    displayWeight: 'light',
  },

  'carbon-mono': {
    id: 'carbon-mono',
    name: 'Carbon Mono',
    canvasBg: '#F4F4F5',          // Cool light gray canvas
    heroBg: '#0A0A0B',            // True black hero
    sidebarBg: '#111113',         // Near-black sidebar
    cardBg: '#FFFFFF',            // Crisp card surface
    textPrimary: '#0A0A0B',       // True black
    textMuted: '#6B6B70',         // Neutral gray
    textHero: '#FFFFFF',          // Pure white
    accent: '#FF4B3E',            // Vivid coral-red
    accentBadge: '#FFD23F',       // High-energy yellow badge
    border: '#E4E4E7',            // Cool hairline
    // Single-family system: Archivo at every weight (see porcelain-light).
    fontHeading: "'Archivo', sans-serif",
    fontBody: "'Archivo', sans-serif",
    // Punchy black display type — matches "Inter Bold" run at 371pt in
    // the real samples.
    displayWeight: 'bold',
  },
};

export const DEFAULT_THEME: ThemeTokens = MASTER_THEMES['cobalt-kinetic'];

/**
 * Get a ThemeTokens by ID, generating a fresh procedural one when `id` is
 * set but doesn't name a master theme (a stale/unknown id is a request
 * for *some* real theme, not specifically Cobalt Kinetic) — only a
 * genuinely absent `id` falls back to the flagship default.
 */
export function getThemeById(id?: string): ThemeTokens {
  if (!id) return DEFAULT_THEME;
  const key = id.toLowerCase().trim();
  if (MASTER_THEMES[key]) return MASTER_THEMES[key];

  // Fuzzy match
  const found = Object.values(MASTER_THEMES).find(
    (t) => t.id.includes(key) || t.name.toLowerCase().includes(key)
  );
  if (found) return found;

  return generateTheme();
}

/**
 * Resolve any incoming theme object into a guaranteed ThemeTokens object.
 */
export function resolveThemeTokens(input?: any): ThemeTokens {
  if (!input) return DEFAULT_THEME;

  // An explicit, named theme choice always wins — exact fidelity (right
  // fonts, right displayWeight, right everything) instead of reconstructing
  // one from loose hex fields. This is what AIPresentationTheme.themeId
  // (set by the LLM prompt and the local rule-based generator) is for.
  const explicitId = input.themeId || input.id;
  if (explicitId && MASTER_THEMES[explicitId]) {
    return MASTER_THEMES[explicitId];
  }

  // Already a valid ThemeTokens shape (canvasBg/textPrimary/fontHeading/...)
  if (input.canvasBg && input.heroBg && input.textPrimary && input.accent) {
    return {
      id: input.id || 'custom',
      name: input.name || 'Custom',
      canvasBg: input.canvasBg,
      heroBg: input.heroBg,
      sidebarBg: input.sidebarBg || '#0B132B',
      cardBg: input.cardBg || '#FFFFFF',
      textPrimary: input.textPrimary,
      textMuted: input.textMuted || '#64748B',
      textHero: input.textHero || '#FFFFFF',
      accent: input.accent || '#004BFE',
      accentBadge: input.accentBadge || '#E6FF00',
      border: input.border || '#E2E8F0',
      fontHeading: input.fontHeading || "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontBody: input.fontBody || "'Inter', sans-serif",
      displayWeight: input.displayWeight === 'light' ? 'light' : 'bold',
    };
  }

  // The flatter AIPresentationTheme shape the LLM/local generator actually
  // emit (background/primary/fontHeader, not canvasBg/textPrimary/
  // fontHeading) — reconstruct a full ThemeTokens from it when no themeId
  // was recognized above.
  if (input.background && input.accent) {
    return {
      id: 'custom',
      name: 'Custom',
      canvasBg: input.background,
      heroBg: input.heroBg || input.background,
      sidebarBg: input.sidebarBg || '#0B132B',
      cardBg: input.cardBg || '#FFFFFF',
      textPrimary: input.primary || '#0F172A',
      textMuted: input.textMuted || '#64748B',
      textHero: input.textHero || '#FFFFFF',
      accent: input.accent,
      accentBadge: input.accentBadge || '#E6FF00',
      border: input.border || '#E2E8F0',
      fontHeading: input.fontHeader || input.fontHeading || "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontBody: input.fontBody || "'Inter', sans-serif",
      displayWeight: input.displayWeight === 'light' ? 'light' : 'bold',
    };
  }

  // An explicit id/themeId was given but didn't match a master theme
  // (or a full/flat hex shape) — that's a request for *some* real,
  // distinct theme, not silent Cobalt Kinetic every time. Generating one
  // here is what makes resolveThemeTokens itself un-bottlenecked, for
  // every caller (slideComposer.ts re-resolving an already-picked theme
  // included), not just the one call site in client.ts that has a
  // themeMood to bias it with (see cleanAndParseJsonResponse).
  if (explicitId) {
    return generateTheme();
  }

  return DEFAULT_THEME;
}
