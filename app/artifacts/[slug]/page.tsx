import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactView from "@/components/artifacts/ArtifactView";
import {
  buildArtifactJsonLd,
  buildArtifactMetadata,
} from "@/lib/artifact-seo";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
} from "@/lib/artifacts";

export const revalidate = 30;

export async function generateStaticParams() {
  const slugs = await getAllArtifactSlugsStatic();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artifact = await getArtifactBySlugStatic(slug);

  if (!artifact) {
    return { title: "Artifact Not Found - Abhinandan" };
  }

  return buildArtifactMetadata(artifact);
}

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artifact = await getArtifactBySlugStatic(slug);

  if (!artifact) notFound();

  // One builder for the whole @graph: the article, its demo video when it has
  // one, its code when it links a repository, and the breadcrumb trail.
  // `author` and `publisher` are @id references into the identity graph the
  // root layout declares, so an agent that has read any page of this site
  // resolves them to the same Person node.
  const jsonLd = buildArtifactJsonLd(artifact);

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
        {/* The article itself is `ArtifactView`, which the writer's preview
            renders too — so what an author previews is literally what ships. */}
        <ArtifactView artifact={artifact} story={artifact.story_markdown} trackViews />

        <div className="mt-16 border-t border-border pt-8">
          <Link
            href="/artifacts"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          >
            &lt;- all artifacts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
