import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepoById } from "@/lib/repos";
import RepoEditForm from "@/components/admin/RepoEditForm";

export const dynamic = "force-dynamic";

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = await getRepoById(id);
  if (!repo) notFound();

  const name = repo.repo_url
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/admin/repos"
            className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
          >
            ← Contribution Targets
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-ink mt-1 break-all font-mono">
            {name}
          </h1>
        </div>

        {/* Agent-generated info — read only */}
        <div className="flex flex-col gap-5 mb-10 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Agent Info
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono text-ink-faint">Repo URL</p>
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ink hover:underline break-all"
            >
              {repo.repo_url} ↗
            </a>
          </div>

          {repo.company_url && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Company URL</p>
              <a
                href={repo.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink hover:underline break-all"
              >
                {repo.company_url} ↗
              </a>
            </div>
          )}

          {repo.description && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Description</p>
              <p className="text-sm text-ink">{repo.description}</p>
            </div>
          )}

          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-background border border-border text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {repo.why_recommended && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Why Recommended</p>
              <p className="text-sm text-ink">{repo.why_recommended}</p>
            </div>
          )}

          {repo.suggested_contribution && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Suggested Contribution</p>
              <p className="text-sm text-ink">{repo.suggested_contribution}</p>
            </div>
          )}
        </div>

        {/* Editable: status + notes */}
        <RepoEditForm
          id={repo.id}
          status={repo.status ?? "suggested"}
          userNotes={repo.user_notes ?? ""}
        />
      </div>
    </div>
  );
}
