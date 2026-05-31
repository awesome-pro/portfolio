"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthorized");
}

export async function toggleArticlePublished(id: number, isPublished: boolean) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase
    .from("articles")
    .update({ is_published: isPublished })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
}
