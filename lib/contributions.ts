// Open-source contributions, read live from GitHub.
//
// One Search API *query*, paged to the end, returns everything I have authored
// — pull requests and issues alike, distinguished by the `pull_request` field —
// with its state and merge time, so neither the contents nor the order drift the
// way a hand-maintained array would. Only merged pull requests and still-open
// items are kept: a closed, unmerged PR is not a contribution worth showing.
//
// It used to read one page of 100 and stop. That cut the list at the 100 most
// recently *created* items, and since the newest 100 are mostly recent work, the
// oldest fell off the end: all 16 merged heroui-inc/heroui pull requests, plus
// 17 more merges, sat on page 2 and never reached the site. The page advertised
// "13 merged" when the account has 30. The filters were never the problem — the
// read was. Anything reading this must read every page; MAX_RESULTS is the one
// cut GitHub itself imposes.
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
// GITHUB_TOKEN in the environment). A full read costs one request per 100
// authored items — two, today — and revalidations are traffic-driven, so this
// stays inside that; if the account ever grows past a few hundred items a token
// stops being optional. If GitHub does push back, LAST_GOOD below keeps the list
// on screen instead of blanking it.

const GITHUB_USER = "awesome-pro";

/** GitHub caps `per_page` at 100 — this is the largest page it will serve. */
const PER_PAGE = 100;

/**
 * The Search API refuses to page past its first 1000 results, whatever
 * `total_count` claims, so this is the ceiling on how much history can reach the
 * site. Past 1000 authored items the oldest fall off, which is the right end to
 * lose — but nothing before that point is dropped quietly any more.
 */
const MAX_RESULTS = 1000;

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
 * Newest first, and nothing else. State is a colour, not a sort key: grouping
 * open above merged meant an open item from years back outranked a merge from
 * last week, which reads as a broken list. Every consumer shares this one
 * order, so the homepage is always the head of the list /contributions shows
 * in full.
 */
function compare(a: Contribution, b: Contribution) {
  return b.date.localeCompare(a.date);
}

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

interface GitHubSearchResponse {
  total_count?: number;
  items?: GitHubSearchItem[];
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

/**
 * One page of the search. `sort=created&order=desc` is what makes paging safe:
 * the order is total and stable, so page 2 continues where page 1 ended.
 *
 * No `type:` qualifier, so a page holds pull requests *and* issues; they are
 * told apart by the `pull_request` field in each item.
 */
async function fetchSearchPage(page: number): Promise<GitHubSearchResponse> {
  const query = encodeURIComponent(`author:${GITHUB_USER}`);
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(
    `https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=${PER_PAGE}&page=${page}`,
    {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "abhinandan.one",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: FETCH_REVALIDATE },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub search page ${page} failed: ${response.status}`);
  }

  return (await response.json()) as GitHubSearchResponse;
}

/**
 * Every authored item, across every page.
 *
 * Pages 2..n are independent reads, so they are asked for together — one round
 * trip each in sequence would be pointless. A page that fails is dropped rather
 * than failing the whole read: a slightly short list beats no list, and the next
 * revalidation repairs it.
 */
async function fetchAllItems(): Promise<GitHubSearchItem[]> {
  const first = await fetchSearchPage(1);
  const head = first.items ?? [];

  // `total_count` is what says how many pages there are — without it the end of
  // the list would only be discoverable by paging until a short page came back.
  const total = Math.min(first.total_count ?? head.length, MAX_RESULTS);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const rest = await Promise.allSettled(
    Array.from({ length: pages - 1 }, (_, index) => fetchSearchPage(index + 2))
  );

  // Creating a pull request mid-read shifts the window, so two pages can hand
  // back the same item. Ids are stable, so they are the dedupe key.
  const items: GitHubSearchItem[] = [];
  const seen = new Set<number>();

  for (const page of [
    head,
    ...rest.map((result) =>
      result.status === "fulfilled" ? result.value.items ?? [] : []
    ),
  ]) {
    for (const item of page) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  return items;
}

/**
 * Pull requests only — what every surface on the site now shows.
 *
 * Issues are still fetched and still classified (the `kind` field is what
 * separates them), they are simply not displayed anywhere: a bug report beside
 * merged code reads as weaker evidence than the code, and the page is a
 * portfolio, not a changelog.
 */
export async function getPullRequests(): Promise<Contribution[]> {
  const contributions = await getContributions();
  return contributions.filter((contribution) => contribution.kind === "pr");
}

export async function getContributions(): Promise<Contribution[]> {
  try {
    const items = await fetchAllItems();

    // An empty 200 is a bad read, not an empty history; keep the last good list
    // rather than replacing a full page with nothing.
    if (items.length === 0) return lastGood ?? [];

    lastGood = items
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
