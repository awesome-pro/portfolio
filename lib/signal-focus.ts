// Focus is the only priority mechanism: one boolean, one star.
//
// This module deliberately has NO imports, so client components can pull the
// comparator in without dragging the service-role Supabase client along.
//
// There is no rank and no tier. Starred signals sort above unstarred ones;
// within each group the newest comes first. That is the whole model.

/**
 * `focus` is a boolean column, so treat anything unexpected as "not focused"
 * rather than letting a malformed row hide or promote a company.
 */
export function normalizeFocus(value: unknown): boolean {
  return value === true;
}

/** The minimum shape `compareSignals` needs — `OpportunitySignal` satisfies it. */
export interface FocusableSignal {
  focus?: unknown;
  discovered_at: string;
}

/** Starred first, then newest-first. */
export function compareSignals(a: FocusableSignal, b: FocusableSignal): number {
  const byFocus = Number(normalizeFocus(b.focus)) - Number(normalizeFocus(a.focus));
  if (byFocus !== 0) return byFocus;
  return String(b.discovered_at).localeCompare(String(a.discovered_at));
}
