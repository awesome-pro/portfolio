"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitySignalStatus } from "@/lib/opportunity-signals";
import type { SignalLink } from "@/lib/signal-links";
import {
  createOpportunitySignal,
  type CreateOpportunitySignalInput,
} from "@/app/admin/opportunity-signals/actions";

const STATUS_OPTIONS: { value: OpportunitySignalStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reached_out", label: "Reached Out" },
  { value: "interviewing", label: "Interviewing" },
  { value: "closed", label: "Closed" },
];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-mono text-ink-muted">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors resize-none leading-relaxed"
    />
  );
}

function LinksField({
  links,
  onChange,
}: {
  links: SignalLink[];
  onChange: (links: SignalLink[]) => void;
}) {
  function update(i: number, patch: Partial<SignalLink>) {
    onChange(links.map((link, idx) => (idx === i ? { ...link, ...patch } : link)));
  }

  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Links</Label>
      <div className="flex flex-col gap-1.5">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="url"
              value={link.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://..."
              className="flex-[2] min-w-0 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors font-mono"
            />
            <input
              type="text"
              value={link.title ?? ""}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Label (optional)"
              className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors"
            />
            <button
              type="button"
              onClick={() => remove(i)}
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

export default function OpportunitySignalForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<OpportunitySignalStatus>("new");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<SignalLink[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    const cleanLinks = links
      .map((link) => {
        const title = link.title?.trim();
        return { url: link.url.trim(), ...(title ? { title } : {}) };
      })
      .filter((link) => link.url);

    const input: CreateOpportunitySignalInput = {
      company_name: companyName,
      website,
      status,
      notes,
      links: cleanLinks,
    };

    startTransition(async () => {
      try {
        await createOpportunitySignal(input);
        // redirect happens inside the action
      } catch (err) {
        if (err instanceof Error && err.message.includes("duplicate")) {
          setError(`A signal for "${companyName}" already exists.`);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Company & website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label required>Company Name</Label>
          <Input
            value={companyName}
            onChange={setCompanyName}
            placeholder="Acme Corp"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Website</Label>
          <Input
            value={website}
            onChange={setWebsite}
            placeholder="https://acme.com"
            type="url"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OpportunitySignalStatus)}
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink-muted transition-colors"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <LinksField links={links} onChange={setLinks} />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={setNotes}
          placeholder="Why this company is worth a look, who to contact, next step..."
          rows={4}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs font-mono text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold bg-ink text-background rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Adding..." : "Add Signal"}
          </button>
        </div>
      </div>
    </form>
  );
}
