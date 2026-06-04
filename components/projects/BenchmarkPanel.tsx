"use client";

import { useState } from "react";

export interface BenchmarkRow {
  label: string;
  accuracy: number; // percentage 0–100
  avgSteps?: number;
  highlight?: boolean;
  note?: string;
}

export interface BenchmarkGroup {
  /** e.g. "GPQA-Diamond (n=100)" */
  name: string;
  /** Optional one-line takeaway under the chart. */
  takeaway?: string;
  rows: BenchmarkRow[];
}

/**
 * Interactive before/after benchmark panel: tab between benchmark groups,
 * bars animate from the baseline width. Reusable across projects.
 */
export default function BenchmarkPanel({ groups }: { groups: BenchmarkGroup[] }) {
  const [active, setActive] = useState(0);
  const group = groups[active];
  const max = Math.max(...group.rows.map((r) => r.accuracy), 1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {/* Tabs */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {groups.map((g, i) => (
            <button
              key={g.name}
              onClick={() => setActive(i)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                i === active
                  ? "bg-ink text-background border-ink"
                  : "border-border text-ink-muted hover:border-ink-muted hover:text-ink"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Bars */}
      <div className="flex flex-col gap-4">
        {group.rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-ink">
                {row.label}
                {row.highlight && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                    trained
                  </span>
                )}
              </span>
              <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                {row.accuracy.toFixed(1)}%
                {row.avgSteps != null && (
                  <span className="ml-2 text-ink-faint font-normal">
                    {row.avgSteps.toFixed(2)} steps
                  </span>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-background border border-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                  row.highlight ? "bg-ink" : "bg-ink-faint"
                }`}
                style={{ width: `${(row.accuracy / max) * 100}%` }}
              />
            </div>
            {row.note && (
              <p className="text-xs text-ink-faint mt-1">{row.note}</p>
            )}
          </div>
        ))}
      </div>

      {group.takeaway && (
        <p className="text-sm text-ink-muted leading-relaxed mt-6 pt-5 border-t border-border">
          {group.takeaway}
        </p>
      )}
    </div>
  );
}
