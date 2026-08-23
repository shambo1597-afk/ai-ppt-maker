import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(ROOT_DIR, 'canva-samples');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'pptx', 'canvaBlueprints.json');

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

/**
 * Convert OpenXML EMU (English Metric Units: 914,400 EMUs per inch) to 1920x1080 pixels
 */
function emuToPx(emu, slideDimEmu, targetPx) {
  if (!emu) return 0;
  const num = parseInt(emu, 10);
  if (isNaN(num)) return 0;
  return Math.round((num / slideDimEmu) * targetPx);
}

/**
 * Convert pixels to inches (96 DPI)
 */
function pxToInches(px) {
  return parseFloat((px / 96).toFixed(2));
}

/**
 * Clean hex color from XML
 */
function cleanHex(colorVal, fallback = '#1A1715') {
  if (!colorVal) return fallback;
  const str = String(colorVal).trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(str)) {
    return '#' + str.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{3}$/.test(str)) {
    return '#' + str.split('').map(c => c + c).join('').toUpperCase();
  }
  return fallback;
}

/**
 * Classify functional role for a slot in the Canva layout
 */
function classifySlotRole(shape, textContent, fontSize, isLine, idx, totalShapes) {
  if (isLine) return 'divider';
  if (!textContent || textContent.trim().length === 0) {
    if (shape.type === 'pic' || shape.type === 'image') return 'image';
    return 'shape';
  }

  const clean = textContent.trim();

  // Footer / Page Number at the bottom of the slide
  if ((shape.y >= 980 || shape.y <= 60) && clean.length <= 6 && /^\d+$/i.test(clean)) {
    return 'footer';
  }

  // Numbered steps e.g. "01", "01.", "1.", "STEP 01"
  if (/^(0[1-9]|[1-9])\.?$/i.test(clean) || /^step\s*0?[1-9]/i.test(clean)) {
    return 'stepNumber';
  }

  // Quote
  if (clean.startsWith('“') || clean.startsWith('"') || (shape.fontStyle === 'italic' && clean.length > 30)) {
    if (fontSize >= 24 || clean.length > 50) return 'quote';
    return 'attribution';
  }

  // Giant Stat Number: e.g. "38 ms", "99.9%", "$38.4M", "240k", "+180%"
  if ((fontSize >= 44 && /^(\+|-)?(\$|€|£)?\d+([.,]\d+)?\s*(ms|%|M|B|K|x|GB|TB|sec|\/yr)?$/i.test(clean)) || fontSize >= 64) {
    return 'statNumber';
  }

  // Eyebrow tag: short, uppercase metadata at the top
  if (clean.length <= 45 && (clean === clean.toUpperCase() || fontSize <= 13) && (shape.y <= 240 || idx === 0)) {
    return 'eyebrow';
  }

  // Headline: large font size or first dominant text block
  if (fontSize >= 30 || (shape.y <= 360 && clean.length <= 90 && idx <= 3)) {
    return 'headline';
  }

  // Stat Label: subtitle directly under stat number
  if (fontSize >= 16 && clean.length <= 45 && shape.y >= 260 && shape.y <= 520) {
    return 'statLabel';
  }

  // Step Title / Step Description
  if (clean.length <= 40 && fontSize >= 18 && shape.y >= 200) {
    return 'stepTitle';
  }

  // Default prose body
  return 'body';
}

/**
 * Determine slide archetype from functional slots
 */
function determineArchetype(slots, slideIndex) {
  const statSlots = slots.filter(s => s.role === 'statNumber');
  const quoteSlots = slots.filter(s => s.role === 'quote');
  const stepNumberSlots = slots.filter(s => s.role === 'stepNumber');
  const stepTitleSlots = slots.filter(s => s.role === 'stepTitle');
  const imageSlots = slots.filter(s => s.role === 'image');
  const eyebrowSlots = slots.filter(s => s.role === 'eyebrow');
  const headlineSlots = slots.filter(s => s.role === 'headline');
  const bodySlots = slots.filter(s => s.role === 'body');

  if (slideIndex === 1) return 'COVER_TITLE';
  if (quoteSlots.length > 0) return 'MINIMAL_QUOTE';
  if (stepNumberSlots.length >= 2 || stepTitleSlots.length >= 3 || bodySlots.length >= 3) return 'TIMELINE_LIST';
  if (imageSlots.length > 0 && headlineSlots.length > 0) return 'EDITORIAL_SPLIT';
  if (bodySlots.length >= 2) return 'STORY_2_COLUMN';
  if (statSlots.length >= 1 && (statSlots[0].fontSize || 0) >= 50) return 'BIG_STAT_HERO';
  if (slots.filter(s => s.role !== 'divider' && s.role !== 'footer').length >= 5) return 'DATA_GRID';
  if (headlineSlots.length === 1 && bodySlots.length === 0 && !imageSlots.length) return 'SECTION_DIVIDER';
  if (headlineSlots.length > 0) return 'HERO_MINIMAL';

  return 'EDITORIAL_SPLIT';
}

/**
 * Parse an individual slide OpenXML tree
 */
async function parseSlideXml(slideXmlStr, slideIndex, fileName, slideWidthEmu, slideHeightEmu) {
  const parsed = await parser.parseStringPromise(slideXmlStr);
  const sld = parsed['p:sld'];
  if (!sld) return null;

  // 1. Extract slide background
  let bg = { type: 'color', color: '#FDFBF7' };
  try {
    const bgPr = sld['p:bg']?.['p:bgPr'] || sld['p:bgPr'];
    if (bgPr) {
      if (bgPr['a:solidFill']?.['a:srgbClr']?.['val']) {
        bg.color = cleanHex(bgPr['a:solidFill']['a:srgbClr']['val']);
      } else if (bgPr['a:solidFill']?.['a:schemeClr']?.['val']) {
        bg.color = '#FDFBF7';
      } else if (bgPr['a:gradFill']) {
        bg.type = 'gradient';
        bg.gradient = { from: '#FDFBF7', to: '#EFEAE1', direction: 'to-br' };
      }
    }
  } catch {}

  const slots = [];
  const spTree = sld['p:cSld']?.['p:spTree'];
  if (!spTree) return null;

  const shapes = Array.isArray(spTree['p:sp']) ? spTree['p:sp'] : (spTree['p:sp'] ? [spTree['p:sp']] : []);
  const pics = Array.isArray(spTree['p:pic']) ? spTree['p:pic'] : (spTree['p:pic'] ? [spTree['p:pic']] : []);
  const grpSps = Array.isArray(spTree['p:grpSp']) ? spTree['p:grpSp'] : (spTree['p:grpSp'] ? [spTree['p:grpSp']] : []);

  let zIndex = 1;
  const colorsFound = new Set();

  // Helper for processing standard shape
  function processShape(sp, idx) {
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

      // Skip negligible shapes
      if (width <= 4 && height <= 4) return;

      const isLine = sp['p:spPr']?.['a:prstGeom']?.['prst'] === 'line' || height <= 4 || (width <= 4 && height > 20);

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
              if (rPr['sz']) fontSize = Math.max(10, Math.round(parseInt(rPr['sz'], 10) / 100));
              if (rPr['b'] === '1' || rPr['b'] === true) fontWeight = '700';
              if (rPr['i'] === '1' || rPr['i'] === true) fontStyle = 'italic';
              if (rPr['a:latin']?.['typeface']) fontFamily = rPr['a:latin']['typeface'];
              if (rPr['a:solidFill']?.['a:srgbClr']?.['val']) {
                color = cleanHex(rPr['a:solidFill']['a:srgbClr']['val']);
                colorsFound.add(color);
              }
            }
          });
        });

        textContent = textParts.join('\n').trim();
      }

      // Check fill color on shapes
      if (sp['p:spPr']?.['a:solidFill']?.['a:srgbClr']?.['val']) {
        const fillCol = cleanHex(sp['p:spPr']['a:solidFill']['a:srgbClr']['val']);
        colorsFound.add(fillCol);
        if (isLine) color = fillCol;
      }

      const role = classifySlotRole({ x, y, width, height, fontStyle }, textContent, fontSize, isLine, idx, shapes.length);

      slots.push({
        id: `slot-${slideIndex}-${zIndex}`,
        role,
        x,
        y,
        width: Math.max(10, width),
        height: Math.max(2, height),
        xInches: pxToInches(x),
        yInches: pxToInches(y),
        widthInches: pxToInches(width),
        heightInches: pxToInches(height),
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
      console.warn('Error parsing shape:', err.message);
    }
  }

  shapes.forEach((sp, idx) => processShape(sp, idx));

  // Process grouped shapes
  grpSps.forEach((grp) => {
    try {
      const grpShapes = Array.isArray(grp['p:sp']) ? grp['p:sp'] : (grp['p:sp'] ? [grp['p:sp']] : []);
      grpShapes.forEach((sp, idx) => processShape(sp, idx));
    } catch {}
  });

  // 2. Parse pictures / image placeholders
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
        width: Math.max(100, width),
        height: Math.max(100, height),
        xInches: pxToInches(x),
        yInches: pxToInches(y),
        widthInches: pxToInches(width),
        heightInches: pxToInches(height),
        borderRadius: 12,
        zIndex: zIndex++,
      });
    } catch (err) {
      console.warn('Error parsing pic:', err.message);
    }
  });

  // Archetype deduction
  const archetype = determineArchetype(slots, slideIndex);
  const deckTitle = path.basename(fileName, '.pptx');

  return {
    id: `canva-bp-${deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${slideIndex}`,
    name: `Canva ${archetype.replace(/_/g, ' ')} (${deckTitle} - Slide ${slideIndex})`,
    sourceFile: fileName,
    slideIndex,
    archetype,
    canvasWidth: 1920,
    canvasHeight: 1080,
    background: bg,
    palette: Array.from(colorsFound).slice(0, 6),
    slots,
    personaVibe: fileName.toLowerCase().includes('green') ? 'earthy-craft' 
               : fileName.toLowerCase().includes('blue') ? 'swiss-studio'
               : fileName.toLowerCase().includes('red') || fileName.toLowerCase().includes('black') ? 'moody-editorial'
               : 'editorial-warm',
    tags: ['canva-extracted', archetype.toLowerCase(), deckTitle.toLowerCase()],
  };
}

/**
 * Main execution loop across all 10 decks in /canva-samples
 */
async function main() {
  console.log('====================================================');
  console.log('  CANVA 10-DECK STRUCTURAL LAYOUT BLUEPRINT EXTRACTOR');
  console.log('====================================================');

  const pptxFiles = fs.readdirSync(SAMPLES_DIR).filter(f => f.endsWith('.pptx'));
  console.log(`\nFound ${pptxFiles.length} Canva .pptx presentation(s) in: ${SAMPLES_DIR}\n`);

  const allBlueprints = [];
  const deckSummaries = [];

  for (const file of pptxFiles) {
    const filePath = path.join(SAMPLES_DIR, file);
    const fileSizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(1);
    console.log(`\n📂 Extracting "${file}" (${fileSizeMb} MB)...`);

    try {
      const zip = new AdmZip(filePath);

      // Slide dimensions
      let slideWidthEmu = 12192000;
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
        } catch (e) {}
      }

      // Read slides
      const slideEntries = zip.getEntries()
        .filter(e => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
        .sort((a, b) => {
          const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/)[1], 10);
          const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/)[1], 10);
          return numA - numB;
        });

      console.log(`   Found ${slideEntries.length} slides in deck.`);
      let deckExtractedCount = 0;

      for (let i = 0; i < slideEntries.length; i++) {
        const entry = slideEntries[i];
        const slideXml = entry.getData().toString('utf8');
        const bp = await parseSlideXml(slideXml, i + 1, file, slideWidthEmu, slideHeightEmu);
        if (bp && bp.slots.length > 0) {
          allBlueprints.push(bp);
          deckExtractedCount++;
        }
      }

      deckSummaries.push({ file, slidesParsed: deckExtractedCount });
      console.log(`   ✓ Successfully extracted ${deckExtractedCount} slide skeletons.`);
    } catch (err) {
      console.error(`   ✗ Error processing "${file}":`, err.message);
    }
  }

  // Group blueprints by archetype for summary
  const archetypeCounts = {};
  allBlueprints.forEach(b => {
    archetypeCounts[b.archetype] = (archetypeCounts[b.archetype] || 0) + 1;
  });

  const outputPayload = {
    version: '2.0.0',
    extractedAt: new Date().toISOString(),
    totalDecks: pptxFiles.length,
    totalBlueprints: allBlueprints.length,
    archetypeDistribution: archetypeCounts,
    blueprints: allBlueprints,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputPayload, null, 2), 'utf8');

  console.log('\n====================================================');
  console.log(`🎉 EXTRACTION COMPLETE: Extracted ${allBlueprints.length} Canva Layout Blueprints`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
  console.log('   Archetype Distribution:');
  Object.entries(archetypeCounts).forEach(([arch, count]) => {
    console.log(`     • ${arch.padEnd(20)}: ${count} layouts`);
  });
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Extraction script error:', err);
  process.exit(1);
});
