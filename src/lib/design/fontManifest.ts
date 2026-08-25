/**
 * Single source of truth for every web font this app uses. Every theme's
 * fontHeading/fontBody must resolve to a family listed here — that's what
 * lets the app guarantee the font it renders in the canvas preview is the
 * exact same one it asked Google Fonts to load, and that PPTX export knows
 * how to substitute it (PowerPoint has no access to Google Fonts, so every
 * web font needs a named fallback that reliably ships with Windows/Office).
 *
 * Before this existed, index.html hand-listed a Google Fonts <link> that
 * had quietly drifted out of sync with the themes referencing them — two
 * theme fonts (Syne, Bricolage Grotesque) were never actually loaded, so
 * they silently fell back to a system font in the browser too.
 *
 * Real Canva decks license a wide range of commercial foundry fonts (see
 * scripts/extractDesignGrammar.js's fontPairing data — Neue Montreal,
 * Telegraf, TT Hoves, AC Steelfish, Aileron, Heading Now...) that aren't
 * freely available, so this app doesn't attempt to reproduce those exact
 * names — every family below is a real, freely-licensed Google Font.
 */
export interface GoogleFontSpec {
  family: string;
  /** Upright weights to load. */
  weights: number[];
  /** Weights that should also get an italic cut (e.g. Playfair Display's
   * quote styling). Omit for families with no italic use. */
  italicWeights?: number[];
}

export const GOOGLE_FONT_SPECS: GoogleFontSpec[] = [
  { family: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Plus Jakarta Sans', weights: [400, 500, 600, 700, 800] },
  { family: 'Playfair Display', weights: [600, 700], italicWeights: [400] },
  { family: 'Space Grotesk', weights: [500, 700] },
  { family: 'Syne', weights: [600, 700, 800] },
  { family: 'Outfit', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Fira Code', weights: [400, 500, 600] },
  { family: 'Bricolage Grotesque', weights: [400, 600, 700, 800] },
  { family: 'Manrope', weights: [300, 400, 500, 600, 700, 800] },
  { family: 'Archivo', weights: [400, 500, 600, 700, 800, 900] },
];

export interface FontPairing {
  fontHeading: string;
  fontBody: string;
  singleFamily: boolean;
  /** Content-tone fit (see themeGenerator.ts's Gravity type): 'restrained'
   * for clean grotesk/serif pairings a somber brief can safely land on;
   * 'playful' for heavy/condensed/quirky display faces that read as too
   * high-energy for serious subject matter; 'neutral' for anything
   * ambiguous. Only 'restrained' pairings are eligible when generateTheme()
   * is called with gravity: 'somber'. Optional so a future pairing added
   * without a tag degrades to "eligible everywhere except a somber pick"
   * rather than a type error. */
  mood?: 'restrained' | 'playful' | 'neutral';
}

/**
 * A pool of real, GOOGLE_FONT_SPECS-safe font pairings for
 * themeGenerator.ts to pick from — every family referenced here is
 * already loaded (see GOOGLE_FONT_SPECS above) with the weights it's
 * used at. 8 two-family pairings + 8 single-family systems, echoing the
 * ~40/60 single/two-family split real decks show (see
 * scripts/extractDesignGrammar.js's fontPairing.singleFamilyRatio).
 *
 * Single-family entries stick to families with a true upright 400 (or,
 * for Space Grotesk, 500 — its lightest loaded weight) so body copy
 * doesn't default to a heavy display weight — except Syne, deliberately
 * included at 600+ only: a "bold-mono" system in the same spirit as
 * Archivo-at-every-weight, not an oversight. Playfair Display never
 * appears as a body font here for the same reason: this manifest only
 * loads it at 600/700 upright (plus a 400 italic for quote styling), no
 * true body weight.
 */
export const FONT_PAIRINGS: FontPairing[] = [
  // Two-family
  { fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'restrained' },
  { fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'neutral' },
  { fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'neutral' },
  { fontHeading: "'Syne', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'playful' },
  { fontHeading: "'Outfit', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'neutral' },
  { fontHeading: "'Bricolage Grotesque', sans-serif", fontBody: "'Manrope', sans-serif", singleFamily: false, mood: 'playful' },
  { fontHeading: "'Archivo', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: false, mood: 'playful' },
  { fontHeading: "'Playfair Display', serif", fontBody: "'Manrope', sans-serif", singleFamily: false, mood: 'restrained' },
  // Single-family
  { fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", singleFamily: true, mood: 'restrained' },
  { fontHeading: "'Plus Jakarta Sans', 'Inter', sans-serif", fontBody: "'Plus Jakarta Sans', 'Inter', sans-serif", singleFamily: true, mood: 'neutral' },
  { fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif", singleFamily: true, mood: 'neutral' },
  { fontHeading: "'Outfit', sans-serif", fontBody: "'Outfit', sans-serif", singleFamily: true, mood: 'neutral' },
  { fontHeading: "'Bricolage Grotesque', sans-serif", fontBody: "'Bricolage Grotesque', sans-serif", singleFamily: true, mood: 'playful' },
  { fontHeading: "'Manrope', sans-serif", fontBody: "'Manrope', sans-serif", singleFamily: true, mood: 'restrained' },
  { fontHeading: "'Archivo', sans-serif", fontBody: "'Archivo', sans-serif", singleFamily: true, mood: 'playful' },
  { fontHeading: "'Syne', sans-serif", fontBody: "'Syne', sans-serif", singleFamily: true, mood: 'playful' },
];

function buildFamilyParam(spec: GoogleFontSpec): string {
  const familyParam = spec.family.replace(/\s+/g, '+');
  if (!spec.italicWeights || spec.italicWeights.length === 0) {
    return `family=${familyParam}:wght@${spec.weights.join(';')}`;
  }
  const axis: Array<[0 | 1, number]> = [
    ...spec.weights.map((w): [0 | 1, number] => [0, w]),
    ...spec.italicWeights.map((w): [0 | 1, number] => [1, w]),
  ].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return `family=${familyParam}:ital,wght@${axis.map(([ital, w]) => `${ital},${w}`).join(';')}`;
}

/** The exact Google Fonts CSS2 stylesheet URL covering every family this
 * app themes with — injected at runtime (see main.tsx) so it can never
 * drift from GOOGLE_FONT_SPECS the way a hand-maintained <link> could. */
export function buildGoogleFontsHref(): string {
  return `https://fonts.googleapis.com/css2?${GOOGLE_FONT_SPECS.map(buildFamilyParam).join('&')}&display=swap`;
}

/**
 * Nearest font PowerPoint can actually render without the source file —
 * i.e. one that ships with Windows/Office by default — for every family
 * in GOOGLE_FONT_SPECS, chosen by typographic category (serif / geometric
 * sans / monospace / condensed) rather than guesswork.
 */
export const PPTX_FONT_FALLBACKS: Record<string, string> = {
  Inter: 'Segoe UI',
  'Plus Jakarta Sans': 'Segoe UI',
  'Playfair Display': 'Georgia',
  'Space Grotesk': 'Segoe UI',
  Syne: 'Arial',
  Outfit: 'Century Gothic',
  'Fira Code': 'Consolas',
  'Bricolage Grotesque': 'Segoe UI',
  Manrope: 'Segoe UI',
  Archivo: 'Arial',
};

/** Pull the first, primary family out of a CSS font-family stack (e.g.
 * `"'Plus Jakarta Sans', 'Inter', sans-serif"` -> `Plus Jakarta Sans`). */
function extractPrimaryFontName(fontFamily: string): string {
  const first = fontFamily.split(',')[0]?.trim() ?? fontFamily;
  return first.replace(/^['"]|['"]$/g, '');
}

/**
 * Resolve any font-family value used in the scene graph (a bare family
 * name, or a full CSS stack like a theme's `fontHeading`) to a font
 * PowerPoint can actually render. Exact manifest match first; a keyword
 * heuristic on the full input as a safety net for anything not yet in the
 * manifest (a newly mined font, a stray CSS stack).
 */
export function resolvePptxFont(fontFamily: string | undefined): string {
  if (!fontFamily) return 'Calibri';

  const primary = extractPrimaryFontName(fontFamily);
  if (PPTX_FONT_FALLBACKS[primary]) return PPTX_FONT_FALLBACKS[primary];

  const lower = fontFamily.toLowerCase();
  if (/mono|code|console/.test(lower)) return 'Consolas';
  if (/(playfair|georgia|times|cambria|serif)/.test(lower) && !/sans/.test(lower)) return 'Georgia';
  if (/(condensed|narrow)/.test(lower)) return 'Arial Narrow';
  if (/(outfit|century gothic|poppins)/.test(lower)) return 'Century Gothic';
  return 'Segoe UI';
}
