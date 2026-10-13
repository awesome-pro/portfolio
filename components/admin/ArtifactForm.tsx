"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  createArtifact,
  updateArtifact,
  type SaveArtifactInput,
} from "@/app/admin/artifacts/actions";
import MarkdownWriter, {
  type MarkdownWriterHandle,
} from "@/components/admin/MarkdownWriter";
import {
  MEDIA_ACCEPT,
  isVideoUrl,
  mediaMarkdown,
} from "@/lib/artifact-media";
import { uploadArtifactMedia } from "@/lib/artifact-upload";
import type { Artifact, ArtifactImage, ArtifactLink } from "@/lib/artifacts";

/**
 * The form's starting values, in exactly the shape `buildInput` produces, so the
 * "unsaved changes" check starts clean instead of tripping over "" vs null.
 */
function buildInputFrom(artifact?: Artifact): SaveArtifactInput {
  return {
    artifact_name: artifact?.artifact_name ?? "",
    slug: artifact?.slug ?? "",
    demo_youtube_url: artifact?.demo_youtube_url || null,
    story_markdown: artifact?.story_markdown || null,
    github_links: artifact?.github_links?.length
      ? artifact.github_links
      : [{ label: "GitHub", url: "" }],
    architecture_images: artifact?.architecture_images ?? [],
  };
}

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
      className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
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
  onInsertMarkdown,
}: {
  artifactName: string;
  slug: string;
  values: ArtifactImage[];
  onChange: (values: ArtifactImage[]) => void;
  /** Drops this media's markdown into the story at the writer's caret. */
  onInsertMarkdown?: (markdown: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // The helper asks the server for a pre-signed URL and PUTs the bytes
      // straight to Supabase — the file never passes through a Server Action.
      const media = await uploadArtifactMedia(
        file,
        slug || artifactName || "draft",
        setProgress
      );

      onChange([
        ...values,
        { url: media.url, alt: media.alt, caption: "" },
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
            className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-elevated p-3 sm:grid-cols-[180px_1fr]"
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
              <div className="flex flex-wrap items-center gap-2">
                {onInsertMarkdown && (
                  <button
                    type="button"
                    onClick={() =>
                      onInsertMarkdown(
                        mediaMarkdown({
                          url: image.url,
                          alt: image.alt || "artifact image",
                        })
                      )
                    }
                    className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
                  >
                    Insert into story
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(mediaMarkdown(image))
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
        &quot;Insert into story&quot; drops this markdown wherever your caret is.
        Images and videos share one syntax — a video URL renders as a player
        automatically.
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

  const writerRef = useRef<MarkdownWriterHandle | null>(null);

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

  // What the database last accepted, compared against the live form. Both sides
  // are the client's own shape, so the server's normalisation (trimming, dropping
  // blank links) cannot leave the form permanently "dirty".
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(buildInputFrom(initial))
  );
  const dirty = JSON.stringify(buildInput()) !== savedSnapshot;

  // A half-written artifact is worth a browser warning before it is lost.
  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function handleSave() {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const input = buildInput();
        const result = initial?.id
          ? await updateArtifact(initial.id, input)
          : await createArtifact(input);

        setSavedSnapshot(JSON.stringify(input));
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
              className="flex-1 bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
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
          onInsertMarkdown={(markdown) =>
            writerRef.current?.insertMarkdown(markdown)
          }
        />
      </FieldBlock>

      <FieldBlock title="Story">
        <div className="flex flex-col gap-1.5">
          <Label required>How it was implemented</Label>
          <MarkdownWriter
            value={storyMarkdown}
            onChange={setStoryMarkdown}
            onSave={() => handleSave()}
            saving={isPending}
            dirty={dirty}
            group={slug || artifactName || "draft"}
            title={artifactName}
            handleRef={writerRef}
          />
        </div>
      </FieldBlock>

      <FieldBlock title="Links">
        <LinkArrayField label="GitHub links" values={githubLinks} onChange={setGithubLinks} />
      </FieldBlock>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 border-t border-border bg-background/90 py-4 backdrop-blur-sm">
        <div className="min-h-5">
          {error ? (
            <p className="text-xs font-mono text-destructive">{error}</p>
          ) : isPending ? (
            <p className="text-xs font-mono text-ink-muted">saving…</p>
          ) : dirty ? (
            <p className="text-xs font-mono text-ink-faint">unsaved changes</p>
          ) : (
            saved && <p className="text-xs font-mono text-ink-muted">saved</p>
          )}
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
