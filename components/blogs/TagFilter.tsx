"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function TagFilter({ tags }: { tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const setTag = useCallback(
    (tag: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tag) {
        params.set("tag", tag);
      } else {
        params.delete("tag");
      }
      // Reset to page 1 when changing tag
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setTag(null)}
        className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
          !activeTag
            ? "bg-ink text-background border-ink"
            : "border-border text-ink-muted hover:border-ink-muted hover:text-ink"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => setTag(tag === activeTag ? null : tag)}
          className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
            activeTag === tag
              ? "bg-ink text-background border-ink"
              : "border-border text-ink-muted hover:border-ink-muted hover:text-ink"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
