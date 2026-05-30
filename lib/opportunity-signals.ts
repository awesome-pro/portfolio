import { createServiceClient } from "@/lib/supabase/service";

export type OpportunitySignalStatus = "new" | "reached_out" | "interviewing" | "closed";

export interface PersonToReach {
  name: string;
  role?: string;
  linkedin?: string;
  note?: string;
}

export interface OpportunitySignal {
  id: string;
  company_name: string;
  website: string | null;
  signal_type: string;
  reason: string;
  job_links: unknown[];
  relevant_links: unknown[];
  people_to_reach: unknown[];
  notes: string | null;
  match_score: number | null;
  discovered_at: string;
  updated_at: string;
  status: OpportunitySignalStatus | null;
  interview_probability: number | null;
}

export async function getAllOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .order("match_score", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return (data as OpportunitySignal[]) ?? [];
}

export async function getActiveOpportunitySignals(): Promise<OpportunitySignal[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .neq("status", "closed")
    .order("match_score", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false });

  if (error) return [];
  return (data as OpportunitySignal[]) ?? [];
}

export async function getOpportunitySignalById(id: string): Promise<OpportunitySignal | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as OpportunitySignal;
}
