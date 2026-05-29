import { createServiceClient } from "@/lib/supabase/service";

export type ContentIdeaStatus = "idea" | "selected" | "created" | "posted" | "skipped";

export interface ContentIdea {
  id: string;
  created_at: string;
  idea_date: string;
  topic_title: string;
  category: string | null;
  why_now: string | null;
  why_this_is_good: string | null;
  target_audience: string | null;
  content_angle: string | null;
  key_points: unknown[];
  hooks: unknown[];
  video_script: string | null;
  linkedin_post: string | null;
  x_post: string | null;
  source_links: unknown[];
  status: ContentIdeaStatus;
  notes: string | null;
}

export async function getAllContentIdeas(): Promise<ContentIdea[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ai_content_ideas")
    .select("*")
    .order("idea_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as ContentIdea[]) ?? [];
}

export async function getTodayContentIdeas(): Promise<ContentIdea[]> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("ai_content_ideas")
    .select("*")
    .eq("idea_date", today)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as ContentIdea[]) ?? [];
}

export async function getContentIdeaById(id: string): Promise<ContentIdea | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ai_content_ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ContentIdea;
}
