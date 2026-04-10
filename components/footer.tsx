export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left */}
        <div>
          <p className="text-sm font-semibold text-ink">Abhinandan © 2026</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Agentic AI Engineer
          </p>
        </div>

       

        {/* Right */}
        <div className="text-xs text-ink-muted flex flex-col gap-1 sm:text-right">
          <div className="flex gap-3 sm:justify-end">
            <a
              href="mailto:abhinandan@abhinandan.one"
              className="hover:text-ink transition-colors"
            >
              Mail
            </a>
            <a
              href="https://abhinandan.one/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              Resume
            </a>
            <a
              href="https://github.com/awesome-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/abhibuilds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/abhibuilds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
             X
            </a>
            <a
              href="https://youtube.com/@abhinandan_builds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
             YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
