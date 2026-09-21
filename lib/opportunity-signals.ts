import { createServiceClient } from "@/lib/supabase/service";
import { normalizeSignalLinks, type SignalLink } from "@/lib/signal-links";

export type OpportunitySignalStatus = "new" | "reached_out" | "interviewing" | "closed";

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
}

function normalizeSignal(row: Record<string, unknown>): OpportunitySignal {
  return {
    ...(row as unknown as OpportunitySignal),
    links: normalizeSignalLinks(row.links),
  };
}

export async function getAllOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeSignal);
}

export async function getActiveOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .neq("status", "closed")
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeSignal);
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
