import Link from "next/link";
import ArtifactForm from "@/components/admin/ArtifactForm";
import SignOutButton from "@/components/admin/SignOutButton";

export default function NewArtifactPage() {
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
            <h1 className="text-sm font-semibold text-ink">New artifact</h1>
          </div>
          <SignOutButton />
        </div>

        <ArtifactForm />
      </div>
    </div>
  );
}
