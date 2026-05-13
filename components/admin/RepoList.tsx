"use client";

import { useState, useTransition, useMemo } from "react";
import type { ContributionRepo } from "@/lib/repos";
import { updateRepoStatus, updateRepoNotes } from "@/app/admin/repos/actions";
import DeleteRepoButton from "./DeleteRepoButton";

const PAGE_SIZE = 20;

const STATUS_CONFIG = {
  suggested: {
    label: "Suggested",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  started: {
    label: "Started",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  contributed: {
    label: "Contributed",
    style: "bg-green-50 text-green-700 border-green-200",
  },
  skipped: {
    label: "Skip",
    style: "bg-surface text-ink-faint border-border",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;
type FilterType = "all" | "suggested" | "started" | "contributed";

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

function RepoCard({
  repo,
  currentStatus,
  onSkip,
  onStatusChange,
}: {
  repo: ContributionRepo;
  currentStatus: string;
  onSkip: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(repo.user_notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);

  const name = repoName(repo.repo_url);
  const cfg =
    STATUS_CONFIG[currentStatus as StatusKey] ?? STATUS_CONFIG.suggested;

  function handleStatusChange(next: string) {
    if (next === currentStatus || isPending) return;
    onStatusChange(repo.id, next);
    if (next === "skipped") onSkip(repo.id);
    startTransition(() => updateRepoStatus(repo.id, next));
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await updateRepoNotes(repo.id, notes);
    setSavingNotes(false);
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2000);
  }

  return (
    <div className="flex flex-col bg-surface transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
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
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-md border ${cfg.style}`}
            >
              {currentStatus === "skipped" ? "Skipped" : cfg.label}
            </span>
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
          <p className="font-mono text-xs text-ink-faint mt-1">
            {formatDate(repo.discovered_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            {expanded ? "▲ Hide" : "▼ Details"}
          </button>
          <DeleteRepoButton id={repo.id} name={name} />
        </div>
      </div>

      {/* Status buttons */}
      <div className="flex items-center gap-1.5 flex-wrap px-5 py-3">
        {(Object.entries(STATUS_CONFIG) as [StatusKey, (typeof STATUS_CONFIG)[StatusKey]][]).map(
          ([value, config]) => (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              disabled={isPending}
              className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                currentStatus === value
                  ? config.style
                  : "bg-background text-ink-faint border-border hover:text-ink-muted"
              }`}
            >
              {config.label}
            </button>
          )
        )}
      </div>

      {/* Accordion detail panel */}
      {expanded && (
        <div className="border-t border-border mx-5 mb-5 pt-5 flex flex-col gap-5">
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
              <p className="text-xs font-mono text-ink-faint">
                Why Recommended
              </p>
              <p className="text-sm text-ink">{repo.why_recommended}</p>
            </div>
          )}

          {repo.suggested_contribution && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Suggested Contribution
              </p>
              <p className="text-sm text-ink">{repo.suggested_contribution}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-mono text-ink-faint"
              htmlFor={`notes-${repo.id}`}
            >
              Notes
            </label>
            <textarea
              id={`notes-${repo.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add personal notes, ideas, progress updates..."
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-y"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="self-start bg-ink text-background rounded-lg px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingNotes ? "Saving…" : savedNotes ? "Saved ✓" : "Save Notes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepoList({
  activeRepos,
  skippedRepos,
}: {
  activeRepos: ContributionRepo[];
  skippedRepos: ContributionRepo[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [showSkipped, setShowSkipped] = useState(false);
  // Optimistic local state
  const [locallySkipped, setLocallySkipped] = useState<Set<string>>(new Set());
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>(
    {}
  );

  function handleSkip(id: string) {
    setLocallySkipped((prev) => new Set([...prev, id]));
  }

  function handleStatusChange(id: string, status: string) {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
  }

  const visibleActive = useMemo(
    () => activeRepos.filter((r) => !locallySkipped.has(r.id)),
    [activeRepos, locallySkipped]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return visibleActive;
    return visibleActive.filter(
      (r) => (localStatuses[r.id] ?? r.status ?? "suggested") === filter
    );
  }, [visibleActive, filter, localStatuses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRepos = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const counts = useMemo(() => {
    const c: Record<FilterType, number> = {
      all: visibleActive.length,
      suggested: 0,
      started: 0,
      contributed: 0,
    };
    visibleActive.forEach((r) => {
      const s = localStatuses[r.id] ?? r.status ?? "suggested";
      if (s in c) c[s as FilterType]++;
    });
    return c;
  }, [visibleActive, localStatuses]);

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "suggested", label: "Suggested" },
    { value: "started", label: "Started" },
    { value: "contributed", label: "Contributed" },
  ];

  const totalSkipped = skippedRepos.length + locallySkipped.size;

  return (
    <div className="flex flex-col gap-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              filter === value
                ? "bg-ink text-background border-ink"
                : "bg-surface text-ink-muted border-border hover:text-ink"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {/* Active repo list */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl">
          <p className="text-ink-faint font-mono text-sm">No repos here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {pageRepos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                currentStatus={localStatuses[repo.id] ?? repo.status ?? "suggested"}
                onSkip={handleSkip}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink-faint">
                Page {safePage} of {totalPages} &middot; {filtered.length} repos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Skipped / Rejected section */}
      {totalSkipped > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSkipped((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface transition-colors"
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
              Skipped / Rejected ({totalSkipped})
            </span>
            <span className="text-xs font-mono text-ink-faint">
              {showSkipped ? "▲ Hide" : "▼ Show"}
            </span>
          </button>
          {showSkipped && (
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {skippedRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  currentStatus={
                    localStatuses[repo.id] ?? repo.status ?? "skipped"
                  }
                  onSkip={() => {}}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
