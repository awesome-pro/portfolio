import Link from "next/link";
import VisitorCounter from "@/components/visitor-counter";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        {/* Left */}
        <div>
          <p className="text-sm font-semibold text-ink">Abhinandan © 2026</p>
          <div className="mt-1.5">
            <VisitorCounter />
          </div>
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
            <Link
              href="/resume"
              className="hover:text-ink transition-colors"
            >
              Resume
            </Link>
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
              href="https://youtube.com/@0xAbhinandan"
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
