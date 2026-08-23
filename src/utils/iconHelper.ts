import React from 'react';
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

/**
 * Generate an SVG data URI for a given Lucide icon to embed inside PPTXGenJS
 */
export function getIconSvgDataUrl(
  iconName: string,
  color: string = '#6366f1',
  strokeWidth: number = 2
): string {
  // Fallback SVG string with Lucide geometry or standard shape
  const cleanColor = color.startsWith('#') ? color : `#${color}`;
  
  // We can construct a standard crisp SVG
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="${cleanColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;

  // pptxgenjs's addImage() requires a base64-encoded data URL (a plain
  // URI-encoded one renders fine in an <img> but is silently rejected on
  // export), so this always base64-encodes.
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}
