import type { ReactNode } from "react";

export interface ComparisonRow {
  metric: string;
  /** One value per column, same order as `columns`. */
  values: string[];
  /** Index of the column whose value is "better" — gets emphasized. */
  betterIndex?: number;
  note?: ReactNode;
}

/**
 * Two-or-more-column metric comparison table (e.g. baseline vs. trained).
 * The highlighted column is emphasized; the "better" cell per row is bolded.
 * Reusable across projects.
 */
export default function ComparisonTable({
  columns,
  rows,
  caption,
}: {
  columns: { label: string; highlight?: boolean }[];
  rows: ComparisonRow[];
  caption?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-medium text-ink-muted px-4 py-3 text-xs uppercase tracking-wider">
                Metric
              </th>
              {columns.map((c) => (
                <th
                  key={c.label}
                  className={`text-right px-4 py-3 font-mono text-xs ${
                    c.highlight ? "text-ink font-semibold" : "text-ink-muted"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">
                  {row.metric}
                  {row.note && (
                    <span className="block text-xs text-ink-faint mt-0.5">
                      {row.note}
                    </span>
                  )}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`text-right px-4 py-3 font-mono tabular-nums ${
                      row.betterIndex === i
                        ? "text-ink font-semibold"
                        : "text-ink-muted"
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <p className="text-xs text-ink-faint px-4 py-3 border-t border-border leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  );
}
