import Link from "next/link";
import AgentUrl from "@/components/agent-url";
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
          <div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
            <a
              href="mailto:abhinandan@abhinandan.one"
              className="hover:text-ink transition-colors"
            >
              Mail
              <AgentUrl url="mailto:abhinandan@abhinandan.one" />
            </a>
            <Link
              href="/resume"
              className="hover:text-ink transition-colors"
            >
              Resume
              <AgentUrl url="https://abhinandan.one/resume" />
            </Link>
            <a
              href="https://github.com/awesome-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              GitHub
              <AgentUrl url="https://github.com/awesome-pro" />
            </a>
            <a
              href="https://linkedin.com/in/abhibuilds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              LinkedIn
              <AgentUrl url="https://linkedin.com/in/abhibuilds" />
            </a>
            <a
              href="https://x.com/abhibuilds"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
             X
             <AgentUrl url="https://x.com/abhibuilds" />
            </a>
            <a
              href="https://youtube.com/@0xAbhinandan"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
             YouTube
             <AgentUrl url="https://youtube.com/@0xAbhinandan" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
