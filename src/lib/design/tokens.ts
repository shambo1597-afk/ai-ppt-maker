import { generateTheme, hueHintForMood } from './themeGenerator';
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
   * themeGenerator.ts's Gravity type). composer.ts reads this to decide
   * whether organic blob decoration should appear at all: a 'somber'
   * theme skips it outright.
   */
  gravity?: Gravity;
}

/**
 * Every theme is procedurally generated — see themeGenerator.ts's
 * generateTheme(). There is no fixed registry of named/curated themes to
 * fall back to any more (that was a hardcoded 7-entry set, removed so two
 * decks never silently converge on the same look). A function rather
 * than a module-load-time const: a const would
 * freeze one "default" theme for the whole app session, while calling
 * generateTheme() fresh each time this is actually needed gives every
 * genuinely-untargeted request its own distinct theme.
 */
export function getDefaultTheme(): ThemeTokens {
  return generateTheme();
}

/**
 * Get a ThemeTokens by id. With no fixed theme registry to look up
 * against, any non-empty `id` (recognized or not — there's nothing left
 * to "recognize") resolves to a freshly generated theme, hue-biased by
 * that id string via hueHintForMood() so a stale/unknown id (e.g. one
 * persisted from before this change, or a caller passing an arbitrary
 * string) still lands somewhere topically sensible instead of being
 * silently ignored. Only a genuinely absent `id` skips the hue bias.
 */
export function getThemeById(id?: string): ThemeTokens {
  if (!id) return getDefaultTheme();
  return generateTheme({ hueHint: hueHintForMood(id) });
}

/**
 * Resolve any incoming theme object into a guaranteed ThemeTokens object.
 */
export function resolveThemeTokens(input?: any): ThemeTokens {
  if (!input) return getDefaultTheme();

  // client.ts/ruleBasedGenerator.ts embed the full ThemeTokens object
  // generateTheme() produced under `tokens`, alongside a flatter hex/font
  // preview (AIPresentationTheme's own background/primary/fontHeader
  // shape) meant for display, not round-tripping. Checking `tokens` first
  // recovers every field exactly (displayWeight, gravity, accentBadge...)
  // instead of falling through to the flat-hex reconstruction below, which
  // has no way to recover fields that aren't part of that flat schema.
  if (input.tokens && input.tokens.canvasBg && input.tokens.heroBg && input.tokens.textPrimary && input.tokens.accent) {
    return input.tokens;
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
  // fontHeading) — reconstruct a full ThemeTokens from it when it isn't
  // already a full ThemeTokens shape.
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

  // An id/themeId was given but didn't match a full/flat hex shape above
  // — that's a request for *some* real, distinct theme, not a fixed
  // default every time. Generating one here (hue-biased by the id string,
  // same as getThemeById()) is what makes resolveThemeTokens itself
  // un-bottlenecked, for every caller (slideComposer.ts re-resolving an
  // already-picked theme included), not just the one call site in
  // client.ts that has a themeMood to bias it with directly.
  const explicitId = input.themeId || input.id;
  if (explicitId) {
    return generateTheme({ hueHint: hueHintForMood(explicitId) });
  }

  return getDefaultTheme();
}
