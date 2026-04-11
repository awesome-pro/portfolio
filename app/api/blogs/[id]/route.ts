import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/[#*_~>|-]/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * PUT /api/blogs/[id]
 *
 * Update an existing blog post. Only fields you provide are updated.
 *
 * Headers:
 *   Authorization: Bearer <BLOG_API_KEY>
 *   Content-Type: application/json
 *
 * Body (all fields optional):
 * {
 *   "title": "Updated Title",
 *   "content": "Updated markdown...",
 *   "excerpt": "Updated summary",
 *   "slug": "updated-slug",
 *   "tags": ["AI"],
 *   "cover_image_url": "https://...",
 *   "is_published": true
 * }
 *
 * Response 200:
 * {
 *   "id": "uuid",
 *   "slug": "updated-slug",
 *   "url": "https://abhinandan.one/blogs/updated-slug"
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch existing blog first
  const { data: existing, error: fetchError } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: "Blog not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.content === "string") {
    updates.content = body.content;
    updates.reading_time_minutes =
      typeof body.reading_time_minutes === "number"
        ? body.reading_time_minutes
        : estimateReadingTime(body.content as string);
  }
  if (typeof body.excerpt === "string") updates.excerpt = body.excerpt;
  if (typeof body.slug === "string") updates.slug = slugify(body.slug as string);
  if (Array.isArray(body.tags)) updates.tags = body.tags;
  if (typeof body.cover_image_url === "string" || body.cover_image_url === null) {
    updates.cover_image_url = body.cover_image_url;
  }
  if (typeof body.is_published === "boolean") {
    updates.is_published = body.is_published;
    if (body.is_published && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blogs")
    .update(updates)
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "A blog with that slug already exists." }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: data.id,
    slug: data.slug,
    url: `https://abhinandan.one/blogs/${data.slug}`,
  });
}

/**
 * DELETE /api/blogs/[id]
 *
 * Permanently delete a blog post.
 *
 * Headers:
 *   Authorization: Bearer <BLOG_API_KEY>
 *
 * Response 200:
 * { "deleted": true, "id": "uuid" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("blogs").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deleted: true, id });
}
