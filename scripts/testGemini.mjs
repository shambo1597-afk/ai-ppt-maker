import { GoogleGenAI } from '@google/genai';

// Never hardcode a credential here — see scripts/README.md. Read from the
// environment only; both var names are accepted since the app itself reads
// VITE_GEMINI_API_KEY (see src/lib/llm/client.ts's resolveGeminiApiKey())
// but a plain GEMINI_API_KEY is the more conventional name for a script
// that isn't going through Vite's env handling at all.
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing API key: set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment before running this script.');
  process.exit(1);
}
console.log('Testing GoogleGenAI with key:', apiKey.slice(0, 8) + '...');

async function test() {
  const ai = new GoogleGenAI({ apiKey });
  console.log('ai keys:', Object.keys(ai));
  if (ai.interactions) console.log('ai.interactions keys:', Object.keys(ai.interactions));
  if (ai.models) console.log('ai.models keys:', Object.keys(ai.models));

  // Test models
  const testModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.6-flash'];
  for (const m of testModels) {
    try {
      console.log(`\nTesting ai.models.generateContent with model "${m}"...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say hello in 3 words',
      });
      console.log(`Success with ai.models.generateContent (${m}):`, res.text);
      return;
    } catch (e) {
      console.log(`ai.models.generateContent (${m}) failed:`, e.message);
    }
  }

  // Test interactions
  for (const m of testModels) {
    try {
      console.log(`\nTesting ai.interactions.create with model "${m}"...`);
      const res = await ai.interactions.create({
        model: m,
        input: 'Say hello in 3 words',
      });
      console.log(`Success with ai.interactions.create (${m}):`, res.output_text);
      return;
    } catch (e) {
      console.log(`ai.interactions.create (${m}) failed:`, e.message);
    }
  }
}

test();
