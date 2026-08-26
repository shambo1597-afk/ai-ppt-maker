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
 *
 * Markdown-vs-content interpretation: the "nothing more, nothing less"
 * verbatim guarantee applies to the user's actual *words*, not to the
 * markup characters their authoring tool wrapped them in. A `#` heading
 * marker or `**` emphasis pair is formatting describing the user's
 * intended structure — it was never a word they wrote — so every
 * comparison in this file runs against `chunkText` with that markdown
 * syntax stripped (see markdownStrip.ts), never against the raw
 * markdown-laden source. Without this, a model that (correctly) returns
 * a clean headline with the `##` removed would fail the substring check
 * against the still-raw source, "fail" coverage, and have the entire raw
 * chunk — `#`/`**`/`---` included — appended to the slide as a visible
 * duplicate. This is a deliberate interpretation decision, not an
 * implementation detail: it means a field can never be flagged as
 * fabricated purely because the model stripped syntax it was correctly
 * asked to strip.
 */
import { AISlideItem } from '../../types/llm';
import { stripMarkdownSyntax } from './markdownStrip';

/** Collapse whitespace, lowercase, and drop markdown bold markers (`**`)
 * for comparison only — never for the output. A model reformatting line
 * breaks or re-casing a word it copied verbatim shouldn't fail the check,
 * and neither should ruleBasedGenerator.ts's own markdown-bold-stripping
 * (parseSectionContent strips `**` from body/points text before it ever
 * reaches here, which can otherwise break substring containment for text
 * like "b**old** text" -> "bold text"); actually adding, removing, or
 * reordering a word will still fail it, since that changes the
 * surrounding substring match.
 *
 * Also strips a *leading* quote/dash wrapper (`"`/`“`/`'`/`—`/`-`) and a
 * *trailing* quote wrapper for comparison only, same reasoning: both
 * generation paths deliberately drop these when they extract a quote
 * ("The future..." -> headline: "The future...", no wrapping quote
 * marks) or an author attribution ("— Jane Doe" -> author: "Jane Doe",
 * no leading dash) — an established extraction convention, not content
 * going missing. Without this, the coverage check in
 * verifySlideTextFidelity() below would see the source clause's wrapping
 * punctuation as "not found" in the field that correctly omitted it, and
 * re-append the clause to body as a visible duplicate of what's already
 * showing (correctly, unwrapped) in the headline/author field. Anchored
 * to the start/end of the whole compared string, never mid-string, so a
 * real hyphen or quote elsewhere in the text is untouched. */
function normalize(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .trim()
    .replace(/^[-–—"“”'‘’]+\s*/, '')
    .replace(/\s*["“”'‘’]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
  // Strip once, here, and compare everything below against this cleaned
  // text — never the raw markdown-laden original (see the class comment
  // above). Idempotent if the chunk already arrived pre-stripped (see
  // client.ts/ruleBasedGenerator.ts, which strip before the model/
  // heuristic ever sees a chunk), so it's always safe to strip again here
  // as the single source of truth this function actually verifies against.
  const cleanChunkText = stripMarkdownSyntax(chunkText);

  const result: AISlideItem = { ...slide };
  const dropped: DroppedField[] = [];

  for (const key of TEXT_FIELD_KEYS) {
    const value = result[key as TextFieldKey] as string | undefined;
    if (typeof value === 'string' && value && !isVerbatimSubstring(value, cleanChunkText)) {
      dropped.push({ field: key, value });
      (result as any)[key] = undefined;
    }
  }

  if (Array.isArray(result.points)) {
    const keptPoints: string[] = [];
    result.points.forEach((point, idx) => {
      if (typeof point === 'string' && isVerbatimSubstring(point, cleanChunkText)) {
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

  const missingClauses = splitIntoClauses(cleanChunkText).filter(
    (clause) => !survivingFields.some((field) => isVerbatimSubstring(clause, field))
  );

  if (missingClauses.length > 0) {
    // This is the last-resort safety net, not the normal path — it
    // firing means the classifier (model or rule-based heuristic) left
    // some of the chunk's own real content unclaimed by any field, most
    // often because a chunk merged multiple sections' worth of text (see
    // buildSlideChunks()'s overflow-merge) and the classifier could only
    // pull one section's worth out of it. Logged so this is observable
    // during testing instead of silently succeeding (content quietly
    // ends up in body, out of its intended field) or, if this branch
    // were ever skipped, silently failing (content vanishing with no
    // trace at all).
    console.warn(
      `[verifySlideTextFidelity] Coverage safety net fired: ${missingClauses.length} clause(s) from the source chunk weren't claimed by any field and were appended to body verbatim: ` +
        missingClauses.map((c) => `"${c}"`).join(' | ')
    );
    const appendix = missingClauses.join(' ');
    result.body = result.body ? `${result.body} ${appendix}` : appendix;
  }

  return result;
}
