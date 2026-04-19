import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("likes, views")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return Response.json({ likes: 0, views: 0 });
  return Response.json({ likes: data.likes ?? 0, views: data.views ?? 0 });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { action } = await req.json();

  if (!["view", "like", "unlike"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const fn =
    action === "view"
      ? "increment_blog_views"
      : action === "like"
      ? "increment_blog_likes"
      : "decrement_blog_likes";

  const { data, error } = await supabase.rpc(fn, { p_slug: slug });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const row = Array.isArray(data) ? data[0] : data;
  return Response.json({ likes: row?.likes ?? 0, views: row?.views ?? 0 });
}
