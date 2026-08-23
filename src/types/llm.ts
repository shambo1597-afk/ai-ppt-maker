import { ThemeTokens } from '../lib/design/tokens';

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
  tokens?: ThemeTokens;
}

export interface AIPresentationResponse {
  presentationTitle: string;
  theme: AIPresentationTheme | ThemeTokens;
  slides: AISlideItem[];
}

export type LLMProvider = 'gemini' | 'demo';

export interface LLMConfig {
  provider: LLMProvider;
  geminiKey?: string;
}
