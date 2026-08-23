import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { SlideRenderer } from './SlideRenderer';
import { ContextMenu } from './ContextMenu';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Layers,
  Sparkles
} from 'lucide-react';

export const CanvasStage: React.FC = () => {
  const {
    slides,
    activeSlideId,
    zoom,
    setZoom,
    setActiveSlideId,
    addSlide,
    clearSelection,
    selectAllElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelected,
    pasteClipboard,
    undo,
    redo,
    selectedElementIds,
    updateElement,
  } = useSlideStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const currentSlide = slides.find((s) => s.id === activeSlideId) || slides[0];
  const currentSlideIndex = slides.findIndex((s) => s.id === activeSlideId);

  // Calculate container scale to fit 1920x1080 slide inside editor canvas area
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 64; // px padding around canvas
    const availW = Math.max(200, clientWidth - padding);
    const availH = Math.max(200, clientHeight - padding);

    const fitScale = Math.min(availW / 1920, availH / 1080);

    if (zoom === 'fit') {
      setScale(fitScale);
    } else {
      setScale(Number(zoom));
    }
  }, [zoom]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an active input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
      }

      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElements();
      }

      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
      }

      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
      }

      // Select All: Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllElements();
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }

      // Arrow keys for nudging selected elements
      if (selectedElementIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const currentElements = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
        currentElements.forEach((el) => {
          let deltaX = 0;
          let deltaY = 0;
          if (e.key === 'ArrowUp') deltaY = -step;
          if (e.key === 'ArrowDown') deltaY = step;
          if (e.key === 'ArrowLeft') deltaX = -step;
          if (e.key === 'ArrowRight') deltaX = step;
          updateElement(el.id, { x: el.x + deltaX, y: el.y + deltaY });
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelected,
    pasteClipboard,
    selectAllElements,
    undo,
    redo,
    selectedElementIds,
    currentSlide,
    updateElement,
  ]);

  // Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on global click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setActiveSlideId(slides[currentSlideIndex - 1].id);
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setActiveSlideId(slides[currentSlideIndex + 1].id);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full overflow-auto bg-[#0a0c12] flex items-center justify-center p-8 select-none"
      onClick={() => {
        clearSelection();
        closeContextMenu();
      }}
      onContextMenu={handleContextMenu}
    >
      {/* 16:9 Slide Canvas Wrapper */}
      {currentSlide && (
        <div
          className="relative transition-transform duration-75 ease-out shadow-canvas rounded-xl ring-1 ring-white/10"
          style={{
            width: `${1920 * scale}px`,
            height: `${1080 * scale}px`,
            transformOrigin: 'center center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-xl"
            style={{
              transform: `scale(${scale})`,
              width: '1920px',
              height: '1080px',
            }}
          >
            <SlideRenderer slide={currentSlide} scale={scale} />
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Pill */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-editor-panel/90 backdrop-blur-xl border border-editor-border/80 px-4 py-2 rounded-full shadow-2xl z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
          className="p-1.5 rounded-full hover:bg-editor-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-editor-text"
          title="Previous Slide"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-xs font-semibold px-2 text-slate-300 min-w-[70px] text-center">
          {currentSlideIndex + 1} / {slides.length}
        </span>

        <button
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-1.5 rounded-full hover:bg-editor-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-editor-text"
          title="Next Slide"
        >
          <ChevronRight size={16} />
        </button>

        <div className="h-4 w-px bg-editor-border mx-1" />

        <button
          onClick={() => addSlide()}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 px-2.5 py-1 rounded-full transition-colors"
          title="Add New Blank Slide"
        >
          <Plus size={14} />
          <span>New Slide</span>
        </button>

        <div className="h-4 w-px bg-editor-border mx-1" />

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setZoom('fit')}
            className={`p-1.5 rounded-full hover:bg-editor-subtle transition-colors ${zoom === 'fit' ? 'text-indigo-400' : ''}`}
            title="Fit to Screen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={() => setZoom(0.75)}
            className="p-1.5 rounded-full hover:bg-editor-subtle transition-colors"
            title="Zoom 75%"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-full hover:bg-editor-subtle transition-colors"
            title="Zoom 100%"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};
