// Markdown editing commands for the artifact writer.
//
// These operate on a CodeMirror `EditorView` and dispatch a single transaction
// each, so every toolbar button and keyboard shortcut is one undo step. They
// write plain markdown — the same dialect `ArtifactMarkdown` renders — and
// never introduce raw HTML, which the renderer would strip.

import { EditorSelection, type SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export type FormatAction =
  | "heading2"
  | "heading3"
  | "bold"
  | "italic"
  | "code"
  | "link"
  | "quote"
  | "bullet"
  | "ordered"
  | "fence"
  | "math"
  | "table"
  | "divider";

export type BlockAction = Extract<
  FormatAction,
  "heading2" | "heading3" | "quote" | "bullet" | "ordered"
>;

/**
 * A single replacement. Spelled out rather than reusing CodeMirror's
 * `ChangeSpec`, which is a union that includes whole `ChangeSet`s and so cannot
 * be read field-by-field when mapping positions.
 */
interface TextChange {
  from: number;
  to: number;
  insert: string;
}

/** Leading block markers this writer knows how to replace or remove. */
const BLOCK_MARKER = /^([ \t]*)(#{1,6}[ \t]+|>[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+)/;

interface LineParts {
  indent: string;
  /** Existing marker including its trailing space, "" when the line is bare. */
  marker: string;
  rest: string;
}

function splitLine(text: string): LineParts {
  const match = BLOCK_MARKER.exec(text);
  if (!match) return { indent: "", marker: "", rest: text };
  return {
    indent: match[1],
    marker: match[2],
    rest: text.slice(match[0].length),
  };
}

function markerFor(kind: BlockAction, index: number): string {
  switch (kind) {
    case "heading2":
      return "## ";
    case "heading3":
      return "### ";
    case "quote":
      return "> ";
    case "bullet":
      return "- ";
    case "ordered":
      return `${index + 1}. `;
  }
}

function isSameKind(marker: string, kind: BlockAction): boolean {
  if (!marker) return false;
  switch (kind) {
    case "heading2":
      return /^##[ \t]+$/.test(marker);
    case "heading3":
      return /^###[ \t]+$/.test(marker);
    case "quote":
      return /^>[ \t]+$/.test(marker);
    case "bullet":
      return /^[-*+][ \t]+$/.test(marker);
    case "ordered":
      return /^\d+[.)][ \t]+$/.test(marker);
  }
}

/**
 * Shifts a document position through a list of non-overlapping changes, so the
 * caret stays where the author left it after a line's marker is rewritten.
 */
function mapPosition(position: number, changes: TextChange[]): number {
  let delta = 0;

  for (const change of changes) {
    const from = change.from;
    const to = change.to ?? change.from;
    const insert = typeof change.insert === "string" ? change.insert : "";
    const insertLength = insert.length;

    if (to <= position) {
      delta += insertLength - (to - from);
      continue;
    }
    if (from < position) {
      // The position sat inside the rewritten range (rare: only when the caret
      // was inside a marker) — park it at the end of the replacement.
      return from + delta + insertLength;
    }
    break;
  }

  return position + delta;
}

/** Wraps or unwraps each selection range with an inline marker (`**`, `*`, `` ` ``). */
function toggleInline(view: EditorView, marker: string, placeholder: string) {
  const { state } = view;
  const changes: TextChange[] = [];
  const ranges: SelectionRange[] = [];

  for (const range of state.selection.ranges) {
    const selected = state.sliceDoc(range.from, range.to);
    const before = state.sliceDoc(
      Math.max(0, range.from - marker.length),
      range.from
    );
    const after = state.sliceDoc(
      range.to,
      Math.min(state.doc.length, range.to + marker.length)
    );
    const wrapped = selected.length > 0 && before === marker && after === marker;

    if (wrapped) {
      changes.push(
        { from: range.from - marker.length, to: range.from, insert: "" },
        { from: range.to, to: range.to + marker.length, insert: "" }
      );
      ranges.push(
        EditorSelection.range(
          range.from - marker.length,
          range.to - marker.length
        )
      );
      continue;
    }

    const text = selected || placeholder;
    changes.push({
      from: range.from,
      to: range.to,
      insert: `${marker}${text}${marker}`,
    });
    ranges.push(
      EditorSelection.range(
        range.from + marker.length,
        range.from + marker.length + text.length
      )
    );
  }

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges, state.selection.mainIndex),
    userEvent: "input.format",
    scrollIntoView: true,
  });
}

function insertLink(view: EditorView) {
  const { state } = view;
  const changes: TextChange[] = [];
  const ranges: SelectionRange[] = [];

  for (const range of state.selection.ranges) {
    const selected = state.sliceDoc(range.from, range.to).trim();
    const looksLikeUrl = /^https?:\/\/\S+$/i.test(selected);

    if (looksLikeUrl) {
      const label = "label";
      changes.push({
        from: range.from,
        to: range.to,
        insert: `[${label}](${selected})`,
      });
      ranges.push(EditorSelection.range(range.from + 1, range.from + 1 + label.length));
      continue;
    }

    const label = selected || "label";
    const url = "url";
    const insert = `[${label}](${url})`;
    changes.push({ from: range.from, to: range.to, insert });
    const urlStart = range.from + 1 + label.length + 2;
    ranges.push(EditorSelection.range(urlStart, urlStart + url.length));
  }

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges, state.selection.mainIndex),
    userEvent: "input.format",
    scrollIntoView: true,
  });
}

/** Applies, replaces, or removes a block marker across the selected lines. */
function toggleBlock(view: EditorView, kind: BlockAction) {
  const { state } = view;

  // Markers are a per-line concern, so work from the distinct set of touched
  // lines. Overlapping selections (two carets on one line) then cost one change,
  // not two competing ones.
  const lineNumbers = new Set<number>();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(range.to).number;
    for (let number = first; number <= last; number += 1) {
      lineNumbers.add(number);
    }
  }

  const lines = [...lineNumbers]
    .sort((a, b) => a - b)
    .map((number) => state.doc.line(number));
  const parts = lines.map((line) => splitLine(line.text));

  // Every touched line already carrying this marker means the author is
  // toggling it off.
  const removing = parts.every((part) => isSameKind(part.marker, kind));

  const changes: TextChange[] = [];
  parts.forEach((part, index) => {
    const next = removing ? "" : markerFor(kind, index);
    if (part.marker === next) return;
    changes.push({
      from: lines[index].from,
      to: lines[index].from + part.indent.length + part.marker.length,
      insert: part.indent + next,
    });
  });

  if (changes.length === 0) return;

  const ranges = state.selection.ranges.map((range) =>
    EditorSelection.range(
      mapPosition(range.from, changes),
      mapPosition(range.to, changes)
    )
  );

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges, state.selection.mainIndex),
    userEvent: "input.format",
    scrollIntoView: true,
  });
}

/**
 * Inserts a block on its own lines, so media, rules, and tables never get glued
 * onto the end of a paragraph — markdown only recognises them as blocks when
 * they stand alone.
 */
function insertBlock(
  view: EditorView,
  text: string,
  selectionInBlock?: { from: number; to: number }
) {
  const { state } = view;

  view.dispatch(
    state.changeByRange((range) => {
      const before = state.sliceDoc(0, range.from);
      const after = state.sliceDoc(range.to, state.doc.length);
      const prefix =
        before === "" || /\n\s*\n$/.test(before)
          ? ""
          : before.endsWith("\n")
            ? "\n"
            : "\n\n";
      const suffix =
        after === "" || /^\s*\n\s*\n/.test(after)
          ? ""
          : after.startsWith("\n")
            ? "\n"
            : "\n\n";

      const start = range.from + prefix.length;
      const selection = selectionInBlock
        ? EditorSelection.range(
            start + selectionInBlock.from,
            start + selectionInBlock.to
          )
        : EditorSelection.cursor(start + text.length);

      return {
        changes: {
          from: range.from,
          to: range.to,
          insert: `${prefix}${text}${suffix}`,
        },
        range: selection,
      };
    })
  );
}

const TABLE_SKELETON = "| | |\n| --- | --- |\n| | |";

/** A fenced code block: wraps the selection, or opens an empty one. */
function insertFence(view: EditorView) {
  const { state } = view;
  const range = state.selection.main;

  if (range.empty) {
    const fence = "```\n\n```";
    // Park the caret on the blank body line, ready for the first line of code.
    insertBlock(view, fence, { from: 4, to: 4 });
    return;
  }

  const selected = state.sliceDoc(range.from, range.to);
  const block = `\`\`\`\n${selected}\n\`\`\``;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: block },
    selection: EditorSelection.range(
      range.from + 4,
      range.from + 4 + selected.length
    ),
    userEvent: "input.format",
    scrollIntoView: true,
  });
}

/**
 * Maths, the same way the code fence works: a selection becomes inline maths
 * (`$…$`), an empty selection opens a display block with the caret inside it.
 */
function insertMath(view: EditorView) {
  const { state } = view;
  const range = state.selection.main;

  if (range.empty) {
    // "$$\n\n$$" — the blank body line starts at index 3.
    insertBlock(view, "$$\n\n$$", { from: 3, to: 3 });
    return;
  }

  const selected = state.sliceDoc(range.from, range.to);
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `$${selected}$` },
    selection: EditorSelection.range(
      range.from + 1,
      range.from + 1 + selected.length
    ),
    userEvent: "input.format",
    scrollIntoView: true,
  });
}

export function runFormat(view: EditorView, action: FormatAction) {
  view.focus();

  switch (action) {
    case "bold":
      toggleInline(view, "**", "bold");
      return;
    case "italic":
      toggleInline(view, "*", "italic");
      return;
    case "code":
      toggleInline(view, "`", "code");
      return;
    case "link":
      insertLink(view);
      return;
    case "heading2":
    case "heading3":
    case "quote":
    case "bullet":
    case "ordered":
      toggleBlock(view, action);
      return;
    case "fence":
      insertFence(view);
      return;
    case "math":
      insertMath(view);
      return;
    case "table":
      // Caret lands in the first header cell.
      insertBlock(view, TABLE_SKELETON, { from: 2, to: 2 });
      return;
    case "divider":
      insertBlock(view, "---");
      return;
  }
}

/** Inserts arbitrary markdown (an uploaded image, a pasted clip) at the caret. */
export function insertMarkdown(view: EditorView, markdown: string) {
  insertBlock(view, markdown);
  view.dispatch({
    effects: EditorView.scrollIntoView(view.state.selection.main.head, {
      y: "center",
    }),
  });
  view.focus();
}
