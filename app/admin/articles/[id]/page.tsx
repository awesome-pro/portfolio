import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/articles";
import CopyButton from "@/components/admin/CopyButton";
import ArticlePublishToggle from "@/components/admin/ArticlePublishToggle";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionHeader({
  title,
  copyText,
  copyLabel,
}: {
  title: string;
  copyText?: string;
  copyLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
        {title}
      </p>
      {copyText && (
        <CopyButton text={copyText} label={copyLabel ?? `Copy ${title}`} />
      )}
    </div>
  );
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(Number(id));
  if (!article) notFound();

  const today = new Date().toISOString().split("T")[0];
  const isToday = article.article_date === today;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0">
            <Link
              href="/admin/articles"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Articles
            </Link>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {isToday && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                  Today
                </span>
              )}
              <span className="text-xs font-mono text-ink-faint">
                {formatDate(article.article_date)}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink mt-2 break-words">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {article.topic && (
                <p className="text-xs font-mono text-ink-muted">{article.topic}</p>
              )}
              {article.angle && (
                <p className="text-xs font-mono text-ink-faint">· {article.angle}</p>
              )}
            </div>
          </div>
          <ArticlePublishToggle
            id={article.id}
            isPublished={article.is_published ?? false}
          />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2.5 py-1 rounded-lg border bg-background text-ink-muted border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Thread teaser — first because it's the Twitter opener */}
          {article.thread_teaser && (
            <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
              <SectionHeader
                title="Thread Teaser"
                copyText={article.thread_teaser}
                copyLabel="Copy teaser"
              />
              <pre className="text-sm text-ink leading-7 whitespace-pre-wrap font-sans">
                {article.thread_teaser}
              </pre>
            </div>
          )}

          {/* Body — the main content */}
          <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
            <SectionHeader
              title="Article Body"
              copyText={article.body_markdown}
              copyLabel="Copy article"
            />
            <pre className="text-sm text-ink leading-7 whitespace-pre-wrap font-sans">
              {article.body_markdown}
            </pre>
          </div>

          {/* Alt titles */}
          {article.alt_titles && article.alt_titles.length > 0 && (
            <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
              <SectionHeader
                title="Alt Titles"
                copyText={article.alt_titles.join("\n")}
                copyLabel="Copy all"
              />
              <div className="flex flex-col gap-2">
                {article.alt_titles.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 py-1"
                  >
                    <p className="text-sm text-ink flex-1">{title}</p>
                    <CopyButton text={title} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header image prompt */}
          {article.header_image_prompt && (
            <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
              <SectionHeader
                title="Header Image Prompt"
                copyText={article.header_image_prompt}
                copyLabel="Copy prompt"
              />
              <p className="text-sm text-ink leading-6 font-mono">
                {article.header_image_prompt}
              </p>
            </div>
          )}

          {/* Inline image prompts */}
          {article.inline_image_prompts && article.inline_image_prompts.length > 0 && (
            <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
              <SectionHeader
                title="Inline Image Prompts"
                copyText={article.inline_image_prompts.join("\n\n")}
                copyLabel="Copy all"
              />
              <div className="flex flex-col gap-3">
                {article.inline_image_prompts.map((prompt, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 p-3 bg-background border border-border rounded-xl"
                  >
                    <p className="text-sm text-ink font-mono flex-1 leading-6">
                      {prompt}
                    </p>
                    <CopyButton text={prompt} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference links */}
          {article.reference_links && article.reference_links.length > 0 && (
            <div className="flex flex-col gap-3 p-5 border border-border rounded-2xl bg-surface">
              <SectionHeader title="Reference Links" />
              <div className="flex flex-col gap-1.5">
                {article.reference_links.map((url, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <a
                      href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-ink-muted hover:text-ink break-all transition-colors flex-1"
                    >
                      {url}
                    </a>
                    <CopyButton text={url} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
