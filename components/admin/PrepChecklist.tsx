"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  clearAll,
  exportProgress,
  getServerSnapshot,
  getSnapshot,
  importProgress,
  subscribe,
  toggle,
} from "@/lib/prep-progress-store";

export interface PrepItemView {
  key: string;
  label: ReactNode;
}

export interface PrepSectionView {
  id: string;
  title: string;
  /** A module with no subheadings: render its items with no heading of their own. */
  implicit: boolean;
  prose: ReactNode[];
  items: PrepItemView[];
}

export interface PrepModuleView {
  id: string;
  title: string;
  prose: ReactNode[];
  sections: PrepSectionView[];
}

function keysOf(module: PrepModuleView): string[] {
  return module.sections.flatMap((section) =>
    section.items.map((item) => item.key)
  );
}

/**
 * The whole checklist, tickable.
 *
 * Ticking is local and instant — there is no save button and no request, and
 * the browser holds the state. "Remaining" hides what is done, which is the
 * only view that matters a week before a loop; collapsing a module is how you
 * ignore the other eighteen while you work through one.
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
  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const allKeys = modules.flatMap(keysOf);
  const doneCount = allKeys.filter((key) => progress[key]).length;
  const remaining = allKeys.length - doneCount;
  const percent = allKeys.length
    ? Math.round((doneCount / allKeys.length) * 100)
    : 0;

  function backup() {
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
        </div>
      </div>

      {modules.map((module) => {
        const moduleKeys = keysOf(module);
        const moduleDone = moduleKeys.filter((key) => progress[key]).length;
        const complete = moduleKeys.length > 0 && moduleDone === moduleKeys.length;
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
                {module.prose.length > 0 && (
                  <div className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {module.prose}
                  </div>
                )}

                {module.sections.map((section) => {
                  const visible = section.items.filter(
                    (item) => !onlyRemaining || !progress[item.key]
                  );
                  if (visible.length === 0) return null;

                  return (
                    <div key={section.id} className="mt-6">
                      {!section.implicit && (
                        <h3 className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
                          {section.title}
                        </h3>
                      )}
                      {section.prose.length > 0 && (
                        <div className="mt-2 text-sm leading-relaxed text-ink-muted">
                          {section.prose}
                        </div>
                      )}
                      <ul className={section.implicit ? "" : "mt-3"}>
                        {visible.map((item) => {
                          const done = Boolean(progress[item.key]);
                          return (
                            <li key={item.key}>
                              <label className="group flex cursor-pointer items-start gap-3 py-1.5">
                                <input
                                  type="checkbox"
                                  checked={done}
                                  onChange={() => toggle(item.key)}
                                  className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-ink"
                                />
                                <span
                                  className={`text-sm leading-relaxed ${
                                    done
                                      ? "text-ink-faint line-through decoration-ink-faint/60"
                                      : "text-ink-muted group-hover:text-ink"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
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
          onClick={backup}
          className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
        >
          backup
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
        >
          restore
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void restore(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear every tick? This cannot be undone.")) {
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
            "ticks are stored in this browser only — back up if you switch machines"}
        </span>
      </div>
    </div>
  );
}
