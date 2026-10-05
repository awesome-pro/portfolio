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

function revalidateSignalSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/opportunity-signals");
}

/**
 * `focus` comes from migrations/opportunity_signal_focus.sql. If the app is
 * ever deployed before that file is pasted into the SQL editor, PostgREST
 * rejects the write with a schema-cache error — name the fix instead of
 * surfacing "column does not exist".
 */
function signalWriteError(error: { code?: string; message: string }): Error {
  if (error.code === "PGRST204" || error.code === "42703") {
    return new Error(
      "The focus column is missing — run migrations/opportunity_signal_focus.sql in the Supabase SQL editor."
    );
  }
  if (error.code === "23505") {
    return new Error("Another signal already uses that company name.");
  }
  return new Error(error.message);
}

export async function deleteOpportunitySignal(id: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("opportunity_signals").delete().eq("id", id);

  revalidateSignalSurfaces();
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
  focus: boolean;
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
    focus: input.focus === true,
  });

  if (error) throw signalWriteError(error);

  revalidateSignalSurfaces();
  // Signals are edited inline on the list, so land back there.
  redirect("/admin/opportunity-signals");
}

export interface UpdateOpportunitySignalInput {
  company_name: string;
  website: string;
  status: OpportunitySignalStatus;
  notes: string;
  links: SignalLink[];
  focus: boolean;
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
      focus: input.focus === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw signalWriteError(error);

  revalidateSignalSurfaces();
}

/**
 * The list's one-click star. Kept separate from updateOpportunitySignal so
 * starring a company never round-trips (or risks clobbering) its notes, links
 * and status.
 */
export async function setOpportunityFocus(id: string, focus: boolean) {
  await requireAdminSession();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("opportunity_signals")
    .update({ focus: focus === true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw signalWriteError(error);

  revalidateSignalSurfaces();
}
