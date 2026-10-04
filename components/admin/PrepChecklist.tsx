"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import InlineMarkdown from "@/components/admin/InlineMarkdown";
import type { PrepBlock } from "@/lib/prep-checklist";
import {
  addItem,
  deleteCustomItem,
  editItem,
  getChangesSnapshot,
  getItemsServerSnapshot,
  getItemsStateServerSnapshot,
  getItemsStateSnapshot,
  hideItem,
  resolveItems,
  restoreItem,
  subscribe as subscribeItems,
  CUSTOM_PREFIX,
  type ItemsState,
  type ResolvedItem,
} from "@/lib/prep-items-store";
import {
  clearAll,
  exportProgress,
  getServerSnapshot,
  getSnapshot,
  getSyncServerSnapshot,
  getSyncSnapshot,
  importProgress,
  subscribe,
  toggle,
  type SyncState,
} from "@/lib/prep-progress-store";

export interface PrepItemView {
  key: string;
  text: string;
}

export interface PrepSectionView {
  id: string;
  title: string;
  /** A module with no subheadings: render its items with no heading of their own. */
  implicit: boolean;
  /** Items and their explanations, in the order the file writes them. */
  blocks: PrepBlock[];
  items: PrepItemView[];
}

export interface PrepModuleView {
  id: string;
  title: string;
  prose: string[];
  sections: PrepSectionView[];
}

/** What the footer says about where the ticks currently live. */
const SYNC_NOTE: Record<SyncState, string> = {
  local: "checking…",
  syncing: "saving…",
  synced: "ticks synced — they survive clearing this browser and follow you to another",
  unavailable:
    "ticks are browser-only — run migrations/prep_progress.sql to sync them",
  offline: "offline — ticks are kept here and pushed on the next load",
};

const ITEMS_NOTE: Record<ItemsState, string> = {
  loading: "",
  ready: "",
  unavailable: "edits need migrations/prep_items.sql",
  offline: "edits are not reaching the server",
};

/**
 * The checklist: tickable, and editable in place.
 *
 * Editing is deliberately one text box — Enter saves, Escape cancels, clicking
 * away saves. Hiding is the same row carrying a flag, never a deletion, so a
 * stray click cannot destroy anything and the "hidden" toggle in the bar is
 * where things come back from. Only items you added yourself can be deleted
 * outright, because there is nothing underneath them to restore.
 */
export default function PrepChecklist({
  modules,
}: {
  modules: PrepModuleView[];
}) {
  const progress = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const sync = useSyncExternalStore(
    subscribe,
    getSyncSnapshot,
    getSyncServerSnapshot
  );
  const changes = useSyncExternalStore(
    subscribeItems,
    getChangesSnapshot,
    getItemsServerSnapshot
  );
  const itemsState = useSyncExternalStore(
    subscribeItems,
    getItemsStateSnapshot,
    getItemsStateServerSnapshot
  );

  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<{ key: string; draft: string } | null>(
    null
  );
  const [adding, setAdding] = useState<{
    sectionId: string;
    draft: string;
  } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** Escape must cancel, but it also blurs the input — which saves. */
  const cancelled = useRef(false);

  /**
   * Live item keys for a module: what the markdown supplied minus what has been
   * hidden, plus anything added here. Progress is measured against this, so
   * adding an item moves the denominator rather than silently inflating the
   * percentage.
   */
  function keysOf(module: PrepModuleView): string[] {
    const keys: string[] = [];
    const sectionIds = new Set<string>();

    for (const section of module.sections) {
      sectionIds.add(section.id);
      for (const item of section.items) {
        if (changes[item.key]?.deleted) continue;
        keys.push(item.key);
      }
    }
    for (const change of Object.values(changes)) {
      if (change.deleted) continue;
      if (!change.key.startsWith(CUSTOM_PREFIX)) continue;
      if (!sectionIds.has(change.sectionId)) continue;
      keys.push(change.key);
    }
    return keys;
  }

  const allKeys = modules.flatMap(keysOf);
  const doneCount = allKeys.filter((key) => progress[key]).length;
  const remaining = allKeys.length - doneCount;
  const percent = allKeys.length
    ? Math.round((doneCount / allKeys.length) * 100)
    : 0;

  const hiddenCount = Object.values(changes).filter(
    (change) => change.deleted
  ).length;
  const customCount = Object.keys(changes).filter((key) =>
    key.startsWith(CUSTOM_PREFIX)
  ).length;

  function sectionIdOf(key: string): string | null {
    // `module` is reserved in Next's bundler, so the loop variable is not.
    for (const item of modules) {
      for (const section of item.sections) {
        if (section.items.some((entry) => entry.key === key)) return section.id;
      }
    }
    return changes[key]?.sectionId ?? null;
  }

  function saveEdit() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    if (!editing) return;
    const text = editing.draft.trim();
    const sectionId = sectionIdOf(editing.key);
    if (text && sectionId) editItem(editing.key, sectionId, text);
    setEditing(null);
  }

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prep-progress.json";
    link.click();
    URL.revokeObjectURL(url);
    setNote("progress downloaded");
  }

  async function restore(file: File) {
    try {
      const count = importProgress(await file.text());
      setNote(`restored ${count} ticked items`);
    } catch {
      setNote("that file is not a prep-progress export");
    }
  }

  function renderRow(item: ResolvedItem, sectionId: string): ReactNode {
    const done = Boolean(progress[item.key]);

    if (editing?.key === item.key) {
      return (
        <li key={item.key} className="py-1">
          <input
            autoFocus
            value={editing.draft}
            onChange={(event) =>
              setEditing({ key: item.key, draft: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEdit();
              if (event.key === "Escape") {
                cancelled.current = true;
                setEditing(null);
              }
            }}
            onBlur={saveEdit}
            className="w-full rounded border border-ink-muted/60 bg-surface px-2 py-1 text-sm text-ink outline-none"
          />
        </li>
      );
    }

    return (
      <li key={item.key} className="group flex items-start gap-3">
        <label className="flex flex-1 cursor-pointer items-start gap-3 py-1.5">
          <input
            type="checkbox"
            checked={done}
            onChange={() => toggle(item.key)}
            className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-ink"
          />
          <span
            className={`text-sm leading-relaxed ${
              item.hidden
                ? "text-ink-faint/70 line-through"
                : done
                  ? "text-ink-faint line-through decoration-ink-faint/60"
                  : "text-ink-muted group-hover:text-ink"
            }`}
          >
            <InlineMarkdown text={item.text} />
          </span>
        </label>

        <span className="flex shrink-0 items-center gap-2 pt-2 font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {item.hidden ? (
            <button
              type="button"
              onClick={() => restoreItem(item.key, sectionId)}
              className="cursor-pointer text-ink-faint hover:text-ink"
            >
              restore
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing({ key: item.key, draft: item.text })}
                className="cursor-pointer text-ink-faint hover:text-ink"
              >
                edit
              </button>
              <button
                type="button"
                onClick={() =>
                  item.custom
                    ? deleteCustomItem(item.key)
                    : hideItem(item.key, sectionId)
                }
                className="cursor-pointer text-ink-faint hover:text-ink"
              >
                {item.custom ? "delete" : "hide"}
              </button>
            </>
          )}
        </span>
      </li>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {doneCount}/{allKeys.length}
          </span>
          <div className="h-1.5 min-w-[8rem] flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-ink transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {percent}%
          </span>
          <button
            type="button"
            onClick={() => setOnlyRemaining((value) => !value)}
            aria-pressed={onlyRemaining}
            className={`cursor-pointer font-mono text-xs transition-colors ${
              onlyRemaining ? "text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            remaining {remaining}
          </button>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden((value) => !value)}
              aria-pressed={showHidden}
              className={`cursor-pointer font-mono text-xs transition-colors ${
                showHidden ? "text-ink" : "text-ink-faint hover:text-ink"
              }`}
            >
              hidden {hiddenCount}
            </button>
          )}
        </div>
      </div>

      {modules.map((module) => {
        const moduleKeys = keysOf(module);
        const moduleDone = moduleKeys.filter((key) => progress[key]).length;
        const complete =
          moduleKeys.length > 0 && moduleDone === moduleKeys.length;
        const isCollapsed = collapsed[module.id];

        return (
          <section key={module.id} className="mt-10 border-t border-border pt-6">
            <button
              type="button"
              onClick={() =>
                setCollapsed((state) => ({
                  ...state,
                  [module.id]: !state[module.id],
                }))
              }
              aria-expanded={!isCollapsed}
              className="flex w-full cursor-pointer items-baseline justify-between gap-4 text-left"
            >
              <h2
                className={`text-lg font-semibold tracking-tight ${
                  complete ? "text-ink-faint" : "text-ink"
                }`}
              >
                <span aria-hidden className="mr-2 text-ink-faint">
                  {isCollapsed ? "+" : "−"}
                </span>
                {module.title}
              </h2>
              <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">
                {moduleDone}/{moduleKeys.length}
              </span>
            </button>

            {!isCollapsed && (
              <>
                {module.prose.map((paragraph, index) => (
                  <div
                    key={index}
                    className="mt-3 text-sm leading-relaxed text-ink-muted"
                  >
                    <InlineMarkdown text={paragraph} />
                  </div>
                ))}

                {module.sections.map((section) => {
                  const resolved = new Map(
                    resolveItems(section.id, section.items).map((item) => [
                      item.key,
                      item,
                    ])
                  );

                  /**
                   * Blocks in file order, with runs of consecutive items
                   * grouped into a list so the markup stays a real list even
                   * though prose can sit between items.
                   */
                  const rendered: ReactNode[] = [];
                  let run: ReactNode[] = [];

                  const flushRun = () => {
                    if (run.length === 0) return;
                    rendered.push(
                      <ul key={`run-${rendered.length}`}>{run}</ul>
                    );
                    run = [];
                  };

                  for (const [index, block] of section.blocks.entries()) {
                    if (block.kind === "prose") {
                      flushRun();
                      rendered.push(
                        <div
                          key={`prose-${index}`}
                          className="mt-2 border-l border-border pl-3 text-sm leading-relaxed text-ink-muted"
                        >
                          <InlineMarkdown text={block.text} />
                        </div>
                      );
                      continue;
                    }

                    const item = resolved.get(block.key);
                    if (!item) continue;
                    if (item.hidden && !showHidden) continue;
                    if (onlyRemaining && !item.hidden && progress[item.key]) {
                      continue;
                    }
                    run.push(renderRow(item, section.id));
                  }
                  flushRun();

                  return (
                    <div key={section.id} className="mt-6">
                      {!section.implicit && (
                        <h3 className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
                          {section.title}
                        </h3>
                      )}

                      <div className={section.implicit ? "" : "mt-3"}>
                        {rendered}
                      </div>

                      {adding?.sectionId === section.id ? (
                        <input
                          autoFocus
                          value={adding.draft}
                          placeholder="new item — Enter to add, Escape to cancel"
                          onChange={(event) =>
                            setAdding({
                              sectionId: section.id,
                              draft: event.target.value,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              const text = adding.draft.trim();
                              if (text) addItem(section.id, text);
                              setAdding(null);
                            }
                            if (event.key === "Escape") setAdding(null);
                          }}
                          onBlur={() => setAdding(null)}
                          className="mt-2 w-full rounded border border-ink-muted/60 bg-surface px-2 py-1 font-mono text-xs text-ink outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setAdding({ sectionId: section.id, draft: "" })
                          }
                          className="mt-2 cursor-pointer font-mono text-[10px] text-ink-faint transition-colors hover:text-ink"
                        >
                          + add item
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </section>
        );
      })}

      <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-6 font-mono text-xs">
        <button
          type="button"
          onClick={download}
          className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
        >
          backup
        </button>
        <label className="cursor-pointer text-ink-faint transition-colors hover:text-ink">
          restore
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restore(file);
              event.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Clear every tick, here and in the synced copy? This cannot be undone."
              )
            ) {
              clearAll();
              setNote("all ticks cleared");
            }
          }}
          className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
        >
          reset
        </button>
        <span className="text-ink-faint">
          {note ??
            [
              SYNC_NOTE[sync],
              ITEMS_NOTE[itemsState],
              customCount > 0 ? `${customCount} added by you` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
        </span>
      </div>
    </div>
  );
}
