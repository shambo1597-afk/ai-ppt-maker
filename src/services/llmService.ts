import { LLMConfig, LLMProvider } from '../types/llm';

/**
 * API key / provider preference storage. Generation itself lives in
 * lib/llm/client.ts (Gemini) with lib/parser/ruleBasedGenerator.ts as the
 * zero-API local fallback — this module only persists the user's choices.
 */
const STORAGE_KEYS = {
  GEMINI_KEY: 'slidecraft_gemini_key',
  PROVIDER: 'slidecraft_llm_provider',
};

export const llmService = {
  getConfig(): LLMConfig {
    const envGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    const storedGeminiKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '' : '';
    const geminiKey = envGeminiKey || storedGeminiKey;

    const provider: LLMProvider = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEYS.PROVIDER) as LLMProvider) || 'gemini'
      : 'gemini';

    return {
      provider: geminiKey ? 'gemini' : provider,
      geminiKey,
    };
  },

  saveConfig(config: Partial<LLMConfig>): void {
    if (typeof window === 'undefined') return;
    if (config.provider !== undefined) localStorage.setItem(STORAGE_KEYS.PROVIDER, config.provider);
    if (config.geminiKey !== undefined) localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, config.geminiKey);
  },
};
