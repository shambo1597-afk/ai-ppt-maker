import { 
  AIPresentationResponse, 
  AIGenerationRequest, 
  LLMConfig, 
  LLMProvider, 
  AISlideItem,
  AISlideArchetype
} from '../types/llm';
import { AssetItem } from '../types/asset';
import { getDesignSchoolSystemPrompt as getCanvaSystemPrompt } from '../lib/llm/designSchoolGuidelines';
import { generateDynamicSlidesFromText } from '../lib/parser/ruleBasedGenerator';
import { 
  CANDIDATE_MODELS, 
  generatePresentation,
  cleanAndParseJsonResponse
} from '../lib/llm/client';

const STORAGE_KEYS = {
  OPENAI_KEY: 'slidecraft_openai_key',
  GEMINI_KEY: 'slidecraft_gemini_key',
  ANTHROPIC_KEY: 'slidecraft_anthropic_key',
  PROVIDER: 'slidecraft_llm_provider',
  MODEL: 'slidecraft_llm_model',
};

export const SYSTEM_PROMPT = getCanvaSystemPrompt();

export interface GenerationResult {
  data: AIPresentationResponse;
  fallbackNotice?: string;
}

export const llmService = {
  // ----------------------------------------------------
  // LOCAL STORAGE & ENV CONFIGURATION
  // ----------------------------------------------------
  getConfig(): LLMConfig {
    const envGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    const storedGeminiKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '' : '';
    const geminiKey = envGeminiKey || storedGeminiKey || 'AIzaSyBpg6NBSo1WsPdvmBOiY7vqWcE_Xen9iHM';

    const openaiKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.OPENAI_KEY) || '' : '';
    const anthropicKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ANTHROPIC_KEY) || '' : '';
    
    let provider = typeof window !== 'undefined' 
      ? (localStorage.getItem(STORAGE_KEYS.PROVIDER) as LLMProvider) || 'gemini' 
      : 'gemini';

    if (geminiKey) {
      provider = 'gemini';
    }

    return {
      provider,
      openaiKey,
      geminiKey,
      anthropicKey,
      model: 'gemini-3.6-flash',
    };
  },

  saveConfig(config: Partial<LLMConfig>): void {
    if (typeof window === 'undefined') return;
    if (config.provider !== undefined) localStorage.setItem(STORAGE_KEYS.PROVIDER, config.provider);
    if (config.openaiKey !== undefined) localStorage.setItem(STORAGE_KEYS.OPENAI_KEY, config.openaiKey);
    if (config.geminiKey !== undefined) localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, config.geminiKey);
    if (config.anthropicKey !== undefined) localStorage.setItem(STORAGE_KEYS.ANTHROPIC_KEY, config.anthropicKey);
    if (config.model !== undefined) localStorage.setItem(STORAGE_KEYS.MODEL, config.model);
  },

  // ----------------------------------------------------
  // CONTEXT COMPILER (Assignment + Uploaded Assets)
  // ----------------------------------------------------
  buildUserPrompt(assignmentText: string, assets: AssetItem[] = [], slideCount: number = 6): string {
    let context = `${assignmentText.trim()}\n\n`;

    if (assets.length > 0) {
      context += `ATTACHED ASSETS & NOTES:\n`;
      assets.forEach((asset, idx) => {
        context += `--- Asset [${idx + 1}]: "${asset.name}" (${asset.type}) ---\n`;
        if (asset.content) {
          context += `Content snippet:\n${asset.content.slice(0, 1500)}\n\n`;
        } else if (asset.tags && asset.tags.length > 0) {
          context += `Tags: ${asset.tags.join(', ')}\n\n`;
        }
      });
    }

    context += `\nCreate ${slideCount} slides covering this material in full. Follow formal graphic design dominance and 60-30-10 color balance.`;
    return context;
  },

  // ----------------------------------------------------
  // JSON RESPONSE CLEANER & PARSER
  // ----------------------------------------------------
  cleanAndParseJson(rawText: string): AIPresentationResponse {
    return cleanAndParseJsonResponse(rawText);
  },

  // ----------------------------------------------------
  // GOOGLE GEMINI PROVIDER (@google/genai Live Integration)
  // ----------------------------------------------------
  async generateWithGemini(
    apiKey: string,
    userPrompt: string
  ): Promise<GenerationResult> {
    try {
      const parsed = await generatePresentation(userPrompt);
      return { data: parsed };
    } catch (err: any) {
      console.warn('Gemini interaction error, using dynamic design engine:', err);
      const fallback = generateDynamicSlidesFromText(userPrompt, []);
      return {
        data: fallback,
        fallbackNotice: 'Using Dynamic Design Engine.',
      };
    }
  },

  // ----------------------------------------------------
  // OPENAI PROVIDER
  // ----------------------------------------------------
  async generateWithOpenAI(
    apiKey: string,
    userPrompt: string,
    model: string = 'gpt-4o-mini'
  ): Promise<GenerationResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${res.status}): ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = this.cleanAndParseJson(content);
    console.log('GENERATION SUCCESSFUL', parsed);
    return { data: parsed };
  },

  // ----------------------------------------------------
  // ANTHROPIC CLAUDE PROVIDER
  // ----------------------------------------------------
  async generateWithAnthropic(
    apiKey: string,
    userPrompt: string,
    model: string = 'claude-3-5-sonnet-20241022'
  ): Promise<GenerationResult> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        system: SYSTEM_PROMPT,
        max_tokens: 4000,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic API error (${res.status}): ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    const parsed = this.cleanAndParseJson(content);
    console.log('GENERATION SUCCESSFUL', parsed);
    return { data: parsed };
  },

  // ----------------------------------------------------
  // DYNAMIC RULE-BASED GENERATOR (Zero-API Option)
  // ----------------------------------------------------
  generateLocalDemoDeck(
    assignmentText: string, 
    assets: AssetItem[] = [], 
    slideCount: number = 6
  ): GenerationResult {
    const parsed = generateDynamicSlidesFromText(assignmentText, assets, slideCount);
    console.log('GENERATION SUCCESSFUL', parsed);
    return { data: parsed };
  },

  // ----------------------------------------------------
  // MAIN UNIFIED ORCHESTRATION METHOD
  // ----------------------------------------------------
  async generatePresentation(
    request: AIGenerationRequest,
    allAssets: AssetItem[] = []
  ): Promise<GenerationResult> {
    const { assignmentText, assetIds = [], slideCount = 6, config } = request;

    const attachedAssets = allAssets.filter((a) => assetIds.includes(a.id));
    const userPrompt = this.buildUserPrompt(assignmentText, attachedAssets, slideCount);

    const provider = config.provider || 'gemini';
    const geminiKey = config.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBpg6NBSo1WsPdvmBOiY7vqWcE_Xen9iHM';

    // 1. Google Gemini Live SDK (@google/genai)
    if (geminiKey) {
      try {
        return await this.generateWithGemini(geminiKey, userPrompt);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to dynamic parser:', geminiError);
        return this.generateLocalDemoDeck(assignmentText, attachedAssets, slideCount);
      }
    }

    // 2. OpenAI
    if (provider === 'openai' && config.openaiKey?.trim()) {
      return this.generateWithOpenAI(config.openaiKey, userPrompt, config.model || 'gpt-4o-mini');
    }

    // 3. Anthropic
    if (provider === 'anthropic' && config.anthropicKey?.trim()) {
      return this.generateWithAnthropic(config.anthropicKey, userPrompt, config.model || 'claude-3-5-sonnet-20241022');
    }

    // 4. Fast Dynamic Rule-Based Local Parser
    return this.generateLocalDemoDeck(assignmentText, attachedAssets, slideCount);
  },
};
