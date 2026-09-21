"use client";

import type { ReactNode } from "react";
import type { OpportunitySignalStatus } from "@/lib/opportunity-signals";
import type { SignalLink } from "@/lib/signal-links";

export const STATUS_OPTIONS: { value: OpportunitySignalStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reached_out", label: "Reached Out" },
  { value: "interviewing", label: "Interviewing" },
  { value: "closed", label: "Closed" },
];

export function Label({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-mono text-ink-muted">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-y leading-relaxed"
    />
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: OpportunitySignalStatus;
  onChange: (value: OpportunitySignalStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as OpportunitySignalStatus)}
      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink-muted transition-colors"
    >
      {STATUS_OPTIONS.map(({ value: option, label }) => (
        <option key={option} value={option}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function LinksField({
  links,
  onChange,
}: {
  links: SignalLink[];
  onChange: (links: SignalLink[]) => void;
}) {
  function update(index: number, patch: Partial<SignalLink>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function remove(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Links</Label>
      <div className="flex flex-col gap-1.5">
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="url"
              value={link.url}
              onChange={(event) => update(index, { url: event.target.value })}
              placeholder="https://..."
              className="flex-[2] min-w-0 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors font-mono"
            />
            <input
              type="text"
              value={link.title ?? ""}
              onChange={(event) => update(index, { title: event.target.value })}
              placeholder="Label (optional)"
              className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove link"
              className="text-xs font-mono px-2.5 py-2 rounded-lg border border-border text-ink-faint hover:border-destructive/40 hover:text-destructive transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...links, { url: "" }])}
          className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-dashed border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
        >
          + Add link
        </button>
      </div>
    </div>
  );
}
