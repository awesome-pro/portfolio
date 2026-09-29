/**
 * Item edits for the prep checklist — an overlay on the markdown, not a copy.
 *
 * The markdown file is parsed at build time into 487 items; this store holds
 * only what the user changed from the page, keyed the same way (see
 * lib/prep-checklist.ts). Three kinds of row:
 *
 *   edit  — a base key with new text: that item is reworded
 *   hide  — a base key flagged deleted: the item disappears, restorable
 *   add   — a `custom-<uuid>` key: a new item, appended to its section
 *
 * Writes are optimistic: the row appears or changes the instant it is
 * submitted, and the request follows. If the request fails the change stays on
 * screen and the state goes to "offline" — losing typed text to a flaky network
 * would be the worst possible failure for this feature.
 *
 * Marks and edits are separate stores on purpose: a mark is one boolean per
 * item and syncs per item, while an edit is a text row. Keeping them apart
 * means a failed text edit can never disturb progress.
 */

export interface PrepItemChange {
  key: string;
  sectionId: string;
  text: string | null;
  deleted: boolean;
}

export type ItemsState = "loading" | "ready" | "unavailable" | "offline";

export const CUSTOM_PREFIX = "custom-";

export interface ResolvedItem {
  key: string;
  text: string;
  hidden: boolean;
  custom: boolean;
}

const ENDPOINT = "/api/prep/items";
const EMPTY: Record<string, PrepItemChange> = {};

const listeners = new Set<() => void>();
let changes: Record<string, PrepItemChange> = EMPTY;
let state: ItemsState = "loading";
let started = false;

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: ItemsState) {
  if (state === next) return;
  state = next;
  emit();
}

function commit(next: Record<string, PrepItemChange>) {
  changes = next;
  emit();
}

export function newCustomKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${CUSTOM_PREFIX}${random}`;
}

async function send(item: PrepItemChange): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: item.key,
        sectionId: item.sectionId,
        text: item.text,
        deleted: item.deleted,
      }),
    });
    const result = (await response.json()) as { ok?: boolean; reason?: string };
    if (result.ok) {
      setState("ready");
      return true;
    }
    setState(result.reason === "unavailable" ? "unavailable" : "offline");
    return false;
  } catch {
    setState("offline");
    return false;
  }
}

/** Optimistic write: show it now, persist it next. */
function stage(item: PrepItemChange) {
  commit({ ...changes, [item.key]: item });
  void send(item);
}

function ensureLoaded() {
  if (started || typeof window === "undefined") return;
  started = true;

  void (async () => {
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store" });
      const result = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        items?: PrepItemChange[];
      };
      if (!result.ok) {
        setState(result.reason === "unavailable" ? "unavailable" : "offline");
        return;
      }
      const next: Record<string, PrepItemChange> = {};
      for (const item of result.items ?? []) next[item.key] = item;
      commit(next);
      setState("ready");
    } catch {
      setState("offline");
    }
  })();
}

export function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChangesSnapshot(): Record<string, PrepItemChange> {
  return changes;
}

export function getItemsStateSnapshot(): ItemsState {
  return state;
}

export function getItemsServerSnapshot(): Record<string, PrepItemChange> {
  return EMPTY;
}

export function getItemsStateServerSnapshot(): ItemsState {
  return "loading";
}

/** Add an item to the end of a section. */
export function addItem(sectionId: string, text: string): string {
  const key = newCustomKey();
  stage({ key, sectionId, text, deleted: false });
  return key;
}

/** Reword a base item, or a custom one. Same row either way. */
export function editItem(key: string, sectionId: string, text: string) {
  stage({ key, sectionId, text, deleted: false });
}

/** Take an item off the list but keep its row, so it can come back. */
export function hideItem(key: string, sectionId: string) {
  stage({ key, sectionId, text: changes[key]?.text ?? null, deleted: true });
}

export function restoreItem(key: string, sectionId: string) {
  stage({ key, sectionId, text: changes[key]?.text ?? null, deleted: false });
}

/** Remove a custom item entirely; there is nothing underneath it to restore. */
export function deleteCustomItem(key: string) {
  const next = { ...changes };
  delete next[key];
  commit(next);
  void (async () => {
    try {
      await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      setState("ready");
    } catch {
      setState("offline");
    }
  })();
}

/**
 * Base items with the overlay applied, plus the section's custom items.
 * `showHidden` is the page's "hidden" toggle — hidden rows are returned so they
 * can be shown greyed out with a restore button rather than vanishing.
 */
export function resolveItems(
  sectionId: string,
  base: { key: string; text: string }[]
): ResolvedItem[] {
  const resolved: ResolvedItem[] = base.map((item) => {
    const change = changes[item.key];
    return {
      key: item.key,
      text: change?.text ?? item.text,
      hidden: change?.deleted ?? false,
      custom: false,
    };
  });

  for (const change of Object.values(changes)) {
    if (change.sectionId !== sectionId) continue;
    if (!change.key.startsWith(CUSTOM_PREFIX)) continue;
    resolved.push({
      key: change.key,
      text: change.text ?? "",
      hidden: change.deleted,
      custom: true,
    });
  }

  return resolved;
}
