import Link from "next/link";
import { getAllOpportunitySignals } from "@/lib/opportunity-signals";
import OpportunitySignalList from "@/components/admin/OpportunitySignalList";

export const dynamic = "force-dynamic";

export default async function OpportunitySignalsAdminPage() {
  const signals = await getAllOpportunitySignals();

  const today = new Date().toISOString().split("T")[0];
  const todayCount = signals.filter(
    (s) => new Date(s.discovered_at).toISOString().split("T")[0] === today
  ).length;
  const appliedCount = signals.filter((s) => s.status === "applied").length;
  const interviewingCount = signals.filter(
    (s) => s.status === "interviewing"
  ).length;
  const focusCount = signals.filter((s) => s.focus).length;

  // Total first, then only the numbers that are actually non-zero — a row of
  // "0 today · 0 interviewing" is noise, not information.
  const stats = [
    `${signals.length} signals`,
    `★ ${focusCount} focus`,
    ...(appliedCount > 0 ? [`${appliedCount} applied`] : []),
    ...(interviewingCount > 0 ? [`${interviewingCount} interviewing`] : []),
    ...(todayCount > 0 ? [`${todayCount} today`] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-7">
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
          <Link
            href="/admin/opportunity-signals/new"
            className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors shrink-0"
          >
            <span className="text-base leading-none">+</span> Add
          </Link>
        </div>

        {signals.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-xl">
            <p className="text-ink-faint font-mono text-sm">
              No signals yet. The agent will add them soon.
            </p>
          </div>
        ) : (
          <OpportunitySignalList signals={signals} />
        )}
      </div>
    </div>
  );
}
