"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { OpportunitySignalStatus, PersonToReach } from "@/lib/opportunity-signals";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export async function deleteOpportunitySignal(id: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("opportunity_signals").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
  revalidatePath(`/admin/opportunity-signals/${id}`);
}

export async function updateOpportunitySignalStatus(
  id: string,
  status: OpportunitySignalStatus
) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase
    .from("opportunity_signals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
  revalidatePath(`/admin/opportunity-signals/${id}`);
}

export interface CreateOpportunitySignalInput {
  company_name: string;
  website: string;
  signal_type: string;
  reason: string;
  match_score: number | null;
  interview_probability: number | null;
  status: OpportunitySignalStatus;
  notes: string;
  job_links: string[];
  relevant_links: string[];
  people_to_reach: PersonToReach[];
}

export async function createOpportunitySignal(input: CreateOpportunitySignalInput) {
  await requireAdminSession();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .insert({
      company_name: input.company_name.trim(),
      website: input.website.trim() || null,
      signal_type: input.signal_type.trim(),
      reason: input.reason.trim(),
      match_score: input.match_score,
      interview_probability: input.interview_probability,
      status: input.status,
      notes: input.notes.trim() || null,
      job_links: input.job_links.filter(Boolean),
      relevant_links: input.relevant_links.filter(Boolean),
      people_to_reach: input.people_to_reach.filter((p) => p.name.trim()),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
  redirect(`/admin/opportunity-signals/${data.id}`);
}

export async function updateOpportunitySignalNotes(id: string, notes: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase
    .from("opportunity_signals")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/opportunity-signals");
  revalidatePath(`/admin/opportunity-signals/${id}`);
}
