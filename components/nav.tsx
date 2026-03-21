import BookCallButton from "@/components/book-call-button";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Abhinandan</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/awesome-v0"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block text-xs text-ink-muted hover:text-ink transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/abhinandan-ver"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block text-xs text-ink-muted hover:text-ink transition-colors"
          >
            LinkedIn
          </a>
          <BookCallButton variant="primary" />
        </div>
      </div>
    </header>
  );
}
