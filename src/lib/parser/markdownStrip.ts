/**
 * Content-preserving markdown syntax removal. Markdown syntax (`#`/`##`
 * heading markers, `**`/`__`/`*`/`_` emphasis, `- `/`1. ` list markers,
 * `---`/`***`/`___` horizontal rules, `> ` blockquote prefixes) is
 * structural formatting the user's authoring tool added on top of their
 * words — it is never itself a word the user wrote. This module strips
 * those markup *characters* while keeping every enclosed word intact, so
 * downstream verbatim-fidelity comparisons (verifyTextFidelity.ts) and
 * the model's own classification work against clean prose instead of
 * having to treat `##Heading` and `Heading` as two different texts, or
 * having to remember to strip syntax it was never asked to reproduce.
 *
 * This is deliberately not a full CommonMark parser — just the small,
 * well-defined subset of structural syntax real pasted briefs use (see
 * verbatimText.ts's own heading-split logic, which this mirrors).
 */

/** A standalone horizontal-rule line: three or more of the same `-`/`*`/`_`
 * character, optionally space-separated (`---`, `***`, `___`, `- - -`). */
const HR_LINE_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;

/** Leading heading marker: 1-6 `#` characters followed by required
 * whitespace (CommonMark requires the space; a stray `#hashtag` in body
 * text is left alone). */
const HEADING_PREFIX_RE = /^\s{0,3}#{1,6}\s+/;

/** Leading blockquote marker(s) — `> ` possibly repeated for nested quotes. */
const BLOCKQUOTE_PREFIX_RE = /^(?:\s{0,3}>\s?)+/;

/** Leading list-item marker: `-`/`*`/`+`/`•` bullets, or `1.`/`1)` ordered items. */
const LIST_PREFIX_RE = /^\s*(?:[-*+•]|\d+[.)])\s+/;

/** Is `line`, on its own, a horizontal-rule line? Exported so callers that
 * need to detect (not just strip) a standalone `---`/`***`/`___` line —
 * e.g. ruleBasedGenerator.ts's own per-line structural parser, which must
 * skip a rule line before it ever reaches its body-paragraph fallback —
 * share the exact same definition this module strips by. */
export function isHorizontalRuleLine(line: string): boolean {
  return HR_LINE_RE.test(line);
}

/**
 * Strip structural markdown syntax from `text`, keeping every enclosed
 * word. Line-level structure (headings, list markers, blockquotes,
 * horizontal rules) is stripped per line; inline emphasis markers are
 * stripped in one pass over the whole (already line-cleaned) result.
 * Whitespace left behind by a removed horizontal-rule line collapses to a
 * single blank line rather than leaving a visible gap.
 */
export function stripMarkdownSyntax(text: string): string {
  const lines = text.split(/\r\n|\r|\n/);
  const cleanedLines: string[] = [];

  for (const line of lines) {
    if (HR_LINE_RE.test(line)) {
      // Drop the rule itself but keep a blank line in its place so a
      // real paragraph break survives — the \n{3,} collapse below turns
      // any resulting run of blanks back into a single separator.
      cleanedLines.push('');
      continue;
    }

    let cleaned = line;
    cleaned = cleaned.replace(HEADING_PREFIX_RE, '');
    cleaned = cleaned.replace(BLOCKQUOTE_PREFIX_RE, '');
    cleaned = cleaned.replace(LIST_PREFIX_RE, '');
    cleanedLines.push(cleaned);
  }

  let result = cleanedLines.join('\n');

  // Inline emphasis: strip the marker pair, keep the enclosed text.
  // Double markers first, so "**bold**" never gets half-consumed by the
  // single-marker pass first. [^*\n]/[^_\n] keeps a match from
  // accidentally spanning a paragraph break.
  result = result
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1');

  // Collapse whatever run of blank lines a removed heading/rule left
  // behind down to a single blank-line paragraph break.
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
