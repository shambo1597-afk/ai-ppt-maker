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
  { name: 'TrendingUp', category: 'Business', tags: ['growth', 'chart', 'profit', 'sales', 'increase', 'expansion'] },
  { name: 'DollarSign', category: 'Business', tags: ['money', 'revenue', 'finance', 'cost', 'income', 'earnings'] },
  { name: 'Briefcase', category: 'Business', tags: ['work', 'portfolio', 'job', 'corporate'] },
  { name: 'CreditCard', category: 'Business', tags: ['payment', 'billing', 'transaction'] },
  { name: 'PieChart', category: 'Business', tags: ['analytics', 'data', 'graph', 'breakdown', 'proportion', 'share'] },
  { name: 'BarChart3', category: 'Business', tags: ['metrics', 'statistics', 'performance', 'benchmark', 'throughput'] },
  { name: 'Target', category: 'Business', tags: ['goal', 'objective', 'mission', 'focus'] },
  { name: 'Award', category: 'Business', tags: ['winner', 'prize', 'quality', 'badge'] },
  { name: 'Building2', category: 'Business', tags: ['company', 'enterprise', 'office'] },
  { name: 'Coins', category: 'Business', tags: ['wealth', 'crypto', 'cash', 'savings'] },

  // Tech & Development
  { name: 'Cpu', category: 'Technology', tags: ['processor', 'hardware', 'chip', 'ai', 'compute', 'silicon'] },
  { name: 'Zap', category: 'Technology', tags: ['fast', 'speed', 'energy', 'lightning'] },
  { name: 'ShieldCheck', category: 'Technology', tags: ['security', 'protect', 'safe', 'audit', 'compliance', 'verified'] },
  { name: 'Cloud', category: 'Technology', tags: ['hosting', 'server', 'aws', 'saas'] },
  { name: 'Server', category: 'Technology', tags: ['database', 'datacenter', 'backend', 'infrastructure', 'node'] },
  { name: 'Database', category: 'Technology', tags: ['storage', 'sql', 'records', 'data'] },
  { name: 'Code2', category: 'Technology', tags: ['programming', 'developer', 'software'] },
  { name: 'Terminal', category: 'Technology', tags: ['console', 'cli', 'command', 'bash'] },
  { name: 'Layers', category: 'Technology', tags: ['stack', 'architecture', 'structure', 'depth', 'tier'] },
  { name: 'GitBranch', category: 'Technology', tags: ['version', 'code', 'repository'] },
  { name: 'Lock', category: 'Technology', tags: ['privacy', 'encryption', 'security'] },
  { name: 'Bot', category: 'Technology', tags: ['ai', 'robot', 'agent', 'automation', 'autonomous'] },
  { name: 'Sparkles', category: 'Technology', tags: ['magic', 'ai', 'generate', 'new'] },
  { name: 'Boxes', category: 'Technology', tags: ['microservices', 'kubernetes', 'containers'] },
  { name: 'Wifi', category: 'Technology', tags: ['connectivity', 'wireless', 'network', 'bandwidth'] },

  // Interface & Arrows
  { name: 'ArrowRight', category: 'Interface', tags: ['next', 'forward', 'pointer'] },
  { name: 'CheckCircle2', category: 'Interface', tags: ['success', 'done', 'approved', 'yes'] },
  { name: 'Clock', category: 'Interface', tags: ['time', 'history', 'schedule', 'duration', 'latency'] },
  { name: 'Globe', category: 'Interface', tags: ['worldwide', 'international', 'web', 'network', 'coverage', 'global'] },
  { name: 'Users', category: 'Interface', tags: ['team', 'people', 'customers', 'community'] },
  { name: 'UserCheck', category: 'Interface', tags: ['verified', 'member', 'profile'] },
  { name: 'Share2', category: 'Interface', tags: ['social', 'distribute', 'send'] },
  { name: 'Compass', category: 'Interface', tags: ['direction', 'strategy', 'navigation'] },
  { name: 'Search', category: 'Interface', tags: ['find', 'lookup', 'discover'] },
  { name: 'Settings', category: 'Interface', tags: ['configure', 'options', 'gear'] },
  { name: 'Bell', category: 'Interface', tags: ['alert', 'notification', 'alarm'] },
  { name: 'Calendar', category: 'Interface', tags: ['date', 'event', 'roadmap', 'phase', 'timeline'] },
  { name: 'Mail', category: 'Interface', tags: ['contact', 'email', 'message'] },
  { name: 'Phone', category: 'Interface', tags: ['call', 'support', 'contact'] },
  { name: 'MapPin', category: 'Interface', tags: ['location', 'place', 'hq'] },
  { name: 'Flame', category: 'Interface', tags: ['hot', 'trend', 'fire', 'popular'] },
  { name: 'Heart', category: 'Interface', tags: ['like', 'love', 'favorite'] },
  { name: 'Star', category: 'Interface', tags: ['rating', 'featured', 'review'] },
  { name: 'Lightbulb', category: 'Interface', tags: ['idea', 'innovation', 'solution'] },
  { name: 'Rocket', category: 'Interface', tags: ['launch', 'startup', 'scale', 'fast', 'deployment', 'mission'] },

  // Science & Engineering — real fixture briefs skew heavily toward
  // aerospace/biotech/materials-science vocabulary (see
  // test/fixtures/stratospheric-brief.md) that the original four
  // categories above had essentially no coverage for; every bullet using
  // this vocabulary fell straight through to null (the slide's own
  // single fallback icon) regardless of how different two bullets'
  // actual subject matter was.
  { name: 'Atom', category: 'Science', tags: ['physics', 'quantum', 'particle', 'atomic', 'molecular'] },
  { name: 'FlaskConical', category: 'Science', tags: ['chemistry', 'biotech', 'lab', 'experiment', 'formula'] },
  { name: 'Microscope', category: 'Science', tags: ['research', 'analysis', 'biology', 'genomic', 'study'] },
  { name: 'Dna', category: 'Science', tags: ['genetic', 'genome', 'biology', 'sequence'] },
  { name: 'Thermometer', category: 'Science', tags: ['temperature', 'thermal', 'heat', 'climate'] },
  { name: 'Wind', category: 'Science', tags: ['aerodynamic', 'airflow', 'wind', 'atmosphere', 'atmospheric'] },
  { name: 'Satellite', category: 'Science', tags: ['orbit', 'space', 'satellite', 'aerospace', 'altitude'] },
  { name: 'Waves', category: 'Science', tags: ['signal', 'frequency', 'wave', 'wireless', 'radio'] },
  { name: 'Battery', category: 'Science', tags: ['power', 'energy', 'battery', 'endurance', 'charge'] },
  { name: 'HeartPulse', category: 'Science', tags: ['health', 'medical', 'vital', 'pulse', 'clinical'] },
  { name: 'Leaf', category: 'Science', tags: ['sustainable', 'organic', 'ecological', 'renewable', 'carbon'] },
  { name: 'Gauge', category: 'Science', tags: ['pressure', 'reading', 'sensor', 'measurement', 'output'] },
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
 * "time" doesn't fire inside "sometimes" or "timeline". Returns a
 * kebab-case id ready for iconFetcher.ts's getIconDataUrl, or null when
 * nothing matches at all — callers should fall back to the slide's own
 * icon rather than guess.
 *
 * `usedIcons`, when given, is the set of icon ids (kebab-case, matching
 * this function's own return shape) already assigned to OTHER bullets on
 * this same slide/deck — callers should accumulate into the same Set
 * across all their inferIconForText() calls for one slide. Real Canva
 * samples use a distinct icon per card, not one icon repeated across
 * every card, so: among every tag match (not just the first, unlike the
 * plain first-match-wins this used to be), an unused one wins; if every
 * direct tag match is already used, an unused icon from the SAME
 * category as the best match is preferred over an exact repeat — a
 * thematically-adjacent icon (even one whose own tags didn't happen to
 * match this text) still reads as more varied than the identical icon
 * showing up twice on one slide. Only once that category's pool is also
 * exhausted does this fall back to repeating the best direct match.
 */
export function inferIconForText(text: string, usedIcons?: Set<string>): string | null {
  if (!text) return null;
  const words = new Set(text.toLowerCase().match(/[a-z0-9]+/g) || []);
  if (words.size === 0) return null;

  const directMatches = ICON_LIBRARY.filter((item) => item.tags.some((tag) => words.has(tag)));
  if (directMatches.length === 0) return null;
  if (!usedIcons) return pascalToKebab(directMatches[0].name);

  const unusedDirect = directMatches.find((item) => !usedIcons.has(pascalToKebab(item.name)));
  if (unusedDirect) return pascalToKebab(unusedDirect.name);

  const bestCategory = directMatches[0].category;
  const unusedInCategory = ICON_LIBRARY.find(
    (item) => item.category === bestCategory && !usedIcons.has(pascalToKebab(item.name))
  );
  if (unusedInCategory) return pascalToKebab(unusedInCategory.name);

  return pascalToKebab(directMatches[0].name);
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
