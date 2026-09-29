/**
 * Tick state for the prep checklist.
 *
 * Three layers, and the order matters:
 *
 *  1. React state via useSyncExternalStore. It is an external store rather than
 *     `useEffect(() => setState(...))` because this repo lints
 *     `react-hooks/set-state-in-effect` as an error, and because reading
 *     storage during render is what useSyncExternalStore is for.
 *
 *  2. localStorage, as a cache. It makes the page instant and keeps it working
 *     with no network. Two things make it safe with several tabs open, which a
 *     naive implementation is not: every write re-reads storage first and
 *     applies only its own change on top, and a `storage` listener adopts
 *     whatever another tab wrote. Without both, two open tabs each write their
 *     own stale snapshot over the other and ticks vanish.
 *
 *  3. Supabase, as the durable copy — so progress survives clearing the browser
 *     and follows the user to another machine.
 *
 * Merging is per item, by timestamp, newest wins. A row records `done` as a
 * boolean and keeps unticked items rather than deleting them, because an untick
 * has to be able to beat a stale tick on some other device; without that, the
 * union of two devices would resurrect every untick. Ticks are still never lost:
 * the merge only ever moves an item to whichever side wrote it most recently.
 *
 * Everything here degrades. If the table is missing the page says so and keeps
 * ticking locally; if the network is down the write stays queued in localStorage
 * and is pushed on the next load.
 */

const STORAGE_KEY = "prep:inference-interview-2026";
const ENDPOINT = "/api/prep";

export type Progress = Record<string, true>;

/** Local truth: done-ness plus when this browser last changed it. */
type Entry = { done: boolean; at: number };
type Entries = Record<string, Entry>;

export type SyncState = "local" | "syncing" | "synced" | "unavailable" | "offline";

const EMPTY_PROGRESS: Progress = {};
const listeners = new Set<() => void>();

let entries: Entries = {};
/** Derived from `entries`, rebuilt only on change so its identity is stable. */
let doneView: Progress = EMPTY_PROGRESS;
let state: SyncState = "local";
let loaded = false;
let started = false;

function recompute() {
  const next: Progress = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (entry.done) next[key] = true;
  }
  doneView = next;
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: SyncState) {
  if (state === next) return;
  state = next;
  emit();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Private mode / quota. Ticks still hold for this page view.
  }
}

function parse(raw: string | null): Entries {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const next: Entries = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    // Current shape.
    if (value && typeof value === "object" && "done" in value) {
      const entry = value as { done?: unknown; at?: unknown };
      next[key] = {
        done: entry.done === true,
        at: typeof entry.at === "number" ? entry.at : 0,
      };
      continue;
    }
    // The first version stored a bare true per ticked item; keep reading it so
    // an existing browser does not lose its progress on the upgrade.
    if (value === true) next[key] = { done: true, at: 0 };
  }
  return next;
}

/** Adopt whatever is in storage now — another tab may have written it. */
function readStorage() {
  try {
    entries = parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Corrupt JSON: keep what we have rather than blanking the checklist.
  }
  recompute();
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  readStorage();
}

function write(key: string, done: boolean) {
  ensureLoaded();
  // Re-read first: this tab's in-memory copy may be older than what a sibling
  // tab has already committed, and merging into a stale copy loses ticks.
  readStorage();
  entries = { ...entries, [key]: { done, at: Date.now() } };
  recompute();
  persist();
  emit();
  setState("syncing");
  void push(key, done);
}

async function push(key: string, done: boolean): Promise<void> {
  const at = entries[key]?.at ?? Date.now();
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, done, at }),
    });
    const result = (await response.json()) as { ok?: boolean; reason?: string };
    if (result.ok) setState("synced");
    else if (result.reason === "unavailable") setState("unavailable");
    else setState("offline");
  } catch {
    setState("offline");
  }
}

/** Newest write wins, per item. Never drops an item either side knows about. */
function merge(remote: { key: string; done: boolean; at: number }[]) {
  const merged: Entries = { ...entries };
  const toPush: { key: string; done: boolean; at: number }[] = [];

  for (const item of remote) {
    const local = merged[item.key];
    if (!local || item.at > local.at) {
      merged[item.key] = { done: item.done, at: item.at };
    } else if (local.at > item.at) {
      toPush.push({ key: item.key, done: local.done, at: local.at });
    }
  }

  // Anything this browser knows and the server has never seen.
  const remoteKeys = new Set(remote.map((item) => item.key));
  for (const [key, entry] of Object.entries(merged)) {
    if (!remoteKeys.has(key)) toPush.push({ key, done: entry.done, at: entry.at });
  }

  entries = merged;
  recompute();
  persist();
  emit();
  return toPush;
}

async function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    readStorage();
    emit();
  });

  setState("syncing");
  try {
    const response = await fetch(ENDPOINT, { cache: "no-store" });
    const result = (await response.json()) as {
      ok?: boolean;
      reason?: string;
      entries?: { key: string; done: boolean; at: number }[];
    };

    if (!result.ok) {
      setState(result.reason === "unavailable" ? "unavailable" : "offline");
      return;
    }

    const toPush = merge(result.entries ?? []);
    setState("synced");
    for (const item of toPush) {
      await push(item.key, item.done);
    }
  } catch {
    setState("offline");
  }
}

export function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  if (listeners.size === 1) void startSync();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Progress {
  ensureLoaded();
  return doneView;
}

/** Matches the server-rendered markup: nothing ticked until storage is read. */
export function getServerSnapshot(): Progress {
  return EMPTY_PROGRESS;
}

export function getSyncSnapshot(): SyncState {
  return state;
}

export function getSyncServerSnapshot(): SyncState {
  return "local";
}

export function toggle(key: string) {
  ensureLoaded();
  write(key, !entries[key]?.done);
}

export function clearAll() {
  ensureLoaded();
  entries = {};
  recompute();
  persist();
  emit();
  void (async () => {
    try {
      const response = await fetch(ENDPOINT, { method: "DELETE" });
      const result = (await response.json()) as { ok?: boolean; reason?: string };
      if (result.ok) setState("synced");
      else if (result.reason === "unavailable") setState("unavailable");
      else setState("offline");
    } catch {
      setState("offline");
    }
  })();
}

export function exportProgress(): string {
  ensureLoaded();
  const plain: Progress = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (entry.done) plain[key] = true;
  }
  return JSON.stringify(plain, null, 2);
}

/** Returns how many ticks were restored. Throws if the file is not ours. */
export function importProgress(json: string): number {
  const parsed = parse(json);
  if (Object.keys(parsed).length === 0 && json.trim() !== "{}") {
    throw new Error("No ticks found in that file.");
  }
  ensureLoaded();
  const now = Date.now();
  for (const [key, entry] of Object.entries(parsed)) {
    // A restore is a deliberate write, so it wins over whatever is there.
    entries[key] = { done: entry.done, at: entry.at || now };
  }
  recompute();
  persist();
  emit();

  for (const [key, entry] of Object.entries(entries)) {
    if (entry.done) void push(key, entry.done);
  }
  return Object.values(entries).filter((entry) => entry.done).length;
}
