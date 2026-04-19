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

export default function RepoEditForm({
  id,
  status: initialStatus,
  userNotes: initialNotes,
}: {
  id: string;
  status: string;
  userNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("contribution_targets")
      .update({ status, user_notes: notes })
      .eq("id", id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-ink-muted">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`text-sm font-mono px-4 py-2 rounded-xl border transition-colors ${
                status === value
                  ? STATUS_ACTIVE[value]
                  : "bg-surface text-ink-faint border-border hover:text-ink-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-ink-muted" htmlFor="notes">
          Your Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Add personal notes, ideas, progress updates..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-y"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start bg-ink text-background rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
