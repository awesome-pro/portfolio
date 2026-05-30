import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunitySignalById } from "@/lib/opportunity-signals";
import type { PersonToReach } from "@/lib/opportunity-signals";
import DeleteOpportunitySignalButton from "@/components/admin/DeleteOpportunitySignalButton";
import OpportunitySignalStatusChanger from "@/components/admin/OpportunitySignalStatusChanger";

export const dynamic = "force-dynamic";

function normalizeLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "url" in item) {
        return String((item as { url: unknown }).url).trim();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizePeople(value: unknown): PersonToReach[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is PersonToReach =>
        item !== null && typeof item === "object" && "name" in item
    )
    .map((item) => ({
      name: String(item.name ?? ""),
      role: item.role ? String(item.role) : undefined,
      linkedin: item.linkedin ? String(item.linkedin) : undefined,
      note: item.note ? String(item.note) : undefined,
    }));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score: number | null) {
  if (score === null) return "text-ink-faint";
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-700";
  return "text-ink-muted";
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

  const jobLinks = normalizeLinks(signal.job_links);
  const relevantLinks = normalizeLinks(signal.relevant_links);
  const people = normalizePeople(signal.people_to_reach);
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
              <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-background text-ink-muted border-border">
                {signal.signal_type}
              </span>
              {signal.match_score !== null && (
                <span
                  className={`text-xs font-mono font-semibold ${scoreColor(signal.match_score)}`}
                >
                  {signal.match_score}/100 match
                </span>
              )}
              {signal.interview_probability !== null && (
                <span className="text-xs font-mono text-ink-muted">
                  {signal.interview_probability}% interview probability
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

          <InfoBlock label="Why This Signal">
            <p className="text-sm text-ink leading-6 whitespace-pre-wrap">
              {signal.reason}
            </p>
          </InfoBlock>

          {people.length > 0 && (
            <InfoBlock label="People to Reach">
              <div className="flex flex-col gap-2">
                {people.map((person, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 bg-background border border-border rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {person.linkedin ? (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-ink hover:underline"
                        >
                          {person.name}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-ink">
                          {person.name}
                        </span>
                      )}
                      {person.role && (
                        <span className="text-xs font-mono text-ink-faint">
                          {person.role}
                        </span>
                      )}
                    </div>
                    {person.note && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        {person.note}
                      </p>
                    )}
                    {person.linkedin && (
                      <a
                        href={person.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-ink-faint hover:text-ink break-all mt-0.5"
                      >
                        {person.linkedin}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </InfoBlock>
          )}

          {jobLinks.length > 0 && (
            <InfoBlock label="Job Links">
              <div className="flex flex-col gap-1.5">
                {jobLinks.map((url, i) => (
                  <a
                    key={i}
                    href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
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

          {relevantLinks.length > 0 && (
            <InfoBlock label="Relevant Links">
              <div className="flex flex-col gap-1.5">
                {relevantLinks.map((url, i) => (
                  <a
                    key={i}
                    href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
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
