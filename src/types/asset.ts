export type AssetType = 'image' | 'note' | 'pdf' | 'icon';

export type AssetSource = 'upload' | 'iconify' | 'preset';

export interface AssetItem {
  id: string;
  name: string;
  type: AssetType;
  source: AssetSource;
  url: string; // Data URL, Blob URL, or remote CDN URL
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number; // bytes
  dimensions?: {
    width: number;
    height: number;
  };
  content?: string; // Text content for notes / markdown / parsed PDF text / SVG raw
  pageCount?: number; // For PDFs
  tags?: string[];
  targetSlide?: 'auto' | number;
  notes?: string;
  author?: {
    name: string;
    link?: string;
  };
  createdAt: number;
}

export interface IconifyIconItem {
  prefix: string;
  name: string;
  fullName: string; // e.g. "lucide:rocket" or "tabler:cpu"
  title?: string;
  category?: string;
  tags?: string[];
  svg?: string;
}

export type AssetManagerTab = 'my-assets' | 'iconify' | 'auto-match';
