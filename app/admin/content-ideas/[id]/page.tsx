import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentIdeaById } from "@/lib/content-ideas";
import DeleteContentIdeaButton from "@/components/admin/DeleteContentIdeaButton";
import ContentIdeaStatusChanger from "@/components/admin/ContentIdeaStatusChanger";

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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
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
    <div className="flex flex-col gap-1.5">
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

function ScriptBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <InfoBlock label={label}>
      <pre className="text-sm text-ink bg-background border border-border rounded-xl px-4 py-4 whitespace-pre-wrap font-sans leading-6">
        {value}
      </pre>
    </InfoBlock>
  );
}

export default async function ContentIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = await getContentIdeaById(id);
  if (!idea) notFound();

  const keyPoints = normalizeList(idea.key_points);
  const hooks = normalizeList(idea.hooks);
  const sourceLinks = normalizeList(idea.source_links);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0">
            <Link
              href="/admin/content-ideas"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Content Ideas
            </Link>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {idea.idea_date === today && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                  Today
                </span>
              )}
              {idea.category && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border bg-background text-ink-muted border-border">
                  {idea.category}
                </span>
              )}
              <span className="text-xs font-mono text-ink-faint">
                {formatDate(idea.idea_date)}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink mt-2 break-words">
              {idea.topic_title}
            </h1>
          </div>
          <DeleteContentIdeaButton
            id={idea.id}
            title={idea.topic_title}
            redirectTo="/admin/content-ideas"
          />
        </div>

        <div className="flex flex-col gap-6 mb-6 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Status
          </p>
          <ContentIdeaStatusChanger id={idea.id} current={idea.status} />
        </div>

        <div className="flex flex-col gap-5 p-6 border border-border rounded-2xl bg-surface">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
            Idea Details
          </p>

          <TextBlock label="Content Angle" value={idea.content_angle} />
          <TextBlock label="Why Now" value={idea.why_now} />
          <TextBlock label="Why This Is Good" value={idea.why_this_is_good} />
          <TextBlock label="Target Audience" value={idea.target_audience} />

          {keyPoints.length > 0 && (
            <InfoBlock label="Key Points">
              <ul className="flex flex-col gap-1.5">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink">
                    <span className="text-ink-faint shrink-0">{i + 1}.</span>
                    {point}
                  </li>
                ))}
              </ul>
            </InfoBlock>
          )}

          {hooks.length > 0 && (
            <InfoBlock label="Hooks">
              <div className="flex flex-col gap-2">
                {hooks.map((hook, i) => (
                  <div
                    key={i}
                    className="text-sm text-ink bg-background border border-border rounded-lg px-3 py-2.5 font-mono"
                  >
                    {hook}
                  </div>
                ))}
              </div>
            </InfoBlock>
          )}

          <ScriptBlock label="LinkedIn Post" value={idea.linkedin_post} />
          <ScriptBlock label="X Post" value={idea.x_post} />
          <ScriptBlock label="Video Script" value={idea.video_script} />

          {sourceLinks.length > 0 && (
            <InfoBlock label="Sources">
              <div className="flex flex-col gap-1">
                {sourceLinks.map((url, i) => (
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

          <TextBlock label="Notes" value={idea.notes} />
        </div>
      </div>
    </div>
  );
}
