"use client";

import { useState } from "react";

/**
 * A block of shell commands with a copy button. Reusable across projects.
 */
export default function CopyCommand({
  lines,
  label,
}: {
  lines: string[];
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-[#0d0d0c] overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-white/10 font-mono text-[11px] text-white/40">
          {label}
        </div>
      )}
      <div className="relative">
        <button
          onClick={copy}
          className="absolute top-2.5 right-2.5 font-mono text-[10px] px-2 py-1 rounded border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
          aria-label="Copy commands"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
        <pre className="px-4 py-3.5 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-white/85 m-0">
          {lines.map((l, i) => (
            <div key={i}>
              <span className="text-white/30 select-none">$ </span>
              {l}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
