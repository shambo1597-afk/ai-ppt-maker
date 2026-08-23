import React from 'react';
import { SurfaceTone } from '../../lib/engine/types';
import { resolveSurfaceTone, space } from '../../lib/engine/tokens';
import { ThemeTokens } from '../../lib/design/tokens';

export interface SpatialContainerProps {
  direction?: 'row' | 'column' | 'split' | 'grid' | 'stack';
  splitRatio?: number; // e.g. 0.35 for 35/65 split, 0.45 for 45/55, 0.5 for 50/50
  gridCols?: number; // 2, 3, 4
  gap?: number; // Multiple of 8px space grid
  surface?: SurfaceTone;
  theme?: ThemeTokens | any;
  padding?: number | string; // e.g. 4 for space(4)=32px
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const SpatialContainer: React.FC<SpatialContainerProps> = ({
  direction = 'column',
  splitRatio = 0.35,
  gridCols = 3,
  gap = 4,
  surface = 'CANVAS',
  theme,
  padding,
  align = 'start',
  justify = 'start',
  className = '',
  style = {},
  children,
}) => {
  const colors = resolveSurfaceTone(surface, theme);
  const gapPx = `${space(gap)}px`;
  const padPx = typeof padding === 'number' ? `${space(padding)}px` : padding;

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  if (direction === 'split') {
    const leftWidth = `${splitRatio * 100}%`;
    const rightWidth = `${(1 - splitRatio) * 100}%`;
    const childArray = React.Children.toArray(children);

    return (
      <div
        className={`relative w-full h-full flex flex-row items-stretch ${className}`}
        style={{
          backgroundColor: colors.bg,
          color: colors.textPrimary,
          padding: padPx,
          ...style,
        }}
      >
        <div
          className="h-full flex flex-col justify-between shrink-0 overflow-hidden"
          style={{ width: leftWidth }}
        >
          {childArray[0]}
        </div>
        <div
          className="h-full flex flex-col justify-center flex-1 overflow-hidden"
          style={{ width: rightWidth }}
        >
          {childArray[1]}
        </div>
      </div>
    );
  }

  if (direction === 'grid') {
    const gridColsClass =
      gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
      gridCols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' :
      'grid-cols-1 md:grid-cols-3';

    return (
      <div
        className={`grid ${gridColsClass} w-full ${alignMap[align]} ${className}`}
        style={{
          gap: gapPx,
          backgroundColor: colors.bg,
          color: colors.textPrimary,
          padding: padPx,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  const dirClass = direction === 'row' ? 'flex-row' : 'flex-col';

  return (
    <div
      className={`flex ${dirClass} ${alignMap[align]} ${justifyMap[justify]} ${className}`}
      style={{
        gap: gapPx,
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        padding: padPx,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
