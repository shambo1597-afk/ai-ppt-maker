import { create } from 'zustand';
import { 
  Slide, 
  SlideElement, 
  SlideTheme, 
  SlideTemplate, 
  SlideBackground,
  CanvasZoom 
} from '../types/slide';
import { AssetItem, AssetManagerTab } from '../types/asset';
import { AIPresentationResponse } from '../types/llm';
import { assetStorage, DEFAULT_PRESET_ASSETS } from '../services/assetStorage';
import { archetypeCompiler } from '../services/archetypeCompiler';
import { INITIAL_SLIDES, THEMES } from '../utils/defaultTemplates';

interface HistorySnapshot {
  slides: Slide[];
  activeSlideId: string;
}

interface SlideState {
  presentationTitle: string;
  slides: Slide[];
  activeSlideId: string;
  selectedElementIds: string[];
  hoveredElementId: string | null;
  zoom: CanvasZoom;
  activeSidebarTab: 'slides' | 'templates' | 'insert' | 'themes' | 'assets';
  isPresenterMode: boolean;
  isIconPickerOpen: boolean;
  isImageUploadOpen: boolean;
  isAssetManagerOpen: boolean;
  isAIGeneratorOpen: boolean;
  assetManagerTab: AssetManagerTab;
  assets: AssetItem[];
  gridSnap: boolean;
  clipboard: SlideElement[] | null;
  history: {
    past: HistorySnapshot[];
    future: HistorySnapshot[];
  };

  // Actions - Presentations & Project
  setPresentationTitle: (title: string) => void;
  loadPresentationFromJson: (jsonData: any) => void;

  // Actions - Slides
  setActiveSlideId: (id: string) => void;
  addSlide: (template?: SlideTemplate) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;
  updateSlideTitle: (slideId: string, title: string) => void;
  updateSlideBackground: (slideId: string, background: SlideBackground) => void;
  updateSlideNotes: (slideId: string, notes: string) => void;
  applyThemeToAllSlides: (theme: SlideTheme) => void;
  applyThemeToCurrentSlide: (theme: SlideTheme) => void;
  applyTemplateToCurrentSlide: (template: SlideTemplate) => void;

  // Actions - Elements
  selectElement: (id: string, isMulti?: boolean) => void;
  clearSelection: () => void;
  selectAllElements: () => void;
  setHoveredElementId: (id: string | null) => void;
  addElement: (element: Partial<SlideElement> & { type: SlideElement['type'] }) => string;
  updateElement: (id: string, updates: Partial<SlideElement>) => void;
  updateSelectedElements: (updates: Partial<SlideElement>) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveForward: (id: string) => void;
  moveBackward: (id: string) => void;
  alignSelectedElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

  // Actions - Assets & Media
  loadAssets: () => Promise<void>;
  addAsset: (asset: AssetItem) => Promise<void>;
  updateAsset: (id: string, updates: Partial<AssetItem>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  setAssetManagerOpen: (open: boolean, tab?: AssetManagerTab) => void;
  setAssetManagerTab: (tab: AssetManagerTab) => void;
  setAIGeneratorOpen: (open: boolean) => void;
  loadAIGeneratedDeck: (aiResponse: AIPresentationResponse, append?: boolean) => Promise<void>;
  insertImageToSlide: (src: string, isBackground?: boolean, title?: string) => void;
  insertIconToSlide: (options: { name: string; prefix?: string; color?: string; svgData?: string; isIconify?: boolean }) => void;
  insertNoteToSlide: (content: string, mode: 'bullets' | 'text' | 'speaker_notes') => void;

  // Actions - History
  undo: () => void;
  redo: () => void;

  // Actions - Clipboard
  copySelected: () => void;
  pasteClipboard: () => void;

  // Actions - UI Controls
  setZoom: (zoom: CanvasZoom) => void;
  setActiveSidebarTab: (tab: 'slides' | 'templates' | 'insert' | 'themes' | 'assets') => void;
  setPresenterMode: (open: boolean) => void;
  setIconPickerOpen: (open: boolean) => void;
  setImageUploadOpen: (open: boolean) => void;
  setGridSnap: (enabled: boolean) => void;
}

const MAX_HISTORY_LENGTH = 30;

export const useSlideStore = create<SlideState>((set, get) => ({
  presentationTitle: 'Presentation',
  slides: INITIAL_SLIDES,
  activeSlideId: INITIAL_SLIDES[0].id,
  selectedElementIds: [],
  hoveredElementId: null,
  zoom: 'fit',
  activeSidebarTab: 'slides',
  isPresenterMode: false,
  isIconPickerOpen: false,
  isImageUploadOpen: false,
  isAssetManagerOpen: false,
  isAIGeneratorOpen: false,
  assetManagerTab: 'my-assets',
  assets: [],
  gridSnap: true,
  clipboard: null,
  history: {
    past: [],
    future: [],
  },

  setPresentationTitle: (title: string) => set({ presentationTitle: title }),

  loadPresentationFromJson: (jsonData: any) => {
    if (jsonData && Array.isArray(jsonData.slides) && jsonData.slides.length > 0) {
      set({
        slides: jsonData.slides,
        presentationTitle: jsonData.presentationTitle || 'Imported Presentation',
        activeSlideId: jsonData.slides[0].id,
        selectedElementIds: [],
        history: { past: [], future: [] },
      });
    }
  },

  setActiveSlideId: (id: string) => {
    set({ activeSlideId: id, selectedElementIds: [] });
  },

  addSlide: (template?: SlideTemplate) => {
    const { slides, activeSlideId, history } = get();
    const newSlideId = `slide-${Date.now()}`;

    let newSlide: Slide;
    if (template) {
      newSlide = {
        id: newSlideId,
        title: template.name,
        background: JSON.parse(JSON.stringify(template.background)),
        notes: '',
        elements: JSON.parse(JSON.stringify(template.elements)).map((el: SlideElement) => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        })),
      };
    } else {
      newSlide = {
        id: newSlideId,
        title: `Slide ${slides.length + 1}`,
        background: {
          type: 'gradient',
          gradient: { from: '#0f172a', to: '#1e1b4b', direction: 'to-br' },
        },
        notes: '',
        elements: [
          {
            id: `el-${Date.now()}-title`,
            type: 'text',
            x: 120,
            y: 120,
            width: 1200,
            height: 80,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            text: 'New Slide Title',
            fontSize: 48,
            fontFamily: 'Outfit',
            fontWeight: '800',
            color: '#ffffff',
            align: 'left',
            verticalAlign: 'top',
          },
          {
            id: `el-${Date.now()}-body`,
            type: 'text',
            x: 120,
            y: 240,
            width: 1000,
            height: 300,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            text: 'Double click to start adding your key talking points and presentation details.',
            fontSize: 22,
            fontFamily: 'Inter',
            fontWeight: '400',
            color: '#94a3b8',
            align: 'left',
            verticalAlign: 'top',
          },
        ],
      };
    }

    const currentIdx = slides.findIndex((s) => s.id === activeSlideId);
    const insertIdx = currentIdx >= 0 ? currentIdx + 1 : slides.length;
    const updatedSlides = [...slides];
    updatedSlides.splice(insertIdx, 0, newSlide);

    set({
      slides: updatedSlides,
      activeSlideId: newSlide.id,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  duplicateSlide: (slideId: string) => {
    const { slides, history, activeSlideId } = get();
    const sourceSlide = slides.find((s) => s.id === slideId);
    if (!sourceSlide) return;

    const newSlideId = `slide-${Date.now()}`;
    const duplicatedSlide: Slide = {
      ...JSON.parse(JSON.stringify(sourceSlide)),
      id: newSlideId,
      title: `${sourceSlide.title} (Copy)`,
      elements: sourceSlide.elements.map((el) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      })),
    };

    const sIdx = slides.findIndex((s) => s.id === slideId);
    const updatedSlides = [...slides];
    updatedSlides.splice(sIdx + 1, 0, duplicatedSlide);

    set({
      slides: updatedSlides,
      activeSlideId: newSlideId,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  deleteSlide: (slideId: string) => {
    const { slides, activeSlideId, history } = get();
    if (slides.length <= 1) return; // Keep at least one slide

    const sIdx = slides.findIndex((s) => s.id === slideId);
    const updatedSlides = slides.filter((s) => s.id !== slideId);
    const newActiveId = activeSlideId === slideId
      ? (updatedSlides[Math.min(sIdx, updatedSlides.length - 1)]?.id || updatedSlides[0].id)
      : activeSlideId;

    set({
      slides: updatedSlides,
      activeSlideId: newActiveId,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  reorderSlides: (startIndex: number, endIndex: number) => {
    const { slides, activeSlideId, history } = get();
    if (startIndex === endIndex) return;

    const result = Array.from(slides);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    set({
      slides: result,
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  updateSlideTitle: (slideId: string, title: string) => {
    const { slides } = get();
    set({
      slides: slides.map((s) => (s.id === slideId ? { ...s, title } : s)),
    });
  },

  updateSlideBackground: (slideId: string, background: SlideBackground) => {
    const { slides, activeSlideId, history } = get();
    set({
      slides: slides.map((s) => (s.id === slideId ? { ...s, background } : s)),
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  updateSlideNotes: (slideId: string, notes: string) => {
    const { slides } = get();
    set({
      slides: slides.map((s) => (s.id === slideId ? { ...s, notes } : s)),
    });
  },

  applyThemeToAllSlides: (theme: SlideTheme) => {
    const { slides, activeSlideId, history } = get();
    const updatedSlides = slides.map((slide) => {
      return {
        ...slide,
        background: JSON.parse(JSON.stringify(theme.background)),
        elements: slide.elements.map((el) => {
          if (el.type === 'text') {
            const isHeading = (el.fontSize || 20) >= 30;
            const isAccent = el.color === '#B85042' || el.color === '#0044EE' || el.color === '#D9822B' || el.color === '#E5A952' || el.color === '#6366f1' || el.color === '#10b981' || el.color === '#06b6d4';
            return {
              ...el,
              fontFamily: isHeading ? theme.headingFont : theme.fontFamily,
              color: isAccent ? theme.accent : isHeading ? theme.primaryText : theme.secondaryText,
            };
          }
          if (el.type === 'shape' && el.shapeType === 'line') {
            return {
              ...el,
              fillColor: theme.accent,
              borderColor: theme.accent,
            };
          }
          if (el.type === 'stat') {
            return {
              ...el,
              accentColor: theme.accent,
              textColor: theme.primaryText,
              backgroundColor: theme.cardBg,
            };
          }
          return el;
        }),
      };
    });

    set({
      slides: updatedSlides,
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  applyThemeToCurrentSlide: (theme: SlideTheme) => {
    const { slides, activeSlideId, history } = get();
    const updatedSlides = slides.map((slide) => {
      if (slide.id !== activeSlideId) return slide;
      return {
        ...slide,
        background: JSON.parse(JSON.stringify(theme.background)),
        elements: slide.elements.map((el) => {
          if (el.type === 'text') {
            const isHeading = (el.fontSize || 20) >= 30;
            const isAccent = el.color === '#B85042' || el.color === '#0044EE' || el.color === '#D9822B' || el.color === '#E5A952' || el.color === '#6366f1' || el.color === '#10b981' || el.color === '#06b6d4';
            return {
              ...el,
              fontFamily: isHeading ? theme.headingFont : theme.fontFamily,
              color: isAccent ? theme.accent : isHeading ? theme.primaryText : theme.secondaryText,
            };
          }
          if (el.type === 'shape' && el.shapeType === 'line') {
            return {
              ...el,
              fillColor: theme.accent,
              borderColor: theme.accent,
            };
          }
          if (el.type === 'stat') {
            return {
              ...el,
              accentColor: theme.accent,
              textColor: theme.primaryText,
              backgroundColor: theme.cardBg,
            };
          }
          return el;
        }),
      };
    });

    set({
      slides: updatedSlides,
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  applyTemplateToCurrentSlide: (template: SlideTemplate) => {
    const { slides, activeSlideId, history } = get();
    const updatedSlides = slides.map((slide) => {
      if (slide.id !== activeSlideId) return slide;
      return {
        ...slide,
        title: template.name,
        background: JSON.parse(JSON.stringify(template.background)),
        elements: JSON.parse(JSON.stringify(template.elements)).map((el: SlideElement) => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        })),
      };
    });

    set({
      slides: updatedSlides,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  // Element Actions
  selectElement: (id: string, isMulti: boolean = false) => {
    const { selectedElementIds } = get();
    if (isMulti) {
      if (selectedElementIds.includes(id)) {
        set({ selectedElementIds: selectedElementIds.filter((elId) => elId !== id) });
      } else {
        set({ selectedElementIds: [...selectedElementIds, id] });
      }
    } else {
      set({ selectedElementIds: [id] });
    }
  },

  clearSelection: () => set({ selectedElementIds: [] }),

  selectAllElements: () => {
    const { slides, activeSlideId } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;
    set({ selectedElementIds: currentSlide.elements.map((el) => el.id) });
  },

  setHoveredElementId: (id: string | null) => set({ hoveredElementId: id }),

  addElement: (elementData) => {
    const { slides, activeSlideId, history } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return '';

    const newId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 1);

    const fullElement = {
      id: newId,
      x: 300,
      y: 300,
      width: 400,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      ...elementData,
    } as SlideElement;

    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: [...s.elements, fullElement],
      };
    });

    set({
      slides: updatedSlides,
      selectedElementIds: [newId],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });

    return newId;
  },

  updateElement: (id: string, updates: Partial<SlideElement>) => {
    const { slides, activeSlideId } = get();
    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? ({ ...el, ...updates } as SlideElement) : el)),
      };
    });

    set({ slides: updatedSlides });
  },

  updateSelectedElements: (updates: Partial<SlideElement>) => {
    const { slides, activeSlideId, selectedElementIds, history } = get();
    if (selectedElementIds.length === 0) return;

    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? ({ ...el, ...updates } as SlideElement) : el)),
      };
    });

    set({
      slides: updatedSlides,
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  deleteSelectedElements: () => {
    const { slides, activeSlideId, selectedElementIds, history } = get();
    if (selectedElementIds.length === 0) return;

    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: s.elements.filter((el) => !selectedElementIds.includes(el.id)),
      };
    });

    set({
      slides: updatedSlides,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  duplicateSelectedElements: () => {
    const { slides, activeSlideId, selectedElementIds, history } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide || selectedElementIds.length === 0) return;

    const selectedEls = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    const newElements = selectedEls.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: Math.min(1920 - el.width, el.x + 40),
      y: Math.min(1080 - el.height, el.y + 40),
      zIndex: el.zIndex + 1,
    }));

    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: [...s.elements, ...newElements],
      };
    });

    set({
      slides: updatedSlides,
      selectedElementIds: newElements.map((el) => el.id),
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  bringToFront: (id: string) => {
    const { slides, activeSlideId } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;

    const maxZ = currentSlide.elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 1);
    get().updateElement(id, { zIndex: maxZ + 1 });
  },

  sendToBack: (id: string) => {
    const { slides, activeSlideId } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide) return;

    const minZ = currentSlide.elements.reduce((min, el) => Math.min(min, el.zIndex || 1), 1);
    get().updateElement(id, { zIndex: Math.max(0, minZ - 1) });
  },

  moveForward: (id: string) => {
    const { slides, activeSlideId } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    const target = currentSlide?.elements.find((el) => el.id === id);
    if (target) {
      get().updateElement(id, { zIndex: (target.zIndex || 1) + 1 });
    }
  },

  moveBackward: (id: string) => {
    const { slides, activeSlideId } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    const target = currentSlide?.elements.find((el) => el.id === id);
    if (target) {
      get().updateElement(id, { zIndex: Math.max(0, (target.zIndex || 1) - 1) });
    }
  },

  alignSelectedElements: (alignment) => {
    const { slides, activeSlideId, selectedElementIds, history } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide || selectedElementIds.length === 0) return;

    const selectedEls = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    if (selectedEls.length === 0) return;

    let targetVal = 0;
    if (selectedEls.length === 1) {
      // Align relative to slide canvas (1920x1080)
      const el = selectedEls[0];
      const updates: Partial<SlideElement> = {};
      if (alignment === 'left') updates.x = 120;
      if (alignment === 'center') updates.x = (1920 - el.width) / 2;
      if (alignment === 'right') updates.x = 1920 - 120 - el.width;
      if (alignment === 'top') updates.y = 100;
      if (alignment === 'middle') updates.y = (1080 - el.height) / 2;
      if (alignment === 'bottom') updates.y = 1080 - 100 - el.height;
      get().updateElement(el.id, updates);
      return;
    }

    // Align relative to selection bounds
    if (alignment === 'left') {
      targetVal = Math.min(...selectedEls.map((el) => el.x));
      get().updateSelectedElements({ x: targetVal });
    } else if (alignment === 'right') {
      const maxRight = Math.max(...selectedEls.map((el) => el.x + el.width));
      const updatedSlides = slides.map((s) => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? ({ ...el, x: maxRight - el.width } as SlideElement) : el)),
        };
      });
      set({ slides: updatedSlides });
    } else if (alignment === 'top') {
      targetVal = Math.min(...selectedEls.map((el) => el.y));
      get().updateSelectedElements({ y: targetVal });
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...selectedEls.map((el) => el.y + el.height));
      const updatedSlides = slides.map((s) => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? ({ ...el, y: maxBottom - el.height } as SlideElement) : el)),
        };
      });
      set({ slides: updatedSlides });
    } else if (alignment === 'center') {
      const minX = Math.min(...selectedEls.map((el) => el.x));
      const maxX = Math.max(...selectedEls.map((el) => el.x + el.width));
      const center = (minX + maxX) / 2;
      const updatedSlides = slides.map((s) => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? ({ ...el, x: center - el.width / 2 } as SlideElement) : el)),
        };
      });
      set({ slides: updatedSlides });
    } else if (alignment === 'middle') {
      const minY = Math.min(...selectedEls.map((el) => el.y));
      const maxY = Math.max(...selectedEls.map((el) => el.y + el.height));
      const middle = (minY + maxY) / 2;
      const updatedSlides = slides.map((s) => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => (selectedElementIds.includes(el.id) ? ({ ...el, y: middle - el.height / 2 } as SlideElement) : el)),
        };
      });
      set({ slides: updatedSlides });
    }
  },

  undo: () => {
    const { history, slides, activeSlideId } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    set({
      slides: previous.slides,
      activeSlideId: previous.activeSlideId,
      selectedElementIds: [],
      history: {
        past: newPast,
        future: [{ slides, activeSlideId }, ...history.future].slice(0, MAX_HISTORY_LENGTH),
      },
    });
  },

  redo: () => {
    const { history, slides, activeSlideId } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      slides: next.slides,
      activeSlideId: next.activeSlideId,
      selectedElementIds: [],
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: newFuture,
      },
    });
  },

  copySelected: () => {
    const { slides, activeSlideId, selectedElementIds } = get();
    const currentSlide = slides.find((s) => s.id === activeSlideId);
    if (!currentSlide || selectedElementIds.length === 0) return;

    const elementsToCopy = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    set({ clipboard: JSON.parse(JSON.stringify(elementsToCopy)) });
  },

  pasteClipboard: () => {
    const { clipboard, slides, activeSlideId, history } = get();
    if (!clipboard || clipboard.length === 0) return;

    const newElements = clipboard.map((el) => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: Math.min(1920 - el.width, el.x + 30),
      y: Math.min(1080 - el.height, el.y + 30),
      zIndex: el.zIndex + 1,
    }));

    const updatedSlides = slides.map((s) => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: [...s.elements, ...newElements],
      };
    });

    set({
      slides: updatedSlides,
      selectedElementIds: newElements.map((el) => el.id),
      history: {
        past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
        future: [],
      },
    });
  },

  // Asset Management Actions
  loadAssets: async () => {
    try {
      const items = await assetStorage.getAllAssets();
      set({ assets: items });
    } catch (e) {
      console.warn('Failed to load stored assets:', e);
    }
  },

  addAsset: async (asset: AssetItem) => {
    const { assets } = get();
    const updated = [asset, ...assets.filter((a) => a.id !== asset.id)];
    set({ assets: updated });
    await assetStorage.saveAsset(asset);
  },

  updateAsset: async (id: string, updates: Partial<AssetItem>) => {
    const { assets } = get();
    const target = assets.find((a) => a.id === id);
    if (!target) return;
    const modified = { ...target, ...updates };
    const updated = assets.map((a) => (a.id === id ? modified : a));
    set({ assets: updated });
    await assetStorage.saveAsset(modified);
  },

  deleteAsset: async (id: string) => {
    const { assets } = get();
    const updated = assets.filter((a) => a.id !== id);
    set({ assets: updated });
    await assetStorage.deleteAsset(id);
  },

  setAssetManagerOpen: (open: boolean, tab?: AssetManagerTab) => {
    set((state) => ({
      isAssetManagerOpen: open,
      assetManagerTab: tab || state.assetManagerTab,
    }));
  },

  setAssetManagerTab: (tab: AssetManagerTab) => set({ assetManagerTab: tab }),

  insertImageToSlide: (src: string, isBackground: boolean = false, title?: string) => {
    const { activeSlideId, addElement, updateSlideBackground } = get();
    if (!src) return;

    if (isBackground) {
      updateSlideBackground(activeSlideId, {
        type: 'image',
        image: src,
      });
    } else {
      addElement({
        type: 'image',
        src,
        alt: title || 'Slide visual',
        width: 720,
        height: 480,
        borderRadius: 16,
        objectFit: 'cover',
        shadow: true,
      });
    }
  },

  insertIconToSlide: (options: { name: string; prefix?: string; color?: string; svgData?: string; isIconify?: boolean }) => {
    const { addElement } = get();
    addElement({
      type: 'icon',
      iconName: options.name,
      color: options.color || '#818cf8',
      strokeWidth: 2,
      width: 120,
      height: 120,
      backgroundColor: '#1e1b4b',
      borderRadius: 24,
      padding: 24,
      svgData: options.svgData,
      iconSet: options.prefix,
      isIconify: options.isIconify ?? Boolean(options.svgData || (options.prefix && options.prefix !== 'lucide')),
    });
  },

  insertNoteToSlide: (content: string, mode: 'bullets' | 'text' | 'speaker_notes') => {
    const { activeSlideId, addElement, updateSlideNotes, slides } = get();
    if (!content.trim()) return;

    if (mode === 'speaker_notes') {
      const currentSlide = slides.find((s) => s.id === activeSlideId);
      const existingNotes = currentSlide?.notes ? `${currentSlide.notes}\n\n` : '';
      updateSlideNotes(activeSlideId, `${existingNotes}${content.trim()}`);
      return;
    }

    if (mode === 'bullets') {
      // Split into concise bullet points
      const lines = content
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•#0-9.)\s]+/, ''))
        .filter((l) => l.length > 2)
        .slice(0, 5);

      const bulletText = lines.length > 0
        ? lines.map((l) => `• ${l}`).join('\n')
        : content.slice(0, 300);

      addElement({
        type: 'text',
        text: bulletText,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: '400',
        color: '#e2e8f0',
        width: 850,
        height: Math.min(400, Math.max(120, lines.length * 50 + 40)),
        align: 'left',
        lineHeight: 1.7,
      });
    } else {
      // Regular text block or card
      addElement({
        type: 'text',
        text: content.slice(0, 500),
        fontSize: 22,
        fontFamily: 'Inter',
        fontWeight: '400',
        color: '#f8fafc',
        width: 800,
        height: 220,
        align: 'left',
        lineHeight: 1.6,
      });
    }
  },

  setAIGeneratorOpen: (open: boolean) => set({ isAIGeneratorOpen: open }),

  loadAIGeneratedDeck: async (aiResponse: AIPresentationResponse, append: boolean = false) => {
    try {
      const compiledSlides = await archetypeCompiler.compilePresentation(aiResponse, undefined, get().assets);
      const { slides, history, activeSlideId } = get();

      if (append) {
        const newSlides = [...slides, ...compiledSlides];
        set({
          slides: newSlides,
          activeSlideId: compiledSlides[0]?.id || activeSlideId,
          selectedElementIds: [],
          history: {
            past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
            future: [],
          },
        });
      } else {
        set({
          presentationTitle: aiResponse.presentationTitle || 'AI Generated Presentation',
          slides: compiledSlides,
          activeSlideId: compiledSlides[0]?.id || '',
          selectedElementIds: [],
          history: {
            past: [...history.past, { slides, activeSlideId }].slice(-MAX_HISTORY_LENGTH),
            future: [],
          },
        });
      }
    } catch (err) {
      console.error('Failed to load AI generated deck:', err);
    }
  },

  setZoom: (zoom: CanvasZoom) => set({ zoom }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setPresenterMode: (open) => set({ isPresenterMode: open }),
  setIconPickerOpen: (open) => set({ isIconPickerOpen: open }),
  setImageUploadOpen: (open) => set({ isImageUploadOpen: open }),
  setGridSnap: (enabled) => set({ gridSnap: enabled }),
}));
