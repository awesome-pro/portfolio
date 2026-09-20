import Link from "next/link";
import { artifactExcerpt, type Artifact } from "@/lib/artifacts";

function formatMonth(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

/**
 * The site's primary content: a quiet, editorial index of deep work.
 * Shared by the homepage (all artifacts) and /artifacts.
 */
export default function ArtifactIndex({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) {
    return (
      <p className="py-10 font-mono text-sm text-ink-faint">
        No artifacts published yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {artifacts.map((artifact, index) => {
        const excerpt = artifactExcerpt(artifact.story_markdown);

        return (
          <li key={artifact.id} className={index !== 0 ? "border-t border-border" : ""}>
            <div className="grid grid-cols-[2rem_1fr] gap-x-4 py-7">
              <span className="pt-1.5 font-mono text-xs text-ink-faint">
                {String(artifact.serial_number).padStart(2, "0")}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg leading-snug font-semibold text-ink">
                    <Link
                      href={`/artifacts/${artifact.slug}`}
                      className="decoration-ink-faint underline-offset-4 hover:underline"
                    >
                      {artifact.artifact_name}
                    </Link>
                  </h3>
                  {artifact.published_at && (
                    <span className="font-mono text-xs text-ink-faint">
                      {formatMonth(artifact.published_at)}
                    </span>
                  )}
                </div>

                {excerpt && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                    {excerpt}
                  </p>
                )}

                {artifact.github_links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
                    {artifact.github_links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink-faint transition-colors hover:text-ink"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
