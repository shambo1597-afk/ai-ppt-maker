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
}

/**
 * 5 High-Energy Master Themes with Cobalt Kinetic as Flagship
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
};

export const DEFAULT_THEME: ThemeTokens = MASTER_THEMES['cobalt-kinetic'];

/**
 * Get a ThemeTokens by ID or default to Cobalt Kinetic
 */
export function getThemeById(id?: string): ThemeTokens {
  if (!id) return DEFAULT_THEME;
  const key = id.toLowerCase().trim();
  if (MASTER_THEMES[key]) return MASTER_THEMES[key];

  // Fuzzy match
  const found = Object.values(MASTER_THEMES).find(
    (t) => t.id.includes(key) || t.name.toLowerCase().includes(key)
  );
  return found || DEFAULT_THEME;
}

/**
 * Resolve any incoming theme object into a guaranteed ThemeTokens object.
 */
export function resolveThemeTokens(input?: any): ThemeTokens {
  if (!input) return DEFAULT_THEME;

  // Already a valid ThemeTokens
  if (input.canvasBg && input.heroBg && input.textPrimary && input.accent) {
    return {
      id: input.id || 'cobalt-kinetic',
      name: input.name || 'Cobalt Kinetic',
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
    };
  }

  // Check if it has a matched ID
  if (input.id && MASTER_THEMES[input.id]) {
    return MASTER_THEMES[input.id];
  }

  // Map legacy themes to Cobalt Kinetic by default
  return DEFAULT_THEME;
}
