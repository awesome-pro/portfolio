"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { ContentIdeaStatus } from "@/lib/content-ideas";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export async function deleteContentIdea(id: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("ai_content_ideas").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/content-ideas");
  revalidatePath(`/admin/content-ideas/${id}`);
}

export async function updateContentIdeaStatus(id: string, status: ContentIdeaStatus) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("ai_content_ideas").update({ status }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/content-ideas");
  revalidatePath(`/admin/content-ideas/${id}`);
}

export async function updateContentIdeaNotes(id: string, notes: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("ai_content_ideas").update({ notes }).eq("id", id);

  revalidatePath("/admin/content-ideas");
  revalidatePath(`/admin/content-ideas/${id}`);
}
