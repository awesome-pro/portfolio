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
}

function cleanLinks(links: SignalLink[]): SignalLink[] {
  return links
    .map((link) => {
      const title = link.title?.trim();
      return { url: link.url.trim(), ...(title ? { title } : {}) };
    })
    .filter((link) => link.url);
}

export interface CreateOpportunitySignalInput {
  company_name: string;
  website: string;
  status: OpportunitySignalStatus;
  notes: string;
  links: SignalLink[];
}

export async function createOpportunitySignal(input: CreateOpportunitySignalInput) {
  await requireAdminSession();

  const supabase = createServiceClient();
  const { error } = await supabase.from("opportunity_signals").insert({
    company_name: input.company_name.trim(),
    website: input.website.trim() || null,
    status: input.status,
    notes: input.notes.trim() || null,
    links: cleanLinks(input.links),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
  // Signals are edited inline on the list, so land back there.
  redirect("/admin/opportunity-signals");
}

export interface UpdateOpportunitySignalInput {
  company_name: string;
  website: string;
  status: OpportunitySignalStatus;
  notes: string;
  links: SignalLink[];
}

export async function updateOpportunitySignal(
  id: string,
  input: UpdateOpportunitySignalInput
) {
  await requireAdminSession();

  const companyName = input.company_name.trim();
  if (!companyName) {
    throw new Error("Company name is required.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("opportunity_signals")
    .update({
      company_name: companyName,
      website: input.website.trim() || null,
      status: input.status,
      notes: input.notes.trim() || null,
      links: cleanLinks(input.links),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Another signal already uses that company name.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
}
