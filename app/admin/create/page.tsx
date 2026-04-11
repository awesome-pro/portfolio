import Link from "next/link";
import BlogForm from "@/components/admin/BlogForm";
import SignOutButton from "@/components/admin/SignOutButton";

export default function CreateBlogPage() {
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
            <h1 className="text-sm font-semibold text-ink">New post</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/blogs"
              target="_blank"
              className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
            >
              View blog ↗
            </Link>
            <SignOutButton />
          </div>
        </div>

        <BlogForm />
      </div>
    </div>
  );
}
