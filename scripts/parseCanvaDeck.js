import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import xml2js from 'xml2js';
import pptxgen from 'pptxgenjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(ROOT_DIR, 'canva-samples');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'pptx', 'canvaBlueprints.json');

// Ensure directories exist
if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

/**
 * Generate authentic Canva sample PPTX decks if canva-samples is empty
 */
async function generateSampleCanvaDecksIfEmpty() {
  const existingFiles = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.pptx'));
  if (existingFiles.length > 0) {
    console.log(`Found ${existingFiles.length} existing .pptx deck(s) in /canva-samples.`);
    return;
  }

  console.log('Creating initial Canva sample decks in /canva-samples...');

  // 1. Editorial Warm Deck
  const pptx1 = new pptxgen();
  pptx1.layout = 'LAYOUT_16x9';

  // Slide 1: Editorial Title
  const s1 = pptx1.addSlide();
  s1.background = { color: 'FDFBF7' };
  s1.addText('STRATEGIC BRIEF — 2026 EDITION', {
    x: 1.0, y: 1.0, w: 6.0, h: 0.3,
    fontSize: 10, fontFace: 'Inter', bold: true, color: 'B85042',
  });
  s1.addText('The Architecture of\nHuman-Scale Intelligence', {
    x: 1.0, y: 1.5, w: 10.0, h: 1.8,
    fontSize: 48, fontFace: 'Playfair Display', bold: true, color: '1A1715',
  });
  s1.addShape(pptx1.ShapeType.line, {
    x: 1.0, y: 3.5, w: 1.0, h: 0,
    line: { color: 'B85042', width: 2 },
  });
  s1.addText('Moving beyond robotic batch processing toward elegant, deterministic distributed systems designed for real-world resilience.', {
    x: 1.0, y: 3.8, w: 9.0, h: 1.5,
    fontSize: 18, fontFace: 'Inter', color: '6E655F',
  });

  // Slide 2: Editorial Split
  const s2 = pptx1.addSlide();
  s2.background = { color: 'FDFBF7' };
  s2.addText('SYSTEM FOUNDATIONS', {
    x: 0.8, y: 0.8, w: 5.0, h: 0.3,
    fontSize: 10, fontFace: 'Inter', bold: true, color: 'B85042',
  });
  s2.addText('Decoupled State &\nInstant Execution', {
    x: 0.8, y: 1.2, w: 5.5, h: 1.4,
    fontSize: 38, fontFace: 'Playfair Display', bold: true, color: '1A1715',
  });
  s2.addShape(pptx1.ShapeType.line, {
    x: 0.8, y: 2.8, w: 0.8, h: 0,
    line: { color: 'B85042', width: 2 },
  });
  s2.addText('Modern distributed workloads require decoupled computation and deterministic state synchronization. Latency drops below 80ms at P99 while reliability reaches 99.99% across global regions.', {
    x: 0.8, y: 3.1, w: 5.5, h: 3.2,
    fontSize: 16, fontFace: 'Inter', color: '6E655F',
  });
  s2.addShape(pptx1.ShapeType.rect, {
    x: 6.8, y: 0.8, w: 5.8, h: 5.8,
    fill: { color: 'EFEAE1' },
    line: { color: 'E2DBD0', width: 1 },
  });

  // Slide 3: Hero Stat
  const s3 = pptx1.addSlide();
  s3.background = { color: 'FDFBF7' };
  s3.addText('MEASURABLE IMPACT', {
    x: 0.8, y: 0.8, w: 5.0, h: 0.3,
    fontSize: 10, fontFace: 'Inter', bold: true, color: 'B85042',
  });
  s3.addText('38 ms', {
    x: 0.8, y: 1.2, w: 6.0, h: 1.6,
    fontSize: 96, fontFace: 'Playfair Display', bold: true, color: '1A1715',
  });
  s3.addText('Global Tail Latency (P99)', {
    x: 0.8, y: 3.0, w: 5.5, h: 0.5,
    fontSize: 24, fontFace: 'Playfair Display', bold: true, color: 'B85042',
  });
  s3.addShape(pptx1.ShapeType.line, {
    x: 0.8, y: 3.6, w: 1.0, h: 0,
    line: { color: 'B85042', width: 2 },
  });
  s3.addText('Direct edge node compilation bypasses central message queues, delivering instant response times across 42 availability zones.', {
    x: 0.8, y: 3.9, w: 5.5, h: 2.5,
    fontSize: 16, fontFace: 'Inter', color: '6E655F',
  });

  // Slide 4: Large Pull-Quote
  const s4 = pptx1.addSlide();
  s4.background = { color: 'FDFBF7' };
  s4.addText('GUIDING PHILOSOPHY', {
    x: 1.0, y: 0.8, w: 5.0, h: 0.3,
    fontSize: 10, fontFace: 'Inter', bold: true, color: 'B85042',
  });
  s4.addText('“Simplicity is prerequisite for reliability.”', {
    x: 1.0, y: 1.8, w: 11.0, h: 2.6,
    fontSize: 42, fontFace: 'Playfair Display', italic: true, color: '1A1715',
  });
  s4.addShape(pptx1.ShapeType.line, {
    x: 1.0, y: 4.8, w: 1.0, h: 0,
    line: { color: 'B85042', width: 2 },
  });
  s4.addText('Edsger W. Dijkstra — Turing Award Laureate & Computer Scientist', {
    x: 1.0, y: 5.1, w: 9.0, h: 0.6,
    fontSize: 16, fontFace: 'Inter', bold: true, color: 'B85042',
  });

  // Slide 5: Minimal List
  const s5 = pptx1.addSlide();
  s5.background = { color: 'FDFBF7' };
  s5.addText('STRATEGIC SEQUENCE', {
    x: 0.8, y: 0.8, w: 5.0, h: 0.3,
    fontSize: 10, fontFace: 'Inter', bold: true, color: 'B85042',
  });
  s5.addText('Three Pillars of Execution', {
    x: 0.8, y: 1.2, w: 11.0, h: 0.8,
    fontSize: 34, fontFace: 'Playfair Display', bold: true, color: '1A1715',
  });
  s5.addShape(pptx1.ShapeType.line, {
    x: 0.8, y: 2.1, w: 11.7, h: 0,
    line: { color: 'E2DBD0', width: 1 },
  });

  // 3 items
  const items = [
    { num: '01.', title: 'Edge-Native Deployment', desc: 'Zero-cold-start execution with localized state caching across every distributed edge region.' },
    { num: '02.', title: 'Cryptographic Security', desc: 'Hardware-level security module attestation at every service and agent boundary.' },
    { num: '03.', title: 'Autonomous Telemetry', desc: 'Real-time telemetry analysis with automated instant rollback on anomalous metrics.' },
  ];

  items.forEach((item, idx) => {
    const y = 2.4 + idx * 1.5;
    s5.addText(item.num, { x: 0.8, y: y, w: 0.8, h: 0.4, fontSize: 20, fontFace: 'Playfair Display', bold: true, color: 'B85042' });
    s5.addText(item.title, { x: 1.8, y: y, w: 3.5, h: 0.5, fontSize: 20, fontFace: 'Playfair Display', bold: true, color: '1A1715' });
    s5.addText(item.desc, { x: 5.5, y: y, w: 7.0, h: 1.1, fontSize: 15, fontFace: 'Inter', color: '6E655F' });
    if (idx < 2) {
      s5.addShape(pptx1.ShapeType.line, { x: 0.8, y: y + 1.4, w: 11.7, h: 0, line: { color: 'E2DBD0', width: 1 } });
    }
  });

  const deck1Path = path.join(SAMPLES_DIR, 'canva-editorial-warm.pptx');
  await pptx1.writeFile({ fileName: deck1Path });
  console.log(`Saved sample Canva deck to ${deck1Path}`);

  // 2. Swiss Studio Deck
  const pptx2 = new pptxgen();
  pptx2.layout = 'LAYOUT_16x9';

  const sw1 = pptx2.addSlide();
  sw1.background = { color: 'F4F4F6' };
  sw1.addText('STUDIO 01 / ARCHITECTURE', { x: 0.8, y: 0.8, w: 5.0, h: 0.3, fontSize: 10, fontFace: 'Fira Code', color: '0044EE' });
  sw1.addText('PRECISION SYSTEMS', { x: 0.8, y: 1.3, w: 11.0, h: 1.6, fontSize: 60, fontFace: 'Space Grotesk', bold: true, color: '111111' });
  sw1.addShape(pptx2.ShapeType.line, { x: 0.8, y: 3.2, w: 11.7, h: 0, line: { color: '111111', width: 2 } });
  sw1.addText('A deterministic engineering paradigm built on zero-latency state synchronization and formal hardware verification.', {
    x: 0.8, y: 3.6, w: 9.0, h: 1.5, fontSize: 20, fontFace: 'Space Grotesk', color: '555555',
  });

  const deck2Path = path.join(SAMPLES_DIR, 'canva-swiss-studio.pptx');
  await pptx2.writeFile({ fileName: deck2Path });
  console.log(`Saved sample Canva deck to ${deck2Path}`);
}

/**
 * Convert OpenXML EMU (English Metric Units) to 1920x1080 pixels
 */
function emuToPx(emu, slideWidthEmu, targetPx = 1920) {
  if (!emu) return 0;
  const num = parseInt(emu, 10);
  if (isNaN(num)) return 0;
  return Math.round((num / slideWidthEmu) * targetPx);
}

/**
 * Classify a slot's role based on bounding box, font size, and text characteristics
 */
function classifySlotRole(shape, text, fontSize, isShapeLine, index) {
  if (isShapeLine) return 'divider';
  if (!text || text.trim().length === 0) {
    if (shape.type === 'pic' || shape.type === 'image') return 'image';
    return 'shape';
  }

  const cleanText = text.trim();

  // Numbered list item like "01.", "02."
  if (/^0[1-9]\.$/i.test(cleanText)) return 'stepNumber';

  // Eyebrow tag: short, upper case or low y
  if (cleanText.length < 35 && cleanText === cleanText.toUpperCase() && (shape.y < 200 || fontSize <= 14)) {
    return 'eyebrow';
  }

  // Quote
  if (cleanText.startsWith('“') || cleanText.startsWith('"') || shape.fontStyle === 'italic') {
    if (fontSize >= 28) return 'quote';
    return 'attribution';
  }

  // Stat Number: e.g. "38 ms", "$12.4M", "99.9%"
  if (/^(\$|€|£)?\d+([.,]\d+)?\s*(ms|%|M|B|x|k|GB|TB|sec)?$/i.test(cleanText) || fontSize >= 64) {
    return 'statNumber';
  }

  // Headline
  if (fontSize >= 32 || (shape.y < 350 && cleanText.length < 80 && index <= 2)) {
    return 'headline';
  }

  // Stat Label
  if (fontSize >= 20 && cleanText.length < 40 && shape.y > 250 && shape.y < 450) {
    return 'statLabel';
  }

  // Default prose body
  return 'body';
}

/**
 * Parse OpenXML slide XML string into structured CanvaSlideBlueprint
 */
async function parseSlideXml(slideXmlStr, slideIndex, fileName, slideWidthEmu, slideHeightEmu) {
  const parsed = await parser.parseStringPromise(slideXmlStr);
  const sld = parsed['p:sld'];
  if (!sld) return null;

  // 1. Extract background
  let bg = { type: 'color', color: '#FDFBF7' };
  try {
    const bgPr = sld['p:bg']?.['p:bgPr'] || sld['p:bgPr'];
    if (bgPr?.['a:solidFill']?.['a:srgbClr']?.['val']) {
      bg.color = '#' + bgPr['a:solidFill']['a:srgbClr']['val'];
    }
  } catch {}

  const slots = [];
  const spTree = sld['p:cSld']?.['p:spTree'];
  if (!spTree) return null;

  // Process standard shapes
  const shapes = Array.isArray(spTree['p:sp']) ? spTree['p:sp'] : (spTree['p:sp'] ? [spTree['p:sp']] : []);
  const pics = Array.isArray(spTree['p:pic']) ? spTree['p:pic'] : (spTree['p:pic'] ? [spTree['p:pic']] : []);

  let zIndex = 1;

  // 2. Parse text & shape elements
  shapes.forEach((sp, idx) => {
    try {
      const xfrm = sp['p:spPr']?.['a:xfrm'];
      if (!xfrm) return;

      const offX = xfrm['a:off']?.['x'] || 0;
      const offY = xfrm['a:off']?.['y'] || 0;
      const extX = xfrm['a:ext']?.['cx'] || 0;
      const extY = xfrm['a:ext']?.['cy'] || 0;

      const x = emuToPx(offX, slideWidthEmu, 1920);
      const y = emuToPx(offY, slideHeightEmu, 1080);
      const width = emuToPx(extX, slideWidthEmu, 1920);
      const height = emuToPx(extY, slideHeightEmu, 1080);

      // Check if it's a line divider
      const isLine = sp['p:spPr']?.['a:prstGeom']?.['prst'] === 'line' || height <= 6 || width <= 6;

      // Extract text content & styles
      let textContent = '';
      let fontSize = 20;
      let fontFamily = 'Inter';
      let fontWeight = '400';
      let fontStyle = 'normal';
      let color = '#1A1715';
      let align = 'left';

      const txBody = sp['p:txBody'];
      if (txBody) {
        const paragraphs = Array.isArray(txBody['a:p']) ? txBody['a:p'] : (txBody['a:p'] ? [txBody['a:p']] : []);
        const textParts = [];

        paragraphs.forEach(p => {
          if (p['a:pPr']?.['algn']) {
            const a = p['a:pPr']['algn'];
            if (a === 'ctr') align = 'center';
            else if (a === 'r') align = 'right';
            else if (a === 'just') align = 'justify';
          }

          const runs = Array.isArray(p['a:r']) ? p['a:r'] : (p['a:r'] ? [p['a:r']] : []);
          runs.forEach(r => {
            if (r['a:t']) textParts.push(r['a:t']);
            const rPr = r['a:rPr'];
            if (rPr) {
              if (rPr['sz']) fontSize = Math.round(parseInt(rPr['sz'], 10) / 100);
              if (rPr['b'] === '1' || rPr['b'] === true) fontWeight = '700';
              if (rPr['i'] === '1' || rPr['i'] === true) fontStyle = 'italic';
              if (rPr['a:latin']?.['typeface']) fontFamily = rPr['a:latin']['typeface'];
              if (rPr['a:solidFill']?.['a:srgbClr']?.['val']) color = '#' + rPr['a:solidFill']['a:srgbClr']['val'];
            }
          });
        });

        textContent = textParts.join('\n');
      }

      const role = classifySlotRole({ x, y, width, height, fontStyle }, textContent, fontSize, isLine, idx);

      slots.push({
        id: `slot-${slideIndex}-${zIndex}`,
        role,
        x,
        y,
        width: Math.max(20, width),
        height: Math.max(2, height),
        fontSize: isLine ? undefined : fontSize,
        fontFamily: isLine ? undefined : fontFamily,
        fontWeight: isLine ? undefined : fontWeight,
        fontStyle: isLine ? undefined : fontStyle,
        color,
        align: isLine ? undefined : align,
        defaultContent: textContent,
        zIndex: zIndex++,
      });
    } catch (err) {
      console.warn('Error parsing shape:', err);
    }
  });

  // 3. Parse pictures / image slots
  pics.forEach(pic => {
    try {
      const xfrm = pic['p:spPr']?.['a:xfrm'];
      if (!xfrm) return;

      const offX = xfrm['a:off']?.['x'] || 0;
      const offY = xfrm['a:off']?.['y'] || 0;
      const extX = xfrm['a:ext']?.['cx'] || 0;
      const extY = xfrm['a:ext']?.['cy'] || 0;

      const x = emuToPx(offX, slideWidthEmu, 1920);
      const y = emuToPx(offY, slideHeightEmu, 1080);
      const width = emuToPx(extX, slideWidthEmu, 1920);
      const height = emuToPx(extY, slideHeightEmu, 1080);

      slots.push({
        id: `slot-${slideIndex}-${zIndex}`,
        role: 'image',
        x,
        y,
        width,
        height,
        borderRadius: 12,
        zIndex: zIndex++,
      });
    } catch (err) {
      console.warn('Error parsing pic:', err);
    }
  });

  // Deduce archetype from slots
  let archetype = 'SPLIT_EDITORIAL';
  const hasStat = slots.some(s => s.role === 'statNumber');
  const hasQuote = slots.some(s => s.role === 'quote');
  const hasNumberedList = slots.some(s => s.role === 'stepNumber');
  const hasImage = slots.some(s => s.role === 'image');
  const hasEyebrow = slots.some(s => s.role === 'eyebrow');

  if (hasQuote) archetype = 'QUOTE_EDITORIAL';
  else if (hasStat) archetype = 'STAT_IMPACT';
  else if (hasNumberedList) archetype = 'THREE_COLUMN_INSIGHTS';
  else if (hasImage && slots.some(s => s.role === 'headline')) archetype = 'SPLIT_EDITORIAL';
  else if (hasEyebrow && slots.some(s => (s.fontSize || 0) >= 48)) archetype = 'HERO_MINIMAL';

  return {
    id: `canva-bp-${path.basename(fileName, '.pptx')}-${slideIndex}`,
    name: `Canva ${archetype.replace(/_/g, ' ')} (${path.basename(fileName, '.pptx')})`,
    sourceFile: path.basename(fileName),
    slideIndex,
    archetype: archetype,
    canvasWidth: 1920,
    canvasHeight: 1080,
    background: bg,
    slots,
    personaVibe: fileName.includes('warm') ? 'editorial-warm' : fileName.includes('swiss') ? 'swiss-studio' : 'organic-editorial',
    tags: ['canva', archetype.toLowerCase(), 'organic-layout'],
  };
}

/**
 * Main parser entry point
 */
async function main() {
  console.log('--- Starting Canva PPTX Blueprint Extractor ---');
  await generateSampleCanvaDecksIfEmpty();

  const pptxFiles = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.pptx'));
  console.log(`Found ${pptxFiles.length} Canva .pptx file(s) in ${SAMPLES_DIR}. Parsing structural blueprints...`);

  const allBlueprints = [];

  for (const file of pptxFiles) {
    const filePath = path.join(SAMPLES_DIR, file);
    console.log(`\nParsing "${file}"...`);
    const zip = new AdmZip(filePath);

    // 1. Get slide dimensions from presentation.xml
    let slideWidthEmu = 12192000; // 16:9 standard
    let slideHeightEmu = 6858000;

    const presEntry = zip.getEntry('ppt/presentation.xml');
    if (presEntry) {
      try {
        const presXml = presEntry.getData().toString('utf8');
        const parsedPres = await parser.parseStringPromise(presXml);
        const sldSz = parsedPres['p:presentation']?.['p:sldSz'];
        if (sldSz?.['cx'] && sldSz?.['cy']) {
          slideWidthEmu = parseInt(sldSz['cx'], 10);
          slideHeightEmu = parseInt(sldSz['cy'], 10);
        }
      } catch (err) {
        console.warn('Could not parse presentation.xml sldSz:', err);
      }
    }

    // 2. Iterate through slides
    const slideEntries = zip.getEntries().filter(e => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'));
    console.log(`Found ${slideEntries.length} slide(s) in "${file}".`);

    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      const slideXml = entry.getData().toString('utf8');
      const bp = await parseSlideXml(slideXml, i + 1, file, slideWidthEmu, slideHeightEmu);
      if (bp) {
        allBlueprints.push(bp);
        console.log(`  ✓ Slide ${i + 1}: Archetype "${bp.archetype}" with ${bp.slots.length} extracted slots.`);
      }
    }
  }

  const outputData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalBlueprints: allBlueprints.length,
    blueprints: allBlueprints,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`\n🎉 Successfully extracted ${allBlueprints.length} Canva layout blueprints to:`);
  console.log(`   ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
