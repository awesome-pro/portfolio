import Link from "next/link";
import { getAllOpportunitySignals } from "@/lib/opportunity-signals";
import { getAllSignalNotes } from "@/lib/opportunity-notes";
import { noteRange } from "@/lib/signal-notes";
import { getAllArtifactsAdmin } from "@/lib/artifacts";
import { CHECKLISTS, loadChecklist } from "@/lib/prep-checklist";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const [signals, artifacts, sheets, { notes }] = await Promise.all([
    getAllOpportunitySignals(),
    getAllArtifactsAdmin(),
    Promise.all(CHECKLISTS.map((entry) => loadChecklist(entry.slug))),
    getAllSignalNotes(),
  ]);
  const prepItems = sheets.reduce((total, sheet) => total + sheet.itemCount, 0);

  const appliedCount = signals.filter((s) => s.status === "applied").length;
  const interviewingCount = signals.filter(
    (s) => s.status === "interviewing"
  ).length;
  const focusCount = signals.filter((s) => s.focus).length;
  const today = new Date().toISOString().split("T")[0];
  const notesToday = notes.filter(
    (note) => noteRange(note.note_date, today) === "today"
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
              {signals.length} total &middot;{" "}
              <span className="text-ink-muted">★ {focusCount} focus</span>
              {appliedCount > 0 && <> &middot; {appliedCount} applied</>}
              {interviewingCount > 0 && (
                <> &middot; {interviewingCount} interviewing</>
              )}
              {notesToday > 0 && <> &middot; {notesToday} notes today</>}
            </p>
          </Link>

          <Link
            href="/admin/prep"
            className="group flex flex-col gap-3 p-6 border border-border rounded-2xl bg-surface hover:border-ink-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                Prep
              </p>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Interview Prep
            </h2>
            <p className="font-mono text-xs text-ink-faint">
              {prepItems} items across {sheets.length} sheets
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
