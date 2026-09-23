import Link from "next/link";
import AgentUrl from "@/components/agent-url";

const LINKS = [
  { label: "x", href: "https://x.com/abhibuilds" },
  { label: "email", href: "mailto:abhinandan@abhinandan.one" },
  { label: "github", href: "https://github.com/awesome-pro" },
  { label: "youtube", href: "https://youtube.com/@0xAbhinandan" },
];

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-20 pb-16 sm:pt-24">
  
      <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
        Abhinandan
      </h1>

      <p className="mt-7 text-base leading-relaxed text-ink-muted">
        I do <strong>RL post-training</strong> on reasoning models, & build
        the <strong>inference systems</strong> that serve them.
      </p>
      <p className="mt-7 text-base leading-relaxed text-ink-muted">i like working when the world is sleeping. my work cycle is generally 12pm to 4am. And I usually write my thoughts in my <Link className="hover:text-white underline" href={'/artifacts'}>artifacts</Link> .</p>
      <p className="mt-7 text-base leading-relaxed text-ink-muted">
        The part I live is generally after the launch day. When the reasoning
        breaks, when the cost skyrockets, when the first traffic hits - all the similar thrills :)
      </p>

      <nav
        aria-label="Elsewhere"
        className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs"
      >
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            {link.label}
            <AgentUrl url={link.href} />
          </a>
        ))}

        <Link
          href="/resume.pdf"
          className="group inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink focus-visible:text-ink"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
          />
          resume
          <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]">
            <span className="overflow-hidden">
              <span className="ml-1.5 inline-block whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-ink-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                can join immediately
              </span>
            </span>
          </span>
          <AgentUrl url="https://abhinandan.one/resume.pdf" />
        </Link>
      </nav>
    </section>
  );
}
