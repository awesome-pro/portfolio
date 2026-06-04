import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { getAllProjects } from "@/lib/projects";
import { Chip } from "@/components/projects/shared";

const url = "https://abhinandan.one/projects";

export const metadata: Metadata = {
  title: "Projects — Agentic AI & LLM Systems | Abhinandan",
  description:
    "Open-source projects in agentic AI and LLM engineering: reinforcement learning for reasoning agents, guardrail runtimes, semantic caching, orchestration, and evaluation tooling.",
  keywords: [
    "agentic AI projects",
    "LLM open source",
    "multi-agent systems",
    "reinforcement learning agents",
    "AI engineering portfolio",
  ],
  openGraph: {
    title: "Projects — Agentic AI & LLM Systems",
    description:
      "Open-source projects in agentic AI and LLM engineering: RL for reasoning agents, guardrail runtimes, semantic caching, orchestration, and eval tooling.",
    url,
    type: "website",
  },
  alternates: { canonical: url },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Projects",
  description:
    "Open-source projects in agentic AI and LLM engineering by Abhinandan.",
  url,
  hasPart: getAllProjects().map((p) => ({
    "@type": "SoftwareSourceCode",
    name: p.title,
    description: p.oneLiner,
    codeRepository: p.links.find((l) => l.label === "GitHub")?.url,
    programmingLanguage: p.programmingLanguage,
  })),
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Nav />

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
            Open source
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
            Projects
          </h1>
          <p className="text-ink-muted max-w-xl leading-relaxed">
            Things I&apos;ve built in agentic AI and LLM engineering — from
            reinforcement learning for reasoning agents to the production
            runtime, caching, and evaluation tooling that agents need to ship.
          </p>
        </div>

        <div className="flex flex-col">
          {projects.map((p, i) => {
            const inner = (
              <>
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-semibold text-ink group-hover:underline underline-offset-4 decoration-ink-faint">
                      {p.title}
                    </h2>
                    <span className="font-mono text-xs text-ink-faint">
                      · {p.tag}
                    </span>
                  </div>
                  {p.headlineStat && (
                    <span className="font-mono text-sm font-semibold text-ink">
                      {p.headlineStat.value}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-ink-muted mt-2 max-w-2xl">
                  {p.oneLiner}
                </p>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 5).map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                  {p.hasPage ? (
                    <span className="font-mono text-xs text-ink ml-auto">
                      Read the case study →
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-ink-faint ml-auto">
                      View on GitHub ↗
                    </span>
                  )}
                </div>
              </>
            );

            const className = `group block py-6 ${
              i !== 0 ? "border-t border-border" : ""
            }`;

            return p.hasPage ? (
              <Link key={p.slug} href={`/projects/${p.slug}`} className={className}>
                {inner}
              </Link>
            ) : (
              <a
                key={p.slug}
                href={p.links.find((l) => l.label === "GitHub")?.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
