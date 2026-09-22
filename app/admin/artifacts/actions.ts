"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_MEDIA_MIME_TYPES } from "@/lib/artifact-media";
import {
  extractYouTubeId,
  slugifyArtifact,
  type Artifact,
  type ArtifactImage,
  type ArtifactLink,
} from "@/lib/artifacts";

export interface SaveArtifactInput {
  artifact_name: string;
  slug: string;
  demo_youtube_url: string | null;
  story_markdown: string | null;
  github_links: ArtifactLink[];
  architecture_images: ArtifactImage[];
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

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: SaveArtifactInput, existing?: Artifact | null) {
  const slug = slugifyArtifact(input.slug || input.artifact_name);
  const demoYoutubeUrl = nullableText(input.demo_youtube_url);
  const now = new Date().toISOString();

  const payload = {
    artifact_name: input.artifact_name.trim(),
    slug,
    published_at: existing?.published_at ?? now,
    demo_youtube_url: demoYoutubeUrl,
    story_markdown: nullableText(input.story_markdown),
    github_links: cleanLinks(input.github_links),
    architecture_images: cleanImages(input.architecture_images),
    updated_at: now,
  };

  validatePayload(payload);
  return payload;
}

function validatePayload(payload: {
  artifact_name: string;
  slug: string;
  demo_youtube_url: string | null;
  story_markdown: string | null;
}) {
  if (!payload.artifact_name) {
    throw new Error("Artifact name is required.");
  }
  if (!payload.slug) {
    throw new Error("Slug is required.");
  }

  const missing = [["how it was implemented", payload.story_markdown]].filter(
    ([, value]) => !value
  );

  if (missing.length > 0) {
    throw new Error(
      `Cannot save yet. Missing: ${missing.map(([label]) => label).join(", ")}.`
    );
  }

  if (payload.demo_youtube_url && !extractYouTubeId(payload.demo_youtube_url)) {
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

/**
 * Extension is derived from the mime type, not the uploaded filename, because
 * `ArtifactMarkdown` decides whether to render a <video> by extension. Trusting
 * the filename would let `clip.MOV` store a `.mov` we cannot detect, or worse a
 * mislabelled extension the browser will not play.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/ogg": "ogv",
};

export interface ArtifactUploadTarget {
  /** Absolute URL the browser PUTs the file to. Authorised by its own token. */
  uploadUrl: string;
  /** Public URL the object will be served from once the PUT succeeds. */
  publicUrl: string;
  path: string;
}

export interface CreateArtifactUploadInput {
  filename: string;
  contentType: string;
  group: string;
}

/**
 * Hands the browser a pre-signed URL so the file goes straight to Supabase
 * Storage. Routing media through a Server Action would cap uploads at the
 * request-body limit and be killed by the serverless function timeout on large
 * video, so the bytes never touch Next.js.
 */
export async function createArtifactUploadUrl(
  input: CreateArtifactUploadInput
): Promise<ArtifactUploadTarget> {
  await requireAdminUser();

  const contentType = input.contentType.trim().toLowerCase();
  if (!(ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(contentType)) {
    throw new Error(
      `Unsupported file type${input.contentType ? `: ${input.contentType}` : ""}. Upload an image or a video.`
    );
  }

  const group =
    input.group
      .toLowerCase()
      .replace(/[^\w-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "draft";

  const extension = EXTENSION_BY_MIME[contentType];
  const path = `artifacts/${group}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("artifact-images")
    .createSignedUploadUrl(path);

  if (error) throw new Error(error.message);

  const { data: publicData } = supabase.storage
    .from("artifact-images")
    .getPublicUrl(path);

  return {
    uploadUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    path,
  };
}
