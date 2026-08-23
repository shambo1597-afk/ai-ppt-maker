import { IconifyIconItem, IconifySearchResponse } from '../types/asset';

export interface IconCollectionInfo {
  prefix: string;
  name: string;
  category: string;
  total?: number;
  sampleIcon: string;
}

export const POPULAR_COLLECTIONS: IconCollectionInfo[] = [
  { prefix: 'lucide', name: 'Lucide Icons', category: 'Modern UI', sampleIcon: 'lucide:sparkles' },
  { prefix: 'material-symbols', name: 'Material Symbols', category: 'Google UI', sampleIcon: 'material-symbols:smart-toy' },
  { prefix: 'tabler', name: 'Tabler Icons', category: 'Interface', sampleIcon: 'tabler:chart-arrows' },
  { prefix: 'carbon', name: 'Carbon Design', category: 'Enterprise/IBM', sampleIcon: 'carbon:chip' },
  { prefix: 'fa6-solid', name: 'FontAwesome 6', category: 'Classic UI', sampleIcon: 'fa6-solid:rocket' },
  { prefix: 'ri', name: 'Remix Icons', category: 'Neutral UI', sampleIcon: 'ri:global-line' },
  { prefix: 'ph', name: 'Phosphor Icons', category: 'Clean Outline', sampleIcon: 'ph:lightning-bold' },
  { prefix: 'simple-icons', name: 'Tech & Brands', category: 'Logos & Brands', sampleIcon: 'simple-icons:react' },
];

export const CURATED_FEATURED_ICONS: IconifyIconItem[] = [
  { prefix: 'lucide', name: 'sparkles', fullName: 'lucide:sparkles', title: 'Sparkles / AI' },
  { prefix: 'lucide', name: 'rocket', fullName: 'lucide:rocket', title: 'Rocket / Launch' },
  { prefix: 'lucide', name: 'trending-up', fullName: 'lucide:trending-up', title: 'Growth' },
  { prefix: 'lucide', name: 'shield-check', fullName: 'lucide:shield-check', title: 'Security' },
  { prefix: 'lucide', name: 'cpu', fullName: 'lucide:cpu', title: 'Processor' },
  { prefix: 'lucide', name: 'cloud', fullName: 'lucide:cloud', title: 'Cloud' },
  { prefix: 'lucide', name: 'database', fullName: 'lucide:database', title: 'Database' },
  { prefix: 'lucide', name: 'users', fullName: 'lucide:users', title: 'Team' },
  { prefix: 'material-symbols', name: 'smart-toy-outline', fullName: 'material-symbols:smart-toy-outline', title: 'AI Robot' },
  { prefix: 'material-symbols', name: 'query-stats', fullName: 'material-symbols:query-stats', title: 'Analytics' },
  { prefix: 'material-symbols', name: 'bolt', fullName: 'material-symbols:bolt', title: 'High Speed' },
  { prefix: 'material-symbols', name: 'hub-outline', fullName: 'material-symbols:hub-outline', title: 'Network Hub' },
  { prefix: 'tabler', name: 'chart-infographic', fullName: 'tabler:chart-infographic', title: 'Infographic' },
  { prefix: 'tabler', name: 'brand-visual-studio', fullName: 'tabler:brand-visual-studio', title: 'IDE' },
  { prefix: 'tabler', name: 'augmented-reality', fullName: 'tabler:augmented-reality', title: 'AR / Vision' },
  { prefix: 'tabler', name: 'device-analytics', fullName: 'tabler:device-analytics', title: 'Metrics' },
  { prefix: 'carbon', name: 'blockchain', fullName: 'carbon:blockchain', title: 'Ledger' },
  { prefix: 'carbon', name: 'machine-learning-model', fullName: 'carbon:machine-learning-model', title: 'ML Model' },
  { prefix: 'carbon', name: 'cloud-monitoring', fullName: 'carbon:cloud-monitoring', title: 'Telemetry' },
  { prefix: 'carbon', name: 'network-4', fullName: 'carbon:network-4', title: 'Topology' },
  { prefix: 'fa6-solid', name: 'brain', fullName: 'fa6-solid:brain', title: 'Neural Brain' },
  { prefix: 'fa6-solid', name: 'layer-group', fullName: 'fa6-solid:layer-group', title: 'Architecture' },
  { prefix: 'fa6-solid', name: 'coins', fullName: 'fa6-solid:coins', title: 'Capital' },
  { prefix: 'fa6-solid', name: 'award', fullName: 'fa6-solid:award', title: 'Award' },
];

const svgCache = new Map<string, string>();
const searchCache = new Map<string, IconifyIconItem[]>();

export const iconifyService = {
  /**
   * Search icons across collections using the public Iconify API
   */
  async searchIcons(
    query: string,
    prefixFilter?: string,
    limit: number = 64
  ): Promise<IconifyIconItem[]> {
    const trimmed = query.trim().toLowerCase();
    const cacheKey = `${trimmed}_${prefixFilter || 'all'}_${limit}`;

    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey)!;
    }

    if (!trimmed && !prefixFilter) {
      return CURATED_FEATURED_ICONS;
    }

    try {
      let url = `https://api.iconify.design/search?query=${encodeURIComponent(trimmed || 'icon')}&limit=${limit}`;
      if (prefixFilter && prefixFilter !== 'all') {
        url += `&prefixes=${encodeURIComponent(prefixFilter)}`;
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`Iconify search error: ${res.statusText}`);

      const data: IconifySearchResponse = await res.json();

      const items: IconifyIconItem[] = (data.icons || []).map((fullName) => {
        const parts = fullName.split(':');
        const prefix = parts.length > 1 ? parts[0] : 'icon';
        const name = parts.length > 1 ? parts.slice(1).join(':') : parts[0];
        return {
          prefix,
          name,
          fullName,
          title: name.replace(/-/g, ' '),
        };
      });

      searchCache.set(cacheKey, items);
      return items;
    } catch (err) {
      console.warn('Iconify search request failed, falling back to local list:', err);
      // Fallback search in featured icons
      const fallback = CURATED_FEATURED_ICONS.filter((item) => {
        const matchesQuery = !trimmed || item.fullName.toLowerCase().includes(trimmed) || (item.title && item.title.toLowerCase().includes(trimmed));
        const matchesPrefix = !prefixFilter || prefixFilter === 'all' || item.prefix === prefixFilter;
        return matchesQuery && matchesPrefix;
      });
      return fallback;
    }
  },

  /**
   * Fetch crisp SVG string from Iconify API for a given icon and color
   */
  async getIconSvg(
    fullName: string,
    color: string = '#6366f1',
    size: number = 128
  ): Promise<string> {
    const [prefix, name] = fullName.includes(':') ? fullName.split(':') : ['lucide', fullName];
    const cleanColor = color.startsWith('#') ? color : `#${color}`;
    const cacheKey = `${prefix}:${name}:${cleanColor}:${size}`;

    if (svgCache.has(cacheKey)) {
      return svgCache.get(cacheKey)!;
    }

    try {
      const url = `https://api.iconify.design/${prefix}/${name}.svg?color=${encodeURIComponent(cleanColor)}&width=${size}&height=${size}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`Failed to load SVG: ${res.statusText}`);

      let svgText = await res.text();
      // Ensure dimensions and clean viewBox
      if (!svgText.includes('xmlns=')) {
        svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      svgCache.set(cacheKey, svgText);
      return svgText;
    } catch (err) {
      // Fallback standard crisp SVG
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${cleanColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    }
  },

  /**
   * Convert an Iconify icon to an SVG Data URL (for <img> tags, Canvas rendering, or PPTXGenJS export)
   */
  async getIconSvgDataUrl(
    fullName: string,
    color: string = '#6366f1',
    size: number = 128
  ): Promise<string> {
    const svg = await this.getIconSvg(fullName, color, size);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  },

  /**
   * Get direct preview image URL from Iconify CDN
   */
  getIconCdnUrl(fullName: string, color: string = '#ffffff'): string {
    const [prefix, name] = fullName.includes(':') ? fullName.split(':') : ['lucide', fullName];
    const cleanColor = color.startsWith('#') ? color.substring(1) : color;
    return `https://api.iconify.design/${prefix}/${name}.svg?color=%23${cleanColor}`;
  },
};
