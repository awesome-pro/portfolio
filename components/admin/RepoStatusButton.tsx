"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = [
  { value: "suggested", label: "Suggested" },
  { value: "started", label: "Started" },
  { value: "contributed", label: "Contributed" },
  { value: "skipped", label: "Skipped" },
];

const STATUS_ACTIVE: Record<string, string> = {
  suggested: "bg-blue-50 text-blue-700 border-blue-200",
  started: "bg-amber-50 text-amber-700 border-amber-200",
  contributed: "bg-green-50 text-green-700 border-green-200",
  skipped: "bg-surface text-ink-faint border-border",
};

export default function RepoStatusButton({
  id,
  status: initial,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: string) {
    if (next === status || loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("contribution_targets").update({ status: next }).eq("id", id);
    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUSES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => updateStatus(value)}
          disabled={loading}
          className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
            status === value
              ? STATUS_ACTIVE[value]
              : "bg-surface text-ink-faint border-border hover:text-ink-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
