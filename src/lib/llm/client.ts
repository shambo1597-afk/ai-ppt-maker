import { GoogleGenAI } from '@google/genai';
import { AIPresentationResponse, LLMConfig, AISlideItem, AISlideArchetype } from '../../types/llm';
import { AssetItem } from '../../types/asset';
import { getDesignSchoolSystemPrompt } from './designSchoolGuidelines';
import { generateDynamicSlidesFromText } from '../parser/ruleBasedGenerator';
import { useSlideStore } from '../../store/useSlideStore';
import { resolveThemeTokens } from '../design/tokens';

export const SYSTEM_PROMPT = getDesignSchoolSystemPrompt();

export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.6-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

export interface GenerateOptions {
  assignmentText: string;
  slideCount?: 'auto' | number;
  assets?: AssetItem[];
  config?: Partial<LLMConfig>;
}

/**
 * Google GenAI Client implementation (@google/genai)
 * Injects the full Design School Curriculum, exact slide count, and user asset targeting
 */
export async function generatePresentation(
  userContent: string,
  assets: AssetItem[] = [],
  slideCount: 'auto' | number = 'auto'
): Promise<AIPresentationResponse> {
  const envApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const localApiKey = (typeof window !== 'undefined' ? localStorage.getItem('slidecraft_gemini_key') : '') || '';
  const apiKey = envApiKey || localApiKey || 'AIzaSyBpg6NBSo1WsPdvmBOiY7vqWcE_Xen9iHM';

  const targetCount = typeof slideCount === 'number' && slideCount > 0 ? slideCount : 6;

  if (!apiKey) {
    const fallback = generateDynamicSlidesFromText(userContent, assets, targetCount);
    try {
      await useSlideStore.getState().loadAIGeneratedDeck(fallback, false);
    } catch {
      // ignore
    }
    return fallback;
  }

  // Construct Asset Manifest & Slide Count Directives
  let assetDirective = '';
  if (assets.length > 0) {
    const assetManifest = assets.map((a) => ({
      assetId: a.id,
      name: a.name,
      type: a.type,
      targetSlide: a.targetSlide || 'auto',
      notes: a.notes || '',
    }));
    assetDirective = `\n\nUSER UPLOADED ASSETS MANIFEST:
\`\`\`json
${JSON.stringify(assetManifest, null, 2)}
\`\`\`
INSTRUCTIONS FOR USER ASSETS:
- When an asset has a specific targetSlide (e.g. 2), you MUST set "attachedAssetId": "${assets[0]?.id}" on that exact slide index (Slide 2).
- When targetSlide is "auto", intelligently match the asset to the most relevant slide topic and assign "attachedAssetId".
- Slides with an "attachedAssetId" will render the user's custom graphic instead of a stock photo.`;
  }

  const countDirective =
    slideCount !== 'auto'
      ? `Generate EXACTLY ${slideCount} slides (no more, no less).`
      : `Generate 5 to 6 slides following our musical slide cadence.`;

  const promptText = `USER INPUT BRIEF & OUTLINE:\n${userContent.trim()}${assetDirective}\n\nTASK:\n${countDirective} Evaluate this brief strictly against our 5 Design School Laws (Müller-Brockmann 12-column grid, Bringhurst micro-typography, Gestalt dominance, Itten-Albers 60-30-10 color theory, and musical cadence). Generate structured JSON matching our Graphic Design Schema.`;

  const ai = new GoogleGenAI({ apiKey });

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini API] Requesting slide generation with model: "${modelName}"...`);
      const res = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${promptText}` }],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = res.text || '';
      if (rawText) {
        const parsed = cleanAndParseJsonResponse(rawText, assets);
        console.log('SLIDES GENERATED SUCCESSFULLY (Live Gemini 3.6 Flash):', parsed);
        try {
          await useSlideStore.getState().loadAIGeneratedDeck(parsed, false);
        } catch (e) {
          console.warn('Store update notice:', e);
        }
        return parsed;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${modelName} error (${err?.message || err}), checking next candidate...`);
    }
  }

  // Fallback to local rule-based dynamic design engine
  console.log('[Gemini API] Falling back to dynamic rule-based design engine');
  const fallback = generateDynamicSlidesFromText(userContent, assets, targetCount);
  try {
    await useSlideStore.getState().loadAIGeneratedDeck(fallback, false);
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Compatibility wrapper
 */
export async function generatePresentationWithGemini(
  assignmentText: string,
  assets: AssetItem[] = [],
  slideCount: 'auto' | number = 'auto'
): Promise<{ data: AIPresentationResponse; fallbackNotice?: string }> {
  try {
    const data = await generatePresentation(assignmentText, assets, slideCount);
    return { data };
  } catch (err) {
    const targetCount = typeof slideCount === 'number' && slideCount > 0 ? slideCount : 6;
    const fallback = generateDynamicSlidesFromText(assignmentText, assets, targetCount);
    try {
      await useSlideStore.getState().loadAIGeneratedDeck(fallback, false);
    } catch {
      // ignore
    }
    return {
      data: fallback,
      fallbackNotice: 'Using Dynamic Design Engine.',
    };
  }
}

/**
 * Clean, map and parse pure JSON response
 */
export function cleanAndParseJsonResponse(
  rawText: string,
  uploadedAssets: AssetItem[] = []
): AIPresentationResponse {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error('Invalid presentation structure: "slides" array is missing or empty.');
  }

  const themeTokens = resolveThemeTokens(parsed.theme);
  parsed.theme = {
    background: themeTokens.canvasBg,
    heroBg: themeTokens.heroBg,
    cardBg: themeTokens.cardBg,
    primary: themeTokens.textPrimary,
    textMuted: themeTokens.textMuted,
    textHero: themeTokens.textHero,
    accent: themeTokens.accent,
    border: themeTokens.border,
    fontHeader: themeTokens.fontHeading,
    fontBody: themeTokens.fontBody,
    tokens: themeTokens,
  };

  // Normalize layoutType & archetype names to standardized values
  parsed.slides = parsed.slides.map((s: any, idx: number) => {
    let raw = (s.archetype || s.layoutType || (idx === 0 ? 'COVER' : 'TWO_TONE_SPLIT')).toUpperCase();
    let archetype: AISlideArchetype = 'TWO_TONE_SPLIT';

    if (raw === 'COVER' || raw === 'COVER_TITLE' || raw === 'HERO_MINIMAL' || idx === 0) {
      archetype = 'COVER';
    } else if (raw === 'TWO_TONE_SPLIT' || raw === 'PHOTO_SPLIT' || raw === 'EDITORIAL_SPLIT' || raw === 'SPLIT_EDITORIAL') {
      archetype = 'TWO_TONE_SPLIT';
    } else if (raw === 'BIG_STAT' || raw === 'BIG_STAT_HERO' || raw === 'STAT_IMPACT' || s.statValue) {
      archetype = 'BIG_STAT';
    } else if (raw === 'PROCESS_GRID' || raw === 'TIMELINE_LIST' || raw === 'THREE_PART_FLOW' || (s.points && s.points.length >= 3)) {
      archetype = 'PROCESS_GRID';
    } else if (raw === 'PULL_QUOTE' || raw === 'MINIMAL_QUOTE' || raw === 'QUOTE_EDITORIAL' || s.author) {
      archetype = 'PULL_QUOTE';
    }

    // Check if an uploaded asset was targeted for this slide index (1-indexed)
    let attachedAssetId = s.attachedAssetId;
    let attachedAssetName = s.attachedAssetName;

    const directTargetAsset = uploadedAssets.find((a) => a.targetSlide === idx + 1);
    if (directTargetAsset) {
      attachedAssetId = directTargetAsset.id;
      attachedAssetName = directTargetAsset.name;
    }

    return {
      ...s,
      archetype,
      attachedAssetId,
      attachedAssetName,
      imageKeywords: s.imageKeywords || '',
      iconName: s.iconName || 'sparkles',
      diagram: s.diagram,
      icon: s.icon,
    };
  });

  return parsed as AIPresentationResponse;
}
