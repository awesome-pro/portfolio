import AgentUrl from "@/components/agent-url";
import type { Contribution, ContributionStatus } from "@/lib/contributions";

/**
 * GitHub's palette, borrowed deliberately: open is green, merged is purple,
 * closed is red. With the list now ordered by date alone, the badge is the only
 * thing separating in-flight work from landed work, so the two hues sit far
 * apart — the old sky-on-emerald pair was nearly the same colour at 6px. The
 * label rides along with the dot; the faint mid-grey it used to be was too
 * quiet to read at a glance.
 */
const STATUS_STYLE: Record<ContributionStatus, { dot: string; text: string }> = {
  open: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  merged: { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  closed: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Open-source pull requests as a quiet list: the title links out, with the
 * repo, when it moved, and whether it merged. Rows follow the Work section's
 * layout so the two read as one page.
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
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-faint">
              {formatDate(contribution.date)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] ${
                STATUS_STYLE[contribution.status].text
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  STATUS_STYLE[contribution.status].dot
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
