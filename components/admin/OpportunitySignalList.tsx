"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type {
  OpportunitySignal,
  OpportunitySignalStatus,
  PersonToReach,
} from "@/lib/opportunity-signals";
import { updateOpportunitySignalStatus } from "@/app/admin/opportunity-signals/actions";
import DeleteOpportunitySignalButton from "./DeleteOpportunitySignalButton";

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  OpportunitySignalStatus,
  { label: string; style: string }
> = {
  new: { label: "New", style: "bg-surface text-ink-muted border-border" },
  reached_out: {
    label: "Reached Out",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  interviewing: {
    label: "Interviewing",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  closed: {
    label: "Closed",
    style: "bg-background text-ink-faint border-border",
  },
};

const STATUS_FLOW: OpportunitySignalStatus[] = [
  "new",
  "reached_out",
  "interviewing",
  "closed",
];

type FilterType = OpportunitySignalStatus | "all" | "active" | "today";

function normalizeLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "url" in item) {
        return String((item as { url: unknown }).url).trim();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizePeople(value: unknown): PersonToReach[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is PersonToReach =>
        item !== null && typeof item === "object" && "name" in item
    )
    .map((item) => ({
      name: String(item.name ?? ""),
      role: item.role ? String(item.role) : undefined,
      linkedin: item.linkedin ? String(item.linkedin) : undefined,
      note: item.note ? String(item.note) : undefined,
    }));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDiscoveredToday(dateStr: string) {
  const itemDate = new Date(dateStr).toISOString().split("T")[0];
  return itemDate === new Date().toISOString().split("T")[0];
}

function scoreColor(score: number | null) {
  if (score === null) return "bg-background text-ink-faint border-border";
  if (score >= 80) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-surface text-ink-muted border-border";
}

function matchesFilter(signal: OpportunitySignal, filter: FilterType) {
  if (filter === "all") return true;
  if (filter === "today") return isDiscoveredToday(signal.discovered_at);
  if (filter === "active") return signal.status !== "closed";
  return (signal.status ?? "new") === filter;
}

function matchesSearch(signal: OpportunitySignal, query: string) {
  if (!query) return true;
  const people = normalizePeople(signal.people_to_reach)
    .map((p) => `${p.name} ${p.role ?? ""} ${p.note ?? ""}`)
    .join(" ");
  const haystack = [
    signal.company_name,
    signal.signal_type,
    signal.reason,
    signal.notes,
    people,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function StatusBadge({ status }: { status: OpportunitySignalStatus | null }) {
  const key = (status ?? "new") as OpportunitySignalStatus;
  const config = STATUS_CONFIG[key];
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-md border ${config.style}`}
    >
      {config.label}
    </span>
  );
}

function InlineStatusChanger({
  id,
  current,
}: {
  id: string;
  current: OpportunitySignalStatus | null;
}) {
  const [optimistic, setOptimistic] = useState<OpportunitySignalStatus>(
    current ?? "new"
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(status: OpportunitySignalStatus) {
    setOptimistic(status);
    startTransition(async () => {
      await updateOpportunitySignalStatus(id, status);
    });
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUS_FLOW.map((status) => (
        <button
          key={status}
          onClick={() => handleChange(status)}
          disabled={isPending || optimistic === status}
          className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
            optimistic === status
              ? "bg-ink text-background border-ink"
              : "bg-surface text-ink-muted border-border hover:text-ink"
          }`}
        >
          {STATUS_CONFIG[status].label}
        </button>
      ))}
    </div>
  );
}

function PersonCard({ person }: { person: PersonToReach }) {
  return (
    <div className="flex flex-col gap-0.5 bg-background border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        {person.linkedin ? (
          <a
            href={person.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-ink hover:underline"
          >
            {person.name}
          </a>
        ) : (
          <span className="text-xs font-medium text-ink">{person.name}</span>
        )}
        {person.role && (
          <span className="text-xs font-mono text-ink-faint">{person.role}</span>
        )}
      </div>
      {person.note && (
        <p className="text-xs text-ink-muted">{person.note}</p>
      )}
    </div>
  );
}

function OpportunitySignalCard({ signal }: { signal: OpportunitySignal }) {
  const [expanded, setExpanded] = useState(false);
  const jobLinks = normalizeLinks(signal.job_links);
  const relevantLinks = normalizeLinks(signal.relevant_links);
  const people = normalizePeople(signal.people_to_reach);
  const today = isDiscoveredToday(signal.discovered_at);

  return (
    <div className="flex flex-col bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {today && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                New today
              </span>
            )}
            <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-background text-ink-muted border-border">
              {signal.signal_type}
            </span>
            <StatusBadge status={signal.status} />
            {signal.match_score !== null && (
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-md border ${scoreColor(signal.match_score)}`}
              >
                {signal.match_score}/100
              </span>
            )}
            {signal.interview_probability !== null && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-surface text-ink-muted border-border">
                {signal.interview_probability}% interview
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-ink mt-1.5 break-words">
            {signal.company_name}
          </p>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {signal.website ? (
              <a
                href={
                  /^https?:\/\//i.test(signal.website)
                    ? signal.website
                    : `https://${signal.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {signal.website}
              </a>
            ) : (
              "No website"
            )}{" "}
            &middot; {formatDate(signal.discovered_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            {expanded ? "Hide" : "Details"}
          </button>
          <Link
            href={`/admin/opportunity-signals/${signal.id}`}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            Open
          </Link>
          <DeleteOpportunitySignalButton
            id={signal.id}
            companyName={signal.company_name}
          />
        </div>
      </div>

      <div className="px-5 py-3">
        <p className="text-sm text-ink leading-6 line-clamp-2">{signal.reason}</p>
      </div>

      {expanded && (
        <div className="border-t border-border mx-5 mb-5 pt-5 flex flex-col gap-5">
          <InlineStatusChanger id={signal.id} current={signal.status} />

          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono text-ink-faint">Why This Signal</p>
            <p className="text-sm text-ink leading-6">{signal.reason}</p>
          </div>

          {people.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">
                People to Reach
              </p>
              <div className="flex flex-col gap-1.5">
                {people.map((person, i) => (
                  <PersonCard key={i} person={person} />
                ))}
              </div>
            </div>
          )}

          {jobLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Job Links</p>
              <div className="flex flex-col gap-1">
                {jobLinks.map((url, i) => (
                  <a
                    key={i}
                    href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-ink-muted hover:text-ink break-all"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {relevantLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Relevant Links</p>
              <div className="flex flex-col gap-1">
                {relevantLinks.map((url, i) => (
                  <a
                    key={i}
                    href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-ink-muted hover:text-ink break-all"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {signal.notes && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Notes</p>
              <p className="text-sm text-ink leading-6 whitespace-pre-wrap">
                {signal.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunitySignalList({
  signals,
}: {
  signals: OpportunitySignal[];
}) {
  const [filter, setFilter] = useState<FilterType>("active");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      signals.filter(
        (s) => matchesFilter(s, filter) && matchesSearch(s, normalizedSearch)
      ),
    [filter, normalizedSearch, signals]
  );

  // Within filtered, pin today's to the top
  const sorted = useMemo(() => {
    if (filter !== "active" && filter !== "all") return filtered;
    const today: OpportunitySignal[] = [];
    const rest: OpportunitySignal[] = [];
    filtered.forEach((s) => {
      if (isDiscoveredToday(s.discovered_at)) today.push(s);
      else rest.push(s);
    });
    return [...today, ...rest];
  }, [filtered, filter]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSignals = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const counts = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0];
    return {
      all: signals.length,
      active: signals.filter((s) => s.status !== "closed").length,
      today: signals.filter(
        (s) => new Date(s.discovered_at).toISOString().split("T")[0] === todayDate
      ).length,
      new: signals.filter((s) => (s.status ?? "new") === "new").length,
      reached_out: signals.filter((s) => s.status === "reached_out").length,
      interviewing: signals.filter((s) => s.status === "interviewing").length,
      closed: signals.filter((s) => s.status === "closed").length,
    };
  }, [signals]);

  const filters: { value: FilterType; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "today", label: "Today" },
    { value: "new", label: "New" },
    { value: "reached_out", label: "Reached Out" },
    { value: "interviewing", label: "Interviewing" },
    { value: "closed", label: "Closed" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search companies, signal types, reasons, people..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(({ value, label }) => (
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
              {label} ({counts[value as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl">
          <p className="text-ink-faint font-mono text-sm">
            {filter === "today"
              ? "No new signals today yet. The agent will add them soon."
              : "No signals match this filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {pageSignals.map((signal) => (
              <OpportunitySignalCard key={signal.id} signal={signal} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-ink-faint">
                Page {safePage} of {totalPages} &middot; {sorted.length}{" "}
                signals
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  disabled={safePage === 1}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
                  disabled={safePage === totalPages}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
