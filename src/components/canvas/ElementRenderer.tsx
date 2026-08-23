import React, { useState, useRef, useEffect } from 'react';
import { 
  SlideElement, 
  TextElement, 
  ShapeElement, 
  StatCardElement, 
  TableElement, 
  ImageElement, 
  IconElement, 
  CodeElement,
  TransformHandleType 
} from '../../types/slide';
import { useSlideStore } from '../../store/useSlideStore';
import { DynamicLucideIcon } from '../../utils/iconHelper';
import { blobPathToSvgD } from '../../lib/engine/organicShapes';
import { TransformHandle } from './TransformHandle';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  scale: number;
  staticMode?: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  scale,
  staticMode = false,
}) => {
  const {
    selectElement,
    updateElement,
    gridSnap,
    setHoveredElementId,
  } = useSlideStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isTransforming, setIsTransforming] = useState<TransformHandleType | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [inlineText, setInlineText] = useState('');

  const dragStartPos = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const transformStart = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
  });

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize inline text when editing
  useEffect(() => {
    if (element.type === 'text') {
      setInlineText((element as TextElement).text);
    }
  }, [element]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (staticMode || isEditingText) return;
    e.stopPropagation();

    selectElement(element.id, e.shiftKey || e.metaKey || e.ctrlKey);

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      elX: element.x,
      elY: element.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStartPos.current.x) / scale;
      const deltaY = (e.clientY - dragStartPos.current.y) / scale;

      let newX = dragStartPos.current.elX + deltaX;
      let newY = dragStartPos.current.elY + deltaY;

      if (gridSnap) {
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }

      // Constrain within slide bounds
      newX = Math.max(-element.width + 50, Math.min(1920 - 50, newX));
      newY = Math.max(-element.height + 50, Math.min(1080 - 50, newY));

      updateElement(element.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale, gridSnap, element, updateElement]);

  // Handle Resize / Rotate Handles
  const handleTransformStart = (e: React.MouseEvent, handle: TransformHandleType) => {
    e.stopPropagation();
    setIsTransforming(handle);
    transformStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation || 0,
    };
  };

  useEffect(() => {
    if (!isTransforming) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - transformStart.current.mouseX) / scale;
      const deltaY = (e.clientY - transformStart.current.mouseY) / scale;
      const { x, y, width, height } = transformStart.current;

      let newX = x;
      let newY = y;
      let newW = width;
      let newH = height;

      if (isTransforming === 'rot') {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const currentMouseX = e.clientX / scale;
        const currentMouseY = e.clientY / scale;
        const rad = Math.atan2(currentMouseY - centerY, currentMouseX - centerX);
        let deg = Math.round(rad * (180 / Math.PI)) + 90;
        if (deg < 0) deg += 360;
        if (gridSnap) deg = Math.round(deg / 15) * 15;
        updateElement(element.id, { rotation: deg });
        return;
      }

      // Handle corner and edge resize
      if (isTransforming.includes('e')) {
        newW = Math.max(30, width + deltaX);
      }
      if (isTransforming.includes('s')) {
        newH = Math.max(20, height + deltaY);
      }
      if (isTransforming.includes('w')) {
        const maxDelta = width - 30;
        const actualDelta = Math.min(deltaX, maxDelta);
        newX = x + actualDelta;
        newW = width - actualDelta;
      }
      if (isTransforming.includes('n')) {
        const maxDelta = height - 20;
        const actualDelta = Math.min(deltaY, maxDelta);
        newY = y + actualDelta;
        newH = height - actualDelta;
      }

      if (gridSnap) {
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
        newW = Math.round(newW / 10) * 10;
        newH = Math.round(newH / 10) * 10;
      }

      updateElement(element.id, {
        x: newX,
        y: newY,
        width: Math.max(20, newW),
        height: Math.max(20, newH),
      });
    };

    const handleMouseUp = () => {
      setIsTransforming(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTransforming, scale, gridSnap, element.id, updateElement]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (staticMode) return;
    if (element.type === 'text') {
      e.stopPropagation();
      setIsEditingText(true);
    }
  };

  const handleTextBlur = () => {
    setIsEditingText(false);
    updateElement(element.id, { text: inlineText } as Partial<TextElement>);
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text': {
        const el = element as TextElement;
        if (isEditingText) {
          return (
            <textarea
              ref={textInputRef}
              value={inlineText}
              onChange={(e) => setInlineText(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleTextBlur();
                }
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden"
              style={{
                fontSize: `${el.fontSize}px`,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                color: el.color,
                textAlign: el.align || 'left',
                lineHeight: el.lineHeight || 1.3,
                letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                padding: el.padding ? `${el.padding}px` : 0,
              }}
            />
          );
        }

        return (
          <div
            className="w-full h-full whitespace-pre-wrap select-none flex flex-col justify-start"
            style={{
              fontSize: `${el.fontSize}px`,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              fontStyle: el.fontStyle || 'normal',
              textDecoration: el.textDecoration || 'none',
              color: el.color,
              textAlign: el.align || 'left',
              lineHeight: el.lineHeight || 1.3,
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
              backgroundColor: el.backgroundColor || 'transparent',
              opacity: el.backgroundOpacity !== undefined ? el.backgroundOpacity : 1,
              borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
              padding: el.padding ? `${el.padding}px` : 0,
              textShadow: el.shadow ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
              justifyContent: el.verticalAlign === 'middle' ? 'center' : el.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            }}
          >
            {el.text}
          </div>
        );
      }

      case 'shape': {
        const el = element as ShapeElement;
        const bgStyle: React.CSSProperties = el.gradient
          ? {
              background: `linear-gradient(${
                el.gradient.direction === 'to-br' ? '135deg' : el.gradient.direction === 'to-b' ? '180deg' : '90deg'
              }, ${el.gradient.from}, ${el.gradient.to})`,
            }
          : {
              backgroundColor: el.fillColor,
              opacity: el.fillOpacity ?? 1,
            };

        if (el.shapeType === 'circle') {
          return (
            <div
              className="w-full h-full rounded-full"
              style={{
                ...bgStyle,
                borderWidth: `${el.borderWidth}px`,
                borderColor: el.borderColor,
                borderStyle: el.borderStyle || 'solid',
                boxShadow: el.shadow ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : 'none',
              }}
            />
          );
        }

        if (el.shapeType === 'pill') {
          return (
            <div
              className="w-full h-full"
              style={{
                ...bgStyle,
                borderRadius: '9999px',
                borderWidth: `${el.borderWidth}px`,
                borderColor: el.borderColor,
                borderStyle: el.borderStyle || 'solid',
                boxShadow: el.shadow ? '0 10px 30px -5px rgba(0, 0, 0, 0.4)' : 'none',
              }}
            />
          );
        }

        if (el.shapeType === 'line') {
          return (
            <div className="w-full h-full flex items-center">
              <div
                className="w-full"
                style={{
                  height: `${Math.max(1, el.borderWidth || 2)}px`,
                  backgroundColor: el.borderColor || el.fillColor,
                  opacity: el.fillOpacity ?? 1,
                }}
              />
            </div>
          );
        }

        if (el.shapeType === 'blob' && el.blobPoints && el.blobPoints.length > 0) {
          const d = blobPathToSvgD(el.blobPoints, el.width, el.height);
          return (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${el.width} ${el.height}`}
              style={{ overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <path
                d={d}
                fill={el.fillColor}
                fillOpacity={el.fillOpacity ?? 1}
                stroke={el.borderWidth > 0 ? el.borderColor : 'none'}
                strokeWidth={el.borderWidth || 0}
              />
            </svg>
          );
        }

        return (
          <div
            className="w-full h-full"
            style={{
              ...bgStyle,
              borderRadius: `${el.borderRadius || 0}px`,
              borderWidth: `${el.borderWidth}px`,
              borderColor: el.borderColor,
              borderStyle: el.borderStyle || 'solid',
              boxShadow: el.shadow ? '0 20px 40px -10px rgba(0, 0, 0, 0.5)' : 'none',
            }}
          />
        );
      }

      case 'stat': {
        const el = element as StatCardElement;
        return (
          <div
            className="w-full h-full p-7 flex flex-col justify-between overflow-hidden"
            style={{
              backgroundColor: el.backgroundColor,
              borderRadius: `${el.borderRadius || 20}px`,
              border: `1.5px solid ${el.accentColor}40`,
              boxShadow: el.shadow ? '0 20px 35px -10px rgba(0,0,0,0.5)' : 'none',
              backdropFilter: el.cardStyle === 'glass' ? 'blur(16px)' : 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: `${el.accentColor}20`,
                  color: el.accentColor,
                  border: `1px solid ${el.accentColor}50`,
                }}
              >
                <TrendingUp size={12} />
                <span>Metric</span>
              </div>
              {el.trendValue && (
                <div
                  className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 ${
                    el.trend === 'down'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {el.trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  <span>{el.trendValue}</span>
                </div>
              )}
            </div>

            <div className="my-auto">
              <div
                className="font-display font-extrabold tracking-tight leading-none"
                style={{
                  fontSize: `${Math.round(element.height * 0.28)}px`,
                  color: el.textColor || '#ffffff',
                }}
              >
                {el.value}
              </div>
              <div
                className="font-display font-semibold mt-2.5"
                style={{
                  fontSize: `${Math.round(element.height * 0.11)}px`,
                  color: el.accentColor,
                }}
              >
                {el.label}
              </div>
            </div>

            {el.sublabel && (
              <div
                className="text-xs text-slate-400 font-sans truncate"
                style={{ fontSize: `${Math.max(12, Math.round(element.height * 0.065))}px` }}
              >
                {el.sublabel}
              </div>
            )}
          </div>
        );
      }

      case 'icon': {
        const el = element as IconElement;
        const iconSize = Math.max(16, Math.min(el.width, el.height) - (el.padding ? el.padding * 2 : 0));
        const isIconify = el.isIconify || el.iconName.includes(':') || Boolean(el.svgData);
        
        let iconifyUrl = el.svgData;
        if (!iconifyUrl && isIconify) {
          const [prefix, name] = el.iconName.includes(':') ? el.iconName.split(':') : [el.iconSet || 'lucide', el.iconName];
          const cleanColor = el.color.startsWith('#') ? el.color.substring(1) : el.color;
          iconifyUrl = `https://api.iconify.design/${prefix}/${name}.svg?color=%23${cleanColor}&width=${iconSize}&height=${iconSize}`;
        }

        return (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden select-none"
            style={{
              backgroundColor: el.backgroundColor || 'transparent',
              borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
              padding: el.padding ? `${el.padding}px` : 0,
              boxShadow: el.shadow ? '0 15px 30px -8px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {isIconify && iconifyUrl ? (
              <img
                src={iconifyUrl}
                alt={el.iconName}
                className="w-full h-full object-contain pointer-events-none"
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
              />
            ) : (
              <DynamicLucideIcon
                name={el.iconName}
                size={iconSize}
                color={el.color}
                strokeWidth={el.strokeWidth || 2}
              />
            )}
          </div>
        );
      }

      case 'table': {
        const el = element as TableElement;
        return (
          <div
            className="w-full h-full overflow-hidden flex flex-col"
            style={{
              borderRadius: '16px',
              border: `${el.borderWidth}px solid ${el.borderColor}`,
              boxShadow: '0 15px 35px -10px rgba(0,0,0,0.5)',
            }}
          >
            <table className="w-full h-full border-collapse">
              <tbody>
                {el.rows.map((row, rIdx) => {
                  const isHeader = el.hasHeader && rIdx === 0;
                  return (
                    <tr
                      key={rIdx}
                      style={{
                        backgroundColor: isHeader
                          ? el.headerBg
                          : rIdx % 2 === 0
                          ? el.cellBg
                          : el.altRowBg || el.cellBg,
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-3 font-sans transition-colors"
                          style={{
                            borderBottom: `${el.borderWidth}px solid ${el.borderColor}`,
                            borderRight: `${el.borderWidth}px solid ${el.borderColor}`,
                            color: isHeader ? el.headerColor : el.textColor,
                            fontWeight: isHeader ? '700' : '400',
                            fontSize: `${el.fontSize || 16}px`,
                            textAlign: el.align || 'left',
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      case 'image': {
        const el = element as ImageElement;
        return (
          <img
            src={el.src}
            alt={el.alt || 'Slide image'}
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: el.objectFit || 'cover',
              borderRadius: `${el.borderRadius || 0}px`,
              borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
              borderColor: el.borderColor || 'transparent',
              borderStyle: 'solid',
              boxShadow: el.shadow ? '0 20px 40px -10px rgba(0, 0, 0, 0.5)' : 'none',
            }}
          />
        );
      }

      case 'code': {
        const el = element as CodeElement;
        return (
          <div
            className="w-full h-full p-5 font-mono overflow-hidden flex flex-col"
            style={{
              backgroundColor: el.backgroundColor || '#0f172a',
              borderRadius: `${el.borderRadius || 16}px`,
              border: '1px solid #334155',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                {el.language || 'typescript'}
              </span>
            </div>
            <pre
              className="w-full flex-1 overflow-hidden leading-relaxed"
              style={{
                fontSize: `${el.fontSize || 16}px`,
                color: el.textColor || '#38bdf8',
              }}
            >
              <code>{el.code}</code>
            </pre>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const handlePoints: { type: TransformHandleType; x: number; y: number; cursor: string }[] = [
    { type: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { type: 'n', x: element.width / 2, y: 0, cursor: 'ns-resize' },
    { type: 'ne', x: element.width, y: 0, cursor: 'nesw-resize' },
    { type: 'e', x: element.width, y: element.height / 2, cursor: 'ew-resize' },
    { type: 'se', x: element.width, y: element.height, cursor: 'nwse-resize' },
    { type: 's', x: element.width / 2, y: element.height, cursor: 'ns-resize' },
    { type: 'sw', x: 0, y: element.height, cursor: 'nesw-resize' },
    { type: 'w', x: 0, y: element.height / 2, cursor: 'ew-resize' },
    { type: 'rot', x: element.width / 2, y: -26, cursor: 'grab' },
  ];

  return (
    <div
      id={`element-${element.id}`}
      className={`absolute select-none transition-shadow ${
        staticMode
          ? ''
          : isSelected
          ? 'z-40 cursor-move'
          : 'hover:outline hover:outline-1 hover:outline-indigo-400/40 cursor-move'
      }`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: 'center center',
        zIndex: element.zIndex || 1,
        opacity: element.opacity ?? 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => !staticMode && setHoveredElementId(element.id)}
      onMouseLeave={() => !staticMode && setHoveredElementId(null)}
    >
      {renderContent()}

      {/* Selection Bounding Box & Transform Handles */}
      {!staticMode && isSelected && (
        <>
          <div className="absolute -inset-1 border-2 border-indigo-500 rounded-sm pointer-events-none shadow-glow" />
          {/* Rotation line */}
          <div
            className="absolute bg-indigo-500 pointer-events-none"
            style={{
              left: `${element.width / 2}px`,
              top: '-26px',
              width: '1.5px',
              height: '26px',
            }}
          />
          {handlePoints.map((handle) => (
            <TransformHandle
              key={handle.type}
              type={handle.type}
              x={handle.x}
              y={handle.y}
              cursor={handle.cursor}
              onMouseDown={handleTransformStart}
            />
          ))}
        </>
      )}
    </div>
  );
};
