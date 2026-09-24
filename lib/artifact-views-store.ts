// Client-side cache of artifact view counts.
//
// Artifact pages are static (ISR, revalidate = 30), so the count baked into the
// HTML can be up to 30s stale. This module keeps one page-load snapshot of the
// live counts — a single request serves every ArtifactViews on the page — and
// lets a tracked visit push its incremented value straight back into the UI.
//
// Read through `useSyncExternalStore` in components/artifacts/ArtifactViews.tsx;
// no component state is set from an effect.

type Counts = Record<string, number>;

let counts: Counts = {};
let inflight: Promise<void> | null = null;

const listeners = new Set<() => void>();
const tracked = new Set<string>();

function emit() {
  for (const listener of listeners) listener();
}

async function loadCounts(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch("/api/artifacts/views", { cache: "no-store" });
      if (!response.ok) return;

      const data = (await response.json()) as { counts?: Counts };
      if (!data?.counts) return;

      counts = { ...counts, ...data.counts };
      emit();
    } catch {
      // Offline, or the route is unavailable: keep the server-rendered value.
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function subscribeToCounts(listener: () => void) {
  listeners.add(listener);
  void loadCounts();

  return () => {
    listeners.delete(listener);
  };
}

export function getCountSnapshot(slug: string): number | undefined {
  return counts[slug];
}

/** Nothing is known at render time on the server, so the HTML keeps the ISR value. */
export function getCountServerSnapshot(): undefined {
  return undefined;
}

/**
 * Counts one visit per page load. `tracked` is module state, so React
 * StrictMode's double-invoked effects in dev (and any second ArtifactViews for
 * the same slug) cannot double count, while a real reload starts a fresh module
 * and therefore counts again.
 */
export async function trackArtifactView(slug: string): Promise<void> {
  if (tracked.has(slug)) return;
  tracked.add(slug);

  try {
    const response = await fetch(
      `/api/artifacts/${encodeURIComponent(slug)}/view`,
      { method: "POST" }
    );
    if (!response.ok) return;

    const data = (await response.json()) as { view_count?: number };
    if (typeof data?.view_count !== "number") return;

    counts = { ...counts, [slug]: data.view_count };
    emit();
  } catch {
    // Counting is best-effort; a failure must never surface to the reader.
  }
}
