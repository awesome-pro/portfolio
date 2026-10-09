import Link from "next/link";
import { getAllOpportunitySignals } from "@/lib/opportunity-signals";
import { getAllSignalNotes } from "@/lib/opportunity-notes";
import { noteRange } from "@/lib/signal-notes";
import OpportunitySignalList from "@/components/admin/OpportunitySignalList";
import SignalNoteList from "@/components/admin/SignalNoteList";
import CreateNoteButton from "@/components/admin/CreateNoteButton";

export const dynamic = "force-dynamic";

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`text-xs font-mono pb-2 -mb-px border-b-2 transition-colors ${
        active
          ? "border-ink text-ink"
          : "border-transparent text-ink-faint hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function OpportunitySignalsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const params = await searchParams;
  // The tab lives in the URL so a refresh or the back button keeps you where
  // you were, and so a note's company chip can link straight to a search.
  const tab = params.tab === "notes" ? "notes" : "signals";
  const initialSearch = typeof params.q === "string" ? params.q : "";

  const [signals, { notes, ready: notesReady }] = await Promise.all([
    getAllOpportunitySignals(),
    getAllSignalNotes(),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todayCount = signals.filter(
    (s) => new Date(s.discovered_at).toISOString().split("T")[0] === today
  ).length;
  const appliedCount = signals.filter((s) => s.status === "applied").length;
  const interviewingCount = signals.filter(
    (s) => s.status === "interviewing"
  ).length;
  const focusCount = signals.filter((s) => s.focus).length;
  const dueToday = notes.filter(
    (note) => noteRange(note.note_date, today) === "today"
  ).length;

  // Total first, then only the numbers that are actually non-zero — a row of
  // "0 today · 0 interviewing" is noise, not information.
  const stats = [
    `${signals.length} signals`,
    `★ ${focusCount} focus`,
    ...(appliedCount > 0 ? [`${appliedCount} applied`] : []),
    ...(interviewingCount > 0 ? [`${interviewingCount} interviewing`] : []),
    ...(todayCount > 0 ? [`${todayCount} today`] : []),
    ...(dueToday > 0 ? [`${dueToday} notes today`] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <Link
              href="/admin"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Opportunity Signals
            </h1>
            <p className="text-xs font-mono text-ink-faint mt-1.5">
              {stats.join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CreateNoteButton signals={signals} today={today} />
            <Link
              href="/admin/opportunity-signals/new"
              className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors shrink-0"
            >
              <span className="text-base leading-none">+</span> Add
            </Link>
          </div>
        </div>

        <nav className="flex items-center gap-5 border-b border-border mb-5">
          <TabLink
            href="/admin/opportunity-signals"
            active={tab === "signals"}
            label={`signals (${signals.length})`}
          />
          <TabLink
            href="/admin/opportunity-signals?tab=notes"
            active={tab === "notes"}
            label={`notes (${notes.length})`}
          />
        </nav>

        {tab === "signals" ? (
          signals.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-xl">
              <p className="text-ink-faint font-mono text-sm">
                No signals yet. The agent will add them soon.
              </p>
            </div>
          ) : (
            <OpportunitySignalList
              key={initialSearch || "signals"}
              signals={signals}
              initialSearch={initialSearch}
            />
          )
        ) : (
          <SignalNoteList
            notes={notes}
            signals={signals}
            today={today}
            ready={notesReady}
          />
        )}
      </div>
    </div>
  );
}
