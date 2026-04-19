import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content: string; // raw markdown
  tags: string[];
  reading_time_minutes: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  likes: number;
  views: number;
}

export async function getPublishedBlogs(options?: {
  tag?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ blogs: Blog[]; total: number }> {
  const supabase = await createClient();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 8;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) throw error;

  return { blogs: (data as Blog[]) ?? [], total: count ?? 0 };
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data as Blog;
}

// Build-time / ISR version — no cookies(), safe for statically-rendered routes
export async function getBlogBySlugStatic(slug: string): Promise<Blog | null> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data as Blog;
}

export async function getLatestBlogs(limit = 3): Promise<Blog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as Blog[]) ?? [];
}

export async function getAllSlugs(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("slug")
    .eq("is_published", true);

  if (error) return [];
  return (data ?? []).map((b: { slug: string }) => b.slug);
}

// Build-time version — no cookies(), safe for generateStaticParams & sitemap
export async function getAllSlugsStatic(): Promise<string[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("slug")
    .eq("is_published", true);

  if (error) return [];
  return (data ?? []).map((b: { slug: string }) => b.slug);
}

// Admin: fetch ALL blogs (published + drafts) for the dashboard
export async function getAllBlogsAdmin(): Promise<Blog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as Blog[]) ?? [];
}

// Admin: fetch a single blog by ID regardless of published status
export async function getBlogById(id: string): Promise<Blog | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Blog;
}

export async function getAllTags(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("tags")
    .eq("is_published", true);

  if (error) return [];

  const tagSet = new Set<string>();
  (data ?? []).forEach((b: { tags: string[] }) => {
    (b.tags ?? []).forEach((t) => tagSet.add(t));
  });

  return Array.from(tagSet).sort();
}
