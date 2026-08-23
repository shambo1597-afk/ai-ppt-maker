import { SlideBackground, SlideTheme } from './slide';

export type VisualPersonaId = 
  | 'editorial-warm' 
  | 'swiss-studio' 
  | 'earthy-craft' 
  | 'moody-editorial';

export interface VisualPersona extends SlideTheme {
  personaId: VisualPersonaId;
  tagline: string;
  vibe: string;
  borderRadius: number; // e.g. 0 for Swiss Studio, 12-16 for Editorial
  dividerColor: string;
}
