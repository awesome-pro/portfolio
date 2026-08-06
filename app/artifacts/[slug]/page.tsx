import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactMarkdown from "@/components/artifacts/ArtifactMarkdown";
import { LinkBar } from "@/components/projects/shared";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
  youtubeEmbedUrl,
  type Artifact,
} from "@/lib/artifacts";

export const revalidate = 3600;

const DEFAULT_DESCRIPTION =
  "A production-minded artifact with demo, architecture, and implementation notes.";

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

  const title = `Build Artifact #${artifact.serial_number}: ${artifact.artifact_name} - Abhinandan`;
  const description = DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://abhinandan.one/artifacts/${slug}`,
      type: "article",
      publishedTime: artifact.published_at ?? undefined,
      modifiedTime: artifact.updated_at,
      authors: ["Abhinandan"],
      images: artifact.architecture_images[0]
        ? [
            {
              url: artifact.architecture_images[0].url,
              width: 1200,
              height: 630,
              alt: artifact.architecture_images[0].alt,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: artifact.architecture_images[0]
        ? [artifact.architecture_images[0].url]
        : [],
    },
    alternates: {
      canonical: `https://abhinandan.one/artifacts/${slug}`,
    },
  };
}

function formatPublishedDate(dateStr: string | null): string {
  if (!dateStr) return "Not published";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DemoSection({ artifact }: { artifact: Artifact }) {
  const embedUrl = youtubeEmbedUrl(artifact.demo_youtube_url);
  if (!embedUrl) return null;

  return (
    <div className="mb-12 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="aspect-video w-full bg-background">
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={`${artifact.artifact_name} demo video`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function ArchitectureGallery({ artifact }: { artifact: Artifact }) {
  if (artifact.architecture_images.length === 0) return null;

  return (
    <div className="mb-12 flex flex-col gap-5">
      {artifact.architecture_images.map((image) => (
        <figure key={image.url}>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          {image.caption && (
            <figcaption className="mt-2 text-sm text-ink-faint">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artifact = await getArtifactBySlugStatic(slug);

  if (!artifact) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${artifact.artifact_name}`,
    description: DEFAULT_DESCRIPTION,
    url: `https://abhinandan.one/artifacts/${artifact.slug}`,
    datePublished: artifact.published_at,
    author: {
      "@type": "Person",
      name: "Abhinandan",
      url: "https://abhinandan.one",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://abhinandan.one/artifacts/${artifact.slug}`,
    },
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

      <main className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="font-mono text-xs tracking-widest text-ink-faint mb-4">
            Build Artifact #{artifact.serial_number}
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-[1.1] mb-5">
            {artifact.artifact_name}
          </h1>

          {artifact.published_at && (
            <p className="font-mono text-xs text-ink-faint mb-5">
              {formatPublishedDate(artifact.published_at)}
            </p>
          )}

          {artifact.github_links.length > 0 && <LinkBar links={artifact.github_links} />}
        </header>

        <DemoSection artifact={artifact} />
        <ArchitectureGallery artifact={artifact} />

        <ArtifactMarkdown content={artifact.story_markdown} />

        <div className="mt-16 border-t border-border pt-8">
          <Link
            href="/artifacts"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink transition-colors"
          >
            &lt;- All artifacts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
