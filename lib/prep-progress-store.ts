/**
 * Tick state for the prep checklist — an external store, not component state.
 *
 * localStorage is the whole persistence layer: no table, no migration, no API
 * route, and the page keeps working offline. The tradeoff is real and worth
 * stating plainly: progress is per-browser. Clearing site data loses it, and a
 * tick on the laptop does not appear on the phone. The export/import pair at
 * the bottom of the page exists for exactly that reason.
 *
 * It is an external store rather than `useEffect(() => setState(...))` because
 * this repo lints `react-hooks/set-state-in-effect` as an error — and because
 * reading storage during render is what `useSyncExternalStore` is for: the
 * server snapshot renders nothing ticked, then React swaps in the real state
 * after hydration with no mismatch.
 */

const STORAGE_KEY = "prep:inference-interview-2026";

export type Progress = Record<string, true>;

const EMPTY: Progress = {};
/** Referentially stable: useSyncExternalStore compares snapshots by identity. */
const listeners = new Set<() => void>();

let progress: Progress = EMPTY;
let loaded = false;

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    progress = Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, value]) => value === true
      )
    ) as Progress;
  } catch {
    // Blocked storage or corrupt JSON: start empty rather than break the page.
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode / quota. The ticks still hold for this page view.
  }
}

function commit(next: Progress) {
  progress = next;
  persist();
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Progress {
  ensureLoaded();
  return progress;
}

/** Matches the server-rendered markup: nothing ticked until storage is read. */
export function getServerSnapshot(): Progress {
  return EMPTY;
}

export function toggle(key: string) {
  ensureLoaded();
  const next: Progress = { ...progress };
  if (next[key]) delete next[key];
  else next[key] = true;
  commit(next);
}

export function clearAll() {
  commit({});
}

export function exportProgress(): string {
  ensureLoaded();
  return JSON.stringify(progress, null, 2);
}

/** Returns how many ticks were restored. Throws if the file is not our JSON. */
export function importProgress(json: string): number {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected an object of item keys.");
  }
  const next = Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).filter(
      ([, value]) => value === true
    )
  ) as Progress;
  loaded = true;
  commit(next);
  return Object.keys(next).length;
}
