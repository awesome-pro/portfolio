"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export async function deleteProductOpportunity(id: string) {
  await requireAdminSession();

  const supabase = createServiceClient();
  await supabase.from("product_opportunities").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/product-opportunities");
  revalidatePath(`/admin/product-opportunities/${id}`);
}
