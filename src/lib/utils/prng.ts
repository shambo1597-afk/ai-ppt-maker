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

/** Weighted-by-count random pick — favors items the real mined decks
 * actually used more often (a contrast pair seen thirty times vs. one seen
 * once) instead of treating every observed item as equally likely.
 *
 * Lives here (not in lib/design/themeGenerator.ts, its original home)
 * because lib/design/designGrammar.ts now needs it too (to weighted-pick a
 * real gradient pair — see deriveGradient()), and themeGenerator.ts itself
 * imports from designGrammar.ts, so putting it in either design/ module
 * would create a cycle. */
export function weightedPick<T extends { count: number }>(items: T[], rand: () => number): T {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total <= 0) return items[0];
  let roll = rand() * total;
  for (const item of items) {
    roll -= item.count;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}
