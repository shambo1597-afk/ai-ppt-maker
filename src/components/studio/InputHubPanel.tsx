import React, { useState, useRef } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { generatePresentationWithGemini } from '../../lib/llm/client';
import { AssetItem } from '../../types/asset';
import { 
  Sparkles, 
  Paperclip,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const InputHubPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    loadAIGeneratedDeck,
  } = useSlideStore();

  const [assignmentText, setAssignmentText] = useState('');
  const [slideCount, setSlideCount] = useState<'auto' | number>('auto');
  const [customSlideCount, setCustomSlideCount] = useState<number>(6);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileId = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const type = isImg ? 'image' : isPdf ? 'pdf' : 'note';

      const reader = new FileReader();
      if (isImg) {
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const newAsset: AssetItem = {
            id: fileId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            type: 'image',
            source: 'upload',
            url: dataUrl,
            thumbnailUrl: dataUrl,
            size: file.size,
            mimeType: file.type,
            targetSlide: 'auto',
            notes: '',
            createdAt: Date.now(),
          };
          addAsset(newAsset);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newAsset: AssetItem = {
            id: fileId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            type: isPdf ? 'pdf' : 'note',
            source: 'upload',
            url: '',
            size: file.size,
            mimeType: file.type,
            content: typeof content === 'string' ? content.slice(0, 4000) : '',
            targetSlide: 'auto',
            notes: '',
            createdAt: Date.now(),
          };
          addAsset(newAsset);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleAssetUpdate = (id: string, updates: Partial<AssetItem>) => {
    updateAsset(id, updates);
  };

  const removeAsset = (id: string) => {
    deleteAsset(id);
  };

  // Main Generation Pipeline
  const handleGenerate = async () => {
    if (!assignmentText.trim()) {
      setErrorMessage('Please enter your presentation outline, brief, or notes.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setInfoNotice(null);

    const effectiveSlideCount: 'auto' | number = isCustomMode ? customSlideCount : slideCount;

    try {
      const { data, fallbackNotice } = await generatePresentationWithGemini(
        assignmentText,
        assets,
        effectiveSlideCount
      );

      await loadAIGeneratedDeck(data, false);

      if (fallbackNotice) {
        setInfoNotice(fallbackNotice);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.3, x: 0.7 },
        colors: ['#818cf8', '#38bdf8', '#34d399', '#f472b6'],
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err?.message || 'Failed to generate presentation. Please check your API keys or input notes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const maxSelectableSlides = typeof slideCount === 'number' ? slideCount : isCustomMode ? customSlideCount : 10;

  return (
    <div className={`flex flex-col h-full bg-[#111319] border-r border-white/[0.08] select-none overflow-hidden ${className}`}>
      
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* 1. Text Input Area */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Outline & Notes
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {assignmentText.length} chars
            </span>
          </div>

          <textarea
            value={assignmentText}
            onChange={(e) => setAssignmentText(e.target.value)}
            placeholder="Paste your presentation outline, markdown notes (# headings, - bullets), executive memo, or transcript here..."
            rows={10}
            className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 focus:border-indigo-500/80 focus:bg-white/[0.05] text-xs text-white outline-none placeholder:text-slate-500 leading-relaxed font-mono transition-all resize-none shadow-inner"
          />
        </div>

        {/* 2. Slide Count Selector Controls */}
        <div className="flex flex-col space-y-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={13} className="text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Slide Count
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {isCustomMode ? `${customSlideCount} Slides` : slideCount === 'auto' ? 'Auto (5–6 Slides)' : `${slideCount} Slides`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto (Default) */}
            <button
              type="button"
              onClick={() => {
                setSlideCount('auto');
                setIsCustomMode(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                slideCount === 'auto' && !isCustomMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              Auto (Default)
            </button>

            {/* 5 Slides */}
            <button
              type="button"
              onClick={() => {
                setSlideCount(5);
                setIsCustomMode(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                slideCount === 5 && !isCustomMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              5 Slides
            </button>

            {/* 7 Slides */}
            <button
              type="button"
              onClick={() => {
                setSlideCount(7);
                setIsCustomMode(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                slideCount === 7 && !isCustomMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              7 Slides
            </button>

            {/* 10 Slides */}
            <button
              type="button"
              onClick={() => {
                setSlideCount(10);
                setIsCustomMode(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                slideCount === 10 && !isCustomMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              10 Slides
            </button>

            {/* Custom Option */}
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isCustomMode
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              Custom...
            </button>
          </div>

          {/* Slider for custom mode */}
          {isCustomMode && (
            <div className="pt-2 flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={20}
                value={customSlideCount}
                onChange={(e) => setCustomSlideCount(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="font-mono text-xs text-indigo-400 font-bold w-6 text-right">
                {customSlideCount}
              </span>
            </div>
          )}
        </div>

        {/* 3. Upload & Assign User Assets */}
        <div className="flex flex-col space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip size={13} className="text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                User Assets ({assets.length})
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
            >
              + Upload Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Asset List & Target Slide Assigners */}
          {assets.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.02]"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <ImageIcon size={14} />
              </div>
              <p className="text-xs text-slate-300 font-medium">Click to upload your charts & diagrams</p>
              <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG or PDF</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {asset.type === 'image' && asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-8 h-8 rounded object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <FileText size={14} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-200 truncate">
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {asset.type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Target Slide Selector */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={asset.targetSlide || 'auto'}
                      onChange={(e) => {
                        const val = e.target.value === 'auto' ? 'auto' : parseInt(e.target.value, 10);
                        handleAssetUpdate(asset.id, { targetSlide: val });
                      }}
                      className="bg-black/50 border border-white/15 rounded text-[10px] text-slate-300 px-2 py-1 outline-none cursor-pointer hover:border-indigo-400 transition-all font-mono"
                    >
                      <option value="auto">Auto</option>
                      {Array.from({ length: maxSelectableSlides }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Slide {i + 1}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/5 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices & Errors */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoNotice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{infoNotice}</span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0E1015]/90 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Canva Poster Deck...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-blue-200" />
              <span>Generate Presentation</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default InputHubPanel;
