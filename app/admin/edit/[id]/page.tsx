import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogById } from "@/lib/blogs";
import BlogForm from "@/components/admin/BlogForm";
import SignOutButton from "@/components/admin/SignOutButton";
import DeleteBlogButton from "@/components/admin/DeleteBlogButton";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await getBlogById(id);

  if (!blog) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              ← All posts
            </Link>
            <span className="text-border">|</span>
            <h1 className="text-sm font-semibold text-ink">Edit post</h1>
          </div>
          <div className="flex items-center gap-3">
            {blog.is_published && (
              <Link
                href={`/blogs/${blog.slug}`}
                target="_blank"
                className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
              >
                View live ↗
              </Link>
            )}
            <Link
              href="/admin/create"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              + New post
            </Link>
            <DeleteBlogButton id={blog.id} title={blog.title} />
            <SignOutButton />
          </div>
        </div>

        <BlogForm initial={blog} />
      </div>
    </div>
  );
}
