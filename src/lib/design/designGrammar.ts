import grammarJson from './designGrammar.json';

/**
 * Design Grammar — spatial math mined from the real Canva decks in
 * /canva-samples (see scripts/extractDesignGrammar.js). This is the single
 * source of the ratios the scene-graph composer (lib/engine/composer.ts)
 * uses to place and size content: it contains no per-slide coordinates or
 * copied text, only aggregate proportions and rules.
 */
export interface ContrastPair {
  bg: string;
  fg: string;
  contrast: number;
  count: number;
}

export interface DesignGrammar {
  version: string;
  generatedAt: string;
  sourceDeckCount: number;
  sourceSlideCount: number;
  margins: {
    xRatio: number;
    yRatio: number;
  };
  typeScale: {
    titleToCanvasHeightRatio: number;
    bodyToCanvasHeightRatio: number;
    titleToBodyRatio: number;
  };
  spacing: {
    stackGapRatio: number;
    columnGutterRatio: number;
  };
  imageColumnRatio: number;
  contentDensity: {
    medianTextBlocksPerSlide: number;
  };
  contrastPairs: ContrastPair[];
}

/** Sane fallback in case the extracted JSON is ever missing/malformed. */
const FALLBACK_GRAMMAR: DesignGrammar = {
  version: '0.0.0-fallback',
  generatedAt: '',
  sourceDeckCount: 0,
  sourceSlideCount: 0,
  margins: { xRatio: 0.06, yRatio: 0.1 },
  typeScale: { titleToCanvasHeightRatio: 0.08, bodyToCanvasHeightRatio: 0.018, titleToBodyRatio: 4 },
  spacing: { stackGapRatio: 0.03, columnGutterRatio: 0.03 },
  imageColumnRatio: 0.4,
  contentDensity: { medianTextBlocksPerSlide: 5 },
  contrastPairs: [
    { bg: '#F4F6F9', fg: '#0F172A', contrast: 14, count: 1 },
    { bg: '#080E1E', fg: '#FFFFFF', contrast: 18, count: 1 },
  ],
};

function isValidGrammar(input: unknown): input is DesignGrammar {
  const g = input as Partial<DesignGrammar> | undefined;
  return Boolean(
    g &&
      g.margins &&
      g.typeScale &&
      g.spacing &&
      typeof g.imageColumnRatio === 'number' &&
      Array.isArray(g.contrastPairs)
  );
}

export const DESIGN_GRAMMAR: DesignGrammar = isValidGrammar(grammarJson)
  ? (grammarJson as DesignGrammar)
  : FALLBACK_GRAMMAR;

/**
 * Pick the best real, empirically-used contrast pair for a given background
 * color (falls back to the highest-contrast pair overall if none share it).
 */
export function pickContrastPair(preferBg?: string): ContrastPair {
  const pairs = DESIGN_GRAMMAR.contrastPairs.length > 0 ? DESIGN_GRAMMAR.contrastPairs : FALLBACK_GRAMMAR.contrastPairs;
  if (preferBg) {
    const match = pairs.find((p) => p.bg.toUpperCase() === preferBg.toUpperCase());
    if (match) return match;
  }
  return pairs[0];
}
