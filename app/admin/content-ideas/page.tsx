import Link from "next/link";
import { getAllContentIdeas } from "@/lib/content-ideas";
import ContentIdeaList from "@/components/admin/ContentIdeaList";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ContentIdeasAdminPage() {
  const ideas = await getAllContentIdeas();
  const today = new Date().toISOString().split("T")[0];
  const todayCount = ideas.filter((i) => i.idea_date === today).length;
  const selectedCount = ideas.filter((i) => i.status === "selected").length;

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
              Content Ideas
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {ideas.length} total &middot; {todayCount} today &middot;{" "}
              {selectedCount} selected
            </span>
            <SignOutButton />
          </div>
        </div>

        {ideas.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm">
              No content ideas yet. The agent will add them soon.
            </p>
          </div>
        ) : (
          <ContentIdeaList ideas={ideas} />
        )}
      </div>
    </div>
  );
}
