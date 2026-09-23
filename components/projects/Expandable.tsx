"use client";

import { useState, type ReactNode } from "react";

/**
 * Progressive disclosure for the homepage project list.
 *
 * The collapsed rows stay in the DOM so crawlers and no-JS readers still reach
 * every link; they are hidden with a `grid-template-rows` transition, and
 * `inert` keeps them out of the tab order and the accessibility tree while
 * collapsed. Children are server-rendered and passed through, so this only
 * ships the toggle's own state to the client.
 */
export default function Expandable({
  children,
  count,
  noun,
}: {
  children: ReactNode;
  count: number;
  noun: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden" inert={!expanded}>
          {children}
        </div>
      </div>

      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex items-center gap-2 py-5 font-mono text-xs text-ink-faint transition-colors hover:text-ink"
        >
          {expanded ? "show fewer" : `${count} more ${noun}`}
          <span
            aria-hidden
            className={`inline-block transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ↓
          </span>
        </button>
      </div>
    </>
  );
}
