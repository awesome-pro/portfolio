import type { Metadata } from "next";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactIndex from "@/components/artifacts/ArtifactIndex";
import { getPublicArtifacts } from "@/lib/artifacts";

const url = "https://abhinandan.one/artifacts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Artifacts | Abhinandan",
  description:
    "Training runs, eval write-ups, failure cases, and the numbers that came out. Notes from the inference and RL work I've done.",
  openGraph: {
    title: "Artifacts",
    description:
      "Training runs, eval write-ups, failure cases, and the numbers that came out.",
    url,
    type: "website",
  },
  alternates: { canonical: url },
};

export default async function ArtifactsPage() {
  const artifacts = await getPublicArtifacts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Artifacts",
    description:
      "Training runs, eval write-ups, failure cases, and numbers from inference and RL work by Abhinandan.",
    url,
    hasPart: artifacts.map((artifact) => ({
      "@type": "CreativeWork",
      name: artifact.artifact_name,
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

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Artifacts
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
            Long-form build traces. What I built, how I tested it, and where it
            broke.
          </p>

          <div className="mt-10">
            <ArtifactIndex artifacts={artifacts} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
