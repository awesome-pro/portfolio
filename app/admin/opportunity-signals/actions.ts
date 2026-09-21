"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { OpportunitySignalStatus, SignalLink } from "@/lib/opportunity-signals";

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
  status: OpportunitySignalStatus;
  notes: string;
  links: SignalLink[];
}

function cleanLinks(links: SignalLink[]): SignalLink[] {
  return links
    .map((link) => {
      const title = link.title?.trim();
      return { url: link.url.trim(), ...(title ? { title } : {}) };
    })
    .filter((link) => link.url);
}

export async function createOpportunitySignal(input: CreateOpportunitySignalInput) {
  await requireAdminSession();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("opportunity_signals")
    .insert({
      company_name: input.company_name.trim(),
      website: input.website.trim() || null,
      status: input.status,
      notes: input.notes.trim() || null,
      links: cleanLinks(input.links),
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
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/opportunity-signals");
  revalidatePath(`/admin/opportunity-signals/${id}`);
}
