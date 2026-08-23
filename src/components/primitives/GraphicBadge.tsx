import React from 'react';

export interface GraphicBadgeProps {
  variant?: 'pill' | 'monograph' | 'step' | 'chip';
  tone?: 'accent' | 'acid' | 'muted' | 'hero' | 'cobalt';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const GraphicBadge: React.FC<GraphicBadgeProps> = ({
  variant = 'pill',
  tone = 'accent',
  pulse = false,
  className = '',
  style = {},
  children,
}) => {
  const toneClasses: Record<string, string> = {
    acid: 'bg-[#E6FF00] text-[#080E1E] border-transparent font-bold',
    cobalt: 'bg-[#004BFE] text-white border-transparent font-bold',
    accent: 'bg-[#004BFE]/15 text-[#004BFE] border-[#004BFE]/30 font-bold',
    muted: 'bg-white border-slate-200 text-[#64748B] font-semibold',
    hero: 'bg-white/10 text-white border-white/20 font-semibold',
  };

  const currentTone = toneClasses[tone] || toneClasses.accent;

  if (variant === 'step') {
    return (
      <div
        className={`inline-flex items-center justify-center font-mono font-bold text-sm px-3.5 py-1 rounded-full w-fit shadow-xs ${currentTone} ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  if (variant === 'chip') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${currentTone} ${className}`}
        style={style}
      >
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        {children}
      </span>
    );
  }

  if (variant === 'monograph') {
    return (
      <div
        className={`text-xs font-mono tracking-widest uppercase ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border shadow-xs ${currentTone} ${className}`}
      style={style}
    >
      {pulse && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
      <span>{children}</span>
    </div>
  );
};
