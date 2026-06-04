import type { ReactNode } from "react";

export interface PipelineStage {
  /** Short kicker, e.g. "01" or "Phase 1". */
  kicker?: string;
  title: string;
  detail: ReactNode;
}

/**
 * In-code horizontal pipeline diagram (stacks vertically on mobile).
 * Themeable, crisp at any zoom, no external image. Reusable across projects.
 */
export default function PipelineDiagram({
  stages,
}: {
  stages: PipelineStage[];
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
      {stages.map((stage, i) => (
        <div key={i} className="flex flex-col lg:flex-row lg:items-stretch lg:flex-1">
          <div className="flex-1 rounded-xl border border-border bg-surface p-4 flex flex-col">
            {stage.kicker && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint mb-1.5">
                {stage.kicker}
              </span>
            )}
            <p className="text-sm font-semibold text-ink mb-1">{stage.title}</p>
            <p className="text-xs leading-relaxed text-ink-muted">{stage.detail}</p>
          </div>

          {/* Connector */}
          {i < stages.length - 1 && (
            <div
              className="flex items-center justify-center text-ink-faint shrink-0 py-1 lg:py-0 lg:px-1"
              aria-hidden="true"
            >
              {/* down arrow on mobile, right arrow on desktop */}
              <span className="lg:hidden">↓</span>
              <span className="hidden lg:inline">→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
