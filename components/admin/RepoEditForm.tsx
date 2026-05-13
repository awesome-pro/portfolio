"use client";

import { useState, useTransition } from "react";
import { updateRepoStatusAndNotes } from "@/app/admin/repos/actions";

const STATUSES = [
  { value: "suggested", label: "Suggested", active: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "started", label: "Started", active: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "contributed", label: "Contributed", active: "bg-green-50 text-green-700 border-green-200" },
  { value: "skipped", label: "Skipped", active: "bg-surface text-ink-faint border-border" },
];

export default function RepoEditForm({
  id,
  status: initialStatus,
  userNotes: initialNotes,
}: {
  id: string;
  status: string;
  userNotes: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateRepoStatusAndNotes(id, status, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-ink-muted">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(({ value, label, active }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`text-sm font-mono px-4 py-2 rounded-xl border transition-colors ${
                status === value
                  ? active
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
        disabled={isPending}
        className="self-start bg-ink text-background rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
