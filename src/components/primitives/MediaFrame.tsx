import React from 'react';

export interface MediaFrameProps {
  src: string;
  alt?: string;
  caption?: string;
  fit?: 'cover' | 'contain';
  aspectRatio?: string;
  bordered?: boolean;
  rounded?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MediaFrame: React.FC<MediaFrameProps> = ({
  src,
  alt = 'Media asset',
  caption,
  fit = 'cover',
  aspectRatio,
  bordered = true,
  rounded = true,
  className = '',
  style = {},
}) => {
  if (!src) return null;

  const borderClass = bordered ? 'border border-slate-200 shadow-md' : '';
  const roundedClass = rounded ? 'rounded-2xl' : 'rounded-none';

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-100 ${borderClass} ${roundedClass} ${className}`}
      style={{ aspectRatio, ...style }}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-${fit}`}
      />

      {caption && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-[#080E1E]/80 backdrop-blur-md text-[11px] font-mono font-bold tracking-widest text-white uppercase border border-white/20">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
};
