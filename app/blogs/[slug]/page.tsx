import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getAllSlugsStatic } from "@/lib/blogs";
import BlogContent from "@/components/blogs/BlogContent";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

export const revalidate = 3600; // ISR — re-generate stale pages hourly

export async function generateStaticParams() {
  const slugs = await getAllSlugsStatic();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: "Post Not Found — Abhinandan" };
  }

  return {
    title: `${blog.title} — Abhinandan`,
    description: blog.excerpt ?? undefined,
    openGraph: {
      title: blog.title,
      description: blog.excerpt ?? undefined,
      url: `https://abhinandan.one/blogs/${slug}`,
      type: "article",
      publishedTime: blog.published_at ?? undefined,
      modifiedTime: blog.updated_at,
      authors: ["Abhinandan"],
      images: blog.cover_image_url
        ? [
            {
              url: blog.cover_image_url,
              width: 1200,
              height: 630,
              alt: blog.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt ?? undefined,
      images: blog.cover_image_url ? [blog.cover_image_url] : [],
    },
    alternates: {
      canonical: `https://abhinandan.one/blogs/${slug}`,
    },
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.cover_image_url,
    datePublished: blog.published_at,
    dateModified: blog.updated_at,
    author: {
      "@type": "Person",
      name: "Abhinandan",
      url: "https://abhinandan.one",
    },
    publisher: {
      "@type": "Person",
      name: "Abhinandan",
      url: "https://abhinandan.one",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://abhinandan.one/blogs/${slug}`,
    },
    keywords: blog.tags?.join(", "),
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
        {/* Header */}
        <header className="mb-10">
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {blog.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs?tag=${encodeURIComponent(tag)}`}
                  className="font-mono text-xs px-2.5 py-1 rounded-full bg-surface border border-border text-ink-muted hover:border-ink-muted hover:text-ink transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4 leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-lg text-ink-muted leading-relaxed mb-6">
              {blog.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-faint border-t border-border pt-5">
            <span>Abhinandan</span>
            {blog.published_at && (
              <>
                <span>·</span>
                <time dateTime={blog.published_at}>
                  {formatDate(blog.published_at)}
                </time>
              </>
            )}
            {blog.reading_time_minutes && (
              <>
                <span>·</span>
                <span>{blog.reading_time_minutes} min read</span>
              </>
            )}
          </div>
        </header>

        {/* Cover image */}
        {blog.cover_image_url && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border mb-12">
            <Image
              src={blog.cover_image_url}
              alt={blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {/* Content */}
        <article>
          <BlogContent content={blog.content} />
        </article>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink transition-colors"
          >
            ← Back to all posts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
