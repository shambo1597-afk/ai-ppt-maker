import { Slide, SlideElement, ImageElement } from '../types/slide';
import { AIPresentationResponse, AISlideItem, AIPresentationTheme } from '../types/llm';
import { AssetItem } from '../types/asset';
import { getIconDataUrl } from '../lib/assets/iconFetcher';
import { inferIconForText } from '../utils/iconHelper';
import { resolveThemeTokens, ThemeTokens } from '../lib/design/tokens';
import { buildSlideContent, nonEmptyPoints } from '../lib/engine/contentModel';
import { composeSlide, resolveSlideBackground, detectRegime } from '../lib/engine/composer';
import { generateNoiseTextureDataUrl, hashStringSeed } from '../lib/engine/texture';
import { CANVAS_W, CANVAS_H } from '../lib/engine/grid';
import { fetchTreatedPhoto, deriveSearchQuery } from '../lib/assets/stockPhotoFetcher';

/**
 * Compiles the AI's structured content response into SlideCraft's native
 * Slide[] scene graph. Layout is never chosen here — buildSlideContent()
 * extracts pure content and composeSlide() derives every coordinate from it
 * — this module's job is strictly content resolution: matching user-
 * uploaded assets to slides, fetching semantic vector icons, and generating
 * this deck's shared grain texture (see lib/engine/texture.ts).
 *
 * User-Asset-First: a user-uploaded asset always wins, matched via
 * resolveUserAsset() below. Only when a slide has no user asset AND would
 * otherwise render as a bare typographic poster (no stat/quote/bullets/
 * image — see detectRegime()) does this try a treated stock-photo
 * fallback (fetchTreatedPhoto(), stockPhotoFetcher.ts): a Pexels photo
 * with its background removed and recolored into this deck's own theme,
 * never an unedited photo, and entirely inert with no VITE_PEXELS_API_KEY
 * configured. Any other slide (a stat, a grid, a quote) still falls back
 * to composeSlide()'s generated typographic/graphic poster exactly as
 * before — this never overrides an existing regime, only fills in what
 * used to be a poster-only gap.
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
    // (never fetched raw — see this module's own User-Asset-First doc
    // comment above and stockPhotoFetcher.ts's treated-only guarantee).
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
      // reusing iconHelper.ts's curated tag table). Selection happens in
      // one sequential pass (`usedIcons` accumulates as each bullet picks
      // its icon, so bullet 2 knows what bullet 1 already took, and can
      // fall back to an unused same-category icon or, last resort, repeat
      // — see inferIconForText()'s own doc comment) — this is pure/
      // synchronous, no network cost to serializing it. Only the actual
      // SVG *fetch* for each chosen name is fired concurrently
      // (Promise.all below): sequential per-bullet fetches would multiply
      // getIconDataUrl's worst-case network timeout by bullet count.
      //
      // A bullet whose text matches no tag at all (inferred === null) falls
      // back to this slide's own icon — but only the FIRST such bullet on
      // this slide. A second, third, etc. null-match bullet would otherwise
      // all share that exact same fallback icon — the same duplicate-icon
      // problem this whole block exists to prevent, just reached via the
      // no-match path instead of the tag-collision path. Past the first,
      // they get undefined instead, so composeGrid() falls through to its
      // own numbered-pill treatment (01, 02, 03...) — visually distinct by
      // number, never a repeated icon graphic.
      const points = nonEmptyPoints(aiSlide.points);
      let bulletIconSvgData: (string | undefined)[] = [];
      if (points.length >= 2) {
        const usedIcons = new Set<string>();
        const inferredNames = points.map((point) => {
          const inferred = inferIconForText(point, usedIcons);
          if (inferred) usedIcons.add(inferred);
          return inferred;
        });
        let sharedFallbackUsed = false;
        bulletIconSvgData = await Promise.all(
          inferredNames.map(async (inferred) => {
            if (!inferred) {
              if (sharedFallbackUsed) return undefined;
              sharedFallbackUsed = true;
              return iconSvgData || undefined;
            }
            try {
              return await getIconDataUrl(inferred, theme.accent);
            } catch {
              return sharedFallbackUsed ? undefined : ((sharedFallbackUsed = true), iconSvgData || undefined);
            }
          })
        );
      }

      let content = buildSlideContent(aiSlide, {
        index: slideIndex,
        total,
        imageUrl,
        iconSvgData,
        bulletIconSvgData,
        deckSeed: aiResponse.deckSeed,
      });

      // Treated stock-photo fallback: only for a slide that has no user
      // asset AND would otherwise render as a bare typographic poster —
      // i.e. a strong single headline/point with nothing else (a stat, a
      // quote, a bullet list, an already-attached asset) competing for
      // the slide. Never overrides a regime that already has content to
      // show; only fills the gap composeSlide() would otherwise fill with
      // an abstract poster flourish. fetchTreatedPhoto() itself no-ops
      // (resolves null near-instantly) with no VITE_PEXELS_API_KEY
      // configured, so this costs nothing on the common path.
      if (!imageUrl && detectRegime(content) === 'typographic') {
        const query = deriveSearchQuery(aiSlide.headline, aiSlide.body);
        const treatedPhotoUrl = query ? await fetchTreatedPhoto(query, theme) : null;
        if (treatedPhotoUrl) {
          content = buildSlideContent(aiSlide, {
            index: slideIndex,
            total,
            imageUrl: treatedPhotoUrl,
            iconSvgData,
            bulletIconSvgData,
            deckSeed: aiResponse.deckSeed,
          });
        }
      }

      const elements: SlideElement[] = composeSlide(content, theme);
      if (textureDataUrl) {
        elements.unshift(buildTextureOverlay(textureDataUrl));
      }
      const slideBg = resolveSlideBackground(content, theme);

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
