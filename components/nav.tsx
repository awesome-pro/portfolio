import Link from "next/link";
import BookCallButton from "@/components/book-call-button";
import Logo from "@/components/logo";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <Link
            href="/blogs"
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Blogs
          </Link>
          <BookCallButton variant="primary" />
        </div>
      </div>
    </header>
  );
}
