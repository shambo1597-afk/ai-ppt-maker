import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Icons from 'lucide-react';

export interface IconItem {
  name: string;
  category: string;
  tags: string[];
}

export const ICON_LIBRARY: IconItem[] = [
  // Business & Finance
  { name: 'TrendingUp', category: 'Business', tags: ['growth', 'chart', 'profit', 'sales'] },
  { name: 'DollarSign', category: 'Business', tags: ['money', 'revenue', 'finance', 'cost'] },
  { name: 'Briefcase', category: 'Business', tags: ['work', 'portfolio', 'job', 'corporate'] },
  { name: 'CreditCard', category: 'Business', tags: ['payment', 'billing', 'transaction'] },
  { name: 'PieChart', category: 'Business', tags: ['analytics', 'data', 'graph', 'breakdown'] },
  { name: 'BarChart3', category: 'Business', tags: ['metrics', 'statistics', 'performance'] },
  { name: 'Target', category: 'Business', tags: ['goal', 'objective', 'mission', 'focus'] },
  { name: 'Award', category: 'Business', tags: ['winner', 'prize', 'quality', 'badge'] },
  { name: 'Building2', category: 'Business', tags: ['company', 'enterprise', 'office'] },
  { name: 'Coins', category: 'Business', tags: ['wealth', 'crypto', 'cash', 'savings'] },

  // Tech & Development
  { name: 'Cpu', category: 'Technology', tags: ['processor', 'hardware', 'chip', 'ai'] },
  { name: 'Zap', category: 'Technology', tags: ['fast', 'speed', 'energy', 'lightning'] },
  { name: 'ShieldCheck', category: 'Technology', tags: ['security', 'protect', 'safe', 'audit'] },
  { name: 'Cloud', category: 'Technology', tags: ['hosting', 'server', 'aws', 'saas'] },
  { name: 'Server', category: 'Technology', tags: ['database', 'datacenter', 'backend'] },
  { name: 'Database', category: 'Technology', tags: ['storage', 'sql', 'records', 'data'] },
  { name: 'Code2', category: 'Technology', tags: ['programming', 'developer', 'software'] },
  { name: 'Terminal', category: 'Technology', tags: ['console', 'cli', 'command', 'bash'] },
  { name: 'Layers', category: 'Technology', tags: ['stack', 'architecture', 'structure'] },
  { name: 'GitBranch', category: 'Technology', tags: ['version', 'code', 'repository'] },
  { name: 'Lock', category: 'Technology', tags: ['privacy', 'encryption', 'security'] },
  { name: 'Bot', category: 'Technology', tags: ['ai', 'robot', 'agent', 'automation'] },
  { name: 'Sparkles', category: 'Technology', tags: ['magic', 'ai', 'generate', 'new'] },
  { name: 'Boxes', category: 'Technology', tags: ['microservices', 'kubernetes', 'containers'] },

  // Interface & Arrows
  { name: 'ArrowRight', category: 'Interface', tags: ['next', 'forward', 'pointer'] },
  { name: 'CheckCircle2', category: 'Interface', tags: ['success', 'done', 'approved', 'yes'] },
  { name: 'Clock', category: 'Interface', tags: ['time', 'history', 'schedule', 'speed'] },
  { name: 'Globe', category: 'Interface', tags: ['worldwide', 'international', 'web', 'network'] },
  { name: 'Users', category: 'Interface', tags: ['team', 'people', 'customers', 'community'] },
  { name: 'UserCheck', category: 'Interface', tags: ['verified', 'member', 'profile'] },
  { name: 'Share2', category: 'Interface', tags: ['social', 'distribute', 'send'] },
  { name: 'Compass', category: 'Interface', tags: ['direction', 'strategy', 'navigation'] },
  { name: 'Search', category: 'Interface', tags: ['find', 'lookup', 'discover'] },
  { name: 'Settings', category: 'Interface', tags: ['configure', 'options', 'gear'] },
  { name: 'Bell', category: 'Interface', tags: ['alert', 'notification', 'alarm'] },
  { name: 'Calendar', category: 'Interface', tags: ['date', 'event', 'roadmap'] },
  { name: 'Mail', category: 'Interface', tags: ['contact', 'email', 'message'] },
  { name: 'Phone', category: 'Interface', tags: ['call', 'support', 'contact'] },
  { name: 'MapPin', category: 'Interface', tags: ['location', 'place', 'hq'] },
  { name: 'Flame', category: 'Interface', tags: ['hot', 'trend', 'fire', 'popular'] },
  { name: 'Heart', category: 'Interface', tags: ['like', 'love', 'favorite'] },
  { name: 'Star', category: 'Interface', tags: ['rating', 'featured', 'review'] },
  { name: 'Lightbulb', category: 'Interface', tags: ['idea', 'innovation', 'solution'] },
  { name: 'Rocket', category: 'Interface', tags: ['launch', 'startup', 'scale', 'fast'] },
];

/** "Building2" -> "building-2" — the inverse of kebabToPascalCase below,
 * for turning an ICON_LIBRARY component name into the kebab-case id
 * iconFetcher.ts's Iconify lookup expects. */
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // camelCase boundary: "Shield" + "Check" -> "Shield-Check"
    .replace(/([A-Za-z])(\d)/g, '$1-$2') // letter->digit boundary: "Building" + "2" -> "Building-2"
    .toLowerCase();
}

/**
 * Pick a real, content-appropriate icon for a piece of text (a grid
 * card's title/description) by matching its words against ICON_LIBRARY's
 * curated tags — the same "keyword -> icon" idea ruleBasedGenerator.ts
 * already uses for whole-slide icon selection, extended to per-item
 * granularity. Word-boundary matching (not substring) so a tag like
 * "time" doesn't fire inside "sometimes" or "timeline". Deterministic:
 * first match in ICON_LIBRARY order wins. Returns a kebab-case id ready
 * for iconFetcher.ts's getIconDataUrl, or null when nothing matches —
 * callers should fall back to the slide's own icon rather than guess.
 */
export function inferIconForText(text: string): string | null {
  if (!text) return null;
  const words = new Set(text.toLowerCase().match(/[a-z0-9]+/g) || []);
  if (words.size === 0) return null;
  for (const item of ICON_LIBRARY) {
    if (item.tags.some((tag) => words.has(tag))) {
      return pascalToKebab(item.name);
    }
  }
  return null;
}

/**
 * Dynamically render a Lucide Icon by string name
 */
export function DynamicLucideIcon({
  name,
  className = '',
  size = 24,
  color,
  strokeWidth = 2,
}: {
  name: string;
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  // @ts-ignore
  const Component = Icons[name] || Icons.HelpCircle;
  return React.createElement(Component, {
    className,
    size,
    color,
    strokeWidth,
  });
}

/** "cpu-bold-duotone" -> "CpuBoldDuotone" — Iconify-style icon ids are
 * kebab-case (see iconFetcher.ts's normalizeIconName), lucide-react's
 * component export names are PascalCase; this bridges the two so a name
 * like the ones this app actually generates ("sparkles", "shield-check",
 * "building-2") resolves to its real lucide-react component. */
function kebabToPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Generate an SVG data URI for a given icon to embed inside PPTXGenJS.
 * This is only ever a last-resort fallback (pptxExporter.ts tries the
 * element's own pre-fetched svgData and an id/name lookup in iconSvgMap
 * first) — but a fallback that silently substitutes a fixed, unrelated
 * checkmark icon regardless of what was actually requested is worse than
 * no fallback: previously this function ignored `iconName` entirely and
 * always returned the same hardcoded circle-check SVG. Now it renders
 * the real matching lucide-react icon (the same library ElementRenderer's
 * DynamicLucideIcon draws on canvas for this same non-Iconify-svgData
 * case, via react-dom/server so it works outside a mounted React tree),
 * falling back to a generic icon — same as DynamicLucideIcon's own
 * fallback — only when the name truly doesn't match a known icon.
 */
export function getIconSvgDataUrl(
  iconName: string,
  color: string = '#6366f1',
  strokeWidth: number = 2
): string {
  const cleanColor = color.startsWith('#') ? color : `#${color}`;
  const bareName = iconName.includes(':') ? iconName.split(':')[1] : iconName;
  const pascalName = kebabToPascalCase(bareName);
  // @ts-ignore - dynamic lookup by name, mirrors DynamicLucideIcon's own fallback
  const Component = Icons[pascalName] || Icons.HelpCircle;
  const svgString = renderToStaticMarkup(
    React.createElement(Component, { size: 128, color: cleanColor, strokeWidth })
  );

  // pptxgenjs's addImage() requires a base64-encoded data URL (a plain
  // URI-encoded one renders fine in an <img> but is silently rejected on
  // export), so this always base64-encodes.
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}
