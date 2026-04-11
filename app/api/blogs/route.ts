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
 * POST /api/blogs
 *
 * Create a new blog post. All image URLs must already be hosted
 * (use POST /api/upload first if you need to upload an image).
 *
 * Headers:
 *   Authorization: Bearer <BLOG_API_KEY>
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   "title": "My Blog Post",                   // required
 *   "content": "# Heading\n\nMarkdown...",     // required
 *   "excerpt": "Short summary",                 // optional
 *   "slug": "my-blog-post",                     // optional — auto-generated from title
 *   "tags": ["AI", "Engineering"],              // optional
 *   "cover_image_url": "https://...",           // optional
 *   "is_published": true,                       // optional — default: true
 *   "reading_time_minutes": 5                   // optional — auto-calculated if omitted
 * }
 *
 * Response 201:
 * {
 *   "id": "uuid",
 *   "slug": "my-blog-post",
 *   "url": "https://abhinandan.one/blogs/my-blog-post"
 * }
 */
export async function POST(request: Request) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, content, excerpt, slug: rawSlug, tags, cover_image_url, is_published, reading_time_minutes } = body as {
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    tags?: string[];
    cover_image_url?: string;
    is_published?: boolean;
    reading_time_minutes?: number;
  };

  if (!title || typeof title !== "string") {
    return Response.json({ error: "title is required." }, { status: 400 });
  }
  if (!content || typeof content !== "string") {
    return Response.json({ error: "content (markdown) is required." }, { status: 400 });
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(title);
  const publish = is_published !== false; // default to published
  const readTime = typeof reading_time_minutes === "number"
    ? reading_time_minutes
    : estimateReadingTime(content);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title,
      slug,
      excerpt: excerpt ?? null,
      cover_image_url: cover_image_url ?? null,
      content,
      tags: Array.isArray(tags) ? tags : [],
      reading_time_minutes: readTime,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    // Duplicate slug
    if (error.code === "23505") {
      return Response.json(
        { error: `A blog with slug "${slug}" already exists. Provide a unique slug.` },
        { status: 409 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(
    {
      id: data.id,
      slug: data.slug,
      url: `https://abhinandan.one/blogs/${data.slug}`,
    },
    { status: 201 }
  );
}
