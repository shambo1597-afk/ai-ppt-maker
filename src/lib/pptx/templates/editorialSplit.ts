import { SlideElement } from '../../../types/slide';
import { VisualPersona } from '../../../types/presentation';

export interface EditorialSplitData {
  category?: string;
  headline: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function createEditorialSplitSlide(
  data: EditorialSplitData,
  theme: VisualPersona
): SlideElement[] {
  const now = Date.now();
  const elements: SlideElement[] = [];

  // 1. Left (or Right): Full-bleed 50% Image (touching top, bottom, and edges with zero border radius)
  if (data.imageUrl) {
    elements.push({
      id: `el-${now}-img`,
      type: 'image',
      x: 0,
      y: 0,
      width: 960,
      height: 1080,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      src: data.imageUrl,
      alt: data.imageAlt || 'Editorial visual',
      borderRadius: 0,
      objectFit: 'cover',
      shadow: false,
    });
  }

  // 2. Right: Vertically Centered Typography Hierarchy
  const textX = 1080;
  const textW = 720;
  let textY = 240;

  // Eyebrow category tag
  elements.push({
    id: `el-${now}-eyebrow`,
    type: 'text',
    x: textX,
    y: textY,
    width: textW,
    height: 32,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: (data.category || 'STRUCTURAL FOUNDATIONS').toUpperCase(),
    fontSize: 14,
    fontFamily: theme.fontFamily,
    fontWeight: '700',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'middle',
    letterSpacing: 2.5,
  });
  textY += 46;

  // Large Editorial Headline
  elements.push({
    id: `el-${now}-headline`,
    type: 'text',
    x: textX,
    y: textY,
    width: textW,
    height: 200,
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
    lineHeight: 1.15,
  });
  textY += 210;

  // Hairline Divider
  elements.push({
    id: `el-${now}-divider`,
    type: 'shape',
    shapeType: 'line',
    x: textX,
    y: textY,
    width: 100,
    height: 2,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    fillColor: theme.accent,
    fillOpacity: 1,
    borderColor: theme.accent,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
  });
  textY += 32;

  // Clean Unboxed Narrative Prose
  elements.push({
    id: `el-${now}-body`,
    type: 'text',
    x: textX,
    y: textY,
    width: textW,
    height: 480,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: data.body,
    fontSize: 22,
    fontFamily: theme.fontFamily,
    fontWeight: '400',
    color: theme.secondaryText,
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.75,
  });

  return elements;
}
