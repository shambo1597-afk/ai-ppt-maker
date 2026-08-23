import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import xml2js from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SAMPLES_DIR = path.join(ROOT_DIR, 'canva-samples');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'lib', 'design', 'designGrammar.json');

const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/**
 * ============================================================================
 * DESIGN GRAMMAR EXTRACTOR
 * ============================================================================
 * Parses the real Canva .pptx exports in /canva-samples and mines their
 * SPATIAL MATH — not their literal slide content. Where the old extractor
 * (extractCanvaLayouts.js / parseCanvaDeck.js) copied exact shape coordinates
 * and text into a "blueprint library" that the app then replayed verbatim,
 * this script only keeps statistical *ratios and rules*: margin proportions,
 * typographic scale ratios, spacing rhythm, image-column proportions, and
 * accessible color-contrast pairs actually used together in the samples.
 *
 * The output (src/lib/design/designGrammar.json) is consumed by
 * src/lib/engine/composer.ts, which composes each slide's geometry live from
 * content — it never replays a stored slide.
 * ============================================================================
 */

function emuToPx(emu, slideWidthEmu, targetPx = CANVAS_W) {
  if (!emu) return 0;
  const num = parseInt(emu, 10);
  if (Number.isNaN(num)) return 0;
  return Math.round((num / slideWidthEmu) * targetPx);
}

function median(nums) {
  const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (arr.length === 0) return undefined;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

// --- WCAG relative luminance & contrast ---
function srgbChannelToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  if (lA === null || lB === null) return 0;
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract every text/shape/picture element from one slide's XML into
 * flat geometry + typography records (px in a 1920x1080 canvas space).
 */
async function parseSlideShapes(slideXmlStr, slideWidthEmu, slideHeightEmu) {
  const parsed = await parser.parseStringPromise(slideXmlStr);
  const sld = parsed['p:sld'];
  if (!sld) return null;

  const cSld = sld['p:cSld'];

  let background = null;
  try {
    const bgPr = cSld?.['p:bg']?.['p:bgPr'];
    if (bgPr?.['a:solidFill']?.['a:srgbClr']?.['val']) {
      background = `#${bgPr['a:solidFill']['a:srgbClr']['val']}`.toUpperCase();
    }
  } catch {
    // no solid background fill (image/gradient bg) — skip for grammar purposes
  }

  const spTree = cSld?.['p:spTree'];
  if (!spTree) return null;

  const shapes = Array.isArray(spTree['p:sp']) ? spTree['p:sp'] : spTree['p:sp'] ? [spTree['p:sp']] : [];
  const pics = Array.isArray(spTree['p:pic']) ? spTree['p:pic'] : spTree['p:pic'] ? [spTree['p:pic']] : [];

  const textShapes = [];
  const pictures = [];

  shapes.forEach((sp) => {
    try {
      const xfrm = sp['p:spPr']?.['a:xfrm'];
      if (!xfrm) return;
      const x = emuToPx(xfrm['a:off']?.['x'] || 0, slideWidthEmu, CANVAS_W);
      const y = emuToPx(xfrm['a:off']?.['y'] || 0, slideHeightEmu, CANVAS_H);
      const width = emuToPx(xfrm['a:ext']?.['cx'] || 0, slideWidthEmu, CANVAS_W);
      const height = emuToPx(xfrm['a:ext']?.['cy'] || 0, slideHeightEmu, CANVAS_H);
      if (width <= 0 || height <= 0) return;

      const txBody = sp['p:txBody'];
      if (!txBody) return; // grammar cares about typography-bearing shapes

      let fontSize;
      let color;
      let charCount = 0;
      const paragraphs = Array.isArray(txBody['a:p']) ? txBody['a:p'] : txBody['a:p'] ? [txBody['a:p']] : [];
      paragraphs.forEach((p) => {
        const runs = Array.isArray(p['a:r']) ? p['a:r'] : p['a:r'] ? [p['a:r']] : [];
        runs.forEach((r) => {
          const text = r['a:t'] || '';
          charCount += text.length;
          const rPr = r['a:rPr'];
          if (rPr) {
            if (rPr['sz']) {
              const sz = Math.round(parseInt(rPr['sz'], 10) / 100);
              // Track the largest run size in the shape as its representative size
              if (!fontSize || sz > fontSize) fontSize = sz;
            }
            if (rPr['a:solidFill']?.['a:srgbClr']?.['val'] && !color) {
              color = `#${rPr['a:solidFill']['a:srgbClr']['val']}`.toUpperCase();
            }
          }
        });
      });

      if (!fontSize || charCount === 0) return;
      textShapes.push({ x, y, width, height, fontSize, color, charCount });
    } catch {
      // skip malformed shape
    }
  });

  pics.forEach((pic) => {
    try {
      const xfrm = pic['p:spPr']?.['a:xfrm'];
      if (!xfrm) return;
      const width = emuToPx(xfrm['a:ext']?.['cx'] || 0, slideWidthEmu, CANVAS_W);
      const height = emuToPx(xfrm['a:ext']?.['cy'] || 0, slideHeightEmu, CANVAS_H);
      if (width <= 0 || height <= 0) return;
      pictures.push({ width, height });
    } catch {
      // skip
    }
  });

  return { background, textShapes, pictures };
}

async function main() {
  console.log('--- Extracting Design Grammar from /canva-samples ---');

  if (!fs.existsSync(SAMPLES_DIR)) {
    throw new Error(`No /canva-samples directory found at ${SAMPLES_DIR}.`);
  }
  const pptxFiles = fs.readdirSync(SAMPLES_DIR).filter((f) => f.endsWith('.pptx'));
  if (pptxFiles.length === 0) {
    throw new Error(`No .pptx files found in ${SAMPLES_DIR}. Add real Canva exports to mine a design grammar from.`);
  }
  console.log(`Found ${pptxFiles.length} real Canva deck(s). Parsing spatial math...`);

  const marginXs = [];
  const marginYs = [];
  const titleSizes = [];
  const bodySizes = [];
  const titleToBodyRatios = [];
  const stackGapRatios = [];
  const columnGutterRatios = [];
  const imageColumnRatios = [];
  const textBlockCounts = [];
  const contrastPairCounts = new Map(); // "bg|fg" -> { bg, fg, contrast, count }

  let slideCount = 0;

  for (const file of pptxFiles) {
    const filePath = path.join(SAMPLES_DIR, file);
    let zip;
    try {
      zip = new AdmZip(filePath);
    } catch (err) {
      console.warn(`  ! Could not open "${file}": ${err.message}`);
      continue;
    }

    let slideWidthEmu = 12192000;
    let slideHeightEmu = 6858000;
    const presEntry = zip.getEntry('ppt/presentation.xml');
    if (presEntry) {
      try {
        const parsedPres = await parser.parseStringPromise(presEntry.getData().toString('utf8'));
        const sldSz = parsedPres['p:presentation']?.['p:sldSz'];
        if (sldSz?.['cx'] && sldSz?.['cy']) {
          slideWidthEmu = parseInt(sldSz['cx'], 10);
          slideHeightEmu = parseInt(sldSz['cy'], 10);
        }
      } catch {
        // keep 16:9 defaults
      }
    }

    const slideEntries = zip
      .getEntries()
      .filter((e) => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'));

    for (const entry of slideEntries) {
      let parsedSlide;
      try {
        const xml = entry.getData().toString('utf8');
        parsedSlide = await parseSlideShapes(xml, slideWidthEmu, slideHeightEmu);
      } catch (err) {
        console.warn(`  ! Failed to parse ${entry.entryName} in "${file}": ${err.message}`);
        continue;
      }
      if (!parsedSlide) continue;
      slideCount += 1;

      const { background, textShapes, pictures } = parsedSlide;

      // Only consider shapes that carry meaningful text as "content" shapes
      // (drop near-full-bleed background rectangles/lines that skew margins).
      const contentShapes = textShapes.filter(
        (s) => s.width < CANVAS_W * 0.92 && s.height < CANVAS_H * 0.92 && s.x >= -40 && s.y >= -40
      );

      if (contentShapes.length > 0) {
        marginXs.push(Math.min(...contentShapes.map((s) => s.x)) / CANVAS_W);
        marginYs.push(Math.min(...contentShapes.map((s) => s.y)) / CANVAS_H);
        textBlockCounts.push(contentShapes.length);
      }

      // Title = largest font-size shape; body = the largest *other* shape by char count
      const byFontSize = [...contentShapes].sort((a, b) => b.fontSize - a.fontSize);
      const title = byFontSize[0];
      const bodyCandidates = byFontSize
        .slice(1)
        .filter((s) => s.fontSize < (title?.fontSize || Infinity) && s.charCount >= 12);
      const body = bodyCandidates.sort((a, b) => b.charCount - a.charCount)[0];

      if (title) titleSizes.push(title.fontSize);
      if (body) bodySizes.push(body.fontSize);
      if (title && body && body.fontSize > 0) {
        titleToBodyRatios.push(title.fontSize / body.fontSize);
      }

      // Stack rhythm: vertically adjacent shapes sharing a column
      for (let i = 0; i < contentShapes.length; i++) {
        for (let j = 0; j < contentShapes.length; j++) {
          if (i === j) continue;
          const a = contentShapes[i];
          const b = contentShapes[j];
          const sameColumn = Math.abs(a.x - b.x) < CANVAS_W * 0.03;
          const stacked = b.y > a.y + a.height && b.y - (a.y + a.height) < CANVAS_H * 0.15;
          if (sameColumn && stacked) {
            stackGapRatios.push((b.y - (a.y + a.height)) / CANVAS_H);
          }
          const sameRow = Math.abs(a.y - b.y) < CANVAS_H * 0.04;
          const sideBySide = b.x > a.x + a.width && b.x - (a.x + a.width) < CANVAS_W * 0.15;
          if (sameRow && sideBySide) {
            columnGutterRatios.push((b.x - (a.x + a.width)) / CANVAS_W);
          }
        }
      }

      // Image column proportion (ignore full-bleed background photos)
      pictures.forEach((pic) => {
        const wRatio = pic.width / CANVAS_W;
        if (wRatio >= 0.15 && wRatio <= 0.75) {
          imageColumnRatios.push(wRatio);
        }
      });

      // Background/foreground contrast pairs actually used together
      if (background) {
        const weighted = new Map();
        contentShapes.forEach((s) => {
          if (!s.color) return;
          weighted.set(s.color, (weighted.get(s.color) || 0) + s.charCount);
        });
        const dominant = [...weighted.entries()].sort((a, b) => b[1] - a[1])[0];
        if (dominant) {
          const fg = dominant[0];
          const ratio = contrastRatio(background, fg);
          if (ratio >= 3) {
            const key = `${background}|${fg}`;
            const existing = contrastPairCounts.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              contrastPairCounts.set(key, { bg: background, fg, contrast: Math.round(ratio * 100) / 100, count: 1 });
            }
          }
        }
      }
    }

    console.log(`  ✓ Parsed "${file}" (${slideEntries.length} slides)`);
  }

  if (slideCount === 0) {
    throw new Error('Parsed 0 slides across all sample decks — grammar extraction produced nothing.');
  }

  const contrastPairs = [...contrastPairCounts.values()]
    .sort((a, b) => b.count - a.count || b.contrast - a.contrast)
    .slice(0, 16);

  const grammar = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceDeckCount: pptxFiles.length,
    sourceSlideCount: slideCount,
    margins: {
      // Proportion of canvas reserved as outer margin, learned from where real
      // content shapes actually start (not a fixed pixel constant).
      xRatio: clamp(median(marginXs) ?? 0.06, 0.03, 0.12),
      yRatio: clamp(median(marginYs) ?? 0.09, 0.04, 0.16),
    },
    typeScale: {
      // Title & body size expressed relative to canvas height so they scale
      // with any export resolution, plus the empirical ratio between them.
      titleToCanvasHeightRatio: clamp(median(titleSizes.map((s) => s / CANVAS_H)) ?? 0.08, 0.045, 0.14),
      bodyToCanvasHeightRatio: clamp(median(bodySizes.map((s) => s / CANVAS_H)) ?? 0.018, 0.012, 0.03),
      titleToBodyRatio: clamp(median(titleToBodyRatios) ?? 3.2, 1.8, 6),
    },
    spacing: {
      stackGapRatio: clamp(median(stackGapRatios) ?? 0.02, 0.008, 0.06),
      columnGutterRatio: clamp(median(columnGutterRatios) ?? 0.02, 0.008, 0.06),
    },
    imageColumnRatio: clamp(median(imageColumnRatios) ?? 0.42, 0.3, 0.6),
    contentDensity: {
      medianTextBlocksPerSlide: Math.round(median(textBlockCounts) ?? 4),
    },
    contrastPairs,
  };

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(grammar, null, 2), 'utf8');

  console.log(`\n🎉 Extracted design grammar from ${slideCount} real slides across ${pptxFiles.length} decks.`);
  console.log(`   ${OUTPUT_FILE}`);
  console.log(JSON.stringify(grammar, null, 2));
}

main().catch((err) => {
  console.error('Design grammar extraction failed:', err);
  process.exit(1);
});
