import { SlideElement } from '../../../types/slide';
import { VisualPersona } from '../../../types/presentation';

export interface LargePullQuoteData {
  quote: string;
  author: string;
  role?: string;
  category?: string;
}

export function createLargePullQuoteSlide(
  data: LargePullQuoteData,
  theme: VisualPersona
): SlideElement[] {
  const now = Date.now();
  const elements: SlideElement[] = [];

  // 1. Eyebrow Category
  elements.push({
    id: `el-${now}-eyebrow`,
    type: 'text',
    x: 160,
    y: 120,
    width: 600,
    height: 30,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    text: (data.category || 'PERSPECTIVE').toUpperCase(),
    fontSize: 13,
    fontFamily: theme.fontFamily,
    fontWeight: '700',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'middle',
    letterSpacing: 2.5,
  });

  // 2. Large Quotation Mark Graphic
  elements.push({
    id: `el-${now}-quote-glyph`,
    type: 'text',
    x: 150,
    y: 170,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 0.25,
    zIndex: 1,
    text: '“',
    fontSize: 160,
    fontFamily: 'Playfair Display',
    fontWeight: '900',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'top',
  });

  // 3. Giant Serif Quote Text
  elements.push({
    id: `el-${now}-quote-text`,
    type: 'text',
    x: 160,
    y: 260,
    width: 1460,
    height: 400,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: `“${data.quote.replace(/^["“]|["”]$/g, '')}”`,
    fontSize: 54,
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    fontWeight: '600',
    color: theme.primaryText,
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.35,
  });

  // 4. Subtle Hairline Divider
  elements.push({
    id: `el-${now}-divider`,
    type: 'shape',
    shapeType: 'line',
    x: 160,
    y: 700,
    width: 120,
    height: 2,
    rotation: 0,
    opacity: 0.8,
    zIndex: 2,
    fillColor: theme.accent,
    fillOpacity: 1,
    borderColor: theme.accent,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
  });

  // 5. Human Attribution Line
  const attributionText = data.role ? `${data.author} — ${data.role}` : data.author;
  elements.push({
    id: `el-${now}-attribution`,
    type: 'text',
    x: 160,
    y: 725,
    width: 1200,
    height: 70,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: attributionText,
    fontSize: 22,
    fontFamily: theme.fontFamily,
    fontWeight: '600',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'top',
    letterSpacing: 1.2,
  });

  return elements;
}
