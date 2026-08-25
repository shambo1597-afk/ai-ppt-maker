/**
 * Treated stock-photo pipeline: Pexels search -> background removal ->
 * theme duotone. This is the ONLY place this app ever fetches a stock
 * photo, and it never places one untreated — see slideComposer.ts's
 * User-Asset-First policy and the commit history around "a live stock-
 * photo violation" this pipeline is careful not to reopen. Every photo
 * that reaches a slide has had its background stripped and been recolored
 * into that specific deck's own two-tone palette; if any step fails, the
 * whole function resolves to null and the caller falls back to today's
 * behavior (a generated poster/texture, no image).
 *
 * Pexels over Unsplash: a generous free tier (200 req/hour, 20k/month),
 * no production-approval review gate (Unsplash caps unapproved apps at
 * 50 req/hour), and its license permits this kind of transformative reuse
 * without a mandatory attribution UI.
 */
import { ThemeTokens } from '../design/tokens';
import { removeImageBackground } from './backgroundRemoval';
import { applyDuotone } from './photoTreatment';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

/** Mirrors client.ts's resolveGeminiApiKey() pattern exactly: env var
 * first, then a user-supplied localStorage key, so this pipeline can be
 * turned on from within the app without a rebuild. Returns '' (falsy)
 * when nothing is configured — every caller below treats that as "this
 * whole pipeline no-ops", never as an error. */
export function resolvePexelsApiKey(): string {
  const envApiKey = (import.meta.env.VITE_PEXELS_API_KEY || '').trim();
  const localApiKey = (typeof window !== 'undefined' ? localStorage.getItem('slidecraft_pexels_key') : '') || '';
  return envApiKey || localApiKey;
}

interface PexelsPhoto {
  src: {
    large2x?: string;
    large?: string;
    medium?: string;
  };
}

interface PexelsSearchResponse {
  photos?: PexelsPhoto[];
}

/**
 * Search Pexels for one landscape-oriented photo matching `query`,
 * returning its source URL or null on any failure — no key configured, a
 * network/timeout error, a non-2xx response, or zero results. Never
 * throws; this is a best-effort lookup, not a required step.
 */
async function searchPexelsPhoto(query: string): Promise<string | null> {
  const apiKey = resolvePexelsApiKey();
  const trimmedQuery = query.trim();
  if (!apiKey || !trimmedQuery) return null;

  try {
    const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(trimmedQuery)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: PexelsSearchResponse = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || null;
  } catch {
    return null;
  }
}

const SEARCH_QUERY_STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'and', 'or', 'to', 'in', 'on', 'with', 'our', 'your', 'their', 'his', 'her', 'its',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'from', 'by', 'as', 'at',
  'into', 'onto', 'over', 'under', 'about', 'across', 'through', 'during', 'before', 'after', 'above', 'below',
  'we', 'you', 'they', 'it', 'i', 'not', 'no', 'so', 'than', 'then', 'how', 'what', 'why', 'when', 'where', 'who',
  'new', 'more', 'most', 'some', 'any', 'all', 'every', 'each', 'other', 'such', 'only', 'just', 'very',
]);

/**
 * Reduce a slide's headline (with body as secondary context) down to 2-4
 * concrete search terms. Pexels' search quality degrades on a long
 * natural-language sentence, so this strips punctuation/stopwords and
 * keeps the first handful of substantive words instead of sending the
 * whole headline verbatim.
 */
export function deriveSearchQuery(headline: string, body?: string): string {
  const words = `${headline} ${body || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SEARCH_QUERY_STOPWORDS.has(w));
  return words.slice(0, 4).join(' ');
}

/**
 * Fetch a photo relevant to `query`, strip its background, and recolor it
 * into `theme`'s own two-tone palette (heroBg for shadows, accent for
 * highlights — always this deck's real colors, never arbitrary ones).
 * Resolves to a treated PNG data URL, or null if no Pexels key is
 * configured, nothing relevant was found, or any pipeline step failed.
 * Never throws — every caller (composeMediaSplit's fallback, via
 * slideComposer.ts) can await this without its own try/catch.
 */
export async function fetchTreatedPhoto(query: string, theme: ThemeTokens): Promise<string | null> {
  // Short-circuit before any network/WASM work when the pipeline isn't
  // configured at all — same "no key -> silent no-op" philosophy as
  // client.ts's Gemini fallback, so deck generation is identical to today
  // when VITE_PEXELS_API_KEY is unset.
  if (!resolvePexelsApiKey()) return null;

  const photoUrl = await searchPexelsPhoto(query);
  if (!photoUrl) return null;

  const cutout = await removeImageBackground(photoUrl);
  if (!cutout) return null;

  return applyDuotone(cutout, theme.heroBg, theme.accent);
}
