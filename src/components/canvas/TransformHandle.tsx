import React from 'react';
import { TransformHandleType } from '../../types/slide';

interface TransformHandleProps {
  type: TransformHandleType;
  x: number;
  y: number;
  cursor: string;
  onMouseDown: (e: React.MouseEvent, handle: TransformHandleType) => void;
}

export const TransformHandle: React.FC<TransformHandleProps> = ({
  type,
  x,
  y,
  cursor,
  onMouseDown,
}) => {
  const isRotation = type === 'rot';

  return (
    <div
      className={`absolute select-none pointer-events-auto ${
        isRotation
          ? 'w-4 h-4 -ml-2 -mt-2 bg-indigo-500 border-2 border-white rounded-full shadow-md hover:scale-125 transition-transform'
          : 'w-3.5 h-3.5 -ml-[7px] -mt-[7px] bg-white border-2 border-indigo-600 rounded-sm shadow-sm hover:scale-125 transition-transform'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        cursor: cursor,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, type);
      }}
    />
  );
};
