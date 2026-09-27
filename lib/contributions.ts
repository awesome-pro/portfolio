// Open-source contributions, read live from GitHub.
//
// One Search API request returns everything I have authored — pull requests and
// issues alike, distinguished by the `pull_request` field — with its state and
// merge time, so neither the contents nor the order drift the way a
// hand-maintained array would. Only merged pull requests and still-open items
// are kept: a closed, unmerged PR is not a contribution worth showing.
//
// The order is derived, never curated (see compare). It used to be curated: a
// PINNED array of three fixed URLs was what the homepage sliced to three, so a
// brand-new pull request could not appear there no matter how often it
// revalidated. The data was right the whole time; the display order was the bug.
//
// FETCH_REVALIDATE must not outlive the pages' own revalidate. It did once
// (900s against a 30s page) and the effect was a list that looked frozen: the
// page re-rendered on schedule, but every re-render was handed the same cached
// GitHub response. Measured with a stub GitHub — the fetch ran once at build
// and then never again until the window expired.
//
// Unauthenticated the Search API allows 10 requests/minute per IP (30 with a
// GITHUB_TOKEN in the environment). Revalidations are traffic-driven, so this
// stays inside that; if GitHub does push back, LAST_GOOD below keeps the list
// on screen instead of blanking it.

const GITHUB_USER = "awesome-pro";

/** GitHub caps `per_page` at 100; that covers the whole list today (82 items). */
const MAX_RESULTS = 100;

/** Matches the pages that render this, so new work appears as fast as theirs. */
const FETCH_REVALIDATE = 30;

/**
 * Last response that actually parsed. Module state survives between requests on
 * a warm serverless instance, so a rate-limited or failed fetch degrades to
 * slightly older numbers rather than an empty section.
 */
let lastGood: Contribution[] | null = null;

export type ContributionStatus = "merged" | "open" | "closed";

/** Pull requests and issues read the same on GitHub, but not on a CV. */
export type ContributionKind = "pr" | "issue";

export interface Contribution {
  id: string;
  number: number;
  title: string;
  url: string;
  /** "owner/name", e.g. "vllm-project/vllm". */
  repo: string;
  kind: ContributionKind;
  status: ContributionStatus;
  /** Merge date when merged, otherwise the last time it moved. */
  date: string;
}

/**
 * Ordering, applied to every consumer so the homepage head is always the most
 * interesting slice of the same list the full page shows.
 *
 * Pull requests outrank issues (an issue is a report, a PR is shipped work),
 * then still-open work outranks what already landed — the homepage leads with
 * whatever is in flight right now, which is also what keeps it current without
 * anyone editing this file. Newest first inside each bucket.
 */
const KIND_RANK: Record<ContributionKind, number> = { pr: 0, issue: 1 };
const STATUS_RANK: Record<ContributionStatus, number> = {
  open: 0,
  merged: 1,
  closed: 2,
};
interface GitHubSearchItem {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  repository_url: string;
  pull_request?: { merged_at: string | null };
}

function toContribution(item: GitHubSearchItem): Contribution {
  const repo = item.repository_url.replace(
    "https://api.github.com/repos/",
    ""
  );
  const mergedAt = item.pull_request?.merged_at ?? null;

  return {
    id: String(item.id),
    number: item.number,
    title: item.title,
    url: item.html_url,
    repo,
    kind: item.pull_request ? "pr" : "issue",
    status: mergedAt ? "merged" : item.state === "open" ? "open" : "closed",
    date: (mergedAt ?? item.updated_at ?? item.created_at).slice(0, 10),
  };
}

function compare(a: Contribution, b: Contribution) {
  const kind = KIND_RANK[a.kind] - KIND_RANK[b.kind];
  if (kind !== 0) return kind;

  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  return rank !== 0 ? rank : b.date.localeCompare(a.date);
}

export async function getContributions(): Promise<Contribution[]> {
  // No `type:` qualifier, so this returns pull requests *and* issues in one
  // request; they are told apart by the `pull_request` field in each item.
  const query = encodeURIComponent(`author:${GITHUB_USER}`);
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(
      `https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=${MAX_RESULTS}`,
      {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "abhinandan.one",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: FETCH_REVALIDATE },
      }
    );

    if (!response.ok) return lastGood ?? [];

    const data = (await response.json()) as { items?: GitHubSearchItem[] };

    lastGood = (data.items ?? [])
      .map(toContribution)
      .filter(
        (item) =>
          // Work against one of my own repositories is not a contribution to
          // anyone else's project.
          item.repo.split("/")[0] !== GITHUB_USER &&
          // Closed without merging is not something to show off. An open item
          // is still worth listing even though it has not landed yet.
          item.status !== "closed"
      )
      .sort(compare);

    return lastGood;
  } catch {
    return lastGood ?? [];
  }
}
