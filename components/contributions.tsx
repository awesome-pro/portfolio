import AgentUrl from "@/components/agent-url";
import type { Contribution, ContributionStatus } from "@/lib/contributions";

/** Matches the emerald "resume" dot in the hero; open/closed stay monochrome. */
const STATUS_DOT: Record<ContributionStatus, string> = {
  merged: "bg-emerald-500",
  open: "bg-sky-500",
  closed: "bg-ink-faint",
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Open-source pull requests and issues as a quiet list: the title links out,
 * with the repo, when it moved, and its current status. Rows follow the Work
 * section's layout so the two read as one page.
 */
export default function ContributionList({
  contributions,
}: {
  contributions: Contribution[];
}) {
  return (
    <div className="flex flex-col">
      {contributions.map((contribution, index) => (
        <div
          key={contribution.id}
          className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 ${
            index !== 0 ? "border-t border-border" : ""
          }`}
        >
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <a
              href={contribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-ink underline-offset-4 hover:underline"
            >
              {contribution.title}
              <AgentUrl url={contribution.url} />
            </a>
            <span className="font-mono text-xs text-ink-faint">
              {contribution.repo} #{contribution.number}
              {contribution.kind === "issue" && " · issue"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">
              {formatDate(contribution.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-muted">
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  STATUS_DOT[contribution.status]
                }`}
              />
              {contribution.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
