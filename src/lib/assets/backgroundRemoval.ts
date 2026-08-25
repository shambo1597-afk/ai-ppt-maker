/**
 * Client-side background removal for the treated stock-photo pipeline (see
 * stockPhotoFetcher.ts). Wraps @imgly/background-removal — a WASM model
 * that runs entirely in-browser, no API key, no server round-trip, Apache
 * 2.0 licensed — behind a null-on-failure contract instead of letting a
 * model-load or inference error propagate: per the no-raw-stock-photo
 * policy (see slideComposer.ts), a caller that gets null MUST skip the
 * image entirely rather than falling back to the original, untreated
 * photo.
 *
 * @imgly/background-removal pulls in onnxruntime-web, a ~24MB WASM ML
 * runtime — a static top-level import would bundle that into every
 * user's main JS chunk even though this whole pipeline is inert without a
 * configured Pexels key (see stockPhotoFetcher.ts's resolvePexelsApiKey).
 * A dynamic import() instead lets Vite code-split it out, so the browser
 * only ever fetches it the first time this function actually runs.
 */
export async function removeImageBackground(imageUrlOrBlob: string | Blob): Promise<Blob | null> {
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    const result = await removeBackground(imageUrlOrBlob, {
      output: { format: 'image/png' },
    });
    return result ?? null;
  } catch {
    return null;
  }
}
