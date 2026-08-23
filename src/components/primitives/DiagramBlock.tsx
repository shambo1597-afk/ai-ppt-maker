import React, { useEffect, useState, useId } from 'react';
import mermaid from 'mermaid';
import { ThemeTokens, resolveThemeTokens } from '../../lib/design/tokens';

export interface DiagramBlockProps {
  diagram: string;
  theme?: ThemeTokens | any;
  className?: string;
  title?: string;
}

// Initialize Mermaid once with global defaults
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    mainBkg: '#0B132B',
    nodeBorder: '#004BFE',
    lineColor: '#38BDF8',
    textColor: '#F8FAFC',
    fontSize: '13px',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    primaryColor: '#0B132B',
    primaryTextColor: '#FFFFFF',
    primaryBorderColor: '#004BFE',
    secondaryColor: '#1E293B',
    tertiaryColor: '#0F172A',
    edgeLabelBackground: '#080E1E',
    clusterBkg: 'rgba(11, 19, 43, 0.6)',
    clusterBorder: '#1E293B',
  },
});

/**
 * Generative Diagram Engine Primitive
 * Renders live Mermaid flowcharts, architecture topologies, and process graphs in the Cobalt Kinetic aesthetic.
 */
export const DiagramBlock: React.FC<DiagramBlockProps> = ({
  diagram,
  theme,
  className = '',
  title,
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const elementId = `mermaid-${rawId}-${Date.now()}`;
  const t = resolveThemeTokens(theme);

  useEffect(() => {
    let isMounted = true;
    const cleanDiagram = diagram.trim();

    if (!cleanDiagram) {
      setSvgContent('');
      return;
    }

    // Check if it's already an SVG string
    if (cleanDiagram.startsWith('<svg') && cleanDiagram.endsWith('</svg>')) {
      setSvgContent(cleanDiagram);
      setHasError(false);
      return;
    }

    // Format mermaid syntax: remove markdown code fences if present
    let mCode = cleanDiagram;
    if (mCode.startsWith('```mermaid')) {
      mCode = mCode.replace(/^```mermaid\s*/i, '').replace(/```\s*$/i, '');
    } else if (mCode.startsWith('```')) {
      mCode = mCode.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }
    mCode = mCode.trim();

    // Default to flowchart LR if no diagram type specified
    if (!mCode.match(/^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|journey|gantt|pie|gitGraph|quadrantChart|xychart)/i)) {
      mCode = `graph LR\n  ${mCode}`;
    }

    async function renderMermaid() {
      try {
        const { svg } = await mermaid.render(elementId, mCode);
        if (isMounted) {
          // Enhance SVG with responsive viewport and crisp filters
          const enhancedSvg = svg
            .replace(/<svg\s+/, '<svg class="w-full h-auto max-h-[360px] mx-auto filter drop-shadow-[0_4px_20px_rgba(0,75,254,0.2)]" ');
          setSvgContent(enhancedSvg);
          setHasError(false);
        }
      } catch (err) {
        console.warn('[DiagramBlock] Mermaid render error:', err);
        if (isMounted) {
          setHasError(true);
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
      // Clean up mermaid DOM artifacts if any
      const el = document.getElementById(elementId);
      if (el) el.remove();
    };
  }, [diagram, elementId]);

  if (hasError || !svgContent) {
    // Fallback: styled code/node card
    return (
      <div className={`w-full p-4 rounded-xl bg-[#0B132B] border border-[#1E293B] text-slate-300 font-mono text-xs ${className}`}>
        {title && <div className="text-[11px] font-bold uppercase tracking-widest text-[#E6FF00] mb-2">[ {title} ]</div>}
        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] opacity-80 leading-relaxed">
          {diagram}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden p-6 bg-[#080E1E]/80 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col justify-center items-center ${className}`}
      style={{
        borderColor: 'rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Subtle graph-grid underlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header Tag */}
      {title && (
        <div className="relative z-10 w-full flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#E6FF00]">
            [ FIG // {title} ]
          </span>
          <span className="w-2 h-2 rounded-full bg-[#004BFE] animate-pulse" />
        </div>
      )}

      {/* Rendered SVG */}
      <div
        className="relative z-10 w-full flex justify-center items-center overflow-x-auto custom-scrollbar"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};
