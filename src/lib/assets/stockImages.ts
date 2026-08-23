/**
 * User-Asset-First Architecture for SlideCraft
 * Automated blind stock photo scraping from Unsplash is completely disabled.
 * Images are ONLY rendered if the user explicitly uploaded an asset and assigned it to a slide.
 */

export interface StockPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  author: string;
  caption: string;
  tags: string[];
  category: string;
  source: 'user' | 'upload';
}

/**
 * Returns empty string by default to prevent blind stock scraping.
 * Slides prioritize bold graphic poster layouts and color-block containers.
 */
export async function getDistinctStockPhoto(
  _keywords: string = '',
  _slideIndex: number = 0,
  _presentationContext: string = ''
): Promise<string> {
  return '';
}

export async function getDistinctStockPhotoObject(
  _keywords: string = '',
  _slideIndex: number = 0,
  _presentationContext: string = ''
): Promise<StockPhoto | null> {
  return null;
}

export function resetStockPhotoTracker(): void {
  // No-op in User-Asset-First mode
}
