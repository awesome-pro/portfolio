import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { Chip } from "@/components/projects/shared";
import { getPublicArtifacts, type Artifact, type ArtifactStatus } from "@/lib/artifacts";

const url = "https://abhinandan.one/artifacts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Artifacts - Build Traces | Abhinandan",
  description:
    "Build traces for production-minded agentic AI systems: demos, architecture, implementation notes, failure cases, and evals.",
  openGraph: {
    title: "Artifacts - Build Traces",
    description:
      "Production-minded agentic AI build traces with demos, architecture, implementation notes, failure cases, and evals.",
    url,
    type: "website",
  },
  alternates: { canonical: url },
};

function formatPublishedDate(dateStr: string | null): string {
  if (!dateStr) return "Not published";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClasses(status: ArtifactStatus) {
  if (status === "shipped") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (status === "building") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-border bg-surface text-ink-muted";
}

function ArtifactRow({ artifact, index }: { artifact: Artifact; index: number }) {
  return (
    <Link
      href={`/artifacts/${artifact.slug}`}
      className={`group block py-6 ${index !== 0 ? "border-t border-border" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="font-mono text-xs text-ink-faint">
              Build Trace #{artifact.serial_number}
            </span>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${statusClasses(
                artifact.status
              )}`}
            >
              {artifact.status}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-ink group-hover:underline underline-offset-4 decoration-ink-faint">
            Reliable Browser Workflow Replay {artifact.artifact_name}
          </h2>
          {artifact.tagline && (
            <p className="text-sm leading-relaxed text-ink-muted mt-2 max-w-2xl">
              {artifact.tagline}
            </p>
          )}
        </div>
        <span className="font-mono text-xs text-ink-muted shrink-0 mt-1">
          Published {formatPublishedDate(artifact.published_at)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {artifact.tools_libraries.slice(0, 6).map((tool) => (
          <Chip key={tool}>{tool}</Chip>
        ))}
        <span className="font-mono text-xs text-ink ml-auto">Open trace -&gt;</span>
      </div>
    </Link>
  );
}

export default async function ArtifactsPage() {
  const artifacts = await getPublicArtifacts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Artifacts",
    description:
      "Build traces for production-minded agentic AI systems by Abhinandan.",
    url,
    hasPart: artifacts.map((artifact) => ({
      "@type": "CreativeWork",
      name: `Reliable Browser Workflow Replay ${artifact.artifact_name}`,
      url: `${url}/${artifact.slug}`,
      datePublished: artifact.published_at,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Nav />

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
            Build traces
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
            Artifacts
          </h1>
          <p className="text-ink-muted max-w-xl leading-relaxed">
            Detailed records of systems I built: demo, production problem,
            architecture, implementation choices, failure cases, and evals.
          </p>
        </div>

        {artifacts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-lg">
            <p className="text-ink-faint font-mono text-sm">
              No shipped or building artifacts yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {artifacts.map((artifact, index) => (
              <ArtifactRow
                key={artifact.id}
                artifact={artifact}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
