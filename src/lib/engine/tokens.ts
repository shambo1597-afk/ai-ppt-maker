import { ThemeTokens, resolveThemeTokens } from '../design/tokens';
import { SurfaceTone } from './types';

/**
 * 8pt Mathematical Spacing Grid
 * space(1) = 8px, space(2) = 16px, space(4) = 32px, space(6) = 48px, space(8) = 64px, space(12) = 96px
 */
export function space(unit: number): number {
  return unit * 8;
}

export function spacePx(unit: number): string {
  return `${space(unit)}px`;
}

/**
 * Modular Typographic Scale (Major Third 1.25 Ratio)
 */
export const TYPOGRAPHY_SCALE = {
  display: {
    fontSize: 'clamp(48px, 5vw, 84px)',
    lineHeight: '0.92',
    letterSpacing: '-0.04em',
    fontWeight: '900',
  },
  statNumber: {
    fontSize: 'clamp(72px, 7vw, 130px)',
    lineHeight: '0.9',
    letterSpacing: '-0.05em',
    fontWeight: '900',
  },
  h1: {
    fontSize: 'clamp(32px, 3.5vw, 48px)',
    lineHeight: '1.1',
    letterSpacing: '-0.025em',
    fontWeight: '800',
  },
  h2: {
    fontSize: 'clamp(24px, 2.5vw, 32px)',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
    fontWeight: '700',
  },
  h3: {
    fontSize: 'clamp(18px, 1.8vw, 22px)',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    fontWeight: '700',
  },
  quote: {
    fontSize: 'clamp(28px, 3vw, 48px)',
    lineHeight: '1.25',
    letterSpacing: '0',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  body: {
    fontSize: 'clamp(14px, 1.2vw, 16px)',
    lineHeight: '1.65',
    letterSpacing: '0.01em',
    fontWeight: '400',
    maxWidth: '65ch',
  },
  caption: {
    fontSize: 'clamp(11px, 1vw, 13px)',
    lineHeight: '1.4',
    letterSpacing: '0.18em',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
};

export interface ResolvedSurfaceColors {
  bg: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentBadge: string;
  border: string;
  cardBg: string;
}

/**
 * Resolves mathematical surface tones to concrete palette colors
 */
export function resolveSurfaceTone(
  tone: SurfaceTone,
  themeInput?: any
): ResolvedSurfaceColors {
  const t = resolveThemeTokens(themeInput);
  const accentColor = t.accent || '#004BFE';
  const accentBadgeColor = t.accentBadge || '#E6FF00';

  switch (tone) {
    case 'HERO':
      return {
        bg: t.heroBg || '#080E1E',
        textPrimary: t.textHero || '#FFFFFF',
        textMuted: '#94A3B8',
        accent: accentColor,
        accentBadge: accentBadgeColor,
        border: 'rgba(255, 255, 255, 0.12)',
        cardBg: 'rgba(255, 255, 255, 0.05)',
      };
    case 'ACCENT':
      return {
        bg: t.sidebarBg || '#0B132B',
        textPrimary: '#FFFFFF',
        textMuted: '#CBD5E1',
        accent: accentBadgeColor,
        accentBadge: accentBadgeColor,
        border: '#1E293B',
        cardBg: 'rgba(255, 255, 255, 0.08)',
      };
    case 'MUTED':
      return {
        bg: '#E2E8F0',
        textPrimary: '#0F172A',
        textMuted: '#64748B',
        accent: accentColor,
        accentBadge: accentBadgeColor,
        border: '#CBD5E1',
        cardBg: '#FFFFFF',
      };
    case 'CANVAS':
    default:
      return {
        bg: t.canvasBg || '#F4F6F9',
        textPrimary: t.textPrimary || '#0F172A',
        textMuted: t.textMuted || '#64748B',
        accent: accentColor,
        accentBadge: accentBadgeColor,
        border: t.border || '#E2E8F0',
        cardBg: t.cardBg || '#FFFFFF',
      };
  }
}
