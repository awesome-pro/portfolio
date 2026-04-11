"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/client";
import type { Blog } from "@/lib/blogs";
import BlogEditor from "@/components/admin/BlogEditor";
import CoverImageUpload from "@/components/admin/CoverImageUpload";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

interface BlogFormProps {
  initial?: Blog;
}

export default function BlogForm({ initial }: BlogFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [tagsInput, setTagsInput] = useState(
    (initial?.tags ?? []).join(", ")
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initial?.cover_image_url ?? null
  );
  const [content, setContent] = useState<JSONContent>(
    (initial?.content as JSONContent) ?? {}
  );
  const [contentText, setContentText] = useState(initial?.content_text ?? "");
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleEditorChange = useCallback(
    (json: JSONContent, text: string) => {
      setContent(json);
      setContentText(text);
    },
    []
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!initial) {
      setSlug(slugify(val));
    }
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setSaving(false);
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const readingTime = estimateReadingTime(contentText);

    const shouldPublish = publish || isPublished;
    const publishedAt =
      shouldPublish && !initial?.published_at
        ? new Date().toISOString()
        : initial?.published_at ?? null;

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      cover_image_url: coverImageUrl,
      content,
      content_text: contentText,
      tags,
      reading_time_minutes: readingTime,
      is_published: shouldPublish,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
      author_id: user.id,
    };

    if (initial?.id) {
      const { error: updateError } = await supabase
        .from("blogs")
        .update(payload)
        .eq("id", initial.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: newBlog, error: insertError } = await supabase
        .from("blogs")
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      // Navigate to edit page after creation so save works correctly
      router.replace(`/admin/edit/${newBlog.id}`);
      setSaving(false);
      setSaved(true);
      return;
    }

    setIsPublished(shouldPublish);
    setSaving(false);
    setSaved(true);

    // Brief flash then clear the saved indicator
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted font-mono">
          Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-lg font-semibold text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
          placeholder="Blog post title"
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted font-mono">
          Slug (URL) *
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-faint whitespace-nowrap">
            /blogs/
          </span>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
            placeholder="my-blog-post"
          />
        </div>
      </div>

      {/* Cover image */}
      <CoverImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />

      {/* Excerpt */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted font-mono">
          Excerpt (shown in cards & SEO)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-none leading-relaxed"
          placeholder="A short summary of this post…"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted font-mono">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors font-mono"
          placeholder="AI, Engineering, Tutorial"
        />
      </div>

      {/* Editor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted font-mono">
          Content
        </label>
        <BlogEditor
          initialContent={
            initial?.content
              ? (initial.content as JSONContent)
              : undefined
          }
          onChange={handleEditorChange}
        />
      </div>

      {/* Footer bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setIsPublished(!isPublished)}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              isPublished ? "bg-ink" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform ${
                isPublished ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </div>
          <span className="text-sm text-ink-muted">
            {isPublished ? "Published" : "Draft"}
          </span>
        </label>

        <div className="flex items-center gap-3">
          {error && (
            <p className="text-xs text-destructive font-mono">{error}</p>
          )}
          {saved && (
            <p className="text-xs text-ink-muted font-mono">Saved ✓</p>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || !title || !slug}
            className="px-4 py-2 text-sm font-medium border border-border text-ink-muted rounded-xl hover:border-ink-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !title || !slug}
            className="px-4 py-2 text-sm font-semibold bg-ink text-background rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : isPublished ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
