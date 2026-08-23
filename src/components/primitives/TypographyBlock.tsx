import React from 'react';
import { TYPOGRAPHY_SCALE } from '../../lib/engine/tokens';

export interface TypographyBlockProps {
  variant?: 'display' | 'statNumber' | 'h1' | 'h2' | 'h3' | 'quote' | 'body' | 'caption';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'blockquote' | 'div';
  color?: string;
  fontFamily?: string;
  measure?: boolean; // Constrains to 65ch max-width for readable measure
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const TypographyBlock: React.FC<TypographyBlockProps> = ({
  variant = 'body',
  as,
  color,
  fontFamily,
  measure = false,
  align = 'left',
  className = '',
  style = {},
  children,
}) => {
  const scale = TYPOGRAPHY_SCALE[variant] || TYPOGRAPHY_SCALE.body;

  const defaultTagMap: Record<string, keyof React.JSX.IntrinsicElements> = {
    display: 'h1',
    statNumber: 'div',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    quote: 'blockquote',
    body: 'p',
    caption: 'span',
  };

  const Component = (as || defaultTagMap[variant] || 'p') as any;

  const alignClass =
    align === 'center' ? 'text-center' :
    align === 'right' ? 'text-right' :
    'text-left';

  const baseStyle: React.CSSProperties = {
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: scale.letterSpacing,
    fontWeight: scale.fontWeight,
    fontStyle: (scale as any).fontStyle || 'normal',
    textTransform: (scale as any).textTransform || 'none',
    maxWidth: measure ? (scale as any).maxWidth || '65ch' : undefined,
    color: color,
    fontFamily: fontFamily,
    ...style,
  };

  return (
    <Component className={`${alignClass} ${className}`} style={baseStyle}>
      {children}
    </Component>
  );
};
