"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PersonToReach, OpportunitySignalStatus } from "@/lib/opportunity-signals";
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

const SIGNAL_TYPE_SUGGESTIONS = [
  "hiring",
  "funded+hiring",
  "product_launch",
  "funded+hiring+product_launch",
  "expansion",
  "partnership",
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

function LinkArrayField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  function update(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }

  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...values, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-1.5">
        {values.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder ?? "https://..."}
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-muted transition-colors font-mono"
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
          onClick={add}
          className="self-start text-xs font-mono px-3 py-1.5 rounded-lg border border-dashed border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
        >
          + Add link
        </button>
      </div>
    </div>
  );
}

function PersonField({
  person,
  onChange,
  onRemove,
}: {
  person: PersonToReach;
  onChange: (p: PersonToReach) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 border border-border rounded-xl bg-background">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-ink-faint">Person</p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-mono text-ink-faint hover:text-destructive transition-colors"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label required>Name</Label>
          <Input
            value={person.name}
            onChange={(v) => onChange({ ...person, name: v })}
            placeholder="John Smith"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Role</Label>
          <Input
            value={person.role ?? ""}
            onChange={(v) => onChange({ ...person, role: v || undefined })}
            placeholder="CEO, Founder, CTO..."
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>LinkedIn URL</Label>
        <Input
          value={person.linkedin ?? ""}
          onChange={(v) => onChange({ ...person, linkedin: v || undefined })}
          placeholder="https://linkedin.com/in/..."
          type="url"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Note</Label>
        <Input
          value={person.note ?? ""}
          onChange={(v) => onChange({ ...person, note: v || undefined })}
          placeholder="Any context about this person"
        />
      </div>
    </div>
  );
}

export default function OpportunitySignalForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Core fields
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [signalType, setSignalType] = useState("");
  const [reason, setReason] = useState("");
  const [matchScore, setMatchScore] = useState("");
  const [interviewProbability, setInterviewProbability] = useState("");
  const [status, setStatus] = useState<OpportunitySignalStatus>("new");
  const [notes, setNotes] = useState("");

  // Array fields
  const [jobLinks, setJobLinks] = useState<string[]>([]);
  const [relevantLinks, setRelevantLinks] = useState<string[]>([]);
  const [people, setPeople] = useState<PersonToReach[]>([]);

  function addPerson() {
    setPeople((prev) => [...prev, { name: "" }]);
  }

  function updatePerson(i: number, p: PersonToReach) {
    setPeople((prev) => prev.map((item, idx) => (idx === i ? p : item)));
  }

  function removePerson(i: number) {
    setPeople((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) { setError("Company name is required."); return; }
    if (!signalType.trim()) { setError("Signal type is required."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }

    const parsedScore = matchScore === "" ? null : parseInt(matchScore, 10);
    const parsedProb = interviewProbability === "" ? null : parseInt(interviewProbability, 10);

    if (parsedScore !== null && (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)) {
      setError("Match score must be 0–100.");
      return;
    }
    if (parsedProb !== null && (isNaN(parsedProb) || parsedProb < 0 || parsedProb > 100)) {
      setError("Interview probability must be 0–100.");
      return;
    }

    const input: CreateOpportunitySignalInput = {
      company_name: companyName,
      website,
      signal_type: signalType,
      reason,
      match_score: parsedScore,
      interview_probability: parsedProb,
      status,
      notes,
      job_links: jobLinks.map((l) => l.trim()).filter(Boolean),
      relevant_links: relevantLinks.map((l) => l.trim()).filter(Boolean),
      people_to_reach: people.filter((p) => p.name.trim()),
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

      {/* Signal type */}
      <div className="flex flex-col gap-1.5">
        <Label required>Signal Type</Label>
        <Input
          value={signalType}
          onChange={setSignalType}
          placeholder="e.g. hiring, funded+hiring, product_launch"
        />
        <div className="flex flex-wrap gap-1.5 mt-1">
          {SIGNAL_TYPE_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSignalType(s)}
              className="text-xs font-mono px-2.5 py-1 rounded-lg border border-dashed border-border text-ink-faint hover:text-ink hover:border-ink-muted transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <Label required>Why This Signal</Label>
        <Textarea
          value={reason}
          onChange={setReason}
          placeholder="Explain why this company is a good opportunity — what signal did you notice?"
          rows={4}
        />
      </div>

      {/* Scores & status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Match Score (0–100)</Label>
          <Input
            value={matchScore}
            onChange={setMatchScore}
            placeholder="85"
            type="number"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Interview Probability (0–100)</Label>
          <Input
            value={interviewProbability}
            onChange={setInterviewProbability}
            placeholder="60"
            type="number"
          />
        </div>
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
      </div>

      {/* People to reach */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>People to Reach</Label>
          <button
            type="button"
            onClick={addPerson}
            className="text-xs font-mono px-3 py-1.5 rounded-lg border border-dashed border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
          >
            + Add person
          </button>
        </div>
        {people.length > 0 && (
          <div className="flex flex-col gap-2">
            {people.map((person, i) => (
              <PersonField
                key={i}
                person={person}
                onChange={(p) => updatePerson(i, p)}
                onRemove={() => removePerson(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Job links */}
      <LinkArrayField
        label="Job Links"
        values={jobLinks}
        onChange={setJobLinks}
        placeholder="https://jobs.acme.com/engineer"
      />

      {/* Relevant links */}
      <LinkArrayField
        label="Relevant Links"
        values={relevantLinks}
        onChange={setRelevantLinks}
        placeholder="https://techcrunch.com/..."
      />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={setNotes}
          placeholder="Any additional context, your strategy, personal connections..."
          rows={3}
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
          {error && (
            <p className="text-xs font-mono text-destructive">{error}</p>
          )}
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
