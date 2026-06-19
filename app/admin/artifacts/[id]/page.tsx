import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtifactById } from "@/lib/artifacts";
import ArtifactForm from "@/components/admin/ArtifactForm";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function EditArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artifact = await getArtifactById(id);

  if (!artifact) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/artifacts"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              &lt;- Artifacts
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-sm font-semibold text-ink truncate">
              {artifact.artifact_name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {artifact.status !== "draft" && (
              <Link
                href={`/artifacts/${artifact.slug}`}
                target="_blank"
                className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
              >
                View artifact
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        <ArtifactForm initial={artifact} />
      </div>
    </div>
  );
}
