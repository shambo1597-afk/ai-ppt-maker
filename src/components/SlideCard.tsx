import React from 'react';
import { AISlideItem, AIPresentationTheme } from '../types/llm';
import { ThemeTokens } from '../lib/design/tokens';
import { SlideRenderer } from './canvas/SlideRenderer';
import { convertAISlideToSlideNode } from '../lib/engine/types';

export interface SlideCardProps {
  slide: AISlideItem;
  theme?: ThemeTokens | AIPresentationTheme;
  imageUrl?: string;
  slideNumber?: number;
  className?: string;
}

/**
 * SlideCard: Backward-compatible wrapper around the Durable Constraint-Based Generative SlideRenderer
 */
export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  theme,
  imageUrl,
  slideNumber = 1,
  className = '',
}) => {
  const node = convertAISlideToSlideNode(slide, slideNumber, imageUrl);

  return (
    <SlideRenderer
      node={node}
      theme={theme}
      imageUrl={imageUrl}
      slideNumber={slideNumber}
      className={className}
    />
  );
};

export default SlideCard;
