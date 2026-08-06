import { createServiceClient } from "@/lib/supabase/service";
import { createStaticClient } from "@/lib/supabase/static";

export interface ArtifactLink {
  label: string;
  url: string;
}

export interface ArtifactImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface Artifact {
  id: string;
  serial_number: number;
  slug: string;
  artifact_name: string;
  published_at: string | null;
  demo_youtube_url: string | null;
  story_markdown: string | null;
  github_links: ArtifactLink[];
  architecture_images: ArtifactImage[];
  created_at: string;
  updated_at: string;
}

export type ArtifactInput = Omit<
  Artifact,
  "id" | "serial_number" | "created_at" | "updated_at"
>;

export function slugifyArtifact(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

export function youtubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

function normalizeArtifact(row: Record<string, unknown>): Artifact {
  return {
    ...(row as unknown as Artifact),
    github_links: normalizeArray<ArtifactLink>(row.github_links),
    architecture_images: normalizeArray<ArtifactImage>(row.architecture_images),
  };
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function getPublicArtifacts(): Promise<Artifact[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("serial_number", { ascending: false });

  if (error) return [];
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeArtifact);
}

export async function getLatestArtifacts(limit = 3): Promise<Artifact[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("serial_number", { ascending: false })
    .limit(limit);

  if (error) return [];
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeArtifact);
}

export async function getArtifactBySlugStatic(
  slug: string
): Promise<Artifact | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return normalizeArtifact(data as Record<string, unknown>);
}

export async function getAllArtifactSlugsStatic(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("slug");

  if (error) return [];
  return (data ?? []).map((artifact: { slug: string }) => artifact.slug);
}

export async function getAllArtifactsAdmin(): Promise<Artifact[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeArtifact);
}

export async function getArtifactById(id: string): Promise<Artifact | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return normalizeArtifact(data as Record<string, unknown>);
}
