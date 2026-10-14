import { createServiceClient } from "@/lib/supabase/service";
import { normalizeSignalLinks, type SignalLink } from "@/lib/signal-links";
import { compareSignals, normalizeFocus } from "@/lib/signal-focus";

/**
 * The pipeline, as one list.
 *
 * Order here is the order every control offers — the pill on the list, the
 * editor's select, the filter above them — so the vocabulary cannot drift
 * between three files. `status` is free text in Postgres (the column has no
 * check constraint; see migrations/opportunity_signals.sql), which is why the
 * server action validates what it is sent against this list instead of trusting
 * it.
 */
export const OPPORTUNITY_SIGNAL_STATUSES = [
  { value: "new", label: "New" },
  { value: "applied", label: "Applied" },
  { value: "reached_out", label: "Reached Out" },
  { value: "interviewing", label: "Interviewing" },
  { value: "closed", label: "Closed" },
] as const;

export type OpportunitySignalStatus =
  (typeof OPPORTUNITY_SIGNAL_STATUSES)[number]["value"];

/** The label for a status — "reached_out" reads as "Reached Out". */
export function signalStatusLabel(status: OpportunitySignalStatus): string {
  return (
    OPPORTUNITY_SIGNAL_STATUSES.find((option) => option.value === status)
      ?.label ?? status
  );
}

export type { SignalLink };

export interface OpportunitySignal {
  id: string;
  company_name: string;
  website: string | null;
  links: SignalLink[];
  notes: string | null;
  discovered_at: string;
  updated_at: string;
  status: OpportunitySignalStatus | null;
  /** Starred. The only prioritisation there is — see lib/signal-focus.ts */
  focus: boolean;
}

/**
 * `focus` is normalised, not trusted: a row written before
 * migrations/opportunity_signal_focus.sql ran arrives without the column, and
 * the admin list still has to render.
 */
function normalizeSignal(row: Record<string, unknown>): OpportunitySignal {
  return {
    ...(row as unknown as OpportunitySignal),
    links: normalizeSignalLinks(row.links),
    focus: normalizeFocus(row.focus),
  };
}

function normalizeRows(data: unknown): OpportunitySignal[] {
  return ((data as Record<string, unknown>[]) ?? [])
    .map(normalizeSignal)
    .sort(compareSignals);
}

export async function getAllOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return normalizeRows(data);
}

export async function getActiveOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .neq("status", "closed")
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return normalizeRows(data);
}

export async function getOpportunitySignalById(
  id: string
): Promise<OpportunitySignal | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return normalizeSignal(data as Record<string, unknown>);
}
