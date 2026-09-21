import Link from "next/link";
import { getAllOpportunitySignals } from "@/lib/opportunity-signals";
import { getAllArtifactsAdmin } from "@/lib/artifacts";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const [signals, artifacts] = await Promise.all([
    getAllOpportunitySignals(),
    getAllArtifactsAdmin(),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const activeSignalsCount = signals.filter((s) => s.status !== "closed").length;
  const todaySignalsCount = signals.filter(
    (s) => new Date(s.discovered_at).toISOString().split("T")[0] === today
  ).length;
  const interviewingCount = signals.filter(
    (s) => s.status === "interviewing"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-1">
              Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/artifacts"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Artifacts
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">Build Artifacts</h2>
            <p className="font-mono text-xs text-ink-faint">{artifacts.length} total</p>
          </Link>

          <Link
            href="/admin/opportunity-signals"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Signals
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Opportunity Signals
            </h2>
            <p className="font-mono text-xs text-ink-faint">
              {signals.length} total &middot; {activeSignalsCount} active &middot;{" "}
              {todaySignalsCount} today &middot; {interviewingCount} interviewing
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
