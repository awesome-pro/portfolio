import Link from "next/link";
import { getLatestArtifacts, type Artifact } from "@/lib/artifacts";

function formatPublishedDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <Link
      href={`/artifacts/${artifact.slug}`}
      className="group bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-ink-muted transition-colors"
    >
      <span className="font-mono text-xs text-ink-faint">
        Build Artifact #{artifact.serial_number}
      </span>

      <h3 className="text-base font-semibold text-ink leading-snug line-clamp-2 group-hover:underline underline-offset-4 decoration-ink-faint flex-1">
        {artifact.artifact_name}
      </h3>

      <div className="flex items-center gap-2 pt-2 border-t border-border font-mono text-xs text-ink-faint mt-auto">
        {artifact.published_at && (
          <span>{formatPublishedDate(artifact.published_at)}</span>
        )}
        <span className="ml-auto text-ink">Open artifact -&gt;</span>
      </div>
    </Link>
  );
}

export default async function LatestArtifacts() {
  let artifacts;
  try {
    artifacts = await getLatestArtifacts(3);
  } catch {
    return null;
  }

  if (!artifacts || artifacts.length === 0) return null;

  return (
    <section className="py-20 px-6  max-w-6xl mx-auto border-t border-border">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-ink">
            <span className="text-primary">Artifacts </span>that I have built
          </h2>
        </div>
        <Link
          href="/artifacts"
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors whitespace-nowrap mb-1"
        >
          All artifacts →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </section>
  );
}
