"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Eye } from "lucide-react";
import {
  getCountServerSnapshot,
  getCountSnapshot,
  subscribeToCounts,
  trackArtifactView,
} from "@/lib/artifact-views-store";

/**
 * Eye + view count for an artifact.
 *
 * `initialCount` is the number baked into the static HTML; the live value (and
 * the increment, when `track` is set) arrives from the API route after mount.
 * Only the artifact detail page tracks — index listings would otherwise inflate
 * every artifact they merely list.
 */
export default function ArtifactViews({
  slug,
  initialCount = 0,
  track = false,
  className = "",
}: {
  slug: string;
  initialCount?: number;
  track?: boolean;
  className?: string;
}) {
  const liveCount = useSyncExternalStore(
    subscribeToCounts,
    () => getCountSnapshot(slug),
    getCountServerSnapshot
  );

  useEffect(() => {
    if (track) void trackArtifactView(slug);
  }, [slug, track]);

  const count = liveCount ?? initialCount;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-ink-faint ${className}`}
      title={`${count.toLocaleString("en-US")} ${count === 1 ? "view" : "views"}`}
    >
      <Eye aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span className="tabular-nums">{count.toLocaleString("en-US")}</span>
      <span className="sr-only">
        {count === 1 ? "view" : "views"}
      </span>
    </span>
  );
}
