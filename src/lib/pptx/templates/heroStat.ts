import { SlideElement } from '../../../types/slide';
import { VisualPersona } from '../../../types/presentation';

export interface HeroStatData {
  category?: string;
  headline?: string;
  statValue: string;
  statLabel: string;
  descriptor: string;
  imageUrl?: string;
}

export function createHeroStatSlide(
  data: HeroStatData,
  theme: VisualPersona
): SlideElement[] {
  const now = Date.now();
  const elements: SlideElement[] = [];

  // 1. Eyebrow Category
  elements.push({
    id: `el-${now}-eyebrow`,
    type: 'text',
    x: 120,
    y: 110,
    width: 600,
    height: 30,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    text: (data.category || 'KEY METRIC & IMPACT').toUpperCase(),
    fontSize: 13,
    fontFamily: theme.fontFamily,
    fontWeight: '700',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'middle',
    letterSpacing: 2.5,
  });

  // 2. Giant 100pt+ Stat Number (Unboxed)
  elements.push({
    id: `el-${now}-stat-num`,
    type: 'text',
    x: 120,
    y: 160,
    width: 900,
    height: 240,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: data.statValue,
    fontSize: 140,
    fontFamily: theme.headingFont,
    fontWeight: '800',
    color: theme.primaryText,
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.0,
    letterSpacing: -2,
  });

  // 3. Stat Label / Metric context
  elements.push({
    id: `el-${now}-stat-label`,
    type: 'text',
    x: 120,
    y: 410,
    width: 800,
    height: 60,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: data.statLabel,
    fontSize: 32,
    fontFamily: theme.headingFont,
    fontWeight: '700',
    color: theme.accent,
    align: 'left',
    verticalAlign: 'top',
  });

  // 4. Subtle Hairline Divider
  elements.push({
    id: `el-${now}-divider`,
    type: 'shape',
    shapeType: 'line',
    x: 120,
    y: 485,
    width: 140,
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

  // 5. Unboxed Editorial Descriptor Prose
  elements.push({
    id: `el-${now}-descriptor`,
    type: 'text',
    x: 120,
    y: 520,
    width: 760,
    height: 380,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    text: data.descriptor,
    fontSize: 22,
    fontFamily: theme.fontFamily,
    fontWeight: '400',
    color: theme.secondaryText,
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.7,
  });

  // 6. Right: Optional Editorial Image or Visual Space
  if (data.imageUrl) {
    elements.push({
      id: `el-${now}-img`,
      type: 'image',
      x: 960,
      y: 110,
      width: 840,
      height: 840,
      rotation: 0,
      opacity: 1,
      zIndex: 2,
      src: data.imageUrl,
      borderRadius: theme.borderRadius,
      objectFit: 'cover',
      shadow: false,
    });
  }

  return elements;
}
