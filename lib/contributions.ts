// Open-source contributions, read live from GitHub.
//
// One Search API request returns everything I have authored — pull requests and
// issues alike, distinguished by the `pull_request` field — with its state and
// merge time, so this cannot drift the way a hand-maintained array would. Only
// merged pull requests and still-open items are kept: a closed, unmerged PR is
// not a contribution worth showing.
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
 * Pull requests pinned to the top in this order — this is what the homepage
 * shows. Empty the array to fall back to the automatic order: merged first,
 * then open, then closed, newest first inside each group.
 */
const PINNED = [
  "https://github.com/vllm-project/vllm/pull/58843",
  "https://github.com/laurent22/joplin/pull/11435",
  "https://github.com/heroui-inc/heroui/pull/3595",
];

const STATUS_RANK: Record<ContributionStatus, number> = {
  merged: 0,
  open: 1,
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
  const pinA = PINNED.indexOf(a.url);
  const pinB = PINNED.indexOf(b.url);

  if (pinA !== -1 || pinB !== -1) {
    if (pinA === -1) return 1;
    if (pinB === -1) return -1;
    return pinA - pinB;
  }

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
