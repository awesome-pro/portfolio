// Mathematics configuration, shared by every place LaTeX can appear.
//
// The artifact renderer (`components/artifacts/ArtifactMarkdown.tsx`) and the
// prep renderer (`components/admin/InlineMarkdown.tsx`) both run KaTeX, and a
// formula has to mean the same thing in both — the same delimiters, the same
// macros, the same escape hatch. One module, one answer.
//
// KaTeX rather than MathJax: already a dependency, renders to static HTML at
// render time (the typeset equation is in the server response, no client-side
// pass and no layout shift), and emits MathML alongside the visual markup —
// which is what an answer engine or a screen reader can actually read. KaTeX
// covers what this site needs: sums, products, expectations, `aligned`,
// `cases`, matrices, `\mathbb`, `\operatorname`, `\tag`. It does not do
// `\label`/`\ref` cross-references, `\usepackage`, or chemistry; MathJax is the
// upgrade path and this file is the only thing that would change.

/**
 * Delimiters follow the usual convention, deliberately:
 *
 *   inline   `$x$`      — flows with the sentence
 *   display  `$$` on its own lines, content between, `$$` on its own line
 *
 * The obvious-looking alternative — `$$…$$` for both — is broken, and this is
 * worth knowing before anyone "simplifies" it back: with `$$` used for inline
 * maths as well as fences, micromark pairs an inline `$$` with the next fence
 * and swallows everything between them, document-wide. A paragraph ending in
 * `$$E = mc^2$$` followed by a display block renders the rest of the article as
 * one KaTeX error. Separate delimiters keep the pairing unambiguous.
 *
 * Single dollars are only usable because of `guardCurrency` below.
 */
export const REMARK_MATH_OPTIONS = { singleDollarTextMath: true } as const;

/**
 * Macros for this domain, so notation stays consistent across artifacts.
 * Documented in AGENTS.md, because an agent writing an artifact has to know
 * they exist.
 */
export const KATEX_MACROS: Record<string, string> = {
  "\\E": "\\mathbb{E}",
  "\\R": "\\mathbb{R}",
  "\\KL": "\\mathrm{KL}",
  "\\Var": "\\mathrm{Var}",
  "\\Cov": "\\mathrm{Cov}",
};

export const KATEX_OPTIONS = {
  /**
   * A typo in a formula must not take the page down. Artifact pages are
   * statically rendered: with KaTeX's default `throwOnError`, one unbalanced
   * brace would fail the build or 500 the route. Instead the offending source
   * is printed in red, in place, so the author sees exactly what KaTeX choked
   * on — in the writer's preview, as they type it.
   */
  throwOnError: false,
  errorColor: "#cc0000",
  /** Tolerate unicode and other non-strict input inside maths. */
  strict: false,
  macros: KATEX_MACROS,
} as const;

/**
 * Escapes the dollars that are money, so the dollars that are maths still work.
 *
 * This site prices things — "cost ($/1M in, $/1M out)", "$0.15 per million",
 * "$5–$9" — and a single-dollar inline rule would type­set every one of those
 * as a formula. Rather than asking authors (or the agents writing artifacts) to
 * remember `\$`, the renderer protects the three shapes money actually takes:
 *
 *   $ followed by a digit   $5, $0.15
 *   $ followed by a slash   $/1M
 *
 * Everything else is left as a maths delimiter. `$$` fences are never touched,
 * so display maths is unaffected. Forcing a literal dollar by hand still works:
 * `\$` is passed through untouched.
 *
 * Deliberately absent: "$ preceded by a digit" (the "5$" style of writing a
 * price). `$b = 32$` ends with a digit followed by a delimiter, so that rule
 * silently escaped the closing delimiter of an ordinary equation and turned the
 * sentence after it into a KaTeX error. Trailing-currency notation is rare here;
 * equations are not.
 */
export function guardCurrency(markdown: string): string {
  if (!markdown.includes("$")) return markdown;

  let out = "";
  for (let index = 0; index < markdown.length; index += 1) {
    const char = markdown[index];
    if (char !== "$") {
      out += char;
      continue;
    }

    const previous = markdown[index - 1];
    const next = markdown[index + 1];

    // Part of a `$$` fence, or already escaped.
    if (next === "$" || previous === "$" || previous === "\\") {
      out += char;
      continue;
    }

    const money = next !== undefined && (next === "/" || /\d/.test(next));
    out += money ? "\\$" : char;
  }

  return out;
}

/**
 * True when the display fences do not pair up.
 *
 * An unpaired `$$` is the one maths mistake that damages the whole page: the
 * parser keeps consuming until it finds a closing fence, so everything after it
 * — headings, tables, paragraphs — renders inside a single error span. The
 * writer surfaces this while the author is still typing.
 */
export function hasUnpairedDisplayMath(markdown: string | null | undefined): boolean {
  if (!markdown?.includes("$$")) return false;
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  return (withoutCode.match(/\$\$/g)?.length ?? 0) % 2 === 1;
}

/** What AGENTS.md and the writer tell an author to type. */
export const MATH_SYNTAX_HINT = "$…$ inline · $$ on its own line for a display equation";
