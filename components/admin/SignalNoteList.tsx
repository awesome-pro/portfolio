"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OpportunitySignal } from "@/lib/opportunity-signals";
import {
  groupNotes,
  noteRange,
  type NoteRange,
  type SignalNote,
} from "@/lib/signal-notes";
import { deleteSignalNote } from "@/app/admin/opportunity-signals/actions";
import NoteDialog from "./NoteDialog";

const RANGES: { value: NoteRange; label: string }[] = [
  { value: "today", label: "today" },
  { value: "upcoming", label: "upcoming" },
  { value: "past", label: "past" },
  { value: "all", label: "all" },
];

function SignalNoteCard({
  note,
  companies,
  onEdit,
}: {
  note: SignalNote;
  companies: OpportunitySignal[];
  onEdit: (note: SignalNote) => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteSignalNote(note.id);
      router.refresh();
    });
  }

  return (
    <div className="px-4 py-3">
      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {note.body}
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/admin/opportunity-signals?q=${encodeURIComponent(
              company.company_name
            )}`}
            title={`Show ${company.company_name} in the signals list`}
            className="text-xs font-mono px-1.5 py-0.5 rounded border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
          >
            {company.company_name}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {confirming ? (
            <>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs font-mono px-2 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                {isPending ? "deleting…" : "yes, delete"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="text-xs font-mono px-2 py-1 rounded-md border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(note)}
                className="text-xs font-mono px-1.5 py-1 text-ink-faint hover:text-ink transition-colors"
              >
                edit
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="text-xs font-mono px-1.5 py-1 text-ink-faint hover:text-destructive transition-colors"
              >
                delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The notes tab. Notes are grouped by the date they are *for*, today first, so
 * the answer to "what am I doing today" is the first thing on the page.
 */
export default function SignalNoteList({
  notes,
  signals,
  today,
  ready,
}: {
  notes: SignalNote[];
  signals: OpportunitySignal[];
  today: string;
  /** false until migrations/opportunity_signal_notes.sql has been run. */
  ready: boolean;
}) {
  const [range, setRange] = useState<NoteRange>("all");
  const [editing, setEditing] = useState<SignalNote | null>(null);

  const byId = useMemo(
    () => new Map(signals.map((signal) => [signal.id, signal])),
    [signals]
  );

  const counts = useMemo(() => {
    const tally = { today: 0, upcoming: 0, past: 0, all: notes.length };
    for (const note of notes) tally[noteRange(note.note_date, today)] += 1;
    return tally;
  }, [notes, today]);

  const groups = useMemo(
    () => groupNotes(notes, today, range),
    [notes, today, range]
  );
  const shown = groups.reduce((total, group) => total + group.notes.length, 0);

  if (!ready) {
    return (
      <div className="py-16 text-center border border-dashed border-border rounded-xl flex flex-col items-center gap-1.5">
        <p className="text-ink-faint font-mono text-sm">
          The notes table is not there yet.
        </p>
        <p className="text-xs font-mono text-ink-faint">
          Run migrations/opportunity_signal_notes.sql in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {RANGES.map(({ value, label }) => {
          const active = range === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setRange(value)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                active
                  ? "bg-ink text-background border-ink"
                  : "bg-surface border-border text-ink-muted hover:text-ink"
              }`}
            >
              {label} ({counts[value]})
            </button>
          );
        })}
      </div>

      {shown === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-ink-faint font-mono text-sm">
            {range === "today"
              ? "Nothing dated today."
              : range === "upcoming"
                ? "No upcoming notes."
                : range === "past"
                  ? "No past notes."
                  : "No notes yet — use Create Note above."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.date} className="flex flex-col gap-2">
              <h2
                className={`text-xs font-mono ${
                  group.date === today ? "text-ink" : "text-ink-faint"
                }`}
              >
                {group.label}
              </h2>
              <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
                {group.notes.map((note) => (
                  <SignalNoteCard
                    key={note.id}
                    note={note}
                    companies={note.signal_ids
                      .map((id) => byId.get(id))
                      .filter(
                        (signal): signal is OpportunitySignal => Boolean(signal)
                      )}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <NoteDialog
          signals={signals}
          today={today}
          note={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
