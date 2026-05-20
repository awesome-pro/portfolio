"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductOpportunity } from "@/lib/product-opportunities";
import DeleteProductOpportunityButton from "./DeleteProductOpportunityButton";

const PAGE_SIZE = 20;

const CONFIDENCE_CONFIG = {
  high: {
    label: "High confidence",
    style: "bg-green-50 text-green-700 border-green-200",
  },
  medium: {
    label: "Medium confidence",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
  low: {
    label: "Low confidence",
    style: "bg-surface text-ink-faint border-border",
  },
  unknown: {
    label: "Unknown confidence",
    style: "bg-background text-ink-faint border-border",
  },
} as const;

type ConfidenceKey = keyof typeof CONFIDENCE_CONFIG;
type FilterType = "all" | "score-8" | "high" | "medium" | "low" | "unknown";

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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function externalUrl(url: string | null) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function confidenceKey(opportunity: ProductOpportunity): ConfidenceKey {
  return opportunity.revenue_confidence ?? "unknown";
}

function scoreLabel(score: number | null) {
  return typeof score === "number" ? `${score}/10` : "No score";
}

function matchesFilter(opportunity: ProductOpportunity, filter: FilterType) {
  if (filter === "all") return true;
  if (filter === "score-8") {
    return (opportunity.clone_opportunity_score ?? 0) >= 8;
  }
  if (filter === "unknown") return !opportunity.revenue_confidence;
  return opportunity.revenue_confidence === filter;
}

function matchesSearch(opportunity: ProductOpportunity, query: string) {
  if (!query) return true;

  const haystack = [
    opportunity.product_name,
    opportunity.canonical_domain,
    opportunity.target_customer,
    opportunity.core_product_idea,
    opportunity.business_model,
    opportunity.pricing_summary,
    opportunity.why_this_is_cloneable,
    opportunity.simpler_cheaper_angle,
    opportunity.main_risks,
    ...normalizeList(opportunity.likely_distribution_channels),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function ProductOpportunityCard({
  opportunity,
}: {
  opportunity: ProductOpportunity;
}) {
  const [expanded, setExpanded] = useState(false);
  const confidence = confidenceKey(opportunity);
  const confidenceConfig = CONFIDENCE_CONFIG[confidence];
  const channels = normalizeList(opportunity.likely_distribution_channels);
  const sourceUrls = normalizeList(opportunity.source_urls);
  const websiteUrl = externalUrl(opportunity.website_url);

  return (
    <div className="flex flex-col bg-surface transition-colors">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-ink hover:underline break-words"
              >
                {opportunity.product_name}
              </a>
            ) : (
              <p className="text-sm font-medium text-ink break-words">
                {opportunity.product_name}
              </p>
            )}
            <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200">
              {scoreLabel(opportunity.clone_opportunity_score)}
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-md border ${confidenceConfig.style}`}
            >
              {confidenceConfig.label}
            </span>
          </div>
          <p className="font-mono text-xs text-ink-faint mt-1 break-all">
            {opportunity.canonical_domain} &middot;{" "}
            {formatDate(opportunity.discovered_on)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            {expanded ? "Hide" : "Details"}
          </button>
          <Link
            href={`/admin/product-opportunities/${opportunity.id}`}
            className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
          >
            Open
          </Link>
          <DeleteProductOpportunityButton
            id={opportunity.id}
            name={opportunity.product_name}
          />
        </div>
      </div>

      <div className="px-5 py-3">
        {opportunity.core_product_idea ? (
          <p className="text-sm text-ink leading-6">
            {opportunity.core_product_idea}
          </p>
        ) : (
          <p className="text-sm text-ink-faint font-mono">No idea summary.</p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border mx-5 mb-5 pt-5 flex flex-col gap-5">
          {opportunity.target_customer && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Target Customer
              </p>
              <p className="text-sm text-ink">{opportunity.target_customer}</p>
            </div>
          )}

          {opportunity.business_model && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Business Model
              </p>
              <p className="text-sm text-ink">{opportunity.business_model}</p>
            </div>
          )}

          {opportunity.pricing_summary && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Pricing</p>
              <p className="text-sm text-ink">{opportunity.pricing_summary}</p>
            </div>
          )}

          {opportunity.why_this_is_cloneable && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Why Cloneable
              </p>
              <p className="text-sm text-ink">
                {opportunity.why_this_is_cloneable}
              </p>
            </div>
          )}

          {opportunity.simpler_cheaper_angle && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">
                Simpler / Cheaper Angle
              </p>
              <p className="text-sm text-ink">
                {opportunity.simpler_cheaper_angle}
              </p>
            </div>
          )}

          {channels.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">
                Distribution Channels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {channels.map((channel) => (
                  <span
                    key={channel}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-background border border-border text-ink-muted"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          )}

          {opportunity.main_risks && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-mono text-ink-faint">Main Risks</p>
              <p className="text-sm text-ink">{opportunity.main_risks}</p>
            </div>
          )}

          {sourceUrls.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-faint">Sources</p>
              <div className="flex flex-col gap-1">
                {sourceUrls.slice(0, 5).map((url) => (
                  <a
                    key={url}
                    href={externalUrl(url) ?? url}
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
        </div>
      )}
    </div>
  );
}

export default function ProductOpportunityList({
  opportunities,
}: {
  opportunities: ProductOpportunity[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          matchesFilter(opportunity, filter) &&
          matchesSearch(opportunity, normalizedSearch)
      ),
    [filter, normalizedSearch, opportunities]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOpportunities = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const counts = useMemo(() => {
    const result: Record<FilterType, number> = {
      all: opportunities.length,
      "score-8": 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };

    opportunities.forEach((opportunity) => {
      if ((opportunity.clone_opportunity_score ?? 0) >= 8) {
        result["score-8"] += 1;
      }

      const key = confidenceKey(opportunity);
      result[key] += 1;
    });

    return result;
  }, [opportunities]);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "score-8", label: "Score 8+" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "unknown", label: "Unknown" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search products, domains, customers, channels..."
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
              {label} ({counts[value]})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-2xl">
          <p className="text-ink-faint font-mono text-sm">
            No product opportunities here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {pageOpportunities.map((opportunity) => (
              <ProductOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-ink-faint">
                Page {safePage} of {totalPages} &middot; {filtered.length}{" "}
                opportunities
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={safePage === 1}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
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
