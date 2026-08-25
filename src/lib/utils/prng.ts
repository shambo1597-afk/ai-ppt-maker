/**
 * Deterministic seeded PRNG (mulberry32) — same seed always produces the
 * same sequence, so anything keyed off a seed (a blob shape, a noise
 * texture, a generated theme's hue/font pick) is stable and reproducible
 * without persisting anything beyond the seed itself.
 *
 * Lives here (not in lib/engine/organicShapes.ts, its original home)
 * because it's now a genuinely cross-cutting utility: lib/design's
 * themeGenerator.ts and lib/llm's client.ts both need it too, and
 * neither should reach into lib/engine/organicShapes.ts — a blob-shape
 * module — just to borrow an unrelated PRNG.
 */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fresh, effectively-unique per-deck seed (see client.ts's deckSeed and
 * SlideContent.deckSeed) — not cryptographic, just wide enough that two
 * calls a moment apart don't collide. Lives alongside seededRandom() so
 * every generation entry point (the Gemini path in lib/llm/client.ts, the
 * zero-API fallback in lib/parser/ruleBasedGenerator.ts) mints seeds the
 * same way without importing from each other. */
export function newDeckSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
}
