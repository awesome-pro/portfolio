import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * A checklist item's label, rendered from markdown.
 *
 * Items are written as prose ("**MiniServe** — paged KV, `97%` prefill saved"),
 * so the emphasis and the code spans carry meaning and cannot be stripped. This
 * runs on the server and hands React nodes to the client checklist, which keeps
 * the markdown parser out of the browser bundle.
 *
 * No raw HTML: react-markdown escapes it, and the source is a file in this
 * repository anyway.
 */
export default function InlineMarkdown({
  text,
  block = false,
}: {
  text: string;
  /** True for page prose, false for a single item's label. */
  block?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) =>
          block ? (
            <p className="mb-2 last:mb-0">{children}</p>
          ) : (
            <>{children}</>
          ),
        strong: ({ children }) => (
          <strong className="font-medium text-ink">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-border/60 px-1 py-0.5 font-mono text-[0.8em] text-ink">
            {children}
          </code>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
