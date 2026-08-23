import React, { useState, useEffect, useRef } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { SlideRenderer } from '../canvas/SlideRenderer';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Clock, 
  Zap, 
  Maximize2,
  Pointer
} from 'lucide-react';

export const PresenterModal: React.FC = () => {
  const {
    isPresenterMode,
    setPresenterMode,
    slides,
    activeSlideId,
    setActiveSlideId,
  } = useSlideStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Sync current index with active slide
  useEffect(() => {
    if (isPresenterMode) {
      const idx = slides.findIndex((s) => s.id === activeSlideId);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setElapsedSeconds(0);
    }
  }, [isPresenterMode, activeSlideId, slides]);

  // Timer tick
  useEffect(() => {
    if (!isPresenterMode) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPresenterMode]);

  // Scale calculation
  const updateScale = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 32;
    const fitScale = Math.min((clientWidth - padding) / 1920, (clientHeight - padding) / 1080);
    setScale(fitScale);
  };

  useEffect(() => {
    if (isPresenterMode) {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isPresenterMode]);

  // Keyboard navigation
  useEffect(() => {
    if (!isPresenterMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPresenterMode(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentIndex < slides.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          setActiveSlideId(slides[nextIdx].id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevIdx = currentIndex - 1;
          setCurrentIndex(prevIdx);
          setActiveSlideId(slides[prevIdx].id);
        }
      } else if (e.key.toLowerCase() === 'l') {
        setIsLaserActive((prev) => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotes((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenterMode, currentIndex, slides, setActiveSlideId, setPresenterMode]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLaserActive) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  if (!isPresenterMode) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Top Floating Overlay Controls */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-50 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-800 text-white text-xs font-semibold shadow-2xl">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Clock size={14} />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <span>
            Slide {currentIndex + 1} of {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLaserActive(!isLaserActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isLaserActive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                : 'bg-slate-900/80 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-800'
            }`}
            title="Toggle Laser Pointer (L)"
          >
            <Pointer size={14} />
            <span>Laser</span>
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              showNotes
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                : 'bg-slate-900/80 backdrop-blur-xl text-slate-300 hover:text-white border border-slate-800'
            }`}
            title="Toggle Presenter Notes (N)"
          >
            <FileText size={14} />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setPresenterMode(false)}
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-xl hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Exit Presentation (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative p-8 overflow-hidden"
      >
        <div
          className="relative transition-transform duration-100 ease-out shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10"
          style={{
            width: `${1920 * scale}px`,
            height: `${1080 * scale}px`,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left overflow-hidden"
            style={{
              transform: `scale(${scale})`,
              width: '1920px',
              height: '1080px',
            }}
          >
            <SlideRenderer slide={currentSlide} scale={scale} />
          </div>
        </div>

        {/* Laser Pointer Dot */}
        {isLaserActive && (
          <div
            className="fixed w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_4px_rgba(244,63,94,0.9)] pointer-events-none -ml-2 -mt-2 z-50 transition-none"
            style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          />
        )}
      </div>

      {/* Speaker Notes Overlay Drawer */}
      {showNotes && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-950/95 backdrop-blur-2xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl z-50 text-slate-200 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Speaker Notes (Slide {currentIndex + 1})
            </span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-slate-300 max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            {currentSlide.notes || 'No speaker notes written for this slide.'}
          </p>
        </div>
      )}

      {/* Bottom Navigation Chevrons */}
      <div className="absolute bottom-4 left-6 flex items-center gap-2 z-50 opacity-40 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              const prevIdx = currentIndex - 1;
              setCurrentIndex(prevIdx);
              setActiveSlideId(slides[prevIdx].id);
            }
          }}
          disabled={currentIndex === 0}
          className="p-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl hover:bg-slate-800 text-white disabled:opacity-30 border border-slate-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => {
            if (currentIndex < slides.length - 1) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              setActiveSlideId(slides[nextIdx].id);
            }
          }}
          disabled={currentIndex === slides.length - 1}
          className="p-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl hover:bg-slate-800 text-white disabled:opacity-30 border border-slate-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
