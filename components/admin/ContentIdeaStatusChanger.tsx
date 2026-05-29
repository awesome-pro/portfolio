"use client";

import { useState, useTransition } from "react";
import type { ContentIdeaStatus } from "@/lib/content-ideas";
import { updateContentIdeaStatus } from "@/app/admin/content-ideas/actions";

const STATUS_CONFIG: Record<ContentIdeaStatus, { label: string; style: string }> = {
  idea: { label: "Idea", style: "bg-surface text-ink-muted border-border" },
  selected: { label: "Selected", style: "bg-blue-50 text-blue-700 border-blue-200" },
  created: { label: "Created", style: "bg-amber-50 text-amber-700 border-amber-200" },
  posted: { label: "Posted", style: "bg-green-50 text-green-700 border-green-200" },
  skipped: { label: "Skipped", style: "bg-background text-ink-faint border-border" },
};

const STATUS_FLOW: ContentIdeaStatus[] = ["idea", "selected", "created", "posted", "skipped"];

export default function ContentIdeaStatusChanger({
  id,
  current,
}: {
  id: string;
  current: ContentIdeaStatus;
}) {
  const [optimistic, setOptimistic] = useState<ContentIdeaStatus>(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(status: ContentIdeaStatus) {
    setOptimistic(status);
    startTransition(async () => {
      await updateContentIdeaStatus(id, status);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FLOW.map((status) => {
          const config = STATUS_CONFIG[status];
          const active = optimistic === status;
          return (
            <button
              key={status}
              onClick={() => handleChange(status)}
              disabled={isPending || active}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                active
                  ? `${config.style} font-semibold`
                  : "bg-surface text-ink-muted border-border hover:text-ink"
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>
      {isPending && (
        <p className="text-xs font-mono text-ink-faint">Saving...</p>
      )}
    </div>
  );
}
