import { Slide } from '../../types/slide';
import { CanvaSlideBlueprint } from '../../types/canvaBlueprint';
import canvaBlueprintsData from './canvaBlueprints.json';
import { AIPresentationTheme, AISlideItem } from '../../types/llm';
import { exportPresentationToPPTX } from '../../utils/pptxExporter';
import { archetypeCompiler } from '../../services/archetypeCompiler';
import { resolveThemeTokens, ThemeTokens } from '../design/tokens';

export interface CanvaSlideContent {
  eyebrow?: string;
  headline?: string;
  body?: string;
  statNumber?: string;
  statLabel?: string;
  quote?: string;
  attribution?: string;
  imageUrl?: string;
  steps?: Array<{
    number?: string;
    title?: string;
    description?: string;
  }>;
}

export const pptxGenerator = {
  /**
   * Get all extracted Canva blueprints
   */
  getAllBlueprints(): CanvaSlideBlueprint[] {
    return (canvaBlueprintsData as any).blueprints || [];
  },

  /**
   * Get blueprints filtered by archetype
   */
  getBlueprintsByArchetype(archetype: string): CanvaSlideBlueprint[] {
    const all = this.getAllBlueprints();
    return all.filter((b) => b.archetype.toUpperCase() === archetype.toUpperCase());
  },

  /**
   * Find blueprint by exact ID
   */
  getBlueprintById(id: string): CanvaSlideBlueprint | null {
    const all = this.getAllBlueprints();
    return all.find((b) => b.id === id) || null;
  },

  /**
   * Dynamically build a SlideCraft Slide with guaranteed non-overlapping layout
   */
  createSlideFromBlueprint(
    blueprint: CanvaSlideBlueprint,
    content: CanvaSlideContent,
    theme?: Partial<AIPresentationTheme> | ThemeTokens,
    slideIndex: number = 1
  ): Slide {
    const t = resolveThemeTokens(theme);

    const rawArchetype = (blueprint.archetype || 'TWO_TONE_SPLIT').toUpperCase();
    const isCover =
      rawArchetype === 'COVER' ||
      rawArchetype === 'COVER_TITLE' ||
      rawArchetype === 'HERO_MINIMAL' ||
      slideIndex === 1;
    const isQuote =
      !isCover &&
      (rawArchetype === 'PULL_QUOTE' ||
        rawArchetype === 'MINIMAL_QUOTE' ||
        Boolean(content.quote || content.attribution));

    const isHero = isCover || isQuote;
    const slideBg = isHero ? t.heroBg : t.canvasBg;

    const aiSlide: AISlideItem = {
      archetype: (blueprint.archetype || 'TWO_TONE_SPLIT') as any,
      headline: content.headline || blueprint.name || '',
      body: content.body || '',
      subheading: content.eyebrow,
      statValue: content.statNumber,
      statLabel: content.statLabel,
      imageKeywords: '',
      iconName: 'sparkles',
      notes: content.body || '',
    };

    const elements = archetypeCompiler.compileArchetypeElements(
      aiSlide,
      t,
      content.imageUrl || '',
      '',
      slideIndex
    );

    return {
      id: `slide-${Date.now()}-${slideIndex}`,
      title: content.headline || blueprint.name,
      background: {
        type: 'color',
        color: slideBg,
      },
      elements,
      notes: content.body || '',
    };
  },

  /**
   * Export slides to .pptx format using native PPTXGenJS
   */
  async exportToPPTX(slides: Slide[], title: string = 'Canva Presentation'): Promise<void> {
    await exportPresentationToPPTX(slides, title);
  },
};
