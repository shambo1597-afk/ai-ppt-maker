/**
 * Hard, code-level enforcement of verbatim text fidelity. Instructing the
 * model "don't add or remove words" (see designSchoolGuidelines.ts) is
 * necessary but not sufficient — LLMs paraphrase anyway even under
 * explicit instruction — so every text field a model (or the rule-based
 * heuristic) assigns to a slide gets checked against its own source chunk
 * here, after generation, before the deck is ever shown. Anything that
 * isn't a real substring of the chunk it was supposedly extracted from
 * gets dropped, not silently kept: better to under-render than to show
 * invented copy.
 */
import { AISlideItem } from '../../types/llm';

/** Collapse whitespace, lowercase, and drop markdown bold markers (`**`)
 * for comparison only — never for the output. A model reformatting line
 * breaks or re-casing a word it copied verbatim shouldn't fail the check,
 * and neither should ruleBasedGenerator.ts's own markdown-bold-stripping
 * (parseSectionContent strips `**` from body/points text before it ever
 * reaches here, which can otherwise break substring containment for text
 * like "b**old** text" -> "bold text"); actually adding, removing, or
 * reordering a word will still fail it, since that changes the
 * surrounding substring match. */
function normalize(s: string): string {
  return s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Is `candidate` a normalized substring of `source`? An empty/whitespace
 * candidate trivially passes — there's nothing to fabricate. */
function isVerbatimSubstring(candidate: string, source: string): boolean {
  const normCandidate = normalize(candidate);
  if (!normCandidate) return true;
  return normalize(source).includes(normCandidate);
}

/** Break source text into clause-sized units for the coverage check —
 * sentence boundaries and line breaks are the only splits used, so a
 * "clause" here is never smaller than something a model could plausibly
 * have copied whole into one field. */
function splitIntoClauses(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const TEXT_FIELD_KEYS = ['headline', 'subheading', 'body', 'statValue', 'statLabel', 'author'] as const;
type TextFieldKey = (typeof TEXT_FIELD_KEYS)[number];

export interface DroppedField {
  field: string;
  value: string;
}

/**
 * Verify every text field a slide claims against `chunkText`, the exact
 * source text that slide's content was supposed to come from. Returns a
 * new AISlideItem — never mutates the input — with any fabricated field
 * set to undefined, and any of the chunk's own text that survived in NO
 * field appended (still verbatim, never reworded) to `body` so nothing
 * the user wrote silently vanishes.
 */
export function verifySlideTextFidelity(chunkText: string, slide: AISlideItem): AISlideItem {
  const result: AISlideItem = { ...slide };
  const dropped: DroppedField[] = [];

  for (const key of TEXT_FIELD_KEYS) {
    const value = result[key as TextFieldKey] as string | undefined;
    if (typeof value === 'string' && value && !isVerbatimSubstring(value, chunkText)) {
      dropped.push({ field: key, value });
      (result as any)[key] = undefined;
    }
  }

  if (Array.isArray(result.points)) {
    const keptPoints: string[] = [];
    result.points.forEach((point, idx) => {
      if (typeof point === 'string' && isVerbatimSubstring(point, chunkText)) {
        keptPoints.push(point);
      } else {
        dropped.push({ field: `points[${idx}]`, value: String(point) });
      }
    });
    result.points = keptPoints.length > 0 ? keptPoints : undefined;
  }

  if (dropped.length > 0) {
    console.warn(
      `[verifySlideTextFidelity] Dropped ${dropped.length} field(s) not found verbatim in the source chunk (invented/paraphrased text): ` +
        dropped.map((d) => `${d.field}="${d.value}"`).join('; ')
    );
  }

  // Coverage check: does every clause of chunkText survive in SOME
  // surviving field? Anything that doesn't gets appended to body — still
  // a literal excerpt, just concatenated — rather than silently dropped.
  const survivingFields = [
    result.headline,
    result.subheading,
    result.body,
    ...(result.points || []),
    result.statValue,
    result.statLabel,
    result.author,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);

  const missingClauses = splitIntoClauses(chunkText).filter(
    (clause) => !survivingFields.some((field) => isVerbatimSubstring(clause, field))
  );

  if (missingClauses.length > 0) {
    const appendix = missingClauses.join(' ');
    result.body = result.body ? `${result.body} ${appendix}` : appendix;
  }

  return result;
}
