import { ThemeTokens } from '../lib/design/tokens';

export type VisualWeight = 
  | 'asymmetric-left' 
  | 'asymmetric-right' 
  | 'editorial-split' 
  | 'minimal-monumental' 
  | 'typographic-hero' 
  | 'three-pillar' 
  | 'stat-monumental' 
  | 'centered-editorial';

export interface ColumnSpan {
  colStart: number; // 1 to 12
  colSpan: number;  // 1 to 12
}

export interface ImageSpanSpec extends ColumnSpan {
  aspect?: '3:4' | '16:9' | '1:1' | 'fill' | 'portrait' | 'landscape';
}

export interface StatHeroSpec {
  value: string;
  label: string;
  colStart?: number;
  colSpan?: number;
}

export interface GenerativeSlidePillar {
  index: string; // e.g. '01'
  title: string;
  desc: string;
}

export interface GenerativeLayoutSpec {
  visualWeight?: VisualWeight;
  titleSpan?: ColumnSpan;
  bodySpan?: ColumnSpan;
  imageSpan?: ImageSpanSpec;
  statHero?: StatHeroSpec;
  pillars?: GenerativeSlidePillar[];
  decorativeElement?: 'divider-rule' | 'quote-mark' | 'index-badge' | 'none';
}

export type GeminiLayoutType = 
  | 'COVER' 
  | 'TWO_TONE_SPLIT'
  | 'PHOTO_SPLIT' 
  | 'BIG_STAT' 
  | 'PROCESS_GRID' 
  | 'PULL_QUOTE';

export type AISlideArchetype = 
  | 'COVER'
  | 'TWO_TONE_SPLIT'
  | 'PHOTO_SPLIT'
  | 'BIG_STAT'
  | 'PROCESS_GRID'
  | 'PULL_QUOTE'
  | 'COVER_TITLE'
  | 'EDITORIAL_SPLIT'
  | 'SPLIT_EDITORIAL'
  | 'BIG_STAT_HERO'
  | 'STORY_2_COLUMN'
  | 'MINIMAL_QUOTE'
  | 'TIMELINE_LIST'
  | 'DATA_GRID'
  | 'SECTION_DIVIDER'
  | 'HERO_MINIMAL'
  | 'STAT_IMPACT'
  | 'SHOWCASE_FOCUS'
  | 'THREE_COLUMN_INSIGHTS'
  | 'QUOTE_EDITORIAL'
  | 'TIMELINE_NARRATIVE'
  | 'COMPARISON_GRID';

export interface AISlideItem {
  layoutType?: GeminiLayoutType;
  archetype: AISlideArchetype;
  canvaBlueprintId?: string;
  headline: string;
  body: string;
  imageKeywords: string;
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
  layout?: GenerativeLayoutSpec;
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

export type LLMProvider = 'openai' | 'gemini' | 'anthropic' | 'demo';

export interface LLMConfig {
  provider: LLMProvider;
  openaiKey?: string;
  geminiKey?: string;
  anthropicKey?: string;
  model?: string;
}

export interface AIGenerationRequest {
  assignmentText: string;
  assetIds?: string[];
  slideCount?: number;
  toneStyle?: 'editorial' | 'minimal' | 'cyber' | 'venture' | 'bold';
  config: LLMConfig;
}
