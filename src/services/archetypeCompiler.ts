import { Slide, SlideElement } from '../types/slide';
import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../types/llm';
import { AssetItem } from '../types/asset';
import { getIconDataUrl } from '../lib/assets/iconFetcher';
import { solve12ColumnSlideLayout } from '../lib/pptx/layoutSolver';
import { resolveThemeTokens, ThemeTokens } from '../lib/design/tokens';

export const archetypeCompiler = {
  /**
   * Compile full AIPresentationResponse into SlideCraft native Slide[]
   * User-Asset-First: Photography is only rendered when explicitly uploaded by the user.
   * All standard slides share theme.canvasBg, while Cover and Pull Quote use theme.heroBg.
   */
  async compilePresentation(
    aiResponse: AIPresentationResponse,
    fallbackTheme?: Partial<AIPresentationTheme> | ThemeTokens,
    availableAssets: AssetItem[] = []
  ): Promise<Slide[]> {
    const t = resolveThemeTokens(aiResponse.theme || fallbackTheme);

    const compiledSlides: Slide[] = [];
    const userImageAssets = availableAssets.filter((a) => a.type === 'image' && a.url);

    for (let i = 0; i < aiResponse.slides.length; i++) {
      const aiSlide = aiResponse.slides[i];
      const slideId = `ai-slide-${Date.now()}-${i}`;
      
      const rawArchetype = (aiSlide.archetype || 'TWO_TONE_SPLIT').toUpperCase();
      const isCover =
        rawArchetype === 'COVER' ||
        rawArchetype === 'COVER_TITLE' ||
        rawArchetype === 'HERO_MINIMAL' ||
        i === 0;

      const isQuote =
        !isCover &&
        (rawArchetype === 'PULL_QUOTE' ||
          rawArchetype === 'MINIMAL_QUOTE' ||
          rawArchetype === 'QUOTE_EDITORIAL' ||
          Boolean(aiSlide.author));

      // Visual Cohesion: Only Cover and Quote use heroBg, standard slides share canvasBg
      const isHero = isCover || isQuote;
      const slideBgColor = isHero ? t.heroBg : t.canvasBg;

      // 1. Strict User Asset Resolution (No blind Unsplash scraping)
      let imageUrl = '';
      if (aiSlide.attachedAssetId) {
        const matched = userImageAssets.find((a) => a.id === aiSlide.attachedAssetId);
        if (matched) imageUrl = matched.url;
      }
      if (!imageUrl) {
        const targetMatched = userImageAssets.find((a) => a.targetSlide === i + 1);
        if (targetMatched) imageUrl = targetMatched.url;
      }
      if (!imageUrl && aiSlide.attachedAssetName) {
        const matched = userImageAssets.find((a) => 
          a.name.toLowerCase().includes((aiSlide.attachedAssetName || '').toLowerCase())
        );
        if (matched) imageUrl = matched.url;
      }

      // 2. Fetch SVG data for iconName
      let iconSvgData = '';
      try {
        const iconName = aiSlide.iconName || 'sparkles';
        iconSvgData = await getIconDataUrl(iconName, t.accent);
      } catch {
        iconSvgData = '';
      }

      // 3. Compile non-overlapping elements using 12-Column Generative Layout Solver
      const elements = this.compileArchetypeElements(aiSlide, t, imageUrl, iconSvgData, i + 1);

      compiledSlides.push({
        id: slideId,
        title: aiSlide.headline || `Slide ${i + 1}`,
        background: {
          type: 'color',
          color: slideBgColor,
        },
        elements,
        notes: aiSlide.notes || '',
      });
    }

    return compiledSlides;
  },

  /**
   * Compile Slide Elements using the 12-Column Layout Solver
   */
  compileArchetypeElements(
    slide: AISlideItem,
    theme: ThemeTokens | AIPresentationTheme,
    imageUrl: string,
    iconSvgData: string,
    slideNumber: number
  ): SlideElement[] {
    return solve12ColumnSlideLayout(slide, theme, imageUrl, iconSvgData, slideNumber);
  },
};
