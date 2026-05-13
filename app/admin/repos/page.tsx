import Link from "next/link";
import { getActiveRepos, getSkippedRepos } from "@/lib/repos";
import RepoList from "@/components/admin/RepoList";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ReposAdminPage() {
  const [activeRepos, skippedRepos] = await Promise.all([
    getActiveRepos(),
    getSkippedRepos(),
  ]);

  const total = activeRepos.length + skippedRepos.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href="/admin"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Contribution Targets
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {total} total
            </span>
            <SignOutButton />
          </div>
        </div>

        {total === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm">
              No repos yet. The agent will add them soon.
            </p>
          </div>
        ) : (
          <RepoList activeRepos={activeRepos} skippedRepos={skippedRepos} />
        )}
      </div>
    </div>
  );
}
