import Link from "next/link";
import { getAllProductOpportunities } from "@/lib/product-opportunities";
import ProductOpportunityList from "@/components/admin/ProductOpportunityList";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProductOpportunitiesAdminPage() {
  const opportunities = await getAllProductOpportunities();
  const topScoreCount = opportunities.filter(
    (opportunity) => (opportunity.clone_opportunity_score ?? 0) >= 8
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
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Product Opportunities
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink-faint">
              {opportunities.length} total &middot; {topScoreCount} top score
            </span>
            <SignOutButton />
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm">
              No product opportunities yet. The agent will add them soon.
            </p>
          </div>
        ) : (
          <ProductOpportunityList opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}
