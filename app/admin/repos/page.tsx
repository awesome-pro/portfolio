import Link from "next/link";
import { getAllRepos, ContributionRepo } from "@/lib/repos";

export const dynamic = "force-dynamic";
import SignOutButton from "@/components/admin/SignOutButton";
import RepoStatusButton from "@/components/admin/RepoStatusButton";
import DeleteRepoButton from "@/components/admin/DeleteRepoButton";

function repoName(url: string) {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_ORDER = ["started", "suggested", "contributed", "skipped"] as const;

const STATUS_LABELS: Record<string, string> = {
  started: "In Progress",
  suggested: "Suggested",
  contributed: "Contributed",
  skipped: "Skipped",
};

function RepoRow({ repo }: { repo: ContributionRepo }) {
  const name = repoName(repo.repo_url);
  return (
    <div className="flex flex-col gap-3 px-5 py-4 bg-surface hover:bg-background transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ink hover:underline font-mono"
            >
              {name} ↗
            </a>
            {repo.company_url && (
              <a
                href={repo.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ink-faint hover:text-ink-muted font-mono"
              >
                company ↗
              </a>
            )}
          </div>
          {repo.description && (
            <p className="text-xs text-ink-muted mt-1 line-clamp-2">{repo.description}</p>
          )}
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repo.topics.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono px-2 py-0.5 rounded-md bg-background border border-border text-ink-faint"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {repo.user_notes && (
            <p className="text-xs text-ink-muted mt-2 italic line-clamp-1">
              Note: {repo.user_notes}
            </p>
          )}
          <p className="font-mono text-xs text-ink-faint mt-2">
            Discovered {formatDate(repo.discovered_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/repos/${repo.id}`}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            Details
          </Link>
          <DeleteRepoButton id={repo.id} name={name} />
        </div>
      </div>
      <RepoStatusButton id={repo.id} status={repo.status ?? "suggested"} />
    </div>
  );
}

export default async function ReposAdminPage() {
  const repos = await getAllRepos();

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
            <span className="text-xs font-mono text-ink-faint">{repos.length} total</span>
            <SignOutButton />
          </div>
        </div>

        {repos.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm">
              No repos yet. The agent will add them soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {STATUS_ORDER.map((status) => {
              const group = repos.filter((r) => (r.status ?? "suggested") === status);
              if (group.length === 0) return null;
              return (
                <section key={status}>
                  <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-4">
                    {STATUS_LABELS[status]} ({group.length})
                  </p>
                  <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
                    {group.map((repo) => (
                      <RepoRow key={repo.id} repo={repo} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
