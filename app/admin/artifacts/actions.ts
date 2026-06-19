"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  extractYouTubeId,
  slugifyArtifact,
  type Artifact,
  type ArtifactCodeSnippet,
  type ArtifactFailureCase,
  type ArtifactImage,
  type ArtifactLink,
  type ArtifactMetric,
  type ArtifactStatus,
  type ArtifactTradeoff,
} from "@/lib/artifacts";

export interface SaveArtifactInput {
  artifact_name: string;
  slug: string;
  tagline: string | null;
  status: ArtifactStatus;
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
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

function cleanStrings(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function cleanLinks(values: ArtifactLink[]) {
  return values
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label && link.url);
}

function cleanImages(values: ArtifactImage[]) {
  return values
    .map((image) => ({
      url: image.url.trim(),
      alt: image.alt.trim() || "Artifact image",
      caption: image.caption?.trim() || undefined,
    }))
    .filter((image) => image.url);
}

function cleanMetrics(values: ArtifactMetric[]) {
  return values
    .map((metric) => ({
      label: metric.label.trim(),
      value: metric.value.trim(),
      note: metric.note?.trim() || undefined,
    }))
    .filter((metric) => metric.label && metric.value);
}

function cleanFailureCases(values: ArtifactFailureCase[]) {
  return values
    .map((failure) => ({
      title: failure.title.trim(),
      detail: failure.detail.trim(),
      recovery: failure.recovery?.trim() || undefined,
    }))
    .filter((failure) => failure.title && failure.detail);
}

function cleanTradeoffs(values: ArtifactTradeoff[]) {
  return values
    .map((tradeoff) => ({
      title: tradeoff.title.trim(),
      upside: tradeoff.upside?.trim() || undefined,
      cost: tradeoff.cost.trim(),
    }))
    .filter((tradeoff) => tradeoff.title && tradeoff.cost);
}

function cleanCodeSnippets(values: ArtifactCodeSnippet[]) {
  return values
    .map((snippet) => ({
      label: snippet.label.trim(),
      language: snippet.language.trim() || "text",
      code: snippet.code.trim(),
    }))
    .filter((snippet) => snippet.label && snippet.code);
}

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: SaveArtifactInput, existing?: Artifact | null) {
  const slug = slugifyArtifact(input.slug || input.artifact_name);
  const status = input.status;
  const demoYoutubeUrl = nullableText(input.demo_youtube_url);
  const architectureImages = cleanImages(input.architecture_images);
  const architectureComponents = cleanStrings(input.architecture_components);
  const dataFlow = cleanStrings(input.data_flow);
  const now = new Date().toISOString();
  const publishedAt =
    status === "draft" ? null : existing?.published_at ?? now;

  const payload = {
    artifact_name: input.artifact_name.trim(),
    slug,
    tagline: nullableText(input.tagline),
    status,
    published_at: publishedAt,
    demo_youtube_url: demoYoutubeUrl,
    demo_summary: nullableText(input.demo_summary),
    what_to_watch_for: cleanStrings(input.what_to_watch_for),
    problem_markdown: nullableText(input.problem_markdown),
    what_i_built_markdown: nullableText(input.what_i_built_markdown),
    architecture_markdown: nullableText(input.architecture_markdown),
    implementation_markdown: nullableText(input.implementation_markdown),
    github_links: cleanLinks(input.github_links),
    related_links: cleanLinks(input.related_links),
    architecture_images: architectureImages,
    architecture_components: architectureComponents,
    data_flow: dataFlow,
    llm_used_for: cleanStrings(input.llm_used_for),
    llm_not_used_for: cleanStrings(input.llm_not_used_for),
    metrics: cleanMetrics(input.metrics),
    failure_cases: cleanFailureCases(input.failure_cases),
    tradeoffs: cleanTradeoffs(input.tradeoffs),
    code_snippets: cleanCodeSnippets(input.code_snippets),
    tools_libraries: cleanStrings(input.tools_libraries),
    updated_at: now,
  };

  validatePayload(payload);
  return payload;
}

function validatePayload(payload: {
  artifact_name: string;
  slug: string;
  status: ArtifactStatus;
  demo_youtube_url: string | null;
  problem_markdown: string | null;
  what_i_built_markdown: string | null;
  architecture_markdown: string | null;
  implementation_markdown: string | null;
  architecture_images: ArtifactImage[];
  architecture_components: string[];
  data_flow: string[];
}) {
  if (!payload.artifact_name) {
    throw new Error("Artifact name is required.");
  }
  if (!payload.slug) {
    throw new Error("Slug is required.");
  }

  if (payload.status === "draft") return;

  const missing = [
    ["YouTube demo URL", payload.demo_youtube_url],
    ["problem", payload.problem_markdown],
    ["what I built", payload.what_i_built_markdown],
    ["implementation details", payload.implementation_markdown],
  ].filter(([, value]) => !value);

  const hasArchitecture =
    payload.architecture_markdown ||
    payload.architecture_images.length > 0 ||
    payload.architecture_components.length > 0 ||
    payload.data_flow.length > 0;

  if (!hasArchitecture) {
    missing.push(["architecture", null]);
  }

  if (missing.length > 0) {
    throw new Error(
      `Cannot publish/build yet. Missing: ${missing
        .map(([label]) => label)
        .join(", ")}.`
    );
  }

  if (!extractYouTubeId(payload.demo_youtube_url)) {
    throw new Error("Use a valid YouTube URL or 11-character YouTube video ID.");
  }
}

function revalidateArtifactPaths(slug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/artifacts");
  revalidatePath("/artifacts");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/artifacts/${slug}`);
}

export async function createArtifact(input: SaveArtifactInput) {
  await requireAdminUser();

  const payload = normalizeInput(input);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An artifact with that slug already exists.");
    }
    throw new Error(error.message);
  }

  revalidateArtifactPaths(data.slug);
  return { id: data.id as string, slug: data.slug as string };
}

export async function updateArtifact(id: string, input: SaveArtifactInput) {
  await requireAdminUser();

  const supabase = createServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new Error("Artifact not found.");
  }

  const existingArtifact = existing as Artifact;
  const payload = normalizeInput(input, existingArtifact);
  const { data, error } = await supabase
    .from("artifacts")
    .update(payload)
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An artifact with that slug already exists.");
    }
    throw new Error(error.message);
  }

  revalidateArtifactPaths(existingArtifact.slug);
  revalidateArtifactPaths(data.slug as string);
  revalidatePath(`/admin/artifacts/${id}`);
  return { id: data.id as string, slug: data.slug as string };
}

export async function deleteArtifact(id: string) {
  await requireAdminUser();

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("artifacts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("artifacts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateArtifactPaths((existing as { slug?: string } | null)?.slug);
}

export async function uploadArtifactImage(formData: FormData) {
  await requireAdminUser();

  const file = formData.get("file");
  const group = String(formData.get("group") || "draft")
    .toLowerCase()
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!file || !(file instanceof File)) {
    throw new Error("Choose an image file to upload.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Artifact uploads must be images.");
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    file.type.split("/")[1]?.replace("jpeg", "jpg") ||
    "jpg";
  const path = `artifacts/${group || "draft"}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;
  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("artifact-images")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("artifact-images").getPublicUrl(path);
  return {
    url: data.publicUrl,
    alt: file.name.replace(/\.[^.]+$/, ""),
  };
}
