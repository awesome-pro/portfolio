"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

export default function ArtifactMarkdown({ content }: { content?: string | null }) {
  if (!content?.trim()) return null;

  return (
    <div className="artifact-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-xl font-semibold text-ink mt-7 mb-3 first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-lg font-semibold text-ink mt-6 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-base font-semibold text-ink mt-5 mb-2 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base leading-7 text-ink-muted mb-4">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 text-ink-muted space-y-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 text-ink-muted space-y-1.5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-ink/30 bg-surface rounded-r-lg pl-4 pr-4 py-3 my-5 text-ink-muted">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-8" />,
          img: ({ src, alt }) => (
            // Markdown image syntax and raw <img> tags are both supported.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src ?? ""}
              alt={alt ?? ""}
              className="my-6 w-full rounded-lg border border-border bg-surface object-contain"
            />
          ),
          pre: ({ children }) => (
            <pre className="bg-surface border border-border rounded-lg p-5 my-6 overflow-x-auto text-sm leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => (
            <code className={`font-mono text-sm ${className ?? ""}`} {...props}>
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 text-ink-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
