"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ContentIdea, ContentIdeaStatus } from "@/lib/content-ideas";
import { updateContentIdeaStatus } from "@/app/admin/content-ideas/actions";
import DeleteContentIdeaButton from "./DeleteContentIdeaButton";

const PAGE_SIZE = 20;

const STATUS_CONFIG: Record<
  ContentIdeaStatus,
  { label: string; style: string }
> = {
  idea: { label: "Idea", style: "bg-surface text-ink-muted border-border" },
  selected: {
    label: "Selected",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  created: {
    label: "Created",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  posted: {
    label: "Posted",
    style: "bg-green-50 text-green-700 border-green-200",
  },
  skipped: {
    label: "Skipped",
    style: "bg-background text-ink-faint border-border",
  },
};

const STATUS_FLOW: ContentIdeaStatus[] = [
  "idea",
  "selected",
  "created",
  "posted",
  "skipped",
];

type FilterType = ContentIdeaStatus | "all" | "today";

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      return "";
    })
    .filter((item) => item.length > 0);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split("T")[0];
}

function matchesFilter(idea: ContentIdea, filter: FilterType) {
  if (filter === "all") return true;
  if (filter === "today") return isToday(idea.idea_date);
  return idea.status === filter;
}

function matchesSearch(idea: ContentIdea, query: string) {
  if (!query) return true;
  const haystack = [
    idea.topic_title,
    idea.category,
    idea.why_now,
    idea.why_this_is_good,
    idea.target_audience,
    idea.content_angle,
    idea.notes,
    ...normalizeList(idea.key_points),
    ...normalizeList(idea.hooks),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function StatusBadge({ status }: { status: ContentIdeaStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-md border ${config.style}`}
    >
      {config.label}
    </span>
  );
}

function StatusChanger({
  id,
  current,
}: {
  id: string;
  current: ContentIdeaStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<ContentIdeaStatus>(current);

  function handleChange(status: ContentIdeaStatus) {
    setOptimistic(status);
    startTransition(async () => {
      await updateContentIdeaStatus(id, status);
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

function ContentIdeaCard({ idea }: { idea: ContentIdea }) {
  const [expanded, setExpanded] = useState(false);
  const keyPoints = normalizeList(idea.key_points);
  const hooks = normalizeList(idea.hooks);
  const sourceLinks = normalizeList(idea.source_links);
  const today = isToday(idea.idea_date);

  return (
    <div className="flex flex-col bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {today && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                Today
              </span>
            )}
            {idea.category && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-background text-ink-muted border-border">
                {idea.category}
              </span>
            )}
            <StatusBadge status={idea.status} />
          </div>
          <p className="text-sm font-medium text-ink mt-1.5 break-words">
            {idea.topic_title}
          </p>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {formatDate(idea.idea_date)}
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
            href={`/admin/content-ideas/${idea.id}`}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            Open
          </Link>
          <DeleteContentIdeaButton id={idea.id} title={idea.topic_title} />
        </div>
      </div>

      <div className="px-5 py-3">
        {idea.content_angle ? (
          <p className="text-sm text-ink leading-6">{idea.content_angle}</p>
        ) : idea.why_this_is_good ? (
          <p className="text-sm text-ink leading-6">{idea.why_this_is_good}</p>
        ) : (
          <p className="text-sm text-ink-faint font-mono">No summary.</p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border mx-5 mb-5 pt-5 flex flex-col gap-5">
          <StatusChanger id={idea.id} current={idea.status} />

          {idea.why_now && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Why Now</p>
              <p className="text-sm text-ink">{idea.why_now}</p>
            </div>
          )}

          {idea.why_this_is_good && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Why This Is Good
              </p>
              <p className="text-sm text-ink">{idea.why_this_is_good}</p>
            </div>
          )}

          {idea.target_audience && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Target Audience
              </p>
              <p className="text-sm text-ink">{idea.target_audience}</p>
            </div>
          )}

          {keyPoints.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Key Points</p>
              <ul className="flex flex-col gap-1">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span className="text-ink-faint shrink-0">·</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hooks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Hooks</p>
              <ul className="flex flex-col gap-2">
                {hooks.map((hook, i) => (
                  <li
                    key={i}
                    className="text-sm text-ink bg-background border border-border rounded-lg px-3 py-2 font-mono"
                  >
                    {hook}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {idea.linkedin_post && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">LinkedIn Post</p>
              <pre className="text-sm text-ink bg-background border border-border rounded-lg px-3 py-3 whitespace-pre-wrap font-sans leading-6">
                {idea.linkedin_post}
              </pre>
            </div>
          )}

          {idea.x_post && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">X Post</p>
              <pre className="text-sm text-ink bg-background border border-border rounded-lg px-3 py-3 whitespace-pre-wrap font-sans leading-6">
                {idea.x_post}
              </pre>
            </div>
          )}

          {idea.video_script && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Video Script</p>
              <pre className="text-sm text-ink bg-background border border-border rounded-lg px-3 py-3 whitespace-pre-wrap font-sans leading-6 max-h-64 overflow-y-auto">
                {idea.video_script}
              </pre>
            </div>
          )}

          {sourceLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Sources</p>
              <div className="flex flex-col gap-1">
                {sourceLinks.map((url, i) => (
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

          {idea.notes && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Notes</p>
              <p className="text-sm text-ink">{idea.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContentIdeaList({
  ideas,
}: {
  ideas: ContentIdea[];
}) {
  const [filter, setFilter] = useState<FilterType>("today");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const categories = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((idea) => {
      if (idea.category) set.add(idea.category);
    });
    return Array.from(set).sort();
  }, [ideas]);

  const filtered = useMemo(
    () =>
      ideas.filter(
        (idea) =>
          matchesFilter(idea, filter) &&
          matchesSearch(idea, normalizedSearch)
      ),
    [filter, normalizedSearch, ideas]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageIdeas = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const counts = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0];
    return {
      all: ideas.length,
      today: ideas.filter((i) => i.idea_date === todayDate).length,
      idea: ideas.filter((i) => i.status === "idea").length,
      selected: ideas.filter((i) => i.status === "selected").length,
      created: ideas.filter((i) => i.status === "created").length,
      posted: ideas.filter((i) => i.status === "posted").length,
      skipped: ideas.filter((i) => i.status === "skipped").length,
    };
  }, [ideas]);

  const filters: { value: FilterType; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "all", label: "All" },
    { value: "idea", label: "Idea" },
    { value: "selected", label: "Selected" },
    { value: "created", label: "Created" },
    { value: "posted", label: "Posted" },
    { value: "skipped", label: "Skipped" },
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
          placeholder="Search topics, angles, hooks, audience..."
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

        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-ink-faint">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSearch(cat);
                  setPage(1);
                }}
                className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border bg-background text-ink-muted hover:text-ink transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl">
          <p className="text-ink-faint font-mono text-sm">
            {filter === "today"
              ? "No ideas for today yet. The agent will add them soon."
              : "No content ideas match this filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {pageIdeas.map((idea) => (
              <ContentIdeaCard key={idea.id} idea={idea} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-ink-faint">
                Page {safePage} of {totalPages} &middot; {filtered.length}{" "}
                ideas
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
