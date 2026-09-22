"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  createArtifact,
  createArtifactUploadUrl,
  updateArtifact,
  type SaveArtifactInput,
} from "@/app/admin/artifacts/actions";
import {
  MEDIA_ACCEPT,
  formatMegabytes,
  isVideoUrl,
  maxBytesFor,
} from "@/lib/artifact-media";
import type { Artifact, ArtifactImage, ArtifactLink } from "@/lib/artifacts";

function Label({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-mono text-ink-muted">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-y leading-relaxed ${
        mono ? "font-mono" : ""
      }`}
    />
  );
}

function slugifyArtifactInput(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Uploads straight to Supabase with XHR rather than fetch, because fetch still
 * has no upload-progress event and a 40MB clip with no feedback looks hung.
 */
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      // Storage returns a JSON { message } for rejections such as
      // invalid_mime_type or EntityTooLarge; surface that instead of a bare code.
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string };
        reject(new Error(body.message || `Upload failed (HTTP ${xhr.status}).`));
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Upload failed. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Try again."));

    xhr.send(file);
  });
}

function FieldBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function LinkArrayField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: ArtifactLink[];
  onChange: (values: ArtifactLink[]) => void;
}) {
  function update(index: number, patch: Partial<ArtifactLink>) {
    onChange(
      values.map((value, current) =>
        current === index ? { ...value, ...patch } : value
      )
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((link, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[0.6fr_1fr_auto]">
            <Input
              value={link.label}
              onChange={(value) => update(index, { label: value })}
              placeholder="Label"
            />
            <Input
              value={link.url}
              onChange={(value) => update(index, { url: value })}
              placeholder="https://..."
              type="url"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, current) => current !== index))}
              className="text-xs font-mono px-3 py-2 rounded-lg border border-border text-ink-faint hover:text-destructive hover:border-destructive/40 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, { label: "", url: "" }])}
          className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-dashed border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
        >
          + Add link
        </button>
      </div>
    </div>
  );
}

function MediaArrayField({
  artifactName,
  slug,
  values,
  onChange,
}: {
  artifactName: string;
  slug: string;
  values: ArtifactImage[];
  onChange: (values: ArtifactImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const contentType = (file.type || "").toLowerCase();
    const limit = maxBytesFor(contentType);

    if (file.size > limit) {
      setError(
        `That file is ${formatMegabytes(file.size)}. The limit is ${formatMegabytes(
          limit
        )} per ${contentType.startsWith("video/") ? "video" : "image"}.`
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Ask the server for a pre-signed URL, then 2. PUT the bytes straight
      // to Supabase — the file never passes through a Server Action.
      const target = await createArtifactUploadUrl({
        filename: file.name,
        contentType,
        group: slug || artifactName || "draft",
      });

      await putWithProgress(target.uploadUrl, file, contentType, setProgress);

      onChange([
        ...values,
        {
          url: target.publicUrl,
          alt: file.name.replace(/\.[^.]+$/, ""),
          caption: "",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function update(index: number, patch: Partial<ArtifactImage>) {
    onChange(
      values.map((value, current) =>
        current === index ? { ...value, ...patch } : value
      )
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Architecture media</Label>
      {values.map((image, index) => {
        const video = isVideoUrl(image.url);
        return (
          <div
            key={`${image.url}-${index}`}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[180px_1fr]"
          >
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-background">
              {video ? (
                <video
                  src={image.url}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-contain"
                  sizes="180px"
                />
              )}
              {video && (
                <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md border border-border bg-background/85 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
                  video
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Input
                value={image.alt}
                onChange={(value) => update(index, { alt: value })}
                placeholder="Alt text"
              />
              <Input
                value={image.caption ?? ""}
                onChange={(value) => update(index, { caption: value })}
                placeholder="Caption"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(`![${image.alt}](${image.url})`)
                  }
                  className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-faint hover:text-ink hover:border-ink-muted transition-colors"
                >
                  Copy markdown
                </button>
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, current) => current !== index))}
                  className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-faint hover:text-destructive hover:border-destructive/40 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <label className="self-start text-xs font-mono px-3 py-2 rounded-lg border border-dashed border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors cursor-pointer">
          {uploading ? "Uploading..." : "+ Upload image or video"}
          <input
            type="file"
            accept={MEDIA_ACCEPT}
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>

        {uploading && (
          <div className="flex items-center gap-2">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-ink transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-ink-faint">
              {progress}%
            </span>
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-ink-faint">
        Paste the markdown anywhere in the story. Images and videos use the same
        syntax — video URLs render as a player automatically.
      </p>

      {error && <p className="text-xs font-mono text-destructive">{error}</p>}
    </div>
  );
}

export default function ArtifactForm({ initial }: { initial?: Artifact }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [artifactName, setArtifactName] = useState(initial?.artifact_name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  const [demoYoutubeUrl, setDemoYoutubeUrl] = useState(initial?.demo_youtube_url ?? "");

  const [architectureImages, setArchitectureImages] = useState<ArtifactImage[]>(
    initial?.architecture_images ?? []
  );

  const [storyMarkdown, setStoryMarkdown] = useState(initial?.story_markdown ?? "");

  const [githubLinks, setGithubLinks] = useState<ArtifactLink[]>(
    initial?.github_links?.length ? initial.github_links : [{ label: "GitHub", url: "" }]
  );

  function handleArtifactNameChange(value: string) {
    setArtifactName(value);
    if (!initial) setSlug(slugifyArtifactInput(value));
  }

  function buildInput(): SaveArtifactInput {
    return {
      artifact_name: artifactName,
      slug,
      demo_youtube_url: demoYoutubeUrl || null,
      story_markdown: storyMarkdown || null,
      github_links: githubLinks,
      architecture_images: architectureImages,
    };
  }

  function handleSave() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const input = buildInput();
        const result = initial?.id
          ? await updateArtifact(initial.id, input)
          : await createArtifact(input);

        setSaved(true);
        if (!initial) {
          router.replace(`/admin/artifacts/${result.id}`);
        } else {
          router.refresh();
          setTimeout(() => setSaved(false), 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <FieldBlock title="Identity">
        <div className="flex flex-col gap-1.5">
          <Label required>Artifact name</Label>
          <Input
            value={artifactName}
            onChange={handleArtifactNameChange}
            placeholder="Checkout Replay"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Slug</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-faint whitespace-nowrap">
              /artifacts/
            </span>
            <input
              value={slug}
              onChange={(event) =>
                setSlug(slugifyArtifactInput(event.target.value))
              }
              placeholder="checkout-replay"
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
            />
          </div>
        </div>
      </FieldBlock>

      <FieldBlock title="Demo">
        <div className="flex flex-col gap-1.5">
          <Label>YouTube URL (optional)</Label>
          <Input
            value={demoYoutubeUrl}
            onChange={setDemoYoutubeUrl}
            placeholder="https://youtu.be/... (leave blank if there's no demo video)"
            type="url"
          />
        </div>
      </FieldBlock>

      <FieldBlock title="Architecture media">
        <MediaArrayField
          artifactName={artifactName}
          slug={slug}
          values={architectureImages}
          onChange={setArchitectureImages}
        />
      </FieldBlock>

      <FieldBlock title="Story">
        <div className="flex flex-col gap-1.5">
          <Label required>How it was implemented (Markdown)</Label>
          <Textarea
            value={storyMarkdown}
            onChange={setStoryMarkdown}
            rows={24}
            mono
            placeholder={
              "Write it as one continuous piece. ## headings, lists, and ```fenced code``` all render inline.\n\nTo place architecture media inside the story, upload it above and paste its markdown (![alt](url)) wherever it belongs in the text. Video files render as an inline player."
            }
          />
        </div>
      </FieldBlock>

      <FieldBlock title="Links">
        <LinkArrayField label="GitHub links" values={githubLinks} onChange={setGithubLinks} />
      </FieldBlock>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 border-t border-border bg-background/90 py-4 backdrop-blur-sm">
        <div className="min-h-5">
          {error && <p className="text-xs font-mono text-destructive">{error}</p>}
          {saved && <p className="text-xs font-mono text-ink-muted">Saved</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isPending || !artifactName || !slug}
            className="px-4 py-2 text-sm font-semibold bg-ink text-background rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save artifact"}
          </button>
        </div>
      </div>
    </div>
  );
}
