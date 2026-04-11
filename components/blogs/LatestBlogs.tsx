import Link from "next/link";
import Image from "next/image";
import { getLatestBlogs } from "@/lib/blogs";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function LatestBlogs() {
  let blogs;
  try {
    blogs = await getLatestBlogs(3);
  } catch {
    return null;
  }

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
            Writing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Latest posts
          </h2>
        </div>
        <Link
          href="/blogs"
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors whitespace-nowrap mb-1"
        >
          All posts →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            className="group bg-surface border border-border rounded-2xl overflow-hidden flex flex-col hover:border-ink-muted transition-colors"
          >
            {blog.cover_image_url && (
              <div className="relative w-full aspect-video bg-background overflow-hidden">
                <Image
                  src={blog.cover_image_url}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}

            <div className="p-5 flex flex-col gap-2.5 flex-1">
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {blog.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-xs px-2 py-0.5 rounded-full bg-background border border-border text-ink-faint"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="text-base font-semibold text-ink leading-snug line-clamp-2">
                {blog.title}
              </h3>

              {blog.excerpt && (
                <p className="text-sm text-ink-muted leading-relaxed line-clamp-2 flex-1">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border font-mono text-xs text-ink-faint">
                {blog.published_at && (
                  <span>{formatDate(blog.published_at)}</span>
                )}
                {blog.reading_time_minutes && (
                  <>
                    <span>·</span>
                    <span>{blog.reading_time_minutes} min read</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
