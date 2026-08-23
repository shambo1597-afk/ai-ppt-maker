import React from 'react';
import { Slide } from '../../types/slide';
import { ThemeTokens } from '../../lib/design/tokens';
import { ElementRenderer } from './ElementRenderer';
import { useSlideStore } from '../../store/useSlideStore';

export interface SlideRendererProps {
  slide: Slide;
  theme?: ThemeTokens;
  scale?: number;
  staticMode?: boolean;
  className?: string;
}

/**
 * Single source of truth for presentation rendering — canvas preview,
 * presenter mode, PDF capture, and (via lib/utils/pptxExporter.ts) the
 * exported .pptx all read the same Slide.elements scene graph, so what you
 * see here is exactly what ships in the file.
 */
export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, theme, scale, staticMode = false, className = '' }) => {
  const { selectedElementIds } = useSlideStore();

  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = slide.background;
    if (bg.type === 'color') {
      return { backgroundColor: bg.color || theme?.canvasBg || '#0f172a' };
    }
    if (bg.type === 'gradient' && bg.gradient) {
      const dirMap: Record<string, string> = {
        'to-r': 'to right',
        'to-br': 'to bottom right',
        'to-b': 'to bottom',
        'to-bl': 'to bottom left',
        radial: 'circle at center',
      };
      const direction = dirMap[bg.gradient.direction] || 'to bottom right';
      return { background: `linear-gradient(${direction}, ${bg.gradient.from}, ${bg.gradient.to})` };
    }
    if (bg.type === 'image' && bg.image) {
      return { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { backgroundColor: theme?.canvasBg || '#0f172a' };
  };

  const containerStyle: React.CSSProperties = scale !== undefined
    ? { width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }
    : { width: '100%', height: '100%' };

  return (
    <div
      className={`relative overflow-hidden select-none font-sans ${className}`}
      style={{ ...containerStyle, ...getBackgroundStyle() }}
    >
      {slide.elements.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          isSelected={!staticMode && selectedElementIds.includes(element.id)}
          scale={scale || 1}
          staticMode={staticMode}
        />
      ))}
    </div>
  );
};

export default SlideRenderer;
