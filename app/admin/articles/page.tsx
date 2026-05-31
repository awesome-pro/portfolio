import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import ArticleList from "@/components/admin/ArticleList";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ArticlesAdminPage() {
  const articles = await getAllArticles();
  const today = new Date().toISOString().split("T")[0];
  const todayArticle = articles.find((a) => a.article_date === today);
  const publishedCount = articles.filter((a) => a.is_published).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-6 mb-10">
          <div>
            <Link
              href="/admin"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Articles
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {articles.length} total &middot; {publishedCount} published
            </span>
            <SignOutButton />
          </div>
        </div>

        {/* Today's article callout */}
        {todayArticle ? (
          <Link
            href={`/admin/articles/${todayArticle.id}`}
            className="group flex flex-col gap-2 p-5 mb-8 border border-amber-200 bg-amber-50 rounded-2xl hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-100 text-amber-700 border-amber-200">
                  Today
                </span>
                {todayArticle.is_published && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-green-50 text-green-700 border-green-200">
                    Published
                  </span>
                )}
              </div>
              <span className="text-amber-500 group-hover:text-amber-700 transition-colors">
                Open →
              </span>
            </div>
            <p className="text-base font-semibold text-ink">
              {todayArticle.title}
            </p>
            {todayArticle.topic && (
              <p className="text-xs font-mono text-ink-muted">
                {todayArticle.topic}
              </p>
            )}
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-5 mb-8 border border-dashed border-border rounded-2xl">
            <p className="text-sm font-mono text-ink-faint">
              No article for today yet — the agent will add it soon.
            </p>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm">
              No articles yet.
            </p>
          </div>
        ) : (
          <ArticleList articles={articles} />
        )}
      </div>
    </div>
  );
}
