import { AISlideArchetype } from './llm';

export type CanvaSlotRole = 
  | 'eyebrow'
  | 'headline'
  | 'body'
  | 'statNumber'
  | 'statLabel'
  | 'quote'
  | 'attribution'
  | 'image'
  | 'stepNumber'
  | 'stepTitle'
  | 'stepDescription'
  | 'divider'
  | 'shape'
  | 'footer';

export interface CanvaSlot {
  id: string;
  role: CanvaSlotRole;
  x: number;
  y: number;
  width: number;
  height: number;
  xInches?: number;
  yInches?: number;
  widthInches?: number;
  heightInches?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  borderRadius?: number;
  defaultContent?: string;
  zIndex: number;
  isAccent?: boolean;
}

export interface CanvaSlideBlueprint {
  id: string;
  name: string;
  sourceFile: string;
  slideIndex: number;
  archetype: AISlideArchetype;
  canvasWidth: number;
  canvasHeight: number;
  background: {
    type: 'color' | 'gradient' | 'image';
    color?: string;
    gradient?: {
      from: string;
      to: string;
      direction: 'to-r' | 'to-b' | 'to-br' | 'to-tr';
    };
  };
  slots: CanvaSlot[];
  personaVibe?: string;
  tags?: string[];
}

export interface CanvaBlueprintLibrary {
  version: string;
  generatedAt: string;
  blueprints: CanvaSlideBlueprint[];
}
