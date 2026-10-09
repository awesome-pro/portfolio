/**
 * Dated notes: the shape, and the only two questions the UI ever asks about a
 * date — which bucket does it fall in, and how do I label it.
 *
 * Pure and client-safe on purpose. The notes tab is server-rendered and then
 * hydrated, so the grouping and the labels have to come out identical on both
 * sides or React would report a mismatch on every date heading.
 */

export interface SignalNote {
  id: string;
  body: string;
  /** `YYYY-MM-DD` — the day the note is *for*, not the day it was written. */
  note_date: string;
  /** opportunity_signals ids this note refers to. Empty is normal. */
  signal_ids: string[];
  created_at: string;
  updated_at: string;
}

/** Which slice of the timeline the notes tab is showing. */
export type NoteRange = "today" | "upcoming" | "past" | "all";

export interface NoteGroup {
  date: string;
  /** "today", "tomorrow", "yesterday" or "Mon, Oct 6". */
  label: string;
  notes: SignalNote[];
}

/** Written defensively: a row missing `note_date` must not break the tab. */
export function normalizeSignalNote(row: Record<string, unknown>): SignalNote {
  return {
    id: String(row.id ?? ""),
    body: typeof row.body === "string" ? row.body : "",
    note_date:
      typeof row.note_date === "string" ? row.note_date.slice(0, 10) : "",
    signal_ids: Array.isArray(row.signal_ids)
      ? row.signal_ids.map((id) => String(id))
      : [],
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

/**
 * Days since the epoch, in UTC. Date-only strings are timezone-free, so doing
 * the arithmetic in UTC keeps "is this today?" from depending on the reader's
 * clock — the same reason note_date is a `date` column.
 */
function dayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return NaN;
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function noteRange(date: string, today: string): Exclude<NoteRange, "all"> {
  const diff = dayNumber(date) - dayNumber(today);
  if (!Number.isFinite(diff) || diff < 0) return "past";
  if (diff === 0) return "today";
  return "upcoming";
}

/** "today" reads faster than a date; weekdays make "Monday" findable. */
export function formatNoteDate(date: string, today: string) {
  const diff = dayNumber(date) - dayNumber(today);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";

  // `T00:00:00` forces local-time parsing; a bare "2026-10-06" is UTC.
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  const sameYear = parsed.getFullYear() === Number(today.slice(0, 4));
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Within a day, in the order they were written. */
function compareNotes(a: SignalNote, b: SignalNote) {
  return (
    a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
  );
}

/**
 * Notes bucketed by date, ordered the way the tab reads: today first, then the
 * future soonest-first, then the past most-recent-first.
 */
export function groupNotes(
  notes: SignalNote[],
  today: string,
  range: NoteRange
): NoteGroup[] {
  const buckets = new Map<string, SignalNote[]>();

  for (const note of notes) {
    if (range !== "all" && noteRange(note.note_date, today) !== range) continue;
    const bucket = buckets.get(note.note_date);
    if (bucket) bucket.push(note);
    else buckets.set(note.note_date, [note]);
  }

  const rank = (date: string) => {
    const bucket = noteRange(date, today);
    if (bucket === "today") return 0;
    return bucket === "upcoming" ? 1 : 2;
  };

  return [...buckets.entries()]
    .map(([date, list]) => ({
      date,
      label: formatNoteDate(date, today),
      notes: [...list].sort(compareNotes),
    }))
    .sort((a, b) => {
      const rankA = rank(a.date);
      const rankB = rank(b.date);
      if (rankA !== rankB) return rankA - rankB;
      // Upcoming: soonest first. Past: most recent first. "today" is one date.
      return rankA === 1
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });
}
