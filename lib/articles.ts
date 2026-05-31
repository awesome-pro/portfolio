import { createServiceClient } from "@/lib/supabase/service";

export interface Article {
  id: number;
  article_date: string;
  title: string;
  alt_titles: string[] | null;
  topic: string | null;
  angle: string | null;
  body_markdown: string;
  header_image_prompt: string | null;
  inline_image_prompts: string[] | null;
  reference_links: string[] | null;
  thread_teaser: string | null;
  tags: string[] | null;
  is_published: boolean | null;
  created_at: string | null;
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("article_date", { ascending: false });

  if (error) return [];
  return (data as Article[]) ?? [];
}

export async function getTodayArticle(): Promise<Article | null> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("article_date", today)
    .maybeSingle();

  if (error) return null;
  return data as Article | null;
}

export async function getArticleById(id: number): Promise<Article | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Article;
}
