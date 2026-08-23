import React from 'react';
import { useSlideStore } from '../../store/useSlideStore';
import { 
  Copy, 
  Trash2, 
  BringToFront, 
  SendToBack, 
  MoveUp, 
  MoveDown, 
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const {
    selectedElementIds,
    duplicateSelectedElements,
    deleteSelectedElements,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    copySelected,
    pasteClipboard,
    alignSelectedElements,
    clipboard,
  } = useSlideStore();

  const hasSelection = selectedElementIds.length > 0;
  const primaryId = selectedElementIds[0];

  return (
    <div
      className="fixed z-50 min-w-[200px] bg-editor-panel/95 backdrop-blur-xl border border-editor-border rounded-xl shadow-2xl p-1.5 text-xs text-editor-text animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasSelection ? (
        <>
          <button
            onClick={() => {
              duplicateSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>Duplicate</span>
            </div>
            <span className="text-[10px] opacity-60">Ctrl+D</span>
          </button>

          <button
            onClick={() => {
              copySelected();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy size={14} />
              <span>Copy</span>
            </div>
            <span className="text-[10px] opacity-60">Ctrl+C</span>
          </button>

          <div className="h-px bg-editor-border my-1" />

          {/* Layer ordering */}
          <button
            onClick={() => {
              if (primaryId) bringToFront(primaryId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <BringToFront size={14} />
            <span>Bring to Front</span>
          </button>

          <button
            onClick={() => {
              if (primaryId) sendToBack(primaryId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <SendToBack size={14} />
            <span>Send to Back</span>
          </button>

          <button
            onClick={() => {
              if (primaryId) moveForward(primaryId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <MoveUp size={14} />
            <span>Move Forward</span>
          </button>

          <button
            onClick={() => {
              if (primaryId) moveBackward(primaryId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <MoveDown size={14} />
            <span>Move Backward</span>
          </button>

          <div className="h-px bg-editor-border my-1" />

          {/* Alignments */}
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">Align</div>
          <div className="grid grid-cols-3 gap-1 px-1 py-1">
            <button
              title="Align Left"
              onClick={() => {
                alignSelectedElements('left');
                onClose();
              }}
              className="flex justify-center p-1.5 rounded hover:bg-indigo-600 hover:text-white"
            >
              <AlignLeft size={14} />
            </button>
            <button
              title="Align Center"
              onClick={() => {
                alignSelectedElements('center');
                onClose();
              }}
              className="flex justify-center p-1.5 rounded hover:bg-indigo-600 hover:text-white"
            >
              <AlignCenter size={14} />
            </button>
            <button
              title="Align Right"
              onClick={() => {
                alignSelectedElements('right');
                onClose();
              }}
              className="flex justify-center p-1.5 rounded hover:bg-indigo-600 hover:text-white"
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="h-px bg-editor-border my-1" />

          <button
            onClick={() => {
              deleteSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-rose-600 hover:text-white text-rose-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Delete</span>
            </div>
            <span className="text-[10px] opacity-60">Del</span>
          </button>
        </>
      ) : (
        <>
          {clipboard && clipboard.length > 0 && (
            <button
              onClick={() => {
                pasteClipboard();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Copy size={14} />
                <span>Paste</span>
              </div>
              <span className="text-[10px] opacity-60">Ctrl+V</span>
            </button>
          )}
          <div className="px-3 py-2 text-slate-400">Right click an element for actions</div>
        </>
      )}
    </div>
  );
};
