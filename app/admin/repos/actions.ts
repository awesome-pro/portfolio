"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function updateRepoStatus(id: string, status: string) {
  const supabase = createServiceClient();
  await supabase.from("contribution_targets").update({ status }).eq("id", id);
  revalidatePath("/admin/repos");
  revalidatePath(`/admin/repos/${id}`);
}

export async function updateRepoNotes(id: string, notes: string) {
  const supabase = createServiceClient();
  await supabase
    .from("contribution_targets")
    .update({ user_notes: notes })
    .eq("id", id);
  revalidatePath("/admin/repos");
  revalidatePath(`/admin/repos/${id}`);
}

export async function updateRepoStatusAndNotes(
  id: string,
  status: string,
  notes: string
) {
  const supabase = createServiceClient();
  await supabase
    .from("contribution_targets")
    .update({ status, user_notes: notes })
    .eq("id", id);
  revalidatePath("/admin/repos");
  revalidatePath(`/admin/repos/${id}`);
}
