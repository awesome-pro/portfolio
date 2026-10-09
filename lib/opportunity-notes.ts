import { createServiceClient } from "@/lib/supabase/service";
import { normalizeSignalNote, type SignalNote } from "@/lib/signal-notes";

export interface SignalNotesResult {
  notes: SignalNote[];
  /**
   * false only when migrations/opportunity_signal_notes.sql has not been run
   * yet. The tab says so out loud instead of quietly showing "no notes", which
   * would look like the feature works and you simply have none.
   */
  ready: boolean;
}

/** PostgREST "table not in schema cache" and Postgres "undefined_table". */
export function isMissingNoteTable(code?: string) {
  return code === "PGRST205" || code === "42P01";
}

export async function getAllSignalNotes(): Promise<SignalNotesResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("signal_notes")
    .select("*")
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return { notes: [], ready: !isMissingNoteTable(error.code) };
  }

  return {
    notes: ((data as Record<string, unknown>[]) ?? []).map(normalizeSignalNote),
    ready: true,
  };
}
