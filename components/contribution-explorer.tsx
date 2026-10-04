"use client";

import { useState } from "react";
import ContributionList from "@/components/contributions";
import type { Contribution } from "@/lib/contributions";

/**
 * The contribution list, split by state.
 *
 * Merged and open answer different questions: merged is proof of work, open is
 * what is in flight right now. Merged leads because it is the stronger claim.
 *
 * Pull requests only. Issues are still fetched and classified in
 * lib/contributions.ts — the `kind` field is what separates them — but nothing
 * on the site displays them, so this component receives PRs and never has to
 * ask.
 *
 * The homepage renders ContributionList directly, on the server, with merged
 * pull requests only; this client component exists for the page where you want
 * to look things up rather than be impressed.
 */
const TABS: { status: "merged" | "open"; label: string }[] = [
  { status: "merged", label: "merged" },
  { status: "open", label: "open" },
];

export default function ContributionExplorer({
  contributions,
}: {
  contributions: Contribution[];
}) {
  const [status, setStatus] = useState<"merged" | "open">("merged");

  const counts = {
    merged: contributions.filter((c) => c.status === "merged").length,
    open: contributions.filter((c) => c.status === "open").length,
  } satisfies Record<"merged" | "open", number>;

  const visible = contributions.filter((c) => c.status === status);

  return (
    <>
      <div
        role="group"
        aria-label="Pull request state"
        className="flex items-center gap-1.5 font-mono text-[13px] tracking-[0.14em] uppercase"
      >
        {TABS.map((tab, index) => (
          <span key={tab.status} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => setStatus(tab.status)}
              aria-pressed={status === tab.status}
              className={`cursor-pointer transition-colors ${
                status === tab.status
                  ? "text-ink"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}{" "}
              <span className="tabular-nums">{counts[tab.status]}</span>
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
