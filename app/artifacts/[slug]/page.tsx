import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactMarkdown from "@/components/artifacts/ArtifactMarkdown";
import ArtifactViews from "@/components/artifacts/ArtifactViews";
import { LinkBar } from "@/components/projects/shared";
import { isVideoUrl } from "@/lib/artifact-media";
import { extractHeadings, type Heading } from "@/lib/heading-anchors";
import { PERSON_NAME } from "@/lib/identity";
import {
  buildArtifactJsonLd,
  buildArtifactMetadata,
  artifactBreadcrumbs,
  artifactStats,
  type Crumb,
} from "@/lib/artifact-seo";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
  youtubeEmbedUrl,
  type Artifact,
} from "@/lib/artifacts";

export const revalidate = 30;

/** Published and edited on the same day is not a revision worth announcing. */
const REVISION_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function wasRevised(artifact: Artifact): boolean {
  if (!artifact.published_at) return false;
  const published = new Date(artifact.published_at).getTime();
  const updated = new Date(artifact.updated_at).getTime();
  if (Number.isNaN(published) || Number.isNaN(updated)) return false;
  return updated - published > REVISION_THRESHOLD_MS;
}

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

function formatPublishedDate(dateStr: string | null): string {
  if (!dateStr) return "Not published";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * The visible trail, mirroring the BreadcrumbList in the page's structured
 * data: Google asks that breadcrumb markup describe a trail the page actually
 * shows, and it doubles as the way back up for a reader who arrived from search.
 */
function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-ink-faint">
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          return (
            <li key={crumb.url} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {current ? (
                <span aria-current="page" className="max-w-[22rem] truncate text-ink-muted">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={new URL(crumb.url).pathname}
                  className="transition-colors hover:text-ink"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The artifact's sections, as links.
 *
 * `rehype-slug` already gives every heading a fragment id; without a link, no
 * fragment is reachable and no section is independently citable. Two sections
 * is a document, three is a table of contents.
 */
function SectionNav({ sections }: { sections: Heading[] }) {
  if (sections.length < 3) return null;

  return (
    <nav
      aria-label="Sections"
      className="mb-12 rounded-xl border border-border bg-elevated px-5 py-4"
    >
      <p className="mb-3 font-mono text-[11px] tracking-wider text-ink-faint uppercase">
        Sections
      </p>
      <ol className="flex flex-col gap-1.5">
        {sections.map((section) => (
          <li key={section.id} className={section.depth > 2 ? "pl-5" : ""}>
            <a
              href={`#${section.id}`}
              className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
            >
              {section.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function DemoSection({ artifact }: { artifact: Artifact }) {
  const embedUrl = youtubeEmbedUrl(artifact.demo_youtube_url);
  if (!embedUrl) return null;

  return (
    <div className="mb-12 overflow-hidden rounded-xl border border-border bg-elevated">
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
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-elevated">
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

  // One builder for the whole @graph: the article, its demo video when it has
  // one, and the breadcrumb trail. `author` and `publisher` are @id references
  // into the identity graph the root layout declares, so an agent that has read
  // any page of this site resolves them to the same Person node.
  const jsonLd = buildArtifactJsonLd(artifact);
  const crumbs = artifactBreadcrumbs(artifact);
  const stats = artifactStats(artifact.story_markdown);
  const sections = extractHeadings(artifact.story_markdown, { maxDepth: 3 });
  const revised = wasRevised(artifact);

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
          <Breadcrumbs crumbs={crumbs} />

          <header className="mb-12">
            <p className="mb-4 font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
              Artifact {String(artifact.serial_number).padStart(2, "0")}
            </p>

            <h1 className="mb-5 text-3xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-4xl">
              {artifact.artifact_name}
            </h1>

            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink-faint">
              <span>
                by{" "}
                <Link
                  href="/about"
                  rel="author"
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  {PERSON_NAME}
                </Link>
              </span>
              {artifact.published_at && (
                <time dateTime={artifact.published_at}>
                  {formatPublishedDate(artifact.published_at)}
                </time>
              )}
              {stats.minutes > 0 && <span>{stats.minutes} min read</span>}
              <ArtifactViews
                slug={artifact.slug}
                initialCount={artifact.view_count}
                track
              />
              {revised && (
                <span>
                  updated{" "}
                  <time dateTime={artifact.updated_at}>
                    {formatPublishedDate(artifact.updated_at)}
                  </time>
                </span>
              )}
            </div>

            {artifact.github_links.length > 0 && (
              <LinkBar links={artifact.github_links} />
            )}
          </header>

          <DemoSection artifact={artifact} />
          <ArchitectureGallery artifact={artifact} />

          <SectionNav sections={sections} />

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
