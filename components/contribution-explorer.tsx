"use client";

import { useState } from "react";
import ContributionList from "@/components/contributions";
import type { Contribution, ContributionKind } from "@/lib/contributions";

/**
 * Pull requests and issues, one kind at a time.
 *
 * They are not the same evidence — a merged PR is work that shipped, an issue is
 * a report — so the full page separates them instead of folding both into one
 * ranking. Pull requests are what opens by default; the homepage shows nothing
 * but pull requests, because a bug report sitting in the top three reads as
 * weaker proof of work than code that landed.
 *
 * This is the only stateful part of the page. ContributionList stays a plain
 * component so the homepage can keep rendering it on the server with no client
 * JavaScript of its own.
 */
const TABS: { kind: ContributionKind; label: string }[] = [
  { kind: "pr", label: "pull requests" },
  { kind: "issue", label: "issues" },
];

export default function ContributionExplorer({
  contributions,
}: {
  contributions: Contribution[];
}) {
  const [kind, setKind] = useState<ContributionKind>("pr");

  const counts = {
    pr: contributions.filter((c) => c.kind === "pr").length,
    issue: contributions.filter((c) => c.kind === "issue").length,
  } satisfies Record<ContributionKind, number>;

  const visible = contributions.filter((c) => c.kind === kind);

  return (
    <>
      <div
        role="group"
        aria-label="Contribution kind"
        className="flex items-center gap-1.5 font-mono text-[13px] tracking-[0.14em] uppercase"
      >
        {TABS.map((tab, index) => (
          <span key={tab.kind} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => setKind(tab.kind)}
              aria-pressed={kind === tab.kind}
              className={`cursor-pointer transition-colors ${
                kind === tab.kind ? "text-ink" : "text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}{" "}
              <span className="tabular-nums">{counts[tab.kind]}</span>
            </button>
          </span>
        ))}
      </div>

      <div className="mt-6">
        {visible.length > 0 ? (
          <ContributionList contributions={visible} />
        ) : (
          <p className="py-10 font-mono text-sm text-ink-faint">
            Nothing here yet.
          </p>
        )}
      </div>
    </>
  );
}
