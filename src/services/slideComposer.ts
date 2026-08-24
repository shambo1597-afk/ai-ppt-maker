import { Slide, SlideElement, ImageElement } from '../types/slide';
import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../types/llm';
import { AssetItem } from '../types/asset';
import { getIconDataUrl } from '../lib/assets/iconFetcher';
import { inferIconForText } from '../utils/iconHelper';
import { resolveThemeTokens, ThemeTokens } from '../lib/design/tokens';
import { buildSlideContent, nonEmptyPoints } from '../lib/engine/contentModel';
import { composeSlide, isHeroSurface } from '../lib/engine/composer';
import { generateNoiseTextureDataUrl, hashStringSeed } from '../lib/engine/texture';
import { CANVAS_W, CANVAS_H } from '../lib/engine/grid';

/**
 * Compiles the AI's structured content response into SlideCraft's native
 * Slide[] scene graph. Layout is never chosen here — buildSlideContent()
 * extracts pure content and composeSlide() derives every coordinate from it
 * — this module's job is strictly content resolution: matching user-
 * uploaded assets to slides, fetching semantic vector icons, and generating
 * this deck's shared grain texture (see lib/engine/texture.ts).
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

    // A single shared film-grain texture for the whole deck (not one per
    // slide — that would multiply an already-heavy asset by slide count
    // for no visible benefit, and keeps every slide's tactile "paper"
    // quality visually consistent, matching how a real Canva template
    // applies one grain asset across every slide it ships). Grounded in
    // the real samples: several real decks' cover-slide background is a
    // flat color or gradient with a visible grain overlay layered on top —
    // this is a surface-rendering technique, not photographic content, so
    // it's generated procedurally rather than sourced as a stock image
    // (never fetched — see resolveUserAsset()'s no-stock-photo policy).
    const textureSeed = hashStringSeed(aiResponse.presentationTitle || 'presentation');
    const textureDataUrl = generateNoiseTextureDataUrl(textureSeed);

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

      // Real Canva samples show grid-of-cards slides using a distinct icon
      // per item (not one icon repeated across every card, and not
      // necessarily the numbered badge composeGrid() falls back to) — so
      // for a slide with enough points to actually become a grid, try to
      // match each bullet's own text to a real icon (inferIconForText,
      // reusing iconHelper.ts's curated tag table) and fetch it. Fired
      // concurrently: sequential per-bullet fetches would multiply
      // getIconDataUrl's worst-case network timeout by bullet count.
      // Falls back to this slide's own icon per-bullet when a bullet's
      // text doesn't match any tag, and composeGrid() falls back further
      // (to the plain numbered badge) only if literally none matched.
      const points = nonEmptyPoints(aiSlide.points);
      let bulletIconSvgData: (string | undefined)[] = [];
      if (points.length >= 2) {
        bulletIconSvgData = await Promise.all(
          points.map(async (point) => {
            const inferred = inferIconForText(point);
            if (!inferred) return iconSvgData || undefined;
            try {
              return await getIconDataUrl(inferred, theme.accent);
            } catch {
              return iconSvgData || undefined;
            }
          })
        );
      }

      const content = buildSlideContent(aiSlide, { index: slideIndex, total, imageUrl, iconSvgData, bulletIconSvgData });
      const elements: SlideElement[] = composeSlide(content, theme);
      if (textureDataUrl) {
        elements.unshift(buildTextureOverlay(textureDataUrl));
      }
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

/** Full-bleed, barely-there grain wash — sits below even the ambient blobs
 * (zIndex 0), so it reads as texture on the flat background color rather
 * than as a visible element of its own. */
function buildTextureOverlay(dataUrl: string): ImageElement {
  return {
    id: `el-texture-${Date.now()}`,
    type: 'image',
    x: 0,
    y: 0,
    width: CANVAS_W,
    height: CANVAS_H,
    rotation: 0,
    opacity: 0.07,
    zIndex: -1,
    src: dataUrl,
    objectFit: 'cover',
    borderRadius: 0,
  };
}

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
