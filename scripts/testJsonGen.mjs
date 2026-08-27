import { GoogleGenAI } from '@google/genai';
import { getCanvaSystemPrompt } from '../src/lib/llm/systemPrompt.ts';

// Never hardcode a credential here — see scripts/README.md.
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing API key: set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment before running this script.');
  process.exit(1);
}

async function test() {
  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = getCanvaSystemPrompt();
  const userContent = 'Quantum Computing Revolution in Drug Discovery and Genomics';

  console.log('Sending structured generation request with gemini-3.6-flash...');

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nUSER INPUT:\nGenerate a 5-slide presentation JSON based on:\n${userContent}` }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    console.log('Response status: SUCCESS');
    console.log('Response text snippet:\n', res.text.slice(0, 500));
    const parsed = JSON.parse(res.text);
    console.log('Parsed title:', parsed.presentationTitle);
    console.log('Slide count:', parsed.slides?.length);
    console.log('Slide 1:', parsed.slides?.[0]);
  } catch (e) {
    console.error('Generation error:', e);
  }
}

test();
