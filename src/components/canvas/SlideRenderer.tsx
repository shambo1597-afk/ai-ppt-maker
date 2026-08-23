import React from 'react';
import { Slide } from '../../types/slide';
import { SlideNode, convertAISlideToSlideNode } from '../../lib/engine/types';
import { AISlideItem, AIPresentationTheme } from '../../types/llm';
import { ThemeTokens, resolveThemeTokens } from '../../lib/design/tokens';
import { resolveSurfaceTone, space } from '../../lib/engine/tokens';
import { SpatialContainer } from '../primitives/SpatialContainer';
import { TypographyBlock } from '../primitives/TypographyBlock';
import { MediaFrame } from '../primitives/MediaFrame';
import { GraphicBadge } from '../primitives/GraphicBadge';
import { DiagramBlock } from '../primitives/DiagramBlock';
import { IconBadge } from '../../lib/assets/iconHarvester';
import { ElementRenderer } from './ElementRenderer';
import { useSlideStore } from '../../store/useSlideStore';

export interface SlideRendererProps {
  slide?: Slide | AISlideItem;
  node?: SlideNode;
  theme?: ThemeTokens | AIPresentationTheme;
  imageUrl?: string;
  slideNumber?: number;
  scale?: number;
  staticMode?: boolean;
  className?: string;
}

/**
 * Unified SlideRenderer & Visual Asset Compositor
 * Active single source of truth for presentation rendering, canvas preview, PDF & PPTX export.
 */
export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  node,
  theme,
  imageUrl,
  slideNumber = 1,
  scale,
  staticMode = false,
  className = '',
}) => {
  const { selectedElementIds } = useSlideStore();
  const t = resolveThemeTokens(theme);

  // Determine if this is a Slide object with custom canvas elements
  const isCanvasElementSlide = slide && 'elements' in slide && Array.isArray((slide as Slide).elements) && (slide as Slide).elements.length > 0;

  if (isCanvasElementSlide) {
    const canvasSlide = slide as Slide;

    const getBackgroundStyle = (): React.CSSProperties => {
      const bg = canvasSlide.background;
      if (bg.type === 'color') {
        return { backgroundColor: bg.color || t.canvasBg || '#0f172a' };
      }
      if (bg.type === 'gradient' && bg.gradient) {
        const dirMap: Record<string, string> = {
          'to-r': 'to right',
          'to-br': 'to bottom right',
          'to-b': 'to bottom',
          'to-bl': 'to bottom left',
          radial: 'circle at center',
        };
        const direction = dirMap[bg.gradient.direction] || 'to bottom right';
        return {
          background: `linear-gradient(${direction}, ${bg.gradient.from}, ${bg.gradient.to})`,
        };
      }
      if (bg.type === 'image' && bg.image) {
        return {
          backgroundImage: `url(${bg.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      }
      return { backgroundColor: t.canvasBg || '#0f172a' };
    };

    const containerStyle: React.CSSProperties = scale !== undefined ? {
      width: 1920,
      height: 1080,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    } : {
      width: '100%',
      height: '100%',
    };

    return (
      <div
        className={`relative overflow-hidden select-none font-sans ${className}`}
        style={{
          ...containerStyle,
          ...getBackgroundStyle(),
        }}
      >
        {/* Ambient Corner Glow */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${t.accent} 0%, rgba(0,0,0,0) 70%)` }}
        />

        {/* Technical graph-grid hairline pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Render all canvas elements */}
        {canvasSlide.elements.map((element) => (
          <ElementRenderer
            key={element.id}
            element={element}
            isSelected={!staticMode && selectedElementIds.includes(element.id)}
            scale={scale || 1}
            staticMode={staticMode}
          />
        ))}
      </div>
    );
  }

  // =========================================================================
  // GENERATIVE AST LAYOUT ENGINE (Pure Constraint-Based Dynamic Renderer)
  // =========================================================================
  const slideNode: SlideNode = node || (
    slide ? convertAISlideToSlideNode(slide as AISlideItem, slideNumber, imageUrl) : {
      id: `default-${slideNumber}`,
      intent: slideNumber === 1 ? 'HERO_STATEMENT' : 'SPLIT_NARRATIVE',
      surfaceTone: slideNumber === 1 ? 'HERO' : 'CANVAS',
      focalBlock: { type: 'HEADLINE', content: '' },
      supportingBlocks: [],
    }
  );

  const colors = resolveSurfaceTone(slideNode.surfaceTone, t);
  const slideSemanticIcon = slideNode.icon || slideNode.iconName || 'default';

  const containerStyle: React.CSSProperties = scale !== undefined ? {
    width: 1920,
    height: 1080,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  } : {
    width: '100%',
    aspectRatio: '16 / 9',
  };

  return (
    <div
      className={`relative overflow-hidden select-none font-sans ${className}`}
      style={{
        ...containerStyle,
        backgroundColor: colors.bg,
        color: colors.textPrimary,
        fontFamily: t.fontBody,
      }}
    >
      {/* ================================================================= */}
      {/* ATMOSPHERIC MESH & TEXTURE SHADERS                                */}
      {/* ================================================================= */}
      {/* 1. Ambient Corner Radial Glows */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle, ${colors.accent} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle, ${colors.accentBadge || colors.accent} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* 2. Technical Graph-Grid Hairlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3. Subtle Organic Paper Grain / Noise Simulation */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* ================================================================= */}
      {/* 1. HERO_POSTER (Cover - Monumental Poster Layout)                */}
      {/* ================================================================= */}
      {slideNode.intent === 'HERO_STATEMENT' && (
        <div 
          className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: colors.bg,
            color: colors.textPrimary,
            padding: `${space(6)}px ${space(8)}px`,
          }}
        >
          {/* Subtle Geometric Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Header Row with Semantic Vector Icon Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBadge icon={slideSemanticIcon} size={18} tone="acid" shape="circle" />
              {slideNode.subheading ? (
                <GraphicBadge tone="acid" pulse>
                  [ {slideNode.subheading} ]
                </GraphicBadge>
              ) : (
                <div />
              )}
            </div>

            <GraphicBadge variant="monograph" tone="muted">
              [ MONOGRAPH 0{slideNumber} ]
            </GraphicBadge>
          </div>

          {/* Focal Center Area */}
          <div className="relative z-10 flex flex-col justify-center space-y-6 my-auto max-w-5xl">
            <TypographyBlock
              variant="display"
              fontFamily={t.fontHeading}
              color="#FFFFFF"
            >
              {slideNode.focalBlock.content}
            </TypographyBlock>

            {/* Glowing Accent Rule */}
            <div className="flex items-center gap-3 pt-2">
              <div
                className="w-28 h-[4px] rounded-full shadow-md"
                style={{ backgroundColor: colors.accent }}
              />
              <div
                className="w-3 h-[4px] rounded-full opacity-50"
                style={{ backgroundColor: colors.accentBadge }}
              />
            </div>

            {/* Secondary Narrative */}
            {slideNode.focalBlock.secondary && (
              <TypographyBlock
                variant="body"
                color="#CBD5E1"
                measure
                style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}
              >
                {slideNode.focalBlock.secondary}
              </TypographyBlock>
            )}
          </div>

          {/* Author Footer */}
          <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between text-[11px] md:text-xs font-mono tracking-widest uppercase text-slate-400">
            {slideNode.author ? (
              <div className="flex items-center gap-2">
                <span style={{ color: colors.accentBadge }}>AUTHOR / BRIEF:</span>
                <span className="text-white">{slideNode.author}</span>
              </div>
            ) : (
              <span />
            )}
            <span className="hidden sm:inline opacity-70">CONFIDENTIAL & PROPRIETARY</span>
            <span>© 2026 ALL RIGHTS RESERVED</span>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. SPLIT_NARRATIVE (Dynamic Asymmetric 35/65 Split / Diagram)    */}
      {/* ================================================================= */}
      {slideNode.intent === 'SPLIT_NARRATIVE' && (
        <SpatialContainer
          direction="split"
          splitRatio={slideNode.userAssetUrl || slideNode.diagram ? 0.48 : 0.35}
          theme={t}
        >
          {/* Left Column: User Asset OR Live Mermaid Diagram OR Navy Takeaways Block */}
          {slideNode.userAssetUrl ? (
            <div className="w-full h-full p-8 md:p-10 flex flex-col justify-center items-center bg-white border-r border-slate-200">
              <MediaFrame
                src={slideNode.userAssetUrl}
                alt={slideNode.focalBlock.content}
                caption={`[ FIG 0${slideNumber} // USER ATTACHED ASSET ]`}
              />
            </div>
          ) : slideNode.diagram ? (
            <div className="w-full h-full p-6 md:p-8 flex flex-col justify-center items-center bg-[#0B132B] border-r border-[#1E293B]">
              <DiagramBlock
                diagram={slideNode.diagram}
                theme={t}
                title={slideNode.subheading || 'TOPOLOGY'}
              />
            </div>
          ) : (
            <div
              className="w-full h-full p-10 md:p-12 flex flex-col justify-between bg-[#0B132B] text-white border-r border-[#1E293B]"
              style={{ backgroundColor: t.sidebarBg || '#0B132B' }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  {slideNode.subheading && (
                    <GraphicBadge tone="acid">
                      {slideNode.subheading}
                    </GraphicBadge>
                  )}
                  <IconBadge icon={slideSemanticIcon} size={18} tone="cobalt" />
                </div>
              </div>

              {/* Supporting Block List */}
              {slideNode.supportingBlocks.length > 0 ? (
                <div className="space-y-4 py-4">
                  {slideNode.supportingBlocks.slice(0, 3).map((block, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                      <span className="font-mono font-bold text-xs mt-0.5 text-[#E6FF00]">
                        {block.index || `0${idx + 1}`}.
                      </span>
                      <span className="leading-relaxed text-slate-200">
                        {block.description}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4" />
              )}

              <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 pt-3 border-t border-white/10">
                [ SECTION 0${slideNumber} ]
              </div>
            </div>
          )}

          {/* Right Column: Clean White Canvas Narrative */}
          <div className="w-full h-full px-12 md:px-16 py-12 flex flex-col justify-center space-y-6 bg-white text-[#0F172A] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              {slideNode.subheading && (
                <TypographyBlock variant="caption" color={colors.accent}>
                  [ {slideNode.subheading} ]
                </TypographyBlock>
              )}
              <IconBadge icon={slideSemanticIcon} size={16} tone="muted" shape="circle" />
            </div>

            <TypographyBlock
              variant="h1"
              fontFamily={t.fontHeading}
              color="#0F172A"
            >
              {slideNode.focalBlock.content}
            </TypographyBlock>

            <div
              className="w-14 h-1 rounded-full"
              style={{ backgroundColor: colors.accent }}
            />

            {slideNode.focalBlock.secondary && (
              <TypographyBlock
                variant="body"
                color="#64748B"
                measure
                style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
              >
                {slideNode.focalBlock.secondary}
              </TypographyBlock>
            )}
          </div>
        </SpatialContainer>
      )}

      {/* ================================================================= */}
      {/* 3. DATA_DOMINANCE (Monumental Metric Hero - 130px Stat)          */}
      {/* ================================================================= */}
      {slideNode.intent === 'DATA_DOMINANCE' && (
        <div 
          className="relative z-10 w-full h-full flex items-center overflow-hidden"
          style={{
            backgroundColor: colors.bg,
            padding: `${space(6)}px ${space(8)}px`,
          }}
        >
          {/* Subtle Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #0F172A 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 w-full grid grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left 6 Columns: Stat Metric */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-center space-y-4 md:border-r md:border-slate-300 md:pr-10">
              <div className="flex items-center gap-2.5">
                <IconBadge icon="solar:chart-2-bold-duotone" size={16} tone="acid" shape="circle" />
                <TypographyBlock variant="caption" color={colors.accent}>
                  [ {slideNode.subheading || 'QUANTITATIVE IMPACT'} ]
                </TypographyBlock>
                <GraphicBadge variant="chip" tone="acid">
                  HIGH IMPACT
                </GraphicBadge>
              </div>

              <TypographyBlock
                variant="statNumber"
                fontFamily={t.fontHeading}
                color={colors.accent}
              >
                {slideNode.focalBlock.content}
              </TypographyBlock>

              {slideNode.focalBlock.metric && (
                <div className="text-sm md:text-base font-mono font-bold tracking-[0.2em] uppercase text-[#0F172A]">
                  {slideNode.focalBlock.metric}
                </div>
              )}
            </div>

            {/* Right 6 Columns: Narrative Context */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-center space-y-6 md:pl-6">
              {slideNode.subheading && (
                <TypographyBlock variant="caption" color={colors.accent}>
                  [ {slideNode.subheading} ]
                </TypographyBlock>
              )}

              <TypographyBlock
                variant="h1"
                fontFamily={t.fontHeading}
                color="#0F172A"
              >
                {slideNode.focalBlock.secondary}
              </TypographyBlock>

              <div
                className="w-14 h-1 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />

              {slideNode.supportingBlocks.length > 0 && (
                <TypographyBlock variant="body" color="#64748B" measure>
                  {slideNode.supportingBlocks[0].description}
                </TypographyBlock>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. MULTI_FACET_GRID (3 Pillars - Content Hugging, Zero Voids)     */}
      {/* ================================================================= */}
      {slideNode.intent === 'MULTI_FACET_GRID' && (
        <div 
          className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: colors.bg,
            padding: `${space(6)}px ${space(8)}px`,
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <IconBadge icon={slideSemanticIcon} size={16} tone="cobalt" shape="circle" />
                {slideNode.subheading && (
                  <TypographyBlock variant="caption" color={colors.accent}>
                    [ {slideNode.subheading} ]
                  </TypographyBlock>
                )}
              </div>
              <TypographyBlock
                variant="h2"
                fontFamily={t.fontHeading}
                color="#0F172A"
              >
                {slideNode.focalBlock.content}
              </TypographyBlock>
            </div>

            <span className="text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-md bg-white border border-slate-200 text-[#64748B] uppercase shadow-xs">
              [ 0{slideNumber} // {slideNode.supportingBlocks.length || 3}-PILLAR MATRIX ]
            </span>
          </div>

          {/* Live Mermaid Diagram if present, else Grid */}
          {slideNode.diagram ? (
            <div className="my-auto pt-6 flex-1 flex flex-col justify-center">
              <DiagramBlock
                diagram={slideNode.diagram}
                theme={t}
                title={slideNode.focalBlock.content}
              />
            </div>
          ) : (
            <div className="my-auto pt-6 flex-1 flex items-center">
              <SpatialContainer
                direction="grid"
                gridCols={Math.min(4, Math.max(2, slideNode.supportingBlocks.length || 3))}
                gap={3}
                align="start"
              >
                {slideNode.supportingBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-auto flex flex-col justify-between transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <GraphicBadge variant="step" tone="cobalt">
                          {block.index || `0${idx + 1}`}
                        </GraphicBadge>
                        <IconBadge
                          icon={block.icon || block.title || slideSemanticIcon}
                          size={16}
                          tone="muted"
                        />
                      </div>

                      {block.title && (
                        <TypographyBlock
                          variant="h3"
                          fontFamily={t.fontHeading}
                          color="#0F172A"
                          className="mb-2"
                        >
                          {block.title}
                        </TypographyBlock>
                      )}

                      <TypographyBlock variant="body" color="#64748B">
                        {block.description}
                      </TypographyBlock>
                    </div>
                  </div>
                ))}
              </SpatialContainer>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. HORIZONTAL_TIMELINE (Connected Horizontal Flow)               */}
      {/* ================================================================= */}
      {slideNode.intent === 'HORIZONTAL_TIMELINE' && (
        <div 
          className="relative z-10 w-full h-full flex flex-col justify-between overflow-hidden"
          style={{
            backgroundColor: colors.bg,
            padding: `${space(6)}px ${space(8)}px`,
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <IconBadge icon="solar:transfer-horizontal-bold-duotone" size={16} tone="cobalt" shape="circle" />
                {slideNode.subheading && (
                  <TypographyBlock variant="caption" color={colors.accent}>
                    [ {slideNode.subheading} ]
                  </TypographyBlock>
                )}
              </div>
              <TypographyBlock
                variant="h2"
                fontFamily={t.fontHeading}
                color="#0F172A"
              >
                {slideNode.focalBlock.content}
              </TypographyBlock>
            </div>

            <span className="text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-md bg-white border border-slate-200 text-[#64748B] uppercase shadow-xs">
              [ 0{slideNumber} // STRATEGIC HORIZON ]
            </span>
          </div>

          {/* Live Diagram or Connected Horizontal Timeline Cards */}
          {slideNode.diagram ? (
            <div className="my-auto pt-6 flex-1 flex flex-col justify-center">
              <DiagramBlock
                diagram={slideNode.diagram}
                theme={t}
                title={slideNode.focalBlock.content}
              />
            </div>
          ) : (
            <div className="my-auto pt-6 flex-1 flex flex-col justify-center relative">
              {/* Connecting Horizontal Track */}
              <div 
                className="absolute top-1/2 left-8 right-8 h-[2px] -translate-y-12 pointer-events-none z-0 hidden md:block"
                style={{ backgroundColor: colors.accent }}
              />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {(slideNode.supportingBlocks.length > 0 ? slideNode.supportingBlocks.slice(0, 3) : [
                  { index: '01', title: 'Phase 01', description: slideNode.focalBlock.secondary || 'Initial architectural baseline deployment.' },
                  { index: '02', title: 'Phase 02', description: 'System telemetry integration and continuous validation.' },
                  { index: '03', title: 'Phase 03', description: 'Autonomous closed-loop scaling across production.' },
                ]).map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-auto flex flex-col justify-between relative transition-shadow hover:shadow-md"
                  >
                    <div>
                      {/* Step Milestone Pill */}
                      <div className="flex items-center justify-between mb-4">
                        <GraphicBadge variant="step" tone="cobalt">
                          {step.index || `0${sIdx + 1}`}
                        </GraphicBadge>
                        <div className="flex items-center gap-1.5">
                          <IconBadge
                            icon={step.icon || step.title || 'solar:flag-bold-duotone'}
                            size={14}
                            tone="muted"
                          />
                          <span className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
                            MILESTONE {step.index || `0${sIdx + 1}`}
                          </span>
                        </div>
                      </div>

                      {step.title && (
                        <TypographyBlock
                          variant="h3"
                          fontFamily={t.fontHeading}
                          color="#0F172A"
                          className="mb-2"
                        >
                          {step.title}
                        </TypographyBlock>
                      )}

                      <TypographyBlock variant="body" color="#64748B">
                        {step.description}
                      </TypographyBlock>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. EDITORIAL_QUOTE (Deep Breather Quote - 40px Italic)           */}
      {/* ================================================================= */}
      {slideNode.intent === 'EDITORIAL_QUOTE' && (
        <div 
          className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center overflow-hidden bg-[#080E1E] text-white"
          style={{
            backgroundColor: colors.bg,
            padding: `${space(6)}px ${space(8)}px`,
          }}
        >
          {/* Subtle Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-25"
            style={{ backgroundColor: colors.accent }}
          />

          {slideNode.subheading && (
            <div className="relative z-10 mb-4 flex items-center gap-2 justify-center">
              <IconBadge icon="solar:chat-round-dots-bold-duotone" size={14} tone="acid" shape="circle" />
              <span
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border"
                style={{
                  backgroundColor: `${colors.accent}25`,
                  borderColor: `${colors.accent}50`,
                  color: '#FFFFFF',
                }}
              >
                [ {slideNode.subheading} ]
              </span>
            </div>
          )}

          <div
            className="relative z-10 text-[100px] leading-none select-none -mb-6 font-serif opacity-40"
            style={{ color: colors.accent }}
            aria-hidden="true"
          >
            “
          </div>

          <TypographyBlock
            variant="quote"
            fontFamily={t.fontHeading}
            color="#FFFFFF"
            align="center"
            className="max-w-4xl mx-auto px-4"
          >
            {slideNode.focalBlock.content.replace(/^["“]|["”]$/g, '')}
          </TypographyBlock>

          <div
            className="relative z-10 w-20 h-1 rounded-full mx-auto my-6 shadow-sm"
            style={{ backgroundColor: colors.accent }}
          />

          {(slideNode.focalBlock.secondary || slideNode.author) && (
            <TypographyBlock
              variant="caption"
              color={colors.accentBadge}
              align="center"
              className="tracking-[0.25em]"
            >
              {slideNode.focalBlock.secondary || slideNode.author}
            </TypographyBlock>
          )}
        </div>
      )}
    </div>
  );
};

export default SlideRenderer;
