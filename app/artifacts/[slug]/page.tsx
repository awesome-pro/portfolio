import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactMarkdown from "@/components/artifacts/ArtifactMarkdown";
import {
  SectionHeading,
  Chip,
  LinkBar,
} from "@/components/projects/shared";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
  youtubeEmbedUrl,
  type Artifact,
  type ArtifactStatus,
} from "@/lib/artifacts";

export const revalidate = 3600;

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

  const title = `Build Trace #${artifact.serial_number}: ${artifact.artifact_name} - Abhinandan`;
  const description =
    artifact.tagline ??
    "A production-minded artifact with demo, architecture, implementation details, failure cases, and evals.";

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

function statusClasses(status: ArtifactStatus) {
  if (status === "shipped") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (status === "building") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-border bg-surface text-ink-muted";
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-16">
      <SectionHeading eyebrow={eyebrow} title={title} className="mb-6" />
      {children}
    </section>
  );
}

function ListBlock({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm leading-relaxed text-ink-muted pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-ink-faint"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function DemoSection({ artifact }: { artifact: Artifact }) {
  const embedUrl = youtubeEmbedUrl(artifact.demo_youtube_url);

  if (!embedUrl && !artifact.demo_summary && artifact.what_to_watch_for.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Demo" title="Watch the workflow replay" />
        {artifact.demo_youtube_url && (
          <a
            href={artifact.demo_youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          >
            Open on YouTube -&gt;
          </a>
        )}
      </div>

      {embedUrl && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface mb-6">
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
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr]">
        {artifact.demo_summary && (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">
              Demo summary
            </p>
            <p className="text-base leading-7 text-ink-muted">
              {artifact.demo_summary}
            </p>
          </div>
        )}
        {artifact.what_to_watch_for.length > 0 && (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">
              What to watch for
            </p>
            <ListBlock items={artifact.what_to_watch_for} />
          </div>
        )}
      </div>
    </section>
  );
}

function ArchitectureSection({ artifact }: { artifact: Artifact }) {
  const hasStructure =
    artifact.architecture_images.length > 0 ||
    artifact.architecture_components.length > 0 ||
    artifact.data_flow.length > 0 ||
    artifact.llm_used_for.length > 0 ||
    artifact.llm_not_used_for.length > 0 ||
    Boolean(artifact.architecture_markdown?.trim());

  if (!hasStructure) return null;

  return (
    <Section eyebrow="Architecture" title="System shape and data flow">
      <div className="flex flex-col gap-8">
        <ArtifactMarkdown content={artifact.architecture_markdown} />

        {artifact.architecture_images.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {artifact.architecture_images.map((image) => (
              <figure key={image.url}>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 1024px"
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
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {artifact.architecture_components.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-3">
                Components
              </p>
              <ListBlock items={artifact.architecture_components} />
            </div>
          )}
          {artifact.data_flow.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-3">
                Data flow
              </p>
              <ListBlock items={artifact.data_flow} />
            </div>
          )}
          {artifact.llm_used_for.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-3">
                LLM used for
              </p>
              <ListBlock items={artifact.llm_used_for} />
            </div>
          )}
          {artifact.llm_not_used_for.length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-3">
                LLM intentionally not used for
              </p>
              <ListBlock items={artifact.llm_not_used_for} />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function CodeSnippets({ artifact }: { artifact: Artifact }) {
  if (artifact.code_snippets.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-5">
      {artifact.code_snippets.map((snippet) => (
        <div key={`${snippet.label}-${snippet.language}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">
            {snippet.label}
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-5 text-sm leading-relaxed">
            <code className="font-mono text-ink-muted">{snippet.code}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}

function MetricsSection({ artifact }: { artifact: Artifact }) {
  if (artifact.metrics.length === 0) return null;

  return (
    <Section eyebrow="Evals / metrics" title="How I measured it">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artifact.metrics.map((metric) => (
          <div key={`${metric.label}-${metric.value}`} className="rounded-lg border border-border bg-surface p-5">
            <p className="font-mono text-2xl font-bold text-ink">{metric.value}</p>
            <p className="text-sm font-semibold text-ink mt-2">{metric.label}</p>
            {metric.note && (
              <p className="text-sm leading-relaxed text-ink-muted mt-1">
                {metric.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function FailureCases({ artifact }: { artifact: Artifact }) {
  if (artifact.failure_cases.length === 0) return null;

  return (
    <Section eyebrow="Failure cases" title="Where it can break">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {artifact.failure_cases.map((failure) => (
          <div key={failure.title} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-ink mb-1.5">
              {failure.title}
            </p>
            <p className="text-sm leading-relaxed text-ink-muted">
              {failure.detail}
            </p>
            {failure.recovery && (
              <p className="text-sm leading-relaxed text-ink-faint mt-3">
                Recovery: {failure.recovery}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Tradeoffs({ artifact }: { artifact: Artifact }) {
  if (artifact.tradeoffs.length === 0) return null;

  return (
    <Section eyebrow="Tradeoffs" title="What I chose, and what it costs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {artifact.tradeoffs.map((tradeoff) => (
          <div key={tradeoff.title} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-ink mb-1.5">
              {tradeoff.title}
            </p>
            {tradeoff.upside && (
              <p className="text-sm leading-relaxed text-ink-muted">
                Upside: {tradeoff.upside}
              </p>
            )}
            <p className="text-sm leading-relaxed text-ink-muted mt-2">
              Cost: {tradeoff.cost}
            </p>
          </div>
        ))}
      </div>
    </Section>
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
    description: artifact.tagline,
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

      <main className="max-w-6xl mx-auto px-6 py-16">
        <Link
          href="/artifacts"
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
        >
          &lt;- Artifacts
        </Link>

        <header className="mt-6 mb-12 max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              Build Trace #{artifact.serial_number}
            </p>
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${statusClasses(
                artifact.status
              )}`}
            >
              {artifact.status}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05] mb-5">
            {artifact.artifact_name}
          </h1>

          {artifact.tagline && (
            <p className="text-lg sm:text-xl leading-relaxed text-ink-muted max-w-2xl mb-7">
              {artifact.tagline}
            </p>
          )}

          {artifact.published_at && (
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-faint mb-6">
              <span>Published {formatPublishedDate(artifact.published_at)}</span>
            </div>
          )}

          {artifact.tools_libraries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {artifact.tools_libraries.map((tool) => (
                <Chip key={tool}>{tool}</Chip>
              ))}
            </div>
          )}

          {artifact.github_links.length > 0 && <LinkBar links={artifact.github_links} />}
        </header>

        <DemoSection artifact={artifact} />

        {artifact.problem_markdown && (
          <Section eyebrow="Problem" title="The production problem">
            <ArtifactMarkdown content={artifact.problem_markdown} />
          </Section>
        )}

        {artifact.what_i_built_markdown && (
          <Section eyebrow="What I built" title="The concrete system">
            <ArtifactMarkdown content={artifact.what_i_built_markdown} />
          </Section>
        )}

        <ArchitectureSection artifact={artifact} />

        {(artifact.implementation_markdown || artifact.code_snippets.length > 0) && (
          <Section eyebrow="Implementation details" title="Design choices and constraints">
            <ArtifactMarkdown content={artifact.implementation_markdown} />
            <CodeSnippets artifact={artifact} />
          </Section>
        )}

        <FailureCases artifact={artifact} />
        <MetricsSection artifact={artifact} />
        <Tradeoffs artifact={artifact} />

        {artifact.related_links.length > 0 && (
          <section className="border-t border-border pt-8">
            <SectionHeading
              eyebrow="Related links"
              title="More context"
              className="mb-6"
            />
            <LinkBar links={artifact.related_links} />
          </section>
        )}

        <div className="mt-12 border-t border-border pt-8">
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
