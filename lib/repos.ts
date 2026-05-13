import { createServiceClient } from "@/lib/supabase/service";

export interface ContributionRepo {
  id: string;
  repo_url: string;
  description: string | null;
  topics: string[];
  company_url: string | null;
  why_recommended: string | null;
  suggested_contribution: string | null;
  status: string;
  user_notes: string | null;
  discovered_at: string;
}

export async function getAllRepos(): Promise<ContributionRepo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contribution_targets")
    .select("*")
    .order("discovered_at", { ascending: false });
  if (error) return [];
  return (data as ContributionRepo[]) ?? [];
}

export async function getActiveRepos(): Promise<ContributionRepo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contribution_targets")
    .select("*")
    .neq("status", "skipped")
    .order("discovered_at", { ascending: false });
  if (error) return [];
  return (data as ContributionRepo[]) ?? [];
}

export async function getSkippedRepos(): Promise<ContributionRepo[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contribution_targets")
    .select("*")
    .eq("status", "skipped")
    .order("discovered_at", { ascending: false });
  if (error) return [];
  return (data as ContributionRepo[]) ?? [];
}

export async function getRepoById(id: string): Promise<ContributionRepo | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("contribution_targets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ContributionRepo;
}
