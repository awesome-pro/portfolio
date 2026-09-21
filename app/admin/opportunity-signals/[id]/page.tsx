import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunitySignalById } from "@/lib/opportunity-signals";
import { normalizeSignalLinks } from "@/lib/signal-links";
import DeleteOpportunitySignalButton from "@/components/admin/DeleteOpportunitySignalButton";
import OpportunitySignalStatusChanger from "@/components/admin/OpportunitySignalStatusChanger";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-mono text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

export default async function OpportunitySignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signal = await getOpportunitySignalById(id);
  if (!signal) notFound();

  const links = normalizeSignalLinks(signal.links);
  const today = new Date().toISOString().split("T")[0];
  const isNew =
    new Date(signal.discovered_at).toISOString().split("T")[0] === today;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0">
            <Link
              href="/admin/opportunity-signals"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Opportunity Signals
            </Link>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {isNew && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                  New today
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink mt-2 break-words">
              {signal.company_name}
            </h1>
            {signal.website && (
              <a
                href={
                  /^https?:\/\//i.test(signal.website)
                    ? signal.website
                    : `https://${signal.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-ink-faint hover:text-ink transition-colors mt-0.5 inline-block"
              >
                {signal.website}
              </a>
            )}
          </div>
          <DeleteOpportunitySignalButton
            id={signal.id}
            companyName={signal.company_name}
            redirectTo="/admin/opportunity-signals"
          />
        </div>

        <div className="flex flex-col gap-6 mb-6 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Status
          </p>
          <OpportunitySignalStatusChanger
            id={signal.id}
            current={signal.status}
          />
        </div>

        <div className="flex flex-col gap-5 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Signal Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            <InfoBlock label="Discovered">
              <p className="text-sm text-ink font-mono">
                {formatDate(signal.discovered_at)}
              </p>
            </InfoBlock>
            <InfoBlock label="Last Updated">
              <p className="text-sm text-ink font-mono">
                {formatDate(signal.updated_at)}
              </p>
            </InfoBlock>
          </div>

          {links.length > 0 && (
            <InfoBlock label="Links">
              <div className="flex flex-col gap-1.5">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={
                      /^https?:\/\//i.test(link.url)
                        ? link.url
                        : `https://${link.url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-ink-muted hover:text-ink break-all"
                  >
                    {link.title ? `${link.title} — ${link.url}` : link.url}
                  </a>
                ))}
              </div>
            </InfoBlock>
          )}

          {signal.notes && (
            <InfoBlock label="Notes">
              <p className="text-sm text-ink leading-6 whitespace-pre-wrap">
                {signal.notes}
              </p>
            </InfoBlock>
          )}
        </div>
      </div>
    </div>
  );
}
