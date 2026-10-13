// Heading anchors for artifact stories.
//
// Two things have to agree on a section's id: the renderer that emits it as an
// `id` attribute (rehype-slug, in components/artifacts/ArtifactMarkdown.tsx)
// and the structured data that lists the page's sections as `hasPart`. A
// section list pointing at fragments the page never renders is worse than no
// section list at all — so `extractHeadings` walks the markdown with the same
// slugger, over the same headings, in the same document order.

import GithubSlugger from "github-slugger";

export interface Heading {
  /** 1–6, matching the markdown heading level. */
  depth: number;
  /** Heading text with inline markdown stripped — what the reader sees. */
  text: string;
  /** Fragment id, GitHub-style: lowercased, punctuation dropped, deduped. */
  id: string;
}

/** `**bold**`, `` `code` ``, `[label](url)` → the words a reader actually sees. */
function inlineText(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/\*\*|__|~~|\*|_/g, "")
    .trim();
}

const ATX_HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const SETEXT_UNDERLINE = /^ {0,3}(=+|-+)[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * The same headings, with the same ids, read straight out of the markdown.
 *
 * Fenced code is skipped (a `# comment` inside a shell snippet is not a
 * heading), Setext underlines are honoured, and every heading advances the
 * slugger whether or not it is kept — otherwise a document with two sections
 * called "results" would predict the wrong ids for everything after them.
 */
export function extractHeadings(
  markdown: string | null | undefined,
  { maxDepth = 6 }: { maxDepth?: number } = {}
): Heading[] {
  if (!markdown?.trim()) return [];

  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  let fence: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      // Only a matching fence character closes the block.
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const atx = ATX_HEADING.exec(line);
    if (atx) {
      const text = inlineText((atx[2] ?? "").replace(/[ \t]+#+[ \t]*$/, ""));
      if (text) {
        const id = slugger.slug(text);
        if (atx[1].length <= maxDepth) {
          headings.push({ depth: atx[1].length, text, id });
        }
      }
      continue;
    }

    // Setext: `title` underlined with `===` (h1) or `---` (h2). Markdown's own
    // rule is that the underline only counts directly beneath a paragraph line.
    const setext = SETEXT_UNDERLINE.exec(line);
    if (setext && index > 0) {
      const previous = lines[index - 1];
      const usable =
        previous.trim() &&
        !ATX_HEADING.test(previous) &&
        !FENCE.test(previous) &&
        !SETEXT_UNDERLINE.test(previous);
      if (usable) {
        const text = inlineText(previous.trim());
        if (text) {
          const depth = setext[1][0] === "=" ? 1 : 2;
          const id = slugger.slug(text);
          if (depth <= maxDepth) headings.push({ depth, text, id });
        }
      }
    }
  }

  return headings;
}
