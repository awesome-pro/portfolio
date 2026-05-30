import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import OpportunitySignalForm from "@/components/admin/OpportunitySignalForm";

export default function NewOpportunitySignalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href="/admin/opportunity-signals"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Opportunity Signals
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Add Signal
            </h1>
          </div>
          <SignOutButton />
        </div>

        <OpportunitySignalForm />
      </div>
    </div>
  );
}
