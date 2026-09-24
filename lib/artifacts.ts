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
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type ArtifactInput = Omit<
  Artifact,
  "id" | "serial_number" | "view_count" | "created_at" | "updated_at"
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

/**
 * Pull a plain-text lead sentence out of an artifact's markdown so index
 * listings can say what the work actually is, not just its title.
 * Fenced code, images, tables, quotes and heading lines are skipped.
 */
export function artifactExcerpt(
  story: string | null | undefined,
  maxLength = 180
): string {
  if (!story) return "";

  const withoutCode = story.replace(/```[\s\S]*?```/g, "\n\n");

  const paragraphs = withoutCode
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const lead = paragraphs.find(
    (paragraph) =>
      !/^#{1,6}\s/.test(paragraph) &&
      !/^[|>]/.test(paragraph) &&
      !/^!\[/.test(paragraph)
  );
  if (!lead) return "";

  const plain = lead
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

function normalizeArtifact(row: Record<string, unknown>): Artifact {
  return {
    ...(row as unknown as Artifact),
    // Tolerate a database that predates migrations/artifact_views.sql.
    view_count: typeof row.view_count === "number" ? row.view_count : 0,
    github_links: normalizeArray<ArtifactLink>(row.github_links),
    architecture_images: normalizeArray<ArtifactImage>(row.architecture_images),
  };
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function getPublicArtifacts(): Promise<Artifact[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("artifacts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("serial_number", { ascending: false });

    if (error) return [];
    return ((data as Record<string, unknown>[]) ?? []).map(normalizeArtifact);
  } catch {
    // Missing or unreachable Supabase env (e.g. a local build), degrade quietly.
    return [];
  }
}

export async function getLatestArtifacts(limit = 3): Promise<Artifact[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("artifacts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("serial_number", { ascending: false })
      .limit(limit);

    if (error) return [];
    return ((data as Record<string, unknown>[]) ?? []).map(normalizeArtifact);
  } catch {
    return [];
  }
}

/**
 * slug -> view_count for every artifact, in one lightweight query (no
 * story_markdown payload). Powers /api/artifacts/views, which the client uses
 * to refresh the counts baked into the static HTML. Returns {} if the view
 * count column does not exist yet, so the UI degrades to the ISR value.
 */
export async function getArtifactViewCounts(): Promise<Record<string, number>> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("artifacts")
      .select("slug, view_count");

    if (error) return {};
    return Object.fromEntries(
      (data ?? []).map((row: { slug: string; view_count: number | null }) => [
        row.slug,
        row.view_count ?? 0,
      ])
    );
  } catch {
    return {};
  }
}

export async function getArtifactBySlugStatic(
  slug: string
): Promise<Artifact | null> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("artifacts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return normalizeArtifact(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getAllArtifactSlugsStatic(): Promise<string[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("artifacts")
      .select("slug");

    if (error) return [];
    return (data ?? []).map((artifact: { slug: string }) => artifact.slug);
  } catch {
    return [];
  }
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
