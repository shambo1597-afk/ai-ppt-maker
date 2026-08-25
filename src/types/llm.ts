import { ThemeTokens } from '../lib/design/tokens';
import type { Gravity } from '../lib/design/themeGenerator';

/**
 * Pure content schema. There is intentionally no archetype/layoutType field
 * here — the scene-graph composer (lib/engine/composer.ts) derives a
 * slide's structure from which of these facets are present (a stat? a
 * quote? bullets? a user image?), not from a label the model or a human
 * picks off a fixed template list.
 */
export interface AISlideItem {
  headline: string;
  body: string;
  iconName: string;
  subheading?: string;
  statValue?: string;
  statLabel?: string;
  points?: string[];
  author?: string;
  notes?: string;
  diagram?: string;
  icon?: string;
  attachedAssetId?: string;
  attachedAssetName?: string;
}

export interface AIPresentationTheme {
  background: string;
  primary: string;
  accent: string;
  fontHeader: string;
  fontBody: string;
  heroBg?: string;
  cardBg?: string;
  textMuted?: string;
  textHero?: string;
  border?: string;
  themeId?: string;
  /** A free-text mood description (e.g. "high-energy tech") the model
   * emits instead of (or alongside) themeId — decouples theme selection
   * from a fixed 7-theme lookup so decks on the same topic don't
   * converge on the same palette every time. See themeGenerator.ts's
   * hueHintForMood(). */
  themeMood?: string;
  /** The deck's content-tone classification, independent of themeMood's
   * hue-flavored description — a somber public-health brief and an
   * energetic product launch can share a mood-adjacent hue family while
   * needing very different energy levels (saturation, decoration). See
   * themeGenerator.ts's Gravity type and inferGravity() for the keyword
   * fallback used when this is omitted. */
  themeGravity?: Gravity;
  tokens?: ThemeTokens;
}

export interface AIPresentationResponse {
  presentationTitle: string;
  theme: AIPresentationTheme | ThemeTokens;
  slides: AISlideItem[];
  /** The PRNG seed this deck's theme + blob geometry were derived from (see
   * lib/utils/prng.ts). Two calls with the same input content get different
   * random seeds and therefore visibly different themes/blobs; passing the
   * same seed back in reproduces an identical deck. */
  deckSeed?: number;
}

export type LLMProvider = 'gemini' | 'demo';

export interface LLMConfig {
  provider: LLMProvider;
  geminiKey?: string;
}
