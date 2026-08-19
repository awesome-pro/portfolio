import Link from "next/link";
import ArtifactForm from "@/components/admin/ArtifactForm";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default function CreateArtifactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              ← Admin
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-sm font-semibold text-ink">New artifact</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/artifacts"
              target="_blank"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              View artifacts ↗
            </Link>
            <SignOutButton />
          </div>
        </div>

        <ArtifactForm />
      </div>
    </div>
  );
}
