import Link from "next/link";
import { getAllBlogsAdmin } from "@/lib/blogs";
import DeleteBlogButton from "@/components/admin/DeleteBlogButton";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogsAdminPage() {
  const blogs = await getAllBlogsAdmin();

  const published = blogs.filter((b) => b.is_published);
  const drafts = blogs.filter((b) => !b.is_published);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href="/admin"
              className="text-xs font-mono text-ink-faint hover:text-ink transition-colors"
            >
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink mt-1">All posts</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/blogs"
              target="_blank"
              className="text-xs font-mono text-ink-muted hover:text-ink transition-colors"
            >
              View blog ↗
            </Link>
            <Link
              href="/admin/create"
              className="text-sm font-semibold bg-ink text-background px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              + New post
            </Link>
            <SignOutButton />
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-2xl">
            <p className="text-ink-faint font-mono text-sm mb-4">No posts yet.</p>
            <Link
              href="/admin/create"
              className="text-sm font-semibold text-ink hover:opacity-70 transition-opacity"
            >
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {published.length > 0 && (
              <section>
                <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-4">
                  Published ({published.length})
                </p>
                <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
                  {published.map((blog) => (
                    <div
                      key={blog.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 bg-surface hover:bg-background transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{blog.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-ink-faint">
                          {blog.published_at && <span>{formatDate(blog.published_at)}</span>}
                          {blog.tags && blog.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{blog.tags.slice(0, 2).join(", ")}</span>
                            </>
                          )}
                          {blog.reading_time_minutes && (
                            <>
                              <span>·</span>
                              <span>{blog.reading_time_minutes} min read</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          target="_blank"
                          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
                        >
                          View ↗
                        </Link>
                        <Link
                          href={`/admin/edit/${blog.id}`}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteBlogButton id={blog.id} title={blog.title} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {drafts.length > 0 && (
              <section>
                <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-4">
                  Drafts ({drafts.length})
                </p>
                <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
                  {drafts.map((blog) => (
                    <div
                      key={blog.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 bg-surface hover:bg-background transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-muted truncate">{blog.title}</p>
                        <p className="font-mono text-xs text-ink-faint mt-0.5">
                          Created {formatDate(blog.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/edit/${blog.id}`}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteBlogButton id={blog.id} title={blog.title} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
