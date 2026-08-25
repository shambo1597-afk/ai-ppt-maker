import { GoogleGenAI } from '@google/genai';
import { AIPresentationResponse, LLMConfig, AISlideItem } from '../../types/llm';
import { AssetItem } from '../../types/asset';
import { getDesignSchoolSystemPrompt } from './designSchoolGuidelines';
import { generateDynamicSlidesFromText } from '../parser/ruleBasedGenerator';
import { generateTheme, hueHintForMood, inferGravity, Gravity } from '../design/themeGenerator';
import { applyRhythmToAISlides } from '../engine/rhythm';
import { seededRandom, newDeckSeed } from '../utils/prng';
import { buildSlideChunks } from '../parser/verbatimText';
import { verifySlideTextFidelity } from '../parser/verifyTextFidelity';

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
  slideCount: 'auto' | number = 'auto',
  deckSeed: number = newDeckSeed()
): Promise<AIPresentationResponse> {
  const apiKey = resolveGeminiApiKey();
  const targetCount = typeof slideCount === 'number' && slideCount > 0 ? slideCount : 6;

  // TODO(product): userContent is always treated as the deck's own
  // verbatim source text to classify into slides (see
  // designSchoolGuidelines.ts's VERBATIM TEXT FIDELITY section and
  // verifyTextFidelity.ts's hard code-level enforcement below), never as
  // a brief the model composes fresh copy from. That's the correct
  // default per the current spec — inventing headlines/eyebrows/body
  // prose is exactly what verbatim mode exists to prevent — but a short
  // rough topic/outline ("Q3 roadmap", three words, no finished
  // sentences) doesn't really have "verbatim text" worth preserving
  // either, and today just yields a sparse, literal deck rather than the
  // richer AI-composed copy this app used to write for that case.
  // Whether the UI should offer an explicit "let AI write the copy"
  // toggle for that case, and how (or whether) to auto-detect it, is a
  // real product decision left open here rather than silently guessed at.
  // No key, or nothing to classify at all (buildSlideChunks() below would
  // otherwise produce a degenerate zero-chunk plan) — the local fallback
  // already handles empty input correctly (generateEmptyPresentation()).
  if (!apiKey || !userContent.trim()) {
    return generateDynamicSlidesFromText(userContent, assets, targetCount, deckSeed);
  }

  // The user's own exact text, pre-split into one source chunk per slide
  // (explicit [[slide:N]] pins honored verbatim; everything else
  // auto-distributed) — see verbatimText.ts. The model classifies each
  // chunk's own text into fields; it never sees this as "a brief to
  // write from".
  const { chunks, slideCount: neededSlideCount, hasPinnedMarkers } = buildSlideChunks(userContent, targetCount);

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

  const chunkList = Array.from(chunks.entries())
    .sort(([a], [b]) => a - b)
    .map(([slideNum, chunkText]) => `SLIDE ${slideNum}: "${chunkText.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join('\n\n');

  const promptText = `SLIDE CHUNKS (the user's own exact text, already split one chunk per slide — classify each into fields per the VERBATIM TEXT FIDELITY rules above; never rewrite, summarize, or reorder them):\n${chunkList}${assetDirective}\n\nTASK:\nReturn exactly ${neededSlideCount} slides, one per chunk above, in ascending slide-number order (a chunk with no real content may produce a sparse slide — never invent text to fill it). Theme and layout freedom (Müller-Brockmann 12-column grid, Bringhurst micro-typography, Gestalt dominance, Itten-Albers 60-30-10 color theory, musical cadence) are unconstrained by the text itself. Generate structured JSON matching our Content Schema.`;

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
        const parsed = cleanAndParseJsonResponse(rawText, assets, deckSeed, chunks);
        // designSchoolGuidelines.ts *asks* the model to vary slide types,
        // but nothing enforces it — a process-heavy brief reliably
        // produces a run of GRID slides regardless. Enforce it in code —
        // except when the user pinned explicit slide numbers: rhythm
        // enforcement can insert/reorder slides (e.g. splitting an
        // overlong grid into two), which would shift a pinned chunk away
        // from the exact position the user asked for. Explicit placement
        // always wins over automatic rhythm variety.
        if (!hasPinnedMarkers) {
          parsed.slides = applyRhythmToAISlides(parsed.slides);
        }
        console.log(`SLIDES GENERATED SUCCESSFULLY (${modelName}):`, parsed);
        return parsed;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${modelName} error (${err?.message || err}), checking next candidate...`);
    }
  }

  // Fallback to local rule-based dynamic design engine
  console.log('[Gemini API] Falling back to dynamic rule-based design engine');
  return generateDynamicSlidesFromText(userContent, assets, targetCount, deckSeed);
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
 *
 * `chunks` is the 1-indexed slide-number -> source-text map generatePresentation()
 * built via verbatimText.ts's buildSlideChunks() — when non-empty, every
 * slide's text fields are hard-verified against their own chunk
 * (verifyTextFidelity.ts) before this returns, so a paraphrased or invented
 * field never survives regardless of how well the model followed the
 * prompt's verbatim instructions. Left empty only by callers that don't
 * have (or don't yet support) chunk-based verbatim text — verification is
 * skipped entirely in that case rather than comparing every field against
 * an empty string, which would strip everything.
 */
export function cleanAndParseJsonResponse(
  rawText: string,
  uploadedAssets: AssetItem[] = [],
  deckSeed: number = newDeckSeed(),
  chunks: Map<number, string> = new Map()
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

  // Every theme is procedurally generated — there is no fixed named-theme
  // registry to look up any more, so themeId (if the model still sends
  // one out of habit) is ignored entirely. themeMood is what actually
  // biases the result's hue family; this is what decouples theme
  // selection from topic, since two decks with the same mood still land
  // on two different generated palettes.
  const rawTheme = parsed.theme || {};

  // themeGravity is a deliberate, independent-of-hue classification — honor
  // it exactly when the model gave a valid one. When it's missing (an
  // older prompt cache, a model that dropped the field) fall back to the
  // same keyword classifier ruleBasedGenerator.ts's zero-API path uses,
  // run over the deck's own generated content (title + every slide's
  // headline/body) rather than the raw brief text, since that's what's
  // actually available here and is at least as reliable a signal.
  const validGravities: Gravity[] = ['somber', 'neutral', 'energetic'];
  const gravityInferenceText = [
    parsed.presentationTitle,
    ...(Array.isArray(parsed.slides) ? parsed.slides.map((s: any) => `${s.headline || ''} ${s.body || ''}`) : []),
  ].join(' ');
  const gravity: Gravity = validGravities.includes(rawTheme.themeGravity)
    ? rawTheme.themeGravity
    : inferGravity(gravityInferenceText);

  const themeTokens = generateTheme({ hueHint: hueHintForMood(rawTheme.themeMood), gravity, rand: seededRandom(deckSeed) });
  parsed.theme = {
    // `tokens` below carries the full generated ThemeTokens forward so any
    // later resolveThemeTokens() call (slideComposer.ts resolves again)
    // recovers it exactly instead of reconstructing a lossy approximation
    // from the flat hex fields below — that reconstruction has no way to
    // recover fields like displayWeight/gravity, which aren't part of the
    // hex/font preview at all. themeId is kept only as a human-readable
    // label; nothing resolves theme identity by it any more.
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

  // Hard verbatim-fidelity gate: the prompt *asks* the model to only
  // classify, never compose (designSchoolGuidelines.ts), but that's not
  // sufficient on its own — a model paraphrases anyway even under
  // explicit instruction. Every text field gets checked against its own
  // slide's source chunk here; anything that isn't a real substring is
  // dropped, and any of the chunk's own text that survived in no field
  // gets appended to body instead of silently vanishing.
  if (chunks.size > 0) {
    parsed.slides = parsed.slides.map((slide: AISlideItem, idx: number) =>
      verifySlideTextFidelity(chunks.get(idx + 1) || '', slide)
    );
  }

  parsed.deckSeed = deckSeed;

  return parsed as AIPresentationResponse;
}
