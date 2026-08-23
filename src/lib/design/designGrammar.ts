import grammarJson from './designGrammar.json';
import { hexToHsl, hslToHex } from './colorMath';

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

export type GradientDirection = 'to-r' | 'to-br' | 'to-b' | 'to-bl';

export interface GradientPair {
  from: string;
  to: string;
  direction: GradientDirection;
  count: number;
}

/**
 * The learned *structure* of a real Canva gradient — how much lighter,
 * less saturated, and hue-shifted the second stop tends to be relative to
 * the first — rather than a literal palette. deriveGradient() re-applies
 * this rule to any theme's own base color.
 */
export interface GradientRule {
  hueShiftDeg: number;
  lightnessDelta: number;
  saturationDelta: number;
  direction: GradientDirection;
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
  gradientPairs: GradientPair[];
  gradientRule: GradientRule;
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
  gradientPairs: [{ from: '#478CF6', to: '#FFFFFF', direction: 'to-br', count: 1 }],
  gradientRule: { hueShiftDeg: -7, lightnessDelta: 0.38, saturationDelta: -0.9, direction: 'to-br' },
};

function isValidGrammar(input: unknown): input is DesignGrammar {
  const g = input as Partial<DesignGrammar> | undefined;
  return Boolean(
    g &&
      g.margins &&
      g.typeScale &&
      g.spacing &&
      typeof g.imageColumnRatio === 'number' &&
      Array.isArray(g.contrastPairs) &&
      Array.isArray(g.gradientPairs) &&
      g.gradientRule
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

export interface DerivedGradient {
  from: string;
  to: string;
  direction: GradientDirection;
}

/**
 * Apply the mined gradient *rule* (lighten/desaturate/hue-drift the second
 * stop by roughly what real Canva gradients do) to a theme's own base
 * color, instead of replaying the literal blue palette that rule was mined
 * from. `intensity` scales the effect (1 = the rule as mined, 0.5 = half
 * as dramatic) for softer background washes vs. bolder accent moments.
 */
export function deriveGradient(baseHex: string, intensity: number = 1): DerivedGradient {
  const rule = DESIGN_GRAMMAR.gradientRule;
  const base = hexToHsl(baseHex);
  if (!base) {
    return { from: baseHex, to: baseHex, direction: rule.direction };
  }

  const to = hslToHex({
    h: base.h + rule.hueShiftDeg * intensity,
    s: Math.max(0.04, Math.min(1, base.s + rule.saturationDelta * intensity)),
    l: Math.max(0.02, Math.min(0.97, base.l + rule.lightnessDelta * intensity)),
  });

  return { from: baseHex, to, direction: rule.direction };
}
