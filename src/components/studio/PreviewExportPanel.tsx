import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { SlideRenderer } from '../canvas/SlideRenderer';
import { exportPresentationToPPTX } from '../../utils/pptxExporter';
import { exportPresentationToPDF } from '../../utils/pdfExporter';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PreviewExportPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    presentationTitle,
    slides,
    activeSlideId,
    setActiveSlideId,
  } = useSlideStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const currentSlide = slides.find((s) => s.id === activeSlideId) || slides[0];
  const currentSlideIndex = Math.max(0, slides.findIndex((s) => s.id === activeSlideId));

  // Auto-scale 1920x1080 slide to fit nicely inside the right preview panel
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 56;
    const availW = Math.max(200, clientWidth - padding);
    const availH = Math.max(200, clientHeight - padding);

    const fitScale = Math.min(availW / 1920, availH / 1080);
    setScale(fitScale);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const handlePreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setActiveSlideId(slides[currentSlideIndex - 1].id);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setActiveSlideId(slides[currentSlideIndex + 1].id);
    }
  };

  const handleExportPPTX = async () => {
    if (isExportingPptx || slides.length === 0) return;
    setIsExportingPptx(true);

    try {
      await exportPresentationToPPTX(slides, presentationTitle || 'Presentation');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.85, x: 0.85 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
      });
    } catch (err) {
      console.error('PPTX Export failed:', err);
      alert('Failed to export presentation as PPTX.');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleExportPDF = async () => {
    if (isExportingPdf || slides.length === 0) return;
    setIsExportingPdf(true);

    try {
      await exportPresentationToPDF({
        slides,
        title: presentationTitle || 'Presentation',
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.85, x: 0.75 },
        colors: ['#ef4444', '#f59e0b', '#6366f1', '#ec4899'],
      });
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Failed to export presentation as PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0B0D12] select-none overflow-hidden ${className}`}>
      
      {/* Top Preview Status Bar */}
      <div className="h-10 px-5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0F1117]/60">
        <span className="text-xs font-semibold text-slate-300">
          Slide Preview
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          Slide {currentSlideIndex + 1} of {slides.length}
        </span>
      </div>

      {/* Center 16:9 Canvas Stage */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 overflow-hidden relative bg-[#090A0E]"
      >
        {currentSlide ? (
          <div
            className="relative shadow-2xl rounded-lg transition-transform duration-150 ease-out border border-white/10"
            style={{
              width: 1920 * scale,
              height: 1080 * scale,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: 1920,
                height: 1080,
                transform: `scale(${scale})`,
              }}
            >
              <SlideRenderer slide={currentSlide} scale={scale} />
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 text-xs">
            No slides to preview.
          </div>
        )}
      </div>

      {/* Bottom Navigation & Clean Export Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0F1117] flex items-center justify-between shrink-0 gap-4">
        
        {/* Slide Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousSlide}
            disabled={currentSlideIndex <= 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          {/* Jump Slide Dots */}
          <div className="flex items-center gap-1 px-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlideId(s.id)}
                className={`transition-all rounded-full ${
                  idx === currentSlideIndex
                    ? 'w-5 h-1.5 bg-indigo-500'
                    : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex >= slides.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf || slides.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-all disabled:opacity-40"
          >
            {isExportingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            ) : (
              <FileDown size={13} className="text-slate-400" />
            )}
            <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {/* Export PPTX Button */}
          <button
            onClick={handleExportPPTX}
            disabled={isExportingPptx || slides.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-40"
          >
            {isExportingPptx ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span>{isExportingPptx ? 'Exporting...' : 'Export PPTX'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
