"use client";

// The actual writing surface for an artifact's story.
//
// CodeMirror rather than a <textarea>: markdown is the storage format, and
// highlighting the structure (`##` sections, lists, links, fences) is what
// makes a long document navigable while you write it. Everything here is
// deliberately client-only — `MarkdownWriter` loads this module with
// `ssr: false`, so CodeMirror never runs on the server and never ships to the
// public artifact pages.

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  EditorSelection,
  EditorState,
  type Extension,
} from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  keymap,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import {
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
} from "@codemirror/search";
import { tags } from "@lezer/highlight";
import { MEDIA_ACCEPT, mediaMarkdown } from "@/lib/artifact-media";
import { uploadArtifactMedia } from "@/lib/artifact-upload";
import { insertMarkdown, runFormat, type FormatAction } from "./markdown-commands";

export interface MarkdownEditorHandle {
  format: (action: FormatAction) => void;
  insertText: (text: string) => void;
  focus: () => void;
  /** Opens the file picker; the picked file is uploaded and inserted. */
  pickFile: () => void;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onToggleFocus: () => void;
  onTogglePreview: () => void;
  /**
   * Escape handling, in priority order (preview, then focus mode). Returns
   * false when there was nothing to back out of, which lets CodeMirror fall
   * through to its own Escape behaviour.
   */
  onEscape: () => boolean;
  /** Brings the writing pane back — an upload must be visible where it landed. */
  onShowEditor: () => void;
  /** Reports upload progress so the writer can show one status line. */
  onUpload: (state: { name: string; percent: number } | null) => void;
  onError: (message: string) => void;
  /** Storage folder for uploads — the artifact's slug while it is being written. */
  group: string;
  placeholder?: string;
  /** False while the preview pane is showing; the view is kept alive, not unmounted. */
  visible: boolean;
  minHeight?: string;
  handleRef?: RefObject<MarkdownEditorHandle | null>;
  /** Fires once, when the editor can accept input. */
  onReady?: () => void;
}

/**
 * Markdown tokens mapped onto the artifact page's own reading typography, so
 * the thing being written already looks like the thing being published: serif
 * prose, `##` headings that read as headings, and the markup characters faded
 * back so the words carry the page.
 */
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, color: "var(--ink)", fontWeight: "600", fontSize: "1.5em" },
  { tag: tags.heading2, color: "var(--ink)", fontWeight: "600", fontSize: "1.4em" },
  { tag: tags.heading3, color: "var(--ink)", fontWeight: "600", fontSize: "1.18em" },
  { tag: tags.heading4, color: "var(--ink)", fontWeight: "600" },
  { tag: tags.heading5, color: "var(--ink)", fontWeight: "600" },
  { tag: tags.heading6, color: "var(--ink)", fontWeight: "600" },
  { tag: tags.strong, color: "var(--ink)", fontWeight: "600" },
  { tag: tags.emphasis, color: "var(--ink)", fontStyle: "italic" },
  {
    tag: tags.strikethrough,
    color: "var(--ink-faint)",
    textDecoration: "line-through",
  },
  {
    tag: tags.link,
    color: "var(--ink)",
    textDecoration: "underline",
    textDecorationColor: "var(--ink-faint)",
    textUnderlineOffset: "3px",
  },
  { tag: tags.url, color: "var(--ink-faint)" },
  {
    tag: tags.monospace,
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    fontSize: "0.88em",
  },
  { tag: tags.processingInstruction, color: "var(--ink-faint)" },
  { tag: tags.contentSeparator, color: "var(--ink-faint)" },
  { tag: tags.labelName, color: "var(--ink-faint)" },
  { tag: tags.list, color: "var(--ink-faint)" },
  { tag: tags.quote, color: "var(--ink-muted)", fontStyle: "italic" },
  { tag: tags.comment, color: "var(--ink-faint)", fontStyle: "italic" },
  { tag: tags.escape, color: "var(--ink-faint)" },
  { tag: tags.character, color: "var(--ink-faint)" },
  { tag: tags.atom, color: "var(--ink-faint)" },
  { tag: tags.invalid, color: "var(--destructive)" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--ink-muted)",
      fontSize: "1.0625rem",
      // The writer fills the page instead of being a box with its own scrollbar:
      // the document grows and the page scrolls, which is what makes a long
      // artifact feel like writing rather than typing into a form.
      minHeight: "var(--writer-min-height, 60vh)",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: "var(--font-reading), Georgia, serif",
      lineHeight: "1.8",
      overflow: "visible",
    },
    ".cm-content": { padding: "0", caretColor: "var(--ink)" },
    ".cm-line": { padding: "0" },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--ink)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "color-mix(in oklab, var(--ink) 14%, transparent)",
      },
    ".cm-placeholder": { color: "var(--ink-faint)" },
    ".cm-panels": {
      backgroundColor: "var(--surface)",
      color: "var(--ink)",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      fontSize: "12px",
    },
    ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--border)" },
    ".cm-textfield": {
      backgroundColor: "var(--background)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "4px 8px",
      color: "var(--ink)",
    },
    ".cm-button": {
      backgroundImage: "none",
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      color: "var(--ink)",
      padding: "3px 8px",
    },
    ".cm-searchMatch": {
      backgroundColor: "color-mix(in oklab, var(--ink) 12%, transparent)",
      outline: "1px solid var(--border)",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "color-mix(in oklab, var(--ink) 26%, transparent)",
    },
    ".cm-selectionMatch": {
      backgroundColor: "color-mix(in oklab, var(--ink) 8%, transparent)",
    },
  },
  { dark: false }
);

/** The first image or video carried by a paste or a drop, if there is one. */
function mediaFileFrom(data: DataTransfer | null): File | null {
  if (!data) return null;

  const isMedia = (type: string) =>
    type.startsWith("image/") || type.startsWith("video/");

  for (const file of Array.from(data.files ?? [])) {
    if (isMedia(file.type)) return file;
  }

  // A pasted screenshot often only shows up as an item, not in `files`.
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && isMedia(item.type)) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  return null;
}

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  onToggleFocus,
  onTogglePreview,
  onEscape,
  onShowEditor,
  onUpload,
  onError,
  group,
  placeholder,
  visible,
  minHeight,
  handleRef,
  onReady,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [dragging, setDragging] = useState(false);

  /** Set when something outside the editor asked for the caret. */
  const wantFocusRef = useRef(false);

  // Callbacks live in refs: the CodeMirror instance is built once, but it must
  // always call the latest props (the slug changes, saves re-render, …). This
  // effect is declared before the one that builds the editor, so on mount the
  // refs are already current when the editor reads its placeholder.
  const callbacks = useRef({
    onChange,
    onSave,
    onToggleFocus,
    onTogglePreview,
    onEscape,
    onShowEditor,
    onUpload,
    onError,
    group,
  });
  const valueRef = useRef(value);
  const visibleRef = useRef(visible);
  const placeholderRef = useRef(placeholder);
  const handleRefHolder = useRef(handleRef);
  const onReadyRef = useRef(onReady);

  // Declared before the effect that builds the editor, so on mount these refs
  // already hold the current props. Ref writes belong in an effect, not render.
  useEffect(() => {
    callbacks.current = {
      onChange,
      onSave,
      onToggleFocus,
      onTogglePreview,
      onEscape,
      onShowEditor,
      onUpload,
      onError,
      group,
    };
    valueRef.current = value;
    visibleRef.current = visible;
    placeholderRef.current = placeholder;
    handleRefHolder.current = handleRef;
    onReadyRef.current = onReady;
  });

  /** Assigned by the mount effect; lets the hidden <input> reuse the same path. */
  const uploadRef = useRef<(file: File) => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    async function handleFile(file: File) {
      const {
        onUpload: report,
        onError: fail,
        group: folder,
      } = callbacks.current;
      const name = file.name || "pasted media";
      report({ name, percent: 0 });

      try {
        const media = await uploadArtifactMedia(file, folder, (percent) =>
          report({ name, percent })
        );
        const view = viewRef.current;
        if (!view) return;
        // An upload has to be seen where it landed, so swap out of the preview
        // first. Focus is only requested, never taken: a hidden pane cannot hold
        // it until the writer has swapped back.
        if (!visibleRef.current) callbacks.current.onShowEditor();
        wantFocusRef.current = true;
        insertMarkdown(view, mediaMarkdown(media));
      } catch (error) {
        fail(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        report(null);
      }
    }

    uploadRef.current = (file: File) => void handleFile(file);

    const extensions: Extension[] = [
      history(),
      drawSelection(),
      EditorView.lineWrapping,
      EditorState.allowMultipleSelections.of(true),
      EditorState.tabSize.of(2),
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(markdownHighlight),
      highlightSelectionMatches(),
      search({ top: true }),
      placeholderExtension(placeholderRef.current ?? ""),
      EditorView.domEventHandlers({
        paste: (event) => {
          const file = mediaFileFrom(event.clipboardData);
          if (!file) return false;
          event.preventDefault();
          void handleFile(file);
          return true;
        },
        drop: (event) => {
          const file = mediaFileFrom(event.dataTransfer);
          if (!file) return false;
          event.preventDefault();
          setDragging(false);
          void handleFile(file);
          return true;
        },
        dragover: (event) => {
          if (!event.dataTransfer?.types?.includes("Files")) return false;
          event.preventDefault();
          setDragging(true);
          return true;
        },
        dragleave: (event, view) => {
          const next = event.relatedTarget as Node | null;
          if (!next || !view.dom.contains(next)) setDragging(false);
          return false;
        },
      }),
      // Mod-s / Mod-Shift-f / Mod-Shift-p also bubble to the writer's window
      // listener, so they mark the event handled to keep a save from firing twice.
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            callbacks.current.onSave();
            return true;
          },
        },
        {
          key: "Mod-Shift-f",
          preventDefault: true,
          run: () => {
            callbacks.current.onToggleFocus();
            return true;
          },
        },
        {
          key: "Mod-Shift-p",
          preventDefault: true,
          run: () => {
            callbacks.current.onTogglePreview();
            return true;
          },
        },
        {
          key: "Mod-b",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "bold");
            return true;
          },
        },
        {
          key: "Mod-i",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "italic");
            return true;
          },
        },
        {
          key: "Mod-e",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "code");
            return true;
          },
        },
        {
          key: "Mod-k",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "link");
            return true;
          },
        },
        {
          key: "Mod-Alt-1",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "heading2");
            return true;
          },
        },
        {
          key: "Mod-Alt-2",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "heading3");
            return true;
          },
        },
        {
          key: "Mod-Shift-8",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "bullet");
            return true;
          },
        },
        {
          key: "Mod-Shift-7",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "ordered");
            return true;
          },
        },
        {
          key: "Mod-Shift-.",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "quote");
            return true;
          },
        },
        {
          key: "Mod-Shift-c",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "fence");
            return true;
          },
        },
        {
          key: "Mod-Shift-m",
          preventDefault: true,
          run: (view) => {
            runFormat(view, "math");
            return true;
          },
        },
        // Ahead of defaultKeymap on purpose: CodeMirror binds Escape to
        // `simplifySelection`, which would swallow the key before focus mode
        // ever hears about it. Returning false hands it back.
        {
          key: "Escape",
          run: () => callbacks.current.onEscape(),
        },
        { key: "Mod-f", preventDefault: true, run: openSearchPanel },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      editorTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          callbacks.current.onChange(update.state.doc.toString());
        }
      }),
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: valueRef.current, extensions }),
      parent: host,
    });
    viewRef.current = view;

    const handle: MarkdownEditorHandle = {
      format: (action) => runFormat(view, action),
      insertText: (text) => {
        wantFocusRef.current = true;
        insertMarkdown(view, text);
      },
      focus: () => view.focus(),
      pickFile: () => fileInputRef.current?.click(),
    };

    const holder = handleRefHolder.current;
    if (holder) holder.current = handle;
    onReadyRef.current?.();

    return () => {
      if (holder) holder.current = null;
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // External value changes (the initial load, a reset) are pushed in; identical
  // values are skipped so typing never round-trips through the parent.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: EditorSelection.cursor(
        Math.min(view.state.selection.main.head, value.length)
      ),
    });
  }, [value]);

  // While the preview is showing this pane is `display: none`, so CodeMirror has
  // nothing to measure. Re-measure on the way back, then honour a pending caret.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !visible) return;
    view.requestMeasure();
    if (wantFocusRef.current) {
      wantFocusRef.current = false;
      view.focus();
    }
  }, [visible]);

  return (
    <div
      className="relative"
      style={{ "--writer-min-height": minHeight } as CSSProperties}
    >
      <div ref={hostRef} />
      <input
        ref={fileInputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadRef.current(file);
          event.target.value = "";
        }}
      />
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-dashed border-ink-muted bg-background/85">
          <span className="font-mono text-xs text-ink-muted">
            drop to upload and insert
          </span>
        </div>
      )}
    </div>
  );
}
