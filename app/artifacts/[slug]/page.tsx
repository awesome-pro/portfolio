import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactMarkdown from "@/components/artifacts/ArtifactMarkdown";
import { LinkBar } from "@/components/projects/shared";
import { isVideoUrl } from "@/lib/artifact-media";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
  youtubeEmbedUrl,
  type Artifact,
} from "@/lib/artifacts";

export const revalidate = 3600;

const DEFAULT_DESCRIPTION =
  "A build artifact. What I built, how I tested it, and where it broke.";

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

  const title = `Artifact #${artifact.serial_number}: ${artifact.artifact_name} | Abhinandan`;

  // Social cards must be a still: an mp4 in og:image renders as a broken card,
  // so pick the first image even when a video is listed ahead of it.
  const socialImage = artifact.architecture_images.find(
    (media) => !isVideoUrl(media.url)
  );

  return {
    title,
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      title,
      description: DEFAULT_DESCRIPTION,
      url: `https://abhinandan.one/artifacts/${slug}`,
      type: "article",
      publishedTime: artifact.published_at ?? undefined,
      modifiedTime: artifact.updated_at,
      authors: ["Abhinandan"],
      images: socialImage
        ? [
            {
              url: socialImage.url,
              width: 1200,
              height: 630,
              alt: socialImage.alt,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: DEFAULT_DESCRIPTION,
      images: socialImage ? [socialImage.url] : [],
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
            {isVideoUrl(image.url) ? (
              <video
                src={image.url}
                controls
                preload="metadata"
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            )}
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
    name: artifact.artifact_name,
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

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <div>
          <header className="mb-12">
            <p className="mb-4 font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
              Artifact {String(artifact.serial_number).padStart(2, "0")}
            </p>

            <h1 className="mb-5 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-4xl">
              {artifact.artifact_name}
            </h1>

            {artifact.published_at && (
              <p className="mb-5 font-mono text-xs text-ink-faint">
                {formatPublishedDate(artifact.published_at)}
              </p>
            )}

            {artifact.github_links.length > 0 && (
              <LinkBar links={artifact.github_links} />
            )}
          </header>

          <DemoSection artifact={artifact} />
          <ArchitectureGallery artifact={artifact} />

          <ArtifactMarkdown content={artifact.story_markdown} />

          <div className="mt-16 border-t border-border pt-8">
            <Link
              href="/artifacts"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
            >
              &lt;- all artifacts
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
