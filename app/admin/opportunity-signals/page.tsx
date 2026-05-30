import Link from "next/link";
import { getAllOpportunitySignals } from "@/lib/opportunity-signals";
import OpportunitySignalList from "@/components/admin/OpportunitySignalList";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function OpportunitySignalsAdminPage() {
  const signals = await getAllOpportunitySignals();

  const today = new Date().toISOString().split("T")[0];
  const todayCount = signals.filter(
    (s) => new Date(s.discovered_at).toISOString().split("T")[0] === today
  ).length;
  const activeCount = signals.filter((s) => s.status !== "closed").length;
  const interviewingCount = signals.filter(
    (s) => s.status === "interviewing"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-6 mb-10">
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
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {signals.length} total &middot; {activeCount} active &middot;{" "}
              {todayCount} today &middot; {interviewingCount} interviewing
            </span>
            <Link
              href="/admin/opportunity-signals/new"
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
            >
              <span className="text-base leading-none">+</span> Add
            </Link>
            <SignOutButton />
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
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
