export type ElementType = 'text' | 'shape' | 'icon' | 'stat' | 'table' | 'image' | 'code';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // 0 to 1920
  y: number; // 0 to 1080
  width: number;
  height: number;
  rotation: number; // 0 to 360
  opacity: number; // 0 to 1
  zIndex: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color: string;
  align: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  isBullet?: boolean;
  bulletType?: 'disc' | 'check' | 'dash' | 'number';
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
}

export type ShapeType = 'rect' | 'roundRect' | 'circle' | 'pill' | 'triangle' | 'line' | 'arrow' | 'diamond' | 'blob';

/**
 * A point on an organic freeform path, normalized to a 0..1 unit box
 * relative to the element's own width/height. `curve` (when present)
 * describes a cubic Bezier from the previous point through this one;
 * omitting it draws a straight line instead. The first point is always an
 * implicit move-to. Renderers scale these by the element's actual
 * width/height — in px for the canvas (ElementRenderer's inline SVG) and
 * in inches for the PPTX export (pptxgenjs custGeom) — so both draw the
 * exact same silhouette.
 */
export interface BlobPoint {
  x: number;
  y: number;
  curve?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  /** Required when shapeType === 'blob': a closed organic path, see BlobPoint. */
  blobPoints?: BlobPoint[];
  fillColor: string;
  fillOpacity: number;
  gradient?: {
    from: string;
    to: string;
    direction: 'to-r' | 'to-br' | 'to-b' | 'to-bl';
  };
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius: number;
  shadow?: boolean;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconName: string;
  color: string;
  strokeWidth: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
  svgData?: string;
  iconSet?: string;
  isIconify?: boolean;
}

export interface StatCardElement extends BaseElement {
  type: 'stat';
  value: string;
  label: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardStyle: 'glass' | 'solid' | 'bordered' | 'gradient';
  borderRadius: number;
  shadow?: boolean;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: string[][];
  hasHeader: boolean;
  headerBg: string;
  headerColor: string;
  cellBg: string;
  altRowBg: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
}

export interface CodeElement extends BaseElement {
  type: 'code';
  code: string;
  language: string;
  theme: 'dark' | 'light';
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
}

export type SlideElement = 
  | TextElement 
  | ShapeElement 
  | IconElement 
  | StatCardElement 
  | TableElement 
  | ImageElement 
  | CodeElement;

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    from: string;
    to: string;
    direction: 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'radial';
  };
  image?: string;
}

export interface Slide {
  id: string;
  title: string;
  background: SlideBackground;
  elements: SlideElement[];
  notes: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  activeSlideId: string;
  version: number;
}

export interface SlideTheme {
  id: string;
  name: string;
  description: string;
  previewColors: string[];
  background: SlideBackground;
  primaryText: string;
  secondaryText: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  fontFamily: string;
  headingFont: string;
}

export interface SlideTemplate {
  id: string;
  name: string;
  category: 'intro' | 'content' | 'data' | 'showcase' | 'closing';
  description: string;
  background: SlideBackground;
  elements: SlideElement[];
}

export type CanvasZoom = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 'fit';

export type TransformHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot';
