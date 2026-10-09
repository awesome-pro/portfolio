"use client";

import { useState } from "react";
import type { OpportunitySignal } from "@/lib/opportunity-signals";
import NoteDialog from "./NoteDialog";

/**
 * The page header's "Create Note" button. It lives in the header rather than
 * the notes tab because half the time you write a note while you are looking
 * at the company list.
 */
export default function CreateNoteButton({
  signals,
  today,
}: {
  signals: OpportunitySignal[];
  today: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-mono px-2.5 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors shrink-0"
      >
        Create Note
      </button>
      {open && (
        <NoteDialog
          signals={signals}
          today={today}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
