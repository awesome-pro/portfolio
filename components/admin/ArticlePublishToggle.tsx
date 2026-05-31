"use client";

import { useState, useTransition } from "react";
import { toggleArticlePublished } from "@/app/admin/articles/actions";

export default function ArticlePublishToggle({
  id,
  isPublished,
}: {
  id: number;
  isPublished: boolean;
}) {
  const [optimistic, setOptimistic] = useState(isPublished);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      await toggleArticlePublished(id, next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
        optimistic
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          : "bg-surface text-ink-muted border-border hover:text-ink"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${optimistic ? "bg-green-500" : "bg-ink-faint"}`}
      />
      {optimistic ? "Published" : "Draft"}
    </button>
  );
}
