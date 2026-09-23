"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "view";

type View = "human" | "agent";

/**
 * Switches the site between the default human view and a raw, agent-first one.
 *
 * The chosen view lives outside React: the pre-paint script in app/layout.tsx
 * writes it to `<html data-view>` before hydration and globals.css styles from
 * that attribute, so the active option is correct on the very first paint with
 * no flash. React only mirrors that attribute here — for `aria-pressed` — which
 * is why this is an external store rather than component state.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): View {
  return document.documentElement.dataset.view === "agent" ? "agent" : "human";
}

/** Matches the markup the server renders, so hydration is not a mismatch. */
function getServerSnapshot(): View {
  return "human";
}

function chooseView(next: View) {
  document.documentElement.dataset.view = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be unavailable (private mode, blocked storage). The choice
    // still applies for this page view.
  }
  for (const listener of listeners) listener();
}

export default function ViewToggle() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="group"
      aria-label="Reading view"
      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase"
    >
      {(["human", "agent"] as const).map((option, index) => (
        <span key={option} className="flex items-center gap-1.5">
          {index > 0 && (
            <span aria-hidden className="text-border">
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => chooseView(option)}
            aria-pressed={view === option}
            data-view-option={option}
            className="view-option transition-colors"
          >
            {option}
          </button>
        </span>
      ))}
    </div>
  );
}
