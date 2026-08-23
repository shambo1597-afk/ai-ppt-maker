import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

/**
 * Semantic Vector Icon Harvester & Resolver
 * Uses public Iconify icon libraries (Lucide, Solar, Carbon, Phosphor)
 * Dynamically resolves icons for slides and bullet points based on subject context.
 */

const KEYWORD_ICON_MAP: Record<string, string> = {
  // Architecture & Engineering
  architecture: 'solar:city-bold-duotone',
  building: 'solar:buildings-3-bold-duotone',
  structure: 'carbon:infrastructure',
  timber: 'solar:leaf-bold-duotone',
  facade: 'carbon:building',
  envelope: 'solar:widget-2-bold-duotone',
  concrete: 'carbon:industry',
  construction: 'solar:hammer-and-wrench-bold-duotone',

  // Tech, AI & Systems
  ai: 'solar:cpu-bolt-bold-duotone',
  agent: 'solar:bot-bold-duotone',
  neural: 'solar:atom-bold-duotone',
  cloud: 'solar:cloud-bold-duotone',
  server: 'solar:server-square-bold-duotone',
  database: 'solar:database-bold-duotone',
  code: 'solar:code-square-bold-duotone',
  api: 'carbon:api',
  telemetry: 'solar:chart-square-bold-duotone',
  latency: 'solar:stopwatch-bold-duotone',
  speed: 'solar:bolt-bold-duotone',
  performance: 'solar:rocket-2-bold-duotone',
  security: 'solar:shield-check-bold-duotone',
  encryption: 'solar:lock-keyhole-bold-duotone',
  hardware: 'solar:cpu-bold-duotone',
  chip: 'carbon:microchip',

  // Science, Biology & Climate
  genomics: 'carbon:dna',
  dna: 'solar:dna-bold-duotone',
  biology: 'solar:bacteria-bold-duotone',
  synthetic: 'carbon:chemistry',
  bio: 'solar:leaf-bold-duotone',
  ecology: 'solar:planet-bold-duotone',
  water: 'solar:drop-bold-duotone',
  hydrology: 'solar:waterdrops-bold-duotone',
  solar: 'solar:sun-2-bold-duotone',
  carbon: 'solar:wind-bold-duotone',
  energy: 'solar:battery-charging-bold-duotone',
  battery: 'solar:battery-charging-bold-duotone',
  microfluidic: 'carbon:chemistry',
  trial: 'carbon:microscope',

  // Business, Finance & Strategy
  growth: 'solar:chart-2-bold-duotone',
  revenue: 'solar:dollar-bold-duotone',
  market: 'solar:globus-bold-duotone',
  investor: 'solar:hand-money-bold-duotone',
  finance: 'solar:wallet-money-bold-duotone',
  target: 'solar:target-bold-duotone',
  strategy: 'solar:compass-bold-duotone',
  scale: 'solar:maximize-square-bold-duotone',
  product: 'solar:box-minimalistic-bold-duotone',
  team: 'solar:users-group-rounded-bold-duotone',
  milestone: 'solar:flag-bold-duotone',
  process: 'solar:refresh-square-bold-duotone',
  flow: 'solar:transfer-horizontal-bold-duotone',
  quote: 'solar:chat-round-dots-bold-duotone',
  default: 'solar:stars-minimalistic-bold-duotone',
};

/**
 * Resolves an icon name or keyword to an Iconify icon tag
 */
export function resolveSemanticIcon(input?: string): string {
  if (!input) return KEYWORD_ICON_MAP.default;

  const clean = input.toLowerCase().trim();

  // If already a full Iconify identifier (e.g. 'lucide:cpu' or 'solar:atom-bold-duotone')
  if (clean.includes(':')) {
    return clean;
  }

  // Exact match
  if (KEYWORD_ICON_MAP[clean]) {
    return KEYWORD_ICON_MAP[clean];
  }

  // Substring match
  for (const [key, iconTag] of Object.entries(KEYWORD_ICON_MAP)) {
    if (clean.includes(key)) {
      return iconTag;
    }
  }

  // Fallback to lucide or solar
  return `solar:${clean.replace(/[^a-z0-9-]/g, '')}-bold-duotone` || KEYWORD_ICON_MAP.default;
}

export interface IconBadgeProps {
  icon?: string;
  keyword?: string;
  size?: number;
  tone?: 'cobalt' | 'acid' | 'white' | 'slate' | 'muted';
  shape?: 'circle' | 'square';
  className?: string;
}

/**
 * Glowing Circular / Square Graphic Vector Icon Badge
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  keyword,
  size = 20,
  tone = 'cobalt',
  shape = 'square',
  className = '',
}) => {
  const iconId = resolveSemanticIcon(icon || keyword);

  const toneStyles = {
    cobalt: 'bg-[#004BFE]/15 text-[#38BDF8] border-[#004BFE]/30 shadow-[0_0_15px_rgba(0,75,254,0.25)]',
    acid: 'bg-[#E6FF00]/15 text-[#E6FF00] border-[#E6FF00]/30 shadow-[0_0_15px_rgba(230,255,0,0.25)]',
    white: 'bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)]',
    slate: 'bg-slate-800/80 text-slate-200 border-slate-700 shadow-sm',
    muted: 'bg-slate-100 text-slate-700 border-slate-200 shadow-xs',
  };

  const shapeStyles = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      className={`inline-flex items-center justify-center p-2.5 border transition-all ${shapeStyles} ${toneStyles[tone]} ${className}`}
    >
      <IconifyIcon icon={iconId} width={size} height={size} />
    </div>
  );
};
