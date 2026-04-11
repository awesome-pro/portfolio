"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { createClient } from "@/lib/supabase/client";

interface BlogEditorProps {
  initialContent?: string;
  onChange: (markdown: string) => void;
}

export default function BlogEditor({ initialContent = "", onChange }: BlogEditorProps) {
  const [value, setValue] = useState(initialContent);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(v: string) {
    setValue(v);
    onChange(v);
  }

  // Insert text at cursor position
  function insertAtCursor(before: string, after = "", placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const newValue =
      value.slice(0, start) + before + selected + after + value.slice(end);
    handleChange(newValue);
    // Restore cursor
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  // Upload image file → Supabase Storage → insert markdown
  const uploadImage = useCallback(async (file: File): Promise<void> => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `inline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file);

    if (error) {
      setUploading(false);
      alert("Upload failed: " + error.message);
      return;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    const alt = file.name.replace(/\.[^.]+$/, "");
    insertAtCursor("", "", `![${alt}](${data.publicUrl})`);
    setUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) await uploadImage(file);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) {
      e.preventDefault();
      await uploadImage(file);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab → 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  }

  function promptVideo() {
    const url = prompt("Paste a YouTube URL (e.g. https://www.youtube.com/watch?v=XXXXX):");
    if (!url) return;
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const id = match?.[1];
    if (!id) { alert("Couldn't extract video ID — paste the full YouTube URL."); return; }
    const embed = `\n<iframe width="100%" style="aspect-ratio:16/9" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>\n`;
    insertAtCursor(embed);
  }

  function promptLink() {
    const el = textareaRef.current;
    if (!el) return;
    const selected = value.slice(el.selectionStart, el.selectionEnd);
    const url = prompt("URL:");
    if (!url) return;
    insertAtCursor(`[${selected || "link text"}](`, ")", "");
  }

  const toolbar = [
    { label: "B",        title: "Bold",          action: () => insertAtCursor("**", "**", "bold text") },
    { label: "I",        title: "Italic",         action: () => insertAtCursor("_", "_", "italic text") },
    { label: "~~",       title: "Strikethrough",  action: () => insertAtCursor("~~", "~~", "text") },
    null, // divider
    { label: "H1",       title: "Heading 1",      action: () => insertAtCursor("\n# ", "", "Heading") },
    { label: "H2",       title: "Heading 2",      action: () => insertAtCursor("\n## ", "", "Heading") },
    { label: "H3",       title: "Heading 3",      action: () => insertAtCursor("\n### ", "", "Heading") },
    null,
    { label: "• List",   title: "Bullet list",    action: () => insertAtCursor("\n- ", "", "item") },
    { label: "1. List",  title: "Numbered list",  action: () => insertAtCursor("\n1. ", "", "item") },
    { label: "[ ]",      title: "Task list",      action: () => insertAtCursor("\n- [ ] ", "", "task") },
    null,
    { label: "</>",      title: "Inline code",    action: () => insertAtCursor("`", "`", "code") },
    { label: "```",      title: "Code block",     action: () => insertAtCursor("\n```\n", "\n```\n", "code here") },
    { label: "❝",        title: "Blockquote",     action: () => insertAtCursor("\n> ", "", "quote") },
    { label: "—",        title: "Horizontal rule",action: () => insertAtCursor("\n---\n") },
    null,
    { label: "Link",     title: "Link",           action: promptLink },
    { label: "Table",    title: "Table",          action: () => insertAtCursor("\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n") },
    { label: "Video",    title: "Embed YouTube",  action: promptVideo },
  ];

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-surface">
      {/* Tabs + toolbar */}
      <div className="flex items-center gap-0 border-b border-border bg-background">
        {/* Write / Preview tabs */}
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`px-4 h-10 text-xs font-mono border-r border-border transition-colors ${
            tab === "write"
              ? "text-ink bg-surface"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`px-4 h-10 text-xs font-mono border-r border-border transition-colors ${
            tab === "preview"
              ? "text-ink bg-surface"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Preview
        </button>

        {/* Toolbar — only shown in write mode */}
        {tab === "write" && (
          <div className="flex items-center gap-0.5 px-2 overflow-x-auto flex-1">
            {toolbar.map((item, i) =>
              item === null ? (
                <div key={i} className="w-px h-5 bg-border mx-1 shrink-0" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  title={item.title}
                  onClick={item.action}
                  className="h-7 min-w-[28px] px-1.5 rounded font-mono text-xs text-ink-muted hover:bg-surface hover:text-ink transition-colors shrink-0"
                >
                  {item.label}
                </button>
              )
            )}
            {uploading && (
              <span className="ml-2 font-mono text-xs text-ink-faint shrink-0">
                Uploading…
              </span>
            )}
          </div>
        )}

        {/* Image upload button (always visible) */}
        {tab === "write" && (
          <label
            title="Upload image"
            className="h-10 px-3 flex items-center font-mono text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer border-l border-border shrink-0"
          >
            ↑ Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {/* Write pane */}
      {tab === "write" && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[480px] p-6 text-sm font-mono text-ink leading-7 bg-surface resize-none focus:outline-none placeholder:text-ink-faint"
          placeholder={`Write your post in Markdown…\n\n# Heading\n\nParagraph text here.\n\n\`\`\`js\nconsole.log('hello');\n\`\`\`\n\nDrag & drop or paste images directly into this editor.`}
        />
      )}

      {/* Preview pane */}
      {tab === "preview" && (
        <div className="min-h-[480px] p-6">
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-ink mt-6 mb-3 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-ink mt-5 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-ink mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-7 text-ink-muted mb-3">{children}</p>,
                a: ({ href, children }) => <a href={href} className="text-primary underline underline-offset-2">{children}</a>,
                strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-ink-muted space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-ink-muted space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-6">{children}</li>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic text-ink-muted my-4">{children}</blockquote>,
                hr: () => <hr className="border-border my-6" />,
                img: ({ src, alt }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={alt ?? ""} className="rounded-xl border border-border my-4 max-w-full" />
                ),
                pre: ({ children }) => <pre className="bg-background border border-border rounded-xl p-4 my-4 overflow-x-auto text-xs">{children}</pre>,
                code: ({ className, children }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) return <code className={`font-mono text-ink-muted ${className ?? ""}`}>{children}</code>;
                  return <code className="font-mono text-xs bg-background border border-border rounded px-1.5 py-0.5 text-ink">{children}</code>;
                },
                table: ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse border border-border text-sm">{children}</table></div>,
                th: ({ children }) => <th className="border border-border px-3 py-1.5 text-left font-semibold text-ink">{children}</th>,
                td: ({ children }) => <td className="border border-border px-3 py-1.5 text-ink-muted">{children}</td>,
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-ink-faint font-mono text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Hint */}
      {tab === "write" && (
        <div className="px-6 py-2 border-t border-border bg-background">
          <p className="font-mono text-xs text-ink-faint">
            Drag & drop or paste images directly · Tab = 2 spaces · Supports full GitHub Flavored Markdown
          </p>
        </div>
      )}
    </div>
  );
}
