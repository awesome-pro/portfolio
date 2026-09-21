"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  OpportunitySignal,
  OpportunitySignalStatus,
} from "@/lib/opportunity-signals";
import type { SignalLink } from "@/lib/signal-links";
import { updateOpportunitySignal } from "@/app/admin/opportunity-signals/actions";
import DeleteOpportunitySignalButton from "./DeleteOpportunitySignalButton";
import { Input, Label, LinksField, StatusSelect, Textarea } from "./SignalFields";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Everything about a signal is editable here, so the admin list never needs to
 * navigate to a separate page to change a note or fix a link.
 */
export default function OpportunitySignalEditor({
  signal,
}: {
  signal: OpportunitySignal;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [companyName, setCompanyName] = useState(signal.company_name);
  const [website, setWebsite] = useState(signal.website ?? "");
  const [status, setStatus] = useState<OpportunitySignalStatus>(
    signal.status ?? "new"
  );
  const [links, setLinks] = useState<SignalLink[]>(signal.links ?? []);
  const [notes, setNotes] = useState(signal.notes ?? "");

  function reset() {
    setCompanyName(signal.company_name);
    setWebsite(signal.website ?? "");
    setStatus(signal.status ?? "new");
    setLinks(signal.links ?? []);
    setNotes(signal.notes ?? "");
    setError(null);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await updateOpportunitySignal(signal.id, {
          company_name: companyName,
          website,
          status,
          notes,
          links,
        });
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label required>Company name</Label>
          <Input
            value={companyName}
            onChange={setCompanyName}
            placeholder="Nvidia"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Website</Label>
          <Input
            value={website}
            onChange={setWebsite}
            placeholder="https://nvidia.com"
            type="url"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-[12rem]">
        <Label>Status</Label>
        <StatusSelect value={status} onChange={setStatus} />
      </div>

      <LinksField links={links} onChange={setLinks} />

      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={setNotes}
          rows={5}
          placeholder="Why this company is worth a look, who to contact, next step..."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <DeleteOpportunitySignalButton
            id={signal.id}
            companyName={signal.company_name}
          />
          <span className="text-xs font-mono text-ink-faint">
            Updated {formatDate(signal.updated_at)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {error && <p className="text-xs font-mono text-destructive">{error}</p>}
          {saved && !error && (
            <p className="text-xs font-mono text-ink-muted">Saved</p>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className="text-xs font-mono text-ink-faint hover:text-ink transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold bg-ink text-background rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
