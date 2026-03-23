interface Project {
  tag: string;
  title: string;
  description: string;
  stack: string[];
  link: string | null;
}

const PROJECTS: Project[] = [
  {
    tag: "Multi-Agent System",
    title: "Parallel Research Orchestrator",
    description:
      "Designed and shipped a multi-agent pipeline using Claude's API that decomposes complex research queries into parallel sub-agents, reconciles conflicting outputs, and synthesizes a grounded response. Reduced end-to-end latency by [X]% vs. sequential chains.",
    stack: ["TypeScript", "Claude API", "Node.js"],
    link: "[PROJECT_LINK_PLACEHOLDER]",
  },
  {
    tag: "LLM Observability",
    title: "Multi-LLM Monitoring Dashboard",
    description:
      "Built production observability for a system routing prompts across GPT-4, Claude, and Gemini. Tracks latency p50/p95, cost-per-token, error rates, and semantic drift — powers real-time routing decisions.",
    stack: ["Python", "Flask", "GCP", "PostgreSQL"],
    link: "[PROJECT_LINK_PLACEHOLDER]",
  },
  {
    tag: "Inference Engineering",
    title: "Low-Latency Inference Layer",
    description:
      "Architected a caching and batching layer in front of foundation model endpoints. Achieved [X]ms median cold-start and [X]% cache hit rate in production, cutting inference costs by ~[X]%.",
    stack: ["Python", "Docker", "Redis", "AWS"],
    link: "[PROJECT_LINK_PLACEHOLDER]",
  },
  {
    tag: "Full-Stack AI Product",
    title: "NewTools",
    description:
      "Built a free, privacy-focused browser utility platform from scratch. Features AI-powered PDF-to-CSV extraction (Claude API with SSE streaming), a shared daily credit system, Supabase auth, and a suite of client-side tools — all with zero data sent to the server.",
    stack: ["Next.js", "TypeScript", "FastAPI", "Claude API", "Supabase"],
    link: "https://newtools.space",
  },
];

export default function Projects() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        Work
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        Things I&apos;ve built
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {PROJECTS.map((project) => (
          <div
            key={project.title}
            className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-ink-muted transition-colors"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-faint mb-2">
                {project.tag}
              </p>
              <h3 className="text-lg font-semibold text-ink leading-snug">
                {project.title}
              </h3>
            </div>

            <p className="text-sm leading-relaxed text-ink-muted flex-1">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-xs px-2.5 py-1 rounded-full bg-background border border-border text-ink-muted"
                >
                  {tech}
                </span>
              ))}
            </div>

            {project.link && project.link !== "[PROJECT_LINK_PLACEHOLDER]" && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors self-start"
              >
                View ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
