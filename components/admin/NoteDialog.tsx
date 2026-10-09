"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitySignal } from "@/lib/opportunity-signals";
import type { SignalNote } from "@/lib/signal-notes";
import {
  createSignalNote,
  updateSignalNote,
} from "@/app/admin/opportunity-signals/actions";
import { Input, Label, Textarea } from "./SignalFields";

/**
 * One dialog for both jobs: writing a note, and fixing one you already wrote.
 * It is mounted only while it is open, so every field starts from the note it
 * was given and there is no stale state to reset.
 *
 * Three fields, in the order you fill them in: what, which day it is for, and
 * — if it is about particular companies — which ones. The companies are
 * optional and are picked from the signals you already saved; the point of
 * them is to see at a glance which company a note belongs to, and to click
 * through to it.
 */
export default function NoteDialog({
  signals,
  today,
  note,
  onClose,
}: {
  signals: OpportunitySignal[];
  /** `YYYY-MM-DD`, straight from the server so SSR and hydration agree. */
  today: string;
  note?: SignalNote | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState(note?.body ?? "");
  const [date, setDate] = useState(note?.note_date || today);
  const [selected, setSelected] = useState<string[]>(note?.signal_ids ?? []);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byId = useMemo(
    () => new Map(signals.map((signal) => [signal.id, signal])),
    [signals]
  );

  const chosen = useMemo(
    () =>
      selected
        .map((id) => byId.get(id))
        .filter((signal): signal is OpportunitySignal => Boolean(signal)),
    [selected, byId]
  );

  // The signals arrive starred-first, so the companies you care about are at
  // the top of the list before you type anything.
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return signals;
    return signals.filter((signal) =>
      signal.company_name.toLowerCase().includes(needle)
    );
  }, [signals, query]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function save() {
    if (!body.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const input = { body, note_date: date, signal_ids: selected };
        if (note) await updateSignalNote(note.id, input);
        else await createSignalNote(input);
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the note.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4 sm:py-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={note ? "Edit note" : "New note"}
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-lg p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">
            {note ? "Edit note" : "New note"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono px-1.5 py-1 text-ink-faint hover:text-ink transition-colors"
          >
            close
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Note</Label>
          <Textarea
            value={body}
            onChange={setBody}
            rows={4}
            autoFocus
            placeholder="Message Priya about the infra role"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                save();
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>For</Label>
          <div className="max-w-44">
            <Input type="date" value={date} onChange={setDate} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            Companies <span className="text-ink-faint">(optional)</span>
          </Label>

          {chosen.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chosen.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => toggle(company.id)}
                  title={`Remove ${company.company_name}`}
                  className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-md bg-ink text-background hover:opacity-90 transition-opacity"
                >
                  {company.company_name}
                  <span aria-hidden>&times;</span>
                </button>
              ))}
            </div>
          )}

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved companies..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
          />

          <div className="max-h-52 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {matches.length === 0 ? (
              <p className="px-3 py-2 text-xs font-mono text-ink-faint">
                No saved company matches.
              </p>
            ) : (
              matches.map((company) => {
                const active = selected.includes(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => toggle(company.id)}
                    aria-pressed={active}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? "bg-ink text-background"
                        : "text-ink-muted hover:text-ink hover:bg-border/40"
                    }`}
                  >
                    {company.focus && (
                      <span className="text-xs leading-none">★</span>
                    )}
                    <span className="truncate">{company.company_name}</span>
                    {active && (
                      <span className="ml-auto text-xs font-mono">added</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          {error ? (
            <p className="text-xs font-mono text-destructive min-w-0">{error}</p>
          ) : (
            <p className="text-xs font-mono text-ink-faint">⌘↵ to save</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-xs font-mono px-2 py-1.5 text-ink-faint hover:text-ink transition-colors disabled:opacity-50"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending || !body.trim()}
              className="px-3.5 py-2 text-sm font-semibold bg-ink text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : note ? "Save" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
