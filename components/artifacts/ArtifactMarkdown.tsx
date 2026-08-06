"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (typeof node === "object" && "props" in node) {
    return getNodeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);

  const codeElement = Array.isArray(children) ? children[0] : children;
  const className =
    (codeElement as { props?: { className?: string } })?.props?.className ?? "";
  const language = /language-(\w+)/.exec(className)?.[1] ?? "text";
  const codeText = getNodeText(children).replace(/\n$/, "");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the code is still selectable by hand.
    }
  }

  return (
    <div className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="font-mono text-[11px] text-ink-faint hover:text-ink transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export default function ArtifactMarkdown({ content }: { content?: string | null }) {
  if (!content?.trim()) return null;

  return (
    <div className="artifact-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-2xl font-semibold text-ink mt-12 mb-4 leading-snug first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-ink mt-12 mb-4 leading-snug first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-ink mt-9 mb-3 leading-snug first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <p className="font-mono text-xs uppercase tracking-wider text-ink-faint mt-7 mb-2">
              {children}
            </p>
          ),
          p: ({ children }) => (
            <p className="text-[1.0625rem] leading-[1.8] text-ink-muted mb-6">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-ink underline decoration-ink-faint underline-offset-4 hover:decoration-ink transition-colors"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-6 text-ink-muted space-y-2.5 marker:text-ink-faint">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-6 text-ink-muted space-y-2.5 marker:text-ink-faint marker:font-mono marker:text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[1.0625rem] leading-[1.75] pl-1.5">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-ink/20 pl-5 my-7 text-ink italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-12" />,
          img: ({ src, alt }) => (
            // Markdown image syntax renders as a plain <img>: src/alt are dynamic
            // strings from arbitrary content, which next/image can't size ahead of time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src ?? ""}
              alt={alt ?? ""}
              className="my-8 w-full rounded-xl border border-border bg-surface object-contain"
            />
          ),
          pre: CodeBlock,
          code: ({ className, children, ...props }) => (
            <code className={`font-mono text-[0.875em] ${className ?? ""}`} {...props}>
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-8 rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-surface px-4 py-2.5 text-left font-semibold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-4 py-2.5 text-ink-muted">
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
