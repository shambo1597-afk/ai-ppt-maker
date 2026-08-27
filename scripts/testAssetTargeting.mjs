import { GoogleGenAI } from '@google/genai';
import { getDesignSchoolSystemPrompt } from '../src/lib/llm/designSchoolGuidelines.ts';

// Never hardcode a credential here — see scripts/README.md.
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing API key: set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment before running this script.');
  process.exit(1);
}
const systemPrompt = getDesignSchoolSystemPrompt();

async function test() {
  console.log('Testing Slide Count & Asset Targeting with Gemini 3.6 Flash...');
  const prompt = `# Biomimetic Architecture & Sustainable Facades
## Executive Monograph 2026

- **Kinetic Envelopes**: Bio-adaptive building skins respond dynamically to diurnal solar vectors, reducing HVAC thermal loads by 42%.
- **Embodied Carbon Impact**: 68% lifecycle embodied carbon reduction achieved through cross-laminated mass timber structural engineering.
- **Ecological Integration**: Living greywater phytoremediation wetlands integrated into exterior terraces.`;

  const dummyAssets = [
    {
      assetId: 'custom-timber-diagram-1',
      name: 'Eastgate Termite Biomimicry Diagram',
      targetSlide: 2,
      notes: 'Place on the kinetic bio-adaptive cooling slide',
    },
  ];

  const assetDirective = `\n\nUSER UPLOADED ASSETS MANIFEST:
\`\`\`json
${JSON.stringify(dummyAssets, null, 2)}
\`\`\`
INSTRUCTIONS FOR USER ASSETS:
- When an asset has a specific targetSlide (e.g. 2), you MUST set "attachedAssetId": "${dummyAssets[0].assetId}" on that exact slide index (Slide 2).
- When targetSlide is "auto", intelligently match the asset to the most relevant slide topic and assign "attachedAssetId".
- Slides with an "attachedAssetId" will render the user's custom graphic instead of a stock photo.`;

  const countDirective = 'Generate EXACTLY 5 slides (no more, no less).';
  const promptText = `USER INPUT BRIEF & OUTLINE:\n${prompt}${assetDirective}\n\nTASK:\n${countDirective} Evaluate this brief strictly against our 5 Design School Laws. Generate structured JSON matching our Graphic Design Schema.`;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${promptText}` }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(res.text);
    console.log('\n--- Presentation Result ---');
    console.log('Title:', parsed.presentationTitle);
    console.log('Total Slides Generated:', parsed.slides.length);
    parsed.slides.forEach((s, idx) => {
      console.log(`\nSlide ${idx + 1}:`);
      console.log(` Archetype: ${s.archetype}`);
      console.log(` Headline: "${s.headline}"`);
      console.log(` Attached Asset ID: ${s.attachedAssetId || 'none'}`);
      console.log(` Icon: ${s.iconName}`);
    });
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
