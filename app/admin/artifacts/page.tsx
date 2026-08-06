import Link from "next/link";
import { getAllArtifactsAdmin } from "@/lib/artifacts";
import SignOutButton from "@/components/admin/SignOutButton";
import DeleteArtifactButton from "@/components/admin/DeleteArtifactButton";

export const dynamic = "force-dynamic";

function formatPublishedDate(dateStr: string | null) {
  if (!dateStr) return "Not published";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ArtifactsAdminPage() {
  const artifacts = await getAllArtifactsAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-6 mb-10">
          <div>
            <Link
              href="/admin"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              &lt;- Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">
              Artifacts
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/artifacts"
              target="_blank"
              className="text-xs font-mono text-ink-muted hover:text-ink transition-colors"
            >
              View artifacts
            </Link>
            <Link
              href="/admin/artifacts/new"
              className="text-sm font-semibold bg-ink text-background px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              + New artifact
            </Link>
            <SignOutButton />
          </div>
        </div>

        {artifacts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm mb-4">
              No artifacts yet.
            </p>
            <Link
              href="/admin/artifacts/new"
              className="text-sm font-semibold text-ink hover:opacity-70 transition-opacity"
            >
              Create the first artifact -&gt;
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="flex items-center justify-between gap-4 px-5 py-4 bg-surface hover:bg-background transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs text-ink-faint">
                    #{artifact.serial_number}
                  </span>
                  <p className="text-sm font-medium text-ink truncate">
                    {artifact.artifact_name}
                  </p>
                  <p className="font-mono text-xs text-ink-faint mt-0.5">
                    Published {formatPublishedDate(artifact.published_at)} / {artifact.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/artifacts/${artifact.slug}`}
                    target="_blank"
                    className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/artifacts/${artifact.id}`}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteArtifactButton id={artifact.id} title={artifact.artifact_name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
