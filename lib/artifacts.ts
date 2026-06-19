import { createServiceClient } from "@/lib/supabase/service";
import { createStaticClient } from "@/lib/supabase/static";

export type ArtifactStatus = "shipped" | "building" | "draft";

export interface ArtifactLink {
  label: string;
  url: string;
}

export interface ArtifactImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface ArtifactMetric {
  label: string;
  value: string;
  note?: string;
}

export interface ArtifactFailureCase {
  title: string;
  detail: string;
  recovery?: string;
}

export interface ArtifactTradeoff {
  title: string;
  upside?: string;
  cost: string;
}

export interface ArtifactCodeSnippet {
  label: string;
  language: string;
  code: string;
}

export interface Artifact {
  id: string;
  serial_number: number;
  slug: string;
  artifact_name: string;
  tagline: string | null;
  status: ArtifactStatus;
  published_at: string | null;
  demo_youtube_url: string | null;
  demo_summary: string | null;
  what_to_watch_for: string[];
  problem_markdown: string | null;
  what_i_built_markdown: string | null;
  architecture_markdown: string | null;
  implementation_markdown: string | null;
  github_links: ArtifactLink[];
  related_links: ArtifactLink[];
  architecture_images: ArtifactImage[];
  architecture_components: string[];
  data_flow: string[];
  llm_used_for: string[];
  llm_not_used_for: string[];
  metrics: ArtifactMetric[];
  failure_cases: ArtifactFailureCase[];
  tradeoffs: ArtifactTradeoff[];
  code_snippets: ArtifactCodeSnippet[];
  tools_libraries: string[];
  created_at: string;
  updated_at: string;
}

export type ArtifactInput = Omit<
  Artifact,
  "id" | "serial_number" | "created_at" | "updated_at"
>;

export const PUBLIC_ARTIFACT_STATUSES: ArtifactStatus[] = [
  "shipped",
  "building",
];

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
    related_links: normalizeArray<ArtifactLink>(row.related_links),
    architecture_images: normalizeArray<ArtifactImage>(row.architecture_images),
    architecture_components: normalizeArray<string>(row.architecture_components),
    data_flow: normalizeArray<string>(row.data_flow),
    metrics: normalizeArray<ArtifactMetric>(row.metrics),
    failure_cases: normalizeArray<ArtifactFailureCase>(row.failure_cases),
    tradeoffs: normalizeArray<ArtifactTradeoff>(row.tradeoffs),
    code_snippets: normalizeArray<ArtifactCodeSnippet>(row.code_snippets),
    what_to_watch_for: normalizeArray<string>(row.what_to_watch_for),
    llm_used_for: normalizeArray<string>(row.llm_used_for),
    llm_not_used_for: normalizeArray<string>(row.llm_not_used_for),
    tools_libraries: normalizeArray<string>(row.tools_libraries),
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
    .in("status", PUBLIC_ARTIFACT_STATUSES)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("serial_number", { ascending: false });

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
    .in("status", PUBLIC_ARTIFACT_STATUSES)
    .single();

  if (error || !data) return null;
  return normalizeArtifact(data as Record<string, unknown>);
}

export async function getAllArtifactSlugsStatic(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("artifacts")
    .select("slug")
    .in("status", PUBLIC_ARTIFACT_STATUSES);

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
