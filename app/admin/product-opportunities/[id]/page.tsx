import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductOpportunityById } from "@/lib/product-opportunities";
import DeleteProductOpportunityButton from "@/components/admin/DeleteProductOpportunityButton";

export const dynamic = "force-dynamic";

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      return "";
    })
    .filter((item) => item.length > 0);
}

function externalUrl(url: string | null) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-mono text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <InfoBlock label={label}>
      <p className="text-sm text-ink leading-6 whitespace-pre-wrap">{value}</p>
    </InfoBlock>
  );
}

export default async function ProductOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getProductOpportunityById(id);
  if (!opportunity) notFound();

  const websiteUrl = externalUrl(opportunity.website_url);
  const channels = normalizeList(opportunity.likely_distribution_channels);
  const sourceUrls = normalizeList(opportunity.source_urls);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0">
            <Link
              href="/admin/product-opportunities"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              Back to Product Opportunities
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-ink mt-1 break-words">
              {opportunity.product_name}
            </h1>
            <p className="font-mono text-xs text-ink-faint mt-1 break-all">
              {opportunity.canonical_domain}
            </p>
          </div>
          <DeleteProductOpportunityButton
            id={opportunity.id}
            name={opportunity.product_name}
            redirectTo="/admin/product-opportunities"
          />
        </div>

        <div className="flex flex-col gap-5 mb-10 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Opportunity Info
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoBlock label="Score">
              <p className="text-sm text-ink font-mono">
                {typeof opportunity.clone_opportunity_score === "number"
                  ? `${opportunity.clone_opportunity_score}/10`
                  : "No score"}
              </p>
            </InfoBlock>
            <InfoBlock label="Revenue Confidence">
              <p className="text-sm text-ink font-mono capitalize">
                {opportunity.revenue_confidence ?? "Unknown"}
              </p>
            </InfoBlock>
            <InfoBlock label="Discovered">
              <p className="text-sm text-ink font-mono">
                {formatDate(opportunity.discovered_on)}
              </p>
            </InfoBlock>
          </div>

          {websiteUrl && (
            <InfoBlock label="Website">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink hover:underline break-all"
              >
                {opportunity.website_url}
              </a>
            </InfoBlock>
          )}

          <TextBlock
            label="Target Customer"
            value={opportunity.target_customer}
          />
          <TextBlock
            label="Core Product Idea"
            value={opportunity.core_product_idea}
          />
          <TextBlock label="Business Model" value={opportunity.business_model} />
          <TextBlock label="Pricing" value={opportunity.pricing_summary} />
          <TextBlock
            label="Revenue Raw Text"
            value={opportunity.revenue_raw_text}
          />
          <TextBlock
            label="Why This Is Cloneable"
            value={opportunity.why_this_is_cloneable}
          />
          <TextBlock
            label="Simpler / Cheaper Angle"
            value={opportunity.simpler_cheaper_angle}
          />

          {channels.length > 0 && (
            <InfoBlock label="Likely Distribution Channels">
              <div className="flex flex-wrap gap-1.5">
                {channels.map((channel) => (
                  <span
                    key={channel}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-background border border-border text-ink-muted"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </InfoBlock>
          )}

          <TextBlock label="Main Risks" value={opportunity.main_risks} />

          {sourceUrls.length > 0 && (
            <InfoBlock label="Sources">
              <div className="flex flex-col gap-1">
                {sourceUrls.map((url) => (
                  <a
                    key={url}
                    href={externalUrl(url) ?? url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-ink-muted hover:text-ink break-all"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </InfoBlock>
          )}
        </div>
      </div>
    </div>
  );
}
