import pptxgen from 'pptxgenjs';
import { Slide, SlideElement, TextElement, ShapeElement, StatCardElement, TableElement, ImageElement, IconElement, CodeElement } from '../types/slide';
import { getIconSvgDataUrl } from './iconHelper';

// Convert CSS Hex color (#rrggbb or #rgb) to PPTX 6-char hex without #
export const cleanHexColor = (hex: string): string => {
  if (!hex) return '000000';
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length > 6) {
    clean = clean.substring(0, 6);
  }
  return clean;
};

// Canvas is 1920x1080 (16:9)
const CANVAS_W = 1920;
const CANVAS_H = 1080;

// Use percentages for reliable cross-platform mapping
const toX = (px: number) => `${((px / CANVAS_W) * 100).toFixed(2)}%`;
const toY = (py: number) => `${((py / CANVAS_H) * 100).toFixed(2)}%`;
const toW = (pw: number) => `${((pw / CANVAS_W) * 100).toFixed(2)}%`;
const toH = (ph: number) => `${((ph / CANVAS_H) * 100).toFixed(2)}%`;

// standard LAYOUT_16x9 is 10 x 5.625 inches = 405 points high.
const toFontSizePt = (fontPx: number) => Math.max(8, Math.round(fontPx * (405 / CANVAS_H)));

/**
 * Generate and download a native .pptx PowerPoint presentation
 */
export async function exportPresentationToPPTX(
  slides: Slide[],
  title: string = 'Presentation',
  iconSvgMap: Record<string, string> = {}
): Promise<void> {
  const pres = new pptxgen();

  // Define standard 16:9 widescreen layout
  pres.layout = 'LAYOUT_16x9';
  pres.title = title;

  for (let sIdx = 0; sIdx < slides.length; sIdx++) {
    const slideData = slides[sIdx];
    const pptxSlide = pres.addSlide();

    // 1. Setup Slide Background
    if (slideData.background.type === 'color' && slideData.background.color) {
      pptxSlide.background = { color: cleanHexColor(slideData.background.color) };
    } else if (slideData.background.type === 'gradient' && slideData.background.gradient) {
      // Add full-bleed gradient background rectangle
      const grad = slideData.background.gradient;
      pptxSlide.background = { color: cleanHexColor(grad.from) };
      
      // Also add background shape overlay for visual richness
      pptxSlide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        fill: { color: cleanHexColor(grad.to), transparency: 40 },
        line: { color: cleanHexColor(grad.to), width: 0 },
      });
    } else if (slideData.background.type === 'image' && slideData.background.image) {
      pptxSlide.background = { data: slideData.background.image };
    } else {
      pptxSlide.background = { color: '0F172A' };
    }

    // 2. Add Speaker Notes if present
    if (slideData.notes && slideData.notes.trim().length > 0) {
      pptxSlide.addNotes(slideData.notes);
    }

    // 3. Sort elements by zIndex
    const sortedElements = [...slideData.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 4. Render each element as native PPTX object
    for (const el of sortedElements) {
      await renderElementToPptx(pres, pptxSlide, el, iconSvgMap);
    }
  }

  // Save/Download file
  const fileName = `${title.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'presentation'}.pptx`;
  await pres.writeFile({ fileName });
}

async function renderElementToPptx(
  pres: pptxgen,
  slide: pptxgen.Slide,
  el: SlideElement,
  iconSvgMap: Record<string, string>
) {
  const x = toX(el.x);
  const y = toY(el.y);
  const w = toW(el.width);
  const h = toH(el.height);

  switch (el.type) {
    case 'text': {
      const textEl = el as TextElement;
      const isBold = textEl.fontWeight === '700' || textEl.fontWeight === '800' || textEl.fontWeight === '900';
      
      const options: pptxgen.TextPropsOptions = {
        x,
        y,
        w,
        h,
        fontSize: toFontSizePt(textEl.fontSize),
        fontFace: mapFontFace(textEl.fontFamily),
        color: cleanHexColor(textEl.color),
        bold: isBold,
        italic: textEl.fontStyle === 'italic',
        underline: textEl.textDecoration === 'underline' ? { style: 'sng' } : undefined,
        strike: textEl.textDecoration === 'line-through',
        align: textEl.align || 'left',
        valign: textEl.verticalAlign || 'top',
        rotate: textEl.rotation || 0,
        margin: textEl.padding ? (textEl.padding / 1080) * 405 : 0,
        wrap: true,
      };

      if (textEl.backgroundColor) {
        options.fill = {
          color: cleanHexColor(textEl.backgroundColor),
          transparency: textEl.backgroundOpacity !== undefined ? Math.round((1 - textEl.backgroundOpacity) * 100) : 0,
        };
      }

      slide.addText(textEl.text, options);
      break;
    }

    case 'shape': {
      const shapeEl = el as ShapeElement;
      let pptxShapeType = pres.ShapeType.rect;

      if (shapeEl.shapeType === 'roundRect' || shapeEl.shapeType === 'pill') {
        pptxShapeType = pres.ShapeType.roundRect;
      } else if (shapeEl.shapeType === 'circle') {
        pptxShapeType = pres.ShapeType.ellipse;
      } else if (shapeEl.shapeType === 'line') {
        pptxShapeType = pres.ShapeType.line;
      } else if (shapeEl.shapeType === 'arrow') {
        pptxShapeType = pres.ShapeType.rightArrow;
      } else if (shapeEl.shapeType === 'diamond') {
        pptxShapeType = pres.ShapeType.diamond;
      } else if (shapeEl.shapeType === 'triangle') {
        pptxShapeType = pres.ShapeType.triangle;
      }

      const shapeOptions: pptxgen.ShapeProps = {
        x,
        y,
        w,
        h,
        rotate: shapeEl.rotation || 0,
        fill: {
          color: cleanHexColor(shapeEl.fillColor || '#ffffff'),
          transparency: Math.round((1 - (shapeEl.fillOpacity ?? 1)) * 100),
        },
      };

      if (shapeEl.borderWidth > 0 && shapeEl.borderColor) {
        shapeOptions.line = {
          color: cleanHexColor(shapeEl.borderColor),
          width: Math.max(0.5, (shapeEl.borderWidth / 1080) * 405),
          dashType: shapeEl.borderStyle === 'dashed' ? 'dash' : shapeEl.borderStyle === 'dotted' ? 'sysDot' : 'solid',
        };
      } else {
        shapeOptions.line = { width: 0, color: '000000', transparency: 100 };
      }

      slide.addShape(pptxShapeType, shapeOptions);
      break;
    }

    case 'stat': {
      const statEl = el as StatCardElement;
      
      // 1. Add background card shape
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        fill: {
          color: cleanHexColor(statEl.backgroundColor || '#1e293b'),
          transparency: statEl.cardStyle === 'glass' ? 10 : 0,
        },
        line: {
          color: cleanHexColor(statEl.accentColor || '#6366f1'),
          width: 1.5,
        },
        rotate: statEl.rotation || 0,
      });

      // 2. Value Text (Big bold number)
      slide.addText(statEl.value, {
        x: x + 0.25,
        y: y + 0.35,
        w: w - 0.5,
        h: h * 0.38,
        fontSize: Math.round(toFontSizePt(52)),
        fontFace: 'Outfit',
        color: cleanHexColor(statEl.textColor || '#ffffff'),
        bold: true,
        align: 'left',
        valign: 'top',
      });

      // 3. Trend Badge if present
      if (statEl.trendValue) {
        slide.addText(statEl.trendValue, {
          x: x + w - 1.8,
          y: y + 0.3,
          w: 1.5,
          h: 0.4,
          fontSize: 11,
          fontFace: 'Outfit',
          color: statEl.trend === 'down' ? 'EF4444' : '10B981',
          bold: true,
          align: 'right',
          valign: 'middle',
        });
      }

      // 4. Label Text
      slide.addText(statEl.label, {
        x: x + 0.25,
        y: y + h * 0.45,
        w: w - 0.5,
        h: h * 0.25,
        fontSize: Math.round(toFontSizePt(22)),
        fontFace: 'Outfit',
        color: cleanHexColor(statEl.accentColor || '#a5b4fc'),
        bold: true,
        align: 'left',
        valign: 'top',
      });

      // 5. Sublabel Text
      if (statEl.sublabel) {
        slide.addText(statEl.sublabel, {
          x: x + 0.25,
          y: y + h * 0.72,
          w: w - 0.5,
          h: h * 0.22,
          fontSize: Math.round(toFontSizePt(16)),
          fontFace: 'Inter',
          color: '94A3B8',
          align: 'left',
          valign: 'top',
        });
      }
      break;
    }

    case 'table': {
      const tableEl = el as TableElement;
      if (!tableEl.rows || tableEl.rows.length === 0) break;

      const formattedRows: pptxgen.TableRow[] = tableEl.rows.map((row, rIdx) => {
        const isHeader = tableEl.hasHeader && rIdx === 0;
        return row.map((cellText) => {
          const cellObj: pptxgen.TableCell = {
            text: cellText,
            options: {
              fontSize: toFontSizePt(tableEl.fontSize || 18),
              fontFace: 'Inter',
              color: isHeader ? cleanHexColor(tableEl.headerColor) : cleanHexColor(tableEl.textColor),
              bold: isHeader,
              align: tableEl.align || 'left',
              valign: 'middle',
              fill: {
                color: isHeader
                  ? cleanHexColor(tableEl.headerBg)
                  : rIdx % 2 === 0
                  ? cleanHexColor(tableEl.cellBg)
                  : cleanHexColor(tableEl.altRowBg || tableEl.cellBg),
              },
              border: [
                { type: 'solid', pt: 1, color: cleanHexColor(tableEl.borderColor) },
                { type: 'solid', pt: 1, color: cleanHexColor(tableEl.borderColor) },
                { type: 'solid', pt: 1, color: cleanHexColor(tableEl.borderColor) },
                { type: 'solid', pt: 1, color: cleanHexColor(tableEl.borderColor) },
              ],
              margin: [5, 8, 5, 8],
            },
          };
          return cellObj;
        });
      });

      slide.addTable(formattedRows, {
        x,
        y,
        w,
        h,
        autoPage: false,
      });
      break;
    }

    case 'image': {
      const imgEl = el as ImageElement;
      if (!imgEl.src) break;

      try {
        slide.addImage({
          data: imgEl.src.startsWith('data:') ? imgEl.src : undefined,
          path: !imgEl.src.startsWith('data:') ? imgEl.src : undefined,
          x,
          y,
          w,
          h,
          rotate: imgEl.rotation || 0,
        });
      } catch (err) {
        console.warn('Failed to embed image in PPTX:', err);
      }
      break;
    }

    case 'icon': {
      const iconEl = el as IconElement;
      const svgDataUrl = iconEl.svgData || iconSvgMap[iconEl.iconName] || iconSvgMap[iconEl.id] || getIconSvgDataUrl(iconEl.iconName, iconEl.color, iconEl.strokeWidth);

      // Add background shape if configured
      if (iconEl.backgroundColor) {
        slide.addShape(pres.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHexColor(iconEl.backgroundColor) },
          line: { width: 0, color: '000000', transparency: 100 },
        });
      }

      if (svgDataUrl) {
        try {
          const paddingOffset = iconEl.padding ? toX(iconEl.padding) : 0;
          slide.addImage({
            data: svgDataUrl,
            x: x + paddingOffset,
            y: y + paddingOffset,
            w: Math.max(0.1, w - paddingOffset * 2),
            h: Math.max(0.1, h - paddingOffset * 2),
            rotate: iconEl.rotation || 0,
          });
        } catch (err) {
          console.warn('Failed to add icon to PPTX:', err);
        }
      }
      break;
    }

    case 'code': {
      const codeEl = el as CodeElement;
      // Add dark background code box
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        fill: { color: cleanHexColor(codeEl.backgroundColor || '#0f172a') },
        line: { color: '334155', width: 1 },
      });

      slide.addText(codeEl.code, {
        x: x + 0.2,
        y: y + 0.2,
        w: w - 0.4,
        h: h - 0.4,
        fontSize: toFontSizePt(codeEl.fontSize || 16),
        fontFace: 'Consolas',
        color: cleanHexColor(codeEl.textColor || '#38bdf8'),
        align: 'left',
        valign: 'top',
        wrap: true,
      });
      break;
    }
  }
}

function mapFontFace(fontFamily: string): string {
  if (!fontFamily) return 'Calibri';
  const clean = fontFamily.toLowerCase();
  if (clean.includes('outfit')) return 'Segoe UI';
  if (clean.includes('playfair')) return 'Georgia';
  if (clean.includes('mono') || clean.includes('fira') || clean.includes('code')) return 'Consolas';
  if (clean.includes('jakarta') || clean.includes('inter') || clean.includes('sans')) return 'Arial';
  return fontFamily;
}
