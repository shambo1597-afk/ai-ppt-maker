import { Slide, SlideElement } from '../types/slide';
import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../types/llm';
import { AssetItem } from '../types/asset';
import { getIconDataUrl } from '../lib/assets/iconFetcher';
import { resolveThemeTokens, ThemeTokens } from '../lib/design/tokens';
import { buildSlideContent } from '../lib/engine/contentModel';
import { composeSlide, isHeroSurface } from '../lib/engine/composer';

/**
 * Compiles the AI's structured content response into SlideCraft's native
 * Slide[] scene graph. Layout is never chosen here — buildSlideContent()
 * extracts pure content and composeSlide() derives every coordinate from it
 * — this module's job is strictly content resolution: matching user-
 * uploaded assets to slides and fetching semantic vector icons.
 *
 * User-Asset-First: a slide only ever shows a photo/graphic the user
 * explicitly uploaded. There is no stock-photo search anywhere in this
 * pipeline — when no asset is attached, composeSlide() falls back to a
 * generated typographic/graphic poster composition instead.
 */
export const slideComposer = {
  async compilePresentation(
    aiResponse: AIPresentationResponse,
    fallbackTheme?: Partial<AIPresentationTheme> | ThemeTokens,
    availableAssets: AssetItem[] = []
  ): Promise<Slide[]> {
    const theme = resolveThemeTokens(aiResponse.theme || fallbackTheme);
    const userImageAssets = availableAssets.filter((a) => a.type === 'image' && a.url);
    const total = aiResponse.slides.length;

    const compiledSlides: Slide[] = [];

    for (let i = 0; i < aiResponse.slides.length; i++) {
      const aiSlide = aiResponse.slides[i];
      const slideIndex = i + 1;

      const imageUrl = resolveUserAsset(aiSlide, userImageAssets, slideIndex);

      let iconSvgData = '';
      try {
        iconSvgData = await getIconDataUrl(aiSlide.iconName || 'sparkles', theme.accent);
      } catch {
        iconSvgData = '';
      }

      const content = buildSlideContent(aiSlide, { index: slideIndex, total, imageUrl, iconSvgData });
      const elements: SlideElement[] = composeSlide(content, theme);
      const slideBg = isHeroSurface(content) ? theme.heroBg : theme.canvasBg;

      compiledSlides.push({
        id: `ai-slide-${Date.now()}-${i}`,
        title: aiSlide.headline || `Slide ${slideIndex}`,
        background: { type: 'color', color: slideBg },
        elements,
        notes: aiSlide.notes || '',
      });
    }

    return compiledSlides;
  },
};

/**
 * Strict user-asset resolution: an image is only ever attached to a slide
 * when the user (or the model, echoing the user's own asset manifest)
 * explicitly targeted it — by id, by slide index, or by name match. No
 * network image search happens here.
 */
function resolveUserAsset(aiSlide: AISlideItem, userImageAssets: AssetItem[], slideIndex: number): string {
  if (aiSlide.attachedAssetId) {
    const matched = userImageAssets.find((a) => a.id === aiSlide.attachedAssetId);
    if (matched) return matched.url;
  }
  const targetMatched = userImageAssets.find((a) => a.targetSlide === slideIndex);
  if (targetMatched) return targetMatched.url;

  if (aiSlide.attachedAssetName) {
    const nameMatched = userImageAssets.find((a) =>
      a.name.toLowerCase().includes((aiSlide.attachedAssetName || '').toLowerCase())
    );
    if (nameMatched) return nameMatched.url;
  }

  return '';
}
