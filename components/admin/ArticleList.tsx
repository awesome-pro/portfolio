"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Article } from "@/lib/articles";

const PAGE_SIZE = 30;

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

export default function ArticleList({ articles }: { articles: Article[] }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "published" | "unpublished">("all");

  const filtered = useMemo(() => {
    if (filter === "published") return articles.filter((a) => a.is_published);
    if (filter === "unpublished") return articles.filter((a) => !a.is_published);
    return articles;
  }, [articles, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageArticles = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const counts = useMemo(
    () => ({
      all: articles.length,
      published: articles.filter((a) => a.is_published).length,
      unpublished: articles.filter((a) => !a.is_published).length,
    }),
    [articles]
  );

  const filters: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unpublished", label: "Unpublished" },
    { value: "published", label: "Published" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1); }}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              filter === value
                ? "bg-ink text-background border-ink"
                : "bg-surface text-ink-muted border-border hover:text-ink"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
        {pageArticles.map((article) => {
          const today = isToday(article.article_date);
          return (
            <Link
              key={article.id}
              href={`/admin/articles/${article.id}`}
              className="group flex items-center justify-between gap-4 px-5 py-4 bg-surface hover:bg-background transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {today && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                      Today
                    </span>
                  )}
                  {article.is_published ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-green-50 text-green-700 border-green-200">
                      Published
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-surface text-ink-faint border-border">
                      Draft
                    </span>
                  )}
                  {article.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono px-2 py-0.5 rounded-md border bg-background text-ink-muted border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-ink truncate">
                  {article.title}
                </p>
                <p className="text-xs font-mono text-ink-faint mt-0.5">
                  {formatDate(article.article_date)}
                  {article.topic && ` · ${article.topic}`}
                </p>
              </div>
              <span className="text-ink-faint group-hover:text-ink transition-colors shrink-0">
                →
              </span>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-mono text-ink-faint">
            Page {safePage} of {totalPages} &middot; {filtered.length} articles
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              disabled={safePage === 1}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              disabled={safePage === totalPages}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
