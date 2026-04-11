import Link from "next/link";
import Image from "next/image";
import type { Blog } from "@/lib/blogs";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group bg-surface border border-border rounded-2xl overflow-hidden flex flex-col hover:border-ink-muted transition-colors"
    >
      {/* Cover image */}
      {blog.cover_image_url && (
        <div className="relative w-full aspect-video bg-background overflow-hidden">
          <Image
            src={blog.cover_image_url}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="p-6 flex flex-col gap-3 flex-1">
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs px-2 py-0.5 rounded-full bg-background border border-border text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-ink leading-snug group-hover:text-ink transition-colors line-clamp-2">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm leading-relaxed text-ink-muted flex-1 line-clamp-3">
            {blog.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 pt-2 border-t border-border font-mono text-xs text-ink-faint">
          {blog.published_at && <span>{formatDate(blog.published_at)}</span>}
          {blog.reading_time_minutes && (
            <>
              <span>·</span>
              <span>{blog.reading_time_minutes} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
