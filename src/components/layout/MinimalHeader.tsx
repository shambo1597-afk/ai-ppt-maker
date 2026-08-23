import React, { useState } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { Sparkles, Key, Maximize2 } from 'lucide-react';

export const MinimalHeader: React.FC = () => {
  const { 
    presentationTitle, 
    setPresentationTitle, 
    slides, 
    setAIGeneratorOpen,
    setPresenterMode,
  } = useSlideStore();

  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <header className="h-13 bg-[#0F1117] border-b border-white/[0.08] px-5 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          SlideCraft
        </span>
      </div>

      {/* Editable Title */}
      <div className="flex items-center gap-2">
        {isRenaming ? (
          <input
            type="text"
            value={presentationTitle}
            onChange={(e) => setPresentationTitle(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsRenaming(false)}
            autoFocus
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/5 border border-indigo-500 text-white outline-none text-center"
          />
        ) : (
          <button
            onClick={() => setIsRenaming(true)}
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1.5 max-w-sm truncate"
            title="Click to rename presentation"
          >
            <span className="font-semibold text-slate-100">{presentationTitle || 'Executive Strategic Presentation'}</span>
            <span className="text-[11px] text-slate-500 font-mono">({slides.length} slides)</span>
          </button>
        )}
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPresenterMode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all"
          title="Fullscreen Presentation"
        >
          <Maximize2 size={13} />
          <span>Present</span>
        </button>

        <button
          onClick={() => setAIGeneratorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all"
          title="API Keys & Settings"
        >
          <Key size={13} className="text-amber-400" />
          <span>API Keys</span>
        </button>
      </div>
    </header>
  );
};
