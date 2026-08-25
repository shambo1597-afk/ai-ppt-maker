import { GoogleGenAI } from '@google/genai';
import { AIPresentationResponse, LLMConfig, AISlideItem } from '../../types/llm';
import { AssetItem } from '../../types/asset';
import { getDesignSchoolSystemPrompt } from './designSchoolGuidelines';
import { generateDynamicSlidesFromText } from '../parser/ruleBasedGenerator';
import { MASTER_THEMES } from '../design/tokens';
import { generateTheme, hueHintForMood } from '../design/themeGenerator';

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

function resolveGeminiApiKey(): string {
  const envApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const localApiKey = (typeof window !== 'undefined' ? localStorage.getItem('slidecraft_gemini_key') : '') || '';
  return envApiKey || localApiKey;
}

/**
 * Google GenAI Client implementation (@google/genai). Requests pure slide
 * content (see designSchoolGuidelines.ts) — never a layout/archetype name —
 * and falls back to the zero-API local parser when no key is configured or
 * every candidate model fails. This is a pure data function: it returns the
 * generated presentation and never writes to the app store itself, so the
 * caller decides when (and whether) to commit it.
 */
export async function generatePresentation(
  userContent: string,
  assets: AssetItem[] = [],
  slideCount: 'auto' | number = 'auto'
): Promise<AIPresentationResponse> {
  const apiKey = resolveGeminiApiKey();
  const targetCount = typeof slideCount === 'number' && slideCount > 0 ? slideCount : 6;

  if (!apiKey) {
    return generateDynamicSlidesFromText(userContent, assets, targetCount);
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
- Only slides with an "attachedAssetId" show any image — never invent one.`;
  }

  const countDirective =
    slideCount !== 'auto'
      ? `Generate EXACTLY ${slideCount} slides (no more, no less).`
      : `Generate 5 to 6 slides following our musical slide cadence.`;

  const promptText = `USER INPUT BRIEF & OUTLINE:\n${userContent.trim()}${assetDirective}\n\nTASK:\n${countDirective} Evaluate this brief strictly against our 5 Design School Laws (Müller-Brockmann 12-column grid, Bringhurst micro-typography, Gestalt dominance, Itten-Albers 60-30-10 color theory, and musical cadence). Generate structured JSON matching our Content Schema.`;

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
        console.log(`SLIDES GENERATED SUCCESSFULLY (${modelName}):`, parsed);
        return parsed;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${modelName} error (${err?.message || err}), checking next candidate...`);
    }
  }

  // Fallback to local rule-based dynamic design engine
  console.log('[Gemini API] Falling back to dynamic rule-based design engine');
  return generateDynamicSlidesFromText(userContent, assets, targetCount);
}

/**
 * Compatibility wrapper used by the UI: always resolves, surfacing a
 * fallback notice instead of throwing when the cloud model is unavailable.
 */
export async function generatePresentationWithGemini(
  assignmentText: string,
  assets: AssetItem[] = [],
  slideCount: 'auto' | number = 'auto'
): Promise<{ data: AIPresentationResponse; fallbackNotice?: string }> {
  const hadApiKey = Boolean(resolveGeminiApiKey());
  try {
    const data = await generatePresentation(assignmentText, assets, slideCount);
    return { data, fallbackNotice: hadApiKey ? undefined : 'No Gemini API key configured — used the local design engine.' };
  } catch (err) {
    const targetCount = typeof slideCount === 'number' && slideCount > 0 ? slideCount : 6;
    const fallback = generateDynamicSlidesFromText(assignmentText, assets, targetCount);
    return {
      data: fallback,
      fallbackNotice: 'Using the local design engine.',
    };
  }
}

/**
 * Clean, sanitize and parse the model's pure-content JSON response. This no
 * longer normalizes an archetype/layoutType field — there isn't one; the
 * scene-graph composer derives structure from whichever content facets
 * (stat/quote/points/image) are actually present on each slide.
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

  // themeId is an exact, deliberate choice — honor it precisely. Anything
  // else (no themeId, or one that doesn't name a real master theme) is
  // NOT a cue to silently default to Cobalt Kinetic: it means the model
  // described a mood instead (per the prompt's "a mood description is
  // equally valid" guidance), so generate a genuinely new theme biased
  // toward that mood's hue family — this is what actually decouples
  // theme selection from topic, since two decks with the same mood still
  // land on two different generated palettes.
  const rawTheme = parsed.theme || {};
  const explicitThemeId: string | undefined = rawTheme.themeId;
  const themeTokens =
    explicitThemeId && MASTER_THEMES[explicitThemeId]
      ? MASTER_THEMES[explicitThemeId]
      : generateTheme({ hueHint: hueHintForMood(rawTheme.themeMood) });
  parsed.theme = {
    // Carry the resolved theme's own id forward so any later
    // resolveThemeTokens() call (slideComposer.ts resolves again) hits the
    // same exact-match path instead of reconstructing a lossy approximation
    // from hex fields — that reconstruction has no way to recover fields
    // like displayWeight, which aren't part of the hex/font preview at all.
    themeId: themeTokens.id,
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

  parsed.slides = parsed.slides.map((s: any, idx: number): AISlideItem => {
    // Check if an uploaded asset was explicitly targeted for this slide index (1-indexed)
    let attachedAssetId = s.attachedAssetId;
    let attachedAssetName = s.attachedAssetName;

    const directTargetAsset = uploadedAssets.find((a) => a.targetSlide === idx + 1);
    if (directTargetAsset) {
      attachedAssetId = directTargetAsset.id;
      attachedAssetName = directTargetAsset.name;
    }

    return {
      headline: s.headline || '',
      body: s.body || '',
      subheading: s.subheading,
      statValue: s.statValue,
      statLabel: s.statLabel,
      points: Array.isArray(s.points) ? s.points : undefined,
      author: s.author,
      notes: s.notes,
      diagram: s.diagram,
      iconName: s.icon || s.iconName || 'sparkles',
      icon: s.icon,
      attachedAssetId,
      attachedAssetName,
    };
  });

  return parsed as AIPresentationResponse;
}
