/**
 * Explicit slide-placement parsing for verbatim text-fidelity mode (see
 * verifyTextFidelity.ts). This is pure string splitting — no LLM
 * involvement — so pinning a chunk of text to a specific slide number can
 * never be wrong due to a model error; only the *classification* of a
 * chunk's text into headline/body/points/etc (verifyTextFidelity.ts's
 * job) ever touches the model.
 *
 * Marker syntax: a line containing only `[[slide:N]]` (whitespace and
 * case insensitive around the number, e.g. `[[SLIDE: 3]]` also matches)
 * starts a new pinned chunk targeting 1-indexed slide N. Everything from
 * that line up to the next marker (or end of input) belongs to that
 * slide, verbatim. Text before the first marker (or the entire input, if
 * there are no markers at all) is unpinned.
 */

const SLIDE_MARKER_RE = /^\[\[slide:\s*(\d+)\s*\]\]$/i;

export interface ParsedPinnedText {
  /** 1-indexed slide number -> the exact text pinned to it (trimmed, but
   * otherwise byte-for-byte the user's own words). */
  pinned: Map<number, string>;
  /** Everything outside any [[slide:N]] block, trimmed. Empty string if
   * every bit of input was pinned, or if this is the whole input when no
   * markers are present at all. */
  unpinned: string;
}

/**
 * Split raw pasted text into pinned (slide-number-targeted) and unpinned
 * chunks by `[[slide:N]]` markers. A marker line that repeats an already-
 * seen slide number appends to (rather than replaces) that slide's text,
 * separated by a blank line — never silently discards a duplicate pin.
 */
export function parsePinnedSlideText(input: string): ParsedPinnedText {
  const lines = input.split(/\r\n|\r|\n/);
  const pinned = new Map<number, string>();
  const unpinnedLines: string[] = [];

  let currentSlide: number | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentSlide !== null) {
      const chunkText = currentLines.join('\n').trim();
      const existing = pinned.get(currentSlide);
      pinned.set(currentSlide, existing ? `${existing}\n\n${chunkText}` : chunkText);
    }
    currentLines = [];
  };

  for (const rawLine of lines) {
    const match = rawLine.trim().match(SLIDE_MARKER_RE);
    if (match) {
      flush();
      currentSlide = parseInt(match[1], 10);
      continue;
    }
    if (currentSlide === null) {
      unpinnedLines.push(rawLine);
    } else {
      currentLines.push(rawLine);
    }
  }
  flush();

  return { pinned, unpinned: unpinnedLines.join('\n').trim() };
}

/** Split on blank lines (the strongest structural signal a plain-text
 * paste gives us) or markdown ##/### headings, mirroring
 * ruleBasedGenerator.ts's own splitTextIntoSections so unpinned text is
 * chunked the same familiar way whether or not any markers are present. */
function splitIntoParagraphs(text: string): string[] {
  if (!text.trim()) return [];
  if (/^##\s+/m.test(text) || /^###\s+/m.test(text)) {
    return text
      .split(/(?=^##?\s+|^###\s+)/m)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Break one paragraph into roughly-equal sentence-level groups so a
 * single wall of prose (no blank lines at all) can still spread across
 * several slides instead of being crammed onto one. Never invents a
 * transition between groups — it's a literal split on sentence
 * boundaries, nothing added or reworded. */
function splitIntoSentenceGroups(text: string, groupCount: number): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1 || groupCount <= 1) return [text.trim()];

  const perGroup = Math.max(1, Math.ceil(sentences.length / groupCount));
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += perGroup) {
    groups.push(sentences.slice(i, i + perGroup).join(' '));
  }
  return groups;
}

export interface SlideChunkPlan {
  /** 1-indexed slide number -> the exact source text that slide's content
   * must be built from (a verbatim substring of the original input, never
   * composed/rewritten). */
  chunks: Map<number, string>;
  /** The deck's actual slide count: the highest claimed slide number
   * (pinned or auto-distributed). Never truncated below a pinned number —
   * text placement always wins over a soft slide-count target — but also
   * never padded with empty placeholder slides just to reach
   * `targetSlideCount` when the input genuinely doesn't have that much
   * real content. */
  slideCount: number;
  /** True when the input used at least one [[slide:N]] marker. Callers
   * use this to skip any post-processing (e.g. rhythm.ts's
   * applyRhythmToAISlides, which can insert or reorder slides to enforce
   * layout variety) that would shift a pinned chunk away from the exact
   * slide number the user asked for — explicit placement always wins. */
  hasPinnedMarkers: boolean;
}

/**
 * Build the full slide-number -> source-text plan for a generation run:
 * pinned chunks keep their explicit slide numbers; unpinned text is split
 * into paragraph/sentence-level chunks and distributed, in order, across
 * whichever slide numbers aren't already claimed by a pin, capped at
 * `targetSlideCount` slots (excess paragraphs are merged — literally
 * concatenated, never reworded — into the last slot rather than dropped,
 * same as a pinned number is never dropped). Never invents connective
 * text between chunks — every chunk is a literal excerpt of the original
 * input.
 */
export function buildSlideChunks(input: string, targetSlideCount: number): SlideChunkPlan {
  const { pinned, unpinned } = parsePinnedSlideText(input);

  const highestPinned = pinned.size > 0 ? Math.max(...pinned.keys()) : 0;
  const availableSlots = Math.max(0, targetSlideCount - pinned.size);

  let unpinnedChunks = splitIntoParagraphs(unpinned);
  if (unpinnedChunks.length <= 1 && unpinned.trim() && availableSlots > 1) {
    unpinnedChunks = splitIntoSentenceGroups(unpinned, availableSlots);
  } else if (unpinnedChunks.length === 0 && unpinned.trim()) {
    unpinnedChunks = [unpinned.trim()];
  }

  // More unpinned chunks than slots for them? Merge the overflow into the
  // last slot (a literal concatenation) rather than truncating — dropping
  // a paragraph the user pasted would be exactly the kind of silent data
  // loss this whole feature exists to prevent.
  if (availableSlots > 0 && unpinnedChunks.length > availableSlots) {
    const head = unpinnedChunks.slice(0, availableSlots - 1);
    const overflow = unpinnedChunks.slice(availableSlots - 1).join('\n\n');
    unpinnedChunks = availableSlots > 1 ? [...head, overflow] : [overflow];
  }

  const chunks = new Map<number, string>(pinned);
  let nextSlot = 1;
  for (const chunk of unpinnedChunks) {
    while (chunks.has(nextSlot)) nextSlot++;
    chunks.set(nextSlot, chunk);
    nextSlot++;
  }

  const highestClaimed = chunks.size > 0 ? Math.max(...chunks.keys()) : 0;
  const slideCount = Math.max(highestPinned, highestClaimed);

  return { chunks, slideCount, hasPinnedMarkers: pinned.size > 0 };
}
