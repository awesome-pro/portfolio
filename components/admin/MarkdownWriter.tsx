"use client";

// The story field's writing experience.
//
// Three things make a long artifact writable, and they are all here:
//   * a document-shaped surface that grows with the text instead of a fixed box,
//   * focus mode — the whole viewport, chrome hidden, one comfortable measure,
//   * a preview that renders through `ArtifactMarkdown`, the exact component the
//     public artifact page uses, so what you see is what ships.
//
// The DOM shape never changes between modes — only class names do. That is
// deliberate: remounting the pane would throw away the CodeMirror instance,
// and with it the caret and the undo history.

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  PenLine,
  Quote,
  Save,
  Sigma,
  SquareCode,
  Table,
  type LucideIcon,
} from "lucide-react";
import ArtifactMarkdown from "@/components/artifacts/ArtifactMarkdown";
import { hasUnpairedDisplayMath } from "@/lib/math";
import type { MarkdownEditorHandle } from "./MarkdownEditor";
import type { FormatAction } from "./markdown-commands";

// CodeMirror is a browser-only dependency and this is the only place that needs
// it, so it is loaded on the client after hydration and code-split away from
// the rest of the admin bundle.
const MarkdownEditor = dynamic(() => import("./MarkdownEditor"), {
  ssr: false,
  loading: () => (
    <p className="font-mono text-xs text-ink-faint" style={{ minHeight: "40vh" }}>
      loading editor…
    </p>
  ),
});

export interface MarkdownWriterHandle {
  /** Inserts markdown at the caret — used by "insert into story" on media. */
  insertMarkdown: (markdown: string) => void;
}

export interface MarkdownWriterProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  /** Upload folder — the artifact's slug, or "draft" before it has one. */
  group: string;
  /** Shown in the focus bar so you know which artifact you are inside. */
  title?: string;
  handleRef?: RefObject<MarkdownWriterHandle | null>;
}

const PLACEHOLDER = `Write it as one continuous piece — ## headings, lists, tables, and \`\`\`fenced code\`\`\` all render where they land.

Maths is LaTeX: $$x_t$$ flows with the sentence, and $$ on its own line makes a display equation.

$$
\mathcal{L}(\theta) = \E_{x \sim \mathcal{D}}\left[ \KL(p \,\|\, q) \right]
$$

Paste or drop an image or video anywhere in here and it uploads and inserts itself. A YouTube link alone on its own line becomes an embedded player.`;

const HINTS =
  "⌘B bold · ⌘I italic · ⌘E code · ⌘K link · ⌘S save · ⌘F find · ⌘⇧F focus · ⌘⇧P preview · ⌘⇧M maths · ⏎ continues lists · paste or drop media to upload";

/** Shown when a `$$` fence has no partner, which costs the rest of the page. */
const MATH_WARNING = "unpaired $$ — close the display equation";

interface Tool {
  action: FormatAction;
  hint: string;
  Icon: LucideIcon;
}

const TOOL_GROUPS: Tool[][] = [
  [
    { action: "heading2", hint: "Section heading (⌘⌥1)", Icon: Heading2 },
    { action: "heading3", hint: "Sub-heading (⌘⌥2)", Icon: Heading3 },
  ],
  [
    { action: "bold", hint: "Bold (⌘B)", Icon: Bold },
    { action: "italic", hint: "Italic (⌘I)", Icon: Italic },
    { action: "code", hint: "Inline code (⌘E)", Icon: Code },
    { action: "link", hint: "Link (⌘K)", Icon: Link2 },
  ],
  [
    { action: "bullet", hint: "Bullet list (⌘⇧8)", Icon: List },
    { action: "ordered", hint: "Numbered list (⌘⇧7)", Icon: ListOrdered },
    { action: "quote", hint: "Quote (⌘⇧.)", Icon: Quote },
  ],
  [
    { action: "fence", hint: "Code block (⌘⇧C)", Icon: SquareCode },
    { action: "math", hint: "Display equation (⌘⇧M), or wrap the selection as inline maths", Icon: Sigma },
    { action: "table", hint: "Table", Icon: Table },
    { action: "divider", hint: "Divider", Icon: Minus },
  ],
];

const BUTTON =
  "flex items-center gap-1.5 rounded-lg px-2 py-2 font-mono text-[11px] text-ink-muted transition-colors hover:bg-border/40 hover:text-ink";

const ICON_BUTTON = `${BUTTON} disabled:pointer-events-none disabled:opacity-40`;

/** Toolbar clicks must not take focus, or the caret leaves the document. */
function keepFocus(event: React.MouseEvent) {
  event.preventDefault();
}

function ToolButton({
  tool,
  disabled,
  onRun,
}: {
  tool: Tool;
  disabled: boolean;
  onRun: (action: FormatAction) => void;
}) {
  return (
    <button
      type="button"
      title={tool.hint}
      aria-label={tool.hint}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={() => onRun(tool.action)}
      className={ICON_BUTTON}
    >
      <tool.Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}

function ModeButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={keepFocus}
      aria-pressed={active}
      title={label}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
        active ? "bg-ink text-background" : "text-ink-muted hover:text-ink"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}

export default function MarkdownWriter({
  value,
  onChange,
  onSave,
  saving,
  dirty,
  group,
  title,
  handleRef,
}: MarkdownWriterProps) {
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState(false);
  const [upload, setUpload] = useState<{ name: string; percent: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  /** Inserts that arrived before CodeMirror finished loading. */
  const pendingRef = useRef<string[]>([]);

  // Latest values, for the single window listener and the single mount effect.
  // Synced in an effect rather than during render: refs are not render state.
  const previewRef = useRef(preview);
  const focusedRef = useRef(focused);
  const saveRef = useRef(onSave);
  const handleRefHolder = useRef(handleRef);

  useEffect(() => {
    previewRef.current = preview;
    focusedRef.current = focused;
    saveRef.current = onSave;
    handleRefHolder.current = handleRef;
  });

  function toggleFocus() {
    setFocused((current) => !current);
  }

  function togglePreview() {
    setPreview((current) => !current);
  }

  /**
   * Escape backs out one level: preview first, then focus mode. Returns whether
   * anything was closed, so the caller can decide what to do with the key.
   */
  function handleEscape(): boolean {
    if (previewRef.current) {
      setPreview(false);
      return true;
    }
    if (focusedRef.current) {
      setFocused(false);
      return true;
    }
    return false;
  }

  function showEditor() {
    setPreview(false);
  }

  function handleUpload(state: { name: string; percent: number } | null) {
    setUpload(state);
    if (state) setError(null);
  }

  function handleFormat(action: FormatAction) {
    editorRef.current?.format(action);
  }

  /** The editor mounts asynchronously; flush anything that queued up. */
  function handleReady() {
    const pending = pendingRef.current;
    pendingRef.current = [];
    for (const markdown of pending) {
      editorRef.current?.insertText(markdown);
    }
  }

  useEffect(() => {
    const holder = handleRefHolder.current;
    if (!holder) return;
    holder.current = {
      insertMarkdown: (markdown) => {
        const editor = editorRef.current;
        if (!editor) {
          pendingRef.current.push(markdown);
          return;
        }
        // Show the insertion rather than leaving the author in the preview
        // wondering whether the click did anything.
        setPreview(false);
        editor.insertText(markdown);
      },
    };
    return () => {
      holder.current = null;
    };
  }, []);

  // Focus mode owns the viewport: the page behind it stops scrolling, and the
  // caret goes back into the document.
  useEffect(() => {
    if (!focused) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let frame = 0;
    if (!previewRef.current) {
      frame = requestAnimationFrame(() => editorRef.current?.focus());
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [focused]);

  // The mode shortcuts work wherever the caret is on the page. Events that
  // started inside the editor belong to its keymap, and anything it already
  // handled is left alone, so a save never fires twice.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;

      const target = event.target as Node | null;
      const fromEditor = !!target && "closest" in target && !!(target as Element).closest?.(".cm-editor");
      if (fromEditor) return;

      if (event.key === "Escape") {
        handleEscape();
        return;
      }

      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();

      if (event.shiftKey && key === "f") {
        event.preventDefault();
        setFocused((current) => !current);
        return;
      }
      if (event.shiftKey && key === "p") {
        event.preventDefault();
        setPreview((current) => !current);
        return;
      }
      if (!event.shiftKey && key === "s") {
        event.preventDefault();
        saveRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const hasContent = value.trim().length > 0;
  const unpairedMath = hasUnpairedDisplayMath(value);

  return (
    <div
      className={`flex flex-col bg-elevated ${
        focused
          ? "fixed inset-0 z-50"
          : "overflow-hidden rounded-2xl border border-border"
      }`}
    >
      {/* Toolbar — also the focus-mode header. Sits on the chrome tone so the
          writing canvas below it reads as a distinct surface. */}
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border bg-chrome px-2 py-1.5">
        <span
          className={`truncate px-1 font-mono text-[11px] text-ink-muted ${
            focused ? "mr-1 max-w-[26ch]" : "hidden"
          }`}
        >
          {title?.trim() || "untitled artifact"}
        </span>

        {TOOL_GROUPS.map((tools, index) => (
          <Fragment key={tools[0].action}>
            {index > 0 && <span className="mx-1 h-4 w-px bg-border" />}
            {tools.map((tool) => (
              <ToolButton
                key={tool.action}
                tool={tool}
                disabled={preview}
                onRun={handleFormat}
              />
            ))}
          </Fragment>
        ))}

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => editorRef.current?.pickFile()}
          title="Upload an image or video and insert it at the caret"
          className={BUTTON}
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">media</span>
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-1 pl-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            <ModeButton
              active={!preview}
              label="write"
              Icon={PenLine}
              onClick={() => setPreview(false)}
            />
            <ModeButton
              active={preview}
              label="preview"
              Icon={Eye}
              onClick={() => setPreview(true)}
            />
          </div>

          <button
            type="button"
            onMouseDown={keepFocus}
            onClick={toggleFocus}
            title={focused ? "Leave focus mode (esc)" : "Focus mode (⌘⇧F)"}
            className={BUTTON}
          >
            {focused ? (
              <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
            )}
            <span className="hidden sm:inline">
              {focused ? "exit focus" : "focus"}
            </span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            title="Save artifact (⌘S)"
            className={`${BUTTON} text-ink disabled:opacity-50 ${
              focused ? "" : "hidden"
            }`}
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.75} />
            )}
            save
            {dirty && !saving && (
              <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
            )}
          </button>
        </div>
      </div>

      {/* The document. Inline it is a block in the form; focused it is the
          scroller for the whole viewport. */}
      <div className={focused ? "flex-1 overflow-y-auto" : ""}>
        <div
          className={`mx-auto w-full max-w-3xl px-6 ${focused ? "py-10" : "py-6"}`}
        >
          <div className={preview ? "hidden" : "block"}>
            <MarkdownEditor
              value={value}
              onChange={onChange}
              onSave={onSave}
              onToggleFocus={toggleFocus}
              onTogglePreview={togglePreview}
              onEscape={handleEscape}
              onShowEditor={showEditor}
              onUpload={handleUpload}
              onError={setError}
              onReady={handleReady}
              group={group}
              placeholder={PLACEHOLDER}
              visible={!preview}
              minHeight={focused ? "calc(100vh - 9rem)" : "60vh"}
              handleRef={editorRef}
            />
          </div>

          {/* The page's own tone, not the canvas: the preview shows the
              published hierarchy, where panels lift off the page. */}
          <div
            className={preview ? "block bg-background" : "hidden bg-background"}
          >
            <p className="mb-8 font-mono text-[11px] text-ink-faint">
              story only — rendered by the same component as the public page
            </p>
            {hasContent ? (
              <ArtifactMarkdown content={value} />
            ) : (
              <p className="font-mono text-xs text-ink-faint">
                nothing to preview yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status line: shortcuts on the left, whatever is happening on the right. */}
      <div className="flex shrink-0 items-center gap-4 border-t border-border bg-chrome px-3 py-1.5">
        <p className="truncate font-mono text-[11px] text-ink-faint">{HINTS}</p>
        <p className="ml-auto shrink-0 font-mono text-[11px]">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : upload ? (
            <span className="text-ink-muted">
              uploading {upload.name} — {upload.percent}%
            </span>
          ) : unpairedMath ? (
            <span className="text-destructive">{MATH_WARNING}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
