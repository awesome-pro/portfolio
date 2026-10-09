"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { normalizeSignalLinks } from "@/lib/signal-links";
import { compareSignals } from "@/lib/signal-focus";
import type {
  OpportunitySignal,
  OpportunitySignalStatus,
} from "@/lib/opportunity-signals";
import { setOpportunityFocus } from "@/app/admin/opportunity-signals/actions";
import DeleteOpportunitySignalButton from "./DeleteOpportunitySignalButton";
import OpportunitySignalEditor from "./OpportunitySignalEditor";

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<OpportunitySignalStatus, string> = {
  new: "New",
  applied: "Applied",
  reached_out: "Reached Out",
  interviewing: "Interviewing",
  closed: "Closed",
};

type StatusFilter = OpportunitySignalStatus | "all" | "active" | "today";

function isDiscoveredToday(dateStr: string) {
  return (
    new Date(dateStr).toISOString().split("T")[0] ===
    new Date().toISOString().split("T")[0]
  );
}

function formatDate(dateStr: string) {
  if (isDiscoveredToday(dateStr)) return "today";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "https://www.baseten.co/" -> "baseten.co" — the scheme is noise in a list. */
function displayHost(website: string) {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

function hrefFor(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function matchesStatus(signal: OpportunitySignal, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "today") return isDiscoveredToday(signal.discovered_at);
  if (filter === "active") return signal.status !== "closed";
  return (signal.status ?? "new") === filter;
}

function matchesSearch(signal: OpportunitySignal, query: string) {
  if (!query) return true;
  const links = normalizeSignalLinks(signal.links)
    .map((link) => `${link.url} ${link.title ?? ""}`)
    .join(" ");
  const haystack = [
    signal.company_name,
    signal.website,
    signal.notes,
    links,
    signal.status ?? "new",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function CompactSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs font-mono text-ink-faint">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-surface border border-border rounded-lg pl-2.5 pr-1.5 py-1.5 text-xs font-mono text-ink-muted hover:text-ink focus:outline-none focus:border-ink-muted transition-colors cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OpportunitySignalCard({ signal }: { signal: OpportunitySignal }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [focusError, setFocusError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Optimistic so the star flips instantly; resets to the server value once the
  // refresh lands, which also covers focus edits made inside the editor.
  const [focus, setFocus] = useOptimistic(signal.focus);

  const links = normalizeSignalLinks(signal.links);
  const status = signal.status ?? "new";

  function toggleFocus() {
    const next = !focus;
    setFocusError(null);

    startTransition(async () => {
      setFocus(next);
      try {
        await setOpportunityFocus(signal.id, next);
        router.refresh();
      } catch (err) {
        setFocusError(
          err instanceof Error ? err.message : "Could not change focus."
        );
      }
    });
  }

  return (
    <div className="bg-surface transition-colors">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={toggleFocus}
          disabled={isPending}
          aria-pressed={focus}
          aria-label={
            focus
              ? `Remove ${signal.company_name} from focus`
              : `Focus ${signal.company_name}`
          }
          title={focus ? "Remove from focus" : "Focus this company"}
          className={`mt-0.5 text-base leading-none rounded-md transition-colors disabled:opacity-50 ${
            focus
              ? "px-2 py-1 bg-ink text-background"
              : "px-2 py-1 text-ink-faint hover:text-ink"
          }`}
        >
          {focus ? "★" : "☆"}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            {/* Only non-default statuses earn a badge; "new" is the absence of one. */}
            {status !== "new" && (
              <span className="text-xs font-mono text-ink-muted border border-border rounded px-1.5 py-px">
                {STATUS_LABELS[status]}
              </span>
            )}
            <span className="text-sm font-medium text-ink break-words">
              {signal.company_name}
            </span>
          </div>

          <p className="font-mono text-xs text-ink-faint mt-1 flex items-center gap-2 flex-wrap">
            {signal.website ? (
              <a
                href={hrefFor(signal.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
              >
                {displayHost(signal.website)}
              </a>
            ) : (
              <span>no site</span>
            )}
            <span>&middot;</span>
            <span>{formatDate(signal.discovered_at)}</span>
            {links.length > 0 && (
              <>
                <span>&middot;</span>
                <span>
                  {links.length} {links.length === 1 ? "link" : "links"}
                </span>
              </>
            )}
          </p>

          {signal.notes && (
            <p className="text-sm text-ink-muted leading-5 line-clamp-2 mt-1.5">
              {signal.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-mono px-2 py-1.5 text-ink-faint hover:text-ink transition-colors"
          >
            {expanded ? "close" : "edit"}
          </button>
          <DeleteOpportunitySignalButton
            id={signal.id}
            companyName={signal.company_name}
          />
        </div>
      </div>

      {focusError && (
        <p className="px-4 pb-2 -mt-1 text-xs font-mono text-destructive">
          {focusError}
        </p>
      )}

      {expanded && (
        <div className="border-t border-border mx-4 mb-2 pt-3">
          <OpportunitySignalEditor signal={signal} />
        </div>
      )}
    </div>
  );
}

export default function OpportunitySignalList({
  signals,
  initialSearch = "",
}: {
  signals: OpportunitySignal[];
  /**
   * Pre-filled search, used when a company chip on a note links here. The
   * status filter opens up too: the company you clicked may well be closed,
   * and landing on an empty list would look like a broken link.
   */
  initialSearch?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialSearch ? "all" : "active"
  );
  const [focusOnly, setFocusOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      signals.filter(
        (signal) =>
          matchesStatus(signal, statusFilter) &&
          (!focusOnly || signal.focus) &&
          matchesSearch(signal, normalizedSearch)
      ),
    [signals, statusFilter, focusOnly, normalizedSearch]
  );

  // Starred first, then newest-first.
  const sorted = useMemo(() => [...filtered].sort(compareSignals), [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSignals = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const statusCounts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: signals.length,
      active: signals.filter((s) => s.status !== "closed").length,
      today: signals.filter((s) => isDiscoveredToday(s.discovered_at)).length,
      new: signals.filter((s) => (s.status ?? "new") === "new").length,
      applied: signals.filter((s) => s.status === "applied").length,
      reached_out: signals.filter((s) => s.status === "reached_out").length,
      interviewing: signals.filter((s) => s.status === "interviewing").length,
      closed: signals.filter((s) => s.status === "closed").length,
    }),
    [signals]
  );

  const focusCount = useMemo(
    () => signals.filter((s) => s.focus).length,
    [signals]
  );

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "active", label: `Active (${statusCounts.active})` },
    { value: "all", label: `All (${statusCounts.all})` },
    { value: "today", label: `Today (${statusCounts.today})` },
    { value: "new", label: `New (${statusCounts.new})` },
    { value: "applied", label: `Applied (${statusCounts.applied})` },
    { value: "reached_out", label: `Reached Out (${statusCounts.reached_out})` },
    { value: "interviewing", label: `Interviewing (${statusCounts.interviewing})` },
    { value: "closed", label: `Closed (${statusCounts.closed})` },
  ];

  const filtersActive =
    statusFilter !== "active" || focusOnly || normalizedSearch.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search companies, notes, links..."
          className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={focusOnly}
            onClick={() => {
              setFocusOnly((v) => !v);
              setPage(1);
            }}
            title="Show only starred companies"
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              focusOnly
                ? "bg-ink text-background border-ink"
                : "bg-surface border-border text-ink-muted hover:text-ink"
            }`}
          >
            ★ focus ({focusCount})
          </button>

          <div className="ml-auto">
            <CompactSelect
              label="status"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl flex flex-col items-center gap-2">
          <p className="text-ink-faint font-mono text-sm">
            {statusFilter === "today" && !focusOnly && !normalizedSearch
              ? "Nothing new today."
              : "No signals match this filter."}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("active");
                setFocusOnly(false);
                setSearch("");
                setPage(1);
              }}
              className="text-xs font-mono text-ink-muted hover:text-ink transition-colors underline underline-offset-4"
            >
              clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border border border-border rounded-xl overflow-hidden">
            {pageSignals.map((signal) => (
              <OpportunitySignalCard key={signal.id} signal={signal} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {sorted.length} {sorted.length === 1 ? "signal" : "signals"}
              {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  disabled={safePage === 1}
                  className="text-xs font-mono text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
                >
                  ← prev
                </button>
                <button
                  onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                  disabled={safePage === totalPages}
                  className="text-xs font-mono text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
                >
                  next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
