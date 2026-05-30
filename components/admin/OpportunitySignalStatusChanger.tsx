"use client";

import { useState, useTransition } from "react";
import type { OpportunitySignalStatus } from "@/lib/opportunity-signals";
import { updateOpportunitySignalStatus } from "@/app/admin/opportunity-signals/actions";

const STATUS_CONFIG: Record<
  OpportunitySignalStatus,
  { label: string; style: string }
> = {
  new: { label: "New", style: "bg-surface text-ink-muted border-border" },
  reached_out: {
    label: "Reached Out",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  interviewing: {
    label: "Interviewing",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  closed: {
    label: "Closed",
    style: "bg-background text-ink-faint border-border",
  },
};

const STATUS_FLOW: OpportunitySignalStatus[] = [
  "new",
  "reached_out",
  "interviewing",
  "closed",
];

export default function OpportunitySignalStatusChanger({
  id,
  current,
}: {
  id: string;
  current: OpportunitySignalStatus | null;
}) {
  const [optimistic, setOptimistic] = useState<OpportunitySignalStatus>(
    current ?? "new"
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(status: OpportunitySignalStatus) {
    setOptimistic(status);
    startTransition(async () => {
      await updateOpportunitySignalStatus(id, status);
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
