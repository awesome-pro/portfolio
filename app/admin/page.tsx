import Link from "next/link";
import { getAllBlogsAdmin } from "@/lib/blogs";
import { getAllProductOpportunities } from "@/lib/product-opportunities";
import { getAllRepos } from "@/lib/repos";
import { getAllContentIdeas } from "@/lib/content-ideas";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const [blogs, repos, opportunities, contentIdeas] = await Promise.all([
    getAllBlogsAdmin(),
    getAllRepos(),
    getAllProductOpportunities(),
    getAllContentIdeas(),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todayIdeasCount = contentIdeas.filter((i) => i.idea_date === today).length;
  const selectedIdeasCount = contentIdeas.filter((i) => i.status === "selected").length;

  const publishedCount = blogs.filter((b) => b.is_published).length;
  const suggestedCount = repos.filter((r) => (r.status ?? "suggested") === "suggested").length;
  const startedCount = repos.filter((r) => r.status === "started").length;
  const topOpportunityCount = opportunities.filter(
    (opportunity) => (opportunity.clone_opportunity_score ?? 0) >= 8
  ).length;
  const highConfidenceCount = opportunities.filter(
    (opportunity) => opportunity.revenue_confidence === "high"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1">
              Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/blogs"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Blog
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">All Posts</h2>
            <p className="font-mono text-xs text-ink-faint">
              {blogs.length} total · {publishedCount} published
            </p>
          </Link>

          <Link
            href="/admin/repos"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Contributions
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">Contribution Targets</h2>
            <p className="font-mono text-xs text-ink-faint">
              {repos.length} total · {suggestedCount} to review · {startedCount} in progress
            </p>
          </Link>

          <Link
            href="/admin/product-opportunities"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Products
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Product Opportunities
            </h2>
            <p className="font-mono text-xs text-ink-faint">
              {opportunities.length} total · {topOpportunityCount} top score ·{" "}
              {highConfidenceCount} high confidence
            </p>
          </Link>

          <Link
            href="/admin/content-ideas"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Content
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Content Ideas
            </h2>
            <p className="font-mono text-xs text-ink-faint">
              {contentIdeas.length} total · {todayIdeasCount} today ·{" "}
              {selectedIdeasCount} selected
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
