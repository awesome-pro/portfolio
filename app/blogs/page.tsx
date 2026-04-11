import { Suspense } from "react";
import type { Metadata } from "next";
import { getPublishedBlogs, getAllTags } from "@/lib/blogs";
import BlogCard from "@/components/blogs/BlogCard";
import TagFilter from "@/components/blogs/TagFilter";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Blog — Abhinandan",
  description:
    "Thoughts on AI systems, multi-agent orchestration, LLM inference, and production engineering.",
  openGraph: {
    title: "Blog — Abhinandan",
    description:
      "Thoughts on AI systems, multi-agent orchestration, LLM inference, and production engineering.",
    url: "https://abhinandan.one/blogs",
    type: "website",
  },
  alternates: {
    canonical: "https://abhinandan.one/blogs",
  },
};

const PAGE_SIZE = 8;

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [{ blogs, total }, tags] = await Promise.all([
    getPublishedBlogs({ tag, page, pageSize: PAGE_SIZE }),
    getAllTags(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
            Writing
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
            Blog
          </h1>
          <p className="text-ink-muted max-w-xl">
            Thoughts on AI systems, multi-agent orchestration, LLM inference,
            and production engineering.
          </p>
        </div>

        {/* Tag filter — needs Suspense because it uses useSearchParams */}
        <div className="mb-10">
          <Suspense fallback={null}>
            <TagFilter tags={tags} />
          </Suspense>
        </div>

        {/* Grid */}
        {blogs.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-ink-faint font-mono text-sm">
              {tag ? `No posts tagged "${tag}" yet.` : "No posts yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (tag) params.set("tag", tag);
              if (p > 1) params.set("page", String(p));
              const href = `/blogs${params.toString() ? `?${params}` : ""}`;

              return (
                <a
                  key={p}
                  href={href}
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    p === page
                      ? "bg-ink text-background border-ink"
                      : "border-border text-ink-muted hover:border-ink-muted hover:text-ink"
                  }`}
                >
                  {p}
                </a>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
