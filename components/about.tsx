const STATS = [
  { value: "3", label: "AI products shipped to production" },
  { value: "4", label: "agents in a single pipeline" },
  { value: "700K+", label: "LLM calls monitored in production" },
];

export default function About() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        Building at the edge with <span className="text-primary">Artificial Intelligence</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
        {/* Prose */}
        <div className="flex flex-col gap-5 text-base leading-relaxed text-ink-muted">
          <p>
            I join the teams early, when the team is still figuring out the process, the architecture, and whether the whole thing would actually work. So I don't just write code. I make product and engineering calls that have to hold up later.
          </p>
          <p>
            Most of my work sits between language models and real software: understanding where model reasoning breaks, building systems that fail safely when it does, and shipping things that still work when users hit them in messy ways.
          </p>
          <p>
            I care a lot about the boring parts: latency, error surfaces, cost, retries, observability, and all the small details that never show up in a demo but decide whether the product actually survives in production.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-8">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-3xl font-bold text-ink">
                {stat.value}
              </p>
              <p className="text-sm text-ink-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
