"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OpportunitySignalStatus } from "@/lib/opportunity-signals";
import type { SignalLink } from "@/lib/signal-links";
import {
  createOpportunitySignal,
  type CreateOpportunitySignalInput,
} from "@/app/admin/opportunity-signals/actions";
import {
  Input,
  Label,
  LinksField,
  StatusSelect,
  Textarea,
} from "./SignalFields";

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
        <StatusSelect value={status} onChange={setStatus} />
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
