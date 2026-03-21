export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        {/* Left */}
        <div>
          <p className="text-sm font-semibold text-ink">Abhinandan</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Founding Software Engineer
          </p>
        </div>

        {/* Center */}
        <div className="text-center">
          <p className="text-sm text-ink-muted mb-2">
            Working on something interesting?
          </p>
          <a
            href="https://cal.com/awesome-v0/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Let&apos;s talk →
          </a>
        </div>

        {/* Right */}
        <div className="text-right text-xs text-ink-muted flex flex-col gap-1">
          <a
            href="mailto:abhinandan@abhinandan.one"
            className="hover:text-ink transition-colors"
          >
            abhinandan@abhinandan.one
          </a>
          <div className="flex gap-3 justify-end">
            <a
              href="https://github.com/awesome-v0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/abhinandan-ver"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              LinkedIn
            </a>
          </div>
          <p>© 2026</p>
        </div>
      </div>
    </footer>
  );
}
