import { GoogleGenAI } from '@google/genai';
import { getDesignSchoolSystemPrompt } from '../src/lib/llm/designSchoolGuidelines.ts';

const apiKey = 'AIzaSyBpg6NBSo1WsPdvmBOiY7vqWcE_Xen9iHM';
const systemPrompt = getDesignSchoolSystemPrompt();

async function run() {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `# Biomimetic Architecture & Sustainable Facades
## Executive Monograph 2026

- **Kinetic Envelopes**: Bio-adaptive building skins respond dynamically to diurnal solar vectors, reducing HVAC thermal loads by 42%.
- **Embodied Carbon Impact**: 68% lifecycle embodied carbon reduction achieved through cross-laminated mass timber structural engineering.
- **Ecological Integration**: Living greywater phytoremediation wetlands integrated into exterior terraces.`;

  console.log('Testing Design School Prompt with Gemini...');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nUSER INPUT BRIEF & NOTES:\n${prompt}\n\nTASK:\nEvaluate this brief strictly against our 5 Design School Laws. Generate a 5-to-6 slide presentation JSON matching our Graphic Design Schema.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    console.log('Result raw response:\n', res.text);
    const parsed = JSON.parse(res.text);
    console.log('\nParsed presentation title:', parsed.presentationTitle);
    console.log('Theme:', parsed.theme);
    console.log('Slide count:', parsed.slides?.length);
    parsed.slides?.forEach((s, idx) => {
      console.log(` Slide ${idx + 1}: archetype=${s.archetype}, headline="${s.headline}", imageKeywords="${s.imageKeywords}"`);
    });
  } catch (err) {
    console.error('Error during generation:', err);
  }
}

run();
