import { SlideElement } from '../../../types/slide';
import { VisualPersona } from '../../../types/presentation';

export interface MinimalListItem {
  number: string; // e.g. "01."
  title: string;
  description: string;
}

export interface MinimalListData {
  category?: string;
  headline: string;
  items: MinimalListItem[];
}

export function createMinimalListSlide(
  data: MinimalListData,
  theme: VisualPersona
): SlideElement[] {
  const now = Date.now();
  const elements: SlideElement[] = [];

  // 1. Eyebrow Category
  elements.push({
    id: `el-${now}-eyebrow`,
    type: 'text',
    x: 120,
    y: 100,
    width: 600,
    height: 30,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    text: (data.category || 'FRAMEWORK & SEQUENCE').toUpperCase(),
    fontSize: 13,
    fontFamily: theme.fontFamily,
    fontWeight: '700',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'middle',
    letterSpacing: 2.5,
  });

  // 2. Large Headline
  elements.push({
    id: `el-${now}-headline`,
    type: 'text',
    x: 120,
    y: 145,
    width: 1400,
    height: 110,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: data.headline,
    fontSize: 48,
    fontFamily: theme.headingFont,
    fontWeight: '700',
    color: theme.primaryText,
    align: 'left',
    verticalAlign: 'top',
  });

  // 3. Top Master Separator Hairline
  elements.push({
    id: `el-${now}-top-line`,
    type: 'shape',
    shapeType: 'line',
    x: 120,
    y: 275,
    width: 1680,
    height: 1,
    rotation: 0,
    opacity: 0.6,
    zIndex: 1,
    fillColor: theme.dividerColor,
    fillOpacity: 1,
    borderColor: theme.dividerColor,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
  });

  // 4. List Items with Horizontal Separator Lines (No boxed cards!)
  const items = data.items.slice(0, 3);
  const rowHeight = 220;
  const startY = 290;

  items.forEach((item, idx) => {
    const itemY = startY + idx * rowHeight;

    // Step Number (e.g. "01.")
    elements.push({
      id: `el-${now}-num-${idx}`,
      type: 'text',
      x: 120,
      y: itemY + 15,
      width: 100,
      height: 50,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: item.number || `0${idx + 1}.`,
      fontSize: 28,
      fontFamily: theme.headingFont,
      fontWeight: '700',
      color: theme.accent,
      align: 'left',
      verticalAlign: 'top',
    });

    // Item Title
    elements.push({
      id: `el-${now}-title-${idx}`,
      type: 'text',
      x: 260,
      y: itemY + 15,
      width: 500,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: item.title,
      fontSize: 28,
      fontFamily: theme.headingFont,
      fontWeight: '600',
      color: theme.primaryText,
      align: 'left',
      verticalAlign: 'top',
    });

    // Item Description (concise human prose)
    elements.push({
      id: `el-${now}-desc-${idx}`,
      type: 'text',
      x: 820,
      y: itemY + 15,
      width: 980,
      height: 140,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      text: item.description,
      fontSize: 20,
      fontFamily: theme.fontFamily,
      fontWeight: '400',
      color: theme.secondaryText,
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 1.6,
    });

    // Bottom Separator Hairline
    if (idx < items.length - 1) {
      elements.push({
        id: `el-${now}-line-${idx}`,
        type: 'shape',
        shapeType: 'line',
        x: 120,
        y: itemY + rowHeight - 20,
        width: 1680,
        height: 1,
        rotation: 0,
        opacity: 0.4,
        zIndex: 1,
        fillColor: theme.dividerColor,
        fillOpacity: 1,
        borderColor: theme.dividerColor,
        borderWidth: 0,
        borderStyle: 'solid',
        borderRadius: 0,
      });
    }
  });

  return elements;
}
