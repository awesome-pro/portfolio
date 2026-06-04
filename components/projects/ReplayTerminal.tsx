"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TraceRole = "user" | "planner" | "tool" | "verifier" | "answer";

export interface TraceStep {
  role: TraceRole;
  /** e.g. "think", "code", "search", "answer" — shown as the action tag. */
  action?: string;
  /** Main body text (preserves line breaks). */
  text: string;
}

const ROLE_META: Record<TraceRole, { label: string; tone: string }> = {
  user: { label: "PROMPT", tone: "text-ink" },
  planner: { label: "PLANNER", tone: "text-blue-500" },
  tool: { label: "EXECUTOR", tone: "text-emerald-500" },
  verifier: { label: "VERIFIER", tone: "text-amber-500" },
  answer: { label: "ANSWER", tone: "text-ink" },
};

/**
 * Steps through a captured agent trace with play / step / reset controls.
 * Content is real captured output (swap the `steps` data anytime).
 */
export default function ReplayTerminal({
  steps,
  title = "main.py — replay",
}: {
  steps: TraceStep[];
  title?: string;
}) {
  const [visible, setVisible] = useState(1);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const atEnd = visible >= steps.length;

  const step = useCallback(() => {
    setVisible((v) => Math.min(v + 1, steps.length));
  }, [steps.length]);

  const reset = useCallback(() => {
    setPlaying(false);
    setVisible(1);
  }, []);

  // Auto-play: schedule the next reveal while playing; stop scheduling at the end.
  useEffect(() => {
    if (!playing || atEnd) return;
    const t = setTimeout(
      () => setVisible((v) => Math.min(v + 1, steps.length)),
      1100,
    );
    return () => clearTimeout(t);
  }, [playing, visible, atEnd, steps.length]);

  // Keep newest step in view
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible]);

  return (
    <div className="rounded-2xl border border-border bg-[#0d0d0c] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="ml-3 font-mono text-[11px] text-white/40">{title}</span>
        </div>
        <span className="font-mono text-[11px] text-white/30 tabular-nums">
          {visible}/{steps.length}
        </span>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="px-4 py-4 max-h-[26rem] overflow-y-auto flex flex-col gap-3 font-mono text-[12.5px] leading-relaxed"
      >
        {steps.slice(0, visible).map((s, i) => {
          const meta = ROLE_META[s.role];
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold tracking-wider ${meta.tone}`}>
                  {meta.label}
                </span>
                {s.action && (
                  <span className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">
                    {s.action}
                  </span>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-white/80 m-0 font-mono">
                {s.text}
              </pre>
            </div>
          );
        })}
        {!atEnd && (
          <span className="text-white/30 animate-pulse">▍</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
        <button
          onClick={() => (atEnd ? reset() : setPlaying((p) => !p))}
          className="font-mono text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition-colors cursor-pointer"
        >
          {atEnd ? "↺ Replay" : playing ? "❚❚ Pause" : "▶ Run"}
        </button>
        <button
          onClick={step}
          disabled={atEnd}
          className="font-mono text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          Step →
        </button>
        <span className="ml-auto font-mono text-[10px] text-white/25">
          representative trace
        </span>
      </div>
    </div>
  );
}
