"use client";

import { useState, useTransition } from "react";
import { updateRepoStatus } from "@/app/admin/repos/actions";

const STATUSES = [
  { value: "suggested", label: "Suggested", active: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "started", label: "Started", active: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "contributed", label: "Contributed", active: "bg-green-50 text-green-700 border-green-200" },
  { value: "skipped", label: "Skipped", active: "bg-surface text-ink-faint border-border" },
];

export default function RepoStatusButton({
  id,
  status: initial,
}: {
  id: string;
  status: string;
}) {
  const [status, setStatus] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleClick(next: string) {
    if (next === status || isPending) return;
    setStatus(next);
    startTransition(() => updateRepoStatus(id, next));
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUSES.map(({ value, label, active }) => (
        <button
          key={value}
          onClick={() => handleClick(value)}
          disabled={isPending}
          className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
            status === value
              ? active
              : "bg-surface text-ink-faint border-border hover:text-ink-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
